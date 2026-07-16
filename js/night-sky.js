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
