---
layout: default
title: Architecture Documentation
description: Technical architecture guide for MR BunkManager application
---

<style>
  /* Page Header */
  .page-header {
    margin-bottom: 60px;
    padding-bottom: 40px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .page-header h1 {
    font-size: 2.8em;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .page-header p {
    color: rgba(255,255,255,0.5);
    font-size: 1.15em;
    margin-bottom: 24px;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    font-size: 0.9em;
    padding: 10px 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .back-link:hover {
    background: rgba(255,255,255,0.06);
    color: #fff;
    transform: translateX(-4px);
  }

  /* Section Dividers */
  .section-divider {
    margin: 60px 0 40px;
    padding-top: 40px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .section-divider h2 {
    font-size: 1.8em;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
  }

  .section-divider p {
    color: rgba(255,255,255,0.4);
    font-size: 1em;
  }

  /* Architecture Card */
  .arch-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 24px;
    transition: all 0.3s ease;
  }

  .arch-card:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.1);
  }

  .arch-card h3 {
    color: #fff;
    font-size: 1.3em;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .arch-card h4 {
    color: rgba(255,255,255,0.5);
    font-size: 0.8em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 24px 0 12px;
  }

  .arch-card p {
    color: rgba(255,255,255,0.6);
    font-size: 0.95em;
    line-height: 1.7;
  }

  /* Code blocks styling */
  pre {
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 20px;
    overflow-x: auto;
    margin: 12px 0;
  }

  pre code {
    color: rgba(255,255,255,0.8);
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.85em;
    line-height: 1.6;
    background: transparent;
  }

  /* Diagram Box */
  .diagram-box {
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 20px;
    overflow-x: auto;
    margin: 12px 0;
  }

  .diagram-box pre {
    margin: 0;
    background: transparent;
    border: none;
    padding: 0;
  }

  .diagram-box code {
    color: rgba(255,255,255,0.8);
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.8em;
    line-height: 1.5;
  }

  /* Layer Card */
  .layer-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 16px;
  }

  .layer-card h4 {
    color: #fff;
    font-size: 1.1em;
    font-weight: 600;
    margin-bottom: 12px;
  }

  /* Table Styling */
  .arch-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  .arch-table th {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
    font-size: 0.75em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .arch-table td {
    padding: 14px 16px;
    color: rgba(255,255,255,0.6);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 0.9em;
  }

  .arch-table tr:last-child td {
    border-bottom: none;
  }

  .arch-table code {
    background: rgba(255,255,255,0.08);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85em;
  }

  /* Info Box */
  .info-box {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  }

  .info-box p {
    color: rgba(255,255,255,0.7);
    margin: 0;
    font-size: 0.9em;
  }

  /* Flow List */
  .flow-list {
    list-style: none;
    padding: 0;
    margin: 16px 0;
  }

  .flow-list li {
    color: rgba(255,255,255,0.6);
    padding: 10px 0 10px 28px;
    position: relative;
    border-left: 2px solid rgba(255,255,255,0.1);
    margin-left: 10px;
  }

  .flow-list li::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 14px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: 2px solid rgba(255,255,255,0.3);
  }

  /* Team Grid */
  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 20px;
  }

  .team-member {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 20px;
    text-align: center;
  }

  .team-member h4 {
    color: #fff;
    font-size: 1em;
    margin-bottom: 4px;
  }

  .team-member .role {
    color: rgba(255,255,255,0.4);
    font-size: 0.85em;
    margin-bottom: 8px;
  }

  .team-member .resp {
    color: rgba(255,255,255,0.5);
    font-size: 0.8em;
  }

  /* Version Table */
  .version-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .version-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 14px;
    text-align: center;
  }

  .version-item .name {
    color: rgba(255,255,255,0.5);
    font-size: 0.8em;
    margin-bottom: 4px;
  }

  .version-item .ver {
    color: #fff;
    font-weight: 600;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .page-header h1 {
      font-size: 2em;
    }

    .arch-card {
      padding: 20px;
    }

    .diagram-box {
      padding: 16px;
    }

    .diagram-box code {
      font-size: 0.7em;
    }
  }

  @media (max-width: 600px) {
    .page-header {
      margin-bottom: 40px;
      padding-bottom: 30px;
    }

    .page-header h1 {
      font-size: 1.8em;
    }

    .page-header p {
      font-size: 1em;
    }

    .section-divider {
      margin: 40px 0 30px;
      padding-top: 30px;
    }

    .section-divider h2 {
      font-size: 1.4em;
    }

    .arch-card {
      padding: 20px;
      border-radius: 16px;
    }

    .arch-card h3 {
      font-size: 1.1em;
      margin-bottom: 16px;
      padding-bottom: 12px;
    }

    .diagram-box {
      padding: 16px;
      border-radius: 12px;
      margin: 16px 0;
    }

    .diagram-box code {
      font-size: 0.7em;
      line-height: 1.4;
    }

    .layer-card {
      padding: 16px;
      border-radius: 12px;
    }

    .back-link {
      padding: 8px 16px;
      font-size: 0.85em;
    }

    .arch-table th,
    .arch-table td {
      padding: 10px 12px;
      font-size: 0.85em;
    }
  }

  @media (max-width: 400px) {
    .page-header h1 {
      font-size: 1.5em;
    }

    .arch-card {
      padding: 16px;
    }

    .arch-card h3 {
      font-size: 1em;
    }

    .diagram-box {
      padding: 12px;
    }

    .diagram-box code {
      font-size: 0.6em;
      line-height: 1.3;
    }

    .tech-badge {
      font-size: 0.65em;
      padding: 4px 8px;
    }

    .layer-card {
      padding: 12px;
    }

    .layer-card h4 {
      font-size: 0.95em;
    }
  }
