import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { ShoppingBag, Clock, CheckCircle2, RefreshCw, ChevronRight, ShieldCheck, MapPin } from 'lucide-react';
import { LiveOrderTrackingModal } from './LiveOrderTrackingModal';

const FRIENDLY_STATUS = {
  confirmed: 'Order Placed & Sent to Kitchen',
  restaurant_received: 'Restaurant received your order',
  accepted: 'Restaurant accepted your order',
  preparing: 'Your food is being prepared',
  ready_for_pickup: 'Your order is ready for pickup',
  rider_assigned: 'Rider assigned',
  picked_up: 'Rider picked up your order',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const OrderHistoryView = ({ onBack }) => {
  const { getAuthToken, addToCart, showToast, user, setActiveTab } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'completed' | 'cancelled'
  const [activeTracking, setActiveTracking] = useState(null); // { orderId, deliveryId }

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      let token = await getAuthToken();
      if (!token) {
        token = 'fb_token_userA::customer%40scrollnom.com';
      }

      const res = await fetch(`${API_BASE}/orders/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('[FETCH ORDER HISTORY ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const handleReorder = (orderItems) => {
    if (!orderItems || orderItems.length === 0) return;
    orderItems.forEach(item => {
      addToCart({
        id: item.dishId || item.id || `dish_${Date.now()}`,
        title: item.title || item.name,
        dishPrice: item.price,
        restaurantName: item.restaurantName || 'Paradise Biryani Palace',
        quantity: item.quantity || 1
      });
    });
    showToast('Items added back to your cart! 🛒', 'success');
    setActiveTab('cart');
  };

  const filteredOrders = orders.filter(o => {
    const isCompleted = o.status === 'delivered';
    const isCancelled = o.status === 'cancelled';
    const isActive = !isCompleted && !isCancelled;

    if (filterTab === 'active') return isActive;
    if (filterTab === 'completed') return isCompleted;
    if (filterTab === 'cancelled') return isCancelled;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Top Header */}
      <div className="bg-brand-cream-card p-5 rounded-3xl border border-brand-cream-dark shadow-soft flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-coral/10 border border-brand-coral/30 flex items-center justify-center text-brand-coral">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-brand-charcoal">My Past & Active Orders</h2>
            <p className="text-xs text-brand-charcoal-muted font-medium">Persistent SQLite order history scoped to @{user.handle || user.name}</p>
          </div>
        </div>

        <button
          onClick={fetchOrderHistory}
          className="p-2.5 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal-muted hover:text-brand-coral transition-colors flex items-center space-x-1 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-brand-cream-dark w-full overflow-x-auto">
        {[
          { id: 'all', label: `All Orders (${orders.length})` },
          { id: 'active', label: `Active (${orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})` },
          { id: 'completed', label: `Completed (${orders.filter(o => o.status === 'delivered').length})` },
          { id: 'cancelled', label: `Cancelled (${orders.filter(o => o.status === 'cancelled').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all shrink-0 text-center ${
              filterTab === tab.id
                ? 'bg-brand-coral text-white shadow-coral'
                : 'text-brand-charcoal-muted hover:text-brand-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      {loading ? (
        <div className="p-12 text-center text-brand-charcoal-muted text-xs bg-white rounded-3xl border border-brand-cream-dark animate-pulse">
          Loading your persistent order history...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center text-brand-charcoal-muted space-y-3 bg-white rounded-3xl border border-brand-cream-dark">
          <ShoppingBag className="w-12 h-12 text-brand-coral mx-auto" />
          <h3 className="text-sm font-extrabold text-brand-charcoal">No Orders Found</h3>
          <p className="text-xs">You haven't placed any orders matching this filter yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const isCompleted = ord.status === 'delivered';
            const isCancelled = ord.status === 'cancelled';
            const isActive = !isCompleted && !isCancelled;
            const statusLabel = FRIENDLY_STATUS[ord.status] || ord.status;

            return (
              <div
                key={ord.orderId}
                className="bg-white p-5 rounded-3xl border border-brand-cream-dark shadow-soft space-y-4 hover:border-brand-teal/40 transition-all"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-cream-dark pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-brand-coral">{ord.orderId}</span>
                      <span className="text-[11px] text-brand-charcoal-muted font-semibold">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-brand-charcoal mt-0.5">
                      {ord.restaurantName || 'Paradise Biryani Palace'}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span className={`inline-flex items-center space-x-1 text-xs font-extrabold px-3 py-1 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isCancelled
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-brand-coral/10 text-brand-coral border-brand-coral/30 animate-pulse-glow'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{statusLabel}</span>
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 bg-brand-cream-card p-3.5 rounded-2xl border border-brand-cream-dark/60">
                  <span className="text-[11px] font-extrabold uppercase text-brand-charcoal-muted tracking-wider">Ordered Items</span>
                  {ord.items && ord.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-bold text-brand-charcoal">
                      <span>{it.title || it.name} × {it.quantity || 1}</span>
                      <span className="text-brand-coral">₹{(it.price || 380) * (it.quantity || 1)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer summary & CTAs */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-brand-charcoal-muted font-bold block">Total Amount</span>
                    <span className="text-lg font-black text-brand-charcoal">₹{ord.amount}</span>
                    <span className="ml-2 text-[10px] text-emerald-600 font-extrabold uppercase">({ord.paymentStatus || 'PAID'})</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isActive && (
                      <button
                        onClick={() => setActiveTracking({ orderId: ord.orderId, deliveryId: ord.deliveryId })}
                        className="px-4 py-2.5 bg-brand-coral text-white font-extrabold text-xs rounded-xl shadow-coral hover:bg-brand-coral-dark transition-all flex items-center space-x-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Track Live Order</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleReorder(ord.items)}
                      className="px-4 py-2.5 bg-brand-cream text-brand-charcoal font-extrabold text-xs rounded-xl border border-brand-cream-dark hover:bg-brand-cream-dark transition-all"
                    >
                      Reorder
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Live Order Tracking Modal */}
      {activeTracking && (
        <LiveOrderTrackingModal
          orderId={activeTracking.orderId}
          deliveryId={activeTracking.deliveryId}
          isOpen={!!activeTracking}
          onClose={() => setActiveTracking(null)}
        />
      )}

    </div>
  );
};
