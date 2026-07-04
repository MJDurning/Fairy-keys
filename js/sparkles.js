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
