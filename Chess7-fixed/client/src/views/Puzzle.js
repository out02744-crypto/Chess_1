// chess.js is a plain npm package but this project has no bundler, so it's
// loaded straight from a CDN as a native ES module. If you add a real build
// step (Vite/esbuild) later, switch this back to `import {Chess} from 'chess.js'`.
import { Chess } from 'https://esm.sh/chess.js@1.4.0';
import { Board } from '../components/Board.js';

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export async function Puzzle({ api, root, navigate, id, store }) {
  const t = await api('/api/tasks/' + id);
  const isDaily = new URLSearchParams(location.search).get('daily') === '1';
  const game = new Chess(t.fen);

  let flipped = game.turn() === 'b';
  let selected = null;
  let last = [];
  let moves = [];
  let finished = false;
  const start = performance.now();

  function legalTargets(sq) {
    if (!sq) return [];
    return game.moves({ square: sq, verbose: true }).map(m => m.to);
  }

  function render() {
    root.innerHTML = `<section class="fade">
      <div class="view-head">
        <div>
          <h1 class="title">${escapeHtml(t.title)}</h1>
          <div class="sub"><span class="badge">${escapeHtml(t.theme)}</span> · ${t.elo} ELO</div>
        </div>
        <button class="btn secondary" id="flip">↕ Перевернуть</button>
      </div>
      <div class="task-layout">
        <div class="board-wrap">${Board({ fen: game.fen(), flipped, last, selected, legal: legalTargets(selected) })}</div>
        <aside class="side">
          <h3>Ваша линия</h3>
          <div class="moves">${moves.map((m, i) => `<div class="move-row"><span>${i + 1}.</span><span>${escapeHtml(m)}</span></div>`).join('')}</div>
          <hr style="border-color:#333">
          <p class="sub">Найдите лучший тактический ход. Ответ соперника делается автоматически.</p>
          <div id="status"></div>
        </aside>
      </div>
    </section>`;

    root.querySelector('#flip').onclick = () => { flipped = !flipped; render(); };
    if (!finished) {
      root.querySelectorAll('[data-sq]').forEach(el => el.onclick = () => onSquareClick(el.dataset.sq));
    }
  }

  function getRandomLegalMove() {
    const legalMoves = game.moves({ verbose: true });
    return legalMoves.length > 0 ? legalMoves[Math.floor(Math.random() * legalMoves.length)].san : null;
  }

  function onSquareClick(sq) {
    if (finished) return;
    const piece = game.get(sq);

    if (selected === sq) { selected = null; render(); return; }

    if (!selected) {
      if (piece && piece.color === game.turn()) selected = sq;
      render();
      return;
    }

    if (!legalTargets(selected).includes(sq)) {
      selected = (piece && piece.color === game.turn()) ? sq : null;
      render();
      return;
    }

    const move = game.move({ from: selected, to: sq, promotion: 'q' });
    selected = null;
    last = [move.from, move.to];
    moves.push(move.san);
    render();

    const expected = t.solution[moves.length - 1];
    if (expected !== move.san) { submit(); return; }
    if (moves.length >= t.solution.length) { submit(); return; }

    // Play opponent's reply
    setTimeout(() => {
      let reply = t.solution[moves.length];
      
      // If solution doesn't have a reply at this index, try a random legal move
      if (!reply) {
        reply = getRandomLegalMove();
      }

      try {
        if (reply) {
          const rm = game.move(reply);
          if (rm) { 
            moves.push(rm.san); 
            last = [rm.from, rm.to]; 
          } else {
            // Move notation was invalid, try random move
            const randomReply = getRandomLegalMove();
            if (randomReply) {
              const rm2 = game.move(randomReply);
              if (rm2) { moves.push(rm2.san); last = [rm2.from, rm2.to]; }
            }
          }
        }
      } catch { /* puzzle data didn't have a legal reply here */ }
      render();
    }, 600);
  }

  async function submit() {
    finished = true;
    const r = await api('/api/tasks/' + id + '/submit', {
      method: 'POST',
      body: JSON.stringify({ moves, timeMs: performance.now() - start })
    });
    store.dispatch(s => ({ ...s, user: s.user ? { ...s.user, rating: r.rating } : s.user }));

    if (isDaily) {
      try {
        const d = await api('/api/daily/submit', { method: 'POST', body: JSON.stringify({ taskId: t.id, solved: r.solved }) });
        store.dispatch(s => ({ ...s, user: s.user ? { ...s.user, streak: d.streak } : s.user }));
      } catch { /* not fatal to the puzzle result if this fails */ }
    }

    const status = root.querySelector('#status');
    if (status) {
      status.innerHTML = `<p class="quality ${r.solved ? '' : 'bad'}">${r.solved ? '✓ ' + escapeHtml(r.quality) : '✕ ' + escapeHtml(r.quality)}</p>
        <p class="sub">${escapeHtml(r.explanation)}</p>
        <button class="btn" id="next">Следующее задание</button>`;
      root.querySelector('#next')?.addEventListener('click', () => navigate('/tasks'));
    }
  }

  render();
  return { unmount() {} };
}
