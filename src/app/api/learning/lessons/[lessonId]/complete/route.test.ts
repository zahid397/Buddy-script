import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/testUtils/prismaMock';

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ getAuthUserId: vi.fn().mockResolvedValue('user-1') }));

const { POST, DELETE } = await import('./route');

function request(method: 'POST' | 'DELETE') {
  return new NextRequest('http://localhost/api/learning/lessons/lesson-1/complete', { method });
}

describe('POST /api/learning/lessons/[lessonId]/complete', () => {
  it('upserts on (userId, lessonId) so completing twice never duplicates progress', async () => {
    prismaMock.learningLesson.findUnique.mockResolvedValue({ id: 'lesson-1' } as never);
    prismaMock.userLessonProgress.upsert.mockResolvedValue({} as never);

    const response = await POST(request('POST'), { params: { lessonId: 'lesson-1' } });

    expect(response.status).toBe(200);
    expect(prismaMock.userLessonProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_lessonId: { userId: 'user-1', lessonId: 'lesson-1' } } })
    );
  });

  it('returns 404 for a lesson that does not exist', async () => {
    prismaMock.learningLesson.findUnique.mockResolvedValue(null);

    const response = await POST(request('POST'), { params: { lessonId: 'missing' } });

    expect(response.status).toBe(404);
    expect(prismaMock.userLessonProgress.upsert).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/learning/lessons/[lessonId]/complete', () => {
  it('clears progress for the caller only', async () => {
    prismaMock.userLessonProgress.deleteMany.mockResolvedValue({ count: 1 } as never);

    const response = await DELETE(request('DELETE'), { params: { lessonId: 'lesson-1' } });
    const json = await response.json();

    expect(json).toEqual({ completed: false });
    expect(prismaMock.userLessonProgress.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', lessonId: 'lesson-1' },
    });
  });
});
