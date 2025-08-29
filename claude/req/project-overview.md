# Iron Turtle Challenge Tracker - Project Overview

## Executive Summary
Mobile-first web application for tracking participant activities and scores during the annual Turtle Rock Draft weekend event. Built with vanilla HTML/CSS/JavaScript for rapid deployment.

## Key Decisions Made
- **Hosting**: Netlify static hosting (drag-and-drop deployment)
- **Tech Stack**: Vanilla HTML/CSS/JavaScript + Bootstrap CSS framework
- **Scope**: MVP with core features only (registration, activity logging, basic leaderboard)
- **Data**: Physical scoring sheet to be digitized into JSON format
- **Timeline**: 1-2 days development + deployment

## Success Metrics
- **Functional**: All core user flows working on mobile devices
- **Performance**: <2 second load times on mobile
- **Adoption**: Easy enough for event participants to use immediately
- **Reliability**: Works offline with localStorage persistence

## Risk Mitigation
- Simple technology stack reduces complexity
- MVP scope ensures deliverable in timeline
- Static hosting eliminates server management
- localStorage provides offline functionality

## Project Structure
```
iron-turtle/
├── claude/
│   ├── req/           # Requirements documents
│   ├── plans/         # Implementation plans
│   └── progress/      # Progress tracking
├── index.html
├── css/style.css
├── js/
│   ├── app.js
│   ├── activities.js
│   └── scoring.js
└── README.md
```

## Next Steps
1. Review implementation plans in `/claude/plans/`
2. Begin with Phase 1: Project Setup
3. Follow validation checklists for each phase
4. Track progress in `/claude/progress/`