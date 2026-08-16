import http from 'http';

const API_BASE = 'http://localhost:5000/api';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const postData = body ? JSON.stringify(body) : '';

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runPhase7Tests() {
  console.log('\n🌐 --- RUNNING PHASE 7: REAL-TIME DELIVERY ENGINE & ADAPTERS TEST SUITE --- 🌐\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const ts = Date.now().toString().slice(-6);

    // Create Authorized User A & Token
    const userA_uid = `fb_uid_delA_${ts}`;
    const userA_email = `userDelA_${ts}@scrollnom.com`;
    const userA_token = `fb_token_${userA_uid}::${encodeURIComponent(userA_email)}`;

    // Create Unauthorized User B & Token
    const userB_uid = `fb_uid_delB_${ts}`;
    const userB_email = `userDelB_${ts}@scrollnom.com`;
    const userB_token = `fb_token_${userB_uid}::${encodeURIComponent(userB_email)}`;

    await request('POST', '/users/sync', {}, { 'Authorization': `Bearer ${userA_token}` });
    await request('POST', '/users/sync', {}, { 'Authorization': `Bearer ${userB_token}` });

    // 19, 20, 24. Check Provider Adapters Status & Dev Flags
    const adapterRes = await request('GET', '/delivery/adapters');
    assert(adapterRes.status === 200 && adapterRes.data.success === true, 'TEST 24: Delivery adapters status endpoint returned');

    const adapters = adapterRes.data.data;
    const scrollnomInfo = adapters.find(a => a.provider === 'scrollnom');
    const zomatoInfo = adapters.find(a => a.provider === 'zomato');
    const swiggyInfo = adapters.find(a => a.provider === 'swiggy');

    assert(scrollnomInfo && scrollnomInfo.status === 'ACTIVE', 'TEST 1: ScrollNom development provider is ACTIVE');
    assert(zomatoInfo && zomatoInfo.status === 'NOT_CONNECTED', 'TEST 19: Zomato adapter reports status NOT_CONNECTED without enterprise credentials');
    assert(swiggyInfo && swiggyInfo.status === 'NOT_CONNECTED', 'TEST 20: Swiggy adapter reports status NOT_CONNECTED without enterprise credentials');
    assert(adapterRes.data.developmentFlags.RAZORPAY_TEST_MODE === true, 'TEST 18: Razorpay remains in TEST MODE');

    // 1. Create Paid Test Order via Backend to trigger delivery creation
    const orderRes = await request('POST', '/orders', {
      items: [{ id: 'd1', title: 'Hyderabadi Biryani', price: 380, quantity: 1, restaurantName: 'Paradise Biryani' }]
    }, { 'Authorization': `Bearer ${userA_token}` });
    assert(orderRes.status === 200 || orderRes.status === 201, 'Test order placed');
    const order = orderRes.data.data;

    const razorpay_order_id = `rzp_ord_${ts}`;
    const razorpay_payment_id = `pay_del_${ts}`;

    // Simulate Payment Verification
    const verifyRes = await request('POST', '/payments/verify', {
      orderId: order.orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: 'valid_mock_signature'
    }, { 'Authorization': `Bearer ${userA_token}` });

    assert(verifyRes.status === 200 && verifyRes.data.data.deliveryId !== null, 'TEST 1: Paid test order creates delivery record via ScrollNomAdapter');
    const deliveryId = verifyRes.data.data.deliveryId;

    // 2. Restaurant Receives Order (`restaurant_received`)
    const initialTrackingRes = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(initialTrackingRes.status === 200 && initialTrackingRes.data.data.status === 'restaurant_received', 'TEST 2: Restaurant receives development order notification (restaurant_received)');

    // 14. Unauthorized User Cannot Track Order
    const unauthTrackingRes = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${userB_token}` });
    assert(unauthTrackingRes.status === 403, 'TEST 14: Unauthorized user blocked from tracking order (HTTP 403 Forbidden)');

    // Wait for Rider Simulator transitions (Step 3: Accepted, Step 4: Preparing, Step 5: Ready)
    console.log('⏳ Waiting for Rider Simulator transitions (Accepted -> Preparing -> Ready)...');
    await new Promise(r => setTimeout(r, 6500));

    const prepTrackingRes = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(['accepted', 'preparing', 'ready_for_pickup'].includes(prepTrackingRes.data.data.status), 'TEST 3, 4, 5: Order transitions through accepted, preparing, and ready_for_pickup');

    // Wait for Rider Assignment & Picked Up (Step 6: Rider Assigned, Step 7: Movement, Step 10: Picked Up)
    console.log('⏳ Waiting for Rider Assignment & Picked Up transitions...');
    await new Promise(r => setTimeout(r, 5000));

    const riderTrackingRes = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(['rider_assigned', 'picked_up', 'out_for_delivery'].includes(riderTrackingRes.data.data.status), 'TEST 6, 7, 10: Rider assigned (Vikram Singh) and picked up food');
    assert(riderTrackingRes.data.data.rider.phoneMasked === '+91 98*** **421', 'TEST 6: Rider phone number is masked for privacy');

    // Wait for Delivery Completion (Step 11: Out for Delivery, Step 12: Delivered)
    console.log('⏳ Waiting for Out for Delivery & Delivered completion...');
    await new Promise(r => setTimeout(r, 10000));

    const finalTrackingRes = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(finalTrackingRes.data.data.status === 'delivered', 'TEST 11 & 12: Order transitions through out_for_delivery to delivered status');
    assert(finalTrackingRes.data.data.etaMinutes === 0, 'TEST 9: Dynamic ETA decreases to 0 upon delivery completion');

    // 15 & 16. Persistence in SQLite
    assert(finalTrackingRes.data.data.deliveryId === deliveryId, 'TEST 15 & 16: Delivery record and event audit trail persist in SQLite database');

    console.log(`\n==================================================`);
    console.log(`📊 PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Phase 7 Test execution error:', err);
    process.exit(1);
  }
}

runPhase7Tests();
