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

// Initialize Firebase (only if config is provided)
let firebaseInitialized = false;
if (firebaseConfig.apiKey) {
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
                    // Check if there's already an anonymous user with this name
                    const existingUser = await this.findUserByName(displayName);
                    
                    if (existingUser) {
                        // Sign in as existing anonymous user (stored in localStorage)
                        const storedAuth = localStorage.getItem(`ironTurtle_${displayName}`);
                        if (storedAuth) {
                            // We have their UID stored, but can't restore the session
                            // Create a new anonymous session and link to existing data
                            const userCredential = await this.auth.signInAnonymously();
                            const user = userCredential.user;
                            
                            // Update the existing user document with new UID
                            await this.db.collection('users').doc(existingUser.id).delete();
                            await this.db.collection('users').doc(user.uid).set({
                                name: displayName,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                totalScore: existingUser.totalScore || 0
                            });
                            
                            // Update profile
                            await user.updateProfile({
                                displayName: displayName
                            });
                            
                            return user;
                        }
                    }
                    
                    // Create new anonymous user
                    const userCredential = await this.auth.signInAnonymously();
                    const user = userCredential.user;
                    
                    // Update profile with display name
                    await user.updateProfile({
                        displayName: displayName
                    });

                    // Create user document in Firestore
                    await this.db.collection('users').doc(user.uid).set({
                        name: displayName,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        totalScore: 0
                    });
                    
                    // Store association in localStorage for future sessions
                    localStorage.setItem(`ironTurtle_${displayName}`, user.uid);

                    return user;
                } catch (error) {
                    console.error('Error signing in anonymously:', error);
                    throw error;
                }
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
            async getUserActivities(userId) {
                try {
                    const snapshot = await this.db.collection('activities')
                        .where('userId', '==', userId)
                        .orderBy('timestamp', 'desc')
                        .get();
                    
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
            async updateUserScore(userId) {
                try {
                    const activities = await this.getUserActivities(userId);
                    const totalScore = activities.reduce((sum, activity) => sum + (activity.points || 0), 0);
                    
                    await this.db.collection('users').doc(userId).update({
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
        }

        // Create global Firebase service instance
        window.firebaseService = new FirebaseService();
        console.log('✅ Firestore connected');

    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
    }
} else {
    console.log('⚠️ Firebase config not provided - running in localStorage-only mode');
}

// Export Firebase status for other modules
window.FIREBASE_ENABLED = firebaseInitialized;
