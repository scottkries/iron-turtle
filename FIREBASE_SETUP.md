# Firebase Setup Instructions

## Bulk Deploy All Indexes at Once

**Yes, there's an easy way to bulk add all Firebase indexes!** 

### Prerequisites

1. Install Firebase CLI if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init
   ```
   - Select "Firestore" when prompted
   - Choose your existing project (`iron-turtle-tracker`)

### One-Command Bulk Index Deployment

Deploy all indexes defined in `firestore.indexes.json` with a single command:

```bash
firebase deploy --only firestore:indexes
```

This will create all **9 composite indexes** needed for optimal performance:

### Activities Collection (4 indexes)
1. `userSanitizedName + timestamp` (DESC) - User activity queries
2. `userName + timestamp` (DESC) - Legacy user queries  
3. `userId + timestamp` (DESC) - Backward compatibility
4. `userSanitizedName + activityId` - Activity lookups

### Users Collection (5 indexes)  
5. `totalScore` (DESC) - Basic leaderboard
6. `name` (ASC) - Name lookups
7. `isDeleted + totalScore` (DESC) - Filtered leaderboard
8. `isDeleted + name` (ASC) - Duplicate prevention by exact name
9. `isDeleted + nameLowercase` (ASC) - Duplicate prevention case-insensitive
10. `isDeleted + lastLogin` (DESC) - Active user queries

### Verify Deployment

After deployment, check the Firebase Console:
- Go to [Firestore Indexes](https://console.firebase.google.com/project/iron-turtle-tracker/firestore/indexes)
- You should see all indexes listed as "Building" or "Enabled"

### Benefits

✅ **Single command** deploys all indexes  
✅ **Version control** - indexes are stored in code  
✅ **Consistent** across environments  
✅ **Fast queries** - no more fallback logic needed  
✅ **Robust duplicate prevention** - multiple lookup strategies

### Troubleshooting

If deployment fails:
1. Check you're logged into the correct Firebase project
2. Verify `firestore.indexes.json` syntax is valid
3. Ensure you have proper permissions on the Firebase project

### Alternative: Deploy Everything

To deploy indexes, rules, and functions (if any) all at once:
```bash
firebase deploy
```

This method is much faster than clicking individual links and ensures all your indexes are properly version controlled!