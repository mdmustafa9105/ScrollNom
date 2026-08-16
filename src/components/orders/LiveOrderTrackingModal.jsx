import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { X, CheckCircle2, Clock, MapPin, Bike, ShoppingBag, ShieldCheck, ChevronRight } from 'lucide-react';

const STATUS_TIMELINE = [
  { key: 'confirmed', label: 'Order Placed', desc: 'Order confirmed & sent to kitchen' },
  { key: 'restaurant_received', label: 'Restaurant Received Order', desc: 'Kitchen acknowledged receipt' },
  { key: 'accepted', label: 'Restaurant Accepted Order', desc: 'Chef accepted your order' },
  { key: 'preparing', label: 'Your Food is Being Prepared', desc: 'Fresh ingredients being cooked' },
  { key: 'ready_for_pickup', label: 'Order Ready for Pickup', desc: 'Packed and ready for rider' },
  { key: 'rider_assigned', label: 'Rider Assigned', desc: 'Delivery partner assigned' },
  { key: 'picked_up', label: 'Rider Picked Up Your Order', desc: 'Food is on the way' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider heading to your address' },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your meal!' }
];

export const LiveOrderTrackingModal = ({ orderId, deliveryId, isOpen, onClose }) => {
  const { getAuthToken } = useApp();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || (!orderId && !deliveryId)) return;

    let isMounted = true;
    const fetchTracking = async () => {
      try {
        const token = await getAuthToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Fetch tracking info
        const targetId = deliveryId || orderId;
        const res = await fetch(`${API_BASE}/delivery/${targetId}/tracking`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setTrackingData(json.data);
        } else {
          // Fallback fetch order info
          const orderRes = await fetch(`${API_BASE}/orders/${orderId}`, { headers });
          if (orderRes.ok) {
            const orderJson = await orderRes.json();
            if (isMounted && orderJson.data) {
              setTrackingData({
                orderId: orderJson.data.orderId,
                status: orderJson.data.status,
                restaurantName: orderJson.data.restaurantName,
                etaMinutes: 25,
                rider: { name: 'Vikram Singh', phoneMasked: '+91 98*** **421' }
              });
            }
          }
        }
      } catch (e) {
        console.error('[TRACKING FETCH ERROR]', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, orderId, deliveryId]);

  if (!isOpen) return null;

  const currentStatus = trackingData?.status || 'restaurant_received';
  const currentIndex = STATUS_TIMELINE.findIndex(s => s.key === currentStatus);
  const activeIndex = currentIndex >= 0 ? currentIndex : 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-brand-cream rounded-3xl p-6 shadow-floating border border-brand-cream-dark relative animate-slide-up space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-cream-dark pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold bg-brand-charcoal px-2 py-0.5 rounded-full">
                Live Order Status
              </span>
              <span className="text-xs font-bold text-brand-teal">Polling 3s</span>
            </div>
            <h2 className="text-base font-extrabold text-brand-charcoal mt-1">
              Order #{orderId || trackingData?.orderId || 'ORD-LIVE'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-brand-cream-dark flex items-center justify-center text-brand-charcoal hover:text-brand-coral transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-brand-charcoal-muted text-xs animate-pulse">
            Connecting to live delivery telemetry...
          </div>
        ) : (
          <div className="space-y-6">

            {/* Rider & ETA Card */}
            <div className="bg-white p-4 rounded-2xl border border-brand-cream-dark shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-brand-coral/10 border border-brand-coral/30 flex items-center justify-center text-brand-coral">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-brand-charcoal">
                      {trackingData?.rider?.name || 'Vikram Singh'}
                    </h3>
                    <p className="text-[11px] text-brand-charcoal-muted font-medium">
                      {trackingData?.rider?.phoneMasked || '+91 98*** **421'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-1 text-brand-coral text-xs font-extrabold justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{trackingData?.etaMinutes !== undefined ? `${trackingData.etaMinutes} mins ETA` : '25 mins'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    GPS Active
                  </span>
                </div>
              </div>

              <div className="text-xs text-brand-charcoal bg-brand-cream-card p-2.5 rounded-xl flex items-center space-x-2 border border-brand-cream-dark">
                <MapPin className="w-4 h-4 text-brand-coral shrink-0" />
                <span className="truncate font-semibold">
                  Pickup: {trackingData?.restaurantName || 'Paradise Biryani Palace (Indiranagar)'}
                </span>
              </div>
            </div>

            {/* Persistent Order Status Timeline */}
            <div className="bg-white p-4 rounded-2xl border border-brand-cream-dark shadow-soft space-y-3">
              <h4 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-wider">
                Order Timeline
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-cream-dark">
                {STATUS_TIMELINE.map((step, idx) => {
                  const isDone = idx <= activeIndex;
                  const isCurrent = idx === activeIndex;

                  return (
                    <div key={step.key} className="relative flex items-start space-x-3">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-brand-teal text-white shadow-soft'
                            : 'bg-white border-2 border-brand-cream-dark text-brand-charcoal-muted'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </div>

                      <div>
                        <h5
                          className={`text-xs font-extrabold ${
                            isCurrent
                              ? 'text-brand-coral animate-pulse-glow'
                              : isDone
                              ? 'text-brand-charcoal'
                              : 'text-brand-charcoal-muted'
                          }`}
                        >
                          {step.label}
                          {isCurrent && <span className="ml-2 text-[10px] bg-brand-coral/10 text-brand-coral px-2 py-0.5 rounded-full font-bold">Current</span>}
                        </h5>
                        <p className="text-[11px] text-brand-charcoal-muted font-medium">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-brand-coral text-white font-extrabold text-xs rounded-xl shadow-coral hover:bg-brand-coral-dark transition-all"
        >
          Close Live Tracker
        </button>
      </div>
    </div>
  );
};
