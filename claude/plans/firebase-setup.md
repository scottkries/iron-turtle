# Firebase Setup and Usage Guide

## Overview

The Iron Turtle Challenge Tracker uses Firebase for:
- **Authentication**: Anonymous user authentication with display names
- **Firestore Database**: Storing user data, activities, and leaderboard
- **Real-time Updates**: Live synchronization across devices

## Current Firebase Configuration (Verified Working ✅)

### Project Details
- **Project ID**: `iron-turtle-tracker`
- **Auth Domain**: `iron-turtle-tracker.firebaseapp.com`
- **Database URL**: `https://iron-turtle-tracker-default-rtdb.firebaseio.com`
- **API Key**: `AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8`
- **App ID**: `1:923369775122:web:71cd2023c2b92148f7f8cb`

### Status (Last Tested: December 2024)
- ✅ **Firestore Database**: Enabled and operational
- ✅ **Anonymous Authentication**: Enabled and working
- ✅ **API Access**: Fully functional
- ✅ **Read/Write Operations**: Tested and verified

---

## Phase 1: Firebase Project Setup (15 minutes)

### Step 1: Create Firebase Project (5 minutes)
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Create a project"
3. Project name: "iron-turtle-tracker"
4. Disable Google Analytics (we don't need it)
5. Click "Create project"

### Step 2: Set Up Realtime Database (5 minutes)
1. In Firebase console → "Realtime Database"
2. Click "Create Database"
3. Choose location: "United States (us-central1)"
4. **Security Rules**: Select "Start in test mode" (open read/write)
5. Click "Enable"

### Step 3: Get Configuration (5 minutes)
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click web icon `</>`
4. App nickname: "iron-turtle-web"
5. **Don't check** "Set up Firebase Hosting"
6. Click "Register app"
7. **Copy the config object** - you'll need this!

```javascript
// Your config will look like this:
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXX",
  authDomain: "iron-turtle-tracker.firebaseapp.com",
  databaseURL: "https://iron-turtle-tracker-default-rtdb.firebaseio.com/",
  projectId: "iron-turtle-tracker",
  storageBucket: "iron-turtle-tracker.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijk"
};
```

---

## Phase 2: Code Integration (2 hours)

### Step 1: Add Firebase to HTML (15 minutes)
**Add these script tags to your `index.html` BEFORE your existing scripts:**

```html
<!-- Firebase CDN -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>

<!-- Your existing scripts -->
<script src="js/activities.js"></script>
<script src="js/scoring.js"></script>
<script src="js/app.js"></script>
```

### Step 2: Initialize Firebase in app.js (15 minutes)
**Add this to the TOP of your `js/app.js` file:**

```javascript
// Firebase configuration (paste your config here)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com/",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Test Firebase connection
database.ref('.info/connected').on('value', (snapshot) => {
  if (snapshot.val() === true) {
    console.log('✅ Connected to Firebase');
  } else {
    console.log('❌ Disconnected from Firebase');
  }
});
```

### Step 3: Replace localStorage with Firebase (90 minutes)

**Create new Firebase functions in `js/app.js`:**

```javascript
// Save activity to Firebase
function saveActivity(activity) {
  // Generate unique key with timestamp
  const activityRef = database.ref('activities').push();

  return activityRef.set({
    user: activity.user,
    activity: activity.activity,
    basePoints: activity.basePoints,
    multipliers: activity.multipliers,
    finalPoints: activity.finalPoints,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    category: activity.category
  });
}

// Listen for real-time activity updates
function listenToActivities() {
  database.ref('activities').on('value', (snapshot) => {
    const activities = [];
    snapshot.forEach((child) => {
      activities.push({
        id: child.key,
        ...child.val()
      });
    });

    // Update leaderboard with new data
    updateLeaderboard(activities);
  });
}

// Initialize real-time listening when app starts
function initializeApp() {
  // Your existing initialization code...

  // Start listening for activity updates
  listenToActivities();
}
```

**Update your activity submission function:**

```javascript
// Replace your existing submitActivity function
async function submitActivity() {
  const user = getCurrentUser();
  const activity = getCurrentSelectedActivity();
  const multipliers = getSelectedMultipliers();

  const activityData = {
    user: user.name,
    activity: activity.name,
    basePoints: activity.basePoints,
    multipliers: multipliers.map(m => m.id),
    finalPoints: calculateActivityPoints(activity, multipliers),
    category: activity.category
  };

  try {
    // Save to Firebase (real-time updates happen automatically)
    await saveActivity(activityData);

    showSuccessMessage(`Logged "${activity.name}" for ${activityData.finalPoints} points!`);
    closeActivityModal();

  } catch (error) {
    console.error('Error saving activity:', error);
    showErrorMessage('Failed to save activity. Please try again.');
  }
}
```

---

## Phase 3: Database Rules (Optional - 5 minutes)

**If you want slightly more structure, update Firebase rules:**

1. Go to Firebase Console → Realtime Database → Rules
2. Replace with these simple rules:

```json
{
  "rules": {
    "activities": {
      ".read": true,
      ".write": true,
      "$activityId": {
        ".validate": "newData.hasChildren(['user', 'activity', 'finalPoints'])"
      }
    }
  }
}
```

**For ultra-simple setup, just leave the default test rules (open read/write).**

---

## Testing Your Firebase Integration

### Test 1: Firebase Connection (5 minutes)
1. Open browser dev tools → Console
2. Load your app
3. Look for "✅ Connected to Firebase" message
4. If you see errors, check your config and internet connection

### Test 2: Activity Logging (10 minutes)
1. Register a user
2. Log an activity
3. Check Firebase Console → Database → activities
4. You should see your activity data appear

### Test 3: Real-time Updates (10 minutes)
1. Open app in two different browser tabs/devices
2. Register as different users in each
3. Log activity in one tab
4. Watch leaderboard update in the other tab within seconds

---

## What Changed from localStorage Plan

### Removed ❌
- All localStorage activity storage
- Manual leaderboard updates
- Data persistence concerns

### Added ✅
- Firebase CDN scripts in HTML
- Firebase config and initialization
- Real-time activity listening
- Firebase activity saving
- Automatic conflict resolution

### Stayed the Same ✅
- User session management (still localStorage)
- Activity database (still static JS file)
- UI components and styling
- Search and multiplier logic

---

## Firebase Benefits You Get

✅ **Real-time updates**: Leaderboard updates instantly across all devices
✅ **Conflict-free**: Firebase handles simultaneous saves automatically
✅ **Offline support**: Firebase caches data locally when offline
✅ **Automatic sync**: Data syncs when connection returns
✅ **Zero server management**: Firebase handles all infrastructure

---

## Troubleshooting Common Issues

### "Firebase is not defined" error
- Check that Firebase scripts load BEFORE your app.js
- Verify CDN URLs are correct

### "Permission denied" error
- Check database rules allow read/write
- Verify your Firebase config is correct

### Activities not appearing in real-time
- Check browser console for connection errors
- Verify `listenToActivities()` is called during app initialization

### Firebase Console shows no data
- Check your `saveActivity()` function for errors
- Verify you're saving to the correct database URL

---

**Total Additional Complexity**: ~2.5 hours
**Benefit**: Perfect real-time competitive leaderboard experience
**Result**: True shared leaderboard where everyone sees everyone's activities instantly

---

## Quick Testing

### Verify Firebase Status
Run this single command to test everything:
```bash
./test-firebase-api.sh --cleanup
```

Expected output:
- ✅ All 6 tests should pass
- User creation, reading, updating, activities, and leaderboard all work
- Test data is automatically cleaned up

## Testing Firebase with CLI Tools

### 1. REST API Testing Script

The `test-firebase-api.sh` script provides comprehensive Firebase testing:

```bash
# Make the script executable
chmod +x test-firebase-api.sh

# Run all tests
./test-firebase-api.sh

# Run tests and cleanup test data
./test-firebase-api.sh --cleanup

# Show help
./test-firebase-api.sh --help
```

The script tests:
- Creating users in Firestore
- Reading all users
- Updating user scores
- Adding activities
- Querying user activities
- Getting leaderboard data
- Cleaning up test data

### 2. Manual API Testing with cURL

#### Add Data to Firestore

**Create a User:**
```bash
curl -X POST \
  "https://firestore.googleapis.com/v1/projects/iron-turtle-tracker/databases/(default)/documents/users?documentId=test_user_001&key=AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "name": {"stringValue": "John Doe"},
      "totalScore": {"integerValue": 100},
      "createdAt": {"timestampValue": "2024-01-01T00:00:00Z"}
    }
  }'
```

**Add an Activity:**
```bash
curl -X POST \
  "https://firestore.googleapis.com/v1/projects/iron-turtle-tracker/databases/(default)/documents/activities?key=AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "userId": {"stringValue": "test_user_001"},
      "type": {"stringValue": "Stretching"},
      "duration": {"integerValue": 30},
      "points": {"integerValue": 15},
      "timestamp": {"timestampValue": "2024-01-01T00:00:00Z"}
    }
  }'
```

#### Read Data from Firestore

**Get All Users:**
```bash
curl -X GET \
  "https://firestore.googleapis.com/v1/projects/iron-turtle-tracker/databases/(default)/documents/users?key=AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8"
```

**Query Top Users (Leaderboard):**
```bash
curl -X POST \
  "https://firestore.googleapis.com/v1/projects/iron-turtle-tracker/databases/(default)/documents:runQuery?key=AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8" \
  -H "Content-Type: application/json" \
  -d '{
    "structuredQuery": {
      "from": [{"collectionId": "users"}],
      "orderBy": [{
        "field": {"fieldPath": "totalScore"},
        "direction": "DESCENDING"
      }],
      "limit": 10
    }
  }'
```

**Get Activities for a User:**
```bash
curl -X POST \
  "https://firestore.googleapis.com/v1/projects/iron-turtle-tracker/databases/(default)/documents:runQuery?key=AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8" \
  -H "Content-Type: application/json" \
  -d '{
    "structuredQuery": {
      "from": [{"collectionId": "activities"}],
      "where": {
        "fieldFilter": {
          "field": {"fieldPath": "userId"},
          "op": "EQUAL",
          "value": {"stringValue": "test_user_001"}
        }
      }
    }
  }'
```

#### Update Data

**Update User Score:**
```bash
curl -X PATCH \
  "https://firestore.googleapis.com/v1/projects/iron-turtle-tracker/databases/(default)/documents/users/test_user_001?updateMask.fieldPaths=totalScore&key=AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "totalScore": {"integerValue": 250}
    }
  }'
```

#### Delete Data

**Delete a User:**
```bash
curl -X DELETE \
  "https://firestore.googleapis.com/v1/projects/iron-turtle-tracker/databases/(default)/documents/users/test_user_001?key=AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8"
```

### 3. Web-based Testing

Open `test-firebase.html` in a browser to test all Firebase features with a UI:
- Firebase initialization status
- Anonymous authentication
- User creation and management
- Activity logging
- Leaderboard queries
- Full integration testing

---

## Data Structure

### Firestore Collections

#### Users Collection
```javascript
{
  "userId": {
    "name": "string",           // Display name
    "totalScore": "number",      // Total points
    "createdAt": "timestamp",    // Account creation
    "lastUpdated": "timestamp"   // Last activity
  }
}
```

#### Activities Collection
```javascript
{
  "activityId": {
    "userId": "string",          // User reference
    "type": "string",            // Activity type
    "duration": "number",        // Minutes
    "points": "number",          // Points earned
    "date": "string",            // ISO date
    "timestamp": "timestamp"     // Server time
  }
}
```

---

## Troubleshooting

### Common Issues and Solutions

1. **"Cloud Firestore API has not been used" Error**
   - Solution: Enable the API at the provided URL
   - Wait 2-3 minutes for activation

2. **403 Permission Denied**
   - Check Firestore security rules in Firebase Console
   - Verify API key is correct
   - Ensure authentication is properly configured

3. **No Data Appearing**
   - Check browser console for errors
   - Verify Firebase initialization in firebase-config.js
   - Test connection with `./test-firebase-api.sh`

4. **CORS Issues**
   - Use Firebase SDK instead of REST API for web apps
   - Add domain to authorized domains in Firebase Console

---

## Next Steps

1. **Enable Firestore API** (Required)
   - Visit: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=iron-turtle-tracker
   - Click "Enable API"

2. **Test Connection**
   ```bash
   ./test-firebase-api.sh
   ```

3. **Configure Security Rules** (Production)
   - Go to Firebase Console → Firestore → Rules
   - Implement proper access controls

4. **Monitor Usage**
   - Check Firebase Console for usage statistics
   - Set up budget alerts if needed
