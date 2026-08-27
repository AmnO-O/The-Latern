import React, { useState, useRef, useEffect } from 'react';
import { 
  HeartHandshake, 
  Heart, 
  Share2, 
  Bookmark, 
  MessageSquare, 
  Sparkles, 
  Crown, 
  GraduationCap, 
  Users,
  Bot, 
  User, 
  BadgeCheck, 
  CornerDownRight, 
  Send, 
  BookOpen, 
  ArrowLeft,
  X,
  ShieldCheck,
  Globe,
  School as SchoolIcon,
  Hourglass,
  Trash2,
  Image as ImageIcon,
  Flame,
  Lock,
  Music,
  Minimize2,
  Mail,
  FileEdit,
  ShieldAlert
} from 'lucide-react';
import { Post, Reply, UserState } from '../types';
import { ambientAudio } from '../lib/audioSynthesizer';
import { calculateReputationScore } from '../lib/reputationUtils';
import { ReputationBadge } from './ReputationBadge';
import { formatRelativeTime, formatFullDateTime } from '../lib/dateUtils';
import { getEffectiveAvatar } from '../data/avatarPresets';
import { getFormattedAuthorName, getFormattedReplyAuthorName } from '../lib/authorUtils';
import { PublicProfileTarget } from './PublicProfileModal';

