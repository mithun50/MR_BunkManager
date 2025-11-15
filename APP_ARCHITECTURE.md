# Mr. Bunk Manager - App Architecture

## 📱 Application Overview

**Mr. Bunk Manager** is a student attendance tracking app built with Expo (React Native) that helps students manage their class attendance, view timetables, and ensure they meet minimum attendance requirements.

## 🏗️ Tech Stack

### Core Framework
- **Expo SDK**: ~52.0.11
- **React Native**: Latest (via Expo)
- **TypeScript**: Type-safe development
- **Expo Router**: File-based navigation

### UI & Design
- **React Native Paper**: Material Design 3 components
- **Theme**: Dark/Light mode support with custom theming
- **Icons**: MaterialCommunityIcons from @expo/vector-icons
- **Safe Area**: react-native-safe-area-context for proper screen boundaries

### Backend & Services
- **Firebase Auth**: Email/Password + Google Sign-In
- **Cloud Firestore**: Real-time database for user data
- **Firebase Storage**: Avatar image storage
- **Google Gemini 2.0 Flash**: AI-powered timetable extraction

### State Management
- **Zustand**: Lightweight global state (auth store)
- **React Hooks**: Local component state

## 📁 Project Structure

```
MR_BunkManager/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Authentication routes
│   │   ├── _layout.tsx          # Auth group layout
│   │   ├── login.tsx            # Login screen
│   │   ├── signup.tsx           # Signup screen
│   │   └── email-verification.tsx
│   ├── (onboarding)/            # Onboarding routes
│   │   ├── _layout.tsx          # Onboarding group layout
│   │   └── index.tsx            # Onboarding entry point
│   ├── (tabs)/                  # Main app routes
│   │   ├── _layout.tsx          # Tab navigation layout
│   │   ├── index.tsx            # Dashboard
│   │   ├── attendance.tsx       # Attendance tracking
│   │   ├── timetable.tsx        # Timetable view
│   │   ├── groups.tsx           # Study groups
│   │   └── profile.tsx          # User profile
│   ├── _layout.tsx              # Root layout (navigation logic)
│   └── modal.tsx                # Modal screen
├── src/
│   ├── config/
│   │   ├── firebase.ts          # Firebase initialization
│   │   └── theme.ts             # React Native Paper themes
│   ├── services/
│   │   ├── authService.ts       # Authentication operations
│   │   ├── firestoreService.ts  # Firestore CRUD operations
│   │   └── geminiService.ts     # AI timetable extraction
│   ├── store/
│   │   └── authStore.ts         # Zustand auth state
│   ├── types/
│   │   └── user.ts              # TypeScript interfaces
│   ├── screens/
│   │   ├── auth/                # Auth screen components
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── EmailVerificationScreen.tsx
│   │   └── onboarding/          # Onboarding screen components
│   │       ├── OnboardingContainer.tsx
│   │       ├── ProfileSetupScreen.tsx
│   │       ├── TimetableUploadScreen.tsx
│   │       └── AttendanceSettingsScreen.tsx
│   └── hooks/
│       └── use-color-scheme.ts  # Theme hook
├── assets/                      # Images, fonts, etc.
├── .env                         # Environment variables (not in git)
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── tsconfig.json               # TypeScript configuration
```

## 🔄 Application Flow

### 1. App Launch
```
App Starts
    ↓
Root Layout (_layout.tsx)
    ↓
Initialize Auth Listener
    ↓
Check User State
    ├── Not Authenticated → (auth)/login
    ├── Authenticated + No Onboarding → (onboarding)
    └── Authenticated + Onboarding Complete → (tabs)
```

### 2. Authentication Flow
```
Login/Signup Screen
    ↓
Firebase Auth
    ├── Email/Password
    └── Google OAuth
    ↓
Email Verification (if email/password)
    ↓
Auth State Updated (Zustand)
    ↓
Check Onboarding Status (Firestore)
    ↓
Route to Onboarding or Main App
```

