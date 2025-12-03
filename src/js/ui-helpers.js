/**
 * UI Helper functions for Sixen Card Game
 * Pure functions for generating HTML/DOM elements and DOM manipulation helpers
 */

/**
 * Generate HTML for a score entry
 * @param {Object} score - Score object with playerName, faceCards, totalCards, sixSevenCount
 * @param {string} trophy - Trophy emoji (empty string if none)
 * @param {string} dateStr - Formatted date string
 * @param {number|string} rank - Rank number (1, 2, 3, etc.) or string (e.g., ">20")
 * @returns {string} HTML string for score entry
 */
function createScoreEntryHTML(score, trophy = "", dateStr = "", rank = null) {
  const trophyPrefix = trophy ? `${trophy} ` : "";
  const dateSection = dateStr
    ? `<span class="score-date">${dateStr}</span>`
    : "";
  const rankDisplay =
    rank !== null ? `<span class="score-rank">${rank}</span>` : "";

  return `
    ${rankDisplay}
    <span class="player-name">${trophyPrefix}${score.playerName}</span>
    <div class="score-details">
      <span>Stacks: ${score.faceCards}</span>
      <span>Cards: ${score.totalCards}</span>
      <span>6-7s: ${score.sixSevenCount}</span>
      ${dateSection}
    </div>
  `;
}

/**
 * Animate overlay fade-in
 * @param {HTMLElement} overlay - Overlay element to animate
 */
function animateOverlayFadeIn(overlay) {
  if (!overlay) return;

  overlay.classList.remove("hidden");
  overlay.classList.remove("fade-out");
  requestAnimationFrame(() => {
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.5s ease";
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });
  });
}

// Export for use in ui.js
if (typeof window !== "undefined") {
  window.UIHelpers = {
    createScoreEntryHTML,
    animateOverlayFadeIn,
  };
}
