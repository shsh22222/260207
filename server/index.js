import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'behavior-tracker-secret-key';

app.use(cors());
app.use(express.json());

// ─── Serve built frontend in production ─────────────────
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// ─── Auth middleware ────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: '認証が必要です' });
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'トークンが無効です' });
  }
}

// ─── Auth routes ────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role, trainingName, trainingStartDate } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, name は必須です' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password, name, role, training_name, training_start_date) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(email, hash, name, role || 'trainee', trainingName || null, trainingStartDate || null);
    const user = db.prepare('SELECT id, email, name, role, training_name, training_start_date FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, training_name, training_start_date, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません' });
  res.json(user);
});

// ─── Goals routes ───────────────────────────────────────
app.get('/api/goals', auth, (req, res) => {
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? AND active = 1 ORDER BY created_at').all(req.user.id);
  res.json(goals);
});

app.post('/api/goals', auth, (req, res) => {
  const { title, category, frequency, period } = req.body;
  if (!title || !category || !frequency || !period) {
    return res.status(400).json({ error: '全項目を入力してください' });
  }
  const activeCount = db.prepare('SELECT COUNT(*) as c FROM goals WHERE user_id = ? AND active = 1').get(req.user.id).c;
  if (activeCount >= 5) {
    return res.status(400).json({ error: '目標は最大5個までです' });
  }
  const result = db.prepare('INSERT INTO goals (user_id, title, category, frequency, period) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, title, category, frequency, period);
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(goal);
});

app.put('/api/goals/:id', auth, (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!goal) return res.status(404).json({ error: '目標が見つかりません' });
  const { title, category, frequency, period } = req.body;
  db.prepare('UPDATE goals SET title = COALESCE(?, title), category = COALESCE(?, category), frequency = COALESCE(?, frequency), period = COALESCE(?, period) WHERE id = ?')
    .run(title, category, frequency, period, req.params.id);
  res.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id));
});

app.delete('/api/goals/:id', auth, (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!goal) return res.status(404).json({ error: '目標が見つかりません' });
  db.prepare('UPDATE goals SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '目標を削除しました' });
});

// ─── Check-in routes ────────────────────────────────────
app.get('/api/checkins', auth, (req, res) => {
  const { date, from, to } = req.query;
  if (date) {
    const checkins = db.prepare('SELECT c.*, g.title as goal_title, g.category FROM checkins c JOIN goals g ON c.goal_id = g.id WHERE c.user_id = ? AND c.date = ?')
      .all(req.user.id, date);
    return res.json(checkins);
  }
  if (from && to) {
    const checkins = db.prepare('SELECT c.*, g.title as goal_title, g.category FROM checkins c JOIN goals g ON c.goal_id = g.id WHERE c.user_id = ? AND c.date BETWEEN ? AND ? ORDER BY c.date')
      .all(req.user.id, from, to);
    return res.json(checkins);
  }
  const checkins = db.prepare('SELECT c.*, g.title as goal_title, g.category FROM checkins c JOIN goals g ON c.goal_id = g.id WHERE c.user_id = ? ORDER BY c.date DESC LIMIT 100')
    .all(req.user.id);
  res.json(checkins);
});

