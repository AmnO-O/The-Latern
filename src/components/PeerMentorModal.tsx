import React, { useState, useRef } from 'react';
import { 
  X, 
  Users, 
  GraduationCap, 
  Globe, 
  UserCheck, 
  CheckCircle2, 
  Upload, 
  ShieldCheck, 
  HeartHandshake, 
  Clock,
  Trash2,
  FileText,
  Eye,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  Brain,
  MessageSquareHeart,
  Lightbulb
} from 'lucide-react';
import { School, UserState, PeerMentorApplication } from '../types';

interface EthicsQuestionPrompt {
  id: string;
  category: string;
  question: string;
  hint: string;
}

const DEFAULT_ETHICS_QUESTION: EthicsQuestionPrompt = {
  id: 'ethics_dilemma_1',
  category: 'Đạo đức & Tư duy lắng nghe (Ethics & Mindset)',
  question: 'Một bạn ẩn danh tâm sự đang chịu áp lực nặng nề và có suy nghĩ trốn tránh thực tại hoặc làm điều tiêu cực, nhưng nài nỉ bạn "xin hãy giữ bí mật tuyệt đối và đừng nói với bất kỳ ai, kể cả thầy cô hay chuyên gia". Bạn sẽ phân định ranh giới giữa "Tôn trọng sự riêng tư" và "Bảo vệ an toàn tính mạng" như thế nào?',
  hint: 'Hãy chia sẻ ngắn gọn góc nhìn đạo đức của bạn: Bạn sẽ nói gì để trấn an và bạn sẽ xử lý tình huống khó xử này ra sao?'
};

const SAMPLE_PROMPT_TOPICS: EthicsQuestionPrompt[] = [
  DEFAULT_ETHICS_QUESTION,
  {
    id: 'ethics_dilemma_2',
    category: 'Xung đột giá trị quan & Định kiến xã hội',
    question: 'Khi lắng nghe một bạn có quan điểm sống, lối sống hoặc hành động hoàn toàn trái ngược với hệ giá trị đạo đức cá nhân của bạn, bạn sẽ làm gì để giữ được thái độ lắng nghe trung lập, thấu cảm mà không áp đặt hay phán xét?',
    hint: 'Chia sẻ tư duy của bạn về việc tách biệt cảm xúc cá nhân với vai trò người đồng hành an toàn.'
  },
  {
    id: 'ethics_dilemma_3',
    category: 'Ranh giới thẩm quyền & Trách nhiệm cảm xúc',
    question: 'Nhiều người tìm đến Người Lắng Nghe với kỳ vọng nhận được một "đáp án cho cuộc đời" hoặc giải pháp tức thì. Theo bạn, ranh giới giữa "Lắng nghe nâng đỡ cảm xúc" và "Can thiệp, quyết định thay cuộc đời người khác" nằm ở đâu?',
    hint: 'Góc nhìn của bạn về việc giúp họ tự tìm thấy sức mạnh nội tại thay vì phụ thuộc tâm lý.'
  }
];

interface PeerMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  setUserState: React.Dispatch<React.SetStateAction<UserState>>;
  schools: School[];
  onSaveApplication?: (application: PeerMentorApplication) => void;
  onSuccess?: () => void;
}

