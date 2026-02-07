const practiceOptions = [
  {
    title: "トランサーフィン: 意図のリフレーミング",
    description: "望む世界線を細部まで可視化し、外側の現象に反応しない練習。",
    action: "意図をもう一度読み上げる",
  },
  {
    title: "チョプラ: 静寂のリセット",
    description: "90秒の沈黙と深呼吸で、内側の静けさを更新する。",
    action: "90秒瞑想を開始",
  },
  {
    title: "エックハルト・トール: 今ここチェック",
    description: "身体感覚に意識を戻し、思考の物語から離れる。",
    action: "身体スキャンを実行",
  },
  {
    title: "サドグル: 意識的な行動",
    description: "奉仕的な行動を一つ選び、世界との調和を強化する。",
    action: "奉仕アクションを決める",
  },
];

const roadmapSteps = [
  "朝一番に意図スイッチを入れ、今日の世界線を選ぶ",
  "5分の静寂で身体・呼吸・心拍を整える",
  "現実の変化より内側の波動に集中する",
  "夕方に感謝と奉仕の行動を1つ実践する",
  "夜のジャーナルで気づきを固定し、次の意図へつなげる",
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

const storedIntent = localStorage.getItem("parallel-intent");
if (storedIntent) {
  intentInput.value = storedIntent;
  intentStatus.textContent = "保存済み: 意図が設定されています";
}

const storedJournal = localStorage.getItem("parallel-journal");
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
    freedomMessage.textContent = "かなり開いています。意図を静かに保持しましょう。";
  } else if (value > 50) {
    freedomMessage.textContent = "十分に開いています。意識の余白をさらに広げてみましょう。";
  } else {
    freedomMessage.textContent = "呼吸を深くし、身体感覚をゆっくり取り戻していきましょう。";
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
  localStorage.setItem("parallel-intent", value);
  intentStatus.textContent = "保存しました。意図が確定しています。";
});

const saveJournal = document.getElementById("saveJournal");
saveJournal.addEventListener("click", () => {
  const value = journalInput.value.trim();
  if (!value) {
    journalStatus.textContent = "まだ内容がありません。";
    return;
  }
  localStorage.setItem("parallel-journal", value);
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
