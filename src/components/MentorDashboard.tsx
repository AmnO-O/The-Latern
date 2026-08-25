import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Post } from '../types';
import { formatRelativeTime, formatFullDateTime } from '../lib/dateUtils';
import { getFormattedAuthorName } from '../lib/authorUtils';

interface MentorDashboardProps {
  posts: Post[];
  onApprovePost: (postId: string) => void;
  onRejectPost: (postId: string) => void;
  onMentorReplyToPost: (postId: string, content: string) => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({
  posts,
  onApprovePost,
  onRejectPost,
  onMentorReplyToPost
}) => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'mentor_queue' | 'all_master_feed'>('moderation');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'public' | 'campus'>('all');
  const [replyInput, setReplyInput] = useState<{ [postId: string]: string }>({});

  // Filter posts based on school, scope, and tab
  const filteredPosts = posts.filter(p => {
    // School filter
    if (schoolFilter !== 'all' && p.schoolId !== schoolFilter && p.schoolName !== schoolFilter) {
      return false;
    }
    // Scope filter
    if (scopeFilter === 'public' && !p.isPublic) return false;
    if (scopeFilter === 'campus' && p.isPublic) return false;

    // Tab filter
    if (activeTab === 'moderation') {
      return p.status === 'flagged' || p.status === 'pending_review' || p.crisisDetected;
    }
    if (activeTab === 'mentor_queue') {
      return p.tags.includes('Áp lực học tập') || p.tags.includes('Gia đình') || p.crisisDetected;
    }
    // all_master_feed shows everything across all schools!
    return true;
  });

  const uniqueSchools = Array.from(new Set(posts.map(p => p.schoolName)));

