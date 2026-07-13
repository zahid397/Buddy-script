import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const course = await prisma.learningCourse.findUnique({ where: { id: params.courseId } });
  if (!course) return errorResponse(404, 'Course not found');

  await prisma.savedCourse.upsert({
    where: { userId_courseId: { userId, courseId: params.courseId } },
    create: { userId, courseId: params.courseId },
    update: {},
  });

  return NextResponse.json({ isSaved: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { courseId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.savedCourse.deleteMany({ where: { userId, courseId: params.courseId } });

  return NextResponse.json({ isSaved: false });
}
