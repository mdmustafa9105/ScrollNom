import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = edgePaths.find(p => fs.existsSync(p));
const evidenceDir = path.resolve('d:\\ScrollNom\\docs\\audits\\creator_studio_evidence');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function reproduceCreatorStudioEmpty() {
  console.log('='.repeat(70));
  console.log('REPRODUCING CREATOR STUDIO BLANK / EMPTY PAGE BUG');
  console.log('='.repeat(70));

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  // Listen to browser console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('  ❌ BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('  🔥 UNCAUGHT PAGE EXCEPTION:', error.message);
  });

  try {
    const creatorToken = 'fb_token_creatorA::creatorA%40scrollnom.com';
    const syncRes = await fetch('http://localhost:5000/api/users/sync', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${creatorToken}` }
    });
    const syncData = await syncRes.json();
    console.log('  Sync Creator A User ID:', syncData.data?.user?.id);

    // Enable Creator Mode for Creator A on backend
    await fetch('http://localhost:5000/api/users/profile', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${creatorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCreator: true })
    });

    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    // Set authenticated state in localStorage
    await page.evaluate((u) => {
      window.localStorage.setItem('scrollnom_user', JSON.stringify({
        id: u.id,
        firebaseUid: u.id,
        name: 'Creator A User',
        email: 'creatorA@scrollnom.com',
        username: 'creator_a',
        handle: '@creator_a',
        isLoggedIn: true,
        isCreator: true,
        earningsThisMonth: '₹0',
        phone: '+91 98765 43210',
        address: { label: 'Home', street: '100 Feet Rd', area: 'Indiranagar, Bengaluru', pincode: '560038' }
      }));
    }, { id: syncData.data?.user?.id || 'creatorA' });

    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Open Profile / Creator Studio
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      const acc = buttons.find(b => b.textContent.includes('My Account') || b.textContent.includes('Creator Studio'));
      if (acc) acc.click();
    });
    await sleep(2500);

    await shot(page, 'creator_studio_empty_before_fix');

  } catch (err) {
    console.error('Reproduction Error:', err.message);
  } finally {
    await browser.close();
  }
}

reproduceCreatorStudioEmpty();
