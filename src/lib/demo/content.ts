// Local, deterministic content banks for demo-bot activity. No external AI
// calls — everything here is a fixed, reviewed template so nothing
// unpredictable (or costly) ever gets posted on a user's behalf.

export const POST_TEMPLATES: string[] = [
  // coding progress
  'Finally untangled that async race condition that had been haunting me all week. Small win, big relief.',
  'Refactored our data layer today — same features, 30% less code. Worth the afternoon.',
  'Hit a clean 100% test pass on the new module. Onward to the next one.',
  // community events
  'Great turnout at last night\'s meetup — already looking forward to the next one.',
  'Met a bunch of new people at the community call today. Love this crew.',
  'Reminder: the next community session is coming up soon, would be great to see familiar faces.',
  // design feedback
  'Reworked the onboarding flow based on last week\'s feedback session. Feels much smoother now.',
  'Spent the morning in a design critique — brutal but exactly what the project needed.',
  'Simplified the color system down to a handful of tokens. Consistency for the win.',
  // study updates
  'Wrapped up another chapter of the systems design book. Slow and steady.',
  'Finally understood how consistent hashing works end to end. Took a few tries.',
  'Started a new course this week — excited but also a little intimidated.',
  // product milestones
  'We just crossed a nice milestone on the project — small team, steady progress.',
  'Shipped the feature we\'ve been planning for weeks. Feels good to see it live.',
  'Closed out the sprint with everything we committed to. Rare and satisfying.',
  // team collaboration
  'Pair-programmed through a gnarly bug today — two heads really are better than one.',
  'Really appreciated the team\'s patience while I ramped up on the new codebase.',
  'Great retro today — small process tweak that should save everyone time.',
  // career learning
  'Learned a hard lesson about scope creep this week. Writing it down so future-me remembers.',
  'Had a really useful 1:1 today about career growth. Lots to think about.',
  'Six months into this role and still learning something new every week.',
];

export const COMMENT_TEMPLATES: string[] = [
  'This is great, thanks for sharing!',
  'Nice work, really enjoyed reading this.',
  'Congrats, well deserved!',
  'Love this energy, keep it up.',
  'Really useful, bookmarking this.',
  'This resonates with me a lot.',
  'Solid update, thanks for the transparency.',
];

export type ReplyCategory = 'greeting' | 'project' | 'event' | 'appreciation' | 'followUp' | 'casual';

export const DM_REPLY_TEMPLATES: Record<ReplyCategory, string[]> = {
  greeting: [
    'Hey! Good to hear from you 👋',
    "Hi there! What's up?",
    "Hello! How's your day going?",
    'Hey hey, what brings you by?',
  ],
  project: [
    "That sounds like solid progress — what's next on your list?",
    "I'd love to hear more about how that's going.",
    "I've been meaning to try something similar — any lessons learned?",
    "That's a great milestone. How long did that take you?",
  ],
  event: [
    "I'll be there! Looking forward to it.",
    'Count me in — thanks for the heads up.',
    'Nice, are you going too?',
    "That sounds fun, I'll try to make it.",
  ],
  appreciation: [
    'Aw, thank you! That means a lot.',
    "You're too kind, thanks!",
    'Appreciate you saying that 🙏',
    'Thanks! Right back at you.',
  ],
  followUp: [
    "Good question — let me think about that and get back to you.",
    "Not sure yet, but I'll keep you posted.",
    "That's a good point, I hadn't considered that.",
    "Let me check and I'll follow up.",
  ],
  casual: [
    'Haha, fair enough.',
    'Totally get that.',
    'Same here honestly.',
    'Makes sense to me.',
    'Good to know!',
  ],
};

export function classifyMessage(content: string): ReplyCategory {
  const text = content.toLowerCase();
  if (/\b(hi|hey|hello|yo)\b/.test(text)) return 'greeting';
  if (/\b(thanks|thank you|appreciate)\b/.test(text)) return 'appreciation';
  if (/\b(event|meetup|going|rsvp)\b/.test(text)) return 'event';
  if (/\b(project|code|coding|build|shipped|deploy|feature|bug)\b/.test(text)) return 'project';
  if (text.trim().endsWith('?')) return 'followUp';
  return 'casual';
}

/** Picks randomly from a pool, avoiding an exact repeat of `lastPick` when possible. */
export function pickAvoidingRepeat<T>(pool: T[], lastPick: T | null): T {
  const filtered = lastPick ? pool.filter((item) => item !== lastPick) : pool;
  const candidates = filtered.length > 0 ? filtered : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
