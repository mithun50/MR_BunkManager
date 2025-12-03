---
layout: default
title: Codebase Documentation
description: Complete source code documentation and line-by-line analysis for MR BunkManager
---

<style>
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

  .code-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 24px;
    transition: all 0.3s ease;
  }

  .code-card:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.1);
  }

  .code-card h3 {
    color: #fff;
    font-size: 1.2em;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .file-badge {
    font-size: 0.7em;
    padding: 4px 12px;
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border-radius: 20px;
    font-weight: 500;
  }

  .line-badge {
    font-size: 0.7em;
    padding: 4px 12px;
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border-radius: 20px;
    font-weight: 500;
  }

  .code-card p {
    color: rgba(255,255,255,0.6);
    font-size: 0.95em;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin: 30px 0;
  }

  .stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
  }

  .stat-number {
    font-size: 2em;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }

  .stat-label {
    color: rgba(255,255,255,0.5);
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tree-box {
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 24px;
    overflow-x: auto;
    margin: 20px 0;
    -webkit-overflow-scrolling: touch;
  }

  .tree-box pre {
    margin: 0;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    white-space: pre;
    display: block;
    min-width: max-content;
  }

  .tree-box code {
    color: rgba(255,255,255,0.7);
    font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.85em;
    line-height: 1.6;
    display: block;
  }

  .analysis-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  .analysis-table th {
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

  .analysis-table td {
    padding: 14px 16px;
    color: rgba(255,255,255,0.6);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 0.9em;
  }

  .analysis-table tr:last-child td {
    border-bottom: none;
  }

  .analysis-table code {
    background: rgba(255,255,255,0.08);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85em;
  }

  @media (max-width: 768px) {
    .page-header h1 {
      font-size: 2em;
    }
    .code-card {
      padding: 20px;
    }
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
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

    .code-card {
      padding: 16px;
      border-radius: 16px;
    }

    .tree-box {
      padding: 16px;
      border-radius: 12px;
      margin: 16px 0;
    }

    .tree-box code {
      font-size: 0.75em;
      line-height: 1.5;
    }

    .stats-grid {
      gap: 12px;
    }

    .stat-card {
      padding: 16px;
    }

    .stat-number {
      font-size: 1.6em;
    }

    .back-link {
      padding: 8px 16px;
      font-size: 0.85em;
    }

    .analysis-table {
      font-size: 0.85em;
    }

    .analysis-table th,
    .analysis-table td {
      padding: 10px 12px;
    }
  }

  @media (max-width: 400px) {
    .page-header h1 {
      font-size: 1.5em;
    }

    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }

    .stat-card {
      padding: 12px;
    }

    .stat-number {
      font-size: 1.4em;
    }

    .tree-box {
      padding: 12px;
    }

    .tree-box code {
      font-size: 0.7em;
    }

    .code-card h3 {
      font-size: 1em;
      flex-wrap: wrap;
    }

    .file-badge, .line-badge {
      font-size: 0.65em;
    }
  }
</style>

<div class="page-header">
  <a href="{{ '/' | relative_url }}" class="back-link">← Back to Home</a>
  <h1>Codebase Documentation</h1>
  <p>Complete source code analysis with line-by-line documentation</p>
</div>

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-number">110+</div>
    <div class="stat-label">Source Files</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">9,000+</div>
    <div class="stat-label">Lines of Code</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">15</div>
    <div class="stat-label">Services</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">5</div>
    <div class="stat-label">Zustand Stores</div>
  </div>
</div>

<div class="section-divider">
  <h2>Directory Structure</h2>
  <p>Complete project organization</p>
</div>

<div class="tree-box">
<pre><code>MR_BunkManager/
├── app/                              # Expo Router navigation
│   ├── (auth)/                       # Authentication screens
│   │   ├── login.tsx                 # Email/password + Google login
│   │   ├── signup.tsx                # User registration
│   │   ├── email-verification.tsx    # Email verification flow
│   │   ├── forgot-password.tsx       # Password reset
│   │   └── _layout.tsx               # Auth group layout
│   ├── (onboarding)/                 # Onboarding flow
│   │   └── index.tsx                 # Profile setup wizard
│   ├── (tabs)/                       # Main app tabs
│   │   ├── index.tsx                 # Dashboard/home
│   │   ├── timetable.tsx             # Class schedule
│   │   ├── attendance.tsx            # Attendance tracking
│   │   ├── groups.tsx                # Study groups
│   │   ├── profile.tsx               # User profile
│   │   └── _layout.tsx               # Tab navigator
│   ├── note/[id].tsx                 # Dynamic: Note detail
│   ├── user/[id].tsx                 # Dynamic: User profile
│   ├── create-note.tsx               # Note creation
│   └── _layout.tsx                   # Root layout
│
├── src/                              # Source code
│   ├── components/                   # React components (15+ files)
│   ├── screens/                      # Screen implementations (13 files)
│   ├── services/                     # Business logic (15 files)
│   ├── store/                        # Zustand stores (5 files)
│   ├── types/                        # TypeScript definitions (3 files)
│   └── config/                       # Configuration (2 files)
│
├── backend/                          # Node.js server
│   ├── src/
│   │   ├── index.js                  # Express server (1106 lines)
│   │   ├── sendNotification.js       # Notification logic
│   │   └── driveUpload.js            # Google Drive API
│   ├── config/
│   │   └── firebase.js               # Admin SDK
│   └── cron-service/                 # Scheduled tasks
│
└── docs/                             # Documentation</code></pre>
</div>

<div class="section-divider">
  <h2>Backend Server Analysis</h2>
  <p>Line-by-line breakdown of the Express server</p>
</div>

<div class="code-card">
  <h3>
    backend/src/index.js
    <span class="file-badge">Express.js</span>
    <span class="line-badge">1106 lines</span>
  </h3>
  <p>Main Express server handling push notifications, file uploads, and deep links. All times in IST (Asia/Kolkata).</p>

  <table class="analysis-table">
    <tr><th>Lines</th><th>Purpose</th></tr>
    <tr><td><code>1-30</code></td><td>Module imports (express, cors, helmet, multer, firebase)</td></tr>
    <tr><td><code>31-46</code></td><td>Environment config (PORT, APP_ENV, TIMEZONE)</td></tr>
    <tr><td><code>47-70</code></td><td>Multer file upload config (50MB limit, image/PDF filter)</td></tr>
    <tr><td><code>71-106</code></td><td>Middleware stack (Helmet, CORS, JSON parser, rate limiting)</td></tr>
    <tr><td><code>107-135</code></td><td>Firebase init and IST time utilities</td></tr>
    <tr><td><code>136-206</code></td><td><code>POST /save-token</code> - Push token registration</td></tr>
    <tr><td><code>207-263</code></td><td><code>DELETE /delete-token</code> - Token removal</td></tr>
    <tr><td><code>264-320</code></td><td><code>POST /send-notification</code> - User notifications</td></tr>
    <tr><td><code>321-476</code></td><td><code>POST /notify-group-members</code> - Group activity alerts</td></tr>
    <tr><td><code>477-526</code></td><td><code>POST /notify-followers</code> - New note alerts</td></tr>
    <tr><td><code>527-575</code></td><td><code>POST /send-notification-all</code> - Broadcast</td></tr>
    <tr><td><code>576-646</code></td><td>Daily and class reminder endpoints</td></tr>
    <tr><td><code>647-710</code></td><td>Token retrieval endpoints</td></tr>
    <tr><td><code>711-862</code></td><td>File upload routes (Google Drive, Catbox.moe)</td></tr>
    <tr><td><code>863-1035</code></td><td><code>GET /note/:noteId</code> - Deep link HTML handler</td></tr>
    <tr><td><code>1036-1106</code></td><td>Error handlers, 404, server startup</td></tr>
  </table>
</div>

<div class="section-divider">
  <h2>Services Layer Analysis</h2>
  <p>Business logic and Firebase operations</p>
</div>

<div class="code-card">
  <h3>
    groupsService.ts
    <span class="file-badge">TypeScript</span>
    <span class="line-badge">719 lines</span>
  </h3>
  <p>Handles all group operations including CRUD, member management, real-time messaging, and notifications.</p>

  <table class="analysis-table">
    <tr><th>Lines</th><th>Method</th><th>Purpose</th></tr>
    <tr><td><code>35-79</code></td><td><code>createGroup()</code></td><td>Create group with creator as admin</td></tr>
    <tr><td><code>84-104</code></td><td><code>getGroup()</code></td><td>Fetch single group by ID</td></tr>
    <tr><td><code>109-139</code></td><td><code>getPublicGroups()</code></td><td>List public groups (client-side sort)</td></tr>
    <tr><td><code>144-173</code></td><td><code>getUserGroups()</code></td><td>Get user's joined groups</td></tr>
    <tr><td><code>178-205</code></td><td><code>subscribeToMyGroups()</code></td><td>Real-time group subscription</td></tr>
    <tr><td><code>288-320</code></td><td><code>addMember()</code></td><td>Add user to group + increment count</td></tr>
    <tr><td><code>325-345</code></td><td><code>removeMember()</code></td><td>Remove user + decrement count</td></tr>
    <tr><td><code>410-451</code></td><td><code>sendMessage()</code></td><td>Send chat message + update activity</td></tr>
    <tr><td><code>488-516</code></td><td><code>subscribeToMessages()</code></td><td>Real-time message listener</td></tr>
    <tr><td><code>680-715</code></td><td><code>notifyGroupMembers()</code></td><td>Push notifications to members</td></tr>
  </table>
</div>

<div class="code-card">
  <h3>
    authService.ts
    <span class="file-badge">TypeScript</span>
  </h3>
  <p>Firebase authentication operations including email/password and Google Sign-In.</p>

  <table class="analysis-table">
    <tr><th>Method</th><th>Description</th></tr>
    <tr><td><code>signUp(email, password, displayName)</code></td><td>Create account + send verification email</td></tr>
    <tr><td><code>signIn(email, password)</code></td><td>Email/password authentication</td></tr>
    <tr><td><code>signInWithGoogle()</code></td><td>OAuth via Google Sign-In</td></tr>
    <tr><td><code>sendVerificationEmail()</code></td><td>Resend email verification</td></tr>
    <tr><td><code>resetPassword(email)</code></td><td>Password reset email</td></tr>
    <tr><td><code>signOut()</code></td><td>Log out current user</td></tr>
  </table>
</div>

<div class="code-card">
  <h3>
    chatService.ts
    <span class="file-badge">TypeScript</span>
  </h3>
  <p>Groq API integration for BunkBot AI assistant with context injection.</p>

  <table class="analysis-table">
    <tr><th>Feature</th><th>Description</th></tr>
    <tr><td>Model</td><td>Llama 4 Maverick (meta-llama/llama-4-maverick-17b-128e-instruct)</td></tr>
    <tr><td>Temperature</td><td>0.7</td></tr>
    <tr><td>Max Tokens</td><td>2048</td></tr>
    <tr><td>Context</td><td>Attendance data, timetable, user preferences</td></tr>
    <tr><td>Image Support</td><td>Base64 image analysis</td></tr>
    <tr><td>Quick Prompts</td><td>Pre-defined attendance-related questions</td></tr>
  </table>
</div>

<div class="section-divider">
  <h2>Component Analysis</h2>
  <p>Key React Native components</p>
</div>

<div class="code-card">
  <h3>
    ChatBot.tsx
    <span class="file-badge">React Native</span>
    <span class="line-badge">793 lines</span>
  </h3>
  <p>AI chat interface with multi-conversation support, voice input, and image attachments.</p>

  <table class="analysis-table">
    <tr><th>Lines</th><th>Feature</th></tr>
    <tr><td><code>7-49</code></td><td>Imports (React, RN Paper, Expo modules)</td></tr>
    <tr><td><code>65-82</code></td><td>State declarations (chats, messages, input, etc.)</td></tr>
    <tr><td><code>84-97</code></td><td>Speech recognition event handlers</td></tr>
    <tr><td><code>99-122</code></td><td><code>toggleRecording()</code> - Voice input control</td></tr>
    <tr><td><code>134-146</code></td><td>useEffect hooks (load, save, scroll)</td></tr>
    <tr><td><code>152-196</code></td><td>Chat management (switch, create, delete)</td></tr>
    <tr><td><code>197-214</code></td><td>Drawer animation functions</td></tr>
    <tr><td><code>216-254</code></td><td>Image picker (camera/gallery)</td></tr>
    <tr><td><code>255-319</code></td><td><code>handleSend()</code> - Main message handler</td></tr>
    <tr><td><code>348-625</code></td><td>JSX render (header, messages, input, drawer)</td></tr>
    <tr><td><code>626-793</code></td><td>StyleSheet definitions</td></tr>
  </table>
</div>

<div class="section-divider">
  <h2>State Management</h2>
  <p>Zustand stores for reactive state</p>
</div>

<div class="code-card">
  <h3>
    authStore.ts
    <span class="file-badge">Zustand</span>
    <span class="line-badge">77 lines</span>
  </h3>
  <p>Authentication state with Firebase observer and push notification registration.</p>

  <table class="analysis-table">
    <tr><th>State</th><th>Type</th><th>Purpose</th></tr>
    <tr><td><code>user</code></td><td><code>User | null</code></td><td>Firebase User object</td></tr>
    <tr><td><code>loading</code></td><td><code>boolean</code></td><td>Auth loading state</td></tr>
    <tr><td><code>initialized</code></td><td><code>boolean</code></td><td>Has auth been checked</td></tr>
    <tr><td><code>pushToken</code></td><td><code>string | null</code></td><td>Device push token</td></tr>
  </table>

  <table class="analysis-table">
    <tr><th>Action</th><th>Description</th></tr>
    <tr><td><code>setUser(user)</code></td><td>Set current user</td></tr>
    <tr><td><code>initializeAuth()</code></td><td>Start Firebase auth listener</td></tr>
    <tr><td><code>refreshUser()</code></td><td>Force refresh from Firebase</td></tr>
  </table>
</div>

<div class="code-card">
  <h3>Other Stores</h3>

  <table class="analysis-table">
    <tr><th>Store</th><th>State</th><th>Purpose</th></tr>
    <tr><td><code>networkStore</code></td><td><code>isOnline, lastOnlineTime</code></td><td>Connectivity monitoring</td></tr>
    <tr><td><code>themeStore</code></td><td><code>isDarkMode, mode</code></td><td>Theme preference (light/dark/system)</td></tr>
    <tr><td><code>notesStore</code></td><td><code>likedNotes, savedNotes</code></td><td>Note interaction cache</td></tr>
    <tr><td><code>groupsStore</code></td><td><code>groups, messages, unreadCounts</code></td><td>Groups and chat state</td></tr>
  </table>
</div>

<div class="section-divider">
  <h2>Type Definitions</h2>
  <p>TypeScript interfaces</p>
</div>

<div class="code-card">
  <h3>Core Types</h3>

  <div class="tree-box">
<pre><code>// types/user.ts
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  college: string;
  course: string;
  department: string;
  semester: string;
  rollNumber: string;
  section?: string;
  minimumAttendance: number;
  onboardingCompleted: boolean;
}

