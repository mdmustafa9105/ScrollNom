import sqlite3 from 'sqlite3';
import path from 'path';

async function cleanActiveDemoOrders() {
  console.log('🧹 --- CLEANING DEMO / TEST ORDERS & DELIVERIES --- 🧹\n');

  const dbPath = path.resolve('scrollnom.db');
  const db = new sqlite3.Database(dbPath);

  await new Promise((res) => {
    db.run('DELETE FROM delivery_events', [], (err) => {
      if (err) console.error('Error clearing delivery_events:', err);
      res();
    });
  });

  await new Promise((res) => {
    db.run('DELETE FROM deliveries', [], (err) => {
      if (err) console.error('Error clearing deliveries:', err);
      res();
    });
  });

  await new Promise((res) => {
    db.run('DELETE FROM orders', [], (err) => {
      if (err) console.error('Error clearing orders:', err);
      res();
    });
  });

  await new Promise((res) => {
    db.run('DELETE FROM confirmed_order_intents', [], (err) => {
      if (err) console.error('Error clearing confirmed_order_intents:', err);
      res();
    });
  });

  console.log('✅ Active orders and deliveries database tables cleaned successfully!');
  console.log('   Restaurant and Rider applications will now start empty (0 active orders / 0 active deliveries).\n');

  db.close();
}

cleanActiveDemoOrders().catch(console.error);
