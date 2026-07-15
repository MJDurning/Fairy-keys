# Twilight Fairy Garden Glow-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme the Fairy Keys arcade to a "Twilight Fairy Garden" (dusk sky, stars, fireflies, lantern glow) and replace emoji characters with hand-drawn SVG art in the menu and Fairy Flight, without touching any gameplay logic.

**Architecture:** Two new zero-dependency JS modules — `js/art.js` (pure functions returning SVG strings, exposed on the existing `window.FK` namespace) and `js/night-sky.js` (self-running module that appends a fixed ambience layer of CSS-animated stars/fireflies). The shared `css/style.css` is rethemed using CSS custom properties. Game files receive rendering-only edits; movement, collision, scoring, and sequencing code is untouched.

**Tech Stack:** Vanilla HTML/CSS/JS (ES5 style, IIFEs, no build step), one self-hosted woff2 font (Baloo 2, SIL OFL license). Deployed as static files to GitHub Pages.

## Global Constraints

- No build tools, no npm, no frameworks — plain files only (matches existing project).
- ES5-style JS (`var`, IIFEs, `function` declarations) to match every existing module.
- Gameplay logic must not change: `blockedAt`, `checkItems`, `collect`, `frame`, `startFinale` timing, key handlers, spawn intervals are off-limits except where a line only *renders*.
- Existing game data keeps emoji strings as identifiers (`FK.FRUITS`, `basket`, `FRUIT_NAMES` keys). Only rendering changes.
- Readability rail: every readable element (letters, labels, counters, messages) must be a bright color with glow on the dark sky — never dark-on-dark.
- All ambience animation is CSS-only; no new `requestAnimationFrame` loops.
- Python is invoked as `py` on this machine (Windows).
- The site must keep working offline / with no third-party requests (font is self-hosted).

**Manual verification protocol (used by several tasks):** this project has no JS test framework; tests are browser checks. Serve the project locally with `py -m http.server 8123` from the project root (background it), open `http://localhost:8123/<page>` in the browser preview, and check the listed assertions. Check the console for errors every time (there must be none).

---

### Task 1: Self-hosted storybook font

**Files:**
- Create: `fonts/baloo2-bold.woff2` (downloaded binary)
- Create: `fonts/OFL.txt` (license text)
- Modify: `css/style.css:1-8` (add `@font-face` above existing rules)

**Interfaces:**
- Produces: font-family name `'Baloo 2'` (weight 700) usable anywhere in CSS. Later tasks reference it as `font-family: 'Baloo 2', "Comic Sans MS", "Segoe UI", sans-serif;`.

- [ ] **Step 1: Download the font file**

From the project root (`E:\Cluadecode\projects\fairy-keys`), in Git Bash:

```bash
mkdir -p fonts
# Ask Google Fonts for the CSS with a modern UA so it serves woff2, then pull the URL out.
FONT_URL=$(curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&display=swap" \
  | grep -o "https://fonts.gstatic.com/[^)]*\.woff2" | head -1)
echo "$FONT_URL"
curl -sL -o fonts/baloo2-bold.woff2 "$FONT_URL"
curl -sL -o fonts/OFL.txt "https://raw.githubusercontent.com/google/fonts/main/ofl/baloo2/OFL.txt"
```

Expected: `echo` prints a `fonts.gstatic.com/...woff2` URL; both files exist afterward.

- [ ] **Step 2: Verify the download is a real woff2**

```bash
ls -la fonts/ && head -c 4 fonts/baloo2-bold.woff2
```

Expected: `baloo2-bold.woff2` is roughly 15–60 KB (not 0, not a few hundred bytes of HTML error page) and the first 4 bytes are `wOF2`. If the download failed, STOP and report — do not commit a broken font. (The theme still works without it via the fallback stack, but then skip to Task 2 and leave the `@font-face` out.)

- [ ] **Step 3: Add the @font-face declaration**

At the very top of `css/style.css`, before `* { box-sizing: border-box; }`:

```css
@font-face {
  font-family: 'Baloo 2';
  src: url('../fonts/baloo2-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

- [ ] **Step 4: Verify the font loads**

Serve and open `http://localhost:8123/index.html`. In the browser console run:

```js
document.fonts.load("700 16px 'Baloo 2'").then(function (f) { return f.length; })
```

Expected: resolves to `1` (font parsed and loaded). Network tab shows `baloo2-bold.woff2` served from localhost with status 200.

- [ ] **Step 5: Commit**

```bash
git add fonts/ css/style.css
git commit -m "feat: bundle Baloo 2 storybook font (SIL OFL)"
```

---

### Task 2: Twilight theme in the shared stylesheet

**Files:**
- Modify: `css/style.css` (retheme; every selector listed below with complete replacement code)

