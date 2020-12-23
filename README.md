# Fiche dynamique pour [SimulacreS](https://www.facebook.com/groups/1501312836787784/)

La fiche utilise les règles de campagne de
[SimulacreS version 7](https://www.facebook.com/groups/Simulacres/permalink/1512926132293121/)
avec les éléments suivants en plus :
- les points de vie localisés, l'armure localisée et le bouclier
  (voir [Casus Belli HS n°16](http://confrerie-acier.chez-alice.fr/localisation%20armures%20et%20autres.htm)),
- les utilisations optionnelles des énergies classiques
  (voir [Casus Belli HS n°16](http://confrerie-acier.chez-alice.fr/localisation%20armures%20et%20autres.htm)),
- la voie du moine (voir [Casus Belli LPC n°25](http://joueursdurepaire.free.fr/casus_belli/cb_LPC25.html)).

Elle supporte aussi les règles de campagne de
[SimulacreS version 8](https://www.facebook.com/groups/Simulacres/permalink/2324033054515754/)
(avec [quelques règles optionnelles](https://www.facebook.com/groups/Simulacres/permalink/2186771051575289/))
et celles de [Capitaine Vaudou](https://www.black-book-editions.fr/catalogue.php?id=704).

## Premiers pas

Vous pouvez télécharge une [release](../../releases) de la fiche
ou la compiler depuis le code source
(voir [Compiler depuis le code source](#compiler-depuis-le-code-source)).

Une fois que vous avez modifié des champs de la fiche, n'oubliez pas de la sauvegarder,
en utilisant soit le bouton en bas de la fiche, soit CTRL+S.

Comme il s'agit d'une page html ouverte par un browser, on ne peut pas sélectionner
le point de sauvegarde pour vous.
La version modifiée se trouve dans vos téléchargements si votre browser ne vous a
pas demandé où sauvegarder la fiche.

### Mettre à jour une fiche existante

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

### Compiler depuis le code source

Pour produire la fiche dynamique, vous devez d'abord télécharger les librairies
javascript et css avec [yarn](https://classic.yarnpkg.com/en/docs/install/)
en exécutant la commande suivante à la racine du projet :

```console
$ yarn
```

Après, vous avez besoin de certaines libraires python que vous pouvez
télécharger avec la commande suivante.
Ce projet supporte les versions de python à partir de 3.5.

```console
$ pip3 install -r requirements.txt
```

Enfin, vous pouvez créez le fichier HTML incluant tout le code en exécutant :

```console
$ python3 compile.py simulacres_fiche_perso.html
```

La documentation des paramètres de ce script est accessible avec la commande suivante :
```console
$ python3 compile.py -h
```

## Plugins

Vous pouvez insérer de nouveaux tabs dans la fiche en créant et en important des plugins.

### Importer un plugin

Vous pouvez importer n'importe quel fichier qui se trouve
dans le [dossier plugin](plugins) ou un que vous aurez créé
(voir [Contruire son propre plugin](#construire-son-propre-plugin)).
Le bouton pour importer un plugin se trouve en bas de la fiche.
Pour le moment nous avons les plugins suivants :

- Le [plugin exemple](plugins/plugin_example.html) pour le test et la documentation
- Le [plugin d'export](plugins/plugin_export_to_server.html) de fiche vers un server distant
  qui permet d'envoyer le contenu de la fiche à une URL
  en faisant une requête POST qui contient les données suivantes :
  ```json
  {
    "name": "Le nom du personnage",
    "page": "Le contenu de la page"
  }
  ```
  Pour qu'il fonctionne, le serveur cible envoyer le header
  'Access-Control-Allow-Origin: *' avec sa réponse.

### Mettre à jour un plugin

Vous pouvez mettre à jour un plugin en important la nouvelle version de celui-ci
dans votre fiche. Il n'y a pas besoin de créer une nouvelle fiche.

### Construire son propre plugin

Nous fixons quelques conventions pour les plugins.
Chaque composante doit inclure une classe appropriée :

- Le bouton du tab : ``plugin-button``
- Le tab lui-même : ``plugin-tab``
- Le code css associé : ``plugin-css``
- Le code javascript associé : ``plugin-js``

Vous pouvez avoir plusieurs blocks de chaque type
mais chaque block doit avoir un id différent.
Pour garantir l'unicité de vos ids, préfixez votre id par ``plugin-<plugin-name>-``
en remplaçant ``<plugin-name>`` par le nom de votre plugin.

Il est également possible d'écraser des parties de la fiche dynamique avec cette
méthode en utilisant le même id que le block à écraser
mais utilisez ça avec prudence car cela peut introduire des bugs.

#### Important : une fois votre plugin disponible, ne changez plus le moindre id

En effet, si vous changez les ids des champs, les utilisateurs perdront l'information
encodée dans ces champs à la mise à jour.
De plus, si vous changez les ids des blocks, les vieilles composantes ne seront
pas remplacées par les nouvelles mais ces dernières seront quand-même insérées.
Donc vous ne devez pas non plus supprimer de block (contentez-vous de vider
le contenu du block si vous voulez le "supprimer").
