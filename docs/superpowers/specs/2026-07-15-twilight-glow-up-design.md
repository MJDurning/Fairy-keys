# Twilight Fairy Garden — visual glow-up design

**Date:** 2026-07-15
**Status:** Approved direction, pending spec review

## Goal

Replace the daytime pastel look with a "Twilight Fairy Garden" theme across the
whole arcade, and replace emoji characters with hand-drawn glowing SVG art in
the menu and Fairy Flight. Gameplay is untouched everywhere.

Chosen by the player-in-chief's grandpa via visual mockups:
- Style: **Twilight Fairy Garden** — dusk purples, twinkling stars, drifting
  fireflies, golden lantern glow.
- Art: **Hand-drawn glowing fairy** — custom SVG fairy with translucent wings
  and twinkling wand, plus matching illustrated fruit.

## Scope

| Page | Treatment |
| --- | --- |
| Menu (`index.html`) | Full: twilight sky, stars + fireflies, glowing title font, lantern cards with illustrated icons, fairy hovering by the title |
| Fairy Flight | Full: twilight sky, moonlit hedges, SVG fairy replaces emoji, illustrated glowing fruit (maze, basket, feast) |
| Magic Keys, Find the Letter, Bubble Pop | Backdrop only: twilight sky, stars + fireflies, glow-styled HUD/buttons; emoji characters and gameplay unchanged |

Out of scope (deliberately): illustrated art for the other three games' characters,
the castle 🏰 and cooking pot 🍲 goal markers (they stay emoji with a glow
halo), sounds, gameplay changes of any kind.

## Experience design

**Menu.** Deep dusk-purple sky (`#1b1140 → #3a2470 → #6b3fa0` gradient),
CSS-animated twinkling stars, a few drifting glowing fireflies. Title "Fairy
Keys" in warm glowing gold using the bundled storybook font, with the SVG fairy
hovering beside it, wings fluttering. Game cards become lantern cards:
translucent dark glass, golden glowing border, brighter glow on hover, each
with an illustrated SVG mini-icon. Layout and positions unchanged. The
turtle→rabbit slider stays put and gets a glowing firefly knob.

**Fairy Flight.** Twilight sky; hedges become deep night-green with a faint
moonlit rim glow (existing `.hedge` restyle). The `#fairy` element renders the
SVG fairy (gently bobbing via CSS) instead of the 🧚 emoji. The five fruits
(apple, banana, grapes, strawberry, orange) become illustrated SVGs with a
soft lantern pulse, rendered in maze cells, basket slots, and the feast
finale. Messages, basket logic, feast sequence all keep working as-is.

**Other three games.** Twilight sky + stars/fireflies backdrop, glow-styled
HUD, back button, fullscreen button. Letters, bubbles, and keyboard hints get
bright/glowing colors so they pop against the dark. Nothing else changes.

**Readability rail.** Anything the child must read (letters, labels, counters)
uses bright glow-palette colors on the dark sky — never dark-on-dark. Each
game's text is checked against the new background.

## Technical design

### New files

- **`js/art.js`** — art module. Pure functions returning SVG strings:
  - `FK.art.fairy(size)` — the glowing fairy (translucent wings, wand with
    animated twinkle star).
  - `FK.art.fruit(emoji, size)` — illustrated fruit looked up by its emoji key
    (`🍎🍌🍇🍓🍊`), so existing game data (`FK.FRUITS`, `basket`,
    `FRUIT_NAMES`) keeps using emoji strings as identifiers; only rendering
    changes. Unknown keys fall back to returning the emoji itself.
  - `FK.art.icon(name)` — the four menu card icons.
  - Gradient/filter `id`s are namespaced per art piece to avoid SVG `id`
    collisions when several drawings share a page.
- **`js/night-sky.js`** — atmosphere module. On load, injects a fixed-position
  backdrop layer (`z-index` below gameplay layers) with ~30 twinkling stars
  and ~6 drifting fireflies, positioned randomly, animated with CSS only.
  Counts are constants at the top of the file, capped for performance.
- **`fonts/`** — one self-hosted rounded storybook display font (Baloo 2 or
  similar free-licensed woff2), declared via `@font-face` with the existing
  stack as fallback. Used for the title and card labels.

### Changed files

- **`css/style.css`** — twilight theme. Palette as CSS custom properties on
  `:root` (`--sky-top`, `--sky-mid`, `--sky-bottom`, `--glow-gold`,
  `--lantern-bg`, `--lantern-border`, `--text-bright`, …). Restyles: body
  background, `h1`, `.game-btn` (lantern card), `#hud`, `#fs-btn`, `#speed`,
  `.hedge` (night-green + moonlit rim), `.maze-item`/fruit glow pulse,
  `#basket`, `.maze-msg`, `.kb-key`, `.bubble`, `.big-letter`, `#target` —
  bright text colors and glows throughout.
- **`index.html`** — card icons swap emoji spans for `FK.art.icon(...)`
  (injected by a small inline script or menu.js), fairy by the title; includes
  `art.js` and `night-sky.js`.
- **`fairy-flight.html`** — `#fairy` starts empty; includes `art.js` and
  `night-sky.js`.
- **`js/fairy-flight.js`** — rendering-only edits:
  - `loadMaze`/setup: `fairy.innerHTML = FK.art.fairy(...)`; `layout()` sizes
    the fairy via SVG width/height from `cell` instead of `fontSize`.
  - `render()`: fruit items get `el.innerHTML = FK.art.fruit(emoji, …)`
    (goal markers keep emoji text + glow class).
  - `renderBasket()` and `startFinale()`: render via `FK.art.fruit`.
  - Movement, collision, collection, feast timing: **no changes**.
- **`magic-keys.html`, `find-the-letter.html`, `bubble-pop.html`** — add one
  `<script src="js/night-sky.js">` tag each.

### Error handling

- Font fails to load → browser falls back to current font stack; nothing breaks.
- `FK.art.fruit` gets an unknown key → returns the emoji string, so the game
  still shows *something* collectible.
- `night-sky.js` runs before body layout settles → it only appends a fixed
  backdrop layer; independent of page content, safe on every page.

### Performance

- All ambience is CSS animation (compositor-friendly); no per-frame JS added.
- Star/firefly counts capped (~30/~6). No change to the game loop.

## Testing

- `py tools/check_mazes.py` still passes (mazes untouched — sanity check).
- Browser play-test of every page against the new theme:
  - Menu: cards navigate, slider works, fairy/icons render.
  - Fairy Flight: full run — maze 1 goal → gather all 5 fruits → maze 3 →
    feast finale → "play again" restart. Collision and resize behavior intact.
  - Magic Keys / Find the Letter / Bubble Pop: keys register, letters and
    bubbles clearly readable on the dark sky.
- Readability check of every text element against the twilight background.
