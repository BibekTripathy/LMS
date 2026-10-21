# API Contract

All API endpoints are prefixed with `/api/v1/`. The backend is implemented using Django REST Framework (DRF).

## 1. Authentication and Authorization
- **Method**: JWT (JSON Web Tokens).
- **Header**: Requests to protected endpoints must include the header `Authorization: Bearer <access_token>`.

### Auth Endpoints
- `POST /api/v1/auth/register/`
  - **Payload**: `{ "email": "...", "password": "...", "first_name": "...", "last_name": "..." }`
  - **Note**: Always creates a `STUDENT` user. `role` fields in the payload are ignored.
- `POST /api/v1/auth/login/`
  - **Payload**: `{ "email": "...", "password": "..." }`
  - **Response**: `{ "access": "<token>", "refresh": "<token>" }`
- `POST /api/v1/auth/logout/`
  - **Payload**: `{ "refresh": "<token>" }`
  - **Note**: Blacklists the refresh token to prevent further use.

## 2. API Standards
### Error Response Convention
All 4xx and 5xx errors follow a standardized JSON format:
```json
{
  "error": "Short error description",
  "code": "ERROR_CODE_IDENTIFIER",
  "details": {
    "field_name": ["Specific validation error message"]
  }
}
```
- **400 Bad Request**: Validation errors.
- **401 Unauthorized**: Missing or invalid JWT.
- **403 Forbidden**: User lacks permission (e.g., missing enrollment, student editing course).
- **404 Not Found**: Resource does not exist.

### Pagination
List endpoints use offset/limit or page number pagination.
- **Query Params**: `?page=1&page_size=20`
- **Response Format**:
```json
{
  "count": 100,
  "next": "http://.../?page=2&page_size=20",
  "previous": null,
  "results": [ ... ]
}
```

## 3. Users
- `GET /api/v1/users/me/`
  - Returns the authenticated user's profile and role.

## 4. Courses & Modules
- `GET /api/v1/courses/`
  - Returns a list of published courses.
- `GET /api/v1/courses/{id}/`
  - Returns course details, including its modules and lessons (if enrolled).
- `POST /api/v1/courses/` (INSTRUCTOR/ADMIN only)
  - Create a new course.
- `POST /api/v1/courses/{id}/enroll/`
  - Enrolls the authenticated user in the course.

## 5. Lessons & Progress
- `GET /api/v1/lessons/{id}/`
  - Returns lesson content and associated video URL. 
  - **Authorization**: Requires a valid `Enrollment` for the related course.
- `GET /api/v1/lessons/{id}/progress/`
  - Retrieves student's saved playback position and completion status. Restores latest persisted position from PostgreSQL.
  - **Authorization**: Requires a valid `Enrollment`.
- `PATCH /api/v1/lessons/{id}/progress/`
  - **Payload**: `{ "last_position_seconds": 120, "completed": false }` (or aliases `"timestamp"`, `"is_completed"`).
  - Updates the student's playback position and completion status in PostgreSQL. Completion is one-way: `completed: false` never un-completes a lesson.
  - **Authorization**: Requires a valid `Enrollment`. Validates playback position on the backend.
- `POST /api/v1/lessons/{id}/complete/`
  - Marks the lesson completed for the student.
  - **Authorization**: Requires a valid `Enrollment`.
- `GET /api/v1/courses/{id}/progress/`
  - Returns overall course completion statistics: `total_lessons`, `completed_lessons`, `required_lessons`, `completed_required_lessons`, `progress_percentage`, `is_completed`, and lesson breakdown. `progress_percentage` and `is_completed` count only lessons with `is_required = true` (all lessons if none are required).
  - **Authorization**: Requires a valid `Enrollment`.


## 6. Quizzes
- `GET /api/v1/quizzes/{id}/`
  - Returns quiz details and questions. **Does not return correct answers or explanations.**
  - **Authorization**: Requires valid `Enrollment`. `DRAFT` quizzes return `404` to everyone except the course instructor and admins. New quizzes default to `DRAFT`.
- `POST /api/v1/quizzes/{id}/start/`
  - Initiates a new `QuizAttempt` and sets status to `IN_PROGRESS` with deadline. Returns attempt details: `201` for a new attempt, `200` when an unexpired in-progress attempt is resumed.
  - **Authorization**: Requires valid `Enrollment`.
- `GET /api/v1/attempts/{id}/`
  - Returns current attempt state and saved answers for the student. Correct options, explanations, and per-answer `is_correct` / `marks_awarded` appear **only once the attempt is `SUBMITTED`** (never for `IN_PROGRESS` or `EXPIRED`).
  - **Authorization**: Student owner of attempt.
- `PUT /api/v1/attempts/{id}/answers/`
  - **Payload**: `{ "answers": [ {"question_id": "...", "selected_option_id": "..."} ] }`
  - Saves in-progress draft answers. Enforces deadline and option ownership; malformed items (non-UUID ids, non-list `answers`) return `400`.
  - **Authorization**: Student owner of attempt.
