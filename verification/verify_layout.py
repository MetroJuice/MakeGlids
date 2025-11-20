
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000')
    page.set_input_files('input[type="file"]', 'image.png')
    page.wait_for_selector('#canvas')
    page.screenshot(path='verification/screenshot.png')
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
