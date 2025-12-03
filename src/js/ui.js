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
let autoDraw = false; // Game option: automatically draw
let showStackSum = true; // Game option: show stack sum display
let hideIllegalMoves = true; // Game option: hide illegal moves (when true, don't show illegal sum moves)
let autoStartNewStacks = true; // Game option: automatically start new stacks (when true, auto-create; when false, require click)
let debugMode = false; // Debug mode flag
let isLoadingScenario = false; // Flag to track if we're loading a scenario (skip high scores)
let isProcessing = false; // Prevent drawing during animations/processing
let noValidMovesTimer = null; // Timer for tracking when no valid moves
let faceDeckShakeInterval = null; // Interval for shaking face deck

// Import from rendering.js (access directly to avoid redeclaration errors)
// Helper to access rendering functions without creating const conflicts
const getRendering = () => window.Rendering || {};

// Import from utils.js, high-scores.js, and ui-helpers.js (access directly to avoid redeclaration errors)
const getUtils = () => window.Utils || {};
const getHighScoresModule = () => window.HighScores || {};
const getUIHelpers = () => window.UIHelpers || {};

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // Only initialize if we're on the main game page (elements exist)
  if (!addPlayerBtn || !removePlayerBtn || !startGameBtn) {
    return; // Skip initialization on tutorial page
  }

  addPlayerBtn.addEventListener("click", addPlayer);
  removePlayerBtn.addEventListener("click", removePlayer);
  startGameBtn.addEventListener("click", startGame);
  if (menuBtn) {
    menuBtn.addEventListener("click", returnToMenu);
  }
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", returnToMenu);
  }
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

  // Game option checkboxes
  const showStackSumCheckbox = document.getElementById("show-stack-sum");
  if (showStackSumCheckbox) {
    showStackSumCheckbox.addEventListener("change", (e) => {
      showStackSum = e.target.checked;
      // Re-render game to apply the change immediately if game is active
      if (game && !gameScreen.classList.contains("hidden")) {
        renderGame();
      }
    });
  }

  const hideIllegalMovesCheckbox =
    document.getElementById("hide-illegal-moves");
  if (hideIllegalMovesCheckbox) {
    hideIllegalMovesCheckbox.addEventListener("change", (e) => {
      hideIllegalMoves = e.target.checked;
      // Re-render game to apply the change immediately if game is active
      if (game && !gameScreen.classList.contains("hidden")) {
        renderGame();
      }
    });
  }

  const autoStartNewStacksCheckbox = document.getElementById(
    "auto-start-new-stacks",
  );
  if (autoStartNewStacksCheckbox) {
    autoStartNewStacksCheckbox.addEventListener("change", (e) => {
      autoStartNewStacks = e.target.checked;
      // Re-render game to apply the change immediately if game is active
      if (game && !gameScreen.classList.contains("hidden")) {
        renderGame();
      }
    });
  }

  // Handle face deck clicks
  document.addEventListener("click", (e) => {
    const faceDeckCorner = e.target.closest(
      ".face-deck-corner.clickable-face-deck",
    );
    if (faceDeckCorner) {
      handleFaceDeckClick();
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
  isLoadingScenario = false; // Reset flag when starting a new game normally
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
  const showSumCheckbox = document.getElementById("show-stack-sum");
  showStackSum = showSumCheckbox ? showSumCheckbox.checked : true;
  const hideIllegalMovesCheckbox =
    document.getElementById("hide-illegal-moves");
  hideIllegalMoves = hideIllegalMovesCheckbox
    ? hideIllegalMovesCheckbox.checked
    : true;
  const autoStartNewStacksCheckbox = document.getElementById(
    "auto-start-new-stacks",
  );
  autoStartNewStacks = autoStartNewStacksCheckbox
    ? autoStartNewStacksCheckbox.checked
    : true;

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
  clearNoValidMovesTimer();
  stopFaceDeckShaking();
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
    (state.stuckPlayer !== null &&
      state.currentPlayerIndex === state.stuckPlayer) ||
    (state.numberDeckCount === 0 && !state.drawnCard) ||
    state.stacks.length === 0
  ) {
    game.gameOver = true;
    showGameOver();
    return;
  }

  // Check if there are no possible moves (all stacks full and >10, no face deck)
  if (
    state.stacks.length > 0 &&
    state.faceDeckCount === 0 &&
    !state.drawnCard
  ) {
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
  if (
    autoDraw &&
    !state.drawnCard &&
    state.numberDeckCount > 0 &&
    !isProcessing
  ) {
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
  const faceDeckCorner = document.querySelector(".face-deck-corner");

  // Update face deck count
  if (faceDeckCount) {
    faceDeckCount.textContent = state.faceDeckCount;
  }

  // Face deck visual
  if (faceDeckEl) {
    faceDeckEl.innerHTML = "";
    if (state.faceDeckCount > 0) {
      const cardStack = getRendering().createDeckStack(state.faceDeckCount);
      faceDeckEl.appendChild(cardStack);
    } else {
      faceDeckEl.innerHTML = '<div class="empty-deck">Empty</div>';
    }
  }

  // Make face deck clickable if auto-start is disabled, player has drawn card, and face deck has cards
  if (faceDeckCorner && !autoStartNewStacks) {
    const hasDrawnCard = state.drawnCard !== null;
    const legalPlays = hasDrawnCard ? game.getLegalPlaysForDrawnCard() : [];
    const hasNoValidMoves = hasDrawnCard && legalPlays.length === 0;
    const canClickFaceDeck = hasDrawnCard && state.faceDeckCount > 0;

    if (canClickFaceDeck) {
      faceDeckCorner.classList.add("clickable-face-deck");
      // Start timer if no valid moves and not already started
      if (hasNoValidMoves && !noValidMovesTimer) {
        noValidMovesTimer = setTimeout(() => {
          // Start shaking every few seconds
          startFaceDeckShaking();
        }, 15000); // 15 seconds
      } else if (!hasNoValidMoves) {
        // Clear timer and stop shaking if valid moves exist
        clearNoValidMovesTimer();
        stopFaceDeckShaking();
      }
    } else {
      faceDeckCorner.classList.remove("clickable-face-deck");
      clearNoValidMovesTimer();
      stopFaceDeckShaking();
    }
  } else if (faceDeckCorner) {
    faceDeckCorner.classList.remove("clickable-face-deck");
    clearNoValidMovesTimer();
    stopFaceDeckShaking();
  }
}

/**
 * Start shaking the face deck
 */
function startFaceDeckShaking() {
  const faceDeckCorner = document.querySelector(".face-deck-corner");
  if (!faceDeckCorner) return;

  // Clear any existing interval
  if (faceDeckShakeInterval) {
    clearInterval(faceDeckShakeInterval);
  }

  // Shake immediately, then every 3 seconds
  faceDeckCorner.classList.add("shaking");
  setTimeout(() => {
    faceDeckCorner.classList.remove("shaking");
  }, 500);

  faceDeckShakeInterval = setInterval(() => {
    faceDeckCorner.classList.add("shaking");
    setTimeout(() => {
      faceDeckCorner.classList.remove("shaking");
    }, 500);
  }, 3000); // Shake every 3 seconds
}

/**
 * Stop shaking the face deck
 */
function stopFaceDeckShaking() {
  const faceDeckCorner = document.querySelector(".face-deck-corner");
  if (faceDeckCorner) {
    faceDeckCorner.classList.remove("shaking");
  }
  if (faceDeckShakeInterval) {
    clearInterval(faceDeckShakeInterval);
    faceDeckShakeInterval = null;
  }
}

/**
 * Clear the no valid moves timer
 */
function clearNoValidMovesTimer() {
  if (noValidMovesTimer) {
    clearTimeout(noValidMovesTimer);
    noValidMovesTimer = null;
  }
}

/**
 * Handle clicking on face deck
 */
function handleFaceDeckClick() {
  // Only handle clicks when auto-start is disabled
  if (autoStartNewStacks) return;

  const state = game.getState();
  const hasDrawnCard = state.drawnCard !== null;

  // Check prerequisites
  if (!hasDrawnCard) {
    // No card drawn, do nothing
    return;
  }

  if (state.faceDeckCount === 0) {
    // Face deck is empty, do nothing
    return;
  }

  // Check for valid plays
  const legalPlays = game.getLegalPlaysForDrawnCard();

  if (legalPlays.length > 0) {
    // Valid moves exist - reject with message
    showAnnouncement(
      "Cannot add a new stack while valid plays remain",
      null,
      2000,
    );
    return;
  }

  // No valid moves and face deck has cards - create new stack
  clearNoValidMovesTimer();
  stopFaceDeckShaking();

  const result = game.handleNoLegalPlay();
  if (result.createNewStack) {
    // A new stack was created - render it immediately so user can see it
    renderGame();

    if (autoPlayNewStacks && autoDraw) {
      // Auto-play on the new stack (only if both auto-draw and auto-play are enabled)
      // Wait a bit longer to give user time to see the new stack before auto-playing
      setTimeout(() => {
        const newPlays = game.getLegalPlaysForDrawnCard();
        if (newPlays.length > 0) {
          const play =
            newPlays.find((p) => p.stackIndex === result.newStackIndex) ||
            newPlays[0];
          handlePlayCard(play.stackIndex, play.side);
        }
      }, 2000); // Longer delay to ensure stack is visible
    }
  }
}

/**
 * Render players at top
 */
function renderPlayers(state) {
  playersList.innerHTML = "";

  // Calculate scores for ranking
  const scored = state.players.map((player, index) => {
    const faceCards = player.collected.length;
    const totalCards = getUtils().calculateTotalCards(player);
    return {
      ...player,
      index,
      faceCards,
      totalCards,
    };
  });

  // Sort by scoring rules (same as calculateScores, but without timestamp)
  scored.sort((a, b) => getHighScoresModule().compareScores(a, b, false));

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
    const playerColors = getRendering().PLAYER_COLORS || [];
    const playerColor = playerColors[index % playerColors.length];
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
    const totalCards = getUtils().calculateTotalCards(player);

    const nameStyle = isCurrentPlayer
      ? `color: ${playerColor};`
      : "color: #f0f0f0;";

    // Trophy/ribbon emoji (only show for multi-player games)
    const isSolitaire = state.players.length === 1;
    const trophy = !isSolitaire ? getUtils().getTrophyEmoji(rank) : "";

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
  const playerColors = getRendering().PLAYER_COLORS || [];
  const currentPlayerColor =
    playerColors[state.currentPlayerIndex % playerColors.length];

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
    const playerHasStuckCard =
      player.stuckCard !== null && player.stuckCard !== undefined;

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
            display.appendChild(
              getRendering().createCardElement(state.drawnCard),
            );
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
            display.appendChild(
              getRendering().createCardElement(player.stuckCard),
            );
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
          const cardStack = getRendering().createDeckStack(
            state.numberDeckCount,
          );
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
    faceArea.appendChild(getRendering().createCardElement(stack.face));
    stackEl.appendChild(faceArea);

    // Modifier rows
    const modifiersArea = document.createElement("div");
    modifiersArea.className = "stack-modifiers";

    const capacity = getStackCapacity(stack);

    // Horizontal offsets are calculated using getHorizontalOffset from utils.js

    for (let i = 0; i < capacity; i++) {
      const row = document.createElement("div");
      row.className = "modifier-row";

      // Left slot
      const leftSlot = document.createElement("div");
      leftSlot.className = "card-slot left-slot";
      const isNextLeftSlot = i === stack.left.length;

      // Apply horizontal offset to ALL slots (filled, clickable, and empty)
      const offset = getUtils().getHorizontalOffset(i, capacity);
      leftSlot.style.transform = `translateX(${offset}px)`;

      if (stack.left[i]) {
        leftSlot.classList.add("filled");
        const cardEl = getRendering().createCardElement(stack.left[i]);
        leftSlot.appendChild(cardEl);
        // Higher z-index for later cards (so they're on top)
        leftSlot.style.zIndex = 10 + i;
      } else if (isNextLeftSlot) {
        // Check if this is a legal play or if we should show it anyway (when not hiding illegal moves)
        const isLegalPlay = stackPlays.some((p) => p.side === "left");
        const shouldShow =
          isLegalPlay || (!hideIllegalMoves && state.drawnCard);
        if (shouldShow) {
          leftSlot.classList.add("clickable");
          // Clickable slots get highest z-index
          leftSlot.style.zIndex = 100;
          leftSlot.addEventListener("click", () =>
            handlePlayCard(stackIndex, "left"),
          );
        }
      }
      row.appendChild(leftSlot);

      // Right slot
      const rightSlot = document.createElement("div");
      rightSlot.className = "card-slot right-slot";
      const isNextRightSlot = i === stack.right.length;

      // Apply horizontal offset to ALL slots (filled, clickable, and empty)
      const rightOffset = getUtils().getHorizontalOffset(i, capacity);
      rightSlot.style.transform = `translateX(${rightOffset}px)`;

      if (stack.right[i]) {
        rightSlot.classList.add("filled");
        const cardEl = getRendering().createCardElement(stack.right[i]);
        rightSlot.appendChild(cardEl);
        // Higher z-index for later cards (so they're on top)
        rightSlot.style.zIndex = 10 + i;
      } else if (isNextRightSlot) {
        // Check if this is a legal play or if we should show it anyway (when not hiding illegal moves)
        const isLegalPlay = stackPlays.some((p) => p.side === "right");
        const shouldShow =
          isLegalPlay || (!hideIllegalMoves && state.drawnCard);
        if (shouldShow) {
          rightSlot.classList.add("clickable");
          // Clickable slots get highest z-index
          rightSlot.style.zIndex = 100;
          rightSlot.addEventListener("click", () =>
            handlePlayCard(stackIndex, "right"),
          );
        }
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
        matchSlot.appendChild(
          getRendering().createCardElement(stack.matchSlot),
        );
      } else {
        // Check if this is a legal match play or if we should show it anyway (when not hiding illegal moves)
        const isLegalMatch = stackPlays.some((p) => p.side === "match");
        const shouldShowMatch =
          isLegalMatch || (!hideIllegalMoves && isFull && state.drawnCard);
        if (shouldShowMatch) {
          matchSlot.classList.add("clickable");
          // Clickable slots get highest z-index
          matchSlot.style.zIndex = 100;
          matchSlot.addEventListener("click", () =>
            handlePlayCard(stackIndex, "match"),
          );
        }
      }

      matchRow.appendChild(matchSlot);
      modifiersArea.appendChild(matchRow);
    }

    // Stack sum (only show if setting is enabled)
    if (showStackSum) {
      const sumDisplay = document.createElement("div");
      sumDisplay.className = "stack-sum";
      if (sum > 10) {
        sumDisplay.innerHTML = `Sum: <span class="sum-value sum-high">${sum}</span>`;
      } else {
        sumDisplay.innerHTML = `Sum: <span class="sum-value">${sum}</span>`;
      }
      stackEl.appendChild(sumDisplay);
    }

    // Append stack to container
    stacksContainer.appendChild(stackEl);

    // Animate new stacks sliding in from face deck
    // New stacks are added at the beginning (index 0) to avoid passing through other stacks
    if (wasAdding && stackIndex === 0) {
      const faceDeckEl = document.getElementById("face-deck-display");
      if (faceDeckEl) {
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

          // Set initial position WITHOUT transition (so it's instant)
          stackEl.style.transition = "none";
          stackEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          stackEl.style.opacity = "0";

          // Force a reflow to ensure initial transform is applied
          void stackEl.offsetHeight;

          // Use double requestAnimationFrame for smooth animation start
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // NOW set the transition and animate to final position
              // Use a smooth easing function for consistent animation
              stackEl.style.transition =
                "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)";

              // Trigger animation in next frame
              requestAnimationFrame(() => {
                stackEl.style.transform = "translate(0, 0)";
                stackEl.style.opacity = "1";
              });
            });
          });
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
    }, 650); // Match animation duration (600ms + small buffer)
  }
}