- `POST /api/v1/attempts/{id}/submit/`
  - **Payload** (optional): `{ "answers": [ ... ] }`
  - Grades the submission on the server using an atomic transaction, updates status to `SUBMITTED`, and returns score, percentage, and detailed review. Rejects expired or duplicate submissions.
  - **Authorization**: Student owner of attempt.
- `POST /api/v1/quizzes/{id}/submit/`
  - **Payload**: `{ "attempt_id": "...", "answers": [ ... ] }`
  - Alternate endpoint for submitting and grading an attempt. A missing or non-UUID `attempt_id` returns `400`.
- `GET /api/v1/quizzes/{id}/results/me/`
  - Returns student's historical attempts, best score, highest percentage, and pass/fail summary.
  - **Authorization**: Requires valid `Enrollment`.
- `GET /api/v1/quizzes/{id}/leaderboard/`
  - Returns ranking leaderboard calculated using PostgreSQL ranking window queries (best score per student).
  - Optional query parameter: `?limit=10`.
  - **Authorization**: Requires valid `Enrollment` in the quiz's course, or course instructor/admin ownership.


### Quiz authoring (course instructor or admin)
- `GET /api/v1/courses/{id}/quizzes/`
  - Course instructor/admin: every quiz, including correct options and explanations (authoring view). Actively enrolled student: `PUBLISHED` quizzes only, without answers. Anyone else gets `403`.
- `POST /api/v1/courses/{id}/quizzes/`
  - **Payload**: `{ "title", "description", "lesson"?, "time_limit_seconds"?, "pass_percentage"? (0-100), "status"? }`. `course` comes from the URL; `lesson` must belong to it. New quizzes default to `DRAFT`.
- `GET | PATCH | DELETE /api/v1/quizzes/{id}/manage/`
  - `course` is read-only. `DELETE` returns `204`, or `400 HAS_ATTEMPTS` if students have attempted the quiz (archive it with `PATCH {"status": "ARCHIVED"}` instead).
- `POST /api/v1/quizzes/{id}/questions/`
  - **Payload**: `{ "prompt", "marks"?, "explanation"?, "position"?, "options": [ { "text", "is_correct" } ] }`. Requires 2-6 options with unique text and exactly one `is_correct`. `position` defaults to the next free slot; a taken position returns `400`.
- `PATCH | DELETE /api/v1/questions/{id}/`
  - Options are updated in place (send an option's `id` to keep it). Once students have answered a question, its options cannot change (`400`) and it cannot be deleted (`400 HAS_ANSWERS`); prompt/explanation/marks can still be edited.

## 7. AI Study Resources
The AI provider is called only by the backend (`ai_study` app). Every generated item is validated before it is saved. Lesson resources start as `DRAFT` and are visible only to the course instructor (and admins) until they are published.

**Roles**
- *Course manager* means the course's instructor, or an admin. Only managers can generate, edit, publish, or convert lesson resources (other users get `403 NOT_COURSE_INSTRUCTOR`).
- Students with an `ACTIVE` enrollment can read `PUBLISHED` lesson resources. Drafts, and resources from courses they are not enrolled in, return `404`.
- `REVISION` resources are private to the student who requested them (and admins).

**Resource object**
```json
{
  "id": "uuid", "course": "uuid", "course_title": "...", "lesson": "uuid | null", "lesson_title": "... | null",
  "created_by": "uuid", "resource_type": "MCQ | FLASHCARDS | SUMMARY | REVISION",
  "status": "DRAFT | PUBLISHED", "content": { }, "converted_quiz": "uuid | null",
  "created_at": "ISO-8601", "updated_at": "ISO-8601", "published_at": "ISO-8601 | null"
}
```

**`content` by type** (enforced by `ai_study/validators.py`)
- `MCQ`: `{ "title", "questions": [ { "prompt", "options": [2-6 unique strings], "correct_option_index": 0-based int, "explanation" } ] }` (1-20 questions; the AI is asked for exactly 4 options)
- `FLASHCARDS`: `{ "title", "cards": [ { "front", "back" } ] }` (1-40 cards, fronts unique)
- `SUMMARY`: `{ "title", "summary", "key_points": [..], "revision_topics": [..] }`
- `REVISION`: `{ "title", "overview", "focus_areas": [ { "topic", "reason", "actions": [..] } ], "next_steps": [..], "performance": { server-computed figures } }`. Each `focus_areas[].topic` must be one of the learner's computed weak topics.

**Endpoints**
- `POST /api/v1/lessons/{id}/ai/generate/` (course manager, rate-limited per user)
  - **Payload**: `{ "resource_type": "MCQ" | "FLASHCARDS" | "SUMMARY", "count": 5 }`. `count` is optional and applies to MCQ (max 20) and FLASHCARDS (max 40).
  - Generation is synchronous, grounded in the lesson's `transcript` / `reading_content`, and returns `201` with a `DRAFT` resource.
- `GET /api/v1/lessons/{id}/resources/` (paginated; optional `?resource_type=`)
  - Managers see every resource. Enrolled students see only `PUBLISHED` ones. Anyone else gets `403`.
- `GET /api/v1/resources/{id}/`
- `PATCH /api/v1/resources/{id}/` (course manager; `DRAFT` only)
  - **Payload**: `{ "content": { ... } }`. The content is re-validated; invalid content returns `400 VALIDATION_ERROR` with `details.content` listing each problem.
- `POST /api/v1/resources/{id}/publish/` (course manager; `DRAFT` only)
  - Re-validates and sets `PUBLISHED`. An MCQ set already converted into a quiz cannot be published (`ALREADY_CONVERTED`), because that would reveal the quiz answers.
- `POST /api/v1/resources/{id}/convert-to-quiz/` (course manager; `MCQ` + `DRAFT` only)
  - In one transaction, creates a regular `Quiz` (status `DRAFT`, same course/lesson) with `Question` / `QuestionOption` rows, ready to edit through the normal quiz tools. Returns `201` with the quiz in the student-safe `QuizDetailSerializer` shape (no correct answers). Fails with `400 NOT_MCQ`, `ALREADY_CONVERTED`, or `ALREADY_PUBLISHED`.
- `GET /api/v1/courses/{id}/ai/revisions/` (enrolled student; paginated): the requester's own revision summaries.
- `POST /api/v1/courses/{id}/ai/revisions/` (enrolled student, rate-limited per user)
  - Builds a personalised revision summary from the student's **submitted** quiz attempts in the course. Accuracy is computed per topic (the quiz's lesson, or the quiz itself) and compared with the quiz pass mark. Missed questions are taken from the latest attempt. Only these aggregates and the weak topics' lesson material are sent to the provider (no names, e-mails, or IDs). Returns `400 NO_ATTEMPTS` if nothing has been submitted yet.

