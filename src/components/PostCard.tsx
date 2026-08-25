import React from 'react';
import { 
  HeartHandshake, 
  Heart, 
  MessageSquareHeart, 
  Globe, 
  School as SchoolIcon, 
  Sprout, 
  Share2, 
  Bookmark, 
  MessageCircle,
  User,
  BadgeCheck,
  Hourglass,
  Pencil,
  Trash2,
  Sparkles
} from 'lucide-react';
import { Post } from '../types';
import { calculateReputationScore } from '../lib/reputationUtils';
import { ReputationBadge } from './ReputationBadge';
import { formatRelativeTime, formatFullDateTime } from '../lib/dateUtils';
import { getFormattedAuthorName } from '../lib/authorUtils';

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onToggleLike: (postId: string, e: React.MouseEvent) => void;
  onToggleHug: (postId: string, e: React.MouseEvent) => void;
  onToggleSave: (postId: string, e: React.MouseEvent) => void;
  onSharePost?: (post: Post, e: React.MouseEvent) => void;
  onEditPost?: (post: Post, e: React.MouseEvent) => void;
  onDeletePost?: (postId: string, e: React.MouseEvent) => void;
  onConnectWithAuthor?: (post: Post, e: React.MouseEvent) => void;
  isAuthor?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onClick,
  onToggleLike,
  onToggleHug,
  onToggleSave,
  onSharePost,
  onEditPost,
  onDeletePost,
  onConnectWithAuthor,
  isAuthor
}) => {
  return (
    <article
      onClick={onClick}
      className="bg-[var(--bg-card)] border border-[var(--border-glass)] glass-panel rounded-2xl p-5 sm:p-6 relative overflow-hidden group cursor-pointer hover:-translate-y-1 hover:border-[#8BA888]/60 transition-all shadow-sm"
    >
      {/* Top Natural Glow Accent Bar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#8BA888]/40 rounded-b-full shadow-[0_0_15px_rgba(139,168,136,0.4)] group-hover:shadow-[0_0_25px_rgba(139,168,136,0.7)] transition-all"></div>

      {/* Author Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {post.isIdentityPublic && post.authorAvatarUrl ? (
            <img
              src={post.authorAvatarUrl}
              alt={getFormattedAuthorName(post)}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#2A4228] dark:border-[#8BA888]/60 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#E9EDC9] dark:bg-[#2C382A] border border-[#CCD5AE] dark:border-[#3A4738] flex items-center justify-center text-[#5A6E58] dark:text-[#8BA888] font-bold text-xs shrink-0 shadow-2xs">
              {post.isIdentityPublic ? (
                <User className="w-4 h-4 text-[#5A6E58] dark:text-[#8BA888]" />
              ) : (
                <Sprout className="w-4 h-4 text-[#5A6E58] dark:text-[#8BA888]" />
              )}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-[#182217] dark:text-[#E8ECE6]">
                {getFormattedAuthorName(post)}
              </span>

              {post.isIdentityPublic ? (
                <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  <span>Danh tính chính</span>
                </span>
              ) : null}

              {post.authorMajor && post.isIdentityPublic && (
                <span className="bg-[#2A4228]/10 dark:bg-[#8BA888]/15 text-[#2A4228] dark:text-[#8BA888] border border-[#8BA888]/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {post.authorMajor}
                </span>
              )}

              {post.authorCohort && (
                <span className="bg-[#2A4228] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  {post.authorCohort}
                </span>
              )}

              <ReputationBadge 
                score={post.authorReputationScore ?? calculateReputationScore(
                  !!post.authorClassBadge || post.authorAnonId.includes('Xác thực') || post.authorAnonId.includes('492'), 
                  post.hugsCount
                )} 
                size="sm" 
              />
              {post.authorClassBadge && !post.isIdentityPublic && (
                <span className="bg-[#F1F3EF] dark:bg-[#2A3628] text-[#385036] dark:text-[#8BA888] border border-[#DCD9D0] dark:border-[#3A4738] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {post.authorClassBadge}
                </span>
              )}
              {post.isPublic ? (
                <span className="bg-[#385036]/15 text-[#385036] dark:text-[#8BA888] border border-[#8BA888]/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Sảnh Chung</span>
                </span>
              ) : (
                <span className="bg-[#F1F3EF] dark:bg-[#20281F] text-[#42493F] dark:text-[#8E9B8A] border border-[#E5E2D9] dark:border-[#3A4738] text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <SchoolIcon className="w-2.5 h-2.5" />
                  <span>{post.schoolName}</span>
                </span>
              )}
              {post.expiresAt && (
                <span 
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  title="Lá thư tâm sự ẩn danh có thời hạn tự hủy để bảo vệ quyền riêng tư"
                >
                  <span className="flex items-center gap-1">
                    <Hourglass className="w-2.5 h-2.5" />
                    {(() => {
                      const diffMs = post.expiresAt - Date.now();
                      if (diffMs <= 0) return 'Sắp tự hủy';
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      if (hours < 24) return `Tự hủy sau ${Math.max(1, hours)}h`;
                      return `Tự hủy sau ${Math.ceil(hours / 24)} ngày`;
                    })()}
                  </span>
                </span>
              )}
            </div>
            <p 
              className="text-[10px] text-[#2C382A] dark:text-[#8E9B8A] uppercase font-bold mt-0.5"
              title={formatFullDateTime(post.createdAt || post.id)}
            >
              {formatRelativeTime(post.createdAt, post.timestamp, post.id)}
            </p>
          </div>
        </div>

        {/* Tags & Author Actions */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap gap-1.5 justify-end">
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-[#F1F3EF] dark:bg-[#2A3628] text-[#385036] dark:text-[#8BA888] border border-[#E5E2D9] dark:border-[#3A4738] text-[10px] font-bold tracking-wider uppercase"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Author Action Buttons (Edit / Delete) */}
          {(onEditPost || onDeletePost || isAuthor) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {onEditPost && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPost(post, e);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-[#8BA888]/20 text-[#5A6E58] dark:text-[#8BA888] border border-[#E5E2D9] dark:border-[#3A4738] text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="Chỉnh sửa lá thư"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Sửa</span>
                </button>
              )}
              {onDeletePost && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePost(post.id, e);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-rose-500/20 text-rose-500 border border-rose-200 dark:border-rose-900/50 text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="Xóa lá thư này"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Title & Content Snippet */}
      <h3 className="font-serif text-lg font-bold text-[#182217] dark:text-[#E8ECE6] group-hover:text-[#385036] dark:group-hover:text-[#8BA888] transition-colors mb-2 leading-snug">
        {post.title}
      </h3>

      <p className="text-xs sm:text-sm text-[#0F180E] dark:text-[#E8ECE6] line-clamp-3 leading-relaxed mb-4 font-normal whitespace-pre-line">
        {post.content}
      </p>

      {/* Attached Image & Gemini Analysis Card */}
      {post.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] p-2.5 flex items-center gap-3">
          <img src={post.imageUrl} alt="Attachment" className="w-16 h-16 object-cover rounded-lg shrink-0 border border-[#E5E2D9]" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2A4228] dark:text-[#8BA888]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini AI Phân Tích Hình Ảnh</span>
            </div>
            {post.imageAnalysis?.summary && (
              <p className="text-[10px] text-[#2C382A] dark:text-[#8E9B8A] truncate mt-0.5 font-medium">
                {post.imageAnalysis.summary}
              </p>
            )}
            {post.imageAnalysis?.emotionalTone && (
              <span className="inline-block mt-1 text-[9px] bg-[#8BA888]/15 text-[#2A4228] dark:text-[#8BA888] px-2 py-0.5 rounded-full font-medium">
                Cảm xúc: {post.imageAnalysis.emotionalTone}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Interactive Action Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E5E2D9] dark:border-[#2C382A] text-xs text-[#2C382A] dark:text-[#8E9B8A] font-semibold">
        <div className="flex items-center gap-4">
          {/* Hug Action */}
          <button
            onClick={(e) => onToggleHug(post.id, e)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all active:scale-95 ${
              post.isHugged
                ? 'bg-[#F1F3EF] dark:bg-[#2A3628] text-[#5A6E58] dark:text-[#8BA888] border-[#8BA888]/40 font-semibold shadow-2xs'
                : 'border-transparent hover:bg-[#F1F3EF] dark:hover:bg-white/5 hover:text-[#5A6E58]'
            }`}
            title="Gửi cái ôm & sự thấu cảm"
          >
            <HeartHandshake className={`w-4 h-4 transition-transform ${post.isHugged ? 'text-amber-500 scale-110' : 'text-slate-400'}`} />
            <span>{post.hugsCount} thấu cảm</span>
          </button>

          {/* Likes */}
          <button
            onClick={(e) => onToggleLike(post.id, e)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all active:scale-95 ${
              post.isLiked
                ? 'text-rose-500 font-semibold bg-rose-500/10'
                : 'hover:text-rose-500 hover:bg-rose-500/5'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            <span>{post.likesCount}</span>
          </button>

          {/* Replies count */}
          <span className="flex items-center gap-1.5 text-xs text-[#5A6E58] dark:text-[#8E9B8A]">
            <MessageSquareHeart className="w-3.5 h-3.5 text-slate-400" />
            <span>{post.repliesCount} lời khuyên</span>
          </span>
        </div>

        {/* Right Actions: Connect with Author, Share & Bookmark Save */}
        <div className="flex items-center gap-1.5">
          {onConnectWithAuthor && !isAuthor && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConnectWithAuthor(post, e);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2A4228]/10 hover:bg-[#2A4228] text-[#2A4228] hover:text-white dark:bg-[#8BA888]/15 dark:hover:bg-[#8BA888] dark:text-[#8BA888] dark:hover:text-[#182217] text-[11px] font-bold transition-all shadow-2xs active:scale-95"
              title="Nhắn tin an ủi tác giả ẩn danh 1-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>An ủi 1-1</span>
            </button>
          )}

          {onSharePost && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSharePost(post, e);
              }}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[#2C382A] dark:text-[#8E9B8A] hover:text-[#2A4228] dark:hover:text-[#8BA888]"
              title="Chia sẻ lá thư"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={(e) => onToggleSave(post.id, e)}
            className={`p-1.5 rounded-full transition-colors ${
              post.isSaved ? 'text-amber-500' : 'text-slate-400 hover:text-[var(--text-primary)]'
            }`}
            title="Lưu lại"
          >
            <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};
