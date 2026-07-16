window.FK = window.FK || {};
// Hand-drawn SVG art for the twilight glow-up. Pure functions returning
// markup strings; gradient ids are namespaced per call so many copies can
// live on one page without SVG id collisions.
(function () {
  var uid = 0;

  function glowDefs(p, color) {
    return '<radialGradient id="' + p + 'glow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.9"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
      '</radialGradient>';
  }

  function open(size, viewBox, defs) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="' + viewBox +
      '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' + defs + '</defs>';
  }

  FK.art = {};

  FK.art.fairy = function (size) {
    var p = 'fk' + (++uid) + '_';
    var defs = glowDefs(p, '#ffe9a8') +
      '<linearGradient id="' + p + 'wing" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#c8f4ff" stop-opacity="0.95"/>' +
      '<stop offset="100%" stop-color="#9a7bff" stop-opacity="0.55"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + p + 'dress" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#b388ff"/>' +
      '<stop offset="100%" stop-color="#7c4dff"/>' +
      '</linearGradient>';
    return open(size, '0 0 76 76', defs) +
      '<circle cx="38" cy="38" r="36" fill="url(#' + p + 'glow)"/>' +
      '<ellipse cx="24" cy="30" rx="15" ry="9" fill="url(#' + p + 'wing)" transform="rotate(-28 24 30)"/>' +
      '<ellipse cx="52" cy="30" rx="15" ry="9" fill="url(#' + p + 'wing)" transform="rotate(28 52 30)"/>' +
      '<ellipse cx="24" cy="42" rx="11" ry="7" fill="url(#' + p + 'wing)" opacity="0.8" transform="rotate(-58 24 42)"/>' +
      '<ellipse cx="52" cy="42" rx="11" ry="7" fill="url(#' + p + 'wing)" opacity="0.8" transform="rotate(58 52 42)"/>' +
      '<path d="M31 38 L45 38 L41 58 Q38 61 35 58 Z" fill="url(#' + p + 'dress)"/>' +
      '<circle cx="38" cy="28" r="9" fill="#ffdbac"/>' +
      '<path d="M29 26 Q30 15 38 16 Q47 15 47 26 Q43 20 38 21 Q33 20 29 26 Z" fill="#8d5a2b"/>' +
      '<circle cx="35" cy="28" r="1.4" fill="#3a2470"/>' +
      '<circle cx="41" cy="28" r="1.4" fill="#3a2470"/>' +
      '<path d="M35 32 Q38 34.5 41 32" stroke="#c2649a" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<line x1="46" y1="40" x2="56" y2="32" stroke="#e0c060" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M56 27 L57.6 31 L61.5 31.3 L58.4 33.8 L59.5 37.6 L56 35.4 L52.5 37.6 L53.6 33.8 L50.5 31.3 L54.4 31 Z" fill="#ffe07a">' +
      '<animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite"/>' +
      '</path></svg>';
  };

  // Shared 44x44 glowing-fruit shell. fruitSize is set by FK.art.fruit
  // just before a builder runs.
  var fruitSize = 44;
  function glowPiece(p, glowColor, body) {
    return open(fruitSize, '0 0 44 44', glowDefs(p, glowColor)) +
      '<circle cx="22" cy="24" r="19" fill="url(#' + p + 'glow)"/>' + body + '</svg>';
  }

  var FRUIT_BUILDERS = {
    '🍎': function (p) {
      return glowPiece(p, '#ff9aa8',
        '<circle cx="22" cy="26" r="12" fill="#ff5a6e"/>' +
        '<circle cx="18" cy="22" r="4" fill="#ff97a4" opacity="0.85"/>' +
        '<path d="M22 14 Q22 8 27 7" stroke="#8d5a2b" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="28" cy="10" rx="5" ry="2.6" fill="#69c77e" transform="rotate(-22 28 10)"/>');
    },
    '🍌': function (p) {
      return glowPiece(p, '#ffe07a',
        '<path d="M9 28 Q20 40 33 25 L35 20 Q36 17 33 18 L32 19 Q22 31 11 24 Q8 23 9 28 Z" fill="#ffd166"/>' +
        '<path d="M33 18 L35 15 Q36 13 37 15 L36 20 Z" fill="#8d5a2b"/>' +
        '<path d="M12 26 Q21 32 29 25" stroke="#e0aa3e" stroke-width="1.4" fill="none" opacity="0.7"/>');
    },
    '🍇': function (p) {
      return glowPiece(p, '#c9a6ff',
        '<path d="M22 12 Q22 6 27 5" stroke="#8d5a2b" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="27" cy="9" rx="4.6" ry="2.4" fill="#69c77e" transform="rotate(-20 27 9)"/>' +
        '<circle cx="16" cy="19" r="5" fill="#9a6bff"/>' +
        '<circle cx="28" cy="19" r="5" fill="#8a5ce8"/>' +
        '<circle cx="22" cy="26" r="5" fill="#a678ff"/>' +
        '<circle cx="16" cy="33" r="5" fill="#8a5ce8"/>' +
        '<circle cx="28" cy="33" r="5" fill="#9a6bff"/>' +
        '<circle cx="22" cy="38" r="5" fill="#7c4dd6"/>' +
        '<circle cx="20" cy="24" r="1.6" fill="#d9c2ff" opacity="0.9"/>');
    },
    '🍓': function (p) {
      return glowPiece(p, '#ff8fb0',
        '<path d="M22 14 Q32 14 32 24 Q32 34 22 40 Q12 34 12 24 Q12 14 22 14 Z" fill="#ff4d6d"/>' +
        '<path d="M22 14 L18 9 L22 11 L26 8 L25 13 Z" fill="#57b368"/>' +
        '<ellipse cx="18" cy="22" rx="1.2" ry="1.8" fill="#ffe9a8"/>' +
        '<ellipse cx="26" cy="22" rx="1.2" ry="1.8" fill="#ffe9a8"/>' +
        '<ellipse cx="22" cy="28" rx="1.2" ry="1.8" fill="#ffe9a8"/>' +
        '<ellipse cx="17" cy="30" rx="1.2" ry="1.8" fill="#ffe9a8"/>' +
        '<ellipse cx="27" cy="30" rx="1.2" ry="1.8" fill="#ffe9a8"/>');
    },
    '🍊': function (p) {
      return glowPiece(p, '#ffc27a',
        '<circle cx="22" cy="26" r="12" fill="#ffa94d"/>' +
        '<circle cx="18" cy="22" r="4" fill="#ffc98a" opacity="0.9"/>' +
        '<circle cx="22" cy="15" r="1.6" fill="#c77e35"/>' +
        '<ellipse cx="27" cy="12" rx="5" ry="2.6" fill="#69c77e" transform="rotate(-18 27 12)"/>');
    }
  };

  FK.art.fruit = function (emoji, size) {
    var builder = FRUIT_BUILDERS[emoji];
    if (!builder) return emoji;
    fruitSize = size;
    return builder('fk' + (++uid) + '_');
  };

  FK.art.icon = function (name) {
    var p = 'fk' + (++uid) + '_';
    if (name === 'magic-keys') {
      return open(56, '0 0 64 64', glowDefs(p, '#ffe9a8')) +
        '<circle cx="32" cy="34" r="26" fill="url(#' + p + 'glow)"/>' +
        '<rect x="14" y="24" width="36" height="30" rx="8" fill="rgba(255,255,255,0.14)" stroke="#ffe07a" stroke-width="2.5"/>' +
        '<text x="32" y="46" font-size="18" font-weight="bold" fill="#ffe9a8" text-anchor="middle" font-family="sans-serif">A</text>' +
        '<path d="M32 6 L34.4 12 L40.5 12.4 L35.7 16.2 L37.4 22 L32 18.6 L26.6 22 L28.3 16.2 L23.5 12.4 L29.6 12 Z" fill="#ffe07a">' +
        '<animate attributeName="opacity" values="1;0.45;1" dur="1.6s" repeatCount="indefinite"/></path></svg>';
    }
    if (name === 'find-the-letter') {
      return open(56, '0 0 64 64', glowDefs(p, '#c8f4ff')) +
        '<circle cx="32" cy="32" r="26" fill="url(#' + p + 'glow)"/>' +
        '<text x="26" y="44" font-size="34" font-weight="bold" fill="#ffe9a8" text-anchor="middle" font-family="sans-serif">A</text>' +
        '<circle cx="42" cy="38" r="10" fill="none" stroke="#c8f4ff" stroke-width="3"/>' +
        '<line x1="49" y1="45" x2="56" y2="52" stroke="#c8f4ff" stroke-width="3.5" stroke-linecap="round"/></svg>';
    }
    if (name === 'bubble-pop') {
      return open(56, '0 0 64 64', glowDefs(p, '#a8d8ff')) +
        '<circle cx="30" cy="34" r="24" fill="url(#' + p + 'glow)"/>' +
        '<circle cx="30" cy="34" r="17" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.65)" stroke-width="2.5"/>' +
        '<circle cx="24" cy="28" r="4" fill="rgba(255,255,255,0.55)"/>' +
        '<text x="30" y="41" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle" font-family="sans-serif">B</text>' +
        '<path d="M50 12 L52 17 L57 18 L52 20 L50 25 L48 20 L43 18 L48 17 Z" fill="#ffe07a">' +
        '<animate attributeName="opacity" values="1;0.4;1" dur="1.3s" repeatCount="indefinite"/></path></svg>';
    }
    if (name === 'fairy-flight') {
      return '<span style="display:flex;align-items:center;gap:2px">' +
        FK.art.fairy(48) + FK.art.fruit('🍎', 30) + '</span>';
    }
    return '';
  };
})();
