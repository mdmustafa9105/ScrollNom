import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { HalalIcon, SpiceLevelIndicator } from '../../components/brand/IconSet';
import { Heart, MessageCircle, Share2, Bookmark, ShoppingBag, Star, Volume2, VolumeX, ChevronUp, ChevronDown, CheckCircle2, ShieldCheck, Flame, Clock } from 'lucide-react';
import { UserProfileModal } from '../../components/profile/UserProfileModal';

export const NommlyPage = () => {
  const {
    videos,
    activeVideoIndex,
    setActiveVideoIndex,
    toggleLikeReel,
    toggleSaveReel,
    addToCart,
    promptAuth,
    user,
    getAuthToken,
    showToast
  } = useApp();

  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [isBrokenBelt, setIsBrokenBelt] = useState(false);
  const [now, setNow] = useState(new Date());
  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getBeltLabel = (h, m) => {
    const tot = h * 60 + m;
    if (tot >= 300 && tot < 360) return 'TRANSITION';
    if (tot >= 360 && tot < 660) return 'MORNING BELT';
    if (tot >= 660 && tot < 720) return 'MORNING + LUNCH MIX';
    if (tot >= 720 && tot < 900) return 'AFTERNOON BELT';
    if (tot >= 900 && tot < 960) return 'AFTERNOON + EVENING MIX';
    if (tot >= 960 && tot < 1260) return 'EVENING BELT';
    return 'OVERNIGHT BELT';
  };

  const currentBeltLabel = getBeltLabel(hours, minutes);

  const currentReel = videos[activeVideoIndex] || videos[0];

  // Handle HTML5 Video autoplay & source reload on slide change
  useEffect(() => {
    if (videoRef.current && currentReel?.videoUrl) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentReel?.videoUrl, activeVideoIndex]);

  // Record View Event on Reel View
  useEffect(() => {
    if (!currentReel || !user.isLoggedIn) return;

    const recordView = async () => {
      try {
        const token = await getAuthToken();
        fetch(`${API_BASE}/analytics/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ contentId: currentReel.id || `c_${activeVideoIndex + 1}` })
        }).catch(err => console.error('[ANALYTICS VIEW ERROR]', err));
      } catch (e) {
        // ignore non-blocking view event error
      }
    };

    recordView();
  }, [activeVideoIndex, user.isLoggedIn]);

  const handleNextVideo = () => {
    if (activeVideoIndex < videos.length - 1) {
      setActiveVideoIndex(prev => prev + 1);
    } else {
      setActiveVideoIndex(0);
    }
  };

  const handlePrevVideo = () => {
    if (activeVideoIndex > 0) {
      setActiveVideoIndex(prev => prev - 1);
    }
  };

  const handleOrderClick = async () => {
    if (!user.isLoggedIn) {
      promptAuth(`Sign in to order ${currentReel.title}`, currentReel);
    } else {
      try {
        const token = await getAuthToken();
        fetch(`${API_BASE}/analytics/order-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            contentId: currentReel.id || `c_${activeVideoIndex + 1}`,
            dishId: currentReel.dishId || 'd1',
            restaurantName: currentReel.restaurantName
          })
        }).catch(err => console.error('[ANALYTICS INTENT ERROR]', err));
      } catch (e) {
        // ignore
      }

      addToCart(currentReel);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-60px)] lg:h-screen bg-black text-white overflow-hidden select-none">
      
      {/* DESKTOP 2-PANE SPLIT VIEW (`lg:grid grid-cols-12`) */}
      <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* LEFT PANE: VIDEO ENVIRONMENT */}
        <div className="lg:col-span-7 relative h-[75vh] lg:h-full bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={currentReel.videoUrl}
            poster={currentReel.posterUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

          {/* TIME BELT OVERLAY BADGE & SELECTOR */}
          <div className="absolute top-4 left-4 z-30 pointer-events-auto flex items-center space-x-2">
            <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center space-x-2 text-xs font-bold shadow-md">
              <Clock className="w-3.5 h-3.5 text-brand-coral" />
              <span className="text-white">
                {isBrokenBelt ? '⚡ BROKEN BELT' : `${currentBeltLabel} • ${currentTimeStr}`}
              </span>
            </div>

            <button
              onClick={() => setIsBrokenBelt(!isBrokenBelt)}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border shadow-md ${
                isBrokenBelt
                  ? 'bg-amber-500 text-black border-amber-400 font-black animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/20'
              }`}
              title="Toggle Broken Belt mode to discover food outside current time belt"
            >
              {isBrokenBelt ? '⚡ BROKEN BELT ACTIVE' : 'BREAK BELT'}
            </button>
          </div>

          {/* Contextual Explanation Badges */}
          <div className="absolute top-16 left-4 z-20 pointer-events-none flex flex-wrap gap-1.5 max-w-xs">
            <span className="bg-brand-teal/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-white/20 shadow-sm flex items-center space-x-1">
              <span>📍 Indiranagar • 1.2 km</span>
            </span>
            <span className="bg-emerald-950/80 backdrop-blur-sm text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-sm">
              🟢 Open Now
            </span>
            {!isBrokenBelt && (
              <span className="bg-brand-coral/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-white/20 shadow-sm">
                ✨ {currentBeltLabel} Match
              </span>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/80 transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-brand-coral" />}
          </button>

          {/* Navigation Controls */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-3">
            <button
              onClick={handlePrevVideo}
              disabled={activeVideoIndex === 0}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 disabled:opacity-30 hover:bg-black/80 transition-all"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextVideo}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/80 transition-all"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Overlay Overlay Metadata */}
          <div className="absolute bottom-4 left-4 right-16 z-20 lg:hidden space-y-2 pointer-events-auto">
            <div className="flex items-center space-x-2">
              <span className="bg-brand-coral text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {currentReel.restaurantName}
              </span>
              {currentReel.halalCertified && (
                <div className="bg-emerald-950/80 p-0.5 rounded-full" title="Halal Certified">
                  <HalalIcon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              )}
            </div>

            <h3 className="font-bold text-lg text-white font-heading leading-tight drop-shadow-md">
              {currentReel.title}
            </h3>

            <p className="text-xs text-white/90 line-clamp-2 drop-shadow-sm">
              {currentReel.description || 'Delicious gourmet treat prepared fresh on order! 😋'}
            </p>

            <div className="flex items-center space-x-3 pt-1">
              <span className="text-xl font-extrabold text-brand-coral drop-shadow-md">₹{currentReel.dishPrice}</span>
              <button
                onClick={handleOrderClick}
                className="px-5 py-2 bg-brand-coral text-white font-extrabold text-xs rounded-xl shadow-coral hover:bg-brand-coral-hover transition-all flex items-center space-x-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>ORDER NOW</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: DESKTOP DISCOVERY DETAILS & DISH CONTEXT */}
        <div className="hidden lg:col-span-5 bg-brand-charcoal border-l border-white/10 lg:flex flex-col justify-between p-6 overflow-y-auto">
          
          <div className="space-y-6">
            {/* Creator / Owner Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div
                onClick={() => setSelectedUserModal(currentReel.ownerUsername || currentReel.creatorHandle?.replace('@', '') || currentReel.creatorName?.toLowerCase().replace(/\s+/g, ''))}
                className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  src={currentReel.creatorAvatar}
                  alt={currentReel.creatorName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-brand-coral"
                />
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center space-x-1.5">
                    <span>{currentReel.creatorName}</span>
                    <CheckCircle2 className="w-4 h-4 text-brand-teal fill-current" />
                  </h4>
                  <p className="text-xs text-brand-gold font-medium">{currentReel.restaurantName}</p>
                </div>
              </div>

              <span className="bg-white/10 text-brand-gold text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                NOMMLY REEL 🎥
              </span>
            </div>

            {/* Dish Title & Rating */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {currentReel.halalCertified && (
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <HalalIcon className="w-3 h-3 text-emerald-400" />
                    <span>Halal Certified</span>
                  </span>
                )}
                <div className="bg-amber-400/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{currentReel.rating || 4.9}</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold font-heading text-white">{currentReel.title}</h2>
              <p className="text-xs text-white/70 leading-relaxed">
                {currentReel.description || 'Prepared fresh with premium ingredients by master culinary chefs.'}
              </p>
            </div>

            {/* Multi-Dish Tag Chips Section */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white/60">DISHES IN THIS VIDEO</h5>
              <div className="flex flex-wrap gap-2">
                {(currentReel.taggedDishes && currentReel.taggedDishes.length > 0 ? currentReel.taggedDishes : [
                  { dishId: currentReel.dishId || 'd1', name: currentReel.title || 'Special Dish', price: currentReel.dishPrice || 380, dietType: currentReel.diet === 'vegetarian' ? 'VEG' : 'NON_VEG', category: currentReel.category || 'MAIN_FOOD' }
                ]).map((dish, idx) => {
                  const dietType = dish.dietType || (currentReel.diet === 'vegetarian' ? 'VEG' : 'NON_VEG');
                  const isVeg = dietType === 'VEG' || dietType === 'VEGAN';
                  const isNonVeg = dietType === 'NON_VEG';
                  const isEgg = dietType === 'EGG';

                  return (
                    <div key={dish.dishId || idx} className="bg-white/10 hover:bg-white/20 transition-all rounded-xl p-3 border border-white/15 flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2.5">
                        <span className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] font-bold ${
                          isVeg ? 'border-emerald-500 text-emerald-400 bg-emerald-950/50' :
                          isNonVeg ? 'border-red-500 text-red-400 bg-red-950/50' :
                          isEgg ? 'border-amber-500 text-amber-400 bg-amber-950/50' : 'border-gray-400 text-gray-300'
                        }`}>
                          {isVeg ? '●' : isNonVeg ? '▲' : isEgg ? 'E' : '?'}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white leading-snug">{dish.name}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-white/70">
                            <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono uppercase">{dish.category || 'FOOD'}</span>
                            {dish.discountPercent > 0 && (
                              <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-500/40">
                                {dish.discountPercent}% OFF ({dish.promoCode || 'OFFER'})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-black text-brand-coral">₹{dish.price}</span>
                        <button
                          onClick={() => {
                            addToCart({
                              dishId: dish.dishId || currentReel.dishId,
                              id: currentReel.id,
                              title: dish.name,
                              name: dish.name,
                              dishPrice: dish.price,
                              price: dish.price,
                              restaurantName: currentReel.restaurantName,
                              image: currentReel.posterUrl
                            });
                            showToast(`Added ${dish.name} to Cart! 🛒`);
                          }}
                          className="px-3 py-1.5 bg-brand-coral hover:bg-brand-coral-hover text-white text-xs font-bold rounded-lg transition-all"
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Stats Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <button
                onClick={() => toggleLikeReel(currentReel.id)}
                className="flex flex-col items-center justify-center space-y-1 hover:text-red-400 transition-colors"
              >
                <Heart className={`w-6 h-6 ${currentReel.isLiked ? 'text-red-500 fill-current' : 'text-white/80'}`} />
                <span className="text-xs font-bold text-white/90">{currentReel.likes} Likes</span>
              </button>

              <button
                onClick={() => toggleSaveReel(currentReel.id)}
                className="flex flex-col items-center justify-center space-y-1 hover:text-brand-teal transition-colors"
              >
                <Bookmark className={`w-6 h-6 ${currentReel.isSaved ? 'text-brand-teal fill-current' : 'text-white/80'}`} />
                <span className="text-xs font-bold text-white/90">{currentReel.saves} Saved</span>
              </button>

              <div className="flex flex-col items-center justify-center space-y-1">
                <Share2 className="w-6 h-6 text-white/80" />
                <span className="text-xs font-bold text-white/90">Share</span>
              </div>
            </div>
          </div>

          {/* Checkout / Order Action Bar */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 font-medium">Primary Dish Price</p>
                <p className="text-2xl font-extrabold text-brand-coral">₹{currentReel.dishPrice}</p>
              </div>

              <button
                onClick={handleOrderClick}
                className="px-6 py-3.5 bg-brand-coral text-white font-extrabold text-sm rounded-2xl shadow-coral hover:bg-brand-coral-hover transition-all flex items-center space-x-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>ORDER DISH NOW →</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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

export default NommlyPage;
