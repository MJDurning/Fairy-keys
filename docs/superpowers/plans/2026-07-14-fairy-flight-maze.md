# Fairy Flight: Fruit Feast Maze Adventure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework Fairy Flight from open-screen star collecting into a three-maze story: fly to the castle gate, gather five fruits, bring them to the cooking pot for a pretend feast.

**Architecture:** Mazes are hand-drawn arrays of strings (`#` hedge, `.` path, `S` start, `G` goal, `F` fruit) in a new data-only file `js/mazes.js`. A rewritten `js/fairy-flight.js` renders each maze as absolutely-positioned hedge divs scaled to the viewport, keeps the existing pixel-glide movement with per-axis grid collision, and drives stage progression (maze 1 → 2 → 3 → finale → play again). Shared `FK` helpers (audio, sparkles, HUD, speed) are reused unchanged.

**Tech Stack:** Vanilla HTML/CSS/JS (ES5 style, no build, no dependencies), matching the rest of the project. Python (via `py`) only for a stdlib maze-sanity checker.

**Spec:** `docs/superpowers/specs/2026-07-14-fairy-flight-maze-design.md`

## Global Constraints

- Branch: all work on `fairy-flight-maze` in `E:\Cluadecode\projects\fairy-keys`.
- ES5-style JS matching existing files: `var`, IIFE wrapper, no arrow functions, no classes, no modules.
- No external libraries, fonts, or images — emoji and CSS only.
- Do not modify `js/audio.js`, `js/sparkles.js`, `js/ui.js`, `js/menu.js`, or the other three games.
- Fruits are always exactly these five, in this order: 🍎 🍌 🍇 🍓 🍊.
- Goal emoji: maze 1 = 🏰, maze 3 = 🍲. Maze titles: "Head out to gather!", "Gather the fruit!", "Cook the feast!".
- Stars: only the finale awards stars — `FK.addStar()` once per fruit munched (5 per playthrough). No stars for pickups or maze completions.
- No failing states, timers, or enemies. Hedges block movement gently.
- All player-facing copy is kid-friendly.
- On this machine Python is launched with `py`, never `python`.
- There is no JS test framework in this project (and we're not adding one). Maze data is tested with the Python checker; behavior is verified in the browser preview after each task using the exact console snippets given below.

## Browser verification setup (used by Tasks 2–5)

The preview server config lives OUTSIDE the repo, at `E:\Cluadecode\.claude\launch.json` (the session root, not the project). Create it in Task 2 if it doesn't exist:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "fairy-keys",
      "runtimeExecutable": "py",
      "runtimeArgs": ["-m", "http.server", "8123", "--directory", "projects/fairy-keys"],
      "port": 8123
    }
  ]
}
```

Game page URL: `http://localhost:8123/fairy-flight.html`

Reusable console helper for simulating held arrow keys (paste into the browser console before behavior checks; corridors end in hedges, so holding a key "too long" is harmless — the fairy just stops at the wall):

```js
function press(key, ms) {
  dispatchEvent(new KeyboardEvent('keydown', { key: key }));
  return new Promise(function (res) {
    setTimeout(function () {
      dispatchEvent(new KeyboardEvent('keyup', { key: key }));
      setTimeout(res, 150);
    }, ms);
  });
}
async function walk(legs) {
  for (var i = 0; i < legs.length; i++) await press(legs[i][0], legs[i][1]);
}
```

Full walkthrough legs (each maze is a snake; generous times, walls absorb overshoot):

```js
// Maze 1 → castle gate:
await walk([['ArrowRight',8000],['ArrowDown',4000],['ArrowLeft',8000],['ArrowDown',4000],['ArrowRight',8000]]);
// Maze 2 → all 5 fruits (wait ~1.5s after maze loads before starting):
await walk([['ArrowRight',8000],['ArrowDown',4000],['ArrowLeft',8000],['ArrowDown',4000],['ArrowRight',8000],['ArrowDown',4000],['ArrowLeft',8000]]);
// Maze 3 → cooking pot:
await walk([['ArrowRight',8000],['ArrowDown',4000],['ArrowLeft',8000],['ArrowDown',4000],['ArrowRight',8000],['ArrowDown',4000],['ArrowLeft',5000]]);
```

---

### Task 1: Maze data and Python sanity checker

**Files:**
- Create: `tools/check_mazes.py`
- Create: `js/mazes.js`

