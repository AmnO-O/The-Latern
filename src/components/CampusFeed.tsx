import React, { useState } from 'react';
import { 
  Edit, 
  Globe, 
  BookOpen, 
  GraduationCap, 
  Camera, 
  CheckCircle2, 
  Info, 
  ShieldCheck, 
  Clock, 
  MessageSquare, 
  Lock, 
  Users, 
  Search, 
  MailCheck,
  HeartHandshake,
  Sparkles,
  UserCheck,
  CalendarCheck,
  Video,
  Calendar,
  X
} from 'lucide-react';
import { Post, School, UserState, CounselingAppointment, PeerMentorApplication } from '../types';
import { PostCard } from './PostCard';
import { CounselingScheduleModal } from './CounselingScheduleModal';

interface CampusFeedProps {
  school: School;
  posts: Post[];
  userState?: UserState;
  onSelectSchool?: (school: School) => void;
  currentUserId?: string;
  myPostIds?: string[];
  isAdmin?: boolean;
  onEditSchool?: (school: School) => void;
  onSelectPost: (post: Post) => void;
  onToggleLike: (postId: string, e: React.MouseEvent) => void;
  onToggleHug: (postId: string, e: React.MouseEvent) => void;
  onToggleSave: (postId: string, e: React.MouseEvent) => void;
  onSharePost?: (post: Post) => void;
  onEditPost?: (post: Post, e: React.MouseEvent) => void;
  onDeletePost?: (postId: string, e: React.MouseEvent) => void;
  onConnectWithAuthor?: (post: Post) => void;
  onOpenGlobe?: (school?: School) => void;
  openComposer: () => void;
  openVerify: () => void;
  openPeerMentorModal?: () => void;
  openDirectChatWithPeer: (peerName: string, roleTitle: string) => void;
  onViewPublicProfile?: (target: any) => void;
  appointments?: CounselingAppointment[];
  mentorApplications?: PeerMentorApplication[];
  onScheduleAppointment?: (appointment: CounselingAppointment) => void;
}

