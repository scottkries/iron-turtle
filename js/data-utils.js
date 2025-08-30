// Data standardization and validation utilities for Iron Turtle

class DataUtils {
    /**
     * Validates that a numeric value is finite and not NaN
     * @param {number} value - The value to validate
     * @param {number} defaultValue - Default value if validation fails
     * @returns {number} Valid number or default
     */
    static validateNumber(value, defaultValue = 0) {
        const num = Number(value);
        if (isNaN(num) || !isFinite(num)) {
            console.warn(`Invalid number detected: ${value}, using default: ${defaultValue}`);
            return defaultValue;
        }
        return num;
    }

    /**
     * Validates points calculation result
     * @param {number} points - Calculated points
     * @param {number} minPoints - Minimum allowed points (default -100)
     * @param {number} maxPoints - Maximum allowed points (default 10000)
     * @returns {number} Valid points within range
     */
    static validatePoints(points, minPoints = -100, maxPoints = 10000) {
        const validPoints = this.validateNumber(points, 0);
        
        if (validPoints < minPoints) {
            console.warn(`Points ${validPoints} below minimum ${minPoints}, clamping`);
            return minPoints;
        }
        
        if (validPoints > maxPoints) {
            console.warn(`Points ${validPoints} above maximum ${maxPoints}, clamping`);
            return maxPoints;
        }
        
        return Math.round(validPoints);
    }

    /**
     * Standardizes activity data structure for both Firebase and localStorage
     * @param {Object} activityData - Raw activity data
     * @returns {Object} Standardized activity object
     */
    static standardizeActivityData(activityData) {
        const standardized = {
            // Core fields - always present
            id: activityData.id || Date.now(),
            userId: activityData.userId || activityData.uid || null,
            userName: activityData.userName || 'Unknown User',
            userSanitizedName: activityData.userSanitizedName || this.sanitizeUsername(activityData.userName),
            activityId: activityData.activityId || null,
            activityName: activityData.activityName || 'Unknown Activity',
            category: activityData.category || 'other',
            
            // Points and scoring
            basePoints: this.validateNumber(activityData.basePoints, 0),
            points: this.validatePoints(activityData.points || activityData.finalPoints || 0),
            
            // Activity specifics
            multipliers: Array.isArray(activityData.multipliers) ? activityData.multipliers : [],
            quantity: this.validateNumber(activityData.quantity, 1),
            
            // Competition specific
            competitionResult: activityData.competitionResult || null,
            opponents: activityData.opponents || null,
            teamMembers: activityData.teamMembers || null,
            
            // Penalty specific
            penaltyCaught: activityData.penaltyCaught || false,
            
            // Song specific
            songOutcome: activityData.songOutcome || null,
            
            // Metadata
            metadata: this.standardizeMetadata(activityData.metadata),
            
            // Timestamps
            timestamp: activityData.timestamp || Date.now(),
            firebaseTimestamp: activityData.firebaseTimestamp || null
        };

        // Remove null fields for cleaner storage
        Object.keys(standardized).forEach(key => {
            if (standardized[key] === null || standardized[key] === undefined) {
                delete standardized[key];
            }
        });

        return standardized;
    }

    /**
     * Standardizes metadata structure
     * @param {Object} metadata - Raw metadata
     * @returns {Object} Standardized metadata
     */
    static standardizeMetadata(metadata) {
        if (!metadata) return {};
        
        return {
            // Optional user-provided fields
            location: metadata.location || null,
            witnesses: Array.isArray(metadata.witnesses) ? metadata.witnesses : [],
            notes: metadata.notes || null,
            hasPhoto: metadata.hasPhoto || false,
            
            // Competition specific metadata
            opponents: metadata.opponents || null,
            teamMembers: metadata.teamMembers || null,
            
            // System metadata
            deviceInfo: metadata.deviceInfo || {},
            timestamp: metadata.timestamp || Date.now()
        };
    }