### 3. Onboarding Flow
```
Profile Setup
    ├── Display Name
    ├── College Info
    ├── Department
    ├── Semester
    ├── Roll Number
    ├── Section
    └── Avatar (optional)
    ↓
Timetable Upload
    ├── Take Photo
    ├── Choose Image
    ├── Upload PDF
    └── Skip (manual entry later)
    ↓
AI Extraction (Gemini 2.0 Flash)
    ↓
Attendance Settings
    └── Minimum Attendance %
    ↓
Save to Firestore
    ├── User Profile
    └── Timetable Entries
    ↓
Upload Avatar to Storage
    ↓
Mark Onboarding Complete
    ↓
Navigate to Dashboard
```

### 4. Main App Flow
```
Bottom Tab Navigation
    ├── Dashboard
    │   └── Attendance summary, quick actions
    ├── Attendance
    │   └── Mark attendance for classes
    ├── Timetable
    │   └── View weekly schedule
    ├── Groups
    │   └── Study group management
    └── Profile
        └── Edit profile, settings, logout
```

## 🗄️ Data Architecture

### Firestore Structure

```
/users/{userId}
    ├── uid: string
    ├── email: string
    ├── displayName: string
    ├── photoURL: string
    ├── college: string
    ├── department: string
    ├── semester: string
    ├── rollNumber: string
    ├── section: string
    ├── minimumAttendance: number
    ├── onboardingCompleted: boolean
    ├── createdAt: Timestamp
    └── updatedAt: Timestamp

/users/{userId}/timetable/{timetableId}
    ├── id: string
    ├── day: string
    ├── startTime: string
    ├── endTime: string
    ├── subject: string
    ├── subjectCode: string
    ├── type: 'lecture' | 'lab' | 'tutorial'
    ├── room: string
    └── faculty: string

/users/{userId}/subjects/{subjectId}
    ├── id: string
    ├── name: string
    ├── code: string
    ├── totalClasses: number
    ├── attendedClasses: number
    ├── attendancePercentage: number
    └── lastUpdated: Timestamp

/users/{userId}/attendance/{attendanceId}
    ├── id: string
    ├── subjectId: string
    ├── date: Timestamp
    ├── status: 'present' | 'absent' | 'leave'
    └── notes: string
```

### Firebase Storage Structure

```
/avatars/
    └── {userId}.jpg    # User profile photos
```

## 🔐 Authentication System

### Supported Methods

1. **Email/Password**
   - Sign up with email verification
   - Password reset functionality
   - Email verification required before access

2. **Google OAuth**
   - One-tap sign-in
   - Uses expo-auth-session
   - Automatic account creation

### Auth State Management

```typescript
// Zustand Store (src/store/authStore.ts)
{
  user: User | null,
  loading: boolean,
  initialized: boolean,
  initializeAuth: () => Unsubscribe,
  signOut: () => Promise<void>
}
```

### Auth Flow Logic

```typescript
// Real-time listener in root layout
useEffect(() => {
  const unsubscribe = initializeAuth();
  return () => unsubscribe();
}, []);

// Firebase Auth State Observer
onAuthStateChanged(auth, (firebaseUser) => {
  set({ user: firebaseUser, loading: false, initialized: true });
});
```

## 🎨 Theming System

### Theme Configuration

```typescript
// src/config/theme.ts
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    // ... custom colors
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    // ... custom colors
  },
};
```

### Usage

```typescript
const colorScheme = useColorScheme();
const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

<PaperProvider theme={theme}>
  {/* App content */}
</PaperProvider>
```

## 🤖 AI Integration

### Gemini 2.0 Flash API

**Purpose**: Extract timetable data from images/PDFs

**Process**:
1. User uploads image or PDF
2. File converted to base64
3. Sent to Gemini with extraction prompt
4. AI parses and returns structured JSON
5. Data validated and saved to Firestore

**Prompt Engineering**:
```typescript
const prompt = `You are a timetable extraction expert. Analyze this timetable
and extract all class information in JSON format with the following structure:
- day: Day of the week
- startTime: Start time (HH:MM format)
- endTime: End time (HH:MM format)
- subject: Subject name
- subjectCode: Subject code
- type: 'lecture', 'lab', or 'tutorial'
- room: Room number or location
- faculty: Faculty name (if available)`;
```

## 🧩 Key Services

