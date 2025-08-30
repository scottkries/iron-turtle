/**
 * Immediate fix for Charlie's score synchronization issue
 * This script updates Charlie's stored totalScore to match his calculated activities
 * 
 * Usage: Run this in browser console on the main app page with Firebase loaded
 */

async function fixCharlieScore() {
    console.log('🔧 Starting Charlie score fix...');
    
    if (!window.firebaseService) {
        console.error('❌ Firebase service not available');
        return;
    }
    
    try {
        // Charlie's sanitized name - likely "charlie" 
        const charlieName = 'charlie';
        
        console.log(`📊 Fixing score for user: ${charlieName}`);
        
        // Use the enhanced updateUserScore function that was implemented
        await window.firebaseService.updateUserScore(charlieName);
        
        console.log('✅ Charlie\'s score has been fixed!');
        console.log('🔄 Refreshing page to show updated leaderboard...');
        
        // Refresh the current page to show updated scores
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error fixing Charlie\'s score:', error);
        
        // Fallback: Manual calculation and update
        console.log('🔄 Attempting manual fix...');
        await manualFixCharlieScore();
    }
}

async function manualFixCharlieScore() {
    try {
        const charlieName = 'charlie';
        const db = window.firebaseService.db;
        
        // Get Charlie's activities
        const activitiesSnapshot = await db.collection('activities')
            .where('userSanitizedName', '==', charlieName)
            .get();
        
        // Calculate total score from activities
        let calculatedScore = 0;
        const activities = [];
        
        activitiesSnapshot.forEach(doc => {
            const activity = doc.data();
            const points = window.DataUtils ? 
                window.DataUtils.validateNumber(activity.points, 0) : 
                (activity.points || 0);
            calculatedScore += points;
            activities.push({
                id: doc.id,
                name: activity.activityName,
                points: points,
                date: activity.timestamp
            });
        });
        
        console.log(`📈 Charlie has ${activities.length} activities totaling ${calculatedScore} points`);
        
        // Update Charlie's stored score
        await db.collection('users').doc(charlieName).update({
            totalScore: calculatedScore,
            lastScoreRecalculation: firebase.firestore.FieldValue.serverTimestamp(),
            scoreRecalculationReason: 'manual-charlie-fix'
        });
        
        console.log(`✅ Updated Charlie's stored score to ${calculatedScore} points`);
        console.log('📋 Activity breakdown:');
        activities.forEach(activity => {
            console.log(`  • ${activity.name}: ${activity.points} pts`);
        });
        
        return calculatedScore;
        
    } catch (error) {
        console.error('❌ Manual fix failed:', error);
        throw error;
    }
}

// Export for use
window.fixCharlieScore = fixCharlieScore;

console.log('🚀 Charlie fix script loaded. Run: fixCharlieScore()');