# 🏗️ Backend Architecture

Visual overview of the MR BunkManager notification system architecture.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    📱 EXPO MOBILE APP                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐           │
│  │ Timetable   │  │ Attendance  │  │ Push Token   │           │
│  │ Management  │  │ Tracking    │  │ Registration │           │
│  └─────────────┘  └─────────────┘  └──────────────┘           │
│         │                │                  │                   │
└─────────┼────────────────┼──────────────────┼───────────────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                  🔥 FIREBASE FIRESTORE                          │
│                                                                 │
│  users/{userId}/                                                │
│    ├─ timetable/           ← Written by app                    │
│    ├─ subjects/            ← Written by app                    │
│    └─ deviceTokens/        ← Written by backend                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          ▲                                       ▲
          │ Read                          Write   │
          │ (Timetable,                 (Tokens)  │
          │  Subjects,                            │
          │  Attendance)                          │
          │                                       │
┌─────────┴───────────────────────────────────────┴───────────────┐
│                                                                 │
│              🖥️  NODE.JS + EXPRESS BACKEND                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Express Routes                          │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  POST /save-token          ← Save push tokens            │  │
│  │  POST /send-notification   ← Send to one user            │  │
│  │  POST /send-notification-all ← Send to all               │  │
│  │  POST /send-daily-reminders  ← Trigger reminders         │  │
│  │  GET  /tokens/:userId      ← Debug endpoint              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Notification Logic Module                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • Get tomorrow's timetable                              │  │
│  │  • Calculate attendance percentage                       │  │
│  │  • Detect labs vs regular classes                        │  │
│  │  • Generate personalized messages                        │  │
│  │  • Send via Expo Push SDK                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Cron Scheduler                            │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Schedule: 0 20 * * * (8:00 PM IST daily)                │  │
│  │  Timezone: Asia/Kolkata                                   │  │
│  │  Action: sendDailyReminders()                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Firebase Admin SDK                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • Firestore database access                             │  │
│  │  • Service account authentication                         │  │
│  │  • Direct backend-to-Firebase communication              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              📡 EXPO PUSH NOTIFICATION SERVICE                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Receives notifications from backend                    │  │
│  │  • Validates push tokens                                  │  │
│  │  • Delivers to iOS/Android devices                        │  │
│  │  • Handles notification receipts                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Push
                              ▼
                    ┌──────────────────┐
                    │                  │
                    │  📱 User Device  │
                    │                  │
                    │  Notification!   │
                    │                  │
                    └──────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. User Registration Flow

```
┌─────────┐       ┌─────────┐       ┌──────────┐       ┌──────────┐
│  User   │       │  Expo   │       │ Backend  │       │ Firebase │
│  Device │       │   App   │       │  Server  │       │Firestore │
└────┬────┘       └────┬────┘       └────┬─────┘       └────┬─────┘
     │                 │                  │                  │
     │ Request         │                  │                  │
     │ Permission      │                  │                  │
     ├────────────────>│                  │                  │
     │                 │                  │                  │
     │ Grant           │                  │                  │
     │<────────────────┤                  │                  │
     │                 │                  │                  │
     │                 │ Get Push Token   │                  │
     │                 ├─────────────────>│                  │
     │                 │                  │                  │
     │                 │                  │ Save Token       │
     │                 │                  ├─────────────────>│
     │                 │                  │                  │
     │                 │                  │ Success          │
     │                 │                  │<─────────────────┤
     │                 │                  │                  │
     │                 │ Confirmation     │                  │
     │                 │<─────────────────┤                  │
     │                 │                  │                  │
```

### 2. Daily Reminder Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐
│  Cron   │     │ Backend  │     │ Firebase │     │  Expo   │     │ Device │
│  Job    │     │  Logic   │     │Firestore │     │ Service │     │        │
└────┬────┘     └────┬─────┘     └────┬─────┘     └────┬────┘     └───┬────┘
     │               │                 │                │              │
  8:00 PM            │                 │                │              │
     │ Trigger       │                 │                │              │
     ├──────────────>│                 │                │              │
     │               │                 │                │              │
     │               │ Get all users   │                │              │
     │               │ with tokens     │                │              │
     │               ├────────────────>│                │              │
     │               │                 │                │              │
     │               │ User list       │                │              │
     │               │<────────────────┤                │              │
     │               │                 │                │              │
     │               │ For each user:  │                │              │
     │               │ Get timetable   │                │              │
     │               ├────────────────>│                │              │
     │               │                 │                │              │
     │               │ Timetable data  │                │              │
     │               │<────────────────┤                │              │
     │               │                 │                │              │
     │               │ Get attendance  │                │              │
     │               ├────────────────>│                │              │
     │               │                 │                │              │
     │               │ Attendance %    │                │              │
     │               │<────────────────┤                │              │
     │               │                 │                │              │
     │               │ Generate        │                │              │
     │               │ personalized    │                │              │
     │               │ message         │                │              │
     │               │                 │                │              │
     │               │ Send via Expo   │                │              │
     │               ├────────────────────────────────>│              │
     │               │                 │                │              │
     │               │                 │                │ Deliver      │
     │               │                 │                ├─────────────>│
     │               │                 │                │              │
     │               │                 │                │ Notification │
     │               │                 │                │  appears     │
     │               │                 │                │              │