**Interfaces:**
- Consumes: `'Baloo 2'` font from Task 1.
- Produces: CSS custom properties on `:root` (`--sky-top`, `--sky-mid`, `--sky-bottom`, `--glow-gold`, `--gold-soft`, `--text-bright`, `--lantern-bg`, `--lantern-border`, `--hedge-light`, `--hedge-dark`) and classes/keyframes later tasks rely on: `#night-sky`, `.star`, `.firefly`, `twinkle`, `firefly-drift`, `fairy-bob`, `lantern-pulse`. Layout rules (positions, sizes, grid) are intentionally unchanged.

- [ ] **Step 1: Add the palette and retheme the base + menu styles**

In `css/style.css`, insert the `:root` block right after the `@font-face` rule, then replace the existing `body`, `h1`, `.game-btn`, `.game-btn .label`, and `.speed-box`/`#speed` rules with the versions below. Do not touch `* { box-sizing }`, `html, body` height, `.game-grid` layout, `[data-soon]`, `.wiggle`.

```css
:root {
  --sky-top: #1b1140;
  --sky-mid: #3a2470;
  --sky-bottom: #6b3fa0;
  --glow-gold: #ffe07a;
  --gold-soft: #ffe9a8;
  --text-bright: #fff6d8;
  --lantern-bg: rgba(40, 24, 80, 0.55);
  --lantern-border: rgba(255, 225, 150, 0.55);
  --hedge-light: #2e6b4f;
  --hedge-dark: #1d4a38;
}

body {
  font-family: "Comic Sans MS", "Segoe UI", sans-serif;
  background: linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 55%, var(--sky-bottom) 100%);
  overflow: hidden;
  user-select: none;
}

h1 {
  text-align: center; font-size: 3rem; color: var(--gold-soft);
  font-family: 'Baloo 2', "Comic Sans MS", "Segoe UI", sans-serif;
  margin: 1.5rem 0 0.5rem;
  text-shadow: 0 0 18px rgba(255, 220, 130, 0.8), 0 0 44px rgba(255, 190, 90, 0.4);
}

.game-btn {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 28px 12px; border-radius: 24px;
  background: var(--lantern-bg); border: 3px solid var(--lantern-border);
  text-decoration: none;
  box-shadow: 0 0 18px rgba(255, 210, 120, 0.25), inset 0 0 24px rgba(255, 220, 140, 0.08);
  transition: transform 0.15s, box-shadow 0.15s;
}
.game-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(255, 220, 130, 0.55), inset 0 0 24px rgba(255, 220, 140, 0.15);
}
.game-btn .art { font-size: 3.5rem; line-height: 1; display: flex; align-items: center; gap: 4px; }
.game-btn .label {
  font-size: 1.4rem; font-weight: bold; color: var(--gold-soft);
  font-family: 'Baloo 2', "Comic Sans MS", "Segoe UI", sans-serif;
}

.speed-box {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; margin-top: 12px; font-size: 2rem; color: var(--text-bright);
}
#speed { width: min(360px, 60vw); accent-color: var(--glow-gold); height: 12px; }
```

- [ ] **Step 2: Retheme the shared chrome (HUD, fullscreen, star counter)**

Replace the existing `#fs-btn`, `#hud`, `#hud a`, `#star-count` rules:

```css
#fs-btn {
  position: fixed; right: 12px; bottom: 12px; z-index: 20;
  font-size: 1.6rem; padding: 6px 12px; border-radius: 12px;
  border: 2px solid var(--lantern-border);
  background: var(--lantern-bg); color: var(--gold-soft); cursor: pointer;
}
#hud {
  position: fixed; left: 12px; top: 12px; z-index: 20;
  display: flex; align-items: center; gap: 16px; font-size: 2rem;
}
#hud a {
  text-decoration: none; background: var(--lantern-bg);
  border-radius: 12px; padding: 4px 10px; border: 2px solid var(--lantern-border);
}
#star-count {
  color: var(--gold-soft); font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 220, 130, 0.8);
}
```

- [ ] **Step 3: Add the ambience layer styles and content-stacking helpers**

Append a new section after the shared-chrome rules:

```css
/* Night-sky ambience (populated by js/night-sky.js) */
#night-sky { position: fixed; inset: 0; z-index: 1; pointer-events: none; }
#night-sky .star {
  position: absolute; width: 3px; height: 3px; border-radius: 50%;
  background: #fff; opacity: 0.25; animation: twinkle 2.6s infinite;
}
#night-sky .firefly {
  position: absolute; width: 6px; height: 6px; border-radius: 50%;
  background: var(--glow-gold);
  box-shadow: 0 0 10px 4px rgba(255, 224, 122, 0.55);
  animation: firefly-drift var(--dur, 6s) ease-in-out infinite;
}
@keyframes twinkle { 50% { opacity: 1; } }
@keyframes firefly-drift {
  0%, 100% { transform: translate(0, 0); opacity: 0.5; }
  50% { transform: translate(var(--dx, 40px), var(--dy, -30px)); opacity: 1; }
}
/* Keep page content above the ambience layer */
h1, .game-grid, .speed-box, #stage { position: relative; z-index: 2; }
```

