/**
 * Six-Seven Card Game - UI Controller
 */

let game = null;
let playerCount = 2;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const playerInputs = document.getElementById('player-inputs');
const addPlayerBtn = document.getElementById('add-player-btn');
const removePlayerBtn = document.getElementById('remove-player-btn');
const startGameBtn = document.getElementById('start-game-btn');
const menuBtn = document.getElementById('menu-btn');
const numberDeckWrapper = document.getElementById('number-deck-wrapper');
const drawnCardArea = document.getElementById('drawn-card-area');
const drawnCardDisplay = document.getElementById('drawn-card-display');
const stacksContainer = document.getElementById('stacks-container');
const playersList = document.getElementById('players-list');
const numberDeckCount = document.getElementById('number-deck-count');
const faceDeckCount = document.getElementById('face-deck-count');
const announcementOverlay = document.getElementById('announcement-overlay');
const announcementText = document.getElementById('announcement-text');
const gameoverOverlay = document.getElementById('gameover-overlay');
const winnerName = document.getElementById('winner-name');
const finalScores = document.getElementById('final-scores');
const playAgainBtn = document.getElementById('play-again-btn');

// State
let pendingCollection = null;
let previousStackCount = 0;
let shouldAnimateNewStack = false; // Track if we should animate a new stack
let autoPlayNewStacks = false; // Game option: auto-play on new stacks

// Player colors (neutral colors for 1-4 players)
const PLAYER_COLORS = [
    '#4A90E2', // Blue
    '#E24A4A', // Red
    '#4AE24A', // Green
    '#E2E24A'  // Yellow
];

// Suit name mapping for SVG-cards
const SUIT_NAMES = {
    'hearts': 'heart',
    'diamonds': 'diamond',
    'clubs': 'club',
    'spades': 'spade'
};

// Rank name mapping for SVG-cards
function getCardId(card) {
    const suitName = SUIT_NAMES[card.suit];
    let rankName;
    
    if (card.rank === 'J') {
        rankName = 'jack';
    } else if (card.rank === 'Q') {
        rankName = 'queen';
    } else if (card.rank === 'K') {
        rankName = 'king';
    } else if (card.rank === 'A') {
        rankName = '1';  // Ace is 1 in SVG-cards
    } else {
        rankName = card.rank;
    }
    
    return `${suitName}_${rankName}`;
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    addPlayerBtn.addEventListener('click', addPlayer);
    removePlayerBtn.addEventListener('click', removePlayer);
    startGameBtn.addEventListener('click', startGame);
    menuBtn.addEventListener('click', returnToMenu);
    playAgainBtn.addEventListener('click', returnToMenu);
    
    // Use event delegation for player decks (since they're dynamically created)
    document.addEventListener('click', (e) => {
        const playerDeck = e.target.closest('.player-deck.clickable-deck');
        if (playerDeck) {
            const state = game ? game.getState() : null;
            if (state && !state.drawnCard && state.numberDeckCount > 0) {
                const playerIndex = parseInt(playerDeck.getAttribute('data-player-index'));
                if (playerIndex === state.currentPlayerIndex) {
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
    
    const row = document.createElement('div');
    row.className = 'player-input-row';
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
    if (playerCount <= 2) return;
    
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
    removePlayerBtn.disabled = playerCount <= 2;
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
    
    // Get auto-play option
    const autoPlayCheckbox = document.getElementById('auto-play-new-stacks');
    autoPlayNewStacks = autoPlayCheckbox ? autoPlayCheckbox.checked : false;
    
    game = new SixSevenGame(names);
    pendingCollection = null;
    previousStackCount = 0;
    shouldAnimateNewStack = false;
    
    showScreen('game');
    renderGame();
}

/**
 * Return to menu
 */
function returnToMenu() {
    if (game && !game.getState().gameOver) {
        if (!confirm('Are you sure you want to leave the current game?')) {
            return;
        }
    }
    game = null;
    pendingCollection = null;
    previousStackCount = 0;
    shouldAnimateNewStack = false;
    // Hide gameover overlay if visible
    if (gameoverOverlay) {
        gameoverOverlay.classList.add('hidden');
        gameoverOverlay.classList.remove('fade-out');
    }
    showScreen('setup');
}

/**
 * Show a specific screen
 */
function showScreen(screen) {
    setupScreen.classList.toggle('hidden', screen !== 'setup');
    gameScreen.classList.toggle('hidden', screen !== 'game');
    gameoverScreen.classList.toggle('hidden', screen !== 'gameover');
}

/**
 * Create a playing card element using SVG-cards
 */
function createCardElement(card, size = 'normal') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size === 'small' ? '60' : '80');
    svg.setAttribute('height', size === 'small' ? '87' : '116');
    svg.setAttribute('viewBox', '0 0 169.075 244.64');
    svg.setAttribute('class', 'card-svg');
    svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    const cardId = getCardId(card);
    // Use xlink:href for compatibility
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `svg-cards.svg#${cardId}`);
    use.setAttribute('x', '0');
    use.setAttribute('y', '0');
    
    svg.appendChild(use);
    return svg;
}

/**
 * Create a card back element
 */
function createCardBackElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '80');
    svg.setAttribute('height', '116');
    svg.setAttribute('viewBox', '0 0 169.075 244.64');
    svg.setAttribute('class', 'card-svg');
    svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'svg-cards.svg#back');
    use.setAttribute('x', '0');
    use.setAttribute('y', '0');
    use.setAttribute('fill', '#0062ff');  // Default blue back
    
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
    
    // Check for game over - if stuck player's turn comes around, end immediately (don't wait for them to draw)
    if (state.stuckPlayer !== null && state.currentPlayerIndex === state.stuckPlayer) {
        // Turn returned to stuck player - game ends immediately
        game.gameOver = true;
        showGameOver();
        return;
    }
    
    // Check for game over
    if (state.gameOver) {
        showGameOver();
    }
}

