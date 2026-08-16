import http from 'http';

const API_BASE = 'http://localhost:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const postData = body ? JSON.stringify(body) : '';
    
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers
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

async function runMultiUserIsolationTests() {
  console.log('\n🔒 --- RUNNING SCROLLNOM MULTI-USER ISOLATION & IDENTITY TEST SUITE --- 🔒\n');
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
    // 1. HEALTH CHECK
    const healthRes = await request('GET', '/health');
    assert(healthRes.status === 200 && healthRes.data?.ok === true, 'GET /api/health returns ok: true');

    // TEST TOKENS FOR 3 INDEPENDENT USERS
    const tokenA = 'fb_token_user_alpha_101::user_a@test.com';
    const tokenB = 'fb_token_user_beta_202::user_b@test.com';
    const tokenC = 'fb_token_user_gamma_303::user_c@test.com';

    // 2. AUTH SYNC & USER CREATION FOR USER A, B, C
    console.log('\n--- 1. MULTI-USER CREATION & SYNC ---');
    const syncA = await request('POST', '/users/sync', {}, tokenA);
    assert(syncA.status === 200 && syncA.data.success, 'User A sync succeeds');

    const syncB = await request('POST', '/users/sync', {}, tokenB);
    assert(syncB.status === 200 && syncB.data.success, 'User B sync succeeds');

    const syncC = await request('POST', '/users/sync', {}, tokenC);
    assert(syncC.status === 200 && syncC.data.success, 'User C sync succeeds');

    // 3. CLAIM UNIQUE USERNAMES
    console.log('\n--- 2. USERNAME CLAIMING & ISOLATION ---');
    const claimA = await request('POST', '/users/claim-username', { username: 'user_alpha' }, tokenA);
    assert(claimA.status === 200 && claimA.data.data?.user?.username === 'user_alpha', 'User A claims @user_alpha');

    const claimB = await request('POST', '/users/claim-username', { username: 'user_beta' }, tokenB);
    assert(claimB.status === 200 && claimB.data.data?.user?.username === 'user_beta', 'User B claims @user_beta');

    const claimC = await request('POST', '/users/claim-username', { username: 'user_gamma' }, tokenC);
    assert(claimC.status === 200 && claimC.data.data?.user?.username === 'user_gamma', 'User C claims @user_gamma');

    // VERIFY DISTINCT HANDLES
    assert(
      claimA.data.data.user.username !== claimB.data.data.user.username &&
      claimB.data.data.user.username !== claimC.data.data.user.username,
      'User A, User B, and User C have completely distinct usernames'
    );

    // 4. PREVENT USERNAME COLLISION
    const collisionRes = await request('POST', '/users/claim-username', { username: 'user_alpha' }, tokenB);
    assert(collisionRes.status === 400 || collisionRes.data?.success === false, 'Server prevents User B from claiming User A username');

    // 5. ORDER ISOLATION TEST
    console.log('\n--- 3. ORDER ISOLATION TEST ---');
    const orderA = await request('POST', '/payments/create-order', {
      items: [{ dishId: 'd1', title: 'User A Biryani', price: 380, quantity: 1 }]
    }, tokenA);
    assert(orderA.status === 200 && orderA.data.success, 'User A creates Order A');
    const orderIdA = orderA.data.data.orderId;

    const orderB = await request('POST', '/payments/create-order', {
      items: [{ dishId: 'd2', title: 'User B Burger', price: 290, quantity: 1 }]
    }, tokenB);
    assert(orderB.status === 200 && orderB.data.success, 'User B creates Order B');
    const orderIdB = orderB.data.data.orderId;

    assert(orderIdA !== orderIdB, 'Order A and Order B have unique IDs bound to respective users');

    // 6. FOOD ON FRIEND ISOLATION TEST
    console.log('\n--- 4. FOOD ON FRIEND SPLIT ISOLATION ---');
    const fofA = await request('POST', '/food-on-friend/request', {
      friendEmail: 'user_b@test.com',
      totalAmount: 500,
      organizerContribution: 250,
      requestedContribution: 250
    }, tokenA);
    assert(fofA.status === 201 && fofA.data.success, 'User A creates Food on Friend request for User B');
    const requestIdA = fofA.data.data?.requestId;

    if (requestIdA) {
      // Unauthorized User C attempts to modify User A's split request
      const unauthorizedAction = await request('PATCH', `/food-on-friend/${requestIdA}/status`, {
        status: 'accepted'
      }, tokenC);
      assert(unauthorizedAction.status === 403, 'Server blocks unauthorized User C from modifying User A request (HTTP 403 Forbidden)');

      // Authorized User B accepts split request
      const authorizedAction = await request('PATCH', `/food-on-friend/${requestIdA}/status`, {
        status: 'accepted'
      }, tokenB);
      assert(authorizedAction.status === 200 && authorizedAction.data.success, 'Authorized recipient User B accepts split request');
    }

    // 7. FOLLOW & SOCIAL ISOLATION TEST
    console.log('\n--- 5. SOCIAL FOLLOW ISOLATION ---');
    const followRes = await request('POST', `/users/user_beta_202/follow`, {}, tokenA);
    assert(followRes.status === 200 && followRes.data.success, 'User A follows User B (@user_beta)');

    const followingC = await request('GET', '/users/user_gamma/following', null, tokenC);
    assert(
      followingC.status === 200 && (followingC.data.data?.following || []).length === 0,
      'User C does not inherit User A following state (independent social graph)'
    );

    // 8. CREATOR MODE ISOLATION TEST
    console.log('\n--- 6. CREATOR MODE ISOLATION ---');
    const updateProfileA = await request('PUT', '/users/profile', { isCreator: true, displayName: 'Alpha Creator' }, tokenA);
    assert(updateProfileA.status === 200 && Boolean(updateProfileA.data.data?.isCreator) === true, 'User A updates profile to Creator Mode');

    const profileB = await request('GET', '/users/profile/user_beta', null, tokenB);
    assert(profileB.status === 200 && Boolean(profileB.data.data?.isCreator) === false, 'User B remains in Consumer Mode (no cross-user creator leakage)');

    // 9. CONTEXT SWITCH / SESSION RESTORATION TEST
    console.log('\n--- 7. CONTEXT SWITCH & SESSION RESTORATION ---');
    const profileASession = await request('POST', '/users/sync', {}, tokenA);
    assert(profileASession.data.data?.user?.username === 'user_alpha', 'Session switch back to User A restores @user_alpha profile');

    const profileBSession = await request('POST', '/users/sync', {}, tokenB);
    assert(profileBSession.data.data?.user?.username === 'user_beta', 'Session switch to User B restores @user_beta profile');

    console.log('\n==================================================');
    console.log(`📊 MULTI-USER ISOLATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test script execution error:', err);
    process.exit(1);
  }
}

runMultiUserIsolationTests();
