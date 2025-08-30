# Firebase Index Setup Instructions

## Option 1: Using Firebase CLI (Recommended)

If you have Firebase CLI installed:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in the project directory
firebase init firestore

# Deploy only the indexes
firebase deploy --only firestore:indexes
```

## Option 2: Manual Setup in Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Select your project: **iron-turtle-tracker**
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index** for each of the following:

### Required Indexes:

#### Index 1: User Activities by Sanitized Name
- **Collection ID**: `activities`
- **Fields to index**:
  - Field path: `userSanitizedName` → Order: `Ascending`
  - Field path: `timestamp` → Order: `Descending`
- **Query scope**: Collection

#### Index 2: User Activities by User Name
- **Collection ID**: `activities`
- **Fields to index**:
  - Field path: `userName` → Order: `Ascending`
  - Field path: `timestamp` → Order: `Descending`
- **Query scope**: Collection

#### Index 3: User Activities by User ID
- **Collection ID**: `activities`
- **Fields to index**:
  - Field path: `userId` → Order: `Ascending`
  - Field path: `timestamp` → Order: `Descending`
- **Query scope**: Collection

#### Index 4: User One-Time Tasks
- **Collection ID**: `activities`
- **Fields to index**:
  - Field path: `userSanitizedName` → Order: `Ascending`
  - Field path: `activityId` → Order: `Ascending`
- **Query scope**: Collection

#### Index 5: Users Leaderboard
- **Collection ID**: `users`
- **Fields to index**:
  - Field path: `totalScore` → Order: `Descending`
- **Query scope**: Collection

#### Index 6: Users by Name
- **Collection ID**: `users`
- **Fields to index**:
  - Field path: `name` → Order: `Ascending`
- **Query scope**: Collection

## Option 3: Direct Links (Easiest)

Click these direct links to create each index:

1. [Create userSanitizedName + timestamp index](https://console.firebase.google.com/project/iron-turtle-tracker/firestore/indexes?create_composite=ClBwcm9qZWN0cy9pcm9uLXR1cnRsZS10cmFja2VyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hY3Rpdml0aWVzL2luZGV4ZXMvXxABGhIKDnVzZXJTYW5pdGl6ZWROYW1lEAEaDAoIdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAg)

2. [Create userName + timestamp index](https://console.firebase.google.com/project/iron-turtle-tracker/firestore/indexes?create_composite=ClBwcm9qZWN0cy9pcm9uLXR1cnRsZS10cmFja2VyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hY3Rpdml0aWVzL2luZGV4ZXMvXxABGgwKCHVzZXJOYW1lEAEaDAoIdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAg)

3. [Create userId + timestamp index](https://console.firebase.google.com/project/iron-turtle-tracker/firestore/indexes?create_composite=ClBwcm9qZWN0cy9pcm9uLXR1cnRsZS10cmFja2VyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hY3Rpdml0aWVzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGgwKCHRpbWVzdGFtcBAQGgwKCF9fbmFtZV9fEAI)

## Checking Index Status

After creating indexes:
1. Go to **Firestore** → **Indexes** in Firebase Console
2. Look for the status of each index:
   - **Building**: Index is being created (2-10 minutes)
   - **Enabled**: Index is ready to use
   - **Error**: There was a problem creating the index

## Clear Database First

Before testing, clear all existing data:
1. Open `/admin/clear-all-data.html` in your browser
2. Click "Clear Everything (Firestore + LocalStorage)"
3. Confirm the action

## Verify Everything Works

After indexes are built and database is cleared:
1. Open the main app
2. Register a new user
3. Log some activities
4. Check that the leaderboard updates
5. Click on a user in the leaderboard to see their stats
6. Verify no console errors about missing indexes

## Troubleshooting

If you still see index errors:
- Make sure you're in the correct Firebase project
- Check that all 6 indexes show "Enabled" status
- Clear browser cache and localStorage
- Try using an incognito/private browser window