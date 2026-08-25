import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  School, 
  Post, 
  DirectThread, 
  UserState, 
  Reply 
} from './types';
import { PUBLIC_GLOBAL_SCHOOL, INITIAL_POSTS, INITIAL_THREADS } from './data/mockData';
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
import { calculateReputationScore } from './lib/reputationUtils';
import {
  fetchAllPostsFromFirestore,
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
  FirestoreThreadDoc,
  FirestoreMessageItem
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

  const [schools, setSchools] = useState<School[]>([]);
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

  // Persist activeTab to localStorage
  useEffect(() => {
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

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
  
  // Threads state with persistence across reloads
  const [threads, setThreads] = useState<DirectThread[]>(() => {
    try {
      const saved = localStorage.getItem('lantern_direct_threads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy mock demo threads (keep AI companion and real custom threads)
          const filtered = parsed.filter((t: DirectThread) => 
            t.id === 'thread-ai-companion' || 
            t.id.startsWith('thread-custom-') || 
            (t.id.startsWith('thread-author-') && t.id !== 'thread-author-p1')
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
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);

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
          const isVerified = parsed.verificationStatus === 'verified';
          const hugsRec = parsed.hugsReceivedCount || 0;
          return {
            ...parsed,
            reputationScore: parsed.reputationScore ?? calculateReputationScore(isVerified, hugsRec),
            selectedSchool: parsed.selectedSchool || (parsed.verifiedSchools?.[0] || PUBLIC_GLOBAL_SCHOOL),
            verifiedSchools: Array.isArray(parsed.verifiedSchools) ? parsed.verifiedSchools : []
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
      schoolVerifications: {}
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

  // Real-time listener for Direct Message Threads from Firestore
  useEffect(() => {
    const userAnonNumber = userState.userAnonNumber || 100;
    const unsubscribeThreads = listenToDirectThreadsFromFirestore(
      currentUserId,
      userDisplayName,
      userAnonNumber,
      myPostIds,
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

          if (!firestoreThreads || firestoreThreads.length === 0) {
            return prev.length > 0 ? prev : [aiThread];
          }

          const map = new Map<string, DirectThread>();
          map.set(aiThread.id, aiThread);

          firestoreThreads.forEach(ft => {
            map.set(ft.id, ft);
          });

          return Array.from(map.values());
        });
      }
    );

    return () => {
      if (unsubscribeThreads) unsubscribeThreads();
    };
  }, [currentUserId, userDisplayName, userState.userAnonNumber, myPostIds]);

  // Load posts and listen to schools from Firestore on mount
  useEffect(() => {
    fetchAllPostsFromFirestore().then((firestorePosts) => {
      setPosts(firestorePosts || []);
    }).catch(err => {
      console.warn('Could not load Firestore posts:', err);
      setPosts([]);
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

    return () => {
      if (unsubscribeSchools) unsubscribeSchools();
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
    }
  };

  // Seed default universities and high schools to Firestore
  const handleSeedDefaultSchools = async () => {
    try {
      await seedDefaultSchoolsToFirestore(true);
    } catch (err) {
      console.error('Failed to seed default schools to Firestore:', err);
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

  const handleGoogleSignIn = async () => {
    try {
      const user = await loginWithGoogle();
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
    imageUrl?: string;
    imageAnalysis?: any;
    expiryDurationDays?: number;
    isAnonymousGuest?: boolean;
    isIdentityPublic?: boolean;
    authorDisplayName?: string;
    authorAvatarUrl?: string;
    authorCohort?: string;
  }) => {
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

      const result = await response.json();

      if (!result.isSafe) {
        return {
          isSafe: false,
          flagReason: result.flagReason,
          suggestion: result.suggestion,
          crisisDetected: result.crisisDetected
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
        authorAnonId: postData.authorAnonId || `Người dùng ẩn danh #${Math.floor(100 + Math.random() * 899)}`,
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
        repliesCount: result.comfortMessage ? 1 : 0,
        isLiked: false,
        isHugged: true,
        status: 'approved',
        isPublic: postData.isPublic ?? false,
        imageUrl: postData.imageUrl,
        imageAnalysis: postData.imageAnalysis,
        isIdentityPublic: postData.isIdentityPublic,
        authorDisplayName: postData.authorDisplayName,
        authorAvatarUrl: postData.authorAvatarUrl,
        authorCohort: postData.authorCohort,
        replies: result.comfortMessage ? [
          {
            id: `reply-ai-${Date.now()}`,
            postId: generatedPostId,
            authorName: 'Ngọn Đèn Thấu Hiểu (AI Companion)',
            authorRole: 'ai_lantern',
            isVerifiedBadge: true,
            authorReputationScore: 99,
            timestamp: 'Vừa xong',
            createdAt: Date.now(),
            content: result.comfortMessage,
            hugsCount: 1,
            isHugged: true
          }
        ] : []
      };

      setPosts([newPost, ...posts]);
      setMyPostIds(prev => [...prev, generatedPostId]);

      // Async write to Firestore
      createPostInFirestore(newPost).catch(err => {
        console.warn('Firestore write warning:', err);
      });
      
      // Switch to feed for that school or global
      if (postData.isPublic) {
        setSelectedSchool({
          id: 'global',
          name: 'Sảnh Chung Công Khai',
          slug: 'global',
          location: 'Toàn quốc',
          verifiedCount: 1200,
          letterCount: posts.filter(p => p.isPublic).length + 1,
          newCount: 42
        });
      } else {
        const targetSchool = schools.find(s => s.id === postData.schoolId) || selectedSchool;
        setSelectedSchool(targetSchool);
      }
      setActiveTab('feed');

      return { isSafe: true };
    } catch (err) {
      console.error('Create Post Error:', err);
      return { isSafe: true };
    }
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

        setPosts(prevPosts => prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              repliesCount: p.repliesCount + 1,
              replies: [...p.replies, aiReply]
            };
          }
          return p;
        }));

        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            repliesCount: prev.repliesCount + 1,
            replies: [...prev.replies, aiReply]
          } : null);
        }
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
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          title: updateData.title,
          content: updateData.content,
          tags: updateData.tags,
          isPublic: updateData.isPublic
        };
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

    // Sync to Firestore
    updatePostInFirestore(postId, updateData).catch(err => {
      console.warn('Firestore update post error:', err);
    });
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
    }
  ) => {
    const targetPost = posts.find(p => p.id === postId) || (selectedPost?.id === postId ? selectedPost : null);
    const isOP = targetPost ? isUserAuthor(targetPost) : false;

    let authorName = '';
    if (replyOptions?.isIdentityPublic && replyOptions.authorDisplayName) {
      authorName = replyOptions.authorDisplayName;
    } else if (isOP && targetPost) {
      // Retain the exact anonymous post identity when OP comments
      authorName = targetPost.authorAnonId;
    } else {
      // Generate consistent per-thread commenter alias (e.g. #412) without leaking identity across posts
      const seedStr = `${currentUserId || 'guest'}_${postId}`;
      let hash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        hash = (hash * 31 + seedStr.charCodeAt(i)) & 0xffffff;
      }
      const commenterNum = (Math.abs(hash) % 899) + 100;
      authorName = `Người gửi ẩn danh #${commenterNum}`;
    }

    const newReply: Reply = {
      id: `reply-${Date.now()}`,
      postId: postId,
      authorUid: currentUserId,
      authorName: authorName,
      authorRole: 'student',
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
      authorCohort: replyOptions?.authorCohort
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updatedReplies = [...p.replies, newReply];
        addReplyToPostInFirestore(postId, newReply, updatedReplies).catch(err => {
          console.warn('Firestore sync reply error:', err);
        });
        return {
          ...p,
          repliesCount: p.repliesCount + 1,
          replies: updatedReplies
        };
      }
      return p;
    }));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        repliesCount: prev.repliesCount + 1,
        replies: [...prev.replies, newReply]
      } : null);
    }
  };

  // Direct Chat send message with Firestore Real-time Sync
  const handleSendDirectMessage = async (threadId: string, text: string) => {
    const targetThread = threads.find(t => t.id === threadId);
    const newMsgId = `m-${Date.now()}`;
    const newMsgItem: FirestoreMessageItem = {
      id: newMsgId,
      senderId: currentUserId,
      senderName: userDisplayName,
      senderRole: userState.userRole || 'student',
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
        setThreads(prev => [newThread, ...prev]);
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

    const newThreadMeta: FirestoreThreadDoc = {
      id: newThreadId,
      participants: [currentUserId, authorId],
      participantNames: {
        [currentUserId]: userDisplayName,
        [authorId]: post.authorAnonId
      },
      peerName: `Tác giả ẩn danh (${post.authorAnonId})`,
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
      ...prev
    ]);
    setActiveThreadId(newThreadId);
    setActiveTab('messages');
  };

  // Open Direct Chat with Peer Listener or Mentor
  const handleOpenDirectChatWithPeer = async (peerName: string, roleTitle: string) => {
    const existing = threads.find(t => t.peerName === peerName);
    if (existing) {
      setActiveThreadId(existing.id);
    } else {
      const newThreadId = `thread-peer-${Date.now()}`;
      const isExpert = peerName.includes('Cô') || peerName.includes('Dr.') || peerName.includes('ThS.') || peerName.includes('Chuyên gia');
      
      const initMsg: FirestoreMessageItem = {
        id: `m-peer-init-${Date.now()}`,
        senderId: 'peer-listener',
        senderName: peerName,
        senderRole: isExpert ? 'expert' : 'peer_listener',
        text: `Chào bạn! Mình là ${peerName}. Mình rất vui được ngồi đây lắng nghe những tâm sự của bạn 🌿`,
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

      setThreads(prev => [
        {
          ...newThreadMeta,
          messages: [{
            ...initMsg,
            isMe: false
          }]
        } as DirectThread,
        ...prev
      ]);
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
    setThreads(prev => prev.filter(t => t.id !== threadId));
    deleteDirectThreadFromFirestore(threadId).catch(err => console.warn('Delete thread error:', err));
    if (activeThreadId === threadId) {
      const remaining = threads.filter(t => t.id !== threadId);
      if (remaining.length > 0) {
        setActiveThreadId(remaining[0].id);
      }
    }
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
        isDesktopCollapsed={isSidebarCollapsed}
        setIsDesktopCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Router */}
      <main className={`flex-1 min-w-0 overflow-x-hidden ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'} min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0 transition-all duration-300`}>
        {activeTab === 'landing' && (
          <LandingPage
            schools={schools}
            onSelectSchool={(school) => {
              setSelectedSchool(school);
              setActiveTab('feed');
            }}
            setActiveTab={setActiveTab}
            openComposer={() => setIsComposerOpen(true)}
            openEmergency={() => setIsEmergencyOpen(true)}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreView
            schools={schools}
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
              if (isUserAuthor(post)) {
                setEditingPost(post);
              }
            }}
            onDeletePost={(postId, e) => {
              if (e) e.stopPropagation();
              const target = posts.find(p => p.id === postId);
              if (target && isUserAuthor(target)) {
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
            openDirectChatWithPeer={handleOpenDirectChatWithPeer}
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
            onEditPost={isUserAuthor(selectedPost) ? (post) => setEditingPost(post) : undefined}
            onDeletePost={isUserAuthor(selectedPost) ? (postId) => handleDeletePost(postId) : undefined}
            onOpenAmbientModal={() => setIsAmbientModalOpen(true)}
            onOpenProfile={() => setActiveTab('profile')}
            onOpenLogin={handleGoogleSignIn}
            onConnectWithAuthor={handleConnectWithAuthor}
            isAuthor={isUserAuthor(selectedPost)}
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
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            userState={userState}
            setUserState={setUserState}
            setActiveTab={setActiveTab}
            savedPosts={savedPosts}
            onOpenVerify={() => setIsVerifyOpen(true)}
            onOpenLogin={handleGoogleSignIn}
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
              setPosts(prev => prev.map(p => p.id === postId ? {
                ...p,
                repliesCount: p.repliesCount + 1,
                replies: [...p.replies, replyObj]
              } : p));
            }}
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
        onOpenLogin={handleGoogleSignIn}
        onSubmitPost={handleCreatePost}
      />

      <SchoolVerifyModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        schools={schools}
        userState={userState}
        onCompleteVerification={(school, verificationData) => {
          setSelectedSchool(school);
          setActiveTab('feed');
          setSchools(prev => {
            if (!prev.some(s => s.id === school.id)) {
              return [...prev, school];
            }
            return prev;
          });
          updateSchoolInFirestore(school.id, school).catch(err => {
            console.warn('Persist verified school error:', err);
          });
          setUserState(prev => {
            const currentList = prev.verifiedSchools || (prev.selectedSchool ? [prev.selectedSchool] : []);
            const alreadyVerified = currentList.some(s => s.id === school.id);
            const newList = alreadyVerified ? currentList : [...currentList, school];
            
            const aiData = verificationData?.aiResult || {};
            const extractedName = aiData.extractedStudentName || prev.verifiedFullName || prev.displayName;
            const extractedMajor = aiData.extractedMajor || prev.verifiedMajor;
            const extractedCohort = aiData.extractedCohort || verificationData?.aiResult?.cohort || prev.verifiedCohort;

            const updatedVerifications = {
              ...(prev.schoolVerifications || {}),
              [school.id]: {
                schoolId: school.id,
                schoolName: school.name,
                schoolType: school.type,
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
              ...(extractedCohort ? { [school.id]: extractedCohort } : {})
            };

            const updatedState: UserState = {
              ...prev,
              verificationStatus: 'verified',
              selectedSchool: school,
              verifiedSchools: newList,
              schoolVerifications: updatedVerifications,
              schoolCohorts: updatedCohorts,
              // Fixed & locked identity
              displayName: extractedName || prev.displayName || 'Học sinh / Sinh viên',
              verifiedFullName: extractedName,
              verifiedMajor: extractedMajor,
              verifiedCohort: extractedCohort,
              defaultCohort: extractedCohort || prev.defaultCohort,
              isIdentityLocked: true,
              reputationScore: calculateReputationScore(true, prev.hugsReceivedCount || 0),
              lastCloudSyncTimestamp: Date.now()
            };

            // Trigger cloud Firestore sync
            if (prev.googleUser?.uid) {
              syncUserSchoolVerificationInFirestore(prev.googleUser.uid, {
                verifiedSchools: newList,
                selectedSchool: school,
                verificationStatus: 'verified',
                schoolVerifications: updatedVerifications
              });
            }

            return updatedState;
          });
        }}
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
    </div>
  );
}