- [ ] **Step 4: Retheme the game-specific styles**

Replace the existing `.big-letter`, `#target`, `.kb-key`, `.kb-key.wiggle-key`, `.bubble`, `.hedge`, `.maze-item`, `#basket`, `.maze-msg` rules (keep every other rule in those sections — keyframes `pop-fade`, `key-wiggle`, `msg-fade`, `feast-bob`, the `#stage`/`.fairy-icon`/`#keyboard-hint` layout rules, `.basket-slot`, `.feast-fruit`, `#fairy`, `#maze`, `canvas#fx` — unchanged for now):

```css
.big-letter {
  position: fixed; z-index: 6; font-size: 9rem; font-weight: bold;
  transform: translate(-50%, -50%);
  text-shadow: 0 0 18px currentColor, 0 0 40px rgba(255, 255, 255, 0.35);
  pointer-events: none; animation: pop-fade 1.2s forwards;
}

#target {
  font-size: 14rem; font-weight: bold; line-height: 1;
  text-shadow: 0 0 22px currentColor, 0 0 50px rgba(255, 255, 255, 0.3);
  cursor: pointer;
}

.kb-key {
  width: 44px; height: 44px; display: flex; align-items: center;
  justify-content: center; background: rgba(255, 255, 255, 0.12);
  border: 2px solid var(--lantern-border); border-radius: 8px;
  font-weight: bold; font-size: 1.2rem; color: var(--gold-soft);
}
.kb-key.wiggle-key {
  animation: key-wiggle 0.5s infinite;
  background: var(--glow-gold); color: #3a2470;
  box-shadow: 0 0 14px rgba(255, 224, 122, 0.9);
}

.bubble {
  position: fixed; z-index: 4; width: 110px; height: 110px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 3.5rem; font-weight: bold; color: #fff;
  text-shadow: 0 0 12px rgba(140, 200, 255, 0.9);
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5), rgba(150, 190, 255, 0.18));
  border: 3px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 0 16px rgba(160, 200, 255, 0.35), inset -8px -8px 16px rgba(80, 60, 160, 0.25);
}

.hedge {
  position: absolute;
  background: linear-gradient(145deg, var(--hedge-light) 0%, var(--hedge-dark) 70%);
  border-radius: 22%;
  box-shadow: 0 0 10px rgba(120, 220, 170, 0.18),
              inset 0 -4px 8px rgba(0, 30, 15, 0.5),
              inset 0 3px 6px rgba(180, 255, 215, 0.25);
}

.maze-item {
  position: absolute; z-index: 3; display: flex;
  align-items: center; justify-content: center; pointer-events: none;
  animation: lantern-pulse 1.8s ease-in-out infinite alternate;
}
@keyframes lantern-pulse {
  from { filter: drop-shadow(0 0 4px rgba(255, 220, 130, 0.55)); }
  to   { filter: drop-shadow(0 0 11px rgba(255, 220, 130, 0.95)); }
}

#basket {
  position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
  z-index: 20; display: none; gap: 10px; padding: 6px 16px;
  background: var(--lantern-bg); border: 2px solid var(--lantern-border);
  border-radius: 16px; font-size: 2rem;
}

.maze-msg {
  position: fixed; left: 50%; top: 40%; transform: translate(-50%, -50%);
  z-index: 25; font-size: 3.2rem; font-weight: bold; color: var(--gold-soft);
  font-family: 'Baloo 2', "Comic Sans MS", "Segoe UI", sans-serif;
  text-shadow: 0 0 16px rgba(255, 220, 130, 0.85), 0 0 40px rgba(255, 190, 90, 0.4);
  text-align: center; pointer-events: none; animation: msg-fade 2.6s forwards;
}
```

- [ ] **Step 5: Verify every page against the new sky**

Serve and open each page; check, with zero console errors:

- `index.html` — dusk gradient background, glowing gold title in the rounded font, lantern cards with gold borders that brighten on hover, bright slider. Cards still navigate.
- `magic-keys.html` — press letters: big letters are clearly readable (bright glow, no white box shadow remnants), star counter gold.
- `find-the-letter.html` — target letter readable; press 3 wrong keys: keyboard hint appears, keys are gold-on-dark, target key glows yellow with dark text.
- `bubble-pop.html` — bubbles look like moonlit glass, white glowing letters readable.
- `fairy-flight.html` — hedges night-green with soft rim glow, fruit (still emoji this task) pulses like lanterns, title message gold, basket dark glass.

- [ ] **Step 6: Commit**

```bash
git add css/style.css
git commit -m "feat: twilight fairy garden theme across the arcade"
```

---

### Task 3: Night-sky ambience module on every page

**Files:**
- Create: `js/night-sky.js`
- Modify: `index.html`, `magic-keys.html`, `find-the-letter.html`, `bubble-pop.html`, `fairy-flight.html` (one script tag each)

