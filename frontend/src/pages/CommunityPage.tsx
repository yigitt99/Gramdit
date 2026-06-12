import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Users, ShieldAlert,
  Hash, BookOpen, Info, Sparkles,
  ImageIcon
} from 'lucide-react';
import useStore from '@/store';
import CommunityService, { CommunityResponse, CommunityMemberResponse } from '../services/community.service';
import { LeftSidebar, T } from '../components/layout/LeftSidebar';
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
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'about'>('posts');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [postText, setPostText] = useState<string>('');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(true);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [showMediaInput, setShowMediaInput] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);

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
        
        // Fetch members list
        const membersList = await CommunityService.getMembers(data.id);
        setMembers(membersList);
        
        // Check if logged-in user is a member
        if (storeUser) {
          const isUserMember = membersList.some(m => m.userId === storeUser.id);
          setIsJoined(isUserMember);
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

  const handleJoinToggle = () => {
    if (!community) return;
    if (isJoined) {
      // Leave (locally)
      setIsJoined(false);
      if (storeUser) {
        setMembers(prev => prev.filter(m => m.userId !== storeUser.id));
      }
    } else {
      // Join (locally)
      setIsJoined(true);
      if (storeUser) {
        const localMember: CommunityMemberResponse = {
          id: 'temp-id',
          communityId: community.id,
          userId: storeUser.id,
          role: 'member',
          joinedAt: new Date().toISOString(),
          user: {
            id: storeUser.id,
            username: storeUser.username,
            email: storeUser.email,
            fullName: storeUser.fullName || null,
            avatarUrl: storeUser.avatarUrl || null,
          }
        };
        setMembers(prev => [...prev, localMember]);
      }
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
    <div className="flex justify-center w-full min-h-screen bg-transparent">
      <div className="flex w-full max-w-[1225px] h-screen overflow-hidden relative justify-center">
        
        {/* SOL PANEL (Left Sidebar) */}
        <LeftSidebar user={storeUser} onCompose={() => {}} />

        {/* ORTA BÖLÜM (Center Feed) */}
        <main className="w-full max-w-[600px] flex-shrink-1 h-screen overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-r border-[#ffffff14] flex flex-col bg-black/10 backdrop-blur-[1px]">
          
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
          <div className="relative w-full h-[180px] flex-shrink-0 bg-gradient-to-r from-neutral-900 to-orange-950/20 overflow-hidden">
            {hasBanner ? (
              <img
                src={community.bannerUrl!}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative opacity-40">
                <Hash className="w-32 h-32 text-white/5 absolute -right-4 -bottom-4 rotate-12" />
                <Sparkles className="w-8 h-8 text-[#ff7a00]/30" />
              </div>
            )}
            
            {/* Topluluk Avatar Overlay */}
            <div className="absolute -bottom-12 left-4 z-10">
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
          </div>

          {/* Topluluk Bilgileri Header Altı */}
          <div className="pt-14 px-4 flex flex-col w-full">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-tight">
                  {community.name}
                </h1>
                <p className="text-[13px] text-[#ff7a00] mt-0.5">
                  /c/{community.slug}
                </p>
              </div>

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

          {/* Sekmeler (Tabs) */}
          <div className="flex w-full border-b border-[#ffffff14] mt-6 flex-shrink-0">
            {[
              { id: 'posts', label: 'Gönderiler' },
              { id: 'members', label: 'Üyeler' },
              { id: 'about', label: 'Hakkında' }
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex-1 flex flex-col items-center justify-center relative py-3.5 font-bold text-[14px] transition-colors"
                  style={{ color: active ? T.text : T.muted }}
                >
                  <span>{tab.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeCommunityTabUnderline"
                      className="absolute bottom-0 w-[64px] h-[4px] rounded-full bg-[#ff7a00]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sekme İçeriği */}
          <div className="flex-1 w-full flex flex-col pb-20">
            
            {activeTab === 'posts' && (
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

            {activeTab === 'members' && (
              <div className="flex flex-col w-full p-4 gap-4">
                <h3 className="text-white font-bold text-[15px] mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#ff7a00]" /> Topluluk Üyeleri ({liveMemberCount})
                </h3>
                
                <div className="flex flex-col gap-2">
                  {members.map(member => {
                    const initials = member.user.username.slice(0, 2).toUpperCase();
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.01]"
                      >
                        {member.user.avatarUrl ? (
                          <img
                            src={member.user.avatarUrl}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-white text-xs font-bold font-mono">
                            {initials}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-bold">
                            {member.user.fullName || member.user.username}
                          </span>
                          <span className="text-gray-500 text-xs">
                            @{member.user.username}
                          </span>
                        </div>
                        <span
                          className={`ml-auto text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full ${
                            member.role === 'founder'
                              ? 'bg-[#ff7a00]/10 text-[#ff7a00] border border-[#ff7a00]/25'
                              : member.role === 'moderator'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25'
                              : member.role === 'vip'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                              : 'bg-white/5 text-gray-400 border border-white/10'
                          }`}
                        >
                          {member.role === 'founder'
                            ? 'Kurucu'
                            : member.role === 'moderator'
                            ? 'Moderatör'
                            : member.role === 'vip'
                            ? 'VIP'
                            : 'Üye'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="p-5 flex flex-col gap-4">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#ff7a00]" /> Topluluk Kuralları
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Bu toplulukta saygılı ve faydalı paylaşımlar yapılması beklenmektedir. Spam, nefret söylemi ve alakasız içerikler yasaktır.
                  </p>
                </div>
              </div>
            )}
          </div>

        </main>

        {/* SAĞ PANEL (Discord Tarzı Üyeler Sidebarı) */}
        <aside className="hidden lg:flex w-[260px] flex-shrink-0 h-screen sticky top-0 flex-col items-start border-l border-[#ffffff14] pl-5 py-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#0a0a0a]/30">
          <div className="w-full flex flex-col gap-5">
            
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              ÜYELER — {liveMemberCount}
            </p>

            {/* Founders list */}
            {founders.length > 0 && (
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[10px] font-extrabold tracking-wider text-[#ff7a00]/70 uppercase px-1">
                  Kurucu — {founders.length}
                </span>
                {founders.map(f => (
                  <MemberItem key={f.id} member={f} color="#ff7a00" isOnline={true} />
                ))}
              </div>
            )}

            {/* Moderators list */}
            {moderators.length > 0 && (
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[10px] font-extrabold tracking-wider text-purple-400/70 uppercase px-1">
                  Moderatör — {moderators.length}
                </span>
                {moderators.map(m => (
                  <MemberItem key={m.id} member={m} color="#a855f7" isOnline={true} />
                ))}
              </div>
            )}

            {/* VIPs list */}
            {vips.length > 0 && (
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[10px] font-extrabold tracking-wider text-amber-400/70 uppercase px-1">
                  VIP — {vips.length}
                </span>
                {vips.map(v => (
                  <MemberItem key={v.id} member={v} color="#eab308" isOnline={true} />
                ))}
              </div>
            )}

            {/* Regular Members list */}
            {regularMembers.length > 0 && (
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[10px] font-extrabold tracking-wider text-gray-500 uppercase px-1">
                  Üye — {regularMembers.length}
                </span>
                {regularMembers.map((m, idx) => (
                  <MemberItem key={m.id} member={m} color="#cccccc" isOnline={idx % 2 === 0} />
                ))}
              </div>
            )}

          </div>
        </aside>

      </div>
    </div>
  );
}

// Discord-style member row
function MemberItem({ member, color, isOnline }: { member: CommunityMemberResponse; color: string; isOnline: boolean }) {
  const mInitials = member.user.username.slice(0, 2).toUpperCase();
  return (
    <div
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
