# Data Model: Mind Hub LMS

**Feature**: Mind Hub Learning Management System
**Date**: 2025-10-11
**Purpose**: Define database schema, entity relationships, and data constraints

## Entity Relationship Overview

```
User (1) ----< (M) Enrollment (M) >---- (1) Course
  |                    |                     |
  |                    |                     |
  v                    v                     v
Certificate      Progress Record      Content Item
  ^                                         |
  |                                         v
  +----------------------------------- Module/Section

Quiz (1) ----< (M) Question
  |
  v
Quiz Attempt (1) ----< (M) Answer

Assignment (1) ----< (M) Submission

Forum Topic (1) ----< (M) Post
```

## Core Entities

### User

Represents all platform users with role-based access control.

**Fields**:
- `id`: UUID, Primary Key
- `email`: VARCHAR(255), UNIQUE, NOT NULL - User's email address
- `password_hash`: VARCHAR(255), NOT NULL - bcrypt hashed password
- `role`: ENUM('student', 'instructor', 'admin'), NOT NULL - User role
- `first_name`: VARCHAR(100), NOT NULL
- `last_name`: VARCHAR(100), NOT NULL
- `bio`: TEXT, NULLABLE - User biography
- `avatar_url`: VARCHAR(500), NULLABLE - Profile picture path
- `email_verified`: BOOLEAN, DEFAULT FALSE
- `is_active`: BOOLEAN, DEFAULT TRUE
- `last_login`: TIMESTAMP, NULLABLE
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE
- `deleted_at`: TIMESTAMP, NULLABLE - Soft delete

**Indexes**:
- `idx_user_email` on (`email`)
- `idx_user_role` on (`role`)
- `idx_user_active` on (`is_active`, `deleted_at`)

**Relationships**:
- One-to-many with Course (as instructor)
- One-to-many with Enrollment (as student)
- One-to-many with Certificate
- One-to-many with Quiz Attempt
- One-to-many with Submission
- One-to-many with Forum Topic
- One-to-many with Post

**Constraints**:
- Email must be valid format (application-level validation)
- Password must be minimum 8 characters with complexity requirements (application-level)
- Role cannot be changed after creation without admin approval

---

### Course

Represents educational content container managed by instructors.

**Fields**:
- `id`: UUID, Primary Key
- `instructor_id`: UUID, Foreign Key → User(id), NOT NULL
- `title`: VARCHAR(200), NOT NULL
- `description`: TEXT, NOT NULL
- `category`: VARCHAR(100), NOT NULL
- `visibility`: ENUM('public', 'private', 'draft'), DEFAULT 'draft'
- `enrollment_capacity`: INTEGER, NULLABLE - Max students (NULL = unlimited)
- `thumbnail_url`: VARCHAR(500), NULLABLE
- `is_featured`: BOOLEAN, DEFAULT FALSE
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE
- `deleted_at`: TIMESTAMP, NULLABLE

**Indexes**:
- `idx_course_instructor` on (`instructor_id`)
- `idx_course_visibility` on (`visibility`, `deleted_at`)
- `idx_course_category` on (`category`)
- `idx_course_featured` on (`is_featured`, `visibility`)

**Relationships**:
- Many-to-one with User (instructor)
- One-to-many with Enrollment
- One-to-many with Content Item
- One-to-many with Quiz
- One-to-many with Assignment
- One-to-many with Forum Topic

**Constraints**:
- Instructor must have 'instructor' or 'admin' role
- Title must be unique per instructor
- Enrollment capacity if set must be positive

---

### Enrollment

Represents student-course relationship and participation.

**Fields**:
- `id`: UUID, Primary Key
- `student_id`: UUID, Foreign Key → User(id), NOT NULL
- `course_id`: UUID, Foreign Key → Course(id), NOT NULL
- `enrollment_date`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `completion_percentage`: DECIMAL(5,2), DEFAULT 0.00 - Calculated field (0-100)
- `is_completed`: BOOLEAN, DEFAULT FALSE
- `completion_date`: TIMESTAMP, NULLABLE
- `unenrollment_date`: TIMESTAMP, NULLABLE
- `is_active`: BOOLEAN, DEFAULT TRUE
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE

**Indexes**:
- `idx_enrollment_student` on (`student_id`, `is_active`)
- `idx_enrollment_course` on (`course_id`, `is_active`)
- `idx_enrollment_composite` on (`student_id`, `course_id`) UNIQUE

**Relationships**:
- Many-to-one with User (student)
- Many-to-one with Course
- One-to-many with Progress Record

**Constraints**:
- Student cannot enroll in same course twice (active enrollment)
- Student must have 'student' role
- Completion percentage must be between 0-100

