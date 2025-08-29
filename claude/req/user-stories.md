# User Stories - Iron Turtle Tracker

## Primary User: Event Participant

### Registration & Onboarding
**As a participant, I want to quickly get started so I can begin tracking activities immediately.**

**User Story**: "I arrive at the event, someone gives me a URL, I want to be logging activities within 2 minutes."

**Acceptance Criteria**:
- [ ] Registration requires only name and email (no password)
- [ ] Registration form is mobile-optimized with large touch targets
- [ ] After registration, I immediately see the main dashboard
- [ ] My session persists if I close/reopen the browser
- [ ] I can access from multiple devices by re-registering with same name/email

**Validation Tests**:
- [ ] Complete registration flow in <60 seconds on mobile
- [ ] Form works with various email formats and name lengths
- [ ] Session persists through browser restart
- [ ] Error messages are clear if something goes wrong

### Activity Logging
**As a participant, I want to quickly log activities so I don't miss action or forget what I did.**

**User Story**: "I just had a beer on the boat wearing my USC jersey - I should be able to log this with multipliers in under 30 seconds."

**Acceptance Criteria**:
- [ ] Prominent "Log Activity" button always visible
- [ ] Search with autocomplete finds activities as I type
- [ ] Multiplier selection is intuitive with clear point preview
- [ ] Submission gives immediate confirmation with final points
- [ ] Can log activity with one thumb while holding phone

**Validation Tests**:
- [ ] Complete activity logging in <30 seconds
- [ ] Search finds relevant activities with partial text
- [ ] Point calculation preview matches final calculation
- [ ] All multiplier combinations calculate correctly
- [ ] Works smoothly on smallest target phone (iPhone SE)

### Leaderboard & Competition
**As a participant, I want to see my ranking and competitors' progress so I stay engaged.**

**User Story**: "I want to check if I'm still in first place and see what activities others are doing."

**Acceptance Criteria**:
- [ ] Leaderboard shows current ranking with clear visual hierarchy
- [ ] My position is highlighted or emphasized
- [ ] Scores update immediately when anyone logs activity
- [ ] Can see total points and number of activities per person
- [ ] Leaderboard loads quickly even with many participants

**Validation Tests**:
- [ ] Leaderboard updates in <2 seconds after activity submission
- [ ] Rankings are mathematically correct
- [ ] Visual design makes rankings clear on mobile
- [ ] Performance stays smooth with 20+ participants

## Secondary User: Event Organizer

### Monitoring & Support
**As an organizer, I want to monitor participation and help with disputes.**

**User Story**: "I need to see if everyone is using the system and resolve any scoring questions."

**Acceptance Criteria**:
- [ ] Can see all participants and their activity counts
- [ ] Activity logs include timestamps for dispute resolution
- [ ] System calculates points consistently with written rules
- [ ] Can export or view complete activity history if needed

**Validation Tests**:
- [ ] All scoring matches manual calculation from rules
- [ ] Activity timestamps are accurate and readable
- [ ] Can identify participants who haven't logged activities
- [ ] No discrepancies between different users' views of scores

## Edge Cases & Error Scenarios

### Data Persistence
**User Story**: "My phone died and when I turned it back on, I lost all my logged activities."

**Acceptance Criteria**:
- [ ] Activities persist through browser/phone restarts
- [ ] Data survives app refresh or navigation away
- [ ] Some recovery mechanism if localStorage is cleared
- [ ] Clear indication if data is lost

### Multiple Device Usage
**User Story**: "I started on my phone but now I'm using my friend's tablet."

**Acceptance Criteria**:
- [ ] Can re-register with same name on different device
- [ ] Activities from all devices combine into single score
- [ ] No duplicate user entries in leaderboard
- [ ] Clear indication of which device/session you're on

### Offline Usage
**User Story**: "The boat has no wifi but I still want to log activities."

**Acceptance Criteria**:
- [ ] App loads and functions without internet after initial load
- [ ] Activities save locally and appear when connection returns
- [ ] No loss of functionality for core features when offline
- [ ] Clear indication of online/offline status if applicable

### Disputed Activities
**User Story**: "Someone challenges whether I actually did that activity or earned those points."

**Acceptance Criteria**:
- [ ] Activity log shows exact timestamp and details
- [ ] Point calculation is transparent and verifiable
- [ ] Organizer can review individual activity history
- [ ] Scoring matches written rules exactly

## Validation Summary

**Each user story must pass these validation gates**:
1. **Functional Test**: Feature works as described
2. **Mobile Test**: Works smoothly on target mobile devices  
3. **Performance Test**: Meets speed/responsiveness requirements
4. **Edge Case Test**: Handles error conditions gracefully
5. **User Experience Test**: Intuitive for target users (event participants)