**Interfaces:**
- Consumes: `#night-sky`, `.star`, `.firefly` CSS from Task 2.
- Produces: a `#night-sky` DOM layer, self-running on load. No JS API — later tasks only need the script tag ordering rule: `night-sky.js` loads after `ui.js` (any position works; keep it last for consistency).

- [ ] **Step 1: Write the module**

Create `js/night-sky.js`:

```js
window.FK = window.FK || {};
// Sprinkles twinkling stars and drifting fireflies behind the page.
// Pure ambience: CSS animations only, capped counts, pointer-events none.
(function () {
  var STAR_COUNT = 30;
  var FIREFLY_COUNT = 6;

  var layer = document.createElement('div');
  layer.id = 'night-sky';

  for (var i = 0; i < STAR_COUNT; i++) {
    var star = document.createElement('span');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 70 + '%';
    star.style.animationDelay = (Math.random() * 2.6).toFixed(2) + 's';
    if (Math.random() < 0.3) { star.style.width = star.style.height = '2px'; }
    layer.appendChild(star);
  }

  for (var j = 0; j < FIREFLY_COUNT; j++) {
    var fly = document.createElement('span');
    fly.className = 'firefly';
    fly.style.left = 5 + Math.random() * 90 + '%';
    fly.style.top = 15 + Math.random() * 75 + '%';
    fly.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
    fly.style.setProperty('--dy', (Math.random() * 80 - 40).toFixed(0) + 'px');
    fly.style.setProperty('--dur', (4 + Math.random() * 4).toFixed(1) + 's');
    fly.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
    layer.appendChild(fly);
  }

  document.body.appendChild(layer);
})();
```

- [ ] **Step 2: Add the script tag to all five pages**

In each HTML file, add as the **last** script tag in `<body>`:

```html
  <script src="js/night-sky.js"></script>
```

(`index.html` currently ends with `menu.js`; the four game pages end with their game script. The new tag goes after those.)

- [ ] **Step 3: Verify**

Serve and open all five pages:

- ~30 twinkling stars in the upper sky, 6 slowly wandering glowing fireflies on every page.
- Menu: fireflies never block clicks (click a card while a firefly crosses it).
- Fairy Flight: stars/fireflies sit *behind* hedges, fruit, and fairy (layer z-index 1 vs maze z-index 2+).
- Magic Keys: mash keys — sparkles still render on top (canvas z-index 5).
- No console errors anywhere.

- [ ] **Step 4: Commit**

```bash
git add js/night-sky.js index.html magic-keys.html find-the-letter.html bubble-pop.html fairy-flight.html
git commit -m "feat: twinkling stars and drifting fireflies on every page"
```

---

### Task 4: The art module (fairy, fruit, menu icons)

**Files:**
- Create: `js/art.js`

**Interfaces:**
- Consumes: nothing (pure string builders on `window.FK`).
- Produces (exact signatures later tasks call):
  - `FK.art.fairy(size)` → SVG string, square, `size` px wide/tall. Glowing fairy: translucent wings, dress, wand with an animated twinkling star.
  - `FK.art.fruit(emoji, size)` → SVG string for keys `'🍎' '🍌' '🍇' '🍓' '🍊'`; **returns the emoji string itself for any unknown key** (fallback rail).
  - `FK.art.icon(name)` → HTML string for `'magic-keys' | 'find-the-letter' | 'bubble-pop' | 'fairy-flight'`; unknown name returns `''`.
  - Every drawing namespaces its gradient/filter ids with a per-call unique prefix so multiple copies coexist on one page.

- [ ] **Step 1: Write the module**

Create `js/art.js`:

