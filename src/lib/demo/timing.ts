// Deterministic (non-random) timing helpers: hashing a stable id into a
// bounded delay means every poll agrees on the same "due at" moment without
// needing to persist a scheduled-job record anywhere.

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hashToRange(input: string, min: number, max: number): number {
  return min + (hashString(input) % (max - min + 1));
}

/** 1-2s deterministic "typing starts" offset from a message id. */
export function typingStartOffsetMs(messageId: string): number {
  return hashToRange(`typing:${messageId}`, 1000, 2000);
}

/** 3-8s deterministic "reply sent" offset from a message id. */
export function replyOffsetMs(messageId: string): number {
  return hashToRange(`reply:${messageId}`, 3000, 8000);
}
