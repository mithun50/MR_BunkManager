---
layout: default
title: Architecture Documentation
description: Technical architecture guide for MR BunkManager application
---

# MR BunkManager Architecture Documentation

Technical architecture guide for the MR BunkManager application.

[← Back to Home](../)

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MR BUNKMANAGER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PRESENTATION LAYER                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │   │
│  │  │   Screens   │ │ Components  │ │    Navigation (Expo)    │ │   │
│  │  │  (app/*)    │ │  (src/*)    │ │    Router v4            │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     STATE LAYER (Zustand)                     │   │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐   │   │
│  │  │authStore │ │notesStore │ │groupsStore│ │ themeStore   │   │   │
│  │  └──────────┘ └───────────┘ └───────────┘ └──────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │                   networkStore                        │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     SERVICE LAYER                             │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │   │
│  │  │ authService  │ │firestoreServ │ │  notificationService │  │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘  │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │   │
│  │  │ notesService │ │ groupsService│ │   socialService      │  │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘  │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │   │
│  │  │ cacheService │ │offlineQueue  │ │   chatService        │  │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                                 │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │   │
│  │  │ Firebase Auth   │  │ Firestore DB    │  │ AsyncStorage │  │   │
│  │  └─────────────────┘  └─────────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
┌───────────▼───────────┐         ┌─────────────▼─────────────┐
│   BACKEND SERVER      │         │    EXTERNAL SERVICES      │
│  (Express/Vercel)     │         │                           │
│  ┌─────────────────┐  │         │  ┌─────────────────────┐  │
│  │ FCM Notifications│  │         │  │   Groq AI API       │  │
│  │ Google Drive     │  │         │  │   (Llama 4 Maverick)│  │
│  │ File Upload      │  │         │  └─────────────────────┘  │
│  │ Deep Links       │  │         │  ┌─────────────────────┐  │
│  └─────────────────┘  │         │  │   Catbox.moe        │  │
└───────────────────────┘         │  │   (Image hosting)   │  │
                                  │  └─────────────────────┘  │
                                  │  ┌─────────────────────┐  │
                                  │  │   Google Drive      │  │
                                  │  │   (File storage)    │  │
                                  │  └─────────────────────┘  │
                                  └───────────────────────────┘
```

---

## Layer Architecture

### 1. Presentation Layer

#### Navigation Structure (Expo Router v4)

```
app/
├── _layout.tsx              # Root layout with providers
├── index.tsx                # Entry point (redirects based on auth)
├── (auth)/                  # Auth group (unauthenticated)
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   ├── email-verification.tsx
│   └── forgot-password.tsx
├── (onboarding)/            # Onboarding group
│   ├── _layout.tsx
│   └── index.tsx
├── (tabs)/                  # Main app tabs (authenticated)
│   ├── _layout.tsx          # Tab bar configuration
│   ├── index.tsx            # Dashboard
│   ├── timetable.tsx
│   ├── attendance.tsx
│   ├── groups.tsx
│   └── profile.tsx
├── note/[id].tsx            # Dynamic route: Note detail
├── user/[id].tsx            # Dynamic route: User profile
├── create-note.tsx
├── search-users.tsx
└── settings.tsx
```

#### Component Hierarchy

```
Components/
├── Layout Components
│   ├── NetworkMonitor       # Global connectivity status
│   └── ThemeSwitcher        # Theme toggle button
│
├── Feature Components
│   ├── ChatBot              # AI assistant modal
│   ├── VoiceBot             # Voice interaction
│   └── DonutChart           # Attendance visualization
│
├── Notes Components
│   ├── NoteCard             # Note display card
│   ├── NoteEditor           # Rich content editor
│   ├── CommentSection       # Comments UI
│   ├── UserCard             # Author info
│   └── GroupedNotesList     # Notes by author
│
└── Groups Components
    ├── GroupCard            # Group preview card
    ├── GroupChatScreen      # Full chat interface
    ├── MessageBubble        # Chat message
    ├── CreateGroupModal     # Group creation
    ├── MembersModal         # Member list
    └── AddMembersModal      # Member invitation
```

---

### 2. State Management Layer

#### Zustand Store Architecture

```typescript
// Store Pattern
const useStore = create<StoreState>((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,

  // Actions
  setData: (data) => set({ data }),
  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await service.getData();
      set({ data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },

  // Selectors (derived state)
  getFilteredData: () => get().data?.filter(/* ... */),
}));
```

#### Store Responsibilities

| Store | State | Purpose |
|-------|-------|---------|
| `authStore` | user, isLoading, isAuthenticated | Firebase auth state, session management |
| `notesStore` | interactions, setLiked, setSaved | Note like/save state cache |
| `groupsStore` | currentGroup, messages, typing | Active group chat state |
| `themeStore` | theme, setTheme | Light/dark/system theme |
| `networkStore` | isConnected, isInternetReachable | Connectivity monitoring |

#### State Flow

```
User Action → Store Action → Service Call → Firebase → Store Update → UI Re-render
     │                                                        │
     └────────────── Optimistic Update (UI) ◄─────────────────┘
