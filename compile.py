import argparse
import base64
import os
import re

from jinja2 import Environment, PackageLoader, select_autoescape, Markup

V7 = "7"
V8 = "8"
MED_FANTASY = "Médiéval fantastique"
CAPTAIN_VOODOO = "Capitaine Vaudou"

parser = argparse.ArgumentParser(description="Compile the html, css and js templates to a single html file")
parser.add_argument("output_html", help="The path to the resulting HTML file")
parser.add_argument("--version", help="Version of SimulacreS", choices=[V7, V8], default=V7)
parser.add_argument("--localisation", help="Use localisation of HP and armor (only valid for version 7)",
                    action='store_true')
parser.add_argument("--universe", help="Universe of the adventure", choices=[MED_FANTASY, CAPTAIN_VOODOO, "Autre"],
                    default=MED_FANTASY)
args = parser.parse_args()

regex_background_url = re.compile(r"background(-image)?:url\([\w./:]+\)")


def include_static(name):
    with open(os.path.join(html_dir, name)) as fileobj:
        lines = []
        for line in fileobj.readlines():
            if "# sourceMappingURL=" in line:
                continue
            # Remove links to background images
            lines.append(regex_background_url.sub("", line))
        return Markup("".join(lines))


# Jinja settings

html_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
loader = PackageLoader(__name__, 'templates')
env = Environment(loader=loader, autoescape=select_autoescape(['html', 'xml']))
# This add an include option that do not treat the content of the file as a jinja template
env.globals['include_static'] = include_static

# Font parsing

with open(os.path.join(html_dir, "../font/augusta.regular.ttf"), "rb") as extern_file:
    augusta_font = base64.b64encode(extern_file.read()).decode()

# Build html sheet

template = env.get_template('base.html')
compiled_html = template.render({"augusta_font": augusta_font, "version": args.version,
                                 "localisation": args.localisation and args.version == V7, "universe": args.universe,
                                 "V7": V7, "V8": V8, "captain_voodoo": CAPTAIN_VOODOO, "med_fantasy": MED_FANTASY})

# Replacing external file content

with open(args.output_html, "w") as output_html:
    output_html.write(compiled_html)
