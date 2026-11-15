"use strict";
/* ================= house stats (fun credits only, this browser) =================
       Honest maths model: every game uses fair random outcomes and a fixed
       pay table, so the house edge only shows over thousands of rounds.
       Nothing here reads the balance, streaks or past results, and no
       outcome is ever adjusted - these counters only record what happened. */
var STATS_KEY = "mgc_stats_v1";
var STAT_GAMES = [
  ["fruit", "Fruit Fortune Slots"],
  ["golden", "Golden Coins Slots"],
  ["lucky7", "Lucky 7s Classic"],
  ["roulette", "Roulette"],
  ["blackjack", "Blackjack"],
  ["mines", "Mines"],
  ["crash", "Rocket Crash"],
  ["wheel", "Lucky Wheel"],
  ["fishing", "Fishing Frenzy"],
  ["bingo", "Bingo Blitz"],
  ["dice", "Dice High-Low"],
  ["baccarat", "Baccarat"],
  ["poker", "Video Poker"],
  ["plinko", "Plinko"],
  ["keno", "Keno"],
  ["scratch", "Lucky Scratch"],
  ["gemrush", "Gem Rush Slots"],
  ["hilo", "Hi-Lo Cards"],
  ["sicbo", "Sic Bo"],
  ["dragon", "Dragon Tiger"],
  ["teenpatti", "Teen Patti Showdown"],
  ["tower", "Tower Climb"],
  ["limbo", "Limbo"],
  ["andar", "Andar Bahar"],
  ["ocean", "Ocean Treasure Slots"],
  ["pharaoh", "Pharaoh Gold Slots"],
  ["cluster", "Cluster Fruits"],
  ["carib", "Caribbean Stud Poker"],
  ["tcp", "Three Card Poker"],
  ["war", "Casino War"],
  ["craps", "Craps Lite"],
  ["dicepoker", "Dice Poker"],
  ["balloon", "Balloon Blast"],
  ["chicken", "Chicken Cross"],
  ["penalty", "Penalty Shootout"],
  ["racing", "Horse Racing"],
  ["lottery", "Lucky Lottery"],
  ["speedbingo", "Speed Bingo"],
  ["coinflip", "Coin Flip Streak"],
  ["jungle", "Jungle Safari Slots"],
  ["candy", "Candy Dream Slots"],
  ["space", "Space Adventure Slots"],
  ["lantern", "Lucky Lantern Slots"],
  ["pirate", "Pirate Gold Slots"],
  ["diamond", "Diamond Deluxe Slots"],
  ["west", "Wild West Slots"],
  ["pontoon", "Pontoon"],
  ["reddog", "Red Dog Poker"],
  ["fourcard", "Four Card Poker"],
  ["muflis", "Muflis Showdown"],
  ["chuck", "Chuck-a-Luck"],
  ["diceduel", "Dice Duel"],
  ["miniroul", "Mini Roulette"],
  ["letitride", "Let It Ride Lite"],
  ["fivefrenzy", "Five Card Frenzy"],
  ["crown", "Crown and Anchor"],
  ["pyramid", "Pyramid Climb"],
  ["jetpack", "Jetpack Climb"],
  ["doublewheel", "Double Wheel"],
  ["dartboard", "Dart Board"],
  ["ringtoss", "Ring Toss"],
  ["coinpusher", "Coin Pusher Lite"],
  ["memory", "Memory Match"],
  ["patternbingo", "Pattern Bingo"],
  ["powerkeno", "Power Keno"],
  ["goldscratch", "Gold Rush Scratch"],
  ["dailydraw", "Daily Draw"],
  ["deepsea", "Deep Sea Catch"],
  ["vfootball", "Virtual Football"],
  ["moon", "Mystic Moon Slots"],
  ["aztec", "Aztec Gold Slots"],
  ["viking", "Viking Quest Slots"],
  ["blossom", "Cherry Blossom Slots"],
  ["neon", "Neon Nights Slots"],
  ["dragonf", "Dragon Fortune Slots"],
  ["oasis2", "Desert Oasis Slots"],
  ["winter", "Winter Wonder Slots"],
  ["hollywood", "Hollywood Star Slots"],
  ["treasure", "Treasure Map Slots"],
  ["sp21", "Spanish 21 Lite"],
  ["dblexp", "Double Exposure Blackjack"],
  ["deuces", "Deuces Wild Video Poker"],
  ["bonuspoker", "Bonus Poker Video"],
  ["tensbetter", "Tens or Better Video Poker"],
  ["paigow", "Pai Gow Lite"],
  ["miss", "Mississippi Stud Lite"],
  ["ultimate", "Ultimate Hold'em Lite"],
  ["omaha", "Omaha Showdown"],
  ["badugi", "Badugi Lite"],
  ["stud", "Seven Card Stud Lite"],
  ["drawpoker", "Draw Poker Showdown"],
  ["lowball", "Lowball Showdown"],
  ["headsup", "Heads-Up Poker Duel"],
  ["farkle", "Farkle Lite"],
  ["dicecombo", "Dice Combinations"],
  ["hazard", "Hazard Dice"],
  ["underover", "Under Over 7"],
  ["liars", "Liar's Dice Lite"],
  ["bigsix", "Big Six Wheel"],
  ["amroul", "American Roulette"],
  ["frroul", "French Roulette"],
  ["rollandwin", "Roll and Win"],
  ["chuckduel", "Chuck Dice Duel"],
  ["train", "Train Rush"],
  ["gemhunt", "Gem Hunt Grid"],
  ["stairdice", "Stairway Dice Climb"],
  ["balloonpop", "Balloon Pop Frenzy"],
  ["fishpro", "Fish Hunter Pro"],
  ["sharkhook", "Shark Hook"],
  ["bingo90", "90 Ball Bingo"],
  ["kenodeluxe", "Keno Deluxe"],
  ["scratchking", "Scratch King"],
  ["instantwin", "Instant Win Cards"],
  ["vcricket", "Virtual Cricket"],
  ["bball", "Basketball Shootout"],
  ["golf", "Golf Putt Challenge"],
  ["tennis", "Tennis Tiebreak"],
  ["cointower", "Coin Tower"],
  ["vault", "Prize Vault"],
];
function blankStats() {
  var s = { wagered: 0, paid: 0, rounds: 0, games: {} };
  STAT_GAMES.forEach(function (g) {
    s.games[g[0]] = { r: 0, w: 0, p: 0 };
  });
  return s;
}
var houseStats = blankStats();
try {
  var savedStats = JSON.parse(store.get(STATS_KEY) || "null");
  if (savedStats && typeof savedStats.wagered === "number" && savedStats.games) {
    houseStats = savedStats;
    STAT_GAMES.forEach(function (g) {
      if (!houseStats.games[g[0]]) houseStats.games[g[0]] = { r: 0, w: 0, p: 0 };
    });
  }
} catch (e) {
  houseStats = blankStats();
}
function renderStats() {
  $("#stWagered").textContent = fmt(houseStats.wagered);
  $("#stPaid").textContent = fmt(houseStats.paid);
  $("#stHold").textContent = fmt(houseStats.wagered - houseStats.paid);
  $("#stRounds").textContent = fmt(houseStats.rounds);
  $("#stRtp").textContent =
    houseStats.wagered > 0 ? ((houseStats.paid / houseStats.wagered) * 100).toFixed(1) + "%" : "-";
  $("#stGames").innerHTML = STAT_GAMES.map(function (g) {
    var s = houseStats.games[g[0]] || { r: 0, w: 0, p: 0 };
    var rtp = s.w > 0 ? ((s.p / s.w) * 100).toFixed(1) + "%" : "-";
    return (
      "<tr><td>" +
      g[1] +
      "</td><td>" +
      fmt(s.r) +
      "</td><td>" +
      fmt(s.w) +
      "</td><td>" +
      fmt(s.p) +
      "</td><td>" +
      rtp +
      "</td></tr>"
    );
  }).join("");
}
function recordRound(gameId, wagered, paid) {
  wagered = Math.max(0, Math.floor(wagered || 0));
  paid = Math.max(0, Math.floor(paid || 0));
  houseStats.wagered += wagered;
  houseStats.paid += paid;
  houseStats.rounds += 1;
  var g = houseStats.games[gameId];
  if (!g) {
    g = { r: 0, w: 0, p: 0 };
    houseStats.games[gameId] = g;
  }
  g.r += 1;
  g.w += wagered;
  g.p += paid;
  store.set(STATS_KEY, JSON.stringify(houseStats));
  playerStats.rounds += 1;
  savePStats();
  if (currentScreen === "scr-lobby") renderStats();
  if (typeof trackEngage === "function") trackEngage(gameId, wagered, paid);
}
$("#statsReset").addEventListener("click", function () {
  houseStats = blankStats();
  store.set(STATS_KEY, JSON.stringify(houseStats));
  playerStats = { rounds: 0 };
  savePStats();
  renderStats();
  if (typeof renderEngage === "function") renderEngage();
  sfx.click();
  showToast("House stats reset - counters start again from zero");
});
$("#statsToggle").addEventListener("click", function () {
  var w = $("#stGamesWrap");
  var open = w.hidden;
  w.hidden = !open;
  this.textContent = open ? "Hide game-by-game stats" : "Show game-by-game stats";
  this.setAttribute("aria-expanded", open ? "true" : "false");
  sfx.click();
});
renderStats();
/* per-game recent rounds history (this session) */
function logHist(id, html) {
  var box = document.getElementById("hist-" + id);
  if (!box) return;
  if (box.hidden) {
    box.hidden = false;
    box.innerHTML = '<div class="histlbl">Your recent rounds</div>';
  }
  var d = document.createElement("div");
  d.className = "hent";
  d.innerHTML = html;
  var lbl = box.firstChild;
  box.insertBefore(d, lbl ? lbl.nextSibling : null);
  while (box.children.length > 6) box.removeChild(box.lastChild);
}
function histLine(bet, ret) {
  if (ret > bet)
    return "Bet <b>" + fmt(bet) + '</b> - <span class="hw">won ' + fmt(ret) + "</span>";
  if (ret === bet && bet > 0) return "Bet <b>" + fmt(bet) + "</b> - push, bet returned";
  if (ret > 0)
    return "Bet <b>" + fmt(bet) + '</b> - got back <span class="hw">' + fmt(ret) + "</span>";
  return "Bet <b>" + fmt(bet) + '</b> - <span class="hl">lost</span>';
}

