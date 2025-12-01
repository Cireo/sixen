/**
 * High score management for Sixen Card Game
 * Handles localStorage operations and score calculations
 */

const HIGH_SCORE_KEY = "sixseven-highscores";
const MAX_HIGH_SCORES = 20;

/**
 * Get all high scores from localStorage
 * @returns {Array} Array of score objects
 */
function getHighScores() {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save high scores to localStorage
 * @param {Array} scores - Array of score objects to save
 */
function saveHighScores(scores) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
  } catch (e) {
    console.error("Failed to save high scores:", e);
  }
}

/**
 * Compare two scores/players by game rules (face cards, total cards, six-sevens)
 * @param {Object} a - First score/player object
 * @param {Object} b - Second score/player object
 * @param {boolean} useTimestamp - Whether to use timestamp as final tiebreaker (default: true)
 * @returns {number} Comparison result (-1, 0, or 1)
 */
function compareScores(a, b, useTimestamp = true) {
  if (b.faceCards !== a.faceCards) return b.faceCards - a.faceCards;
  if (b.totalCards !== a.totalCards) return b.totalCards - a.totalCards;
  if (b.sixSevenCount !== a.sixSevenCount)
    return b.sixSevenCount - a.sixSevenCount;
  // If all tie, use timestamp if available, otherwise return 0
  if (useTimestamp && a.timestamp && b.timestamp) {
    return a.timestamp - b.timestamp; // Oldest stays (lower timestamp = older)
  }
  return 0;
}

/**
 * Sort scores by game rules (face cards, total cards, six-sevens, then timestamp)
 * @param {Array} scores - Array of score objects
 * @returns {Array} Sorted array of scores
 */
function sortScores(scores) {
  return [...scores].sort((a, b) => compareScores(a, b, true));
}

/**
 * Check if a new score is the player's personal best
 * @param {string} playerName - Player name
 * @param {Object} newScore - New score object
 * @param {Array} allScores - All existing scores
 * @returns {boolean} True if this is the player's new top score
 */
function isNewTopScoreForPlayer(playerName, newScore, allScores) {
  // Get all scores for this player name
  const playerScores = allScores.filter((s) => s.playerName === playerName);

  // If player has no previous scores, this is their top score
  if (playerScores.length === 0) return true;

  // Sort player's scores by same rules
  const sortedPlayerScores = sortScores(playerScores);

  // Get the player's current top score
  const topPlayerScore = sortedPlayerScores[0];

  // Check if new score is better than or equal to top player score
  if (newScore.faceCards > topPlayerScore.faceCards) return true;
  if (
    newScore.faceCards === topPlayerScore.faceCards &&
    newScore.totalCards > topPlayerScore.totalCards
  )
    return true;
  if (
    newScore.faceCards === topPlayerScore.faceCards &&
    newScore.totalCards === topPlayerScore.totalCards &&
    newScore.sixSevenCount > topPlayerScore.sixSevenCount
  )
    return true;
  // If all equal, it's considered a new top (ties count as new top)
  if (
    newScore.faceCards === topPlayerScore.faceCards &&
    newScore.totalCards === topPlayerScore.totalCards &&
    newScore.sixSevenCount === topPlayerScore.sixSevenCount
  )
    return true;

  return false;
}

/**
 * Add a new high score and return ranking information
 * @param {string} playerName - Player name
 * @param {number} faceCards - Number of face cards collected
 * @param {number} totalCards - Total cards collected
 * @param {number} sixSevenCount - Number of six-seven collections
 * @returns {Object} Result object with rank, isInTop20, isNewTopForPlayer, newScoreTimestamp, and newScore
 */
function addHighScore(playerName, faceCards, totalCards, sixSevenCount) {
  const scores = getHighScores();
  const newScore = {
    playerName,
    faceCards,
    totalCards,
    sixSevenCount,
    timestamp: Date.now(),
  };

  // Check if this is the player's personal best BEFORE adding to list
  const isNewTopForPlayer = isNewTopScoreForPlayer(
    playerName,
    newScore,
    scores,
  );

  // Add new score
  scores.push(newScore);

  // Sort by game rules
  const sortedScores = sortScores(scores);

  // Find position of new score in full sorted list
  const newScoreIndex = sortedScores.findIndex(
    (s) => s.timestamp === newScore.timestamp,
  );

  // Keep only top 20
  const topScores = sortedScores.slice(0, MAX_HIGH_SCORES);
  saveHighScores(topScores);

  // Determine rank (if in top 20, use position in top 20; otherwise show >20)
  const rankInTop20 = topScores.findIndex(
    (s) => s.timestamp === newScore.timestamp,
  );
  const rank = rankInTop20 >= 0 ? rankInTop20 + 1 : ">20";

  return {
    rank,
    isInTop20: rankInTop20 >= 0,
    isNewTopForPlayer,
    newScoreTimestamp: newScore.timestamp,
    newScore: newScore,
  };
}