app.post('/api/checkins', auth, (req, res) => {
  const { entries } = req.body; // [{ goalId, date, status, memo }]
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'entries 配列が必要です' });
  }

  const upsert = db.prepare(`
    INSERT INTO checkins (user_id, goal_id, date, status, memo)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, goal_id, date) DO UPDATE SET status = excluded.status, memo = excluded.memo
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      upsert.run(req.user.id, item.goalId, item.date, item.status, item.memo || null);
    }
  });

  try {
    insertMany(entries);
    // Update streaks and progress for affected goals
    for (const entry of entries) {
      updateGoalStats(req.user.id, entry.goalId);
    }
    res.json({ message: 'チェックイン完了', count: entries.length });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

function updateGoalStats(userId, goalId) {
  // Calculate streak (consecutive 'done' days going backwards from today)
  const recent = db.prepare(
    "SELECT date, status FROM checkins WHERE user_id = ? AND goal_id = ? ORDER BY date DESC LIMIT 30"
  ).all(userId, goalId);

  let streak = 0;
  for (const row of recent) {
    if (row.status === 'done') streak++;
    else if (row.status === 'fail') break;
    // 'skip' doesn't break streak
  }

  // Calculate progress (done / (done + fail) in the last 30 days, skip excluded)
  const stats = db.prepare(
    "SELECT status, COUNT(*) as c FROM checkins WHERE user_id = ? AND goal_id = ? AND date >= date('now', '-30 days') GROUP BY status"
  ).all(userId, goalId);
  const done = stats.find(s => s.status === 'done')?.c || 0;
  const fail = stats.find(s => s.status === 'fail')?.c || 0;
  const total = done + fail;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  db.prepare('UPDATE goals SET streak = ?, progress = ? WHERE id = ?').run(streak, progress, goalId);
}

// ─── Check-in stats ─────────────────────────────────────
app.get('/api/checkins/stats', auth, (req, res) => {
  // Weekly stats for the last 6 weeks
  const weekly = db.prepare(`
    SELECT
      strftime('%W', date) as week_num,
      MIN(date) as week_start,
      COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
      COUNT(CASE WHEN status = 'fail' THEN 1 END) as fail,
      COUNT(CASE WHEN status = 'skip' THEN 1 END) as skip
    FROM checkins
    WHERE user_id = ? AND date >= date('now', '-42 days')
    GROUP BY week_num
    ORDER BY week_num
  `).all(req.user.id);

  const weeklyRates = weekly.map((w, i) => {
    const total = w.done + w.fail;
    return {
      week: `第${i + 1}週`,
      rate: total > 0 ? Math.round((w.done / total) * 100) : 0,
      done: w.done,
      fail: w.fail,
      skip: w.skip,
    };
  });

  // Per-goal stats
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? AND active = 1').all(req.user.id);
  const goalStats = goals.map(g => ({
    id: g.id,
    name: g.title.length > 8 ? g.title.slice(0, 8) + '…' : g.title,
    fullName: g.title,
    category: g.category,
    rate: g.progress,
  }));

  // Success memos
  const memos = db.prepare(`
    SELECT c.date, c.memo, g.id as goal_id, g.category
    FROM checkins c JOIN goals g ON c.goal_id = g.id
    WHERE c.user_id = ? AND c.status = 'done' AND c.memo IS NOT NULL AND c.memo != ''
    ORDER BY c.date DESC LIMIT 20
  `).all(req.user.id);

  // Overall rate
  const overall = db.prepare(`
    SELECT
      COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
      COUNT(CASE WHEN status = 'fail' THEN 1 END) as fail
    FROM checkins
    WHERE user_id = ? AND date >= date('now', '-7 days')
  `).get(req.user.id);
  const overallTotal = overall.done + overall.fail;
  const overallRate = overallTotal > 0 ? Math.round((overall.done / overallTotal) * 100) : 0;

  res.json({ weeklyRates, goalStats, memos, overallRate });
});

// ─── Feedback routes ────────────────────────────────────
app.get('/api/feedback', auth, (req, res) => {
  const feedbacks = db.prepare(`
    SELECT f.*, u.name as from_name, u.role as from_role
    FROM feedback f JOIN users u ON f.from_user_id = u.id
    WHERE f.target_user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id);

  const result = feedbacks.map(f => {
    const replies = db.prepare(`
      SELECT fr.*, u.name as from_name
      FROM feedback_replies fr JOIN users u ON fr.from_user_id = u.id
      WHERE fr.feedback_id = ?
      ORDER BY fr.created_at
    `).all(f.id);
    return { ...f, replies };
  });

  res.json(result);
});

app.post('/api/feedback/:id/like', auth, (req, res) => {
  const fb = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  if (!fb) return res.status(404).json({ error: 'フィードバックが見つかりません' });
  db.prepare('UPDATE feedback SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  res.json({ likes: fb.likes + 1 });
});

app.post('/api/feedback/:id/reply', auth, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'メッセージを入力してください' });
  const fb = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  if (!fb) return res.status(404).json({ error: 'フィードバックが見つかりません' });
  const result = db.prepare('INSERT INTO feedback_replies (feedback_id, from_user_id, message) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, message);
  const reply = db.prepare('SELECT fr.*, u.name as from_name FROM feedback_replies fr JOIN users u ON fr.from_user_id = u.id WHERE fr.id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(reply);
});

app.post('/api/feedback/request', auth, (req, res) => {
  // Send feedback request to all managers/trainers
  const managers = db.prepare("SELECT id FROM users WHERE role IN ('manager', 'trainer')").all();
  const stmt = db.prepare('INSERT INTO feedback_requests (from_user_id, to_user_id) VALUES (?, ?)');
  const insertMany = db.transaction(() => {
    for (const m of managers) {
      stmt.run(req.user.id, m.id);
    }
  });
  insertMany();
  res.json({ message: 'フィードバック依頼を送信しました', count: managers.length });
});

// ─── Tips routes ────────────────────────────────────────
app.get('/api/tips', auth, (req, res) => {
  const tips = db.prepare('SELECT * FROM tips ORDER BY display_date DESC').all();
  res.json(tips);
});

app.get('/api/tips/today', auth, (req, res) => {
  const tip = db.prepare('SELECT * FROM tips ORDER BY display_date DESC LIMIT 1').get();
  if (!tip) return res.status(404).json({ error: 'Tipsがありません' });
  res.json(tip);
});

// ─── Health check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── SPA fallback (serve index.html for non-API routes) ─
app.get('/{*path}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// ─── Start server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
