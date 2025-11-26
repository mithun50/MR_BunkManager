---
layout: default
title: API Documentation
description: Complete API reference for MR BunkManager backend and frontend services
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

  /* Section Headers */
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

  /* API Card */
  .api-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 24px;
    transition: all 0.3s ease;
  }

  .api-card:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.1);
  }

  .api-method {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .method-badge {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 0.75em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .method-get {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .method-post {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .method-delete {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .endpoint-path {
    font-family: 'SF Mono', 'Fira Code', monospace;
    color: #fff;
    font-size: 1.05em;
    font-weight: 500;
  }

  .api-card h4 {
    color: rgba(255,255,255,0.5);
    font-size: 0.8em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 20px 0 12px;
  }

  .api-card h4:first-of-type {
    margin-top: 0;
  }

  .api-description {
    color: rgba(255,255,255,0.6);
    font-size: 0.95em;
    line-height: 1.6;
    margin-bottom: 20px;
  }

  /* Code blocks styling */
  .code-block {
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 20px;
    overflow-x: auto;
    margin: 12px 0;
  }

  .code-block code {
    color: rgba(255,255,255,0.8);
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.85em;
    line-height: 1.6;
  }

  /* Status Table */
  .status-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  .status-table th {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
    font-size: 0.75em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .status-table td {
    padding: 12px 16px;
    color: rgba(255,255,255,0.6);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 0.9em;
  }

  .status-table tr:last-child td {
    border-bottom: none;
  }

  .status-code {
    font-family: 'SF Mono', monospace;
    font-weight: 600;
  }

  .status-2xx { color: #22c55e; }
  .status-4xx { color: #f59e0b; }
  .status-5xx { color: #ef4444; }

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

  /* Type badges */
  .type-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 0.75em;
    font-family: 'SF Mono', monospace;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.1);
  }

  /* Service Section */
  .service-section {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 24px;
  }

  .service-section h3 {
    color: #fff;
    font-size: 1.3em;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .page-header h1 {
      font-size: 2em;
    }

    .api-card {
      padding: 20px;
    }

    .api-method {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
</style>

<div class="page-header">
  <a href="../" class="back-link">← Back to Home</a>
  <h1>API Documentation</h1>
  <p>Complete API reference for the backend notification server and frontend services</p>
</div>

<div class="info-box">
  <p><strong>Base URL:</strong> <code>https://your-backend.vercel.app</code> or <code>http://localhost:3000</code></p>
</div>

<div class="section-divider">
  <h2>Health & Status</h2>
  <p>Server health monitoring endpoint</p>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-get">GET</span>
    <span class="endpoint-path">/health</span>
  </div>
  <p class="api-description">Check server status and uptime.</p>
  <h4>Response</h4>

```json
{
  "status": "healthy",
  "message": "MR BunkManager Notification Server is running",
  "timestamp": "26/11/2025, 03:30:45 PM",
  "timezone": "Asia/Kolkata (IST)",
  "uptime": 3600.5
}
```
</div>

<div class="section-divider">
  <h2>Push Token Management</h2>
  <p>Register and manage device push tokens</p>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-post">POST</span>
    <span class="endpoint-path">/save-token</span>
  </div>
  <p class="api-description">Register a device push token for notifications.</p>
  <h4>Request Body</h4>

```json
{
  "userId": "firebase_user_id",
  "token": "ExponentPushToken[xxxxx] or FCM_token"
}
```

  <h4>Response</h4>

```json
{
  "success": true,
  "message": "Push token saved successfully",
  "userId": "firebase_user_id",
  "tokenType": "expo",
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

  <h4>Error Codes</h4>
  <table class="status-table">
    <tr><th>Code</th><th>Description</th></tr>
    <tr><td class="status-code status-4xx">400</td><td>Missing userId or token</td></tr>
    <tr><td class="status-code status-4xx">400</td><td>Invalid token format</td></tr>
    <tr><td class="status-code status-5xx">500</td><td>Firebase error</td></tr>
  </table>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-delete">DELETE</span>
    <span class="endpoint-path">/delete-token</span>
  </div>
  <p class="api-description">Remove push token(s) for a user or specific token.</p>
  <h4>Request Body</h4>

```json
{
  "token": "ExponentPushToken[xxxxx]"
}
```

or

```json
{
  "userId": "firebase_user_id"
}
```
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-get">GET</span>
    <span class="endpoint-path">/tokens/:userId</span>
  </div>
  <p class="api-description">Get all push tokens for a specific user.</p>
  <h4>Response</h4>

```json
{
  "success": true,
  "userId": "firebase_user_id",
  "tokens": [
    {
      "id": "token_id",
      "token": "ExponentPushToken[xxxxx]",
      "tokenType": "expo",
      "createdAt": "timestamp",
      "active": true
    }
  ],
  "count": 1
}
```
</div>

<div class="section-divider">
  <h2>Notification Sending</h2>
  <p>Send push notifications to users</p>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-post">POST</span>
    <span class="endpoint-path">/send-notification</span>
  </div>
  <p class="api-description">Send notification to a specific user.</p>
  <h4>Request Body</h4>

```json
{
  "userId": "firebase_user_id",
  "title": "Custom Title (optional)",
  "body": "Custom message (optional)",
  "data": {
    "type": "custom",
    "key": "value"
  }
}
```

  <h4>Response</h4>

```json
{
  "success": true,
  "message": "Notification sent successfully",
  "result": {
    "userId": "firebase_user_id",
    "sent": 1,
    "failed": 0,
    "invalidTokensRemoved": 0
  }
}
```
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-post">POST</span>
    <span class="endpoint-path">/send-notification-all</span>
  </div>
  <p class="api-description">Broadcast notification to all registered users.</p>
  <h4>Request Body</h4>

```json
{
  "title": "System Update",
  "body": "Important announcement",
  "data": { "type": "system" }
}
```
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-post">POST</span>
    <span class="endpoint-path">/send-daily-reminders</span>
  </div>
  <p class="api-description">Send personalized daily reminders about tomorrow's classes. Generates contextual messages based on attendance data.</p>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-post">POST</span>
    <span class="endpoint-path">/send-class-reminders</span>
  </div>
  <p class="api-description">Send reminders for classes starting soon.</p>
  <h4>Request Body</h4>

```json
{
  "minutesBefore": 30
}
```

  <p class="api-description">Valid values: <code>30</code> or <code>10</code></p>
</div>

<div class="section-divider">
  <h2>Group Notifications</h2>
  <p>Notify group members about activity</p>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-post">POST</span>
    <span class="endpoint-path">/notify-group-members</span>
  </div>
  <p class="api-description">Notify group members about activity (messages, files, calls).</p>
  <h4>Request Body</h4>

```json
{
  "groupId": "group_id",
  "groupName": "Study Group",
  "senderId": "user_id",
  "senderName": "John Doe",
  "type": "message",
  "extra": {
    "message": "Hello everyone!"
  }
}
```

  <h4>Activity Types</h4>
  <table class="status-table">
    <tr><th>Type</th><th>Extra Fields</th><th>Notification</th></tr>
    <tr><td><code>message</code></td><td>message</td><td>"John Doe: Hello..."</td></tr>
    <tr><td><code>file</code></td><td>fileName</td><td>"John Doe shared a file"</td></tr>
    <tr><td><code>call</code></td><td>isVideo</td><td>"John Doe started a call"</td></tr>
  </table>
</div>

<div class="section-divider">
  <h2>Follower Notifications</h2>
  <p>Notify followers about new content</p>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-post">POST</span>
    <span class="endpoint-path">/notify-followers</span>
  </div>
  <p class="api-description">Notify followers when user uploads a new note.</p>
  <h4>Request Body</h4>

```json
{
  "authorId": "user_id",
  "authorName": "John Doe",
  "noteId": "note_id",
  "title": "Biology Notes Chapter 5",
  "subject": "Biology"
}
```
</div>

<div class="section-divider">
  <h2>File Upload</h2>
  <p>Upload files to cloud storage</p>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-post">POST</span>
    <span class="endpoint-path">/upload</span>
  </div>
  <p class="api-description">Upload file to Google Drive. Accepts <code>multipart/form-data</code> with <code>file</code> field.</p>
  <p class="api-description"><strong>Allowed Types:</strong> JPEG, PNG, GIF, WebP, PDF (max 50MB)</p>
  <h4>Response</h4>

```json
{
  "success": true,
  "fileId": "google_drive_file_id",
  "fileName": "timestamp_filename.pdf",
  "mimeType": "application/pdf",
  "size": 2048576,
  "webViewLink": "https://drive.google.com/file/d/{id}/view",
  "webContentLink": "https://drive.google.com/uc?id={id}&export=download",
  "thumbnailLink": "https://drive.google.com/thumbnail?id={id}&sz=w400"
}
```
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-post">POST</span>
    <span class="endpoint-path">/upload-catbox</span>
  </div>
  <p class="api-description">Upload file to Catbox.moe (CORS-friendly for web/avatars).</p>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-delete">DELETE</span>
    <span class="endpoint-path">/upload/:fileId</span>
  </div>
  <p class="api-description">Delete file from Google Drive.</p>
</div>

<div class="section-divider">
  <h2>Deep Links</h2>
  <p>Handle shared content links</p>
</div>

<div class="api-card">
  <div class="api-method">
    <span class="method-badge method-get">GET</span>
    <span class="endpoint-path">/note/:noteId</span>
  </div>
  <p class="api-description">Web page handler for shared note links. Returns HTML with Open Graph meta tags and auto-redirects to app on mobile.</p>
  <p class="api-description"><strong>Deep Link Format:</strong> <code>mrbunkmanager://note/{noteId}</code></p>
</div>

<div class="section-divider">
  <h2>Error Handling</h2>
  <p>Standard error response format</p>
</div>

<div class="api-card">
  <h4>Error Response Format</h4>

```json
{
  "success": false,
  "error": "Error message",
  "details": "Technical details",
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

  <h4>HTTP Status Codes</h4>
  <table class="status-table">
    <tr><th>Code</th><th>Description</th></tr>
    <tr><td class="status-code status-2xx">200</td><td>Success</td></tr>
    <tr><td class="status-code status-4xx">400</td><td>Bad Request (validation error)</td></tr>
    <tr><td class="status-code status-4xx">404</td><td>Not Found</td></tr>
    <tr><td class="status-code status-4xx">429</td><td>Rate Limit Exceeded</td></tr>
    <tr><td class="status-code status-5xx">500</td><td>Server Error</td></tr>
  </table>
</div>

<div class="api-card">
  <h4>Rate Limiting</h4>
  <p class="api-description">Window: 15 minutes | Max Requests: 100 per window per IP</p>

```json
{
  "error": "Too many requests",
  "retryAfter": 900
}
```
</div>

<div class="section-divider">
  <h2>Frontend Services</h2>
  <p>Client-side service API reference</p>
</div>

<div class="service-section">
  <h3>authService</h3>

```typescript
signUp(email: string, password: string, displayName: string): Promise<User>
signIn(email: string, password: string): Promise<User>
signInWithGoogle(): Promise<User>
sendVerificationEmail(): Promise<void>
resetPassword(email: string): Promise<void>
signOut(): Promise<void>
getCurrentUser(): User | null
```
</div>

<div class="service-section">
  <h3>firestoreService</h3>

```typescript
// User Profile
createUserProfile(uid: string, data: UserProfile): Promise<void>
getUserProfile(uid: string): Promise<UserProfile | null>
updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void>

// Timetable
saveTimetable(uid: string, entries: TimetableEntry[]): Promise<void>
getTimetable(uid: string): Promise<TimetableEntry[]>

// Subjects & Attendance
getSubjects(uid: string): Promise<Subject[]>
addSubject(uid: string, subject: Subject): Promise<void>
updateSubjectAttendance(uid: string, subjectId: string, attended: number, total: number): Promise<void>
```
</div>

<div class="service-section">
  <h3>notesService</h3>

```typescript
createNote(authorId: string, data: CreateNoteInput): Promise<Note>
updateNote(noteId: string, data: Partial<Note>): Promise<void>
deleteNote(noteId: string, authorId: string): Promise<void>
getNoteWithContext(noteId: string, userId: string): Promise<FeedNote>
getFeedNotes(userId: string, followingIds: string[], lastDoc?: any): Promise<PaginatedResult<FeedNote>>
searchNotes(userId: string, query: string, filters?: NoteFilters): Promise<FeedNote[]>
```
</div>

<div class="service-section">
  <h3>groupsService</h3>

```typescript
createGroup(name: string, description: string, category: string, isPrivate: boolean, userId: string, userName: string): Promise<Group>
joinGroup(groupId: string, userId: string, userName: string): Promise<void>
leaveGroup(groupId: string, userId: string): Promise<void>
sendMessage(groupId: string, userId: string, userName: string, photoURL: string | undefined, message: string): Promise<void>
subscribeToMessages(groupId: string, callback: (messages: GroupMessage[]) => void): Unsubscribe
```
</div>

<div class="service-section">
  <h3>socialService</h3>

```typescript
likeNote(noteId: string, userId: string): Promise<void>
unlikeNote(noteId: string, userId: string): Promise<void>
toggleLike(noteId: string, userId: string): Promise<boolean>
addComment(noteId: string, comment: Omit<NoteComment, 'id' | 'createdAt'>): Promise<NoteComment>
saveNote(noteId: string, userId: string): Promise<void>
getSavedNotes(userId: string, lastDoc?: any): Promise<PaginatedResult<Note>>
```
</div>

<div class="service-section">
  <h3>followService</h3>

```typescript
followUser(followerId: string, followingId: string): Promise<void>
unfollowUser(followerId: string, followingId: string): Promise<void>
getFollowing(userId: string): Promise<string[]>
getFollowers(userId: string): Promise<string[]>
isFollowing(followerId: string, followingId: string): Promise<boolean>
getSuggestedUsers(userId: string, college: string, course: string): Promise<PublicUserProfile[]>
```
</div>

<div class="info-box">
  <p><strong>Timezone:</strong> All timestamps are in Indian Standard Time (IST) - Asia/Kolkata<br>
  <strong>Format:</strong> DD/MM/YYYY, HH:MM:SS AM/PM</p>
</div>