### 1. authService.ts
```typescript
- signUp(email, password)
- signIn(email, password)
- signInWithGoogle()
- sendVerificationEmail()
- resetPassword(email)
- signOut()
```

### 2. firestoreService.ts
```typescript
- createUserProfile(uid, data)
- getUserProfile(uid)
- updateUserProfile(uid, data)
- completeOnboarding(uid)
- saveTimetable(uid, timetable)
- getTimetable(uid)
- getSubjects(uid)
- updateSubjectAttendance(uid, subjectId, attended)
- addAttendanceRecord(uid, record)
- getAttendanceRecords(uid, filters)
```

### 3. geminiService.ts
```typescript
- extractTimetableFromImage(imageUri)
- extractTimetableFromPDF(pdfUri)
```

## 📱 Screen Components

### Navigation Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Login | `(auth)/login` | User authentication |
| Signup | `(auth)/signup` | New user registration |
| Email Verification | `(auth)/email-verification` | Verify email address |
| Onboarding | `(onboarding)` | First-time setup |
| Dashboard | `(tabs)` | Main overview |
| Attendance | `(tabs)/attendance` | Mark attendance |
| Timetable | `(tabs)/timetable` | View schedule |
| Groups | `(tabs)/groups` | Study groups |
| Profile | `(tabs)/profile` | User settings |

### Screen Features

**Dashboard**:
- Overall attendance percentage
- Weekly attendance summary
- Quick actions (mark today's attendance)
- Alerts for low attendance subjects

**Attendance**:
- List of subjects
- Mark present/absent/leave
- View attendance history
- Filter by date/subject

**Timetable**:
- Weekly view
- Current day highlight
- Class details on tap
- Add/edit classes manually

**Groups**:
- Create study groups
- Invite members
- Share notes
- Group attendance comparison

**Profile**:
- Edit personal information
- Change avatar
- Update college details
- Logout

## 🔧 Environment Variables

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=

# Google Gemini AI
EXPO_PUBLIC_GEMINI_API_KEY=
```

## 🚀 Running the App

### Development
```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

### Building
```bash
# Development build
eas build --profile development --platform android

# Production build
eas build --profile production --platform android
```

## 📊 Performance Considerations

### Optimization Strategies

1. **Image Optimization**:
   - Avatar images compressed before upload
   - Timetable images resized for AI processing
   - Use `quality: 0.8` in ImagePicker

2. **Firestore Queries**:
   - Indexed queries for attendance records
   - Pagination for large datasets
   - Real-time listeners only where needed

3. **Offline Support**:
   - Firestore offline persistence enabled
   - Queue attendance updates when offline
   - Sync when connection restored

4. **Bundle Size**:
   - Tree-shaking unused imports
   - Lazy loading screens
   - Optimize dependencies

## 🔒 Security Best Practices

### Current Implementation

1. **Authentication**: Firebase Auth handles secure token management
2. **Data Validation**: Client-side validation for all forms
3. **Secure Storage**: Firebase Storage with auth-based access
4. **Environment Variables**: Sensitive keys in `.env` (gitignored)

### Production Recommendations

1. **Firestore Security Rules**:
```javascript
// Only users can read/write their own data
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

2. **Storage Security Rules**:
```javascript
// Only users can upload to their own avatar folder
match /avatars/{userId}/{allPaths=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

3. **API Key Restrictions**:
   - Restrict Gemini API key to your app's bundle ID
   - Set up Firebase App Check
   - Enable rate limiting

## 🧪 Testing Strategy

### Recommended Tests

1. **Unit Tests**: Services and utility functions
2. **Integration Tests**: Navigation flow, data persistence
3. **E2E Tests**: Complete user journeys
4. **Manual Tests**: UI/UX, platform-specific features

## 📈 Future Enhancements

### Planned Features

- [ ] Manual timetable entry UI
- [ ] Attendance analytics and insights
- [ ] Push notifications for class reminders
- [ ] Export attendance reports (PDF/CSV)
- [ ] Multi-semester support
- [ ] Cloud backup and restore
- [ ] Sharing timetables with friends
- [ ] Holiday calendar integration
- [ ] Teacher/admin portal

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Expo Router](https://docs.expo.dev/router/introduction/)

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
