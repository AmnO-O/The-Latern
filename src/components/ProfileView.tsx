import React, { useState } from 'react';
import { 
  BadgeCheck, 
  Lock, 
  HeartHandshake, 
  Sparkles, 
  Trophy, 
  GraduationCap, 
  ShieldCheck, 
  User, 
  Camera, 
  Check, 
  RefreshCw,
  IdCard,
  FileEdit,
  Save,
  Building,
  Edit,
  X,
  Upload,
  AlertTriangle,
  Gavel,
  UserCog,
  Bookmark
} from 'lucide-react';
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
  onOpenPeerMentorModal?: () => void;
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
  onOpenPeerMentorModal,
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

  // Manual Identity Input State & Per-School Editing States
  const [manualFullName, setManualFullName] = useState(
    userState.verifiedFullName || userState.displayName || userState.googleUser?.displayName || ''
  );
  
  // State for editing per-school major and cohort
  const [schoolFormStates, setSchoolFormStates] = useState<{
    [schoolId: string]: { major: string; cohort: string };
  }>({});

  const [activeTargetSchoolForLock, setActiveTargetSchoolForLock] = useState<{
    id: string;
    name: string;
    type?: string;
    major: string;
    cohort: string;
  } | null>(null);

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
  const effectiveDisplayName = userState.verifiedFullName || userState.displayName || userState.googleUser?.displayName || `Người dùng #${userState.userAnonNumber}`;
  const effectiveCohort = userState.defaultCohort || 'Sinh viên K22';

  const showSaveNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleUpdateDisplayName = (name: string) => {
    if (!setUserState || userState.isIdentityLocked) return;
    setUserState(prev => {
      const updated = { ...prev, displayName: name, verifiedFullName: name };
      try {
        localStorage.setItem('lantern_user_state', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdateAvatar = (url: string) => {
    if (!setUserState) return;
    setUserState(prev => {
      const updated = { ...prev, customAvatarUrl: url };
      try {
        localStorage.setItem('lantern_user_state', JSON.stringify(updated));
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

  const handleUpdateSchoolFormField = (schoolId: string, field: 'major' | 'cohort', value: string) => {
    setSchoolFormStates(prev => {
      const current = prev[schoolId] || {
        major: userState.schoolVerifications?.[schoolId]?.major || userState.verifiedMajor || 'Chuyên Tin',
        cohort: userState.schoolVerifications?.[schoolId]?.cohort || userState.schoolCohorts?.[schoolId] || userState.verifiedCohort || 'K21-24'
      };
      return {
        ...prev,
        [schoolId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  // Initiate locking identity for a specific school
  const handleInitiateLockForSchool = (school: { id: string; name: string; type?: string }, initialMajor?: string, initialCohort?: string) => {
    setLockValidationError(null);
    const unifiedName = userState.isIdentityLocked
      ? (userState.verifiedFullName || userState.displayName || '')
      : manualFullName.trim();

    if (!unifiedName) {
      setLockValidationError('Vui lòng nhập đầy đủ Họ và tên thật thống nhất của bạn.');
      return;
    }

    const currentMajor = (schoolFormStates[school.id]?.major || initialMajor || userState.schoolVerifications?.[school.id]?.major || userState.verifiedMajor || (school.type === 'university' ? 'Công nghệ thông tin' : 'Chuyên Tin')).trim();
    const currentCohort = (schoolFormStates[school.id]?.cohort || initialCohort || userState.schoolVerifications?.[school.id]?.cohort || userState.schoolCohorts?.[school.id] || userState.verifiedCohort || 'K21-24').trim();

    if (!currentMajor) {
      setLockValidationError(`Vui lòng nhập Chuyên ngành hoặc Lớp gốc cho trường ${school.name}.`);
      return;
    }
    if (!currentCohort) {
      setLockValidationError(`Vui lòng nhập Niên khóa cho trường ${school.name}.`);
      return;
    }

    setActiveTargetSchoolForLock({
      id: school.id,
      name: school.name,
      type: school.type,
      major: currentMajor,
      cohort: currentCohort
    });
    setLockCommitAgreed(false);
    setShowLockConfirmModal(true);
  };

  const handleConfirmPermanentLock = () => {
    if (!lockCommitAgreed || !setUserState || !activeTargetSchoolForLock) return;

    const trimmedName = (userState.isIdentityLocked ? (userState.verifiedFullName || userState.displayName || '') : manualFullName).trim();
    const targetSchool = activeTargetSchoolForLock;

    setUserState(prev => {
      const updatedSchoolVerifications = { ...(prev.schoolVerifications || {}) };
      updatedSchoolVerifications[targetSchool.id] = {
        schoolId: targetSchool.id,
        schoolName: targetSchool.name,
        schoolType: targetSchool.type as any || 'highschool',
        verifiedAt: updatedSchoolVerifications[targetSchool.id]?.verifiedAt || Date.now(),
        method: updatedSchoolVerifications[targetSchool.id]?.method || 'gemini_ocr',
        role: 'student',
        studentName: trimmedName,
        major: targetSchool.major,
        cohort: targetSchool.cohort,
        isIdentityLocked: true
      };

      const updatedCohorts = {
        ...(prev.schoolCohorts || {}),
        [targetSchool.id]: targetSchool.cohort
      };

      // Ensure target school is in verifiedSchools
      let updatedVerifiedSchools = [...(prev.verifiedSchools || [])];
      if (!updatedVerifiedSchools.some(s => s.id === targetSchool.id)) {
        updatedVerifiedSchools.push({
          id: targetSchool.id,
          name: targetSchool.name,
          slug: targetSchool.id,
          type: (targetSchool.type as any) || 'highschool',
          location: 'Việt Nam',
          studentCount: 1500,
          lanternCount: 1,
          isVerified: true
        });
      }

      const updatedState: UserState = {
        ...prev,
        displayName: trimmedName,
        verifiedFullName: trimmedName,
        verifiedMajor: targetSchool.major,
        verifiedCohort: targetSchool.cohort,
        defaultCohort: targetSchool.cohort,
        schoolCohorts: updatedCohorts,
        schoolVerifications: updatedSchoolVerifications,
        verifiedSchools: updatedVerifiedSchools,
        isIdentityLocked: true,
        verificationStatus: 'verified'
      };

      try {
        localStorage.setItem('lantern_user_state', JSON.stringify(updatedState));
      } catch (e) {}

      return updatedState;
    });

    setShowLockConfirmModal(false);
    setActiveTargetSchoolForLock(null);
    showSaveNotification(`🔒 Danh tính trường ${targetSchool.name} đã được khóa vĩnh viễn thành công!`);
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
        localStorage.setItem('lantern_user_state', JSON.stringify(updated));
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
        localStorage.setItem('lantern_user_state', JSON.stringify(updated));
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

        {/* Default Posting Mode Toggle Pills (Chỉ hiển thị khi đã đăng nhập) */}
        {isLoggedInWithGmail && (
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
        )}

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

      {/* Peer Mentor / Listener Card */}
      <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif italic font-bold text-base text-[#182217] dark:text-[#E8ECE6]">
                  Người Lắng Nghe Đồng Hành (Peer Mentor)
                </h3>
                {userState.isPeerMentor && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    Đã Kích Hoạt
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A]">
                Đồng hành, lắng nghe và giải tỏa rào cản tâm lý học đường & khoảng cách thế hệ gia đình
              </p>
            </div>
          </div>
        </div>

        {userState.isPeerMentor ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Huy hiệu Người Lắng Nghe Đồng Hành Đang Hoạt Động</span>
            </div>
            <p className="text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
              Bạn có quyền gửi lời an ủi và hồi âm cho các lá thư trong <strong>Hộp Thư Tư Vấn</strong> của trường. Cảm ơn sự tận tâm và thấu cảm của bạn đối với cộng đồng sinh viên!
            </p>
          </div>
        ) : userState.peerMentorApplication && userState.peerMentorApplication.status === 'pending' ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
              <span>⏳ Đơn ứng tuyển Peer Mentor đang được xem xét</span>
            </div>
            <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
              Ban điều phối và cố vấn trường đang xem xét kinh nghiệm và thông điệp của bạn. Bạn sẽ nhận được thông báo khi được phê duyệt.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] leading-relaxed">
              Bạn là sinh viên nhiệt huyết, thấu hiểu và muốn giúp đỡ các bạn đồng trang lứa vượt qua áp lực gia đình hay rào cản tâm lý? Hãy gia nhập đội ngũ Peer Mentor!
            </p>
            {onOpenPeerMentorModal && (
              <button
                type="button"
                onClick={onOpenPeerMentorModal}
                className="px-4 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shrink-0 shadow-sm flex items-center gap-2 active:scale-95 transition-all w-full sm:w-auto justify-center"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Đăng ký Peer Mentor</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ================= PUBLIC IDENTITY SETTINGS PANEL (CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP GMAIL) ================= */}
      {isLoggedInWithGmail && (
        <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E2D9] dark:border-[#3A4738] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] flex items-center justify-center">
                <IdCard className="w-4 h-4" />
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

          {/* Identity Status Notice for Logged-In Users (only shown when locked) */}
          {userState.isIdentityLocked && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                  <span>Danh tính Học đường Đã Khóa Chống Sửa Đổi 🔒</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-600/20 font-extrabold uppercase">Đã Khóa</span>
                </div>
                <p className="text-[11px] text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                  Họ tên thật của bạn là thống nhất trên toàn hệ thống. Chuyên ngành và niên khóa được lưu tương ứng theo từng trường học mà bạn xác thực. Bạn có thể tự do đổi Avatar hoặc chuyển sang chế độ <strong>Ẩn danh 100%</strong> bất cứ lúc nào.
                </p>
              </div>
            </div>
          )}

          {/* Global Unified Real Full Name Card */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E271D] border border-[#C8D2C4] dark:border-[#3A4738] text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A]">
                Họ và tên thật (Dùng cho Sảnh Chung & Thống nhất toàn hệ thống)
              </label>
              {userState.isIdentityLocked ? (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <span>🔒 Đã khóa vĩnh viễn</span>
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                  Hiển thị tại Sảnh Chung & Mọi trường
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
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
                      : 'bg-white dark:bg-[#151C14] border-[#C8D2C4] dark:border-[#3A4738] text-[#182217] dark:text-[#E8ECE6] focus:outline-none focus:border-[#2A4228]'
                  }`}
                />
                {userState.isIdentityLocked && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-600 dark:text-emerald-400" title="Đã khóa chống sửa đổi">
                    ✓
                  </span>
                )}
              </div>

              {!userState.isIdentityLocked && (
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = manualFullName.trim();
                    if (!trimmed) return;
                    handleUpdateDisplayName(trimmed);
                    showSaveNotification('Đã lưu Họ và tên thật thành công!');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#2A4228] hover:bg-[#1E301D] text-white text-xs font-bold shrink-0 shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Tên Thật</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] italic">
              *Tại <strong>Sảnh Chung Toàn Quốc</strong>, bài viết công khai sẽ chỉ hiển thị Họ tên thật & Avatar này (không gắn niên khóa trường cụ thể).
            </p>
          </div>

          {/* Per-School Identities List & Card Manager */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#2A4228] dark:text-[#8BA888] font-bold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Danh tính theo từng trường học đã tham gia</span>
              </span>
              <button
                type="button"
                onClick={onOpenVerify}
                className="text-[10px] font-bold text-[#2A4228] dark:text-[#8BA888] hover:underline flex items-center gap-1"
              >
                <span>+ Quét Thẻ AI / Xác thực thêm trường</span>
              </button>
            </div>

            {/* Render School Cards (Exclude Sảnh Chung / Global Lounge) */}
            {(() => {
              const rawSchools = (userState.verifiedSchools && userState.verifiedSchools.length > 0)
                ? userState.verifiedSchools
                : (userState.selectedSchool ? [userState.selectedSchool] : []);

              const displaySchools = rawSchools.filter(
                sch => sch.id !== 'all-schools' && sch.id !== 'all' && !sch.slug?.includes('sanh-chung') && !sch.name?.includes('Sảnh Chung')
              );

              if (displaySchools.length === 0) {
                return (
                  <div className="p-4 rounded-2xl border border-dashed border-[#C8D2C4] dark:border-[#3A4738] text-center space-y-2">
                    <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A]">
                      Bạn chưa xác thực thẻ trường học nào. Hãy xác thực để nhận huy hiệu trường học chính thức và mở khóa Hộp thư trường!
                    </p>
                    <button
                      type="button"
                      onClick={onOpenVerify}
                      className="px-4 py-1.5 rounded-full bg-[#2A4228] hover:bg-[#385036] text-white text-xs font-bold shadow-sm"
                    >
                      Xác thực ngay bằng Thẻ AI / Email .edu.vn
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {displaySchools.map(sch => {
                    const record = userState.schoolVerifications?.[sch.id];
                    const isSchoolLocked = !!record?.isIdentityLocked;
                    const schoolMajor = schoolFormStates[sch.id]?.major ?? (record?.major || userState.verifiedMajor || (sch.type === 'university' ? 'Công nghệ thông tin' : 'Chuyên Tin'));
                    const schoolCohort = schoolFormStates[sch.id]?.cohort ?? (record?.cohort || userState.schoolCohorts?.[sch.id] || userState.verifiedCohort || (sch.type === 'university' ? 'K22 (2022-2026)' : 'K21-24'));
                    const studentName = userState.isIdentityLocked ? (userState.verifiedFullName || userState.displayName || '') : manualFullName;

                    return (
                      <div
                        key={sch.id}
                        className={`p-4 rounded-2xl border transition-all text-left space-y-3 ${
                          isSchoolLocked
                            ? 'bg-[#FAF9F6] dark:bg-[#1E271D] border-emerald-500/30'
                            : 'bg-white dark:bg-[#151C14] border-[#C8D2C4] dark:border-[#3A4738]'
                        }`}
                      >
                        {/* School Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                              isSchoolLocked ? 'bg-[#2A4228] text-white' : 'bg-amber-600 text-white'
                            }`}>
                              {sch.type === 'university' ? (
                                <GraduationCap className="w-5 h-5" />
                              ) : (
                                <Building className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] truncate">
                                  {sch.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 font-bold uppercase shrink-0">
                                  {sch.type === 'university' ? 'Đại học' : 'THPT'}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">
                                {sch.location || 'Việt Nam'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSchoolLocked ? (
                              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center gap-1 border border-emerald-500/30">
                                <Lock className="w-3 h-3" />
                                <span>Đã Khóa AI</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1 border border-amber-500/30">
                                <Edit className="w-3 h-3" />
                                <span>Chưa Khóa</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Per-School Major & Cohort Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* School Major */}
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#5A6D58] dark:text-[#8E9B8A] mb-1">
                              Chuyên ngành / Lớp gốc ({sch.type === 'university' ? 'Ngành học' : 'Khối/Chuyên'})
                            </label>
                            <input
                              type="text"
                              value={schoolMajor}
                              readOnly={isSchoolLocked}
                              disabled={isSchoolLocked}
                              onChange={(e) => handleUpdateSchoolFormField(sch.id, 'major', e.target.value)}
                              placeholder={sch.type === 'university' ? 'VD: Khoa học Máy tính, Marketing...' : 'VD: Chuyên Tin, Lớp 12A1...'}
                              className={`w-full rounded-xl p-2.5 text-xs font-bold border ${
                                isSchoolLocked
                                  ? 'bg-[#2A4228]/5 dark:bg-[#1C241B] border-[#8BA888]/40 text-[#2A4228] dark:text-[#8BA888] cursor-not-allowed select-all'
                                  : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#C8D2C4] dark:border-[#3A4738] text-[#2A4228] dark:text-[#8BA888] focus:outline-none focus:border-[#2A4228]'
                              }`}
                            />
                          </div>

                          {/* School Cohort */}
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#5A6D58] dark:text-[#8E9B8A] mb-1">
                              Khóa / Niên khóa tại trường
                            </label>
                            <input
                              type="text"
                              value={schoolCohort}
                              readOnly={isSchoolLocked}
                              disabled={isSchoolLocked}
                              onChange={(e) => handleUpdateSchoolFormField(sch.id, 'cohort', e.target.value)}
                              placeholder="VD: K21-24, K22 (2022-2026)..."
                              className={`w-full rounded-xl p-2.5 text-xs font-bold border ${
                                isSchoolLocked
                                  ? 'bg-[#2A4228]/5 dark:bg-[#1C241B] border-[#8BA888]/40 text-[#2A4228] dark:text-[#8BA888] cursor-not-allowed select-all'
                                  : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#C8D2C4] dark:border-[#3A4738] text-[#2A4228] dark:text-[#8BA888] focus:outline-none focus:border-[#2A4228]'
                              }`}
                            />
                          </div>
                        </div>

                        {/* If NOT locked for this school: Action Button */}
                        {!isSchoolLocked && (
                          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#E5E2D9] dark:border-[#3A4738]">
                            <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                              Lưu 1 lần duy nhất để chống giả mạo danh tính trong trường này.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleInitiateLockForSchool(sch, schoolMajor, schoolCohort)}
                              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-[#2A4228] hover:bg-[#1E301D] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Khóa Danh Tính Cho Trường Này 🔒</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
                <X className="w-5 h-5" />
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
                <Upload className="w-4 h-4 inline mr-1" />
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
                <AlertTriangle className="w-6 h-6" />
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
                <Gavel className="w-4 h-4" />
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
                  <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Họ và tên thật (Thống nhất):</span>
                  <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">
                    {(userState.isIdentityLocked ? (userState.verifiedFullName || userState.displayName || '') : manualFullName).trim()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Trường áp dụng:</span>
                  <span className="font-bold text-[#182217] dark:text-[#E8ECE6] truncate max-w-[200px]">
                    {activeTargetSchoolForLock?.name || userState.selectedSchool?.name || 'Trường học của bạn'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Chuyên ngành / Lớp gốc:</span>
                  <span className="font-bold text-[#2A4228] dark:text-[#8BA888]">
                    {activeTargetSchoolForLock?.major || 'Chuyên Tin'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Khóa / Niên khóa:</span>
                  <span className="font-bold text-[#2A4228] dark:text-[#8BA888]">
                    {activeTargetSchoolForLock?.cohort || 'K21-24'}
                  </span>
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
                <Lock className="w-3.5 h-3.5" />
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
              <UserCog className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
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
          <Bookmark className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888]" />
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
