import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Image as ImageIcon, 
  ShieldCheck, 
  Clock, 
  FileText,
  UserCheck,
  X,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Heart,
  Ban,
  Brain,
  MessageSquareHeart,
  Lightbulb
} from 'lucide-react';
import { Post, PeerMentorApplication, ListenerReport } from '../types';
import { formatRelativeTime, formatFullDateTime } from '../lib/dateUtils';
import { getFormattedAuthorName } from '../lib/authorUtils';

interface MentorDashboardProps {
  posts: Post[];
  onApprovePost: (postId: string) => void;
  onRejectPost: (postId: string) => void;
  onMentorReplyToPost: (postId: string, content: string) => void;
  applications?: PeerMentorApplication[];
  onApproveApplication?: (applicationId: string, role: 'peer_listener' | 'specialist') => void;
  onRejectApplication?: (applicationId: string, reason?: string) => void;
  reports?: ListenerReport[];
  onResolveReport?: (reportId: string, action: 'ban_listener' | 'dismiss') => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({
  posts,
  onApprovePost,
  onRejectPost,
  onMentorReplyToPost,
  applications = [],
  onApproveApplication,
  onRejectApplication,
  reports = [],
  onResolveReport
}) => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'mentor_applications' | 'reports_queue' | 'all_master_feed' | 'mentor_queue'>('mentor_applications');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'public' | 'campus'>('all');
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [replyInput, setReplyInput] = useState<{ [postId: string]: string }>({});
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Rejection modal state
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [customRejectReason, setCustomRejectReason] = useState('');

