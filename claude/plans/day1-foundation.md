# Day 1: Foundation & Data Setup

**Estimated Time**: 8-10 hours  
**Goal**: Complete project setup and data digitization  
**Deliverable**: Working registration flow with activity database

---

## Phase 1: Project Setup (1 hour)

### Tasks
1. **Create project structure**
2. **Set up Bootstrap CDN**
3. **Initialize basic HTML structure** 
4. **Test local development environment**

### Detailed Steps

#### Step 1.1: Create Directory Structure (15 minutes)
```bash
mkdir iron-turtle
cd iron-turtle
mkdir css js claude/req claude/plans claude/progress
```

**Files to create**:
- `index.html`
- `css/style.css`
- `js/app.js`
- `js/activities.js` 
- `js/scoring.js`
- `README.md`

#### Step 1.2: Set Up Bootstrap & Basic HTML (30 minutes)
**Create index.html with**:
- Bootstrap 5.3 CSS/JS CDN links
- Mobile viewport meta tag
- Basic HTML structure with containers for different screens
- Test page title: "Iron Turtle Challenge Tracker"

**Bootstrap CDN links**:
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
```

#### Step 1.3: Initialize JavaScript Files (15 minutes)
**app.js**: Basic app initialization and navigation
**activities.js**: Empty structure for activity database
**scoring.js**: Empty structure for scoring functions

### Validation Checklist for Phase 1
- [ ] **File Structure**: All directories and files created as specified
- [ ] **HTML Loads**: index.html opens in browser without errors
- [ ] **Bootstrap Works**: Bootstrap CSS styles are applied (test with a button)
- [ ] **Mobile Viewport**: Page scales correctly on mobile device/browser dev tools
- [ ] **JavaScript Loads**: No console errors when loading page
- [ ] **Local Development**: Can edit files and refresh to see changes

**Success Criteria**: 
✅ Clean project structure  
✅ Bootstrap styling visible  
✅ No console errors  
✅ Mobile-responsive layout  

---

## Phase 2: Data Digitization (4-6 hours)

### Tasks
1. **Transcribe physical scoring sheet**
2. **Organize activities into categories**
3. **Define multiplier rules**
4. **Create activities.js database**
5. **Test data structure**

### Detailed Steps

#### Step 2.1: Analyze Physical Scoring Sheet (30 minutes)
**Review and categorize all items**:
- List all consumables (drinks, food) with point values
- List all competitions with win/loss scoring
- List all tasks with point values
- List all penalties with negative points
- Identify all multipliers and their rules

#### Step 2.2: Create Data Structure (3-4 hours)
**Define JSON structure in activities.js**:

```javascript
const ACTIVITIES = {
  consumables: [
    {
      id: "beer",
      name: "Beer", 
      basePoints: 2,
      category: "drink",
      multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
    }
    // ... continue with all consumables
  ],
  competitions: [
    {
      id: "cornhole",
      name: "Cornhole",
      winPoints: 5,
      lossPoints: -2,
      category: "competition",
      multiplierEligible: ["usc", "deck", "latenight", "island"]
    }
    // ... continue with all competitions  
  ],
  tasks: [
    {
      id: "sunrise_photo",
      name: "Sunrise Photo",
      basePoints: 3,
      category: "task",
      multiplierEligible: ["usc", "deck", "latenight", "island"]
    }
    // ... continue with all tasks
  ],
  penalties: [
    {
      id: "spill_drink",
      name: "Spill Drink",
      basePoints: -1,
      category: "penalty",
      multiplierEligible: []
    }
    // ... continue with all penalties
  ]
};

