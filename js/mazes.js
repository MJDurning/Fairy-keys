window.FK = window.FK || {};
// Maze legend: '#' hedge, '.' path, 'S' fairy start, 'G' goal, 'F' fruit.
// Rows must all be the same length and the border must be solid '#'.
// After editing, run:  py tools/check_mazes.py
FK.MAZES = [
  {
    title: 'Head out to gather!',
    goalEmoji: '🏰',
    rows: [
      '#############',
      '#S..........#',
      '###########.#',
      '#...........#',
      '#.###########',
      '#..........G#',
      '#############'
    ]
  },
  {
    title: 'Gather the fruit!',
    goalEmoji: null,
    rows: [
      '#############',
      '#S.....F....#',
      '##########..#',
      '#..F........#',
      '#..##########',
      '#......F....#',
      '##########..#',
      '#F........F.#',
      '#############'
    ]
  },
  {
    title: 'Cook the feast!',
    goalEmoji: '🍲',
    rows: [
      '#############',
      '#S..........#',
      '###########.#',
      '#...........#',
      '#.###########',
      '#...........#',
      '###########.#',
      '#.....G.....#',
      '#############'
    ]
  }
];
FK.FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊'];
