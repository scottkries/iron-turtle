# Firebase Composite Index Configuration

## Required Indexes

The Iron Turtle application requires several composite indexes in Firestore for optimal query performance. 

### Automatic Index Creation

When you first run queries that require composite indexes, Firebase will log errors in the browser console with direct links to create the required indexes. Simply:

1. Open the browser console (F12)
2. Look for errors containing "The query requires an index"
3. Click the provided link to create the index automatically
4. Wait 2-3 minutes for the index to build

### Manual Index Creation

Alternatively, you can create the indexes manually in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database → Indexes
4. Click "Create Index" and add the following:

#### Index 1: User Activities by Timestamp
- **Collection**: activities
- **Fields**:
  - userSanitizedName (Ascending)
  - timestamp (Descending)
- **Query scope**: Collection

#### Index 2: User Activities by Name
- **Collection**: activities
- **Fields**:
  - userName (Ascending)
  - timestamp (Descending)
- **Query scope**: Collection

#### Index 3: User Activities by ID
- **Collection**: activities
- **Fields**:
  - userId (Ascending)
  - timestamp (Descending)
- **Query scope**: Collection

#### Index 4: User One-Time Tasks
- **Collection**: activities
- **Fields**:
  - userSanitizedName (Ascending)
  - activityId (Ascending)
- **Query scope**: Collection

### Using Firebase CLI

If you have Firebase CLI installed, you can deploy indexes using:

```bash
firebase deploy --only firestore:indexes
```

This will use the `firestore.indexes.json` file in the project root.

## Index Building Time

- Indexes typically take 2-10 minutes to build
- You'll see a "Building" status in the Firebase Console
- Once status shows "Enabled", the index is ready

## Troubleshooting

If you continue to see index errors:
1. Check the exact field names in the error message
2. Ensure you're creating the index in the correct project
3. Wait for the index status to show "Enabled"
4. Clear browser cache and retry

The application will fall back to localStorage if Firebase queries fail, so the app remains functional while indexes are building.