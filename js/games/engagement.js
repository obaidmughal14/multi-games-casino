"use strict";
/* ================= fair engagement: bonus, missions, levels, best wins =================
       None of this touches any game outcome or odds. It only rewards showing
       up and playing rounds, and every reward is fun credits. */
function todayStr() {
  var d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
/* ENG_KEY, BEST_KEY and SEEN_KEY are set by the profiles bootstrap near
       the top of this script: Guest uses the original mgc_engage_v1,
       mgc_best_v1 and mgc_seen_v1 keys, a profile uses its own keys. */
var eng = { day: todayStr(), rounds: 0, games: {}, won: false, claimed: {}, bonusDay: "" };
try {
  var savedEng = JSON.parse(store.get(ENG_KEY) || "null");
  if (savedEng) {
    if (savedEng.day === todayStr()) eng = savedEng;
    else eng.bonusDay = savedEng.bonusDay || "";
  }
} catch (e) {}
function saveEng() {
  try {
    store.set(ENG_KEY, JSON.stringify(eng));
  } catch (e) {}
}
var seenGames = {};
try {
  seenGames = JSON.parse(store.get(SEEN_KEY) || "{}") || {};
} catch (e) {
  seenGames = {};
}
var bestWins = [];
try {
  var sb = JSON.parse(store.get(BEST_KEY) || "[]");
  if (Array.isArray(sb)) bestWins = sb;
} catch (e) {
  bestWins = [];
}
function recordBest(amt, game) {
  bestWins.push({ amt: Math.floor(amt), game: game });
  bestWins.sort(function (a, b) {
    return b.amt - a.amt;
  });
  bestWins = bestWins.slice(0, 6);
  try {
    store.set(BEST_KEY, JSON.stringify(bestWins));
  } catch (e) {}
  if (currentScreen === "scr-lobby") renderEngage();
}
function trackEngage(gameId, wagered, paid) {
  if (eng.day !== todayStr()) {
    var bd = eng.bonusDay;
    eng = { day: todayStr(), rounds: 0, games: {}, won: false, claimed: {}, bonusDay: bd };
  }
  eng.rounds += 1;
  eng.games[gameId] = true;
  if (paid > wagered) eng.won = true;
  seenGames[gameId] = true;
  try {
    store.set(SEEN_KEY, JSON.stringify(seenGames));
  } catch (e) {}
  saveEng();
  if (currentScreen === "scr-lobby") renderEngage();
}
var MISSIONS = [
  {
    btn: "m1Btn",
    prog: "m1Prog",
    reward: 200,
    goal: 5,
    get: function () {
      return Math.min(5, eng.rounds);
    },
  },
  {
    btn: "m2Btn",
    prog: "m2Prog",
    reward: 300,
    goal: 3,
    get: function () {
      return Math.min(3, Object.keys(eng.games).length);
    },
  },
  {
    btn: "m3Btn",
    prog: "m3Prog",
    reward: 250,
    goal: 1,
    get: function () {
      return eng.won ? 1 : 0;
    },
  },
];
function renderEngage() {
  var bBtn = $("#bonusBtn");
  if (!bBtn) return;
  var claimedBonus = eng.bonusDay === todayStr();
  bBtn.disabled = claimedBonus;
  bBtn.textContent = claimedBonus ? "Bonus claimed today" : "Claim 1,000 bonus";
  $("#bonusStatus").textContent = claimedBonus
    ? "Today's 1,000 fun credit bonus is claimed. A fresh one unlocks tomorrow."
    : "Claim 1,000 free fun credits once a day, just for visiting the lobby.";
  MISSIONS.forEach(function (m, i) {
    var key = "m" + (i + 1);
    var done = m.get() >= m.goal,
      claimed = !!eng.claimed[key];
    $("#" + m.prog).textContent = m.get() + " / " + m.goal;
    var btn = $("#" + m.btn);
    btn.disabled = !done || claimed;
    btn.textContent = claimed ? "Claimed" : "Claim " + m.reward;
  });
  var totalRounds = playerStats.rounds;
  var lvl = 1 + Math.floor(totalRounds / 25);
  var into = totalRounds % 25;
  $("#lvlNum").textContent = lvl;
  $("#lvlRounds").textContent = fmt(totalRounds);
  $("#lvlBar").style.width = (into / 25) * 100 + "%";
  $("#lvlNext").textContent = 25 - into + " rounds to level " + (lvl + 1);
  var seenCount = Object.keys(seenGames).length;
  var badges = [
    ["First rounds", totalRounds >= 1],
    ["Regular - 25 rounds", totalRounds >= 25],
    ["High roller - 100 rounds", totalRounds >= 100],
    ["Explorer - 6 games tried", seenCount >= 6],
    ["Played them all - 12 games tried", seenCount >= 12],
    ["Big winner - a 5,000+ win", bestWins.length > 0 && bestWins[0].amt >= 5000],
  ];
  $("#badgeRow").innerHTML = badges
    .map(function (b) {
      return '<span class="badge' + (b[1] ? " got" : "") + '">' + b[0] + "</span>";
    })
    .join("");
  $("#bestList").innerHTML = bestWins.length
    ? bestWins
        .map(function (w) {
          return "<li><b>" + fmt(w.amt) + "</b> fun credits on " + w.game + "</li>";
        })
        .join("")
    : "<li>No wins recorded yet - your biggest wins will appear here.</li>";
}
$("#bonusBtn").addEventListener("click", function () {
  if (eng.bonusDay === todayStr()) return;
  eng.bonusDay = todayStr();
  saveEng();
  addBal(1000);
  renderBal(true);
  sfx.coin();
  showToast("Daily bonus: <b>+1,000</b> fun credits added");
  renderEngage();
});
MISSIONS.forEach(function (m, i) {
  var key = "m" + (i + 1);
  $("#" + m.btn).addEventListener("click", function () {
    if (eng.claimed[key] || m.get() < m.goal) return;
    eng.claimed[key] = true;
    saveEng();
    addBal(m.reward);
    renderBal(true);
    sfx.coin();
    showToast("Mission complete: <b>+" + fmt(m.reward) + "</b> fun credits");
    renderEngage();
  });
});
/* session note: plain time played, no pressure, no countdown */
var sessStart = Date.now();
function renderSess() {
  var mins = Math.floor((Date.now() - sessStart) / 60000);
  var el = $("#sessTime");
  if (!el) return;
  if (mins < 1) el.textContent = "under 1 min";
  else if (mins < 60) el.textContent = mins + " min";
  else el.textContent = Math.floor(mins / 60) + " h " + (mins % 60) + " min";
}
setInterval(renderSess, 15000);
renderSess();
renderEngage();

