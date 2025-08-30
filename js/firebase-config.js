// Firebase configuration
// Note: This is a demo configuration. For production, replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDoHa9V7R27UUrMj2dKKACKpcO82BPuUM8",
  authDomain: "iron-turtle-tracker.firebaseapp.com",
  databaseURL: "https://iron-turtle-tracker-default-rtdb.firebaseio.com",
  projectId: "iron-turtle-tracker",
  storageBucket: "iron-turtle-tracker.firebasestorage.app",
  messagingSenderId: "923369775122",
  appId: "1:923369775122:web:71cd2023c2b92148f7f8cb"
};

// Initialize Firebase (only if config is provided and Firebase SDK is loaded)
let firebaseInitialized = false;
if (firebaseConfig.apiKey && typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        firebaseInitialized = true;
        console.log('✅ Firebase initialized successfully');

        // Initialize Firebase services
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        // Create Firebase service class
        class FirebaseService {
            constructor() {
                this.auth = auth;
                this.db = db;
                this.currentUser = null;
                this.authStateUnsubscribe = null;
                
                // Store the unsubscribe function for cleanup
                this.authStateUnsubscribe = this.auth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    if (user) {
                        console.log('User signed in:', user.displayName || 'Anonymous');
                        this.syncUserData(user);
                    } else {
                        console.log('User signed out');
                    }
                });
            }
            
            // Clean up auth listener
            cleanupAuthListener() {
                if (this.authStateUnsubscribe) {
                    this.authStateUnsubscribe();
                    this.authStateUnsubscribe = null;
                }
            }

            // Sign in anonymously with a display name
            async signInAnonymously(displayName) {
                try {
                    // Sanitize the display name to use as document ID
                    const sanitizedName = this.sanitizeUsername(displayName);
                    
                    // IMPORTANT: Enhanced duplicate checking to prevent multiple users with same name
                    // Check 1: By sanitized name (primary document ID)
                    const userDoc = await this.db.collection('users').doc(sanitizedName).get();
                    let existingUser = userDoc.exists ? userDoc.data() : null;
                    let existingUserId = userDoc.exists ? userDoc.id : null;
                    
                    // Check 2: By exact name (case-sensitive) to catch any edge cases
                    if (!existingUser) {
                        const nameQuery = await this.db.collection('users')
                            .where('name', '==', displayName)
                            .where('isDeleted', '!=', true)  // Exclude deleted users
                            .limit(1)
                            .get();
                        
                        if (!nameQuery.empty) {
                            existingUser = nameQuery.docs[0].data();
                            existingUserId = nameQuery.docs[0].id;
                            console.warn(`Found existing user by exact name match: ${displayName} -> ${existingUserId}`);
                        }
                    }
                    
                    // Check 3: By case-insensitive name to catch variations like "Donkey" vs "donkey"
                    if (!existingUser) {
                        const caseInsensitiveQuery = await this.db.collection('users')
                            .where('nameLowercase', '==', displayName.toLowerCase().trim())
                            .where('isDeleted', '!=', true)  // Exclude deleted users
                            .limit(1)
                            .get();
                        
                        if (!caseInsensitiveQuery.empty) {
                            existingUser = caseInsensitiveQuery.docs[0].data();
                            existingUserId = caseInsensitiveQuery.docs[0].id;
                            console.warn(`Found existing user by case-insensitive match: ${displayName} -> ${existingUserId}`);
                        }
                    }
                    
                    // Always create a new anonymous session (required by Firebase)
                    const userCredential = await this.auth.signInAnonymously();
                    const user = userCredential.user;
                    
                    // Update profile with display name
                    await user.updateProfile({
                        displayName: displayName
                    });
                    
                    if (existingUser) {
                        // User exists - just update the currentUID for this session
                        // Use the existing user's document ID (might be different from current sanitizedName)
                        await this.db.collection('users').doc(existingUserId).set({
                            ...existingUser,  // Preserve existing data
                            name: displayName,  // Update to current input (preserves case preference)
                            sanitizedName: existingUserId,  // Keep original sanitized name
                            nameLowercase: displayName.toLowerCase().trim(),  // For case-insensitive searches
                            currentUID: user.uid,
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });  // Use merge to preserve existing fields
                        
                        // Update user object to use existing ID for consistency
                        user.sanitizedName = existingUserId;
                        
                        console.log('Returning user:', displayName, 'Score:', existingUser.totalScore, 'ID:', existingUserId);
                    } else {
                        // New user - create their document using sanitized name as ID
                        // First, do a final check to ensure no duplicate by using a transaction
                        await this.db.runTransaction(async (transaction) => {
                            const userRef = this.db.collection('users').doc(sanitizedName);
                            const doc = await transaction.get(userRef);
                            
                            if (!doc.exists) {
                                // Safe to create new user
                                transaction.set(userRef, {
                                    name: displayName,
                                    sanitizedName: sanitizedName,
                                    nameLowercase: displayName.toLowerCase().trim(),  // For case-insensitive searches
                                    currentUID: user.uid,
                                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                                    totalScore: 0,
                                    completedTasks: {}
                                });
                                console.log('New user registered:', displayName);
                            } else {
                                // User was created between our check and now - update instead
                                transaction.update(userRef, {
                                    currentUID: user.uid,
                                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                                });
                                console.log('Race condition avoided - updating existing user:', displayName);
                            }
                        });
                    }
                    
                    // Store username in localStorage for session persistence
                    localStorage.setItem('ironTurtle_username', displayName);
                    
                    // Attach the sanitized name to the user object for reference
                    user.sanitizedName = sanitizedName;
                    
                    return user;
                } catch (error) {
                    console.error('Error signing in anonymously:', error);
                    throw error;
                }
            }
            
            // Helper function to sanitize username for use as document ID
            sanitizeUsername(name) {
                // Replace spaces with underscores and remove special characters
                return name.toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '')
                    .substring(0, 50); // Limit length
            }
            
            // Find user by name
            async findUserByName(name) {
                try {
                    const snapshot = await this.db.collection('users')
                        .where('name', '==', name)
                        .limit(1)
                        .get();
                    
                    if (!snapshot.empty) {
                        return {
                            id: snapshot.docs[0].id,
                            ...snapshot.docs[0].data()
                        };
                    }
                    return null;
                } catch (error) {
                    console.error('Error finding user by name:', error);
                    return null;
                }
            }

            // Sign out user
            async signOut() {
                try {
                    await this.auth.signOut();
                } catch (error) {
                    console.error('Error signing out:', error);
                    throw error;
                }
            }

            // Sync user data from Firestore
            async syncUserData(user) {
                try {
                    // Use sanitized name as document ID, not uid
                    const sanitizedName = user.sanitizedName || this.sanitizeUsername(user.displayName || 'Anonymous Player');
                    const userDoc = await this.db.collection('users').doc(sanitizedName).get();
                    if (!userDoc.exists) {
                        // Create user document if it doesn't exist
                        await this.db.collection('users').doc(sanitizedName).set({
                            name: user.displayName || 'Anonymous Player',
                            sanitizedName: sanitizedName,
                            currentUID: user.uid,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            totalScore: 0,
                            completedTasks: {}
                        });
                    } else {
                        // Update the currentUID for this session
                        await this.db.collection('users').doc(sanitizedName).update({
                            currentUID: user.uid,
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                } catch (error) {
                    console.error('Error syncing user data:', error);
                }
            }

            // Get user's activities
            async getUserActivities(userIdentifier) {
                try {
                    // Try with ordered query first (requires index)
                    let snapshot;
                    let needsClientSideSort = false;
                    
                    try {
                        snapshot = await this.db.collection('activities')
                            .where('userSanitizedName', '==', userIdentifier)
                            .orderBy('timestamp', 'desc')
                            .get();
                    } catch (indexError) {
                        console.warn('Index not available, falling back to unordered query:', indexError.message);
                        // Fallback: query without orderBy to avoid index requirement
                        snapshot = await this.db.collection('activities')
                            .where('userSanitizedName', '==', userIdentifier)
                            .get();
                        needsClientSideSort = true;
                    }
                    
                    if (snapshot.empty) {
                        // Fallback to userId for backward compatibility
                        try {
                            const uidSnapshot = await this.db.collection('activities')
                                .where('userId', '==', userIdentifier)
                                .orderBy('timestamp', 'desc')
                                .get();
                            
                            return uidSnapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                        } catch (uidIndexError) {
                            console.warn('Index not available for userId query, falling back to unordered:', uidIndexError.message);
                            const uidSnapshot = await this.db.collection('activities')
                                .where('userId', '==', userIdentifier)
                                .get();
                            
                            return uidSnapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            })).sort((a, b) => {
                                // Client-side sorting by timestamp
                                const aTime = a.timestamp ? a.timestamp.toMillis() : 0;
                                const bTime = b.timestamp ? b.timestamp.toMillis() : 0;
                                return bTime - aTime; // desc order
                            });
                        }
                    }
                    
                    const activities = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    // Sort client-side if we used unordered query
                    if (needsClientSideSort) {
                        activities.sort((a, b) => {
                            const aTime = a.timestamp ? a.timestamp.toMillis() : 0;
                            const bTime = b.timestamp ? b.timestamp.toMillis() : 0;
                            return bTime - aTime; // desc order
                        });
                    }
                    
                    return activities;
                } catch (error) {
                    console.error('Error getting user activities:', error);
                    return [];
                }
            }

            // Log new activity
            async logActivity(userId, activityData) {
                try {
                    const docRef = await this.db.collection('activities').add({
                        userId: userId,
                        ...activityData,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // Update user's total score
                    await this.updateUserScore(userId);
                    
                    return docRef.id;
                } catch (error) {
                    console.error('Error logging activity:', error);
                    throw error;
                }
            }

            // Update user's total score with enhanced error handling and validation
            async updateUserScore(sanitizedName, retryCount = 0) {
                const maxRetries = 3;
                try {
                    // Use transaction to ensure atomic read-calculate-update
                    await this.db.runTransaction(async (transaction) => {
                        const userRef = this.db.collection('users').doc(sanitizedName);
                        const userDoc = await transaction.get(userRef);
                        
                        if (!userDoc.exists) {
                            console.warn(`User ${sanitizedName} does not exist, skipping score update`);
                            return;
                        }
                        
                        // Get activities and calculate score
                        const activities = await this.getUserActivities(sanitizedName);
                        const calculatedScore = activities.reduce((sum, activity) => {
                            const points = window.DataUtils ? 
                                window.DataUtils.validateNumber(activity.points, 0) : 
                                (activity.points || 0);
                            return sum + points;
                        }, 0);
                        
                        const userData = userDoc.data();
                        const currentStoredScore = userData.totalScore || 0;
                        
                        // Only update if scores differ
                        if (currentStoredScore !== calculatedScore) {
                            const updates = {
                                totalScore: calculatedScore,
                                lastScoreRecalculation: firebase.firestore.FieldValue.serverTimestamp(),
                                scoreRecalculationReason: 'sync-fix',
                                activitiesCount: activities.length
                            };
                            
                            transaction.update(userRef, updates);
                            console.log(`📊 Score updated for ${sanitizedName}: ${currentStoredScore} → ${calculatedScore} points (${activities.length} activities)`);
                        } else {
                            console.log(`✅ Score already synchronized for ${sanitizedName}: ${calculatedScore} points`);
                        }
                    });
                } catch (error) {
                    console.error(`❌ Error updating user score for ${sanitizedName}:`, error);
                    
                    // Retry logic for transient errors
                    if (retryCount < maxRetries && (
                        error.code === 'aborted' || 
                        error.code === 'unavailable' ||
                        error.message.includes('timeout')
                    )) {
                        console.log(`🔄 Retrying score update for ${sanitizedName} (attempt ${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                        return this.updateUserScore(sanitizedName, retryCount + 1);
                    }
                    
                    throw error;
                }
            }

            // Recalculate all user scores with enhanced progress tracking and batch processing
            async recalculateAllUserScores(progressCallback = null) {
                try {
                    console.log('🔄 Starting comprehensive score recalculation...');
                    const startTime = Date.now();
                    
                    // Get all users
                    const usersSnapshot = await this.db.collection('users').get();
                    const allUsers = usersSnapshot.docs.map(doc => ({
                        id: doc.id,
                        data: doc.data()
                    }));
                    
                    // Filter to active users only
                    const activeUsers = allUsers.filter(user => !user.data.isDeleted);
                    console.log(`📋 Found ${activeUsers.length} active users to process (${allUsers.length - activeUsers.length} deleted/skipped)`);
                    
                    let updatedCount = 0;
                    let skippedCount = 0;
                    let errorCount = 0;
                    const errors = [];
                    
                    // Process in batches of 10 to avoid overwhelming Firebase
                    const batchSize = 10;
                    for (let i = 0; i < activeUsers.length; i += batchSize) {
                        const batch = activeUsers.slice(i, i + batchSize);
                        
                        // Process batch in parallel
                        const batchPromises = batch.map(async (user) => {
                            try {
                                const beforeUpdate = Date.now();
                                await this.updateUserScore(user.id);
                                const updateTime = Date.now() - beforeUpdate;
                                
                                updatedCount++;
                                console.log(`✅ [${updatedCount}/${activeUsers.length}] ${user.data.name} (${updateTime}ms)`);
                                
                                // Call progress callback if provided
                                if (progressCallback) {
                                    progressCallback({
                                        current: updatedCount + skippedCount + errorCount,
                                        total: activeUsers.length,
                                        updated: updatedCount,
                                        skipped: skippedCount,
                                        errors: errorCount,
                                        currentUser: user.data.name
                                    });
                                }
                            } catch (error) {
                                errorCount++;
                                const errorInfo = {
                                    user: user.data.name,
                                    id: user.id,
                                    error: error.message
                                };
                                errors.push(errorInfo);
                                console.error(`❌ [${updatedCount + errorCount}/${activeUsers.length}] Failed to update ${user.data.name}:`, error);
                            }
                        });
                        
                        await Promise.all(batchPromises);
                        
                        // Small delay between batches to prevent rate limiting
                        if (i + batchSize < activeUsers.length) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }
                    
                    const totalTime = Date.now() - startTime;
                    const summary = {
                        totalUsers: activeUsers.length,
                        updatedCount,
                        skippedCount,
                        errorCount,
                        totalTime,
                        errors
                    };
                    
                    console.log(`🎯 Score recalculation completed in ${totalTime}ms:`);
                    console.log(`  ✅ Successfully updated: ${updatedCount} users`);
                    console.log(`  ⏭️  Skipped (already synced): ${skippedCount} users`);
                    console.log(`  ❌ Errors: ${errorCount} users`);
                    
                    if (errors.length > 0) {
                        console.warn('❌ Users with errors:', errors);
                    }
                    
                    return summary;
                } catch (error) {
                    console.error('💥 Fatal error during score recalculation:', error);
                    throw error;
                }
            }

            // Get leaderboard
            async getLeaderboard() {
                try {
                    const snapshot = await this.db.collection('users')
                        .orderBy('totalScore', 'desc')
                        .get();
                    
                    return snapshot.docs
                        .filter(doc => !doc.data().isDeleted)  // Filter out soft-deleted users
                        .slice(0, 10)
                        .map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                } catch (error) {
                    console.error('Error getting leaderboard:', error);
                    return [];
                }
            }

            // Get most popular activities
            async getMostPopularActivities() {
                try {
                    // First, get all active users (users with points > 0)
                    const usersSnapshot = await this.db.collection('users')
                        .where('totalScore', '>', 0)
                        .get();
                    
                    // If no users have points, return empty array
                    if (usersSnapshot.empty) {
                        return [];
                    }
                    
                    // Get list of active user IDs (sanitized names)
                    const activeUserIds = new Set();
                    usersSnapshot.docs.forEach(doc => {
                        activeUserIds.add(doc.id); // doc.id is the sanitized name
                    });
                    
                    // Now get activities only from active users
                    const activitiesSnapshot = await this.db.collection('activities').get();
                    const activityCounts = {};
                    
                    // Count occurrences of each activity, but only from active users
                    activitiesSnapshot.docs.forEach(doc => {
                        const activity = doc.data();
                        const userSanitizedName = activity.userSanitizedName;
                        const activityId = activity.activityId;
                        
                        // Only count if activity belongs to an active user
                        if (activityId && userSanitizedName && activeUserIds.has(userSanitizedName)) {
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
                } catch (error) {
                    console.error('Error getting popular activities:', error);
                    return [];
                }
            }

            // Delete activity from Firebase
            async deleteActivity(activityDocId, userId, points, activityDefId, isOneTimeTask) {
                try {
                    // Use transaction for atomic cascade deletion
                    await this.db.runTransaction(async (transaction) => {
                        // Get the activity to be deleted
                        const activityRef = this.db.collection('activities').doc(activityDocId);
                        const activityDoc = await transaction.get(activityRef);
                        
                        if (!activityDoc.exists) {
                            throw new Error('Activity not found');
                        }
                        
                        const activityData = activityDoc.data();
                        const userSanitizedName = activityData.userSanitizedName || userId;
                        const userRef = this.db.collection('users').doc(userSanitizedName);
                        
                        // Get current user document
                        const userDoc = await transaction.get(userRef);
                        
                        if (!userDoc.exists) {
                            console.warn('User document not found for deletion cascade');
                        }
                        
                        // Delete the activity
                        transaction.delete(activityRef);
                        
                        // Update user's total score (subtract points)
                        const validPoints = window.DataUtils ? 
                            window.DataUtils.validateNumber(points, 0) : 
                            points;
                        
                        const updates = {
                            totalScore: firebase.firestore.FieldValue.increment(-validPoints),
                            lastModified: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        
                        // If it's a one-time task, check if there are other instances
                        if (isOneTimeTask && activityDefId) {
                            // Query for other activities of the same type (outside transaction)
                            // Note: We can't use non-transactional reads inside a transaction
                            // So we'll handle the one-time task cleanup separately
                            updates[`completedTasks.${activityDefId}`] = firebase.firestore.FieldValue.delete();
                        }
                        
                        // Apply all updates to user document
                        if (userDoc.exists) {
                            transaction.update(userRef, updates);
                        }
                    });
                    
                    // Check for other instances of one-time tasks after transaction
                    if (isOneTimeTask && activityDefId) {
                        const userSanitizedName = userId.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        const otherActivities = await this.db.collection('activities')
                            .where('userSanitizedName', '==', userSanitizedName)
                            .where('activityId', '==', activityDefId)
                            .limit(1)
                            .get();
                        
                        // If other instances exist, re-mark as completed
                        if (!otherActivities.empty) {
                            const userRef = this.db.collection('users').doc(userSanitizedName);
                            await userRef.update({
                                [`completedTasks.${activityDefId}`]: true
                            });
                        }
                    }
                    
                    console.log('Activity deleted from Firebase with cascade');
                    return true;
                } catch (error) {
                    console.error('Error deleting activity from Firebase:', error);
                    throw error;
                }
            }

            // Delete user and all associated data (with soft delete option)
            async deleteUser(sanitizedName, softDelete = false) {
                try {
                    if (softDelete) {
                        // Soft delete - mark as deleted but keep data
                        const userRef = this.db.collection('users').doc(sanitizedName);
                        const userDoc = await userRef.get();
                        
                        if (!userDoc.exists) {
                            throw new Error('User not found');
                        }
                        
                        // Update user document with deletion info
                        await userRef.update({
                            isDeleted: true,
                            deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            deletionMethod: 'soft',
                            // Archive current data
                            archivedData: {
                                ...userDoc.data(),
                                archiveTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                            }
                        });
                        
                        // Mark all activities as deleted
                        const activitiesSnapshot = await this.db.collection('activities')
                            .where('userSanitizedName', '==', sanitizedName)
                            .get();
                        
                        const batch = this.db.batch();
                        activitiesSnapshot.forEach(doc => {
                            batch.update(doc.ref, {
                                isDeleted: true,
                                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        });
                        await batch.commit();
                        
                        console.log(`User ${sanitizedName} soft deleted (${activitiesSnapshot.size} activities marked as deleted)`);
                        return {
                            success: true,
                            softDeleted: true,
                            activitiesDeleted: activitiesSnapshot.size
                        };
                    } else {
                        // Hard delete - permanently remove data
                        // First, get all user's activities
                        const activitiesSnapshot = await this.db.collection('activities')
                            .where('userSanitizedName', '==', sanitizedName)
                            .get();
                        
                        // Use batch for efficient deletion
                        const batch = this.db.batch();
                        
                        // Delete all activities
                        activitiesSnapshot.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        
                        // Delete the user document
                        const userRef = this.db.collection('users').doc(sanitizedName);
                        batch.delete(userRef);
                        
                        // Commit the batch
                        await batch.commit();
                        
                        console.log(`User ${sanitizedName} and ${activitiesSnapshot.size} activities permanently deleted`);
                        return {
                            success: true,
                            hardDeleted: true,
                            activitiesDeleted: activitiesSnapshot.size
                        };
                    }
                } catch (error) {
                    console.error('Error deleting user:', error);
                    throw error;
                }
            }
            
            // Restore soft-deleted user
            async restoreUser(sanitizedName) {
                try {
                    const userRef = this.db.collection('users').doc(sanitizedName);
                    const userDoc = await userRef.get();
                    
                    if (!userDoc.exists) {
                        throw new Error('User not found');
                    }
                    
                    const userData = userDoc.data();
                    if (!userData.isDeleted) {
                        throw new Error('User is not deleted');
                    }
                    
                    // Restore user document
                    await userRef.update({
                        isDeleted: firebase.firestore.FieldValue.delete(),
                        deletedAt: firebase.firestore.FieldValue.delete(),
                        deletionMethod: firebase.firestore.FieldValue.delete(),
                        archivedData: firebase.firestore.FieldValue.delete(),
                        restoredAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    // Restore all activities
                    const activitiesSnapshot = await this.db.collection('activities')
                        .where('userSanitizedName', '==', sanitizedName)
                        .where('isDeleted', '==', true)
                        .get();
                    
                    const batch = this.db.batch();
                    activitiesSnapshot.forEach(doc => {
                        batch.update(doc.ref, {
                            isDeleted: firebase.firestore.FieldValue.delete(),
                            deletedAt: firebase.firestore.FieldValue.delete()
                        });
                    });
                    await batch.commit();
                    
                    console.log(`User ${sanitizedName} restored (${activitiesSnapshot.size} activities restored)`);
                    return {
                        success: true,
                        activitiesRestored: activitiesSnapshot.size
                    };
                } catch (error) {
                    console.error('Error restoring user:', error);
                    throw error;
                }
            }
            
            // Get deleted users (for recovery purposes)
            async getDeletedUsers() {
                try {
                    const snapshot = await this.db.collection('users')
                        .where('isDeleted', '==', true)
                        .orderBy('deletedAt', 'desc')
                        .get();
                    
                    const deletedUsers = [];
                    snapshot.forEach(doc => {
                        deletedUsers.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    return deletedUsers;
                } catch (error) {
                    console.error('Error fetching deleted users:', error);
                    return [];
                }
            }
        }

        // Create global Firebase service instance
        window.firebaseService = new FirebaseService();
        console.log('✅ Firestore connected');

    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        window.firebaseService = null;
    }
} else {
    if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase SDK not loaded - running in localStorage-only mode');
    } else {
        console.log('⚠️ Firebase config not provided - running in localStorage-only mode');
    }
    window.firebaseService = null;
}

// Export Firebase status for other modules
window.FIREBASE_ENABLED = firebaseInitialized;
