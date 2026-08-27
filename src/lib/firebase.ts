import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { Post, Reply, UserState, School } from '../types';
import { INITIAL_SCHOOLS } from '../data/mockData';

// Initialize Firebase
const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with forced long polling to prevent WebSocket connection timeout errors in iframe environments
const dbId = firebaseConfigData.firestoreDatabaseId || '(default)';
export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, dbId);
  } catch (e) {
    return getFirestore(app, dbId);
  }
})();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test helper
async function testFirestoreConnection() {
  try {
    const testPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 4000)
    );
    await Promise.race([testPromise, timeoutPromise]);
  } catch (error) {
    // Quietly log offline or timeout mode
    console.log("Firestore connection active in offline/resilient mode.");
  }
}
testFirestoreConnection();

// Auth Helpers
export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create/update user document in Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        const anonNumber = Math.floor(100 + Math.random() * 900);
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Người dùng Google',
          photoURL: user.photoURL || '',
          userAnonNumber: anonNumber,
          verificationStatus: 'unverified',
          selectedSchoolId: 'school-1',
          selectedSchoolName: 'THPT Nguyễn Du',
          hugsGivenCount: 0,
          userRole: 'student',
          verifiedSchoolIds: [],
          verifiedSchools: [],
          schoolVerifications: {},
          lastSyncedAt: Date.now(),
          createdAt: Date.now()
        });
      }
    } catch (dbErr) {
      console.warn('Could not sync user profile to Firestore:', dbErr);
    }
    return user;
  } catch (err: any) {
    const errorCode = err?.code || '';
    if (
      errorCode === 'auth/user-cancelled' ||
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request'
    ) {
      console.log('Google Sign-in closed or canceled by user.');
      return null;
    }
    
    if (errorCode === 'auth/popup-blocked') {
      console.warn('Google sign-in popup was blocked by browser. Please allow popups for this site.');
      return null;
    }
    
    console.warn('Google Sign-In notice:', err?.message || err);
    return null;
  }
};

export const syncUserSchoolVerificationInFirestore = async (
  uid: string,
  data: {
    verifiedSchools?: School[];
    selectedSchool?: School;
    verificationStatus?: 'verified' | 'unverified' | 'pending';
    schoolVerifications?: Record<string, any>;
    displayName?: string;
    verifiedFullName?: string;
    verifiedMajor?: string;
    verifiedCohort?: string;
    defaultCohort?: string;
    schoolCohorts?: Record<string, string>;
    isIdentityLocked?: boolean;
    customAvatarUrl?: string;
    reputationScore?: number;
  }
) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      sanitizeForFirestore({
        ...data,
        lastSyncedAt: Date.now()
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('Sync user school verification to Firestore warning:', err);
  }
};

export const loadUserProfileFromFirestore = async (uid: string) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('Load user profile from Firestore warning:', err);
    return null;
  }
};

export const loginAnonymously = async (): Promise<User | null> => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err: any) {
    console.warn('Anonymous Sign-In notice:', err?.message || err);
    return null;
  }
};

export const logout = async () => {
  await firebaseSignOut(auth);
};

