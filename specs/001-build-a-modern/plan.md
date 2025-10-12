# Implementation Plan: Mind Hub Learning Management System

**Branch**: `001-build-a-modern` | **Date**: 2025-10-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-build-a-modern/spec.md`

## Summary

Mind Hub LMS is a comprehensive web-based learning platform delivering course management, content delivery, assessments, and collaborative learning features. The MVP focuses on three P1 user stories (Authentication, Course Creation, Enrollment) with a clear path to P2 (Progress Tracking, Assessments) and P3 (Forums, Assignments, Certificates, Notifications, Search, Profiles) enhancements. The technical approach uses a modern Python/FastAPI backend with React/TypeScript frontend, PostgreSQL for structured educational data, and local file storage with scalability paths to cloud services.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.x with React 18+ (frontend)
**Primary Dependencies**: FastAPI 0.104+, SQLAlchemy 2.0+, PostgreSQL 15+, React 18+, Vite 5.x
**Storage**: PostgreSQL (relational data), Local filesystem (video/documents with path to object storage)
**Testing**: pytest (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Web application (responsive design for desktop, tablet, mobile browsers)
**Project Type**: Web application (frontend + backend separation)
**Performance Goals**: <2s page load (p95), <500ms API response, 1000+ concurrent users, video streaming <3s start
**Constraints**: WCAG 2.1 Level AA accessibility, HTTPS only, bcrypt password hashing, 30min session timeout, 2GB max file upload
**Scale/Scope**: 100-100,000 users, 10,000+ students per course, 20+ active courses at launch

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Gates Evaluation

**GATE 1: User-Centric Design** ✅ PASS
- ✅ User stories prioritized (P1/P2/P3) with 11 independent stories
- ✅ Acceptance criteria testable and user-focused (55 Given/When/Then scenarios)
- ✅ Accessibility mentioned in requirements (NFR-014 through NFR-017: WCAG 2.1 Level AA, keyboard navigation, captions, color contrast)

**GATE 2: Data Integrity** ✅ PASS
- ✅ Data models documented with 13 key entities and relationships
- ✅ Validation rules defined for user inputs (email validation FR-001, password complexity FR-002, file type validation FR-011)
- ✅ Audit logging included for critical changes (Constitution Principle II requires audit logging for grades, enrollments, completions)

**GATE 3: Scalable Architecture** ✅ PASS
- ✅ Performance targets specified (NFR-001 through NFR-004: page load, video streaming, quiz processing, search)
- ✅ Pagination planned for list endpoints (NFR-008: database indexing requirement implies pagination)
- ✅ Background jobs identified (video processing FR-011, email notifications FR-046/047/048, certificate generation FR-042)

**GATE 4: Security by Design** ✅ PASS
- ✅ Authentication/authorization in functional requirements (FR-001 through FR-007 entire auth section)
- ✅ Roles and permissions defined (3 roles: Student, Instructor, Administrator with RBAC FR-004)
- ✅ Input validation included (NFR-011: XSS and SQL injection prevention, NFR-012: rate limiting)

**GATE 5: Feature Isolation** ✅ PASS
- ✅ Module boundary clear (5 core modules: auth, course management, enrollment, assessment, content delivery)
- ✅ Dependencies explicit (11 user stories designed for independent implementation)
- ✅ Features independently testable (each story has "Independent Test" criteria)

**GATE 6: Test Coverage** ✅ PASS
- ✅ Integration tests required for P1/P2 stories (Constitution VI mandates tests for critical paths)
- ✅ Critical paths covered (auth FR-001/002, enrollment FR-016/019, grading FR-027/031)
- ✅ Test data creation implicit (pytest fixtures for backend, testing-library utilities for frontend)

**GATE 7: Observability** ✅ PASS
- ✅ Logs mentioned for user actions (Constitution VII requires structured logs with correlation IDs)
- ✅ Metrics identified (SC-012 through SC-015: page load times, concurrent users, video streaming, uptime)
- ✅ Error scenarios covered (10 edge cases documented, NFR-018 through NFR-020: uptime, backups, disaster recovery)

**Constitution Compliance Status**: ✅ ALL GATES PASSED

No violations detected. All seven constitutional principles are addressed in the specification.

## Project Structure

### Documentation (this feature)

```
specs/001-build-a-modern/
├── spec.md              # Business requirements (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (entity schemas)
├── quickstart.md        # Phase 1 output (integration scenarios)
├── contracts/           # Phase 1 output (API specifications)
│   ├── auth.openapi.yaml
│   ├── courses.openapi.yaml
│   ├── enrollments.openapi.yaml
│   ├── content.openapi.yaml
│   ├── assessments.openapi.yaml
│   ├── forums.openapi.yaml
│   ├── assignments.openapi.yaml
│   ├── certificates.openapi.yaml
│   ├── notifications.openapi.yaml
│   ├── search.openapi.yaml
│   └── admin.openapi.yaml
├── checklists/          # Validation checklists
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
mind-hub/
├── backend/
│   ├── src/
│   │   ├── api/                    # FastAPI route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Authentication endpoints
│   │   │   ├── users.py            # User management
│   │   │   ├── courses.py          # Course CRUD
│   │   │   ├── enrollments.py      # Enrollment operations
│   │   │   ├── content.py          # Content upload/retrieval
│   │   │   ├── assessments.py      # Quiz operations
│   │   │   ├── forums.py           # Discussion forums (P3)
│   │   │   ├── assignments.py      # Assignment submission (P3)
│   │   │   ├── certificates.py     # Certificate generation (P3)
│   │   │   ├── notifications.py    # Notification preferences (P3)
│   │   │   ├── search.py           # Search endpoints (P3)
│   │   │   └── admin.py            # Admin operations
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py             # User entity
│   │   │   ├── course.py           # Course entity
│   │   │   ├── enrollment.py       # Enrollment relationship
│   │   │   ├── content.py          # Content items
│   │   │   ├── quiz.py             # Quiz and questions
│   │   │   ├── attempt.py          # Quiz attempts
│   │   │   ├── assignment.py       # Assignments
│   │   │   ├── submission.py       # Submissions
│   │   │   ├── forum.py            # Forum topics and posts
│   │   │   ├── certificate.py      # Certificates
│   │   │   └── notification.py     # Notifications
│   │   ├── schemas/                # Pydantic validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Auth request/response schemas
│   │   │   ├── course.py           # Course schemas
│   │   │   ├── enrollment.py       # Enrollment schemas
│   │   │   ├── content.py          # Content schemas
│   │   │   ├── assessment.py       # Assessment schemas
│   │   │   ├── forum.py            # Forum schemas
│   │   │   ├── assignment.py       # Assignment schemas
│   │   │   ├── certificate.py      # Certificate schemas
│   │   │   └── notification.py     # Notification schemas
│   │   ├── services/               # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py     # Authentication logic
│   │   │   ├── user_service.py     # User management
│   │   │   ├── course_service.py   # Course operations
│   │   │   ├── enrollment_service.py
│   │   │   ├── content_service.py  # File handling
│   │   │   ├── quiz_service.py     # Quiz grading
│   │   │   ├── progress_service.py # Progress calculation
│   │   │   ├── forum_service.py
│   │   │   ├── assignment_service.py
│   │   │   ├── certificate_service.py
│   │   │   ├── notification_service.py
│   │   │   └── search_service.py
│   │   ├── core/                   # Shared utilities
│   │   │   ├── __init__.py
│   │   │   ├── config.py           # Environment configuration
│   │   │   ├── database.py         # DB connection pool
│   │   │   ├── security.py         # JWT, hashing, RBAC
│   │   │   ├── dependencies.py     # FastAPI dependencies
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   └── logging.py          # Structured logging
│   │   ├── tasks/                  # Celery background tasks
│   │   │   ├── __init__.py
│   │   │   ├── video.py            # Video processing
│   │   │   ├── email.py            # Email sending
│   │   │   └── certificates.py     # Certificate PDF generation
│   │   ├── migrations/             # Alembic database migrations
│   │   │   └── versions/
│   │   └── main.py                 # FastAPI application entry
│   ├── tests/
│   │   ├── contract/               # API contract tests
│   │   │   ├── test_auth_api.py
│   │   │   ├── test_courses_api.py
│   │   │   ├── test_enrollments_api.py
│   │   │   ├── test_content_api.py
│   │   │   └── test_assessments_api.py
│   │   ├── integration/            # Service integration tests
│   │   │   ├── test_user_flows.py
│   │   │   ├── test_course_creation.py
│   │   │   ├── test_enrollment_flow.py
│   │   │   └── test_quiz_flow.py
│   │   └── unit/                   # Unit tests
│   │       ├── test_auth_service.py
│   │       ├── test_course_service.py
│   │       └── test_quiz_service.py
│   ├── alembic.ini                 # Alembic configuration
│   ├── pyproject.toml              # Poetry/pip dependencies
│   ├── pytest.ini                  # Pytest configuration
│   ├── .env.example                # Environment variables template
│   └── README.md                   # Backend documentation
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # API client layer
│   │   │   ├── client.ts           # Axios instance
│   │   │   ├── auth.ts             # Auth API calls
│   │   │   ├── courses.ts          # Course API calls
│   │   │   ├── enrollments.ts      # Enrollment API calls
│   │   │   ├── content.ts          # Content API calls
│   │   │   ├── assessments.ts      # Quiz API calls
│   │   │   ├── forums.ts
│   │   │   ├── assignments.ts
│   │   │   ├── certificates.ts
│   │   │   └── search.ts
│   │   ├── components/             # Reusable React components
│   │   │   ├── common/             # Shared UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Spinner.tsx
│   │   │   ├── auth/               # Auth components
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── PasswordReset.tsx
│   │   │   ├── courses/            # Course components
│   │   │   │   ├── CourseCard.tsx
│   │   │   │   ├── CourseList.tsx
│   │   │   │   ├── CourseForm.tsx
│   │   │   │   └── ContentUpload.tsx
│   │   │   ├── content/            # Content display
│   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   ├── PDFViewer.tsx
│   │   │   │   └── ContentList.tsx
│   │   │   ├── assessments/        # Quiz components
│   │   │   │   ├── QuizForm.tsx
│   │   │   │   ├── QuestionEditor.tsx
│   │   │   │   ├── QuizTaker.tsx
│   │   │   │   └── QuizResults.tsx
│   │   │   ├── enrollment/         # Enrollment UI
│   │   │   │   ├── EnrollButton.tsx
│   │   │   │   ├── StudentRoster.tsx
│   │   │   │   └── ProgressBar.tsx
│   │   │   ├── forums/             # Forum components (P3)
│   │   │   ├── assignments/        # Assignment components (P3)
│   │   │   └── dashboard/          # Dashboard widgets
│   │   ├── pages/                  # Route-level pages
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── CourseCatalog.tsx
│   │   │   ├── CourseDetail.tsx
│   │   │   ├── CourseContent.tsx
│   │   │   ├── CreateCourse.tsx
│   │   │   ├── InstructorDashboard.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── TakeQuiz.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── NotFound.tsx
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useCourses.ts
│   │   │   ├── useEnrollments.ts
│   │   │   └── useToast.ts
│   │   ├── store/                  # State management (Zustand)
│   │   │   ├── authStore.ts
│   │   │   ├── courseStore.ts
│   │   │   └── uiStore.ts
│   │   ├── utils/                  # Utility functions
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   └── constants.ts
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── auth.ts
│   │   │   ├── course.ts
│   │   │   ├── enrollment.ts
│   │   │   ├── content.ts
│   │   │   └── assessment.ts
│   │   ├── App.tsx                 # Root component
│   │   ├── main.tsx                # Vite entry point
│   │   └── router.tsx              # React Router configuration
│   ├── tests/
│   │   ├── components/             # Component tests
│   │   ├── pages/                  # Page tests
│   │   └── integration/            # E2E tests
│   ├── public/                     # Static assets
│   ├── index.html                  # HTML entry
│   ├── vite.config.ts              # Vite configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── package.json                # npm dependencies
│   └── README.md                   # Frontend documentation
│
├── storage/                        # Local file storage (dev/MVP)
│   ├── videos/
│   ├── documents/
│   └── avatars/
│
├── docker/                         # Docker configuration
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml              # Local development stack
├── .gitignore
└── README.md                       # Project root documentation
```

**Structure Decision**: Web application architecture selected (Option 2) with separate `backend/` and `frontend/` directories. This structure supports:
- Independent deployment of frontend (static CDN) and backend (app servers)
- Technology isolation (Python/FastAPI vs TypeScript/React)
- Team specialization (backend vs frontend developers)
- Horizontal scaling (multiple backend instances behind load balancer)

## Complexity Tracking

*No constitution violations detected. This section intentionally left empty.*

## Technology Stack Rationale

### Backend Stack

**FastAPI** (Python 3.11+)
- **Chosen**: Modern async Python framework with automatic OpenAPI generation
- **Rationale**: Built-in data validation via Pydantic, excellent performance for I/O-bound operations (database queries, file uploads), automatic API documentation, strong typing support
- **Alternatives Considered**: Django REST Framework (heavier, less async support), Flask (requires more boilerplate)

**PostgreSQL** 15+
- **Chosen**: Relational database with strong ACID guarantees
- **Rationale**: Educational data requires referential integrity, complex queries for enrollment/progress tracking, mature ecosystem, excellent JSON support for flexible fields
- **Alternatives Considered**: MySQL (weaker JSON support), MongoDB (lacks ACID for critical operations)

**SQLAlchemy** 2.0+
- **Chosen**: Python ORM with advanced querying capabilities
- **Rationale**: Type-safe database operations, migration support via Alembic, relationship management, connection pooling
- **Alternatives Considered**: Raw SQL (maintenance burden), Django ORM (tied to Django framework)

**Celery + Redis**
- **Chosen**: Distributed task queue for background jobs
- **Rationale**: Video processing is CPU/time intensive, email delivery should not block API responses, certificate generation for large cohorts
- **Alternatives Considered**: RQ (simpler but less feature-rich), AWS Lambda (vendor lock-in)

**python-jose + passlib**
- **Chosen**: JWT tokens for stateless authentication, bcrypt for password hashing
- **Rationale**: Meets NFR-009 (bcrypt requirement), enables horizontal scaling without shared session storage, secure password reset flows
- **Alternatives Considered**: OAuth2 providers only (requires internet for auth), session-based (limits scalability)

### Frontend Stack

**React** 18+ with **TypeScript** 5.x
- **Chosen**: Component-based UI library with strong typing
- **Rationale**: Large ecosystem, excellent developer experience, TypeScript prevents runtime errors, strong accessibility tooling
- **Alternatives Considered**: Vue.js (smaller ecosystem), Angular (steeper learning curve, heavier)

**Vite** 5.x
- **Chosen**: Modern build tool with fast HMR
- **Rationale**: Significantly faster development experience than Webpack, native ES modules support, optimized production builds
- **Alternatives Considered**: Create React App (slower, less configurable), Next.js (SSR not required for LMS)

**Tailwind CSS**
- **Chosen**: Utility-first CSS framework
- **Rationale**: Rapid UI development, consistent design system, small production bundle (unused classes purged), responsive design built-in
- **Alternatives Considered**: Bootstrap (less customizable), CSS Modules (more boilerplate)

**shadcn/ui**
- **Chosen**: Headless accessible component library
- **Rationale**: Meets NFR-014 (WCAG 2.1 AA requirement), customizable, no runtime dependencies (components copied into project)
- **Alternatives Considered**: Material UI (heavier bundle), Headless UI alone (requires more custom styling)

**Zustand**
- **Chosen**: Lightweight state management
- **Rationale**: Simpler than Redux, TypeScript-first, minimal boilerplate, sufficient for LMS complexity
- **Alternatives Considered**: Redux Toolkit (more complex for this scope), Context API only (performance concerns for frequent updates)

**TanStack Query** (React Query)
- **Chosen**: Server state management and caching
- **Rationale**: Automatic background refetching, optimistic updates, reduces boilerplate for API calls, built-in loading/error states
- **Alternatives Considered**: SWR (less feature-rich), custom fetch hooks (reinventing the wheel)

**video.js**
- **Chosen**: HTML5 video player
- **Rationale**: Cross-browser compatibility, plugin ecosystem, subtitle support (NFR-015 requirement), adaptive bitrate streaming support
- **Alternatives Considered**: Plyr (less extensible), native HTML5 video (inconsistent browser support)

**react-pdf**
- **Chosen**: PDF rendering in React
- **Rationale**: Client-side PDF display without server processing, zoom/navigation controls, text selection for accessibility
- **Alternatives Considered**: PDF.js directly (more complex integration), server-side PDF-to-image conversion (slower, less accessible)

### Infrastructure & DevOps

**Docker** + **docker-compose**
- **Chosen**: Containerization for consistent development environments
- **Rationale**: Eliminates "works on my machine" issues, identical dev/prod environments, easy CI/CD integration
- **Alternatives Considered**: VMs (heavier resources), bare metal (inconsistent environments)

**Nginx**
- **Chosen**: Reverse proxy and static file server
- **Rationale**: High-performance static file serving for frontend, reverse proxy to FastAPI backend, SSL termination, request buffering for uploads
- **Alternatives Considered**: Traefik (more complex for simple use case), Apache (heavier)

**Local Storage** (filesystem)
- **Chosen**: MVP/development file storage
- **Rationale**: Zero cost for initial development, simple implementation, clear migration path to S3/Azure Blob/GCS
- **Alternatives Considered**: Cloud storage immediately (premature for MVP, adds complexity)

### Testing Stack

**pytest** (backend)
- **Chosen**: Python testing framework
- **Rationale**: Excellent fixture system, parametrized tests, integration with FastAPI's TestClient, coverage reporting
- **Alternatives Considered**: unittest (less expressive), nose (deprecated)

**Vitest** + **React Testing Library** (frontend)
- **Chosen**: Fast unit testing and component testing
- **Rationale**: Vite-native test runner (fast), React Testing Library encourages accessibility-focused tests, user-centric assertions
- **Alternatives Considered**: Jest (slower with Vite), Cypress (heavier for unit tests)

## Phase 0: Research (Completed Inline)

All technical decisions have been researched and documented above in Technology Stack Rationale. No outstanding NEEDS CLARIFICATION items exist in Technical Context. research.md will be generated to consolidate these decisions.

## Phase 1: Design Artifacts (To Be Generated)

The following artifacts will be created during Phase 1 execution:

1. **data-model.md**: Complete entity-relationship diagram with:
   - All 13 entities from spec.md (User, Course, Enrollment, Content Item, Quiz, Question, Quiz Attempt, Assignment, Submission, Discussion Topic, Post, Certificate, Notification)
   - Field definitions (types, constraints, defaults)
   - Relationships (one-to-many, many-to-many)
   - Indexes for query optimization
   - Audit fields (created_at, updated_at, deleted_at for soft deletes)

2. **contracts/**: OpenAPI 3.1 specifications for 11 API modules:
   - auth.openapi.yaml: Registration, login, password reset, session management
   - courses.openapi.yaml: CRUD operations, visibility controls
   - enrollments.openapi.yaml: Enroll, unenroll, roster management
   - content.openapi.yaml: Upload, retrieve, organize content items
   - assessments.openapi.yaml: Quiz CRUD, question management, attempt submission, grading
   - forums.openapi.yaml: Topic/post CRUD, moderation (P3)
   - assignments.openapi.yaml: Assignment CRUD, submission, grading (P3)
   - certificates.openapi.yaml: Generation, download, verification (P3)
   - notifications.openapi.yaml: Preference management, delivery status (P3)
   - search.openapi.yaml: Course search, content search, filtering (P3)
   - admin.openapi.yaml: User management, platform configuration, audit logs

3. **quickstart.md**: Integration test scenarios:
   - Student journey: Register → Browse catalog → Enroll → Access content → Take quiz → View results
   - Instructor journey: Register → Create course → Upload content → Create quiz → View student results
   - Admin journey: View platform metrics → Manage users → Configure settings

## Next Steps

After completing this planning phase, proceed to:

1. **`/speckit.tasks`** - Generate dependency-ordered task breakdown organized by user story
2. **`/speckit.implement`** - Execute tasks following the plan and constitution requirements

The implementation will follow the SpecKit workflow with checklist validation before beginning development.
