import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => fs.existsSync(p));

if (!EDGE_PATH) {
  console.error('Edge browser executable not found.');
  process.exit(1);
}

console.log(`[EDGE AUTOMATION] Found Microsoft Edge at: ${EDGE_PATH}`);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runEdgeTest() {
  const browserA = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const browserB = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  try {
    const pageA = await browserA.newPage();
    const pageB = await browserB.newPage();

    console.log('\n[1/5] Syncing and Setting up User A in Browser A...');
    await pageA.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    const userAObj = await pageA.evaluate(async () => {
      const syncRes = await fetch('http://localhost:5000/api/users/sync', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer fb_token_fb_user_a::user_a@scrollnom.com' }
      });
      const syncJson = await syncRes.json();

      await fetch('http://localhost:5000/api/users/claim-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_fb_user_a::user_a@scrollnom.com' },
        body: JSON.stringify({ username: 'user_a' })
      });

      const userA = {
        id: syncJson.data?.user?.id || 'fb_user_a',
        firebaseUid: 'fb_user_a',
        name: 'User Alpha',
        email: 'user_a@scrollnom.com',
        username: 'user_a',
        handle: '@user_a',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: 'Tester Alpha',
        isLoggedIn: true,
        isCreator: true,
        address: { area: 'Indiranagar, Bengaluru' }
      };
      localStorage.setItem('scrollnom_user', JSON.stringify(userA));
      return userA;
    });

    console.log('[2/5] Syncing and Setting up User B in Browser B...');
    await pageB.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    const userBObj = await pageB.evaluate(async () => {
      const syncRes = await fetch('http://localhost:5000/api/users/sync', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer fb_token_fb_user_b::user_b@scrollnom.com' }
      });
      const syncJson = await syncRes.json();

      await fetch('http://localhost:5000/api/users/claim-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fb_token_fb_user_b::user_b@scrollnom.com' },
        body: JSON.stringify({ username: 'user_b' })
      });

      const userB = {
        id: syncJson.data?.user?.id || 'fb_user_b',
        firebaseUid: 'fb_user_b',
        name: 'User Beta',
        email: 'user_b@scrollnom.com',
        username: 'user_b',
        handle: '@user_b',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Tester Beta',
        isLoggedIn: true,
        isCreator: false,
        address: { area: 'Koramangala, Bengaluru' }
      };
      localStorage.setItem('scrollnom_user', JSON.stringify(userB));
      return userB;
    });

    await sleep(500);

    console.log(`\n[3/5] Testing User A (${userAObj.id}) Messaging User B (${userBObj.id}) in Real Edge...`);
    const sentResult = await pageA.evaluate(async (targetId) => {
      const res = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fb_token_fb_user_a::user_a@scrollnom.com'
        },
        body: JSON.stringify({
          recipientId: targetId,
          body: 'Hello User B from Edge Browser A!'
        })
      });
      return await res.json();
    }, userBObj.id);
    console.log(`✅ Sent Message result: ${sentResult.success ? 'SUCCESS' : JSON.stringify(sentResult)}`);

    await sleep(1000);

    const unreadB = await pageB.evaluate(async () => {
      const res = await fetch('http://localhost:5000/api/notifications/unread-count', {
        headers: { 'Authorization': 'Bearer fb_token_fb_user_b::user_b@scrollnom.com' }
      });
      const json = await res.json();
      return json.data?.unreadCount || 0;
    });
    console.log(`✅ User B Unread Notification Count in Edge: ${unreadB}`);

    console.log(`\n[4/5] Testing User A Following User B (${userBObj.id}) in Edge...`);
    const followResult = await pageA.evaluate(async (targetId) => {
      const res = await fetch(`http://localhost:5000/api/users/${targetId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer fb_token_fb_user_a::user_a@scrollnom.com' }
      });
      return await res.json();
    }, userBObj.id);
    console.log(`✅ User A Followed User B result: ${followResult.success ? 'SUCCESS' : JSON.stringify(followResult)}`);

    await sleep(1000);

    console.log('\n[5/5] Testing Food on Friend Notification in Edge...');
    const fofResult = await pageA.evaluate(async () => {
      const res = await fetch('http://localhost:5000/api/food-on-friend/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fb_token_fb_user_a::user_a@scrollnom.com'
        },
        body: JSON.stringify({
          orderId: 'ord_edge_999',
          friendName: 'user_b',
          friendEmail: 'user_b@scrollnom.com',
          totalAmount: 450,
          requestedContribution: 225
        })
      });
      return await res.json();
    });
    console.log(`✅ Food on Friend Request result: ${fofResult.success ? 'SUCCESS' : JSON.stringify(fofResult)}`);

    await sleep(1000);

    const notifsBList = await pageB.evaluate(async () => {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': 'Bearer fb_token_fb_user_b::user_b@scrollnom.com' }
      });
      const json = await res.json();
      return json.data || [];
    });

    console.log(`✅ User B Total Received Notifications in Edge: ${notifsBList.length}`);
    notifsBList.forEach(n => {
      console.log(`   - [${n.type}] ${n.title}: ${n.body}`);
    });

    if (notifsBList.length < 3) {
      throw new Error(`Expected at least 3 notifications for User B, got ${notifsBList.length}`);
    }

    console.log('\n==================================================');
    console.log('🎉 REAL MICROSOFT EDGE BROWSER DUAL CONTEXT VERIFICATION PASSED!');
    console.log('==================================================');

  } finally {
    await browserA.close();
    await browserB.close();
  }
}

runEdgeTest().catch(err => {
  console.error('❌ EDGE TEST FAILED:', err);
  process.exit(1);
});
