# Maquettes

Ces images sont des **maquettes de planification**, pas l'application réelle. Elles ont été générées par du code (SVG, HTML, Playwright) dans une session Claude.

## themes/

| Fichier | Contenu |
| --- | --- |
| 01-themes-telephone.png | Les 6 thèmes sur l'écran Today actuel + la version « objectifs d'abord » |
| 02-ordinateur-washi.png, 03-ordinateur-sumi.png | Mise en page bureau actuelle avec les thèmes Washi et Sumi |
| 04-centre-de-commande.png | Fil de fer du « centre de commande » bureau (inspiré de WaniKani et Bunpro) |
| 05-personnalisation-ordinateur.png | Mode personnalisation : rangées, proportions, variantes, palettes, catalogue |
| 06-telephone-et-gadgets-supporters.png | Téléphone normal et en édition + gadgets réservés aux supporters |

Retour de l'utilisateur : le style Washi / fil de fer est **trop épuré**. Garder l'arbre fleuri et l'icône fleur de cerisier.

## compagnons/

| Fichier | Contenu |
| --- | --- |
| 01-trois-styles.png | Comparaison plat / pixel / ukiyo-e (historique) |
| 02-galerie-style-plat.png, 03-model-sheet-shiba.png | Première version en style plat (historique) |
| **04-galerie-pixel-art.png** | **Direction retenue** : 10 compagnons en pixel art, contours noirs, plus mignons |
| **05-choix-du-compagnon.png** | Écran de départ (choix entre 3) |
| **06-jardin-pixel.png** | Jardin complet en pixel art |
| **07-anim-attente-pixel.gif** | Animation d'attente (respiration, clignement, queue, patte) |
| **08-anim-jardin-pixel.gif** | Le jardin grandit (séries, étapes, saisons) |
| 09-anim-tanuki-furtif.gif | Tanuki furtif sur Today (encore en style plat, à convertir en pixel art) |
| 10-anim-attente-plat.gif | Animation d'attente en style plat (historique) |

## source/

- `chars.js` : générateur SVG des 10 compagnons (options `cute`, `view`, `expr`, `style`, animation) et des décors (arbre, lanterne, torii, étang, maison).
- `studio.html` : planches (`?board=lineup|sheet|styles|pixellineup|starter|pixelscene`) et images d'animation (`idle|peek|garden|pixelidle|pixelgarden&t=0..1`). Il convertit en pixel art (palette limitée, contour noir).
- `render.mjs`, `render2.mjs` : captures Playwright des planches et des images d'animation (servir le dossier sur `localhost:8766`). Les GIF sont assemblés avec Pillow.
- `wire-desktop.html`, `customize-desktop.html`, `phone-and-gadgets.html` : fils de fer statiques.
- `shots.mjs` + `themes-body.mjs` : captures des thèmes de l'app (concaténer l'en-tête de `shots.mjs`, jusqu'à `const m = await page(`, avec `themes-body.mjs`).
- `app-test.mjs`, `sync-test.mjs` : tests Playwright de l'app (fausse API WaniKani, deux appareils + faux Gist).
- `build_manual.py` : génère `docs/Benkyo-User-Manual.pdf` (ReportLab, EB Garamond converti depuis `@fontsource/eb-garamond`, captures).

Les chemins `/tmp/...` et `/opt/...` dans ces scripts viennent de l'environnement cloud de Claude : adapte-les si tu les relances ailleurs.
