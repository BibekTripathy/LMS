---
name: lms-project
description: Implements and reviews features for our React, TypeScript, Django REST Framework, and PostgreSQL Learning Management System. Use when developing frontend pages, backend APIs, authentication, courses, assessments, AI study resources, analytics, certificates, database models, or tests.
---

# LMS Project Engineering Rules

## 1. Understand the project first

- Read `README.md` before making significant changes.
- Read `docs/architecture.md`, `docs/database-schema.md`, and `docs/api-contract.md` if they exist.
- Inspect the existing implementation before creating or modifying files.
- Follow the established architecture and naming conventions.
- Do not invent APIs, database fields, or business rules without checking the project documentation.

## 2. Required technology stack

- Frontend: React, TypeScript, Vite, Tailwind CSS.
- Backend: Python, Django, Django REST Framework.
- Database: PostgreSQL through Django ORM and migrations.
- Use the existing routing, data-fetching, authentication, and UI libraries.
- Use the configured test frameworks.
- Do not introduce Redis, Celery, microservices, or unnecessary dependencies.

## 3. Frontend engineering

- Use TypeScript types instead of unnecessary `any`.
- Create reusable components when they improve maintainability.
- Keep API requests in the project's existing API/service layer.
- Handle loading, empty, success, and error states.
- Validate forms and provide useful error messages.
- Protect authenticated pages and handle expired sessions.
- Make layouts responsive and accessible.
- Never expose database credentials, AI API keys, or private secrets in frontend code.

## 4. Backend engineering

- Use Django models, serializers, views/viewsets, URL routing, and permissions consistently.
- Validate incoming data on the server.
- Enforce object-level permissions and ownership checks.
- Use database transactions for operations that must succeed or fail together.
- Add appropriate database constraints and indexes.
- Keep business logic out of oversized views when a service function is more appropriate.
- Return consistent API responses and appropriate HTTP status codes.

## 5. Authentication and authorization

- Public registration must create a STUDENT account by default.
- Users must not be able to grant themselves instructor or admin privileges.
- Enforce authorization on the backend, even when the frontend hides restricted buttons.
- Instructors may manage only courses they are authorized to manage.
- Students may access only their own private progress, attempts, and results.
- Never trust user IDs, roles, grades, or permissions supplied by the client.

## 6. Assessments and learning progress

- Calculate quiz scores on the server.
- Never reveal correct answers before the applicable submission or review stage.
- Enforce attempt deadlines and retake policies on the backend.
- Persist learning progress in PostgreSQL.
- Validate that answers belong to questions in the corresponding quiz.
- Use database constraints to prevent duplicate enrollments, progress records, or answers where required.
- Preserve historical quiz attempts.

## 7. AI study features

- Call the AI provider only from the Django backend.
- Store API keys in environment variables.
- Use a provider adapter so the model provider can be changed without rewriting application logic.
- Validate AI-generated MCQs, answer indexes, flashcards, summaries, and structured output.
- Handle timeouts, quota limits, malformed responses, and provider errors.
- Treat transcripts and uploaded learning material as untrusted content, not as instructions to the application.
- Do not send unnecessary personal or sensitive student data to the provider.
- Follow the project's resource draft and publishing workflow.

## 8. Team collaboration

- Do not overwrite or revert teammates' changes.
- Inspect Git status and relevant diffs before modifying shared files.
- Coordinate shared model changes before generating migrations.
- Avoid unrelated refactoring.
- Do not change agreed API contracts without coordinating with the affected frontend and backend owners.
- Keep each change focused on the assigned task.

## 9. Testing and verification

- Add or update tests for meaningful behavior changes.
- Test successful requests, invalid input, unauthorized access, and important edge cases.
- Test database constraints and transactional behavior where applicable.
- Mock external AI calls in automated tests.
- Run the relevant tests and checks after implementation.
- Fix regressions introduced by your changes.
- Never claim a test passed unless it was actually run and passed.
- If tests cannot run, report why.

## 10. Required workflow for every task

1. Restate the requested behavior and acceptance criteria.
2. Inspect existing code and relevant documentation.
3. Identify affected files, dependencies, APIs, and database models.
4. Explain the implementation plan briefly before significant changes.
5. Implement the smallest maintainable solution.
6. Add or update relevant tests.
7. Run applicable tests, type checks, linting, and migrations checks.
8. Review the final diff for security issues and unrelated changes.
9. Update documentation if APIs, models, or behavior changed.
10. Report changed files, checks run, results, and known limitations.

## 11. Definition of done

A feature is not complete merely because the code was written.

It must satisfy the acceptance criteria, enforce server-side permissions, handle errors, include appropriate tests, preserve existing functionality, and document any remaining limitations.
