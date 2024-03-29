import argparse
import base64
import logging
import mimetypes
import re
import shlex
import subprocess
import sys
from typing import List, Dict
from pathlib import Path

import pyjson5
from bs4 import BeautifulSoup
from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup

SRC_DIR = Path(__file__).absolute().parent
TEMPLATE_DIR = SRC_DIR / "templates"

V7 = "7"
V8 = "8"
MED_FANTASY = "Médiéval fantastique"
CAPTAIN_VOODOO = "Capitaine Vaudou"

parser = argparse.ArgumentParser(description="Compile the html, css and js templates to a single html file")
parser.add_argument("output_html", help="The path to the resulting HTML file")
parser.add_argument("--version", help="Version of SimulacreS", choices=[V7, V8], default=V7)
parser.add_argument("--localisation", help="Use localisation of HP and armor (only valid for version 7)",
                    action='store_true')
parser.add_argument("--localisation-target",
                    help="Use localisation of roll effects (only valid for version 7 and implied by --localisation)",
                    action='store_true')
parser.add_argument("--dual-wielding", help="Use the non official rules of dual wielding (only valid for version 7)",
                    action="store_true")
parser.add_argument("--tomte-magic", help="Use the non official rules of tomte magic"
                                          " (only valid for version 7 and medieval fantasy universe)",
                    action="store_true")
parser.add_argument("--warrior-powers", help="Use the non official rules of warrior's ways (only valid for version 7)",
                    action="store_true")
parser.add_argument("--matrix-4x4", help="Add instincts and desire to the stat matrix (only valid for version 8)",
                    action='store_true')
parser.add_argument("--universe", help="Universe of the adventure", choices=[MED_FANTASY, CAPTAIN_VOODOO, "Autre"],
                    default=MED_FANTASY)
parser.add_argument("--intermediate-discovery",
                    help="Base rules of SimulacreS with some simplifications like simpler "
                         " adventure point investment and non-detailed talents (only supported for version 8)",
                    action='store_true')
parser.add_argument("--discovery", help="Discovery mode of SimulacreS (only supported for version 8)",
                    action='store_true')
parser.add_argument("--plugin", help="Add the plugin at the following path", action='extend', nargs="*", default=[])
parser.add_argument("--base-template", help="Path of to the html template inside the template folder",
                    default="base_pc.html")
parser.add_argument("--update-js-command", help="The command line to run to update the javascript dependencies",
                    default="yarn")
parser.add_argument("-d", "--debug", help="Build the sheet with debug info such sanity checks on every load",
                    action="store_true")
parser.add_argument("-v", "--verbose", help="Increase output verbosity", action="store_true")
args = parser.parse_args()
if args.verbose:
    logging.basicConfig(level=logging.DEBUG)

# Import libraries if not already done
subprocess.run(args.update_js_command, check=True)

regex_url = re.compile(r"url\(([\w\\./\-_]+)\)")


def include_static(name: str) -> Markup:
    def replace_local_urls(match: re.Match) -> str:
        path = TEMPLATE_DIR / Path(name).parent / match.group(1)
        if not path.exists():
            logging.warning("Path '{}' does not exists".format(path))
            return ""
        logging.debug("Replacing '{}' by its content found at '{}'".format(match.group(0), path))
        mime, encoding = mimetypes.guess_type(path, False)
        with open(path, "rb") as local_file:
            return "url(data:{}{};base64,{})" \
                .format(mime, ";charset={}".format(encoding) if encoding is not None else "",
                        base64.b64encode(local_file.read()).decode())

    with (html_dir / name).open(encoding="utf8") as fileobj:
        lines = []
        for line in fileobj.readlines():
            if "# sourceMappingURL=" in line:
                continue
            # Replace links to background images and fonts
            lines.append(regex_url.sub(replace_local_urls, line))
        return Markup("".join(lines))


# Plugin parsing

def process_plugins(plugins: List[str]) -> Dict[str, List[str]]:
    buttons = []
    tabs = []
    css_blocks = []
    js_blocks = []
    logging.debug("Adding plugins " + ", ".join(plugins))
    for plugin in plugins:
        with open(plugin, encoding="utf-8") as plugin_obj:
            bs_parser = BeautifulSoup(plugin_obj.read(), features="html5lib")
            for button in bs_parser.find_all(class_="plugin-button"):
                buttons.append(str(button))
            for tab in bs_parser.find_all(class_="plugin-tab"):
                tabs.append(str(tab))
            for css in bs_parser.find_all(class_="plugin-css"):
                css_blocks.append(str(css))
            for js in bs_parser.find_all(class_="plugin-js"):
                js_blocks.append(str(js))

    return {
        "buttons": buttons,
        "tabs": tabs,
        "css_blocks": css_blocks,
        "js_blocks": js_blocks
    }


