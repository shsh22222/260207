import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, CheckCircle2, BarChart3, MessageSquare, Lightbulb,
  Target, Flame, ChevronRight, Plus, Send, ThumbsUp, Reply,
  Calendar, TrendingUp, Award, Bell, Star, Clock, BookOpen,
  ArrowRight, X, Check, AlertCircle, Sparkles, Heart,
  Users, PenLine, Archive, RefreshCw, LogIn, LogOut, Wifi, WifiOff
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from './api.js';

// ─── Mock Data (fallback when no backend) ───────────────
const MOCK_USER = { name: '田中 太郎', training_name: '次世代リーダー育成プログラム', training_start_date: '2025-01-15' };

const MOCK_GOALS = [
  { id: 1, title: 'チームメンバーの意見を最後まで聞いてから自分の意見を述べる', category: 'コミュニケーション', frequency: '毎日', period: '8週間', progress: 78, streak: 5 },
  { id: 2, title: '週1回、部下と15分の1on1を実施する', category: 'マネジメント', frequency: '週1回', period: '12週間', streak: 4, progress: 83 },
  { id: 3, title: '会議の冒頭でゴールとアジェンダを共有する', category: 'リーダーシップ', frequency: '週3回', period: '8週間', streak: 3, progress: 65 },
];

const MOCK_WEEKLY_DATA = [
  { week: '第1週', rate: 45 }, { week: '第2週', rate: 58 },
  { week: '第3週', rate: 62 }, { week: '第4週', rate: 70 },
  { week: '第5週', rate: 75 }, { week: '第6週', rate: 72 },
];

const MOCK_GOAL_CHART = [
  { name: '傾聴', rate: 78, fill: '#3b82f6' },
  { name: '1on1', rate: 83, fill: '#10b981' },
  { name: 'アジェンダ', rate: 65, fill: '#f59e0b' },
];

const NUDGE_MESSAGES = [
  '今日の会議で「傾聴」を意識してみましょう。相手の話を最後まで聞いてから発言する練習です。',
  '小さな一歩が大きな変化を生みます。今日も1つ、意識的に行動してみましょう。',
  '先週より3%達成率が上がっています！この調子で続けましょう。',
  '「完璧」でなくて大丈夫。意識できたこと自体が成長の証です。',
  '今週のテーマ：「問いかけ」を使ってメンバーの考えを引き出してみましょう。',
];

const MOCK_FEEDBACKS = [
  { id: 1, from_name: '鈴木部長', created_at: '2025-02-24', message: '最近の会議での進行が格段に良くなっています。アジェンダの共有が習慣化されてきましたね。', likes: 2, replies: [{ from_name: '田中 太郎', message: 'ありがとうございます！意識して続けます。', created_at: '2025-02-24' }] },
  { id: 2, from_name: '山田トレーナー', created_at: '2025-02-20', message: '1on1の実施率が高いですね。部下の佐藤さんから「最近上司が話を聞いてくれるようになった」と聞きました。素晴らしい変化です！', likes: 3, replies: [] },
  { id: 3, from_name: '鈴木部長', created_at: '2025-02-15', message: '傾聴の姿勢が見えてきました。次のステップとして、相手の発言を要約してから自分の意見を述べる練習をしてみてください。', likes: 1, replies: [] },
];

const MOCK_TIPS = [
  { id: 1, display_date: '2025-02-27', category: 'コミュニケーション', title: '傾聴の3ステップ', content: '①相手の目を見る ②相槌を打つ ③最後まで聞いてから要約する。この3つを意識するだけで、相手の「聞いてもらえた」という満足度が大きく変わります。' },
  { id: 2, display_date: '2025-02-26', category: 'リーダーシップ', title: '会議を変える30秒', content: '会議の最初の30秒で「今日のゴール」と「終了時間」を伝えるだけで、参加者の集中力と満足度が向上します。試してみましょう。' },
  { id: 3, display_date: '2025-02-25', category: 'マネジメント', title: '1on1を充実させるコツ', content: '1on1では「最近どう？」よりも「今週一番チャレンジングだったことは？」のような具体的な問いかけが効果的です。' },
  { id: 4, display_date: '2025-02-24', category: 'コミュニケーション', title: '「Yes, and」の技法', content: '相手の意見に対して「でも」ではなく「そうですね、さらに」と受け止めてから自分の意見を加えると、建設的な議論になります。' },
  { id: 5, display_date: '2025-02-23', category: 'リーダーシップ', title: 'ビジョンの言語化', content: 'チームの方向性を示すとき、抽象的な言葉より具体的なエピソードや数字を使うと、メンバーの共感と行動につながります。' },
  { id: 6, display_date: '2025-02-22', category: 'マネジメント', title: 'フィードバックのサンドイッチ法', content: '良い点→改善点→期待の順で伝えると、相手が前向きに受け取りやすくなります。ただし、形式的にならないよう誠実さが大切です。' },
];

