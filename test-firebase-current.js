#!/usr/bin/env node

// Firebase connection test for iron-turtle-tracker
const https = require('https');

const firebaseConfig = {
  apiKey: "AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8",
  authDomain: "iron-turtle-tracker.firebaseapp.com",
  projectId: "iron-turtle-tracker",
  storageBucket: "iron-turtle-tracker.firebasestorage.app",
  messagingSenderId: "923369775122",
  appId: "1:923369775122:web:71cd2023c2b92148f7f8cb"
};

console.log('🔥 Testing Firebase Project: iron-turtle-tracker');
console.log('================================================\n');

// Test 1: Check Firebase Project Exists (using Auth API)
function testProjectExists() {
  return new Promise((resolve) => {
    console.log('1️⃣  Testing if Firebase project exists...');
    
    const postData = JSON.stringify({
      returnSecureToken: true
    });
    
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Firebase project exists and Auth is working!');
            console.log('   Anonymous authentication is enabled');
            resolve(true);
          } else if (response.error) {
            if (response.error.message === 'ADMIN_ONLY_OPERATION') {
              console.log('⚠️  Project exists but Anonymous Auth is disabled');
              console.log('   Fix: Go to Firebase Console > Authentication > Sign-in method > Enable Anonymous');
            } else if (response.error.message === 'CONFIGURATION_NOT_FOUND') {
              console.log('❌ Project not found or API key is incorrect');
            } else {
              console.log(`⚠️  Project exists but has issues: ${response.error.message}`);
            }
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Could not verify project');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Connection failed: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test 2: Check Firestore Database
function testFirestore() {
  return new Promise((resolve) => {
    console.log('\n2️⃣  Testing Firestore Database...');
    
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/test?key=${firebaseConfig.apiKey}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Firestore is enabled and accessible!');
          resolve(true);
        } else if (res.statusCode === 404) {
          try {
            const response = JSON.parse(data);
            if (response.error && response.error.message.includes('does not exist')) {
              console.log('❌ Firestore Database is NOT enabled');
              console.log('   Fix: Go to Firebase Console > Firestore Database > Create Database');
              console.log('   1. Click "Create database"');
              console.log('   2. Choose "Start in test mode"');
              console.log('   3. Select location (us-central1)');
            }
          } catch (e) {
            console.log('❌ Firestore is not set up');
          }
          resolve(false);
        } else if (res.statusCode === 403) {
          console.log('⚠️  Firestore exists but has permission issues');
          console.log('   Fix: Check Firestore Security Rules in Firebase Console');
          resolve(false);
        } else {
          console.log(`⚠️  Unexpected response: ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Connection failed: ${error.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

// Test 3: Try to write to Firestore
function testFirestoreWrite() {
  return new Promise((resolve) => {
    console.log('\n3️⃣  Testing Firestore write access...');
    
    const testDoc = {
      fields: {
        test: { stringValue: 'Testing from Node.js' },
        timestamp: { timestampValue: new Date().toISOString() }
      }
    };
    
    const postData = JSON.stringify(testDoc);
    const docId = `test_${Date.now()}`;
    
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/test?documentId=${docId}&key=${firebaseConfig.apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Successfully wrote to Firestore!');
          console.log('   Your Firestore database is fully functional');
          
          // Clean up test document
          deleteTestDoc(docId);
          resolve(true);
        } else {
          try {
            const response = JSON.parse(data);
            if (response.error) {
              console.log(`❌ Cannot write to Firestore: ${response.error.message}`);
            }
          } catch (e) {
            console.log('❌ Write test failed');
          }
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Connection failed: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Clean up test document
function deleteTestDoc(docId) {
  const options = {
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/test/${docId}?key=${firebaseConfig.apiKey}`,
    method: 'DELETE'
  };

  const req = https.request(options, () => {});
  req.on('error', () => {});
  req.end();
}

// Main test runner
async function runTests() {
  console.log('Configuration:');
  console.log(`  Project ID: ${firebaseConfig.projectId}`);
  console.log(`  Auth Domain: ${firebaseConfig.authDomain}`);
  console.log(`  API Key: ${firebaseConfig.apiKey.substring(0, 10)}...`);
  console.log('');
  
  const projectOK = await testProjectExists();
  const firestoreOK = await testFirestore();
  
  if (firestoreOK) {
    await testFirestoreWrite();
  }
  
  console.log('\n================================================');
  console.log('📊 SUMMARY');
  console.log('================================================\n');
  
  if (projectOK && firestoreOK) {
    console.log('✅ Your Firebase project is fully configured and ready!');
    console.log('\nYou can now:');
    console.log('  • Open index.html in a browser to use the app');
    console.log('  • Run ./test-firebase-api.sh to test API operations');
    console.log('  • Open test-firebase.html to test with a UI');
  } else {
    console.log('⚠️  Your Firebase project needs configuration:\n');
    
    if (!projectOK) {
      console.log('1. Enable Anonymous Authentication:');
      console.log('   • Go to: https://console.firebase.google.com/project/iron-turtle-tracker/authentication/providers');
      console.log('   • Click "Anonymous" and toggle it ON\n');
    }
    
    if (!firestoreOK) {
      console.log('2. Enable Firestore Database:');
      console.log('   • Go to: https://console.firebase.google.com/project/iron-turtle-tracker/firestore');
      console.log('   • Click "Create database"');
      console.log('   • Choose "Start in test mode"');
      console.log('   • Select "us-central1" as location');
      console.log('   • Click "Enable"\n');
    }
    
    console.log('After making these changes, run this test again.');
  }
  
  console.log('\n🔗 Direct links to Firebase Console:');
  console.log(`   Project Overview: https://console.firebase.google.com/project/${firebaseConfig.projectId}`);
  console.log(`   Firestore: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`);
  console.log(`   Authentication: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication`);
}

// Run the tests
runTests();