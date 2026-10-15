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

1. **Onboarding en 3 étapes**
   - Profil (étudiant·e, parent, reconversion) et niveau d'étude. Le niveau n'apparaît qu'après le choix du profil, et devient « le niveau d'étude de votre enfant » pour un parent.
   - Domaines d'intérêt, en choix illimités.
   - Bourse et budget.
2. **Tableau de bord** : métiers qui correspondent, concours accessibles selon le niveau, aides.
3. **Métiers** : recherche, filtres par domaine et par catégorie, fiche métier avec accès et évolution.
4. **Concours** : catégories A, B, C (dont le brevet pour certains concours C) et conditions communes.
5. **Calendrier** : prochaines clôtures d'inscription, filtrables par catégorie.
6. **Études** : parcours conseillés (administratif, technique, social, dès le brevet).
7. **Sans concours** : contractuel·le, PACTE, apprentissage, catégorie C sans concours.
8. **Prépas** : filtre par budget, mise en avant des Prépas Talents pour les boursier·es, bourse Talents.

Les choix sont gardés dans le navigateur (`localStorage`). L'onglet Profil permet de les modifier.

## Données

Toutes les données sont dans `js/data.js`. Ce sont des données de démonstration, à brancher sur des sources maintenues :

- Calendrier : [calendrier général des concours](https://www.fonction-publique.gouv.fr/devenir-agent-public/calendrier-general-concours) (fonction publique d'État uniquement, consulté le 15/10/2026).
- Bourse Talents : 5 000 € par an en 2026-2027 ([fonction-publique.gouv.fr](https://www.fonction-publique.gouv.fr/toutes-les-actualites/bourses-talents-5-000-euros-par-pour-les-eleves-des-prepas-talents)).
- Carte des Prépas Talents : [fonction-publique.gouv.fr](https://www.fonction-publique.gouv.fr/devenir-agent-public/les-prepas-talents-pres-de-chez-vous).

À compléter : fonctions publiques territoriale et hospitalière dans le calendrier, salaires de départ, fiches métiers complètes.

## Accessibilité (RGAA)

- Lien d'évitement, titre de page et `h1` à chaque écran, focus placé sur le titre à chaque changement d'écran.
- Focus conservé après chaque choix, navigation complète au clavier.
- États annoncés : `aria-pressed`, interrupteur `role="switch"`, nombre de résultats des filtres dans une zone `role="status"`.
- Contrastes d'au moins 4,5:1, cibles d'au moins 44 px, liens externes signalés « nouvelle fenêtre ».
- Aucune violation détectée par axe-core (WCAG 2.1 A et AA) sur les 15 écrans.
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
