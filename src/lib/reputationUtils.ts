/**
 * Hệ thống Tính Điểm Uy Tín (Reputation / Trust Score) cho The Lantern
 * - Khởi đầu: 2 điểm (Người tham gia mới)
 * - Xác thực Sinh viên / Học sinh (.edu.vn / OCR): Đạt mốc 10 điểm (Tăng +8 điểm)
 * - Mỗi 4 Cái ôm (Hugs) nhận được từ các phản hồi/lời chia sẻ giúp ích: +1 điểm uy tín (tránh spam)
 */

export interface ReputationRank {
  rankLevel: number;
  title: string;
  badge: string;
  iconType: 'shield' | 'shield-check' | 'award' | 'crown';
  color: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
  description: string;
}

export function calculateReputationScore(
  isVerified: boolean,
  hugsReceived: number = 0,
  baseScoreBonus: number = 0
): number {
  // Điểm cơ bản ban đầu: 2 nếu chưa xác thực, 10 nếu đã xác thực
  let score = isVerified ? 10 : 2;

  // Cứ mỗi 4 cái ôm nhận được từ cộng đồng, tăng 1 điểm uy tín
  const hugBonus = Math.floor(Math.max(0, hugsReceived) / 4);
  score += hugBonus;

  // Điểm thưởng cộng thêm nếu có
  score += baseScoreBonus;

  return score;
}

export function getReputationRank(score: number): ReputationRank {
  if (score >= 50) {
    return {
      rankLevel: 4,
      title: 'Điểm tựa tinh thần',
      badge: '👑',
      iconType: 'crown',
      color: '#D97706', // Amber-600
      bgLight: 'bg-amber-500/15',
      bgDark: 'dark:bg-amber-500/25',
      borderColor: 'border-amber-400/50',
      description: 'Thành viên truyền cảm hứng và đem lại nhiều bình yên cho cộng đồng.'
    };
  }
  if (score >= 25) {
    return {
      rankLevel: 3,
      title: 'Người bạn thấu hiểu',
      badge: '🏅',
      iconType: 'award',
      color: '#8BA888', // Sage green
      bgLight: 'bg-[#8BA888]/15',
      bgDark: 'dark:bg-[#8BA888]/25',
      borderColor: 'border-[#8BA888]/50',
      description: 'Thường xuyên lắng nghe và gửi những lời động viên chân thành.'
    };
  }
  if (score >= 10) {
    return {
      rankLevel: 2,
      title: 'Thành viên đã xác thực',
      badge: '🛡️',
      iconType: 'shield-check',
      color: '#2A4228', // Forest Green
      bgLight: 'bg-[#2A4228]/15',
      bgDark: 'dark:bg-[#8BA888]/20',
      borderColor: 'border-[#8BA888]/40',
      description: 'Đã xác thực danh tính học đường an toàn, đáng tin cậy.'
    };
  }
  return {
    rankLevel: 1,
    title: 'Thành viên mới',
    badge: '🔰',
    iconType: 'shield',
    color: '#6B7280', // Gray
    bgLight: 'bg-gray-500/10',
    bgDark: 'dark:bg-gray-500/20',
    borderColor: 'border-gray-400/30',
    description: 'Thành viên mới gia nhập không gian tâm sự The Lantern.'
  };
}

export function getNextRankProgress(score: number): { nextTarget: number; progressPercent: number; remaining: number } {
  if (score >= 50) {
    return { nextTarget: 100, progressPercent: Math.min(100, (score / 100) * 100), remaining: 0 };
  }
  if (score >= 25) {
    const range = 50 - 25;
    const current = score - 25;
    return { nextTarget: 50, progressPercent: Math.round((current / range) * 100), remaining: 50 - score };
  }
  if (score >= 10) {
    const range = 25 - 10;
    const current = score - 10;
    return { nextTarget: 25, progressPercent: Math.round((current / range) * 100), remaining: 25 - score };
  }
  const range = 10 - 2;
  const current = Math.max(0, score - 2);
  return { nextTarget: 10, progressPercent: Math.round((current / range) * 100), remaining: 10 - score };
}