export const PeerMentorModal: React.FC<PeerMentorModalProps> = ({
  isOpen,
  onClose,
  userState,
  setUserState,
  schools,
  onSaveApplication,
  onSuccess
}) => {
  const verifiedList = userState.verifiedSchools || (userState.selectedSchool ? [userState.selectedSchool] : []);
  const defaultSchoolId = verifiedList[0]?.id || schools[0]?.id || 'neu';

  // Current application from userState
  const currentApp = userState.peerMentorApplication;

  const [roleType, setRoleType] = useState<'peer_listener' | 'specialist'>(
    currentApp?.roleType || 'peer_listener'
  );
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentApp?.schoolId || defaultSchoolId
  );
  const [isGlobalScope, setIsGlobalScope] = useState<boolean>(
    currentApp?.isGlobalScope ?? true
  );
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>(
    currentApp?.strengths || [
      'Áp lực học tập & Thi cử',
      'Định hướng ngành nghề'
    ]
  );
  const [specialty, setSpecialty] = useState(currentApp?.specialty || '');
  const [qualificationTitle, setQualificationTitle] = useState(
    currentApp?.qualificationTitle || ''
  );
  const [motivation, setMotivation] = useState(currentApp?.motivation || '');
  const [certificateImage, setCertificateImage] = useState<string | undefined>(
    currentApp?.certificateImageUrl
  );
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  
  // Open-ended Ethics & Societal Mindset Question State
  const [selectedEthicsTopicId, setSelectedEthicsTopicId] = useState<string>(
    currentApp?.ethicsQuestion ? (SAMPLE_PROMPT_TOPICS.find(t => t.question === currentApp.ethicsQuestion)?.id || DEFAULT_ETHICS_QUESTION.id) : DEFAULT_ETHICS_QUESTION.id
  );
  const [ethicsAnswer, setEthicsAnswer] = useState<string>(currentApp?.ethicsAnswer || '');

  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentEthicsTopic = SAMPLE_PROMPT_TOPICS.find(t => t.id === selectedEthicsTopicId) || DEFAULT_ETHICS_QUESTION;

  const strengthOptions = [
    'Áp lực học tập & Thi cử',
    'Khủng hoảng định hướng',
    'Mâu thuẫn gia đình',
    'Tình cảm & Mối quan hệ',
    'Hòa nhập môi trường mới',
    'Cô đơn & Trầm lắng'
  ];

  const handleToggleStrength = (strength: string) => {
    setSelectedStrengths(prev => 
      prev.includes(strength) ? prev.filter(s => s !== strength) : [...prev, strength]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh dung lượng dưới 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCertificateImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedSchoolObj = schools.find(s => s.id === selectedSchoolId) || schools[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    setIsSubmitting(true);

    // Both roles go through admin review queue with open-ended ethics thought
    const application: PeerMentorApplication = {
      id: currentApp?.id || `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      applicantId: userState.googleUser?.uid || `anon-${userState.userAnonNumber}`,
      applicantAnonId: `#${userState.userAnonNumber}`,
      applicantDisplayName: userState.displayName || `Thành viên #${userState.userAnonNumber}`,
      applicantEmail: userState.googleUser?.email,
      roleType,
      schoolId: selectedSchoolId,
      schoolName: selectedSchoolObj?.name || 'Trường học',
      isGlobalScope: roleType === 'specialist' ? isGlobalScope : false,
      status: 'pending',
      appliedAt: Date.now(),
      strengths: selectedStrengths,
      motivation: motivation.trim(),
      commitmentAccepted: true,
      specialty: roleType === 'specialist' ? specialty.trim() : undefined,
      qualificationTitle: roleType === 'specialist' ? qualificationTitle.trim() : undefined,
      certificateImageUrl: roleType === 'specialist' ? certificateImage : undefined,
      ethicsQuestion: currentEthicsTopic.question,
      ethicsAnswer: ethicsAnswer.trim() || undefined
    };

    setTimeout(() => {
      setUserState(prev => {
        const existingVerified = prev.verifiedSchools || [];
        const hasSchool = existingVerified.some(s => s.id === selectedSchoolId);
        const updatedVerified = (hasSchool || !selectedSchoolObj) ? existingVerified : [...existingVerified, selectedSchoolObj];

        return {
          ...prev,
          verifiedSchools: updatedVerified,
          peerMentorApplication: application,
          isPeerMentor: prev.isPeerMentor,
          mentorRoleType: prev.mentorRoleType
        };
      });

      if (onSaveApplication) {
        onSaveApplication(application);
      }

      setIsSubmitting(false);
      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-[#FCFCFA] dark:bg-[#1A2218] rounded-3xl border border-[#DCE4D8] dark:border-[#3A4738] shadow-2xl max-w-lg w-full p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628] transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedSuccess ? (
          <div className="text-center py-6 space-y-4 animate-scale-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="font-serif italic text-xl font-bold text-[#182217] dark:text-[#E8ECE6]">
                Đã gửi hồ sơ đăng ký!
              </h2>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] max-w-md mx-auto leading-relaxed">
                Hồ sơ ứng tuyển <strong>{roleType === 'specialist' ? 'Chuyên gia tâm lý' : 'Người lắng nghe'}</strong> của bạn đã được gửi đến Ban Quản Trị. Bạn sẽ nhận được thông báo ngay khi hồ sơ được duyệt.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-left space-y-1.5 text-xs">
              <div className="font-bold text-[#2A4228] dark:text-[#8BA888] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Trạng thái: Đang chờ duyệt (Pending)</span>
              </div>
              <p className="text-[#3A4036] dark:text-[#C5D0C3] text-[11px] leading-relaxed">
                {roleType === 'specialist' 
                  ? 'Admin sẽ kiểm tra ảnh bằng cấp/chứng chỉ của bạn để kích hoạt huy hiệu Chuyên gia.'
                  : 'Admin sẽ duyệt hồ sơ để đảm bảo môi trường chia sẻ an toàn và lành mạnh.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#2A4228] dark:text-[#8BA888] bg-[#2A4228]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3" />
                  <span>Đồng hành tâm lý</span>
                </span>
              </div>
              <h2 className="font-serif italic text-xl font-bold text-[#182217] dark:text-[#E8ECE6]">
                Đăng ký Đồng Hành
              </h2>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5 leading-relaxed">
                Chọn vai trò để cùng lắng nghe, tư vấn và hỗ trợ bạn bè học đường.
              </p>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Peer Listener */}
              <button
                type="button"
                onClick={() => setRoleType('peer_listener')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                  roleType === 'peer_listener'
                    ? 'border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                    : 'border-[#DCE4D8] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-[#182217] dark:text-[#E8ECE6] flex items-center gap-1">
                    <span>Người lắng nghe</span>
                  </div>
                  <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5 leading-tight">
                    Học sinh/sinh viên muốn chia sẻ, không cần bằng cấp.
                  </div>
                </div>
              </button>

              {/* Option 2: Psychologist / Specialist */}
              <button
                type="button"
                onClick={() => setRoleType('specialist')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                  roleType === 'specialist'
                    ? 'border-sky-600 bg-sky-500/10 dark:bg-sky-950/30 ring-1 ring-sky-600'
                    : 'border-[#DCE4D8] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-sky-600/15 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-[#182217] dark:text-[#E8ECE6] flex items-center gap-1">
                    <span>Chuyên gia tâm lý</span>
                    <span className="text-[9px] bg-sky-600/20 text-sky-800 dark:text-sky-300 px-1 rounded font-bold">
                      Duyệt bằng
                    </span>
                  </div>
                  <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5 leading-tight">
                    Cử nhân, cố vấn, bác sĩ tâm lý có chứng chỉ.
                  </div>
                </div>
              </button>
            </div>

            {/* School Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                Trường đại diện:
              </label>
              <select
                value={selectedSchoolId}
                onChange={e => setSelectedSchoolId(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] rounded-xl p-2.5 text-xs text-[#182217] dark:text-[#E8ECE6] font-medium focus:outline-none focus:ring-1 focus:ring-[#2A4228]"
              >
                {schools.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>

              {roleType === 'specialist' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="globalScopeCheck"
                    checked={isGlobalScope}
                    onChange={e => setIsGlobalScope(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#2A4228] cursor-pointer"
                  />
                  <label htmlFor="globalScopeCheck" className="text-xs text-[#2A4228] dark:text-[#8BA888] font-medium cursor-pointer flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Hỗ trợ học sinh đa trường & Sảnh chung</span>
                  </label>
                </div>
              )}
            </div>

            {/* Specialist Certificate & Details */}
            {roleType === 'specialist' && (
              <div className="p-3.5 rounded-2xl bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                      Bằng cấp / Học vị:
                    </label>
                    <input
                      type="text"
                      value={qualificationTitle}
                      onChange={e => setQualificationTitle(e.target.value)}
                      placeholder="VD: Cử nhân Tâm lý, Thạc sĩ..."
                      required={roleType === 'specialist'}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-xs text-[#182217] dark:text-[#E8ECE6] focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                      Chuyên ngành:
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={e => setSpecialty(e.target.value)}
                      placeholder="VD: Tham vấn học đường..."
                      required={roleType === 'specialist'}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-xs text-[#182217] dark:text-[#E8ECE6] focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>Ảnh Bằng cấp / Chứng chỉ / Thẻ ngành:</span>
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {certificateImage ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-[#20281F] border border-sky-500/30">
                      <img 
                        src={certificateImage} 
                        alt="Bằng cấp" 
                        className="w-16 h-12 object-cover rounded-lg bg-slate-100 cursor-pointer"
                        onClick={() => setPreviewModalImage(certificateImage)}
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã tải ảnh lên</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewModalImage(certificateImage)}
                          className="text-[11px] text-sky-600 hover:underline flex items-center gap-0.5 mt-0.5"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Xem ảnh lớn</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCertificateImage(undefined)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-sky-500/40 bg-white/60 dark:bg-black/20 hover:bg-sky-500/10 text-xs font-semibold text-sky-800 dark:text-sky-300 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Tải ảnh bằng cấp / chứng chỉ để Admin duyệt</span>
                    </button>
                  )}
                  <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">
                    * Ảnh bằng cấp chỉ hiển thị cho Admin duyệt và được bảo mật tuyệt đối.
                  </p>
                </div>
              </div>
            )}

            {/* Strengths */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                Thế mạnh hỗ trợ:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {strengthOptions.map(opt => {
                  const isChecked = selectedStrengths.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleToggleStrength(opt)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all ${
                        isChecked
                          ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-2xs'
                          : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#485346] dark:text-[#8E9B8A] border-[#DCE4D8] dark:border-[#3A4738]'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Open-ended Ethics & Societal Mindset Question (Câu hỏi mở về tư duy & đạo đức lắng nghe) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Câu hỏi mở về Tư duy & Đạo đức Lắng nghe (Ethics & Mindset)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200">
                  Admin xem xét
                </span>
              </div>

              <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A] leading-relaxed">
                Để Ban Quản Trị hiểu được tư duy thấu cảm và góc nhìn đạo đức xã hội của bạn trước khi phê duyệt quyền Người Lắng Nghe:
              </p>

              {/* Topic Selector Tabs */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-[#182217] dark:text-[#E8ECE6] flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chọn 1 chủ đề tình huống bạn muốn bày tỏ quan điểm:</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {SAMPLE_PROMPT_TOPICS.map((topic, idx) => {
                    const isSelected = selectedEthicsTopicId === topic.id;
                    return (
                      <button
                        type="button"
                        key={topic.id}
                        onClick={() => setSelectedEthicsTopicId(topic.id)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100 shadow-2xs font-semibold'
                            : 'bg-white dark:bg-[#20281F] border-[#DCE4D8] dark:border-[#3A4738] text-[#3A4036] dark:text-[#C5D0C3] hover:border-amber-400'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5 ${
                          isSelected
                            ? 'bg-amber-600 text-white'
                            : 'bg-black/10 dark:bg-white/10 text-[#485346] dark:text-[#8E9B8A]'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="text-[11px] font-bold">
                            {topic.category}
                          </div>
                          <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] line-clamp-2">
                            {topic.question}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Topic Details */}
              <div className="p-3 rounded-xl bg-white dark:bg-[#20281F] border border-amber-500/20 space-y-2">
                <div className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] leading-snug">
                  ❓ {currentEthicsTopic.question}
                </div>
                <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] italic flex items-center gap-1">
                  <span>💡 Gợi ý:</span>
                  <span>{currentEthicsTopic.hint}</span>
                </div>

                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-[#182217] dark:text-[#E8ECE6] mb-1">
                    Góc nhìn & Cách xử lý của bạn: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={ethicsAnswer}
                    onChange={e => setEthicsAnswer(e.target.value)}
                    placeholder="Viết câu trả lời ngắn gọn (2-5 câu) chia sẻ suy nghĩ và giải pháp của bạn..."
                    rows={4}
                    required
                    className="w-full bg-[#FAF9F6] dark:bg-[#1A2218] border border-[#DCE4D8] dark:border-[#3A4738] rounded-xl p-2.5 text-xs text-[#182217] dark:text-[#E8ECE6] placeholder-[#8E9B8A] focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
                  />
                  <div className="text-[10px] text-right text-[#8E9B8A] mt-0.5">
                    {ethicsAnswer.length} ký tự (Admin sẽ đọc để duyệt hồ sơ)
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                Giới thiệu ngắn / Lý do muốn đồng hành:
              </label>
              <textarea
                value={motivation}
                onChange={e => setMotivation(e.target.value)}
                placeholder="Chia sẻ ngắn về mong muốn lắng nghe hoặc kinh nghiệm tư vấn của bạn..."
                rows={2}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] rounded-xl p-2.5 text-xs text-[#182217] dark:text-[#E8ECE6] placeholder-[#8E9B8A] focus:outline-none focus:ring-1 focus:ring-[#2A4228] resize-none leading-relaxed"
              />
            </div>

            {/* Ethics Checkbox */}
            <div className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738]">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-[#2A4228] w-4 h-4 rounded"
                />
                <div className="text-[11px] text-[#2C382A] dark:text-[#8E9B8A] leading-relaxed">
                  <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">Cam kết:</span> Lắng nghe chân thành, bảo mật và không phán xét.
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5E2D9] dark:border-[#3A4738]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-[#DCE4D8] dark:border-[#3A4738] text-xs font-semibold text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-[#FAF9F6] dark:hover:bg-[#20281F] transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !agreeTerms || (roleType === 'specialist' && !qualificationTitle.trim())}
                className="px-5 py-2 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Gửi hồ sơ duyệt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Certificate Image Lightbox Modal */}
        {previewModalImage && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewModalImage(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img 
                src={previewModalImage} 
                alt="Minh chứng bằng cấp" 
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