// Firestore Post Operations
export const fetchAllPostsFromFirestore = async (): Promise<Post[]> => {
  try {
    const postsRef = collection(db, 'posts');
    
    // Add a 5-second timeout fallback to prevent blocking UI if network hangs
    const fetchPromise = getDocs(postsRef);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Fetch posts timeout')), 5000)
    );
    
    const snap = await Promise.race([fetchPromise, timeoutPromise]);
    if (snap.empty) {
      return [];
    }
    const posts: Post[] = [];
    const now = Date.now();
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      // Skip any previously seeded legacy mock post IDs if present
      if (docSnap.id.startsWith('post-') && data.authorAnonId === 'Người dùng ẩn danh #492') {
        try {
          deleteDoc(doc(db, 'posts', docSnap.id)).catch(() => {});
        } catch (_) {}
        return;
      }

      // Check if post is expired (e.g. 24h, 7 days, 14 days, or guest post > 14 days)
      const hasExpired = (data.expiresAt && now > data.expiresAt) || 
                        (data.isAnonymousGuest && data.createdAt && (now - data.createdAt > FOURTEEN_DAYS_MS));

      if (hasExpired) {
        // Auto-purge from Firestore to save storage & protect privacy
        try {
          deleteDoc(doc(db, 'posts', docSnap.id)).catch(() => {});
        } catch (_) {}
        return;
      }

      const createdAt = data.createdAt || (docSnap.id.match(/\b(17\d{10,12})\b/) ? parseInt(docSnap.id.match(/\b(17\d{10,12})\b/)![1], 10) : undefined);
      const replies = Array.isArray(data.replies) ? data.replies : [];
      const repliesCount = typeof data.repliesCount === 'number' ? data.repliesCount : replies.length;

      posts.push({
        id: docSnap.id,
        ...data,
        replies,
        repliesCount,
        createdAt: createdAt || data.createdAt
      } as Post);
    });
    return posts.sort((a, b) => ((b.createdAt || 0) - (a.createdAt || 0)));
  } catch (err) {
    console.warn('Fetch posts from Firestore:', err);
    return [];
  }
};

export const listenToPostsFromFirestore = (callback: (posts: Post[]) => void) => {
  const postsRef = collection(db, 'posts');
  return onSnapshot(postsRef, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const posts: Post[] = [];
    const now = Date.now();
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (docSnap.id.startsWith('post-') && data.authorAnonId === 'Người dùng ẩn danh #492') {
        return;
      }

      const hasExpired = (data.expiresAt && now > data.expiresAt) || 
                        (data.isAnonymousGuest && data.createdAt && (now - data.createdAt > FOURTEEN_DAYS_MS));

      if (hasExpired) {
        return;
      }

      const createdAt = data.createdAt || (docSnap.id.match(/\b(17\d{10,12})\b/) ? parseInt(docSnap.id.match(/\b(17\d{10,12})\b/)![1], 10) : undefined);
      const replies = Array.isArray(data.replies) ? data.replies : [];
      const repliesCount = typeof data.repliesCount === 'number' ? data.repliesCount : replies.length;

      posts.push({
        id: docSnap.id,
        ...data,
        replies,
        repliesCount,
        createdAt: createdAt || data.createdAt
      } as Post);
    });
    callback(posts.sort((a, b) => ((b.createdAt || 0) - (a.createdAt || 0))));
  }, (err) => {
    console.warn('Listen to posts from Firestore error:', err);
  });
};

// Helper to strip undefined values before passing objects to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export const createPostInFirestore = async (newPost: Post) => {
  try {
    const postRef = doc(db, 'posts', newPost.id);
    const sanitizedData = sanitizeForFirestore({
      ...newPost,
      replies: Array.isArray(newPost.replies) ? newPost.replies : [],
      repliesCount: newPost.replies ? newPost.replies.length : 0,
      createdAt: newPost.createdAt || Date.now()
    });
    await setDoc(postRef, sanitizedData, { merge: true });
    return newPost.id;
  } catch (err) {
    console.error('Create post error:', err);
    throw err;
  }
};

export const updatePostStatusInFirestore = async (postId: string, status: 'approved' | 'flagged' | 'rejected', flagReason?: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await setDoc(postRef, {
      status,
      flagReason: flagReason || null
    }, { merge: true });
  } catch (err) {
    console.error('Update post status error:', err);
  }
};

export const addReplyToPostInFirestore = async (postId: string, newReply: Reply, updatedReplies: Reply[]) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const sanitizedReplies = sanitizeForFirestore(updatedReplies);
    await setDoc(postRef, {
      replies: sanitizedReplies,
      repliesCount: updatedReplies.length,
      lastReplyAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Add reply error:', err);
    throw err;
  }
};

export const toggleLikePostInFirestore = async (postId: string, isLiked: boolean) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await setDoc(postRef, {
      likesCount: increment(isLiked ? 1 : -1)
    }, { merge: true });
  } catch (err) {
    console.error('Toggle like error:', err);
  }
};

export const toggleHugPostInFirestore = async (postId: string, isHugged: boolean) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await setDoc(postRef, {
      hugsCount: increment(isHugged ? 1 : -1)
    }, { merge: true });
  } catch (err) {
    console.error('Toggle hug error:', err);
  }
};

