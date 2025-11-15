# Quick Start Checklist

## ✅ Pre-Flight Checklist

Complete these steps before running the app for the first time.

### 1. Environment Setup ✅

**Status**: COMPLETE
- [x] Firebase credentials in `.env`
- [x] Google OAuth credentials in `.env`
- [x] Gemini API key configured
- [x] All dependencies installed

### 2. Firebase Console Configuration ⏳

**Status**: NEEDS YOUR ACTION

Visit [Firebase Console](https://console.firebase.google.com/) and complete:

#### Authentication Setup
- [ ] Go to **Authentication** → **Sign-in method**
- [ ] Enable **Email/Password** provider
- [ ] Enable **Google** provider
- [ ] Add your Google OAuth Client ID to Google provider settings

#### Firestore Database Setup
- [ ] Go to **Firestore Database**
- [ ] Click **Create database**
- [ ] Select **Test mode** (or **Production mode** with rules)
- [ ] Choose database location (closest to your users)
- [ ] Copy and paste security rules from `ONBOARDING_SETUP.md`
- [ ] Click **Publish**

#### Firebase Storage Setup
- [ ] Go to **Storage**
- [ ] Click **Get started**
- [ ] Select **Test mode** (or **Production mode** with rules)
- [ ] Choose storage location
- [ ] Copy and paste storage rules from `ONBOARDING_SETUP.md`
- [ ] Click **Done**

#### Android Setup (Optional - for Google Sign-In)
- [ ] Get SHA-1 certificate fingerprint:
  ```bash
  # Development
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

  # Production (when you have release keystore)
  keytool -list -v -keystore your-release-keystore.jks -alias your-key-alias
  ```
- [ ] Go to **Project Settings** → **Your apps** → **Android app**
- [ ] Add SHA-1 certificate fingerprint
- [ ] Download updated `google-services.json` (if needed)

### 3. Test Firebase Connection

Run this test to verify Firebase is working:

```bash
npx expo start
```

Expected result: App should start without Firebase errors in console

### 4. Test Authentication

- [ ] Launch app on device/emulator
- [ ] Click "Sign Up"
- [ ] Create test account with email/password
- [ ] Check Firebase Console → **Authentication** → **Users**
- [ ] Verify user appears in list

### 5. Test Email Verification

- [ ] After signup, check email for verification link
- [ ] If no email received:
  - Check spam folder
  - Verify email templates are enabled in Firebase
  - Check Firebase Console → **Authentication** → **Templates**

### 6. Test Onboarding Flow

- [ ] Login with new account
- [ ] Should redirect to Profile Setup screen
- [ ] Fill in all required fields
- [ ] Upload avatar (optional)
- [ ] Click "Next"
- [ ] Should move to Timetable Upload screen

### 7. Test Timetable Extraction

**Prepare a test timetable image first!**

Create a simple timetable image with text like:
```
Monday
09:00 - 10:00  Mathematics  Room 101
10:00 - 11:00  Physics      Room 102

Tuesday
09:00 - 10:00  Chemistry    Lab 201
```

- [ ] Take photo or choose image
- [ ] Click "Extract Timetable"
- [ ] Wait for AI processing (5-10 seconds)
- [ ] Verify success message shows number of classes found
- [ ] Click "Next"

**If extraction fails**:
- Check Gemini API key is correct
- Ensure image has clear, readable text
- Try a simpler timetable format
- Check console for error messages

### 8. Complete Onboarding

- [ ] Select minimum attendance percentage (e.g., 75%)
- [ ] Click "Complete Setup"
- [ ] Should navigate to Dashboard
- [ ] Check Firebase Console → **Firestore Database**
- [ ] Verify user document exists at `/users/{userId}`
- [ ] Verify timetable entries at `/users/{userId}/timetable/`

### 9. Test Google Sign-In (Optional)

- [ ] Logout from current account
- [ ] Click "Continue with Google"
- [ ] Select Google account
- [ ] Should create new user or login existing user
- [ ] If first time, should go to onboarding
- [ ] If returning user with onboarding complete, should go to Dashboard

**If Google Sign-In fails**:
- Verify Google provider is enabled in Firebase
- Check SHA-1 certificate is added (Android)
- Verify OAuth Client ID is correct in `.env`
- Check Expo client is whitelisted in Google Cloud Console

### 10. Verify Data Persistence

- [ ] Complete onboarding
- [ ] Close app completely
- [ ] Reopen app
- [ ] Should login automatically and go directly to Dashboard
- [ ] Profile info should be retained
- [ ] Timetable should be visible

## 🐛 Common Issues & Fixes

### Issue: "Operation not allowed"
**Fix**: Enable Email/Password in Firebase Console → Authentication → Sign-in method

### Issue: "Network request failed"
**Fix**:
- Check internet connection
- Verify Firebase credentials in `.env` are correct
- Restart Expo dev server

### Issue: "Could not extract timetable"
**Fix**:
- Verify Gemini API key is active
- Check API key quota (60 requests/min, 1500/day)
- Use clearer image with better lighting
- Ensure text is horizontal and readable

### Issue: "Header is merged" or overlapping
**Fix**: Already fixed - do not add custom `paddingTop` to Appbar.Header

### Issue: "Keyboard covers input fields"
**Fix**: Already implemented - KeyboardAvoidingView is configured

### Issue: Avatar not uploading
**Fix**:
- Enable Firebase Storage
- Add storage security rules
- Check image picker permissions
- Verify image size is reasonable (<5MB)

### Issue: App crashes on startup
**Fix**:
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for typos in `.env` file
- Verify all imports are correct

## 📱 Platform-Specific Notes

### Android
- Minimum SDK: 21 (Android 5.0)
- Target SDK: Latest via Expo
- Required permissions: Camera, Photos, Internet
- Google Sign-In requires SHA-1 certificate

### iOS
- Minimum iOS: 13.0
- Required Info.plist permissions:
  - NSCameraUsageDescription
  - NSPhotoLibraryUsageDescription
- Google Sign-In requires URL schemes configuration

### Web
- Most features work on web
- Camera/Photo picker may have different UX
- Firebase Auth web flow differs slightly

## 🎯 Success Criteria

Your app is fully working when:

✅ **Authentication**:
- Can sign up with email/password
- Can login with existing account
- Can sign in with Google
- Email verification works

✅ **Onboarding**:
- Profile setup saves correctly
- Avatar uploads to Firebase Storage
- Timetable extraction works with AI
- Attendance settings are saved

✅ **Navigation**:
- New users go to onboarding
- Completed users go to dashboard
- Auth flow redirects properly

✅ **Data Persistence**:
- User profile in Firestore
- Timetable entries in Firestore
- Data persists across app restarts

✅ **UI/UX**:
- No header overlaps
- Keyboard doesn't cover inputs
- Responsive on all screen sizes
- Dark/light theme works

## 🚀 You're Ready!

Once all checkboxes are complete:

1. **Start building attendance features**
2. **Test with real students**
3. **Gather feedback**
4. **Iterate and improve**

## 📞 Need Help?

If stuck:
1. Check error messages in Expo console
2. Review Firebase Console for errors
3. Check Firestore for data consistency
4. Review `ONBOARDING_SETUP.md` for detailed troubleshooting
5. Check `APP_ARCHITECTURE.md` for system understanding

---

**Current Status**: ✅ Code Complete, ⏳ Firebase Configuration Pending

**Last Updated**: 2025-11-15
