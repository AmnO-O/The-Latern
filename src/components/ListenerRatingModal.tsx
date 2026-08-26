import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  Sparkles, 
  ThumbsUp, 
  Send, 
  Smile, 
  CheckCircle2, 
  Flame, 
  Leaf, 
  MessageSquare
} from 'lucide-react';
import { ListenerRatingFeedback } from '../types';

interface ListenerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listenerName: string;
  threadId?: string;
  postId?: string;
  senderAnonId: string;
  onSubmitRating: (rating: ListenerRatingFeedback) => void;
}

export const ListenerRatingModal: React.FC<ListenerRatingModalProps> = ({
  isOpen,
  onClose,
  listenerName,
  threadId,
  postId,
  senderAnonId,
  onSubmitRating
}) => {
  const [selectedType, setSelectedType] = useState<ListenerRatingFeedback['ratingType']>('warm_heart');
  const [comment, setComment] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const RATING_TYPES = [
    {
      id: 'warm_heart' as const,
      label: 'Ấm áp & Chân thành',
      desc: 'Giúp mình cảm thấy được lắng nghe, không còn cô đơn',
      icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />,
      bg: 'hover:bg-rose-500/10 border-rose-500/30'
    },
    {
      id: 'deep_empathy' as const,
      label: 'Thấu cảm sâu sắc',
      desc: 'Hiểu đúng cảm xúc mình đang trải qua mà không hề phán xét',
      icon: <Leaf className="w-5 h-5 text-emerald-600 fill-emerald-600" />,
      bg: 'hover:bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'helpful' as const,
      label: 'Lời khuyên hữu ích',
      desc: 'Gợi mở hướng suy nghĩ tích cực và cách giải tỏa nhẹ nhàng',
      icon: <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />,
      bg: 'hover:bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'grateful' as const,
      label: 'Vô cùng biết ơn',
      desc: 'Cảm ơn bạn vì đã dành thời gian quý báu đồng hành cùng mình',
      icon: <ThumbsUp className="w-5 h-5 text-sky-500 fill-sky-500" />,
      bg: 'hover:bg-sky-500/10 border-sky-500/30'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitRating({
      threadId,
      postId,
      listenerName,
      senderAnonId,
      ratingType: selectedType,
      comment: comment.trim() || undefined,
      createdAt: Date.now()
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
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
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center animate-bounce">
              <Heart className="w-8 h-8 fill-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-[#182217] dark:text-[#E8ECE6]">
              Đã gửi đánh giá ấm áp!
            </h3>
            <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A]">
              Cảm ơn bạn đã tiếp thêm năng lượng tích cực cho người lắng nghe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-rose-500" />
                <span>Healing Rating • Đánh giá thấu cảm</span>
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#182217] dark:text-[#E8ECE6]">
                Gửi phản hồi cho {listenerName}
              </h2>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A]">
                Bạn cảm thấy thế nào sau khi trò chuyện / nhận lời khuyên từ người bạn này?
              </p>
            </div>

            {/* Selection Grid */}
            <div className="space-y-2">
              {RATING_TYPES.map(item => {
                const isSelected = selectedType === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedType(item.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500 shadow-2xs font-semibold'
                        : 'bg-white dark:bg-[#20281F] border-[#DCE4D8] dark:border-[#3A4738]'
                    }`}
                  >
                    <div className="shrink-0">{item.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] truncate">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Comment */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                Lời nhắn gửi riêng (Tùy chọn):
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Viết một vài lời cảm ơn ngọt ngào..."
                rows={2}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] rounded-xl p-2.5 text-xs text-[#182217] dark:text-[#E8ECE6] placeholder-[#8E9B8A] focus:outline-none focus:ring-1 focus:ring-[#2A4228] resize-none leading-relaxed"
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
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Gửi lời cảm ơn</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