  const handleSendMentorReply = (postId: string) => {
    const text = replyInput[postId]?.trim();
    if (!text) return;
    onMentorReplyToPost(postId, text);
    setReplyInput({ ...replyInput, [postId]: '' });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#385036] dark:text-[#8BA888] bg-[#8BA888]/15 px-3 py-1 rounded-full">
            Bảng điều khiển Chuyên gia & Kiểm duyệt Toàn Mạng
          </span>
          <h1 className="font-serif italic font-semibold text-2xl text-[#182217] dark:text-[#E8ECE6] mt-2">
            Kiểm Duyệt AI & Đọc Tất Cả Lá Thư Mọi Trường
          </h1>
          <p className="text-xs text-[#42493F] dark:text-[#8E9B8A] font-medium mt-0.5">
            Cho phép xem tất cả lá thư từ mọi trường, lọc bài công khai & xem xét phân tích ảnh từ Gemini
          </p>
        </div>

        <div className="flex bg-[#FAF9F6] dark:bg-[#20281F] p-1 rounded-full text-xs font-semibold border border-[#E5E2D9] dark:border-[#3A4738]">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'moderation' ? 'bg-[#385036] text-white font-bold shadow-sm' : 'text-[#42493F] dark:text-[#8E9B8A] hover:text-[#182217]'
            }`}
          >
            Cần Kiểm Duyệt ({posts.filter(p => p.status === 'flagged' || p.status === 'pending_review').length})
          </button>
          <button
            onClick={() => setActiveTab('all_master_feed')}
            className={`px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'all_master_feed' ? 'bg-[#385036] text-white font-bold shadow-sm' : 'text-[#42493F] dark:text-[#8E9B8A] hover:text-[#182217]'
            }`}
          >
            🌐 Tất Cả Bài Mọi Trường
          </button>
          <button
            onClick={() => setActiveTab('mentor_queue')}
            className={`px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'mentor_queue' ? 'bg-[#385036] text-white font-bold shadow-sm' : 'text-[#42493F] dark:text-[#8E9B8A] hover:text-[#182217]'
            }`}
          >
            Tư vấn Tâm lý
          </button>
        </div>
      </div>

      {/* Advanced Master Controls & Filters */}
      <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* School Filter */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#3A4036] dark:text-[#E8ECE6]">Trường:</span>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl py-1.5 px-3 text-xs text-[#3A4036] dark:text-[#E8ECE6] font-medium"
            >
              <option value="all">🏫 Tất cả các trường (Mọi nơi)</option>
              {uniqueSchools.map(schName => (
                <option key={schName} value={schName}>{schName}</option>
              ))}
            </select>
          </div>

          {/* Scope Filter */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#3A4036] dark:text-[#E8ECE6]">Phạm vi:</span>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as any)}
              className="bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl py-1.5 px-3 text-xs text-[#3A4036] dark:text-[#E8ECE6] font-medium"
            >
              <option value="all">Bất kỳ phạm vi nào</option>
              <option value="public">🌐 Chỉ bài Công khai toàn quốc</option>
              <option value="campus">🏫 Chỉ bài Hộp thư trường</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-[#5A6E58] dark:text-[#8BA888] font-bold">
          Hiển thị: {filteredPosts.length} lá thư
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-8 text-center text-[#7E7A71] dark:text-[#8E9B8A] text-xs">
            Không tìm thấy lá thư nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredPosts.map(post => (
            <div
              key={post.id}
              className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EFEB] dark:border-[#2C382A] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#3A4036] dark:text-[#E8ECE6]">
                    {getFormattedAuthorName(post)} ({post.schoolName})
                  </span>
                  {post.isPublic ? (
                    <span className="bg-[#5A6E58]/15 text-[#5A6E58] dark:text-[#8BA888] border border-[#8BA888]/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      🌐 Công khai
                    </span>
                  ) : (
                    <span className="bg-[#F1F3EF] dark:bg-[#20281F] text-[#7E7A71] dark:text-[#8E9B8A] border border-[#E5E2D9] text-[9px] font-bold px-2 py-0.5 rounded-full">
                      🏫 Trường
                    </span>
                  )}
                  <span 
                    className="text-[10px] text-[#A4A095] dark:text-[#8E9B8A]"
                    title={formatFullDateTime(post.createdAt || post.id)}
                  >
                    • {formatRelativeTime(post.createdAt, post.timestamp, post.id)}
                  </span>
                </div>

                <div className="flex gap-2">
                  {post.status === 'flagged' && (
                    <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      ⚠️ AI Cảnh báo Từ ngữ
                    </span>
                  )}
                  {post.imageUrl && (
                    <span className="bg-[#8BA888]/20 text-[#5A6E58] dark:text-[#8BA888] border border-[#8BA888]/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      📷 Có ảnh đính kèm
                    </span>
                  )}
                  <span className="bg-[#8BA888]/15 text-[#5A6E58] dark:text-[#8BA888] border border-[#8BA888]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Chủ đề: {post.tags.join(', ')}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-serif italic font-bold text-base text-[#3A4036] dark:text-[#E8ECE6] mb-1">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#7E7A71] dark:text-[#8E9B8A] whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>

                {/* Render Attached Image & Gemini Analysis in Moderator View */}
                {post.imageUrl && (
                  <div className="mt-3 p-3 bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl flex items-start gap-3">
                    <img src={post.imageUrl} alt="Attachment" className="w-20 h-20 object-cover rounded-lg shrink-0 border" />
                    <div className="text-xs text-[#5A6E58] dark:text-[#8BA888] space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-[#5A6E58] dark:text-[#8BA888]" />
                        Gemini Phân tích ảnh
                      </div>
                      {post.imageAnalysis?.summary && <p><strong>Tóm tắt:</strong> {post.imageAnalysis.summary}</p>}
                      {post.imageAnalysis?.emotionalTone && <p><strong>Tông cảm xúc:</strong> {post.imageAnalysis.emotionalTone}</p>}
                    </div>
                  </div>
                )}
              </div>

              {activeTab === 'moderation' ? (
                <div className="pt-3 border-t border-[#F0EFEB] dark:border-[#2C382A] flex items-center justify-between">
                  <span className="text-[11px] text-[#A4A095] dark:text-[#8E9B8A]">
                    Trạng thái: <strong className="text-[#5A6E58] dark:text-[#8BA888]">{post.status}</strong>
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onRejectPost(post.id)}
                      className="px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
                    >
                      Từ chối & Nhắc nhở
                    </button>
                    <button
                      onClick={() => onApprovePost(post.id)}
                      className="px-4 py-1.5 rounded-full bg-[#5A6E58] hover:bg-[#4A5D48] text-white text-xs font-bold shadow-md transition-colors"
                    >
                      Duyệt hiển thị
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-[#F0EFEB] dark:border-[#2C382A] space-y-3">
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6E58] dark:text-[#8BA888]">
                    Phản hồi Định hướng & Chữa lành dành cho Mentor
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={replyInput[post.id] || ''}
                      onChange={(e) => setReplyInput({ ...replyInput, [post.id]: e.target.value })}
                      placeholder="Viết lời tư vấn chuyên môn ấm áp gửi đến bạn học sinh này..."
                      rows={2}
                      className="flex-1 bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl p-2.5 text-xs text-[#3A4036] dark:text-[#E8ECE6] focus:outline-none focus:border-[#5A6E58] resize-none"
                    />
                    <button
                      onClick={() => handleSendMentorReply(post.id)}
                      disabled={!replyInput[post.id]?.trim()}
                      className="px-4 py-2 rounded-xl bg-[#5A6E58] hover:bg-[#4A5D48] text-white text-xs font-bold disabled:opacity-40 shrink-0 self-end shadow-sm"
                    >
                      Gửi tư vấn
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