// types/notes.ts
type NoteContentType = 'text' | 'pdf' | 'image' | 'link';

interface Note {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description?: string;
  contentType: NoteContentType;
  content: string;
  fileUrl?: string;
  tags: string[];
  isPublic: boolean;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// types/groups.ts
interface Group {
  id: string;
  name: string;
  description: string;
  category: 'study' | 'project' | 'social' | 'general';
  isPrivate: boolean;
  members: string[];
  memberCount: number;
  lastActivity?: Date;
}

interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  message: string;
  fileUrl?: string;
  createdAt: Date;
}</code></pre>
  </div>
</div>

<div class="section-divider">
  <h2>Service Summary</h2>
  <p>All 15 services and their responsibilities</p>
</div>

<div class="code-card">
  <table class="analysis-table">
    <tr><th>Service</th><th>File</th><th>Purpose</th></tr>
    <tr><td>Auth</td><td><code>authService.ts</code></td><td>Firebase auth operations</td></tr>
    <tr><td>Firestore</td><td><code>firestoreService.ts</code></td><td>User profile, timetable, subjects</td></tr>
    <tr><td>Chat</td><td><code>chatService.ts</code></td><td>Groq AI integration</td></tr>
    <tr><td>Chat Storage</td><td><code>chatStorageService.ts</code></td><td>Chat history persistence</td></tr>
    <tr><td>Notes</td><td><code>notesService.ts</code></td><td>Notes CRUD, feed, search</td></tr>
    <tr><td>Groups</td><td><code>groupsService.ts</code></td><td>Groups, members, real-time chat</td></tr>
    <tr><td>Social</td><td><code>socialService.ts</code></td><td>Likes, comments, saves</td></tr>
    <tr><td>Follow</td><td><code>followService.ts</code></td><td>Follow/unfollow, suggestions</td></tr>
    <tr><td>Notification</td><td><code>notificationService.ts</code></td><td>Push token registration</td></tr>
    <tr><td>Cache</td><td><code>cacheService.ts</code></td><td>AsyncStorage caching</td></tr>
    <tr><td>Offline Queue</td><td><code>offlineQueueService.ts</code></td><td>Offline operation queue</td></tr>
    <tr><td>Image Upload</td><td><code>imageUploadService.ts</code></td><td>Catbox.moe uploads</td></tr>
    <tr><td>File Upload</td><td><code>fileUploadService.ts</code></td><td>Upload coordination</td></tr>
    <tr><td>Google Drive</td><td><code>googleDriveService.ts</code></td><td>Google Drive API</td></tr>
    <tr><td>Gemini</td><td><code>geminiService.ts</code></td><td>Alternative AI service</td></tr>
  </table>
</div>
