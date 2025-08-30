# Firebase Deployment Guide - Iron Turtle Challenge Tracker

## Overview
This guide covers deploying and configuring the Firebase backend for the Iron Turtle Challenge Tracker application.

## Prerequisites
- Firebase project created: `iron-turtle-tracker`
- Firebase CLI installed: `npm install -g firebase-tools`
- Project access to Firebase Console

## 🔒 Critical Security Setup (REQUIRED)

### 1. Apply Firestore Security Rules

**⚠️ CRITICAL: Must be done before production use!**

1. Go to [Firebase Console](https://console.firebase.google.com/project/iron-turtle-tracker/firestore/rules)
2. Replace the existing rules with the contents of `firestore.rules`
3. Click "Publish"

Or use Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

### 2. Enable Authentication
1. Go to [Authentication Settings](https://console.firebase.google.com/project/iron-turtle-tracker/authentication/providers)
2. Enable "Anonymous" authentication
3. Save changes

### 3. Configure Authorized Domains
1. Go to Authentication > Settings
2. Add your production domain to "Authorized domains"
3. Save changes

## 🚀 Deployment Steps

### Option 1: Firebase Hosting (Recommended)

1. Initialize Firebase in your project:
```bash
firebase init
```
Select:
- Hosting
- Use existing project: `iron-turtle-tracker`
- Public directory: `.` (current directory)
- Single-page app: No
- GitHub deploys: Optional

2. Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

Your app will be available at: `https://iron-turtle-tracker.web.app`

### Option 2: Any Static Host

Since this is a client-side application, you can host it on any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any web server

Simply upload all files maintaining the directory structure.

## 📊 Database Initialization

### Create Required Indexes

Run this command to create indexes for better query performance:
```bash
firebase deploy --only firestore:indexes
```

Or manually in Firebase Console:
1. Go to Firestore > Indexes
2. Create composite index:
   - Collection: `activities`
   - Fields: `userId` (Ascending), `timestamp` (Descending)

## 🔧 Configuration

### Environment-Specific Config (Optional)

For better security, create environment-specific config files:

1. Create `js/firebase-config.prod.js`:
```javascript
const firebaseConfig = {
  // Production config
};
```

2. Create `js/firebase-config.dev.js`:
```javascript
const firebaseConfig = {
  // Development config
};
```

3. Update `index.html` to load the appropriate config based on environment.

## 📈 Monitoring & Maintenance

### Enable Monitoring
1. Go to Firebase Console > Performance
2. Add Performance SDK to track app performance
3. Monitor real-time database usage

### Set Budget Alerts
1. Go to Firebase Console > Usage and billing
2. Set budget alerts to avoid unexpected charges
3. Monitor Firestore read/write operations

### Backup Strategy
1. Enable automated Firestore backups:
```bash
gcloud firestore export gs://iron-turtle-tracker-backups
```

2. Schedule regular exports using Cloud Scheduler

## 🧪 Testing

### Test Security Rules
```bash
# Run security rules tests
firebase emulators:exec --only firestore "npm test"
```

### Test Firebase Connection
```bash
# Run the test script
./test-firebase-api.sh
```

### Load Testing
Use the test page to verify functionality:
1. Open `test-integration.html` in browser
2. Run through all test scenarios
3. Verify real-time updates work

## 🚨 Troubleshooting

### Common Issues

#### "Permission Denied" Errors
- Check Firestore security rules are published
- Verify user is authenticated
- Check browser console for detailed error

#### Real-time Updates Not Working
- Verify Firestore is enabled
- Check network connectivity
- Ensure listeners are properly set up

#### High Firebase Bills
- Review Firestore usage in Firebase Console
- Optimize queries to reduce reads
- Implement caching strategies
- Consider Firebase's free tier limits

### Debug Mode
Enable debug logging:
```javascript
firebase.firestore.setLogLevel('debug');
```

## 📝 Maintenance Checklist

### Daily
- [ ] Monitor error logs in Firebase Console
- [ ] Check active user count
- [ ] Verify real-time sync is working

### Weekly
- [ ] Review Firestore usage metrics
- [ ] Check security rules for any needed updates
- [ ] Backup important data

### Monthly
- [ ] Review and optimize queries
- [ ] Update dependencies
- [ ] Audit security rules
- [ ] Clean up old test data

## 🎯 Performance Optimization

### Firestore Best Practices
1. **Limit Query Results**: Always use `.limit()` for queries
2. **Indexed Queries**: Ensure all queries use indexes
3. **Batch Operations**: Use batch writes for multiple updates
4. **Offline Persistence**: Enable for better performance
```javascript
firebase.firestore().enablePersistence();
```

### Caching Strategy
1. Implement local caching for static data
2. Use Firestore's offline persistence
3. Minimize redundant reads

## 🔐 Security Checklist

- [x] Firestore security rules implemented
- [x] Anonymous authentication only
- [x] No sensitive data in client code
- [x] API keys restricted to domains
- [x] User data isolation enforced
- [x] Input validation on client
- [ ] Rate limiting implemented (optional)
- [ ] Audit logging enabled (optional)

## 📞 Support

For issues or questions:
1. Check Firebase Status: https://status.firebase.google.com/
2. Firebase Documentation: https://firebase.google.com/docs
3. Project Console: https://console.firebase.google.com/project/iron-turtle-tracker

## Next Steps

1. **Immediate**: Apply security rules to Firestore
2. **Before Launch**: Test all functionality with multiple users
3. **Post-Launch**: Monitor usage and optimize as needed
4. **Long-term**: Consider adding user accounts and data export features