import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { triggerRazorpayCheckout } from '../../services/razorpayService';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Users, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, XCircle, Bike, Navigation, MapPin } from 'lucide-react';
import { LiveTrackingModal } from '../../components/delivery/LiveTrackingModal';
import { LiveOrderTrackingModal } from '../../components/orders/LiveOrderTrackingModal';
import { MockRazorpayModal } from '../../components/payment/MockRazorpayModal';
import { DeliveryMapModal } from '../../components/delivery/DeliveryMapModal';
import 'leaflet/dist/leaflet.css';

export const CartPage = () => {
  const {
    user,
    cartItems,
    setCartItems,
    foodOnFriend,
    toggleFoodOnFriend,
    simulateFriendAction,
    setActiveTab,
    promptAuth,
    getAuthToken,
    showToast
  } = useApp();

  const [deliveryAddress, setDeliveryAddress] = useState({
    label: 'Home',
    street: 'Flat 402, Royal Palms, Jubilee Hills',
    area: 'Hyderabad, Telangana'
  });

  const [activeDeliveryId, setActiveDeliveryId] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const taxes = Math.round(subtotal * 0.05);
  const cartTotal = subtotal + deliveryFee + taxes;

  const updateQuantity = (id, delta) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    showToast('Item removed from cart', 'info');
  };

  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayCheckoutCtx, setRazorpayCheckoutCtx] = useState(null);

  const handleCheckout = async () => {
    if (!user.isLoggedIn) {
      promptAuth('Sign in to complete your checkout');
      return;
    }

    if (foodOnFriend.enabled && foodOnFriend.status !== 'accepted') {
      showToast('Please wait for friend contribution or pay full share to proceed!', 'warning');
      return;
    }

    try {
      const token = await getAuthToken();
      const orderItems = cartItems.map(item => ({
        id: item.id || item.dishId,
        dishId: item.dishId || item.id,
        title: item.title || item.name,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity || 1,
        restaurantName: item.restaurantName || 'ScrollNom Partner'
      }));

      const finalPayable = foodOnFriend.enabled ? foodOnFriend.organizerShare : cartTotal;

      await triggerRazorpayCheckout({
        amount: finalPayable,
        items: orderItems,
        user,
        authToken: token,
        onShowModal: ({ orderData, authHeaders, onPaymentDone }) => {
          setRazorpayCheckoutCtx({ orderData, authHeaders, onPaymentDone, orderItems, finalPayable });
          setShowRazorpayModal(true);
        },
        onSuccess: (paymentData) => {
          setShowRazorpayModal(false);
          showToast(`Order Confirmed! ID: ${paymentData.orderId}`, 'success');
          
          if (paymentData.deliveryId) {
            setActiveDeliveryId(paymentData.deliveryId);
          } else {
            setActiveDeliveryId(paymentData.orderId);
          }

          setConfirmedOrder({
            orderId: paymentData.orderId,
            deliveryId: paymentData.deliveryId,
            restaurantName: orderItems[0]?.restaurantName || 'ScrollNom Partner',
            items: orderItems,
            subtotal,
            deliveryFee,
            taxes,
            totalAmount: finalPayable,
            paymentStatus: 'PAID',
            status: 'confirmed'
          });

          setCartItems([]);
          if (paymentData.deliveryId) {
            setActiveDeliveryId(paymentData.deliveryId);
          }
        },
        onFailure: (err) => {
          setShowRazorpayModal(false);
          showToast(`Payment failed or cancelled: ${err.message || 'You can retry checkout.'}`, 'warning');
        }
      });
    } catch (err) {
      showToast('Checkout initialization error', 'error');
    }
  };

  return (
    <div className="pb-24 lg:pb-8 pt-4 px-4 lg:px-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('explore')}
            className="w-9 h-9 rounded-full bg-brand-cream-card border border-brand-cream-dark flex items-center justify-center text-brand-charcoal hover:bg-brand-cream-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold font-heading text-brand-charcoal">Your Food Cart</h1>
        </div>

        {cartItems.length > 0 && (
          <span className="text-xs font-bold text-brand-charcoal-muted bg-brand-cream-card px-3 py-1.5 rounded-full border border-brand-cream-dark">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {activeDeliveryId && (
        <div className="bg-gradient-to-r from-brand-coral to-brand-teal p-4 rounded-3xl text-white flex items-center justify-between shadow-soft">
          <div className="flex items-center space-x-3">
            <Bike className="w-6 h-6 animate-bounce" />
            <div>
              <h3 className="font-bold text-sm">Active Order Delivery in Progress</h3>
              <p className="text-xs text-white/80">Delivery ID: {activeDeliveryId}</p>
            </div>
          </div>
          <button
            onClick={() => setShowTrackingModal(true)}
            className="px-4 py-2 bg-white text-brand-charcoal font-bold text-xs rounded-xl shadow-button hover:bg-cream-dark transition-all flex items-center space-x-1"
          >
            <Navigation className="w-4 h-4 text-brand-coral" />
            <span>TRACK LIVE NOW 🛵</span>
          </button>
        </div>
      )}

      {confirmedOrder ? (
        <div className="bg-white rounded-3xl p-8 border border-brand-cream-dark shadow-soft space-y-6 animate-fade-in">
          <div className="flex items-center space-x-3 text-emerald-600">
            <CheckCircle2 className="w-8 h-8 fill-current text-emerald-500" />
            <div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                ORDER CONFIRMED 🎉
              </span>
              <h2 className="text-2xl font-bold font-heading text-brand-charcoal mt-1">
                Order ID: {confirmedOrder.orderId}
              </h2>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-brand-cream-card border border-brand-cream-dark space-y-3 text-sm">
            <div className="flex justify-between border-b border-brand-cream-dark pb-2">
              <span className="text-brand-charcoal-muted">Restaurant Partner</span>
              <span className="font-bold text-brand-charcoal">{confirmedOrder.restaurantName}</span>
            </div>
            
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-bold text-brand-charcoal-muted uppercase">Confirmed Dishes</p>
              {confirmedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between font-semibold text-brand-charcoal text-xs">
                  <span>{item.quantity}x {item.title || item.name}</span>
                  <span className="text-brand-coral font-bold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-cream-dark pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-brand-charcoal-muted">
                <span>Subtotal</span>
                <span>₹{confirmedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-brand-charcoal-muted">
                <span>Delivery Fee</span>
                <span>₹{confirmedOrder.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-brand-charcoal-muted">
                <span>Taxes & GST</span>
                <span>₹{confirmedOrder.taxes}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-brand-coral pt-1">
                <span>Total Amount Paid</span>
                <span>₹{confirmedOrder.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              id="track-order-live-btn"
              onClick={() => {
                const targetId = confirmedOrder?.deliveryId || activeDeliveryId || confirmedOrder?.orderId;
                if (targetId) {
                  setActiveDeliveryId(targetId);
                  setShowTrackingModal(true);
                } else {
                  showToast('Order tracking details loading...', 'info');
                }
              }}
              className="flex-1 py-3.5 bg-brand-coral text-white font-extrabold text-sm rounded-2xl shadow-coral hover:bg-brand-coral-hover transition-all flex items-center justify-center space-x-2 cursor-pointer z-10"
            >
              <Navigation className="w-5 h-5" />
              <span>TRACK ORDER LIVE 🛵</span>
            </button>

            <button
              onClick={() => {
                setConfirmedOrder(null);
                setActiveTab('profile');
              }}
              className="py-3.5 px-5 bg-brand-teal text-white font-extrabold text-sm rounded-2xl shadow-soft hover:bg-brand-teal-dark transition-all flex items-center justify-center space-x-2"
            >
              <span>VIEW ORDER HISTORY 📜</span>
            </button>

            <button
              onClick={() => {
                setConfirmedOrder(null);
                setActiveTab('explore');
              }}
              className="py-3.5 px-5 bg-brand-cream text-brand-charcoal font-bold text-sm rounded-2xl border border-brand-cream-dark hover:bg-brand-cream-dark transition-all"
            >
              Explore More Dishes
            </button>
          </div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-brand-cream-dark text-center space-y-4 shadow-soft">
          <div className="w-20 h-20 rounded-full bg-brand-cream-card border border-brand-cream-dark flex items-center justify-center mx-auto text-brand-coral">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold font-heading text-brand-charcoal">Your Cart is Empty</h3>
          <p className="text-sm text-brand-charcoal-muted max-w-sm mx-auto">
            Explore delicious food reels in Nommly or discover top-rated dishes in Explore to start your order!
          </p>
          <button
            onClick={() => setActiveTab('explore')}
            className="px-6 py-3 bg-brand-coral text-white font-bold text-sm rounded-2xl shadow-coral hover:bg-brand-coral-hover transition-all inline-block"
          >
            Explore Food Now →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: CART ITEMS & FOOD ON FRIEND */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CART ITEMS LIST */}
            <div className="bg-white rounded-3xl p-4 lg:p-6 border border-brand-cream-dark shadow-soft space-y-4">
              <h3 className="text-base font-bold font-heading text-brand-charcoal border-b border-brand-cream-dark/60 pb-3">
                Order Items ({cartItems.length})
              </h3>

              <div className="divide-y divide-brand-cream-dark/60">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={item.posterUrl || item.mediaUrl}
                        alt={item.title}
                        className="w-16 h-16 rounded-2xl object-cover border border-brand-cream-dark shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-brand-charcoal truncate">{item.title}</h4>
                        <p className="text-xs text-brand-charcoal-muted truncate">{item.restaurantName}</p>
                        <p className="text-sm font-extrabold text-brand-coral mt-1">₹{item.price * item.quantity}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="flex items-center space-x-2 bg-brand-cream-card p-1 rounded-xl border border-brand-cream-dark">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white text-brand-charcoal flex items-center justify-center hover:bg-brand-cream-dark transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-brand-charcoal w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white text-brand-charcoal flex items-center justify-center hover:bg-brand-cream-dark transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-xl text-brand-charcoal-muted hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FOOD ON FRIEND BILL SPLITING MODULE */}
            <div className="bg-gradient-to-r from-brand-cream-card via-white to-brand-teal/5 rounded-3xl p-5 border border-brand-cream-dark shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-brand-teal/20 text-brand-teal flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-brand-charcoal">Food on Friend ™ Split</h3>
                    <p className="text-xs text-brand-charcoal-muted">Request friend contribution towards this order</p>
                  </div>
                </div>

                <button
                  onClick={toggleFoodOnFriend}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    foodOnFriend.enabled
                      ? 'bg-brand-teal text-white border-brand-teal shadow-soft'
                      : 'bg-white text-brand-charcoal border-brand-cream-dark hover:border-brand-teal/40'
                  }`}
                >
                  {foodOnFriend.enabled ? 'Enabled ✓' : '+ Enable Split'}
                </button>
              </div>

              {foodOnFriend.enabled && (
                <div className="p-4 bg-white rounded-2xl border border-brand-cream-dark space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-brand-charcoal">
                    <span>Friend Name: {foodOnFriend.friendName}</span>
                    <span className="text-brand-coral font-semibold">Total ₹{cartTotal}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-brand-cream-card p-3 rounded-xl border border-brand-cream-dark">
                      <p className="text-[11px] text-brand-charcoal-muted uppercase font-bold">Your Share</p>
                      <p className="text-lg font-bold text-brand-coral">₹{foodOnFriend.organizerShare}</p>
                    </div>
                    <div className="bg-brand-cream-card p-3 rounded-xl border border-brand-cream-dark">
                      <p className="text-[11px] text-brand-charcoal-muted uppercase font-bold">Requested Share</p>
                      <p className="text-lg font-bold text-brand-teal">₹{foodOnFriend.requestedAmount}</p>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className="pt-2 border-t border-brand-cream-dark/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-charcoal flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="capitalize">Status: {foodOnFriend.status}</span>
                    </span>

                    <button
                      onClick={simulateFriendAction}
                      className="text-xs font-bold text-brand-teal hover:underline"
                    >
                      Simulate Accept ⚡
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: BILL SUMMARY & CHECKOUT BUTTON */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-5 lg:p-6 border border-brand-cream-dark shadow-soft space-y-4">
              <h3 className="text-base font-bold font-heading text-brand-charcoal border-b border-brand-cream-dark/60 pb-3">
                Payment Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-brand-charcoal-muted">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-brand-charcoal">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-brand-charcoal-muted">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-brand-charcoal">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-brand-charcoal-muted">
                  <span>Taxes & Charges (5%)</span>
                  <span className="font-bold text-brand-charcoal">₹{taxes}</span>
                </div>

                {foodOnFriend.enabled && foodOnFriend.status === 'accepted' && (
                  <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-emerald-100">
                    <span>Friend Contribution (Paid)</span>
                    <span>- ₹{foodOnFriend.requestedAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-extrabold text-brand-charcoal pt-3 border-t border-brand-cream-dark">
                  <span>To Pay</span>
                  <span className="text-brand-coral">
                    ₹{foodOnFriend.enabled && foodOnFriend.status === 'accepted' ? foodOnFriend.organizerShare : cartTotal}
                  </span>
                </div>
              </div>

              {/* Delivery Location Pin — clickable to open map */}
              <button
                onClick={() => setShowMapModal(true)}
                className="w-full p-3 bg-brand-cream-card rounded-2xl border border-brand-cream-dark text-xs space-y-1 hover:border-brand-teal/50 hover:bg-brand-teal/5 transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-brand-teal font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>Delivering to {deliveryAddress.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-brand-coral group-hover:text-brand-teal transition-colors">CHANGE ›</span>
                </div>
                <p className="text-brand-charcoal-muted text-[11px] font-medium leading-tight">
                  {deliveryAddress.street}, {deliveryAddress.area}
                </p>
              </button>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-brand-coral text-white font-extrabold text-sm rounded-2xl shadow-coral hover:bg-brand-coral-hover transition-all flex items-center justify-center space-x-2"
              >
                <span>PROCEED TO RAZORPAY TEST CHECKOUT →</span>
              </button>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-brand-charcoal-muted">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
                <span>100% Secure Razorpay TEST MODE Encrypted Payment</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAZORPAY CHECKOUT MODAL */}
      <MockRazorpayModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        amount={razorpayCheckoutCtx?.finalPayable || cartTotal}
        merchantName="ScrollNom Food Delivery"
        orderId={razorpayCheckoutCtx?.orderData?.orderId}
        userEmail={user?.email}
        userName={user?.name}
        userPhone={user?.phone}
        onPaymentSuccess={(razorpayResponse) => {
          if (razorpayCheckoutCtx?.onPaymentDone) {
            razorpayCheckoutCtx.onPaymentDone(razorpayResponse);
          }
        }}
      />

      {/* DELIVERY MAP MODAL */}
      <DeliveryMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        currentAddress={deliveryAddress}
        onConfirmAddress={(addr) => {
          setDeliveryAddress({
            label: addr.label,
            street: addr.street,
            area: addr.area
          });
          showToast(`Delivery location set to ${addr.label}`, 'success');
        }}
      />

      {/* LIVE TRACKING MODAL */}
      {showTrackingModal && (
        <LiveOrderTrackingModal
          orderId={confirmedOrder?.orderId}
          deliveryId={confirmedOrder?.deliveryId || activeDeliveryId}
          isOpen={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
        />
      )}
    </div>
  );
};

export default CartPage;
