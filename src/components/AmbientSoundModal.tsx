import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  X, 
  Activity, 
  CloudRain, 
  Waves, 
  Trees, 
  Play, 
  Pause, 
  Volume2, 
  Repeat 
} from 'lucide-react';
import { ambientAudio, AMBIENT_SOUND_OPTIONS, AmbientSoundType } from '../lib/audioSynthesizer';

interface AmbientSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const renderSoundIcon = (id: AmbientSoundType) => {
  switch (id) {
    case 'solfeggio':
      return <Activity className="w-5 h-5" />;
    case 'rain':
      return <CloudRain className="w-5 h-5" />;
    case 'waves':
      return <Waves className="w-5 h-5" />;
    case 'forest':
      return <Trees className="w-5 h-5" />;
    default:
      return <Radio className="w-5 h-5" />;
  }
};

export const AmbientSoundModal: React.FC<AmbientSoundModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(ambientAudio.isPlaying());
  const [selectedType, setSelectedType] = useState<AmbientSoundType>(
    ambientAudio.getCurrentType() || 'solfeggio'
  );
  const [volume, setVolume] = useState<number>(ambientAudio.getCurrentVolume());

  useEffect(() => {
    setIsPlaying(ambientAudio.isPlaying());
    if (ambientAudio.getCurrentType()) {
      setSelectedType(ambientAudio.getCurrentType()!);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlay = (type?: AmbientSoundType) => {
    const targetType = type || selectedType;
    if (isPlaying && targetType === selectedType) {
      ambientAudio.stop();
      setIsPlaying(false);
    } else {
      setSelectedType(targetType);
      ambientAudio.play(targetType, volume);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ambientAudio.setVolume(val);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-[#FAF9F6] dark:bg-[#1C231B] rounded-3xl border border-[#C8D2C4] dark:border-[#2F3C2E] shadow-2xl p-5 sm:p-6 text-[#1A2619] dark:text-[#E2E8E0] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 shrink-0 border-b border-[#EAF0E8] dark:border-[#2A3628]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2A4228] text-white flex items-center justify-center shadow-xs shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#2A4228] dark:text-[#8BA888]">
                Giai Điệu An Yên & Soundscapes
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                Âm thanh thư giãn lặp vô tận (Infinite Loop) xoa dịu tâm trí
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto my-3 pr-1 space-y-4 shrink min-h-0">
          {/* Soundscape Options Grid */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Chọn giai điệu / Âm thanh muốn lặp
            </label>
            <div className="grid grid-cols-1 gap-2">
              {AMBIENT_SOUND_OPTIONS.map((opt) => {
                const isSelected = selectedType === opt.id;
                const isThisPlaying = isPlaying && isSelected;

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleTogglePlay(opt.id)}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isThisPlaying
                        ? 'bg-[#233821] text-white border-[#2A4228] shadow-md ring-2 ring-[#8BA888]/40'
                        : isSelected
                        ? 'bg-[#EAF0E8] dark:bg-[#2A3628] border-[#8BA888] text-[#182217] dark:text-[#E8ECE6]'
                        : 'bg-white dark:bg-[#20281F] border-[#E2E8E0] dark:border-[#2B372A] hover:border-[#8BA888]/50 text-[#182217] dark:text-[#E8ECE6]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isThisPlaying
                          ? 'bg-white/20 text-white shadow-xs'
                          : isSelected
                          ? 'bg-[#2A4228]/15 dark:bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888]'
                          : 'bg-[#8BA888]/15 text-[#2A4228] dark:text-[#8BA888]'
                      }`}>
                        {renderSoundIcon(opt.id)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-xs sm:text-sm truncate ${
                            isThisPlaying ? 'text-white' : 'text-[#182217] dark:text-[#E8ECE6]'
                          }`}>
                            {opt.name}
                          </span>
                          <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                            isThisPlaying
                              ? 'bg-white/20 text-white'
                              : isSelected
                              ? 'bg-[#2A4228]/15 dark:bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888]'
                              : 'bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888]'
                          }`}>
                            {opt.badge}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-0.5 line-clamp-1 ${
                          isThisPlaying 
                            ? 'text-emerald-100/90 font-medium' 
                            : isSelected
                            ? 'text-[#3E523C] dark:text-[#B5C6B3]'
                            : 'text-[#5A6D58] dark:text-[#8E9B8A]'
                        }`}>
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePlay(opt.id);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                        isThisPlaying
                          ? 'bg-white text-[#233821] shadow-sm hover:bg-emerald-50'
                          : isSelected
                          ? 'bg-[#2A4228] text-white hover:bg-[#385036]'
                          : 'bg-[#2A4228] text-white hover:bg-[#385036]'
                      }`}
                      title={isThisPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volume Slider & Loop Status */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#20281F] border border-[#E2E8E0] dark:border-[#2B372A] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                <span>Âm lượng ({Math.round(volume * 100)}%)</span>
              </span>
              <span className="flex items-center gap-1 text-[#2A4228] dark:text-[#8BA888] text-[11px]">
                <Repeat className="w-3.5 h-3.5" />
                <span>Lặp vô tận</span>
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-[#2A4228] dark:accent-[#8BA888] cursor-pointer"
            />
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="flex items-center justify-between pt-3 shrink-0 border-t border-[#EAF0E8] dark:border-[#2A3628]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2A4228] dark:text-[#8BA888] truncate pr-2">
            {isPlaying ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="truncate">Đang phát nhạc an yên lặp lại...</span>
              </>
            ) : (
              <span className="text-[var(--text-muted)]">Chưa bật âm thanh</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[#2A4228] text-white font-bold text-xs hover:bg-[#385036] transition-all shadow-sm shrink-0"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
