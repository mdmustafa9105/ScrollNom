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

const outputDir = path.resolve('C:\\Users\\Mohammed Mustafa\\.gemini\\antigravity-ide\\brain\\21f6d477-48f3-4a63-bb8f-aaa02e951b0f\\phase12_screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function capturePhase12Screenshots() {
  console.log('📸 Capturing Phase 12 Time Belt & Contextual Discovery Screenshots...');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. NOMMLY - TIME BELT OVERLAY BADGE
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.toLowerCase().includes('nommly'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, '01_desktop_nommly_time_belt.png') });

  // 2. TOGGLE BROKEN BELT MODE
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('BREAK BELT') || b.textContent.includes('BROKEN BELT'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outputDir, '02_desktop_broken_belt_active.png') });

  // 3. EXPLORE - NEARBY BENGALURU SUBTAB
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.toLowerCase().includes('explore'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Nearby'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outputDir, '03_desktop_explore_nearby_bengaluru.png') });

  // 4. MOBILE VIEWPORT (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, '04_mobile_time_belt.png') });

  await browser.close();
  console.log('✅ Phase 12 Screenshots captured in:', outputDir);
}

capturePhase12Screenshots().catch(console.error);
