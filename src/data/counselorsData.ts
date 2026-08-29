import { PeerMentorApplication, CounselingAppointment } from '../types';

export interface CampusCounselor {
  id: string;
  name: string;
  avatarUrl: string;
  roleTitle: string; // e.g. "ThS. Tâm lý Lâm sàng", "Chuyên viên Tham vấn Học đường", "Cố vấn Đồng đẳng K21"
  roleType: 'specialist' | 'counselor' | 'peer_listener';
  schoolId: string;
  schoolName: string;
  officeLocation: string; // e.g. "Phòng Tham vấn Tâm lý (P.102 - Nhà Hiệu Bộ)"
  specialties: string[];
  experienceYears?: number;
  bio: string;
  ratingScore: number;
  sessionsCount: number;
  isAvailableToday?: boolean;
}

export const TIME_SLOTS_PRESETS = [
  { time: '08:30 - 09:30', period: 'Sáng' as const },
  { time: '10:00 - 11:00', period: 'Sáng' as const },
  { time: '13:30 - 14:30', period: 'Chiều' as const },
  { time: '15:00 - 16:00', period: 'Chiều' as const },
  { time: '16:30 - 17:30', period: 'Chiều' as const },
  { time: '19:00 - 20:00', period: 'Tối' as const },
  { time: '20:30 - 21:30', period: 'Tối' as const },
];

export const INITIAL_COUNSELORS: CampusCounselor[] = [
  {
    id: 'counselor-1',
    name: 'ThS. Nguyễn Hoàng Minh',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    roleTitle: 'Thạc sĩ Tâm lý học Lâm sàng',
    roleType: 'specialist',
    schoolId: 'hnue',
    schoolName: 'Đại học Sư phạm Hà Nội',
    officeLocation: 'Phòng Tham vấn Tâm lý Học đường (P.204 - Tòa nhà K1)',
    specialties: ['Áp lực học tập & Thi cử', 'Trầm lắng cảm xúc & Lo âu', 'Khủng hoảng định hướng nghề nghiệp'],
    experienceYears: 5,
    bio: 'Chuyên môn tham vấn khủng hoảng tuổi vị thành niên và thanh niên, giúp tháo gỡ nút thắt cảm xúc và tìm lại động lực sống.',
    ratingScore: 4.9,
    sessionsCount: 142,
    isAvailableToday: true
  },
  {
    id: 'counselor-2',
    name: 'BS. Lê Thị Thu Hằng',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    roleTitle: 'Chuyên viên Tham vấn & Sức khỏe Tinh thần',
    roleType: 'counselor',
    schoolId: 'hust',
    schoolName: 'Đại học Bách Khoa Hà Nội',
    officeLocation: 'Trung tâm Hỗ trợ Sinh viên & Tham vấn (P.108 - Nhà C1)',
    specialties: ['Burnout & Kiệt sức ngành kỹ thuật', 'Mâu thuẫn gia đình & Kỳ vọng', 'Rối loạn giấc ngủ & Stress'],
    experienceYears: 7,
    bio: 'Đồng hành lắng nghe cùng sinh viên kỹ thuật giải tỏa áp lực điểm số, đồ án và cân bằng tâm lý trong môi trường học tập cường độ cao.',
    ratingScore: 5.0,
    sessionsCount: 215,
    isAvailableToday: true
  },
  {
    id: 'counselor-3',
    name: 'Bạn Lắng Nghe Khóa Trên (K21)',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    roleTitle: 'Peer Listener Đồng Đẳng (Đã qua đào tạo Empathy)',
    roleType: 'peer_listener',
    schoolId: 'neu',
    schoolName: 'Đại học Kinh Tế Quốc Dân',
    officeLocation: 'Văn phòng CLB Tâm Lý KTX (P.102 - Nhà 7)',
    specialties: ['Bỡ ngỡ tân sinh viên', 'Áp lực đồng trang lứa (Peer Pressure)', 'Tình cảm học đường'],
    experienceYears: 2,
    bio: 'Mình từng trải qua cảm giác lạc lõng khi mới vào đại học. Rất vui được ngồi lại lắng nghe và sẻ chia chân thành cùng bạn.',
    ratingScore: 4.8,
    sessionsCount: 78,
    isAvailableToday: true
  },
  {
    id: 'counselor-4',
    name: 'ThS. Trần Tuấn Anh',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    roleTitle: 'Chuyên gia Tâm lý & Hướng nghiệp Trẻ',
    roleType: 'specialist',
    schoolId: 'all-schools',
    schoolName: 'Ban Cố Vấn Toàn Quốc (Sanctuary Hub)',
    officeLocation: 'Phòng Tư Vấn Trực Tuyến Sanctuary',
    specialties: ['Khủng hoảng hiện sinh (Quarter-life Crisis)', 'Tự ti & Tìm lại giá trị bản thân', 'Kỹ năng làm chủ cảm xúc'],
    experienceYears: 6,
    bio: 'Hỗ trợ tham vấn trực tuyến 1-1 qua Google Meet cho học sinh, sinh viên mọi trường với phương pháp tiếp cận nhân văn.',
    ratingScore: 4.9,
    sessionsCount: 310,
    isAvailableToday: true
  },
  {
    id: 'counselor-5',
    name: 'Cô Mai Phương (Tâm lý Học đường)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    roleTitle: 'Cán bộ Tham vấn Tâm lý Học đường',
    roleType: 'counselor',
    schoolId: 'highschool-chuyen',
    schoolName: 'Khối Trường THPT & Chuyên',
    officeLocation: 'Phòng Tư Vấn Học Đường (Tầng 2 - Nhà Đa Năng)',
    specialties: ['Áp lực thi chuyên & Đại học', 'Xung đột thế hệ với cha mẹ', 'Bắt nạt học đường & Tẩy chay'],
    experienceYears: 8,
    bio: 'Không gian an toàn tuyệt đối và bảo mật để các em học sinh có thể khóc, trút bầu tâm sự mà không sợ bị mách phụ huynh hay thầy cô.',
    ratingScore: 5.0,
    sessionsCount: 189,
    isAvailableToday: true
  }
];

