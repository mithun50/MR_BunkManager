# ImgBB Image Upload Setup

## Why ImgBB?

Since Firebase Storage requires billing, we're using **ImgBB** - a free image hosting service with:

✅ **Unlimited uploads** (free tier)
✅ **32MB max file size** (more than enough for avatars)
✅ **Direct URL access** (perfect for Firestore)
✅ **No billing required**
✅ **Fast CDN delivery**
✅ **Permanent image hosting**

## Get Your Free API Key

### Step 1: Create Account
1. Visit: https://imgbb.com/
2. Click **"Sign Up"** (top right)
3. Create account with email or use Google/Facebook login

### Step 2: Get API Key
1. After logging in, visit: https://api.imgbb.com/
2. Click **"Get API Key"** button
3. Your API key will be displayed
4. Copy the API key

### Step 3: Add to Your App
1. Open `.env` file in your project
2. Find this line:
   ```env
   EXPO_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key_here
   ```
3. Replace `your_imgbb_api_key_here` with your actual API key:
   ```env
   EXPO_PUBLIC_IMGBB_API_KEY=abc123xyz456...
   ```

### Step 4: Restart App
```bash
# Stop the dev server (Ctrl+C)
# Start again
npx expo start
```

## How It Works

### Avatar Upload Flow
1. User selects/takes photo → Local file URI
2. App converts image to base64
3. Uploads to ImgBB API
4. ImgBB returns permanent URL
5. URL saved to Firestore (not the image)
6. Image displayed from ImgBB CDN

### Example URLs
```
https://i.ibb.co/abc123/avatar.jpg
https://i.ibb.co/xyz789/profile-pic.png
```

## Benefits Over Firebase Storage

| Feature | ImgBB | Firebase Storage |
|---------|-------|------------------|
| Free tier | Unlimited uploads | Limited (5GB total, then paid) |
| Setup | Just API key | Requires billing account |
| Max file size | 32MB | Configurable |
| URL format | Direct CDN link | Signed URLs (expire) |
| Cost | FREE forever | $0.026/GB after free tier |

## API Limits (Free Tier)

- **Uploads per hour**: No official limit (fair use)
- **Max file size**: 32MB
- **Bandwidth**: Unlimited
- **Storage**: Unlimited
- **CDN**: Yes (fast worldwide delivery)

## Testing

### Test Upload Manually
1. Go to: https://imgbb.com/upload
2. Upload any image
3. Copy the direct link
4. Paste in browser - should display image

### Test in App
1. Complete profile setup
2. Upload avatar photo
3. Check console - should see: "Avatar uploaded successfully: https://i.ibb.co/..."
4. Go to Firebase Console → Firestore → users/{userId}
5. Check `photoURL` field - should have ImgBB URL

## Troubleshooting

### Error: "Failed to upload image"
**Causes**:
- Invalid API key
- No internet connection
- Image too large (>32MB)
- Rate limit exceeded

**Solutions**:
1. Verify API key is correct in `.env`
2. Check internet connection
3. Compress image before upload
4. Wait a few minutes if rate limited

### Error: "API key is required"
**Fix**: Make sure you've added the API key to `.env` and restarted the dev server

### Image not displaying
**Check**:
1. URL in Firestore is valid ImgBB URL
2. URL starts with `https://i.ibb.co/`
3. URL is accessible in browser
4. Image component has correct URI prop

## Privacy & Security

### Image Privacy
- Images uploaded to ImgBB are **publicly accessible** by URL
- Don't upload sensitive/private photos
- Perfect for profile avatars (intended to be public anyway)

### API Key Security
- ✅ API key in `.env` file (gitignored)
- ✅ Key only allows uploads (can't delete/manage)
- ✅ Free tier limits prevent abuse

### Best Practices
1. Don't commit `.env` to git
2. Use `.gitignore` to exclude `.env`
3. Rotate API key if compromised
4. Monitor usage on ImgBB dashboard

## Alternative: Cloudinary (If Needed)

If you outgrow ImgBB, consider **Cloudinary**:
- Free tier: 25GB storage, 25GB bandwidth/month
- Advanced features: image optimization, transformations
- More generous limits
- Get started: https://cloudinary.com/

## Image Preview in App

Images from ImgBB can be displayed directly:

```typescript
// In React Native
<Image
  source={{ uri: user.photoURL }}
  style={{ width: 100, height: 100 }}
/>

// With React Native Paper Avatar
<Avatar.Image
  size={100}
  source={{ uri: user.photoURL }}
/>
```

No special configuration needed - just use the URL!

## Monitoring Usage

1. Login to: https://imgbb.com/
2. Go to **"My Images"**
3. View all uploaded images
4. Check bandwidth usage
5. Delete old images if needed

## Summary

✅ **Free forever** (unlimited uploads)
✅ **Easy setup** (just API key)
✅ **No billing** required
✅ **Works perfectly** with Firestore
✅ **Fast CDN** delivery worldwide

**Get your API key now**: https://api.imgbb.com/

---

**Last Updated**: 2025-11-15
