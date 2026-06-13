import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Users, ShieldAlert,
  Hash, BookOpen, Sparkles,
  ImageIcon, UserX, Ban, X, Edit3, Camera
} from 'lucide-react';
import useStore from '@/store';
import CommunityService, {
  CommunityResponse,
  CommunityMemberResponse,
  CommunityBanResponse
} from '../services/community.service';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { PostCard } from './HomePage';
import PostService, { PostResponse } from '../services/post.service';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const storeUser = useStore(s => s.user);
  
  const [community, setCommunity] = useState<CommunityResponse | null>(null);
  const [members, setMembers] = useState<CommunityMemberResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Community Modal States
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [communityName, setCommunityName] = useState<string>('');
  const [communityDesc, setCommunityDesc] = useState<string>('');
  const [communityAvatarUrl, setCommunityAvatarUrl] = useState<string>('');
  const [communityBannerUrl, setCommunityBannerUrl] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const [banDetails, setBanDetails] = useState<{
    reason: string | null;
    createdAt: string | null;
    bannedBy: { username: string; fullName: string | null } | null;
  } | null>(null);
  const [postText, setPostText] = useState<string>('');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(true);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [showMediaInput, setShowMediaInput] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);

  const [selectedMember, setSelectedMember] = useState<CommunityMemberResponse | null>(null);
  const [popupTop, setPopupTop] = useState<number>(100);
  const [roleMenuOpen, setRoleMenuOpen] = useState<boolean>(false);

  // Ban management states
  const [isBansModalOpen, setIsBansModalOpen] = useState<boolean>(false);
  const [bannedUsers, setBannedUsers] = useState<CommunityBanResponse[]>([]);
  const [loadingBans, setLoadingBans] = useState<boolean>(false);

  // Kick Modal States
  const [isKickModalOpen, setIsKickModalOpen] = useState<boolean>(false);
  const [kickTargetUser, setKickTargetUser] = useState<CommunityMemberResponse | null>(null);
  const [kickReason, setKickReason] = useState<string>('');

  // Ban Modal States
  const [isBanModalOpen, setIsBanModalOpen] = useState<boolean>(false);
  const [banTargetUser, setBanTargetUser] = useState<CommunityMemberResponse | null>(null);
  const [banReason, setBanReason] = useState<string>('Şüpheli veya spam hesap');
  const [banMessageDeleteHistory, setBanMessageDeleteHistory] = useState<string>('Önceki Saat');

  const handleMemberClick = (member: CommunityMemberResponse, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const calculatedTop = Math.min(window.innerHeight - 340, Math.max(20, rect.top - 80));
    setPopupTop(calculatedTop);
    setSelectedMember(member);
    setRoleMenuOpen(false);
  };

  const myMemberEntry = storeUser ? members.find(m => m.userId === storeUser.id) : null;
  const myRole = myMemberEntry?.role;

  const triggerKickModal = (member: CommunityMemberResponse) => {
    setKickTargetUser(member);
    setKickReason('');
    setIsKickModalOpen(true);
  };

  const executeKick = async () => {
    if (!community || !kickTargetUser) return;
    try {
      await CommunityService.kickMember(community.id, kickTargetUser.userId);
      setMembers(prev => prev.filter(m => m.userId !== kickTargetUser.userId));
      setSelectedMember(null);
      setIsKickModalOpen(false);
      setKickTargetUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Üye çıkarılamadı');
    }
  };

  const triggerBanModal = (member: CommunityMemberResponse) => {
    setBanTargetUser(member);
    setBanReason('Şüpheli veya spam hesap');
    setBanMessageDeleteHistory('Önceki Saat');
    setIsBanModalOpen(true);
  };

  const executeBan = async () => {
    if (!community || !banTargetUser) return;
    try {
      const fullReason = banReason === 'Diğer' ? 'Diğer sebep' : `${banReason} (Geçmiş temizliği: ${banMessageDeleteHistory})`;
      await CommunityService.banUser(community.id, banTargetUser.userId, fullReason);
      setMembers(prev => prev.filter(m => m.userId !== banTargetUser.userId));
      setSelectedMember(null);
      setIsBanModalOpen(false);
      setBanTargetUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Kullanıcı banlanamadı');
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'founder' | 'moderator' | 'vip' | 'member') => {
    if (!community) return;
    try {
      await CommunityService.updateMemberRole(community.id, targetUserId, newRole);
      setMembers(prev => prev.map(m => m.userId === targetUserId ? { ...m, role: newRole } : m));
      setSelectedMember(prev => prev && prev.userId === targetUserId ? { ...prev, role: newRole } : prev);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Rol güncellenemedi');
    }
  };

  const fetchBans = async () => {
    if (!community) return;
    setLoadingBans(true);
    try {
      const bans = await CommunityService.getBans(community.id);
      setBannedUsers(bans);
    } catch (err: any) {
      console.error('Failed to fetch bans:', err);
    } finally {
      setLoadingBans(false);
    }
  };

  const handleOpenBansList = () => {
    setIsBansModalOpen(true);
    fetchBans();
  };

  const handleUnban = async (targetUserId: string) => {
    if (!community) return;
    if (!window.confirm('Bu kullanıcının banını kaldırmak istediğinize emin misiniz?')) return;
    try {
      await CommunityService.unbanUser(community.id, targetUserId);
      setBannedUsers(prev => prev.filter(b => b.userId !== targetUserId));
      alert('Kullanıcı banı kaldırıldı.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ban kaldırılamadı');
    }
  };

  const fetchPosts = async () => {
    if (!slug) return;
    try {
      setPostsLoading(true);
      const data = await PostService.getCommunityPosts(slug);
      setPosts(data);
    } catch (err) {
      console.error('Failed to load community posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCommunityAndMembers = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const data = await CommunityService.getBySlug(slug);
        setCommunity(data);
        setCommunityName(data.name || '');
        setCommunityDesc(data.description || '');
        setCommunityAvatarUrl(data.avatarUrl || '');
        setCommunityBannerUrl(data.bannerUrl || '');
        
        // Fetch members list
        const membersList = await CommunityService.getMembers(data.id);
        setMembers(membersList);
        
        // Check if logged-in user is a member
        if (storeUser) {
          const isUserMember = membersList.some(m => m.userId === storeUser.id);
          setIsJoined(isUserMember);
          try {
            const banStatus = await CommunityService.checkBanStatus(data.id);
            setIsBanned(banStatus.isBanned);
            if (banStatus.isBanned) {
              setBanDetails({
                reason: banStatus.reason,
                createdAt: banStatus.createdAt,
                bannedBy: banStatus.bannedBy,
              });
            } else {
              setBanDetails(null);
            }
          } catch (banErr) {
            console.error('Failed to check ban status:', banErr);
          }
        }

        // Fetch posts
        await fetchPosts();
      } catch (err: any) {
        console.error('Failed to load community:', err);
        setError(err.message || 'Topluluk yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityAndMembers();
  }, [slug, storeUser]);

  const handleJoinToggle = async () => {
    if (!community || !storeUser) return;
    try {
      if (isJoined) {
        await CommunityService.leave(community.id);
        setIsJoined(false);
        setMembers(prev => prev.filter(m => m.userId !== storeUser.id));
      } else {
        const newMember = await CommunityService.join(community.id);
        setIsJoined(true);
        setMembers(prev => [...prev, {
          ...newMember,
          user: {
            id: storeUser.id,
            username: storeUser.username,
            email: storeUser.email,
            fullName: storeUser.fullName || null,
            avatarUrl: storeUser.avatarUrl || null,
          }
        }]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'İşlem başarısız';
      alert(msg);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !community) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const res = await CommunityService.uploadAvatar(community.id, formData);
      setCommunityAvatarUrl(res.avatarUrl);
    } catch (err: any) {
      console.error('Failed to upload community avatar:', err);
      setUpdateError(err.message || 'Topluluk resmi yüklenirken bir hata oluştu.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !community) return;

    const formData = new FormData();
    formData.append('banner', file);

    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const res = await CommunityService.uploadBanner(community.id, formData);
      setCommunityBannerUrl(res.bannerUrl);
    } catch (err: any) {
      console.error('Failed to upload community banner:', err);
      setUpdateError(err.message || 'Kapak resmi yüklenirken bir hata oluştu.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community) return;
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const updated = await CommunityService.update(community.id, {
        name: communityName.trim() || undefined,
        description: communityDesc.trim(),
        avatarUrl: communityAvatarUrl.trim() || null,
        bannerUrl: communityBannerUrl.trim() || null,
      });

      // Local state güncellemesi
      setCommunity(updated);
      setEditModalOpen(false);

      if (updated.slug !== community.slug) {
        navigate(`/c/${updated.slug}`, { replace: true });
      }
    } catch (err: any) {
      console.error('Failed to update community:', err);
      setUpdateError(err.message || 'Topluluk güncellenirken bir hata oluştu.');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{ animationDelay: `${i * 0.15}s` }}
              className="w-1.5 h-1.5 rounded-full bg-[#ff7a00] animate-bounce"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black px-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Topluluk Yüklenemedi</h1>
        <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
          {error || 'Aradığınız topluluk mevcut olmayabilir veya silinmiş olabilir.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#ff7a00] hover:bg-[#e86e00] text-white transition-all"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const initials = community.name.slice(0, 2).toUpperCase();
  const hasAvatar = !!community.avatarUrl;
  const hasBanner = !!community.bannerUrl;

  // Group members for the Discord-style sidebar
  const founders = members.filter(m => m.role === 'founder');
  const moderators = members.filter(m => m.role === 'moderator');
  const vips = members.filter(m => m.role === 'vip');
  const regularMembers = members.filter(m => m.role === 'member');

  // Total member count from live array state
  const liveMemberCount = members.length;

  return (
    <div className="flex w-full min-h-screen bg-transparent">
      <div className="flex w-full h-screen overflow-hidden relative">
        
        {/* SOL PANEL (Left Sidebar) */}
        <LeftSidebar user={storeUser} onCompose={() => {}} />

        {/* ORTA BÖLÜM (Center Feed) */}
        <main className="flex-1 min-w-0 h-screen overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-r border-[#ffffff14] flex flex-col bg-black/10 backdrop-blur-[1px]">
          
          {/* Sticky Mini Header */}
          <div className="sticky top-0 bg-[#050505]/75 backdrop-blur-md z-40 border-b border-[#ffffff14] w-full flex items-center h-[53px] px-4 gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-[17px] font-bold text-white truncate leading-tight">
                {community.name}
              </span>
              <span className="text-[12px] text-gray-500 truncate leading-none mt-0.5">
                {liveMemberCount} Üye
              </span>
            </div>
          </div>

          {/* Topluluk Banner */}
          <div
            className="relative w-full h-[220px] flex-shrink-0 overflow-hidden"
            style={{
              background: community.themeColor
                ? community.themeColor
                : 'linear-gradient(to right, #171717, rgba(42,18,0,0.2))'
            }}
          >
            {hasBanner ? (
              <img
                src={community.bannerUrl!}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative opacity-40">
                <Hash className="w-32 h-32 text-white/5 absolute -right-4 -bottom-4 rotate-12" />
                <Sparkles className="w-8 h-8 text-white/30" />
              </div>
            )}
          </div>

          {/* Topluluk Bilgileri Header Altı */}
          <div className="pt-14 px-4 flex flex-col w-full relative">
            {/* Topluluk Avatar Overlay */}
            <div className="absolute -top-[51px] left-4 z-10">
              {hasAvatar ? (
                <img
                  src={community.avatarUrl!}
                  alt={community.name}
                  className="w-[94px] h-[94px] rounded-2xl object-cover border-4 border-[#050505] shadow-xl"
                />
              ) : (
                <div
                  className="w-[94px] h-[94px] rounded-2xl border-4 border-[#050505] shadow-xl flex items-center justify-center font-bold text-[32px] text-white"
                  style={{
                    background: `linear-gradient(135deg, #222, #111)`,
                    borderImage: `linear-gradient(to bottom, #ff7a00, #222) 1`
                  }}
                >
                  <span className="bg-gradient-to-br from-[#ff7a00] to-orange-600 bg-clip-text text-transparent">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-tight">
                  {community.name}
                </h1>
                <p className="text-[13px] text-[#ff7a00] mt-0.5">
                  /c/{community.slug}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Düzenleme Butonu (Sadece Kurucu veya Moderatör ise) */}
                {(myRole === 'founder' || myRole === 'moderator') && (
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold text-white border border-white/10 hover:bg-white/5 active:scale-[0.97] transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                    Topluluğu Düzenle
                  </button>
                )}

                {/* Katıl/Katıldın Butonu (Local Simulation) */}
                <button
                  onClick={handleJoinToggle}
                  className={`px-5 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ${
                    isJoined
                      ? 'border border-[#ff7a00]/30 text-[#ff7a00] bg-[#ff7a00]/5 hover:bg-[#ff7a00]/10'
                      : 'bg-[#ff7a00] hover:bg-[#e86e00] text-white'
                  }`}
                >
                  {isJoined ? 'Katıldın' : 'Katıl'}
                </button>
              </div>
            </div>

            {/* Açıklama */}
            {community.description && (
              <p className="mt-3.5 text-[14.5px] leading-relaxed text-white/85">
                {community.description}
              </p>
            )}

            {/* İstatistikler & Tarih */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[13px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="font-bold text-white">{liveMemberCount}</span> Üye
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDate(community.createdAt)} tarihinde kuruldu</span>
              </div>
            </div>
          </div>

          {/* Ayırıcı */}
          <div className="border-b border-[#ffffff14] mt-6 flex-shrink-0" />

          {/* Gönderiler */}
          <div className="flex-1 w-full flex flex-col pb-20">
            {isBanned ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-6">
                  <Ban className="w-10 h-10 text-red-500 animate-pulse" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Sohbetten Yasaklandınız</h3>
                {banDetails ? (
                  <div className="bg-[#111214] border border-[#2b2d31] p-4 rounded-xl text-left w-full mt-4 flex flex-col gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Yasaklayan Yetkili</span>
                      <span className="text-sm font-medium text-white">
                        {banDetails.bannedBy?.fullName || (banDetails.bannedBy?.username ? `@${banDetails.bannedBy.username}` : 'Sistem')}
                      </span>
                    </div>
                    {banDetails.reason && (
                      <div>
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Yasaklanma Sebebi</span>
                        <span className="text-sm text-gray-300 italic">"{banDetails.reason}"</span>
                      </div>
                    )}
                    {banDetails.createdAt && (
                      <div>
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Tarih</span>
                        <span className="text-sm text-gray-400 font-mono">
                          {new Date(banDetails.createdAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-[13px] leading-relaxed">
                    Bir moderatör yasağınızı kaldırana kadar bu topluluğa katılamaz, gönderi gönderemez veya katkıda bulunamazsınız.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col w-full">
                {/* Twitter Tarzı Post Paylaşma Kutusu - Sadece Üyeler Paylaşabilir */}
                {isJoined ? (
                  <div className="px-4 py-4 border-b border-[#ffffff14] flex gap-3 bg-white/[0.01]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-neutral-900 border border-white/10 text-white font-bold text-sm select-none">
                      {(storeUser?.fullName || storeUser?.username || 'G').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={postText}
                        onChange={e => setPostText(e.target.value)}
                        disabled={publishing}
                        placeholder="Ne paylaşmak istiyorsun?"
                        className="w-full bg-transparent resize-none focus:outline-none text-[15px] leading-relaxed py-2 placeholder-gray-600 text-white disabled:opacity-55"
                        rows={3}
                      />
                      
                      {showMediaInput && (
                        <div className="pb-3 flex gap-2">
                          <input
                            type="text"
                            value={mediaUrl}
                            onChange={e => setMediaUrl(e.target.value)}
                            disabled={publishing}
                            placeholder="Görsel veya video URL'si ekleyin (örn. https://...)"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff7a00] disabled:opacity-50"
                          />
                          <select
                            value={mediaType}
                            onChange={e => setMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
                            disabled={publishing}
                            className="bg-[#0f0f0f] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff7a00] cursor-pointer disabled:opacity-50"
                          >
                            <option value="IMAGE">Resim</option>
                            <option value="VIDEO">Video</option>
                          </select>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04] mt-2">
                        <div className="flex items-center gap-2 text-[#ff7a00]">
                          <button
                            type="button"
                            disabled={publishing}
                            onClick={() => setShowMediaInput(p => !p)}
                            className={`p-2 rounded-full hover:bg-white/5 transition-colors disabled:opacity-30 ${showMediaInput ? 'text-[#ff7a00]' : 'text-gray-400'}`}
                            title="Medya ekle"
                          >
                            <ImageIcon className="w-[18px] h-[18px]" />
                          </button>
                        </div>
                        <button
                          disabled={!postText.trim() || publishing}
                          onClick={async () => {
                            if (!postText.trim() || !community) return;
                            setPublishing(true);
                            try {
                              const post = await PostService.create({
                                content: postText,
                                communityId: community.id
                              });
                              if (mediaUrl.trim()) {
                                await PostService.addMedia(post.id, {
                                  mediaUrl: mediaUrl.trim(),
                                  mediaType: mediaType
                                });
                              }
                              setPostText('');
                              setMediaUrl('');
                              setShowMediaInput(false);
                              await fetchPosts();
                            } catch (err) {
                              console.error('Gönderi paylaşılamadı:', err);
                            } finally {
                              setPublishing(false);
                            }
                          }}
                          className="px-5 py-1.5 rounded-full text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {publishing ? 'Paylaşılıyor...' : 'Paylaş'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Gönderiler Listesi */}
                <div className="flex flex-col w-full">
                  {postsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                      <p className="text-xs text-gray-500 font-medium">Gönderiler yükleniyor...</p>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                      <BookOpen className="w-12 h-12 text-gray-600 mb-4" />
                      <h3 className="text-white font-bold text-base mb-1">Henüz Gönderi Yok</h3>
                      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                        Bu toplulukta henüz paylaşım yapılmamış. İlk paylaşan siz olun!
                      </p>
                    </div>
                  ) : (
                    posts.map(p => (
                      <PostCard key={p.id} post={p} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </main>

        {/* SAĞ PANEL (Discord Tarzı Üyeler Sidebarı) */}
        <aside className="hidden lg:flex w-[300px] flex-shrink-0 h-screen sticky top-0 flex-col items-start border-l border-[#ffffff14] px-4 py-5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#080808]/60">
          <div className="w-full flex flex-col gap-4">
            
            {/* Topluluk Bilgi Kartı - Üst Banner Stili */}
            {community && (
              <div className="w-full rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0d0d0d]">
                {/* Mini Banner */}
                <div
                  className="w-full h-[72px] relative flex items-center justify-center overflow-hidden"
                  style={{
                    background: community.bannerUrl
                      ? `url(${community.bannerUrl}) center/cover`
                      : 'linear-gradient(135deg, #1a0a00 0%, #2a1200 50%, #0d0d0d 100%)'
                  }}
                >
                  {!community.bannerUrl && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#ff7a00]/20 to-transparent" />
                      <Hash className="absolute right-3 top-2 w-10 h-10 text-white/5 rotate-12" />
                    </>
                  )}
                  {/* Avatar küçük overlay */}
                  <div className="absolute -bottom-5 left-4">
                    {community.avatarUrl ? (
                      <img
                        src={community.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border-2 border-[#0d0d0d] shadow-lg"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl border-2 border-[#0d0d0d] shadow-lg flex items-center justify-center text-white text-[13px] font-extrabold"
                        style={{ background: 'linear-gradient(135deg, #ff7a00, #b34a00)' }}
                      >
                        {community.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* İçerik */}
                <div className="px-4 pt-8 pb-4 flex flex-col gap-3">
                  <div>
                    <h2 className="text-[14px] font-extrabold text-white leading-tight">
                      {community.name}
                    </h2>
                    <p className="text-[11px] text-[#ff7a00] mt-0.5">/c/{community.slug}</p>
                    {community.description && (
                      <p className="mt-2 text-[12px] text-gray-400 leading-relaxed line-clamp-2">
                        {community.description}
                      </p>
                    )}
                  </div>

                  {/* Stats satırı */}
                  <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/[0.05]">
                    <div className="flex flex-col">
                      <span className="text-[16px] font-extrabold text-white leading-none">
                        {liveMemberCount >= 1000 ? `${(liveMemberCount / 1000).toFixed(1)}K` : liveMemberCount}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">
                        Üye
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-extrabold text-white leading-none">
                        {posts.length >= 1000 ? `${(posts.length / 1000).toFixed(1)}K` : posts.length}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">
                        Gönderi
                      </span>
                    </div>
                  </div>

                  {/* Meta bilgi */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2 text-[11.5px] text-gray-500">
                      <Calendar className="w-3 h-3 text-gray-600 flex-shrink-0" />
                      <span>{formatDate(community.createdAt)} tarihinde kuruldu</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11.5px] text-gray-500">
                      <svg className="w-3 h-3 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{community.isPrivate ? 'Gizli Topluluk' : 'Herkese Açık'}</span>
                    </div>
                  </div>

                  {/* Founder/Moderator için Yönetim / Ban Listesi Butonu */}
                  {(myRole === 'founder' || myRole === 'moderator') && (
                    <button
                      type="button"
                      onClick={handleOpenBansList}
                      className="mt-2.5 w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/25 rounded-xl text-xs font-bold transition-all"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Banlı Kullanıcılar</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Üyeler başlığı */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                ÜYELER
              </span>
              <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full">
                {liveMemberCount}
              </span>
            </div>

            {/* Founders list */}
            {founders.length > 0 && (
              <div className="flex flex-col gap-0.5 w-full">
                <span className="text-[9.5px] font-extrabold tracking-wider text-[#ff7a00]/60 uppercase px-1 mb-1">
                  👑 Kurucu
                </span>
                {founders.map(f => (
                  <MemberItem key={f.id} member={f} color="#ff7a00" isOnline={true} onSelect={handleMemberClick} />
                ))}
              </div>
            )}

            {/* Moderators list */}
            {moderators.length > 0 && (
              <div className="flex flex-col gap-0.5 w-full">
                <span className="text-[9.5px] font-extrabold tracking-wider text-purple-400/60 uppercase px-1 mb-1">
                  🛡️ Moderatör
                </span>
                {moderators.map(m => (
                  <MemberItem key={m.id} member={m} color="#a855f7" isOnline={true} onSelect={handleMemberClick} />
                ))}
              </div>
            )}

            {/* VIPs list */}
            {vips.length > 0 && (
              <div className="flex flex-col gap-0.5 w-full">
                <span className="text-[9.5px] font-extrabold tracking-wider text-amber-400/60 uppercase px-1 mb-1">
                  ⭐ VIP
                </span>
                {vips.map(v => (
                  <MemberItem key={v.id} member={v} color="#eab308" isOnline={true} onSelect={handleMemberClick} />
                ))}
              </div>
            )}

            {/* Regular Members list */}
            {regularMembers.length > 0 && (
              <div className="flex flex-col gap-0.5 w-full">
                <span className="text-[9.5px] font-extrabold tracking-wider text-gray-500/70 uppercase px-1 mb-1">
                  👤 Üye
                </span>
                {regularMembers.map((m, idx) => (
                  <MemberItem key={m.id} member={m} color="#cccccc" isOnline={idx % 2 === 0} onSelect={handleMemberClick} />
                ))}
              </div>
            )}

            {/* Boş durum */}
            {liveMemberCount === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-8 h-8 text-gray-700 mb-2" />
                <p className="text-[12px] text-gray-600">Henüz üye yok</p>
              </div>
            )}

          </div>
        </aside>

        {/* Discord tarzı üye profili popup'ı */}
        <AnimatePresence>
          {selectedMember && (
            <>
              {/* Sayfa tıklandığında kapatmak için overlay */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setSelectedMember(null);
                  setRoleMenuOpen(false);
                }}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                className="absolute w-[300px] bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl z-50 overflow-hidden text-white flex flex-col"
                style={{
                  top: popupTop,
                  right: '315px', // Sidebar solunda
                }}
              >
                {/* Banner */}
                <div
                  className="w-full h-[60px] relative"
                  style={{
                    background: selectedMember.role === 'founder'
                      ? 'linear-gradient(135deg, #ff7a00, #b34a00)'
                      : selectedMember.role === 'moderator'
                      ? 'linear-gradient(135deg, #a855f7, #6b21a8)'
                      : selectedMember.role === 'vip'
                      ? 'linear-gradient(135deg, #eab308, #a16207)'
                      : 'linear-gradient(135deg, #2b2d31, #1e1f22)'
                  }}
                >
                  {/* Üst Sağ Aksiyonlar (Ban / Kick) */}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    {storeUser?.id !== selectedMember.userId && selectedMember.role !== 'founder' && (
                      (myRole === 'founder' || (myRole === 'moderator' && selectedMember.role !== 'moderator'))
                    ) && (
                      <>
                        <button
                          type="button"
                          onClick={() => triggerKickModal(selectedMember)}
                          title="Topluluktan Çıkar (Kick)"
                          className="p-1.5 rounded-full bg-black/40 hover:bg-rose-600/80 transition-colors text-white"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerBanModal(selectedMember)}
                          title="Topluluktan Banla (Ban)"
                          className="p-1.5 rounded-full bg-black/40 hover:bg-rose-700/80 transition-colors text-white"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Avatar Overlay */}
                <div className="px-4 relative pb-4">
                  <div className="absolute -top-10 left-4 rounded-full border-[6px] border-[#111214] overflow-hidden bg-[#111214]">
                    {selectedMember.user.avatarUrl ? (
                      <img
                        src={selectedMember.user.avatarUrl}
                        alt=""
                        className="w-[72px] h-[72px] rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-[72px] h-[72px] rounded-full bg-neutral-900 flex items-center justify-center text-white text-xl font-bold">
                        {selectedMember.user.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Kullanıcı Detayları */}
                  <div className="pt-10 flex flex-col">
                    <span className="text-[17px] font-extrabold text-white flex items-center gap-1.5">
                      {selectedMember.user.fullName || selectedMember.user.username}
                      {selectedMember.role === 'founder' && <span title="Topluluk Kurucusu">👑</span>}
                    </span>
                    <span className="text-[#b5bac1] text-xs font-semibold">
                      @{selectedMember.user.username}
                    </span>
                  </div>

                  {/* Roller Kısımı */}
                  <div className="mt-4 pt-3 border-t border-[#2b2d31]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#949ba4]">ROLLER</span>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1.5 relative">
                      
                      {/* Rol Rozeti */}
                      <div className="flex items-center gap-1.5 bg-[#2b2d31] text-xs font-semibold px-2 py-1 rounded-md text-white/95 border border-[#1e1f22]">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              selectedMember.role === 'founder'
                                ? '#ff7a00'
                                : selectedMember.role === 'moderator'
                                ? '#a855f7'
                                : selectedMember.role === 'vip'
                                ? '#eab308'
                                : '#80848e',
                          }}
                        />
                        <span>
                          {selectedMember.role === 'founder'
                            ? 'Kurucu'
                            : selectedMember.role === 'moderator'
                            ? 'Moderatör'
                            : selectedMember.role === 'vip'
                            ? 'VIP'
                            : 'Üye'}
                        </span>
                      </div>

                      {/* Founder ise + Rol Ekleme Tuşu */}
                      {myRole === 'founder' && selectedMember.role !== 'founder' && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                            className="w-6 h-6 rounded-md bg-[#2b2d31] hover:bg-[#35373c] text-[#b5bac1] hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
                            title="Rol Güncelle"
                          >
                            +
                          </button>

                          {/* 3. görseldeki gibi Rol Seçim Popup'ı */}
                          <AnimatePresence>
                            {roleMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute left-0 bottom-8 w-[200px] bg-[#1e1f22] border border-[#2b2d31] rounded-lg shadow-2xl py-1.5 z-50 overflow-hidden"
                              >
                                <span className="block px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#949ba4]">Rol Değiştir</span>
                                
                                {/* Moderatör Rolü */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextRole = selectedMember.role === 'moderator' ? 'member' : 'moderator';
                                    handleRoleChange(selectedMember.userId, nextRole);
                                    setRoleMenuOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left text-white"
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
                                  <span>Moderatör</span>
                                  {selectedMember.role === 'moderator' && <span className="ml-auto text-[10px] text-[#ff7a00]">✔</span>}
                                </button>

                                {/* VIP Rolü */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextRole = selectedMember.role === 'vip' ? 'member' : 'vip';
                                    handleRoleChange(selectedMember.userId, nextRole);
                                    setRoleMenuOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left text-white"
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                                  <span>VIP</span>
                                  {selectedMember.role === 'vip' && <span className="ml-auto text-[10px] text-[#ff7a00]">✔</span>}
                                </button>

                                {/* Üye Rolü */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRoleChange(selectedMember.userId, 'member');
                                    setRoleMenuOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left text-white"
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#80848e]" />
                                  <span>Üye</span>
                                  {selectedMember.role === 'member' && <span className="ml-auto text-[10px] text-[#ff7a00]">✔</span>}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Banlı Kullanıcılar Modalı */}
        <AnimatePresence>
          {isBansModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              {/* Modal Kapatma Overlay */}
              <div className="absolute inset-0" onClick={() => setIsBansModalOpen(false)} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white flex flex-col max-h-[80vh] z-10"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2b2d31]">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <h3 className="font-extrabold text-sm tracking-wide">BANLANAN KULLANICILAR</h3>
                  </div>
                  <button
                    onClick={() => setIsBansModalOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors text-sm font-semibold px-2 py-1 rounded hover:bg-white/5"
                  >
                    Kapat
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {loadingBans ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                      <span className="text-xs text-gray-500">Yükleniyor...</span>
                    </div>
                  ) : bannedUsers.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center gap-2">
                      <Users className="w-10 h-10 text-gray-700" />
                      <span className="text-xs text-gray-500 font-semibold">Bu toplulukta banlı üye bulunmamaktadır.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {bannedUsers.map((ban) => {
                        const init = ban.user.username.slice(0, 2).toUpperCase();
                        return (
                          <div key={ban.id} className="flex items-center justify-between gap-3 p-3 bg-[#1e1f22] border border-[#2b2d31] rounded-xl">
                            <div className="flex items-center gap-3 min-w-0">
                              {ban.user.avatarUrl ? (
                                <img
                                  src={ban.user.avatarUrl}
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover border border-white/5 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-white/5 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {init}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white truncate">
                                  {ban.user.fullName || ban.user.username}
                                </span>
                                <span className="text-[10px] text-gray-500 truncate leading-none mt-0.5">
                                  @{ban.user.username}
                                </span>
                                {ban.reason && (
                                  <span className="text-[10px] text-rose-400/80 mt-1 italic truncate" title={ban.reason}>
                                    Neden: {ban.reason}
                                  </span>
                                )}
                                <span className="text-[9px] text-gray-600 mt-0.5">
                                  @{ban.bannedBy.username} tarafından banlandı
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnban(ban.userId)}
                              className="px-2.5 py-1.5 bg-rose-600/10 hover:bg-rose-600 hover:text-white text-rose-500 rounded-lg text-[10px] font-bold border border-rose-500/20 hover:border-transparent transition-all flex-shrink-0"
                            >
                              Banı Kaldır
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Kick Modal */}
        <AnimatePresence>
          {isKickModalOpen && kickTargetUser && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="absolute inset-0" onClick={() => { setIsKickModalOpen(false); setKickTargetUser(null); }} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-[#18191c] border border-[#2b2d31] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white flex flex-col z-10 p-6 animate-in fade-in duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-extrabold text-lg leading-snug pr-8">
                    {kickTargetUser.user.username} kullanıcısını sunucudan at
                  </h3>
                  <button
                    onClick={() => { setIsKickModalOpen(false); setKickTargetUser(null); }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Subtitle */}
                <p className="text-xs text-[#b5bac1] leading-normal mb-6">
                  @{kickTargetUser.user.fullName || kickTargetUser.user.username} adlı kullanıcıyı sunucudan atmak istediğine emin misin? Yeni bir davetle tekrar katılabilir.
                </p>

                {/* Input label & textarea */}
                <div className="flex flex-col gap-2 mb-6">
                  <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">Atılma Sebebi</label>
                  <textarea
                    rows={3}
                    maxLength={150}
                    value={kickReason}
                    onChange={e => setKickReason(e.target.value)}
                    placeholder="Sebep girin (isteğe bağlı)..."
                    className="w-full bg-[#111214] border border-[#2b2d31] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a00] text-white resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsKickModalOpen(false); setKickTargetUser(null); }}
                    className="px-6 py-2.5 bg-[#2b2d31]/80 hover:bg-[#2b2d31] text-white rounded-xl text-sm font-bold transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={executeKick}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all"
                  >
                    At
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Ban Modal */}
        <AnimatePresence>
          {isBanModalOpen && banTargetUser && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="absolute inset-0" onClick={() => { setIsBanModalOpen(false); setBanTargetUser(null); }} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-[#18191c] border border-[#2b2d31] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white flex flex-col z-10 p-6 animate-in fade-in duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <h3 className="font-extrabold text-lg leading-snug pr-8">
                    @{banTargetUser.user.username} kullanıcısı engellensin mi?
                  </h3>
                  <button
                    onClick={() => { setIsBanModalOpen(false); setBanTargetUser(null); }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Subtitle */}
                <div className="flex flex-col gap-3 mb-5">
                  <span className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">Yasaklama nedeni *</span>
                  <div className="flex flex-col gap-2">
                    {[
                      'Şüpheli veya spam hesap',
                      'Ele geçirilmiş veya risk altındaki hesap',
                      'Sunucu kurallarını ihlal etmek',
                      'Diğer'
                    ].map(option => (
                      <div
                        key={option}
                        onClick={() => setBanReason(option)}
                        className="flex items-center gap-3 cursor-pointer py-1 group"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          banReason === option ? 'border-rose-500' : 'border-gray-500 group-hover:border-gray-300'
                        }`}>
                          {banReason === option && (
                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                          )}
                        </div>
                        <span className="text-sm text-gray-300 group-hover:text-white font-medium">
                          {option}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dropdown for message deletion history */}
                <div className="flex flex-col gap-2 mb-6">
                  <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">Mesaj Geçmişini Sil</label>
                  <div className="relative">
                    <select
                      value={banMessageDeleteHistory}
                      onChange={e => setBanMessageDeleteHistory(e.target.value)}
                      className="w-full bg-[#111214] border border-[#2b2d31] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 text-white appearance-none cursor-pointer"
                    >
                      <option value="Önceki Saat">Önceki Saat</option>
                      <option value="Son 24 Saat">Son 24 Saat</option>
                      <option value="Son 7 Gün">Son 7 Gün</option>
                      <option value="Hiçbiri">Hiçbiri</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsBanModalOpen(false); setBanTargetUser(null); }}
                    className="px-6 py-2.5 bg-[#2b2d31]/80 hover:bg-[#2b2d31] text-white rounded-xl text-sm font-bold flex-1 transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={executeBan}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex-1 transition-all"
                  >
                    Yasakla
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── EDIT COMMUNITY MODAL ── */}
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
                style={{ background: '#090909', border: `1px solid rgba(255, 255, 255, 0.08)` }}
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
                      <X className="w-4 h-4" />
                    </button>
                    <span className="text-[15.5px] font-bold text-white">Topluluğu Düzenle</span>
                  </div>

                  <button
                    type="submit"
                    form="edit-community-form"
                    disabled={updateLoading}
                    className="px-5 py-1.5 rounded-full text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] transition-all disabled:opacity-50"
                  >
                    {updateLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>

                {/* Form Body */}
                <form
                  id="edit-community-form"
                  onSubmit={handleUpdateCommunity}
                  className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh] bg-transparent"
                >
                  {updateError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold border border-rose-500/20">
                      ⚠️ {updateError}
                    </div>
                  )}

                  {/* Preview Banner & Avatar Block */}
                  <div className="flex flex-col gap-2 mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Topluluk Görseli & Kapak Fotoğrafı</span>
                    
                    {/* Gizli Dosya Girişleri */}
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={bannerInputRef}
                      onChange={handleBannerChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Kapsayıcı Alan */}
                    <div className="relative w-full h-[130px] mb-8">
                      {/* Kapak Görseli Kapsayıcısı */}
                      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900 h-full w-full group/banner">
                        {communityBannerUrl ? (
                          <img src={communityBannerUrl} alt="Banner Preview" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-neutral-900" />
                        )}

                        {/* Banner Yükleme Overlay Butonu */}
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={updateLoading}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover/banner:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-[11px] font-bold cursor-pointer"
                        >
                          <Camera className="w-5 h-5 text-white" />
                          Kapak Görseli Seç
                        </button>
                      </div>

                      {/* Profil Fotoğrafı Kapsayıcısı */}
                      <div className="absolute -bottom-6 left-6 rounded-full border-[3px] border-[#090909] bg-[#090909] shadow-lg overflow-hidden group/avatar w-16 h-16 z-20">
                        {communityAvatarUrl ? (
                          <img src={communityAvatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-neutral-950 flex items-center justify-center text-white text-xs font-bold">
                            {(communityName || 'C').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        
                        {/* Avatar Yükleme Overlay Butonu */}
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={updateLoading}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 italic text-center">Görselleri değiştirmek için üzerlerine tıklayın</span>
                  </div>

                  {/* Input: communityName */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Topluluk Adı</label>
                    <input
                      type="text"
                      required
                      value={communityName}
                      onChange={(e) => setCommunityName(e.target.value)}
                      disabled={updateLoading}
                      placeholder="Topluluk adı yazın"
                      className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff7a00] transition-colors disabled:opacity-55"
                    />
                  </div>

                  {/* Input: Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Açıklama</label>
                    <textarea
                      value={communityDesc}
                      onChange={(e) => setCommunityDesc(e.target.value)}
                      disabled={updateLoading}
                      placeholder="Topluluk hakkında bir şeyler paylaşın..."
                      rows={3}
                      maxLength={500}
                      className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff7a00] transition-colors disabled:opacity-55 resize-none"
                    />
                  </div>

                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// Discord-style member row
function MemberItem({
  member,
  color,
  isOnline,
  onSelect,
}: {
  member: CommunityMemberResponse;
  color: string;
  isOnline: boolean;
  onSelect: (member: CommunityMemberResponse, e: React.MouseEvent) => void;
}) {
  const mInitials = member.user.username.slice(0, 2).toUpperCase();
  return (
    <div
      onClick={(e) => onSelect(member, e)}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
      title={`@${member.user.username}`}
    >
      <div className="relative">
        {member.user.avatarUrl ? (
          <img
            src={member.user.avatarUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-white/5"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-white text-[11px] font-bold">
            {mInitials}
          </div>
        )}
        {/* Status dot indicator (Discord style) */}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${
            isOnline ? 'bg-green-500 animate-pulse' : 'bg-neutral-600'
          }`}
        />
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className="text-[13px] font-semibold truncate leading-tight group-hover:text-white"
          style={{ color }}
        >
          {member.user.fullName || member.user.username}
        </span>
        <span className="text-[10px] text-gray-500 leading-none truncate group-hover:text-gray-400">
          @{member.user.username}
        </span>
      </div>
    </div>
  );
}
