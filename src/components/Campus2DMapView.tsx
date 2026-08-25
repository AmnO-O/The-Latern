import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { 
  Search, 
  X, 
  MapPin, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Globe2, 
  GraduationCap, 
  Building2, 
  Sparkles, 
  Loader2, 
  Trash2,
  Users,
  Flame,
  Star,
  Layers,
  ArrowRight,
  ChevronDown,
  Filter,
  Check,
  Mail,
  EyeOff,
  Eye
} from 'lucide-react';
import { School } from '../types';
import { 
  SchoolLocationItem, 
  FAMOUS_VIETNAM_SCHOOLS, 
  searchLocalSchools, 
  geocodeAddressOnline 
} from '../data/schoolCoordinates';
import { VIETNAM_PROVINCES, ProvinceDistribution } from '../data/geoData';

interface Campus2DMapViewProps {
  schools?: School[];
  currentSchool?: School;
  onSelectSchool?: (school: School) => void;
  onBackToFeed?: () => void;
  isDark?: boolean;
}

interface ActivePinnedLocation {
  id: string;
  name: string;
  type: 'university' | 'highschool' | 'other';
  address: string;
  city?: string;
  lat: number;
  lng: number;
  matchedSchool?: School;
  rating?: number;
  letterCount?: number;
}

// Global Open-Source Tile Providers (100% Free, High Resolution, Worldwide)
const MAP_PROVIDERS = {
  cartoVoyager: {
    name: 'Bản Đồ Quốc Tế',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  },
  esriWorldImagery: {
    name: 'Ảnh Vệ Tinh',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    subdomains: 'abcd',
    maxZoom: 18
  },
  cartoDark: {
    name: 'Nền Tối',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }
};

type MapProviderKey = keyof typeof MAP_PROVIDERS;

// Category Filter Definitions
type CategoryFilterKey = 'all' | 'none' | 'university' | 'highschool' | 'hot' | 'hcm' | 'hanoi' | 'danang' | 'cantho' | 'islands';

// Permanent Sovereign Territory Points (Hoàng Sa, Trường Sa, Phú Quốc, Côn Đảo)
export interface SovereignTerritoryPoint {
  id: string;
  name: string;
  subName: string;
  lat: number;
  lng: number;
  coordinatesLabel: string;
  description: string;
  quote: string;
}

export const SOVEREIGN_TERRITORY_POINTS: SovereignTerritoryPoint[] = [
  {
    id: 'vn-hoangsa-sovereignty',
    name: 'Quần đảo Hoàng Sa',
    subName: '(TP. Đà Nẵng)',
    lat: 16.5367,
    lng: 112.0333,
    coordinatesLabel: "16°32'N, 112°02'E",
    description: 'Quần đảo Hoàng Sa thiêng liêng - phần lãnh thổ máu thịt không thể tách rời của Tổ quốc Việt Nam 🇻🇳',
    quote: 'Hoàng Sa - Trường Sa luôn trong trái tim mỗi người con đất Việt.'
  },
  {
    id: 'vn-truongsa-sovereignty',
    name: 'Quần đảo Trường Sa',
    subName: '(Khánh Hòa)',
    lat: 8.6444,
    lng: 111.9197,
    coordinatesLabel: "8°38'N, 111°55'E",
    description: 'Quần đảo Trường Sa kiên cường nơi đầu sóng ngọn gió - chủ quyền biển đảo thiêng liêng của Việt Nam 🇻🇳',
    quote: 'Trường Sa vì cả nước, cả nước vì Trường Sa! 🇻🇳'
  },
  {
    id: 'vn-phuquoc-sovereignty',
    name: 'Đảo Phú Quốc',
    subName: '(Kiên Giang)',
    lat: 10.2289,
    lng: 103.9572,
    coordinatesLabel: "10°13'N, 103°57'E",
    description: 'Đảo ngọc Phú Quốc tươi đẹp phía Tây Nam của Tổ quốc 🇻🇳',
    quote: 'Vùng biển đảo trù phú nơi cực Nam Tổ quốc.'
  },
  {
    id: 'vn-condao-sovereignty',
    name: 'Côn Đảo',
    subName: '(Bà Rịa - Vũng Tàu)',
    lat: 8.6835,
    lng: 106.6074,
    coordinatesLabel: "8°41'N, 106°36'E",
    description: 'Quần đảo tiền tiêu phía Đông Nam với truyền thống anh hùng bất khuất 🇻🇳',
    quote: 'Vùng đất thiêng liêng sáng ngời tinh thần yêu nước bất diệt.'
  }
];

interface CategoryFilterItem {
  id: CategoryFilterKey;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  center?: [number, number];
  zoom?: number;
}

