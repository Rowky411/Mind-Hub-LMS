# Quickstart Guide: Mind Hub LMS Integration Scenarios

**Feature**: Mind Hub Learning Management System
**Date**: 2025-10-11
**Purpose**: End-to-end integration test scenarios for validating complete user journeys

## Overview

This guide provides step-by-step integration test scenarios covering all three user roles and priority levels (P1-P3). Each scenario is independently executable and validates a complete user journey through the system.

## Scenario 1: Student Learning Journey (P1 Core Features)

**Goal**: Student registers, discovers course, enrolls, and accesses content

**User Story Coverage**: US1 (Auth), US3 (Enrollment)

### Steps:

1. **Register as Student**
   ```
   POST /api/v1/auth/register
   Body: {
     "email": "alice@student.edu",
     "password": "SecurePass123!",
     "role": "student",
     "first_name": "Alice",
     "last_name": "Student"
   }
   Expected: 201 Created, returns access_token
   ```

2. **Browse Course Catalog**
   ```
   GET /api/v1/courses?page=1&per_page=20
   Expected: 200 OK, list of published courses
   ```

3. **View Course Details**
   ```
   GET /api/v1/courses/{course_id}
   Expected: 200 OK, full course details with modules
   ```

4. **Enroll in Course**
   ```
   POST /api/v1/enrollments
   Headers: Authorization: Bearer {access_token}
   Body: {"course_id": "{course_id}"}
   Expected: 201 Created, enrollment record with 0% completion
   ```

5. **Access Course Content**
   ```
   GET /api/v1/content/{content_id}
   Headers: Authorization: Bearer {access_token}
   Expected: 200 OK, content item with signed URL
   ```

6. **Mark Content as Complete**
   ```
   PUT /api/v1/content/{content_id}/complete
   Headers: Authorization: Bearer {access_token}
   Expected: 200 OK, progress updated
   ```

7. **Check Progress**
   ```
   GET /api/v1/enrollments/my-courses
   Headers: Authorization: Bearer {access_token}
   Expected: 200 OK, enrollment shows updated completion_percentage
   ```

**Validation**:
- ✅ Student can register and authenticate
- ✅ Student can browse public courses without enrollment
- ✅ Student can enroll with one action
- ✅ Enrolled student can access course content
- ✅ Non-enrolled student cannot access content (403 Forbidden)
- ✅ Progress tracking updates on content completion

---

## Scenario 2: Instructor Course Creation Journey (P1 Core Features)

**Goal**: Instructor creates course, uploads content, organizes modules

**User Story Coverage**: US1 (Auth), US2 (Course Creation)

### Steps:

1. **Register as Instructor**
   ```
   POST /api/v1/auth/register
   Body: {
     "email": "bob@instructor.edu",
     "password": "SecurePass456!",
     "role": "instructor",
     "first_name": "Bob",
     "last_name": "Instructor"
   }
   Expected: 201 Created
   ```

2. **Create New Course**
   ```
   POST /api/v1/courses
   Headers: Authorization: Bearer {access_token}
   Body: {
     "title": "Introduction to Python Programming",
     "description": "Learn Python fundamentals",
     "category": "Programming",
     "visibility": "draft"
   }
   Expected: 201 Created, course in draft status
   ```

3. **Upload Video Content**
   ```
   POST /api/v1/content
   Headers: Authorization: Bearer {access_token}, Content-Type: multipart/form-data
   Body: {
     "course_id": "{course_id}",
     "title": "Python Basics - Variables",
     "content_type": "video",
     "file": (binary video file),
     "order_index": 1,
     "is_required": true
   }
   Expected: 201 Created, content item with file URL
   ```

4. **Upload PDF Document**
   ```
   POST /api/v1/content
   Headers: Authorization: Bearer {access_token}, Content-Type: multipart/form-data
   Body: {
     "course_id": "{course_id}",
     "title": "Python Cheat Sheet",
     "content_type": "document",
     "file": (binary PDF file),
     "order_index": 2,
     "is_required": false
   }
   Expected: 201 Created
   ```

5. **Publish Course**
   ```
   PUT /api/v1/courses/{course_id}
   Headers: Authorization: Bearer {access_token}
   Body: {"visibility": "public"}
   Expected: 200 OK, course now visible in catalog
   ```

6. **Preview Course as Student**
   ```
   GET /api/v1/courses/{course_id}
   (No auth - public endpoint)
   Expected: 200 OK, course appears with content list
   ```

**Validation**:
- ✅ Instructor can create courses
- ✅ Video upload processes successfully (< 2GB limit)
- ✅ PDF upload processes successfully
- ✅ Content items appear in specified order
- ✅ Draft courses not visible to students
- ✅ Published courses appear in catalog
- ✅ Only course owner can edit content

---

## Scenario 3: Quiz Taking and Grading Journey (P2 Assessment)