```js
window.FK = window.FK || {};
// Hand-drawn SVG art for the twilight glow-up. Pure functions returning
// markup strings; gradient ids are namespaced per call so many copies can
// live on one page without SVG id collisions.
(function () {
  var uid = 0;

  function glowDefs(p, color) {
    return '<radialGradient id="' + p + 'glow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.9"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
      '</radialGradient>';
  }

  function open(size, viewBox, defs) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="' + viewBox +
      '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' + defs + '</defs>';
  }

  FK.art = {};

  FK.art.fairy = function (size) {
    var p = 'fk' + (++uid) + '_';
    var defs = glowDefs(p, '#ffe9a8') +
      '<linearGradient id="' + p + 'wing" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#c8f4ff" stop-opacity="0.95"/>' +
      '<stop offset="100%" stop-color="#9a7bff" stop-opacity="0.55"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + p + 'dress" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#b388ff"/>' +
      '<stop offset="100%" stop-color="#7c4dff"/>' +
      '</linearGradient>';
    return open(size, '0 0 76 76', defs) +
      '<circle cx="38" cy="38" r="36" fill="url(#' + p + 'glow)"/>' +
      '<ellipse cx="24" cy="30" rx="15" ry="9" fill="url(#' + p + 'wing)" transform="rotate(-28 24 30)"/>' +
      '<ellipse cx="52" cy="30" rx="15" ry="9" fill="url(#' + p + 'wing)" transform="rotate(28 52 30)"/>' +
      '<ellipse cx="24" cy="42" rx="11" ry="7" fill="url(#' + p + 'wing)" opacity="0.8" transform="rotate(-58 24 42)"/>' +
      '<ellipse cx="52" cy="42" rx="11" ry="7" fill="url(#' + p + 'wing)" opacity="0.8" transform="rotate(58 52 42)"/>' +
      '<path d="M31 38 L45 38 L41 58 Q38 61 35 58 Z" fill="url(#' + p + 'dress)"/>' +
      '<circle cx="38" cy="28" r="9" fill="#ffdbac"/>' +
      '<path d="M29 26 Q30 15 38 16 Q47 15 47 26 Q43 20 38 21 Q33 20 29 26 Z" fill="#8d5a2b"/>' +
      '<circle cx="35" cy="28" r="1.4" fill="#3a2470"/>' +
      '<circle cx="41" cy="28" r="1.4" fill="#3a2470"/>' +
      '<path d="M35 32 Q38 34.5 41 32" stroke="#c2649a" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<line x1="46" y1="40" x2="56" y2="32" stroke="#e0c060" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M56 27 L57.6 31 L61.5 31.3 L58.4 33.8 L59.5 37.6 L56 35.4 L52.5 37.6 L53.6 33.8 L50.5 31.3 L54.4 31 Z" fill="#ffe07a">' +
      '<animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite"/>' +
      '</path></svg>';
  };

  // Shared 44x44 glowing-fruit shell. fruitSize is set by FK.art.fruit
  // just before a builder runs.
  var fruitSize = 44;
  function glowPiece(p, glowColor, body) {
    return open(fruitSize, '0 0 44 44', glowDefs(p, glowColor)) +
      '<circle cx="22" cy="24" r="19" fill="url(#' + p + 'glow)"/>' + body + '</svg>';
  }

  var FRUIT_BUILDERS = {
    '🍎': function (p) {
      return glowPiece(p, '#ff9aa8',
        '<circle cx="22" cy="26" r="12" fill="#ff5a6e"/>' +
        '<circle cx="18" cy="22" r="4" fill="#ff97a4" opacity="0.85"/>' +
        '<path d="M22 14 Q22 8 27 7" stroke="#8d5a2b" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="28" cy="10" rx="5" ry="2.6" fill="#69c77e" transform="rotate(-22 28 10)"/>');
    },
    '🍌': function (p) {
      return glowPiece(p, '#ffe07a',
        '<path d="M9 28 Q20 40 33 25 L35 20 Q36 17 33 18 L32 19 Q22 31 11 24 Q8 23 9 28 Z" fill="#ffd166"/>' +
        '<path d="M33 18 L35 15 Q36 13 37 15 L36 20 Z" fill="#8d5a2b"/>' +
        '<path d="M12 26 Q21 32 29 25" stroke="#e0aa3e" stroke-width="1.4" fill="none" opacity="0.7"/>');
    },
    '🍇': function (p) {
      return glowPiece(p, '#c9a6ff',
        '<path d="M22 12 Q22 6 27 5" stroke="#8d5a2b" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="27" cy="9" rx="4.6" ry="2.4" fill="#69c77e" transform="rotate(-20 27 9)"/>' +
        '<circle cx="16" cy="19" r="5" fill="#9a6bff"/>' +
        '<circle cx="28" cy="19" r="5" fill="#8a5ce8"/>' +
        '<circle cx="22" cy="26" r="5" fill="#a678ff"/>' +
        '<circle cx="16" cy="33" r="5" fill="#8a5ce8"/>' +
        '<circle cx="28" cy="33" r="5" fill="#9a6bff"/>' +
        '<circle cx="22" cy="38" r="5" fill="#7c4dd6"/>' +
        '<circle cx="20" cy="24" r="1.6" fill="#d9c2ff" opacity="0.9"/>');
    },
    '🍓': function (p) {
      return glowPiece(p, '#ff8fb0',
        '<path d="M22 14 Q32 14 32 24 Q32 34 22 40 Q12 34 12 24 Q12 14 22 14 Z" fill="#ff4d6d"/>' +
        '<path d="M22 14 L18 9 L22 11 L26 8 L25 13 Z" fill="#57b368"/>' +
        '<ellipse cx="18" cy="22" rx="1.2" ry="1.8" fill="#ffe9a8"/>' +
        '<ellipse cx="26" cy="22" rx="1.2" ry="1.8" fill="#ffe9a8"/>' +
        '<ellipse cx="22" cy="28" rx="1.2" ry="1.8" fill="#ffe9a8"/>' +
        '<ellipse cx="17" cy="30" rx="1.2" ry="1.8" fill="#ffe9a8"/>' +
        '<ellipse cx="27" cy="30" rx="1.2" ry="1.8" fill="#ffe9a8"/>');
    },
    '🍊': function (p) {
      return glowPiece(p, '#ffc27a',
        '<circle cx="22" cy="26" r="12" fill="#ffa94d"/>' +
        '<circle cx="18" cy="22" r="4" fill="#ffc98a" opacity="0.9"/>' +
        '<circle cx="22" cy="15" r="1.6" fill="#c77e35"/>' +
        '<ellipse cx="27" cy="12" rx="5" ry="2.6" fill="#69c77e" transform="rotate(-18 27 12)"/>');
    }
  };

  FK.art.fruit = function (emoji, size) {
    var builder = FRUIT_BUILDERS[emoji];
    if (!builder) return emoji;
    fruitSize = size;
    return builder('fk' + (++uid) + '_');
  };

  FK.art.icon = function (name) {
    var p = 'fk' + (++uid) + '_';
    if (name === 'magic-keys') {
      return open(56, '0 0 64 64', glowDefs(p, '#ffe9a8')) +
        '<circle cx="32" cy="34" r="26" fill="url(#' + p + 'glow)"/>' +
        '<rect x="14" y="24" width="36" height="30" rx="8" fill="rgba(255,255,255,0.14)" stroke="#ffe07a" stroke-width="2.5"/>' +
        '<text x="32" y="46" font-size="18" font-weight="bold" fill="#ffe9a8" text-anchor="middle" font-family="sans-serif">A</text>' +
        '<path d="M32 6 L34.4 12 L40.5 12.4 L35.7 16.2 L37.4 22 L32 18.6 L26.6 22 L28.3 16.2 L23.5 12.4 L29.6 12 Z" fill="#ffe07a">' +
        '<animate attributeName="opacity" values="1;0.45;1" dur="1.6s" repeatCount="indefinite"/></path></svg>';
    }
    if (name === 'find-the-letter') {
      return open(56, '0 0 64 64', glowDefs(p, '#c8f4ff')) +
        '<circle cx="32" cy="32" r="26" fill="url(#' + p + 'glow)"/>' +
        '<text x="26" y="44" font-size="34" font-weight="bold" fill="#ffe9a8" text-anchor="middle" font-family="sans-serif">A</text>' +
        '<circle cx="42" cy="38" r="10" fill="none" stroke="#c8f4ff" stroke-width="3"/>' +
        '<line x1="49" y1="45" x2="56" y2="52" stroke="#c8f4ff" stroke-width="3.5" stroke-linecap="round"/></svg>';
    }
    if (name === 'bubble-pop') {
      return open(56, '0 0 64 64', glowDefs(p, '#a8d8ff')) +
        '<circle cx="30" cy="34" r="24" fill="url(#' + p + 'glow)"/>' +
        '<circle cx="30" cy="34" r="17" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.65)" stroke-width="2.5"/>' +
        '<circle cx="24" cy="28" r="4" fill="rgba(255,255,255,0.55)"/>' +
        '<text x="30" y="41" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle" font-family="sans-serif">B</text>' +
        '<path d="M50 12 L52 17 L57 18 L52 20 L50 25 L48 20 L43 18 L48 17 Z" fill="#ffe07a">' +
        '<animate attributeName="opacity" values="1;0.4;1" dur="1.3s" repeatCount="indefinite"/></path></svg>';
    }
    if (name === 'fairy-flight') {
      return '<span style="display:flex;align-items:center;gap:2px">' +
        FK.art.fairy(48) + FK.art.fruit('🍎', 30) + '</span>';
    }
    return '';
  };
})();
```

