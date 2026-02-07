const practiceOptions = [
  {
    title: "呼吸にやさしく戻る",
    description: "3回の深呼吸で、想像力のエネルギーを肯定的に整える。",
    action: "3呼吸を実践",
  },
  {
    title: "感覚のスキャン",
    description: "足先から頭頂まで、心地よい場所を探して意識を置く。",
    action: "身体の光を感じる",
  },
  {
    title: "意図の再宣言",
    description: "今日の意図を静かに唱え、世界線の方向を決め直す。",
    action: "意図を読み上げる",
  },
  {
    title: "調和の一歩",
    description: "誰かへの小さな配慮を選び、未来の自分も満たす。",
    action: "やさしさを実行",
  },
];

const roadmapSteps = [
  "呼吸を3回深くして、注意の軸を整える",
  "今日の意図を短い言葉で置く",
  "身体の心地よさを探し、そこに意識を留める",
  "小さなワクワク行動を選び、今すぐ一歩動く",
  "感謝のひと言で世界線を肯定的に締めくくる",
  "夜のジャーナルで気づきを定着させる",
];

const closingMessages = [
  "私は、やさしい確信をまとって一日を歩んでいる。",
  "今この瞬間の光が、最高の未来へ導いている。",
  "私の注意は、愛と調和に向かっている。",
  "私は軽やかに、自分の世界線を選び続ける。",
];

const themes = [
  {
    theme: "静かな明晰さ",
    focus: "呼吸と感覚",
  },
  {
    theme: "やさしい勇気",
    focus: "心臓の鼓動",
  },
  {
    theme: "柔らかな集中",
    focus: "視線と背骨",
  },
];

const practiceGrid = document.getElementById("practiceGrid");
const roadmap = document.getElementById("roadmap");
const freedomRange = document.getElementById("freedomRange");
const freedomValue = document.getElementById("freedomValue");
const freedomMessage = document.getElementById("freedomMessage");
const intentInput = document.getElementById("intentInput");
const intentStatus = document.getElementById("intentStatus");
const journalInput = document.getElementById("journalInput");
const journalStatus = document.getElementById("journalStatus");
const closingMessage = document.getElementById("closingMessage");
const themeText = document.getElementById("themeText");
const focusText = document.getElementById("focusText");

const storedIntent = localStorage.getItem("hikari-intent");
if (storedIntent) {
  intentInput.value = storedIntent;
  intentStatus.textContent = "保存済み: 意図が設定されています";
}

const storedJournal = localStorage.getItem("hikari-journal");
if (storedJournal) {
  journalInput.value = storedJournal;
  journalStatus.textContent = "保存済み: 最新の気づきが残っています";
}

practiceOptions.forEach((practice) => {
  const card = document.createElement("div");
  card.className = "practice-card";
  card.innerHTML = `
    <h3>${practice.title}</h3>
    <p>${practice.description}</p>
    <button type="button">${practice.action}</button>
  `;
  const button = card.querySelector("button");
  button.addEventListener("click", () => {
    alert(`今すぐ実践: ${practice.title}`);
  });
  practiceGrid.appendChild(card);
});

roadmapSteps.forEach((step, index) => {
  const item = document.createElement("li");
  item.innerHTML = `<span>${index + 1}</span><p>${step}</p>`;
  roadmap.appendChild(item);
});

const updateFreedom = () => {
  const value = Number(freedomRange.value);
  freedomValue.textContent = `${value}%`;
  if (value > 80) {
    freedomMessage.textContent = "かなり開いています。意図をやさしく保持しましょう。";
  } else if (value > 50) {
    freedomMessage.textContent = "十分に開いています。静けさの中で光を保ちましょう。";
  } else {
    freedomMessage.textContent = "呼吸を深くし、身体感覚に優しく戻っていきましょう。";
  }
};

freedomRange.addEventListener("input", updateFreedom);
updateFreedom();

const saveIntent = document.getElementById("saveIntent");
saveIntent.addEventListener("click", () => {
  const value = intentInput.value.trim();
  if (!value) {
    intentStatus.textContent = "意図が空です。言葉にして入力してください。";
    return;
  }
  localStorage.setItem("hikari-intent", value);
  intentStatus.textContent = "保存しました。意図が確定しています。";
});

const saveJournal = document.getElementById("saveJournal");
saveJournal.addEventListener("click", () => {
  const value = journalInput.value.trim();
  if (!value) {
    journalStatus.textContent = "まだ内容がありません。";
    return;
  }
  localStorage.setItem("hikari-journal", value);
  journalStatus.textContent = "保存しました。気づきが定着しました。";
});

const startJourney = document.getElementById("startJourney");
startJourney.addEventListener("click", () => {
  document.getElementById("intentPanel").scrollIntoView({ behavior: "smooth" });
});

const openGuide = document.getElementById("openGuide");
openGuide.addEventListener("click", () => {
  document.getElementById("guidePanel").scrollIntoView({ behavior: "smooth" });
});

const refreshMessage = document.getElementById("refreshMessage");
refreshMessage.addEventListener("click", () => {
  const pick = closingMessages[Math.floor(Math.random() * closingMessages.length)];
  closingMessage.textContent = `「${pick}」`;
});

const pickTheme = () => {
  const selected = themes[Math.floor(Math.random() * themes.length)];
  themeText.textContent = selected.theme;
  focusText.textContent = selected.focus;
};

pickTheme();