/**
 * Format rank message for display
 * @param {number|string} rank - Rank (1, 2, 3, or ">20")
 * @param {boolean} isNewTopForPlayer - Whether this is the player's new top score
 * @returns {string} Formatted rank message
 */
function formatRankMessage(rank, isNewTopForPlayer) {
  let trophy = "";
  if (rank === 1) trophy = "🥇";
  else if (rank === 2) trophy = "🥈";
  else if (rank === 3) trophy = "🥉";

  const rankText =
    rank === ">20"
      ? ">20"
      : rank === 1
        ? "1st"
        : rank === 2
          ? "2nd"
          : rank === 3
            ? "3rd"
            : `${rank}th`;

  if (isNewTopForPlayer) {
    return `${trophy ? trophy + " " : ""}New Top Score - ${rankText} place!`;
  } else {
    return `New High Score - ${rankText} place!`;
  }
}

/**
 * Get nearby scores for display (3 above and 3 below, or lowest 3 + ellipsis + latest)
 * @param {Array} allScores - All saved scores
 * @param {number} newScoreTimestamp - Timestamp of the new score
 * @param {boolean} isInTop20 - Whether the new score is in the top 20
 * @param {Object} newScoreObj - The new score object (for display when not in top 20)
 * @returns {Array} Array of score display objects with score, isNewScore, and displayIndex
 */
function getNearbyScores(allScores, newScoreTimestamp, isInTop20, newScoreObj) {
  if (allScores.length === 0) {
    // No saved scores, just show the new score
    if (newScoreObj) {
      return [
        {
          score: newScoreObj,
          isNewScore: true,
          displayIndex: 1,
        },
      ];
    }
    return [];
  }

  // Find the index of the new score in saved scores
  const newScoreIndex = allScores.findIndex(
    (s) => s.timestamp === newScoreTimestamp,
  );

  if (isInTop20 && newScoreIndex >= 0) {
    // Show 3 above and 3 below the new score
    const startIndex = Math.max(0, newScoreIndex - 3);
    const endIndex = Math.min(allScores.length, newScoreIndex + 4); // +4 to include the new score and 3 below
    return allScores.slice(startIndex, endIndex).map((score, idx) => ({
      score,
      isNewScore: score.timestamp === newScoreTimestamp,
      displayIndex: startIndex + idx + 1, // 1-based rank
    }));
  } else {
    // Show lowest 3 + ellipsis + latest (new score)
    const lowest3 = allScores.slice(-3); // Last 3 (lowest scores)

    // Check if new score is already in the lowest 3 (shouldn't happen if not in top 20, but check anyway)
    const isInLowest3 = lowest3.some((s) => s.timestamp === newScoreTimestamp);

    if (isInLowest3) {
      // New score is already in the lowest 3, just show those
      return lowest3.map((score, idx) => ({
        score,
        isNewScore: score.timestamp === newScoreTimestamp,
        displayIndex: allScores.length - 3 + idx + 1,
      }));
    } else {
      // Show lowest 3, ellipsis, and new score
      const result = [
        ...lowest3.map((score, idx) => ({
          score,
          isNewScore: false,
          displayIndex: allScores.length - 3 + idx + 1,
        })),
      ];

      // Only add ellipsis if there are more than 3 scores
      if (allScores.length > 3) {
        result.push({ isEllipsis: true });
      }

      // Add the new score
      if (newScoreObj) {
        result.push({
          score: newScoreObj,
          isNewScore: true,
          displayIndex: ">20",
        });
      }

      return result;
    }
  }
}

// Export for use in ui.js
if (typeof window !== "undefined") {
  window.HighScores = {
    getHighScores,
    saveHighScores,
    addHighScore,
    isNewTopScoreForPlayer,
    formatRankMessage,
    getNearbyScores,
    sortScores,
    compareScores,
    MAX_HIGH_SCORES,
  };
}