const CATEGORY_FILTERS: CategoryFilterItem[] = [
  { id: 'all', label: 'Tất cả các trường', shortLabel: 'Tất cả trường', icon: <Building2 className="w-4 h-4 text-slate-300" /> },
  { id: 'islands', label: 'Hoàng Sa & Trường Sa 🇻🇳', shortLabel: 'Hoàng Sa - Trường Sa 🇻🇳', icon: <MapPin className="w-4 h-4 text-amber-400" />, center: [12.8, 112.5], zoom: 6 },
  { id: 'hcm', label: 'TP. Hồ Chí Minh', shortLabel: 'TP.HCM', icon: <MapPin className="w-4 h-4 text-emerald-400" />, center: [10.7769, 106.6953], zoom: 13 },
  { id: 'hanoi', label: 'Thủ đô Hà Nội', shortLabel: 'Hà Nội', icon: <MapPin className="w-4 h-4 text-amber-400" />, center: [21.0285, 105.8542], zoom: 13 },
  { id: 'danang', label: 'Đà Nẵng & Miền Trung', shortLabel: 'Miền Trung', icon: <MapPin className="w-4 h-4 text-cyan-400" />, center: [16.0544, 108.2022], zoom: 13 },
  { id: 'cantho', label: 'Cần Thơ & Miền Tây', shortLabel: 'Miền Tây', icon: <MapPin className="w-4 h-4 text-teal-400" />, center: [10.0452, 105.7469], zoom: 13 },
  { id: 'university', label: 'Đại học & Học viện', shortLabel: 'Đại học', icon: <GraduationCap className="w-4 h-4 text-amber-400" /> },
  { id: 'highschool', label: 'THPT Chuyên', shortLabel: 'THPT Chuyên', icon: <Building2 className="w-4 h-4 text-sky-400" /> },
  { id: 'hot', label: 'Top Sôi Nổi Nhất 🔥', shortLabel: 'Top Sôi Nổi', icon: <Flame className="w-4 h-4 text-rose-400" /> },
  { id: 'none', label: 'Tắt / Ẩn tất cả điểm trường', shortLabel: 'Tắt hiển thị', icon: <EyeOff className="w-4 h-4 text-rose-400" /> }
];

