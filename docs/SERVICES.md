---
layout: default
title: Services Documentation
description: Complete documentation for all frontend services in MR BunkManager
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

  .service-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 24px;
    transition: all 0.3s ease;
  }

  .service-card:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.1);
  }

  .service-card h3 {
    color: #fff;
    font-size: 1.3em;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .service-card h4 {
    color: rgba(255,255,255,0.5);
    font-size: 0.8em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 24px 0 12px;
  }

  .service-card p {
    color: rgba(255,255,255,0.6);
    font-size: 0.95em;
    line-height: 1.7;
    margin-bottom: 16px;
  }

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

  .method-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  .method-table th {
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

  .method-table td {
    padding: 12px 16px;
    color: rgba(255,255,255,0.6);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 0.9em;
  }

  .method-table tr:last-child td {
    border-bottom: none;
  }

  .method-table code {
    background: rgba(255,255,255,0.08);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85em;
  }

  .type-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 0.75em;
    font-family: 'SF Mono', monospace;
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

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

  @media (max-width: 768px) {
    .page-header h1 {
      font-size: 2em;
    }
    .service-card {
      padding: 20px;
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

    .service-card {
      padding: 16px;
      border-radius: 16px;
    }

    .method-card {
      padding: 14px;
    }

    .back-link {
      padding: 8px 16px;
      font-size: 0.85em;
    }
  }

  @media (max-width: 400px) {
    .page-header h1 {
      font-size: 1.5em;
    }

    .service-badge {
      font-size: 0.7em;
      padding: 4px 10px;
    }

    .method-name {
      font-size: 0.85em;
    }
  }
</style>

<div class="page-header">
  <a href="{{ '/' | relative_url }}" class="back-link">← Back to Home</a>
  <h1>Services Documentation</h1>
  <p>Complete API reference for all frontend services</p>
</div>

<div class="info-box">
  <p><strong>Pattern:</strong> All services use the singleton pattern and export a single instance. Import using <code>import serviceName from '@/src/services/serviceName'</code></p>
</div>

<div class="section-divider">
  <h2>Authentication Services</h2>
  <p>Firebase authentication operations</p>
</div>

<div class="service-card">
  <h3>authService</h3>
  <p>Handles all authentication operations including email/password and Google Sign-In. Automatically sends verification emails on signup.</p>

  <h4>Methods</h4>
  <pre><code>signUp(email: string, password: string, displayName: string): Promise&lt;User&gt;
signIn(email: string, password: string): Promise&lt;User&gt;
signInWithGoogle(): Promise&lt;User&gt;
sendVerificationEmail(): Promise&lt;void&gt;
resetPassword(email: string): Promise&lt;void&gt;
signOut(): Promise&lt;void&gt;
getCurrentUser(): User | null
deleteAccount(): Promise&lt;void&gt;</code></pre>

  <h4>Usage Example</h4>
  <pre><code>import authService from '@/src/services/authService';

// Sign up new user
const user = await authService.signUp(
  'student@college.edu',
  'password123',
  'John Doe'
);

// Sign in existing user
const user = await authService.signIn(email, password);

// Google Sign-In
const user = await authService.signInWithGoogle();

// Password reset
await authService.resetPassword('student@college.edu');</code></pre>
</div>

<div class="section-divider">
  <h2>Data Services</h2>
  <p>Firestore database operations</p>
</div>

<div class="service-card">
  <h3>firestoreService</h3>
  <p>Core database service for user profiles, timetables, and attendance tracking.</p>

  <h4>User Profile Methods</h4>
  <pre><code>createUserProfile(uid: string, data: UserProfile): Promise&lt;void&gt;
getUserProfile(uid: string): Promise&lt;UserProfile | null&gt;
updateUserProfile(uid: string, data: Partial&lt;UserProfile&gt;): Promise&lt;void&gt;
deleteUserProfile(uid: string): Promise&lt;void&gt;</code></pre>

  <h4>Timetable Methods</h4>
  <pre><code>saveTimetable(uid: string, entries: TimetableEntry[]): Promise&lt;void&gt;
getTimetable(uid: string): Promise&lt;TimetableEntry[]&gt;
addTimetableEntry(uid: string, entry: TimetableEntry): Promise&lt;string&gt;
updateTimetableEntry(uid: string, entryId: string, data: Partial&lt;TimetableEntry&gt;): Promise&lt;void&gt;
deleteTimetableEntry(uid: string, entryId: string): Promise&lt;void&gt;</code></pre>

  <h4>Subjects & Attendance Methods</h4>
  <pre><code>getSubjects(uid: string): Promise&lt;Subject[]&gt;
addSubject(uid: string, subject: Subject): Promise&lt;string&gt;
updateSubject(uid: string, subjectId: string, data: Partial&lt;Subject&gt;): Promise&lt;void&gt;
deleteSubject(uid: string, subjectId: string): Promise&lt;void&gt;
updateSubjectAttendance(uid: string, subjectId: string, attended: number, total: number): Promise&lt;void&gt;
markAttendance(uid: string, subjectId: string, present: boolean): Promise&lt;void&gt;</code></pre>
</div>

<div class="service-card">
  <h3>notesService</h3>
  <p>Notes creation, editing, and feed generation for the collaborative notes feature.</p>

  <h4>CRUD Methods</h4>
  <pre><code>createNote(authorId: string, data: CreateNoteInput): Promise&lt;Note&gt;
updateNote(noteId: string, data: Partial&lt;Note&gt;): Promise&lt;void&gt;
deleteNote(noteId: string, authorId: string): Promise&lt;void&gt;
getNoteById(noteId: string): Promise&lt;Note | null&gt;
getNoteWithContext(noteId: string, userId: string): Promise&lt;FeedNote&gt;</code></pre>

  <h4>Feed & Discovery Methods</h4>
  <pre><code>getFeedNotes(userId: string, followingIds: string[], lastDoc?: any): Promise&lt;PaginatedResult&lt;FeedNote&gt;&gt;
getExploreNotes(userId: string, filters?: NoteFilters, lastDoc?: any): Promise&lt;PaginatedResult&lt;FeedNote&gt;&gt;
getUserNotes(authorId: string, viewerId: string, lastDoc?: any): Promise&lt;PaginatedResult&lt;FeedNote&gt;&gt;
searchNotes(userId: string, query: string, filters?: NoteFilters): Promise&lt;FeedNote[]&gt;</code></pre>

  <h4>Usage Example</h4>
  <pre><code>import notesService from '@/src/services/notesService';

// Create a new note
const note = await notesService.createNote(userId, {
  title: 'Physics Chapter 5 Notes',
  description: 'Complete notes on thermodynamics',
  contentType: 'text',
  content: '# Thermodynamics...',
  subject: 'Physics',
  tags: ['physics', 'thermodynamics'],
  isPublic: true
});

// Get feed (notes from followed users)
const feed = await notesService.getFeedNotes(userId, followingIds);
console.log(feed.items, feed.hasMore);</code></pre>
</div>

<div class="service-card">
  <h3>groupsService</h3>
  <p>Study groups with real-time messaging, member management, and notifications.</p>

  <h4>Group Operations</h4>
  <pre><code>createGroup(name, description, category, isPrivate, userId, userName, photoURL?, college?, course?, department?): Promise&lt;string&gt;
getGroup(groupId: string): Promise&lt;Group | null&gt;
getPublicGroups(limit?: number): Promise&lt;Group[]&gt;
getUserGroups(userId: string): Promise&lt;Group[]&gt;
updateGroup(groupId: string, updates: Partial&lt;Group&gt;): Promise&lt;void&gt;
deleteGroup(groupId: string): Promise&lt;void&gt;</code></pre>

  <h4>Member Operations</h4>
  <pre><code>joinGroup(groupId, userId, userName, photoURL?): Promise&lt;void&gt;
leaveGroup(groupId: string, userId: string): Promise&lt;void&gt;
addMember(groupId, userId, userName, photoURL?, role?): Promise&lt;void&gt;
removeMember(groupId: string, userId: string): Promise&lt;void&gt;
updateMemberRole(groupId, userId, newRole): Promise&lt;void&gt;
getGroupMembers(groupId: string): Promise&lt;GroupMember[]&gt;
isMember(groupId: string, userId: string): Promise&lt;boolean&gt;</code></pre>

  <h4>Messaging Operations</h4>
  <pre><code>sendMessage(groupId, userId, userName, photoURL?, message, fileUrl?, fileName?, fileType?): Promise&lt;string&gt;
getMessages(groupId: string, limit?: number): Promise&lt;GroupMessage[]&gt;
subscribeToMessages(groupId, callback, limit?): Unsubscribe
deleteMessage(groupId: string, messageId: string): Promise&lt;void&gt;
editMessage(groupId, messageId, newMessage): Promise&lt;void&gt;</code></pre>

  <h4>Real-time Subscriptions</h4>
  <pre><code>subscribeToMyGroups(userId: string, callback: (groups: Group[]) =&gt; void): Unsubscribe</code></pre>

  <h4>Usage Example</h4>
  <pre><code>import groupsService from '@/src/services/groupsService';

// Create a study group
const groupId = await groupsService.createGroup(
  'Physics Study Group',
  'Preparing for finals',
  'study',
  false, // public
  userId,
  'John Doe'
);

// Subscribe to real-time messages
const unsubscribe = groupsService.subscribeToMessages(
  groupId,
  (messages) =&gt; {
    console.log('New messages:', messages);
  }
);

// Send a message
await groupsService.sendMessage(
  groupId,
  userId,
  'John Doe',
  photoURL,
  'Hello everyone!'
);

// Cleanup
unsubscribe();</code></pre>
</div>

<div class="section-divider">
  <h2>Social Services</h2>
  <p>Social interactions and following system</p>
</div>

<div class="service-card">
  <h3>socialService</h3>
  <p>Handles likes, comments, saves, and download tracking for notes.</p>

  <h4>Like Operations</h4>
  <pre><code>likeNote(noteId: string, userId: string): Promise&lt;void&gt;
unlikeNote(noteId: string, userId: string): Promise&lt;void&gt;
toggleLike(noteId: string, userId: string): Promise&lt;boolean&gt;
isNoteLiked(noteId: string, userId: string): Promise&lt;boolean&gt;
getNoteLikes(noteId: string): Promise&lt;string[]&gt;</code></pre>

  <h4>Comment Operations</h4>
  <pre><code>addComment(noteId: string, comment: Omit&lt;NoteComment, 'id' | 'createdAt'&gt;): Promise&lt;NoteComment&gt;
updateComment(noteId: string, commentId: string, content: string): Promise&lt;void&gt;
deleteComment(noteId: string, commentId: string): Promise&lt;void&gt;
getNoteComments(noteId: string): Promise&lt;NoteComment[]&gt;</code></pre>

  <h4>Save Operations</h4>
  <pre><code>saveNote(noteId: string, userId: string): Promise&lt;void&gt;
unsaveNote(noteId: string, userId: string): Promise&lt;void&gt;
toggleSave(noteId: string, userId: string): Promise&lt;boolean&gt;
isNoteSaved(noteId: string, userId: string): Promise&lt;boolean&gt;
getSavedNotes(userId: string, lastDoc?: any): Promise&lt;PaginatedResult&lt;Note&gt;&gt;</code></pre>
</div>

<div class="service-card">
  <h3>followService</h3>
  <p>User following system with suggestions.</p>

  <h4>Methods</h4>
  <pre><code>followUser(followerId: string, followingId: string): Promise&lt;void&gt;
unfollowUser(followerId: string, followingId: string): Promise&lt;void&gt;
toggleFollow(followerId: string, followingId: string): Promise&lt;boolean&gt;
isFollowing(followerId: string, followingId: string): Promise&lt;boolean&gt;
getFollowing(userId: string): Promise&lt;string[]&gt;
getFollowers(userId: string): Promise&lt;string[]&gt;
getFollowingCount(userId: string): Promise&lt;number&gt;
getFollowersCount(userId: string): Promise&lt;number&gt;
getSuggestedUsers(userId: string, college: string, course: string): Promise&lt;PublicUserProfile[]&gt;</code></pre>

  <h4>Usage Example</h4>
  <pre><code>import followService from '@/src/services/followService';

// Follow a user
await followService.followUser(myUserId, targetUserId);

// Get suggestions from same college
const suggestions = await followService.getSuggestedUsers(
  myUserId,
  'MIT College',
  'Computer Science'
);

// Check if following
const isFollowing = await followService.isFollowing(myUserId, targetUserId);</code></pre>
</div>

<div class="section-divider">
  <h2>AI Services</h2>
  <p>AI-powered chat and assistance</p>
</div>

<div class="service-card">
  <h3>chatService</h3>
  <p>Groq API integration for BunkBot AI assistant with context-aware responses.</p>

  <h4>Configuration</h4>
  <table class="method-table">
    <tr><th>Setting</th><th>Value</th></tr>
    <tr><td>Model</td><td><code>meta-llama/llama-4-maverick-17b-128e-instruct</code></td></tr>
    <tr><td>Temperature</td><td><code>0.7</code></td></tr>
    <tr><td>Max Tokens</td><td><code>2048</code></td></tr>
    <tr><td>API</td><td>Groq Cloud API</td></tr>
  </table>

  <h4>Methods</h4>
  <pre><code>sendMessage(
  message: string,
  history: ChatMessage[],
  attendanceContext: AttendanceContext | null,
  imageBase64?: string
): Promise&lt;string&gt;

quickPrompts: Array&lt;{ label: string; prompt: string }&gt;</code></pre>

  <h4>Attendance Context Interface</h4>
  <pre><code>interface AttendanceContext {
  subjects: Subject[];
  timetable: TimetableEntry[];
  minimumAttendance: number;
  userName: string;
}</code></pre>

  <h4>Usage Example</h4>
  <pre><code>import { sendMessage, quickPrompts } from '@/src/services/chatService';

// Send message with attendance context
const response = await sendMessage(
  'Can I bunk physics class tomorrow?',
  chatHistory,
  {
    subjects: userSubjects,
    timetable: userTimetable,
    minimumAttendance: 75,
    userName: 'John'
  }
);

// Use with image
const response = await sendMessage(
  'Please analyze this timetable image',
  chatHistory,
  attendanceContext,
  base64ImageData
);</code></pre>
</div>

<div class="section-divider">
  <h2>Infrastructure Services</h2>
  <p>Caching, offline support, and notifications</p>
</div>

<div class="service-card">
  <h3>cacheService</h3>
  <p>AsyncStorage-based local caching for offline access.</p>

  <h4>Methods</h4>
  <pre><code>cacheUserProfile(uid: string, profile: UserProfile): Promise&lt;void&gt;
getCachedUserProfile(uid: string): Promise&lt;UserProfile | null&gt;
cacheSubjects(uid: string, subjects: Subject[]): Promise&lt;void&gt;
getCachedSubjects(uid: string): Promise&lt;Subject[] | null&gt;
cacheTimetable(uid: string, timetable: TimetableEntry[]): Promise&lt;void&gt;
getCachedTimetable(uid: string): Promise&lt;TimetableEntry[] | null&gt;
clearCache(uid: string): Promise&lt;void&gt;
clearAllCache(): Promise&lt;void&gt;</code></pre>
</div>

<div class="service-card">
  <h3>offlineQueueService</h3>
  <p>Queue-based offline operation handling with auto-sync.</p>

  <h4>Methods</h4>
  <pre><code>queueOperation(operation: OfflineOperation): Promise&lt;void&gt;
processQueue(): Promise&lt;void&gt;
getQueueLength(): Promise&lt;number&gt;
clearQueue(): Promise&lt;void&gt;</code></pre>

  <h4>Operation Types</h4>
  <pre><code>type OfflineOperation = {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: any;
  timestamp: Date;
}</code></pre>
</div>

<div class="service-card">
  <h3>notificationService</h3>
  <p>Push notification registration and handling.</p>

  <h4>Methods</h4>
  <pre><code>registerForPushNotificationsAsync(): Promise&lt;string | null&gt;
savePushToken(userId: string, token: string): Promise&lt;void&gt;
deletePushToken(userId: string): Promise&lt;void&gt;
setupNotificationListeners(): void</code></pre>

  <h4>Note</h4>
  <p>Push notifications require a development build (EAS). They are not available in Expo Go for SDK 53+.</p>
</div>

<div class="section-divider">
  <h2>File Upload Services</h2>
  <p>Cloud storage integration</p>
</div>

<div class="service-card">
  <h3>imageUploadService</h3>
  <p>Uploads images to Catbox.moe (CORS-friendly for avatars).</p>

  <h4>Methods</h4>
  <pre><code>uploadImage(imageUri: string): Promise&lt;string&gt; // Returns URL
uploadImageBase64(base64: string, fileName: string): Promise&lt;string&gt;</code></pre>
</div>

<div class="service-card">
  <h3>googleDriveService</h3>
  <p>Google Drive API for note attachments (PDFs, images).</p>

  <h4>Methods</h4>
  <pre><code>uploadFile(file: File): Promise&lt;UploadResult&gt;
deleteFile(fileId: string): Promise&lt;void&gt;
getFileUrl(fileId: string): string
getThumbnailUrl(fileId: string): string</code></pre>

  <h4>Upload Result</h4>
  <pre><code>interface UploadResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
}</code></pre>
</div>

<div class="service-card">
  <h3>chatStorageService</h3>
  <p>Persists chat conversations locally using AsyncStorage.</p>

  <h4>Methods</h4>
  <pre><code>createChat(): Promise&lt;Chat&gt;
getAllChats(): Promise&lt;Chat[]&gt;
updateChatMessages(chatId: string, messages: ChatMessage[]): Promise&lt;void&gt;
deleteChat(chatId: string): Promise&lt;void&gt;
getActiveChatId(): Promise&lt;string | null&gt;
setActiveChatId(chatId: string): Promise&lt;void&gt;</code></pre>

  <h4>Chat Interface</h4>
  <pre><code>interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Base64
  timestamp: Date;
}</code></pre>
</div>