```

---

### 3. Service Layer Architecture

#### Service Categories

**Authentication Services**
```
authService.ts
├── signUp(email, password, displayName)
├── signIn(email, password)
├── signInWithGoogle()
├── signOut()
├── resetPassword(email)
├── sendVerificationEmail()
└── reloadUser()
```

**Data Services**
```
firestoreService.ts
├── User Profile CRUD
├── Timetable Management
├── Subject Attendance Tracking
└── Attendance Records

notesService.ts
├── Note CRUD Operations
├── Feed Generation
├── Search & Filtering
└── File Attachments

groupsService.ts
├── Group CRUD
├── Member Management
├── Real-time Messaging
└── File Sharing
```

**Social Services**
```
socialService.ts
├── Like/Unlike Notes
├── Save/Unsave Notes
├── Comment Management
└── Download Tracking

followService.ts
├── Follow/Unfollow Users
├── Get Followers/Following
├── Suggested Users
└── Public Profiles
```

**Infrastructure Services**
```
cacheService.ts
├── AsyncStorage Operations
├── User Data Cache
├── Attendance Cache
└── Timetable Cache

offlineQueueService.ts
├── Queue Operations
├── Process When Online
├── Operation Types
└── Error Handling

notificationService.ts
├── Register Push Token
├── Request Permissions
├── Send to Backend
└── Handle Incoming
```

---

### 4. Data Layer

#### Firebase Firestore Schema

```
Firestore Database
│
├── users/{userId}
│   ├── displayName: string
│   ├── email: string
│   ├── photoURL: string
│   ├── college: string
│   ├── course: string
│   ├── department: string
│   ├── semester: number
│   ├── rollNumber: string
│   ├── section: string
│   ├── minimumAttendance: number (default: 75)
│   ├── onboardingCompleted: boolean
│   ├── createdAt: timestamp
│   │
│   ├── timetable/{entryId}
│   │   ├── day: string
│   │   ├── subject: string
│   │   ├── startTime: string
│   │   ├── endTime: string
│   │   ├── type: "lecture" | "lab"
│   │   └── room: string
│   │
│   ├── subjects/{subjectId}
│   │   ├── name: string
│   │   ├── attended: number
│   │   ├── total: number
│   │   ├── type: "lecture" | "lab"
│   │   └── createdAt: timestamp
│   │
│   ├── attendanceRecords/{recordId}
│   │   ├── subjectId: string
│   │   ├── date: timestamp
│   │   ├── status: "present" | "absent" | "cancelled"
│   │   └── notes: string
│   │
│   └── following/{followingId}
│       └── followedAt: timestamp
│
├── notes/{noteId}
│   ├── title: string
│   ├── description: string
│   ├── content: string
│   ├── contentType: "text" | "pdf" | "image" | "link"
│   ├── fileUrl: string
│   ├── fileName: string
│   ├── thumbnailUrl: string
│   ├── authorId: string
│   ├── authorName: string
│   ├── authorRollNumber: string
│   ├── authorPhotoURL: string
│   ├── subject: string
│   ├── tags: string[]
│   ├── isPublic: boolean
│   ├── likesCount: number
│   ├── commentsCount: number
│   ├── savesCount: number
│   ├── downloadsCount: number
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   │
│   ├── likes/{userId}
│   │   └── likedAt: timestamp
│   │
│   ├── comments/{commentId}
│   │   ├── userId: string
│   │   ├── userName: string
│   │   ├── userPhotoURL: string
│   │   ├── text: string
│   │   └── createdAt: timestamp
│   │
│   └── saves/{userId}
│       └── savedAt: timestamp
│
├── groups/{groupId}
│   ├── name: string
│   ├── description: string
│   ├── category: "study" | "project" | "social" | "general"
│   ├── isPrivate: boolean
│   ├── photoURL: string
│   ├── memberCount: number
│   ├── createdBy: string
│   ├── createdByName: string
│   ├── createdAt: timestamp
│   │
│   ├── members/{userId}
│   │   ├── userName: string
│   │   ├── photoURL: string
│   │   ├── role: "admin" | "member"
│   │   └── joinedAt: timestamp
│   │
│   └── messages/{messageId}
│       ├── userId: string
│       ├── userName: string
│       ├── userPhotoURL: string
│       ├── message: string
│       ├── fileUrl: string
│       ├── fileName: string
│       ├── fileType: string
│       ├── isSystemMessage: boolean
│       └── createdAt: timestamp
│
└── pushTokens/{tokenId}
    ├── userId: string
    ├── token: string
    ├── tokenType: "expo" | "fcm"
    ├── active: boolean
    └── createdAt: timestamp
