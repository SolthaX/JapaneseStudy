# 03 — Plan de design (refonte, non codée)

Maquettes : `docs/maquettes/themes/` (images 01 à 06).

## Audit UX : problèmes à corriger

| Problème | Règle |
| --- | --- |
| Mode clair : texte gris 3,5–3,8:1 et rose 3,96:1 (seuil 4,5:1) ; 32 tailles de texte entre 10 et 12 px | WCAG AA |
| Téléphone : l'arbre prend ~40 % du premier écran, un seul objectif visible | Loi de Fitts, priorité à l'action |
| Le rose sert à tout (décor, boutons, chiffres) | Effet Von Restorff |
| Les onglets passent d'emoji à kanji avec les niveaux | Loi de Jakob, cohérence |
| Anglais et japonais doublés partout, pointillés sur tous les kanji | Loi de Miller, charge cognitive |
| Les emojis s'affichent différemment selon le système | Cohérence |
| Cases à cocher de 28 px (Apple recommande 44 pt) | Loi de Fitts |
| Réglages sur une seule page très longue | Loi de Hick |
| Bugs vus : pétale animé sur le texte du salut, « ワニカニ » coupé sur deux lignes, objectifs barrés qui ressemblent à des erreurs, 5 boutons « Open » | — |
| Bureau : mise en page calée à gauche, vide à droite | Grille |
| Série remise à zéro en un jour | Peak-End, culpabilité |

Retours négatifs imaginés : « trop rose, enfantin », « je dois scroller pour savoir quoi faire », « texte gris illisible dehors », « mes onglets ont changé », « j'ai perdu ma série pendant les vacances », « sur PC c'est un site mobile étiré », « un jeton GitHub, c'est quoi ? ».

## Thèmes (palettes testées dans les maquettes)

Couleurs dans `docs/maquettes/source/themes-body.mjs`.

| Thème | Fond / carte / texte / gris / accent |
| --- | --- |
| Sakura accessible | texte `#241f2e`, gris `#5f5666`, accent `#c2185b` |
| Washi | `#faf8f4` / `#fff` / `#141414` / `#5c5a57` / rouge `#c8102e` |
| Sumi | `#121212` / `#1c1c1c` / `#f2efe9` / `#b4aea4` / vermillon `#ff5a36` + or `#e9b44c` |
| Ai | `#f3f5fa` / `#fff` / `#14213d` / `#4f5b75` / indigo `#2f4b9a` |
| Matcha | `#f5f6f0` / `#fff` / `#1f2a1c` / `#556052` / vert `#4f7a3a` |

⚠️ Retour du 18/10 : Washi est **trop épuré**. Garder l'arbre fleuri, l'icône fleur de cerisier, et un ton chaleureux. Les thèmes doivent changer les couleurs, pas tuer l'âme de l'app.

## Inspiration WaniKani / Bunpro

- Le nouveau tableau de bord WaniKani se compose de widgets en **rangées**. On ajoute, retire et déplace les rangées et les widgets. La **mise en page** d'une rangée se choisit (pleine, ½ ½, ⅔ ⅓, ⅓ ⅓ ⅓). Chaque widget a des **variantes** et une **palette**. Le mode édition utilise des **données fictives**, sauvegarde automatiquement et propose « Restaurer par défaut ». Sur mobile, les rangées s'empilent.
- Plaintes de leurs utilisateurs à éviter : tuiles trop hautes, écran d'édition « bancal », contenu coupé sur écran large, envie de réordonner librement, série qui devrait être grisée tant que la journée n'est pas faite.
- Bunpro : prévisions sur 24 h **et** 14 jours, vue cumulée.

## Mises en page proposées

- **Téléphone** (maquette 06, gauche) : petite en-tête avec série et mini-arbre, deux tuiles d'action (révisions WaniKani, chapitre en cours), les objectifs, un titre NHK. Mode édition avec ↑ ↓ ⚙ ✕ et « + Add widget ».
- **Ordinateur, centre de commande** (maquette 04) : 4 tuiles d'action en haut (révisions et leçons WaniKani, Bunpro, prochaine étape du manuel), puis 3 colonnes (objectifs + mini-arbre / prévisions + progression du niveau + manuel / carte de chaleur + liens + NHK).
- **Ordinateur, personnalisation** (maquette 05) : rangées avec poignées, proportions, ✕, panneau latéral (variante, palette, catalogue).
- **Catalogue de widgets** : tuiles d'action, objectifs, série et arbre, prévisions (24 h / 14 j / cumulé / WK + Bunpro), progression du niveau (kanji vers Guru), répartition SRS, rythme du manuel, calendrier (mois / 18 semaines / année), lecture, NHK, liens, proverbe, kanji du jour (appris uniquement), minuteur de concentration, compte à rebours JLPT, et compagnon / jardin (fiche 04).