/**
 * Check if there are any possible moves (including illegal ones) for the drawn card
 * This is used when hideIllegalMoves is false to determine if we should wait longer
 */
function hasAnyPossibleMoves(state) {
  if (!state.drawnCard) return false;

  const cardValue = window.getCardValue(state.drawnCard);

  // Check each stack for possible moves
  for (let i = 0; i < state.stacks.length; i++) {
    const stack = state.stacks[i];
    const capacity = window.getStackCapacity(stack);
    const isLeftFull = stack.left.length >= capacity;
    const isRightFull = stack.right.length >= capacity;
    const isStackFull = window.isStackFull(stack);

    // Check if card could be played on left side (if there's room)
    if (!isLeftFull) {
      return true; // There's room, so it's a possible move (even if illegal)
    }

    // Check if card could be played on right side (if there's room)
    if (!isRightFull) {
      return true; // There's room, so it's a possible move (even if illegal)
    }

    // Check if card could be played as match (if stack is full)
    if (isStackFull) {
      return true; // Stack is full, so match is possible (even if card value doesn't match sum)
    }
  }

  return false; // No possible moves at all
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

    const state = game.getState();

    // If auto-start is disabled and face deck has cards, don't auto-create stack
    if (!autoStartNewStacks && state.faceDeckCount > 0) {
      // Face deck has cards - wait for user to click
      return; // Don't proceed with auto-creating stack
    }

    // Check if we're already in last round BEFORE calling handleNoLegalPlay
    // (since handleNoLegalPlay will set stuckPlayer if it's the first time)
    const stateBefore = game.getState();
    const isAlreadyLastRound = stateBefore.stuckPlayer !== null;
    const isSolitaire = stateBefore.players.length === 1;
    const hasFaceDeck = stateBefore.faceDeckCount > 0;

    if (hasFaceDeck) {
      // Show message first, then create stack
      setTimeout(() => {
        showAnnouncement(
          "No moves available. Starting new stack...",
          null,
          1500,
        );
        setTimeout(() => {
          const result = game.handleNoLegalPlay();

          if (result.createNewStack) {
            // A new stack was created - render it immediately so user can see it
            renderGame();

            if (autoPlayNewStacks && autoDraw) {
              // Auto-play on the new stack (only if both auto-draw and auto-play are enabled)
              // Wait longer before auto-playing to give user time to see the stack
              setTimeout(() => {
                const newPlays = game.getLegalPlaysForDrawnCard();
                if (newPlays.length > 0) {
                  const play =
                    newPlays.find(
                      (p) => p.stackIndex === result.newStackIndex,
                    ) || newPlays[0];
                  handlePlayCard(play.stackIndex, play.side);
                }
              }, 1000); // Additional delay after stack is rendered to ensure it's visible
            }
          }
        }, 500); // Small delay after message to let it show
      }, 1500);
    } else {
      // No face deck - player is stuck
      const result = game.handleNoLegalPlay();

      if (result.gameOver) {
        // Game over - wait 1.5s to show the card, then end game
        setTimeout(() => {
          game.gameOver = true;
          renderGame();
        }, 1500);
      } else {
        // Player is stuck, show message and advance turn
        const state = game.getState();

        let message;
        if (isSolitaire) {
          message = "No more moves!";
        } else if (isAlreadyLastRound) {
          message = "No available moves";
        } else {
          message = "No available moves, last round!";
        }

        // Check if there are any possible moves (including illegal ones) when hideIllegalMoves is false
        let hasPossibleMoves = false;
        if (!hideIllegalMoves && state.drawnCard) {
          hasPossibleMoves = hasAnyPossibleMoves(state);
        }

        // Wait 3 seconds if there are possible moves (illegal ones), otherwise 1.5 seconds
        const delay = hasPossibleMoves ? 3000 : 1500;

        setTimeout(() => {
          showAnnouncement(message, null, 1500);
          setTimeout(() => {
            game.nextTurn();
            renderGame();
          }, 1500);
        }, delay);
      }
    }
    return; // Don't call renderGame() again at the end
  }

  renderGame();
}

