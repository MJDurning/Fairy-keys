# Fairy Keys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser-based keyboard game arcade (four fairy-themed mini-games) for a 3–4 year old, published on GitHub Pages.

**Architecture:** Plain static site: one HTML page per game plus a picture-menu `index.html`. Shared behavior lives in three plain-script helpers (`js/audio.js`, `js/sparkles.js`, `js/ui.js`) that attach functions to a global `FK` namespace. No modules, no build step, so pages work both on GitHub Pages and when double-clicked from disk (`file://`).

**Tech Stack:** HTML, CSS, vanilla JavaScript. Web Speech API for spoken letters, Web Audio API for chimes, `<canvas>` for sparkle particles, `localStorage` for the speed setting. Local preview via `py -m http.server`.

**Spec:** `docs/superpowers/specs/2026-07-03-fairy-keys-design.md`

## Global Constraints

- Plain HTML/CSS/JavaScript only — no frameworks, no build step, no ES modules, no fetch (must work from `file://`).
- Every game is playable with single key presses only; ignore key events where `ctrlKey`, `metaKey`, or `altKey` is pressed (let adult shortcuts work).
- No negative feedback ever: wrong keys get a soft twinkle/`FK.pop()`, never a buzzer; nothing has a game-over.
- All movement speeds MUST be multiplied by `FK.speed()` (0.5–2.0, from the menu's turtle→rabbit slider, stored in `localStorage` key `fk-speed-level`, levels 1–5, default level 2 = 0.75).
- Art is emoji and CSS only — no image files, no downloaded assets. Sounds are browser-generated — no audio files.
- Esc key or the 🏠 HUD button returns to the menu; ⛶ button (bottom-right, every page) toggles fullscreen.
- No test framework exists on this machine (no Node.js). Adaptation of TDD: every task ends with explicit browser verification steps (exact checks + expected observations) using the preview server, then a commit. Do not claim a task done without running its verification steps.
- Testing note: synthetic key events from `preview_eval` have `isTrusted: false` but still fire listeners. Speech/audio may log autoplay warnings in a headless preview — warnings are acceptable; errors are not.
- Git identity is already configured. Commit at the end of every task. Branch is `main` after Task 3.

---

### Task 1: Picture menu with speed slider and fullscreen button

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/ui.js`
- Create: `js/menu.js`
- Create: `.claude/launch.json` (repo root is `E:\Cluadecode\fairy-keys`; launch.json lives in the session project root `E:\Cluadecode\.claude\launch.json` — see Step 1)

**Interfaces:**
- Produces (used by every later task):
  - `FK.speed()` → number, one of `[0.5, 0.75, 1, 1.5, 2]`
  - `FK.speedLevel()` → integer 1–5 (default 2); `FK.setSpeedLevel(level)`
  - `FK.addFullscreenButton()` → appends the ⛶ button to `document.body`
  - `FK.addStar(n?)` → increments the star counter (updates `#star-count` if present)
  - `FK.setupGamePage()` → adds HUD (🏠 back link + ⭐ counter), the ⛶ button, and the Esc-returns-to-menu key handler
  - CSS classes: `.game-btn`, `.wiggle`, `#hud`, `#fs-btn`, `canvas#fx` styling

- [ ] **Step 1: Create the preview server config**

Write `E:\Cluadecode\.claude\launch.json` (the session root, NOT inside fairy-keys):

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "fairy-keys",
      "runtimeExecutable": "py",
      "runtimeArgs": ["-m", "http.server", "8123", "--directory", "fairy-keys"],
      "port": 8123
    }
  ]
}
```

- [ ] **Step 2: Write `css/style.css`**

```css
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  font-family: "Comic Sans MS", "Segoe UI", sans-serif;
  background: linear-gradient(160deg, #ffd6ec 0%, #e3d9ff 45%, #cdeeff 100%);
  overflow: hidden;
  user-select: none;
}
h1 {
  text-align: center; font-size: 3rem; color: #a5459b;
  margin: 1.5rem 0 0.5rem; text-shadow: 2px 2px 0 #fff;
}

