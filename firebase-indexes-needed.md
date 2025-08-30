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

### 3. Users Collection - Duplicate Prevention Indexes
**Collection:** `users`
**Fields for leaderboard with deleted user exclusion:**
- `isDeleted` (Ascending)
- `totalScore` (Descending)

**Fields for exact name lookup during registration:**
- `isDeleted` (Ascending)  
- `name` (Ascending)

**Fields for case-insensitive name lookup during registration:**
- `isDeleted` (Ascending)
- `nameLowercase` (Ascending)

## How to Create Indexes

### Quick Links to Create Each Index

Click these links to automatically create each required index:

1. **Activities - userSanitizedName + timestamp:**
   [Create Index](https://console.firebase.google.com/v1/r/project/iron-turtle-tracker/firestore/databases/-default-/indexes?create_composite=ClJwcm9qZWN0cy9pcm9uLXR1cnRsZS10cmFja2VyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hY3Rpdml0aWVzL2luZGV4ZXMvXxABGhQKEHVzZXJTYW5pdGl6ZWROYW1lEAEaCQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAg)

2. **Users - isDeleted + totalScore (for leaderboard):**
   [Create Index](https://console.firebase.google.com/v1/r/project/iron-turtle-tracker/firestore/databases/-default-/indexes?create_composite=CkVwcm9qZWN0cy9pcm9uLXR1cnRsZS10cmFja2VyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy91c2Vycy9pbmRleGVzL18QARoNCglpc0RlbGV0ZWQQARoOCgp0b3RhbFNjb3JlEAIaDAoIX19uYW1lX18QAg)

3. **Users - isDeleted + name (for exact name lookup):**
   [Create Index](https://console.firebase.google.com/v1/r/project/iron-turtle-tracker/firestore/databases/-default-/indexes?create_composite=CkVwcm9qZWN0cy9pcm9uLXR1cnRsZS10cmFja2VyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy91c2Vycy9pbmRleGVzL18QARoNCglpc0RlbGV0ZWQQARoICgRuYW1lEAEaDAoIX19uYW1lX18QAg)

4. **Users - isDeleted + nameLowercase (for case-insensitive lookup):**
   [Create Index](https://console.firebase.google.com/v1/r/project/iron-turtle-tracker/firestore/databases/-default-/indexes?create_composite=CkVwcm9qZWN0cy9pcm9uLXR1cnRsZS10cmFja2VyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy91c2Vycy9pbmRleGVzL18QARoNCglpc0RlbGV0ZWQQARoRCg1uYW1lTG93ZXJjYXNlEAEaDAoIX19uYW1lX18QAg)

5. **Users - isDeleted + lastLogin (for active users):**
   [Create Index](https://console.firebase.google.com/v1/r/project/iron-turtle-tracker/firestore/databases/-default-/indexes?create_composite=CkVwcm9qZWN0cy9pcm9uLXR1cnRsZS10cmFja2VyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy91c2Vycy9pbmRleGVzL18QARoNCglpc0RlbGV0ZWQQARoNCglsYXN0TG9naW4QAhoMCghfX25hbWVfXxAC)

### Manual Creation Steps

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