export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: 'student' | 'art' | 'nature' | 'minimal';
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'avatar-student-1',
    name: 'Sinh viên kính tròn',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'student'
  },
  {
    id: 'avatar-student-2',
    name: 'Cậu bạn thư viện',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'student'
  },
  {
    id: 'avatar-student-3',
    name: 'Cô bạn tai nghe',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'student'
  },
  {
    id: 'avatar-student-4',
    name: 'Chàng trai cà phê sách',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'student'
  },
  {
    id: 'avatar-student-5',
    name: 'Nụ cười học đường',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'student'
  },
  {
    id: 'avatar-student-6',
    name: 'Bạn trẻ năng động',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'student'
  },
  {
    id: 'avatar-nature-1',
    name: 'Ngọn Nến Đêm',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'nature'
  },
  {
    id: 'avatar-nature-2',
    name: 'Lá Phong Rừng',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'nature'
  },
  {
    id: 'avatar-nature-3',
    name: 'Bầu Trời Hoàng Hôn',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'nature'
  },
  {
    id: 'avatar-art-1',
    name: 'Mèo Chữa Lành',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'art'
  },
  {
    id: 'avatar-art-2',
    name: 'Góc Ban Công Yên Tĩnh',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'art'
  },
  {
    id: 'avatar-minimal-1',
    name: 'Mầm Cây Hy Vọng',
    url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=200&h=200&q=80',
    category: 'minimal'
  }
];

export const DEFAULT_AVATAR = AVATAR_PRESETS[0].url;

export function getEffectiveAvatar(customAvatar?: string, googleAvatar?: string): string {
  if (customAvatar && customAvatar.trim()) return customAvatar.trim();
  if (googleAvatar && googleAvatar.trim()) return googleAvatar.trim();
  return DEFAULT_AVATAR;
}
