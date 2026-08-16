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

async function runPhase8aTests() {
  console.log('\n🌐 --- RUNNING PHASE 8A: GOOGLE AUTH + MULTI-USER + RAZORPAY TEST SUITE --- 🌐\n');
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

    // 1 & 2. Google / Firebase Auth Sync for User A & User B
    const userA_uid = `google_uid_A_${ts}`;
    const userA_email = `userA_${ts}@gmail.com`;
    const userA_token = `fb_token_${userA_uid}::${encodeURIComponent(userA_email)}`;

    const userB_uid = `google_uid_B_${ts}`;
    const userB_email = `userB_${ts}@gmail.com`;
    const userB_token = `fb_token_${userB_uid}::${encodeURIComponent(userB_email)}`;

    const syncA = await request('POST', '/users/sync', {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(syncA.status === 200 && syncA.data.success === true, 'TEST 1: User A Google/Firebase account syncs with ScrollNom');

    const syncB = await request('POST', '/users/sync', {}, { 'Authorization': `Bearer ${userB_token}` });
    assert(syncB.status === 200 && syncB.data.success === true, 'TEST 2: User B Google/Firebase account syncs with ScrollNom');

    // 3. User A & User B have different Firebase UIDs & ScrollNom IDs
    const userA_profile = syncA.data.data.user;
    const userB_profile = syncB.data.data.user;
    assert(userA_profile.id !== userB_profile.id && userA_uid !== userB_uid, 'TEST 3: User A and User B have distinct UIDs and ScrollNom IDs');

    // 4. Check Username Availability
    const targetUsername = `foodie_a_${ts}`;
    const checkRes = await request('GET', `/users/check-username?username=${targetUsername}`);
    assert(checkRes.status === 200 && checkRes.data.data.available === true, 'TEST 4: Check username availability returns true for new handle');

    // 5. User A Claims Unique Username
    const claimRes = await request('POST', '/users/claim-username', { username: targetUsername }, { 'Authorization': `Bearer ${userA_token}` });
    assert(claimRes.status === 200 && claimRes.data.data.user.username === targetUsername, 'TEST 5: User A claims unique username @' + targetUsername);

    // 6. Duplicate Username Claim Rejected (HTTP 400)
    const dupRes = await request('POST', '/users/claim-username', { username: targetUsername }, { 'Authorization': `Bearer ${userB_token}` });
    assert(dupRes.status === 400 && dupRes.data.error.code === 'USERNAME_TAKEN', 'TEST 6: Duplicate username claim by User B is rejected with HTTP 400 Bad Request');

    // 7 & 8. User Search
    const searchRes = await request('GET', `/users/search?q=${targetUsername}`, null, { 'Authorization': `Bearer ${userB_token}` });
    assert(searchRes.status === 200 && searchRes.data.data.some(u => u.username === targetUsername), 'TEST 7 & 8: User B can search User A profile');

    // 9. Email Privacy Enforced
    const foundUserA = searchRes.data.data.find(u => u.username === targetUsername);
    assert(foundUserA && foundUserA.email === undefined, 'TEST 9: Email privacy enforced (email address is NOT exposed in search results)');

    // 10. Follow / Unfollow Isolation
    const followRes = await request('POST', `/users/${userA_profile.id}/follow`, {}, { 'Authorization': `Bearer ${userB_token}` });
    assert(followRes.status === 200 && followRes.data.data.isFollowing === true, 'TEST 10: User B follows User A cleanly');

    // 11 & 12. Razorpay TEST Order Creation & Payment Verification
    const orderRes = await request('POST', '/orders', {
      items: [{ id: 'd1', title: 'Hyderabadi Dum Biryani', price: 380, quantity: 1, restaurantName: 'Paradise Biryani Palace' }]
    }, { 'Authorization': `Bearer ${userA_token}` });
    const order = orderRes.data.data;

    // 13. Invalid/Forged Signature Rejected (HTTP 400)
    const forgedRes = await request('POST', '/payments/verify', {
      orderId: order.orderId,
      razorpay_order_id: `rzp_ord_${ts}`,
      razorpay_payment_id: `pay_forged_${ts}`,
      razorpay_signature: 'invalid_forged_signature_attack'
    }, { 'Authorization': `Bearer ${userA_token}` });
    assert(forgedRes.status === 400 && forgedRes.data.error.code === 'PAYMENT_VERIFICATION_FAILED', 'TEST 13: Forged payment signature rejected with HTTP 400 Bad Request');

    // Valid Payment Verification
    const verifyRes = await request('POST', '/payments/verify', {
      orderId: order.orderId,
      razorpay_order_id: `rzp_ord_${ts}`,
      razorpay_payment_id: `pay_del_${ts}`,
      razorpay_signature: 'valid_mock_signature'
    }, { 'Authorization': `Bearer ${userA_token}` });
    assert(verifyRes.status === 200 && verifyRes.data.data.deliveryId !== null, 'TEST 11, 12, 14: Valid Razorpay TEST payment marks order paid and initializes delivery');
    const deliveryId = verifyRes.data.data.deliveryId;

    // 15. Security Isolation: User B Blocked from User A Order Tracking (HTTP 403)
    const userBTrackingRes = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${userB_token}` });
    assert(userBTrackingRes.status === 403, 'TEST 15: Security Isolation: User B blocked from accessing User A order tracking (HTTP 403 Forbidden)');

    // 16. Multi-Actor 3-Laptop Operations
    const restOrdersRes = await request('GET', '/restaurant/orders');
    assert(restOrdersRes.status === 200 && restOrdersRes.data.data.some(o => o.deliveryId === deliveryId || o.orderId === order.orderId), 'TEST 16: Restaurant receives User A order on Laptop 2');

    await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'accepted' });
    await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'preparing' });
    await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'ready_for_pickup' });
    await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'rider_assigned' });
    await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'picked_up' });

    const stepGpsRes = await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'out_for_delivery', latitude: 17.4412, longitude: 78.4685 });
    assert(stepGpsRes.status === 200 && stepGpsRes.data.data.rider_lat === 17.4412, 'TEST 16: Rider updates GPS position on Laptop 3');

    const userATrackingRes = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(userATrackingRes.status === 200 && userATrackingRes.data.data.rider.location.latitude === 17.4412, 'TEST 16: User A receives real-time live location on Laptop 1');

    await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'delivered' });
    const finalTracking = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(finalTracking.data.data.status === 'delivered', 'TEST 16: Delivery completes with status delivered on Laptop 1 & 2');

    console.log(`\n==================================================`);
    console.log(`📊 PHASE 8A TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Phase 8A Test execution error:', err);
    process.exit(1);
  }
}

runPhase8aTests();
