// Comprehensive Mock Data for ScrollNom

export const MOCK_STORIES = [
  {
    id: 's1',
    creatorName: 'Chef Ranveer',
    creatorAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
    hasUnseen: true,
    dishName: 'Hyderabadi Dum Biryani',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    isRestaurant: true,
    restaurantName: 'Paradise Biryani'
  },
  {
    id: 's2',
    creatorName: 'NomNom Pooja',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    hasUnseen: true,
    dishName: 'Truffle Mushroom Burger',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isRestaurant: false
  },
  {
    id: 's3',
    creatorName: 'Taco Haven',
    creatorAvatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
    hasUnseen: false,
    dishName: 'Smoked Birria Tacos',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
    isRestaurant: true,
    restaurantName: 'Taco Haven'
  },
  {
    id: 's4',
    creatorName: 'Bake & Flake',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    hasUnseen: true,
    dishName: 'Matcha Croissant',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    isRestaurant: true,
    restaurantName: 'Bake & Flake'
  },
  {
    id: 's5',
    creatorName: 'K-Food Daily',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    hasUnseen: false,
    dishName: 'Cheesy Ramen Bowl',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
    isRestaurant: false
  }
];

export const MOCK_OFFERS = [
  {
    id: 'o1',
    code: 'NOMMY50',
    title: '50% OFF Nommly Special',
    description: 'Valid on top trending video dishes today',
    bgGradient: 'from-orange-500 to-red-600',
    tag: 'LIMITED TIME'
  },
  {
    id: 'o2',
    code: 'FRIENDPAY',
    title: 'Split & Save ₹100',
    description: 'Get extra discount on Food on Friend orders',
    bgGradient: 'from-emerald-600 to-teal-800',
    tag: 'FOOD ON FRIEND'
  },
  {
    id: 'o3',
    code: 'CREATORPICK',
    title: 'Free Delivery',
    description: 'On all Creator Recommended spots',
    bgGradient: 'from-amber-500 to-orange-600',
    tag: 'CREATOR COLLAB'
  }
];

export const MOCK_NOMMLY_VIDEOS = [
  {
    id: 'nom1',
    dishId: 'd1',
    title: 'Authentic Bengaluru Donne Mutton Biryani 🍲',
    creatorName: 'Chef Ranveer Brar',
    creatorHandle: '@chef_ranveer',
    creatorAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
    isVerifiedCreator: true,
    restaurantId: 'r1',
    restaurantName: 'Shivaji Military Hotel - Indiranagar',
    restaurantDistance: '2.4 km',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-a-dish-in-a-pan-41225-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    dishPrice: 380,
    rating: 4.9,
    reviewsCount: '2.4k',
    likesCount: '48.2k',
    commentsCount: '1,280',
    sharesCount: '8.4k',
    isLiked: false,
    isSaved: false,
    category: 'main_food',
    subcategory: 'Biryani',
    diet: 'non_vegetarian',
    tags: ['BestSeller', 'Bengaluru', 'Donne Biryani', 'Spicy'],
    halalCertified: true,
    spiceLevel: 3,
    description: 'Aromatic Seeraga Samba rice cooked in banana leaf cup (Donne) with tender marination and authentic Karnataka spices.',
    addons: [
      { name: 'Extra Mutton Gravy', price: 40 },
      { name: 'Kebab Piece (2 pcs)', price: 120 },
      { name: 'Gulab Jamun', price: 50 }
    ]
  },
  {
    id: 'nom2',
    dishId: 'd2',
    title: 'Ultimate Smashed Truffle Double Cheeseburger 🍔🔥',
    creatorName: 'NomNom Pooja',
    creatorHandle: '@pooja_bites',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerifiedCreator: true,
    restaurantId: 'r2',
    restaurantName: 'The Smashed Patty Co. - Koramangala',
    restaurantDistance: '1.8 km',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-preparing-a-hamburger-with-french-fries-41227-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    dishPrice: 320,
    rating: 4.8,
    reviewsCount: '1.9k',
    likesCount: '62.1k',
    commentsCount: '890',
    sharesCount: '12.1k',
    isLiked: true,
    isSaved: true,
    category: 'main_food',
    subcategory: 'Burgers',
    diet: 'non_vegetarian',
    tags: ['Gourmet', 'Comfort Food', 'Top Rated'],
    halalCertified: false,
    spiceLevel: 1,
    description: 'Dual smashed Angus beef patties, aged cheddar, caramelised onions, and house-truffle aioli on toasted brioche.',
    addons: [
      { name: 'Loaded Animal Fries', price: 90 },
      { name: 'Thick Chocolate Milkshake', price: 110 }
    ]
  },
  {
    id: 'nom3',
    dishId: 'd3',
    title: 'Artisanal Creamy Hazelnut Cold Coffee ☕🧊',
    creatorName: 'Bengaluru Brewmaster',
    creatorHandle: '@bengaluru_coffee',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVerifiedCreator: true,
    restaurantId: 'r3',
    restaurantName: 'Third Wave Coffee - Indiranagar',
    restaurantDistance: '1.2 km',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-pouring-into-a-glass-with-ice-41226-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
    dishPrice: 220,
    rating: 4.9,
    reviewsCount: '3.4k',
    likesCount: '75.2k',
    commentsCount: '1.5k',
    sharesCount: '14.2k',
    isLiked: true,
    isSaved: true,
    category: 'beverages',
    subcategory: 'Coffee',
    diet: 'vegetarian',
    tags: ['Beverage', 'Cold Coffee', 'Third Wave', 'Indiranagar'],
    halalCertified: true,
    spiceLevel: 0,
    description: 'Freshly pulled double espresso shot blended with chilled whole milk, roasted hazelnut syrup, and a scoop of vanilla gelato.',
    addons: [
      { name: 'Extra Espresso Shot', price: 40 },
      { name: 'Oat Milk Upgrade', price: 50 },
      { name: 'Choco Chip Muffin', price: 90 }
    ]
  },
  {
    id: 'nom4',
    dishId: 'd4',
    title: 'Ghee Roast Crispy Benne Dosa with Coconut Chutney 🥞✨',
    creatorName: 'South Indian Foodie',
    creatorHandle: '@tiffin_tales',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isVerifiedCreator: true,
    restaurantId: 'r4',
    restaurantName: 'CTR Benne Dosa - Malleshwaram',
    restaurantDistance: '3.5 km',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-delicious-taco-41229-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
    dishPrice: 140,
    rating: 4.95,
    reviewsCount: '5.8k',
    likesCount: '92.4k',
    commentsCount: '3.1k',
    sharesCount: '25.6k',
    isLiked: false,
    isSaved: true,
    category: 'breakfast',
    subcategory: 'Dosa',
    diet: 'vegetarian',
    tags: ['Breakfast', 'Benne Dosa', 'Bengaluru Classic', 'Pure Veg'],
    halalCertified: true,
    spiceLevel: 1,
    description: 'Golden crunchy butter dosa slathered with pure white butter, stuffed with spiced potato masala, served with spicy red & coconut chutney.',
    addons: [
      { name: 'Extra Benne / Butter', price: 30 },
      { name: 'Filter Coffee', price: 45 },
      { name: 'Crispy Vada (1 pc)', price: 35 }
    ]
  },
  {
    id: 'nom5',
    dishId: 'd5',
    title: 'Fresh Alphonso Mango Lassi & Berry Smoothie Bowl 🥭🥤',
    creatorName: 'Smoothie Queen',
    creatorHandle: '@refresh_smoothies',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isVerifiedCreator: true,
    restaurantId: 'r5',
    restaurantName: 'Juice Junction - HSR Layout',
    restaurantDistance: '2.1 km',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-pouring-a-fresh-juice-glass-41230-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80',
    dishPrice: 180,
    rating: 4.85,
    reviewsCount: '1.5k',
    likesCount: '41.8k',
    commentsCount: '620',
    sharesCount: '7.8k',
    isLiked: false,
    isSaved: false,
    category: 'beverages',
    subcategory: 'Juices & Smoothies',
    diet: 'vegetarian',
    tags: ['Beverage', 'Healthy', 'Fresh Juice', 'Smoothie'],
    halalCertified: true,
    spiceLevel: 0,
    description: 'Thick, creamy Alphonso mango pulp churned with hung curd, topped with toasted chia seeds, crushed almonds, and fresh mint.',
    addons: [
      { name: 'Protein Scoop', price: 60 },
      { name: 'Honey Glaze', price: 20 }
    ]
  }
];

