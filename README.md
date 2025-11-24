<p align="center">
  <img src="assets/images/logo.png" alt="MR BunkManager Logo" width="120" height="120" style="border-radius: 20px;">
</p>

<h1 align="center">MR BunkManager</h1>

<p align="center">
  <strong>Your Smart College Companion - Track Attendance, Share Notes, Never Miss a Class</strong>
</p>

<p align="center">
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-SDK_54-4630EB?style=flat-square&logo=expo&logoColor=white" alt="Expo"></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase"></a>
  <a href="#"><img src="https://img.shields.io/badge/AI-Groq_Llama_4-FF6B6B?style=flat-square&logo=openai&logoColor=white" alt="AI Powered"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-team">Team</a>
</p>

---

## 🎯 What is MR BunkManager?

Ever wondered **"How many classes can I skip and still maintain 75% attendance?"** 🤔

**MR BunkManager** answers that question and does SO much more! It's a feature-packed mobile app built by students, for students. We combined attendance tracking, AI-powered timetable management, a social notes platform, and an intelligent chatbot - all in one beautiful app.

```
📊 Track Attendance  →  🤖 Ask AI  →  📚 Share Notes  →  🎓 Ace College
```

---

## ✨ Features

### 📊 Smart Attendance Tracking

| Feature | Description |
|---------|-------------|
| **Bunk Calculator** | Know exactly how many classes you can skip |
| **Recovery Planner** | See how many classes needed to reach target % |
| **Subject-wise Tracking** | Individual stats for each subject |
| **Visual Analytics** | Beautiful donut charts and progress bars |
| **Color Coded Status** | 🟢 Safe 🟡 Warning 🔴 Danger zones |
| **History & Trends** | Track your attendance patterns over time |

### 🗓️ AI-Powered Timetable

> **Just snap a photo of your timetable - AI does the rest!**

- 📸 Upload timetable image → AI extracts schedule automatically
- ✏️ Manual entry with smart validation
- 📅 Weekly view organized by day
- 🏷️ Support for Lectures, Labs, Tutorials, Practicals, Seminars
- 👨‍🏫 Store faculty names and room numbers

### 👥 Community & Notes

<table>
<tr>
<td width="33%" align="center">
<h4>📰 Feed</h4>
<p>Notes from people you follow</p>
</td>
<td width="33%" align="center">
<h4>🔍 Explore</h4>
<p>Discover notes from your college</p>
</td>
<td width="33%" align="center">
<h4>📝 My Notes</h4>
<p>Create & manage your notes</p>
</td>
</tr>
</table>

**Share Knowledge:**
- 📄 Text notes with rich formatting
- 🖼️ Images and diagrams
- 📑 PDF documents
- 🔗 External links

**Social Features:**
- ❤️ Like notes you find helpful
- 💾 Save notes for later
- 💬 Comment and discuss
- 👥 Follow your classmates

### 🤖 BunkBot AI Assistant

Meet **BunkBot** - your personal AI assistant powered by **Groq's Llama 4 Maverick** (17B parameters, 128 experts)!

```
You: "Can I bunk tomorrow's math class?"

BunkBot: "Looking at your attendance... You're at 78% in Mathematics
         with 45/58 classes attended. You can safely skip 2 more
         classes and still stay above 75%. Go ahead! 😎"
```

**Capabilities:**
- 🎯 **Context-Aware**: Knows your attendance data in real-time
- 🖼️ **Vision**: Can analyze images you upload
- 🎤 **Voice Chat**: Full voice conversation support
- 💡 **Smart Suggestions**: Quick prompts for common questions

### 🔔 Push Notifications

Never miss what matters:
- ⏰ Daily reminders for tomorrow's classes
- 📢 Alerts before your classes start
- 🆕 Notifications when people you follow share notes

### 👤 Profile & Customization

- 🎨 Light & Dark theme
- 📸 Profile picture upload
- 🎯 Set your minimum attendance target (75%, 80%, 85%)
- 📊 See your followers & following count
- 🏫 College, course, department, semester info

---

## 🛠️ Tech Stack

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MR BunkManager                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Expo 54   │  │ React Native│  │    TypeScript 5.9   │  │
│  │  (Platform) │  │    0.81     │  │    (Type Safety)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                   │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ React Native     │  │    Expo      │  │  Reanimated  │  │
│  │ Paper (MD3)      │  │   Router     │  │     4.1      │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  State: Zustand 5.0  │  Storage: AsyncStorage              │
└─────────────────────────────────────────────────────────────┘
```

### Backend & Services

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Services                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Firebase      │   Express.js    │      Groq API           │
│   ─────────     │   ──────────    │      ────────           │
│ • Auth          │ • Notifications │ • Llama 4 Maverick      │
│ • Firestore     │ • File Proxy    │ • Vision Capabilities   │
│ • FCM           │ • Scheduling    │ • 128 Expert MoE        │
├─────────────────┴─────────────────┴─────────────────────────┤
│  File Storage: Catbox.moe (Free, No API Key Required)       │
└─────────────────────────────────────────────────────────────┘
```

### Voice & AI Pipeline