```

#### Data Flow Patterns

**Read Pattern (Real-time)**
```
Component
    │
    ├──► useEffect(() => {
    │        const unsubscribe = service.subscribe(callback);
    │        return () => unsubscribe();
    │    }, []);
    │
    └──► Firestore onSnapshot listener
              │
              └──► Automatic UI updates on data change
```

**Write Pattern (Optimistic)**
```
User Action
    │
    ├──► 1. Update local state (optimistic)
    │
    ├──► 2. Call service method
    │         │
    │         └──► Firestore write
    │
    └──► 3. On error: rollback local state
```

---

## Offline Architecture

### Offline-First Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE-FIRST ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   User Action    │    │  Network Status  │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           ▼                       ▼                              │
│  ┌──────────────────────────────────────────┐                   │
│  │           NETWORK STORE                   │                   │
│  │    isConnected: boolean                   │                   │
│  │    isInternetReachable: boolean           │                   │
│  └──────────────────┬───────────────────────┘                   │
│                     │                                            │
│        ┌────────────┴────────────┐                              │
│        ▼                         ▼                              │
│  ┌───────────┐            ┌───────────────┐                     │
│  │  ONLINE   │            │    OFFLINE    │                     │
│  └─────┬─────┘            └───────┬───────┘                     │
│        │                          │                              │
│        ▼                          ▼                              │
│  ┌───────────────┐        ┌─────────────────┐                   │
│  │ Execute Now   │        │ Queue Operation │                   │
│  │ Firestore/API │        │ AsyncStorage    │                   │
│  └───────┬───────┘        └────────┬────────┘                   │
│          │                         │                             │
│          │                         ▼                             │
│          │                ┌─────────────────┐                   │
│          │                │ When Online:    │                   │
│          │                │ Process Queue   │                   │
│          │                └────────┬────────┘                   │
│          │                         │                             │
│          └─────────────────────────┘                             │
│                     │                                            │
│                     ▼                                            │
│            ┌─────────────────┐                                  │
│            │   Update Cache  │                                  │
│            │   AsyncStorage  │                                  │
│            └─────────────────┘                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Cache Strategy

```typescript
// Cache Keys
const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  SUBJECTS: 'subjects',
  TIMETABLE: 'timetable',
  ATTENDANCE_RECORDS: 'attendance_records',
};

// Cache Operations
cacheService = {
  // Read-through cache
  async getWithFallback(key, fetchFn) {
    const cached = await this.get(key);
    if (cached) return cached;

    const fresh = await fetchFn();
    await this.set(key, fresh);
    return fresh;
  },

  // Write-through cache
  async setAndSync(key, data, syncFn) {
    await this.set(key, data);
    if (networkStore.isConnected) {
      await syncFn(data);
    } else {
      await offlineQueueService.addToQueue({
        type: 'SYNC',
        key,
        data,
      });
    }
  },
};
```

### Offline Queue Operations

```typescript
// Operation Types
type QueuedOperation = {
  id: string;
  type: 'ATTENDANCE_UPDATE' | 'SUBJECT_CREATE' | 'TIMETABLE_UPDATE';
  data: any;
  timestamp: number;
  retryCount: number;
};

