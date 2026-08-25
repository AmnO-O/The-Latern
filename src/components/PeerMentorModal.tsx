import React, { useState } from 'react';
import { 
  X, 
  HeartHandshake, 
  ShieldCheck, 
  Sparkles, 
  GraduationCap, 
  CheckCircle2, 
  Users, 
  Lock,
  MessageSquareHeart,
  BookOpen
} from 'lucide-react';
import { School, UserState } from '../types';

interface PeerMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  setUserState: React.Dispatch<React.SetStateAction<UserState>>;
  schools: School[];
  onSuccess?: () => void;
}

export const PeerMentorModal: React.FC<PeerMentorModalProps> = ({
  isOpen,
  onClose,
  userState,
  setUserState,
  schools,
  onSuccess
}) => {
  const verifiedList = userState.verifiedSchools || (userState.selectedSchool ? [userState.selectedSchool] : []);
  const defaultSchoolId = verifiedList[0]?.id || schools[0]?.id || 'neu';

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(defaultSchoolId);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([
    'Áp lực kỳ vọng gia đình & So sánh',
    'Khủng hoảng định hướng ngành nghề'
  ]);
  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const strengthOptions = [
    'Áp lực kỳ vọng gia đình & So sánh',
    'Khoảng cách giao tiếp với cha mẹ',
    'Khủng hoảng chọn ngành / Chuyển ngành',
    'Bế tắc phương pháp học & Thi cử',
    'Khó hòa nhập môi trường đại học',
    'Rối bời tình cảm & Mối quan hệ bạn bè',
    'Cô đơn & Trầm lắng cảm xúc'
  ];

  const handleToggleStrength = (strength: string) => {
    setSelectedStrengths(prev => 
      prev.includes(strength) ? prev.filter(s => s !== strength) : [...prev, strength]
    );
  };

  const selectedSchoolObj = schools.find(s => s.id === selectedSchoolId) || schools[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setUserState(prev => ({
        ...prev,
        isPeerMentor: true,
        userRole: 'peer_listener',
        peerMentorApplication: {
          schoolId: selectedSchoolId,
          schoolName: selectedSchoolObj?.name || 'Trường học',
          status: 'approved',
          appliedAt: Date.now(),
          strengths: selectedStrengths,
          motivation: motivation.trim(),
          commitmentAccepted: true
        }
      }));
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white dark:bg-[#1C251A] rounded-3xl border border-[#C8D2C4] dark:border-[#3A4738] shadow-2xl max-w-xl w-full p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7E7A71] dark:text-[#8E9B8A] hover:bg-[#FAF9F6] dark:hover:bg-[#2A3628] transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedSuccess ? (
          <div className="text-center py-6 space-y-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center text-3xl shadow-sm">
              🌿
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif italic text-2xl font-bold text-[#182217] dark:text-[#E8ECE6]">
                Chúc mừng bạn đã gia nhập Mạng Lưới Người Lắng Nghe!
              </h2>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] max-w-md mx-auto leading-relaxed">
                Huy hiệu <strong>🌿 Người Lắng Nghe Đồng Hành (Peer Mentor)</strong> của <strong>{selectedSchoolObj?.name}</strong> đã được kích hoạt trên hồ sơ của bạn.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#2A4228]/5 dark:bg-[#20281F] border border-[#2A4228]/20 text-left space-y-2 text-xs">
              <div className="font-bold text-[#2A4228] dark:text-[#8BA888] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đặc quyền mới của bạn:</span>
              </div>
              <ul className="space-y-1 text-[#3A4036] dark:text-[#C5D0C3] list-disc list-inside text-[11px] leading-relaxed">
                <li>Phản hồi và tư vấn chuyên sâu trong <strong>Hòm Thư Tư Vấn Tâm Lý Trường</strong>.</li>
                <li>Được người gửi thư 1-1 chủ động kết nối trò chuyện thấu cảm.</li>
                <li>Góp phần xóa bỏ rào cản tâm lý học đường và hàn gắn khoảng cách thế hệ.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Bắt đầu hành trình lắng nghe 🌿
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-[#2A4228]/15 border border-[#2A4228]/30 flex items-center justify-center text-[#2A4228] dark:text-[#8BA888] shrink-0 text-xl shadow-xs">
                🤝
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#2A4228] dark:text-[#8BA888] bg-[#2A4228]/10 px-2 py-0.5 rounded-full border border-[#2A4228]/20">
                  Peer-to-Peer Support Network
                </span>
                <h2 className="font-serif italic text-xl sm:text-2xl font-bold text-[#182217] dark:text-[#E8ECE6] mt-0.5">
                  Đăng ký trở thành Người Lắng Nghe Đồng Hành
                </h2>
                <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A] mt-1 leading-relaxed">
                  Trở thành điểm tựa tinh thần, lắng nghe những áp lực gia đình và rào cản học đường của các bạn khóa dưới mà không phán xét.
                </p>
              </div>
            </div>

            {/* Why Peer Mentor matters card */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 text-xs">
              <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
              <p className="text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                Nhiều bạn học sinh/sinh viên rất ngại đến phòng tâm lý trường vì sợ bị dán nhãn, và không thể tâm sự với cha mẹ vì khoảng cách thế hệ. Một người anh/chị khóa trên thấu hiểu chính là chiếc phao cứu sinh quý giá nhất.
              </p>
            </div>

            {/* School Selector */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#2C382A] dark:text-[#8E9B8A] mb-1.5">
                Trường bạn muốn đại diện đồng hành
              </label>
              <select
                value={selectedSchoolId}
                onChange={e => setSelectedSchoolId(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl p-2.5 text-xs text-[#182217] dark:text-[#E8ECE6] font-bold focus:outline-none focus:border-[#2A4228]"
              >
                {schools.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#FAF9F6] dark:bg-[#20281F] text-[#182217] dark:text-[#E8ECE6]">
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Strengths & Focus Areas */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#2C382A] dark:text-[#8E9B8A] mb-1.5">
                Chủ đề bạn tự tin lắng nghe & đồng cảm nhất (Chọn nhiều)
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

            {/* Motivation / Experience */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-[#2C382A] dark:text-[#8E9B8A] mb-1.5">
                Đôi dòng tâm huyết / Kinh nghiệm của bạn (Không bắt buộc)
              </label>
              <textarea
                value={motivation}
                onChange={e => setMotivation(e.target.value)}
                placeholder="Ví dụ: Mình là cựu sinh viên K19, từng trải qua giai đoạn mâu thuẫn nặng nề với bố mẹ về việc chọn ngành. Mình muốn giúp các bạn khóa dưới tìm được tiếng nói chung..."
                rows={3}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl p-3 text-xs text-[#182217] dark:text-[#E8ECE6] placeholder-[#A4A095] focus:outline-none focus:border-[#2A4228] leading-relaxed"
              />
            </div>

            {/* Code of Conduct & Ethics Checkbox */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-[#2A4228] w-4 h-4 rounded"
                />
                <div className="text-[11px] text-[#2C382A] dark:text-[#8E9B8A] leading-relaxed">
                  <span className="font-bold text-[#182217] dark:text-[#E8ECE6]">Cam kết Đạo đức & Bảo mật:</span> Tôi cam kết luôn lắng nghe với lòng thấu cảm, không phán xét, tôn trọng quyền bảo mật danh tính tuyệt đối của người gửi và sẽ kết nối đường dây hỗ trợ khẩn cấp nếu phát hiện nguy cơ tự hại.
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
                disabled={isSubmitting || !agreeTerms || selectedStrengths.length === 0}
                className="px-6 py-2 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang kích hoạt...</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake className="w-4 h-4" />
                    <span>Kích hoạt Vai trò Peer Mentor</span>
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