export const updatePostInFirestore = async (postId: string, updateData: { title: string; content: string; tags: string[]; isPublic?: boolean }) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await setDoc(postRef, {
      title: updateData.title,
      content: updateData.content,
      tags: updateData.tags,
      isPublic: updateData.isPublic ?? false,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Update post error:', err);
    throw err;
  }
};

export const deletePostFromFirestore = async (postId: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  } catch (err) {
    console.error('Delete post error:', err);
    throw err;
  }
};

export const DEFAULT_SEEDED_SCHOOLS: School[] = [
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
  }
];

export const seedDefaultSchoolsToFirestore = async (forceOverwrite = false) => {
  try {
    for (const school of DEFAULT_SEEDED_SCHOOLS) {
      const schoolRef = doc(db, 'schools', school.id);
      if (forceOverwrite) {
        await setDoc(schoolRef, sanitizeForFirestore({ ...school, updatedAt: Date.now() }));
      } else {
        await setDoc(schoolRef, sanitizeForFirestore({ ...school, updatedAt: Date.now() }), { merge: true });
      }
    }
    console.log('Seeded default schools to Firestore successfully');
  } catch (err) {
    console.error('Error seeding default schools to Firestore:', err);
    throw err;
  }
};

export const deleteSchoolFromFirestore = async (schoolId: string) => {
  try {
    const schoolRef = doc(db, 'schools', schoolId);
    await deleteDoc(schoolRef);
  } catch (err) {
    console.error('Delete school error:', err);
    throw err;
  }
};

export const updateSchoolInFirestore = async (schoolId: string, updatedFields: Partial<School>) => {
  try {
    const schoolRef = doc(db, 'schools', schoolId);
    await setDoc(schoolRef, sanitizeForFirestore({
      ...updatedFields,
      updatedAt: Date.now()
    }), { merge: true });
  } catch (err) {
    console.error('Update school error:', err);
    throw err;
  }
};

export const listenToSchoolsFromFirestore = (callback: (schools: School[]) => void) => {
  const schoolsRef = collection(db, 'schools');
  return onSnapshot(schoolsRef, (snapshot) => {
    if (!snapshot.empty) {
      const dbSchools: School[] = [];
      snapshot.forEach(docSnap => {
        dbSchools.push({
          id: docSnap.id,
          ...(docSnap.data() as any)
        });
      });
      callback(dbSchools);
    } else {
      // If collection is completely empty, automatically seed initial universities & high schools directly into Firestore
      seedDefaultSchoolsToFirestore(false).then(() => {
        callback(DEFAULT_SEEDED_SCHOOLS);
      }).catch(() => {
        callback([]);
      });
    }
  }, (err) => {
    console.warn('Listen to schools Firestore error:', err);
  });
};

// ==========================================
// FIRESTORE REAL-TIME DIRECT MESSAGING (1-1 P2P CHAT)
// ==========================================

export interface FirestoreMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  createdAt: number;
  isRevoked?: boolean;
  revokedAt?: string;
  editedAt?: string;
  deletedForUsers?: string[];
}

export interface FirestoreThreadDoc {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  peerName: string;
  peerRole: string;
  roleTitle: string;
  isOnline?: boolean;
  statusText?: string;
  threadType?: 'ai' | 'letter_author' | 'peer_listener' | 'expert' | 'p2p';
  relatedPostId?: string;
  relatedPostTitle?: string;
  relatedPostSnippet?: string;
  relatedSchoolName?: string;
  unreadCount?: number;
  messages: FirestoreMessageItem[];
  createdAt: number;
  lastMessageAt: number;
}

