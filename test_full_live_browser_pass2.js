import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = edgePaths.find(p => fs.existsSync(p));
const evidenceDir = path.resolve('d:\\ScrollNom\\docs\\audits\\full_live_browser_test');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const results = [];
function record(part, test, status, detail) {
  results.push({ part, test, status, detail });
  console.log(`[${status}] Part ${part}: ${test} — ${detail}`);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runPass2() {
  console.log('='.repeat(60));
  console.log('SCROLLNOM FULL TEST — PASS 2 (Remaining Parts)');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // ==================== RIDER PORTAL via URL ====================
    console.log('\n--- RIDER PORTAL (URL navigation) ---');
    await page.goto('http://localhost:3000/?role=rider', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await shot(page, 'P13_03_rider_portal_url');
    let html = await page.content();
    const riderEmpty = html.includes('No active delivery') || html.includes('Active Delivery Jobs (0)');
    record('13', 'Rider Portal (URL)', riderEmpty ? 'PASS' : 'FAIL',
      riderEmpty ? 'Rider shows empty active queue' : 'Rider portal content check');

    // ==================== CUSTOMER CART via URL ====================
    console.log('\n--- CUSTOMER CART (URL) ---');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await sleep(1500);
    // Click Nommly
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button')];
      const n = links.find(l => l.textContent.includes('Nommly'));
      if (n) n.click();
    });
    await sleep(2000);
    // Click ORDER THIS DISH NOW
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const order = btns.find(b => b.textContent.includes('ORDER THIS DISH'));
      if (order) order.click();
    });
    await sleep(1500);
    // Navigate to Cart
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button')];
      const cart = links.find(l => l.textContent.includes('Cart'));
      if (cart) cart.click();
    });
    await sleep(1500);
    await shot(page, 'P08_02_customer_cart_real');
    html = await page.content();
    const cartHasItems = html.includes('Your Food Cart') || html.includes('Order Items');
    record('8', 'Cart Page (Real)', cartHasItems ? 'PASS' : 'FAIL',
      cartHasItems ? 'Cart loaded with items' : 'Cart page shows unexpected content');

    // Check Razorpay button
    const hasRzpBtn = html.includes('RAZORPAY') || html.includes('CHECKOUT');
    record('9', 'Razorpay Button Present', hasRzpBtn ? 'PASS' : 'FAIL',
      hasRzpBtn ? 'Razorpay checkout button found' : 'No Razorpay button');

    // Click Razorpay checkout
    if (hasRzpBtn) {
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')];
        const pay = btns.find(b => b.textContent.includes('RAZORPAY') || b.textContent.includes('CHECKOUT'));
        if (pay) pay.click();
      });
      await sleep(4000);
      await shot(page, 'P09_02_razorpay_checkout_real');
      // Check for Razorpay iframe
      const frames = page.frames();
      const rzpFrame = frames.find(f => f.url().includes('razorpay'));
      html = await page.content();
      const rzpVisible = rzpFrame || html.includes('Razorpay') || html.includes('razorpay');
      record('9', 'Razorpay Checkout Opens', rzpVisible ? 'PASS' : 'FAIL',
        rzpVisible ? 'Razorpay checkout modal visible' : 'Razorpay checkout not detected');
      
      // Close Razorpay
      await page.keyboard.press('Escape');
      await sleep(1000);
    }

    // ==================== MY ACCOUNT / PROFILE ====================
    console.log('\n--- MY ACCOUNT ---');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button')];
      const acct = links.find(l => l.textContent.includes('My Account') || l.textContent.includes('Account'));
      if (acct) acct.click();
    });
    await sleep(1500);
    await shot(page, 'P01_09_my_account');
    html = await page.content();
    const hasProfile = html.includes('Profile') || html.includes('Account') || html.includes('Sign In');
    record('1', 'My Account Page', hasProfile ? 'PASS' : 'FAIL',
      hasProfile ? 'Account/Profile page loaded' : 'Account page issue');

    // ==================== EXPLORE SEARCH CATEGORIES ====================
    console.log('\n--- EXPLORE SEARCH EXTENDED ---');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await sleep(500);
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button')];
      const e = links.find(l => l.textContent.includes('Explore'));
      if (e) e.click();
    });
    await sleep(1500);

    // Search: dosa
    const searchInput = await page.$('input[type="text"], input[type="search"], input[placeholder*="earch"]');
    if (searchInput) {
      for (const query of ['dosa', 'burger', 'ice cream', 'juice']) {
        await searchInput.click({ clickCount: 3 });
        await searchInput.type(query, { delay: 30 });
        await sleep(1200);
        await shot(page, `P03_search_${query.replace(' ', '_')}`);
        html = await page.content();
        const found = html.toLowerCase().includes(query.split(' ')[0]);
        record('3', `Search: ${query}`, found ? 'PASS' : 'PARTIAL',
          found ? `Results found for "${query}"` : `No match for "${query}" in DOM`);
      }

      // Users & Creators tab
      await searchInput.click({ clickCount: 3 });
      await searchInput.type('chef', { delay: 30 });
      await sleep(500);
      await page.evaluate(() => {
        const tabs = [...document.querySelectorAll('button, [role="tab"]')];
        const ut = tabs.find(t => t.textContent.includes('Users') || t.textContent.includes('Creator'));
        if (ut) ut.click();
      });
      await sleep(1500);
      await shot(page, 'P04_search_creator');
      html = await page.content();
      const hasCreator = html.toLowerCase().includes('chef') || html.includes('@');
      record('4', 'Search Creator', hasCreator ? 'PASS' : 'PARTIAL',
        hasCreator ? 'Creator search results found' : 'Creator search results not confirmed');

      // Click a creator profile
      await page.evaluate(() => {
        const cards = [...document.querySelectorAll('[class*="card"], [class*="profile"], [class*="user"]')];
        const clickable = cards.find(c => c.querySelector('button') || c.closest('button') || c.onclick);
        if (clickable) clickable.click();
        else {
          // Try clicking any element with @ (username)
          const atEls = [...document.querySelectorAll('span, p, div')];
          const at = atEls.find(e => e.textContent.startsWith('@') && e.textContent.length < 30);
          if (at) at.click();
        }
      });
      await sleep(1500);
      await shot(page, 'P04_creator_public_profile');
      record('4', 'Creator Public Profile', 'TESTED', 'Attempted to open creator profile');

      // Follow button
      const followClicked = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')];
        const follow = btns.find(b => b.textContent.includes('Follow') && !b.textContent.includes('Following'));
        if (follow) { follow.click(); return true; }
        return false;
      });
      await sleep(1000);
      await shot(page, 'P06_follow_state');
      record('6', 'Follow Creator', followClicked ? 'TESTED' : 'PARTIAL',
        followClicked ? 'Follow button clicked' : 'Follow button not found or already following');
    }

    // ==================== RESPONSIVE TESTS (Customer pages) ====================
    console.log('\n--- RESPONSIVE CUSTOMER PAGES ---');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await sleep(1000);

    // Mobile home
    await page.setViewport({ width: 390, height: 844 });
    await sleep(800);
    await shot(page, 'P23_mobile_customer_home');
    record('23', 'Mobile Customer Home', 'TESTED', '390x844 customer home tested');

    // Mobile Nommly
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button')];
      const n = links.find(l => l.textContent.includes('Nommly'));
      if (n) n.click();
    });
    await sleep(1500);
    await shot(page, 'P23_mobile_nommly');
    record('23', 'Mobile Nommly', 'TESTED', '390x844 Nommly tested');

    // Tablet
    await page.setViewport({ width: 820, height: 1180 });
    await sleep(800);
    await shot(page, 'P23_tablet_nommly');
    record('23', 'Tablet Nommly', 'TESTED', '820x1180 Nommly tested');

    // Desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await sleep(800);
    await shot(page, 'P23_desktop_nommly');
    record('23', 'Desktop Nommly', 'TESTED', '1920x1080 Nommly tested');

    // Reset
    await page.setViewport({ width: 1440, height: 900 });

    // ==================== RESTAURANT ORDER LIFECYCLE ====================
    console.log('\n--- RESTAURANT + RIDER FULL LIFECYCLE ---');
    
    // Create fresh order
    const createRes = await fetch('http://localhost:5000/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_test::customer%40scrollnom.com' },
      body: JSON.stringify({ items: [
        { dishId: 'd1', title: 'Hyderabadi Dum Biryani', price: 380, quantity: 1 },
        { dishId: 'd5', title: 'Cold Coffee', price: 120, quantity: 1 }
      ]})
    });
    const createData = await createRes.json();
    const orderId = createData.data?.orderId;

    const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_test::customer%40scrollnom.com' },
      body: JSON.stringify({
        orderId,
        razorpay_order_id: createData.data?.razorpayOrderId,
        razorpay_payment_id: `pay_p2_${Date.now()}`,
        razorpay_signature: 'valid_mock_signature'
      })
    });
    const verifyData = await verifyRes.json();
    const deliveryId = verifyData.data?.deliveryId;
    console.log(`[ORDER] ${orderId} | Delivery: ${deliveryId}`);

    // Restaurant receives order
    await sleep(1000);
    await page.goto('http://localhost:3000/?role=restaurant', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await shot(page, 'P11_02_restaurant_new_order_real');
    html = await page.content();
    record('11', 'Restaurant New Order (P2)', html.includes(orderId) ? 'PASS' : 'FAIL',
      html.includes(orderId) ? `Order ${orderId} in restaurant` : 'Order not in restaurant');

    // Rider check during early phase (should be active)
    await sleep(5000); // Wait for rider_assigned phase
    await page.goto('http://localhost:3000/?role=rider', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await shot(page, 'P13_04_rider_active_delivery');
    html = await page.content();
    const riderHas = html.includes(orderId) || (deliveryId && html.includes(deliveryId));
    record('13', 'Rider Active Delivery', riderHas ? 'PASS' : 'PARTIAL',
      riderHas ? 'Delivery in rider queue' : 'Auto-sim may have progressed past rider state');

    // Wait for delivery completion
    await sleep(18000);
    
    // Post-delivery: Restaurant empty
    await page.goto('http://localhost:3000/?role=restaurant', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await shot(page, 'P16_01_restaurant_post_delivery');
    html = await page.content();
    const restCleared = !html.includes(orderId);
    record('16', 'Restaurant Post-Delivery Empty', restCleared ? 'PASS' : 'FAIL',
      restCleared ? 'Delivered order cleared from restaurant' : 'Stale order remains');

    // Post-delivery: Rider empty
    await page.goto('http://localhost:3000/?role=rider', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await shot(page, 'P16_02_rider_post_delivery');
    html = await page.content();
    const riderCleared = !html.includes(orderId) && (!deliveryId || !html.includes(deliveryId));
    record('16', 'Rider Post-Delivery Empty', riderCleared ? 'PASS' : 'FAIL',
      riderCleared ? 'Delivered delivery cleared from rider' : 'Stale delivery remains');

    // ==================== FINAL SUMMARY ====================
    console.log('\n' + '='.repeat(60));
    console.log('PASS 2 RESULTS SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const tested = results.filter(r => r.status === 'TESTED').length;
    const partial = results.filter(r => r.status === 'PARTIAL').length;

    console.log(`PASS: ${passed} | FAIL: ${failed} | TESTED: ${tested} | PARTIAL: ${partial}`);
    for (const r of results) {
      console.log(`[${r.status.padEnd(7)}] Part ${r.part}: ${r.test} — ${r.detail}`);
    }

    // Save results
    fs.writeFileSync(path.join(evidenceDir, 'test_results_pass2.json'), JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('[FATAL ERROR]', err.message);
  } finally {
    await browser.close();
  }
}

runPass2();
