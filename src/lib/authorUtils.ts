import { Post, Reply } from '../types';

/**
 * Định dạng tên hiển thị tác giả cho lá thư:
 * - Nếu đăng Danh tính thật: Hiển thị tên thật (authorDisplayName) hoặc tên đã đăng ký
 * - Nếu đăng Ẩn danh: Hiển thị chuẩn mã số (#123, #979)
 * - Tự động phát hiện và chuyển đổi các bài viết cũ có định dạng tên bị dài / dính tiêu đề / câu văn sang mã số đẹp dạng #979
 */
export function getFormattedAuthorName(post: Partial<Post> | null | undefined): string {
  if (!post) return '#979';

  if (post.isIdentityPublic) {
    return (post.authorDisplayName || post.authorAnonId || 'Thành viên').trim();
  }

  const raw = (post.authorAnonId || '').trim();

  // Nếu đã đúng chuẩn "#123" hoặc "#979"
  if (/^#\d+$/.test(raw)) {
    return raw;
  }

  // Nếu chuỗi chứa mã số (ví dụ: "Người dùng ẩn danh #979" hoặc "Thành viên #979")
  const matchHash = raw.match(/#\d+/);
  if (matchHash) {
    return matchHash[0];
  }

  // Nếu chỉ là số nguyên (ví dụ "979")
  if (/^\d{2,6}$/.test(raw)) {
    return `#${raw}`;
  }

  // Trường hợp bị lỗi (nhầm thành tiêu đề bài viết, câu dài, "Gửi bạn...", rỗng...)
  // Sinh mã hash ngẫu nhiên nhưng ổn định và cố định theo id / tiêu đề bài viết
  let hash = 0;
  const key = post.id || post.title || post.content || 'the-lantern-anon';
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 900) + 100;
  return `#${num}`;
}

/**
 * Định dạng tên hiển thị cho người phản hồi / bình luận
 */
export function getFormattedReplyAuthorName(reply: Partial<Reply> | null | undefined): string {
  if (!reply) return '#979';
  if (reply.authorRole === 'ai_lantern') {
    return reply.authorName || 'Ngọn Đèn Thấu Hiểu (AI Companion)';
  }
  if (reply.isIdentityPublic) {
    return (reply.authorDisplayName || reply.authorName || 'Thành viên').trim();
  }
  const raw = (reply.authorName || '').trim();
  if (/^#\d+$/.test(raw)) {
    return raw;
  }
  const matchHash = raw.match(/#\d+/);
  if (matchHash) {
    return matchHash[0];
  }
  if (/^\d{2,6}$/.test(raw)) {
    return `#${raw}`;
  }
  if (raw && raw.length <= 15 && !raw.includes('...') && !raw.startsWith('Gửi bạn')) {
    return raw;
  }
  let hash = 0;
  const key = reply.id || reply.content || 'reply-anon';
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 900) + 100;
  return `#${num}`;
}

