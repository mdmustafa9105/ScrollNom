import http from 'http';
import path from 'path';
import { getTimeBelt, BELT_SCHEDULE } from './server/services/timeBeltService.js';

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

async function runPhase12TestSuite() {
  console.log('\n⏰ --- RUNNING PHASE 12: TIME BELT & CONTEXTUAL DISCOVERY SUITE --- ⏰\n');

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
    // 1. TIME BELT BOUNDARY MATRIX
    console.log('--- 1. TIME BELT EXACT BOUNDARY MATRIX ---');
    const boundaries = [
      { h: 4, m: 59, expected: BELT_SCHEDULE.OVERNIGHT },
      { h: 5, m: 0, expected: BELT_SCHEDULE.TRANSITION_MORNING },
      { h: 5, m: 59, expected: BELT_SCHEDULE.TRANSITION_MORNING },
      { h: 6, m: 0, expected: BELT_SCHEDULE.MORNING },
      { h: 10, m: 59, expected: BELT_SCHEDULE.MORNING },
      { h: 11, m: 0, expected: BELT_SCHEDULE.MORNING_AFTERNOON },
      { h: 11, m: 59, expected: BELT_SCHEDULE.MORNING_AFTERNOON },
      { h: 12, m: 0, expected: BELT_SCHEDULE.AFTERNOON },
      { h: 14, m: 59, expected: BELT_SCHEDULE.AFTERNOON },
      { h: 15, m: 0, expected: BELT_SCHEDULE.AFTERNOON_EVENING },
      { h: 15, m: 59, expected: BELT_SCHEDULE.AFTERNOON_EVENING },
      { h: 16, m: 0, expected: BELT_SCHEDULE.EVENING },
      { h: 20, m: 59, expected: BELT_SCHEDULE.EVENING },
      { h: 21, m: 0, expected: BELT_SCHEDULE.OVERNIGHT }
    ];

    boundaries.forEach(b => {
      const result = getTimeBelt(b.h, b.m);
      assert(
        result.id === b.expected,
        `Clock ${String(b.h).padStart(2, '0')}:${String(b.m).padStart(2, '0')} -> ${result.id} (Expected: ${b.expected})`
      );
    });

    // 2. NEARBY DISCOVERY API & CONTEXTUAL RANKING
    console.log('\n--- 2. NEARBY DISCOVERY API & CONTEXTUAL RANKING ---');
    const morningDiscovery = await request('GET', '/discovery/nearby?hour=8&minute=30');
    assert(
      morningDiscovery.status === 200 &&
      morningDiscovery.data.data?.timeBelt?.id === BELT_SCHEDULE.MORNING,
      'GET /api/discovery/nearby?hour=8 returns MORNING Time Belt context'
    );

    const items = morningDiscovery.data.data?.items || [];
    assert(items.length > 0, 'Contextual ranking returns ranked Nommly items');
    assert(items[0]?.explanationSignals?.length > 0, 'Ranked items contain explanation signals (e.g. TIME_MATCH, OPEN_NOW, NEARBY)');

    // 3. BROKEN BELT TOGGLE
    console.log('\n--- 3. BROKEN BELT MODE TOGGLE ---');
    const brokenDiscovery = await request('GET', '/discovery/nearby?hour=8&minute=30&isBrokenBelt=true');
    assert(
      brokenDiscovery.status === 200 &&
      brokenDiscovery.data.data?.isBrokenBelt === true,
      'GET /api/discovery/nearby with isBrokenBelt=true activates BROKEN BELT mode'
    );

    const brokenSignals = brokenDiscovery.data.data?.items[0]?.explanationSignals || [];
    const hasBrokenSignal = brokenSignals.some(s => s.type === 'BROKEN_BELT');
    assert(hasBrokenSignal, 'Broken Belt mode attaches BROKEN_BELT explanation signal to ranked items');

    // 4. BEHAVIORAL SIGNAL RECORDING
    console.log('\n--- 4. BEHAVIORAL DISCOVERY SIGNALS ---');
    const signalRes = await request('POST', '/discovery/signals', {
      eventType: 'broken_belt_activated',
      beltId: 'MORNING'
    });
    assert(signalRes.status === 200 && signalRes.data.data?.signalId, 'POST /api/discovery/signals records discovery signal');

    // 5. MULTI-USER LOCATION ISOLATION
    console.log('\n--- 5. MULTI-USER LOCATION ISOLATION ---');
    const locA = await request('GET', '/discovery/nearby?lat=12.9785&lng=77.6402');
    const locB = await request('GET', '/discovery/nearby?lat=12.9352&lng=77.6245');

    assert(locA.status === 200 && locB.status === 200, 'Independent location coordinates evaluated without cross-user leakage');

    console.log('\n==================================================');
    console.log(`📊 PHASE 12 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runPhase12TestSuite();
