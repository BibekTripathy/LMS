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
*Note: All AI endpoints require the user to be enrolled in the lesson's course.*
- `POST /api/v1/ai/generate-flashcards/`
  - **Payload**: `{ "lesson_id": "..." }`
  - Generates, stores (tied to student and lesson), and returns flashcards.
- `POST /api/v1/ai/generate-summary/`
  - **Payload**: `{ "lesson_id": "..." }`
  - Generates, stores, and returns a lesson summary.
- `POST /api/v1/ai/generate-mcq/`
  - **Payload**: `{ "lesson_id": "..." }`
  - Generates, stores, and returns revision MCQs for the student.

## 8. Certificates
- `GET /api/v1/courses/{id}/certificate/`
  - Returns the certificate details (including `verification_code`) if the student has passed all quizzes (highest score used) and completed all lessons.
