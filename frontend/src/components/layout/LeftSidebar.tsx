import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Bell, UserPlus, MessageSquare, Bookmark,
  User, MoreHorizontal, Plus, Settings, LogOut
} from 'lucide-react';
import useStore from '@/store';

export const T = {
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

const NAV = [
  { icon: Home,          label: 'Anasayfa',       path: '/',              badge: 0 },
  { icon: Bell,          label: 'Bildirimler',    path: '/notifications', badge: 3 },
  { icon: UserPlus,      label: 'Takip Et',       path: '/following',     badge: 0 },
  { icon: MessageSquare, label: 'Sohbet',          path: '/messages',      badge: 5 },
  { icon: Bookmark,      label: 'Yer İşaretleri', path: '/bookmarks',     badge: 0 },
  { icon: User,          label: 'Profil',          path: '/profile',       badge: 0 },
];

export function Av({
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

export function LeftSidebar({ user, onCompose }: { user: any; onCompose: () => void }) {
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
                  onClick={() => navigate(path === '/profile' ? `/@${user.username}` : path)}
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
                <button onClick={() => { setOpen(false); navigate(`/@${user.username}`); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <User className="w-4 h-4" /> Profilim
                </button>
                <button onClick={() => { setOpen(false); navigate(`/@${user.username}`); }}
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
