import { beforeEach, vi } from 'vitest';
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';

// Shared deep-mocked Prisma client for unit tests. Usage in a test file:
//
//   vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
//   import { prismaMock } from '@/lib/testUtils/prismaMock';
//
// Must be declared before importing the module under test so the mock is
// in place first. mockReset runs automatically between tests.
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

export { vi };
