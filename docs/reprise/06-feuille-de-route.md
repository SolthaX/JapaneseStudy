# 06 — Feuille de route et questions ouvertes

## Étape actuelle

**En attente du retour détaillé de l'utilisateur sur les visuels**, qu'il a annoncé. Ne rien coder de la refonte avant.

## Phases proposées (à confirmer avec l'utilisateur)

1. **Corrections rapides (web)**
   - contrastes AA, tailles de texte ≥ 13 px, cibles tactiles de 44 px ;
   - bugs : pétale sur le salut, « ワニカニ » coupé, objectifs barrés, boutons « Open » répétés ;
   - système de thèmes (Sakura accessible, Washi, Sumi, Ai, Matcha), en gardant l'arbre fleuri et l'icône ;
   - icônes linéaires, onglets fixes ;
   - japonais dans les titres uniquement ;
   - jours de repos dans la série ;
   - Today compacte, objectifs d'abord.
2. **Tableau de bord personnalisable** : rangées, proportions, variantes, palettes, mode édition, disposition téléphone et disposition ordinateur séparées.
3. **Compagnons et jardin (pixel art)**
   - sprites définitifs et feuilles d'animation ;
   - onglet Jardin, pièces d'étude, déblocages, saisons ;
   - compagnon furtif sur Today ;
   - widget compagnon (dashboard et Scriptable).
4. **Supporters (web)** : lien Ko-fi ou GitHub Sponsors, bouton honnête, gadgets cosmétiques.
5. **Distribution gratuite** : page d'installation qui s'adapte à l'appareil, Microsoft Store via PWABuilder, Google Play (25 $) en option.
6. **Généralisation** : packs de manuels et d'outils, configuration de départ guidée.
7. **App native** (SwiftUI ou Capacitor, à décider), autorisations obtenues, App Store.

## Questions ouvertes

- Retour détaillé sur les visuels : niveau d'épure, couleurs, ce qui plaît ou non dans les maquettes.
- Validation des sprites pixel art (galerie 04) et du principe de retouche pixel par pixel.
- Conditions de déblocage exactes et prix des objets du jardin.
- Les 2 compagnons accessibles juste après le départ.
- Obsidian : ajouter l'envoi vers la note quotidienne et/ou le script de synchronisation automatique ?
- Choix technique pour l'app native (SwiftUI ou Capacitor) et calendrier.
- Plateforme de dons : Ko-fi ou GitHub Sponsors.

## Ménage à faire (par l'utilisateur, sur GitHub)

- Supprimer la branche temporaire **`claude/nhk-probe`** (onglet *Branches*). Claude ne peut pas supprimer de branche distante depuis son environnement.

## Conseils pour la prochaine session Claude

- Lire les fiches 01 à 05 avant d'agir.
- Pour tester l'app : `python3 -m http.server 8765` à la racine, puis les scripts Playwright de `docs/maquettes/source/`.
- Pour lire un site bloqué par le proxy (NHK, YouTube, forum WaniKani) : workflow GitHub Actions sur une branche temporaire, puis lecture des logs avec les outils GitHub.
- Incrémenter `CACHE` dans `sw.js` à chaque changement de fichiers de l'app.
- Préférences : français, QCM fréquents, demander avant de créer un artefact, maquettes visuelles avant le code.
