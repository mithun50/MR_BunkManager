# 🚀 Quick Start Guide

## ⚡ For "Operation Not Allowed" Error

If you're getting **"operation not allowed"** error when trying to sign up:

### Fix in 3 Steps:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select: **mr-bunkmanager** project

2. **Enable Email/Password Authentication**
   - Click **Authentication** in left sidebar
   - Click **Sign-in method** tab
   - Find **Email/Password** in the list
   - Click on it and toggle **Enable** to ON
   - Click **Save**

3. **Restart Your App**
   ```bash
   npm start
   ```

✅ Now you can sign up and create an account!

---

## 📧 Email Verification

After signing up, you'll receive a **verification email**. Check your inbox (and spam folder) for:
- **From**: noreply@mr-bunkmanager.firebaseapp.com
- **Subject**: Verify your email for Mr Bunk Manager

Click the verification link in the email, then return to the app and click **"I've Verified My Email"**.

---

## 🔐 Google Sign-In (Optional)

To enable Google Sign-In:

1. **Enable in Firebase**
   - Firebase Console → Authentication → Sign-in method
   - Enable **Google** provider
   - Copy the **Web client ID**

2. **Follow Detailed Guide**
   - See [GOOGLE_SIGNIN_SETUP.md](./GOOGLE_SIGNIN_SETUP.md)

---

## 📱 Running the App

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

---

## 🎯 Features Ready to Use

### ✅ Authentication
- Email/Password signup & login
- Email verification
- Google Sign-In (after setup)
- Password reset
- Automatic auth state management

### ✅ Navigation
- 5-tab bottom navigation:
  - **Dashboard** - Overview with attendance stats
  - **Attendance** - Track classes
  - **Timetable** - View schedule
  - **Groups** - Collaborate
  - **Profile** - Settings & logout

### ✅ UI/UX
- Material Design 3 (React Native Paper)
- Dark/Light mode support
- Custom brand colors
- Beautiful icons (MaterialCommunityIcons)

---

## 🔧 Troubleshooting

### "Operation not allowed"
→ Enable Email/Password in Firebase Console (see above)

### "Invalid email"
→ Use a valid email format (e.g., user@example.com)

### "Weak password"
→ Use at least 6 characters

### Email verification not received
→ Check spam folder
→ Click "Resend Verification Email" button

### Google Sign-In not working
→ Follow [GOOGLE_SIGNIN_SETUP.md](./GOOGLE_SIGNIN_SETUP.md)

---

## 📚 Full Documentation

- [SETUP.md](./SETUP.md) - Complete setup guide
- [GOOGLE_SIGNIN_SETUP.md](./GOOGLE_SIGNIN_SETUP.md) - Google OAuth setup
- [Plan.md](./Plan.md) - Full project roadmap

---

## 🎓 Need Help?

1. Check Firebase Console for error logs
2. Look at Expo development console
3. Review the documentation files above

**Happy coding! 🚀**
