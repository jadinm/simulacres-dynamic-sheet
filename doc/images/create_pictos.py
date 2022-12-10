#!/bin/env python3
# dumb script to generate all the symbols from images.html and the file to
# include in RST to be able to use it - by Karl Karas

import re
import sys
from pathlib import Path
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

my_dir = Path(__file__).absolute().parent
images_html_path = my_dir / '../../templates/images.html'
rst_path = my_dir / '../pictos.rst'

svgs = ''
with images_html_path.open('r', encoding="utf-8") as f:
    svgs = svgs + f.read()

svg_header = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
svg_dir = Path('svgs')
if not svg_dir.is_dir():
    try:
        svg_dir.mkdir()
    except:
        sys.exit(1)

p_svg = re.compile(r'(?P<svg><!-- [^>]* -->[^<]*\n[^<]*<svg id="(?P<name>[^"]*)".*?</svg>)', re.DOTALL)
with rst_path.open('w', encoding="utf-8") as rst:
    for svg in p_svg.findall(svgs):
        svg_data = svg_header + '\n' + svg[0]
        svg_name = svg[1][4:]
        svg_path = svg_dir / (svg_name + '.svg')
        png_path = svg_dir / (svg_name + '.png')
        rst.write(f"""
.. |{svg_name}| image:: images/{png_path}
            :height: 2ex
            :align: bottom""")
        with svg_path.open('w', encoding="utf-8") as f:
            f.write(svg_data)

        drawing = svg2rlg(svg_path)
        renderPM.drawToFile(drawing, str(png_path), fmt="PNG")

