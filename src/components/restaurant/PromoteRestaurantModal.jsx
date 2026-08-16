import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { Sparkles, X, Handshake, CheckCircle2, MessageSquare } from 'lucide-react';

export const PromoteRestaurantModal = ({ restaurant, isOpen, onClose }) => {
  const { getAuthToken, showToast, user } = useApp();
  const [selectedDish, setSelectedDish] = useState('Hyderabadi Dum Biryani');
  const [promotionType, setPromotionType] = useState('Nommly Reel'); // 'Nommly Reel' | 'Food Review' | 'Dish Feature'
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !restaurant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please sign in as a creator to submit promotion request!', 'warning');
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${API_BASE}/collaborations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantId: restaurant.id || 'r1',
          restaurantName: restaurant.name || 'Paradise Biryani Palace',
          dishId: 'd1',
          dishTitle: selectedDish,
          promotionType,
          message: message || `Hey ${restaurant.name}, I would love to film a ${promotionType} for ${selectedDish}!`
        })
      });

      if (res.ok) {
        showToast(`Submitted Promotion Request to ${restaurant.name}! 🚀`, 'success');
        onClose();
      } else {
        const json = await res.json();
        showToast(json.error?.message || 'Failed to submit promotion request.', 'warning');
      }
    } catch (err) {
      console.error('[PROMOTE ERROR]', err);
      showToast('Error submitting promotion request.', 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-brand-cream rounded-3xl p-6 shadow-floating border border-brand-cream-dark relative animate-slide-up space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-cream-dark pb-3">
          <div className="flex items-center space-x-2">
            <Handshake className="w-5 h-5 text-brand-coral" />
            <h3 className="text-base font-extrabold text-brand-charcoal">Promote This Restaurant</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-charcoal hover:text-brand-coral">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Target Restaurant Banner */}
          <div className="bg-white p-3.5 rounded-2xl border border-brand-cream-dark flex items-center space-x-3">
            <img src={restaurant.image} alt={restaurant.name} className="w-12 h-12 rounded-xl object-cover border border-brand-cream-dark" />
            <div>
              <h4 className="text-xs font-extrabold text-brand-charcoal">{restaurant.name}</h4>
              <p className="text-[11px] text-brand-coral font-bold">{restaurant.location || 'Indiranagar, Bengaluru'}</p>
            </div>
          </div>

          {/* Select Dish */}
          <div>
            <label className="block text-xs font-bold text-brand-charcoal-muted mb-1">Target Dish / Special</label>
            <select
              value={selectedDish}
              onChange={(e) => setSelectedDish(e.target.value)}
              className="w-full p-3 bg-white border border-brand-cream-dark rounded-xl text-xs font-bold text-brand-charcoal focus:outline-none"
            >
              <option value="Hyderabadi Dum Biryani">Hyderabadi Dum Biryani (₹380)</option>
              <option value="Smashed Truffle Double Burger">Smashed Truffle Double Burger (₹320)</option>
              <option value="Crispy Benne Dosa">Crispy Benne Dosa (₹140)</option>
              <option value="Artisanal Cold Coffee">Artisanal Cold Coffee (₹220)</option>
            </select>
          </div>

          {/* Select Promotion Type */}
          <div>
            <label className="block text-xs font-bold text-brand-charcoal-muted mb-1">Promotion Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['Nommly Reel', 'Food Review', 'Dish Feature'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setPromotionType(type)}
                  className={`p-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                    promotionType === type
                      ? 'bg-brand-coral text-white border-brand-coral shadow-coral'
                      : 'bg-white text-brand-charcoal border-brand-cream-dark hover:border-brand-teal'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-xs font-bold text-brand-charcoal-muted mb-1">Creator Collaboration Note</label>
            <textarea
              rows={2}
              placeholder="e.g. I have 1.2M foodie followers in Bengaluru! Would love to review this dish."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 bg-white border border-brand-cream-dark rounded-xl text-xs font-semibold text-brand-charcoal placeholder-brand-charcoal-muted focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-brand-coral text-white font-extrabold text-xs rounded-xl shadow-coral hover:bg-brand-coral-dark transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? 'Submitting Request...' : 'Submit Promotion Request'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