**Interfaces:**
- Produces: `FK.MAZES` — array of 3 objects `{ title: string, goalEmoji: string|null, rows: string[] }`; `FK.FRUITS` — `['🍎','🍌','🍇','🍓','🍊']`. Task 2's engine consumes both.

- [ ] **Step 1: Write the checker (the failing test)**

Create `tools/check_mazes.py`:

```python
"""Sanity-check the maze layouts in js/mazes.js.

Run from the project root:  py tools/check_mazes.py

Checks every maze: rows all the same length, border fully hedged,
exactly one S, the right number of G and F cells for its stage,
and every path cell reachable from S.
"""
import re
import sys
from pathlib import Path

MAZE_FILE = Path(__file__).resolve().parent.parent / 'js' / 'mazes.js'


def load_mazes():
    if not MAZE_FILE.exists():
        print('FAIL: %s does not exist' % MAZE_FILE)
        return None
    text = MAZE_FILE.read_text(encoding='utf-8')
    blocks = re.findall(r"rows:\s*\[(.*?)\]", text, re.S)
    return [re.findall(r"'([#.SGF]+)'", block) for block in blocks]


def check(idx, rows):
    errors = []
    if not rows:
        return ['no rows found']
    width = len(rows[0])
    if any(len(r) != width for r in rows):
        return ['rows are not all the same length']
    cells = ''.join(rows)
    if cells.count('S') != 1:
        errors.append('needs exactly one S, found %d' % cells.count('S'))
    expected_g = 0 if idx == 1 else 1
    expected_f = 5 if idx == 1 else 0
    if cells.count('G') != expected_g:
        errors.append('expected %d G, found %d' % (expected_g, cells.count('G')))
    if cells.count('F') != expected_f:
        errors.append('expected %d F, found %d' % (expected_f, cells.count('F')))
    if rows[0].strip('#') or rows[-1].strip('#'):
        errors.append('top or bottom border is not solid hedge')
    if any(r[0] != '#' or r[-1] != '#' for r in rows):
        errors.append('left or right border is not solid hedge')
    if errors:
        return errors
    start = next((r, c) for r, row in enumerate(rows)
                 for c, ch in enumerate(row) if ch == 'S')
    seen = {start}
    queue = [start]
    while queue:
        r, c = queue.pop()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if (0 <= nr < len(rows) and 0 <= nc < width
                    and rows[nr][nc] != '#' and (nr, nc) not in seen):
                seen.add((nr, nc))
                queue.append((nr, nc))
    unreachable = [(r, c) for r, row in enumerate(rows)
                   for c, ch in enumerate(row)
                   if ch != '#' and (r, c) not in seen]
    if unreachable:
        errors.append('unreachable path cells: %s' % unreachable)
    return errors


def main():
    mazes = load_mazes()
    if mazes is None:
        return 1
    if len(mazes) != 3:
        print('FAIL: expected 3 mazes, found %d' % len(mazes))
        return 1
    ok = True
    for i, rows in enumerate(mazes):
        for e in check(i, rows):
            print('FAIL maze %d: %s' % (i + 1, e))
            ok = False
    if ok:
        print('All 3 mazes look good!')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
```

- [ ] **Step 2: Run it to verify it fails**

Run from `E:\Cluadecode\projects\fairy-keys`: `py tools/check_mazes.py`
Expected: `FAIL: ...js\mazes.js does not exist`, exit code 1.

- [ ] **Step 3: Write the maze data**

Create `js/mazes.js`:

```js
window.FK = window.FK || {};
// Maze legend: '#' hedge, '.' path, 'S' fairy start, 'G' goal, 'F' fruit.
// Rows must all be the same length and the border must be solid '#'.
// After editing, run:  py tools/check_mazes.py
FK.MAZES = [
  {
    title: 'Head out to gather!',
    goalEmoji: '🏰',
    rows: [
      '#############',
      '#S..........#',
      '###########.#',
      '#...........#',
      '#.###########',
      '#..........G#',
      '#############'
    ]
  },
  {
    title: 'Gather the fruit!',
    goalEmoji: null,
    rows: [
      '#############',
      '#S.....F....#',
      '##########..#',
      '#..F........#',
      '#..##########',
      '#......F....#',
      '##########..#',
      '#F........F.#',
      '#############'
    ]
  },
  {
    title: 'Cook the feast!',
    goalEmoji: '🍲',
    rows: [
      '#############',
      '#S..........#',
      '###########.#',
      '#...........#',
      '#.###########',
      '#...........#',
      '###########.#',
      '#.....G.....#',
      '#############'
    ]
  }
];
FK.FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊'];
```

