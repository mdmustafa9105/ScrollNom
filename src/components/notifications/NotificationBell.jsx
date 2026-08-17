import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';

export const NotificationBell = ({ className = '' }) => {
  const { unreadNotifCount, user, promptAuth } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (!user.isLoggedIn) {
      promptAuth('Sign in to view your notifications');
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`relative p-2.5 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal hover:border-brand-gold hover:text-brand-coral transition-all active:scale-95 shadow-xs ${className}`}
        title="Notifications"
        id="btn-notification-bell"
      >
        <Bell className="w-5 h-5" />
        {unreadNotifCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-coral text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-bounce-mascot">
            {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
          </span>
        )}
      </button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
