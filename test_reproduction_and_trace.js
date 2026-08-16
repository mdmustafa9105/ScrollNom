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

function getDatabaseRow(uid) {
  return new Promise((resolve) => {
    const dbPath = path.resolve('scrollnom.db');
    const db = new sqlite3.Database(dbPath);
    db.get('SELECT id, firebase_uid, email, username, display_name FROM users WHERE firebase_uid = ? OR id = ?', [uid, uid], (err, row) => {
      db.close();
      resolve(row || null);
    });
  });
}

async function traceReproduction() {
  console.log('🔍 --- REPRODUCTION & TRACE AUDIT --- 🔍\n');
  const testUid = `fb_uid_repro_test_${Date.now()}`;
  const testEmail = `repro_test_${Date.now()}@example.com`;
  const token = `fb_token_${testUid}::${encodeURIComponent(testEmail)}`;

  // 1. BEFORE CLAIM: Sync User
  console.log('1. Syncing New User on Auth...');
  const syncRes = await request('POST', '/users/sync', {}, token);
  console.log('   Sync API Response:', JSON.stringify(syncRes.data));

  const dbRowBefore = await getDatabaseRow(testUid);
  console.log('2. SQLite Database Row BEFORE Claim:', JSON.stringify(dbRowBefore));

  // 3. CHECK USERNAME AVAILABILITY
  const targetUsername = `testuser_${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`3. Checking availability for @${targetUsername}...`);
  const checkRes = await request('GET', `/users/check-username?username=${targetUsername}`, null, token);
  console.log('   Check Username API Response:', JSON.stringify(checkRes.data));

  // 4. CLAIM USERNAME
  console.log(`4. Sending POST /api/users/claim-username with username: "${targetUsername}"...`);
  const claimRes = await request('POST', '/users/claim-username', { username: targetUsername }, token);
  console.log('   Claim Username API Status:', claimRes.status);
  console.log('   Claim Username API Response:', JSON.stringify(claimRes.data));

  // 5. AFTER CLAIM: Query SQLite Database Row
  const dbRowAfter = await getDatabaseRow(testUid);
  console.log('5. SQLite Database Row AFTER Claim:', JSON.stringify(dbRowAfter));

  // 6. SYNC AGAIN (Simulate AppContext re-sync)
  console.log('6. Simulating AppContext User Re-sync post claim...');
  const reSyncRes = await request('POST', '/users/sync', {}, token);
  console.log('   Re-Sync API Response:', JSON.stringify(reSyncRes.data));

  console.log('\n📌 ANALYSIS SUMMARY:');
  if (dbRowAfter && dbRowAfter.username === targetUsername) {
    console.log('✅ DATABASE PERSISTENCE LAYER: SUCCESS (Username successfully updated in SQLite database)');
  } else {
    console.log('❌ DATABASE PERSISTENCE LAYER: FAIL (Username was NOT updated in SQLite database)');
  }

  if (reSyncRes.data?.data?.needsUsername === false && reSyncRes.data?.data?.user?.username === targetUsername) {
    console.log('✅ BACKEND USER SYNC LAYER: SUCCESS (Re-sync returns needsUsername = false and correct username)');
  } else {
    console.log('❌ BACKEND USER SYNC LAYER: FAIL (Re-sync resets username or reports needsUsername = true)');
  }
}

traceReproduction().catch(console.error);
