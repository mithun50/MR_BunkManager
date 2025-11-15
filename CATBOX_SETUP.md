# Catbox Image Upload - Setup Guide

## ✨ Why Catbox?

**Catbox.moe** is the BEST free image hosting service for this project:

✅ **Completely FREE** - No API key needed!
✅ **200MB max file size** - Way more than needed for avatars
✅ **Permanent storage** - Images never expire
✅ **No registration** - Works instantly
✅ **Fast CDN** - Quick image loading worldwide
✅ **No limits** - Unlimited uploads

## 🎯 Zero Setup Required!

Unlike other services (ImgBB, Cloudinary, Firebase Storage), Catbox requires:
- ❌ No API key
- ❌ No account registration
- ❌ No billing setup
- ❌ No configuration

**It just works!** 🚀

## 📸 How It Works

### Upload Flow
```
User picks/takes photo
    ↓
App reads image as base64
    ↓
Converts to Blob
    ↓
POST to https://catbox.moe/user/api.php
    ↓
Catbox returns URL: https://files.catbox.moe/abc123.jpg
    ↓
Save URL to Firestore
    ↓
Display in app
```

### Example URLs
```
https://files.catbox.moe/abc123.jpg
https://files.catbox.moe/xyz789.png
https://files.catbox.moe/def456.webp
```

## 🔧 Implementation

### Image Upload Service (`src/services/imageUploadService.ts`)

```typescript
async uploadImage(imageUri: string): Promise<string> {
  // Read image as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });

  // Convert to Blob
  const blob = this.base64ToBlob(base64, mimeType);

  // Create form data
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', blob, 'avatar.jpg');

  // Upload to Catbox
  const response = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: formData,
  });

  // Returns URL as plain text
  const url = await response.text();
  return url; // https://files.catbox.moe/...
}
```

### Onboarding Integration

```typescript
// Upload avatar to Catbox
if (profileData.photoURL && profileData.photoURL.startsWith('file://')) {
  try {
    photoURL = await imageUploadService.uploadImage(profileData.photoURL);
    console.log('Avatar uploaded:', photoURL);
  } catch (uploadError) {
    console.warn('Upload failed, continuing without avatar');
    photoURL = undefined;
  }
}
```

### Profile Display

```typescript
// Display avatar from Catbox URL
{profile?.photoURL ? (
  <Avatar.Image
    size={80}
    source={{ uri: profile.photoURL }}
  />
) : (
  <Avatar.Text
    size={80}
    label={profile?.displayName?.charAt(0) || 'U'}
  />
)}
```

## 📊 Comparison with Other Services

| Feature | Catbox | ImgBB | Firebase Storage | Cloudinary |
|---------|--------|-------|------------------|------------|
| **API Key** | ❌ None | ✅ Required | ✅ Required | ✅ Required |
| **Free Tier** | Unlimited | Unlimited | 5GB | 25GB/month |
| **Max File Size** | 200MB | 32MB | Configurable | 10MB (free) |
| **Setup Time** | 0 seconds | 5 minutes | 15 minutes | 10 minutes |
| **Billing** | Never | Never | After quota | After quota |
| **Expiration** | Never | Never | Never | Never |
| **CDN** | Yes | Yes | Yes | Yes |
| **Best For** | Perfect! | Good | Complex apps | Pro features |

## ✅ Advantages

### 1. Zero Configuration
- No `.env` variables needed
- No API keys to manage
- No account to create
- Works immediately

### 2. Perfect for This Use Case
- Small avatar images (<5MB typically)
- Permanent storage (no expiration)
- Direct CDN URLs
- Fast loading worldwide

### 3. Developer Friendly
- Simple API (just POST multipart form)
- Returns URL as plain text
- No complex authentication
- No rate limits (fair use)

### 4. Privacy & Security
- Images are public by URL (perfect for avatars)
- No tracking or analytics
- Open source friendly
- Trustworthy service (used by many apps)

## 🧪 Testing

