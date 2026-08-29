import React, { useState } from 'react';
import { 
  Video, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  MessageSquare, 
  UserCheck, 
  Lock, 
  AlertCircle,
  HelpCircle,
  Headphones,
  Building
} from 'lucide-react';
import { CounselingAppointment, AppointmentMeetingType, UserState, AuthorRole } from '../types';

interface CounselingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSchedule: (appointment: CounselingAppointment, sendToChatOrPost?: boolean) => void;
  userState?: UserState;
  schoolName?: string;
  schoolId?: string;
  defaultCounselorName?: string;
  defaultCounselorRole?: AuthorRole | string;
  counselorName?: string;
  counselorRole?: AuthorRole | string;
  relatedPostId?: string;
  relatedPostTitle?: string;
  relatedThreadId?: string;
}

export const CounselingScheduleModal: React.FC<CounselingScheduleModalProps> = ({
  isOpen,
  onClose,
  onConfirmSchedule,
  userState,
  schoolName = 'Trường của bạn',
  schoolId = 'global',
  defaultCounselorName,
  defaultCounselorRole,
  counselorName,
  counselorRole,
  relatedPostId,
  relatedPostTitle,
  relatedThreadId
}) => {
  const effectiveCounselorName = counselorName || defaultCounselorName || 'Chuyên viên Tâm lý Học đường';
  const effectiveCounselorRole = counselorRole || defaultCounselorRole || 'counselor';
  // Format today's and future dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const formatDateStr = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const [selectedDate, setSelectedDate] = useState<string>(formatDateStr(tomorrow));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('14:00 - 15:00');
  const [meetingType, setMeetingType] = useState<AppointmentMeetingType>('google_meet');
  const [topic, setTopic] = useState(
    relatedPostTitle ? `Tham vấn về: "${relatedPostTitle.slice(0, 40)}..."` : 'Áp lực học tập & Định hướng tâm lý'
  );
  const [note, setNote] = useState('');
  const [customLocation, setCustomLocation] = useState('Phòng Tư Vấn Tâm Lý Học Đường (Tầng 2 - Nhà Hiệu Bộ)');
  const [generatedMeetCode, setGeneratedMeetCode] = useState(() => {
    // Generate a friendly meet room slug
    const randPart1 = Math.random().toString(36).substring(2, 5);
    const randPart2 = Math.random().toString(36).substring(2, 6);
    const randPart3 = Math.random().toString(36).substring(2, 5);
    return `${randPart1}-${randPart2}-${randPart3}`;
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendToChatCheckbox, setSendToChatCheckbox] = useState(true);

  if (!isOpen) return null;

  const fullMeetUrl = `https://meet.google.com/${generatedMeetCode}`;

  const timeSlots = [
    { time: '08:30 - 09:30', period: 'Sáng' },
    { time: '10:00 - 11:00', period: 'Sáng' },
    { time: '14:00 - 15:00', period: 'Chiều' },
    { time: '15:30 - 16:30', period: 'Chiều' },
    { time: '19:30 - 20:30', period: 'Tối' },
    { time: '21:00 - 22:00', period: 'Tối' },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullMeetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRegenerateCode = () => {
    const randPart1 = Math.random().toString(36).substring(2, 5);
    const randPart2 = Math.random().toString(36).substring(2, 6);
    const randPart3 = Math.random().toString(36).substring(2, 5);
    setGeneratedMeetCode(`${randPart1}-${randPart2}-${randPart3}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const newAppt: CounselingAppointment = {
      id: `appt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      postId: relatedPostId,
      threadId: relatedThreadId,
      requesterAnonId: `#${userState?.userAnonNumber || 999}`,
      requesterDisplayName: userState?.displayName,
      requesterRole: userState?.userRole === 'peer_listener' ? 'peer_listener' : 'student',
      counselorName: effectiveCounselorName,
      counselorRole: effectiveCounselorRole,
      schoolId: schoolId,
      schoolName: schoolName,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      meetingType: meetingType,
      meetUrl: meetingType === 'google_meet' ? fullMeetUrl : undefined,
      locationName: meetingType === 'in_person' ? customLocation : undefined,
      topic: topic.trim(),
      note: note.trim() || undefined,
      status: 'pending',
      createdAt: Date.now(),
      meetingCode: meetingType === 'google_meet' ? generatedMeetCode : undefined
    };

    onConfirmSchedule(newAppt, sendToChatCheckbox);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#1E261D] w-full max-w-xl rounded-3xl border border-[#E5E2D9] dark:border-[#3A4738] shadow-2xl overflow-hidden my-auto text-[#1C231B] dark:text-[#E8ECE6]"
      >
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#2A4228] to-[#3A5238] text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-300 shadow-inner">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Phòng Tham Vấn Học Đường
                </span>
                <span className="text-[11px] text-white/70 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> 100% Ẩn danh & Bảo mật
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold mt-0.5">
                Lên Lịch Hẹn & Tạo Google Meet
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Section 1: Meeting Type Selection */}
          <div>
            <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-2">
              1. Hình thức buổi tham vấn
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Google Meet Option */}
              <button
                type="button"
                onClick={() => setMeetingType('google_meet')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  meetingType === 'google_meet'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-[#1C231B] dark:text-[#E8ECE6] ring-2 ring-emerald-500/20'
                    : 'border-[#E5E2D9] dark:border-[#3A4738] bg-[#F7F5F0] dark:bg-[#161D15] hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  {meetingType === 'google_meet' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Google Meet Online</div>
                  <div className="text-[10px] text-[#8E9B8A] mt-0.5">Tạo link video call bảo mật</div>
                </div>
              </button>

              {/* In-Person Campus Option */}
              <button
                type="button"
                onClick={() => setMeetingType('in_person')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  meetingType === 'in_person'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-[#1C231B] dark:text-[#E8ECE6] ring-2 ring-emerald-500/20'
                    : 'border-[#E5E2D9] dark:border-[#3A4738] bg-[#F7F5F0] dark:bg-[#161D15] hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  {meetingType === 'in_person' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Tại trường (Trực tiếp)</div>
                  <div className="text-[10px] text-[#8E9B8A] mt-0.5">Phòng tư vấn tâm lý trường</div>
                </div>
              </button>

              {/* Voice Chat Option */}
              <button
                type="button"
                onClick={() => setMeetingType('voice_call')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  meetingType === 'voice_call'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-[#1C231B] dark:text-[#E8ECE6] ring-2 ring-emerald-500/20'
                    : 'border-[#E5E2D9] dark:border-[#3A4738] bg-[#F7F5F0] dark:bg-[#161D15] hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </div>
                  {meetingType === 'voice_call' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Voice Call Âm Thanh</div>
                  <div className="text-[10px] text-[#8E9B8A] mt-0.5">Không cần bật camera</div>
                </div>
              </button>
            </div>
          </div>

          {/* If Google Meet: Display generated link with copy button */}
          {meetingType === 'google_meet' && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Đường dẫn Google Meet tự động:
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Đổi mã phòng
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white dark:bg-[#121811] px-3 py-2 rounded-xl border border-emerald-500/30 font-mono text-xs text-[#2A4228] dark:text-[#8BA888] truncate select-all">
                  {fullMeetUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                  title="Sao chép đường dẫn Google Meet"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
                </button>
                <a
                  href={fullMeetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[#2A4228] dark:text-[#8BA888] shrink-0"
                  title="Mở thử Google Meet"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-[10px] text-[#6B7567] dark:text-[#A0ABA0] mt-1.5">
                * Học sinh có thể tắt camera, đổi tên hiển thị để bảo đảm quyền riêng tư khi tham gia phòng Meet.
              </p>
            </div>
          )}

          {/* If In-Person Campus: Campus Location Input */}
          {meetingType === 'in_person' && (
            <div>
              <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-1.5">
                Địa điểm gặp tại trường
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-[#8E9B8A]" />
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Ví dụ: Phòng tư vấn tâm lý (Nhà B, P.102) hoặc Góc đọc sách thư viện"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] bg-[#F7F5F0] dark:bg-[#161D15] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Section 2: Date & Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Selection */}
            <div>
              <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>2. Chọn ngày gặp</span>
                <span className="text-[10px] font-normal text-[#8E9B8A]">{formatDateDisplay(selectedDate)}</span>
              </label>

              {/* Quick Date Chips */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(formatDateStr(today))}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    selectedDate === formatDateStr(today)
                      ? 'bg-[#2A4228] text-white border-[#2A4228]'
                      : 'bg-[#F7F5F0] dark:bg-[#161D15] border-[#E5E2D9] dark:border-[#3A4738] hover:border-emerald-500/50'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(formatDateStr(tomorrow))}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    selectedDate === formatDateStr(tomorrow)
                      ? 'bg-[#2A4228] text-white border-[#2A4228]'
                      : 'bg-[#F7F5F0] dark:bg-[#161D15] border-[#E5E2D9] dark:border-[#3A4738] hover:border-emerald-500/50'
                  }`}
                >
                  Ngày mai
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(formatDateStr(dayAfterTomorrow))}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    selectedDate === formatDateStr(dayAfterTomorrow)
                      ? 'bg-[#2A4228] text-white border-[#2A4228]'
                      : 'bg-[#F7F5F0] dark:bg-[#161D15] border-[#E5E2D9] dark:border-[#3A4738] hover:border-emerald-500/50'
                  }`}
                >
                  Ngày kia
                </button>
              </div>

              {/* Custom Date Input */}
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-[#8E9B8A]" />
                <input
                  type="date"
                  value={selectedDate}
                  min={formatDateStr(today)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] bg-[#F7F5F0] dark:bg-[#161D15] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>3. Khung giờ tham vấn</span>
                <span className="text-[10px] font-normal text-[#8E9B8A]">{selectedTimeSlot}</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot.time)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-between transition-all ${
                      selectedTimeSlot === slot.time
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-[#F7F5F0] dark:bg-[#161D15] border-[#E5E2D9] dark:border-[#3A4738] hover:border-emerald-500/50 text-[#3A4036] dark:text-[#C5CDC2]'
                    }`}
                  >
                    <span>{slot.time}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded ${
                      selectedTimeSlot === slot.time ? 'bg-white/20 text-white' : 'text-[#8E9B8A]'
                    }`}>
                      {slot.period}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Topic & Notes */}
          <div>
            <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-1.5">
              4. Chủ đề / Vấn đề cần trao đổi
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Căng thẳng kỳ thi THPT, Mâu thuẫn gia đình, Định hướng nghề nghiệp..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] bg-[#F7F5F0] dark:bg-[#161D15] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Ghi chú riêng tư (Tùy chọn)</span>
              <span className="text-[10px] text-[#8E9B8A] font-normal">Chỉ chuyên viên tham vấn nhìn thấy</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bạn có điều gì muốn chuyên viên chuẩn bị trước không? (Ví dụ: Mình thích nhắn tin trước khi nói chuyện, hoặc muốn giữ im lặng một lúc...)"
              className="w-full px-3.5 py-2 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] bg-[#F7F5F0] dark:bg-[#161D15] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Send to chat checkbox if related thread/post exists */}
          {(relatedThreadId || relatedPostId) && (
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F7F5F0] dark:bg-[#161D15] border border-[#E5E2D9] dark:border-[#3A4738] cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={sendToChatCheckbox}
                onChange={(e) => setSendToChatCheckbox(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[#3A4036] dark:text-[#C5CDC2]">
                Tự động gửi thẻ hẹn & đường dẫn Google Meet vào {relatedThreadId ? 'cuộc trò chuyện 1-1' : 'hộp thư bài viết'}
              </span>
            </label>
          )}

          {/* Security & Confidentiality Notice */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5 text-[11px] text-[#2A4228] dark:text-[#8BA888]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Cam kết Đạo đức & Bảo mật Học đường:</span> Buổi tham vấn tuân thủ nguyên tắc bảo mật thông tin 100%. Bạn có thể tắt camera hoặc kết thúc bất cứ lúc nào nếu cảm thấy không thoải mái.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2A4228] to-[#3A5238] hover:from-[#213520] hover:to-[#2A4228] text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Xác Nhận Lên Lịch Tham Vấn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
