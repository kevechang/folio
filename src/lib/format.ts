export function relativeTime(value: number, now = Date.now()): string {
  const diff = Math.max(0, now - value);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const date = new Date(value),
    today = new Date(now);
  if (date.toDateString() === today.toDateString()) return `${Math.floor(diff / 3600000)} 小时前`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const hm = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  if (date.toDateString() === yesterday.toDateString()) return `昨天 ${hm}`;
  if (date.getFullYear() === today.getFullYear())
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function middleEllipsis(path: string, max = 36): string {
  if (path.length <= max) return path;
  if (max <= 1) return "…";
  if (max === 2) return `${path[0]}…`;
  const head = Math.ceil((max - 1) / 2),
    tail = Math.floor((max - 1) / 2);
  return `${path.slice(0, head)}…${path.slice(-tail)}`;
}