export const listenToDirectThreadsFromFirestore = (
  currentUserId: string,
  userDisplayName: string,
  userAnonNumber: number,
  myPostIds: string[],
  callback: (threads: any[]) => void
) => {
  const threadsRef = collection(db, 'direct_threads');

  return onSnapshot(threadsRef, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }

    const firestoreThreads: any[] = [];
    const myAnonName = `Người dùng ẩn danh #${userAnonNumber}`;
    const myAuthorAnonTag = `#${userAnonNumber}`;

    snapshot.forEach(docSnap => {
      const data = docSnap.data() as FirestoreThreadDoc;
      const threadId = docSnap.id;
      const participants = Array.isArray(data.participants) ? data.participants : [];
      const messages = Array.isArray(data.messages) ? data.messages : [];

      // Check if this thread belongs to current user
      const isParticipant = participants.includes(currentUserId) || 
                            participants.some(p => p.includes(String(userAnonNumber)) || p === currentUserId);
      const isRelatedToMyPost = data.relatedPostId ? myPostIds.includes(data.relatedPostId) : false;
      const isMyAuthorThread = data.peerName?.includes(myAuthorAnonTag) || data.roleTitle?.includes(myAuthorAnonTag);

      // Auto-cleanup / Ephemeral expiry: If thread is older than 24h and inactive (lastMessageAt > 24h ago with <= 2 messages)
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      const isExpired24h = data.lastMessageAt && (Date.now() - data.lastMessageAt > TWENTY_FOUR_HOURS_MS) && messages.length <= 2;
      if (isExpired24h && threadId !== 'thread-ai-companion' && data.threadType !== 'ai') {
        // Automatically delete from Firestore to reduce storage load & preserve privacy
        deleteDoc(docSnap.ref).catch(() => {});
        return;
      }

      // If user is a participant or post author or thread is public/demo
      if (isParticipant || isRelatedToMyPost || isMyAuthorThread) {
        // Map messages to include proper isMe flag
        const mappedMessages = messages
          .filter(m => !m.deletedForUsers?.includes(currentUserId))
          .map(m => {
            const isMe = m.senderId === currentUserId || 
                         (m.senderName && (m.senderName === userDisplayName || m.senderName === 'Bạn' || m.senderName === myAnonName));
            return {
              id: m.id,
              senderId: m.senderId,
              senderName: isMe ? 'Bạn' : m.senderName,
              senderRole: m.senderRole || 'student',
              text: m.isRevoked ? 'Tin nhắn đã được thu hồi' : m.text,
              timestamp: m.timestamp || 'Vừa xong',
              createdAt: m.createdAt || Date.now(),
              isMe,
              isRevoked: m.isRevoked,
              revokedAt: m.revokedAt,
              editedAt: m.editedAt
            };
          });

        // Determine peer display name
        let peerDisplayName = data.peerName || 'Người dùng ẩn danh';
        let roleTitle = data.roleTitle || 'Thành viên';
        
        // If current user is the post author, show the sender as peer
        if (isRelatedToMyPost && data.participantNames) {
          const otherUserId = participants.find(p => p !== currentUserId);
          if (otherUserId && data.participantNames[otherUserId]) {
            peerDisplayName = data.participantNames[otherUserId];
            roleTitle = `Người gửi lời an ủi • ${data.relatedSchoolName || 'Campus'}`;
          }
        }

        firestoreThreads.push({
          id: threadId,
          peerName: peerDisplayName,
          peerRole: data.peerRole || 'student',
          roleTitle: roleTitle,
          isOnline: data.isOnline ?? true,
          statusText: data.statusText || 'Đang online',
          unreadCount: data.unreadCount || 0,
          messages: mappedMessages,
          threadType: data.threadType || 'letter_author',
          relatedPostId: data.relatedPostId,
          relatedPostTitle: data.relatedPostTitle,
          relatedPostSnippet: data.relatedPostSnippet,
          relatedSchoolName: data.relatedSchoolName,
          lastMessageAt: data.lastMessageAt || data.createdAt || Date.now()
        });
      }
    });

    // Sort by lastMessageAt descending
    firestoreThreads.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    callback(firestoreThreads);
  }, (err) => {
    console.warn('Listen to direct threads Firestore warning:', err);
  });
};

