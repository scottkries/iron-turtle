// Iron Turtle Challenge - Main Application
class IronTurtleApp {
    constructor() {
        this.currentUser = null;
        this.currentScreen = 'registration';
        this.firebaseService = null;
        this.init();
    }

    async init() {
        // Check for existing localStorage session first
        this.checkExistingSession();
        
        // Firebase is optional - app works without it
        if (typeof firebaseService !== 'undefined' && window.FIREBASE_ENABLED) {
            try {
                this.firebaseService = firebaseService;
                console.log('Firebase service available - enhanced features enabled');
            } catch (error) {
                console.log('Firebase not configured - using local storage mode');
                this.firebaseService = null;
            }
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

        // Log activity button
        const logActivityBtn = document.getElementById('log-activity-btn');
        logActivityBtn.addEventListener('click', () => this.showActivityLogger());
        
        // Submit activity button
        const submitBtn = document.getElementById('log-activity-submit');
        submitBtn.addEventListener('click', () => this.submitActivity());
    }

    async handleRegistration(e) {
        e.preventDefault();
        
        const name = document.getElementById('player-name').value.trim();

        if (!name) {
            alert('Please enter your name');
            return;
        }

        // Always use localStorage for now - Firebase integration pending proper setup
        this.currentUser = {
            name: name,
            loginTime: Date.now()
        };
        localStorage.setItem('ironTurtle_user', JSON.stringify(this.currentUser));
        this.showDashboard();
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('ironTurtle_user');
            this.currentUser = null;
            this.showRegistration();
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

    showRegistration() {
        this.currentScreen = 'registration';
        this.updateDisplay();
    }

    showDashboard() {
        this.currentScreen = 'dashboard';
        this.updateDisplay();
        this.updateUserInfo();
        this.updateScores();
    }

    showActivityLogger() {
        // Show the activity modal
        const modal = new bootstrap.Modal(document.getElementById('activityModal'));
        modal.show();
        
        // Reset the modal
        this.resetActivityModal();
        
        // Initialize search functionality
        this.initializeActivitySearch();
    }
    
    resetActivityModal() {
        document.getElementById('activity-search').value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('selected-activity').classList.add('d-none');
        document.getElementById('log-activity-submit').disabled = true;
        this.selectedActivity = null;
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
                html += `
                    <div class="list-group-item list-group-item-action" onclick="ironTurtleApp.selectActivity('${activity.id}')">
                        <div class="d-flex justify-content-between">
                            <span>${activity.name}</span>
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
        
        // Show quantity for consumables and random tasks
        if (activity.category === 'drink' || activity.category === 'food' || 
            activity.category === 'random' || !activity.oneTimeOnly) {
            document.getElementById('quantity-section').classList.remove('d-none');
            document.getElementById('activity-quantity').value = 1;
        }
        
        // Show competition result selector
        if (activity.category === 'competition') {
            document.getElementById('competition-result').classList.remove('d-none');
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
        let basePoints = 0;
        
        // Handle song risk activity
        if (activity.id === 'cue_song' && activity.hasRiskPenalty) {
            const songOutcome = document.querySelector('input[name="song-outcome"]:checked');
            if (songOutcome && songOutcome.value === 'skipped') {
                basePoints = -5; // Penalty for skipped song
            } else {
                basePoints = activity.basePoints || 1; // Normal points for played song
            }
        }
        // Determine base points for other activities
        else if (activity.category === 'competition') {
            const result = document.querySelector('input[name="comp-result"]:checked').value;
            basePoints = result === 'win' ? activity.winPoints : activity.lossPoints;
        } else {
            basePoints = activity.basePoints || 0;
        }
        
        // Apply penalty doubling if caught
        if (activity.category === 'penalty') {
            const caught = document.getElementById('caught-by-other').checked;
            if (caught) {
                basePoints *= 2;
            }
        }
        
        // Get selected multipliers
        const selectedMultipliers = [];
        document.querySelectorAll('.multiplier-check:checked').forEach(checkbox => {
            selectedMultipliers.push(checkbox.value);
        });
        
        // Calculate total multiplier
        let totalMultiplier = 1;
        selectedMultipliers.forEach(multId => {
            const multiplier = MULTIPLIERS.find(m => m.id === multId);
            if (multiplier) {
                totalMultiplier *= multiplier.factor;
            }
        });
        
        // Get quantity
        const quantity = parseInt(document.getElementById('activity-quantity')?.value || 1);
        
        // Calculate total points
        const totalPoints = Math.round(basePoints * totalMultiplier * quantity);
        
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
            
            // Calculate points
            let basePoints = activity.basePoints || 0;
            
            // Handle song risk activity
            if (activity.id === 'cue_song' && songOutcome === 'skipped') {
                basePoints = -5; // Penalty for skipped song
            } else if (activity.category === 'competition') {
                basePoints = competitionResult === 'win' ? activity.winPoints : activity.lossPoints;
            }
            
            if (penaltyCaught) {
                basePoints *= 2;
            }
            
            // Calculate final points with multipliers
            let totalMultiplier = 1;
            selectedMultipliers.forEach(multId => {
                const multiplier = MULTIPLIERS.find(m => m.id === multId);
                if (multiplier) {
                    totalMultiplier *= multiplier.factor;
                }
            });
            const finalPoints = Math.round(basePoints * totalMultiplier * quantity);
            
            // Log the activity to localStorage
            const logEntry = {
                id: Date.now(),
                userId: this.currentUser.name,
                activityId: activity.id,
                activityName: activity.name,
                category: activity.category,
                basePoints: basePoints,
                multipliers: selectedMultipliers,
                quantity: quantity,
                competitionResult: competitionResult,
                penaltyCaught: penaltyCaught,
                songOutcome: songOutcome,
                timestamp: Date.now(),
                points: finalPoints
            };
            
            // Add to scoring engine
            window.scoringEngine.activities.push(logEntry);
            window.scoringEngine.saveActivities();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('activityModal'));
            modal.hide();
            
            // Update scores
            this.updateScores();
            
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

    async updateScores() {
        const myScoreElement = document.getElementById('my-score');
        const leaderboardElement = document.getElementById('leaderboard');
        
        // Use localStorage-based scoring
        if (this.currentUser && window.scoringEngine) {
            const myScore = window.scoringEngine.getUserScore(this.currentUser.name);
            myScoreElement.textContent = myScore;
            
            const leaderboard = window.scoringEngine.getLeaderboard();
            if (leaderboard.length > 0) {
                // Get all unique users and their names from localStorage
                const users = {};
                window.scoringEngine.activities.forEach(activity => {
                    if (!users[activity.userId]) {
                        users[activity.userId] = activity.userId;
                    }
                });
                
                leaderboardElement.innerHTML = leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.userId === this.currentUser.name;
                    return `
                        <div class="d-flex justify-content-between align-items-center mb-2 ${isCurrentUser ? 'bg-light p-2 rounded' : ''}">
                            <span>${index + 1}. ${entry.userId} ${isCurrentUser ? '(You)' : ''}</span>
                            <span class="badge bg-primary">${entry.score} pts</span>
                        </div>
                    `;
                }).join('');
            } else {
                leaderboardElement.innerHTML = '<p class="text-muted">No activities logged yet</p>';
            }
        } else {
            myScoreElement.textContent = '0';
            leaderboardElement.innerHTML = '<p class="text-muted">No activities logged yet</p>';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ironTurtleApp = new IronTurtleApp();
});