### 1. Complete Onboarding
```bash
npx expo start
```

1. Create account / Login
2. Fill profile info
3. Upload avatar photo
4. Check console: "Avatar uploaded: https://files.catbox.moe/..."
5. Complete onboarding

### 2. Verify in Firestore
1. Open Firebase Console
2. Go to Firestore Database
3. Navigate to `users/{userId}`
4. Check `photoURL` field
5. Should have Catbox URL: `https://files.catbox.moe/...`

### 3. Test Profile Display
1. Go to Profile tab
2. Avatar should display from Catbox
3. Open browser DevTools
4. Check Network tab - image loads from `files.catbox.moe`

### 4. Manual Test
Visit: https://catbox.moe/
Upload any image
Copy the URL
Should look like: `https://files.catbox.moe/abc123.jpg`

## 🐛 Troubleshooting

### Error: "Failed to upload image"

**Possible Causes**:
1. No internet connection
2. Image too large (>200MB - very unlikely for avatars!)
3. Invalid image format
4. Network timeout

**Solutions**:
1. Check internet connection
2. Try with different image
3. Check console for detailed error
4. Retry upload

### Image Not Displaying

**Check**:
1. URL in Firestore starts with `https://files.catbox.moe/`
2. URL is accessible in browser
3. Image component has correct source prop
4. No CORS issues (Catbox has permissive CORS)

**Debug**:
```typescript
console.log('Photo URL:', profile.photoURL);
// Should be: https://files.catbox.moe/abc123.jpg
```

### Upload Takes Too Long

**Catbox is usually very fast (<2 seconds)**

If slow:
- Check internet speed
- Try smaller image (compress before upload)
- Check network latency

## 🔒 Privacy Considerations

### Public URLs
- Images uploaded to Catbox are **publicly accessible**
- Anyone with the URL can view the image
- Perfect for profile avatars (meant to be public)
- **Don't upload sensitive/private photos**

### URL Guessing
- URLs use random strings (abc123, xyz789, etc.)
- Very difficult to guess
- No directory listing
- Secure enough for avatars

### GDPR Compliance
- Users can delete images from Catbox
- Visit: https://catbox.moe/ → Upload → Manage
- Or simply don't share sensitive images

## 📈 Performance

### Upload Speed
- Typically **1-3 seconds** for avatar-sized images
- Depends on:
  - Image size (compress to <1MB for best performance)
  - Internet speed
  - Server load (usually low)

### Download Speed
- **Fast CDN** delivery
- Global edge locations
- Cached after first load
- Faster than Firebase Storage for simple use cases

### Reliability
- **99.9%+ uptime** (community reports)
- Been running for years
- Trusted by developers worldwide
- No known major outages

## 💡 Best Practices

### Image Optimization
```typescript
// In ImagePicker config
{
  quality: 0.8,        // Compress to 80%
  allowsEditing: true, // Crop to square
  aspect: [1, 1],      // Square avatar
}
```

### Error Handling
```typescript
try {
  photoURL = await imageUploadService.uploadImage(uri);
} catch (error) {
  // Continue without avatar - it's optional
  console.warn('Upload failed:', error);
  photoURL = undefined;
}
```

### User Feedback
```typescript
// Show loading state
setUploading(true);
const url = await imageUploadService.uploadImage(uri);
setUploading(false);
Alert.alert('Success', 'Avatar uploaded!');
```

## 🚀 Summary

**Catbox is the PERFECT choice because**:

1. ✅ **Zero setup** - works immediately
2. ✅ **Free forever** - no costs ever
3. ✅ **Simple API** - easy to implement
4. ✅ **Reliable** - proven track record
5. ✅ **Fast** - CDN delivery
6. ✅ **No limits** - unlimited uploads

**No other service beats this combination!**

---

**Official Website**: https://catbox.moe/
**API Documentation**: https://catbox.moe/user/api.php
**Status**: ✅ Implemented and ready to use!

**Last Updated**: 2025-11-15
