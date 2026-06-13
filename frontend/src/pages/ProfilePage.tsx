import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, MessageCircle, AlertCircle, Camera } from 'lucide-react';
import useStore from '@/store';
import UserService, { ProfileResponse } from '../services/user.service';
import { LeftSidebar, T } from '../components/layout/LeftSidebar';
import { RightSidebar } from '../components/layout/RightSidebar';
import PostService, { PostResponse } from '../services/post.service';
import { PostCard } from './HomePage';

// Fallback user values if store user is null
const MOCK_USER = {
  id: 'dev',
  username: 'gramdituser',
  email: 'demo@gramdit.com',
  fullName: 'Demo Kullanıcı',
  bio: null as string | null,
  website: null as string | null,
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

// Sayı formatlama (1200 → 1.2K)
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const formatWebsiteUrl = (url: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

const displayWebsiteText = (url: string) => {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '');
};

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

  // Tabs: 'posts' | 'reposts' | 'likes' | 'comments' | 'bookmarks'
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'likes' | 'comments' | 'bookmarks'>('posts');
  const [allPosts, setAllPosts] = useState<PostResponse[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostResponse[]>([]);
  const [reposts, setReposts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(true);

  // Follow durumu
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Form States for Edit Profile
  const [usernameVal, setUsernameVal] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [websiteVal, setWebsiteVal] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const res = await UserService.uploadAvatar(formData);
      setAvatarUrl(res.avatarUrl);
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setUpdateError(err.message || 'Profil resmi yüklenirken bir hata oluştu.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('banner', file);

    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const res = await UserService.uploadBanner(formData);
      setBannerUrl(res.bannerUrl);
    } catch (err: any) {
      console.error('Failed to upload banner:', err);
      setUpdateError(err.message || 'Kapak resmi yüklenirken bir hata oluştu.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Normalize username param (removing @ if present)
  const targetUsername = username ? username.replace(/^@/, '') : '';

  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === targetUsername.toLowerCase();

  const fetchProfile = useCallback(async () => {
    if (!targetUsername) return;
    try {
      setLoading(true);
      setError(null);

      const data = await UserService.getProfileByUsername(targetUsername);
      setProfile(data);
      setFollowerCount(data.followerCount ?? 0);
      setFollowingCount(data.followingCount ?? 0);

      // Initialize edit fields
      setUsernameVal(data.username || '');
      setFullName(data.fullName || '');
      setBio(data.bio || '');
      setWebsiteVal(data.website || '');
      setAvatarUrl(data.avatarUrl || '');
      setBannerUrl(data.bannerUrl || '');

      // Kendi profilimiz değilse follow-status'u çek
      if (!isOwnProfile && storeUser && data.id !== storeUser.id) {
        try {
          const status = await UserService.getFollowStatus(data.id);
          setIsFollowing(status.isFollowing);
          setIsRequestSent(status.isRequestSent);
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Kullanıcı profili yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [targetUsername, isOwnProfile, storeUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchUserActivity = useCallback(async () => {
    if (!profile) return;
    try {
      setPostsLoading(true);
      const postsData = await PostService.getAll();
      setAllPosts(postsData);

      const repostsData = await PostService.getUserReposts(profile.username);
      setReposts(repostsData);

      if (isOwnProfile) {
        const savedData = await PostService.getSavedPosts();
        setSavedPosts(savedData);
      }
    } catch (err) {
      console.error('Failed to load user activity:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [profile, isOwnProfile]);

  useEffect(() => {
    if (profile) {
      fetchUserActivity();
    }
  }, [profile, fetchUserActivity]);

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    const wasRequestSent = isRequestSent;
    
    // Optimistik güncelleme
    if (wasFollowing) {
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
    } else if (wasRequestSent) {
      setIsRequestSent(false);
    } else {
      if (profile.isPrivate) {
        setIsRequestSent(true);
      } else {
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    }

    try {
      if (wasFollowing || wasRequestSent) {
        const res = await UserService.unfollow(profile.id);
        setIsFollowing(res.isFollowing);
        setIsRequestSent(res.isRequestSent);
        if (wasFollowing && !res.isFollowing) {
          setFollowerCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const res = await UserService.follow(profile.id);
        setIsFollowing(res.isFollowing);
        setIsRequestSent(res.isRequestSent);
        if (res.isFollowing && !wasFollowing) {
          setFollowerCount(prev => prev + 1);
        }
      }
    } catch (err: any) {
      console.error('Follow toggle failed:', err);
      setIsFollowing(wasFollowing);
      setIsRequestSent(wasRequestSent);
      if (wasFollowing) {
        setFollowerCount(prev => prev + 1);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    setAllPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          let updatedReactions = p.reactions ? [...p.reactions] : [];
          if (isLiked) {
            if (!updatedReactions.some(r => r.userId === currentUser.id)) {
              updatedReactions.push({
                id: `temp-${Date.now()}`,
                userId: currentUser.id,
                reactionType: 'LIKE'
              });
            }
          } else {
            updatedReactions = updatedReactions.filter(r => r.userId !== currentUser.id);
          }
          return {
            ...p,
            reactions: updatedReactions,
            reactionCount: isLiked ? p.reactionCount + 1 : Math.max(0, p.reactionCount - 1)
          };
        }
        return p;
      })
    );
  };

  const handleSaveToggle = (postId: string, isSaved: boolean) => {
    // 1. savedPosts state'ini güncelle
    if (isSaved) {
      setSavedPosts(prevSaved => {
        if (prevSaved.some(p => p.id === postId)) return prevSaved;
        const postToSave = allPosts.find(p => p.id === postId);
        if (postToSave) {
          return [...prevSaved, { ...postToSave, savedPosts: [{ id: `temp-${Date.now()}`, userId: currentUser.id }] }];
        }
        return prevSaved;
      });
    } else {
      setSavedPosts(prevSaved => prevSaved.filter(p => p.id !== postId));
    }

    // 2. allPosts'taki state'i güncelle (böylece diğer yerlerde de senkronize olur)
    setAllPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            savedPosts: isSaved 
              ? [{ id: `temp-${Date.now()}`, userId: currentUser.id }] 
              : []
          };
        }
        return p;
      })
    );
  };

  const handleRepostToggle = (postId: string, isReposted: boolean) => {
    // 1. Update reposts list state
    if (isReposted) {
      setReposts(prevReposts => {
        if (prevReposts.some(p => p.id === postId)) return prevReposts;
        const postToRepost = allPosts.find(p => p.id === postId);
        if (postToRepost) {
          return [...prevReposts, {
            ...postToRepost,
            reposts: [{ id: `temp-${Date.now()}`, userId: currentUser.id }],
            repostCount: (postToRepost.repostCount || 0) + 1
          }];
        }
        return prevReposts;
      });
    } else {
      if (isOwnProfile) {
        setReposts(prevReposts => prevReposts.filter(p => p.id !== postId));
      } else {
        setReposts(prevReposts =>
          prevReposts.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                reposts: [],
                repostCount: Math.max(0, (p.repostCount || 1) - 1)
              };
            }
            return p;
          })
        );
      }
    }

    // 2. Update allPosts state
    setAllPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            reposts: isReposted 
              ? [{ id: `temp-${Date.now()}`, userId: currentUser.id }] 
              : [],
            repostCount: isReposted 
              ? (p.repostCount || 0) + 1 
              : Math.max(0, (p.repostCount || 1) - 1)
          };
        }
        return p;
      })
    );

    // 3. Update savedPosts state (if any)
    setSavedPosts(prevSaved =>
      prevSaved.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            reposts: isReposted 
              ? [{ id: `temp-${Date.now()}`, userId: currentUser.id }] 
              : [],
            repostCount: isReposted 
              ? (p.repostCount || 0) + 1 
              : Math.max(0, (p.repostCount || 1) - 1)
          };
        }
        return p;
      })
    );
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const updated = await UserService.updateProfile({
        username: usernameVal.trim() || undefined,
        fullName: fullName.trim() || undefined,
        bio: bio.trim(),
        website: websiteVal.trim(),
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

      // Eğer kullanıcı adı değiştiyse yeni profile yönlendir
      if (updated.username.toLowerCase() !== targetUsername.toLowerCase()) {
        navigate(`/@${updated.username}`, { replace: true });
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setUpdateError(err.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const initials = (profile?.fullName || profile?.username || 'U').slice(0, 2).toUpperCase();
  const accentColor = '#ff7a00';

  return (
    <div className="flex justify-center w-full min-h-screen bg-transparent">
      <div className="flex w-full max-w-[1380px] h-screen overflow-hidden relative justify-center">
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
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <span className="text-[17px] font-bold text-white tracking-tight">
              {loading ? 'Yükleniyor...' : profile?.username}
            </span>

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

              {/* ── PROFILE INFO ROW (Instagram Arayüzü) ── */}
              <div className="px-6 pt-6 pb-5 flex flex-col gap-5 bg-transparent border-b border-[#ffffff08]">
                {/* Üst Satır: Avatar ve Bilgiler */}
                <div className="flex items-start gap-6 sm:gap-8">
                  {/* Sol: Simetrik Profil Fotoğrafı */}
                  <div className="flex-shrink-0">
                    <div className="p-[3.5px] rounded-full border border-white/10 flex items-center justify-center bg-transparent">
                      <ProfileAv
                        url={profile.avatarUrl}
                        initials={initials}
                        color={accentColor}
                        size={82}
                        className="rounded-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Sağ: Detaylar */}
                  <div className="flex-1 flex flex-col gap-2.5 min-w-0">
                    {/* Kullanıcı Adı */}
                    <div className="flex items-center justify-between">
                      <h1 className="flex items-center gap-2.5 text-[19px] font-bold text-white tracking-tight leading-none">
                        {profile.username}
                        {isOwnProfile && (
                          <button
                            onClick={() => setSettingsModalOpen(true)}
                            className="p-1 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                            title="Seçenekler"
                          >
                            <svg className="w-[18px] h-[18px] text-white/90 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        )}
                      </h1>
                    </div>

                    {/* İstatistikler */}
                    <div className="flex items-center gap-5 text-[13.5px] text-white">
                      <div>
                        <span className="font-extrabold mr-1 font-sans">
                          {allPosts.filter(p => p.author.username.toLowerCase() === profile.username.toLowerCase()).length}
                        </span>
                        <span className="text-[#9ca3af]">gönderi</span>
                      </div>
                      <button onClick={() => {}} className="hover:opacity-80 transition-opacity">
                        <span className="font-extrabold mr-1 font-sans">{fmtNum(followerCount)}</span>
                        <span className="text-[#9ca3af]">takipçi</span>
                      </button>
                      <button onClick={() => {}} className="hover:opacity-80 transition-opacity">
                        <span className="font-extrabold mr-1 font-sans">{fmtNum(followingCount)}</span>
                        <span className="text-[#9ca3af]">takip</span>
                      </button>
                    </div>

                    {/* Hiyerarşik Bilgiler */}
                    <div className="flex flex-col gap-0.5 text-[13px] leading-relaxed">
                      {profile.fullName && (
                        <div className="font-bold text-white">
                          {profile.fullName}
                        </div>
                      )}
                      {profile.bio && (
                        <p className="text-gray-300 whitespace-pre-wrap max-w-md">
                          {profile.bio}
                        </p>
                      )}
                      {/* Premium mavi renkli internet sitesi/link alanı */}
                      {profile.website && (
                        <a
                          href={formatWebsiteUrl(profile.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0095f6] hover:underline font-semibold text-[12.5px] inline-flex items-center gap-1 mt-1 truncate max-w-[280px] sm:max-w-md"
                        >
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          {displayWebsiteText(profile.website)}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alt Kısım: Aksiyon Butonları (Hafif Kavisli) */}
                <div className="flex items-center gap-2 w-full mt-1">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => setEditModalOpen(true)}
                        className="flex-1 py-2 rounded-lg text-[13px] font-bold text-white bg-[#121212] border border-white/5 hover:bg-[#1f1f1f] transition-all active:scale-[0.98] text-center"
                      >
                        Profili düzenle
                      </button>
                      <button
                        className="flex-1 py-2 rounded-lg text-[13px] font-bold text-white bg-[#121212] border border-white/5 hover:bg-[#1f1f1f] transition-all active:scale-[0.98] text-center"
                      >
                        Arşivi gör
                      </button>
                    </>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`w-full py-2 rounded-lg text-[13px] font-bold text-center transition-all duration-200 disabled:opacity-60 ${
                        isFollowing
                          ? 'border border-white/5 text-white bg-[#121212] hover:bg-[#1f1f1f]'
                          : isRequestSent
                          ? 'border border-white/10 text-white/90 bg-[#262626] hover:bg-[#363636]'
                          : 'bg-[#ff7a00] hover:bg-[#e86e00] text-white shadow-md shadow-[#ff7a00]/10'
                      }`}
                    >
                      {followLoading ? 'Yükleniyor...' : isFollowing ? 'Takipte' : isRequestSent ? 'İstek Gönderildi' : 'Takip Et'}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Öne Çıkanlar (Story Highlights) */}
              {isOwnProfile && (
                <div className="px-6 py-4 flex items-center gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-transparent">
                  {/* Story: Yeni */}
                  <div className="flex flex-col items-center gap-1 cursor-pointer group flex-shrink-0">
                    <div className="w-[56px] h-[56px] rounded-full border border-dashed border-white/15 hover:border-white/25 flex items-center justify-center bg-white/[0.01] transition-colors">
                      <span className="text-white text-md font-light">+</span>
                    </div>
                    <span className="text-[10px] text-[#9ca3af] group-hover:text-gray-300 transition-colors">Yeni</span>
                  </div>
                </div>
              )}

              {/* ── TABS (Premium Instagram Stili - Çizgisiz & Büyütülmüş İkonlar) ── */}
              <div className="mt-2">
                <div className="flex justify-center gap-14 sm:gap-20">
                  {[
                    { id: 'posts', icon: (
                      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                        <rect x="3" y="3" width="18" height="18" rx="0" />
                        <path d="M21 9H3M21 15H3M9 3v18M15 3v18" />
                      </svg>
                    )},
                    { id: 'reposts', icon: (
                      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="m17 2 4 4-4 4" />
                        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                        <path d="m7 22-4-4 4-4" />
                        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                      </svg>
                    )},
                    ...(isOwnProfile ? [
                      { id: 'likes', icon: (
                        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )},
                      { id: 'comments', icon: (
                        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                        </svg>
                      )},
                      { id: 'bookmarks', icon: (
                        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                        </svg>
                      )}
                    ] : []),
                  ].map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center justify-center py-4 relative transition-all duration-200 ${
                          active
                            ? 'text-[#ff7a00] border-t border-[#ff7a00] -mt-[1px] pt-[15px]'
                            : 'text-gray-500 hover:text-white border-t border-transparent -mt-[1px] pt-[15px]'
                        }`}
                      >
                        {tab.icon}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex flex-col w-full pb-20">
                {profile.isPrivate && !isOwnProfile && !isFollowing ? (
                  <div className="flex items-center justify-center gap-4 px-6 py-8 border-b border-[#ffffff08]">
                    <div className="w-[52px] h-[52px] rounded-full border border-white/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <h3 className="text-[14.5px] font-bold text-white leading-tight">Bu profil gizli</h3>
                      <p className="text-[13px] text-[#8e8e8e] mt-1">
                        Fotoğraflarını ve videolarını görmek için takip et.
                      </p>
                    </div>
                  </div>
                ) : postsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <p className="text-xs text-gray-500 font-medium font-mono">Gönderiler yükleniyor...</p>
                  </div>
                ) : (
                  <>
                    {activeTab === 'posts' && (() => {
                      const userPosts = allPosts.filter(p => p.author.username.toLowerCase() === profile.username.toLowerCase());
                      return userPosts.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <ImageIcon className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-3" />
                          <p className="text-[14px] font-bold text-white mb-1">Henüz gönderi yok</p>
                          <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                            @{profile.username} kullanıcısının paylaştığı gönderiler burada listelenir.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full">
                          {userPosts.map(p => (
                            <PostCard key={p.id} post={p} onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle} onRepostToggle={handleRepostToggle} />
                          ))}
                        </div>
                      );
                    })()}
 
                    {activeTab === 'reposts' && (
                      reposts.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <svg className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="m17 2 4 4-4 4" />
                            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                            <path d="m7 22-4-4 4-4" />
                            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                          </svg>
                          <p className="text-[14px] font-bold text-white mb-1">Henüz paylaşım yok</p>
                          <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                            @{profile.username} kullanıcısının repost ettiği gönderiler burada listelenir.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full">
                          {reposts.map(p => (
                            <PostCard key={p.id} post={p} onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle} onRepostToggle={handleRepostToggle} />
                          ))}
                        </div>
                      )
                    )}
 
                    {activeTab === 'likes' && (() => {
                      const userLikedPosts = allPosts.filter(p => p.reactions?.some(r => r.userId === profile.id && r.reactionType === 'LIKE'));
                      return userLikedPosts.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <svg className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <p className="text-[14px] font-bold text-white mb-1">Beğenilen gönderi yok</p>
                          <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                            @{profile.username} kullanıcısının beğendiği gönderiler burada listelenir.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full">
                          {userLikedPosts.map(p => (
                            <PostCard key={p.id} post={p} onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle} onRepostToggle={handleRepostToggle} />
                          ))}
                        </div>
                      );
                    })()}
 
                    {activeTab === 'comments' && (
                      <div className="text-center py-16 px-4">
                        <MessageCircle className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-3" strokeWidth={1.2} />
                        <p className="text-[14px] font-bold text-white mb-1">Yorum bulunamadı</p>
                        <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                          @{profile.username} kullanıcısının yaptığı yorumlar yakında burada listelenecek.
                        </p>
                      </div>
                    )}
 
                    {activeTab === 'bookmarks' && (
                      savedPosts.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <svg className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          <p className="text-[14px] font-bold text-white mb-1">Henüz kaydedilen gönderi yok</p>
                          <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                            Daha sonra kolayca bulmak istediğiniz gönderileri kaydedebilirsiniz.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full">
                          {savedPosts.map(p => (
                            <PostCard key={p.id} post={p} onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle} onRepostToggle={handleRepostToggle} />
                          ))}
                        </div>
                      )
                    )}
                  </>
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
                    <X className="w-4 h-4" />
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
                <div className="flex flex-col gap-2 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Profil & Kapak Fotoğrafı</span>
                  
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

                  {/* Kapsayıcı Alan (Kırpılmayı önlemek için overflow-hidden yok) */}
                  <div className="relative w-full h-[130px] mb-8">
                    {/* Kapak Görseli Kapsayıcısı (Kendi içinde overflow-hidden) */}
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900 h-full w-full group/banner">
                      {bannerUrl ? (
                        <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }} />
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

                    {/* Profil Fotoğrafı Kapsayıcısı (Banner'ın üzerine taşar, dışarıdadır) */}
                    <div className="absolute -bottom-6 left-6 rounded-full border-[3px] border-[#090909] bg-[#090909] shadow-lg overflow-hidden group/avatar w-16 h-16 z-20">
                      <ProfileAv url={avatarUrl} initials={initials} color={accentColor} size={58} />
                      
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

                {/* Input: username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Kullanıcı Adı</label>
                  <input
                    type="text"
                    required
                    value={usernameVal}
                    onChange={(e) => setUsernameVal(e.target.value)}
                    disabled={updateLoading}
                    placeholder="Kullanıcı adınızı yazın"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff7a00] transition-colors disabled:opacity-55"
                  />
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

                {/* Input: Website */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">İnternet Sitesi / Bağlantı</label>
                  <input
                    type="text"
                    value={websiteVal}
                    onChange={(e) => setWebsiteVal(e.target.value)}
                    disabled={updateLoading}
                    placeholder="https://example.com"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff7a00] transition-colors disabled:opacity-55"
                  />
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SETTINGS MENU POPUP (Instagram Stili) ── */}
      <AnimatePresence>
        {settingsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
            onClick={() => setSettingsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-[400px] rounded-xl overflow-hidden flex flex-col"
              style={{ background: '#262626', border: '1px solid rgba(255,255,255,0.05)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setSettingsModalOpen(false);
                  setEditModalOpen(true);
                }}
                className="w-full py-4 text-center text-[14px] font-medium text-white border-b border-white/10 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors"
              >
                Profili düzenle
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsModalOpen(false);
                  setPrivacyModalOpen(true);
                }}
                className="w-full py-4 text-center text-[14px] font-medium text-white border-b border-white/10 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors"
              >
                Hesap gizliliği
              </button>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="w-full py-4 text-center text-[14px] font-medium text-white hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors"
              >
                İptal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRIVACY SETTINGS MODAL (Instagram Stili) ── */}
      <AnimatePresence>
        {privacyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
            onClick={() => setPrivacyModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-[500px] rounded-xl overflow-hidden flex flex-col bg-[#000000] p-6 text-white border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <h2 className="text-[18px] font-bold text-white">Hesap gizliliği</h2>
                <button
                  type="button"
                  onClick={() => setPrivacyModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Gizli Hesap Switch Satırı */}
              <div className="flex items-center justify-between bg-[#121212] border border-white/10 rounded-2xl p-4 mb-6">
                <span className="text-[15px] font-semibold text-white">Gizli Hesap</span>
                <button
                  type="button"
                  onClick={async () => {
                    if (!profile) return;
                    const nextPrivate = !profile.isPrivate;
                    
                    // Optimistik güncelleme
                    setProfile(prev => prev ? { ...prev, isPrivate: nextPrivate } : null);
                    
                    try {
                      const updated = await UserService.updateProfile({ isPrivate: nextPrivate });
                      setProfile(prev => prev ? { ...prev, isPrivate: updated.isPrivate } : null);
                      
                      // Global store ve localStorage'ı da güncelle
                      const newUserData = { ...currentUser, isPrivate: updated.isPrivate };
                      setState({ user: newUserData });
                      localStorage.setItem('gramdit_user', JSON.stringify(newUserData));
                    } catch (err) {
                      console.error('Failed to update privacy:', err);
                      // Hata durumunda geri al
                      setProfile(prev => prev ? { ...prev, isPrivate: !nextPrivate } : null);
                    }
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                    profile?.isPrivate ? 'bg-[#0095f6]' : 'bg-neutral-600'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      profile?.isPrivate ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Bilgilendirici Metinler */}
              <div className="text-[12px] text-[#8e8e8e] leading-relaxed flex flex-col gap-4">
                <p>
                  Hesabın herkese açık olduğunda, profilini ve gönderilerini Instagram hesapları olmasa bile Instagram'da veya Instagram dışında herkes görebilir.
                </p>
                <p>
                  Hesabın gizli olduğunda, konu etiketi ve konum sayfalarındaki fotoğrafların veya videoların dahil olmak üzere paylaştığın şeyleri ve takipçilerini ve takip listelerini sadece onayladığın takipçiler görebilir. <span className="text-[#0095f6] hover:underline cursor-pointer">Daha fazla bilgi al</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
