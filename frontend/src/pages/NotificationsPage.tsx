import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, UserPlus, Heart, MessageCircle, MessageSquare,
  CheckCheck, ArrowLeft
} from 'lucide-react';
import useStore from '@/store';
import { LeftSidebar, T, Av } from '../components/layout/LeftSidebar';
import { RightSidebar } from '../components/layout/RightSidebar';
import NotificationService, { NotificationResponse, NotificationType } from '../services/notification.service';

// Zaman formatlama
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'az önce';
  if (diffMin < 60) return `${diffMin} dk`;
  if (diffHr < 24) return `${diffHr} sa`;
  if (diffDay < 7) return `${diffDay} gün`;
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// Bildirim türüne göre ikon ve renk
function NotifIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'FOLLOW':
      return (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-500/15 border border-blue-500/20 flex-shrink-0">
          <UserPlus className="w-4 h-4 text-blue-400" />
        </div>
      );
    case 'POST_REACTION':
      return (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-rose-500/15 border border-rose-500/20 flex-shrink-0">
          <Heart className="w-4 h-4 text-rose-400" />
        </div>
      );
    case 'COMMENT':
      return (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#ff7a00]/15 border border-[#ff7a00]/20 flex-shrink-0">
          <MessageCircle className="w-4 h-4 text-[#ff7a00]" />
        </div>
      );
    case 'COMMENT_REPLY':
      return (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-purple-500/15 border border-purple-500/20 flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-purple-400" />
        </div>
      );
  }
}

// Bildirim türüne göre metin
function notifText(type: NotificationType, senderName: string): string {
  switch (type) {
    case 'FOLLOW':
      return `${senderName} seni takip etmeye başladı`;
    case 'POST_REACTION':
      return `${senderName} gönderini beğendi`;
    case 'COMMENT':
      return `${senderName} gönderine yorum yaptı`;
    case 'COMMENT_REPLY':
      return `${senderName} yorumuna yanıt verdi`;
  }
}

// Tek bildirim satırı
function NotificationItem({
  notif,
  onRead,
}: {
  notif: NotificationResponse;
  onRead: (id: string) => void;
}) {
  const navigate = useNavigate();
  const senderName = notif.sender?.fullName || notif.sender?.username || 'Biri';
  const initials = senderName.slice(0, 2).toUpperCase();

  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id);
    if (notif.referenceId) {
      if (notif.type === 'FOLLOW') {
        navigate(`/@${notif.sender?.username}`);
      } else {
        navigate(`/posts/${notif.referenceId}`);
      }
    } else if (notif.sender?.username) {
      navigate(`/@${notif.sender.username}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-[#ffffff08] ${
        !notif.isRead
          ? 'bg-[#ff7a00]/[0.04] hover:bg-[#ff7a00]/[0.07]'
          : 'hover:bg-white/[0.02]'
      }`}
    >
      {/* Okunmamış nokta */}
      <div className="flex-shrink-0 w-2 flex items-center justify-center mt-3.5">
        {!notif.isRead && (
          <span className="w-2 h-2 rounded-full bg-[#ff7a00] flex-shrink-0" />
        )}
      </div>

      {/* Tür ikonu */}
      <NotifIcon type={notif.type} />

      {/* Gönderen avatar */}
      <Av
        url={notif.sender?.avatarUrl}
        initials={initials}
        color={T.accent}
        size={40}
      />

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] leading-snug ${notif.isRead ? 'text-gray-300' : 'text-white font-medium'}`}>
          {notifText(notif.type, senderName)}
        </p>
        <p className="text-[12px] text-gray-600 mt-1">{timeAgo(notif.createdAt)}</p>
      </div>
    </motion.div>
  );
}

const MOCK_USER = {
  id: 'dev', username: 'gramdituser', email: 'demo@gramdit.com',
  fullName: 'Demo Kullanıcı', bio: null as string | null,
  avatarUrl: null as string | null, bannerUrl: null as string | null,
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const storeUser = useStore(s => s.user);
  const user = storeUser ?? MOCK_USER;

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getAll();
      setNotifications(data);
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    try {
      await NotificationService.markAsRead(id);
    } catch (err) {
      console.error('Bildirim okundu işaretlenemedi:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await NotificationService.markAllAsRead();
    } catch (err) {
      console.error('Tümü okundu işaretlenemedi:', err);
      fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="flex justify-center w-full min-h-screen bg-transparent">
      <div className="flex w-full max-w-[1225px] h-screen overflow-hidden relative justify-center">

        {/* Sol Sidebar */}
        <LeftSidebar user={user} onCompose={() => navigate('/')} />

        {/* Orta Panel */}
        <main className="w-full max-w-[600px] flex-shrink-1 h-screen overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-r border-[#ffffff14] flex flex-col bg-black/10 backdrop-blur-[1px]">

          {/* Sticky Header */}
          <div className="sticky top-0 bg-[#050505]/80 backdrop-blur-md z-40 border-b border-[#ffffff14] h-[53px] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-[17px] font-bold text-white leading-tight">Bildirimler</h1>
                {unreadCount > 0 && (
                  <p className="text-[12px] text-[#ff7a00] leading-none">{unreadCount} okunmamış</p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50 px-3 py-1.5 rounded-full hover:bg-white/5"
              >
                <CheckCheck className="w-4 h-4" />
                Tümünü Okundu Say
              </button>
            )}
          </div>

          {/* İçerik */}
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Bildirimler yükleniyor...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-gray-600" />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-1">Henüz bildirim yok</h3>
              <p className="text-[13px] text-gray-500 max-w-[280px] leading-relaxed">
                Biri seni takip ettiğinde, gönderini beğendiğinde veya yorum yaptığında burada görünecek.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="flex flex-col w-full">
                {notifications.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onRead={handleMarkAsRead}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </main>

        {/* Sağ Sidebar */}
        <RightSidebar user={user} />
      </div>
    </div>
  );
}
