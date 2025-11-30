# Formal Ruleset: Working Specification v1.0

## 1. Components

### 1.1 Deck Construction

1. Start with a standard 52-card deck (no Jokers).
2. Divide the deck into:
   - **Face Deck**: Jacks (J), Queens (Q), Kings (K).
   - **Number Deck**: Aces (A) through Tens (10).
3. Shuffle each deck independently face-down.

---

## 2. Stack Structure

### 2.1 Stack Definition

Each **Stack** consists of:

- A single **Face Card** (the _Base_), visible.
- A **Left Pile** (positive modifiers).
- A **Right Pile** (negative modifiers).
- A **Center Match Slot** (for Match plays only).
- A **Stack Sum** (defined below).

### 2.2 Stack Capacity

The Face Card determines the maximum number of modifier cards allowed on each side:

| Face  | Left Capacity | Right Capacity |
| ----- | ------------- | -------------- |
| Jack  | 1             | 1              |
| Queen | 2             | 2              |
| King  | 3             | 3              |

Thus:

- **Jack** is a **1×2** configuration (1 left, 1 right).
- **Queen** is **2×2** configuration (2 left, 2 right).
- **King** is a **3×2** configuration (3 left, 3 right).

### 2.3 Visible Modifier

For each side (Left, Right), the **visible modifier** is the **topmost** card in that pile.

This determines whether Six-Seven is valid (see §6.4).

---

## 3. Stack Sum

### 3.1 Initial Sum

A Stack begins with a **Stack Sum = 0**.

### 3.2 Modifying the Sum

- Playing a card on the **Left** increases Sum by that card’s value.
- Playing a card on the **Right** decreases Sum by that card’s value.

### 3.3 Minimum Sum

At no time may the Stack Sum become negative.  
A move that would cause `Sum < 0` is illegal.

### 3.4 Match Slot

A Match play:

- Does **not** affect Sum.
- Is not part of Left or Right piles.
- Has no numeric effect; it is purely a placement to satisfy Collection criteria (§6.5).

---

## 4. Setup

### 4.1 Stacks in Play

- The number of initial Stacks equals the number of Players.
- Reveal that many Face Cards from the Face Deck and create empty Stacks.

### 4.2 Turn Order

- Youngest Player goes first.
- Play proceeds clockwise.

---

# 5. Turn Structure

On a Player’s Turn:

1. The Player flips the top card of the Number Deck.
2. The Player must attempt to **Play** the card (see §5.1).
3. If the card cannot be legally played to modify any existing Stack:
   - A new Stack is created if the Face Deck contains cards (see §7).
   - The Number Card is played onto that new Stack as its first modifier.
4. If no legal plays exist **and** no Face Cards remain, the Player:
   - Keeps the Number Card in hand (unplayed).
   - Play continues to the next Player.
   - When the turn returns to this same Player, the game ends (§8).

### 5.1 A Legal Play

A play is legal if:

- It fits within the Left/Right capacity limits **or** is a valid Match (if Stack is Full), **and**
- The resulting Sum would not be below 0.

If multiple legal plays exist, the Player may choose any.

---

# 6. Collection Conditions

A Stack may be Collected **immediately after** a Number Card is played on it **if any** of the following conditions are satisfied.

The Player must announce the associated phrase when collecting.

## 6.1 Six-Six

If the new Stack Sum is **6**, the Stack may be collected by announcing:

> **“Six Six.”**

## 6.2 Seven-Seven

If the new Stack Sum is **7**, the Stack may be collected by announcing:

> **“Seven Seven.”**

## 6.3 Zero

If:

- The Stack Sum is **0**, **and**
- At least one side (Left or Right) is at its **maximum capacity**,

then the Stack may be collected by announcing:

> **“Zero.”**

## 6.4 Six-Seven

Triggered when:

- The played card has value **7**, **and**
- The Stack’s **visible modifier** (the most recent card on Left or Right) has value **6**, **and**
- The play is otherwise legal (capacity and non-negative Sum).

This condition ignores the resulting Sum.

Announcement:

> **“Six Seven.”**

## 6.5 Match

A **Match** is a special play only available when:

1. The Stack is **Full** (Left and Right piles at maximum capacity), **and**
2. The played Number Card’s value equals the **current Stack Sum**, **and**
3. The Match Card cannot be placed on either Left or Right because the Stack is Full, but the Match Slot is always available, **and**
4. Playing it does **not** change the Sum.

When these are true, the Player may place the card into the **Match Slot** and collect the Stack, announcing:

> **“Match <Sum>.”**

Example:  
Stack Sum = 2; visible config `J: +5 / -3`; Match(2) card may be played to collect, without altering the Sum.

## 6.6 Multiple Conditions

If more than one collection condition is satisfied simultaneously, the Player may choose which condition to invoke.  
Collection removes the Stack and all cards in it.

---

# 7. Creating New Stacks

A new Stack is created when:

1. A Stack is collected and the Face Deck still contains cards, or
2. A Number Card has no legal play on any existing Stack and the Face Deck contains cards.

In both cases:

- Reveal the next Face Card as the new Stack’s Base.
- Immediately play the current Number Card onto this new Stack if it was created due to lack of legal plays.

Stacks are not capped at the number of Players.

---

# 8. Game End

The game ends under any of the following conditions:

1. **No Stacks Remaining**: If all Stacks have been collected and no Face Cards remain to create new Stacks, the game ends immediately (no need to wait for a draw).

2. **Number Deck Exhausted**: If the Number Deck runs out (no cards remain to draw), the game ends immediately.

3. **Stuck Player Returns**: A Player, on their turn, draws a Number Card but has **no legal play** on any Stack **and** no Face Cards remain.
   - That Player keeps the card unplayed.
   - Play continues.
   - **When the turn returns to that same Player, the game ends immediately.**

4. **No Possible Moves**: If all remaining Stacks are full (both sides at capacity) with sums greater than 10, and no Face Cards remain, no card from the Number Deck can be played (since the maximum card value is 10). The game ends immediately.

---

# 9. Scoring

At game end:

1. **Most Face Cards collected wins.**
2. Tie → **Most total cards collected** (Face + Number).
3. Tie → **Most Six-Seven collections**.
4. Tie → **Player who played most recently** in turn order wins.

---

# 10. Numerical Values

- Ace = 1
- Number Cards are worth their printed number (2–10).
- J/Q/K have no numeric value; they only determine Stack capacity.
