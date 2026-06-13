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
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Bookmark,
  Repeat2, Share2, ImageIcon, X,
  Smile, Sparkles, Trash2
} from 'lucide-react';
import useStore from '@/store';
import PostService, { PostResponse, CommentResponse } from '../services/post.service';
import { LeftSidebar, T, Av } from '../components/layout/LeftSidebar';
import { RightSidebar } from '../components/layout/RightSidebar';

// ─── DEV MOCK ────────────────────────────────────────────────────────────────
const MOCK_USER = {
  id: 'dev', username: 'gramdituser', email: 'demo@gramdit.com',
  fullName: 'Demo Kullanıcı', bio: null as string | null, avatarUrl: null as string | null,
};
type AppUser = typeof MOCK_USER;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

// ─────────────────────────────────────────────────────────────────────────────
// POST CARD
// ─────────────────────────────────────────────────────────────────────────────
// ─── COMMENT NODE (Recursive for Reddit-style nesting) ───────────────────────
export function CommentNode({
  comment,
  onReplySubmit,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  depth = 0,
}: {
  comment: CommentResponse;
  onReplySubmit: (e: React.FormEvent, parentId: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (t: string) => void;
  depth?: number;
}) {
  const initials = (comment.author.fullName || comment.author.username).slice(0, 2).toUpperCase();
  const timeStr = new Date(comment.createdAt).toLocaleDateString('tr-TR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex flex-col gap-2 mt-3 select-none" style={{ marginLeft: depth > 0 ? `${Math.min(depth * 12, 36)}px` : 0 }}>
      <div className="flex gap-2.5 items-start">
        {depth > 0 && (
          <div className="w-[1px] self-stretch bg-white/10 -ml-2 mr-1" />
        )}
        
        <Av url={comment.author.avatarUrl} initials={initials} color="#ff7a00" size={depth > 0 ? 28 : 34} />
        
        <div className="flex-1 min-w-0 bg-white/[0.02] border border-white/5 rounded-2xl px-3.5 py-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] font-bold text-white leading-none">
              {comment.author.fullName || comment.author.username}
            </span>
            <span className="text-[10.5px] text-gray-500">@{comment.author.username}</span>
            <span className="text-[10px] text-gray-600">·</span>
            <span className="text-[10.5px] text-gray-500">{timeStr}</span>
          </div>
          
          <p className="mt-1 text-[13px] leading-relaxed text-white/90 whitespace-pre-wrap">{comment.content}</p>
          
          {comment.mediaUrl && (
            <div className="mt-2 rounded-xl overflow-hidden border border-white/5 bg-black/20 max-h-[200px] max-w-[350px]">
              {comment.mediaType === 'VIDEO' ? (
                <video
                  src={comment.mediaUrl}
                  controls
                  className="w-full h-full object-cover max-h-[200px] rounded-xl"
                />
              ) : (
                <img
                  src={comment.mediaUrl}
                  alt="Comment media"
                  className="w-full h-full object-cover max-h-[200px] rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
                  }}
                />
              )}
            </div>
          )}
          
          <div className="flex items-center gap-3 mt-1.5 text-gray-500">
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-[11px] font-bold text-[#ff7a00] hover:underline transition-all"
            >
              Yanıtla
            </button>
          </div>

          {replyingTo === comment.id && (
            <form onSubmit={(e) => onReplySubmit(e, comment.id)} className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff7a00]"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] disabled:opacity-40"
              >
                Yanıtla
              </button>
            </form>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="flex flex-col gap-1">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              onReplySubmit={onReplySubmit}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── REPLY COMMENT MODAL (Twitter/X style reply popup) ──────────────────────
function ReplyCommentModal({
  open,
  onClose,
  post,
  user,
  onCommentCreated,
}: {
  open: boolean;
  onClose: () => void;
  post: PostResponse;
  user: AppUser;
  onCommentCreated: () => void;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Medya ve Emoji state'leri
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaMode, setMediaMode] = useState<'IMAGE' | 'GIF' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => ref.current?.focus(), 80);
      setError(null);
    } else {
      setText('');
      setMediaUrl('');
      setMediaType('IMAGE');
      setShowMediaInput(false);
      setMediaMode(null);
      setShowEmojiPicker(false);
    }
  }, [open]);

  if (!open) return null;

  const initials = (post.author.fullName || post.author.username).slice(0, 2).toUpperCase();
  const userInitials = (user.fullName || user.username).slice(0, 2).toUpperCase();

  // Medya varsa sonuna pic.x.com linki ekleme
  const getFormattedContent = () => {
    if (!post.media || post.media.length === 0) return post.content;
    const mediaId = post.media[0].id.replace(/-/g, '').substring(0, 10);
    return `${post.content} pic.x.com/${mediaId}`;
  };

  const timeStr = new Date(post.createdAt).toLocaleDateString('tr-TR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !mediaUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await PostService.createComment(
        post.id, 
        text, 
        undefined, 
        mediaUrl.trim() ? mediaUrl.trim() : undefined, 
        mediaUrl.trim() ? mediaType : undefined
      );
      onCommentCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create comment:', err);
      setError(err.message || 'Yanıt gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === e.currentTarget && !loading) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.96, y: -10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: -10 }}
          className="w-full max-w-[600px] rounded-2xl overflow-hidden flex flex-col relative"
          style={{ background: '#000000', border: `1px solid ${T.border}` }}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="px-5 py-2 bg-rose-500/10 text-rose-500 text-xs font-semibold border-b border-rose-500/20">
              ⚠️ {error}
            </div>
          )}

          {/* Body */}
          <div className="px-5 pt-2 pb-4 flex flex-col overflow-y-auto max-h-[50vh]">
            {/* Original Post */}
            <div className="flex gap-3 relative">
              {/* Vertical Thread Line */}
              <div className="absolute top-11 bottom-0 left-[20px] w-[2px] bg-neutral-800" />
              
              <Av url={post.author.avatarUrl} initials={initials} color="#ff7a00" size={40} className="z-10" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[15px] font-bold text-white leading-tight">
                    {post.author.fullName || post.author.username}
                  </span>
                  <span className="text-[13px] text-gray-500">@{post.author.username}</span>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-[13px] text-gray-500">{timeStr}</span>
                </div>
                <p className="mt-1 text-[15px] leading-relaxed text-white/95 whitespace-pre-wrap select-text">
                  {getFormattedContent()}
                </p>
                
                <div className="mt-3.5 text-[14px] text-gray-500">
                  <span className="text-[#ff7a00] hover:underline cursor-pointer">@{post.author.username}</span> adlı kullanıcıya yanıt olarak
                </div>
              </div>
            </div>

            {/* My Reply */}
            <div className="flex gap-3 mt-4 relative">
              <Av url={user.avatarUrl} initials={userInitials} color="#ff7a00" size={40} className="z-10" />
              
              <div className="flex-1">
                <textarea
                  ref={ref}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={loading}
                  placeholder="Yanıtını gönder"
                  className="w-full bg-transparent resize-none focus:outline-none text-[17px] leading-relaxed py-2 placeholder-gray-600 text-white min-h-[120px]"
                />

                {/* Yorum Medya Önizlemesi */}
                {mediaUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/40 max-h-[160px] self-start inline-block">
                    <img
                      src={mediaUrl}
                      alt="Reply media preview"
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
              </div>
            </div>
          </div>

          {/* Media Input Area */}
          {showMediaInput && (
            <div className="px-5 pb-3 border-t border-white/5 pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  disabled={loading}
                  placeholder={mediaMode === 'GIF' ? "GIF URL'si ekleyin (örn. https://...)" : "Görsel veya video URL'si ekleyin (örn. https://...)"}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff7a00] disabled:opacity-55"
                />
                <select
                  value={mediaType}
                  onChange={e => setMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
                  disabled={loading}
                  className="bg-[#000] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff7a00] cursor-pointer disabled:opacity-55"
                >
                  <option value="IMAGE">Resim / GIF</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
              
              {mediaMode === 'GIF' && (
                <div className="mt-3">
                  <p className="text-[11px] text-gray-500 mb-1.5 font-medium">Hızlı Reaksiyon GIF'leri</p>
                  <div className="flex flex-wrap gap-2">
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
                        className="px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-[#ff7a00] transition-all"
                      >
                        {gif.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emoji Picker Area */}
          {showEmojiPicker && (
            <div className="px-5 pb-3 border-t border-white/5 pt-3">
              <p className="text-[11px] text-gray-500 mb-2 font-medium">Hızlı Emojiler</p>
              <div className="grid grid-cols-8 gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                {['😀', '😂', '🤣', '😊', '😍', '😘', '😜', '😎', '🤔', '🙄', '😭', '😱', '😡', '👍', '👎', '❤️', '🔥', '✨', '🎉', '👏', '🚀', '💯'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setText(prev => prev + emoji);
                      ref.current?.focus();
                    }}
                    className="text-xl p-1.5 rounded-lg hover:bg-white/10 transition-all active:scale-90 flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Bar / Action Icons */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10" style={{ background: '#000000' }}>
            <div className="flex items-center gap-0.5 text-[#ff7a00]">
              <button 
                type="button" 
                onClick={handleToggleImage}
                className={`p-2 rounded-full hover:bg-[#ff7a00]/10 transition-all ${mediaMode === 'IMAGE' ? 'text-white bg-[#ff7a00]/20' : ''}`}
                title="Görsel ekle"
              >
                <ImageIcon className="w-[19px] h-[19px]" />
              </button>
              <button 
                type="button" 
                onClick={handleToggleGif}
                className={`px-2 py-2 rounded-full hover:bg-[#ff7a00]/10 transition-all font-bold text-[11px] leading-none ${mediaMode === 'GIF' ? 'text-white bg-[#ff7a00]/20' : ''}`}
                title="GIF ekle"
              >
                GIF
              </button>
              <button 
                type="button" 
                onClick={handleToggleEmoji}
                className={`p-2 rounded-full hover:bg-[#ff7a00]/10 transition-all ${showEmojiPicker ? 'text-white bg-[#ff7a00]/20' : ''}`}
                title="Emoji ekle"
              >
                <Smile className="w-[19px] h-[19px]" />
              </button>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={(!text.trim() && !mediaUrl.trim()) || loading}
              className="px-5 py-2 rounded-full text-[14px] font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: (text.trim() || mediaUrl.trim()) ? '#ff7a00' : 'rgba(255,122,0,0.35)',
                color: (text.trim() || mediaUrl.trim()) ? '#ffffff' : 'rgba(255,255,255,0.5)'
              }}
            >
              {loading ? 'Yanıtlanıyor...' : 'Yanıtla'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── POST CARD ─────────────────────────────────────────────────────────────
export function PostCard({
  post,
  onDelete,
  onLikeToggle,
  onSaveToggle,
  onRepostToggle
}: {
  post: PostResponse;
  onDelete?: (id: string) => void;
  onLikeToggle?: (id: string, newLiked: boolean) => void;
  onSaveToggle?: (id: string, newSaved: boolean) => void;
  onRepostToggle?: (id: string, newReposted: boolean) => void;
}) {
  const storeUser = useStore(s => s.user);
  const user = (storeUser ?? MOCK_USER) as AppUser;
  const navigate = useNavigate();

  const [deleted, setDeleted] = useState(false);
  const initialLiked = post.reactions ? post.reactions.some(r => r.userId === user.id && r.reactionType === 'LIKE') : false;
  const initialSaved = post.savedPosts ? post.savedPosts.some(s => s.userId === user.id) : false;
  const initialReposted = post.reposts ? post.reposts.some(r => r.userId === user.id) : false;
  const [liked,  setLiked]  = useState(initialLiked);
  const [likes,  setLikes]  = useState(post.reactionCount);
  const [saved,  setSaved]  = useState(initialSaved);
  const [reposted, setReposted] = useState(initialReposted);
  const [repostsCount, setRepostsCount] = useState(post.repostCount || 0);

  // Instagram-style animation states
  const [animateLike, setAnimateLike] = useState(false);
  const [animateRepost, setAnimateRepost] = useState(false);
  const [animateSave, setAnimateSave] = useState(false);
  const [animateComment, setAnimateComment] = useState(false);
  const [animateShare, setAnimateShare] = useState(false);

  useEffect(() => {
    const hasLiked = post.reactions ? post.reactions.some(r => r.userId === user.id && r.reactionType === 'LIKE') : false;
    setLiked(hasLiked);
    setLikes(post.reactionCount);

    const hasSaved = post.savedPosts ? post.savedPosts.some(s => s.userId === user.id) : false;
    setSaved(hasSaved);

    const hasReposted = post.reposts ? post.reposts.some(r => r.userId === user.id) : false;
    setReposted(hasReposted);
    setRepostsCount(post.repostCount || 0);
  }, [post.reactions, post.reactionCount, post.savedPosts, post.reposts, post.repostCount, user.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimateLike(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : prev - 1);
    if (onLikeToggle) {
      onLikeToggle(post.id, newLiked);
    }
    try {
      await PostService.toggleReaction(post.id, 'LIKE');
    } catch (err) {
      console.error('Failed to toggle post reaction:', err);
      setLiked(!newLiked);
      setLikes(prev => !newLiked ? prev + 1 : prev - 1);
      if (onLikeToggle) {
        onLikeToggle(post.id, !newLiked);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      await PostService.deletePost(post.id);
      setDeleted(true);
      if (onDelete) onDelete(post.id);
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Gönderi silinirken bir hata oluştu.');
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimateSave(true);
    const newSaved = !saved;
    setSaved(newSaved);
    if (onSaveToggle) {
      onSaveToggle(post.id, newSaved);
    }
    try {
      if (newSaved) {
        await PostService.savePost(post.id);
      } else {
        await PostService.unsavePost(post.id);
      }
    } catch (err) {
      console.error('Failed to toggle save post:', err);
      setSaved(!newSaved);
      if (onSaveToggle) {
        onSaveToggle(post.id, !newSaved);
      }
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimateRepost(true);
    const newReposted = !reposted;
    setReposted(newReposted);
    setRepostsCount(prev => newReposted ? prev + 1 : Math.max(0, prev - 1));
    if (onRepostToggle) {
      onRepostToggle(post.id, newReposted);
    }
    try {
      if (newReposted) {
        await PostService.repost(post.id);
      } else {
        await PostService.unrepost(post.id);
      }
    } catch (err) {
      console.error('Failed to toggle repost:', err);
      setReposted(!newReposted);
      setRepostsCount(prev => !newReposted ? prev + 1 : Math.max(0, prev - 1));
      if (onRepostToggle) {
        onRepostToggle(post.id, !newReposted);
      }
    }
  };

  const [showComments] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(post.commentCount);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const initials = (post.author.fullName || post.author.username).slice(0, 2).toUpperCase();
  const color = '#ff7a00';

  const timeStr = new Date(post.createdAt).toLocaleDateString('tr-TR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const data = await PostService.getComments(post.id);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const handleAddComment = async (e: React.FormEvent, parentCommentId?: string) => {
    e.preventDefault();
    const text = parentCommentId ? replyText : newCommentText;
    if (!text.trim()) return;

    try {
      await PostService.createComment(post.id, text, parentCommentId);
      if (parentCommentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewCommentText('');
      }
      setCommentsCount(prev => prev + 1);
      await fetchComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  if (deleted) return null;

  return (
    <article 
      onClick={() => navigate(`/posts/${post.id}`)}
      className="flex gap-3 px-4 py-3.5 transition-colors duration-150 cursor-pointer border-b border-[#ffffff14] hover:bg-white/[0.015]"
    >
      <div onClick={(e) => { e.stopPropagation(); navigate(`/@${post.author.username}`); }} className="mt-0.5 flex-shrink-0 cursor-pointer">
        <Av url={post.author.avatarUrl} initials={initials} color={color} size={40} className="hover:opacity-85 transition-opacity" />
      </div>
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span onClick={(e) => { e.stopPropagation(); navigate(`/@${post.author.username}`); }} className="text-[14px] font-bold text-white hover:underline cursor-pointer">{post.author.fullName || post.author.username}</span>
            <span onClick={(e) => { e.stopPropagation(); navigate(`/@${post.author.username}`); }} className="text-[13px] text-gray-500 hover:underline cursor-pointer">@{post.author.username}</span>
            <span className="text-xs text-gray-600">·</span>
            <span className="text-[13px] text-gray-500">{timeStr}</span>
            {post.community && (
              <>
                <span className="text-xs text-gray-600">·</span>
                <span className="text-[12px] text-[#ff7a00] font-semibold hover:underline">
                  c/{post.community.name}
                </span>
              </>
            )}
          </div>
          {post.author.id === user.id && (
            <button
              onClick={handleDelete}
              className="p-1 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-auto flex-shrink-0"
              title="Gönderiyi Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="mt-1 text-[14px] leading-normal text-white/90 whitespace-pre-wrap">{post.content}</p>

        {/* Media Render */}
        {post.media && post.media.length > 0 && (
          <div className="mt-3 grid gap-2 rounded-xl overflow-hidden border border-white/5 bg-black/20 max-h-[350px]">
            {post.media.map((med) => {
              if (med.mediaType === 'IMAGE') {
                return (
                  <img
                    key={med.id}
                    src={med.mediaUrl}
                    alt="Post media"
                    className="w-full h-full object-cover max-h-[350px] rounded-xl"
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
                    className="w-full h-full object-cover max-h-[350px] rounded-xl"
                  />
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 max-w-[420px] -ml-2 text-gray-500">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setAnimateComment(true);
              setCommentModalOpen(true);
            }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 p-2 rounded-full text-[13px] font-medium transition-colors hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0]"
          >
            <motion.div
              animate={animateComment ? { scale: [1, 1.25, 0.9, 1.1, 1], rotate: [0, -10, 8, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.4 }}
              onAnimationComplete={() => setAnimateComment(false)}
            >
              <MessageCircle className="w-[22px] h-[22px]" />
            </motion.div>
            <span>{fmt(commentsCount)}</span>
          </motion.button>

          <motion.button
            onClick={handleRepost}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-[#00ba7c]/10 hover:text-[#00ba7c] transition-colors text-[13px] font-medium"
            style={{ color: reposted ? '#00ba7c' : undefined }}
          >
            <motion.div
              animate={animateRepost ? { scale: [1, 1.3, 0.9, 1.1, 1], rotate: [0, 180] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.45 }}
              onAnimationComplete={() => setAnimateRepost(false)}
            >
              {reposted ? (
                <svg className="w-[22px] h-[22px] text-[#00ba7c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m17 2 4 4-4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 11v-1a4 4 0 0 1 4-4h14" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m7 22-4-4 4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13v1a4 4 0 0 1-4 4H3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" strokeWidth={2} />
                </svg>
              ) : (
                <Repeat2 className="w-[22px] h-[22px]" />
              )}
            </motion.div>
            <span>{fmt(repostsCount)}</span>
          </motion.button>
          
          <motion.button 
            onClick={handleLike}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-rose-500/10 hover:text-rose-500 transition-colors text-[13px] font-medium"
            style={{ color: liked ? '#f43f5e' : undefined }}
          >
            <motion.div
              animate={animateLike ? { scale: [1, 1.45, 0.9, 1.15, 0.95, 1], rotate: [0, -15, 15, -8, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.45 }}
              onAnimationComplete={() => setAnimateLike(false)}
            >
              <Heart className={`w-[22px] h-[22px] ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </motion.div>
            <span>{fmt(likes)}</span>
          </motion.button>
          
          <motion.button 
            onClick={handleSave}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="p-2 rounded-full hover:bg-[#ff7a00]/10 hover:text-[#ff7a00] transition-colors"
            style={{ color: saved ? '#ff7a00' : undefined }}
          >
            <motion.div
              animate={animateSave ? { scale: [1, 1.3, 0.9, 1.1, 1], y: [0, -4, 2, 0] } : { scale: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              onAnimationComplete={() => setAnimateSave(false)}
            >
              <Bookmark className={`w-[22px] h-[22px] ${saved ? 'fill-[#ff7a00] text-[#ff7a00]' : ''}`} />
            </motion.div>
          </motion.button>
          
          <motion.button 
            onClick={(e) => {
              e.stopPropagation();
              setAnimateShare(true);
              navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`).catch(() => {});
            }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="p-2 rounded-full hover:bg-white/5 hover:text-white transition-colors"
          >
            <motion.div
              animate={animateShare ? { scale: [1, 1.25, 0.9, 1.1, 1], rotate: [0, 20, -10, 0], x: [0, 4, -2, 0] } : { scale: 1, rotate: 0, x: 0 }}
              transition={{ duration: 0.45 }}
              onAnimationComplete={() => setAnimateShare(false)}
            >
              <Share2 className="w-[22px] h-[22px]" />
            </motion.div>
          </motion.button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-[#ffffff0a] flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-[13px] font-bold text-white">Yorumlar</h4>
            
            {/* New Comment Input */}
            <form onSubmit={(e) => handleAddComment(e)} className="flex gap-2.5 items-end">
              <input
                type="text"
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                placeholder="Yorumunuzu yazın..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff7a00]"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] disabled:opacity-40"
              >
                Gönder
              </button>
            </form>

            {/* Comments List */}
            <div className="mt-2 flex flex-col gap-2">
              {commentsLoading ? (
                <p className="text-center text-xs text-gray-500 py-4">Yorumlar yükleniyor...</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-4">Henüz yorum yapılmamış. İlk yorumu siz yazın!</p>
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
          </div>
        )}
      </div>
      <ReplyCommentModal
        open={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        post={post}
        user={user}
        onCommentCreated={async () => {
          setCommentsCount(prev => prev + 1);
        }}
      />
    </article>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// COMPOSE CARD
// ─────────────────────────────────────────────────────────────────────────────
function ComposeCard({ user, onPostCreated }: { user: AppUser; onPostCreated: () => void }) {
  const initials = (user.fullName || user.username).slice(0, 2).toUpperCase();
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX = 280;
  const left = MAX - text.length;

  const handlePublish = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Gönderiyi oluştur
      const post = await PostService.create({ content: text });
      
      // 2. Eğer medya URL'si girilmişse medyayı ekle
      if (mediaUrl.trim()) {
        await PostService.addMedia(post.id, {
          mediaUrl: mediaUrl.trim(),
          mediaType: mediaType,
        });
      }
      
      setText('');
      setMediaUrl('');
      setMediaType('IMAGE');
      setShowMediaInput(false);
      onPostCreated();
    } catch (err: any) {
      console.error('Failed to publish post inline:', err);
      setError(err.message || 'Gönderi paylaşılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-3 border-b border-[#ffffff14] flex flex-col gap-2">
      <div className="flex gap-3">
        <Av url={user.avatarUrl} initials={initials} color={T.accent} size={40} className="mt-1 flex-shrink-0" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={loading}
            placeholder="Ne paylaşmak istiyorsun?"
            className="w-full bg-transparent resize-none focus:outline-none text-[16px] leading-relaxed py-2 placeholder-gray-600 text-white"
            rows={2}
          />
        </div>
      </div>

      {showMediaInput && (
        <div className="pl-[52px] pr-2 pb-2 flex gap-2">
          <input
            type="text"
            value={mediaUrl}
            onChange={e => setMediaUrl(e.target.value)}
            disabled={loading}
            placeholder="Görsel veya video URL'si ekleyin (örn. https://...)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff7a00] disabled:opacity-55"
          />
          <select
            value={mediaType}
            onChange={e => setMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
            disabled={loading}
            className="bg-[#0f0f0f] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff7a00] cursor-pointer disabled:opacity-55"
          >
            <option value="IMAGE">Resim</option>
            <option value="VIDEO">Video</option>
          </select>
        </div>
      )}

      {error && (
        <div className="pl-[52px] text-red-500 text-xs font-semibold pb-2">
          ⚠️ {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04] pl-[52px]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMediaInput(p => !p)}
            disabled={loading}
            className={`p-2 rounded-full hover:bg-white/5 transition-colors ${showMediaInput ? 'text-[#ff7a00]' : 'text-gray-400'}`}
            title="Medya ekle"
          >
            <ImageIcon className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {text.length > 0 && (
            <span className="text-[12px] font-medium"
              style={{ color: left < 0 ? '#f43f5e' : left <= 20 ? '#f59e0b' : T.mutedLo }}>
              {left}
            </span>
          )}
          <button
            disabled={!text.trim() || left < 0 || loading}
            onClick={handlePublish}
            className="px-5 py-1.5 rounded-full text-sm font-bold text-white bg-[#ff7a00] hover:bg-[#e86e00] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            style={{ background: text.trim() && left >= 0 && !loading ? T.accent : undefined }}
          >
            {loading ? 'Paylaşılıyor...' : 'Paylaş'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ComposeModal({ open, onClose, user, onPostCreated }: { open: boolean; onClose: () => void; user: AppUser; onPostCreated: () => void }) {
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ref  = useRef<HTMLTextAreaElement>(null);
  const MAX  = 280;

  useEffect(() => {
    if (open) {
      setTimeout(() => ref.current?.focus(), 80);
      setError(null);
    } else {
      setText('');
      setMediaUrl('');
      setMediaType('IMAGE');
      setShowMediaInput(false);
    }
  }, [open]);

  const initials = (user.fullName || user.username).slice(0, 2).toUpperCase();
  const left = MAX - text.length;

  const handlePublish = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Gönderiyi oluştur
      const post = await PostService.create({ content: text });
      
      // 2. Eğer medya URL'si girilmişse medyayı ekle
      if (mediaUrl.trim()) {
        await PostService.addMedia(post.id, {
          mediaUrl: mediaUrl.trim(),
          mediaType: mediaType,
        });
      }
      
      onPostCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to publish post:', err);
      setError(err.message || 'Gönderi paylaşılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}>
          <motion.div initial={{ scale: 0.96, y: -14, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#0f0f0f', border: `1px solid ${T.border}` }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4"
              style={{ borderBottom: `1px solid ${T.border}` }}>
              <span className="custom-font-serif text-[16px] font-light" style={{ color: T.muted }}>
                Yeni Gönderi
              </span>
              <button onClick={onClose} disabled={loading}
                className="p-1.5 rounded-full transition-all disabled:opacity-30"
                style={{ color: T.mutedLo }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.color = T.text; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.mutedLo; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-5 pt-3 text-red-500 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Textarea */}
            <div className="flex gap-3 px-5 py-4">
              <Av url={user.avatarUrl} initials={initials} color={T.accent} size={40} className="mt-0.5" />
              <textarea ref={ref} value={text} onChange={e => setText(e.target.value)} disabled={loading}
                placeholder="Ne paylaşmak istiyorsun?" rows={5}
                className="flex-1 bg-transparent resize-none focus:outline-none text-[15px] leading-relaxed disabled:opacity-55"
                style={{ color: 'rgba(255,255,255,0.85)', caretColor: T.accent }}
              />
            </div>

            {/* Media Input Area */}
            {showMediaInput && (
              <div className="px-5 pb-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={e => setMediaUrl(e.target.value)}
                    disabled={loading}
                    placeholder="Görsel veya video URL'si ekleyin (örn. https://...)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff7a00] disabled:opacity-55"
                  />
                  <select
                    value={mediaType}
                    onChange={e => setMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
                    disabled={loading}
                    className="bg-[#0f0f0f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff7a00] cursor-pointer disabled:opacity-55"
                  >
                    <option value="IMAGE">Resim</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowMediaInput(p => !p)}
                  className={`p-2 rounded-full hover:bg-white/5 transition-all disabled:opacity-30 ${showMediaInput ? 'text-[#ff7a00]' : 'text-gray-400'}`}
                  title="Medya ekle"
                >
                  <ImageIcon className="w-[18px] h-[18px]" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                {text.length > 0 && (
                  <span className="text-[12px] font-medium"
                    style={{ color: left < 0 ? '#f43f5e' : left <= 20 ? '#f59e0b' : T.mutedLo }}>
                    {left}
                  </span>
                )}
                <button
                  disabled={!text.trim() || left < 0 || loading}
                  onClick={handlePublish}
                  className="px-5 py-2 rounded-full text-[13px] font-bold text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: T.accent, boxShadow: `0 2px 12px ${T.accent}30` }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.background = '#e86e00'; }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.accent}>
                  {loading ? 'Paylaşılıyor...' : 'Paylaş'}
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
function CenterFeed({ user, posts, loading, onPostCreated }: { user: AppUser; posts: PostResponse[]; loading: boolean; onPostCreated: () => void }) {
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
      <ComposeCard user={user} onPostCreated={onPostCreated} />

      {/* Posts */}
      <div className="flex flex-col w-full pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-[#ff7a00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Gönderiler yükleniyor...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Sparkles className="w-8 h-8 text-[#ff7a00]/40 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-white mb-1">Henüz gönderi yok</p>
            <p className="text-[12px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
              Bu toplulukta veya akışta henüz hiç gönderi paylaşılmamış. İlk gönderiyi sen paylaş!
            </p>
          </div>
        ) : (
          posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))
        )}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// MAIN — Centered layout, max-w-[1225px]
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const storeUser = useStore(s => s.user);
  const user = (storeUser ?? MOCK_USER) as AppUser;
  const [composeOpen, setComposeOpen] = useState(false);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const list = await PostService.getAll();
      setPosts(list);
    } catch (err) {
      console.error('Gönderiler yüklenirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <>
      {/*
       * 3-column layout, max-w-[1225px] centered.
       * WebGL canvas (fixed, z-10 negative) shows through transparent sidebars.
       * Only the center column scrolls.
       */}
      <div className="flex justify-center w-full min-h-screen bg-transparent">
        <div className="flex w-full max-w-[1380px] h-screen overflow-hidden relative justify-center">

          {/* LEFT SIDEBAR */}
          <LeftSidebar user={user} onCompose={() => setComposeOpen(true)} />

          {/* CENTER FEED — scrollable */}
          <main className="w-full max-w-[600px] flex-shrink-1 h-screen overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-r border-[#ffffff14] flex flex-col bg-black/10 backdrop-blur-[1px]">
            <CenterFeed user={user} posts={posts} loading={loading} onPostCreated={fetchPosts} />
          </main>

          {/* RIGHT SIDEBAR */}
          <RightSidebar user={user} />

        </div>
      </div>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} user={user} onPostCreated={fetchPosts} />
    </>
  );
}
