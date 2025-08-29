const { initializeApp } = require('firebase/app');
const { 
    getStorage, 
    ref, 
    uploadString, 
    getDownloadURL, 
    listAll,
    deleteObject,
    uploadBytes
} = require('firebase/storage');
const fs = require('fs');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBDSZ8kMF-CBslIt3YqdkigvEvjB1q7HRA",
    authDomain: "turtle-v2.firebaseapp.com",
    projectId: "turtle-v2",
    storageBucket: "turtle-v2.firebasestorage.app",
    messagingSenderId: "1000731234066",
    appId: "1:1000731234066:web:c6b1c93303e35e38f29ce8"
};

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Test functions
async function testStorageConnection() {
    console.log('\n📋 Test 1: Storage Connection');
    console.log('================================');
    try {
        const testRef = ref(storage, 'test/connection-test.txt');
        const testData = `Storage test at ${new Date().toISOString()}`;
        
        console.log('📤 Uploading test file...');
        await uploadString(testRef, testData);
        
        console.log('🔗 Getting download URL...');
        const url = await getDownloadURL(testRef);
        
        console.log('✅ SUCCESS: Storage is properly configured!');
        console.log(`📍 Storage bucket: ${firebaseConfig.storageBucket}`);
        console.log(`🔗 Test file URL: ${url.substring(0, 80)}...`);
        
        // Clean up
        console.log('🧹 Cleaning up test file...');
        await deleteObject(testRef);
        
        return true;
    } catch (error) {
        console.error('❌ FAILED: Storage connection test');
        console.error('Error:', error.message);
        console.error('\n🔍 Possible issues:');
        console.error('1. Check Firebase Console > Storage > Rules');
        console.error('2. Ensure Storage is enabled in Firebase Console');
        console.error('3. Verify the storage bucket URL is correct');
        return false;
    }
}

async function testFileUpload() {
    console.log('\n📋 Test 2: File Upload');
    console.log('================================');
    try {
        // Create a test file
        const testContent = 'This is a test file for Firebase Storage';
        const testFileName = `test-${Date.now()}.txt`;
        fs.writeFileSync(testFileName, testContent);
        
        console.log(`📝 Created local test file: ${testFileName}`);
        
        // Upload the file
        const fileRef = ref(storage, `test-uploads/${testFileName}`);
        const fileBuffer = fs.readFileSync(testFileName);
        
        console.log('📤 Uploading file to Storage...');
        const snapshot = await uploadBytes(fileRef, fileBuffer);
        
        console.log('✅ SUCCESS: File uploaded!');
        console.log(`📍 Path: ${snapshot.ref.fullPath}`);
        console.log(`📊 Size: ${snapshot.metadata.size} bytes`);
        
        // Clean up local file
        fs.unlinkSync(testFileName);
        console.log('🧹 Cleaned up local test file');
        
        return snapshot.ref.fullPath;
    } catch (error) {
        console.error('❌ FAILED: File upload test');
        console.error('Error:', error.message);
        return null;
    }
}

async function testListFiles() {
    console.log('\n📋 Test 3: List Files');
    console.log('================================');
    try {
        const listRef = ref(storage, 'test-uploads');
        
        console.log('📂 Listing files in test-uploads/...');
        const result = await listAll(listRef);
        
        if (result.items.length === 0) {
            console.log('📭 No files found in test-uploads/');
        } else {
            console.log(`✅ SUCCESS: Found ${result.items.length} file(s):`);
            result.items.forEach((itemRef, index) => {
                console.log(`  ${index + 1}. ${itemRef.name}`);
            });
        }
        
        return result.items;
    } catch (error) {
        console.error('❌ FAILED: List files test');
        console.error('Error:', error.message);
        return [];
    }
}

async function testFileDownload(filePath) {
    console.log('\n📋 Test 4: File Download');
    console.log('================================');
    
    if (!filePath) {
        console.log('⚠️  Skipping: No file to download');
        return false;
    }
    
    try {
        const fileRef = ref(storage, filePath);
        
        console.log(`📥 Getting download URL for: ${filePath}`);
        const url = await getDownloadURL(fileRef);
        
        console.log('✅ SUCCESS: Download URL obtained!');
        console.log(`🔗 URL: ${url.substring(0, 80)}...`);
        
        // Test if URL is accessible
        console.log('🔍 Verifying URL is accessible...');
        const https = require('https');
        
        return new Promise((resolve) => {
            https.get(url, (res) => {
                if (res.statusCode === 200) {
                    console.log('✅ URL is accessible (HTTP 200)');
                    resolve(true);
                } else {
                    console.log(`⚠️  URL returned status: ${res.statusCode}`);
                    resolve(false);
                }
            }).on('error', (err) => {
                console.error('❌ Failed to access URL:', err.message);
                resolve(false);
            });
        });
    } catch (error) {
        console.error('❌ FAILED: File download test');
        console.error('Error:', error.message);
        return false;
    }
}

async function cleanupTestFiles() {
    console.log('\n📋 Test 5: Cleanup');
    console.log('================================');
    try {
        const listRef = ref(storage, 'test-uploads');
        const result = await listAll(listRef);
        
        if (result.items.length === 0) {
            console.log('📭 No files to clean up');
            return true;
        }
        
        console.log(`🧹 Cleaning up ${result.items.length} test file(s)...`);
        
        for (const itemRef of result.items) {
            await deleteObject(itemRef);
            console.log(`  ✅ Deleted: ${itemRef.name}`);
        }
        
        console.log('✅ SUCCESS: All test files cleaned up!');
        return true;
    } catch (error) {
        console.error('❌ FAILED: Cleanup test');
        console.error('Error:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Firebase Storage Tests');
    console.log('===================================');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🔧 Project: ${firebaseConfig.projectId}`);
    console.log(`📦 Storage Bucket: ${firebaseConfig.storageBucket}`);
    
    const results = {
        connection: false,
        upload: false,
        list: false,
        download: false,
        cleanup: false
    };
    
    // Test 1: Connection
    results.connection = await testStorageConnection();
    
    if (!results.connection) {
        console.log('\n⛔ Stopping tests due to connection failure');
        console.log('\n📊 Test Summary:');
        console.log('================');
        console.log('Connection: ❌ FAILED');
        console.log('\n💡 Next Steps:');
        console.log('1. Go to Firebase Console: https://console.firebase.google.com');
        console.log('2. Select your project: turtle-v2');
        console.log('3. Navigate to Storage section');
        console.log('4. Check if Storage is enabled');
        console.log('5. Review Storage Rules (set to allow read/write for testing)');
        process.exit(1);
    }
    
    // Test 2: Upload
    const uploadedFile = await testFileUpload();
    results.upload = !!uploadedFile;
    
    // Test 3: List
    const files = await testListFiles();
    results.list = true;
    
    // Test 4: Download
    if (uploadedFile) {
        results.download = await testFileDownload(uploadedFile);
    }
    
    // Test 5: Cleanup
    results.cleanup = await cleanupTestFiles();
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`Connection: ${results.connection ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Upload:     ${results.upload ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`List:       ${results.list ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Download:   ${results.download ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Cleanup:    ${results.cleanup ? '✅ PASSED' : '❌ FAILED'}`);
    
    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
        console.log('\n🎉 All tests passed! Firebase Storage is properly configured.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
    
    process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});