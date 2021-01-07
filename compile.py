import argparse
import base64
import logging
import mimetypes
import os
import re

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
parser.add_argument("-v", "--verbose", help="Increase output verbosity", action="store_true")
args = parser.parse_args()
if args.verbose:
    logging.basicConfig(level=logging.DEBUG)

regex_url = re.compile(r"url\(([\w\\./\-_]+)\)")


def include_static(name):
    def replace_local_urls(match):
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


# Jinja settings

html_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
loader = PackageLoader(__name__, 'templates')
env = Environment(loader=loader, autoescape=select_autoescape(['html', 'xml']))
# This add an include option that do not treat the content of the file as a jinja template
env.globals['include_static'] = include_static

# Parsing fonts

with open(os.path.join(html_dir, "../font/augusta.regular.ttf"), "rb") as extern_file:
    augusta_font = base64.b64encode(extern_file.read()).decode()

with open(os.path.join(html_dir, "../font/linux_libertine.regular.ttf"), "rb") as extern_file:
    ll_font = base64.b64encode(extern_file.read()).decode()

# Build html sheet

template = env.get_template('base.html')
compiled_html = template.render({"augusta_font": augusta_font, "linux_libertine_font": ll_font, "version": args.version,
                                 "localisation": args.localisation and args.version == V7, "universe": args.universe,
                                 "matrix_4x4": args.version == V7 or args.matrix_4x4,
                                 "dual_wielding": args.version == V7 and args.dual_wielding,
                                 "V7": V7, "V8": V8, "captain_voodoo": CAPTAIN_VOODOO, "med_fantasy": MED_FANTASY})

# Replacing external file content

with open(args.output_html, "w") as output_html:
    output_html.write(compiled_html)