- [ ] **Step 2: Smoke-test the module in the browser**

Add `<script src="js/art.js"></script>` to `index.html` (before `menu.js` — this stays for Task 5). Serve, open the menu, and in the console:

```js
document.body.insertAdjacentHTML('beforeend',
  '<div style="position:fixed;inset:auto 10px 10px auto;z-index:99;background:#222;padding:8px;display:flex;gap:6px" id="art-test">'
  + FK.art.fairy(76)
  + ['🍎','🍌','🍇','🍓','🍊'].map(function (f) { return FK.art.fruit(f, 44); }).join('')
  + FK.art.icon('magic-keys') + FK.art.icon('find-the-letter')
  + FK.art.icon('bubble-pop') + FK.art.icon('fairy-flight')
  + '</div>');
```

Expected: a strip appears showing the fairy (twinkling wand star), all five fruits recognizable at a glance (apple red, banana yellow crescent, grape cluster, strawberry with seeds, orange with leaf), and four icons. Also verify fallback: `FK.art.fruit('🏰', 40)` returns the string `'🏰'`. Then remove the strip: `document.getElementById('art-test').remove()`.

- [ ] **Step 3: Commit**

```bash
git add js/art.js index.html
git commit -m "feat: hand-drawn SVG art module - fairy, fruits, menu icons"
```