```
🎤 Voice Input                    🔊 Voice Output
     │                                  ▲
     ▼                                  │
┌─────────────┐                  ┌─────────────┐
│ Expo Speech │                  │ Expo Speech │
│ Recognition │                  │   (TTS)     │
└──────┬──────┘                  └──────┬──────┘
       │                                │
       ▼                                │
┌─────────────────────────────────────────────┐
│              Groq Llama 4 API               │
│         (Context + Attendance Data)         │
└─────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
MR_BunkManager/
│
├── 📱 app/                        # Screens (Expo Router)
│   ├── (auth)/                   # 🔐 Login, Signup, Verification
│   ├── (onboarding)/             # 👋 First-time user setup
│   ├── (tabs)/                   # 🏠 Main app screens
│   │   ├── index.tsx             #    └─ Dashboard
│   │   ├── attendance.tsx        #    └─ Attendance Tracker
│   │   ├── timetable.tsx         #    └─ Timetable Manager
│   │   ├── groups.tsx            #    └─ Community Hub
│   │   └── profile.tsx           #    └─ User Profile
│   ├── create-note.tsx           # ✍️ Note Editor
│   ├── note/[id].tsx             # 📄 Note Detail View
│   └── user/[id].tsx             # 👤 User Profile View
│
├── 🧩 src/
│   ├── components/               # Reusable UI Components
│   │   ├── ChatBot.tsx           #    └─ AI Chat Interface
│   │   ├── VoiceBot.tsx          #    └─ Voice Conversation
│   │   ├── DonutChart.tsx        #    └─ Attendance Visualization
│   │   └── notes/                #    └─ Note Components
│   │
│   ├── services/                 # Business Logic
│   │   ├── authService.ts        #    └─ Authentication
│   │   ├── firestoreService.ts   #    └─ Database CRUD
│   │   ├── chatService.ts        #    └─ AI Integration
│   │   ├── notesService.ts       #    └─ Notes Management
│   │   ├── socialService.ts      #    └─ Likes, Comments
│   │   └── followService.ts      #    └─ Follow System
│   │
│   ├── store/                    # Zustand State Stores
│   ├── types/                    # TypeScript Definitions
│   └── config/                   # Firebase Config
│
├── 🖥️ backend/                    # Express.js Server
│   └── src/
│       ├── index.js              #    └─ API Endpoints
│       └── sendNotification.js   #    └─ FCM Logic
│
└── 📦 assets/                     # Images, Fonts, Icons
```

---

## 🚀 Quick Start

### Prerequisites

```bash
node -v  # v18 or higher
npm -v   # v9 or higher
```

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/mithun50/MR_BunkManager.git
cd MR_BunkManager

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Add your API keys (see Configuration below)

# 4. Start the app
npm start

# 5. Scan QR with Expo Go app or run:
npm run android   # Android
npm run ios       # iOS
npm run web       # Browser
```

### Configuration

Create a `.env` file with:

```env
# AI (Required for chatbot)
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key

# Backend (Required for notifications)
EXPO_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

### Firebase Setup

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google)
3. Enable **Cloud Firestore**
4. Download `google-services.json` → place in project root
5. Update `src/config/firebase.ts` with your config

---

## 📊 Database Schema

```
📦 Firestore Database
│
├── 👤 users/{userId}
│   ├── displayName, email, photoURL
│   ├── college, course, department, semester, rollNumber
│   ├── minimumAttendance, onboardingCompleted
│   │
│   ├── 📚 subjects/          # Tracked subjects
│   ├── 📅 timetable/         # Class schedule
│   ├── ✅ attendance/        # Attendance records
│   ├── 👥 following/         # Who user follows
│   ├── 👥 followers/         # Who follows user
│   └── 💾 savedNotes/        # Bookmarked notes
│
├── 🔔 pushTokens/{token}
│   └── userId, tokenType, platform, deviceInfo
│
└── 📝 notes/{noteId}
    ├── title, description, content, contentType
    ├── authorId, authorName, authorPhotoURL
    ├── subject, tags, isPublic
    ├── likesCount, commentsCount, savesCount
    │
    ├── ❤️ likes/{userId}
    └── 💬 comments/{commentId}
```

---

## 📱 Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| 🤖 Android | ✅ Full Support | APK & Play Store ready |
| 🍎 iOS | ✅ Full Support | TestFlight ready |
| 🌐 Web | ✅ Full Support | PWA capable |

---

## 🎨 Screenshots

<p align="center">
  <i>Screenshots coming soon...</i>
</p>

---

## 👥 Team

<table>
<tr>
<td align="center">
<b>Nevil Dsouza</b><br>
<sub>Developer</sub>
</td>
<td align="center">
<b>Naren V</b><br>
<sub>Developer</sub>
</td>
<td align="center">
<b>Manas Habbu</b><br>
<sub>Developer</sub>
</td>
<td align="center">
<b>Manasvi R</b><br>
<sub>Developer</sub>
</td>
<td align="center">
<b>Mithun Gowda B</b><br>
<sub>Developer</sub>
</td>
</tr>
</table>

---

## 🤝 Contributing

We love contributions! Here's how you can help:

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/awesome-feature

# 3. Commit your changes
git commit -m 'Add awesome feature'

# 4. Push to the branch
git push origin feature/awesome-feature

# 5. Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

| Service | Usage |
|---------|-------|
| [Expo](https://expo.dev) | Development platform |
| [Firebase](https://firebase.google.com) | Auth, Database, Notifications |
| [Groq](https://groq.com) | AI/LLM API |
| [React Native Paper](https://callstack.github.io/react-native-paper) | UI Components |
| [Catbox.moe](https://catbox.moe) | Free file hosting |

---

<p align="center">
  <b>Made with ❤️ by students, for students</b>
  <br><br>
  <sub>If this project helped you, consider giving it a ⭐</sub>
</p>

<p align="center">
  <sub>Version 1.0.0 • November 2025</sub>
</p>
