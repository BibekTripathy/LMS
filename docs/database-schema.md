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

**`VideoProgress`**
- `id`: UUID / Primary Key
- `student`: ForeignKey to `User`
- `lesson`: ForeignKey to `Lesson`
- `timestamp`: Integer (seconds watched)
- `is_completed`: Boolean
- `last_updated`: DateTime
- **Constraints**: `UniqueConstraint(fields=['student', 'lesson'])`. Makes progress unique per student and lesson.

## 4. Assessments
**`Quiz`**
- `id`: UUID / Primary Key
- `lesson`: ForeignKey to `Lesson` (OneToOne or ForeignKey depending on structure)
- `title`: String
- `passing_score_percentage`: Integer

**`Question`**
- `id`: UUID / Primary Key
- `quiz`: ForeignKey to `Quiz` (Related name: `questions`)
- `text`: Text
- `order`: Integer

**`AnswerChoice`**
- `id`: UUID / Primary Key
- `question`: ForeignKey to `Question` (Related name: `choices`)
- `text`: String
- `is_correct`: Boolean

**`QuizAttempt`**
- `id`: UUID / Primary Key
- `student`: ForeignKey to `User`
- `quiz`: ForeignKey to `Quiz`
- `status`: String (Choices: `IN_PROGRESS`, `SUBMITTED`)
- `score`: Decimal (Null if IN_PROGRESS)
- `passed`: Boolean (Null if IN_PROGRESS)
- `start_time`: DateTime
- `completed_at`: DateTime (Null if IN_PROGRESS)
- **Note**: Unlimited retakes are allowed. Every attempt is kept as a separate historical record.

**`StudentAnswer`**
- `id`: UUID / Primary Key
- `attempt`: ForeignKey to `QuizAttempt`
- `question`: ForeignKey to `Question`
- `selected_choice`: ForeignKey to `AnswerChoice`
- **Constraints**: `UniqueConstraint(fields=['attempt', 'question'])`. Ensures a student submits only one answer per question per attempt. (Backend must also validate that `selected_choice` belongs to `question` and `question` belongs to the `attempt`'s `quiz`).

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
