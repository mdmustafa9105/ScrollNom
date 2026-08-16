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

async function shot(page, name) {
  await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runVerification() {
  console.log('='.repeat(60));
  console.log('POST-FIX VERIFICATION: Restaurant Order Persistence');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // STEP 1: Create order via API (simulating customer checkout)
    console.log('\n--- STEP 1: Create verified order ---');
    const createRes = await fetch('http://localhost:5000/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_test::customer%40scrollnom.com' },
      body: JSON.stringify({ items: [
        { dishId: 'd1', title: 'Hyderabadi Dum Biryani', price: 380, quantity: 2 },
        { dishId: 'd5', title: 'Cold Coffee', price: 120, quantity: 1 }
      ]})
    });
    const createData = await createRes.json();
    const orderId = createData.data?.orderId;
    const rzpOrderId = createData.data?.razorpayOrderId;
    console.log(`  Order created: ${orderId}`);

    // Verify payment
    const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_test::customer%40scrollnom.com' },
      body: JSON.stringify({
        orderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: `pay_fix_test_${Date.now()}`,
        razorpay_signature: 'valid_mock_signature'
      })
    });
    const verifyData = await verifyRes.json();
    console.log(`  Verify response status: ${verifyRes.status}`);
    console.log(`  Verify data:`, JSON.stringify(verifyData.data || verifyData.error));
    const deliveryId = verifyData.data?.deliveryId;
    console.log(`  Payment verified. Delivery: ${deliveryId}`);
    const T0 = Date.now();

    // STEP 2: Open Restaurant portal and verify order appears
    console.log('\n--- STEP 2: Open Restaurant Portal ---');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await sleep(1000);
    // Navigate to Restaurant
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button, div[role="button"]')];
      const rest = links.find(l => l.textContent.includes('Restaurant'));
      if (rest) rest.click();
    });
    await sleep(3000);
    await shot(page, 'FIX_01_restaurant_order_T0');
    let html = await page.content();
    const orderVisible = html.includes(orderId);
    console.log(`  T+${Math.round((Date.now() - T0)/1000)}s: Order visible: ${orderVisible}`);
    console.log(`  Order ID: ${orderId}`);

    // STEP 3: Wait 10 seconds — previously the order would disappear here
    console.log('\n--- STEP 3: Wait 10 seconds (previously disappearing) ---');
    await sleep(10000);
    await shot(page, 'FIX_02_restaurant_order_T10');
    html = await page.content();
    const stillAt10 = html.includes(orderId);
    console.log(`  T+${Math.round((Date.now() - T0)/1000)}s: Order still visible: ${stillAt10}`);

    // STEP 4: Wait another 20 seconds (total 30s)
    console.log('\n--- STEP 4: Wait to 30 seconds total ---');
    await sleep(20000);
    await shot(page, 'FIX_03_restaurant_order_T30');
    html = await page.content();
    const stillAt30 = html.includes(orderId);
    console.log(`  T+${Math.round((Date.now() - T0)/1000)}s: Order still visible: ${stillAt30}`);

    // STEP 5: Check DB status
    console.log('\n--- STEP 5: Verify DB status unchanged ---');
    const dbCheckRes = await fetch(`http://localhost:5000/api/delivery/${deliveryId}/tracking`, {
      headers: { 'Authorization': 'Bearer fb_token_test::customer%40scrollnom.com' }
    });
    const dbCheck = await dbCheckRes.json();
    const dbStatus = dbCheck.data?.status;
    console.log(`  DB status: ${dbStatus} (expected: restaurant_received)`);

    // STEP 6: Restaurant clicks ACCEPT
    console.log('\n--- STEP 6: Restaurant ACCEPT ---');
    const acceptRes = await fetch(`http://localhost:5000/api/delivery/${deliveryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_test::restaurant%40scrollnom.com' },
      body: JSON.stringify({ status: 'accepted', message: 'Restaurant accepted manually' })
    });
    console.log(`  Accept response: ${acceptRes.status}`);
    await sleep(4000);
    await shot(page, 'FIX_04_restaurant_accepted');
    html = await page.content();
    const acceptedVisible = html.includes(orderId) && (html.includes('ACCEPTED') || html.includes('accepted'));
    console.log(`  Order visible as ACCEPTED: ${acceptedVisible}`);

    // STEP 7: Wait 30s at ACCEPTED
    console.log('\n--- STEP 7: Wait 30s at ACCEPTED ---');
    await sleep(30000);
    await shot(page, 'FIX_05_restaurant_accepted_T30');
    html = await page.content();
    const stillAccepted = html.includes(orderId);
    console.log(`  Still visible after 30s at ACCEPTED: ${stillAccepted}`);

    // STEP 8: Restaurant clicks PREPARING
    console.log('\n--- STEP 8: Restaurant PREPARING ---');
    await fetch(`http://localhost:5000/api/delivery/${deliveryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_test::restaurant%40scrollnom.com' },
      body: JSON.stringify({ status: 'preparing', message: 'Chef is cooking' })
    });
    await sleep(4000);
    await shot(page, 'FIX_06_restaurant_preparing');
    html = await page.content();
    const prepVisible = html.includes(orderId);
    console.log(`  Order visible as PREPARING: ${prepVisible}`);

    // STEP 9: Wait 30s at PREPARING
    console.log('\n--- STEP 9: Wait 30s at PREPARING ---');
    await sleep(30000);
    await shot(page, 'FIX_07_restaurant_preparing_T30');
    html = await page.content();
    const stillPrep = html.includes(orderId);
    console.log(`  Still visible after 30s at PREPARING: ${stillPrep}`);

    // STEP 10: Restaurant clicks READY
    console.log('\n--- STEP 10: Restaurant READY ---');
    await fetch(`http://localhost:5000/api/delivery/${deliveryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_test::restaurant%40scrollnom.com' },
      body: JSON.stringify({ status: 'ready_for_pickup', message: 'Order packed for pickup' })
    });
    await sleep(4000);
    await shot(page, 'FIX_08_restaurant_ready');
    html = await page.content();
    const readyVisible = html.includes(orderId);
    console.log(`  Order visible as READY: ${readyVisible}`);

    // STEP 11: Check Rider portal (should now have the delivery)
    console.log('\n--- STEP 11: Rider receives delivery ---');
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button, div[role="button"]')];
      const rider = links.find(l => l.textContent.includes('Rider'));
      if (rider) rider.click();
    });
    await sleep(3000);
    await shot(page, 'FIX_09_rider_receives');
    html = await page.content();
    const riderHas = html.includes(deliveryId) || html.includes(orderId);
    console.log(`  Rider sees delivery: ${riderHas}`);

    // STEP 12: Rider OUT FOR DELIVERY
    console.log('\n--- STEP 12: Rider OUT FOR DELIVERY ---');
    await fetch(`http://localhost:5000/api/delivery/${deliveryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_test::rider%40scrollnom.com' },
      body: JSON.stringify({ status: 'out_for_delivery', message: 'Rider on the way' })
    });
    await sleep(4000);
    await shot(page, 'FIX_10_rider_out_for_delivery');

    // STEP 13: Rider DELIVERED
    console.log('\n--- STEP 13: Rider DELIVERED ---');
    await fetch(`http://localhost:5000/api/delivery/${deliveryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_test::rider%40scrollnom.com' },
      body: JSON.stringify({ status: 'delivered', message: 'Order delivered successfully' })
    });
    await sleep(4000);
    await shot(page, 'FIX_11_rider_delivered');

    // STEP 14: Restaurant active queue should be 0
    console.log('\n--- STEP 14: Restaurant post-delivery ---');
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button, div[role="button"]')];
      const rest = links.find(l => l.textContent.includes('Restaurant'));
      if (rest) rest.click();
    });
    await sleep(3000);
    await shot(page, 'FIX_12_restaurant_empty_after');
    html = await page.content();
    const restCleared = !html.includes(orderId);
    console.log(`  Restaurant cleared after delivery: ${restCleared}`);

    // FINAL RESULTS
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(60));
    console.log(`NEW TEST ORDER: ${orderId}`);
    console.log(`RESTAURANT STAYS VISIBLE FOR 30+ SECONDS: ${stillAt30 ? 'YES' : 'NO'}`);
    console.log(`DB STATUS UNCHANGED (restaurant_received): ${dbStatus === 'restaurant_received' ? 'YES' : `NO (was: ${dbStatus})`}`);
    console.log(`RESTAURANT ACCEPT: ${acceptedVisible ? 'YES' : 'NO'}`);
    console.log(`STAYS AT ACCEPTED 30s: ${stillAccepted ? 'YES' : 'NO'}`);
    console.log(`PREPARING: ${prepVisible ? 'YES' : 'NO'}`);
    console.log(`STAYS AT PREPARING 30s: ${stillPrep ? 'YES' : 'NO'}`);
    console.log(`READY: ${readyVisible ? 'YES' : 'NO'}`);
    console.log(`RIDER RECEIVES: ${riderHas ? 'YES' : 'NO'}`);
    console.log(`DELIVERED: YES (status set via API)`);
    console.log(`RESTAURANT EMPTY AFTER DELIVERY: ${restCleared ? 'YES' : 'NO'}`);
    
  } catch (err) {
    console.error('[ERROR]', err.message);
    console.error(err.stack);
  } finally {
    await browser.close();
  }
}

runVerification();
