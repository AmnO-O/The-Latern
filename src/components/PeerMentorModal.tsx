import React, { useState, useRef } from 'react';
import { 
  X, 
  Users, 
  GraduationCap, 
  Globe, 
  UserCheck, 
  CheckCircle2, 
  Upload, 
  Image, 
  ShieldCheck, 
  HeartHandshake, 
  Sparkles,
  Clock,
  Trash2
} from 'lucide-react';
import { School, UserState, PeerMentorApplication } from '../types';

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
      'Áp lực học tập & Kỳ vọng gia đình',
      'Định hướng nghề nghiệp & Chọn ngành'
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
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const strengthOptions = [
    'Áp lực học tập & Kỳ vọng gia đình',
    'Khủng hoảng định hướng ngành nghề',
    'Giao tiếp & Mâu thuẫn với cha mẹ',
    'Rối bời tình cảm & Mối quan hệ',
    'Khó hòa nhập môi trường mới',
    'Cô đơn & Trầm lắng cảm xúc'
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

    const isAutoApprove = roleType === 'peer_listener';
    const newStatus: 'pending' | 'approved' = isAutoApprove ? 'approved' : 'pending';

    const application: PeerMentorApplication = {
      id: currentApp?.id || `mentor-app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      applicantId: userState.googleUser?.uid || `anon-${userState.userAnonNumber}`,
      applicantAnonId: `#${userState.userAnonNumber}`,
      applicantDisplayName: userState.displayName || `Thành viên #${userState.userAnonNumber}`,
      applicantEmail: userState.googleUser?.email,
      roleType,
      schoolId: selectedSchoolId,
      schoolName: selectedSchoolObj?.name || 'Trường học',
      isGlobalScope: roleType === 'specialist' ? isGlobalScope : false,
      status: newStatus,
      appliedAt: Date.now(),
      strengths: selectedStrengths,
      motivation: motivation.trim(),
      commitmentAccepted: true,
      specialty: roleType === 'specialist' ? specialty.trim() : undefined,
      qualificationTitle: roleType === 'specialist' ? qualificationTitle.trim() : undefined,
      certificateImageUrl: roleType === 'specialist' ? certificateImage : undefined
    };

    setTimeout(() => {
      setUserState(prev => ({
        ...prev,
        peerMentorApplication: application,
        isPeerMentor: isAutoApprove ? true : prev.isPeerMentor,
        isSpecialist: isAutoApprove ? false : (application.status === 'approved'),
        mentorRoleType: isAutoApprove ? 'peer_listener' : prev.mentorRoleType,
        userRole: isAutoApprove ? 'peer_listener' : prev.userRole
      }));

      if (onSaveApplication) {
        onSaveApplication(application);
      }

      setIsSubmitting(false);
      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-[#FCFCFA] dark:bg-[#1A2218] rounded-3xl border border-[#DCE4D8] dark:border-[#3A4738] shadow-2xl max-w-xl w-full p-5 sm:p-6.5 relative max-h-[90vh] overflow-y-auto"
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
                {roleType === 'peer_listener' 
                  ? 'Đã kích hoạt huy hiệu Bạn lắng nghe!' 
                  : 'Hồ sơ chuyên gia đã được gửi!'}
              </h2>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] max-w-md mx-auto leading-relaxed">
                {roleType === 'peer_listener' ? (
                  <>Bạn đã là <strong>Bạn lắng nghe</strong> tại <strong>{selectedSchoolObj?.name}</strong>. Hãy luôn giữ lòng thấu cảm và sự chân thành nhé.</>
                ) : (
                  <>Hồ sơ và bằng cấp của bạn đã được gửi đến Ban Quản Trị. Huy hiệu <strong>Chuyên gia tâm lý</strong> sẽ được kích hoạt ngay sau khi kiểm duyệt.</>
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-left space-y-1.5 text-xs">
              <div className="font-bold text-[#2A4228] dark:text-[#8BA888] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Quyền hạn vai trò:</span>
              </div>
              <ul className="space-y-1 text-[#3A4036] dark:text-[#C5D0C3] list-disc list-inside text-[11px] leading-relaxed">
                <li>Hiển thị huy hiệu tin cậy khi phản hồi lá thư của học sinh.</li>
                <li>Được quyền phản hồi trong <strong>Hòm Thư Tư Vấn</strong> của trường.</li>
                <li>Hỗ trợ kết nối và lắng nghe không phán xét.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Hoàn tất & Bắt đầu
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Header */}
            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#2A4228] dark:text-[#8BA888] bg-[#2A4228]/10 px-2 py-0.5 rounded-full">
                  Đồng hành & Hỗ trợ
                </span>
              </div>
              <h2 className="font-serif italic text-xl font-bold text-[#182217] dark:text-[#E8ECE6]">
                Đăng ký Đồng Hành Tâm Lý
              </h2>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5 leading-relaxed">
                Chọn vai trò phù hợp với bạn để cùng lắng nghe và chia sẻ với các bạn học sinh.
              </p>
            </div>

            {/* Role Selection (2 simple cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Peer Listener */}
              <button
                type="button"
                onClick={() => setRoleType('peer_listener')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                  roleType === 'peer_listener'
                    ? 'border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                    : 'border-[#DCE4D8] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-[#182217] dark:text-[#E8ECE6] flex items-center gap-1">
                    <span>Bạn lắng nghe</span>
                    <span className="text-[9px] bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 px-1 py-0.2 rounded font-bold">
                      Ẩn danh
                    </span>
                  </div>
                  <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5 leading-tight">
                    Dành cho học sinh/sinh viên muốn lắng nghe, không cần bằng cấp.
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
                    : 'border-[#DCE4D8] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-sky-600/15 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-[#182217] dark:text-[#E8ECE6] flex items-center gap-1">
                    <span>Chuyên gia tâm lý</span>
                    <span className="text-[9px] bg-sky-600/20 text-sky-800 dark:text-sky-300 px-1 py-0.2 rounded font-bold">
                      Duyệt bằng
                    </span>
                  </div>
                  <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5 leading-tight">
                    Dành cho cử nhân, cố vấn hoặc chuyên viên tâm lý có chứng chỉ.
                  </div>
                </div>
              </button>
            </div>

            {/* School Selector & Scope */}
            <div className="space-y-2">
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
                    <span>Sẵn sàng hỗ trợ học sinh đa trường và sảnh chung</span>
                  </label>
                </div>
              )}
            </div>

            {/* Specialist Specific Fields: Degree & Certificate Upload */}
            {roleType === 'specialist' && (
              <div className="p-3.5 rounded-2xl bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                      Học vị / Bằng cấp:
                    </label>
                    <input
                      type="text"
                      value={qualificationTitle}
                      onChange={e => setQualificationTitle(e.target.value)}
                      placeholder="VD: Cử nhân Tâm lý học, Thạc sĩ..."
                      required={roleType === 'specialist'}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-xs text-[#182217] dark:text-[#E8ECE6] focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                      Chuyên ngành / Lĩnh vực:
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={e => setSpecialty(e.target.value)}
                      placeholder="VD: Tâm lý học đường, Tham vấn..."
                      required={roleType === 'specialist'}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-xs text-[#182217] dark:text-[#E8ECE6] focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>

                {/* Certificate Proof Upload */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                    Ảnh bằng cấp / Chứng chỉ / Thẻ chuyên môn:
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {certificateImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-sky-500/30 max-w-xs">
                      <img 
                        src={certificateImage} 
                        alt="Bằng cấp" 
                        className="w-full h-32 object-cover bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setCertificateImage(undefined)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                        title="Gỡ ảnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-xl border border-dashed border-sky-500/40 bg-white/60 dark:bg-black/20 hover:bg-sky-500/10 text-xs font-semibold text-sky-800 dark:text-sky-300 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Tải ảnh minh chứng (Bằng cấp, Chứng chỉ, Thẻ ngành)</span>
                    </button>
                  )}
                  <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">
                    * Ảnh chỉ được xem bởi Ban Quản Trị để xác thực hồ sơ và không hiển thị công khai.
                  </p>
                </div>
              </div>
            )}

            {/* Strengths & Focus Areas */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                Chủ đề bạn tự tin hỗ trợ nhất:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {strengthOptions.map(opt => {
                  const isChecked = selectedStrengths.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleToggleStrength(opt)}
                      className={`text-[11px] px-3 py-1.5 rounded-full font-semibold border transition-all ${
                        isChecked
                          ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-xs'
                          : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#485346] dark:text-[#8E9B8A] border-[#DCE4D8] dark:border-[#3A4738] hover:border-[#2A4228]'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Motivation */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                Đôi dòng giới thiệu / Kinh nghiệm:
              </label>
              <textarea
                value={motivation}
                onChange={e => setMotivation(e.target.value)}
                placeholder="Chia sẻ ngắn về mong muốn lắng nghe hoặc kinh nghiệm hỗ trợ của bạn..."
                rows={2}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] rounded-xl p-2.5 text-xs text-[#182217] dark:text-[#E8ECE6] placeholder-[#8E9B8A] focus:outline-none focus:ring-1 focus:ring-[#2A4228] resize-none leading-relaxed"
              />
            </div>

            {/* Ethics Checkbox */}
            <div className="p-3 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738]">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-[#2A4228] w-4 h-4 rounded"
                />
                <div className="text-[11px] text-[#2C382A] dark:text-[#8E9B8A] leading-relaxed">
                  <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">Cam kết bảo mật & lắng nghe:</span> Luôn lắng nghe chân thành, bảo mật danh tính tuyệt đối và không phán xét.
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
                Để sau
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !agreeTerms || (roleType === 'specialist' && !qualificationTitle.trim())}
                className="px-5 py-2 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>{roleType === 'peer_listener' ? 'Kích hoạt vai trò' : 'Gửi hồ sơ duyệt'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

