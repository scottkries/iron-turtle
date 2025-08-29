# Technical Requirements - Iron Turtle Tracker

## Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **CSS Framework**: Bootstrap 5.3 (CDN)
- **Database**: Firebase Realtime Database (CDN)
- **Local Storage**: HTML5 localStorage (user sessions only)
- **Deployment**: Netlify static hosting
- **Testing**: Manual testing on target devices

## Browser Compatibility
**Primary Targets** (must work perfectly):
- iOS Safari (iPhone)
- Chrome Mobile (Android)
- Desktop Chrome/Safari (backup access)

**Secondary Targets** (should work):
- Firefox Mobile
- Samsung Internet
- Edge Mobile

## Performance Requirements
- **Initial Load**: <2 seconds on 3G connection
- **Activity Search**: <200ms response time
- **UI Interactions**: <100ms button response
- **Local Storage**: <1MB total data size expected

## Device Requirements
- **Screen Sizes**: 320px - 1200px width
- **Touch Targets**: Minimum 44px for mobile taps
- **Orientation**: Portrait primary, landscape supported
- **Input Methods**: Touch-optimized, keyboard accessible

## Data Structure Requirements

### Firebase Realtime Database Structure
```javascript
// Firebase Database Root
{
  "activities": {
    "activity_1693401234567": {
      "user": "John Doe",
      "activity": "Beer",
      "basePoints": 2,
      "multipliers": ["boat", "usc"],
      "finalPoints": 8,
      "timestamp": "2025-08-30T14:30:00Z",
      "category": "consumable"
    },
    "activity_1693401345678": {
      "user": "Sarah Smith",
      "activity": "Cornhole Win", 
      "basePoints": 5,
      "multipliers": ["deck"],
      "finalPoints": 10,
      "timestamp": "2025-08-30T14:35:00Z",
      "category": "competition"
    }
  }
}
```

### Local Storage (User Sessions Only)
```javascript
// User Session (localStorage)
{
  currentUser: string,
  email: string,
  loginTime: timestamp
}

// Activities Database (Static JS file)
{
  consumables: [
    {
      id: string,
      name: string,
      basePoints: number,
      category: "drink" | "food"
    }
  ],
  // ... other categories
}
```

## Firebase Configuration
- **Database Rules**: Open read/write (no authentication required)
- **CDN Integration**: Firebase SDK loaded via CDN (no build process)
- **Simple Setup**: Single Firebase project with Realtime Database only

## Security & Privacy
- **Minimal Firebase setup**: Only Realtime Database, no authentication
- **Open database rules**: Anyone can read/write (acceptable for trusted event group)
- **No sensitive data**: Only recreational activity tracking
- **Local session storage**: User names stored locally for convenience

## Validation Requirements
Each requirement must pass these validation tests:

### Performance Validation
- [ ] Load time <2s on throttled 3G connection
- [ ] Activity search responds in <200ms with 50+ activities
- [ ] UI interactions feel responsive (<100ms visual feedback)
- [ ] App works with 20+ users and 200+ activities logged

### Compatibility Validation  
- [ ] Functions identically on iPhone Safari and Android Chrome
- [ ] Responsive design works from 320px to 1200px width
- [ ] Touch targets are easily tappable on mobile
- [ ] Works offline after initial load

### Data Validation
- [ ] localStorage persists through browser restart
- [ ] All activity types can be logged with correct point calculation
- [ ] Leaderboard updates immediately after activity submission
- [ ] No data corruption with concurrent usage simulation