const MOCK_MEMOS = [
  { goal_id: 1, date: '2025-02-26', memo: '午後のプロジェクト会議で、山本さんの提案を最後まで聞いてからフィードバックした。結果的に良いアイデアが出た。', category: 'コミュニケーション' },
  { goal_id: 1, date: '2025-02-25', memo: '朝会で佐藤さんが報告中、途中で口を挟みそうになったが我慢できた。佐藤さんが最後まで話したら、自分が想定していたのとは違う重要な情報が出てきた。', category: 'コミュニケーション' },
  { goal_id: 2, date: '2025-02-24', memo: '佐藤さんとの1on1で、最近の悩みを聞けた。業務の優先度で困っていたので一緒に整理した。', category: 'マネジメント' },
  { goal_id: 3, date: '2025-02-26', memo: '週次定例でアジェンダを最初に共有。参加者から「分かりやすい」と言われた。', category: 'リーダーシップ' },
  { goal_id: 1, date: '2025-02-22', memo: 'クライアントとの打ち合わせで、相手の要望を最後まで聞いてから提案した。スムーズに合意できた。', category: 'コミュニケーション' },
  { goal_id: 3, date: '2025-02-21', memo: '急な会議でもホワイトボードにゴールを書いてから始めた。議論がブレなかった。', category: 'リーダーシップ' },
];

const PRESET_TEMPLATES = {
  'リーダーシップ研修': [
    { title: '会議の冒頭でゴールとアジェンダを共有する', category: 'リーダーシップ', frequency: '週3回', period: '8週間' },
    { title: 'チームの成果を週1回、全体に共有する', category: 'リーダーシップ', frequency: '週1回', period: '8週間' },
    { title: '意思決定の理由をメンバーに説明する', category: 'リーダーシップ', frequency: '毎日', period: '8週間' },
  ],
  'コミュニケーション研修': [
    { title: '相手の話を最後まで聞いてから発言する', category: 'コミュニケーション', frequency: '毎日', period: '8週間' },
    { title: '会議後に議事録を共有する', category: 'コミュニケーション', frequency: '週3回', period: '4週間' },
    { title: 'メンバーに感謝を伝える', category: 'コミュニケーション', frequency: '毎日', period: '12週間' },
  ],
  'マネジメント研修': [
    { title: '部下と15分の1on1を実施する', category: 'マネジメント', frequency: '週1回', period: '12週間' },
    { title: 'タスクの優先順位をチームと共有する', category: 'マネジメント', frequency: '週3回', period: '8週間' },
    { title: '部下の強みを活かした業務アサインを行う', category: 'マネジメント', frequency: '週1回', period: '12週間' },
  ],
};

