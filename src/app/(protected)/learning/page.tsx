'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bookmark, CheckCircle2, Circle, Clock, GraduationCap } from 'lucide-react';
import { useLearningCourses, useToggleLessonComplete, useToggleSaveCourse } from '@/hooks/useLearning';
import type { LearningCategoryValue, LearningCourseDTO, LearningLessonDTO } from '@/types';
import { ApiError } from '@/lib/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';

const CATEGORY_LABELS: Record<LearningCategoryValue | 'ALL', string> = {
  ALL: 'All',
  WEB_DEVELOPMENT: 'Web Development',
  UI_UX_DESIGN: 'UI/UX Design',
  GAME_DEVELOPMENT: 'Game Development',
  CAREER_SKILLS: 'Career Skills',
};

function LessonModal({
  lesson,
  onClose,
  onToggleComplete,
  pending,
}: {
  lesson: LearningLessonDTO;
  onClose: () => void;
  onToggleComplete: () => void;
  pending: boolean;
}) {
  return (
    <Modal title={lesson.title} onClose={onClose}>
      <p className="flex items-center gap-1 text-xs text-gray-400">
        <Clock size={12} /> {lesson.durationMin} min
      </p>
      <p className="mt-3 text-sm leading-relaxed text-gray-700">{lesson.content}</p>
      <button
        type="button"
        onClick={onToggleComplete}
        disabled={pending}
        className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
          lesson.completed ? 'bg-gray-100 text-gray-600' : 'bg-brand text-white'
        }`}
      >
        {lesson.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        {lesson.completed ? 'Completed — mark incomplete' : 'Mark lesson complete'}
      </button>
    </Modal>
  );
}

function CourseCard({ course }: { course: LearningCourseDTO }) {
  const [activeLesson, setActiveLesson] = useState<LearningLessonDTO | null>(null);
  const toggleLesson = useToggleLessonComplete();
  const toggleSave = useToggleSaveCourse();

  const handleSave = async () => {
    try {
      await toggleSave.mutateAsync({ courseId: course.id, saved: course.isSaved });
      toast.success(course.isSaved ? 'Removed from saved courses' : 'Course saved');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update saved course');
    }
  };

  const handleToggleComplete = async () => {
    if (!activeLesson) return;
    try {
      await toggleLesson.mutateAsync({ lessonId: activeLesson.id, completed: activeLesson.completed });
      setActiveLesson({ ...activeLesson, completed: !activeLesson.completed });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update lesson progress');
    }
  };

  const nextLesson = course.lessons.find((l) => !l.completed) ?? course.lessons[0];

  return (
    <div className="_feed_inner_area _b_radious6 overflow-hidden bg-white">
      {course.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.thumbnailUrl} alt={course.title} className="h-32 w-full object-cover" />
      ) : null}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-brand">
              {CATEGORY_LABELS[course.category]}
            </p>
            <h3 className="text-sm font-semibold text-gray-800">{course.title}</h3>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={toggleSave.isPending}
            aria-label={course.isSaved ? 'Remove from saved courses' : 'Save course'}
            className="shrink-0 text-gray-400 hover:text-brand"
          >
            <Bookmark size={16} fill={course.isSaved ? '#1890FF' : 'none'} color={course.isSaved ? '#1890FF' : 'currentColor'} />
          </button>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-gray-400">{course.description}</p>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-brand" style={{ width: `${course.progressPercent}%` }} />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {course.completedLessonCount}/{course.lessonCount} lessons · {course.progressPercent}%
        </p>

        {nextLesson ? (
          <button
            type="button"
            onClick={() => setActiveLesson(nextLesson)}
            className="mt-3 w-full rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white"
          >
            {course.completedLessonCount === 0 ? 'Start course' : course.progressPercent === 100 ? 'Review course' : 'Continue learning'}
          </button>
        ) : null}

        <ul className="mt-3 space-y-1 border-t border-gray-50 pt-3">
          {course.lessons.map((lesson) => (
            <li key={lesson.id}>
              <button
                type="button"
                onClick={() => setActiveLesson(lesson)}
                className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-xs text-gray-600 hover:bg-gray-50"
              >
                {lesson.completed ? (
                  <CheckCircle2 size={14} className="shrink-0 text-brand" />
                ) : (
                  <Circle size={14} className="shrink-0 text-gray-300" />
                )}
                <span className="truncate">{lesson.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {activeLesson ? (
        <LessonModal
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onToggleComplete={handleToggleComplete}
          pending={toggleLesson.isPending}
        />
      ) : null}
    </div>
  );
}

export default function LearningPage() {
  const { data, isLoading } = useLearningCourses();
  const [category, setCategory] = useState<LearningCategoryValue | 'ALL'>('ALL');

  const courses = data?.items ?? [];
  const filtered = category === 'ALL' ? courses : courses.filter((c) => c.category === category);
  const savedCourses = courses.filter((c) => c.isSaved);

  return (
    <div>
      <div className="_feed_inner_area _b_radious6 mb-4 bg-white px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">Learning</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABELS) as (LearningCategoryValue | 'ALL')[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                category === key ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : null}

      {savedCourses.length > 0 && category === 'ALL' ? (
        <div className="mb-4">
          <h3 className="mb-2 px-1 text-sm font-semibold text-gray-700">Saved courses</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {savedCourses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <div className="_feed_inner_area _b_radious6 flex flex-col items-center gap-2 bg-white px-5 py-16 text-center">
          <GraduationCap size={28} className="text-gray-300" />
          <p className="text-sm text-gray-500">No courses in this category yet.</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
