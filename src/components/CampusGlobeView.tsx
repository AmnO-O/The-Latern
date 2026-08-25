import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  Compass, 
  ArrowLeft, 
  Map, 
  Globe, 
  Sun, 
  Moon,
  RotateCcw
} from 'lucide-react';
import { School, UserState, Post } from '../types';
import { Campus2DMapView } from './Campus2DMapView';

interface CampusGlobeViewProps {
  schools?: School[];
  selectedSchool?: School;
  posts?: Post[];
  userState?: UserState;
  theme?: 'dark' | 'light';
  onSelectSchool?: (school: School) => void;
  onBackToFeed: () => void;
  openVerify?: () => void;
  openComposer?: () => void;
}

// URLs for NASA Satellite Imagery & Standard GeoJSON World Country Boundaries
const SATELLITE_NIGHT_URL = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
const SATELLITE_DAY_URL = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const SATELLITE_TOPOLOGY_URL = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
const COUNTRIES_GEOJSON_URL = 'https://unpkg.com/three-globe/example/country-polygons/ne_110m_admin_0_countries.json';

export const CampusGlobeView: React.FC<CampusGlobeViewProps> = ({
  schools = [],
  selectedSchool,
  onSelectSchool,
  theme,
  onBackToFeed
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [dimensionMode, setDimensionMode] = useState<'3d' | '2d'>('3d');
  const [globeTextureMode, setGlobeTextureMode] = useState<'night' | 'day'>('night');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const isAutoRotatingRef = useRef<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [countriesData, setCountriesData] = useState<any[]>([]);

  // Keep isAutoRotatingRef in sync
  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  // Dark theme detection
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (theme) return theme === 'dark';
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (theme) {
      setIsDark(theme === 'dark');
    } else {
      const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
      const observer = new MutationObserver(checkDark);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, [theme]);

  // Fetch official Natural Earth 110m GeoJSON Country Boundaries
  useEffect(() => {
    let isMounted = true;
    fetch(COUNTRIES_GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data && data.features) {
          setCountriesData(data.features);
        }
      })
      .catch(err => {
        console.warn('Country GeoJSON fetch fallback:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // ThreeJS Scene State Refs - Starting centered on Vietnam: lat: 16°N, lng: 107.5°E
  const globeRef = useRef<ThreeGlobe | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  const targetRotationRef = useRef<{ x: number; y: number }>({ 
    x: 16.0 * (Math.PI / 180), 
    y: -107.5 * (Math.PI / 180) 
  });
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Smooth camera/rotation to exact coordinates
  const flyToCoordinates = useCallback((lat: number, lng: number) => {
    targetRotationRef.current = {
      x: Math.max(-Math.PI / 2.4, Math.min(Math.PI / 2.4, lat * (Math.PI / 180))),
      y: -lng * (Math.PI / 180)
    };
    setIsAutoRotating(false);
  }, []);

  const centerVietnam = () => {
    flyToCoordinates(16.0, 107.5);
  };

  const centerGlobal = () => {
    flyToCoordinates(20.0, 45.0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(prev => !prev);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Three.js & ThreeGlobe Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 300;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.35 : 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 1.4 : 1.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, isDark ? 1.3 : 1.1);
    sunLight.position.set(120, 80, 160);
    scene.add(sunLight);

    // 2. STARFIELD BACKGROUND
    const starCount = isDark ? 600 : 200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 850;
      starPositions[i + 1] = (Math.random() - 0.5) * 850;
      starPositions[i + 2] = (Math.random() - 0.5) * 850;

      const r = Math.random();
      if (r < 0.75) {
        starColors[i] = 0.9; starColors[i + 1] = 0.9; starColors[i + 2] = 1.0;
      } else {
        starColors[i] = 1.0; starColors[i + 1] = 0.85; starColors[i + 2] = 0.45;
      }
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: isDark ? 1.1 : 0.8,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.55 : 0.25
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 3. THREE GLOBE INSTANCE
    const globe = new ThreeGlobe()
      .globeImageUrl(globeTextureMode === 'night' ? SATELLITE_NIGHT_URL : SATELLITE_DAY_URL)
      .bumpImageUrl(SATELLITE_TOPOLOGY_URL);

    globe.rotation.x = targetRotationRef.current.x;
    globe.rotation.y = targetRotationRef.current.y;
    scene.add(globe);
    globeRef.current = globe;

    // Atmospheric outer glow
    const atmosphereGeometry = new THREE.SphereGeometry(102.5, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x0284c7,
      side: THREE.BackSide,
      transparent: true,
      opacity: isDark ? 0.18 : 0.08
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globe.add(atmosphereMesh);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse & Touch Drag Controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      targetRotationRef.current.y += deltaX * 0.005;
      targetRotationRef.current.x += deltaY * 0.005;
      targetRotationRef.current.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, targetRotationRef.current.x));
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!camera) return;
      camera.position.z = Math.max(160, Math.min(460, camera.position.z + e.deltaY * 0.25));
    };

    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDraggingRef.current = true;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;
      targetRotationRef.current.y += deltaX * 0.006;
      targetRotationRef.current.x += deltaY * 0.006;
      targetRotationRef.current.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, targetRotationRef.current.x));
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (globe) {
        if (isAutoRotatingRef.current && !isDraggingRef.current) {
          targetRotationRef.current.y -= delta * 0.04;
        }

        // Smooth damping towards target rotation
        globe.rotation.y += (targetRotationRef.current.y - globe.rotation.y) * 0.09;
        globe.rotation.x += (targetRotationRef.current.x - globe.rotation.x) * 0.09;
      }

      starField.rotation.y = time * 0.0012;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
      renderer.dispose();
    };
  }, [isDark, globeTextureMode]);

  // Update Country Boundaries Polygons
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !countriesData || countriesData.length === 0) return;

    globe
      .polygonsData(countriesData)
      .polygonCapColor((d: any) => {
        const name = d.properties?.ADMIN || d.properties?.NAME || '';
        const isVN = name === 'Vietnam' || d.properties?.ISO_A2 === 'VN' || d.properties?.ISO_A3 === 'VNM';
        if (isVN) {
          return isDark ? 'rgba(251, 191, 36, 0.22)' : 'rgba(234, 179, 8, 0.2)';
        }
        return isDark ? 'rgba(26, 32, 44, 0.45)' : 'rgba(255, 255, 255, 0.3)';
      })
      .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
      .polygonStrokeColor((d: any) => {
        const name = d.properties?.ADMIN || d.properties?.NAME || '';
        const isVN = name === 'Vietnam' || d.properties?.ISO_A2 === 'VN' || d.properties?.ISO_A3 === 'VNM';
        if (isVN) {
          return '#fbbf24';
        }
        return isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
      })
      .polygonAltitude((d: any) => {
        const name = d.properties?.ADMIN || d.properties?.NAME || '';
        const isVN = name === 'Vietnam' || d.properties?.ISO_A2 === 'VN' || d.properties?.ISO_A3 === 'VNM';
        return isVN ? 0.01 : 0.005;
      });
  }, [countriesData, isDark]);

  return (
    <div className={`w-full flex-1 flex flex-col ${isDark ? 'bg-[#0a0d14] text-[#f1f5f9]' : 'bg-[#f1f5f9] text-[#0f172a]'} overflow-hidden min-h-screen relative transition-colors duration-300 select-none`}>
      {/* 2D Flat Map View */}
      {dimensionMode === '2d' && (
        <div className="relative flex-1 w-full h-screen overflow-hidden flex flex-col">
          <Campus2DMapView 
            isDark={isDark} 
            schools={schools}
            currentSchool={selectedSchool}
            onSelectSchool={onSelectSchool}
            onBackToFeed={onBackToFeed}
          />
        </div>
      )}

      {/* 3D WebGL Canvas Area */}
      <div 
        className="relative flex-1 w-full h-screen cursor-grab active:cursor-grabbing overflow-hidden"
        style={{ display: dimensionMode === '3d' ? 'block' : 'none' }}
      >
        <div ref={mountRef} className="w-full h-full" />

        {/* BOTTOM FLOATING CONTROLS: Auto Rotate, Center Vietnam, Global View */}
        <div className="absolute bottom-6 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
            <button
              onClick={() => setIsAutoRotating(prev => !prev)}
              className={`h-9 px-3.5 rounded-xl border flex items-center gap-1.5 backdrop-blur-md text-xs font-medium transition-all shadow-lg active:scale-95 cursor-pointer ${
                isAutoRotating
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                  : (isDark 
                      ? 'bg-[#121620]/90 border-slate-700/60 text-slate-300 hover:text-white' 
                      : 'bg-white/90 border-slate-200 text-slate-700 hover:text-black')
              }`}
            >
              {isAutoRotating ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isAutoRotating ? 'Dừng xoay' : 'Tự xoay'}</span>
            </button>

            <button
              onClick={centerVietnam}
              className={`h-9 px-3.5 rounded-xl border flex items-center gap-1.5 backdrop-blur-md text-xs font-medium transition-all shadow-lg active:scale-95 cursor-pointer ${
                isDark 
                  ? 'bg-[#121620]/90 border-slate-700/60 text-slate-300 hover:text-white' 
                  : 'bg-white/90 border-slate-200 text-slate-700 hover:text-black'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Việt Nam</span>
            </button>

            <button
              onClick={centerGlobal}
              className={`h-9 px-3.5 rounded-xl border flex items-center gap-1.5 backdrop-blur-md text-xs font-medium transition-all shadow-lg active:scale-95 cursor-pointer ${
                isDark 
                  ? 'bg-[#121620]/90 border-slate-700/60 text-slate-300 hover:text-white' 
                  : 'bg-white/90 border-slate-200 text-slate-700 hover:text-black'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Toàn Cầu</span>
            </button>
          </div>

          {/* Day / Night Texture Toggle */}
          <div className="pointer-events-auto">
            <button
              onClick={() => setGlobeTextureMode(prev => prev === 'night' ? 'day' : 'night')}
              className={`h-9 px-3.5 rounded-xl border flex items-center gap-1.5 backdrop-blur-md text-xs font-medium transition-all shadow-lg active:scale-95 cursor-pointer ${
                isDark 
                  ? 'bg-[#121620]/90 border-slate-700/60 text-slate-200 hover:text-white' 
                  : 'bg-white/90 border-slate-200 text-slate-700 hover:text-black'
              }`}
            >
              {globeTextureMode === 'night' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Trái Đất Ban Đêm</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trái Đất Ban Ngày</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TOP BAR: Left Actions & Dimension Switcher */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none flex-wrap gap-2">
        {/* Top Left: Expand, Back Button & 2D / 3D Dimension Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <button
            onClick={toggleFullscreen}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center backdrop-blur-md transition-all shadow-lg active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-[#121620]/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-[#1c2230]' 
                : 'bg-white/95 border-slate-200 text-slate-700 hover:text-black hover:bg-slate-50'
            }`}
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onBackToFeed}
            className={`h-10 px-3.5 rounded-xl border flex items-center gap-2 backdrop-blur-md text-xs font-semibold transition-all shadow-lg active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-[#121620]/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-[#1c2230]' 
                : 'bg-white/95 border-slate-200 text-slate-700 hover:text-black hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hộp thư</span>
          </button>

          {/* 2D Map vs 3D Globe Dimension Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl backdrop-blur-md border shadow-lg bg-[#121620]/90 border-slate-700/60">
            <button
              onClick={() => setDimensionMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                dimensionMode === '3d'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Quả địa cầu 3D tương tác"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Địa Cầu 3D</span>
            </button>
            <button
              onClick={() => setDimensionMode('2d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                dimensionMode === '2d'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Bản đồ phẳng 2D dễ nhìn"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Bản Đồ 2D</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
