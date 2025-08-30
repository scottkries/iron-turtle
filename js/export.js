// Export functionality for Iron Turtle Challenge
class ExportManager {
    constructor(app) {
        this.app = app;
    }
    
    // Helper to safely convert Firebase timestamps
    convertTimestamp(timestamp) {
        if (!timestamp) return null;
        // Check if it's a Firestore timestamp with toDate method
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }
        // Check if it's already a Date object
        if (timestamp instanceof Date) {
            return timestamp;
        }
        // Check if it's a number (milliseconds)
        if (typeof timestamp === 'number') {
            return new Date(timestamp);
        }
        // Check if it's a string that can be parsed
        if (typeof timestamp === 'string') {
            const parsed = Date.parse(timestamp);
            return isNaN(parsed) ? null : new Date(parsed);
        }
        return null;
    }

    // Export complete event data as JSON
    async exportToJSON() {
        const exportData = await this.gatherExportData();
        const jsonString = JSON.stringify(exportData, null, 2);
        const timestamp = new Date().getTime(); // Simple timestamp in milliseconds
        const filename = `iron-turtle-export-${timestamp}.json`;
        this.downloadFile(jsonString, filename, 'application/json');
    }

    // Export leaderboard and activities as CSV
    async exportToCSV() {
        const data = await this.gatherExportData();
        
        // Create leaderboard CSV
        let csv = 'Iron Turtle Challenge Export\n';
        csv += `Event Date: ${data.exportDate}\n`;
        csv += `Total Participants: ${data.participants.length}\n\n`;
        
        // Leaderboard section
        csv += 'LEADERBOARD\n';
        csv += 'Rank,Name,Score,Activities Count,Last Activity\n';
        data.leaderboard.forEach((user, index) => {
            csv += `${index + 1},"${user.name}",${user.totalScore},${user.activityCount},${user.lastActivity || 'N/A'}\n`;
        });
        
        csv += '\n';
        
        // Activities summary section
        csv += 'ACTIVITIES SUMMARY\n';
        csv += 'Activity,Category,Times Completed,Total Points Generated\n';
        const activitySummary = this.summarizeActivities(data.allActivities);
        Object.entries(activitySummary).forEach(([activityName, stats]) => {
            csv += `"${activityName}","${stats.category}",${stats.count},${stats.totalPoints}\n`;
        });
        
        csv += '\n';
        
        // Detailed activities log
        csv += 'DETAILED ACTIVITY LOG\n';
        csv += 'Timestamp,User,Activity,Category,Base Points,Multipliers,Final Points,Location,Witnesses\n';
        data.allActivities.forEach(activity => {
            const timestamp = activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A';
            const multipliers = activity.multipliers ? activity.multipliers.join('; ') : 'None';
            const location = activity.metadata?.location || 'N/A';
            const witnesses = activity.metadata?.witnesses || 'N/A';
            csv += `"${timestamp}","${activity.userName}","${activity.activityName}","${activity.category}",${activity.basePoints},"${multipliers}",${activity.points},"${location}","${witnesses}"\n`;
        });
        
        const timestamp = new Date().getTime(); // Simple timestamp in milliseconds
        const filename = `iron-turtle-export-${timestamp}.csv`;
        this.downloadFile(csv, filename, 'text/csv');
    }

    // Gather all data for export
    async gatherExportData() {
        const exportData = {
            eventName: 'Iron Turtle Challenge',
            exportDate: new Date().toISOString(),
            participants: [],
            leaderboard: [],
            allActivities: [],
            statistics: {}
        };

        try {
            if (this.app.firebaseService) {
                // Get all users from Firebase
                const usersSnapshot = await this.app.firebaseService.db.collection('users')
                    .orderBy('totalScore', 'desc')
                    .get();
                
                const users = [];
                usersSnapshot.forEach(doc => {
                    const userData = doc.data();
                    // Filter out soft-deleted users
                    if (!userData.isDeleted) {
                        users.push({
                            id: doc.id,
                            name: userData.name,
                            totalScore: userData.totalScore || 0,
                            completedTasks: userData.completedTasks || {},
                            createdAt: this.convertTimestamp(userData.createdAt),
                            lastActivity: this.convertTimestamp(userData.lastActivity)
                        });
                    }
                });
                
                exportData.participants = users;
                
                // Create leaderboard with activity counts
                for (const user of users) {
                    const activitiesSnapshot = await this.app.firebaseService.db.collection('activities')
                        .where('userSanitizedName', '==', user.id)
                        .get();
                    
                    const activityCount = activitiesSnapshot.size;
                    exportData.leaderboard.push({
                        ...user,
                        activityCount
                    });
                }
                
                // Get all activities
                const activitiesSnapshot = await this.app.firebaseService.db.collection('activities')
                    .orderBy('timestamp', 'desc')
                    .get();
                
                activitiesSnapshot.forEach(doc => {
                    const activity = doc.data();
                    exportData.allActivities.push({
                        id: doc.id,
                        ...activity,
                        timestamp: activity.timestamp?.toDate?.().getTime() || null
                    });
                });
                
            } else {
                // Fallback to localStorage
                const activities = JSON.parse(localStorage.getItem('ironTurtle_activities') || '[]');
                const users = {};
                
                // Build user data from activities
                activities.forEach(activity => {
                    if (!users[activity.userName]) {
                        users[activity.userName] = {
                            name: activity.userName,
                            totalScore: 0,
                            activityCount: 0,
                            activities: []
                        };
                    }
                    users[activity.userName].totalScore += activity.points;
                    users[activity.userName].activityCount++;
                    users[activity.userName].activities.push(activity);
                });
                
                exportData.participants = Object.values(users);
                exportData.leaderboard = Object.values(users).sort((a, b) => b.totalScore - a.totalScore);
                exportData.allActivities = activities;
            }
            
            // Calculate statistics
            exportData.statistics = this.calculateStatistics(exportData);
            
        } catch (error) {
            console.error('Error gathering export data:', error);
            alert('Error preparing export. Please try again.');
        }
        
        return exportData;
    }

    // Calculate event statistics
    calculateStatistics(data) {
        const stats = {
            totalParticipants: data.participants.length,
            totalActivities: data.allActivities.length,
            totalPointsAwarded: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            mostPopularActivity: null,
            leastPopularActivity: null,
            categoryCounts: {},
            winner: null
        };
        
        // Calculate scores
        if (data.leaderboard.length > 0) {
            stats.winner = data.leaderboard[0].name;
            stats.highestScore = data.leaderboard[0].totalScore;
            stats.lowestScore = data.leaderboard[data.leaderboard.length - 1].totalScore;
            stats.totalPointsAwarded = data.leaderboard.reduce((sum, user) => sum + user.totalScore, 0);
            stats.averageScore = Math.round(stats.totalPointsAwarded / data.leaderboard.length);
        }
        
        // Count activities by category
        data.allActivities.forEach(activity => {
            if (!stats.categoryCounts[activity.category]) {
                stats.categoryCounts[activity.category] = 0;
            }
            stats.categoryCounts[activity.category]++;
        });
        
        // Find most/least popular activities
        const activityCounts = {};
        data.allActivities.forEach(activity => {
            if (!activityCounts[activity.activityName]) {
                activityCounts[activity.activityName] = 0;
            }
            activityCounts[activity.activityName]++;
        });
        
        const sortedActivities = Object.entries(activityCounts).sort((a, b) => b[1] - a[1]);
        if (sortedActivities.length > 0) {
            stats.mostPopularActivity = `${sortedActivities[0][0]} (${sortedActivities[0][1]} times)`;
            stats.leastPopularActivity = `${sortedActivities[sortedActivities.length - 1][0]} (${sortedActivities[sortedActivities.length - 1][1]} times)`;
        }
        
        return stats;
    }

    // Summarize activities for CSV
    summarizeActivities(activities) {
        const summary = {};
        
        activities.forEach(activity => {
            if (!summary[activity.activityName]) {
                summary[activity.activityName] = {
                    category: activity.category,
                    count: 0,
                    totalPoints: 0
                };
            }
            summary[activity.activityName].count++;
            summary[activity.activityName].totalPoints += activity.points || 0;
        });
        
        return summary;
    }

    // Download file helper
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

// Export for use in app.js
window.ExportManager = ExportManager;