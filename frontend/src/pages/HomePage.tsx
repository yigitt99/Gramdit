/**
 * Gramdit — Ana Sayfa (Home Feed)
 * Referans: Twitter/X layout, centered three columns, max-w-[1225px], responsive behavior.
 *
 * Renkler:
 *   bg       #050505
 *   card     #0d0d0d
 *   border   rgba(255,255,255,0.08)
 *   accent   #ff7a00
 *   text     #ffffff
 *   muted    #9ca3af
 */
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Bell, UserPlus, MessageSquare, Bookmark,
  User, MoreHorizontal, Heart, MessageCircle,
  Repeat2, Share2, ImageIcon, X, Settings, LogOut,
  Search, Plus, Check, Hash, ChevronDown,
  Smile, Sparkles
} from 'lucide-react';
import useStore from '@/store';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg:       '#050505',
  card:     '#0d0d0d',
  cardHov:  '#111111',
  border:   'rgba(255,255,255,0.08)',
  accent:   '#ff7a00',
  accentBg: 'rgba(255,122,0,0.12)',
  text:     '#ffffff',
  muted:    '#9ca3af',
  mutedLo:  'rgba(156,163,175,0.4)',
} as const;

// ─── DEV MOCK ────────────────────────────────────────────────────────────────
const MOCK_USER = {
  id: 'dev', username: 'gramdituser', email: 'demo@gramdit.com',
  fullName: 'Demo Kullanıcı', bio: null as string | null, avatarUrl: null as string | null,
};
type AppUser = typeof MOCK_USER;

// ─── PLACEHOLDER DATA ─────────────────────────────────────────────────────────
const POSTS = [
  {
    id: 'p1',
    author: { name: 'Zeynep Arslan', handle: 'zeyneparslann', initials: 'ZA', color: '#ff7a00', verified: true },
    content: 'Gramdit kullanmaya başladığımdan beri yazılarımdaki gramer hataları ciddi ölçüde azaldı. AI destekli düzeltme önerileri gerçekten inanılmaz! 🎯',
    time: '2 saat',
    comments: 27, reposts: 17, likes: 184, liked: false, bookmarked: false,
  },
  {
    id: 'p2',
    author: { name: 'Burak Çelik', handle: 'burakcelik', initials: 'BÇ', color: '#8b5cf6', verified: false },
    content: 'Türkçeye özgü gramer kurallarını bu kadar doğru yorumlayan bir asistan daha önce görmemiştim. Tebrikler Gramdit ekibi! 👏',
    time: '4 saat',
    comments: 14, reposts: 6, likes: 97, liked: false, bookmarked: true,
  },
  {
    id: 'p3',
    author: { name: 'Selin Kara', handle: 'selinkara', initials: 'SK', color: '#ec4899', verified: false },
    content: 'Akademik tezimi göndermeden önce her zaman Gramdit\'e atıyorum. Noktalama ve cümle yapısı önerileri mükemmel! 📝',
    time: '6 saat',
    comments: 41, reposts: 18, likes: 256, liked: true, bookmarked: false,
  },
];

const USERS = [
  { id: 'u1', name: 'Ayşe Yılmaz',  handle: 'ayseyilmaz',  initials: 'AY', color: '#ff7a00', following: false },
  { id: 'u2', name: 'Mehmet Kaya',  handle: 'mehmetkaya',  initials: 'MK', color: '#8b5cf6', following: false },
  { id: 'u3', name: 'Fatma Şahin', handle: 'fatmasahin',  initials: 'FŞ', color: '#ec4899', following: false },
  { id: 'u4', name: 'Ali Öztürk',   handle: 'aliozturk',   initials: 'AÖ', color: '#10b981', following: false },
];

const COMMUNITIES = [
  { id: 'c1', name: 'Türkçe Yazarlar',   members: 12, initials: 'TY', color: '#ff7a00', joined: false },
  { id: 'c2', name: 'Gramer Topluluğu', members: 8,  initials: 'GT', color: '#8b5cf6', joined: false },
  { id: 'c3', name: 'Akademik Yazarlık', members: 21, initials: 'AY', color: '#ec4899', joined: true  },
];

