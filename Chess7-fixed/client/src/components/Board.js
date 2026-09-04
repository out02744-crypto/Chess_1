// Every piece shares one 45x45 drawing area and the same base silhouette,
// so white and black pieces are always identical in size and shape - only
// the fill/stroke colors (set in CSS via .piece-w / .piece-b) differ.
const shapes = {
  p: `<circle cx="22.5" cy="13" r="6.5"/>
      <path d="M15,32 L18.5,20 L26.5,20 L30,32 Z"/>
      <rect x="10" y="32" width="25" height="6" rx="2"/>`,
  r: `<rect x="10" y="33" width="25" height="6" rx="1"/>
      <rect x="12" y="16" width="21" height="18"/>
      <rect x="11" y="12" width="23" height="5"/>
      <rect x="11" y="6" width="5" height="7"/>
      <rect x="20" y="6" width="5" height="7"/>
      <rect x="29" y="6" width="5" height="7"/>`,
  n: `<rect x="10" y="33" width="25" height="6" rx="2"/>
      <polygon points="15,33 15,27 12,24 12,20 16,16 16,12 20,9 26,9 30,12 33,15 33,19 29,19 27,22 30,25 28,28 24,26 22,28 22,33"/>`,
  b: `<rect x="12" y="33" width="21" height="6" rx="2"/>
      <path d="M15,33 C13,26 16,20 22.5,17 C29,20 32,26 30,33 Z"/>
      <circle cx="22.5" cy="12" r="4"/>
      <rect x="19.3" y="18.8" width="7" height="2.2" rx="1" transform="rotate(-35 22.5 20)"/>`,
  q: `<rect x="9" y="34" width="27" height="6" rx="2"/>
      <path d="M14,34 L17,22 L28,22 L31,34 Z"/>
      <path d="M13,22 L15,14 L19,20 L22.5,11 L26,20 L30,14 L32,22 Z"/>
      <circle cx="15" cy="13" r="2"/>
      <circle cx="22.5" cy="10" r="2.3"/>
      <circle cx="30" cy="13" r="2"/>`,
  k: `<rect x="9" y="34" width="27" height="6" rx="2"/>
      <path d="M14,34 L17,21 L28,21 L31,34 Z"/>
      <path d="M13,21 L32,21 L29,15 L16,15 Z"/>
      <rect x="21" y="4" width="3" height="10"/>
      <rect x="18" y="7" width="9" height="3"/>`
};

function pieceSvg(color, type) {
  return `<svg class="piece piece-${color}" viewBox="0 0 45 45">${shapes[type]}</svg>`;
}

function parseFen(fen) {
  const rows = fen.split(' ')[0].split('/');
  const out = [];
  for (let r = 0; r < 8; r++) {
    let f = 0;
    for (const c of rows[r]) {
      if (/\d/.test(c)) { f += +c; continue; }
      out.push({ r, f, color: c === c.toUpperCase() ? 'w' : 'b', type: c.toLowerCase() });
      f++;
    }
  }
  return out;
}

// selected: currently selected square ("e4") or null
// legal: array of squares the selected piece can legally move to
export function Board({ fen, flipped = false, last = [], selected = null, legal = [] }) {
  const pieces = parseFen(fen);
  let html = '';
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const rr = flipped ? 7 - r : r;
      const ff = flipped ? 7 - f : f;
      const piece = pieces.find(x => x.r === rr && x.f === ff);
      const sq = String.fromCharCode(97 + ff) + (8 - rr);
      const classes = ['sq', (r + f) % 2 ? 'dark' : 'light'];
      if (last.includes(sq)) classes.push('last');
      if (selected === sq) classes.push('sel'); // matches the .sq.sel rule already in app.css
      const isLegalTarget = legal.includes(sq);
      if (isLegalTarget) classes.push(piece ? 'capture-target' : 'move-target');
      html += `<div class="${classes.join(' ')}" data-sq="${sq}">` +
        (piece ? pieceSvg(piece.color, piece.type) : '') +
        (isLegalTarget ? '<span class="dot"></span>' : '') +
        `</div>`;
    }
  }
  return `<div class="board" id="board">${html}</div>`;
}
