import React from 'react';
import { Shield, ShieldCheck, Award, Crown } from 'lucide-react';
import { getReputationRank, ReputationRank } from '../lib/reputationUtils';

interface ReputationBadgeProps {
  score: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ReputationIcon: React.FC<{ rank: ReputationRank; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  rank,
  size = 'md'
}) => {
  const iconSizeClass =
    size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : size === 'xl' ? 'w-6 h-6' : 'w-3.5 h-3.5';

  switch (rank.iconType) {
    case 'crown':
      return <Crown className={`${iconSizeClass} text-amber-500 shrink-0 stroke-[2.2]`} />;
    case 'award':
      return <Award className={`${iconSizeClass} text-amber-600 dark:text-amber-400 shrink-0 stroke-[2.2]`} />;
    case 'shield-check':
      return <ShieldCheck className={`${iconSizeClass} text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.2]`} />;
    case 'shield':
    default:
      return <Shield className={`${iconSizeClass} text-slate-500 dark:text-slate-400 shrink-0 stroke-[2.2]`} />;
  }
};

export const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  score,
  showDetails = false,
  size = 'md',
  className = ''
}) => {
  const rank = getReputationRank(score);

  if (size === 'sm') {
    return (
      <span
        title={`Độ uy tín: ${score} điểm (${rank.title})`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold border ${rank.bgLight} ${rank.bgDark} ${rank.borderColor} text-[#2A4228] dark:text-[#8BA888] ${className}`}
      >
        <ReputationIcon rank={rank} size="sm" />
        <span>{score}</span>
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${rank.bgLight} ${rank.bgDark} ${rank.borderColor} ${className}`}
      >
        <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 shadow-xs flex items-center justify-center">
          <ReputationIcon rank={rank} size="lg" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#2A4228] dark:text-[#8BA888]">
              Độ uy tín: {score} điểm
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2A4228]/10 dark:bg-[#8BA888]/20 font-semibold text-[#2A4228] dark:text-[#8BA888]">
              {rank.title}
            </span>
          </div>
          {showDetails && (
            <span className="text-[11px] text-[#2C382A]/70 dark:text-[#8E9B8A]/70">
              {rank.description}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Size md (Default)
  return (
    <span
      title={`Độ uy tín: ${score} điểm - ${rank.title}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${rank.bgLight} ${rank.bgDark} ${rank.borderColor} text-[#2A4228] dark:text-[#8BA888] shadow-2xs ${className}`}
    >
      <ReputationIcon rank={rank} size="md" />
      <span>Uy tín {score}</span>
      {showDetails && <span className="font-normal opacity-80">· {rank.title}</span>}
    </span>
  );
};