export const MOCK_RESTAURANTS = [
  {
    id: 'r1',
    name: 'Paradise Biryani Palace',
    cuisine: 'Hyderabadi • Indian • Mughlai',
    rating: 4.9,
    deliveryTime: '25-30 min',
    distance: '2.4 km',
    priceForTwo: '₹600',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    badge: 'Trending #1',
    isVerified: true,
    location: 'Indiranagar, Bengaluru'
  },
  {
    id: 'r2',
    name: 'The Smashed Patty Co.',
    cuisine: 'American Burgers • Shakes • Fries',
    rating: 4.8,
    deliveryTime: '20-25 min',
    distance: '1.8 km',
    priceForTwo: '₹500',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    badge: 'Creator Collab Spot',
    isVerified: true,
    location: 'Koramangala, Bengaluru'
  },
  {
    id: 'r3',
    name: 'Taco Haven',
    cuisine: 'Mexican • Street Tacos • Churros',
    rating: 4.9,
    deliveryTime: '30-35 min',
    distance: '3.1 km',
    priceForTwo: '₹550',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
    badge: 'Must Try Nommly Dish',
    isVerified: true,
    location: 'HSR Layout, Bengaluru'
  },
  {
    id: 'r4',
    name: 'Oishii Ramen Bar',
    cuisine: 'Japanese • Asian Noodle Bowls • Gyoza',
    rating: 4.7,
    deliveryTime: '35-40 min',
    distance: '4.0 km',
    priceForTwo: '₹800',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&auto=format&fit=crop&q=80',
    badge: 'Chef Special',
    isVerified: true,
    location: 'Indiranagar 100ft Rd, Bengaluru'
  }
];

export const MOCK_CREATORS = [
  {
    id: 'c1',
    name: 'Chef Ranveer Brar',
    handle: '@chef_ranveer',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
    followers: '1.2M',
    totalReels: 142,
    collaborations: ['Paradise Biryani', 'Kebabs & More'],
    bio: 'Masterchef India judge. Food historian. Crafting regional delicacies with love ❤️'
  },
  {
    id: 'c2',
    name: 'NomNom Pooja',
    handle: '@pooja_bites',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    followers: '450K',
    totalReels: 89,
    collaborations: ['The Smashed Patty Co.', 'Bake & Flake'],
    bio: 'Finding the crunchiest burgers & ooziest desserts in town 🍔✨'
  }
];

export const INITIAL_USER = {
  id: '',
  firebaseUid: '',
  name: 'Guest Foodie',
  phone: '',
  email: '',
  username: '',
  handle: '',
  avatarUrl: '',
  bio: '',
  isLoggedIn: false,
  isCreator: false,
  creatorHandle: '',
  followers: '0',
  earningsThisMonth: '₹0',
  collaborationsCount: 0,
  address: {
    label: 'Home',
    street: '100 Feet Road',
    area: 'Indiranagar, Bengaluru',
    pincode: '560038'
  }
};
