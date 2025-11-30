# Six–Seven — Player Rules (Concise)

A fast, tactical card game where players play numbered cards onto face-card **Stacks** to create collectable sums. This concise ruleset gives everything you need to play; a short sketches section at the end lists additional example/illustration ideas for a later detailed version.

---

## Components

- Standard 52-card deck (no Jokers).
- Split into two face-down decks:
  - **Face Deck**: J, Q, K (only used to create Stacks).
  - **Number Deck**: A (1) through 10 (numeric values).

> **Important:** Face cards (J/Q/K) have **no numeric value**. They only determine the per-side capacity of a Stack.

---

## Setup

1. Shuffle Face Deck and Number Deck separately.
2. Reveal one Face card per player to form the initial Stacks (place face-up in the play area).
3. Youngest player goes first; play proceeds clockwise.

---

## Stack anatomy & capacity

Each **Stack** has:

- `face` — J, Q, or K (defines capacity).
- `plus` pile — cards played to the “left” (positive modifiers).
- `minus` pile — cards played to the “right” (negative modifiers).
- **Stack Sum** = sum(plus cards) − sum(minus cards).  
  (All numeric cards in each pile contribute; values are always visible logically.)

Capacities (per side):

- **Jack (J)**: 1 plus, 1 minus
- **Queen (Q)**: 2 plus, 2 minus
- **King (K)**: 3 plus, 3 minus

A Stack is **Full** when both plus and minus piles have reached their capacity.

---

## Turn rules

On your turn:

1. Flip the top Number card.
2. You **must** attempt to play it immediately. A play is one of:
   - `+X` — play X onto the plus side
   - `-X` — play X onto the minus side
   - `mX` — (Match play) only on a **Full** Stack where X equals the current Stack Sum; does **not** change the Sum
3. A play is **legal** if:
   - The chosen side has room (unless doing `mX`), and
   - After the play, **Stack Sum ≥ 0** (it may never go below zero).

If the card is NOT legal on any existing Stack:

- If the Face Deck still has cards → reveal the next Face card as a **new Stack**, and **you must play the Number card onto that new Stack**.
- If the Face Deck is empty → you keep the Number card (unplayed). Play continues; when the turn returns to **you**, the game ends.

---

## Collection (when you may collect a Stack)

After playing a Number card, you may immediately **Collect** that Stack (take the face + all numeric cards from it) if **any** of these are true:

### Basic collections

- **Six-Six:** Stack Sum becomes **6** → announce `Six Six`.
- **Seven-Seven:** Stack Sum becomes **7** → announce `Seven Seven`.

### Hybrid collection

- **Six-Seven:** You played a **7** on a Stack where the most recent visible card on that side is a **6**.
  - The resulting sum does _not_ matter; only that the play was legal.
  - Announce `Six Seven`.

### Zero collections

- **Zero:** Stack Sum is **0**, and **at least one side** (plus or minus) is at its capacity.
  - Announce `Zeeerroo` or `Zero`.

### Match collections

- **Match:** On a **Full** Stack, you may play `mX` where X equals the Stack Sum.
  - `mX` does **not** change the Sum.
  - Announce `Match <Sum>`.

### Notes on collection rules

- If multiple collection rules are valid, you may choose any one of them.
- Collecting removes the entire Stack.
- If the Face Deck still has cards, immediately flip a new Face card to replace it.

---

## End of game & scoring

The game ends when:

- A player draws a Number card that cannot legally be played on any Stack,
- The Face Deck is empty, **and**
- Play returns to that same player (they are still holding the unplayed card).

### Scoring

1. Most **Face** cards collected wins.
2. Tie → most **total cards** collected (Face + Number).
3. Tie → most **Six-Seven** collections.
4. Tie → whoever took a turn **most recently**.

---

## Quick examples (`sixseven` blocks)

```sixen
stacks:
  0: {face: K, plus: [2,6], minus: [5]}
steps:
  - {stack: 0, plus: 7, collect: "67"}
```

```sixen
stacks:
  0: {face: Q, plus: [3,5], minus: [4,2]}
steps:
  - {stack: 0, match: 2, collect: "match"}
```

## Notes:

- In the first example, placing +7 onto [2,6] triggers a Six-Seven because the visible top card is 6.
- In the second example, the Queen stack is Full; m2 matches the sum and collects without modifying it.

## Implementation / UI hints (brief)

- Represent each Stack as {face, plus:[], minus:[]}.
- Compute sum = sum(plus) - sum(minus) after each play.
- Enforce per-face capacity rules.
- Visual layouts may stack cards to show only the newest card fully, but logic always uses full lists.
- For digital versions, sixseven blocks can drive visuals or animations.

## Sketches for a later detailed version

- Full annotated examples of Six-Six, Seven-Seven, Six-Seven, Zero, and Match scenarios.
- Walkthrough of a multi-stack turn with branching legal moves.
- SVG diagrams for J/Q/K stack capacity.
- Overlays showing how Match plays sit between plus/minus piles.
- Edge cases: playable vs non-playable sums, below-zero rejections, early termination conditions.
- Recommended table layouts for 2, 3, 4, and 5 players.
