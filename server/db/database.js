// Persistent SQLite Database Layer for ScrollNom Backend
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../scrollnom.db');

sqlite3.verbose();

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DATABASE ERROR] Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`[DATABASE] Connected to persistent SQLite database: ${dbPath}`);
  }
});

// Enable Foreign Keys
db.run('PRAGMA foreign_keys = ON;');

// Initialize Database Schema
db.serialize(() => {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firebase_uid TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      is_creator INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Follows Table
  db.run(`
    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_user_id TEXT NOT NULL,
      following_user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_user_id, following_user_id),
      FOREIGN KEY(follower_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(following_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Content Table
  db.run(`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      owner_type TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_avatar TEXT,
      dish_id TEXT,
      dish_title TEXT,
      dish_price REAL,
      restaurant_name TEXT,
      media_url TEXT NOT NULL,
      poster_url TEXT,
      caption TEXT,
      like_count INTEGER DEFAULT 0,
      save_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Content Likes Table
  db.run(`
    CREATE TABLE IF NOT EXISTS content_likes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, content_id)
    );
  `);

  // Content Saves Table
  db.run(`
    CREATE TABLE IF NOT EXISTS content_saves (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      dish_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, content_id)
    );
  `);

  // Content Views Table
  db.run(`
    CREATE TABLE IF NOT EXISTS content_views (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Order Intents Signal Table
  db.run(`
    CREATE TABLE IF NOT EXISTS order_intents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_id TEXT,
      dish_id TEXT NOT NULL,
      restaurant_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Confirmed Order Intents Signal Table
  db.run(`
    CREATE TABLE IF NOT EXISTS confirmed_order_intents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      razorpay_payment_id TEXT,
      amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Deliveries Table (Phase 7 Real-Time Delivery Architecture)
  db.run(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      rider_id TEXT,
      rider_name TEXT,
      rider_phone_masked TEXT,
      pickup_lat REAL,
      pickup_lng REAL,
      delivery_lat REAL,
      delivery_lng REAL,
      rider_lat REAL,
      rider_lng REAL,
      eta_minutes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Delivery Events Table (Phase 7 Real-Time Delivery Event Audit Trail)
  db.run(`
    CREATE TABLE IF NOT EXISTS delivery_events (
      id TEXT PRIMARY KEY,
      delivery_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
    );
  `);

  // Deliveries Indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery_id ON delivery_events(delivery_id);`);

  // Orders Table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      items_json TEXT NOT NULL,
      restaurant_name TEXT,
      subtotal REAL,
      delivery_fee REAL,
      taxes REAL,
      amount REAL,
      amount_paise INTEGER,
      currency TEXT DEFAULT 'INR',
      status TEXT,
      payment_status TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Food on Friend Requests Table
  db.run(`
    CREATE TABLE IF NOT EXISTS food_on_friend_requests (
      request_id TEXT PRIMARY KEY,
      organizer_id TEXT NOT NULL,
      friend_name TEXT,
      friend_email TEXT,
      order_id TEXT,
      total_amount REAL,
      organizer_contribution REAL,
      requested_contribution REAL,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );
  `);
  // Creator-Restaurant Collaborations Table
  db.run(`
    CREATE TABLE IF NOT EXISTS creator_collaborations (
      id TEXT PRIMARY KEY,
      creator_user_id TEXT NOT NULL,
      creator_username TEXT,
      creator_name TEXT,
      creator_avatar TEXT,
      restaurant_id TEXT NOT NULL,
      restaurant_name TEXT NOT NULL,
      dish_id TEXT,
      dish_title TEXT,
      promotion_type TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_collabs_creator ON creator_collaborations(creator_user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_collabs_restaurant ON creator_collaborations(restaurant_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_collabs_status ON creator_collaborations(status);`);


  // Seed default demo user if database is empty
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (!err && row && row.count === 0) {
      db.run(`
        INSERT INTO users (id, firebase_uid, email, username, display_name, avatar_url, bio, is_creator)
        VALUES ('u_seed_demo', 'fb_seed_demo', 'foodie@scrollnom.com', 'foodie_explorer', 'Foodie Explorer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Food creator & Biryani lover 🍔', 1)
      `);
      console.log('[DATABASE] Seeded default demo creator profile (@foodie_explorer)');
    }
  });

  // Seed default demo content if content table is empty
  db.get('SELECT COUNT(*) as count FROM content', (err, row) => {
    if (!err && row && row.count === 0) {
      const demoItems = [
        {
          id: 'c1',
          type: 'nommly',
          ownerId: 'u_seed_demo',
          ownerType: 'creator',
          ownerName: 'Foodie Explorer',
          ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          dishId: 'd1',
          dishTitle: 'Hyderabadi Dum Biryani',
          dishPrice: 380,
          restaurantName: 'Paradise Biryani Palace',
          mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-dish-in-a-restaurant-kitchen-41549-large.mp4',
          posterUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
          caption: 'Original Hyderabadi Dum Biryani slow cooked over charcoal dum 🔥 #HyderabadiBiryani #ScrollNom',
          likes: 42,
          saves: 18
        },
        {
          id: 'c2',
          type: 'nommly',
          ownerId: 'c_chef_alec',
          ownerType: 'creator',
          ownerName: 'Chef Alec',
          ownerAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
          dishId: 'd2',
          dishTitle: 'Truffle Mushroom Burger',
          dishPrice: 420,
          restaurantName: 'The Artisan Grill',
          mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-putting-a-patty-on-a-burger-41551-large.mp4',
          posterUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
          caption: 'Double smash patty with black truffle aioli & melted Gruyère 🧀 #BurgerTime #FoodTok',
          likes: 89,
          saves: 34
        },
        {
          id: 'c3',
          type: 'nommly',
          ownerId: 'c_priya_eats',
          ownerType: 'creator',
          ownerName: 'Priya Eats',
          ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          dishId: 'd3',
          dishTitle: 'Butter Garlic Naan & Paneer Butter Masala',
          dishPrice: 310,
          restaurantName: 'Dhaba Est. 1986',
          mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fresh-bread-coming-out-of-a-wood-fired-oven-42289-large.mp4',
          posterUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
          caption: 'Softest clay oven naan pulled fresh with creamy paneer gravy 🍛 #NorthIndian #ComfortFood',
          likes: 65,
          saves: 22
        }
      ];

      demoItems.forEach(item => {
        db.run(`
          INSERT INTO content (id, content_type, owner_id, owner_type, owner_name, owner_avatar, dish_id, dish_title, dish_price, restaurant_name, media_url, poster_url, caption, like_count, save_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.id, item.type, item.ownerId, item.ownerType, item.ownerName, item.ownerAvatar,
          item.dishId, item.dishTitle, item.dishPrice, item.restaurantName,
          item.mediaUrl, item.posterUrl, item.caption, item.likes, item.saves
        ]);
      });
      console.log('[DATABASE] Seeded demo content records into SQLite database.');
    }
  });
});

// Helper Async Promise Wrappers
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};
