# Mind Hub Learning Management System

A modern, scalable Learning Management System that enables educators to create and manage courses while providing students with an intuitive learning experience.

## Features

### Phase 1 (MVP - P1)
- **User Authentication**: Role-based access control (Student, Instructor, Admin)
- **Course Creation & Management**: Create courses, upload content (video/PDF), organize modules
- **Course Enrollment**: One-click enrollment with content access control

### Phase 2 (P2 Enhancements)
- **Progress Tracking**: Automatic completion tracking with percentage calculations
- **Quizzes & Assessments**: Multiple question types with immediate grading

### Phase 3 (P3 Advanced Features)
- **Discussion Forums**: Course discussions with threaded replies
- **Assignments**: File submission and instructor grading
- **Certificates**: Auto-generated certificates on course completion
- **Notifications**: In-app and email notifications
- **Search**: Course and content search functionality
- **User Profiles & Admin Dashboard**: Profile management and platform metrics

## Tech Stack

### Backend
- **Framework**: FastAPI 0.104+ (Python 3.11+)
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0+ with Alembic migrations
- **Task Queue**: Celery + Redis
- **Authentication**: JWT (python-jose) + bcrypt (passlib)

### Frontend
- **Framework**: React 18+ with TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Media Players**: video.js, react-pdf

### Infrastructure
- **Containerization**: Docker + docker-compose
- **Reverse Proxy**: Nginx
- **Storage**: Local filesystem (MVP) with path to cloud storage

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis
- Docker & Docker Compose (optional)

### Installation

#### Option 1: Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd mind-hub
```

2. Copy environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start services:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
docker-compose exec backend alembic upgrade head
```

5. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

#### Option 2: Local Development

**Backend Setup:**

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run migrations:
```bash
alembic upgrade head
```

5. Start development server:
```bash
uvicorn src.main:app --reload
```

**Frontend Setup:**

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Setup environment:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

### Running Tests

**Backend Tests:**
```bash
cd backend
pytest
pytest --cov=src --cov-report=html  # With coverage
```

**Frontend Tests:**
```bash
cd frontend
npm test
npm run test:coverage  # With coverage
```

## Project Structure

```
mind-hub/
├── backend/               # Python/FastAPI backend
│   ├── src/
│   │   ├── api/          # Route handlers
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── core/         # Configuration & utilities
│   │   └── tasks/        # Celery background tasks
│   └── tests/            # Backend tests
├── frontend/             # React/TypeScript frontend
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom hooks
│   │   ├── store/        # State management
│   │   └── types/        # TypeScript types
│   └── tests/            # Frontend tests
├── storage/              # File uploads (gitignored)
├── specs/                # Feature specifications
└── docker-compose.yml    # Docker services
```

## Development Workflow

This project follows a specification-driven development approach using SpecKit:

1. **Specification** (`/speckit.specify`): Define business requirements
2. **Planning** (`/speckit.plan`): Technical design and architecture
3. **Task Generation** (`/speckit.tasks`): Dependency-ordered task breakdown
4. **Implementation** (`/speckit.implement`): Execute tasks by phase

See `specs/001-build-a-modern/` for complete specifications and planning documents.

## Contributing

1. Follow the SpecKit workflow for new features
2. Write tests for all new functionality (80%+ coverage target)
3. Ensure linting passes: `ruff check`, `npm run lint`
4. Run tests before submitting PRs

## Architecture Principles

As defined in `.specify/memory/constitution.md`:

1. **User-Centric Design**: WCAG 2.1 Level AA compliance
2. **Data Integrity**: ACID transactions for critical operations
3. **Scalable Architecture**: Horizontal scaling support
4. **Security by Design**: JWT auth, bcrypt hashing, input validation
5. **Feature Isolation**: Independent, testable user stories
6. **Test Coverage**: Mandatory tests for critical paths
7. **Observability**: Structured logging with correlation IDs

## License

[License information]

## Support

For issues and questions, please refer to the documentation in `specs/` or open an issue.

## Accounts
  Instructor :
  - Email: instructor@example.com
  - Password: password123

  Admin :
  - Email: admin@example.com
  - Password: admin123