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

async function runCapabilityProof() {
  console.log('[PROOFS RUNNER] Launching browser process from executable:', executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // STEP 3: NAVIGATE TO LOCALHOST:3000
  console.log('[PROOFS RUNNER] Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const pathLaunch = path.join(evidenceDir, '00_browser_launch.png');
  await page.screenshot({ path: pathLaunch });
  console.log('[PROOFS RUNNER] Saved screenshot 00_browser_launch.png at:', pathLaunch);

  // STEP 5: REAL UI INTERACTION (CLICK SIGN IN BUTTON)
  console.log('[PROOFS RUNNER] Finding and clicking Sign In button via browser DOM...');
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const signInBtn = btns.find(b => b.textContent.toLowerCase().includes('sign in') || b.textContent.toLowerCase().includes('login'));
    if (signInBtn) {
      signInBtn.click();
      return true;
    }
    return false;
  });

  console.log('[PROOFS RUNNER] Sign In button click result:', clicked);
  await new Promise(r => setTimeout(r, 1200));

  const pathClicked = path.join(evidenceDir, '01_login_button_clicked.png');
  await page.screenshot({ path: pathClicked });
  console.log('[PROOFS RUNNER] Saved screenshot 01_login_button_clicked.png at:', pathClicked);

  await browser.close();
  console.log('[PROOFS RUNNER] Capability proof execution complete!');
}

runCapabilityProof().catch(console.error);
