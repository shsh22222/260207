import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'tracker.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'trainee',
    training_name TEXT,
    training_start_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    frequency TEXT NOT NULL,
    period TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    goal_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('done','skip','fail')),
    memo TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (goal_id) REFERENCES goals(id),
    UNIQUE(user_id, goal_id, date)
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_user_id INTEGER NOT NULL,
    from_user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (target_user_id) REFERENCES users(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS feedback_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id INTEGER NOT NULL,
    from_user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (feedback_id) REFERENCES feedback(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    display_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feedback_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  );
`);

// ─── Seed data (only if empty) ──────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

if (userCount === 0) {
  const hash = bcrypt.hashSync('password123', 10);

  // Users
  db.prepare(`INSERT INTO users (email, password, name, role, training_name, training_start_date)
    VALUES (?, ?, ?, ?, ?, ?)`).run('tanaka@example.com', hash, '田中 太郎', 'trainee', '次世代リーダー育成プログラム', '2025-01-15');
  db.prepare(`INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`).run('suzuki@example.com', hash, '鈴木部長', 'manager');
  db.prepare(`INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`).run('yamada@example.com', hash, '山田トレーナー', 'trainer');

  // Goals for tanaka (user_id=1)
  db.prepare(`INSERT INTO goals (user_id, title, category, frequency, period, progress, streak) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(1, 'チームメンバーの意見を最後まで聞いてから自分の意見を述べる', 'コミュニケーション', '毎日', '8週間', 78, 5);
  db.prepare(`INSERT INTO goals (user_id, title, category, frequency, period, progress, streak) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(1, '週1回、部下と15分の1on1を実施する', 'マネジメント', '週1回', '12週間', 83, 4);
  db.prepare(`INSERT INTO goals (user_id, title, category, frequency, period, progress, streak) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(1, '会議の冒頭でゴールとアジェンダを共有する', 'リーダーシップ', '週3回', '8週間', 65, 3);

  // Checkin history (past 2 weeks sample)
  const checkinStmt = db.prepare('INSERT INTO checkins (user_id, goal_id, date, status, memo) VALUES (?, ?, ?, ?, ?)');
  const dates = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date('2025-02-27');
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  const statuses = ['done', 'done', 'done', 'skip', 'done', 'fail', 'done', 'done', 'done', 'done', 'skip', 'done', 'done', 'done'];
  const memos = [
    '午後のプロジェクト会議で山本さんの提案を最後まで聞いてからフィードバックした。',
    null, '朝会で佐藤さんが報告中、途中で口を挟みそうになったが我慢できた。', null,
    'クライアントとの打ち合わせで、相手の要望を最後まで聞いてから提案した。',
    '急な案件対応で余裕がなかった。次回は深呼吸してから臨む。', null,
    null, null, '週次定例でアジェンダを最初に共有。参加者から「分かりやすい」と言われた。',
    null, '急な会議でもホワイトボードにゴールを書いてから始めた。', null, null
  ];
  dates.forEach((date, i) => {
    checkinStmt.run(1, 1, date, statuses[i], memos[i] || null);
    if (i % 7 === 0) checkinStmt.run(1, 2, date, 'done', i === 7 ? '佐藤さんとの1on1で最近の悩みを聞けた。' : null);
    if (i % 2 === 0) checkinStmt.run(1, 3, date, i % 6 === 0 ? 'skip' : 'done', null);
  });

  // Feedback
  db.prepare(`INSERT INTO feedback (target_user_id, from_user_id, message, likes, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(1, 2, '最近の会議での進行が格段に良くなっています。アジェンダの共有が習慣化されてきましたね。', 2, '2025-02-24');
  db.prepare(`INSERT INTO feedback (target_user_id, from_user_id, message, likes, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(1, 3, '1on1の実施率が高いですね。部下の佐藤さんから「最近上司が話を聞いてくれるようになった」と聞きました。素晴らしい変化です！', 3, '2025-02-20');
  db.prepare(`INSERT INTO feedback (target_user_id, from_user_id, message, likes, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(1, 2, '傾聴の姿勢が見えてきました。次のステップとして、相手の発言を要約してから自分の意見を述べる練習をしてみてください。', 1, '2025-02-15');

  // Feedback replies
  db.prepare(`INSERT INTO feedback_replies (feedback_id, from_user_id, message, created_at) VALUES (?, ?, ?, ?)`)
    .run(1, 1, 'ありがとうございます！意識して続けます。', '2025-02-24');

  // Tips
  const tipStmt = db.prepare('INSERT INTO tips (category, title, content, display_date) VALUES (?, ?, ?, ?)');
  tipStmt.run('コミュニケーション', '傾聴の3ステップ', '①相手の目を見る ②相槌を打つ ③最後まで聞いてから要約する。この3つを意識するだけで、相手の「聞いてもらえた」という満足度が大きく変わります。', '2025-02-27');
  tipStmt.run('リーダーシップ', '会議を変える30秒', '会議の最初の30秒で「今日のゴール」と「終了時間」を伝えるだけで、参加者の集中力と満足度が向上します。試してみましょう。', '2025-02-26');
  tipStmt.run('マネジメント', '1on1を充実させるコツ', '1on1では「最近どう？」よりも「今週一番チャレンジングだったことは？」のような具体的な問いかけが効果的です。', '2025-02-25');
  tipStmt.run('コミュニケーション', '「Yes, and」の技法', '相手の意見に対して「でも」ではなく「そうですね、さらに」と受け止めてから自分の意見を加えると、建設的な議論になります。', '2025-02-24');
  tipStmt.run('リーダーシップ', 'ビジョンの言語化', 'チームの方向性を示すとき、抽象的な言葉より具体的なエピソードや数字を使うと、メンバーの共感と行動につながります。', '2025-02-23');
  tipStmt.run('マネジメント', 'フィードバックのサンドイッチ法', '良い点→改善点→期待の順で伝えると、相手が前向きに受け取りやすくなります。ただし、形式的にならないよう誠実さが大切です。', '2025-02-22');

  console.log('Seed data inserted.');
}

export default db;
