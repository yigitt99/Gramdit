import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Repeat2, Heart,
  Bookmark, Share2, ImageIcon, Smile, X
} from 'lucide-react';
import useStore from '@/store';
import PostService, { PostResponse, CommentResponse } from '../services/post.service';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { RightSidebar } from '../components/layout/RightSidebar';
import { CommentNode } from './HomePage';

const MOCK_USER = {
  id: 'dev', username: 'gramdituser', email: 'demo@gramdit.com',
  fullName: 'Demo Kullanıcı', bio: null as string | null, avatarUrl: null as string | null,
};
type AppUser = typeof MOCK_USER;

// Helper to format initials
const getInitials = (name: string) => {
  return name.slice(0, 2).toUpperCase();
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const storeUser = useStore(s => s.user);
  const user = (storeUser ?? MOCK_USER) as AppUser;

  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Likes states
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  // New Comment states
  const [newCommentText, setNewCommentText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaMode, setMediaMode] = useState<'IMAGE' | 'GIF' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Nested reply states
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const postData = await PostService.getById(id);
      setPost(postData);
      
      const hasLiked = postData.reactions ? postData.reactions.some(r => r.userId === user.id && r.reactionType === 'LIKE') : false;
      setLiked(hasLiked);
      setLikes(postData.reactionCount);

      const commentsData = await PostService.getComments(id);
      setComments(commentsData);
    } catch (err) {
      console.error('Failed to load post details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : prev - 1);
    try {
      await PostService.toggleReaction(post.id, 'LIKE');
    } catch (err) {
      console.error('Failed to toggle post reaction:', err);
      setLiked(liked);
      setLikes(likes);
    }
  };

  const handleToggleImage = () => {
    setShowEmojiPicker(false);
    if (showMediaInput && mediaMode === 'IMAGE') {
      setShowMediaInput(false);
      setMediaMode(null);
    } else {
      setShowMediaInput(true);
      setMediaMode('IMAGE');
      setMediaType('IMAGE');
    }
  };

  const handleToggleGif = () => {
    setShowEmojiPicker(false);
    if (showMediaInput && mediaMode === 'GIF') {
      setShowMediaInput(false);
      setMediaMode(null);
    } else {
      setShowMediaInput(true);
      setMediaMode('GIF');
      setMediaType('IMAGE');
    }
  };

  const handleToggleEmoji = () => {
    setShowMediaInput(false);
    setMediaMode(null);
    setShowEmojiPicker(prev => !prev);
  };

  const handleAddComment = async (e: React.FormEvent, parentCommentId?: string) => {
    e.preventDefault();
    if (!post) return;

    const textToSubmit = parentCommentId ? replyText : newCommentText;
    const urlToSubmit = parentCommentId ? undefined : mediaUrl.trim() || undefined;
    const typeToSubmit = parentCommentId ? undefined : mediaUrl.trim() ? mediaType : undefined;

    if (!textToSubmit.trim() && !urlToSubmit) return;

    try {
      await PostService.createComment(post.id, textToSubmit, parentCommentId, urlToSubmit, typeToSubmit);
      if (parentCommentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewCommentText('');
        setMediaUrl('');
        setShowMediaInput(false);
        setMediaMode(null);
        setShowEmojiPicker(false);
      }
      
      // Refresh comments
      const commentsData = await PostService.getComments(post.id);
      setComments(commentsData);

      // Refresh post details to update commentCount
      const postData = await PostService.getById(post.id);
      setPost(postData);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  if (loading || !post) {
    return (
      <div className="flex justify-center w-full min-h-screen bg-transparent">
        <div className="flex w-full max-w-[1225px] h-screen overflow-hidden relative justify-center">
          <LeftSidebar user={user} onCompose={() => navigate('/')} />
          <main className="w-full max-w-[600px] flex-shrink-1 h-screen overflow-y-auto border-r border-[#ffffff14] flex flex-col bg-black/10 backdrop-blur-[1px] items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <p className="text-xs text-gray-500 font-medium mt-3">Gönderi yükleniyor...</p>
          </main>
          <RightSidebar user={user} />
        </div>
      </div>
    );
  }

  const initials = getInitials(post.author.fullName || post.author.username);
  const userInitials = getInitials(user.fullName || user.username);
  const timeStr = new Date(post.createdAt).toLocaleDateString('tr-TR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex justify-center w-full min-h-screen bg-transparent">
      <div className="flex w-full max-w-[1225px] h-screen overflow-hidden relative justify-center">
        {/* LEFT SIDEBAR */}
        <LeftSidebar user={user} onCompose={() => navigate('/')} />

        {/* CENTER DETAIL FEED */}
        <main className="w-full max-w-[600px] flex-shrink-1 h-screen overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-r border-[#ffffff14] flex flex-col bg-black/10 backdrop-blur-[1px]">
          {/* Header */}
          <div className="sticky top-0 bg-[#050505]/75 backdrop-blur-md z-40 border-b border-[#ffffff14] h-[53px] px-4 flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-[18px] font-bold text-white select-none">Gönderi</span>
          </div>

          <div className="flex flex-col p-4 border-b border-[#ffffff14]">
            {/* Author Info */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#ff7a00]/10 border border-[#ff7a00]/30 select-none">
                {post.author.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-[#ff7a00] font-bold text-sm">{initials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-white truncate leading-tight hover:underline cursor-pointer">
                  {post.author.fullName || post.author.username}
                </p>
                <p className="text-[13px] text-gray-500 truncate leading-tight">@{post.author.username}</p>
              </div>
            </div>

            {/* Post Content */}
            <p className="mt-4 text-[17px] leading-relaxed text-white/95 whitespace-pre-wrap select-text">
              {post.content}
            </p>

            {/* Post Media */}
            {post.media && post.media.length > 0 && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-white/5 bg-black/20">
                {post.media.map((med) => {
                  if (med.mediaType === 'IMAGE') {
                    return (
                      <img
                        key={med.id}
                        src={med.mediaUrl}
                        alt="Post media"
                        className="w-full object-cover max-h-[500px]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                    );
                  } else if (med.mediaType === 'VIDEO') {
                    return (
                      <video
                        key={med.id}
                        src={med.mediaUrl}
                        controls
                        className="w-full max-h-[500px] object-cover"
                      />
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Post Meta (Timestamp) */}
            <div className="mt-4 py-3 border-b border-[#ffffff0a] text-[13px] text-gray-500">
              <span>{timeStr}</span>
            </div>

            {/* Interaction Counts */}
            <div className="py-3 border-b border-[#ffffff0a] flex items-center gap-4 text-[14px]">
              <span className="text-gray-500">
                <strong className="text-white font-bold">{post.commentCount}</strong> Yanıt
              </span>
              <span className="text-gray-500">
                <strong className="text-white font-bold">{likes}</strong> Beğeni
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-around py-2 text-gray-500">
              <button 
                onClick={() => commentInputRef.current?.focus()}
                className="p-2 rounded-full hover:bg-[#ff7a00]/10 hover:text-[#ff7a00] transition-colors"
              >
                <MessageCircle className="w-[20px] h-[20px]" />
              </button>
              <button className="p-2 rounded-full hover:bg-green-500/10 hover:text-green-500 transition-colors">
                <Repeat2 className="w-[20px] h-[20px]" />
              </button>
              <button 
                onClick={handleLike}
                className="p-2 rounded-full hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                style={{ color: liked ? '#f43f5e' : undefined }}
              >
                <Heart className={`w-[20px] h-[20px] ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
              <button className="p-2 rounded-full hover:bg-[#ff7a00]/10 hover:text-[#ff7a00] transition-colors">
                <Bookmark className="w-[20px] h-[20px]" />
              </button>
              <button className="p-2 rounded-full hover:bg-white/5 hover:text-white transition-colors">
                <Share2 className="w-[20px] h-[20px]" />
              </button>
            </div>
          </div>

          {/* INLINE COMMENT REPLY BOX */}
          <div className="p-4 border-b border-[#ffffff14] flex gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#ff7a00]/10 border border-[#ff7a00]/30 select-none flex-shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-[#ff7a00] font-bold text-xs">{userInitials}</span>
              )}
            </div>
            
            <div className="flex-1 flex flex-col">
              <textarea
                ref={commentInputRef}
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                placeholder="Yanıtını gönder"
                className="w-full bg-transparent resize-none focus:outline-none text-[16px] leading-relaxed py-2 placeholder-gray-600 text-white min-h-[50px]"
                rows={2}
              />

              {/* Media Preview */}
              {mediaUrl && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/40 max-h-[160px] self-start inline-block">
                  <img
                    src={mediaUrl}
                    alt="Comment reply media preview"
                    className="max-h-[160px] object-contain rounded-xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setMediaUrl('')}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-all"
                    title="Medyayı kaldır"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Media URL Input Box */}
              {showMediaInput && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={e => setMediaUrl(e.target.value)}
                    placeholder={mediaMode === 'GIF' ? "GIF URL'si ekleyin (örn. https://...)" : "Görsel veya video URL'si ekleyin (örn. https://...)"}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff7a00]"
                  />
                  <select
                    value={mediaType}
                    onChange={e => setMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
                    className="bg-[#000] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff7a00] cursor-pointer"
                  >
                    <option value="IMAGE">Resim / GIF</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>
              )}

              {/* Presets for GIF Mode */}
              {showMediaInput && mediaMode === 'GIF' && (
                <div className="mt-2.5">
                  <p className="text-[10px] text-gray-500 mb-1 font-medium">Hızlı Reaksiyon GIF'leri</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '🔥 Harika', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2o0bDZ1ZHp4ZzB5ODNpeGZhc3Y2N2x2dWx5ZXo4MnFmNjB1d3pwMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2K1M66DFgt5hAI/giphy.gif' },
                      { label: '😂 LOL', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmlkNXlhcG9qbm82d2NseXg0OXVzOTc4NDhpeDFtdWkyZHdqNjVydCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/c8UN4CgRenjQA/giphy.gif' },
                      { label: '👍 Süper', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMm1mMGVydTNyOHVyNHk2b2E0d3F0N3J0ZGVvY3I3N3ltbnpxYjZiaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7absbD718RL7MLx6/giphy.gif' },
                      { label: '🤯 Şok', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqdzJ5NHBqMndjNnhscTFhbXRrcTZxMXdweGxxajN1bmt5NHV5ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2rqDfPukWT4yc/giphy.gif' },
                      { label: '🤦‍♂️ Yapma', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbndqMnJmdzFtbG02ejBvMXh1d3J2NnkyYzg2ZWVjMTd3cmphOGoxciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3og0INyM8CgUMLLmeQ/giphy.gif' }
                    ].map((gif) => (
                      <button
                        key={gif.label}
                        type="button"
                        onClick={() => {
                          setMediaUrl(gif.url);
                          setMediaType('IMAGE');
                        }}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-[#ff7a00] transition-all"
                      >
                        {gif.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Emoji Picker Area */}
              {showEmojiPicker && (
                <div className="mt-3 bg-white/5 p-2 rounded-xl border border-white/10">
                  <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Hızlı Emojiler</p>
                  <div className="grid grid-cols-8 gap-1.5">
                    {['😀', '😂', '🤣', '😊', '😍', '😘', '😜', '😎', '🤔', '🙄', '😭', '😱', '😡', '👍', '👎', '❤️', '🔥', '✨', '🎉', '👏', '🚀', '💯'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCommentText(p => p + emoji)}
                        className="text-lg p-1 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.04]">
                <div className="flex items-center gap-1 text-[#ff7a00]">
                  <button 
                    type="button" 
                    onClick={handleToggleImage}
                    className={`p-1.5 rounded-full hover:bg-[#ff7a00]/10 transition-all ${mediaMode === 'IMAGE' ? 'text-white bg-[#ff7a00]/20' : ''}`}
                    title="Görsel ekle"
                  >
                    <ImageIcon className="w-[18px] h-[18px]" />
                  </button>
                  <button 
                    type="button" 
                    onClick={handleToggleGif}
                    className={`px-1.5 py-1 rounded-full hover:bg-[#ff7a00]/10 transition-all font-bold text-[10px] leading-none ${mediaMode === 'GIF' ? 'text-white bg-[#ff7a00]/20' : ''}`}
                    title="GIF ekle"
                  >
                    GIF
                  </button>
                  <button 
                    type="button" 
                    onClick={handleToggleEmoji}
                    className={`p-1.5 rounded-full hover:bg-[#ff7a00]/10 transition-all ${showEmojiPicker ? 'text-white bg-[#ff7a00]/20' : ''}`}
                    title="Emoji ekle"
                  >
                    <Smile className="w-[18px] h-[18px]" />
                  </button>
                </div>

                <button
                  onClick={(e) => handleAddComment(e)}
                  disabled={!newCommentText.trim() && !mediaUrl.trim()}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] disabled:opacity-40 transition-all"
                >
                  Yanıtla
                </button>
              </div>
            </div>
          </div>

          {/* COMMENTS LIST */}
          <div className="flex flex-col w-full px-4 pb-20">
            {comments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-gray-500">Henüz yorum yapılmamış. İlk yorumu siz yazın!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  onReplySubmit={handleAddComment}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                />
              ))
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <RightSidebar user={user} />
      </div>
    </div>
  );
}
