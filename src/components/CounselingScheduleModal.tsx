import React, { useState, useEffect } from 'react';
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
  Building,
  GraduationCap,
  Star,
  CheckCircle2,
  AlertTriangle,
  Info,
  CalendarCheck,
  ClipboardPaste,
  User,
  Radio
} from 'lucide-react';
import { CounselingAppointment, AppointmentMeetingType, UserState, AuthorRole, PeerMentorApplication, School } from '../types';
import { 
  CampusCounselor, 
  getCounselorsForSchool, 
  TIME_SLOTS_PRESETS, 
  isTimeSlotBooked 
} from '../data/counselorsData';

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
  mentorApplications?: PeerMentorApplication[];
  existingAppointments?: CounselingAppointment[];
  allSchools?: School[];
}

export const CounselingScheduleModal: React.FC<CounselingScheduleModalProps> = ({
  isOpen,
  onClose,
  onConfirmSchedule,
  userState,
  schoolName = 'Trường của bạn',
  schoolId = 'all-schools',
  defaultCounselorName,
  defaultCounselorRole,
  counselorName,
  counselorRole,
  relatedPostId,
  relatedPostTitle,
  relatedThreadId,
  mentorApplications = [],
  existingAppointments = [],
  allSchools = []
}) => {
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

  // Get effective school info
  const effectiveSchoolName = schoolName && schoolName !== 'Trường của bạn' && schoolName !== 'all-schools'
    ? schoolName
    : userState?.selectedSchool?.name || 'Sảnh Chung Mọi Trường';

  const effectiveSchoolId = schoolId || userState?.selectedSchool?.id || 'all-schools';

  // Get available counselors for this school context
  const availableCounselors = getCounselorsForSchool(effectiveSchoolId, effectiveSchoolName, mentorApplications);

  // Initial selected counselor
  const initialCounselor = availableCounselors.find(c => 
    (counselorName && c.name.toLowerCase().includes(counselorName.toLowerCase())) ||
    (defaultCounselorName && c.name.toLowerCase().includes(defaultCounselorName.toLowerCase()))
  ) || availableCounselors[0];

  const [selectedCounselor, setSelectedCounselor] = useState<CampusCounselor>(initialCounselor || availableCounselors[0]);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateStr(tomorrow));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('14:00 - 15:00');
  const [meetingType, setMeetingType] = useState<AppointmentMeetingType>('google_meet');
  const [videoPlatform, setVideoPlatform] = useState<'google_meet' | 'instant_room'>('google_meet');
  
  const [topic, setTopic] = useState(
    relatedPostTitle ? `Tham vấn về: "${relatedPostTitle.slice(0, 45)}..."` : 'Áp lực học tập & Định hướng tâm lý'
  );
  const [note, setNote] = useState('');
  const [customLocation, setCustomLocation] = useState(
    initialCounselor?.officeLocation || 'Phòng Tham Vấn Học Đường (P.102 Nhà Hiệu Bộ)'
  );

  // Real Google Meet link handling
  const [meetUrlInput, setMeetUrlInput] = useState('');
  const [instantRoomId] = useState(() => {
    const randCode = Math.random().toString(36).substring(2, 9);
    return `lantern-meet-${randCode}`;
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendToChatCheckbox, setSendToChatCheckbox] = useState(true);

  // Update counselor if props change
  useEffect(() => {
    if (counselorName || defaultCounselorName) {
      const match = availableCounselors.find(c => 
        (counselorName && c.name.toLowerCase().includes(counselorName.toLowerCase())) ||
        (defaultCounselorName && c.name.toLowerCase().includes(defaultCounselorName.toLowerCase()))
      );
      if (match) {
        setSelectedCounselor(match);
        if (match.officeLocation) {
          setCustomLocation(match.officeLocation);
        }
      }
    }
  }, [counselorName, defaultCounselorName, availableCounselors]);

  // When counselor changes, update location
  const handleSelectCounselor = (counselor: CampusCounselor) => {
    setSelectedCounselor(counselor);
    if (counselor.officeLocation) {
      setCustomLocation(counselor.officeLocation);
    }
  };

  if (!isOpen) return null;

  // Determine effective Video Call URL
  const getEffectiveMeetUrl = () => {
    if (videoPlatform === 'instant_room') {
      return `https://meet.jit.si/${instantRoomId}`;
    }
    const trimmed = meetUrlInput.trim();
    if (!trimmed) {
      return 'https://meet.google.com/new';
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://meet.google.com/${trimmed.replace(/https?:\/\/meet\.google\.com\//, '')}`;
  };

  const currentEffectiveMeetUrl = getEffectiveMeetUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentEffectiveMeetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenCreateGoogleMeet = () => {
    window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMeetUrlInput(text.trim());
      }
    } catch (err) {
      // Fallback
    }
  };

  // Check which slots are booked for current selected counselor and date
  const slotAvailabilityMap = TIME_SLOTS_PRESETS.map(slot => {
    const status = isTimeSlotBooked(
      selectedCounselor?.name || '',
      selectedDate,
      slot.time,
      existingAppointments
    );
    return {
      ...slot,
      isBooked: status.isBooked,
      bookedBy: status.bookedBy
    };
  });

  // Check if currently selected slot is booked
  const currentSlotBookedStatus = isTimeSlotBooked(
    selectedCounselor?.name || '',
    selectedDate,
    selectedTimeSlot,
    existingAppointments
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (currentSlotBookedStatus.isBooked) {
      alert('Khung giờ này vừa có người đặt. Vui lòng chọn một khung giờ còn trống khác!');
      return;
    }

    const finalMeetUrl = meetingType === 'google_meet' ? currentEffectiveMeetUrl : undefined;

    const newAppt: CounselingAppointment = {
      id: `appt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      postId: relatedPostId,
      threadId: relatedThreadId,
      requesterAnonId: `#${userState?.userAnonNumber || 999}`,
      requesterDisplayName: userState?.displayName,
      requesterRole: userState?.userRole === 'peer_listener' ? 'peer_listener' : 'student',
      counselorName: selectedCounselor?.name || counselorName || 'Chuyên viên Tâm lý Học đường',
      counselorRole: selectedCounselor?.roleTitle || counselorRole || 'Chuyên gia Tâm lý',
      schoolId: effectiveSchoolId,
      schoolName: effectiveSchoolName,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      meetingType: meetingType,
      meetUrl: finalMeetUrl,
      locationName: meetingType === 'in_person' ? customLocation : undefined,
      topic: topic.trim(),
      note: note.trim() || undefined,
      status: 'pending',
      createdAt: Date.now(),
      meetingCode: meetingType === 'google_meet' ? (videoPlatform === 'instant_room' ? instantRoomId : 'google-meet-live') : undefined
    };

    onConfirmSchedule(newAppt, sendToChatCheckbox);
    onClose();
  };

  const topicSuggestions = [
    'Áp lực học tập & Thi cử',
    'Căng thẳng & Rối loạn cảm xúc',
    'Khủng hoảng định hướng ngành nghề',
    'Mâu thuẫn gia đình & Kỳ vọng cha mẹ',
    'Bắt nạt & Áp lực đồng trang lứa'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#1C231A] w-full max-w-2xl rounded-3xl border border-[#E5E2D9] dark:border-[#3A4738] shadow-2xl overflow-hidden my-auto text-[#1C231B] dark:text-[#E8ECE6] max-h-[92vh] flex flex-col"
      >
        {/* Modal Header - High Contrast White Text */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#172616] via-[#223820] to-[#2F4D2C] shrink-0 border-b border-[#3B5738]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 backdrop-blur-md flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <CalendarCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="pr-6">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-200 bg-emerald-950/80 border border-emerald-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                  {effectiveSchoolName}
                </span>
                <span className="text-[11px] text-emerald-100 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-300" /> 100% Ẩn danh & Bảo mật học đường
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide drop-shadow-sm">
                Đặt Lịch Tham Vấn & Tư Vấn Tâm Lý Học Đường
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* SECTION 1: COUNSELOR SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Chọn Chuyên Viên / Bạn Lắng Nghe của Trường</span>
                <span className="text-[10px] lowercase font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  {availableCounselors.length} người sẵn sàng
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableCounselors.map((counselor) => {
                const isSelected = selectedCounselor?.id === counselor.id;
                return (
                  <div
                    key={counselor.id}
                    onClick={() => handleSelectCounselor(counselor)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F5] dark:bg-[#161D15] hover:border-emerald-500/40 hover:bg-white dark:hover:bg-[#1D251C]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img 
                          src={counselor.avatarUrl} 
                          alt={counselor.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover border border-[#E5E2D9] dark:border-[#3A4738]" 
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#161D15]"></span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-[#1C231B] dark:text-[#E8ECE6] truncate">
                            {counselor.name}
                          </h4>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
                          {counselor.roleTitle}
                        </p>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#788476] dark:text-[#9AA898]">
                          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {counselor.ratingScore}
                          </span>
                          <span>•</span>
                          <span>{counselor.sessionsCount} lượt tham vấn</span>
                        </div>
                      </div>
                    </div>

                    {/* Specialties tags */}
                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-1">
                      {counselor.specialties.slice(0, 2).map((tag, i) => (
                        <span 
                          key={i} 
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[#4A5348] dark:text-[#BAC5B7] truncate max-w-[150px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Counselor Highlight Banner */}
            {selectedCounselor && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-xs text-[#2A4228] dark:text-[#8BA888]">
                <div className="flex items-center gap-2 truncate">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Bạn đang đặt lịch cùng: <strong>{selectedCounselor.name}</strong> ({selectedCounselor.schoolName})
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0 ml-2">
                  Đã chọn
                </span>
              </div>
            )}
          </div>

          {/* SECTION 2: MEETING TYPE */}
          <div>
            <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-2">
              2. Hình thức buổi tham vấn
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Google Meet Option */}
              <button
                type="button"
                onClick={() => setMeetingType('google_meet')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  meetingType === 'google_meet'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-[#1C231B] dark:text-[#E8ECE6] ring-2 ring-emerald-500/20'
                    : 'border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F5] dark:bg-[#161D15] hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  {meetingType === 'google_meet' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Google Meet / Video Call</div>
                  <div className="text-[10px] text-[#8E9B8A] mt-0.5">Phòng họp trực tuyến bảo mật</div>
                </div>
              </button>

              {/* In-Person Campus Option */}
              <button
                type="button"
                onClick={() => setMeetingType('in_person')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  meetingType === 'in_person'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-[#1C231B] dark:text-[#E8ECE6] ring-2 ring-emerald-500/20'
                    : 'border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F5] dark:bg-[#161D15] hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  {meetingType === 'in_person' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Tại trường (Trực tiếp)</div>
                  <div className="text-[10px] text-[#8E9B8A] mt-0.5">Gặp tại phòng tư vấn trường</div>
                </div>
              </button>

              {/* Voice Chat Option */}
              <button
                type="button"
                onClick={() => setMeetingType('voice_call')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  meetingType === 'voice_call'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-[#1C231B] dark:text-[#E8ECE6] ring-2 ring-emerald-500/20'
                    : 'border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F5] dark:bg-[#161D15] hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
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

            {/* Video Meeting Configuration & Real Link Tools */}
            {meetingType === 'google_meet' && (
              <div className="mt-3 p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                
                {/* Method selector for real room */}
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="videoPlatform" 
                      checked={videoPlatform === 'google_meet'} 
                      onChange={() => setVideoPlatform('google_meet')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Google Meet (Chính thức)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="videoPlatform" 
                      checked={videoPlatform === 'instant_room'} 
                      onChange={() => setVideoPlatform('instant_room')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Phòng Video Trực Tuyến Live (Vào ngay không cần tạo)</span>
                    </span>
                  </label>
                </div>

                {videoPlatform === 'google_meet' ? (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-emerald-600" /> Link Google Meet:
                      </span>
                      
                      <button
                        type="button"
                        onClick={handleOpenCreateGoogleMeet}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Bấm tạo phòng thật trên Google Meet</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={meetUrlInput}
                          onChange={(e) => setMeetUrlInput(e.target.value)}
                          placeholder="Dán link Meet thật của bạn (ví dụ: meet.google.com/abc-defg-hij)..."
                          className="w-full bg-white dark:bg-[#121811] px-3.5 py-2.5 rounded-xl border border-emerald-500/40 font-mono text-xs text-[#1C231B] dark:text-[#E8ECE6] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-semibold text-[#2A4228] dark:text-[#8BA888] transition-colors flex items-center gap-1 shrink-0"
                        title="Dán link từ bộ nhớ tạm"
                      >
                        <ClipboardPaste className="w-4 h-4" />
                        <span className="hidden sm:inline">Dán link</span>
                      </button>

                      <a
                        href={currentEffectiveMeetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shrink-0"
                        title="Mở kiểm tra phòng Meet"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-[#334231] dark:text-[#A0B09F] leading-relaxed">
                      👉 <strong>Hướng dẫn:</strong> Bấm <em>"Bấm tạo phòng thật trên Google Meet"</em> để mở tab Google Meet chính thức ➔ Bấm <em>"Bắt đầu cuộc họp tức thì"</em> ➔ Sao chép link và bấm <em>"Dán link"</em> vào đây.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        ⚡ Phòng Live trực tiếp (Hỗ trợ Camera/Mic chất lượng cao):
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        Hoạt động 100%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white dark:bg-[#121811] px-3.5 py-2.5 rounded-xl border border-emerald-500/40 font-mono text-xs text-[#2A4228] dark:text-[#8BA888] truncate select-all">
                        {currentEffectiveMeetUrl}
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
                      </button>

                      <a
                        href={currentEffectiveMeetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shrink-0"
                        title="Vào ngay phòng này"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-[10px] text-[#6B7567] dark:text-[#A0ABA0]">
                      * Phòng Live này vào được ngay lập tức, không yêu cầu đăng nhập tài khoản Google hay cấp quyền phức tạp.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* In-Person Campus Location */}
            {meetingType === 'in_person' && (
              <div className="mt-2.5">
                <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-1.5">
                  Địa điểm phòng tư vấn tại trường
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-[#8E9B8A]" />
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Ví dụ: Phòng Tham Vấn Tâm Lý Học Đường (P.102 - Nhà Hiệu Bộ)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F5] dark:bg-[#161D15] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: DATE & REAL-TIME TIME SLOTS AVAILABILITY */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider flex items-center gap-2">
                <span>3. Chọn Ngày & Khung Giờ Tham Vấn</span>
                <span className="text-[10px] font-normal text-[#8E9B8A]">({formatDateDisplay(selectedDate)})</span>
              </label>

              {/* Status Legend */}
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Còn trống
                </span>
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Đã có người đặt
                </span>
              </div>
            </div>

            {/* Quick Date Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="grid grid-cols-3 sm:col-span-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDate(formatDateStr(today))}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                    selectedDate === formatDateStr(today)
                      ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-sm'
                      : 'bg-[#FAF9F5] dark:bg-[#161D15] border-[#E5E2D9] dark:border-[#3A4738] hover:border-emerald-500/50'
                  }`}
                >
                  <span>Hôm nay</span>
                  <span className="text-[9px] opacity-75">{today.getDate()}/{today.getMonth() + 1}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate(formatDateStr(tomorrow))}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                    selectedDate === formatDateStr(tomorrow)
                      ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-sm'
                      : 'bg-[#FAF9F5] dark:bg-[#161D15] border-[#E5E2D9] dark:border-[#3A4738] hover:border-emerald-500/50'
                  }`}
                >
                  <span>Ngày mai</span>
                  <span className="text-[9px] opacity-75">{tomorrow.getDate()}/{tomorrow.getMonth() + 1}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate(formatDateStr(dayAfterTomorrow))}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                    selectedDate === formatDateStr(dayAfterTomorrow)
                      ? 'bg-[#2A4228] text-white border-[#2A4228] shadow-sm'
                      : 'bg-[#FAF9F5] dark:bg-[#161D15] border-[#E5E2D9] dark:border-[#3A4738] hover:border-emerald-500/50'
                  }`}
                >
                  <span>Ngày kia</span>
                  <span className="text-[9px] opacity-75">{dayAfterTomorrow.getDate()}/{dayAfterTomorrow.getMonth() + 1}</span>
                </button>
              </div>

              {/* Custom Date Input */}
              <div className="relative sm:col-span-1">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#8E9B8A] pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  min={formatDateStr(today)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F5] dark:bg-[#161D15] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Time Slots Grid with Real-time Booked / Available States */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
              {slotAvailabilityMap.map((slot) => {
                const isSelected = selectedTimeSlot === slot.time && !slot.isBooked;

                if (slot.isBooked) {
                  return (
                    <div
                      key={slot.time}
                      className="py-2.5 px-3 rounded-2xl border border-rose-200 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600/70 dark:text-rose-400/70 flex flex-col justify-between cursor-not-allowed select-none relative overflow-hidden"
                      title={`Khung giờ này đã được đặt trước bởi học sinh khác`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold line-through opacity-70">
                        <span>{slot.time}</span>
                        <span className="text-[9px] px-1 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                          {slot.period}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        <Lock className="w-3 h-3" /> Đã có người đặt
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot.time)}
                    className={`py-2.5 px-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-900/10 ring-2 ring-emerald-500/30'
                        : 'bg-[#FAF9F5] dark:bg-[#161D15] border-[#E5E2D9] dark:border-[#3A4738] hover:border-emerald-500/50 text-[#3A4036] dark:text-[#C5CDC2]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full text-xs font-bold">
                      <span>{slot.time}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-[#8E9B8A]'
                      }`}>
                        {slot.period}
                      </span>
                    </div>
                    <div className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${
                      isSelected ? 'text-emerald-100 font-bold' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></span>
                      <span>{isSelected ? 'Đang chọn' : 'Còn trống'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {currentSlotBookedStatus.isBooked && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Khung giờ <strong>{selectedTimeSlot}</strong> ngày <strong>{formatDateDisplay(selectedDate)}</strong> của {selectedCounselor.name} đã kín lịch. Vui lòng chọn khung giờ màu xanh còn trống bên trên.
                </span>
              </div>
            )}
          </div>

          {/* SECTION 4: TOPIC & PRIVATE NOTES */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-1.5">
                4. Chủ đề / Vấn đề cần tham vấn
              </label>
              
              {/* Quick Topic Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {topicSuggestions.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-[#FAF9F5] dark:bg-[#161D15] border border-[#E5E2D9] dark:border-[#3A4738] hover:border-emerald-500/50 text-[#4A5348] dark:text-[#BAC5B7] transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Căng thẳng kỳ thi THPT, Mâu thuẫn gia đình, Định hướng nghề nghiệp..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F5] dark:bg-[#161D15] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2A4228] dark:text-[#8BA888] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Ghi chú riêng tư (Tùy chọn)</span>
                <span className="text-[10px] text-[#8E9B8A] font-normal">Chỉ chuyên viên {selectedCounselor?.name} nhìn thấy</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Bạn có điều gì muốn chuyên viên chuẩn bị trước không? (Ví dụ: Mình thích trao đổi chậm rãi, hoặc muốn lắng nghe không phán xét...)"
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] bg-[#FAF9F5] dark:bg-[#161D15] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Send to chat checkbox if related thread/post exists */}
          {(relatedThreadId || relatedPostId) && (
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#161D15] border border-[#E5E2D9] dark:border-[#3A4738] cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={sendToChatCheckbox}
                onChange={(e) => setSendToChatCheckbox(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[#3A4036] dark:text-[#C5CDC2]">
                Tự động gửi thẻ hẹn & thông tin buổi gặp vào {relatedThreadId ? 'cuộc trò chuyện 1-1' : 'hộp thư bài viết'}
              </span>
            </label>
          )}

          {/* Security & Confidentiality Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3 text-xs text-[#2A4228] dark:text-[#8BA888]">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Cam kết Đạo đức & Bảo mật Học đường:</span> Buổi tham vấn tuân thủ quy tắc bảo mật thông tin 100%. Danh tính thật của bạn không bị tiết lộ cho bất kỳ bên thứ ba nào. Bạn có quyền dừng buổi gặp bất cứ lúc nào nếu cảm thấy không thoải mái.
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
              disabled={currentSlotBookedStatus.isBooked}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1E331D] via-[#284226] to-[#345431] hover:from-[#152414] hover:to-[#223820] text-white text-xs font-bold shadow-md shadow-emerald-950/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>Xác Nhận Đặt Lịch Hẹn ({selectedTimeSlot})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