export const CampusFeed: React.FC<CampusFeedProps> = ({
  school,
  posts,
  userState,
  onSelectSchool,
  currentUserId,
  myPostIds = [],
  isAdmin,
  onEditSchool,
  onSelectPost,
  onToggleLike,
  onToggleHug,
  onToggleSave,
  onSharePost,
  onEditPost,
  onDeletePost,
  onConnectWithAuthor,
  onOpenGlobe,
  openComposer,
  openVerify,
  openPeerMentorModal,
  openDirectChatWithPeer,
  onViewPublicProfile,
  appointments = [],
  mentorApplications = [],
  onScheduleAppointment
}) => {
  const isGlobalView = !school || (school.id === 'global' || school.id === 'all-schools');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCounselorForSchedule, setSelectedCounselorForSchedule] = useState<{ name?: string; role?: string }>({});

  const verifiedList = userState?.verifiedSchools || (userState?.selectedSchool ? [userState.selectedSchool] : []);
  const isListenerOrMentorForThisSchool = Boolean(
    userState?.isLoggedIn &&
    (userState?.isPeerMentor || userState?.userRole === 'peer_listener' || userState?.userRole === 'mentor' || userState?.peerMentorApplication) &&
    (
      userState?.peerMentorApplication?.schoolId === school?.id || 
      userState?.peerMentorApplication?.schoolName === school?.name ||
      userState?.peerMentorApplication?.isGlobalScope ||
      userState?.mentorRoleType === 'specialist' ||
      userState?.isSpecialist
    )
  );

  const isVerifiedForThisSchool = !isGlobalView && (
    (userState?.isLoggedIn && verifiedList.some(s => s.id === school.id || s.slug === school.slug)) || 
    (userState?.isLoggedIn && userState?.userRole === 'admin_moderator') ||
    isListenerOrMentorForThisSchool
  );

  const [selectedTag, setSelectedTag] = useState<string>('Tất cả');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('Tất cả khối');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'public' | 'campus' | 'counseling'>('all');
  const [feedSearch, setFeedSearch] = useState('');
  const [accessGateModal, setAccessGateModal] = useState<{ isOpen: boolean; targetType: 'campus' | 'counseling' }>({
    isOpen: false,
    targetType: 'campus'
  });

  const handleScopeChange = (target: 'all' | 'public' | 'campus' | 'counseling') => {
    if (isGlobalView || target === 'public') {
      setScopeFilter(target);
      return;
    }

    if (!isVerifiedForThisSchool) {
      if (target === 'campus' || target === 'counseling') {
        setAccessGateModal({ isOpen: true, targetType: target });
        return;
      }
      setScopeFilter(target);
      return;
    }

    setScopeFilter(target);
  };

  // Check if current user is a Certified Psychological Specialist or Campus Counselor
  // Strictly requires specialist qualification, NOT granted to Peer Listeners
  const isSpecialistOrCounselor = Boolean(
    isAdmin ||
    (userState?.isLoggedIn && (
      userState?.isSpecialist ||
      userState?.mentorRoleType === 'specialist' ||
      userState?.isCampusCounselor ||
      userState?.userRole === 'admin_moderator'
    ))
  );

  const isAuthorOfPost = (p: Post) => {
    if (myPostIds.includes(p.id)) return true;
    if (p.authorUid && currentUserId && p.authorUid === currentUserId) return true;
    return false;
  };

  // Base posts selection based on selected school or global view
  const basePosts = isGlobalView
    ? posts.filter(p => p.isPublic === true)
    : posts.filter(p => school && (p.schoolId === school.id || p.schoolSlug === school.slug));

  // Filter by scope (inside specific school hub)
  const scopeFilteredPosts = basePosts.filter(p => {
    if (isGlobalView) return true; // Sảnh Chung is strictly public posts

    // Unverified visitors to a specific school hub can only view public non-counseling letters
    if (!isVerifiedForThisSchool) {
      return p.isPublic === true && !p.isCounselingMailbox;
    }

    if (scopeFilter === 'counseling') {
      if (!p.isCounselingMailbox) return false;
      // Regular students & peer listeners only see their own counseling submissions
      // Only Certified Specialists / Counselors / Admins see all counseling submissions for this school
      return isSpecialistOrCounselor || isAuthorOfPost(p);
    }

    if (scopeFilter === 'public') return p.isPublic === true && !p.isCounselingMailbox;
    if (scopeFilter === 'campus') return p.isPublic !== true && !p.isCounselingMailbox;

    // In 'all' scope: counseling posts are hidden from non-specialist students/peer listeners
    if (p.isCounselingMailbox) {
      return isSpecialistOrCounselor || isAuthorOfPost(p);
    }

    return true;
  });

  const tagsList = ['Tất cả', 'Áp lực học tập', 'Gia đình', 'Định hướng tương lai', 'Sự ấm áp'];
  const gradeFilters = ['Tất cả khối', 'Khối 12', 'Khối 11', 'Khối 10', 'Sinh viên / Cựu HS'];

  const rawFilteredPosts = scopeFilteredPosts.filter(p => {
    const matchesTag = selectedTag === 'Tất cả' || p.tags.includes(selectedTag);

    // Grade / Cohort filter matching
    let matchesGrade = true;
    if (selectedGradeFilter === 'Khối 12') {
      matchesGrade = (p.authorClassBadge || '').includes('12') || (p.authorClassBadge || '').toLowerCase().includes('k67');
    } else if (selectedGradeFilter === 'Khối 11') {
      matchesGrade = (p.authorClassBadge || '').includes('11') || (p.authorClassBadge || '').toLowerCase().includes('k68');
    } else if (selectedGradeFilter === 'Khối 10') {
      matchesGrade = (p.authorClassBadge || '').includes('10') || (p.authorClassBadge || '').toLowerCase().includes('k69');
    } else if (selectedGradeFilter === 'Sinh viên / Cựu HS') {
      matchesGrade = (p.authorClassBadge || '').toLowerCase().includes('sinh viên') || (p.authorClassBadge || '').toLowerCase().includes('cựu');
    }

    const matchesSearch = p.title.toLowerCase().includes(feedSearch.toLowerCase()) ||
                          p.content.toLowerCase().includes(feedSearch.toLowerCase()) ||
                          (p.authorClassBadge || '').toLowerCase().includes(feedSearch.toLowerCase());
    return matchesTag && matchesGrade && matchesSearch;
  });

  // Ensure no duplicate post IDs or duplicate titles/contents rendered
  const seenPostIds = new Set<string>();
  const seenPostSigs = new Set<string>();
  const filteredPosts = rawFilteredPosts.filter(p => {
    if (seenPostIds.has(p.id)) return false;
    const sig = `${(p.title || '').trim()}__${(p.content || '').trim()}__${p.authorAnonId || ''}`;
    if (seenPostSigs.has(sig)) return false;
    seenPostIds.add(p.id);
    seenPostSigs.add(sig);
    return true;
  });

  return (
    <div className="w-full flex justify-center min-h-screen">
      {/* Main Feed Column */}
      <div className="w-full max-w-2xl px-4 py-6 flex flex-col gap-6">
        {/* School Header Banner */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-glass)] glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden text-center shadow-sm">
          {/* Admin badge and edit action */}
          {isAdmin && !isGlobalView && onEditSchool && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => onEditSchool(school)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all shadow-xs active:scale-95"
                title="Chỉnh sửa logo và thông tin trường (Quyền Admin)"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Đổi Avatar / Thông tin trường</span>
              </button>
            </div>
          )}

          <div className="relative group w-18 h-18 mx-auto mb-4">
            <div className="w-18 h-18 rounded-2xl bg-white dark:bg-[#1E271D] border border-[#8BA888]/30 flex items-center justify-center p-2 text-[#5A6E58] dark:text-[#8BA888] shadow-sm overflow-hidden">
              {!isGlobalView && school.logoUrl ? (
                <img
                  src={school.logoUrl}
                  alt={school.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                isGlobalView ? (
                  <Globe className="w-8 h-8 text-[#5A6E58] dark:text-[#8BA888]" />
                ) : school.type === 'highschool' ? (
                  <BookOpen className="w-8 h-8 text-[#5A6E58] dark:text-[#8BA888]" />
                ) : (
                  <GraduationCap className="w-8 h-8 text-[#5A6E58] dark:text-[#8BA888]" />
                )
              )}
            </div>

            {isAdmin && !isGlobalView && onEditSchool && (
              <button
                onClick={() => onEditSchool(school)}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold backdrop-blur-xs"
                title="Bấm để đổi avatar trường"
              >
                <Camera className="w-4 h-4" />
                <span>Đổi Logo</span>
              </button>
            )}
          </div>

          <h1 className="font-serif italic text-2xl sm:text-3xl font-semibold text-[#182217] dark:text-[#E8ECE6] mb-1">
            {isGlobalView ? 'Sảnh Chung Công Khai Toàn Quốc' : school.name}
          </h1>

          <p className="text-xs text-[#42493F] dark:text-[#8E9B8A] font-medium mb-4">
            {isGlobalView
              ? 'Nơi quy tụ tất cả lá thư tâm sự công khai từ học sinh, sinh viên khắp cả nước'
              : `Hộp thư Campus Hub chính thức • ${school.location}`}
          </p>

          {/* Live School & Global Stats */}
          {(() => {
            const isGlobal = isGlobalView || !school || school.id === 'global' || school.id === 'all-schools';
            const matchingPosts = isGlobal
              ? posts
              : posts.filter(p => school && (p.schoolId === school.id || p.schoolSlug === school.slug || p.schoolName === school.name));
            
            const liveLetterCount = Math.max(school?.letterCount || 0, matchingPosts.length);

            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;
            const newTodayCount = matchingPosts.filter(p => {
              if (p.createdAt) return (now - p.createdAt) < oneDayMs;
              if (p.timestamp) {
                const t = p.timestamp.toLowerCase();
                return t.includes('vừa') || t.includes('phút') || t.includes('giờ') || t.includes('hôm nay');
              }
              return false;
            }).length;
            const liveNewCount = Math.max(school?.newCount || 0, newTodayCount);

            const verifiedList = userState?.verifiedSchools || (userState?.selectedSchool ? [userState.selectedSchool] : []);
            const isVerifiedForThis = !isGlobal && (
              (userState?.isLoggedIn && verifiedList.some(s => s.id === school?.id || s.slug === school?.slug)) || 
              (userState?.isLoggedIn && userState?.userRole === 'admin_moderator') ||
              isListenerOrMentorForThisSchool
            );

            const liveVerifiedCount = isGlobal
              ? Math.max(school?.verifiedCount || 0, (userState?.verificationStatus === 'verified' ? 1 : 0), 1200)
              : Math.max(school?.verifiedCount || 0, isVerifiedForThis ? 1 : 0);

            return (
              <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs text-[#42493F] dark:text-[#8E9B8A] font-medium pt-3 border-t border-[#E5E2D9] dark:border-[#3A4738]">
                <span>🌱 <strong>{liveLetterCount.toLocaleString()}</strong> lá thư</span>
                <span className="text-[#E5E2D9] dark:text-[#3A4738]">•</span>
                <span className="text-[#5A6E58] dark:text-[#8BA888] font-bold">+{liveNewCount} mới hôm nay</span>
                <span className="text-[#E5E2D9] dark:text-[#3A4738]">•</span>
                <span>✅ <strong>{liveVerifiedCount.toLocaleString()}</strong> thành viên đã xác thực</span>
              </div>
            );
          })()}

          {/* Verified Status Verification Info Callout */}
          <div className="mt-4 pt-3 flex flex-col items-center gap-2">
            {(() => {
              const verifiedList = userState?.verifiedSchools || (userState?.selectedSchool ? [userState.selectedSchool] : []);
              const isVerifiedForThisSchool = !isGlobalView && verifiedList.some(s => s.id === school.id || s.slug === school.slug);
              const hasAnyVerification = userState?.verificationStatus === 'verified' && verifiedList.length > 0;

              if (isVerifiedForThisSchool) {
                return (
                  <div className="w-full max-w-md p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 dark:bg-emerald-950/20 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Đã đồng bộ xác thực thành viên chính thức: {school.name}</span>
                    </div>
                    <p className="text-[11px] text-[#2C382A] dark:text-[#8E9B8A] mt-1">
                      Mọi lá thư & bình luận của bạn tại Hộp thư này sẽ mang Huy hiệu Sinh viên chính thức.
                    </p>
                  </div>
                );
              } else if (hasAnyVerification && !isGlobalView) {
                return (
                  <div className="w-full max-w-md p-3 rounded-2xl bg-[#2A4228]/10 dark:bg-[#8BA888]/15 border border-[#2A4228]/30 dark:border-[#8BA888]/30 text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#1B2C1A] dark:text-[#8BA888]">
                      <Info className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888]" />
                      <span>Bạn đang xem Hộp thư {school.name} với tư cách Khách</span>
                    </div>
                    <p className="text-[11px] text-[#2C382A] dark:text-[#8E9B8A]">
                      Bạn đã xác thực các trường: {verifiedList.map(s => s.name).join(', ')}.
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      <button
                        onClick={openVerify}
                        className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#2A4228] text-white hover:bg-[#1B2C1A] transition-all flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Đồng bộ xác thực thêm trường này</span>
                      </button>
                    </div>
                  </div>
                );
              } else if (userState?.verificationStatus === 'pending') {
                return (
                  <div className="w-full max-w-md p-3 rounded-2xl bg-[#B87B40]/10 border border-[#B87B40]/30 text-center">
                    <p className="text-xs font-bold text-[#AA6828] dark:text-[#D4A373] flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Đang chờ duyệt thẻ HS/SV...</span>
                    </p>
                    <p className="text-[11px] text-[#2C382A] dark:text-[#8E9B8A] mt-0.5">
                      Ban quản trị & AI đang xem xét thẻ trường của bạn.
                    </p>
                  </div>
                );
              } else {
                return (
                  <button
                    onClick={openVerify}
                    className="text-xs px-4 py-2 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Đồng bộ xác thực Trường học (Thẻ AI / Email edu.vn)</span>
                  </button>
                );
              }
            })()}
          </div>
        </div>

        {/* Scope Filter Selector */}
        {isGlobalView ? (
          <div className="bg-[#2A4228]/10 dark:bg-[#8BA888]/15 border border-[#2A4228]/30 dark:border-[#8BA888]/30 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs text-[#1B2C1A] dark:text-[#8BA888] font-bold">
            <Globe className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888]" />
            <span>Đang hiển thị tất cả các lá thư công khai từ học sinh / sinh viên trên toàn quốc</span>
          </div>
        ) : (
          <div className="bg-[#FAF9F6] dark:bg-[#20281F] p-1.5 rounded-2xl border border-[#C8D2C4] dark:border-[#3A4738] grid grid-cols-2 sm:grid-cols-4 gap-1 shadow-2xs">
            <button
              onClick={() => handleScopeChange('all')}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                scopeFilter === 'all'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#2C382A] dark:text-[#8E9B8A] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Tất cả</span>
            </button>

            <button
              onClick={() => handleScopeChange('public')}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                scopeFilter === 'public'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#2C382A] dark:text-[#8E9B8A] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Công khai</span>
            </button>

            <button
              onClick={() => handleScopeChange('campus')}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                scopeFilter === 'campus'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#2C382A] dark:text-[#8E9B8A] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628]'
              }`}
              title={!isVerifiedForThisSchool ? 'Dành riêng cho thành viên trường' : undefined}
            >
              <Lock className={`w-3.5 h-3.5 ${!isVerifiedForThisSchool ? 'text-amber-600 dark:text-amber-400' : ''}`} />
              <span>Nội bộ</span>
              {!isVerifiedForThisSchool && (
                <span className="text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1 rounded-full font-normal">
                  Khóa
                </span>
              )}
            </button>

            <button
              onClick={() => handleScopeChange('counseling')}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                scopeFilter === 'counseling'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
              }`}
              title={!isVerifiedForThisSchool ? 'Dành riêng cho thành viên trường & Peer Mentor' : undefined}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>🔒 Hòm Thư Tư Vấn</span>
              {!isVerifiedForThisSchool && (
                <span className="text-[9px] bg-emerald-700/20 text-emerald-900 dark:text-emerald-200 px-1 rounded-full font-normal">
                  Khóa
                </span>
              )}
            </button>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="space-y-3">
          {/* Grade / Cohort filter bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#A4A095] shrink-0 mr-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Lọc khối:
            </span>
            {gradeFilters.map(grade => (
              <button
                key={grade}
                onClick={() => setSelectedGradeFilter(grade)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedGradeFilter === grade
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#2C382A] dark:text-[#8E9B8A] border-[#E5E2D9] dark:border-[#3A4738] hover:border-[#2A4228]'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            {/* Tags scroll */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
              {tagsList.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedTag === tag
                      ? 'bg-[#5A6E58] text-white font-bold shadow-sm'
                      : 'bg-[#F1F3EF] dark:bg-[#2A3628] text-[#7E7A71] dark:text-[#8E9B8A] border border-[#E5E2D9] dark:border-[#3A4738] hover:text-[#3A4036] dark:hover:text-[#E8ECE6]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Search inside feed */}
            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A4A095]" />
              <input
                type="text"
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                placeholder="Tìm bài viết, lớp..."
                className="w-full bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] rounded-full py-1.5 pl-8 pr-3 text-xs text-[#3A4036] dark:text-[#E8ECE6] placeholder-[#A4A095] focus:outline-none focus:border-[#5A6E58]"
              />
            </div>
          </div>
        </div>

        {/* Create Post Prompt Card */}
        <div 
          onClick={openComposer}
          className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#8BA888] transition-colors shadow-sm"
        >
          <div className="w-9 h-9 rounded-full bg-[#E9EDC9] dark:bg-[#2C382A] border border-[#CCD5AE] dark:border-[#3A4738] flex items-center justify-center text-[#5A6E58] dark:text-[#8BA888] shrink-0 font-bold">
            🌱
          </div>
          <div className="flex-1 text-xs text-[#7E7A71] dark:text-[#8E9B8A] font-normal">
            Gửi gắm nỗi lòng ẩn danh đến <span className="text-[#3A4036] dark:text-[#E8ECE6] font-semibold">{school.name}</span>...
          </div>
          <button className="bg-[#5A6E58] hover:bg-[#4A5D48] text-white font-medium px-5 py-2 rounded-full text-xs shrink-0 shadow-sm transition-all">
            Chia sẻ ẩn danh
          </button>
        </div>

        {/* Mobile/Tablet Quick Advisor & Listener Helpers Bar */}
        <div className="xl:hidden bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#7E7A71] dark:text-[#8E9B8A] flex items-center gap-1.5">
              <span>🎧</span>
              <span>Cố vấn hỗ trợ & Người lắng nghe:</span>
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online 24/7
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {/* Admin Option */}
            <button
              onClick={() => openDirectChatWithPeer(
                userState?.userRole === 'admin_moderator' ? `${userState?.displayName || 'Admin'} (Ban Quản Trị)` : 'Ban Quản Trị & Ban Cố Vấn',
                'Quản Trị Viên & Ban Cố Vấn'
              )}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold whitespace-nowrap flex items-center gap-1.5 shadow-2xs hover:bg-emerald-800 transition-all shrink-0"
            >
              <span>🛡️</span>
              <span>{userState?.userRole === 'admin_moderator' ? 'Admin Quản Trị (Bạn)' : 'Ban Quản Trị & Cố Vấn'}</span>
              <span className="text-[9px] bg-emerald-900/60 text-emerald-200 px-1 rounded-sm">Admin</span>
            </button>

            {/* Dr. Lan Anh */}
            <button
              onClick={() => openDirectChatWithPeer('Dr. Lan Anh', 'Chuyên gia Tâm lý Học đường')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#263124] border border-[#E5E2D9] dark:border-[#3A4738] font-bold text-[#3A4036] dark:text-[#E8ECE6] whitespace-nowrap flex items-center gap-1.5 shadow-2xs hover:border-[#8BA888] transition-all shrink-0"
            >
              <span>👩‍⚕️</span>
              <span>Dr. Lan Anh</span>
              <span className="text-[9px] bg-[#D4A373]/20 text-[#A06428] dark:text-[#D4A373] px-1 rounded-sm font-semibold">Tâm lý</span>
            </button>

            {/* Mentor Minh Đức */}
            <button
              onClick={() => openDirectChatWithPeer('Mentor Minh Đức', 'Đội ngũ Hỗ trợ & Đồng hành')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#263124] border border-[#E5E2D9] dark:border-[#3A4738] font-bold text-[#3A4036] dark:text-[#E8ECE6] whitespace-nowrap flex items-center gap-1.5 shadow-2xs hover:border-[#8BA888] transition-all shrink-0"
            >
              <span>🎓</span>
              <span>Mentor Minh Đức</span>
              <span className="text-[9px] bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888] px-1 rounded-sm font-semibold">Cố vấn</span>
            </button>
          </div>
        </div>

        {/* Counseling Privacy & Appointment Hub Banner */}
        {scopeFilter === 'counseling' && !isGlobalView && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-950/20 via-emerald-900/15 to-[#2A4228]/15 border border-emerald-500/30 space-y-3.5 animate-fade-in shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-900/20">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Phòng Tham Vấn Tâm Lý Học Đường
                    </span>
                    <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.2 rounded-full font-bold">
                      100% Ẩn danh
                    </span>
                  </div>
                  <h4 className="font-serif italic font-bold text-sm sm:text-base text-[#182217] dark:text-[#E8ECE6]">
                    {school.name} • Hỗ trợ tâm lý & Định hướng
                  </h4>
                </div>
              </div>

              {/* Action Button: Book Appointment Directly */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCounselorForSchedule({});
                  setIsScheduleModalOpen(true);
                }}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#213520] via-[#2A4228] to-[#3A5238] hover:from-[#1a2b19] hover:to-[#2A4228] text-white text-xs font-bold shadow-md shadow-emerald-900/20 flex items-center gap-2 active:scale-95 transition-all shrink-0 w-full sm:w-auto justify-center"
              >
                <Calendar className="w-4 h-4 text-emerald-300" />
                <span>Đặt Lịch Hẹn Tham Vấn</span>
              </button>
            </div>

            <p className="text-[#42493F] dark:text-[#9DA99B] leading-relaxed text-xs">
              {isSpecialistOrCounselor
                ? `Chế độ Chuyên gia: Bạn có thẩm quyền chuyên môn đọc và tham vấn cho học sinh tại ${school.name}.`
                : `Không gian tham vấn an toàn: Bạn có thể đặt lịch gặp Google Meet riêng tư 1-1, gặp trực tiếp tại phòng tham vấn trường hoặc gửi tâm thư bảo mật.`}
            </p>
          </div>
        )}

        {/* Posts List */}
        <div className="flex flex-col gap-4">
          {filteredPosts.length === 0 ? (
            scopeFilter === 'counseling' ? (
              <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-3xl p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl mx-auto shadow-inner">
                  💌
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif italic font-bold text-base text-[#182217] dark:text-[#E8ECE6]">
                    {isSpecialistOrCounselor
                      ? 'Hòm thư tư vấn hiện đang trống'
                      : 'Bạn chưa gửi bức thư tư vấn nào'}
                  </h4>
                  <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] max-w-sm mx-auto leading-relaxed">
                    {isSpecialistOrCounselor
                      ? 'Chưa có học sinh nào gửi yêu cầu hỗ trợ tâm lý tại trường này.'
                      : 'Nếu bạn đang đối diện với áp lực thi cử, gia đình hay tâm sự khó nói, hãy gửi một bức thư ẩn danh để nhận lời khuyên chuyên môn từ Chuyên gia Tâm lý nhé.'}
                  </p>
                </div>
                {!isSpecialistOrCounselor && (
                  <button
                    onClick={openComposer}
                    className="mt-2 px-5 py-2.5 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <HeartHandshake className="w-4 h-4 text-emerald-300" />
                    <span>Gửi tâm thư tư vấn ẩn danh ngay</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-8 text-center text-[#7E7A71] dark:text-[#8E9B8A]">
                <MailCheck className="w-10 h-10 mx-auto mb-2 text-[#8BA888]/60" />
                <p className="text-sm font-medium">Chưa có lá thư nào thuộc danh mục này.</p>
                <button
                  onClick={openComposer}
                  className="mt-3 text-xs text-[#5A6E58] dark:text-[#8E9B8A] font-bold hover:underline"
                >
                  Hãy là người đầu tiên gửi thư ẩn danh ✍️
                </button>
              </div>
            )
          ) : (
            filteredPosts.map(post => {
              const isAuthor = myPostIds.includes(post.id) || (!!currentUserId && post.authorUid === currentUserId);
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => onSelectPost(post)}
                  onToggleLike={onToggleLike}
                  onToggleHug={onToggleHug}
                  onToggleSave={onToggleSave}
                  onSharePost={onSharePost}
                  onEditPost={(isAdmin || isAuthor) ? onEditPost : undefined}
                  onDeletePost={(isAdmin || isAuthor) ? onDeletePost : undefined}
                  onConnectWithAuthor={onConnectWithAuthor ? (p, e) => onConnectWithAuthor(p) : undefined}
                  onViewPublicProfile={onViewPublicProfile}
                  isAuthor={isAuthor}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Right Rail Sidebar (Desktop Wide) - Active Listeners & School Context */}
      <aside className="hidden xl:flex flex-col w-80 p-6 gap-6 sticky top-0 h-screen overflow-y-auto border-l border-[#E5E2D9] dark:border-[#3A4738] text-xs select-none">
        {/* Active Listeners Widget */}
        <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A4A095] dark:text-[#8E9B8A]">
              Cố vấn hỗ trợ & Người lắng nghe
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Admin / Ban Quản Trị & Cố Vấn */}
            <div 
              onClick={() => openDirectChatWithPeer(
                userState?.userRole === 'admin_moderator' ? `${userState?.displayName || 'Admin'} (Ban Quản Trị)` : 'Ban Quản Trị & Ban Cố Vấn',
                'Quản Trị Viên & Ban Cố Vấn'
              )}
              className="p-3 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/30 dark:via-emerald-900/10 dark:to-transparent rounded-xl border border-emerald-500/30 dark:border-emerald-500/30 flex items-center gap-3 cursor-pointer hover:border-emerald-500 hover:shadow-xs transition-all group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-700/20 dark:bg-emerald-600/30 flex items-center justify-center text-base border border-emerald-500/40">
                  🛡️
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#263124] rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {userState?.userRole === 'admin_moderator'
                      ? `${userState?.displayName || userState?.verifiedFullName || 'Admin Quản Trị'} (Bạn)`
                      : 'Ban Quản Trị & Ban Cố Vấn'}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-700 text-white shrink-0">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-[#5A6E58] dark:text-[#8BA888] truncate font-medium">
                  {userState?.userRole === 'admin_moderator' ? 'Tài khoản Quản trị & Điều phối' : 'Hỗ trợ bảo mật & Lắng nghe 24/7'}
                </p>
              </div>
            </div>

            {/* Dr. Lan Anh - Chuyên gia Tâm lý */}
            <div 
              onClick={() => openDirectChatWithPeer('Dr. Lan Anh', 'Chuyên gia Tâm lý Học đường')}
              className="p-3 bg-white dark:bg-[#263124] rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] flex items-center gap-3 cursor-pointer hover:border-[#8BA888] transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#D4A373]/20 flex items-center justify-center text-sm border border-[#D4A373]/30">👩‍⚕️</div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#263124] rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-bold text-[#3A4036] dark:text-[#E8ECE6]">Dr. Lan Anh</h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#D4A373]/20 text-[#A06428] dark:text-[#D4A373]">
                    Chuyên gia
                  </span>
                </div>
                <p className="text-[10px] text-[#A4A095] dark:text-[#8E9B8A]">Tư vấn tâm lý & Meet 1-1</p>
              </div>
            </div>

            {/* Mentor Minh Đức */}
            <div 
              onClick={() => openDirectChatWithPeer('Mentor Minh Đức', 'Đội ngũ Hỗ trợ & Đồng hành')}
              className="p-3 bg-white dark:bg-[#263124] rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] flex items-center gap-3 cursor-pointer hover:border-[#8BA888] transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#8BA888]/20 flex items-center justify-center text-sm border border-[#8BA888]/30">🎓</div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#263124] rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-bold text-[#3A4036] dark:text-[#E8ECE6]">Mentor Minh Đức</h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888]">
                    Cố vấn
                  </span>
                </div>
                <p className="text-[10px] text-[#A4A095] dark:text-[#8E9B8A]">Đội ngũ Đồng hành sinh viên</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crisis Support Block */}
        <div className="p-5 bg-[#5A6E58] rounded-2xl text-white flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕯️</span>
            <h4 className="font-serif italic text-lg leading-tight">Khủng hoảng tâm lý?</h4>
          </div>
          <p className="text-[11px] opacity-90 leading-relaxed">
            Chúng mình luôn ở đây để lắng nghe bạn 24/7. Nhấn vào đây để kết nối riêng tư với Admin & Chuyên gia.
          </p>
          <button 
            onClick={() => openDirectChatWithPeer('Ban Quản Trị & Ban Cố Vấn', 'Quản Trị Viên & Ban Cố Vấn')}
            className="w-full py-2 bg-white text-[#5A6E58] rounded-lg text-xs font-bold mt-1 uppercase tracking-wider hover:bg-[#FAF9F6] transition-colors"
          >
            Liên hệ Ban Cố Vấn
          </button>
        </div>

        {/* Relax Lo-Fi Music Widget */}
        <div className="mt-auto">
          <div className="p-4 border border-dashed border-[#DCD9D0] dark:border-[#3A4738] rounded-xl flex items-center gap-3 bg-[#FAF9F6] dark:bg-[#222B21]">
            <span className="text-xl">🎧</span>
            <div>
              <h5 className="text-xs font-bold text-[#3A4036] dark:text-[#E8ECE6]">Giai điệu an yên</h5>
              <p className="text-[10px] text-[#A4A095] dark:text-[#8E9B8A]">Lo-fi cho ngày mưa</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Member-Only Access Gate Modal Popup */}
      {accessGateModal.isOpen && !isGlobalView && school && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in text-center relative">
            <button
              onClick={() => setAccessGateModal({ isOpen: false, targetType: 'campus' })}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#5A6D58] dark:text-[#8E9B8A] transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
              {accessGateModal.targetType === 'counseling' ? '🔒' : '🏛️'}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full inline-block">
                Yêu cầu thành viên trường
              </span>
              <h3 className="font-serif italic text-xl font-bold text-[#182217] dark:text-[#E8ECE6]">
                {accessGateModal.targetType === 'counseling' 
                  ? 'Hòm Thư Tư Vấn Giới Hạn Truy Cập' 
                  : 'Hộp Thư Nội Bộ Trường Học'}
              </h3>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] leading-relaxed px-1">
                Bạn cần là học sinh / sinh viên chính thức của <strong>{school.name}</strong> để xem nội dung {accessGateModal.targetType === 'counseling' ? 'trong Hòm Thư Tư Vấn Tâm Lý' : 'nội bộ'}. Bạn hiện có thể đọc các lá thư ở chế độ <strong>Công khai</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-[11px] text-[#42493F] dark:text-[#9DA99B] text-left flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Không gian này được bảo vệ nhằm giữ gìn sự riêng tư, bảo mật tâm lý và kết nối an toàn cho học sinh / sinh viên của trường.</span>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  setAccessGateModal({ isOpen: false, targetType: 'campus' });
                  if (openVerify) openVerify();
                }}
                className="w-full py-3 rounded-2xl bg-[#2A4228] hover:bg-[#1B2C1A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Xác thực thành viên trường ngay (Thẻ AI / Email)</span>
              </button>

              <button
                onClick={() => {
                  setAccessGateModal({ isOpen: false, targetType: 'campus' });
                  setScopeFilter('public');
                }}
                className="w-full py-2.5 rounded-2xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#5A6D58] dark:text-[#8E9B8A] font-semibold text-xs transition-colors"
              >
                Xem các bài viết công khai
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Counseling Schedule & Google Meet Modal */}
      {isScheduleModalOpen && (
        <CounselingScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          schoolName={school?.name || userState?.selectedSchool?.name || 'Trường của bạn'}
          schoolId={school?.id || userState?.selectedSchool?.id || 'all-schools'}
          counselorName={selectedCounselorForSchedule.name}
          counselorRole={selectedCounselorForSchedule.role}
          userState={userState}
          existingAppointments={appointments}
          mentorApplications={mentorApplications}
          onConfirmSchedule={(appointment) => {
            if (onScheduleAppointment) {
              onScheduleAppointment(appointment);
            }
          }}
        />
      )}
    </div>
  );
};
