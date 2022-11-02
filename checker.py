"""
    This scripts checks that a sheet produced by compile.py does not generate errors on loading or on importing
"""
import argparse
import json
import os
import sys
from typing import Dict, Any
from urllib.request import pathname2url

import pyjson5
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.support.wait import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


def is_sheet_loaded(d: WebDriver):
    return d.execute_script("return typeof sheet_loaded !== 'undefined' && sheet_loaded")


def is_sheet_imported(d: WebDriver):
    return d.execute_script("return typeof sheet_imported !== 'undefined' && sheet_imported")


def print_errors(d: WebDriver, prefix_phrase: str):
    # Retrieve errors
    error_summary = json.loads(d.execute_script("return JSON.stringify(sheet.all_errors)"))
    if len(error_summary) == 0 and d.execute_script("return sheet.has_errors()"):
        print(f"{prefix_phrase} did not fill the error categories")
        sys.exit(1)

    # Output errors
    has_errors = False
    for error_type, errors in error_summary.items():
        for error in errors:
            if not has_errors:
                print(f"{prefix_phrase} triggered errors:")
                has_errors = True
            print(f"\t{error_type}: {error}")

    if has_errors:
        sys.exit(1)


def load_sheet(d: WebDriver, input_html: str):
    # Trigger page loading
    d.get(f"file:{pathname2url(input_html)}")

    # Wait for loading
    wait = WebDriverWait(d, 10)  # seconds
    wait.until(is_sheet_loaded)

    # Retrieve and print errors
    print_errors(d, f"Loading {input_html}")
    print(f"{input_html} loads without error")


def import_data(d: WebDriver, input_html: str, file_path: str, data: Dict[str, Any]):
    # Trigger data import
    js_string = pyjson5.dumps(data).replace("\\", "\\\\").replace("'", "\\'")
    d.execute_script(f"testing_sheet = true; sheet.import(JSON.parse('{js_string}'), true);")

    # Retrieve and print errors
    d.execute_script(f"if (sheet.has_errors()) sheet.build_import_error_summary();")
    print_errors(d, f"Importing {file_path} in {input_html}")
    print(f"Importing {file_path} in {input_html} without error")


parser = argparse.ArgumentParser(description="Load the sheet in input and checks "
                                             "that no errors are found by sanity checks")
parser.add_argument("input_html", help="The path to the compiled HTML file")
parser.add_argument("test_folder", help="The folder containing JSON files of data to be imported for checks")
parser.add_argument("--github-token",
                    help="A github token to prevent throttling by GitHub "
                         "to 60 requests per hour for unauthenticated users")
args = parser.parse_args()

args.input_html = os.path.abspath(args.input_html)
if not os.path.exists(args.input_html) or not os.path.isfile(args.input_html):
    print(f"Cannot find {args.input_html}")
    sys.exit(1)

if args.github_token:
    os.environ["GH_TOKEN"] = args.github_token

driver_options = Options()
driver_options.add_argument("--headless")

# Automatically fetches the appropriate driver
with webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=driver_options) as driver:
    if not os.path.exists(args.test_folder):
        load_sheet(driver, args.input_html)
        print("No data sample to test")
        sys.exit(0)

    if not os.path.isdir(args.test_folder):
        print(f"{args.test_folder} is not a folder")
        sys.exit(1)

    # Load and import data of each example
    for root, dirs, files in os.walk(args.test_folder):
        for json_file in files:
            json_path = os.path.join(root, json_file)
            print(f"Testing file {json_path}")
            with open(json_path) as json_file_object:
                load_sheet(driver, args.input_html)
                try:
                    json_data = json.load(json_file_object)
                except ValueError as e:
                    print(f"{json_path} is not a valid JSON file: {e}")
                    sys.exit(1)
                import_data(driver, args.input_html, json_path, json_data)
