import http from 'http';
import sqlite3 from 'sqlite3';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

function request(method, reqPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + reqPath);
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

async function runPhase10TestSuite() {
  console.log('\n🌟 --- RUNNING PHASE 10: REAL USERS SOCIAL GRAPH & BENGALURU DISCOVERY SUITE --- 🌟\n');

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
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.data?.ok, 'GET /api/health returns status 200 OK');

    // 2. REAL FIREBASE USER SYNC (User A & User B)
    const userA_uid = 'p8RKbL25drNWopSimWqe0r7Vq3c2';
    const userB_uid = 'FRjIW4QCSYPhpHPkPdNwA51gtem1';
    const userC_uid = '0FhAWBFmKmR2eeayDnPrBYcH3UF2';

    const tokenA = `fb_token_${userA_uid}::mustafastudy9105@gmail.com`;
    const tokenB = `fb_token_${userB_uid}::mohammedmustafa9105@gmail.com`;
    const tokenC = `fb_token_${userC_uid}::iamcaptainhermes@gmail.com`;

    const syncA = await request('POST', '/users/sync', {}, tokenA);
    assert(syncA.status === 200 && syncA.data.data?.user?.username === 'mohammedmustafa', 'User A (@mohammedmustafa) sync succeeds');

    const syncB = await request('POST', '/users/sync', {}, tokenB);
    assert(syncB.status === 200 && syncB.data.data?.user?.username === 'mohammedmustafa9105', 'User B (@mohammedmustafa9105) sync succeeds');

    const syncC = await request('POST', '/users/sync', {}, tokenC);
    assert(syncC.status === 200 && syncC.data.data?.user?.username === 'iamcaptainhermes', 'User C (@iamcaptainhermes) sync succeeds');

    // 3. GUEST SEARCH & AUTHENTICATED SEARCH
    console.log('\n--- SEARCH & DISCOVERY ---');
    const guestSearch = await request('GET', '/users/search?q=mohammed');
    assert(guestSearch.status === 200 && guestSearch.data.data?.length >= 2, 'Guest User Search returns HTTP 200 with public user profiles');

    const exactSearch = await request('GET', '/users/search?q=mohammedmustafa', null, tokenB);
    assert(exactSearch.status === 200 && exactSearch.data.data[0]?.username === 'mohammedmustafa', 'Exact handle search ranks User A first');

    const beverageSearch = await request('GET', '/users/search?q=coffee', null, tokenA);
    assert(beverageSearch.status === 200, 'Food & Beverage category search query executes cleanly');

    // 4. SOCIAL GRAPH (USER A FOLLOWS USER B)
    console.log('\n--- MUTUAL SOCIAL GRAPH & FOLLOW PERSISTENCE ---');
    const followB = await request('POST', `/users/${userB_uid}/follow`, {}, tokenA);
    assert(followB.status === 200 && followB.data.data?.isFollowing === true, 'User A successfully follows User B');

    // USER B FOLLOWS USER A (MUTUAL FOLLOW)
    const followA = await request('POST', `/users/${userA_uid}/follow`, {}, tokenB);
    assert(followA.status === 200 && followA.data.data?.isFollowing === true, 'User B successfully follows User A back (Mutual Follow)');

    // 5. PUBLIC PROFILE & FOLLOWER / FOLLOWING LISTS
    console.log('\n--- PUBLIC PROFILES & LIST ENDPOINTS ---');
    const profileA = await request('GET', `/users/profile/mohammedmustafa`, null, tokenB);
    assert(
      profileA.status === 200 &&
      profileA.data.data?.isFollowing === true &&
      profileA.data.data?.followerCount >= 1,
      'User B views User A profile: shows isFollowing = true & followerCount >= 1'
    );

    const followersListA = await request('GET', `/users/mohammedmustafa/followers`, null, tokenB);
    assert(followersListA.status === 200 && followersListA.data.data?.items?.length >= 1, 'User A Followers list returns active follower items');

    const followingListA = await request('GET', `/users/mohammedmustafa/following`, null, tokenB);
    assert(followingListA.status === 200 && followingListA.data.data?.items?.length >= 1, 'User A Following list returns active following items');

    // 6. FOLLOWING FEED INTEGRATION
    console.log('\n--- FOLLOWING FEED INTEGRATION ---');
    const followingFeedA = await request('GET', '/feed/following', null, tokenA);
    assert(followingFeedA.status === 200 && Array.isArray(followingFeedA.data.data?.items || followingFeedA.data.data), 'User A Following feed API responds with status 200 and items array');

    // 7. MULTI-USER ISOLATION & AUTHORIZATION SECURITY
    console.log('\n--- MULTI-USER SECURITY & AUTHORIZATION ---');
    const unauthorizedEdit = await request('PUT', '/users/profile', { displayName: 'Hacked Name' }, tokenC);
    assert(unauthorizedEdit.status === 200, 'User C profile edit updates User C only (No cross-user profile mutation)');
    
    const verifyProfileAAfterC = await request('GET', '/users/profile/mohammedmustafa');
    assert(verifyProfileAAfterC.data.data?.displayName === 'Mohammed Mustafa', 'User A display name remains unaffected by User C requests');

    // 8. SQLITE DATABASE PERSISTENCE CHECK
    console.log('\n--- DIRECT SQLITE DATABASE PERSISTENCE CHECK ---');
    const dbPath = path.resolve('scrollnom.db');
    const db = new sqlite3.Database(dbPath);

    const followsCount = await new Promise(res => {
      db.get('SELECT COUNT(*) as count FROM follows', [], (err, row) => res(row ? row.count : 0));
    });
    console.log(`   SQLite Persistent Follow Relationships Count: ${followsCount}`);
    assert(followsCount >= 2, 'SQLite follows table contains persistent follow relationship rows');
    db.close();

    console.log('\n==================================================');
    console.log(`📊 PHASE 10 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runPhase10TestSuite();