/* Menu */
.game-grid {
  display: grid; grid-template-columns: repeat(2, minmax(220px, 320px));
  gap: 24px; justify-content: center; padding: 16px;
}
.game-btn {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 28px 12px; border-radius: 24px;
  background: rgba(255, 255, 255, 0.75); border: 4px solid #fff;
  text-decoration: none; box-shadow: 0 6px 16px rgba(120, 80, 160, 0.25);
  transition: transform 0.15s;
}
.game-btn:hover { transform: scale(1.05); }
.game-btn .art { font-size: 3.5rem; }
.game-btn .label { font-size: 1.4rem; font-weight: bold; color: #7b4bab; }
[data-soon] { opacity: 0.55; }
.wiggle { animation: wiggle 0.4s; }
@keyframes wiggle {
  25% { transform: rotate(-4deg); }
  75% { transform: rotate(4deg); }
}

.speed-box {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; margin-top: 12px; font-size: 2rem;
}
#speed { width: min(360px, 60vw); accent-color: #a5459b; height: 12px; }

/* Shared chrome */
#fs-btn {
  position: fixed; right: 12px; bottom: 12px; z-index: 20;
  font-size: 1.6rem; padding: 6px 12px; border-radius: 12px;
  border: 2px solid #fff; background: rgba(255, 255, 255, 0.7); cursor: pointer;
}
#hud {
  position: fixed; left: 12px; top: 12px; z-index: 20;
  display: flex; align-items: center; gap: 16px; font-size: 2rem;
}
#hud a {
  text-decoration: none; background: rgba(255, 255, 255, 0.7);
  border-radius: 12px; padding: 4px 10px; border: 2px solid #fff;
}
#star-count { color: #7b4bab; font-weight: bold; text-shadow: 1px 1px 0 #fff; }

canvas#fx { position: fixed; inset: 0; z-index: 5; pointer-events: none; }
```

- [ ] **Step 3: Write `js/ui.js`**

```js
window.FK = window.FK || {};
(function () {
  var SPEEDS = [0.5, 0.75, 1, 1.5, 2];

  FK.speedLevel = function () {
    var level = parseInt(localStorage.getItem('fk-speed-level'), 10);
    return level >= 1 && level <= 5 ? level : 2;
  };
  FK.setSpeedLevel = function (level) {
    localStorage.setItem('fk-speed-level', String(level));
  };
  FK.speed = function () {
    return SPEEDS[FK.speedLevel() - 1];
  };

  FK.addFullscreenButton = function () {
    var btn = document.createElement('button');
    btn.id = 'fs-btn';
    btn.textContent = '⛶';
    btn.title = 'Full screen';
    btn.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    });
    document.body.appendChild(btn);
  };

  var stars = 0;
  FK.addStar = function (n) {
    stars += n || 1;
    var el = document.getElementById('star-count');
    if (el) el.textContent = '⭐ ' + stars;
  };

  FK.setupGamePage = function () {
    var hud = document.createElement('div');
    hud.id = 'hud';
    hud.innerHTML =
      '<a id="back-btn" href="index.html" title="Back to the menu">🏠</a>' +
      '<span id="star-count">⭐ 0</span>';
    document.body.appendChild(hud);
    FK.addFullscreenButton();
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape') location.href = 'index.html';
    });
  };
})();
```

- [ ] **Step 4: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fairy Keys</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="menu">
  <h1>🧚 Fairy Keys ✨</h1>
  <div class="game-grid">
    <a class="game-btn" href="magic-keys.html" data-soon>
      <span class="art">✨⌨️</span><span class="label">Magic Keys</span>
    </a>
    <a class="game-btn" href="find-the-letter.html" data-soon>
      <span class="art">🧚🔤</span><span class="label">Find the Letter</span>
    </a>
    <a class="game-btn" href="bubble-pop.html" data-soon>
      <span class="art">🫧💥</span><span class="label">Bubble Pop</span>
    </a>
    <a class="game-btn" href="fairy-flight.html" data-soon>
      <span class="art">🧚⭐</span><span class="label">Fairy Flight</span>
    </a>
  </div>
  <div class="speed-box">
    <span class="turtle">🐢</span>
    <input type="range" id="speed" min="1" max="5" step="1">
    <span class="rabbit">🐇</span>
  </div>
  <script src="js/ui.js"></script>
  <script src="js/menu.js"></script>
</body>
</html>
```

