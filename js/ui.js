window.FK = window.FK || {};
(function () {
  var SPEEDS = [0.5, 0.75, 1, 1.5, 2];

  FK.speedLevel = function () {
    var level = parseInt(localStorage.getItem('fk-speed-level'), 10);
    return level >= 1 && level <= 5 ? level : 2;
  };
  FK.setSpeedLevel = function (level) {
    localStorage.setItem('fk-speed-level', String(level));
  };
  FK.speed = function () {
    return SPEEDS[FK.speedLevel() - 1];
  };

  FK.addFullscreenButton = function () {
    var btn = document.createElement('button');
    btn.id = 'fs-btn';
    btn.textContent = '⛶';
    btn.title = 'Full screen';
    btn.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    });
    document.body.appendChild(btn);
  };

  var stars = 0;
  FK.addStar = function (n) {
    stars += n || 1;
    var el = document.getElementById('star-count');
    if (el) el.textContent = '⭐ ' + stars;
  };

  FK.setupGamePage = function () {
    var hud = document.createElement('div');
    hud.id = 'hud';
    hud.innerHTML =
      '<a id="back-btn" href="index.html" title="Back to the menu">🏠</a>' +
      '<span id="star-count">⭐ 0</span>';
    document.body.appendChild(hud);
    FK.addFullscreenButton();
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape') location.href = 'index.html';
    });
  };
})();
