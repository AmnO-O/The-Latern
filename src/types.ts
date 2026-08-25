export type SchoolType = 'highschool' | 'university';

export interface School {
  id: string;
  name: string;
  slug: string;
  type: SchoolType;
  logoUrl?: string;
  coverUrl?: string;
  letterCount: number;
  newCount: number;
  verifiedCount: number;
  location: string;
}

export type AuthorRole = 'student' | 'alumni' | 'peer_listener' | 'counselor' | 'expert' | 'ai_lantern';

export interface Reply {
  id: string;
  postId: string;
  authorUid?: string;
  authorName: string;
  authorRole: AuthorRole;
  authorAvatar?: string;
  isVerifiedBadge?: boolean;
  authorReputationScore?: number;
  isOP?: boolean; // True if this reply was authored by the original poster (Chủ thớt)
  timestamp: string;
  createdAt?: number;
  content: string;
  hugsCount: number;
  isHugged?: boolean;
  replyToAuthor?: string;
  replyToId?: string;
  likesCount?: number;
  isLiked?: boolean;
  isIdentityPublic?: boolean; // True if replying with real identity
  authorDisplayName?: string;
  authorCohort?: string; // Niên khóa / Khóa học (e.g., K22, 2022 - 2026)
  authorMajor?: string; // Chuyên ngành (e.g., CNTT, Kinh tế đối ngoại)
}

export interface ImageAnalysisResult {
  summary: string;
  textExtracted?: string;
  emotionalTone?: string;
  empatheticAdvice?: string;
  keyObjects?: string[];
  isSafe?: boolean;
}

export interface Post {
  id: string;
  authorUid?: string;
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  authorAnonId: string;
  authorRole: AuthorRole;
  authorClassBadge?: string;
  authorReputationScore?: number;
  timestamp: string;
  createdAt?: number;
  expiresAt?: number; // Timestamp when post auto-expires and is purged from Firestore
  expiryDurationDays?: number; // 1, 7, 14, or 0 (permanent)
  isAnonymousGuest?: boolean; // True if posted without logging in
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
  hugsCount: number;
  repliesCount: number;
  isLiked?: boolean;
  isHugged?: boolean;
  isSaved?: boolean;
  status: 'approved' | 'flagged' | 'pending_review';
  flagReason?: string;
  crisisDetected?: boolean;
  isPublic?: boolean; // true = Sảnh chung công khai toàn quốc; false = Chỉ trong Hộp thư Trường
  isCounselingMailbox?: boolean; // true = Hòm thư tư vấn tâm lý trường (Bảo mật 100% ẩn danh, chỉ cố vấn/peer mentor trả lời)
  counselorReplyOnly?: boolean;
  imageUrl?: string;
  imageAnalysis?: ImageAnalysisResult;
  isIdentityPublic?: boolean; // True if posted with real identity (shows real name, avatar, and cohort)
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  authorCohort?: string; // Niên khóa / Khóa học (ví dụ: K22, Niên khóa 2022 - 2026, Lớp 12A1 / K23-26)
  authorMajor?: string; // Chuyên ngành / Khối lớp (ví dụ: Công nghệ thông tin, Chuyên Toán...)
  replies: Reply[];
}

export interface DirectMessage {
  id: string;
  senderName: string;
  senderRole: AuthorRole;
  text: string;
  timestamp: string;
  createdAt?: number;
  isMe: boolean;
  isRevoked?: boolean; // Thu hồi / Gỡ đối với mọi người (Unsent / Revoked)
  revokedAt?: string;
  editedAt?: string;
}

export interface DirectThread {
  id: string;
  peerName: string;
  peerRole: AuthorRole;
  roleTitle: string; // e.g. "Người lắng nghe tích cực", "Cô H. - Tư vấn tâm lý", "Tác giả lá thư"
  isOnline: boolean;
  statusText: string; // e.g. "Đang online", "Vắng mặt"
  unreadCount: number;
  messages: DirectMessage[];
  threadType?: 'ai' | 'letter_author' | 'peer_listener' | 'expert';
  relatedPostId?: string;
  relatedPostTitle?: string;
  relatedPostSnippet?: string;
  relatedSchoolName?: string;
}

