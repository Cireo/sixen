/**
 * Rendering utilities for Sixen Card Game
 * Pure functions for creating card elements and other visual components
 */

// Suit name mapping for SVG-cards
const SUIT_NAMES = {
  hearts: "heart",
  diamonds: "diamond",
  clubs: "club",
  spades: "spade",
};

// Player colors (neutral colors for 1-4 players)
const PLAYER_COLORS = [
  "#4A90E2", // Blue
  "#E24A4A", // Red
  "#4AE24A", // Green
  "#E2E24A", // Yellow
];

// Card size constants
const CARD_SIZES = {
  small: { width: "94", height: "131" },
  normal: { width: "125", height: "175" },
  large: { width: "150", height: "210" },
};

const SVG_VIEWBOX = "0 0 169.075 244.64";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

/**
 * Get card ID for SVG-cards library
 * @param {Object} card - Card object with rank and suit
 * @returns {string} Card ID for SVG reference
 */
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
 * Create SVG element with common attributes
 * @param {string} width - SVG width
 * @param {string} height - SVG height
 * @param {string} className - CSS class name
 * @returns {SVGElement} SVG element
 */
function createSVGElement(width, height, className) {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", SVG_VIEWBOX);
  svg.setAttribute("class", className);
  svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", SVG_NAMESPACE);
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    XLINK_NAMESPACE,
  );
  return svg;
}

/**
 * Create a playing card element using SVG-cards
 * @param {Object} card - Card object with rank and suit
 * @param {string} size - Card size: "small", "normal", or "large"
 * @returns {SVGElement} SVG element representing the card
 */
function createCardElement(card, size = "normal") {
  const { width, height } = CARD_SIZES[size] || CARD_SIZES.normal;
  const svg = createSVGElement(width, height, "card-svg");

  const use = document.createElementNS(SVG_NAMESPACE, "use");
  const cardId = getCardId(card);
  use.setAttributeNS(XLINK_NAMESPACE, "href", `src/assets/svg-cards.svg#${cardId}`);
  use.setAttribute("x", "0");
  use.setAttribute("y", "0");

  svg.appendChild(use);
  return svg;
}

/**
 * Create a card back element
 * @returns {SVGElement} SVG element representing a card back
 */
function createCardBackElement() {
  const svg = createSVGElement(
    CARD_SIZES.normal.width,
    CARD_SIZES.normal.height,
    "card-svg",
  );

  const use = document.createElementNS(SVG_NAMESPACE, "use");
  use.setAttributeNS(XLINK_NAMESPACE, "href", "src/assets/svg-cards.svg#back");
  use.setAttribute("x", "0");
  use.setAttribute("y", "0");
  use.setAttribute("fill", "#0062ff"); // Default blue back

  svg.appendChild(use);
  return svg;
}

/**
 * Create a visual deck stack with offset cards
 * @param {number} count - Number of cards in the deck
 * @returns {HTMLElement} Container element with stacked card backs
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

// Export for use in ui.js and tutorial
if (typeof window !== "undefined") {
  window.Rendering = {
    createCardElement,
    createCardBackElement,
    createDeckStack,
    getCardId,
    SUIT_NAMES,
    PLAYER_COLORS,
  };
}

