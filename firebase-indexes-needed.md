# Firebase Indexes Required

## Issue
The app is getting Firebase index errors when querying activities. These indexes need to be created in the Firebase Console.

## Required Indexes

### 1. Activities Collection - userSanitizedName + timestamp
**Collection:** `activities`
**Fields:**
- `userSanitizedName` (Ascending)
- `timestamp` (Descending)

**Firebase Console URL:**
https://console.firebase.google.com/v1/r/project/iron-turtle-tracker/firestore/databases/-default-/compose-index?create_exempt_index_parent=activities&create_exempt_index_fields=userSanitizedName:ASC,timestamp:DESC

### 2. Activities Collection - userId + timestamp (backward compatibility)
**Collection:** `activities`  
**Fields:**
- `userId` (Ascending)
- `timestamp` (Descending)

## How to Create Indexes

1. Go to [Firebase Console](https://console.firebase.google.com/project/iron-turtle-tracker/firestore/indexes)
2. Click "Create Index"
3. Add the fields as specified above
4. Click "Create"

Alternatively, click the URLs provided in the error messages to automatically create the required indexes.

## Temporary Workaround

The code has been updated with fallback logic that:
1. Tries to use ordered queries first (requires indexes)
2. Falls back to unordered queries if indexes aren't available
3. Sorts results client-side when needed

This allows the app to work immediately while you create the proper indexes for better performance.

## Status

- ✅ Code updated with fallback logic
- ⏳ Firebase indexes need to be created for optimal performance