Note: ALL four buttons start with `data-soon` (grayed out; clicking just wiggles). Each game's task removes `data-soon` from its own button when the game exists.

- [ ] **Step 5: Write `js/menu.js`**

```js
(function () {
  var slider = document.getElementById('speed');
  slider.value = FK.speedLevel();
  slider.addEventListener('input', function () {
    FK.setSpeedLevel(slider.value);
  });

  FK.addFullscreenButton();

  document.querySelectorAll('[data-soon]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      btn.classList.remove('wiggle');
      void btn.offsetWidth; /* restart the animation */
      btn.classList.add('wiggle');
    });
  });
})();
```

- [ ] **Step 6: Verify in the browser**

Start the preview server (`preview_start` with name `fairy-keys`), open `http://localhost:8123/`, then check:

1. `preview_console_logs` (level `error`): expect none.
2. `preview_snapshot`: expect the title, four game buttons, and the slider.
3. Slider persistence: `preview_eval` →
   `(() => { document.getElementById('speed').value = 5; document.getElementById('speed').dispatchEvent(new Event('input')); return localStorage.getItem('fk-speed-level'); })()`
   Expected: `"5"`. Then `window.location.reload()`, then `preview_eval` → `document.getElementById('speed').value` Expected: `"5"`. Reset with `FK.setSpeedLevel(2)`.
4. `preview_eval` → `FK.speed()` after `FK.setSpeedLevel(2)` Expected: `0.75`.
5. `preview_inspect` on `#fs-btn`: expect it positioned fixed near bottom-right.
6. Click a `data-soon` button (`preview_click` on `.game-btn[href="bubble-pop.html"]`) then `preview_eval` → `document.querySelector('.game-btn[href="bubble-pop.html"]').classList.contains('wiggle')` Expected: `true` (and the page did NOT navigate).
7. `preview_screenshot` to confirm the pastel look.

- [ ] **Step 7: Commit**

```powershell
Set-Location E:\Cluadecode\fairy-keys
git add -A
git commit -m @'
feat: picture menu with speed slider and fullscreen button

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 2: Shared audio + sparkle helpers, and the Magic Keys game

**Files:**
- Create: `js/audio.js`
- Create: `js/sparkles.js`
- Create: `magic-keys.html`
- Create: `js/magic-keys.js`
- Modify: `css/style.css` (append `.big-letter` styles)
- Modify: `index.html` (remove `data-soon` from the Magic Keys button)

**Interfaces:**
- Consumes: `FK.setupGamePage()`, `FK.addStar(n)` from Task 1.
- Produces (used by Tasks 4–6):
  - `FK.speak(text)` → speaks via speechSynthesis (cancels any previous speech first; no-op if unsupported)
  - `FK.chime()` — happy two-note chime; `FK.pop()` — soft pop; `FK.cheer()` — rising 4-note fanfare
  - `FK.randomColor()` → hex string from the pastel palette
  - `FK.sparkleBurst(x, y, color, count)` — particle burst at page coordinates
  - `FK.fireworks()` — five random bursts across the screen

- [ ] **Step 1: Write `js/audio.js`**

```js
window.FK = window.FK || {};
(function () {
  var audioCtx = null;
  function ctx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  FK.speak = function (text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
  };

  function tone(freq, duration, type, volume) {
    var c = ctx();
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  }

  FK.chime = function () { tone(880, 0.3); tone(1320, 0.45); };
  FK.pop = function () { tone(300, 0.12, 'triangle', 0.2); };
  FK.cheer = function () {
    [523, 659, 784, 1047].forEach(function (f, i) {
      setTimeout(function () { tone(f, 0.25); }, i * 90);
    });
  };
})();
```

- [ ] **Step 2: Write `js/sparkles.js`**

```js
window.FK = window.FK || {};
(function () {
  var canvas = document.createElement('canvas');
  canvas.id = 'fx';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var particles = [];

  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener('resize', resize);
  resize();

  var COLORS = ['#ff8fd8', '#ffd166', '#8be9fd', '#b39dff', '#7bed9f', '#ff9ff3'];
  FK.randomColor = function () {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  FK.sparkleBurst = function (x, y, color, count) {
    for (var i = 0; i < (count || 30); i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 4;
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 60 + Math.random() * 30,
        color: color,
        size: 2 + Math.random() * 4
      });
    }
  };

  FK.fireworks = function () {
    for (var i = 0; i < 5; i++) {
      setTimeout(function () {
        FK.sparkleBurst(
          Math.random() * canvas.width,
          Math.random() * canvas.height * 0.7,
          FK.randomColor(),
          50
        );
      }, i * 150);
    }
  };

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(function (p) { return p.life > 0; });
    particles.forEach(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= 1;
      ctx.globalAlpha = Math.min(1, p.life / 40);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  frame();
})();
```

- [ ] **Step 3: Write `magic-keys.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Magic Keys</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <script src="js/audio.js"></script>
  <script src="js/sparkles.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/magic-keys.js"></script>
