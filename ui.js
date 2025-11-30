/**
 * Sixen Card Game - UI Controller
 */

let game = null;
let playerCount = 2;

// DOM Elements
const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");
const gameoverScreen = document.getElementById("gameover-screen");
const playerInputs = document.getElementById("player-inputs");
const addPlayerBtn = document.getElementById("add-player-btn");
const removePlayerBtn = document.getElementById("remove-player-btn");
const startGameBtn = document.getElementById("start-game-btn");
const menuBtn = document.getElementById("menu-btn");
const numberDeckWrapper = document.getElementById("number-deck-wrapper");
const drawnCardArea = document.getElementById("drawn-card-area");
const drawnCardDisplay = document.getElementById("drawn-card-display");
const stacksContainer = document.getElementById("stacks-container");
const playersList = document.getElementById("players-list");
const numberDeckCount = document.getElementById("number-deck-count");
const faceDeckCount = document.getElementById("face-deck-count");
const announcementOverlay = document.getElementById("announcement-overlay");
const announcementText = document.getElementById("announcement-text");
const gameoverOverlay = document.getElementById("gameover-overlay");
const winnerName = document.getElementById("winner-name");
const finalScores = document.getElementById("final-scores");
const playAgainBtn = document.getElementById("play-again-btn");
const gameLogo = document.getElementById("game-logo");
const debugLoadScenarioBtn = document.getElementById("debug-load-scenario-btn");
const showHighScoresBtn = document.getElementById("show-high-scores-btn");
const highScoresOverlay = document.getElementById("high-scores-overlay");
const highScoresList = document.getElementById("high-scores-list");
const closeHighScoresBtn = document.getElementById("close-high-scores-btn");

// State
let pendingCollection = null;
let previousStackCount = 0;
let shouldAnimateNewStack = false; // Track if we should animate a new stack
let autoPlayNewStacks = false; // Game option: auto-play on new stacks
let autoDraw = false; // Game option: always automatically draw
let debugMode = false; // Debug mode flag
let isProcessing = false; // Prevent drawing during animations/processing

// Player colors (neutral colors for 1-4 players)
const PLAYER_COLORS = [
  "#4A90E2", // Blue
  "#E24A4A", // Red
  "#4AE24A", // Green
  "#E2E24A", // Yellow
];

// Suit name mapping for SVG-cards
const SUIT_NAMES = {
  hearts: "heart",
  diamonds: "diamond",
  clubs: "club",
  spades: "spade",
};

// Rank name mapping for SVG-cards
function getCardId(card) {
  const suitName = SUIT_NAMES[card.suit];
  let rankName;

  if (card.rank === "J") {
    rankName = "jack";
  } else if (card.rank === "Q") {
    rankName = "queen";
  } else if (card.rank === "K") {
    rankName = "king";
  } else if (card.rank === "A") {
    rankName = "1"; // Ace is 1 in SVG-cards
  } else {
    rankName = card.rank;
  }

  return `${suitName}_${rankName}`;
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  addPlayerBtn.addEventListener("click", addPlayer);
  removePlayerBtn.addEventListener("click", removePlayer);
  startGameBtn.addEventListener("click", startGame);
  menuBtn.addEventListener("click", returnToMenu);
  playAgainBtn.addEventListener("click", returnToMenu);
  if (showHighScoresBtn) {
    showHighScoresBtn.addEventListener("click", showHighScores);
  }
  if (closeHighScoresBtn) {
    closeHighScoresBtn.addEventListener("click", () => {
      if (highScoresOverlay) {
        highScoresOverlay.classList.add("hidden");
      }
    });
  }

  // Use event delegation for player decks (since they're dynamically created)
  document.addEventListener("click", (e) => {
    const playerDeck = e.target.closest(".player-deck.clickable-deck");
    if (playerDeck) {
      const state = game ? game.getState() : null;
      if (state && !state.drawnCard && state.numberDeckCount > 0) {
        const playerIndex = parseInt(
          playerDeck.getAttribute("data-player-index"),
        );
        if (playerIndex === state.currentPlayerIndex) {
          handleDrawCard();
        }
      }
    }
  });

  // D key to draw card
  document.addEventListener("keydown", (e) => {
    // Only handle D key, and only if not typing in an input field
    if ((e.key === "d" || e.key === "D") && e.target.tagName !== "INPUT") {
      e.preventDefault(); // Prevent any default behavior
      
      // Only draw if game is active and we're on the game screen
      if (game && !gameScreen.classList.contains("hidden")) {
        const state = game.getState();
        // handleDrawCard already checks for drawnCard and deck count
        if (!state.gameOver) {
          handleDrawCard();
        }
      }
    }
  });
}

/**
 * Add a player input field
 */
function addPlayer() {
  if (playerCount >= 4) return;
  playerCount++;

  const row = document.createElement("div");
  row.className = "player-input-row";
  row.innerHTML = `
        <label>Player ${playerCount}:</label>
        <input type="text" id="player-${playerCount}" placeholder="Enter name" value="Player ${playerCount}">
    `;
  playerInputs.appendChild(row);

  updatePlayerButtons();
}

/**
 * Remove the last player input field
 */
function removePlayer() {
  if (playerCount <= 1) return;

  const lastRow = playerInputs.lastElementChild;
  playerInputs.removeChild(lastRow);
  playerCount--;

  updatePlayerButtons();
}

/**
 * Update add/remove player button states
 */
function updatePlayerButtons() {
  addPlayerBtn.disabled = playerCount >= 4;
  removePlayerBtn.disabled = playerCount <= 1;
}

/**
 * Start a new game
 */
