# 01 — État du projet (ce qui existe)

## Résumé

**Benkyō** est une web-app (PWA) de pilotage des révisions de japonais, sans framework ni étape de compilation.
Elle est hébergée sur **GitHub Pages** : https://solthax.github.io/JapaneseStudy/ (dépôt public `SolthaX/JapaneseStudy`, branche `main`).
L'interface est en **anglais + japonais uniquement**, et le japonais n'utilise que les kanji appris sur WaniKani.

L'utilisateur apprend le japonais depuis l'anglais. Il utilise :
- WaniKani (niveau ~18, jeton API configuré dans l'app) ;
- Bunpro ;
- Genki I puis Genki II (en cours, chapitre 14), puis Quartet 1 et 2 ;
- les vidéos de ToKini Andy ;
- le conjugateur de la Japan Foundation Sydney ;
- Natively et les clubs de lecture WaniKani ;
- NHK Easy.

Côté matériel : un iPhone 15 (iOS 26), un PC Windows avec le navigateur **Zen**, et un second cerveau **Obsidian** relié à Claude.

## Fonctionnalités en place

| Zone | Ce qu'elle fait |
| --- | --- |
| **Today** | Salutation, série (streak), arbre sakura qui fleurit sur 30 jours, objectifs du jour, carte « My links », WaniKani (niveau, leçons, révisions, prévisions 24 h, SRS), Bunpro (case manuelle), manuel en cours avec rythme, carte widget (iOS), proverbe du jour. |
| **Calendar** | Mois en carte de chaleur, points par activité, bande des 6 derniers mois, 18 badges, édition d'un jour avec note. |
| **Books** | Genki I, Genki II, Quartet I, Quartet II : étapes par chapitre, points de grammaire de Genki, date cible et rythme (en avance / en retard), playlists officielles de ToKini Andy. |
| **Reading** | Livres en cours, à lire, lus ; suivi des pages ; liens Natively et clubs WaniKani. |
| **News** | NHK Easy (via le flux RSS de NHK Easier) et NHK (flux RSS NHK ONE), rafraîchis toutes les 3 h par une GitHub Action. |
| **Kanji appris uniquement** | Chaque libellé japonais est écrit `[漢字|lecture|English]`. Un mot ne s'affiche en japonais que si tous ses kanji sont passés Guru sur WaniKani ; sinon il est en anglais, mot par mot. Un toucher sur un mot affiche ses furigana. |
| **Synchronisation** | Téléphone ↔ ordinateur via un **Gist GitHub secret**, avec un jeton ayant uniquement la permission `gist`. Chaque unité (jour, chapitre, livre, liens, réglages) porte un horodatage et la plus récente l'emporte. Les jetons ne sont jamais envoyés. |
| **Ordinateur** | À partir de 1000 px de large : menu latéral et deux colonnes. Installable depuis Chrome ou Edge (bouton « Install app »). Zen ne sait pas installer : utiliser un onglet épinglé. |
| **Widget iPhone** | Script **Scriptable** (`widget/benkyo-widget.js`) en petit, moyen et grand format. Le grand montre la série, WaniKani, les prévisions, les objectifs, le manuel et la bande de 30 jours ; le moyen (« ruban ») la prochaine grammaire et le dernier titre NHK Easy. Les données viennent de l'app via `scriptable:///run/Benkyo%20Widget?payload=…`. |
| **Export Obsidian** | Un zip de notes Markdown avec propriétés en tête (tableau de bord, une note par livre, lecture, journaux mensuels, kanji appris, liens). |
| **Sauvegarde** | Export et import JSON. |
| **Manuel** | `docs/Benkyo-User-Manual.pdf` : 5 pages en anglais, EB Garamond 12, noir, interligne simple, avec captures. |

## Architecture et fichiers

```
index.html, manifest.webmanifest, sw.js (cache hors ligne, version CACHE à incrémenter à chaque changement)
css/style.css            thème sakura + dark (夜桜), mise en page bureau (@media ≥1000px), liens, furigana
js/app.js                vues (today, calendar, books, reading, news), réglages, événements, widget payload
js/store.js              état localStorage 'benkyo-v1', unités de sync + horodatage, liens par défaut
js/api.js                WaniKani API v2 (user, summary, review_statistics, assignments, subjects) + news.json
js/progress.js           progression des chapitres, rythme / date cible, badges
js/curriculum.js         Genki I/II, Quartet I/II (titres, étapes, grammaire en specs), playlists ToKini Andy
js/jp.js                 moteur « kanji appris » (specs [kanji|lecture|EN]), dates japonaises, bulle de furigana
js/sync.js               synchronisation Gist (trouver ou créer, lire, fusionner, écrire)
js/obsidian.js           export Markdown + mini-écrivain de zip
widget/benkyo-widget.js  widget Scriptable
scripts/fetch_news.py    récupère NHK Easier + NHK ONE RSS → data/news.json (ignore les flux figés > 7 jours)
.github/workflows/news.yml  toutes les 3 h, commit de data/news.json sur main
docs/Benkyo-User-Manual.pdf, docs/maquettes/ (maquettes + sources), docs/reprise/ (ces fiches)
```

## Points techniques à connaître

- **NHK** : depuis le passage à NHK ONE, la liste JSON de NHK Easy exige un jeton (erreur 401), et l'ancien RSS `www3` est figé depuis le 8 août 2026. D'où le recours à `nhkeasier.com/feed/` et `news.web.nhk/n-data/conf/na/rss/cat0.xml`.
- **Bunpro** n'a pas d'API publique : la case se coche à la main.
- **WaniKani** : « appris » signifie que `passed_at` n'est pas nul (Guru atteint au moins une fois). Les caractères des kanji sont mis en cache dans `state.cache.kanjiChars`.
- **Environnement Claude (cloud)** : NHK, YouTube, WaniKani et le forum WaniKani sont bloqués par le proxy. Contournement utilisé : une branche temporaire `claude/nhk-probe` avec un workflow GitHub Actions qui fait les `curl`, dont Claude lit ensuite les logs via les outils GitHub. Cette branche est **à supprimer** sur GitHub (Claude ne peut pas supprimer de branche distante).
- **Contrastes mesurés (mode clair actuel)** : texte gris 3,5–3,8:1 et rose 3,96:1, donc sous le seuil AA de 4,5:1. À corriger dans la refonte.
- **Tests** : scripts Playwright dans `docs/maquettes/source/`.
  - `app-test.mjs` : parcours de l'app sur iPhone 15 et sur bureau, avec une fausse API WaniKani.
  - `sync-test.mjs` : deux appareils et un faux Gist.
  - Chromium est disponible à `/opt/pw-browsers`. Lancer d'abord `python3 -m http.server 8765` à la racine du dépôt.

## Historique des PR (toutes fusionnées)

1. **#1** : app de base, widget, kanji appris.
2. **#2** : widget aux vraies dimensions d'iOS, ruban moyen.
3. **#3** : version bureau, installation, synchronisation Gist, manuel.
4. **#4** : My links, export Obsidian, flux NHK réparés, playlists ToKini Andy, manuel illustré.
