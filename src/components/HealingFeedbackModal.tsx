import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  Sparkles, 
  Send, 
  Smile, 
  MessageCircleHeart, 
  Lightbulb, 
  Shuffle, 
  CheckCircle2, 
  Gift, 
  Flower2,
  BookmarkCheck,
  Flame
} from 'lucide-react';
import { HealingNote, HealingCategory, School, UserState } from '../types';

interface HealingFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: HealingNote[];
  onAddNote: (note: Omit<HealingNote, 'id' | 'createdAt' | 'likesCount'>) => void;
  onLikeNote: (noteId: string) => void;
  currentSchool?: School;
  userState: UserState;
}

export const HealingFeedbackModal: React.FC<HealingFeedbackModalProps> = ({
  isOpen,
  onClose,
  notes,
  onAddNote,
  onLikeNote,
  currentSchool,
  userState,
}) => {
  const [activeTab, setActiveTab] = useState<'wall' | 'compose'>('wall');
  const [filterCategory, setFilterCategory] = useState<'all' | HealingCategory>('all');
  
  // Compose form state
  const [category, setCategory] = useState<HealingCategory>('community_kindness');
  const [message, setMessage] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedColor, setSelectedColor] = useState<'emerald' | 'amber' | 'rose' | 'sky' | 'violet'>('emerald');
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);

  // Random drawn note state
  const [randomNote, setRandomNote] = useState<HealingNote | null>(null);
  const [isDrawingRandom, setIsDrawingRandom] = useState(false);

  if (!isOpen) return null;

  const filteredNotes = notes.filter((n) => {
    if (filterCategory === 'all') return true;
    return n.category === filterCategory;
  });

  const handleDrawRandom = () => {
    if (notes.length === 0) return;
    setIsDrawingRandom(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * notes.length);
      setRandomNote(notes[randomIndex]);
      setIsDrawingRandom(false);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    let sender = `Người gửi ẩn danh #${userState.userAnonNumber || 100}`;
    if (useCustomName && customName.trim()) {
      sender = customName.trim();
    } else if (userState.googleUser?.displayName) {
      sender = userState.googleUser.displayName;
    }

    onAddNote({
      category,
      senderName: sender,
      schoolName: currentSchool?.name || 'Sanctuary Học Đường',
      message: message.trim(),
      tagColor: selectedColor,
    });

    setMessage('');
    setCustomName('');
    setIsSuccessSubmitted(true);
    setTimeout(() => {
      setIsSuccessSubmitted(false);
      setActiveTab('wall');
    }, 1500);
  };

  const getCategoryBadge = (cat: HealingCategory) => {
    switch (cat) {
      case 'dev_thanks':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
            <Heart className="w-3 h-3 text-emerald-600" />
            <span>Gửi Dev Team & Cố Vấn</span>
          </span>
        );
      case 'idea_feedback':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-800 dark:text-sky-300">
            <Lightbulb className="w-3 h-3 text-sky-600" />
            <span>Góp Ý Tính Năng</span>
          </span>
        );
      case 'community_kindness':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-300">
            <Flower2 className="w-3 h-3 text-rose-500" />
            <span>Lời Chúc Cộng Đồng</span>
          </span>
        );
    }
  };

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'amber':
        return 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20';
      case 'rose':
        return 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20';
      case 'sky':
        return 'border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/20';
      case 'violet':
        return 'border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/20';
      case 'emerald':
      default:
        return 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20';
    }
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-4 animate-scale-in max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE4D8] dark:border-[#3A4738] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2A4228] text-white flex items-center justify-center shadow-sm">
              <MessageCircleHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif italic font-bold text-xl text-[#182217] dark:text-[#E8ECE6] flex items-center gap-2">
                <span>Lời Nhắn Chữa Lành & Feedback</span>
              </h3>
              <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A]">
                Lan tỏa năng lượng tích cực, gửi lời chúc & góp ý xây dựng cộng đồng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#5A6D58] dark:text-[#8E9B8A] transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between gap-2 border-b border-[#DCE4D8] dark:border-[#3A4738] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('wall')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'wall'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] hover:text-[#182217] dark:hover:text-[#E8ECE6]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tường Lời Chúc ({notes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'compose'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] hover:text-[#182217] dark:hover:text-[#E8ECE6]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Thiệp Chữa Lành</span>
            </button>
          </div>

          {activeTab === 'wall' && (
            <button
              onClick={handleDrawRandom}
              disabled={isDrawingRandom || notes.length === 0}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="Rút một quẻ chúc lành ngẫu nhiên"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isDrawingRandom ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Rút Quẻ May Mắn</span>
            </button>
          )}
        </div>

        {/* Tab 1: Wall & Random Lucky Card */}
        {activeTab === 'wall' && (
          <div className="flex-1 overflow-y-auto space-y-4 px-2 py-1 custom-scrollbar">
            {/* Random Card Modal Popup/Highlight */}
            {randomNote && (
              <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-amber-500/15 via-rose-500/10 to-emerald-500/15 border-2 border-amber-500/30 shadow-md space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-amber-600 dark:text-amber-400">
                      <Gift className="w-5 h-5" />
                    </span>
                    <span className="font-serif italic font-bold text-sm text-[#182217] dark:text-[#E8ECE6]">
                      Quẻ Chúc Lành Dành Riêng Cho Bạn 🌿
                    </span>
                  </div>
                  <button
                    onClick={() => setRandomNote(null)}
                    className="text-xs text-[#5A6D58] hover:text-[#182217] dark:hover:text-[#E8ECE6] font-semibold"
                  >
                    Đóng
                  </button>
                </div>
                <p className="font-serif text-base italic text-[#2C382A] dark:text-[#D5E2D2] leading-relaxed pl-2 border-l-2 border-amber-500">
                  "{randomNote.message}"
                </p>
                <div className="flex items-center justify-between text-xs pt-1 text-[#5A6D58] dark:text-[#8E9B8A]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{randomNote.senderName}</span>
                    <span>•</span>
                    <span className="text-[11px]">{randomNote.schoolName}</span>
                  </div>
                  <button
                    onClick={() => onLikeNote(randomNote.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/40 text-rose-600 font-bold hover:scale-105 active:scale-95 transition-all shadow-2xs"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>{randomNote.likesCount}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterCategory === 'all'
                    ? 'bg-[#2A4228] text-white'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#5A6D58] dark:text-[#8E9B8A] border border-[#DCE4D8] dark:border-[#3A4738]'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterCategory('community_kindness')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  filterCategory === 'community_kindness'
                    ? 'bg-rose-700 text-white'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] text-rose-800 dark:text-rose-300 border border-[#DCE4D8] dark:border-[#3A4738]'
                }`}
              >
                <Flower2 className="w-3 h-3" />
                <span>Lời chúc cộng đồng</span>
              </button>
              <button
                onClick={() => setFilterCategory('dev_thanks')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  filterCategory === 'dev_thanks'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] text-emerald-800 dark:text-emerald-300 border border-[#DCE4D8] dark:border-[#3A4738]'
                }`}
              >
                <Heart className="w-3 h-3" />
                <span>Gửi Dev & Cố Vấn</span>
              </button>
              <button
                onClick={() => setFilterCategory('idea_feedback')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  filterCategory === 'idea_feedback'
                    ? 'bg-sky-700 text-white'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] text-sky-800 dark:text-sky-300 border border-[#DCE4D8] dark:border-[#3A4738]'
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                <span>Góp ý tính năng</span>
              </button>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {filteredNotes.length === 0 ? (
                <div className="col-span-full py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] flex items-center justify-center mx-auto text-[#5A6D58] dark:text-[#8E9B8A]">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-sm font-bold text-[#182217] dark:text-[#E8ECE6]">
                    Chưa có lời nhắn nào trong mục này
                  </p>
                  <p className="text-xs text-[#5A6D58] dark:text-[#8E9B8A]">
                    Hãy là người đầu tiên trao gửi một lời chúc ấm áp nhé!
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-2xl border ${getColorClass(note.tagColor)} flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm transition-all group`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {getCategoryBadge(note.category)}
                        <span className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A]">
                          {formatTime(note.createdAt)}
                        </span>
                      </div>

                      <p className="font-serif text-sm italic text-[#2C382A] dark:text-[#D5E2D2] leading-relaxed">
                        "{note.message}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#DCE4D8]/60 dark:border-[#3A4738]/60 text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-[#182217] dark:text-[#E8ECE6] text-[11px] truncate">
                          {note.senderName}
                        </div>
                        {note.schoolName && (
                          <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] truncate">
                            {note.schoolName}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onLikeNote(note.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E271D] border border-[#DCE4D8] dark:border-[#3A4738] text-rose-600 dark:text-rose-400 font-bold hover:scale-105 active:scale-95 transition-all text-xs shrink-0"
                        title="Thả tim ấm áp"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-500/20 group-hover:fill-rose-500" />
                        <span>{note.likesCount}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Compose Form */}
        {activeTab === 'compose' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4.5 px-2 py-1 custom-scrollbar">
            {isSuccessSubmitted && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Lời nhắn chữa lành của bạn đã được trao gửi thành công! Cảm ơn bạn rất nhiều 🌿</span>
              </div>
            )}

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                Mục đích lời nhắn:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCategory('community_kindness')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    category === 'community_kindness'
                      ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/30 ring-1 ring-rose-500/50'
                      : 'border-[#DCE4D8] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] opacity-75 hover:opacity-100'
                  }`}
                >
                  <Flower2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-[#182217] dark:text-[#E8ECE6]">Lời chúc cộng đồng</div>
                    <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5">Động viên các bạn học sinh khác</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('dev_thanks')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    category === 'dev_thanks'
                      ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-emerald-500/50'
                      : 'border-[#DCE4D8] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] opacity-75 hover:opacity-100'
                  }`}
                >
                  <Heart className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-[#182217] dark:text-[#E8ECE6]">Gửi Dev & Cố Vấn</div>
                    <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5">Tiếp thêm động lực cho team</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('idea_feedback')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    category === 'idea_feedback'
                      ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-950/30 ring-1 ring-sky-500/50'
                      : 'border-[#DCE4D8] dark:border-[#3A4738] bg-[#FAF9F6] dark:bg-[#20281F] opacity-75 hover:opacity-100'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-[#182217] dark:text-[#E8ECE6]">Góp ý tính năng</div>
                    <div className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] mt-0.5">Ý tưởng cải tiến nền tảng</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Message text area */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                Nội dung lời nhắn hoặc lời chúc:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  category === 'community_kindness'
                    ? 'Viết một câu chúc bình an, một trích dẫn nhẹ nhàng hoặc một lời động viên gửi gắm đến bất kỳ ai đang cần...'
                    : category === 'dev_thanks'
                    ? 'Chia sẻ cảm nhận của bạn khi sử dụng The Lantern, gửi lời cảm ơn đến đội ngũ xây dựng ứng dụng...'
                    : 'Mô tả ý tưởng hoặc tính năng mà bạn mong muốn xuất hiện thêm trong các bản cập nhật tới...'
                }
                rows={4}
                required
                className="w-full p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-sm text-[#182217] dark:text-[#E8ECE6] placeholder-[#8E9B8A] focus:outline-hidden focus:ring-2 focus:ring-[#2A4228] transition-all resize-none leading-relaxed block"
              />
            </div>

            {/* Visual Card Color Tag & Alias */}
            <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                  Màu sắc tấm thiệp:
                </label>
                <div className="flex items-center gap-3 px-1 py-1">
                  {(['emerald', 'rose', 'amber', 'sky', 'violet'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full transition-all ${
                        color === 'emerald'
                          ? 'bg-emerald-500'
                          : color === 'rose'
                          ? 'bg-rose-500'
                          : color === 'amber'
                          ? 'bg-amber-500'
                          : color === 'sky'
                          ? 'bg-sky-500'
                          : 'bg-violet-500'
                      } ${
                        selectedColor === color
                          ? 'ring-2 ring-offset-2 ring-offset-[#FCFCFA] dark:ring-offset-[#1E271D] ring-[#2A4228] dark:ring-emerald-400 scale-110 shadow-xs'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Alias toggle */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomNameCheck"
                    checked={useCustomName}
                    onChange={(e) => setUseCustomName(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-[#2A4228] cursor-pointer"
                  />
                  <label htmlFor="useCustomNameCheck" className="text-xs text-[#182217] dark:text-[#E8ECE6] cursor-pointer font-medium">
                    Đặt biệt danh tùy chọn
                  </label>
                </div>
                {useCustomName && (
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="VD: Cậu bạn thích ngắm mưa, Cựu học sinh..."
                    maxLength={40}
                    className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] text-xs text-[#182217] dark:text-[#E8ECE6] focus:outline-hidden focus:ring-1 focus:ring-[#2A4228]"
                  />
                )}
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-3 border-t border-[#DCE4D8] dark:border-[#3A4738] flex items-center justify-between">
              <span className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A] flex items-center gap-1">
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thiệp sẽ được gửi ẩn danh và hiển thị trên Lọ Lời Chúc chung</span>
              </span>

              <button
                type="submit"
                disabled={!message.trim()}
                className="px-6 py-2.5 rounded-full bg-[#2A4228] hover:bg-[#1C2F1A] text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-emerald-300" />
                <span>Gửi Thiệp Ngay</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-[#DCE4D8] dark:border-[#3A4738] flex items-center justify-between text-[11px] text-[#5A6D58] dark:text-[#8E9B8A] shrink-0">
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Mỗi lời chúc là một ngọn đèn thắp sáng hy vọng</span>
          </span>
          <button
            onClick={onClose}
            className="font-bold hover:text-[#182217] dark:hover:text-[#E8ECE6] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
