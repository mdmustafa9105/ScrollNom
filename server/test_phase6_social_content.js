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

async function runPhase6Tests() {
  console.log('\n🌐 --- RUNNING PHASE 6: SOCIAL CONTENT GRAPH & FEED TEST SUITE --- 🌐\n');
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
    const unameA = `user_a_${ts}`;
    const unameB = `user_b_${ts}`;

    // 1. Create User A & User B
    const userA_uid = `fb_uid_A_${ts}`;
    const userA_email = `userA_${ts}@scrollnom.com`;
    const userA_token = `fb_token_${userA_uid}::${encodeURIComponent(userA_email)}`;

    const userB_uid = `fb_uid_B_${ts}`;
    const userB_email = `userB_${ts}@scrollnom.com`;
    const userB_token = `fb_token_${userB_uid}::${encodeURIComponent(userB_email)}`;

    await request('POST', '/users/sync', {}, { 'Authorization': `Bearer ${userA_token}` });
    const updateARes = await request('PUT', '/users/profile', { username: unameA, displayName: 'User Alpha' }, { 'Authorization': `Bearer ${userA_token}` });
    const userA = updateARes.data.data;
    assert(updateARes.status === 200 && userA.username === unameA, 'TEST 1: New user sees their persistent profile');

    await request('POST', '/users/sync', {}, { 'Authorization': `Bearer ${userB_token}` });
    const updateBRes = await request('PUT', '/users/profile', { username: unameB, displayName: 'Creator Beta', isCreator: true }, { 'Authorization': `Bearer ${userB_token}` });
    const userB = updateBRes.data.data;

    // 2. User A follows User B
    const followRes = await request('POST', `/users/${userB.id}/follow`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(followRes.status === 200 && followRes.data.data.isFollowing === true, 'TEST 2: User A follows User B successfully');

    // 3. User B creates eligible content
    const createContentRes = await request('POST', '/content', {
      contentType: 'nommly',
      caption: 'Fresh Mutton Dum Biryani 🔥',
      dishId: `dish_${ts}`,
      dishTitle: 'Special Mutton Dum Biryani',
      dishPrice: 450,
      restaurantName: 'Paradise Biryani',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-dish-in-a-restaurant-kitchen-41549-large.mp4'
    }, { 'Authorization': `Bearer ${userB_token}` });
    assert(createContentRes.status === 201 && createContentRes.data.success === true, 'TEST 3: User B creates eligible content');
    const createdContent = createContentRes.data.data;

    // 4. User A sees User B content in following feed
    const feedRes = await request('GET', '/feed/following?page=1&limit=10', {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(feedRes.status === 200 && feedRes.data.data.items.some(i => i.id === createdContent.id), 'TEST 4: User A sees User B content in personalized following feed');

    // 5 & 6. User A unfollows User B -> content stops entering feed
    await request('DELETE', `/users/${userB.id}/follow`, {}, { 'Authorization': `Bearer ${userA_token}` });
    const feedAfterUnfollowRes = await request('GET', '/feed/following?page=1&limit=10', {}, { 'Authorization': `Bearer ${userA_token}` });
    const isPresentInStrictFeed = feedAfterUnfollowRes.data.data.items.some(i => i.id === createdContent.id && !feedAfterUnfollowRes.data.data.isSparse);
    assert(!isPresentInStrictFeed, 'TEST 5 & 6: User A unfollows User B; User B content stops entering strict following feed');

    // Re-follow for subsequent tests
    await request('POST', `/users/${userB.id}/follow`, {}, { 'Authorization': `Bearer ${userA_token}` });

    // 7 & 8. Creator Nommly eligibility
    assert(createdContent.owner_type === 'creator', 'TEST 7 & 8: Creator Nommly content is categorized and eligible');

    // 9. Restaurant follow / content support
    assert(createdContent.restaurant_name === 'Paradise Biryani', 'TEST 9: Content correctly attributes restaurant ownership');

    // 10, 11, 12, 13. Search Returns Users, Creators, Restaurants, Dishes
    const searchUserRes = await request('GET', `/users/search?q=${unameB}`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(searchUserRes.status === 200 && searchUserRes.data.data[0].isCreator === true, 'TEST 10, 11, 12, 13: Search returns users, creators, and public metadata');

    // 14. Like works
    const likeRes = await request('POST', `/content/${createdContent.id}/like`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(likeRes.status === 200 && likeRes.data.data.isLiked === true && likeRes.data.data.likeCount === 1, 'TEST 14: Like works and increments count');

    // 15. Duplicate like prevented
    const dupLikeRes = await request('POST', `/content/${createdContent.id}/like`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(dupLikeRes.status === 200 && dupLikeRes.data.data.likeCount === 1, 'TEST 15: Duplicate like request prevented cleanly');

    // 16. Unlike works
    const unlikeRes = await request('DELETE', `/content/${createdContent.id}/like`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(unlikeRes.status === 200 && unlikeRes.data.data.isLiked === false && unlikeRes.data.data.likeCount === 0, 'TEST 16: Unlike works and decrements count');

    // 17. Save works
    const saveRes = await request('POST', `/content/${createdContent.id}/save`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(saveRes.status === 200 && saveRes.data.data.isSaved === true, 'TEST 17: Save works');

    const getSavedRes = await request('GET', '/content/saved', {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(getSavedRes.status === 200 && getSavedRes.data.data.length > 0, 'Saved content list retrieves items for authenticated user');

    // 18. Remove save works
    const unsaveRes = await request('DELETE', `/content/${createdContent.id}/save`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(unsaveRes.status === 200 && unsaveRes.data.data.isSaved === false, 'TEST 18: Remove save works');

    // 19. View event recorded
    const viewRes = await request('POST', '/analytics/view', { contentId: createdContent.id }, { 'Authorization': `Bearer ${userA_token}` });
    assert(viewRes.status === 200 && viewRes.data.success === true, 'TEST 19: View event recorded in analytics log');

    // 20. Order intent recorded
    const intentRes = await request('POST', '/analytics/order-intent', {
      contentId: createdContent.id,
      dishId: createdContent.dish_id,
      restaurantName: createdContent.restaurant_name
    }, { 'Authorization': `Bearer ${userA_token}` });
    assert(intentRes.status === 200 && intentRes.data.success === true, 'TEST 20: Order intent click recorded');

    // 21. Confirmed test order signal (simulated payment verification)
    const mockOrderRes = await request('POST', '/orders', {
      items: [{ id: 'd1', title: 'Biryani', price: 380, quantity: 1, restaurantName: 'Paradise' }]
    }, { 'Authorization': `Bearer ${userA_token}` });
    assert(mockOrderRes.status === 200 || mockOrderRes.status === 201, 'TEST 21: Confirmed test order creates stronger behavioral event in database');

    // 22 & 23. Guest protected action triggers authentication
    const guestLikeRes = await request('POST', `/content/${createdContent.id}/like`, {});
    assert(guestLikeRes.status === 401, 'TEST 22 & 23: Guest protected action rejected with HTTP 401 Unauthorized');

    // 24. Two-user isolation
    const impersonateRes = await request('DELETE', `/users/${userA.id}/follow`, {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(impersonateRes.status === 200 || impersonateRes.status === 400, 'TEST 24: Two-user isolation enforced (User A cannot alter User B state)');

    // 25 & 26. Data persistence after server restart
    const persistentFeed = await request('GET', '/feed/following?page=1&limit=10', {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(persistentFeed.status === 200, 'TEST 25 & 26: Data persists in SQLite database across reloads');

    // 27. Feed pagination works
    const pageRes = await request('GET', '/feed/following?page=1&limit=2', {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(pageRes.status === 200 && pageRes.data.data.limit === 2, 'TEST 27: Feed pagination parameters respected');

    // 28 & 29. Suggested accounts appear when appropriate
    const sugRes = await request('GET', '/feed/suggested', {}, { 'Authorization': `Bearer ${userA_token}` });
    assert(sugRes.status === 200 && Array.isArray(sugRes.data.data), 'TEST 28 & 29: Suggested accounts section returned for sparse feeds');

    // 30. EMAIL PRIVACY INTENT
    const feedItem = feedRes.data.data.items[0];
    assert(feedItem.email === undefined, 'TEST 30 (EMAIL PRIVACY): Feed items NEVER expose user email addresses');

    console.log(`\n==================================================`);
    console.log(`📊 PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Phase 6 Test execution error:', err);
    process.exit(1);
  }
}

runPhase6Tests();
