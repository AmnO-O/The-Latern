import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  MessageSquare, 
  HeartHandshake, 
  AtSign, 
  Flame, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { LanternNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: LanternNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification: (notification: LanternNotification) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredList = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const getNotificationIcon = (type: LanternNotification['type']) => {
    switch (type) {
      case 'counselor_response':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
        );
      case 'tag':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <AtSign className="w-4 h-4" />
          </div>
        );
      case 'hug':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
        );
      case 'reply':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-[#2A4228]/15 text-[#2A4228] dark:text-[#8BA888] flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[#C8D2C4] dark:border-[#3A4738] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE4D8] dark:border-[#3A4738] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#2A4228] text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif italic font-bold text-lg text-[#182217] dark:text-[#E8ECE6]">
                  Thông báo
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A]">
                Cập nhật phản hồi, lời nhắn & nhắc tên
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#5A6D58] dark:text-[#8E9B8A] transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filter Pills */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#FAF9F6] dark:bg-[#20281F] p-1 rounded-xl border border-[#DCE4D8] dark:border-[#3A4738]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#5A6D58] dark:text-[#8E9B8A] hover:text-[#182217]'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === 'unread'
                  ? 'bg-[#2A4228] text-white shadow-xs'
                  : 'text-[#5A6D58] dark:text-[#8E9B8A] hover:text-[#182217]'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đã đọc tất cả</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl hover:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Xóa toàn bộ thông báo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa hết</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-[#FAF9F6] dark:bg-[#20281F] border border-[#DCE4D8] dark:border-[#3A4738] flex items-center justify-center mx-auto text-xl text-[#5A6D58] dark:text-[#8E9B8A]">
                🌿
              </div>
              <p className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                {filter === 'unread' ? 'Không có thông báo chưa đọc nào' : 'Bạn chưa có thông báo nào'}
              </p>
              <p className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A] max-w-xs mx-auto">
                Khi có ai đó hồi đáp lá thư của bạn, nhắc tên @ hoặc gửi lời an ủi từ Ban Cố Vấn, thông báo sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            filteredList.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  onMarkAsRead(n.id);
                  onSelectNotification(n);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative group ${
                  !n.isRead
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 shadow-2xs hover:bg-emerald-500/15'
                    : 'bg-[#FAF9F6] dark:bg-[#20281F] border-[#DCE4D8] dark:border-[#3A4738] hover:bg-[#EAF0E8] dark:hover:bg-[#2A3628]'
                }`}
              >
                {getNotificationIcon(n.type)}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#182217] dark:text-[#E8ECE6]">
                        {n.senderName}
                      </span>
                      {n.type === 'counselor_response' && (
                        <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Ban Cố Vấn</span>
                        </span>
                      )}
                      {n.type === 'tag' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                          Đã nhắc tên bạn
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] shrink-0">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-[#2C382A] dark:text-[#C5D2C2] line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="text-[11px] text-[#5A6D58] dark:text-[#8E9B8A] italic truncate flex items-center gap-1">
                    <span>Trong: "{n.postTitle}"</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 self-center"></div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-[#DCE4D8] dark:border-[#3A4738] flex items-center justify-between text-[10px] text-[#5A6D58] dark:text-[#8E9B8A] shrink-0">
          <span>🔒 Danh tính được bảo mật mã hóa an toàn</span>
          <button
            onClick={onClose}
            className="font-bold hover:text-[#182217] dark:hover:text-[#E8ECE6] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
