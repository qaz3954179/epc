/** 根据时间段返回问候语 */
export function getGreeting(nickname: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `🌅 ${nickname}，早上好呀！`;
  if (hour < 18) return `☀️ ${nickname}，下午好！`;
  return `🌙 ${nickname}，晚上好哦~`;
}

/** 分类 → emoji 映射 */
export function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    学习: '📖',
    运动: '🏃',
    生活: '🏠',
    阅读: '📚',
    数学: '🔢',
    语文: '📖',
    英语: '🔤',
  };
  return map[category] || '⭐';
}

/** 格式化数字（千分位） */
export function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

/** 相对时间 */
export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

/** 格式化时间 HH:mm */
export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 科目 emoji */
export function subjectEmoji(subject: string): string {
  const map: Record<string, string> = {
    数学: '🔢',
    语文: '📖',
    英语: '🔤',
  };
  return map[subject] || '📝';
}
