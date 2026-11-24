# Site Maison Ouvrage · version à héberger

Site statique, prêt pour GitHub Pages (ou tout hébergeur : OVH, Netlify, o2switch…)

## Contenu
- index.html : le site complet
- img/, plans/, fonts/ : images 3D, plans et polices
- .nojekyll : indique à GitHub de servir les fichiers tels quels
- robots.txt : autorise le référencement

## Mise en ligne sur GitHub Pages
1. Créer un compte sur github.com, puis un dépôt public nommé par exemple « maison-ouvrage »
2. Dans le dépôt : « Add file » › « Upload files », glisser TOUT le contenu de ce dossier (pas le dossier lui-même), puis « Commit changes »
3. « Settings » › « Pages » › Source : « Deploy from a branch », branche « main », dossier « / (root) » › « Save »
4. Après une à deux minutes, le site est en ligne à l'adresse https://VOTRE-IDENTIFIANT.github.io/maison-ouvrage/

## Nom de domaine (facultatif, ex. maisonouvrage.fr)
- Acheter le domaine chez un registraire (OVH, Gandi…)
- « Settings » › « Pages » › « Custom domain » : saisir le domaine
- Chez le registraire, créer les enregistrements DNS indiqués par GitHub, puis cocher « Enforce HTTPS »

## Ce qui change par rapport à la version Claude
- Les demandes du formulaire de contact arrivent par e-mail (récapitulatif à copier et bouton « Écrire un e-mail ») et non plus dans l'atelier
- L'espace client et l'atelier restent dans la version Claude : les liens « Mon espace » sont masqués ici
- L'assistant « Une question ? » répond avec ses réponses préenregistrées
- Le journal ne se met à jour que lorsqu'une nouvelle version de ce dossier est déposée

## Espace client, espace partenaire et atelier (Supabase)
Le site se branche sur une base Supabase pour que clients et partenaires se connectent par un lien reçu par e-mail
1. Créer le projet Supabase (région West EU · Paris)
2. SQL Editor › New query : coller 1-schema.sql › Run, puis 2-donnees.sql › Run
3. Authentication › Sign In / Providers : activer « Allow anonymous sign-ins » (pour enregistrer les demandes du formulaire de contact) et laisser « Email » activé
4. Authentication › URL Configuration : « Site URL » = l'adresse du site (ex. https://VOTRE-IDENTIFIANT.github.io/maison-ouvrage/), et l'ajouter aussi dans « Redirect URLs »
5. Renseigner js/config.js avec l'URL du projet et la clé « anon / publishable » (jamais la clé service_role)
Tant que js/config.js est vide, le site fonctionne sans espace (liens masqués)
