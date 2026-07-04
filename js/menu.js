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
})();
