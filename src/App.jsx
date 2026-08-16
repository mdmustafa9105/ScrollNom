import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/Home/HomePage';
import { ExplorePage } from './pages/Explore/ExplorePage';
import { NommlyPage } from './pages/Nommly/NommlyPage';
import { CartPage } from './pages/Cart/CartPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { AuthPage } from './pages/Auth/AuthPage';
import { RestaurantOpsPage } from './pages/RestaurantOps/RestaurantOpsPage';
import { RiderOpsPage } from './pages/RiderOps/RiderOpsPage';
import { ScrollNomLogoIcon } from './components/brand/IconSet';

const MainContent = () => {
  const { activeTab, setActiveTab } = useApp();
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Read ?role=restaurant or ?role=rider URL query parameter on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam === 'restaurant') {
        setActiveTab('restaurant');
      } else if (roleParam === 'rider') {
        setActiveTab('rider');
      }
    }

    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-brand-cream flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <ScrollNomLogoIcon className="w-24 h-24 text-brand-coral animate-bounce-mascot" />
        <div className="text-center space-y-1 animate-unroll">
          <h1 className="text-3xl font-extrabold text-brand-coral tracking-tight font-sans">
            scrollnom
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">
            Discover • Nom • Order
          </p>
        </div>
        <div className="w-32 h-1 bg-brand-cream-dark rounded-full overflow-hidden mt-6">
          <div className="h-full bg-brand-coral animate-pulse-glow" style={{ width: '80%' }} />
        </div>
      </div>
    );
  }

  // Standalone full views for Restaurant & Rider Apps
  if (activeTab === 'restaurant') {
    return <RestaurantOpsPage />;
  }

  if (activeTab === 'rider') {
    return <RiderOpsPage />;
  }

  return (
    <AppLayout>
      {activeTab === 'home' && <HomePage />}
      {activeTab === 'explore' && <ExplorePage />}
      {activeTab === 'nommly' && <NommlyPage />}
      {activeTab === 'cart' && <CartPage />}
      {activeTab === 'profile' && <ProfilePage />}
      {activeTab === 'auth' && <AuthPage />}
    </AppLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
