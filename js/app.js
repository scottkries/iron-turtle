// Iron Turtle Challenge - Main Application
class IronTurtleApp {
    constructor() {
        this.currentUser = null;
        this.currentScreen = 'registration';
        this.firebaseService = null;
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
                const isCompleted = activity.oneTimeOnly && window.scoringEngine.isTaskCompleted(activity.id);
                const clickHandler = isCompleted ? '' : `onclick="ironTurtleApp.selectActivity('${activity.id}')"`;
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
            return;
        }
        
        // Check if this is a completed one-time task
        if (this.selectedActivity.oneTimeOnly && window.scoringEngine.isTaskCompleted(activityId)) {
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
                points: finalPoints,
                
                // NEW: Metadata collection
                metadata: {
                    // Time metadata
                    submittedAt: new Date().toISOString(),
                    dayOfWeek: new Date().getDay(),
                    hourOfDay: new Date().getHours(),
                    timeOfDay: this.getTimeOfDay(),
                    
                    // Session metadata
                    sessionDuration: this.currentUser.loginTime ? 
                        Date.now() - this.currentUser.loginTime : 0,
                    activityNumber: window.scoringEngine.getUserActivities(this.currentUser.name).length + 1,
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
            
            // Add to scoring engine
            window.scoringEngine.activities.push(logEntry);
            window.scoringEngine.saveActivities();
            
            // Mark one-time task as completed if applicable
            if (activity.oneTimeOnly) {
                window.scoringEngine.markTaskCompleted(activity.id);
            }
            
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
    
    showActivityHistory() {
        const modal = new bootstrap.Modal(document.getElementById('historyModal'));
        const historyContent = document.getElementById('history-content');
        const totalScoreElement = document.getElementById('history-total-score');
        const clearAllBtn = document.getElementById('clear-all-activities');
        
        if (!this.currentUser || !window.scoringEngine) {
            historyContent.innerHTML = '<p class="text-muted">No activities logged yet</p>';
            totalScoreElement.textContent = '0';
            clearAllBtn.style.display = 'none';
            modal.show();
            return;
        }
        
        // Get user's activities
        const userActivities = window.scoringEngine.getUserActivities(this.currentUser.name);
        
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
                    const mult = MULTIPLIERS.find(mul => mul.id === m);
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
                        <button class="btn btn-danger btn-sm" onclick="ironTurtleApp.deleteActivity(${activity.id})">
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

    deleteActivity(activityId) {
        if (confirm('Are you sure you want to delete this activity?')) {
            // Delete the activity
            window.scoringEngine.removeActivity(activityId);
            
            // Refresh the history modal
            this.showActivityHistory();
            
            // Update scores on the dashboard
            this.updateScores();
            
            // Show success message
            this.showSuccessMessage('Activity deleted successfully');
        }
    }
    
    clearAllActivities() {
        if (!this.currentUser) return;
        
        const userActivities = window.scoringEngine.getUserActivities(this.currentUser.name);
        const activitiesCount = userActivities.length;
        
        if (activitiesCount === 0) {
            alert('No activities to clear');
            return;
        }
        
        const confirmMessage = `Are you sure you want to delete ALL ${activitiesCount} activities? This action cannot be undone.`;
        
        if (confirm(confirmMessage)) {
            // Double confirmation for safety
            if (confirm('This will permanently delete all your activities and reset your score to 0. Are you absolutely sure?')) {
                // Clear all activities for the current user
                window.scoringEngine.clearAllUserActivities(this.currentUser.name);
                
                // Refresh the history modal
                this.showActivityHistory();
                
                // Update scores on the dashboard
                this.updateScores();
                
                // Show success message
                this.showSuccessMessage('All activities cleared successfully');
            }
        }
    }
    
    showReferenceChart() {
        const modal = new bootstrap.Modal(document.getElementById('referenceModal'));
        
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
        
        MULTIPLIERS.forEach(mult => {
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