/* Maison Ouvrage · branchement Supabase de la version publique du site
   Reproduit l'interface window.claude.use('db' | 'user' | 'assets') utilisée par le site,
   pour que l'espace client, l'espace partenaire et l'atelier fonctionnent hors de Claude */
(function () {
  var CFG = window.MO_SUPABASE || {};
  if (
    window.claude ||
    !window.supabase ||
    !/^https:\/\/.+\.supabase\.co$/.test(CFG.url || "") ||
    !CFG.key
  )
    return;
  var hadToken = /access_token=|error_description=/.test(location.hash);
  var sb = window.supabase.createClient(CFG.url, CFG.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
      storageKey: "mo-auth",
    },
  });
  var sess = null;
  var ready = sb.auth
    .getSession()
    .then(function (r) {
      sess = (r && r.data && r.data.session) || null;
    })
    .catch(function () {});
  sb.auth.onAuthStateChange(function (ev, s) {
    sess = s || null;
  });
  ready.then(function () {
    if (hadToken) {
      estAdmin().then(function (a) {
        setTimeout(function () {
          location.hash = a ? "admin" : "espace";
        }, 30);
      });
    }
  });

  function anon(s) {
    return !s || !s.user || s.user.is_anonymous === true;
  }
  function reel() {
    return !anon(sess);
  }
  async function assure() {
    await ready;
    if (sess) return sess;
    var r = await sb.auth.signInAnonymously();
    if (r.error) return null;
    sess = r.data.session;
    return sess;
  }

  /* écouteurs : relecture toutes les 20 s et après chaque écriture */
  var ecoute = new Set();
  function prevenir() {
    ecoute.forEach(function (f) {
      try {
        f();
      } catch (e) {}
    });
  }
  setInterval(function () {
    if (!document.hidden) prevenir();
  }, 20000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) prevenir();
  });

  function cle(v) {
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(Math.random());
    }
  }
  function instDoc(id, row) {
    return {
      id: id,
      exists: !!row,
      data: function () {
        return row ? row.data : undefined;
      },
    };
  }

  function doc(path) {
    var p = String(path).split("/"),
      col = p[0],
      id = p.slice(1).join("/");
    var d = {
      id: id,
      get: async function () {
        var r = await sb
          .from("docs")
          .select("data")
          .eq("col", col)
          .eq("id", id)
          .maybeSingle();
        if (r.error) throw r.error;
        return instDoc(id, r.data);
      },
      set: async function (v) {
        var r = await sb
          .from("docs")
          .upsert(
            { col: col, id: id, data: v || {} },
            { onConflict: "col,id" },
          );
        if (r.error) throw r.error;
        prevenir();
      },
      update: async function (v) {
        var cur = await d.get();
        await d.set(Object.assign({}, cur.exists ? cur.data() : {}, v || {}));
      },
      delete: async function () {
        var r = await sb.from("docs").delete().eq("col", col).eq("id", id);
        if (r.error) throw r.error;
        prevenir();
      },
      onSnapshot: function (fn, err) {
        var der = null,
          actif = true;
        var run = async function () {
          if (!actif) return;
          try {
            var s = await d.get();
            var k = cle(s.exists ? s.data() : null);
            if (k !== der) {
              der = k;
              fn(s);
            }
          } catch (e) {
            if (err) err(e);
          }
        };
        run();
        ecoute.add(run);
        return function () {
          actif = false;
          ecoute.delete(run);
        };
      },
    };
    return d;
  }

  function coll(col, ord, lim) {
    var q = {
      orderBy: function (f, dir) {
        return coll(col, [f, dir || "asc"], lim);
      },
      limit: function (n) {
        return coll(col, ord, n);
      },
      doc: function (id) {
        return doc(col + "/" + id);
      },
      get: async function () {
        var r = sb.from("docs").select("id,data").eq("col", col);
        r = r.order("updated_at", { ascending: false }).limit(lim || 1000);
        var res = await r;
        if (res.error) throw res.error;
        var rows = res.data || [];
        if (ord)
          rows.sort(function (a, b) {
            var x = (a.data || {})[ord[0]],
              y = (b.data || {})[ord[0]];
            x = x == null ? "" : x;
            y = y == null ? "" : y;
            return (x < y ? -1 : x > y ? 1 : 0) * (ord[1] === "desc" ? -1 : 1);
          });
        var docs = rows.map(function (x) {
          return instDoc(x.id, x);
        });
        return {
          docs: docs,
          size: docs.length,
          empty: !docs.length,
          forEach: function (f) {
            docs.forEach(f);
          },
        };
      },
      onSnapshot: function (fn, err) {
        var der = null,
          actif = true;
        var run = async function () {
          if (!actif) return;
          try {
            var s = await q.get();
            var k = cle(
              s.docs.map(function (x) {
                return [x.id, x.data()];
              }),
            );
            if (k !== der) {
              der = k;
              fn(s);
            }
          } catch (e) {
            if (err) err(e);
          }
        };
        run();
        ecoute.add(run);
        return function () {
          actif = false;
          ecoute.delete(run);
        };
      },
    };
    return q;
  }

  var DB = {
    doc: doc,
    collection: function (c) {
      return coll(c);
    },
  };
  var adminP = null;
  function estAdmin() {
    if (!reel()) return Promise.resolve(false);
    if (!adminP)
      adminP = sb
        .rpc("is_admin")
        .then(function (r) {
          return !!(r && r.data);
        })
        .catch(function () {
          return false;
        });
    return adminP;
  }
  var USER = {
    id: async function () {
      var s = await assure();
      return s ? s.user.id : null;
    },
    me: async function () {
      var u = sess && sess.user;
      var m = (u && u.user_metadata) || {};
      return {
        id: u ? u.id : "",
        name: m.full_name || m.name || (u && u.email) || "",
      };
    },
    canEdit: estAdmin,
    isOwner: estAdmin,
    can: async function () {
      return true;
    },
    profiles: async function () {
      return {};
    },
  };
  var ASSETS = {
    upload: async function (f) {
      var s = await assure();
      if (!s) throw { code: "not_granted" };
      var id = crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2);
      var chemin =
        s.user.id +
        "/" +
        id +
        "-" +
        String(f.name || "fichier").replace(/[^\w.-]+/g, "_");
      var r = await sb.storage
        .from("fichiers")
        .upload(chemin, f, { contentType: f.type || undefined, upsert: false });
      if (r.error) throw r.error;
      var u = sb.storage.from("fichiers").getPublicUrl(chemin);
      return {
        id: id,
        url: u.data.publicUrl,
        sizeBytes: f.size,
        contentType: f.type,
      };
    },
  };

  window.claude = {
    use: async function (n) {
      if (n === "db") return (await assure()) ? DB : null;
      if (n === "user") return (await assure()) ? USER : null;
      if (n === "assets") {
        await ready;
        return reel() ? ASSETS : null;
      }
      return null;
    },
  };

  /* connexion par lien envoyé par e-mail */
  async function lien(mail) {
    var r = await sb.auth.signInWithOtp({
      email: mail,
      options: {
        emailRedirectTo: location.origin + location.pathname,
        shouldCreateUser: true,
      },
    });
    return r.error ? r.error.message : "";
  }
  async function quitter() {
    try {
      await sb.auth.signOut();
    } catch (e) {}
    try {
      localStorage.removeItem("mo-auth");
    } catch (e) {}
    location.hash = "accueil";
    location.reload();
  }
  window.MO_SB = {
    admin: estAdmin,
    sb: sb,
    ready: ready,
    reel: reel,
    lien: lien,
    quitter: quitter,
    email: function () {
      return sess && sess.user ? sess.user.email || "" : "";
    },
  };
})();
