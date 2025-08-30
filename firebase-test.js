#!/usr/bin/env node

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: You'll need to download a service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = {
  "type": "service_account",
  "project_id": "iron-turtle-tracker",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "YOUR_PRIVATE_KEY",
  "client_email": "YOUR_CLIENT_EMAIL",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "YOUR_CERT_URL"
};

// Initialize with your project
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://iron-turtle-tracker-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

// Test functions
async function testConnection() {
  console.log('🔍 Testing Firebase connection...');
  try {
    const testDoc = await db.collection('test').add({
      message: 'Connection test',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Connected to Firebase successfully');
    console.log('   Test document ID:', testDoc.id);
    
    // Clean up test document
    await testDoc.delete();
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function addUser(name, score = 0) {
  console.log(`\n📝 Adding user: ${name}`);
  try {
    const userRef = await db.collection('users').add({
      name: name,
      totalScore: score,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      activities: []
    });
    console.log(`✅ User added with ID: ${userRef.id}`);
    return userRef.id;
  } catch (error) {
    console.error('❌ Failed to add user:', error.message);
    return null;
  }
}

async function getUsers() {
  console.log('\n👥 Fetching all users...');
  try {
    const snapshot = await db.collection('users').get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.name}: ${user.totalScore} points`);
    });
    return users;
  } catch (error) {
    console.error('❌ Failed to fetch users:', error.message);
    return [];
  }
}

async function addActivity(userId, activity) {
  console.log(`\n🏃 Adding activity for user ${userId}`);
  try {
    const activityRef = await db.collection('activities').add({
      userId: userId,
      type: activity.type,
      duration: activity.duration,
      points: activity.points,
      date: activity.date || new Date().toISOString(),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update user's total score
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      totalScore: admin.firestore.FieldValue.increment(activity.points)
    });
    
    console.log(`✅ Activity added with ID: ${activityRef.id}`);
    console.log(`   Type: ${activity.type}, Duration: ${activity.duration}min, Points: ${activity.points}`);
    return activityRef.id;
  } catch (error) {
    console.error('❌ Failed to add activity:', error.message);
    return null;
  }
}

async function getUserActivities(userId) {
  console.log(`\n📊 Fetching activities for user ${userId}`);
  try {
    const snapshot = await db.collection('activities')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .get();
    
    const activities = [];
    snapshot.forEach(doc => {
      activities.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Found ${activities.length} activities:`);
    activities.forEach(activity => {
      console.log(`   - ${activity.type}: ${activity.duration}min, ${activity.points} points`);
    });
    return activities;
  } catch (error) {
    console.error('❌ Failed to fetch activities:', error.message);
    return [];
  }
}

async function getLeaderboard(limit = 10) {
  console.log(`\n🏆 Fetching top ${limit} users...`);
  try {
    const snapshot = await db.collection('users')
      .orderBy('totalScore', 'desc')
      .limit(limit)
      .get();
    
    const leaderboard = [];
    snapshot.forEach(doc => {
      leaderboard.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('✅ Leaderboard:');
    leaderboard.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name}: ${user.totalScore} points`);
    });
    return leaderboard;
  } catch (error) {
    console.error('❌ Failed to fetch leaderboard:', error.message);
    return [];
  }
}

async function updateUserScore(userId, newScore) {
  console.log(`\n🔄 Updating score for user ${userId} to ${newScore}`);
  try {
    await db.collection('users').doc(userId).update({
      totalScore: newScore,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Score updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to update score:', error.message);
    return false;
  }
}

async function deleteUser(userId) {
  console.log(`\n🗑️ Deleting user ${userId}`);
  try {
    // Delete user's activities first
    const activities = await db.collection('activities')
      .where('userId', '==', userId)
      .get();
    
    const batch = db.batch();
    activities.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Delete user document
    await db.collection('users').doc(userId).delete();
    console.log('✅ User and activities deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete user:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Firebase Test Suite\n');
  console.log('=' .repeat(50));
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n⚠️  Cannot proceed without connection. Please check your credentials.');
    process.exit(1);
  }
  
  // Create test users
  console.log('\n' + '=' .repeat(50));
  console.log('📝 Creating test users...');
  
  const userId1 = await addUser('Alice Test', 100);
  const userId2 = await addUser('Bob Test', 150);
  const userId3 = await addUser('Charlie Test', 75);
  
  // Add activities
  if (userId1) {
    console.log('\n' + '=' .repeat(50));
    console.log('🏃 Adding activities...');
    
    await addActivity(userId1, {
      type: 'Stretching',
      duration: 30,
      points: 15
    });
    
    await addActivity(userId1, {
      type: 'Core work',
      duration: 45,
      points: 25
    });
    
    await addActivity(userId2, {
      type: 'Cardio',
      duration: 60,
      points: 40
    });
  }
  
  // Read operations
  console.log('\n' + '=' .repeat(50));
  console.log('📖 Reading data...');
  
  await getUsers();
  
  if (userId1) {
    await getUserActivities(userId1);
  }
  
  await getLeaderboard(5);
  
  // Update operation
  if (userId3) {
    console.log('\n' + '=' .repeat(50));
    await updateUserScore(userId3, 200);
  }
  
  // Show updated leaderboard
  console.log('\n' + '=' .repeat(50));
  console.log('🔄 Updated leaderboard:');
  await getLeaderboard(5);
  
  // Cleanup (optional)
  const cleanup = process.argv.includes('--cleanup');
  if (cleanup) {
    console.log('\n' + '=' .repeat(50));
    console.log('🧹 Cleaning up test data...');
    
    const users = await db.collection('users')
      .where('name', 'in', ['Alice Test', 'Bob Test', 'Charlie Test'])
      .get();
    
    for (const doc of users.docs) {
      await deleteUser(doc.id);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All tests completed!');
  
  // Exit
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
Firebase Test Script
Usage: node firebase-test.js [options]

Options:
  --help      Show this help message
  --cleanup   Delete test data after running tests
  
Individual operations:
  --add-user <name> <score>   Add a new user
  --get-users                 List all users
  --get-leaderboard          Show leaderboard
  --add-activity <userId> <type> <duration> <points>
  
Examples:
  node firebase-test.js                    # Run full test suite
  node firebase-test.js --cleanup          # Run tests and clean up
  node firebase-test.js --add-user "John" 50
  node firebase-test.js --get-users
  `);
  process.exit(0);
}

// Handle individual operations
if (args.includes('--add-user')) {
  const index = args.indexOf('--add-user');
  const name = args[index + 1];
  const score = parseInt(args[index + 2]) || 0;
  addUser(name, score).then(() => process.exit(0));
} else if (args.includes('--get-users')) {
  getUsers().then(() => process.exit(0));
} else if (args.includes('--get-leaderboard')) {
  getLeaderboard().then(() => process.exit(0));
} else if (args.includes('--add-activity')) {
  const index = args.indexOf('--add-activity');
  const userId = args[index + 1];
  const type = args[index + 2];
  const duration = parseInt(args[index + 3]);
  const points = parseInt(args[index + 4]);
  addActivity(userId, { type, duration, points }).then(() => process.exit(0));
} else {
  // Run full test suite
  runTests();
}