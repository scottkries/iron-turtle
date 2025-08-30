// Iron Turtle Challenge - Scoring Engine
class ScoringEngine {
    constructor() {
        this.activities = [];
        this.completedOneTimeTasks = [];
        this.loadActivities();
        this.loadCompletedTasks();
    }

    loadActivities() {
        const savedActivities = localStorage.getItem('ironTurtle_activities');
        if (savedActivities) {
            this.activities = JSON.parse(savedActivities);
        } else {
            this.activities = [];
        }
    }

    saveActivities() {
        localStorage.setItem('ironTurtle_activities', JSON.stringify(this.activities));
    }

    loadCompletedTasks() {
        const saved = localStorage.getItem('ironTurtle_completedTasks');
        if (saved) {
            this.completedOneTimeTasks = JSON.parse(saved);
        } else {
            this.completedOneTimeTasks = [];
        }
    }

    saveCompletedTasks() {
        localStorage.setItem('ironTurtle_completedTasks', JSON.stringify(this.completedOneTimeTasks));
    }

    isTaskCompleted(activityId) {
        return this.completedOneTimeTasks.includes(activityId);
    }

    markTaskCompleted(activityId) {
        if (!this.completedOneTimeTasks.includes(activityId)) {
            this.completedOneTimeTasks.push(activityId);
            this.saveCompletedTasks();
        }
    }

    logActivity(userId, activityId, multipliers = [], quantity = 1) {
        const activity = this.findActivityById(activityId);
        if (!activity) {
            throw new Error('Activity not found');
        }

        const logEntry = {
            id: Date.now(),
            userId: userId,
            activityId: activityId,
            multipliers: multipliers,
            quantity: quantity,
            timestamp: Date.now(),
            points: this.calculatePoints(activity, multipliers, quantity)
        };

        this.activities.push(logEntry);
        this.saveActivities();
        return logEntry;
    }

    findActivityById(activityId) {
        // Search through all activity categories
        for (const category of ['consumables', 'competitions', 'tasks', 'randomTasks', 'penalties', 'bonuses']) {
            if (ACTIVITIES[category]) {
                const found = ACTIVITIES[category].find(item => item.id === activityId);
                if (found) return found;
            }
        }
        return null;
    }

    calculatePoints(activity, multipliers = [], quantity = 1, options = {}) {
        // Use DataUtils if available for consistent calculation
        if (window.DataUtils) {
            return window.DataUtils.calculatePoints(activity, multipliers, quantity, options);
        }
        
        // Fallback calculation
        let basePoints = activity.basePoints || activity.winPoints || 0;
        let totalMultiplier = 1;

        // Apply multipliers with consistent logic
        multipliers.forEach(multiplierId => {
            const multiplier = MULTIPLIERS.find(m => m.id === multiplierId);
            if (multiplier && this.canApplyMultiplier(activity, multiplier)) {
                totalMultiplier *= multiplier.factor;
            }
        });

        return Math.round(basePoints * totalMultiplier * quantity);
    }

    canApplyMultiplier(activity, multiplier) {
        // Use DataUtils if available for consistent logic
        if (window.DataUtils) {
            return window.DataUtils.canApplyMultiplier(activity, multiplier);
        }
        
        // Fixed logic: consumables only get consumable multipliers, others only get other multipliers
        if (activity.category === 'consumables' || activity.category === 'consumable' ||
            activity.category === 'drink' || activity.category === 'food') {
            return multiplier.appliesToConsumables === true;
        }
        return multiplier.appliesToOthers === true;
    }

    getUserScore(userId) {
        return this.activities
            .filter(activity => activity.userId === userId)
            .reduce((total, activity) => total + activity.points, 0);
    }

    getLeaderboard() {
        const userScores = {};
        
        this.activities.forEach(activity => {
            if (!userScores[activity.userId]) {
                userScores[activity.userId] = 0;
            }
            userScores[activity.userId] += activity.points;
        });

        return Object.entries(userScores)
            .map(([userId, score]) => ({ userId, score }))
            .sort((a, b) => b.score - a.score);
    }

    getMostPopularActivities() {
        // First, get users who have points > 0
        const userScores = this.getUserScores();
        const activeUsers = new Set();
        
        Object.entries(userScores).forEach(([userId, score]) => {
            if (score > 0) {
                activeUsers.add(userId);
            }
        });
        
        // If no users have points, return empty array
        if (activeUsers.size === 0) {
            return [];
        }
        
        const activityCounts = {};
        
        // Count occurrences of each activity only from active users
        this.activities.forEach(activity => {
            const userId = activity.userId || activity.userName;
            const activityId = activity.activityId;
            
            // Only count if activity belongs to a user with points
            if (activityId && userId && activeUsers.has(userId)) {
                activityCounts[activityId] = (activityCounts[activityId] || 0) + 1;
            }
        });
        
        // Convert to array and sort by count
        const sortedActivities = Object.entries(activityCounts)
            .map(([activityId, count]) => ({
                activityId,
                count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Get top 10
        
        return sortedActivities;
    }

    getUserActivities(userId) {
        return this.activities.filter(activity => activity.userId === userId);
    }

    removeActivity(activityId) {
        // Find the activity to remove
        const activityToRemove = this.activities.find(activity => activity.id === activityId);
        
        if (activityToRemove) {
            // Check if this is a one-time task that should be unmarked as completed
            const activityDef = this.findActivityById(activityToRemove.activityId);
            if (activityDef && activityDef.oneTimeOnly) {
                // Check if there are any other logs of this same activity
                const otherLogs = this.activities.filter(
                    activity => activity.id !== activityId && 
                    activity.activityId === activityToRemove.activityId &&
                    activity.userId === activityToRemove.userId
                );
                
                // If no other logs exist, unmark the task as completed
                if (otherLogs.length === 0) {
                    this.unmarkTaskCompleted(activityToRemove.activityId);
                }
            }
        }
        
        // Remove the activity
        this.activities = this.activities.filter(activity => activity.id !== activityId);
        this.saveActivities();
    }
    
    unmarkTaskCompleted(activityId) {
        this.completedOneTimeTasks = this.completedOneTimeTasks.filter(id => id !== activityId);
        this.saveCompletedTasks();
    }
    
    clearAllUserActivities(userId) {
        // Find all one-time tasks completed by this user
        const userActivities = this.activities.filter(activity => activity.userId === userId);
        const oneTimeTaskIds = new Set();
        
        userActivities.forEach(activity => {
            const activityDef = this.findActivityById(activity.activityId);
            if (activityDef && activityDef.oneTimeOnly) {
                oneTimeTaskIds.add(activity.activityId);
            }
        });
        
        // Remove user's activities
        this.activities = this.activities.filter(activity => activity.userId !== userId);
        
        // Unmark one-time tasks that no longer have any logs
        oneTimeTaskIds.forEach(taskId => {
            const stillHasLogs = this.activities.some(activity => activity.activityId === taskId);
            if (!stillHasLogs) {
                this.unmarkTaskCompleted(taskId);
            }
        });
        
        this.saveActivities();
    }
}

// Global scoring engine instance
window.scoringEngine = new ScoringEngine();