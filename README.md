# Simulacres Dynamic Sheet

## Getting started

To produce the character sheet, you need to first load javascript and css libraries
with [yarn](https://classic.yarnpkg.com/en/docs/install/)
by executing the following command in the root of the project:

```console
$ yarn
```

Then you can create the HTML file with all the code bundled by executing:

```console
$ python3 merge_external_files.py base.html simulacres_fiche_perso.html
```

## Plugins

You can insert new tabs into the character sheet by creating and importing plugins.

### Import a plugin

You have to import any html file from the plugin folder.
At the moment, we have the following plugins:

- [Example plugin](plugins/plugin_example.html): testing and documentation.

### Update a plugin

You can update the plugin by importing the new version in your character sheet.

### Build your own plugin

We fix some conventions for the plugins.
Each component needs to include an appropriate class:

- The button for the tab: ``plugin-button``
- The tab itself: ``plugin-tab``
- The associated css: ``plugin-css``
- The associated javascript: ``plugin-js``

You can have multiple blocks of each type.
However, each component needs to have a different id.
To guarantee the uniqueness of your ids, include the name of your plugin into it
and prefix the id by ``plugin-``.

You also need to put an id for each input field that you define.
Otherwise, when updating your plugin, user data won't be copied.
You have to include the name of your plugin into it and prefix the id by ``plugin-``.

#### Important: once you release your plugin, do not change any id

If you change input field ids, this will cause data loss for these fields.
If you change the component ids, the old components won't be replaced by the new ones
but the new components will still be replaced.
