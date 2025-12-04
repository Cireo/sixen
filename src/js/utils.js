/**
 * Utility functions for Sixen Card Game
 * Pure helper functions
 */

/**
 * Format a timestamp as a readable date string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string (e.g., "Jan 15, 2024")
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get trophy emoji for a given rank
 * @param {number} rank - Rank (1, 2, or 3)
 * @returns {string} Trophy emoji or empty string
 */
function getTrophyEmoji(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

/**
 * Format rank as text (1st, 2nd, 3rd, Nth, or >20)
 * @param {number|string} rank - Rank number or ">20"
 * @returns {string} Formatted rank text
 */
function formatRankText(rank) {
  if (rank === ">20") return ">20";
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

/**
 * Calculate total cards collected by a player
 * @param {Object} player - Player object with collected stacks
 * @returns {number} Total number of cards collected
 */
function calculateTotalCards(player) {
  let totalCards = 0;
  player.collected.forEach((stack) => {
    totalCards +=
      1 + stack.left.length + stack.right.length + (stack.matchSlot ? 1 : 0);
  });
  return totalCards;
}

/**
 * Calculate horizontal offset for card slots based on stack capacity and position
 * @param {number} index - Position index (0-based)
 * @param {number} capacity - Stack capacity (1 for J, 2 for Q, 3 for K)
 * @returns {number} Horizontal offset in pixels
 */
function getHorizontalOffset(index, capacity) {
  if (capacity === 1) return 0;
  if (capacity === 2) return index === 0 ? -4 : 4;
  if (capacity === 3) return index === 0 ? -8 : index === 1 ? 0 : 8;
  return 0;
}

// Export for use in ui.js
if (typeof window !== "undefined") {
  window.Utils = {
    formatDate,
    getTrophyEmoji,
    formatRankText,
    calculateTotalCards,
    getHorizontalOffset,
  };
}
