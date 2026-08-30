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

export const INITIAL_SCHOOLS: School[] = [
  {
    id: 'school-dh-bach-khoa-hn',
    name: 'Đại học Bách Khoa Hà Nội (HUST)',
    slug: 'dh-bach-khoa-ha-noi',
    type: 'university',
    letterCount: 31,
    newCount: 7,
    verifiedCount: 104,
    location: 'Hà Nội',
    logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80'
  },
  {
    id: 'school-dh-kinh-te-quoc-dan',
    name: 'Đại học Kinh tế Quốc dân (NEU)',
    slug: 'dh-kinh-te-quoc-dan-neu',
    type: 'university',
    letterCount: 27,
    newCount: 6,
    verifiedCount: 92,
    location: 'Hà Nội',
    logoUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=160&auto=format&fit=crop&q=80'
  },
  {
    id: 'school-dh-ngoai-thuong',
    name: 'Đại học Ngoại Thương (FTU)',
    slug: 'dh-ngoai-thuong-ftu',
    type: 'university',
    letterCount: 22,
    newCount: 5,
    verifiedCount: 78,
    location: 'Hà Nội & TP.HCM',
    logoUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=160&auto=format&fit=crop&q=80'
  },
  {
    id: 'school-dh-bach-khoa-hcm',
    name: 'Đại học Bách Khoa - ĐHQG TP.HCM (HCMUT)',
    slug: 'dh-bach-khoa-tphcm',
    type: 'university',
    letterCount: 24,
    newCount: 5,
    verifiedCount: 88,
    location: 'TP. Hồ Chí Minh',
    logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80'
  },
  {
    id: 'school-dh-khtn-hcm',
    name: 'Đại học Khoa học Tự nhiên - ĐHQG TP.HCM (HCMUS)',
    slug: 'dh-khoa-hoc-tu-nhien-tphcm',
    type: 'university',
    letterCount: 19,
    newCount: 4,
    verifiedCount: 65,
    location: 'TP. Hồ Chí Minh',
    logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=160&auto=format&fit=crop&q=80'
  },
  {
    id: 'school-dh-khtn-hn',
    name: 'Đại học Khoa học Tự nhiên - ĐHQGHN (HUS)',
    slug: 'dh-khoa-hoc-tu-nhien-ha-noi',
    type: 'university',
    letterCount: 16,
    newCount: 3,
    verifiedCount: 58,
    location: 'Hà Nội',
    logoUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=160&auto=format&fit=crop&q=80'
  },
  {
    id: 'school-dh-fpt',
    name: 'Đại học FPT (FPT University)',
    slug: 'dh-fpt',
    type: 'university',
    letterCount: 15,
    newCount: 3,
    verifiedCount: 56,
    location: 'Toàn Quốc'
  },
  {
    id: 'school-dh-y-duoc-tphcm',
    name: 'Đại học Y Dược TP.HCM (UMP)',
    slug: 'dh-y-duoc-tphcm',
    type: 'university',
    letterCount: 14,
    newCount: 2,
    verifiedCount: 42,
    location: 'TP. Hồ Chí Minh',
    logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=160&auto=format&fit=crop&q=80'
  },
  {
    id: 'school-thpt-le-hong-phong',
    name: 'THPT Chuyên Lê Hồng Phong (TP.HCM)',
    slug: 'thpt-chuyen-le-hong-phong',
    type: 'highschool',
    letterCount: 12,
    newCount: 3,
    verifiedCount: 45,
    location: 'TP. Hồ Chí Minh',
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=160&auto=format&fit=crop&q=80'
  },
  {
    id: 'school-thpt-amsterdam',
    name: 'THPT Chuyên Hà Nội - Amsterdam',
    slug: 'thpt-chuyen-ha-noi-amsterdam',
    type: 'highschool',
    letterCount: 18,
    newCount: 4,
    verifiedCount: 52,
    location: 'Hà Nội',
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=160&auto=format&fit=crop&q=80'
  },
  {
    id: 'school-thpt-chu-van-an',
    name: 'THPT Chu Văn An (Hà Nội)',
    slug: 'thpt-chu-van-an',
    type: 'highschool',
    letterCount: 9,
    newCount: 2,
    verifiedCount: 38,
    location: 'Hà Nội'
  },
  {
    id: 'school-thpt-quoc-hoc-hue',
    name: 'THPT Chuyên Quốc Học Huế',
    slug: 'thpt-chuyen-quoc-hoc-hue',
    type: 'highschool',
    letterCount: 7,
    newCount: 1,
    verifiedCount: 29,
    location: 'Thừa Thiên Huế'
  },
  {
    id: 'school-thpt-tran-phu-hp',
    name: 'THPT Chuyên Trần Phú (Hải Phòng)',
    slug: 'thpt-chuyen-tran-phu',
    type: 'highschool',
    letterCount: 6,
    newCount: 2,
    verifiedCount: 24,
    location: 'Hải Phòng'
  }
];

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
