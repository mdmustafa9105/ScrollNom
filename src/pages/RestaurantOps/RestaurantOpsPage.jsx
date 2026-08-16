import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';
import { Store, CheckCircle2, Clock, Package, RefreshCw, Sparkles, ChefHat, Handshake, Check, X } from 'lucide-react';

export const RestaurantOpsPage = () => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Creator Requests State
  const [creatorRequests, setCreatorRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'collaborations'

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/restaurant/orders`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('[RESTAURANT OPS FETCH ERROR]', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchCreatorRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_BASE}/restaurant/collaborations?restaurantId=r1`);
      if (res.ok) {
        const json = await res.json();
        setCreatorRequests(json.data || []);
      }
    } catch (err) {
      console.error('[CREATOR REQUESTS FETCH ERROR]', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCreatorRequests();
    const interval = setInterval(() => {
      fetchOrders();
      fetchCreatorRequests();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (deliveryId, newStatus) => {
    setActionLoading(deliveryId);
    try {
      const res = await fetch(`${API_BASE}/delivery/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch (err) {
      console.error('[STATUS UPDATE ERROR]', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCollabStatus = async (collabId, status) => {
    try {
      const res = await fetch(`${API_BASE}/restaurant/collaborations/${collabId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchCreatorRequests();
      }
    } catch (err) {
      console.error('[COLLAB UPDATE ERROR]', err);
    }
  };

  return (
    <div className="min-h-screen bg-brand-charcoal text-white p-4 lg:p-8 space-y-6 animate-fade-in select-none">
      
      {/* RESTAURANT APP HEADER */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-coral/20 border border-brand-coral/40 flex items-center justify-center text-brand-coral">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold font-heading">Paradise Biryani Palace</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                LAPTOP 2 • RESTAURANT APP
              </span>
            </div>
            <p className="text-xs text-white/70">Real-Time Kitchen Display System & Creator Collaborations Hub</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => { fetchOrders(); fetchCreatorRequests(); }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loadingOrders || loadingRequests) ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="max-w-6xl mx-auto flex bg-white/5 p-1 rounded-2xl border border-white/10">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'orders' ? 'bg-brand-coral text-white shadow-coral' : 'text-white/60 hover:text-white'
          }`}
        >
          Kitchen Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('collaborations')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'collaborations' ? 'bg-brand-coral text-white shadow-coral' : 'text-white/60 hover:text-white'
          }`}
        >
          Creator Requests ({creatorRequests.filter(c => c.status === 'pending').length} Pending)
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-white/70">
            <h2 className="text-lg font-bold font-heading text-white">Active Kitchen Orders ({orders.length})</h2>
            <span>Polling interval: 3s</span>
          </div>

          {loadingOrders && orders.length === 0 ? (
            <div className="p-12 text-center text-white/60 text-sm bg-white/5 rounded-3xl border border-white/10 animate-pulse">
              Connecting to ScrollNom Order Stream...
            </div>
          ) : orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((ord) => (
                <div
                  key={ord.deliveryId}
                  className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] text-brand-gold font-bold uppercase tracking-wider">Order ID</span>
                      <h3 className="text-base font-extrabold text-white">{ord.orderId}</h3>
                    </div>
                    <span className="bg-brand-coral/20 text-brand-coral text-xs font-extrabold px-3 py-1 rounded-full border border-brand-coral/30">
                      {ord.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Ordered Dishes</span>
                    {ord.items && ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-bold text-white bg-white/5 p-2.5 rounded-xl">
                        <span>{it.quantity || 1}x {it.title || it.name}</span>
                        <span className="text-brand-coral">₹{(it.price || 380) * (it.quantity || 1)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <span className="text-white/70">Total Amount: <strong className="text-white font-extrabold">₹{ord.amount}</strong></span>
                    <span className="text-white/70">Rider: <strong className="text-emerald-400 font-extrabold">{ord.riderName || 'Vikram Singh'}</strong></span>
                  </div>

                  {/* KITCHEN ACTION STATE MACHINE */}
                  <div className="pt-2 space-y-2">
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Kitchen Action State Machine</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(ord.deliveryId, 'accepted')}
                        disabled={ord.status !== 'restaurant_received'}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          ord.status === 'accepted' || ord.status === 'preparing' || ord.status === 'ready_for_pickup'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : ord.status === 'restaurant_received'
                            ? 'bg-brand-teal text-white hover:bg-brand-teal-light'
                            : 'bg-white/5 text-white/40 cursor-not-allowed'
                        }`}
                      >
                        1. Accept
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(ord.deliveryId, 'preparing')}
                        disabled={ord.status !== 'accepted'}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          ord.status === 'preparing' || ord.status === 'ready_for_pickup'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : ord.status === 'accepted'
                            ? 'bg-brand-coral text-white hover:bg-brand-coral-dark'
                            : 'bg-white/5 text-white/40 cursor-not-allowed'
                        }`}
                      >
                        2. Preparing 🍳
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(ord.deliveryId, 'ready_for_pickup')}
                        disabled={ord.status !== 'preparing'}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          ord.status === 'ready_for_pickup'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : ord.status === 'preparing'
                            ? 'bg-brand-gold text-brand-charcoal hover:bg-yellow-400'
                            : 'bg-white/5 text-white/40 cursor-not-allowed'
                        }`}
                      >
                        3. Ready 📦
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-white/50 space-y-3 bg-white/5 rounded-3xl border border-white/10">
              <ChefHat className="w-12 h-12 text-brand-coral mx-auto" />
              <h3 className="text-base font-bold text-white">No incoming orders</h3>
              <p className="text-xs">Place a customer order on Laptop 1 to trigger real kitchen receipt here!</p>
            </div>
          )}
        </div>
      )}

      {/* CREATOR COLLABORATIONS TAB (PART 14 & PART 23) */}
      {activeTab === 'collaborations' && (
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-white/70">
            <h2 className="text-lg font-bold font-heading text-white">Creator Collaboration Requests ({creatorRequests.length})</h2>
            <span>Authorize server-side</span>
          </div>

          {loadingRequests && creatorRequests.length === 0 ? (
            <div className="p-12 text-center text-white/60 text-sm bg-white/5 rounded-3xl border border-white/10 animate-pulse">
              Fetching creator collaboration requests...
            </div>
          ) : creatorRequests.length === 0 ? (
            <div className="p-16 text-center text-white/50 space-y-3 bg-white/5 rounded-3xl border border-white/10">
              <Handshake className="w-12 h-12 text-brand-coral mx-auto" />
              <h3 className="text-base font-bold text-white">No Pending Creator Requests</h3>
              <p className="text-xs">When creators submit promotion requests on Laptop 1, they will appear here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creatorRequests.map((req) => (
                <div key={req.id} className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-3">
                      <img src={req.creator_avatar} alt={req.creator_name} className="w-10 h-10 rounded-full object-cover border border-white/20" />
                      <div>
                        <h3 className="text-sm font-extrabold text-white">{req.creator_name}</h3>
                        <p className="text-xs text-brand-teal font-bold">@{req.creator_username}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                      req.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      req.status === 'declined' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5 text-xs">
                    <p className="text-white/70">Target Dish: <strong className="text-white">{req.dish_title}</strong></p>
                    <p className="text-white/70">Promotion Type: <strong className="text-brand-gold">{req.promotion_type}</strong></p>
                    {req.message && (
                      <p className="text-white/90 italic mt-1">"{req.message}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  {req.status === 'pending' ? (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handleUpdateCollabStatus(req.id, 'accepted')}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Request</span>
                      </button>

                      <button
                        onClick={() => handleUpdateCollabStatus(req.id, 'declined')}
                        className="py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline Request</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-center py-1 text-white/60">
                      Request status: {req.status}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
