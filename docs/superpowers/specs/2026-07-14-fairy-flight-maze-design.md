# Fairy Flight: The Fruit Feast Adventure — Design

**Date:** 2026-07-14
**Status:** Approved pending user review

## Summary

Rework the Fairy Flight mini-game from open-screen star collecting into a
three-maze story adventure: fly out of the castle, gather five pieces of
fruit, and bring them to the cooking pot for a pretend feast. Designed for
a very young player (around 3–5): no failing, no timers, no losing — hedges
gently stop the fairy and the only way forward is forward.

## The three mazes

All three mazes are **hand-designed and fixed** — the same every playthrough
so the player can learn and master them. All are **very easy**: wide
corridors (one corridor = one grid cell, generous cell size), only a few
turns, minimal dead ends.

1. **Maze 1 — "Head out to gather!"**
   The fairy 🧚 starts at one side and glides to the 🏰 castle gate.
   Reaching the gate triggers a sparkle burst and happy chime, then Maze 2
   loads.

2. **Maze 2 — "Gather the fruit!"**
   Five fruits — 🍎 🍌 🍇 🍓 🍊, always these five, one of each — sit on
   path cells around the maze. Touching a fruit pops it with sparkles and
   adds it to a **basket row** at the top of the screen showing what has
   been gathered. When the fifth fruit is collected, Maze 3 loads.

3. **Maze 3 — "Cook the feast!"**
   One last easy maze leading to the 🍲 cooking pot.

## The finale

On reaching the pot:

1. The five collected fruits appear floating around the fairy.
2. They vanish one at a time with munching pops and sparkle bursts.
3. A big ✨ celebration plays with the message **"Yummy! 😋"**.
4. Stars are added to the persistent star counter — **only finishing the
   whole adventure awards stars** (fruit pickups and maze completions do
   not). One star is added per fruit munched during the finale, 5 stars
   total per playthrough.
5. A friendly **"Play again?"** prompt appears; pressing any key restarts
   the adventure from Maze 1 with an empty basket.

## Controls and feel

- **Glide movement, same as today:** hold an arrow key and the fairy glides
  smoothly; hedge cells block movement (axis-independent collision so she
  can slide along walls without getting stuck).
- **Space bar** still fires a fun sparkle burst (unchanged).
- Escape/F11 and modifier keys pass through as in the other games; focus
  loss clears held keys.
- Each maze opens with a short friendly title overlay (e.g. "Gather the
  fruit!") so the goal is always clear.

## Visual style

- **Enchanted hedge maze:** soft green hedge-style wall tiles 🌿 on the
  existing starry background — a magical garden look.
- Fairy, fruits, gate, and pot are emoji, consistent with the rest of the
  project.
- Sparkle trail while moving is kept.

## Technical approach

**Grid-of-tiles maze** (chosen over canvas rendering to match the plain-DOM
style of the rest of the project):

- Each maze is defined as an array of strings in `js/fairy-flight.js` —
  e.g. `#` = hedge, `.` = path, `S` = start, `G` = goal, `F` = fruit spot —
  so mazes are human-readable and easy to tweak.
- On maze load, hedge cells are rendered as absolutely-positioned divs
  inside a maze container sized to the viewport; the grid scales to fit the
  window and re-renders on resize (fairy position remapped to her current
  cell).
- The fairy keeps pixel-based glide movement; each frame, the intended new
  position is checked against the grid (x and y axes independently) and
  blocked axes are cancelled.
- Collision with fruit/goal uses distance checks against cell centers, as
  the current game does with the star.

### Files changed

- `js/fairy-flight.js` — rewritten: maze definitions, renderer, movement
  and collision, stage progression, finale sequence.
- `fairy-flight.html` — add maze container and basket row elements.
- `css/style.css` — hedge tile, basket row, and title-overlay styles.
- No other games or shared files change behavior (`FK` helpers in
  `audio.js`, `sparkles.js`, `ui.js` are reused as-is).

## Out of scope

- Random maze generation, difficulty levels, timers, enemies, or scoring
  beyond the existing star counter.
- Changes to the other four games or the menu.
