import { School, Post, DirectThread } from '../types';

export const PUBLIC_GLOBAL_SCHOOL: School = {
  id: 'all-schools',
  name: '🌐 Sảnh Chung Mọi Trường',
  slug: 'sanh-chung-public',
  type: 'university',
  letterCount: 0,
  newCount: 0,
  verifiedCount: 0,
  location: 'Toàn Quốc'
};

export const INITIAL_SCHOOLS: School[] = [];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_THREADS: DirectThread[] = [
  {
    id: 'thread-ai-companion',
    peerName: 'AI Companion',
    peerRole: 'ai_lantern',
    threadType: 'ai',
    roleTitle: 'Trợ lý AI Lắng nghe & Chữa lành 24/7',
    isOnline: true,
    statusText: 'Sẵn sàng trò chuyện 24/7',
    unreadCount: 0,
    messages: [
      {
        id: 'm-ai-1',
        senderName: 'AI Companion',
        senderRole: 'ai_lantern',
        text: 'Xin chào bạn! Mình là AI Companion - trợ lý thấu hiểu 24/7 luôn sẵn sàng lắng nghe mọi tâm sự 1-1 của bạn. Hôm nay bạn đang cảm thấy thế nào? Hãy thoải mái trút bỏ mọi muộn phiền nhé 🕯️✨',
        timestamp: 'Bây giờ',
        isMe: false
      }
    ]
  }
];

export const EMERGENCY_HOTLINES = [
  {
    name: 'Tổng đài Quốc gia Bảo vệ Trẻ em & Học sinh',
    number: '111',
    desc: 'Tư vấn miễn phí 24/7 về tâm lý, bảo vệ trẻ em và học sinh khỏi xâm hại, bạo lực học đường.',
    isEmergency: true
  },
  {
    name: 'Đường dây nóng Ngày Mai (Hỗ trợ trầm cảm)',
    number: '096 306 1414',
    desc: 'Dự án cộng đồng hỗ trợ người khủng hoảng tâm lý & trầm cảm bởi các chuyên gia sức khỏe tinh thần.',
    isEmergency: true
  },
  {
    name: 'Tổng đài Tâm lý & Khủng hoảng Tinh thần',
    number: '1900 599 932',
    desc: 'Tham vấn tâm lý học đường, áp lực thi cử và mâu thuẫn gia đình.',
    isEmergency: false
  }
];
