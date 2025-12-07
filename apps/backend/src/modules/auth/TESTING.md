# Firebase Authentication - Manual Testing Guide

This guide provides step-by-step instructions for testing the Firebase Authentication API endpoints using **Postman**.

## Prerequisites

1. **Backend server running**: `npm run dev` in `apps/backend`
2. **Postman installed**: Download from [postman.com](https://www.postman.com/downloads/)
3. **Firebase setup complete**: Environment variables configured (see `FIREBASE_SETUP.md`)

## Base URL

```
http://localhost:3000
```

---

## Test Flow Overview

```mermaid
graph LR
    A[1. Register] --> B[2. Login]
    B --> C[3. Get Profile]
    D[4. Forgot Password] -.optional.-> B
```

---

## 1. Register New User

**Creates a new user in Firebase Auth and syncs to database.**

### Request

```http
POST /api/auth/register
Content-Type: application/json
```

### Body (JSON)

```json
{
  "email": "test@example.com",
  "password": "Test123!@#",
  "name": "Test User"
}
```

### Expected Response (201 Created)

```json
{
  "message": "User registered successfully"
}
```

### Test Cases

| Test Case | Email | Password | Expected Result |
|-----------|-------|----------|-----------------|
| ✅ Valid registration | `user1@test.com` | `SecurePass123!` | 201 Created |
| ❌ Duplicate email | `user1@test.com` | `AnyPass123!` | 409 Conflict |
| ❌ Invalid email | `notanemail` | `Pass123!` | 400 Bad Request |
| ❌ Weak password | `test@test.com` | `123` | 400 Bad Request |
| ❌ Missing name | `test@test.com`, no name | `Pass123!` | 201 (name optional) |

### Validation Rules

- **Email**: Must be valid email format
- **Password**: Min 6 characters (Firebase requirement)
- **Name**: Optional

### Common Errors

```json
// 409 - Email already exists
{
  "statusCode": 409,
  "message": "Email already registered"
}

// 400 - Validation error
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

---

## 2. Login

**Login requires getting Firebase ID token first, then sending to backend.**

> [!IMPORTANT]
> **Login is a 2-step process:**
> 1. Get Firebase ID token (using Firebase Client SDK or REST API)
> 2. Send token to backend `/api/auth/login`

### Option A: Using Firebase REST API (Recommended for Testing)

#### Step 1: Get Firebase ID Token

```http
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_FIREBASE_API_KEY
Content-Type: application/json
```

**Body:**
```json
{
  "email": "test@example.com",
  "password": "Test123!@#",
  "returnSecureToken": true
}
```

**Response:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "email": "test@example.com",
  "refreshToken": "...",
  "expiresIn": "3600",
  "localId": "..."
}
```

> 📝 **Where to find Firebase API Key:**
> Firebase Console → Project Settings → General → Web API Key

#### Step 2: Login to Backend

```http
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "firebaseUid": "abc123...",
    "email": "test@example.com",
    "name": "Test User",
    "emailVerified": false,
    "photoURL": null
  }
}
```

### Option B: Using Postman Pre-request Script (Advanced)

Create a Postman environment variable `FIREBASE_API_KEY` and use this pre-request script:

```javascript
// Pre-request Script for Login endpoint
const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${pm.environment.get('FIREBASE_API_KEY')}`;

pm.sendRequest({
    url: loginUrl,
    method: 'POST',
    header: 'Content-Type: application/json',
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            email: pm.variables.get('test_email'),
            password: pm.variables.get('test_password'),
            returnSecureToken: true
        })
    }
}, (err, response) => {
    if (err) {
        console.error(err);
    } else {
        const idToken = response.json().idToken;
        pm.environment.set('firebase_id_token', idToken);
    }
});
```

Then in the request body, use:
```json
{
  "idToken": "{{firebase_id_token}}"
}
```

### Test Cases

| Test Case | ID Token | Expected Result |
|-----------|----------|-----------------|
| ✅ Valid token | Fresh token from Firebase | 200 OK |
| ❌ Invalid token | `invalid_token_string` | 401 Unauthorized |
| ❌ Expired token | Token older than 1 hour | 401 Unauthorized |
| ❌ Missing token | Empty string | 400 Bad Request |

---

## 3. Get User Profile

**Protected endpoint - requires Firebase ID token.**

### Request

```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

### Expected Response (200 OK)

```json
{
  "uid": "abc123def456",
  "email": "test@example.com",
  "emailVerified": false,
  "name": "Test User",
  "picture": null
}
```

### How to Set Authorization Header in Postman

1. Go to **Authorization** tab
2. Select **Type**: `Bearer Token`
3. **Token**: Paste your Firebase ID token from Step 2

Or manually add header:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

### Test Cases

| Test Case | Token | Expected Result |
|-----------|-------|-----------------|
| ✅ Valid token | Fresh Firebase token | 200 OK |
| ❌ No token | None | 401 Unauthorized |
| ❌ Invalid token | `Bearer invalid` | 401 Unauthorized |
| ❌ Expired token | Token > 1 hour old | 401 Unauthorized |

---

## 4. Forgot Password / Password Reset

**Generates a password reset link via Firebase.**

### Request

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

### Body

```json
{
  "email": "test@example.com"
}
```

### Expected Response (200 OK)

```json
{
  "message": "Password reset link sent to email",
  "link": "https://sigma-icon-452815-q2.firebaseapp.com/__/auth/action?mode=resetPassword&..."
}
```

> [!NOTE]
> In production, Firebase will send the email automatically. The link in the response is for testing purposes.

### Test Cases

| Test Case | Email | Expected Result |
|-----------|-------|-----------------|
| ✅ Existing user | `test@example.com` | 200 OK with reset link |
| ❌ Non-existent user | `notexist@test.com` | 404 Not Found |
| ❌ Invalid email | `notanemail` | 400 Bad Request |

---

## Postman Collection Structure

Organize your tests like this:

```
📁 Firebase Auth API
  📄 1. Register User
  📄 2. Login (Get ID Token + Backend Login)
  📄 3. Get Profile (Protected)
  📄 4. Forgot Password
  
📁 Environment Variables
  🔧 FIREBASE_API_KEY
  🔧 BASE_URL (http://localhost:3000)
  🔧 firebase_id_token (auto-set by script)
```

---

## Quick Test Checklist

- [ ] **Register** a new user
- [ ] **Login** with Firebase REST API → Get ID token
- [ ] **Login** to backend with ID token → Get user info
- [ ] **Get Profile** using Bearer token → Verify user data
- [ ] **Forgot Password** → Receive reset link
- [ ] **Test invalid cases** (wrong email, expired token, etc.)

---

## Common Issues & Solutions

### Issue: "Firebase credentials not found"
**Solution**: Check `.env` file has `FIREBASE_SERVICE_ACCOUNT_BASE64` or other credential options set.

### Issue: "Invalid or expired token"
**Solution**: Firebase ID tokens expire after 1 hour. Get a fresh token from Step 2.

### Issue: "User not found in database"
**Solution**: Make sure to register the user first, or the login endpoint will sync the user automatically if they exist in Firebase but not in the database.

### Issue: Cannot get Firebase ID token
**Solution**: 
- Verify `FIREBASE_API_KEY` is correct (from Firebase Console)
- Check email/password are correct
- Ensure user exists in Firebase Auth (register first)

---

## Next Steps

After manual testing passes:
1. ✅ Create automated integration tests
2. ✅ Add email verification flow
3. ✅ Implement refresh token logic
4. ✅ Add rate limiting for auth endpoints
