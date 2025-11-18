# 🔧 Environment Variable Setup

## ⚠️ Important: Reserved Environment Variables

Some hosting platforms (Railway, Render, etc.) **reserve** `NODE_ENV` and won't let you set it.

**Solution:** We use `APP_ENV` instead.

---

## Required Environment Variables

Set these in your hosting platform dashboard:

### Minimum Required Variables

```bash
# Environment Mode
APP_ENV=production

# Server Port (usually auto-set by platform)
PORT=3000

# Timezone
TIMEZONE=Asia/Kolkata

# Firebase Database URL
FIREBASE_DATABASE_URL=https://mr-bunkmanager-default-rtdb.firebaseio.com
```

### Optional Security Variables

```bash
# CORS Configuration (comma-separated allowed origins)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Platform-Specific Instructions

### Railway

1. Go to your project → **Variables** tab
2. Click **New Variable**
3. Add each variable:

```
APP_ENV = production
TIMEZONE = Asia/Kolkata
FIREBASE_DATABASE_URL = https://mr-bunkmanager-default-rtdb.firebaseio.com
```

4. For Firebase service account:
   - Add variable: `FIREBASE_SERVICE_ACCOUNT`
   - Paste entire JSON content from `serviceAccountKey.json`

### Render

1. Go to your service → **Environment** tab
2. Add **Environment Variables**:

```
APP_ENV = production
TIMEZONE = Asia/Kolkata
FIREBASE_DATABASE_URL = https://mr-bunkmanager-default-rtdb.firebaseio.com
```

3. For Firebase service account:
   - Click **Add Secret File**
   - Filename: `config/serviceAccountKey.json`
   - Paste JSON content

### Vercel

1. Project Settings → **Environment Variables**
2. Add variables:

```
APP_ENV = production
TIMEZONE = Asia/Kolkata
FIREBASE_DATABASE_URL = https://mr-bunkmanager-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT = <paste entire JSON here>
```

---

## Firebase Service Account Setup

### Option 1: As JSON String (Railway/Vercel)

Copy the **entire contents** of `config/serviceAccountKey.json` and paste as environment variable:

```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"mr-bunkmanager",...}
```

### Option 2: As Secret File (Render)

Upload `serviceAccountKey.json` as a secret file with path:
```
config/serviceAccountKey.json
```

---

## Verification

After setting variables, check your deployment logs for:

```
✅ Server running in production mode
✅ Firebase Admin initialized successfully
✅ CORS configured for production
```

If you see errors about missing variables, double-check the variable names match exactly.

---

## Common Issues

### ❌ "NODE_ENV is reserved"
**Solution:** Use `APP_ENV=production` instead ✅

### ❌ "Firebase initialization failed"
**Solution:** Verify `FIREBASE_SERVICE_ACCOUNT` is valid JSON or file path is correct

### ❌ "CORS error from app"
**Solution:**
- Mobile apps work without ALLOWED_ORIGINS
- For web apps, add your domain to ALLOWED_ORIGINS

---

## Quick Copy-Paste

**For Railway/Render Dashboard:**
```
APP_ENV=production
PORT=3000
TIMEZONE=Asia/Kolkata
FIREBASE_DATABASE_URL=https://mr-bunkmanager-default-rtdb.firebaseio.com
```

Then add your Firebase service account JSON separately.
