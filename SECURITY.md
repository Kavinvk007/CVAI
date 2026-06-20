# CVAI Security Architecture

This document outlines the security mechanisms implemented in CVAI v2 to ensure production readiness.

## 1. Authentication & Authorization
- **JWT Architecture**: CVAI uses a dual-token system. Short-lived Access Tokens (15-60 minutes) are used for API requests, while long-lived Refresh Tokens (7 days) can be used to seamlessly obtain new Access Tokens without requiring re-login.
- **RBAC**: Role-Based Access Control is enforced on admin routes. Endpoints under `/api/v3/analytics` strictly require `is_admin = True`.
- **Password Security**: All user passwords are cryptographically hashed using `bcrypt` via `passlib`. Raw passwords are never logged or returned.

## 2. API Protection
- **Rate Limiting**: We use `slowapi` to prevent brute-force and DDoS attacks. 
  - Login/Register: 5 requests / minute
  - AI Analysis: 10 requests / minute
  - Uploads: 10 requests / minute
- **Input Validation**: All incoming JSON payloads are strongly typed and validated using `pydantic`. Missing or malformed data is rejected with an HTTP 422 Unprocessable Entity error.
- **CORS Configuration**: The FastAPI backend restricts Cross-Origin Resource Sharing based on environment variables, preventing unauthorized domains from interacting with the API.

## 3. Secure File Uploads
- **MIME Type & Extension Checks**: The `/resume/upload` endpoint strictly accepts `application/pdf`.
- **Path Traversal Protection**: Uploaded files are not saved directly using user-supplied names. The backend reads them directly into memory for text extraction or sanitizes the filename securely before transferring to AWS S3.

## 4. Infrastructure Security
- **Nginx Reverse Proxy**: Direct access to the internal `uvicorn` server is blocked. Nginx handles all public traffic, stripping unnecessary headers and acting as a secure gateway.
- **Secrets Management**: Sensitive credentials (API Keys, DB Passwords, JWT Secrets) are strictly isolated in `.env` files which are ignored by Git.

## 5. Audit Logging
- The `AnalyticsEvent` table acts as a lightweight audit log, recording critical events (like `UPLOAD_RESUME` or `EXPORT_CSV_USERS`) alongside user IDs and timestamps.
