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

const outputDir = path.resolve('C:\\Users\\Mohammed Mustafa\\.gemini\\antigravity-ide\\brain\\21f6d477-48f3-4a63-bb8f-aaa02e951b0f\\onboarding_fix_screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function verifyOnboardingFix() {
  console.log('🌐 --- REAL BROWSER ONBOARDING STEP TRANSITION VERIFICATION --- 🌐\n');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. OPEN APP
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // 2. NAVIGATE TO PROFILE AND CLICK SIGN IN
  console.log('1. Navigating to Profile / Auth Page...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.toLowerCase().includes('profile'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Sign In / Create Account') || b.textContent.includes('Sign In'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 3. SWITCH TO CREATE ACCOUNT TAB
  console.log('2. Switching to Create Account mode...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim() === 'Create Account');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // FILL ALL REQUIRED SIGNUP FORM FIELDS
  const testEmail = `user_flow_${Date.now()}@example.com`;
  console.log(`3. Filling signup form (Name, Email: ${testEmail}, Password)...`);

  const nameInput = await page.$('input[placeholder="Alex Morgan"]');
  if (nameInput) {
    await nameInput.focus();
    await page.keyboard.type('Alex Morgan');
  }

  await page.focus('input[type="email"]');
  await page.keyboard.type(testEmail);
  
  const passInputs = await page.$$('input[type="password"]');
  if (passInputs.length > 0) {
    await passInputs[0].focus();
    await page.keyboard.type('Password123!');
  }
  if (passInputs.length > 1) {
    await passInputs[1].focus();
    await page.keyboard.type('Password123!');
  }

  // SUBMIT FORM
  console.log('4. Submitting registration form...');
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 4. VERIFY STEP 1 USERNAME ONBOARDING MODAL APPEARS
  console.log('5. Verifying Step 1 (Username Onboarding Modal)...');
  await page.screenshot({ path: path.join(outputDir, '01_step1_username_modal.png') });

  const textStep1 = await page.evaluate(() => document.body.innerText);
  const isStep1Visible = textStep1.includes('Choose your @username') || textStep1.includes('Step 1 of 2');
  console.log('   Step 1 Visible in DOM:', isStep1Visible ? 'YES ✅' : 'NO ❌');

  // TYPE CUSTOM HANDLE
  const customHandle = `alex_${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`6. Typing custom handle @${customHandle}...`);
  
  const handleInput = await page.$('input[placeholder="username"]');
  if (handleInput) {
    await handleInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await handleInput.type(customHandle);
  }
  await new Promise(r => setTimeout(r, 600)); // wait for debounced check

  await page.screenshot({ path: path.join(outputDir, '02_step1_handle_available.png') });

  // CLICK CONTINUE
  console.log('7. Clicking "Continue" button on Step 1...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim() === 'Continue');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 5. VERIFY STEP 2 PROFILE SETUP MODAL APPEARS (CRITICAL TRANSITION CHECK)
  console.log('8. Checking if Step 2 (Profile Setup) appears...');
  await page.screenshot({ path: path.join(outputDir, '03_step2_profile_setup.png') });

  const textStep2 = await page.evaluate(() => document.body.innerText);
  const isStep2Visible = textStep2.includes('Step 2 of 2') || textStep2.includes('Complete Your Profile');
  const isTrappedInStep1 = textStep2.includes('Step 1 of 2') && !textStep2.includes('Step 2 of 2');

  console.log('   Step 2 Profile Setup Visible:', isStep2Visible ? 'YES ✅ (LOOP FIXED!)' : 'NO ❌');
  console.log('   Trapped in Step 1 Loop:', isTrappedInStep1 ? 'YES ❌' : 'NO ✅');

  // CLICK SAVE & EXPLORE ON STEP 2
  console.log('9. Completing Step 2 (Clicking Save & Explore)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Save & Explore') || b.textContent.includes('Skip for now'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(outputDir, '04_home_post_onboarding.png') });

  const textHome = await page.evaluate(() => document.body.innerText);
  const isOnboardingClosed = !textHome.includes('Step 1 of 2') && !textHome.includes('Step 2 of 2');
  console.log('10. Onboarding Modal Closed & Home Reached:', isOnboardingClosed ? 'YES ✅' : 'NO ❌');

  await browser.close();
  console.log('\n==================================================');
  console.log(isStep1Visible && isStep2Visible && isOnboardingClosed ? '🎉 BROWSER VERIFICATION: 100% SUCCESSFUL!' : '❌ BROWSER VERIFICATION FAILED');
  console.log('==================================================\n');
}

verifyOnboardingFix().catch(console.error);
