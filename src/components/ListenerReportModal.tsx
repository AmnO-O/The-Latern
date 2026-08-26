import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Lock, 
  FileWarning
} from 'lucide-react';
import { ListenerReport } from '../types';

interface ListenerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listenerName: string;
  threadId?: string;
  postId?: string;
  reporterAnonId: string;
  onSubmitReport: (report: ListenerReport) => void;
}

export const ListenerReportModal: React.FC<ListenerReportModalProps> = ({
  isOpen,
  onClose,
  listenerName,
  threadId,
  postId,
  reporterAnonId,
  onSubmitReport
}) => {
  const [reason, setReason] = useState<ListenerReport['reason']>('privacy_invasion');
  const [detail, setDetail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const REPORT_REASONS = [
    {
      id: 'privacy_invasion' as const,
      title: 'Xin thông tin nhạy cảm / Đòi Facebook, SĐT riêng',
      desc: 'Cố tình gạ gẫm, đòi số liên lạc hoặc truy tìm danh tính ngoài đời thực'
    },
    {
      id: 'harassment_toxic' as const,
      title: 'Quấy rối, công kích hoặc dùng từ ngữ thô bạo',
      desc: 'Có lời lẽ lăng mạ, phán xét độc hại hoặc quấy rối tinh thần'
    },
    {
      id: 'unsolicited_advice' as const,
      title: 'Đưa lời khuyên y khoa/tâm lý sai lệch, nguy hiểm',
      desc: 'Tự ý chẩn đoán bệnh, kê đơn hoặc xúi giục hành vi tự hại'
    },
    {
      id: 'inappropriate_contact' as const,
      title: 'Hành vi gạ gẫm tình cảm hoặc mục đích không trong sáng',
      desc: 'Lợi dụng vị trí người lắng nghe để tìm kiếm quan hệ tình cảm'
    },
    {
      id: 'other' as const,
      title: 'Hành vi vi phạm quy chuẩn cộng đồng khác',
      desc: 'Các hành vi không phù hợp với chuẩn mực lắng nghe an toàn'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim()) return;

    const report: ListenerReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      threadId,
      postId,
      reportedListenerName: listenerName,
      reporterAnonId,
      reason,
      reasonDetail: detail.trim(),
      status: 'pending',
      createdAt: Date.now()
    };

    onSubmitReport(report);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-[#FCFCFA] dark:bg-[#1A2218] rounded-3xl border border-[#DCE4D8] dark:border-[#3A4738] shadow-2xl max-w-md w-full p-5 sm:p-6 relative animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#182217] dark:text-[#E8ECE6]">
              Đã tiếp nhận báo cáo vi phạm
            </h3>
            <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] leading-relaxed">
              Ban Quản Trị sẽ xem xét ngay và tước quyền Người Lắng Nghe nếu có dấu hiệu vi phạm để bảo đảm môi trường an toàn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Bảo vệ an toàn • Báo cáo Người Lắng Nghe</span>
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#182217] dark:text-[#E8ECE6]">
                Báo cáo: {listenerName}
              </h2>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A]">
                Mọi báo cáo được giữ bảo mật 100%. Ban Quản Trị sẽ kiểm tra nhật ký và xử lý trong vòng 12h.
              </p>
            </div>

            {/* Reason selector */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {REPORT_REASONS.map(r => {
                const isSelected = reason === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500 font-semibold'
                        : 'bg-white dark:bg-[#20281F] border-[#DCE4D8] dark:border-[#3A4738]'
                    }`}
                  >
                    <div className="text-xs text-[#182217] dark:text-[#E8ECE6] font-bold">
                      {r.title}
                    </div>
                    <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] leading-snug">
                      {r.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Details */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                Mô tả chi tiết hành vi: <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="Vui lòng cung cấp chi tiết câu nói hoặc hành động vi phạm..."
                rows={3}
                required
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] rounded-xl p-2.5 text-xs text-[#182217] dark:text-[#E8ECE6] placeholder-[#8E9B8A] focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E2D9] dark:border-[#3A4738]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-[#DCE4D8] dark:border-[#3A4738] text-xs font-semibold text-[#5A6D58] dark:text-[#8E9B8A] hover:bg-[#FAF9F6] dark:hover:bg-[#20281F]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!detail.trim()}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Gửi Báo Cáo Vi Phạm</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
