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
        restaurant_id TEXT,
        dish_id TEXT,
        dish_title TEXT,
        dish_price REAL,
        restaurant_name TEXT,
        media_url TEXT NOT NULL,
        poster_url TEXT,
        caption TEXT,
        tagged_dishes_json TEXT,
        food_categories_json TEXT,
        time_belts_json TEXT,
        analysis_status TEXT DEFAULT 'confirmed',
        like_count INTEGER DEFAULT 0,
        save_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure content table columns exist if created in previous migrations
    db.run(`ALTER TABLE content ADD COLUMN restaurant_id TEXT;`, () => {});
    db.run(`ALTER TABLE content ADD COLUMN tagged_dishes_json TEXT;`, () => {});
    db.run(`ALTER TABLE content ADD COLUMN food_categories_json TEXT;`, () => {});
    db.run(`ALTER TABLE content ADD COLUMN time_belts_json TEXT;`, () => {});
    db.run(`ALTER TABLE content ADD COLUMN analysis_status TEXT DEFAULT 'confirmed';`, () => {});

    // Restaurants Table (Canonical Source)
    db.run(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cuisine TEXT,
        rating REAL DEFAULT 4.5,
        delivery_time TEXT DEFAULT '25-30 min',
        distance TEXT DEFAULT '2.0 km',
        address TEXT,
        latitude REAL,
        longitude REAL,
        is_open INTEGER DEFAULT 1,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Restaurant Menu Items Table (Canonical Source of Dishes, Prices & Offers)
    db.run(`
      CREATE TABLE IF NOT EXISTS restaurant_menu_items (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        diet_type TEXT NOT NULL,
        price REAL NOT NULL,
        is_available INTEGER DEFAULT 1,
        image_url TEXT,
        active_offer_id TEXT,
        discount_percent REAL DEFAULT 0,
        promo_code TEXT,
        opening_availability TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      );
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_menu_restaurant ON restaurant_menu_items(restaurant_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_menu_category ON restaurant_menu_items(category);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_menu_diet ON restaurant_menu_items(diet_type);`);

    // Orders Table (Razorpay checkout & order history)
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        items_json TEXT NOT NULL,
        restaurant_name TEXT,
        subtotal REAL DEFAULT 0,
        delivery_fee REAL DEFAULT 0,
        taxes REAL DEFAULT 0,
        amount REAL NOT NULL,
        amount_paise INTEGER,
        currency TEXT DEFAULT 'INR',
        status TEXT DEFAULT 'created',
        payment_status TEXT DEFAULT 'pending',
        razorpay_order_id TEXT,
        razorpay_payment_id TEXT,
        food_on_friend_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Content engagement & analytics tables
    db.run(`
      CREATE TABLE IF NOT EXISTS content_likes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, content_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(content_id) REFERENCES content(id) ON DELETE CASCADE
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS content_saves (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content_id TEXT NOT NULL,
        dish_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, content_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(content_id) REFERENCES content(id) ON DELETE CASCADE
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS content_views (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(content_id) REFERENCES content(id) ON DELETE CASCADE
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS order_intents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content_id TEXT,
        dish_id TEXT,
        restaurant_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    // Delivery engine tables
    db.run(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        provider TEXT DEFAULT 'scrollnom',
        status TEXT DEFAULT 'restaurant_received',
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE
      );
    `);

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

    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);`);

    // Seed Phase 14 Creators directly
    db.run(`
      INSERT OR IGNORE INTO users (id, firebase_uid, email, username, display_name, avatar_url, bio, is_creator)
      VALUES ('u_go_cool_bengaluru', 'fb_go_cool_bengaluru', 'gocool@scrollnom.com', 'go_cool_bengaluru', 'Go Cool Bengaluru', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Exploring Bengaluru best food spots & hidden gems! 🍲☕', 1)
    `);
    db.run(`
      INSERT OR IGNORE INTO users (id, firebase_uid, email, username, display_name, avatar_url, bio, is_creator)
      VALUES ('u_azamjasba', 'fb_azamjasba', 'azamjasba@scrollnom.com', 'azamjasba', 'Azam Jasba', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Food vlogger & street food connoisseur 🌯🔥', 1)
    `);


    // Seed Canonical Restaurants (must complete before menu items due to FK)
    const canonicalRest = [
      {
        id: 'r1',
        name: 'Paradise Biryani Palace',
        cuisine: 'Hyderabadi • Indian • Mughlai',
        rating: 4.9,
        deliveryTime: '25-30 min',
        distance: '2.4 km',
        address: 'Indiranagar 100ft Rd, Bengaluru',
        lat: 12.9716,
        lng: 77.6412,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'r2',
        name: 'The Smashed Patty Co. - Koramangala',
        cuisine: 'American Burgers • Shakes • Fries',
        rating: 4.8,
        deliveryTime: '20-25 min',
        distance: '1.8 km',
        address: '5th Block, Koramangala, Bengaluru',
        lat: 12.9352,
        lng: 77.6245,
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'r3',
        name: 'CTR Benne Dosa - Malleshwaram',
        cuisine: 'South Indian • Dosa • Tiffin',
        rating: 4.95,
        deliveryTime: '15-20 min',
        distance: '3.5 km',
        address: '7th Cross Rd, Malleshwaram, Bengaluru',
        lat: 13.0031,
        lng: 77.5684,
        image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80'
      },
      {
        id: 'r4',
        name: 'Third Wave Coffee - Indiranagar',
        cuisine: 'Coffee • Desserts • Bakery',
        rating: 4.9,
        deliveryTime: '15-20 min',
        distance: '1.2 km',
        address: '12th Main Rd, Indiranagar, Bengaluru',
        lat: 12.9698,
        lng: 77.6445,
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80'
      }
    ];

    canonicalRest.forEach(r => {
      db.run(`
        INSERT OR IGNORE INTO restaurants (id, name, cuisine, rating, delivery_time, distance, address, latitude, longitude, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [r.id, r.name, r.cuisine, r.rating, r.deliveryTime, r.distance, r.address, r.lat, r.lng, r.image]);
    });
    console.log('[DATABASE] Seeded canonical restaurants');

    // Seed Canonical Restaurant Menu Items
    const canonicalMenu = [
      // Restaurant r1 - Paradise Biryani Palace
      { id: 'd1_1', restaurant_id: 'r1', name: 'Hyderabadi Dum Biryani', description: 'Charcoal slow cooked chicken dum biryani with mirchi ka salan', category: 'MAIN_FOOD', diet_type: 'NON_VEG', price: 380, active_offer_id: 'o1', discount_percent: 50, promo_code: 'SCROLL50', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80' },
      { id: 'd1_2', restaurant_id: 'r1', name: 'Special Mutton Biryani', description: 'Tender mutton cooked in seeraga samba rice with special spices', category: 'MAIN_FOOD', diet_type: 'NON_VEG', price: 450, active_offer_id: 'o1', discount_percent: 50, promo_code: 'SCROLL50', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80' },
      { id: 'd1_3', restaurant_id: 'r1', name: 'Royal Paneer Biryani', description: 'Fragrant basmati rice cooked with fresh cottage cheese and saffron', category: 'MAIN_FOOD', diet_type: 'VEG', price: 290, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80' },
      { id: 'd1_4', restaurant_id: 'r1', name: 'Chicken 65', description: 'Crispy fried spicy chicken morsels garnished with curry leaves', category: 'SNACK', diet_type: 'NON_VEG', price: 260, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80' },
      { id: 'd1_5', restaurant_id: 'r1', name: 'Chilled Cold Coffee', description: 'Rich blended cold coffee topped with cocoa powder', category: 'BEVERAGE', diet_type: 'VEG', price: 150, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80' },
      { id: 'd1_6', restaurant_id: 'r1', name: 'Butter Garlic Naan', description: 'Fresh clay oven naan brushed with salted garlic butter', category: 'MAIN_FOOD', diet_type: 'VEG', price: 60, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80' },

      // Restaurant r2 - The Smashed Patty Co.
      { id: 'd2_1', restaurant_id: 'r2', name: 'Ultimate Smashed Truffle Cheeseburger', description: 'Double smashed beef patties with truffle aioli & cheddar', category: 'MAIN_FOOD', diet_type: 'NON_VEG', price: 320, active_offer_id: 'o4', discount_percent: 20, promo_code: 'BURGER20', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80' },
      { id: 'd2_2', restaurant_id: 'r2', name: 'Veggie Crunch Smash Burger', description: 'Crispy plant patty with avocado spread and vegan mayo', category: 'MAIN_FOOD', diet_type: 'VEG', price: 240, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80' },
      { id: 'd2_3', restaurant_id: 'r2', name: 'Loaded Animal Fries', description: 'Crispy fries topped with melted cheese, grilled onions and sauce', category: 'SNACK', diet_type: 'VEG', price: 180, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&auto=format&fit=crop&q=80' },
      { id: 'd2_4', restaurant_id: 'r2', name: 'Thick Chocolate Milkshake', description: 'Rich Belgian chocolate ice cream shake', category: 'BEVERAGE', diet_type: 'VEG', price: 160, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80' },

      // Restaurant r3 - CTR Benne Dosa
      { id: 'd3_1', restaurant_id: 'r3', name: 'Ghee Roast Benne Dosa', description: 'Crispy butter dosa served with fresh coconut chutney & red chutney', category: 'BREAKFAST', diet_type: 'VEG', price: 140, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80' },
      { id: 'd3_2', restaurant_id: 'r3', name: 'Idli Vada Combo', description: 'Steamed rice cakes and crispy lentil vada with sambar', category: 'BREAKFAST', diet_type: 'VEG', price: 90, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80' },
      { id: 'd3_3', restaurant_id: 'r3', name: 'Authentic Filter Coffee', description: 'Traditional South Indian chicory filter coffee', category: 'BEVERAGE', diet_type: 'VEG', price: 45, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80' },

      // Restaurant r4 - Third Wave Coffee
      { id: 'd4_1', restaurant_id: 'r4', name: 'Artisanal Creamy Hazelnut Cold Coffee', description: 'Double espresso blended with chilled milk and hazelnut syrup', category: 'BEVERAGE', diet_type: 'VEG', price: 220, active_offer_id: 'o5', discount_percent: 15, promo_code: 'COFFEE15', image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80' },
      { id: 'd4_2', restaurant_id: 'r4', name: 'Double Espresso Shot', description: 'Pure 100% Arabica dark roast espresso', category: 'BEVERAGE', diet_type: 'VEG', price: 140, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80' },
      { id: 'd4_3', restaurant_id: 'r4', name: 'Choco Chip Muffin', description: 'Freshly baked dark chocolate muffin', category: 'DESSERT', diet_type: 'VEG', price: 120, active_offer_id: null, discount_percent: 0, promo_code: null, image_url: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&auto=format&fit=crop&q=80' }
    ];

    canonicalMenu.forEach(item => {
      db.run(`
        INSERT OR REPLACE INTO restaurant_menu_items (id, restaurant_id, name, description, category, diet_type, price, active_offer_id, discount_percent, promo_code, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id, item.restaurant_id, item.name, item.description, item.category,
        item.diet_type, item.price, item.active_offer_id, item.discount_percent,
        item.promo_code, item.image_url
      ]);
    });


    // Seed 10 Real Videos from Go_cool_Bengaluru folder
    const gocoolVideos = [
      {
        id: 'c_gocool_1',
        mediaUrl: '/Go_cool_Bengaluru/Breakfast.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
        caption: 'Morning crisp Benne Dosa & piping hot Filter Coffee at CTR 🥞☕ #BengaluruBreakfast #BenneDosa',
        restaurantId: 'r3',
        restaurantName: 'CTR Benne Dosa - Malleshwaram',
        taggedDishes: [
          { dishId: 'd3_1', name: 'Ghee Roast Benne Dosa', dietType: 'VEG', category: 'BREAKFAST', price: 140, confidence: 0.98 },
          { dishId: 'd3_3', name: 'Authentic Filter Coffee', dietType: 'VEG', category: 'BEVERAGE', price: 45, confidence: 0.96 }
        ],
        categories: ['BREAKFAST', 'BEVERAGE'],
        timeBelts: ['MORNING']
      },
      {
        id: 'c_gocool_2',
        mediaUrl: '/Go_cool_Bengaluru/Breakfast1.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
        caption: 'Softest Idli Vada Combo dipped in hot sambar with South Indian filter coffee 🌟 #SouthIndianFood',
        restaurantId: 'r3',
        restaurantName: 'CTR Benne Dosa - Malleshwaram',
        taggedDishes: [
          { dishId: 'd3_2', name: 'Idli Vada Combo', dietType: 'VEG', category: 'BREAKFAST', price: 90, confidence: 0.95 },
          { dishId: 'd3_3', name: 'Authentic Filter Coffee', dietType: 'VEG', category: 'BEVERAGE', price: 45, confidence: 0.96 }
        ],
        categories: ['BREAKFAST', 'BEVERAGE'],
        timeBelts: ['MORNING', 'MORNING_AFTERNOON_MIX']
      },
      {
        id: 'c_gocool_3',
        mediaUrl: '/Go_cool_Bengaluru/Lunch.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        caption: 'Royal Hyderabadi Dum Biryani & spicy Chicken 65 lunch spread! 50% OFF active 🔥 #BiryaniLover',
        restaurantId: 'r1',
        restaurantName: 'Paradise Biryani Palace',
        taggedDishes: [
          { dishId: 'd1_1', name: 'Hyderabadi Dum Biryani', dietType: 'NON_VEG', category: 'MAIN_FOOD', price: 380, discountPercent: 50, promoCode: 'SCROLL50', confidence: 0.99 },
          { dishId: 'd1_4', name: 'Chicken 65', dietType: 'NON_VEG', category: 'SNACK', price: 260, confidence: 0.94 }
        ],
        categories: ['MAIN_FOOD', 'SNACK'],
        timeBelts: ['AFTERNOON', 'EVENING']
      },
      {
        id: 'c_gocool_4',
        mediaUrl: '/Go_cool_Bengaluru/Lunch1.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        caption: 'Special Mutton Biryani paired with Chilled Cold Coffee for the perfect afternoon feast 🍖🥤',
        restaurantId: 'r1',
        restaurantName: 'Paradise Biryani Palace',
        taggedDishes: [
          { dishId: 'd1_2', name: 'Special Mutton Biryani', dietType: 'NON_VEG', category: 'MAIN_FOOD', price: 450, discountPercent: 50, promoCode: 'SCROLL50', confidence: 0.97 },
          { dishId: 'd1_5', name: 'Chilled Cold Coffee', dietType: 'VEG', category: 'BEVERAGE', price: 150, confidence: 0.92 }
        ],
        categories: ['MAIN_FOOD', 'BEVERAGE'],
        timeBelts: ['AFTERNOON']
      },
      {
        id: 'c_gocool_5',
        mediaUrl: '/Go_cool_Bengaluru/Lunch2.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
        caption: 'Rich Royal Paneer Biryani with hot Butter Garlic Naan! Pure Veg happiness 🧀✨',
        restaurantId: 'r1',
        restaurantName: 'Paradise Biryani Palace',
        taggedDishes: [
          { dishId: 'd1_3', name: 'Royal Paneer Biryani', dietType: 'VEG', category: 'MAIN_FOOD', price: 290, confidence: 0.96 },
          { dishId: 'd1_6', name: 'Butter Garlic Naan', dietType: 'VEG', category: 'MAIN_FOOD', price: 60, confidence: 0.93 }
        ],
        categories: ['MAIN_FOOD'],
        timeBelts: ['AFTERNOON', 'AFTERNOON_EVENING_MIX']
      },
      {
        id: 'c_gocool_6',
        mediaUrl: '/Go_cool_Bengaluru/Evening.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
        caption: 'Smashed Truffle Cheeseburger & double fried Loaded Animal Fries in Koramangala 🍔🍟',
        restaurantId: 'r2',
        restaurantName: 'The Smashed Patty Co. - Koramangala',
        taggedDishes: [
          { dishId: 'd2_1', name: 'Ultimate Smashed Truffle Cheeseburger', dietType: 'NON_VEG', category: 'MAIN_FOOD', price: 320, discountPercent: 20, promoCode: 'BURGER20', confidence: 0.98 },
          { dishId: 'd2_3', name: 'Loaded Animal Fries', dietType: 'VEG', category: 'SNACK', price: 180, confidence: 0.95 }
        ],
        categories: ['MAIN_FOOD', 'SNACK'],
        timeBelts: ['AFTERNOON_EVENING_MIX', 'EVENING']
      },
      {
        id: 'c_gocool_7',
        mediaUrl: '/Go_cool_Bengaluru/Evening1.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
        caption: 'Artisanal Creamy Hazelnut Cold Coffee & fresh Choco Chip Muffin break ☕🧁 #CoffeeTime',
        restaurantId: 'r4',
        restaurantName: 'Third Wave Coffee - Indiranagar',
        taggedDishes: [
          { dishId: 'd4_1', name: 'Artisanal Creamy Hazelnut Cold Coffee', dietType: 'VEG', category: 'BEVERAGE', price: 220, discountPercent: 15, promoCode: 'COFFEE15', confidence: 0.99 },
          { dishId: 'd4_3', name: 'Choco Chip Muffin', dietType: 'VEG', category: 'DESSERT', price: 120, confidence: 0.91 }
        ],
        categories: ['BEVERAGE', 'DESSERT'],
        timeBelts: ['EVENING']
      },
      {
        id: 'c_gocool_8',
        mediaUrl: '/Go_cool_Bengaluru/Evening2.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
        caption: 'Veggie Crunch Smash Burger with thick Belgian Chocolate Shake for evening snack 🥤🍔',
        restaurantId: 'r2',
        restaurantName: 'The Smashed Patty Co. - Koramangala',
        taggedDishes: [
          { dishId: 'd2_2', name: 'Veggie Crunch Smash Burger', dietType: 'VEG', category: 'MAIN_FOOD', price: 240, confidence: 0.94 },
          { dishId: 'd2_4', name: 'Thick Chocolate Milkshake', dietType: 'VEG', category: 'BEVERAGE', price: 160, confidence: 0.97 }
        ],
        categories: ['MAIN_FOOD', 'BEVERAGE'],
        timeBelts: ['EVENING']
      },
      {
        id: 'c_gocool_9',
        mediaUrl: '/Go_cool_Bengaluru/OverNight.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        caption: 'Late night 2 AM Mutton Biryani cravings satisfied! Open all night in Indiranagar 🌙🍖',
        restaurantId: 'r1',
        restaurantName: 'Paradise Biryani Palace',
        taggedDishes: [
          { dishId: 'd1_2', name: 'Special Mutton Biryani', dietType: 'NON_VEG', category: 'MAIN_FOOD', price: 450, discountPercent: 50, promoCode: 'SCROLL50', confidence: 0.99 },
          { dishId: 'd1_5', name: 'Chilled Cold Coffee', dietType: 'VEG', category: 'BEVERAGE', price: 150, confidence: 0.93 }
        ],
        categories: ['MAIN_FOOD', 'BEVERAGE'],
        timeBelts: ['OVERNIGHT']
      },
      {
        id: 'c_gocool_10',
        mediaUrl: '/Go_cool_Bengaluru/Overnight1.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        caption: 'Midnight Hyderabadi Dum Biryani slow cooked dum 🔥 #LateNightEats #ScrollNom',
        restaurantId: 'r1',
        restaurantName: 'Paradise Biryani Palace',
        taggedDishes: [
          { dishId: 'd1_1', name: 'Hyderabadi Dum Biryani', dietType: 'NON_VEG', category: 'MAIN_FOOD', price: 380, discountPercent: 50, promoCode: 'SCROLL50', confidence: 0.98 }
        ],
        categories: ['MAIN_FOOD'],
        timeBelts: ['OVERNIGHT']
      }
    ];

    gocoolVideos.forEach(v => {
      const firstDish = v.taggedDishes[0];
      db.run(`
        INSERT OR REPLACE INTO content (
          id, content_type, owner_id, owner_type, owner_name, owner_avatar,
          restaurant_id, dish_id, dish_title, dish_price, restaurant_name,
          media_url, poster_url, caption, tagged_dishes_json, food_categories_json,
          time_belts_json, analysis_status
        ) VALUES (?, 'nommly', 'u_go_cool_bengaluru', 'creator', 'Go Cool Bengaluru',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
      `, [
        v.id, v.restaurantId, firstDish.dishId, firstDish.name, firstDish.price,
        v.restaurantName, v.mediaUrl, v.posterUrl, v.caption,
        JSON.stringify(v.taggedDishes), JSON.stringify(v.categories), JSON.stringify(v.timeBelts)
      ]);
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