    /**
     * Sanitizes username for use as Firebase document ID
     * @param {string} username - Raw username
     * @returns {string} Sanitized username
     */
    static sanitizeUsername(username) {
        if (!username) return 'anonymous';
        
        return username
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 50); // Limit length
    }

    /**
     * Converts Firebase activity to localStorage format
     * @param {Object} firebaseActivity - Activity from Firebase
     * @returns {Object} Activity in localStorage format
     */
    static firebaseToLocalStorage(firebaseActivity) {
        const standardized = this.standardizeActivityData(firebaseActivity);
        
        // Add localStorage specific fields
        standardized.localId = standardized.id;
        standardized.firebaseId = firebaseActivity.firebaseId || firebaseActivity.id;
        
        return standardized;
    }

    /**
     * Converts localStorage activity to Firebase format
     * @param {Object} localActivity - Activity from localStorage
     * @returns {Object} Activity in Firebase format
     */
    static localStorageToFirebase(localActivity) {
        const standardized = this.standardizeActivityData(localActivity);
        
        // Remove localStorage specific fields
        delete standardized.localId;
        delete standardized.id; // Firebase will generate its own ID
        
        return standardized;
    }

    /**
     * Validates multiplier applicability with consistent logic
     * @param {Object} activity - Activity object
     * @param {Object} multiplier - Multiplier object
     * @returns {boolean} Whether multiplier can be applied
     */
    static canApplyMultiplier(activity, multiplier) {
        if (!activity || !multiplier) return false;
        
        // Standardized logic for all categories
        const activityCategory = activity.category || 'other';
        
        // Check if multiplier explicitly applies to this category
        if (activityCategory === 'consumables' || activityCategory === 'consumable') {
            // For consumables (drinks/food), check if multiplier applies to consumables
            return multiplier.appliesToConsumables === true;
        } else {
            // For all other categories, check if multiplier applies to others
            return multiplier.appliesToOthers === true;
        }
    }

    /**
     * Calculates points with validation
     * @param {Object} activity - Activity definition
     * @param {Array} multipliers - Selected multiplier IDs
     * @param {number} quantity - Quantity
     * @param {Object} options - Additional options (competitionResult, penaltyCaught, songOutcome)
     * @returns {number} Calculated and validated points
     */
    static calculatePoints(activity, multipliers = [], quantity = 1, options = {}) {
        if (!activity) return 0;
        
        let basePoints = 0;
        
        // Handle special cases
        if (activity.id === 'cue_song' && activity.hasRiskPenalty) {
            basePoints = options.songOutcome === 'skipped' ? -5 : (activity.basePoints || 1);
        } else if (activity.category === 'competition') {
            basePoints = options.competitionResult === 'win' ? 
                (activity.winPoints || 0) : (activity.lossPoints || 0);
        } else {
            basePoints = activity.basePoints || 0;
        }
        
        // Apply penalty doubling if caught
        if (activity.category === 'penalty' && options.penaltyCaught) {
            basePoints *= 2;
        }
        
        // Validate base points
        basePoints = this.validateNumber(basePoints, 0);
        
        // Calculate total multiplier
        let totalMultiplier = 1;
        if (Array.isArray(multipliers) && multipliers.length > 0 && window.MULTIPLIERS) {
            multipliers.forEach(multId => {
                const multiplier = window.MULTIPLIERS.find(m => m.id === multId);
                if (multiplier && this.canApplyMultiplier(activity, multiplier)) {
                    totalMultiplier *= this.validateNumber(multiplier.factor, 1);
                }
            });
        }
        
        // Validate multiplier
        totalMultiplier = this.validateNumber(totalMultiplier, 1);
        
        // Validate quantity
        const validQuantity = this.validateNumber(quantity, 1);
        
        // Calculate and validate final points
        const rawPoints = basePoints * totalMultiplier * validQuantity;
        return this.validatePoints(rawPoints);
    }

    /**
     * Creates a transaction-safe update batch
     * @param {Object} firebaseDb - Firebase database reference
     * @returns {Object} Batch object for atomic operations
     */
    static createTransactionBatch(firebaseDb) {
        return firebaseDb.batch();
    }
}

// Export for use in other modules
window.DataUtils = DataUtils;