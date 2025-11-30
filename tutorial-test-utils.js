/**
 * Test utilities for tutorial scenarios
 * Can be used to extract and validate scenarios from tutorial-data.json
 */

/**
 * Load tutorial data and extract all scenarios
 * @returns {Promise<Array>} Array of scenario objects with metadata
 */
async function loadTutorialScenarios() {
  try {
    const response = await fetch("tutorial-data.json");
    const data = await response.json();

    const scenarios = [];
    data.sections.forEach((section) => {
      if (section.examples) {
        section.examples.forEach((example) => {
          scenarios.push({
            sectionId: section.id,
            sectionTitle: section.title,
            exampleId: example.id,
            exampleTitle: example.title,
            description: example.description,
            scenario: example.scenario,
            allowedMoves: example.allowedMoves || [],
            autoPlay: example.autoPlay || false,
            autoPlaySteps: example.autoPlaySteps || [],
          });
        });
      }
    });

    return scenarios;
  } catch (error) {
    console.error("Failed to load tutorial scenarios:", error);
    return [];
  }
}

/**
 * Validate a scenario structure
 * @param {Object} scenario - Scenario object to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateScenario(scenario) {
  const errors = [];

  // Check required fields
  if (!scenario.players || !Array.isArray(scenario.players)) {
    errors.push("Missing or invalid 'players' array");
  }

  if (!scenario.stacks || !Array.isArray(scenario.stacks)) {
    errors.push("Missing or invalid 'stacks' array");
  }

  // Validate stacks
  if (scenario.stacks) {
    scenario.stacks.forEach((stack, index) => {
      if (!stack.face || !stack.face.rank || !stack.face.suit) {
        errors.push(`Stack ${index}: Missing or invalid 'face' card`);
      }
      if (!Array.isArray(stack.left)) {
        errors.push(`Stack ${index}: Missing or invalid 'left' array`);
      }
      if (!Array.isArray(stack.right)) {
        errors.push(`Stack ${index}: Missing or invalid 'right' array`);
      }
    });
  }

  // Validate decks
  if (scenario.numberDeck && !Array.isArray(scenario.numberDeck)) {
    errors.push("Invalid 'numberDeck' array");
  }

  if (scenario.faceDeck && !Array.isArray(scenario.faceDeck)) {
    errors.push("Invalid 'faceDeck' array");
  }

  // Validate cards in arrays
  const validateCard = (card, context) => {
    if (!card || !card.rank || !card.suit) {
      errors.push(`${context}: Invalid card structure`);
    }
  };

  if (scenario.stacks) {
    scenario.stacks.forEach((stack, stackIndex) => {
      stack.left.forEach((card, cardIndex) => {
        validateCard(card, `Stack ${stackIndex}, left[${cardIndex}]`);
      });
      stack.right.forEach((card, cardIndex) => {
        validateCard(card, `Stack ${stackIndex}, right[${cardIndex}]`);
      });
      if (stack.matchSlot) {
        validateCard(stack.matchSlot, `Stack ${stackIndex}, matchSlot`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a game instance from a scenario for testing
 * @param {Object} scenario - Scenario object
 * @returns {SixSevenGame} Game instance
 */
function createGameFromScenario(scenario) {
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

/**
 * Test a scenario by creating a game and validating its state
 * @param {Object} scenarioData - Scenario data with scenario and metadata
 * @returns {Object} Test result
 */
function testScenario(scenarioData) {
  const result = {
    scenarioId: scenarioData.exampleId,
    sectionId: scenarioData.sectionId,
    passed: false,
    errors: [],
  };

  // Validate scenario structure
  const validation = validateScenario(scenarioData.scenario);
  if (!validation.isValid) {
    result.errors = validation.errors;
    return result;
  }

  try {
    // Create game from scenario
    const game = createGameFromScenario(scenarioData.scenario);
    const state = game.getState();

    // Basic state checks
    if (state.players.length !== scenarioData.scenario.players.length) {
      result.errors.push("Player count mismatch");
    }

    if (state.stacks.length !== scenarioData.scenario.stacks.length) {
      result.errors.push("Stack count mismatch");
    }

    // Check if drawn card matches
    if (scenarioData.scenario.drawnCard) {
      if (!state.drawnCard) {
        result.errors.push("Expected drawn card but none found");
      } else if (
        state.drawnCard.rank !== scenarioData.scenario.drawnCard.rank ||
        state.drawnCard.suit !== scenarioData.scenario.drawnCard.suit
      ) {
        result.errors.push("Drawn card mismatch");
      }
    }

    // Check legal plays if card is drawn
    if (state.drawnCard) {
      const legalPlays = game.getLegalPlaysForDrawnCard();
      if (scenarioData.allowedMoves && scenarioData.allowedMoves.length > 0) {
        // Verify that allowed moves are actually legal
        scenarioData.allowedMoves.forEach((allowedMove) => {
          const isLegal = legalPlays.some(
            (play) =>
              play.stackIndex === allowedMove.stackIndex &&
              play.side === allowedMove.side,
          );
          if (!isLegal) {
            result.errors.push(
              `Allowed move (stack ${allowedMove.stackIndex}, ${allowedMove.side}) is not legal`,
            );
          }
        });
      }
    }

    result.passed = result.errors.length === 0;
  } catch (error) {
    result.errors.push(`Error creating game: ${error.message}`);
  }

  return result;
}

/**
 * Run tests on all tutorial scenarios
 * @returns {Promise<Object>} Test results
 */
async function runTutorialTests() {
  const scenarios = await loadTutorialScenarios();
  const results = {
    total: scenarios.length,
    passed: 0,
    failed: 0,
    tests: [],
  };

  scenarios.forEach((scenarioData) => {
    const testResult = testScenario(scenarioData);
    results.tests.push(testResult);
    if (testResult.passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  });

  return results;
}

// Export for use in browser console or test runners
if (typeof window !== "undefined") {
  window.TutorialTestUtils = {
    loadTutorialScenarios,
    validateScenario,
    createGameFromScenario,
    testScenario,
    runTutorialTests,
  };
}

// For Node.js environments (if using a test framework)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadTutorialScenarios,
    validateScenario,
    createGameFromScenario,
    testScenario,
    runTutorialTests,
  };
}

