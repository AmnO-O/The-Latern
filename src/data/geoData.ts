export interface ProvinceDistribution {
  id: string;
  name: string;
  region: 'Miền Bắc' | 'Miền Trung' | 'Miền Nam' | 'Biển Đảo' | 'Quốc tế';
  lat: number;
  lng: number;
  baseWeight: number; // relative weight for distribution calculation
  description?: string;
  encouragingMessages: string[];
}

export const VIETNAM_PROVINCES: ProvinceDistribution[] = [
  {
    id: 'vn-hcm',
    name: 'TP. Hồ Chí Minh',
    region: 'Miền Nam',
    lat: 10.8231,
    lng: 106.6297,
    baseWeight: 0.35,
    description: 'Trung tâm kinh tế, văn hóa và giáo dục lớn nhất phía Nam',
    encouragingMessages: [
      'Gửi một cái ôm ấm áp đến các bạn sinh viên đang trọ xa nhà tại Sài Gòn 🌿',
      'Đêm Sài Gòn hoa lệ nhưng đừng để bản thân cô đơn, luôn có người lắng nghe bạn!',
      'Cố lên các sĩ tử và sinh viên năng động của thành phố mang tên Bác ✨'
    ]
  },
  {
    id: 'vn-hn',
    name: 'Thủ đô Hà Nội',
    region: 'Miền Bắc',
    lat: 21.0285,
    lng: 105.8542,
    baseWeight: 0.30,
    description: 'Trung tâm học thuật và văn hiến ngàn năm với hàng chục đại học hàng đầu',
    encouragingMessages: [
      'Gió mùa về rồi, các bạn học sinh sinh viên Thủ đô nhớ giữ ấm nhé 🧣',
      'Những đêm ôn thi khuya tại giảng đường, bạn đã nỗ lực rất tuyệt vời rồi!',
      'Một ngọn đèn bình yên gửi tới từng góc nhỏ ký túc xá Bách - Kinh - Xây 🏮'
    ]
  },
  {
    id: 'vn-dn',
    name: 'TP. Đà Nẵng',
    region: 'Miền Trung',
    lat: 16.0544,
    lng: 108.2022,
    baseWeight: 0.12,
    description: 'Thành phố đáng sống ven biển miền Trung với thế hệ trẻ đầy năng lượng',
    encouragingMessages: [
      'Gió biển Đà Nẵng sẽ thổi bay những âu lo và áp lực thi cử của bạn 🌊',
      'Gửi ngọn đèn ấm áp đến các bạn sinh viên ĐH Đà Nẵng và các trường THPT ven sông Hàn!'
    ]
  },
  {
    id: 'vn-ct',
    name: 'TP. Cần Thơ',
    region: 'Miền Nam',
    lat: 10.0452,
    lng: 105.7469,
    baseWeight: 0.08,
    description: 'Thủ phủ miền Tây Nam Bộ, trung tâm giáo dục ĐBSCL',
    encouragingMessages: [
      'Miền Tây mến thương gửi lời chúc bình an và vững tin đến bạn 🌾',
      'Sinh viên ĐH Cần Thơ và học sinh miền sông nước ơi, hãy luôn tự tin tỏa sáng!'
    ]
  },
  {
    id: 'vn-bd',
    name: 'Bình Dương (Thủ Dầu Một)',
    region: 'Miền Nam',
    lat: 10.9805,
    lng: 106.6519,
    baseWeight: 0.06,
    description: 'Thành phố mới và làng đại học kết nối công nghệ năng động',
    encouragingMessages: [
      'Gửi ngọn đèn thắp sáng ký túc xá khu ĐHQG Thủ Đức - Dĩ An 📚',
      'Áp lực đồ án rồi cũng sẽ qua, thành quả ngọt ngào đang chờ bạn phía trước!'
    ]
  },
  {
    id: 'vn-hue',
    name: 'Thừa Thiên Huế',
    region: 'Miền Trung',
    lat: 16.4637,
    lng: 107.5909,
    baseWeight: 0.06,
    description: 'Cố đô di sản với nét trầm tư và truyền thống học tập sâu sắc',
    encouragingMessages: [
      'Mưa Huế có thể làm lòng bạn chùng xuống, nhưng ngọn đèn nơi đây sẽ sưởi ấm tâm hồn bạn 🏮',
      'Thương gửi các bạn sinh viên ĐH Huế và học sinh trường Quốc Học Huế tài ba!'
    ]
  },
  {
    id: 'vn-hp',
    name: 'Hải Phòng',
    region: 'Miền Bắc',
    lat: 20.8449,
    lng: 106.6881,
    baseWeight: 0.05,
    description: 'Thành phố hoa phượng đỏ kiên cường và sôi nổi',
    encouragingMessages: [
      'Tinh thần đất Cảng mạnh mẽ sẽ giúp bạn vượt qua mọi thử thách!',
      'Gửi lời chúc chân thành đến tất cả các bạn học sinh sinh viên Hải Phòng 🚢'
    ]
  },
  {
    id: 'vn-qn',
    name: 'Quảng Ninh (Hạ Long)',
    region: 'Miền Bắc',
    lat: 20.9505,
    lng: 107.0734,
    baseWeight: 0.04,
    description: 'Vùng đất mỏ anh hùng và di sản vịnh Hạ Long kỳ vĩ',
    encouragingMessages: [
      'Vững tâm vượt sóng gió như những cánh buồm trên vịnh Hạ Long ⛵'
    ]
  },
  {
    id: 'vn-nd',
    name: 'Nam Định',
    region: 'Miền Bắc',
    lat: 20.4200,
    lng: 106.1683,
    baseWeight: 0.04,
    description: 'Đất học Thành Nam với trường chuyên Lê Hồng Phong lừng danh',
    encouragingMessages: [
      'Tinh thần hiếu học đất Thành Nam luôn là ngọn đuốc sáng soi đường cho bạn!'
    ]
  },
  {
    id: 'vn-ld',
    name: 'Lâm Đồng (Đà Lạt)',
    region: 'Miền Nam',
    lat: 11.9404,
    lng: 108.4583,
    baseWeight: 0.04,
    description: 'Xứ sở sương mù bình yên giữa cao nguyên ngàn thông',
    encouragingMessages: [
      'Không khí se lạnh Đà Lạt cùng một tách trà ấm và lời tâm sự dịu dàng 🌲',
      'Dù bạn đang trọ học ở đâu, hãy nhớ luôn có một chốn bình yên cho tâm trí.'
    ]
  },
  {
    id: 'vn-kh',
    name: 'Khánh Hòa (Nha Trang)',
    region: 'Miền Trung',
    lat: 12.2388,
    lng: 109.1967,
    baseWeight: 0.04,
    description: 'Thành phố biển ngập tràn ánh nắng và ước mơ',
    encouragingMessages: [
      'Nắng vàng và biển xanh Nha Trang tiếp thêm nguồn sinh khí cho bạn ☀️'
    ]
  },
  {
    id: 'vn-dl',
    name: 'Đắk Lắk (Buôn Ma Thuột)',
    region: 'Miền Trung',
    lat: 12.6675,
    lng: 108.0383,
    baseWeight: 0.04,
    description: 'Thủ phủ cà phê Tây Nguyên với tấm lòng rộng mở và kiên cường',
    encouragingMessages: [
      'Hương hoa cà phê đại ngàn gửi chút ấm áp về giảng đường của bạn ☕'
    ]
  },
  {
    id: 'vn-dnai',
    name: 'Đồng Nai (Biên Hòa)',
    region: 'Miền Nam',
    lat: 10.9574,
    lng: 106.8427,
    baseWeight: 0.04,
    description: 'Vùng đất công nghiệp và giáo dục liền kề TP.HCM',
    encouragingMessages: [
      'Chúc các bạn học sinh Biên Hòa và Đồng Nai luôn giữ vững niềm tin vào bản thân!'
    ]
  },
  {
    id: 'vn-na',
    name: 'Nghệ An (TP. Vinh)',
    region: 'Miền Trung',
    lat: 18.6734,
    lng: 105.6813,
    baseWeight: 0.04,
    description: 'Vùng đất địa linh nhân kiệt với truyền thống hiếu học vang danh',
    encouragingMessages: [
      'Ý chí kiên cường xứ Nghệ sẽ đưa bạn chạm tới những ước mơ cao xa nhất!'
    ]
  },
  {
    id: 'vn-th',
    name: 'Thanh Hóa',
    region: 'Miền Bắc',
    lat: 19.8067,
    lng: 105.7852,
    baseWeight: 0.03,
    description: 'Cái nôi hiếu học với nhiều thủ khoa và tài năng trẻ',
    encouragingMessages: [
      'Gửi ngọn đèn niềm tin đến các bạn học sinh đất Lam Sơn và khắp Thanh Hóa 🌟'
    ]
  },
  {
    id: 'vn-tn',
    name: 'Thái Nguyên',
    region: 'Miền Bắc',
    lat: 21.5928,
    lng: 105.8442,
    baseWeight: 0.03,
    description: 'Trung tâm giáo dục và đào tạo lớn của vùng trung du miền núi phía Bắc',
    encouragingMessages: [
      'Đại học Thái Nguyên và các bạn sinh viên miền núi phía Bắc luôn kề vai sát cánh cùng bạn!'
    ]
  },
  {
    id: 'vn-vt',
    name: 'Bà Rịa - Vũng Tàu',
    region: 'Miền Nam',
    lat: 10.3460,
    lng: 107.0843,
    baseWeight: 0.03,
    description: 'Ngọn hải đăng dẫn lối cho những tâm sự cần tìm bến đỗ bình an',
    encouragingMessages: [
      'Ánh sáng ngọn hải đăng Vũng Tàu soi sáng mọi bước đường bạn đi ⚓'
    ]
  },
  {
    id: 'vn-bdinh',
    name: 'Bình Định (Quy Nhơn)',
    region: 'Miền Trung',
    lat: 13.7820,
    lng: 109.2197,
    baseWeight: 0.03,
    description: 'Vùng đất võ trời văn với trung tâm khoa học ICISE Quy Nhơn',
    encouragingMessages: [
      'Thành phố khoa học Quy Nhơn gửi tới bạn niềm đam mê và nguồn cảm hứng bất tận!'
    ]
  },
  {
    id: 'vn-ag',
    name: 'An Giang (Long Xuyên)',
    region: 'Miền Nam',
    lat: 10.3833,
    lng: 105.4333,
    baseWeight: 0.02,
    description: 'Vùng đất Thất Sơn linh thiêng và nét đẹp nghĩa tình miền biên viễn',
    encouragingMessages: [
      'Sự mộc mạc và chân thành từ An Giang sẽ ôm lấy những nỗi buồn của bạn.'
    ]
  },
  {
    id: 'vn-hoangsa',
    name: 'Quần đảo Hoàng Sa (TP. Đà Nẵng)',
    region: 'Biển Đảo',
    lat: 16.5367,
    lng: 112.0333,
    baseWeight: 0.02,
    description: 'Quần đảo Hoàng Sa thiêng liêng - phần lãnh thổ máu thịt không thể tách rời của Tổ quốc Việt Nam 🇻🇳',
    encouragingMessages: [
      'Hoàng Sa - Trường Sa luôn trong trái tim mỗi người con đất Việt 🇻🇳',
      'Gửi ngọn đèn niềm tin và lời tri ân sâu sắc tới biển đảo quê hương thiêng liêng!'
    ]
  },
  {
    id: 'vn-truongsa',
    name: 'Quần đảo Trường Sa (Khánh Hòa)',
    region: 'Biển Đảo',
    lat: 8.6444,
    lng: 111.9197,
    baseWeight: 0.02,
    description: 'Quần đảo Trường Sa kiên cường nơi đầu sóng ngọn gió - chủ quyền biển đảo thiêng liêng của Việt Nam 🇻🇳',
    encouragingMessages: [
      'Trường Sa vì cả nước, cả nước vì Trường Sa! 🇻🇳',
      'Ngọn đèn thấu cảm gửi tới các cán bộ, chiến sĩ, thầy cô và các em học sinh nơi đảo xa ⚓'
    ]
  },
  {
    id: 'vn-phuquoc',
    name: 'Đảo Phú Quốc (Kiên Giang)',
    region: 'Biển Đảo',
    lat: 10.2289,
    lng: 103.9572,
    baseWeight: 0.02,
    description: 'Đảo ngọc Phú Quốc tươi đẹp phía Tây Nam của Tổ quốc 🇻🇳',
    encouragingMessages: [
      'Gió biển trong lành từ đảo ngọc Phú Quốc tiếp thêm năng lượng cho bạn!'
    ]
  },
  {
    id: 'vn-condao',
    name: 'Côn Đảo (Bà Rịa - Vũng Tàu)',
    region: 'Biển Đảo',
    lat: 8.6835,
    lng: 106.6074,
    baseWeight: 0.02,
    description: 'Vùng đất thiêng liêng ghi dấu truyền thống bất khuất kiên trung của dân tộc 🇻🇳',
    encouragingMessages: [
      'Thắp sáng nén tâm nhang và ngọn đèn tri ân nơi Côn Đảo anh hùng!'
    ]
  },
  {
    id: 'global-jp',
    name: 'Tokyo, Nhật Bản (Du học sinh)',
    region: 'Quốc tế',
    lat: 35.6762,
    lng: 139.6503,
    baseWeight: 0.04,
    description: 'Cộng đồng cựu sinh viên và du học sinh Việt Nam tại xứ sở hoa anh đào',
    encouragingMessages: [
      'Dù cách xa quê nhà hàng ngàn cây số, ngọn đèn học đường vẫn luôn kết nối chúng ta 🌸',
      'Vừa học vừa làm nơi đất khách rất vất vả, hãy giữ gìn sức khỏe nhé đồng hương!'
    ]
  },
  {
    id: 'global-kr',
    name: 'Seoul, Hàn Quốc (Du học sinh)',
    region: 'Quốc tế',
    lat: 37.5665,
    lng: 126.9780,
    baseWeight: 0.03,
    description: 'Cộng đồng sinh viên và nghiên cứu sinh Việt Nam tại Hàn Quốc',
    encouragingMessages: [
      'Những đêm đông Seoul buốt giá bỗng ấm hơn khi đọc những dòng thư từ trường cũ ❄️'
    ]
  },
  {
    id: 'global-sg',
    name: 'Singapore (ASEAN Hub)',
    region: 'Quốc tế',
    lat: 1.3521,
    lng: 103.8198,
    baseWeight: 0.02,
    description: 'Trung tâm nghiên cứu & sinh viên trao đổi quốc tế Đông Nam Á',
    encouragingMessages: [
      'Gửi ngọn đèn kết nối tri thức từ đảo quốc sư tử 🦁'
    ]
  },
  {
    id: 'global-au',
    name: 'Melbourne, Úc (Du học sinh)',
    region: 'Quốc tế',
    lat: -37.8136,
    lng: 144.9631,
    baseWeight: 0.03,
    description: 'Mạng lưới sinh viên và cựu sinh viên giao lưu quốc tế tại Úc',
    encouragingMessages: [
      'Gửi cái ôm ấm áp từ Nam Bán Cầu về các mái trường thân yêu tại Việt Nam 🦘'
    ]
  },
  {
    id: 'global-us',
    name: 'California, Hoa Kỳ (Alumni Network)',
    region: 'Quốc tế',
    lat: 37.7749,
    lng: -122.4194,
    baseWeight: 0.03,
    description: 'Thung lũng Silicon & mạng lưới cựu sinh viên công nghệ toàn cầu',
    encouragingMessages: [
      'Từ bờ Tây nước Mỹ, cựu sinh viên luôn dõi theo và tiếp sức cho thế hệ đàn em!'
    ]
  },
  {
    id: 'global-uk',
    name: 'London, Anh Quốc (Du học sinh)',
    region: 'Quốc tế',
    lat: 51.5074,
    lng: -0.1278,
    baseWeight: 0.02,
    description: 'Mạng lưới du học sinh và cựu học sinh Việt Nam tại Vương quốc Anh',
    encouragingMessages: [
      'Gửi ngọn đèn ấm áp từ sương mù London về giảng đường quê hương 🇬🇧'
    ]
  },
  {
    id: 'global-fr',
    name: 'Paris, Pháp (Du học sinh)',
    region: 'Quốc tế',
    lat: 48.8566,
    lng: 2.3522,
    baseWeight: 0.02,
    description: 'Cộng đồng sinh viên và nhà nghiên cứu trẻ Việt Nam tại Pháp',
    encouragingMessages: [
      'Từ kinh đô ánh sáng Paris, chúc mái trường và các bạn sinh viên luôn tỏa sáng 🇫🇷'
    ]
  }
];

