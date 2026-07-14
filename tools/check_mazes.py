"""Sanity-check the maze layouts in js/mazes.js.

Run from the project root:  py tools/check_mazes.py

Checks every maze: rows all the same length, border fully hedged,
exactly one S, the right number of G and F cells for its stage,
and every path cell reachable from S.
"""
import re
import sys
from pathlib import Path

MAZE_FILE = Path(__file__).resolve().parent.parent / 'js' / 'mazes.js'


def load_mazes():
    if not MAZE_FILE.exists():
        print('FAIL: %s does not exist' % MAZE_FILE)
        return None
    text = MAZE_FILE.read_text(encoding='utf-8')
    blocks = re.findall(r"rows:\s*\[(.*?)\]", text, re.S)
    return [re.findall(r"'([#.SGF]+)'", block) for block in blocks]


def check(idx, rows):
    errors = []
    if not rows:
        return ['no rows found']
    width = len(rows[0])
    if any(len(r) != width for r in rows):
        return ['rows are not all the same length']
    cells = ''.join(rows)
    if cells.count('S') != 1:
        errors.append('needs exactly one S, found %d' % cells.count('S'))
    expected_g = 0 if idx == 1 else 1
    expected_f = 5 if idx == 1 else 0
    if cells.count('G') != expected_g:
        errors.append('expected %d G, found %d' % (expected_g, cells.count('G')))
    if cells.count('F') != expected_f:
        errors.append('expected %d F, found %d' % (expected_f, cells.count('F')))
    if rows[0].strip('#') or rows[-1].strip('#'):
        errors.append('top or bottom border is not solid hedge')
    if any(r[0] != '#' or r[-1] != '#' for r in rows):
        errors.append('left or right border is not solid hedge')
    if errors:
        return errors
    start = next((r, c) for r, row in enumerate(rows)
                 for c, ch in enumerate(row) if ch == 'S')
    seen = {start}
    queue = [start]
    while queue:
        r, c = queue.pop()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if (0 <= nr < len(rows) and 0 <= nc < width
                    and rows[nr][nc] != '#' and (nr, nc) not in seen):
                seen.add((nr, nc))
                queue.append((nr, nc))
    unreachable = [(r, c) for r, row in enumerate(rows)
                   for c, ch in enumerate(row)
                   if ch != '#' and (r, c) not in seen]
    if unreachable:
        errors.append('unreachable path cells: %s' % unreachable)
    return errors


def main():
    mazes = load_mazes()
    if mazes is None:
        return 1
    if len(mazes) != 3:
        print('FAIL: expected 3 mazes, found %d' % len(mazes))
        return 1
    ok = True
    for i, rows in enumerate(mazes):
        for e in check(i, rows):
            print('FAIL maze %d: %s' % (i + 1, e))
            ok = False
    if ok:
        print('All 3 mazes look good!')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
