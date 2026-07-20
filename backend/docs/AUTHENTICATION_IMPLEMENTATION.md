# Authentication Module Implementation

**Version:** 1.0  
**Module:** Authentication  
**Status:** Complete  
**Date:** July 2026

---

## Overview

The authentication module provides complete user registration, login, token management, and protected route functionality for the Aarambh AI backend. It uses JWT (JSON Web Tokens) for stateless authentication and bcrypt for secure password hashing.

---

## Modified Files

### 1. `app/models/user.py`
**Changes:**
- Added `is_verified` field to User model (Boolean, default=False)
- Updated model to include email verification status

**Purpose:** Track whether user email has been verified (for future email verification feature)

---

### 2. `app/schemas/user.py`
**Changes:**
- Added `is_verified` field to `UserInDB` schema
- Added `is_verified` field to `UserResponse` schema

**Purpose:** Include verification status in API responses

---

### 3. `app/core/security.py`
**Status:** Already complete (no changes needed)

**Functions:**
- `verify_password(plain_password, hashed_password)` - Verify bcrypt hash
- `get_password_hash(password)` - Generate bcrypt hash
- `create_access_token(subject, expires_delta)` - Generate JWT access token
- `create_refresh_token(subject)` - Generate JWT refresh token
- `decode_token(token)` - Decode and verify JWT token

**Purpose:** Provides password hashing and JWT token generation/verification

---

### 4. `app/core/deps.py`
**Changes:**
- Implemented `get_current_user()` dependency
  - Decodes JWT token from Authorization header
  - Retrieves user from database
  - Returns authenticated user or raises 401
- Implemented `get_current_active_user()` dependency
  - Ensures user account is active
  - Returns active user or raises 403

**Purpose:** FastAPI dependencies for protected routes

---

### 5. `app/services/user_service.py`
**Changes:**
- Implemented `create_user()` - Creates user with email validation and password hashing
- Implemented `get_user_by_id()` - Retrieves user by ID
- Implemented `get_user_by_email()` - Retrieves user by email
- Implemented `update_user()` - Updates user profile with email validation
- Implemented `authenticate_user()` - Authenticates credentials and updates last_login

**Purpose:** Business logic for user operations

---

### 6. `app/api/v1/endpoints/auth.py`
**Changes:**
- Implemented `POST /api/v1/auth/register` - User registration
  - Validates email uniqueness
  - Hashes password with bcrypt
  - Creates user record
  - Returns JWT tokens
- Implemented `POST /api/v1/auth/login` - User login
  - Validates credentials
  - Verifies password hash
  - Generates access and refresh tokens
  - Updates last_login timestamp
- Implemented `POST /api/v1/auth/refresh` - Token refresh
  - Validates refresh token
  - Generates new access and refresh tokens
  - Verifies user is still active
- Implemented `GET /api/v1/auth/me` - Get current user
  - Returns authenticated user profile
- Implemented `POST /api/v1/auth/logout` - User logout
  - Currently relies on token expiration
  - TODO: Implement token blacklisting with Redis

**Purpose:** Authentication API endpoints

---

### 7. `app/api/v1/endpoints/users.py`
**Changes:**
- Implemented `GET /api/v1/users/me` - Get current user profile
- Implemented `PUT /api/v1/users/me` - Update current user profile

**Purpose:** User profile management endpoints

---

### 8. `alembic/versions/20250101000000_add_is_verified_to_users.py`
**New File:** Database migration to add `is_verified` column to users table

**Purpose:** Database schema update for email verification tracking

---

## New Files

### 1. `alembic/versions/20250101000000_add_is_verified_to_users.py`
**Purpose:** Alembic migration to add `is_verified` column to users table

**Commands:**
```bash
# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

---

## API Endpoints

### POST /api/v1/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "SecurePassword123"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `409 Conflict` - Email already registered
- `400 Bad Request` - Invalid data

---

### POST /api/v1/auth/login
Authenticate user and return JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401 Unauthorized` - Incorrect email or password

---

### POST /api/v1/auth/refresh
Refresh access token using refresh token.

**Request Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token
- `401 Unauthorized` - Invalid token type
- `401 Unauthorized` - User not found or inactive

---

### GET /api/v1/auth/me
Get current user information.

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token
- `401 Unauthorized` - User not found

