/**
 * Dynamic Scoring Service - Iron Turtle Challenge
 * 
 * This service eliminates the need for cached totalScore fields by calculating
 * scores dynamically from activities in real-time. This prevents sync issues
 * like Charlie's case where stored scores become out of sync with activities.
 */

class DynamicScoringService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.scoreCache = new Map(); // Short-term cache for performance
        this.cacheTimeout = 30000; // 30 seconds
        this.cacheTimestamps = new Map();
        
        console.log('🎯 Dynamic Scoring Service initialized');
    }
    
    /**
     * Calculate a user's total score from their activities
     * @param {string} sanitizedName - User's sanitized name
     * @param {boolean} useCache - Whether to use short-term cache
     * @returns {Promise<number>} Total calculated score
     */
    async calculateUserScore(sanitizedName, useCache = true) {
        // Check cache first if enabled
        if (useCache && this.isScoreCached(sanitizedName)) {
            console.log(`📊 Using cached score for ${sanitizedName}`);
            return this.scoreCache.get(sanitizedName);
        }
        
        try {
            console.log(`🔢 Calculating fresh score for ${sanitizedName}...`);
            
            // Get all activities for the user
            const activities = await this.firebaseService.getUserActivities(sanitizedName);
            
            // Calculate total score
            const totalScore = activities.reduce((sum, activity) => {
                const points = window.DataUtils ? 
                    window.DataUtils.validateNumber(activity.points, 0) : 
                    (activity.points || 0);
                return sum + points;
            }, 0);
            
            // Cache the result
            this.scoreCache.set(sanitizedName, totalScore);
            this.cacheTimestamps.set(sanitizedName, Date.now());
            
            console.log(`✅ Calculated ${sanitizedName}: ${totalScore} points from ${activities.length} activities`);
            return totalScore;
            
        } catch (error) {
            console.error(`❌ Error calculating score for ${sanitizedName}:`, error);
            return 0;
        }
    }
    
    /**
     * Get leaderboard with dynamically calculated scores
     * @param {number} limit - Maximum number of users to return
     * @returns {Promise<Array>} Leaderboard with calculated scores
     */
    async getDynamicLeaderboard(limit = 50) {
        try {
            console.log('🏆 Generating dynamic leaderboard...');
            const startTime = Date.now();
            
            // Get all active users
            const usersSnapshot = await this.firebaseService.db.collection('users').get();
            const users = [];
            
            // Calculate scores for each user
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                
                // Skip deleted users
                if (userData.isDeleted) continue;
                
                const calculatedScore = await this.calculateUserScore(userDoc.id);
                
                users.push({
                    id: userDoc.id,
                    name: userData.name,
                    sanitizedName: userData.sanitizedName || userDoc.id,
                    calculatedScore: calculatedScore,
                    storedScore: userData.totalScore || 0, // For comparison
                    lastActivity: userData.lastActivity,
                    createdAt: userData.createdAt
                });
            }
            
            // Sort by calculated score (highest first)
            users.sort((a, b) => b.calculatedScore - a.calculatedScore);
            
            // Apply limit
            const leaderboard = users.slice(0, limit);
            
            const totalTime = Date.now() - startTime;
            console.log(`🎯 Generated leaderboard in ${totalTime}ms: ${leaderboard.length} users`);
            
            return leaderboard;
            
        } catch (error) {
            console.error('❌ Error generating dynamic leaderboard:', error);
            return [];
        }
    }
    
    /**
     * Compare calculated vs stored scores for all users (audit function)
     * @returns {Promise<Array>} Users with score discrepancies
     */
    async auditAllScores() {
        try {
            console.log('🔍 Starting comprehensive score audit...');
            const discrepancies = [];
            
            const usersSnapshot = await this.firebaseService.db.collection('users').get();
            
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                if (userData.isDeleted) continue;
                
                const calculatedScore = await this.calculateUserScore(userDoc.id, false); // No cache
                const storedScore = userData.totalScore || 0;
                
                if (calculatedScore !== storedScore) {
                    discrepancies.push({
                        id: userDoc.id,
                        name: userData.name,
                        storedScore: storedScore,
                        calculatedScore: calculatedScore,
                        difference: calculatedScore - storedScore,
                        activities: await this.getActivityCount(userDoc.id)
                    });
                }
            }
            
            console.log(`🎯 Audit complete: Found ${discrepancies.length} discrepancies`);
            return discrepancies;
            
        } catch (error) {
            console.error('❌ Error during score audit:', error);
            return [];
        }
    }
    
    /**
     * Fix all score discrepancies by updating stored scores to match calculated
     * @param {Function} progressCallback - Progress update callback
     * @returns {Promise<Object>} Summary of fixes applied
     */
    async fixAllScoreDiscrepancies(progressCallback = null) {
        try {
            console.log('🔧 Starting bulk score fix operation...');
            const discrepancies = await this.auditAllScores();
            
            if (discrepancies.length === 0) {
                console.log('✅ No score discrepancies found - all scores are synchronized');
                return { fixed: 0, errors: 0, total: 0 };
            }
            
            let fixed = 0;
            let errors = 0;
            const errorList = [];
            
            for (let i = 0; i < discrepancies.length; i++) {
                const user = discrepancies[i];
                
                try {
                    // Update stored score to match calculated score
                    await this.firebaseService.db.collection('users').doc(user.id).update({
                        totalScore: user.calculatedScore,
                        lastScoreRecalculation: firebase.firestore.FieldValue.serverTimestamp(),
                        scoreRecalculationReason: 'dynamic-scoring-fix',
                        previousStoredScore: user.storedScore
                    });
                    
                    fixed++;
                    console.log(`✅ Fixed ${user.name}: ${user.storedScore} → ${user.calculatedScore}`);
                    
                } catch (error) {
                    errors++;
                    errorList.push({ user: user.name, error: error.message });
                    console.error(`❌ Failed to fix ${user.name}:`, error);
                }
                
                // Progress callback
                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: discrepancies.length,
                        fixed,
                        errors,
                        currentUser: user.name
                    });
                }
            }
            
            console.log(`🎯 Bulk fix complete: ${fixed} fixed, ${errors} errors`);
            return {
                fixed,
                errors,
                total: discrepancies.length,
                errorList
            };
            
        } catch (error) {
            console.error('❌ Error during bulk score fix:', error);
            throw error;
        }
    }
    
    /**
     * Invalidate cache for a specific user (call when activities change)
     * @param {string} sanitizedName - User to invalidate cache for
     */
    invalidateUserCache(sanitizedName) {
        this.scoreCache.delete(sanitizedName);
        this.cacheTimestamps.delete(sanitizedName);
        console.log(`🗑️ Invalidated score cache for ${sanitizedName}`);
    }
    
    /**
     * Clear all score cache
     */
    clearCache() {
        this.scoreCache.clear();
        this.cacheTimestamps.clear();
        console.log('🧹 Cleared all score cache');
    }
    
    /**
     * Check if a user's score is cached and still valid
     * @param {string} sanitizedName - User to check
     * @returns {boolean} Whether cached score is valid
     */
    isScoreCached(sanitizedName) {
        if (!this.scoreCache.has(sanitizedName)) return false;
        
        const cacheTime = this.cacheTimestamps.get(sanitizedName);
        const age = Date.now() - cacheTime;
        
        if (age > this.cacheTimeout) {
            // Cache expired
            this.invalidateUserCache(sanitizedName);
            return false;
        }
        
        return true;
    }
    
    /**
     * Get activity count for a user
     * @param {string} sanitizedName - User's sanitized name
     * @returns {Promise<number>} Number of activities
     */
    async getActivityCount(sanitizedName) {
        try {
            const activities = await this.firebaseService.getUserActivities(sanitizedName);
            return activities.length;
        } catch (error) {
            console.error(`Error getting activity count for ${sanitizedName}:`, error);
            return 0;
        }
    }
}

// Initialize the service when Firebase is ready
let dynamicScoringService = null;

function initializeDynamicScoring() {
    if (window.firebaseService && !dynamicScoringService) {
        dynamicScoringService = new DynamicScoringService(window.firebaseService);
        window.dynamicScoringService = dynamicScoringService;
        console.log('🚀 Dynamic Scoring Service ready');
        
        // Add convenient global functions
        window.calculateUserScore = (name) => dynamicScoringService.calculateUserScore(name);
        window.getDynamicLeaderboard = (limit) => dynamicScoringService.getDynamicLeaderboard(limit);
        window.auditAllScores = () => dynamicScoringService.auditAllScores();
        window.fixAllScores = (callback) => dynamicScoringService.fixAllScoreDiscrepancies(callback);
    }
}

// Auto-initialize when Firebase becomes available
document.addEventListener('DOMContentLoaded', () => {
    // Try immediately
    initializeDynamicScoring();
    
    // Also try after a delay in case Firebase loads later
    setTimeout(initializeDynamicScoring, 2000);
});

// Make available globally
window.DynamicScoringService = DynamicScoringService;
window.initializeDynamicScoring = initializeDynamicScoring;