function startGame() {
  const names = [];
  for (let i = 1; i <= playerCount; i++) {
    const input = document.getElementById(`player-${i}`);
    names.push(input.value.trim() || `Player ${i}`);
  }

  // Get game options
  const autoPlayCheckbox = document.getElementById("auto-play-new-stacks");
  autoPlayNewStacks = autoPlayCheckbox ? autoPlayCheckbox.checked : false;
  const autoDrawCheckbox = document.getElementById("auto-draw");
  autoDraw = autoDrawCheckbox ? autoDrawCheckbox.checked : false;

  game = new SixSevenGame(names);
  pendingCollection = null;
  previousStackCount = 0;
  shouldAnimateNewStack = false;
  isProcessing = false;

  showScreen("game");
  renderGame();
}

/**
 * Return to menu
 */
function returnToMenu() {
  if (game && !game.getState().gameOver) {
    if (!confirm("Are you sure you want to leave the current game?")) {
      return;
    }
  }
  game = null;
  pendingCollection = null;
  previousStackCount = 0;
  shouldAnimateNewStack = false;
  isProcessing = false;
  // Hide gameover overlay if visible
  if (gameoverOverlay) {
    gameoverOverlay.classList.add("hidden");
    gameoverOverlay.classList.remove("fade-out");
  }
  showScreen("setup");
}

/**
 * Show a specific screen
 */
function showScreen(screen) {
  setupScreen.classList.toggle("hidden", screen !== "setup");
  gameScreen.classList.toggle("hidden", screen !== "game");
  gameoverScreen.classList.toggle("hidden", screen !== "gameover");
}

/**
 * Create a playing card element using SVG-cards
 */
function createCardElement(card, size = "normal") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let width, height;
  if (size === "small") {
    width = "94";
    height = "131";
  } else if (size === "large") {
    width = "150";
    height = "210";
  } else {
    width = "125";
    height = "175";
  }
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", "0 0 169.075 244.64");
  svg.setAttribute("class", "card-svg");
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns",
    "http://www.w3.org/2000/svg",
  );
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink",
  );

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  const cardId = getCardId(card);
  // Use xlink:href for compatibility
  use.setAttributeNS(
    "http://www.w3.org/1999/xlink",
    "href",
    `svg-cards.svg#${cardId}`,
  );
  use.setAttribute("x", "0");
  use.setAttribute("y", "0");

  svg.appendChild(use);
  return svg;
}

/**
 * Create a card back element
 */
function createCardBackElement() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "125");
  svg.setAttribute("height", "175");
  svg.setAttribute("viewBox", "0 0 169.075 244.64");
  svg.setAttribute("class", "card-svg");
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns",
    "http://www.w3.org/2000/svg",
  );
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink",
  );

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttributeNS(
    "http://www.w3.org/1999/xlink",
    "href",
    "svg-cards.svg#back",
  );
  use.setAttribute("x", "0");
  use.setAttribute("y", "0");
  use.setAttribute("fill", "#0062ff"); // Default blue back

  svg.appendChild(use);
  return svg;
}

/**
 * Render the entire game state
 */
function renderGame() {
  const state = game.getState();

  // Update deck displays (face deck only, number deck is in player area)
  renderDecks(state);

  // Render players at top (includes deck displays)
  renderPlayers(state);

  // Render stacks
  renderStacks(state);

  // Game over checks
  if (
    state.gameOver ||
    (state.stuckPlayer !== null && state.currentPlayerIndex === state.stuckPlayer) ||
    (state.numberDeckCount === 0 && !state.drawnCard) ||
    (state.stacks.length === 0)
  ) {
    game.gameOver = true;
    showGameOver();
    return;
  }

  // Check if there are no possible moves (all stacks full and >10, no face deck)
  if (state.stacks.length > 0 && state.faceDeckCount === 0 && !state.drawnCard) {
    // Check if any card from the number deck can be played
    let hasPossibleMove = false;
    // We can't check all cards without drawing, but we can check if all stacks are unplayable
    // (full and sum > 10, meaning no match is possible)
    const allStacksUnplayable = state.stacks.every((stack) => {
      const sum = window.calculateStackSum(stack);
      const isFull = window.isStackFull(stack);
      // If stack is full and sum > 10, no card can match it (max card value is 10)
      return isFull && sum > 10;
    });
    if (allStacksUnplayable) {
      // No possible moves - end game
      game.gameOver = true;
      showGameOver();
      return;
    }
  }

  // Auto-draw if enabled and no card is drawn
  if (autoDraw && !state.drawnCard && state.numberDeckCount > 0 && !isProcessing) {
    // Small delay to allow render to complete
    setTimeout(() => {
      handleDrawCard();
    }, 100);
  }
}

/**
 * Render the face deck display
 */
function renderDecks(state) {
  const faceDeckEl = document.getElementById("face-deck-display");

  // Update face deck count
  if (faceDeckCount) {
    faceDeckCount.textContent = state.faceDeckCount;
  }

  // Face deck visual
  if (faceDeckEl) {
    faceDeckEl.innerHTML = "";
    if (state.faceDeckCount > 0) {
      const cardStack = createDeckStack(state.faceDeckCount);
      faceDeckEl.appendChild(cardStack);
    } else {
      faceDeckEl.innerHTML = '<div class="empty-deck">Empty</div>';
    }
  }
}

/**
 * Create a visual deck stack with offset cards
 */
function createDeckStack(count) {
  const container = document.createElement("div");
  container.className = "deck-stack";

  // Show up to 5 offset cards to indicate depth
  const cardsToShow = Math.min(count, 5);
  for (let i = 0; i < cardsToShow; i++) {
    const cardBack = createCardBackElement();
    cardBack.style.position = i === cardsToShow - 1 ? "relative" : "absolute";
    cardBack.style.top = `${i * 2}px`;
    cardBack.style.left = `${i * 1}px`;
    cardBack.style.zIndex = i;
    container.appendChild(cardBack);
  }

  return container;
}

/**
 * Render players at top
 */
