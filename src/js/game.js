/**
 * Sixen Card Game - Core Game Logic
 */

// Card value mappings
const CARD_VALUES = {
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
};

// Face card capacities (per side)
const FACE_CAPACITIES = {
  J: 1,
  Q: 2,
  K: 3,
};

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const NUMBER_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const FACE_RANKS = ["J", "Q", "K"];

/**
 * Create a card object
 */
function createCard(rank, suit) {
  return { rank, suit };
}

/**
 * Get the numeric value of a card
 */
function getCardValue(card) {
  return CARD_VALUES[card.rank] || 0;
}

/**
 * Get the capacity of a face card (per side)
 */
function getFaceCapacity(card) {
  return FACE_CAPACITIES[card.rank] || 0;
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Create and shuffle the number deck (A-10)
 */
function createNumberDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of NUMBER_RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return shuffle(deck);
}

/**
 * Create and shuffle the face deck (J, Q, K)
 */
function createFaceDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of FACE_RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return shuffle(deck);
}

/**
 * Create a new stack with a face card
 */
function createStack(faceCard) {
  return {
    face: faceCard,
    left: [], // Plus/positive modifiers
    right: [], // Minus/negative modifiers
    matchSlot: null,
  };
}

/**
 * Calculate the sum of a stack
 */
function calculateStackSum(stack) {
  const leftSum = stack.left.reduce((sum, card) => sum + getCardValue(card), 0);
  const rightSum = stack.right.reduce(
    (sum, card) => sum + getCardValue(card),
    0,
  );
  return leftSum - rightSum;
}

/**
 * Get the capacity of a stack (per side)
 */
function getStackCapacity(stack) {
  return getFaceCapacity(stack.face);
}

/**
 * Check if a stack's left side is full
 */
function isLeftFull(stack) {
  return stack.left.length >= getStackCapacity(stack);
}

/**
 * Check if a stack's right side is full
 */
function isRightFull(stack) {
  return stack.right.length >= getStackCapacity(stack);
}

/**
 * Check if a stack is completely full (both sides at capacity)
 */
function isStackFull(stack) {
  return isLeftFull(stack) && isRightFull(stack);
}

/**
 * Get the visible (topmost) card on left side, or null
 */
function getLeftVisible(stack) {
  return stack.left.length > 0 ? stack.left[stack.left.length - 1] : null;
}

/**
 * Get the visible (topmost) card on right side, or null
 */
function getRightVisible(stack) {
  return stack.right.length > 0 ? stack.right[stack.right.length - 1] : null;
}

/**
 * Check if playing a card on the left side is legal
 */
function canPlayLeft(stack, card) {
  if (isLeftFull(stack)) return false;
  const newSum = calculateStackSum(stack) + getCardValue(card);
  return newSum >= 0;
}

/**
 * Check if playing a card on the right side is legal
 */
function canPlayRight(stack, card) {
  if (isRightFull(stack)) return false;
  const newSum = calculateStackSum(stack) - getCardValue(card);
  return newSum >= 0;
}

/**
 * Check if a match play is legal
 */
function canPlayMatch(stack, card) {
  if (!isStackFull(stack)) return false;
  const currentSum = calculateStackSum(stack);
  return getCardValue(card) === currentSum;
}

/**
 * Check if any legal play exists for a card on a stack
 */
function hasLegalPlay(stack, card) {
  return (
    canPlayLeft(stack, card) ||
    canPlayRight(stack, card) ||
    canPlayMatch(stack, card)
  );
}

/**
 * Get all legal plays for a card across all stacks
 * Returns array of { stackIndex, side: 'left'|'right'|'match' }
 */
function getLegalPlays(stacks, card) {
  const plays = [];
  stacks.forEach((stack, index) => {
    if (canPlayLeft(stack, card)) {
      plays.push({ stackIndex: index, side: "left" });
    }
    if (canPlayRight(stack, card)) {
      plays.push({ stackIndex: index, side: "right" });
    }
    if (canPlayMatch(stack, card)) {
      plays.push({ stackIndex: index, side: "match" });
    }
  });
  return plays;
}

/**
 * Play a card on a stack
 * Returns the updated stack (does not mutate original)
 */
function playCard(stack, card, side) {
  const newStack = {
    face: stack.face,
    left: [...stack.left],
    right: [...stack.right],
    matchSlot: stack.matchSlot,
  };

  if (side === "left") {
    newStack.left.push(card);
  } else if (side === "right") {
    newStack.right.push(card);
  } else if (side === "match") {
    newStack.matchSlot = card;
  }

  return newStack;
}

/**
 * Check collection conditions after a play
 * Returns array of possible collection types, or empty array if none
 */
