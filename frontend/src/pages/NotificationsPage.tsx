import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, UserPlus, Heart, MessageCircle, MessageSquare,
  CheckCheck, ArrowLeft, UserX, Ban, X, ShieldAlert
} from 'lucide-react';
import useStore from '@/store';
import { LeftSidebar, T, Av } from '../components/layout/LeftSidebar';
import { RightSidebar } from '../components/layout/RightSidebar';
import NotificationService, { NotificationResponse, NotificationType } from '../services/notification.service';
import CommunityService from '../services/community.service';
import UserService from '../services/user.service';


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
    case 'FOLLOW_REQUEST':
      return (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-amber-500/15 border border-amber-500/20 flex-shrink-0">
          <UserPlus className="w-4 h-4 text-amber-400" />
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
    case 'COMMUNITY_KICK':
      return (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-rose-500/15 border border-rose-500/20 flex-shrink-0">
          <UserX className="w-4 h-4 text-rose-400" />
        </div>
      );
    case 'COMMUNITY_BAN':
      return (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-600/15 border border-red-600/20 flex-shrink-0">
          <Ban className="w-4 h-4 text-red-500" />
        </div>
      );
  }
}

// Bildirim türüne göre metin
function notifText(type: NotificationType, senderName: string): string {
  switch (type) {
    case 'FOLLOW':
      return `${senderName} seni takip etmeye başladı`;
    case 'FOLLOW_REQUEST':
      return `${senderName} sana takip isteği gönderdi`;
    case 'POST_REACTION':
      return `${senderName} gönderini beğendi`;
    case 'COMMENT':
      return `${senderName} gönderine yorum yaptı`;
    case 'COMMENT_REPLY':
      return `${senderName} yorumuna yanıt verdi`;
    case 'COMMUNITY_KICK':
      return `${senderName} seni topluluktan attı`;
    case 'COMMUNITY_BAN':
      return `${senderName} seni topluluktan yasakladı (banladı)`;
  }
}

