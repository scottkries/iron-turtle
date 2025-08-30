// Achievement Badges System for Iron Turtle Challenge
class AchievementManager {
    constructor(app) {
        this.app = app;
        this.achievements = this.defineAchievements();
        this.earnedAchievements = [];
    }

    defineAchievements() {
        return [
            // Milestone Achievements
            {
                id: 'first_activity',
                name: 'Getting Started',
                description: 'Log your first activity',
                icon: '🎯',
                category: 'milestone',
                condition: (stats) => stats.totalActivities >= 1,
                points: 10
            },
            {
                id: 'ten_activities',
                name: 'Warming Up',
                description: 'Complete 10 activities',
                icon: '🔥',
                category: 'milestone',
                condition: (stats) => stats.totalActivities >= 10,
                points: 25
            },
            {
                id: 'twentyfive_activities',
                name: 'On Fire',
                description: 'Complete 25 activities',
                icon: '🔥',
                category: 'milestone',
                condition: (stats) => stats.totalActivities >= 25,
                points: 50
            },
            {
                id: 'fifty_activities',
                name: 'Marathon Runner',
                description: 'Complete 50 activities',
                icon: '🏃',
                category: 'milestone',
                condition: (stats) => stats.totalActivities >= 50,
                points: 100
            },
            
            // Score Achievements
            {
                id: 'hundred_points',
                name: 'Century',
                description: 'Reach 100 points',
                icon: '💯',
                category: 'score',
                condition: (stats) => stats.totalScore >= 100,
                points: 20
            },
            {
                id: 'fivehundred_points',
                name: 'High Scorer',
                description: 'Reach 500 points',
                icon: '🏆',
                category: 'score',
                condition: (stats) => stats.totalScore >= 500,
                points: 50
            },
            {
                id: 'thousand_points',
                name: 'Elite',
                description: 'Reach 1000 points',
                icon: '👑',
                category: 'score',
                condition: (stats) => stats.totalScore >= 1000,
                points: 100
            },
            {
                id: 'twothousand_points',
                name: 'Legendary',
                description: 'Reach 2000 points',
                icon: '🌟',
                category: 'score',
                condition: (stats) => stats.totalScore >= 2000,
                points: 200
            },
            
            // Category Masters
            {
                id: 'drink_master',
                name: 'Hydration Hero',
                description: 'Complete 20 drink activities',
                icon: '🍺',
                category: 'master',
                condition: (stats) => (stats.categoryCount?.drink || 0) >= 20,
                points: 30
            },
            {
                id: 'food_master',
                name: 'Foodie',
                description: 'Complete 15 food activities',
                icon: '🍔',
                category: 'master',
                condition: (stats) => (stats.categoryCount?.food || 0) >= 15,
                points: 30
            },
            {
                id: 'competition_king',
                name: 'Competition King',
                description: 'Win 10 competitions',
                icon: '🏅',
                category: 'master',
                condition: (stats) => (stats.competitionWins || 0) >= 10,
                points: 50
            },
            {
                id: 'task_champion',
                name: 'Task Champion',
                description: 'Complete 15 tasks',
                icon: '✅',
                category: 'master',
                condition: (stats) => (stats.categoryCount?.task || 0) >= 15,
                points: 40
            },
            
            // Special Achievements
            {
                id: 'early_bird',
                name: 'Early Bird',
                description: 'Log an activity before 8 AM',
                icon: '🌅',
                category: 'special',
                condition: (stats) => stats.earlyBirdActivity === true,
                points: 15
            },
            {
                id: 'night_owl',
                name: 'Night Owl',
                description: 'Log an activity after midnight',
                icon: '🦉',
                category: 'special',
                condition: (stats) => stats.nightOwlActivity === true,
                points: 15
            },
            {
                id: 'comeback_kid',
                name: 'Comeback Kid',
                description: 'Move from last place to top 3',
                icon: '💪',
                category: 'special',
                condition: (stats) => stats.comebackAchieved === true,
                points: 75
            },
            {
                id: 'multiplier_master',
                name: 'Multiplier Master',
                description: 'Use 5 different multipliers in one activity',
                icon: '✨',
                category: 'special',
                condition: (stats) => stats.maxMultipliersUsed >= 5,
                points: 40
            },
            {
                id: 'perfect_day',
                name: 'Perfect Day',
                description: 'Complete activities from all categories in one day',
                icon: '🌟',
                category: 'special',
                condition: (stats) => stats.perfectDay === true,
                points: 60
            },
            {
                id: 'streak_warrior',
                name: 'Streak Warrior',
                description: 'Log activities for 10 consecutive hours',
                icon: '⚡',
                category: 'special',
                condition: (stats) => stats.maxStreak >= 10,
                points: 50
            },
            
            // Legendary Achievements
            {
                id: 'iron_turtle',
                name: 'Iron Turtle',
                description: 'Complete the perfect weekend (50+ activities, 1000+ points)',
                icon: '🐢',
                category: 'legendary',
                condition: (stats) => stats.totalActivities >= 50 && stats.totalScore >= 1000,
                points: 250
            },
            {
                id: 'unstoppable',
                name: 'Unstoppable',
                description: 'Lead the leaderboard for 24 consecutive hours',
                icon: '🚀',
                category: 'legendary',
                condition: (stats) => stats.leadershipTime >= 24,
                points: 150
            },
            {
                id: 'diversity_champion',
                name: 'Diversity Champion',
                description: 'Complete every type of activity at least once',
                icon: '🌈',
                category: 'legendary',
                condition: (stats) => stats.uniqueActivities >= 30,
                points: 100
            }
        ];
    }

