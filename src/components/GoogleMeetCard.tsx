import React, { useState } from 'react';
import { 
  Video, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Lock, 
  Building, 
  Sparkles,
  ShieldCheck,
  CalendarPlus
} from 'lucide-react';
import { CounselingAppointment } from '../types';

interface GoogleMeetCardProps {
  meetUrl?: string;
  topic?: string;
  date?: string;
  timeSlot?: string;
  locationName?: string;
  meetingType?: 'google_meet' | 'in_person' | 'voice_call';
  counselorName?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  compact?: boolean;
}

export const GoogleMeetCard: React.FC<GoogleMeetCardProps> = ({
  meetUrl,
  topic = 'Buổi tham vấn tâm lý 1-1',
  date,
  timeSlot,
  locationName,
  meetingType = 'google_meet',
  counselorName,
  status = 'confirmed',
  compact = false
}) => {
  const [copied, setCopied] = useState(false);

  // Extract meet code if meetUrl provided
  const getMeetCode = (url?: string) => {
    if (!url) return '';
    const match = url.match(/meet\.google\.com\/([a-z0-9-]+)/i);
    return match ? match[1] : url;
  };

  const handleCopyLink = () => {
    if (!meetUrl) return;
    navigator.clipboard.writeText(meetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`[Tham vấn Tâm lý Học đường] ${topic}`);
    const details = encodeURIComponent(
      `Buổi gặp tham vấn tâm lý học đường cùng ${counselorName || 'Chuyên viên'}.\n` +
      (meetUrl ? `Link Google Meet: ${meetUrl}\n` : '') +
      (locationName ? `Địa điểm: ${locationName}\n` : '') +
      `Bảo mật 100% ẩn danh học đường.`
    );
    const location = encodeURIComponent(meetUrl || locationName || 'Google Meet');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  const isMeet = meetingType === 'google_meet' || Boolean(meetUrl);

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      isMeet 
        ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 dark:from-[#1A261A] dark:via-[#162016] dark:to-[#121A13] border-emerald-500/30 shadow-md' 
        : 'bg-[#F7F5F0] dark:bg-[#1C251A] border-[#E5E2D9] dark:border-[#3A4738] shadow-sm'
    } ${compact ? 'p-3 my-1.5' : 'p-4 my-2.5'}`}>
      
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-emerald-500/20 dark:border-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className={`rounded-xl flex items-center justify-center ${
            isMeet 
              ? 'w-8 h-8 bg-emerald-600 text-white shadow-xs' 
              : 'w-8 h-8 bg-amber-600 text-white'
          }`}>
            {isMeet ? <Video className="w-4 h-4" /> : <Building className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                {isMeet ? 'Google Meet Tham Vấn Học Đường' : 'Lịch Hẹn Gặp Trực Tiếp Tại Trường'}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                🔒 Bảo mật 1-1
              </span>
            </div>
            <p className="text-[10px] text-[#6B7567] dark:text-[#A0ABA0] font-medium">
              {counselorName ? `Cố vấn: ${counselorName}` : 'Tham vấn tâm lý & Giải tỏa áp lực'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
          status === 'confirmed' 
            ? 'bg-emerald-500 text-white' 
            : status === 'completed'
            ? 'bg-blue-500 text-white'
            : status === 'cancelled'
            ? 'bg-rose-500 text-white'
            : 'bg-amber-500 text-white'
        }`}>
          {status === 'confirmed' ? '✓ Đã xác nhận' : status === 'completed' ? '✓ Đã hoàn tất' : status === 'cancelled' ? '✕ Đã hủy' : '⏳ Đang chờ'}
        </span>
      </div>

      {/* Topic & Details */}
      <div className="py-2.5 space-y-1.5">
        <h4 className="text-xs sm:text-sm font-bold text-[#1C231B] dark:text-[#E8ECE6] leading-snug">
          📌 {topic}
        </h4>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#4A5247] dark:text-[#C5CDC2]">
          {date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{date}</span>
            </span>
          )}
          {timeSlot && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <strong className="text-[#1C231B] dark:text-[#E8ECE6]">{timeSlot}</strong>
            </span>
          )}
          {locationName && !meetUrl && (
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{locationName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Google Meet Action Box */}
      {isMeet && meetUrl && (
        <div className="pt-2 border-t border-emerald-500/15 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] text-[#6B7567] dark:text-[#A0ABA0]">Mã phòng:</span>
            <code className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md truncate max-w-[140px] sm:max-w-[200px]">
              {getMeetCode(meetUrl)}
            </code>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 px-2.5 rounded-xl bg-white dark:bg-[#202C20] border border-emerald-500/30 text-[11px] font-bold text-[#2A4228] dark:text-[#8BA888] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1 shadow-2xs"
              title="Sao chép link Google Meet"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>

            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 px-2 rounded-xl bg-white dark:bg-[#202C20] border border-emerald-500/30 text-[11px] font-bold text-[#2A4228] dark:text-[#8BA888] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1 shadow-2xs"
              title="Lưu lịch hẹn vào Google Calendar"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Lưu Calendar</span>
            </a>

            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Tham Gia Google Meet</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to extract Meet link and details from message or reply text
export const parseMeetAppointmentFromText = (text: string) => {
  if (!text) return null;
  const meetUrlMatch = text.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i);
  const isMeetTagged = text.includes('Google Meet') || text.includes('meet.google.com') || text.includes('Lịch hẹn tham vấn');

  if (!meetUrlMatch && !isMeetTagged) {
    return null;
  }

  // Extract Date if present
  const dateMatch = text.match(/Ngày:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4}|Hôm nay|Ngày mai)/i);
  // Extract Time if present
  const timeMatch = text.match(/Khung giờ:\s*([0-9]{2}:[0-9]{2}\s*-\s*[0-9]{2}:[0-9]{2})/i);
  // Extract Topic if present
  const topicMatch = text.match(/Chủ đề:\s*([^\n\r]+)/i);

  return {
    meetUrl: meetUrlMatch ? meetUrlMatch[0] : undefined,
    date: dateMatch ? dateMatch[1] : undefined,
    timeSlot: timeMatch ? timeMatch[1] : undefined,
    topic: topicMatch ? topicMatch[1].trim() : 'Tham vấn tâm lý học đường 1-1'
  };
};