</style>

<div class="page-header">
  <a href="{{ '/' | relative_url }}" class="back-link">← Back to Home</a>
  <h1>Architecture Documentation</h1>
  <p>Technical architecture guide for the MR BunkManager application</p>
</div>

<div class="arch-card">
  <h3>System Architecture Overview</h3>
  <div class="diagram-box">
    <pre><code>┌─────────────────────────────────────────────────────────────────────┐
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
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                                 │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │   │
│  │  │ Firebase Auth   │  │ Firestore DB    │  │ AsyncStorage │  │   │
│  │  └─────────────────┘  └─────────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘</code></pre>
  </div>
</div>

<div class="section-divider">
  <h2>Layer Architecture</h2>
  <p>Detailed breakdown of each application layer</p>
</div>

<div class="arch-card">
  <h3>1. Presentation Layer</h3>
  <h4>Navigation Structure (Expo Router v4)</h4>
  <div class="diagram-box">
    <pre><code>app/
├── _layout.tsx              # Root layout with providers
├── index.tsx                # Entry point (redirects based on auth)
├── (auth)/                  # Auth group (unauthenticated)
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
├── (onboarding)/            # Onboarding flow
│   └── index.tsx
├── (tabs)/                  # Main app tabs (authenticated)
│   ├── index.tsx            # Dashboard
│   ├── timetable.tsx
│   ├── attendance.tsx
│   ├── groups.tsx
│   └── profile.tsx
├── note/[id].tsx            # Dynamic route: Note detail
├── user/[id].tsx            # Dynamic route: User profile
└── create-note.tsx</code></pre>
  </div>

  <h4>Component Hierarchy</h4>
  <div class="diagram-box">
    <pre><code>Components/
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
│   └── CommentSection       # Comments UI
│
└── Groups Components
    ├── GroupCard            # Group preview card
    ├── GroupChatScreen      # Full chat interface
    └── MessageBubble        # Chat message</code></pre>
  </div>
</div>