    async calculateUserStats(userId, userName) {
        const stats = {
            totalActivities: 0,
            totalScore: 0,
            categoryCount: {},
            competitionWins: 0,
            earlyBirdActivity: false,
            nightOwlActivity: false,
            comebackAchieved: false,
            maxMultipliersUsed: 0,
            perfectDay: false,
            maxStreak: 0,
            leadershipTime: 0,
            uniqueActivities: 0,
            activitiesByDay: {}
        };

        try {
            let activities = [];
            
            // Get activities from Firebase or localStorage
            if (this.app.firebaseService) {
                const snapshot = await this.app.firebaseService.db.collection('activities')
                    .where('userSanitizedName', '==', userId)
                    .orderBy('timestamp', 'desc')
                    .get();
                
                snapshot.forEach((doc) => {
                    activities.push(doc.data());
                });
            } else if (window.scoringEngine) {
                activities = window.scoringEngine.getUserActivities(userName);
            }

            // Process activities
            const uniqueActivityIds = new Set();
            
            activities.forEach(activity => {
                stats.totalActivities++;
                stats.totalScore += activity.points || 0;
                
                // Category count
                const category = activity.category;
                if (!stats.categoryCount[category]) {
                    stats.categoryCount[category] = 0;
                }
                stats.categoryCount[category]++;
                
                // Competition wins
                if (category === 'competition' && activity.competitionResult === 'win') {
                    stats.competitionWins++;
                }
                
                // Time-based achievements
                const activityDate = new Date(activity.timestamp);
                const hour = activityDate.getHours();
                if (hour < 8) stats.earlyBirdActivity = true;
                // Night owl: late night (10pm-midnight) or early morning (midnight-6am)
                if ((hour >= 22 && hour <= 23) || (hour >= 0 && hour < 6)) stats.nightOwlActivity = true;
                
                // Multiplier usage
                const multipliersUsed = activity.multipliers ? activity.multipliers.length : 0;
                if (multipliersUsed > stats.maxMultipliersUsed) {
                    stats.maxMultipliersUsed = multipliersUsed;
                }
                
                // Track unique activities
                uniqueActivityIds.add(activity.activityId);
                
                // Track activities by day for perfect day check
                const dayKey = activityDate.toDateString();
                if (!stats.activitiesByDay[dayKey]) {
                    stats.activitiesByDay[dayKey] = new Set();
                }
                stats.activitiesByDay[dayKey].add(category);
            });
            
            stats.uniqueActivities = uniqueActivityIds.size;
            
            // Check for perfect day (all categories in one day)
            const allCategories = ['drink', 'food', 'competition', 'task', 'random'];
            Object.values(stats.activitiesByDay).forEach(dayCategories => {
                if (allCategories.every(cat => dayCategories.has(cat))) {
                    stats.perfectDay = true;
                }
            });
            
            // Calculate streak (simplified - activities within consecutive hours)
            if (activities.length > 0) {
                let currentStreak = 1;
                let maxStreak = 1;
                
                for (let i = 1; i < activities.length; i++) {
                    const timeDiff = activities[i-1].timestamp - activities[i].timestamp;
                    const hoursDiff = timeDiff / (1000 * 60 * 60);
                    
                    if (hoursDiff <= 1) {
                        currentStreak++;
                        maxStreak = Math.max(maxStreak, currentStreak);
                    } else {
                        currentStreak = 1;
                    }
                }
                stats.maxStreak = maxStreak;
            }
            
        } catch (error) {
            console.error('Error calculating user stats:', error);
        }
        
        return stats;
    }

    async checkAchievements(userId, userName) {
        const stats = await this.calculateUserStats(userId, userName);
        const newAchievements = [];
        
        // Get previously earned achievements
        let previousAchievements = [];
        if (this.app.firebaseService) {
            try {
                const userDoc = await this.app.firebaseService.db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    previousAchievements = userDoc.data().achievements || [];
                }
            } catch (error) {
                console.error('Error fetching previous achievements:', error);
            }
        } else {
            const saved = localStorage.getItem(`ironTurtle_achievements_${userName}`);
            previousAchievements = saved ? JSON.parse(saved) : [];
        }
        
        // Check each achievement
        for (const achievement of this.achievements) {
            const alreadyEarned = previousAchievements.some(a => a.id === achievement.id);
            if (!alreadyEarned && achievement.condition(stats)) {
                newAchievements.push({
                    id: achievement.id,
                    earnedAt: Date.now()
                });
                
                // Show notification
                this.showAchievementNotification(achievement);
            }
        }
        
