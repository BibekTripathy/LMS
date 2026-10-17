# LMS Architecture

## 1. System Overview
The Learning Management System (LMS) is built as a monolithic web application comprising a modern Single Page Application (SPA) frontend and a REST API backend. To maintain simplicity suitable for a student team project, the architecture strictly avoids unnecessary services such as Redis, Celery, or microservices. 

The stack consists of:
- **Frontend**: React, TypeScript, Vite, Tailwind CSS.
- **Backend**: Python, Django, Django REST Framework (DRF).
- **Database**: PostgreSQL (managed via Django ORM and migrations).

## 2. Frontend Architecture
- **Framework & Build**: Vite is used for fast bundling and development. React (with Functional Components and Hooks) manages the UI.
- **Styling**: Tailwind CSS is used for responsive, utility-first styling.
- **State & Data Fetching**: A dedicated API service layer handles all backend communication. Application state is managed via React context or standard state management libraries, with careful separation of UI logic and API calls.
- **Routing**: Client-side routing is used to navigate between views (e.g., Course Catalog, Video Player, Quiz Interface, Dashboard).

## 3. Backend Architecture
- **Framework**: Django handles the core server logic, data modeling, and database transactions.
- **API Layer**: Django REST Framework (DRF) is used to expose JSON endpoints.
- **Custom User Model**: A custom user model must be configured and set as `AUTH_USER_MODEL` before running the first `makemigrations`.
- **Authentication**: JWT-based authentication secures all private endpoints. Tokens are verified on each request.
- **Role-Based Access Control (RBAC)**: 
  - Roles: `STUDENT`, `INSTRUCTOR`, `ADMIN`.
  - Permissions are strictly enforced on the server. The frontend hides restricted buttons, but the backend is the ultimate source of truth.
  - Public registration defaults exclusively to the `STUDENT` role. Privilege escalation by user input is explicitly blocked.
- **Enrollment Validation**: A valid `Enrollment` record is strictly required before a user can access protected lesson content, update `VideoProgress`, or request AI resources for a lesson.

## 4. Assessment and Progress Logic
- **Quiz Policies (MVP)**:
  - **Retakes**: Students are allowed unlimited quiz retakes.
  - **History**: Every attempt is kept as a separate historical record in the database.
  - **Completion**: The highest recorded score is used to determine course completion and certificate eligibility.
  - **Deadlines**: No default deadlines are imposed.
- **Server-Side Grading & Validation**: 
  - Quiz scores are calculated exclusively on the backend. Correct answers are never sent to the client until after the submission is processed.
  - The backend must rigorously validate that each submitted selected answer belongs to its target question, and that the question belongs to the quiz being attempted.
- **Certificate Completion Criteria**: Certificates are issued only when a student achieves 100% video progress on all lessons AND a passing score (using the highest attempt) on all quizzes in the course. Each certificate generates a unique verification code.

## 5. AI Feature Integration
AI functionalities (MCQs, flashcards, summaries, personalized revision) are handled entirely on the backend to prevent exposing API keys.
- **Provider Adapter Pattern**: An adapter class abstracts the AI provider's API. This ensures the provider can be swapped without rewriting core application logic.
- **Data Flow**: The frontend requests an AI resource (e.g., "generate flashcards for lesson 5") -> Django backend validates authorization (must be enrolled in the course) -> Backend calls AI Provider via Adapter -> Backend receives, validates, and stores the structured output tied to the requesting student and lesson -> Backend returns data to the frontend.
- **Data Privacy**: Only necessary learning context is sent to the AI provider; sensitive student data is omitted.

## 6. Security and Data Integrity
- **Database Transactions**: Operations that mutate multiple records (e.g., submitting a quiz attempt and updating course progress) are wrapped in database transactions.
- **Constraints**: PostgreSQL unique constraints and foreign key constraints enforce relational integrity (e.g., preventing duplicate enrollments or duplicate progress entries per student/lesson).