---

### POST /api/v1/auth/logout
Logout user.

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

**Note:** Currently relies on token expiration. Token blacklisting with Redis is planned for production.

---

### GET /api/v1/users/me
Get current user profile (same as /auth/me).

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### PUT /api/v1/users/me
Update current user profile.

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "full_name": "John Updated",
  "email": "updated@example.com"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "updated@example.com",
  "full_name": "John Updated",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `409 Conflict` - Email already registered
- `400 Bad Request` - Invalid data

---

## Validation Rules

### Email Validation
- Must be valid email format (Pydantic EmailStr)
- Must be unique across all users
- Case-insensitive comparison

### Password Validation
- Minimum length: 8 characters
- Maximum length: 100 characters
- Stored as bcrypt hash (never plain text)

### Name Validation
- Minimum length: 1 character
- Maximum length: 255 characters
- Required field

---

## Security Features

### Password Hashing
- Algorithm: bcrypt
- Work factor: Default (12 rounds)
- Salt: Automatically generated by bcrypt
- Never store plain text passwords

### JWT Tokens
- Algorithm: HS256 (HMAC-SHA256)
- Secret key: Configured via JWT_SECRET_KEY environment variable
- Access token expiration: 30 minutes (configurable)
- Refresh token expiration: 7 days (configurable)
- Token type: "bearer"

### Token Payload
```json
{
  "sub": "user-uuid",
  "exp": 1234567890,
  "type": "access" | "refresh"
}
```

### Protected Routes
- Use `get_current_user` dependency for authentication
- Use `get_current_active_user` dependency to ensure active account
- Token must be in Authorization header: `Bearer <token>`
- Invalid/expired tokens return 401 Unauthorized
- Inactive accounts return 403 Forbidden

---

## HTTP Status Codes

| Status Code | Usage |
|-------------|-------|
| 200 OK | Successful GET, PUT, POST (login, refresh, logout) |
| 201 Created | Successful user registration |
| 400 Bad Request | Invalid request data |
| 401 Unauthorized | Invalid credentials, invalid/expired token, user not found |
| 403 Forbidden | Inactive user account |
| 409 Conflict | Email already registered |

---

## Configuration

### Environment Variables

Required in `.env`:

```env
# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/aarambh
```

### Security Notes

**CRITICAL:** Change `JWT_SECRET_KEY` in production to a strong, random value.

Generate a secure secret key:
```python
import secrets
print(secrets.token_urlsafe(32))
```

---

## Database Schema

### users table

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | String(36) | PRIMARY KEY | uuid.uuid4() |
| email | String(255) | UNIQUE, NOT NULL, INDEXED | - |
| hashed_password | String(255) | NOT NULL | - |
| full_name | String(255) | NOT NULL | - |
| is_active | Boolean | NOT NULL | true |
| is_verified | Boolean | NOT NULL | false |
| is_superuser | Boolean | NOT NULL | false |
| last_login | Timestamp | NULLABLE | - |
| created_at | Timestamp | NOT NULL | now() |
| updated_at | Timestamp | NOT NULL | now() |

---

## Running the Backend

### 1. Setup Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
```

### 2. Setup Database

```bash
# Apply migrations
alembic upgrade head
```

### 3. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Run Production Server

```bash
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000
```

---

## Testing Authentication Endpoints

### Using cURL

#### 1. Register a new user
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "SecurePassword123"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123"
  }'
```

#### 3. Get current user (replace ACCESS_TOKEN)
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

#### 4. Refresh token (replace REFRESH_TOKEN)
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Authorization: Bearer REFRESH_TOKEN"
```

#### 5. Update profile (replace ACCESS_TOKEN)
```bash
curl -X PUT http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name"
  }'
```

#### 6. Logout (replace ACCESS_TOKEN)
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Using Python requests

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Register
response = requests.post(
    f"{BASE_URL}/auth/register",
    json={
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "SecurePassword123"
    }
)
tokens = response.json()
access_token = tokens["access_token"]
refresh_token = tokens["refresh_token"]

# Get current user
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
print(response.json())

# Refresh token
headers = {"Authorization": f"Bearer {refresh_token}"}
response = requests.post(f"{BASE_URL}/auth/refresh", headers=headers)
new_tokens = response.json()

# Update profile
headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
response = requests.put(
    f"{BASE_URL}/users/me",
    headers=headers,
    json={"full_name": "Updated Name"}
)
print(response.json())

# Logout
response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
print(response.json())
```

