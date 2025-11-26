---
layout: default
title: API Documentation
description: Complete API reference for MR BunkManager backend and frontend services
---

# MR BunkManager API Documentation

Complete API reference for the backend notification server and frontend services.

[← Back to Home](../)

## Backend API

Base URL: `https://your-backend.vercel.app` or `http://localhost:3000`

### Health Check

#### GET /health

Check server status and uptime.

**Response**
```json
{
  "status": "healthy",
  "message": "MR BunkManager Notification Server is running",
  "timestamp": "26/11/2025, 03:30:45 PM",
  "timezone": "Asia/Kolkata (IST)",
  "uptime": 3600.5
}
```

---

## Push Token Management

### POST /save-token

Register a device push token for notifications.

**Request Body**
```json
{
  "userId": "firebase_user_id",
  "token": "ExponentPushToken[xxxxx] or FCM_token"
}
```

**Response**
```json
{
  "success": true,
  "message": "Push token saved successfully",
  "userId": "firebase_user_id",
  "tokenType": "expo",
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

**Error Responses**
- `400`: Missing userId or token
- `400`: Invalid token format
- `500`: Firebase error

---

### DELETE /delete-token

Remove push token(s) for a user or specific token.

**Request Body** (one of the following)
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

**Response**
```json
{
  "success": true,
  "message": "Push token deleted successfully",
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

### GET /tokens/:userId

Get all push tokens for a specific user.

**Parameters**
- `userId` (path): Firebase user ID

**Response**
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
  "count": 1,
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

### GET /tokens

Get all registered push tokens (admin endpoint).

**Response**
```json
{
  "success": true,
  "tokens": [...],
  "count": 150,
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

## Notification Sending

### POST /send-notification

Send notification to a specific user.

**Request Body**
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

**Response**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "result": {
    "userId": "firebase_user_id",
    "sent": 1,
    "failed": 0,
    "invalidTokensRemoved": 0
  },
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

### POST /send-notification-all

Broadcast notification to all registered users.

**Request Body**
```json
{
  "title": "System Update",
  "body": "Important announcement",
  "data": { "type": "system" }
}
```

**Response**
```json
{
  "success": true,
  "message": "Notifications sent to all users",
  "result": {
    "totalTokens": 150,
    "sent": 148,
    "failed": 2,
    "invalidTokensRemoved": 2
  },
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

### POST /send-daily-reminders

Send personalized daily reminders about tomorrow's classes.

**Request Body**: Empty

**Response**
```json
{
  "success": true,
  "message": "Daily reminders sent",
  "result": {
    "sent": 145,
    "failed": 5,
    "invalidTokensRemoved": 2,
    "details": [
      {
        "userId": "user1",
        "sent": 1,
        "failed": 0
      }
    ]
  },
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

**Generated Messages**
- Class reminder with time and attendance percentage
- Lab class prioritization
- Warning if below minimum attendance
- Encouragement for good attendance

---

### POST /send-class-reminders

Send reminders for classes starting soon.

**Request Body**
```json
{
  "minutesBefore": 30
}
```

**Valid Values**: `30` or `10`

**Response**
```json
{
  "success": true,
  "message": "30-minute class reminders sent",
  "result": {
    "sent": 45,
    "failed": 1,
    "invalidTokensRemoved": 1
  },
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

## Group Notifications

### POST /notify-group-members

Notify group members about activity.

**Request Body**
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

**Activity Types**
| Type | Extra Fields | Notification Body |
|------|--------------|-------------------|
| `message` | `message` | "John Doe: Hello..." |
| `file` | `fileName` | "John Doe shared a file: notes.pdf" |
| `call` | `isVideo` | "John Doe started a video/voice call" |

**Response**
```json
{
  "success": true,
  "message": "Group members notified",
  "notified": 8,
  "totalMembers": 10,
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

## Follower Notifications

### POST /notify-followers

Notify followers when user uploads a new note.

**Request Body**
```json
{
  "authorId": "user_id",
  "authorName": "John Doe",
  "noteId": "note_id",
  "title": "Biology Notes Chapter 5",
  "subject": "Biology"
}
```

**Response**
```json
{
  "success": true,
  "message": "Followers notified successfully",
  "result": {
    "followersCount": 12,
    "followersWithTokens": 10,
    "followersWithoutTokens": 2,
    "sent": 10,
    "failed": 0
  },
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

## File Upload

### POST /upload

Upload file to Google Drive.

**Request**: `multipart/form-data`
- `file`: Binary file data

**Allowed Types**: JPEG, PNG, GIF, WebP, PDF (max 50MB)

**Response**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "fileId": "google_drive_file_id",
  "fileName": "timestamp_filename.pdf",
  "mimeType": "application/pdf",
  "size": 2048576,
  "webViewLink": "https://drive.google.com/file/d/{id}/view",
  "webContentLink": "https://drive.google.com/uc?id={id}&export=download",
  "thumbnailLink": "https://drive.google.com/thumbnail?id={id}&sz=w400",
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

### POST /upload-catbox

Upload file to Catbox.moe (CORS proxy for web).

**Request**: `multipart/form-data`
- `file`: Binary file data

**Response**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "url": "https://files.catbox.moe/xxxxx.pdf",
  "fileId": "xxxxx",
  "fileName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024576,
  "webViewLink": "https://files.catbox.moe/xxxxx.pdf",
  "webContentLink": "https://files.catbox.moe/xxxxx.pdf",
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

### DELETE /upload/:fileId

Delete file from Google Drive.

**Parameters**
- `fileId` (path): Google Drive file ID

**Response**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

---

## Deep Links

### GET /note/:noteId

Web page handler for shared note links.

**Parameters**
- `noteId` (path): Note ID

**Response**: HTML page with:
- Open Graph meta tags for social sharing
- Auto-redirect to app on mobile devices
- Preview content if app not installed

**Deep Link Format**: `mrbunkmanager://note/{noteId}`

---

## FCM Notification Payload

### Standard Payload Structure

```json
{
  "notification": {
    "title": "Notification Title",
    "body": "Notification body text"
  },
  "data": {
    "type": "notification_type",
    "customKey": "customValue"
  },
  "android": {
    "notification": {
      "color": "#3B82F6",
      "sound": "default",
      "priority": "high",
      "channelId": "default"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1
      }
    }
  }
}
```

### Data Payload Types

**Daily Reminder**
```json
{
  "type": "daily_reminder",
  "attendancePercentage": 78,
  "minimumRequired": 75,
  "tomorrowClasses": [...]
}
```

**Group Activity**
```json
{
  "type": "group_activity",
  "groupId": "group_id",
  "activityType": "message",
  "message": "Hello"
}
```

**New Note**
```json
{
  "type": "new_note",
  "noteId": "note_id",
  "authorId": "author_id",
  "authorName": "John Doe"
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "Error message",
  "details": "Technical details",
  "timestamp": "26/11/2025, 03:30:45 PM"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Server Error |

---

## Rate Limiting

- Window: 15 minutes
- Max Requests: 100 per window per IP
- Response (429):
```json
{
  "error": "Too many requests",
  "retryAfter": 900
}
```

---

## Frontend Services API

### authService

```typescript
// Sign up new user
signUp(email: string, password: string, displayName: string): Promise<User>

// Sign in existing user
signIn(email: string, password: string): Promise<User>

// Sign in with Google
signInWithGoogle(): Promise<User>

// Send verification email
sendVerificationEmail(): Promise<void>

// Reset password
resetPassword(email: string): Promise<void>

// Sign out
signOut(): Promise<void>

// Get current user
getCurrentUser(): User | null

// Reload user data
reloadUser(): Promise<void>
```

### firestoreService

```typescript
// User Profile
createUserProfile(uid: string, data: UserProfile): Promise<void>
getUserProfile(uid: string): Promise<UserProfile | null>
updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void>

// Timetable
saveTimetable(uid: string, entries: TimetableEntry[]): Promise<void>
getTimetable(uid: string): Promise<TimetableEntry[]>
deleteTimetable(uid: string): Promise<void>

// Subjects
getSubjects(uid: string): Promise<Subject[]>
addSubject(uid: string, subject: Subject): Promise<void>
updateSubjectAttendance(uid: string, subjectId: string, attended: number, total: number): Promise<void>
deleteSubject(uid: string, subjectId: string): Promise<void>

// Attendance
addAttendanceRecord(uid: string, record: AttendanceRecord): Promise<void>
getAttendanceRecords(uid: string, subjectId?: string): Promise<AttendanceRecord[]>
```

### notesService

```typescript
// CRUD
createNote(authorId: string, data: CreateNoteInput): Promise<Note>
updateNote(noteId: string, data: Partial<Note>): Promise<void>
deleteNote(noteId: string, authorId: string): Promise<void>

// Queries
getNoteWithContext(noteId: string, userId: string): Promise<FeedNote>
getUserNotes(userId: string, lastDoc?: any): Promise<PaginatedResult<Note>>
getFeedNotes(userId: string, followingIds: string[], lastDoc?: any): Promise<PaginatedResult<FeedNote>>
getExploreNotes(userId: string, filters: NoteFilters, lastDoc?: any): Promise<PaginatedResult<FeedNote>>
searchNotes(userId: string, query: string, filters?: NoteFilters): Promise<FeedNote[]>
```

### groupsService

```typescript
// Group CRUD
createGroup(name: string, description: string, category: string, isPrivate: boolean, userId: string, userName: string, photoURL?: string): Promise<Group>
getGroup(groupId: string): Promise<Group | null>
updateGroup(groupId: string, data: Partial<Group>): Promise<void>
deleteGroup(groupId: string): Promise<void>

// Membership
joinGroup(groupId: string, userId: string, userName: string, photoURL?: string): Promise<void>
leaveGroup(groupId: string, userId: string): Promise<void>
addMember(groupId: string, userId: string, userName: string, photoURL?: string, role: string): Promise<void>
removeMember(groupId: string, userId: string): Promise<void>
updateMemberRole(groupId: string, userId: string, role: string): Promise<void>
getGroupMembers(groupId: string): Promise<GroupMember[]>

// Messages
sendMessage(groupId: string, userId: string, userName: string, photoURL: string | undefined, message: string, fileUrl?: string, fileName?: string, fileType?: string): Promise<void>
subscribeToMessages(groupId: string, callback: (messages: GroupMessage[]) => void, limit?: number): Unsubscribe
deleteMessage(groupId: string, messageId: string): Promise<void>

// Queries
getUserGroups(userId: string): Promise<Group[]>
getPublicGroups(limit?: number): Promise<Group[]>
subscribeToMyGroups(userId: string, callback: (groups: Group[]) => void): Unsubscribe
```

### socialService

```typescript
// Likes
likeNote(noteId: string, userId: string): Promise<void>
unlikeNote(noteId: string, userId: string): Promise<void>
toggleLike(noteId: string, userId: string): Promise<boolean>
isLiked(noteId: string, userId: string): Promise<boolean>

// Comments
addComment(noteId: string, comment: Omit<NoteComment, 'id' | 'createdAt'>): Promise<NoteComment>
deleteComment(noteId: string, commentId: string): Promise<void>
getComments(noteId: string, limit?: number, lastDoc?: any): Promise<PaginatedResult<NoteComment>>

// Saves
saveNote(noteId: string, userId: string): Promise<void>
unsaveNote(noteId: string, userId: string): Promise<void>
toggleSave(noteId: string, userId: string): Promise<boolean>
isSaved(noteId: string, userId: string): Promise<boolean>
getSavedNotes(userId: string, lastDoc?: any): Promise<PaginatedResult<Note>>
```

### followService

```typescript
followUser(followerId: string, followingId: string): Promise<void>
unfollowUser(followerId: string, followingId: string): Promise<void>
getFollowing(userId: string): Promise<string[]>
getFollowers(userId: string): Promise<string[]>
getFollowStats(userId: string): Promise<UserFollowStats>
isFollowing(followerId: string, followingId: string): Promise<boolean>
getPublicProfile(userId: string, currentUserId?: string): Promise<PublicUserProfile>
getSuggestedUsers(userId: string, college: string, course: string, limit?: number): Promise<PublicUserProfile[]>
```

### chatService

```typescript
sendMessage(
  message: string,
  attendanceContext: AttendanceContext | null,
  conversationHistory?: Message[],
  imageBase64?: string
): Promise<string>

quickPrompts: QuickPrompt[]
```

---

## Webhooks & Callbacks

The backend does not currently support webhooks. All real-time updates are handled via Firestore subscriptions on the client.

---

## Timezone

All timestamps are in **Indian Standard Time (IST) - Asia/Kolkata**

Format: `DD/MM/YYYY, HH:MM:SS AM/PM`
