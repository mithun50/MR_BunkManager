# Onboarding Flow Setup Guide

## Overview

The Mr. Bunk Manager app includes a comprehensive 3-step onboarding flow that collects essential user information after the first login:

1. **Profile Setup** - Collect personal and college information
2. **Timetable Upload** - Upload and extract timetable using AI
3. **Attendance Settings** - Configure minimum attendance percentage

## Prerequisites

Before testing the onboarding flow, ensure you have:

1. **Firebase Setup Complete**
   - Email/Password authentication enabled
   - Google Sign-In configured (optional)
   - Firestore Database created
   - Firebase Storage enabled

2. **Google Gemini API Key**
   - Required for AI-powered timetable extraction
   - Free tier available at: https://makersuite.google.com/app/apikey

## Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Open `.env` file in your project root
6. Replace `your_gemini_api_key_here` with your actual API key:

```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyC...your_actual_key_here
```

## Step 2: Configure Firestore Security Rules

Set up basic Firestore security rules for testing:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Use these test rules (⚠️ **NOT for production**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User timetables
    match /users/{userId}/timetable/{timetableId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User subjects
    match /users/{userId}/subjects/{subjectId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User attendance records
    match /users/{userId}/attendance/{attendanceId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Click **Publish**

## Step 3: Enable Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click **Get Started**
3. Choose **Test mode** for now
4. Select your storage location
5. Click **Done**

## How the Onboarding Flow Works

### Screen 1: Profile Setup

**User provides:**
- Display Name (full name)
- College name
- Department (e.g., Computer Science)
- Semester (e.g., 5th Semester)
- Roll Number
- Section (optional)
- Profile Photo (optional - camera or gallery)

**What happens:**
- Form validation ensures all required fields are filled
- Avatar image is stored locally (uploaded to Firebase Storage on completion)
- Data is passed to next screen

### Screen 2: Timetable Upload

**User can:**
1. **Take Photo** - Capture timetable with camera
2. **Choose Image** - Select timetable image from gallery
3. **Upload PDF** - Select timetable PDF document
4. **Skip** - Manual entry later (feature coming soon)

**AI Extraction Process:**
1. User selects/captures timetable document
2. Preview is shown
3. User clicks "Extract Timetable" button
4. **Gemini 2.0 Flash AI** analyzes the image/PDF
5. Extracts:
   - Day of week
   - Start and end times
   - Subject name and code
   - Class type (lecture/lab/tutorial)
   - Room number
   - Faculty name (if available)
6. Shows success message with number of classes found
7. Timetable data is passed to next screen

**Supported Formats:**
- Images: JPG, PNG
- Documents: PDF
- Languages: English primarily (AI can handle handwritten text with varying accuracy)

### Screen 3: Attendance Settings

**User selects minimum attendance percentage:**
- 75% (most common)
- 80%
- 85%
- 90%
- Custom percentage

**What happens:**
- This percentage is used to calculate:
  - How many classes can be bunked
  - Warnings when attendance is low
  - Required classes to attend to reach target

### Completion

After all 3 steps:

1. **Avatar Upload**: Profile photo uploaded to Firebase Storage at `avatars/{userId}.jpg`
2. **Firestore Write**: User profile saved to `/users/{userId}` document
3. **Timetable Save**: Timetable entries saved to `/users/{userId}/timetable/` collection
4. **Onboarding Flag**: `onboardingCompleted: true` is set
5. **Navigation**: User is redirected to main app (Dashboard)

## Data Structure

### User Profile (Firestore)
```typescript
{
  uid: "firebase_user_id",
  email: "student@college.edu",
  displayName: "John Doe",
  photoURL: "https://firebasestorage.googleapis.com/...",
  college: "ABC University",
  department: "Computer Science",
  semester: "5th Semester",
  rollNumber: "CS21001",
  section: "A",
  minimumAttendance: 75,
  onboardingCompleted: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Timetable Entry (Firestore)
```typescript
{
  id: "auto_generated_id",
  day: "Monday",
  startTime: "09:00",
  endTime: "10:00",
  subject: "Data Structures",
  subjectCode: "CS301",
  type: "lecture",
  room: "CS-101",
  faculty: "Dr. Smith"
}
```

## Testing the Onboarding Flow

### Test Case 1: New User Flow
1. Launch the app
2. Click "Sign Up"
3. Create account with email/password
4. You should be redirected to **Profile Setup Screen**
5. Fill in all details
6. Optionally upload avatar
7. Click "Next"
8. Upload a timetable image/PDF or skip
9. If uploaded, click "Extract Timetable"
10. Wait for AI extraction
11. Click "Next"
12. Select minimum attendance percentage
13. Click "Complete Setup"
14. You should land on the **Dashboard**

### Test Case 2: Returning User
1. Login with existing account
2. If onboarding is complete, go directly to Dashboard
3. If onboarding is incomplete, resume from last step

### Test Case 3: Timetable Extraction
Prepare a test timetable image with clear text showing:
- Days: Monday to Friday
- Time slots: e.g., 9:00-10:00, 10:00-11:00
- Subject names
- Room numbers

**Sample Timetable Format:**
```
Monday
09:00 - 10:00  |  Data Structures  |  CS-101  |  Lecture
10:00 - 11:00  |  Algorithms       |  CS-102  |  Lab

Tuesday
09:00 - 10:00  |  Database Systems |  CS-201  |  Lecture
```

## Troubleshooting

### Problem: "Could not extract timetable data"

**Possible Causes:**
1. **Invalid API Key** - Check `.env` file has correct Gemini API key
2. **Poor Image Quality** - Image is blurry or text is too small
3. **Unsupported Format** - Timetable format is too complex
4. **Network Issues** - No internet connection

**Solutions:**
- Verify Gemini API key is correct and active
- Use a high-quality, well-lit photo
- Ensure text is clear and readable
- Check internet connection
- Try a simpler timetable format first

### Problem: "Onboarding not triggering"

**Check:**
1. User is authenticated (logged in)
2. Firestore has user document at `/users/{userId}`
3. `onboardingCompleted` field is `false` or missing
4. Navigation logic in `app/_layout.tsx` is correct

**Debug:**
```typescript
// Add console logs in app/_layout.tsx
console.log('User:', user?.uid);
console.log('Onboarding Complete:', onboardingComplete);
console.log('Current Segment:', segments[0]);
```

### Problem: "Avatar image not uploading"

**Check:**
1. Firebase Storage is enabled
2. Storage rules allow authenticated writes
3. Image picker permissions are granted
4. Image file size is reasonable (<5MB)

**Storage Rules for Testing:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Problem: "Gemini API quota exceeded"

**Free Tier Limits:**
- 60 requests per minute
- 1,500 requests per day

**Solutions:**
- Wait for quota reset
- Upgrade to paid tier if needed
- Implement caching for repeated extractions

## Advanced Configuration

### Custom Gemini Extraction Prompt

Edit `src/services/geminiService.ts` to customize the AI extraction prompt:

```typescript
const prompt = `You are a timetable extraction expert. Analyze this timetable...`;
```

You can modify this prompt to:
- Handle specific timetable formats
- Extract additional fields
- Support different languages
- Improve accuracy for your use case

### Manual Timetable Entry (Coming Soon)

If AI extraction fails, users will be able to manually enter their timetable with a form-based UI.

## Security Best Practices

⚠️ **Before Production:**

1. **Firestore Rules**: Replace test rules with strict production rules
2. **Storage Rules**: Limit file sizes and types
3. **API Keys**: Restrict Gemini API key to your app's bundle ID
4. **Environment Variables**: Never commit `.env` to version control
5. **User Validation**: Validate all inputs on the server side

## Next Steps

After completing onboarding:

1. **Dashboard**: View attendance summary
2. **Attendance Tracking**: Mark attendance for each class
3. **Timetable View**: See weekly schedule
4. **Groups**: Create study groups
5. **Profile**: Edit profile and settings

## Support

For issues or questions:
1. Check Firebase Console for errors
2. Review Expo logs: `npx expo start`
3. Check Firestore for data consistency
4. Verify all environment variables are set

---

**Last Updated**: 2025-11-15
**App Version**: 1.0.0
