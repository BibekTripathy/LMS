# Project Instructions: AI-Powered Learning Management System

## Project Objective

Build a complete, maintainable Learning Management System (LMS) for students, instructors and administrators. Students can enroll in courses, watch lessons, track progress, take quizzes, review results, use AI-generated study resources and earn certificates. Instructors can create and manage courses, lessons, quizzes and learning resources, and view student performance.

## Technology Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query and Recharts.
    
- Backend: Python, Django and Django REST Framework.
    
- Database: PostgreSQL using Django ORM and migrations.
    
- Authentication: JWT-based authentication with access and refresh tokens.
    
- AI: A hosted free-tier LLM API accessed exclusively through a Django service.
    
- Testing: Django tests or pytest, Vitest and React Testing Library.
    
- Version control: Git.
    
- Redis is explicitly excluded from the project.
    
- Do not introduce microservices, Celery, Kubernetes or complex infrastructure into the MVP without approval.
    

## Team Ownership

- Saanvi: Student-facing frontend, course catalogue, enrollment UI, student dashboard, learning workspace, video player and progress display.
    
- Swati: Instructor dashboard, course editor UI, module and lesson authoring, quiz builder, quiz-taking/results UI, AI study centre, analytics charts and certificate UI. Coordinate shared authentication components with Saanvi.
    
- Sagnik: Backend foundation, custom user model, authentication, role-based permissions, course/module/lesson APIs, enrollment and course publication.
    
- Meheli: Backend lesson progress, quiz models, attempts, answer validation, grading, leaderboard queries, analytics and certificates.
    
- Bibek: AI service and provider integration, prompt templates, output validation, study-resource persistence, personalized revision summaries, shared backend configuration, integration coordination and release documentation.
    

Feature owners must implement and test their modules. Shared model changes must be coordinated before migrations are committed.

## User Roles

STUDENT:

- Register, authenticate and manage profile.
    
- Browse published courses and enroll.
    
- Access enrolled lessons.
    
- Save and resume lesson progress.
    
- Take quizzes and view submitted results.
    
- Access authorized study resources and personal analytics.
    
- View and verify earned certificates.
    

INSTRUCTOR:

- Create and manage owned courses.
    
- Organize modules and lessons.
    
- Attach video URLs, transcripts and reading material.
    
- Create and publish quizzes.
    
- Generate, edit and publish AI resources.
    
- View analytics for owned courses and enrolled students.
    

ADMIN:

- Manage user roles and accounts.
    
- Moderate courses.
    
- View platform statistics.
    
- Use authorized administrative functionality.
    

Public registration must always create STUDENT accounts. Never allow a user to assign themselves ADMIN privileges.

## Required Backend Apps

- accounts
    
- courses
    
- enrollments
    
- progress
    
- assessments
    
- analytics
    
- ai_study
    
- certificates
    

Use a custom Django user model configured before the first migration. Keep the database schema and API contracts consistent across apps.

## Core Data Entities

User, Course, Module, Lesson, Enrollment, LessonProgress, Quiz, Question, QuestionOption, QuizAttempt, Answer, StudyResource and Certificate.

Use foreign keys, unique constraints and appropriate indexes. Enforce unique enrollment per student/course, unique progress per enrollment/lesson, unique answer per attempt/question and unique certificate codes.

PostgreSQL is the source of truth. Store grades, quiz attempts, learning progress, AI resources and certificates persistently.

## API Conventions

All APIs use the /api/v1/ prefix and JSON requests/responses.

Implement authentication, course CRUD, module/lesson CRUD, enrollment, lesson progress, quiz start/save/submit/history, AI resource generation/retrieval, analytics and certificate verification.

Use serializers for request validation and consistent response schemas. Enforce authentication, role permissions, course ownership, enrollment access and object-level authorization on the backend.

The frontend must never calculate authoritative grades, decide access permissions or issue certificates.

## Video Progress

Store last_position_seconds, completed and updated_at in PostgreSQL. Save progress approximately every 10–15 seconds during playback and on pause/page exit where possible. Restore the latest saved position. Validate lesson access and playback positions on the backend.

## Assessment Rules

Quiz scores are calculated server-side. Do not expose correct answers before submission. Persist attempt start time, deadline, submission time, status, score and answers. Validate deadlines, attempt ownership and question/quiz relationships. Reject duplicate or expired submissions safely. Use database transactions for final grading.

## AI Requirements

Implement an AI provider adapter so the provider can be changed without rewriting application features. Store API keys only in environment variables. Never call the LLM directly from the frontend.

Support:

1. MCQ generation from lesson transcripts and reading material.
    
2. Flashcard generation.
    
3. Concise lesson summaries.
    
4. Personalized revision summaries based on actual quiz attempts and weak-topic performance.
    

Validate structured model output before storing it. Generated quizzes must be editable and reviewable before publication. Handle timeouts, rate limits, invalid JSON, quota exhaustion and provider errors. Limit input size and output size. Mock provider responses in automated tests.

AI-generated content must be grounded in supplied course material. Never send passwords, tokens or unnecessary personal information to the provider.

## Analytics and Certificates

Compute student progress, completion rates, assessment scores and instructor metrics from persisted records. Use PostgreSQL queries for leaderboard rankings.

Issue certificates only after the configured course completion criteria are satisfied. Give every certificate a unique verification code. The public verification endpoint must return only limited certificate information.

## Frontend Rules

Organize React code by feature. Use reusable UI components, typed API clients and consistent TypeScript interfaces. Use TanStack Query for API state and mutations. Display loading, empty, success and error states. Never hardcode dashboard metrics or quiz results.

Keep student and instructor interfaces separate while reusing shared layouts and components. Protect frontend routes for usability, but always rely on backend authorization for security.

## Security and Quality

- Keep secrets out of Git.
    
- Use environment variables and provide .env.example.
    
- Validate all user inputs.
    
- Prevent unauthorized course edits and private-data access.
    
- Use transactions for critical state changes.
    
- Add tests for authentication, permissions, enrollment, progress, grading, AI validation and certificates.
    
- Document setup, migrations, environment variables, demo accounts and test commands.
    
- Avoid unrelated features and unnecessary dependencies.
    

## Coding Harness Operating Rules

1. Inspect the existing repository before modifying files.
    
2. Follow the agreed architecture and shared API contracts.
    
3. Implement one coherent feature at a time.
    
4. Do not invent conflicting model fields or duplicate endpoints.
    
5. Do not overwrite unrelated teammate changes.
    
6. Include migrations and tests with relevant backend changes.
    
7. Run the relevant tests and report failures honestly.
    
8. Do not claim that an API, feature or integration works until it has been implemented and verified.
    
9. Update documentation when interfaces, configuration or setup commands change.
    
10. If a cross-module contract is missing, document the proposed change and identify affected modules before implementing it.
    

## Final Goal

Deliver an integrated LMS in which authentication, courses, enrollment, video progress, assessments, AI-generated study resources, analytics and certificates work together end to end. Prioritize correctness, security, maintainability and a reliable demonstration over unnecessary complexity.