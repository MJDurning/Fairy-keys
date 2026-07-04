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
