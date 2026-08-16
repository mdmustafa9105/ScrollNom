import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { User, Video, TrendingUp, DollarSign, Handshake, PlusCircle, ShoppingBag, Heart, ShieldCheck, LogOut, CheckCircle2, ChevronRight, Sparkles, Upload, Clock, RefreshCw } from 'lucide-react';
import { OrderHistoryView } from '../../components/orders/OrderHistoryView';

export const ProfilePage = () => {
  const { user, toggleCreatorMode, logoutUser, showToast, setActiveTab, promptAuth, getAuthToken } = useApp();
  const [activeSubView, setActiveSubView] = useState('profile'); // 'profile' | 'orders'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [selectedCollab, setSelectedCollab] = useState('Paradise Biryani Palace');

  // Video File Upload & Analysis State
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [myVideos, setMyVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [taggedDishesList, setTaggedDishesList] = useState([]);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Real Creator Collaborations State
  const [collaborations, setCollaborations] = useState([]);
  const [loadingCollabs, setLoadingCollabs] = useState(false);

  const fetchCreatorCollaborations = async () => {
    if (!user.isCreator || !user.isLoggedIn) return;
    setLoadingCollabs(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/creator/collaborations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCollaborations(json.data || []);
      }
    } catch (e) {
      console.error('[COLLAB FETCH ERROR]', e);
    } finally {
      setLoadingCollabs(false);
    }
  };

  const fetchMyVideos = async () => {
    if (!user.isCreator || !user.isLoggedIn) return;
    setLoadingVideos(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/content/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMyVideos(json.data || []);
      }
    } catch (e) {
      console.error('[FETCH MY VIDEOS ERROR]', e);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchCreatorCollaborations();
    fetchMyVideos();
  }, [user.isCreator, user.isLoggedIn]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov)$/i)) {
      showToast('Invalid file format. Please upload an MP4 video file (.mp4).', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('Video file size exceeds 50MB limit.', 'error');
      return;
    }

    setSelectedVideoFile(file);
    showToast(`Selected "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 'info');
  };

  const handleCreateReel = async (e) => {
    e.preventDefault();
    if (!newReelTitle) {
      showToast('Please enter a title for your Nommly Reel.', 'error');
      return;
    }
    if (!selectedVideoFile) {
      showToast('Please choose an MP4 video file from your computer.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      const token = await getAuthToken();

      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedVideoFile);
      });

      setUploadProgress(50);

      // 1. Upload video file to server storage
      const uploadRes = await fetch(`${API_BASE}/upload/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoData: base64Data,
          fileName: selectedVideoFile.name,
          mimeType: selectedVideoFile.type || 'video/mp4'
        })
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload video file to server storage.');
      }

      const uploadJson = await uploadRes.json();
      const storedVideoUrl = uploadJson.data?.videoUrl || uploadJson.data?.fullUrl;
      setUploadedMediaUrl(storedVideoUrl);

      setUploadProgress(75);

      // 2. Call Video Analysis API endpoint
      const analyzeRes = await fetch(`${API_BASE}/creator/analyze-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoFileName: selectedVideoFile.name,
          videoUrl: storedVideoUrl
        })
      });

      const analyzeJson = await analyzeRes.json();
      const analysis = analyzeJson.data || {};

      setAnalysisResult(analysis);
      setTaggedDishesList(analysis.detectedDishes || []);
      setUploadProgress(100);
      showToast('Video food analysis complete! Please review dish tags.', 'success');
    } catch (err) {
      console.error('[CREATOR REEL ANALYSIS ERROR]', err);
      showToast(err.message || 'Video analysis failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFinalPublish = async () => {
    if (!uploadedMediaUrl) return;

    setUploading(true);
    try {
      const token = await getAuthToken();

      const contentRes = await fetch(`${API_BASE}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contentType: 'nommly',
          mediaUrl: uploadedMediaUrl,
          posterUrl: uploadedMediaUrl,
          caption: newReelTitle,
          dishTitle: newReelTitle,
          restaurantId: analysisResult?.restaurantId || 'r1',
          restaurantName: analysisResult?.restaurantName || selectedCollab,
          taggedDishes: taggedDishesList,
          categories: analysisResult?.categories || ['MAIN_FOOD'],
          timeBelts: analysisResult?.timeBelts || ['AFTERNOON']
        })
      });

      if (!contentRes.ok) {
        throw new Error('Failed to publish Nommly Reel content record.');
      }

      showToast(`Published Nommly Reel "${newReelTitle}"! 🚀`, 'success');
      setShowCreateModal(false);
      setNewReelTitle('');
      setSelectedVideoFile(null);
      setAnalysisResult(null);
      setTaggedDishesList([]);
      setUploadedMediaUrl(null);

      await fetchMyVideos();
    } catch (err) {
      console.error('[FINAL PUBLISH ERROR]', err);
      showToast(err.message || 'Publishing failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };


  if (activeSubView === 'orders') {
    return (
      <div className="pb-24 lg:pb-8 pt-4 px-4 lg:px-8 max-w-7xl mx-auto space-y-4">
        <button
          onClick={() => setActiveSubView('profile')}
          className="text-xs font-bold text-brand-coral flex items-center space-x-1 hover:underline mb-2"
        >
          <span>← Back to My Account</span>
        </button>
        <OrderHistoryView onBack={() => setActiveSubView('profile')} />
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8 pt-4 px-4 lg:px-8 max-w-7xl mx-auto space-y-6 animate-fade-in select-none">
      
      {/* DESKTOP 2-COLUMN STUDIO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: USER CARD & ACCOUNT SETTINGS (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Profile Card */}
          <div className="bg-brand-cream-card p-6 rounded-3xl border border-brand-cream-dark space-y-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-coral to-brand-gold p-1 shadow-coral">
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'foodie'}`}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  </div>
                  {user.isCreator && (
                    <span className="absolute -bottom-1 -right-1 bg-brand-gold text-brand-charcoal text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow-sm">
                      CREATOR
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-brand-charcoal flex items-center space-x-2">
                    <span>{user.name}</span>
                    {user.isCreator && <Sparkles className="w-4 h-4 text-brand-gold fill-brand-gold" />}
                  </h2>
                  <p className="text-xs font-bold text-brand-coral">{user.handle || `@${user.name.toLowerCase().replace(/\s+/g, '')}`}</p>
                  <p className="text-[11px] text-brand-charcoal-muted font-medium">{user.email || user.phone}</p>
                </div>
              </div>

              {user.isLoggedIn && (
                <button
                  onClick={logoutUser}
                  className="p-2.5 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal-muted hover:text-brand-coral transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* CREATOR ONBOARDING / VIEW TOGGLE */}
            {user.isLoggedIn && (
              <div className="pt-3 border-t border-brand-cream-dark">
                {!user.isCreator ? (
                  <div
                    onClick={toggleCreatorMode}
                    className="bg-gradient-to-r from-brand-coral to-brand-gold text-white p-4 rounded-2xl shadow-coral flex items-center justify-between cursor-pointer hover:opacity-95 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <Sparkles className="w-5 h-5 text-white" />
                      <div>
                        <h3 className="text-xs font-extrabold">Become a ScrollNom Creator</h3>
                        <p className="text-[10px] text-white/90">Earn commissions reviewing dishes with restaurants.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                ) : (
                  <button
                    onClick={toggleCreatorMode}
                    className="w-full py-2.5 bg-brand-teal/10 text-brand-teal font-bold text-xs rounded-2xl border border-brand-teal/20 hover:bg-brand-teal/20 transition-all"
                  >
                    Switch to Customer View
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Account Menu */}
          <div className="bg-brand-cream-card p-5 rounded-3xl border border-brand-cream-dark space-y-3 shadow-soft">
            <h3 className="text-xs font-extrabold uppercase text-brand-charcoal-muted tracking-wider">Account & Orders</h3>
            
            <div className="space-y-2">
              <div
                onClick={() => setActiveSubView('orders')}
                className="bg-white p-3.5 rounded-2xl border border-brand-cream-dark flex items-center justify-between cursor-pointer hover:border-brand-teal transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-brand-coral/10 text-brand-coral">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-brand-charcoal">Past Food Orders</h4>
                    <p className="text-[10px] text-brand-charcoal-muted font-medium">Track active food orders & view history</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-brand-coral hover:underline">View History →</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-brand-cream-dark flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-brand-teal/10 text-brand-teal">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-brand-charcoal">Saved Nommly Dishes</h4>
                    <p className="text-[10px] text-brand-charcoal-muted font-medium">Your bookmarked video dishes</p>
                  </div>
                </div>
                <span className="text-xs text-brand-charcoal-muted font-bold">12 saved →</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-brand-cream-dark flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-brand-gold/20 text-brand-charcoal">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-brand-charcoal">Delivery Addresses</h4>
                    <p className="text-[10px] text-brand-charcoal-muted font-medium">{user.address.street}, {user.address.area}</p>
                  </div>
                </div>
                <span className="text-xs text-brand-charcoal-muted font-bold">{user.address.label} →</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CREATOR STUDIO DASHBOARD (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {user.isCreator ? (
            <div className="space-y-6 animate-fade-in">
              
              {/* CREATE REEL ACTION BANNER */}
              <div className="bg-brand-charcoal text-white p-6 rounded-3xl shadow-floating border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-brand-gold tracking-wider">Creator Studio</span>
                  <h2 className="text-base lg:text-lg font-extrabold">Create Nommly Food Reel</h2>
                  <p className="text-xs text-gray-300">Share your food experience & collaborate with top restaurants</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-brand-coral text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-coral hover:bg-brand-coral-dark flex items-center space-x-2 transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload Reel</span>
                </button>
              </div>

              {/* PERFORMANCE METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-brand-cream-card p-5 rounded-3xl border border-brand-cream-dark space-y-2 shadow-soft">
                  <div className="flex items-center space-x-2 text-brand-teal text-xs font-bold">
                    <DollarSign className="w-4 h-4" />
                    <span>Monthly Earnings</span>
                  </div>
                  <p className="text-2xl font-black text-brand-coral">{user.earningsThisMonth || '₹0'}</p>
                  <span className="text-xs text-brand-charcoal-muted font-bold">
                    {user.earningsThisMonth && user.earningsThisMonth !== '₹0' ? '+18% vs last month' : 'No payout requests yet'}
                  </span>
                </div>

                <div className="bg-brand-cream-card p-5 rounded-3xl border border-brand-cream-dark space-y-2 shadow-soft">
                  <div className="flex items-center space-x-2 text-brand-teal text-xs font-bold">
                    <TrendingUp className="w-4 h-4" />
                    <span>Orders Driven</span>
                  </div>
                  <p className="text-2xl font-black text-brand-charcoal">
                    {myVideos.length * 5 || collaborations.filter(c => c.status === 'accepted').length * 12 || 0} Orders
                  </p>
                  <span className="text-xs text-brand-teal font-bold">
                    {myVideos.length > 0 || collaborations.length > 0 ? 'Active trackings' : 'No driven orders yet'}
                  </span>
                </div>
              </div>

              {/* MY PUBLISHED NOMMLY REELS */}
              <div className="bg-brand-cream-card p-5 rounded-3xl border border-brand-cream-dark space-y-4 shadow-soft">
                <div className="flex items-center justify-between border-b border-brand-cream-dark pb-3">
                  <div className="flex items-center space-x-2">
                    <Video className="w-5 h-5 text-brand-coral" />
                    <h3 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-wider font-sans">
                      My Published Nommly Reels ({myVideos.length})
                    </h3>
                  </div>
                  <button onClick={fetchMyVideos} className="text-xs font-bold text-brand-teal flex items-center space-x-1 hover:underline">
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingVideos ? (
                  <div className="p-6 text-center text-xs text-brand-charcoal-muted animate-pulse">
                    Loading your published videos...
                  </div>
                ) : myVideos.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-brand-cream-dark text-center space-y-2">
                    <Video className="w-8 h-8 text-brand-charcoal-muted opacity-40 mx-auto" />
                    <h4 className="text-xs font-extrabold text-brand-charcoal">No Nommly Reels published yet</h4>
                    <p className="text-[11px] text-brand-charcoal-muted max-w-xs mx-auto">
                      Click "Upload Reel" above to select and publish your first food review video!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myVideos.map(video => (
                      <div key={video.id} className="bg-white p-3 rounded-2xl border border-brand-cream-dark space-y-2">
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-[16/9] flex items-center justify-center">
                          <video
                            src={video.mediaUrl}
                            controls
                            className="w-full h-full object-cover"
                            poster={video.posterUrl}
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-brand-charcoal truncate">{video.title || video.caption}</h4>
                          <p className="text-[11px] text-brand-teal font-bold truncate">{video.restaurantName}</p>
                          <span className="text-[10px] text-brand-charcoal-muted font-medium block mt-1">
                            Published • {new Date(video.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RESTAURANT COLLABORATIONS HUB */}
              <div className="bg-brand-cream-card p-5 rounded-3xl border border-brand-cream-dark space-y-4 shadow-soft">
                <div className="flex items-center justify-between border-b border-brand-cream-dark pb-3">
                  <div className="flex items-center space-x-2">
                    <Handshake className="w-5 h-5 text-brand-coral" />
                    <h3 className="text-xs font-extrabold text-brand-charcoal uppercase tracking-wider font-sans">
                      My Restaurant Collaborations ({collaborations.length})
                    </h3>
                  </div>
                  <button onClick={fetchCreatorCollaborations} className="text-xs font-bold text-brand-teal flex items-center space-x-1 hover:underline">
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingCollabs ? (
                  <div className="p-6 text-center text-xs text-brand-charcoal-muted animate-pulse">
                    Loading your collaboration requests...
                  </div>
                ) : collaborations.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-brand-cream-dark text-center space-y-2">
                    <Handshake className="w-8 h-8 text-brand-charcoal-muted opacity-40 mx-auto" />
                    <h4 className="text-xs font-extrabold text-brand-charcoal">No restaurant collaborations yet</h4>
                    <p className="text-[11px] text-brand-charcoal-muted max-w-xs mx-auto">
                      Search restaurants in Explore and click "Promote This Restaurant" to send collaboration requests.
                    </p>
                    <button
                      onClick={() => setActiveTab('explore')}
                      className="mt-2 text-xs font-extrabold text-brand-coral bg-brand-coral/10 hover:bg-brand-coral/20 px-4 py-2 rounded-xl transition-colors"
                    >
                      Explore Restaurants →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collaborations.map(collab => {
                      const isAccepted = collab.status === 'accepted';
                      const isPending = collab.status === 'pending';
                      const isDeclined = collab.status === 'declined';

                      return (
                        <div key={collab.id} className="bg-white p-4 rounded-2xl border border-brand-cream-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-extrabold text-brand-charcoal">{collab.restaurant_name}</h4>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                isAccepted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                isDeclined ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {collab.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-brand-charcoal-muted font-medium">
                              {collab.dish_title} • {collab.promotion_type}
                            </p>
                            {collab.message && (
                              <p className="text-[11px] text-brand-charcoal italic">"{collab.message}"</p>
                            )}
                          </div>

                          <div>
                            {isAccepted ? (
                              <span className="text-xs font-bold text-emerald-600">COLLABORATION ACCEPTED</span>
                            ) : isDeclined ? (
                              <span className="text-xs font-bold text-rose-600">DECLINED</span>
                            ) : (
                              <span className="text-xs font-bold text-amber-600">PENDING</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-brand-cream-card p-6 rounded-3xl border border-brand-cream-dark space-y-4 text-center py-12 shadow-soft">
              <Sparkles className="w-12 h-12 text-brand-coral mx-auto animate-bounce-mascot" />
              <h2 className="text-lg font-extrabold text-brand-charcoal">Become a ScrollNom Food Creator</h2>
              <p className="text-xs text-brand-charcoal-muted max-w-sm mx-auto">
                Join our verified food creator network to collaborate directly with top restaurants in your city and earn commissions on every order driven!
              </p>
              <button
                onClick={toggleCreatorMode}
                className="bg-brand-coral text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-coral hover:bg-brand-coral-dark"
              >
                Enable Creator Studio Mode Now
              </button>
            </div>
          )}
        </div>

      </div>

      {/* CREATE REEL MODAL WITH VIDEO ANALYSIS PREVIEW & DISH TAGGING */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-brand-cream rounded-3xl p-6 shadow-floating border border-brand-cream-dark relative animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-cream-dark pb-3">
              <div className="flex items-center space-x-2">
                <Video className="w-5 h-5 text-brand-coral" />
                <h3 className="text-base font-extrabold text-brand-charcoal">
                  {analysisResult ? 'Food Tagging & Confirmation' : 'Upload Nommly Reel'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setSelectedVideoFile(null); setAnalysisResult(null); }}
                className="text-xs font-bold text-brand-coral"
              >
                Cancel
              </button>
            </div>

            {!analysisResult ? (
              <form onSubmit={handleCreateReel} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-muted mb-1">Dish Video Title / Caption</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Authentic Benne Dosa & Filter Coffee Tasting 🥞☕"
                    value={newReelTitle}
                    onChange={(e) => setNewReelTitle(e.target.value)}
                    className="w-full p-3.5 bg-brand-cream-card border border-brand-cream-dark rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-muted mb-1">Select Partner Restaurant</label>
                  <select
                    value={selectedCollab}
                    onChange={(e) => setSelectedCollab(e.target.value)}
                    className="w-full p-3.5 bg-brand-cream-card border border-brand-cream-dark rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="Paradise Biryani Palace">Paradise Biryani Palace</option>
                    <option value="The Smashed Patty Co. - Koramangala">The Smashed Patty Co. - Koramangala</option>
                    <option value="CTR Benne Dosa - Malleshwaram">CTR Benne Dosa - Malleshwaram</option>
                    <option value="Third Wave Coffee - Indiranagar">Third Wave Coffee - Indiranagar</option>
                  </select>
                </div>

                {/* Video File Picker Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-teal/40 p-6 rounded-2xl text-center bg-brand-teal/5 hover:bg-brand-teal/10 transition-colors cursor-pointer space-y-2"
                >
                  {selectedVideoFile ? (
                    <div className="space-y-1">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                      <p className="text-xs font-extrabold text-brand-charcoal truncate">{selectedVideoFile.name}</p>
                      <p className="text-[10px] font-bold text-emerald-600">
                        {(selectedVideoFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Analysis
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-brand-teal" />
                      <p className="text-xs font-bold text-brand-teal">Click to choose MP4 video file from computer</p>
                      <p className="text-[10px] text-brand-charcoal-muted">Supports .mp4, .webm, .mov up to 50MB</p>
                    </>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-brand-teal">
                      <span>Analyzing Video Content...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-brand-cream-dark rounded-full overflow-hidden">
                      <div className="h-full bg-brand-coral transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3.5 bg-brand-coral text-white font-extrabold text-xs rounded-xl shadow-coral hover:bg-brand-coral-dark disabled:opacity-50"
                >
                  {uploading ? `Processing Video (${uploadProgress}%)...` : 'Run Video Analysis & Food Tagging →'}
                </button>
              </form>
            ) : (
              /* STEP 2: FOOD TAGGING CONFIRMATION SCREEN */
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-brand-cream-dark space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-brand-coral uppercase tracking-wider">VIDEO ANALYSIS COMPLETE</span>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Confidence 98%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-brand-charcoal-muted">Target Restaurant:</p>
                    <p className="text-sm font-extrabold text-brand-charcoal">{analysisResult.restaurantName}</p>
                  </div>

                  {/* Detected Dish Tags */}
                  <div className="space-y-2 pt-2 border-t border-brand-cream-dark">
                    <label className="block text-xs font-extrabold text-brand-charcoal">Dishes Tagged in Video ({taggedDishesList.length})</label>
                    
                    <div className="space-y-2">
                      {taggedDishesList.map((dish, idx) => (
                        <div key={dish.dishId || idx} className="bg-brand-cream-card p-3 rounded-xl border border-brand-cream-dark flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center text-[9px] font-bold ${
                                dish.dietType === 'VEG' || dish.dietType === 'VEGAN' ? 'border-emerald-600 text-emerald-600 bg-emerald-50' : 'border-red-600 text-red-600 bg-red-50'
                              }`}>
                                {dish.dietType === 'VEG' || dish.dietType === 'VEGAN' ? '●' : '▲'}
                              </span>
                              <h5 className="text-xs font-extrabold text-brand-charcoal">{dish.name}</h5>
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-brand-charcoal-muted">
                              <span className="bg-white px-1.5 py-0.5 rounded font-mono uppercase border">{dish.category || 'MAIN_FOOD'}</span>
                              {dish.discountPercent > 0 && (
                                <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                                  {dish.discountPercent}% OFF ({dish.promoCode})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-brand-coral">₹{dish.price}</span>
                            <button
                              type="button"
                              onClick={() => setTaggedDishesList(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 font-bold text-xs p-1"
                              title="Remove tag"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Dish Tag Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const newDishName = prompt('Enter dish name to tag from canonical menu:', 'Paneer Biryani');
                        if (newDishName) {
                          setTaggedDishesList(prev => [
                            ...prev,
                            { dishId: `d_manual_${Date.now()}`, name: newDishName, dietType: 'VEG', category: 'MAIN_FOOD', price: 290, confidence: 1.0 }
                          ]);
                        }
                      }}
                      className="w-full py-2 bg-white hover:bg-brand-cream-card text-brand-coral border border-dashed border-brand-coral/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1"
                    >
                      <span>+ Tag another dish</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setAnalysisResult(null)}
                    className="w-1/3 py-3 bg-white text-brand-charcoal font-bold text-xs rounded-xl border border-brand-cream-dark"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalPublish}
                    disabled={uploading}
                    className="w-2/3 py-3 bg-brand-coral hover:bg-brand-coral-dark text-white font-extrabold text-xs rounded-xl shadow-coral"
                  >
                    Confirm & Publish Nommly Reel 🚀
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
};
