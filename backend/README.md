# Aarambh AI Backend

Production-ready FastAPI backend for the Aarambh AI adaptive learning platform.

## Tech Stack

- **Python:** 3.13+
- **Framework:** FastAPI 0.115+
- **Database:** PostgreSQL with SQLAlchemy 2.x
- **Migrations:** Alembic
- **Validation:** Pydantic v2
- **Authentication:** JWT with bcrypt
- **Caching:** Redis
- **Async:** Full async/await support

## Project Structure

```
backend/
├── alembic/                 # Database migrations
│   ├── versions/           # Migration files
│   └── env.py              # Alembic environment configuration
├── app/                    # Main application package
│   ├── api/                # API routers
│   │   ├── v1/             # API version 1
│   │   │   ├── endpoints/  # Route handlers
│   │   │   └── router.py  # API router aggregation
│   ├── core/               # Core application configuration
│   │   ├── config.py      # Settings and environment variables
│   │   ├── security.py    # JWT and password hashing utilities
│   │   └── deps.py        # FastAPI dependencies
│   ├── db/                 # Database layer
│   │   ├── base.py         # Base model and session management
│   │   ├── session.py      # Database session factory
│   │   └── init_db.py      # Database initialization
│   ├── models/             # SQLAlchemy ORM models
│   │   ├── user.py         # User model
│   │   ├── learner.py      # Learner profile model
│   │   ├── assessment.py   # Assessment-related models
│   │   └── question.py     # Question bank models
│   ├── schemas/            # Pydantic schemas for validation
│   │   ├── user.py         # User schemas
│   │   ├── learner.py      # Learner profile schemas
│   │   ├── assessment.py   # Assessment schemas
│   │   └── question.py     # Question schemas
│   ├── services/           # Business logic layer
│   │   ├── user_service.py # User business logic
│   │   ├── learner_service.py # Learner business logic
│   │   ├── assessment_service.py # Assessment business logic
│   │   └── question_service.py # Question bank business logic
│   ├── middleware/          # Custom middleware
│   │   ├── auth.py         # Authentication middleware
│   │   ├── cors.py         # CORS middleware
│   │   └── logging.py     # Logging middleware
│   ├── utils/              # Utility functions
│   │   ├── logger.py       # Logging configuration
│   │   ├── cache.py        # Redis cache utilities
│   │   └── helpers.py      # Helper functions
│   └── main.py             # FastAPI application entry point
├── tests/                  # Test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── conftest.py         # Pytest configuration
├── scripts/                # Utility scripts
│   ├── seed_db.py          # Database seeding script
│   └── init_alembic.py     # Alembic initialization script
├── pyproject.toml          # Project configuration
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure `.env` with your settings

## Database Setup

1. Initialize Alembic:
```bash
alembic init alembic
```

2. Create initial migration:
```bash
alembic revision --autogenerate -m "Initial migration"
```

3. Run migrations:
```bash
alembic upgrade head
```

## Running the Application

Development:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Production:
```bash
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

Run tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

## Code Quality

Format code:
```bash
black app/
```

Lint code:
```bash
ruff check app/
```

Type check:
```bash
mypy app/
```

## Architecture Principles

1. **Layered Architecture:** Clear separation between API, service, and data layers
2. **Dependency Injection:** FastAPI dependency system for loose coupling
3. **Async-First:** Full async/await support for high performance
4. **Type Safety:** Strict typing with Pydantic and mypy
5. **Configuration Management:** Environment-based configuration
6. **Database Migrations:** Version-controlled schema changes
7. **Testing:** Comprehensive test coverage
8. **Logging:** Structured logging for observability
9. **Security:** JWT authentication, bcrypt hashing, CORS
10. **Scalability:** Redis caching, connection pooling, async operations

## Future Enhancements

- AI integration endpoints
- Email notifications
- File storage (S3)
- WebSocket support for real-time features
- Rate limiting
- API versioning beyond v1
- GraphQL support
- Message queue (Celery/RQ)
