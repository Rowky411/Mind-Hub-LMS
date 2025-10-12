# API Contracts Summary: Mind Hub LMS

**Feature**: Mind Hub Learning Management System
**Date**: 2025-10-11
**Purpose**: Define RESTful API endpoints, request/response formats, and validation rules

## Overview

All APIs follow REST principles with JSON request/response bodies. Authentication uses JWT bearer tokens in Authorization header. All endpoints return standard error format with HTTP status codes.

## Base URL

- Development: `http://localhost:8000/api/v1`
- Production: `https://api.mindhub.edu/v1`

## Authentication Endpoints (`/auth`)

### POST /auth/register
**Purpose**: Register new user account

**Request**:
```json
{
  "email": "string (email format)",
  "password": "string (min 8 chars)",
  "role": "student|instructor|admin",
  "first_name": "string",
  "last_name": "string"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "email": "string",
  "role": "string",
  "access_token": "string (JWT)",
  "refresh_token": "string"
}
```

### POST /auth/login
**Request**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "string",
    "first_name": "string",
    "last_name": "string"
  }
}
```

### POST /auth/refresh
**Request**: Bearer token in header

**Response** (200 OK):
```json
{
  "access_token": "string"
}
```

### POST /auth/password-reset-request
**Request**:
```json
{
  "email": "string"
}
```

**Response** (200 OK - always returns success for security)

### POST /auth/password-reset-confirm
**Request**:
```json
{
  "token": "string (from email)",
  "new_password": "string"
}
```

**Response** (200 OK)

## Course Endpoints (`/courses`)

### GET /courses
**Purpose**: List all published courses

**Query Params**:
- `page`: integer (default 1)
- `per_page`: integer (default 20, max 100)
- `category`: string (filter)
- `instructor_id`: uuid (filter)

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "instructor": {
        "id": "uuid",
        "name": "string"
      },
      "category": "string",
      "enrollment_count": integer,
      "thumbnail_url": "string"
    }
  ],
  "total": integer,
  "page": integer,
  "per_page": integer
}
```

### POST /courses
**Auth**: Instructor or Admin only

