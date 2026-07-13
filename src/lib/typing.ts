// In-memory "is typing" signal, keyed by `${fromUserId}:${toUserId}`.
// Per-instance only (same tradeoff as rateLimit.ts) — fine for a single
// dev/demo deployment, would need a shared store for multi-instance prod.

const typingMap = new Map<string, number>();
const TYPING_TTL_MS = 4000;

export function setTyping(fromUserId: string, toUserId: string) {
  typingMap.set(`${fromUserId}:${toUserId}`, Date.now());
}

export function isTyping(fromUserId: string, toUserId: string): boolean {
  const ts = typingMap.get(`${fromUserId}:${toUserId}`);
  if (!ts) return false;
  return Date.now() - ts < TYPING_TTL_MS;
}
