import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCheck,
  UserPlus,
  MessageSquare,
  ShoppingBag,
  Truck,
  Sparkles,
  Users,
  X,
  ChevronRight
} from 'lucide-react';

const getNotifIcon = (type) => {
  if (type === 'NEW_FOLLOWER') return <UserPlus className="w-4 h-4 text-brand-coral" />;
  if (type === 'MESSAGE_RECEIVED') return <MessageSquare className="w-4 h-4 text-brand-teal" />;
  if (type.startsWith('ORDER_')) return <ShoppingBag className="w-4 h-4 text-brand-gold" />;
  if (type.startsWith('RIDER_') || type.includes('DELIVERY')) return <Truck className="w-4 h-4 text-blue-500" />;
  if (type.startsWith('CREATOR_COLLAB')) return <Sparkles className="w-4 h-4 text-purple-500" />;
  if (type.startsWith('FOOD_ON_FRIEND')) return <Users className="w-4 h-4 text-emerald-500" />;
  return <Bell className="w-4 h-4 text-brand-coral" />;
};

export const NotificationPanel = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotifCount,
    handleMarkNotifRead,
    handleMarkAllNotifsRead,
    setActiveTab,
    openUserProfile
  } = useApp();

  if (!isOpen) return null;

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkNotifRead(notif.id);
    }

    onClose();

    // Deep linking action dispatch
    if (notif.type === 'NEW_FOLLOWER' && notif.actorUsername) {
      openUserProfile(notif.actorUsername);
    } else if (notif.type === 'MESSAGE_RECEIVED') {
      setActiveTab('messages');
    } else if (notif.type.startsWith('ORDER_') || notif.type.includes('DELIVERY') || notif.type === 'RIDER_ASSIGNED') {
      setActiveTab('cart');
    } else if (notif.type.startsWith('FOOD_ON_FRIEND')) {
      setActiveTab('cart');
    } else if (notif.type.startsWith('CREATOR_COLLAB')) {
      setActiveTab('profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="bg-white w-full max-w-sm h-full shadow-modal border-l border-brand-cream-dark flex flex-col animate-slide-left">
        
        {/* Header */}
        <div className="p-4 border-b border-brand-cream-dark bg-brand-cream-card flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-coral/10 text-brand-coral">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-brand-charcoal text-base font-sans">Notifications</h3>
              <p className="text-[11px] text-brand-teal font-bold">{unreadNotifCount} unread</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadNotifCount > 0 && (
              <button
                onClick={handleMarkAllNotifsRead}
                className="text-[11px] font-extrabold text-brand-coral hover:text-brand-coral-dark flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-brand-cream-dark shadow-xs transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-brand-cream-dark text-brand-charcoal-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 group ${
                  notif.isRead
                    ? 'bg-white border-brand-cream-dark opacity-75 hover:opacity-100 hover:border-brand-gold'
                    : 'bg-brand-coral/5 border-brand-coral/30 shadow-xs hover:bg-brand-coral/10'
                }`}
              >
                {/* Notification Icon / Actor Avatar */}
                <div className="relative flex-shrink-0 mt-0.5">
                  {notif.actorAvatarUrl ? (
                    <img
                      src={notif.actorAvatarUrl}
                      alt={notif.actorUsername || 'User'}
                      className="w-9 h-9 rounded-full object-cover border border-white shadow-xs"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-cream-card border border-brand-cream-dark flex items-center justify-center">
                      {getNotifIcon(notif.type)}
                    </div>
                  )}
                  {!notif.isRead && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-coral border-2 border-white animate-pulse" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-brand-charcoal truncate">{notif.title}</p>
                    <span className="text-[9px] text-brand-charcoal-muted font-bold whitespace-nowrap ml-2">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-brand-charcoal-muted font-medium line-clamp-2 mt-0.5">
                    {notif.body}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-brand-charcoal-muted group-hover:text-brand-coral group-hover:translate-x-0.5 transition-all self-center flex-shrink-0" />
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-brand-charcoal-muted space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-cream-card flex items-center justify-center mx-auto text-brand-teal">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold">No notifications yet!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