# Jinja settings

html_dir = SRC_DIR / "templates"
loader = FileSystemLoader(html_dir)
env = Environment(loader=loader, autoescape=select_autoescape(['html', 'xml']))
# This adds an include option that do not treat the content of the file as a jinja template
env.globals['include_static'] = include_static
# Add {% do <statement> %}
env.add_extension("jinja2.ext.do")

# Parsing fonts, audio and bestiary

params = {}
for file_path in (html_dir / "../font").rglob("*.ttf"):
    with file_path.open("rb") as extern_file:
        params[file_path.stem.split(".")[0] + "_font"] = base64.b64encode(extern_file.read()).decode()

for file_path in (html_dir / "../audio").rglob("*.wav"):
    with file_path.open("rb") as extern_file:
        params.setdefault("audios", []).append(base64.b64encode(extern_file.read()).decode())

with (SRC_DIR / "bestiary.json5").open(encoding="utf-8") as file:
    params["bestiary"] = file.read() if args.universe == MED_FANTASY else "[]"
    pyjson5.loads(params["bestiary"])  # Parse check

# Git tag version

try:
    tag_version = subprocess.check_output(shlex.split("git describe --tags"), cwd=SRC_DIR, universal_newlines=True)[:-1]
    base_tag_version = tag_version.split("-")[0]
except subprocess.CalledProcessError:
    logging.error("Cannot get version of the code")
    sys.exit(1)

# Build html sheet

params.update({
    "version": args.version,
    "localisation": args.localisation and args.version == V7,
    "localisation_target": args.localisation or args.localisation_target and args.version == V7,
    "universe": args.universe,
    "matrix_4x4": args.version == V7 or args.matrix_4x4,
    "dual_wielding": args.version == V7 and args.dual_wielding,
    "tomte_magic": args.version == V7 and args.tomte_magic and args.universe == MED_FANTASY,
    "warrior_powers": args.version == V7 and args.warrior_powers,
    "discovery": args.discovery and args.version == V8,
    "intermediate_discovery": (args.discovery or args.intermediate_discovery) and args.version == V8,
    "V7": V7, "V8": V8, "captain_voodoo": CAPTAIN_VOODOO, "med_fantasy": MED_FANTASY,
    "plugins": process_plugins(args.plugin), "tag_version": tag_version, "base_tag_version": base_tag_version,
    "npc_grid": False, "debug": args.debug, "compilation_args": vars(args),
})

# Find release name

params["base_sheet_name"] = ""
if Path(args.base_template).name == "base_npc_grid.html":
    params["base_sheet_name"] = "simulacres_v7_npc_grid.html"
    params["npc_grid"] = True
elif params["version"] == V7:
    if params["localisation"]:
        if params["dual_wielding"] and params["universe"] == MED_FANTASY:
            params["base_sheet_name"] = "simulacres_v7_localisation_deux_armes_fiche_perso.html"
        elif params["universe"] == MED_FANTASY:
            params["base_sheet_name"] = "simulacres_v7_localisation_fiche_perso.html"
    else:
        params["base_sheet_name"] = "simulacres_v7_fiche_perso.html"
else:  # V8
    matrix_text = "_4x4" if params["matrix_4x4"] else ""
    if params["universe"] == MED_FANTASY:
        params["base_sheet_name"] = "simulacres_v8_fiche_perso{}.html".format(matrix_text)
    elif params["universe"] == CAPTAIN_VOODOO:
        params["base_sheet_name"] = "simulacres_v8_fiche_perso_capitaine_vaudou{}.html".format(matrix_text)
    elif params["universe"] == "Autre":
        if params["discovery"]:
            params["base_sheet_name"] = "simulacres_v8_fiche_perso_minimale_decouverte{}.html".format(matrix_text)
        elif params["intermediate_discovery"]:
            params["base_sheet_name"] = "simulacres_v8_fiche_perso_minimale_decouverte_intermediaire{}.html" \
                .format(matrix_text)
        else:
            params["base_sheet_name"] = "simulacres_v8_fiche_perso_minimale{}.html".format(matrix_text)

template = env.get_template(args.base_template)
compiled_html = template.render(params)

# Replacing external file content

with Path(args.output_html).open("w", encoding="utf8") as output_html:
    output_html.write(compiled_html)
