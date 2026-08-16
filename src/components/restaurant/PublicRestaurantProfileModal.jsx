import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Star, MapPin, Clock, Sparkles, Handshake, CheckCircle2, Utensils } from 'lucide-react';
import { PromoteRestaurantModal } from './PromoteRestaurantModal';

export const PublicRestaurantProfileModal = ({ restaurant, isOpen, onClose }) => {
  const { user } = useApp();
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [dietFilter, setDietFilter] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG'
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    if (!restaurant?.id) return;

    // Fetch canonical menu items from database
    fetch(`${API_BASE}/restaurants/${restaurant.id}/menu`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.menu) {
          setMenuItems(json.data.menu);
        } else {
          // Default fallback menu graph
          setMenuItems([
            { id: 'd1_1', name: 'Hyderabadi Dum Biryani', category: 'MAIN_FOOD', diet_type: 'NON_VEG', price: 380, discount_percent: 50, promo_code: 'SCROLL50' },
            { id: 'd1_2', name: 'Special Mutton Biryani', category: 'MAIN_FOOD', diet_type: 'NON_VEG', price: 450, discount_percent: 50, promo_code: 'SCROLL50' },
            { id: 'd1_3', name: 'Royal Paneer Biryani', category: 'MAIN_FOOD', diet_type: 'VEG', price: 290 },
            { id: 'd1_4', name: 'Chicken 65', category: 'SNACK', diet_type: 'NON_VEG', price: 260 },
            { id: 'd1_5', name: 'Chilled Cold Coffee', category: 'BEVERAGE', diet_type: 'VEG', price: 150 },
            { id: 'd1_6', name: 'Butter Garlic Naan', category: 'MAIN_FOOD', diet_type: 'VEG', price: 60 }
          ]);
        }
      })
      .catch(() => {
        setMenuItems([
          { id: 'd1_1', name: 'Hyderabadi Dum Biryani', category: 'MAIN_FOOD', diet_type: 'NON_VEG', price: 380, discount_percent: 50, promo_code: 'SCROLL50' },
          { id: 'd1_3', name: 'Royal Paneer Biryani', category: 'MAIN_FOOD', diet_type: 'VEG', price: 290 },
          { id: 'd1_5', name: 'Chilled Cold Coffee', category: 'BEVERAGE', diet_type: 'VEG', price: 150 }
        ]);
      });
  }, [restaurant?.id]);

  if (!isOpen || !restaurant) return null;

  const filteredMenuItems = menuItems.filter(item => {
    if (dietFilter === 'VEG') return item.diet_type === 'VEG' || item.diet_type === 'VEGAN';
    if (dietFilter === 'NON_VEG') return item.diet_type === 'NON_VEG';
    return true;
  });


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

        {/* Canonical Menu Specials with Real Diet Filtering */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-wider flex items-center space-x-1.5">
              <Utensils className="w-4 h-4 text-brand-coral" />
              <span>Canonical Menu Graph</span>
            </h4>

            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-brand-cream-dark">
              <button
                onClick={() => setDietFilter('ALL')}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                  dietFilter === 'ALL' ? 'bg-brand-charcoal text-white shadow-xs' : 'text-brand-charcoal-muted hover:text-brand-charcoal'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setDietFilter('VEG')}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all flex items-center space-x-1 ${
                  dietFilter === 'VEG' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span>🟢 VEG</span>
              </button>
              <button
                onClick={() => setDietFilter('NON_VEG')}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all flex items-center space-x-1 ${
                  dietFilter === 'NON_VEG' ? 'bg-red-600 text-white shadow-xs' : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <span>🔴 NON-VEG</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredMenuItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-brand-charcoal-muted font-medium bg-white rounded-2xl border border-brand-cream-dark">
                No {dietFilter === 'VEG' ? 'Vegetarian' : 'Non-Vegetarian'} dishes available in this menu.
              </div>
            ) : (
              filteredMenuItems.map(item => (
                <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-brand-cream-dark flex items-center justify-between hover:border-brand-coral/30 transition-all">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center text-[9px] font-bold ${
                        item.diet_type === 'VEG' || item.diet_type === 'VEGAN'
                          ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                          : 'border-red-600 text-red-600 bg-red-50'
                      }`}>
                        {item.diet_type === 'VEG' || item.diet_type === 'VEGAN' ? '●' : '▲'}
                      </span>
                      <h5 className="text-xs font-extrabold text-brand-charcoal">{item.name}</h5>
                      <span className="text-[9px] font-mono text-brand-charcoal-muted uppercase bg-brand-cream-card px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                      {item.discount_percent > 0 && (
                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.discount_percent}% OFF
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-brand-charcoal-muted pl-5">{item.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-black text-brand-coral shrink-0 pl-3">₹{item.price}</span>
                </div>
              ))
            )}
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