---

### Task 5: Menu integration — illustrated icons and title fairy

**Files:**
- Modify: `index.html` (card icons keep emoji as no-JS fallback; script tag added in Task 4)
- Modify: `js/menu.js` (inject icons + title fairy)
- Modify: `css/style.css` (title fairy hover animation)

**Interfaces:**
- Consumes: `FK.art.icon(name)`, `FK.art.fairy(size)` from Task 4.
- Produces: menu cards carry `data-art` attributes naming their icon.

- [ ] **Step 1: Tag the cards with their icon names**

In `index.html`, add a `data-art` attribute to each card (emoji spans stay as fallback content):

```html
    <a class="game-btn" href="magic-keys.html" data-art="magic-keys">
      <span class="art">✨⌨️</span><span class="label">Magic Keys</span>
    </a>
    <a class="game-btn" href="find-the-letter.html" data-art="find-the-letter">
      <span class="art">🧚🔤</span><span class="label">Find the Letter</span>
    </a>
    <a class="game-btn" href="bubble-pop.html" data-art="bubble-pop">
      <span class="art">🫧💥</span><span class="label">Bubble Pop</span>
    </a>
    <a class="game-btn" href="fairy-flight.html" data-art="fairy-flight">
      <span class="art">🧚🍎</span><span class="label">Fairy Flight</span>
    </a>
```

- [ ] **Step 2: Inject the art from menu.js**

Append inside the IIFE in `js/menu.js` (after the `[data-soon]` block):

```js
  // Swap emoji card art for the hand-drawn icons, and float the fairy
  // beside the title. Emoji stays in the HTML as a no-JS fallback.
  document.querySelectorAll('.game-btn[data-art]').forEach(function (btn) {
    var icon = FK.art.icon(btn.dataset.art);
    if (icon) btn.querySelector('.art').innerHTML = icon;
  });
  var h1 = document.querySelector('h1');
  if (h1) {
    h1.insertAdjacentHTML('beforeend',
      '<span class="title-fairy">' + FK.art.fairy(56) + '</span>');
  }
```

- [ ] **Step 3: Style the title fairy**

Add to `css/style.css` (menu section):

```css
.title-fairy { display: inline-block; vertical-align: middle; margin-left: 10px; }
.title-fairy svg { display: block; animation: fairy-bob 1.6s ease-in-out infinite alternate; }
@keyframes fairy-bob {
  from { transform: translateY(-3px); }
  to   { transform: translateY(3px); }
}
```

- [ ] **Step 4: Verify**

Serve `index.html`: illustrated icons on all four cards (no emoji visible), fairy bobbing beside the glowing title, wand star twinkling, all four cards still navigate to their games, slider still works after reload (localStorage value persists). No console errors. Quick no-JS check: `py -c "print('skip')"` — actually just confirm visually that emoji fallback markup remains in the HTML source (View Source shows the emoji spans).

- [ ] **Step 5: Commit**

```bash
git add index.html js/menu.js css/style.css
git commit -m "feat: illustrated menu icons and bobbing title fairy"
```

---

### Task 6: Fairy Flight integration — SVG fairy and glowing fruit

**Files:**
- Modify: `fairy-flight.html` (empty the `#fairy` div; add `art.js` script tag)
- Modify: `js/fairy-flight.js:69` (`layout()`), `js/fairy-flight.js:86-97` (`render()`), `js/fairy-flight.js:102-110` (`renderBasket()`), `js/fairy-flight.js:178-186` (`startFinale()`)
- Modify: `css/style.css` (fairy bob + svg display rules)

**Interfaces:**
- Consumes: `FK.art.fairy(size)`, `FK.art.fruit(emoji, size)` from Task 4; `fairy-bob` keyframes from Task 5.
- Produces: nothing new — same page behavior with new rendering.

- [ ] **Step 1: Update the HTML**

In `fairy-flight.html`: change `<div id="fairy">🧚</div>` to `<div id="fairy"></div>`, and add `<script src="js/art.js"></script>` after `js/mazes.js` (before `js/fairy-flight.js`). Final script order: `audio.js`, `sparkles.js`, `ui.js`, `mazes.js`, `art.js`, `fairy-flight.js`, `night-sky.js`.

- [ ] **Step 2: Swap the fairy rendering in `layout()`**

In `js/fairy-flight.js`, replace the last line of `layout()`:

```js
    fairy.style.fontSize = cell * 0.72 + 'px';
```

with:

```js
    fairy.innerHTML = FK.art.fairy(Math.round(cell * 0.95));
```

- [ ] **Step 3: Swap the fruit rendering in `render()`**

Replace the `else if (ch === 'G' || ch === 'F')` branch body with (only rendering lines change; the `items.push` bookkeeping now reads the emoji from a variable instead of `el.textContent`):