// Queue Processing
offlineQueueService = {
  async processQueue() {
    const queue = await this.getQueue();

    for (const operation of queue) {
      try {
        await this.executeOperation(operation);
        await this.removeFromQueue(operation.id);
      } catch (error) {
        if (operation.retryCount < MAX_RETRIES) {
          await this.incrementRetry(operation.id);
        } else {
          await this.moveToFailed(operation);
        }
      }
    }
  },
};
```

---

## Real-Time Features

### Firestore Subscriptions

```typescript
// Real-time Message Subscription
groupsService.subscribeToMessages(groupId, (messages) => {
  // Firestore onSnapshot listener
  // Automatically updates when new messages arrive
  setMessages(messages);
}, limit);

// Real-time Group List
groupsService.subscribeToMyGroups(userId, (groups) => {
  // Updates when group data changes
  setMyGroups(groups);
});
```

### Subscription Lifecycle

```
Component Mount
      │
      ├──► Call subscribe method
      │         │
      │         └──► Returns unsubscribe function
      │
      ├──► Store unsubscribe in ref/state
      │
Component Unmount
      │
      └──► Call unsubscribe function
                │
                └──► Firestore listener detached
```

---

## AI Integration

### Chat Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI CHAT ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Input (text/voice/image)                                  │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │           CHAT SERVICE                   │                    │
│  │  ┌─────────────────────────────────┐    │                    │
│  │  │   Build Context                  │    │                    │
│  │  │   - Attendance data              │    │                    │
│  │  │   - Timetable info               │    │                    │
│  │  │   - User preferences             │    │                    │
│  │  │   - Conversation history         │    │                    │
│  │  └─────────────────────────────────┘    │                    │
│  │                │                         │                    │
│  │                ▼                         │                    │
│  │  ┌─────────────────────────────────┐    │                    │
│  │  │   Format Message                 │    │                    │
│  │  │   - System prompt                │    │                    │
│  │  │   - Context injection            │    │                    │
│  │  │   - Image encoding (if any)      │    │                    │
│  │  └─────────────────────────────────┘    │                    │
│  └──────────────────┬──────────────────────┘                    │
│                     │                                            │
│                     ▼                                            │
│  ┌─────────────────────────────────────────┐                    │
│  │            GROQ API                      │                    │
│  │   Model: Llama 4 Maverick (scout)        │                    │
│  │   Temperature: 0.7                       │                    │
│  │   Max Tokens: 2048                       │                    │
│  └──────────────────┬──────────────────────┘                    │
│                     │                                            │
│                     ▼                                            │
│  ┌─────────────────────────────────────────┐                    │
│  │          Response Processing             │                    │
│  │   - Parse response                       │                    │
│  │   - Handle errors                        │                    │
│  │   - Update conversation history          │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AI Context Building

```typescript
const attendanceContext = {
  subjects: [
    { name: 'Mathematics', attended: 45, total: 50, percentage: 90 },
    { name: 'Physics', attended: 38, total: 50, percentage: 76 },
  ],
  overallAttendance: 83,
  minimumRequired: 75,
  tomorrowClasses: [
    { subject: 'Math', time: '09:00', type: 'lecture' },
  ],
};

