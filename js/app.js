// Iron Turtle Challenge - Main Application
class IronTurtleApp {
    constructor() {
        this.currentUser = null;
        this.currentScreen = 'registration';
        this.firebaseService = null;
        this.unsubscribers = []; // Store Firebase listener unsubscribe functions
        this.exportManager = null; // Will be initialized after DOM loads
        this.achievementManager = null; // Will be initialized after DOM loads
        this.init();
    }
    
    // Helper functions for metadata collection
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 6) return 'late-night';
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        if (hour < 21) return 'evening';
        return 'night';
    }
    
    detectDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }
    
    getTimeSinceLastActivity() {
        const userActivities = window.scoringEngine ? 
            window.scoringEngine.getUserActivities(this.currentUser?.name || '') : [];
        if (userActivities.length === 0) return null;
        
        const sortedActivities = userActivities.sort((a, b) => b.timestamp - a.timestamp);
        return Date.now() - sortedActivities[0].timestamp;
    }
    
    calculateCurrentStreak() {
        const userActivities = window.scoringEngine ? 
            window.scoringEngine.getUserActivities(this.currentUser?.name || '') : [];
        
        // Count activities in the current session (within last 4 hours)
        const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
        return userActivities.filter(a => a.timestamp > fourHoursAgo).length;
    }
    
    checkIfFirstOfType(activityId) {
        const userActivities = window.scoringEngine ? 
            window.scoringEngine.getUserActivities(this.currentUser?.name || '') : [];
        return !userActivities.some(a => a.activityId === activityId);
    }
    
    getAllUsers() {
        // Get unique users from all activities
        const users = new Set();
        if (window.scoringEngine && window.scoringEngine.activities) {
            window.scoringEngine.activities.forEach(activity => {
                users.add(activity.userId);
            });
        }
        // Always include current user
        if (this.currentUser) {
            users.add(this.currentUser.name);
        }
        return Array.from(users);
    }
    
    getSelectedWitnesses() {
        const witnesses = [];
        document.querySelectorAll('.witness-check:checked').forEach(checkbox => {
            witnesses.push(checkbox.value);
        });
        return witnesses.length > 0 ? witnesses : null;
    }
    
    getSelectedOpponents() {
        const opponents = [];
        document.querySelectorAll('.opponent-check:checked').forEach(checkbox => {
            opponents.push(checkbox.value);
        });
        return opponents.length > 0 ? opponents : null;
    }
    
    getSelectedTeamMembers() {
        const teamMembers = [];
        document.querySelectorAll('.team-member-check:checked').forEach(checkbox => {
            teamMembers.push(checkbox.value);
        });
        return teamMembers.length > 0 ? teamMembers : null;
    }
    
    populateWitnessList() {
        const container = document.getElementById('witnesses-list');
        if (!container) return;
        
        const currentUsers = this.getAllUsers();
        const currentUserId = this.currentUser?.name;
        
        let html = '';
        currentUsers.forEach(user => {
            if (user !== currentUserId) {
                html += `
                    <div class="form-check form-check-inline">
                        <input class="form-check-input witness-check" type="checkbox" 
                               id="witness-${user}" value="${user}">
                        <label class="form-check-label" for="witness-${user}">${user}</label>
                    </div>`;
            }
        });
        container.innerHTML = html || '<span class="text-muted">No other users logged in</span>';
    }
    
    populateOpponentsList() {
        const container = document.getElementById('opponents-list');
        if (!container) return;
        
        const currentUsers = this.getAllUsers();
        const currentUserId = this.currentUser?.name;
        
        let html = '';
        currentUsers.forEach(user => {
            if (user !== currentUserId) {
                html += `
                    <div class="form-check form-check-inline">
                        <input class="form-check-input opponent-check" type="checkbox" 
                               id="opponent-${user}" value="${user}">
                        <label class="form-check-label" for="opponent-${user}">${user}</label>
                    </div>`;
            }
        });
        container.innerHTML = html || '<span class="text-muted">No other users available</span>';
    }
    
    populateTeamMembersList() {
        const container = document.getElementById('team-members-list');
        if (!container) return;
        
        const currentUsers = this.getAllUsers();
        const currentUserId = this.currentUser?.name;
        
        let html = '';
        currentUsers.forEach(user => {
            if (user !== currentUserId) {
                html += `
                    <div class="form-check form-check-inline">
                        <input class="form-check-input team-member-check" type="checkbox" 
                               id="team-${user}" value="${user}">
                        <label class="form-check-label" for="team-${user}">${user}</label>
                    </div>`;
            }
        });
        container.innerHTML = html || '<span class="text-muted">No other users available</span>';
    }

    async init() {
        // Initialize Export Manager
        if (typeof ExportManager !== 'undefined') {
            this.exportManager = new ExportManager(this);
            console.log('Export manager initialized');
        } else {
            console.warn('Export manager not available');
        }
        
        // Initialize Achievement Manager
        if (typeof AchievementManager !== 'undefined') {
            this.achievementManager = new AchievementManager(this);
            console.log('Achievement manager initialized');
        } else {
            console.warn('Achievement manager not available');
        }
        
        // Initialize Firebase service if available
        if (typeof window.firebaseService !== 'undefined' && window.firebaseService && window.FIREBASE_ENABLED) {
            try {
                this.firebaseService = window.firebaseService;
                console.log('Firebase service available - enhanced features enabled');
                
                // Set up real-time listeners
                this.setupFirebaseListeners();
                
                // Check for stored username and auto-login
                const storedUsername = localStorage.getItem('ironTurtle_username');
                if (storedUsername) {
                    // Auto-login with stored username
                    console.log('Found stored username, verifying user exists:', storedUsername);
                    try {
                        // First check if user still exists in Firebase
                        const sanitizedName = this.firebaseService.sanitizeUsername(storedUsername);
                        const userDoc = await this.firebaseService.db.collection('users').doc(sanitizedName).get();
                        
                        if (userDoc.exists) {
                            // User exists, proceed with auto-login
                            const user = await this.firebaseService.signInAnonymously(storedUsername);
                            this.currentUser = {
                                uid: user.uid,
                                name: user.displayName,
                                sanitizedName: user.sanitizedName,
                                loginTime: Date.now()
                            };
                            this.showDashboard();
                        } else {
                            // User was deleted, clear stored username and show registration
                            console.log('User no longer exists in database, clearing stored session');
                            localStorage.removeItem('ironTurtle_username');
                            this.showRegistration();
                        }
                    } catch (error) {
                        console.error('Auto-login failed:', error);
                        localStorage.removeItem('ironTurtle_username');
                        this.showRegistration();
                    }
                } else {
                    this.showRegistration();
                }
            } catch (error) {
                console.log('Firebase not configured - using local storage mode');
                this.firebaseService = null;
                this.checkExistingSession();
            }
        } else {
            // Fallback to localStorage
            this.checkExistingSession();
        }
        
        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        // Registration form
        const registrationForm = document.getElementById('registration-form');
        registrationForm.addEventListener('submit', (e) => this.handleRegistration(e));

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', () => this.handleLogout());

        // Delete account button
        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => this.handleDeleteAccount());
        }

        // Log activity button
        const logActivityBtn = document.getElementById('log-activity-btn');
        logActivityBtn.addEventListener('click', () => this.showActivityLogger());
        
        // View history button
        const historyBtn = document.getElementById('view-history-btn');
        historyBtn.addEventListener('click', () => this.showActivityHistory());
        
        // Submit activity button
        const submitBtn = document.getElementById('log-activity-submit');
        submitBtn.addEventListener('click', () => this.submitActivity());
        
        // Clear all activities button
        const clearAllBtn = document.getElementById('clear-all-activities');
        clearAllBtn.addEventListener('click', () => this.clearAllActivities());
        
        // View reference chart button
        const referenceBtn = document.getElementById('view-reference-btn');
        referenceBtn.addEventListener('click', () => this.showReferenceChart());
        
        // Reference search input
        const referenceSearch = document.getElementById('reference-search');
        if (referenceSearch) {
            referenceSearch.addEventListener('input', (e) => this.filterReferenceChart(e.target.value));
        }
    }

    async handleRegistration(e) {
        e.preventDefault();
        
        const name = document.getElementById('player-name').value.trim();

        if (!name) {
            alert('Please enter your name');
            return;
        }

        // Use Firebase if available
        if (this.firebaseService) {
            try {
                // Check if user exists first and provide appropriate message
                const sanitizedName = this.firebaseService.sanitizeUsername(name);
                const userDoc = await this.firebaseService.db.collection('users').doc(sanitizedName).get();
                
                if (userDoc.exists) {
                    // User exists - this is a login, not a new registration
                    console.log('Existing user logging in:', name);
                }
                
                const user = await this.firebaseService.signInAnonymously(name);
                this.currentUser = {
                    uid: user.uid,
                    name: user.displayName,
                    sanitizedName: user.sanitizedName, // Store sanitized name for queries
                    loginTime: Date.now()
                };
                
                // Show appropriate message
                if (userDoc.exists) {
                    console.log('Welcome back,', user.displayName);
                    const userData = userDoc.data();
                    if (userData.totalScore > 0) {
                        this.showSuccessMessage(`Welcome back ${user.displayName}! Your score: ${userData.totalScore} points`);
                    } else {
                        this.showSuccessMessage(`Welcome back ${user.displayName}!`);
                    }
                } else {
                    console.log('New user registered:', user.displayName);
                    this.showSuccessMessage(`Welcome ${user.displayName}! Let's get started!`);
                }
                
                this.showDashboard();
                this.updateDisplay();
                this.setupFirebaseListeners(); // Re-setup listeners for this user
            } catch (error) {
                console.error('Firebase registration failed:', error);
                alert('Registration failed. Please try again.');
            }
        } else {
            // Fallback to localStorage
            this.currentUser = {
                name: name,
                loginTime: Date.now()
            };
            localStorage.setItem('ironTurtle_user', JSON.stringify(this.currentUser));
            this.showDashboard();
        }
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clean up Firebase listeners before logout
            this.cleanupListeners();
            
            if (this.firebaseService) {
                try {
                    await this.firebaseService.signOut();
                    localStorage.removeItem('ironTurtle_username'); // Clear stored username
                    this.currentUser = null;
                    this.showRegistration();
                } catch (error) {
                    console.error('Logout failed:', error);
                }
            } else {
                localStorage.removeItem('ironTurtle_user');
                this.currentUser = null;
                this.showRegistration();
            }
        }
    }

    async handleDeleteAccount() {
        if (!this.currentUser) {
            alert('No user logged in');
            return;
        }

        // Get user's current stats for confirmation
        let activityCount = 0;
        let totalScore = 0;
        
        if (this.firebaseService && this.currentUser.sanitizedName) {
            try {
                // Get activity count
                const activitiesSnapshot = await this.firebaseService.db.collection('activities')
                    .where('userSanitizedName', '==', this.currentUser.sanitizedName)
                    .get();
                activityCount = activitiesSnapshot.size;
                
                // Get user score
                const userDoc = await this.firebaseService.db.collection('users')
                    .doc(this.currentUser.sanitizedName)
                    .get();
                if (userDoc.exists) {
                    totalScore = userDoc.data().totalScore || 0;
                }
            } catch (error) {
                console.error('Error fetching user stats:', error);
            }
        } else if (window.scoringEngine) {
            // Fallback to localStorage
            const activities = window.scoringEngine.getUserActivities(this.currentUser.name);
            activityCount = activities.length;
            totalScore = window.scoringEngine.getUserScore(this.currentUser.name);
        }

        // First confirmation
        const firstConfirm = confirm(
            `⚠️ DELETE ACCOUNT WARNING ⚠️\n\n` +
            `This will permanently delete:\n` +
            `• Your account: ${this.currentUser.name}\n` +
            `• ${activityCount} logged activities\n` +
            `• ${totalScore} total points\n\n` +
            `This action CANNOT be undone!\n\n` +
            `Are you sure you want to delete your account?`
        );
        
        if (!firstConfirm) return;

        // Second confirmation
        const secondConfirm = confirm(
            `🚨 FINAL WARNING 🚨\n\n` +
            `You are about to permanently delete your account "${this.currentUser.name}".\n\n` +
            `All your data will be lost forever.\n\n` +
            `Are you ABSOLUTELY SURE?`
        );
        
        if (!secondConfirm) return;

        // Type confirmation
        const typedConfirm = prompt(
            `To confirm deletion, please type your username exactly as shown:\n\n` +
            `${this.currentUser.name}`
        );
        
        if (typedConfirm !== this.currentUser.name) {
            alert('Username did not match. Account deletion cancelled.');
            return;
        }

        // Perform deletion
        try {
            if (this.firebaseService && this.currentUser.sanitizedName) {
                // Delete from Firebase
                const result = await this.firebaseService.deleteUser(this.currentUser.sanitizedName);
                
                // Clean up local storage
                localStorage.removeItem('ironTurtle_username');
                localStorage.removeItem('ironTurtle_user');
                
                // Clean up listeners
                this.cleanupListeners();
                
                // Sign out from Firebase
                await this.firebaseService.signOut();
                
                alert(
                    `✅ Account Deleted Successfully\n\n` +
                    `Deleted ${result.activitiesDeleted} activities.\n\n` +
                    `Thank you for playing Iron Turtle Challenge!`
                );
            } else {
                // Delete from localStorage
                if (window.scoringEngine) {
                    window.scoringEngine.clearAllUserActivities(this.currentUser.name);
                }
                localStorage.removeItem('ironTurtle_user');
                
                alert('Account deleted successfully from local storage.');
            }
            
            // Reset to registration screen
            this.currentUser = null;
            this.showRegistration();
            
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account. Please try again or contact support.');
        }
    }

    handleAuthStateChange(user) {
        if (user) {
            // User is signed in
            this.currentUser = {
                uid: user.uid,
                name: user.displayName || 'Anonymous Player'
            };
            this.showDashboard();
        } else {
            // User is signed out
            this.currentUser = null;
            this.showRegistration();
        }
    }

    checkExistingSession() {
        const savedUser = localStorage.getItem('ironTurtle_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.currentScreen = 'dashboard';
        }
    }
    
    setupFirebaseListeners() {
        if (!this.firebaseService) return;
        
        // Clean up existing listeners
        this.cleanupListeners();
        
        // Listen for leaderboard updates
        const leaderboardUnsubscribe = this.firebaseService.db.collection('users')
            .orderBy('totalScore', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                const leaderboard = [];
                snapshot.forEach((doc) => {
                    leaderboard.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.updateLeaderboardDisplay(leaderboard);
            });
        
        this.unsubscribers.push(leaderboardUnsubscribe);
        
        // Listen for all activities to update popular activities
        const allActivitiesUnsubscribe = this.firebaseService.db.collection('activities')
            .onSnapshot(async () => {
                // Get popular activities
                const popularActivities = await this.firebaseService.getMostPopularActivities();
                this.updatePopularActivitiesDisplay(popularActivities);
            });
        
        this.unsubscribers.push(allActivitiesUnsubscribe);
        
        // Load popular activities immediately (don't wait for snapshot)
        this.firebaseService.getMostPopularActivities()
            .then(popularActivities => {
                this.updatePopularActivitiesDisplay(popularActivities);
            })
            .catch(error => {
                console.error('Error loading initial popular activities:', error);
                this.updatePopularActivitiesDisplay([]);
            });
        
        // Listen for user's own activities when logged in
        if (this.currentUser && this.currentUser.sanitizedName) {
            const activitiesUnsubscribe = this.firebaseService.db.collection('activities')
                .where('userSanitizedName', '==', this.currentUser.sanitizedName)
                .onSnapshot((snapshot) => {
                    const activities = [];
                    snapshot.forEach((doc) => {
                        activities.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    // Sort activities by timestamp in descending order
                    activities.sort((a, b) => {
                        const aTime = a.timestamp || 0;
                        const bTime = b.timestamp || 0;
                        return bTime - aTime;
                    });
                    // Update local cache for history display
                    this.userActivities = activities;
                    this.updateScores();
                });
            
            this.unsubscribers.push(activitiesUnsubscribe);
        }
        
        // Note: Authentication state listener would go here if needed
    }
    
    cleanupListeners() {
        // Unsubscribe from all Firebase listeners
        this.unsubscribers.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.unsubscribers = [];
    }
    
    updateLeaderboardDisplay(leaderboard) {
        const leaderboardElement = document.getElementById('leaderboard');
        if (!leaderboardElement) return;
        
        if (leaderboard.length === 0) {
            leaderboardElement.innerHTML = '<p class="text-muted">No scores yet</p>';
            return;
        }
        
        let html = '<ol class="list-group list-group-numbered">';
        leaderboard.forEach((user, index) => {
            // Check if this is the current user by comparing sanitized names
            const isCurrentUser = this.currentUser && 
                (user.id === this.currentUser.sanitizedName || 
                 user.sanitizedName === this.currentUser.sanitizedName ||
                 user.name === this.currentUser.name);
            const highlightClass = isCurrentUser ? 'list-group-item-primary' : '';
            const userIdentifier = user.sanitizedName || user.id || user.name;
            const userName = user.name || 'Anonymous';
            // Escape quotes for safe HTML attribute usage
            const safeIdentifier = userIdentifier.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            const safeName = userName.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            html += `
                <li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${highlightClass} leaderboard-item"
                    data-user-identifier="${safeIdentifier}"
                    data-user-name="${safeName}"
                    style="cursor: pointer;">
                    <div>
                        <span>${userName}</span>
                        ${index === 0 ? ' 👑' : ''}
                    </div>
                    <span class="badge bg-primary rounded-pill">${user.totalScore || 0}</span>
                </li>`;
        });
        html += '</ol>';
        
        leaderboardElement.innerHTML = html;
        
        // Add click event listeners to leaderboard items
        const leaderboardItems = leaderboardElement.querySelectorAll('.leaderboard-item');
        leaderboardItems.forEach(item => {
            item.addEventListener('click', () => {
                const userIdentifier = item.dataset.userIdentifier;
                const userName = item.dataset.userName;
                if (userIdentifier && userName) {
                    this.showPlayerStats(userIdentifier, userName);
                }
            });
        });
    }
    
    updatePopularActivitiesDisplay(popularActivities) {
        const popularElement = document.getElementById('popular-activities');
        if (!popularElement) return;
        
        if (!popularActivities || popularActivities.length === 0) {
            popularElement.innerHTML = '<p class="text-muted">No activities yet</p>';
            return;
        }
        
        // Get activity names and categories
        const enrichedActivities = popularActivities.map(item => {
            // Find the activity definition
            let activityDef = null;
            let categoryEmoji = '📌';
            
            // Search through all activity categories
            for (const category of ['consumables', 'competitions', 'tasks', 'randomTasks', 'penalties', 'bonuses']) {
                if (ACTIVITIES[category]) {
                    const found = ACTIVITIES[category].find(a => a.id === item.activityId);
                    if (found) {
                        activityDef = found;
                        // Set category emoji
                        switch(category) {
                            case 'consumables':
                                categoryEmoji = activityDef.category === 'drink' ? '🍺' : '🍔';
                                break;
                            case 'competitions':
                                categoryEmoji = '🏆';
                                break;
                            case 'tasks':
                                categoryEmoji = '⛷️';
                                break;
                            case 'randomTasks':
                                categoryEmoji = '🎲';
                                break;
                            case 'penalties':
                                categoryEmoji = '⚠️';
                                break;
                            case 'bonuses':
                                categoryEmoji = '🌟';
                                break;
                        }
                        break;
                    }
                }
            }
            
            return {
                ...item,
                name: activityDef ? activityDef.name : item.activityId,
                emoji: categoryEmoji
            };
        });
        
        // Build HTML
        let html = '<div class="list-group list-group-flush">';
        enrichedActivities.forEach((activity, index) => {
            const badgeColor = index < 3 ? 'bg-danger' : index < 6 ? 'bg-warning' : 'bg-secondary';
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center py-2">
                    <div>
                        <span class="me-2">${activity.emoji}</span>
                        <span>${activity.name}</span>
                    </div>
                    <span class="badge ${badgeColor} rounded-pill">${activity.count}</span>
                </div>`;
        });
        html += '</div>';
        
        popularElement.innerHTML = html;
    }

    showRegistration() {
        this.currentScreen = 'registration';
        this.updateDisplay();
    }

    async showDashboard() {
        this.currentScreen = 'dashboard';
        this.updateDisplay();
        this.updateUserInfo();
        this.updateScores();
        
        // Load and display popular activities
        if (this.firebaseService) {
            try {
                const popularActivities = await this.firebaseService.getMostPopularActivities();
                this.updatePopularActivitiesDisplay(popularActivities);
            } catch (error) {
                console.error('Error loading popular activities:', error);
                this.updatePopularActivitiesDisplay([]);
            }
        } else if (window.scoringEngine) {
            // Local mode - get popular activities from scoring engine
            const popularActivities = window.scoringEngine.getMostPopularActivities();
            this.updatePopularActivitiesDisplay(popularActivities);
        }
        
        // Load and display achievements
        if (this.achievementManager && this.currentUser) {
            const userId = this.currentUser.sanitizedName || this.currentUser.uid;
            const userName = this.currentUser.name;
            const achievements = await this.achievementManager.getUserAchievements(userId, userName);
            this.achievementManager.updateAchievementDisplay(achievements);
        }
    }

    showActivityLogger() {
        // Ensure Bootstrap is loaded before creating modal
        if (typeof bootstrap === 'undefined') {
            alert('Application is still loading. Please try again in a moment.');
            return;
        }
        
        // Show the activity modal
        const modalElement = document.getElementById('activityModal');
        if (!modalElement) {
            console.error('Activity modal not found in DOM');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Reset the modal
        this.resetActivityModal();
        
        // Initialize search functionality
        this.initializeActivitySearch();
        
        // Populate user lists for witnesses
        this.populateWitnessList();
    }
    
    resetActivityModal() {
        document.getElementById('activity-search').value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('selected-activity').classList.add('d-none');
        document.getElementById('log-activity-submit').disabled = true;
        this.selectedActivity = null;
        
        // Reset metadata fields
        const locationSelect = document.getElementById('activity-location');
        if (locationSelect) locationSelect.value = '';
        
        const notesInput = document.getElementById('activity-notes');
        if (notesInput) notesInput.value = '';
        
        const photoCheck = document.getElementById('has-photo');
        if (photoCheck) photoCheck.checked = false;
        
        // Uncheck all witnesses, opponents, team members
        document.querySelectorAll('.witness-check, .opponent-check, .team-member-check').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Collapse the metadata accordion
        const metadataCollapse = document.getElementById('metadataFields');
        if (metadataCollapse) {
            const bsCollapse = bootstrap.Collapse.getInstance(metadataCollapse);
            if (bsCollapse) bsCollapse.hide();
        }
    }
    
    initializeActivitySearch() {
        const searchInput = document.getElementById('activity-search');
        const searchResults = document.getElementById('search-results');
        
        // Remove existing listeners
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        // Add debounced search listener
        let searchTimeout;
        newSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
    }
    
    performSearch(query) {
        const searchResults = document.getElementById('search-results');
        
        if (!query || query.length < 2) {
            searchResults.innerHTML = '<p class="text-muted">Type at least 2 characters to search...</p>';
            return;
        }
        
        // Search all activities
        const results = ActivityHelper.searchActivities(query);
        
        if (results.length === 0) {
            searchResults.innerHTML = '<p class="text-muted">No activities found</p>';
            return;
        }
        
        // Group results by category
        const grouped = {};
        results.forEach(activity => {
            const category = activity.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(activity);
        });
        
        // Display results
        let html = '';
        Object.entries(grouped).forEach(([category, activities]) => {
            html += `<div class="mb-3">
                <h6 class="text-muted">${category}</h6>`;
            activities.forEach(activity => {
                const points = activity.basePoints || activity.winPoints || 
                               (activity.winPoints ? `Win: ${activity.winPoints}, Loss: ${activity.lossPoints}` : '0');
                const isCompleted = activity.oneTimeOnly && window.scoringEngine && window.scoringEngine.isTaskCompleted(activity.id);
                const clickHandler = isCompleted ? '' : `onclick="ironTurtleApp.selectActivity('${activity.id.replace(/'/g, "\\'")}')"`;
                const completedClass = isCompleted ? 'disabled opacity-50' : '';
                const completedBadge = isCompleted ? '<span class="badge bg-success ms-2">✓ Completed</span>' : '';
                
                html += `
                    <div class="list-group-item list-group-item-action ${completedClass}" ${clickHandler}>
                        <div class="d-flex justify-content-between">
                            <span>${activity.name}${completedBadge}</span>
                            <span class="badge bg-primary">${points} pts</span>
                        </div>
                    </div>`;
            });
            html += '</div>';
        });
        
        searchResults.innerHTML = html;
    }
    
    selectActivity(activityId) {
        this.selectedActivity = ActivityHelper.getActivityById(activityId);
        
        if (!this.selectedActivity) {
            console.error('Activity not found:', activityId);
            alert('Activity not found. Please try selecting again.');
            return;
        }
        
        // Check if this is a completed one-time task
        if (this.selectedActivity.oneTimeOnly && window.scoringEngine && window.scoringEngine.isTaskCompleted(activityId)) {
            alert('This task has already been completed and cannot be logged again.');
            return;
        }
        
        // Show selected activity details
        document.getElementById('selected-activity').classList.remove('d-none');
        document.getElementById('selected-activity-name').textContent = this.selectedActivity.name;
        
        // Show base points
        const basePoints = this.selectedActivity.basePoints || 
                          this.selectedActivity.winPoints || 0;
        document.getElementById('selected-activity-points').textContent = basePoints;
        
        // Show/hide relevant sections based on activity type
        this.configureActivityForm();
        
        // Enable submit button
        document.getElementById('log-activity-submit').disabled = false;
        
        // Calculate initial points
        this.calculatePointsPreview();
    }
    
    configureActivityForm() {
        const activity = this.selectedActivity;
        
        // Reset all sections
        document.getElementById('quantity-section').classList.add('d-none');
        document.getElementById('competition-result').classList.add('d-none');
        document.getElementById('penalty-caught').classList.add('d-none');
        document.getElementById('song-risk').classList.add('d-none');
        
        // Reset competition metadata
        const competitionMetadata = document.getElementById('competition-metadata');
        if (competitionMetadata) {
            competitionMetadata.classList.add('d-none');
        }
        
        // Show quantity for consumables and random tasks
        if (activity.category === 'drink' || activity.category === 'food' || 
            activity.category === 'random' || !activity.oneTimeOnly) {
            document.getElementById('quantity-section').classList.remove('d-none');
            document.getElementById('activity-quantity').value = 1;
        }
        
        // Show competition result selector and metadata fields
        if (activity.category === 'competition') {
            document.getElementById('competition-result').classList.remove('d-none');
            if (competitionMetadata) {
                competitionMetadata.classList.remove('d-none');
                this.populateOpponentsList();
                this.populateTeamMembersList();
            }
        }
        
        // Show penalty caught checkbox
        if (activity.category === 'penalty') {
            document.getElementById('penalty-caught').classList.remove('d-none');
            document.getElementById('caught-by-other').checked = false;
        }
        
        // Show song risk selector for aux song activity
        if (activity.hasRiskPenalty && activity.id === 'cue_song') {
            document.getElementById('song-risk').classList.remove('d-none');
            document.getElementById('song-played').checked = true;
        }
        
        // Setup multipliers
        this.setupMultipliers();
        
        // Add event listeners for preview calculation
        this.addPreviewListeners();
    }
    
    setupMultipliers() {
        const multipliersDiv = document.getElementById('multipliers-list');
        const activity = this.selectedActivity;
        
        // Get applicable multipliers
        const applicableMultipliers = ActivityHelper.getApplicableMultipliers(activity);
        
        if (applicableMultipliers.length === 0 || activity.category === 'penalty') {
            multipliersDiv.innerHTML = '<p class="text-muted">No multipliers apply to this activity</p>';
            return;
        }
        
        // Create checkboxes for each applicable multiplier
        let html = '';
        applicableMultipliers.forEach(multiplier => {
            html += `
                <div class="form-check">
                    <input class="form-check-input multiplier-check" type="checkbox" 
                           id="mult-${multiplier.id}" value="${multiplier.id}"
                           onchange="ironTurtleApp.calculatePointsPreview()">
                    <label class="form-check-label" for="mult-${multiplier.id}">
                        ${multiplier.name} (x${multiplier.factor}) - ${multiplier.description}
                    </label>
                </div>`;
        });
        
        multipliersDiv.innerHTML = html;
    }
    
    addPreviewListeners() {
        // Quantity change
        const quantityInput = document.getElementById('activity-quantity');
        if (quantityInput) {
            quantityInput.addEventListener('change', () => this.calculatePointsPreview());
        }
        
        // Competition result change
        const compRadios = document.querySelectorAll('input[name="comp-result"]');
        compRadios.forEach(radio => {
            radio.addEventListener('change', () => this.calculatePointsPreview());
        });
        
        // Penalty caught change
        const caughtCheck = document.getElementById('caught-by-other');
        if (caughtCheck) {
            caughtCheck.addEventListener('change', () => this.calculatePointsPreview());
        }
        
        // Song outcome change
        const songRadios = document.querySelectorAll('input[name="song-outcome"]');
        songRadios.forEach(radio => {
            radio.addEventListener('change', () => this.calculatePointsPreview());
        });
    }
    
    calculatePointsPreview() {
        if (!this.selectedActivity) return;
        
        const activity = this.selectedActivity;
        
        // Get selected multipliers
        const selectedMultipliers = [];
        document.querySelectorAll('.multiplier-check:checked').forEach(checkbox => {
            selectedMultipliers.push(checkbox.value);
        });
        
        // Get quantity
        const quantity = parseInt(document.getElementById('activity-quantity')?.value || 1);
        
        // Prepare options for calculation
        const options = {};
        
        // Handle competition result
        if (activity.category === 'competition') {
            const result = document.querySelector('input[name="comp-result"]:checked');
            options.competitionResult = result ? result.value : 'loss';
        }
        
        // Handle penalty caught
        if (activity.category === 'penalty') {
            options.penaltyCaught = document.getElementById('caught-by-other')?.checked || false;
        }
        
        // Handle song outcome
        if (activity.id === 'cue_song' && activity.hasRiskPenalty) {
            const songOutcome = document.querySelector('input[name="song-outcome"]:checked');
            options.songOutcome = songOutcome ? songOutcome.value : 'played';
        }
        
        // Use DataUtils for validated calculation
        const totalPoints = window.DataUtils ? 
            window.DataUtils.calculatePoints(activity, selectedMultipliers, quantity, options) :
            0;
        
        // Update preview
        document.getElementById('points-preview').textContent = totalPoints;
    }
    
    async submitActivity() {
        if (!this.selectedActivity || !this.currentUser) return;
        
        try {
            const activity = this.selectedActivity;
            
            // Get selected multipliers
            const selectedMultipliers = [];
            document.querySelectorAll('.multiplier-check:checked').forEach(checkbox => {
                selectedMultipliers.push(checkbox.value);
            });
            
            // Get quantity
            const quantity = parseInt(document.getElementById('activity-quantity')?.value || 1);
            
            // Get competition result if applicable
            let competitionResult = null;
            if (activity.category === 'competition') {
                competitionResult = document.querySelector('input[name="comp-result"]:checked').value;
            }
            
            // Get penalty caught status
            let penaltyCaught = false;
            if (activity.category === 'penalty') {
                penaltyCaught = document.getElementById('caught-by-other').checked;
            }
            
            // Get song outcome if applicable
            let songOutcome = null;
            if (activity.id === 'cue_song' && activity.hasRiskPenalty) {
                const songRadio = document.querySelector('input[name="song-outcome"]:checked');
                songOutcome = songRadio ? songRadio.value : 'played';
            }
            
            // Use DataUtils for validated points calculation
            const calculationOptions = {
                competitionResult: competitionResult,
                penaltyCaught: penaltyCaught,
                songOutcome: songOutcome
            };
            
            const finalPoints = window.DataUtils ? 
                window.DataUtils.calculatePoints(activity, selectedMultipliers, quantity, calculationOptions) :
                0;
                
            // Validate points before submission
            if (!isFinite(finalPoints) || isNaN(finalPoints)) {
                throw new Error('Invalid points calculation. Please try again.');
            }
            
            // Calculate base points for storage
            let basePoints = activity.basePoints || 0;
            if (activity.id === 'cue_song' && songOutcome === 'skipped') {
                basePoints = -5;
            } else if (activity.category === 'competition') {
                basePoints = competitionResult === 'win' ? activity.winPoints : activity.lossPoints;
            }
            if (penaltyCaught) {
                basePoints *= 2;
            }
            
            // Create standardized activity data structure
            const activityData = {
                id: Date.now(),
                userId: this.currentUser.uid,
                userName: this.currentUser.name,
                userSanitizedName: this.currentUser.sanitizedName,
                activityId: activity.id,
                activityName: activity.name,
                category: activity.category,
                basePoints: basePoints,
                multipliers: selectedMultipliers,
                quantity: quantity,
                competitionResult: competitionResult,
                penaltyCaught: penaltyCaught,
                songOutcome: songOutcome,
                points: finalPoints,
                timestamp: Date.now(),
                
                // Metadata collection
                metadata: {
                    // Time metadata
                    submittedAt: new Date().toISOString(),
                    dayOfWeek: new Date().getDay(),
                    hourOfDay: new Date().getHours(),
                    timeOfDay: this.getTimeOfDay(),
                    
                    // Session metadata
                    sessionDuration: this.currentUser.loginTime ? 
                        Date.now() - this.currentUser.loginTime : 0,
                    activityNumber: window.scoringEngine ? 
                        window.scoringEngine.getUserActivities(this.currentUser.name).length + 1 : 1,
                    timeSinceLastActivity: this.getTimeSinceLastActivity(),
                    streak: this.calculateCurrentStreak(),
                    isFirstOfType: this.checkIfFirstOfType(activity.id),
                    
                    // Device metadata
                    deviceType: this.detectDeviceType(),
                    screenWidth: window.innerWidth,
                    screenHeight: window.innerHeight,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    
                    // Optional user-provided fields
                    location: document.getElementById('activity-location')?.value || null,
                    witnesses: this.getSelectedWitnesses(),
                    notes: document.getElementById('activity-notes')?.value || null,
                    hasPhoto: document.getElementById('has-photo')?.checked || false,
                    
                    // Competition specific
                    opponents: activity.category === 'competition' ? this.getSelectedOpponents() : null,
                    teamMembers: activity.category === 'competition' ? this.getSelectedTeamMembers() : null,
                }
            };
            
            // Standardize the data structure
            const standardizedActivity = window.DataUtils ? 
                window.DataUtils.standardizeActivityData(activityData) : 
                activityData;
            
            // Save to Firebase if available, otherwise localStorage
            if (this.firebaseService && this.currentUser && this.currentUser.sanitizedName) {
                try {
                    // First ensure user document exists (outside transaction to avoid conflicts)
                    const userRef = this.firebaseService.db.collection('users').doc(this.currentUser.sanitizedName);
                    const userDoc = await userRef.get();
                    
                    if (!userDoc.exists) {
                        // Create user document first (not in transaction)
                        await userRef.set({
                            name: this.currentUser.name,
                            sanitizedName: this.currentUser.sanitizedName,
                            totalScore: 0,
                            lastActivity: Date.now(),
                            completedTasks: {},
                            createdAt: Date.now()
                        });
                    }
                    
                    // Now use transaction for atomic activity addition and score update
                    await this.firebaseService.db.runTransaction(async (transaction) => {
                        // Re-read user data within transaction
                        const userDocInTx = await transaction.get(userRef);
                        
                        // Prepare activity for Firebase
                        const firebaseActivity = {
                            ...standardizedActivity,
                            timestamp: Date.now()
                        };
                        
                        // Add activity to activities collection
                        const activityRef = this.firebaseService.db.collection('activities').doc();
                        transaction.set(activityRef, firebaseActivity);
                        
                        // Update user document
                        const updates = {
                            totalScore: firebase.firestore.FieldValue.increment(finalPoints),
                            lastActivity: Date.now()
                        };
                        
                        // Mark one-time task as completed
                        if (activity.oneTimeOnly) {
                            updates[`completedTasks.${activity.id}`] = true;
                        }
                        
                        transaction.update(userRef, updates);
                    });
                    
                    console.log('Activity saved to Firebase with transaction');
                } catch (error) {
                    console.error('Firebase save failed, falling back to localStorage:', error);
                    // Fall back to localStorage with standardized data
                    window.scoringEngine.activities.push(standardizedActivity);
                    window.scoringEngine.saveActivities();
                    if (activity.oneTimeOnly) {
                        window.scoringEngine.markTaskCompleted(activity.id);
                    }
                }
            } else {
                // Fallback to localStorage with standardized data
                window.scoringEngine.activities.push(standardizedActivity);
                window.scoringEngine.saveActivities();
                
                if (activity.oneTimeOnly) {
                    window.scoringEngine.markTaskCompleted(activity.id);
                }
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('activityModal'));
            modal.hide();
            
            // Update scores
            this.updateScores();
            
            // Check for new achievements
            if (this.achievementManager && this.currentUser) {
                const userId = this.currentUser.sanitizedName || this.currentUser.uid;
                const userName = this.currentUser.name;
                await this.achievementManager.checkAchievements(userId, userName);
            }
            
            // Show success message
            this.showSuccessMessage('Activity logged successfully!');
            
        } catch (error) {
            console.error('Error submitting activity:', error);
            alert('Failed to log activity: ' + error.message);
        }
    }
    
    showSuccessMessage(message) {
        // Create a temporary alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
    
    async showActivityHistory() {
        // Ensure Bootstrap is loaded
        if (typeof bootstrap === 'undefined') {
            alert('Application is still loading. Please try again in a moment.');
            return;
        }
        
        const modalElement = document.getElementById('historyModal');
        if (!modalElement) {
            console.error('History modal not found in DOM');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        const historyContent = document.getElementById('history-content');
        const totalScoreElement = document.getElementById('history-total-score');
        const clearAllBtn = document.getElementById('clear-all-activities');
        
        if (!this.currentUser) {
            historyContent.innerHTML = '<p class="text-muted">No activities logged yet</p>';
            totalScoreElement.textContent = '0';
            clearAllBtn.style.display = 'none';
            modal.show();
            return;
        }
        
        let userActivities = [];
        
        // Try to get activities from Firebase first
        if (this.firebaseService && this.currentUser.sanitizedName) {
            try {
                const snapshot = await this.firebaseService.db.collection('activities')
                    .where('userSanitizedName', '==', this.currentUser.sanitizedName)
                    .orderBy('timestamp', 'desc')
                    .get();
                
                userActivities = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // Standardize ID field usage - always use 'id'
                    userActivities.push({
                        id: doc.id,  // Use Firebase document ID as the primary ID
                        firebaseId: doc.id,  // Keep for compatibility
                        ...data,
                        timestamp: data.timestamp || Date.now()
                    });
                });
            } catch (error) {
                console.error('Error fetching activities from Firebase:', error);
                // Fall back to localStorage
                if (window.scoringEngine) {
                    userActivities = window.scoringEngine.getUserActivities(this.currentUser.name);
                }
            }
        } else if (window.scoringEngine) {
            // Use localStorage as fallback
            userActivities = window.scoringEngine.getUserActivities(this.currentUser.name);
        }
        
        if (userActivities.length === 0) {
            historyContent.innerHTML = '<p class="text-muted">No activities logged yet</p>';
            totalScoreElement.textContent = '0';
            clearAllBtn.style.display = 'none';
            modal.show();
            return;
        }
        
        // Show clear all button when there are activities
        clearAllBtn.style.display = 'inline-block';
        
        // Sort by timestamp (most recent first)
        userActivities.sort((a, b) => b.timestamp - a.timestamp);
        
        // Build the table
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Activity</th>
                        <th>Category</th>
                        <th>Points</th>
                        <th>Details</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>`;
        
        let totalScore = 0;
        userActivities.forEach(activity => {
            const timestamp = new Date(activity.timestamp).toLocaleString();
            const pointsClass = activity.points >= 0 ? 'text-success' : 'text-danger';
            const pointsSign = activity.points >= 0 ? '+' : '';
            
            // Build details string
            let details = [];
            if (activity.quantity > 1) {
                details.push(`Qty: ${activity.quantity}`);
            }
            if (activity.competitionResult) {
                details.push(`Result: ${activity.competitionResult}`);
            }
            if (activity.songOutcome === 'skipped') {
                details.push('Song skipped');
            }
            if (activity.penaltyCaught) {
                details.push('Caught by other');
            }
            if (activity.multipliers && activity.multipliers.length > 0) {
                const multiplierNames = activity.multipliers.map(m => {
                    const mult = window.MULTIPLIERS.find(mul => mul.id === m);
                    return mult ? mult.name : m;
                }).join(', ');
                details.push(`Multipliers: ${multiplierNames}`);
            }
            
            totalScore += activity.points;
            
            html += `
                <tr>
                    <td class="small">${timestamp}</td>
                    <td>${activity.activityName}</td>
                    <td><span class="badge bg-secondary">${activity.category}</span></td>
                    <td class="${pointsClass} fw-bold">${pointsSign}${activity.points}</td>
                    <td class="small">${details.join(' | ') || '-'}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="ironTurtleApp.deleteActivity('${activity.firebaseId || activity.id}')">
                            🗑️
                        </button>
                    </td>
                </tr>`;
        });
        
        html += '</tbody></table>';
        
        historyContent.innerHTML = html;
        totalScoreElement.textContent = totalScore;
        totalScoreElement.className = totalScore >= 0 ? 'text-success' : 'text-danger';
        
        modal.show();
    }

    updateDisplay() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.add('d-none');
        });

        const currentScreenElement = document.getElementById(`${this.currentScreen}-screen`);
        if (currentScreenElement) {
            currentScreenElement.classList.remove('d-none');
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userInfoElement = document.getElementById('user-info');
            userInfoElement.textContent = `Welcome, ${this.currentUser.name}!`;
        }
    }

    async getUserActivitiesWithIds() {
        let userActivities = [];
        
        // Try to get activities from Firebase first
        if (this.firebaseService && this.currentUser && this.currentUser.sanitizedName) {
            try {
                const snapshot = await this.firebaseService.db.collection('activities')
                    .where('userSanitizedName', '==', this.currentUser.sanitizedName)
                    .get();
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    userActivities.push({
                        id: data.id || doc.id,
                        firebaseId: doc.id,
                        ...data
                    });
                });
            } catch (error) {
                console.error('Error fetching activities:', error);
                // Fall back to localStorage
                if (window.scoringEngine) {
                    userActivities = window.scoringEngine.getUserActivities(this.currentUser.name);
                }
            }
        } else if (window.scoringEngine) {
            // Use localStorage as fallback
            userActivities = window.scoringEngine.getUserActivities(this.currentUser.name);
        }
        
        return userActivities;
    }
    
    async deleteActivity(activityId) {
        if (confirm('Are you sure you want to delete this activity?')) {
            try {
                let deletedSuccessfully = false;
                let activityToDelete = null;
                
                // If Firebase is available, delete from Firebase
                if (this.firebaseService && this.currentUser && this.currentUser.sanitizedName) {
                    // First, we need to find the activity details
                    // Activities are stored with consistent ID field
                    const userActivities = await this.getUserActivitiesWithIds();
                    activityToDelete = userActivities.find(a => 
                        a.firebaseId === activityId || a.id === activityId
                    );
                    
                    if (activityToDelete && activityToDelete.firebaseId) {
                        // Check if it's a one-time task
                        const activityDef = window.scoringEngine ? 
                            window.scoringEngine.findActivityById(activityToDelete.activityId) : null;
                        const isOneTimeTask = activityDef && activityDef.oneTimeOnly;
                        
                        // Delete from Firebase
                        await this.firebaseService.deleteActivity(
                            activityToDelete.firebaseId,
                            this.currentUser.name,
                            activityToDelete.points,
                            activityToDelete.activityId,
                            isOneTimeTask
                        );
                        deletedSuccessfully = true;
                    }
                }
                
                // Also delete from localStorage (for consistency)
                if (window.scoringEngine && activityToDelete) {
                    // Use the local storage ID if available
                    window.scoringEngine.removeActivity(activityToDelete.id || activityId);
                    if (!deletedSuccessfully) {
                        deletedSuccessfully = true;
                    }
                }
                
                // Refresh the history modal
                this.showActivityHistory();
                
                // Update scores on the dashboard
                this.updateScores();
                
                // Show success message
                this.showSuccessMessage('Activity deleted successfully');
                
            } catch (error) {
                console.error('Error deleting activity:', error);
                alert('Failed to delete activity: ' + error.message);
            }
        }
    }
    
    async clearAllActivities() {
        if (!this.currentUser) return;
        
        try {
            // Get activities count
            const userActivities = await this.getUserActivitiesWithIds();
            const activitiesCount = userActivities.length;
            
            if (activitiesCount === 0) {
                alert('No activities to clear');
                return;
            }
            
            const confirmMessage = `Are you sure you want to delete ALL ${activitiesCount} activities? This action cannot be undone.`;
            
            if (confirm(confirmMessage)) {
                // Double confirmation for safety
                if (confirm('This will permanently delete all your activities and reset your score to 0. Are you absolutely sure?')) {
                    // Clear from Firebase if available
                    if (this.firebaseService && this.currentUser.sanitizedName) {
                        try {
                            // Get all activities for this user
                            const snapshot = await this.firebaseService.db.collection('activities')
                                .where('userSanitizedName', '==', this.currentUser.sanitizedName)
                                .get();
                            
                            // Split into chunks of 500 (Firestore batch limit)
                            const BATCH_SIZE = 500;
                            const docRefs = [];
                            snapshot.forEach((doc) => {
                                docRefs.push(doc.ref);
                            });
                            
                            // Process deletion in batches
                            for (let i = 0; i < docRefs.length; i += BATCH_SIZE) {
                                const batch = this.firebaseService.db.batch();
                                const chunk = docRefs.slice(i, i + BATCH_SIZE);
                                
                                chunk.forEach((docRef) => {
                                    batch.delete(docRef);
                                });
                                
                                // Execute this batch
                                await batch.commit();
                                console.log(`Deleted batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(docRefs.length/BATCH_SIZE)}`);
                            }
                            
                            // Reset user's score and completed tasks
                            const userRef = this.firebaseService.db.collection('users')
                                .doc(this.currentUser.sanitizedName);
                            await userRef.update({
                                totalScore: 0,
                                completedTasks: {}
                            });
                            
                            console.log('All activities cleared from Firebase');
                        } catch (error) {
                            console.error('Error clearing activities from Firebase:', error);
                        }
                    }
                    
                    // Also clear from localStorage
                    if (window.scoringEngine) {
                        window.scoringEngine.clearAllUserActivities(this.currentUser.name);
                    }
                    
                    // Refresh the history modal
                    this.showActivityHistory();
                    
                    // Update scores on the dashboard
                    this.updateScores();
                    
                    // Show success message
                    this.showSuccessMessage('All activities cleared successfully');
                }
            }
        } catch (error) {
            console.error('Error clearing activities:', error);
            alert('Failed to clear activities: ' + error.message);
        }
    }
    
    showReferenceChart() {
        // Ensure Bootstrap is loaded
        if (typeof bootstrap === 'undefined') {
            alert('Application is still loading. Please try again in a moment.');
            return;
        }
        
        const modalElement = document.getElementById('referenceModal');
        if (!modalElement) {
            console.error('Reference modal not found in DOM');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        
        // Generate content for each category
        this.generateDrinksContent();
        this.generateFoodContent();
        this.generateCompetitionsContent();
        this.generateTasksContent();
        this.generateRandomContent();
        this.generateBonusesContent();
        this.generatePenaltiesContent();
        this.generateMultipliersContent();
        this.generateRulesContent();
        
        modal.show();
    }
    
    generateDrinksContent() {
        const container = document.getElementById('drinks-content');
        const drinks = ACTIVITIES.consumables.filter(item => item.category === 'drink');
        
        let html = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Activity</th>
                            <th>Base Points</th>
                            <th>Multipliers Apply</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        drinks.forEach(drink => {
            html += `
                <tr>
                    <td>${drink.name}</td>
                    <td><span class="badge bg-primary">${drink.basePoints}</span></td>
                    <td>✅ All consumable multipliers</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>`;
        
        container.innerHTML = html;
    }
    
    generateFoodContent() {
        const container = document.getElementById('food-content');
        const food = ACTIVITIES.consumables.filter(item => item.category === 'food');
        
        let html = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Activity</th>
                            <th>Base Points</th>
                            <th>Multipliers Apply</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        food.forEach(item => {
            html += `
                <tr>
                    <td>${item.name}</td>
                    <td><span class="badge bg-primary">${item.basePoints}</span></td>
                    <td>✅ All consumable multipliers</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>`;
        
        container.innerHTML = html;
    }
    
    generateCompetitionsContent() {
        const container = document.getElementById('competitions-content');
        const competitions = ACTIVITIES.competitions;
        
        let html = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Competition</th>
                            <th>Win Points</th>
                            <th>Loss Points</th>
                            <th>Multipliers Apply</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        competitions.forEach(comp => {
            html += `
                <tr>
                    <td>${comp.name}</td>
                    <td><span class="badge bg-success">${comp.winPoints}</span></td>
                    <td><span class="badge bg-warning">${comp.lossPoints}</span></td>
                    <td>✅ Activity multipliers</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>`;
        
        container.innerHTML = html;
    }
    
    generateTasksContent() {
        const container = document.getElementById('tasks-content');
        const tasks = ACTIVITIES.tasks;
        
        // Group tasks by subcategory
        const individualSports = tasks.filter(t => t.id.includes('cliff_jump') || t.id.includes('hike') || 
                                                   t.id.includes('paddleboard') || t.id.includes('swim') || 
                                                   t.id.includes('bb_gun'));
        const boatSports = tasks.filter(t => t.id.includes('waterski') || t.id.includes('kneeboard') || 
                                             t.id.includes('wakeboard') || t.id.includes('wakesurf') || 
                                             t.id.includes('innertube'));
        
        let html = `
            <h6>Individual Sports (One Time Only)</h6>
            <div class="table-responsive mb-4">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Points</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        individualSports.forEach(task => {
            const isCompleted = window.scoringEngine && window.scoringEngine.isTaskCompleted(task.id);
            html += `
                <tr class="${isCompleted ? 'text-muted' : ''}">
                    <td>${task.name}</td>
                    <td><span class="badge bg-primary">${task.basePoints}</span></td>
                    <td>${isCompleted ? '✅ Completed' : '⭕ Available'}</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <h6>Boat Sports (One Time Only)</h6>
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Points</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        boatSports.forEach(task => {
            const isCompleted = window.scoringEngine && window.scoringEngine.isTaskCompleted(task.id);
            html += `
                <tr class="${isCompleted ? 'text-muted' : ''}">
                    <td>${task.name}</td>
                    <td><span class="badge bg-primary">${task.basePoints}</span></td>
                    <td>${isCompleted ? '✅ Completed' : '⭕ Available'}</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>`;
        
        container.innerHTML = html;
    }
    
    generateRandomContent() {
        const container = document.getElementById('random-content');
        const randomTasks = ACTIVITIES.randomTasks;
        
        let html = `
            <div class="alert alert-info">
                <strong>Note:</strong> These tasks can be completed unlimited times!
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Points</th>
                            <th>Special Notes</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        randomTasks.forEach(task => {
            let specialNote = '';
            if (task.hasRiskPenalty) {
                specialNote = '⚠️ Risk: -5 if song skipped';
            } else if (task.basePoints >= 100) {
                specialNote = '🔥 MEGA POINTS!';
            }
            
            html += `
                <tr>
                    <td>${task.name}</td>
                    <td><span class="badge bg-primary">${task.basePoints}</span></td>
                    <td>${specialNote}</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>`;
        
        container.innerHTML = html;
    }
    
    generateBonusesContent() {
        const container = document.getElementById('bonuses-content');
        const bonuses = ACTIVITIES.bonuses || [];
        
        let html = `
            <div class="alert alert-success">
                <strong>Bonus Points:</strong> Special achievements and arbitrary awards!
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Bonus</th>
                            <th>Points</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        bonuses.forEach(bonus => {
            html += `
                <tr>
                    <td>${bonus.name}</td>
                    <td><span class="badge bg-success">${bonus.basePoints || 'Variable'}</span></td>
                    <td>${bonus.description || ''}</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>`;
        
        container.innerHTML = html;
    }
    
    generatePenaltiesContent() {
        const container = document.getElementById('penalties-content');
        const penalties = ACTIVITIES.penalties;
        
        let html = `
            <div class="alert alert-danger">
                <strong>Warning:</strong> Penalties are negative points! If caught by another player, penalty doubles!
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Penalty</th>
                            <th>Points</th>
                            <th>If Caught</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        penalties.forEach(penalty => {
            const doubledPoints = penalty.basePoints * 2;
            let note = '';
            if (penalty.special === 'negate_activity') {
                note = 'Negates attempted activity points';
            } else if (penalty.basePoints <= -100) {
                note = '💀 SEVERE PENALTY';
            }
            
            html += `
                <tr>
                    <td>${penalty.name}</td>
                    <td><span class="badge bg-danger">${penalty.basePoints}</span></td>
                    <td><span class="badge bg-danger">${doubledPoints}</span></td>
                    <td>${note}</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>`;
        
        container.innerHTML = html;
    }
    
    generateMultipliersContent() {
        const container = document.getElementById('multipliers-content');
        
        let html = `
            <div class="alert alert-success">
                <strong>Pro Tip:</strong> Multipliers stack! Combine multiple multipliers for massive points!
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Multiplier</th>
                            <th>Factor</th>
                            <th>Applies To</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        window.MULTIPLIERS.forEach(mult => {
            let appliesTo = '';
            if (mult.appliesToConsumables && mult.appliesToOthers) {
                appliesTo = '✅ All Activities';
            } else if (mult.appliesToConsumables) {
                appliesTo = '🍺 Consumables Only';
            } else {
                appliesTo = '🎯 Non-consumables';
            }
            
            const factorClass = mult.factor >= 4 ? 'bg-danger' : mult.factor >= 3 ? 'bg-warning' : 'bg-success';
            
            html += `
                <tr>
                    <td><strong>${mult.name}</strong></td>
                    <td><span class="badge ${factorClass}">x${mult.factor}</span></td>
                    <td>${appliesTo}</td>
                    <td class="small">${mult.description}</td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4">
                <h6>Example Combinations:</h6>
                <ul>
                    <li>Beer (1 pt) + On Boat (x2) + USC Gear (x2) = <strong>4 points</strong></li>
                    <li>Shot (2 pts) + While Being Towed (x10) = <strong>20 points</strong></li>
                    <li>Wine (3 pts) + Turtle Rock Island (x4) + 2am-8am (x3) = <strong>36 points!</strong></li>
                </ul>
            </div>`;
        
        container.innerHTML = html;
    }
    
    generateRulesContent() {
        const container = document.getElementById('rules-content');
        
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0">🎯 Basic Rules</h6>
                        </div>
                        <div class="card-body">
                            <ul>
                                <li>Complete activities to earn points</li>
                                <li>Consumables can be logged multiple times</li>
                                <li>One-time tasks can only be completed once</li>
                                <li>Random tasks have unlimited completions</li>
                                <li>Multipliers stack multiplicatively</li>
                                <li>Penalties are negative points</li>
                                <li>Caught penalties are doubled</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-header bg-success text-white">
                            <h6 class="mb-0">💡 Strategy Tips</h6>
                        </div>
                        <div class="card-body">
                            <ul>
                                <li>Stack multipliers for maximum points</li>
                                <li>Complete high-value one-time tasks early</li>
                                <li>Turtle Rock Island (x4) is the best multiplier</li>
                                <li>Late night activities (2am-8am) get x3</li>
                                <li>Being towed while drinking = x10!</li>
                                <li>Avoid penalties - they can tank your score</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-warning">
                            <h6 class="mb-0">⚠️ Special Activities</h6>
                        </div>
                        <div class="card-body">
                            <ul>
                                <li><strong>Cue Song on Aux:</strong> +1 point, but -5 if skipped!</li>
                                <li><strong>Fix the Broken Flagpole:</strong> 1000 points!</li>
                                <li><strong>Cheating:</strong> Negates activity points</li>
                                <li><strong>Federal Offense (Kill Goose):</strong> -100 points</li>
                                <li><strong>Sink Boat:</strong> -1000 points (please don't)</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0">🏆 Competition Rules</h6>
                        </div>
                        <div class="card-body">
                            <ul>
                                <li>Wins = 30 points</li>
                                <li>Losses = 10 points (still worth playing!)</li>
                                <li>All competitions eligible for multipliers</li>
                                <li>Team games count for all participants</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header bg-dark text-white">
                            <h6 class="mb-0">📊 Scoring Summary</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Formula:</strong></p>
                            <code>Total = Base Points × Multiplier 1 × Multiplier 2 × ... × Quantity</code>
                            <p class="mt-2"><strong>Example:</strong></p>
                            <code>3 Beers on boat with USC gear = 1 × 2 × 2 × 3 = 12 points</code>
                        </div>
                    </div>
                </div>
            </div>`;
        
        container.innerHTML = html;
    }
    
    filterReferenceChart(searchTerm) {
        if (!searchTerm || searchTerm.length < 2) {
            // Reset all tabs to show full content
            this.showReferenceChart();
            return;
        }
        
        const term = searchTerm.toLowerCase();
        const allActivities = ActivityHelper.getAllActivities();
        const matchingActivities = allActivities.filter(activity => 
            activity.name.toLowerCase().includes(term)
        );
        
        // Update each tab to show only matching activities
        const tabs = ['drinks', 'food', 'competitions', 'tasks', 'random', 'penalties'];
        tabs.forEach(tab => {
            const container = document.getElementById(`${tab}-content`);
            const tabActivities = matchingActivities.filter(activity => {
                if (tab === 'drinks') return activity.category === 'drink';
                if (tab === 'food') return activity.category === 'food';
                if (tab === 'competitions') return activity.category === 'competition';
                if (tab === 'tasks') return activity.category === 'task';
                if (tab === 'random') return activity.category === 'random';
                if (tab === 'penalties') return activity.category === 'penalty';
                return false;
            });
            
            if (tabActivities.length === 0) {
                container.innerHTML = '<p class="text-muted">No matching activities found</p>';
            } else {
                // Regenerate content for this tab with filtered activities
                let html = '<div class="table-responsive"><table class="table table-striped"><thead><tr>';
                html += '<th>Activity</th><th>Points</th></tr></thead><tbody>';
                
                tabActivities.forEach(activity => {
                    const points = activity.basePoints || `Win: ${activity.winPoints}, Loss: ${activity.lossPoints}`;
                    html += `<tr><td>${activity.name}</td><td><span class="badge bg-primary">${points}</span></td></tr>`;
                });
                
                html += '</tbody></table></div>';
                container.innerHTML = html;
            }
        });
    }

    async showPlayerStats(userIdentifier, userName) {
        console.log('showPlayerStats called with:', { userIdentifier, userName });
        
        try {
            const modalElement = document.getElementById('playerStatsModal');
            if (!modalElement) {
                console.error('Player stats modal not found in DOM');
                alert('Stats modal not found. Please refresh the page.');
                return;
            }
            
            const modal = new bootstrap.Modal(modalElement);
            
            // Set player name in modal header
            const nameElement = document.getElementById('player-stats-name');
            if (nameElement) {
                nameElement.textContent = userName;
            }
            
            // Show loading state
            const categoryContainer = document.getElementById('category-breakdown');
            const topActivitiesContainer = document.getElementById('top-activities');
            const frequentContainer = document.getElementById('frequent-activities');
            const multiplierContainer = document.getElementById('multiplier-usage');
            const timelineContainer = document.getElementById('activity-timeline');
            
            if (categoryContainer) categoryContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            if (topActivitiesContainer) topActivitiesContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            if (frequentContainer) frequentContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            if (multiplierContainer) multiplierContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            if (timelineContainer) timelineContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            
            // Show modal immediately with loading state
            modal.show();
            
            // Fetch player activities
            let userActivities = [];
            
            if (this.firebaseService && userIdentifier) {
                try {
                    // Try Firebase first - removed orderBy to avoid composite index requirement
                    const snapshot = await this.firebaseService.db.collection('activities')
                        .where('userSanitizedName', '==', userIdentifier)
                        .get();
                    
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        userActivities.push({
                            id: doc.id,
                            ...data,
                            timestamp: data.timestamp ? 
                                (data.timestamp.toDate ? data.timestamp.toDate().getTime() : 
                                 (typeof data.timestamp === 'number' ? data.timestamp : Date.now())) : 
                                Date.now()
                        });
                    });
                    
                    // If no activities found by sanitizedName, try by userName
                    if (userActivities.length === 0) {
                        const nameSnapshot = await this.firebaseService.db.collection('activities')
                            .where('userName', '==', userName)
                            .get();
                        
                        nameSnapshot.forEach((doc) => {
                            const data = doc.data();
                            userActivities.push({
                                id: doc.id,
                                ...data,
                                timestamp: data.timestamp ? 
                                    (data.timestamp.toDate ? data.timestamp.toDate().getTime() : 
                                     (typeof data.timestamp === 'number' ? data.timestamp : Date.now())) : 
                                    Date.now()
                            });
                        });
                    }
                    
                    // Sort activities by timestamp in descending order (newest first)
                    userActivities.sort((a, b) => b.timestamp - a.timestamp);
                    
                } catch (error) {
                    console.error('Error fetching player activities from Firebase:', error);
                    
                    // Fall back to localStorage
                    if (window.scoringEngine) {
                        userActivities = window.scoringEngine.getUserActivities(userName);
                    }
                }
            } else if (window.scoringEngine) {
                // Use localStorage
                userActivities = window.scoringEngine.getUserActivities(userName);
            }
            
            // Ensure activities are sorted by timestamp
            userActivities.sort((a, b) => b.timestamp - a.timestamp);
            
            console.log('Found activities:', userActivities.length);
            
            // Calculate statistics
            const stats = this.calculatePlayerStatistics(userActivities);
            
            // Get leaderboard for rank calculation
            let rank = '-';
            if (this.firebaseService) {
                try {
                    const leaderboard = await this.firebaseService.getLeaderboard();
                    const userIndex = leaderboard.findIndex(u => 
                        u.id === userIdentifier || 
                        u.sanitizedName === userIdentifier || 
                        u.name === userName
                    );
                    if (userIndex >= 0) {
                        rank = `#${userIndex + 1}`;
                    }
                } catch (error) {
                    console.error('Error fetching rank:', error);
                }
            } else if (window.scoringEngine) {
                const leaderboard = window.scoringEngine.getLeaderboard();
                const userIndex = leaderboard.findIndex(u => u.userId === userName);
                if (userIndex >= 0) {
                    rank = `#${userIndex + 1}`;
                }
            }
            
            // Update modal with statistics
            this.displayPlayerStatistics(stats, rank, userActivities);
            
        } catch (error) {
            console.error('Error showing player stats:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                userIdentifier: userIdentifier,
                userName: userName,
                firebaseEnabled: !!this.firebaseService,
                firebaseConnected: this.firebaseService?.auth?.currentUser ? true : false
            });
            
            // Provide more specific error message
            let errorMessage = 'Failed to load player statistics. ';
            if (error.message.includes('Firebase') || error.message.includes('firestore')) {
                errorMessage += 'Database connection issue. Please check your internet connection.';
            } else if (error.message.includes('DOM') || error.message.includes('null')) {
                errorMessage += 'Page elements not loaded. Please refresh the page.';
            } else {
                errorMessage += `Error: ${error.message}`;
            }
            
            alert(errorMessage);
        }
    }
    
    calculatePlayerStatistics(activities) {
        const stats = {
            totalScore: 0,
            totalActivities: activities.length,
            avgPoints: 0,
            categoryBreakdown: {},
            topActivities: [],
            frequentActivities: {},
            multiplierUsage: {},
            timeline: []
        };
        
        // Process activities
        activities.forEach(activity => {
            // Total score
            stats.totalScore += activity.points || 0;
            
            // Category breakdown
            const category = activity.category || 'Other';
            if (!stats.categoryBreakdown[category]) {
                stats.categoryBreakdown[category] = {
                    points: 0,
                    count: 0
                };
            }
            stats.categoryBreakdown[category].points += activity.points || 0;
            stats.categoryBreakdown[category].count++;
            
            // Frequent activities
            const activityName = activity.activityName || 'Unknown';
            if (!stats.frequentActivities[activityName]) {
                stats.frequentActivities[activityName] = {
                    count: 0,
                    totalPoints: 0
                };
            }
            stats.frequentActivities[activityName].count++;
            stats.frequentActivities[activityName].totalPoints += activity.points || 0;
            
            // Multiplier usage
            if (activity.multipliers && activity.multipliers.length > 0) {
                activity.multipliers.forEach(multId => {
                    if (!stats.multiplierUsage[multId]) {
                        stats.multiplierUsage[multId] = 0;
                    }
                    stats.multiplierUsage[multId]++;
                });
            }
        });
        
        // Calculate average
        stats.avgPoints = stats.totalActivities > 0 ? 
            Math.round(stats.totalScore / stats.totalActivities) : 0;
        
        // Get top scoring activities (sorted by points)
        stats.topActivities = activities
            .filter(a => a.points > 0)
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);
        
        return stats;
    }
    
    displayPlayerStatistics(stats, rank, activities) {
        // Update summary cards
        document.getElementById('stats-total-score').textContent = stats.totalScore;
        document.getElementById('stats-total-activities').textContent = stats.totalActivities;
        document.getElementById('stats-avg-points').textContent = stats.avgPoints;
        document.getElementById('stats-rank').textContent = rank;
        
        // Category breakdown
        const categoryContainer = document.getElementById('category-breakdown');
        if (Object.keys(stats.categoryBreakdown).length > 0) {
            let categoryHtml = '';
            const sortedCategories = Object.entries(stats.categoryBreakdown)
                .sort((a, b) => b[1].points - a[1].points);
            
            sortedCategories.forEach(([category, data]) => {
                const percentage = stats.totalScore > 0 ? 
                    Math.round((data.points / stats.totalScore) * 100) : 0;
                const barColor = this.getCategoryColor(category);
                
                categoryHtml += `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span>${category} (${data.count} activities)</span>
                            <span class="fw-bold">${data.points} pts (${percentage}%)</span>
                        </div>
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar ${barColor}" role="progressbar" 
                                 style="width: ${percentage}%">
                                ${percentage}%
                            </div>
                        </div>
                    </div>`;
            });
            categoryContainer.innerHTML = categoryHtml;
        } else {
            categoryContainer.innerHTML = '<p class="text-muted">No activities yet</p>';
        }
        
        // Top scoring activities
        const topActivitiesContainer = document.getElementById('top-activities');
        if (stats.topActivities.length > 0) {
            let topHtml = '<ul class="list-group">';
            stats.topActivities.forEach(activity => {
                const date = new Date(activity.timestamp).toLocaleDateString();
                topHtml += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">${activity.activityName}</div>
                            <small class="text-muted">${date}</small>
                        </div>
                        <span class="badge bg-success rounded-pill">${activity.points} pts</span>
                    </li>`;
            });
            topHtml += '</ul>';
            topActivitiesContainer.innerHTML = topHtml;
        } else {
            topActivitiesContainer.innerHTML = '<p class="text-muted">No activities yet</p>';
        }
        
        // Most frequent activities
        const frequentContainer = document.getElementById('frequent-activities');
        const frequentSorted = Object.entries(stats.frequentActivities)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);
        
        if (frequentSorted.length > 0) {
            let frequentHtml = '<ul class="list-group">';
            frequentSorted.forEach(([name, data]) => {
                frequentHtml += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">${name}</div>
                            <small class="text-muted">${data.totalPoints} total pts</small>
                        </div>
                        <span class="badge bg-info rounded-pill">${data.count}x</span>
                    </li>`;
            });
            frequentHtml += '</ul>';
            frequentContainer.innerHTML = frequentHtml;
        } else {
            frequentContainer.innerHTML = '<p class="text-muted">No activities yet</p>';
        }
        
        // Multiplier usage
        const multiplierContainer = document.getElementById('multiplier-usage');
        if (Object.keys(stats.multiplierUsage).length > 0 && window.MULTIPLIERS) {
            let multiplierHtml = '<div class="row">';
            Object.entries(stats.multiplierUsage).forEach(([multId, count]) => {
                const multiplier = window.MULTIPLIERS.find(m => m.id === multId);
                if (multiplier) {
                    multiplierHtml += `
                        <div class="col-md-6 mb-2">
                            <div class="d-flex justify-content-between">
                                <span>${multiplier.name} (x${multiplier.factor})</span>
                                <span class="badge bg-warning">${count} uses</span>
                            </div>
                        </div>`;
                }
            });
            multiplierHtml += '</div>';
            multiplierContainer.innerHTML = multiplierHtml;
        } else {
            multiplierContainer.innerHTML = '<p class="text-muted">No multipliers used yet</p>';
        }
        
        // Activity timeline
        const timelineContainer = document.getElementById('activity-timeline');
        if (activities.length > 0) {
            let timelineHtml = '<div class="timeline">';
            const recentActivities = activities.slice(0, 10); // Show last 10 activities
            
            recentActivities.forEach(activity => {
                const date = new Date(activity.timestamp);
                const dateStr = date.toLocaleDateString();
                const timeStr = date.toLocaleTimeString();
                const pointsClass = activity.points >= 0 ? 'text-success' : 'text-danger';
                const pointsSign = activity.points >= 0 ? '+' : '';
                
                timelineHtml += `
                    <div class="card mb-2">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">${activity.activityName}</h6>
                                    <small class="text-muted">${dateStr} at ${timeStr}</small>
                                    ${activity.multipliers && activity.multipliers.length > 0 ? 
                                        '<br><small class="text-info">With multipliers</small>' : ''}
                                </div>
                                <span class="badge bg-primary rounded-pill ${pointsClass}">
                                    ${pointsSign}${activity.points} pts
                                </span>
                            </div>
                        </div>
                    </div>`;
            });
            timelineHtml += '</div>';
            timelineContainer.innerHTML = timelineHtml;
        } else {
            timelineContainer.innerHTML = '<p class="text-muted">No activities yet</p>';
        }
    }
    
    getCategoryColor(category) {
        const colors = {
            'drink': 'bg-primary',
            'food': 'bg-success',
            'competition': 'bg-warning',
            'task': 'bg-info',
            'random': 'bg-secondary',
            'penalty': 'bg-danger',
            'bonus': 'bg-success'
        };
        return colors[category] || 'bg-secondary';
    }

    async updateScores() {
        const myScoreElement = document.getElementById('my-score');
        const leaderboardElement = document.getElementById('leaderboard');
        
        // Use Firebase if available
        if (this.firebaseService && this.currentUser && this.currentUser.sanitizedName) {
            try {
                // Get user's score from Firestore using sanitized name
                const userDoc = await this.firebaseService.db.collection('users').doc(this.currentUser.sanitizedName).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    myScoreElement.textContent = userData.totalScore || 0;
                } else {
                    myScoreElement.textContent = 0;
                }
            } catch (error) {
                console.error('Error fetching Firebase score:', error);
                // Fall back to localStorage
                if (window.scoringEngine) {
                    const myScore = window.scoringEngine.getUserScore(this.currentUser.name);
                    myScoreElement.textContent = myScore;
                }
            }
        } else if (this.currentUser && window.scoringEngine) {
            // Use localStorage-based scoring as fallback
            const myScore = window.scoringEngine.getUserScore(this.currentUser.name);
            myScoreElement.textContent = myScore;
            
            const leaderboard = window.scoringEngine.getLeaderboard();
            if (leaderboard.length > 0) {
                // Format leaderboard data to match Firebase structure for consistent display
                const formattedLeaderboard = leaderboard.map(entry => ({
                    id: entry.userId,
                    name: entry.userId,
                    totalScore: entry.score,
                    sanitizedName: entry.userId.toLowerCase().replace(/\s+/g, '_')
                }));
                
                // Use the same display method as Firebase mode for consistency
                this.updateLeaderboardDisplay(formattedLeaderboard);
                
                // Update popular activities for local mode
                const popularActivities = window.scoringEngine.getMostPopularActivities();
                this.updatePopularActivitiesDisplay(popularActivities);
            } else {
                leaderboardElement.innerHTML = '<p class="text-muted">No activities logged yet</p>';
                // Also update popular activities display
                this.updatePopularActivitiesDisplay([]);
            }
        } else {
            myScoreElement.textContent = '0';
            leaderboardElement.innerHTML = '<p class="text-muted">No activities logged yet</p>';
        }
    }
    
    // Export functions
    async exportToJSON() {
        if (this.exportManager) {
            await this.exportManager.exportToJSON();
        } else {
            alert('Export feature not available');
        }
    }
    
    async exportToCSV() {
        if (this.exportManager) {
            await this.exportManager.exportToCSV();
        } else {
            alert('Export feature not available');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ironTurtleApp = new IronTurtleApp();
});