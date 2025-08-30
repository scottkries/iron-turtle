# Fix Firebase Indexing for Iron Turtle

## Problem
The Iron Turtle application is showing Firebase indexing errors that prevent player activity data from loading in the stats modal. While the leaderboard clicks work correctly, the modal shows empty data.

## Solution Steps

### 1. Create Required Firebase Index

Click this link to create the required composite index:

**[Create Firebase Index](https://console.firebase.google.com/v1/r/project/iron-turtle-tracker/firestore/indexes?create_composite=ClZwcm9qZWN0cy9pcm9uLXR1cnRsZS10cmFja2VyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hY3Rpdml0aWVzL2luZGV4ZXMvXxABGhUKEXVzZXJTYW5pdGl6ZWROYW1lEAEaDQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAg)**

### 2. Manual Index Creation (Alternative)

If the link doesn't work, create the index manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `iron-turtle-tracker`
3. Navigate to **Firestore Database** > **Indexes**
4. Click **Create Index**
5. Configure:
   - **Collection**: `activities`
   - **Fields**:
     - Field 1: `userSanitizedName` (Ascending)
     - Field 2: `timestamp` (Descending)
6. Click **Create**

### 3. Index Configuration Details

```
Collection ID: activities
Fields:
  - userSanitizedName: Ascending
  - timestamp: Descending
Query Scope: Collection
Status: Building -> Enabled (takes a few minutes)
```

### 4. Verify Fix

After creating the index:

1. Wait 2-5 minutes for the index to build
2. Refresh the Iron Turtle application
3. Click on any leaderboard entry
4. Verify that the stats modal now shows activity data instead of "0 activities"

## Expected Results

**Before Fix:**
- ❌ Console shows Firebase indexing errors
- ❌ Player stats modal shows 0 activities and 0 points
- ✅ Modal still opens (click functionality works)

**After Fix:**
- ✅ No Firebase indexing errors
- ✅ Player stats modal shows actual activity data
- ✅ Modal continues to work correctly

## Troubleshooting

### If the index creation fails:
1. Verify you have admin access to the Firebase project
2. Check that the Firestore database is active
3. Try creating the index through Firebase CLI:
   ```bash
   firebase firestore:indexes
   ```

### If data still doesn't load after index creation:
1. Wait longer (indexes can take up to 10 minutes to fully build)
2. Check Firebase Console > Indexes tab for status
3. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
4. Clear browser cache

### If you see different indexing errors:
The application might need additional indexes for other queries. Create them as they appear using the same process.

## Technical Notes

The error occurs because Firestore requires composite indexes for queries that:
1. Filter on one field (`userSanitizedName`) 
2. AND sort by another field (`timestamp`)
3. The query: `activities.where('userSanitizedName', '==', userId).orderBy('timestamp', 'desc')`

This is a standard Firestore requirement and not a code bug.