/**
 * Render the face deck display
 */
function renderDecks(state) {
    const faceDeckEl = document.getElementById('face-deck-display');
    
    // Update face deck count
    if (faceDeckCount) {
        faceDeckCount.textContent = state.faceDeckCount;
    }
    
    // Face deck visual
    if (faceDeckEl) {
        faceDeckEl.innerHTML = '';
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
    const container = document.createElement('div');
    container.className = 'deck-stack';
    
    // Show up to 5 offset cards to indicate depth
    const cardsToShow = Math.min(count, 5);
    for (let i = 0; i < cardsToShow; i++) {
        const cardBack = createCardBackElement();
        cardBack.style.position = i === cardsToShow - 1 ? 'relative' : 'absolute';
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
    playersList.innerHTML = '';
    
    // Calculate scores for ranking
    const scored = state.players.map((player, index) => {
        const faceCards = player.collected.length;
        let totalCards = 0;
        player.collected.forEach(stack => {
            totalCards += 1 + stack.left.length + stack.right.length + (stack.matchSlot ? 1 : 0);
        });
        return {
            ...player,
            index,
            faceCards,
            totalCards
        };
    });
    
    // Sort by scoring rules (same as calculateScores)
    scored.sort((a, b) => {
        if (b.faceCards !== a.faceCards) return b.faceCards - a.faceCards;
        if (b.totalCards !== a.totalCards) return b.totalCards - a.totalCards;
        if (b.sixSevenCount !== a.sixSevenCount) return b.sixSevenCount - a.sixSevenCount;
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
        const entry = document.createElement('div');
        entry.className = 'player-entry';
        const playerColor = PLAYER_COLORS[index % PLAYER_COLORS.length];
        const isCurrentPlayer = index === state.currentPlayerIndex;
        const rank = ranks[index];
        
        if (isCurrentPlayer) {
            entry.classList.add('current-player');
            entry.style.borderColor = playerColor;
            entry.style.background = `${playerColor}20`;
        } else {
            entry.style.borderColor = 'transparent';
            entry.style.background = 'rgba(255, 255, 255, 0.05)';
        }
        
        const faceCards = player.collected.length;
        let totalCards = 0;
        player.collected.forEach(stack => {
            totalCards += 1 + stack.left.length + stack.right.length + (stack.matchSlot ? 1 : 0);
        });
        
        const nameStyle = isCurrentPlayer 
            ? `color: ${playerColor};` 
            : 'color: #f0f0f0;';
        
        // Trophy/ribbon emoji
        let trophy = '';
        if (rank === 1) trophy = '🥇';
        else if (rank === 2) trophy = '🥈';
        else if (rank === 3) trophy = '🥉';
        
        // Deck display for current player (reserve space for all)
        const deckHtml = `
            <div class="player-deck-wrapper ${isCurrentPlayer ? 'active' : ''}" data-player-index="${index}">
                <div class="deck-display-wrapper clickable-deck player-deck" data-player-index="${index}">
                    <div class="deck-counter">
                        <span class="deck-label">Deck</span>
                        <span class="deck-count">${state.numberDeckCount}</span>
                    </div>
                    <div class="deck-display player-deck-display" data-player-index="${index}">
                        <div class="drawn-card-overlay player-drawn-card" data-player-index="${index}">
                            <div class="drawn-card-display"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        entry.innerHTML = `
            <div class="player-header-row">
                <div class="player-name-section">
                    ${trophy ? `<span class="trophy">${trophy}</span>` : ''}
                    <div class="player-name" style="${nameStyle}">${player.name}</div>
                </div>
                ${deckHtml}
            </div>
            <div class="player-stats">
                <span class="stat-main"><span>Faces: </span><span>${faceCards}</span></span>
                <div class="stat-tiebreakers">
                    <span class="stat-tiebreaker"><span>Total: </span><span>${totalCards}</span></span>
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
    const currentPlayerColor = PLAYER_COLORS[state.currentPlayerIndex % PLAYER_COLORS.length];
    
    state.players.forEach((player, index) => {
        const isCurrentPlayer = index === state.currentPlayerIndex;
        const deckWrapper = document.querySelector(`.player-deck-wrapper[data-player-index="${index}"]`);
        const deckEl = document.querySelector(`.player-deck[data-player-index="${index}"]`);
        const deckDisplay = document.querySelector(`.player-deck-display[data-player-index="${index}"]`);
        const drawnCardOverlay = document.querySelector(`.player-drawn-card[data-player-index="${index}"]`);
        const deckCount = document.querySelector(`.player-deck[data-player-index="${index}"] .deck-count`);
        
        if (!deckWrapper || !deckEl || !deckDisplay) return;
        
        // Update deck count
        if (deckCount) {
            deckCount.textContent = state.numberDeckCount;
        }
        
        // Only show deck for current player
        if (isCurrentPlayer) {
            deckWrapper.classList.add('active');
            deckEl.style.background = `${currentPlayerColor}15`;
            
            // Update drawn card
            if (state.drawnCard) {
                deckEl.classList.remove('clickable-deck');
                if (drawnCardOverlay) {
                    drawnCardOverlay.classList.remove('hidden');
                    const display = drawnCardOverlay.querySelector('.drawn-card-display');
                    if (display) {
                        display.innerHTML = '';
                        display.appendChild(createCardElement(state.drawnCard));
                    }
                }
            } else {
                if (state.numberDeckCount > 0) {
                    deckEl.classList.add('clickable-deck');
                } else {
                    deckEl.classList.remove('clickable-deck');
                }
                if (drawnCardOverlay) {
                    drawnCardOverlay.classList.add('hidden');
                    const display = drawnCardOverlay.querySelector('.drawn-card-display');
                    if (display) {
                        display.innerHTML = '';
                    }
                }
            }
            
            // Update deck visual
            const existingStack = deckDisplay.querySelector('.deck-stack');
            if (existingStack) existingStack.remove();
            const existingEmpty = deckDisplay.querySelector('.empty-deck');
            if (existingEmpty) existingEmpty.remove();
            
            if (state.numberDeckCount > 0) {
                const cardStack = createDeckStack(state.numberDeckCount);
                deckDisplay.appendChild(cardStack);
            } else {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-deck';
                emptyDiv.textContent = 'Empty';
                deckDisplay.appendChild(emptyDiv);
            }
        } else {
            deckWrapper.classList.remove('active');
            deckEl.classList.remove('clickable-deck');
            deckEl.style.background = '';
            if (drawnCardOverlay) {
                drawnCardOverlay.classList.add('hidden');
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
    stacksContainer.innerHTML = '';
    
    const legalPlays = state.drawnCard ? game.getLegalPlaysForDrawnCard() : [];
    const currentStackCount = state.stacks.length;
    const wasAdding = currentStackCount > previousStackCount || shouldAnimateNewStack;
    
    state.stacks.forEach((stack, stackIndex) => {
        const stackEl = document.createElement('div');
        stackEl.className = 'stack';
        // Reset any animation styles
        stackEl.style.transform = '';
        stackEl.style.opacity = '';
        stackEl.style.zIndex = '';
        
        const sum = calculateStackSum(stack);
        const isFull = isStackFull(stack);
        
        // Check if this stack has any legal plays
        const stackPlays = legalPlays.filter(p => p.stackIndex === stackIndex);
        if (stackPlays.length > 0) {
            stackEl.classList.add('has-legal-play');
        }
        
        // Grey out full stacks with sum > 10 (can only play Matches, but can't match 6 or 7)
        if (isFull && sum > 10) {
            stackEl.classList.add('uncollectable');
        }
        
        // Face card
        const faceArea = document.createElement('div');
        faceArea.className = 'stack-face';
        faceArea.appendChild(createCardElement(stack.face));
        stackEl.appendChild(faceArea);
        
        // Modifier rows
        const modifiersArea = document.createElement('div');
        modifiersArea.className = 'stack-modifiers';
        
        const capacity = getStackCapacity(stack);
        
        // Calculate horizontal offsets based on capacity (reduced by ~20%)
        // J (capacity 1): [0]
        // Q (capacity 2): [-4, 4]
        // K (capacity 3): [-8, 0, 8]
        const getHorizontalOffset = (index, cap) => {
            if (cap === 1) return 0;
            if (cap === 2) return index === 0 ? -4 : 4;
            if (cap === 3) return index === 0 ? -8 : (index === 1 ? 0 : 8);
            return 0;
        };
        
        for (let i = 0; i < capacity; i++) {
            const row = document.createElement('div');
            row.className = 'modifier-row';
            
            // Left slot
            const leftSlot = document.createElement('div');
            leftSlot.className = 'card-slot left-slot';
            const isNextLeftSlot = i === stack.left.length;
            if (stack.left[i]) {
                leftSlot.classList.add('filled');
                const cardEl = createCardElement(stack.left[i]);
                // Add horizontal offset for overlapping cards - use actual position in filled array
                // i is the position in the filled array (since we check stack.left[i])
                const actualPosition = i;
                const offset = getHorizontalOffset(actualPosition, capacity);
                // Always apply transform for consistent positioning
                leftSlot.style.transform = `translateX(${offset}px)`;
                leftSlot.appendChild(cardEl);
                // Higher z-index for later cards (so they're on top)
                leftSlot.style.zIndex = 10 + actualPosition;
            } else if (isNextLeftSlot && stackPlays.some(p => p.side === 'left')) {
                // This is the next available left slot and it's a legal play
                leftSlot.classList.add('clickable');
                // Apply same offset as filled cards at this position
                const offset = getHorizontalOffset(i, capacity);
                leftSlot.style.transform = `translateX(${offset}px)`;
                // Clickable slots get highest z-index
                leftSlot.style.zIndex = 100;
                leftSlot.addEventListener('click', () => handlePlayCard(stackIndex, 'left'));
            }
            row.appendChild(leftSlot);
            
            // Right slot
            const rightSlot = document.createElement('div');
            rightSlot.className = 'card-slot right-slot';
            const isNextRightSlot = i === stack.right.length;
            if (stack.right[i]) {
                rightSlot.classList.add('filled');
                const cardEl = createCardElement(stack.right[i]);
                // Add horizontal offset for overlapping cards - use actual position in filled array
                // i is the position in the filled array (since we check stack.right[i])
                const actualPosition = i;
                const offset = getHorizontalOffset(actualPosition, capacity);
                // Always apply transform for consistent positioning
                rightSlot.style.transform = `translateX(${offset}px)`;
                rightSlot.appendChild(cardEl);
                // Higher z-index for later cards (so they're on top)
                rightSlot.style.zIndex = 10 + actualPosition;
            } else if (isNextRightSlot && stackPlays.some(p => p.side === 'right')) {
                // This is the next available right slot and it's a legal play
                rightSlot.classList.add('clickable');
                // Apply same offset as filled cards at this position
                const offset = getHorizontalOffset(i, capacity);
                rightSlot.style.transform = `translateX(${offset}px)`;
                // Clickable slots get highest z-index
                rightSlot.style.zIndex = 100;
                rightSlot.addEventListener('click', () => handlePlayCard(stackIndex, 'right'));
            }
            row.appendChild(rightSlot);
            
            modifiersArea.appendChild(row);
        }
        
        stackEl.appendChild(modifiersArea);
        
        // Match slot (only show if stack is full or has match play available)
        if (isStackFull(stack) || stackPlays.some(p => p.side === 'match')) {
            const matchRow = document.createElement('div');
            matchRow.className = 'modifier-row';
            matchRow.style.justifyContent = 'center';
            
            const matchSlot = document.createElement('div');
            matchSlot.className = 'card-slot match-slot';
            
            if (stack.matchSlot) {
                matchSlot.classList.add('filled');
                matchSlot.appendChild(createCardElement(stack.matchSlot));
            } else if (stackPlays.some(p => p.side === 'match')) {
                matchSlot.classList.add('clickable');
                // Clickable slots get highest z-index
                matchSlot.style.zIndex = 100;
                matchSlot.addEventListener('click', () => handlePlayCard(stackIndex, 'match'));
            }
            
            matchRow.appendChild(matchSlot);
            modifiersArea.appendChild(matchRow);
        }
        
        // Stack sum
        const sumDisplay = document.createElement('div');
        sumDisplay.className = 'stack-sum';
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
            const faceDeckEl = document.getElementById('face-deck-display');
            if (faceDeckEl) {
                stackEl.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
                stackEl.style.opacity = '0';
                
                // Calculate position from face deck to stack position
                requestAnimationFrame(() => {
                    const faceDeckRect = faceDeckEl.getBoundingClientRect();
                    const stackRect = stackEl.getBoundingClientRect();
                    const deltaX = (faceDeckRect.left + faceDeckRect.width / 2) - (stackRect.left + stackRect.width / 2);
                    const deltaY = (faceDeckRect.top + faceDeckRect.height / 2) - (stackRect.top + stackRect.height / 2);
                    
                    stackEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    
                    // Trigger animation after a brief delay
                    setTimeout(() => {
                        stackEl.style.transform = 'translate(0, 0)';
                        stackEl.style.opacity = '1';
                    }, 50);
                });
            }
        }
    });
    
    // Clean up animation styles after animation completes
    if (wasAdding) {
        setTimeout(() => {
            document.querySelectorAll('.stack').forEach(stackEl => {
                if (stackEl.style.transform === 'translate(0, 0)' || stackEl.style.transform === 'translate(0px, 0px)') {
                    stackEl.style.transition = '';
                    stackEl.style.transform = '';
                    stackEl.style.opacity = '';
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
    if (state.drawnCard || state.numberDeckCount === 0) return;
    
    const card = game.drawCard();
    if (!card) return;
    
    const legalPlays = game.getLegalPlaysForDrawnCard();
    
    if (legalPlays.length === 0) {
        // No legal plays available
        const result = game.handleNoLegalPlay();
        
        if (result.createNewStack) {
            // A new stack was created
            if (autoPlayNewStacks) {
                // Auto-play on the new stack (if option enabled)
                const newPlays = game.getLegalPlaysForDrawnCard();
                if (newPlays.length > 0) {
                    const play = newPlays.find(p => p.stackIndex === result.newStackIndex) || newPlays[0];
                    setTimeout(() => {
                        handlePlayCard(play.stackIndex, play.side);
                    }, 500);
                }
            } else {
                // Show message and wait for user to play
                showAnnouncement('No moves available. Starting new stack...', null, 1500);
                setTimeout(() => {
                    renderGame(); // Re-render to show the new stack
                }, 500);
            }
        } else if (result.gameOver) {
            // Game over
            renderGame();
        } else {
            // Player is stuck, show message and advance turn
            showAnnouncement('No legal plays! Card kept.', null, 1500);
            setTimeout(() => {
                game.nextTurn();
                renderGame();
            }, 1500);
        }
    }
    
    renderGame();
}

/**
 * Handle playing a card
 */
function handlePlayCard(stackIndex, side) {
    const result = game.executePlay(stackIndex, side);
    
    if (!result.success) {
        console.error('Play failed:', result.error);
        return;
    }
    
    // Clear drawn card immediately
    const drawnCardOverlay = document.getElementById('drawn-card-area');
    if (drawnCardOverlay) {
        drawnCardOverlay.classList.add('hidden');
        const display = drawnCardOverlay.querySelector('#drawn-card-display');
        if (display) {
            display.innerHTML = '';
        }
    }
    
    if (result.collectionConditions.length > 0) {
        // Player can collect - prioritize six-seven over other conditions
        let condition = result.collectionConditions.find(c => c.type === 'six-seven');
        if (!condition) {
            condition = result.collectionConditions[0]; // Use first condition if no six-seven
        }
        pendingCollection = { stackIndex, type: condition.type };
        
        // Show announcement immediately (before animation)
        showAnnouncement(condition.announcement, null, null);
        
        // Start animation after brief delay
        setTimeout(() => {
            animateStackCollection(stackIndex, () => {
                // Start fade-out immediately (fade-out happens during the final portion of display)
                announcementOverlay.classList.add('fade-out');
                setTimeout(() => {
                    announcementOverlay.classList.add('hidden');
                    announcementOverlay.classList.remove('fade-out');
                    const oldStackCount = game.getState().stacks.length;
                    game.collectStack(pendingCollection.stackIndex, pendingCollection.type);
                    const newStackCount = game.getState().stacks.length;
                    // If a new stack was created (one removed, one added), animate it
                    shouldAnimateNewStack = (newStackCount === oldStackCount);
                    pendingCollection = null;
                    game.nextTurn();
                    renderGame();
                }, 300); // Match fade-out animation duration
            });
        }, 200); // Brief delay before animation starts
    } else {
        // No collection, just advance turn
        game.nextTurn();
        renderGame();
    }
}

/**
 * Animate stack collection - shrink and translate to player name
 */
function animateStackCollection(stackIndex, callback) {
    const state = game.getState();
    const stackEl = document.querySelectorAll('.stack')[stackIndex];
    if (!stackEl) {
        callback();
        return;
    }
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    const playerEntry = Array.from(document.querySelectorAll('.player-entry'))
        .find(entry => entry.querySelector('.player-name').textContent === currentPlayer.name);
    
    if (!playerEntry) {
        callback();
        return;
    }
    
    // Get positions
    const stackRect = stackEl.getBoundingClientRect();
    const playerRect = playerEntry.getBoundingClientRect();
    
    // Calculate transform
    const deltaX = playerRect.left + playerRect.width / 2 - (stackRect.left + stackRect.width / 2);
    const deltaY = playerRect.top + playerRect.height / 2 - (stackRect.top + stackRect.height / 2);
    
    // Apply animation
    stackEl.style.transition = 'transform 0.6s ease-in-out, opacity 0.6s ease-in-out';
    stackEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.1)`;
    stackEl.style.opacity = '0';
    stackEl.style.zIndex = '1000';
    
    setTimeout(() => {
        callback();
    }, 600);
}

/**
 * Show announcement overlay
 */
function showAnnouncement(text, callback, autoDismissDelay = null) {
    announcementText.textContent = text;
    announcementOverlay.classList.remove('hidden');
    announcementOverlay.classList.remove('fade-out');
    
    // Auto-dismiss if delay is provided
    if (autoDismissDelay !== null) {
        const fadeOutDuration = 300; // Match fade-out animation duration
        // Start fade-out during the final portion of the display time
        const fadeOutStart = autoDismissDelay - fadeOutDuration;
        setTimeout(() => {
            if (!announcementOverlay.classList.contains('hidden')) {
                // Fade out instead of immediate hide
                announcementOverlay.classList.add('fade-out');
                setTimeout(() => {
                    announcementOverlay.classList.add('hidden');
                    announcementOverlay.classList.remove('fade-out');
                    if (callback) callback();
                }, fadeOutDuration);
            }
        }, Math.max(0, fadeOutStart)); // Ensure non-negative delay
    } else {
        // If no auto-dismiss, call callback immediately (for non-collection announcements)
        if (callback) callback();
    }
}

/**
 * Show game over overlay
 */
function showGameOver() {
    const scores = game.getFinalScores();
    const winner = scores[0];
    
    winnerName.textContent = `${winner.name} Wins!`;
    
    finalScores.innerHTML = '';
    scores.forEach((player, index) => {
        const entry = document.createElement('div');
        entry.className = 'score-entry';
        if (index === 0) entry.classList.add('winner');
        
        entry.innerHTML = `
            <span class="player-name">${player.name}</span>
            <div class="score-details">
                <span>Face: ${player.faceCards}</span>
                <span>Total: ${player.totalCards}</span>
                <span>6-7s: ${player.sixSevenCount}</span>
            </div>
        `;
        finalScores.appendChild(entry);
    });
    
    // Show as overlay with fade-in
    gameoverOverlay.classList.remove('hidden');
    gameoverOverlay.classList.remove('fade-out');
    // Trigger fade-in animation
    requestAnimationFrame(() => {
        gameoverOverlay.style.opacity = '0';
        gameoverOverlay.style.transition = 'opacity 0.5s ease';
        requestAnimationFrame(() => {
            gameoverOverlay.style.opacity = '1';
        });
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initEventListeners);

