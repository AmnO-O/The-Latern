import React, { useState, useEffect, useRef } from 'react';
import { 
  ActiveTab, 
  School, 
  Post, 
  DirectThread, 
  UserState, 
  Reply,
  LanternNotification,
  HealingNote,
  PeerMentorApplication,
  ListenerRatingFeedback,
  ListenerReport,
  CounselingAppointment,
  AppointmentStatus
} from './types';
import { PUBLIC_GLOBAL_SCHOOL, INITIAL_SCHOOLS, INITIAL_POSTS, INITIAL_THREADS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { MobileBottomBar } from './components/MobileBottomBar';
import { LandingPage } from './components/LandingPage';
import { CampusFeed } from './components/CampusFeed';
import { PostDetailView } from './components/PostDetailView';
import { ExploreView } from './components/ExploreView';
import { DirectMessagesView } from './components/DirectMessagesView';
import { ProfileView } from './components/ProfileView';
import { ComposerModal } from './components/ComposerModal';
import { SchoolVerifyModal } from './components/SchoolVerifyModal';
import { EmergencyDrawer } from './components/EmergencyDrawer';
import { MentorDashboard } from './components/MentorDashboard';
import { EditPostModal } from './components/EditPostModal';
import { EditSchoolModal } from './components/EditSchoolModal';
import { ShareModal } from './components/ShareModal';
import { AmbientSoundModal } from './components/AmbientSoundModal';
import { CampusGlobeView } from './components/CampusGlobeView';
import { PeerMentorModal } from './components/PeerMentorModal';
import { NotificationsModal } from './components/NotificationsModal';
import { HealingFeedbackModal } from './components/HealingFeedbackModal';
import { ListenerRatingModal } from './components/ListenerRatingModal';
import { ListenerReportModal } from './components/ListenerReportModal';
import { PublicProfileModal, PublicProfileTarget } from './components/PublicProfileModal';
import { calculateReputationScore } from './lib/reputationUtils';
import { getFormattedAuthorName } from './lib/authorUtils';
import { ambientAudio } from './lib/audioSynthesizer';
import {
  fetchAllPostsFromFirestore,
  listenToPostsFromFirestore,
  createPostInFirestore,
  addReplyToPostInFirestore,
  toggleLikePostInFirestore,
  toggleHugPostInFirestore,
  updatePostStatusInFirestore,
  updatePostInFirestore,
  deletePostFromFirestore,
  updateSchoolInFirestore,
  deleteSchoolFromFirestore,
  seedDefaultSchoolsToFirestore,
  listenToSchoolsFromFirestore,
  syncUserSchoolVerificationInFirestore,
  loadUserProfileFromFirestore,
  listenToDirectThreadsFromFirestore,
  sendDirectMessageToFirestore,
  revokeDirectMessageInFirestore,
  editDirectMessageInFirestore,
  deleteDirectMessageForMeInFirestore,
  deleteDirectThreadFromFirestore,
  clearDirectThreadHistoryInFirestore,
  loginWithGoogle,
  logout,
  subscribeToAuthChanges,
  FirestoreThreadDoc,
  FirestoreMessageItem,
  createHealingNoteInFirestore,
  likeHealingNoteInFirestore,
  listenToHealingNotesFromFirestore,
  INITIAL_DEFAULT_HEALING_NOTES,
  saveMentorApplicationToFirestore,
  listenToMentorApplicationsFromFirestore,
  updateMentorApplicationStatusInFirestore,
  deleteMentorApplicationFromFirestore,
  INITIAL_DEFAULT_MENTOR_APPLICATIONS,
  saveListenerReportToFirestore,
  listenToListenerReportsFromFirestore,
  updateListenerReportStatusInFirestore,
  listenToAppointmentsInFirestore,
  createAppointmentInFirestore,
  updateAppointmentStatusInFirestore,
  deleteAppointmentFromFirestore
} from './lib/firebase';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('lantern_active_tab');
      const validTabs: ActiveTab[] = [
        'landing', 'explore', 'feed', 'globe', 'post_detail', 
        'messages', 'my_mailboxes', 'profile', 'verify', 
        'emergency', 'mentor_dashboard', 'moderation_queue'
      ];
      if (saved && validTabs.includes(saved as ActiveTab)) {
        return saved as ActiveTab;
      }
    } catch (e) {
      console.warn('Failed to parse cached active tab:', e);
    }
    return 'landing';
  });

  const [schools, setSchools] = useState<School[]>(() => {
    try {
      const cached = localStorage.getItem('lantern_schools_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached schools:', e);
    }
    return INITIAL_SCHOOLS;
  });
  const [selectedSchool, setSelectedSchool] = useState<School>(() => {
    try {
      const saved = localStorage.getItem('lantern_selected_school');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.name) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached selected school:', e);
    }
    return PUBLIC_GLOBAL_SCHOOL;
  });

  // Persist schools to localStorage whenever they change
  useEffect(() => {
    try {
      if (schools && schools.length > 0) {
        localStorage.setItem('lantern_schools_cache', JSON.stringify(schools));
      }
    } catch (e) {
      console.warn('Failed to save schools to localStorage:', e);
    }
  }, [schools]);

  // Persist activeTab to localStorage and handle special tab redirects
  useEffect(() => {
    if (activeTab === 'verify') {
      setIsVerifyOpen(true);
      setActiveTab('profile');
      return;
    }
    try {
      localStorage.setItem('lantern_active_tab', activeTab);
    } catch (e) {
      console.warn('Failed to save activeTab to localStorage:', e);
    }
  }, [activeTab]);

  // Persist selectedSchool to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lantern_selected_school', JSON.stringify(selectedSchool));
    } catch (e) {
      console.warn('Failed to save selectedSchool to localStorage:', e);
    }
  }, [selectedSchool]);

  const handleAddSchool = (schoolName: string, location = 'Việt Nam', type: 'highschool' | 'university' = 'highschool') => {
    const existing = schools.find(s => s.name.toLowerCase() === schoolName.trim().toLowerCase());
    if (existing) {
      setSelectedSchool(existing);
      setActiveTab('feed');
      return existing;
    }

    const newSchool: School = {
      id: `school-custom-${Date.now()}`,
      name: schoolName.trim(),
      slug: schoolName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type,
      letterCount: 0,
      newCount: 0,
      verifiedCount: 0,
      location
    };

    setSchools(prev => [newSchool, ...prev]);
    setSelectedSchool(newSchool);
    setActiveTab('feed');

    // Persist to Firestore
    updateSchoolInFirestore(newSchool.id, newSchool).catch(err => {
      console.warn('Save custom school to Firestore error:', err);
    });

    return newSchool;
  };
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const cached = localStorage.getItem('lantern_cached_posts');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached posts from localStorage:', e);
    }
    return [];
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Persist posts to localStorage cache
  useEffect(() => {
    if (posts.length > 0) {
      try {
        localStorage.setItem('lantern_cached_posts', JSON.stringify(posts));
      } catch (e) {
        console.warn('Failed to save posts to localStorage:', e);
      }
    }
  }, [posts]);

  // Persist and restore selectedPost when navigating to/from post_detail
  useEffect(() => {
    if (selectedPost) {
      try {
        localStorage.setItem('lantern_selected_post_id', selectedPost.id);
      } catch (e) {
        console.warn('Failed to save selected post ID:', e);
      }
    } else if (activeTab !== 'post_detail') {
      localStorage.removeItem('lantern_selected_post_id');
    }
  }, [selectedPost, activeTab]);

  // On initial posts load, restore selectedPost if activeTab was post_detail
  useEffect(() => {
    if (posts.length > 0 && activeTab === 'post_detail' && !selectedPost) {
      const savedPostId = localStorage.getItem('lantern_selected_post_id');
      if (savedPostId) {
        const found = posts.find(p => p.id === savedPostId);
        if (found) {
          setSelectedPost(found);
        }
      }
    }
  }, [posts, activeTab, selectedPost]);
  
  // Set of deleted thread IDs to prevent ghost threads from resurrecting on reload or Firestore sync
  const [deletedThreadIds, setDeletedThreadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lantern_deleted_thread_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {}
    return new Set<string>();
  });
  const deletedThreadIdsRef = useRef(deletedThreadIds);
  useEffect(() => {
    deletedThreadIdsRef.current = deletedThreadIds;
  }, [deletedThreadIds]);

  // Threads state with persistence across reloads
  const [threads, setThreads] = useState<DirectThread[]>(() => {
    try {
      const saved = localStorage.getItem('lantern_direct_threads');
      const savedDeleted = localStorage.getItem('lantern_deleted_thread_ids');
      const deletedSet = new Set(savedDeleted ? JSON.parse(savedDeleted) : []);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out deleted threads and legacy mock demo threads (keep AI companion and real custom/peer threads)
          const filtered = parsed.filter((t: DirectThread) => 
            t && t.id && !deletedSet.has(t.id) && (
              t.id === 'thread-ai-companion' || 
              t.id.startsWith('thread-custom-') || 
              t.id.startsWith('thread-peer-') ||
              t.id.startsWith('thread-post-') ||
              (t.id.startsWith('thread-author-') && t.id !== 'thread-author-p1')
            )
          );
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached threads:', e);
    }
    return INITIAL_THREADS;
  });
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-ai-companion');
  const [typingThreadId, setTypingThreadId] = useState<string | null>(null);

  // Persist threads whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lantern_direct_threads', JSON.stringify(threads));
    } catch (e) {
      console.warn('Failed to save threads to localStorage:', e);
    }
  }, [threads]);

  // Modals
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isAmbientModalOpen, setIsAmbientModalOpen] = useState(false);
  const [isPeerMentorModalOpen, setIsPeerMentorModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isHealingModalOpen, setIsHealingModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);

  // Healing Rating Modal & Report Modal State
  const [ratingTarget, setRatingTarget] = useState<{ listenerName: string; threadId?: string; postId?: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ listenerName: string; threadId?: string; postId?: string } | null>(null);
  const [publicProfileTarget, setPublicProfileTarget] = useState<PublicProfileTarget | null>(null);

  // Listener Ratings State
  const [listenerRatings, setListenerRatings] = useState<ListenerRatingFeedback[]>(() => {
    try {
      const saved = localStorage.getItem('lantern_listener_ratings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse listener ratings:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lantern_listener_ratings', JSON.stringify(listenerRatings));
    } catch (e) {
      console.warn('Failed to save listener ratings:', e);
    }
  }, [listenerRatings]);

  // Listener Reports State
  const [listenerReports, setListenerReports] = useState<ListenerReport[]>(() => {
    try {
      const saved = localStorage.getItem('lantern_listener_reports');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse listener reports:', e);
    }
    return [
      {
        id: 'rep-demo-1',
        reportedListenerName: 'Người Lắng Nghe #912',
        reporterAnonId: '#318',
        reason: 'privacy_invasion',
        reasonDetail: 'Người này liên tục gặng hỏi tài khoản Facebook cá nhân và số Zalo khi mình đang tâm sự chuyện gia đình.',
        status: 'pending',
        createdAt: Date.now() - 7200000
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lantern_listener_reports', JSON.stringify(listenerReports));
    } catch (e) {
      console.warn('Failed to save listener reports:', e);
    }
  }, [listenerReports]);

  const handleSubmitRating = (rating: ListenerRatingFeedback) => {
    setListenerRatings(prev => [rating, ...prev]);

    // Send toast / notification to recipient if applicable
    const newNotif: LanternNotification = {
      id: `notif-rating-${Date.now()}`,
      type: 'hug',
      postId: rating.postId || '',
      postTitle: 'Nhận được đánh giá ấm áp (Healing Rating)',
      senderName: rating.senderAnonId,
      message: `Bạn vừa nhận được một phản hồi "${
        rating.ratingType === 'warm_heart' ? 'Ấm áp & Chân thành' :
        rating.ratingType === 'deep_empathy' ? 'Thấu cảm sâu sắc' :
        rating.ratingType === 'helpful' ? 'Lời khuyên hữu ích' : 'Vô cùng biết ơn'
      }" từ một người bạn bạn đã lắng nghe. ❤️`,
      createdAt: Date.now(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleSubmitReport = (report: ListenerReport) => {
    setListenerReports(prev => [report, ...prev]);
    saveListenerReportToFirestore(report).catch(err => {
      console.warn('Save listener report to Firestore warning:', err);
    });
  };

  const handleResolveReport = (reportId: string, action: 'ban_listener' | 'dismiss') => {
    setListenerReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: action === 'ban_listener' ? 'resolved' : 'dismissed'
        };
      }
      return r;
    }));

    updateListenerReportStatusInFirestore(reportId, action === 'ban_listener' ? 'resolved' : 'dismissed').catch(err => {
      console.warn('Update report status in Firestore warning:', err);
    });

    if (action === 'ban_listener') {
      const rep = listenerReports.find(r => r.id === reportId);
      if (rep) {
        // Revoke peer mentor application status if found
        setMentorApplications(prev => prev.map(a => {
          if (a.applicantDisplayName === rep.reportedListenerName || a.applicantAnonId === rep.reportedListenerName) {
            updateMentorApplicationStatusInFirestore(a.id, 'rejected', {
              rejectionReason: 'Bị tước quyền do vi phạm quy chuẩn an toàn cộng đồng'
            }).catch(() => {});
            return {
              ...a,
              status: 'rejected',
              rejectionReason: 'Bị tước quyền do vi phạm quy chuẩn an toàn cộng đồng'
            };
          }
          return a;
        }));
      }
    }
  };

  // Healing Notes & Feedback State (Real-time Cloud Sync across all machines)
  const [healingNotes, setHealingNotes] = useState<HealingNote[]>(() => {
    try {
      const saved = localStorage.getItem('lantern_healing_notes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse healing notes from localStorage:', e);
    }
    return INITIAL_DEFAULT_HEALING_NOTES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('lantern_healing_notes', JSON.stringify(healingNotes));
    } catch (e) {
      console.warn('Failed to save healing notes to localStorage:', e);
    }
  }, [healingNotes]);

  const handleAddHealingNote = (newNoteData: Omit<HealingNote, 'id' | 'createdAt' | 'likesCount'>) => {
    const newNote: HealingNote = {
      ...newNoteData,
      id: `healing-note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      likesCount: 1,
    };
    // Optimistic local update
    setHealingNotes(prev => [newNote, ...prev.filter(n => n.id !== newNote.id)]);
    // Persist & sync to Firestore
    createHealingNoteInFirestore(newNote).catch(err => {
      console.warn('Create healing note Firestore error:', err);
    });
  };

  const handleLikeHealingNote = (noteId: string) => {
    // Optimistic local update
    setHealingNotes(prev =>
      prev.map(note =>
        note.id === noteId ? { ...note, likesCount: (note.likesCount || 0) + 1 } : note
      )
    );
    // Persist & sync to Firestore
    likeHealingNoteInFirestore(noteId).catch(err => {
      console.warn('Like healing note Firestore error:', err);
    });
  };

  // Notifications State
  const [notifications, setNotifications] = useState<LanternNotification[]>(() => {
    try {
      const saved = localStorage.getItem('lantern_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse notifications from localStorage:', e);
    }
    return [
      {
        id: 'notif-welcome',
        type: 'counselor_response',
        postId: '',
        postTitle: 'Chào mừng bạn đến với HealSpace Sanctuary',
        senderName: 'Ngọn Đèn Thấu Hiểu',
        message: 'Không gian ẩn danh an toàn và thấu hiểu. Bạn có thể chia sẻ tâm sự hoặc gửi thư tư vấn đến Ban Cố Vấn trường bất cứ lúc nào.',
        createdAt: Date.now() - 3600000,
        isRead: false
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lantern_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage:', e);
    }
  }, [notifications]);

  // Mentor & Specialist Applications State
  const [mentorApplications, setMentorApplications] = useState<PeerMentorApplication[]>(() => {
    try {
      const saved = localStorage.getItem('lantern_mentor_applications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse mentor applications from localStorage:', e);
    }
    return INITIAL_DEFAULT_MENTOR_APPLICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('lantern_mentor_applications', JSON.stringify(mentorApplications));
    } catch (e) {
      console.warn('Failed to save mentor applications to localStorage:', e);
    }
  }, [mentorApplications]);

  const handleSaveMentorApplication = async (newApp: PeerMentorApplication) => {
    // Optimistic local update
    setMentorApplications(prev => {
      const idx = prev.findIndex(a => a.id === newApp.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newApp;
        return updated;
      }
      return [newApp, ...prev];
    });

    // Cloud Firestore Sync
    try {
      await saveMentorApplicationToFirestore(newApp);
    } catch (err) {
      console.warn('Sync mentor application to Firestore warning:', err);
    }
  };

  const handleApproveMentorApplication = async (appId: string, role: 'peer_listener' | 'specialist') => {
    const targetApp = mentorApplications.find(a => a.id === appId);

    setMentorApplications(prev => prev.map(a => {
      if (a.id === appId) {
        return {
          ...a,
          status: 'approved',
          roleType: role,
          reviewedAt: Date.now()
        };
      }
      return a;
    }));

    // If current user is the applicant, update role in userState
    setUserState(prev => {
      if (prev.peerMentorApplication?.id === appId || (!prev.peerMentorApplication && prev.userRole !== 'admin_moderator')) {
        const updatedApp = {
          ...(prev.peerMentorApplication || {}),
          id: appId,
          status: 'approved' as const,
          roleType: role
        } as PeerMentorApplication;

        const matchingApp = targetApp || prev.peerMentorApplication;
        const schoolObj = schools.find(s => s.id === matchingApp?.schoolId) || (matchingApp?.schoolId ? { id: matchingApp.schoolId, name: matchingApp.schoolName, slug: matchingApp.schoolId, type: 'university' as const, letterCount: 0, newCount: 0, verifiedCount: 1, location: 'Toàn Quốc' } : null);
        const existingVerified = prev.verifiedSchools || [];
        const updatedVerified = (schoolObj && !existingVerified.some(s => s.id === schoolObj.id))
          ? [...existingVerified, schoolObj]
          : existingVerified;

        return {
          ...prev,
          verifiedSchools: updatedVerified,
          peerMentorApplication: updatedApp,
          isPeerMentor: true,
          isSpecialist: role === 'specialist',
          mentorRoleType: role,
          userRole: role === 'specialist' ? 'mentor' : 'peer_listener'
        };
      }
      return prev;
    });

    // Send notification
    const newNotif: LanternNotification = {
      id: `notif-app-${Date.now()}`,
      type: 'counselor_response',
      postId: '',
      postTitle: 'Hồ sơ đồng hành tâm lý đã được phê duyệt',
      senderName: 'Ban Quản Trị HealSpace',
      message: `Chúc mừng bạn! Hồ sơ ${role === 'specialist' ? 'Chuyên gia tâm lý' : 'Bạn lắng nghe'} của bạn đã được duyệt thành công. Bạn đã có huy hiệu uy tín khi phản hồi thư.`,
      createdAt: Date.now(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Firestore Sync
    try {
      await updateMentorApplicationStatusInFirestore(appId, 'approved', {
        roleType: role,
        applicantId: targetApp?.applicantId
      });
    } catch (err) {
      console.warn('Update mentor app status in Firestore warning:', err);
    }
  };

  const handleRejectMentorApplication = async (appId: string, reason?: string) => {
    setMentorApplications(prev => prev.map(a => {
      if (a.id === appId) {
        return {
          ...a,
          status: 'rejected',
          rejectionReason: reason || 'Chưa đủ điều kiện xác thực',
          reviewedAt: Date.now()
        };
      }
      return a;
    }));

    // If current user is the applicant
    setUserState(prev => {
      if (prev.peerMentorApplication?.id === appId) {
        return {
          ...prev,
          peerMentorApplication: {
            ...prev.peerMentorApplication,
            status: 'rejected',
            rejectionReason: reason
          }
        };
      }
      return prev;
    });

    // Firestore Sync
    try {
      await updateMentorApplicationStatusInFirestore(appId, 'rejected', {
        rejectionReason: reason || 'Chưa đủ điều kiện xác thực'
      });
    } catch (err) {
      console.warn('Update mentor app status in Firestore warning:', err);
    }
  };

  // Counseling Appointments State (Google Meet & In-Person)
  const [appointments, setAppointments] = useState<CounselingAppointment[]>(() => {
    try {
      const saved = localStorage.getItem('lantern_counseling_appointments');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse cached appointments:', e);
    }
    return [
      {
        id: 'appt-demo-1',
        counselorName: 'ThS. Tâm lý Minh Đức',
        counselorRole: 'Chuyên gia Tâm lý Học đường',
        participantDisplayName: 'Học sinh K22',
        meetingType: 'google_meet',
        date: 'Ngày mai (14:00)',
        timeSlot: '14:00 - 14:45',
        meetUrl: 'https://meet.google.com/abc-pqrs-xyz',
        topic: 'Giải tỏa áp lực thi cử và định hướng tâm lý học đường',
        notes: 'Buổi gặp riêng tư 1-1 hỗ trợ xây dựng lộ trình học tập cân bằng cảm xúc',
        status: 'confirmed',
        createdAt: Date.now() - 3600000 * 2,
        schoolName: 'Đại học Bách Khoa Hà Nội'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lantern_counseling_appointments', JSON.stringify(appointments));
    } catch (e) {
      console.warn('Failed to save appointments to localStorage:', e);
    }
  }, [appointments]);

  const handleScheduleAppointment = (newAppt: CounselingAppointment) => {
    setAppointments(prev => [newAppt, ...prev]);
    createAppointmentInFirestore(newAppt).catch(err => console.warn('Create appointment error:', err));
    // Send local notification
    const newNotif: LanternNotification = {
      id: `notif-appt-${Date.now()}`,
      type: 'counselor_response',
      postId: newAppt.relatedPostId || '',
      postTitle: `Lịch hẹn tham vấn: ${newAppt.topic}`,
      senderName: newAppt.counselorName || 'Ban Cố Vấn',
      message: newAppt.meetingType === 'google_meet'
        ? `Đã lên lịch Google Meet tham vấn vào ${newAppt.date} (${newAppt.timeSlot}). Link: ${newAppt.meetUrl}`
        : `Đã lên lịch gặp trực tiếp tại ${newAppt.locationName || 'Trường'} vào ${newAppt.date} (${newAppt.timeSlot}).`,
      createdAt: Date.now(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status } : a));
    updateAppointmentStatusInFirestore(appointmentId, status).catch(err => console.warn('Update appointment status error:', err));
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    deleteAppointmentFromFirestore(appointmentId).catch(err => console.warn('Delete appointment error:', err));
  };

  // User State with local cache restore
  const [userState, setUserState] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem('lantern_user_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear out legacy mock default if present
        if (parsed.userAnonNumber === 492 && parsed.hugsGivenCount === 14 && parsed.hugsReceivedCount === 8) {
          // Clear legacy mock cached userState
          localStorage.removeItem('lantern_user_state');
        } else {
          const isUserLogged = Boolean(parsed.isLoggedIn && parsed.googleUser?.email);
          const isVerified = isUserLogged && parsed.verificationStatus === 'verified';
          const hugsRec = isUserLogged ? (parsed.hugsReceivedCount || 0) : 0;
          return {
            ...parsed,
            isLoggedIn: isUserLogged,
            googleUser: isUserLogged ? parsed.googleUser : undefined,
            displayName: isUserLogged ? parsed.displayName : undefined,
            verifiedFullName: isUserLogged ? parsed.verifiedFullName : undefined,
            customAvatarUrl: isUserLogged ? parsed.customAvatarUrl : undefined,
            isIdentityLocked: isUserLogged ? (parsed.isIdentityLocked ?? false) : false,
            activePostingMode: isUserLogged ? (parsed.activePostingMode || 'anonymous') : 'anonymous',
            reputationScore: isUserLogged ? (parsed.reputationScore ?? calculateReputationScore(isVerified, hugsRec)) : 0,
            selectedSchool: parsed.selectedSchool || (parsed.verifiedSchools?.[0] || PUBLIC_GLOBAL_SCHOOL),
            verifiedSchools: isUserLogged && Array.isArray(parsed.verifiedSchools) ? parsed.verifiedSchools : [],
            verificationStatus: isUserLogged ? (parsed.verificationStatus || 'unverified') : 'unverified',
            isPeerMentor: isUserLogged ? Boolean(parsed.isPeerMentor) : false,
            isSpecialist: isUserLogged ? Boolean(parsed.isSpecialist) : false,
            mentorRoleType: isUserLogged ? parsed.mentorRoleType : undefined,
            peerMentorApplication: isUserLogged ? parsed.peerMentorApplication : undefined,
            userRole: isUserLogged ? (parsed.userRole || 'student') : 'student',
            schoolVerifications: isUserLogged ? (parsed.schoolVerifications || {}) : {}
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse local userState:', e);
    }
    return {
      isLoggedIn: false,
      userRole: 'student',
      selectedSchool: PUBLIC_GLOBAL_SCHOOL,
      verificationStatus: 'unverified',
      userAnonNumber: Math.floor(100 + Math.random() * 900),
      hugsGivenCount: 0,
      hugsReceivedCount: 0,
      reputationScore: 0,
      verifiedSchools: [],
      schoolVerifications: {},
      activePostingMode: 'anonymous'
    };
  });

  // Track posts created by the current user session/device
  const [myPostIds, setMyPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lantern_my_post_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist userState to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lantern_user_state', JSON.stringify(userState));
    } catch (e) {
      console.warn('Failed to save userState to localStorage:', e);
    }
  }, [userState]);

  useEffect(() => {
    try {
      localStorage.setItem('lantern_my_post_ids', JSON.stringify(myPostIds));
    } catch (e) {
      console.warn('Failed to save myPostIds to localStorage:', e);
    }
  }, [myPostIds]);

  const currentUserId = userState.googleUser?.uid || `user-local-${userState.userAnonNumber}`;

  // Sync user verification to Firestore whenever userState.googleUser changes or on load
  useEffect(() => {
    if (userState.googleUser?.uid) {
      loadUserProfileFromFirestore(userState.googleUser.uid).then(profile => {
        if (profile) {
          const verifiedList = Array.isArray(profile.verifiedSchools) ? profile.verifiedSchools : [];
          const status = profile.verificationStatus || (verifiedList.length > 0 ? 'verified' : 'unverified');
          const isVerified = status === 'verified' && verifiedList.length > 0;
          setUserState(prev => ({
            ...prev,
            verifiedSchools: verifiedList,
            selectedSchool: profile.selectedSchool || (verifiedList[0] || PUBLIC_GLOBAL_SCHOOL),
            verificationStatus: status,
            schoolVerifications: profile.schoolVerifications || prev.schoolVerifications || {},
            displayName: profile.displayName || prev.displayName,
            verifiedFullName: profile.verifiedFullName || prev.verifiedFullName,
            verifiedMajor: profile.verifiedMajor || prev.verifiedMajor,
            verifiedCohort: profile.verifiedCohort || prev.verifiedCohort,
            defaultCohort: profile.defaultCohort || prev.defaultCohort,
            schoolCohorts: profile.schoolCohorts || prev.schoolCohorts || {},
            isIdentityLocked: profile.isIdentityLocked ?? prev.isIdentityLocked ?? false,
            customAvatarUrl: profile.customAvatarUrl || prev.customAvatarUrl,
            reputationScore: profile.reputationScore ?? calculateReputationScore(isVerified, prev.hugsReceivedCount || 0)
          }));
        }
      });
    }
  }, [userState.googleUser?.uid]);

  // Remove or unverify a school from user's verified list
  const handleRemoveSchoolVerification = (schoolId: string) => {
    setUserState(prev => {
      const currentList = prev.verifiedSchools || [];
      const updatedList = currentList.filter(s => s.id !== schoolId);
      const isRemovingSelected = prev.selectedSchool?.id === schoolId;
      const newSelectedSchool = isRemovingSelected 
        ? (updatedList[0] || PUBLIC_GLOBAL_SCHOOL)
        : prev.selectedSchool;
      
      const newStatus = updatedList.length > 0 ? 'verified' : 'unverified';
      const updatedVerifications = { ...(prev.schoolVerifications || {}) };
      delete updatedVerifications[schoolId];
      const isVerified = newStatus === 'verified' && updatedList.length > 0;

      const newState: UserState = {
        ...prev,
        verifiedSchools: updatedList,
        selectedSchool: newSelectedSchool,
        verificationStatus: newStatus,
        schoolVerifications: updatedVerifications,
        reputationScore: calculateReputationScore(isVerified, prev.hugsReceivedCount || 0),
        lastCloudSyncTimestamp: Date.now()
      };

      if (isRemovingSelected) {
        setSelectedSchool(newSelectedSchool);
      }

      // Sync to Firestore
      if (prev.googleUser?.uid) {
        syncUserSchoolVerificationInFirestore(prev.googleUser.uid, {
          verifiedSchools: updatedList,
          selectedSchool: newSelectedSchool,
          verificationStatus: newStatus,
          schoolVerifications: updatedVerifications
        });
      }

      return newState;
    });
  };

  // Reset all school verifications
  const handleResetAllVerifications = () => {
    setUserState(prev => {
      const newState: UserState = {
        ...prev,
        verifiedSchools: [],
        selectedSchool: PUBLIC_GLOBAL_SCHOOL,
        verificationStatus: 'unverified',
        schoolVerifications: {},
        reputationScore: calculateReputationScore(false, prev.hugsReceivedCount || 0),
        lastCloudSyncTimestamp: Date.now()
      };

      setSelectedSchool(PUBLIC_GLOBAL_SCHOOL);

      if (prev.googleUser?.uid) {
        syncUserSchoolVerificationInFirestore(prev.googleUser.uid, {
          verifiedSchools: [],
          selectedSchool: PUBLIC_GLOBAL_SCHOOL,
          verificationStatus: 'unverified',
          schoolVerifications: {}
        });
      }

      return newState;
    });
  };

  // Super Admin Check (Checks if logged in user is admin email)
  const isAdmin = Boolean(
    userState.googleUser?.email?.toLowerCase() === 'phnam2409@apcs.fitus.edu.vn' ||
    userState.googleUser?.email?.toLowerCase() === 'nam722006@gmail.com'
  );

  const isUserAuthor = (post: Post) => {
    if (!post) return false;
    if (myPostIds.includes(post.id)) return true;
    if (post.authorUid && post.authorUid === currentUserId) return true;
    return false;
  };

  const userDisplayName = userState.googleUser?.displayName || `Người dùng ẩn danh #${userState.userAnonNumber}`;

  // Notification helper actions
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleSelectNotification = (notif: LanternNotification) => {
    handleMarkNotificationAsRead(notif.id);
    setIsNotificationsModalOpen(false);
    if (notif.postId) {
      const targetPost = posts.find(p => p.id === notif.postId);
      if (targetPost) {
        setSelectedPost(targetPost);
        setActiveTab('post_detail');
      } else {
        setActiveTab('feed');
      }
    }
  };

  // Real-time listener for Direct Message Threads from Firestore
  useEffect(() => {
    const userAnonNumber = userState.userAnonNumber || 100;
    const unsubscribeThreads = listenToDirectThreadsFromFirestore(
      currentUserId,
      userDisplayName,
      userAnonNumber,
      myPostIds,
      isAdmin,
      (firestoreThreads) => {
        setThreads(prev => {
          // Keep the standard AI Companion thread always readily available
          const aiThread: DirectThread = prev.find(t => t.id === 'thread-ai-companion' || t.threadType === 'ai') || {
            id: 'thread-ai-companion',
            peerName: 'AI Companion',
            peerRole: 'ai_lantern',
            threadType: 'ai',
            roleTitle: 'Trợ lý thấu cảm 24/7',
            isOnline: true,
            statusText: 'Sẵn sàng 24/7',
            unreadCount: 0,
            messages: [
              {
                id: 'm-ai-init',
                senderName: 'AI Companion',
                senderRole: 'ai_lantern',
                text: 'Chào bạn! Mình là AI Companion 🕯️✨ Mình luôn ở đây để lắng nghe mọi điều bạn muốn tâm sự. Hôm nay bạn đang cảm thấy thế nào?',
                timestamp: 'Vừa xong',
                isMe: false
              }
            ]
          };

          const currentDeleted = deletedThreadIdsRef.current;
          const validFirestoreThreads = (firestoreThreads || []).filter(ft => ft && ft.id && !currentDeleted.has(ft.id));

          return [aiThread, ...validFirestoreThreads];
        });
      }
    );

    return () => {
      if (unsubscribeThreads) unsubscribeThreads();
    };
  }, [currentUserId, userDisplayName, userState.userAnonNumber, myPostIds, isAdmin]);

  // Load and listen to posts and schools from Firestore in real-time
  useEffect(() => {
    const unsubscribePosts = listenToPostsFromFirestore((firestorePosts) => {
      if (firestorePosts) {
        setPosts(prevPosts => {
          if (!prevPosts || prevPosts.length === 0) return firestorePosts;

          const mergedFirestorePosts = firestorePosts.map(fp => {
            const local = prevPosts.find(p => p.id === fp.id);
            if (!local) return fp;

            const fpReplies = Array.isArray(fp.replies) ? fp.replies : [];
            const localReplies = Array.isArray(local.replies) ? local.replies : [];
            const replyMap = new Map<string, Reply>();
            fpReplies.forEach(r => replyMap.set(r.id, r));
            localReplies.forEach(r => {
              if (!replyMap.has(r.id)) {
                replyMap.set(r.id, r);
              }
            });
            const mergedReplies = Array.from(replyMap.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

            return {
              ...fp,
              isLiked: local.isLiked !== undefined ? local.isLiked : fp.isLiked,
              isHugged: local.isHugged !== undefined ? local.isHugged : fp.isHugged,
              isSaved: local.isSaved !== undefined ? local.isSaved : fp.isSaved,
              replies: mergedReplies,
              repliesCount: Math.max(fp.repliesCount || 0, mergedReplies.length)
            };
          });

          // Preserve any local recently created posts (created in last 90 seconds) not yet synced
          const firestoreIds = new Set(firestorePosts.map(p => p.id));
          const now = Date.now();
          const pendingLocalPosts = prevPosts.filter(p => !firestoreIds.has(p.id) && (now - (p.createdAt || 0) < 90000));

          return [...pendingLocalPosts, ...mergedFirestorePosts];
        });

        // Also update selectedPost if activeTab is post_detail
        setSelectedPost(prev => {
          if (!prev) return null;
          const fresh = firestorePosts.find(p => p.id === prev.id);
          if (!fresh) return prev;

          const freshReplies = Array.isArray(fresh.replies) ? fresh.replies : [];
          const prevReplies = Array.isArray(prev.replies) ? prev.replies : [];
          const replyMap = new Map<string, Reply>();
          freshReplies.forEach(r => replyMap.set(r.id, r));
          prevReplies.forEach(r => {
            if (!replyMap.has(r.id)) {
              replyMap.set(r.id, r);
            }
          });
          const mergedReplies = Array.from(replyMap.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

          return {
            ...fresh,
            isLiked: prev.isLiked !== undefined ? prev.isLiked : fresh.isLiked,
            isHugged: prev.isHugged !== undefined ? prev.isHugged : fresh.isHugged,
            isSaved: prev.isSaved !== undefined ? prev.isSaved : fresh.isSaved,
            replies: mergedReplies,
            repliesCount: Math.max(fresh.repliesCount || 0, mergedReplies.length)
          };
        });
      }
    });

    const unsubscribeSchools = listenToSchoolsFromFirestore((updatedSchools) => {
      if (updatedSchools && updatedSchools.length > 0) {
        setSchools(updatedSchools);
        setSelectedSchool(prev => {
          const found = updatedSchools.find(s => s.id === prev.id);
          return found || prev;
        });
      }
    });

    const unsubscribeHealingNotes = listenToHealingNotesFromFirestore((updatedNotes) => {
      if (updatedNotes && updatedNotes.length > 0) {
        setHealingNotes(updatedNotes);
      }
    });

    const unsubscribeMentorApps = listenToMentorApplicationsFromFirestore((updatedApps) => {
      if (updatedApps && updatedApps.length > 0) {
        setMentorApplications(updatedApps);
      }
    });

    const unsubscribeReports = listenToListenerReportsFromFirestore((updatedReports) => {
      if (updatedReports && updatedReports.length > 0) {
        setListenerReports(updatedReports);
      }
    });

    const unsubscribeAppointments = listenToAppointmentsInFirestore((updatedAppointments) => {
      if (updatedAppointments && updatedAppointments.length > 0) {
        setAppointments(updatedAppointments);
      }
    });

    return () => {
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeSchools) unsubscribeSchools();
      if (unsubscribeHealingNotes) unsubscribeHealingNotes();
      if (unsubscribeMentorApps) unsubscribeMentorApps();
      if (unsubscribeReports) unsubscribeReports();
      if (unsubscribeAppointments) unsubscribeAppointments();
    };
  }, []);

  // Update school info & logo
  const handleUpdateSchool = async (updatedFields: Partial<School>) => {
    if (!editingSchool) return;
    const schoolId = editingSchool.id;
    
    // Optimistic UI update
    setSchools(prev => prev.map(s => {
      if (s.id === schoolId) {
        return { ...s, ...updatedFields };
      }
      return s;
    }));

    if (selectedSchool.id === schoolId) {
      setSelectedSchool(prev => ({ ...prev, ...updatedFields }));
    }

    try {
      await updateSchoolInFirestore(schoolId, updatedFields);
    } catch (err) {
      console.error('Failed to sync school update to Firestore:', err);
      throw err;
    }
  };

  // Delete school from Firestore
  const handleDeleteSchool = async (schoolId: string) => {
    setSchools(prev => prev.filter(s => s.id !== schoolId));
    if (selectedSchool.id === schoolId) {
      setSelectedSchool(PUBLIC_GLOBAL_SCHOOL);
    }
    if (editingSchool?.id === schoolId) {
      setEditingSchool(null);
    }
    try {
      await deleteSchoolFromFirestore(schoolId);
    } catch (err) {
      console.error('Failed to delete school from Firestore:', err);
      throw err;
    }
  };

  // Seed default universities and high schools to Firestore
  const handleSeedDefaultSchools = async () => {
    try {
      await seedDefaultSchoolsToFirestore(true);
    } catch (err) {
      console.error('Failed to seed default schools to Firestore:', err);
      throw err;
    }
  };

  // Apply theme to HTML root element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        setUserState(prev => {
          if (prev.googleUser?.uid === firebaseUser.uid && prev.isLoggedIn) return prev;
          return {
            ...prev,
            isLoggedIn: true,
            googleUser: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Người dùng Google',
              photoURL: firebaseUser.photoURL || ''
            }
          };
        });
      } else {
        setUserState(prev => {
          if (!prev.isLoggedIn && !prev.googleUser && !prev.displayName && !prev.verifiedFullName && !prev.isPeerMentor && !prev.isSpecialist) {
            return prev;
          }
          const resetState: UserState = {
            ...prev,
            isLoggedIn: false,
            googleUser: undefined,
            displayName: undefined,
            verifiedFullName: undefined,
            customAvatarUrl: undefined,
            isIdentityLocked: false,
            activePostingMode: 'anonymous',
            isPeerMentor: false,
            isSpecialist: false,
            mentorRoleType: undefined,
            peerMentorApplication: undefined,
            userRole: 'student',
            verificationStatus: 'unverified',
            verifiedSchools: [],
            schoolVerifications: {},
            reputationScore: 0
          };
          try {
            localStorage.setItem('lantern_user_state', JSON.stringify(resetState));
          } catch (e) {}
          return resetState;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const user = await loginWithGoogle(userState);
      if (!user) return;
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
    try {
      await logout();
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
    setUserState(prev => {
      const resetState: UserState = {
        ...prev,
        isLoggedIn: false,
        googleUser: undefined,
        displayName: undefined,
        verifiedFullName: undefined,
        customAvatarUrl: undefined,
        isIdentityLocked: false,
        activePostingMode: 'anonymous',
        isPeerMentor: false,
        isSpecialist: false,
        mentorRoleType: undefined,
        peerMentorApplication: undefined,
        userRole: 'student',
        verificationStatus: 'unverified',
        verifiedSchools: [],
        schoolVerifications: {},
        reputationScore: 0
      };
      try {
        localStorage.setItem('lantern_user_state', JSON.stringify(resetState));
      } catch (e) {}
      return resetState;
    });
  };

  // Handle post creation with Gemini API Moderation and Firestore persistence
  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    schoolId: string;
    schoolName: string;
    schoolSlug: string;
    tags: string[];
    authorAnonId?: string;
    authorClassBadge?: string;
    isPublic?: boolean;
    isCounselingMailbox?: boolean;
    counselorReplyOnly?: boolean;
    imageUrl?: string;
    imageAnalysis?: any;
    expiryDurationDays?: number;
    isAnonymousGuest?: boolean;
    isIdentityPublic?: boolean;
    authorDisplayName?: string;
    authorAvatarUrl?: string;
    authorCohort?: string;
    authorMajor?: string;
  }) => {
    // Enforce authentication for campus-only and counseling mailbox posts
    if ((postData.isPublic === false || postData.isCounselingMailbox) && !userState.isLoggedIn) {
      return {
        isSafe: false,
        flagReason: postData.isCounselingMailbox 
          ? 'Bạn cần đăng nhập tài khoản để gửi thư vào Hòm Thư Tư Vấn và nhận phản hồi từ Chuyên gia.'
          : 'Bạn cần đăng nhập tài khoản để gửi thư vào Bảng tin Nội Bộ Trường.',
        suggestion: 'Vui lòng đăng nhập bằng Google hoặc chọn Sảnh Chung để chia sẻ.'
      };
    }

    let moderationResult: {
      isSafe: boolean;
      flagReason?: string;
      suggestion?: string;
      crisisDetected?: boolean;
      comfortMessage?: string | null;
    } = { isSafe: true };

    try {
      const response = await fetch('/api/moderate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postData.title,
          content: postData.content,
          schoolName: postData.schoolName,
          category: postData.tags.join(', ')
        })
      });

      if (response.ok) {
        moderationResult = await response.json();
      }
    } catch (fetchErr) {
      console.warn('AI Moderation network notice: allowing local post creation with fallback safety.', fetchErr);
      moderationResult = {
        isSafe: true,
        comfortMessage: 'Cảm ơn bạn đã gửi gắm nỗi lòng cùng Ngọn Đèn. Chúc bạn một ngày bình yên 🌿'
      };
    }

    if (moderationResult && moderationResult.isSafe === false) {
      return {
        isSafe: false,
        flagReason: moderationResult.flagReason || 'Nội dung có thể chưa phù hợp với nguyên tắc văn minh học đường.',
        suggestion: moderationResult.suggestion || 'Hãy diễn đạt tâm sự nhẹ nhàng và mang tính sẻ chia hơn.',
        crisisDetected: moderationResult.crisisDetected
      };
    }

    // Safe post! Add to state
    const generatedPostId = `post-${Date.now()}`;
    const nowTimestamp = Date.now();
    const expiryDurationDays = postData.expiryDurationDays !== undefined 
      ? postData.expiryDurationDays 
      : (userState.isLoggedIn ? 0 : 14);
    const expiresAt = expiryDurationDays > 0 ? (nowTimestamp + expiryDurationDays * 24 * 60 * 60 * 1000) : undefined;
    const isAnonymousGuest = postData.isAnonymousGuest !== undefined 
      ? postData.isAnonymousGuest 
      : !userState.isLoggedIn;

    const newPost: Post = {
      id: generatedPostId,
      authorUid: currentUserId,
      schoolId: postData.schoolId,
      schoolName: postData.schoolName,
      schoolSlug: postData.schoolSlug,
      authorAnonId: postData.authorAnonId || `#${Math.floor(100 + Math.random() * 899)}`,
      authorRole: 'student',
      authorClassBadge: postData.authorClassBadge,
      authorReputationScore: userState.reputationScore,
      timestamp: 'Vừa xong',
      createdAt: nowTimestamp,
      expiresAt: expiresAt,
      expiryDurationDays: expiryDurationDays,
      isAnonymousGuest: isAnonymousGuest,
      title: postData.title,
      content: postData.content,
      tags: postData.tags,
      likesCount: 0,
      hugsCount: 1,
      repliesCount: moderationResult?.comfortMessage ? 1 : 0,
      isLiked: false,
      isHugged: true,
      status: 'approved',
      isPublic: postData.isPublic ?? false,
      isCounselingMailbox: postData.isCounselingMailbox ?? false,
      counselorReplyOnly: postData.counselorReplyOnly ?? false,
      imageUrl: postData.imageUrl,
      imageAnalysis: postData.imageAnalysis,
      isIdentityPublic: postData.isIdentityPublic,
      authorDisplayName: postData.authorDisplayName,
      authorAvatarUrl: postData.authorAvatarUrl,
      authorCohort: postData.authorCohort,
      authorMajor: postData.authorMajor,
      replies: moderationResult?.comfortMessage ? [
        {
          id: `reply-ai-${Date.now()}`,
          postId: generatedPostId,
          authorName: 'Ngọn Đèn Thấu Hiểu (AI Companion)',
          authorRole: 'ai_lantern',
          isVerifiedBadge: true,
          authorReputationScore: 99,
          timestamp: 'Vừa xong',
          createdAt: Date.now(),
          content: moderationResult.comfortMessage,
          hugsCount: 1,
          isHugged: true
        }
      ] : []
    };

    setPosts(prev => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
    setMyPostIds(prev => [...new Set([...prev, generatedPostId])]);

    // Async write to Firestore
    createPostInFirestore(newPost).catch(err => {
      console.warn('Firestore write warning:', err);
    });
    
    // Update school counts in schools list
    setSchools(prev => prev.map(s => {
      if (s.id === postData.schoolId || s.name === postData.schoolName) {
        const updatedLetterCount = (s.letterCount || 0) + 1;
        const updatedNewCount = (s.newCount || 0) + 1;
        return { ...s, letterCount: updatedLetterCount, newCount: updatedNewCount };
      }
      return s;
    }));

    // Switch to feed for that school or global
    if (postData.schoolId === 'all-schools' || postData.schoolId === 'all' || postData.schoolSlug === 'sanh-chung-public') {
      setSelectedSchool(PUBLIC_GLOBAL_SCHOOL);
    } else {
      const targetSchool = schools.find(s => s.id === postData.schoolId || s.name === postData.schoolName) || (postData.isPublic ? PUBLIC_GLOBAL_SCHOOL : selectedSchool);
      setSelectedSchool({
        ...targetSchool,
        letterCount: (targetSchool.letterCount || 0) + 1,
        newCount: (targetSchool.newCount || 0) + 1
      });
    }
    setActiveTab('feed');

    return { isSafe: true };
  };

  // Handle requesting Gemini AI Mentor reply for a post
  const handleRequestAIReply = async (postId: string) => {
    const postObj = posts.find(p => p.id === postId);
    if (!postObj) return;

    try {
      const response = await fetch('/api/ai-mentor-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postTitle: postObj.title,
          postContent: postObj.content,
          category: postObj.tags.join(', ')
        })
      });

      const data = await response.json();

      if (data.reply) {
        const aiReply: Reply = {
          id: `reply-ai-${Date.now()}`,
          postId: postId,
          authorName: 'Ngọn Đèn Thấu Hiểu (AI Companion)',
          authorRole: 'ai_lantern',
          isVerifiedBadge: true,
          authorReputationScore: 99,
          timestamp: 'Vừa xong',
          createdAt: Date.now(),
          content: data.reply,
          hugsCount: 1,
          isHugged: true
        };

        const currentReplies = Array.isArray(postObj.replies) ? postObj.replies : [];
        const updatedReplies = [...currentReplies, aiReply];

        setPosts(prevPosts => prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              repliesCount: (p.repliesCount || 0) + 1,
              replies: updatedReplies
            };
          }
          return p;
        }));

        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            repliesCount: (prev.repliesCount || 0) + 1,
            replies: updatedReplies
          } : null);
        }

        // Persist AI reply to Firestore
        addReplyToPostInFirestore(postId, aiReply, updatedReplies).catch(err => {
          console.warn('Firestore sync AI reply error:', err);
        });
      }
    } catch (err) {
      console.error('AI Reply error:', err);
    }
  };

  // Toggle Hug action
  const handleToggleHug = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let isMyPost = myPostIds.includes(postId);
    let didHug = false;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newIsHugged = !p.isHugged;
        didHug = newIsHugged;
        return {
          ...p,
          isHugged: newIsHugged,
          hugsCount: newIsHugged ? p.hugsCount + 1 : Math.max(0, p.hugsCount - 1)
        };
      }
      return p;
    }));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        isHugged: !prev.isHugged,
        hugsCount: !prev.isHugged ? prev.hugsCount + 1 : Math.max(0, prev.hugsCount - 1)
      } : null);
    }

    // Update user state for given/received hugs
    setUserState(prev => {
      const newGiven = didHug ? prev.hugsGivenCount + 1 : Math.max(0, prev.hugsGivenCount - 1);
      const newReceived = isMyPost 
        ? (didHug ? (prev.hugsReceivedCount || 8) + 1 : Math.max(0, (prev.hugsReceivedCount || 8) - 1))
        : (prev.hugsReceivedCount || 8);
        
      return {
        ...prev,
        hugsGivenCount: newGiven,
        hugsReceivedCount: newReceived,
        reputationScore: calculateReputationScore(prev.verificationStatus === 'verified', newReceived)
      };
    });

    // Fire & Forget: Update in Firestore
    const targetPost = posts.find(p => p.id === postId);
    if (targetPost) {
      toggleHugPostInFirestore(postId, didHug).catch(err => {
        console.warn("Error toggling hug in DB:", err);
      });
    }
  };

  // Toggle Like action
  const handleToggleLike = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let didLike = false;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newIsLiked = !p.isLiked;
        didLike = newIsLiked;
        return {
          ...p,
          isLiked: newIsLiked,
          likesCount: newIsLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
        };
      }
      return p;
    }));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        isLiked: !prev.isLiked,
        likesCount: !prev.isLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1)
      } : null);
    }
    
    // Fire & Forget: Update in Firestore
    toggleLikePostInFirestore(postId, didLike).catch(err => {
      console.warn("Error toggling like in DB:", err);
    });
  };

  // Toggle Save bookmark action
  const handleToggleSave = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, isSaved: !p.isSaved };
      }
      return p;
    }));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, isSaved: !prev.isSaved } : null);
    }
  };

  // Update Post (Title, Content, Tags, isPublic)
  const handleUpdatePost = async (postId: string, updateData: { title: string; content: string; tags: string[]; isPublic: boolean }) => {
    let updatedTarget: Post | null = null;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        updatedTarget = {
          ...p,
          title: updateData.title,
          content: updateData.content,
          tags: updateData.tags,
          isPublic: updateData.isPublic
        };
        return updatedTarget;
      }
      return p;
    }));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        title: updateData.title,
        content: updateData.content,
        tags: updateData.tags,
        isPublic: updateData.isPublic
      } : null);
    }

    // Sync to Firestore with full post object fallback
    const targetToSync = updatedTarget || posts.find(p => p.id === postId);
    try {
      if (targetToSync) {
        await updatePostInFirestore(postId, {
          ...targetToSync,
          ...updateData
        });
      } else {
        await updatePostInFirestore(postId, updateData);
      }
    } catch (err) {
      console.warn('Firestore update post error:', err);
    }
  };

  // Delete Post
  const handleDeletePost = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (window.confirm('Bạn có chắc chắn muốn xóa lá thư này không? Hành động này không thể hoàn tác.')) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(null);
        setActiveTab('feed');
      }

      // Sync to Firestore
      deletePostFromFirestore(postId).catch(err => {
        console.warn('Firestore delete post error:', err);
      });
    }
  };

  // Add user reply to post with OP detection and per-thread anonymous identity
  const handleAddReply = (
    postId: string, 
    content: string, 
    replyTo?: { authorName: string; id: string },
    replyOptions?: {
      isIdentityPublic?: boolean;
      authorDisplayName?: string;
      authorAvatar?: string;
      authorCohort?: string;
      authorMajor?: string;
    }
  ) => {
    const targetPost = posts.find(p => p.id === postId) || (selectedPost?.id === postId ? selectedPost : null);
    const isOP = targetPost ? isUserAuthor(targetPost) : false;

    let authorName = '';
    if (replyOptions?.isIdentityPublic && replyOptions.authorDisplayName) {
      authorName = replyOptions.authorDisplayName;
    } else if (isOP && targetPost) {
      // Retain the exact anonymous post identity when OP comments (#123 / #979)
      authorName = getFormattedAuthorName(targetPost);
    } else {
      // Generate consistent per-thread commenter alias (e.g. #412) without leaking identity across posts
      const seedStr = `${currentUserId || 'guest'}_${postId}`;
      let hash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        hash = (hash * 31 + seedStr.charCodeAt(i)) & 0xffffff;
      }
      const commenterNum = (Math.abs(hash) % 899) + 100;
      authorName = `#${commenterNum}`;
    }

    // Determine author role dynamically
    let assignedRole: 'student' | 'peer_listener' | 'expert' = 'student';
    if (userState.userRole === 'mentor' || userState.isSpecialist || userState.mentorRoleType === 'specialist') {
      assignedRole = 'expert';
    } else if (userState.userRole === 'peer_listener' || userState.isPeerMentor || userState.mentorRoleType === 'peer_listener') {
      assignedRole = 'peer_listener';
    }

    const newReply: Reply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      postId: postId,
      authorUid: currentUserId,
      authorName: authorName,
      authorRole: assignedRole,
      authorReputationScore: userState.reputationScore,
      isOP: isOP,
      isVerifiedBadge: userState.verificationStatus === 'verified',
      timestamp: 'Vừa xong',
      createdAt: Date.now(),
      content: content,
      hugsCount: 0,
      replyToAuthor: replyTo?.authorName,
      replyToId: replyTo?.id,
      isIdentityPublic: replyOptions?.isIdentityPublic,
      authorDisplayName: replyOptions?.authorDisplayName,
      authorAvatar: replyOptions?.authorAvatar,
      authorCohort: replyOptions?.authorCohort,
      authorMajor: replyOptions?.authorMajor
    };

    // Calculate updated replies list
    const currentReplies = targetPost && Array.isArray(targetPost.replies) ? targetPost.replies : [];
    const updatedReplies = [...currentReplies.filter(r => r.id !== newReply.id), newReply];

    // Optimistically update local posts state
    setPosts(prev => {
      const exists = prev.some(p => p.id === postId);
      if (!exists && targetPost) {
        return [{ ...targetPost, replies: updatedReplies, repliesCount: updatedReplies.length }, ...prev];
      }
      return prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            repliesCount: updatedReplies.length,
            replies: updatedReplies
          };
        }
        return p;
      });
    });

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        repliesCount: updatedReplies.length,
        replies: updatedReplies
      } : null);
    }

    // Persist to real Firestore database immediately
    addReplyToPostInFirestore(postId, newReply, updatedReplies, targetPost || undefined).catch(err => {
      console.error('Firestore sync reply error:', err);
    });

    // Generate notification for post author, comment reply, or tag mention
    if (targetPost) {
      const isReplyingToMyComment = replyTo && (
        replyTo.authorName === userDisplayName ||
        replyTo.authorName === `#${userState.userAnonNumber}`
      );

      const currentAnonTag = `#${userState.userAnonNumber}`;
      const hasTag = content.includes('@') || (userDisplayName && content.includes(`@${userDisplayName}`)) || content.includes(currentAnonTag);

      const notifType = targetPost.isCounselingMailbox 
        ? 'counselor_response' 
        : hasTag 
          ? 'tag' 
          : 'reply';

      const notifTitle = targetPost.title || 'Lá thư ẩn danh';
      let notifMessage = '';

      if (notifType === 'counselor_response') {
        notifMessage = `${authorName} đã gửi phản hồi tư vấn cho tâm thư của bạn: "${content.slice(0, 75)}${content.length > 75 ? '...' : ''}"`;
      } else if (hasTag) {
        notifMessage = `${authorName} đã nhắc đến bạn trong một bình luận: "${content.slice(0, 75)}${content.length > 75 ? '...' : ''}"`;
      } else if (isReplyingToMyComment) {
        notifMessage = `${authorName} đã trả lời bình luận của bạn: "${content.slice(0, 75)}${content.length > 75 ? '...' : ''}"`;
      } else {
        notifMessage = `${authorName} đã gửi phản hồi vào bài viết "${notifTitle}": "${content.slice(0, 75)}${content.length > 75 ? '...' : ''}"`;
      }

      const newNotif: LanternNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: notifType,
        postId: postId,
        postTitle: notifTitle,
        senderName: authorName,
        message: notifMessage,
        createdAt: Date.now(),
        isRead: false
      };

      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Direct Chat send message with Firestore Real-time Sync
  const handleSendDirectMessage = async (threadId: string, text: string) => {
    const targetThread = threads.find(t => t.id === threadId);
    const newMsgId = `m-${Date.now()}`;
    const newMsgItem: FirestoreMessageItem = {
      id: newMsgId,
      senderId: currentUserId,
      senderName: (isAdmin && userState.userRole === 'admin_moderator') ? 'Ban Quản Trị' : userDisplayName,
      senderRole: (isAdmin && userState.userRole === 'admin_moderator') ? 'admin' : (userState.userRole || 'student'),
      text: text,
      timestamp: 'Vừa xong',
      createdAt: Date.now()
    };

    // Optimistic UI update
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          messages: [
            ...t.messages,
            {
              id: newMsgId,
              senderName: 'Bạn',
              senderRole: userState.userRole || 'student',
              text: text,
              timestamp: 'Vừa xong',
              createdAt: Date.now(),
              isMe: true
            }
          ]
        };
      }
      return t;
    }));

    if (targetThread) {
      // Sync message to Firestore in real-time (for any P2P or author chat)
      if (threadId !== 'thread-ai-companion') {
        const otherParticipant = targetThread.relatedPostId 
          ? (posts.find(p => p.id === targetThread.relatedPostId)?.authorUid || targetThread.peerName)
          : targetThread.peerName;

        sendDirectMessageToFirestore(threadId, {
          id: threadId,
          peerName: targetThread.peerName,
          peerRole: targetThread.peerRole,
          roleTitle: targetThread.roleTitle,
          threadType: targetThread.threadType,
          relatedPostId: targetThread.relatedPostId,
          relatedPostTitle: targetThread.relatedPostTitle,
          relatedPostSnippet: targetThread.relatedPostSnippet,
          relatedSchoolName: targetThread.relatedSchoolName,
          participants: [currentUserId, otherParticipant]
        }, newMsgItem).catch(err => console.error('Sync msg to Firestore error:', err));
      }

      // If chatting with AI Companion, auto respond via Gemini AI
      if (targetThread.threadType === 'ai' || targetThread.id === 'thread-ai-companion' || targetThread.peerName === 'AI Companion' || targetThread.peerRole === 'ai_lantern') {
        setTypingThreadId(threadId);

        const history = targetThread.messages.slice(-6).map(m => ({
          role: m.isMe ? 'user' : 'model',
          text: m.text
        }));

        try {
          const res = await fetch('/api/ai-chat-companion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              chatHistory: history
            })
          });

          const data = await res.json();
          setTypingThreadId(null);

          if (data.reply) {
            ambientAudio.playIncomingMessageSound();
            setThreads(prev => prev.map(t => {
              if (t.id === threadId) {
                return {
                  ...t,
                  messages: [
                    ...t.messages,
                    {
                      id: `m-ai-reply-${Date.now()}`,
                      senderName: 'AI Companion',
                      senderRole: 'ai_lantern',
                      text: data.reply,
                      timestamp: 'Vừa xong',
                      createdAt: Date.now(),
                      isMe: false
                    }
                  ]
                };
              }
              return t;
            }));
          }
        } catch (err) {
          setTypingThreadId(null);
          console.error('AI Companion Direct Chat Error:', err);
        }
      }
    }
  };

  // Start new peer chat of specific category
  const handleStartNewPeerChat = (peerType: 'ai' | 'listener' | 'expert') => {
    if (peerType === 'ai') {
      const existing = threads.find(t => t.id === 'thread-ai-companion' || t.peerRole === 'ai_lantern');
      if (existing) {
        setActiveThreadId(existing.id);
      } else {
        const newThread: DirectThread = {
          id: 'thread-ai-companion',
          peerName: 'AI Companion',
          peerRole: 'ai_lantern',
          threadType: 'ai',
          roleTitle: 'Trợ lý thấu cảm 24/7',
          isOnline: true,
          statusText: 'Sẵn sàng 24/7',
          unreadCount: 0,
          messages: [
            {
              id: `m-ai-init-${Date.now()}`,
              senderName: 'AI Companion',
              senderRole: 'ai_lantern',
              text: 'Chào bạn! Mình là AI Companion 🕯️✨ Mình luôn ở đây để lắng nghe mọi điều bạn muốn tâm sự. Hôm nay bạn đang cảm thấy thế nào?',
              timestamp: 'Vừa xong',
              isMe: false
            }
          ]
        };
        setThreads(prev => [newThread, ...prev.filter(t => t.id !== newThread.id)]);
        setActiveThreadId(newThread.id);
      }
    } else if (peerType === 'expert') {
      handleOpenDirectChatWithPeer('Cô H. - Tư vấn Tâm lý học đường', 'Chuyên gia Tâm lý / Cố vấn Học đường');
    } else {
      const listenerNames = ['Đom Đóm Mùa Thu', 'Gió Mùa Hạ', 'Chiếc Lá Nhỏ', 'Sao Băng Xanh', 'Mây Trắng êm đềm'];
      const randomName = listenerNames[Math.floor(Math.random() * listenerNames.length)];
      handleOpenDirectChatWithPeer(randomName, 'Bạn lắng nghe tích cực (Đã xác minh)');
    }
    setActiveTab('messages');
  };

  // Open Direct Chat with Author of a specific Letter
  const handleConnectWithAuthor = async (post: Post) => {
    const authorId = post.authorUid || post.authorAnonId;
    const cleanCurrentId = currentUserId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const newThreadId = `thread-post-${post.id}-${cleanCurrentId}`;

    // Remove from deleted set if previously deleted
    setDeletedThreadIds(prev => {
      if (!prev.has(newThreadId)) return prev;
      const updated = new Set(prev);
      updated.delete(newThreadId);
      try {
        localStorage.setItem('lantern_deleted_thread_ids', JSON.stringify(Array.from(updated)));
      } catch (e) {}
      return updated;
    });

    const existing = threads.find(t => t.id === newThreadId || t.relatedPostId === post.id);
    if (existing) {
      setActiveThreadId(existing.id);
      setActiveTab('messages');
      return;
    }

    const initMsg: FirestoreMessageItem = {
      id: `m-init-${Date.now()}`,
      senderId: currentUserId,
      senderName: userDisplayName,
      senderRole: userState.userRole || 'student',
      text: `Chào bạn... Mình vừa đọc lá thư «${post.title}» của bạn ở ${post.schoolName}. Mình rất muốn gửi lời an ủi chân thành đến bạn 🫂`,
      timestamp: 'Vừa xong',
      createdAt: Date.now()
    };

    const authorDisplayName = getFormattedAuthorName(post);
    const newThreadMeta: FirestoreThreadDoc = {
      id: newThreadId,
      participants: [currentUserId, authorId],
      participantNames: {
        [currentUserId]: userDisplayName,
        [authorId]: authorDisplayName
      },
      peerName: `Tác giả (${authorDisplayName})`,
      peerRole: 'student',
      roleTitle: `Tác giả lá thư • ${post.schoolName}`,
      isOnline: true,
      statusText: 'Đang online',
      unreadCount: 0,
      relatedPostId: post.id,
      relatedPostTitle: post.title,
      relatedPostSnippet: post.content.slice(0, 120),
      relatedSchoolName: post.schoolName,
      threadType: 'letter_author',
      messages: [initMsg],
      createdAt: Date.now(),
      lastMessageAt: Date.now()
    };

    // Save to Firestore so the real author receives it in real-time on any device
    await sendDirectMessageToFirestore(newThreadId, newThreadMeta, initMsg);

    setThreads(prev => [
      {
        ...newThreadMeta,
        messages: [{
          ...initMsg,
          senderName: 'Bạn',
          isMe: true
        }]
      } as DirectThread,
      ...prev.filter(t => t.id !== newThreadId && t.relatedPostId !== post.id)
    ]);
    setActiveThreadId(newThreadId);
    setActiveTab('messages');
  };

  // Open Direct Chat with Peer Listener or Mentor
  const handleOpenDirectChatWithPeer = async (peerName: string, roleTitle: string) => {
    const cleanPeerId = peerName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const cleanCurrentId = currentUserId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const newThreadId = `thread-peer-${cleanPeerId}-${cleanCurrentId}`;

    // Remove from deleted set if previously deleted
    setDeletedThreadIds(prev => {
      if (!prev.has(newThreadId)) return prev;
      const updated = new Set(prev);
      updated.delete(newThreadId);
      try {
        localStorage.setItem('lantern_deleted_thread_ids', JSON.stringify(Array.from(updated)));
      } catch (e) {}
      return updated;
    });

    const existing = threads.find(t => t.id === newThreadId || t.peerName === peerName);
    if (existing) {
      setActiveThreadId(existing.id);
    } else {
      const isAdmin = peerName.includes('Admin') || peerName.includes('Quản Trị');
      const isExpert = isAdmin || peerName.includes('Cô') || peerName.includes('Dr.') || peerName.includes('ThS.') || peerName.includes('Chuyên gia');
      
      const welcomeText = isAdmin
        ? `Chào bạn! Mình là Ban Quản Trị & Cố Vấn Lantern 🛡️✨. Chúng mình luôn ở đây 24/7 để lắng nghe mọi khó khăn, bảo vệ quyền riêng tư và hỗ trợ đồng hành cùng bạn. Hãy chia sẻ bất cứ điều gì bạn đang gặp phải nhé!`
        : `Chào bạn! Mình là ${peerName}. Mình rất vui được ngồi đây lắng nghe những tâm sự của bạn 🌿`;

      const initMsg: FirestoreMessageItem = {
        id: `m-peer-init-${Date.now()}`,
        senderId: 'peer-listener',
        senderName: peerName,
        senderRole: isExpert ? 'expert' : 'peer_listener',
        text: welcomeText,
        timestamp: 'Vừa xong',
        createdAt: Date.now()
      };

      const newThreadMeta: FirestoreThreadDoc = {
        id: newThreadId,
        participants: [currentUserId, peerName],
        peerName,
        peerRole: isExpert ? 'expert' : 'peer_listener',
        threadType: isExpert ? 'expert' : 'peer_listener',
        roleTitle,
        isOnline: true,
        statusText: 'Đang online',
        unreadCount: 0,
        messages: [initMsg],
        createdAt: Date.now(),
        lastMessageAt: Date.now()
      };

      await sendDirectMessageToFirestore(newThreadId, newThreadMeta, initMsg);

      setThreads(prev => {
        const hasExisting = prev.some(t => t.id === newThreadId || t.peerName === peerName);
        if (hasExisting) {
          return prev;
        }
        return [
          {
            ...newThreadMeta,
            messages: [{
              ...initMsg,
              isMe: false
            }]
          } as DirectThread,
          ...prev.filter(t => t.id !== newThreadId && t.peerName !== peerName)
        ];
      });
      setActiveThreadId(newThreadId);
    }
    setActiveTab('messages');
  };

  // Navigate directly to a post from a chat quote banner
  const handleOpenRelatedPost = (postId: string) => {
    const target = posts.find(p => p.id === postId);
    if (target) {
      setSelectedPost(target);
      setActiveTab('post_detail');
    }
  };

  // Delete/Leave thread
  const handleDeleteThread = (threadId: string) => {
    if (threadId === 'thread-ai-companion') return;

    // 1. Mark as deleted in state & localStorage so snapshot won't restore it
    setDeletedThreadIds(prev => {
      const updated = new Set(prev);
      updated.add(threadId);
      try {
        localStorage.setItem('lantern_deleted_thread_ids', JSON.stringify(Array.from(updated)));
      } catch (e) {}
      return updated;
    });

    // 2. Remove from local thread state
    setThreads(prev => prev.filter(t => t.id !== threadId));

    // 3. Delete document from Firestore
    deleteDirectThreadFromFirestore(threadId).catch(err => console.warn('Delete thread error:', err));

    // 4. Switch active thread to AI companion if current active was deleted
    setActiveThreadId(prevActive => {
      if (prevActive === threadId) {
        return 'thread-ai-companion';
      }
      return prevActive;
    });
  };

  // Revoke / Unsend message for everyone
  const handleRevokeMessage = (threadId: string, messageId: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          messages: t.messages.map(m => {
            if (m.id === messageId) {
              return {
                ...m,
                isRevoked: true,
                text: 'Tin nhắn đã được thu hồi',
                revokedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              };
            }
            return m;
          })
        };
      }
      return t;
    }));
    revokeDirectMessageInFirestore(threadId, messageId).catch(err => console.warn('Revoke msg error:', err));
  };

  // Delete message locally for this user (Meta style: "Xóa ở phía bạn")
  const handleDeleteMessageForMe = (threadId: string, messageId: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          messages: t.messages.filter(m => m.id !== messageId)
        };
      }
      return t;
    }));
    deleteDirectMessageForMeInFirestore(threadId, messageId, currentUserId).catch(err => console.warn('Delete msg for me error:', err));
  };

  // Edit sent message
  const handleEditMessage = (threadId: string, messageId: string, newText: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          messages: t.messages.map(m => {
            if (m.id === messageId) {
              return {
                ...m,
                text: newText,
                editedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              };
            }
            return m;
          })
        };
      }
      return t;
    }));
    editDirectMessageInFirestore(threadId, messageId, newText).catch(err => console.warn('Edit msg error:', err));
  };

  // Clear thread messages history
  const handleClearThreadHistory = (threadId: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          messages: []
        };
      }
      return t;
    }));
    clearDirectThreadHistoryInFirestore(threadId).catch(err => console.warn('Clear history error:', err));
  };

  const savedPosts = posts.filter(p => p.isSaved);

  return (
    <div className={`min-h-screen flex bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300`}>
      {/* Primary Sidebar / TopBar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedSchool={selectedSchool}
        schools={schools}
        onSelectSchool={setSelectedSchool}
        userState={userState}
        setUserState={setUserState}
        theme={theme}
        setTheme={setTheme}
        openComposer={() => setIsComposerOpen(true)}
        openEmergency={() => setIsEmergencyOpen(true)}
        openAmbientModal={() => setIsAmbientModalOpen(true)}
        openPeerMentorModal={() => setIsPeerMentorModalOpen(true)}
        openNotificationsModal={() => setIsNotificationsModalOpen(true)}
        openHealingModal={() => setIsHealingModalOpen(true)}
        openVerify={() => setIsVerifyOpen(true)}
        unreadNotificationsCount={notifications.filter(n => !n.isRead).length}
        isDesktopCollapsed={isSidebarCollapsed}
        setIsDesktopCollapsed={setIsSidebarCollapsed}
        onOpenLogin={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Content Router */}
      <main className={`flex-1 min-w-0 overflow-x-hidden ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'} min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0 transition-all duration-300`}>
        {activeTab === 'landing' && (
          <LandingPage
            schools={schools}
            posts={posts}
            onSelectSchool={(school) => {
              setSelectedSchool(school);
              setActiveTab('feed');
            }}
            setActiveTab={setActiveTab}
            openComposer={() => setIsComposerOpen(true)}
            openEmergency={() => setIsEmergencyOpen(true)}
            openVerify={() => setIsVerifyOpen(true)}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreView
            schools={schools}
            posts={posts}
            isAdmin={isAdmin}
            onEditSchool={(school) => setEditingSchool(school)}
            onDeleteSchool={handleDeleteSchool}
            onSeedSchools={handleSeedDefaultSchools}
            onSelectSchool={(school) => {
              setSelectedSchool(school);
              setActiveTab('feed');
            }}
            onOpenVerify={() => setIsVerifyOpen(true)}
            onOpenGlobe={() => setActiveTab('globe')}
            onAddCustomSchool={handleAddSchool}
          />
        )}

        {(activeTab === 'feed' || activeTab === 'my_mailboxes') && (
          <CampusFeed
            school={selectedSchool}
            posts={posts}
            userState={userState}
            isAdmin={isAdmin}
            onEditSchool={(school) => setEditingSchool(school)}
            onSelectSchool={setSelectedSchool}
            currentUserId={currentUserId}
            myPostIds={myPostIds}
            onSelectPost={(post) => {
              setSelectedPost(post);
              setActiveTab('post_detail');
            }}
            onToggleLike={handleToggleLike}
            onToggleHug={handleToggleHug}
            onToggleSave={handleToggleSave}
            onSharePost={(post) => setSharingPost(post)}
            onEditPost={(post, e) => {
              if (e) e.stopPropagation();
              if (isAdmin || isUserAuthor(post)) {
                setEditingPost(post);
              }
            }}
            onDeletePost={(postId, e) => {
              if (e) e.stopPropagation();
              const target = posts.find(p => p.id === postId);
              if (target && (isAdmin || isUserAuthor(target))) {
                handleDeletePost(postId, e);
              }
            }}
            onConnectWithAuthor={handleConnectWithAuthor}
            onOpenGlobe={(school) => {
              if (school) setSelectedSchool(school);
              setActiveTab('globe');
            }}
            openComposer={() => setIsComposerOpen(true)}
            openVerify={() => setIsVerifyOpen(true)}
            openPeerMentorModal={() => setIsPeerMentorModalOpen(true)}
            openDirectChatWithPeer={handleOpenDirectChatWithPeer}
            onViewPublicProfile={(target) => setPublicProfileTarget(target)}
            appointments={appointments}
            mentorApplications={mentorApplications}
            onScheduleAppointment={handleScheduleAppointment}
          />
        )}

        {activeTab === 'globe' && (
          <CampusGlobeView
            schools={schools}
            selectedSchool={selectedSchool}
            posts={posts}
            userState={userState}
            theme={theme}
            onSelectSchool={(school) => {
              setSelectedSchool(school);
            }}
            onBackToFeed={() => setActiveTab('feed')}
            openVerify={() => setIsVerifyOpen(true)}
            openComposer={() => setIsComposerOpen(true)}
          />
        )}

        {activeTab === 'post_detail' && selectedPost && (
          <PostDetailView
            post={selectedPost}
            userState={userState}
            onBack={() => setActiveTab('feed')}
            onToggleLike={handleToggleLike}
            onToggleHug={handleToggleHug}
            onToggleSave={handleToggleSave}
            onSharePost={(post) => setSharingPost(post)}
            onAddReply={handleAddReply}
            onRequestAIReply={handleRequestAIReply}
            onEditPost={(isAdmin || isUserAuthor(selectedPost)) ? (post) => setEditingPost(post) : undefined}
            onDeletePost={(isAdmin || isUserAuthor(selectedPost)) ? (postId) => handleDeletePost(postId) : undefined}
            onOpenAmbientModal={() => setIsAmbientModalOpen(true)}
            onOpenProfile={() => setActiveTab('profile')}
            onOpenLogin={handleGoogleSignIn}
            onOpenPeerMentorModal={() => setIsPeerMentorModalOpen(true)}
            onConnectWithAuthor={handleConnectWithAuthor}
            onOpenRatingModal={(listenerName, postId) => {
              setRatingTarget({ listenerName, postId });
            }}
            onOpenReportModal={(listenerName, postId) => {
              setReportTarget({ listenerName, postId });
            }}
            onViewPublicProfile={(target) => setPublicProfileTarget(target)}
            onScheduleAppointment={handleScheduleAppointment}
            isAuthor={isUserAuthor(selectedPost)}
            appointments={appointments}
            mentorApplications={mentorApplications}
          />
        )}

        {activeTab === 'messages' && (
          <DirectMessagesView
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={(id) => setActiveThreadId(id)}
            onSendMessage={handleSendDirectMessage}
            typingThreadId={typingThreadId}
            onStartNewPeerChat={handleStartNewPeerChat}
            onOpenRelatedPost={handleOpenRelatedPost}
            onDeleteThread={handleDeleteThread}
            onRevokeMessage={handleRevokeMessage}
            onDeleteMessageForMe={handleDeleteMessageForMe}
            onEditMessage={handleEditMessage}
            onClearThreadHistory={handleClearThreadHistory}
            onOpenRatingModal={(listenerName, threadId) => {
              setRatingTarget({ listenerName, threadId });
            }}
            onOpenReportModal={(listenerName, threadId) => {
              setReportTarget({ listenerName, threadId });
            }}
            onScheduleAppointment={handleScheduleAppointment}
            userState={userState}
            appointments={appointments}
            mentorApplications={mentorApplications}
          />
        )}

        {(activeTab === 'profile' || activeTab === 'verify') && (
          <ProfileView
            userState={userState}
            setUserState={setUserState}
            setActiveTab={setActiveTab}
            savedPosts={savedPosts}
            onOpenVerify={() => setIsVerifyOpen(true)}
            onOpenPeerMentorModal={() => setIsPeerMentorModalOpen(true)}
            onOpenLogin={handleGoogleSignIn}
            onSignOut={handleSignOut}
            onRemoveSchoolVerification={handleRemoveSchoolVerification}
            onResetAllVerifications={handleResetAllVerifications}
            onSelectPost={(post) => {
              setSelectedPost(post);
              setActiveTab('post_detail');
            }}
            onToggleLike={handleToggleLike}
            onToggleHug={handleToggleHug}
            onToggleSave={handleToggleSave}
            onSharePost={(post) => setSharingPost(post)}
            onConnectWithAuthor={handleConnectWithAuthor}
          />
        )}

        {isAdmin && (activeTab === 'mentor_dashboard' || activeTab === 'moderation_queue') && (
          <MentorDashboard
            posts={posts}
            onApprovePost={(postId) => {
              setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'approved' } : p));
            }}
            onRejectPost={(postId) => {
              setPosts(prev => prev.filter(p => p.id !== postId));
            }}
            onMentorReplyToPost={(postId, text) => {
              const replyObj: Reply = {
                id: `reply-mentor-${Date.now()}`,
                postId: postId,
                authorName: 'ThS. Tâm lý Minh Đức',
                authorRole: 'expert',
                isVerifiedBadge: true,
                timestamp: 'Vừa xong',
                createdAt: Date.now(),
                content: text,
                hugsCount: 2
              };
              const targetP = posts.find(p => p.id === postId);
              const currentR = targetP && Array.isArray(targetP.replies) ? targetP.replies : [];
              const updatedR = [...currentR, replyObj];
              
              setPosts(prev => prev.map(p => p.id === postId ? {
                ...p,
                repliesCount: updatedR.length,
                replies: updatedR
              } : p));

              addReplyToPostInFirestore(postId, replyObj, updatedR, targetP).catch(err => {
                console.error('Mentor reply Firestore sync error:', err);
              });
            }}
            applications={mentorApplications}
            onApproveApplication={handleApproveMentorApplication}
            onRejectApplication={handleRejectMentorApplication}
            reports={listenerReports}
            onResolveReport={handleResolveReport}
            appointments={appointments}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onDeleteAppointment={handleDeleteAppointment}
            onCreateAppointment={handleScheduleAppointment}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openComposer={() => setIsComposerOpen(true)}
      />

      {/* Modals & Overlays */}
      <ComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        schools={schools}
        defaultSchool={selectedSchool}
        isLoggedIn={userState.isLoggedIn}
        userState={userState}
        onOpenLogin={handleGoogleSignIn}
        onOpenProfile={() => {
          setIsComposerOpen(false);
          setActiveTab('profile');
        }}
        onOpenVerify={() => {
          setIsComposerOpen(false);
          setIsVerifyOpen(true);
        }}
        onSubmitPost={handleCreatePost}
      />

      <SchoolVerifyModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        schools={schools}
        userState={userState}
        onCompleteVerification={(school, verificationData) => {
          const existingSchool = schools.find(s => s.id === school.id || s.name.toLowerCase().trim() === school.name.toLowerCase().trim());
          const updatedSchool: School = {
            ...school,
            ...(existingSchool || {}),
            name: existingSchool?.name || school.name,
            logoUrl: existingSchool?.logoUrl || school.logoUrl,
            coverUrl: existingSchool?.coverUrl || school.coverUrl,
            verifiedCount: Math.max((existingSchool?.verifiedCount || school.verifiedCount || 0) + 1, 1)
          };
          setSelectedSchool(updatedSchool);
          setActiveTab('feed');
          setSchools(prev => {
            if (!prev.some(s => s.id === updatedSchool.id)) {
              return [...prev, updatedSchool];
            }
            return prev.map(s => s.id === updatedSchool.id ? { ...s, ...updatedSchool, logoUrl: s.logoUrl || updatedSchool.logoUrl } : s);
          });
          updateSchoolInFirestore(updatedSchool.id, updatedSchool).catch(err => {
            console.warn('Persist verified school error:', err);
          });
          setUserState(prev => {
            const currentList = prev.verifiedSchools || (prev.selectedSchool ? [prev.selectedSchool] : []);
            const alreadyVerified = currentList.some(s => s.id === updatedSchool.id);
            const newList = alreadyVerified ? currentList.map(s => s.id === updatedSchool.id ? updatedSchool : s) : [...currentList, updatedSchool];
            
            const aiData = verificationData?.aiResult || {};
            const extractedName = aiData.extractedStudentName || prev.verifiedFullName || prev.displayName;
            const extractedMajor = aiData.extractedMajor || prev.verifiedMajor;
            const extractedCohort = aiData.extractedCohort || verificationData?.aiResult?.cohort || prev.verifiedCohort;

            const updatedVerifications = {
              ...(prev.schoolVerifications || {}),
              [updatedSchool.id]: {
                schoolId: updatedSchool.id,
                schoolName: updatedSchool.name,
                schoolType: updatedSchool.type,
                verifiedAt: Date.now(),
                method: verificationData?.method || 'gemini_ocr',
                role: verificationData?.role || 'student',
                emailUsed: verificationData?.emailUsed,
                studentName: extractedName,
                major: extractedMajor,
                cohort: extractedCohort,
                studentIdMasked: aiData.extractedStudentId,
                isIdentityLocked: true
              }
            };

            const updatedCohorts = {
              ...(prev.schoolCohorts || {}),
              ...(extractedCohort ? { [updatedSchool.id]: extractedCohort } : {})
            };

            const updatedState: UserState = {
              ...prev,
              verificationStatus: 'verified',
              selectedSchool: updatedSchool,
              verifiedSchools: newList,
              schoolVerifications: updatedVerifications,
              schoolCohorts: updatedCohorts,
              // Strictly preserve user custom avatar and display profile settings
              customAvatarUrl: prev.customAvatarUrl,
              displayName: prev.displayName || extractedName || 'Học sinh / Sinh viên',
              verifiedFullName: extractedName || prev.verifiedFullName,
              verifiedMajor: extractedMajor || prev.verifiedMajor,
              verifiedCohort: extractedCohort || prev.verifiedCohort,
              defaultCohort: extractedCohort || prev.defaultCohort,
              isIdentityLocked: true,
              reputationScore: calculateReputationScore(true, prev.hugsReceivedCount || 0),
              lastCloudSyncTimestamp: Date.now()
            };

            // Trigger cloud Firestore sync
            if (prev.googleUser?.uid) {
              syncUserSchoolVerificationInFirestore(prev.googleUser.uid, {
                verifiedSchools: newList,
                selectedSchool: updatedSchool,
                verificationStatus: 'verified',
                schoolVerifications: updatedVerifications,
                displayName: prev.displayName || extractedName || 'Học sinh / Sinh viên',
                customAvatarUrl: prev.customAvatarUrl,
                verifiedFullName: extractedName || prev.verifiedFullName,
                verifiedMajor: extractedMajor || prev.verifiedMajor,
                verifiedCohort: extractedCohort || prev.verifiedCohort,
                defaultCohort: extractedCohort || prev.defaultCohort,
                schoolCohorts: updatedCohorts,
                isIdentityLocked: true,
                reputationScore: calculateReputationScore(true, prev.hugsReceivedCount || 0)
              });
            }

            return updatedState;
          });
        }}
      />

      <PeerMentorModal
        isOpen={isPeerMentorModalOpen}
        onClose={() => setIsPeerMentorModalOpen(false)}
        userState={userState}
        setUserState={setUserState}
        schools={schools}
        onSaveApplication={handleSaveMentorApplication}
      />

      <EmergencyDrawer
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      <EditPostModal
        isOpen={!!editingPost}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleUpdatePost}
      />

      <ShareModal
        post={sharingPost}
        isOpen={!!sharingPost}
        onClose={() => setSharingPost(null)}
      />

      {editingSchool && (
        <EditSchoolModal
          isOpen={!!editingSchool}
          school={editingSchool}
          onClose={() => setEditingSchool(null)}
          onSave={handleUpdateSchool}
          onDelete={handleDeleteSchool}
        />
      )}

      <AmbientSoundModal
        isOpen={isAmbientModalOpen}
        onClose={() => setIsAmbientModalOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearAll={handleClearAllNotifications}
        onSelectNotification={handleSelectNotification}
      />

      <HealingFeedbackModal
        isOpen={isHealingModalOpen}
        onClose={() => setIsHealingModalOpen(false)}
        notes={healingNotes}
        onAddNote={handleAddHealingNote}
        onLikeNote={handleLikeHealingNote}
        currentSchool={selectedSchool}
        userState={userState}
      />

      {/* Healing Rating Feedback Modal */}
      {ratingTarget && (
        <ListenerRatingModal
          isOpen={!!ratingTarget}
          onClose={() => setRatingTarget(null)}
          listenerName={ratingTarget.listenerName}
          threadId={ratingTarget.threadId}
          postId={ratingTarget.postId}
          senderAnonId={userState.displayName || 'Bạn Ẩn Danh'}
          onSubmitRating={handleSubmitRating}
        />
      )}

      {/* Listener Report / Flag Modal */}
      {reportTarget && (
        <ListenerReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          listenerName={reportTarget.listenerName}
          threadId={reportTarget.threadId}
          postId={reportTarget.postId}
          reporterAnonId={userState.displayName || 'Bạn Ẩn Danh'}
          onSubmitReport={handleSubmitReport}
        />
      )}

      {/* Public Profile Modal for Real-Identity / Verified Users */}
      {publicProfileTarget && (
        <PublicProfileModal
          isOpen={!!publicProfileTarget}
          onClose={() => setPublicProfileTarget(null)}
          target={publicProfileTarget}
          currentUserState={userState}
          allPublicPosts={posts}
          onSelectPost={(p) => {
            setPublicProfileTarget(null);
            setSelectedPost(p);
            setActiveTab('post_detail');
          }}
          onToggleLike={handleToggleLike}
          onToggleHug={handleToggleHug}
          onToggleSave={handleToggleSave}
          onConnectWithAuthor={(peerName, peerRole, schoolName) => {
            setPublicProfileTarget(null);
            handleOpenDirectChatWithPeer(peerName, peerRole === 'expert' ? 'Chuyên gia tư vấn' : peerRole === 'peer_listener' ? 'Người lắng nghe' : 'Thành viên trường');
          }}
          onOpenReportModal={(targetName) => {
            setPublicProfileTarget(null);
            setReportTarget({ listenerName: targetName });
          }}
        />
      )}
    </div>
  );
}
