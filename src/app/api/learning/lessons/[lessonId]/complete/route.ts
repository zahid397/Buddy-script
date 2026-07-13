import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: { lessonId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const lesson = await prisma.learningLesson.findUnique({ where: { id: params.lessonId } });
  if (!lesson) return errorResponse(404, 'Lesson not found');

  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: params.lessonId } },
    update: { completedAt: new Date() },
    create: { userId, lessonId: params.lessonId, completedAt: new Date() },
  });

  return NextResponse.json({ completed: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { lessonId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.userLessonProgress.deleteMany({ where: { userId, lessonId: params.lessonId } });

  return NextResponse.json({ completed: false });
}
