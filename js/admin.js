// Admin Dashboard for Iron Turtle Challenge
class AdminDashboard {
    constructor() {
        this.isAdmin = false;
        this.adminPin = localStorage.getItem('ironTurtle_adminPin') || '2024turtle'; // Default PIN
        this.firebaseService = null;
        this.softDeleteEnabled = localStorage.getItem('ironTurtle_softDeleteEnabled') === 'true';
        
        console.log('🔧 Initializing Admin Dashboard...');
        console.log('🔑 Admin PIN configured');
        
        this.init();
    }

    init() {
        // Check if Firebase is available
        if (window.firebaseService && window.FIREBASE_ENABLED) {
            this.firebaseService = window.firebaseService;
            console.log('✅ Admin dashboard connected to Firebase');
        } else {
            console.warn('⚠️ Admin dashboard running without Firebase');
        }
        
        // Check for existing admin session
        const adminSession = sessionStorage.getItem('ironTurtle_admin');
        if (adminSession === 'true') {
            this.isAdmin = true;
            this.showAdminDashboard();
        } else {
            this.showAdminLogin();
        }
        
        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Admin login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('admin-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleAdminLogout());
        }
        
        // Tab navigation
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('data-bs-target');
                this.loadTabContent(target);
            });
        });
    }

    showAdminLogin() {
        document.getElementById('admin-login').classList.remove('d-none');
        document.getElementById('admin-dashboard').classList.add('d-none');
    }

    showAdminDashboard() {
        document.getElementById('admin-login').classList.add('d-none');
        document.getElementById('admin-dashboard').classList.remove('d-none');
        this.loadDashboardData();
    }

    handleAdminLogin() {
        const pinInput = document.getElementById('admin-pin');
        const enteredPin = pinInput.value;
        
        console.log('🔐 Admin login attempt...');
        
        // Validate PIN
        if (!enteredPin || enteredPin.trim() === '') {
            this.showLoginError('Please enter an admin PIN.');
            return;
        }
        
        if (enteredPin === this.adminPin) {
            console.log('✅ Admin login successful');
            this.isAdmin = true;
            sessionStorage.setItem('ironTurtle_admin', 'true');
            this.showAdminDashboard();
            pinInput.value = '';
            this.clearLoginError();
        } else {
            console.warn('❌ Admin login failed - invalid PIN');
            this.showLoginError('Invalid admin PIN. Please try again.');
            pinInput.value = '';
            pinInput.focus();
        }
    }
    
    showLoginError(message) {
        // Remove existing error
        this.clearLoginError();
        
        // Add error message
        const form = document.getElementById('admin-login-form');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.id = 'login-error';
        errorDiv.textContent = message;
        form.appendChild(errorDiv);
    }
    
    clearLoginError() {
        const existingError = document.getElementById('login-error');
        if (existingError) {
            existingError.remove();
        }
    }

    handleAdminLogout() {
        if (confirm('Are you sure you want to logout from admin dashboard?')) {
            this.isAdmin = false;
            sessionStorage.removeItem('ironTurtle_admin');
            this.showAdminLogin();
        }
    }

    async loadDashboardData() {
        console.log('📊 Loading admin dashboard data...');
        try {
            // Load overview data by default with timeout
            await this.loadOverviewWithTimeout();
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            this.showLoadingError('overview-content', 'Failed to load dashboard data');
        }
    }
    
    async loadOverviewWithTimeout() {
        return Promise.race([
            this.loadOverview(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Load timeout')), 10000)
            )
        ]);
    }
    
    showLoadingError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <h6>⚠️ ${message}</h6>
                    <p>This might be due to:</p>
                    <ul>
                        <li>Firebase connection issues</li>
                        <li>Missing database indexes</li>
                        <li>Network connectivity problems</li>
                    </ul>
                    <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">🔄 Retry</button>
                    <button class="btn btn-outline-secondary btn-sm ms-2" onclick="adminDashboard.loadOfflineMode('${containerId}')">📱 Offline Mode</button>
                </div>
            `;
        }
    }
    
    loadOfflineMode(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <h6>📱 Offline Mode</h6>
                    <p>Admin dashboard is running in offline mode. Some features may be limited.</p>
                    <ul>
                        <li>✅ Basic admin functions available</li>
                        <li>❌ Real-time data not available</li>
                        <li>❌ User management features disabled</li>
                    </ul>
                </div>
            `;
        }
    }

    async loadTabContent(tabId) {
        console.log(`📚 Loading tab content: ${tabId}`);
        
        try {
            // Add timeout to all tab loading operations
            await Promise.race([
                this.loadTabContentInternal(tabId),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Tab loading timeout: ${tabId}`)), 15000)
                )
            ]);
            console.log(`✅ Successfully loaded tab: ${tabId}`);
        } catch (error) {
            console.error(`❌ Error loading tab ${tabId}:`, error);
            const containerId = tabId.replace('#', '') + '-content';
            this.showLoadingError(containerId, `Failed to load ${tabId.replace('#', '')} data`);
        }
    }
    
    async loadTabContentInternal(tabId) {
        switch(tabId) {
            case '#overview':
                await this.loadOverview();
                break;
            case '#participants':
                await this.loadParticipants();
                break;
            case '#activities-manage':
                await this.loadActivitiesManagement();
                break;
            case '#challenges':
                await this.loadChallenges();
                break;
            case '#recovery':
                await this.loadRecovery();
                break;
            case '#settings':
                await this.loadSettings();
                break;
        }
    }

    renderPopularActivities(popularActivities) {
        if (!popularActivities || popularActivities.length === 0) {
            return '<p class="text-muted">No activities yet</p>';
        }
        
        // Get activity names
        const enrichedActivities = popularActivities.map(item => {
            // Find the activity definition using ActivityHelper
            const allActivities = ActivityHelper.getAllActivities();
            const activityDef = allActivities.find(a => a.id === item.activityId);
            
            return {
                ...item,
                name: activityDef ? activityDef.name : item.activityId,
                category: activityDef ? activityDef.category : 'unknown',
                points: activityDef ? (activityDef.basePoints || activityDef.winPoints || activityDef.points || 0) : 0
            };
        });
        
        // Build HTML
        let html = '<div class="list-group list-group-flush">';
        enrichedActivities.forEach((activity, index) => {
            const badgeColor = index < 3 ? 'bg-danger' : index < 6 ? 'bg-warning' : 'bg-secondary';
            const categoryEmoji = this.getCategoryEmoji(activity.category);
            
            // Get the actual activity definition to check for competition points
            const allActivities = ActivityHelper.getAllActivities();
            const activityDef = allActivities.find(a => a.id === activity.activityId);
            
            // Format points display
            let pointsDisplay = '';
            if (activityDef) {
                if (activityDef.winPoints && activityDef.lossPoints) {
                    pointsDisplay = `W:${activityDef.winPoints}/L:${activityDef.lossPoints} pts`;
                } else {
                    pointsDisplay = `${activity.points} pts`;
                }
            } else {
                pointsDisplay = '0 pts';
            }
            
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center py-2">
                    <div>
                        <span class="me-2">${categoryEmoji}</span>
                        <span>${activity.name}</span>
                        <small class="text-muted ms-1">(${pointsDisplay})</small>
                    </div>
                    <span class="badge ${badgeColor} rounded-pill">${activity.count}</span>
                </div>`;
        });
        html += '</div>';
        
        return html;
    }
    
    getCategoryEmoji(category) {
        const emojiMap = {
            'drink': '🍺',
            'food': '🍔',
            'competition': '🏆',
            'task': '⛷️',
            'random': '🎲',
            'penalty': '⚠️',
            'bonus': '🌟',
            'unknown': '📌'
        };
        return emojiMap[category] || '📌';
    }
    
    async loadOverview() {
        const container = document.getElementById('overview-content');
        console.log('📊 Loading admin overview...');
        
        try {
            let stats = {
                totalParticipants: 0,
                totalActivities: 0,
                totalPoints: 0,
                activeNow: 0,
                topPlayer: 'None',
                topScore: 0
            };
            
            // Check Firebase connection with timeout
            if (this.firebaseService && this.firebaseService.db) {
                console.log('🔥 Using Firebase for admin overview...');
                
                // Test Firebase connection first
                const connectionTest = await Promise.race([
                    this.firebaseService.db.collection('users').limit(1).get(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Firebase connection timeout')), 5000)
                    )
                ]);
                
                console.log('✅ Firebase connection verified for admin overview');
                // Get all users with error handling
                let usersSnapshot;
                try {
                    usersSnapshot = await Promise.race([
                        this.firebaseService.db.collection('users')
                            .orderBy('totalScore', 'desc')
                            .get(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Users query timeout')), 8000)
                        )
                    ]);
                } catch (queryError) {
                    console.warn('⚠️ Users query failed, trying without orderBy:', queryError.message);
                    // Fallback: query without orderBy to avoid index issues
                    usersSnapshot = await this.firebaseService.db.collection('users').get();
                }
                
                // Filter out soft-deleted users for stats
                const activeUsers = usersSnapshot.docs.filter(doc => !doc.data().isDeleted);
                stats.totalParticipants = activeUsers.length;
                
                if (activeUsers.length > 0) {
                    const topUser = activeUsers[0].data();
                    stats.topPlayer = topUser.name;
                    stats.topScore = topUser.totalScore || 0;
                    
                    // Calculate total points (only from active users)
                    activeUsers.forEach(doc => {
                        stats.totalPoints += doc.data().totalScore || 0;
                    });
                }
                
                // Get total activities with timeout
                try {
                    const activitiesSnapshot = await Promise.race([
                        this.firebaseService.db.collection('activities').get(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Activities query timeout')), 8000)
                        )
                    ]);
                    stats.totalActivities = activitiesSnapshot.size;
                } catch (activitiesError) {
                    console.warn('⚠️ Activities query failed:', activitiesError.message);
                    stats.totalActivities = 'N/A';
                }
                
                // Check active users (activities in last hour) with error handling
                try {
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                    const recentActivities = await Promise.race([
                        this.firebaseService.db.collection('activities')
                            .where('timestamp', '>', oneHourAgo)
                            .get(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Recent activities timeout')), 8000)
                        )
                    ]);
                    
                    const activeUsers = new Set();
                    recentActivities.forEach(doc => {
                        activeUsers.add(doc.data().userId);
                    });
                    stats.activeNow = activeUsers.size;
                } catch (recentError) {
                    console.warn('⚠️ Recent activities query failed:', recentError.message);
                    stats.activeNow = 'N/A';
                }
                
                // Get popular activities with error handling
                try {
                    stats.popularActivities = await Promise.race([
                        this.firebaseService.getMostPopularActivities(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Popular activities timeout')), 8000)
                        )
                    ]);
                } catch (popularError) {
                    console.warn('⚠️ Popular activities query failed:', popularError.message);
                    stats.popularActivities = [];
                }
            } else {
                console.warn('⚠️ Firebase not available, using fallback data for overview');
                stats = {
                    totalParticipants: 'N/A',
                    totalActivities: 'N/A', 
                    totalPoints: 'N/A',
                    activeNow: 'N/A',
                    topPlayer: 'Firebase Required',
                    topScore: 'N/A',
                    popularActivities: []
                };
            }
            
            container.innerHTML = `
                <div class="row">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-primary">${stats.totalParticipants}</h3>
                                <p class="text-muted">Total Participants</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-success">${stats.totalActivities}</h3>
                                <p class="text-muted">Total Activities</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-info">${stats.totalPoints}</h3>
                                <p class="text-muted">Total Points</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-warning">${stats.activeNow}</h3>
                                <p class="text-muted">Active Now</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6>Current Leader</h6>
                            </div>
                            <div class="card-body">
                                <h4>${stats.topPlayer}</h4>
                                <p class="text-muted">${stats.topScore} points</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6>🔥 Popular Activities</h6>
                            </div>
                            <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                                ${this.renderPopularActivities(stats.popularActivities)}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6>Quick Actions</h6>
                            </div>
                            <div class="card-body">
                                <button class="btn btn-primary btn-sm me-2" onclick="adminDashboard.exportAllData()">
                                    Export All Data
                                </button>
                                <button class="btn btn-warning btn-sm me-2" onclick="adminDashboard.createChallenge()">
                                    Create Challenge
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="adminDashboard.resetEvent()">
                                    Reset Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
        } catch (error) {
            console.error('Error loading overview:', error);
            container.innerHTML = '<div class="alert alert-danger">Error loading overview data</div>';
        }
    }

    async loadParticipants() {
        const container = document.getElementById('participants-content');
        console.log('👥 Loading participants...');
        
        // Show loading state
        container.innerHTML = `
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading participants...</span>
                </div>
                <p class="mt-2">Loading participants...</p>
            </div>
        `;
        
        try {
            let participants = [];
            
            if (this.firebaseService && this.firebaseService.db) {
                console.log('🔥 Fetching participants from Firebase...');
                
                // Get users with timeout and fallback
                let snapshot;
                try {
                    snapshot = await Promise.race([
                        this.firebaseService.db.collection('users')
                            .orderBy('totalScore', 'desc')
                            .get(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Participants query timeout')), 10000)
                        )
                    ]);
                } catch (queryError) {
                    console.warn('⚠️ Participants orderBy query failed, trying without orderBy:', queryError.message);
                    snapshot = await this.firebaseService.db.collection('users').get();
                }
                
                snapshot.forEach(doc => {
                    const userData = doc.data();
                    // Filter out soft-deleted users
                    if (!userData.isDeleted) {
                        participants.push({
                            id: doc.id,
                            ...userData
                        });
                    }
                });
                
                // Sort client-side if we used the fallback query
                participants.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
                
                console.log(`✅ Loaded ${participants.length} participants`);
            } else {
                console.warn('⚠️ Firebase not available for participants');
                // Show fallback message instead of staying stuck on loading
                container.innerHTML = `
                    <div class="alert alert-warning">
                        <h6>📱 Offline Mode</h6>
                        <p>Participants management requires Firebase connection.</p>
                        <p><strong>Firebase Status:</strong> ${window.FIREBASE_ENABLED ? 'SDK Loaded' : 'SDK Not Loaded'}</p>
                        <p><strong>Service Status:</strong> ${this.firebaseService ? 'Service Available' : 'Service Not Available'}</p>
                        <button class="btn btn-outline-primary" onclick="location.reload()">🔄 Retry</button>
                    </div>
                `;
                return;
            }
            
            // Add search and bulk controls
            let html = `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <input type="text" class="form-control" id="participant-search" 
                               placeholder="🔍 Search participants..." 
                               onkeyup="adminDashboard.filterParticipants()">
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-danger btn-sm" onclick="adminDashboard.bulkDeleteUsers()" 
                                id="bulk-delete-btn" disabled>
                            🗑️ Delete Selected (<span id="selected-count">0</span>)
                        </button>
                        <button class="btn btn-warning btn-sm ms-2" onclick="adminDashboard.selectInactiveUsers()">
                            ⏰ Select Inactive (30+ days)
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover" id="participants-table">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" id="select-all-users" 
                                           onchange="adminDashboard.toggleSelectAll()">
                                </th>
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Score</th>
                                <th>Activities</th>
                                <th>Last Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            for (let i = 0; i < participants.length; i++) {
                const user = participants[i];
                // Handle lastActivity safely - it might be a Firestore timestamp or a regular date
                let lastActive = 'Never';
                let lastActiveDate = null;
                
                if (user.lastActivity) {
                    try {
                        if (typeof user.lastActivity.toDate === 'function') {
                            // Firestore timestamp
                            lastActiveDate = user.lastActivity.toDate();
                            lastActive = lastActiveDate.toLocaleString();
                        } else if (user.lastActivity instanceof Date) {
                            // Regular Date object
                            lastActiveDate = user.lastActivity;
                            lastActive = lastActiveDate.toLocaleString();
                        } else if (typeof user.lastActivity === 'string' || typeof user.lastActivity === 'number') {
                            // String or timestamp number
                            lastActiveDate = new Date(user.lastActivity);
                            lastActive = lastActiveDate.toLocaleString();
                        }
                    } catch (error) {
                        console.warn('Error parsing lastActivity for user:', user.id, error);
                        lastActive = 'Unknown';
                    }
                }
                
                // Get activity count
                let activityCount = 0;
                if (this.firebaseService) {
                    const activitiesSnapshot = await this.firebaseService.db.collection('activities')
                        .where('userSanitizedName', '==', user.id)
                        .get();
                    activityCount = activitiesSnapshot.size;
                }
                
                // Calculate days since last active
                const daysSinceActive = lastActiveDate ? 
                    Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
                const inactiveClass = daysSinceActive > 30 ? 'table-warning' : '';
                
                html += `
                    <tr class="${inactiveClass}" data-user-name="${user.name.toLowerCase()}" 
                        data-days-inactive="${daysSinceActive}">
                        <td>
                            <input type="checkbox" class="user-select" value="${user.id}" 
                                   data-name="${user.name}" data-activities="${activityCount}"
                                   onchange="adminDashboard.updateSelectionCount()">
                        </td>
                        <td>${i + 1}</td>
                        <td>${user.name}</td>
                        <td>${user.totalScore || 0}</td>
                        <td>${activityCount}</td>
                        <td>
                            ${lastActive}
                            ${daysSinceActive > 30 ? `<br><small class="text-muted">(${daysSinceActive} days ago)</small>` : ''}
                        </td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="adminDashboard.viewUserDetails('${user.id}')">
                                View
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="adminDashboard.adjustScore('${user.id}', '${user.name}')">
                                Adjust
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteUser('${user.id}', '${user.name}', ${activityCount})">
                                Delete
                            </button>
                        </td>
                    </tr>`;
            }
            
            html += `
                        </tbody>
                    </table>
                </div>`;
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading participants:', error);
            container.innerHTML = '<div class="alert alert-danger">Error loading participants</div>';
        }
    }

    async loadActivitiesManagement() {
        const container = document.getElementById('activities-manage-content');
        
        // Get all activities using the helper function and group by category
        const allActivities = ActivityHelper.getAllActivities();
        const categorizedActivities = {};
        
        allActivities.forEach(activity => {
            // Determine the display category name
            let categoryName = activity.category;
            if (categoryName === 'drink' || categoryName === 'food') {
                categoryName = 'consumables';
            } else if (categoryName === 'task') {
                categoryName = 'tasks';
            } else if (categoryName === 'random') {
                categoryName = 'randomTasks';
            }
            
            if (!categorizedActivities[categoryName]) {
                categorizedActivities[categoryName] = [];
            }
            categorizedActivities[categoryName].push(activity);
        });
        
        let html = '<div class="accordion" id="activitiesAccordion">';
        
        Object.entries(categorizedActivities).forEach(([category, activities], index) => {
            html += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading${index}">
                        <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" 
                                data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                            ${category.charAt(0).toUpperCase() + category.slice(1)} (${activities.length})
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                         data-bs-parent="#activitiesAccordion">
                        <div class="accordion-body">
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Activity</th>
                                            <th>Points</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;
            
            activities.forEach(activity => {
                const isEnabled = localStorage.getItem(`activity_disabled_${activity.id}`) !== 'true';
                const statusClass = isEnabled ? 'success' : 'danger';
                const statusText = isEnabled ? 'Enabled' : 'Disabled';
                
                // Determine the points display based on activity type
                let pointsDisplay = '';
                if (activity.winPoints !== undefined && activity.lossPoints !== undefined) {
                    // Competition with win/loss points
                    pointsDisplay = `Win: ${activity.winPoints} / Loss: ${activity.lossPoints}`;
                } else if (activity.basePoints !== undefined) {
                    // Regular activity with base points
                    pointsDisplay = activity.basePoints;
                } else {
                    // Fallback to any points property
                    pointsDisplay = activity.points || '0';
                }
                
                html += `
                    <tr>
                        <td>${activity.name}</td>
                        <td>${pointsDisplay}</td>
                        <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                        <td>
                            <button class="btn btn-sm btn-${isEnabled ? 'danger' : 'success'}"
                                    onclick="adminDashboard.toggleActivity('${activity.id}')">
                                ${isEnabled ? 'Disable' : 'Enable'}
                            </button>
                            <button class="btn btn-sm btn-info"
                                    onclick="adminDashboard.editActivity('${activity.id}')">
                                Edit
                            </button>
                        </td>
                    </tr>`;
            });
            
            html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
        console.log('✅ Activities management loaded successfully');
    }

    async loadChallenges() {
        const container = document.getElementById('challenges-content');
        console.log('🏆 Loading challenges...');
        
        // Show loading state
        container.innerHTML = `
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading challenges...</span>
                </div>
                <p class="mt-2">Loading challenges...</p>
            </div>
        `;
        
        try {
        const container = document.getElementById('challenges-content');
        
        let html = `
            <div class="card mb-4">
                <div class="card-header">
                    <h6>Create Custom Challenge</h6>
                </div>
                <div class="card-body">
                    <form id="challenge-form">
                        <div class="mb-3">
                            <label class="form-label">Challenge Name</label>
                            <input type="text" class="form-control" id="challenge-name" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="challenge-description" rows="2"></textarea>
                        </div>
                        <div class="row">
                            <div class="col-md-4">
                                <label class="form-label">Points</label>
                                <input type="number" class="form-control" id="challenge-points" value="50" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Duration (hours)</label>
                                <input type="number" class="form-control" id="challenge-duration" value="1" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Max Completions</label>
                                <input type="number" class="form-control" id="challenge-max" value="1" required>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary mt-3">Create Challenge</button>
                    </form>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h6>Active Challenges</h6>
                </div>
                <div class="card-body" id="active-challenges">
                    <p class="text-muted">No active challenges</p>
                </div>
            </div>`;
        
        container.innerHTML = html;
        
        // Set up challenge form
        document.getElementById('challenge-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCustomChallenge();
        });
        
        // Load active challenges
        this.loadActiveChallenges();
        console.log('✅ Challenges loaded successfully');
        } catch (error) {
            console.error('❌ Error loading challenges:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h6>❌ Error loading challenges</h6>
                    <p>${error.message}</p>
                    <button class="btn btn-outline-primary" onclick="adminDashboard.loadChallenges()">🔄 Retry</button>
                </div>
            `;
        }
    }

    async loadSettings() {
        const container = document.getElementById('settings-content');
        console.log('⚙️ Loading settings...');
        
        // Show loading state
        container.innerHTML = `
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading settings...</span>
                </div>
                <p class="mt-2">Loading settings...</p>
            </div>
        `;
        
        try {
            let html = `
            <div class="card">
                <div class="card-header">
                    <h6>Admin Settings</h6>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Admin PIN</label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="new-admin-pin" placeholder="Enter new PIN">
                            <button class="btn btn-primary" onclick="adminDashboard.changeAdminPin()">
                                Change PIN
                            </button>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <div class="mb-3">
                        <h6>Event Controls</h6>
                        <button class="btn btn-warning me-2" onclick="adminDashboard.pauseEvent()">
                            Pause Event
                        </button>
                        <button class="btn btn-success me-2" onclick="adminDashboard.resumeEvent()">
                            Resume Event
                        </button>
                        <button class="btn btn-danger" onclick="adminDashboard.resetEvent()">
                            Reset Event
                        </button>
                    </div>
                    
                    <hr>
                    
                    <div class="mb-3">
                        <h6>Data Management</h6>
                        <button class="btn btn-info me-2" onclick="adminDashboard.exportAllData()">
                            Export All Data
                        </button>
                        <button class="btn btn-warning me-2" onclick="adminDashboard.backupData()">
                            Backup to Local
                        </button>
                        <button class="btn btn-secondary me-2" onclick="adminDashboard.recalculateAllScores()">
                            🔄 Fix User Scores
                        </button>
                        <button class="btn btn-warning" onclick="adminDashboard.findAndFixDuplicateUsers()">
                            🧹 Fix Duplicate Users
                        </button>
                    </div>
                    
                    <hr>
                    
                    <div class="mb-3">
                        <h6>Score Diagnostics</h6>
                        <p class="text-muted small">Use this if users' scores are not showing correctly on the leaderboard.</p>
                        <button class="btn btn-info me-2" onclick="adminDashboard.auditAllScores()">
                            🔍 Audit All Scores
                        </button>
                        <button class="btn btn-secondary me-2" onclick="adminDashboard.recalculateAllScores()">
                            🔄 Fix User Scores
                        </button>
                        <div id="score-audit-results" class="mt-3"></div>
                        <div id="score-recalc-status" class="mt-2"></div>
                    </div>
                </div>
            </div>`;
        
        container.innerHTML = html;
        console.log('✅ Settings loaded successfully');
        } catch (error) {
            console.error('❌ Error loading settings:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h6>❌ Error loading settings</h6>
                    <p>${error.message}</p>
                    <button class="btn btn-outline-primary" onclick="adminDashboard.loadSettings()">🔄 Retry</button>
                </div>
            `;
        }
    }

    // Admin actions
    async adjustScore(userId, userName) {
        const adjustment = prompt(`Adjust score for ${userName}. Enter positive or negative number:`);
        if (adjustment && !isNaN(adjustment)) {
            const points = parseInt(adjustment);
            
            if (this.firebaseService) {
                try {
                    await this.firebaseService.db.collection('users').doc(userId).update({
                        totalScore: firebase.firestore.FieldValue.increment(points),
                        lastAdjustment: firebase.firestore.FieldValue.serverTimestamp(),
                        adjustmentReason: `Admin adjustment: ${points} points`
                    });
                    
                    // Log the adjustment
                    await this.firebaseService.db.collection('admin_logs').add({
                        action: 'score_adjustment',
                        userId: userId,
                        userName: userName,
                        points: points,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        adminSession: sessionStorage.getItem('ironTurtle_admin')
                    });
                    
                    alert(`Score adjusted by ${points} points for ${userName}`);
                    this.loadParticipants();
                } catch (error) {
                    console.error('Error adjusting score:', error);
                    alert('Failed to adjust score');
                }
            }
        }
    }

    toggleActivity(activityId) {
        const isDisabled = localStorage.getItem(`activity_disabled_${activityId}`) === 'true';
        localStorage.setItem(`activity_disabled_${activityId}`, !isDisabled);
        this.loadActivitiesManagement();
    }

    async createCustomChallenge() {
        const challenge = {
            name: document.getElementById('challenge-name').value,
            description: document.getElementById('challenge-description').value,
            points: parseInt(document.getElementById('challenge-points').value),
            duration: parseInt(document.getElementById('challenge-duration').value),
            maxCompletions: parseInt(document.getElementById('challenge-max').value),
            createdAt: Date.now(),
            expiresAt: Date.now() + (parseInt(document.getElementById('challenge-duration').value) * 60 * 60 * 1000),
            completions: []
        };
        
        // Save challenge
        const challenges = JSON.parse(localStorage.getItem('ironTurtle_challenges') || '[]');
        challenges.push(challenge);
        localStorage.setItem('ironTurtle_challenges', JSON.stringify(challenges));
        
        // Clear form
        document.getElementById('challenge-form').reset();
        
        // Reload challenges
        this.loadActiveChallenges();
        
        alert('Challenge created successfully!');
    }

    loadActiveChallenges() {
        const container = document.getElementById('active-challenges');
        const challenges = JSON.parse(localStorage.getItem('ironTurtle_challenges') || '[]');
        const now = Date.now();
        
        const activeChallenges = challenges.filter(c => c.expiresAt > now);
        
        if (activeChallenges.length === 0) {
            container.innerHTML = '<p class="text-muted">No active challenges</p>';
            return;
        }
        
        let html = '<div class="list-group">';
        activeChallenges.forEach((challenge, index) => {
            const timeLeft = Math.round((challenge.expiresAt - now) / (1000 * 60));
            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6>${challenge.name}</h6>
                            <p class="mb-1">${challenge.description}</p>
                            <small>${challenge.points} points | ${timeLeft} minutes left</small>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.removeChallenge(${index})">
                            Remove
                        </button>
                    </div>
                </div>`;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    removeChallenge(index) {
        if (confirm('Remove this challenge?')) {
            const challenges = JSON.parse(localStorage.getItem('ironTurtle_challenges') || '[]');
            challenges.splice(index, 1);
            localStorage.setItem('ironTurtle_challenges', JSON.stringify(challenges));
            this.loadActiveChallenges();
        }
    }

    // Find and fix duplicate users
    async findAndFixDuplicateUsers() {
        if (!this.firebaseService) {
            alert('Firebase not available');
            return;
        }

        const statusDiv = document.getElementById('score-recalc-status') || 
                         document.createElement('div');
        statusDiv.id = 'duplicate-fix-status';
        statusDiv.innerHTML = '<div class="alert alert-info">🔍 Scanning for duplicate users...</div>';

        try {
            // Get all users
            const usersSnapshot = await this.firebaseService.db.collection('users').get();
            const users = [];
            const nameGroups = {};

            // Group users by sanitized name (only active users)
            usersSnapshot.forEach((doc) => {
                const userData = { id: doc.id, ...doc.data() };
                
                // Skip users that are already marked as deleted
                if (userData.isDeleted) {
                    return;
                }
                
                users.push(userData);

                // Group by actual display name (case-insensitive)
                const normalizedName = userData.name?.toLowerCase().trim();
                if (normalizedName) {
                    if (!nameGroups[normalizedName]) {
                        nameGroups[normalizedName] = [];
                    }
                    nameGroups[normalizedName].push(userData);
                }
            });

            // Find duplicates
            const duplicateGroups = Object.entries(nameGroups)
                .filter(([name, group]) => group.length > 1);

            if (duplicateGroups.length === 0) {
                statusDiv.innerHTML = '<div class="alert alert-success">✅ No duplicate users found!</div>';
                return;
            }

            statusDiv.innerHTML = `<div class="alert alert-warning">🔍 Found ${duplicateGroups.length} groups of duplicate users. Processing...</div>`;

            let mergedCount = 0;
            const batch = this.firebaseService.db.batch();

            for (const [name, duplicates] of duplicateGroups) {
                // Sort by total score (keep the one with highest score as primary)
                // or by creation date if scores are equal
                duplicates.sort((a, b) => {
                    if (b.totalScore !== a.totalScore) {
                        return b.totalScore - a.totalScore;
                    }
                    // If scores equal, keep the one created first
                    const aTime = a.createdAt?.toDate?.() || a.createdAt || 0;
                    const bTime = b.createdAt?.toDate?.() || b.createdAt || 0;
                    return aTime - bTime;
                });

                const primaryUser = duplicates[0];
                const duplicatesToRemove = duplicates.slice(1);

                console.log(`Merging duplicates for "${name}":`, duplicates.map(u => ({ id: u.id, name: u.name, score: u.totalScore, isDeleted: u.isDeleted })));

                // Merge activities from duplicate users to primary user
                for (const duplicateUser of duplicatesToRemove) {
                    // Get activities for this duplicate user
                    const activitiesSnapshot = await this.firebaseService.db.collection('activities')
                        .where('userSanitizedName', '==', duplicateUser.id)
                        .get();

                    // Update activities to point to primary user
                    activitiesSnapshot.forEach((activityDoc) => {
                        batch.update(activityDoc.ref, {
                            userSanitizedName: primaryUser.id,
                            userName: primaryUser.name
                        });
                    });

                    // Mark duplicate user as deleted
                    const duplicateUserRef = this.firebaseService.db.collection('users').doc(duplicateUser.id);
                    batch.update(duplicateUserRef, {
                        isDeleted: true,
                        mergedInto: primaryUser.id,
                        mergedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    mergedCount++;
                }
            }

            // Commit all changes
            await batch.commit();

            // Recalculate scores for affected users
            statusDiv.innerHTML = `<div class="alert alert-info">♻️ Recalculating scores for merged users...</div>`;
            
            for (const [name, duplicates] of duplicateGroups) {
                const primaryUser = duplicates[0];
                await this.firebaseService.updateUserScore(primaryUser.id);
            }

            statusDiv.innerHTML = `<div class="alert alert-success">✅ Successfully merged ${mergedCount} duplicate users into ${duplicateGroups.length} primary accounts!</div>`;

        } catch (error) {
            console.error('Error fixing duplicates:', error);
            statusDiv.innerHTML = `<div class="alert alert-danger">❌ Error: ${error.message}</div>`;
        }
        
        // After merge, log current user state for debugging
        setTimeout(async () => {
            try {
                const currentSnapshot = await this.firebaseService.db.collection('users').get();
                const currentUsers = currentSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    isDeleted: doc.data().isDeleted,
                    totalScore: doc.data().totalScore
                }));
                console.log('Current user state after merge:', currentUsers);
            } catch (e) {
                console.error('Error checking current state:', e);
            }
        }, 2000);
    }

    async exportAllData() {
        // Use the existing ExportManager if available
        if (window.ironTurtleApp && window.ironTurtleApp.exportManager) {
            await window.ironTurtleApp.exportManager.exportToJSON();
        } else {
            alert('Export functionality not available');
        }
    }

    async auditAllScores() {
        if (!this.firebaseService) {
            alert('Firebase service not available');
            return;
        }

        const resultsDiv = document.getElementById('score-audit-results');
        resultsDiv.innerHTML = '<div class="alert alert-info">🔍 Auditing all user scores with dynamic scoring...</div>';

        try {
            let scoreDiscrepancies = [];
            
            // Use dynamic scoring service if available
            if (window.dynamicScoringService) {
                console.log('🎯 Using Dynamic Scoring Service for audit...');
                resultsDiv.innerHTML = '<div class="alert alert-info">🎯 Running comprehensive score audit...</div>';
                
                const discrepancies = await window.dynamicScoringService.auditAllScores();
                
                // Transform format for compatibility with existing display code
                scoreDiscrepancies = discrepancies.map(user => ({
                    id: user.id,
                    name: user.name,
                    storedScore: user.storedScore,
                    calculatedScore: user.calculatedScore,
                    difference: user.difference,
                    activitiesCount: user.activities
                }));
                
                console.log(`🔍 Dynamic audit found ${scoreDiscrepancies.length} discrepancies`);
            } else {
                console.log('⚠️ Dynamic Scoring Service not available, using manual calculation...');
                
                // Fallback to manual calculation
                const usersSnapshot = await this.firebaseService.db.collection('users').get();
                let totalUsers = 0;
                let processedUsers = 0;

                // Process each user
                for (const userDoc of usersSnapshot.docs) {
                    const userData = userDoc.data();
                    if (!userData.isDeleted) {
                        totalUsers++;
                        
                        // Get stored score from users collection
                        const storedScore = userData.totalScore || 0;
                        
                        // Calculate actual score from activities
                        const activities = await this.firebaseService.getUserActivities(userDoc.id);
                        const calculatedScore = activities.reduce((sum, activity) => sum + (activity.points || 0), 0);
                        
                        // Check for discrepancies
                        if (storedScore !== calculatedScore) {
                            scoreDiscrepancies.push({
                                id: userDoc.id,
                                name: userData.name,
                                storedScore: storedScore,
                                calculatedScore: calculatedScore,
                                difference: calculatedScore - storedScore,
                                activitiesCount: activities.length
                            });
                        }
                        
                        processedUsers++;
                        
                        // Update progress
                        resultsDiv.innerHTML = `<div class="alert alert-info">🔍 Auditing scores... ${processedUsers}/${totalUsers} users processed</div>`;
                    }
                }
            }

            // Get total user count for display
            let totalUsers = scoreDiscrepancies.length;
            if (window.dynamicScoringService && window.firebaseService) {
                // If using dynamic scoring, get actual user count
                try {
                    const usersSnapshot = await this.firebaseService.db.collection('users').get();
                    totalUsers = usersSnapshot.docs.filter(doc => !doc.data().isDeleted).length;
                } catch (error) {
                    console.warn('Could not get total user count:', error);
                    totalUsers = scoreDiscrepancies.length;
                }
            }

            // Display results
            if (scoreDiscrepancies.length === 0) {
                resultsDiv.innerHTML = `
                    <div class="alert alert-success">
                        ✅ <strong>All scores are synchronized!</strong><br>
                        Audited ${totalUsers} users - no discrepancies found.
                    </div>`;
            } else {
                // Sort by severity (largest discrepancies first)
                scoreDiscrepancies.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

                let html = `
                    <div class="alert alert-warning">
                        ⚠️ <strong>Found ${scoreDiscrepancies.length} score discrepancies out of ${totalUsers} users:</strong>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Leaderboard Shows</th>
                                    <th>Actual Score</th>
                                    <th>Difference</th>
                                    <th>Activities</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>`;

                scoreDiscrepancies.forEach(user => {
                    const diffClass = user.difference > 0 ? 'text-success' : 'text-danger';
                    const diffIcon = user.difference > 0 ? '+' : '';
                    
                    html += `
                        <tr>
                            <td><strong>${user.name}</strong></td>
                            <td>${user.storedScore}</td>
                            <td>${user.calculatedScore}</td>
                            <td class="${diffClass}">${diffIcon}${user.difference}</td>
                            <td>${user.activitiesCount}</td>
                            <td>
                                <button class="btn btn-sm btn-success" 
                                        onclick="adminDashboard.fixSingleUserScore('${user.id}', '${user.name}')">
                                    🔧 Fix
                                </button>
                            </td>
                        </tr>`;
                });

                html += `
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-warning" onclick="adminDashboard.recalculateAllScores()">
                            🔄 Fix All Score Discrepancies
                        </button>
                    </div>`;

                resultsDiv.innerHTML = html;
            }

        } catch (error) {
            console.error('Error auditing scores:', error);
            resultsDiv.innerHTML = '<div class="alert alert-danger">❌ Error during score audit. Check console for details.</div>';
        }
    }

    async fixSingleUserScore(userId, userName) {
        if (!this.firebaseService) {
            alert('Firebase service not available');
            return;
        }

        if (!confirm(`Fix score discrepancy for ${userName}?`)) {
            return;
        }

        try {
            await this.firebaseService.updateUserScore(userId);
            alert(`✅ Score fixed for ${userName}`);
            
            // Re-run audit to update display
            await this.auditAllScores();
            
            // Refresh participants if visible
            const activeTab = document.querySelector('.nav-link.active[data-bs-target="#participants"]');
            if (activeTab) {
                this.loadParticipants();
            }
        } catch (error) {
            console.error('Error fixing user score:', error);
            alert(`❌ Failed to fix score for ${userName}`);
        }
    }

    async recalculateAllScores() {
        if (!this.firebaseService) {
            alert('Firebase service not available');
            return;
        }

        const statusDiv = document.getElementById('score-recalc-status');
        if (!confirm('This will recalculate all user scores based on their activities. This may take a moment. Continue?')) {
            return;
        }

        try {
            // Enhanced progress tracking
            let progressHtml = `
                <div class="alert alert-info">
                    <h6>🔄 Recalculating All User Scores</h6>
                    <div class="progress mb-2">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                             role="progressbar" style="width: 0%" id="sync-progress-bar">
                        </div>
                    </div>
                    <div id="sync-progress-text">Initializing...</div>
                    <div id="sync-progress-details" class="small mt-2"></div>
                </div>
            `;
            statusDiv.innerHTML = progressHtml;
            
            // Progress callback function
            const progressCallback = (progress) => {
                const progressBar = document.getElementById('sync-progress-bar');
                const progressText = document.getElementById('sync-progress-text');
                const progressDetails = document.getElementById('sync-progress-details');
                
                if (progressBar && progressText) {
                    const percentage = Math.round((progress.current / progress.total) * 100);
                    progressBar.style.width = `${percentage}%`;
                    progressText.textContent = `Processing ${progress.current}/${progress.total} users (${percentage}%)`;
                    
                    if (progressDetails) {
                        progressDetails.innerHTML = `
                            Current: <strong>${progress.currentUser}</strong><br>
                            ✅ Updated: ${progress.updated} | ⏭️ Skipped: ${progress.skipped} | ❌ Errors: ${progress.errors}
                        `;
                    }
                }
            };
            
            // Call the enhanced recalculate function
            const summary = await this.firebaseService.recalculateAllUserScores(progressCallback);
            
            // Display final results
            const resultClass = summary.errorCount > 0 ? 'alert-warning' : 'alert-success';
            const resultIcon = summary.errorCount > 0 ? '⚠️' : '✅';
            
            let resultHtml = `
                <div class="alert ${resultClass}">
                    <h6>${resultIcon} Score Recalculation Complete</h6>
                    <div class="row">
                        <div class="col-md-3">
                            <strong>${summary.updatedCount}</strong><br>
                            <small class="text-muted">Updated</small>
                        </div>
                        <div class="col-md-3">
                            <strong>${summary.skippedCount}</strong><br>
                            <small class="text-muted">Already Synced</small>
                        </div>
                        <div class="col-md-3">
                            <strong>${summary.errorCount}</strong><br>
                            <small class="text-muted">Errors</small>
                        </div>
                        <div class="col-md-3">
                            <strong>${summary.totalTime}ms</strong><br>
                            <small class="text-muted">Total Time</small>
                        </div>
                    </div>
                </div>
            `;
            
            // Add error details if there were any
            if (summary.errors.length > 0) {
                resultHtml += `
                    <div class="alert alert-danger mt-2">
                        <h6>❌ Errors During Sync</h6>
                        <div class="small">
                            ${summary.errors.map(error => 
                                `<div><strong>${error.user}:</strong> ${error.error}</div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }
            
            statusDiv.innerHTML = resultHtml;
            
            // Clear audit results since we just attempted to fix everything
            const auditDiv = document.getElementById('score-audit-results');
            if (auditDiv) {
                auditDiv.innerHTML = '';
            }
            
            // Refresh the participants view if it's active
            const activeTab = document.querySelector('.nav-link.active[data-bs-target="#participants"]');
            if (activeTab) {
                this.loadParticipants();
            }
            
            // Auto-clear success message after 10 seconds
            if (summary.errorCount === 0) {
                setTimeout(() => {
                    statusDiv.innerHTML = '';
                }, 10000);
            }
            
        } catch (error) {
            console.error('Error recalculating scores:', error);
            statusDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h6>❌ Score Recalculation Failed</h6>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p class="small">Check the browser console for more details.</p>
                </div>
            `;
        }
    }

    async deleteUser(sanitizedName, userName, activityCount) {
        // First confirmation
        const deleteType = this.softDeleteEnabled ? 'soft delete (recoverable)' : 'permanently delete';
        const confirmMessage = `${this.softDeleteEnabled ? '♻️' : '🗑️'} ${deleteType} user "${userName}" and all ${activityCount} activities?\n\n` +
                              `${this.softDeleteEnabled ? 'This can be recovered within 30 days.' : 'This action CANNOT be undone.'}`;
        if (!confirm(confirmMessage)) return;
        
        // PIN verification
        const enteredPin = prompt('Enter admin PIN (1234) to confirm deletion:');
        if (enteredPin !== '1234') {
            alert('Incorrect PIN. Deletion cancelled.');
            return;
        }
        
        // Perform deletion
        if (this.firebaseService) {
            try {
                const result = await this.firebaseService.deleteUser(sanitizedName, this.softDeleteEnabled);
                const message = this.softDeleteEnabled ? 
                    `User "${userName}" soft deleted. Can be recovered within 30 days.` :
                    `User "${userName}" and ${result.activitiesDeleted} activities permanently deleted.`;
                alert(message);
                // Reload the participants list
                await this.loadParticipants();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user. Check console for details.');
            }
        } else {
            alert('Firebase service not available. Cannot delete user.');
        }
    }

    async resetEvent() {
        if (!confirm('WARNING: This will delete all data. Are you sure?')) return;
        if (!confirm('This action cannot be undone. Type "RESET" to confirm:')) return;
        
        const confirmation = prompt('Type "RESET" to confirm deletion of all data:');
        if (confirmation !== 'RESET') {
            alert('Reset cancelled');
            return;
        }
        
        // Clear Firebase data
        if (this.firebaseService) {
            try {
                // Delete all activities
                const activities = await this.firebaseService.db.collection('activities').get();
                const batch = this.firebaseService.db.batch();
                activities.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                
                // Reset all users
                const users = await this.firebaseService.db.collection('users').get();
                const userBatch = this.firebaseService.db.batch();
                users.forEach(doc => {
                    userBatch.update(doc.ref, {
                        totalScore: 0,
                        completedTasks: {},
                        achievements: [],
                        lastActivity: null
                    });
                });
                await userBatch.commit();
                
                alert('Event reset successfully');
                this.loadOverview();
            } catch (error) {
                console.error('Error resetting event:', error);
                alert('Failed to reset event');
            }
        }
        
        // Clear localStorage
        localStorage.clear();
        sessionStorage.setItem('ironTurtle_admin', 'true'); // Keep admin logged in
    }

    changeAdminPin() {
        const newPin = document.getElementById('new-admin-pin').value;
        if (newPin && newPin.length >= 4) {
            this.adminPin = newPin;
            localStorage.setItem('ironTurtle_adminPin', newPin);
            alert('Admin PIN changed successfully');
            document.getElementById('new-admin-pin').value = '';
        } else {
            alert('PIN must be at least 4 characters');
        }
    }

    // New bulk operation methods
    toggleSelectAll() {
        const selectAll = document.getElementById('select-all-users');
        const checkboxes = document.querySelectorAll('.user-select');
        checkboxes.forEach(cb => {
            cb.checked = selectAll.checked;
        });
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        const selected = document.querySelectorAll('.user-select:checked');
        document.getElementById('selected-count').textContent = selected.length;
        document.getElementById('bulk-delete-btn').disabled = selected.length === 0;
    }

    filterParticipants() {
        const searchTerm = document.getElementById('participant-search').value.toLowerCase();
        const rows = document.querySelectorAll('#participants-table tbody tr');
        
        rows.forEach(row => {
            const userName = row.getAttribute('data-user-name');
            if (userName && userName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    selectInactiveUsers() {
        const checkboxes = document.querySelectorAll('.user-select');
        checkboxes.forEach(cb => {
            const row = cb.closest('tr');
            const daysInactive = parseInt(row.getAttribute('data-days-inactive'));
            cb.checked = daysInactive > 30;
        });
        this.updateSelectionCount();
    }

    async bulkDeleteUsers() {
        const selected = document.querySelectorAll('.user-select:checked');
        if (selected.length === 0) {
            alert('No users selected');
            return;
        }

        const users = [];
        let totalActivities = 0;
        selected.forEach(cb => {
            users.push({
                id: cb.value,
                name: cb.getAttribute('data-name'),
                activities: parseInt(cb.getAttribute('data-activities'))
            });
            totalActivities += parseInt(cb.getAttribute('data-activities'));
        });

        // Confirmation
        const confirmMessage = `⚠️ BULK DELETE WARNING ⚠️\n\n` +
            `You are about to delete ${users.length} users:\n` +
            users.map(u => `• ${u.name} (${u.activities} activities)`).join('\n') + '\n\n' +
            `Total activities to be deleted: ${totalActivities}\n\n` +
            `This action CANNOT be undone!\n\n` +
            `Are you sure?`;

        if (!confirm(confirmMessage)) return;

        // PIN verification
        const enteredPin = prompt('Enter admin PIN (1234) to confirm bulk deletion:');
        if (enteredPin !== '1234') {
            alert('Incorrect PIN. Deletion cancelled.');
            return;
        }

        // Perform bulk deletion
        if (this.firebaseService) {
            try {
                let successCount = 0;
                let failCount = 0;
                
                for (const user of users) {
                    try {
                        await this.firebaseService.deleteUser(user.id);
                        successCount++;
                    } catch (error) {
                        console.error(`Failed to delete user ${user.name}:`, error);
                        failCount++;
                    }
                }
                
                alert(`Bulk deletion complete!\n\n` +
                      `✅ Successfully deleted: ${successCount} users\n` +
                      `❌ Failed: ${failCount} users`);
                
                // Reload the participants list
                await this.loadParticipants();
            } catch (error) {
                console.error('Bulk deletion error:', error);
                alert('Bulk deletion failed. Check console for details.');
            }
        } else {
            alert('Firebase service not available for bulk deletion.');
        }
    }

    async viewUserDetails(userId) {
        // TODO: Implement user details view
        alert('User details view coming soon!');
    }

    async loadRecovery() {
        const container = document.getElementById('recovery-content');
        
        try {
            let deletedUsers = [];
            
            if (this.firebaseService) {
                deletedUsers = await this.firebaseService.getDeletedUsers();
            }
            
            let html = `
                <div class="card">
                    <div class="card-header">
                        <h6>🔄 Deleted Users Recovery</h6>
                    </div>
                    <div class="card-body">`;
            
            if (deletedUsers.length === 0) {
                html += '<p class="text-muted">No deleted users to recover</p>';
            } else {
                html += `
                    <div class="alert alert-info">
                        <strong>Note:</strong> Soft-deleted users can be restored within 30 days of deletion.
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Score</th>
                                    <th>Deleted Date</th>
                                    <th>Days Remaining</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>`;
                
                deletedUsers.forEach(user => {
                    const deletedDate = user.deletedAt ? user.deletedAt.toDate() : new Date();
                    const daysSinceDeleted = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
                    const daysRemaining = Math.max(0, 30 - daysSinceDeleted);
                    const canRestore = daysRemaining > 0;
                    
                    html += `
                        <tr class="${!canRestore ? 'table-danger' : ''}">
                            <td>${user.name}</td>
                            <td>${user.archivedData?.totalScore || user.totalScore || 0}</td>
                            <td>${deletedDate.toLocaleDateString()}</td>
                            <td>
                                ${canRestore ? 
                                    `<span class="badge bg-warning">${daysRemaining} days</span>` : 
                                    '<span class="badge bg-danger">Expired</span>'}
                            </td>
                            <td>
                                ${canRestore ? 
                                    `<button class="btn btn-sm btn-success" 
                                            onclick="adminDashboard.restoreUser('${user.id}', '${user.name}')">
                                        ♻️ Restore
                                    </button>` :
                                    `<button class="btn btn-sm btn-danger" 
                                            onclick="adminDashboard.permanentlyDeleteUser('${user.id}', '${user.name}')">
                                        🗑️ Delete Permanently
                                    </button>`}
                            </td>
                        </tr>`;
                });
                
                html += `
                            </tbody>
                        </table>
                    </div>`;
            }
            
            html += `
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h6>⚙️ Recovery Settings</h6>
                    </div>
                    <div class="card-body">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="enable-soft-delete" 
                                   ${this.softDeleteEnabled ? 'checked' : ''} 
                                   onchange="adminDashboard.toggleSoftDelete()">
                            <label class="form-check-label" for="enable-soft-delete">
                                Enable soft delete (30-day recovery period)
                            </label>
                        </div>
                        <small class="text-muted">
                            When enabled, deleted users are kept for 30 days before permanent deletion.
                        </small>
                    </div>
                </div>`;
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading recovery:', error);
            container.innerHTML = '<div class="alert alert-danger">Error loading recovery data</div>';
        }
    }

    async restoreUser(userId, userName) {
        if (confirm(`Restore user "${userName}" and all their activities?`)) {
            if (this.firebaseService) {
                try {
                    const result = await this.firebaseService.restoreUser(userId);
                    alert(`User "${userName}" restored successfully with ${result.activitiesRestored} activities.`);
                    await this.loadRecovery();
                } catch (error) {
                    console.error('Error restoring user:', error);
                    alert('Failed to restore user. Check console for details.');
                }
            }
        }
    }

    async permanentlyDeleteUser(userId, userName) {
        if (confirm(`⚠️ PERMANENTLY delete "${userName}"? This cannot be undone!`)) {
            const confirmation = prompt('Type "DELETE" to confirm permanent deletion:');
            if (confirmation === 'DELETE') {
                if (this.firebaseService) {
                    try {
                        await this.firebaseService.deleteUser(userId, false); // Hard delete
                        alert(`User "${userName}" permanently deleted.`);
                        await this.loadRecovery();
                    } catch (error) {
                        console.error('Error permanently deleting user:', error);
                        alert('Failed to delete user. Check console for details.');
                    }
                }
            }
        }
    }

    toggleSoftDelete() {
        this.softDeleteEnabled = !this.softDeleteEnabled;
        localStorage.setItem('ironTurtle_softDeleteEnabled', this.softDeleteEnabled);
    }
}

// Initialize admin dashboard when page loads
// Check for admin page by multiple criteria to handle different deployment scenarios
const isAdminPage = 
    window.location.pathname.includes('admin') || 
    window.location.href.includes('admin') ||
    document.title.includes('Admin') ||
    document.querySelector('#admin-login') !== null;

if (isAdminPage) {
    console.log('🔐 Detected admin page, initializing...');
    
    // Wait for both DOM and Firebase to be ready
    function initializeAdminDashboard() {
        // Check if we should wait for Firebase
        const shouldWaitForFirebase = typeof firebase !== 'undefined';
        
        if (shouldWaitForFirebase && !window.firebaseService) {
            console.log('⏳ Waiting for Firebase initialization...');
            // Wait up to 5 seconds for Firebase to initialize
            let attempts = 0;
            const maxAttempts = 50;
            
            const firebaseWaitInterval = setInterval(() => {
                attempts++;
                
                if (window.firebaseService || attempts >= maxAttempts) {
                    clearInterval(firebaseWaitInterval);
                    
                    if (window.firebaseService) {
                        console.log('✅ Firebase ready, initializing admin dashboard');
                    } else {
                        console.warn('⚠️ Firebase timeout, initializing admin dashboard without Firebase');
                    }
                    
                    window.adminDashboard = new AdminDashboard();
                } else {
                    console.log(`⏳ Still waiting for Firebase... (${attempts}/${maxAttempts})`);
                }
            }, 100);
        } else {
            // Firebase not needed or already ready
            console.log('✅ Initializing admin dashboard immediately');
            window.adminDashboard = new AdminDashboard();
        }
    }
    
    document.addEventListener('DOMContentLoaded', initializeAdminDashboard);
} else {
    console.log('📝 Not an admin page, skipping admin dashboard initialization');
}