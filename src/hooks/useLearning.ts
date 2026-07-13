'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { LearningCourseDTO } from '@/types';

export const LEARNING_KEY = ['learning-courses'];

export function useLearningCourses() {
  return useQuery({
    queryKey: LEARNING_KEY,
    queryFn: () => apiFetch<{ items: LearningCourseDTO[] }>('/api/learning/courses'),
  });
}

export function useToggleLessonComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, completed }: { lessonId: string; completed: boolean }) =>
      apiFetch<{ completed: boolean }>(`/api/learning/lessons/${lessonId}/complete`, {
        method: completed ? 'DELETE' : 'POST',
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LEARNING_KEY }),
  });
}

export function useToggleSaveCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, saved }: { courseId: string; saved: boolean }) =>
      apiFetch<{ isSaved: boolean }>(`/api/learning/courses/${courseId}/save`, {
        method: saved ? 'DELETE' : 'POST',
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LEARNING_KEY }),
  });
}
