
from playwright.sync_api import sync_playwright
from PIL import Image
import os

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000')

    # Upload the image
    page.set_input_files('input[type="file"]', 'image.png')
    page.wait_for_selector('#canvas')

    # Start waiting for the download before clicking the button
    with page.expect_download() as download_info:
        page.click('#downloadButton')

    download = download_info.value
    download_path = 'verification/downloaded_image.png'
    download.save_as(download_path)

    # Get dimensions of original and downloaded images
    original_image = Image.open('image.png')
    downloaded_image = Image.open(download_path)

    original_dims = original_image.size
    downloaded_dims = downloaded_image.size

    print(f"Original image dimensions: {original_dims}")
    print(f"Downloaded image dimensions: {downloaded_dims}")

    # Assert that the dimensions are the same
    assert original_dims == downloaded_dims, "Downloaded image dimensions do not match original"

    # Take a final screenshot of the UI
    page.screenshot(path='verification/final_ui.png')

    browser.close()
    print("Verification successful: Downloaded image has the correct resolution.")

with sync_playwright() as playwright:
    run(playwright)
