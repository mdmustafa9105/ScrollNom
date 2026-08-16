import sqlite3 from 'sqlite3';
import path from 'path';

const REAL_FIREBASE_UIDS = new Set([
  'p8RKbL25drNWopSimWqe0r7Vq3c2',
  'FRjIW4QCSYPhpHPkPdNwA51gtem1',
  '0FhAWBFmKmR2eeayDnPrBYcH3UF2'
]);

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***${local.slice(-1)}` : `${local}***`;
  return `${maskedLocal}@${domain}`;
}

async function performDatabaseCleanup() {
  console.log('🧹 --- SCROLLNOM SAFE DATABASE USER CLEANUP --- 🧹\n');

  const dbPath = path.resolve('scrollnom.db');
  const db = new sqlite3.Database(dbPath);

  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT id, firebase_uid, email, username, display_name, created_at FROM users', [], (err, res) => {
      if (err) reject(err); else resolve(res || []);
    });
  });

  console.log(`Total Database Users Before Cleanup: ${rows.length}\n`);

  const realUsers = [];
  const testUsers = [];

  rows.forEach(r => {
    const isReal = REAL_FIREBASE_UIDS.has(r.firebase_uid) || REAL_FIREBASE_UIDS.has(r.id);
    let classification = 'AUTOMATED_TEST_FIXTURE';
    if (isReal) {
      classification = 'REAL_FIREBASE_USER';
      realUsers.push({ ...r, classification });
    } else if (r.id === 'u1') {
      classification = 'SEED_FIXTURE';
      testUsers.push({ ...r, classification });
    } else if (r.email && r.email.includes('mustafastudy9105@gmail.com')) {
      classification = 'SYNTHETIC_TEST_USER';
      testUsers.push({ ...r, classification });
    } else {
      testUsers.push({ ...r, classification });
    }
  });

  console.log('🛡️ REAL FIREBASE USERS TO PROTECT (DO NOT DELETE):');
  realUsers.forEach(u => {
    console.log(`  [PROTECTED] ID: ${u.id} | Email: ${maskEmail(u.email)} | Handle: @${u.username} | Name: ${u.display_name}`);
  });

  console.log(`\n🗑️ TEST USER CLEANUP CANDIDATES (${testUsers.length} Users):`);
  testUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. [${u.classification}] ID: ${u.id} | Email: ${maskEmail(u.email)} | Handle: @${u.username}`);
  });

  if (testUsers.length === 0) {
    console.log('\nNo test candidates to clean.');
    db.close();
    return;
  }

  console.log('\nExecuting safe deletion of test candidates and associated test relational data...');

  const testIds = testUsers.map(u => u.id);
  const placeholders = testIds.map(() => '?').join(',');

  // 1. Clean test references in follows table
  await new Promise((res) => {
    db.run(`DELETE FROM follows WHERE follower_user_id IN (${placeholders}) OR following_user_id IN (${placeholders})`, [...testIds, ...testIds], (err) => {
      if (err) console.error('Error cleaning follows:', err);
      res();
    });
  });

  // 2. Clean test references in orders table
  await new Promise((res) => {
    db.run(`DELETE FROM orders WHERE user_id IN (${placeholders})`, testIds, (err) => {
      if (err) console.error('Error cleaning orders:', err);
      res();
    });
  });

  // 3. Delete candidate test users from users table
  const deleteResult = await new Promise((res) => {
    db.run(`DELETE FROM users WHERE id IN (${placeholders})`, testIds, function(err) {
      if (err) console.error('Error deleting test users:', err);
      res(this.changes || 0);
    });
  });

  const finalRows = await new Promise((res) => {
    db.all('SELECT id, firebase_uid, email, username, display_name FROM users', [], (err, r) => res(r || []));
  });

  console.log(`\n✅ DATABASE CLEANUP COMPLETE!`);
  console.log(`   Deleted ${deleteResult} test user rows.`);
  console.log(`   Remaining Users in Database: ${finalRows.length}`);
  finalRows.forEach(u => console.log(`   - ID: ${u.id} | Handle: @${u.username} | Name: ${u.display_name}`));

  db.close();
}

performDatabaseCleanup().catch(console.error);
