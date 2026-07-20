# Aarambh AI Backend Architecture Documentation

**Version:** 1.0  
**Document Type:** Architecture Documentation  
**Status:** Complete  
**Date:** July 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Folder Structure](#folder-structure)
3. [File-by-File Explanation](#file-by-file-explanation)
4. [Architecture Layers](#architecture-layers)
5. [Data Flow](#data-flow)
6. [Technology Stack](#technology-stack)
7. [Configuration](#configuration)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Development Workflow](#development-workflow)

---

## Project Overview

The Aarambh AI backend is a production-ready FastAPI application built with Python 3.13+. It provides a REST API for the adaptive learning platform, handling user authentication, learner profiling, adaptive assessments, and question bank management.

**Key Design Principles:**
- **Layered Architecture:** Clear separation between API, service, and data layers
- **Async-First:** Full async/await support for high performance
- **Type Safety:** Strict typing with Pydantic v2 and mypy
- **Modular Design:** Organized by feature for maintainability
- **Configuration Management:** Environment-based configuration
- **Database Migrations:** Version-controlled schema changes with Alembic
- **Security:** JWT authentication, bcrypt password hashing, CORS
- **Scalability:** Connection pooling, Redis caching, async operations

---

## Folder Structure

```
backend/
├── alembic/                      # Database migrations
│   ├── versions/                 # Migration files
│   ├── env.py                    # Alembic environment configuration
│   ├── script.py.mako            # Migration script template
│   └── README                    # Migration instructions
├── app/                          # Main application package
│   ├── api/                      # API layer
│   │   ├── v1/                   # API version 1
│   │   │   ├── endpoints/        # Route handlers
│   │   │   │   ├── health.py     # Health check endpoint
│   │   │   │   ├── auth.py       # Authentication endpoints
│   │   │   │   ├── users.py      # User management endpoints
│   │   │   │   ├── learners.py   # Learner profile endpoints
│   │   │   │   ├── assessments.py # Assessment endpoints
│   │   │   │   └── questions.py  # Question bank endpoints
│   │   │   └── router.py         # API router aggregation
│   ├── core/                     # Core configuration
│   │   ├── config.py             # Settings and environment variables
│   │   ├── security.py           # JWT and password hashing utilities
│   │   └── deps.py               # FastAPI dependencies
│   ├── db/                       # Database layer
│   │   ├── base.py               # Base model and timestamp mixin
│   │   ├── session.py            # Database session factory
│   │   └── init_db.py            # Database initialization script
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── user.py               # User model
│   │   ├── learner.py            # Learner profile model
│   │   ├── assessment.py         # Assessment-related models
│   │   └── question.py           # Question bank model
│   ├── schemas/                  # Pydantic schemas
│   │   ├── user.py               # User request/response schemas
│   │   ├── learner.py            # Learner profile schemas
│   │   ├── assessment.py         # Assessment schemas
│   │   └── question.py           # Question schemas
│   ├── services/                 # Business logic layer
│   │   ├── user_service.py       # User business logic
│   │   ├── learner_service.py    # Learner business logic
│   │   ├── assessment_service.py # Assessment business logic
│   │   └── question_service.py   # Question bank business logic
│   ├── middleware/               # Custom middleware
│   │   ├── auth.py               # Authentication middleware
│   │   ├── cors.py               # CORS configuration
│   │   └── logging.py            # Logging middleware
│   ├── utils/                    # Utility functions
│   │   ├── logger.py             # Logging configuration
│   │   ├── cache.py              # Redis cache utilities
│   │   └── helpers.py            # Helper functions
│   └── main.py                   # FastAPI application entry point
├── tests/                        # Test suite (to be created)
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── conftest.py               # Pytest configuration
├── scripts/                      # Utility scripts (to be created)
│   ├── seed_db.py                # Database seeding script
│   └── init_alembic.py           # Alembic initialization script
├── pyproject.toml                # Project configuration
├── requirements.txt               # Python dependencies
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── alembic.ini                   # Alembic configuration
└── README.md                     # Project documentation
```

---

## File-by-File Explanation

### Root Configuration Files

#### `pyproject.toml`
**Purpose:** Modern Python project configuration using PEP 621.

**Contains:**
- Project metadata (name, version, description)
- Python version requirement (3.13+)
- Core dependencies (FastAPI, SQLAlchemy, Pydantic, etc.)
- Development dependencies (pytest, black, ruff, mypy)
- Tool configurations (black, ruff, mypy)

**Why:** Replaces `setup.py` and provides a modern, standard way to configure Python projects.

---

#### `requirements.txt`
**Purpose:** Pinned dependency versions for reproducible installs.

**Contains:**
- Exact versions of all dependencies
- Separates core and development dependencies

**Why:** Ensures consistent environments across development and production.

---

#### `.env.example`
**Purpose:** Template for environment variables.

**Contains:**
- Application settings (APP_NAME, APP_ENV, APP_DEBUG)
- Server configuration (HOST, PORT, WORKERS)
- Database connection (DATABASE_URL, pool settings)
- Redis configuration (REDIS_URL, cache TTL)
- JWT settings (SECRET_KEY, ALGORITHM, expiration)
- CORS configuration (origins, methods, headers)
- Logging configuration (LOG_LEVEL, LOG_FORMAT)
- Future API keys (OpenAI, Anthropic, AWS, SMTP)

**Why:** Documents required environment variables without exposing sensitive data.

---

#### `.gitignore`
**Purpose:** Specifies files to exclude from Git version control.

**Contains:**
- Python cache files (__pycache__, *.pyc)
- Virtual environments (venv/, env/)
- Environment files (.env)
- IDE files (.vscode/, .idea/)
- Database files (*.db, *.sqlite)
- Test files (.pytest_cache/, .coverage)
- Logs (logs/, *.log)
- OS files (DS_Store, Thumbs.db)

**Why:** Prevents committing sensitive data, generated files, and environment-specific artifacts.

---

#### `README.md`
**Purpose:** Project documentation and quick start guide.

**Contains:**
- Tech stack overview
- Installation instructions
- Database setup
- Running the application
- API documentation links
- Testing instructions
- Code quality tools
- Architecture principles
- Future enhancements

**Why:** Provides essential information for developers to get started with the project.

---

#### `alembic.ini`
**Purpose:** Alembic database migration configuration.

**Contains:**
- Migration script location
- Database connection URL
- Migration file naming template
- Logging configuration

**Why:** Configures Alembic for database schema version control.

---

### Application Package (`app/`)

#### `app/__init__.py`
**Purpose:** Marks `app/` as a Python package.

**Why:** Allows importing from the app package.

---

#### `app/main.py`
**Purpose:** FastAPI application entry point.

**Contains:**
- Application lifespan manager (startup/shutdown)
- CORS middleware configuration
- Custom middleware registration
- API router inclusion
- Root and health check endpoints
- Uvicorn server configuration

**Why:** Initializes and configures the FastAPI application with all necessary components.

---

### Core Configuration (`app/core/`)

#### `app/core/__init__.py`
**Purpose:** Marks `core/` as a Python package.

**Why:** Allows importing from the core package.

---

#### `app/core/config.py`
**Purpose:** Application configuration using Pydantic Settings.

**Contains:**
- `Settings` class with all configuration fields
- Environment variable loading from `.env`
- Field validation (email URLs, CORS origins parsing)
- Cached settings instance with `lru_cache`

**Configuration Sections:**
- Application metadata
- Server settings
- Database connection
- Redis cache
- JWT authentication
- CORS policy
- Logging
- AI integration (future)
- Email (future)
- File storage (future)

**Why:** Centralized, type-safe configuration management with validation.

---

#### `app/core/security.py`
**Purpose:** Security utilities for authentication and password hashing.

**Contains:**
- `verify_password()`: Verify plain password against hash
- `get_password_hash()`: Hash password using bcrypt
- `create_access_token()`: Generate JWT access token
- `create_refresh_token()`: Generate JWT refresh token
- `decode_token()`: Decode and verify JWT token

**Why:** Provides reusable security functions for authentication flows.

---

#### `app/core/deps.py`
**Purpose:** FastAPI dependency injection for common functionality.

**Contains:**
- `get_db()`: Database session dependency
- `get_current_user()`: Authenticated user dependency
- `get_current_active_user()`: Active user dependency
- HTTP Bearer token scheme

**Why:** Reusable dependencies for authentication and database access across endpoints.

---

### Database Layer (`app/db/`)

#### `app/db/__init__.py`
**Purpose:** Marks `db/` as a Python package.

**Why:** Allows importing from the database package.

---

#### `app/db/base.py`
**Purpose:** Base SQLAlchemy model and timestamp mixin.

**Contains:**
- `Base`: Declarative base for all models
- `TimestampMixin`: Mixin for created_at and updated_at fields

**Why:** Provides common model functionality and automatic timestamp management.

---

#### `app/db/session.py`
**Purpose:** Database session management with connection pooling.

**Contains:**
- Async engine creation with connection pooling
- Async session factory configuration
- `get_db_session()`: Generator for database sessions
- `init_db()`: Database initialization function

**Why:** Manages database connections and sessions with proper pooling and cleanup.

---

#### `app/db/init_db.py`
**Purpose:** Database initialization script.

**Contains:**
- Async function to create all tables
- Imports all models to ensure registration

**Why:** Provides a quick way to initialize the database (use Alembic in production).

---

### ORM Models (`app/models/`)

#### `app/models/__init__.py`
**Purpose:** Exports all models for easy importing.

**Why:** Simplifies importing models from other modules.

---

#### `app/models/user.py`
**Purpose:** User model for authentication and account management.

**Contains:**
- `User` model with fields:
  - `id`: UUID primary key
  - `email`: Unique email
  - `hashed_password`: Bcrypt hash
  - `full_name`: User's full name
  - `is_active`: Account status
  - `is_superuser`: Admin flag
  - `last_login`: Last login timestamp
- Relationship to `LearnerProfile`

**Why:** Stores user authentication credentials and basic account information.

---

#### `app/models/learner.py`
**Purpose:** Learner profile model for storing onboarding data.

**Contains:**
- `LearnerProfile` model with fields:
  - `id`: UUID primary key
  - `user_id`: Foreign key to User
  - `name`: Learner's name
  - `age_group`: Age category
  - `educational_background`: Education level
  - `current_role`: Current occupation
  - `learning_goal`: Primary learning objective
  - `learning_language`: Preferred language
  - `current_familiarity`: Topic familiarity level
  - `digital_comfort`: Digital literacy level
- Relationship to `User`

**Why:** Stores comprehensive learner profile data for personalized learning paths.

---

#### `app/models/assessment.py`
**Purpose:** Assessment-related models for adaptive testing.

**Contains:**
- `AssessmentBlueprint`: Assessment structure and parameters
- `AssessmentSession`: Individual assessment attempts
- `QuestionResponse`: Learner responses to questions
- `AssessmentResult`: Final assessment results and learning paths

**AssessmentBlueprint fields:**
- `learning_goal`: Target learning goal
- `question_count`: Total questions
- `min_difficulty`/`max_difficulty`: Difficulty range
- `estimated_duration_minutes`: Expected time
- `domains`/`skills`/`question_distribution`: JSON fields

**AssessmentSession fields:**
- `learner_id`: Foreign key to User
- `blueprint_id`: Foreign key to Blueprint
- `status`: in_progress/completed/abandoned
- `current_question_index`: Progress tracking
- `current_difficulty`: Adaptive difficulty
- `start_time`/`end_time`: Session timing

**QuestionResponse fields:**
- `session_id`: Foreign key to Session
- `question_id`: Question identifier
- `selected_answer`: Learner's answer (JSON)
- `is_correct`: Answer correctness
- `response_time_seconds`: Time taken
- `difficulty_at_response`: Difficulty when answered

**AssessmentResult fields:**
- `session_id`: Foreign key to Session
- `learner_id`: Foreign key to User
- `overall_proficiency`: Proficiency level
- `confidence_score`: Assessment confidence
- `readiness_level`: Learning readiness
- `skill_proficiencies`/`strengths`/`weaknesses`/`learning_path`: JSON fields

**Why:** Stores complete assessment data for adaptive testing and result generation.

---

#### `app/models/question.py`
**Purpose:** Question bank model for storing assessment questions.

**Contains:**
- `Question` model with fields:
  - `id`: UUID primary key
  - `learning_goal`: Associated learning goal
  - `domain`: Knowledge domain
  - `skill`: Specific skill
  - `difficulty`: 1-5 difficulty level
  - `question_type`: MCQ, true_false, etc.
  - `language`: Question language
  - `question_content`/`options`/`correct_answer`: JSON fields
  - `discrimination_index`/`difficulty_parameter`/`guessing_parameter`: IRT parameters
  - `is_active`: Active status
  - `tags`: Question tags (JSON)

**Why:** Stores questions with metadata for adaptive selection and IRT-based calibration.

---

### Pydantic Schemas (`app/schemas/`)

#### `app/schemas/__init__.py`
**Purpose:** Marks `schemas/` as a Python package.

**Why:** Allows importing from the schemas package.

---

#### `app/schemas/user.py`
**Purpose:** Request/response schemas for user operations.

**Contains:**
- `UserBase`: Common user fields
- `UserCreate`: Registration schema with password
- `UserUpdate`: Profile update schema
- `UserInDB`: Database user model schema
- `UserResponse`: Public user response (no password)
- `Token`: JWT token response
- `TokenPayload`: JWT token payload
- `LoginRequest`: Login credentials

**Why:** Provides validation and serialization for user-related API operations.

---

#### `app/schemas/learner.py`
**Purpose:** Request/response schemas for learner profile operations.

**Contains:**
- `LearnerProfileBase`: Common profile fields
- `LearnerProfileCreate`: Profile creation schema
- `LearnerProfileUpdate`: Profile update schema
- `LearnerProfileInDB`: Database profile schema
- `LearnerProfileResponse`: Public profile response

**Why:** Provides validation and serialization for learner profile operations.

---

#### `app/schemas/assessment.py`
**Purpose:** Request/response schemas for assessment operations.

**Contains:**
- `AssessmentBlueprintBase`/`Create`/`Response`: Blueprint schemas
- `AssessmentSessionBase`/`Create`/`Response`: Session schemas
- `QuestionResponseCreate`/`Response`: Response schemas
- `AssessmentResultBase`/`Response`: Result schemas

**Why:** Provides validation and serialization for assessment operations.

---

#### `app/schemas/question.py`
**Purpose:** Request/response schemas for question bank operations.

**Contains:**
- `QuestionBase`/`Create`/`Update`/`Response`: Question schemas
- `QuestionForAssessment`: Question without correct answer

**Why:** Provides validation and serialization for question bank operations.

---

### API Layer (`app/api/`)

#### `app/api/__init__.py`
**Purpose:** Marks `api/` as a Python package.

**Why:** Allows importing from the API package.

---

#### `app/api/v1/__init__.py`
**Purpose:** Marks `v1/` as a Python package.

**Why:** Allows importing from the v1 API package.

---

#### `app/api/v1/router.py`
**Purpose:** Aggregates all API v1 routers.

**Contains:**
- Includes health, auth, users, learners, assessments, questions routers
- Organizes by prefix and tags

**Why:** Centralizes all v1 endpoints for easy version management.

---

#### `app/api/v1/endpoints/__init__.py`
**Purpose:** Marks `endpoints/` as a Python package.

**Why:** Allows importing from the endpoints package.

---

#### `app/api/v1/endpoints/health.py`
**Purpose:** Health check endpoint for monitoring.

**Contains:**
- `GET /api/v1/health/`: Returns application status and metadata

**Why:** Provides a simple endpoint for load balancers and monitoring systems.

---

#### `app/api/v1/endpoints/auth.py`
**Purpose:** Authentication endpoints.

**Contains:**
- `POST /api/v1/auth/register`: User registration (not implemented)
- `POST /api/v1/auth/login`: User login (not implemented)
- `POST /api/v1/auth/refresh`: Token refresh (not implemented)
- `POST /api/v1/auth/logout`: User logout (not implemented)

**Why:** Handles user authentication and token management.

---

#### `app/api/v1/endpoints/users.py`
**Purpose:** User management endpoints.

**Contains:**
- `GET /api/v1/users/me`: Get current user profile (not implemented)
- `PUT /api/v1/users/me`: Update current user profile (not implemented)

**Why:** Allows users to manage their profiles.

---

#### `app/api/v1/endpoints/learners.py`
**Purpose:** Learner profile endpoints.

**Contains:**
- `POST /api/v1/learners/`: Create learner profile (not implemented)
- `GET /api/v1/learners/me`: Get learner profile (not implemented)
- `PUT /api/v1/learners/me`: Update learner profile (not implemented)

**Why:** Manages learner profile data collected during onboarding.

---

#### `app/api/v1/endpoints/assessments.py`
**Purpose:** Assessment endpoints.

**Contains:**
- `POST /api/v1/assessments/blueprints`: Generate blueprint (not implemented)
- `POST /api/v1/assessments/sessions`: Start assessment (not implemented)
- `GET /api/v1/assessments/sessions/{id}/next-question`: Get next question (not implemented)
- `POST /api/v1/assessments/sessions/{id}/responses`: Submit response (not implemented)
- `POST /api/v1/assessments/sessions/{id}/complete`: Complete assessment (not implemented)
- `GET /api/v1/assessments/sessions/{id}/result`: Get result (not implemented)
- `GET /api/v1/assessments/history`: Get assessment history (not implemented)

**Why:** Handles the complete adaptive assessment flow.

---

#### `app/api/v1/endpoints/questions.py`
**Purpose:** Question bank management endpoints.

**Contains:**
- `POST /api/v1/questions/`: Create question (not implemented)
- `GET /api/v1/questions/`: List questions with filters (not implemented)
- `GET /api/v1/questions/{id}`: Get question (not implemented)
- `PUT /api/v1/questions/{id}`: Update question (not implemented)
- `DELETE /api/v1/questions/{id}`: Delete question (not implemented)

**Why:** Manages the question bank for assessments.

---

### Service Layer (`app/services/`)

#### `app/services/__init__.py`
**Purpose:** Marks `services/` as a Python package.

**Why:** Allows importing from the services package.

---

#### `app/services/user_service.py`
**Purpose:** User business logic.

**Contains:**
- `UserService` class with methods:
  - `create_user()`: Create new user
  - `get_user_by_id()`: Get user by ID
  - `get_user_by_email()`: Get user by email
  - `update_user()`: Update user profile
  - `authenticate_user()`: Authenticate credentials

**Why:** Encapsulates user-related business logic separate from API layer.

---

#### `app/services/learner_service.py`
**Purpose:** Learner profile business logic.

**Contains:**
- `LearnerService` class with methods:
  - `create_learner_profile()`: Create profile
  - `get_learner_profile_by_user_id()`: Get profile by user
  - `update_learner_profile()`: Update profile
  - `analyze_profile()`: Analyze for blueprint generation

**Why:** Encapsulates learner profile business logic.

---

#### `app/services/assessment_service.py`
**Purpose:** Assessment business logic.

**Contains:**
- `AssessmentService` class with methods:
  - `generate_blueprint()`: Generate assessment blueprint
  - `create_session()`: Create assessment session
  - `get_next_question()`: Adaptive question selection
  - `submit_response()`: Record and evaluate response
  - `complete_assessment()`: Generate results
  - `get_assessment_result()`: Retrieve results
  - `get_assessment_history()`: Get user history

**Why:** Encapsulates complex assessment algorithms and business logic.

---

#### `app/services/question_service.py`
**Purpose:** Question bank business logic.

**Contains:**
- `QuestionService` class with methods:
  - `create_question()`: Create question
  - `get_question_by_id()`: Get question
  - `list_questions()`: List with filters
  - `update_question()`: Update question
  - `delete_question()`: Soft delete
  - `select_questions_for_assessment()`: Adaptive selection

**Why:** Encapsulates question bank management and adaptive selection logic.

---

### Middleware (`app/middleware/`)

#### `app/middleware/__init__.py`
**Purpose:** Marks `middleware/` as a Python package.

**Why:** Allows importing from the middleware package.

---

#### `app/middleware/auth.py`
**Purpose**: Authentication middleware.

**Contains:**
- `AuthMiddleware`: Validates JWT tokens for protected routes

**Why:** Provides global authentication for protected endpoints.

---

#### `app/middleware/cors.py`
**Purpose**: CORS configuration helper.

**Contains:**
- `get_cors_middleware()`: Returns configured CORS middleware

**Why:** Centralizes CORS configuration for reuse.

---

#### `app/middleware/logging.py`
**Purpose**: Request/response logging middleware.

**Contains:**
- `LoggingMiddleware`: Logs requests with timing and request IDs

**Why:** Provides structured logging for observability and debugging.

---

### Utilities (`app/utils/`)

#### `app/utils/__init__.py`
**Purpose**: Marks `utils/` as a Python package.

**Why:** Allows importing from the utils package.

---

#### `app/utils/logger.py`
**Purpose**: Logging configuration.

**Contains:**
- `setup_logging()`: Configure application logging
- `get_logger()`: Get logger instance

**Why:** Centralizes logging configuration.

---

#### `app/utils/cache.py`
**Purpose**: Redis cache utilities.

**Contains:**
- `CacheService` class with methods:
  - `get()`: Get cached value
  - `set()`: Set cached value
  - `delete()`: Delete cached value
  - `exists()`: Check if key exists

**Why:** Provides caching interface for performance optimization.

---

#### `app/utils/helpers.py`
**Purpose**: Common helper functions.

**Contains:**
- `get_current_utc_time()`: Get current UTC time
- `generate_uuid()`: Generate UUID
- `sanitize_string()`: Sanitize and truncate strings
- `validate_email()`: Validate email format

**Why:** Provides reusable utility functions.

---

### Database Migrations (`alembic/`)

#### `alembic/__init__.py`
**Purpose**: Marks `alembic/` as a Python package.

**Why:** Allows importing from the alembic package.

---

#### `alembic/versions/__init__.py`
**Purpose**: Marks `versions/` as a Python package.

**Why**: Allows importing from the versions package.

---

#### `alembic/env.py`
**Purpose**: Alembic environment configuration.

**Contains:**
- Database URL configuration
- Model metadata import
- Online/offline migration modes
- Connection management

**Why**: Configures Alembic to work with the application models.

---

#### `alembic/script.py.mako`
**Purpose**: Migration script template.

**Contains:**
- Template for generating new migration files
- Standard upgrade/downgrade structure

**Why**: Provides consistent structure for all migration files.

---

#### `alembic/README`
**Purpose**: Migration instructions.

**Contains:**
- Commands for creating, applying, rolling back migrations
- Best practices for migration management

**Why**: Documents migration workflow for developers.

---

## Architecture Layers

### 1. API Layer (`app/api/`)
**Responsibility:** Handle HTTP requests and responses

**Components:**
- Route handlers (endpoints)
- Request validation (Pydantic schemas)
- Response serialization
- Dependency injection

**Flow:**
1. Receive HTTP request
2. Validate request with Pydantic schemas
3. Call service layer
4. Serialize response with Pydantic schemas
5. Return HTTP response

---

### 2. Service Layer (`app/services/`)
**Responsibility:** Business logic and orchestration

**Components:**
- Service classes for each domain
- Business rule implementation
- Transaction management
- External service integration

**Flow:**
1. Receive validated data from API layer
2. Apply business rules
3. Coordinate database operations
4. Return results to API layer

---

### 3. Data Layer (`app/db/`, `app/models/`)
**Responsibility:** Data persistence and retrieval

**Components:**
- SQLAlchemy ORM models
- Database session management
- Query construction
- Connection pooling

**Flow:**
1. Receive data operations from service layer
2. Execute database queries
3. Return results to service layer

---

### 4. Core Layer (`app/core/`)
**Responsibility:** Cross-cutting concerns

**Components:**
- Configuration management
- Security utilities
- Dependency injection
- Common functionality

**Flow:**
- Provides utilities to all layers
- No direct data flow

---

### 5. Middleware Layer (`app/middleware/`)
**Responsibility:** Request/response processing

**Components:**
- Authentication
- CORS
- Logging
- Custom processing

**Flow:**
1. Intercept incoming requests
2. Process (authenticate, log, etc.)
3. Pass to API layer
4. Intercept outgoing responses
5. Process (add headers, log, etc.)

---

### 6. Utility Layer (`app/utils/`)
**Responsibility:** Helper functions

**Components:**
- Logging
- Caching
- Common helpers

**Flow:**
- Provides utilities to all layers
- No direct data flow

---

## Data Flow

### Request Flow Example: User Login

```
1. HTTP POST /api/v1/auth/login
   ↓
2. CORS Middleware
   ↓
3. Logging Middleware (assign request ID, start timer)
   ↓
4. Auth Middleware (skip for login endpoint)
   ↓
5. API Layer (auth.py)
   - Validate request with LoginRequest schema
   ↓
6. Service Layer (user_service.py)
   - authenticate_user()
   ↓
7. Data Layer (session.py)
   - Query database for user
   ↓
8. Service Layer
   - Verify password hash
   - Generate JWT tokens
   ↓
9. API Layer
   - Serialize response with Token schema
   ↓
10. Logging Middleware (log response time)
    ↓
11. CORS Middleware
    ↓
12. HTTP Response with tokens
```

---

### Assessment Flow Example

```
1. HTTP POST /api/v1/assessments/blueprints
   ↓
2. Middleware chain
   ↓
3. API Layer (assessments.py)
   - Validate request with AssessmentBlueprintCreate
   - Get current user from dependency
   ↓
4. Service Layer (assessment_service.py)
   - generate_blueprint()
   - Call learner_service.analyze_profile()
   - Select domains and skills
   - Calculate question distribution
   ↓
5. Data Layer
   - Create blueprint record
   ↓
6. Service Layer
   - Return blueprint
   ↓
7. API Layer
   - Serialize with AssessmentBlueprintResponse
   ↓
8. HTTP Response with blueprint
```

---

## Technology Stack

### Core Framework
- **Python 3.13+**: Modern Python with latest features
- **FastAPI 0.115+**: Modern, fast web framework
- **Uvicorn**: ASGI server for production

### Database
- **PostgreSQL**: Production-grade relational database
- **SQLAlchemy 2.x**: Python SQL toolkit and ORM
- **Alembic**: Database migration tool
- **psycopg**: PostgreSQL adapter for Python

### Validation
- **Pydantic v2**: Data validation using Python type hints
- **pydantic-settings**: Environment-based configuration

### Authentication
- **python-jose**: JWT token creation and verification
- **passlib**: Password hashing with bcrypt
- **python-multipart**: Form data handling

### Utilities
- **python-dotenv**: Environment variable management
- **httpx**: Async HTTP client
- **redis**: Caching and session storage

### Development
- **pytest**: Testing framework
- **pytest-asyncio**: Async test support
- **pytest-cov**: Code coverage
- **black**: Code formatting
- **ruff**: Fast Python linter
- **mypy**: Static type checking
- **pre-commit**: Git hooks

---

## Configuration

### Environment Variables

**Required for Development:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: Secret for JWT signing

**Optional for Development:**
- `REDIS_URL`: Redis connection (defaults to localhost)
- `CORS_ORIGINS`: Allowed CORS origins

**Required for Production:**
- All development variables
- Strong `JWT_SECRET_KEY`
- Production `DATABASE_URL`
- Production `REDIS_URL`

**Future Integrations:**
- `OPENAI_API_KEY`: AI model access
- `ANTHROPIC_API_KEY`: AI model access
- `AWS_*`: File storage
- `SMTP_*`: Email sending

---

## Database Schema

### Tables

**users**
- Stores user authentication credentials
- One-to-one relationship with learner_profiles

**learner_profiles**
- Stores learner onboarding data
- Many-to-one relationship with users

**assessment_blueprints**
- Stores assessment structure and parameters
- One-to-many relationship with assessment_sessions

**assessment_sessions**
- Stores individual assessment attempts
- Many-to-one relationship with users and blueprints
- One-to-many relationship with question_responses
- One-to-one relationship with assessment_results

**question_responses**
- Stores learner responses to questions
- Many-to-one relationship with assessment_sessions

**assessment_results**
- Stores final assessment results
- Many-to-one relationship with users and sessions

**questions**
- Stores question bank with metadata
- Indexed by learning_goal, domain, skill, difficulty

---

## API Endpoints

### Health
- `GET /api/v1/health/` - Health check

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user

### Learners
- `POST /api/v1/learners/` - Create learner profile
- `GET /api/v1/learners/me` - Get learner profile
- `PUT /api/v1/learners/me` - Update learner profile

### Assessments
- `POST /api/v1/assessments/blueprints` - Generate blueprint
- `POST /api/v1/assessments/sessions` - Start assessment
- `GET /api/v1/assessments/sessions/{id}/next-question` - Get next question
- `POST /api/v1/assessments/sessions/{id}/responses` - Submit response
- `POST /api/v1/assessments/sessions/{id}/complete` - Complete assessment
- `GET /api/v1/assessments/sessions/{id}/result` - Get result
- `GET /api/v1/assessments/history` - Get history

### Questions
- `POST /api/v1/questions/` - Create question
- `GET /api/v1/questions/` - List questions
- `GET /api/v1/questions/{id}` - Get question
- `PUT /api/v1/questions/{id}` - Update question
- `DELETE /api/v1/questions/{id}` - Delete question

---

## Development Workflow

### Initial Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Initialize database**
   ```bash
   alembic upgrade head
   ```

6. **Run application**
   ```bash
   uvicorn app.main:app --reload
   ```

### Making Changes

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes to models**
   - Update model in `app/models/`
   - Create migration: `alembic revision --autogenerate -m "description"`
   - Review migration file
   - Apply migration: `alembic upgrade head`

3. **Update schemas**
   - Update corresponding schema in `app/schemas/`

4. **Implement service logic**
   - Add/modify service in `app/services/`

5. **Add/update endpoints**
   - Add/modify endpoint in `app/api/v1/endpoints/`

6. **Test changes**
   ```bash
   pytest
   ```

7. **Format and lint**
   ```bash
   black app/
   ruff check app/
   mypy app/
   ```

8. **Commit and push**
   ```bash
   git add .
   git commit -m "Description"
   git push origin feature/your-feature
   ```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_user_service.py

# Run with verbose output
pytest -v
```

---

## Next Steps

### Immediate (Business Logic Implementation)

1. **Implement authentication endpoints**
   - User registration with password hashing
   - Login with JWT token generation
   - Token refresh and logout

2. **Implement learner profile endpoints**
   - Profile creation and retrieval
   - Profile analysis for blueprint generation

3. **Implement assessment endpoints**
   - Blueprint generation algorithm
   - Adaptive question selection
   - Response evaluation
   - Result generation

4. **Implement question bank endpoints**
   - CRUD operations for questions
   - Filtering and search
   - Adaptive selection integration

### Future Enhancements

1. **AI Integration**
   - OpenAI/Anthropic API integration
   - AI-powered question generation
   - AI-powered learning path optimization

2. **Email Notifications**
   - SMTP configuration
   - Email templates
   - Notification triggers

3. **File Storage**
   - S3 integration
   - Image upload for questions
   - File management

4. **WebSocket Support**
   - Real-time assessment updates
   - Live progress tracking

5. **Rate Limiting**
   - API rate limiting
   - DDoS protection

6. **API Versioning**
   - v2 endpoints
   - Version deprecation strategy

7. **GraphQL Support**
   - GraphQL endpoint
   - Schema generation

8. **Message Queue**
   - Celery/RQ integration
   - Background task processing

---

**Document End**