function checkCollectionConditions(stack, playedCard, side) {
  const conditions = [];
  const sum = calculateStackSum(stack);
  const cardValue = getCardValue(playedCard);

  // Six-Seven: Played a 7 on a visible 6 (check this first for priority)
  // Check two locations:
  // 1. The card underneath the current card (on the same side)
  // 2. The last card of the other side
  if (cardValue === 7 && side !== "match") {
    let foundSix = false;

    // Check the card underneath on the same side
    if (side === "left" && stack.left.length > 1) {
      const cardUnderneath = stack.left[stack.left.length - 2];
      if (getCardValue(cardUnderneath) === 6) {
        foundSix = true;
      }
    } else if (side === "right" && stack.right.length > 1) {
      const cardUnderneath = stack.right[stack.right.length - 2];
      if (getCardValue(cardUnderneath) === 6) {
        foundSix = true;
      }
    }

    // Check the last card of the other side
    if (!foundSix) {
      if (side === "left" && stack.right.length > 0) {
        const otherSideCard = stack.right[stack.right.length - 1];
        if (getCardValue(otherSideCard) === 6) {
          foundSix = true;
        }
      } else if (side === "right" && stack.left.length > 0) {
        const otherSideCard = stack.left[stack.left.length - 1];
        if (getCardValue(otherSideCard) === 6) {
          foundSix = true;
        }
      }
    }

    if (foundSix) {
      conditions.push({ type: "six-seven", announcement: "Six Seven!" });
    }
  }

  // Six-Six: Stack sum is 6
  if (sum === 6) {
    conditions.push({ type: "six-six", announcement: "Six Six!" });
  }

  // Seven-Seven: Stack sum is 7
  if (sum === 7) {
    conditions.push({ type: "seven-seven", announcement: "Seven Seven!" });
  }

  // Zero: Sum is 0 and at least one side is full
  if (sum === 0 && (isLeftFull(stack) || isRightFull(stack))) {
    conditions.push({ type: "zero", announcement: "Nada!" });
  }

  // Match: Stack was full and card matched the sum
  if (side === "match") {
    conditions.push({ type: "match", announcement: `${cardValue} Ditto!` });
  }

  return conditions;
}

/**
 * Create a new player
 */
function createPlayer(id, name) {
  return {
    id,
    name,
    collected: [], // Array of collected stacks (each stack has face + cards)
    sixSevenCount: 0, // Number of Six-Seven collections
    stuckCard: null, // Card kept when player gets stuck
  };
}

/**
 * Get total face cards collected by a player
 */
function getFaceCardCount(player) {
  return player.collected.length;
}

/**
 * Get total cards collected by a player (face + number)
 */
function getTotalCardCount(player) {
  let count = 0;
  for (const stack of player.collected) {
    count += 1; // Face card
    count += stack.left.length;
    count += stack.right.length;
    if (stack.matchSlot) count += 1;
  }
  return count;
}

/**
 * Calculate scores and determine winner
 * Returns sorted array of players with scores
 */
function calculateScores(players, lastPlayerIndex) {
  const scored = players.map((player, index) => ({
    ...player,
    faceCards: getFaceCardCount(player),
    totalCards: getTotalCardCount(player),
    turnOrder: (lastPlayerIndex - index + players.length) % players.length,
  }));

  // Sort by tiebreakers
  scored.sort((a, b) => {
    // 1. Most face cards
    if (b.faceCards !== a.faceCards) return b.faceCards - a.faceCards;
    // 2. Most total cards
    if (b.totalCards !== a.totalCards) return b.totalCards - a.totalCards;
    // 3. Most Six-Seven collections
    if (b.sixSevenCount !== a.sixSevenCount)
      return b.sixSevenCount - a.sixSevenCount;
    // 4. Most recent turn (lower turnOrder means more recent)
    return a.turnOrder - b.turnOrder;
  });

  return scored;
}

/**
 * Main game state class
 */
class SixSevenGame {
  constructor(playerNames) {
    this.players = playerNames.map((name, i) => createPlayer(i, name));
    this.currentPlayerIndex = 0;
    this.numberDeck = createNumberDeck();
    this.faceDeck = createFaceDeck();
    this.stacks = [];
    this.drawnCard = null;
    this.stuckPlayer = null; // Player who couldn't play (for end condition)
    this.gameOver = false;
    this.lastPlayedIndex = null;

    // Initialize stacks (always 3 stacks, regardless of player count)
    const INITIAL_STACKS = 3;
    for (let i = 0; i < INITIAL_STACKS; i++) {
      const faceCard = this.faceDeck.pop();
      this.stacks.push(createStack(faceCard));
    }
  }

  /**
   * Get current player
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Draw a card from the number deck
   */
  drawCard() {
    if (this.numberDeck.length === 0) return null;
    this.drawnCard = this.numberDeck.pop();
    return this.drawnCard;
  }

  /**
   * Get legal plays for the drawn card
   */
  getLegalPlaysForDrawnCard() {
    if (!this.drawnCard) return [];
    return getLegalPlays(this.stacks, this.drawnCard);
  }

