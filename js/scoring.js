// Iron Turtle Challenge - Scoring Engine
class ScoringEngine {
    constructor() {
        this.activities = [];
        this.loadActivities();
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

    calculatePoints(activity, multipliers = [], quantity = 1) {
        let basePoints = activity.basePoints || activity.winPoints || 0;
        let totalMultiplier = 1;

        // Apply multipliers
        multipliers.forEach(multiplierId => {
            const multiplier = MULTIPLIERS.find(m => m.id === multiplierId);
            if (multiplier && this.canApplyMultiplier(activity, multiplier)) {
                totalMultiplier *= multiplier.factor;
            }
        });

        return basePoints * totalMultiplier * quantity;
    }

    canApplyMultiplier(activity, multiplier) {
        // Check if multiplier can be applied to this activity type
        if (activity.category === 'consumables') {
            return multiplier.appliesToConsumables || multiplier.appliesToOthers;
        }
        return multiplier.appliesToOthers;
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

    getUserActivities(userId) {
        return this.activities.filter(activity => activity.userId === userId);
    }

    removeActivity(activityId) {
        this.activities = this.activities.filter(activity => activity.id !== activityId);
        this.saveActivities();
    }
}

// Global scoring engine instance
window.scoringEngine = new ScoringEngine();