<div class="arch-card">
  <h3>2. State Management Layer</h3>
  <p>Zustand-based state management with clear separation of concerns.</p>

  <h4>Store Responsibilities</h4>
  <table class="arch-table">
    <tr><th>Store</th><th>State</th><th>Purpose</th></tr>
    <tr><td><code>authStore</code></td><td>user, isLoading</td><td>Firebase auth state, session</td></tr>
    <tr><td><code>notesStore</code></td><td>interactions</td><td>Note like/save state cache</td></tr>
    <tr><td><code>groupsStore</code></td><td>currentGroup, messages</td><td>Active group chat state</td></tr>
    <tr><td><code>themeStore</code></td><td>theme</td><td>Light/dark/system theme</td></tr>
    <tr><td><code>networkStore</code></td><td>isConnected</td><td>Connectivity monitoring</td></tr>
  </table>

  <h4>State Flow</h4>
  <div class="diagram-box">
    <pre><code>User Action → Store Action → Service Call → Firebase → Store Update → UI Re-render
     │                                                        │
     └────────────── Optimistic Update (UI) ◄─────────────────┘</code></pre>
  </div>
</div>

<div class="arch-card">
  <h3>3. Service Layer</h3>

  <div class="layer-card">
    <h4>Authentication Services</h4>
    <pre><code>authService.ts
├── signUp(email, password, displayName)
├── signIn(email, password)
├── signInWithGoogle()
├── signOut()
└── resetPassword(email)</code></pre>
  </div>

  <div class="layer-card">
    <h4>Data Services</h4>
    <pre><code>firestoreService.ts
├── User Profile CRUD
├── Timetable Management
└── Subject Attendance Tracking

notesService.ts
├── Note CRUD Operations
├── Feed Generation
└── Search &amp; Filtering

groupsService.ts
├── Group CRUD
├── Member Management
└── Real-time Messaging</code></pre>
  </div>

  <div class="layer-card">
    <h4>Infrastructure Services</h4>
    <pre><code>cacheService.ts
├── AsyncStorage Operations
└── User Data Cache

offlineQueueService.ts
├── Queue Operations
└── Process When Online

notificationService.ts
├── Register Push Token
└── Handle Incoming</code></pre>
  </div>
</div>

<div class="arch-card">
  <h3>4. Data Layer - Firestore Schema</h3>
  <div class="diagram-box">
    <pre><code>Firestore Database
│
├── users/{userId}
│   ├── displayName, email, photoURL
│   ├── college, course, department
│   ├── minimumAttendance (default: 75)
│   │
│   ├── timetable/{entryId}
│   │   └── day, subject, startTime, endTime, type
│   │
│   ├── subjects/{subjectId}
│   │   └── name, attended, total, type
│   │
│   └── following/{followingId}
│
├── notes/{noteId}
│   ├── title, description, content
│   ├── contentType, fileUrl, fileName
│   ├── authorId, authorName
│   ├── likesCount, commentsCount, savesCount
│   │
│   ├── likes/{userId}
│   ├── comments/{commentId}
│   └── saves/{userId}
│
├── groups/{groupId}
│   ├── name, description, category
│   ├── isPrivate, memberCount
│   │
│   ├── members/{userId}
│   └── messages/{messageId}
│
└── pushTokens/{tokenId}
    └── userId, token, tokenType, active</code></pre>
  </div>
</div>

<div class="section-divider">
  <h2>Offline Architecture</h2>
  <p>Offline-first strategy with queue-based sync</p>
</div>

<div class="arch-card">
  <h3>Offline-First Strategy</h3>
  <div class="diagram-box">
    <pre><code>┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE-FIRST ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Action                     Network Status                  │
│       │                               │                          │
│       ▼                               ▼                          │
│  ┌──────────────────────────────────────────┐                   │
│  │           NETWORK STORE                   │                   │
│  │    isConnected: boolean                   │                   │
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
│  └───────────────┘        └────────┬────────┘                   │
│                                    │                             │
│                                    ▼                             │
│                           ┌─────────────────┐                   │
│                           │ When Online:    │                   │
│                           │ Process Queue   │                   │
│                           └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘</code></pre>
  </div>
</div>

<div class="section-divider">
  <h2>OCR Timetable Extraction</h2>
  <p>Image-to-timetable extraction pipeline</p>
</div>

<div class="arch-card">
  <h3>OCR Extraction Flow</h3>
  <div class="diagram-box">
    <pre><code>User selects image (camera/gallery)
       │
       ▼
