#!/usr/bin/env node

/**
 * Script to clear all data from Firebase Firestore database
 * This will delete all users, activities, and test data
 */

const https = require('https');

const API_KEY = 'AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8';
const PROJECT_ID = 'iron-turtle-tracker';

console.log('🗑️  Firebase Database Clear Script');
console.log('==================================\n');
console.log('⚠️  WARNING: This will delete ALL data from the database!');
console.log('Collections to be cleared:');
console.log('  - users');
console.log('  - activities');
console.log('  - test_activities\n');

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} });
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

async function deleteCollection(collectionName) {
    console.log(`\n📂 Clearing ${collectionName} collection...`);
    
    try {
        // First, get all documents in the collection
        const listResult = await makeRequest({
            hostname: 'firestore.googleapis.com',
            path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?key=${API_KEY}`,
            method: 'GET'
        });
        
        if (listResult.status !== 200 || !listResult.data.documents) {
            console.log(`   No documents found in ${collectionName}`);
            return { deleted: 0, failed: 0 };
        }
        
        const documents = listResult.data.documents;
        console.log(`   Found ${documents.length} documents to delete`);
        
        let deleted = 0;
        let failed = 0;
        
        // Delete each document
        for (const doc of documents) {
            const docPath = doc.name.split('/documents/')[1];
            
            const deleteResult = await makeRequest({
                hostname: 'firestore.googleapis.com',
                path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?key=${API_KEY}`,
                method: 'DELETE'
            });
            
            if (deleteResult.status === 200 || deleteResult.status === 204) {
                deleted++;
                process.stdout.write(`   Deleted ${deleted}/${documents.length}\r`);
            } else {
                failed++;
                console.log(`\n   ❌ Failed to delete document: ${docPath}`);
            }
        }
        
        console.log(`\n   ✅ Deleted ${deleted} documents, ${failed} failed`);
        return { deleted, failed };
        
    } catch (error) {
        console.error(`   ❌ Error clearing ${collectionName}:`, error.message);
        return { deleted: 0, failed: 0 };
    }
}

async function clearDatabase() {
    const collections = ['users', 'activities', 'test_activities'];
    let totalDeleted = 0;
    let totalFailed = 0;
    
    console.log('\nStarting database cleanup...');
    
    for (const collection of collections) {
        const result = await deleteCollection(collection);
        totalDeleted += result.deleted;
        totalFailed += result.failed;
    }
    
    console.log('\n==================================');
    console.log('📊 CLEANUP SUMMARY');
    console.log('==================================');
    console.log(`✅ Total documents deleted: ${totalDeleted}`);
    if (totalFailed > 0) {
        console.log(`❌ Total failed deletions: ${totalFailed}`);
    }
    console.log('\n🎯 Database cleared successfully!');
    console.log('\nYou can now start fresh with the Iron Turtle Challenge Tracker.');
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\n⚠️  Are you sure you want to delete all data? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        clearDatabase().then(() => {
            rl.close();
        });
    } else {
        console.log('\n❌ Database clear cancelled.');
        rl.close();
    }
});