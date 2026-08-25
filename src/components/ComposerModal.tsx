import React, { useState, useEffect } from 'react';
import { School, UserState } from '../types';
import { AVATAR_PRESETS, getEffectiveAvatar } from '../data/avatarPresets';
import { 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  Image as ImageIcon, 
  School as SchoolIcon,
  FileEdit,
  X,
  ShieldAlert,
  Users,
  Lock,
  Shuffle,
  Globe,
  Clock,
  UserCog,
  ScanLine,
  CheckCircle2,
  GraduationCap,
  ImagePlus,
  Hourglass,
  Infinity as InfinityIcon,
  Zap,
  Send,
  HeartHandshake,
  MessageSquareHeart
} from 'lucide-react';

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools: School[];
  defaultSchool?: School;
  isLoggedIn?: boolean;
  userState?: UserState;
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
  onOpenVerify?: () => void;
  onSubmitPost: (postData: {
    title: string;
    content: string;
    schoolId: string;
    schoolName: string;
    schoolSlug: string;
    tags: string[];
    authorAnonId?: string;
    authorClassBadge?: string;
    isPublic?: boolean;
    isCounselingMailbox?: boolean;
    counselorReplyOnly?: boolean;
    imageUrl?: string;
    imageAnalysis?: any;
    expiryDurationDays?: number;
    isAnonymousGuest?: boolean;
    isIdentityPublic?: boolean;
    authorDisplayName?: string;
    authorAvatarUrl?: string;
    authorCohort?: string;
    authorMajor?: string;
  }) => Promise<{ isSafe: boolean; flagReason?: string; suggestion?: string; crisisDetected?: boolean }>;
}

const PERSONA_NICKNAMES = [
  'Người dùng ẩn danh',
  'Mèo Mắt Tròn',
  'Cú Đêm Học Bài',
  'Ngọn Nến Nhỏ',
  'Lá Phong Mùa Thu',
  'Đom Đóm Đêm',
  'Mầm Xanh Hy Vọng',
  'Cơn Mưa Rào',
  'Gió Mùa Thu',
  'Bạn Đồng Môn',
  'Hoa Hướng Dương'
];

