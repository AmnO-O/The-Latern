import React, { useState } from 'react';
import { BadgeCheck, Lock, HeartHandshake, Sparkles, Trophy, GraduationCap, ShieldCheck, User, Camera, Check, RefreshCw } from 'lucide-react';
import { Post, UserState, School } from '../types';
import { PostCard } from './PostCard';
import { calculateReputationScore, getReputationRank, getNextRankProgress } from '../lib/reputationUtils';
import { ReputationBadge, ReputationIcon } from './ReputationBadge';
import { AVATAR_PRESETS, getEffectiveAvatar } from '../data/avatarPresets';

interface ProfileViewProps {
  userState: UserState;
  setUserState?: React.Dispatch<React.SetStateAction<UserState>>;
  setActiveTab?: (tab: any) => void;
  savedPosts: Post[];
  onOpenVerify: () => void;
  onOpenLogin?: () => void;
  onRemoveSchoolVerification?: (schoolId: string) => void;
  onResetAllVerifications?: () => void;
  onSelectPost: (post: Post) => void;
  onToggleLike: (postId: string, e: React.MouseEvent) => void;
  onToggleHug: (postId: string, e: React.MouseEvent) => void;
  onToggleSave: (postId: string, e: React.MouseEvent) => void;
  onSharePost?: (post: Post) => void;
  onConnectWithAuthor?: (post: Post) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userState,
  setUserState,
  setActiveTab,
  savedPosts,
  onOpenVerify,
  onOpenLogin,
  onRemoveSchoolVerification,
  onResetAllVerifications,
  onSelectPost,
  onToggleLike,
  onToggleHug,
  onToggleSave,
  onSharePost,
  onConnectWithAuthor
}) => {
  const [confirmDeleteSchoolId, setConfirmDeleteSchoolId] = useState<string | null>(null);
  const [isConfirmingResetAll, setIsConfirmingResetAll] = useState(false);
  const [isEditingAvatarModal, setIsEditingAvatarModal] = useState(false);
  const [customAvatarUrlInput, setCustomAvatarUrlInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Manual Identity Input State
  const [manualFullName, setManualFullName] = useState(
    userState.verifiedFullName || userState.displayName || userState.googleUser?.displayName || ''
  );
  const [manualMajor, setManualMajor] = useState(
    userState.verifiedMajor || (userState.selectedSchool?.type === 'university' ? 'Công nghệ thông tin' : 'Chuyên Tin')
  );
  const [manualCohort, setManualCohort] = useState(
    userState.verifiedCohort || userState.defaultCohort || (userState.selectedSchool?.type === 'university' ? 'K22 (2022 - 2026)' : 'K21-24')
  );
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);
  const [lockCommitAgreed, setLockCommitAgreed] = useState(false);
  const [lockValidationError, setLockValidationError] = useState<string | null>(null);

  const isLoggedInWithGmail = Boolean(userState.isLoggedIn && userState.googleUser?.email);
  const isVerified = userState.verificationStatus === 'verified' && (userState.verifiedSchools || []).length > 0;
  const hugsReceived = userState.hugsReceivedCount || 0;
  const reputationScore = calculateReputationScore(isVerified, hugsReceived, userState.baseScoreBonus || 0);
  const currentRank = getReputationRank(reputationScore);
  const rankProgress = getNextRankProgress(reputationScore);

  const effectiveAvatar = getEffectiveAvatar(userState.customAvatarUrl, userState.googleUser?.photoURL);
  const effectiveDisplayName = userState.displayName || userState.googleUser?.displayName || `Người dùng #${userState.userAnonNumber}`;
  const effectiveCohort = userState.defaultCohort || 'Sinh viên K22';

  const showSaveNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleUpdateDisplayName = (name: string) => {
    if (!setUserState) return;
    setUserState(prev => {
      const updated = { ...prev, displayName: name };
      try {
        localStorage.setItem('the_lantern_user_state', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdateAvatar = (url: string) => {
    if (!setUserState) return;
    setUserState(prev => {
      const updated = { ...prev, customAvatarUrl: url };
      try {
        localStorage.setItem('the_lantern_user_state', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setIsEditingAvatarModal(false);
    showSaveNotification('Đã cập nhật avatar danh tính chính thành công!');
  };

  const handleCustomAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        handleUpdateAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateDefaultCohort = (cohort: string) => {
    if (!setUserState) return;
    setUserState(prev => {
      const updated = { ...prev, defaultCohort: cohort };
      try {
        localStorage.setItem('the_lantern_user_state', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // One-time identity locking handler
  const handleInitiateLockIdentity = () => {
    setLockValidationError(null);
    if (!manualFullName.trim()) {
      setLockValidationError('Vui lòng nhập đầy đủ Họ và tên thật.');
      return;
    }
    if (!manualMajor.trim()) {
      setLockValidationError('Vui lòng nhập Chuyên ngành hoặc Lớp gốc (VD: Chuyên Tin, Lớp A1, CNTT...).');
      return;
    }
    if (!manualCohort.trim()) {
      setLockValidationError('Vui lòng nhập Niên khóa/Khóa học (VD: K21-24, K22, Khóa 2021-2024...).');
      return;
    }
    setLockCommitAgreed(false);
    setShowLockConfirmModal(true);
  };

  const handleConfirmPermanentLock = () => {
    if (!lockCommitAgreed || !setUserState) return;

    const trimmedName = manualFullName.trim();
    const trimmedMajor = manualMajor.trim();
    const trimmedCohort = manualCohort.trim();
    const currentSchool = userState.selectedSchool;

    setUserState(prev => {
      const updatedSchoolVerifications = { ...(prev.schoolVerifications || {}) };
      if (currentSchool && currentSchool.id) {
        updatedSchoolVerifications[currentSchool.id] = {
          schoolId: currentSchool.id,
          schoolName: currentSchool.name,
          schoolType: currentSchool.type,
          verifiedAt: Date.now(),
          method: 'gemini_ocr',
          role: 'student',
          studentName: trimmedName,
          major: trimmedMajor,
          cohort: trimmedCohort,
          isIdentityLocked: true
        };
      }

      const updatedCohorts = {
        ...(prev.schoolCohorts || {}),
        ...(currentSchool?.id ? { [currentSchool.id]: trimmedCohort } : {})
      };

      const updatedState: UserState = {
        ...prev,
        displayName: trimmedName,
        verifiedFullName: trimmedName,
        verifiedMajor: trimmedMajor,
        verifiedCohort: trimmedCohort,
        defaultCohort: trimmedCohort,
        schoolCohorts: updatedCohorts,
        schoolVerifications: updatedSchoolVerifications,
        isIdentityLocked: true
      };

      try {
        localStorage.setItem('the_lantern_user_state', JSON.stringify(updatedState));
      } catch (e) {}

      return updatedState;
    });

    setShowLockConfirmModal(false);
    showSaveNotification('🔒 Danh tính học đường của bạn đã được khóa vĩnh viễn thành công!');
  };

  const handleUpdateSchoolCohort = (schoolId: string, cohort: string) => {
    if (!setUserState) return;
    setUserState(prev => {
      const updatedCohorts = { ...(prev.schoolCohorts || {}), [schoolId]: cohort };
      const updatedVerifications = { ...(prev.schoolVerifications || {}) };
      if (updatedVerifications[schoolId]) {
        updatedVerifications[schoolId] = {
          ...updatedVerifications[schoolId],
          cohort: cohort
        };
      }
      const updated = { 
        ...prev, 
        schoolCohorts: updatedCohorts,
        schoolVerifications: updatedVerifications
      };
      try {
        localStorage.setItem('the_lantern_user_state', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showSaveNotification(`Đã lưu niên khóa cho trường!`);
  };

  const handleTogglePostingMode = (mode: 'anonymous' | 'identity') => {
    if (!setUserState) return;
    setUserState(prev => {
      const updated = { ...prev, activePostingMode: mode };
      try {
        localStorage.setItem('the_lantern_user_state', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showSaveNotification(`Đã đổi chế độ mặc định thành: ${mode === 'anonymous' ? '🎭 Ẩn danh' : '👤 Danh tính chính'}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6 min-h-screen pb-24 animate-fade-in">
      {/* Save Success Toast */}
      {saveSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-2xl bg-[#2A4228] text-white text-xs font-bold shadow-xl border border-white/20 flex items-center gap-2 animate-bounce-short">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Profile Summary Card */}
      <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm text-center space-y-4">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2A4228]/20 via-[#8BA888] to-[#2A4228]/20"></div>

        {/* Profile Avatar with Customizer Button */}
        <div className="relative inline-block mx-auto group">
          <div className="w-20 h-20 rounded-full border-2 border-[#2A4228] dark:border-[#8BA888] p-1 shadow-md bg-white dark:bg-[#1C251A] overflow-hidden">
            <img
              src={effectiveAvatar}
              alt="User Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsEditingAvatarModal(true)}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-[#2A4228] hover:bg-[#385036] text-white shadow-md border border-white dark:border-[#1C251A] transition-transform active:scale-90"
            title="Đổi avatar danh tính"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
            <h1 className="font-serif italic font-semibold text-2xl text-[#182217] dark:text-[#E8ECE6]">
              {effectiveDisplayName}
            </h1>
            <ReputationBadge score={reputationScore} size="md" />
          </div>
          <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] font-medium mt-0.5">
            Bút danh ẩn danh: <strong className="text-[#2A4228] dark:text-[#8BA888]">Người dùng ẩn danh #{userState.userAnonNumber}</strong>
          </p>
        </div>

        {/* Default Posting Mode Toggle Pills */}
        <div className="p-2 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E271D] border border-[#C8D2C4] dark:border-[#3A4738] flex items-center justify-between gap-2 max-w-md mx-auto">
          <span className="text-[11px] font-bold text-[#5A6D58] dark:text-[#8E9B8A] pl-2">
            Chế độ đăng mặc định:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleTogglePostingMode('anonymous')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                (userState.activePostingMode || 'anonymous') === 'anonymous'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span>🎭 Ẩn danh</span>
            </button>
            <button
              type="button"
              onClick={() => handleTogglePostingMode('identity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                userState.activePostingMode === 'identity'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span>👤 Danh tính chính</span>
            </button>
          </div>
        </div>

        {/* Reputation Trust Meter Panel */}
        <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E271D] border border-[#C8D2C4] dark:border-[#3A4738] text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white dark:bg-[#141B13] border border-[#C8D2C4] dark:border-[#3A4738] shadow-xs flex items-center justify-center">
                <ReputationIcon rank={currentRank} size="lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                    Độ uy tín cộng đồng: {reputationScore} điểm
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#2A4228]/10 dark:bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888]">
                    {currentRank.title}
                  </span>
                </div>
                <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                  {currentRank.description}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar to next rank */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#5A6D58] dark:text-[#8E9B8A]">
              <span>Mốc hiện tại ({reputationScore} điểm)</span>
              <span className="flex items-center gap-1">
                {rankProgress.remaining > 0 ? (
                  <span>Còn {rankProgress.remaining} điểm để lên mốc tiếp theo ({rankProgress.nextTarget}đ)</span>
                ) : (
                  <>
                    <Trophy className="w-3 h-3 text-amber-500 inline" />
                    <span>Đạt mốc uy tín cao nhất</span>
                  </>
                )}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E5E2D9] dark:bg-[#2A3628] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8BA888] to-[#2A4228] transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(8, rankProgress.progressPercent)}%` }}
              ></div>
            </div>
          </div>

          {/* Rules breakdown card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-black/5 dark:border-white/5 text-[11px]">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#141B13] border border-[#E5E2D9] dark:border-[#3A4738]">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                {isVerified ? <BadgeCheck className="w-4 h-4" /> : <Lock className="w-4 h-4 text-slate-400" />}
              </div>
              <div>
                <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">
                  {isVerified ? 'Đã xác thực (+8đ -> 10đ)' : 'Xác thực sinh viên (.edu.vn)'}
                </span>
                <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">
                  {isVerified ? 'Đã kích hoạt mốc 10 điểm ban đầu' : 'Tăng ngay lên 10 điểm uy tín'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#141B13] border border-[#E5E2D9] dark:border-[#3A4738]">
              <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">
                  +{Math.floor(hugsReceived / 4)} điểm từ {hugsReceived} cái ôm
                </span>
                <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">
                  Cứ mỗi 4 cái ôm nhận được: +1 điểm uy tín
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Stats Grid */}
        <div className="pt-4 border-t border-[#E5E2D9] dark:border-[#3A4738] grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="block font-bold text-lg text-[#182217] dark:text-[#E8ECE6]">
              {userState.hugsGivenCount}
            </span>
            <span className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] uppercase tracking-wider font-bold inline-flex items-center justify-center gap-1">
              <HeartHandshake className="w-3 h-3 text-amber-600 inline" />
              <span>Cái ôm đã trao</span>
            </span>
          </div>

          <div 
            onClick={!isVerified ? onOpenVerify : undefined}
            className={`transition-colors rounded-xl p-1 ${!isVerified ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : ''}`}
            title={isVerified ? 'Tài khoản đã xác minh thẻ trường học' : 'Nhấn để xác thực thẻ trường / email .edu.vn'}
          >
            <span className={`block font-bold text-lg ${isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#2A4228] dark:text-[#8BA888]'}`}>
              {isVerified ? 'Đã xác minh' : 'Chưa xác thực'}
            </span>
            <span className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] uppercase tracking-wider font-bold">
              Xác thực thẻ trường
            </span>
          </div>

          <div>
            <span className="block font-bold text-lg text-[#182217] dark:text-[#E8ECE6]">
              {savedPosts.length}
            </span>
            <span className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] uppercase tracking-wider font-bold">
              Đã lưu
            </span>
          </div>
        </div>
      </div>

      {/* ================= PUBLIC IDENTITY SETTINGS PANEL (CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP GMAIL) ================= */}
      {isLoggedInWithGmail && (
        <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E2D9] dark:border-[#3A4738] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">badge</span>
              </div>
              <div>
                <h2 className="font-serif italic font-bold text-base text-[#182217] dark:text-[#E8ECE6]">
                  Cài đặt Danh tính Công khai & Niên khóa
                </h2>
                <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                  Thông tin sẽ xuất hiện khi bạn chọn đăng bài hoặc bình luận bằng Danh tính chính
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingAvatarModal(true)}
              className="px-3 py-1.5 rounded-full bg-[#FAF9F6] dark:bg-[#20281F] text-[#2A4228] dark:text-[#8BA888] border border-[#C8D2C4] dark:border-[#3A4738] text-xs font-bold hover:bg-[#EAF0E8] transition-all"
            >
              🎨 Đổi Avatar
            </button>
          </div>

          {/* Identity Status Notice for Logged-In Users */}
          {userState.isIdentityLocked ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-base">lock</span>
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                  <span>Danh tính Học đường Đã Xác Thực & Khóa Chống Sửa Đổi 🔒</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-600/20 font-extrabold uppercase">Đã Khóa</span>
                </div>
                <p className="text-[11px] text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                  Họ tên thật, chuyên ngành và niên khóa của bạn đã được khóa cố định trên hệ thống để bảo đảm tính chuẩn xác và chống giả mạo trong trường. Bạn có thể tự do đổi Avatar hoặc chuyển sang chế độ <strong>Ẩn danh 100%</strong> bất cứ lúc nào.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-base">edit_note</span>
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-300">
                  <span>Tự thiết lập danh tính học đường (Lưu 1 lần duy nhất)</span>
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  Bạn có thể tự điền Họ tên, Chuyên ngành/Lớp gốc và Niên khóa bên dưới rồi nhấn Lưu & Khóa, hoặc <button onClick={onOpenVerify} className="font-bold underline text-amber-800 dark:text-amber-200">Quét Thẻ AI</button> để tự động nhận diện.
                </p>
              </div>
            </div>
          )}

          {/* Display Name, Major & Cohort Credentials Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {/* Real Full Name */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A] mb-1 flex items-center justify-between">
                <span>Họ và tên thật</span>
                {userState.isIdentityLocked ? (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <span>🔒 Đã khóa</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold">
                    Tự điền
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userState.isIdentityLocked ? (userState.verifiedFullName || userState.displayName || '') : manualFullName}
                  readOnly={userState.isIdentityLocked}
                  disabled={userState.isIdentityLocked}
                  onChange={(e) => setManualFullName(e.target.value)}
                  placeholder="VD: Nguyễn Hoàng Nam..."
                  className={`w-full rounded-xl p-2.5 text-xs font-bold border ${
                    userState.isIdentityLocked
                      ? 'bg-[#2A4228]/5 dark:bg-[#151C14] border-[#8BA888]/40 text-[#182217] dark:text-[#E8ECE6] cursor-not-allowed select-all'
                      : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#C8D2C4] dark:border-[#3A4738] text-[#182217] dark:text-[#E8ECE6] focus:outline-none focus:border-[#2A4228]'
                  }`}
                />
                {userState.isIdentityLocked && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-600 dark:text-emerald-400" title="Đã khóa chống sửa đổi">
                    ✓
                  </span>
                )}
              </div>
            </div>

            {/* Major / Field of Study */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A] mb-1 flex items-center justify-between">
                <span>Chuyên ngành / Lớp gốc</span>
                {userState.isIdentityLocked ? (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <span>🔒 Đã khóa</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold">
                    Tự điền
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userState.isIdentityLocked ? (userState.verifiedMajor || 'Chuyên Tin') : manualMajor}
                  readOnly={userState.isIdentityLocked}
                  disabled={userState.isIdentityLocked}
                  onChange={(e) => setManualMajor(e.target.value)}
                  placeholder="VD: Chuyên Tin, Lớp A1, CNTT..."
                  className={`w-full rounded-xl p-2.5 text-xs font-bold border ${
                    userState.isIdentityLocked
                      ? 'bg-[#2A4228]/5 dark:bg-[#151C14] border-[#8BA888]/40 text-[#2A4228] dark:text-[#8BA888] cursor-not-allowed select-all'
                      : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#C8D2C4] dark:border-[#3A4738] text-[#2A4228] dark:text-[#8BA888] focus:outline-none focus:border-[#2A4228]'
                  }`}
                />
                {userState.isIdentityLocked && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                )}
              </div>
              {!userState.isIdentityLocked && (
                <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-1 italic">
                  *Không ghi Lớp 10/11/12 vì sẽ thay đổi theo năm
                </p>
              )}
            </div>

            {/* Cohort / Class */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A] mb-1 flex items-center justify-between">
                <span>Khóa / Niên khóa</span>
                {userState.isIdentityLocked ? (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <span>🔒 Đã khóa</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold">
                    Tự điền
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userState.isIdentityLocked ? (userState.verifiedCohort || userState.defaultCohort || 'K21-24') : manualCohort}
                  readOnly={userState.isIdentityLocked}
                  disabled={userState.isIdentityLocked}
                  onChange={(e) => setManualCohort(e.target.value)}
                  placeholder="VD: K21-24, K22 (2022-2026)..."
                  className={`w-full rounded-xl p-2.5 text-xs font-bold border ${
                    userState.isIdentityLocked
                      ? 'bg-[#2A4228]/5 dark:bg-[#151C14] border-[#8BA888]/40 text-[#2A4228] dark:text-[#8BA888] cursor-not-allowed select-all'
                      : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#C8D2C4] dark:border-[#3A4738] text-[#2A4228] dark:text-[#8BA888] focus:outline-none focus:border-[#2A4228]'
                  }`}
                />
                {userState.isIdentityLocked && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                )}
              </div>
              {!userState.isIdentityLocked && (
                <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-1 italic">
                  *VD: K21-24, K22, Khóa 2021-2024
                </p>
              )}
            </div>
          </div>

          {/* If NOT Locked: Provide Action Button to Save & Lock Once */}
          {!userState.isIdentityLocked && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#2A4228]/5 dark:bg-[#1E271D] p-3.5 rounded-2xl border border-[#2A4228]/20">
              <div className="text-left space-y-0.5">
                <div className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] flex items-center gap-1.5">
                  <span>⚠️ Lưu ý quan trọng trước khi lưu</span>
                </div>
                <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                  Thông tin danh tính chỉ được lưu <strong>DUY NHẤT 1 LẦN</strong> và sẽ được <strong>KHÓA VĨNH VIỄN</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleInitiateLockIdentity}
                className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl bg-[#2A4228] text-white text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Lưu & Khóa Danh Tính (1 Lần Duy Nhất)</span>
              </button>
            </div>
          )}

          {/* Verified Schools List & Per-School Locked Info */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#2A4228] dark:text-[#8BA888] font-bold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Hồ sơ trường học đã xác thực</span>
              </span>
              <button
                type="button"
                onClick={onOpenVerify}
                className="text-[10px] font-bold text-[#2A4228] dark:text-[#8BA888] hover:underline"
              >
                + Quét xác thực thêm trường
              </button>
            </div>

            {userState.verificationStatus === 'verified' && (userState.verifiedSchools || []).length > 0 ? (
              <div className="space-y-2">
                {(userState.verifiedSchools || []).map(sch => {
                  const record = userState.schoolVerifications?.[sch.id];
                  const schoolCohort = record?.cohort || userState.schoolCohorts?.[sch.id] || userState.verifiedCohort || (sch.type === 'university' ? 'K22' : 'Khóa 2023 - 2026');
                  const schoolMajor = record?.major || userState.verifiedMajor || (sch.type === 'university' ? 'Sinh viên chính quy' : 'Học sinh');
                  const studentName = record?.studentName || userState.verifiedFullName || userState.displayName || 'Học sinh / Sinh viên';

                  return (
                    <div
                      key={sch.id}
                      className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E271D] border border-[#C8D2C4] dark:border-[#3A4738] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#2A4228] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <span className="material-symbols-outlined text-lg">
                            {sch.type === 'university' ? 'school' : 'apartment'}
                          </span>
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] truncate">
                              {sch.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center gap-0.5 shrink-0">
                              <span>🔒 AI Locked</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                            {studentName} &bull; <span className="font-semibold text-[#2A4228] dark:text-[#8BA888]">{schoolMajor}</span> &bull; <span>{schoolCohort}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#151C14] px-2.5 py-1.5 rounded-xl border border-[#8BA888]/30">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>Chống sửa đổi 100%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-[#C8D2C4] dark:border-[#3A4738] text-center space-y-2">
                <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A]">
                  Bạn chưa xác thực thẻ trường học nào. Hãy xác thực để nhận huy hiệu chính thức và mở khóa Hộp thư trường!
                </p>
                <button
                  type="button"
                  onClick={onOpenVerify}
                  className="px-4 py-1.5 rounded-full bg-[#2A4228] hover:bg-[#385036] text-white text-xs font-bold shadow-sm"
                >
                  Xác thực ngay bằng Thẻ AI / Email .edu.vn
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= AVATAR PICKER MODAL ================= */}
      {isEditingAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E2D9] dark:border-[#3A4738] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎨</span>
                <h3 className="font-serif italic font-bold text-lg text-[#182217] dark:text-[#E8ECE6]">
                  Tùy chỉnh Avatar Danh tính
                </h3>
              </div>
              <button
                onClick={() => setIsEditingAvatarModal(false)}
                className="p-1 rounded-full text-[#A4A095] hover:text-[#182217] dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Current Selected Avatar Preview */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E271D] border border-[#C8D2C4] dark:border-[#3A4738]">
              <img
                src={effectiveAvatar}
                alt="Selected"
                className="w-14 h-14 rounded-full object-cover border-2 border-[#2A4228] shadow-sm"
              />
              <div>
                <div className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                  Avatar hiện tại của bạn
                </div>
                <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">
                  Hiển thị khi bạn chia sẻ lá thư hoặc bình luận bằng danh tính chính
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A]">
                Bộ sưu tập Avatar Học đường & Nghệ thuật
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {AVATAR_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleUpdateAvatar(preset.url)}
                    className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all hover:scale-105 group ${
                      effectiveAvatar === preset.url
                        ? 'border-[#2A4228] ring-2 ring-[#8BA888]'
                        : 'border-transparent hover:border-[#8BA888]'
                    }`}
                    title={preset.name}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-end justify-center p-1 text-[9px] text-white font-bold text-center transition-opacity">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload from Computer */}
            <div className="pt-2 border-t border-[#E5E2D9] dark:border-[#3A4738] space-y-2">
              <label className="block text-center py-2.5 px-4 rounded-2xl border-2 border-dashed border-[#2A4228] bg-[#FAF9F6] dark:bg-[#1E271D] text-xs font-bold text-[#2A4228] dark:text-[#8BA888] cursor-pointer hover:bg-[#EAF0E8] transition-colors">
                <span className="material-symbols-outlined text-base align-middle mr-1">upload</span>
                <span>Tải ảnh đại diện từ máy tính</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomAvatarFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ================= ONE-TIME IDENTITY LOCK CONFIRMATION MODAL ================= */}
      {showLockConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--bg-card)] border-2 border-amber-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 text-left">
            <div className="flex items-center gap-3 border-b border-[#E5E2D9] dark:border-[#3A4738] pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="font-serif italic font-bold text-base text-amber-900 dark:text-amber-300">
                  Xác nhận Khóa Danh Tính (Chỉ Lưu 1 Lần Duy Nhất)
                </h3>
                <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                  Quy chuẩn bắt buộc để bảo vệ uy tín học đường và chống mạo danh
                </p>
              </div>
            </div>

            {/* Strict Format & Punishment Warning Box */}
            <div className="p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                <span className="material-symbols-outlined text-sm">gavel</span>
                <span>CẢNH BÁO QUY CHUẨN VÀ ĐỊNH DẠNG</span>
              </div>
              <p className="text-xs text-rose-900/90 dark:text-rose-200/90 leading-relaxed font-medium">
                Chỉ được lưu <strong>MỘT LẦN DUY NHẤT</strong>. Bạn hãy chắc chắn rằng bạn đã ghi <strong>đúng format</strong>. Nếu không, tài khoản có thể bị <strong>đổi tên tự động hoặc bị xóa vĩnh viễn</strong> khỏi hệ thống trường học!
              </p>
              <div className="text-[11px] text-rose-800 dark:text-rose-300 space-y-1 pt-1 border-t border-rose-500/20">
                <p>• <strong>Họ tên:</strong> Phải là họ tên thật chính xác theo giấy tờ.</p>
                <p>• <strong>Chuyên ngành / Lớp:</strong> Ghi rõ chuyên hoặc lớp gốc (VD: <em>Chuyên Tin, Chuyên Toán, Lớp A1, CNTT</em>), không ghi Lớp 10/11/12.</p>
                <p>• <strong>Niên khóa:</strong> Ghi rõ khóa (VD: <em>K21-24, K22 (2022-2026), Khóa 2021-2024</em>).</p>
              </div>
            </div>

            {/* Preview of credentials to be locked */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#5A6D58] dark:text-[#8E9B8A]">
                Thông tin sẽ được khóa vĩnh viễn:
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E271D] border border-[#C8D2C4] dark:border-[#3A4738] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Họ và tên thật:</span>
                  <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">{manualFullName.trim()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Chuyên ngành / Lớp gốc:</span>
                  <span className="font-bold text-[#2A4228] dark:text-[#8BA888]">{manualMajor.trim()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Khóa / Niên khóa:</span>
                  <span className="font-bold text-[#2A4228] dark:text-[#8BA888]">{manualCohort.trim()}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#E5E2D9] dark:border-[#3A4738]">
                  <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Trường áp dụng:</span>
                  <span className="font-bold text-[#182217] dark:text-[#E8ECE6] truncate max-w-[200px]">{userState.selectedSchool?.name || 'Trường học của bạn'}</span>
                </div>
              </div>
            </div>

            {/* Mandatory Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#2A4228]/5 dark:bg-[#151C14] border border-[#2A4228]/20 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lockCommitAgreed}
                onChange={(e) => setLockCommitAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#2A4228] focus:ring-[#2A4228] accent-[#2A4228]"
              />
              <span className="text-xs text-[#182217] dark:text-[#E8ECE6] leading-snug">
                Tôi cam kết thông tin trên là chính xác theo đúng format và đồng ý <strong>khóa danh tính vĩnh viễn</strong> (không thể chỉnh sửa sau khi lưu).
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E2D9] dark:border-[#3A4738]">
              <button
                type="button"
                onClick={() => setShowLockConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                disabled={!lockCommitAgreed}
                onClick={handleConfirmPermanentLock}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all ${
                  lockCommitAgreed
                    ? 'bg-[#2A4228] hover:bg-[#1E301D] active:scale-95'
                    : 'bg-neutral-400 cursor-not-allowed opacity-60'
                }`}
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Xác nhận & Khóa Vĩnh Viễn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Mode Selector Card */}
      {setUserState && (
        <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-serif italic font-bold text-base text-[#182217] dark:text-[#E8ECE6] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2A4228] dark:text-[#8BA888]">manage_accounts</span>
              <span>Chế độ vai trò hoạt động</span>
            </h2>
            <span className="text-[10px] bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888] px-2.5 py-0.5 rounded-full font-bold">
              {userState.userRole === 'mentor' ? '🎓 Mentor / Chuyên gia' : userState.userRole === 'admin_moderator' ? '🛡️ Kiểm duyệt AI' : userState.userRole === 'peer_listener' ? '🎧 Người lắng nghe' : '🎒 Học sinh'}
            </span>
          </div>

          <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A]">
            Bạn có thể chuyển đổi linh hoạt vai trò trải nghiệm trong ứng dụng:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                setUserState(prev => ({ ...prev, userRole: 'student' }));
                if (setActiveTab) setActiveTab('feed');
              }}
              className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all flex flex-col gap-1 ${
                userState.userRole === 'student'
                  ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-sm'
                  : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#182217] dark:text-[#E8ECE6] border-[#E5E2D9] dark:border-[#3A4738] hover:border-[#8BA888]'
              }`}
            >
              <span>🎒 Học sinh / Thành viên</span>
              <span className="text-[10px] opacity-80 font-normal">Gửi bài & nhận tham vấn</span>
            </button>

            <button
              onClick={() => {
                setUserState(prev => ({ ...prev, userRole: 'peer_listener' }));
                if (setActiveTab) setActiveTab('messages');
              }}
              className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all flex flex-col gap-1 ${
                userState.userRole === 'peer_listener'
                  ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-sm'
                  : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#182217] dark:text-[#E8ECE6] border-[#E5E2D9] dark:border-[#3A4738] hover:border-[#8BA888]'
              }`}
            >
              <span>🎧 Người lắng nghe</span>
              <span className="text-[10px] opacity-80 font-normal">Trò chuyện 1-1 ẩn danh</span>
            </button>

            <button
              onClick={() => {
                setUserState(prev => ({ ...prev, userRole: 'mentor' }));
                if (setActiveTab) setActiveTab('mentor_dashboard');
              }}
              className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all flex flex-col gap-1 ${
                userState.userRole === 'mentor'
                  ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-sm'
                  : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#182217] dark:text-[#E8ECE6] border-[#E5E2D9] dark:border-[#3A4738] hover:border-[#8BA888]'
              }`}
            >
              <span>🎓 Mentor / Chuyên gia</span>
              <span className="text-[10px] opacity-80 font-normal">Bảng điều khiển tư vấn</span>
            </button>

            <button
              onClick={() => {
                setUserState(prev => ({ ...prev, userRole: 'admin_moderator' }));
                if (setActiveTab) setActiveTab('moderation_queue');
              }}
              className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all flex flex-col gap-1 ${
                userState.userRole === 'admin_moderator'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#182217] dark:text-[#E8ECE6] border-[#E5E2D9] dark:border-[#3A4738] hover:border-rose-400'
              }`}
            >
              <span>🛡️ Kiểm duyệt AI</span>
              <span className="text-[10px] opacity-80 font-normal">Xem xét cảnh báo & duyệt</span>
            </button>
          </div>
        </div>
      )}

      {/* Saved Posts List Section */}
      <div className="space-y-4">
        <h2 className="font-serif italic font-bold text-lg text-[#182217] dark:text-[#E8ECE6] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2A4228] dark:text-[#8BA888]">bookmark</span>
          <span>Lá thư đã lưu ({savedPosts.length})</span>
        </h2>

        {savedPosts.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl p-6 text-center text-[#5A6D58] dark:text-[#8E9B8A] text-xs">
            Bạn chưa lưu lá thư nào. Hãy nhấn biểu tượng bookmark trên các bài viết để lưu trữ.
          </div>
        ) : (
          savedPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => onSelectPost(post)}
              onToggleLike={onToggleLike}
              onToggleHug={onToggleHug}
              onToggleSave={onToggleSave}
              onSharePost={onSharePost}
              onConnectWithAuthor={onConnectWithAuthor ? (p, e) => onConnectWithAuthor(p) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
};