// Tek bildirim satırı
function NotificationItem({
  notif,
  onRead,
  onClickDetails,
}: {
  notif: NotificationResponse;
  onRead: (id: string) => void;
  onClickDetails: (notif: NotificationResponse) => void;
}) {
  const navigate = useNavigate();
  const senderName = notif.sender?.fullName || notif.sender?.username || 'Biri';
  const initials = senderName.slice(0, 2).toUpperCase();

  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id);
    if (notif.type === 'COMMUNITY_KICK' || notif.type === 'COMMUNITY_BAN') {
      onClickDetails(notif);
      return;
    }
    if (notif.referenceId) {
      if (notif.type === 'FOLLOW' || notif.type === 'FOLLOW_REQUEST') {
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
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [followRequestsModalOpen, setFollowRequestsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'following' | 'comments' | 'follows'>('all');
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationResponse | null>(null);

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'following') {
      return true; // Dummy filtre (tümüyle aynı çalışır)
    }
    if (filter === 'comments') {
      return notif.type === 'COMMENT' || notif.type === 'COMMENT_REPLY';
    }
    if (filter === 'follows') {
      return notif.type === 'FOLLOW' || notif.type === 'FOLLOW_REQUEST';
    }
    return true;
  });
  const [communityDetails, setCommunityDetails] = useState<any | null>(null);
  const [banDetails, setBanDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchFollowRequests = useCallback(async () => {
    try {
      const data = await UserService.getFollowRequests();
      setFollowRequests(data);
    } catch (err) {
      console.error('Takip istekleri yüklenemedi:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getAll();
      setNotifications(data);
      await fetchFollowRequests();
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFollowRequests]);

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

  const handleOpenDetails = async (notif: NotificationResponse) => {
    setSelectedNotif(notif);
    setCommunityDetails(null);
    setBanDetails(null);
    if (!notif.referenceId) return;

    setLoadingDetails(true);
    try {
      const comm = await CommunityService.getBySlug(notif.referenceId);
      setCommunityDetails(comm);

      if (notif.type === 'COMMUNITY_BAN') {
        const banInfo = await CommunityService.checkBanStatus(notif.referenceId);
        if (banInfo.isBanned) {
          setBanDetails({
            reason: banInfo.reason,
            createdAt: banInfo.createdAt,
            bannedBy: banInfo.bannedBy,
          });
        }
      }
    } catch (err) {
      console.error('Bildirim detayları yüklenemedi:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="flex justify-center w-full min-h-screen bg-transparent">
      <div className="flex w-full max-w-[1380px] h-screen overflow-hidden relative justify-center">

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

          {/* Filtreleme Butonları */}
          <div className="flex items-center gap-2 px-6 py-3.5 border-b border-[#ffffff08] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-4.5 py-1.5 rounded-full text-[13px] font-bold transition-all flex-shrink-0 duration-200 ${
                filter === 'all'
                  ? 'bg-white text-black font-extrabold'
                  : 'bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('following')}
              className={`px-4.5 py-1.5 rounded-full text-[13px] font-bold transition-all flex-shrink-0 duration-200 ${
                filter === 'following'
                  ? 'bg-white text-black font-extrabold'
                  : 'bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              Takip ettiğin kişiler
            </button>
            <button
              onClick={() => setFilter('comments')}
              className={`px-4.5 py-1.5 rounded-full text-[13px] font-bold transition-all flex-shrink-0 duration-200 ${
                filter === 'comments'
                  ? 'bg-white text-black font-extrabold'
                  : 'bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              Yorumlar
            </button>
            <button
              onClick={() => setFilter('follows')}
              className={`px-4.5 py-1.5 rounded-full text-[13px] font-bold transition-all flex-shrink-0 duration-200 ${
                filter === 'follows'
                  ? 'bg-white text-black font-extrabold'
                  : 'bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              Takipler
            </button>
          </div>

          {/* Takip İstekleri Barı */}
          {!loading && followRequests.length > 0 && (
            <div
              onClick={() => setFollowRequestsModalOpen(true)}
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/[0.02] border-b border-[#ffffff08] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center relative">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ff7a00] text-[10px] font-bold flex items-center justify-center text-white">
                    {followRequests.length}
                  </span>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-white">Takip İstekleri</h4>
                  <p className="text-[12px] text-gray-500">İstekleri incele ve yanıtla</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}

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
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-gray-600 animate-pulse" />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-1">Bu filtrede bildirim yok</h3>
              <p className="text-[13px] text-gray-500 max-w-[280px] leading-relaxed">
                {filter === 'comments' 
                  ? 'Yorum bildirimleri burada görünecek.' 
                  : filter === 'follows'
                  ? 'Takip bildirimleri burada görünecek.'
                  : 'Takip ettiğin kişilere ait bildirim bulunamadı.'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="flex flex-col w-full">
                {filteredNotifications.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onRead={handleMarkAsRead}
                    onClickDetails={handleOpenDetails}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </main>

        {/* Sağ Sidebar */}
        <RightSidebar user={user} />
      </div>

      {/* Detay Popup Modalı */}
      <AnimatePresence>
        {selectedNotif && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setSelectedNotif(null)} />
            
            {/* Modal container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl overflow-hidden text-white z-10 flex flex-col"
            >
              {/* Header Theme Banner */}
              <div
                className="w-full h-20 relative"
                style={{
                  background: communityDetails?.themeColor
                    ? `linear-gradient(180deg, ${communityDetails.themeColor} 0%, rgba(17, 18, 20, 0) 100%)`
                    : selectedNotif.type === 'COMMUNITY_BAN'
                    ? 'linear-gradient(180deg, rgba(220, 38, 38, 0.4) 0%, rgba(17, 18, 20, 0) 100%)'
                    : 'linear-gradient(180deg, rgba(245, 158, 11, 0.4) 0%, rgba(17, 18, 20, 0) 100%)'
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/45 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 pb-6 -mt-10 flex flex-col items-center text-center">
                {/* Community/Action Icon or Avatar */}
                <div className="relative mb-4">
                  {communityDetails?.avatarUrl ? (
                    <img
                      src={communityDetails.avatarUrl}
                      alt={communityDetails.name}
                      className="w-20 h-20 rounded-full border-4 border-[#111214] object-cover bg-neutral-900"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full border-4 border-[#111214] flex items-center justify-center bg-neutral-900 text-white font-bold text-2xl select-none"
                      style={{ color: communityDetails?.themeColor || '#ff7a00' }}
                    >
                      {(communityDetails?.name || 'T').slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#111214] ${
                    selectedNotif.type === 'COMMUNITY_BAN' ? 'bg-red-600' : 'bg-amber-500'
                  }`}>
                    {selectedNotif.type === 'COMMUNITY_BAN' ? (
                      <Ban className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <UserX className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                </div>

                {/* Loading spinner */}
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <p className="text-xs text-gray-500">Detaylar yükleniyor...</p>
                  </div>
                ) : (
                  <>
                    {/* Title */}
                    <h3 className="text-[18px] font-bold text-white leading-tight">
                      {communityDetails?.name || 'Topluluk'}
                    </h3>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {communityDetails?.slug ? `t/${communityDetails.slug}` : ''}
                    </p>

                    {/* Main Alert Banner */}
                    <div className={`w-full mt-5 px-4 py-3 rounded-xl border flex flex-col gap-1 items-center ${
                      selectedNotif.type === 'COMMUNITY_BAN' 
                        ? 'bg-red-600/10 border-red-600/20 text-red-400' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      <ShieldAlert className="w-5 h-5 mb-0.5" />
                      <span className="text-sm font-semibold">
                        {selectedNotif.type === 'COMMUNITY_BAN' ? 'Topluluktan Yasaklandınız' : 'Topluluktan Çıkarıldınız'}
                      </span>
                    </div>

                    {/* Description details */}
                    <div className="w-full mt-4 text-left flex flex-col gap-3.5 bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                      {/* Action User */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">İşlemi Yapan Yetkili</span>
                        <span className="text-gray-300 font-semibold">
                          {selectedNotif.sender?.fullName || (selectedNotif.sender?.username ? `@${selectedNotif.sender.username}` : 'Sistem')}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium font-sans">Tarih</span>
                        <span className="text-gray-400 font-mono">
                          {new Date(selectedNotif.createdAt).toLocaleString('tr-TR')}
                        </span>
                      </div>

                      {/* Reason (Only for Ban or if available) */}
                      {selectedNotif.type === 'COMMUNITY_BAN' && (
                        <div className="border-t border-white/[0.05] pt-3 mt-1">
                          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Yasaklanma Sebebi</span>
                          <p className="text-sm text-gray-300 italic bg-black/25 px-3 py-2.5 rounded-lg border border-white/[0.02]">
                            {banDetails?.reason ? `"${banDetails.reason}"` : '"Açıklama belirtilmedi"'}
                          </p>
                        </div>
                      )}

                      {selectedNotif.type === 'COMMUNITY_KICK' && (
                        <div className="border-t border-white/[0.05] pt-3 mt-1">
                          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Bilgi</span>
                          <p className="text-[13px] text-gray-400 leading-relaxed bg-black/25 px-3 py-2.5 rounded-lg border border-white/[0.02]">
                            Bu topluluktan çıkarıldınız. Dilerseniz topluluk arama kısmından veya doğrudan bağlantısını kullanarak bu topluluğa tekrar katılmayı deneyebilirsiniz.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => setSelectedNotif(null)}
                      className="w-full mt-6 py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      Kapat
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FOLLOW REQUESTS MODAL (Instagram Stili) ── */}
      <AnimatePresence>
        {followRequestsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setFollowRequestsModalOpen(false)}
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
                <h3 className="text-[17px] font-bold text-white">Takip İstekleri</h3>
                <button
                  type="button"
                  onClick={() => setFollowRequestsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Body / List */}
              <div className="overflow-y-auto max-h-[60vh] flex flex-col divide-y divide-white/5">
                {followRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-gray-500">
                    <UserPlus className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-semibold">Yeni takip isteği yok</p>
                  </div>
                ) : (
                  followRequests.map((req) => {
                    const reqUser = req.sender || {};
                    const reqUserName = reqUser.fullName || reqUser.username || 'Kullanıcı';
                    const reqInitials = reqUserName.slice(0, 2).toUpperCase();
                    return (
                      <div key={req.id} className="flex items-center justify-between px-6 py-4 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Av
                            url={reqUser.avatarUrl}
                            initials={reqInitials}
                            color={T.accent}
                            size={40}
                          />
                          <div className="min-w-0">
                            <p
                              onClick={() => {
                                setFollowRequestsModalOpen(false);
                                navigate(`/@${reqUser.username}`);
                              }}
                              className="text-[14px] font-bold text-white hover:underline cursor-pointer truncate"
                            >
                              {reqUser.username}
                            </p>
                            <p className="text-[12px] text-gray-400 truncate">{reqUser.fullName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await UserService.acceptFollowRequest(req.id);
                                setFollowRequests(prev => prev.filter(r => r.id !== req.id));
                              } catch (err) {
                                console.error('İstek onaylanamadı:', err);
                              }
                            }}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] transition-colors"
                          >
                            Onayla
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await UserService.rejectFollowRequest(req.id);
                                setFollowRequests(prev => prev.filter(r => r.id !== req.id));
                              } catch (err) {
                                console.error('İstek reddedilemedi:', err);
                              }
                            }}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#262626] border border-white/10 hover:bg-[#363636] transition-colors"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