</body>
</html>
```

- [ ] **Step 4: Write `js/magic-keys.js`**

```js
(function () {
  FK.setupGamePage();

  function showBigLetter(text, color, x, y) {
    var el = document.createElement('div');
    el.className = 'big-letter';
    el.textContent = text;
    el.style.color = color;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1200);
  }

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'F11' || e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    var x = 100 + Math.random() * (innerWidth - 200);
    var y = 120 + Math.random() * (innerHeight - 240);
    var color = FK.randomColor();
    FK.sparkleBurst(x, y, color, 40);
    if (/^[a-z0-9]$/i.test(e.key)) {
      FK.speak(e.key.toUpperCase());
      showBigLetter(e.key.toUpperCase(), color, x, y);
    } else {
      FK.chime();
    }
    FK.addStar();
  });
})();
```

- [ ] **Step 5: Append to `css/style.css`**

```css
/* Magic Keys */
.big-letter {
  position: fixed; z-index: 6; font-size: 9rem; font-weight: bold;
  transform: translate(-50%, -50%); text-shadow: 3px 3px 0 #fff;
  pointer-events: none; animation: pop-fade 1.2s forwards;
}
@keyframes pop-fade {
  0% { scale: 0.2; opacity: 0; }
  20% { scale: 1.15; opacity: 1; }
  40% { scale: 1; }
  100% { scale: 1.1; opacity: 0; }
}
```

- [ ] **Step 6: Enable the menu button**

In `index.html`, remove ` data-soon` from the Magic Keys `<a>` only.

- [ ] **Step 7: Verify in the browser**

Open `http://localhost:8123/magic-keys.html` (reload if the server is already running):

1. `preview_console_logs` (level `error`): none.
2. `preview_snapshot`: HUD present (🏠 link, `⭐ 0`), ⛶ button present.
3. Letter key: `preview_eval` → `(() => { dispatchEvent(new KeyboardEvent('keydown', { key: 'b' })); return { letter: document.querySelector('.big-letter') && document.querySelector('.big-letter').textContent, stars: document.getElementById('star-count').textContent }; })()`
   Expected: `{"letter": "B", "stars": "⭐ 1"}`.
4. Non-letter key: dispatch `{ key: 'Enter' }` the same way; expect NO new `.big-letter` after the first fades, star count `⭐ 2`, no errors.
5. Menu navigation: open `http://localhost:8123/`, `preview_snapshot` — Magic Keys button no longer dimmed; `preview_click` it; expect the Magic Keys page loads.
6. Esc: `preview_eval` → `dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))` from the game page; expect location back at `index.html`.
7. `preview_screenshot` while sparkles are live (dispatch 3–4 keys first).

- [ ] **Step 8: Commit**

```powershell
Set-Location E:\Cluadecode\fairy-keys
git add -A
git commit -m @'
feat: Magic Keys game with sparkles, speech, and chimes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 3: Publish to GitHub Pages

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: the committed site from Tasks 1–2.
- Produces: live site at `https://mjdurning.github.io/fairy-keys/` (later tasks push updates to it with plain `git push`).

Note: there is no GitHub CLI on this machine, so the repository is created on github.com in the browser — the same way focus-ladder was. The user does the two web steps; everything else is terminal.

- [ ] **Step 1: Write `README.md`**