```js
        } else if (ch === 'G' || ch === 'F') {
          var em = ch === 'G' ? maze.goalEmoji : maze.fruitAt[r + ',' + c];
          var el = document.createElement('div');
          el.className = 'maze-item';
          el.style.left = c * cell + 'px';
          el.style.top = r * cell + 'px';
          el.style.width = cell + 'px';
          el.style.height = cell + 'px';
          if (ch === 'F') {
            el.innerHTML = FK.art.fruit(em, Math.round(cell * 0.7));
          } else {
            el.textContent = em;
            el.style.fontSize = cell * 0.6 + 'px';
          }
          mazeEl.appendChild(el);
          items.push({ row: r, col: c, emoji: em, el: el, kind: ch });
        }
```

- [ ] **Step 4: Swap the basket and feast rendering**

In `renderBasket()`, replace `slot.textContent = f;` with:

```js
      slot.innerHTML = FK.art.fruit(f, 28);
```

In `startFinale()`, replace `el.textContent = f;` and the `el.style.fontSize = cell * 0.6 + 'px';` line with:

```js
      el.innerHTML = FK.art.fruit(f, Math.round(cell * 0.6));
```

(The `feast-bob` animation, positioning math, timing, `FK.pop()`/`FK.addStar()` calls all stay exactly as they are.)

- [ ] **Step 5: Add the fairy/fruit display CSS**

In `css/style.css`, extend the Fairy Flight section:

```css
#fairy svg { display: block; animation: fairy-bob 1.6s ease-in-out infinite alternate; }
.maze-item svg, .basket-slot svg, .feast-fruit svg { display: block; }
#basket .basket-slot { display: flex; align-items: center; }
```

- [ ] **Step 6: Full play-test**

Serve `fairy-flight.html` and play a complete run with arrow keys:

1. Maze 1: SVG fairy renders at start (bobbing, wand twinkling), glides with arrows, cannot pass through hedges, sparkle trail follows movement. Castle 🏰 goal still emoji with lantern pulse. Reach it → chime → maze 2 loads.
2. Maze 2: five illustrated fruits pulse like lanterns; basket appears with 5 dim illustrated slots. Collect each fruit → it disappears, basket slot lights up, name is spoken. Collect all 5 → maze 3 loads.
3. Maze 3: reach the cooking pot 🍲 → feast finale: illustrated fruits circle the fairy, pop one at a time with sparkles and stars, "Yummy! 😋" message, then "Play again?" — press a key → restarts at maze 1 with an empty basket.
4. Resize the window mid-maze: maze re-lays-out, fairy repositions to a valid cell, art re-renders at the new cell size.
5. Console: zero errors throughout.

- [ ] **Step 7: Run the maze sanity checker (regression guard)**

```bash
py tools/check_mazes.py
```

Expected: passes exactly as before (mazes untouched).

- [ ] **Step 8: Commit**

```bash
git add fairy-flight.html js/fairy-flight.js css/style.css
git commit -m "feat: hand-drawn glowing fairy and fruit in Fairy Flight"
```

---

### Task 7: Whole-arcade verification and README touch-up

**Files:**
- Modify: `README.md` (one line)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Full arcade pass**

Serve and walk every page end-to-end, checking the readability rail:

- Menu → each game and back (🏠 and Escape both return).
- Magic Keys: letters spoken and readable, stars counted.
- Find the Letter: correct/incorrect flows, hint keyboard readable, praise fires.
- Bubble Pop: bubbles rise, pop on correct key, letters legible on dark sky.
- Fairy Flight: quick re-run of the Task 6 checklist happy path.
- Turtle→rabbit slider on the menu still changes speed in Bubble Pop and Fairy Flight.
- Zero console errors on every page.

- [ ] **Step 2: Update the README flavor line**

In `README.md`, change:

```markdown
No accounts, no ads, no tracking — just sparkles.
```

to:

```markdown
No accounts, no ads, no tracking — just sparkles, stars, and fireflies.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: mention the twilight glow-up in the README"
```

---

## Self-review notes

- **Spec coverage:** menu full treatment (Tasks 2, 3, 5), Fairy Flight full treatment (Tasks 2, 3, 6), other three games backdrop-only (Tasks 2, 3), font (Task 1), art module with emoji-key fallback (Task 4), readability rail (Task 2 Step 5, Task 7 Step 1), performance caps (night-sky constants, CSS-only animation), goal markers stay emoji (Task 6 Step 3), gameplay untouched (verified by diff scope in Tasks 5–6).
- **Type consistency:** `FK.art.fairy(size)`, `FK.art.fruit(emoji, size)`, `FK.art.icon(name)` used identically in Tasks 4, 5, 6. `items[].emoji` still holds emoji strings, so `collect()`/`FRUIT_NAMES`/`basket` work unchanged.
- **Placeholder scan:** no TBDs, no "similar to Task N", every code step shows complete code, every verification step lists concrete assertions.