/**
 * Handle playing a card
 */
function handlePlayCard(stackIndex, side) {
  // Check if this is an illegal sum move before executing (if not hiding illegal moves)
  if (!hideIllegalMoves) {
    const state = game.getState();
    if (state.drawnCard) {
      const stack = state.stacks[stackIndex];
      const cardValue = window.getCardValue(state.drawnCard);
      const currentSum = window.calculateStackSum(stack);

      let wouldBeIllegalBySum = false;
      if (side === "left") {
        // Check if left side is full first
        const isLeftFull = stack.left.length >= window.getStackCapacity(stack);
        if (!isLeftFull) {
          const newSum = currentSum + cardValue;
          wouldBeIllegalBySum = newSum < 0;
        }
      } else if (side === "right") {
        // Check if right side is full first
        const isRightFull =
          stack.right.length >= window.getStackCapacity(stack);
        if (!isRightFull) {
          const newSum = currentSum - cardValue;
          wouldBeIllegalBySum = newSum < 0;
        }
      } else if (side === "match") {
        // Check if match is legal (card value must equal stack sum)
        const isFull = window.isStackFull(stack);
        if (isFull) {
          wouldBeIllegalBySum = cardValue !== currentSum;
        }
      }

      if (wouldBeIllegalBySum) {
        // Show error message for illegal sum move
        if (side === "match") {
          showAnnouncement(
            `Card value (${cardValue}) must equal stack sum (${currentSum})!`,
            null,
            2000,
          );
        } else {
          showAnnouncement("Cannot reduce stack sum below zero!", null, 2000);
        }
        return;
      }
    }
  }

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

  // Render the card on the stack first so user can see it before collection
  renderGame();

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

    // Wait longer for the card to be visible on the stack, then show announcement
    setTimeout(() => {
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
            const newState = game.getState();
            const newStackCount = newState.stacks.length;
            // If a new stack was created (one removed, one added), animate it
            shouldAnimateNewStack = newStackCount === oldStackCount;
            pendingCollection = null;
            isProcessing = false; // Unlock drawing after animation completes
            clearNoValidMovesTimer();
            stopFaceDeckShaking();

            // Check if game should end (no stacks and no face cards)
            if (newStackCount === 0 && newState.faceDeckCount === 0) {
              game.gameOver = true;
              showGameOver();
              return;
            }

            game.nextTurn();
            renderGame();
          }, 300); // Match fade-out animation duration
        });
      }, 200); // Brief delay before animation starts
    }, 500); // Longer delay to show card on stack before announcement
  } else {
    // No collection, just advance turn
    clearNoValidMovesTimer();
    stopFaceDeckShaking();
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

// High score functions are accessed via getHighScoresModule() helper

/**
 * Show high scores overlay
 */
function showHighScores() {
  const scores = getHighScoresModule().getHighScores();

  // Re-query elements in case they weren't available at script load time
  const overlay = document.getElementById("high-scores-overlay");
  const list = document.getElementById("high-scores-list");

  if (!list || !overlay) {
    console.error("High scores overlay elements not found");
    return;
  }

  list.innerHTML = "";

  if (scores.length === 0) {
    list.innerHTML =
      '<div class="score-entry"><p>No high scores yet!</p></div>';
  } else {
    scores.forEach((score, index) => {
      const entry = document.createElement("div");
      entry.className = "score-entry";
      if (index === 0) entry.classList.add("winner");

      // Format date
      const dateStr = getUtils().formatDate(score.timestamp);

      // Trophy for top 3
      const trophy = getUtils().getTrophyEmoji(index + 1);

      // Rank is 1-based
      const rank = index + 1;

      entry.innerHTML = getUIHelpers().createScoreEntryHTML(
        score,
        trophy,
        dateStr,
        rank,
      );
      list.appendChild(entry);
    });
  }

  // Show overlay with fade-in
  getUIHelpers().animateOverlayFadeIn(overlay);
}

/**
 * Show game over overlay
 */
function showGameOver() {
  const scores = game.getFinalScores();
  const winner = scores[0];
  const isSolitaire = scores.length === 1;

  if (isSolitaire && !isLoadingScenario) {
    // Solitaire mode: show high score message and nearby scores (skip if loading scenario)
    const result = getHighScoresModule().addHighScore(
      winner.name,
      winner.faceCards,
      winner.totalCards,
      winner.sixSevenCount,
    );

    let message;
    if (result.isInTop20) {
      message = getHighScoresModule().formatRankMessage(
        result.rank,
        result.isNewTopForPlayer,
      );
    } else {
      message = "Good Game!";
    }

    winnerName.textContent = message;

    // Display nearby scores
    const allScores = getHighScoresModule().getHighScores();
    const nearbyScores = getHighScoresModule().getNearbyScores(
      allScores,
      result.newScoreTimestamp,
      result.isInTop20,
      result.newScore,
    );

    finalScores.innerHTML = "";
    nearbyScores.forEach((item) => {
      if (item.isEllipsis) {
        // Add ellipsis
        const ellipsis = document.createElement("div");
        ellipsis.className = "score-entry score-ellipsis";
        ellipsis.innerHTML =
          '<span style="color: rgba(255, 255, 255, 0.5);">⋯</span>';
        finalScores.appendChild(ellipsis);
      } else {
        const entry = document.createElement("div");
        entry.className = "score-entry";
        if (item.isNewScore) {
          entry.classList.add("new-score");
        }

        // Format date
        const dateStr = getUtils().formatDate(item.score.timestamp);

        // Trophy for top 3 (only if in top 20)
        const trophy =
          typeof item.displayIndex === "number"
            ? getUtils().getTrophyEmoji(item.displayIndex)
            : "";

        // Get rank for display
        const rank = item.displayIndex || null;

        entry.innerHTML = getUIHelpers().createScoreEntryHTML(
          item.score,
          trophy,
          dateStr,
          rank,
        );
        finalScores.appendChild(entry);
      }
    });
  } else if (isSolitaire && isLoadingScenario) {
    // Solitaire mode but loading scenario - just show simple message, no high scores
    winnerName.textContent = "Good Game!";
    finalScores.innerHTML = ""; // Clear scores display
  } else {
    // Multi-player mode: show winner and final standings (no high scores)
    winnerName.textContent = `${winner.name} Wins!`;

    finalScores.innerHTML = "";
    scores.forEach((player, index) => {
      const entry = document.createElement("div");
      entry.className = "score-entry";
      if (index === 0) entry.classList.add("winner");

      // Show player standings with rank (no date, no high score format)
      const rank = index + 1;
      const trophy = getUtils().getTrophyEmoji(rank);
      const trophyPrefix = trophy ? `${trophy} ` : "";

      entry.innerHTML = `
        <span class="score-rank">${rank}</span>
        <span class="player-name">${trophyPrefix}${player.name}</span>
        <div class="score-details">
          <span>Stacks: ${player.faceCards}</span>
          <span>Cards: ${player.totalCards}</span>
          <span>6-7s: ${player.sixSevenCount || 0}</span>
        </div>
      `;
      finalScores.appendChild(entry);
    });
  }

  // Show as overlay with fade-in
  getUIHelpers().animateOverlayFadeIn(gameoverOverlay);
}

/**
 * Create the game logo
 */
function createGameLogo() {
  if (!gameLogo) return;

  // 6 of Hearts (CCW rotated)
  const card6 = getRendering().createCardElement(
    { rank: "6", suit: "hearts" },
    "large",
  );
  if (card6) {
    card6.classList.add("logo-card", "logo-card-6");
    card6.style.width = "150px";
    card6.style.height = "210px";
    gameLogo.appendChild(card6);
  }

  // 7 of Spades (CW rotated, on top)
  const card7 = getRendering().createCardElement(
    { rank: "7", suit: "spades" },
    "large",
  );
  if (card7) {
    card7.classList.add("logo-card", "logo-card-7");
    card7.style.width = "150px";
    card7.style.height = "210px";
    gameLogo.appendChild(card7);
  }
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

  isLoadingScenario = true; // Set flag to skip high score collection

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

  // Don't reset the flag - keep it set so high scores aren't saved
  // The flag will be reset when a new game starts normally
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
  "new-stack-six-six": {
    players: ["Player 1"],
    stacks: [
      {
        face: { rank: "J", suit: "diamonds" },
        left: [{ rank: "10", suit: "hearts" }],
        right: [],
      },
    ],
    numberDeck: [{ rank: "6", suit: "hearts" }],
    faceDeck: [{ rank: "K", suit: "diamonds" }],
    currentPlayerIndex: 0,
    drawnCard: { rank: "5", suit: "spades" },
    // Expected: When auto-play is enabled, the 6 plays on the new stack, sum becomes 6, triggers Six Six!
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
