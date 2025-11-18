# 🚀 Production Deployment Guide

Complete guide to deploy MR BunkManager backend to production hosting platforms.

---

## 📋 Pre-Deployment Checklist

Before deploying to any platform:

- [ ] Firebase service account key (serviceAccountKey.json)
- [ ] Firebase Database URL
- [ ] Expo project ID (for push notifications)
- [ ] Choose your hosting platform
- [ ] Update ALLOWED_ORIGINS for your domain

---

## 🌐 Hosting Platform Options

### Option 1: Railway (Recommended - Easiest)

**Why Railway:**
- ✅ Free tier available ($5 credit/month)
- ✅ Automatic deploys from GitHub
- ✅ Built-in environment variable management
- ✅ Cron jobs work perfectly
- ✅ India region available

**Deployment Steps:**

1. **Create Railway Account**
   ```bash
   # Visit https://railway.app
   # Sign up with GitHub
   ```

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `MR_BunkManager` repository
   - Select `backend` folder as root directory

3. **Set Environment Variables**
   Go to your project → Variables tab:
   ```
   NODE_ENV=production
   PORT=3000
   TZ=Asia/Kolkata
   FIREBASE_DATABASE_URL=https://mr-bunkmanager-default-rtdb.firebaseio.com
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

4. **Add Firebase Service Account**
   - In Railway dashboard → Settings → Variables
   - Add multi-line variable `FIREBASE_SERVICE_ACCOUNT`
   - Paste entire contents of `serviceAccountKey.json`

   OR upload file:
   - Settings → Volumes → Create Volume
   - Upload `serviceAccountKey.json`
   - Mount path: `/app/config/serviceAccountKey.json`

5. **Deploy**
   - Railway auto-deploys on push to main branch
   - Get your URL: `https://your-app.railway.app`

**Cost:** Free tier: $5 credit/month (~550 hours runtime)

---

### Option 2: Render (Free Option)

**Why Render:**
- ✅ Completely free tier (with limitations)
- ✅ Auto-deploy from GitHub
- ✅ Asia/Singapore region
- ⚠️ Cron jobs work but service sleeps after 15 min inactivity

**Deployment Steps:**

1. **Create Render Account**
   ```bash
   # Visit https://render.com
   # Sign up with GitHub
   ```

2. **Create Web Service**
   - Dashboard → New → Web Service
   - Connect your GitHub repository
   - Select `backend` directory

3. **Configure Service**
   ```
   Name: mr-bunkmanager-backend
   Region: Singapore
   Branch: main
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   TZ=Asia/Kolkata
   FIREBASE_DATABASE_URL=https://mr-bunkmanager-default-rtdb.firebaseio.com
   ```

5. **Add Firebase Service Account**
   - Dashboard → Environment
   - Add Secret File
   - Filename: `config/serviceAccountKey.json`
   - Content: Paste your service account JSON

6. **Deploy**
   - Click "Create Web Service"
   - Get URL: `https://your-app.onrender.com`

**Free Tier Limitations:**
- Service spins down after 15 min inactivity
- May have cold start delays (15-30 seconds)
- Solution: Use external cron service to ping `/health` every 10 minutes

**Cost:** Free forever

---

### Option 3: Vercel (Serverless)

**Why Vercel:**
- ✅ Free tier generous
- ✅ Global CDN and fast
- ✅ Easy GitHub integration
- ⚠️ Serverless = cron jobs need external service

**Deployment Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   cd backend
   vercel --prod
   ```

3. **Environment Variables** (via Vercel dashboard)
   ```
   NODE_ENV=production
   TZ=Asia/Kolkata
   FIREBASE_DATABASE_URL=https://mr-bunkmanager-default-rtdb.firebaseio.com
   FIREBASE_SERVICE_ACCOUNT=<paste JSON here>
   ```

4. **Cron Jobs** (Important!)
   Vercel is serverless, so use **Vercel Cron** or external service:

   **Option A: Vercel Cron (Beta)**
   ```json
   // vercel.json
   {
     "crons": [
       {
         "path": "/send-daily-reminders",
         "schedule": "0 20 * * *"
       }
     ]
   }
   ```

   **Option B: External Cron Service**
   - Use https://cron-job.org (free)
   - Schedule: `0 20 * * *` (8 PM IST)
   - URL: `https://your-app.vercel.app/send-daily-reminders`

**Cost:** Free tier: 100GB bandwidth, 100 hours compute/month

---

### Option 4: Google Cloud Run (Scalable)

**Why Cloud Run:**
- ✅ Pay only for what you use
- ✅ Auto-scaling
- ✅ Integrated with Firebase
- ⚠️ Requires gcloud CLI setup

**Deployment Steps:**

1. **Install gcloud CLI**
   ```bash
   curl https://sdk.cloud.google.com | bash
   gcloud init
   ```

2. **Build and Deploy**
   ```bash
   cd backend

   # Build Docker image
   gcloud builds submit --tag gcr.io/mr-bunkmanager/notification-backend

   # Deploy to Cloud Run
   gcloud run deploy notification-backend \
     --image gcr.io/mr-bunkmanager/notification-backend \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production,TZ=Asia/Kolkata
   ```

3. **Set Environment Variables**
   ```bash
   gcloud run services update notification-backend \
     --set-env-vars FIREBASE_DATABASE_URL=https://mr-bunkmanager-default-rtdb.firebaseio.com
   ```

4. **Cron Jobs with Cloud Scheduler**
   ```bash
   # Create daily reminder job
   gcloud scheduler jobs create http daily-reminder \
     --schedule "0 20 * * *" \
     --uri "https://your-app.run.app/send-daily-reminders" \
     --http-method POST \
     --time-zone "Asia/Kolkata"
   ```