  /**
   * Execute a play
   * Returns { success, collectionConditions, newStack }
   */
  executePlay(stackIndex, side) {
    if (!this.drawnCard) {
      return { success: false, error: "No card drawn" };
    }

    const stack = this.stacks[stackIndex];

    // Validate play
    if (side === "left" && !canPlayLeft(stack, this.drawnCard)) {
      return { success: false, error: "Cannot play on left" };
    }
    if (side === "right" && !canPlayRight(stack, this.drawnCard)) {
      return { success: false, error: "Cannot play on right" };
    }
    if (side === "match" && !canPlayMatch(stack, this.drawnCard)) {
      return { success: false, error: "Cannot play match" };
    }

    // Execute play
    const playedCard = this.drawnCard;
    const newStack = playCard(stack, playedCard, side);
    this.stacks[stackIndex] = newStack;
    this.drawnCard = null;
    // Only reset stuckPlayer if the current player (who made the play) was the stuck player
    // This allows the game to continue if someone else makes a play, but ends when turn returns to stuck player
    if (this.stuckPlayer === this.currentPlayerIndex) {
      this.stuckPlayer = null; // Stuck player made a valid play, game continues
      // Clear the stuck card since they played
      const player = this.getCurrentPlayer();
      player.stuckCard = null;
    }

    // Check collection conditions
    const conditions = checkCollectionConditions(newStack, playedCard, side);

    return {
      success: true,
      collectionConditions: conditions,
      stackIndex,
      playedCard,
      side,
    };
  }

  /**
   * Collect a stack
   */
  collectStack(stackIndex, collectionType) {
    const stack = this.stacks[stackIndex];
    const player = this.getCurrentPlayer();

    // Add to player's collection
    player.collected.push({
      face: stack.face,
      left: [...stack.left],
      right: [...stack.right],
      matchSlot: stack.matchSlot,
    });

    // Track Six-Seven collections
    if (collectionType === "six-seven") {
      player.sixSevenCount++;
    }

    // Remove stack and potentially create new one
    this.stacks.splice(stackIndex, 1);

    if (this.faceDeck.length > 0) {
      const newFace = this.faceDeck.pop();
      this.stacks.unshift(createStack(newFace)); // Add to beginning (left side)
    }

    return true;
  }

  /**
   * Handle case where no legal play exists
   * Returns { createNewStack, gameEnding, gameOver }
   */
  handleNoLegalPlay() {
    if (this.faceDeck.length > 0) {
      // Create new stack and play card there
      const newFace = this.faceDeck.pop();
      const newStack = createStack(newFace);
      this.stacks.unshift(newStack); // Add to beginning (left side)

      // Card must be playable on empty stack (left side always works for positive sum)
      const newStackIndex = 0; // New stack is always at index 0 when added to beginning

      return {
        createNewStack: true,
        newStackIndex,
        gameEnding: false,
        gameOver: false,
      };
    } else {
      // No face cards left - player keeps card
      if (this.stuckPlayer === this.currentPlayerIndex) {
        // Turn returned to stuck player - game ends
        this.gameOver = true;
        return { createNewStack: false, gameEnding: false, gameOver: true };
      } else if (this.stuckPlayer === null) {
        // First player to get stuck
        this.stuckPlayer = this.currentPlayerIndex;
        // Store the card in the player's stuckCard field
        const player = this.getCurrentPlayer();
        player.stuckCard = this.drawnCard;
        return { createNewStack: false, gameEnding: true, gameOver: false };
      } else {
        // Another player got stuck, not the original one
        // Store the card in this player's stuckCard field
        const player = this.getCurrentPlayer();
        player.stuckCard = this.drawnCard;
        return { createNewStack: false, gameEnding: true, gameOver: false };
      }
    }
  }

  /**
   * Advance to next player
   */
  nextTurn() {
    this.lastPlayedIndex = this.currentPlayerIndex;
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
    // Clear drawnCard (current player's card)
    // Stuck players' cards are stored in player.stuckCard and persist
    this.drawnCard = null;
  }

  /**
   * Get final scores
   */
  getFinalScores() {
    return calculateScores(this.players, this.lastPlayedIndex);
  }

  /**
   * Get game state for UI
   */
  getState() {
    return {
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      stacks: this.stacks,
      numberDeckCount: this.numberDeck.length,
      faceDeckCount: this.faceDeck.length,
      drawnCard: this.drawnCard,
      gameOver: this.gameOver,
      stuckPlayer: this.stuckPlayer,
    };
  }
}

// Export for use in ui.js
window.SixSevenGame = SixSevenGame;
window.calculateStackSum = calculateStackSum;
window.getStackCapacity = getStackCapacity;
window.isStackFull = isStackFull;
window.getCardValue = getCardValue;
window.createCard = createCard;
window.createStack = createStack;
