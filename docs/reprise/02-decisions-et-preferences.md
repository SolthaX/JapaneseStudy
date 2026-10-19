# 02 — Décisions prises et préférences

## Préférences de travail avec Claude (importantes)

- **Langue** : discuter en **français** ; l'application et le manuel restent en **anglais + japonais uniquement**.
- **QCM** : l'utilisateur aime répondre par QCM (outil de questions à choix), il en veut autant que nécessaire.
- **Artefacts** : toujours **demander validation avant de créer un artefact** (page claude.ai).
- **Phase actuelle** : **planification uniquement**. Ne rien développer de la refonte avant son retour détaillé sur les visuels.
- Il aime voir des **maquettes visuelles** (images, GIF animés) plutôt que des descriptions.
- Il apprécie qu'on s'inspire de **WaniKani** et **Bunpro**, qu'il juge très bien conçus.

## Décisions déjà actées (dans le code)

- Hébergement : dépôt **public** + **GitHub Pages**.
- Bunpro : pas d'API, case manuelle.
- Kanji : « appris » = **Guru au moins une fois** ; affichage **mot par mot** ; règle appliquée à l'interface, aux titres et à la grammaire, aux proverbes et au widget ; furigana au toucher.
- Synchronisation : **Gist GitHub** automatique.
- Manuel : en **anglais**, EB Garamond 12, noir, interligne simple, avec captures.
- Obsidian : **export Markdown (zip)** construit. Deux autres options proposées, pas encore choisies : envoyer le résumé du jour dans la note quotidienne via `obsidian://`, ou un script de synchronisation automatique du coffre.
- Liens utiles : carte sur **Today**, icône = **emoji ou icône du site**.
- Widget : grand format plus **ruban moyen** (prochaine grammaire + titre NHK Easy).

## Décisions de la refonte (planifiées, PAS encore codées)

### Visuel
- Thèmes : Sakura (version accessible) + **Washi** (blanc/rouge/noir), **Sumi** (encre, sombre), **Ai** (indigo), **Matcha** (vert).
- Thème par défaut : **suivre le système** (Washi en clair, Sumi en sombre).
- Retour du 18/10 : le style Washi est **trop épuré**. On garde **l'arbre avec les fleurs** et **l'icône d'app fleur de cerisier** d'origine. La refonte doit rester chaleureuse et ludique.
- Icônes : **icônes linéaires** pour l'interface, logos de sites seulement sur les tuiles de liens.
- Onglets : **icône fixe + mot anglais**, le kanji appris en petit dessous.
- Densité de japonais : **titres de section uniquement**.
- Série : **jours de repos autorisés** (1–2 par semaine ou « gels »).
- Téléphone : **les objectifs d'abord**, petit arbre en haut.
- Tableau de bord : **personnalisable façon WaniKani** (widgets en rangées, proportions, variantes, palettes), avec **une disposition téléphone et une disposition ordinateur séparées**.

### Compagnons (voir fiche 04)
- **Tous les animaux** : shiba, maneki-neko, tanuki, panda roux, kitsune, kappa, kodama, baku, komainu, nekomata. Tous mignons et **à débloquer**.
- Style : **pixel art avec contours noirs**, personnages **plus mignons et plus ronds**.
- Déblocages : séries + pièces d'étude + étapes d'apprentissage + saisons.
- Pièces : **simples et généreuses** ; jamais achetables avec de l'argent.
- Départ : **choix entre 3** (shiba, maneki-neko, tanuki).
- Série cassée : **rien n'est perdu**.
- Furtivité : « **de temps en temps** », jamais sur du texte ou des boutons.
- Emplacements : haut de Today, onglet Jardin, widget du tableau de bord, widget iPhone. Sur Today, l'animal se balade de widget en widget, en apparaissant dans les coins, au-dessus et en dessous (« sneaky et goofy »).

### Business (voir fiche 05)
- Modèle : **gratuit + supporters**. L'utilisateur avait d'abord cliqué « payé une fois » par erreur, puis corrigé.
- Les supporters ne débloquent que des **gadgets** (cosmétiques). Tout ce qui est utile reste gratuit, jardin compris.
- Paiement : **pourboires ponctuels à prix libre** + **« café mensuel »** (par exemple 1,50 €/mois, montant libre).
- Public visé si l'app passe sur les stores : **tous les autodidactes** (packs de manuels et d'outils).
- Choix technique pour l'app native : **à décider plus tard**.