const NAV = [
  { icon: Home,          label: 'Anasayfa',       path: '/',              badge: 0 },
  { icon: Bell,          label: 'Bildirimler',    path: '/notifications', badge: 3 },
  { icon: UserPlus,      label: 'Takip Et',       path: '/following',     badge: 0 },
  { icon: MessageSquare, label: 'Sohbet',          path: '/messages',      badge: 5 },
  { icon: Bookmark,      label: 'Yer İşaretleri', path: '/bookmarks',     badge: 0 },
  { icon: User,          label: 'Profil',          path: '/profile',       badge: 0 },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Av({
  url, initials, color, size = 38, className = '',
}: {
  url?: string | null; initials: string; color: string; size?: number; className?: string;
}) {
  const d = { width: size, height: size, minWidth: size };
  if (url) return <img src={url} alt="" style={d} className={`rounded-full object-cover flex-shrink-0 ${className}`} />;
  return (
    <div style={{ ...d, background: `${color}20`, border: `1.5px solid ${color}45` }}
      className={`rounded-full flex items-center justify-center flex-shrink-0 select-none ${className}`}>
      <span style={{ color, fontSize: size * 0.37 }} className="font-bold leading-none">{initials}</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// LEFT SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
function LeftSidebar({ user, onCompose }: { user: AppUser; onCompose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout  = useStore(s => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = (user.fullName || user.username).slice(0, 2).toUpperCase();

  return (
    <aside className="w-[70px] xl:w-[275px] flex-shrink-0 flex flex-col h-screen py-4 px-2 xl:pr-4 justify-between items-end border-r border-[#ffffff14]">
      <div className="w-full xl:w-[240px] flex flex-col h-full justify-between">
        
        <div className="flex flex-col gap-1.5 w-full">
          {/* Logo */}
          <div className="flex items-center justify-center xl:justify-start px-3 mb-6 h-[50px] w-full">
            <span className="custom-font-serif text-[26px] font-light tracking-tight text-white hidden xl:block select-none">Gramdit</span>
            {/* Collapsed G Logo */}
            <span className="custom-font-serif text-[26px] font-extrabold text-[#ff7a00] xl:hidden select-none">G</span>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1 w-full">
            {NAV.map(({ icon: Icon, label, path, badge }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="group flex items-center justify-center xl:justify-start gap-4 w-full py-3 px-3 xl:px-4 rounded-full text-[16px] transition-all duration-150 relative"
                  style={{
                    background: active ? T.accentBg : 'transparent',
                    color: active ? T.text : T.muted,
                    fontWeight: active ? 700 : 500,
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={active ? 2.2 : 1.8}
                      style={{ color: active ? T.accent : T.muted }} />
                    
                    {/* Badge for Collapsed View */}
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full text-white text-[9px] font-bold flex items-center justify-center bg-[#ff7a00] xl:hidden">
                        {badge}
                      </span>
                    )}
                  </div>

                  <span className="hidden xl:block text-left text-[17px] flex-1">{label}</span>
                  
                  {/* Badge for Expanded View */}
                  {badge > 0 && (
                    <span className="hidden xl:flex min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold items-center justify-center bg-[#ff7a00]">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More Menu */}
            <button
              className="group flex items-center justify-center xl:justify-start gap-4 w-full py-3 px-3 xl:px-4 rounded-full text-[16px] transition-all duration-150 text-gray-400 hover:text-white"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <MoreHorizontal className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={1.8} />
              <span className="hidden xl:block text-[17px] text-left">Daha Fazla</span>
            </button>

            {/* Compose Button */}
            <div className="mt-4 px-1 w-full flex justify-center xl:block">
              {/* Collapsed view: circular orange button */}
              <button onClick={onCompose}
                className="xl:hidden w-[48px] h-[48px] rounded-full flex items-center justify-center text-white bg-[#ff7a00] hover:bg-[#e86e00] transition-colors shadow-lg shadow-[#ff7a00]/20 active:scale-95">
                <Plus className="w-5 h-5" />
              </button>
              {/* Expanded view: pill button */}
              <button onClick={onCompose}
                className="hidden xl:block w-full py-3.5 rounded-full text-[15px] font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] transition-all duration-200 shadow-md shadow-[#ff7a00]/10 active:scale-[0.97]">
                Gönderi Yayınla
              </button>
            </div>
          </nav>
        </div>

        {/* Profile Card / Dropdown */}
        <div className="relative w-full flex justify-center xl:block" ref={ref}>
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-3 p-2 xl:p-2.5 xl:w-full rounded-full hover:bg-white/5 transition-colors">
            <Av url={user.avatarUrl} initials={initials} color={T.accent} size={38} />
            <div className="hidden xl:flex flex-col flex-1 min-w-0 text-left">
              <p className="text-[14px] font-bold truncate text-white leading-tight">
                {user.fullName || user.username}
              </p>
              <p className="text-[12px] truncate text-gray-500 leading-tight">@{user.username}</p>
            </div>
            <MoreHorizontal className="hidden xl:block w-4 h-4 text-gray-500 ml-auto flex-shrink-0" />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.1 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 xl:left-0 xl:translate-x-0 mb-2 py-1.5 w-[200px] xl:w-full rounded-2xl shadow-2xl z-50 bg-[#111] border border-white/10">
                <button onClick={() => { setOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <User className="w-4 h-4" /> Profilim
                </button>
                <button onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <Settings className="w-4 h-4" /> Ayarlar
                </button>
                <div className="my-1 border-t border-white/5" />
                <button onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors">
                  <LogOut className="w-4 h-4" /> Çıkış Yap
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST CARD
// ─────────────────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: (typeof POSTS)[0] }) {
  const [liked,  setLiked]  = useState(post.liked);
  const [likes,  setLikes]  = useState(post.likes);
  const [saved,  setSaved]  = useState(post.bookmarked);

  return (
    <article className="flex gap-3 px-4 py-3.5 transition-colors duration-150 cursor-pointer border-b border-[#ffffff14] hover:bg-white/[0.015]">
      <Av initials={post.author.initials} color={post.author.color} size={40} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[14px] font-bold text-white hover:underline">{post.author.name}</span>
          {post.author.verified && (
            <span className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full flex-shrink-0 bg-[#ff7a00]">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
              </svg>
            </span>
          )}
          <span className="text-[13px] text-gray-500">@{post.author.handle}</span>
          <span className="text-xs text-gray-600">·</span>
          <span className="text-[13px] text-gray-500">{post.time}</span>
        </div>

        {/* Content */}
        <p className="mt-1 text-[14px] leading-normal text-white/90">{post.content}</p>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 max-w-[420px] -ml-2 text-gray-500">
          <ActBtn icon={<MessageCircle className="w-[18px] h-[18px]" />} count={post.comments} hov="rgba(29,155,240,0.1)" hovC="#1d9bf0" />
          <ActBtn icon={<Repeat2 className="w-[18px] h-[18px]" />} count={post.reposts} hov="rgba(0,186,124,0.1)" hovC="#00ba7c" />
          
          <button onClick={(e) => { e.stopPropagation(); setLiked(l => { setLikes(c => l ? c - 1 : c + 1); return !l; }); }}
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-xs font-medium"
            style={{ color: liked ? '#f43f5e' : undefined }}>
            <Heart className={`w-[18px] h-[18px] ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{fmt(likes)}</span>
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); setSaved(b => !b); }}
            className="p-2 rounded-full hover:bg-[#ff7a00]/10 hover:text-[#ff7a00] transition-colors"
            style={{ color: saved ? '#ff7a00' : undefined }}>
            <Bookmark className={`w-[18px] h-[18px] ${saved ? 'fill-[#ff7a00] text-[#ff7a00]' : ''}`} />
          </button>
          
          <button className="p-2 rounded-full hover:bg-white/5 hover:text-white transition-colors">
            <Share2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </article>
  );
}

function ActBtn({ icon, count, hov, hovC }: { icon: React.ReactNode; count: number; hov: string; hovC: string }) {
  return (
    <button className="flex items-center gap-1.5 p-2 rounded-full text-xs font-medium transition-colors hover:text-white"
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hov; (e.currentTarget as HTMLElement).style.color = hovC; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = ''; }}>
      {icon} <span>{fmt(count)}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSE CARD
// ─────────────────────────────────────────────────────────────────────────────
function ComposeCard({ user, onOpen }: { user: AppUser; onOpen: () => void }) {
  const initials = (user.fullName || user.username).slice(0, 2).toUpperCase();

  return (
    <div className="px-4 py-3 border-b border-[#ffffff14] flex gap-3">
      <Av url={user.avatarUrl} initials={initials} color={T.accent} size={40} className="mt-1 flex-shrink-0" />
      <div className="flex-1">
        <textarea
          onClick={onOpen}
          readOnly
          placeholder="Ne paylaşmak istiyorsun?"
          className="w-full bg-transparent resize-none focus:outline-none text-[16px] leading-relaxed py-2 cursor-pointer placeholder-gray-600"
          rows={2}
        />
        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04] mt-2">
          <div className="flex items-center gap-2">
            <button onClick={onOpen} className="p-2 rounded-full hover:bg-white/5 text-[#ff7a00] transition-colors" title="Görsel ekle">
              <ImageIcon className="w-[18px] h-[18px]" />
            </button>
            <button onClick={onOpen} className="p-2 rounded-full hover:bg-white/5 text-[#ff7a00] transition-colors" title="Emoji ekle">
              <Smile className="w-[18px] h-[18px]" />
            </button>
            {/* Community selector */}
            <div onClick={onOpen} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 hover:border-[#ff7a00]/30 hover:text-white text-gray-400 text-[13px] cursor-pointer transition-all">
              <Hash className="w-3.5 h-3.5" />
              <span>Topluluk Seç</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
          <button onClick={onOpen} className="px-5 py-1.5 rounded-full text-sm font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] transition-all">
            Paylaş
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ComposeModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: AppUser }) {
  const [text, setText] = useState('');
  const ref  = useRef<HTMLTextAreaElement>(null);
  const MAX  = 280;

  useEffect(() => {
    if (open) setTimeout(() => ref.current?.focus(), 80);
    else setText('');
  }, [open]);

  const initials = (user.fullName || user.username).slice(0, 2).toUpperCase();
  const left = MAX - text.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div initial={{ scale: 0.96, y: -14, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#0f0f0f', border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4"
              style={{ borderBottom: `1px solid ${T.border}` }}>
              <span className="custom-font-serif text-[16px] font-light" style={{ color: T.muted }}>
                Yeni Gönderi
              </span>
              <button onClick={onClose}
                className="p-1.5 rounded-full transition-all"
                style={{ color: T.mutedLo }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.text; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.mutedLo; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3 px-5 py-4">
              <Av url={user.avatarUrl} initials={initials} color={T.accent} size={40} className="mt-0.5" />
              <textarea ref={ref} value={text} onChange={e => setText(e.target.value)}
                placeholder="Ne paylaşmak istiyorsun?" rows={5}
                className="flex-1 bg-transparent resize-none focus:outline-none text-[15px] leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.85)', caretColor: T.accent }}
              />
            </div>

            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full text-[#ff7a00] hover:bg-white/5 transition-all">
                  <ImageIcon className="w-[18px] h-[18px]" />
                </button>
                <button className="p-2 rounded-full text-[#ff7a00] hover:bg-white/5 transition-all">
                  <Smile className="w-[18px] h-[18px]" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {text.length > 0 && (
                  <span className="text-[12px] font-medium"
                    style={{ color: left < 0 ? '#f43f5e' : left <= 20 ? '#f59e0b' : T.mutedLo }}>
                    {left}
                  </span>
                )}
                <button disabled={!text.trim() || left < 0}
                  className="px-5 py-2 rounded-full text-[13px] font-bold text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: T.accent, boxShadow: `0 2px 12px ${T.accent}30` }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.background = '#e86e00'; }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.accent}>
                  Paylaş
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTER FEED
// ─────────────────────────────────────────────────────────────────────────────
function CenterFeed({ user, onCompose }: { user: AppUser; onCompose: () => void }) {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  return (
    <div className="flex flex-col w-full">
      {/* Sticky Header Tabs */}
      <div className="sticky top-0 bg-[#050505]/75 backdrop-blur-md z-40 border-b border-[#ffffff14] w-full flex flex-col">
        <div className="flex h-[53px] w-full items-center px-4 justify-between xl:justify-start">
          <span className="text-[18px] font-bold text-white xl:hidden select-none">Ana Sayfa</span>
          <button className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <Sparkles className="w-4 h-4 text-[#ff7a00]" />
          </button>
        </div>
        
        <div className="flex w-full border-t border-white/[0.04]">
          <button
            onClick={() => setActiveTab('for-you')}
            className="flex-1 flex flex-col items-center justify-center relative py-3.5 font-bold text-[14px] transition-colors"
            style={{ color: activeTab === 'for-you' ? T.text : T.muted }}
          >
            <span>Senin için</span>
            {activeTab === 'for-you' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 w-[56px] h-[4px] rounded-full bg-[#ff7a00]"
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('following')}
            className="flex-1 flex flex-col items-center justify-center relative py-3.5 font-bold text-[14px] transition-colors"
            style={{ color: activeTab === 'following' ? T.text : T.muted }}
          >
            <span>Takip Edilenler</span>
            {activeTab === 'following' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0.5 w-[84px] h-[4px] rounded-full bg-[#ff7a00]"
              />
            )}
          </button>
        </div>
      </div>

      {/* Compose */}
      <ComposeCard user={user} onOpen={onCompose} />

      {/* Posts */}
      <div className="flex flex-col w-full pb-20">
        {POSTS.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RIGHT SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
function RightSidebar({ user }: { user: AppUser }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [follows, setFollows] = useState<Record<string, boolean>>(
    Object.fromEntries(USERS.map(u => [u.id, u.following]))
  );
  const [joins, setJoins] = useState<Record<string, boolean>>(
    Object.fromEntries(COMMUNITIES.map(c => [c.id, c.joined]))
  );

  const initials = (user.fullName || user.username).slice(0, 2).toUpperCase();
  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.handle.toLowerCase().includes(search.toLowerCase())
  );

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
          <button onClick={() => navigate('/profile')}
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
            {filtered.length === 0 ? (
              <p className="text-center py-3 text-[12px]" style={{ color: T.mutedLo }}>Kullanıcı bulunamadı</p>
            ) : filtered.map(u => (
              <div key={u.id} className="flex items-center gap-2.5 px-1 py-1.5 rounded-xl transition-colors"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <Av initials={u.initials} color={u.color} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate text-white leading-tight">{u.name}</p>
                  <p className="text-[11px] truncate text-gray-500 leading-tight">@{u.handle}</p>
                </div>
                <button
                  onClick={() => setFollows(p => ({ ...p, [u.id]: !p[u.id] }))}
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
            ))}
          </div>
        </Card>

        {/* ── TOPLULUKLAR ── */}
        <Card className="p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Topluluklar</SectionLabel>
            <button className="flex items-center gap-1 text-[11px] font-bold transition-colors text-[#ff7a00] hover:opacity-80">
              <Plus className="w-3.5 h-3.5" /> Yeni
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {COMMUNITIES.map(c => (
              <div key={c.id} className="flex items-center gap-2.5 px-1 py-1.5 rounded-xl transition-colors"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${c.color}18`, border: `1.5px solid ${c.color}35` }}>
                  <span style={{ color: c.color, fontSize: 10 }} className="font-bold">{c.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate text-white leading-tight">{c.name}</p>
                  <p className="text-[11px] text-gray-500 leading-tight">{c.members} üye</p>
                </div>
                <button
                  onClick={() => setJoins(p => ({ ...p, [c.id]: !p[c.id] }))}
                  className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full transition-all duration-150"
                  style={{
                    border: `1px solid ${joins[c.id] ? `${c.color}35` : T.border}`,
                    color: joins[c.id] ? c.color : T.muted,
                    background: joins[c.id] ? `${c.color}10` : 'transparent',
                  }}>
                  {joins[c.id] && <Check className="w-3 h-3" />}
                  {joins[c.id] ? 'Katıldın' : 'Katıl'}
                </button>
              </div>
            ))}
          </div>
        </Card>

        <p className="text-center pb-2 text-[10px] text-gray-600 select-none">© 2026 Gramdit</p>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — Centered layout, max-w-[1225px]
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const storeUser = useStore(s => s.user);
  const user = (storeUser ?? MOCK_USER) as AppUser;
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <>
      {/*
       * 3-column layout, max-w-[1225px] centered.
       * WebGL canvas (fixed, z-10 negative) shows through transparent sidebars.
       * Only the center column scrolls.
       */}
      <div className="flex justify-center w-full min-h-screen bg-transparent">
        <div className="flex w-full max-w-[1225px] h-screen overflow-hidden relative justify-center">

          {/* LEFT SIDEBAR */}
          <LeftSidebar user={user} onCompose={() => setComposeOpen(true)} />

          {/* CENTER FEED — scrollable */}
          <main className="w-full max-w-[600px] flex-shrink-1 h-screen overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-r border-[#ffffff14] flex flex-col bg-black/10 backdrop-blur-[1px]">
            <CenterFeed user={user} onCompose={() => setComposeOpen(true)} />
          </main>

          {/* RIGHT SIDEBAR */}
          <RightSidebar user={user} />

        </div>
      </div>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} user={user} />
    </>
  );
}
