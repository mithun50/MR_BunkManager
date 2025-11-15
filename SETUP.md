# Mr. Bunk Manager - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase account

### Installation Steps

1. **Clone and Install Dependencies**
```bash
cd MR_BunkManager
npm install
```

2. **Firebase Setup**

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `mr-bunk-manager`
4. Disable Google Analytics (optional)
5. Click "Create Project"

#### Step 2: Register Your App
1. In Firebase Console, click the **Web** icon (</>)
2. Register app name: `Mr Bunk Manager`
3. **Copy the Firebase config** - you'll need this!

#### Step 3: Enable Authentication
1. In Firebase Console, go to **Authentication** > **Get Started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Enable **Google** provider (copy the Web client ID shown)
5. Click **Save**

#### Step 4: Set Up Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location
5. Click **Enable**

#### Step 5: Set Up Storage (for future features)
1. In Firebase Console, go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Click **Done**

3. **Configure Environment Variables**

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase config:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google OAuth (Optional - for Google Sign-In)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_expo_client_id.apps.googleusercontent.com
```

**Where to find these values:**
- In Firebase Console, go to **Project Settings** (gear icon)
- Scroll to "Your apps" section
- Click on your web app
- Copy each value to your `.env` file

**For Google Sign-In setup:**
- See [GOOGLE_SIGNIN_SETUP.md](./GOOGLE_SIGNIN_SETUP.md) for detailed instructions

4. **Run the App**

```bash
# Start Expo dev server
npm start

# For iOS
npm run ios

# For Android
npm run android

# For Web
npm run web
```

## 📱 First Run

1. The app will open to the **Login** screen
2. Click **"Sign Up"** to create a new account
3. Enter your details:
   - Full Name
   - Email
   - Password (min 6 characters)
4. Click **"Sign Up"**
5. You'll be automatically logged in and redirected to the **Dashboard**

## 🏗️ Project Structure

```
MR_BunkManager/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Dashboard
│   │   ├── attendance.tsx
│   │   ├── timetable.tsx
│   │   ├── groups.tsx
│   │   └── profile.tsx
│   └── _layout.tsx        # Root layout with auth
├── src/
│   ├── config/            # Configuration
│   │   ├── firebase.ts    # Firebase initialization
│   │   └── theme.ts       # React Native Paper theme
│   ├── services/          # Business logic
│   │   └── authService.ts # Authentication service
│   ├── store/             # State management
│   │   └── authStore.ts   # Zustand auth store
│   └── screens/           # Screen components
│       └── auth/
│           ├── LoginScreen.tsx
│           └── SignupScreen.tsx
├── .env                   # Environment variables (create this)
├── .env.example          # Template for environment variables
└── package.json
```

## 🎨 Features Implemented

### ✅ Phase 1 - Foundation Complete
- [x] Firebase authentication (Email/Password)
- [x] **Email verification system with resend functionality**
- [x] **Google Sign-In integration**
- [x] React Native Paper UI components
- [x] Custom theme with brand colors
- [x] Bottom tab navigation with icons (5 tabs)
- [x] Authentication flow with protected routes
- [x] State management with Zustand
- [x] Login screen with validation & Google button
- [x] Signup screen with password confirmation & email verification
- [x] Email verification screen with resend option
- [x] Profile screen with logout
- [x] Dashboard with mock attendance data

### 📋 Coming Next (Phase 2)
- [ ] Timetable management
- [ ] AI timetable extraction (Google Gemini)
- [ ] Attendance tracking system
- [ ] Bunk calculator
- [ ] Real Firestore database integration

## 🔧 Troubleshooting

### App won't start
```bash
# Clear cache
rm -rf node_modules
npm install
npm start -- --clear
```

### Firebase errors
- Double-check your `.env` file has correct values
- Ensure Email/Password is enabled in Firebase Console
- Check Firebase project rules allow read/write in test mode

### TypeScript errors
```bash
# Regenerate types
npx expo customize tsconfig.json
```

## 📚 Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **UI Library**: React Native Paper (Material Design 3)
- **Icons**: @expo/vector-icons (MaterialCommunityIcons)
- **Navigation**: Expo Router
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore (upcoming)
- **Storage**: Firebase Storage (upcoming)
- **State Management**: Zustand
- **Date Utilities**: date-fns

## 🔐 Security Notes

- **Never commit `.env` file** - it's in `.gitignore`
- For production, use Firebase **production mode** rules
- Enable App Check for additional security
- Implement Row Level Security rules in Firestore

## 📞 Support

- Check [Plan.md](./Plan.md) for full feature roadmap
- Report issues on GitHub
- Read [Firebase Documentation](https://firebase.google.com/docs)

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

**Happy Coding! 🎓**