const CATEGORIES = ['リーダーシップ', 'コミュニケーション', '問題解決', 'マネジメント', 'その他'];
const FREQUENCIES = ['毎日', '週3回', '週1回'];
const PERIODS = ['4週間', '8週間', '12週間'];
const CHART_FILLS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// ─── Category color helper ─────────────────────────────
const categoryColor = (cat) => {
  switch (cat) {
    case 'リーダーシップ': return 'bg-blue-100 text-blue-700';
    case 'コミュニケーション': return 'bg-emerald-100 text-emerald-700';
    case '問題解決': return 'bg-purple-100 text-purple-700';
    case 'マネジメント': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

// ─── Progress Ring Component ────────────────────────────
function ProgressRing({ percent, size = 120, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 70 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} className="animate-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-1000 ease-out"
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        className="text-2xl font-bold" fill="#1e293b" style={{ fontSize: size * 0.22 }}>
        {percent}%
      </text>
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function BehaviorTracker() {
  // ─── Connection & Auth state ──────────────────────────
  const [isOnline, setIsOnline] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('tanaka@example.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);

  // ─── App state ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('home');
  const [goals, setGoals] = useState(MOCK_GOALS);
  const [checkins, setCheckins] = useState({});
  const [showCheckinComplete, setShowCheckinComplete] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [feedbacks, setFeedbacks] = useState(MOCK_FEEDBACKS);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showFeedbackRequest, setShowFeedbackRequest] = useState(false);
  const [todayNudge] = useState(NUDGE_MESSAGES[new Date().getDate() % NUDGE_MESSAGES.length]);
  const [newGoal, setNewGoal] = useState({ title: '', category: 'リーダーシップ', frequency: '毎日', period: '8週間' });
  const [checkinMemos, setCheckinMemos] = useState({});
  const [tips, setTips] = useState(MOCK_TIPS);
  const [weeklyData, setWeeklyData] = useState(MOCK_WEEKLY_DATA);
  const [goalChartData, setGoalChartData] = useState(MOCK_GOAL_CHART);
  const [successMemos, setSuccessMemos] = useState(MOCK_MEMOS);
  const [statsOverallRate, setStatsOverallRate] = useState(null);

  const overallRate = statsOverallRate ?? Math.round(goals.reduce((a, g) => a + g.progress, 0) / (goals.length || 1));
  const maxStreak = Math.max(...goals.map(g => g.streak), 0);

  // ─── Initialize: check backend & auth ─────────────────
  useEffect(() => {
    (async () => {
      const online = await api.checkBackend();
      setIsOnline(online);
      if (online && api.getToken()) {
        try {
          const me = await api.getMe();
          setUser(me);
          await loadAllData();
        } catch {
          // token expired
          api.logout();
        }
      }
      setLoading(false);
    })();
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [goalsData, fbData, tipsData, stats] = await Promise.all([
        api.getGoals(),
        api.getFeedback(),
        api.getTips(),
        api.getCheckinStats(),
      ]);
      setGoals(goalsData);
      setFeedbacks(fbData);
      setTips(tipsData);
      if (stats.weeklyRates?.length) setWeeklyData(stats.weeklyRates);
      if (stats.goalStats?.length) {
        setGoalChartData(stats.goalStats.map((g, i) => ({ ...g, fill: CHART_FILLS[i % CHART_FILLS.length] })));
      }
      if (stats.memos?.length) setSuccessMemos(stats.memos);
      if (stats.overallRate != null) setStatsOverallRate(stats.overallRate);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }, []);

  // ─── Auth handlers ────────────────────────────────────
  const handleLogin = async () => {
    setLoginError('');
    try {
      const data = await api.login(loginEmail, loginPassword);
      setUser(data.user);
      setShowLogin(false);
      await loadAllData();
    } catch (e) {
      setLoginError(e.message);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setGoals(MOCK_GOALS);
    setFeedbacks(MOCK_FEEDBACKS);
    setTips(MOCK_TIPS);
    setWeeklyData(MOCK_WEEKLY_DATA);
    setGoalChartData(MOCK_GOAL_CHART);
    setSuccessMemos(MOCK_MEMOS);
    setStatsOverallRate(null);
  };

  const displayUser = user || MOCK_USER;

  // ─── Tab navigation ───────────────────────────────────
  const tabs = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'checkin', label: 'チェックイン', icon: CheckCircle2 },
    { id: 'analysis', label: '分析', icon: BarChart3 },
    { id: 'feedback', label: 'FB', icon: MessageSquare },
    { id: 'tips', label: 'Tips', icon: Lightbulb },
  ];

  // ─── Check-in handlers ────────────────────────────────
  const handleCheckin = (goalId, status) => {
    setCheckins(prev => ({ ...prev, [goalId]: status }));
  };

  const handleCheckinMemo = (goalId, memo) => {
    setCheckinMemos(prev => ({ ...prev, [goalId]: memo }));
  };

  const submitCheckin = async () => {
    if (isOnline && user) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const entries = goals.map(g => ({
          goalId: g.id,
          date: today,
          status: checkins[g.id],
          memo: checkinMemos[g.id] || null,
        }));
        await api.submitCheckins(entries);
        await loadAllData();
      } catch (e) {
        console.error('Checkin submit failed:', e);
      }
    }
    setShowCheckinComplete(true);
    setCheckins({});
    setCheckinMemos({});
    setTimeout(() => setShowCheckinComplete(false), 3000);
  };

  const allCheckedIn = goals.every(g => checkins[g.id]);

  // ─── Goal management ──────────────────────────────────
  const addGoal = async () => {
    if (!newGoal.title.trim()) return;
    if (isOnline && user) {
      try {
        const created = await api.createGoal(newGoal);
        setGoals(prev => [...prev, created]);
      } catch (e) {
        console.error('Goal creation failed:', e);
        return;
      }
    } else {
      setGoals(prev => [...prev, { id: Date.now(), ...newGoal, progress: 0, streak: 0 }]);
    }
    setNewGoal({ title: '', category: 'リーダーシップ', frequency: '毎日', period: '8週間' });
    setShowGoalForm(false);
  };

  const applyTemplate = async (templateName) => {
    const templates = PRESET_TEMPLATES[templateName];
    if (isOnline && user) {
      try {
        const created = await Promise.all(templates.map(t => api.createGoal(t)));
        setGoals(prev => [...prev, ...created]);
      } catch (e) {
        console.error('Template apply failed:', e);
        return;
      }
    } else {
      const newGoals = templates.map((t, i) => ({ id: Date.now() + i, ...t, progress: 0, streak: 0 }));
      setGoals(prev => [...prev, ...newGoals]);
    }
    setShowTemplates(false);
  };

  // ─── Feedback handlers ────────────────────────────────
  const handleLike = async (fbId) => {
    if (isOnline && user) {
      try {
        const result = await api.likeFeedback(fbId);
        setFeedbacks(prev => prev.map(f => f.id === fbId ? { ...f, likes: result.likes } : f));
        return;
      } catch (e) { console.error(e); }
    }
    setFeedbacks(prev => prev.map(f => f.id === fbId ? { ...f, likes: f.likes + 1 } : f));
  };

  const handleReply = async (fbId) => {
    if (!replyText.trim()) return;
    if (isOnline && user) {
      try {
        const reply = await api.replyFeedback(fbId, replyText);
        setFeedbacks(prev => prev.map(f =>
          f.id === fbId ? { ...f, replies: [...f.replies, reply] } : f
        ));
        setReplyText('');
        setReplyingTo(null);
        return;
      } catch (e) { console.error(e); }
    }
    setFeedbacks(prev => prev.map(f =>
      f.id === fbId
        ? { ...f, replies: [...f.replies, { from_name: displayUser.name, message: replyText, created_at: new Date().toISOString().split('T')[0] }] }
        : f
    ));
    setReplyText('');
    setReplyingTo(null);
  };

  const handleFeedbackRequest = async () => {
    if (isOnline && user) {
      try { await api.requestFeedback(); } catch (e) { console.error(e); }
    }
    setShowFeedbackRequest(true);
  };

  // ─── Loading screen ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ─── Login screen ─────────────────────────────────────
  const renderLogin = () => (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[380px] animate-scale-in shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">ログイン</h2>
          <button onClick={() => setShowLogin(false)} className="text-slate-400"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">メールアドレス</label>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="tanaka@example.com" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">パスワード</label>
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="password123"
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {loginError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{loginError}</p>
          )}
          <button onClick={handleLogin}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            ログイン
          </button>
          <p className="text-[10px] text-slate-400 text-center">デモ: tanaka@example.com / password123</p>
        </div>
      </div>
    </div>
  );

  // ─── Render: Home Dashboard ───────────────────────────
  const renderHome = () => (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-200 text-sm">{displayUser.training_name}</p>
            <h2 className="text-xl font-bold mt-1">{displayUser.name}さん</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection indicator */}
            <div className="flex items-center gap-1">
              {isOnline ? <Wifi size={14} className="text-emerald-300" /> : <WifiOff size={14} className="text-blue-300" />}
              <span className="text-[10px] text-blue-200">{isOnline ? (user ? 'API接続中' : 'API利用可能') : 'デモモード'}</span>
            </div>
            <div className="relative">
              <Bell size={22} className="text-blue-200" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">2</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-blue-100 text-sm">研修6週目 ・ 行動定着フェーズ</p>
          {isOnline && !user && (
            <button onClick={() => setShowLogin(true)} className="text-xs bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
              <LogIn size={12} /> ログイン
            </button>
          )}
          {user && (
            <button onClick={handleLogout} className="text-xs bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
              <LogOut size={12} /> ログアウト
            </button>
          )}
        </div>
      </div>

      {/* Progress Ring + Streak */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-5">
        <ProgressRing percent={overallRate} />
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">今週の実践達成率</p>
          <p className="text-2xl font-bold text-slate-800">{overallRate}%</p>
          <div className="flex items-center gap-1.5 mt-2 text-orange-500">
            <Flame size={18} />
            <span className="text-sm font-semibold">{maxStreak}日連続実践中！</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
            <TrendingUp size={16} />
            <span className="text-xs">先週比 +3%</span>
          </div>
        </div>
      </div>

      {/* Nudge message */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 rounded-full p-2 shrink-0 mt-0.5">
            <Sparkles size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-1">今日のナッジ</p>
            <p className="text-sm text-amber-900 leading-relaxed">{todayNudge}</p>
          </div>
        </div>
      </div>

      {/* Goals list */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Target size={18} className="text-blue-600" />
            行動目標
          </h3>
          <button onClick={() => setActiveTab('goals')} className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
            設定 <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {goals.map((goal, i) => (
            <div key={goal.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{goal.progress}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{goal.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColor(goal.category)}`}>{goal.category}</span>
                  <span className="text-[10px] text-slate-400">{goal.frequency}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame size={14} />
                <span className="text-xs font-semibold">{goal.streak}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent feedback */}
      {feedbacks.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-blue-600" />
            最新フィードバック
          </h3>
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center">
                <Users size={14} className="text-blue-700" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{feedbacks[0].from_name}</span>
              <span className="text-[10px] text-slate-400 ml-auto">{feedbacks[0].created_at?.split('T')[0]}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{feedbacks[0].message}</p>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Render: Goal Setting ─────────────────────────────
  const renderGoalSetting = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">行動目標設定</h2>
        <button onClick={() => setActiveTab('home')} className="text-slate-400"><X size={22} /></button>
      </div>

      <div className="space-y-3">
        {goals.map(goal => (
          <div key={goal.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{goal.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColor(goal.category)}`}>{goal.category}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{goal.frequency}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{goal.period}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 ml-3">
                <span className="text-sm font-bold text-blue-600">{goal.progress}%</span>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${goal.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      {goals.length < 5 && (
        <div className="space-y-2">
          <button onClick={() => { setShowGoalForm(true); setShowTemplates(false); }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
            <Plus size={18} /> カスタム目標を追加
          </button>
          <button onClick={() => { setShowTemplates(true); setShowGoalForm(false); }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-600 font-medium text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors">
            <BookOpen size={18} /> テンプレートから選ぶ
          </button>
        </div>
      )}

      {showTemplates && (
        <div className="bg-white rounded-2xl p-4 shadow-sm animate-scale-in">
          <h3 className="font-semibold text-slate-700 mb-3">研修タイプ別テンプレート</h3>
          <div className="space-y-2">
            {Object.keys(PRESET_TEMPLATES).map(name => (
              <button key={name} onClick={() => applyTemplate(name)}
                className="w-full text-left p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors">
                <p className="text-sm font-medium text-slate-800">{name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{PRESET_TEMPLATES[name].length}個の目標セット</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {showGoalForm && (
        <div className="bg-white rounded-2xl p-4 shadow-sm animate-scale-in space-y-3">
          <h3 className="font-semibold text-slate-700">新しい行動目標</h3>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">目標タイトル</label>
            <input type="text" placeholder="例：会議で必ず最初に発言する" value={newGoal.title}
              onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setNewGoal(p => ({ ...p, category: cat }))}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${newGoal.category === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">実践頻度</label>
              <select value={newGoal.frequency} onChange={e => setNewGoal(p => ({ ...p, frequency: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
                {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">期間</label>
              <select value={newGoal.period} onChange={e => setNewGoal(p => ({ ...p, period: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
                {PERIODS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowGoalForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">キャンセル</button>
            <button onClick={addGoal} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">追加する</button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Render: Daily Check-in ───────────────────────────
  const renderCheckin = () => {
    const today = new Date();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${dayNames[today.getDay()]}）`;

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={18} />
            <span className="text-emerald-100 text-sm">{dateStr}</span>
          </div>
          <h2 className="text-lg font-bold">今日のチェックイン</h2>
          <p className="text-emerald-100 text-sm mt-1">各目標の実践状況を記録しましょう</p>
        </div>

        {showCheckinComplete && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center animate-scale-in">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-lg font-bold text-emerald-700">記録完了！</p>
            <p className="text-sm text-emerald-600 mt-1">今日も振り返りお疲れさまでした。</p>
            <p className="text-sm text-emerald-600">小さな積み重ねが大きな成長につながります。</p>
            <div className="flex justify-center gap-1 mt-3">
              {['🌟', '✨', '⭐', '💫', '🌟'].map((e, i) => (
                <span key={i} className="animate-confetti text-xl" style={{ animationDelay: `${i * 0.15}s` }}>{e}</span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {goals.map((goal, idx) => {
            const status = checkins[goal.id];
            return (
              <div key={goal.id} className="bg-white rounded-2xl p-4 shadow-sm animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    status === 'done' ? 'bg-emerald-100' : status === 'skip' ? 'bg-slate-100' : status === 'fail' ? 'bg-red-50' : 'bg-blue-50'
                  }`}>
                    {status === 'done' ? <Check size={16} className="text-emerald-600" />
                      : status === 'skip' ? <Clock size={16} className="text-slate-400" />
                      : status === 'fail' ? <AlertCircle size={16} className="text-red-400" />
                      : <Target size={16} className="text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{goal.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${categoryColor(goal.category)}`}>{goal.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleCheckin(goal.id, 'done')}
                    className={`py-2 rounded-xl text-xs font-medium transition-all ${status === 'done' ? 'bg-emerald-500 text-white shadow-sm scale-105' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    ✅ 実践した
                  </button>
                  <button onClick={() => handleCheckin(goal.id, 'skip')}
                    className={`py-2 rounded-xl text-xs font-medium transition-all ${status === 'skip' ? 'bg-slate-500 text-white shadow-sm scale-105' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    ⏭️ 機会なし
                  </button>
                  <button onClick={() => handleCheckin(goal.id, 'fail')}
                    className={`py-2 rounded-xl text-xs font-medium transition-all ${status === 'fail' ? 'bg-red-400 text-white shadow-sm scale-105' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                    💭 できず
                  </button>
                </div>

                {status === 'done' && (
                  <div className="mt-3 animate-scale-in">
                    <textarea placeholder="どんな場面で実践しましたか？（任意）" value={checkinMemos[goal.id] || ''}
                      onChange={e => handleCheckinMemo(goal.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-xl bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" rows={2} />
                  </div>
                )}

                {status === 'fail' && (
                  <div className="mt-3 animate-scale-in">
                    <textarea placeholder="振り返りメモ（任意）：次はどうすればできそう？" value={checkinMemos[goal.id] || ''}
                      onChange={e => handleCheckinMemo(goal.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-red-200 rounded-xl bg-red-50/50 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" rows={2} />
                    <p className="text-[10px] text-slate-400 mt-1">💡 できなかった日も、振り返ること自体が成長です。</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={submitCheckin} disabled={!allCheckedIn}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${allCheckedIn ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 animate-pulse-gentle' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          {allCheckedIn ? '✨ チェックイン完了！' : `記録してください（残り${goals.filter(g => !checkins[g.id]).length}件）`}
        </button>
      </div>
    );
  };

  // ─── Render: Analysis ─────────────────────────────────
  const renderAnalysis = () => (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold text-slate-800">振り返り・分析</h2>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-600" />
          週次実践率の推移
        </h3>
        <p className="text-xs text-slate-400 mb-3">過去6週間</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(value) => [`${value}%`, '実践率']} />
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-600" />
          目標別達成率
        </h3>
        <p className="text-xs text-slate-400 mb-3">現在の進捗</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={goalChartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(value) => [`${value}%`, '達成率']} />
              <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                {goalChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 shadow-sm border border-blue-100">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Award size={16} className="text-blue-600" />
          今週のサマリー
        </h3>
        <div className="space-y-2">
          <div className="bg-white/70 rounded-xl p-3">
            <p className="text-xs font-semibold text-emerald-600 mb-0.5">🌟 ハイライト</p>
            <p className="text-sm text-slate-700">1on1の達成率が83%と最も高く、安定して実践できています。傾聴スキルも5日連続で実践中！</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-600 mb-0.5">💡 改善ポイント</p>
            <p className="text-sm text-slate-700">アジェンダ共有の達成率が65%と他より低め。急な会議が入った日に実践を忘れる傾向があります。事前準備のタイミングを決めてみましょう。</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Star size={16} className="text-amber-500" />
          実践できた場面メモ
        </h3>
        <p className="text-xs text-slate-400 mb-3">あなたの成功パターンを振り返りましょう</p>
        <div className="space-y-2">
          {successMemos.map((memo, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-slate-400">{memo.date}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColor(memo.category || goals.find(g => g.id === memo.goal_id)?.category || '')}`}>
                  {memo.category || goals.find(g => g.id === memo.goal_id)?.category || ''}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{memo.memo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Render: Feedback ─────────────────────────────────
  const renderFeedback = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">フィードバック</h2>
        <button onClick={handleFeedbackRequest}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1 hover:bg-blue-700 transition-colors">
          <Send size={12} /> FB依頼
        </button>
      </div>

      {showFeedbackRequest && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 animate-scale-in">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2 shrink-0">
              <Send size={16} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">フィードバック依頼を送信しました</p>
              <p className="text-xs text-blue-600 mt-1">鈴木部長、山田トレーナーに通知が送られます。</p>
              <button onClick={() => setShowFeedbackRequest(false)} className="text-xs text-blue-500 mt-2 underline">閉じる</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {feedbacks.map(fb => (
          <div key={fb.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{fb.from_name}</p>
                <p className="text-[10px] text-slate-400">{fb.created_at?.split('T')[0]}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{fb.message}</p>

            {fb.replies?.length > 0 && (
              <div className="ml-6 space-y-2 mb-3">
                {fb.replies.map((r, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">{r.from_name}</span>
                      <span className="text-[10px] text-slate-400">{r.created_at?.split('T')[0]}</span>
                    </div>
                    <p className="text-xs text-slate-600">{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => handleLike(fb.id)} className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors">
                <ThumbsUp size={14} />
                <span className="text-xs">{fb.likes}</span>
              </button>
              <button onClick={() => setReplyingTo(replyingTo === fb.id ? null : fb.id)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors">
                <Reply size={14} />
                <span className="text-xs">返信</span>
              </button>
            </div>

            {replyingTo === fb.id && (
              <div className="mt-3 flex gap-2 animate-scale-in">
                <input type="text" placeholder="返信を入力..." value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onKeyDown={e => e.key === 'Enter' && handleReply(fb.id)} />
                <button onClick={() => handleReply(fb.id)} className="bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Render: Tips ─────────────────────────────────────
  const renderTips = () => (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold text-slate-800">ナッジ・Tips</h2>

      {tips.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 shadow-sm border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amber-200 rounded-full p-1.5">
              <Sparkles size={16} className="text-amber-700" />
            </div>
            <span className="text-xs font-bold text-amber-700">今日のTips</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto ${categoryColor(tips[0].category)}`}>{tips[0].category}</span>
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-2">{tips[0].title}</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{tips[0].content}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Archive size={16} className="text-slate-500" />
          過去のTipsアーカイブ
        </h3>
        <div className="space-y-3">
          {tips.slice(1).map(tip => (
            <details key={tip.id} className="group">
              <summary className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors list-none">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-slate-400">{tip.display_date}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColor(tip.category)}`}>{tip.category}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{tip.title}</p>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="mt-1 p-3 bg-blue-50/50 rounded-xl mx-1">
                <p className="text-sm text-slate-700 leading-relaxed">{tip.content}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'home': return renderHome();
      case 'goals': return renderGoalSetting();
      case 'checkin': return renderCheckin();
      case 'analysis': return renderAnalysis();
      case 'feedback': return renderFeedback();
      case 'tips': return renderTips();
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-[430px] relative pb-20">
        <div className="px-4 pt-4 pb-4">
          {renderContent()}
        </div>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-200 px-2 py-1 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-around">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  </div>
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {showLogin && renderLogin()}
    </div>
  );
}
