import React, { useState, useRef, useEffect } from 'react';
import { 
  HeartHandshake, 
  Sparkles, 
  Coffee, 
  Flower2, 
  Heart, 
  Leaf, 
  Mail, 
  Send, 
  Search, 
  Trash2, 
  ArrowLeft,
  Bot,
  User,
  GraduationCap,
  MessageSquare,
  Plus,
  X,
  SearchX,
  RefreshCw,
  MoreVertical,
  Eraser,
  MailCheck,
  Copy,
  Pencil,
  Undo2,
  MinusCircle,
  ShieldAlert,
  Video,
  Calendar,
  Volume2,
  VolumeX
} from 'lucide-react';
import { DirectThread, DirectMessage, UserState, CounselingAppointment, PeerMentorApplication } from '../types';
import { formatRelativeTime, formatFullDateTime } from '../lib/dateUtils';
import { GoogleMeetCard, parseMeetAppointmentFromText } from './GoogleMeetCard';
import { CounselingScheduleModal } from './CounselingScheduleModal';
import { ambientAudio, isMessageSoundMuted, setMessageSoundMuted } from '../lib/audioSynthesizer';

interface DirectMessagesViewProps {
  threads: DirectThread[];
  activeThreadId?: string;
  onSelectThread?: (threadId: string) => void;
  onSendMessage: (threadId: string, text: string) => void;
  typingThreadId?: string | null;
  onStartNewPeerChat?: (peerType: 'ai' | 'listener' | 'expert') => void;
  onOpenRelatedPost?: (postId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  onRevokeMessage?: (threadId: string, messageId: string) => void;
  onDeleteMessageForMe?: (threadId: string, messageId: string) => void;
  onEditMessage?: (threadId: string, messageId: string, newText: string) => void;
  onClearThreadHistory?: (threadId: string) => void;
  onOpenRatingModal?: (listenerName: string, threadId?: string) => void;
  onOpenReportModal?: (listenerName: string, threadId?: string) => void;
  onScheduleAppointment?: (appointment: CounselingAppointment) => void;
  userState?: UserState;
  appointments?: CounselingAppointment[];
  mentorApplications?: PeerMentorApplication[];
}

export const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onSendMessage,
  typingThreadId = null,
  onStartNewPeerChat,
  onOpenRelatedPost,
  onDeleteThread,
  onRevokeMessage,
  onDeleteMessageForMe,
  onEditMessage,
  onClearThreadHistory,
  onOpenRatingModal,
  onOpenReportModal,
  onScheduleAppointment,
  userState,
  appointments = [],
  mentorApplications = []
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    activeThreadId || threads[0]?.id || ''
  );
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('chat');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ai' | 'letter_author' | 'peer_listener'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [promptInsertedNotice, setPromptInsertedNotice] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Message Actions States
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    message: DirectMessage;
    actionType: 'revoke' | 'delete_for_me';
  } | null>(null);
  const [editingMessageModal, setEditingMessageModal] = useState<{
    message: DirectMessage;
    text: string;
  } | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => isMessageSoundMuted());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastProcessedMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeThreadId) {
      setSelectedThreadId(activeThreadId);
      setMobileView('chat');
    }
  }, [activeThreadId]);

  const currentThread = threads.find(t => t.id === selectedThreadId) || threads[0];
  const isPeerTyping = typingThreadId === currentThread?.id;

  // Track new incoming messages in active thread to trigger gentle chime
  useEffect(() => {
    if (!currentThread || currentThread.messages.length === 0) return;
    const lastMsg = currentThread.messages[currentThread.messages.length - 1];
    
    // If it's a new incoming message from the peer that we haven't chimed for yet
    if (lastMsg && !lastMsg.isMe && lastMsg.id !== lastProcessedMessageIdRef.current) {
      lastProcessedMessageIdRef.current = lastMsg.id;
      // Play gentle chime
      ambientAudio.playIncomingMessageSound();
    }
  }, [currentThread?.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages, isPeerTyping]);

  // Auto close open popup menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuMessageId(null);
      setIsHeaderMenuOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSound = () => {
    const newMuted = !isSoundMuted;
    setIsSoundMuted(newMuted);
    setMessageSoundMuted(newMuted);
    if (!newMuted) {
      ambientAudio.playIncomingMessageSound();
      showToast('🔔 Đã bật âm thanh tin nhắn trò chuyện');
    } else {
      showToast('🔕 Đã tắt âm thanh tin nhắn trò chuyện');
    }
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    if (onSelectThread) {
      onSelectThread(threadId);
    }
    setMobileView('chat');
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !currentThread) return;
    onSendMessage(currentThread.id, messageInput.trim());
    ambientAudio.playOutgoingMessageSound();
    setMessageInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Logic: Quick Empathy Prompt inserts into input field for editing
  const handleInsertQuickPrompt = (promptText: string) => {
    setMessageInput(prev => (prev.trim() ? `${prev} ${promptText}` : promptText));
    setPromptInsertedNotice('Đã chèn gợi ý vào ô nhập. Bạn có thể chỉnh sửa trước khi gửi!');
    setTimeout(() => setPromptInsertedNotice(null), 3000);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setMessageInput(prev => `${prev}${emoji}`);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép nội dung tin nhắn 📋');
    setActiveMenuMessageId(null);
  };

  const handleConfirmAction = () => {
    if (!deleteConfirmModal || !currentThread) return;
    const { message, actionType } = deleteConfirmModal;

    if (actionType === 'revoke') {
      if (onRevokeMessage) {
        onRevokeMessage(currentThread.id, message.id);
      }
      showToast('Đã thu hồi tin nhắn đối với mọi người 🔄');
    } else if (actionType === 'delete_for_me') {
      if (onDeleteMessageForMe) {
        onDeleteMessageForMe(currentThread.id, message.id);
      }
      showToast('Đã xóa tin nhắn ở phía bạn 🗑️');
    }

    setDeleteConfirmModal(null);
    setActiveMenuMessageId(null);
  };

  const handleSaveEditedMessage = () => {
    if (!editingMessageModal || !currentThread) return;
    if (!editingMessageModal.text.trim()) return;

    if (onEditMessage) {
      onEditMessage(currentThread.id, editingMessageModal.message.id, editingMessageModal.text.trim());
      showToast('Đã cập nhật tin nhắn ✏️');
    }
    setEditingMessageModal(null);
  };

  // Filter threads by search and category and ensure unique keys
  const filteredThreads = (() => {
    const map = new Map<string, DirectThread>();
    threads.forEach(t => {
      if (!t || !t.id) return;
      // Category filter
      if (categoryFilter === 'ai' && !(t.threadType === 'ai' || t.id === 'thread-ai-companion' || t.peerRole === 'ai_lantern')) return;
      if (categoryFilter === 'letter_author' && !(t.threadType === 'letter_author' || Boolean(t.relatedPostTitle))) return;
      if (categoryFilter === 'peer_listener' && !(t.threadType === 'peer_listener' || t.threadType === 'expert' || t.peerRole === 'peer_listener' || t.peerRole === 'expert')) return;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.peerName.toLowerCase().includes(q);
        const matchTitle = (t.relatedPostTitle || '').toLowerCase().includes(q);
        const matchSchool = (t.relatedSchoolName || '').toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchSchool) return;
      }

      map.set(t.id, t);
    });
    return Array.from(map.values());
  })();

  const quickEmpathyPrompts = [
    { icon: <Leaf className="w-3 h-3 text-emerald-500" />, text: 'Mình vừa đọc tâm sự của bạn, bạn cảm thấy đỡ hơn chút nào chưa?' },
    { icon: <HeartHandshake className="w-3 h-3 text-amber-500" />, text: 'Mình luôn ở đây và sẵn sàng lắng nghe mọi điều bạn muốn trút bỏ...' },
    { icon: <Sparkles className="w-3 h-3 text-amber-400" />, text: 'Bạn đã rất kiên cường và dũng cảm khi chia sẻ điều này. Đừng chịu đựng một mình nhé!' },
    { icon: <Coffee className="w-3 h-3 text-amber-700" />, text: 'Hôm nay bạn đã vất vả nhiều rồi, nhớ nghỉ ngơi một chút và uống nước ấm nhé!' },
    { icon: <Heart className="w-3 h-3 text-rose-500" />, text: 'Mọi chuyện rồi sẽ ổn thôi, mình luôn tin ở bạn!' }
  ];

  const quickStickers = [
    { label: 'Thấu cảm', text: '🧡', icon: <HeartHandshake className="w-3.5 h-3.5 text-amber-500" /> },
    { label: 'Trân trọng', text: '✨', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { label: 'Tách trà ấm', text: '☕', icon: <Coffee className="w-3.5 h-3.5 text-amber-700" /> },
    { label: 'Yêu thương', text: '🌸', icon: <Flower2 className="w-3.5 h-3.5 text-pink-500" /> },
    { label: 'Bình yên', text: '🌿', icon: <Leaf className="w-3.5 h-3.5 text-emerald-500" /> },
    { label: 'Thư an ủi', text: '💌', icon: <Mail className="w-3.5 h-3.5 text-sky-500" /> }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-2.5rem)] flex flex-col min-w-0 max-w-full box-border relative">
      
      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-[#182217] text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-[#3A4738]">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] glass-panel rounded-2xl sm:rounded-3xl overflow-hidden flex-1 flex flex-col sm:flex-row shadow-sm relative min-w-0 max-w-full w-full box-border">
        
        {/* Left Threads Selector Sidebar */}
        <div className={`w-full sm:w-72 md:w-80 shrink-0 border-r border-[#E5E2D9] dark:border-[#3A4738] flex flex-col bg-[#FAF9F6] dark:bg-[#20281F] min-w-0 max-w-full ${
          mobileView === 'chat' ? 'hidden sm:flex' : 'flex h-full'
        }`}>
          {/* Header & New Chat Button */}
          <div className="p-3 sm:p-4 border-b border-[#E5E2D9] dark:border-[#3A4738] flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="font-serif italic font-bold text-sm sm:text-base text-[#3A4036] dark:text-[#E8ECE6] flex items-center gap-1.5 truncate">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#5A6E58] dark:text-[#8BA888] shrink-0" />
                <span className="truncate">Hộp thư 1-1 Ẩn danh</span>
              </h2>
              <p className="text-[10px] text-[#7E7A71] dark:text-[#8E9B8A] truncate">Bảo mật & Không phán xét</p>
            </div>

            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-[#2A4228] text-white hover:bg-[#1B2C1A] transition-all flex items-center gap-1 text-[11px] font-bold shadow-xs active:scale-95 shrink-0"
              title="Bắt đầu cuộc trò chuyện mới"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mới</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-2.5 pt-2.5 pb-1.5">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E9B8A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm hội thoại, lá thư..."
                className="w-full bg-white dark:bg-[#182017] border border-[#E5E2D9] dark:border-[#3A4738] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#3A4036] dark:text-[#E8ECE6] placeholder-[#A4A095] dark:placeholder-[#8E9B8A] focus:outline-none focus:border-[#2A4228]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8E9B8A] hover:text-[#182217]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="px-2 pb-2 border-b border-[#E5E2D9]/70 dark:border-[#3A4738]/70 flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0 max-w-full">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-[#2A4228] text-white shadow-2xs'
                  : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#7E7A71] dark:text-[#8E9B8A] hover:bg-black/5'
              }`}
            >
              Tất cả ({threads.length})
            </button>
            <button
              onClick={() => setCategoryFilter('ai')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                categoryFilter === 'ai'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              <span>✨</span>
              <span>AI</span>
            </button>
            <button
              onClick={() => setCategoryFilter('letter_author')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                categoryFilter === 'letter_author'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 hover:bg-rose-500/20'
              }`}
            >
              <span>💌</span>
              <span>Thư an ủi</span>
            </button>
            <button
              onClick={() => setCategoryFilter('peer_listener')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                categoryFilter === 'peer_listener'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <span>🎧</span>
              <span>Lắng nghe</span>
            </button>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-w-0">
            {filteredThreads.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8E9B8A] space-y-2">
                <SearchX className="w-8 h-8 text-[#5A6E58] mx-auto" />
                <p>Không tìm thấy hội thoại phù hợp.</p>
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1 rounded-full bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888] text-[10px] font-bold"
                >
                  Xem tất cả
                </button>
              </div>
            ) : (
              filteredThreads.map(thread => {
                const isSelected = thread.id === selectedThreadId;
                const lastMessage = thread.messages[thread.messages.length - 1];
                const isAI = thread.threadType === 'ai' || thread.id === 'thread-ai-companion' || thread.peerRole === 'ai_lantern';
                const isLetterAuthor = thread.threadType === 'letter_author' || Boolean(thread.relatedPostTitle);

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 min-w-0 relative group ${
                      isSelected
                        ? 'bg-[#8BA888]/20 border border-[#8BA888]/40 shadow-2xs'
                        : 'hover:bg-[#F1F3EF] dark:hover:bg-[#20281F] border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                        isAI
                          ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                          : isLetterAuthor
                          ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30'
                      }`}>
                        {isAI ? '✨' : isLetterAuthor ? '💌' : thread.peerRole === 'expert' ? '🎓' : '🎧'}
                      </div>
                      {thread.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[var(--bg-main)]"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-[#2A4228] dark:text-[#8BA888]' : 'text-[#1C231B] dark:text-[#E8ECE6]'}`}>
                          {thread.peerName}
                        </h3>
                        <span 
                          className="text-[9px] text-[#8E9B8A] shrink-0 ml-1"
                          title={lastMessage ? formatFullDateTime(lastMessage.createdAt || lastMessage.id) : ''}
                        >
                          {lastMessage ? formatRelativeTime(lastMessage.createdAt, lastMessage.timestamp, lastMessage.id) : ''}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#4A5247] dark:text-[#8E9B8A] font-medium truncate">
                        {lastMessage ? (
                          lastMessage.isRevoked ? (
                            <span className="italic text-[#8E9B8A]">🚫 Tin nhắn đã thu hồi</span>
                          ) : (
                            lastMessage.isMe ? `Bạn: ${lastMessage.text}` : lastMessage.text
                          )
                        ) : (
                          thread.relatedPostTitle ? `Thư: ${thread.relatedPostTitle}` : thread.roleTitle
                        )}
                      </p>
                    </div>

                    {onDeleteThread && thread.id !== 'thread-ai-companion' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện này không?')) {
                            onDeleteThread(thread.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 text-[#8E9B8A] transition-opacity shrink-0"
                        title="Xóa hội thoại"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Pane */}
        {currentThread ? (
          <div className={`flex-1 min-w-0 flex flex-col h-full bg-[var(--bg-card)] overflow-hidden box-border ${
            mobileView === 'list' ? 'hidden sm:flex' : 'flex'
          }`}>
            {/* Chat Header */}
            <div className="p-2.5 sm:p-3.5 border-b border-[#E5E2D9] dark:border-[#3A4738] flex items-center justify-between gap-2 min-w-0 shrink-0 relative">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                {/* Mobile Back / List Toggle Button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="sm:hidden p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[#2A4228] dark:text-[#8BA888] flex items-center gap-1 shrink-0 text-xs font-bold"
                  title="Xem danh sách hội thoại"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-[10px]">Danh sách</span>
                </button>

                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border ${
                  currentThread.threadType === 'ai' || currentThread.peerRole === 'ai_lantern'
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                    : currentThread.relatedPostTitle
                    ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30'
                }`}>
                  {currentThread.threadType === 'ai' || currentThread.peerRole === 'ai_lantern'
                    ? '✨'
                    : currentThread.relatedPostTitle
                    ? '💌'
                    : currentThread.peerRole === 'expert'
                    ? '🎓'
                    : '🎧'}
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-[#1C231B] dark:text-[#E8ECE6] flex items-center gap-1.5 truncate">
                    <span className="truncate">{currentThread.peerName}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888] shrink-0">
                      Ẩn danh
                    </span>
                  </h3>
                  <p className="text-[10px] text-[#3A5238] dark:text-[#8BA888] flex items-center gap-1 font-medium truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">{currentThread.roleTitle}</span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                {/* Google Meet & Schedule Booking Button */}
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 shrink-0"
                  title="Tạo link Google Meet hoặc lên lịch tham vấn 1-1"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Google Meet / Lịch hẹn</span>
                </button>

                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8BA888]/15 hover:bg-[#8BA888]/25 text-[#2A4228] dark:text-[#8BA888] text-[11px] font-bold transition-all active:scale-95"
                  title="Đổi đối tượng trò chuyện"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đổi người nghe</span>
                </button>

                <span className="text-[10px] bg-[#8BA888]/15 text-[#3A5238] dark:text-[#8BA888] border border-[#8BA888]/30 px-2 py-0.5 rounded-full font-bold hidden sm:inline">
                  {currentThread.threadType === 'ai' || currentThread.peerRole === 'ai_lantern' ? '✨ AI 24/7' : '🔒 1-1'}
                </span>

                {/* Sound Notification Mute / Unmute Toggle */}
                <button
                  onClick={handleToggleSound}
                  className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                    isSoundMuted
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#2A4228] dark:text-[#8BA888]'
                  }`}
                  title={isSoundMuted ? 'Bật chuông tin nhắn mới (Đang tắt)' : 'Tắt chuông tin nhắn mới (Đang bật)'}
                >
                  {isSoundMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {/* Options Menu Button in Header */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHeaderMenuOpen(!isHeaderMenuOpen);
                    }}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#8E9B8A] transition-colors"
                    title="Tùy chọn hội thoại"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isHeaderMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#1E261D] border border-[#E5E2D9] dark:border-[#3A4738] rounded-2xl shadow-xl py-1.5 z-40 text-xs text-[#3A4036] dark:text-[#E8ECE6] animate-fade-in"
                    >
                      {/* Toggle Sound Notification in Menu */}
                      <button
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          handleToggleSound();
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 text-[#2A4228] dark:text-[#8BA888]"
                      >
                        {isSoundMuted ? (
                          <>
                            <Volume2 className="w-4 h-4 text-emerald-600" />
                            <span>Bật âm chuông tin nhắn</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-4 h-4 text-amber-600" />
                            <span>Tắt âm chuông tin nhắn</span>
                          </>
                        )}
                      </button>

                      <div className="my-1 border-t border-[#E5E2D9] dark:border-[#3A4738]"></div>
                      {/* Healing Rating Button */}
                      {onOpenRatingModal && currentThread.id !== 'thread-ai-companion' && (
                        <button
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            onOpenRatingModal(currentThread.peerName, currentThread.id);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-rose-500/10 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium"
                        >
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          <span>Đánh giá ấm áp (Healing Rating)</span>
                        </button>
                      )}

                      {/* Report Listener Button */}
                      {onOpenReportModal && currentThread.id !== 'thread-ai-companion' && (
                        <button
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            onOpenReportModal(currentThread.peerName, currentThread.id);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-rose-500/10 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          <span>Báo cáo vi phạm</span>
                        </button>
                      )}

                      <div className="my-1 border-t border-[#E5E2D9] dark:border-[#3A4738]"></div>

                      {onClearThreadHistory && (
                        <button
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            if (confirm('Bạn có chắc muốn xóa sạch toàn bộ lịch sử tin nhắn trong phòng này?')) {
                              onClearThreadHistory(currentThread.id);
                              showToast('Đã xóa sạch lịch sử tin nhắn');
                            }
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 text-[#2A4228] dark:text-[#8BA888]"
                        >
                          <Eraser className="w-4 h-4" />
                          <span>Xóa sạch lịch sử</span>
                        </button>
                      )}

                      {onDeleteThread && currentThread.id !== 'thread-ai-companion' && (
                        <button
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
                              onDeleteThread(currentThread.id);
                            }
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-rose-500/10 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Xóa cuộc trò chuyện</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Related Post Banner Callout if this thread originated from a Letter */}
            {currentThread.relatedPostTitle && (
              <div className="px-3 py-2 bg-gradient-to-r from-rose-500/10 via-[#FAF9F6] to-[#FAF9F6] dark:from-rose-950/20 dark:via-[#20281F] dark:to-[#20281F] border-b border-[#E5E2D9] dark:border-[#3A4738] flex items-center justify-between gap-2 text-xs min-w-0 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <MailCheck className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] text-[#42493F] dark:text-[#8E9B8A] truncate">
                      An ủi tác giả lá thư: <strong className="text-[#182217] dark:text-[#E8ECE6]">«{currentThread.relatedPostTitle}»</strong>
                    </p>
                    {currentThread.relatedPostSnippet && (
                      <p className="text-[9px] text-[#7E7A71] dark:text-[#8E9B8A] italic truncate">
                        "{currentThread.relatedPostSnippet}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {currentThread.relatedPostId && onOpenRelatedPost && (
                    <button
                      onClick={() => onOpenRelatedPost(currentThread.relatedPostId!)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-[#182017] border border-[#E5E2D9] dark:border-[#3A4738] text-[10px] font-bold text-[#2A4228] dark:text-[#8BA888] hover:bg-black/5"
                    >
                      Xem bài gốc
                    </button>
                  )}
                  {currentThread.relatedSchoolName && (
                    <span className="text-[9px] bg-[#8BA888]/15 text-[#2A4228] dark:text-[#8BA888] px-1.5 py-0.5 rounded font-bold">
                      {currentThread.relatedSchoolName}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Notice when prompt was inserted */}
            {promptInsertedNotice && (
              <div className="px-3 py-1 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-medium flex items-center justify-between shrink-0">
                <span>{promptInsertedNotice}</span>
                <button onClick={() => setPromptInsertedNotice(null)} className="text-xs">✕</button>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 box-border">
              {currentThread.messages.map((msg, idx) => {
                const isMenuOpen = activeMenuMessageId === msg.id;

                return (
                  <div
                    key={`${msg.id || 'msg'}-${idx}`}
                    className={`flex flex-col max-w-[88%] sm:max-w-[78%] min-w-0 relative group ${
                      msg.isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 max-w-full">
                      {/* Left Menu Trigger for user messages */}
                      {msg.isMe && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMessageId(isMenuOpen ? null : msg.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 sm:opacity-0 focus:opacity-100 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#8E9B8A] transition-opacity"
                            title="Tùy chọn tin nhắn"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Action Popover Menu */}
                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-[#1E261D] border border-[#E5E2D9] dark:border-[#3A4738] rounded-2xl shadow-xl py-1.5 z-40 text-xs text-[#3A4036] dark:text-[#E8ECE6] animate-fade-in"
                            >
                              {!msg.isRevoked && (
                                <button
                                  onClick={() => handleCopyMessage(msg.text)}
                                  className="w-full px-3 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Sao chép</span>
                                </button>
                              )}

                              {!msg.isRevoked && onEditMessage && (
                                <button
                                  onClick={() => {
                                    setEditingMessageModal({ message: msg, text: msg.text });
                                    setActiveMenuMessageId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Chỉnh sửa</span>
                                </button>
                              )}

                              {!msg.isRevoked && (
                                <button
                                  onClick={() => {
                                    setDeleteConfirmModal({ message: msg, actionType: 'revoke' });
                                    setActiveMenuMessageId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left hover:bg-rose-500/10 flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium"
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                  <span>Thu hồi (Gỡ mọi người)</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setDeleteConfirmModal({ message: msg, actionType: 'delete_for_me' });
                                  setActiveMenuMessageId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-rose-500/10 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa ở phía bạn</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Bubble Content */}
                      {msg.isRevoked ? (
                        <div className="p-2 sm:p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-[#8E9B8A]/40 text-[#8E9B8A] text-xs italic flex items-center gap-1.5 select-none">
                          <MinusCircle className="w-3.5 h-3.5 text-[#8E9B8A]" />
                          <span>{msg.isMe ? 'Bạn đã thu hồi một tin nhắn' : 'Tin nhắn đã được thu hồi'}</span>
                        </div>
                      ) : (() => {
                        const meetData = parseMeetAppointmentFromText(msg.text);
                        return (
                          <div className="flex flex-col gap-1 max-w-full">
                            <div
                              className={`p-2.5 sm:p-3 rounded-2xl text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap max-w-full ${
                                msg.isMe
                                  ? 'bg-[#2A4228] text-white font-medium rounded-br-none shadow-xs'
                                  : 'bg-[#FAF9F6] dark:bg-[#20281F] text-[#3A4036] dark:text-[#E8ECE6] rounded-bl-none border border-[#E5E2D9] dark:border-[#3A4738]'
                              }`}
                            >
                              {msg.text}
                              {msg.editedAt && (
                                <span className="block text-[9px] opacity-70 italic text-right mt-0.5">
                                  (đã chỉnh sửa)
                                </span>
                              )}
                            </div>

                            {/* Render Interactive Google Meet Card if link detected */}
                            {meetData && (
                              <div className="w-full max-w-sm">
                                <GoogleMeetCard
                                  meetUrl={meetData.meetUrl}
                                  date={meetData.date}
                                  timeSlot={meetData.timeSlot}
                                  topic={meetData.topic}
                                  counselorName={msg.isMe ? 'Bạn' : currentThread.peerName}
                                  compact={true}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Right Menu Trigger for peer messages */}
                      {!msg.isMe && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMessageId(isMenuOpen ? null : msg.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 sm:opacity-0 focus:opacity-100 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#8E9B8A] transition-opacity"
                            title="Tùy chọn tin nhắn"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Action Popover Menu for peer messages */}
                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 bottom-full mb-1 w-44 bg-white dark:bg-[#1E261D] border border-[#E5E2D9] dark:border-[#3A4738] rounded-2xl shadow-xl py-1.5 z-40 text-xs text-[#3A4036] dark:text-[#E8ECE6] animate-fade-in"
                            >
                              {!msg.isRevoked && (
                                <button
                                  onClick={() => handleCopyMessage(msg.text)}
                                  className="w-full px-3 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Sao chép</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setDeleteConfirmModal({ message: msg, actionType: 'delete_for_me' });
                                  setActiveMenuMessageId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-rose-500/10 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa ở phía bạn</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <span 
                      className="text-[9px] text-[#A4A095] dark:text-[#8E9B8A] mt-1 px-1 font-medium flex items-center gap-1"
                      title={formatFullDateTime(msg.createdAt || msg.id)}
                    >
                      <span>{formatRelativeTime(msg.createdAt, msg.timestamp, msg.id)}</span>
                      {!msg.isMe && <span>• {msg.senderName}</span>}
                    </span>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isPeerTyping && (
                <div className="mr-auto items-start flex flex-col min-w-0">
                  <div className="p-2.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] text-[#3A4036] dark:text-[#E8ECE6] rounded-bl-none border border-[#E5E2D9] dark:border-[#3A4738] flex items-center gap-1.5 text-xs text-[#5A6E58] dark:text-[#8BA888]">
                    <span className="inline-block animate-bounce text-xs">●</span>
                    <span className="inline-block animate-bounce [animation-delay:0.2s] text-xs">●</span>
                    <span className="inline-block animate-bounce [animation-delay:0.4s] text-xs">●</span>
                    <span className="text-[10px] ml-1 font-medium">{currentThread.peerName} đang viết...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Empathy Prompts Carousel (Inserts into input field for editing) */}
            <div className="w-full min-w-0 max-w-full px-2 sm:px-3 pt-1.5 pb-1 border-t border-[#E5E2D9]/70 dark:border-[#3A4738]/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 box-border">
              <span className="text-[9px] uppercase font-bold text-[#8E9B8A] shrink-0 pl-1">
                Gợi ý an ủi:
              </span>
              {quickEmpathyPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleInsertQuickPrompt(p.text)}
                  className="px-2.5 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-[#8BA888]/20 border border-[#E5E2D9] dark:border-[#3A4738] text-[10px] font-medium text-[#2A4228] dark:text-[#8BA888] whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 active:scale-95 shadow-2xs"
                  title="Bấm để chèn vào khung soạn thảo"
                >
                  <span className="shrink-0">{p.icon}</span>
                  <span className="truncate max-w-[150px] sm:max-w-[220px]">{p.text}</span>
                </button>
              ))}
            </div>

            {/* Quick Sticker / Emotion Toolbar */}
            <div className="w-full min-w-0 max-w-full px-2 sm:px-3 py-1 flex items-center justify-between gap-1 text-xs shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Quick Google Meet Launcher */}
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center gap-1 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold transition-all active:scale-95 shadow-2xs"
                  title="Tạo link Google Meet hoặc lên lịch hẹn tham vấn"
                >
                  <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Google Meet</span>
                </button>

                <span className="text-[9px] font-bold text-[#8E9B8A] mr-0.5">Biểu cảm:</span>
                {quickStickers.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInsertEmoji(item.text)}
                    className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-[#2A4228]/15 dark:hover:bg-[#8BA888]/20 border border-transparent hover:border-[#2A4228]/30 flex items-center gap-1 text-[11px] text-[#2C382A] dark:text-[#E8ECE6] font-medium transition-all active:scale-95"
                    title={`Chèn biểu tượng ${item.label}`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-[#A4A095] dark:text-[#8E9B8A] hidden sm:inline">
                Nhấn <strong>Enter</strong> để gửi, <strong>Shift+Enter</strong> xuống dòng
              </span>
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="w-full min-w-0 max-w-full p-2 sm:p-2.5 border-t border-[#E5E2D9] dark:border-[#3A4738] flex items-end gap-2 shrink-0 box-border">
              <textarea
                ref={textareaRef}
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Nhập lời an ủi, tâm sự ẩn danh..."
                className="flex-1 min-w-0 bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-2xl py-2 px-3.5 text-xs sm:text-sm text-[#3A4036] dark:text-[#E8ECE6] placeholder-[#A4A095] dark:placeholder-[#8E9B8A] focus:outline-none focus:border-[#2A4228] resize-none max-h-[100px] box-border leading-relaxed"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#2A4228] hover:bg-[#1B2C1A] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all active:scale-90 shadow-sm"
                title="Gửi tin nhắn (Enter)"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#A4A095] dark:text-[#8E9B8A] text-xs">
            Chọn một cuộc hội thoại để bắt đầu lắng nghe.
          </div>
        )}
      </div>

      {/* Confirmation Modal for Revoke / Delete For Me */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              {deleteConfirmModal.actionType === 'revoke' ? (
                <Undo2 className="w-6 h-6 text-amber-600" />
              ) : (
                <Trash2 className="w-6 h-6 text-rose-600" />
              )}
              <h3 className="font-serif font-bold text-base text-[#182217] dark:text-[#E8ECE6]">
                {deleteConfirmModal.actionType === 'revoke' ? 'Thu hồi tin nhắn?' : 'Xóa ở phía bạn?'}
              </h3>
            </div>

            <p className="text-xs text-[#42493F] dark:text-[#8E9B8A] leading-relaxed">
              {deleteConfirmModal.actionType === 'revoke'
                ? 'Tin nhắn này sẽ được gỡ đối với tất cả mọi người trong cuộc trò chuyện. Mọi người sẽ thấy thông báo tin nhắn đã được thu hồi.'
                : 'Tin nhắn này sẽ bị xóa khỏi lịch sử cuộc trò chuyện trên thiết bị của bạn. Người khác vẫn có thể nhìn thấy nội dung này.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmModal(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] text-xs font-bold text-[#42493F] dark:text-[#8E9B8A] hover:bg-black/5"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs active:scale-95 ${
                  deleteConfirmModal.actionType === 'revoke'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {deleteConfirmModal.actionType === 'revoke' ? 'Thu hồi' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Message Modal */}
      {editingMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#182217] dark:text-[#E8ECE6] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#2A4228] dark:text-[#8BA888]" />
                <span>Chỉnh sửa tin nhắn</span>
              </h3>
              <button
                onClick={() => setEditingMessageModal(null)}
                className="p-1 rounded-lg hover:bg-black/5 text-[#8E9B8A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={editingMessageModal.text}
              onChange={(e) => setEditingMessageModal({ ...editingMessageModal, text: e.target.value })}
              rows={3}
              className="w-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#E5E2D9] dark:border-[#3A4738] rounded-2xl p-3 text-xs sm:text-sm text-[#3A4036] dark:text-[#E8ECE6] focus:outline-none focus:border-[#2A4228]"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingMessageModal(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#E5E2D9] dark:border-[#3A4738] text-xs font-bold text-[#42493F] dark:text-[#8E9B8A] hover:bg-black/5"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditedMessage}
                disabled={!editingMessageModal.text.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#2A4228] hover:bg-[#1B2C1A] text-white text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal Selector */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[#E5E2D9] dark:border-[#3A4738] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#182217] dark:text-[#E8ECE6]">
                Bắt đầu trò chuyện 1-1 ẩn danh
              </h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#8E9B8A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#42493F] dark:text-[#8E9B8A] leading-relaxed">
              Chọn người bạn muốn đồng hành lắng nghe cùng bạn hôm nay:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  const aiThread = threads.find(t => t.id === 'thread-ai-companion' || t.peerRole === 'ai_lantern');
                  if (aiThread) handleSelectThread(aiThread.id);
                  else onStartNewPeerChat?.('ai');
                }}
                className="w-full p-3 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-emerald-500/10 border border-[#E5E2D9] dark:border-[#3A4738] flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-lg shrink-0">
                  ✨
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                    AI Companion (Thấu hiểu 24/7)
                  </h4>
                  <p className="text-[10px] text-[#7E7A71] dark:text-[#8E9B8A] line-clamp-2">
                    Phản hồi tức thì bằng Gemini AI, ấm áp và không phán xét bất kỳ điều gì.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  onStartNewPeerChat?.('listener');
                }}
                className="w-full p-3 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-[#8BA888]/15 border border-[#E5E2D9] dark:border-[#3A4738] flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#8BA888]/20 text-[#2A4228] dark:text-[#8BA888] flex items-center justify-center text-lg shrink-0">
                  🎧
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] group-hover:text-[#2A4228] dark:group-hover:text-[#8BA888] truncate">
                    Bạn Lắng Nghe Đồng Đẳng (Peer Listener)
                  </h4>
                  <p className="text-[10px] text-[#7E7A71] dark:text-[#8E9B8A] line-clamp-2">
                    Kết nối với một bạn sinh viên/học sinh đã được xác minh để sẻ chia.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  onStartNewPeerChat?.('expert');
                }}
                className="w-full p-3 rounded-2xl bg-[#FAF9F6] dark:bg-[#20281F] hover:bg-amber-500/10 border border-[#E5E2D9] dark:border-[#3A4738] flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center text-lg shrink-0">
                  🎓
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6] group-hover:text-amber-700 dark:group-hover:text-amber-400 truncate">
                    Cố Vấn & Chuyên Gia Tâm Lý Học Đường
                  </h4>
                  <p className="text-[10px] text-[#7E7A71] dark:text-[#8E9B8A] line-clamp-2">
                    Tư vấn định hướng học tập, gia đình và giải tỏa căng thẳng tâm lý.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counseling Schedule & Google Meet Modal */}
      {isScheduleModalOpen && currentThread && (
        <CounselingScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          schoolName={currentThread.schoolName || userState?.selectedSchool?.name || 'Trường của bạn'}
          schoolId={userState?.selectedSchool?.id || 'all-schools'}
          counselorName={currentThread.peerRole === 'ai_lantern' ? 'Cố Vấn Tâm Lý Học Đường' : currentThread.peerName}
          counselorRole={currentThread.roleTitle}
          userState={userState}
          relatedThreadId={currentThread.id}
          existingAppointments={appointments}
          mentorApplications={mentorApplications}
          onConfirmSchedule={(appointment) => {
            if (onScheduleAppointment) {
              onScheduleAppointment(appointment);
            }
            // Send formatted meeting invitation message into active thread
            const meetText = appointment.meetingType === 'google_meet'
              ? `📅 LỊCH HẸN THAM VẤN GOOGLE MEET\n📌 Chủ đề: ${appointment.topic}\n🗓 Ngày: ${appointment.date}\n⏰ Khung giờ: ${appointment.timeSlot}\n🎥 Link Google Meet: ${appointment.meetUrl}\n\n🔒 Buổi gặp được mã hóa và bảo mật riêng tư 1-1 theo chuẩn Lantern.`
              : `📅 LỊCH HẸN GẶP TRỰC TIẾP TẠI TRƯỜNG\n📌 Chủ đề: ${appointment.topic}\n🗓 Ngày: ${appointment.date}\n⏰ Khung giờ: ${appointment.timeSlot}\n📍 Địa điểm: ${appointment.locationName}\n\n🔒 Buổi gặp bảo mật riêng tư 1-1 tại phòng tham vấn học đường.`;

            onSendMessage(currentThread.id, meetText);
            setToastMessage('Đã tạo lịch hẹn và gửi thông tin buổi gặp vào hội thoại!');
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
};
