export interface SchoolLocationItem {
  id: string;
  name: string;
  shortName?: string;
  type: 'university' | 'highschool' | 'other';
  address: string;
  city: string;
  lat: number;
  lng: number;
  description?: string;
  rating?: number;
  letterCount?: number;
  isHot?: boolean;
}

export const FAMOUS_VIETNAM_SCHOOLS: SchoolLocationItem[] = [
  // TP. HỒ CHÍ MINH
  {
    id: 'vn-hcmus',
    name: 'Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM (Cơ sở 1)',
    shortName: 'HCMUS',
    type: 'university',
    address: '227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7628,
    lng: 106.6825,
    description: 'Trường đại học trọng điểm về khoa học cơ bản và công nghệ tại miền Nam'
  },
  {
    id: 'vn-hcmus-linhtrung',
    name: 'Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM (Cơ sở Linh Trung)',
    shortName: 'HCMUS Thủ Đức',
    type: 'university',
    address: 'Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.8754,
    lng: 106.8007,
    description: 'Cơ sở đào tạo và nghiên cứu Làng Đại học Quốc gia'
  },
  {
    id: 'vn-hcmut',
    name: 'Trường Đại học Bách Khoa - ĐHQG TP.HCM (Cơ sở 1)',
    shortName: 'HCMUT / Bách Khoa HCM',
    type: 'university',
    address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7725,
    lng: 106.6578,
    description: 'Trường đại học kỹ thuật hàng đầu phía Nam'
  },
  {
    id: 'vn-uit',
    name: 'Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM',
    shortName: 'UIT',
    type: 'university',
    address: 'Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.8702,
    lng: 106.8033,
    description: 'Đại học chuyên ngành CNTT và Truyền thông uy tín'
  },
  {
    id: 'vn-uel',
    name: 'Trường Đại học Kinh tế - Luật - ĐHQG TP.HCM',
    shortName: 'UEL',
    type: 'university',
    address: 'Số 669 Quốc lộ 1K, Khu phố 3, Phường Linh Xuân, TP. Thủ Đức, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.8778,
    lng: 106.7720,
    description: 'Đại học hàng đầu về Kinh tế, Quản lý và Luật'
  },
  {
    id: 'vn-ussh-hcm',
    name: 'Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM',
    shortName: 'USSH HCM',
    type: 'university',
    address: '10-12 Đinh Tiên Hoàng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7876,
    lng: 106.7018,
    description: 'Cái nôi đào tạo khoa học xã hội và nhân văn phía Nam'
  },
  {
    id: 'vn-ueh',
    name: 'Đại học Kinh tế TP. Hồ Chí Minh (UEH - Cơ sở A)',
    shortName: 'UEH',
    type: 'university',
    address: '59C Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7828,
    lng: 106.6958,
    description: 'Đại học đào tạo kinh tế, tài chính và quản trị kinh doanh xuất sắc'
  },
  {
    id: 'vn-ump',
    name: 'Đại học Y Dược TP. Hồ Chí Minh',
    shortName: 'UMP',
    type: 'university',
    address: '217 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7554,
    lng: 106.6599,
    description: 'Trung tâm đào tạo nhân lực y tế hàng đầu cả nước'
  },
  {
    id: 'vn-ftu2',
    name: 'Trường Đại học Ngoại thương (Cơ sở 2 - TP.HCM)',
    shortName: 'FTU2',
    type: 'university',
    address: '15 Đường D5, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.8037,
    lng: 106.7139,
    description: 'Đại học hàng đầu về kinh tế đối ngoại và thương mại quốc tế'
  },
  {
    id: 'vn-rmit-sg',
    name: 'Đại học RMIT Việt Nam (Cơ sở Nam Sài Gòn)',
    shortName: 'RMIT Saigon',
    type: 'university',
    address: '702 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7297,
    lng: 106.6957,
    description: 'Đại học quốc tế chất lượng cao từ Úc'
  },
  {
    id: 'vn-fpt-hcm',
    name: 'Đại học FPT TP. Hồ Chí Minh',
    shortName: 'FPT HCM',
    type: 'university',
    address: 'Lô E2a-7, Đường D1 Khu Công nghệ cao, Phường Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.8415,
    lng: 106.8099,
    description: 'Đại học công nghệ, thiết kế và kinh doanh hiện đại'
  },
  {
    id: 'vn-hcmup',
    name: 'Trường Đại học Sư phạm TP. Hồ Chí Minh',
    shortName: 'HCMUP',
    type: 'university',
    address: '280 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7607,
    lng: 106.6823,
    description: 'Trường sư phạm trọng điểm quốc gia khu vực phía Nam'
  },
  {
    id: 'vn-thpt-lhp-hcm',
    name: 'Trường THPT Chuyên Lê Hồng Phong TP.HCM',
    shortName: 'Chuyên LHP HCM',
    type: 'highschool',
    address: '235 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7618,
    lng: 106.6830,
    description: 'Trường trung học phổ thông chuyên danh tiếng nhất miền Nam'
  },
  {
    id: 'vn-thpt-ptnk',
    name: 'Trường Phổ thông Năng khiếu - ĐHQG TP.HCM',
    shortName: 'PTNK ĐHQG-HCM',
    type: 'highschool',
    address: '153 Nguyễn Chí Thanh, Phường 9, Quận 5, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7599,
    lng: 106.6698,
    description: 'Trường chuyên trực thuộc Đại học Quốc gia TP.HCM'
  },
  {
    id: 'vn-thpt-tdn-hcm',
    name: 'Trường THPT Chuyên Trần Đại Nghĩa TP.HCM',
    shortName: 'Chuyên Trần Đại Nghĩa',
    type: 'highschool',
    address: '20 Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    lat: 10.7788,
    lng: 106.7022,
    description: 'Trường THPT chuyên hàng đầu về đào tạo ngoại ngữ và tự nhiên'
  },

  // THỦ ĐÔ HÀ NỘI
  {
    id: 'vn-hust',
    name: 'Đại học Bách khoa Hà Nội',
    shortName: 'HUST / Bách Khoa HN',
    type: 'university',
    address: 'Số 1 Đại Cồ Việt, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội',
    city: 'Hà Nội',
    lat: 21.0073,
    lng: 105.8431,
    description: 'Đại học kỹ thuật đa ngành hàng đầu Việt Nam'
  },
  {
    id: 'vn-vnu-hus',
    name: 'Trường Đại học Khoa học Tự nhiên - ĐHQG Hà Nội',
    shortName: 'HUS - VNU',
    type: 'university',
    address: '334 Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội',
    city: 'Hà Nội',
    lat: 20.9959,
    lng: 105.8074,
    description: 'Cái nôi đào tạo và nghiên cứu khoa học cơ bản hàng đầu miền Bắc'
  },
  {
    id: 'vn-neu',
    name: 'Trường Đại học Kinh tế Quốc dân',
    shortName: 'NEU',
    type: 'university',
    address: '207 Giải Phóng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội',
    city: 'Hà Nội',
    lat: 21.0003,
    lng: 105.8427,
    description: 'Trung tâm đào tạo kinh tế và quản trị hàng đầu quốc gia'
  },
  {
    id: 'vn-ftu',
    name: 'Trường Đại học Ngoại thương (Trụ sở Hà Nội)',
    shortName: 'FTU HN',
    type: 'university',
    address: '91 Phố Chùa Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội',
    city: 'Hà Nội',
    lat: 21.0229,
    lng: 105.8020,
    description: 'Trường đại học danh giá đào tạo nhân tài kinh tế và thương mại'
  },
  {
    id: 'vn-hmu',
    name: 'Trường Đại học Y Hà Nội',
    shortName: 'HMU / Y Hà Nội',
    type: 'university',
    address: 'Số 1 Tôn Thất Tùng, Phường Trung Tự, Quận Đống Đa, Hà Nội',
    city: 'Hà Nội',
    lat: 21.0028,
    lng: 105.8306,
    description: 'Trường đại học y khoa lâu đời và uy tín nhất Việt Nam'
  },
  {
    id: 'vn-vinuni',
    name: 'Trường Đại học VinUni',
    shortName: 'VinUni',
    type: 'university',
    address: 'Vinhomes Ocean Park, Đa Tốn, Huyện Gia Lâm, Hà Nội',
    city: 'Hà Nội',
    lat: 20.9886,
    lng: 105.9407,
    description: 'Trường đại học tinh hoa tiêu chuẩn quốc tế'
  },
  {
    id: 'vn-thpt-ams',
    name: 'Trường THPT Chuyên Hà Nội - Amsterdam',
    shortName: 'Ams / Hà Nội - Ams',
    type: 'highschool',
    address: 'Số 1 Hoàng Minh Giám, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    lat: 21.0076,
    lng: 105.7972,
    description: 'Trường trung học chuyên danh tiếng số một Thủ đô'
  },
  {
    id: 'vn-thpt-chuyensupham',
    name: 'Trường THPT Chuyên Đại học Sư phạm Hà Nội',
    shortName: 'Chuyên Sư Phạm HN',
    type: 'highschool',
    address: '136 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    lat: 21.0369,
    lng: 105.7831,
    description: 'Trường chuyên trực thuộc Trường Đại học Sư phạm Hà Nội'
  },
  {
    id: 'vn-thpt-chuyentunhien',
    name: 'Trường THPT Chuyên Khoa học Tự nhiên - ĐHQG Hà Nội',
    shortName: 'Chuyên KHTN',
    type: 'highschool',
    address: '182 Lương Thế Vinh, Phường Thanh Xuân Bắc, Quận Thanh Xuân, Hà Nội',
    city: 'Hà Nội',
    lat: 20.9946,
    lng: 105.7958,
    description: 'Cái nôi đào tạo học sinh giỏi Olympic quốc tế Toán, Lý, Hóa, Tin'
  },

  // ĐÀ NẴNG & MIỀN TRUNG
  {
    id: 'vn-dut',
    name: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    shortName: 'DUT / Bách Khoa Đà Nẵng',
    type: 'university',
    address: '54 Nguyễn Lương Bằng, Phường Hòa Khánh Bắc, Quận Liên Chiểu, Đà Nẵng',
    city: 'Đà Nẵng',
    lat: 16.0747,
    lng: 108.1504,
    description: 'Trung tâm đào tạo kỹ thuật công nghệ lớn nhất miền Trung'
  },
  {
    id: 'vn-due',
    name: 'Trường Đại học Kinh tế - Đại học Đà Nẵng',
    shortName: 'DUE',
    type: 'university',
    address: '71 Ngũ Hành Sơn, Phường Mỹ An, Quận Ngũ Hành Sơn, Đà Nẵng',
    city: 'Đà Nẵng',
    lat: 16.0504,
    lng: 108.2417,
    description: 'Trường đại học đào tạo kinh tế và quản trị kinh doanh miền Trung'
  },
  {
    id: 'vn-thpt-lequydon-dn',
    name: 'Trường THPT Chuyên Lê Quý Đôn Đà Nẵng',
    shortName: 'Chuyên Lê Quý Đôn ĐN',
    type: 'highschool',
    address: 'Số 01 Vũ Văn Dũng, Phường An Hải Tây, Quận Sơn Trà, Đà Nẵng',
    city: 'Đà Nẵng',
    lat: 16.0610,
    lng: 108.2323,
    description: 'Trường trung học phổ thông chuyên hàng đầu thành phố Đà Nẵng'
  },

  // THỪA THIÊN HUẾ
  {
    id: 'vn-hue-uni',
    name: 'Đại học Huế',
    shortName: 'Đại học Huế',
    type: 'university',
    address: '03 Lê Lợi, Phường Vĩnh Ninh, TP. Huế, Thừa Thiên Huế',
    city: 'Thừa Thiên Huế',
    lat: 16.4678,
    lng: 107.5878,
    description: 'Đại học vùng trọng điểm quốc gia tại miền Trung'
  },
  {
    id: 'vn-thpt-quochoc-hue',
    name: 'Trường THPT Chuyên Quốc Học Huế',
    shortName: 'Quốc Học Huế',
    type: 'highschool',
    address: '12 Lê Lợi, Phường Vĩnh Ninh, TP. Huế, Thừa Thiên Huế',
    city: 'Thừa Thiên Huế',
    lat: 16.4632,
    lng: 107.5849,
    description: 'Ngôi trường cổ kính và danh giá bậc nhất Việt Nam'
  },

  // CẦN THƠ
  {
    id: 'vn-ctu',
    name: 'Trường Đại học Cần Thơ',
    shortName: 'CTU / ĐH Cần Thơ',
    type: 'university',
    address: 'Khu II, Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ',
    city: 'Cần Thơ',
    lat: 10.0308,
    lng: 105.7686,
    description: 'Trường đại học trọng điểm quốc gia vùng Đồng bằng Sông Cửu Long'
  },
  {
    id: 'vn-ctump',
    name: 'Trường Đại học Y Dược Cần Thơ',
    shortName: 'CTUMP',
    type: 'university',
    address: '179 Nguyễn Văn Cừ, Phường An Khánh, Quận Ninh Kiều, TP. Cần Thơ',
    city: 'Cần Thơ',
    lat: 10.0354,
    lng: 105.7573,
    description: 'Trung tâm đào tạo y dược lớn nhất miền Tây Nam Bộ'
  },
  {
    id: 'vn-thpt-chuyenltp-ct',
    name: 'Trường THPT Chuyên Lý Tự Trọng Cần Thơ',
    shortName: 'Chuyên Lý Tự Trọng CT',
    type: 'highschool',
    address: 'Đường Nguyễn Văn Cừ Nối Dài, Phường An Khánh, Quận Ninh Kiều, Cần Thơ',
    city: 'Cần Thơ',
    lat: 10.0435,
    lng: 105.7482,
    description: 'Trường trung học chuyên danh giá của TP. Cần Thơ'
  },

  // HẢI PHÒNG
  {
    id: 'vn-vmu',
    name: 'Trường Đại học Hàng hải Việt Nam',
    shortName: 'VMU / Hàng Hải',
    type: 'university',
    address: '484 Lạch Tray, Phường Kênh Dương, Quận Lê Chân, Hải Phòng',
    city: 'Hải Phòng',
    lat: 20.8351,
    lng: 106.6961,
    description: 'Trường đại học trọng điểm quốc gia về kinh tế biển và hàng hải'
  },
  {
    id: 'vn-thpt-trannhandong-hp',
    name: 'Trường THPT Chuyên Trần Phú Hải Phòng',
    shortName: 'Chuyên Trần Phú HP',
    type: 'highschool',
    address: 'Đường Lê Hồng Phong, Phường Đằng Hải, Quận Hải An, Hải Phòng',
    city: 'Hải Phòng',
    lat: 20.8525,
    lng: 106.7088,
    description: 'Trường chuyên danh tiếng thành phố Hải Phòng'
  },

  // THÁI NGUYÊN
  {
    id: 'vn-tnu',
    name: 'Đại học Thái Nguyên',
    shortName: 'TNU / ĐH Thái Nguyên',
    type: 'university',
    address: 'Phường Tân Thịnh, TP. Thái Nguyên, Thái Nguyên',
    city: 'Thái Nguyên',
    lat: 21.5833,
    lng: 105.8167,
    description: 'Đại học vùng trọng điểm quốc gia vùng Trung du và miền núi Bắc Bộ'
  },

  // BIỂN ĐẢO QUÊ HƯƠNG: HOÀNG SA & TRƯỜNG SA (VIỆT NAM)
  {
    id: 'vn-hs-danang',
    name: 'Đài Tưởng Niệm & Nhà Trưng Bày Hoàng Sa',
    shortName: 'Hoàng Sa (Đà Nẵng)',
    type: 'other',
    address: 'Quần đảo Hoàng Sa, Huyện đảo Hoàng Sa, TP. Đà Nẵng, Việt Nam',
    city: 'Đà Nẵng',
    lat: 16.5400,
    lng: 112.0350,
    description: 'Chủ quyền thiêng liêng biển đảo Tổ quốc Việt Nam 🇻🇳'
  },
  {
    id: 'vn-truongsa-school',
    name: 'Trường Tiểu học Trường Sa (Đảo Trường Sa Lớn)',
    shortName: 'TH Trường Sa',
    type: 'highschool',
    address: 'Đảo Trường Sa Lớn, Huyện đảo Trường Sa, Tỉnh Khánh Hòa, Việt Nam',
    city: 'Khánh Hòa',
    lat: 8.6420,
    lng: 111.9220,
    description: 'Mái trường yêu thương nơi đầu sóng ngọn gió của Tổ quốc Việt Nam 🇻🇳'
  },
  {
    id: 'vn-songtutay-school',
    name: 'Trường Tiểu học Song Tử Tây',
    shortName: 'TH Song Tử Tây',
    type: 'highschool',
    address: 'Đảo Song Tử Tây, Huyện đảo Trường Sa, Tỉnh Khánh Hòa, Việt Nam',
    city: 'Khánh Hòa',
    lat: 11.4286,
    lng: 114.3317,
    description: 'Điểm sáng tri thức và tiếng trống trường rộn rã giữa biển đảo quê hương 🇻🇳'
  },
  {
    id: 'vn-sinhton-school',
    name: 'Trường Tiểu học Sinh Tồn',
    shortName: 'TH Sinh Tồn',
    type: 'highschool',
    address: 'Đảo Sinh Tồn, Huyện đảo Trường Sa, Tỉnh Khánh Hòa, Việt Nam',
    city: 'Khánh Hòa',
    lat: 9.8847,
    lng: 114.3194,
    description: 'Mầm xanh tương lai kiên cường tại quần đảo Trường Sa, Việt Nam 🇻🇳'
  }
];

