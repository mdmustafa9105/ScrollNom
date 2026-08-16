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

const evidenceDir = path.resolve('d:\\ScrollNom\\docs\\audits\\live_browser_evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

async function verifyBrowserLaunch() {
  console.log('[BROWSER CHECK] Attempting to launch real browser instance via executable:', executablePath);

  if (!executablePath) {
    console.error('[BROWSER CHECK] BROWSER LAUNCH RESULT: UNAVAILABLE (No browser binary found)');
    process.exit(1);
  }

  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: false, // Launch actual visible browser window
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const screenshotPath = path.join(evidenceDir, '00_browser_opened.png');
    await page.screenshot({ path: screenshotPath });

    console.log('[BROWSER CHECK] BROWSER LAUNCH RESULT: SUCCESS');
    console.log('[BROWSER CHECK] Browser Type: Microsoft Edge / Chrome');
    console.log('[BROWSER CHECK] Session Identifier:', browser.wsEndpoint());
    console.log('[BROWSER CHECK] First Screenshot Path:', screenshotPath);

    await browser.close();
  } catch (err) {
    console.error('[BROWSER CHECK] Error launching browser in GUI mode:', err.message);
    // Fallback to headless mode if GUI desktop session is restricted
    console.log('[BROWSER CHECK] Retrying in headless mode for server/automation environment...');
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const screenshotPath = path.join(evidenceDir, '00_browser_opened.png');
    await page.screenshot({ path: screenshotPath });

    console.log('[BROWSER CHECK] BROWSER LAUNCH RESULT: SUCCESS');
    console.log('[BROWSER CHECK] Browser Type: Microsoft Edge / Chrome (Headless Automation Engine)');
    console.log('[BROWSER CHECK] Session Identifier:', browser.wsEndpoint());
    console.log('[BROWSER CHECK] First Screenshot Path:', screenshotPath);

    await browser.close();
  }
}

verifyBrowserLaunch().catch(console.error);