- [ ] **Step 4: Run the checker to verify it passes**

Run: `py tools/check_mazes.py`
Expected: `All 3 mazes look good!`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add js/mazes.js tools/check_mazes.py
git commit -m "feat: three hand-drawn fairy-flight mazes with sanity checker"
```

---

### Task 2: Page scaffolding and maze renderer

**Files:**
- Modify: `fairy-flight.html`
- Modify: `css/style.css` (replace the `/* Fairy Flight */` section at the end)
- Rewrite: `js/fairy-flight.js`
- Create (outside repo, only if missing): `E:\Cluadecode\.claude\launch.json` (content in "Browser verification setup" above)

**Interfaces:**
- Consumes: `FK.MAZES`, `FK.FRUITS` (Task 1); `FK.setupGamePage`, `FK.speak` (existing `ui.js`/`audio.js`).
- Produces: module-level state `stage, mode, maze, cell, originX, originY, x, y, items, basket` and functions `parseMaze(def)`, `isHedge(row, col)`, `cellCenter(row, col)` → `{x, y}` (screen px), `layout()`, `render()`, `renderBasket()`, `showMessage(text, stay)`, `loadMaze(index)`. Tasks 3–4 add to this same IIFE.
- `items` entries are `{ row, col, emoji, el, kind }` where `kind` is `'G'` or `'F'`.

- [ ] **Step 1: Replace the game page HTML**

`fairy-flight.html` — full new content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fairy Flight</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="maze"></div>
  <div id="basket"></div>
  <div id="fairy">🧚</div>
  <script src="js/audio.js"></script>
  <script src="js/sparkles.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/mazes.js"></script>
  <script src="js/fairy-flight.js"></script>
</body>
</html>
```

- [ ] **Step 2: Replace the Fairy Flight CSS section**

In `css/style.css`, replace this existing block at the end of the file:

```css
/* Fairy Flight */
#fairy {
  position: fixed; z-index: 4; font-size: 4.5rem;
  transform: translate(-50%, -50%); pointer-events: none;
}
#star {
  position: fixed; z-index: 3; font-size: 3rem;
  transform: translate(-50%, -50%); pointer-events: none;
}
```

with:

```css
/* Fairy Flight */
#fairy {
  position: fixed; z-index: 4;
  transform: translate(-50%, -50%); pointer-events: none;
}
#maze { position: fixed; z-index: 2; }
.hedge {
  position: absolute;
  background: linear-gradient(145deg, #7ccd7c 0%, #4caf6d 60%, #3d9960 100%);
  border-radius: 22%;
  box-shadow: inset 0 -4px 8px rgba(30, 90, 50, 0.45),
              inset 0 3px 6px rgba(255, 255, 255, 0.35);
}
.maze-item {
  position: absolute; z-index: 3; display: flex;
  align-items: center; justify-content: center; pointer-events: none;
}
#basket {
  position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
  z-index: 20; display: none; gap: 10px; padding: 6px 16px;
  background: rgba(255, 255, 255, 0.75); border: 2px solid #fff;
  border-radius: 16px; font-size: 2rem;
}
#basket.show { display: flex; }
.basket-slot { opacity: 0.25; }
.basket-slot.full { opacity: 1; }
.maze-msg {
  position: fixed; left: 50%; top: 40%; transform: translate(-50%, -50%);
  z-index: 25; font-size: 3.2rem; font-weight: bold; color: #a5459b;
  text-shadow: 3px 3px 0 #fff; text-align: center; pointer-events: none;
  animation: msg-fade 2.6s forwards;
}
.maze-msg.stay { animation: none; }
@keyframes msg-fade {
  0% { opacity: 0; scale: 0.6; }
  15% { opacity: 1; scale: 1.05; }
  30% { scale: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
.feast-fruit {
  position: fixed; z-index: 6; transform: translate(-50%, -50%);
  pointer-events: none; animation: feast-bob 1s ease-in-out infinite alternate;
}
@keyframes feast-bob {
  from { margin-top: -6px; }
  to { margin-top: 6px; }
}
```

- [ ] **Step 3: Rewrite js/fairy-flight.js with the renderer**