---

### Content Item

Represents individual learning materials within a course.

**Fields**:
- `id`: UUID, Primary Key
- `course_id`: UUID, Foreign Key → Course(id), NOT NULL
- `module_id`: UUID, Foreign Key → Module(id), NULLABLE - Organizational grouping
- `title`: VARCHAR(200), NOT NULL
- `description`: TEXT, NULLABLE
- `content_type`: ENUM('video', 'document', 'text', 'quiz', 'assignment'), NOT NULL
- `file_url`: VARCHAR(500), NULLABLE - For video/document types
- `file_size`: BIGINT, NULLABLE - Bytes
- `mime_type`: VARCHAR(100), NULLABLE
- `text_content`: TEXT, NULLABLE - For text type
- `duration_seconds`: INTEGER, NULLABLE - For video type
- `order_index`: INTEGER, NOT NULL - Position within module/course
- `is_required`: BOOLEAN, DEFAULT TRUE - Counts toward completion
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE
- `deleted_at`: TIMESTAMP, NULLABLE

**Indexes**:
- `idx_content_course` on (`course_id`, `order_index`)
- `idx_content_module` on (`module_id`, `order_index`)
- `idx_content_type` on (`content_type`)

**Relationships**:
- Many-to-one with Course
- Many-to-one with Module (optional grouping)
- One-to-many with Progress Record

**Constraints**:
- File URL required for video/document types
- Text content required for text type
- Order index must be unique within module (or course if no module)
- File size must not exceed 2GB (2,147,483,648 bytes)

---

### Module

Organizational grouping of content items within a course.

**Fields**:
- `id`: UUID, Primary Key
- `course_id`: UUID, Foreign Key → Course(id), NOT NULL
- `title`: VARCHAR(200), NOT NULL
- `description`: TEXT, NULLABLE
- `order_index`: INTEGER, NOT NULL
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE

**Indexes**:
- `idx_module_course` on (`course_id`, `order_index`)

**Relationships**:
- Many-to-one with Course
- One-to-many with Content Item

---

### Progress Record

Tracks student completion of individual content items.

**Fields**:
- `id`: UUID, Primary Key
- `enrollment_id`: UUID, Foreign Key → Enrollment(id), NOT NULL
- `content_item_id`: UUID, Foreign Key → Content Item(id), NOT NULL
- `is_completed`: BOOLEAN, DEFAULT FALSE
- `completed_at`: TIMESTAMP, NULLABLE
- `time_spent_seconds`: INTEGER, DEFAULT 0
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE

**Indexes**:
- `idx_progress_enrollment` on (`enrollment_id`)
- `idx_progress_content` on (`content_item_id`)
- `idx_progress_composite` on (`enrollment_id`, `content_item_id`) UNIQUE

**Relationships**:
- Many-to-one with Enrollment
- Many-to-one with Content Item

---

### Quiz

Assessment container with multiple questions.

**Fields**:
- `id`: UUID, Primary Key
- `course_id`: UUID, Foreign Key → Course(id), NOT NULL
- `title`: VARCHAR(200), NOT NULL
- `description`: TEXT, NULLABLE
- `time_limit_minutes`: INTEGER, NULLABLE - NULL = no limit
- `max_attempts`: INTEGER, DEFAULT 1
- `passing_score_percentage`: DECIMAL(5,2), DEFAULT 70.00
- `shuffle_questions`: BOOLEAN, DEFAULT FALSE
- `show_correct_answers`: BOOLEAN, DEFAULT TRUE - After completion
- `order_index`: INTEGER, NOT NULL
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE
- `deleted_at`: TIMESTAMP, NULLABLE

**Indexes**:
- `idx_quiz_course` on (`course_id`, `order_index`)

**Relationships**:
- Many-to-one with Course
- One-to-many with Question
- One-to-many with Quiz Attempt

---

### Question

Individual quiz question with answer options.

**Fields**:
- `id`: UUID, Primary Key
- `quiz_id`: UUID, Foreign Key → Quiz(id), NOT NULL
- `question_type`: ENUM('multiple_choice', 'true_false', 'short_answer'), NOT NULL
- `question_text`: TEXT, NOT NULL
- `points`: DECIMAL(5,2), DEFAULT 1.00
- `options`: JSONB, NULLABLE - For multiple choice: [{"id": "A", "text": "Option A"}, ...]
- `correct_answer`: JSONB, NOT NULL - Format varies by type
- `explanation`: TEXT, NULLABLE - Shown after answer
- `order_index`: INTEGER, NOT NULL
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE

**Indexes**:
- `idx_question_quiz` on (`quiz_id`, `order_index`)

