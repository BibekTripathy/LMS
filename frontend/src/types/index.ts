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

export type AIResourceType = 'MCQ' | 'FLASHCARDS' | 'SUMMARY' | 'REVISION';
export type AIGeneratableType = Exclude<AIResourceType, 'REVISION'>;
export type AIResourceStatus = 'DRAFT' | 'PUBLISHED';

export interface MCQItem {
  prompt: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

export interface MCQContent {
  title: string;
  questions: MCQItem[];
}

export interface FlashcardItem {
  front: string;
  back: string;
}

export interface FlashcardContent {
  title: string;
  cards: FlashcardItem[];
}

export interface SummaryContent {
  title: string;
  summary: string;
  key_points: string[];
  revision_topics: string[];
}

export interface RevisionTopicStat {
  topic: string;
  accuracy_percent: number;
  target_percent: number;
  questions_answered: number;
  questions_correct: number;
}

export interface RevisionContent {
  title: string;
  overview: string;
  focus_areas: { topic: string; reason: string; actions: string[] }[];
  next_steps: string[];
  /** Server-computed from submitted attempts; display these figures, not the model's. */
  performance: {
    submitted_attempts: number;
    quizzes_attempted: number;
    overall_accuracy_percent: number;
    topics: RevisionTopicStat[];
    weak_topics: {
      topic: string;
      accuracy_percent: number;
      target_percent: number;
      missed_questions: { question: string; correct_answer: string; your_answer: string }[];
    }[];
  };
}

export type AIResourceContent = MCQContent | FlashcardContent | SummaryContent | RevisionContent;

export interface AIResource<T = AIResourceContent> {
  id: string;
  course: string;
  course_title: string;
  lesson: string | null;
  lesson_title: string | null;
  created_by: string;
  resource_type: AIResourceType;
  status: AIResourceStatus;
  content: T;
  converted_quiz: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface AIErrorResponse {
  error: string;
  code:
    | 'INSUFFICIENT_CONTENT' | 'RATE_LIMITED' | 'AI_INVALID_OUTPUT' | 'AI_PROVIDER_ERROR'
    | 'AI_RATE_LIMITED' | 'AI_QUOTA_EXHAUSTED' | 'AI_NOT_CONFIGURED' | 'AI_TIMEOUT'
    | 'NOT_COURSE_INSTRUCTOR' | 'NOT_A_DRAFT' | 'NOT_EDITABLE' | 'ALREADY_CONVERTED'
    | 'ALREADY_PUBLISHED' | 'NOT_MCQ' | 'NO_ATTEMPTS' | 'VALIDATION_ERROR' | string;
  details?: Record<string, string[]>;
}

/** Response of POST /resources/{id}/convert-to-quiz/ (student-safe quiz shape, no answers). */
export interface ConvertedQuiz {
  id: string;
  course: string;
  lesson: string | null;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  total_questions: number;
  total_marks: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Authentication Types
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Quiz & Assessment Types
export interface QuestionOption {
  id: string;
  text: string;
  position: number;
  order: number;
  is_correct?: boolean; // Only present in review or builder
}

export interface QuestionOptionInput {
  id?: string;
  text: string;
  is_correct?: boolean;
  position?: number;
  order?: number;
}

export interface Question {
  id: string;
  quiz?: string;
  prompt: string;
  text: string;
  question_type: 'MCQ';
  marks: number;
  position: number;
  order: number;
  explanation?: string;
  options: QuestionOption[];
}

export interface QuestionInput {
  prompt?: string;
  text?: string;
  question_type?: 'MCQ';
  marks?: number;
  position?: number;
  order?: number;
  explanation?: string;
  options?: QuestionOptionInput[];
}

export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Quiz {
  id: string;
  course: string;
  lesson?: string | null;
  title: string;
  description: string;
  time_limit_seconds: number;
  pass_percentage: number;
  passing_score_percentage: number;
  /** null = unlimited retakes. */
  max_attempts: number | null;
  /** Attempts the current student has left; null when unlimited. Only on GET /quizzes/{id}/. */
  attempts_remaining?: number | null;
  leaderboard_enabled: boolean;
  status: QuizStatus;
  total_marks: number;
  total_questions: number;
  questions?: Question[];
  created_at?: string;
  updated_at?: string;
}

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';

export interface QuizAttemptAnswer {
  id: string;
  question_id: string;
  selected_option_id: string | null;
  choice_id?: string | null;
  selected_choice_id?: string | null;
  is_correct?: boolean;
  marks_awarded?: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  status: AttemptStatus;
  started_at: string;
  start_time: string;
  deadline_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  score: number | null;
  marks_obtained: number;
  total_marks_possible: number;
  percentage: number | null;
  passed: boolean | null;
  pass_percentage: number;
  answers?: QuizAttemptAnswer[];
  questions?: Question[];
}

export interface QuizResultsMe {
  quiz_id: string;
  quiz_title: string;
  pass_percentage: number;
  max_attempts: number | null;
  attempts_remaining: number | null;
  total_attempts: number;
  best_score: number | null;
  highest_percentage: number | null;
  has_passed: boolean;
  attempts: QuizAttempt[];
}

// Analytics & Certificate Types (backend `analytics` and `certificates` apps)
export interface CourseLessonStats {
  lesson_id: string;
  title: string;
  module_id: string;
  module_title: string;
  order: number;
  completed_count: number;
  completion_rate: number;
}

export interface CourseQuizStats {
  quiz_id: string;
  title: string;
  status: QuizStatus;
  pass_percentage: number;
  total_attempts: number;
  unique_students_attempted: number;
  average_score: number;
  pass_rate: number;
  highest_score: number;
}

export interface CourseStudentStats {
  student_id: string;
  student_name: string;
  student_email: string;
  enrolled_at: string;
  status: string;
  completed_lessons_count: number;
  total_lessons_count: number;
  progress_percentage: number;
  is_completed: boolean;
  quiz_attempts_count: number;
  average_quiz_score: number;
  quizzes_passed_count: number;
  last_active: string | null;
}

export interface CourseAnalytics {
  course_id: string;
  course_title: string;
  status: CourseStatus;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  dropped_enrollments: number;
  completion_rate: number;
  average_course_progress: number;
  total_lessons: number;
  total_quizzes: number;
  total_quiz_attempts: number;
  average_quiz_score: number;
  quiz_pass_rate: number;
  lessons_breakdown: CourseLessonStats[];
  quizzes_breakdown: CourseQuizStats[];
  students: CourseStudentStats[];
}

export interface AdminAnalytics {
  users: { total_users: number; total_students: number; total_instructors: number; total_admins: number; active_users: number };
  courses: {
    total_courses: number;
    published_courses: number;
    draft_courses: number;
    archived_courses: number;
    total_modules: number;
    total_lessons: number;
  };
  enrollments: {
    total_enrollments: number;
    active_enrollments: number;
    completed_enrollments: number;
    dropped_enrollments: number;
    completion_rate: number;
  };
  progress: { total_progress_records: number; total_completed_lessons: number };
  assessments: {
    total_quizzes: number;
    published_quizzes: number;
    total_questions: number;
    total_quiz_attempts: number;
    submitted_quiz_attempts: number;
    in_progress_quiz_attempts: number;
    expired_quiz_attempts: number;
    passed_quiz_attempts: number;
    average_quiz_score: number;
    overall_quiz_pass_rate: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  /** Only returned to the course instructor and admins. */
  student_email: string | null;
  best_score: number;
  highest_percentage: number;
  total_attempts: number;
  passed: boolean;
  submitted_at: string;
}

export interface QuizLeaderboard {
  quiz_id: string;
  quiz_title: string;
  course_id: string;
  course_title: string;
  pass_percentage: number;
  total_participants: number;
  leaderboard: LeaderboardEntry[];
  my_entry: LeaderboardEntry | null;
}

export interface StudentAnalytics {
  total_enrolled: number;
  completed_courses: number;
  total_quizzes_taken: number;
  average_quiz_percentage: number;
  recent_attempts: {
    quiz_id: string;
    quiz_title: string;
    course_title: string;
    score_percentage: number;
    passed: boolean;
    date: string;
  }[];
}

export interface Certificate {
  id: string;
  student: string;
  student_name: string;
  course: string;
  course_title: string;
  instructor_name: string;
  verification_code: string;
  issued_at: string;
  certificate_url?: string | null;
}

/** Public, limited view returned by GET /certificates/verify/{code}/. */
export interface CertificateVerification {
  valid: boolean;
  verification_code: string;
  course_title: string;
  student_name: string;
  instructor_name: string;
  issued_at: string;
}

/** `details` of a 400 CRITERIA_NOT_MET from GET /courses/{id}/certificate/. */
export interface CertificateCriteria {
  reason?: string;
  enrolled?: boolean;
  total_lessons?: number;
  completed_lessons?: number;
  all_lessons_completed?: boolean;
  total_quizzes?: number;
  quizzes_passed?: number;
  all_quizzes_passed?: boolean;
  missing_quizzes?: { quiz_id: string; title: string; pass_percentage: number }[];
  eligible: boolean;
}

// Student Learning & Course Progress Types
export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  last_position_seconds: number;
  timestamp: number;
  completed: boolean;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseProgressLesson {
  lesson_id: string;
  title: string;
  order: number;
  is_required: boolean;
  completed: boolean;
  last_position_seconds: number;
}

export interface CourseProgress {
  course_id: string;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  required_lessons: number;
  completed_required_lessons: number;
  progress_percentage: number;
  is_completed: boolean;
  last_accessed_lesson_id: string | null;
  lessons?: CourseProgressLesson[];
}



