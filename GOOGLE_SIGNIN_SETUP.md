# Google Sign-In Setup Guide

## 📝 Overview

This guide will help you set up Google Sign-In for your Mr. Bunk Manager app on both Android and iOS.

## 🔥 Step 1: Enable Google Provider in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **mr-bunkmanager**
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable**
6. **Important**: Copy the **Web client ID** (you'll need this later)
7. Click **Save**

## 🌐 Step 2: Get Google OAuth Client IDs

### For Android

1. Firebase automatically creates an Android OAuth client for you
2. Go to [Google Cloud Console](https://console.cloud.google.com/)
3. Select your Firebase project
4. Go to **APIs & Services** → **Credentials**
5. Find the OAuth 2.0 Client ID for **Android (auto created by Google Service)**
6. Copy the **Client ID** (ends with `.apps.googleusercontent.com`)

### For iOS (Optional - if deploying to iOS)

1. In Google Cloud Console → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **iOS**
4. Enter your iOS Bundle ID (from `app.json`)
5. Click **Create**
6. Copy the **Client ID**

### Web Client ID

1. This was created automatically by Firebase
2. In Google Cloud Console → **Credentials**
3. Find **Web client (auto created by Google Service for Firebase)**
4. Copy this **Client ID**

## 📱 Step 3: Configure app.json

Add your Google configuration to `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        // ... existing config
      },
      "config": {
        "googleSignIn": {
          "apiKey": "YOUR_ANDROID_API_KEY",
          "certificateHash": "YOUR_CERTIFICATE_HASH"
        }
      }
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.idtl.mrbunkmanager",
      "config": {
        "googleSignIn": {
          "reservedClientId": "YOUR_IOS_CLIENT_ID"
        }
      }
    }
  }
}
```

## 🔧 Step 4: Download Configuration Files

### For Android

1. In Firebase Console, go to **Project Settings**
2. Under **Your apps**, find your Android app
3. Download `google-services.json`
4. Place it in the root of your project: `/MR_BunkManager/google-services.json`

### For iOS (Optional)

1. In Firebase Console, add an iOS app if not already added
2. Download `GoogleService-Info.plist`
3. Place it in the root: `/MR_BunkManager/GoogleService-Info.plist`

## 🔑 Step 5: Update .env File

Add your Google OAuth Client IDs to `.env`:

```env
# Add these to your existing .env file

# Web Client ID (from Firebase Console - when you enabled Google sign-in)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

# Android Client ID (from Google Cloud Console)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

# iOS Client ID (if you created one)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

# Expo Client ID (can be same as Web Client ID for development)
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

## 📋 Step 6: Configure Package Name

Make sure your `app.json` has the correct package name:

```json
{
  "expo": {
    "android": {
      "package": "com.idtl.mrbunkmanager"
    }
  }
}
```

## 🔐 Step 7: Get SHA-1 Certificate (Android Only)

For development:

```bash
# On macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# On Windows
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA-1** fingerprint and add it to Firebase:

1. Firebase Console → **Project Settings**
2. Scroll to **Your apps** → Select Android app
3. Click **Add fingerprint**
4. Paste the SHA-1
5. Click **Save**

## ✅ Step 8: Test Google Sign-In

1. Restart your Expo development server:
   ```bash
   npm start
   ```

2. Run on Android:
   ```bash
   npm run android
   ```

3. On the Login screen, click **"Sign in with Google"**

4. Select your Google account

5. You should be logged in and redirected to the Dashboard!

## 🔍 Troubleshooting

### "Sign in failed" or "Invalid client"

**Solution**:
- Double-check your Client IDs in `.env`
- Make sure you added the correct SHA-1 to Firebase
- Verify Google Sign-In is enabled in Firebase Console
- Check package name matches in `app.json` and Firebase

### "Error 10" on Android

**Solution**:
- SHA-1 fingerprint not added to Firebase
- Run the keytool command above and add the SHA-1

### Google sign-in button disabled

**Solution**:
- Check that all environment variables are set correctly
- Restart the development server after adding env variables
- Make sure `google-services.json` is in the project root

### "Web client ID not found"

**Solution**:
- Make sure you copied the Web client ID from Firebase (not Google Cloud)
- It's shown when you enable Google provider in Firebase Authentication

## 📱 Production Build

For production builds, you'll need to:

1. Generate a production SHA-1 certificate
2. Add it to Firebase Console
3. Create production OAuth credentials in Google Cloud Console
4. Update your `.env` with production client IDs

## 🎯 Quick Checklist

- [ ] Enabled Google provider in Firebase Authentication
- [ ] Downloaded `google-services.json` and placed in project root
- [ ] Added SHA-1 fingerprint to Firebase
- [ ] Copied all Client IDs to `.env` file
- [ ] Verified package name in `app.json` matches Firebase
- [ ] Restarted Expo development server
- [ ] Tested Google Sign-In on device

## 📚 Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Expo Google Sign-In Guide](https://docs.expo.dev/guides/google-authentication/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Need help?** Check the Firebase Console logs or the Expo development console for error messages.