// System prompt includes:
// - BunkBot persona
// - Attendance context
// - Quick prompts available
// - Response guidelines
```

---

## Push Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   PUSH NOTIFICATION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  APP STARTUP                                                     │
│       │                                                          │
│       ▼                                                          │
│  Request Push Permission                                         │
│       │                                                          │
│       ├──► Denied: Show notification settings prompt             │
│       │                                                          │
│       └──► Granted:                                              │
│                │                                                 │
│                ▼                                                 │
│       Get Expo Push Token                                        │
│                │                                                 │
│                ▼                                                 │
│       Register with Backend                                      │
│       POST /save-token                                           │
│                │                                                 │
│                ▼                                                 │
│       Store in Firestore                                         │
│       pushTokens/{token}                                         │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NOTIFICATION TRIGGER                                            │
│       │                                                          │
│       ├──► Daily Reminder (Cron: 8:00 AM)                       │
│       │         │                                                │
│       │         ▼                                                │
│       │    POST /send-daily-reminders                           │
│       │                                                          │
│       ├──► Class Reminder (Cron: 30/10 min before)              │
│       │         │                                                │
│       │         ▼                                                │
│       │    POST /send-class-reminders                           │
│       │                                                          │
│       ├──► Group Activity (Real-time)                           │
│       │         │                                                │
│       │         ▼                                                │
│       │    POST /notify-group-members                           │
│       │                                                          │
│       └──► New Note (On upload)                                 │
│                 │                                                │
│                 ▼                                                │
│            POST /notify-followers                                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BACKEND PROCESSING                                              │
│       │                                                          │
│       ▼                                                          │
│  Query pushTokens for target users                               │
│       │                                                          │
│       ▼                                                          │
│  Build FCM payload                                               │
│       │                                                          │
│       ▼                                                          │
│  Send via Firebase Admin SDK                                     │
│       │                                                          │
│       ├──► Success: Increment sent count                        │
│       │                                                          │
│       └──► Failure: Remove invalid token                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Upload Architecture

### Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     FILE UPLOAD ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User selects file (image/pdf)                                  │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │   CLIENT SIDE VALIDATION                 │                    │
│  │   - File type check                      │                    │
│  │   - Size limit (50MB)                    │                    │
│  │   - Image compression (if needed)        │                    │
│  └──────────────────┬──────────────────────┘                    │
│                     │                                            │
│        ┌────────────┴────────────┐                              │
│        ▼                         ▼                              │
│  ┌───────────────┐        ┌───────────────┐                     │
│  │ Note Files    │        │ Avatar/Group  │                     │
│  │ (PDF, Images) │        │ Profile Pics  │                     │
│  └───────┬───────┘        └───────┬───────┘                     │
│          │                        │                              │
│          ▼                        ▼                              │
│  ┌───────────────┐        ┌───────────────┐                     │
│  │ Google Drive  │        │  Catbox.moe   │                     │
│  │ POST /upload  │        │/upload-catbox │                     │
│  └───────┬───────┘        └───────┬───────┘                     │
│          │                        │                              │
│          ▼                        ▼                              │
│  ┌───────────────────────────────────────────┐                  │
│  │   Response URLs:                           │                  │
│  │   - webViewLink (preview)                  │                  │
│  │   - webContentLink (download)              │                  │
│  │   - thumbnailLink (thumbnail)              │                  │
│  └───────────────────────────────────────────┘                  │
│                     │                                            │
│                     ▼                                            │
│  Store URLs in Firestore document                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Storage Strategy

| Content Type | Storage | Reason |
|--------------|---------|--------|
| Note PDFs | Google Drive | Permanent, large files |
| Note Images | Google Drive | Permanent, thumbnails |
| Profile Photos | Catbox.moe | Simple, CORS-friendly |
| Group Photos | Catbox.moe | Simple, fast |
| Chat Files | Google Drive | Permanent, trackable |

---

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │  Login Screen   │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ├──► Email/Password                                   │
│           │         │                                            │
│           │         ▼                                            │
│           │    Firebase signInWithEmailAndPassword               │
│           │                                                      │
│           └──► Google Sign-In                                   │
│                     │                                            │
│                     ▼                                            │
│                GoogleSignIn.signIn()                             │
│                     │                                            │
│                     ▼                                            │
│                Firebase signInWithCredential                     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Firebase Auth State Observer                                    │
│       │                                                          │
│       ▼                                                          │
│  authStore.setUser(user)                                        │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │  Route Guard (_layout.tsx)              │                    │
│  │                                          │                    │
│  │  if (!user) → redirect to /login        │                    │
│  │  if (!emailVerified) → /email-verify    │                    │
│  │  if (!onboarded) → /onboarding          │                    │
│  │  else → /(tabs)                          │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Firestore Security Rules Pattern

```javascript
// Notes visibility
match /notes/{noteId} {
  // Anyone can read public notes
  allow read: if resource.data.isPublic == true
              || request.auth.uid == resource.data.authorId;

  // Only author can write
  allow write: if request.auth.uid == resource.data.authorId;
}

