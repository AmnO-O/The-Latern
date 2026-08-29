import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Headphones, 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';
import { ActiveTab, School, Post } from '../types';

interface LandingPageProps {
  schools: School[];
  posts?: Post[];
  onSelectSchool: (school: School) => void;
  setActiveTab: (tab: ActiveTab) => void;
  openComposer: () => void;
  openEmergency: () => void;
  openVerify?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  schools,
  posts = [],
  onSelectSchool,
  setActiveTab,
  openComposer,
  openEmergency,
  openVerify
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchools = schools.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col items-center pb-24">
      {/* Hero Section */}
      <section className="w-full min-h-[480px] lg:min-h-[560px] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden pt-10 pb-16">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#8BA888]/15 blur-[120px] pointer-events-none"></div>

        {/* Natural Floating Icon */}
        <div className="w-24 h-24 relative pulse-soft mb-6 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[#8BA888] flex items-center justify-center text-white shadow-lg shadow-[#8BA888]/30">
            <div className="w-10 h-10 bg-white/70 rounded-full animate-pulse"></div>
          </div>
        </div>

        <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] dark:text-[#F2F7F1] max-w-2xl leading-tight mb-4 drop-shadow-2xs">
          Một nơi để nói, mà không cần nói tên.
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-muted)] dark:text-[#ABB8A8] max-w-xl mb-8 leading-relaxed font-semibold">
          Không gian an toàn & thấu hiểu dành riêng cho học sinh, sinh viên. Tự do chia sẻ cảm xúc trong <span className="text-[var(--accent-sage)] dark:text-[#8BA888] font-bold">Hộp thư Campus Hub</span> của trường bạn — nơi không có phán xét, được bảo vệ bởi công nghệ AI và đội ngũ chuyên gia tâm lý.
        </p>

        {/* Quick Search School Input */}
        <div className="w-full max-w-md bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-full p-2 flex items-center shadow-md mb-6 focus-within:border-[#2A4228] transition-colors">
          <Search className="w-4 h-4 text-[#2C382A] dark:text-[#8E9B8A] ml-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm hộp thư trường bạn (ví dụ: Nguyễn Du, Bách Khoa...)"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-[#0F180E] dark:text-[#E8ECE6] placeholder-[#2C382A] font-medium focus:outline-none"
          />
          <button
            onClick={() => setActiveTab('explore')}
            className="bg-[#2A4228] hover:bg-[#1B2C1A] text-white font-bold px-5 py-2.5 rounded-full text-xs transition-transform active:scale-95 shadow-xs"
          >
            Khám phá
          </button>
        </div>

        {/* Quick CTAs */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={openComposer}
            className="px-6 py-3 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Chia sẻ ẩn danh ngay</span>
          </button>

          <button
            onClick={openEmergency}
            className="px-6 py-3 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold text-sm hover:bg-rose-500/25 transition-all flex items-center gap-2"
          >
            <Headphones className="w-4 h-4" />
            <span>Tổng đài trợ giúp khẩn cấp</span>
          </button>
        </div>
      </section>

      {/* Featured Campus Hubs Grid */}
      <section className="w-full max-w-5xl px-4 py-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#2C382A] dark:text-[#8E9B8A]">Campus Hubs</span>
            <h2 className="font-serif italic text-2xl font-semibold text-[#0F180E] dark:text-[#E8ECE6] mt-1">Không gian riêng theo từng ngôi trường</h2>
          </div>
          <button
            onClick={() => setActiveTab('explore')}
            className="text-xs text-[#2A4228] dark:text-[#8BA888] hover:underline flex items-center gap-1 font-bold"
          >
            <span>Xem tất cả ({schools.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredSchools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchools.slice(0, 6).map((school) => (
              <div
                key={school.id}
                onClick={() => {
                  onSelectSchool(school);
                  setActiveTab('feed');
                }}
                className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-2xl p-5 cursor-pointer hover:-translate-y-1 hover:border-[#2A4228] transition-all group shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border inline-flex items-center gap-1 ${
                      school.type === 'highschool'
                        ? 'bg-[#EAF0E8] dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] border-[#C8D2C4] dark:border-[#3A4738]'
                        : 'bg-[#FEFAE0] dark:bg-[#2F382A] text-[#AA6828] border-[#C8D2C4] dark:border-[#3A4738]'
                    }`}>
                      {school.type === 'highschool' ? (
                        <BookOpen className="w-3.5 h-3.5" />
                      ) : (
                        <GraduationCap className="w-3.5 h-3.5" />
                      )}
                      <span>{school.type === 'highschool' ? 'THPT' : 'Đại Học'}</span>
                    </span>
                    <span className="text-xs text-[#2C382A] dark:text-[#8E9B8A] font-semibold flex items-center gap-1 shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                      {school.location}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#0F180E] dark:text-[#E8ECE6] group-hover:text-[#2A4228] dark:group-hover:text-[#8BA888] transition-colors line-clamp-1 mb-2">
                    {school.name}
                  </h3>
                </div>

                {(() => {
                  const schoolLetters = posts.filter(p => p.schoolId === school.id || p.schoolSlug === school.slug || p.schoolName === school.name);
                  const liveLetterCount = Math.max(school.letterCount || 0, schoolLetters.length);
                  const now = Date.now();
                  const oneDayMs = 24 * 60 * 60 * 1000;
                  const newToday = schoolLetters.filter(p => {
                    if (p.createdAt) return (now - p.createdAt) < oneDayMs;
                    if (p.timestamp) {
                      const t = p.timestamp.toLowerCase();
                      return t.includes('vừa') || t.includes('phút') || t.includes('giờ') || t.includes('hôm nay');
                    }
                    return false;
                  }).length;
                  const liveNewCount = Math.max(school.newCount || 0, newToday);

                  return (
                    <div className="pt-3 mt-2 border-t border-[#E5E2D9] dark:border-[#2C382A] flex items-center justify-between text-xs text-[#2C382A] dark:text-[#8E9B8A] font-semibold">
                      <span>🌱 {liveLetterCount.toLocaleString()} lá thư</span>
                      <span className="text-[#2A4228] dark:text-[#8BA888] font-bold bg-[#EAF0E8] dark:bg-[#2A3628] px-2.5 py-0.5 rounded-full">
                        +{liveNewCount} mới
                      </span>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF0E8] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] text-[#2A4228] dark:text-[#8BA888] flex items-center justify-center mx-auto text-2xl font-bold">
              🏫
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#0F180E] dark:text-[#E8ECE6]">
                Chưa có Campus Hub nào được kích hoạt
              </h3>
              <p className="text-xs text-[#2C382A] dark:text-[#8E9B8A] mt-1 leading-relaxed font-medium">
                Hãy là người đầu tiên xác thực thẻ học sinh / sinh viên để mở Hộp thư Campus Hub cho trường của bạn!
              </p>
            </div>
            <button
              onClick={() => {
                if (openVerify) {
                  openVerify();
                } else {
                  setActiveTab('profile');
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2A4228] text-white text-xs font-bold hover:bg-[#1f311d] transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Xác thực trường học ngay</span>
            </button>
          </div>
        )}
      </section>

      {/* How it Works - 3 Bento Steps */}
      <section className="w-full max-w-5xl px-4 py-12">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#2C382A] dark:text-[#8E9B8A]">Cách thức hoạt động</span>
          <h2 className="font-serif italic text-2xl sm:text-3xl font-semibold text-[#0F180E] dark:text-[#E8ECE6] mt-1">3 Bước hướng tới sự chữa lành</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#2A4228]/15 border border-[#2A4228]/30 flex items-center justify-center text-[#2A4228] dark:text-[#8BA888] mb-4 font-bold text-sm">
              01
            </div>
            <h3 className="font-serif font-bold text-lg text-[#0F180E] dark:text-[#E8ECE6] mb-2">Xác thực trường học</h3>
            <p className="text-xs text-[#2C382A] dark:text-[#8E9B8A] leading-relaxed font-medium">
              Xác thực thẻ HS/SV giúp bạn tham gia vào Hộp thư riêng của trường mình mà vẫn đảm bảo 100% ẩn danh cá nhân.
            </p>
          </div>

          <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#2A4228]/15 border border-[#2A4228]/30 flex items-center justify-center text-[#2A4228] dark:text-[#8BA888] mb-4 font-bold text-sm">
              02
            </div>
            <h3 className="font-serif font-bold text-lg text-[#0F180E] dark:text-[#E8ECE6] mb-2">Chia sẻ ẩn danh</h3>
            <p className="text-xs text-[#2C382A] dark:text-[#8E9B8A] leading-relaxed font-medium">
              Trút bỏ mọi gánh nặng học tập, gia đình, tình cảm. Công nghệ AI kiểm duyệt ngăn chặn mọi hành vi bóc phốt, công kích.
            </p>
          </div>

          <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#AA6828]/20 border border-[#AA6828]/30 flex items-center justify-center text-[#AA6828] mb-4 font-bold text-sm">
              03
            </div>
            <h3 className="font-serif font-bold text-lg text-[#0F180E] dark:text-[#E8ECE6] mb-2">Lắng nghe & Đồng cảm</h3>
            <p className="text-xs text-[#2C382A] dark:text-[#8E9B8A] leading-relaxed font-medium">
              Nhận những phản hồi ấm áp từ bạn học đồng cảm, người lắng nghe uy tín và đội ngũ chuyên gia tâm lý học đường.
            </p>
          </div>
        </div>
      </section>

      {/* Safety & AI Moderation Pillar */}
      <section className="w-full max-w-5xl px-4 py-8">
        <div className="bg-[#F8F5F0] dark:bg-[#222B21] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#8BA888]/20 border border-[#8BA888]/40 flex items-center justify-center text-[#5A6E58] dark:text-[#8BA888] shrink-0 font-bold text-xl">
            AI
          </div>

          <div className="flex-1 space-y-3 text-center md:text-left">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A4A095] dark:text-[#8E9B8A]">Môi trường hoàn toàn văn minh</span>
            <h2 className="font-serif italic text-2xl font-semibold text-[#3A4036] dark:text-[#E8ECE6]">AI Kiểm duyệt chủ động & Chuyên gia đồng hành</h2>
            <p className="text-xs sm:text-sm text-[#7E7A71] dark:text-[#8E9B8A] leading-relaxed">
              HealSpace sử dụng trí tuệ nhân tạo Gemini để tự động phát hiện và chặn các lá thư chứa hành vi bóc phốt, bắt nạt mạng hay công kích cá nhân trước khi được đăng. Đối với các trường hợp có tín hiệu khủng hoảng, hệ thống chủ động gợi ý kết nối trực tiếp với Chuyên gia Tâm lý.
            </p>
            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4 text-xs font-medium text-[#3A4036] dark:text-[#E8ECE6]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#8BA888]" />
                100% Ẩn danh danh tính
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#8BA888]" />
                AI Lọc độc hại 24/7
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#8BA888]" />
                Tư vấn tâm lý chuẩn mực
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
