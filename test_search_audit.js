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

function getDatabaseRows(searchTerm) {
  return new Promise((resolve) => {
    const dbPath = path.resolve('scrollnom.db');
    const db = new sqlite3.Database(dbPath);
    const term = `%${searchTerm.toLowerCase()}%`;
    db.all(`
      SELECT id, firebase_uid, email, username, display_name, avatar_url, is_creator, created_at
      FROM users
      WHERE LOWER(username) LIKE ? OR LOWER(display_name) LIKE ?
    `, [term, term], (err, rows) => {
      db.close();
      resolve(rows || []);
    });
  });
}

async function auditSearch() {
  console.log('🔍 --- REAL PROFILE SEARCH DIAGNOSIS & DATA PATH TRACE --- 🔍\n');

  const tokenB = 'fb_token_user_beta_search_test::user_b@test.com';

  // 1. QUERY REAL USER A IN SQLITE DATABASE
  const realUidA = 'p8RKbL25drNWopSimWqe0r7Vq3c2';
  const dbUserA = await new Promise(res => {
    const db = new sqlite3.Database('scrollnom.db');
    db.get('SELECT * FROM users WHERE id = ? OR firebase_uid = ?', [realUidA, realUidA], (err, row) => {
      db.close();
      res(row || null);
    });
  });

  console.log('1. User A Database Record (p8RKbL25drNWopSimWqe0r7Vq3c2):');
  console.log('   ', JSON.stringify(dbUserA));

  // 2. UNAUTHENTICATED SEARCH REQUEST (Guest Search)
  console.log('\n2. Unauthenticated Search (Guest): GET /api/users/search?q=mohammed');
  const guestSearch = await request('GET', '/users/search?q=mohammed');
  console.log('   Status Code:', guestSearch.status);
  console.log('   Response Body:', JSON.stringify(guestSearch.data));

  // 3. AUTHENTICATED SEARCH REQUEST FROM USER B FOR EXACT USERNAME
  const usernameQuery = dbUserA ? dbUserA.username : 'mohammedmustafa';
  console.log(`\n3. Authenticated Search by User B: GET /api/users/search?q=${usernameQuery}`);
  const authSearchUsername = await request('GET', `/users/search?q=${encodeURIComponent(usernameQuery)}`, null, tokenB);
  console.log('   Status Code:', authSearchUsername.status);
  console.log('   Response Body:', JSON.stringify(authSearchUsername.data));

  // 4. AUTHENTICATED SEARCH REQUEST FROM USER B FOR DISPLAY NAME
  const displayNameQuery = dbUserA ? dbUserA.display_name : 'Mohammed Mustafa';
  console.log(`\n4. Authenticated Search by User B: GET /api/users/search?q=${encodeURIComponent(displayNameQuery)}`);
  const authSearchName = await request('GET', `/users/search?q=${encodeURIComponent(displayNameQuery)}`, null, tokenB);
  console.log('   Status Code:', authSearchName.status);
  console.log('   Response Body:', JSON.stringify(authSearchName.data));

  // 5. PUBLIC PROFILE ENDPOINT ACCESS BY USER B
  console.log(`\n5. Public Profile Endpoint Access by User B: GET /api/users/profile/${usernameQuery}`);
  const publicProfileRes = await request('GET', `/users/profile/${usernameQuery}`, null, tokenB);
  console.log('   Status Code:', publicProfileRes.status);
  console.log('   Response Body:', JSON.stringify(publicProfileRes.data));

  // 6. SQLITE DIRECT SEARCH RESULTS
  const sqlResults = await getDatabaseRows('mohammed');
  console.log('\n6. Direct SQLite Database Search Results for "mohammed":');
  console.log('   Count:', sqlResults.length);
  sqlResults.forEach(r => console.log(`   - ID: ${r.id} | Handle: @${r.username} | Name: ${r.display_name} | IsCreator: ${r.is_creator}`));
}

auditSearch().catch(console.error);