Full new content of `js/fairy-flight.js`:

```js
(function () {
  FK.setupGamePage();

  var fairy = document.getElementById('fairy');
  var mazeEl = document.getElementById('maze');
  var basketEl = document.getElementById('basket');

  var TOP_PAD = 70;   // room for the HUD and basket
  var PAD = 12;       // breathing room around the maze

  var stage = 0;      // which maze: 0, 1, 2
  var mode = 'play';  // 'play' | 'wait' | 'finale' | 'again'
  var maze = null;    // parsed current maze
  var cell = 0;       // size of one grid square in px
  var originX = 0;    // top-left corner of the maze on screen
  var originY = 0;
  var x = 0;          // fairy position in screen px
  var y = 0;
  var items = [];     // uncollected fruit + goal on the board
  var basket = [];    // collected fruit emoji

  function parseMaze(def) {
    var grid = def.rows.map(function (row) { return row.split(''); });
    var m = {
      title: def.title, goalEmoji: def.goalEmoji, grid: grid,
      rowCount: grid.length, colCount: grid[0].length,
      fruitAt: {}, startRow: 1, startCol: 1
    };
    var fruitIndex = 0;
    for (var r = 0; r < m.rowCount; r++) {
      for (var c = 0; c < m.colCount; c++) {
        if (grid[r][c] === 'S') { m.startRow = r; m.startCol = c; }
        if (grid[r][c] === 'F') m.fruitAt[r + ',' + c] = FK.FRUITS[fruitIndex++];
      }
    }
    return m;
  }

  function isHedge(row, col) {
    if (row < 0 || col < 0 || row >= maze.rowCount || col >= maze.colCount) return true;
    return maze.grid[row][col] === '#';
  }

  function cellCenter(row, col) {
    return {
      x: originX + (col + 0.5) * cell,
      y: originY + (row + 0.5) * cell
    };
  }

  function layout() {
    cell = Math.floor(Math.min(
      (innerWidth - PAD * 2) / maze.colCount,
      (innerHeight - TOP_PAD - PAD) / maze.rowCount
    ));
    originX = Math.floor((innerWidth - cell * maze.colCount) / 2);
    originY = TOP_PAD + Math.floor((innerHeight - TOP_PAD - PAD - cell * maze.rowCount) / 2);
    mazeEl.style.left = originX + 'px';
    mazeEl.style.top = originY + 'px';
    mazeEl.style.width = cell * maze.colCount + 'px';
    mazeEl.style.height = cell * maze.rowCount + 'px';
    fairy.style.fontSize = cell * 0.72 + 'px';
  }

  function render() {
    mazeEl.innerHTML = '';
    items = [];
    for (var r = 0; r < maze.rowCount; r++) {
      for (var c = 0; c < maze.colCount; c++) {
        var ch = maze.grid[r][c];
        if (ch === '#') {
          var hedge = document.createElement('div');
          hedge.className = 'hedge';
          hedge.style.left = c * cell + 'px';
          hedge.style.top = r * cell + 'px';
          hedge.style.width = cell + 'px';
          hedge.style.height = cell + 'px';
          mazeEl.appendChild(hedge);
        } else if (ch === 'G' || ch === 'F') {
          var el = document.createElement('div');
          el.className = 'maze-item';
          el.textContent = ch === 'G' ? maze.goalEmoji : maze.fruitAt[r + ',' + c];
          el.style.left = c * cell + 'px';
          el.style.top = r * cell + 'px';
          el.style.width = cell + 'px';
          el.style.height = cell + 'px';
          el.style.fontSize = cell * 0.6 + 'px';
          mazeEl.appendChild(el);
          items.push({ row: r, col: c, emoji: el.textContent, el: el, kind: ch });
        }
      }
    }
  }

  function renderBasket() {
    basketEl.innerHTML = '';
    FK.FRUITS.forEach(function (f) {
      var slot = document.createElement('span');
      slot.className = 'basket-slot' + (basket.indexOf(f) >= 0 ? ' full' : '');
      slot.textContent = f;
      basketEl.appendChild(slot);
    });
  }

  function showMessage(text, stay) {
    var old = document.querySelector('.maze-msg');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'maze-msg' + (stay ? ' stay' : '');
    el.textContent = text;
    document.body.appendChild(el);
    if (!stay) setTimeout(function () { el.remove(); }, 2700);
  }

  function loadMaze(index) {
    stage = index;
    maze = parseMaze(FK.MAZES[index]);
    layout();
    render();
    var start = cellCenter(maze.startRow, maze.startCol);
    x = start.x;
    y = start.y;
    fairy.style.left = x + 'px';
    fairy.style.top = y + 'px';
    basketEl.classList.toggle('show', index > 0);
    showMessage(maze.title);
    FK.speak(maze.title);
    mode = 'play';
  }

  renderBasket();
  loadMaze(0);
})();
```

