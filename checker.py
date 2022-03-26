"""
    This scripts checks that a sheet produced by compile.py does not generate errors on loading
"""
import argparse
import json
import os
import sys
from urllib.request import pathname2url

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.support.wait import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


def is_sheet_loaded(d: WebDriver):
    return d.execute_script("return typeof sheet_loaded !== 'undefined' && sheet_loaded")


parser = argparse.ArgumentParser(description="Load the sheet in input and checks "
                                             "that no errors are found by sanity checks")
parser.add_argument("input_html", help="The path to the compiled HTML file")
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
    driver.get(f"file:{pathname2url(args.input_html)}")

    wait = WebDriverWait(driver, 10)  # seconds
    wait.until(is_sheet_loaded)

    # Retrieve errors
    error_summary = json.loads(driver.execute_script("return JSON.stringify(sheet.all_errors)"))
    if len(error_summary) == 0 and driver.execute_script("return sheet.has_errors()"):
        print(f"{args.input_html} did not fill the error categories")
        sys.exit(1)

    # Output errors
    has_errors = False
    for error_type, errors in error_summary.items():
        for error in errors:
            if not has_errors:
                print(f"{args.input_html} loads with errors:")
                has_errors = True
            print(f"\t{error_type}: {error}")

    if has_errors:
        sys.exit(1)
    print(f"{args.input_html} loads without error")
