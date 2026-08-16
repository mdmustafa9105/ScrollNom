import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

let executablePath = edgePaths.find(p => fs.existsSync(p));

const outputDir = path.resolve('C:\\Users\\Mohammed Mustafa\\.gemini\\antigravity-ide\\brain\\21f6d477-48f3-4a63-bb8f-aaa02e951b0f\\phase10_screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function capturePhase10Screenshots() {
  console.log('📸 Capturing Phase 10 Bengaluru & Social Screenshots...');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. DESKTOP HOME FEED (1440x900) - Bengaluru Location Pill
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outputDir, '01_desktop_home_bengaluru_location.png') });

  // 2. DESKTOP EXPLORE PAGE (1440x900) - Food & Beverages Category Pills
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.toLowerCase().includes('explore'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outputDir, '02_desktop_explore_categories.png') });

  // Click "Beverages" Category Pill
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Beverages'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outputDir, '03_desktop_beverages_filter.png') });

  // 3. MOBILE VIEWPORT (390x844) - Bengaluru Header & Mobile Navigation
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outputDir, '04_mobile_home_bengaluru.png') });

  await browser.close();
  console.log('✅ Phase 10 Screenshots captured in:', outputDir);
}

capturePhase10Screenshots().catch(console.error);
