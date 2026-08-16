import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { MOCK_RESTAURANTS, MOCK_NOMMLY_VIDEOS, MOCK_CREATORS } from '../../data/mockData';
import { Search, Star, Plus, UserPlus, UserCheck, CheckCircle2, Sparkles, Users } from 'lucide-react';
import { HalalIcon, SpiceLevelIndicator } from '../../components/brand/IconSet';
import { UserProfileModal } from '../../components/profile/UserProfileModal';
import { PublicRestaurantProfileModal } from '../../components/restaurant/PublicRestaurantProfileModal';

export const ExplorePage = () => {
  const { videos, addToCart, setActiveTab, setActiveVideoIndex, user, getAuthToken, showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('food'); // 'food' | 'restaurants' | 'creators' | 'users'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'halal' | 'top_rated'
  
  // Real User Search State
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [selectedRestaurantModal, setSelectedRestaurantModal] = useState(null);

  // Search users via backend API when searchQuery changes or subtab is users/creators
  useEffect(() => {
    if (!searchQuery.trim() && activeSubTab !== 'users') {
      setUserSearchResults([]);
      return;
    }

    let isMounted = true;
    setSearchingUsers(true);

    const fetchUsers = async () => {
      try {
        const token = await getAuthToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const url = `${API_BASE}/users/search${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ''}`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            // Deduplicate by user ID
            const list = json.data || [];
            const seen = new Set();
            const unique = list.filter(u => {
              if (!u.id || seen.has(u.id)) return false;
              seen.add(u.id);
              return true;
            });
            setUserSearchResults(unique);
          }
        }
      } catch (e) {
        console.error('[USER SEARCH ERROR]', e);
      } finally {
        if (isMounted) setSearchingUsers(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, activeSubTab]);

  const displayVideos = (videos && videos.length > 0) ? videos : MOCK_NOMMLY_VIDEOS;

  const filteredVideos = displayVideos.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || item.title.toLowerCase().includes(q) ||
                          item.restaurantName.toLowerCase().includes(q) ||
                          item.creatorName.toLowerCase().includes(q) ||
                          (item.tags && item.tags.some(t => t.toLowerCase().includes(q))) ||
                          (item.category && item.category.toLowerCase().includes(q)) ||
                          (item.subcategory && item.subcategory.toLowerCase().includes(q));

    if (activeFilter === 'halal') return matchesSearch && item.halalCertified;
    if (activeFilter === 'top_rated') return matchesSearch && item.rating >= 4.8;
    if (activeFilter === 'breakfast') return matchesSearch && item.category === 'breakfast';
    if (activeFilter === 'main_food') return matchesSearch && item.category === 'main_food';
    if (activeFilter === 'beverages') return matchesSearch && item.category === 'beverages';
    if (activeFilter === 'desserts') return matchesSearch && item.category === 'desserts';
    if (activeFilter === 'vegetarian' || activeFilter === 'veg') return matchesSearch && (item.diet === 'vegetarian' || item.dietType === 'VEG' || item.dietType === 'VEGAN');
    if (activeFilter === 'non_vegetarian' || activeFilter === 'non_veg') return matchesSearch && (item.diet === 'non_vegetarian' || item.dietType === 'NON_VEG');
    if (activeFilter === 'egg') return matchesSearch && item.dietType === 'EGG';
    return matchesSearch;
  });

  const handleToggleFollow = async (targetUser, e) => {
    e.stopPropagation();
    if (!user.isLoggedIn) {
      showToast('Please sign in to follow users!', 'info');
      return;
    }

    const previousState = targetUser.isFollowing;
    const newCount = previousState ? targetUser.followerCount - 1 : targetUser.followerCount + 1;

    setUserSearchResults(prev =>
      prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: !previousState, followerCount: newCount } : u)
    );

    try {
      const token = await getAuthToken();
      const method = previousState ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE}/users/${targetUser.id}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast(previousState ? `Unfollowed @${targetUser.username}` : `Now following @${targetUser.username}! 🎉`, 'success');
      } else {
        // Revert
        setUserSearchResults(prev =>
          prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: previousState, followerCount: targetUser.followerCount } : u)
        );
      }
    } catch (err) {
      setUserSearchResults(prev =>
        prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: previousState, followerCount: targetUser.followerCount } : u)
      );
    }
  };

  return (
    <div className="pb-24 lg:pb-8 pt-4 px-4 lg:px-8 max-w-7xl mx-auto space-y-6 animate-fade-in select-none">
      
      {/* TOP SEARCH & NAVIGATION HEADER */}
      <div className="bg-brand-cream-card p-4 lg:p-6 rounded-3xl border border-brand-cream-dark shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-teal" />
            <input
              type="text"
              placeholder="Search dishes, coffee, users, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-brand-cream-dark text-sm font-semibold text-brand-charcoal placeholder-brand-charcoal-muted focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20 transition-all"
            />
          </div>

          {/* Sub Tabs */}
          <div className="flex bg-white p-1.5 rounded-2xl border border-brand-cream-dark w-full md:w-auto overflow-x-auto">
            {[
              { id: 'food', label: 'Dishes & Drinks' },
              { id: 'restaurants', label: 'Restaurants & Cafes' },
              { id: 'nearby', label: '📍 Nearby Bengaluru' },
              { id: 'users', label: 'Users & Creators' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 ${
                  activeSubTab === tab.id
                    ? 'bg-brand-coral text-white shadow-coral'
                    : 'text-brand-charcoal-muted hover:text-brand-charcoal'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Pills for Food & Beverages */}
        {activeSubTab === 'food' && (
          <div className="flex items-center space-x-2 pt-2 border-t border-brand-cream-dark/60 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Dishes' },
              { id: 'beverages', label: 'Beverages ☕🥤' },
              { id: 'breakfast', label: 'Breakfast 🥞' },
              { id: 'main_food', label: 'Main Food 🍛' },
              { id: 'desserts', label: 'Desserts 🍰' },
              { id: 'vegetarian', label: 'Veg 🟢' },
              { id: 'non_vegetarian', label: 'Non-Veg 🔴' },
              { id: 'halal', label: 'Halal Certified ✨' },
              { id: 'top_rated', label: 'Top Rated ⭐ 4.8+' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all border ${
                  activeFilter === filter.id
                    ? 'bg-brand-teal text-white border-brand-teal shadow-soft'
                    : 'bg-white text-brand-charcoal-muted border-brand-cream-dark hover:border-brand-teal/40'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DISHES & REELS GRID */}
      {activeSubTab === 'food' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-3xl overflow-hidden border border-brand-cream-dark shadow-soft hover:shadow-hover transition-all duration-300 group flex flex-col justify-between"
            >
              {/* Media Header */}
              <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => handleWatchVideo(video)}>
                <img
                  src={video.posterUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  {video.halalCertified && (
                    <div className="bg-emerald-950/80 backdrop-blur-sm border border-emerald-500/30 p-1 rounded-full" title="Halal Certified">
                      <HalalIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                  <SpiceLevelIndicator level={video.spiceLevel} />
                </div>

                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center space-x-1 text-amber-400 font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{video.rating}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="font-bold text-base font-heading drop-shadow-md line-clamp-1">{video.title}</h4>
                  <p className="text-xs text-white/80 font-medium drop-shadow-sm">{video.restaurantName}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 flex items-center justify-between bg-white border-t border-brand-cream-dark/60">
                <div>
                  <p className="text-xs text-brand-charcoal-muted">Dish Price</p>
                  <p className="text-lg font-bold text-brand-coral">₹{video.dishPrice}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleWatchVideo(video)}
                    className="px-3.5 py-2 bg-cream-bg text-brand-charcoal font-semibold text-xs rounded-xl border border-warm-grey hover:bg-cream-dark transition-all"
                  >
                    Nom Reel 🎥
                  </button>
                  <button
                    onClick={() => addToCart(video)}
                    className="px-4 py-2 bg-brand-coral text-white font-bold text-xs rounded-xl shadow-button hover:bg-brand-coral-hover transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Order</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USER SEARCH RESULTS SECTION */}
      {(activeSubTab === 'users' || userSearchResults.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-heading text-brand-charcoal flex items-center space-x-2">
              <Users className="w-5 h-5 text-brand-teal" />
              <span>ScrollNom Community Users</span>
            </h3>
            {searchQuery && (
              <span className="text-xs text-brand-charcoal-muted">{userSearchResults.length} users found</span>
            )}
          </div>

          {searchingUsers ? (
            <div className="p-8 text-center text-brand-charcoal-muted text-sm animate-pulse bg-white rounded-2xl border border-brand-cream-dark">
              Searching ScrollNom users...
            </div>
          ) : userSearchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userSearchResults.map((usr) => (
                <div
                  key={usr.id}
                  onClick={() => setSelectedUserModal(usr.username)}
                  className="bg-white p-4 rounded-2xl border border-brand-cream-dark shadow-soft hover:border-brand-teal/40 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={usr.avatarUrl}
                      alt={usr.displayName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-brand-cream-dark group-hover:border-brand-teal transition-colors"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1">
                        <h4 className="font-bold text-sm text-brand-charcoal truncate">{usr.displayName}</h4>
                        {usr.isCreator && (
                          <Sparkles className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-brand-teal font-medium truncate">@{usr.username}</p>
                      <p className="text-[11px] text-brand-charcoal-muted">{usr.followerCount} followers</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleToggleFollow(usr, e)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shrink-0 ${
                      usr.isFollowing
                        ? 'bg-cream-dark text-charcoal border border-warm-grey'
                        : 'bg-brand-coral text-white hover:bg-brand-coral-hover'
                    }`}
                  >
                    {usr.isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-brand-teal" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : activeSubTab === 'users' ? (
            <div className="p-8 text-center text-brand-charcoal-muted text-sm bg-white rounded-2xl border border-brand-cream-dark">
              {searchQuery ? `No ScrollNom users found matching "${searchQuery}"` : 'Type a username or display name above to search users!'}
            </div>
          ) : null}
        </div>
      )}

      {/* RESTAURANTS & CAFES GRID */}
      {(activeSubTab === 'restaurants' || activeSubTab === 'nearby') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_RESTAURANTS.filter(r => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())).map((rest) => (
            <div
              key={rest.id}
              onClick={() => setSelectedRestaurantModal(rest)}
              className="bg-white rounded-3xl overflow-hidden border border-brand-cream-dark shadow-soft hover:shadow-hover transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-video overflow-hidden">
                <img src={rest.image} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <div className="absolute top-3 left-3 bg-brand-coral text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                  {rest.badge}
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center space-x-1 text-amber-400 font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{rest.rating}</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="font-bold text-base font-heading drop-shadow-md">{rest.name}</h4>
                  <p className="text-xs text-white/80 font-medium">{rest.location}</p>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between bg-white border-t border-brand-cream-dark/60">
                <div>
                  <p className="text-xs text-brand-charcoal-muted">{rest.cuisine}</p>
                  <p className="text-xs font-bold text-brand-coral">{rest.priceForTwo} for two</p>
                </div>
                <button className="px-4 py-2 bg-brand-teal text-white font-extrabold text-xs rounded-xl shadow-soft hover:bg-brand-teal-dark transition-all">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USER PROFILE MODAL OVERLAY */}
      {selectedUserModal && (
        <UserProfileModal
          username={selectedUserModal}
          isOpen={!!selectedUserModal}
          onClose={() => setSelectedUserModal(null)}
        />
      )}

      {/* PUBLIC RESTAURANT PROFILE MODAL OVERLAY */}
      {selectedRestaurantModal && (
        <PublicRestaurantProfileModal
          restaurant={selectedRestaurantModal}
          isOpen={!!selectedRestaurantModal}
          onClose={() => setSelectedRestaurantModal(null)}
        />
      )}
    </div>
  );
};

export default ExplorePage;
