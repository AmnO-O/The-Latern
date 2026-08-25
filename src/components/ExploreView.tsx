import React, { useState } from 'react';
import { 
  PlusCircle, 
  RotateCw, 
  Database, 
  Search, 
  X, 
  ShieldCheck, 
  BookOpen, 
  GraduationCap, 
  Edit, 
  Trash2, 
  MapPin 
} from 'lucide-react';
import { School, SchoolType } from '../types';

interface ExploreViewProps {
  schools: School[];
  isAdmin?: boolean;
  onEditSchool?: (school) => void;
  onDeleteSchool?: (schoolId: string) => void;
  onSeedSchools?: () => Promise<void> | void;
  onSelectSchool: (school: School) => void;
  onOpenVerify: () => void;
  onOpenGlobe?: () => void;
  onAddCustomSchool?: (schoolName: string, location?: string, type?: 'highschool' | 'university') => School;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  schools,
  isAdmin,
  onEditSchool,
  onDeleteSchool,
  onSeedSchools,
  onSelectSchool,
  onOpenVerify,
  onOpenGlobe,
  onAddCustomSchool
}) => {
  const [filterType, setFilterType] = useState<SchoolType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isAddingNewSchool, setIsAddingNewSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolLocation, setNewSchoolLocation] = useState('Việt Nam');
  const [newSchoolType, setNewSchoolType] = useState<'highschool' | 'university'>('university');
  const [newSchoolLogo, setNewSchoolLogo] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [confirmDeleteSchoolCardId, setConfirmDeleteSchoolCardId] = useState<string | null>(null);

  const filtered = schools.filter(s => {
    const matchesType = filterType === 'all' || s.type === filterType;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.location.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCreateAndSelect = () => {
    if (!search.trim() || !onAddCustomSchool) return;
    const isUni = search.toLowerCase().includes('đại học') || search.toLowerCase().includes('đh') || search.toLowerCase().includes('cao đẳng');
    const created = onAddCustomSchool(search.trim(), 'Việt Nam', isUni ? 'university' : 'highschool');
    onSelectSchool(created);
  };

  const handleAdminAddNewSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim() || !onAddCustomSchool) return;
    const created = onAddCustomSchool(newSchoolName.trim(), newSchoolLocation.trim() || 'Việt Nam', newSchoolType);
    if (newSchoolLogo.trim() && onEditSchool) {
      onEditSchool({ ...created, logoUrl: newSchoolLogo.trim() });
    }
    setNewSchoolName('');
    setNewSchoolLogo('');
    setIsAddingNewSchool(false);
  };

  const handleTriggerSeeding = async () => {
    if (!onSeedSchools) return;
    setIsSeeding(true);
    try {
      await onSeedSchools();
    } finally {
      setIsSeeding(false);
    }
  };

  const highSchoolCount = schools.filter(s => s.type === 'highschool').length;
  const uniCount = schools.filter(s => s.type === 'university').length;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#2C382A] dark:text-[#8E9B8A]">
                Khám phá Campus Hubs
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2A4228]/10 text-[#2A4228] dark:text-[#8BA888]">
                {schools.length} trường ({highSchoolCount} THPT • {uniCount} ĐH)
              </span>
            </div>
            <h1 className="font-serif italic text-2xl sm:text-3xl font-semibold text-[#0F180E] dark:text-[#E8ECE6] mt-1 mb-2">
              Hộp thư Ẩn danh theo Trường học
            </h1>
            <p className="text-xs text-[#2C382A] dark:text-[#8E9B8A] leading-relaxed max-w-xl font-medium">
              Tìm kiếm trường học của bạn để tham gia vào không gian đồng cảm chân thành nhất từ những bạn bè cùng môi trường.
            </p>
          </div>

          {/* Admin quick actions */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30">
              <button
                onClick={() => setIsAddingNewSchool(true)}
                className="px-3 py-1.5 rounded-xl bg-[#2A4228] text-white text-xs font-bold hover:bg-[#1B2C1A] transition-all shadow-xs flex items-center gap-1 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Thêm trường vào DB</span>
              </button>

              <button
                onClick={handleTriggerSeeding}
                disabled={isSeeding}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C231B] border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                title="Nạp danh sách trường THPT & ĐH mẫu vào Firestore"
              >
                {isSeeding ? <RotateCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>{isSeeding ? 'Đang nạp...' : 'Nạp dữ liệu trường chuẩn'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2C382A] dark:text-[#8E9B8A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập tên trường THPT hoặc Đại học..."
              className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-full py-2 pl-9 pr-4 text-xs sm:text-sm text-[#0F180E] dark:text-[#E8ECE6] placeholder-[#2C382A] focus:outline-none focus:border-[#2A4228] font-medium"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start flex-wrap">
            <div className="flex rounded-full bg-[#FAF9F6] dark:bg-[#20281F] p-1 border border-[#C8D2C4] dark:border-[#3A4738] text-xs font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  filterType === 'all' ? 'bg-[#2A4228] text-white font-bold' : 'text-[#2C382A] dark:text-[#8E9B8A]'
                }`}
              >
                Tất cả ({schools.length})
              </button>
              <button
                onClick={() => setFilterType('highschool')}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  filterType === 'highschool' ? 'bg-[#2A4228] text-white font-bold' : 'text-[#2C382A] dark:text-[#8E9B8A]'
                }`}
              >
                THPT ({highSchoolCount})
              </button>
              <button
                onClick={() => setFilterType('university')}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  filterType === 'university' ? 'bg-[#2A4228] text-white font-bold' : 'text-[#2C382A] dark:text-[#8E9B8A]'
                }`}
              >
                Đại Học ({uniCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Add New School Modal */}
      {isAddingNewSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D9] dark:border-[#2C382A]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏫</span>
                <h3 className="font-serif font-bold text-base text-[#0F180E] dark:text-[#E8ECE6]">
                  Thêm trường mới vào Cơ sở dữ liệu
                </h3>
              </div>
              <button
                onClick={() => setIsAddingNewSchool(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5A6E58] dark:text-[#8E9B8A] hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminAddNewSchool} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#2A4228] dark:text-[#8BA888] mb-1">
                  Tên trường học *
                </label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="Ví dụ: THPT Chuyên Quốc Học Huế, ĐH Ngoại Thương..."
                  className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] font-bold focus:outline-none focus:border-[#2A4228]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#2A4228] dark:text-[#8BA888] mb-1">
                    Cấp bậc
                  </label>
                  <select
                    value={newSchoolType}
                    onChange={(e) => setNewSchoolType(e.target.value as any)}
                    className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] font-bold focus:outline-none focus:border-[#2A4228]"
                  >
                    <option value="highschool">THPT (Cấp 3)</option>
                    <option value="university">Đại học / CĐ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#2A4228] dark:text-[#8BA888] mb-1">
                    Khu vực / Tỉnh thành
                  </label>
                  <input
                    type="text"
                    value={newSchoolLocation}
                    onChange={(e) => setNewSchoolLocation(e.target.value)}
                    placeholder="Hà Nội, TP.HCM..."
                    className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] focus:outline-none focus:border-[#2A4228]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#2A4228] dark:text-[#8BA888] mb-1">
                  Đường dẫn Logo (Tùy chọn)
                </label>
                <input
                  type="url"
                  value={newSchoolLogo}
                  onChange={(e) => setNewSchoolLogo(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] rounded-xl py-2 px-3 text-xs text-[#0F180E] dark:text-[#E8ECE6] focus:outline-none focus:border-[#2A4228]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E2D9] dark:border-[#2C382A]">
                <button
                  type="button"
                  onClick={() => setIsAddingNewSchool(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#5A6E58] dark:text-[#8E9B8A]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#2A4228] text-white text-xs font-bold hover:bg-[#1B2C1A] shadow-sm"
                >
                  Lưu vào Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schools Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF0E8] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] text-[#2A4228] dark:text-[#8BA888] flex items-center justify-center mx-auto text-2xl font-bold">
            🏫
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#0F180E] dark:text-[#E8ECE6]">
              {search.trim() ? `Chưa có trường "${search}"` : 'Chưa có Campus Hub nào được kích hoạt'}
            </h3>
            <p className="text-xs text-[#2C382A] dark:text-[#8E9B8A] mt-1 font-medium max-w-md mx-auto leading-relaxed">
              {search.trim() 
                ? 'Bạn có thể tự khởi tạo ngay Hộp thư Ẩn danh cho ngôi trường này chỉ với 1 cú nhấp chuột!'
                : 'Hãy nhập tên trường THPT hoặc Đại học của bạn vào thanh tìm kiếm bên trên hoặc nạp danh sách trường từ Admin!'}
            </p>
          </div>
          {search.trim() ? (
            <button
              onClick={handleCreateAndSelect}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Khởi tạo Campus Hub cho "{search}"</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={onOpenVerify}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Xác thực & Tạo Campus Hub</span>
              </button>
              {isAdmin && onSeedSchools && (
                <button
                  onClick={handleTriggerSeeding}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Database className="w-4 h-4" />
                  <span>Nạp danh sách trường mẫu vào DB</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div
              key={s.id}
              onClick={() => onSelectSchool(s)}
              className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-2xl p-5 cursor-pointer hover:-translate-y-1 hover:border-[#2A4228] transition-all group flex flex-col justify-between shadow-xs relative"
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border inline-flex items-center gap-1 ${
                    s.type === 'highschool'
                      ? 'bg-[#EAF0E8] dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] border-[#C8D2C4] dark:border-[#3A4738]'
                      : 'bg-[#FEFAE0] dark:bg-[#2F382A] text-[#AA6828] border-[#C8D2C4] dark:border-[#3A4738]'
                  }`}>
                    {s.type === 'highschool' ? <BookOpen className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                    <span>{s.type === 'highschool' ? 'THPT' : 'Đại Học'}</span>
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {onEditSchool && (
                          <button
                            type="button"
                            onClick={() => onEditSchool(s)}
                            className="p-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs transition-colors"
                            title="Chỉnh sửa thông tin trường"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteSchool && (
                          confirmDeleteSchoolCardId === s.id ? (
                            <div className="flex items-center gap-1 animate-scale-up">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteSchool(s.id);
                                  setConfirmDeleteSchoolCardId(null);
                                }}
                                className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold"
                              >
                                Xóa
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSchoolCardId(null)}
                                className="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-[10px] font-semibold text-[#5A6D58] dark:text-[#8E9B8A]"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSchoolCardId(s.id)}
                              className="p-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-700 dark:text-red-300 border border-red-500/30 text-xs transition-colors"
                              title="Xóa trường khỏi Database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    )}
                    <span className="text-xs text-[#2C382A] dark:text-[#8E9B8A] font-semibold shrink-0 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {s.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  {s.logoUrl ? (
                    <img
                      src={s.logoUrl}
                      alt={s.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-contain p-1 bg-white dark:bg-[#1E271D] border border-[#C8D2C4] dark:border-[#3A4738] shrink-0 shadow-2xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#2A4228]/10 text-[#2A4228] dark:text-[#8BA888] font-bold text-sm flex items-center justify-center border border-[#C8D2C4] dark:border-[#3A4738] shrink-0">
                      {s.name.charAt(0)}
                    </div>
                  )}

                  <h2 className="font-serif font-bold text-sm sm:text-base text-[#0F180E] dark:text-[#E8ECE6] group-hover:text-[#2A4228] dark:group-hover:text-[#8BA888] transition-colors line-clamp-2">
                    {s.name}
                  </h2>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-[#E5E2D9] dark:border-[#2C382A] flex items-center justify-between text-xs text-[#2C382A] dark:text-[#8E9B8A] font-semibold">
                <span>🌱 {s.letterCount.toLocaleString()} lá thư</span>
                <span className="text-[#2A4228] dark:text-[#8BA888] font-bold bg-[#EAF0E8] dark:bg-[#2A3628] px-2.5 py-0.5 rounded-full">
                  +{s.newCount || 0} mới
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prompt to register missing school */}
      <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] glass-panel rounded-2xl p-6 text-center space-y-2">
        <h3 className="font-serif font-bold text-sm text-[#0F180E] dark:text-[#E8ECE6]">
          Không tìm thấy trường của bạn?
        </h3>
        <p className="text-xs text-[#2C382A] dark:text-[#8E9B8A] font-medium">
          Bạn có thể xác thực thẻ HS/SV để mở Campus Hub mới cho ngôi trường của mình!
        </p>
        <button
          onClick={onOpenVerify}
          className="mt-2 text-xs font-bold text-[#2A4228] dark:text-[#8BA888] hover:underline"
        >
          Gửi yêu cầu khởi tạo Campus Hub 🎓
        </button>
      </div>
    </div>
  );
};