**Cost:** Free tier: 2 million requests/month, 360,000 GB-seconds/month

---

### Option 5: DigitalOcean App Platform

**Why DigitalOcean:**
- ✅ Simple deployment
- ✅ Predictable pricing
- ✅ India region available
- ✅ Full VM (not serverless)

**Deployment Steps:**

1. **Create Account**
   Visit https://digitalocean.com

2. **Deploy from GitHub**
   - Apps → Create App
   - Choose GitHub repository
   - Select `backend` directory

3. **Configure**
   ```
   Name: mr-bunkmanager-backend
   Region: Bangalore
   Instance: Basic ($5/month)
   Build Command: npm install
   Run Command: npm start
   ```

4. **Environment Variables**
   Add via dashboard or CLI

**Cost:** Starting at $5/month

---

## 🔐 Security Best Practices

### 1. Firebase Service Account

**Never commit serviceAccountKey.json to GitHub!**

**Option A: Environment Variable (Recommended)**
```javascript
// config/firebase.js
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('./serviceAccountKey.json');
```

**Option B: Secret Management**
- Railway: Use built-in secrets
- Render: Secret files
- Vercel: Environment variables
- Cloud Run: Secret Manager

### 2. CORS Configuration

Update `.env.production`:
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Rate Limiting

Already configured in `src/index.js`:
- 100 requests per 15 minutes per IP
- Adjust via environment variables

### 4. HTTPS

All recommended platforms provide free SSL certificates automatically.

---

## 🧪 Testing Production Deployment

### 1. Health Check
```bash
curl https://your-production-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "MR BunkManager Notification Server is running",
  "timestamp": "18/11/2025, 03:30:45 PM",
  "timezone": "Asia/Kolkata (IST)"
}
```

### 2. Test Notification
```bash
curl -X POST https://your-production-url.com/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "Production Test",
    "body": "Backend is live!"
  }'
```

### 3. Verify Cron Jobs

Check logs after 8:00 PM IST to confirm daily reminders are sent.

---

## 📱 Update Expo App

After deployment, update your app's backend URL:

**.env**
```bash
# Change from localhost to production URL
EXPO_PUBLIC_BACKEND_URL=https://your-production-url.com
```

Rebuild and publish your Expo app:
```bash
npx expo publish
# OR
eas update --branch production
```

---

## 📊 Monitoring & Logs

### Railway
- Dashboard → Deployments → View Logs
- Real-time log streaming

### Render
- Dashboard → Logs tab
- Downloadable logs

### Vercel
- Dashboard → Deployments → Function Logs
- Real-time monitoring

### Cloud Run
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

---

## 🐛 Troubleshooting

### Cron Jobs Not Running

**Problem**: Scheduled notifications not being sent

**Railway/Render/DigitalOcean:**
- Cron jobs work natively ✅
- Check logs for errors

**Vercel:**
- Use Vercel Cron or external service
- Verify cron configuration in vercel.json

**Free Tier Sleep:**
- Render free tier sleeps after 15 min
- Use cron-job.org to ping `/health` every 10 min

### Firebase Connection Errors

**Problem**: "Firebase Admin SDK initialization failed"

**Solutions:**
1. Verify `FIREBASE_SERVICE_ACCOUNT` is set correctly
2. Check JSON formatting (no trailing commas)
3. Ensure service account has correct permissions
4. Verify `FIREBASE_DATABASE_URL` matches your project

### CORS Errors from Mobile App

**Problem**: "Not allowed by CORS"

**Solution:**
- Mobile apps don't send `origin` header
- CORS config allows requests with no origin
- If still failing, temporarily set:
  ```javascript
  app.use(cors({ origin: true }));
  ```

### Rate Limit Errors

**Problem**: "Too many requests"

**Solutions:**
1. Increase limits in `.env.production`:
   ```
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=200
   ```
2. Implement IP whitelist for your app

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid Tier | Cron Support | Region |
|----------|-----------|-----------|--------------|--------|
| **Railway** | $5 credit/month | Pay as you go | ✅ Native | India |
| **Render** | Free forever | $7/month | ✅ Native | Singapore |
| **Vercel** | Generous | $20/month | ⚠️ External | Global |
| **Cloud Run** | 2M requests/month | Pay per use | ⚠️ Scheduler | India |
| **DigitalOcean** | None | $5/month | ✅ Native | India |

**Recommendation:**
- **Development/Testing**: Render (Free)
- **Production (Small Scale)**: Railway ($5/month credit)
- **Production (High Scale)**: Cloud Run (pay per use)

---

## ✅ Post-Deployment Checklist

- [ ] Health check endpoint responding
- [ ] Test notification sent successfully
- [ ] Daily reminders scheduled and working
- [ ] 30-min reminders triggering correctly
- [ ] 10-min reminders triggering correctly
- [ ] Expo app updated with production URL
- [ ] CORS configured for production domain
- [ ] Firebase service account secured
- [ ] Monitoring/logging set up
- [ ] Backup strategy in place

---

## 🆘 Support & Resources

### Platform Documentation
- **Railway**: https://docs.railway.app
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **Cloud Run**: https://cloud.google.com/run/docs

### Firebase
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Service Accounts: https://cloud.google.com/iam/docs/service-accounts

### Expo Push Notifications
- Documentation: https://docs.expo.dev/push-notifications/overview

---

**Your backend is now production-ready! 🚀**

Choose a platform, deploy, and your notification system will be live.