- [ ] **Step 4: Verify in the browser**

Start the `fairy-keys` preview server (create `E:\Cluadecode\.claude\launch.json` first if missing) and open `http://localhost:8123/fairy-flight.html`. Check:
- A green hedge maze is centered on screen; the 🧚 sits in the top-left corridor; 🏰 sits bottom-right.
- The title "Head out to gather!" appears and fades out.
- No basket row is visible (it only shows from maze 2 on).
- Console shows no errors.
- Quick render sanity in console: `document.querySelectorAll('.hedge').length` → a number > 50; `document.querySelectorAll('.maze-item').length` → `1`.

- [ ] **Step 5: Commit**

```bash
git add fairy-flight.html css/style.css js/fairy-flight.js
git commit -m "feat: render fairy-flight hedge maze with fairy at start"
```

---

### Task 3: Glide movement, wall collision, sparkles

**Files:**
- Modify: `js/fairy-flight.js`

**Interfaces:**
- Consumes: `maze, cell, originX, originY, x, y, mode, isHedge, cellCenter, layout, render` from Task 2; `FK.speed, FK.sparkleBurst, FK.randomColor, FK.chime` (existing).
- Produces: `blockedAt(px, py)` → boolean; `frame()` loop running via requestAnimationFrame; `held` key map; keydown/keyup/blur/resize listeners. Task 4 inserts `checkItems()` into `frame()` and extends the keydown handler.

- [ ] **Step 1: Add movement state and collision helper**

In `js/fairy-flight.js`, add after the `var basket = [];` line:

```js
  var held = {};      // which keys are held right now
  var trailTick = 0;
```

Add after the `showMessage` function:

```js
  // True if a fairy centered at (px, py) would poke into a hedge.
  function blockedAt(px, py) {
    var reach = cell * 0.3;
    var pts = [
      [px - reach, py - reach], [px + reach, py - reach],
      [px - reach, py + reach], [px + reach, py + reach]
    ];
    for (var i = 0; i < pts.length; i++) {
      var col = Math.floor((pts[i][0] - originX) / cell);
      var row = Math.floor((pts[i][1] - originY) / cell);
      if (isHedge(row, col)) return true;
    }
    return false;
  }
```

- [ ] **Step 2: Add the animation loop and input listeners**

Add after `blockedAt`:

```js
  function frame() {
    if (mode === 'play') {
      var step = Math.max(2, cell * 0.045) * FK.speed();
      var nx = x, ny = y;
      if (held.ArrowLeft) nx -= step;
      if (held.ArrowRight) nx += step;
      if (held.ArrowUp) ny -= step;
      if (held.ArrowDown) ny += step;
      if (nx !== x && !blockedAt(nx, y)) x = nx;
      if (ny !== y && !blockedAt(x, ny)) y = ny;
      fairy.style.left = x + 'px';
      fairy.style.top = y + 'px';

      var moving = held.ArrowLeft || held.ArrowRight || held.ArrowUp || held.ArrowDown;
      if (moving && ++trailTick % 6 === 0) {
        FK.sparkleBurst(x, y + cell * 0.25, FK.randomColor(), 3);
      }
    }
    requestAnimationFrame(frame);
  }

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'F11') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    held[e.key] = true;
    if (e.key === ' ' && !e.repeat && mode === 'play') {
      FK.chime();
      FK.sparkleBurst(x, y, FK.randomColor(), 25);
    }
  });
  addEventListener('keyup', function (e) {
    held[e.key] = false;
  });
  addEventListener('blur', function () { held = {}; });

  addEventListener('resize', function () {
    if (!maze) return;
    var row = Math.floor((y - originY) / cell);
    var col = Math.floor((x - originX) / cell);
    layout();
    render();
    var center = cellCenter(
      Math.max(0, Math.min(maze.rowCount - 1, row)),
      Math.max(0, Math.min(maze.colCount - 1, col))
    );
    x = center.x;
    y = center.y;
    fairy.style.left = x + 'px';
    fairy.style.top = y + 'px';
  });
```

