import argparse
import base64
import os

from jinja2 import Environment, PackageLoader, select_autoescape, Markup

parser = argparse.ArgumentParser(description="Compile the html, css and js templates to a single html file")
parser.add_argument("output_html", help="The path to the resulting HTML file")
parser.add_argument("--localisation", help="Use localisation of HP and armor", action='store_true')
args = parser.parse_args()


def include_static(name):
    with open(os.path.join(html_dir, name)) as fileobj:
        return Markup("".join([line for line in fileobj.readlines() if "# sourceMappingURL=" not in line]))


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
compiled_html = template.render({"augusta_font": augusta_font, "localisation": args.localisation})

# Replacing external file content

with open(args.output_html, "w") as output_html:
    output_html.write(compiled_html)
