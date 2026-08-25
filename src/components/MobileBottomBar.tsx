import React from 'react';
import { ActiveTab } from '../types';
import { Home, Compass, SquarePen, MessageSquare, User } from 'lucide-react';

interface MobileBottomBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openComposer: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeTab,
  setActiveTab,
  openComposer,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-40 bg-[var(--bg-card)] border-t border-[#E5E2D9] dark:border-[#3A4738] glass-panel h-16 flex items-center justify-around px-2 select-none shadow-lg">
      <button
        onClick={() => setActiveTab('landing')}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors ${
          activeTab === 'landing' ? 'text-[#5A6E58] dark:text-[#8BA888] font-bold' : 'text-[#7E7A71] dark:text-[#8E9B8A]'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Trang chủ</span>
      </button>

      <button
        onClick={() => setActiveTab('explore')}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors ${
          activeTab === 'explore' ? 'text-[#5A6E58] dark:text-[#8BA888] font-bold' : 'text-[#7E7A71] dark:text-[#8E9B8A]'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Khám phá</span>
      </button>

      {/* Floating Center Write Button */}
      <button
        onClick={openComposer}
        className="w-12 h-12 rounded-full bg-[#5A6E58] hover:bg-[#4A5D48] text-white font-bold flex items-center justify-center shadow-md active:scale-90 transition-transform -mt-5 border-2 border-[var(--bg-main)]"
        title="Viết thư ẩn danh"
      >
        <SquarePen className="w-6 h-6" />
      </button>

      <button
        onClick={() => setActiveTab('messages')}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors relative ${
          activeTab === 'messages' ? 'text-[#5A6E58] dark:text-[#8BA888] font-bold' : 'text-[#7E7A71] dark:text-[#8E9B8A]'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Kết nối</span>
        <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#8BA888]"></span>
      </button>

      <button
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors ${
          activeTab === 'profile' || activeTab === 'verify' ? 'text-[#5A6E58] dark:text-[#8BA888] font-bold' : 'text-[#7E7A71] dark:text-[#8E9B8A]'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Hồ sơ</span>
      </button>
    </nav>
  );
};