export const Campus2DMapView: React.FC<Campus2DMapViewProps> = ({
  schools = [],
  onSelectSchool,
  onBackToFeed,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const schoolMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const distributionLayerRef = useRef<L.LayerGroup | null>(null);
  const permanentSovereigntyLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeProviderKey, setActiveProviderKey] = useState<MapProviderKey>('cartoVoyager');
  const [activeCategory, setActiveCategory] = useState<CategoryFilterKey>('hcm');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);
  const [showDistribution, setShowDistribution] = useState<boolean>(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  // Lookup Modal State
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SchoolLocationItem[]>([]);
  const [pinnedLocation, setPinnedLocation] = useState<ActivePinnedLocation | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Preset Tags for Search
  const QUICK_SEARCH_CHIPS = [
    { label: '🇻🇳 Hoàng Sa', query: 'Hoàng Sa' },
    { label: '🇻🇳 Trường Sa', query: 'Trường Sa' },
    { label: 'ĐH Bách Khoa', query: 'Bách Khoa' },
    { label: 'ĐH KHTN', query: 'Khoa học Tự nhiên' },
    { label: 'ĐH Kinh Tế', query: 'Kinh tế' },
    { label: 'ĐH Y Dược', query: 'Y Dược' },
    { label: 'ĐH Ngoại Thương', query: 'Ngoại Thương' },
    { label: 'THPT Chuyên', query: 'Chuyên' }
  ];

  // Augmented Schools with ratings & statistics
  const enrichedSchools: SchoolLocationItem[] = useMemo(() => {
    return FAMOUS_VIETNAM_SCHOOLS.map((school, index) => {
      const baseSeed = (school.name.length * 17 + index * 31) % 100;
      const calculatedRating = +(9.0 + (baseSeed % 100) / 100).toFixed(2);
      const calculatedLetters = 300 + (baseSeed * 24);
      const isHot = index % 3 === 0 || calculatedRating >= 9.7;

      return {
        ...school,
        rating: school.rating || (calculatedRating > 9.95 ? 9.95 : calculatedRating),
        letterCount: school.letterCount || calculatedLetters,
        isHot: school.isHot ?? isHot
      };
    });
  }, []);

  // Filtered Schools based on active category
  const visibleSchools = useMemo(() => {
    switch (activeCategory) {
      case 'none':
        return [];
      case 'university':
        return enrichedSchools.filter(s => s.type === 'university');
      case 'highschool':
        return enrichedSchools.filter(s => s.type === 'highschool');
      case 'hot':
        return enrichedSchools.filter(s => s.isHot);
      case 'hcm':
        return enrichedSchools.filter(s => s.city.includes('Hồ Chí Minh') || s.city.includes('Thủ Đức'));
      case 'hanoi':
        return enrichedSchools.filter(s => s.city.includes('Hà Nội'));
      case 'danang':
        return enrichedSchools.filter(s => s.city.includes('Đà Nẵng') || s.city.includes('Huế') || s.city.includes('Quảng'));
      case 'cantho':
        return enrichedSchools.filter(s => s.city.includes('Cần Thơ') || s.city.includes('An Giang') || s.city.includes('Vĩnh Long'));
      case 'islands':
        return enrichedSchools.filter(s => 
          s.id.includes('hs-') || 
          s.id.includes('truongsa') || 
          s.id.includes('songtutay') || 
          s.id.includes('sinhton') || 
          s.city.includes('Hoàng Sa') || 
          s.city.includes('Trường Sa') || 
          s.name.includes('Hoàng Sa') || 
          s.name.includes('Trường Sa')
        );
      case 'all':
      default:
        return enrichedSchools;
    }
  }, [enrichedSchools, activeCategory]);

  const currentFilterItem = useMemo(() => {
    return CATEGORY_FILTERS.find(c => c.id === activeCategory) || CATEGORY_FILTERS[0];
  }, [activeCategory]);

  // Clean Badge Pin Icon WITHOUT permanent text underneath
  const createModernBadgeIcon = useCallback((school: SchoolLocationItem, isSelected: boolean = false) => {
    const isUni = school.type === 'university';
    const isHot = school.isHot;
    const isIsland = 
      school.id.includes('hs-') || 
      school.id.includes('truongsa') || 
      school.id.includes('songtutay') || 
      school.id.includes('sinhton') || 
      school.name.includes('Hoàng Sa') || 
      school.name.includes('Trường Sa');
    
    const badgeBg = isIsland
      ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
      : isHot 
        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
        : isUni 
          ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' 
          : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';

    const shadowRingColor = isIsland
      ? 'rgba(245, 158, 11, 0.65)'
      : isHot 
        ? 'rgba(239, 68, 68, 0.45)' 
        : isUni 
          ? 'rgba(249, 115, 22, 0.45)' 
          : 'rgba(2, 132, 199, 0.45)';
    const ratingLabel = isIsland ? '🇻🇳 VN' : (school.rating || 9.8).toFixed(school.rating && school.rating % 1 === 0 ? 1 : 2);

    return L.divIcon({
      className: 'modern-school-badge-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
          <!-- Translucent Ground Ripple Shadow -->
          <div class="pin-ground-shadow" style="
            position: absolute;
            bottom: -6px;
            width: 36px;
            height: 16px;
            border-radius: 50%;
            background: ${shadowRingColor};
            filter: blur(4px);
            z-index: 1;
          "></div>

          <!-- Main Pin Badge Container -->
          <div style="
            position: relative;
            z-index: 3;
            display: flex;
            flex-direction: column;
            align-items: center;
            filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45));
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            ${isSelected ? 'transform: scale(1.18);' : ''}
          ">
            <!-- Upper Circle with Icon -->
            <div style="
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: ${badgeBg};
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.4);
            ">
              <svg style="width: 20px; height: 20px;" fill="${isIsland ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                ${isIsland
                  ? '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
                  : isUni 
                    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>'
                    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>'
                }
              </svg>
            </div>

            <!-- Attached Bottom Pill with Score / Rating -->
            <div style="
              margin-top: -8px;
              padding: 1.5px 7.5px;
              background: #ffffff;
              border: 1.5px solid #f1f5f9;
              border-radius: 9999px;
              color: #0f172a;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: -0.2px;
              box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
              display: flex;
              align-items: center;
              gap: 2px;
              white-space: nowrap;
            ">
              <span>${ratingLabel}</span>
            </div>
          </div>
        </div>
      `,
      iconSize: [40, 52],
      iconAnchor: [20, 52]
    });
  }, []);

  // Helper to create glowing lantern distribution dot icon
  const createDistributionIcon = (province: ProvinceDistribution, userCount: number) => {
    let coreSize = 16;
    let haloSize = 36;
    let fontSize = 10;
    let label = `${userCount >= 1000 ? (userCount / 1000).toFixed(1) + 'k' : userCount}`;

    if (province.baseWeight >= 0.25) {
      coreSize = 30;
      haloSize = 60;
      fontSize = 11;
    } else if (province.baseWeight >= 0.08) {
      coreSize = 24;
      haloSize = 48;
      fontSize = 10;
    } else if (province.baseWeight >= 0.04) {
      coreSize = 19;
      haloSize = 38;
      fontSize = 9;
    }

    return L.divIcon({
      className: 'custom-distribution-heat-dot',
      html: `
        <div style="
          position: relative;
          width: ${haloSize}px;
          height: ${haloSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <!-- Outermost Light Wave 1 -->
          <div class="glow-outer-wave" style="
            position: absolute;
            width: ${haloSize}px;
            height: ${haloSize}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(245, 158, 11, 0) 75%);
            pointer-events: none;
          "></div>

          <!-- Outermost Light Wave 2 -->
          <div class="glow-outer-wave-delayed" style="
            position: absolute;
            width: ${haloSize * 0.85}px;
            height: ${haloSize * 0.85}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0) 70%);
            pointer-events: none;
          "></div>

          <!-- Inner Core Glowing Sphere -->
          <div class="glow-core-dot" style="
            position: relative;
            z-index: 2;
            width: ${coreSize}px;
            height: ${coreSize}px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%);
            border: 1.5px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #451a03;
            font-size: ${fontSize}px;
            font-weight: 800;
            box-shadow: 0 0 16px 4px rgba(245, 158, 11, 0.7);
          ">
            ${coreSize >= 20 ? `<span>${label}</span>` : ''}
          </div>

          <!-- Subtle City Label -->
          <div style="
            position: absolute;
            top: 100%;
            margin-top: 2px;
            padding: 2px 6px;
            background: rgba(15, 23, 42, 0.88);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 6px;
            color: #fef08a;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            backdrop-filter: blur(4px);
            z-index: 3;
          ">
            ${province.name.split('(')[0].trim()}
          </div>
        </div>
      `,
      iconSize: [haloSize, haloSize],
      iconAnchor: [haloSize / 2, haloSize / 2]
    });
  };

  // Helper to create School Detail Popup HTML element with active buttons
  const createSchoolPopupElement = useCallback((school: SchoolLocationItem) => {
    const isUni = school.type === 'university';
    const isHigh = school.type === 'highschool';
    const matched = schools.find(s => 
      s.name.toLowerCase() === school.name.toLowerCase() || 
      (school.shortName && s.name.toLowerCase().includes(school.shortName.toLowerCase()))
    );

    const popupContainer = document.createElement('div');
    popupContainer.className = 'school-marker-popup-content';
    popupContainer.innerHTML = `
      <div style="
        min-width: 250px;
        max-width: 300px;
        padding: 14px 16px;
        font-family: inherit;
        color: #f1f5f9;
        background: #090d16;
        border: 1px solid rgba(245, 158, 11, 0.45);
        border-radius: 20px;
        box-shadow: 0 16px 40px -4px rgba(0, 0, 0, 0.85);
      ">
        <!-- Top header row with badges -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <span style="
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 2.5px 8px;
            border-radius: 9999px;
            background: ${isUni ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)'};
            color: ${isUni ? '#fbbf24' : '#38bdf8'};
            border: 1px solid ${isUni ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'};
          ">
            ${isUni ? 'Đại học' : isHigh ? 'THPT Chuyên' : 'Điểm trường'}
          </span>

          <div style="
            display: inline-flex;
            align-items: center;
            gap: 3px;
            padding: 2px 7px;
            background: #f59e0b;
            color: #020617;
            font-size: 11px;
            font-weight: 800;
            border-radius: 9999px;
          ">
            ★ ${(school.rating || 9.8).toFixed(1)}
          </div>
        </div>

        <!-- School Name -->
        <div style="font-weight: 800; font-size: 14px; color: #ffffff; line-height: 1.35; margin-bottom: 4px;">
          ${school.name}
        </div>

        <!-- School Address -->
        <div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 10px; line-height: 1.35; display: flex; align-items: flex-start; gap: 4px;">
          <span style="color: #f59e0b; shrink: 0;">📍</span>
          <span>${school.address}</span>
        </div>

        <!-- Statistics snippet -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: rgba(30, 41, 59, 0.6);
          border-radius: 12px;
          font-size: 11px;
          margin-bottom: 10px;
          border: 1px solid rgba(51, 65, 85, 0.4);
        ">
          <span style="color: #cbd5e1;">Hoạt động:</span>
          <span style="color: #fef08a; font-weight: 700;">${(school.letterCount || 850).toLocaleString('vi-VN')} bức thư</span>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 6px; align-items: center; padding-top: 4px;">
          <button id="popup-btn-view-feed" style="
            flex: 1;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 700;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #020617;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
            transition: transform 0.15s;
          ">
            <span>Vào hòm thư trường</span>
            <span style="font-size: 14px;">➔</span>
          </button>
        </div>
      </div>
    `;

    const btnViewFeed = popupContainer.querySelector('#popup-btn-view-feed');
    if (btnViewFeed) {
      btnViewFeed.addEventListener('click', () => {
        if (matched && onSelectSchool) {
          onSelectSchool(matched);
          if (onBackToFeed) onBackToFeed();
        } else if (onSelectSchool) {
          const fallbackSchool: School = {
            id: `school-${school.id}`,
            name: school.name,
            slug: school.name.toLowerCase().replace(/\s+/g, '-'),
            type: school.type === 'highschool' ? 'highschool' : 'university',
            letterCount: school.letterCount || 0,
            newCount: 0,
            verifiedCount: 0,
            location: school.city || school.address
          };
          onSelectSchool(fallbackSchool);
          if (onBackToFeed) onBackToFeed();
        }
      });
    }

    return popupContainer;
  }, [onBackToFeed, onSelectSchool, schools]);

  // Remove Active Target Pin
  const handleClearPin = useCallback(() => {
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setPinnedLocation(null);
  }, []);

  // Drop and Focus Pin on Map with Popup open
  const handleDropPin = useCallback((pinItem: ActivePinnedLocation) => {
    setPinnedLocation(pinItem);

    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    const itemAsSchool: SchoolLocationItem = {
      id: pinItem.id,
      name: pinItem.name,
      type: pinItem.type,
      address: pinItem.address,
      city: pinItem.city || 'Việt Nam',
      lat: pinItem.lat,
      lng: pinItem.lng,
      rating: pinItem.rating || 9.85,
      letterCount: pinItem.letterCount || 1200,
      isHot: true
    };

    const icon = createModernBadgeIcon(itemAsSchool, true);
    const marker = L.marker([pinItem.lat, pinItem.lng], { icon }).addTo(map);
    markerRef.current = marker;

    const popupElement = createSchoolPopupElement(itemAsSchool);

    marker.bindPopup(popupElement, {
      offset: [0, -50],
      closeButton: false,
      autoPan: true,
      className: 'clean-dark-leaflet-popup'
    });

    map.flyTo([pinItem.lat, pinItem.lng], 16, {
      duration: 1.2,
      easeLinearity: 0.25
    });

    // Open popup after flying
    setTimeout(() => {
      marker.openPopup();
    }, 400);
  }, [createModernBadgeIcon, createSchoolPopupElement]);

  // Render School Markers on the Map (Clicking any pin opens the rich popup)
  const renderSchoolMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (schoolMarkersGroupRef.current) {
      map.removeLayer(schoolMarkersGroupRef.current);
      schoolMarkersGroupRef.current = null;
    }

    if (showDistribution) return;

    const layerGroup = L.layerGroup();

    visibleSchools.forEach((school) => {
      const isPinned = pinnedLocation?.id === school.id;
      const icon = createModernBadgeIcon(school, isPinned);
      const marker = L.marker([school.lat, school.lng], { icon });

      // Attach rich popup directly to each marker
      const popupElement = createSchoolPopupElement(school);
      marker.bindPopup(popupElement, {
        offset: [0, -50],
        closeButton: false,
        autoPan: true,
        className: 'clean-dark-leaflet-popup'
      });

      // On marker click: fly smoothly & open popup
      marker.on('click', () => {
        map.flyTo([school.lat, school.lng], Math.max(map.getZoom(), 15), {
          duration: 0.8
        });
      });

      marker.addTo(layerGroup);
    });

    layerGroup.addTo(map);
    schoolMarkersGroupRef.current = layerGroup;
  }, [createModernBadgeIcon, createSchoolPopupElement, pinnedLocation, showDistribution, visibleSchools]);

  // Render Province Distribution Glow Heatmap
  const renderDistributionDots = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (distributionLayerRef.current) {
      map.removeLayer(distributionLayerRef.current);
      distributionLayerRef.current = null;
    }

    if (!showDistribution) return;

    const layerGroup = L.layerGroup();
    const TOTAL_USERS_BASE = 16800;

    VIETNAM_PROVINCES.forEach((province) => {
      const userCount = Math.round(province.baseWeight * TOTAL_USERS_BASE);
      const icon = createDistributionIcon(province, userCount);
      const marker = L.marker([province.lat, province.lng], { icon });

      const randomMsg = province.encouragingMessages[0] || 'Cùng thắp sáng những ước mơ và niềm tin!';
      const popupDiv = document.createElement('div');
      popupDiv.className = 'province-distribution-popup';
      popupDiv.innerHTML = `
        <div style="
          min-width: 230px;
          max-width: 280px;
          padding: 12px 14px;
          font-family: inherit;
          color: #f8fafc;
          background: #0f172a;
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 18px;
          box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.7);
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 14px; color: #fef08a;">
              ${province.name}
            </span>
            <span style="
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              background: rgba(245, 158, 11, 0.15);
              color: #fbbf24;
              border-radius: 9999px;
              border: 1px solid rgba(245, 158, 11, 0.3);
            ">
              ${province.region}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 12px; color: #e2e8f0;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: #f59e0b; color: #000; font-weight: 800; font-size: 10px;">👥</span>
            <span>Khoảng <b style="color: #f59e0b;">${userCount.toLocaleString('vi-VN')}</b> thành viên</span>
          </div>

          <div style="
            font-size: 11px;
            color: #cbd5e1;
            font-style: italic;
            background: rgba(30, 41, 59, 0.8);
            padding: 8px 10px;
            border-radius: 10px;
            border-left: 2px solid #f59e0b;
            line-height: 1.4;
            margin-bottom: 8px;
          ">
            "${randomMsg}"
          </div>

          <button id="zoom-to-province-${province.id}" style="
            width: 100%;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: 700;
            background: #1e293b;
            color: #38bdf8;
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            transition: all 0.2s;
          ">
            <span>Phóng to khu vực này 🔍</span>
          </button>
        </div>
      `;

      const zoomBtn = popupDiv.querySelector(`#zoom-to-province-${province.id}`);
      if (zoomBtn) {
        zoomBtn.addEventListener('click', () => {
          map.flyTo([province.lat, province.lng], 12, { duration: 1.2 });
        });
      }

      marker.bindPopup(popupDiv, {
        offset: [0, -10],
        closeButton: false,
        autoPan: true,
        className: 'clean-dark-leaflet-popup'
      });

      marker.addTo(layerGroup);
    });

    layerGroup.addTo(map);
    distributionLayerRef.current = layerGroup;
  }, [showDistribution]);

  // Permanent Sovereign Territory Marker Icon (chấm nhỏ và chữ thanh mảnh đồng đều với nhãn bản đồ)
  const createSovereignTerritoryIcon = useCallback((point: SovereignTerritoryPoint) => {
    return L.divIcon({
      className: 'sovereign-territory-marker-wrapper',
      html: `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          user-select: none;
        ">
          <!-- Small subtle dot matching map provincial markers -->
          <div style="
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #b91c1c;
            border: 1px solid #ffffff;
            box-shadow: 0 0 1px 1px rgba(0, 0, 0, 0.3);
          "></div>

          <!-- Clean subtle text label like map place names -->
          <div style="
            margin-top: 2px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            white-space: nowrap;
          ">
            <span style="
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 10.5px;
              font-weight: 600;
              color: #1e293b;
              text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 3px #fff, 0 0 2px #fff;
              line-height: 1.15;
              letter-spacing: -0.1px;
            ">
              ${point.name}
            </span>
            <span style="
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 9px;
              font-weight: 500;
              color: #475569;
              text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 2px #fff;
              line-height: 1.1;
            ">
              ${point.subName}
            </span>
          </div>
        </div>
      `,
      iconSize: [120, 32],
      iconAnchor: [60, 3]
    });
  }, []);

  // Render Permanent Sovereign Territory Markers (Hoàng Sa, Trường Sa, Phú Quốc, Côn Đảo - Never Removed)
  const renderPermanentSovereigntyMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (permanentSovereigntyLayerRef.current) {
      map.removeLayer(permanentSovereigntyLayerRef.current);
      permanentSovereigntyLayerRef.current = null;
    }

    const layerGroup = L.layerGroup();

    SOVEREIGN_TERRITORY_POINTS.forEach((point) => {
      const icon = createSovereignTerritoryIcon(point);
      const marker = L.marker([point.lat, point.lng], { 
        icon,
        zIndexOffset: 1200 // Always visible above other markers
      });

      const popupDiv = document.createElement('div');
      popupDiv.className = 'sovereignty-island-popup';
      popupDiv.innerHTML = `
        <div style="
          min-width: 250px;
          max-width: 300px;
          padding: 14px 16px;
          color: #f8fafc;
          background: #0f172a;
          border: 1.5px solid #ef4444;
          border-radius: 18px;
          box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.25);
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-weight: 900; font-size: 13.5px; color: #fef08a; letter-spacing: 0.2px;">
              ${point.name}
            </span>
            <span style="
              font-size: 10px;
              font-weight: 800;
              padding: 2px 6px;
              background: rgba(239, 68, 68, 0.2);
              color: #fca5a5;
              border-radius: 9999px;
              border: 1px solid rgba(239, 68, 68, 0.4);
            ">
              🇻🇳 VIỆT NAM
            </span>
          </div>

          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">
            📍 ${point.subName} • Tọa độ: ${point.coordinatesLabel}
          </div>

          <div style="
            font-size: 11.5px;
            color: #e2e8f0;
            line-height: 1.45;
            margin-bottom: 8px;
          ">
            ${point.description}
          </div>

          <div style="
            font-size: 11px;
            color: #fef08a;
            font-style: italic;
            background: rgba(30, 41, 59, 0.9);
            padding: 8px 10px;
            border-radius: 10px;
            border-left: 3px solid #ef4444;
            line-height: 1.4;
            margin-bottom: 8px;
          ">
            "${point.quote}"
          </div>

          <button id="zoom-to-island-${point.id}" style="
            width: 100%;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: 700;
            background: #1e293b;
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.4);
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            transition: all 0.2s;
          ">
            <span>Phóng to vị trí này 🔍</span>
          </button>
        </div>
      `;

      const zoomBtn = popupDiv.querySelector(`#zoom-to-island-${point.id}`);
      if (zoomBtn) {
        zoomBtn.addEventListener('click', () => {
          map.flyTo([point.lat, point.lng], 9, { duration: 1.2 });
        });
      }

      marker.bindPopup(popupDiv, {
        offset: [0, -10],
        closeButton: false,
        autoPan: true,
        className: 'clean-dark-leaflet-popup'
      });

      marker.addTo(layerGroup);
    });

    layerGroup.addTo(map);
    permanentSovereigntyLayerRef.current = layerGroup;
  }, [createSovereignTerritoryIcon]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default centered on TP.HCM
    const initialLat = 10.7769;
    const initialLng = 106.6953;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true
    });

    const provider = MAP_PROVIDERS[activeProviderKey];
    const tiles = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains,
      maxZoom: provider.maxZoom
    }).addTo(map);

    tileLayerRef.current = tiles;
    mapInstanceRef.current = map;

    // Immediately render permanent sovereignty markers
    renderPermanentSovereigntyMarkers();

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [renderPermanentSovereigntyMarkers]);

  // Update Tile Layer when Provider changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const provider = MAP_PROVIDERS[activeProviderKey];

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newTiles = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains,
      maxZoom: provider.maxZoom
    }).addTo(mapInstanceRef.current);
    newTiles.bringToBack();
    tileLayerRef.current = newTiles;
  }, [activeProviderKey]);

  // Re-render markers when visible schools or mode changes
  useEffect(() => {
    renderSchoolMarkers();
  }, [renderSchoolMarkers]);

  // Update Distribution Layer
  useEffect(() => {
    renderDistributionDots();
  }, [renderDistributionDots, showDistribution]);

  // Handle Category Filter Selection
  const handleSelectCategory = (cat: CategoryFilterItem) => {
    setActiveCategory(cat.id);
    setShowDistribution(false);
    setIsFilterDropdownOpen(false);

    if (cat.center && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(cat.center, cat.zoom || 13, { duration: 1.2 });
    } else if (cat.id === 'all' && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([16.0, 107.5], 6.2, { duration: 1.4 });
    }
  };

  // Perform search (Local Database + Online Geocoding)
  const handleExecuteSearch = async (queryText: string) => {
    if (!queryText || !queryText.trim()) {
      setSearchResults(FAMOUS_VIETNAM_SCHOOLS.slice(0, 8));
      return;
    }

    setIsSearching(true);

    const localMatches = searchLocalSchools(queryText);

    const appSchoolMatches: SchoolLocationItem[] = schools
      .filter(s => s.name.toLowerCase().includes(queryText.toLowerCase()) || s.location?.toLowerCase().includes(queryText.toLowerCase()))
      .map(s => {
        const coords = FAMOUS_VIETNAM_SCHOOLS.find(k => k.name.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(k.shortName?.toLowerCase() || '___'));
        return {
          id: `app-school-${s.id}`,
          name: s.name,
          type: s.type || 'university',
          address: s.location || 'Việt Nam',
          city: s.location || 'Việt Nam',
          lat: coords ? coords.lat : 10.7628,
          lng: coords ? coords.lng : 106.6825,
          description: `Đã có ${s.letterCount || 0} bức thư trên hệ thống`
        };
      });

    const combinedLocal = [...localMatches];
    appSchoolMatches.forEach(appS => {
      if (!combinedLocal.some(c => c.name.toLowerCase() === appS.name.toLowerCase())) {
        combinedLocal.push(appS);
      }
    });

    setSearchResults(combinedLocal);
    setIsSearching(false);

    if (queryText.trim().length >= 2) {
      try {
        const onlineResults = await geocodeAddressOnline(queryText);
        const merged: SchoolLocationItem[] = [...combinedLocal];

        onlineResults.forEach(item => {
          if (!merged.some(m => Math.abs(m.lat - item.lat) < 0.001 && Math.abs(m.lng - item.lng) < 0.001)) {
            merged.push(item);
          }
        });

        setSearchResults(merged);
      } catch (e) {
        console.warn('Online geocode fallback:', e);
      }
    }
  };

  const handleOpenLookup = () => {
    setIsLookupOpen(true);
    setSearchQuery('');
    setSearchResults(FAMOUS_VIETNAM_SCHOOLS.slice(0, 8));
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    if (!isLookupOpen) return;
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        handleExecuteSearch(searchQuery);
      } else {
        setSearchResults(FAMOUS_VIETNAM_SCHOOLS.slice(0, 8));
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isLookupOpen]);

  const handleSelectSchoolLocation = (item: SchoolLocationItem) => {
    const matched = schools.find(s => 
      s.name.toLowerCase() === item.name.toLowerCase() || 
      (item.shortName && s.name.toLowerCase().includes(item.shortName.toLowerCase()))
    );

    const pin: ActivePinnedLocation = {
      id: item.id,
      name: item.shortName ? `${item.shortName} - ${item.name}` : item.name,
      type: item.type,
      address: item.address,
      city: item.city,
      lat: item.lat,
      lng: item.lng,
      rating: item.rating || 9.85,
      letterCount: item.letterCount || 1100,
      matchedSchool: matched
    };

    handleDropPin(pin);
    setIsLookupOpen(false);
  };

  // Map Controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleResetVietnamView = () => {
    mapInstanceRef.current?.flyTo([15.8, 107.5], 6, { duration: 1.2 });
  };

  const handleToggleDistribution = () => {
    const nextState = !showDistribution;
    setShowDistribution(nextState);
    if (nextState) {
      handleResetVietnamView();
    }
  };

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden select-none bg-[#0a0d14]">
      {/* 2D WORLD MAP CONTAINER */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full flex-1 z-0 cursor-grab active:cursor-grabbing bg-[#0f172a]"
      />

      {/* REFINED, SLEEK FLOATING TOP TOOLBAR */}
      <div className="absolute top-14 sm:top-16 left-3 right-3 sm:left-6 sm:right-6 z-20 flex items-center justify-between pointer-events-none gap-2">
        {/* Left Side: Filter Dropdown & Distribution Mode */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Elegant Category Filter Dropdown */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`h-10 px-3.5 sm:px-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold transition-all shadow-xl backdrop-blur-xl border cursor-pointer ${
                showDistribution
                  ? 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                  : activeCategory === 'none'
                    ? 'bg-slate-900/95 text-rose-300 border-rose-500/40 hover:border-rose-400'
                    : 'bg-slate-900/95 text-white border-amber-500/40 hover:border-amber-400 shadow-amber-500/10'
              }`}
            >
              {activeCategory === 'none' ? (
                <EyeOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              ) : (
                <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span>{showDistribution ? 'Chế độ phân bố' : currentFilterItem.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                activeCategory === 'none' 
                  ? 'bg-rose-950/60 text-rose-400 border-rose-800/60' 
                  : 'bg-slate-800 text-amber-300 border-slate-700'
              }`}>
                {activeCategory === 'none' ? 'Tắt' : visibleSchools.length}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Filter Dropdown Menu */}
            {isFilterDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Lọc theo khu vực & loại trường
                </div>

                <div className="max-h-72 overflow-y-auto py-1">
                  {CATEGORY_FILTERS.map((cat) => {
                    const isSelected = !showDistribution && activeCategory === cat.id;
                    const isNoneItem = cat.id === 'none';

                    return (
                      <React.Fragment key={cat.id}>
                        {isNoneItem && <div className="h-px bg-slate-800/80 my-1 mx-2" />}
                        <button
                          onClick={() => handleSelectCategory(cat)}
                          className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected 
                              ? isNoneItem
                                ? 'bg-rose-500/20 text-rose-300 font-bold border-l-2 border-rose-400'
                                : 'bg-amber-500/20 text-amber-300 font-bold border-l-2 border-amber-400' 
                              : isNoneItem
                                ? 'text-rose-400/90 hover:bg-rose-950/40 hover:text-rose-300'
                                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {cat.icon}
                            <span>{cat.label}</span>
                          </div>
                          {isSelected && (
                            <Check className={`w-3.5 h-3.5 shrink-0 ${isNoneItem ? 'text-rose-400' : 'text-amber-400'}`} />
                          )}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Phân Bố Người Dùng Toggle Button */}
          <button
            onClick={handleToggleDistribution}
            className={`h-10 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xl border shadow-xl ${
              showDistribution
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/25 border-amber-300'
                : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:text-white hover:bg-slate-800'
            }`}
            title="Bật/tắt phân bố người dùng toàn quốc"
          >
            <Users className={`w-3.5 h-3.5 ${showDistribution ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">Phân bố</span>
            {showDistribution && (
              <span className="w-2 h-2 rounded-full bg-emerald-950 ring-2 ring-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {/* Right Side: Tra cứu & Clear Pin */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Active Pin Notice with quick clear */}
          {pinnedLocation && (
            <button
              onClick={handleClearPin}
              className="h-10 px-3 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xl shadow-xl transition-all cursor-pointer"
              title="Bỏ ghim trường hiện tại"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Bỏ ghim</span>
            </button>
          )}

          {/* Tra Cứu Trường Button */}
          <button
            onClick={handleOpenLookup}
            className="h-10 px-3.5 sm:px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl hover:shadow-amber-500/25 active:scale-95 transition-all cursor-pointer border border-amber-400/80"
          >
            <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Tra cứu trường</span>
          </button>
        </div>
      </div>

      {/* LOOKUP MODAL DIALOG */}
      {isLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Tra cứu trường & Vị trí</h3>
                  <p className="text-xs text-slate-400">Tìm kiếm và ghim nhanh vị trí trường học trên bản đồ</p>
                </div>
              </div>

              <button
                onClick={() => setIsLookupOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Input Box */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col gap-3">
              <div className="flex items-center w-full bg-slate-900 border border-slate-700 rounded-2xl px-3.5 py-2.5 shadow-inner focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <div className="pr-2.5 text-amber-400 flex items-center justify-center">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </div>

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập tên trường, tên viết tắt (VD: Bách Khoa, KHTN, Y Dược, NEU...)"
                  className="w-full text-sm text-white placeholder-slate-400 bg-transparent outline-none font-medium"
                />

                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults(FAMOUS_VIETNAM_SCHOOLS.slice(0, 8));
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Search Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Gợi ý:</span>
                {QUICK_SEARCH_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      setSearchQuery(chip.query);
                      handleExecuteSearch(chip.query);
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-slate-700">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{searchQuery ? `Kết quả tìm kiếm (${searchResults.length})` : 'Các trường nổi bật'}</span>
                <span className="text-amber-400 text-[11px]">Nhấp để ghim vào bản đồ</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <MapPin className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Không tìm thấy địa điểm phù hợp</p>
                  <p className="text-xs text-slate-500 mt-1">Hãy thử tìm theo tên đầy đủ, viết tắt hoặc tên đường</p>
                </div>
              ) : (
                searchResults.map((item) => {
                  const isUni = item.type === 'university';
                  const isHigh = item.type === 'highschool';

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectSchoolLocation(item)}
                      className="w-full text-left p-3 rounded-2xl hover:bg-slate-800/90 text-slate-200 transition-all flex items-start gap-3.5 cursor-pointer group border border-transparent hover:border-slate-700/80"
                    >
                      <div className={`mt-0.5 p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                        isUni 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : isHigh 
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isUni ? <GraduationCap className="w-5 h-5" /> : isHigh ? <Building2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                            {item.name}
                          </span>
                          {item.shortName && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-amber-400 border border-slate-700">
                              {item.shortName}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          <span className="line-clamp-1">{item.address}</span>
                        </p>
                      </div>

                      <div className="text-xs text-slate-500 group-hover:text-amber-400 transition-colors self-center p-1.5 rounded-lg group-hover:bg-slate-700/50">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MAP ZOOM & MAP PROVIDER CONTROLS DOCK (BOTTOM RIGHT) */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
        {/* Map Provider Picker (Mini Capsule) */}
        <div className="flex flex-col rounded-2xl bg-slate-900/90 border border-slate-700/70 backdrop-blur-md shadow-2xl overflow-hidden p-1">
          <button
            onClick={() => setActiveProviderKey('cartoVoyager')}
            className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeProviderKey === 'cartoVoyager' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
            title="Bản đồ Quốc tế"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveProviderKey('esriWorldImagery')}
            className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeProviderKey === 'esriWorldImagery' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
            title="Ảnh vệ tinh"
          >
            <Globe2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveProviderKey('cartoDark')}
            className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeProviderKey === 'cartoDark' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
            title="Nền tối"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Reset View Controls */}
        <div className="flex flex-col rounded-2xl bg-slate-900/90 border border-slate-700/70 backdrop-blur-md shadow-2xl overflow-hidden p-1">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-700/60 my-0.5" />
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-700/60 my-0.5" />
          <button
            onClick={handleResetVietnamView}
            className="p-2 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Đặt lại góc nhìn toàn cảnh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
