import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Edit3, X, Image as ImageIcon, MessageCircle, AlertCircle } from 'lucide-react';
import useStore from '@/store';
import UserService, { ProfileResponse } from '../services/user.service';
import { LeftSidebar, T } from '../components/layout/LeftSidebar';
import { RightSidebar } from '../components/layout/RightSidebar';

// Fallback user values if store user is null
const MOCK_USER = {
  id: 'dev',
  username: 'gramdituser',
  email: 'demo@gramdit.com',
  fullName: 'Demo Kullanıcı',
  bio: null as string | null,
  avatarUrl: null as string | null,
  bannerUrl: null as string | null,
};

type AppUser = typeof MOCK_USER;

// Avatar component helper
function ProfileAv({
  url, initials, color, size = 110, className = '',
}: {
  url?: string | null; initials: string; color: string; size?: number; className?: string;
}) {
  const d = { width: size, height: size, minWidth: size };
  if (url) return <img src={url} alt="" style={d} className={`rounded-full object-cover flex-shrink-0 ${className}`} />;
  return (
    <div style={{ ...d, background: `${color}20`, border: `2.5px solid ${color}45` }}
      className={`rounded-full flex items-center justify-center flex-shrink-0 select-none ${className}`}>
      <span style={{ color, fontSize: size * 0.35 }} className="font-bold leading-none">{initials}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const storeUser = useStore(s => s.user);
  const setState = useStore(s => s.setState);
  const currentUser = (storeUser ?? MOCK_USER) as AppUser;

  // Profile being viewed
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs: 'posts' | 'media' | 'comments'
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'comments'>('posts');
  
  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Form States for Edit Profile
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Normalize username param (removing @ if present)
  const targetUsername = username ? username.replace(/^@/, '') : '';

  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === targetUsername.toLowerCase();

  const fetchProfile = async () => {
    if (!targetUsername) return;
    try {
      setLoading(true);
      setError(null);
      
      const data = await UserService.getProfileByUsername(targetUsername);
      setProfile(data);
      
      // Initialize edit fields
      setFullName(data.fullName || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatarUrl || '');
      setBannerUrl(data.bannerUrl || '');
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.message || 'Kullanıcı profili yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetUsername]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const updated = await UserService.updateProfile({
        fullName: fullName.trim() || undefined,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        bannerUrl: bannerUrl.trim(),
      });
      
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updated } : null);
      
      // Update global store
      const newUserData = { ...currentUser, ...updated };
      setState({ user: newUserData });
      localStorage.setItem('gramdit_user', JSON.stringify(newUserData));
      
      setEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setUpdateError(err.response?.data?.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const initials = (profile?.fullName || profile?.username || 'U').slice(0, 2).toUpperCase();
  const accentColor = '#ff7a00';

  const joinDate = profile?.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
    : 'Haziran 2026';

  return (
    <div className="flex justify-center w-full min-h-screen bg-transparent">
      <div className="flex w-full max-w-[1225px] h-screen overflow-hidden relative justify-center">
        {/* LEFT SIDEBAR */}
        <LeftSidebar user={currentUser} onCompose={() => navigate('/')} />

        {/* CENTER COLUMN */}
        <main className="w-full max-w-[600px] flex-shrink-1 h-screen overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-r border-[#ffffff14] flex flex-col bg-black/10 backdrop-blur-[1px]">
          
          {/* Header */}
          <div className="sticky top-0 bg-[#050505]/75 backdrop-blur-md z-40 border-b border-[#ffffff14] h-[53px] flex items-center px-4 gap-6">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-[17px] font-bold text-white truncate leading-tight">
                {loading ? 'Yükleniyor...' : profile?.fullName || profile?.username}
              </span>
              <span className="text-[12px] text-gray-500 leading-none mt-0.5">
                {loading ? '' : `@${profile?.username}`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Profil yükleniyor...</p>
            </div>
          ) : error || !profile ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12 px-6 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-3 opacity-80" />
              <p className="text-[15px] font-bold text-white mb-1">Profil Bulunamadı</p>
              <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed mb-4">
                {error || 'Aradığınız kullanıcı mevcut değil veya bir hata oluştu.'}
              </p>
              <button 
                onClick={() => navigate('/')}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] transition-colors"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              
              {/* ── BANNER & AVATAR AREA ── */}
              <div className="relative w-full h-[180px] sm:h-[200px] bg-neutral-900 overflow-hidden flex-shrink-0">
                {profile.bannerUrl ? (
                  <img 
                    src={profile.bannerUrl} 
                    alt="Banner" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#121212] via-[#1c1c1c] to-[#0a0a0a]" />
                )}
                
                {/* Overlay shadow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              </div>

              {/* Profile Meta Info Row */}
              <div className="px-4 pb-4 flex flex-col relative">
                
                {/* Avatar position overlaps banner */}
                <div className="absolute -top-[55px] sm:-top-[65px] left-4 rounded-full border-[4px] border-[#050505] bg-[#050505] shadow-xl overflow-hidden z-10">
                  <ProfileAv 
                    url={profile.avatarUrl} 
                    initials={initials} 
                    color={accentColor} 
                    size={isOwnProfile ? 100 : 110} 
                  />
                </div>

                {/* Edit Button or Takip Et space */}
                <div className="flex justify-end h-[50px] items-center pt-2">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setEditModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold text-white border border-white/10 hover:bg-white/5 active:scale-[0.97] transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Profili Düzenle
                    </button>
                  ) : (
                    // Takip et butonu şimdilik eklenmeyecek
                    <div className="h-8" />
                  )}
                </div>

                {/* Name & Bio Block */}
                <div className="mt-2.5">
                  <h1 className="text-[20px] sm:text-[22px] font-extrabold text-white leading-tight">
                    {profile.fullName || profile.username}
                  </h1>
                  <p className="text-[14px] text-gray-500 font-medium leading-tight">
                    @{profile.username}
                  </p>
                  
                  {profile.bio ? (
                    <p className="mt-3 text-[14.5px] leading-relaxed text-white/90 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  ) : (
                    isOwnProfile && (
                      <p 
                        onClick={() => setEditModalOpen(true)}
                        className="mt-3 text-[13px] leading-relaxed text-gray-600 hover:text-white/50 cursor-pointer italic"
                      >
                        Kendiniz hakkında bir şeyler yazın...
                      </p>
                    )
                  )}

                  {/* Joined Date */}
                  <div className="flex items-center gap-1.5 mt-3.5 text-[13px] text-gray-500">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span>{joinDate} tarihinde katıldı</span>
                  </div>
                </div>

              </div>

              {/* ── TABS ── */}
              <div className="flex w-full border-b border-[#ffffff14] mt-2 bg-[#050505]">
                {(['posts', 'media', 'comments'] as const).map((tab) => {
                  const label = tab === 'posts' ? 'Gönderiler' : tab === 'media' ? 'Medya' : 'Yorumlar';
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="flex-1 flex flex-col items-center justify-center relative py-3.5 font-bold text-[14px] transition-colors"
                      style={{ color: active ? T.text : T.muted }}
                    >
                      <span>{label}</span>
                      {active && (
                        <motion.div
                          layoutId="profileTabUnderline"
                          className="absolute bottom-0 w-[60px] h-[3px] rounded-full bg-[#ff7a00]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents Placeholder */}
              <div className="flex flex-col w-full pb-20">
                {activeTab === 'posts' && (
                  <div className="text-center py-16 px-4">
                    <ImageIcon className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-3" />
                    <p className="text-[14px] font-bold text-white mb-1">Henüz gönderi yok</p>
                    <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                      @{profile.username} kullanıcısının paylaştığı gönderiler yakında burada listelenecek.
                    </p>
                  </div>
                )}
                {activeTab === 'media' && (
                  <div className="text-center py-16 px-4">
                    <ImageIcon className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-3" />
                    <p className="text-[14px] font-bold text-white mb-1">Medya bulunamadı</p>
                    <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                      @{profile.username} kullanıcısının paylaştığı görsel ve videolar burada görünecek.
                    </p>
                  </div>
                )}
                {activeTab === 'comments' && (
                  <div className="text-center py-16 px-4">
                    <MessageCircle className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-3" />
                    <p className="text-[14px] font-bold text-white mb-1">Yorum bulunamadı</p>
                    <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                      @{profile.username} kullanıcısının yazdığı yanıtlar burada listelenecek.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

        </main>

        {/* RIGHT SIDEBAR */}
        <RightSidebar user={currentUser} />
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      <AnimatePresence>
        {editModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
            onClick={(e) => { if (e.target === e.currentTarget && !updateLoading) setEditModalOpen(false); }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: -15, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -8, opacity: 0 }}
              className="w-full max-w-[520px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{ background: '#090909', border: `1px solid ${T.border}` }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#090909]">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    disabled={updateLoading}
                    className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all disabled:opacity-30"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                  <span className="text-[15.5px] font-bold text-white">Profili Düzenle</span>
                </div>
                
                <button
                  type="submit"
                  form="edit-profile-form"
                  disabled={updateLoading}
                  className="px-5 py-1.5 rounded-full text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] transition-all disabled:opacity-50"
                >
                  {updateLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>

              {/* Form Body */}
              <form 
                id="edit-profile-form" 
                onSubmit={handleUpdateProfile} 
                className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh] bg-transparent"
              >
                {updateError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold border border-rose-500/20">
                    ⚠️ {updateError}
                  </div>
                )}

                {/* Real Preview Banner & Avatar Block */}
                <div className="flex flex-col gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Görünüm Önizleme</span>
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900 h-[110px] w-full">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-neutral-900" />
                    )}
                    <div className="absolute bottom-2 left-4 rounded-full border-2 border-black overflow-hidden bg-neutral-800">
                      <ProfileAv url={avatarUrl} initials={initials} color={accentColor} size={48} />
                    </div>
                  </div>
                </div>

                {/* Input: fullName */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={updateLoading}
                    placeholder="Adınızı ve soyadınızı yazın"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff7a00] transition-colors disabled:opacity-55"
                  />
                </div>

                {/* Input: Bio */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Hakkımda (Bio)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={updateLoading}
                    placeholder="Kendiniz hakkında bir şeyler paylaşın..."
                    rows={3}
                    maxLength={500}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff7a00] transition-colors disabled:opacity-55 resize-none"
                  />
                </div>

                {/* Input: avatarUrl */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Profil Resmi URL (Avatar)</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    disabled={updateLoading}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff7a00] transition-colors disabled:opacity-55"
                  />
                </div>

                {/* Input: bannerUrl */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Kapak Görseli URL (Banner)</label>
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    disabled={updateLoading}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff7a00] transition-colors disabled:opacity-55"
                  />
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
