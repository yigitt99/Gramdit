import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Check, X, Globe, Lock, Users, AlertCircle, Pencil
} from 'lucide-react';
import { T, Av } from './LeftSidebar';
import CommunityService, { CommunityResponse } from '../../services/community.service';
import UserService from '../../services/user.service';

// Helper utilities for HSL & Hex color conversions
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Reusable preview card matching Reddit's community card
function CommunityPreviewCard({
  name,
  description,
  themeColor,
  avatarUrl,
  bannerUrl,
  showEditIcons = false,
  onThemeClick,
  statsText,
}: {
  name: string;
  description: string;
  themeColor: string;
  avatarUrl?: string;
  bannerUrl?: string;
  showEditIcons?: boolean;
  onThemeClick?: () => void;
  statsText?: string;
}) {
  return (
    <div className="w-[260px] bg-[#111214] border border-[#2b2d31] rounded-2xl overflow-hidden shadow-xl text-white flex flex-col relative">
      {/* Banner */}
      <div
        className="w-full h-[80px] relative flex items-center justify-center"
        style={{
          background: bannerUrl
            ? `url(${bannerUrl}) center/cover`
            : showEditIcons
            ? `repeating-linear-gradient(45deg, ${themeColor}, ${themeColor} 8px, rgba(0,0,0,0.15) 8px, rgba(0,0,0,0.15) 16px)`
            : themeColor
        }}
      >
        {showEditIcons && (
          <button type="button" className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors text-white" title="Banner düzenle">
            <Pencil className="w-3 h-3" />
          </button>
        )}
        {/* Avatar overlay */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-12 h-12 rounded-full border-[3px] border-[#111214] bg-[#1e1f22] flex items-center justify-center relative overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-5 h-5 text-[#8b5cf6]" />
            )}
            {showEditIcons && (
              <div className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-all flex items-center justify-center text-white cursor-pointer">
                <Pencil className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pt-8 pb-4 flex flex-col gap-2">
        <div>
          <h4 className="text-sm font-extrabold truncate">r/{name || 'ToplulukIsmi'}</h4>
          {statsText ? (
            <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
              {statsText}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold mt-0.5">
              <span>1 üye</span>
              <span>•</span>
              <span>0 aktif</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-[#b5bac1] leading-normal line-clamp-3 min-h-[48px] break-words">
          {description || 'Topluluk hakkında kısa bir açıklama yazın...'}
        </p>

        {showEditIcons && (
          <div className="mt-2 pt-2 border-t border-[#2b2d31]">
            <button
              type="button"
              onClick={onThemeClick}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#20284e]/30 hover:bg-[#20284e]/50 border border-[#3f51b5]/50 rounded-xl text-xs font-bold transition-all text-[#b5bac1] hover:text-white"
            >
              <div className="flex items-center gap-1.5">
                <Pencil className="w-3 h-3 text-[#b5bac1]" />
                <span>Temel Renk</span>
              </div>
              <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: themeColor }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
function Card({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: T.card, border: `1px solid ${T.border}`, ...style }}>
      {children}
    </div>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-3 text-gray-500">
      {children}
    </p>
  );
}

export function RightSidebar({ user }: { user: any }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [follows, setFollows] = useState<Record<string, boolean>>({});

  const [dbCommunities, setDbCommunities] = useState<CommunityResponse[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [joins, setJoins] = useState<Record<string, boolean>>({});

  // Community creation multi-step wizard states
  const [activeModalStep, setActiveModalStep] = useState<null | 'type' | 'details' | 'success' | 'color'>(null);
  const [communityType, setCommunityType] = useState<'public' | 'restricted' | 'private'>('public');
  const [isMature, setIsMature] = useState<boolean>(false);
  const [communityName, setCommunityName] = useState<string>('');
  const [communityDesc, setCommunityDesc] = useState<string>('');
  const [createdCommunity, setCreatedCommunity] = useState<CommunityResponse | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  // Community custom color theme states
  const [themeColor, setThemeColor] = useState<string>('#ff7a00');
  const [hue, setHue] = useState<number>(29);
  const [saturation, setSaturation] = useState<number>(100);

  const fetchDbCommunities = async () => {
    try {
      const list = await CommunityService.getAll();
      setDbCommunities(list);
      
      // Let's also check if user has already joined these communities to set the joins state
      const initialJoins: Record<string, boolean> = {};
      list.forEach(c => {
        initialJoins[c.id] = false;
      });
      setJoins(initialJoins);
    } catch (err) {
      console.error('Failed to load communities on sidebar:', err);
    } finally {
      setLoadingCommunities(false);
    }
  };

  useEffect(() => {
    fetchDbCommunities();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const list = await UserService.getUsers(search);
        const otherUsers = list.filter(u => u.id !== user.id);
        setDbUsers(otherUsers);

        const followingList = await UserService.getFollowing(user.id);
        const initialFollows: Record<string, boolean> = {};
        followingList.forEach(f => {
          initialFollows[f.id] = true;
        });
        otherUsers.forEach(u => {
          if (!initialFollows[u.id]) {
            initialFollows[u.id] = false;
          }
        });
        setFollows(initialFollows);
      } catch (err) {
        console.error('Failed to load users on sidebar:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, user.id]);

  const handleFollowToggle = async (targetUserId: string) => {
    const isCurrentlyFollowing = !!follows[targetUserId];
    setFollows(prev => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));
    try {
      if (isCurrentlyFollowing) {
        await UserService.unfollow(targetUserId);
      } else {
        await UserService.follow(targetUserId);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      setFollows(prev => ({ ...prev, [targetUserId]: isCurrentlyFollowing }));
    }
  };

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const hex = hslToHex(newHue, saturation, 48);
    setThemeColor(hex);
  };

  const handleSaturationChange = (newSat: number) => {
    setSaturation(newSat);
    const hex = hslToHex(hue, newSat, 48);
    setThemeColor(hex);
  };

  const handleHexChange = (newHex: string) => {
    setThemeColor(newHex);
    if (/^#[0-9a-fA-F]{6}$/.test(newHex)) {
      const hsl = hexToHsl(newHex);
      setHue(hsl.h);
      setSaturation(hsl.s);
    }
  };

  const handleCreateCommunity = async () => {
    if (!communityName.trim()) {
      alert('Topluluk adı boş olamaz.');
      return;
    }
    setCreating(true);
    try {
      let cleanName = communityName.trim();
      if (cleanName.toLowerCase().startsWith('r/')) {
        cleanName = cleanName.substring(2);
      }

      const created = await CommunityService.create({
        name: cleanName,
        description: communityDesc.trim() || undefined,
        isPrivate: communityType === 'private',
        themeColor: themeColor,
      });

      setCreatedCommunity(created);
      setActiveModalStep('success');
      fetchDbCommunities();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Topluluk oluşturulurken hata oluştu.');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveThemeColor = async () => {
    if (!createdCommunity) return;
    try {
      await CommunityService.updateThemeColor(createdCommunity.id, themeColor);
      setCreatedCommunity(prev => prev ? { ...prev, themeColor } : null);
      setActiveModalStep('success');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Renk kaydedilemedi.');
    }
  };

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();
  const getColorForCommunity = (id: string) => {
    const colors = ['#ff7a00', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const initials = (user.fullName || user.username).slice(0, 2).toUpperCase();

  return (
    <aside className="hidden lg:flex w-[350px] flex-shrink-0 h-screen sticky top-0 flex-col items-start border-l border-[#ffffff14] pl-6 py-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="w-[310px] flex flex-col gap-4">

        {/* ── PROFİLİM ── */}
        <Card className="p-4 w-full">
          <SectionLabel>Profilim</SectionLabel>
          <div className="flex items-center gap-3 mb-3">
            <Av url={user.avatarUrl} initials={initials} color={T.accent} size={46} />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold truncate text-white leading-tight">{user.fullName || user.username}</p>
              <p className="text-[12px] truncate text-gray-500 leading-tight">@{user.username}</p>
            </div>
          </div>
          <button onClick={() => navigate(`/@${user.username}`)}
            className="w-full py-2 rounded-xl text-[12px] font-semibold transition-all duration-150"
            style={{ border: `1px solid ${T.border}`, color: T.muted }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLElement).style.color = T.text; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.muted; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            Profili Görüntüle
          </button>
        </Card>

        {/* ── KULLANICILAR ── */}
        <Card className="p-4 w-full">
          <SectionLabel>Üyeler</SectionLabel>

          {/* Search */}
          <div className="relative mb-3.5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Üye ara..."
              className="w-full rounded-full pl-10 pr-8 py-2 text-[13px] transition-all focus:outline-none focus:bg-black focus:ring-1 focus:ring-[#ff7a00]/30 bg-[#202327] text-white placeholder-gray-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User list */}
          <div className="flex flex-col gap-1">
            {loadingUsers ? (
              <p className="text-center py-3 text-[12px]" style={{ color: T.mutedLo }}>Yükleniyor...</p>
            ) : dbUsers.length === 0 ? (
              <p className="text-center py-3 text-[12px]" style={{ color: T.mutedLo }}>Kullanıcı bulunamadı</p>
            ) : dbUsers.map(u => {
              const uInitials = (u.fullName || u.username).slice(0, 2).toUpperCase();
              const uColor = getColorForCommunity(u.id);
              return (
                <div key={u.id} 
                  onClick={() => navigate(`/@${u.username}`)}
                  className="flex items-center gap-2.5 px-1 py-1.5 rounded-xl transition-colors cursor-pointer"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <Av url={u.avatarUrl} initials={uInitials} color={uColor} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate text-white leading-tight hover:underline">{u.fullName || u.username}</p>
                    <p className="text-[11px] truncate text-gray-500 leading-tight">@{u.username}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFollowToggle(u.id); }}
                    className="flex-shrink-0 text-[11px] font-bold px-3 py-1 rounded-full transition-all duration-150"
                    style={{
                      border: `1px solid ${follows[u.id] ? 'rgba(255,255,255,0.1)' : T.border}`,
                      color: follows[u.id] ? T.mutedLo : T.muted,
                      background: 'transparent',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = follows[u.id] ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.25)';
                      (e.currentTarget as HTMLElement).style.color = follows[u.id] ? '#f87171' : T.text;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = follows[u.id] ? 'rgba(255,255,255,0.1)' : T.border;
                      (e.currentTarget as HTMLElement).style.color = follows[u.id] ? T.mutedLo : T.muted;
                    }}>
                    {follows[u.id] ? 'Takipte' : 'Takip Et'}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── TOPLULUKLAR ── */}
        <Card className="p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Topluluklar</SectionLabel>
            <button
              onClick={() => {
                setCommunityType('public');
                setIsMature(false);
                setCommunityName('');
                setCommunityDesc('');
                setCreatedCommunity(null);
                 setThemeColor('#ff7a00');
                setHue(29);
                setSaturation(100);
                setActiveModalStep('type');
              }}
              className="flex items-center gap-1 text-[11px] font-bold transition-colors text-[#ff7a00] hover:opacity-80"
            >
              <Plus className="w-3.5 h-3.5" /> Yeni
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {loadingCommunities ? (
              <p className="text-center py-3 text-[12px]" style={{ color: T.mutedLo }}>Yükleniyor...</p>
            ) : dbCommunities.length === 0 ? (
              <p className="text-center py-3 text-[12px]" style={{ color: T.mutedLo }}>Topluluk bulunamadı</p>
            ) : dbCommunities.map(c => {
              const cInitials = getInitials(c.name);
              const cColor = c.themeColor || getColorForCommunity(c.id);
              return (
                <div key={c.id} 
                  onClick={() => navigate(`/communities/${c.slug}`)}
                  className="flex items-center gap-2.5 px-1 py-1.5 rounded-xl transition-colors cursor-pointer"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cColor}18`, border: `1.5px solid ${cColor}35` }}>
                    <span style={{ color: cColor, fontSize: 10 }} className="font-bold">{cInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate text-white leading-tight">{c.name}</p>
                    <p className="text-[11px] text-gray-500 leading-tight">{c.memberCount} üye</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setJoins(p => ({ ...p, [c.id]: !p[c.id] })); }}
                    className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full transition-all duration-150"
                    style={{
                      border: `1px solid ${joins[c.id] ? `${cColor}35` : T.border}`,
                      color: joins[c.id] ? cColor : T.muted,
                      background: joins[c.id] ? `${cColor}10` : 'transparent',
                    }}>
                    {joins[c.id] && <Check className="w-3 h-3" />}
                    {joins[c.id] ? 'Katıldın' : 'Katıl'}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        <p className="text-center pb-2 text-[10px] text-gray-600 select-none">© 2026 Gramdit</p>
      </div>

      {/* ── YENİ TOPLULUK MODAL AKIŞI ── */}
      <AnimatePresence>
        {activeModalStep !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <style>{`
              input[type="range"].range-slider-custom::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50% !important;
                background: #ffffff;
                cursor: pointer;
                border: 2px solid #ffffff;
                box-shadow: 0 0 4px rgba(0,0,0,0.5);
                transition: transform 0.1s ease-in-out;
              }
              input[type="range"].range-slider-custom::-webkit-slider-thumb:hover {
                transform: scale(1.2);
              }
              input[type="range"].range-slider-custom::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50% !important;
                background: #ffffff;
                cursor: pointer;
                border: 2px solid #ffffff;
                box-shadow: 0 0 4px rgba(0,0,0,0.5);
                transition: transform 0.1s ease-in-out;
              }
              input[type="range"].range-slider-custom::-moz-range-thumb:hover {
                transform: scale(1.2);
              }
            `}</style>

            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                layout: { type: 'spring', stiffness: 350, damping: 30 },
                default: { type: 'tween', duration: 0.15 }
              }}
              className={`relative bg-[#111214] border border-[#2b2d31] text-white flex flex-col shadow-2xl overflow-hidden rounded-none ${
                activeModalStep === 'type' ? 'max-w-lg w-full' : 'max-w-3xl w-full'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {/* Modal 1: Topluluk Tipi Seçimi (Step 1) */}
              {activeModalStep === 'type' && (
                <div className="p-6 flex flex-col gap-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-extrabold tracking-wide uppercase">Topluluk Oluştur</span>
                    </div>
                    <button
                      onClick={() => setActiveModalStep(null)}
                      className="p-1 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Subtitle */}
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black text-white">Ne tür bir topluluk?</h2>
                    <p className="text-xs text-[#b5bac1] leading-relaxed">
                      Topluluğunu kimlerin görebileceğine ve katkıda bulunabileceğine karar ver. <span className="font-bold text-white">Önemli:</span> Topluluk türü oluşturulduktan sonra kolayca değiştirilemez.
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="flex flex-col gap-3">
                    {/* Public (Açık) Option */}
                    <div
                      onClick={() => setCommunityType('public')}
                      className={`flex items-center justify-between p-4 bg-[#111214] border-2 rounded-xl cursor-pointer transition-all ${
                        communityType === 'public'
                          ? 'border-[#ff7a00]'
                          : 'border-[#2b2d31] hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Globe className={`w-5 h-5 mt-0.5 flex-shrink-0 ${communityType === 'public' ? 'text-[#ff7a00]' : 'text-gray-400'}`} />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">Açık (Public)</span>
                          <span className="text-xs text-gray-500 mt-1 leading-snug">Herkes bu topluluğu görüntüleyebilir, gönderi paylaşabilir ve yorum yapabilir.</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {communityType === 'public' ? (
                          <div className="w-5 h-5 border-2 border-[#ff7a00] flex items-center justify-center rounded-full">
                            <div className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                        )}
                      </div>
                    </div>

                    {/* Private (Gizli) Option */}
                    <div
                      onClick={() => setCommunityType('private')}
                      className={`flex items-center justify-between p-4 bg-[#111214] border-2 rounded-xl cursor-pointer transition-all ${
                        communityType === 'private'
                          ? 'border-[#ff7a00]'
                          : 'border-[#2b2d31] hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Lock className={`w-5 h-5 mt-0.5 flex-shrink-0 ${communityType === 'private' ? 'text-[#ff7a00]' : 'text-gray-400'}`} />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">Gizli (Private)</span>
                          <span className="text-xs text-gray-500 mt-1 leading-snug">Sadece onaylanmış üyeler topluluğu görüntüleyebilir ve katkıda bulunabilir.</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {communityType === 'private' ? (
                          <div className="w-5 h-5 border-2 border-[#ff7a00] flex items-center justify-center rounded-full">
                            <div className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#2b2d31]" />

                  {/* Mature 18+ Toggle */}
                  <div className="flex items-center justify-between py-2 px-1">
                    <div className="flex items-start gap-3 min-w-0">
                      <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Yetişkin İçerik (18+)</span>
                        <span className="text-xs text-gray-500 mt-1 leading-snug">Üyelerin topluluğu görüntülemek için 18 yaşından büyük olması gerekir.</span>
                      </div>
                    </div>
                    {/* Switch Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsMature(!isMature)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none rounded-full ${
                        isMature ? 'bg-[#ff7a00]' : 'bg-[#2b2d31]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform bg-white shadow ring-0 transition duration-200 ease-in-out rounded-full ${
                          isMature ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Footer Disclaimer & Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#2b2d31]">
                    {/* Indicators */}
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full" />
                      <span className="w-2.5 h-2.5 bg-white/20 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-white/20 rounded-full" />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveModalStep(null)}
                        className="px-6 py-2 bg-[#1e1f22] border border-[#2b2d31] hover:bg-[#2b2d31] text-white rounded-full text-sm font-bold transition-all"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModalStep('details')}
                        className="px-6 py-2 bg-[#ff7a00] hover:bg-[#e86e00] text-white rounded-full text-sm font-bold transition-all"
                      >
                        İleri
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal 2: Topluluk Adı & Açıklama (Step 2) */}
              {activeModalStep === 'details' && (
                <div className="p-6 flex flex-col gap-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-extrabold tracking-wide uppercase">Topluluk Oluştur</span>
                    </div>
                    <button
                      onClick={() => setActiveModalStep(null)}
                      className="p-1 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black text-white">Topluluğundan bahset</h2>
                    <p className="text-xs text-[#b5bac1] leading-relaxed">
                      Bir isim ve açıklama, insanların topluluğunun ne hakkında olduğunu anlamasına yardımcı olur.
                    </p>
                  </div>

                  {/* Content - Two Columns */}
                  <div className="flex flex-col md:flex-row gap-6 mt-2">
                    {/* Left Column (Inputs) */}
                    <div className="flex-1 flex flex-col gap-4">
                      {/* Name Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOPLULUK ADI *</label>
                        <div className="relative flex items-center bg-[#111214] border border-[#2b2d31] rounded-xl focus-within:border-[#ff7a00] transition-colors pl-4 pr-3 py-3">
                          <span className="text-gray-500 text-sm font-semibold select-none pr-1">r/</span>
                          <input
                            type="text"
                            maxLength={21}
                            value={communityName}
                            onChange={e => setCommunityName(e.target.value.replace(/\s+/g, ''))}
                            placeholder="Orn: CrossFit"
                            className="w-full bg-transparent text-sm focus:outline-none text-white font-semibold"
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 text-right self-end mt-1">{communityName.length}/21</span>
                      </div>

                      {/* Description Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AÇIKLAMA</label>
                        <textarea
                          rows={5}
                          maxLength={280}
                          value={communityDesc}
                          onChange={e => setCommunityDesc(e.target.value)}
                          placeholder="Bu topluluğun amacı nedir? Kimler katılmalı?"
                          className="w-full bg-[#111214] border border-[#2b2d31] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a00] text-white resize-none"
                        />
                        <span className="text-[10px] text-gray-500 text-right self-end mt-1">{communityDesc.length}/280</span>
                      </div>
                    </div>

                    {/* Right Column (Live Preview Card) */}
                    <div className="w-[300px] flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block self-start">CANLI ÖNİZLEME</span>
                      <div className="flex-1 flex items-center justify-center p-4 bg-[#111214] border border-[#2b2d31] rounded-xl min-h-[220px]">
                        <CommunityPreviewCard
                          name={communityName}
                          description={communityDesc}
                          themeColor={themeColor}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#2b2d31] mt-2">
                    {/* Indicators */}
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 bg-white/20 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full" />
                      <span className="w-2.5 h-2.5 bg-white/20 rounded-full" />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveModalStep('type')}
                        className="px-6 py-2 bg-[#1e1f22] border border-[#2b2d31] hover:bg-[#2b2d31] text-white rounded-full text-sm font-bold transition-all"
                      >
                        Geri
                      </button>
                      <button
                        type="button"
                        disabled={!communityName.trim() || creating}
                        onClick={handleCreateCommunity}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                          communityName.trim()
                            ? 'bg-[#ff7a00] hover:bg-[#e86e00] text-white cursor-pointer'
                            : 'bg-[#2b2d31] text-[#b5bac1] opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal 3: Yeni Topluluk Başlattın (Step 3) */}
              {activeModalStep === 'success' && createdCommunity && (
                <div className="flex flex-col">
                  {/* Close button */}
                  <button
                    onClick={() => setActiveModalStep(null)}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors z-20"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Split Layout Body */}
                  <div className="flex flex-col md:flex-row">
                    {/* Left Column */}
                    <div className="flex-1 p-8 flex flex-col justify-center gap-5">
                      <div>
                        <h2 className="text-2xl font-black text-white leading-tight">Yeni bir topluluk başlattın!</h2>
                        <h4 className="text-sm font-bold text-gray-300 mt-4">İşte bilmeniz gerekenler</h4>
                        <p className="text-xs text-[#b5bac1] mt-2 leading-relaxed">
                          Başlamanıza yardımcı olmak için bazı ayarları uyguladık. Bunları istediğiniz zaman mod araçlarından görüntüleyip düzenleyebilirsiniz.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="flex items-center gap-2 border border-[#2b2d31] px-4 py-2 rounded-full text-xs font-bold text-[#b5bac1]">
                          <Check className="w-4 h-4 text-green-500" /> Kurallar
                        </span>
                        <span className="flex items-center gap-2 border border-[#2b2d31] px-4 py-2 rounded-full text-xs font-bold text-[#b5bac1]">
                          <Check className="w-4 h-4 text-green-500" /> Karşılama Rehberi
                        </span>
                      </div>
                    </div>

                    {/* Right Column (Gradient Glow Backdrop) */}
                    <div className="w-[340px] bg-gradient-to-br from-[#0c1023] via-[#10142b] to-[#21123e] border-l border-[#2b2d31]/50 p-8 flex items-center justify-center relative">
                      <CommunityPreviewCard
                        name={createdCommunity.name}
                        description={createdCommunity.description || ''}
                        themeColor={themeColor}
                        showEditIcons={true}
                        onThemeClick={() => setActiveModalStep('color')}
                        statsText="1 haftalık ziyaretçi • 1 haftalık katkıda bulunan"
                      />
                    </div>
                  </div>

                  {/* Footer Bar */}
                  <div className="bg-[#090a0c] px-8 py-4 flex items-center justify-end border-t border-[#2b2d31]">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModalStep(null);
                        navigate(`/communities/${createdCommunity.slug}`);
                      }}
                      className="text-white hover:text-gray-300 text-sm font-extrabold transition-all hover:bg-white/5 px-4 py-2 rounded-full"
                    >
                      Topluluğa Git
                    </button>
                  </div>
                </div>
              )}

              {/* Modal 4: Renk Düzenleme (Step 4) */}
              {activeModalStep === 'color' && (
                <div className="flex flex-col">
                  {/* Close button */}
                  <button
                    onClick={() => setActiveModalStep(createdCommunity ? 'success' : 'details')}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors z-20"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Split Layout Body */}
                  <div className="flex flex-col md:flex-row">
                    {/* Left Column (Controls) */}
                    <div className="flex-1 p-6 flex flex-col gap-4 max-h-[500px] overflow-y-auto">
                      <h2 className="text-xl font-extrabold text-white">Renk düzenle</h2>
                      
                      {/* Temel Renk Label & Sample block */}
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-white">Temel renk</span>
                        <p className="text-[11px] text-gray-500 leading-tight">Butonlar, kenarlıklar ve arka plan rengi gibi arayüz öğelerini gölgeler.</p>
                        <div
                          className="w-full h-11 rounded-xl border border-white/10 mt-1 shadow-inner"
                          style={{ backgroundColor: themeColor }}
                        />
                      </div>

                      {/* Hue (Ton) Slider */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-semibold text-gray-400">
                          <span>Ton</span>
                          <span className="text-white">{hue}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={hue}
                          onChange={e => handleHueChange(parseInt(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer range-slider-custom"
                          style={{
                            background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)'
                          }}
                        />
                      </div>

                      {/* Saturation (Doygunluk) Slider */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-semibold text-gray-400">
                          <span>Doygunluk</span>
                          <span className="text-white">{saturation}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={saturation}
                          onChange={e => handleSaturationChange(parseInt(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer range-slider-custom"
                          style={{
                            background: `linear-gradient(to right, #808080, hsl(${hue}, 100%, 50%))`
                          }}
                        />
                      </div>

                      {/* Hex Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-400">Hex kodu (isteğe bağlı)</label>
                        <input
                          type="text"
                          value={themeColor}
                          onChange={e => handleHexChange(e.target.value)}
                          placeholder="#3F51B5"
                          maxLength={7}
                          className="w-full bg-[#111214] border border-[#2b2d31] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff7a00] text-white font-mono"
                        />
                      </div>

                      {/* Dark mode toggle (Dummy) */}
                      <div className="flex items-center justify-between bg-[#1e1f22]/30 border border-[#2b2d31] p-3 rounded-xl">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          🌙 Karanlık modda önizle
                        </span>
                        <button
                          type="button"
                          className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer border-2 border-transparent transition-colors duration-200 ease-in-out bg-[#ff7a00] rounded-full"
                        >
                          <span className="pointer-events-none inline-block h-4 w-4 transform bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-4 rounded-full" />
                        </button>
                      </div>

                      {/* Reset & Remove Buttons */}
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setHue(231);
                            setSaturation(48);
                            setThemeColor('#3F51B5');
                          }}
                          className="flex-1 py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-xs font-bold text-gray-300 rounded-xl transition-all border border-white/5"
                        >
                          Varsayılan temaya sıfırla
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHue(231);
                            setSaturation(48);
                            setThemeColor('#3F51B5');
                          }}
                          className="flex-1 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 text-xs font-bold rounded-xl transition-all border border-rose-500/20 flex items-center justify-center gap-1"
                        >
                          Rengi kaldır
                        </button>
                      </div>
                    </div>

                    {/* Right Column (Gradient Glow Backdrop) */}
                    <div className="w-[340px] bg-gradient-to-br from-[#0c1023] via-[#10142b] to-[#21123e] border-l border-[#2b2d31]/50 p-8 flex flex-col items-center justify-center relative">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 block self-start">ÖNİZLEME</span>
                      <div className="flex-1 flex items-center justify-center">
                        <CommunityPreviewCard
                          name={createdCommunity?.name || communityName}
                          description={createdCommunity?.description || communityDesc}
                          themeColor={themeColor}
                          statsText="1 haftalık ziyaretçi • 1 haftalık katkıda bulunan"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Bar */}
                  <div className="bg-[#090a0c] px-8 py-4 flex items-center justify-end gap-3 border-t border-[#2b2d31]">
                    <button
                      type="button"
                      onClick={() => setActiveModalStep(createdCommunity ? 'success' : 'details')}
                      className="px-6 py-2 bg-[#1e1f22] border border-[#2b2d31] hover:bg-[#2b2d31] text-white rounded-full text-sm font-bold transition-all"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveThemeColor}
                      className="px-6 py-2 bg-white hover:bg-neutral-200 text-black rounded-full text-sm font-bold transition-all"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
