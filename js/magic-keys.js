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
