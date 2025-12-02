# GitHub Pages Deployment Guide

This Sixen card game is ready to be deployed to GitHub Pages as a single-page web application.

## Quick Setup

1. **Push to GitHub**: Make sure your repository is on GitHub
2. **Enable GitHub Pages**: 
   - Go to your repository settings
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"
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

For example: `https://rprice.github.io/sixen/`

## Development vs Production

No changes needed between development and production - the app works identically in both environments since it's entirely client-side.

## Troubleshooting

- **404 errors**: Make sure `index.html` is in the root directory
- **Assets not loading**: Verify all file paths are relative (they already are in this project)
- **Local storage not working**: Check browser console for errors; some browsers block localStorage in certain contexts
- **SVG cards not displaying**: Ensure `src/assets/svg-cards.svg` is accessible and the paths in `rendering.js` are correct

## Optional: GitHub Actions Deployment

If you prefer using GitHub Actions for deployment (like the mathquiz example), you can create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Then enable GitHub Actions in your repository settings under "Pages" → "Source" → "GitHub Actions".

