# EAS Secrets Setup Guide

## Problem
When building with EAS, environment variables from `.env` file are **NOT automatically included** in the build. You were getting "API key not valid" errors because the keys weren't being loaded.

## ❌ WRONG Solution (Security Risk)
Don't hardcode secrets in `eas.json`:
```json
"env": {
  "EXPO_PUBLIC_GROQ_API_KEY": "gsk_xxxxx"  // ❌ DON'T DO THIS - exposes secrets in Git
}
```

## ✅ CORRECT Solution: Use EAS Secrets

### Step 1: Set EAS Secrets (One Time Setup)

Run these commands to securely store your environment variables:

```bash
# Groq API Key
eas secret:create --scope project --name EXPO_PUBLIC_GROQ_API_KEY --value "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" --type string

# Firebase API Key
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIzaSyDONcwK_OTNhejSl5UnabpZAhah6fMXsf8" --type string

# Firebase Auth Domain
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "mr-bunkmanager.firebaseapp.com" --type string

# Firebase Project ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "mr-bunkmanager" --type string

# Firebase Storage Bucket
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "mr-bunkmanager.firebasestorage.app" --type string

# Firebase Messaging Sender ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "1057431059560" --type string

# Firebase App ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:1057431059560:android:3bfa104eb14ac23e574fdd" --type string

# Backend URL
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "https://mr-bunk-manager.vercel.app" --type string
```

### Step 2: Verify Secrets Are Set

```bash
eas secret:list
```

You should see all 8 secrets listed.

### Step 3: Build Your App

Now when you build, EAS will automatically inject these secrets:

```bash
# Development build
eas build --platform android --profile development

# Preview build
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

## How It Works

1. **Local development** (`expo start`): Uses `.env` file ✅
2. **EAS builds**: Uses EAS Secrets ✅
3. **Git repository**: No secrets exposed ✅

## Updating Secrets

If you need to update a secret:

```bash
# Delete old secret
eas secret:delete --name EXPO_PUBLIC_GROQ_API_KEY

# Create new secret
eas secret:create --scope project --name EXPO_PUBLIC_GROQ_API_KEY --value "new_key_here" --type string
```

## Troubleshooting

### "API key not valid" during build
- Make sure you've run the `eas secret:create` commands
- Verify secrets exist: `eas secret:list`
- Rebuild: `eas build --platform android --profile preview --clear-cache`

### Secrets not loading
- Check secret names match exactly (case-sensitive)
- Must start with `EXPO_PUBLIC_` for client-side access
- Try clearing build cache: `--clear-cache` flag

## Security Best Practices

✅ **DO:**
- Use EAS Secrets for all API keys and sensitive data
- Keep `.env` in `.gitignore`
- Use different keys for dev/staging/production

❌ **DON'T:**
- Commit secrets to Git (in `eas.json` or anywhere else)
- Share API keys publicly
- Use production keys in development builds
