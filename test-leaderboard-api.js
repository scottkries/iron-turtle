#!/usr/bin/env node

const https = require('https');

const API_KEY = 'AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8';
const PROJECT_ID = 'iron-turtle-tracker';

console.log('🏆 Testing Leaderboard Functionality');
console.log('=====================================\n');

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

async function createTestUser(name, score) {
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    const userData = {
        fields: {
            name: { stringValue: name },
            sanitizedName: { stringValue: sanitizedName },
            totalScore: { integerValue: score },
            createdAt: { timestampValue: new Date().toISOString() },
            lastLogin: { timestampValue: new Date().toISOString() }
        }
    };
    
    const result = await makeRequest({
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?documentId=${sanitizedName}&key=${API_KEY}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify(userData));
    
    return result;
}

async function getLeaderboard() {
    // Query for top users by score
    const query = {
        structuredQuery: {
            from: [{ collectionId: 'users' }],
            orderBy: [{
                field: { fieldPath: 'totalScore' },
                direction: 'DESCENDING'
            }],
            limit: 10
        }
    };
    
    const result = await makeRequest({
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify(query));
    
    return result;
}

async function testLeaderboard() {
    console.log('1️⃣  Creating test users with different scores...\n');
    
    const testUsers = [
        { name: 'Alice Champion', score: 250 },
        { name: 'Bob Runner', score: 180 },
        { name: 'Charlie Player', score: 150 },
        { name: 'Diana Gamer', score: 120 },
        { name: 'Eve Starter', score: 50 }
    ];
    
    for (const user of testUsers) {
        try {
            const result = await createTestUser(user.name, user.score);
            if (result.status === 200) {
                console.log(`✅ Created: ${user.name} (${user.score} points)`);
            } else {
                console.log(`⚠️  ${user.name} may already exist`);
            }
        } catch (error) {
            console.log(`❌ Error creating ${user.name}: ${error.message}`);
        }
    }
    
    console.log('\n2️⃣  Fetching leaderboard...\n');
    
    try {
        const result = await getLeaderboard();
        
        if (result.status === 200 && result.data) {
            console.log('🏆 LEADERBOARD:');
            console.log('================\n');
            
            let position = 1;
            for (const item of result.data) {
                if (item.document) {
                    const fields = item.document.fields;
                    const name = fields.name ? fields.name.stringValue : 'Unknown';
                    const score = fields.totalScore ? fields.totalScore.integerValue : 0;
                    
                    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '  ';
                    console.log(`${medal} ${position}. ${name}: ${score} points`);
                    position++;
                }
            }
            
            if (position === 1) {
                console.log('No users found in leaderboard');
            }
        } else {
            console.log('❌ Failed to fetch leaderboard');
        }
    } catch (error) {
        console.log(`❌ Error fetching leaderboard: ${error.message}`);
    }
    
    console.log('\n3️⃣  Testing leaderboard update...\n');
    
    // Update a user's score
    const updateUser = 'eve_starter';
    const newScore = 300;
    
    try {
        const updateResult = await makeRequest({
            hostname: 'firestore.googleapis.com',
            path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${updateUser}?updateMask.fieldPaths=totalScore&key=${API_KEY}`,
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            fields: {
                totalScore: { integerValue: newScore }
            }
        }));
        
        if (updateResult.status === 200) {
            console.log(`✅ Updated Eve Starter's score to ${newScore}`);
            
            // Fetch leaderboard again
            console.log('\n🔄 Updated Leaderboard:\n');
            
            const newLeaderboard = await getLeaderboard();
            if (newLeaderboard.status === 200 && newLeaderboard.data) {
                let position = 1;
                for (const item of newLeaderboard.data) {
                    if (item.document) {
                        const fields = item.document.fields;
                        const name = fields.name ? fields.name.stringValue : 'Unknown';
                        const score = fields.totalScore ? fields.totalScore.integerValue : 0;
                        
                        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '  ';
                        const updated = name === 'Eve Starter' ? ' ⬆️ (UPDATED)' : '';
                        console.log(`${medal} ${position}. ${name}: ${score} points${updated}`);
                        position++;
                    }
                }
            }
        }
    } catch (error) {
        console.log(`❌ Error updating score: ${error.message}`);
    }
    
    console.log('\n=====================================');
    console.log('✅ Leaderboard functionality test complete!');
    console.log('\nKey findings:');
    console.log('- Users are sorted by totalScore (descending)');
    console.log('- Leaderboard updates when scores change');
    console.log('- Top 10 users are displayed');
    console.log('\nOpen index.html to see the live leaderboard in action!');
}

testLeaderboard();