**Relationships**:
- Many-to-one with Quiz
- One-to-many with Answer (via Quiz Attempt)

---

### Quiz Attempt

Student's attempt at taking a quiz.

**Fields**:
- `id`: UUID, Primary Key
- `quiz_id`: UUID, Foreign Key → Quiz(id), NOT NULL
- `student_id`: UUID, Foreign Key → User(id), NOT NULL
- `enrollment_id`: UUID, Foreign Key → Enrollment(id), NOT NULL
- `attempt_number`: INTEGER, NOT NULL - 1, 2, 3...
- `started_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `submitted_at`: TIMESTAMP, NULLABLE
- `time_spent_seconds`: INTEGER, DEFAULT 0
- `score`: DECIMAL(5,2), NULLABLE - Calculated after submission
- `max_score`: DECIMAL(5,2), NOT NULL - Total possible points
- `passed`: BOOLEAN, NULLABLE - Based on passing_score_percentage
- `answers`: JSONB, NOT NULL - {question_id: answer_value}
- `is_completed`: BOOLEAN, DEFAULT FALSE

**Indexes**:
- `idx_attempt_quiz` on (`quiz_id`)
- `idx_attempt_student` on (`student_id`, `quiz_id`)
- `idx_attempt_enrollment` on (`enrollment_id`)

**Relationships**:
- Many-to-one with Quiz
- Many-to-one with User (student)
- Many-to-one with Enrollment

**Constraints**:
- Attempt number cannot exceed quiz max_attempts
- Student must be enrolled in course

---

### Assignment (P3)

Graded work requiring file submission.

**Fields**:
- `id`: UUID, Primary Key
- `course_id`: UUID, Foreign Key → Course(id), NOT NULL
- `title`: VARCHAR(200), NOT NULL
- `description`: TEXT, NOT NULL
- `instructions`: TEXT, NULLABLE
- `max_points`: DECIMAL(5,2), DEFAULT 100.00
- `due_date`: TIMESTAMP, NOT NULL
- `allow_late_submissions`: BOOLEAN, DEFAULT TRUE
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE
- `deleted_at`: TIMESTAMP, NULLABLE

**Indexes**:
- `idx_assignment_course` on (`course_id`)
- `idx_assignment_due_date` on (`due_date`)

**Relationships**:
- Many-to-one with Course
- One-to-many with Submission

---

### Submission (P3)

Student's assignment file upload and grading record.

**Fields**:
- `id`: UUID, Primary Key
- `assignment_id`: UUID, Foreign Key → Assignment(id), NOT NULL
- `student_id`: UUID, Foreign Key → User(id), NOT NULL
- `enrollment_id`: UUID, Foreign Key → Enrollment(id), NOT NULL
- `file_url`: VARCHAR(500), NOT NULL
- `file_name`: VARCHAR(255), NOT NULL
- `file_size`: BIGINT, NOT NULL
- `submitted_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `is_late`: BOOLEAN, DEFAULT FALSE
- `grade`: DECIMAL(5,2), NULLABLE
- `feedback`: TEXT, NULLABLE
- `graded_at`: TIMESTAMP, NULLABLE
- `graded_by`: UUID, Foreign Key → User(id), NULLABLE

**Indexes**:
- `idx_submission_assignment` on (`assignment_id`)
- `idx_submission_student` on (`student_id`, `assignment_id`)

**Relationships**:
- Many-to-one with Assignment
- Many-to-one with User (student)
- Many-to-one with User (grader)
- Many-to-one with Enrollment

---

### Forum Topic (P3)

Discussion thread within a course forum.

**Fields**:
- `id`: UUID, Primary Key
- `course_id`: UUID, Foreign Key → Course(id), NOT NULL
- `author_id`: UUID, Foreign Key → User(id), NOT NULL
- `title`: VARCHAR(200), NOT NULL
- `content`: TEXT, NOT NULL
- `is_pinned`: BOOLEAN, DEFAULT FALSE
- `is_locked`: BOOLEAN, DEFAULT FALSE
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE
- `deleted_at`: TIMESTAMP, NULLABLE

**Indexes**:
- `idx_topic_course` on (`course_id`, `is_pinned`, `created_at`)
- `idx_topic_author` on (`author_id`)

**Relationships**:
- Many-to-one with Course
- Many-to-one with User (author)
- One-to-many with Post

---

### Post (P3)

Individual message in a forum thread.

