# Technical Requirements - Iron Turtle Tracker

## Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **CSS Framework**: Bootstrap 5.3 (CDN)
- **Storage**: HTML5 localStorage
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
```javascript
// User Session
{
  currentUser: string,
  email: string,
  loginTime: timestamp
}

// Activities Database
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

// Activity Log
{
  activities: [
    {
      id: timestamp,
      user: string,
      activity: string,
      basePoints: number,
      multipliers: string[],
      finalPoints: number,
      timestamp: ISO8601,
      category: string
    }
  ]
}

// User Scores (computed)
{
  scores: {
    [userName]: {
      total: number,
      activityCount: number,
      lastActivity: timestamp,
      rank: number
    }
  }
}
```

## Security & Privacy
- **No external API calls**: Fully client-side application
- **Local storage only**: No data leaves user device
- **No authentication**: Name/email only for identification
- **No sensitive data**: Recreational activity tracking only

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