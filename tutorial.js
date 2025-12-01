/**
 * Tutorial System for Sixen
 * Provides isolated game instances for tutorial examples
 */

class TutorialGame {
  constructor(containerId, scenario, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    this.originalScenario = JSON.parse(JSON.stringify(scenario)); // Deep copy
    this.allowedMoves = options.allowedMoves || [];
    this.autoPlaySteps = options.autoPlaySteps || [];
    this.autoPlayDelay = options.autoPlayDelay || 1500;
    this.endGameMessage = options.endGameMessage || null;
    this.isAutoPlaying = false;
    this.autoPlayIndex = 0;

    // Create isolated game instance
    this.game = this.createGameFromScenario(scenario);
    this.initialState = this.game.getState();

    // Create DOM structure
    this.setupDOM();

    // Render initial state
    this.render();

    // Start auto-play if enabled
    if (options.autoPlay && this.autoPlaySteps.length > 0) {
      setTimeout(() => {
        this.startAutoPlay();
      }, 1000);
    }
  }

  createGameFromScenario(scenario) {
    // Create game with players
    const game = new window.SixSevenGame(scenario.players || ["Player 1"]);

    // Override stacks
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
          ? window.createCard(
              stackData.matchSlot.rank,
              stackData.matchSlot.suit,
            )
          : null;
        return stack;
      });
    }

    // Override decks
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

    // Override game state
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

    return game;
  }

  setupDOM() {
    // Clear container
    this.container.innerHTML = "";

    // Create game board structure
    const gameBoard = document.createElement("div");
    gameBoard.className = "tutorial-game-board";

    // Create controls (only show reset button if there are moves or auto-play)
    const controls = document.createElement("div");
    controls.className = "tutorial-game-controls";
    const hasInteractivity =
      (this.allowedMoves && this.allowedMoves.length > 0) ||
      (this.autoPlaySteps && this.autoPlaySteps.length > 0) ||
      this.autoPlay;
    if (hasInteractivity) {
      const resetBtn = document.createElement("button");
      resetBtn.className = "btn btn-small tutorial-reset-btn";
      resetBtn.textContent = "Reset";
      resetBtn.addEventListener("click", () => this.reset());
      controls.appendChild(resetBtn);
    }

    // Create stacks container
    const stacksContainer = document.createElement("div");
    stacksContainer.className = "tutorial-stacks-container";
    stacksContainer.id = `${this.containerId}-stacks`;

    // Create player area (simplified for tutorial)
    const playerArea = document.createElement("div");
    playerArea.className = "tutorial-player-area";
    playerArea.id = `${this.containerId}-player`;

    // Create drawn card area
    const drawnCardArea = document.createElement("div");
    drawnCardArea.className = "tutorial-drawn-card-area";
    drawnCardArea.id = `${this.containerId}-drawn-card`;

    // Create message area for collection announcements
    const messageArea = document.createElement("div");
    messageArea.className = "tutorial-message-area hidden";
    messageArea.id = `${this.containerId}-message`;

    gameBoard.appendChild(controls);
    gameBoard.appendChild(playerArea);
    gameBoard.appendChild(drawnCardArea);
    gameBoard.appendChild(messageArea);
    gameBoard.appendChild(stacksContainer);

    this.container.appendChild(gameBoard);

    // Store references
    this.stacksContainer = stacksContainer;
    this.playerArea = playerArea;
    this.drawnCardArea = drawnCardArea;
    this.messageArea = messageArea;
  }

  render() {
    const state = this.game.getState();

    // Clear containers
    this.stacksContainer.innerHTML = "";
    this.drawnCardArea.innerHTML = "";

    // Check if this is an endgame scenario with no visual content (only if endGameMessage is explicitly set)
    if (
      this.endGameMessage &&
      (!state.stacks || state.stacks.length === 0) &&
      !state.drawnCard
    ) {
      // Show message if no stacks and no card
      this.messageArea.textContent = this.endGameMessage;
      this.messageArea.classList.remove("hidden");
      this.messageArea.classList.add("show");
      return;
    }

    // Hide message initially (will show if needed)
    this.messageArea.classList.add("hidden");

    // Render drawn card if present
    if (state.drawnCard) {
      const cardEl = window.TutorialRendering.createCardElement(
        state.drawnCard,
      );
      this.drawnCardArea.appendChild(cardEl);
      this.drawnCardArea.classList.remove("hidden");
    } else {
      this.drawnCardArea.classList.add("hidden");
    }

    // Render player info
    if (
      state.players &&
      state.players.length > 0 &&
      state.currentPlayerIndex !== undefined
    ) {
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer) {
        this.playerArea.innerHTML = `
          <div class="tutorial-player-name">${currentPlayer.name}'s Turn</div>
          <div class="tutorial-player-stats">
            <span>Stacks: ${currentPlayer.collected ? currentPlayer.collected.length : 0}</span>
          </div>
        `;
      }
    }

    // Get legal plays
    const legalPlays = state.drawnCard
      ? this.game.getLegalPlaysForDrawnCard()
      : [];

    // Render stacks
    if (state.stacks && state.stacks.length > 0) {
      state.stacks.forEach((stack, stackIndex) => {
        const stackEl = this.renderStack(stack, stackIndex, legalPlays);
        this.stacksContainer.appendChild(stackEl);
      });
    }

    // If number deck is empty and no drawn card, show message (only if endGameMessage is explicitly set)
    if (
      this.endGameMessage &&
      state.numberDeck &&
      state.numberDeck.length === 0 &&
      !state.drawnCard &&
      state.stacks &&
      state.stacks.length > 0
    ) {
      this.messageArea.textContent = this.endGameMessage;
      this.messageArea.classList.remove("hidden");
      this.messageArea.classList.add("show");
    }

    // If stuck player scenario, show message if provided
    if (state.stuckPlayer !== null && state.drawnCard && this.endGameMessage) {
      // Check if card is actually unplayable
      const legalPlays = this.game.getLegalPlaysForDrawnCard();
      if (legalPlays.length === 0) {
        this.messageArea.textContent = this.endGameMessage;
        this.messageArea.classList.remove("hidden");
        this.messageArea.classList.add("show");
      }
    }
  }

  renderStack(stack, stackIndex, legalPlays) {
    const stackEl = document.createElement("div");
    stackEl.className = "stack tutorial-stack";

    const sum = window.calculateStackSum(stack);
    const isFull = window.isStackFull(stack);
    const capacity = window.getStackCapacity(stack);

    // Check if this stack has legal plays
    const stackPlays = legalPlays.filter((p) => p.stackIndex === stackIndex);

    // Check if moves are restricted
    const hasRestrictedMoves = this.allowedMoves.length > 0;
    const allowedStackPlays = hasRestrictedMoves
      ? stackPlays.filter((p) =>
          this.allowedMoves.some(
            (m) => m.stackIndex === stackIndex && m.side === p.side,
          ),
        )
      : stackPlays;

    if (allowedStackPlays.length > 0) {
      stackEl.classList.add("has-legal-play");
    }

    // Grey out full stacks with sum > 10
    if (isFull && sum > 10) {
      stackEl.classList.add("uncollectable");
    }

    // Face card
    const faceArea = document.createElement("div");
    faceArea.className = "stack-face";
    faceArea.appendChild(
      window.TutorialRendering.createCardElement(stack.face),
    );
    stackEl.appendChild(faceArea);

    // Modifier rows
    const modifiersArea = document.createElement("div");
    modifiersArea.className = "stack-modifiers";

    // Horizontal offset function
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
      const offset = getHorizontalOffset(i, capacity);
      leftSlot.style.transform = `translateX(${offset}px)`;

      if (stack.left[i]) {
        leftSlot.classList.add("filled");
        const cardEl = window.TutorialRendering.createCardElement(
          stack.left[i],
        );
        leftSlot.appendChild(cardEl);
        leftSlot.style.zIndex = 10 + i;
      } else if (
        isNextLeftSlot &&
        allowedStackPlays.some((p) => p.side === "left")
      ) {
        leftSlot.classList.add("clickable");
        leftSlot.style.zIndex = 100;
        leftSlot.addEventListener("click", () =>
          this.handlePlayCard(stackIndex, "left"),
        );
      }
      row.appendChild(leftSlot);

      // Right slot
      const rightSlot = document.createElement("div");
      rightSlot.className = "card-slot right-slot";
      const isNextRightSlot = i === stack.right.length;
      const rightOffset = getHorizontalOffset(i, capacity);
      rightSlot.style.transform = `translateX(${rightOffset}px)`;

      if (stack.right[i]) {
        rightSlot.classList.add("filled");
        const cardEl = window.TutorialRendering.createCardElement(
          stack.right[i],
        );
        rightSlot.appendChild(cardEl);
        rightSlot.style.zIndex = 10 + i;
      } else if (
        isNextRightSlot &&
        allowedStackPlays.some((p) => p.side === "right")
      ) {
        rightSlot.classList.add("clickable");
        rightSlot.style.zIndex = 100;
        rightSlot.addEventListener("click", () =>
          this.handlePlayCard(stackIndex, "right"),
        );
      }
      row.appendChild(rightSlot);

      modifiersArea.appendChild(row);
    }

    // Match slot
    if (
      window.isStackFull(stack) ||
      allowedStackPlays.some((p) => p.side === "match")
    ) {
      const matchRow = document.createElement("div");
      matchRow.className = "modifier-row";
      matchRow.style.justifyContent = "center";

      const matchSlot = document.createElement("div");
      matchSlot.className = "card-slot match-slot";

      if (stack.matchSlot) {
        matchSlot.classList.add("filled");
        matchSlot.appendChild(
          window.TutorialRendering.createCardElement(stack.matchSlot),
        );
      } else if (allowedStackPlays.some((p) => p.side === "match")) {
        matchSlot.classList.add("clickable");
        matchSlot.style.zIndex = 100;
        matchSlot.addEventListener("click", () =>
          this.handlePlayCard(stackIndex, "match"),
        );
      }

      matchRow.appendChild(matchSlot);
      modifiersArea.appendChild(matchRow);
    }

    stackEl.appendChild(modifiersArea);

    // Stack sum
    const sumDisplay = document.createElement("div");
    sumDisplay.className = "stack-sum";
    if (sum > 10) {
      sumDisplay.innerHTML = `Sum: <span class="sum-value sum-high">${sum}</span>`;
    } else {
      sumDisplay.innerHTML = `Sum: <span class="sum-value">${sum}</span>`;
    }
    stackEl.appendChild(sumDisplay);

    return stackEl;
  }

  handlePlayCard(stackIndex, side) {
    // Check if move is allowed (only check during manual play, not auto-play)
    if (!this.isAutoPlaying && this.allowedMoves.length > 0) {
      const isAllowed = this.allowedMoves.some(
        (m) => m.stackIndex === stackIndex && m.side === side,
      );
      if (!isAllowed) {
        return; // Move not allowed
      }
    }

    const result = this.game.executePlay(stackIndex, side);

    if (!result.success) {
      console.error("Play failed:", result.error);
      return;
    }

    // Render the card in place first
    this.render();

    // Handle collection
    if (result.collectionConditions.length > 0) {
      const condition =
        result.collectionConditions.find((c) => c.type === "six-seven") ||
        result.collectionConditions[0];

      // Wait a moment to show the card in place, then show collection message
      setTimeout(() => {
        this.showMessage(condition.announcement, () => {
          // Collect stack after message is shown
          this.game.collectStack(stackIndex, condition.type);
          this.game.nextTurn();
          this.render();
        });
      }, 800);
    } else {
      // Show sum announcement (no overlay, just brief message)
      setTimeout(() => {
        const newSum = window.calculateStackSum(this.game.stacks[stackIndex]);
        this.showSumMessage(newSum);
        this.game.nextTurn();
        this.render();
      }, 800);
    }
  }

  reset() {
    this.stopAutoPlay();
    this.game = this.createGameFromScenario(this.originalScenario);
    this.initialState = this.game.getState();
    this.render();
  }

  startAutoPlay() {
    if (this.autoPlaySteps.length === 0) return;

    this.isAutoPlaying = true;
    this.autoPlayIndex = 0;
    this.executeAutoPlayStep();
  }

  stopAutoPlay() {
    this.isAutoPlaying = false;
    this.autoPlayIndex = 0;
  }

  executeAutoPlayStep() {
    if (
      !this.isAutoPlaying ||
      this.autoPlayIndex >= this.autoPlaySteps.length
    ) {
      this.isAutoPlaying = false;
      return;
    }

    const step = this.autoPlaySteps[this.autoPlayIndex];
    const state = this.game.getState();

    // If no card is drawn, we can't play
    if (!state.drawnCard) {
      this.isAutoPlaying = false;
      return;
    }

    // Execute the play
    this.handlePlayCard(step.stackIndex, step.side);

    // Move to next step
    this.autoPlayIndex++;
    if (this.autoPlayIndex < this.autoPlaySteps.length) {
      setTimeout(() => {
        this.executeAutoPlayStep();
      }, this.autoPlayDelay);
    } else {
      this.isAutoPlaying = false;
    }
  }

  showMessage(text, callback) {
    if (!this.messageArea) return;

    this.messageArea.textContent = text;
    this.messageArea.classList.remove("hidden");
    this.messageArea.classList.add("show");

    // Hide message after delay
    setTimeout(() => {
      this.messageArea.classList.remove("show");
      setTimeout(() => {
        this.messageArea.classList.add("hidden");
        if (callback) callback();
      }, 300);
    }, 2000);
  }

  showSumMessage(sum) {
    if (!this.messageArea) return;

    // Convert sum to word
    const sumWords = [
      "Zero",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
    ];
    const sumWord = sumWords[sum] || sum.toString();

    this.messageArea.textContent = sumWord;
    this.messageArea.classList.remove("hidden");
    this.messageArea.classList.add("show-sum");

    // Hide message quickly (sum announcements are brief)
    setTimeout(() => {
      this.messageArea.classList.remove("show-sum");
      setTimeout(() => {
        this.messageArea.classList.add("hidden");
      }, 200);
    }, 800);
  }

  getState() {
    return this.game.getState();
  }
}