- [ ] **Step 3: Start the loop**

Replace the init block at the bottom:

```js
  renderBasket();
  loadMaze(0);
```

with:

```js
  renderBasket();
  loadMaze(0);
  frame();
```

- [ ] **Step 4: Verify in the browser**

Reload `http://localhost:8123/fairy-flight.html`, paste the `press` helper from "Browser verification setup", then:
- `var fx = parseFloat(fairy.style.left); await press('ArrowRight', 1000); parseFloat(fairy.style.left) > fx` → `true` (glides right).
- `var fy = parseFloat(fairy.style.top); await press('ArrowUp', 1000); Math.abs(parseFloat(fairy.style.top) - fy) < 2` → `true` (border hedge above the start blocks her).
- Glide right then hold ArrowDown ~1s mid-corridor: she stops at the hedge below instead of passing through.
- Sparkle trail appears while moving; space bar makes a chime + burst.
- Resize the browser window: maze redraws to fit, fairy stays in her corridor.

(`fairy` works directly in the console because element ids are global properties.)

- [ ] **Step 5: Commit**

```bash
git add js/fairy-flight.js
git commit -m "feat: fairy glides through the maze with hedge collision"
```

---

### Task 4: Story flow — collection, transitions, feast finale, play again

**Files:**
- Modify: `js/fairy-flight.js`

**Interfaces:**
- Consumes: everything produced by Tasks 2–3; `FK.pop, FK.cheer, FK.fireworks, FK.addStar, FK.speak` (existing).
- Produces: `checkItems()`, `collect(item, index)`, `startFinale()`; `FRUIT_NAMES` map. Completes the game — no later code tasks.

- [ ] **Step 1: Add fruit names for the speech helper**

Add after the `var PAD = 12;` line:

```js
  var FRUIT_NAMES = {
    '🍎': 'Apple!', '🍌': 'Banana!', '🍇': 'Grapes!',
    '🍓': 'Strawberry!', '🍊': 'Orange!'
  };
```

- [ ] **Step 2: Add collection and stage progression**

Add after the `blockedAt` function:

```js
  function checkItems() {
    for (var i = 0; i < items.length; i++) {
      var center = cellCenter(items[i].row, items[i].col);
      var dx = center.x - x;
      var dy = center.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < cell * 0.55) {
        collect(items[i], i);
        return;
      }
    }
  }

  function collect(item, index) {
    if (item.kind === 'F') {
      items.splice(index, 1);
      item.el.remove();
      maze.grid[item.row][item.col] = '.';
      basket.push(item.emoji);
      renderBasket();
      FK.pop();
      FK.sparkleBurst(x, y, FK.randomColor(), 25);
      FK.speak(FRUIT_NAMES[item.emoji]);
      if (basket.length === FK.FRUITS.length) {
        mode = 'wait';
        FK.chime();
        setTimeout(function () { loadMaze(2); }, 800);
      }
    } else if (stage === 0) {
      mode = 'wait';
      FK.chime();
      FK.sparkleBurst(x, y, '#ffd166', 40);
      setTimeout(function () { loadMaze(1); }, 700);
    } else {
      startFinale();
    }
  }

  function startFinale() {
    mode = 'finale';
    FK.chime();
    var floats = [];
    basket.forEach(function (f, i) {
      var el = document.createElement('div');
      el.className = 'feast-fruit';
      el.textContent = f;
      var angle = (i / basket.length) * Math.PI * 2 - Math.PI / 2;
      el.style.left = x + Math.cos(angle) * cell * 1.4 + 'px';
      el.style.top = y + Math.sin(angle) * cell * 1.4 + 'px';
      el.style.fontSize = cell * 0.6 + 'px';
      document.body.appendChild(el);
      floats.push(el);
    });
    floats.forEach(function (el, i) {
      setTimeout(function () {
        var fx = parseFloat(el.style.left);
        var fy = parseFloat(el.style.top);
        el.remove();
        FK.pop();
        FK.sparkleBurst(fx, fy, FK.randomColor(), 20);
        FK.addStar();
      }, 900 + i * 700);
    });
    setTimeout(function () {
      FK.cheer();
      FK.fireworks();
      showMessage('Yummy! 😋');
      FK.speak('Yummy! What a delicious feast!');
    }, 900 + floats.length * 700 + 300);
    setTimeout(function () {
      showMessage('Play again? Press any key! ✨', true);
      mode = 'again';
    }, 900 + floats.length * 700 + 3200);
  }
```

