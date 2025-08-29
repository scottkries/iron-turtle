# Iron Turtle Challenge Tracker

Mobile-first web application for tracking participant activities and scores during the annual Turtle Rock Draft weekend event.

## Features

- **Registration**: Simple name/email registration with localStorage persistence
- **Activity Logging**: Track consumables, competitions, tasks, and penalties
- **Scoring Engine**: Automatic point calculation with multiplier support
- **Leaderboard**: Real-time score tracking across participants
- **Mobile Optimized**: Responsive design for mobile devices

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript + Bootstrap 5.3
- **Styling**: Custom CSS with gradient themes
- **Storage**: localStorage for offline functionality
- **Hosting**: Static files ready for Netlify deployment

## Activity Categories

### Consumables (Unlimited)
- Drinks: Beer, shots, cocktails, etc.
- Food: Burgers, hot dogs, s'mores, etc.
- **Multipliers**: 2x on boat/water/Leavenworth/hot tub, 10x while being towed

### Competitions (Unlimited)
- Beer pong, cornhole, spikeball, etc.
- **Points**: 30 for win, 10 for loss
- **Multipliers**: 2x with USC gear/on deck, 3x late night, 4x on island

### Tasks (One-time only)
- Individual sports: cliff jumps, hiking, swimming
- Boat sports: waterskiing, wakeboarding, tubing
- **Multipliers**: 2x with USC gear/on deck, 3x late night, 4x on island

### Random Tasks (Unlimited)
- Spot wildlife, make coffee, fix cocktails
- **Special**: Fix flagpole (1000 points!)

### Penalties (Tracked)
- Range from -5 to -1000 points
- **Rule**: Double penalty if caught vs. self-reported

## Multipliers

Multipliers stack! Example: USC gear + late night + on island = 24x multiplier

- **Consumables Only**: 2x boat/water/Leavenworth/hot tub, 10x being towed
- **Everything**: 2x USC gear/deck, 3x late night (2am-8am), 4x island

## Development

### Local Setup
1. Open `index.html` in a web browser
2. All functionality works offline with localStorage

### File Structure
```
iron-turtle/
├── index.html          # Main application
├── css/style.css       # Custom styles
├── js/
│   ├── app.js          # Main application logic
│   ├── activities.js   # Activity database
│   └── scoring.js      # Scoring engine
├── claude/             # Project documentation
└── README.md
```

### Deployment
Ready for static hosting on Netlify:
1. Drag and drop entire folder to Netlify
2. App will be immediately available

## Project Status

**Day 1 Foundation** ✅
- [x] Project structure created
- [x] Bootstrap integration complete
- [x] Activity database digitized (100% of scoring sheet)
- [x] Registration flow implemented
- [x] Dashboard layout complete
- [x] localStorage persistence working

**Next: Day 2 Features**
- [ ] Activity logging interface
- [ ] Multiplier selection
- [ ] Real-time scoring
- [ ] Leaderboard display
- [ ] Mobile testing and optimization

## Usage

1. **Register**: Enter name and email to start tracking
2. **Log Activities**: Use the "Log New Activity" button to record points
3. **Apply Multipliers**: Select applicable multipliers for bonus points
4. **Track Progress**: View your score and leaderboard position
5. **Challenge Others**: Use the scoring system for friendly competition

---

*Built for the Turtle Rock Draft Weekend - May the best Iron Turtle win! 🐢*