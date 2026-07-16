(function () {
  FK.setupGamePage();

  var fairy = document.getElementById('fairy');
  var mazeEl = document.getElementById('maze');
  var basketEl = document.getElementById('basket');

  var TOP_PAD = 70;   // room for the HUD and basket
  var PAD = 12;       // breathing room around the maze
  var FRUIT_NAMES = {
    '🍎': 'Apple!', '🍌': 'Banana!', '🍇': 'Grapes!',
    '🍓': 'Strawberry!', '🍊': 'Orange!'
  };

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
    fairy.innerHTML = FK.art.fairy(Math.round(cell * 0.95));
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
      }
    }
  }

  function renderBasket() {
    basketEl.innerHTML = '';
    FK.FRUITS.forEach(function (f) {
      var slot = document.createElement('span');
      slot.className = 'basket-slot' + (basket.indexOf(f) >= 0 ? ' full' : '');
      slot.innerHTML = FK.art.fruit(f, 28);
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
      var angle = (i / basket.length) * Math.PI * 2 - Math.PI / 2;
      el.style.left = x + Math.cos(angle) * cell * 1.4 + 'px';
      el.style.top = y + Math.sin(angle) * cell * 1.4 + 'px';
      el.innerHTML = FK.art.fruit(f, Math.round(cell * 0.6));
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
      checkItems();
    }
    requestAnimationFrame(frame);
  }

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'F11') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
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
