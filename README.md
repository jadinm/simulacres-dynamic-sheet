# Simulacres Dynamic Sheet

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
