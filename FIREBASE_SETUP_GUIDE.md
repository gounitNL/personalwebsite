# 🔥 Firebase Authentication & Profile Setup Guide

## Overview
This guide will help you set up Firebase Authentication so players can:
- ✅ Create accounts with email/password or Google
- ✅ Login to saved profiles
- ✅ Save game progress to the cloud (not just localStorage)
- ✅ Access their character from any device
- ✅ Secure their data with authentication

---

## Part 1: Create Firebase Project (5 minutes)

### Step 1: Go to Firebase Console
1. Visit: **https://console.firebase.google.com/**
2. Click **"Add project"** or **"Create a project"**

### Step 2: Configure Project
1. **Project Name**: `FantasyQuest-MORPG` (or your preferred name)
2. Click **Continue**
3. **Google Analytics**: Turn OFF (optional feature)
4. Click **Create project**
5. Wait 30 seconds for setup
6. Click **Continue**

---

## Part 2: Enable Authentication (3 minutes)

### Enable Email/Password Login
1. Click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click **"Email/Password"**
5. Toggle **Enable** to ON
6. Click **Save**

### (Optional) Enable Google Sign-In
1. Click **"Google"** in sign-in methods
2. Toggle **Enable** to ON
3. Enter **Project support email** (your email)
4. Click **Save**

---

## Part 3: Setup Realtime Database (3 minutes)

### Create Database
1. Click **"Realtime Database"** in left sidebar
2. Click **"Create Database"**
3. Choose location:
   - `us-central1` (USA)
   - `europe-west1` (Europe)
   - `asia-southeast1` (Asia)
4. Click **Next**

### Set Initial Security Rules
1. Choose **"Start in test mode"**
2. Click **Enable**

⚠️ **Important**: Test mode allows anyone to read/write for 30 days. We'll secure it properly in Part 6!

### Get Database URL
- After creation, **copy the database URL** at the top
- Format: `https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com`
- **Save this URL!**

---

## Part 4: Get Your Firebase Configuration (2 minutes)

### Register Web App
1. Click **⚙️ Settings** (gear icon) in left sidebar
2. Click **"Project settings"**
3. Scroll to **"Your apps"** section
4. Click the **Web icon** (`</>`)
5. App nickname: `FantasyQuest Web`
6. ✅ Check **"Also set up Firebase Hosting"** (optional)
7. Click **"Register app"**

### Copy Configuration
You'll see code like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnop",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**📋 COPY THIS ENTIRE OBJECT!**

8. Click **"Continue to console"**

---

## Part 5: Update Game Code with Your Config

### Replace Firebase Config in online.html

