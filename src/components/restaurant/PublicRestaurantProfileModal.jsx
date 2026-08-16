import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Star, MapPin, Clock, Sparkles, Handshake, CheckCircle2, Utensils } from 'lucide-react';
import { PromoteRestaurantModal } from './PromoteRestaurantModal';

export const PublicRestaurantProfileModal = ({ restaurant, isOpen, onClose }) => {
  const { user } = useApp();
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  if (!isOpen || !restaurant) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-brand-cream rounded-3xl p-6 shadow-floating border border-brand-cream-dark relative animate-slide-up space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-brand-cream-dark">
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-brand-coral"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-brand-coral text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                {restaurant.badge || 'Verified Partner'}
              </span>
              <div className="flex items-center space-x-1 text-amber-400 font-bold text-xs bg-black/60 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-current" />
                <span>{restaurant.rating || 4.9}</span>
              </div>
            </div>
            <h2 className="text-lg font-extrabold font-heading drop-shadow-sm">{restaurant.name}</h2>
            <p className="text-xs text-white/90 font-medium flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-brand-coral" />
              <span>{restaurant.location || 'Indiranagar, Bengaluru'}</span>
            </p>
          </div>
        </div>

        {/* Public Details */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white p-3 rounded-2xl border border-brand-cream-dark">
            <span className="text-[10px] text-brand-charcoal-muted font-extrabold uppercase">Cuisine</span>
            <p className="text-xs font-bold text-brand-charcoal truncate">{restaurant.cuisine || 'South Indian • Biryani'}</p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-brand-cream-dark">
            <span className="text-[10px] text-brand-charcoal-muted font-extrabold uppercase">Price For Two</span>
            <p className="text-xs font-bold text-brand-coral">{restaurant.priceForTwo || '₹600'}</p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-brand-cream-dark">
            <span className="text-[10px] text-brand-charcoal-muted font-extrabold uppercase">Hours</span>
            <p className="text-xs font-bold text-emerald-600">Open • 11am-11pm</p>
          </div>
        </div>

        {/* CREATOR PROMOTE CTA BANNER (Visible only to authenticated Creators) */}
        {user.isCreator ? (
          <div className="bg-gradient-to-r from-brand-charcoal to-brand-charcoal/90 text-white p-5 rounded-2xl border border-brand-gold/30 shadow-soft flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-brand-gold text-xs font-black uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Creator Collaboration</span>
              </div>
              <h3 className="text-sm font-extrabold">Promote {restaurant.name}</h3>
              <p className="text-xs text-gray-300">Submit a promotion request for reels & food reviews</p>
            </div>

            <button
              onClick={() => setShowPromoteModal(true)}
              className="bg-brand-coral text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-coral hover:bg-brand-coral-dark flex items-center space-x-1.5 transition-all shrink-0 active:scale-95"
            >
              <Handshake className="w-4 h-4" />
              <span>Promote This Restaurant</span>
            </button>
          </div>
        ) : (
          <div className="bg-brand-cream-card p-3.5 rounded-2xl border border-brand-cream-dark text-xs text-brand-charcoal-muted font-medium text-center">
            Sign in as a Creator to collaborate with {restaurant.name}!
          </div>
        )}

        {/* Popular Public Dishes */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-wider flex items-center space-x-1.5">
            <Utensils className="w-4 h-4 text-brand-coral" />
            <span>Popular Menu Specials</span>
          </h4>

          <div className="space-y-2">
            <div className="bg-white p-3.5 rounded-2xl border border-brand-cream-dark flex items-center justify-between">
              <div>
                <h5 className="text-xs font-extrabold text-brand-charcoal">Hyderabadi Dum Biryani</h5>
                <p className="text-[11px] text-brand-charcoal-muted">Aromatic Seeraga Samba rice with tender mutton</p>
              </div>
              <span className="text-xs font-black text-brand-coral">₹380</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-brand-cream-dark flex items-center justify-between">
              <div>
                <h5 className="text-xs font-extrabold text-brand-charcoal">Crispy Benne Dosa</h5>
                <p className="text-[11px] text-brand-charcoal-muted">Butter roasted dosa with coconut & spicy chutney</p>
              </div>
              <span className="text-xs font-black text-brand-coral">₹140</span>
            </div>
          </div>
        </div>

        {/* Promote Modal */}
        {showPromoteModal && (
          <PromoteRestaurantModal
            restaurant={restaurant}
            isOpen={showPromoteModal}
            onClose={() => setShowPromoteModal(false)}
          />
        )}

      </div>
    </div>
  );
};
