# ⚠️ Important: Vercel Deployment Limitations

## Why Vercel Might Not Be Ideal for This Backend

Vercel is a **serverless platform**, which means it has these limitations:

### ❌ What Doesn't Work on Vercel

1. **Cron Jobs (Scheduled Notifications)**
   - ❌ `node-cron` doesn't work in serverless
   - ❌ No background processes
   - ❌ Functions timeout after 10 seconds (free tier) or 60 seconds (pro tier)

2. **Your Notification Features**
   - ❌ Daily reminders at 8:00 PM (needs cron job)
   - ❌ 30-minute class reminders (needs cron job)
   - ❌ 10-minute class reminders (needs cron job)

### ⚠️ What Works (But Not Ideal)

- ✅ Manual notification endpoints (POST /send-notification)
- ✅ Save/delete tokens
- ✅ Health check

### 🔧 Workaround: External Cron Service

You **must** use an external service to trigger notifications:

1. **Vercel Cron (Beta)** - Requires Pro plan ($20/month)
2. **cron-job.org** - Free external service
3. **GitHub Actions** - Free cron scheduler

---

## ✅ Better Alternatives for Your Backend

### Recommended: Railway or Render

Both support **real cron jobs** and background processes:

| Platform | Cron Support | Price | Best For |
|----------|--------------|-------|----------|
| **Railway** | ✅ Native | $5/month credit | Easy deployment |
| **Render** | ✅ Native | Free forever | Budget-friendly |
| **Vercel** | ⚠️ External only | Free/Pro | Static sites, not backends |

---

## If You Still Want to Use Vercel

### Step 1: Deploy to Vercel

Your backend is now configured for Vercel serverless.

1. **Push to GitHub** (already done)
2. **Import to Vercel**:
   - Go to https://vercel.com
   - New Project → Import from GitHub
   - Select `MR_BunkManager` repository
   - Root Directory: `backend`
   - Deploy

3. **Set Environment Variables** in Vercel Dashboard:
   ```
   APP_ENV=production
   TIMEZONE=Asia/Kolkata
   FIREBASE_DATABASE_URL=https://mr-bunkmanager-default-rtdb.firebaseio.com
   FIREBASE_SERVICE_ACCOUNT=<paste your entire serviceAccountKey.json content>
   ```

### Step 2: Setup External Cron (Required!)

Your notifications **won't work** without this.

#### Option A: cron-job.org (Free & Easy)

1. Go to https://cron-job.org
2. Create free account
3. Add jobs:

**Daily Reminder (8:00 PM IST):**
```
URL: https://your-vercel-app.vercel.app/send-daily-reminders
Method: POST
Schedule: 0 20 * * * (8:00 PM IST)
Timezone: Asia/Kolkata
```

**30-Minute Class Reminders:**
```
URL: https://your-vercel-app.vercel.app/send-class-reminders
Method: POST
Body: {"minutesBefore": 30}
Schedule: */1 * * * * (every minute)
Timezone: Asia/Kolkata
```

**10-Minute Class Reminders:**
```
URL: https://your-vercel-app.vercel.app/send-class-reminders
Method: POST
Body: {"minutesBefore": 10}
Schedule: */1 * * * * (every minute)
Timezone: Asia/Kolkata
```

#### Option B: GitHub Actions (Free)

Create `.github/workflows/cron.yml` in your repository:

```yaml
name: Scheduled Notifications

on:
  schedule:
    # Daily reminders at 8:00 PM IST (2:30 PM UTC)
    - cron: '30 14 * * *'
    # Class reminders every minute
    - cron: '*/1 * * * *'

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Send Daily Reminders
        if: github.event.schedule == '30 14 * * *'
        run: |
          curl -X POST https://your-vercel-app.vercel.app/send-daily-reminders

      - name: Send 30-min Reminders
        if: github.event.schedule == '*/1 * * * *'
        run: |
          curl -X POST https://your-vercel-app.vercel.app/send-class-reminders \
            -H "Content-Type: application/json" \
            -d '{"minutesBefore": 30}'

      - name: Send 10-min Reminders
        if: github.event.schedule == '*/1 * * * *'
        run: |
          curl -X POST https://your-vercel-app.vercel.app/send-class-reminders \
            -H "Content-Type: application/json" \
            -d '{"minutesBefore": 10}'
```

---

## 🚀 Recommended: Use Railway Instead

Railway is **much simpler** for your use case:

### Why Railway is Better

1. ✅ Cron jobs work natively (no external service needed)
2. ✅ $5 free credit per month
3. ✅ One-click deploy from GitHub
4. ✅ All your notification features work out of the box

### Quick Railway Deployment

1. Go to https://railway.app
2. Sign in with GitHub
3. New Project → Deploy from GitHub
4. Select `MR_BunkManager` repository
5. Root Directory: `backend`
6. Set environment variables:
   ```
   APP_ENV=production
   TIMEZONE=Asia/Kolkata
   FIREBASE_DATABASE_URL=https://mr-bunkmanager-default-rtdb.firebaseio.com
   FIREBASE_SERVICE_ACCOUNT=<paste JSON>
   ```
7. Deploy ✅

**Done!** All cron jobs work automatically.

---

## Summary

| Feature | Vercel | Railway | Render |
|---------|--------|---------|--------|
| Manual notifications | ✅ | ✅ | ✅ |
| Automatic cron jobs | ❌ Needs external service | ✅ Built-in | ✅ Built-in |
| Setup complexity | High | Low | Low |
| Cost | Free (+ external cron) | $5/month credit | Free |
| **Recommended?** | ❌ Not ideal | ✅ **Best choice** | ✅ Good choice |

---

## Current Status

Your backend is now **compatible with Vercel**, but you **must setup external cron** for notifications to work.

**Recommendation:** Deploy to Railway or Render instead for a simpler, fully-working solution.
