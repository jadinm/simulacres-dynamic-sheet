import argparse
import re
import os


parser = argparse.ArgumentParser(description="Merge the JS and CSS libraries in a single html file")
parser.add_argument("input_html", help="The path to the base HTML file")
parser.add_argument("output_html", help="The path to the resulting HTML file")
args = parser.parse_args()

output_lines = []


def minified_path(path):
    """Return the path to the minified version of the file if any exists"""

    elems = path.split(".")
    extension = ".min." + elems[-1]
    min_file_path = ".".join(elems[:-1]) + extension
    print(min_file_path)
    return min_file_path if os.path.exists(min_file_path) else path


with open(args.input_html, "r") as base_html:
    js_pattern = re.compile(r".*<script .*src=[\"'](.*)[\"'].*>.*")
    css_pattern = re.compile(r".*<link rel=[\"']stylesheet[\"'] .*href=[\"'](.*)[\"'].*>.*")
    header = True

    for input_line in base_html:
        js_match = js_pattern.match(input_line)
        css_match = css_pattern.match(input_line)
        if js_match is not None and os.path.exists(js_match.group(1)):
            extern_file_path = minified_path(js_match.group(1))
            with open(extern_file_path, "r") as extern_file:
                output_lines.append("<script>")
                output_lines.extend(extern_file.readlines())
                output_lines.append("</script>\n")
        elif css_match is not None and os.path.exists(css_match.group(1)):
            extern_file_path = minified_path(css_match.group(1))
            with open(extern_file_path, "r") as extern_file:
                output_lines.append("<style>")
                output_lines.extend(extern_file.readlines())
                output_lines.append("</style>\n")
        else:
            output_lines.append(input_line)

with open(args.output_html, "w") as output_html:
    output_html.writelines(output_lines)
