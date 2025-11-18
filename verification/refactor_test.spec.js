const { test, expect } = require('@playwright/test');

test('refactored image grid mask app', async ({ page }) => {
  await page.goto('http://localhost:8000');

  // Upload an image
  const imagePath = 'image.png'; // Assuming the image is in the parent directory
  await page.setInputFiles('input[type="file"]', imagePath);

  // Wait for the image to be processed and displayed
  await page.waitForSelector('#canvas');

  // Change grid size
  await page.fill('input[type="number"]', '15');

  // Take a screenshot to verify the UI
  await page.screenshot({ path: 'verification/refactored-ui-screenshot.png' });

  // Handle the download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#downloadButton'),
  ]);

  // Save the downloaded file
  const downloadPath = 'verification/refactored-downloaded-image.png';
  await download.saveAs(downloadPath);

  // Verify the file was downloaded
  const fs = require('fs');
  expect(fs.existsSync(downloadPath)).toBeTruthy();
});
