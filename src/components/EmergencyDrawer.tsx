import React, { useState, useEffect } from 'react';
import { EMERGENCY_HOTLINES } from '../data/mockData';

interface EmergencyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyDrawer: React.FC<EmergencyDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'hotlines' | 'breathing' | 'grounding'>('hotlines');
  
  // Breathing state
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breathTimer, setBreathTimer] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev > 1) return prev - 1;

          if (breathPhase === 'in') {
            setBreathPhase('hold');
            return 7;
          } else if (breathPhase === 'hold') {
            setBreathPhase('out');
            return 8;
          } else {
            setBreathPhase('in');
            return 4;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E2D9] dark:border-[#3A4738] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <h2 className="font-serif italic font-bold text-lg text-rose-700 dark:text-rose-400">
                Hỗ trợ Khẩn cấp & An toàn 24/7
              </h2>
              <p className="text-[11px] text-[#A4A095] dark:text-[#8E9B8A]">Bạn luôn có sự trợ giúp, không bao giờ phải đơn độc</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A4A095] hover:text-[#3A4036] dark:hover:text-[#E8ECE6]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-full bg-[#FAF9F6] dark:bg-[#20281F] p-1 mb-4 text-xs font-semibold border border-[#E5E2D9] dark:border-[#3A4738]">
          <button
            onClick={() => setActiveTab('hotlines')}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              activeTab === 'hotlines' ? 'bg-rose-500 text-white font-bold shadow-sm' : 'text-[#7E7A71] dark:text-[#8E9B8A]'
            }`}
          >
            Hotline Khẩn cấp
          </button>
          <button
            onClick={() => setActiveTab('breathing')}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              activeTab === 'breathing' ? 'bg-[#5A6E58] text-white font-bold shadow-sm' : 'text-[#7E7A71] dark:text-[#8E9B8A]'
            }`}
          >
            Hít thở 4-7-8
          </button>
          <button
            onClick={() => setActiveTab('grounding')}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              activeTab === 'grounding' ? 'bg-[#8BA888] text-white font-bold shadow-sm' : 'text-[#7E7A71] dark:text-[#8E9B8A]'
            }`}
          >
            Trấn an 5-4-3-2-1
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'hotlines' && (
            <div className="space-y-3">
              <p className="text-xs text-[#7E7A71] dark:text-[#8E9B8A] leading-relaxed">
                Nếu bạn hoặc ai đó đang trải qua cảm giác bế tắc, khủng hoảng nghiêm trọng, hãy gọi ngay cho các đường dây tư vấn hoàn toàn miễn phí dưới đây:
              </p>

              {EMERGENCY_HOTLINES.map((h, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border ${
                    h.isEmergency
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#E5E2D9] dark:border-[#3A4738]'
                  } flex items-center justify-between gap-3`}
                >
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-[#3A4036] dark:text-[#E8ECE6]">
                      {h.name}
                    </h3>
                    <p className="text-[11px] text-[#A4A095] dark:text-[#8E9B8A] mt-0.5">{h.desc}</p>
                  </div>

                  <a
                    href={`tel:${h.number.replace(/\s+/g, '')}`}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-full text-xs shrink-0 flex items-center gap-1 shadow-md transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                    <span>{h.number}</span>
                  </a>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'breathing' && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <p className="text-xs text-[#7E7A71] dark:text-[#8E9B8A]">
                Kỹ thuật hít thở 4-7-8 giúp xoa dịu hệ thần kinh và giải tỏa lo âu tức thì.
              </p>

              {/* Visual Breathing Circle */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div
                  className={`absolute rounded-full border-4 border-[#8BA888] transition-all duration-1000 ${
                    breathPhase === 'in'
                      ? 'w-36 h-36 bg-[#8BA888]/20'
                      : breathPhase === 'hold'
                      ? 'w-36 h-36 bg-[#8BA888]/40 shadow-lg'
                      : 'w-20 h-20 bg-[#8BA888]/10'
                  }`}
                ></div>

                <div className="z-10 flex flex-col items-center">
                  <span className="text-[#5A6E58] dark:text-[#8BA888] font-bold text-3xl">{breathTimer}s</span>
                  <span className="text-xs uppercase font-bold tracking-wider text-[#3A4036] dark:text-[#E8ECE6]">
                    {breathPhase === 'in' ? 'Hít vào chậm' : breathPhase === 'hold' ? 'Giữ hơi thở' : 'Thở ra nhẹ nhàng'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className="bg-[#5A6E58] hover:bg-[#4A5D48] text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-md"
              >
                {isBreathingActive ? 'Tạm dừng nhịp thở' : 'Bắt đầu bài tập hít thở'}
              </button>
            </div>
          )}

          {activeTab === 'grounding' && (
            <div className="space-y-3 text-xs text-[#3A4036] dark:text-[#E8ECE6] leading-relaxed">
              <p className="text-[#7E7A71] dark:text-[#8E9B8A]">
                Khi cảm thấy hoảng loạn hoặc mất phương hướng, hãy thực hành quy tắc 5-4-3-2-1 để kéo suy nghĩ quay về thực tại:
              </p>

              <div className="p-4 rounded-xl bg-[#F1F3EF] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] space-y-2">
                <p>👁️ <strong>5 điều</strong> bạn đang nhìn thấy quanh phòng (ví dụ: chiếc bàn, ánh đèn, ngọn cây...)</p>
                <p>🖐️ <strong>4 thứ</strong> bạn có thể chạm vào (ví dụ: mặt bàn nhẵn, áo ấm, đôi bàn tay...)</p>
                <p>👂 <strong>3 âm thanh</strong> bạn đang nghe thấy (ví dụ: tiếng quạt, tiếng mưa, tiếng xe...)</p>
                <p>👃 <strong>2 mùi hương</strong> bạn cảm nhận được (ví dụ: mùi sách vở, mùi không khí...)</p>
                <p>👅 <strong>1 hương vị</strong> bạn nếm được lúc này.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
