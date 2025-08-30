#!/usr/bin/env node

// Simple Firebase connection test
const https = require('https');

const API_KEY = 'AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8';
const PROJECT_ID = 'iron-turtle-tracker';

console.log('🔥 Firebase Connection Test');
console.log('============================\n');

// Test 1: Check if Firestore API is accessible
function testFirestoreAPI() {
  return new Promise((resolve, reject) => {
    console.log('📡 Testing Firestore API access...');
    
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents?key=${API_KEY}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
            console.log('✅ Firestore API is accessible');
            console.log(`   Status: ${res.statusCode}`);
            if (response.documents) {
              console.log(`   Documents found: ${response.documents.length}`);
            }
            resolve(true);
          } else if (res.statusCode === 404) {
            console.log('⚠️  Firestore database not initialized');
            console.log('   The database needs to be created in Firebase Console');
            console.log('   Visit: https://console.cloud.google.com/datastore/setup?project=' + PROJECT_ID);
            resolve(false);
          } else if (res.statusCode === 403) {
            console.log('❌ Permission denied - Firestore API may not be enabled');
            console.log('   Enable at: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=' + PROJECT_ID);
            resolve(false);
          } else {
            console.log(`❌ Unexpected status: ${res.statusCode}`);
            if (response.error) {
              console.log(`   Error: ${response.error.message}`);
            }
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Failed to parse response');
          console.log(`   Raw response: ${data.substring(0, 200)}...`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Connection failed');
      console.log(`   Error: ${error.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

// Test 2: Try to create a test document
function testCreateDocument() {
  return new Promise((resolve, reject) => {
    console.log('\n📝 Testing document creation...');
    
    const testDoc = {
      fields: {
        test: { stringValue: 'Hello Firebase' },
        timestamp: { timestampValue: new Date().toISOString() }
      }
    };
    
    const postData = JSON.stringify(testDoc);
    
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/test?documentId=connection_test&key=${API_KEY}`,
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
            console.log('✅ Successfully created test document');
            console.log(`   Document path: ${response.name}`);
            
            // Try to delete the test document
            deleteTestDocument('connection_test');
            resolve(true);
          } else {
            console.log(`⚠️  Could not create document (Status: ${res.statusCode})`);
            if (response.error) {
              console.log(`   Reason: ${response.error.message}`);
            }
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Failed to create document');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request failed');
      console.log(`   Error: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Delete test document
function deleteTestDocument(docId) {
  const options = {
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/test/${docId}?key=${API_KEY}`,
    method: 'DELETE'
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('   🧹 Test document cleaned up');
    }
  });
  
  req.on('error', () => {});
  req.end();
}

// Test 3: Check Firebase Auth
function testFirebaseAuth() {
  return new Promise((resolve, reject) => {
    console.log('\n🔐 Testing Firebase Auth...');
    
    const authData = {
      returnSecureToken: true
    };
    
    const postData = JSON.stringify(authData);
    
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${API_KEY}`,
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
            console.log('✅ Firebase Auth is working');
            console.log('   Anonymous auth available');
            resolve(true);
          } else if (res.statusCode === 400 && response.error) {
            if (response.error.message.includes('ADMIN_ONLY_OPERATION')) {
              console.log('⚠️  Anonymous auth may be disabled');
              console.log('   Enable in Firebase Console > Authentication > Sign-in methods');
            } else {
              console.log('⚠️  Auth configuration issue');
              console.log(`   ${response.error.message}`);
            }
            resolve(false);
          } else {
            console.log(`❌ Auth test failed (Status: ${res.statusCode})`);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Failed to test auth');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Auth request failed');
      console.log(`   Error: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}\n`);
  
  const firestoreOK = await testFirestoreAPI();
  
  if (firestoreOK) {
    await testCreateDocument();
  }
  
  await testFirebaseAuth();
  
  console.log('\n============================');
  console.log('📊 Test Summary');
  console.log('============================');
  
  if (!firestoreOK) {
    console.log('\n🔧 Next Steps:');
    console.log('1. Visit Firebase Console: https://console.firebase.google.com/project/' + PROJECT_ID);
    console.log('2. Enable Firestore Database (Build > Firestore Database)');
    console.log('3. Choose "Start in test mode" for initial setup');
    console.log('4. Select a location (us-central1 recommended)');
    console.log('5. Run this test again\n');
  } else {
    console.log('\n✅ Firebase is properly configured and ready to use!\n');
  }
}

// Run tests
runTests();