```markdown
# Fairy Keys 🧚✨

A keyboard game arcade for little hands — four fairy-themed mini-games that
teach letters and the keys real games use. Made by a grandpa for his
granddaughter.

**Play it:** https://mjdurning.github.io/fairy-keys/

- **Magic Keys** — press any key for sparkles; letters are spoken out loud
- **Find the Letter** — find the letter the fairy asks for
- **Bubble Pop** — pop letter bubbles as they float up
- **Fairy Flight** — steer the fairy with the arrow keys, wave the wand with space

The turtle→rabbit slider on the menu slows everything down or speeds it up.
No accounts, no ads, no tracking — just sparkles.
```

- [ ] **Step 2: Rename the branch to `main`**

```powershell
Set-Location E:\Cluadecode\fairy-keys
git branch -m master main
```

Run `git branch` — expected output: `* main`.

- [ ] **Step 3: Commit the README**

```powershell
git add README.md
git commit -m @'
docs: add README

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

- [ ] **Step 4 (USER): Create the empty repository on GitHub**

Ask the user to: go to https://github.com/new, set the name to `fairy-keys`, leave it Public, do NOT check any "initialize" boxes (no README, no .gitignore, no license), and click "Create repository". Wait for confirmation.

- [ ] **Step 5: Connect and push**

```powershell
git remote add origin https://github.com/MJDurning/fairy-keys.git
git push -u origin main
```

Expected: push succeeds using the saved GitHub login (same as focus-ladder).

- [ ] **Step 6 (USER): Turn on GitHub Pages**

Ask the user to: open https://github.com/MJDurning/fairy-keys/settings/pages, under "Build and deployment" set Source to "Deploy from a branch", pick branch `main` and folder `/ (root)`, click Save. Wait for confirmation.

- [ ] **Step 7: Verify the live site**

Wait 2–3 minutes, then fetch `https://mjdurning.github.io/fairy-keys/` (WebFetch or browser). Expected: the Fairy Keys menu page loads. If it 404s, wait another minute and retry — first Pages deploys are slow.

---

### Task 4: Find the Letter

**Files:**
- Create: `find-the-letter.html`
- Create: `js/find-the-letter.js`
- Modify: `css/style.css` (append stage/keyboard-hint styles)
- Modify: `index.html` (remove `data-soon` from the Find the Letter button)

**Interfaces:**
- Consumes: `FK.setupGamePage()`, `FK.addStar(n)`, `FK.speak(text)`, `FK.cheer()`, `FK.pop()`, `FK.fireworks()`, `FK.sparkleBurst(x, y, color, count)`, `FK.randomColor()`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `find-the-letter.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Find the Letter</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="stage">
    <div class="fairy-icon">🧚</div>
    <div id="target"></div>
    <div id="keyboard-hint"></div>
  </div>
  <script src="js/audio.js"></script>
  <script src="js/sparkles.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/find-the-letter.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `js/find-the-letter.js`**

```js
(function () {
  FK.setupGamePage();

  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var PRAISE = ['Great job!', 'You found it!', 'Amazing!', 'Wonderful!', 'You did it!'];
  var ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  var target = null;
  var misses = 0;
  var locked = false;

  var targetEl = document.getElementById('target');
  var hintEl = document.getElementById('keyboard-hint');

  ROWS.forEach(function (row) {
    var rowEl = document.createElement('div');
    rowEl.className = 'kb-row';
    row.split('').forEach(function (letter) {
      var key = document.createElement('span');
      key.className = 'kb-key';
      key.dataset.letter = letter;
      key.textContent = letter;
      rowEl.appendChild(key);
    });
    hintEl.appendChild(rowEl);
  });

  function newLetter() {
    var next;
    do {
      next = LETTERS[Math.floor(Math.random() * 26)];
    } while (next === target);
    target = next;
    misses = 0;
    locked = false;
    targetEl.textContent = target;
    targetEl.style.color = FK.randomColor();
    hintEl.classList.remove('show');
    document.querySelectorAll('.kb-key.wiggle-key').forEach(function (k) {
      k.classList.remove('wiggle-key');
    });
    FK.speak('Can you find ' + target + '?');
  }

  targetEl.addEventListener('click', function () {
    FK.speak('Can you find ' + target + '?');
  });

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'F11' || e.repeat || locked) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[a-z]$/i.test(e.key)) return;
    e.preventDefault();
    if (e.key.toUpperCase() === target) {
      locked = true;
      FK.fireworks();
      FK.cheer();
      FK.speak(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      FK.addStar(5);
      setTimeout(newLetter, 2200);
    } else {
      misses += 1;
      FK.sparkleBurst(
        Math.random() * innerWidth,
        Math.random() * innerHeight,
        FK.randomColor(),
        10
      );
      FK.pop();
      if (misses >= 3) {
        hintEl.classList.add('show');
        var key = document.querySelector('.kb-key[data-letter="' + target + '"]');
        if (key) key.classList.add('wiggle-key');
      }
    }
  });

  newLetter();
})();
```

Known browser quirk (accepted in spec): the very first `FK.speak` on page load may be silenced by the autoplay policy until the first real key press. Sighted prompt (the big letter) always shows.

- [ ] **Step 3: Append to `css/style.css`**

```css
/* Find the Letter */
#stage {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 100%; gap: 8px;
}
.fairy-icon { font-size: 5rem; }
#target {
  font-size: 14rem; font-weight: bold; line-height: 1;
  text-shadow: 4px 4px 0 #fff; cursor: pointer;
}
#keyboard-hint {
  display: none; flex-direction: column; align-items: center;
  gap: 6px; margin-top: 10px;
}
#keyboard-hint.show { display: flex; }
.kb-row { display: flex; gap: 6px; }
.kb-key {
  width: 44px; height: 44px; display: flex; align-items: center;
  justify-content: center; background: rgba(255, 255, 255, 0.8);
  border: 2px solid #d8b6ff; border-radius: 8px;
  font-weight: bold; font-size: 1.2rem; color: #7b4bab;
}
.kb-key.wiggle-key { animation: key-wiggle 0.5s infinite; background: #ffd166; }
@keyframes key-wiggle {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-8deg) scale(1.15); }
  75% { transform: rotate(8deg) scale(1.15); }
}
```

- [ ] **Step 4: Enable the menu button**

In `index.html`, remove ` data-soon` from the Find the Letter `<a>`.

- [ ] **Step 5: Verify in the browser**

Open `http://localhost:8123/find-the-letter.html`:

