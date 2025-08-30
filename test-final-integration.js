#!/usr/bin/env node

const https = require('https');

const API_KEY = 'AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8';
const PROJECT_ID = 'iron-turtle-tracker';

console.log('🚀 Final Firebase Integration Test');
console.log('=====================================\n');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testFirebaseIntegration() {
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Anonymous Auth
  console.log('1️⃣  Testing Anonymous Authentication...');
  try {
    const authResult = await makeRequest({
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ returnSecureToken: true }));
    
    if (authResult.status === 200) {
      console.log('✅ Anonymous auth is working');
      testsPassed++;
    } else {
      console.log('❌ Anonymous auth failed');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Auth test error:', error.message);
    testsFailed++;
  }
  
  // Test 2: Firestore Access
  console.log('\n2️⃣  Testing Firestore Database...');
  try {
    const firestoreResult = await makeRequest({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?key=${API_KEY}`,
      method: 'GET'
    });
    
    if (firestoreResult.status === 200) {
      console.log('✅ Firestore is accessible');
      testsPassed++;
    } else {
      console.log('❌ Firestore access failed');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Firestore test error:', error.message);
    testsFailed++;
  }
  
  // Test 3: Create Test Activity
  console.log('\n3️⃣  Testing Activity Creation...');
  const testActivity = {
    fields: {
      userId: { stringValue: 'test_user_final' },
      userName: { stringValue: 'Final Test User' },
      activityName: { stringValue: 'Integration Test Activity' },
      points: { integerValue: 100 },
      timestamp: { timestampValue: new Date().toISOString() }
    }
  };
  
  try {
    const createResult = await makeRequest({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/test_activities?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify(testActivity));
    
    if (createResult.status === 200) {
      console.log('✅ Activity creation successful');
      testsPassed++;
    } else {
      console.log('❌ Activity creation failed');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Activity creation error:', error.message);
    testsFailed++;
  }
  
  // Summary
  console.log('\n=====================================');
  console.log('📊 TEST SUMMARY');
  console.log('=====================================');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Firebase integration is working correctly.');
    console.log('\n📋 Next Steps:');
    console.log('1. Apply security rules: firebase deploy --only firestore:rules');
    console.log('2. Test with multiple users in browser');
    console.log('3. Monitor Firebase Console for real-time activity');
  } else {
    console.log('\n⚠️  Some tests failed. Please check:');
    console.log('1. Firebase project configuration');
    console.log('2. API keys and permissions');
    console.log('3. Firestore and Auth are enabled');
  }
}

testFirebaseIntegration();
