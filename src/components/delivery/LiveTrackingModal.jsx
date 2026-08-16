import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { X, Navigation, Bike, Clock, Phone, MapPin, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export const LiveTrackingModal = ({ deliveryId, isOpen, onClose }) => {
  const { getAuthToken, showToast } = useApp();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    if (!isOpen || !deliveryId) return;

    let isMounted = true;
    setLoading(true);

    // 1. Initial REST fetch for tracking state
    const fetchTracking = async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE}/delivery/${deliveryId}/tracking`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setTrackingData(json.data);
        }
      } catch (e) {
        console.error('[TRACKING FETCH ERROR]', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTracking();

    // 2. Open Real-time SSE Stream Channel
    const eventSource = new EventSource(`${API_BASE}/delivery/${deliveryId}/stream`);

    eventSource.onopen = () => {
      if (isMounted) setStreamActive(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CONNECTED') return;

        if (isMounted) {
          setTrackingData(prev => ({
            ...prev,
            status: data.status,
            etaMinutes: data.etaMinutes,
            rider: {
              ...prev?.rider,
              ...data.rider,
              location: data.rider?.location || prev?.rider?.location
            }
          }));

          if (data.status === 'delivered') {
            showToast('Your order has been delivered! Enjoy your meal 🎉', 'success');
          }
        }
      } catch (err) {
        console.error('[SSE DECODE ERROR]', err);
      }
    };

    eventSource.onerror = (err) => {
      if (isMounted) setStreamActive(false);
      eventSource.close();
    };

    return () => {
      isMounted = false;
      eventSource.close();
    };
  }, [isOpen, deliveryId]);

  if (!isOpen) return null;

  const statuses = [
    { key: 'restaurant_received', label: 'Received' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready_for_pickup', label: 'Packed' },
    { key: 'rider_assigned', label: 'Assigned' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const currentStatusIndex = statuses.findIndex(s => s.key === trackingData?.status);

  // Map coordinate interpolation ratio for visual canvas marker
  const pLat = trackingData?.pickupLocation?.latitude || 17.4435;
  const pLng = trackingData?.pickupLocation?.longitude || 78.4891;
  const dLat = trackingData?.deliveryLocation?.latitude || 17.4375;
  const dLng = trackingData?.deliveryLocation?.longitude || 78.4482;
  const rLat = trackingData?.rider?.location?.latitude || pLat;
  const rLng = trackingData?.rider?.location?.longitude || pLng;

  // Calculate percentage along linear path between pickup and dropoff
  const totalDist = Math.hypot(dLat - pLat, dLng - pLng) || 0.001;
  const currDist = Math.hypot(rLat - pLat, rLng - pLng);
  const pathProgress = Math.min(100, Math.max(0, Math.round((currDist / totalDist) * 100)));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 lg:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-modal border border-warm-grey relative animate-scale-up max-h-[90vh] flex flex-col justify-between">
        
        {/* HEADER BAR */}
        <div className="bg-brand-charcoal text-white p-4 lg:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-coral/20 border border-brand-coral/40 flex items-center justify-center text-brand-coral">
              <Bike className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base font-heading">Real-Time Delivery Tracking</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE SSE</span>
                </span>
              </div>
              <p className="text-xs text-white/70">Order #{trackingData?.orderId || deliveryId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY SCROLL AREA */}
        <div className="p-5 lg:p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 text-center text-charcoal-muted text-sm animate-pulse space-y-2">
              <RefreshCw className="w-8 h-8 mx-auto text-brand-coral animate-spin" />
              <p>Connecting to ScrollNom Live Delivery Engine...</p>
            </div>
          ) : trackingData ? (
            <>
              {/* ETA & STATUS BANNER */}
              <div className="bg-gradient-to-r from-brand-coral via-brand-coral-hover to-brand-teal p-4 lg:p-5 rounded-2xl text-white shadow-soft flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-white/80">
                    Estimated Arrival Time
                  </span>
                  <h2 className="text-3xl font-extrabold font-heading mt-0.5">
                    {trackingData.status === 'delivered' ? 'Delivered 🎉' : `${trackingData.etaMinutes || 18} Mins`}
                  </h2>
                  <p className="text-xs font-semibold text-white/90 capitalize mt-1">
                    Status: {trackingData.status.replace(/_/g, ' ')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold border border-white/20 inline-block">
                    ScrollNom Dev Adapter
                  </span>
                </div>
              </div>

              {/* INTERACTIVE LIVE DELIVERY MAP CANVAS */}
              <div className="relative h-48 lg:h-56 bg-cream-bg rounded-2xl border border-warm-grey overflow-hidden shadow-inner p-4 flex flex-col justify-between">
                {/* Simulated Map Background Grid Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

                {/* Map Pins & Path Line */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  {/* Top: Restaurant Pin */}
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-brand-coral text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                      🏠
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-bold text-charcoal border border-warm-grey shadow-sm">
                      {trackingData.pickupLocation?.name || 'Paradise Biryani Palace'}
                    </div>
                  </div>

                  {/* Mid: Route Progress Bar & Rider Marker */}
                  <div className="relative my-2">
                    <div className="h-2 bg-gray-200 rounded-full w-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-coral to-brand-teal transition-all duration-700"
                        style={{ width: `${pathProgress}%` }}
                      />
                    </div>
                    {/* Animated Rider Marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center shadow-lg border-2 border-white transition-all duration-700"
                      style={{ left: `${pathProgress}%` }}
                      title={`Rider lat: ${rLat}, lng: ${rLng}`}
                    >
                      <Bike className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Bottom: Customer Destination Pin */}
                  <div className="flex items-center justify-end space-x-2">
                    <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-bold text-charcoal border border-warm-grey shadow-sm">
                      {trackingData.deliveryLocation?.address || 'Banjara Hills, Hyderabad'}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                      📍
                    </div>
                  </div>
                </div>

                {/* Coordinate Telemetry Bar */}
                <div className="relative z-10 flex items-center justify-between text-[10px] text-charcoal-muted bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-warm-grey/60 mt-2">
                  <span>Rider GPS: {rLat}, {rLng}</span>
                  <span>Progress: {pathProgress}%</span>
                </div>
              </div>

              {/* RIDER INFORMATION CARD */}
              <div className="bg-cream-bg p-4 rounded-2xl border border-warm-grey flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-brand-coral/10 border border-brand-coral/30 flex items-center justify-center text-brand-coral font-bold text-lg">
                    🚴
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-charcoal">{trackingData.rider?.name || 'Vikram Singh'}</h4>
                    <p className="text-xs text-charcoal-muted font-medium">Delivery Partner • ScrollNom</p>
                    <p className="text-[11px] text-brand-teal font-semibold">{trackingData.rider?.phoneMasked || '+91 98*** **421'}</p>
                  </div>
                </div>

                <a
                  href={`tel:${trackingData.rider?.phoneMasked}`}
                  className="px-4 py-2 bg-white text-brand-teal font-bold text-xs rounded-xl border border-warm-grey hover:bg-brand-teal hover:text-white transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Rider</span>
                </a>
              </div>

              {/* PROGRESS TIMELINE */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">Order Progress Lifecycle</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {statuses.map((st, idx) => {
                    const isDone = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;
                    return (
                      <div
                        key={st.key}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-brand-coral text-white border-brand-coral shadow-coral font-bold'
                            : isDone
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                            : 'bg-cream-bg text-charcoal-muted border-warm-grey/60'
                        }`}
                      >
                        <p className="text-xs">{st.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PROVIDER ADAPTERS STATUS FOOTER */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-charcoal-muted flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-charcoal">Adapters:</span>
                  <span className="text-emerald-700 font-semibold">ScrollNom: ACTIVE</span>
                  <span className="text-gray-500 font-medium">Zomato: NOT_CONNECTED</span>
                  <span className="text-gray-500 font-medium">Swiggy: NOT_CONNECTED</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-charcoal-muted text-sm">
              Delivery tracking data unavailable.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
