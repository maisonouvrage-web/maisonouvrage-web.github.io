/* Maison Ouvrage · écran de connexion de l'espace client et partenaire (version publique) */
(function () {
  if (!window.MO_SB || typeof espBoot !== "function") return;
  var S = window.MO_SB;
  function e(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function carte(msg, mail) {
    var box = document.getElementById("esp");
    if (!box) return;
    box.innerHTML =
      '<div class="espPl idf"><div class="cote" aria-hidden="true"><span>Identification</span></div>' +
      '<div class="idfG"><div class="idfL"><span class="k">Accéder à mon espace</span><h2 class="h-l">Identifiez-vous <span class="it">en un geste</span></h2>' +
      '<ol class="idfS"><li><b>Saisissez votre adresse e-mail</b><span>celle que vous avez communiquée à la Maison</span></li><li><b>Ouvrez le lien reçu</b><span>valable une heure, sans mot de passe à retenir</span></li><li><b>Votre espace s\'ouvre</b><span>client ou partenaire, sur cet appareil</span></li></ol>' +
      '<form id="moLog" class="moLog" novalidate><div class="fld"><label for="moMail">Votre adresse e-mail</label><input id="moMail" type="email" autocomplete="email" required value="' +
      e(mail || "") +
      '" placeholder="prenom@exemple.fr"></div>' +
      '<div class="btns"><button type="submit" class="btn plein" id="moGo">Recevoir mon lien de connexion</button></div><p class="muted petit" id="moMsg" aria-live="polite">' +
      (msg || "") +
      "</p></form></div>" +
      '<div class="idfR">' +
      (typeof espAvantages === "function" ? espAvantages() : "") +
      '<div class="btns"><a class="btn" href="mailto:maisonouvrage@gmail.com">Besoin d\'aide · nous écrire</a></div></div></div></div>';
    var f = document.getElementById("moLog");
    f.onsubmit = async function (ev) {
      ev.preventDefault();
      var m = document.getElementById("moMail").value.trim(),
        out = document.getElementById("moMsg"),
        b = document.getElementById("moGo");
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(m)) {
        out.textContent = "Vérifiez l'adresse e-mail saisie";
        return;
      }
      b.disabled = true;
      out.textContent = "Envoi du lien…";
      var err = await S.lien(m);
      b.disabled = false;
      out.innerHTML = err
        ? 'Le lien n\'a pas pu être envoyé · réessayez dans quelques minutes ou écrivez à <a href="mailto:maisonouvrage@gmail.com">maisonouvrage@gmail.com</a>'
        : "Un lien de connexion vient de vous être envoyé à <b>" +
          e(m) +
          "</b> · ouvrez-le depuis cet appareil";
    };
  }
  var boot0 = espBoot;
  espBoot = async function () {
    await S.ready;
    if (!S.reel()) {
      carte();
      var a = document.getElementById("admOffT");
      if (a)
        a.textContent =
          "Connectez-vous avec l'adresse de l'administration pour ouvrir le tableau de bord";
      return;
    }
    pastille();
    try { await S.sb.rpc("rattacher"); } catch (e) {}
    return boot0.apply(this, arguments);
  };
  function pastille() {
    if (document.getElementById("moOut")) return;
    var d = document.createElement("div");
    d.id = "moOut";
    d.className = "moOut";
    d.innerHTML =
      "<span>" + e(S.email()) + "</span>" +
      '<a class="moAt" href="#admin" hidden>Mon atelier</a>' +
      '<a class="moEs" href="#espace">Mon espace</a>' +
      '<button type="button">Se déconnecter</button>';
    d.querySelector("button").onclick = S.quitter;
    document.body.appendChild(d);
    var adm = false;
    var maj = function () {
      var h = (location.hash || "").replace("#", "");
      var at = d.querySelector(".moAt"), es = d.querySelector(".moEs");
      at.hidden = !adm || h.indexOf("admin") === 0;
      es.hidden = h.indexOf("espace") === 0 || (adm && h.indexOf("admin") !== 0 && false);
    };
    S.admin().then(function (a) { adm = !!a; maj(); });
    maj();
    addEventListener("hashchange", maj);
  }
  S.ready.then(function () { if (S.reel()) pastille(); });
  var st = document.createElement("style");
  st.textContent =
    ".moLog{margin-top:22px;max-width:420px}.moLog .fld{display:flex;flex-direction:column;gap:6px}.moLog input{font:inherit;padding:12px 14px;border:1px solid var(--fil,#d9cfc3);border-radius:10px;background:#fff}.moOut{position:fixed;left:16px;bottom:16px;z-index:60;display:flex;gap:10px;align-items:center;background:#FBF8F3;border:1px solid #d9cfc3;border-radius:999px;padding:6px 8px 6px 14px;font-size:13px;color:#1C1613;box-shadow:0 6px 20px rgba(28,22,19,.08)}.moOut a{font-size:12px;color:#FBF8F3;background:#5E1522;border-radius:999px;padding:5px 12px;text-decoration:none}.moOut a[hidden]{display:none}.moOut button{font:inherit;font-size:12px;border:1px solid #5E1522;color:#5E1522;background:none;border-radius:999px;padding:5px 10px;cursor:pointer}.moOut[hidden]{display:none}@media(max-width:600px){.moOut span{display:none}}";
  document.head.appendChild(st);
})();