┌─────────────────────────────────────────┐
│           OCR SERVICE                    │
│  ┌─────────────────────────────────┐    │
│  │   Platform Detection             │    │
│  │   - Web: File input (base64)     │    │
│  │   - Native: ImagePicker + File   │    │
│  └─────────────────────────────────┘    │
│                │                         │
│                ▼                         │
│  ┌─────────────────────────────────┐    │
│  │   Image Processing               │    │
│  │   - Convert to base64            │    │
│  │   - Detect MIME type             │    │
│  │   - Format for API               │    │
│  └─────────────────────────────────┘    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│            OCR.space API                 │
│   Engine: 2 (advanced)                   │
│   Table Detection: Enabled               │
│   Auto Scale: Enabled                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
         Extracted Text (OCR Result)
                   │
                   ▼
┌─────────────────────────────────────────┐
│      TIMETABLE PARSER SERVICE            │
│  ┌─────────────────────────────────┐    │
│  │   AI Prompt Engineering          │    │
│  │   - System prompt for parsing    │    │
│  │   - JSON output format           │    │
│  │   - Day/time normalization       │    │
│  └─────────────────────────────────┘    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│            GROQ API                      │
│   Model: Llama 4 Maverick                │
│   Temperature: 0.1 | Max Tokens: 4096    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
      Structured TimetableEntry[]
                   │
                   ▼
┌─────────────────────────────────────────┐
│      TIMETABLE MANUAL ENTRY SCREEN       │
│   - Review extracted entries             │
│   - Edit/Add/Delete entries              │
│   - Save to Firestore                    │
└─────────────────────────────────────────┘</code></pre>
  </div>
</div>

<div class="section-divider">
  <h2>AI Integration</h2>
  <p>Chat service architecture with Groq API</p>
</div>

<div class="arch-card">
  <h3>AI Chat Architecture</h3>
  <div class="diagram-box">
    <pre><code>User Input (text/voice/image)
       │
       ▼
┌─────────────────────────────────────────┐
│           CHAT SERVICE                   │
│  ┌─────────────────────────────────┐    │
│  │   Build Context                  │    │
│  │   - Attendance data              │    │
│  │   - Timetable info               │    │
│  │   - User preferences             │    │
│  └─────────────────────────────────┘    │
│                │                         │
│                ▼                         │
│  ┌─────────────────────────────────┐    │
│  │   Format Message                 │    │
│  │   - System prompt (BunkBot)      │    │
│  │   - Context injection            │    │
│  └─────────────────────────────────┘    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│            GROQ API                      │
│   Model: Llama 4 Maverick (scout)        │
│   Temperature: 0.7 | Max Tokens: 2048    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
           Response to User</code></pre>
  </div>
</div>

<div class="section-divider">
  <h2>Push Notification Flow</h2>
  <p>FCM-based notification system</p>
</div>

<div class="arch-card">
  <h3>Notification Triggers</h3>
  <table class="arch-table">
    <tr><th>Trigger</th><th>Endpoint</th><th>Schedule</th></tr>
    <tr><td>Daily Reminder</td><td><code>/send-daily-reminders</code></td><td>8:00 AM IST</td></tr>
    <tr><td>Class Reminder (30min)</td><td><code>/send-class-reminders</code></td><td>Before class</td></tr>
    <tr><td>Class Reminder (10min)</td><td><code>/send-class-reminders</code></td><td>Before class</td></tr>
    <tr><td>Group Activity</td><td><code>/notify-group-members</code></td><td>Real-time</td></tr>
    <tr><td>New Note</td><td><code>/notify-followers</code></td><td>On upload</td></tr>
  </table>
</div>

<div class="section-divider">
  <h2>File Upload Architecture</h2>
  <p>Storage strategy for different content types</p>
</div>

<div class="arch-card">
  <h3>Storage Strategy</h3>
  <table class="arch-table">
    <tr><th>Content Type</th><th>Storage</th><th>Reason</th></tr>
    <tr><td>Note PDFs</td><td>Google Drive</td><td>Permanent, large files</td></tr>
    <tr><td>Note Images</td><td>Google Drive</td><td>Permanent, thumbnails</td></tr>
    <tr><td>Profile Photos</td><td>Catbox.moe</td><td>Simple, CORS-friendly</td></tr>
    <tr><td>Group Photos</td><td>Catbox.moe</td><td>Simple, fast</td></tr>
    <tr><td>Chat Files</td><td>Google Drive</td><td>Permanent, trackable</td></tr>
  </table>
