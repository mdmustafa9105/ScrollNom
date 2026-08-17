import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  fetchConversations,
  fetchMessages,
  sendDirectMessage,
  createOrGetConversation,
  markConversationRead
} from '../../services/messageApi';
import { searchUserProfiles } from '../../services/userApi';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  User,
  X,
  ArrowLeft,
  CheckCheck,
  Sparkles,
  Loader2
} from 'lucide-react';

export const MessagesPage = () => {
  const { user, getAuthToken, showToast, activeChatUser, setActiveChatUser, promptAuth } = useApp();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  // New Message Search Modal
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load User Conversations
  const loadConversations = async () => {
    if (!user.isLoggedIn) {
      setLoadingConvs(false);
      return;
    }

    try {
      const token = await getAuthToken();
      const list = await fetchConversations(token);
      setConversations(list);

      // If activeChatUser was passed from profile click, select or create conversation with them
      if (activeChatUser) {
        const found = list.find(c => c.otherUser?.username?.toLowerCase() === activeChatUser.toLowerCase() || c.otherUser?.id === activeChatUser);
        if (found) {
          handleSelectConversation(found);
        } else {
          // Create conversation with activeChatUser
          const created = await createOrGetConversation(token, activeChatUser);
          if (created) {
            const updatedList = await fetchConversations(token);
            setConversations(updatedList);
            const conv = updatedList.find(c => c.id === created.id);
            if (conv) handleSelectConversation(conv);
          }
        }
        setActiveChatUser(null);
      }
    } catch (e) {
      console.error('[LOAD CONVERSATIONS ERROR]', e);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user.isLoggedIn, activeChatUser]);

  // Select active conversation & fetch messages
  const handleSelectConversation = async (conv) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    try {
      const token = await getAuthToken();
      const msgs = await fetchMessages(token, conv.id);
      setMessages(msgs);
      
      // Update unread count in conversations list
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
      
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      console.error('[FETCH MESSAGES ERROR]', e);
      showToast('Failed to load chat messages.', 'error');
    } finally {
      setLoadingMsgs(false);
    }
  };

  // Poll / Listen for incoming real-time SSE messages in active conversation
  useEffect(() => {
    if (!activeConv) return;

    const interval = setInterval(async () => {
      try {
        const token = await getAuthToken();
        const msgs = await fetchMessages(token, activeConv.id);
        setMessages(msgs);
      } catch (e) {}
    }, 4000); // 4s periodic sync fallback alongside SSE

    return () => clearInterval(interval);
  }, [activeConv]);

  // Send Message Handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv || sendingMsg) return;

    const text = messageInput.trim();
    setMessageInput('');
    setSendingMsg(true);

    try {
      const token = await getAuthToken();
      const sent = await sendDirectMessage(token, activeConv.otherUser.id, text);

      setMessages(prev => [...prev, sent]);

      // Update conversation last message snippet in list
      setConversations(prev => prev.map(c => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: {
              id: sent.id,
              senderId: sent.senderId,
              body: sent.body,
              createdAt: sent.createdAt
            },
            updatedAt: sent.createdAt
          };
        }
        return c;
      }));

      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('[SEND MESSAGE ERROR]', err);
      showToast(err.message || 'Failed to send message.', 'error');
      setMessageInput(text); // Restore text input on error
    } finally {
      setSendingMsg(false);
    }
  };

  // User Search Handler for New Chat
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const token = await getAuthToken();
        const results = await searchUserProfiles(searchQuery, token);
        setSearchResults(results.filter(u => u.id !== user.id));
      } catch (e) {
        console.error('[SEARCH USERS ERROR]', e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartChatWithUser = async (targetUser) => {
    setShowSearchModal(false);
    setSearchQuery('');
    try {
      const token = await getAuthToken();
      const conv = await createOrGetConversation(token, targetUser.id);
      const list = await fetchConversations(token);
      setConversations(list);
      const matched = list.find(c => c.id === conv.id);
      if (matched) {
        handleSelectConversation(matched);
      }
    } catch (e) {
      showToast('Failed to start conversation.', 'error');
    }
  };

  if (!user.isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-coral/10 text-brand-coral flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-brand-charcoal">ScrollNom Messages</h2>
        <p className="text-sm text-brand-charcoal-muted max-w-md mx-auto">
          Sign in to connect and message creators, friends, and food lovers on ScrollNom!
        </p>
        <button
          onClick={() => promptAuth('Sign in to send and receive messages')}
          className="px-6 py-3 bg-brand-coral text-white font-extrabold text-sm rounded-2xl shadow-coral hover:bg-brand-coral-dark transition-all"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-80px)] lg:h-[calc(100vh-40px)] p-2 sm:p-4 flex flex-col">
      <div className="bg-white rounded-3xl border border-brand-cream-dark shadow-modal flex-1 flex overflow-hidden">
        
        {/* Left Panel: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-brand-cream-dark flex flex-col bg-brand-cream-card ${
          activeConv ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header & New Chat Button */}
          <div className="p-4 border-b border-brand-cream-dark flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-brand-charcoal font-sans flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-brand-coral" />
              <span>Messages</span>
            </h2>
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2 rounded-2xl bg-brand-coral text-white hover:bg-brand-coral-dark transition-all shadow-coral flex items-center space-x-1 text-xs font-bold"
              id="btn-new-chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {loadingConvs ? (
              <div className="py-12 text-center text-brand-charcoal-muted text-xs font-bold flex flex-col items-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-coral" />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                const other = conv.otherUser;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 group ${
                      isSelected
                        ? 'bg-brand-coral text-white border-brand-coral shadow-coral scale-101'
                        : 'bg-white border-brand-cream-dark hover:border-brand-gold text-brand-charcoal'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={other?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={other?.displayName || 'User'}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                      {other?.isCreator && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-brand-gold text-white p-0.5 rounded-full border border-white">
                          <Sparkles className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-extrabold truncate ${isSelected ? 'text-white' : 'text-brand-charcoal'}`}>
                          {other?.displayName || other?.username || 'User'}
                        </p>
                        {conv.lastMessage && (
                          <span className={`text-[10px] font-bold ml-2 ${isSelected ? 'text-white/80' : 'text-brand-charcoal-muted'}`}>
                            {new Date(conv.updatedAt || conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs truncate font-medium ${isSelected ? 'text-white/90' : 'text-brand-charcoal-muted'}`}>
                          {conv.lastMessage?.body || 'Started a conversation'}
                        </p>
                        {conv.unreadCount > 0 && !isSelected && (
                          <span className="ml-2 bg-brand-coral text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-brand-charcoal-muted space-y-3 px-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto text-brand-coral border border-brand-cream-dark">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-extrabold">No messages yet!</p>
                <p className="text-[11px]">Search users to start your first chat.</p>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="px-4 py-2 bg-brand-coral text-white text-xs font-extrabold rounded-xl shadow-coral"
                >
                  Start New Chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Screen */}
        <div className={`flex-1 flex-col bg-white ${
          activeConv ? 'flex' : 'hidden md:flex'
        }`}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-brand-cream-dark bg-white flex items-center justify-between sticky top-0 z-10 shadow-xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden p-2 rounded-xl bg-brand-cream-card hover:bg-brand-cream-dark text-brand-charcoal transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <img
                    src={activeConv.otherUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={activeConv.otherUser?.displayName || 'User'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-brand-cream-dark shadow-xs"
                  />

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-brand-charcoal truncate font-sans">
                      {activeConv.otherUser?.displayName}
                    </h3>
                    <p className="text-[11px] font-bold text-brand-teal truncate">
                      @{activeConv.otherUser?.username}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Body (Messages List) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-brand-cream-card/30">
                {loadingMsgs ? (
                  <div className="py-12 text-center text-brand-charcoal-muted text-xs font-bold flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-coral" />
                    <span>Loading chat...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isSelf = msg.senderId === user.id || msg.senderId === user.firebaseUid;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      >
                        <div className={`max-w-[78%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs space-y-1 ${
                          isSelf
                            ? 'bg-brand-coral text-white rounded-br-none'
                            : 'bg-white border border-brand-cream-dark text-brand-charcoal rounded-bl-none'
                        }`}>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed break-words">
                            {msg.body}
                          </p>
                          <div className={`flex items-center justify-end space-x-1 text-[9px] font-bold ${
                            isSelf ? 'text-white/80' : 'text-brand-charcoal-muted'
                          }`}>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isSelf && (
                              <CheckCheck className={`w-3 h-3 ${msg.readAt ? 'text-white font-black' : 'text-white/60'}`} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-brand-charcoal-muted text-xs font-bold">
                    No messages in this chat yet. Say hi! 👋
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Footer Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-brand-cream-dark bg-white flex items-center space-x-2 sticky bottom-0"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message @${activeConv.otherUser?.username || 'user'}...`}
                  className="flex-1 bg-brand-cream-card border border-brand-cream-dark rounded-2xl px-4 py-2.5 text-xs font-medium text-brand-charcoal placeholder-brand-charcoal-muted focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral transition-all"
                  id="input-chat-message"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendingMsg}
                  className="px-4 py-2.5 bg-brand-coral text-white font-extrabold text-xs rounded-2xl shadow-coral hover:bg-brand-coral-dark disabled:opacity-50 transition-all flex items-center space-x-1.5 flex-shrink-0 active:scale-95"
                  id="btn-send-chat-message"
                >
                  {sendingMsg ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-brand-cream-card flex items-center justify-center text-brand-coral border border-brand-cream-dark">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-brand-charcoal">Your Conversations</h3>
                <p className="text-xs text-brand-charcoal-muted max-w-sm mt-1">
                  Select a chat from the left panel or click New Chat to message anyone on ScrollNom.
                </p>
              </div>
              <button
                onClick={() => setShowSearchModal(true)}
                className="px-5 py-2.5 bg-brand-coral text-white font-extrabold text-xs rounded-2xl shadow-coral hover:bg-brand-coral-dark transition-all"
              >
                Start New Chat
              </button>
            </div>
          )}
        </div>

      </div>

      {/* New Message User Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-modal border border-brand-cream-dark space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-brand-charcoal font-sans">New Message</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 rounded-full hover:bg-brand-cream-dark text-brand-charcoal-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-brand-charcoal-muted absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username or name..."
                className="w-full bg-brand-cream-card border border-brand-cream-dark rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-brand-charcoal focus:outline-none focus:border-brand-coral"
                autoFocus
                id="input-search-chat-user"
              />
            </div>

            {/* Search Results */}
            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {searching ? (
                <div className="py-8 text-center text-xs text-brand-charcoal-muted flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-coral" />
                  <span>Searching users...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleStartChatWithUser(u)}
                    className="p-3 rounded-2xl border border-brand-cream-dark hover:border-brand-coral hover:bg-brand-coral/5 transition-all cursor-pointer flex items-center space-x-3 group"
                  >
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={u.displayName || u.username}
                      className="w-10 h-10 rounded-full object-cover border border-white shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-brand-charcoal group-hover:text-brand-coral truncate">
                        {u.displayName || u.username}
                      </p>
                      <p className="text-[11px] text-brand-teal font-bold truncate">@{u.username}</p>
                    </div>
                    <button className="px-3 py-1 bg-brand-coral text-white font-extrabold text-[11px] rounded-xl shadow-xs">
                      Chat
                    </button>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="py-8 text-center text-xs text-brand-charcoal-muted font-bold">
                  No users found matching "{searchQuery}"
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-brand-charcoal-muted font-medium">
                  Type a username above to search and start a conversation.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