Find this section in your `online.html` (around line 894):

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBqZL5fJ9K7nX8yQ2wM4vH6dR3tP5cE8aG",  // ← REPLACE
    authDomain: "fantasyquest-mmorpg.firebaseapp.com", // ← REPLACE
    databaseURL: "https://fantasyquest-mmorpg-default-rtdb.firebaseio.com", // ← REPLACE
    projectId: "fantasyquest-mmorpg",                  // ← REPLACE
    storageBucket: "fantasyquest-mmorpg.appspot.com",  // ← REPLACE
    messagingSenderId: "123456789012",                 // ← REPLACE
    appId: "1:123456789012:web:abcdef123456"          // ← REPLACE
};
```

**Replace it with YOUR config from Part 4!**

---

## Part 6: Secure Your Database (IMPORTANT!)

After testing, secure your database with proper rules.

### Go to Database Rules
1. In Firebase Console, go to **Realtime Database**
2. Click the **"Rules"** tab
3. Replace the rules with this:

```json
{
  "rules": {
    "players": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    "user_profiles": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "chat": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

**What this does:**
- ✅ Players can see each other (multiplayer)
- ✅ Only you can write to your own profile
- ✅ Everyone can read chat
- ✅ Only authenticated users can send chat
- ✅ Prevents unauthorized access

4. Click **"Publish"**

---

## Part 7: Test Your Setup

### Create First Account
1. Open your game in browser
2. Click **"Create Account"** tab
3. Enter email and password
4. Click **"Sign Up"**
5. You should be logged in!

### Verify in Firebase Console
1. Go to **Authentication** → **Users** tab
2. You should see your new user!
3. Go to **Realtime Database** → **Data** tab
4. You should see `user_profiles/[YOUR_UID]` with your game data!

### Test Cloud Save
1. Play the game (kill monsters, gather resources)
2. Close the browser tab
3. Reopen the game
4. Login with same email/password
5. Your progress should be restored! ✅

---

## Part 8: Understanding the New Features

### What Changed in the Game:

1. **Authentication System**
   - Email/password registration
   - Email/password login
   - Google Sign-In (if enabled)
   - Automatic token refresh
   - Secure logout

2. **Cloud Profile Storage**
   - All game data saved to Firebase
   - Syncs across devices
   - Persistent storage (not just localStorage)
   - User-specific data paths

3. **Security**
   - Only authenticated users can play
   - Users can only modify their own data
   - Profile data is private
   - Player positions are public (multiplayer)

### Data Structure in Firebase:
```
firebase-database/
├── user_profiles/
│   └── [USER_UID]/
│       ├── name: "PlayerName"
│       ├── level: 10
│       ├── gold: 500
│       ├── equipment: {...}
│       ├── inventory: {...}
│       ├── pet: "Wolf Pup"
│       └── achievements: [...]
├── players/
│   └── [USER_UID]/
│       ├── x, y, z (position)
│       ├── rotation
│       └── lastActive
└── chat/
    └── [MESSAGE_ID]/
        ├── player: "Name"
        ├── message: "Hello!"
        └── timestamp
```

---

## Troubleshooting

### Issue: "Permission denied" error
**Solution**: Check your Database Rules in Part 6. Make sure auth is enabled.

### Issue: "Auth domain not configured"
**Solution**: Verify `authDomain` in firebaseConfig matches your project.

### Issue: "User not found" after signup
**Solution**: Check Firebase Console → Authentication → Users. User should appear there.

### Issue: Data not saving
**Solution**: 
1. Check browser console for errors
2. Verify Database Rules allow writes
3. Make sure user is authenticated (`firebase.auth().currentUser` is not null)

### Issue: "CORS error" or "Network error"
**Solution**:
1. Make sure you're accessing via `http://localhost` or deployed URL
2. Check if `databaseURL` is correct
3. Verify Firebase project is active

---

## Next Steps

### After Basic Setup Works:

1. **Add Password Reset**
   - Use `firebase.auth().sendPasswordResetEmail(email)`

2. **Add Email Verification**
   - Use `firebase.auth().currentUser.sendEmailVerification()`

3. **Add Anonymous Authentication**
   - Let players try the game without signup
   - Convert to real account later

4. **Add Social Login**
   - Enable Facebook, Twitter, GitHub login
   - Same process as Google Sign-In

5. **Add Profile Pictures**
   - Use Firebase Storage
   - Upload avatar images

6. **Add Friends System**
   - Store friend lists in database
   - Send friend requests

---

## Security Best Practices

✅ **DO:**
- Use environment variables for API keys in production
- Enable email verification
- Use HTTPS for your website
- Regularly update Firebase SDK
- Monitor usage in Firebase Console

❌ **DON'T:**
- Share your Firebase config publicly (it's in your HTML!)
- Use test mode rules in production
- Store sensitive data (passwords, credit cards) in Realtime Database
- Give write access to everyone

---

## Cost Considerations

### Firebase Free Tier (Spark Plan):
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 1 GB stored data
- ✅ 10 GB/month bandwidth
- ✅ Unlimited users

**This is plenty for testing and small games!**

### When to Upgrade (Blaze Plan):
- More than 100 concurrent players
- Storing lots of player data (>1 GB)
- High read/write volume
- Need more features (Functions, ML Kit)

---

## Support Resources

- 📚 **Firebase Docs**: https://firebase.google.com/docs
- 💬 **Stack Overflow**: Tag `firebase`
- 🎮 **Firebase Gaming**: https://firebase.google.com/games
- 📧 **Firebase Support**: Firebase Console → Help

---

## Summary Checklist

- [ ] Created Firebase project
- [ ] Enabled Email/Password authentication
- [ ] Created Realtime Database
- [ ] Copied Firebase configuration
- [ ] Updated firebaseConfig in online.html
- [ ] Added authentication UI code
- [ ] Tested account creation
- [ ] Tested login
- [ ] Verified data saves to cloud
- [ ] Applied security rules
- [ ] Tested on different devices
- [ ] Documented API keys safely

**You're ready to launch! 🚀**
