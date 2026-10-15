# Orientation fonction publique (POC)

Prototype d'application mobile pour orienter les jeunes, et leurs parents, vers les métiers et les concours de la fonction publique.

HTML, CSS et JavaScript, sans dépendance ni build.

## Lancer

Ouvrir `index.html` dans un navigateur, ou servir le dossier :

```bash
python3 -m http.server 8000
```

puis aller sur http://localhost:8000.

## Parcours

1. **Introduction en 3 écrans** : accueil Y-Seck, les 3 fonctions publiques (État, territoriale, hospitalière), les 4 catégories (A+, A, B, C). Puis **onboarding en 4 étapes**
   - Profil (étudiant·e, parent, reconversion) et niveau d'étude. Pour un parent : « le niveau d'étude de votre enfant ».
   - Domaines d'intérêt, en choix illimités.
   - Façon de travailler : 35 traits en 5 groupes (avec qui, où, comment, ce qui plaît, caractère), en choix illimités.
   - Bourse et budget, avec un encadré qui explique ce qu'est une Prépa Talents.
2. **Tableau de bord** : métiers classés selon les domaines et les traits, concours accessibles selon le niveau, aides.
3. **Métiers** (65, sur les 3 versants) : les domaines choisis sont présélectionnés et filtrent la liste. On peut en ajouter, en retirer, ou tout afficher. Filtres A+, A, B, C et État, territoriale, hospitalière. Chaque métier indique si le niveau requis est atteint et les traits qui correspondent.
4. **Fiche métier** : accès étape par étape. L'étape du concours a un lien « Prochaines dates » vers le calendrier officiel, et la fiche renvoie aux Prépas Talents qui préparent ce concours.
5. **Concours** : 4 catégories (A+, A, B, C). Un clic déplie la catégorie : métiers concernés et lieux des épreuves par versant, en métropole et en outre-mer.
6. **Calendrier** : prochaines clôtures d'inscription, filtrables par catégorie.
7. **Études** : parcours conseillés (administratif, technique, social, dès le brevet).
8. **Sans concours** : contractuel·le, PACTE, apprentissage, recrutement sans concours.
9. **Prépas**, chaque type cliquable :
   - Prépas Talents : les 106 prépas, filtrées selon les concours des métiers choisis et par région, outre-mer compris.
   - IPAG et CPAG : les 27 instituts, par région, plus la formation à distance.
   - IEP et masters d'administration publique, métropole et outre-mer.
   - Préparations privées, liste non exhaustive.

## À venir

- « Je me prépare » : annales, rapports de jury, conseils de méthode, ressources gratuites.
- « Mon parcours » : métiers favoris, échéances, prochaines étapes.
- « Mes opportunités » : offres de choisirleservicepublic.gouv.fr (jeu de données data.gouv.fr), stages et apprentissages par territoire.
- Import complet du répertoire des métiers de la fonction publique (RMFP, 1 069 métiers), du répertoire territorial (CNFPT) et du répertoire santé.

## Accessibilité (RGAA)

- Lien d'évitement, titre de page et `h1` à chaque écran, focus placé sur le titre à chaque changement d'écran.
- Focus conservé après chaque choix, navigation complète au clavier.
- États annoncés : `aria-pressed`, interrupteur `role="switch"`, nombre de résultats des filtres dans une zone `role="status"`.
- Contrastes d'au moins 4,5:1, cibles d'au moins 44 px, liens externes signalés « nouvelle fenêtre ».
- Aucune violation détectée par axe-core (WCAG 2.1 A et AA) sur les 21 écrans.
- Déclaration d'accessibilité dans l'app (Profil › Accessibilité). Statut : partiellement conforme, en attendant un audit RGAA complet.

## Données personnelles (RGPD)

- Aucun compte, aucun nom ni e-mail demandé, aucun cookie, aucune mesure d'audience.
- Les réponses restent dans le `localStorage` du navigateur. Le bouton « Effacer mes données » les supprime.
- Police DM Sans hébergée dans le dépôt : aucune requête vers Google Fonts ni vers un autre service tiers.
- Pages Données personnelles et Mentions légales dans l'app.

**À compléter avant diffusion** : éditeur, adresse, contact et directeur·rice de la publication, dans `js/data.js` (`legal`).

## Structure

```
index.html
css/style.css
fonts/       DM Sans (licence OFL)
js/data.js   données et mentions légales
js/app.js    état, routeur (#/ecran) et écrans
```

## Direction artistique

DM Sans, bleu #000091, traits fins de 1 px, pilules arrondies. Pastilles de catégorie : A menthe, B cyan, C jaune.