interface PostDetailViewProps {
  post: Post;
  userState?: UserState;
  onBack: () => void;
  onToggleLike: (postId: string, e: React.MouseEvent) => void;
  onToggleHug: (postId: string, e: React.MouseEvent) => void;
  onToggleSave: (postId: string, e: React.MouseEvent) => void;
  onSharePost?: (post: Post) => void;
  onAddReply: (
    postId: string, 
    content: string, 
    replyTo?: { authorName: string; id: string },
    replyOptions?: { 
      isIdentityPublic?: boolean; 
      authorDisplayName?: string; 
      authorAvatar?: string; 
      authorCohort?: string;
      authorMajor?: string;
    }
  ) => void;
  onRequestAIReply?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onOpenAmbientModal?: () => void;
  onOpenProfile?: () => void;
  onOpenLogin?: () => void;
  onOpenPeerMentorModal?: () => void;
  onConnectWithAuthor?: (post: Post) => void;
  onOpenRatingModal?: (listenerName: string, postId?: string) => void;
  onOpenReportModal?: (listenerName: string, postId?: string) => void;
  onViewPublicProfile?: (target: PublicProfileTarget) => void;
  isAuthor?: boolean;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
  post,
  userState,
  onBack,
  onToggleLike,
  onToggleHug,
  onToggleSave,
  onSharePost,
  onAddReply,
  onRequestAIReply,
  onEditPost,
  onDeletePost,
  onOpenAmbientModal,
  onOpenProfile,
  onOpenLogin,
  onOpenPeerMentorModal,
  onConnectWithAuthor,
  onOpenRatingModal,
  onOpenReportModal,
  onViewPublicProfile,
  isAuthor
}) => {
  const [replyInput, setReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [localReplies, setLocalReplies] = useState<Reply[]>(post.replies || []);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const isUserLoggedIn = Boolean(userState?.isLoggedIn || userState?.googleUser?.email);

  // Reply Identity Toggle ('anonymous' vs 'identity')
  const [replyPersonaMode, setReplyPersonaMode] = useState<'anonymous' | 'identity'>(() => {
    if (!isUserLoggedIn) return 'anonymous';
    return userState?.activePostingMode || 'anonymous';
  });

  useEffect(() => {
    if (!isUserLoggedIn) {
      setReplyPersonaMode('anonymous');
    }
  }, [isUserLoggedIn]);

  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (Array.isArray(post.replies)) {
      setLocalReplies(prev => {
        const replyMap = new Map<string, Reply>();
        (post.replies || []).forEach(r => replyMap.set(r.id, r));
        prev.forEach(r => {
          if (!replyMap.has(r.id)) {
            replyMap.set(r.id, r);
          }
        });
        return Array.from(replyMap.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      });
    }
  }, [post.replies]);

  // Zen Focus Reading Mode States
  const [isFocusReadingMode, setIsFocusReadingMode] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'sepia' | 'dark' | 'cream'>('sepia');
  const [readerFontSize, setReaderFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Web Audio Synth for Calming Ambient Sound during Focus Reading
  const toggleAmbientSound = () => {
    if (isAmbientPlaying) {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (err) {}
      }
      setIsAmbientPlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(174, ctx.currentTime);

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
        setIsAmbientPlaying(true);
      } catch (err) {
        console.error('Ambient audio error:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (err) {}
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch (err) {}
      }
    };
  }, []);

  const userDisplayName = userState?.verifiedFullName || userState?.displayName || userState?.googleUser?.displayName || 'Người dùng Lantern';
  const userAvatar = getEffectiveAvatar(userState?.customAvatarUrl, userState?.googleUser?.photoURL);
  const effectiveCohort = userState?.schoolVerifications?.[post.schoolId]?.cohort || 
    userState?.schoolCohorts?.[post.schoolId] || 
    userState?.verifiedCohort || 
    userState?.defaultCohort;
  const effectiveMajor = userState?.schoolVerifications?.[post.schoolId]?.major || 
    userState?.verifiedMajor;
  const isIdentityLockedForSchool = Boolean(
    userState?.isIdentityLocked || 
    userState?.schoolVerifications?.[post.schoolId]?.isIdentityLocked
  );

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyInput.trim();
    if (!trimmed) return;

    const isPublic = replyPersonaMode === 'identity' && isIdentityLockedForSchool;
    
    // Generate optimistic reply for instant UI feedback
    let assignedRole: 'student' | 'peer_listener' | 'expert' = 'student';
    if (userState?.userRole === 'mentor' || userState?.isSpecialist || userState?.mentorRoleType === 'specialist') {
      assignedRole = 'expert';
    } else if (userState?.userRole === 'peer_listener' || userState?.isPeerMentor || userState?.mentorRoleType === 'peer_listener') {
      assignedRole = 'peer_listener';
    }

    const optimisticAuthorName = isPublic && userDisplayName
      ? userDisplayName
      : isAuthor
      ? (post.authorAnonId || '#Tác giả')
      : userState?.userAnonNumber
      ? `#${userState.userAnonNumber}`
      : 'Người dùng ẩn danh';

    const optimisticReply: Reply = {
      id: `reply-${Date.now()}`,
      postId: post.id,
      authorUid: userState?.googleUser?.uid || 'guest',
      authorName: optimisticAuthorName,
      authorRole: assignedRole,
      authorReputationScore: userState?.reputationScore || 0,
      isOP: isAuthor,
      isVerifiedBadge: userState?.verificationStatus === 'verified',
      timestamp: 'Vừa xong',
      createdAt: Date.now(),
      content: trimmed,
      hugsCount: 0,
      replyToAuthor: replyingTo?.authorName,
      replyToId: replyingTo?.id,
      isIdentityPublic: isPublic,
      authorDisplayName: isPublic ? userDisplayName : undefined,
      authorAvatar: isPublic ? userAvatar : undefined,
      authorCohort: isPublic ? (effectiveCohort || undefined) : undefined,
      authorMajor: isPublic ? (effectiveMajor || undefined) : undefined
    };

    setLocalReplies(prev => [...prev, optimisticReply]);

    onAddReply(
      post.id, 
      trimmed, 
      replyingTo || undefined,
      {
        isIdentityPublic: isPublic,
        authorDisplayName: isPublic ? userDisplayName : undefined,
        authorAvatar: isPublic ? userAvatar : undefined,
        authorCohort: isPublic ? (effectiveCohort || undefined) : undefined,
        authorMajor: isPublic ? (effectiveMajor || undefined) : undefined
      }
    );
    setReplyInput('');
    setReplyingTo(null);
  };

  const handleInitiateReply = (reply: Reply) => {
    const targetName = reply.isIdentityPublic ? (reply.authorDisplayName || reply.authorName) : reply.authorName;
    setReplyingTo({ id: reply.id, authorName: targetName });
    if (replyInputRef.current) {
      replyInputRef.current.focus();
    }
  };

  const handleToggleReplyHug = (replyId: string) => {
    setLocalReplies(prev => prev.map(r => {
      if (r.id === replyId) {
        const newIsHugged = !r.isHugged;
        return {
          ...r,
          isHugged: newIsHugged,
          hugsCount: newIsHugged ? (r.hugsCount || 0) + 1 : Math.max(0, (r.hugsCount || 0) - 1)
        };
      }
      return r;
    }));
  };

  const handleGenerateAIReply = async () => {
    if (!onRequestAIReply) return;
    setIsGeneratingAI(true);
    await onRequestAIReply(post.id);
    setIsGeneratingAI(false);
  };

  const getReaderThemeStyles = () => {
    switch (readerTheme) {
      case 'sepia':
        return {
          bg: 'bg-[#FAF6EE]',
          card: 'bg-[#F3EDDF] border-[#E8DFC8]',
          textPrimary: 'text-[#2C2319]',
          textMuted: 'text-[#6E6152]',
          accent: 'text-[#8A5A2B]',
          pillBg: 'bg-[#EAE0CD]'
        };
      case 'dark':
        return {
          bg: 'bg-[#121811]',
          card: 'bg-[#1C251A] border-[#2A3828]',
          textPrimary: 'text-[#E2ECE0]',
          textMuted: 'text-[#8E9B8A]',
          accent: 'text-[#8BA888]',
          pillBg: 'bg-[#253324]'
        };
      case 'cream':
      default:
        return {
          bg: 'bg-[#F4F7F3]',
          card: 'bg-[#FFFFFF] border-[#C8D2C4]',
          textPrimary: 'text-[#050A04]',
          textMuted: 'text-[#2C382A]',
          accent: 'text-[#1E351C]',
          pillBg: 'bg-[#E2EBE0]'
        };
    }
  };

  const getFontSizeClass = () => {
    switch (readerFontSize) {
      case 'normal':
        return 'text-base sm:text-lg leading-relaxed';
      case 'large':
        return 'text-lg sm:text-xl leading-loose';
      case 'xlarge':
        return 'text-xl sm:text-2xl leading-loose';
    }
  };

  const activeTheme = getReaderThemeStyles();

  return (
    <div className="w-full flex justify-center min-h-screen pb-16 pt-4 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-5 relative">
        {/* Top Context Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-[#2C382A] dark:text-[#8E9B8A] hover:text-[#2A4228] dark:hover:text-[#8BA888] font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trở về {post.schoolName}</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Focus Reading Mode Toggle Button */}
            <button
              onClick={() => setIsFocusReadingMode(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Đọc không xao nhãng trong giao diện tĩnh lặng"
            >
              <BookOpen className="w-4 h-4" />
              <span>Chế độ đọc tập trung</span>
            </button>

            <span className="text-[10px] uppercase tracking-[0.2em] text-[#2A4228] dark:text-[#8BA888] font-bold bg-[#2A4228]/15 px-3 py-1 rounded-full hidden sm:inline-block">
              Campus Hub
            </span>
          </div>
        </div>

        {/* Full Article Card */}
        <article className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
          {/* Glowing Top Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2A4228]/20 via-[#2A4228] to-[#2A4228]/20"></div>

          {/* Header metadata */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                if (onViewPublicProfile) {
                  onViewPublicProfile({
                    displayName: post.authorDisplayName || getFormattedAuthorName(post),
                    avatarUrl: post.authorAvatarUrl,
                    schoolName: post.schoolName,
                    role: post.authorRole || 'student',
                    cohort: post.authorCohort,
                    major: post.authorMajor,
                    isVerifiedBadge: !!post.authorClassBadge || post.isIdentityPublic,
                    reputationScore: post.authorReputationScore ?? calculateReputationScore(
                      !!post.authorClassBadge || post.authorAnonId.includes('Xác thực') || post.authorAnonId.includes('492'),
                      post.hugsCount
                    ),
                    hugsReceived: post.hugsCount,
                    authorUid: post.authorUid,
                    isIdentityPublic: post.isIdentityPublic,
                    anonId: post.authorAnonId
                  });
                }
              }}
              className="group/author flex items-center gap-3 text-left hover:opacity-90 transition-all rounded-xl p-1 -m-1 focus:outline-none focus:ring-2 focus:ring-[#2A4228]/20"
              title={post.isIdentityPublic ? "Xem trang cá nhân công khai" : "Danh tính được bảo vệ ẩn danh"}
            >
              {post.isIdentityPublic && post.authorAvatarUrl ? (
                <img
                  src={post.authorAvatarUrl}
                  alt={getFormattedAuthorName(post)}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#2A4228] dark:border-[#8BA888] shadow-xs shrink-0 group-hover/author:scale-105 transition-transform"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#2A4228]/15 border border-[#2A4228]/30 flex items-center justify-center text-[#2A4228] dark:text-[#8BA888] shrink-0 group-hover/author:scale-105 transition-transform">
                  {post.isIdentityPublic ? (
                    <User className="w-6 h-6" />
                  ) : (
                    <span className="text-xl">🎭</span>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-[#0F180E] dark:text-[#E8ECE6] group-hover/author:underline">
                    {getFormattedAuthorName(post)}
                  </span>

                  {post.isCounselingMailbox && (
                    <span className="bg-emerald-800 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <Lock className="w-3 h-3 text-emerald-300" />
                      <span>🔒 Hòm Thư Tư Vấn Trường</span>
                    </span>
                  )}

                  {post.isIdentityPublic && (
                    <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      <span>Danh tính chính</span>
                    </span>
                  )}

                  {post.authorMajor && post.isIdentityPublic && (
                    <span className="bg-[#2A4228]/10 dark:bg-[#8BA888]/15 text-[#2A4228] dark:text-[#8BA888] border border-[#8BA888]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {post.authorMajor}
                    </span>
                  )}

                  {post.authorCohort && (
                    <span className="bg-[#2A4228] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
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
                    <span className="bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] border border-[#2A4228]/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {post.authorClassBadge}
                    </span>
                  )}
                  {post.expiresAt && (
                    <span 
                      className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"
                      title="Lá thư tâm sự ẩn danh có thời hạn tự hủy để bảo vệ quyền riêng tư"
                    >
                      <Hourglass className="w-3 h-3" />
                      <span>
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
                  className="text-xs text-[#2C382A] dark:text-[#8E9B8A] mt-0.5 font-medium"
                  title={formatFullDateTime(post.createdAt || post.id)}
                >
                  {formatRelativeTime(post.createdAt, post.timestamp, post.id)} • {post.schoolName}
                </p>
              </div>
            </button>

            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap gap-1.5 justify-end">
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] border border-[#2A4228]/30 text-xs font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {(onEditPost || onDeletePost) && (
                <div className="flex items-center gap-2">
                  {onEditPost && (
                    <button
                      onClick={() => onEditPost(post)}
                      className="px-3 py-1 rounded-xl bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-[#2A4228]/20 text-[#2A4228] dark:text-[#8BA888] border border-[#C8D2C4] dark:border-[#3A4738] text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>
                  )}
                  {onDeletePost && (
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="px-3 py-1 rounded-xl bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-rose-500/20 text-rose-600 border border-rose-200 dark:border-rose-900/50 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Title & Full Body */}
          <h1 className="font-serif italic font-bold text-2xl sm:text-3xl text-[#050A04] dark:text-[#E8ECE6] mb-4 leading-snug">
            {post.title}
          </h1>

          <div className="text-sm sm:text-base text-[#0F180E] dark:text-[#D1D8CE] leading-relaxed space-y-4 font-normal whitespace-pre-line border-b border-[#C8D2C4] dark:border-[#3A4738] pb-6 mb-6">
            {post.content}

            {/* Attached Image & Gemini Vision Insights */}
            {post.imageUrl && (
              <div className="mt-4 rounded-2xl border border-[#C8D2C4] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] p-4 space-y-3">
                <div className="font-bold text-xs text-[#0F180E] dark:text-[#E8ECE6] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#2A4228]" />
                  <span>Hình ảnh đính kèm theo lá thư</span>
                </div>
                <img
                  src={post.imageUrl}
                  alt="Attached illustration"
                  className="w-full max-h-96 object-contain rounded-xl bg-black/5"
                />

                {post.imageAnalysis && (
                  <div className="p-3.5 rounded-xl bg-[#8BA888]/15 border border-[#8BA888]/30 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#2A4228] dark:text-[#8BA888]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Phân tích nét vẽ & cảm xúc qua Gemini AI:</span>
                    </div>
                    <p className="text-[#182217] dark:text-[#E8ECE6]"><strong>Tóm tắt:</strong> {post.imageAnalysis.summary}</p>
                    {post.imageAnalysis.emotionalTone && (
                      <p className="text-[#182217] dark:text-[#E8ECE6]"><strong>Sắc thái cảm xúc:</strong> {post.imageAnalysis.emotionalTone}</p>
                    )}
                    {post.imageAnalysis.textExtracted && (
                      <p className="text-[#5A6D58] dark:text-[#8E9B8A] italic"><strong>Chữ trong ảnh:</strong> "{post.imageAnalysis.textExtracted}"</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Social Interaction Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => onToggleHug(post.id, e)}
                className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                  post.isHugged
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-sm'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#2C382A] dark:text-[#8E9B8A] border-[#C8D2C4] dark:border-[#3A4738] hover:border-[#2A4228]'
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Gửi ôm ấm áp ({post.hugsCount})</span>
              </button>

              <button
                onClick={(e) => onToggleLike(post.id, e)}
                className={`p-2 rounded-full border transition-all active:scale-95 ${
                  post.isLiked
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#2C382A] dark:text-[#8E9B8A] border-[#C8D2C4] dark:border-[#3A4738]'
                }`}
                title="Đồng cảm"
              >
                <Heart className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => onToggleSave(post.id, e)}
                className={`p-2 rounded-full border transition-all active:scale-95 ${
                  post.isSaved
                    ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-sm'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#2C382A] dark:text-[#8E9B8A] border-[#C8D2C4] dark:border-[#3A4738]'
                }`}
                title="Lưu trữ"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              {onSharePost && (
                <button
                  onClick={() => onSharePost(post)}
                  className="p-2 rounded-full border bg-[#FAF9F6] dark:bg-[#20281F] text-[#2C382A] dark:text-[#8E9B8A] border-[#C8D2C4] dark:border-[#3A4738] hover:text-[#2A4228]"
                  title="Chia sẻ lá thư"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Direct 1-on-1 Healing Chat with Author */}
            {onConnectWithAuthor && (
              <button
                onClick={() => onConnectWithAuthor(post)}
                className="px-4 py-2 rounded-full bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-[#EAF0E8] text-[#2A4228] dark:text-[#8BA888] border border-[#2A4228]/40 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Nhắn tin 1:1 ẩn danh với tác giả</span>
              </button>
            )}
          </div>
        </article>



        {/* Replies List Header */}
        <div className="flex items-center justify-between px-2 pt-2">
          <h2 className="font-serif italic font-bold text-lg text-[#182217] dark:text-[#E8ECE6] flex items-center gap-2">
            <span>Những lời xoa dịu</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] font-sans font-bold">
              {localReplies.length}
            </span>
          </h2>
        </div>

        {/* Replies Flow */}
        <div className="space-y-3">
          {localReplies.length === 0 ? (
            <div className="text-center py-10 bg-[var(--bg-card)] rounded-3xl border border-[#C8D2C4] dark:border-[#3A4738] p-6 space-y-2">
              <span className="text-3xl">🕯️</span>
              <p className="text-xs font-medium text-[#5A6D58] dark:text-[#8E9B8A]">
                Chưa có phản hồi nào. Hãy là người đầu tiên trao gửi một cái ôm và lời động viên chân thành!
              </p>
            </div>
          ) : (
            localReplies.map((reply) => {
              const isAIReply = reply.authorRole === 'ai_lantern';
              return (
                <div
                  key={reply.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isAIReply
                      ? 'bg-[#8BA888]/10 border-[#8BA888]/40 shadow-xs'
                      : reply.isOP
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : reply.isIdentityPublic
                      ? 'bg-emerald-500/5 border-emerald-500/25'
                      : 'bg-[var(--bg-card)] border-[#C8D2C4] dark:border-[#3A4738]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <button
                      type="button"
                      disabled={isAIReply}
                      onClick={() => {
                        if (isAIReply || !onViewPublicProfile) return;
                        onViewPublicProfile({
                          displayName: reply.authorDisplayName || getFormattedReplyAuthorName(reply),
                          avatarUrl: reply.authorAvatar,
                          schoolName: post.schoolName,
                          role: reply.authorRole || 'student',
                          cohort: reply.authorCohort,
                          major: reply.authorMajor,
                          isVerifiedBadge: reply.isVerifiedBadge || reply.isIdentityPublic,
                          reputationScore: reply.authorReputationScore,
                          hugsReceived: reply.hugsCount,
                          authorUid: reply.authorUid,
                          isIdentityPublic: reply.isIdentityPublic,
                          anonId: reply.authorName
                        });
                      }}
                      className={`flex items-center gap-2.5 text-left rounded-xl p-1 -m-1 transition-all ${
                        isAIReply 
                          ? 'cursor-default' 
                          : 'cursor-pointer hover:opacity-90 group/replyauthor focus:outline-none focus:ring-2 focus:ring-[#2A4228]/20'
                      }`}
                      title={isAIReply ? "Phản hồi thấu cảm từ AI" : reply.isIdentityPublic ? "Xem trang cá nhân công khai" : "Danh tính được bảo vệ ẩn danh"}
                    >
                      {isAIReply ? (
                        <div className="w-8 h-8 rounded-full bg-[#2A4228] text-white flex items-center justify-center shrink-0">
                          <Flame className="w-4 h-4" />
                        </div>
                      ) : reply.isIdentityPublic && reply.authorAvatar ? (
                        <img
                          src={reply.authorAvatar}
                          alt={reply.authorDisplayName || reply.authorName}
                          className="w-8 h-8 rounded-full object-cover border border-[#2A4228] shadow-2xs shrink-0 group-hover/replyauthor:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#2A4228]/15 border border-[#2A4228]/30 flex items-center justify-center text-[#2A4228] dark:text-[#8BA888] font-bold text-xs shrink-0 group-hover/replyauthor:scale-105 transition-transform">
                          {reply.isOP ? '👑' : reply.isIdentityPublic ? '👤' : '🌿'}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-xs text-[#182217] dark:text-[#E8ECE6] ${!isAIReply ? 'group-hover/replyauthor:underline' : ''}`}>
                            {getFormattedReplyAuthorName(reply)}
                          </span>

                          {reply.isIdentityPublic && (
                            <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                              Danh tính chính
                            </span>
                          )}

                          {reply.authorMajor && reply.isIdentityPublic && (
                            <span className="bg-[#2A4228]/10 dark:bg-[#8BA888]/15 text-[#2A4228] dark:text-[#8BA888] border border-[#8BA888]/30 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                              {reply.authorMajor}
                            </span>
                          )}

                          {reply.authorCohort && (
                            <span className="bg-[#2A4228] text-white text-[9px] font-bold px-2 py-0.2 rounded-full">
                              {reply.authorCohort}
                            </span>
                          )}

                          {reply.isOP && (
                            <span className="bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                              Chủ thớt
                            </span>
                          )}

                          {reply.authorRole === 'peer_listener' && (
                            <span className="bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" />
                              <span>Bạn lắng nghe</span>
                            </span>
                          )}

                          {(reply.authorRole === 'expert' || reply.authorRole === 'counselor') && (
                            <span className="bg-sky-600/15 text-sky-800 dark:text-sky-300 border border-sky-600/30 text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                              <GraduationCap className="w-2.5 h-2.5" />
                              <span>Chuyên gia tâm lý</span>
                            </span>
                          )}

                          {isAIReply && (
                            <span className="bg-[#2A4228] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                              AI Thấu Cảm
                            </span>
                          )}
                        </div>
                        <p 
                          className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]"
                          title={formatFullDateTime(reply.createdAt || reply.id)}
                        >
                          {formatRelativeTime(reply.createdAt, reply.timestamp, reply.id)}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleReplyHug(reply.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border transition-all ${
                          reply.isHugged
                            ? 'bg-[#2A4228] text-white border-[#2A4228]'
                            : 'bg-white dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] border-[#C8D2C4] dark:border-[#3A4738]'
                        }`}
                      >
                        <HeartHandshake className="w-3 h-3" />
                        <span>{reply.hugsCount || 0}</span>
                      </button>

                      {/* Healing Rating Button on Reply */}
                      {onOpenRatingModal && (reply.authorRole === 'peer_listener' || reply.authorRole === 'expert' || reply.authorRole === 'counselor') && (
                        <button
                          onClick={() => onOpenRatingModal(reply.authorDisplayName || reply.authorName, post.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Thả tim đánh giá ấm áp cho người lắng nghe"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500/30 text-rose-500 hover:fill-rose-500" />
                        </button>
                      )}

                      {/* Report Listener Button on Reply */}
                      {onOpenReportModal && (
                        <button
                          onClick={() => onOpenReportModal(reply.authorDisplayName || reply.authorName, post.id)}
                          className="p-1 rounded-lg text-[#8E9B8A] hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                          title="Báo cáo vi phạm (nếu quấy rối, công kích, xin info)"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleInitiateReply(reply)}
                        className="p-1 rounded-lg text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-[#2A4228]/10 hover:text-[#2A4228]"
                        title="Trả lời người này"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {reply.replyToAuthor && (
                    <div className="text-[11px] text-[#2A4228] dark:text-[#8BA888] font-semibold mb-1 pl-2 border-l border-[#2A4228]/40">
                      @{reply.replyToAuthor}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-[#182217] dark:text-[#E8ECE6] leading-relaxed whitespace-pre-line pl-10">
                    {reply.content}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Counseling Mailbox Security & Empathy Notice */}
        {post.isCounselingMailbox && (
          <div className="p-4 rounded-3xl bg-emerald-900/10 dark:bg-emerald-950/30 border border-emerald-600/30 space-y-2 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Hộp Thư Tư Vấn Tâm Lý Trường Học • Bảo Mật 100% Danh Tính</span>
            </div>
            <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
              Lá thư này được bảo vệ trong Hộp Thư Tư Vấn của <strong>{post.schoolName}</strong> nhằm giải quyết rào cản tâm lý học đường và khoảng cách gia đình. Mọi phản hồi tham vấn chuyên sâu đều đến từ <strong>Ban Cố Vấn</strong> hoặc <strong>Chuyên Gia Tâm Lý Học Đường</strong> đã qua kiểm duyệt chuyên môn.
            </p>
          </div>
        )}

        {/* Reply Input Bar Sticky Centered at Bottom */}
        <div className="sticky bottom-0 z-30 pt-4 pb-2 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/95 to-transparent w-full backdrop-blur-sm mt-4">
          {post.isCounselingMailbox && !(isAuthor || (userState?.isLoggedIn && (userState?.isSpecialist || userState?.mentorRoleType === 'specialist' || userState?.isCampusCounselor))) ? (
            <div className="p-4 rounded-3xl bg-emerald-900/10 dark:bg-[#1E271D] border border-emerald-600/30 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
                  🌿
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 dark:text-emerald-200">
                    Hòm Thư Tư Vấn Dành Riêng Cho Chuyên Gia Tâm Lý
                  </h4>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Chỉ Chuyên Gia Tâm Lý & Ban Cố Vấn chuyên môn mới có quyền phản hồi để bảo đảm chất lượng tham vấn và an toàn tâm lý cho học sinh.
                  </p>
                </div>
              </div>
              {onOpenPeerMentorModal && (
                <button
                  type="button"
                  onClick={onOpenPeerMentorModal}
                  className="px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shrink-0 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Đăng ký làm Chuyên gia Tâm lý</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Identity Switcher Bar in Comment Composer */}
              <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-[#1C251A]/90 border border-[#C8D2C4] dark:border-[#3A4738] shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#5A6D58] dark:text-[#8E9B8A]">Tư cách gửi:</span>
                  <button
                    type="button"
                    onClick={() => setReplyPersonaMode('anonymous')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border transition-all ${
                      replyPersonaMode === 'anonymous'
                        ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-2xs'
                        : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] border-[#DCE4D8] dark:border-[#3A4738]'
                    }`}
                  >
                    <span>🎭 Ẩn danh</span>
                  </button>
                  
                  {(!userState?.isLoggedIn || !userState?.googleUser?.email) ? (
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 bg-[#FAF9F6] dark:bg-[#20281F] text-[#8E9B8A] border border-[#DCE4D8] dark:border-[#3A4738] opacity-75"
                      title="Chế độ bình luận bằng danh tính chỉ khả dụng sau khi đăng nhập"
                    >
                      <Lock className="w-2.5 h-2.5 text-amber-600" />
                      <span>Hiện danh tính (Cần đăng nhập)</span>
                    </span>
                  ) : !isIdentityLockedForSchool ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenProfile) onOpenProfile();
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                      title="Nhấn để thiết lập & khóa danh tính tại Hồ sơ"
                    >
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span className="text-[10px]">Chưa khóa danh tính (Cần khóa để hiện tên)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReplyPersonaMode('identity')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border transition-all ${
                        replyPersonaMode === 'identity'
                          ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-2xs'
                          : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] border-[#DCE4D8] dark:border-[#3A4738]'
                      }`}
                    >
                      <img src={userAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                      <span>👤 {userDisplayName}</span>
                      {effectiveMajor && <span className="text-[9px] font-semibold text-[#2A4228] dark:text-[#8BA888]">• {effectiveMajor}</span>}
                      {effectiveCohort && <span className="text-[9px] opacity-80 font-bold">({effectiveCohort})</span>}
                    </button>
                  )}
                </div>

                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="text-[10px] text-[#2A4228] dark:text-[#8BA888] font-bold hover:underline"
                  >
                    Cài đặt hồ sơ ⚙️
                  </button>
                )}
              </div>

              {replyingTo && (
                <div className="mb-2 flex items-center justify-between px-4 py-1.5 rounded-full bg-[#2A4228] text-white text-xs font-bold shadow-md animate-fade-in max-w-fit mx-auto border border-white/20">
                  <span className="flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Đang trả lời <strong>@{replyingTo.authorName}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="ml-2.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    title="Hủy trả lời"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSubmitReply}
                className="w-full bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-full p-2 flex items-center gap-2 shadow-xl"
              >
                <div className="w-8 h-8 rounded-full bg-[#2A4228]/20 flex items-center justify-center text-[#2A4228] dark:text-[#8BA888] shrink-0 ml-1">
                  {replyPersonaMode === 'identity' ? (
                    <img src={userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : replyingTo ? (
                    <CornerDownRight className="w-4 h-4" />
                  ) : (
                    <FileEdit className="w-4 h-4" />
                  )}
                </div>

                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder={
                    replyingTo
                      ? `Viết câu trả lời cho @${replyingTo.authorName}...`
                      : replyPersonaMode === 'identity'
                      ? `Viết phản hồi với tư cách ${userDisplayName} (${effectiveCohort || 'Danh tính chính'})...`
                      : post.isCounselingMailbox
                      ? "Phản hồi với tư cách Ban Cố Vấn / Peer Mentor (Ẩn danh/Đồng hành)..."
                      : "Viết lời phản hồi ấm áp, thấu hiểu (Ẩn danh)..."
                  }
                  className="flex-1 bg-transparent text-xs sm:text-sm text-[#0F180E] dark:text-[#E8ECE6] placeholder-[#5A6D58] dark:placeholder-[#8E9B8A] focus:outline-none px-2 font-medium"
                />

                <button
                  type="submit"
                  disabled={!replyInput.trim()}
                  className="w-9 h-9 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all active:scale-90 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Zen Focus Reading Mode Fullscreen Overlay */}
      {isFocusReadingMode && (
        <div className={`fixed inset-0 z-50 overflow-y-auto p-4 sm:p-8 md:p-12 transition-colors ${activeTheme.bg} animate-fade-in`}>
          {/* Reader Control Header Bar */}
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-black/10 dark:border-white/10 select-none">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2A4228] text-white flex items-center justify-center text-sm font-bold">
                📖
              </div>
              <div>
                <h3 className={`font-serif italic font-bold text-lg ${activeTheme.textPrimary}`}>
                  Chế độ đọc tập trung
                </h3>
                <p className={`text-[10px] ${activeTheme.textMuted} font-medium`}>Không xao nhãng • Yên tĩnh • Thấu hiểu</p>
              </div>
            </div>

            {/* Customizer Controls Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Theme Selector Pills */}
              <div className={`p-1 rounded-full ${activeTheme.pillBg} flex items-center gap-1`}>
                <button
                  onClick={() => setReaderTheme('sepia')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    readerTheme === 'sepia' ? 'bg-[#2C2319] text-[#FAF6EE] shadow-2xs' : 'text-[#6E6152] hover:text-[#2C2319]'
                  }`}
                  title="Giấy ấm Sepia"
                >
                  📜 Giấy ấm
                </button>
                <button
                  onClick={() => setReaderTheme('cream')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    readerTheme === 'cream' ? 'bg-[#050A04] text-[#F4F7F3] shadow-2xs' : 'text-[#2C382A] hover:text-[#050A04]'
                  }`}
                  title="Màu kem sáng"
                >
                  🌸 Sáng
                </button>
                <button
                  onClick={() => setReaderTheme('dark')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    readerTheme === 'dark' ? 'bg-[#8BA888] text-[#121811] shadow-2xs' : 'text-[#8E9B8A] hover:text-[#E2ECE0]'
                  }`}
                  title="Đêm xoa dịu"
                >
                  🌙 Đêm
                </button>
              </div>

              {/* Font Size Adjuster */}
              <div className={`p-1 rounded-full ${activeTheme.pillBg} flex items-center gap-1 text-xs font-bold`}>
                <button
                  onClick={() => setReaderFontSize('normal')}
                  className={`px-2 py-0.5 rounded-full ${readerFontSize === 'normal' ? 'bg-[#2A4228] text-white' : activeTheme.textMuted}`}
                  title="Cỡ chữ bình thường"
                >
                  A
                </button>
                <button
                  onClick={() => setReaderFontSize('large')}
                  className={`px-2 py-0.5 rounded-full ${readerFontSize === 'large' ? 'bg-[#2A4228] text-white' : activeTheme.textMuted}`}
                  title="Cỡ chữ vừa"
                >
                  A+
                </button>
                <button
                  onClick={() => setReaderFontSize('xlarge')}
                  className={`px-2 py-0.5 rounded-full ${readerFontSize === 'xlarge' ? 'bg-[#2A4228] text-white' : activeTheme.textMuted}`}
                  title="Cỡ chữ lớn"
                >
                  A++
                </button>
              </div>

              {/* Calming Ambient Sound Synthesizer */}
              <button
                onClick={() => {
                  if (onOpenAmbientModal) {
                    onOpenAmbientModal();
                  } else {
                    toggleAmbientSound();
                  }
                }}
                className={`p-2 px-3 rounded-full border transition-all flex items-center gap-1.5 text-xs font-bold ${
                  ambientAudio.isPlaying() || isAmbientPlaying 
                    ? 'bg-[#2A4228] text-white border-[#2A4228] animate-pulse shadow-xs' 
                    : `${activeTheme.pillBg} ${activeTheme.textPrimary} border-transparent`
                }`}
                title="Chọn & Lặp giai điệu an yên"
              >
                <Music className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {ambientAudio.isPlaying() || isAmbientPlaying ? 'Đang phát Nhạc An Yên 🔄' : 'Giai điệu an yên'}
                </span>
              </button>

              {/* Exit Focus Mode Button */}
              <button
                onClick={() => {
                  setIsFocusReadingMode(false);
                  if (isAmbientPlaying) toggleAmbientSound();
                }}
                className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-700 hover:bg-rose-500 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors"
                title="Thoát chế độ tập trung"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Thoát</span>
              </button>
            </div>
          </div>

          {/* Reader Main Content Sanctuary */}
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className={`p-8 sm:p-12 rounded-3xl border shadow-md ${activeTheme.card}`}>
              {/* Author Info & Tag */}
              <div className="flex items-center justify-between gap-3 mb-6 border-b pb-4 border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-6 h-6 text-[#2A4228]" />
                  <div>
                    <h4 className={`font-bold text-sm ${activeTheme.textPrimary}`}>
                      {getFormattedAuthorName(post)} • {post.schoolName}
                    </h4>
                    <p 
                      className={`text-xs ${activeTheme.textMuted}`}
                      title={formatFullDateTime(post.createdAt || post.id)}
                    >
                      {formatRelativeTime(post.createdAt, post.timestamp, post.id)}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeTheme.accent} ${activeTheme.pillBg}`}>
                  {post.tags.join(' • ')}
                </span>
              </div>

              {/* Title */}
              <h1 className={`font-serif italic font-bold text-2xl sm:text-4xl ${activeTheme.textPrimary} mb-6 leading-tight`}>
                {post.title}
              </h1>

              {/* Main Body */}
              <div className={`font-serif ${getFontSizeClass()} ${activeTheme.textPrimary} space-y-6 whitespace-pre-line font-normal`}>
                {post.content}
              </div>

              {post.imageUrl && (
                <div className="mt-8 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10">
                  <img src={post.imageUrl} alt="" className="w-full max-h-96 object-contain bg-black/5" />
                </div>
              )}
            </div>

            {/* Quiet Replies Section */}
            <div className="space-y-4">
              <h3 className={`font-serif italic font-bold text-xl ${activeTheme.textPrimary} flex items-center gap-2`}>
                <span>Phản hồi xoa dịu ({localReplies.length})</span>
              </h3>

              {localReplies.map(reply => (
                <div key={reply.id} className={`p-6 rounded-2xl border ${activeTheme.card} space-y-2`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={activeTheme.accent}>🌿 {getFormattedReplyAuthorName(reply)}</span>
                    <span 
                      className={activeTheme.textMuted}
                      title={formatFullDateTime(reply.createdAt || reply.id)}
                    >
                      {formatRelativeTime(reply.createdAt, reply.timestamp, reply.id)}
                    </span>
                  </div>
                  <p className={`font-serif text-base sm:text-lg leading-relaxed ${activeTheme.textPrimary} pl-2 border-l-2 border-[#2A4228]/40`}>
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