1. `preview_console_logs` (level `error`): none (autoplay warnings OK).
2. `preview_snapshot`: fairy, a big letter, HUD, no visible keyboard hint.
3. Correct key: `preview_eval` → `(() => { const t = document.getElementById('target').textContent; dispatchEvent(new KeyboardEvent('keydown', { key: t.toLowerCase() })); return document.getElementById('star-count').textContent; })()`
   Expected: `"⭐ 5"`.
4. New letter appears: after ~2.5s, `preview_eval` → `document.getElementById('target').textContent` differs from the previous letter.
5. Hint after 3 misses: `preview_eval` → `(() => { const t = document.getElementById('target').textContent; const wrong = t === 'X' ? 'y' : 'x'; for (let i = 0; i < 3; i++) dispatchEvent(new KeyboardEvent('keydown', { key: wrong })); return { shown: document.getElementById('keyboard-hint').classList.contains('show'), wiggling: !!document.querySelector('.kb-key.wiggle-key') }; })()`
   Expected: `{"shown": true, "wiggling": true}`.
6. `preview_screenshot` with the hint visible.

- [ ] **Step 6: Commit and push**

```powershell
Set-Location E:\Cluadecode\fairy-keys
git add -A
git commit -m @'
feat: Find the Letter game with keyboard hint

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
git push
```

---

### Task 5: Bubble Pop

**Files:**
- Create: `bubble-pop.html`
- Create: `js/bubble-pop.js`
- Modify: `css/style.css` (append `.bubble` styles)
- Modify: `index.html` (remove `data-soon` from the Bubble Pop button)

