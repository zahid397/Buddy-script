import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import type { LearningCourseDTO } from '@/types';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const courses = await prisma.learningCourse.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: { progress: { where: { userId, completedAt: { not: null } }, select: { id: true } } },
      },
      savedBy: { where: { userId }, select: { id: true } },
    },
  });

  const items: LearningCourseDTO[] = courses.map((course) => {
    const lessons = course.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      content: l.content,
      order: l.order,
      durationMin: l.durationMin,
      completed: l.progress.length > 0,
    }));
    const completedLessonCount = lessons.filter((l) => l.completed).length;
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      category: course.category,
      lessonCount: lessons.length,
      completedLessonCount,
      progressPercent: lessons.length > 0 ? Math.round((completedLessonCount / lessons.length) * 100) : 0,
      isSaved: course.savedBy.length > 0,
      lessons,
    };
  });

  return NextResponse.json({ items });
}
