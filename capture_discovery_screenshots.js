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

const outputDir = path.resolve('C:\\Users\\Mohammed Mustafa\\.gemini\\antigravity-ide\\brain\\21f6d477-48f3-4a63-bb8f-aaa02e951b0f\\discovery_screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function captureDiscoveryScreenshots() {
  console.log('📸 Capturing User Discovery Screenshots...');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. DESKTOP GUEST SEARCH (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Navigate to Explore
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.toLowerCase().includes('explore'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Click Users & Creators Tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Users & Creators'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outputDir, '01_desktop_guest_users_tab.png') });

  // Type Search "mohammed"
  await page.focus('input[placeholder*="Search"]');
  await page.keyboard.type('mohammed');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outputDir, '02_desktop_guest_user_search_results.png') });

  // Click User Card to open UserProfileModal
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h4'));
    const card = cards.find(h => h.textContent.includes('Mohammed Mustafa'));
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outputDir, '03_desktop_public_profile_modal.png') });

  // 2. MOBILE GUEST SEARCH (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.toLowerCase().includes('explore'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.focus('input[placeholder*="Search"]');
  await page.keyboard.type('mohammed');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outputDir, '04_mobile_guest_user_search_results.png') });

  await browser.close();
  console.log('✅ Discovery Screenshots captured in:', outputDir);
}

captureDiscoveryScreenshots().catch(console.error);
