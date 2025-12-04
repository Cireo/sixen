# GitHub Pages Deployment Guide

This Sixen card game is ready to be deployed to GitHub Pages as a single-page web application.

## Quick Setup

1. **Push to GitHub**: Make sure your repository is on GitHub
2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"
   - The workflow will automatically deploy on push to `main`
3. **Deploy**: Your site will be available at `https://[username].github.io/[repository-name]/` within a few minutes

## What's Included

- **Static Files**: All HTML, CSS, and JavaScript files are served directly
- **Client-Side Storage**: Uses localStorage for game progress and high scores (no server required)
- **No Build Process**: Works directly from source files

## File Structure

```
/
├── index.html              # Main game entry point
├── tutorial.html           # Interactive tutorial
├── .nojekyll               # Disable Jekyll processing for GitHub Pages
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions deployment workflow
├── src/
│   ├── js/
│   │   ├── game.js         # Core game logic
│   │   ├── ui.js           # User interface controller
│   │   ├── rendering.js    # Card rendering utilities
│   │   ├── high-scores.js  # High score management
│   │   ├── utils.js        # General utilities
│   │   ├── ui-helpers.js   # UI helper functions
│   │   └── tutorial.js     # Tutorial system
│   ├── css/
│   │   ├── styles.css      # Main game styles
│   │   └── tutorial.css    # Tutorial-specific styles
│   ├── assets/
│   │   └── svg-cards.svg   # Card graphics (SVG sprite)
│   └── data/
│       └── tutorial-data.json  # Tutorial content
├── docs/
│   ├── FORMAL_RULES.md     # Formal game rules
│   └── PLAYER_RULES.md     # Player-friendly rules
└── tests/
    └── tutorial-test-utils.js  # Test utilities
```

## Features That Work on GitHub Pages

✅ **Client-side only** - No server required  
✅ **Local storage** - Game progress and high scores persist  
✅ **Static assets** - All CSS, JS, HTML, and SVG served directly  
✅ **Responsive design** - Works on mobile and desktop  
✅ **Interactive tutorial** - All functionality preserved  
✅ **Multiplayer and solitaire modes** - Both game modes work offline  
✅ **High score tracking** - Scores saved locally in browser

## Access Your Deployed App

After deployment, your app will be available at:
`https://[username].github.io/[repository-name]/`

For example: `https://cireo.github.io/sixen/`

## Development vs Production

No changes needed between development and production - the app works identically in both environments since it's entirely client-side.

## Troubleshooting

- **404 errors**: Make sure `index.html` is in the root directory
- **Assets not loading**: Verify all file paths are relative (they already are in this project)
- **Local storage not working**: Check browser console for errors; some browsers block localStorage in certain contexts
- **SVG cards not displaying**: Ensure `src/assets/svg-cards.svg` is accessible and the paths in `rendering.js` are correct

## GitHub Actions Deployment

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to GitHub Pages when you push to the `main` branch.

To use it:

1. **Enable GitHub Actions**: Go to your repository settings → "Pages" → "Source" → select "GitHub Actions"
2. **Push to main**: The workflow will automatically deploy your site

The workflow is already configured and ready to use!
