import React, { useState } from 'react';
import { 
  Compass, 
  Globe, 
  Mail, 
  PlusCircle, 
  MessageSquare, 
  User, 
  GraduationCap, 
  Headphones, 
  Brain, 
  ShieldCheck, 
  FileEdit, 
  Music, 
  Sun, 
  Moon, 
  LifeBuoy, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  Radio,
  HeartHandshake,
  Sparkles,
  Bell,
  MessageCircleHeart
} from 'lucide-react';
import { ActiveTab, School, UserState } from '../types';
import { loginWithGoogle, logout } from '../lib/firebase';
import { ReputationBadge } from './ReputationBadge';
import { calculateReputationScore } from '../lib/reputationUtils';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedSchool?: School;
  schools: School[];
  onSelectSchool: (school: School) => void;
  userState: UserState;
  setUserState: React.Dispatch<React.SetStateAction<UserState>>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  openComposer: () => void;
  openEmergency: () => void;
  openAmbientModal?: () => void;
  openPeerMentorModal?: () => void;
  openNotificationsModal?: () => void;
  openHealingModal?: () => void;
  unreadNotificationsCount?: number;
  isDesktopCollapsed?: boolean;
  setIsDesktopCollapsed?: (collapsed: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedSchool,
  schools,
  onSelectSchool,
  userState,
  setUserState,
  theme,
  setTheme,
  openComposer,
  openEmergency,
  openAmbientModal,
  openPeerMentorModal,
  openNotificationsModal,
  openHealingModal,
  unreadNotificationsCount = 0,
  isDesktopCollapsed = false,
  setIsDesktopCollapsed
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const user = await loginWithGoogle();
      if (!user) return; // User closed or cancelled sign in popup
      setUserState(prev => ({
        ...prev,
        isLoggedIn: true,
        googleUser: {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Người dùng Google',
          photoURL: user.photoURL || ''
        }
      }));
    } catch (err) {
      console.warn('Sign in notice:', err);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUserState(prev => ({
      ...prev,
      isLoggedIn: false,
      googleUser: undefined
    }));
  };

  const navigateTo = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const selectSchoolAndNavigate = (school: School) => {
    onSelectSchool(school);
    setActiveTab('feed');
    setIsMobileDrawerOpen(false);
  };

  // Common Nav Content block used in both Desktop Sidebar and Mobile Drawer
  const renderNavItems = (isCollapsed: boolean = false) => (
    <>
      {/* User Google Auth Banner */}
      {!isCollapsed && (
        <div className="px-2 py-2 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] flex items-center justify-between text-xs">
          {userState.googleUser ? (
            <div className="flex items-center gap-2 overflow-hidden w-full justify-between">
              <div className="flex items-center gap-2 truncate">
                {userState.googleUser.photoURL ? (
                  <img src={userState.googleUser.photoURL} alt="" className="w-6 h-6 rounded-full shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#2A4228] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    G
                  </div>
                )}
                <span className="truncate text-[#0F180E] dark:text-[#E8ECE6] font-semibold text-[11px]">
                  {userState.googleUser.displayName || userState.googleUser.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[10px] text-[#A4A095] hover:text-rose-500 shrink-0 font-medium ml-1"
                title="Đăng xuất"
              >
                Thoát
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-[#2C382A] border border-[#C8D2C4] dark:border-[#3A4738] text-[#0F180E] dark:text-[#E8ECE6] hover:bg-[#EAF0E8] dark:hover:bg-[#344232] font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs text-[11px]"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Đăng nhập Google Auth</span>
            </button>
          )}
        </div>
      )}

      {/* Navigation Section */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
        {!isCollapsed && (
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#2C382A] dark:text-[#8E9B8A] px-2 mb-1">
            Không gian thảo luận
          </h3>
        )}

        <button
          onClick={() => navigateTo('explore')}
          className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3.5 px-3 py-2'} rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'explore' 
              ? 'bg-[#EAF0E8] dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] font-bold' 
              : 'text-[var(--text-muted)] hover:bg-[#EAF0E8]/70 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
          }`}
          title="Khám phá các trường"
        >
          <Compass className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
          {!isCollapsed && <span>Khám phá các trường</span>}
        </button>

        {/* Global Public Feed Button */}
        <button
          onClick={() => {
            selectSchoolAndNavigate({
              id: 'all-schools',
              name: '🌐 Sảnh Chung Mọi Trường',
              slug: 'sanh-chung-public',
              type: 'university',
              letterCount: 0,
              newCount: 0,
              verifiedCount: 0,
              location: 'Toàn Quốc'
            });
          }}
          className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3.5 px-3 py-2'} rounded-xl text-xs font-semibold transition-all ${
            selectedSchool?.id === 'all-schools' && activeTab === 'feed'
              ? 'bg-[#EAF0E8] dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] font-bold' 
              : 'text-[var(--text-muted)] hover:bg-[#EAF0E8]/70 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
          }`}
          title="Sảnh Chung Công Khai"
        >
          <Globe className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
          {!isCollapsed && <span>Sảnh Chung Công Khai</span>}
        </button>

        {/* 3D Interactive Globe Button */}
        <button
          onClick={() => navigateTo('globe')}
          className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3.5 px-3 py-2'} rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'globe'
              ? 'bg-[#EAF0E8] dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] font-bold' 
              : 'text-[var(--text-muted)] hover:bg-[#EAF0E8]/70 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
          }`}
          title="Địa Cầu Kết Nối 3D (Phân bố theo tỉnh thành)"
        >
          <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 justify-between w-full">
              <span>Địa Cầu Kết Nối 3D</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                3D
              </span>
            </div>
          )}
        </button>

        <button
          onClick={() => navigateTo('my_mailboxes')}
          className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3.5 px-3 py-2'} rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'my_mailboxes' || (activeTab === 'feed' && selectedSchool?.id !== 'all-schools')
              ? 'bg-[#EAF0E8] dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] font-bold' 
              : 'text-[var(--text-muted)] hover:bg-[#EAF0E8]/70 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
          }`}
          title="Hộp thư Campus Hub"
        >
          <Mail className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
          {!isCollapsed && <span>Hộp thư Campus Hub</span>}
        </button>

        {/* Verified Schools List in Sidebar */}
        {!isCollapsed && (
          <div className="ml-4 pl-3 border-l border-[#C8D2C4] dark:border-[#3A4738] flex flex-col gap-1 my-1">
            {userState.verifiedSchools && userState.verifiedSchools.length > 0 ? (
              userState.verifiedSchools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => selectSchoolAndNavigate(school)}
                  className={`text-left text-xs py-1.5 px-2 rounded-lg truncate transition-colors font-semibold flex items-center gap-1.5 ${
                    selectedSchool?.id === school.id && activeTab === 'feed'
                      ? 'text-[#2A4228] dark:text-[#8BA888] font-bold bg-[#EAF0E8] dark:bg-[#2A3628]'
                      : 'text-[#2C382A] dark:text-[#8E9B8A] hover:text-[#0F180E] hover:bg-[#EAF0E8]/50'
                  }`}
                >
                  <span>✅</span>
                  <span className="truncate">{school.name}</span>
                </button>
              ))
            ) : (
              <button
                onClick={() => navigateTo('verify')}
                className="text-left text-[11px] py-1.5 px-2 rounded-lg text-[#2A4228] dark:text-[#8BA888] hover:bg-[#EAF0E8]/60 dark:hover:bg-white/5 font-bold flex items-center gap-1 transition-colors"
                title="Xác thực thẻ HS/SV để thêm trường của bạn"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Xác thực trường học</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => navigateTo('messages')}
          className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'messages' 
              ? 'bg-[#EAF0E8] dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] font-bold' 
              : 'text-[var(--text-muted)] hover:bg-[#EAF0E8]/70 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
          }`}
          title="Trò chuyện 1-1"
        >
          <div className="flex items-center gap-3.5">
            <MessageSquare className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
            {!isCollapsed && <span>Trò chuyện 1-1</span>}
          </div>
          {!isCollapsed && (
            <span className="bg-[#2A4228] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              1
            </span>
          )}
        </button>

        <button
          onClick={() => navigateTo('profile')}
          className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'profile' || activeTab === 'verify'
              ? 'bg-[#EAF0E8] dark:bg-[#2A3628] text-[#2A4228] dark:text-[#8BA888] font-bold' 
              : 'text-[var(--text-muted)] hover:bg-[#EAF0E8]/70 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
          }`}
          title="Hồ sơ & Xác thực"
        >
          <div className="flex items-center gap-3.5">
            <User className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
            {!isCollapsed && <span>Hồ sơ & Xác thực</span>}
          </div>
          {!isCollapsed && (
            <ReputationBadge 
              score={calculateReputationScore(
                userState.verificationStatus === 'verified' && (userState.verifiedSchools || []).length > 0, 
                userState.hugsReceivedCount || 0
              )} 
              size="sm" 
            />
          )}
        </button>

        {/* Notifications Button */}
        {openNotificationsModal && (
          <button
            onClick={() => {
              openNotificationsModal();
              setIsMobileDrawerOpen(false);
            }}
            className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-xl text-xs font-semibold transition-all text-[var(--text-muted)] hover:bg-[#EAF0E8]/70 dark:hover:bg-white/5 hover:text-[var(--text-primary)] relative`}
            title="Thông báo"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <Bell className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
                {unreadNotificationsCount > 0 && isCollapsed && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-[var(--bg-card)]"></span>
                )}
              </div>
              {!isCollapsed && <span>Thông báo</span>}
            </div>
            {!isCollapsed && unreadNotificationsCount > 0 && (
              <span className="bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* Peer Mentor CTA Button */}
        {openPeerMentorModal && (
          <button
            onClick={openPeerMentorModal}
            className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-xl text-xs font-semibold transition-all ${
              userState.isPeerMentor
                ? 'bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-[var(--text-muted)] hover:bg-[#EAF0E8]/70 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
            }`}
            title="Đăng ký làm Người Lắng Nghe Đồng Hành (Peer Mentor)"
          >
            <div className="flex items-center gap-3.5">
              <HeartHandshake className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {!isCollapsed && (
                <span>{userState.isPeerMentor ? 'Bạn là Peer Mentor' : 'Đăng ký Peer Mentor'}</span>
              )}
            </div>
          </button>
        )}

        {/* Healing Notes & Feedback Button */}
        {openHealingModal && (
          <button
            onClick={() => {
              openHealingModal();
              setIsMobileDrawerOpen(false);
            }}
            className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-xl text-xs font-semibold transition-all text-[var(--text-muted)] hover:bg-[#EAF0E8]/70 dark:hover:bg-white/5 hover:text-[var(--text-primary)]`}
            title="Gửi lời nhắn chữa lành & Feedback"
          >
            <div className="flex items-center gap-3.5">
              <MessageCircleHeart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              {!isCollapsed && <span>Gửi lời nhắn</span>}
            </div>
          </button>
        )}

        {/* Role-Gated Admin / Mentor Access */}
        {!isCollapsed && userState.googleUser?.email?.toLowerCase() === 'phnam2409@apcs.fitus.edu.vn' && (
          <div className="mt-3 pt-2 border-t border-[var(--border-glass)] space-y-1">
            <div className="flex items-center justify-between px-2 mb-1">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#2C382A] dark:text-[#8E9B8A]">
                Chế độ vai trò
              </h3>
              <span className="text-[9px] bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] px-1.5 py-0.5 rounded font-bold uppercase">
                {userState.userRole === 'mentor' ? '🎓 Mentor' : userState.userRole === 'admin_moderator' ? '🛡️ Mod' : userState.userRole === 'peer_listener' ? '🎧 Listener' : '🎒 Học sinh'}
              </span>
            </div>

            <button
              onClick={() => {
                setUserState(prev => ({ ...prev, userRole: 'student' }));
                navigateTo('feed');
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                userState.userRole === 'student' && activeTab !== 'mentor_dashboard' && activeTab !== 'moderation_queue'
                  ? 'bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] font-bold border border-[#2A4228]/30'
                  : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#2A4228]" />
                <span>🎒 Học sinh / Thành viên</span>
              </div>
            </button>

            <button
              onClick={() => {
                setUserState(prev => ({ ...prev, userRole: 'peer_listener' }));
                navigateTo('messages');
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                userState.userRole === 'peer_listener'
                  ? 'bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] font-bold border border-[#2A4228]/30'
                  : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#2A4228]" />
                <span>🎧 Người lắng nghe</span>
              </div>
            </button>

            <button
              onClick={() => {
                setUserState(prev => ({ ...prev, userRole: 'mentor' }));
                navigateTo('mentor_dashboard');
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                userState.userRole === 'mentor' || activeTab === 'mentor_dashboard'
                  ? 'bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] font-bold border border-[#2A4228]/30'
                  : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#2A4228]" />
                <span>🎓 Mentor / Chuyên gia</span>
              </div>
              <span className="text-[9px] bg-[#2A4228]/20 text-[#2A4228] dark:text-[#8BA888] px-1 rounded font-bold">2</span>
            </button>

            <button
              onClick={() => {
                setUserState(prev => ({ ...prev, userRole: 'admin_moderator' }));
                navigateTo('moderation_queue');
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                userState.userRole === 'admin_moderator' || activeTab === 'moderation_queue'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold border border-rose-500/30'
                  : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>🛡️ Kiểm duyệt AI</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-[var(--border-glass)] flex flex-col gap-2">
        <button
          onClick={() => {
            openComposer();
            setIsMobileDrawerOpen(false);
          }}
          className={`w-full bg-[#2A4228] hover:bg-[#1B2C1A] text-white font-bold py-2.5 px-3 rounded-full text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95`}
          title="Chia sẻ ẩn danh"
        >
          <FileEdit className="w-4 h-4" />
          {!isCollapsed && <span>Chia sẻ ẩn danh</span>}
        </button>

        {!isCollapsed && (
          <div className="p-2.5 bg-[#2A4228]/10 rounded-2xl border border-[#2A4228]/20 text-center">
            <p className="font-serif italic text-xs text-[#2A4228] dark:text-[#8BA888] font-bold">
              "Bạn không cô đơn trên hành trình trưởng thành."
            </p>
          </div>
        )}

        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'} pt-1`}>
          {/* Ambient Soundscape Button */}
          {openAmbientModal && (
            <button
              onClick={() => {
                openAmbientModal();
                setIsMobileDrawerOpen(false);
              }}
              className="p-2 rounded-xl text-[#2A4228] dark:text-[#8BA888] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628] transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Phát Nhạc An Yên Lặp Vô Tận"
            >
              <Music className="w-4 h-4" />
              {!isCollapsed && <span>Nhạc an yên</span>}
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {!isCollapsed && <span>{theme === 'dark' ? 'Sáng' : 'Tối'}</span>}
          </button>

          {/* Emergency Hotline Button */}
          <button
            onClick={() => {
              openEmergency();
              setIsMobileDrawerOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/25 transition-all"
            title="Tổng đài hỗ trợ khẩn cấp SOS"
          >
            <LifeBuoy className="w-4 h-4" />
            {!isCollapsed && <span>SOS</span>}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full ${
          isDesktopCollapsed ? 'w-[72px]' : 'w-[260px]'
        } bg-[var(--bg-card)] border-r border-[var(--border-glass)] glass-panel z-40 p-4 gap-4 select-none transition-all duration-300`}
      >
        {/* Brand Header & Collapse Toggle */}
        <div className="flex items-center justify-between px-1 pt-1 mb-1">
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group truncate"
          >
            <div className="w-9 h-9 rounded-full bg-[#2A4228] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <div className="w-4 h-4 bg-white/80 rounded-full animate-pulse"></div>
            </div>
            {!isDesktopCollapsed && (
              <div className="truncate">
                <h1 className="font-serif italic text-2xl font-bold tracking-tight text-[#2A4228] dark:text-[#8BA888] leading-tight">
                  HealSpace
                </h1>
                <p className="text-[10px] text-[var(--text-muted)] font-bold truncate">Night Sanctuary</p>
              </div>
            )}
          </div>

          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={() => setIsDesktopCollapsed && setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#2C382A] dark:text-[#8E9B8A] transition-colors shrink-0"
            title={isDesktopCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn menu'}
          >
            {isDesktopCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {renderNavItems(isDesktopCollapsed)}
      </aside>

      {/* Mobile Top Header with Hamburger Button */}
      <header className="lg:hidden fixed top-0 left-0 w-full z-40 h-14 bg-[var(--bg-card)] border-b border-[var(--border-glass)] glass-panel px-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-1.5 rounded-xl bg-[#EAF0E8] dark:bg-[#20281F] border border-[#C8D2C4] dark:border-[#3A4738] text-[#0F180E] dark:text-[#E8ECE6] active:scale-95 transition-transform flex items-center justify-center"
            aria-label="Open sidebar drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#2A4228] flex items-center justify-center text-white shrink-0">
              <div className="w-3.5 h-3.5 bg-white/80 rounded-full animate-pulse"></div>
            </div>
            <span className="font-serif italic text-xl font-bold text-[#2A4228] dark:text-[#8BA888]">
              HealSpace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notifications button mobile */}
          {openNotificationsModal && (
            <button
              onClick={openNotificationsModal}
              className="p-1.5 rounded-xl text-[#0F180E] dark:text-[#E8ECE6] hover:bg-[#EAF0E8] dark:hover:bg-[#20281F] relative"
              title="Thông báo"
            >
              <Bell className="w-5 h-5 text-[#2A4228] dark:text-[#8BA888]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white dark:border-[#1E271D]"></span>
              )}
            </button>
          )}

          {/* Theme toggle mobile */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-[#0F180E] dark:text-[#E8ECE6]"
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Emergency button mobile */}
          <button
            onClick={openEmergency}
            className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1 shadow-2xs"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Hamburger Drawer */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Sliding Drawer Container */}
          <div className="relative w-[285px] max-w-[85vw] bg-[var(--bg-card)] border-r border-[var(--border-glass)] h-full z-50 p-4 flex flex-col gap-4 shadow-2xl overflow-y-auto animate-slide-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-glass)]">
              <div 
                onClick={() => navigateTo('landing')}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#2A4228] flex items-center justify-center text-white shrink-0">
                  <div className="w-3.5 h-3.5 bg-white/80 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="font-serif italic text-xl font-bold text-[#2A4228] dark:text-[#8BA888]">
                    HealSpace
                  </h1>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold">Secret Night Sanctuary</p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-full bg-[#EAF0E8] dark:bg-[#20281F] text-[#0F180E] dark:text-[#E8ECE6] hover:bg-rose-500/20 hover:text-rose-600 transition-colors"
                aria-label="Close sidebar drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavItems(false)}
          </div>
        </div>
      )}
    </>
  );
};

