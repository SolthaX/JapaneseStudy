# 04 — Compagnons et jardin (planifié, non codé)

Maquettes : `docs/maquettes/compagnons/`.
- Direction retenue : **04-galerie-pixel-art**, **05-choix-du-compagnon**, **06-jardin-pixel**, **07** et **08** (GIF pixel).
- Les autres maquettes (style plat, ukiyo-e, model sheet en style plat) sont l'historique des pistes.
- Générateur : `docs/maquettes/source/chars.js` et `studio.html` (voir le README des sources).

## Direction artistique validée

- **Pixel art avec contours noirs** (1 px, `#1b1520`), palette limitée à chaque personnage.
- Personnages **chibi, plus mignons et plus ronds** : grosse tête (~½ de la hauteur), petit corps, grands yeux avec reflets, joues roses.
- On garde l'**arbre sakura** et l'**icône fleur de cerisier** de l'app.
- Les sprites de la maquette sont **convertis automatiquement** depuis du SVG : 56 px de large, puis contour et palette. Pour la version finale, il faut **retoucher ou dessiner pixel par pixel**, car les reflets des yeux et les petites marques se perdent.

## Les 10 compagnons

| # | Compagnon | Personnalité / signes distinctifs | Déblocage proposé |
| --- | --- | --- | --- |
| 01 | Shiba 柴犬 | joyeux, foulard rouge, queue enroulée | départ (au choix) |
| 02 | Maneki-neko 招き猫 | porte-bonheur, patte levée, clochette | départ (au choix) |
| 03 | Tanuki 狸 | farceur, feuille sur la tête, masque ; c'est lui le « furtif » | départ (au choix) |
| 04 | Panda roux レッサーパンダ | queue rayée | série de 14 jours |
| 05 | Kitsune 狐 | renard blanc aux marques rouges | WaniKani niveau 10 |
| 06 | Kappa 河童 | assiette d'eau sur la tête, bec, carapace | finir un manuel |
| 07 | Kodama 木霊 | petit esprit des arbres, pousse sur la tête | arbre en pleine floraison (30/30) |
| 08 | Baku 獏 | mangeur de rêves lavande, petite trompe | 50 jours d'étude |
| 09 | Komainu 狛犬 | chien-lion gardien, crinière bouclée, grelot doré | série de 100 jours |
| 10 | Nekomata 猫又 | chat à deux queues, flammes violettes | secret : étudier après minuit ×10 |

Départ : **choix entre Shiba, Maneki-neko et Tanuki** (maquette 05). Les deux autres se débloquent ensuite (par exemple à 3 et 7 jours de série).

## Animations (notes d'animateur)

- **Attente** : respiration (2–3 px, 2 s), clignement toutes les 3 à 5 s, queue ±14–16°, patte du maneki-neko.
- **Furtif** (Today) : « de temps en temps », ou quand un objectif est coché. Il sort à ~60 % d'un bord ou d'un coin de carte, regarde à gauche et à droite, fait un clin d'œil, se cache (≈1,2 s), puis réapparaît au-dessus ou en dessous d'une autre carte. **Jamais sur du texte ou des boutons** ; un toucher le fait déguerpir.
- **Célébration** : saut + visage content quand la journée est complète.
- **Endormi** : après 22 h ou un jour de repos (« z z »).
- Animations à prévoir : attente, marche, apparition furtive, célébration, sommeil.

## Jardin et économie

- **Jamais de perte** : une série cassée rend juste le compagnon un peu endormi.
- **Pièces d'étude** : chaque objectif coché en rapporte, avec un bonus quand la journée est complète. Un objet coûte 1 à 5 jours d'étude. **Pas d'achat de pièces avec de l'argent.**
- **Étapes de série** : par exemple 3 jours → fleurs, 7 → lanterne, 14 → étang aux carpes, 30 → torii, 60 / 100 → objets rares.
- **Étapes d'apprentissage** : niveaux WaniKani, chapitres et livres terminés → objets spéciaux (exemple de maquette : Genki II terminé → maison de thé ; idée : un Shinkansen).
- **Saisons réelles** : sakura au printemps, lucioles en été, momiji en automne, neige en hiver.
- **Emplacements** : haut de Today (compact), onglet **Jardin** (contempler et arranger), widget du tableau de bord, widget iPhone.
- **Supporters** : uniquement des tenues, décorations rares et habillages de saison. Le jardin complet reste gratuit.

## Reste à faire côté design

- Une model sheet pixel art pour chaque compagnon (vues, expressions, palette).
- Les feuilles d'animation de sprites (frames).
- Le catalogue des objets du jardin, avec prix et conditions.
- Convertir l'animation furtive (maquette 09, encore en style plat) en pixel art.
