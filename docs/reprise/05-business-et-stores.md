# 05 — Business, stores et technique native

## Modèle : gratuit + supporters (gadgets uniquement)

**Gratuit pour tous** :
- suivi, statistiques, exports, synchronisation, rappels ;
- les thèmes de base et la personnalisation du tableau de bord ;
- tous les compagnons et le jardin complet.

**Supporters** (cosmétique et sympathique uniquement) :
- thèmes de saison (momiji, neige, hanabi, shōgatsu) ;
- tenues et décorations rares pour le jardin ;
- célébrations (pétales, confettis, clochette de temple) ;
- police calligraphique, palettes de widgets supplémentaires ;
- **hanko personnalisé** (sceau rouge avec le prénom en katakana) ;
- icônes d'app alternatives ;
- badge, nom dans les remerciements, accès aux bêtas.

**Paiement souhaité** : pourboires ponctuels à prix libre + « café mensuel » (à partir de ~1,50 €/mois, montant libre).

Ordre de grandeur : 1 à 3 % des utilisateurs actifs soutiennent → quelques centaines d'euros par an pour ~2000 utilisateurs.

## Comment encaisser

- **Web (maintenant)** :
  - **Ko-fi** (0 % de commission sur les dons, plus ~3 % de frais de paiement, adhésion mensuelle possible) ;
  - ou **GitHub Sponsors** (0 % pour un compte personnel, montant libre).
  - Comme les avantages ne sont que des gadgets, un bouton honnête « J'ai soutenu » suffit à les débloquer : pas de système de licence.
- **App iPhone (plus tard)** :
  - débloquer quoi que ce soit impose les **achats intégrés Apple** (règle 3.1.1), avec 15 % de commission pour les petits développeurs ;
  - les achats intégrés fonctionnent par **paliers** (par exemple café à 1,49 / 2,99 / 4,99 € par mois, pourboires de 1,49 à 9,99 €), pas de montant totalement libre ;
  - un lien vers une cagnotte n'est accepté que s'il ne débloque rien ;
  - la règle multiplateforme 3.1.3(b) permet de reconnaître un soutien payé sur le web si les mêmes paliers existent aussi en achat intégré ;
  - aux États-Unis, les liens externes sont permis depuis 2025.
- **Fiscalité** : des dons avec contreparties sont des revenus → micro-entreprise, à valider avec un comptable.

## Déployer gratuitement la web-app

| Plateforme | Méthode | Coût |
| --- | --- | --- |
| iPhone | Safari → Partager → « Sur l'écran d'accueil » (iOS 26 l'ouvre en web-app par défaut) | 0 € |
| Android | Chrome → « Installer l'application » | 0 € |
| Windows | Edge ou Chrome → Installer → épingler (Zen : onglet épinglé ou Essentials) | 0 € |
| Microsoft Store | Paquet via **PWABuilder** ; inscription gratuite pour les individus depuis septembre 2025 (à confirmer) | 0 € |
| Google Play | PWABuilder → Trusted Web Activity | 25 $ une fois |
| App Store | 99 $ par an, et risque de refus (règle 4.2) pour une web-app simplement emballée | 99 $/an |

Les notifications web fonctionnent sur Android et Windows, et sur iOS 16.4+ uniquement si l'app est ajoutée à l'écran d'accueil.

## App native : SwiftUI ou Capacitor (décision reportée)

**SwiftUI**, avantages :
- vrais widgets (écran d'accueil interactif, écran verrouillé, Live Activity) ;
- iCloud / CloudKit (remplacerait le jeton GitHub) ;
- notifications, Siri et Raccourcis (App Intents), Apple Watch ;
- performance et accessibilité natives ;
- pas de risque de refus 4.2.

**Estimation si Claude code et l'utilisateur teste** : **3 à 6 semaines**.
- **Pas besoin de Mac** : les serveurs macOS de **GitHub Actions** (gratuits pour un dépôt public) compilent et lancent les tests sur simulateur. Claude lit les logs lui-même, peut récupérer des captures du simulateur, et envoyer les versions sur TestFlight avec une clé API App Store Connect.
- Délais incompressibles : validation du compte Apple, revue de l'App Store, autorisations.
- Inconvénient : deux bases de code, l'app iPhone en natif et le web pour Windows et Android.

**Capacitor + compléments Swift** : réutilise le code web, avec widget, notifications et achats intégrés natifs. Plus rapide, Android presque gratuit, un peu moins « natif ».

## Publier sur l'App Store (processus)

1. Apple Developer Program (99 $ par an).
2. Identifiant de l'app, certificats, fiche App Store Connect.
3. Bêta TestFlight.
4. Fiche de l'app : captures 6,9″ et 6,5″, description, mots-clés, politique de confidentialité, étiquettes de confidentialité, âge.
5. **Statut de commerçant dans l'UE (DSA)** : avec des achats intégrés, adresse, téléphone et e-mail deviennent **publics** dans l'UE → prévoir une domiciliation.
6. Fiscalité et compte bancaire.
7. Revue (1 à 3 jours, environ 25 % de refus en général), publication.

Google Play : les nouveaux comptes personnels doivent faire un test fermé avec 12 testeurs pendant 14 jours (à vérifier).

## Légal : à sécuriser avant toute publication ou vente

- **WaniKani** : la section G de leurs conditions encadre l'API ; le logo du Crabigator est une marque → écrire à hello@wanikani.com.
- **Genki / Quartet** (Japan Times) : titres de chapitres et listes de grammaire → demander une autorisation, ou faire saisir ces contenus par l'utilisateur.
- **NHK Easier / NHK** : se contenter de liens et de titres.
- **ToKini Andy** : des liens suffisent ; demander son accord pour le mettre en avant.

## Généralisation « tous les autodidactes »

Architecture en **packs**, d'après la liste de ressources de la communauté WaniKani :
- **Manuels** : Genki, Quartet, Minna no Nihongo, Tobira, Marugoto, Japanese From Zero, IAIJ.
- **Outils** : WaniKani (API), Bunpro, Anki, Renshuu, Marumori, Kitsun — API à vérifier pour chacun.
- **Lecture** : Natively, Satori Reader, Bookmeter, NHK Easier.
- **Écoute** : Teppei, Comprehensible Japanese.
- **Dictionnaires** : Jisho, Takoboto.
