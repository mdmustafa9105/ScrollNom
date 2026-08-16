import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Compass, ShoppingBag, User, Play } from 'lucide-react';
import { ScrollNomLogoIcon } from '../brand/IconSet';

export const BottomNav = () => {
  const { activeTab, setActiveTab, cartItems, foodOnFriend, user } = useApp();

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Hide bottom nav on Nommly for full screen immersive video mode if needed, OR show minimal chrome
  const isNommlyActive = activeTab === 'nommly';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
      isNommlyActive ? 'bg-black/60 backdrop-blur-xl border-t border-white/10' : 'bg-brand-cream/95 backdrop-blur-md border-t border-brand-cream-dark'
    }`}>
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between relative pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        
        {/* Home Button */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'home'
              ? isNommlyActive ? 'text-brand-coral font-bold' : 'text-brand-coral font-bold scale-105'
              : isNommlyActive ? 'text-gray-400 hover:text-white' : 'text-brand-charcoal-muted hover:text-brand-charcoal'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Explore Button */}
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'explore'
              ? isNommlyActive ? 'text-brand-coral font-bold' : 'text-brand-coral font-bold scale-105'
              : isNommlyActive ? 'text-gray-400 hover:text-white' : 'text-brand-charcoal-muted hover:text-brand-charcoal'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Explore</span>
        </button>

        {/* CENTER ITEM: NOMMLY MASCOT BUTTON */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => setActiveTab('nommly')}
            className={`relative flex items-center justify-center rounded-full p-2.5 shadow-coral transition-all transform active:scale-95 ${
              isNommlyActive
                ? 'bg-gradient-to-r from-brand-coral to-brand-gold ring-4 ring-brand-coral/40 scale-110'
                : 'bg-brand-coral hover:bg-brand-coral-dark hover:scale-105'
            }`}
            aria-label="Nommly Food Reels"
          >
            {/* Play icon overlay on mascot */}
            <div className="relative">
              <ScrollNomLogoIcon className="w-9 h-9 text-white" />
              <div className="absolute -top-1 -right-1 bg-brand-gold text-brand-charcoal font-black text-[9px] px-1 rounded-full border border-white">
                ▶
              </div>
            </div>
          </button>
        </div>

        {/* Cart Button */}
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all ${
            activeTab === 'cart'
              ? isNommlyActive ? 'text-brand-coral font-bold' : 'text-brand-coral font-bold scale-105'
              : isNommlyActive ? 'text-gray-400 hover:text-white' : 'text-brand-charcoal-muted hover:text-brand-charcoal'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-brand-coral text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-white shadow-sm">
                {totalCartCount}
              </span>
            )}
            {foodOnFriend.enabled && (
              <span className="absolute -bottom-1 -left-2 bg-brand-teal text-white text-[8px] font-bold px-1 rounded-full">
                SPLIT
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Cart</span>
        </button>

        {/* Profile / Creator Button */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeTab === 'profile'
              ? isNommlyActive ? 'text-brand-coral font-bold' : 'text-brand-coral font-bold scale-105'
              : isNommlyActive ? 'text-gray-400 hover:text-white' : 'text-brand-charcoal-muted hover:text-brand-charcoal'
          }`}
        >
          <div className="relative">
            <User className="w-5 h-5 mb-0.5" />
            {user.isCreator && (
              <span className="absolute -top-1.5 -right-3 bg-brand-gold text-brand-charcoal font-black text-[8px] px-1 py-0.2 rounded-full border border-white">
                STUDIO
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">
            {user.isCreator ? 'Studio' : 'Profile'}
          </span>
        </button>
      </div>
    </div>
  );
};
