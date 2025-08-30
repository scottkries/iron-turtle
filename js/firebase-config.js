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
                
                // Listen for authentication state changes
                this.auth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    if (user) {
                        console.log('User signed in:', user.displayName || 'Anonymous');
                        this.syncUserData(user);
                    } else {
                        console.log('User signed out');
                    }
                });
            }

            // Sign in anonymously with a display name
            async signInAnonymously(displayName) {
                try {
                    // Sanitize the display name to use as document ID
                    const sanitizedName = this.sanitizeUsername(displayName);
                    
                    // Check if user already exists
                    const userDoc = await this.db.collection('users').doc(sanitizedName).get();
                    const existingUser = userDoc.exists ? userDoc.data() : null;
                    
                    // Always create a new anonymous session (required by Firebase)
                    const userCredential = await this.auth.signInAnonymously();
                    const user = userCredential.user;
                    
                    // Update profile with display name
                    await user.updateProfile({
                        displayName: displayName
                    });
                    
                    if (existingUser) {
                        // User exists - just update the currentUID for this session
                        await this.db.collection('users').doc(sanitizedName).update({
                            currentUID: user.uid,
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        console.log('Returning user:', displayName, 'Score:', existingUser.totalScore);
                    } else {
                        // New user - create their document using sanitized name as ID
                        await this.db.collection('users').doc(sanitizedName).set({
                            name: displayName,
                            sanitizedName: sanitizedName,
                            currentUID: user.uid,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                            totalScore: 0,
                            completedTasks: {}
                        });
                        
                        console.log('New user registered:', displayName);
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
                    const userDoc = await this.db.collection('users').doc(user.uid).get();
                    if (!userDoc.exists) {
                        // Create user document if it doesn't exist
                        await this.db.collection('users').doc(user.uid).set({
                            name: user.displayName || 'Anonymous Player',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            totalScore: 0
                        });
                    }
                } catch (error) {
                    console.error('Error syncing user data:', error);
                }
            }

            // Get user's activities
            async getUserActivities(userIdentifier) {
                try {
                    // Support both UID and sanitized username
                    const snapshot = await this.db.collection('activities')
                        .where('userSanitizedName', '==', userIdentifier)
                        .orderBy('timestamp', 'desc')
                        .get();
                    
                    if (snapshot.empty) {
                        // Fallback to userId for backward compatibility
                        const uidSnapshot = await this.db.collection('activities')
                            .where('userId', '==', userIdentifier)
                            .orderBy('timestamp', 'desc')
                            .get();
                        
                        return uidSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                    }
                    
                    return snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
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

            // Update user's total score
            async updateUserScore(sanitizedName) {
                try {
                    const activities = await this.getUserActivities(sanitizedName);
                    const totalScore = activities.reduce((sum, activity) => sum + (activity.points || 0), 0);
                    
                    await this.db.collection('users').doc(sanitizedName).update({
                        totalScore: totalScore
                    });
                } catch (error) {
                    console.error('Error updating user score:', error);
                }
            }

            // Get leaderboard
            async getLeaderboard() {
                try {
                    const snapshot = await this.db.collection('users')
                        .orderBy('totalScore', 'desc')
                        .limit(10)
                        .get();
                    
                    return snapshot.docs.map(doc => ({
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
                    const snapshot = await this.db.collection('activities').get();
                    const activityCounts = {};
                    
                    // Count occurrences of each activity
                    snapshot.docs.forEach(doc => {
                        const activity = doc.data();
                        const activityId = activity.activityId;
                        if (activityId) {
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

            // Delete user and all associated data
            async deleteUser(sanitizedName) {
                try {
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
                    
                    console.log(`User ${sanitizedName} and ${activitiesSnapshot.size} activities deleted successfully`);
                    return {
                        success: true,
                        activitiesDeleted: activitiesSnapshot.size
                    };
                } catch (error) {
                    console.error('Error deleting user:', error);
                    throw error;
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
