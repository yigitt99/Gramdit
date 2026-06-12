import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Check, X } from 'lucide-react';
import { T, Av } from './LeftSidebar';
import CommunityService, { CommunityResponse } from '../../services/community.service';
import UserService from '../../services/user.service';

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

  useEffect(() => {
    const fetchDbCommunities = async () => {
      try {
        const list = await CommunityService.getAll();
        setDbCommunities(list);
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
            <button className="flex items-center gap-1 text-[11px] font-bold transition-colors text-[#ff7a00] hover:opacity-80">
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
              const cColor = getColorForCommunity(c.id);
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
    </aside>
  );
}
