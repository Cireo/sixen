/**
 * High score management for Sixen Card Game
 * Handles localStorage operations and score calculations
 */

const HIGH_SCORE_KEY = "sixseven-highscores";
const MAX_HIGH_SCORES = 20;
const CURRENT_GAME_VERSION = "1.1";

/**
 * Get all high scores from localStorage
 * Backfills version 1.0 for scores without a version
 * @returns {Array} Array of score objects
 */
function getHighScores() {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (!stored) return [];

    const scores = JSON.parse(stored);
    // Backfill version 1.0 for scores without a version
    return scores.map((score) => {
      if (!score.gameVersion) {
        return { ...score, gameVersion: "1.0" };
      }
      return score;
    });
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
    gameVersion: CURRENT_GAME_VERSION,
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
 * Always includes top 3 scores with ellipsis if there's a gap
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

  const result = [];

  if (isInTop20 && newScoreIndex >= 0) {
    // Show 3 above and 3 below the new score
    const startIndex = Math.max(0, newScoreIndex - 3);
    const endIndex = Math.min(allScores.length, newScoreIndex + 4); // +4 to include the new score and 3 below

    // Get the nearby scores
    const nearbyScores = allScores
      .slice(startIndex, endIndex)
      .map((score, idx) => ({
        score,
        isNewScore: score.timestamp === newScoreTimestamp,
        displayIndex: startIndex + idx + 1, // 1-based rank
      }));

    // Always include top 3
    const top3 = allScores.slice(0, 3).map((score, idx) => ({
      score,
      isNewScore: score.timestamp === newScoreTimestamp,
      displayIndex: idx + 1,
    }));

    // Check if there's overlap between top 3 and nearby scores
    const top3Indices = new Set(top3.map((item) => item.displayIndex));
    const nearbyIndices = new Set(
      nearbyScores.map((item) => item.displayIndex),
    );
    const hasOverlap = Array.from(top3Indices).some((idx) =>
      nearbyIndices.has(idx),
    );
    const maxTop3Index = Math.max(...Array.from(top3Indices));
    const minNearbyIndex = Math.min(...Array.from(nearbyIndices));

    if (!hasOverlap && minNearbyIndex > maxTop3Index + 1) {
      // No overlap and there's a gap - show top 3, ellipsis, then nearby
      result.push(...top3);
      result.push({ isEllipsis: true });
      result.push(...nearbyScores);
    } else {
      // There's overlap or no gap - merge them in order, avoiding duplicates
      const allItems = new Map();

      // Add all items to map (nearby scores will overwrite top3 if duplicate)
      top3.forEach((item) => {
        allItems.set(item.displayIndex, item);
      });
      nearbyScores.forEach((item) => {
        allItems.set(item.displayIndex, item);
      });

      // Sort by displayIndex and add ellipsis where needed
      const sortedIndices = Array.from(allItems.keys()).sort((a, b) => a - b);
      let lastIndex = null;

      sortedIndices.forEach((idx, i) => {
        // Add ellipsis if there's a gap
        if (lastIndex !== null && idx > lastIndex + 1) {
          result.push({ isEllipsis: true });
        }
        result.push(allItems.get(idx));
        lastIndex = idx;
      });
    }
  } else {
    // Score is not in top 20 - show: new score ... bottom 3 ... top 3
    const top3 = allScores.slice(0, 3).map((score, idx) => ({
      score,
      isNewScore: false,
      displayIndex: idx + 1,
    }));

    const lowest3 = allScores.slice(-3); // Last 3 (lowest scores)
    const lowest3StartIndex = allScores.length - 3;

    // Check if new score is already in the lowest 3
    const isInLowest3 = lowest3.some((s) => s.timestamp === newScoreTimestamp);

    if (isInLowest3) {
      // New score is already in the lowest 3
      const lowest3WithNew = lowest3.map((score, idx) => ({
        score,
        isNewScore: score.timestamp === newScoreTimestamp,
        displayIndex: lowest3StartIndex + idx + 1,
      }));

      // Check if there's a gap between lowest 3 and top 3
      if (allScores.length > 6) {
        result.push(...lowest3WithNew);
        result.push({ isEllipsis: true });
        result.push(...top3);
      } else {
        // No gap, just show all scores
        result.push(...lowest3WithNew);
        if (allScores.length > 3) {
          result.push(
            ...top3.filter(
              (t) =>
                !lowest3WithNew.some(
                  (l) => l.score.timestamp === t.score.timestamp,
                ),
            ),
          );
        }
      }
    } else {
      // Show new score, ellipsis, lowest 3, ellipsis, top 3
      if (newScoreObj) {
        result.push({
          score: newScoreObj,
          isNewScore: true,
          displayIndex: ">20",
        });
      }

      // Add ellipsis if there are more than 0 scores
      if (allScores.length > 0) {
        result.push({ isEllipsis: true });
      }

      // Add lowest 3
      result.push(
        ...lowest3.map((score, idx) => ({
          score,
          isNewScore: false,
          displayIndex: lowest3StartIndex + idx + 1,
        })),
      );

      // Add ellipsis between lowest 3 and top 3 if there's a gap
      if (allScores.length > 6) {
        result.push({ isEllipsis: true });
      }

      // Add top 3
      result.push(...top3);
    }
  }

  return result;
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