**AI error responses** (standard error format)

| Status | `code` | Meaning |
|---|---|---|
| 400 | `INSUFFICIENT_CONTENT` | Lesson has no transcript/reading material |
| 429 | `RATE_LIMITED` | Per-user generation limit (`AI_GENERATE_RATE_LIMIT`) reached |
| 502 | `AI_INVALID_OUTPUT` | Model output was malformed or failed validation after the allowed retries; nothing saved |
| 502 | `AI_PROVIDER_ERROR` | Provider rejected or blocked the request |
| 503 | `AI_RATE_LIMITED` | Provider is rate limiting; may include `Retry-After` |
| 503 | `AI_QUOTA_EXHAUSTED` | Provider daily quota used up |
| 503 | `AI_NOT_CONFIGURED` | Provider/key/model not configured on the server |
| 504 | `AI_TIMEOUT` | Provider did not answer in time (after retries) |

## 8. Analytics
- `GET /api/v1/analytics/student/`
  - Computes student progress, course and lesson completion rates, and average assessment scores directly from persisted database records.
  - Returns enrolled course breakdowns, overall completion rate, average assessment score, recent activity, and recent quiz attempts (each with `quiz_title`, `course_title`, `percentage`, `passed`, `submitted_at`).
  - **Authorization**: `STUDENT` or `ADMIN`. Instructors are strictly forbidden.
- `GET /api/v1/courses/{id}/analytics/`
  - Computes course-level and student-level statistics for instructors and administrators.
  - Returns total enrollments, completion rates, average course progress, lesson completion breakdown, quiz performance breakdown, and per-student learning progress and quiz metrics.
  - **Authorization**: Course owner (`INSTRUCTOR`) or `ADMIN`. Other instructors and students are strictly forbidden.
- `GET /api/v1/analytics/admin/`
  - Computes platform-wide statistics for administrative monitoring.
  - Returns user counts (students, instructors, admins), course breakdowns (published, draft, archived), enrollment counts and completion rates, lesson completions, and quiz performance metrics.
  - **Authorization**: `ADMIN` only.

## 9. Certificates
- `GET /api/v1/certificates/me/`
  - Returns a list of certificates earned by the authenticated student.
  - **Authorization**: `STUDENT` or authenticated user.
- `GET /api/v1/certificates/verify/{code}/`
  - Public verification endpoint returning limited certificate verification information (`valid`, `verification_code`, `student_name`, `course_title`, `instructor_name`, `issued_at`). Does not leak sensitive personal data.
  - **Authorization**: Public (`AllowAny`).
- `GET /api/v1/courses/{id}/certificate/`
  - Returns (or generates) the certificate details (including `verification_code`) if the student has passed all quizzes (highest score used) and completed all lessons.
  - Returns `400 CRITERIA_NOT_MET` if course completion requirements are incomplete.
  - **Authorization**: Enrolled student or course instructor/admin.
