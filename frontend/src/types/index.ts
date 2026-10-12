export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export type CourseDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface LessonSummary {
  id: string;
  title: string;
  video_url: string | null;
  order: number;
  position: number;
  is_required: boolean;
}

export interface Lesson extends LessonSummary {
  module: string;
  content: string;
  reading_content: string;
  transcript: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course: string;
  title: string;
  description: string;
  order: number;
  position: number;
  lessons: LessonSummary[];
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructor_name: string;
  category: string;
  difficulty: CourseDifficulty;
  thumbnail_url: string | null;
  is_published: boolean;
  status: CourseStatus;
  modules_count: number;
  lessons_count: number;
  is_enrolled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseDetail extends Course {
  modules: Module[];
}

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';

export interface Enrollment {
  id: string;
  student: string;
  student_email: string;
  student_name: string;
  course: string;
  course_detail?: Course;
  enrolled_at: string;
  status: EnrollmentStatus;
}