  const pendingAppsCount = applications.filter(a => a.status === 'pending').length;
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const pendingPostsCount = posts.filter(p => p.status === 'flagged' || p.status === 'pending_review').length;

  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (appStatusFilter !== 'all' && app.status !== appStatusFilter) return false;
    if (schoolFilter !== 'all' && app.schoolId !== schoolFilter && app.schoolName !== schoolFilter) return false;
    return true;
  });

  // Filter posts based on school, scope, and tab
  const filteredPosts = posts.filter(p => {
    if (schoolFilter !== 'all' && p.schoolId !== schoolFilter && p.schoolName !== schoolFilter) {
      return false;
    }
    if (scopeFilter === 'public' && !p.isPublic) return false;
    if (scopeFilter === 'campus' && p.isPublic) return false;

    if (activeTab === 'moderation') {
      return p.status === 'flagged' || p.status === 'pending_review' || p.crisisDetected;
    }
    if (activeTab === 'mentor_queue') {
      return p.tags.includes('Áp lực học tập') || p.tags.includes('Gia đình') || p.crisisDetected;
    }
    return true;
  });

  const uniqueSchools = Array.from(new Set([
    ...posts.map(p => p.schoolName),
    ...applications.map(a => a.schoolName)
  ]));

  const handleSendMentorReply = (postId: string) => {
    const text = replyInput[postId]?.trim();
    if (!text) return;
    onMentorReplyToPost(postId, text);
    setReplyInput({ ...replyInput, [postId]: '' });
  };

  const handleConfirmReject = () => {
    if (!rejectingAppId) return;
    const reason = customRejectReason.trim() || 'Hồ sơ chưa đáp ứng đủ tiêu chí xác thực';
    if (onRejectApplication) {
      onRejectApplication(rejectingAppId, reason);
    }
    setRejectingAppId(null);
    setCustomRejectReason('');
  };

  const rejectPresets = [
    'Ảnh bằng cấp/chứng chỉ chưa rõ nét, vui lòng gửi lại ảnh rõ hơn',
    'Cần bổ sung bằng cấp chuyên ngành tâm lý hoặc tham vấn học đường',
    'Thông tin giới thiệu chưa đầy đủ tiêu chí xác thực',
    'Chưa đủ điều kiện xác thực vai trò chuyên gia tâm lý'
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#385036] dark:text-[#8BA888] bg-[#8BA888]/15 px-2.5 py-0.5 rounded-full">
            Quản trị & Kiểm duyệt
          </span>
          <h1 className="font-serif italic font-semibold text-2xl text-[#182217] dark:text-[#E8ECE6] mt-1.5">
            Trung Tâm Duyệt Hồ Sơ & Kiểm Duyệt
          </h1>
          <p className="text-xs text-[#42493F] dark:text-[#8E9B8A] font-medium mt-0.5">
            Duyệt hồ sơ Bạn lắng nghe & Chuyên gia tâm lý, kiểm duyệt lá thư và phân tích an toàn.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-[#FAF9F6] dark:bg-[#20281F] p-1 rounded-2xl text-xs font-semibold border border-[#E5E2D9] dark:border-[#3A4738]">
          <button
            onClick={() => setActiveTab('mentor_applications')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'mentor_applications' ? 'bg-[#385036] text-white font-bold shadow-sm' : 'text-[#42493F] dark:text-[#8E9B8A] hover:text-[#182217]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Duyệt Hồ Sơ</span>
            {pendingAppsCount > 0 && (
              <span className="bg-amber-500 text-black text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {pendingAppsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports_queue')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'reports_queue' ? 'bg-rose-700 text-white font-bold shadow-sm' : 'text-[#42493F] dark:text-[#8E9B8A] hover:text-[#182217]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Báo Cáo Vi Phạm</span>
            {pendingReportsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'moderation' ? 'bg-[#385036] text-white font-bold shadow-sm' : 'text-[#42493F] dark:text-[#8E9B8A] hover:text-[#182217]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Duyệt Bài ({pendingPostsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('all_master_feed')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'all_master_feed' ? 'bg-[#385036] text-white font-bold shadow-sm' : 'text-[#42493F] dark:text-[#8E9B8A] hover:text-[#182217]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Mọi Lá Thư</span>
          </button>

          <button
            onClick={() => setActiveTab('mentor_queue')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'mentor_queue' ? 'bg-[#385036] text-white font-bold shadow-sm' : 'text-[#42493F] dark:text-[#8E9B8A] hover:text-[#182217]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Tư Vấn</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* School Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#3A4036] dark:text-[#E8ECE6]">Trường:</span>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl py-1 px-2.5 text-xs text-[#3A4036] dark:text-[#E8ECE6]"
            >
              <option value="all">🏫 Tất cả các trường</option>
              {uniqueSchools.map(schName => (
                <option key={schName} value={schName}>{schName}</option>
              ))}
            </select>
          </div>

          {/* Applications Status Filter */}
          {activeTab === 'mentor_applications' && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#3A4036] dark:text-[#E8ECE6]">Trạng thái:</span>
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value as any)}
                className="bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl py-1 px-2.5 text-xs text-[#3A4036] dark:text-[#E8ECE6]"
              >
                <option value="all">Tất cả ({applications.length})</option>
                <option value="pending">⏳ Chờ duyệt ({applications.filter(a => a.status === 'pending').length})</option>
                <option value="approved">✓ Đã duyệt ({applications.filter(a => a.status === 'approved').length})</option>
                <option value="rejected">✕ Đã từ chối ({applications.filter(a => a.status === 'rejected').length})</option>
              </select>
            </div>
          )}

          {/* Posts Scope Filter */}
          {activeTab !== 'mentor_applications' && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#3A4036] dark:text-[#E8ECE6]">Phạm vi:</span>
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value as any)}
                className="bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl py-1 px-2.5 text-xs text-[#3A4036] dark:text-[#E8ECE6]"
              >
                <option value="all">Mọi phạm vi</option>
                <option value="public">🌐 Sảnh chung công khai</option>
                <option value="campus">🏫 Hộp thư trường</option>
              </select>
            </div>
          )}
        </div>

        <div className="text-[11px] text-[#5A6E58] dark:text-[#8BA888] font-bold">
          {activeTab === 'mentor_applications'
            ? `Hiển thị: ${filteredApplications.length} hồ sơ`
            : `Hiển thị: ${filteredPosts.length} lá thư`}
        </div>
      </div>

      {/* Applications Review Tab Content */}
      {activeTab === 'mentor_applications' && (
        <div className="space-y-3.5">
          {filteredApplications.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-8 text-center text-[#7E7A71] dark:text-[#8E9B8A] text-xs">
              Chưa có hồ sơ đăng ký nào theo bộ lọc đã chọn.
            </div>
          ) : (
            filteredApplications.map(app => {
              const isPending = app.status === 'pending';
              const isApproved = app.status === 'approved';
              const isRejected = app.status === 'rejected';

              return (
                <div
                  key={app.id}
                  className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-4.5 sm:p-5 space-y-3.5 shadow-sm"
                >
                  {/* Top Bar: Role badge, applicant name, date, status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EFEB] dark:border-[#2C382A] pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {app.roleType === 'specialist' ? (
                        <span className="bg-sky-600/15 text-sky-800 dark:text-sky-300 border border-sky-600/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          <span>Chuyên gia tâm lý</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Bạn lắng nghe</span>
                        </span>
                      )}

                      <span className="font-bold text-xs text-[#182217] dark:text-[#E8ECE6]">
                        {app.applicantDisplayName || app.applicantAnonId || 'Ứng viên'}
                      </span>

                      <span className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">
                        • {app.schoolName}
                      </span>

                      {app.isGlobalScope && (
                        <span className="bg-[#2A4228]/10 dark:bg-[#8BA888]/15 text-[#2A4228] dark:text-[#8BA888] text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Đa trường</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8E9B8A]">
                        {formatRelativeTime(app.appliedAt, new Date(app.appliedAt).toISOString())}
                      </span>

                      {isPending && (
                        <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ⏳ Chờ duyệt
                        </span>
                      )}
                      {isApproved && (
                        <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Đã duyệt</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ✕ Từ chối
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                    {/* Left 2 columns: Qualifications & Bio */}
                    <div className="md:col-span-2 space-y-2">
                      {app.qualificationTitle && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">Bằng cấp:</span>
                          <span className="text-[#3A4036] dark:text-[#C5D0C3] font-medium">{app.qualificationTitle}</span>
                        </div>
                      )}

                      {app.specialty && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">Chuyên ngành:</span>
                          <span className="text-[#3A4036] dark:text-[#C5D0C3] font-medium">{app.specialty}</span>
                        </div>
                      )}

                      {/* Empathy Mini-Quiz Score Badge (nếu có từ bản cũ) */}
                      {app.quizScore !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">Empathy Quiz:</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            app.quizPassed
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          }`}>
                            <Sparkles className="w-3 h-3" />
                            <span>Đạt {app.quizScore}/3 câu xử lý thấu cảm</span>
                          </span>
                        </div>
                      )}

                      {/* Open-ended Ethics & Mindset Essay Answer */}
                      {app.ethicsQuestion && (
                        <div className="bg-amber-50/70 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-500/30 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-300 font-bold text-[11px]">
                            <Brain className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Câu hỏi mở về Tư duy & Đạo đức (Ethics & Mindset):</span>
                          </div>
                          <p className="text-[11px] text-[#485346] dark:text-[#E8ECE6] font-medium leading-snug">
                            ❓ "{app.ethicsQuestion}"
                          </p>
                          <div className="mt-1 bg-white dark:bg-[#1A2218] p-2.5 rounded-lg border border-amber-500/20">
                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 block mb-0.5">
                              💡 Câu trả lời / Góc nhìn của ứng viên:
                            </span>
                            <p className="text-[11px] text-[#182217] dark:text-[#E8ECE6] leading-relaxed italic">
                              "{app.ethicsAnswer || '(Chưa điền câu trả lời)'}"
                            </p>
                          </div>
                        </div>
                      )}

                      {app.strengths && app.strengths.length > 0 && (
                        <div>
                          <span className="font-bold text-[#182217] dark:text-[#E8ECE6] block mb-1">Chủ đề hỗ trợ:</span>
                          <div className="flex flex-wrap gap-1">
                            {app.strengths.map((s, idx) => (
                              <span key={idx} className="bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-[10px] px-2 py-0.5 rounded-md text-[#485346] dark:text-[#8E9B8A]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {app.motivation && (
                        <div className="bg-[#FAF9F6] dark:bg-[#20281F] p-2.5 rounded-xl border border-[#DCE4D8] dark:border-[#3A4738]">
                          <span className="text-[10px] font-bold text-[#5A6D58] dark:text-[#8E9B8A] block mb-0.5">Chia sẻ / Kinh nghiệm:</span>
                          <p className="text-[11px] text-[#2C382A] dark:text-[#C5D0C3] leading-relaxed italic">
                            "{app.motivation}"
                          </p>
                        </div>
                      )}

                      {app.rejectionReason && (
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-[11px]">
                          <strong>Lý do từ chối:</strong> {app.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Right column: Certificate Image (if uploaded) */}
                    <div className="space-y-1">
                      <span className="font-bold text-[#182217] dark:text-[#E8ECE6] block text-[11px]">
                        Minh chứng bằng cấp:
                      </span>
                      {app.certificateImageUrl ? (
                        <div 
                          onClick={() => setPreviewImageUrl(app.certificateImageUrl || null)}
                          className="group relative cursor-pointer rounded-xl overflow-hidden border border-[#DCE4D8] dark:border-[#3A4738] bg-white h-28 flex items-center justify-center shadow-2xs"
                        >
                          <img 
                            src={app.certificateImageUrl} 
                            alt="Minh chứng" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem ảnh</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 rounded-xl border border-dashed border-[#DCE4D8] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] flex flex-col items-center justify-center text-[#8E9B8A] text-[10px] p-2 text-center">
                          <ImageIcon className="w-5 h-5 mb-1 opacity-40" />
                          <span>Không có ảnh đính kèm (Đăng ký ẩn danh thông thường)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-[#F0EFEB] dark:border-[#2C382A] flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] text-[#8E9B8A]">
                      Mã: <code className="text-[#3A4036] dark:text-[#E8ECE6]">{app.id}</code>
                    </span>

                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingAppId(app.id);
                              setCustomRejectReason('');
                            }}
                            className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold border border-rose-500/25 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onApproveApplication) {
                                onApproveApplication(app.id, app.roleType);
                              }
                            }}
                            className="px-4 py-1.5 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Duyệt làm {app.roleType === 'specialist' ? 'Chuyên gia' : 'Người lắng nghe'}</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                            Đã xử lý hồ sơ
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onApproveApplication) {
                                onApproveApplication(app.id, app.roleType);
                              }
                            }}
                            className="text-[10px] text-[#2A4228] dark:text-[#8BA888] underline font-bold"
                          >
                            Duyệt lại
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingAppId(app.id);
                              setCustomRejectReason('');
                            }}
                            className="text-[10px] text-rose-600 underline font-bold"
                          >
                            Từ chối lại
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reports Queue Tab Content */}
      {activeTab === 'reports_queue' && (
        <div className="space-y-3.5">
          {reports.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-8 text-center text-[#7E7A71] dark:text-[#8E9B8A] text-xs space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-sm text-[#182217] dark:text-[#E8ECE6]">Không có báo cáo vi phạm nào!</p>
              <p className="text-[11px]">Cộng đồng Người Lắng Nghe đang hoạt động an toàn, thấu cảm và tuân thủ chuẩn mực.</p>
            </div>
          ) : (
            reports.map(rep => {
              const isPending = rep.status === 'pending';
              const isResolved = rep.status === 'resolved';

              return (
                <div
                  key={rep.id}
                  className="bg-[var(--bg-card)] border border-rose-500/30 dark:border-rose-950/50 glass-panel rounded-2xl p-4.5 sm:p-5 space-y-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EFEB] dark:border-[#2C382A] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        <span>Báo cáo: {rep.reportedListenerName}</span>
                      </span>
                      <span className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                        từ {rep.reporterAnonId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span 
                        className="text-[10px] text-[#8E9B8A]"
                        title={formatFullDateTime(rep.createdAt)}
                      >
                        {formatRelativeTime(rep.createdAt)}
                      </span>
                      {isPending ? (
                        <span className="bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ⏳ Chờ xử lý
                        </span>
                      ) : isResolved ? (
                        <span className="bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ✓ Đã xử lý (Tước quyền/Kỷ luật)
                        </span>
                      ) : (
                        <span className="bg-black/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ✕ Bỏ qua (Không vi phạm)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Report Detail */}
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-500/20 space-y-1 text-xs">
                    <div className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>
                        {rep.reason === 'privacy_invasion' && 'Xin thông tin nhạy cảm / Đòi Facebook, SĐT riêng'}
                        {rep.reason === 'harassment_toxic' && 'Quấy rối, công kích hoặc dùng từ ngữ thô bạo'}
                        {rep.reason === 'unsolicited_advice' && 'Đưa lời khuyên y khoa/tâm lý sai lệch, nguy hiểm'}
                        {rep.reason === 'inappropriate_contact' && 'Hành vi gạ gẫm tình cảm hoặc mục đích không trong sáng'}
                        {rep.reason === 'other' && 'Hành vi vi phạm quy chuẩn cộng đồng khác'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#2C382A] dark:text-[#E8ECE6] leading-relaxed italic bg-white dark:bg-[#1A2218] p-2 rounded-lg border border-black/5 dark:border-white/5">
                      "{rep.reasonDetail}"
                    </p>
                  </div>

                  {/* Actions Footer */}
                  {isPending && onResolveReport && (
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0EFEB] dark:border-[#2C382A]">
                      <button
                        type="button"
                        onClick={() => onResolveReport(rep.id, 'dismiss')}
                        className="px-3.5 py-1.5 rounded-full border border-[#DCE4D8] dark:border-[#3A4738] text-xs font-semibold text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-[#FAF9F6] dark:hover:bg-[#20281F]"
                      >
                        Bỏ qua báo cáo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn tước quyền Người Lắng Nghe của "${rep.reportedListenerName}" ngay lập tức?`)) {
                            onResolveReport(rep.id, 'ban_listener');
                          }
                        }}
                        className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Tước quyền Người Lắng Nghe ngay</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Moderation / Master Feed Posts Tab Content */}
      {activeTab !== 'mentor_applications' && activeTab !== 'reports_queue' && (
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-8 text-center text-[#7E7A71] dark:text-[#8E9B8A] text-xs">
              Không tìm thấy lá thư nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredPosts.map(post => (
              <div
                key={post.id}
                className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-5 space-y-3.5 shadow-sm"
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
                        📷 Có ảnh
                      </span>
                    )}
                    <span className="bg-[#8BA888]/15 text-[#5A6E58] dark:text-[#8BA888] border border-[#8BA888]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {post.tags.join(', ')}
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

                  {/* Render Attached Image & Gemini Analysis */}
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
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-[#5A6E58] dark:text-[#8BA888]">
                      Phản hồi Định hướng & Chữa lành
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
      )}

      {/* Modal View Image Proof */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="bg-white dark:bg-[#1C251A] rounded-2xl p-4 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col space-y-3 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Minh chứng Bằng cấp / Chứng chỉ</span>
              </span>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg text-[#8E9B8A] hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl border flex items-center justify-center bg-black/10">
              <img src={previewImageUrl} alt="Certificate Proof" className="max-w-full max-h-[65vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject Application Reason */}
      {rejectingAppId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setRejectingAppId(null)}
        >
          <div 
            className="bg-white dark:bg-[#1C251A] rounded-2xl p-5 max-w-md w-full shadow-2xl border border-[#DCE4D8] dark:border-[#3A4738] space-y-3.5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Từ chối hồ sơ ứng viên</span>
              </span>
              <button
                onClick={() => setRejectingAppId(null)}
                className="p-1 rounded-lg text-[#8E9B8A] hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] leading-relaxed">
              Chọn lý do mẫu hoặc nhập phản hồi gửi đến ứng viên để họ biết và bổ sung hồ sơ:
            </p>

            {/* Presets */}
            <div className="space-y-1.5">
              {rejectPresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setCustomRejectReason(preset)}
                  className={`w-full text-left p-2 rounded-xl text-xs border transition-all ${
                    customRejectReason === preset
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 text-rose-900 dark:text-rose-200 font-semibold'
                      : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#DCE4D8] dark:border-[#3A4738] text-[#3A4036] dark:text-[#C5D0C3] hover:border-rose-300'
                  }`}
                >
                  • {preset}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#182217] dark:text-[#E8ECE6]">
                Nội dung phản hồi chi tiết:
              </label>
              <textarea
                value={customRejectReason}
                onChange={e => setCustomRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối cụ thể..."
                rows={2}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] rounded-xl p-2.5 text-xs text-[#182217] dark:text-[#E8ECE6] placeholder-[#8E9B8A] focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setRejectingAppId(null)}
                className="px-3.5 py-1.5 rounded-full border text-xs font-semibold text-[#5A6D58] dark:text-[#8E9B8A]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

