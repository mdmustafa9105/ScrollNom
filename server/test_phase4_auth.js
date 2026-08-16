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

async function runPhase4Tests() {
  console.log('\n🔥 --- RUNNING PHASE 4: FIREBASE AUTH & USER ISOLATION TEST SUITE --- 🔥\n');
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
    // 1. Health Check
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.data.ok === true, 'GET /api/health returns ok: true');

    // 2. Security Check: Unauthenticated Order Creation Rejection
    const unauthOrderRes = await request('POST', '/orders', {
      items: [{ dishId: 'd1', title: 'Biryani', price: 380, quantity: 1 }]
    });
    assert(unauthOrderRes.status === 401 && unauthOrderRes.data.success === false, 'POST /api/orders rejects unauthenticated requests (HTTP 401 Unauthorized)');

    // 3. User A Identity Simulation (Random Firebase User)
    const userA_uid = `fb_uid_userA_${Date.now()}`;
    const userA_email = `userA_${Date.now()}@scrollnom.com`;
    const userA_token = `fb_token_${userA_uid}::${encodeURIComponent(userA_email)}`;

    // 4. Authenticated Order Creation for User A
    const orderUserARes = await request('POST', '/orders', {
      items: [{ dishId: 'd1', title: 'Hyderabadi Dum Biryani', price: 380, quantity: 1 }]
    }, { 'Authorization': `Bearer ${userA_token}` });

    assert(orderUserARes.status === 201 && orderUserARes.data.success === true, 'POST /api/orders creates order for authenticated User A');
    const orderA = orderUserARes.data.data;
    assert(orderA.userId === userA_uid, 'Order userId is strictly derived from User A verified Firebase token');

    // 5. User A Creates Food on Friend Split Request
    const fofCreateRes = await request('POST', '/food-on-friend/request', {
      orderId: orderA.orderId,
      friendName: 'User B',
      friendEmail: 'userB@scrollnom.com',
      totalAmount: orderA.amount,
      organizerContribution: 220,
      requestedContribution: 219
    }, { 'Authorization': `Bearer ${userA_token}` });

    assert(fofCreateRes.status === 201 && fofCreateRes.data.success === true, 'User A creates Food on Friend request');
    const fofRequestA = fofCreateRes.data.data;
    assert(fofRequestA.organizerId === userA_uid, 'Food on Friend request organizerId is strictly bound to User A');

    // 6. User B Identity Simulation (Separate Firebase User)
    const userB_uid = `fb_uid_userB_${Date.now()}`;
    const userB_email = `userB@scrollnom.com`;
    const userB_token = `fb_token_${userB_uid}::${encodeURIComponent(userB_email)}`;

    // 7. Security & Isolation Test: Unauthorized User C (Third-Party) Modifying User A's Split Request
    const userC_uid = `fb_uid_attacker_${Date.now()}`;
    const userC_token = `fb_token_${userC_uid}::${encodeURIComponent('attacker@scrollnom.com')}`;

    const attackRes = await request('PATCH', `/food-on-friend/${fofRequestA.requestId}/status`, {
      status: 'covered_by_organizer'
    }, { 'Authorization': `Bearer ${userC_token}` });

    assert(attackRes.status === 403 && attackRes.data.success === false, 'TWO-USER ISOLATION: Server rejects unauthorized User C attempting to alter User A request (HTTP 403 Forbidden)');

    // 8. Authorized Recipient User B Responding to Food on Friend Request
    const userB_ResponseRes = await request('PATCH', `/food-on-friend/${fofRequestA.requestId}/status`, {
      status: 'accepted'
    }, { 'Authorization': `Bearer ${userB_token}` });

    assert(userB_ResponseRes.status === 200 && userB_ResponseRes.data.data.status === 'accepted', 'Authorized recipient User B successfully accepts split request');

    // 9. Razorpay Order Creation for Authenticated User A
    const rzpOrderRes = await request('POST', '/payments/create-order', {
      orderId: orderA.orderId
    }, { 'Authorization': `Bearer ${userA_token}` });

    assert(rzpOrderRes.status === 200 && rzpOrderRes.data.success === true, 'POST /api/payments/create-order generates Razorpay order for User A');

    // 10. Payment Verification with Verified Firebase Token
    const verifyRes = await request('POST', '/payments/verify', {
      orderId: orderA.orderId,
      razorpay_order_id: rzpOrderRes.data.data.razorpayOrderId,
      razorpay_payment_id: 'pay_test_userA_verified',
      razorpay_signature: 'mock_sig_pay_test_userA_verified'
    }, { 'Authorization': `Bearer ${userA_token}` });

    assert(verifyRes.status === 200 && verifyRes.data.success === true, 'Payment verification succeeds for authenticated User A order');

    console.log(`\n==================================================`);
    console.log(`📊 PHASE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Phase 4 Test execution error:', err);
    process.exit(1);
  }
}

runPhase4Tests();