function renderPlayers(state) {
  playersList.innerHTML = "";

  // Calculate scores for ranking
  const scored = state.players.map((player, index) => {
    const faceCards = player.collected.length;
    let totalCards = 0;
    player.collected.forEach((stack) => {
      totalCards +=
        1 + stack.left.length + stack.right.length + (stack.matchSlot ? 1 : 0);
    });
    return {
      ...player,
      index,
      faceCards,
      totalCards,
    };
  });

  // Sort by scoring rules (same as calculateScores)
  scored.sort((a, b) => {
    if (b.faceCards !== a.faceCards) return b.faceCards - a.faceCards;
    if (b.totalCards !== a.totalCards) return b.totalCards - a.totalCards;
    if (b.sixSevenCount !== a.sixSevenCount)
      return b.sixSevenCount - a.sixSevenCount;
    return 0; // Don't sort by turn order for display
  });

  // Determine rank (1st, 2nd, 3rd)
  const ranks = {};
  scored.forEach((player, displayIndex) => {
    if (displayIndex === 0) ranks[player.index] = 1;
    else if (displayIndex === 1) ranks[player.index] = 2;
    else if (displayIndex === 2) ranks[player.index] = 3;
  });

  // Render in original order but with rank info
  state.players.forEach((player, index) => {
    const entry = document.createElement("div");
    entry.className = "player-entry";
    const playerColor = PLAYER_COLORS[index % PLAYER_COLORS.length];
    const isCurrentPlayer = index === state.currentPlayerIndex;
    const rank = ranks[index];

    if (isCurrentPlayer) {
      entry.classList.add("current-player");
      entry.style.borderColor = playerColor;
      entry.style.background = `${playerColor}20`;
    } else {
      entry.style.borderColor = "transparent";
      entry.style.background = "rgba(255, 255, 255, 0.05)";
    }

    const faceCards = player.collected.length;
    let totalCards = 0;
    player.collected.forEach((stack) => {
      totalCards +=
        1 + stack.left.length + stack.right.length + (stack.matchSlot ? 1 : 0);
    });

    const nameStyle = isCurrentPlayer
      ? `color: ${playerColor};`
      : "color: #f0f0f0;";

    // Trophy/ribbon emoji (only show for multi-player games)
    const isSolitaire = state.players.length === 1;
    let trophy = "";
    if (!isSolitaire) {
      if (rank === 1) trophy = "🥇";
      else if (rank === 2) trophy = "🥈";
      else if (rank === 3) trophy = "🥉";
    }

    // Deck display for current player (reserve space for all)
    const deckHtml = `
            <div class="player-deck-wrapper ${isCurrentPlayer ? "active" : ""}" data-player-index="${index}">
                <div class="deck-display-wrapper clickable-deck player-deck" data-player-index="${index}">
                    <div class="deck-display player-deck-display" data-player-index="${index}">
                        <div class="drawn-card-overlay player-drawn-card" data-player-index="${index}">
                            <div class="drawn-card-display"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    entry.innerHTML = `
            ${deckHtml}
            <div class="player-header-row">
                <div class="player-name-section">
                    ${trophy ? `<span class="trophy">${trophy}</span>` : ""}
                    <div class="player-name" style="${nameStyle}">${player.name}</div>
                </div>
            </div>
            <div class="player-stats">
                <span class="stat-main"><span>Stacks: </span><span>${faceCards}</span></span>
                <div class="stat-tiebreakers">
                    <span class="stat-tiebreaker"><span>Cards: </span><span>${totalCards}</span></span>
                    <span class="stat-tiebreaker"><span>6-7s: </span><span>${player.sixSevenCount}</span></span>
                </div>
            </div>
        `;
    playersList.appendChild(entry);
  });

  // Update deck displays for current player
  updatePlayerDecks(state);
}

/**
 * Update player deck displays
 */
function updatePlayerDecks(state) {
  const currentPlayerColor =
    PLAYER_COLORS[state.currentPlayerIndex % PLAYER_COLORS.length];

  state.players.forEach((player, index) => {
    const isCurrentPlayer = index === state.currentPlayerIndex;
    const deckWrapper = document.querySelector(
      `.player-deck-wrapper[data-player-index="${index}"]`,
    );
    const deckEl = document.querySelector(
      `.player-deck[data-player-index="${index}"]`,
    );
    const deckDisplay = document.querySelector(
      `.player-deck-display[data-player-index="${index}"]`,
    );
    const drawnCardOverlay = document.querySelector(
      `.player-drawn-card[data-player-index="${index}"]`,
    );

    if (!deckWrapper || !deckEl || !deckDisplay) return;

    // Check if this player is stuck (has a stuckCard stored)
    const playerHasStuckCard = player.stuckCard !== null && player.stuckCard !== undefined;
    
    // Show deck for current player OR stuck players with cards
    if (isCurrentPlayer || playerHasStuckCard) {
      if (isCurrentPlayer) {
        deckWrapper.classList.add("active");
        deckEl.style.background = `${currentPlayerColor}15`;
      } else {
        // Stuck player - show their deck but with different styling
        deckWrapper.classList.add("active");
        deckEl.style.background = "rgba(255, 255, 255, 0.05)";
      }

      // Update drawn card
      if (isCurrentPlayer && state.drawnCard) {
        // Current player's drawn card
        deckEl.classList.remove("clickable-deck");
        if (drawnCardOverlay) {
          drawnCardOverlay.classList.remove("hidden");
          const display = drawnCardOverlay.querySelector(".drawn-card-display");
          if (display) {
            display.innerHTML = "";
            display.appendChild(createCardElement(state.drawnCard));
          }
        }
      } else if (playerHasStuckCard && player.stuckCard) {
        // Stuck player's card (from player.stuckCard)
        deckEl.classList.remove("clickable-deck");
        if (drawnCardOverlay) {
          drawnCardOverlay.classList.remove("hidden");
          const display = drawnCardOverlay.querySelector(".drawn-card-display");
          if (display) {
            display.innerHTML = "";
            display.appendChild(createCardElement(player.stuckCard));
          }
        }
      } else if (isCurrentPlayer) {
        // Current player, no drawn card
        if (state.numberDeckCount > 0) {
          deckEl.classList.add("clickable-deck");
        } else {
          deckEl.classList.remove("clickable-deck");
        }
        if (drawnCardOverlay) {
          drawnCardOverlay.classList.add("hidden");
          const display = drawnCardOverlay.querySelector(".drawn-card-display");
          if (display) {
            display.innerHTML = "";
          }
        }
      }

      // Update deck visual (only for current player)
      if (isCurrentPlayer) {
        const existingStack = deckDisplay.querySelector(".deck-stack");
        if (existingStack) existingStack.remove();
        const existingEmpty = deckDisplay.querySelector(".empty-deck");
        if (existingEmpty) existingEmpty.remove();

        if (state.numberDeckCount > 0) {
          const cardStack = createDeckStack(state.numberDeckCount);
          deckDisplay.appendChild(cardStack);
        } else {
          const emptyDiv = document.createElement("div");
          emptyDiv.className = "empty-deck";
          emptyDiv.textContent = "Empty";
          deckDisplay.appendChild(emptyDiv);
        }
      } else {
        // Stuck player - show empty deck area (no stack, no "Empty" text)
        const existingStack = deckDisplay.querySelector(".deck-stack");
        if (existingStack) existingStack.remove();
        const existingEmpty = deckDisplay.querySelector(".empty-deck");
        if (existingEmpty) existingEmpty.remove();
      }
    } else {
      deckWrapper.classList.remove("active");
      deckEl.classList.remove("clickable-deck");
      deckEl.style.background = "";
      if (drawnCardOverlay) {
        drawnCardOverlay.classList.add("hidden");
      }
    }
  });
}

/**
 * Render all stacks
 */
function renderStacks(state) {
  const currentStackCount = state.stacks.length;
  const stacksChanged = currentStackCount !== previousStackCount;

  // If stacks changed, animate the transition
  if (stacksChanged && previousStackCount > 0) {
    // Animate existing stacks out if count decreased (stack was collected)
    if (currentStackCount < previousStackCount) {
      // The collection animation already handles this, so just update
      previousStackCount = currentStackCount;
      renderStacksInternal(state);
      return;
    }
  }

  renderStacksInternal(state);
  previousStackCount = currentStackCount;
  shouldAnimateNewStack = false; // Reset after rendering
}

/**
 * Internal function to render stacks
 */
function renderStacksInternal(state) {
  stacksContainer.innerHTML = "";

  const legalPlays = state.drawnCard ? game.getLegalPlaysForDrawnCard() : [];
  const currentStackCount = state.stacks.length;
  const wasAdding =
    currentStackCount > previousStackCount || shouldAnimateNewStack;

  state.stacks.forEach((stack, stackIndex) => {
    const stackEl = document.createElement("div");
    stackEl.className = "stack";
    // Reset any animation styles
    stackEl.style.transform = "";
    stackEl.style.opacity = "";
    stackEl.style.zIndex = "";

    const sum = calculateStackSum(stack);
    const isFull = isStackFull(stack);

    // Check if this stack has any legal plays
    const stackPlays = legalPlays.filter((p) => p.stackIndex === stackIndex);
    if (stackPlays.length > 0) {
      stackEl.classList.add("has-legal-play");
    }

    // Grey out full stacks with sum > 10 (can only play Matches, but can't match 6 or 7)
    if (isFull && sum > 10) {
      stackEl.classList.add("uncollectable");
    }

    // Face card
    const faceArea = document.createElement("div");
    faceArea.className = "stack-face";
    faceArea.appendChild(createCardElement(stack.face));
    stackEl.appendChild(faceArea);

    // Modifier rows
    const modifiersArea = document.createElement("div");
    modifiersArea.className = "stack-modifiers";

    const capacity = getStackCapacity(stack);

    // Calculate horizontal offsets based on capacity
    // J (capacity 1): [0]
    // Q (capacity 2): [-4, 4]
    // K (capacity 3): [-8, 0, 8]
    const getHorizontalOffset = (index, cap) => {
      if (cap === 1) return 0;
      if (cap === 2) return index === 0 ? -4 : 4;
      if (cap === 3) return index === 0 ? -8 : index === 1 ? 0 : 8;
      return 0;
    };

    for (let i = 0; i < capacity; i++) {
      const row = document.createElement("div");
      row.className = "modifier-row";

      // Left slot
      const leftSlot = document.createElement("div");
      leftSlot.className = "card-slot left-slot";
      const isNextLeftSlot = i === stack.left.length;
      
      // Apply horizontal offset to ALL slots (filled, clickable, and empty)
      const offset = getHorizontalOffset(i, capacity);
      leftSlot.style.transform = `translateX(${offset}px)`;
      
      if (stack.left[i]) {
        leftSlot.classList.add("filled");
        const cardEl = createCardElement(stack.left[i]);
        leftSlot.appendChild(cardEl);
        // Higher z-index for later cards (so they're on top)
        leftSlot.style.zIndex = 10 + i;
      } else if (isNextLeftSlot && stackPlays.some((p) => p.side === "left")) {
        // This is the next available left slot and it's a legal play
        leftSlot.classList.add("clickable");
        // Clickable slots get highest z-index
        leftSlot.style.zIndex = 100;
        leftSlot.addEventListener("click", () =>
          handlePlayCard(stackIndex, "left"),
        );
      }
      row.appendChild(leftSlot);

      // Right slot
      const rightSlot = document.createElement("div");
      rightSlot.className = "card-slot right-slot";
      const isNextRightSlot = i === stack.right.length;
      
      // Apply horizontal offset to ALL slots (filled, clickable, and empty)
      const rightOffset = getHorizontalOffset(i, capacity);
      rightSlot.style.transform = `translateX(${rightOffset}px)`;
      
      if (stack.right[i]) {
        rightSlot.classList.add("filled");
        const cardEl = createCardElement(stack.right[i]);
        rightSlot.appendChild(cardEl);
        // Higher z-index for later cards (so they're on top)
        rightSlot.style.zIndex = 10 + i;
      } else if (
        isNextRightSlot &&
        stackPlays.some((p) => p.side === "right")
      ) {
        // This is the next available right slot and it's a legal play
        rightSlot.classList.add("clickable");
        // Clickable slots get highest z-index
        rightSlot.style.zIndex = 100;
        rightSlot.addEventListener("click", () =>
          handlePlayCard(stackIndex, "right"),
        );
      }
      row.appendChild(rightSlot);

      modifiersArea.appendChild(row);
    }

    stackEl.appendChild(modifiersArea);

    // Match slot (only show if stack is full or has match play available)
    if (isStackFull(stack) || stackPlays.some((p) => p.side === "match")) {
      const matchRow = document.createElement("div");
      matchRow.className = "modifier-row";
      matchRow.style.justifyContent = "center";

      const matchSlot = document.createElement("div");
      matchSlot.className = "card-slot match-slot";

      if (stack.matchSlot) {
        matchSlot.classList.add("filled");
        matchSlot.appendChild(createCardElement(stack.matchSlot));
      } else if (stackPlays.some((p) => p.side === "match")) {
        matchSlot.classList.add("clickable");
        // Clickable slots get highest z-index
        matchSlot.style.zIndex = 100;
        matchSlot.addEventListener("click", () =>
          handlePlayCard(stackIndex, "match"),
        );
      }

      matchRow.appendChild(matchSlot);
      modifiersArea.appendChild(matchRow);
    }

    // Stack sum
    const sumDisplay = document.createElement("div");
    sumDisplay.className = "stack-sum";
    if (sum > 10) {
      sumDisplay.innerHTML = `Sum: <span class="sum-value sum-high">${sum}</span>`;
    } else {
      sumDisplay.innerHTML = `Sum: <span class="sum-value">${sum}</span>`;
    }
    stackEl.appendChild(sumDisplay);

    // Append stack to container
    stacksContainer.appendChild(stackEl);

    // Animate new stacks sliding in from face deck
    if (wasAdding && stackIndex === currentStackCount - 1) {
      const faceDeckEl = document.getElementById("face-deck-display");
      if (faceDeckEl) {
        stackEl.style.transition =
          "transform 0.5s ease-out, opacity 0.5s ease-out";
        stackEl.style.opacity = "0";

        // Calculate position from face deck to stack position
        requestAnimationFrame(() => {
          const faceDeckRect = faceDeckEl.getBoundingClientRect();
          const stackRect = stackEl.getBoundingClientRect();
          const deltaX =
            faceDeckRect.left +
            faceDeckRect.width / 2 -
            (stackRect.left + stackRect.width / 2);
          const deltaY =
            faceDeckRect.top +
            faceDeckRect.height / 2 -
            (stackRect.top + stackRect.height / 2);

          stackEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

          // Trigger animation after a brief delay
          setTimeout(() => {
            stackEl.style.transform = "translate(0, 0)";
            stackEl.style.opacity = "1";
          }, 50);
        });
      }
    }
  });

  // Clean up animation styles after animation completes
  if (wasAdding) {
    setTimeout(() => {
      document.querySelectorAll(".stack").forEach((stackEl) => {
        if (
          stackEl.style.transform === "translate(0, 0)" ||
          stackEl.style.transform === "translate(0px, 0px)"
        ) {
          stackEl.style.transition = "";
          stackEl.style.transform = "";
          stackEl.style.opacity = "";
        }
      });
    }, 550);
  }
}

/**
 * Handle drawing a card
 */
function handleDrawCard() {
  const state = game.getState();
  // Prevent drawing if already have a card, deck is empty, or processing animations
  if (state.drawnCard || state.numberDeckCount === 0 || isProcessing) return;

  const card = game.drawCard();
  if (!card) {
    // Number deck ran out - end game
    game.gameOver = true;
    renderGame();
    return;
  }

  const legalPlays = game.getLegalPlaysForDrawnCard();

  if (legalPlays.length === 0) {
    // No legal plays available
    renderGame(); // Show the drawn card
    
    const result = game.handleNoLegalPlay();

    if (result.createNewStack) {
      // A new stack was created
      if (autoPlayNewStacks && autoDraw) {
        // Auto-play on the new stack (only if both auto-draw and auto-play are enabled)
        const newPlays = game.getLegalPlaysForDrawnCard();
        if (newPlays.length > 0) {
          const play =
            newPlays.find((p) => p.stackIndex === result.newStackIndex) ||
            newPlays[0];
          setTimeout(() => {
            handlePlayCard(play.stackIndex, play.side);
          }, 1500);
        }
      } else {
        // Show message and wait for user to play
        setTimeout(() => {
          showAnnouncement(
            "No moves available. Starting new stack...",
            null,
            1500,
          );
          setTimeout(() => {
            renderGame(); // Re-render to show the new stack
          }, 500);
        }, 1500);
      }
    } else if (result.gameOver) {
      // Game over - wait 1.5s to show the card, then end game
      setTimeout(() => {
        game.gameOver = true;
        renderGame();
      }, 1500);
    } else {
      // Player is stuck, show card for 1.5s, then show message and advance turn
      // Don't clear the drawn card - keep it visible for players in the final round
      const state = game.getState();
      const isSolitaire = state.players.length === 1;
      const isAlreadyLastRound = state.stuckPlayer !== null;
      
      let message;
      if (isSolitaire) {
        message = "No more moves!";
      } else if (isAlreadyLastRound) {
        // Already in last round - this is another player who can't play
        message = "No available moves";
      } else {
        // First player to get stuck - starting last round
        message = "No available moves, last round!";
      }
      
      setTimeout(() => {
        showAnnouncement(message, null, 1500);
        setTimeout(() => {
          game.nextTurn();
          renderGame();
        }, 1500);
      }, 1500);
    }
    return; // Don't call renderGame() again at the end
  }

  renderGame();
}

/**
 * Handle playing a card
 */
function handlePlayCard(stackIndex, side) {
  const result = game.executePlay(stackIndex, side);

  if (!result.success) {
    console.error("Play failed:", result.error);
    return;
  }

  // Clear drawn card immediately
  const drawnCardOverlay = document.getElementById("drawn-card-area");
  if (drawnCardOverlay) {
    drawnCardOverlay.classList.add("hidden");
    const display = drawnCardOverlay.querySelector("#drawn-card-display");
    if (display) {
      display.innerHTML = "";
    }
  }

  if (result.collectionConditions.length > 0) {
    // Player can collect - prioritize six-seven over other conditions
    let condition = result.collectionConditions.find(
      (c) => c.type === "six-seven",
    );
    if (!condition) {
      condition = result.collectionConditions[0]; // Use first condition if no six-seven
    }
    pendingCollection = { stackIndex, type: condition.type };
    isProcessing = true; // Lock drawing during animation

    // Show announcement immediately (before animation)
    showAnnouncement(condition.announcement, null, null);

    // Start animation after brief delay
    setTimeout(() => {
      animateStackCollection(stackIndex, () => {
        // Start fade-out immediately (fade-out happens during the final portion of display)
        announcementOverlay.classList.add("fade-out");
        setTimeout(() => {
          announcementOverlay.classList.add("hidden");
          announcementOverlay.classList.remove("fade-out");
          const oldStackCount = game.getState().stacks.length;
          game.collectStack(
            pendingCollection.stackIndex,
            pendingCollection.type,
          );
          const newStackCount = game.getState().stacks.length;
          // If a new stack was created (one removed, one added), animate it
          shouldAnimateNewStack = newStackCount === oldStackCount;
          pendingCollection = null;
          isProcessing = false; // Unlock drawing after animation completes
          game.nextTurn();
          renderGame();
        }, 300); // Match fade-out animation duration
      });
    }, 200); // Brief delay before animation starts
  } else {
    // No collection, just advance turn
    game.nextTurn();
    renderGame();
    // Auto-draw will be handled in renderGame if enabled
  }
}

/**
 * Animate stack collection - shrink and translate to player name
 */
function animateStackCollection(stackIndex, callback) {
  const state = game.getState();
  const stackEl = document.querySelectorAll(".stack")[stackIndex];
  if (!stackEl) {
    callback();
    return;
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const playerEntry = Array.from(
    document.querySelectorAll(".player-entry"),
  ).find(
    (entry) =>
      entry.querySelector(".player-name").textContent === currentPlayer.name,
  );

  if (!playerEntry) {
    callback();
    return;
  }

  // Get positions
  const stackRect = stackEl.getBoundingClientRect();
  const playerRect = playerEntry.getBoundingClientRect();

  // Calculate transform
  const deltaX =
    playerRect.left +
    playerRect.width / 2 -
    (stackRect.left + stackRect.width / 2);
  const deltaY =
    playerRect.top +
    playerRect.height / 2 -
    (stackRect.top + stackRect.height / 2);

  // Apply animation
  stackEl.style.transition =
    "transform 0.6s ease-in-out, opacity 0.6s ease-in-out";
  stackEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.1)`;
  stackEl.style.opacity = "0";
  stackEl.style.zIndex = "1000";

  setTimeout(() => {
    callback();
  }, 600);
}

/**
 * Show announcement overlay
 */
function showAnnouncement(text, callback, autoDismissDelay = null) {
  announcementText.textContent = text;
  announcementOverlay.classList.remove("hidden");
  announcementOverlay.classList.remove("fade-out");

  // Auto-dismiss if delay is provided
  if (autoDismissDelay !== null) {
    const fadeOutDuration = 300; // Match fade-out animation duration
    // Start fade-out during the final portion of the display time
    const fadeOutStart = autoDismissDelay - fadeOutDuration;
    setTimeout(
      () => {
        if (!announcementOverlay.classList.contains("hidden")) {
          // Fade out instead of immediate hide
          announcementOverlay.classList.add("fade-out");
          setTimeout(() => {
            announcementOverlay.classList.add("hidden");
            announcementOverlay.classList.remove("fade-out");
            if (callback) callback();
          }, fadeOutDuration);
        }
      },
      Math.max(0, fadeOutStart),
    ); // Ensure non-negative delay
  } else {
    // If no auto-dismiss, call callback immediately (for non-collection announcements)
    if (callback) callback();
  }
}

/**
 * High score management
 */
const HIGH_SCORE_KEY = "sixseven-highscores";
const MAX_HIGH_SCORES = 20;

function getHighScores() {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveHighScores(scores) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
  } catch (e) {
    console.error("Failed to save high scores:", e);
  }
}

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
  const isNewTopForPlayer = isNewTopScoreForPlayer(playerName, newScore, scores);

  // Add new score
  scores.push(newScore);

  // Sort by same rules as calculateScores
  scores.sort((a, b) => {
    if (b.faceCards !== a.faceCards) return b.faceCards - a.faceCards;
    if (b.totalCards !== a.totalCards) return b.totalCards - a.totalCards;
    if (b.sixSevenCount !== a.sixSevenCount)
      return b.sixSevenCount - a.sixSevenCount;
    // If all tie, oldest stays (lower timestamp = older)
    return a.timestamp - b.timestamp;
  });

  // Find position of new score in full sorted list
  const newScoreIndex = scores.findIndex(
    (s) => s.timestamp === newScore.timestamp,
  );

  // Keep only top 20
  const topScores = scores.slice(0, MAX_HIGH_SCORES);
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
  };
}

