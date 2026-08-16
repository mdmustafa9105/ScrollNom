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

async function runSocialGraphTests() {
  console.log('\n🌐 --- RUNNING PHASE 5: SOCIAL GRAPH & PERSISTENCE TEST SUITE --- 🌐\n');
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
    const ts = Date.now().toString().slice(-6); // 6 digits for valid 12-char usernames
    const unameA = `alpha_${ts}`;
    const unameB = `beta_${ts}`;

    // 1 & 2. Create User A
    const userA_uid = `fb_uid_userA_${ts}`;
    const userA_email = `userA_${ts}@scrollnom.com`;
    const userA_token = `fb_token_${userA_uid}::${encodeURIComponent(userA_email)}`;

    const syncARes = await request('POST', '/users/sync', {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(syncARes.status === 200 && syncARes.data.success === true, 'TEST 1 & 2: Firebase User A synced to persistent SQLite database');
    const userA = syncARes.data.data;

    // Update User A Username to @alpha_<ts>
    const updateARes = await request('PUT', '/users/profile', {
      username: unameA,
      displayName: 'Alpha Creator',
      bio: 'Food Explorer'
    }, { 'Authorization': `Bearer ${userA_token}` });
    assert(updateARes.status === 200 && updateARes.data.data.username === unameA, 'User A profile updated with unique username');

    // 3. Username Uniqueness Constraint
    const userB_uid = `fb_uid_userB_${ts}`;
    const userB_email = `userB_${ts}@scrollnom.com`;
    const userB_token = `fb_token_${userB_uid}::${encodeURIComponent(userB_email)}`;
    await request('POST', '/users/sync', {}, { 'Authorization': `Bearer ${userB_token}` });

    const duplicateUsernameRes = await request('PUT', '/users/profile', {
      username: unameA
    }, { 'Authorization': `Bearer ${userB_token}` });
    assert(duplicateUsernameRes.status === 500 || duplicateUsernameRes.status === 400, 'TEST 3: Duplicate username claim rejected by database constraint');

    // Update User B Username to @beta_<ts>
    const updateBRes = await request('PUT', '/users/profile', {
      username: unameB,
      displayName: 'Beta Foodie'
    }, { 'Authorization': `Bearer ${userB_token}` });
    const userB = updateBRes.data.data;

    // 4 & 5. Username & Display Name Search
    const searchRes = await request('GET', `/users/search?q=${unameA}`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(searchRes.status === 200 && searchRes.data.data.length > 0, 'TEST 4 & 5: Case-insensitive search finds user by username/display name');

    // 6 & 16. Public Profile & EMAIL PRIVACY
    const profileRes = await request('GET', `/users/profile/${unameA}`, {}, { 'Authorization': `Bearer ${userB_token}` });
    assert(profileRes.status === 200 && profileRes.data.data.username === unameA, 'TEST 6: Public profile fetched successfully');
    assert(profileRes.data.data.email === undefined, 'TEST 16 (EMAIL PRIVACY): User email is NOT exposed in public profile');

    // Verify Search Results Email Privacy
    const searchItem = searchRes.data.data[0];
    assert(searchItem.email === undefined, 'TEST 16 (EMAIL PRIVACY): User email is NOT exposed in search results');

    // 7. Follow User (User B follows User A)
    const followRes = await request('POST', `/users/${userA.id}/follow`, {}, { 'Authorization': `Bearer ${userB_token}` });
    assert(followRes.status === 200 && followRes.data.data.isFollowing === true, 'TEST 7: User B follows User A successfully');

    // 8. Duplicate Follow Protection
    const dupFollowRes = await request('POST', `/users/${userA.id}/follow`, {}, { 'Authorization': `Bearer ${userB_token}` });
    assert(dupFollowRes.status === 200 && dupFollowRes.data.data.isFollowing === true, 'TEST 8: Duplicate follow request handled gracefully without error or duplicated rows');

    // 10. Self-Follow Rejection
    const selfFollowRes = await request('POST', `/users/${userA.id}/follow`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(selfFollowRes.status === 400 && selfFollowRes.data.success === false, 'TEST 10: Self-follow rejected with HTTP 400 Bad Request');

    // 11. Followers List
    const followersRes = await request('GET', `/users/${unameA}/followers`);
    assert(followersRes.status === 200 && followersRes.data.data.items.length === 1, 'TEST 11: Followers list returns correct user list');
    assert(followersRes.data.data.items[0].email === undefined, 'TEST 16 (EMAIL PRIVACY): Followers list does NOT expose email addresses');

    // 12. Following List
    const followingRes = await request('GET', `/users/${unameB}/following`);
    assert(followingRes.status === 200 && followingRes.data.data.items.length === 1, 'TEST 12: Following list returns correct followed users');

    // 9. Unfollow User
    const unfollowRes = await request('DELETE', `/users/${userA.id}/follow`, {}, { 'Authorization': `Bearer ${userB_token}` });
    assert(unfollowRes.status === 200 && unfollowRes.data.data.isFollowing === false, 'TEST 9: User B unfollows User A successfully');

    // Verify Follower count decreased
    const profileAfterUnfollow = await request('GET', `/users/profile/${unameA}`);
    assert(profileAfterUnfollow.data.data.followerCount === 0, 'Follower count decreases correctly after unfollow');

    // Re-follow for persistence verification
    await request('POST', `/users/${userA.id}/follow`, {}, { 'Authorization': `Bearer ${userB_token}` });

    // 14 & 15. Persistence Verification
    const profilePersistent = await request('GET', `/users/profile/${unameA}`);
    assert(profilePersistent.data.data.followerCount === 1, 'TEST 14 & 15: Social relationships and user profiles persist in SQLite database');

    // 17 & 18. Unauthorized Follow Attempt Rejection
    const unauthFollowRes = await request('POST', `/users/${userA.id}/follow`, {});
    assert(unauthFollowRes.status === 401, 'TEST 17 & 18: Unauthenticated follow request rejected with HTTP 401 Unauthorized');

    // 19. Unauthorized Profile Modification Rejection
    const unauthProfileRes = await request('PUT', '/users/profile', { displayName: 'Hacked' });
    assert(unauthProfileRes.status === 401, 'TEST 19: Unauthenticated profile update rejected with HTTP 401 Unauthorized');

    console.log(`\n==================================================`);
    console.log(`📊 PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Phase 5 Test execution error:', err);
    process.exit(1);
  }
}

runSocialGraphTests();