// Tutorial system
let tutorialData = null;

async function loadTutorialData() {
  try {
    const response = await fetch("tutorial-data.json");
    tutorialData = await response.json();
    return tutorialData;
  } catch (error) {
    console.error("Failed to load tutorial data:", error);
    return null;
  }
}

function generateTableOfContents(sections) {
  const toc = document.getElementById("tutorial-toc");
  if (!toc) return;

  toc.innerHTML = "";

  sections.forEach((section) => {
    const item = document.createElement("div");
    item.className = "toc-item";
    const link = document.createElement("a");
    link.href = `#${section.id}`;
    link.textContent = section.title;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById(section.id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    item.appendChild(link);
    toc.appendChild(item);
  });
}

function renderSection(section) {
  const contentArea = document.getElementById("tutorial-content");
  if (!contentArea) return;

  // Create section element
  const sectionEl = document.createElement("section");
  sectionEl.id = section.id;
  sectionEl.className = "tutorial-section";

  // Render content (simple markdown-like parsing for headers and paragraphs)
  const contentDiv = document.createElement("div");
  contentDiv.className = "tutorial-section-content";
  contentDiv.innerHTML = parseMarkdown(section.content);
  sectionEl.appendChild(contentDiv);

  // Render examples
  if (section.examples && section.examples.length > 0) {
    section.examples.forEach((example, index) => {
      const exampleEl = document.createElement("div");
      exampleEl.className = "tutorial-example";
      exampleEl.id = `${section.id}-example-${index}`;

      const exampleTitle = document.createElement("h3");
      exampleTitle.textContent = example.title;
      exampleEl.appendChild(exampleTitle);

      if (example.description) {
        const exampleDesc = document.createElement("p");
        exampleDesc.className = "tutorial-example-description";
        exampleDesc.textContent = example.description;
        exampleEl.appendChild(exampleDesc);
      }

      // Show end game message if present (for scenarios that don't render well)
      if (example.endGameMessage) {
        const endGameMsg = document.createElement("div");
        endGameMsg.className = "tutorial-endgame-message";
        endGameMsg.textContent = example.endGameMessage;
        exampleEl.appendChild(endGameMsg);
      }

      // Create game container
      const gameContainer = document.createElement("div");
      gameContainer.className = "tutorial-game-container";
      gameContainer.id = `tutorial-game-${section.id}-${index}`;
      exampleEl.appendChild(gameContainer);

      sectionEl.appendChild(exampleEl);

      // Initialize game after a brief delay to ensure DOM is ready
      setTimeout(() => {
        const game = new TutorialGame(
          `tutorial-game-${section.id}-${index}`,
          example.scenario,
          {
            allowedMoves: example.allowedMoves || [],
            autoPlay: example.autoPlay || false,
            autoPlaySteps: example.autoPlaySteps || [],
            autoPlayDelay: 2000,
            endGameMessage: example.endGameMessage || null,
          },
        );
      }, 100);
    });
  }

  contentArea.appendChild(sectionEl);
}

function parseMarkdown(text) {
  // Simple markdown parser for headers, bold, and paragraphs
  let html = text;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italics (both * and _)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Paragraphs (split by double newlines)
  html = html
    .split(/\n\n+/)
    .map((para) => {
      para = para.trim();
      if (!para) return "";
      if (para.startsWith("<")) return para; // Already HTML
      return `<p>${para.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  // Lists
  html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>");

  return html;
}

function initializeTutorial() {
  loadTutorialData().then((data) => {
    if (!data) return;

    // Generate table of contents
    generateTableOfContents(data.sections);

    // Render all sections
    data.sections.forEach((section) => {
      renderSection(section);
    });
  });
}

// Export for testing
window.getTutorialScenarios = function () {
  return tutorialData
    ? tutorialData.sections.flatMap((section) =>
        (section.examples || []).map((example) => ({
          sectionId: section.id,
          exampleId: example.id,
          scenario: example.scenario,
        })),
      )
    : [];
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTutorial);
} else {
  initializeTutorial();
}
