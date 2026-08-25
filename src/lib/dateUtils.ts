/**
 * Date and relative time formatting utility for Lantern Secret.
 * Calculates dynamic Vietnamese relative time (e.g., "Vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước")
 * based on actual timestamps.
 */

export function parseTimestamp(value?: number | string | null): number | null {
  if (value === undefined || value === null) return null;

  if (typeof value === 'number') {
    if (isNaN(value) || value <= 0) return null;
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Try parsing ISO date or numeric string
    const parsedNumber = Number(trimmed);
    if (!isNaN(parsedNumber) && parsedNumber > 1000000000) {
      return parsedNumber;
    }

    const parsedDate = Date.parse(trimmed);
    if (!isNaN(parsedDate) && parsedDate > 0) {
      return parsedDate;
    }

    // Try extracting numeric timestamp from typical IDs like "post-1771921381290" or "reply-1771921381290"
    const match = trimmed.match(/\b(17\d{10,12})\b/);
    if (match && match[1]) {
      const extracted = parseInt(match[1], 10);
      if (!isNaN(extracted) && extracted > 0) {
        return extracted;
      }
    }
  }

  return null;
}

export function formatRelativeTime(
  createdAt?: number | string | null,
  fallbackTimestamp?: string,
  idForFallback?: string
): string {
  let ts = parseTimestamp(createdAt);

  // If no timestamp in createdAt, try extracting from id
  if (!ts && idForFallback) {
    ts = parseTimestamp(idForFallback);
  }

  if (!ts) {
    if (fallbackTimestamp && fallbackTimestamp !== 'Vừa xong' && fallbackTimestamp !== 'Bây giờ') {
      return fallbackTimestamp;
    }
    return 'Vừa xong';
  }

  const now = Date.now();
  const diffMs = now - ts;

  // If timestamp is slightly in the future (due to clock drift) or within 60s
  if (diffMs < 60 * 1000) {
    return 'Vừa xong';
  }

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `${diffWeeks} tuần trước`;
  }

  // Format as date: dd/MM/yyyy
  const date = new Date(ts);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatFullDateTime(createdAt?: number | string | null): string {
  const ts = parseTimestamp(createdAt);
  if (!ts) return '';

  const date = new Date(ts);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${hours}:${minutes}, ${day}/${month}/${year}`;
}