const MULTIPLIERS = [
  {
    id: "boat",
    name: "On Boat",
    factor: 2,
    appliesToConsumables: true,
    appliesToOthers: false,
    description: "Double points for consumables while on boat"
  },
  {
    id: "usc", 
    name: "USC Gear",
    factor: 2,
    appliesToConsumables: true,
    appliesToOthers: true,
    description: "Double points for any activity while wearing USC gear"
  }
  // ... continue with all multipliers
];
```

#### Step 2.3: Validate Data Structure (30 minutes)
**Create test function to verify**:
- All activities have required fields
- Point calculations work with multipliers
- No duplicate IDs
- All multiplier logic is correctly defined

### Validation Checklist for Phase 2
- [ ] **Complete Transcription**: Every item from physical sheet is digitized
- [ ] **Correct Categories**: All activities properly categorized (consumables/competitions/tasks/penalties)
- [ ] **Point Values Match**: All base point values match physical sheet exactly
- [ ] **Multiplier Rules**: All multiplier applicability rules correctly defined
- [ ] **Data Structure Valid**: No syntax errors, all required fields present
- [ ] **Test Calculations**: Sample point calculations match expected results
- [ ] **Search Friendly**: Activity names support search/autocomplete functionality

**Success Criteria**:
✅ 100% of physical scoring sheet digitized  
✅ All point calculations test correctly  
✅ Data structure loads without errors  
✅ Search/filter functions can operate on data  

---

## Phase 3: Core Application Structure (3 hours)

### Tasks
1. **Build registration screen**
2. **Create main dashboard layout**
3. **Implement basic routing**
4. **Set up localStorage**
5. **Test registration flow**

### Detailed Steps

#### Step 3.1: Registration Screen (45 minutes)
**HTML structure**:
- Welcome message with event branding
- Simple form with name and email inputs
- Large "Start Tracking" submit button
- Mobile-optimized styling

**JavaScript functionality**:
- Form validation (non-empty name, basic email format)
- Store user info in localStorage
- Navigate to dashboard on successful registration

#### Step 3.2: Main Dashboard Layout (60 minutes)
**Bootstrap grid layout**:
- Header with user info and logout button
- Large "Log New Activity" call-to-action button
- Leaderboard section with placeholder data
- Responsive design for mobile/desktop

#### Step 3.3: Basic Routing (45 minutes)
**Simple JavaScript routing**:
- Show/hide screen divs based on app state
- Navigation functions (showRegistration, showDashboard)
- URL hash routing for back button support
- Preserve state in localStorage

#### Step 3.4: localStorage Structure (30 minutes)
**Define data storage**:
```javascript
// User session
localStorage.setItem('ironTurtle_user', JSON.stringify({
  name: 'John Doe',
  email: 'john@example.com',
  loginTime: Date.now()
}));

// Activities log (shared across all users on device)
localStorage.setItem('ironTurtle_activities', JSON.stringify([]));

// Cached scores (computed from activities)
localStorage.setItem('ironTurtle_scores', JSON.stringify({}));
```

### Validation Checklist for Phase 3
- [ ] **Registration Form**: Name and email validation works correctly
- [ ] **Data Persistence**: User info persists through page refresh
- [ ] **Navigation**: Can move between registration and dashboard screens
- [ ] **Mobile Layout**: Dashboard looks good on mobile screen sizes
- [ ] **Bootstrap Grid**: Responsive layout works at different screen sizes
- [ ] **localStorage**: Data saves and loads correctly
- [ ] **Error Handling**: Form shows appropriate error messages
- [ ] **Logout Function**: Can logout and return to registration

**Success Criteria**:
✅ Registration flow complete and tested  
✅ Dashboard layout responsive and functional  
✅ Data persists correctly in localStorage  
✅ Navigation works smoothly between screens  

---

## End of Day 1 Deliverables

### What Should Be Working
1. **Complete project structure** with all files organized
2. **Activity database** with all scoring sheet items digitized
3. **Registration flow** that saves user info and navigates to dashboard
4. **Basic dashboard** with layout and navigation
5. **localStorage** persistence for user sessions

### Validation for Day 1 Complete
- [ ] **Structure Test**: All files and folders exist as planned
- [ ] **Data Test**: activities.js loads and contains complete activity database
- [ ] **Registration Test**: Can register with name/email and reach dashboard
- [ ] **Persistence Test**: User info survives browser refresh
- [ ] **Mobile Test**: Layout looks good on phone screen
- [ ] **Performance Test**: Page loads quickly (<2 seconds)

### Success Criteria for Day 1
✅ **Foundation Complete**: Project structure and data ready  
✅ **User Registration**: Working registration and session management  
✅ **Data Ready**: Complete activity database integrated  
✅ **Mobile Optimized**: Responsive design tested on mobile  

**Ready for Day 2**: Activity logging and leaderboard implementation