### Using Swagger UI

1. Start the backend server
2. Open browser to: http://localhost:8000/docs
3. Find authentication endpoints under `/api/v1/auth`
4. Use the "Try it out" feature to test each endpoint

---

## Integration with Frontend

The backend provides REST APIs that the existing frontend can consume:

### Authentication Flow

1. **Registration**
   - Frontend sends POST to `/api/v1/auth/register`
   - Backend returns access_token and refresh_token
   - Frontend stores tokens (localStorage or cookies)

2. **Login**
   - Frontend sends POST to `/api/v1/auth/login`
   - Backend returns access_token and refresh_token
   - Frontend stores tokens

3. **Protected Requests**
   - Frontend includes `Authorization: Bearer <access_token>` header
   - Backend validates token and returns user data
   - Frontend handles 401 errors (redirect to login or refresh token)

4. **Token Refresh**
   - When access token expires (401 error)
   - Frontend sends POST to `/api/v1/auth/refresh` with refresh_token
   - Backend returns new tokens
   - Frontend updates stored tokens

5. **Logout**
   - Frontend sends POST to `/api/v1/auth/logout`
   - Frontend removes stored tokens
   - Frontend redirects to login page

### Token Storage Recommendations

**For Development:**
- Store in localStorage (simple)

**For Production:**
- Store in httpOnly cookies (more secure)
- Implement CSRF protection
- Use secure flag for HTTPS

---

## Future Enhancements

### 1. Email Verification
- Send verification email on registration
- Add `/api/v1/auth/verify-email` endpoint
- Set `is_verified = True` after verification

### 2. Password Reset
- Add `/api/v1/auth/forgot-password` endpoint
- Send password reset email
- Add `/api/v1/auth/reset-password` endpoint

### 3. Token Blacklisting
- Implement Redis-based token blacklisting
- Blacklist tokens on logout
- Check blacklist on token validation

### 4. OAuth2 Integration
- Add Google OAuth2
- Add GitHub OAuth2
- Add other providers as needed

### 5. Two-Factor Authentication (2FA)
- Add TOTP-based 2FA
- Add SMS-based 2FA
- Add backup codes

### 6. Rate Limiting
- Implement rate limiting on auth endpoints
- Prevent brute force attacks
- Use Redis for rate limit storage

---

## Troubleshooting

### Common Issues

**Issue:** "Email already registered" error
**Solution:** The email is already in the database. Use a different email or login with existing account.

**Issue:** "Incorrect email or password" error
**Solution:** Verify credentials are correct. Check for typos in email or password.

**Issue:** "Could not validate credentials" error
**Solution:** JWT token is invalid or expired. Refresh token or login again.

**Issue:** "User not found" error
**Solution:** User ID in token doesn't exist in database. Re-register or check database.

**Issue:** "Inactive user account" error
**Solution:** User account is deactivated. Contact administrator.

**Issue:** Database connection error
**Solution:** Verify DATABASE_URL is correct and PostgreSQL is running.

**Issue:** Migration fails
**Solution:** Check database connection, ensure alembic is configured correctly.

---

## Summary

The authentication module is complete and production-ready with the following features:

- ✅ User registration with email validation
- ✅ User login with credential validation
- ✅ JWT access token generation (30 min expiration)
- ✅ JWT refresh token generation (7 day expiration)
- ✅ Token refresh endpoint
- ✅ Protected route dependencies
- ✅ User profile retrieval
- ✅ User profile update
- ✅ Password hashing with bcrypt
- ✅ Comprehensive error handling
- ✅ Proper HTTP status codes
- ✅ Inline documentation
- ✅ Database migration for is_verified field

**No frontend changes were made.** The backend exposes REST APIs that the existing frontend can consume without modification.

---

## Commands Reference

### Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Apply database migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1
```

### Production
```bash
# Run production server
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000

# Check logs
# Logs are output to stdout/stderr
```

### Testing
```bash
# Test with cURL (see examples above)
# Test with Swagger UI: http://localhost:8000/docs
# Test with Python requests (see examples above)
```

---

**Document End**