</div>

<div class="section-divider">
  <h2>Security Architecture</h2>
  <p>Authentication and authorization patterns</p>
</div>

<div class="arch-card">
  <h3>Authentication Flow</h3>
  <div class="diagram-box">
    <pre><code>Login Screen
     │
     ├──► Email/Password → Firebase signInWithEmailAndPassword
     │
     └──► Google Sign-In → GoogleSignIn.signIn() → Firebase signInWithCredential
                                    │
                                    ▼
                        Firebase Auth State Observer
                                    │
                                    ▼
                          authStore.setUser(user)
                                    │
                                    ▼
                    ┌─────────────────────────────────────────┐
                    │  Route Guard (_layout.tsx)              │
                    │                                          │
                    │  if (!user) → redirect to /login        │
                    │  if (!emailVerified) → /email-verify    │
                    │  if (!onboarded) → /onboarding          │
                    │  else → /(tabs)                          │
                    └─────────────────────────────────────────┘</code></pre>
  </div>
</div>

<div class="section-divider">
  <h2>Directory Structure</h2>
  <p>Project organization reference</p>
</div>

<div class="arch-card">
  <div class="diagram-box">
    <pre><code>MR_BunkManager/
├── app/                     # Expo Router screens
├── src/
│   ├── hooks/               # Custom React hooks
│   │   └── useResponsive.ts # Responsive design utilities
│   ├── components/          # Reusable UI components
│   │   ├── notes/           # Notes feature components
│   │   └── groups/          # Groups feature components
│   ├── screens/             # Complex screen implementations
│   ├── services/            # Business logic &amp; API
│   ├── store/               # Zustand state stores
│   ├── types/               # TypeScript definitions
│   └── config/              # App configuration
├── backend/                 # Express notification server
│   ├── src/
│   ├── api/                 # Vercel serverless
│   └── cron-service/
├── assets/                  # Static assets
├── docs/                    # Documentation
└── app.config.js            # Expo configuration</code></pre>
  </div>
</div>

<div class="section-divider">
  <h2>Development Team</h2>
  <p>The people who built MR BunkManager</p>
</div>

<div class="team-grid">
  <div class="team-member">
    <h4>Mithun Gowda B</h4>
    <div class="role">Core Developer</div>
    <div class="resp">Main Dev, Full-Stack, Architecture</div>
  </div>
  <div class="team-member">
    <h4>Nevil Dsouza</h4>
    <div class="role">Team Leader</div>
    <div class="resp">Core Development, Testing</div>
  </div>
  <div class="team-member">
    <h4>Naren V</h4>
    <div class="role">Developer</div>
    <div class="resp">UI/UX Design</div>
  </div>
  <div class="team-member">
    <h4>Manas Habbu</h4>
    <div class="role">Developer</div>
    <div class="resp">Documentation, Design</div>
  </div>
  <div class="team-member">
    <h4>Manasvi R</h4>
    <div class="role">Developer</div>
    <div class="resp">Documentation, Presentation</div>
  </div>
  <div class="team-member">
    <h4>Lavanya</h4>
    <div class="role">Developer</div>
    <div class="resp">Documentation, Presentation</div>
  </div>
</div>

<div class="section-divider">
  <h2>Version Information</h2>
  <p>Current technology versions</p>
</div>

<div class="version-grid">
  <div class="version-item">
    <div class="name">React Native</div>
    <div class="ver">0.81</div>
  </div>
  <div class="version-item">
    <div class="name">Expo SDK</div>
    <div class="ver">54</div>
  </div>
  <div class="version-item">
    <div class="name">Zustand</div>
    <div class="ver">5.x</div>
  </div>
  <div class="version-item">
    <div class="name">Expo Router</div>
    <div class="ver">4.x</div>
  </div>
  <div class="version-item">
    <div class="name">RN Paper</div>
    <div class="ver">5.x</div>
  </div>
  <div class="version-item">
    <div class="name">Node.js</div>
    <div class="ver">18+</div>
  </div>
</div>
