import React, { useState } from 'react';
import { Post } from '../types';

interface ShareModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);

  if (!isOpen || !post) return null;

  const shareUrl = `${window.location.origin}/?post=${post.id}`;
  const shareText = `"Lá thư từ ${post.authorAnonId} (${post.schoolName})":\n\n${post.title}\n"${post.content.slice(0, 150)}..."\n\nLắng nghe và gửi lời xoa dịu tại The Lantern: ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.slice(0, 200),
          url: shareUrl
        });
      } catch (err) {
        console.log('Native share error or user cancelled:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col space-y-5">
        {/* Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2A4228] via-[#8BA888] to-[#2A4228]"></div>

        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2A4228] dark:text-[#8BA888]">share</span>
            <h3 className="font-serif italic font-bold text-lg text-[#0F180E] dark:text-[#E8ECE6]">
              Chia sẻ lá thư ấm áp
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#2C382A] dark:text-[#8E9B8A] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Post Preview Card */}
        <div className="bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#2A4228] dark:text-[#8BA888]">
            <span>🌱 {post.authorAnonId}</span>
            <span className="text-[10px] bg-[#2A4228]/10 px-2 py-0.5 rounded-full">{post.schoolName}</span>
          </div>
          <h4 className="font-serif font-bold text-sm text-[#0F180E] dark:text-[#E8ECE6] line-clamp-1">
            {post.title}
          </h4>
          <p className="text-xs text-[#2C382A] dark:text-[#8E9B8A] line-clamp-2 italic">
            "{post.content}"
          </p>
        </div>

        {/* Share Action Options */}
        <div className="space-y-2.5">
          {/* Native Share button (Mobile / Supported systems) */}
          {'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-base">ios_share</span>
              <span>Chia sẻ qua ứng dụng trên máy (Zalo, Messenger, Mail...)</span>
            </button>
          )}

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] hover:border-[#2A4228] text-[#0F180E] dark:text-[#E8ECE6] text-xs font-bold flex items-center justify-between transition-all active:scale-95"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#2A4228] dark:text-[#8BA888]">link</span>
              <span>{copiedLink ? 'Đã sao chép liên kết!' : 'Sao chép đường dẫn bài viết'}</span>
            </span>
            <span className="material-symbols-outlined text-sm text-[#2C382A] dark:text-[#8E9B8A]">
              {copiedLink ? 'check_circle' : 'content_copy'}
            </span>
          </button>

          {/* Copy Formatted Quote */}
          <button
            onClick={handleCopyQuote}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] hover:border-[#2A4228] text-[#0F180E] dark:text-[#E8ECE6] text-xs font-bold flex items-center justify-between transition-all active:scale-95"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#2A4228] dark:text-[#8BA888]">format_quote</span>
              <span>{copiedQuote ? 'Đã sao chép trích dẫn!' : 'Sao chép đoạn trích kèm lời nhắn'}</span>
            </span>
            <span className="material-symbols-outlined text-sm text-[#2C382A] dark:text-[#8E9B8A]">
              {copiedQuote ? 'check_circle' : 'content_copy'}
            </span>
          </button>
        </div>

        <p className="text-[11px] text-center text-[#2C382A] dark:text-[#8E9B8A] pt-1">
          Lá thư chia sẻ sẽ luôn được bảo mật danh tính tác giả 🕯️
        </p>
      </div>
    </div>
  );
};