function isNewTopScoreForPlayer(playerName, newScore, allScores) {
  // Get all scores for this player name
  const playerScores = allScores.filter((s) => s.playerName === playerName);
  
  // If player has no previous scores, this is their top score
  if (playerScores.length === 0) return true;

  // Sort player's scores by same rules
  playerScores.sort((a, b) => {
    if (b.faceCards !== a.faceCards) return b.faceCards - a.faceCards;
    if (b.totalCards !== a.totalCards) return b.totalCards - a.totalCards;
    if (b.sixSevenCount !== a.sixSevenCount)
      return b.sixSevenCount - a.sixSevenCount;
    return a.timestamp - b.timestamp;
  });

  // Get the player's current top score
  const topPlayerScore = playerScores[0];

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

function formatRankMessage(rank, isNewTopForPlayer) {
  let trophy = "";
  if (rank === 1) trophy = "🥇";
  else if (rank === 2) trophy = "🥈";
  else if (rank === 3) trophy = "🥉";

  const rankText =
    rank === ">20" ? ">20" : rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`;

  if (isNewTopForPlayer) {
    return `${trophy ? trophy + " " : ""}New Top Score - ${rankText} place!`;
  } else {
    return `New High Score - ${rankText} place!`;
  }
}

/**
 * Show high scores overlay
 */
function showHighScores() {
  const scores = getHighScores();
  
  // Re-query elements in case they weren't available at script load time
  const overlay = document.getElementById("high-scores-overlay");
  const list = document.getElementById("high-scores-list");
  
  if (!list || !overlay) {
    console.error("High scores overlay elements not found");
    return;
  }

  list.innerHTML = "";

  if (scores.length === 0) {
    list.innerHTML = '<div class="score-entry"><p>No high scores yet!</p></div>';
  } else {
    scores.forEach((score, index) => {
      const entry = document.createElement("div");
      entry.className = "score-entry";
      if (index === 0) entry.classList.add("winner");

      // Format date
      const date = new Date(score.timestamp);
      const dateStr = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // Trophy for top 3
      let trophy = "";
      if (index === 0) trophy = "🥇";
      else if (index === 1) trophy = "🥈";
      else if (index === 2) trophy = "🥉";

      entry.innerHTML = `
        <span class="player-name">${trophy ? trophy + " " : ""}${score.playerName}</span>
        <div class="score-details">
          <span>Stacks: ${score.faceCards}</span>
          <span>Cards: ${score.totalCards}</span>
          <span>6-7s: ${score.sixSevenCount}</span>
          <span class="score-date">${dateStr}</span>
        </div>
      `;
      list.appendChild(entry);
    });
  }

  // Show overlay with fade-in
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

/**
 * Show game over overlay
 */
function showGameOver() {
  const scores = game.getFinalScores();
  const winner = scores[0];
  const isSolitaire = scores.length === 1;

  if (isSolitaire) {
    // Solitaire mode: show high score message
    const result = addHighScore(
      winner.name,
      winner.faceCards,
      winner.totalCards,
      winner.sixSevenCount,
    );

    let message;
    if (result.isInTop20) {
      message = formatRankMessage(result.rank, result.isNewTopForPlayer);
    } else {
      message = "Good Game!";
    }

    winnerName.textContent = message;
  } else {
    // Multi-player mode: show winner
    winnerName.textContent = `${winner.name} Wins!`;
  }

  finalScores.innerHTML = "";
  scores.forEach((player, index) => {
    const entry = document.createElement("div");
    entry.className = "score-entry";
    if (index === 0) entry.classList.add("winner");

    entry.innerHTML = `
            <span class="player-name">${player.name}</span>
            <div class="score-details">
                <span>Stacks: ${player.faceCards}</span>
                <span>Cards: ${player.totalCards}</span>
                <span>6-7s: ${player.sixSevenCount}</span>
            </div>
        `;
    finalScores.appendChild(entry);
  });

  // Show as overlay with fade-in
  gameoverOverlay.classList.remove("hidden");
  gameoverOverlay.classList.remove("fade-out");
  // Trigger fade-in animation
  requestAnimationFrame(() => {
    gameoverOverlay.style.opacity = "0";
    gameoverOverlay.style.transition = "opacity 0.5s ease";
    requestAnimationFrame(() => {
      gameoverOverlay.style.opacity = "1";
    });
  });
}

/**
 * Create the game logo
 */
function createGameLogo() {
  if (!gameLogo) return;

  // 6 of Hearts (CCW rotated)
  const card6 = createCardElement({ rank: "6", suit: "hearts" }, "large");
  card6.classList.add("logo-card", "logo-card-6");
  card6.style.width = "150px";
  card6.style.height = "210px";
  gameLogo.appendChild(card6);

  // 7 of Spades (CW rotated, on top)
  const card7 = createCardElement({ rank: "7", suit: "spades" }, "large");
  card7.classList.add("logo-card", "logo-card-7");
  card7.style.width = "150px";
  card7.style.height = "210px";
  gameLogo.appendChild(card7);
}

/**
 * Enable debug mode (called from console)
 */
window.enableDebugMode = function () {
  debugMode = true;
  if (debugLoadScenarioBtn) {
    debugLoadScenarioBtn.classList.remove("hidden");
  }
  console.log("Debug mode enabled. Use loadScenario() to load test scenarios.");
};

/**
 * Load a test scenario
 */
window.loadScenario = function (scenarioName) {
  if (!debugMode) {
    console.error("Debug mode not enabled. Call enableDebugMode() first.");
    return;
  }

  const scenario = SCENARIOS[scenarioName];
  if (!scenario) {
    console.error(
      `Scenario "${scenarioName}" not found. Available scenarios:`,
      Object.keys(SCENARIOS),
    );
    return;
  }

  // Create game with scenario state
  game = new SixSevenGame(scenario.players || ["Player 1", "Player 2"]);

  // Override game state with scenario data
  if (scenario.stacks) {
    game.stacks = scenario.stacks.map((stackData) => {
      const stack = window.createStack(
        window.createCard(stackData.face.rank, stackData.face.suit),
      );
      stack.left = (stackData.left || []).map((c) =>
        window.createCard(c.rank, c.suit),
      );
      stack.right = (stackData.right || []).map((c) =>
        window.createCard(c.rank, c.suit),
      );
      stack.matchSlot = stackData.matchSlot
        ? window.createCard(stackData.matchSlot.rank, stackData.matchSlot.suit)
        : null;
      return stack;
    });
  }

  if (scenario.numberDeck) {
    game.numberDeck = scenario.numberDeck.map((c) =>
      window.createCard(c.rank, c.suit),
    );
  }

  if (scenario.faceDeck) {
    game.faceDeck = scenario.faceDeck.map((c) =>
      window.createCard(c.rank, c.suit),
    );
  }

  if (scenario.currentPlayerIndex !== undefined) {
    game.currentPlayerIndex = scenario.currentPlayerIndex;
  }

  if (scenario.drawnCard) {
    game.drawnCard = window.createCard(
      scenario.drawnCard.rank,
      scenario.drawnCard.suit,
    );
  }

  if (scenario.stuckPlayer !== undefined) {
    game.stuckPlayer = scenario.stuckPlayer;
  }

  if (scenario.players) {
    scenario.players.forEach((playerData, index) => {
      if (index < game.players.length && playerData.collected) {
        game.players[index].collected = playerData.collected.map(
          (stackData) => ({
            face: window.createCard(stackData.face.rank, stackData.face.suit),
            left: (stackData.left || []).map((c) =>
              window.createCard(c.rank, c.suit),
            ),
            right: (stackData.right || []).map((c) =>
              window.createCard(c.rank, c.suit),
            ),
            matchSlot: stackData.matchSlot
              ? window.createCard(
                  stackData.matchSlot.rank,
                  stackData.matchSlot.suit,
                )
              : null,
          }),
        );
        game.players[index].sixSevenCount = playerData.sixSevenCount || 0;
      }
    });
  }

  pendingCollection = null;
  previousStackCount = 0;
  shouldAnimateNewStack = false;
  isProcessing = false;

  showScreen("game");
  renderGame();
  console.log(`Loaded scenario: ${scenarioName}`);
};

// Test scenarios
const SCENARIOS = {
  "six-six": {
    players: ["Player 1", "Player 2"],
    stacks: [
      {
        face: { rank: "K", suit: "hearts" },
        left: [{ rank: "4", suit: "diamonds" }], // Sum is 4
        right: [],
      },
    ],
    numberDeck: [{ rank: "A", suit: "clubs" }],
    faceDeck: [],
    currentPlayerIndex: 0,
    drawnCard: { rank: "2", suit: "spades" }, // Play 2 on left to make sum 6
  },
  "seven-seven": {
    players: ["Player 1", "Player 2"],
    stacks: [
      {
        face: { rank: "Q", suit: "spades" },
        left: [{ rank: "5", suit: "hearts" }], // Sum is 5
        right: [],
      },
    ],
    numberDeck: [{ rank: "A", suit: "clubs" }],
    faceDeck: [],
    currentPlayerIndex: 0,
    drawnCard: { rank: "2", suit: "diamonds" }, // Play 2 on left to make sum 7
  },
  "six-seven": {
    players: ["Player 1", "Player 2"],
    stacks: [
      {
        face: { rank: "K", suit: "diamonds" },
        left: [{ rank: "6", suit: "hearts" }], // Visible 6
        right: [],
      },
    ],
    numberDeck: [{ rank: "A", suit: "clubs" }],
    faceDeck: [],
    currentPlayerIndex: 0,
    drawnCard: { rank: "7", suit: "spades" }, // Play 7 on left to trigger Six-Seven
  },
  nada: {
    players: ["Player 1", "Player 2"],
    stacks: [
      {
        face: { rank: "J", suit: "clubs" }, // Capacity 1 per side
        left: [{ rank: "5", suit: "hearts" }], // Sum is 5, left is full
        right: [], // Right is empty
      },
    ],
    numberDeck: [{ rank: "A", suit: "clubs" }],
    faceDeck: [],
    currentPlayerIndex: 0,
    drawnCard: { rank: "5", suit: "diamonds" }, // Play 5 on right to make sum 0, right becomes full
  },
  match: {
    players: ["Player 1", "Player 2"],
    stacks: [
      {
        face: { rank: "J", suit: "spades" }, // Capacity 1 per side
        left: [{ rank: "5", suit: "hearts" }], // Left full
        right: [{ rank: "3", suit: "diamonds" }], // Right full, sum is 2
      },
    ],
    numberDeck: [{ rank: "A", suit: "clubs" }],
    faceDeck: [],
    currentPlayerIndex: 0,
    drawnCard: { rank: "2", suit: "clubs" }, // Play 2 in match slot (matches sum 2)
  },
  "end-game": {
    players: ["Player 1", "Player 2"],
    stacks: [
      {
        face: { rank: "K", suit: "hearts" },
        left: [{ rank: "10", suit: "spades" }],
        right: [],
      },
    ],
    numberDeck: [],
    faceDeck: [],
    currentPlayerIndex: 0,
    drawnCard: { rank: "9", suit: "diamonds" },
    stuckPlayer: 0,
  },
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  createGameLogo();
  updatePlayerButtons(); // Initialize button states (remove button should be enabled with 2 players)

  // Set up debug button
  if (debugLoadScenarioBtn) {
    debugLoadScenarioBtn.addEventListener("click", () => {
      const scenarioNames = Object.keys(SCENARIOS);
      const selected = prompt(
        `Enter scenario name:\n${scenarioNames.join(", ")}`,
      );
      if (selected && SCENARIOS[selected]) {
        loadScenario(selected);
      } else if (selected) {
        alert(
          `Scenario "${selected}" not found. Available: ${scenarioNames.join(", ")}`,
        );
      }
    });
  }
});