**Goal**: Instructor creates quiz, student takes quiz, receives immediate feedback

**User Story Coverage**: US5 (Assessments)

### Steps:

1. **Instructor Creates Quiz**
   ```
   POST /api/v1/quizzes
   Headers: Authorization: Bearer {instructor_token}
   Body: {
     "course_id": "{course_id}",
     "title": "Python Fundamentals Quiz",
     "time_limit_minutes": 30,
     "max_attempts": 2,
     "passing_score_percentage": 70.00,
     "questions": [
       {
         "question_type": "multiple_choice",
         "question_text": "What is a variable in Python?",
         "points": 10.0,
         "options": [
           {"id": "A", "text": "A container for data"},
           {"id": "B", "text": "A function"},
           {"id": "C", "text": "A loop"},
           {"id": "D", "text": "A class"}
         ],
         "correct_answer": {"choice": "A"},
         "explanation": "Variables store data values in memory"
       },
       {
         "question_type": "true_false",
         "question_text": "Python is case-sensitive",
         "points": 5.0,
         "correct_answer": {"value": true},
         "explanation": "Variable 'name' and 'Name' are different"
       }
     ]
   }
   Expected: 201 Created
   ```

2. **Student Enrolls in Course** (prerequisite)
   ```
   POST /api/v1/enrollments
   Headers: Authorization: Bearer {student_token}
   Body: {"course_id": "{course_id}"}
   ```

3. **Student Takes Quiz**
   ```
   POST /api/v1/quizzes/{quiz_id}/attempts
   Headers: Authorization: Bearer {student_token}
   Body: {
     "answers": {
       "{question_1_id}": {"choice": "A"},
       "{question_2_id}": {"value": true}
     }
   }
   Expected: 201 Created, immediate grade calculation
   ```

4. **Student Views Results**
   ```
   GET /api/v1/quizzes/{quiz_id}/attempts/{attempt_id}
   Headers: Authorization: Bearer {student_token}
   Expected: 200 OK, score, correct answers, explanations
   ```

5. **Instructor Views Aggregate Results**
   ```
   GET /api/v1/quizzes/{quiz_id}/attempts?course_id={course_id}
   Headers: Authorization: Bearer {instructor_token}
   Expected: 200 OK, all student attempts with statistics
   ```

**Validation**:
- ✅ Multiple question types supported
- ✅ Automatic grading for objective questions
- ✅ Immediate feedback on submission
- ✅ Attempt tracking with score history
- ✅ Max attempts enforced (403 after limit)
- ✅ Time limit enforcement (if set)
- ✅ Passing score correctly evaluated

---

## Scenario 4: Assignment Submission and Grading (P3 Extended Features)

**Goal**: Instructor assigns work, student submits file, instructor grades

**User Story Coverage**: US7 (Assignments)

### Steps:

1. **Instructor Creates Assignment**
   ```
   POST /api/v1/assignments
   Headers: Authorization: Bearer {instructor_token}
   Body: {
     "course_id": "{course_id}",
     "title": "Build a Calculator App",
     "description": "Create a Python calculator with basic operations",
     "instructions": "Submit .py file with documentation",
     "max_points": 100.0,
     "due_date": "2025-12-31T23:59:59Z",
     "allow_late_submissions": true
   }
   Expected: 201 Created
   ```

2. **Student Submits On Time**
   ```
   POST /api/v1/assignments/{assignment_id}/submissions
   Headers: Authorization: Bearer {student_token}, Content-Type: multipart/form-data
   Body: {
     "file": (binary .py file)
   }
   Expected: 201 Created, is_late: false
   ```

3. **Instructor Grades Submission**
   ```
   PUT /api/v1/submissions/{submission_id}/grade
   Headers: Authorization: Bearer {instructor_token}
   Body: {
     "grade": 95.0,
     "feedback": "Excellent work! Consider adding error handling for division by zero."
   }
   Expected: 200 OK
   ```

4. **Student Views Grade**
   ```
   GET /api/v1/submissions/{submission_id}
   Headers: Authorization: Bearer {student_token}
   Expected: 200 OK, grade and feedback visible
   ```

**Validation**:
- ✅ File upload handles various file types
- ✅ Late submission flag set correctly
- ✅ Only instructor can grade
- ✅ Student sees feedback after grading
- ✅ Grade reflects in overall progress

---

## Scenario 5: Forum Discussion (P3 Extended Features)

**Goal**: Students and instructors engage in course discussions

**User Story Coverage**: US6 (Forums)

### Steps:

1. **Student Creates Discussion Topic**
   ```
   POST /api/v1/courses/{course_id}/topics
   Headers: Authorization: Bearer {student_token}
   Body: {
     "title": "Question about Python loops",
     "content": "Can someone explain the difference between for and while loops?"
   }
   Expected: 201 Created
   ```

