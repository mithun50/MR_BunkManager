# 📝 Environment Configuration Guide

## Understanding .env Files

Your backend uses **different environment files** for different purposes:

### 1. `.env` - Local Development (Current Use)
```bash
PORT=3000
NODE_ENV=development  # ✅ Keep this as development
FIREBASE_DATABASE_URL=https://mr-bunkmanager.firebaseio.com
TZ=Asia/Kolkata
```

**Purpose**:
- For testing on your local machine (Termux)
- Running `npm run dev` or `npm start` locally
- Testing notifications before deploying

**Keep it as is!** This is correct for local development.

---

### 2. `.env.production` - Production Template
```bash
NODE_ENV=production  # ✅ Production mode
PORT=3000
FIREBASE_DATABASE_URL=https://mr-bunkmanager-default-rtdb.firebaseio.com
TZ=Asia/Kolkata
ALLOWED_ORIGINS=https://yourdomain.com
```

**Purpose**:
- Template for production deployment
- Not used locally
- Reference for hosting platforms

**Don't use this file directly** - it's a template.

---

## How It Works

### Local Development (What You're Doing Now)
```bash
# Uses .env file (NODE_ENV=development)
cd backend
npm start

# Output: "Server running in development mode"
```

### Production Deployment (After Hosting)
When you deploy to Railway/Render/Vercel, you'll set environment variables in their dashboard:

**Railway Dashboard:**
```
NODE_ENV = production  ← Set this in Railway
PORT = 3000
TZ = Asia/Kolkata
FIREBASE_DATABASE_URL = https://mr-bunkmanager.firebaseio.com
```

**Your local `.env` file is NOT uploaded** - it stays on your machine for testing.

---

## What Changes in Production Mode?

### Development Mode (Your Current Setup)
```javascript
NODE_ENV=development
✅ Detailed error messages
✅ Verbose logging (morgan 'dev')
✅ CORS allows all localhost origins
✅ No rate limiting restrictions
```

### Production Mode (After Deployment)
```javascript
NODE_ENV=production
✅ Secure error messages (no stack traces)
✅ Minimal logging (morgan 'combined')
✅ CORS restricted to your domain
✅ Rate limiting active (100 req/15min)
```

---

## Current Status ✅

**Your setup is correct!**

- `.env` = development ✅ (for local testing)
- `.env.production` = template ✅ (for deployment reference)
- Production variables = set on hosting platform ✅

**No changes needed to .env file** - keep it as `NODE_ENV=development` for local testing.

---

## Deployment Flow

### Step 1: Local Testing (Now)
```bash
# .env has NODE_ENV=development
npm start
# Test notifications on localhost
```

### Step 2: Deploy to Railway/Render
```bash
# Push code to GitHub
git push

# Railway/Render auto-deploys
# Set environment variables in their dashboard:
NODE_ENV=production  ← This overrides .env
```

### Step 3: Production Running
```bash
# Railway uses production mode automatically
# Your .env file is ignored
# Platform environment variables are used
```

---

## File Summary

| File | Purpose | NODE_ENV | Used When |
|------|---------|----------|-----------|
| `.env` | Local development | `development` | Local testing |
| `.env.production` | Template/reference | `production` | Never directly |
| Railway/Render Dashboard | Production config | `production` | Deployed app |

---

## Your Next Steps

1. **Keep `.env` as is** - it's correct for local development ✅
2. **Choose hosting platform** - Railway/Render/Vercel
3. **Set production variables** - in hosting dashboard (not .env file)
4. **Deploy** - platform will use NODE_ENV=production automatically

**No changes needed to your current .env file!** 🎉
