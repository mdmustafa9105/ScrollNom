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

const outputDir = path.resolve('C:\\Users\\Mohammed Mustafa\\.gemini\\antigravity-ide\\brain\\21f6d477-48f3-4a63-bb8f-aaa02e951b0f\\phase11_screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function capturePhase11Screenshots() {
  console.log('📸 Capturing Phase 11 Real Order & Live Delivery Screenshots...');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. RESTAURANT SCREEN - EMPTY STATE (No incoming orders)
  await page.goto('http://localhost:3000/?role=restaurant', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, '01_restaurant_empty_state.png') });

  // 2. RIDER SCREEN - EMPTY STATE (No active deliveries)
  await page.goto('http://localhost:3000/?role=rider', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, '02_rider_empty_state.png') });

  // 3. MOBILE RIDER VIEWPORT (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/?role=rider', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, '03_mobile_rider_empty_state.png') });

  await browser.close();
  console.log('✅ Phase 11 Screenshots captured in:', outputDir);
}

capturePhase11Screenshots().catch(console.error);
