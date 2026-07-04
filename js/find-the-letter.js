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
