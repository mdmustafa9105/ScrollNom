import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

let executablePath = edgePaths.find(p => fs.existsSync(p));

const evidenceDir = path.resolve('d:\\ScrollNom\\docs\\audits\\order_diagnostic_evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(path.resolve('scrollnom.db'));
    db.get(sql, params, (err, row) => {
      db.close();
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function runOrderDiagnostic() {
  console.log('🔍 ==================================================');
  console.log('🔍 RAZORPAY & RESTAURANT ORDER DIAGNOSTIC STARTING');
  console.log('🔍 Executable:', executablePath);
  console.log('🔍 ==================================================\n');

  const logs = {
    razorpay: {},
    network: [],
    consoleErrors: [],
    backendState: {},
    databaseOrder: null,
    restaurantItems: []
  };

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const ctxCustomer = await browser.createBrowserContext();
    const ctxRestaurant = await browser.createBrowserContext();

    const pageCustomer = await ctxCustomer.newPage();
    const pageRestaurant = await ctxRestaurant.newPage();

    await pageCustomer.setViewport({ width: 1440, height: 900 });
    await pageRestaurant.setViewport({ width: 1440, height: 900 });

    // Capture Console Errors
    pageCustomer.on('console', msg => {
      if (msg.type() === 'error') {
        logs.consoleErrors.push(`[CUSTOMER CONSOLE ERROR] ${msg.text()}`);
      }
    });

    pageRestaurant.on('console', msg => {
      if (msg.type() === 'error') {
        logs.consoleErrors.push(`[RESTAURANT CONSOLE ERROR] ${msg.text()}`);
      }
    });

    // Capture Network Requests
    pageCustomer.on('response', async response => {
      const url = response.url();
      if (url.includes('/payments/create-order') || url.includes('/payments/verify') || url.includes('/orders')) {
        try {
          const body = await response.json();
          logs.network.push({ url, method: response.request().method(), status: response.status(), body });
        } catch (e) {
          logs.network.push({ url, method: response.request().method(), status: response.status() });
        }
      }
    });

    pageRestaurant.on('response', async response => {
      const url = response.url();
      if (url.includes('/restaurant/orders')) {
        try {
          const body = await response.json();
          logs.network.push({ url, method: response.request().method(), status: response.status(), body });
        } catch (e) {
          logs.network.push({ url, method: response.request().method(), status: response.status() });
        }
      }
    });

    // 1. CUSTOMER ADDS DISHES TO CART & OPENS CART
    console.log('--- 1. CUSTOMER CART & CHECKOUT INITIATION ---');
    await pageCustomer.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Open Explore
    await pageCustomer.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.toLowerCase().includes('explore'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Add first item (e.g., Biryani)
    await pageCustomer.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const orderBtn = btns.find(b => b.textContent.includes('Order') || b.textContent.includes('ADD'));
      if (orderBtn) orderBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Open Cart
    await pageCustomer.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.toLowerCase().includes('cart'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await pageCustomer.screenshot({ path: path.join(evidenceDir, '01_customer_cart_items.png') });

    // 2. TRIGGER RAZORPAY CHECKOUT
    console.log('\n--- 2. RAZORPAY CHECKOUT DIAGNOSTIC ---');
    await pageCustomer.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.toLowerCase().includes('checkout') || b.textContent.includes('PAY'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await pageCustomer.screenshot({ path: path.join(evidenceDir, '02_razorpay_modal_state.png') });

    // 3. INSPECT SQLITE DATABASE ORDER RECORD
    console.log('\n--- 3. DATABASE ORDER RECORD INSPECTION ---');
    const latestOrder = await dbGet('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1');
    logs.databaseOrder = latestOrder;
    console.log('[DB ORDER RECORD]', latestOrder);

    // 4. RESTAURANT BROWSER INSPECTION
    console.log('\n--- 4. RESTAURANT BROWSER & FOOD ITEM VISIBILITY ---');
    await pageRestaurant.goto('http://localhost:3000/?role=restaurant', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await pageRestaurant.screenshot({ path: path.join(evidenceDir, '03_restaurant_received_order_items.png') });

    // Check rendered item text in Restaurant UI
    const renderedItems = await pageRestaurant.evaluate(() => {
      const el = document.querySelector('.space-y-1.bg-black\\/40');
      return el ? el.innerText : 'Fallback or missing items';
    });
    logs.restaurantItems = renderedItems;
    console.log('[RESTAURANT RENDERED ITEMS]', renderedItems);

    // Refresh Restaurant Browser
    await pageRestaurant.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    await pageRestaurant.screenshot({ path: path.join(evidenceDir, '04_restaurant_post_refresh.png') });

  } finally {
    await browser.close();
  }

  console.log('\n🔍 ==================================================');
  console.log('🔍 DIAGNOSTIC EXECUTION COMPLETE');
  console.log('🔍 ==================================================\n');

  return logs;
}

runOrderDiagnostic().catch(console.error);