/**
 * Search local school directory by name, shortName, city, or address
 */
export function searchLocalSchools(query: string): SchoolLocationItem[] {
  if (!query || !query.trim()) return [];
  const cleanQ = query.toLowerCase().trim();
  
  return FAMOUS_VIETNAM_SCHOOLS.filter(s => {
    return (
      s.name.toLowerCase().includes(cleanQ) ||
      (s.shortName && s.shortName.toLowerCase().includes(cleanQ)) ||
      s.address.toLowerCase().includes(cleanQ) ||
      s.city.toLowerCase().includes(cleanQ)
    );
  });
}

/**
 * Free geocoding lookup using Photon / OSM Geocode for any address or custom school name worldwide
 */
export async function geocodeAddressOnline(query: string): Promise<SchoolLocationItem[]> {
  if (!query || query.trim().length < 2) return [];
  const cleanQ = encodeURIComponent(query.trim());

  try {
    // Photon API (Free, fast, OpenStreetMap data based, CORS friendly)
    const url = `https://photon.komoot.io/api/?q=${cleanQ}&limit=6&lat=15.8&lon=107.5`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map((f: any, idx: number) => {
      const p = f.properties || {};
      const [lng, lat] = f.geometry?.coordinates || [106.6825, 10.7628];
      const name = p.name || p.street || p.city || query;
      const city = p.city || p.county || p.state || p.country || 'Việt Nam';
      const address = [p.housenumber, p.street, p.district, p.city, p.state, p.country]
        .filter(Boolean)
        .join(', ') || name;

      const isUni = name.toLowerCase().includes('đại học') || name.toLowerCase().includes('university') || name.toLowerCase().includes('college');
      const isHigh = name.toLowerCase().includes('thpt') || name.toLowerCase().includes('trường') || name.toLowerCase().includes('school');

      return {
        id: `online-geo-${idx}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        name: name,
        type: isUni ? 'university' : isHigh ? 'highschool' : 'other',
        address: address,
        city: city,
        lat: lat,
        lng: lng,
        description: p.type ? `Loại: ${p.type}` : undefined
      };
    });
  } catch (err) {
    console.warn('Geocoding fetch error:', err);
    return [];
  }
}
