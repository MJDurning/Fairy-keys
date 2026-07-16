(function () {
  var slider = document.getElementById('speed');
  slider.value = FK.speedLevel();
  slider.addEventListener('input', function () {
    FK.setSpeedLevel(slider.value);
  });

  FK.addFullscreenButton();

  document.querySelectorAll('[data-soon]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      btn.classList.remove('wiggle');
      void btn.offsetWidth; /* restart the animation */
      btn.classList.add('wiggle');
    });
  });

  // Swap emoji card art for the hand-drawn icons, and float the fairy
  // beside the title. Emoji stays in the HTML as a no-JS fallback.
  document.querySelectorAll('.game-btn[data-art]').forEach(function (btn) {
    var icon = FK.art.icon(btn.dataset.art);
    if (icon) btn.querySelector('.art').innerHTML = icon;
  });
  var h1 = document.querySelector('h1');
  if (h1) {
    h1.insertAdjacentHTML('beforeend',
      '<span class="title-fairy">' + FK.art.fairy(56) + '</span>');
  }
})();
