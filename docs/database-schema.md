# Database Schema

The database uses PostgreSQL, managed via the Django ORM. Below is an outline of the primary models, relationships, and constraints.

## 1. Users and Authentication
**`User` (Custom User Model)**
- *Note: Must be defined and configured in Django settings before the initial migration.*
- `id`: UUID / Primary Key
- `email`: String (Unique)
- `password`: String (Hashed)
- `first_name`: String
- `last_name`: String
- `role`: String (Choices: `STUDENT`, `INSTRUCTOR`, `ADMIN`, Default: `STUDENT`)
- `is_active`: Boolean
- `created_at`: DateTime
- **Constraints**: Public registration must force the `role` to `STUDENT`.

## 2. Core Learning Structure
**`Course`**
- `id`: UUID / Primary Key
- `title`: String
- `description`: Text
- `instructor`: ForeignKey to `User`
- `is_published`: Boolean (Default: False)
- `created_at`: DateTime
- **Permissions**: Only `INSTRUCTOR` (if owner) and `ADMIN` can edit.

**`Module`**
- `id`: UUID / Primary Key
- `course`: ForeignKey to `Course` (Related name: `modules`)
- `title`: String
- `order`: Integer
- **Constraints**: `UniqueConstraint(fields=['course', 'order'])` to prevent overlapping module orders.

**`Lesson`**
- `id`: UUID / Primary Key
- `module`: ForeignKey to `Module` (Related name: `lessons`)
- `title`: String
- `content`: Text (Markdown or Rich Text)
- `video_url`: String (Optional)
- `order`: Integer
- **Constraints**: `UniqueConstraint(fields=['module', 'order'])`.

## 3. Enrollments and Progress
**`Enrollment`**
- `id`: UUID / Primary Key
- `student`: ForeignKey to `User`
- `course`: ForeignKey to `Course`
- `enrolled_at`: DateTime
- **Constraints**: `UniqueConstraint(fields=['student', 'course'])`. A student can only enroll once per course.

**`LessonProgress`**
- `id`: UUID / Primary Key
- `enrollment`: ForeignKey to `Enrollment` (Related name: `lesson_progresses`)
- `lesson`: ForeignKey to `Lesson` (Related name: `progresses`)
- `last_position_seconds`: Integer (Playback position in seconds)
- `completed`: Boolean (Completion status)
- `created_at`: DateTime
- `updated_at`: DateTime
- **Constraints**: `UniqueConstraint(fields=['enrollment', 'lesson'])`. Makes progress unique per enrollment and lesson.

## 4. Assessments
**`Quiz`**
- `id`: UUID / Primary Key
- `course`: ForeignKey to `Course` (Related name: `quizzes`)
- `lesson`: ForeignKey to `Lesson` (Optional, Related name: `quizzes`)
- `title`: String
- `description`: Text
- `time_limit_seconds`: Integer (default 1800, 0 for unlimited)
- `pass_percentage`: Integer (default 70)
- `status`: String (Choices: `DRAFT`, `PUBLISHED`, `ARCHIVED`)
- `created_at`: DateTime
- `updated_at`: DateTime

**`Question`**
- `id`: UUID / Primary Key
- `quiz`: ForeignKey to `Quiz` (Related name: `questions`)
- `prompt`: Text (alias: `text`)
- `question_type`: String (Choices: `MCQ`)
- `marks`: Integer (default 1)
- `explanation`: Text (revealed after submission)
- `position`: Integer (alias: `order`)
- **Constraints**: `UniqueConstraint(fields=['quiz', 'position'])`.

**`QuestionOption`**
- `id`: UUID / Primary Key
- `question`: ForeignKey to `Question` (Related name: `options`)
- `text`: String
- `is_correct`: Boolean (not exposed before submission)
- `position`: Integer (alias: `order`)
- **Constraints**: `UniqueConstraint(fields=['question', 'position'])`.

**`QuizAttempt`**
- `id`: UUID / Primary Key
- `quiz`: ForeignKey to `Quiz` (Related name: `attempts`)
- `student`: ForeignKey to `User` (Related name: `quiz_attempts`)
- `status`: String (Choices: `IN_PROGRESS`, `SUBMITTED`, `EXPIRED`)
- `score`: Decimal (Null if IN_PROGRESS)
- `marks_obtained`: Decimal
- `total_marks_possible`: Integer
- `percentage`: Decimal
- `passed`: Boolean
- `started_at`: DateTime (alias: `start_time`)
- `deadline_at`: DateTime
- `submitted_at`: DateTime (alias: `completed_at`)

**`Answer`**
- `id`: UUID / Primary Key
- `attempt`: ForeignKey to `QuizAttempt` (Related name: `answers`)
- `question`: ForeignKey to `Question` (Related name: `student_answers`)
- `selected_option`: ForeignKey to `QuestionOption` (Optional, Related name: `selected_answers`, alias: `selected_choice`)
- `is_correct`: Boolean
- `marks_awarded`: Decimal
- **Constraints**: `UniqueConstraint(fields=['attempt', 'question'])`. Validates that `selected_option` belongs to `question` and `question` belongs to `attempt.quiz`.


## 5. AI Study Resources
**`AIResource`**
- `id`: UUID / Primary Key
- `student`: ForeignKey to `User` (The user who requested/owns the resource)
- `lesson`: ForeignKey to `Lesson` (The context of the resource)
- `resource_type`: String (Choices: `SUMMARY`, `FLASHCARDS`, `MCQ_REVISION`)
- `content`: JSONField (Stores the structured output from the AI provider)
- `generated_at`: DateTime

## 6. Certificates
**`Certificate`**
- `id`: UUID / Primary Key
- `student`: ForeignKey to `User`
- `course`: ForeignKey to `Course`
- `verification_code`: String (Unique UUID or alphanumeric string)
- `issued_at`: DateTime
- `certificate_url`: String
- **Constraints**: `UniqueConstraint(fields=['student', 'course'])`. Only one certificate per student per course.
- **Criteria**: 100% video progress and passing highest-score attempts on all quizzes in the course.