**Interfaces:**
- Consumes: `FK.setupGamePage()`, `FK.addStar()`, `FK.speak()`, `FK.pop()`, `FK.sparkleBurst()`, `FK.randomColor()`, `FK.speed()`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `bubble-pop.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bubble Pop</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <script src="js/audio.js"></script>
  <script src="js/sparkles.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/bubble-pop.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `js/bubble-pop.js`**

```js
(function () {
  FK.setupGamePage();

  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var MAX_BUBBLES = 3;
  var bubbles = [];

  function spawnBubble() {
    if (bubbles.length >= MAX_BUBBLES) return;
    var active = bubbles.map(function (b) { return b.letter; });
    var letter;
    do {
      letter = LETTERS[Math.floor(Math.random() * 26)];
    } while (active.indexOf(letter) !== -1);
    var el = document.createElement('div');
    el.className = 'bubble';
    el.textContent = letter;
    el.style.left = 60 + Math.random() * (innerWidth - 160) + 'px';
    document.body.appendChild(el);
    bubbles.push({ letter: letter, el: el, y: innerHeight + 60 });
  }

  function frame() {
    var rise = 0.8 * FK.speed();
    bubbles.forEach(function (b) {
      b.y -= rise;
      b.el.style.top = b.y + 'px';
    });
    bubbles = bubbles.filter(function (b) {
      if (b.y < -120) { b.el.remove(); return false; }
      return true;
    });
    requestAnimationFrame(frame);
  }

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'F11' || e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[a-z]$/i.test(e.key)) return;
    e.preventDefault();
    var letter = e.key.toUpperCase();
    var hit = null;
    bubbles.forEach(function (b) { if (b.letter === letter) hit = b; });
    if (hit) {
      var rect = hit.el.getBoundingClientRect();
      FK.sparkleBurst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        FK.randomColor(),
        35
      );
      FK.pop();
      FK.speak(hit.letter);
      FK.addStar();
      hit.el.remove();
      bubbles = bubbles.filter(function (b) { return b !== hit; });
    }
  });

  setInterval(spawnBubble, 2500);
  spawnBubble();
  frame();
})();
```

- [ ] **Step 3: Append to `css/style.css`**

```css
/* Bubble Pop */
.bubble {
  position: fixed; z-index: 4; width: 110px; height: 110px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 3.5rem; font-weight: bold; color: #7b4bab;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95), rgba(173, 216, 255, 0.55));
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: inset -8px -8px 16px rgba(120, 80, 160, 0.15);
}
```

- [ ] **Step 4: Enable the menu button**

In `index.html`, remove ` data-soon` from the Bubble Pop `<a>`.

- [ ] **Step 5: Verify in the browser**

Open `http://localhost:8123/bubble-pop.html`:

1. `preview_console_logs` (level `error`): none.
2. Bubble exists and rises: `preview_eval` → `document.querySelector('.bubble') && document.querySelector('.bubble').style.top` — note the value, wait ~2s, read again. Expected: the number DECREASED (bubble moving up).
3. Speed slider is respected: `preview_eval` → `(() => { const t1 = parseFloat(document.querySelector('.bubble').style.top); FK.setSpeedLevel(5); return t1; })()`, wait ~2s, compare drop rate — with level 5 the per-second drop should be roughly 2.7× the level-2 rate (2.0 / 0.75). Rough check is fine (clearly faster). Reset with `FK.setSpeedLevel(2)`.
4. Pop by key: `preview_eval` → `(() => { const b = document.querySelector('.bubble'); dispatchEvent(new KeyboardEvent('keydown', { key: b.textContent.toLowerCase() })); return { gone: !document.body.contains(b), stars: document.getElementById('star-count').textContent }; })()`
   Expected: `{"gone": true, "stars": "⭐ 1"}`.
5. Wrong key does nothing bad: dispatch a key matching no bubble; expect bubble count unchanged, no errors.
6. `preview_screenshot` with 2–3 bubbles on screen.

- [ ] **Step 6: Commit and push**

```powershell
Set-Location E:\Cluadecode\fairy-keys
git add -A
git commit -m @'
feat: Bubble Pop game with speed-controlled bubbles

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
git push
```

---

### Task 6: Fairy Flight

**Files:**
- Create: `fairy-flight.html`
- Create: `js/fairy-flight.js`
- Modify: `css/style.css` (append `#fairy` / `#star` styles)
- Modify: `index.html` (remove `data-soon` from the Fairy Flight button)

