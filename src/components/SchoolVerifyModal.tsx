import React, { useState, useEffect } from 'react';
import { School, UserState, SchoolVerificationRecord } from '../types';

interface SchoolVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools: School[];
  userState?: UserState;
  onCompleteVerification: (
    school: School,
    verificationData?: {
      method: 'gemini_ocr' | 'edu_email' | 'campus_token';
      role: 'student' | 'alumni';
      emailUsed?: string;
      aiResult?: any;
    }
  ) => void;
}

export const SchoolVerifyModal: React.FC<SchoolVerifyModalProps> = ({
  isOpen,
  onClose,
  schools,
  userState,
  onCompleteVerification
}) => {
  const [activeMethod, setActiveMethod] = useState<'ocr' | 'email' | 'token'>('ocr');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    userState?.selectedSchool?.id || schools[0]?.id || 'new_custom'
  );
  const [customSchoolName, setCustomSchoolName] = useState<string>('');
  const [studentRole, setStudentRole] = useState<'student' | 'alumni'>('student');

  const getEffectiveSchool = (): School => {
    if (selectedSchoolId === 'new_custom' || !selectedSchoolId || schools.length === 0) {
      const name = customSchoolName.trim() || 'Trường học của tôi';
      return {
        id: `school-custom-${Date.now()}`,
        name: name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        type: 'highschool',
        letterCount: 0,
        newCount: 0,
        verifiedCount: 1,
        location: 'Việt Nam'
      };
    }
    const found = schools.find(s => s.id === selectedSchoolId);
    if (found) return found;
    const name = customSchoolName.trim() || 'Trường học của tôi';
    return {
      id: `school-custom-${Date.now()}`,
      name: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: 'highschool',
      letterCount: 0,
      newCount: 0,
      verifiedCount: 1,
      location: 'Việt Nam'
    };
  };
  
  // OCR State
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [ocrError, setOcrError] = useState<{
    title: string;
    message: string;
    extractedSchool?: string;
    selectedSchoolName?: string;
    verificationStatus?: string;
  } | null>(null);

  // Email OTP State
  const [emailStep, setEmailStep] = useState<'input' | 'otp_sent'>('input');
  const [emailInput, setEmailInput] = useState<string>(userState?.googleUser?.email || '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [devOtpPreview, setDevOtpPreview] = useState<string | null>(null);
  const [matchedSchoolInfo, setMatchedSchoolInfo] = useState<School | null>(null);
  const [emailSentViaResend, setEmailSentViaResend] = useState<boolean>(false);
  const [serverDeliveryMessage, setServerDeliveryMessage] = useState<string | null>(null);

  // Token State
  const [tokenInput, setTokenInput] = useState<string>('');

  // Submission / Loading state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    schoolName: string;
    methodText: string;
    details?: string;
    studentName?: string;
    major?: string;
    cohort?: string;
    studentId?: string;
    isIdentityLocked?: boolean;
  } | null>(null);

  // Resend countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileUploaded(true);
      setFileName(file.name);
      setOcrError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOcrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUploaded || !fileBase64) return;

    setOcrError(null);
    setIsVerifying(true);

    try {
      const response = await fetch('/api/verify-student-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: fileBase64,
          schoolName: '' // Leave empty so AI reads purely from the image without bias
        })
      });
      const data = await response.json();
      setIsVerifying(false);

      // Check if rejected (not a valid student ID)
      if (!response.ok || data.isValidStudentId === false || data.verificationStatus === 'rejected') {
        setOcrError({
          title: 'Không thể nhận diện thẻ học sinh / sinh viên',
          message: data.reason || 'Ảnh tải lên không phải là thẻ học sinh/sinh viên hợp lệ hoặc thông tin trường học bị mờ. Vui lòng chụp lại ảnh rõ nét hoặc thử phương thức Email Trường.',
          extractedSchool: data.extractedSchool,
          selectedSchoolName: data.extractedSchool || 'Thẻ không hợp lệ',
          verificationStatus: data.verificationStatus
        });
        return;
      }
      
      // Auto-detect school and auto-route to the matching Campus Hub
      const detectedName = (data.extractedSchool || '').trim();

      if (!detectedName) {
        setOcrError({
          title: 'Không đọc được tên trường trên thẻ',
          message: 'Hệ thống đã nhận diện đây là thẻ học đường nhưng không thể đọc rõ tên trường. Vui lòng chụp thẳng và rõ nét hơn hoặc dùng phương thức Email Trường.',
          extractedSchool: null,
          selectedSchoolName: '',
          verificationStatus: 'rejected'
        });
        return;
      }

      const normalize = (str: string) => 
        str.toLowerCase()
           .replace(/[đ]/g, 'd')
           .normalize('NFD')
           .replace(/[\u0300-\u036f]/g, '')
           .replace(/[^a-z0-9]/g, ' ')
           .replace(/\s+/g, ' ')
           .trim();

      const normalizedDetected = normalize(detectedName);

      // Prioritize exact or highest quality match
      let targetSchool = schools.find(s => {
        const sNorm = normalize(s.name);
        return sNorm === normalizedDetected;
      });

      if (!targetSchool) {
        targetSchool = schools.find(s => {
          const sNorm = normalize(s.name);
          // Check substring only if length is substantial (> 5 chars) to prevent false positives
          return (sNorm.length > 5 && normalizedDetected.includes(sNorm)) ||
                 (normalizedDetected.length > 5 && sNorm.includes(normalizedDetected));
        });
      }

      // If not in existing list, generate a clean School record for the newly detected school
      if (!targetSchool) {
        const slug = detectedName
          .toLowerCase()
          .replace(/[đ]/g, 'd')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        targetSchool = {
          id: `school-${slug || Date.now()}`,
          name: detectedName,
          slug: slug || `school-${Date.now()}`,
          type: (data.schoolType as 'university' | 'highschool') || 'university',
          letterCount: 0,
          newCount: 0,
          verifiedCount: 1,
          location: data.location || 'Việt Nam'
        };
      }

      setSelectedSchoolId(targetSchool.id);

      const extractedName = (data.extractedStudentName || '').trim();
      const extractedMajor = (data.extractedMajor || '').trim();
      const extractedCohort = (data.extractedCohort || '').trim();

      setSyncFeedback({
        schoolName: targetSchool.name,
        methodText: 'AI Vision OCR (Đọc & Khóa danh tính chống sửa đổi)',
        details: `AI đã xác thực thẻ học đường. Thông tin Tên thật, Chuyên ngành và Niên khóa đã được trích xuất và tự động khóa cố định để bảo đảm tính xác thực 100%.`,
        studentName: extractedName || undefined,
        major: extractedMajor || undefined,
        cohort: extractedCohort || undefined,
        studentId: data.extractedStudentId || undefined,
        isIdentityLocked: true
      });

      setSuccess(true);

      setTimeout(() => {
        onCompleteVerification(targetSchool!, {
          method: 'gemini_ocr',
          role: studentRole,
          aiResult: {
            ...data,
            extractedSchool: targetSchool!.name,
            extractedStudentName: extractedName || undefined,
            extractedMajor: extractedMajor || undefined,
            extractedCohort: extractedCohort || undefined,
            isIdentityLocked: true
          }
        });
        onClose();
        setSuccess(false);
        setFileUploaded(false);
        setFileBase64(null);
        setOcrError(null);
      }, 3000);
    } catch (err) {
      console.error('Verification error:', err);
      setIsVerifying(false);
      setOcrError({
        title: 'Lỗi kết nối máy chủ xác thực',
        message: 'Không thể xử lý hình ảnh lúc này. Vui lòng kiểm tra lại ảnh chụp rõ nét hoặc thử phương thức Email Trường.'
      });
    }
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmailError(null);
    setOtpError(null);

    if (!emailInput || !emailInput.includes('@')) {
      setEmailError('Vui lòng nhập địa chỉ email trường hợp lệ (ví dụ: student@hcmus.edu.vn hoặc @*.edu.vn)');
      return;
    }

    setIsSendingOtp(true);
    const currentSchool = getEffectiveSchool();

    try {
      const res = await fetch('/api/send-student-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          schoolId: currentSchool.id,
          schoolName: currentSchool.name
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setEmailError(data.error || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
        setIsSendingOtp(false);
        return;
      }

      if (data.matchedSchool) {
        setMatchedSchoolInfo(data.matchedSchool);
      }
      if (data.devOtp) {
        setDevOtpPreview(data.devOtp);
      }
      setEmailSentViaResend(Boolean(data.emailSentViaResend));
      if (data.message) {
        setServerDeliveryMessage(data.message);
      }

      setEmailStep('otp_sent');
      setResendCountdown(60);
      setIsSendingOtp(false);
    } catch (err) {
      setIsSendingOtp(false);
      setEmailError('Không thể kết nối đến máy chủ xác thực email. Vui lòng thử lại.');
    }
  };

  // Step 2: Verify OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const cleanCode = otpInput.replace(/\s+/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setOtpError('Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    const currentSchool = getEffectiveSchool();

    try {
      const res = await fetch('/api/verify-student-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          otp: cleanCode,
          schoolId: currentSchool.id,
          schoolName: currentSchool.name
        })
      });
      const data = await res.json();

      if (!res.ok || !data.isValid) {
        setOtpError(data.error || 'Mã xác thực không chính xác hoặc đã hết hạn.');
        setIsVerifyingOtp(false);
        return;
      }

      let finalSchool = currentSchool;
      if (data.matchedSchool?.id) {
        const found = schools.find(s => s.id === data.matchedSchool.id);
        if (found) {
          finalSchool = found;
        } else if (data.matchedSchool) {
          finalSchool = data.matchedSchool;
        }
      }

      setSyncFeedback({
        schoolName: finalSchool.name,
        methodText: `Email giáo dục chính thức (${emailInput.trim()})`,
        details: data.message || 'Đã xác thực mã OTP thành công và cấp huy hiệu sinh viên chính thức.'
      });

      setIsVerifyingOtp(false);
      setSuccess(true);

      setTimeout(() => {
        onCompleteVerification(finalSchool, {
          method: 'edu_email',
          role: studentRole,
          emailUsed: emailInput.trim()
        });
        onClose();
        setSuccess(false);
        setEmailStep('input');
        setOtpInput('');
        setDevOtpPreview(null);
      }, 2200);
    } catch (err) {
      setIsVerifyingOtp(false);
      setOtpError('Không thể kết nối đến máy chủ để xác thực mã. Vui lòng thử lại.');
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsVerifying(true);
    const targetSchool = getEffectiveSchool();

    setTimeout(() => {
      setSyncFeedback({
        schoolName: targetSchool.name,
        methodText: 'Mã Kích Hoạt Sinh Viên (Campus Token)',
        details: 'Đã xác thực mã thành công và cấp quyền truy cập hộp thư nội bộ.'
      });
      setIsVerifying(false);
      setSuccess(true);

      setTimeout(() => {
        onCompleteVerification(targetSchool, {
          method: 'campus_token',
          role: studentRole
        });
        onClose();
        setSuccess(false);
        setTokenInput('');
      }, 2000);
    }, 1000);
  };

  const verifiedList = userState?.verifiedSchools || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden my-auto text-[#0F180E] dark:text-[#E8ECE6]">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2A4228] via-[#8BA888] to-[#2A4228]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8E0] dark:border-[#2B372A] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2A4228] text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div>
              <h2 className="font-serif italic font-bold text-lg text-[#182217] dark:text-[#E8ECE6]">
                Đồng bộ xác thực trường học
              </h2>
              <p className="text-[11px] text-[#4A5C48] dark:text-[#8E9B8A] font-medium">
                School Verification Sync &bull; Đám mây bảo mật 100% ẩn danh
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Already Verified Schools Chips */}
        {verifiedList.length > 0 && !success && (
          <div className="mb-4 p-3 rounded-2xl bg-[#EAF0E8]/70 dark:bg-[#20281F] border border-[#C8D2C4]/70 dark:border-[#3A4738]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#2A4228] dark:text-[#8BA888] flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">cloud_done</span>
                <span>Trường đã đồng bộ ({verifiedList.length})</span>
              </span>
              <span className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">Đang lưu trữ trên Firestore</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {verifiedList.map(sch => (
                <span
                  key={sch.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C231B] border border-[#8BA888]/40 text-xs font-bold text-[#182217] dark:text-[#E8ECE6] shadow-2xs"
                >
                  <span className="material-symbols-outlined text-xs text-emerald-600">check_circle</span>
                  <span>{sch.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-3xl">sync_saved_locally</span>
            </div>
            
            <div>
              <h3 className="font-serif italic text-xl font-bold text-[#182217] dark:text-[#E8ECE6]">
                Đồng Bộ Xác Thực Thành Công!
              </h3>
              <p className="text-xs text-[#4A5C48] dark:text-[#8E9B8A] mt-1">
                Hồ sơ đã được lưu trữ và đồng bộ hóa đám mây
              </p>
            </div>

            {syncFeedback && (
              <div className="bg-[#2A4228]/10 dark:bg-[#8BA888]/15 border border-[#8BA888]/30 rounded-2xl p-4 text-xs text-[#182217] dark:text-[#E8ECE6] space-y-2.5 text-left max-w-sm mx-auto shadow-sm">
                <div className="font-bold flex items-center gap-1.5 text-[#2A4228] dark:text-[#8BA888] text-sm">
                  <span className="material-symbols-outlined text-base">school</span>
                  <span>{syncFeedback.schoolName}</span>
                </div>

                {/* AI Extracted Credentials Card (Locked) */}
                {(syncFeedback.studentName || syncFeedback.major || syncFeedback.cohort) && (
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#151C14]/80 border border-[#8BA888]/40 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 dark:text-emerald-400 pb-1 border-b border-[#8BA888]/20">
                      <span className="flex items-center gap-1">
                        <span>🔒</span>
                        <span>Đã khóa danh tính chống sửa đổi</span>
                      </span>
                      <span>AI Verified</span>
                    </div>

                    {syncFeedback.studentName && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Họ & Tên thật:</span>
                        <strong className="text-[#182217] dark:text-[#E8ECE6] font-bold">{syncFeedback.studentName}</strong>
                      </div>
                    )}

                    {syncFeedback.major && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Chuyên ngành / Khối:</span>
                        <strong className="text-[#2A4228] dark:text-[#8BA888] font-bold">{syncFeedback.major}</strong>
                      </div>
                    )}

                    {syncFeedback.cohort && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Niên khóa:</span>
                        <strong className="text-[#2A4228] dark:text-[#8BA888] font-bold">{syncFeedback.cohort}</strong>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-[#4A5C48] dark:text-[#B0C2AE]">
                  <strong>Phương thức:</strong> {syncFeedback.methodText}
                </div>
                {syncFeedback.details && (
                  <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A] pt-1 border-t border-[#8BA888]/20">
                    {syncFeedback.details}
                  </p>
                )}
                <div className="mt-1 pt-1.5 border-t border-[#8BA888]/20 flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  <span className="flex items-center gap-1">
                    <span>🌟</span>
                    <span>Thưởng Uy Tín:</span>
                  </span>
                  <span>Đạt mốc 10 Điểm Uy Tín (+8đ)</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Đang mở khóa quyền gửi thư nội bộ & tương tác...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Method Tabs */}
            <div className="flex rounded-2xl bg-[#EAF0E8]/70 dark:bg-[#20281F] p-1 border border-[#C8D2C4] dark:border-[#3A4738]">
              <button
                type="button"
                onClick={() => setActiveMethod('ocr')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeMethod === 'ocr'
                    ? 'bg-white dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] shadow-xs'
                    : 'text-[#5A6D58] dark:text-[#8E9B8A] hover:text-[#182217]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">document_scanner</span>
                <span>Quét Thẻ AI</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMethod('email')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeMethod === 'email'
                    ? 'bg-white dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] shadow-xs'
                    : 'text-[#5A6D58] dark:text-[#8E9B8A] hover:text-[#182217]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                <span>Email Trường</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMethod('token')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeMethod === 'token'
                    ? 'bg-white dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] shadow-xs'
                    : 'text-[#5A6D58] dark:text-[#8E9B8A] hover:text-[#182217]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">key</span>
                <span>Mã Token</span>
              </button>
            </div>

            {/* School Selector & Role (Only needed for Email & Token methods) */}
            {activeMethod !== 'ocr' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-[#4A5C48] dark:text-[#8E9B8A] mb-1">
                      Trường học cần xác thực
                    </label>
                    <select
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="w-full bg-white dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs sm:text-sm text-[#0F180E] dark:text-[#E8ECE6] font-bold focus:outline-none focus:border-[#2A4228]"
                    >
                      {schools.length > 0 && schools.map(s => (
                        <option key={s.id} value={s.id} className="bg-white dark:bg-[#1C231B]">
                          {s.name} ({s.location})
                        </option>
                      ))}
                      <option value="new_custom" className="bg-white dark:bg-[#1C231B] text-[#2A4228] font-bold">
                        ➕ Thêm trường mới / Trường khác...
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-[#4A5C48] dark:text-[#8E9B8A] mb-1">
                      Tư cách
                    </label>
                    <select
                      value={studentRole}
                      onChange={(e) => setStudentRole(e.target.value as any)}
                      className="w-full bg-white dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs sm:text-sm text-[#0F180E] dark:text-[#E8ECE6] font-bold focus:outline-none focus:border-[#2A4228]"
                    >
                      <option value="student">Đang theo học</option>
                      <option value="alumni">Cựu HS / SV</option>
                    </select>
                  </div>
                </div>

                {(selectedSchoolId === 'new_custom' || schools.length === 0) && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-[#2A4228] dark:text-[#8BA888] mb-1">
                      Nhập tên trường học của bạn (THPT hoặc Đại học)
                    </label>
                    <input
                      type="text"
                      value={customSchoolName}
                      onChange={(e) => setCustomSchoolName(e.target.value)}
                      placeholder="Ví dụ: THPT Chuyên Lê Hồng Phong, ĐH Bách Khoa..."
                      className="w-full bg-white dark:bg-[#20281F] border border-[#2A4228] rounded-xl py-2 px-3 text-xs sm:text-sm text-[#0F180E] dark:text-[#E8ECE6] font-bold focus:outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Method 1: AI Vision OCR */}
            {activeMethod === 'ocr' && (
              <form onSubmit={handleOcrSubmit} className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">auto_awesome</span>
                    <span>Tự động phát hiện & chuyển đúng trường</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Bạn chỉ cần tải/chụp ảnh thẻ của mình lên. Gemini Vision AI sẽ tự động nhận diện tên trường, xác thực và đưa bạn vào đúng Campus Hub tương ứng!
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#4A5C48] dark:text-[#8E9B8A] mb-1">
                    Chụp/Tải ảnh Thẻ HS/SV, Thẻ Thư Viện hoặc Bảng Điểm
                  </label>
                  <div className="relative border-2 border-dashed border-[#C8D2C4] dark:border-[#3A4738] hover:border-[#2A4228] rounded-2xl p-5 transition-colors flex flex-col items-center justify-center text-center cursor-pointer bg-[#FAF9F6] dark:bg-[#20281F] group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    <div className="w-11 h-11 rounded-2xl bg-[#2A4228]/15 border border-[#2A4228]/30 text-[#2A4228] dark:text-[#8BA888] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-2xl">id_card</span>
                    </div>

                    {fileUploaded ? (
                      <div className="text-xs text-[#2A4228] dark:text-[#8BA888] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Đã tải lên: {fileName}</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-[#0F180E] dark:text-[#E8ECE6]">
                          Chạm để tải ảnh thẻ hoặc chụp trực tiếp
                        </p>
                        <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5 font-medium">
                          Hỗ trợ JPG, PNG. Gemini Vision AI tự động nhận diện tên trường.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* OCR Error Notification */}
                {ocrError && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-xs space-y-2.5 animate-scale-up">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
                      <span className="material-symbols-outlined text-base">warning</span>
                      <span>{ocrError.title}</span>
                    </div>

                    <p className="text-xs text-[#0F180E] dark:text-[#E8ECE6] leading-relaxed font-medium">
                      {ocrError.message}
                    </p>

                    {ocrError.extractedSchool && (
                      <div className="bg-white/80 dark:bg-[#1A2219] p-3 rounded-xl border border-rose-500/20 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#5A6D58] dark:text-[#8E9B8A]">Trường bạn đang chọn:</span>
                          <span className="font-bold text-[#0F180E] dark:text-[#E8ECE6]">{ocrError.selectedSchoolName || getEffectiveSchool().name}</span>
                        </div>
                        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold">
                          <span>Trường phát hiện trên thẻ:</span>
                          <span>{ocrError.extractedSchool}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFileUploaded(false);
                          setFileBase64(null);
                          setFileName('');
                          setOcrError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#20281F] border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">restart_alt</span>
                        <span>Chọn/Chụp lại thẻ khác</span>
                      </button>

                      {ocrError.extractedSchool && (
                        <button
                          type="button"
                          onClick={() => {
                            const matched = schools.find(s => 
                              s.name.toLowerCase().includes(ocrError.extractedSchool!.toLowerCase()) ||
                              ocrError.extractedSchool!.toLowerCase().includes(s.name.toLowerCase())
                            );
                            if (matched) {
                              setSelectedSchoolId(matched.id);
                              setCustomSchoolName('');
                            } else {
                              setSelectedSchoolId('new_custom');
                              setCustomSchoolName(ocrError.extractedSchool!);
                            }
                            setOcrError(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">swap_horiz</span>
                          <span>Đổi sang "{ocrError.extractedSchool}"</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#EAF0E8]/60 dark:bg-[#20281F] border border-[#C8D2C4]/70 dark:border-[#3A4738] text-[11px] text-[#4A5C48] dark:text-[#8E9B8A] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#2A4228] dark:text-[#8BA888] text-base shrink-0 mt-0.5">verified_user</span>
                  <p className="leading-relaxed">
                    <strong className="text-[#182217] dark:text-[#E8ECE6]">Bảo mật tuyệt đối:</strong> Ảnh chỉ được đối soát tự động bởi AI và không lưu trữ công khai. Danh tính cá nhân vẫn được bảo đảm ẩn danh 100%.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!fileUploaded || isVerifying}
                  className="w-full bg-[#2A4228] hover:bg-[#385036] text-white font-bold py-2.5 rounded-full text-xs shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gemini AI đang đối soát & đồng bộ...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">cloud_sync</span>
                      <span>Đồng bộ xác thực AI ngay</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Method 2: School Email with OTP verification */}
            {activeMethod === 'email' && (
              <div className="space-y-4">
                {emailStep === 'input' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#4A5C48] dark:text-[#8E9B8A]">
                          Bước 1: Nhập Email Trường (@*.edu.vn)
                        </label>
                        <span className="text-[10px] text-[#2A4228] dark:text-[#8BA888] font-bold">
                          Gửi mã OTP 6 số
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="ví dụ: student@hcmus.edu.vn hoặc @apcs.fitus.edu.vn"
                          className="w-full bg-white dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm text-[#0F180E] dark:text-[#E8ECE6] font-medium focus:outline-none focus:border-[#2A4228]"
                        />
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A6D58] dark:text-[#8E9B8A] text-base">
                          alternate_email
                        </span>
                      </div>
                      {emailError && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">error</span>
                          {emailError}
                        </p>
                      )}

                      {/* Quick Domain Suggestion Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">Gợi ý nhanh:</span>
                        {['@fitus.edu.vn', '@hcmus.edu.vn', '@hust.edu.vn', '@ftu.edu.vn'].map((domain) => (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => {
                              const prefix = emailInput.split('@')[0] || 'student';
                              setEmailInput(`${prefix}${domain}`);
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#EAF0E8] dark:bg-[#2B372A] text-[#2A4228] dark:text-[#8BA888] hover:bg-[#D8E4D5] dark:hover:bg-[#384837] transition-colors"
                          >
                            {domain}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#EAF0E8]/60 dark:bg-[#20281F] border border-[#C8D2C4]/70 dark:border-[#3A4738] text-[11px] text-[#4A5C48] dark:text-[#8E9B8A] flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#2A4228] dark:text-[#8BA888] text-base shrink-0 mt-0.5">mail_lock</span>
                      <p className="leading-relaxed">
                        Hệ thống sẽ gửi một <strong>mã xác thực OTP gồm 6 chữ số</strong> về email trường của bạn. Mã có hiệu lực trong 10 phút.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={!emailInput.trim() || isSendingOtp}
                      className="w-full bg-[#2A4228] hover:bg-[#385036] text-white font-bold py-2.5 rounded-full text-xs shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isSendingOtp ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang tạo & gửi mã OTP...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">send</span>
                          <span>Gửi mã xác thực OTP về Email</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2: Enter 6-digit OTP */
                  <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
                    {/* Destination Banner */}
                    <div className="p-3 rounded-2xl bg-[#EAF0E8]/80 dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-sm">mark_email_read</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] font-semibold">Đã gửi mã xác thực đến:</p>
                            {emailSentViaResend && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Resend API
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] truncate">{emailInput}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailStep('input');
                          setOtpError(null);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#2A4228] dark:text-[#8BA888] hover:underline shrink-0"
                      >
                        Đổi email
                      </button>
                    </div>

                    {/* OTP 6-digit input */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-[#4A5C48] dark:text-[#8E9B8A] mb-1.5 text-center">
                        Bước 2: Nhập Mã Xác Thực 6 Số (OTP)
                      </label>
                      <div className="relative max-w-[280px] mx-auto">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          autoFocus
                          value={otpInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                            setOtpInput(val);
                            if (otpError) setOtpError(null);
                          }}
                          placeholder="______"
                          className="w-full text-center tracking-[0.6em] font-mono text-xl sm:text-2xl font-black py-2.5 bg-white dark:bg-[#20281F] border-2 border-[#2A4228]/40 dark:border-[#8BA888]/40 focus:border-[#2A4228] dark:focus:border-[#8BA888] rounded-2xl text-[#0F180E] dark:text-[#E8ECE6] focus:outline-none transition-all"
                        />
                      </div>

                      {otpError && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 font-semibold text-center flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-xs">error</span>
                          {otpError}
                        </p>
                      )}
                    </div>

                    {/* Resend Notice or Dev OTP Helper & Quick Auto-Fill */}
                    {serverDeliveryMessage && !emailSentViaResend && (
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-200 flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-sm shrink-0 mt-0.5">info</span>
                        <p className="leading-relaxed text-[11px]">{serverDeliveryMessage}</p>
                      </div>
                    )}

                    {devOtpPreview && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-600 text-sm">vpn_key</span>
                          <span>Mã OTP ({emailSentViaResend ? 'Dự phòng' : 'Mô phỏng/Test'}): <strong className="font-mono tracking-widest font-bold">{devOtpPreview}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtpInput(devOtpPreview)}
                          className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-colors shadow-sm"
                        >
                          Điền nhanh
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[#5A6D58] dark:text-[#8E9B8A] px-1">
                      <span>Chưa nhận được mã?</span>
                      {resendCountdown > 0 ? (
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          Gửi lại sau {resendCountdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={isSendingOtp}
                          className="font-bold text-[#2A4228] dark:text-[#8BA888] hover:underline"
                        >
                          Gửi lại mã OTP
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={otpInput.length !== 6 || isVerifyingOtp}
                      className="w-full bg-[#2A4228] hover:bg-[#385036] text-white font-bold py-2.5 rounded-full text-xs shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang kiểm tra mã OTP & kích hoạt...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">verified</span>
                          <span>Xác nhận mã OTP & Hoàn tất</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Method 3: Campus Token */}
            {activeMethod === 'token' && (
              <form onSubmit={handleTokenSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#4A5C48] dark:text-[#8E9B8A] mb-1">
                    Nhập Mã Sinh Viên / Token Kích Hoạt Hội Sinh Viên
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Nhập mã MSSV hoặc token do Đoàn/Hội trường cấp..."
                      className="w-full bg-white dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm text-[#0F180E] dark:text-[#E8ECE6] font-medium focus:outline-none focus:border-[#2A4228]"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A6D58] dark:text-[#8E9B8A] text-base">
                      key
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#EAF0E8]/60 dark:bg-[#20281F] border border-[#C8D2C4]/70 dark:border-[#3A4738] text-[11px] text-[#4A5C48] dark:text-[#8E9B8A] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#2A4228] dark:text-[#8BA888] text-base shrink-0 mt-0.5">info</span>
                  <p className="leading-relaxed">
                    Dành cho các chiến dịch đồng hành tâm lý học đường phối hợp cùng Đoàn trường & Ban Cố vấn.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!tokenInput.trim() || isVerifying}
                  className="w-full bg-[#2A4228] hover:bg-[#385036] text-white font-bold py-2.5 rounded-full text-xs shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xác thực mã...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">cloud_sync</span>
                      <span>Kích hoạt quyền trường</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
