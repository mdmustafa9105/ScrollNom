import { dbGet, dbAll } from '../db/database.js';
import { getTimeBelt } from './timeBeltService.js';

// Calculate Haversine Distance in Kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.4; // Default fallback distance
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Evaluate Restaurant Open / Closed Status based on hour
function evaluateRestaurantStatus(hour) {
  // Demo opening hours: 07:00 AM to 11:30 PM (23:30)
  if (hour >= 7 && hour < 23) {
    return { status: 'OPEN', label: 'Open now' };
  } else if (hour >= 6 && hour < 7) {
    return { status: 'OPENING_SOON', label: 'Opens at 7:00 AM' };
  } else {
    return { status: 'CLOSED', label: 'Available from 7:00 AM' };
  }
}

export const getContextualNommlyFeed = async ({
  hour = new Date().getHours(),
  minute = new Date().getMinutes(),
  isBrokenBelt = false,
  userLat = 12.9785, // Default Indiranagar, Bengaluru
  userLng = 77.6402,
  userUid = null
}) => {
  const currentBelt = getTimeBelt(hour, minute);

  // 1. Fetch authenticated user profile and followed creators/restaurants
  let currentUserId = null;
  const followedSet = new Set();
  const savedSet = new Set();

  if (userUid) {
    const u = await dbGet('SELECT id FROM users WHERE firebase_uid = ? OR id = ?', [userUid, userUid]);
    if (u) {
      currentUserId = u.id;
      const follows = await dbAll('SELECT following_user_id FROM follows WHERE follower_user_id = ?', [currentUserId]);
      follows.forEach(f => followedSet.add(f.following_user_id));

      const saves = await dbAll('SELECT content_id FROM content_saves WHERE user_id = ?', [currentUserId]);
      saves.forEach(s => savedSet.add(s.content_id));
    }
  }

  // 2. Fetch all public Nommly content from database
  let contentRows = await dbAll(`
    SELECT c.*, u.username as owner_username, u.is_creator
    FROM content c
    LEFT JOIN users u ON c.owner_id = u.id
    ORDER BY c.created_at DESC
  `);

  // Fallback demo content if database table has few items
  if (!contentRows || contentRows.length === 0) {
    contentRows = [
      {
        id: 'nom1',
        owner_id: 'u_seed_demo',
        owner_name: 'Chef Ranveer Brar',
        owner_username: 'chef_ranveer',
        dish_id: 'd1',
        dish_title: 'Authentic Bengaluru Donne Mutton Biryani 🍲',
        dish_price: 380,
        restaurant_name: 'Shivaji Military Hotel - Indiranagar',
        category: 'main_food',
        media_url: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-a-dish-in-a-pan-41225-large.mp4',
        poster_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        caption: 'Donne Biryani in banana leaf cup! Spiced to perfection #Bengaluru #Foodie',
        like_count: 48,
        save_count: 18
      },
      {
        id: 'nom3',
        owner_id: 'u_seed_demo',
        owner_name: 'Bengaluru Brewmaster',
        owner_username: 'bengaluru_coffee',
        dish_id: 'd3',
        dish_title: 'Artisanal Creamy Hazelnut Cold Coffee ☕🧊',
        dish_price: 220,
        restaurant_name: 'Third Wave Coffee - Indiranagar',
        category: 'beverages',
        media_url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-pouring-into-a-glass-with-ice-41226-large.mp4',
        poster_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
        caption: 'Freshly pulled double espresso with cold milk & hazelnut #ThirdWave #Coffee',
        like_count: 75,
        save_count: 29
      },
      {
        id: 'nom4',
        owner_id: 'u_seed_demo',
        owner_name: 'South Indian Foodie',
        owner_username: 'tiffin_tales',
        dish_id: 'd4',
        dish_title: 'Ghee Roast Crispy Benne Dosa with Coconut Chutney 🥞✨',
        dish_price: 140,
        restaurant_name: 'CTR Benne Dosa - Malleshwaram',
        category: 'breakfast',
        media_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-delicious-taco-41229-large.mp4',
        poster_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
        caption: 'Crispy butter dosa with white butter & red chutney #BengaluruClassic #Breakfast',
        like_count: 92,
        save_count: 45
      }
    ];
  }

  // 3. Deterministic Scorer & Ranking Engine
  const restEval = evaluateRestaurantStatus(hour);

  const rankedItems = contentRows.map((item) => {
    let score = 100;
    const signals = [];

    // Category matching logic
    const itemCat = item.category || (item.dish_title?.toLowerCase().includes('coffee') ? 'beverages' : 'main_food');

    // Time Belt Preference matching
    const isTimeMatch = currentBelt.prefer.includes(itemCat);
    if (isTimeMatch && !isBrokenBelt) {
      score += 50;
      signals.push({ type: 'TIME_MATCH', label: `${currentBelt.label} Favorite` });
    }

    if (isBrokenBelt) {
      signals.push({ type: 'BROKEN_BELT', label: '⚡ Broken Belt Active' });
    }

    // Open status matching
    if (restEval.status === 'OPEN') {
      score += 40;
      signals.push({ type: 'OPEN_NOW', label: '🟢 Open Now' });
    } else {
      score -= 20;
    }

    // Distance calculation
    const distance = calculateDistance(userLat, userLng, 12.9785, 77.6402);
    if (distance <= 3.0) {
      score += 30;
      signals.push({ type: 'NEARBY', label: `📍 Nearby • ${distance} km` });
    }

    // Followed Creator
    if (followedSet.has(item.owner_id)) {
      score += 25;
      signals.push({ type: 'FOLLOWED_CREATOR', label: '⭐ Followed Creator' });
    }

    // Saved Dish
    if (savedSet.has(item.id)) {
      score += 20;
      signals.push({ type: 'SAVED_DISH', label: '🔖 Saved Dish' });
    }

    return {
      contentId: item.id,
      ownerId: item.owner_id,
      ownerName: item.owner_name || 'ScrollNom Creator',
      ownerHandle: item.owner_username ? `@${item.owner_username}` : '@creator',
      dishId: item.dish_id || 'd1',
      dishTitle: item.dish_title || item.title || 'ScrollNom Dish',
      dishPrice: item.dish_price || item.price || 280,
      restaurantName: item.restaurant_name || 'ScrollNom Partner - Bengaluru',
      category: itemCat,
      mediaUrl: item.media_url || item.videoUrl,
      posterUrl: item.poster_url || item.posterUrl,
      caption: item.caption,
      likeCount: item.like_count || 42,
      saveCount: item.save_count || 18,
      distanceKm: distance,
      availability: restEval.status === 'OPEN' ? 'AVAILABLE' : 'UNAVAILABLE',
      availabilityMessage: restEval.label,
      deterministicScore: score,
      explanationSignals: signals
    };
  });

  // Sort descending by deterministic score
  rankedItems.sort((a, b) => b.deterministicScore - a.deterministicScore);

  return {
    timeBelt: currentBelt,
    isBrokenBelt: Boolean(isBrokenBelt),
    location: { area: 'Indiranagar', city: 'Bengaluru', lat: userLat, lng: userLng },
    items: rankedItems
  };
};