**Interfaces:**
- Consumes: `FK.setupGamePage()`, `FK.addStar()`, `FK.chime()`, `FK.pop()`, `FK.sparkleBurst()`, `FK.randomColor()`, `FK.speed()`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `fairy-flight.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fairy Flight</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="fairy">🧚</div>
  <div id="star">⭐</div>
  <script src="js/audio.js"></script>
  <script src="js/sparkles.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/fairy-flight.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `js/fairy-flight.js`**

```js
(function () {
  FK.setupGamePage();

  var fairy = document.getElementById('fairy');
  var star = document.getElementById('star');
  var x = innerWidth / 2;
  var y = innerHeight / 2;
  var held = {};
  var trailTick = 0;

  function moveStar() {
    star.style.left = 60 + Math.random() * (innerWidth - 120) + 'px';
    star.style.top = 80 + Math.random() * (innerHeight - 160) + 'px';
  }

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'F11') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    held[e.key] = true;
    if (e.key === ' ' && !e.repeat) {
      FK.chime();
      FK.sparkleBurst(x, y, FK.randomColor(), 25);
    }
  });
  addEventListener('keyup', function (e) {
    held[e.key] = false;
  });

  function frame() {
    var step = 4 * FK.speed();
    if (held.ArrowLeft) x -= step;
    if (held.ArrowRight) x += step;
    if (held.ArrowUp) y -= step;
    if (held.ArrowDown) y += step;
    x = Math.max(40, Math.min(innerWidth - 40, x));
    y = Math.max(60, Math.min(innerHeight - 60, y));
    fairy.style.left = x + 'px';
    fairy.style.top = y + 'px';

    var moving = held.ArrowLeft || held.ArrowRight || held.ArrowUp || held.ArrowDown;
    if (moving && ++trailTick % 6 === 0) {
      FK.sparkleBurst(x, y + 20, FK.randomColor(), 3);
    }

    var rect = star.getBoundingClientRect();
    var dx = rect.left + rect.width / 2 - x;
    var dy = rect.top + rect.height / 2 - y;
    if (Math.sqrt(dx * dx + dy * dy) < 55) {
      FK.sparkleBurst(x, y, '#ffd166', 40);
      FK.pop();
      FK.addStar();
      moveStar();
    }
    requestAnimationFrame(frame);
  }

  moveStar();
  frame();
})();
```

- [ ] **Step 3: Append to `css/style.css`**

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

- [ ] **Step 4: Enable the menu button**

In `index.html`, remove ` data-soon` from the Fairy Flight `<a>`.

- [ ] **Step 5: Verify in the browser**

Open `http://localhost:8123/fairy-flight.html`:

1. `preview_console_logs` (level `error`): none.
2. Arrow movement: `preview_eval` → `(() => { const x1 = parseFloat(document.getElementById('fairy').style.left); dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); return x1; })()` then after ~1s: `preview_eval` → `(() => { dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' })); return parseFloat(document.getElementById('fairy').style.left); })()`
   Expected: second value greater than the first.
3. Clamping: dispatch `keydown` ArrowRight, wait 8s, dispatch `keyup`; `preview_eval` → `parseFloat(document.getElementById('fairy').style.left) <= innerWidth - 40` Expected: `true`.
4. Star collection: `preview_eval` → `(() => { const s = document.getElementById('star'); const before = s.style.left + s.style.top; const f = document.getElementById('fairy'); s.style.left = f.style.left; s.style.top = f.style.top; return before; })()`, wait 0.5s, then check `document.getElementById('star-count').textContent` is `"⭐ 1"` and the star moved (left/top differ from `before`).
5. Space wand: dispatch `{ key: ' ' }` keydown+keyup; expect no errors.
6. `preview_screenshot`.

- [ ] **Step 6: Final check of the whole arcade**

Open `http://localhost:8123/`:
1. `preview_snapshot`: all four buttons now full-color (no `data-soon` remains — verify with `preview_eval` → `document.querySelectorAll('[data-soon]').length` Expected: `0`).
2. Click through each of the four buttons; each page loads with no console errors; Esc returns to the menu each time.

- [ ] **Step 7: Commit and push**

```powershell
Set-Location E:\Cluadecode\fairy-keys
git add -A
git commit -m @'
feat: Fairy Flight game — arrows, space wand, star collecting

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
git push
```

---

## Done means

- All four games playable at `https://mjdurning.github.io/fairy-keys/` and by double-clicking `index.html`.
- Speed slider on the menu changes bubble and fairy speed on next game entry.
- No console errors on any page.
- The real acceptance test: the granddaughter, at the keyboard, smiling.