        // Save new achievements
        if (newAchievements.length > 0) {
            const allAchievements = [...previousAchievements, ...newAchievements];
            
            if (this.app.firebaseService) {
                try {
                    await this.app.firebaseService.db.collection('users').doc(userId).update({
                        achievements: allAchievements,
                        lastAchievement: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (error) {
                    console.error('Error saving achievements:', error);
                }
            } else {
                localStorage.setItem(`ironTurtle_achievements_${userName}`, JSON.stringify(allAchievements));
            }
            
            // Update display
            this.updateAchievementDisplay(allAchievements);
        }
        
        return newAchievements;
    }

    showAchievementNotification(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" 
                 style="z-index: 9999; min-width: 300px;">
                <div class="d-flex align-items-center">
                    <span class="fs-1 me-3">${achievement.icon}</span>
                    <div>
                        <strong>Achievement Unlocked!</strong><br>
                        <span>${achievement.name}</span><br>
                        <small class="text-muted">${achievement.description}</small><br>
                        <small class="text-success">+${achievement.points} bonus points</small>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>`;
        
        document.body.appendChild(notification);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Play sound if available
        this.playAchievementSound();
    }

    playAchievementSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Could not play achievement sound:', error);
        }
    }

    async updateAchievementDisplay(earnedAchievements = []) {
        // Get or create achievement display container
        let container = document.getElementById('achievement-badges');
        if (!container) {
            // Add achievement section to dashboard
            const dashboardContainer = document.querySelector('#dashboard-screen .container');
            if (dashboardContainer) {
                const achievementSection = document.createElement('div');
                achievementSection.className = 'row mt-4';
                achievementSection.innerHTML = `
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5>🏆 Achievements</h5>
                            </div>
                            <div class="card-body">
                                <div id="achievement-badges" class="d-flex flex-wrap gap-2"></div>
                                <div id="achievement-progress" class="mt-3"></div>
                            </div>
                        </div>
                    </div>`;
                
                // Insert after the first row
                const firstRow = dashboardContainer.querySelector('.row');
                if (firstRow && firstRow.nextSibling) {
                    dashboardContainer.insertBefore(achievementSection, firstRow.nextSibling);
                } else {
                    dashboardContainer.appendChild(achievementSection);
                }
                
                container = document.getElementById('achievement-badges');
            }
        }
        
        if (!container) return;
        
        // Display badges
        let badgeHtml = '';
        this.achievements.forEach(achievement => {
            const earned = earnedAchievements.some(a => a.id === achievement.id);
            const opacity = earned ? '1' : '0.3';
            const title = earned ? 
                `${achievement.name}: ${achievement.description} (+${achievement.points} pts)` : 
                `${achievement.name}: ${achievement.description} (Locked)`;
            
            badgeHtml += `
                <div class="achievement-badge" 
                     style="opacity: ${opacity}; cursor: pointer; padding: 10px; text-align: center;"
                     title="${title}"
                     data-bs-toggle="tooltip">
                    <div style="font-size: 2rem;">${achievement.icon}</div>
                    <small style="font-size: 0.7rem;">${achievement.name}</small>
                </div>`;
        });
        // Dispose of existing tooltips BEFORE changing innerHTML
        if (this.tooltips && this.tooltips.length > 0) {
            this.tooltips.forEach(tooltip => tooltip.dispose());
            this.tooltips = [];
        }
        
        container.innerHTML = badgeHtml;
        
        // Create new tooltips and store them
        const tooltipTriggerList = [].slice.call(container.querySelectorAll('[data-bs-toggle="tooltip"]'));
        this.tooltips = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Update progress
        const progressContainer = document.getElementById('achievement-progress');
        if (progressContainer) {
            const earnedCount = earnedAchievements.length;
            const totalCount = this.achievements.length;
            const percentage = Math.round((earnedCount / totalCount) * 100);
            
            progressContainer.innerHTML = `
                <div class="d-flex justify-content-between mb-1">
                    <span>Achievement Progress</span>
                    <span>${earnedCount}/${totalCount} (${percentage}%)</span>
                </div>
                <div class="progress" style="height: 25px;">
                    <div class="progress-bar bg-success" role="progressbar" 
                         style="width: ${percentage}%">
                        ${percentage}%
                    </div>
                </div>`;
        }
    }

    async getUserAchievements(userId, userName) {
        let achievements = [];
        
        if (this.app.firebaseService) {
            try {
                const userDoc = await this.app.firebaseService.db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    achievements = userDoc.data().achievements || [];
                }
            } catch (error) {
                console.error('Error fetching achievements:', error);
            }
        } else {
            const saved = localStorage.getItem(`ironTurtle_achievements_${userName}`);
            achievements = saved ? JSON.parse(saved) : [];
        }
        
        return achievements;
    }
}

// Export for use in app.js
window.AchievementManager = AchievementManager;