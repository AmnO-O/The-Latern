import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  GraduationCap, 
  BookOpen, 
  Upload, 
  Trash2, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';
import { School } from '../types';

interface EditSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  onSave: (updatedSchool: Partial<School>) => Promise<void> | void;
  onDelete?: (schoolId: string) => Promise<void> | void;
}

const PRESET_LOGOS = [
  { name: 'ĐHQG / HCMUS / Bách Khoa', url: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80' },
  { name: 'Sư Phạm / Nhân Văn', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=160&auto=format&fit=crop&q=80' },
  { name: 'Y Dược / Sức Khỏe', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=160&auto=format&fit=crop&q=80' },
  { name: 'Kinh Tế / Ngoại Thương', url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=160&auto=format&fit=crop&q=80' },
  { name: 'Chuyên / THPT Nổi Tiếng', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=160&auto=format&fit=crop&q=80' },
  { name: 'Nghệ Thuật / Kiến Trúc', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=160&auto=format&fit=crop&q=80' }
];

export const EditSchoolModal: React.FC<EditSchoolModalProps> = ({
  isOpen,
  onClose,
  school,
  onSave,
  onDelete
}) => {
  const [logoUrl, setLogoUrl] = useState(school.logoUrl || '');
  const [name, setName] = useState(school.name);
  const [location, setLocation] = useState(school.location);
  const [type, setType] = useState<'highschool' | 'university'>(school.type);
  const [letterCount, setLetterCount] = useState<number>(school.letterCount || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewError, setPreviewError] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ảnh tải lên tối đa 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
      setPreviewError(false);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên trường.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await onSave({
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        location: location.trim() || 'Việt Nam',
        type,
        letterCount: Number(letterCount) || 0,
        logoUrl: logoUrl.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi lưu thông tin trường.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(school.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi xóa trường.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D9] dark:border-[#2C382A]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-[#0F180E] dark:text-[#E8ECE6]">
                Quản trị: Cập nhật Avatar & Logo Trường
              </h2>
              <p className="text-[11px] text-[#5A6E58] dark:text-[#8E9B8A]">
                Quyền hạn đặc biệt của Quản trị viên The Lantern
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5A6E58] dark:text-[#8E9B8A] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Avatar Preview Section */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#5A6E58]/10 dark:bg-[#5A6E58]/20 border border-[#5A6E58]/20">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1E271D] border border-[#8BA888]/40 flex items-center justify-center p-1.5 shadow-sm overflow-hidden shrink-0">
              {logoUrl && !previewError ? (
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={() => setPreviewError(true)}
                />
              ) : type === 'highschool' ? (
                <BookOpen className="w-6 h-6 text-[#5A6E58] dark:text-[#8BA888]" />
              ) : (
                <GraduationCap className="w-6 h-6 text-[#5A6E58] dark:text-[#8BA888]" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="text-xs font-bold text-[#0F180E] dark:text-[#E8ECE6]">
                Xem trước Logo Campus Hub
              </div>
              <p className="text-[10px] text-[#5A6E58] dark:text-[#8E9B8A]">
                Logo sẽ hiển thị đồng bộ trên thẻ trường, sảnh bài viết và danh mục tìm kiếm.
              </p>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => { setLogoUrl(''); setPreviewError(false); }}
                  className="text-[10px] font-bold text-red-500 hover:underline"
                >
                  Xóa logo hiện tại (dùng icon mặc định)
                </button>
              )}
            </div>
          </div>

          {/* Logo Input Options: URL or Upload */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#2A4228] dark:text-[#8BA888]">
              1. Nhập đường dẫn link ảnh (Image URL)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => {
                setLogoUrl(e.target.value);
                setPreviewError(false);
              }}
              placeholder="https://example.com/logo-truong.png hoặc .svg..."
              className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] placeholder-[#8E9B8A] focus:outline-none focus:border-[#2A4228]"
            />

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-[#5A6E58] dark:text-[#8E9B8A] font-medium">Hoặc</span>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 border border-[#C8D2C4] dark:border-[#3A4738] text-[11px] font-bold text-[#0F180E] dark:text-[#E8ECE6]">
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh từ máy tính (PNG/JPG)</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Preset Logos for quick picking */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#2A4228] dark:text-[#8BA888] mb-1.5">
              2. Hoặc chọn logo mẫu theo khối ngành
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_LOGOS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLogoUrl(preset.url);
                    setPreviewError(false);
                  }}
                  className="p-1.5 rounded-xl bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] hover:border-[#2A4228] text-left flex items-center gap-2 text-[10px] font-semibold text-[#0F180E] dark:text-[#E8ECE6] transition-all"
                >
                  <img src={preset.url} alt={preset.name} className="w-6 h-6 rounded-lg object-cover" />
                  <span className="truncate">{preset.name.split('/')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* School Name & Location */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#2A4228] dark:text-[#8BA888] mb-1">
                Tên trường
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] focus:outline-none focus:border-[#2A4228]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#2A4228] dark:text-[#8BA888] mb-1">
                Khu vực / Tỉnh thành
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] focus:outline-none focus:border-[#2A4228]"
              />
            </div>
          </div>

          {/* School Type & Letter Count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#2A4228] dark:text-[#8BA888] mb-1">
                Phân loại cấp bậc
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] font-bold focus:outline-none focus:border-[#2A4228]"
              >
                <option value="highschool">🏫 Trường THPT (Cấp 3)</option>
                <option value="university">🎓 Trường Đại học / Cao đẳng</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#2A4228] dark:text-[#8BA888] mb-1">
                Số lá thư thống kê
              </label>
              <input
                type="number"
                min="0"
                value={letterCount}
                onChange={(e) => setLetterCount(parseInt(e.target.value) || 0)}
                className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] focus:outline-none focus:border-[#2A4228]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E5E2D9] dark:border-[#2C382A]">
            {onDelete ? (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 animate-scale-up">
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">Xác nhận xóa?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={isDeleting}
                    className="px-2.5 py-1 rounded-xl bg-black/10 dark:bg-white/10 text-xs font-semibold hover:bg-black/20 text-[#5A6D58] dark:text-[#8E9B8A]"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={isDeleting || isSaving}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-red-500/30 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa trường</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#5A6E58] dark:text-[#8E9B8A] hover:bg-black/5"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lưu vào Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
