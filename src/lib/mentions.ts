import { prisma } from './prisma';

// Basic @mention detection: matches "@FirstName LastName" (both words
// required) against real users' exact names, case-insensitive. Not a full
// mention-picker UI — just enough to fire real MENTION notifications when
// someone writes a recognizable full name after an @.
const MENTION_PATTERN = /@([A-Za-z]+)(?:\s([A-Za-z]+))?/g;

export async function extractMentionedUserIds(content: string, authorId: string): Promise<string[]> {
  const pairs: { firstName: string; lastName: string }[] = [];
  let match: RegExpExecArray | null;
  MENTION_PATTERN.lastIndex = 0;
  while ((match = MENTION_PATTERN.exec(content)) !== null) {
    if (match[2]) pairs.push({ firstName: match[1], lastName: match[2] });
  }
  if (pairs.length === 0) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: pairs.map((p) => ({
        firstName: { equals: p.firstName, mode: 'insensitive' as const },
        lastName: { equals: p.lastName, mode: 'insensitive' as const },
      })),
    },
    select: { id: true },
  });

  return [...new Set(users.map((u) => u.id))].filter((id) => id !== authorId);
}
