# Fiche dynamique pour [SimulacreS](https://www.facebook.com/groups/1501312836787784/)

Simulacres©™ - le jeu de rôle élémentaire a été créé par Pierre Rosenthal.
Les règles de Simulacres © sont soumises à copyright et Simulacres™ est une marque déposée.

Ce projet génère des fiches de personnages dynamiques conçues pour faciliter la gestion d'un personnage
dans une campagne de Simulacres.

Ce projet supporte les règles de campagne de
[SimulacreS version 7](https://www.facebook.com/groups/Simulacres/permalink/1512926132293121/)
avec les éléments suivants en plus :

- les points de vie localisés, l'armure localisée et le bouclier
  (voir [Casus Belli HS n°16](http://confrerie-acier.chez-alice.fr/localisation%20armures%20et%20autres.htm)),
- les utilisations optionnelles des énergies classiques
  (voir [Casus Belli HS n°16](http://confrerie-acier.chez-alice.fr/localisation%20armures%20et%20autres.htm)),
- la voie du moine (voir [Casus Belli LPC n°25](http://joueursdurepaire.free.fr/casus_belli/cb_LPC25.html)).
- la proposition de règle non officielle sur
  [le combat à deux armes](https://www.facebook.com/groups/Simulacres/permalink/2507313226187735/) par Karl Karas.
- la proposition de règle non officielle sur l'utilisation de
  [la pipe magique des Tomtes de Sîl](https://www.facebook.com/groups/Simulacres/permalink/2406479912937734/)
  par Karl Karas.
- le bon, le méchant et le druide
  (voir [Casus Belli LPC n°17](http://joueursdurepaire.free.fr/casus_belli/cb_LPC17.html))
- les super-pouvoirs
  (voir [Causus Belli HS 10 p.46](https://www.facebook.com/groups/Simulacres/permalink/2510465732539151/))
- les pouvoirs psioniques
  (voir [Causus Belli HS 10 p.47](https://www.facebook.com/groups/Simulacres/permalink/2510465732539151/))

Ce projet supporte aussi les règles de campagne et de découverte de
[SimulacreS version 8](https://www.facebook.com/groups/Simulacres/permalink/2324033054515754/)
avec les éléments suivants en plus :

- les talents détaillés et l'armure
  (voir [ces règles optionnelles](https://www.facebook.com/groups/Simulacres/permalink/2186771051575289/))
- la [matrice 4x4](https://www.facebook.com/groups/Simulacres/permalink/2532857676966623/)
- l'univers de [Capitaine Vaudou](https://www.black-book-editions.fr/catalogue.php?id=704).

## Premiers pas

Vous pouvez télécharge une [release](../../releases) de la fiche
ou la compiler depuis le code source
(voir [Compiler depuis le code source](#compiler-depuis-le-code-source)).

Une fois que vous avez modifié des champs de la fiche, n'oubliez pas de la sauvegarder,
en utilisant soit le bouton en bas de la fiche, soit CTRL+S.

Comme il s'agit d'une page html ouverte par un browser, on ne peut pas sélectionner
le point de sauvegarde pour vous.
La version modifiée se trouvera dans vos téléchargements si votre browser ne vous a
pas demandé où sauvegarder la fiche.

### Gestion des points d'aventure

Pour avoir une estimation fiable des points d'aventure,
il faut compléter les paramètres dans l'onglet "PA".

### Gestion des talents

Pour monter un talent, il suffit de le changer de colonne dans l'onglet des talents.
Certains mouvements de talent ne sont pas possible, par exemple, il n'y a pas de
sens de déplacer "Athlétisme" (niveau 0 de base) au niveau -4.

Vous pouvez ajouter de nouveaux talents à n'importe quelle colonne de X à 0.
Il est important de créer le talent dans la colonne du niveau du talent de base
sinon le calcul des points d'aventure restants ne fonctionnera pas.

### Gestion des tests courants

Dans l'onglet "Tests", vous pouvez créer des tests courants, basés ou non sur un talent.

Une fois encodés, vous pouvez lancer le test en cliquant sur l'image des dés.
Les résultats du test s'afficheront et vous pourrez appliquer
les différents modificateurs à la marge de réussite
(comme l'armure de la cible d'une attaque par exemple).

Il affichera le texte de l'effet en replaçant certains mots-clés par leurs valeurs.
Dans la version 8, "MR", "DES" et "DSS" seront remplacés.
Dans la version 7, "MR" et les colonnes d'effets tels que [A-2] et [D] seront remplacés.

#### Petites Gens

Les joueurs de l'ethnie des "Petites Gens" (ou "Hobbits") ont droit à un bonus de +1 à la résistance
lors d'un test l'impliquant (à l'exception des tests de résistance à l'hypnose et aux illusions).
Ce bonus sera intégré dans les tests si l'ethnie a une des valeurs suivantes :
"Hobbit", "Tinigens", "Petites Gens", "Petites Personnes", "Tomte".

### Gestion des sorts (version 7 uniquement)

Le fonctionnement des sorts dépend de la liste de magie utilisée.
Il est important de les encoder correctement.
Les prêtres utilisent la liste "Divin" pour encoder leurs sorts et les mages hermétiques
doivent utiliser la liste "Hermétique".

Apprendre un sort déjà appris pour un autre règne coûte 1 point d'aventure de moins.
Il suffit de sélectionner plusieurs règnes pour un même sort.

Pour les mages hermétiques, les sorts sont des talents classiques
et la colonne depuis laquelle ils doivent être créés dépend de la marge de réussite
du test d'apprentissage. Si elle est positive,
le talent doit être créé dans la colonne 0.
Si la marge est -2 ou -1, le talent doit être créé dans la colonne -2,
Si la marge est -4 ou -3, le talent doit être créé dans la colonne -4,
et, en dessous, le talent doit être créé dans la colonne X.

Les mages non-hermétiques ont le droit de lancer des sorts non appris
en magie instinctive pour peu qu'ils ne dépensent que des EP, qu'ils aient le niveau
d'énergie nécessaire au sort et que ce dernier soit inférieur ou égal au niveau du
talent d'Art Magique. La difficulté du lancer est de 0 mais sa marge de
réussite ne peut être supérieure à 1. Pour pré-encoder des sorts que vous comptez
lancer en magie instinctive, vous pouvez utiliser la liste "Magie Instinctive"
qui fixe tous ces détails pour vous et ne vous décompte pas de PA pour ce sort.

## Mettre à jour une fiche existante

D'abord, téléchargez la version voulue pour la fiche.
Ouvrez cette page vierge, cliquez sur le bouton "Importer une ancienne fiche"
et choisissez votre ancienne fiche.
Après quelques secondes, toutes les données de votre ancienne fiche sont importées
dans la nouvelle.
Il ne vous reste plus qu'à sauvegarder la nouvelle version

Comme il s'agit d'une page html ouverte par un browser, on ne peut pas sélectionner
le point de sauvegarde pour vous.
La nouvelle version se trouve dans vos téléchargements si votre browser ne vous a
pas demandé où sauvegarder la fiche.

## Compiler depuis le code source

Pour produire la fiche dynamique, vous devez d'abord télécharger les librairies
javascript et css avec [yarn](https://classic.yarnpkg.com/en/docs/install/)
en exécutant la commande suivante à la racine du projet :

```console
$ yarn
```

Après, vous avez besoin de certaines libraires de Python que vous pouvez
télécharger avec la commande suivante.
Ce projet supporte les versions de python à partir de 3.8.

```console
$ pip3 install -r requirements.txt
```

Enfin, vous pouvez créer le fichier HTML incluant tout le code en exécutant :

```console
$ python3 compile.py simulacres_fiche_perso.html
```

La documentation des paramètres de ce script est accessible avec la commande suivante :

```console
$ python3 compile.py -h
```

## Plugins

Vous pouvez insérer de nouveaux onglets dans la fiche en créant et en important des plugins.

### Importer un plugin

Vous pouvez importer n'importe quel fichier qui se trouve
dans le [dossier plugin](plugins) ou un que vous aurez créé
(voir [Construire son propre plugin](#construire-son-propre-plugin)).
Le bouton pour importer un plugin se trouve en bas de la fiche.
Pour le moment nous avons les plugins suivants :

- Un [plugin exemple](plugins/plugin_example.html) pour le test et la documentation.
- Un [plugin utilisant un véritable générateur aléatoire](plugins/plugin_true_random.html).
  Le générateur d'aléatoire d'un PC dépend des calculs qu'il fait et n'est donc pas entièrement
  aléatoire (voir
  [wikipédia pour les détails](https://fr.wikipedia.org/wiki/G%C3%A9n%C3%A9rateur_de_nombres_pseudo-al%C3%A9atoires)).
  Ce plugin va récupérer des nombres aléatoires générés par https://random.org quand ce site est accessible.
  Si le site n'est pas joignable, il bascule sur le générateur de la machine.
- Un [plugin rajoutant des talents et des énergies magiques](plugins/plugin_other_world.html)
  à une fiche de base (peu importe la version). Ce plugin sert d'exemple
  pour construire une fiche SimulacreS d'un univers de campagne
  autre que Malienda ou Capitaine Vaudou.
- Un [plugin rajoutant une énergie magique](plugins/plugin_generic_world.html)
  à une fiche de base (peu importe la version) sans rajouter d'onglet.
  Il montre aussi comment changer la police.
- Un [plugin d'export](plugins/plugin_export_to_server.html)
  vers un server distant qui permet d'envoyer le contenu de
  la fiche à une URL et exporte tous les jets faits sur la fiche
  (voir la [section sur l'export de ces données](#export-de-données) pour le format)
- Un [plugin de calcul des probabilités de réussite](plugins/plugin_roll_probability.html)
  qui affiche la probabilité de réussite d'un jet avant de lancer celui-ci.

### Mettre à jour un plugin

Vous pouvez mettre à jour un plugin en important la nouvelle version de celui-ci
dans votre fiche. Il n'y a pas besoin de créer une nouvelle fiche.

### Construire son propre plugin

Nous fixons quelques conventions pour les plugins.
Chaque composante doit inclure une classe appropriée :

- Le bouton de l'onglet : ``plugin-button``
- L'onglet lui-même : ``plugin-tab``
- Le code css associé : ``plugin-css``
- Le code javascript associé : ``plugin-js``

Vous pouvez avoir plusieurs blocks de chaque type
mais chaque block doit avoir un id différent.
Pour garantir l'unicité de vos ids, préfixez les par
``<block-class>-<plugin-name>`` en remplaçant ``<plugin-name>``
par le nom de votre plugin
et ``<block-class>`` par la classe appropriée choisie dans la liste ci-dessus.

Il est également possible d'écraser des parties de la fiche dynamique avec cette
méthode en utilisant le même id que le block à écraser
mais utilisez ça avec prudence car cela peut introduire des bugs.

#### Important : une fois votre plugin disponible, ne changez plus le moindre id

En effet, si vous changez les ids des champs, les utilisateurs perdront l'information encodée dans ces champs à la mise
à jour. De plus, si vous changez les ids des blocks, les vieilles composantes ne seront pas remplacées par les nouvelles
mais ces dernières seront quand-même insérées. Donc vous ne devez pas non plus supprimer de block (contentez-vous de
vider le contenu du block si vous voulez le "supprimer").

### Export de données

Comme mentionné précédemment, vous pouvez utiliser
[plugin d'export](plugins/plugin_export_to_server.html)
pour exporter la fiche et les rolls vers un serveur.

Pour que l'export fonctionne, le serveur cible doit envoyer le header
'Access-Control-Allow-Origin: \*' avec sa réponse.

Les données sont envoyées dans une requête POST dans tous les cas.

#### Export de la fiche

Les données suivantes sont envoyées :

```json5
{
  "name": "Le nom du personnage",
  "page": "Le contenu de la page"
}
```

#### Export des lancers de dés

Lorsqu'un lancer est effectué, une requête POST est envoyée au serveur. De même que si un modificateur du jet est
changé, une autre requête est faite au serveur
(pour un maximum de deux requêtes par seconde).

C'est la responsabilité du serveur d'agréger ces données s'il le souhaite
(par exemple, en utilisant le timestamp).

Il y a 3 types de lancers dans la fiche et donc 3 types de données qui peuvent être envoyées.

##### Lancers simples

Dans l'exemple suivant, "Albus Haupenroll" lance 2d6 :

```json5
{
  "name": "Albus Haupenroll",
  "number": 2, // nombre de dés à lancer
  "type": 6, // type de dés à lancer
  "base_dices": [1, 5], // les dés lancés
  "timestamp": "Tue Feb 09 2021 10:05:37 GMT+0100 (Central European Standard Time)",
  "recording": true // si le joueur a marqué les tests de sa fiche comme devant être enregistré (par exemple pour faire des statistiques en séance)
}
```

##### Talents, pouvoirs ou sorts

```json5
{
  // [...] Les champs déjà mentionnés à la section précédente
  "reason": "Épée longue", // Le nom du sort ou du talent
  "formula_elements": ["body", "action", "mechanical"],
  "max_value": 12, // La valeur seuil, incluant le malaise dans la nouvelle version mais n'incluant pas les modificateurs, pratiques magiques ou investissement en énergie
  "threshold": 11, // La valeur seuil incluant tout
  "margin": 4, // La marge calculée bien et incluant tout
  "critical_success": false,
  "critical_failure": false,
  "margin_throttle": 0, // Utile pour la magie instinctive dont la marge est limitée à 1
  "talent_level": 0, // Niveau du talent ou difficulté du sort/pouvoir (pour savoir si c'est un critique)
  "effect": "[F] PV et [B] PS",
  "critical_dices": [], // Les dés rajoutés en cas de succès critique (si c'est pas un critique, la liste est vide)
  "effect_dices": [1, 5], // Les 2d6 lancés pour mesurer l'effet
  "localisation_dices": [], // Si la localisation des PVs est activée, la valeur des deux dés de localisation s'y trouvera (le deuxième dé sert uniquement au contact si le premier dé est un 6)
  "is_magic": false, // Si c'est un sort => si on peut utiliser des composantes
  "is_power": false, // true si c'est un sort/super-pouvoir/pouvoir de moine
  "distance": "", // Si le pouvoir a une portée
  "focus": "", // Si le pouvoir a un temps de concentration
  "duration": "", // Si le pouvoir a une durée limitée
  "base_energy_cost": "", // le coût en énergie juste pour faire le roll (sans investissement en énergie et succès critique non pris en compte)
  "black_magic": "", // la description de la prise de magie noire s'il y en a
  "magic_resistance": "", // la description de la résistance magique s'il y en a
  "invested_energies": ["power", "speed", "precision", "optional-power", "optional-speed", "optional-precision", "magic-power"], // Investissement en énergies hors héroïsme
  "critical_increase": 0, // > 0 en cas de dual wielding ou autre cas particulier
  "precision": 0, // Seuil + 1
  "optional_precision": 0, // Seuil critique + 1
  "power": 0, // Seuil + 1
  "optional_power": 0, // MR + 1d6
  "magic_power": 0, // Portée x 2
  "speed": 0, // Seuil + 1
  "optional_speed": 0, // Temps / 2
  "power_dices": [], // Si on investit en puissance pour +1d6, ces dés apparaissent là
  "incantation": false, // Pratique magique: Seuil + 1
  "somatic_component": false, // Pratique magique: Seuil + 1
  "material_component": false, // Pratique magique: Seuil + 1
  "unease": 0, // le malaise au moment du roll
  "armor_penalty": "", // la pénalité d'armure (sous forme de string car c'est une description)
  "margin_modifier": 0, // valeur du modificateur circonstanciel
  "effect_modifier": 0, // valeur du modificateur d'effet
  "energy_investment_validated": true // si l'investissement en énergie est validé
}
```

##### Super-pouvoirs

En plus des données précédentes, les tests de super-pouvoirs incluent les informations suivantes :

```json5
{
  // [...] Les champs déjà mentionnés à la section précédente
  "number": 5, // le nombre de dés à lancer (sans modificateur ou investissement en énergie)
  "under_value": 3, // les dés doivent être <= à ça pour être compté
  "superpower_modifier": 0 // le nombre de dés en plus ou en moins à roll
}
```