**Request**:
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "visibility": "public|private|draft",
  "enrollment_capacity": integer (nullable)
}
```

**Response** (201 Created): Course object

### GET /courses/{course_id}
**Response** (200 OK): Full course details with modules and content items

### PUT /courses/{course_id}
**Auth**: Course owner or Admin

**Request**: Same as POST, all fields optional

**Response** (200 OK): Updated course object

### DELETE /courses/{course_id}
**Auth**: Course owner or Admin

**Response** (204 No Content)

## Enrollment Endpoints (`/enrollments`)

### POST /enrollments
**Auth**: Student role required

**Request**:
```json
{
  "course_id": "uuid"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "course_id": "uuid",
  "enrollment_date": "timestamp",
  "completion_percentage": 0.00
}
```

### GET /enrollments/my-courses
**Auth**: Required

**Response** (200 OK): List of user's enrollments with progress

### DELETE /enrollments/{enrollment_id}
**Auth**: Enrollment owner

**Response** (204 No Content)

### GET /courses/{course_id}/roster
**Auth**: Course instructor or Admin

**Response** (200 OK): List of enrolled students with progress

## Content Endpoints (`/content`)

### POST /content
**Auth**: Instructor (course owner) or Admin

**Request** (multipart/form-data):
- `course_id`: uuid
- `module_id`: uuid (optional)
- `title`: string
- `description`: string
- `content_type`: video|document|text
- `file`: binary (for video/document)
- `text_content`: string (for text type)
- `order_index`: integer
- `is_required`: boolean

**Response** (201 Created): Content item object

### GET /content/{content_id}
**Auth**: Enrolled student or course instructor

**Response** (200 OK): Content item with signed URL for file access

### PUT /content/{content_id}/complete
**Auth**: Enrolled student

**Response** (200 OK): Updated progress record

## Assessment Endpoints (`/assessments`)

### POST /quizzes
**Auth**: Instructor (course owner)

**Request**:
```json
{
  "course_id": "uuid",
  "title": "string",
  "description": "string",
  "time_limit_minutes": integer (nullable),
  "max_attempts": integer,
  "passing_score_percentage": decimal,
  "questions": [
    {
      "question_type": "multiple_choice|true_false|short_answer",
      "question_text": "string",
      "points": decimal,
      "options": [{"id": "A", "text": "string"}], // for multiple_choice
      "correct_answer": "object", // format varies by type
      "explanation": "string"
    }
  ]
}
```

**Response** (201 Created): Quiz object with questions

### POST /quizzes/{quiz_id}/attempts
**Auth**: Enrolled student

**Request**:
```json
{
  "answers": {
    "question_id": "answer_value"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "quiz_id": "uuid",
  "attempt_number": integer,
  "score": decimal,
  "max_score": decimal,
  "passed": boolean,
  "submitted_at": "timestamp"
}
```

### GET /quizzes/{quiz_id}/attempts/{attempt_id}
**Auth**: Attempt owner or course instructor

**Response** (200 OK): Attempt details with answers and correct answers

## Forum Endpoints (`/forums`) - P3

### POST /courses/{course_id}/topics
**Auth**: Enrolled user

**Request**:
```json
{
  "title": "string",
  "content": "string"
}
```

**Response** (201 Created): Topic object

### POST /topics/{topic_id}/posts
**Request**:
```json
{
  "content": "string",
  "parent_post_id": "uuid (optional)"
}
```

**Response** (201 Created): Post object

## Assignment Endpoints (`/assignments`) - P3

### POST /assignments
**Auth**: Instructor (course owner)

**Request**:
```json
{
  "course_id": "uuid",
  "title": "string",
  "description": "string",
  "instructions": "string",
  "max_points": decimal,
  "due_date": "timestamp",
  "allow_late_submissions": boolean
}
```

**Response** (201 Created): Assignment object

### POST /assignments/{assignment_id}/submissions
**Auth**: Enrolled student

**Request** (multipart/form-data):
- `file`: binary

**Response** (201 Created): Submission object with is_late flag

### PUT /submissions/{submission_id}/grade
**Auth**: Course instructor

**Request**:
```json
{
  "grade": decimal,
  "feedback": "string"
}
```

**Response** (200 OK): Updated submission

## Certificate Endpoints (`/certificates`) - P3

### POST /enrollments/{enrollment_id}/certificate
**Auth**: System (triggered on course completion)

**Response** (201 Created): Certificate object

### GET /certificates/{certificate_id}/download
**Auth**: Certificate owner

**Response** (200 OK): PDF binary

### GET /certificates/verify/{verification_code}
**Auth**: None (public)

**Response** (200 OK): Certificate details (student name, course, date)

## Search Endpoints (`/search`) - P3

### GET /search/courses
**Query Params**:
- `q`: string (search query)
- `category`: string (filter)
- `instructor_id`: uuid (filter)

**Response** (200 OK): Paginated course results ranked by relevance

### GET /courses/{course_id}/search
**Auth**: Enrolled student

**Query Params**:
- `q`: string

**Response** (200 OK): Content items matching query within course

## Admin Endpoints (`/admin`) - P3

### GET /admin/users
**Auth**: Admin only

**Query Params**: Pagination, role filter

**Response** (200 OK): List of users

### PUT /admin/users/{user_id}/suspend
**Auth**: Admin only

**Response** (200 OK)

### GET /admin/metrics
**Auth**: Admin only

**Response** (200 OK):
```json
{
  "total_users": integer,
  "total_courses": integer,
  "total_enrollments": integer,
  "active_users_last_7_days": integer
}
```

## Error Responses

All endpoints return consistent error format:

**4xx Client Errors**:
```json
{
  "error": {
    "code": "string (ERROR_CODE)",
    "message": "Human-readable message",
    "details": {} // optional validation errors
  }
}
```

**5xx Server Errors**:
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "request_id": "string (for support)"
  }
}
```

## Rate Limiting

- Auth endpoints: 5 requests / 15 minutes per IP
- General endpoints: 100 requests / minute per user
- File uploads: 10 requests / hour per user

Response headers include:
- `X-RateLimit-Limit`: Max requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Versioning

API version in URL path (`/api/v1`). Breaking changes increment major version. Non-breaking changes maintain backward compatibility within version.

This summary covers all 11 user stories. Full OpenAPI 3.1 specs to be generated during implementation for automated client generation.
