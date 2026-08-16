import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USER, MOCK_NOMMLY_VIDEOS } from '../data/mockData';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  isFirebaseConfigured
} from '../config/firebase';
import { API_BASE } from '../config/api';
import { formatAuthError } from '../utils/authErrors';
import { UsernameOnboardingModal } from '../components/auth/UsernameOnboardingModal';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation & User State — Restore authenticated user from localStorage if present
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('scrollnom_user');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  
  // Nommly Video List state
  const [videos, setVideos] = useState(MOCK_NOMMLY_VIDEOS);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Cart State
  const [cartItems, setCartItems] = useState([
    {
      id: 'cart-1',
      dishId: 'd1',
      title: 'Hyderabadi Dum Biryani',
      price: 380,
      quantity: 1,
      restaurantName: 'Paradise Biryani Palace',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80',
      addons: ['Extra Salan & Raita']
    }
  ]);

  // Food on Friend Split Pay State
  const [foodOnFriend, setFoodOnFriend] = useState({
    enabled: false,
    friendName: 'Rohan',
    userContribution: 190,
    friendContribution: 190,
    status: 'idle'
  });

  // Auth Modal State (Contextual Login)
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    title: 'Sign in to order',
    pendingDish: null
  });

  // Toast Notification State
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isOpen: false }));
    }, 3200);
  };

  // Helper to persist user state cleanly
  const saveUserState = (newUserObj) => {
    setUser(newUserObj);
    try {
      localStorage.setItem('scrollnom_user', JSON.stringify(newUserObj));
    } catch (e) {}
  };

  // Restore pending auth intent from sessionStorage
  const [pendingAuthIntent, setPendingAuthIntent] = useState(() => {
    try {
      const saved = sessionStorage.getItem('scrollnom_pending_intent');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        
        // Sync user profile with backend
        try {
          const token = await fbUser.getIdToken();
          const res = await fetch(`${API_BASE}/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success && json.data.user) {
            const backendUser = json.data.user;
            const updatedUser = {
              id: backendUser.id || fbUser.uid,
              firebaseUid: fbUser.uid,
              name: backendUser.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'ScrollNom Foodie',
              email: fbUser.email || '',
              username: backendUser.username || '',
              handle: backendUser.username ? `@${backendUser.username}` : '',
              avatarUrl: backendUser.avatarUrl || fbUser.photoURL || '',
              bio: backendUser.bio || '',
              isLoggedIn: true,
              isCreator: Boolean(backendUser.isCreator ?? backendUser.is_creator),
              phone: '+91 98765 43210',
              address: { label: 'Home', street: '100 Feet Road', area: 'Indiranagar, Bengaluru', pincode: '560038' }
            };
            saveUserState(updatedUser);

            if (json.data.needsUsername || !backendUser.username) {
              setShowUsernameModal(true);
            }
          }
        } catch (syncErr) {
          console.error('[FIREBASE SYNC ERROR]', syncErr);
        }
      } else {
        setFirebaseUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Get current user's Firebase Bearer token for server calls
  const getAuthToken = async () => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        return token;
      } catch (e) {
        return `fb_token_${firebaseUser.uid}::${encodeURIComponent(firebaseUser.email || 'user')}`;
      }
    }
    if (user.isLoggedIn) {
      return `fb_token_${user.id || user.firebaseUid || 'u1'}::${encodeURIComponent(user.email || 'user@scrollnom.com')}`;
    }
    return null;
  };

  // Notifications & Realtime Messaging State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [selectedUserProfileUsername, setSelectedUserProfileUsername] = useState(null);

  // Initial Notifications & Unread Counts Loader
  const loadNotificationsAndUnreads = async () => {
    if (!user.isLoggedIn) {
      setNotifications([]);
      setUnreadNotifCount(0);
      setUnreadMessageCount(0);
      return;
    }
    try {
      const token = await getAuthToken();
      if (!token) return;

      const [notifRes, notifCountRes, msgCountRes] = await Promise.all([
        fetch(`${API_BASE}/notifications`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/messages/unread-count`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (notifRes.ok) {
        const json = await notifRes.json();
        setNotifications(json.data || []);
      }
      if (notifCountRes.ok) {
        const json = await notifCountRes.json();
        setUnreadNotifCount(json.data?.unreadCount || 0);
      }
      if (msgCountRes.ok) {
        const json = await msgCountRes.json();
        setUnreadMessageCount(json.data?.unreadCount || 0);
      }
    } catch (e) {
      console.error('[LOAD NOTIFICATIONS ERROR]', e);
    }
  };

  useEffect(() => {
    loadNotificationsAndUnreads();
  }, [user.isLoggedIn]);

  // Real-time SSE Connection Listener for authenticated user
  useEffect(() => {
    if (!user.isLoggedIn) return;

    let eventSource = null;
    let isMounted = true;

    const setupSSE = async () => {
      try {
        const token = await getAuthToken();
        if (!token || !isMounted) return;

        const sseUrl = `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
        eventSource = new EventSource(sseUrl);

        eventSource.addEventListener('NOTIFICATION', (e) => {
          try {
            const data = JSON.parse(e.data);
            setNotifications(prev => [data, ...prev]);
            setUnreadNotifCount(prev => prev + 1);
            showToast(`🔔 ${data.title}: ${data.body}`, 'info');
          } catch (err) {}
        });

        eventSource.addEventListener('MESSAGE_RECEIVED', (e) => {
          try {
            const data = JSON.parse(e.data);
            setUnreadMessageCount(prev => prev + 1);
            showToast(`💬 @${data.senderUsername || 'Someone'}: ${data.body}`, 'info');
          } catch (err) {}
        });

        eventSource.onerror = (err) => {
          // Silent reconnect on network glitch
        };
      } catch (e) {}
    };

    setupSSE();

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user.isLoggedIn]);

  const handleMarkNotifRead = async (notificationId) => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (e) {}
  };

  const openUserProfile = (username) => {
    setSelectedUserProfileUsername(username);
  };

  const openChatWithUser = (username) => {
    if (!user.isLoggedIn) {
      promptAuth('Sign in to send messages');
      return;
    }
    setActiveChatUser(username);
    setActiveTab('messages');
  };

  // Fetch real content videos from backend API
  const fetchNommlyVideos = async () => {
    try {
      const token = await getAuthToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/content/nommly`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setVideos(json.data);
        }
      }
    } catch (e) {
      console.error('[FETCH NOMMLY VIDEOS ERROR]', e);
    }
  };

  useEffect(() => {
    fetchNommlyVideos();
  }, [user.isLoggedIn]);


  // Helper to handle pending order/action intent after authentication
  const executePendingOrderIntent = () => {
    const targetDish = authModal.pendingDish || pendingAuthIntent;
    if (targetDish) {
      setCartItems(prev => {
        const dishId = targetDish.dishId || targetDish.id;
        const existing = prev.find(item => item.dishId === dishId);
        if (existing) {
          return prev.map(item =>
            item.dishId === dishId ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [
          ...prev,
          {
            id: `cart-${Date.now()}`,
            dishId: dishId,
            title: targetDish.title || targetDish.dishName,
            price: targetDish.dishPrice || targetDish.price,
            quantity: 1,
            restaurantName: targetDish.restaurantName || 'ScrollNom Partner',
            image: targetDish.posterUrl || targetDish.image,
            addons: targetDish.addons || []
          }
        ];
      });

      showToast(`Welcome! Added ${targetDish.title || targetDish.dishName} to your cart. 🛍️`, 'success');
      setActiveTab('cart');
      sessionStorage.removeItem('scrollnom_pending_intent');
      setPendingAuthIntent(null);
    } else if (activeTab === 'auth') {
      setActiveTab('home');
    }
  };

  // GOOGLE SIGN IN
  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      showToast('Firebase Web Auth credentials not configured in environment (.env.local).', 'error');
      throw new Error('Firebase Authentication is not configured in environment.');
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      setFirebaseUser(fbUser);

      // Sync with backend
      const token = await fbUser.getIdToken();
      const res = await fetch(`${API_BASE}/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();

      const scrollUser = json.data?.user || {};
      const newUserObj = {
        id: scrollUser.id || fbUser.uid,
        firebaseUid: fbUser.uid,
        name: scrollUser.name || fbUser.displayName || 'Google User',
        email: fbUser.email,
        username: scrollUser.username || '',
        handle: scrollUser.username ? `@${scrollUser.username}` : '',
        avatarUrl: scrollUser.avatarUrl || fbUser.photoURL || '',
        bio: scrollUser.bio || '',
        isLoggedIn: true,
        isCreator: Boolean(scrollUser.isCreator),
        phone: '+91 98765 43210',
        address: { label: 'Home', street: '100 Feet Road', area: 'Indiranagar, Bengaluru', pincode: '560038' }
      };
      saveUserState(newUserObj);

      if (json.data?.needsUsername || !scrollUser.username) {
        setShowUsernameModal(true);
      } else {
        showToast(`Welcome back, ${scrollUser.name || fbUser.displayName || 'Foodie'}! 👋`, 'success');
        executePendingOrderIntent();
      }
      return fbUser;
    } catch (err) {
      console.error('[GOOGLE AUTH ERROR]', err);
      const cleanError = formatAuthError(err);
      showToast(cleanError, 'error');
      throw new Error(cleanError);
    }
  };

  // EMAIL LOGIN / SIGNUP
  const loginWithEmail = async (email, password, isRegister = false, displayName = '') => {
    try {
      let fbUser;
      if (isRegister) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        fbUser = res.user;
        if (displayName) {
          try {
            await updateProfile(fbUser, { displayName });
          } catch (pErr) {}
        }
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        fbUser = res.user;
      }

      setFirebaseUser(fbUser);

      // Sync with backend
      let scrollUser = {};
      let needsUsername = true;
      try {
        const token = await fbUser.getIdToken();
        const res = await fetch(`${API_BASE}/users/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success && json.data?.user) {
          scrollUser = json.data.user;
          needsUsername = json.data.needsUsername || !scrollUser.username;
        }
      } catch (sErr) {}

      const newUserObj = {
        id: scrollUser.id || fbUser.uid,
        firebaseUid: fbUser.uid,
        name: displayName || scrollUser.name || fbUser.displayName || email.split('@')[0],
        email: fbUser.email,
        username: scrollUser.username || '',
        handle: scrollUser.username ? `@${scrollUser.username}` : '',
        avatarUrl: scrollUser.avatarUrl || '',
        bio: scrollUser.bio || '',
        isLoggedIn: true,
        isCreator: Boolean(scrollUser.isCreator),
        phone: '+91 98765 43210',
        address: { label: 'Home', street: '100 Feet Road', area: 'Indiranagar, Bengaluru', pincode: '560038' }
      };
      saveUserState(newUserObj);

      if (needsUsername || isRegister) {
        setShowUsernameModal(true);
      } else {
        showToast(`Welcome! Signed in as ${email}`, 'success');
        executePendingOrderIntent();
      }
      return fbUser;
    } catch (err) {
      console.error('[EMAIL AUTH ERROR]', err);
      if (!isFirebaseConfigured) {
        const mockUid = `fb_uid_${Date.now()}`;
        const newUserObj = {
          id: mockUid,
          firebaseUid: mockUid,
          name: displayName || email.split('@')[0],
          email: email,
          isLoggedIn: true,
          isCreator: false,
          phone: '+91 98765 43210',
          address: { label: 'Home', street: 'Jubilee Hills', area: 'Hyderabad', pincode: '500033' }
        };
        saveUserState(newUserObj);
        showToast(`Signed in as ${email} (Dev Mode)`, 'success');
        setShowUsernameModal(true);
        return { uid: mockUid, email };
      }
      const cleanError = formatAuthError(err);
      throw new Error(cleanError);
    }
  };

  const loginUser = (phoneOrEmail) => {
    const mockUid = `fb_uid_${Date.now()}`;
    const newUserObj = {
      ...user,
      id: mockUid,
      firebaseUid: mockUid,
      name: phoneOrEmail.split('@')[0] || 'ScrollNom Foodie',
      email: phoneOrEmail.includes('@') ? phoneOrEmail : user.email,
      phone: !phoneOrEmail.includes('@') ? phoneOrEmail : user.phone,
      isLoggedIn: true
    };
    saveUserState(newUserObj);
    setAuthModal({ isOpen: false, title: '', pendingDish: null });
    showToast(`Welcome! Logged in as ${phoneOrEmail} 🎉`, 'success');
    executePendingOrderIntent();
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setFirebaseUser(null);
    setUser(INITIAL_USER);
    try {
      localStorage.removeItem('scrollnom_user');
    } catch (e) {}
    setActiveTab('home');
    showToast('Signed out of ScrollNom 👋', 'info');
  };

  const promptAuth = (title = 'Sign in to continue', pendingDish = null) => {
    if (pendingDish) {
      try {
        sessionStorage.setItem('scrollnom_pending_intent', JSON.stringify(pendingDish));
        setPendingAuthIntent(pendingDish);
      } catch {}
    }
    setAuthModal({
      isOpen: true,
      title,
      pendingDish
    });
  };

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false, pendingDish: null }));
  };

  // PERSISTENT CREATOR MODE TOGGLE
  const toggleCreatorMode = async () => {
    if (!user.isLoggedIn) {
      promptAuth('Sign in to enable Creator Mode');
      return;
    }

    const nextMode = !user.isCreator;

    // 1. Persist creator status to backend SQLite database
    try {
      const token = await getAuthToken();
      if (token) {
        await fetch(`${API_BASE}/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isCreator: nextMode })
        });
      }
    } catch (e) {
      console.error('[CREATOR MODE API PERSISTENCE ERROR]', e);
    }

    // 2. Update local state and localStorage
    const updatedUser = { ...user, isCreator: nextMode };
    saveUserState(updatedUser);

    showToast(
      nextMode
        ? 'Switched to Creator Mode! Studio features unlocked 🎥'
        : 'Switched to Consumer View 🍔',
      'info'
    );
  };

  const addToCart = (dish) => {
    if (!user.isLoggedIn) {
      promptAuth(`Sign in to order ${dish.title || dish.dishName}`, dish);
      return;
    }

    setCartItems(prev => {
      const dishId = dish.dishId || dish.id;
      const existing = prev.find(item => item.dishId === dishId);
      if (existing) {
        return prev.map(item =>
          item.dishId === dishId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}`,
          dishId: dishId,
          title: dish.title || dish.dishName,
          price: dish.dishPrice || dish.price,
          quantity: 1,
          restaurantName: dish.restaurantName || 'ScrollNom Partner',
          image: dish.posterUrl || dish.image,
          addons: dish.addons || []
        }
      ];
    });

    showToast(`Added ${dish.title || dish.dishName} to cart! 🛒`, 'success');
  };

  const updateCartQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
      showToast('Item removed from cart', 'info');
    } else {
      setCartItems(prev => prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        firebaseUser,
        activeTab,
        setActiveTab,
        videos,
        setVideos,
        fetchNommlyVideos,
        activeVideoIndex,
        setActiveVideoIndex,
        cartItems,
        setCartItems,
        addToCart,
        updateCartQuantity,
        clearCart,
        foodOnFriend,
        setFoodOnFriend,
        authModal,
        promptAuth,
        closeAuthModal,
        loginWithGoogle,
        loginWithEmail,
        loginUser,
        logoutUser,
        toast,
        showToast,
        toggleCreatorMode,
        showUsernameModal,
        setShowUsernameModal,
        getAuthToken,
        notifications,
        unreadNotifCount,
        unreadMessageCount,
        activeChatUser,
        setActiveChatUser,
        selectedUserProfileUsername,
        setSelectedUserProfileUsername,
        handleMarkNotifRead,
        handleMarkAllNotifsRead,
        openUserProfile,
        openChatWithUser,
        loadNotificationsAndUnreads
      }}
    >
      {children}

      {/* Username Onboarding Modal */}
      {showUsernameModal && (
        <UsernameOnboardingModal
          isOpen={showUsernameModal}
          onClose={() => setShowUsernameModal(false)}
        />
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
