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

if (!executablePath) {
  console.error('No Edge/Chrome executable found!');
  process.exit(1);
}

const outputDir = 'C:\\Users\\Mohammed Mustafa\\.gemini\\antigravity-ide\\brain\\79aeaaae-9161-4682-b228-4c205d14a61d\\screenshots';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '820x1180', width: 820, height: 1180 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 }
];

async function clickNav(page, target) {
  await page.evaluate((tgt) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => {
      const txt = b.textContent ? b.textContent.toLowerCase() : '';
      const aria = b.getAttribute('aria-label') ? b.getAttribute('aria-label').toLowerCase() : '';
      if (tgt === 'home') return txt.includes('home');
      if (tgt === 'explore') return txt.includes('explore');
      if (tgt === 'nommly') return txt.includes('nommly') || aria.includes('nommly');
      if (tgt === 'cart') return txt.includes('cart');
      if (tgt === 'profile') return txt.includes('profile') || txt.includes('creator');
      return false;
    });
    if (btn) btn.click();
  }, target);
  await new Promise(r => setTimeout(r, 600));
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const vp of viewports) {
    console.log(`\n--- Capturing viewport ${vp.name} ---`);
    await page.setViewport({ width: vp.width, height: vp.height });

    // 1. Home
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, `home_${vp.name}.png`) });

    // 2. Explore
    await clickNav(page, 'explore');
    await page.screenshot({ path: path.join(outputDir, `explore_${vp.name}.png`) });

    // 3. Nommly
    await clickNav(page, 'nommly');
    await page.screenshot({ path: path.join(outputDir, `nommly_${vp.name}.png`) });

    // 4. Cart
    await clickNav(page, 'cart');
    await page.screenshot({ path: path.join(outputDir, `cart_${vp.name}.png`) });

    // 5. Profile
    await clickNav(page, 'profile');
    await page.screenshot({ path: path.join(outputDir, `profile_${vp.name}.png`) });
  }

  // Specific States
  console.log('\n--- Capturing Specific Interactive States ---');
  await page.setViewport({ width: 1440, height: 900 });

  // Auth Modal Login
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('sign in'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outputDir, 'auth_modal_login.png') });

  // Auth Modal Signup
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('create an account'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outputDir, 'auth_modal_signup.png') });

  // Order Flow: Add Item -> Cart
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && (b.textContent.includes('ADD TO CART') || b.textContent.includes('ADD DISH')));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await clickNav(page, 'cart');
  await page.screenshot({ path: path.join(outputDir, 'cart_with_items.png') });

  // Food on Friend Enabled
  await page.evaluate(() => {
    const chk = document.querySelector('input[type="checkbox"]');
    if (chk) chk.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outputDir, 'food_on_friend_enabled.png') });

  // Food on Friend Requested
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Request'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outputDir, 'food_on_friend_requested.png') });

  // Food on Friend Simulated View
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes("Friend's View"));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outputDir, 'food_on_friend_simulated.png') });

  // Creator Mode Toggle
  await clickNav(page, 'profile');
  await page.evaluate(() => {
    const chks = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    if (chks.length > 0) chks[0].click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outputDir, 'profile_creator_mode.png') });

  await browser.close();
  console.log('Successfully captured all screens and states!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