2. **Instructor Replies**
   ```
   POST /api/v1/topics/{topic_id}/posts
   Headers: Authorization: Bearer {instructor_token}
   Body: {
     "content": "Great question! For loops iterate over sequences, while loops continue until condition is false."
   }
   Expected: 201 Created
   ```

3. **Student Replies to Thread**
   ```
   POST /api/v1/topics/{topic_id}/posts
   Headers: Authorization: Bearer {student_token}
   Body: {
     "content": "Thanks! That clarifies it.",
     "parent_post_id": "{instructor_post_id}"
   }
   Expected: 201 Created, threaded reply
   ```

4. **Instructor Pins Topic**
   ```
   PUT /api/v1/topics/{topic_id}
   Headers: Authorization: Bearer {instructor_token}
   Body: {"is_pinned": true}
   Expected: 200 OK
   ```

**Validation**:
- ✅ Enrolled users can post
- ✅ Non-enrolled users cannot post (403)
- ✅ Threaded replies work correctly
- ✅ Instructors can pin/lock topics
- ✅ Topics ordered correctly (pinned first)

---

## Scenario 6: Certificate Generation (P3 Extended Features)

**Goal**: Student completes course, receives certificate

**User Story Coverage**: US8 (Certificates)

### Steps:

1. **Student Completes All Required Content**
   ```
   (Complete all content items in course)
   Expected: enrollment.completion_percentage = 100.0
   ```

2. **System Auto-Generates Certificate** (triggered by completion)
   ```
   Internal: POST /api/v1/enrollments/{enrollment_id}/certificate
   Expected: Certificate created with unique verification_code
   ```

3. **Student Views Certificate in Profile**
   ```
   GET /api/v1/certificates?student_id={student_id}
   Headers: Authorization: Bearer {student_token}
   Expected: 200 OK, list of earned certificates
   ```

4. **Student Downloads Certificate PDF**
   ```
   GET /api/v1/certificates/{certificate_id}/download
   Headers: Authorization: Bearer {student_token}
   Expected: 200 OK, Content-Type: application/pdf
   ```

5. **External Party Verifies Certificate**
   ```
   GET /api/v1/certificates/verify/{verification_code}
   (No auth required - public endpoint)
   Expected: 200 OK, certificate details (student name, course, date)
   ```

**Validation**:
- ✅ Certificate generated on 100% completion
- ✅ PDF includes all required information
- ✅ Verification code is unique
- ✅ Public verification works without auth
- ✅ Invalid codes return 404

---

## Scenario 7: Admin Platform Management (P3 Extended Features)

**Goal**: Admin monitors platform, manages users

**User Story Coverage**: US11 (Admin Dashboards)

### Steps:

1. **Admin Views Platform Metrics**
   ```
   GET /api/v1/admin/metrics
   Headers: Authorization: Bearer {admin_token}
   Expected: 200 OK
   Response: {
     "total_users": 1250,
     "total_courses": 45,
     "total_enrollments": 3200,
     "active_users_last_7_days": 850
   }
   ```

2. **Admin Lists All Users**
   ```
   GET /api/v1/admin/users?page=1&role=student
   Headers: Authorization: Bearer {admin_token}
   Expected: 200 OK, paginated user list
   ```

3. **Admin Suspends User**
   ```
   PUT /api/v1/admin/users/{user_id}/suspend
   Headers: Authorization: Bearer {admin_token}
   Expected: 200 OK
   ```

4. **Suspended User Cannot Login**
   ```
   POST /api/v1/auth/login
   Body: {suspended user credentials}
   Expected: 403 Forbidden, "Account suspended"
   ```

**Validation**:
- ✅ Only admin role can access admin endpoints
- ✅ Metrics accurately reflect database state
- ✅ User suspension works immediately
- ✅ Suspended users cannot authenticate

---

## Environment Setup for Testing

### Prerequisites:
- Python 3.11+ and Node.js 18+
- PostgreSQL 15+ running
- Redis running (for Celery)
- Environment variables configured

### Run Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head  # Run migrations
uvicorn src.main:app --reload
```

### Run Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Seed Test Data:
```bash
cd backend
python scripts/seed_data.py  # Creates sample users, courses
```

## Integration Test Automation

All scenarios above should be automated using pytest (backend) and Playwright/Cypress (frontend E2E). Each scenario becomes a test suite validating the complete user journey.

```python
# Example pytest integration test
def test_student_learning_journey(client, db_session):
    # Register
    response = client.post("/api/v1/auth/register", json={...})
    assert response.status_code == 201
    token = response.json()["access_token"]

    # Enroll
    response = client.post("/api/v1/enrollments",
        headers={"Authorization": f"Bearer {token}"},
        json={"course_id": course_id})
    assert response.status_code == 201

    # ... rest of scenario
```

These quickstart scenarios ensure all user stories are validated end-to-end before production deployment.
