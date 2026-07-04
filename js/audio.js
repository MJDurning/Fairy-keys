window.FK = window.FK || {};
(function () {
  var audioCtx = null;
  function ctx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  FK.speak = function (text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
  };

  function tone(freq, duration, type, volume) {
    var c = ctx();
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  }

  FK.chime = function () { tone(880, 0.3); tone(1320, 0.45); };
  FK.pop = function () { tone(300, 0.12, 'triangle', 0.2); };
  FK.cheer = function () {
    [523, 659, 784, 1047].forEach(function (f, i) {
      setTimeout(function () { tone(f, 0.25); }, i * 90);
    });
  };
})();
