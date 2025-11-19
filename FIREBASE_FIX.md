# Firebase API Key Fix - Secure Configuration

## Problem
Firebase auth error: `api-key-not-valid` after compilation.

## Root Cause
Environment variables from `.env` weren't being embedded into compiled builds.

## Solution Applied
Updated configuration to embed Firebase config at build time through `app.config.js` **WITHOUT hardcoded credentials**.

## Security Features
- ✅ No hardcoded API keys in source code
- ✅ Credentials loaded from `.env` or EAS secrets only
- ✅ Validation ensures all required variables are present
- ✅ Build fails fast if credentials are missing

## Config Priority (in firebase.ts)
1. **Environment variables** - From `.env` (development)
2. **App config extra** - Embedded at build time from `.env` or EAS secrets

## Testing Steps

### Development Build
```bash
npx expo start --clear
```
Test login - should work with `.env` values.

### Production Build (EAS)
```bash
# Build production APK/AAB
eas build --platform android --profile production

# Or preview build
eas build --platform android --profile preview
```

### Local Build
```bash
# Generate Android build locally
npx expo prebuild --clean
cd android && ./gradlew assembleRelease
```

## Verify Firebase Config is Loaded

In development, check console logs for:
```
✅ Firebase initialized successfully
Firebase Config: { apiKey: '✅ Set', projectId: 'mr-bunkmanager' }
```

## Setup for Different Environments

### Local Development
Uses `.env` file in project root (already configured):
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### EAS Cloud Builds (Production)
Set secrets in EAS (replaces `.env` for builds):
```bash
# Set all Firebase environment variables as secrets
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-domain"
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-bucket"
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your-sender-id"
npx eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your-app-id"

# Verify secrets are set
npx eas env:list
```

## Files Modified
- `app.config.js` - Added Firebase config embedding
- `src/config/firebase.ts` - Updated to use Constants.expoConfig