export const ComposerModal: React.FC<ComposerModalProps> = ({
  isOpen,
  onClose,
  schools,
  defaultSchool,
  isLoggedIn = false,
  userState,
  onOpenLogin,
  onOpenProfile,
  onOpenVerify,
  onSubmitPost
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    defaultSchool?.id || userState?.selectedSchool?.id || schools[0]?.id || 'all-schools'
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Áp lực học tập']);
  const [classBadge, setClassBadge] = useState('Học sinh 12');
  const [postScope, setPostScope] = useState<'public' | 'campus' | 'counseling_mailbox'>('public');
  const isPublic = postScope === 'public';
  const isCounselingMailbox = postScope === 'counseling_mailbox';
  
  // User login status check
  const isUserLoggedIn = Boolean(isLoggedIn || userState?.isLoggedIn || userState?.googleUser?.email);

  // Identity Posting Mode: 'anonymous' vs 'identity'
  const [postingMode, setPostingMode] = useState<'anonymous' | 'identity'>(() => {
    if (!isUserLoggedIn) return 'anonymous';
    return userState?.activePostingMode || 'anonymous';
  });

  // Expiry duration state (in days, 0 = permanent) - non-logged in users default to 14 days, logged in can default to 0
  const [expiryDays, setExpiryDays] = useState<number>(() => {
    if (!isUserLoggedIn) return 14;
    return 0;
  });

  // Reset or enforce anonymous posting mode & valid expiry when modal opens or user login state changes
  useEffect(() => {
    if (isOpen) {
      if (!isUserLoggedIn) {
        setPostingMode('anonymous');
        setExpiryDays(prev => (prev === 0 ? 14 : prev));
      } else {
        setPostingMode(userState?.activePostingMode || 'anonymous');
      }
    }
  }, [isOpen, isUserLoggedIn, userState?.activePostingMode]);

  // Per-School Verification & Identity Info
  const currentSchoolObj = schools.find(s => s.id === selectedSchoolId) || defaultSchool;
  const isCurrentSchoolGlobalLounge = Boolean(
    selectedSchoolId === 'all-schools' ||
    selectedSchoolId === 'all' ||
    currentSchoolObj?.slug === 'sanh-chung-public' ||
    currentSchoolObj?.name?.includes('Sảnh Chung')
  );
  const currentVerification = userState?.schoolVerifications?.[selectedSchoolId];
  const isSchoolVerified = !!currentVerification;
  const isLocked = !!(userState?.isIdentityLocked || currentVerification?.isIdentityLocked || (userState?.verificationStatus === 'verified' && userState?.verifiedFullName));
  
  // Real Name is unified across all schools
  const unifiedRealName = userState?.verifiedFullName || userState?.displayName || userState?.googleUser?.displayName || 'Học sinh / Sinh viên';
  const [displayName, setDisplayName] = useState(unifiedRealName);
  const [avatarUrl, setAvatarUrl] = useState(getEffectiveAvatar(userState?.customAvatarUrl, userState?.googleUser?.photoURL));
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Per-school major & cohort
  const schoolMajor = currentVerification?.major || userState?.verifiedMajor || (currentSchoolObj?.type === 'university' ? 'Công nghệ thông tin' : 'Chuyên Tin');
  const initialCohort = currentVerification?.cohort || 
    userState?.schoolCohorts?.[selectedSchoolId] || 
    userState?.verifiedCohort || 
    userState?.defaultCohort || 
    (currentSchoolObj?.type === 'university' ? 'Sinh viên K22' : 'Lớp 12 / K23-26');
  
  const [cohortInput, setCohortInput] = useState(initialCohort);

  // Update major & cohort when selected school changes
  useEffect(() => {
    if (userState?.schoolVerifications?.[selectedSchoolId]?.cohort) {
      setCohortInput(userState.schoolVerifications[selectedSchoolId].cohort!);
    } else if (userState?.schoolCohorts?.[selectedSchoolId]) {
      setCohortInput(userState.schoolCohorts[selectedSchoolId]);
    } else if (userState?.verifiedCohort) {
      setCohortInput(userState.verifiedCohort);
    } else if (userState?.defaultCohort) {
      setCohortInput(userState.defaultCohort);
    }
  }, [selectedSchoolId, userState]);

  useEffect(() => {
    if (unifiedRealName) {
      setDisplayName(unifiedRealName);
    }
  }, [unifiedRealName]);

  // Per-post dynamic anonymous identity state
  const [anonNumber, setAnonNumber] = useState(() => Math.floor(100 + Math.random() * 899));
  const [personaPrefix, setPersonaPrefix] = useState('Người dùng ẩn danh');
  const [identityStyle, setIdentityStyle] = useState<'number_only' | 'persona' | 'school_scoped'>('number_only');

  const getComputedAnonId = () => {
    if (identityStyle === 'number_only') {
      return `#${anonNumber}`;
    }
    if (identityStyle === 'persona') {
      return `${personaPrefix} #${anonNumber}`;
    }
    const schoolObj = schools.find(s => s.id === selectedSchoolId) || defaultSchool;
    const schoolName = schoolObj?.name || 'Sảnh Chung';
    const shortName = schoolName.includes('(') ? schoolName.split('(')[1].replace(')', '') : schoolName;
    return `Thành viên ${shortName} #${anonNumber}`;
  };

  const handleShuffleIdentity = () => {
    setAnonNumber(Math.floor(100 + Math.random() * 899));
    const randomPersona = PERSONA_NICKNAMES[Math.floor(Math.random() * PERSONA_NICKNAMES.length)];
    setPersonaPrefix(randomPersona);
  };
  
  // Image Upload & AI Analysis state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationFeedback, setModerationFeedback] = useState<{
    flagReason?: string;
    suggestion?: string;
    crisisDetected?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const availableTags = [
    'Áp lực học tập',
    'Gia đình',
    'Tình cảm tuổi trẻ',
    'Định hướng tương lai',
    'Sự ấm áp',
    'Khúc mắc bạn bè'
  ];

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      setImagePreview(base64Str);
      setIsAnalyzingImage(true);

      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Str,
            mimeType: file.type || 'image/jpeg',
            promptType: 'letter_attachment'
          })
        });
        const data = await response.json();
        setImageAnalysisResult(data);
      } catch (err) {
        console.error('Image analysis error:', err);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter(t => t !== tag));
      }
    } else {
      if (selectedTags.length < 3) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const schoolObj = schools.find(s => s.id === selectedSchoolId) || defaultSchool || schools[0];
    const isGlobalLounge = schoolObj.id === 'all-schools' || schoolObj.id === 'all' || schoolObj.slug === 'sanh-chung-public' || schoolObj.name.includes('Sảnh Chung');
    const isIdentityPublic = postingMode === 'identity';

    setIsSubmitting(true);
    setModerationFeedback(null);

    const currentMajor = userState?.schoolVerifications?.[schoolObj.id]?.major || userState?.verifiedMajor;

    // In a specific school, require locking school identity to prevent impersonation. In Sảnh Chung, real name is sufficient!
    if (isIdentityPublic && !isGlobalLounge && !isLocked) {
      setIsSubmitting(false);
      setModerationFeedback({
        flagReason: 'Bạn cần khóa danh tính học đường cho trường này trước khi đăng bài ở chế độ Danh tính chính để bảo đảm tính chuẩn xác và chống giả mạo trong trường.',
        suggestion: 'Hãy nhấn vào Cài đặt Hồ sơ để Khóa danh tính (1 lần duy nhất) hoặc Quét Thẻ AI.'
      });
      return;
    }

    const result = await onSubmitPost({
      title: title.trim(),
      content: content.trim(),
      schoolId: schoolObj.id,
      schoolName: schoolObj.name,
      schoolSlug: schoolObj.slug,
      tags: selectedTags,
      authorAnonId: (!isCounselingMailbox && isIdentityPublic) ? (unifiedRealName || displayName.trim()) : getComputedAnonId(),
      authorClassBadge: (!isCounselingMailbox && !isIdentityPublic && classBadge !== 'Ẩn hoàn toàn') ? classBadge : undefined,
      isPublic,
      isCounselingMailbox,
      counselorReplyOnly: isCounselingMailbox,
      imageUrl: imagePreview || undefined,
      imageAnalysis: imageAnalysisResult || undefined,
      expiryDurationDays: !isUserLoggedIn && expiryDays === 0 ? 14 : expiryDays,
      isAnonymousGuest: !isUserLoggedIn,
      isIdentityPublic: (isUserLoggedIn && !isCounselingMailbox) ? isIdentityPublic : false,
      authorDisplayName: (!isCounselingMailbox && isIdentityPublic) ? (unifiedRealName || displayName.trim()) : undefined,
      authorAvatarUrl: (!isCounselingMailbox && isIdentityPublic) ? avatarUrl : undefined,
      authorCohort: (!isCounselingMailbox && isIdentityPublic && !isGlobalLounge) ? (cohortInput.trim() || initialCohort) : undefined,
      authorMajor: (!isCounselingMailbox && isIdentityPublic && !isGlobalLounge) ? (schoolMajor || currentMajor || undefined) : undefined
    });

    setIsSubmitting(false);

    if (!result.isSafe) {
      setModerationFeedback({
        flagReason: result.flagReason || 'Nội dung có thể gây tổn thương hoặc chưa tuân thủ quy tắc văn minh.',
        suggestion: result.suggestion || 'Hãy sửa đổi bằng lời lẽ ôn hòa hơn.',
        crisisDetected: result.crisisDetected
      });
    } else {
      // Success, reset & close
      setTitle('');
      setContent('');
      setImagePreview(null);
      setImageAnalysisResult(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Accent Glow */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#2A4228] via-[#8BA888] to-[#2A4228]"></div>

        <div className="flex items-center justify-between pb-4 border-b border-[#E5E2D9] dark:border-[#3A4738] mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888] flex items-center justify-center border border-[#8BA888]/30">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif italic font-bold text-lg text-[#182217] dark:text-[#E8ECE6] leading-tight">
                Viết tâm thư học đường
              </h2>
              <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                Linh hoạt giữa tâm sự ẩn danh kín đáo và kết nối bằng danh tính thật
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A4A095] hover:text-[#3A4036] dark:hover:text-[#E8ECE6] hover:bg-[#FAF9F6] dark:hover:bg-[#20281F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Moderation Feedback Alert Banner */}
        {moderationFeedback && (
          <div className="mb-3 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 space-y-2 animate-bounce-short">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <span>AI Nhắc nhở văn minh & an toàn</span>
            </div>
            <p className="leading-relaxed">{moderationFeedback.flagReason}</p>
            {moderationFeedback.suggestion && (
              <p className="text-[11px] italic opacity-80">💡 Gợi ý: {moderationFeedback.suggestion}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* ================= IDENTITY & ANONYMITY MODE TOGGLE ================= */}
          <div className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E271D] border border-[#C8D2C4] dark:border-[#3A4738] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#2A4228] dark:text-[#8BA888] flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Chế độ xuất hiện của tác giả</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {postingMode === 'anonymous' ? '🎭 Ẩn danh tuyệt đối' : '👤 Hiện danh tính & Niên khóa'}
              </span>
            </div>

            {/* Persona Segmented Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPostingMode('anonymous')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all text-left ${
                  postingMode === 'anonymous'
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                    : 'bg-white dark:bg-[#151C14] border-[#DCE4D8] dark:border-[#3A4738] text-[#5A6D58] dark:text-[#8E9B8A]'
                }`}
              >
                <span className="text-base">🎭</span>
                <div>
                  <div className="font-bold">Đăng Ẩn Danh</div>
                  <div className="text-[9px] opacity-85 font-normal">Ẩn tên, avatar & niên khóa</div>
                </div>
              </button>

              <button
                type="button"
                disabled={!isUserLoggedIn}
                onClick={() => {
                  if (isUserLoggedIn) {
                    setPostingMode('identity');
                  }
                }}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all text-left relative ${
                  !isUserLoggedIn
                    ? 'opacity-60 cursor-not-allowed bg-[#F4F5F2] dark:bg-[#151C14]/50 border-[#E5EADF] dark:border-[#2A3428] text-[#8E9B8A]'
                    : postingMode === 'identity'
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                    : 'bg-white dark:bg-[#151C14] border-[#DCE4D8] dark:border-[#3A4738] text-[#5A6D58] dark:text-[#8E9B8A] hover:border-[#2A4228]'
                }`}
                title={!isUserLoggedIn ? "Chế độ hiện danh tính chỉ khả dụng sau khi bạn đăng nhập tài khoản" : undefined}
              >
                <span className="text-base">👤</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>Hiện Danh Tính Thật</span>
                    {!isUserLoggedIn && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Cần đăng nhập</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] opacity-85 font-normal">
                    {!isUserLoggedIn
                      ? 'Chỉ mở khi đã đăng nhập tài khoản'
                      : 'Tên, Avatar & Niên khóa trường'}
                  </div>
                </div>
              </button>
            </div>

            {/* Persona Details & Live Preview */}
            {postingMode === 'anonymous' ? (
              <div className="p-3 rounded-xl bg-white dark:bg-[#141B13] border border-[#E5E2D9] dark:border-[#2C3B2A] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] font-bold text-xs flex items-center justify-center border border-[#2A4228]/30">
                      🎭
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                        {getComputedAnonId()}
                      </div>
                      <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">
                        Mã số tạo ngẫu nhiên, không ai biết bạn là ai
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleShuffleIdentity}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-[#EAF0E8] text-[#2A4228] dark:text-[#8BA888] border border-[#C8D2C4] dark:border-[#3A4738] flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Đổi mã mới</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setIdentityStyle('number_only')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      identityStyle === 'number_only'
                        ? 'bg-[#2A4228] text-white'
                        : 'bg-black/5 dark:bg-white/5 text-[#5A6D58] dark:text-[#8E9B8A]'
                    }`}
                  >
                    Mã số (#123)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentityStyle('persona')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      identityStyle === 'persona'
                        ? 'bg-[#2A4228] text-white'
                        : 'bg-black/5 dark:bg-white/5 text-[#5A6D58] dark:text-[#8E9B8A]'
                    }`}
                  >
                    Bút danh thiên nhiên
                  </button>
                </div>
              </div>
            ) : (
              /* Public Identity Customizer & Live Preview */
              <div className="p-3 rounded-xl bg-white dark:bg-[#141B13] border border-[#E5E2D9] dark:border-[#2C3B2A] space-y-3">
                <div className="flex items-center gap-3">
                  {/* Avatar Picker Trigger */}
                  <div className="relative group shrink-0">
                    <img
                      src={avatarUrl}
                      alt="User Avatar"
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#2A4228] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                    >
                      Đổi
                    </button>
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={displayName}
                          readOnly={isLocked}
                          disabled={isLocked}
                          onChange={(e) => !isLocked && setDisplayName(e.target.value)}
                          placeholder="Tên hiển thị thật..."
                          className={`w-full border rounded-lg px-2.5 py-1 text-xs font-bold ${
                            isLocked
                              ? 'bg-[#2A4228]/5 dark:bg-[#1C241B] border-[#8BA888]/40 text-[#182217] dark:text-[#E8ECE6] cursor-not-allowed select-all'
                              : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#C8D2C4] dark:border-[#3A4738] text-[#182217] dark:text-[#E8ECE6] focus:outline-none focus:border-[#2A4228]'
                          }`}
                        />
                        {isLocked && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold" title="Tên thật đã được AI khóa cố định">
                            🔒 AI Locked
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#FAF9F6] dark:bg-[#20281F] text-[#2A4228] dark:text-[#8BA888] border border-[#C8D2C4] dark:border-[#3A4738] shrink-0 hover:bg-[#EAF0E8] transition-all"
                      >
                        🎨 Đổi Avatar
                      </button>
                    </div>

                    {/* School Major & Cohort Info for specific schools vs Note for Sảnh Chung */}
                    {isCurrentSchoolGlobalLounge ? (
                      <div className="p-2 rounded-lg bg-[#2A4228]/5 dark:bg-[#1C241B] border border-[#8BA888]/30 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888]" />
                        <p className="text-[10px] text-[#2A4228] dark:text-[#8BA888] font-medium leading-tight">
                          Sảnh Chung Toàn Quốc: Hiển thị với <strong>Họ tên thật</strong> & <strong>Avatar</strong> (không gán niên khóa trường).
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold text-[#5A6D58] dark:text-[#8E9B8A] shrink-0">Chuyên/Ngành:</span>
                          <div className="relative flex-1 min-w-0">
                            <input
                              type="text"
                              value={currentVerification?.major || userState?.verifiedMajor || (currentSchoolObj?.type === 'university' ? 'Công nghệ thông tin' : 'Chuyên Tin')}
                              readOnly
                              disabled
                              className="w-full bg-[#2A4228]/5 dark:bg-[#1C241B] border border-[#8BA888]/40 rounded-lg px-2 py-0.5 text-[11px] font-bold text-[#2A4228] dark:text-[#8BA888] cursor-not-allowed truncate"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold text-[#5A6D58] dark:text-[#8E9B8A] shrink-0">Khóa:</span>
                          <div className="relative flex-1 min-w-0">
                            <input
                              type="text"
                              value={cohortInput}
                              readOnly={isLocked}
                              disabled={isLocked}
                              onChange={(e) => !isLocked && setCohortInput(e.target.value)}
                              placeholder="VD: K21-24, K22..."
                              className={`w-full border rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                                isLocked
                                  ? 'bg-[#2A4228]/5 dark:bg-[#1C241B] border-[#8BA888]/40 text-[#2A4228] dark:text-[#8BA888] cursor-not-allowed'
                                  : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#C8D2C4] dark:border-[#3A4738] text-[#2A4228] dark:text-[#8BA888] focus:outline-none focus:border-[#2A4228]'
                              }`}
                            />
                            {isLocked && (
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                🔒
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar Picker Dropdown Grid */}
                {showAvatarPicker && (
                  <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#1E271D] border border-[#C8D2C4] dark:border-[#3A4738] space-y-2.5 animate-scale-up">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A4228] dark:text-[#8BA888]">
                        Chọn Avatar hoặc Tải ảnh lên
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAvatarPicker(false)}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        Đóng
                      </button>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset.url);
                            setShowAvatarPicker(false);
                          }}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-105 ${
                            avatarUrl === preset.url
                              ? 'border-[#2A4228] ring-2 ring-[#8BA888]'
                              : 'border-transparent hover:border-[#8BA888]'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    <label className="block text-center py-1.5 px-3 rounded-xl border border-dashed border-[#2A4228] bg-white dark:bg-[#151C14] text-[11px] font-bold text-[#2A4228] dark:text-[#8BA888] cursor-pointer hover:bg-[#EAF0E8] transition-colors">
                      <span>📁 Tải ảnh avatar từ máy tính</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {!isLocked ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs space-y-2 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                      <Clock className="w-4 h-4" />
                      <span>Danh tính chưa được khóa chính thức</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Để bảo vệ uy tín học đường và chống mạo danh, bạn cần hoàn tất & khóa danh tính cố định trước khi đăng bài bằng Danh tính chính.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {onOpenProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenProfile();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#2A4228] text-white text-[11px] font-bold hover:bg-[#1E301D] transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          <span>Đến Cài đặt để Khóa danh tính</span>
                        </button>
                      )}
                      {onOpenVerify && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenVerify();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#20281F] border border-amber-500/40 text-amber-900 dark:text-amber-200 text-[11px] font-bold hover:bg-amber-500/10 transition-colors flex items-center gap-1"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          <span>Quét Thẻ AI</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lá thư sẽ xuất hiện với danh tính đã khóa: <strong>{unifiedRealName}</strong> ({schoolMajor} • {cohortInput}).</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Visibility Scope Switcher */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A] mb-1.5">
              Phạm vi gửi lá thư & Chế độ hỗ trợ
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPostScope('public')}
                className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                  postScope === 'public'
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#E5E2D9] dark:border-[#3A4738] text-[#7E7A71] dark:text-[#8E9B8A]'
                }`}
              >
                <Globe className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold">🌐 Sảnh Chung</div>
                  <div className="text-[9px] opacity-80 font-normal leading-tight">Toàn quốc đọc & an ủi</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPostScope('campus');
                  if (selectedSchoolId === 'all-schools' || selectedSchoolId === 'all') {
                    const firstSchool = schools.find(s => s.id !== 'all-schools' && s.id !== 'all') || schools[0];
                    setSelectedSchoolId(firstSchool.id);
                  }
                }}
                className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                  postScope === 'campus'
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#E5E2D9] dark:border-[#3A4738] text-[#7E7A71] dark:text-[#8E9B8A]'
                }`}
              >
                <GraduationCap className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold">🏫 Nội Bộ Trường</div>
                  <div className="text-[9px] opacity-80 font-normal leading-tight">Chỉ học sinh trường này</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPostScope('counseling_mailbox');
                  setPostingMode('anonymous');
                  if (selectedSchoolId === 'all-schools' || selectedSchoolId === 'all') {
                    const firstSchool = schools.find(s => s.id !== 'all-schools' && s.id !== 'all') || schools[0];
                    setSelectedSchoolId(firstSchool.id);
                  }
                }}
                className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                  postScope === 'counseling_mailbox'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#E5E2D9] dark:border-[#3A4738] text-[#7E7A71] dark:text-[#8E9B8A]'
                }`}
              >
                <HeartHandshake className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold flex items-center gap-1">
                    <span>🔒 Hòm Thư Tư Vấn</span>
                  </div>
                  <div className="text-[9px] opacity-80 font-normal leading-tight">Cố vấn / Peer Mentor</div>
                </div>
              </button>
            </div>

            {postScope === 'counseling_mailbox' && (
              <div className="mt-2 p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hòm Thư Tư Vấn Tâm Lý Trường (Bảo Mật 100% Ẩn Danh)</span>
                </div>
                <p className="text-[11px] text-[#2C382A] dark:text-[#A4B5A0] leading-relaxed">
                  Giải tỏa những áp lực gia đình, bế tắc điểm số hoặc sợ bị dán nhãn tại trường. Bạn luôn xuất hiện dưới dạng <strong>Mã số ẩn danh #{anonNumber}</strong>. Chỉ Ban Cố Vấn và Peer Mentor của trường mới có quyền phản hồi để bảo đảm tính an toàn & thấu cảm.
                </p>
              </div>
            )}
          </div>

          {/* Target School Selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#2C382A] dark:text-[#8E9B8A] mb-1.5">
              Gửi tới Hộp thư trường
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] font-bold focus:outline-none focus:border-[#2A4228]"
            >
              <option value="all-schools" className="bg-[#FAF9F6] dark:bg-[#1C231B] text-[#0F180E] dark:text-[#E8ECE6]">
                🌐 Sảnh Chung Mọi Trường (Công Khai)
              </option>
              {schools.map(s => (
                <option key={s.id} value={s.id} className="bg-[#FAF9F6] dark:bg-[#1C231B] text-[#0F180E] dark:text-[#E8ECE6]">
                  {s.name} ({s.location})
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload & Gemini Vision Analysis */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A]">
                📷 Đính kèm Ảnh & Gemini AI Phân Tích
              </label>
              <span className="text-[10px] text-[#2A4228] dark:text-[#8BA888] font-semibold">Gemini 2.5 Flash</span>
            </div>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] p-3 space-y-3">
                <div className="flex gap-3 items-start">
                  <img src={imagePreview} alt="Attached preview" className="w-24 h-24 object-cover rounded-xl border border-[#E5E2D9]" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#3A4036] dark:text-[#E8ECE6] flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-[#8BA888]" />
                        Phân tích từ Gemini AI
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageAnalysisResult(null);
                        }}
                        className="text-[10px] text-rose-500 hover:underline font-bold"
                      >
                        Xóa ảnh
                      </button>
                    </div>

                    {isAnalyzingImage ? (
                      <div className="flex items-center gap-2 text-xs text-[#2A4228] dark:text-[#8BA888] py-2">
                        <span className="w-3.5 h-3.5 border-2 border-[#2A4228] border-t-transparent rounded-full animate-spin"></span>
                        <span>Gemini đang đọc nét vẽ, nhật ký & cảm xúc...</span>
                      </div>
                    ) : imageAnalysisResult ? (
                      <div className="text-[11px] text-[#2A4228] dark:text-[#8BA888] space-y-1 bg-[#8BA888]/10 p-2 rounded-xl">
                        <p><strong>Tóm tắt:</strong> {imageAnalysisResult.summary}</p>
                        {imageAnalysisResult.emotionalTone && (
                          <p><strong>Cảm xúc:</strong> {imageAnalysisResult.emotionalTone}</p>
                        )}
                        {imageAnalysisResult.textExtracted && (
                          <p className="italic"><strong>Chữ trong ảnh:</strong> "{imageAnalysisResult.textExtracted}"</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#E5E2D9] dark:border-[#3A4738] hover:border-[#2A4228] rounded-2xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-[#FAF9F6] dark:bg-[#20281F] transition-colors text-xs text-[#5A6D58] dark:text-[#8E9B8A] font-medium">
                <ImagePlus className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
                <span>Tải ảnh nhật ký, bài vẽ, câu hỏi hoặc tâm sự đính kèm</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Title input */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A] mb-1.5">
              Tiêu đề lá thư
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Một câu ngắn gọn miêu tả nỗi lòng của bạn..."
              className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl p-3 text-xs sm:text-sm text-[#182217] dark:text-[#E8ECE6] placeholder-[#A4A095] focus:outline-none focus:border-[#2A4228] font-medium"
              maxLength={120}
              required
            />
          </div>

          {/* Body Content input */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A] mb-1.5">
              Nội dung lá thư
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={postingMode === 'anonymous' ? "Trút bỏ mọi muộn phiền tại đây. Danh tính bạn hoàn toàn bảo mật..." : "Chia sẻ tâm sự, kinh nghiệm học tập hoặc lời nhắn nhủ đến bạn bè..."}
              rows={5}
              className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl p-3 text-xs sm:text-sm text-[#182217] dark:text-[#E8ECE6] placeholder-[#A4A095] focus:outline-none focus:border-[#2A4228] font-normal leading-relaxed resize-none"
              required
            />
          </div>

          {/* Tags Selection */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A6D58] dark:text-[#8E9B8A] mb-1.5">
              Chủ đề (Tối đa 3)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#2A4228] text-white font-bold'
                        : 'bg-[#F1F3EF] dark:bg-[#20281F] text-[#7E7A71] dark:text-[#8E9B8A] hover:text-[#3A4036] dark:hover:text-[#E8ECE6]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Storage & Privacy Auto-Expiry Section */}
          <div className="p-3 rounded-2xl bg-[#F8FAF7] dark:bg-[#1E271D] border border-[#E5EADF] dark:border-[#2C3B2A] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#3B4D39] dark:text-[#8E9B8A] flex items-center gap-1.5">
                <Hourglass className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888]" />
                <span>Thời hạn lưu trữ lá thư</span>
              </label>
              <span className="text-[10px] text-[#2A4228] dark:text-[#8BA888] font-bold flex items-center gap-1">
                {expiryDays === 0 ? (
                  <><InfinityIcon className="w-3 h-3" /> Lưu vĩnh viễn</>
                ) : (
                  <><Hourglass className="w-3 h-3" /> Tự xóa sau {expiryDays === 1 ? '24 giờ' : `${expiryDays} ngày`}</>
                )}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setExpiryDays(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                  expiryDays === 1
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                    : 'bg-white dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] border-[#DCE4D8] dark:border-[#3A4738]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>24 giờ</span>
              </button>

              <button
                type="button"
                onClick={() => setExpiryDays(7)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                  expiryDays === 7
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                    : 'bg-white dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] border-[#DCE4D8] dark:border-[#3A4738]'
                }`}
              >
                <span>7 ngày</span>
              </button>

              <button
                type="button"
                onClick={() => setExpiryDays(14)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                  expiryDays === 14
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                    : 'bg-white dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] border-[#DCE4D8] dark:border-[#3A4738]'
                }`}
              >
                <span>14 ngày</span>
              </button>

              <button
                type="button"
                disabled={!isUserLoggedIn}
                onClick={() => {
                  if (isUserLoggedIn) {
                    setExpiryDays(0);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                  !isUserLoggedIn
                    ? 'opacity-50 cursor-not-allowed bg-[#F4F5F2] dark:bg-[#151C14]/50 text-[#8E9B8A] border-[#DCE4D8] dark:border-[#3A4738]'
                    : expiryDays === 0
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                    : 'bg-white dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] border-[#DCE4D8] dark:border-[#3A4738]'
                }`}
                title={!isUserLoggedIn ? "Lưu vĩnh viễn chỉ áp dụng cho người dùng đã đăng nhập" : undefined}
              >
                {!isUserLoggedIn ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Vĩnh viễn (Cần đăng nhập)</span>
                  </>
                ) : (
                  <>
                    <InfinityIcon className="w-3.5 h-3.5" />
                    <span>Vĩnh viễn</span>
                  </>
                )}
              </button>
            </div>
            {!isUserLoggedIn && (
              <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] italic pt-0.5">
                * Khách chưa đăng nhập: Bài viết sẽ tự động hết hạn và xóa sau tối đa 14 ngày. Hãy đăng nhập để lưu vĩnh viễn và đồng bộ lá thư.
              </p>
            )}
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-[#E5E2D9] dark:border-[#3A4738]">
            <div className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A] flex items-center gap-1 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888]" />
              <span>Kiểm duyệt bởi Gemini AI</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-[#E5E2D9] dark:border-[#3A4738] text-xs font-semibold text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-[#FAF9F6] dark:hover:bg-[#20281F] transition-all"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-5 py-2 rounded-full bg-[#2A4228] hover:bg-[#385036] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>AI đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{postingMode === 'anonymous' ? 'Gửi Thư Ẩn Danh' : 'Gửi Thư Với Danh Tính'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
