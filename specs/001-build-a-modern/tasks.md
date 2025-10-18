# Tasks: Mind Hub Learning Management System

**Input**: Design documents from `/specs/001-build-a-modern/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: Per Constitution Principle VI, tests are MANDATORY for critical paths (authentication, enrollment, grade calculation, content access). All test tasks are included below.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- Tasks reference both frontend and backend directories

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend directory structure: backend/src/{api,models,schemas,services,core,tasks}, backend/tests/{contract,integration,unit}
- [X] T002 Create frontend directory structure: frontend/src/{api,components,pages,hooks,store,types}, frontend/tests/{component,integration}
- [X] T003 [P] Initialize Python project with pyproject.toml and requirements.txt (FastAPI, SQLAlchemy, Alembic, Celery, pytest)
- [X] T004 [P] Initialize Node.js project with package.json (React, TypeScript, Vite, Tailwind CSS, Vitest)
- [X] T005 [P] Configure Docker Compose with services: postgres, redis, backend, frontend, nginx
- [X] T006 [P] Configure Python linting and formatting (ruff, black, mypy) in pyproject.toml
- [X] T007 [P] Configure TypeScript and ESLint in frontend/tsconfig.json and frontend/.eslintrc.js
- [X] T008 [P] Setup Tailwind CSS configuration in frontend/tailwind.config.js
- [X] T009 [P] Create .env.example files for backend and frontend with required environment variables
- [X] T010 [P] Create storage/ directory structure: storage/{videos,documents,avatars,certificates}

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [X] T011 Create database configuration in backend/src/core/database.py (SQLAlchemy async engine, session factory)
- [X] T012 [P] Create security utilities in backend/src/core/security.py (JWT encode/decode, password hashing with bcrypt)
- [X] T013 [P] Create configuration management in backend/src/core/config.py (Pydantic settings, environment variables)
- [X] T014 [P] Setup Alembic for migrations in backend/alembic/ (alembic init, configure env.py with async support)
- [X] T015 Create base SQLAlchemy model class in backend/src/models/base.py (UUID primary key, created_at, updated_at, deleted_at)
- [X] T016 [P] Create FastAPI application factory in backend/src/main.py (CORS middleware, exception handlers, health check)
- [X] T017 [P] Create API router registration in backend/src/api/__init__.py (centralized endpoint registration)
- [X] T018 [P] Setup Celery configuration in backend/src/core/celery_app.py (Redis broker, task routing)
- [X] T019 [P] Create error handling utilities in backend/src/core/exceptions.py (custom exception classes, error responses)
- [X] T020 [P] Create logging configuration in backend/src/core/logging.py (structured JSON logging with correlation IDs)
- [X] T021 [P] Create pagination utilities in backend/src/core/pagination.py (page/per_page helpers, response models)
- [X] T022 [P] Create file storage service interface in backend/src/services/storage.py (local filesystem, abstraction for cloud migration)

### Frontend Foundation

- [X] T023 Create API client base in frontend/src/api/client.ts (axios instance, auth interceptor, error handling)
- [X] T024 [P] Setup Zustand store in frontend/src/store/auth.ts (auth state, login/logout actions)
- [X] T025 [P] Create TanStack Query configuration in frontend/src/api/query-client.ts (default stale time, cache config)
- [X] T026 [P] Create TypeScript types for API responses in frontend/src/types/api.ts (User, Course, Enrollment base types)
- [X] T027 [P] Create route configuration in frontend/src/App.tsx (React Router, protected route wrapper)
- [X] T028 [P] Create shadcn/ui components: Button, Input, Card in frontend/src/components/ui/
- [X] T029 [P] Create authentication context in frontend/src/hooks/useAuth.ts (auth check, role verification)
- [X] T030 [P] Create error boundary component in frontend/src/components/ErrorBoundary.tsx

### Testing Foundation

- [X] T031 [P] Create pytest configuration in backend/pytest.ini (async support, test database setup)
- [X] T032 [P] Create test fixtures in backend/tests/conftest.py (database session, test client, sample users)
- [X] T033 [P] Create Vitest configuration in frontend/vitest.config.ts (React Testing Library setup, mocks)
- [X] T034 [P] Create test utilities in frontend/tests/utils.tsx (render with providers, mock API responses)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication & Role Management (Priority: P1) 🎯 MVP

**Goal**: Enable users to register, log in, and access role-specific features (Student/Instructor/Admin)

**Independent Test**: Register 3 users with different roles, log in with each, verify JWT tokens, verify role-based dashboard access without requiring course data

### Tests for User Story 1 (MANDATORY per Constitution VI) ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T035 [P] [US1] Contract test for POST /api/v1/auth/register in backend/tests/contract/test_auth_register.py
- [X] T036 [P] [US1] Contract test for POST /api/v1/auth/login in backend/tests/contract/test_auth_login.py
- [X] T037 [P] [US1] Contract test for POST /api/v1/auth/refresh in backend/tests/contract/test_auth_refresh.py
- [X] T038 [P] [US1] Integration test for user registration journey in backend/tests/integration/test_user_registration_journey.py
- [X] T039 [P] [US1] Integration test for login and JWT verification in backend/tests/integration/test_login_jwt_flow.py
- [X] T040 [P] [US1] Frontend component test for LoginForm in frontend/tests/component/test_login_form.test.tsx
- [X] T041 [P] [US1] Frontend component test for RegisterForm in frontend/tests/component/test_register_form.test.tsx

### Backend Implementation for User Story 1

- [X] T042 [P] [US1] Create User model in backend/src/models/user.py (id, email, password_hash, role, first_name, last_name, email_verified, is_active, last_login, timestamps)
- [X] T043 [US1] Create Alembic migration for User table (run alembic revision --autogenerate -m "create_users_table")
- [X] T044 [P] [US1] Create User Pydantic schemas in backend/src/schemas/user.py (UserCreate, UserResponse, UserLogin, TokenResponse)
- [X] T045 [US1] Implement authentication service in backend/src/services/auth_service.py (register_user, authenticate_user, create_access_token, verify_token)
- [X] T046 [US1] Create JWT dependency in backend/src/core/dependencies.py (get_current_user, require_role decorators)
- [X] T047 [US1] Implement POST /api/v1/auth/register endpoint in backend/src/api/auth.py
- [X] T048 [US1] Implement POST /api/v1/auth/login endpoint in backend/src/api/auth.py
- [X] T049 [US1] Implement POST /api/v1/auth/refresh endpoint in backend/src/api/auth.py
- [X] T050 [US1] Implement POST /api/v1/auth/password-reset-request endpoint in backend/src/api/auth.py
- [X] T051 [US1] Implement POST /api/v1/auth/password-reset-confirm endpoint in backend/src/api/auth.py
- [X] T052 [US1] Add rate limiting middleware for auth endpoints in backend/src/core/middleware.py (5 requests / 15 minutes per IP)
- [X] T053 [US1] Add password complexity validation in backend/src/services/auth_service.py (min 8 chars, uppercase, lowercase, digit, special char)

### Frontend Implementation for User Story 1

- [X] T054 [P] [US1] Create auth API client in frontend/src/api/auth.ts (register, login, refresh, passwordReset functions)
- [X] T055 [P] [US1] Create User TypeScript types in frontend/src/types/user.ts (User, UserRole, AuthTokens)
- [X] T056 [US1] Create LoginForm component in frontend/src/components/auth/LoginForm.tsx (email/password inputs, validation)
- [X] T057 [US1] Create RegisterForm component in frontend/src/components/auth/RegisterForm.tsx (email, password, role selector, name inputs)
- [X] T058 [US1] Create Login page in frontend/src/pages/auth/LoginPage.tsx (use LoginForm, handle auth state)
- [X] T059 [US1] Create Register page in frontend/src/pages/auth/RegisterPage.tsx (use RegisterForm, redirect after success)
- [X] T060 [US1] Create ProtectedRoute component in frontend/src/components/auth/ProtectedRoute.tsx (check auth, redirect to login)
- [X] T061 [US1] Create RoleGate component in frontend/src/components/auth/RoleGate.tsx (show content based on user role)
- [X] T062 [P] [US1] Create StudentDashboard page in frontend/src/pages/dashboard/StudentDashboard.tsx (placeholder content)
- [X] T063 [P] [US1] Create InstructorDashboard page in frontend/src/pages/dashboard/InstructorDashboard.tsx (placeholder content)
- [X] T064 [P] [US1] Create AdminDashboard page in frontend/src/pages/dashboard/AdminDashboard.tsx (placeholder content)
- [X] T065 [US1] Update App.tsx with protected routes for each dashboard type

**Checkpoint**: At this point, User Story 1 should be fully functional - users can register, log in, and see role-specific dashboards

---

## Phase 4: User Story 2 - Course Creation & Management (Priority: P1) 🎯 MVP

**Goal**: Enable instructors to create courses, upload content (video/PDF), organize in modules, and publish for student discovery

**Independent Test**: Instructor creates course in draft, uploads video + PDF, organizes in modules, publishes, verify course appears in public catalog

### Tests for User Story 2 (MANDATORY per Constitution VI) ⚠️

- [ ] T066 [P] [US2] Contract test for POST /api/v1/courses in backend/tests/contract/test_courses_create.py
- [ ] T067 [P] [US2] Contract test for POST /api/v1/content (multipart upload) in backend/tests/contract/test_content_upload.py
- [ ] T068 [P] [US2] Integration test for course creation and publishing journey in backend/tests/integration/test_course_creation_journey.py
- [ ] T069 [P] [US2] Frontend component test for CourseForm in frontend/tests/component/test_course_form.test.tsx
- [ ] T070 [P] [US2] Frontend component test for ContentUpload in frontend/tests/component/test_content_upload.test.tsx

### Backend Implementation for User Story 2

- [X] T071 [P] [US2] Create Course model in backend/src/models/course.py (id, instructor_id, title, description, category, visibility, enrollment_capacity, thumbnail_url, is_featured, timestamps)
- [X] T072 [P] [US2] Create Module model in backend/src/models/module.py (id, course_id, title, description, order_index, timestamps)
- [X] T073 [P] [US2] Create ContentItem model in backend/src/models/content_item.py (id, course_id, module_id, title, description, content_type, file_url, file_size, mime_type, text_content, duration_seconds, order_index, is_required, timestamps)
- [X] T074 [US2] Create Alembic migration for Course, Module, ContentItem tables with foreign keys and indexes
- [X] T075 [P] [US2] Create Course Pydantic schemas in backend/src/schemas/course.py (CourseCreate, CourseUpdate, CourseResponse, CourseListResponse)
- [X] T076 [P] [US2] Create Module Pydantic schemas in backend/src/schemas/module.py (ModuleCreate, ModuleResponse)
- [X] T077 [P] [US2] Create ContentItem Pydantic schemas in backend/src/schemas/content_item.py (ContentItemCreate, ContentItemResponse)
- [X] T078 [US2] Implement course service in backend/src/services/course_service.py (create_course, update_course, delete_course, get_course_by_id, list_courses with pagination)
- [X] T079 [US2] Implement content service in backend/src/services/content_service.py (upload_content, get_content_by_id, delete_content, generate_signed_url)
- [X] T080 [US2] Implement POST /api/v1/courses endpoint in backend/src/api/courses.py (instructor/admin only)
- [X] T081 [US2] Implement GET /api/v1/courses endpoint in backend/src/api/courses.py (list published courses with pagination, category filter)
- [X] T082 [US2] Implement GET /api/v1/courses/{course_id} endpoint in backend/src/api/courses.py (full course details with modules and content)
- [X] T083 [US2] Implement PUT /api/v1/courses/{course_id} endpoint in backend/src/api/courses.py (course owner or admin only)
- [X] T084 [US2] Implement DELETE /api/v1/courses/{course_id} endpoint in backend/src/api/courses.py (course owner or admin only)
- [X] T085 [US2] Implement POST /api/v1/content endpoint in backend/src/api/content.py (multipart/form-data, file upload handling, instructor/admin only)
- [X] T086 [US2] Implement GET /api/v1/content/{content_id} endpoint in backend/src/api/content.py (enrolled student or course instructor)
- [X] T087 [US2] Add file validation in backend/src/services/content_service.py (2GB max, whitelist: mp4/mov for video, pdf/docx for documents)
- [X] T088 [US2] Add course ownership check middleware in backend/src/core/dependencies.py (verify user owns course)

### Frontend Implementation for User Story 2

- [X] T089 [P] [US2] Create courses API client in frontend/src/api/courses.ts (createCourse, getCourses, getCourse, updateCourse, deleteCourse)
- [X] T090 [P] [US2] Create content API client in frontend/src/api/content.ts (uploadContent, getContent)
- [X] T091 [P] [US2] Create Course TypeScript types in frontend/src/types/course.ts (Course, CourseVisibility, Category, Module, ContentItem, ContentType)
- [X] T092 [US2] Create CourseForm component in frontend/src/components/courses/CourseForm.tsx (title, description, category, visibility inputs with validation)
- [X] T093 [US2] Create ContentUpload component in frontend/src/components/courses/ContentUpload.tsx (file drag-drop, progress bar, type selector)
- [X] T094 [US2] Create ModuleList component in frontend/src/components/courses/ModuleList.tsx (display modules with content items, reorder functionality)
- [X] T095 [US2] Create CourseCard component in frontend/src/components/courses/CourseCard.tsx (thumbnail, title, instructor, enrollment count)
- [X] T096 [US2] Create CreateCoursePage in frontend/src/pages/instructor/CreateCoursePage.tsx (use CourseForm, redirect after creation)
- [X] T097 [US2] Create EditCoursePage in frontend/src/pages/instructor/EditCoursePage.tsx (load existing course, use CourseForm, save changes)
- [X] T098 [US2] Create CourseContentManager page in frontend/src/pages/instructor/CourseContentManager.tsx (upload content, organize modules, reorder items)
- [X] T099 [US2] Create CourseCatalog page in frontend/src/pages/student/CourseCatalog.tsx (list published courses, pagination, category filter)
- [X] T100 [US2] Create CourseDetailsPage in frontend/src/pages/student/CourseDetailsPage.tsx (display course info, modules, content list, enroll button)
- [X] T101 [US2] Add course management routes to InstructorDashboard (My Courses, Create Course)

**Checkpoint**: At this point, instructors can create and manage courses with content, students can browse course catalog

---

## Phase 5: User Story 3 - Course Enrollment (Priority: P1) 🎯 MVP

**Goal**: Enable students to enroll in courses with one action, access enrolled course content, and view their course list

**Independent Test**: Student browses catalog, enrolls in course, accesses content, verifies non-enrolled student cannot access content (403 Forbidden)

### Tests for User Story 3 (MANDATORY per Constitution VI) ⚠️

- [ ] T102 [P] [US3] Contract test for POST /api/v1/enrollments in backend/tests/contract/test_enrollments_create.py
- [ ] T103 [P] [US3] Contract test for GET /api/v1/enrollments/my-courses in backend/tests/contract/test_enrollments_list.py
- [ ] T104 [P] [US3] Integration test for student enrollment journey in backend/tests/integration/test_student_enrollment_journey.py
- [ ] T105 [P] [US3] Integration test for content access control (enrolled vs non-enrolled) in backend/tests/integration/test_content_access_control.py
- [ ] T106 [P] [US3] Frontend component test for EnrollButton in frontend/tests/component/test_enroll_button.test.tsx

### Backend Implementation for User Story 3

- [ ] T107 [US3] Create Enrollment model in backend/src/models/enrollment.py (id, student_id, course_id, enrollment_date, completion_percentage, is_completed, completion_date, unenrollment_date, is_active, timestamps)
- [ ] T108 [US3] Create Alembic migration for Enrollment table with unique constraint on (student_id, course_id) and indexes
- [ ] T109 [US3] Create Enrollment Pydantic schemas in backend/src/schemas/enrollment.py (EnrollmentCreate, EnrollmentResponse, EnrollmentWithCourse)
- [ ] T110 [US3] Implement enrollment service in backend/src/services/enrollment_service.py (enroll_student, unenroll_student, get_student_enrollments, check_enrollment_capacity, is_student_enrolled)
- [ ] T111 [US3] Implement POST /api/v1/enrollments endpoint in backend/src/api/enrollments.py (student role required, capacity check, duplicate enrollment check)
- [ ] T112 [US3] Implement GET /api/v1/enrollments/my-courses endpoint in backend/src/api/enrollments.py (return user's enrollments with course details and progress)
- [ ] T113 [US3] Implement DELETE /api/v1/enrollments/{enrollment_id} endpoint in backend/src/api/enrollments.py (enrollment owner only)
- [ ] T114 [US3] Implement GET /api/v1/courses/{course_id}/roster endpoint in backend/src/api/courses.py (course instructor or admin only, list enrolled students with progress)
- [ ] T115 [US3] Add enrollment check dependency in backend/src/core/dependencies.py (verify_enrollment for content access)
- [ ] T116 [US3] Update GET /api/v1/content/{content_id} endpoint to require enrollment check
- [ ] T117 [US3] Add enrollment capacity validation in enrollment_service.py (prevent enrollment if course full)

### Frontend Implementation for User Story 3

- [ ] T118 [P] [US3] Create enrollments API client in frontend/src/api/enrollments.ts (enrollInCourse, getMyEnrollments, unenrollFromCourse)
- [ ] T119 [P] [US3] Create Enrollment TypeScript types in frontend/src/types/enrollment.ts (Enrollment, EnrollmentWithCourse)
- [ ] T120 [US3] Create EnrollButton component in frontend/src/components/enrollments/EnrollButton.tsx (show "Enroll" or "Enrolled", handle enrollment action)
- [ ] T121 [US3] Create MyCoursesPage in frontend/src/pages/student/MyCoursesPage.tsx (list enrolled courses with progress, "Continue Learning" links)
- [ ] T122 [US3] Create CoursePlayerPage in frontend/src/pages/student/CoursePlayerPage.tsx (display course content, video player, PDF viewer, navigation)
- [ ] T123 [US3] Update CourseDetailsPage to show EnrollButton for non-enrolled students
- [ ] T124 [US3] Update CourseDetailsPage to show "Go to Course" button for enrolled students
- [ ] T125 [US3] Add my courses route to StudentDashboard

**Checkpoint**: At this point, students can enroll in courses and access content, P1 MVP features complete (Auth + Courses + Enrollment)

---

## Phase 6: User Story 4 - Progress Tracking (Priority: P2)

**Goal**: Automatically track student progress through course content, calculate completion percentage, identify completed enrollments

**Independent Test**: Student marks content items as complete, verify progress percentage updates correctly, verify 100% completion triggers completion flag

### Tests for User Story 4

- [ ] T126 [P] [US4] Contract test for PUT /api/v1/content/{content_id}/complete in backend/tests/contract/test_content_complete.py
- [ ] T127 [P] [US4] Integration test for progress calculation in backend/tests/integration/test_progress_calculation.py
- [ ] T128 [P] [US4] Integration test for completion detection (100% triggers is_completed) in backend/tests/integration/test_completion_detection.py

### Backend Implementation for User Story 4

- [ ] T129 [US4] Create ProgressRecord model in backend/src/models/progress_record.py (id, enrollment_id, content_item_id, is_completed, completed_at, time_spent_seconds, timestamps)
- [ ] T130 [US4] Create Alembic migration for ProgressRecord table with unique constraint on (enrollment_id, content_item_id)
- [ ] T131 [US4] Create ProgressRecord Pydantic schemas in backend/src/schemas/progress.py (ProgressRecordResponse, ProgressUpdate)
- [ ] T132 [US4] Implement progress service in backend/src/services/progress_service.py (mark_content_complete, calculate_completion_percentage, get_enrollment_progress)
- [ ] T133 [US4] Implement PUT /api/v1/content/{content_id}/complete endpoint in backend/src/api/content.py (enrolled student only)
- [ ] T134 [US4] Add automatic enrollment completion detection in progress_service.py (set is_completed=True, completion_date when 100%)
- [ ] T135 [US4] Update GET /api/v1/enrollments/my-courses to include progress records for each course
- [ ] T136 [US4] Add progress calculation trigger in enrollment_service.py (recalculate after each content completion)

### Frontend Implementation for User Story 4

- [ ] T137 [P] [US4] Create progress API client in frontend/src/api/progress.ts (markContentComplete)
- [ ] T138 [P] [US4] Create ProgressRecord TypeScript types in frontend/src/types/progress.ts (ProgressRecord)
- [ ] T139 [US4] Create ProgressBar component in frontend/src/components/progress/ProgressBar.tsx (visual progress indicator)
- [ ] T140 [US4] Create ContentCompletionCheckbox component in frontend/src/components/progress/ContentCompletionCheckbox.tsx (mark as complete button)
- [ ] T141 [US4] Update CoursePlayerPage to show ContentCompletionCheckbox for each content item
- [ ] T142 [US4] Update MyCoursesPage to show ProgressBar for each enrolled course
- [ ] T143 [US4] Update CoursePlayerPage to show overall course progress percentage

**Checkpoint**: At this point, progress tracking works automatically for all enrolled students

---

## Phase 7: User Story 5 - Quizzes & Assessments (Priority: P2)

**Goal**: Enable instructors to create quizzes with multiple question types, students to take quizzes with immediate grading and feedback

**Independent Test**: Instructor creates quiz with multiple choice and true/false questions, student takes quiz, receives immediate score and correct answers

### Tests for User Story 5 (MANDATORY per Constitution VI - grade calculation is critical path) ⚠️

- [ ] T144 [P] [US5] Contract test for POST /api/v1/quizzes in backend/tests/contract/test_quizzes_create.py
- [ ] T145 [P] [US5] Contract test for POST /api/v1/quizzes/{quiz_id}/attempts in backend/tests/contract/test_quiz_attempts_submit.py
- [ ] T146 [P] [US5] Integration test for quiz taking and grading journey in backend/tests/integration/test_quiz_grading_journey.py
- [ ] T147 [P] [US5] Integration test for max attempts enforcement in backend/tests/integration/test_quiz_max_attempts.py
- [ ] T148 [P] [US5] Frontend component test for QuizQuestion in frontend/tests/component/test_quiz_question.test.tsx

### Backend Implementation for User Story 5

- [ ] T149 [P] [US5] Create Quiz model in backend/src/models/quiz.py (id, course_id, title, description, time_limit_minutes, max_attempts, passing_score_percentage, shuffle_questions, show_correct_answers, order_index, timestamps)
- [ ] T150 [P] [US5] Create Question model in backend/src/models/question.py (id, quiz_id, question_type, question_text, points, options, correct_answer, explanation, order_index, timestamps)
- [ ] T151 [P] [US5] Create QuizAttempt model in backend/src/models/quiz_attempt.py (id, quiz_id, student_id, enrollment_id, attempt_number, started_at, submitted_at, time_spent_seconds, score, max_score, passed, answers, is_completed)
- [ ] T152 [US5] Create Alembic migration for Quiz, Question, QuizAttempt tables with JSONB columns for options/answers
- [ ] T153 [P] [US5] Create Quiz Pydantic schemas in backend/src/schemas/quiz.py (QuizCreate, QuizResponse, QuestionSchema)
- [ ] T154 [P] [US5] Create QuizAttempt Pydantic schemas in backend/src/schemas/quiz_attempt.py (QuizAttemptCreate, QuizAttemptResponse, QuizSubmission)
- [ ] T155 [US5] Implement quiz service in backend/src/services/quiz_service.py (create_quiz, get_quiz_by_id, check_max_attempts)
- [ ] T156 [US5] Implement grading service in backend/src/services/grading_service.py (grade_quiz_attempt, calculate_score, check_passing_score)
- [ ] T157 [US5] Implement POST /api/v1/quizzes endpoint in backend/src/api/quizzes.py (instructor/course owner only)
- [ ] T158 [US5] Implement GET /api/v1/quizzes/{quiz_id} endpoint in backend/src/api/quizzes.py (enrolled student or instructor)
- [ ] T159 [US5] Implement POST /api/v1/quizzes/{quiz_id}/attempts endpoint in backend/src/api/quizzes.py (enrolled student, max attempts check, immediate grading)
- [ ] T160 [US5] Implement GET /api/v1/quizzes/{quiz_id}/attempts/{attempt_id} endpoint in backend/src/api/quizzes.py (attempt owner or instructor)
- [ ] T161 [US5] Implement GET /api/v1/quizzes/{quiz_id}/attempts endpoint in backend/src/api/quizzes.py (instructor only, aggregate results)
- [ ] T162 [US5] Add quiz attempt validation in quiz_service.py (prevent submissions after max attempts reached)

### Frontend Implementation for User Story 5

- [ ] T163 [P] [US5] Create quizzes API client in frontend/src/api/quizzes.ts (createQuiz, getQuiz, submitQuizAttempt, getQuizAttempt)
- [ ] T164 [P] [US5] Create Quiz TypeScript types in frontend/src/types/quiz.ts (Quiz, Question, QuestionType, QuizAttempt, Answer)
- [ ] T165 [US5] Create QuizBuilder component in frontend/src/components/quizzes/QuizBuilder.tsx (add/remove questions, configure quiz settings)
- [ ] T166 [US5] Create QuizQuestion component in frontend/src/components/quizzes/QuizQuestion.tsx (render based on question type: multiple choice, true/false, short answer)
- [ ] T167 [US5] Create QuizTaker component in frontend/src/components/quizzes/QuizTaker.tsx (display questions, collect answers, submit quiz)
- [ ] T168 [US5] Create QuizResults component in frontend/src/components/quizzes/QuizResults.tsx (show score, correct answers, explanations)
- [ ] T169 [US5] Create CreateQuizPage in frontend/src/pages/instructor/CreateQuizPage.tsx (use QuizBuilder, save quiz)
- [ ] T170 [US5] Create TakeQuizPage in frontend/src/pages/student/TakeQuizPage.tsx (use QuizTaker, submit and show results)
- [ ] T171 [US5] Create QuizResultsPage in frontend/src/pages/student/QuizResultsPage.tsx (use QuizResults, show attempt history)
- [ ] T172 [US5] Update CourseContentManager to include quiz creation option
- [ ] T173 [US5] Update CoursePlayerPage to show "Take Quiz" button for quiz content items

**Checkpoint**: At this point, quiz functionality is complete with automatic grading and immediate feedback

---

## Phase 8: User Story 6 - Discussion Forums (Priority: P3)

**Goal**: Enable course discussions with topics, threaded replies, pinning/locking by instructors

**Independent Test**: Student creates topic, instructor replies, student replies to instructor (threaded), instructor pins topic, verify pinned topics appear first

### Backend Implementation for User Story 6

- [ ] T174 [P] [US6] Create ForumTopic model in backend/src/models/forum_topic.py (id, course_id, author_id, title, content, is_pinned, is_locked, timestamps)
- [ ] T175 [P] [US6] Create Post model in backend/src/models/post.py (id, topic_id, parent_post_id, author_id, content, timestamps)
- [ ] T176 [US6] Create Alembic migration for ForumTopic and Post tables with self-referential foreign key for threaded replies
- [ ] T177 [P] [US6] Create ForumTopic Pydantic schemas in backend/src/schemas/forum.py (TopicCreate, TopicResponse, TopicUpdate)
- [ ] T178 [P] [US6] Create Post Pydantic schemas in backend/src/schemas/post.py (PostCreate, PostResponse, PostWithReplies)
- [ ] T179 [US6] Implement forum service in backend/src/services/forum_service.py (create_topic, create_post, pin_topic, lock_topic)
- [ ] T180 [US6] Implement POST /api/v1/courses/{course_id}/topics endpoint in backend/src/api/forums.py (enrolled user only)
- [ ] T181 [US6] Implement GET /api/v1/courses/{course_id}/topics endpoint in backend/src/api/forums.py (list topics, pinned first)
- [ ] T182 [US6] Implement POST /api/v1/topics/{topic_id}/posts endpoint in backend/src/api/forums.py (enrolled user, optional parent_post_id for threading)
- [ ] T183 [US6] Implement GET /api/v1/topics/{topic_id}/posts endpoint in backend/src/api/forums.py (list posts with threaded structure)
- [ ] T184 [US6] Implement PUT /api/v1/topics/{topic_id} endpoint in backend/src/api/forums.py (instructor only, pin/lock topic)

### Frontend Implementation for User Story 6

- [ ] T185 [P] [US6] Create forums API client in frontend/src/api/forums.ts (createTopic, getTopics, createPost, getPosts, updateTopic)
- [ ] T186 [P] [US6] Create Forum TypeScript types in frontend/src/types/forum.ts (ForumTopic, Post, PostWithReplies)
- [ ] T187 [US6] Create TopicList component in frontend/src/components/forums/TopicList.tsx (display topics, show pinned indicator)
- [ ] T188 [US6] Create TopicItem component in frontend/src/components/forums/TopicItem.tsx (single topic card with author, date, reply count)
- [ ] T189 [US6] Create CreateTopicForm component in frontend/src/components/forums/CreateTopicForm.tsx (title and content inputs)
- [ ] T190 [US6] Create PostThread component in frontend/src/components/forums/PostThread.tsx (display threaded replies recursively)
- [ ] T191 [US6] Create ReplyForm component in frontend/src/components/forums/ReplyForm.tsx (reply to topic or post)
- [ ] T192 [US6] Create ForumPage in frontend/src/pages/forums/ForumPage.tsx (list topics, create topic button)
- [ ] T193 [US6] Create TopicDetailsPage in frontend/src/pages/forums/TopicDetailsPage.tsx (show topic, posts, reply form)
- [ ] T194 [US6] Update CourseDetailsPage to include "Discussions" tab with link to ForumPage

**Checkpoint**: At this point, discussion forums are functional with threaded replies

---

## Phase 9: User Story 7 - Assignments (Priority: P3)

**Goal**: Enable instructors to create assignments with due dates, students to submit files, instructors to grade with feedback

**Independent Test**: Instructor creates assignment with due date, student submits file on time, instructor grades submission with feedback, student views grade

### Backend Implementation for User Story 7

- [ ] T195 [P] [US7] Create Assignment model in backend/src/models/assignment.py (id, course_id, title, description, instructions, max_points, due_date, allow_late_submissions, timestamps)
- [ ] T196 [P] [US7] Create Submission model in backend/src/models/submission.py (id, assignment_id, student_id, enrollment_id, file_url, file_name, file_size, submitted_at, is_late, grade, feedback, graded_at, graded_by)
- [ ] T197 [US7] Create Alembic migration for Assignment and Submission tables
- [ ] T198 [P] [US7] Create Assignment Pydantic schemas in backend/src/schemas/assignment.py (AssignmentCreate, AssignmentResponse)
- [ ] T199 [P] [US7] Create Submission Pydantic schemas in backend/src/schemas/submission.py (SubmissionResponse, SubmissionGrade)
- [ ] T200 [US7] Implement assignment service in backend/src/services/assignment_service.py (create_assignment, check_late_submission)
- [ ] T201 [US7] Implement submission service in backend/src/services/submission_service.py (submit_assignment, grade_submission)
- [ ] T202 [US7] Implement POST /api/v1/assignments endpoint in backend/src/api/assignments.py (instructor/course owner only)
- [ ] T203 [US7] Implement POST /api/v1/assignments/{assignment_id}/submissions endpoint in backend/src/api/assignments.py (enrolled student, multipart/form-data file upload, is_late calculation)
- [ ] T204 [US7] Implement GET /api/v1/assignments/{assignment_id}/submissions endpoint in backend/src/api/assignments.py (instructor only, list all submissions)
- [ ] T205 [US7] Implement PUT /api/v1/submissions/{submission_id}/grade endpoint in backend/src/api/assignments.py (course instructor only)
- [ ] T206 [US7] Implement GET /api/v1/submissions/{submission_id} endpoint in backend/src/api/assignments.py (submission owner or instructor)

### Frontend Implementation for User Story 7

- [ ] T207 [P] [US7] Create assignments API client in frontend/src/api/assignments.ts (createAssignment, submitAssignment, gradeSubmission, getSubmission)
- [ ] T208 [P] [US7] Create Assignment TypeScript types in frontend/src/types/assignment.ts (Assignment, Submission)
- [ ] T209 [US7] Create AssignmentForm component in frontend/src/components/assignments/AssignmentForm.tsx (title, description, due date, max points inputs)
- [ ] T210 [US7] Create AssignmentCard component in frontend/src/components/assignments/AssignmentCard.tsx (show title, due date, submission status)
- [ ] T211 [US7] Create SubmissionUpload component in frontend/src/components/assignments/SubmissionUpload.tsx (file upload, late indicator)
- [ ] T212 [US7] Create GradingForm component in frontend/src/components/assignments/GradingForm.tsx (grade input, feedback textarea)
- [ ] T213 [US7] Create CreateAssignmentPage in frontend/src/pages/instructor/CreateAssignmentPage.tsx (use AssignmentForm)
- [ ] T214 [US7] Create AssignmentDetailsPage in frontend/src/pages/student/AssignmentDetailsPage.tsx (show assignment details, SubmissionUpload)
- [ ] T215 [US7] Create GradeAssignmentPage in frontend/src/pages/instructor/GradeAssignmentPage.tsx (list submissions, use GradingForm)
- [ ] T216 [US7] Update CourseContentManager to include assignment creation option
- [ ] T217 [US7] Update CoursePlayerPage to show "Submit Assignment" button for assignment content items

**Checkpoint**: At this point, assignment submission and grading workflow is complete

---

## Phase 10: User Story 8 - Certificates (Priority: P3)

**Goal**: Automatically generate certificates on course completion, enable PDF download and public verification

**Independent Test**: Student completes 100% of course content, certificate auto-generated, student downloads PDF, external party verifies certificate via code

### Backend Implementation for User Story 8

- [ ] T218 [US8] Create Certificate model in backend/src/models/certificate.py (id, student_id, course_id, enrollment_id, verification_code, issued_date, pdf_url, is_revoked, revoked_at, timestamps)
- [ ] T219 [US8] Create Alembic migration for Certificate table with unique verification_code index
- [ ] T220 [US8] Create Certificate Pydantic schemas in backend/src/schemas/certificate.py (CertificateResponse, CertificateVerification)
- [ ] T221 [US8] Implement certificate service in backend/src/services/certificate_service.py (generate_certificate, generate_verification_code, revoke_certificate)
- [ ] T222 [US8] Implement PDF generation task in backend/src/tasks/certificate_tasks.py (Celery task, use ReportLab or WeasyPrint for PDF generation)
- [ ] T223 [US8] Add certificate auto-generation trigger in progress_service.py (create certificate when enrollment reaches 100% completion)
- [ ] T224 [US8] Implement POST /api/v1/enrollments/{enrollment_id}/certificate endpoint in backend/src/api/certificates.py (system internal only)
- [ ] T225 [US8] Implement GET /api/v1/certificates endpoint in backend/src/api/certificates.py (list user's certificates)
- [ ] T226 [US8] Implement GET /api/v1/certificates/{certificate_id}/download endpoint in backend/src/api/certificates.py (certificate owner, return PDF)
- [ ] T227 [US8] Implement GET /api/v1/certificates/verify/{verification_code} endpoint in backend/src/api/certificates.py (public, no auth required)

### Frontend Implementation for User Story 8

- [ ] T228 [P] [US8] Create certificates API client in frontend/src/api/certificates.ts (getCertificates, downloadCertificate, verifyCertificate)
- [ ] T229 [P] [US8] Create Certificate TypeScript types in frontend/src/types/certificate.ts (Certificate)
- [ ] T230 [US8] Create CertificateCard component in frontend/src/components/certificates/CertificateCard.tsx (show certificate details, download button)
- [ ] T231 [US8] Create CertificateVerification component in frontend/src/components/certificates/CertificateVerification.tsx (verification code input, display verification result)
- [ ] T232 [US8] Create MyCertificatesPage in frontend/src/pages/student/MyCertificatesPage.tsx (list earned certificates with CertificateCard)
- [ ] T233 [US8] Create VerifyCertificatePage in frontend/src/pages/public/VerifyCertificatePage.tsx (public page, use CertificateVerification)
- [ ] T234 [US8] Update StudentDashboard to show "My Certificates" link
- [ ] T235 [US8] Update MyCoursesPage to show "View Certificate" button for completed courses

**Checkpoint**: At this point, certificate generation and verification is complete

---

## Phase 11: User Story 9 - Notifications (Priority: P3)

**Goal**: Send in-app and email notifications for key events (enrollment, deadlines, announcements, grades, forum replies)

**Independent Test**: Enroll in course (notification sent), grade assignment (notification sent), reply to forum post (notification sent), verify in-app and email notifications

### Backend Implementation for User Story 9

- [ ] T236 [US9] Create Notification model in backend/src/models/notification.py (id, user_id, type, title, content, related_entity_type, related_entity_id, is_read, sent_via_email, email_sent_at, created_at)
- [ ] T237 [US9] Create Alembic migration for Notification table
- [ ] T238 [US9] Create Notification Pydantic schemas in backend/src/schemas/notification.py (NotificationResponse, NotificationCreate)
- [ ] T239 [US9] Implement notification service in backend/src/services/notification_service.py (create_notification, mark_as_read, get_user_notifications)
- [ ] T240 [US9] Implement email task in backend/src/tasks/email_tasks.py (Celery task, send notification emails)
- [ ] T241 [US9] Add notification triggers in enrollment_service.py (send notification on enrollment)
- [ ] T242 [US9] Add notification triggers in submission_service.py (send notification when graded)
- [ ] T243 [US9] Add notification triggers in forum_service.py (send notification on replies)
- [ ] T244 [US9] Implement GET /api/v1/notifications endpoint in backend/src/api/notifications.py (list user's notifications, unread filter)
- [ ] T245 [US9] Implement PUT /api/v1/notifications/{notification_id}/read endpoint in backend/src/api/notifications.py (mark notification as read)
- [ ] T246 [US9] Implement GET /api/v1/notifications/unread-count endpoint in backend/src/api/notifications.py (count unread notifications)

### Frontend Implementation for User Story 9

- [ ] T247 [P] [US9] Create notifications API client in frontend/src/api/notifications.ts (getNotifications, markAsRead, getUnreadCount)
- [ ] T248 [P] [US9] Create Notification TypeScript types in frontend/src/types/notification.ts (Notification, NotificationType)
- [ ] T249 [US9] Create NotificationBell component in frontend/src/components/notifications/NotificationBell.tsx (header icon, unread badge)
- [ ] T250 [US9] Create NotificationList component in frontend/src/components/notifications/NotificationList.tsx (dropdown list from bell icon)
- [ ] T251 [US9] Create NotificationItem component in frontend/src/components/notifications/NotificationItem.tsx (single notification, mark as read on click)
- [ ] T252 [US9] Create NotificationsPage in frontend/src/pages/notifications/NotificationsPage.tsx (full notification list with pagination)
- [ ] T253 [US9] Add NotificationBell to main header/nav component
- [ ] T254 [US9] Setup polling or WebSocket for real-time notification updates

**Checkpoint**: At this point, notification system is fully functional

---

## Phase 12: User Story 10 - Search Functionality (Priority: P3)

**Goal**: Enable users to search for courses by keyword/category, and search within enrolled course content

**Independent Test**: Search courses by keyword, filter by category, search within course content, verify results are ranked by relevance

### Backend Implementation for User Story 10

- [ ] T255 [US10] Add full-text search indexes to Course table in Alembic migration (PostgreSQL GIN index on title and description)
- [ ] T256 [US10] Add full-text search indexes to ContentItem table in Alembic migration (GIN index on title and text_content)
- [ ] T257 [US10] Implement search service in backend/src/services/search_service.py (search_courses with relevance ranking, search_course_content)
- [ ] T258 [US10] Implement GET /api/v1/search/courses endpoint in backend/src/api/search.py (query param, category filter, pagination, rank by relevance)
- [ ] T259 [US10] Implement GET /api/v1/courses/{course_id}/search endpoint in backend/src/api/search.py (enrolled student only, search within course content)
- [ ] T260 [US10] Update GET /api/v1/courses endpoint to support ?q= query parameter for keyword search

### Frontend Implementation for User Story 10

- [ ] T261 [P] [US10] Create search API client in frontend/src/api/search.ts (searchCourses, searchCourseContent)
- [ ] T262 [US10] Create SearchBar component in frontend/src/components/search/SearchBar.tsx (input with autocomplete suggestions)
- [ ] T263 [US10] Create SearchResults component in frontend/src/components/search/SearchResults.tsx (display search results with pagination)
- [ ] T264 [US10] Create CourseSearchPage in frontend/src/pages/search/CourseSearchPage.tsx (use SearchBar and SearchResults)
- [ ] T265 [US10] Update CourseCatalog page to use SearchBar for keyword search
- [ ] T266 [US10] Update CoursePlayerPage to include SearchBar for in-course content search
- [ ] T267 [US10] Add SearchBar to main header/nav component

**Checkpoint**: At this point, search functionality is complete for courses and content

---

## Phase 13: User Story 11 - User Profiles & Admin Dashboards (Priority: P3)

**Goal**: Enable users to manage profiles, admins to view platform metrics and manage users

**Independent Test**: User updates profile, admin views metrics (total users, courses, enrollments), admin suspends user, verify suspended user cannot login

### Backend Implementation for User Story 11

- [ ] T268 [US11] Add profile fields to User model if not present (bio, avatar_url already in data model)
- [ ] T269 [US11] Create UserProfile Pydantic schemas in backend/src/schemas/user.py (ProfileUpdate, ProfileResponse)
- [ ] T270 [US11] Implement profile service in backend/src/services/profile_service.py (update_profile, upload_avatar)
- [ ] T271 [US11] Implement metrics service in backend/src/services/metrics_service.py (calculate_total_users, calculate_total_courses, calculate_active_users)
- [ ] T272 [US11] Implement GET /api/v1/profile endpoint in backend/src/api/profile.py (current user profile)
- [ ] T273 [US11] Implement PUT /api/v1/profile endpoint in backend/src/api/profile.py (update current user profile)
- [ ] T274 [US11] Implement POST /api/v1/profile/avatar endpoint in backend/src/api/profile.py (upload avatar, multipart/form-data)
- [ ] T275 [US11] Implement GET /api/v1/admin/metrics endpoint in backend/src/api/admin.py (admin only, return platform statistics)
- [ ] T276 [US11] Implement GET /api/v1/admin/users endpoint in backend/src/api/admin.py (admin only, list users with pagination and role filter)
- [ ] T277 [US11] Implement PUT /api/v1/admin/users/{user_id}/suspend endpoint in backend/src/api/admin.py (admin only, set is_active=False)
- [ ] T278 [US11] Update authentication service to check is_active flag on login (return 403 if suspended)

### Frontend Implementation for User Story 11

- [ ] T279 [P] [US11] Create profile API client in frontend/src/api/profile.ts (getProfile, updateProfile, uploadAvatar)
- [ ] T280 [P] [US11] Create admin API client in frontend/src/api/admin.ts (getMetrics, getUsers, suspendUser)
- [ ] T281 [US11] Create ProfileForm component in frontend/src/components/profile/ProfileForm.tsx (edit bio, first name, last name)
- [ ] T282 [US11] Create AvatarUpload component in frontend/src/components/profile/AvatarUpload.tsx (upload and preview avatar)
- [ ] T283 [US11] Create ProfilePage in frontend/src/pages/profile/ProfilePage.tsx (use ProfileForm and AvatarUpload)
- [ ] T284 [US11] Create MetricsCard component in frontend/src/components/admin/MetricsCard.tsx (display single metric)
- [ ] T285 [US11] Create UserManagementTable component in frontend/src/components/admin/UserManagementTable.tsx (list users, suspend button)
- [ ] T286 [US11] Update AdminDashboard to display metrics (total users, courses, enrollments, active users)
- [ ] T287 [US11] Create UserManagementPage in frontend/src/pages/admin/UserManagementPage.tsx (use UserManagementTable)
- [ ] T288 [US11] Add profile link to user dropdown in header/nav

**Checkpoint**: At this point, all 11 user stories are fully implemented

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T289 [P] Add comprehensive error logging across all API endpoints in backend/src/core/middleware.py
- [ ] T290 [P] Implement request correlation IDs in backend/src/core/middleware.py (add to all logs for tracing)
- [ ] T291 [P] Add API rate limiting for general endpoints (100 req/min per user) in backend/src/core/middleware.py
- [ ] T292 [P] Add CORS configuration in backend/src/main.py (allow frontend origin only)
- [ ] T293 [P] Setup Nginx configuration in nginx/nginx.conf (reverse proxy, static file serving, gzip compression)
- [ ] T294 [P] Create Docker Compose file in docker-compose.yml (postgres, redis, backend, frontend, nginx services)
- [ ] T295 [P] Create backend Dockerfile in backend/Dockerfile (multi-stage build for production)
- [ ] T296 [P] Create frontend Dockerfile in frontend/Dockerfile (multi-stage build with nginx serve)
- [ ] T297 [P] Create seed data script in backend/scripts/seed_data.py (sample users, courses for development)
- [ ] T298 [P] Create README.md in project root (setup instructions, quickstart commands, architecture overview)
- [ ] T299 [P] Create API documentation page using FastAPI auto-generated Swagger UI
- [ ] T300 [P] Add loading skeletons to all frontend pages for better UX
- [ ] T301 [P] Add error boundaries to all major frontend route components
- [ ] T302 [P] Implement optimistic updates for critical frontend actions (enrollment, content completion)
- [ ] T303 [P] Add accessibility audit using axe-core or similar tool (WCAG 2.1 Level AA compliance per Constitution I)
- [ ] T304 [P] Create health check endpoints in backend/src/api/health.py (database, redis, celery worker status)
- [ ] T305 [P] Setup CI/CD pipeline configuration in .github/workflows/ (run tests, linting, build Docker images)
- [ ] T306 Run all integration test scenarios from quickstart.md (7 scenarios validating end-to-end user journeys)
- [ ] T307 [P] Performance optimization: Add database query indexes based on slow query log analysis
- [ ] T308 [P] Security hardening: Add input sanitization middleware to prevent XSS attacks
- [ ] T309 [P] Security hardening: Add SQL injection prevention checks (already handled by SQLAlchemy ORM, verify)
- [ ] T310 [P] Add comprehensive unit tests for services layer in backend/tests/unit/ (80%+ coverage target)
- [ ] T311 [P] Add comprehensive component tests for reusable components in frontend/tests/component/
- [ ] T312 Code cleanup and refactoring: Extract repeated validation logic into shared utilities
- [ ] T313 Documentation: Create architecture diagrams in docs/architecture/ (C4 model: context, container, component)
- [ ] T314 Documentation: Create API integration guide in docs/api-integration.md (example requests, authentication flow)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories P1 (Phases 3-5)**: All depend on Foundational phase completion
  - US1 Auth (Phase 3): Can start after Foundational - No dependencies on other stories
  - US2 Course Creation (Phase 4): Can start after Foundational - No dependencies on other stories (can run in parallel with US1)
  - US3 Enrollment (Phase 5): Depends on US1 (auth) and US2 (courses) completion
- **User Stories P2 (Phases 6-7)**: Depend on P1 MVP completion
  - US4 Progress (Phase 6): Depends on US3 (enrollment) and US2 (content items)
  - US5 Quizzes (Phase 7): Depends on US1 (auth) and US2 (courses), can run in parallel with US4
- **User Stories P3 (Phases 8-13)**: Depend on P1 MVP completion, recommended after P2
  - US6 Forums (Phase 8): Depends on US1 (auth) and US2 (courses)
  - US7 Assignments (Phase 9): Depends on US1 (auth), US2 (courses), US3 (enrollment)
  - US8 Certificates (Phase 10): Depends on US4 (progress tracking at 100%)
  - US9 Notifications (Phase 11): Depends on US3 (enrollment), US7 (assignment grading), US6 (forum replies)
  - US10 Search (Phase 12): Depends on US2 (courses and content)
  - US11 Admin/Profiles (Phase 13): Depends on US1 (auth), can run in parallel with other P3 stories
- **Polish (Phase 14)**: Depends on all desired user stories being complete

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before API endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - US1 (Auth) and US2 (Courses) can run in parallel (different domains)
  - Tests for different user stories marked [P] can run in parallel
  - Models within a story marked [P] can run in parallel
  - Frontend and backend work for same story can run in parallel (after models/schemas defined)
- P3 stories US6, US7, US10, US11 can run in parallel (if team capacity allows)
- All Polish tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US1 Auth
4. Complete Phase 4: US2 Course Creation
5. Complete Phase 5: US3 Enrollment
6. **STOP and VALIDATE**: Test all P1 stories independently using quickstart.md scenarios 1-2
7. Deploy/demo MVP

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 Auth → Test independently → Deploy/Demo
3. Add US2 Courses + US3 Enrollment → Test independently → Deploy/Demo (P1 MVP!)
4. Add US4 Progress + US5 Quizzes → Test independently → Deploy/Demo (P2 enhancements)
5. Add US6-US11 (P3) → Test independently → Deploy/Demo (full feature set)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 Auth (Phase 3)
   - Developer B: US2 Course Creation (Phase 4)
3. After US1 + US2 complete:
   - Developer A or B: US3 Enrollment (Phase 5)
4. After P1 MVP complete:
   - Developer A: US4 Progress (Phase 6)
   - Developer B: US5 Quizzes (Phase 7)
5. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests marked as MANDATORY per Constitution VI must pass before deployment
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Total tasks: 314 (Setup: 10, Foundational: 24, US1: 31, US2: 33, US3: 24, US4: 18, US5: 29, US6: 21, US7: 23, US8: 18, US9: 19, US10: 13, US11: 20, Polish: 26)
- Estimated timeline: 12-16 weeks for full implementation (P1 MVP: 4-6 weeks, P2: 3-4 weeks, P3: 5-6 weeks)