**Fields**:
- `id`: UUID, Primary Key
- `topic_id`: UUID, Foreign Key → Forum Topic(id), NOT NULL
- `parent_post_id`: UUID, Foreign Key → Post(id), NULLABLE - For threaded replies
- `author_id`: UUID, Foreign Key → User(id), NOT NULL
- `content`: TEXT, NOT NULL
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE
- `deleted_at`: TIMESTAMP, NULLABLE

**Indexes**:
- `idx_post_topic` on (`topic_id`, `created_at`)
- `idx_post_parent` on (`parent_post_id`)
- `idx_post_author` on (`author_id`)

**Relationships**:
- Many-to-one with Forum Topic
- Many-to-one with Post (parent, self-referential)
- Many-to-one with User (author)

---

### Certificate (P3)

Completion credential issued to students.

**Fields**:
- `id`: UUID, Primary Key
- `student_id`: UUID, Foreign Key → User(id), NOT NULL
- `course_id`: UUID, Foreign Key → Course(id), NOT NULL
- `enrollment_id`: UUID, Foreign Key → Enrollment(id), NOT NULL
- `verification_code`: VARCHAR(50), UNIQUE, NOT NULL
- `issued_date`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `pdf_url`: VARCHAR(500), NULLABLE - Generated PDF path
- `is_revoked`: BOOLEAN, DEFAULT FALSE
- `revoked_at`: TIMESTAMP, NULLABLE
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP

**Indexes**:
- `idx_certificate_student` on (`student_id`)
- `idx_certificate_course` on (`course_id`)
- `idx_certificate_verification` on (`verification_code`) UNIQUE

**Relationships**:
- Many-to-one with User (student)
- Many-to-one with Course
- Many-to-one with Enrollment

**Constraints**:
- Verification code must be cryptographically random
- Can only be issued for completed enrollments

---

### Notification (P3)

User alerts and communication.

**Fields**:
- `id`: UUID, Primary Key
- `user_id`: UUID, Foreign Key → User(id), NOT NULL
- `type`: ENUM('enrollment', 'deadline', 'announcement', 'grade', 'forum_reply'), NOT NULL
- `title`: VARCHAR(200), NOT NULL
- `content`: TEXT, NOT NULL
- `related_entity_type`: VARCHAR(50), NULLABLE - 'course', 'assignment', 'post'
- `related_entity_id`: UUID, NULLABLE
- `is_read`: BOOLEAN, DEFAULT FALSE
- `sent_via_email`: BOOLEAN, DEFAULT FALSE
- `email_sent_at`: TIMESTAMP, NULLABLE
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP

**Indexes**:
- `idx_notification_user` on (`user_id`, `is_read`, `created_at`)
- `idx_notification_type` on (`type`)

**Relationships**:
- Many-to-one with User

---

## Data Integrity Rules

### Referential Integrity
- All foreign keys use CASCADE DELETE for child records except:
  - User deletions: SET NULL for graded_by fields, RESTRICT for enrollments (must unenroll first)
  - Course deletions: RESTRICT if active enrollments exist

### Audit Logging
Per Constitution Principle II, critical data changes require audit logs:
- **Enrollment changes**: Log enrollment_date, unenrollment_date, completion_date
- **Grade changes**: Log grade updates in separate audit table (not shown, implementation detail)
- **Certificate issuance/revocation**: Immutable records with timestamps

### Soft Deletes
Entities with `deleted_at` field use soft delete pattern:
- User, Course, Content Item, Quiz, Assignment, Forum Topic, Post
- Allows recovery and maintains referential integrity
- Queries must filter `WHERE deleted_at IS NULL`

### Validation (Application Layer)
- Email format validation
- Password complexity (8+ chars, uppercase, lowercase, digit, special char)
- File type whitelist (videos: mp4/mov, documents: pdf/docx)
- File size limits (2GB max)
- Input sanitization to prevent XSS/SQL injection

## Performance Optimizations

### Indexes Strategy
- All foreign keys indexed
- Compound indexes for common queries (user + course for enrollments)
- Partial indexes for active records (`WHERE deleted_at IS NULL`)

### Calculated Fields
- `enrollment.completion_percentage`: Recalculated on progress updates
- `quiz_attempt.score`: Calculated on submission
- Avoid expensive JOIN queries by denormalizing when appropriate

### Query Patterns
- Use eager loading (JOIN) for known relationships (course with content items)
- Implement pagination (LIMIT/OFFSET) for list endpoints
- Cache frequently accessed data (course catalog) with appropriate TTL

## Migration Strategy

1. Initial schema creation via Alembic
2. Seed data for development (sample users, courses)
3. Add indexes after initial data load for performance
4. Version control all schema changes
5. Test migrations on staging before production

This data model supports all 11 user stories with a clear path from MVP (P1) to full feature set (P3).
