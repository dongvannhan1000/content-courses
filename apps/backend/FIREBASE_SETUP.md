# Firebase Authentication Setup Guide

This guide explains how to configure Firebase Authentication for the backend.

## Prerequisites

1. A Firebase project (you already have: `sigma-icon-452815-q2`)
2. Firebase Admin SDK credentials

## Setup Steps

### 1. Get Firebase Service Account Credentials

Go to [Firebase Console](https://console.firebase.google.com):

1. Select your project: **sigma-icon-452815-q2**
2. Click the gear icon ⚙️ → **Project settings**
3. Navigate to **Service accounts** tab
4. Click **Generate new private key**
5. Download the JSON file

### 2. Configure Backend Environment Variables

Create a `.env` file in `apps/backend/` with the following content:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT (kept for compatibility)
JWT_SECRET="your-secret-key-change-in-production"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:5173"

# Firebase Admin SDK Configuration
# Extract these from the downloaded service account JSON file

FIREBASE_PROJECT_ID="sigma-icon-452815-q2"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Multi-Line-Private-Key-Here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@sigma-icon-452815-q2.iam.gserviceaccount.com"
```

**Important:**  
- Replace `Your-Multi-Line-Private-Key-Here` with the actual private key from the JSON file
- Keep the `\n` characters in the private key string (they represent newlines)
- The `FIREBASE_CLIENT_EMAIL` should be the value from the `client_email` field in the JSON

### 3. Alternative Option 2: Use Base64-Encoded JSON (★ RECOMMENDED for Deployment)

**Best for**: Vercel, Heroku, Docker, Railway, Render, etc.

> [!CAUTION]
> **The `\n` Newline Character Trap (90% of users hit this!)**
> 
> The `private_key` field in your Firebase service account JSON contains newline characters represented as `\n`:
> ```json
> "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----\n"
> ```
> 
> When you paste this JSON into environment variable fields on web platforms (Vercel, Heroku, etc.), these platforms may:
> - Interpret `\n` as literal characters (backslash + n) instead of newlines
> - Add unwanted escape characters or quotes
> - Result in `SyntaxError` when `JSON.parse()` runs, or `PEM` format errors
>
> **Solution: Base64 encoding** prevents these issues entirely!

#### How to Generate Base64-Encoded Credentials

**On Mac/Linux:**
```bash
base64 -i firebase-service-account.json
```

**On Windows PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("firebase-service-account.json"))
```

**On Windows Command Prompt:**
```cmd
certutil -encode firebase-service-account.json output.b64
# Then open output.b64 and copy the content (excluding BEGIN/END CERTIFICATE lines)
```

**Or use an online tool:** https://www.base64encode.org/ (paste file content)

#### Configure in .env

Copy the Base64 string and set:
```env
FIREBASE_SERVICE_ACCOUNT_BASE64="eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InNpZ21hLWljb24tNDUyODE1LXEyIiwicHJpdmF0ZV9rZXlfaWQiOiIuLi4iLCJwcml2YXRlX2tleSI6Ii0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZn..."
```

**Important:**
- ✅ No quotes needed around the Base64 string (or use double quotes)
- ✅ The entire Base64 should be on one line
- ✅ Works 100% reliably on all deployment platforms

### 4. Alternative Option 3: Use Full JSON String (May Have Issues)

**Best for**: Vercel, Heroku, Docker, Railway, Render, etc.

Instead of separating credentials into multiple environment variables, you can stringify the entire service account JSON:

1. Open the downloaded JSON file
2. Copy its entire content
3. In your `.env`, set:
   ```env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"sigma-icon-452815-q2","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
   ```

**Important:**
- Wrap the JSON in single quotes `'...'`
- Keep all the `\n` characters in the private key
- The entire JSON should be on one line (no line breaks outside the private_key field)

On deployment platforms (Vercel, Heroku), you can paste this JSON string directly into the environment variable field.

### 4. Alternative Option 3: Use Service Account JSON File

**Best for**: Local development only

Instead of environment variables, you can use the JSON file directly:

1. Save the downloaded JSON file to `apps/backend/firebase-service-account.json`
2. In your `.env`, set:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-service-account.json"
   ```

> **Warning:** Never commit the service account JSON file to Git!

### 4. Run Database Migration

After setting up the `.env` file:

```bash
cd apps/backend
npx prisma migrate dev
```

This will create the `users` table with Firebase integration fields.

### 5. Start the Backend

```bash
npm run dev
```

## Authentication Flow

### Register
1. Frontend calls Firebase Client SDK to create user
2. Frontend sends Firebase ID token to backend `/api/auth/register`
3. Backend verifies token and syncs user to database

### Login
1. Frontend calls Firebase Client SDK to sign in
2. Frontend sends Firebase ID token to backend `/api/auth/login`
3. Backend verifies token and returns user info

### Forgot Password
1. Frontend calls `/api/auth/forgot-password` with email
2. Backend generates password reset link via Firebase
3. User receives email from Firebase

## API Endpoints

### `POST /api/auth/register`
**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

### `POST /api/auth/login`
**Body:**
```json
{
  "idToken": "firebase-id-token-from-client"
}
```

### `GET /api/auth/profile`
**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

### `POST /api/auth/forgot-password`
**Body:**
```json
{
  "email": "user@example.com"
}
```

## Testing

You can test the register endpoint directly:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

For login and protected endpoints, you'll need a Firebase ID token from the client-side Firebase SDK.

## Troubleshooting

### "Firebase credentials not found"
- Make sure you've set either the environment variables OR the service account path
- Check that your `.env` file is in the correct location (`apps/backend/.env`)
- Verify the private key format (should include `\n` for newlines)

### "Invalid or expired token"
- The Firebase ID token expires after 1 hour
- Make sure the client is sending a fresh token
- Verify the token is in the `Authorization: Bearer <token>` header

### Database connection error
- Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string
- Make sure PostgreSQL is running