// Helper to get counselors list for a given school, merging approved mentor applications
export const getCounselorsForSchool = (
  schoolId?: string,
  schoolName?: string,
  mentorApplications: PeerMentorApplication[] = []
): CampusCounselor[] => {
  const isGlobal = !schoolId || schoolId === 'global' || schoolId === 'all-schools';

  // 1. Dynamic counselors from approved mentor applications
  const dynamicCounselors: CampusCounselor[] = mentorApplications
    .filter(app => app.status === 'approved')
    .map(app => {
      const isSpec = app.roleType === 'specialist';
      return {
        id: `counselor-app-${app.id}`,
        name: app.applicantDisplayName || `Chuyên viên ${app.schoolName}`,
        avatarUrl: app.certificateImageUrl || (isSpec 
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
        ),
        roleTitle: app.qualificationTitle || (isSpec ? 'Chuyên gia Tâm lý Học đường' : 'Bạn Lắng Nghe Đồng Đẳng'),
        roleType: isSpec ? 'specialist' : 'peer_listener',
        schoolId: app.schoolId,
        schoolName: app.schoolName,
        officeLocation: `Phòng Tham Vấn Tâm Lý - ${app.schoolName}`,
        specialties: app.strengths && app.strengths.length > 0 ? app.strengths : ['Lắng nghe thấu cảm', 'Áp lực học tập'],
        experienceYears: isSpec ? 3 : 1,
        bio: app.motivation || 'Sẵn sàng đồng hành và lắng nghe mọi tâm sự của bạn trong không gian bảo mật.',
        ratingScore: 5.0,
        sessionsCount: 12,
        isAvailableToday: true
      };
    });

  // Combine initial preset list + dynamic counselors
  const allCounselors = [...INITIAL_COUNSELORS, ...dynamicCounselors];

  if (isGlobal) {
    return allCounselors;
  }

  // Find exact matches for this school
  const exactMatches = allCounselors.filter(c => 
    c.schoolId === schoolId || 
    (schoolName && c.schoolName.toLowerCase().includes(schoolName.toLowerCase())) ||
    (schoolName && schoolName.toLowerCase().includes(c.schoolName.toLowerCase()))
  );

  // If exact matches exist, also include global counselors at the end for rich options
  const globalCounselors = allCounselors.filter(c => c.schoolId === 'all-schools' || c.id === 'counselor-4');

  if (exactMatches.length > 0) {
    const existingIds = new Set(exactMatches.map(m => m.id));
    const globalsToAdd = globalCounselors.filter(g => !existingIds.has(g.id));
    return [...exactMatches, ...globalsToAdd];
  }

  // If no school-specific counselor yet, generate a campus-specific dedicated counselor card for this school + globals
  const fallbackSchoolCounselor: CampusCounselor = {
    id: `counselor-dedicated-${schoolId}`,
    name: `Ban Tham Vấn Tâm Lý ${schoolName || 'Trường'}`,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    roleTitle: 'Chuyên viên Tâm lý & Cố vấn Học đường',
    roleType: 'counselor',
    schoolId: schoolId || 'school-custom',
    schoolName: schoolName || 'Trường học của bạn',
    officeLocation: `Phòng Tham Vấn Học Đường (Tòa nhà Trung tâm - ${schoolName || 'Trường'})`,
    specialties: ['Áp lực học tập & Điểm số', 'Căng thẳng tâm lý học đường', 'Hướng nghiệp & Phát triển cá nhân'],
    experienceYears: 4,
    bio: `Tổ tư vấn tâm lý trực tiếp của ${schoolName || 'trường'}, tiếp nhận lịch hẹn bảo mật 1-1 cho học sinh, sinh viên.`,
    ratingScore: 4.9,
    sessionsCount: 65,
    isAvailableToday: true
  };

  return [fallbackSchoolCounselor, ...globalCounselors];
};

// Check if a time slot is already booked for a specific counselor and date
export const isTimeSlotBooked = (
  counselorName: string,
  dateStr: string,
  timeSlot: string,
  appointments: CounselingAppointment[] = []
): { isBooked: boolean; bookedBy?: string; appointmentId?: string } => {
  if (!appointments || appointments.length === 0) return { isBooked: false };

  const normalize = (s: string) => s.toLowerCase().trim();

  const found = appointments.find(appt => {
    // Check if status is active (pending or confirmed)
    if (appt.status === 'cancelled' || appt.status === 'completed') return false;

    // Check date match
    const dateMatch = appt.date === dateStr;

    // Check timeSlot match
    const timeMatch = appt.timeSlot === timeSlot;

    // Check counselor match (or if appointment counselor matches selected counselor)
    const counselorMatch = 
      !appt.counselorName || 
      normalize(appt.counselorName) === normalize(counselorName) ||
      normalize(counselorName).includes(normalize(appt.counselorName)) ||
      normalize(appt.counselorName).includes(normalize(counselorName));

    return dateMatch && timeMatch && counselorMatch;
  });

  if (found) {
    return {
      isBooked: true,
      bookedBy: found.requesterDisplayName || found.requesterAnonId || 'Học sinh khác',
      appointmentId: found.id
    };
  }

  return { isBooked: false };
};
