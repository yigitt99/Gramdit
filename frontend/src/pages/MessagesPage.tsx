import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, Search, Send, X, Check,
  ChevronLeft, Users
} from 'lucide-react';
import useStore from '@/store';
import { LeftSidebar, Av } from '../components/layout/LeftSidebar';
import DmService, { DmConversationResponse, DmMessageResponse } from '../services/dm.service';
import UserService, { FollowUserResponse } from '../services/user.service';
import { io, Socket } from 'socket.io-client';

const MOCK_USER = {
  id: 'dev',
  username: 'gramdituser',
  email: 'demo@gramdit.com',
  fullName: 'Demo Kullanıcı',
  avatarUrl: null as string | null,
};

export default function MessagesPage() {
  const navigate = useNavigate();
  const storeUser = useStore(s => s.user);
  const currentUser = storeUser ?? MOCK_USER;

  // State
  const [conversations, setConversations] = useState<DmConversationResponse[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessageResponse[]>([]);
  const [msgContent, setMsgContent] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // New Chat Modal State
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FollowUserResponse[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Fetch Conversations
  const fetchConversations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoadingConvs(true);
      const data = await DmService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (showLoading) setLoadingConvs(false);
    }
  }, []);

  // Fetch Messages for active conversation
  const fetchMessages = useCallback(async (convId: string, showLoading = false) => {
    try {
      if (showLoading) setLoadingMsgs(true);
      const data = await DmService.getMessages(convId);
      
      // Sadece yeni mesaj geldiyse veya uzunluk değiştiyse state güncelle ve aşağı kaydır
      setMessages(prev => {
        const isLengthChanged = prev.length !== data.length;
        const isLastMsgChanged = prev.length > 0 && data.length > 0 && prev[prev.length - 1].id !== data[data.length - 1].id;
        
        if (isLengthChanged || isLastMsgChanged || prev.length === 0) {
          setTimeout(() => scrollToBottom(prev.length === 0 ? 'auto' : 'smooth'), 50);
          return data;
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (showLoading) setLoadingMsgs(false);
    }
  }, [scrollToBottom]);

  // Initial Load
  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  // Socket.IO lifetime management
  useEffect(() => {
    const token = localStorage.getItem('gramdit_token');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const serverUrl = apiBaseUrl.replace('/api/v1', '');

    // Connect to /dm namespace with JWT handshake authorization
    const socket = io(`${serverUrl}/dm`, {
      auth: {
        token: `Bearer ${token}`
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('DM WebSocket Connected');
      if (activeConvId) {
        socket.emit('join_conversation', { conversationId: activeConvId });
      }
    });

    socket.on('disconnect', () => {
      console.log('DM WebSocket Disconnected');
    });

    socket.on('error', (err: any) => {
      console.error('WebSocket error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Run once on page mount

  // Handle active conversation room join & real-time socket events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    if (activeConvId) {
      // Emit join_conversation event
      socket.emit('join_conversation', { conversationId: activeConvId });
    }

    const handleNewMessage = (newMessage: DmMessageResponse) => {
      if (newMessage.conversationId === activeConvId) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;

          // Replace optimistic temp message
          const tempMsgIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.content === newMessage.content);
          if (tempMsgIndex !== -1) {
            const updated = [...prev];
            updated[tempMsgIndex] = newMessage;
            return updated;
          }

          return [...prev, newMessage];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
      }

      // Automatically update conversations list order and details
      setConversations(prevConvs => {
        const updatedConvs = prevConvs.map(conv => {
          if (conv.id === newMessage.conversationId) {
            return {
              ...conv,
              updatedAt: newMessage.createdAt,
              lastMessage: {
                id: newMessage.id,
                content: newMessage.content,
                createdAt: newMessage.createdAt,
                sender: {
                  id: newMessage.sender.id,
                  username: newMessage.sender.username,
                }
              }
            };
          }
          return conv;
        });
        return [...updatedConvs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    };

    const handleMessageReceived = (receivedMessage: DmMessageResponse) => {
      if (receivedMessage.conversationId === activeConvId) {
        setMessages(prev => {
          if (prev.some(m => m.id === receivedMessage.id)) return prev;

          const tempMsgIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.content === receivedMessage.content);
          if (tempMsgIndex !== -1) {
            const updated = [...prev];
            updated[tempMsgIndex] = receivedMessage;
            return updated;
          }

          return [...prev, receivedMessage];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_received', handleMessageReceived);

    // Initial fetch when switching conversations
    if (activeConvId) {
      fetchMessages(activeConvId, true);
    } else {
      setMessages([]);
    }

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_received', handleMessageReceived);
    };
  }, [activeConvId, fetchMessages, scrollToBottom]);

  // Polling only for backup of conversation list (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchConversations]);

  // User Search for New Chat
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!newChatModalOpen) return;
      setLoadingSearch(true);
      try {
        const users = await UserService.getUsers(searchQuery);
        // Kendimizi listeden çıkartalım
        setSearchResults(users.filter(u => u.id !== currentUser.id));
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, newChatModalOpen, currentUser.id]);

  // Send Message (via WebSocket with REST fallback)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !msgContent.trim()) return;

    const contentToSend = msgContent.trim();
    setMsgContent('');

    // Optimistik yerel mesaj ekleme
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: DmMessageResponse = {
      id: tempId,
      conversationId: activeConvId,
      senderId: currentUser.id,
      content: contentToSend,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName,
        avatarUrl: currentUser.avatarUrl,
      }
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom('smooth'), 50);

    const socket = socketRef.current;
    if (socket && socket.connected) {
      // Emit send_message event via Socket.IO
      socket.emit('send_message', { conversationId: activeConvId, content: contentToSend });
    } else {
      // Fallback: Send via HTTP REST API
      try {
        const sent = await DmService.sendMessage(activeConvId, contentToSend);
        setMessages(prev => prev.map(m => m.id === tempId ? sent : m));
        fetchConversations(false);
      } catch (err) {
        console.error('Failed to send message via REST API:', err);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    }
  };

  // Toggle user selection for new chat
  const handleUserSelect = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Create/Start Conversation
  const handleStartConversation = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      const conv = await DmService.createConversation(selectedUserIds);
      await fetchConversations(false);
      setActiveConvId(conv.id);
      setNewChatModalOpen(false);
      setSelectedUserIds([]);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  // Helper to format conversation title
  const getConversationTitle = (conv: DmConversationResponse) => {
    const otherMembers = conv.members.filter(m => m.user.id !== currentUser.id);
    if (otherMembers.length === 0) return 'Kendi Sohbetim';
    if (otherMembers.length === 1) return otherMembers[0].user.fullName || otherMembers[0].user.username;
    
    // Grup sohbeti durumunda
    return otherMembers.map(m => m.user.username).join(', ');
  };

  // Helper to format members description
  const getConversationSubtitle = (conv: DmConversationResponse) => {
    const otherMembers = conv.members.filter(m => m.user.id !== currentUser.id);
    if (otherMembers.length <= 1) {
      return otherMembers[0] ? `@${otherMembers[0].user.username}` : '';
    }
    return `${otherMembers.length} Üye`;
  };

  // Get active conversation detail
  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="flex justify-center w-full min-h-screen bg-transparent">
      <div className="flex w-full max-w-[1380px] h-screen overflow-hidden relative justify-center">
        {/* Left Sidebar */}
        <LeftSidebar user={currentUser} onCompose={() => navigate('/')} />

        {/* DM CONTAINER */}
        <main className="flex-1 flex h-screen border-r border-[#ffffff14] bg-black/10 backdrop-blur-[1px] text-white">
          {/* Kolon 1: Konuşma Listesi */}
          <div className="w-full sm:w-[320px] border-r border-[#ffffff14] flex flex-col h-full bg-[#050505]/40 flex-shrink-0">
            {/* Header */}
            <div className="h-[60px] border-b border-[#ffffff14] px-4 flex items-center justify-between">
              <h2 className="text-[17px] font-bold tracking-tight">Sohbetler</h2>
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="p-2 rounded-full hover:bg-white/5 text-[#ff7a00] hover:text-[#e86e00] transition-colors"
                title="Yeni Mesaj Başlat"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {loadingConvs ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
                  <div className="w-5 h-5 rounded-full border border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <span className="text-[11px]">Sohbetler yükleniyor...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-gray-500 gap-3">
                  <MessageSquare className="w-8 h-8 opacity-30" />
                  <p className="text-[13px] font-bold">Henüz mesajlaşma yok</p>
                  <button
                    onClick={() => setNewChatModalOpen(true)}
                    className="mt-1 px-4 py-1.5 rounded-full bg-[#ff7a00] hover:bg-[#e86e00] text-xs font-bold text-white transition-colors"
                  >
                    İlk Mesajı Gönder
                  </button>
                </div>
              ) : (
                conversations.map(conv => {
                  const active = conv.id === activeConvId;
                  const otherMembers = conv.members.filter(m => m.user.id !== currentUser.id);
                  const isGroup = otherMembers.length > 1;
                  const displayUser = otherMembers[0]?.user;
                  const initials = displayUser ? (displayUser.fullName || displayUser.username).slice(0, 2).toUpperCase() : 'S';

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-[#ffffff05] transition-all duration-150 ${
                        active
                          ? 'bg-white/[0.06] border-l-4 border-l-[#ff7a00] pl-3'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {isGroup ? (
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                      ) : (
                        <Av
                          url={displayUser?.avatarUrl}
                          initials={initials}
                          color="#ff7a00"
                          size={40}
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold truncate text-white">
                          {getConversationTitle(conv)}
                        </p>
                        <p className="text-[12px] truncate text-gray-500 mt-0.5">
                          {conv.lastMessage 
                            ? `${conv.lastMessage.sender.username === currentUser.username ? 'Sen: ' : ''}${conv.lastMessage.content}`
                            : getConversationSubtitle(conv)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolon 2: Mesaj Alanı */}
          <div className="flex-1 flex flex-col h-full bg-[#050505]/20">
            {activeConvId && activeConv ? (
              <>
                {/* Header */}
                <div className="h-[60px] border-b border-[#ffffff14] px-6 flex items-center justify-between bg-[#050505]/40 backdrop-blur-md z-10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConvId(null)}
                      className="p-1 rounded-full hover:bg-white/5 sm:hidden transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                      <h3 className="text-[15px] font-bold text-white">
                        {getConversationTitle(activeConv)}
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        {getConversationSubtitle(activeConv)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {loadingMsgs ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-500">
                      <div className="w-6 h-6 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                      <span className="text-xs">Mesajlar yükleniyor...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 gap-3">
                      <MessageSquare className="w-8 h-8 opacity-20" />
                      <p className="text-[13px]">Sohbeti başlatın</p>
                      <p className="text-[11px] max-w-[200px]">Buraya ilk mesajı yazarak doğrudan iletişim kurabilirsiniz.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      const senderInitials = (msg.sender.fullName || msg.sender.username).slice(0, 2).toUpperCase();

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2.5 max-w-[75%] ${
                            isMe ? 'self-end flex-row-reverse' : 'self-start'
                          }`}
                        >
                          {!isMe && (
                            <Av
                              url={msg.sender.avatarUrl}
                              initials={senderInitials}
                              color="#ff7a00"
                              size={28}
                              className="mb-0.5"
                            />
                          )}
                          <div className="flex flex-col gap-0.5">
                            {!isMe && (
                              <span className="text-[10px] text-gray-500 font-medium px-1">
                                {msg.sender.username}
                              </span>
                            )}
                            <div
                              className={`px-4 py-2 rounded-2xl text-[13.5px] leading-relaxed break-words ${
                                isMe
                                  ? 'bg-[#ff7a00] text-white rounded-br-none shadow-md shadow-[#ff7a00]/5'
                                  : 'bg-neutral-800 text-white rounded-bl-none'
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className={`text-[9px] text-gray-600 px-1 mt-0.5 ${isMe ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-[#ffffff14] flex items-center gap-3 bg-[#050505]/40"
                >
                  <input
                    type="text"
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    placeholder="Bir mesaj yazın..."
                    className="flex-1 bg-[#121212] border border-white/5 rounded-full px-5 py-2.5 text-[14px] focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]/30 transition-all placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={!msgContent.trim()}
                    className="p-2.5 rounded-full bg-[#ff7a00] text-white hover:bg-[#e86e00] disabled:bg-neutral-800 disabled:text-neutral-500 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-5 bg-white/[0.01]">
                  <MessageSquare className="w-9 h-9 text-[#ff7a00]/60" />
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2">Mesajlarınızı Görün</h3>
                <p className="text-[13px] text-[#8e8e8e] max-w-[280px] leading-relaxed mb-6">
                  Arkadaşlarınıza özel mesajlar, fotoğraflar ve gönderiler göndermeye başlayın.
                </p>
                <button
                  onClick={() => setNewChatModalOpen(true)}
                  className="px-6 py-2 rounded-full bg-[#ff7a00] hover:bg-[#e86e00] text-sm font-bold text-white transition-colors"
                >
                  Sohbet Başlat
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── NEW CHAT / MESSAGE DIALOG (Instagram Stili) ── */}
      <AnimatePresence>
        {newChatModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setNewChatModalOpen(false);
              setSelectedUserIds([]);
              setSearchQuery('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-[480px] rounded-xl overflow-hidden flex flex-col bg-[#000000] border border-white/10 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="text-[17px] font-bold text-white">Yeni Sohbet Başlat</h3>
                <button
                  type="button"
                  onClick={() => {
                    setNewChatModalOpen(false);
                    setSelectedUserIds([]);
                    setSearchQuery('');
                  }}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Search Box */}
              <div className="px-6 py-3.5 border-b border-white/5 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kullanıcı ara..."
                  className="w-full bg-transparent border-none focus:outline-none text-[14px] text-white placeholder-gray-500"
                />
              </div>

              {/* Users List */}
              <div className="overflow-y-auto max-h-[40vh] flex flex-col divide-y divide-white/5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {loadingSearch ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
                    <div className="w-5 h-5 rounded-full border border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <span className="text-[11px]">Kullanıcılar aranıyor...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                    <p className="text-xs font-semibold">Aradığınız kullanıcı bulunamadı.</p>
                  </div>
                ) : (
                  searchResults.map((usr) => {
                    const isSelected = selectedUserIds.includes(usr.id);
                    const usrName = usr.fullName || usr.username;
                    const initials = usrName.slice(0, 2).toUpperCase();

                    return (
                      <div
                        key={usr.id}
                        onClick={() => handleUserSelect(usr.id)}
                        className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Av
                            url={usr.avatarUrl}
                            initials={initials}
                            color="#ff7a00"
                            size={40}
                          />
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-white truncate">
                              {usr.username}
                            </p>
                            <p className="text-[12px] text-gray-500 truncate">{usr.fullName}</p>
                          </div>
                        </div>

                        {/* Checkbox (Spring transition) */}
                        <div
                          className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#ff7a00] border-[#ff7a00]'
                              : 'border-white/25 hover:border-white/40'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-[#050505]/60 border-t border-white/10 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setNewChatModalOpen(false);
                    setSelectedUserIds([]);
                    setSearchQuery('');
                  }}
                  className="px-5 py-1.5 rounded-full text-xs font-bold text-white bg-[#262626] border border-white/10 hover:bg-[#363636] transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={selectedUserIds.length === 0}
                  onClick={handleStartConversation}
                  className="px-5 py-1.5 rounded-full text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] disabled:bg-neutral-800 disabled:text-neutral-500 transition-colors"
                >
                  Sohbet Başlat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
