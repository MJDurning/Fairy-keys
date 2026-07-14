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

  var held = {};      // which keys are held right now
  var trailTick = 0;

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
  frame();
})();
