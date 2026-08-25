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
  MailCheck 
} from 'lucide-react';
import { Post, School, UserState } from '../types';
import { PostCard } from './PostCard';

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
  openDirectChatWithPeer: (peerName: string, roleTitle: string) => void;
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
  openDirectChatWithPeer
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('Tất cả');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('Tất cả khối');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'public' | 'campus'>('all');
  const [feedSearch, setFeedSearch] = useState('');

  const isGlobalView = !school || (school.id === 'global' || school.id === 'all-schools');

  // Base posts selection based on selected school or global view
  const basePosts = isGlobalView
    ? posts.filter(p => p.isPublic === true)
    : posts.filter(p => school && (p.schoolId === school.id || p.schoolSlug === school.slug));

  // Filter by scope (inside specific school hub)
  const scopeFilteredPosts = basePosts.filter(p => {
    if (isGlobalView) return true; // Sảnh Chung is strictly public posts
    if (scopeFilter === 'public') return p.isPublic === true;
    if (scopeFilter === 'campus') return p.isPublic !== true;
    return true;
  });

  const tagsList = ['Tất cả', 'Áp lực học tập', 'Gia đình', 'Định hướng tương lai', 'Sự ấm áp'];
  const gradeFilters = ['Tất cả khối', 'Khối 12', 'Khối 11', 'Khối 10', 'Sinh viên / Cựu HS'];

  const filteredPosts = scopeFilteredPosts.filter(p => {
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

          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs text-[#42493F] dark:text-[#8E9B8A] font-medium pt-3 border-t border-[#E5E2D9] dark:border-[#3A4738]">
            <span>🌱 <strong>{school.letterCount.toLocaleString()}</strong> lá thư</span>
            <span className="text-[#E5E2D9] dark:text-[#3A4738]">•</span>
            <span className="text-[#5A6E58] dark:text-[#8BA888] font-bold">+{school.newCount} mới hôm nay</span>
            <span className="text-[#E5E2D9] dark:text-[#3A4738]">•</span>
            <span>✅ <strong>{school.verifiedCount}</strong> thành viên đã xác thực</span>
          </div>

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
          <div className="bg-[#FAF9F6] dark:bg-[#20281F] p-1.5 rounded-2xl border border-[#C8D2C4] dark:border-[#3A4738] flex items-center justify-between gap-1 shadow-2xs">
            <button
              onClick={() => setScopeFilter('all')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                scopeFilter === 'all'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#2C382A] dark:text-[#8E9B8A] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628] hover:text-[#0F180E] dark:hover:text-[#E8ECE6]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Tất cả lá thư trường này</span>
            </button>

            <button
              onClick={() => setScopeFilter('public')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                scopeFilter === 'public'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#2C382A] dark:text-[#8E9B8A] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628] hover:text-[#0F180E] dark:hover:text-[#E8ECE6]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Lá thư công khai</span>
            </button>

            <button
              onClick={() => setScopeFilter('campus')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                scopeFilter === 'campus'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#2C382A] dark:text-[#8E9B8A] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628] hover:text-[#0F180E] dark:hover:text-[#E8ECE6]'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Nội bộ trường</span>
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

        {/* Posts List */}
        <div className="flex flex-col gap-4">
          {filteredPosts.length === 0 ? (
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
                  onEditPost={isAuthor ? onEditPost : undefined}
                  onDeletePost={isAuthor ? onDeletePost : undefined}
                  onConnectWithAuthor={onConnectWithAuthor ? (p, e) => onConnectWithAuthor(p) : undefined}
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
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A4A095] dark:text-[#8E9B8A] mb-3">
            Cố vấn hỗ trợ & Người lắng nghe
          </h3>

          <div className="flex flex-col gap-3">
            <div 
              onClick={() => openDirectChatWithPeer('Dr. Lan Anh', 'Chuyên gia Tâm lý')}
              className="p-3 bg-white dark:bg-[#263124] rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] flex items-center gap-3 cursor-pointer hover:border-[#8BA888] transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#D4A373]/20 flex items-center justify-center text-sm">👩‍⚕️</div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#263124] rounded-full"></div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#3A4036] dark:text-[#E8ECE6]">Dr. Lan Anh</h4>
                <p className="text-[10px] text-[#A4A095] dark:text-[#8E9B8A]">Chuyên gia Tâm lý</p>
              </div>
            </div>

            <div 
              onClick={() => openDirectChatWithPeer('Mentor Minh Đức', 'Đội ngũ Hỗ trợ')}
              className="p-3 bg-white dark:bg-[#263124] rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] flex items-center gap-3 cursor-pointer hover:border-[#8BA888] transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#8BA888]/20 flex items-center justify-center text-sm">🎓</div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#263124] rounded-full"></div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#3A4036] dark:text-[#E8ECE6]">Mentor Minh Đức</h4>
                <p className="text-[10px] text-[#A4A095] dark:text-[#8E9B8A]">Đội ngũ Hỗ trợ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crisis Support Block */}
        <div className="p-5 bg-[#5A6E58] rounded-2xl text-white flex flex-col gap-3 shadow-sm">
          <h4 className="font-serif italic text-lg leading-tight">Khủng hoảng tâm lý?</h4>
          <p className="text-[11px] opacity-90 leading-relaxed">
            Chúng mình luôn ở đây để lắng nghe bạn 24/7. Nhấn vào đây để kết nối riêng tư với chuyên gia.
          </p>
          <button 
            onClick={() => openDirectChatWithPeer('ThS. Tâm lý Minh Đức', 'Chuyên gia Tâm lý')}
            className="w-full py-2 bg-white text-[#5A6E58] rounded-lg text-xs font-bold mt-1 uppercase tracking-wider hover:bg-[#FAF9F6] transition-colors"
          >
            Liên hệ ngay
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
    </div>
  );
};
