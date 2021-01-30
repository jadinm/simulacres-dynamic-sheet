import argparse
import base64
import logging
import mimetypes
import os
import re
import shlex
import subprocess
import sys
from typing import List, Dict

from bs4 import BeautifulSoup
from jinja2 import Environment, PackageLoader, select_autoescape, Markup

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(SRC_DIR, "templates")

V7 = "7"
V8 = "8"
MED_FANTASY = "Médiéval fantastique"
CAPTAIN_VOODOO = "Capitaine Vaudou"

parser = argparse.ArgumentParser(description="Compile the html, css and js templates to a single html file")
parser.add_argument("output_html", help="The path to the resulting HTML file")
parser.add_argument("--version", help="Version of SimulacreS", choices=[V7, V8], default=V7)
parser.add_argument("--localisation", help="Use localisation of HP and armor (only valid for version 7)",
                    action='store_true')
parser.add_argument("--dual-wielding", help="Use the non official rules of dual wielding (only valid for version 7)",
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
parser.add_argument("-v", "--verbose", help="Increase output verbosity", action="store_true")
args = parser.parse_args()
if args.verbose:
    logging.basicConfig(level=logging.DEBUG)

# Import libraries if not already done
subprocess.run("yarn", check=True)

regex_url = re.compile(r"url\(([\w\\./\-_]+)\)")


def include_static(name: str) -> Markup:
    def replace_local_urls(match: re.Match) -> str:
        path = os.path.join(os.path.abspath(os.path.join(TEMPLATE_DIR, os.path.dirname(name))), match.group(1))
        if not os.path.exists(path):
            logging.warning("Path '{}' does not exists".format(path))
            return ""
        logging.debug("Replacing '{}' by its content found at '{}'".format(match.group(0), path))
        mime, encoding = mimetypes.guess_type(path, False)
        with open(path, "rb") as local_file:
            return "url(data:{}{};base64,{})" \
                .format(mime, ";charset={}".format(encoding) if encoding is not None else "",
                        base64.b64encode(local_file.read()).decode())

    with open(os.path.join(html_dir, name)) as fileobj:
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
        with open(plugin) as plugin_obj:
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

html_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
loader = PackageLoader(__name__, 'templates')
env = Environment(loader=loader, autoescape=select_autoescape(['html', 'xml']))
# This add an include option that do not treat the content of the file as a jinja template
env.globals['include_static'] = include_static

# Parsing fonts

params = {}
for root, dirs, filenames in os.walk(os.path.join(html_dir, "../font")):
    for filename in filenames:
        if filename[-4:] != ".ttf":
            continue
        with open(os.path.join(root, filename), "rb") as extern_file:
            params[filename.split(".")[0] + "_font"] = base64.b64encode(extern_file.read()).decode()

# Git tag version

try:
    tag_version = subprocess.check_output(shlex.split("git describe --tags"), cwd=SRC_DIR, universal_newlines=True)[:-1]
except subprocess.CalledProcessError:
    logging.error("Cannot get version of the code")
    sys.exit(1)

# Build html sheet

params.update({
    "version": args.version, "localisation": args.localisation and args.version == V7, "universe": args.universe,
    "matrix_4x4": args.version == V7 or args.matrix_4x4,
    "dual_wielding": args.version == V7 and args.dual_wielding,
    "discovery": args.discovery and args.version == V8,
    "intermediate_discovery": (args.discovery or args.intermediate_discovery) and args.version == V8,
    "V7": V7, "V8": V8, "captain_voodoo": CAPTAIN_VOODOO, "med_fantasy": MED_FANTASY,
    "plugins": process_plugins(args.plugin), "tag_version": tag_version, "compilation_args": vars(args)
})
template = env.get_template('base.html')
compiled_html = template.render(params)

# Replacing external file content

with open(args.output_html, "w") as output_html:
    output_html.write(compiled_html)
