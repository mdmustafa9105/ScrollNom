import React from 'react';
import { ScrollNomLogoIcon } from './IconSet';
import { useApp } from '../../context/AppContext';
import { MapPin, Search, Bell, UserCheck, LogIn } from 'lucide-react';

export const BrandHeader = ({ onSearchClick }) => {
  const { user, promptAuth, setActiveTab } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-brand-cream/90 backdrop-blur-md border-b border-brand-cream-dark px-4 py-2.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Wordmark */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-2.5 cursor-pointer group select-none"
        >
          <ScrollNomLogoIcon className="w-9 h-9 transform group-hover:scale-110 transition-transform" />
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tight text-brand-coral leading-none font-display">
              scrollnom
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-brand-teal mt-0.5">
              Discover • Nom • Order
            </span>
          </div>
        </div>

        {/* Location Selector Pill */}
        <div className="hidden sm:flex items-center space-x-1 text-xs bg-brand-cream-card px-2.5 py-1 rounded-full text-brand-charcoal border border-brand-cream-dark cursor-pointer hover:border-brand-gold transition-colors">
          <MapPin className="w-3.5 h-3.5 text-brand-coral" />
          <span className="font-medium truncate max-w-[120px]">{user.address.area}</span>
          <span className="text-brand-charcoal-muted">▾</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Quick Search */}
          <button 
            onClick={onSearchClick || (() => setActiveTab('explore'))}
            className="p-2 rounded-full bg-brand-cream-card hover:bg-brand-gold/20 text-brand-charcoal transition-all active:scale-95"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-brand-teal" />
          </button>

          {/* User Sign In / Profile status */}
          {user.isLoggedIn ? (
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center space-x-1 bg-brand-teal/10 text-brand-teal px-3 py-1.5 rounded-full font-semibold text-xs border border-brand-teal/20 hover:bg-brand-teal/20 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-brand-teal" />
              <span>{user.name}</span>
            </button>
          ) : (
            <button 
              onClick={() => promptAuth('Sign in to customize your ScrollNom experience')}
              className="flex items-center space-x-1 bg-brand-coral text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-coral hover:bg-brand-coral-dark transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
