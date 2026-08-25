import React, { useState, useEffect } from 'react';
import { Edit3, X, Globe, School as SchoolIcon, Save } from 'lucide-react';
import { Post } from '../types';

interface EditPostModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onSave: (postId: string, updatedData: { title: string; content: string; tags: string[]; isPublic: boolean }) => Promise<void>;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  post,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setSelectedTags(post.tags || ['Áp lực học tập']);
      setIsPublic(post.isPublic ?? true);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const availableTags = [
    'Áp lực học tập',
    'Gia đình',
    'Tình cảm tuổi trẻ',
    'Định hướng tương lai',
    'Sự ấm áp',
    'Khúc mắc bạn bè'
  ];

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter(t => t !== tag));
      }
    } else {
      if (selectedTags.length < 3) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(post.id, {
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
        isPublic
      });
      onClose();
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E2D9] dark:border-[#3A4738] mb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#8BA888]" />
            <h2 className="font-serif italic font-semibold text-xl text-[#3A4036] dark:text-[#E8ECE6]">
              Chỉnh sửa lá thư
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F3EF] dark:bg-[#20281F] text-[#7E7A71] dark:text-[#8E9B8A] hover:text-[#3A4036] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Visibility Scope Switcher */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#A4A095] dark:text-[#8E9B8A] mb-1.5">
              Phạm vi hiển thị lá thư
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                  isPublic
                    ? 'bg-[#5A6E58] text-white border-[#5A6E58] shadow-xs'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#E5E2D9] dark:border-[#3A4738] text-[#7E7A71] dark:text-[#8E9B8A]'
                }`}
              >
                <Globe className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold">🌐 Sảnh Chung Mọi Trường</div>
                  <div className="text-[9px] opacity-80 font-normal">Mọi người ở tất cả các trường có thể đọc</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                  !isPublic
                    ? 'bg-[#5A6E58] text-white border-[#5A6E58] shadow-xs'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#E5E2D9] dark:border-[#3A4738] text-[#7E7A71] dark:text-[#8E9B8A]'
                }`}
              >
                <SchoolIcon className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold">🏫 Chỉ Trong Trường</div>
                  <div className="text-[9px] opacity-80 font-normal">Chỉ thành viên thuộc trường chọn đọc</div>
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#A4A095] dark:text-[#8E9B8A] mb-1.5">
              Tiêu đề lá thư
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] focus:border-[#8BA888] rounded-2xl py-2.5 px-4 text-xs sm:text-sm text-[#3A4036] dark:text-[#E8ECE6] font-medium outline-none transition-all"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#A4A095] dark:text-[#8E9B8A] mb-1.5">
              Nội dung tâm sự
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] focus:border-[#8BA888] rounded-2xl p-4 text-xs sm:text-sm text-[#3A4036] dark:text-[#E8ECE6] font-normal leading-relaxed outline-none transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#A4A095] dark:text-[#8E9B8A] mb-1.5">
              Chủ đề (Tối đa 3)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#8BA888] text-white border-[#8BA888] shadow-xs'
                        : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#E5E2D9] dark:border-[#3A4738] text-[#7E7A71] dark:text-[#8E9B8A]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-[#E5E2D9] dark:border-[#3A4738] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-[#7E7A71] dark:text-[#8E9B8A] hover:bg-[#F1F3EF] dark:hover:bg-[#20281F] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="bg-[#5A6E58] hover:bg-[#485946] text-white font-bold px-6 py-2.5 rounded-full shadow-md text-xs flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
