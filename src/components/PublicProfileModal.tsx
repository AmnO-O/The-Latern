import React, { useState } from 'react';
import { 
  X, 
  User, 
  UserCheck, 
  GraduationCap, 
  Building, 
  HeartHandshake, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  Share2, 
  Lock, 
  Shield, 
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Layers,
  Heart,
  FileText
} from 'lucide-react';
import { Post, AuthorRole, UserState } from '../types';
import { ReputationBadge } from './ReputationBadge';
import { calculateReputationScore, getReputationRank } from '../lib/reputationUtils';
import { PostCard } from './PostCard';

export interface PublicProfileTarget {
  displayName: string;
  avatarUrl?: string;
  schoolName?: string;
  role: AuthorRole;
  cohort?: string;
  major?: string;
  isVerifiedBadge?: boolean;
  reputationScore?: number;
  hugsReceived?: number;
  bio?: string;
  authorUid?: string;
  isIdentityPublic?: boolean;
  anonId?: string;
}

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: PublicProfileTarget | null;
  currentUserState?: UserState;
  allPublicPosts?: Post[];
  onSelectPost?: (post: Post) => void;
  onToggleLike?: (postId: string, e: React.MouseEvent) => void;
  onToggleHug?: (postId: string, e: React.MouseEvent) => void;
  onToggleSave?: (postId: string, e: React.MouseEvent) => void;
  onConnectWithAuthor?: (authorName: string, role: AuthorRole, schoolName?: string) => void;
  onOpenReportModal?: (targetName: string) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  isOpen,
  onClose,
  target,
  currentUserState,
  allPublicPosts = [],
  onSelectPost,
  onToggleLike,
  onToggleHug,
  onToggleSave,
  onConnectWithAuthor,
  onOpenReportModal
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'public_posts'>('info');
  const [copiedLink, setCopiedLink] = useState(false);
  const [localHugged, setLocalHugged] = useState(false);

  if (!isOpen || !target) return null;

  const isAnonymous = !target.isIdentityPublic && target.role !== 'expert' && target.role !== 'counselor';
  
  // Safe calculation of score
  const repScore = target.reputationScore ?? calculateReputationScore(
    !!target.isVerifiedBadge,
    target.hugsReceived || 0
  );
  const rank = getReputationRank(repScore);

  // Filter ONLY public identity posts authored by this user (Strict privacy guarantee: NEVER show anonymous posts)
  const authorPublicPosts = allPublicPosts.filter(p => {
    if (!p.isIdentityPublic) return false;
    if (target.authorUid && p.authorUid === target.authorUid) return true;
    if (target.displayName && (p.authorDisplayName === target.displayName || p.authorAnonId === target.displayName)) return true;
    return false;
  });

  const handleCopyProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendHug = () => {
    setLocalHugged(true);
    setTimeout(() => setLocalHugged(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF9F6] dark:bg-[#1A2219] w-full max-w-xl rounded-3xl border border-[#C8D2C4] dark:border-[#3A4738] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#C8D2C4] dark:border-[#3A4738] flex items-center justify-between bg-white/70 dark:bg-[#20281F]/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
            <h2 className="font-serif italic font-bold text-lg text-[#182217] dark:text-[#E8ECE6]">
              {isAnonymous ? 'Thông Tin Ẩn Danh' : 'Hồ Sơ Danh Tính Công Khai'}
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#5A6E58] dark:text-[#8E9B8A] transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {isAnonymous ? (
            /* ANONYMOUS PRIVACY PROTECTION VIEW */
            <div className="space-y-4 text-center py-4">
              <div className="w-20 h-20 rounded-full bg-[#2A4228]/10 dark:bg-[#8BA888]/15 border-2 border-dashed border-[#2A4228]/30 flex items-center justify-center mx-auto text-[#2A4228] dark:text-[#8BA888]">
                <Shield className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2A4228]/10 text-[#2A4228] dark:text-[#8BA888] font-bold text-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Danh tính được bảo vệ 100%</span>
                </div>
                <h3 className="font-serif italic font-bold text-xl text-[#182217] dark:text-[#E8ECE6]">
                  {target.anonId || target.displayName || 'Người dùng ẩn danh'}
                </h3>
                <p className="text-xs text-[#5A6E58] dark:text-[#8E9B8A] max-w-md mx-auto leading-relaxed">
                  Người dùng này lựa chọn chia sẻ ẩn danh để thoải mái bộc bạch cảm xúc. Hệ thống mã hóa bảo vệ danh tính, không ai (kể cả quản trị viên) có thể tra cứu thông tin cá nhân.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] text-left space-y-2.5 max-w-md mx-auto text-xs">
                <div className="flex items-center gap-2 font-bold text-[#182217] dark:text-[#E8ECE6]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đồng hành an toàn trong trường học</span>
                </div>
                <p className="text-[#5A6E58] dark:text-[#8E9B8A] text-[11px] leading-relaxed">
                  Bạn có thể gửi một cái ôm động viên hoặc nhắn tin 1:1 ẩn danh nếu tác giả cho phép để trao gửi năng lượng tích cực mà không làm lộ danh tính của nhau.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleSendHug}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all active:scale-95 ${
                    localHugged 
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md' 
                      : 'bg-[#2A4228] text-white hover:bg-[#1E301D] border-[#2A4228]'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>{localHugged ? 'Đã gửi cái ôm ấm áp! ❤️' : 'Gửi một cái ôm ấm áp'}</span>
                </button>

                {onOpenReportModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenReportModal(target.anonId || target.displayName);
                    }}
                    className="px-3.5 py-2.5 rounded-full bg-white dark:bg-[#20281F] hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 border border-rose-200 dark:border-rose-900/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Báo cáo</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* REAL IDENTITY PUBLIC PROFILE VIEW */
            <>
              {/* Profile Card Header */}
              <div className="relative rounded-2xl bg-white dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {target.avatarUrl ? (
                      <img 
                        src={target.avatarUrl} 
                        alt={target.displayName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#2A4228] shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#2A4228] text-white flex items-center justify-center font-serif text-2xl font-bold border-2 border-[#2A4228]/30 shadow-md">
                        {target.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Role Icon Badge */}
                    <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-[#1A2219] border border-[#C8D2C4] dark:border-[#3A4738] shadow-xs">
                      {target.role === 'expert' || target.role === 'counselor' ? (
                        <GraduationCap className="w-4 h-4 text-sky-600" />
                      ) : target.role === 'peer_listener' ? (
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <BadgeCheck className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888]" />
                      )}
                    </div>
                  </div>

                  {/* Identity Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif italic font-bold text-xl sm:text-2xl text-[#182217] dark:text-[#E8ECE6] truncate">
                        {target.displayName}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã xác minh</span>
                      </span>
                    </div>

                    {/* School & Major */}
                    <div className="flex items-center gap-1.5 text-xs text-[#2C382A] dark:text-[#8E9B8A] font-medium flex-wrap">
                      {target.schoolName && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-[#2A4228] dark:text-[#8BA888]" />
                          <strong className="text-[#182217] dark:text-[#E8ECE6]">{target.schoolName}</strong>
                        </span>
                      )}
                      {target.major && (
                        <span>• Chuyên ngành: <strong className="text-[#182217] dark:text-[#E8ECE6]">{target.major}</strong></span>
                      )}
                    </div>

                    {/* Cohort & Role Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {target.role === 'expert' || target.role === 'counselor' ? (
                        <span className="bg-sky-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          <span>Chuyên gia tâm lý học đường</span>
                        </span>
                      ) : target.role === 'peer_listener' ? (
                        <span className="bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>Người lắng nghe thấu cảm</span>
                        </span>
                      ) : (
                        <span className="bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#2A4228]/30">
                          Học sinh / Sinh viên
                        </span>
                      )}

                      {target.cohort && (
                        <span className="bg-[#2A4228] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {target.cohort}
                        </span>
                      )}

                      <ReputationBadge score={repScore} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Bio / Introduction Quote */}
                <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1A2219] border border-[#C8D2C4] dark:border-[#3A4738] text-xs text-[#2C382A] dark:text-[#D1D8CE] italic leading-relaxed">
                  "{target.bio || 'Sẵn lòng lắng nghe, đồng hành và lan tỏa sự ấm áp đến với mọi người trong trường học.'}"
                </div>

                {/* Kindness Statistics Bar */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#C8D2C4] dark:border-[#3A4738]">
                  <div className="text-center p-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1A2219] border border-[#C8D2C4]/60 dark:border-[#3A4738]/60">
                    <p className="text-[10px] text-[#5A6E58] dark:text-[#8E9B8A] font-medium">Điểm Uy Tín</p>
                    <p className="text-base font-bold text-[#2A4228] dark:text-[#8BA888]">{repScore}</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1A2219] border border-[#C8D2C4]/60 dark:border-[#3A4738]/60">
                    <p className="text-[10px] text-[#5A6E58] dark:text-[#8E9B8A] font-medium">Lượt Ôm Đã Nhận</p>
                    <p className="text-base font-bold text-rose-600">{target.hugsReceived || 0}</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1A2219] border border-[#C8D2C4]/60 dark:border-[#3A4738]/60">
                    <p className="text-[10px] text-[#5A6E58] dark:text-[#8E9B8A] font-medium">Cấp Bậc</p>
                    <p className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] mt-1">{rank.title}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs (Giới thiệu vs Bài viết công khai) */}
              <div className="flex items-center gap-2 border-b border-[#C8D2C4] dark:border-[#3A4738]">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'info'
                      ? 'border-[#2A4228] dark:border-[#8BA888] text-[#2A4228] dark:text-[#8BA888]'
                      : 'border-transparent text-[#5A6E58] dark:text-[#8E9B8A] hover:text-[#182217]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Xác thực & Cam kết</span>
                </button>

                <button
                  onClick={() => setActiveTab('public_posts')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'public_posts'
                      ? 'border-[#2A4228] dark:border-[#8BA888] text-[#2A4228] dark:text-[#8BA888]'
                      : 'border-transparent text-[#5A6E58] dark:text-[#8E9B8A] hover:text-[#182217]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lá thư công khai ({authorPublicPosts.length})</span>
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'info' ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] space-y-3">
                    <h4 className="font-bold text-xs text-[#182217] dark:text-[#E8ECE6] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888]" />
                      <span>Huy hiệu uy tín & Hoạt động cộng đồng</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1A2219] border border-[#C8D2C4]/60 dark:border-[#3A4738]/60 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-[#182217] dark:text-[#E8ECE6]">Xác thực sinh viên chính thức</p>
                          <p className="text-[10px] text-[#5A6E58] dark:text-[#8E9B8A]">Đã xác thực qua thẻ trường hoặc email giáo dục</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1A2219] border border-[#C8D2C4]/60 dark:border-[#3A4738]/60 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-[#182217] dark:text-[#E8ECE6]">Cam kết văn minh học đường</p>
                          <p className="text-[10px] text-[#5A6E58] dark:text-[#8E9B8A]">Tuân thủ chuẩn mực thấu cảm và tôn trọng quyền riêng tư</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bảo Mật Quyền Riêng Tư Hai Chiều</span>
                    </p>
                    <p className="text-[11px] text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                      Mọi bài viết ẩn danh trước đây hoặc các phản hồi tâm sự riêng tư của người dùng luôn được tách biệt hoàn toàn và bảo vệ an toàn.
                    </p>
                  </div>
                </div>
              ) : (
                /* Public Posts Tab */
                <div className="space-y-3">
                  {authorPublicPosts.length === 0 ? (
                    <div className="text-center py-8 bg-white dark:bg-[#20281F] rounded-2xl border border-[#C8D2C4] dark:border-[#3A4738] p-4 space-y-1">
                      <span className="text-2xl">🌱</span>
                      <p className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">Chưa có bài viết công khai</p>
                      <p className="text-[11px] text-[#5A6E58] dark:text-[#8E9B8A]">
                        Người dùng này chỉ chia sẻ các bài viết ẩn danh hoặc chưa có bài đăng danh tính chính.
                      </p>
                    </div>
                  ) : (
                    authorPublicPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onClick={() => onSelectPost && onSelectPost(post)}
                        onToggleLike={onToggleLike || (() => {})}
                        onToggleHug={onToggleHug || (() => {})}
                        onToggleSave={onToggleSave || (() => {})}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Actions */}
        {!isAnonymous && (
          <div className="p-4 sm:p-5 border-t border-[#C8D2C4] dark:border-[#3A4738] bg-white/70 dark:bg-[#20281F]/70 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendHug}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
                  localHugged
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-white dark:bg-[#20281F] text-rose-600 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>{localHugged ? 'Đã gửi cái ôm! ❤️' : 'Gửi cái ôm'}</span>
              </button>

              <button
                onClick={handleCopyProfile}
                className="px-3.5 py-2 rounded-full bg-white dark:bg-[#20281F] hover:bg-[#FAF9F6] text-[#2C382A] dark:text-[#8E9B8A] border border-[#C8D2C4] dark:border-[#3A4738] text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Sao chép liên kết hồ sơ"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Đã sao chép!' : 'Chia sẻ'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onConnectWithAuthor && (
                <button
                  onClick={() => {
                    onClose();
                    onConnectWithAuthor(target.displayName, target.role, target.schoolName);
                  }}
                  className="px-4 py-2 rounded-full bg-[#2A4228] hover:bg-[#1E301D] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Nhắn tin 1:1</span>
                </button>
              )}

              {onOpenReportModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenReportModal(target.displayName);
                  }}
                  className="p-2 rounded-full text-[#8E9B8A] hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                  title="Báo cáo hồ sơ này"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
