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
    el.style.top = innerHeight + 60 + 'px';
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
