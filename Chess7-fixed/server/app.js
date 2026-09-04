import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'ChessTrainer' }));

const db = new Database(process.env.DB_PATH || path.join(__dirname, 'chesstrainer.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    rating INTEGER DEFAULT 800,
    streak INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS attempts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    task_id INTEGER,
    correct INTEGER,
    quality TEXT,
    time_ms INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS daily_completions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    task_id INTEGER,
    solved INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
  );
`);

// NOTE: this sample data is illustrative only and has not been verified with
// an engine — e.g. task 4 is labelled "Мат в 1" but its solution has three
// half-moves and doesn't actually deliver mate. Replace with a vetted puzzle
// set (e.g. an exported Lichess puzzle database) before shipping.
const tasks = [
  { id: 1, fen: 'r1bqk2r/pppp1ppp/2n2n2/8/1b2P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 5', solution: ['Bxc6', 'dxc6', 'Qh5'], theme: 'Вилка', elo: 650, title: 'Удар по коню и королю' },
  { id: 2, fen: 'rnbqk2r/ppp1bppp/5n2/3p4/3P4/2N1P3/PPP1BPPP/R1BQK1NR w KQkq - 2 6', solution: ['Nxd5', 'Nxd5', 'Bf3'], theme: 'Связка', elo: 900, title: 'Тактическая связка' },
  { id: 3, fen: 'r3k2r/ppp2ppp/2n1bn2/8/2B1P3/2N2N2/PPP2PPP/R1BQ1RK1 w kq - 0 10', solution: ['Bxe6', 'fxe6', 'Ng5'], theme: 'Жертва', elo: 1250, title: 'Жертва на короля' },
  { id: 4, fen: '6k1/5ppp/8/8/8/5Q2/6PP/6K1 w - - 0 1', solution: ['Qf8+', 'Kxf8', 'h4'], theme: 'Мат в 1', elo: 350, title: 'Простой мат' },
  { id: 5, fen: '2r3k1/pp3ppp/3bp3/8/2P5/1P2B3/P4PPP/2R3K1 w - - 0 20', solution: ['Bh7+', 'Kxh7', 'Qd3+'], theme: 'Отвлечение', elo: 1450, title: 'Отвлечение защитника' }
];

const books = [
  { id: 'lasker-common', title: 'Common Sense in Chess', author: 'Эмануил Ласкер', year: 1896, desc: 'Классические тактические мотивы и основы стратегии.', tasks: 24 },
  { id: 'staunton-handbook', title: "The Chess-Player's Handbook", author: 'Говард Стейунтон', year: 1847, desc: 'Комбинации, дебютные ловушки и классические позиции.', tasks: 31 },
  { id: 'capablanca-fundamentals', title: 'Chess Fundamentals', author: 'Хосе Рауль Капабланка', year: 1921, desc: 'Техника, эндшпиль и простые матовые схемы.', tasks: 28 },
  { id: 'reti-modern', title: 'Modern Ideas in Chess', author: 'Рихард Рети', year: 1923, desc: 'Гипермодернизм и тактические идеи из центра.', tasks: 19 }
];

// A hardcoded secret meant every deployment of this app shared the same JWT
// signing key — anyone could forge tokens for any user. Require it from the
// environment; only fall back to a (loudly-flagged) dev value locally.
const SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[ChessTrainer] JWT_SECRET is not set — using an insecure development-only secret. Set a real JWT_SECRET before deploying.');
  return 'chesstrainer-dev-secret-DO-NOT-USE-IN-PRODUCTION';
})();

const sessions = new Map();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  try { req.user = jwt.verify(h.replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
}
function optionalAuth(req, res, next) {
  const h = req.headers.authorization || '';
  try { req.user = jwt.verify(h.replace('Bearer ', ''), SECRET); } catch { /* stay anonymous */ }
  next();
}
function token(u) { return jwt.sign({ id: u.id, email: u.email, nickname: u.nickname }, SECRET, { expiresIn: '7d' }); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

app.post('/api/auth/register', async (req, res) => {
  const { email, password, nickname } = req.body || {};
  if (!email || !password || !nickname) return res.status(400).json({ error: 'Заполните все поля' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Некорректный email' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Пароль должен быть не короче 8 символов' });
  const cleanNickname = String(nickname).trim().slice(0, 24);
  if (cleanNickname.length < 2) return res.status(400).json({ error: 'Никнейм слишком короткий' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = db.prepare('INSERT INTO users(email,password,nickname) VALUES(?,?,?)').run(email, hash, cleanNickname);
    const u = db.prepare('SELECT id,email,nickname,rating,streak FROM users WHERE id=?').get(r.lastInsertRowid);
    res.json({ user: u, token: token(u) });
  } catch {
    res.status(409).json({ error: 'Email уже зарегистрирован' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(req.body?.email);
  if (!u || !(await bcrypt.compare(req.body?.password || '', u.password))) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }
  res.json({ user: { id: u.id, email: u.email, nickname: u.nickname, rating: u.rating, streak: u.streak }, token: token(u) });
});

app.post('/api/auth/refresh', auth, (req, res) => res.json({ token: token(req.user) }));
app.post('/api/auth/logout', (req, res) => res.json({ ok: true }));

app.get('/api/tasks', (req, res) => {
  let list = [...tasks];
  if (req.query.theme) list = list.filter(x => x.theme === req.query.theme);
  if (req.query.elo) list = list.filter(x => Math.abs(x.elo - Number(req.query.elo)) <= 300);
  res.json(list);
});

app.get('/api/tasks/:id', (req, res) => {
  const t = tasks.find(x => x.id === Number(req.params.id));
  t ? res.json(t) : res.status(404).json({ error: 'Not found' });
});

app.post('/api/tasks/:id/submit', auth, (req, res) => {
  const t = tasks.find(x => x.id === Number(req.params.id));
  if (!t) return res.status(404).end();
  const moves = Array.isArray(req.body?.moves) ? req.body.moves : [];
  const correct = t.solution.slice(0, moves.length).every((m, i) => m === moves[i]);
  const solved = correct && moves.length >= t.solution.length;
  const quality = solved ? 'Best' : (moves.length ? 'Blunder' : 'Mistake');
  const currentRating = db.prepare('SELECT rating FROM users WHERE id=?').get(req.user.id).rating;
  const delta = solved
    ? Math.max(5, Math.round(20 + (t.elo - currentRating) / 40))
    : -Math.max(5, Math.round(15 + (800 - t.elo) / 80));
  db.prepare('INSERT INTO attempts(user_id,task_id,correct,quality,time_ms) VALUES(?,?,?,?,?)')
    .run(req.user.id, t.id, solved ? 1 : 0, quality, req.body?.timeMs || 0);
  db.prepare('UPDATE users SET rating=MAX(0,rating+?) WHERE id=?').run(delta, req.user.id);
  const u = db.prepare('SELECT id,email,nickname,rating,streak FROM users WHERE id=?').get(req.user.id);
  res.json({
    solved, quality, delta, rating: u.rating,
    explanation: solved ? 'Точный ход по лучшей линии.' : 'Ищи форсированный тактический ресурс.'
  });
});

app.get('/api/daily', optionalAuth, (req, res) => {
  const task = tasks[(new Date().getUTCDate() - 1) % tasks.length];
  let solvedToday = false;
  let history = [];
  if (req.user) {
    const rows = db.prepare('SELECT date,solved FROM daily_completions WHERE user_id=? ORDER BY date DESC LIMIT 30').all(req.user.id);
    const byDate = new Map(rows.map(r => [r.date, !!r.solved]));
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      history.push({ date: key, solved: byDate.get(key) || false });
    }
    solvedToday = byDate.get(todayStr()) || false;
  }
  res.json({ ...task, daily: true, solvedToday, history });
});

app.post('/api/daily/submit', auth, (req, res) => {
  const date = todayStr();
  const solved = !!req.body?.solved;
  db.prepare(`
    INSERT INTO daily_completions(user_id,date,task_id,solved) VALUES(?,?,?,?)
    ON CONFLICT(user_id,date) DO UPDATE SET solved=excluded.solved, task_id=excluded.task_id
  `).run(req.user.id, date, req.body?.taskId || null, solved ? 1 : 0);

  // Recompute the streak as consecutive solved days ending today, from the source of truth.
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    const row = db.prepare('SELECT solved FROM daily_completions WHERE user_id=? AND date=?').get(req.user.id, key);
    if (!row || !row.solved) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  db.prepare('UPDATE users SET streak=? WHERE id=?').run(streak, req.user.id);
  res.json({ ok: true, streak });
});

app.get('/api/library', (req, res) => res.json(books));
app.get('/api/library/:bookId/tasks', (req, res) => res.json(tasks.map(t => ({ ...t, bookId: req.params.bookId }))));

app.get('/api/stats/me', auth, (req, res) => {
  const a = db.prepare('SELECT * FROM attempts WHERE user_id=? ORDER BY id').all(req.user.id);
  const u = db.prepare('SELECT rating,streak FROM users WHERE id=?').get(req.user.id);
  const solved = a.filter(x => x.correct).length;
  res.json({
    rating: u.rating, streak: u.streak, total: a.length, solved,
    accuracy: a.length ? Math.round(solved / a.length * 100) : 0,
    quality: {
      Best: a.filter(x => x.quality === 'Best').length,
      Good: a.filter(x => x.quality === 'Good').length,
      Inaccuracy: a.filter(x => x.quality === 'Inaccuracy').length,
      Mistake: a.filter(x => x.quality === 'Mistake').length,
      Blunder: a.filter(x => x.quality === 'Blunder').length
    },
    history: a.map((x, i) => ({ date: x.created_at, rating: u.rating - (a.length - i) * 2 }))
  });
});

// NOTE: Storm sessions/results are still trust-the-client — nothing here
// verifies a submitted score against an actual server-tracked session. Fine
// for a prototype, but treat it as a known gap before this is public.
app.get('/api/storm/session', auth, (req, res) => {
  const id = crypto.randomUUID?.() || String(Date.now());
  sessions.set(id, { user: req.user.id, started: Date.now(), score: 0 });
  res.json({ id, duration: 180 });
});
app.post('/api/storm/result', auth, (req, res) => res.json({ ok: true, score: Number(req.body?.score || 0) }));

app.use(express.static(path.join(__dirname, '..', 'client')));
app.use((req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'index.html')));

const server = app.listen(process.env.PORT || 3000, () => console.log('ChessTrainer http://localhost:' + (process.env.PORT || 3000)));
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', ws => ws.send(JSON.stringify({ type: 'connected' })));