// User profile
match /users/{userId} {
  // Users can read any profile
  allow read: if request.auth != null;

  // Users can only write own profile
  allow write: if request.auth.uid == userId;
}

// Groups
match /groups/{groupId} {
  // Members can read
  allow read: if isMember(groupId);

  // Only admin can update
  allow update: if isAdmin(groupId);
}
```

---

## Performance Optimizations

### Image Optimization

```typescript
// Lazy loading with expo-image
<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  transition={200}
  placeholder={blurhash}
/>

// Thumbnail generation (backend)
thumbnailLink: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
```

### List Optimization

```typescript
// FlatList optimizations
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Pagination Pattern

```typescript
// Firestore pagination
const getNextPage = async (lastDoc) => {
  const query = collection(db, 'notes')
    .orderBy('createdAt', 'desc')
    .startAfter(lastDoc)
    .limit(PAGE_SIZE);

  return getDocs(query);
};
```

---

## Error Handling Strategy

### Service Layer

```typescript
// Consistent error handling pattern
async function serviceMethod() {
  try {
    const result = await firestoreOperation();
    return result;
  } catch (error) {
    console.error('Service error:', error);

    // Categorize error
    if (error.code === 'permission-denied') {
      throw new AuthError('Permission denied');
    }
    if (error.code === 'unavailable') {
      // Queue for offline
      await offlineQueueService.add(operation);
      return optimisticResult;
    }

    throw error;
  }
}
```

### UI Layer

```typescript
// Error boundary pattern
<ErrorBoundary fallback={<ErrorScreen />}>
  <Component />
</ErrorBoundary>

// Try-catch in event handlers
const handleAction = async () => {
  try {
    await service.action();
    showSuccess('Action completed');
  } catch (error) {
    showError(error.message);
  }
};
```

---

## Testing Strategy

### Unit Testing

```
Test Structure:
├── __tests__/
│   ├── services/
│   │   ├── authService.test.ts
│   │   ├── notesService.test.ts
│   │   └── ...
│   ├── components/
│   │   ├── NoteCard.test.tsx
│   │   └── ...
│   └── stores/
│       └── authStore.test.ts
```

### Integration Testing

- Firebase Emulator Suite for Firestore/Auth testing
- Mock server for backend API testing
- Detox for E2E mobile testing

---

## Deployment Architecture

### Frontend (Mobile App)

```
Development: expo start → Expo Go / Dev Build
Preview: eas build --profile preview → APK
Production: eas build --profile production → AAB → Play Store
```

### Backend (Notification Server)

```
Development: npm start → localhost:3000
Production: Vercel Serverless Functions
Cron: External cron service → POST endpoints
```

---

## Directory Structure Reference

```
MR_BunkManager/
├── app/                     # Expo Router screens
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── notes/           # Notes feature components
│   │   └── groups/          # Groups feature components
│   ├── screens/             # Complex screen implementations
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── community/
│   │   └── groups/
│   ├── services/            # Business logic & API
│   ├── store/               # Zustand state stores
│   ├── types/               # TypeScript definitions
│   └── config/              # App configuration
├── backend/                 # Express notification server
│   ├── src/
│   ├── api/                 # Vercel serverless
│   └── cron-service/
├── assets/                  # Static assets
├── docs/                    # Documentation
└── app.config.js            # Expo configuration
```

---

## Development Team

| Name | Role | Responsibilities |
|------|------|------------------|
| **Mithun Gowda B** | Core Developer | Main Development, Full-Stack, Architecture |
| **Nevil Dsouza** | Team Leader | Core Development, Testing |
| **Naren V** | Developer | UI/UX Design |
| **Manas Habbu** | Developer | Documentation, Presentation, Design |
| **Manasvi R** | Developer | Documentation, Presentation Design |
| **Lavanya** | Developer | Documentation, Presentation |

---

## Version Information

| Component | Version |
|-----------|---------|
| React Native | 0.81 |
| Expo SDK | 54 |
| Firebase JS SDK | Latest |
| Zustand | 5.x |
| React Native Paper | 5.x |
| Expo Router | 4.x |
| Node.js (Backend) | 18+ |