export const saveOrUpdateDirectThreadInFirestore = async (
  threadId: string,
  threadData: Partial<FirestoreThreadDoc>,
  initialMessage?: FirestoreMessageItem
) => {
  try {
    const threadRef = doc(db, 'direct_threads', threadId);
    const snap = await getDoc(threadRef);

    if (!snap.exists()) {
      const messages = initialMessage ? [initialMessage] : [];
      await setDoc(threadRef, sanitizeForFirestore({
        ...threadData,
        id: threadId,
        messages,
        createdAt: Date.now(),
        lastMessageAt: Date.now()
      }));
    } else {
      const updatePayload: Record<string, any> = {
        lastMessageAt: Date.now()
      };
      if (initialMessage) {
        updatePayload.messages = arrayUnion(sanitizeForFirestore(initialMessage));
      }
      await updateDoc(threadRef, updatePayload);
    }
  } catch (err) {
    console.warn('Save or update direct thread in Firestore warning:', err);
  }
};

export const sendDirectMessageToFirestore = async (
  threadId: string,
  threadMeta: Partial<FirestoreThreadDoc>,
  newMessage: FirestoreMessageItem
) => {
  try {
    const threadRef = doc(db, 'direct_threads', threadId);
    const snap = await getDoc(threadRef);

    if (!snap.exists()) {
      await setDoc(threadRef, sanitizeForFirestore({
        ...threadMeta,
        id: threadId,
        messages: [newMessage],
        createdAt: Date.now(),
        lastMessageAt: Date.now()
      }));
    } else {
      await updateDoc(threadRef, {
        messages: arrayUnion(sanitizeForFirestore(newMessage)),
        lastMessageAt: Date.now()
      });
    }
  } catch (err) {
    console.error('Send direct message to Firestore error:', err);
  }
};

export const revokeDirectMessageInFirestore = async (threadId: string, messageId: string) => {
  try {
    const threadRef = doc(db, 'direct_threads', threadId);
    const snap = await getDoc(threadRef);
    if (!snap.exists()) return;

    const data = snap.data() as FirestoreThreadDoc;
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const updated = messages.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          isRevoked: true,
          revokedAt: timeStr,
          text: 'Tin nhắn đã được thu hồi'
        };
      }
      return m;
    });

    await updateDoc(threadRef, {
      messages: sanitizeForFirestore(updated)
    });
  } catch (err) {
    console.error('Revoke message error:', err);
  }
};

export const editDirectMessageInFirestore = async (threadId: string, messageId: string, newText: string) => {
  try {
    const threadRef = doc(db, 'direct_threads', threadId);
    const snap = await getDoc(threadRef);
    if (!snap.exists()) return;

    const data = snap.data() as FirestoreThreadDoc;
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const updated = messages.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          text: newText,
          editedAt: timeStr
        };
      }
      return m;
    });

    await updateDoc(threadRef, {
      messages: sanitizeForFirestore(updated)
    });
  } catch (err) {
    console.error('Edit message error:', err);
  }
};

export const deleteDirectMessageForMeInFirestore = async (threadId: string, messageId: string, userId: string) => {
  try {
    const threadRef = doc(db, 'direct_threads', threadId);
    const snap = await getDoc(threadRef);
    if (!snap.exists()) return;

    const data = snap.data() as FirestoreThreadDoc;
    const messages = Array.isArray(data.messages) ? data.messages : [];

    const updated = messages.map(m => {
      if (m.id === messageId) {
        const deletedFor = Array.isArray(m.deletedForUsers) ? [...m.deletedForUsers, userId] : [userId];
        return {
          ...m,
          deletedForUsers: deletedFor
        };
      }
      return m;
    });

    await updateDoc(threadRef, {
      messages: sanitizeForFirestore(updated)
    });
  } catch (err) {
    console.error('Delete message for me error:', err);
  }
};

export const deleteDirectThreadFromFirestore = async (threadId: string) => {
  try {
    const threadRef = doc(db, 'direct_threads', threadId);
    await deleteDoc(threadRef);
  } catch (err) {
    console.error('Delete thread error:', err);
  }
};

export const clearDirectThreadHistoryInFirestore = async (threadId: string) => {
  try {
    const threadRef = doc(db, 'direct_threads', threadId);
    await updateDoc(threadRef, {
      messages: []
    });
  } catch (err) {
    console.error('Clear thread history error:', err);
  }
};

