import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ArrowLeft } from 'lucide-react';
import useStore from '@/store';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { RightSidebar } from '../components/layout/RightSidebar';
import PostService, { PostResponse } from '../services/post.service';
import { PostCard } from './HomePage';

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

export default function BookmarksPage() {
  const navigate = useNavigate();
  const storeUser = useStore((s) => s.user);
  const user = (storeUser ?? MOCK_USER) as AppUser;

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await PostService.getSavedPosts();
      setPosts(data);
    } catch (err) {
      console.error('Yer işaretleri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

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
                <h1 className="text-[17px] font-bold text-white leading-tight">Yer İşaretleri</h1>
                {!loading && (
                  <p className="text-[12px] text-gray-500 leading-none">
                    {posts.length} gönderi
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* İçerik */}
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Yer işaretleri yükleniyor...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Bookmark className="w-7 h-7 text-gray-600" />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-1">Henüz yer işareti yok</h3>
              <p className="text-[13px] text-gray-500 max-w-[280px] leading-relaxed">
                Daha sonra kolayca bulmak istediğin gönderileri kaydedebilirsin. Kaydettiğin gönderiler burada listelenir.
              </p>
            </div>
          ) : (
            <div className="flex flex-col w-full pb-20">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </main>

        {/* Sağ Sidebar */}
        <RightSidebar user={user} />
      </div>
    </div>
  );
}
