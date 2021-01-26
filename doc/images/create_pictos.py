#!/bin/env python3
# dumb script to generate all the symbols from images.html and the file to
# inclide in RST to be able to use it - by Karl Karas

import os
import re
import sys
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

my_dir = os.path.dirname(os.path.abspath(__file__))
images_html_path = os.path.join(my_dir, '../../templates/images.html')
rst_path = os.path.join(my_dir, '../pictos.rst')

svgs = ''
with open(images_html_path, 'r') as f:
    svgs = svgs + f.read()

svg_header = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
svg_dir = 'svgs'
if not os.path.isdir(svg_dir):
    try:
        os.mkdir(svg_dir)
    except:
        sys.exit(1)

p_svg = re.compile(r'(?P<svg><!-- [^>]* -->[^<]*\n[^<]*<svg id="(?P<name>[^"]*)".*?</svg>)', re.DOTALL)
with open(rst_path, 'w') as rst:
    for svg in p_svg.findall(svgs):
        svg_data = svg_header + '\n' + svg[0]
        svg_name = svg[1][4:]
        svg_path = os.path.join(svg_dir, svg_name + '.svg')
        png_path = os.path.join(svg_dir, svg_name + '.png')
        rst.write(f"""
.. |{svg_name}| image:: images/{png_path}
            :height: 2ex
            :align: bottom""")
        with open(svg_path, 'w') as f:
            f.write(svg_data)

        drawing = svg2rlg(svg_path)
        renderPM.drawToFile(drawing, png_path, fmt="PNG")

