import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { MOCK_STORIES, MOCK_OFFERS, MOCK_NOMMLY_VIDEOS, MOCK_RESTAURANTS } from '../../data/mockData';
import { CategoryIcon, SpiceLevelIndicator, HalalIcon } from '../../components/brand/IconSet';
import { Star, Play, Plus, Clock, Sparkles, Flame, MessageSquare, TrendingUp, Compass, X, Volume2, VolumeX, Heart, Bookmark, Users, UserPlus, UserCheck, Tag } from 'lucide-react';
import { UserProfileModal } from '../../components/profile/UserProfileModal';

export const HomePage = () => {
  const { videos, user, setActiveTab, addToCart, setActiveVideoIndex, getAuthToken, showToast, promptAuth } = useApp();
  const displayVideos = (videos && videos.length > 0) ? videos : MOCK_NOMMLY_VIDEOS;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeStory, setActiveStory] = useState(null);

  // Phase 6 Following Feed & Suggested Creators state
  const [followingFeed, setFollowingFeed] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFeedAndSuggested = async () => {
      setFeedLoading(true);
      try {
        const token = await getAuthToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Fetch Following/Public Feed
        const feedRes = await fetch(`${API_BASE}/feed/following`, { headers });
        if (feedRes.ok) {
          const json = await feedRes.json();
          if (isMounted) setFollowingFeed(json.data?.items || []);
        }

        // Fetch Suggested Creators
        const sugRes = await fetch(`${API_BASE}/feed/suggested`, { headers });
        if (sugRes.ok) {
          const json = await sugRes.json();
          if (isMounted) setSuggestedCreators(json.data || []);
        }
      } catch (e) {
        console.error('[HOME FEED FETCH ERROR]', e);
      } finally {
        if (isMounted) setFeedLoading(false);
      }
    };

    fetchFeedAndSuggested();
    return () => { isMounted = false; };
  }, [user.isLoggedIn]);

  const categories = [
    { id: 'all', label: 'All Eats', icon: 'thali' },
    { id: 'biryani', label: 'Biryani', icon: 'noodle' },
    { id: 'burger', label: 'Burgers', icon: 'burger' },
    { id: 'pizza', label: 'Pizza', icon: 'pizza' },
    { id: 'dessert', label: 'Desserts', icon: 'dessert' },
  ];

  const handleOpenStory = (story) => {
    setActiveStory(story);
  };

  const handleCloseStory = () => {
    setActiveStory(null);
  };

  const handleWatchReelFromStory = (story) => {
    const matchedIndex = displayVideos.findIndex(
      v => v.creatorName === story.creatorName || v.restaurantName === story.restaurantName
    );
    setActiveVideoIndex(matchedIndex >= 0 ? matchedIndex : 0);
    setActiveStory(null);
    setActiveTab('nommly');
  };

  // Like Content Handler
  const handleToggleLike = async (item, e) => {
    e.stopPropagation();
    if (!user.isLoggedIn) {
      promptAuth('Sign in to like food content', item);
      return;
    }

    const previousLiked = item.isLiked;
    const newCount = previousLiked ? item.likeCount - 1 : item.likeCount + 1;

    setFollowingFeed(prev =>
      prev.map(c => c.id === item.id ? { ...c, isLiked: !previousLiked, likeCount: newCount } : c)
    );

    try {
      const token = await getAuthToken();
      const method = previousLiked ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE}/content/${item.id}/like`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(previousLiked ? 'Unliked post' : 'Liked post! ❤️', 'success');
      } else {
        // Revert
        setFollowingFeed(prev =>
          prev.map(c => c.id === item.id ? { ...c, isLiked: previousLiked, likeCount: item.likeCount } : c)
        );
      }
    } catch (err) {
      setFollowingFeed(prev =>
        prev.map(c => c.id === item.id ? { ...c, isLiked: previousLiked, likeCount: item.likeCount } : c)
      );
    }
  };

  // Save Content Handler
  const handleToggleSave = async (item, e) => {
    e.stopPropagation();
    if (!user.isLoggedIn) {
      promptAuth('Sign in to save dishes', item);
      return;
    }

    const previousSaved = item.isSaved;
    const newCount = previousSaved ? item.saveCount - 1 : item.saveCount + 1;

    setFollowingFeed(prev =>
      prev.map(c => c.id === item.id ? { ...c, isSaved: !previousSaved, saveCount: newCount } : c)
    );

    try {
      const token = await getAuthToken();
      const method = previousSaved ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE}/content/${item.id}/save`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(previousSaved ? 'Removed from saved dishes' : 'Saved dish! 🔖', 'success');
      } else {
        // Revert
        setFollowingFeed(prev =>
          prev.map(c => c.id === item.id ? { ...c, isSaved: previousSaved, saveCount: item.saveCount } : c)
        );
      }
    } catch (err) {
      setFollowingFeed(prev =>
        prev.map(c => c.id === item.id ? { ...c, isSaved: previousSaved, saveCount: item.saveCount } : c)
      );
    }
  };

  // Order Dish Handler with Behavioral Order Intent Signal
  const handleOrderDish = async (item) => {
    if (!user.isLoggedIn) {
      promptAuth(`Sign in to order ${item.title || item.dishTitle}`, item);
      return;
    }

    // Record Behavioral Order Intent signal to backend
    try {
      const token = await getAuthToken();
      fetch(`${API_BASE}/analytics/order-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          contentId: item.id,
          dishId: item.dishId || 'd1',
          restaurantName: item.restaurantName
        })
      }).catch(err => console.error('[ANALYTICS INTENT ERROR]', err));
    } catch (e) {
      // ignore non-blocking analytics error
    }

    addToCart(item);
  };

  // Follow Suggested Creator Handler
  const handleFollowSuggested = async (creator, e) => {
    e.stopPropagation();
    if (!user.isLoggedIn) {
      promptAuth('Sign in to follow creators');
      return;
    }

    setSuggestedCreators(prev => prev.filter(c => c.id !== creator.id));

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/users/${creator.id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(`Now following @${creator.username}! 🎉`, 'success');
        // Refresh following feed
        const feedRes = await fetch(`${API_BASE}/feed/following`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (feedRes.ok) {
          const json = await feedRes.json();
          setFollowingFeed(json.data?.items || []);
        }
      }
    } catch (e) {
      showToast('Failed to follow creator', 'error');
    }
  };

  return (
    <div className="pb-24 lg:pb-8 pt-4 px-4 lg:px-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* STORY VIEWER MODAL */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-brand-charcoal text-white rounded-3xl overflow-hidden shadow-floating border border-white/10 flex flex-col justify-between h-[80vh] max-h-[680px]">
            
            {/* Story Progress Bar */}
            <div className="absolute top-3 left-3 right-3 z-30 flex space-x-1">
              <div className="h-1 bg-brand-gold rounded-full flex-1 animate-pulse" />
            </div>

            {/* Story Header */}
            <div className="relative z-30 p-4 pt-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center space-x-3">
                <img
                  src={activeStory.creatorAvatar}
                  alt={activeStory.creatorName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-brand-coral"
                />
                <div>
                  <h3 className="text-xs font-extrabold text-white">{activeStory.creatorName}</h3>
                  <p className="text-[10px] text-brand-gold font-bold">
                    {activeStory.dishName} • {activeStory.restaurantName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseStory}
                className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Story Image / Video Media */}
            <div className="absolute inset-0 z-10">
              <img
                src={activeStory.mediaUrl || activeStory.creatorAvatar}
                alt={activeStory.dishName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
            </div>

            {/* Story Action Footer */}
            <div className="relative z-30 p-6 space-y-3 bg-gradient-to-t from-black via-black/80 to-transparent">
              <div>
                <span className="bg-brand-coral text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Featured Dish
                </span>
                <h2 className="text-xl font-bold font-heading text-white mt-1">{activeStory.dishName}</h2>
                <p className="text-sm font-extrabold text-brand-coral">₹{activeStory.price || 380}</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleWatchReelFromStory(activeStory)}
                  className="flex-1 bg-brand-coral text-white font-bold py-3 rounded-2xl shadow-coral hover:bg-brand-coral-hover transition-all flex items-center justify-center space-x-2 text-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>NOM THIS DISH IN NOMMLY REELS →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORIES BAR */}
      <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none">
        {MOCK_STORIES.map((story) => (
          <button
            key={story.id}
            onClick={() => handleOpenStory(story)}
            className="flex flex-col items-center space-y-1.5 shrink-0 group focus:outline-none"
          >
            <div className={`p-0.5 rounded-full ${story.hasActiveDeal ? 'bg-gradient-to-tr from-brand-coral via-brand-gold to-brand-teal animate-pulse-subtle' : 'bg-brand-cream-dark'}`}>
              <div className="p-0.5 bg-white rounded-full">
                <img
                  src={story.creatorAvatar}
                  alt={story.creatorName}
                  className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </div>
            <span className="text-[11px] font-bold text-brand-charcoal truncate max-w-[68px]">
              {story.creatorName.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* DEALS & OFFERS BANNER CAROUSEL (REG-02) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-heading text-brand-charcoal flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-brand-coral fill-brand-coral/20" />
            <span>Hot Deals & Nom Offers</span>
          </h3>
          <span className="text-[11px] font-bold text-brand-coral">Trending Savings 🔥</span>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none">
          {MOCK_OFFERS.map((offer) => (
            <div
              key={offer.id}
              className="shrink-0 w-72 bg-gradient-to-r from-brand-charcoal to-brand-charcoal-light rounded-2xl p-4 text-white shadow-soft relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all cursor-pointer"
              onClick={() => {
                showToast(`Applied promo code ${offer.code}! Discount ready at checkout 🎉`, 'success');
              }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 group-hover:opacity-40 transition-opacity">
                <img src={offer.bannerImage} alt={offer.title} className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10 space-y-1">
                <span className="bg-brand-coral text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {offer.discount}
                </span>
                <h4 className="font-extrabold text-base leading-tight font-heading line-clamp-1">{offer.title}</h4>
                <p className="text-xs text-brand-gold font-semibold truncate">{offer.restaurantName}</p>
              </div>
              <div className="relative z-10 pt-3 flex items-center justify-between border-t border-white/10 mt-3">
                <span className="text-[10px] font-mono bg-white/10 text-white font-bold px-2 py-1 rounded-lg border border-white/20">
                  CODE: {offer.code}
                </span>
                <button className="text-xs font-bold text-brand-gold group-hover:text-white flex items-center space-x-1">
                  <span>Claim Offer</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY NAV PILLS */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-brand-coral text-white border-brand-coral shadow-coral'
                : 'bg-white text-brand-charcoal border-brand-cream-dark hover:border-brand-coral/40'
            }`}
          >
            <CategoryIcon type={cat.icon} className="w-4 h-4" />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* PERSONALIZED & DISCOVERY FEED (REG-03) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-brand-charcoal flex items-center space-x-2">
            <Compass className="w-5 h-5 text-brand-coral" />
            <span>{user.isLoggedIn ? 'Your Personalized Following Feed' : 'Trending Food Discovery Feed'}</span>
          </h2>
          {user.isLoggedIn ? (
            <span className="text-xs text-brand-teal font-semibold">Social Content Graph Active ✓</span>
          ) : (
            <span className="text-xs text-brand-coral font-semibold">Guest Browsing Active</span>
          )}
        </div>

        {/* FEED CARDS */}
        {feedLoading ? (
          <div className="py-12 text-center text-brand-charcoal-muted text-sm animate-pulse bg-white rounded-3xl border border-brand-cream-dark">
            Loading food feed...
          </div>
        ) : followingFeed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followingFeed.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-brand-cream-dark shadow-soft hover:shadow-hover transition-all duration-300 group flex flex-col justify-between"
              >
                {/* Header Owner Bar */}
                <div className="p-3.5 flex items-center justify-between border-b border-brand-cream-dark/60 bg-cream-bg/40">
                  <div
                    onClick={() => setSelectedUserModal(item.ownerUsername)}
                    className="flex items-center space-x-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={item.ownerAvatar}
                      alt={item.ownerName}
                      className="w-9 h-9 rounded-full object-cover border border-warm-grey"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-brand-charcoal flex items-center space-x-1">
                        <span>{item.ownerName}</span>
                        {item.ownerType === 'creator' && (
                          <Sparkles className="w-3 h-3 text-brand-coral shrink-0" />
                        )}
                      </h4>
                      <p className="text-[10px] text-brand-teal font-medium">@{item.ownerUsername}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-brand-charcoal-muted bg-white px-2 py-0.5 rounded-full border border-warm-grey">
                    {(item.contentType || 'NOMMLY').toUpperCase()}
                  </span>
                </div>

                {/* Media Preview */}
                <div
                  className="relative aspect-video overflow-hidden cursor-pointer"
                  onClick={() => { setActiveVideoIndex(0); setActiveTab('nommly'); }}
                >
                  <img
                    src={item.posterUrl || item.mediaUrl}
                    alt={item.title || item.dishTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="font-bold text-base font-heading drop-shadow-md line-clamp-1">
                      {item.title || item.dishTitle}
                    </h4>
                    <p className="text-xs text-white/80 font-medium drop-shadow-sm">{item.restaurantName}</p>
                  </div>
                </div>

                {/* Caption & Interactive Like/Save Actions */}
                <div className="p-4 space-y-3 bg-white">
                  {item.caption && (
                    <p className="text-xs text-brand-charcoal-muted line-clamp-2">{item.caption}</p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-brand-cream-dark/60">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => handleToggleLike(item, e)}
                        className={`flex items-center space-x-1 text-xs font-bold transition-all ${
                          item.isLiked ? 'text-red-500' : 'text-brand-charcoal-muted hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${item.isLiked ? 'fill-current' : ''}`} />
                        <span>{item.likeCount}</span>
                      </button>

                      <button
                        onClick={(e) => handleToggleSave(item, e)}
                        className={`flex items-center space-x-1 text-xs font-bold transition-all ${
                          item.isSaved ? 'text-brand-teal' : 'text-brand-charcoal-muted hover:text-brand-teal'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${item.isSaved ? 'fill-current' : ''}`} />
                        <span>{item.saveCount}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-brand-coral">₹{item.dishPrice || 380}</span>
                      <button
                        onClick={() => handleOrderDish(item)}
                        className="px-3.5 py-1.5 bg-brand-coral text-white font-bold text-xs rounded-xl shadow-button hover:bg-brand-coral-hover transition-all flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* FALLBACK DISCOVERY FEED FOR GUESTS / SPARSE FEEDS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayVideos.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white rounded-3xl overflow-hidden border border-brand-cream-dark shadow-soft hover:shadow-hover transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="p-3.5 flex items-center justify-between border-b border-brand-cream-dark/60 bg-cream-bg/40">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={item.creatorAvatar}
                      alt={item.creatorName}
                      className="w-9 h-9 rounded-full object-cover border border-warm-grey"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-brand-charcoal flex items-center space-x-1">
                        <span>{item.creatorName}</span>
                        <Sparkles className="w-3 h-3 text-brand-coral shrink-0" />
                      </h4>
                      <p className="text-[10px] text-brand-teal font-medium">@{item.creatorName.split(' ')[0].toLowerCase()}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-brand-coral bg-brand-coral/10 px-2 py-0.5 rounded-full border border-brand-coral/20">
                    FEATURED
                  </span>
                </div>

                <div
                  className="relative aspect-video overflow-hidden cursor-pointer"
                  onClick={() => { setActiveVideoIndex(idx); setActiveTab('nommly'); }}
                >
                  <img
                    src={item.posterUrl || item.mediaUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="font-bold text-base font-heading drop-shadow-md line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-white/80 font-medium drop-shadow-sm">{item.restaurantName}</p>
                  </div>
                </div>

                <div className="p-4 space-y-3 bg-white">
                  <p className="text-xs text-brand-charcoal-muted line-clamp-2">{item.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-brand-cream-dark/60">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => handleToggleLike(item, e)}
                        className="flex items-center space-x-1 text-xs font-bold text-brand-charcoal-muted hover:text-red-500 transition-all"
                      >
                        <Heart className="w-4 h-4" />
                        <span>{item.likes}</span>
                      </button>

                      <button
                        onClick={(e) => handleToggleSave(item, e)}
                        className="flex items-center space-x-1 text-xs font-bold text-brand-charcoal-muted hover:text-brand-teal transition-all"
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>{item.saves}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-brand-coral">₹{item.price}</span>
                      <button
                        onClick={() => handleOrderDish(item)}
                        className="px-3.5 py-1.5 bg-brand-coral text-white font-bold text-xs rounded-xl shadow-button hover:bg-brand-coral-hover transition-all flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUGGESTED CREATORS TO FOLLOW */}
      {suggestedCreators.length > 0 && (
        <div className="bg-gradient-to-r from-brand-cream-card via-white to-brand-teal/5 p-5 rounded-3xl border border-brand-cream-dark shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-brand-charcoal flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-coral" />
              <span>Suggested Food Creators to Follow</span>
            </h3>
            <button onClick={() => setActiveTab('explore')} className="text-xs font-bold text-brand-teal hover:underline">
              Explore All →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {suggestedCreators.map((creator) => (
              <div
                key={creator.id}
                onClick={() => setSelectedUserModal(creator.username)}
                className="bg-white p-3 rounded-2xl border border-brand-cream-dark text-center space-y-2 hover:border-brand-teal/40 transition-all cursor-pointer group"
              >
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-brand-cream-dark group-hover:border-brand-teal transition-colors"
                />
                <div>
                  <h4 className="font-bold text-xs text-brand-charcoal truncate">{creator.displayName}</h4>
                  <p className="text-[10px] text-brand-teal font-medium truncate">@{creator.username}</p>
                </div>
                <button
                  onClick={(e) => handleFollowSuggested(creator, e)}
                  className="w-full py-1 bg-brand-coral text-white font-bold text-[11px] rounded-lg hover:bg-brand-coral-hover transition-all flex items-center justify-center space-x-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Follow</span>
                </button>
              </div>
            ))}
          </div>
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
    </div>
  );
};

export default HomePage;