export interface SchoolGeoStats {
  schoolId: string;
  schoolName: string;
  totalVerifiedMembers: number;
  centerLocation: { lat: number; lng: number; name: string };
  distribution: {
    provinceId: string;
    provinceName: string;
    region: string;
    lat: number;
    lng: number;
    verifiedCount: number;
    lanternsLitCount: number;
    percentage: number;
    recentWarmth: string;
  }[];
}

export function calculateSchoolGeoDistribution(
  schoolId: string,
  schoolName: string,
  schoolLocation: string = 'Việt Nam',
  verifiedCount: number = 24
): SchoolGeoStats {
  // Determine anchor center for this school based on location text
  let centerLat = 10.8231;
  let centerLng = 106.6297;
  let centerName = 'TP. Hồ Chí Minh';

  const locLower = (schoolLocation + ' ' + schoolName).toLowerCase();
  if (locLower.includes('hà nội') || locLower.includes('hanoi') || locLower.includes('bách khoa hà nội') || locLower.includes('amsterdam') || locLower.includes('kinh tế quốc dân') || locLower.includes('ngoại thương hà nội') || locLower.includes('y hà nội')) {
    centerLat = 21.0285;
    centerLng = 105.8542;
    centerName = 'Hà Nội';
  } else if (locLower.includes('đà nẵng') || locLower.includes('da nang') || locLower.includes('bách khoa đà nẵng')) {
    centerLat = 16.0544;
    centerLng = 108.2022;
    centerName = 'Đà Nẵng';
  } else if (locLower.includes('cần thơ') || locLower.includes('can tho') || locLower.includes('đại học cần thơ')) {
    centerLat = 10.0452;
    centerLng = 105.7469;
    centerName = 'Cần Thơ';
  } else if (locLower.includes('huế') || locLower.includes('hue') || locLower.includes('quốc học huế')) {
    centerLat = 16.4637;
    centerLng = 107.5909;
    centerName = 'Thừa Thiên Huế';
  } else if (locLower.includes('hải phòng') || locLower.includes('trần phú')) {
    centerLat = 20.8449;
    centerLng = 106.6881;
    centerName = 'Hải Phòng';
  } else if (locLower.includes('nam định') || locLower.includes('thành nam')) {
    centerLat = 20.4200;
    centerLng = 106.1683;
    centerName = 'Nam Định';
  } else if (locLower.includes('thái nguyên')) {
    centerLat = 21.5928;
    centerLng = 105.8442;
    centerName = 'Thái Nguyên';
  } else if (locLower.includes('bình dương') || locLower.includes('dĩ an') || locLower.includes('thủ dầu một')) {
    centerLat = 10.9805;
    centerLng = 106.6519;
    centerName = 'Bình Dương';
  } else if (locLower.includes('đồng nai') || locLower.includes('biên hòa')) {
    centerLat = 10.9574;
    centerLng = 106.8427;
    centerName = 'Đồng Nai';
  } else if (locLower.includes('nha trang') || locLower.includes('khánh hòa')) {
    centerLat = 12.2388;
    centerLng = 109.1967;
    centerName = 'Khánh Hòa';
  } else if (locLower.includes('đà lạt') || locLower.includes('lâm đồng')) {
    centerLat = 11.9404;
    centerLng = 108.4583;
    centerName = 'Lâm Đồng';
  } else if (locLower.includes('vinh') || locLower.includes('nghệ an') || locLower.includes('phan bội châu')) {
    centerLat = 18.6734;
    centerLng = 105.6813;
    centerName = 'Nghệ An';
  } else if (locLower.includes('thanh hóa') || locLower.includes('lam sơn')) {
    centerLat = 19.8067;
    centerLng = 105.7852;
    centerName = 'Thanh Hóa';
  } else if (locLower.includes('vũng tàu') || locLower.includes('bà rịa')) {
    centerLat = 10.3460;
    centerLng = 107.0843;
    centerName = 'Bà Rịa - Vũng Tàu';
  } else if (locLower.includes('quy nhơn') || locLower.includes('bình định')) {
    centerLat = 13.7820;
    centerLng = 109.2197;
    centerName = 'Bình Định';
  } else if (locLower.includes('toàn quốc') || schoolId === 'all-schools') {
    centerLat = 16.0544;
    centerLng = 107.5909;
    centerName = 'Toàn Quốc (Trung tâm Việt Nam)';
  }

  // Generate deterministic seed based on school name
  let seed = 0;
  for (let i = 0; i < schoolName.length; i++) {
    seed = (seed * 31 + schoolName.charCodeAt(i)) % 1000000;
  }

  const effectiveTotal = Math.max(verifiedCount, 18);

  const rawDist = VIETNAM_PROVINCES.map((prov, index) => {
    // Boost province if it's the home province
    let weight = prov.baseWeight;
    if (prov.name.toLowerCase().includes(centerName.toLowerCase())) {
      weight *= 2.8;
    }

    const pseudoRandom = ((seed + index * 9973) % 100) / 100;
    const randomizedWeight = weight * (0.7 + pseudoRandom * 0.6);

    return {
      prov,
      randomizedWeight
    };
  });

  const sumWeight = rawDist.reduce((acc, curr) => acc + curr.randomizedWeight, 0);

  const distribution = rawDist.map(({ prov, randomizedWeight }, idx) => {
    const rawCount = Math.round((randomizedWeight / sumWeight) * effectiveTotal);
    const count = Math.max(1, rawCount);
    const lanternCount = count + Math.floor((((seed + idx * 7919) % 50) / 50) * count * 1.5) + 2;
    const percentage = Math.round((count / effectiveTotal) * 100);

    const messageList = prov.encouragingMessages || [];
    const msgIndex = (seed + idx) % (messageList.length || 1);
    const recentWarmth = messageList[msgIndex] || 'Gửi ngọn đèn ấm áp kết nối từ trường!';

    return {
      provinceId: prov.id,
      provinceName: prov.name,
      region: prov.region,
      lat: prov.lat,
      lng: prov.lng,
      verifiedCount: count,
      lanternsLitCount: lanternCount,
      percentage: Math.min(100, Math.max(1, percentage)),
      recentWarmth
    };
  });

  // Sort descending by verifiedCount
  distribution.sort((a, b) => b.verifiedCount - a.verifiedCount);

  return {
    schoolId,
    schoolName,
    totalVerifiedMembers: effectiveTotal,
    centerLocation: { lat: centerLat, lng: centerLng, name: centerName },
    distribution
  };
}