export type ActiveTab = 
  | 'landing'
  | 'explore' 
  | 'feed' 
  | 'globe'
  | 'post_detail' 
  | 'messages' 
  | 'my_mailboxes' 
  | 'profile' 
  | 'verify' 
  | 'emergency' 
  | 'mentor_dashboard' 
  | 'moderation_queue';

export interface SchoolVerificationRecord {
  schoolId: string;
  schoolName: string;
  schoolType: SchoolType;
  verifiedAt: number;
  method: 'gemini_ocr' | 'edu_email' | 'campus_token';
  role: 'student' | 'alumni';
  emailUsed?: string;
  badgeTitle?: string;
  studentName?: string; // Tên thật do AI OCR trích xuất và khóa
  major?: string; // Chuyên ngành / Khối lớp do AI trích xuất và khóa
  cohort?: string; // Niên khóa / Khóa học do AI trích xuất và khóa (e.g., "K22", "Khóa 2022 - 2026")
  studentIdMasked?: string; // Mã số sinh viên đã mã hóa bảo mật
  isIdentityLocked?: boolean; // Khóa chống sửa đổi thông tin thật
}

export interface PeerMentorApplication {
  schoolId: string;
  schoolName: string;
  status: 'pending' | 'approved';
  appliedAt: number;
  strengths: string[];
  motivation: string;
  commitmentAccepted: boolean;
}

export interface UserState {
  isLoggedIn: boolean;
  userRole: 'student' | 'peer_listener' | 'mentor' | 'admin_moderator';
  selectedSchool?: School;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  userAnonNumber: number;
  hugsGivenCount: number;
  hugsReceivedCount?: number;
  reputationScore?: number; // Initial 2, verified => 10, +1 per 4 hugs received
  baseScoreBonus?: number;
  verifiedSchools?: School[];
  schoolVerifications?: Record<string, SchoolVerificationRecord>;
  isSyncingWithCloud?: boolean;
  lastCloudSyncTimestamp?: number;
  // Public Identity Profile Settings
  displayName?: string; // Tên hiển thị thật khi công khai danh tính
  customAvatarUrl?: string; // Avatar cá nhân do người dùng chọn hoặc tải lên
  defaultCohort?: string; // Niên khóa mặc định (e.g., "K22", "2023 - 2026")
  schoolCohorts?: Record<string, string>; // Niên khóa riêng theo từng trường (schoolId -> cohort)
  activePostingMode?: 'anonymous' | 'identity'; // Chế độ đăng mặc định (Ẩn danh vs Danh tính chính)
  // AI-Verified & Tamper-Proof Identity (Chống sửa đổi)
  verifiedFullName?: string; // Tên thật trích xuất từ thẻ AI (khóa cố định)
  verifiedMajor?: string; // Chuyên ngành trích xuất từ thẻ AI (khóa cố định)
  verifiedCohort?: string; // Niên khóa trích xuất từ thẻ AI (khóa cố định)
  isIdentityLocked?: boolean; // Cờ khóa danh tính chống sửa đổi
  // Peer Mentor / Campus Counselor status
  peerMentorApplication?: PeerMentorApplication;
  isPeerMentor?: boolean;
  isCampusCounselor?: boolean;
  googleUser?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  };
}

export interface LanternNotification {
  id: string;
  type: 'reply' | 'tag' | 'counselor_response' | 'hug';
  postId: string;
  postTitle: string;
  senderName: string;
  senderRole?: AuthorRole;
  message: string;
  createdAt: number;
  isRead: boolean;
  replyId?: string;
  schoolName?: string;
}
