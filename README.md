# MR BunkManager

A comprehensive attendance management and student collaboration platform built with React Native (Expo) and Firebase.

## Download

**[Download Android App (APK)](https://github.com/mithun50/MR_BunkManager/releases/download/v1.0.0/Mr-BunkManagerv1beta.apk)**

**[Use Web App](https://mr-bunk-manager-idtl.vercel.app)** - Access the app directly in your browser (Login only)

## Overview

MR BunkManager helps students track their attendance, manage their class schedule, collaborate with peers through study groups, and share study materials. The app features an AI-powered assistant that provides personalized attendance advice.

## Features

### Core Features

- **Attendance Tracking**: Track attendance across all subjects with visual analytics
- **Smart Dashboard**: View overall and subject-wise attendance with donut charts
- **Timetable Management**: Add, edit, and manage class schedules
- **Attendance Calculator**: Know how many classes you can bunk or must attend

### Social Features

- **Study Groups**: Create and join study groups with real-time chat
- **Notes Sharing**: Share study materials (text, PDFs, images, links)
- **Social Feed**: Follow classmates and see their shared notes
- **Comments & Likes**: Engage with shared content

### AI Features

- **BunkBot AI Assistant**: Get personalized attendance advice
- **Voice Bot**: Voice-based interaction with AI assistant
- **OCR Timetable Extraction**: Extract class schedules from images using OCR.space API
- **AI Timetable Parsing**: Parse extracted text into structured timetable entries using Groq AI

### Additional Features

- **Push Notifications**: Daily reminders and class notifications
- **Offline Support**: Queue operations when offline
- **Dark/Light Theme**: System theme support
- **File Uploads**: Google Drive and Catbox.moe integration
- **Responsive Design**: Adaptive UI for mobile, tablet, and desktop
- **Web App Support**: Access via browser with Expo Web

## Tech Stack

### Frontend (Mobile App)

| Technology | Purpose |
|------------|---------|
| React Native 0.81 | Cross-platform mobile framework |
| Expo SDK 54 | Development and build tooling |
| Expo Router | File-based navigation |
| React Native Paper | Material Design UI components |
| Zustand | State management |
| Firebase JS SDK | Authentication & Firestore |
| React Native Reanimated | Animations |
| Groq API | AI chat (Llama 4 Maverick) |
| OCR.space API | Image text extraction |

### Backend (Notification Server)

| Technology | Purpose |
|------------|---------|
| Node.js 18+ | Runtime |
| Express.js | HTTP server |
| Firebase Admin SDK | FCM notifications |
| Google Drive API | File storage |
| Vercel/Railway | Deployment |

### Database & Storage

| Service | Purpose |
|---------|---------|
| Firebase Firestore | Primary database |
| Firebase Authentication | User auth |
| Google Drive | Note file storage |
| Catbox.moe | Avatar image hosting |
| AsyncStorage | Local cache |

## Project Structure

```
MR_BunkManager/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── email-verification.tsx
│   │   └── forgot-password.tsx
│   ├── (onboarding)/             # Onboarding flow
│   │   └── index.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx             # Dashboard
│   │   ├── timetable.tsx
│   │   ├── attendance.tsx
│   │   ├── groups.tsx
│   │   └── profile.tsx
│   ├── note/[id].tsx             # Note detail
│   ├── user/[id].tsx             # User profile
│   ├── create-note.tsx
│   ├── search-users.tsx
│   └── _layout.tsx               # Root layout
├── src/
│   ├── hooks/                    # Custom React hooks
│   │   ├── useResponsive.ts      # Responsive design utilities
│   │   └── index.ts              # Hook exports
│   ├── components/               # Reusable components
│   │   ├── ChatBot.tsx           # AI assistant
│   │   ├── VoiceBot.tsx          # Voice assistant
│   │   ├── DonutChart.tsx        # Attendance chart
│   │   ├── NetworkMonitor.tsx    # Connectivity
│   │   ├── ThemeSwitcher.tsx     # Theme toggle
│   │   ├── notes/                # Notes components
│   │   │   ├── NoteCard.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   └── UserCard.tsx
│   │   └── groups/               # Groups components
│   │       ├── GroupCard.tsx
│   │       ├── GroupChatScreen.tsx
│   │       ├── MessageBubble.tsx
│   │       ├── CreateGroupModal.tsx
│   │       ├── MembersModal.tsx
│   │       └── AddMembersModal.tsx
│   ├── screens/                  # Screen implementations
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── community/
│   │   └── groups/
│   ├── services/                 # API & business logic
│   │   ├── authService.ts        # Firebase auth
│   │   ├── firestoreService.ts   # Database operations
│   │   ├── chatService.ts        # AI chat API
│   │   ├── ocrService.ts         # OCR.space image text extraction
│   │   ├── timetableParserService.ts # AI timetable parsing
│   │   ├── notesService.ts       # Notes CRUD
│   │   ├── groupsService.ts      # Groups & chat
│   │   ├── socialService.ts      # Likes, comments, saves
│   │   ├── followService.ts      # Social graph
│   │   ├── notificationService.ts
│   │   ├── cacheService.ts       # Local caching
│   │   ├── offlineQueueService.ts
│   │   ├── imageUploadService.ts
│   │   ├── fileUploadService.ts
│   │   └── googleDriveService.ts
│   ├── store/                    # Zustand stores
│   │   ├── authStore.ts
│   │   ├── networkStore.ts
│   │   ├── themeStore.ts
│   │   ├── notesStore.ts
│   │   └── groupsStore.ts
│   ├── types/                    # TypeScript definitions
│   │   ├── user.ts
│   │   ├── notes.ts
│   │   └── groups.ts
│   └── config/
│       ├── firebase.ts
│       └── theme.ts
├── backend/                      # Notification server
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── sendNotification.js   # FCM logic
│   │   └── driveUpload.js        # Google Drive
│   ├── api/
│   │   └── index.js              # Vercel serverless
│   └── cron-service/             # Scheduled tasks
├── assets/
│   └── images/
├── app.config.js                 # Expo configuration
├── package.json
└── google-services.json          # Firebase Android config
```

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for Android builds)
- Firebase project

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mithun50/MR_BunkManager.git
   cd MR_BunkManager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

   # AI Service
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key

   # OCR Service (Optical Character Recognition)
   EXPO_PUBLIC_OCR_API_KEY=your_ocr_space_api_key

   # Backend
   EXPO_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
   ```

4. **Add Firebase configuration**
   - Download `google-services.json` from Firebase Console
   - Place it in the project root

5. **Start development server**
   ```bash
   npx expo start
   ```

### Building for Production

```bash
# Configure EAS
eas build:configure

# Build Android APK
eas build -p android --profile preview

# Build Android App Bundle (for Play Store)
eas build -p android --profile production
```

## Backend Setup

See [backend/README.md](backend/README.md) for backend deployment instructions.

### Quick Start

```bash
cd backend
npm install
npm start
```

### Environment Variables (Backend)

```env
FIREBASE_SERVICE_ACCOUNT=<JSON credentials>
GOOGLE_DRIVE_FOLDER_ID=<folder ID>
PORT=3000
```

## Database Schema

### Firestore Collections

```
users/
├── {userId}
│   ├── displayName, email, photoURL
│   ├── college, course, department, semester
│   ├── rollNumber, section
│   ├── minimumAttendance
│   ├── onboardingCompleted
│   └── Subcollections:
│       ├── timetable/
│       ├── subjects/
│       └── followers/

notes/
├── {noteId}
│   ├── title, description, content
│   ├── contentType (text|pdf|image|link)
│   ├── authorId, authorName
│   ├── subject, tags[]
│   ├── isPublic
│   ├── likesCount, commentsCount, savesCount
│   └── Subcollections:
│       ├── likes/
│       └── comments/

groups/
├── {groupId}
│   ├── name, description
│   ├── category (study|project|social|general)
│   ├── isPrivate, memberCount
│   ├── createdBy, createdByName
│   └── Subcollections:
│       ├── members/
│       └── messages/

pushTokens/
├── {token}  # Token as document ID
│   ├── userId
│   ├── tokenType (expo|fcm)
│   └── active
```

## API Endpoints

### Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| POST | `/save-token` | Register push token |
| DELETE | `/delete-token` | Remove push token |
| POST | `/send-notification` | Send to specific user |
| POST | `/send-notification-all` | Broadcast to all |
| POST | `/send-daily-reminders` | Personalized daily reminders |
| POST | `/send-class-reminders` | Class reminder (30/10 min before) |
| POST | `/notify-group-members` | Group activity notification |
| POST | `/notify-followers` | New note notification |
| POST | `/upload` | Upload to Google Drive |
| POST | `/upload-catbox` | Upload to Catbox.moe |
| GET | `/note/:noteId` | Deep link handler |

## Key Services

### authService
- Email/password authentication
- Google Sign-In
- Email verification
- Password reset

### firestoreService
- User profile CRUD
- Timetable management
- Subject attendance tracking
- Offline queue integration

### chatService
- AI chat with Groq API
- Attendance context awareness
- Image analysis support

### ocrService
- OCR (Optical Character Recognition) using OCR.space API
- Extract text from images (JPG, PNG, GIF, WebP, BMP, TIFF)
- Platform support: Web and Native (Android/iOS)
- Auto-detection of image MIME types

### timetableParserService
- AI-powered parsing of OCR text using Groq API
- Converts extracted text to structured TimetableEntry objects
- Intelligent day/time normalization and validation

### groupsService
- Group CRUD operations
- Real-time messaging
- Member management
- File sharing in chats

### notesService
- Note creation and editing
- Feed generation
- Search and filtering
- File attachments

### socialService
- Likes, comments, saves
- Download tracking

### followService
- Follow/unfollow users
- Follower suggestions
- Social graph queries

## State Management

### Zustand Stores

| Store | Purpose |
|-------|---------|
| `authStore` | User authentication state |
| `networkStore` | Connectivity monitoring |
| `themeStore` | Theme preference (light/dark/system) |
| `notesStore` | Note interactions cache |
| `groupsStore` | Group and chat state |

## Offline Support

The app supports offline functionality through:

1. **Cache Service**: Stores user profile, subjects, timetable, attendance records
2. **Offline Queue**: Queues write operations when offline
3. **Network Monitor**: Detects connectivity changes
4. **Auto-sync**: Processes queue when back online

## Push Notifications

### Notification Types

- **Daily Reminders**: Tomorrow's class schedule (8 AM)
- **Class Reminders**: 30 and 10 minutes before class
- **Group Activity**: New messages, files, calls
- **New Notes**: When followed users share content

### Scheduled Tasks

```
08:00 AM IST - Daily reminders
09:25 AM IST - 30-minute class reminders
09:45 AM IST - 10-minute class reminders
02:25 PM IST - 30-minute class reminders
02:45 PM IST - 10-minute class reminders
```

## Development Team

| Name | Role | Responsibilities | Contact |
|------|------|------------------|---------|
| **Mithun Gowda B** | Core Developer | Main Dev, Full-Stack Development | mithungowda.b7411@gmail.com |
| **Nevil Dsouza** | Team Leader | Core Dev, Testing | nevilansondsouza@gmail.com |
| **Naren V** | Developer | UI Designer | narenbhaskar2007@gmail.com |
| **Manas Habbu** | Developer | Documentation, Presentation, Design | manaskiranhabbu@gmail.com |
| **Manasvi R** | Developer | Documentation, Presentation Design | manasvi0523@gmail.com |
| **Lavanya** | Developer | Documentation, Presentation | Kk7318069@gmail.com |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/mithun50/MR_BunkManager/issues) page.

---

**Package**: `com.idtl.mrbunkmanager`
**Version**: 1.0.0
**Min SDK**: Android 6.0+ (API 23)