```

### 3. Manual Notification Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐
│  Admin  │     │ Backend  │     │ Firebase │     │  Expo   │     │ Users  │
│ /Client │     │  API     │     │Firestore │     │ Service │     │Devices │
└────┬────┘     └────┬─────┘     └────┬─────┘     └────┬────┘     └───┬────┘
     │               │                 │                │              │
     │ POST          │                 │                │              │
     │ /send-        │                 │                │              │
     │ notification  │                 │                │              │
     ├──────────────>│                 │                │              │
     │               │                 │                │              │
     │               │ Get user tokens │                │              │
     │               ├────────────────>│                │              │
     │               │                 │                │              │
     │               │ Token data      │                │              │
     │               │<────────────────┤                │              │
     │               │                 │                │              │
     │               │ Send message    │                │              │
     │               ├────────────────────────────────>│              │
     │               │                 │                │              │
     │               │                 │                │ Push         │
     │               │                 │                ├─────────────>│
     │               │                 │                │              │
     │ Success       │                 │                │ Notification │
     │ response      │                 │                │              │
     │<──────────────┤                 │                │              │
     │               │                 │                │              │
```

---

## 📦 Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** Firebase Firestore (via Firebase Admin SDK)
- **Push Service:** Expo Server SDK
- **Scheduler:** node-cron
- **Security:** Helmet, CORS
- **Logging:** Morgan

### Frontend (Expo App)
- **Framework:** React Native + Expo
- **Notifications:** expo-notifications
- **State:** Zustand
- **Firebase:** @react-native-firebase/*

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Firebase Service Account                           │
│     • Private key authentication                       │
│     • Not exposed to clients                           │
│     • Stored securely (serviceAccountKey.json)         │
│                                                         │
│  2. CORS Protection                                     │
│     • Configured allowed origins                       │
│     • Prevents unauthorized API access                 │
│                                                         │
│  3. Helmet Security Headers                             │
│     • XSS protection                                    │
│     • Content security policy                          │
│     • HTTPS enforcement                                │
│                                                         │
│  4. Push Token Validation                               │
│     • Expo token format verification                   │
│     • Device ID tracking                               │
│     • Invalid token rejection                          │
│                                                         │
│  5. Environment Variables                               │
│     • Secrets not in code                              │
│     • .env files excluded from git                     │
│     • Production-ready configuration                   │
│                                                         │
│  6. Input Validation                                    │
│     • Required field checks                            │
│     • Type validation                                  │
│     • Sanitization                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration Management

### Development
```env
PORT=3000
NODE_ENV=development
FIREBASE_DATABASE_URL=https://dev-project.firebaseio.com
TZ=Asia/Kolkata
```

### Production
```env
PORT=8080
NODE_ENV=production
FIREBASE_DATABASE_URL=https://prod-project.firebaseio.com
TZ=Asia/Kolkata
API_KEY=secure-production-key
```

---

## 📈 Scalability Considerations

### Current Architecture
- ✅ Single server instance
- ✅ Suitable for 1-10K users
- ✅ Daily batch processing
- ✅ Direct Firestore access

### Scaling Strategies

**For 10K-100K users:**
- Add load balancer
- Horizontal scaling (multiple server instances)
- Database connection pooling
- Redis caching layer

**For 100K+ users:**
- Microservices architecture
- Message queue (RabbitMQ/Redis)
- Separate notification service
- CDN for static assets
- Database sharding

---

## 🔍 Monitoring & Logging

### Current Logging
```javascript
// Every request logged
[timestamp] [HTTP method] [path] [status] [response time]

// Notification events
✅ Token saved for user {userId}
📤 Sent to user {userId}: {n} successful, {m} failed
⏰ Cron job triggered at {IST time}
```

### Recommended Production Monitoring
- **Error tracking:** Sentry
- **Performance:** New Relic / DataDog
- **Uptime:** Pingdom / UptimeRobot
- **Logs:** CloudWatch / Loggly

---

## 🧪 Testing Strategy

### Unit Tests
- Token validation
- Message generation logic
- Firestore query functions

### Integration Tests
- API endpoint responses
- Firebase connection
- Expo push service integration

### End-to-End Tests
- Full notification flow
- Cron job execution
- Multi-user scenarios

---

## 🚀 Deployment Options

### 1. Railway (Recommended for beginners)
```bash
railway login
railway init
railway up
```

### 2. Render
- Connect GitHub repo
- Auto-deploy on push
- Free tier available

### 3. Google Cloud Run
- Serverless container deployment
- Auto-scaling
- Pay per use

### 4. AWS EC2
- Full control
- Custom configuration
- Requires more setup

### 5. Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📊 Performance Metrics

### Expected Performance
- **API Response Time:** < 100ms (avg)
- **Notification Delivery:** < 5s
- **Cron Job Duration:** 2-5 min (for 1000 users)
- **Memory Usage:** ~200MB
- **CPU Usage:** Low (spikes during cron)

### Optimization Tips
- Use connection pooling
- Implement caching (Redis)
- Batch Firestore queries
- Compress notification payloads
- Monitor and optimize slow queries

---

## 🔄 Future Enhancements

### Planned Features
- [ ] User notification preferences
- [ ] Custom notification schedules per user
- [ ] Push notification analytics dashboard
- [ ] A/B testing for notification messages
- [ ] Multi-language support
- [ ] Rich notifications (images, actions)
- [ ] Notification history API
- [ ] Admin panel for managing notifications

### Advanced Features
- [ ] AI-generated personalized messages
- [ ] Predictive attendance alerts
- [ ] Smart scheduling (avoid disturbing hours)
- [ ] Integration with calendar apps
- [ ] Group notifications for classes

---

**For implementation details, see [README.md](README.md)**