- [ ] **Step 3: Call checkItems from the frame loop**

In `frame()`, add `checkItems();` directly after the sparkle-trail `if` block (still inside `if (mode === 'play')`):

```js
      if (moving && ++trailTick % 6 === 0) {
        FK.sparkleBurst(x, y + cell * 0.25, FK.randomColor(), 3);
      }
      checkItems();
```

- [ ] **Step 4: Add the play-again restart to the keydown handler**

Replace:

```js
    e.preventDefault();
    held[e.key] = true;
```

with:

```js
    e.preventDefault();
    if (mode === 'again' && !e.repeat) {
      var msg = document.querySelector('.maze-msg');
      if (msg) msg.remove();
      basket = [];
      renderBasket();
      loadMaze(0);
      return;
    }
    held[e.key] = true;
```

- [ ] **Step 5: Verify the whole story in the browser**

Reload the page, paste `press`/`walk` helpers, then run the three walkthroughs from "Browser verification setup" in order, waiting for each maze title to appear before starting the next. Check:
- Maze 1: reaching 🏰 chimes, then "Gather the fruit!" maze appears; basket row shows 5 dimmed fruits.
- Maze 2: each fruit pops with sparkles, speaks its name, and lights up in the basket; after the 5th, "Cook the feast!" maze loads.
- Maze 3: reaching 🍲 starts the finale — 5 fruits circle the fairy, vanish one by one with pops, then fireworks + "Yummy! 😋", then the "Play again? Press any key! ✨" message stays.
- `document.getElementById('star-count').textContent` → `'⭐ 5'` (stars only from the finale).
- Press any key: game restarts at "Head out to gather!" with an empty (hidden) basket; play through maze 1 again briefly to confirm movement still works. After a second full playthrough the counter would read `'⭐ 10'`.
- Console shows no errors throughout.

- [ ] **Step 6: Commit**

```bash
git add js/fairy-flight.js
git commit -m "feat: fruit gathering, maze progression, and feast finale"
```

---

### Task 5: Menu art, README, and final sweep

**Files:**
- Modify: `index.html:21`
- Modify: `README.md:12`

**Interfaces:**
- Consumes: the finished game (Tasks 1–4). Produces: nothing new — copy updates and final verification only.

- [ ] **Step 1: Update the menu button art**

In `index.html`, replace:

```html
      <span class="art">🧚⭐</span><span class="label">Fairy Flight</span>
```

with:

```html
      <span class="art">🧚🍎</span><span class="label">Fairy Flight</span>
```

- [ ] **Step 2: Update the README game description**

In `README.md`, replace:

```markdown
- **Fairy Flight** — steer the fairy with the arrow keys, wave the wand with space
```

with:

```markdown
- **Fairy Flight** — glide through hedge mazes, gather fruit, and cook a pretend feast
```

- [ ] **Step 3: Final verification sweep**

- Run `py tools/check_mazes.py` → `All 3 mazes look good!`
- Open `http://localhost:8123/index.html` → menu shows 🧚🍎 on the Fairy Flight button; clicking it opens the maze game.
- On the menu, drag the turtle→rabbit slider to turtle (1), open Fairy Flight, hold ArrowRight ~1s and note the distance; set the slider to rabbit (5) and repeat → the fairy visibly glides faster (speed slider still respected).
- Resize the window during maze 2 after collecting a fruit → maze redraws, the collected fruit does NOT reappear, basket unchanged.
- Escape returns to the menu; 🏠 button works; other three games still load with no console errors.

- [ ] **Step 4: Commit**

```bash
git add index.html README.md
git commit -m "docs: menu art and README copy for the fruit feast adventure"
```

---

## Self-review notes

- Spec coverage: three fixed easy mazes (T1), glide + hedge collision (T3), classic-5 fruits + basket (T1/T2/T4), 🏰/🍲 goals (T1/T2), munching finale with 5 stars + play again (T4), titles + speech (T2), hedge visuals (T2), resize handling (T3), README/menu polish (T5). Fruit-name speech on pickup is a small addition beyond the spec, consistent with the project's other games.
- Known minor: resizing mid-finale doesn't reposition the floating feast fruits — harmless, they vanish within seconds.
