import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollNomLogoIcon } from '../brand/IconSet';
import { NotificationBell } from '../notifications/NotificationBell';
import { Home, Compass, ShoppingBag, User, MapPin, LogIn, UserCheck, Sparkles, Video, MessageSquare } from 'lucide-react';

export const DesktopSidebar = () => {
  const { activeTab, setActiveTab, cartItems, foodOnFriend, user, promptAuth, unreadMessageCount } = useApp();

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const personalNavItems = [
    { id: 'home', label: 'Home Feed', icon: Home },
    { id: 'explore', label: 'Explore & Search', icon: Compass },
    { id: 'nommly', label: 'Nommly Videos', icon: Video, badge: 'LIVE' },
    { id: 'cart', label: 'Cart & Checkout', icon: ShoppingBag, count: totalCartCount, isSplit: foodOnFriend.enabled },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: unreadMessageCount },
    { id: 'profile', label: 'My Account', icon: User },
  ];

  const creatorNavItems = [
    { id: 'profile', label: 'Creator Dashboard', icon: Sparkles, badge: 'STUDIO' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-brand-cream-card border-r border-brand-cream-dark p-5 flex-shrink-0 justify-between select-none z-30">
      
      {/* Top Brand Section */}
      <div className="space-y-5">
        
        {/* Logo & Notification Bell */}
        <div className="flex items-center justify-between p-1">
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <ScrollNomLogoIcon className="w-10 h-10 transform group-hover:scale-110 transition-transform" animate={true} />
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-brand-coral font-display leading-none">
                scrollnom
              </span>
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-brand-teal mt-0.5">
                Discover • Nom • Order
              </span>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Location Selector Card */}
        <div className="bg-white p-3 rounded-2xl border border-brand-cream-dark flex items-center space-x-2.5 cursor-pointer hover:border-brand-gold transition-colors">
          <div className="p-2 rounded-xl bg-brand-coral/10 text-brand-coral">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-brand-charcoal-muted uppercase tracking-wider block">Deliver To</span>
            <p className="text-xs font-extrabold text-brand-charcoal truncate">{user.address.area}</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-4">
          
          {/* Personal Navigation Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-brand-teal uppercase tracking-widest px-3 block">
              Personal
            </span>
            <nav className="space-y-1">
              {personalNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id && (!user.isCreator || item.id !== 'profile');

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all group ${
                      isActive
                        ? 'bg-brand-coral text-white shadow-coral scale-102'
                        : 'text-brand-charcoal hover:bg-white border border-transparent hover:border-brand-cream-dark'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-coral group-hover:scale-110'} transition-transform`} />
                      <span>{item.label}</span>
                    </div>

                    {item.count > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-brand-coral' : 'bg-brand-coral text-white'
                      }`}>
                        {item.count}
                      </span>
                    )}

                    {item.badge && !item.count && (
                      <span className="text-[9px] font-black bg-brand-teal/20 text-brand-teal px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Creator Navigation Section — Exposed when Creator Mode is ON */}
          {user.isCreator && (
            <div className="space-y-1 pt-2 border-t border-brand-cream-dark/60">
              <span className="text-[10px] font-extrabold text-brand-gold uppercase tracking-widest px-3 flex items-center justify-between">
                <span>Creator Studio</span>
                <Sparkles className="w-3 h-3 text-brand-gold animate-pulse-glow" />
              </span>
              <nav className="space-y-1">
                {creatorNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === 'profile';

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab('profile')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all group ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-coral to-brand-gold text-white shadow-coral scale-102'
                          : 'bg-brand-gold/10 text-brand-charcoal hover:bg-brand-gold/20 border border-brand-gold/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="text-[9px] font-black bg-brand-gold text-white px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Three-Laptop Demonstration Roles Section */}
          <div className="space-y-1 pt-2 border-t border-brand-cream-dark/60">
            <span className="text-[10px] font-extrabold text-brand-coral uppercase tracking-widest px-3 block">
              3-Laptop Demo Roles
            </span>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab !== 'restaurant' && activeTab !== 'rider'
                    ? 'bg-brand-coral/20 text-brand-coral font-extrabold'
                    : 'text-brand-charcoal-muted hover:text-brand-charcoal'
                }`}
              >
                1. Customer App (Laptop 1)
              </button>
              <button
                onClick={() => setActiveTab('restaurant')}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'restaurant'
                    ? 'bg-brand-coral text-white font-extrabold shadow-coral'
                    : 'text-brand-charcoal-muted hover:text-brand-charcoal'
                }`}
              >
                2. Restaurant Ops (Laptop 2)
              </button>
              <button
                onClick={() => setActiveTab('rider')}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'rider'
                    ? 'bg-brand-teal text-white font-extrabold shadow-soft'
                    : 'text-brand-charcoal-muted hover:text-brand-charcoal'
                }`}
              >
                3. Rider App (Laptop 3)
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom User & Creator Status */}
      <div className="space-y-3 pt-4 border-t border-brand-cream-dark">
        {user.isLoggedIn ? (
          <div className="bg-white p-3 rounded-2xl border border-brand-cream-dark flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-brand-coral/20 border border-brand-coral flex items-center justify-center font-extrabold text-sm text-brand-coral">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-brand-charcoal truncate">{user.name}</p>
                <p className="text-[10px] text-brand-teal font-bold truncate">{user.phone}</p>
              </div>
            </div>
            {user.isCreator && (
              <Sparkles className="w-4 h-4 text-brand-gold animate-pulse-glow" />
            )}
          </div>
        ) : (
          <button
            onClick={() => promptAuth('Sign in to customize your ScrollNom experience')}
            className="w-full py-3 px-4 bg-brand-coral text-white font-extrabold text-xs rounded-2xl shadow-coral hover:bg-brand-coral-dark flex items-center justify-center space-x-2 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to ScrollNom</span>
          </button>
        )}
      </div>

    </aside>
  );
};
