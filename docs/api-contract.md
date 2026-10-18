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
  - Returns quiz details and questions. **Does not return correct answers.**
  - **Authorization**: Requires valid `Enrollment`.
- `POST /api/v1/quizzes/{id}/start/`
  - Initiates a new `QuizAttempt` and sets status to `IN_PROGRESS`. Returns attempt ID.
- `POST /api/v1/quizzes/{id}/submit/`
  - **Payload**: `{ "attempt_id": "...", "answers": [ {"question_id": "...", "choice_id": "..."} ] }`
  - Grades the submission on the server, updates attempt to `SUBMITTED`, and returns the final score. Validates answer ownership.
- `GET /api/v1/quizzes/{id}/attempts/`
  - Returns historical attempts for the authenticated student.

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
