import { Post } from '../types';

/**
 * Định dạng tên hiển thị tác giả cho lá thư:
 * - Nếu đăng Danh tính thật: Hiển thị tên thật (authorDisplayName) hoặc tên đã đăng ký
 * - Nếu đăng Ẩn danh: Hiển thị chuẩn mã số (#123) hoặc bút danh ẩn danh (e.g. "Người dùng ẩn danh #492")
 * - Tự động phát hiện và chuyển đổi các bài viết cũ có định dạng tên bị dài / dính tiêu đề sang mã số đẹp #123
 */
export function getFormattedAuthorName(post: Partial<Post>): string {
  if (post.isIdentityPublic) {
    return post.authorDisplayName || post.authorAnonId || 'Thành viên';
  }

  const raw = (post.authorAnonId || '').trim();

  // Nếu tác giả ẩn danh bị rỗng, hoặc vô tình bị gán bằng tiêu đề bài viết, hoặc dài hơn 25 ký tự / câu văn
  const isCorruptedOrSentence = 
    !raw || 
    (post.title && raw.toLowerCase() === post.title.trim().toLowerCase()) || 
    raw.length > 25 || 
    raw.startsWith('Gửi bạn') ||
    raw.includes('...');

  if (isCorruptedOrSentence) {
    let hash = 0;
    const key = post.id || post.title || 'the-lantern-anon';
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const num = (Math.abs(hash) % 900) + 100;
    return `#${num}`;
  }

  return raw;
}
