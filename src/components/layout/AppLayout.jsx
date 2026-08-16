import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../brand/BrandHeader';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { AuthModal } from '../auth/AuthModal';
import { UsernameOnboardingModal } from '../auth/UsernameOnboardingModal';
import { Toast } from '../ui/Toast';

export const AppLayout = ({ children }) => {
  const { activeTab, showUsernameModal, setShowUsernameModal } = useApp();

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col lg:flex-row antialiased selection:bg-brand-coral selection:text-white">
      
      {/* Desktop Navigation Sidebar (lg: flex, hidden on mobile) */}
      <DesktopSidebar />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Top Header (hidden on desktop AND hidden on mobile Nommly/Auth full screen) */}
        {activeTab !== 'nommly' && activeTab !== 'auth' && (
          <div className="lg:hidden">
            <BrandHeader />
          </div>
        )}

        {/* Main Viewport Workspace */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation (lg: hidden) */}
      {activeTab !== 'auth' && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}

      {/* Global Modals & Toast */}
      <AuthModal />
      <UsernameOnboardingModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
      />
      <Toast />
    </div>
  );
};
