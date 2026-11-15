"use strict";
/* ================= messages, win banner, win feed ================= */
function setMsg(id, text, kind) {
  var m = document.getElementById(id);
  if (!m) return;
  m.textContent = text;
  m.className = "msg " + (kind || "info");
}
function countUp(el, from, to, dur, prefix) {
  if (!el) return;
  var t0 = performance.now();
  function step(t) {
    var p = Math.min(1, (t - t0) / (dur || 700));
    var e = 1 - Math.pow(1 - p, 3);
    el.textContent = (prefix || "") + fmt(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
var toastTimer = 0;
function showToast(html) {
  var t = $("#winToast");
  t.innerHTML = html;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    t.classList.remove("show");
  }, 2400);
}
function burstCoins(stageEl) {
  if (!stageEl) return;
  var colors = 14;
  for (var i = 0; i < colors; i++) {
    var s = document.createElement("span");
    s.className = "burstcoin";
    s.style.left = "50%";
    s.style.top = "46%";
    var ang = (i / colors) * Math.PI * 2 + Math.random() * 0.4;
    var dist = 90 + Math.random() * 150;
    s.style.setProperty("--bx", Math.cos(ang) * dist + "px");
    s.style.setProperty("--by", Math.sin(ang) * dist - 40 + "px");
    s.style.animationDelay = Math.random() * 0.12 + "s";
    stageEl.appendChild(s);
    (function (el) {
      setTimeout(function () {
        el.remove();
      }, 1400);
    })(s);
  }
}
function confettiIn(container) {
  if (!container) return;
  var cols = ["#f5c542", "#19e3c2", "#ff4757", "#8e6bf1", "#ffe082", "#2ed573"];
  for (var i = 0; i < 30; i++) {
    var s = document.createElement("span");
    s.className = "confetto";
    s.style.left = Math.random() * 100 + "%";
    s.style.background = cols[i % cols.length];
    s.style.animationDuration = 0.8 + Math.random() * 0.9 + "s";
    s.style.animationDelay = Math.random() * 0.35 + "s";
    container.appendChild(s);
    (function (el) {
      setTimeout(function () {
        el.remove();
      }, 2400);
    })(s);
  }
}
var popScreen = "scr-lobby";
var POP_AGAIN = {
  "scr-fruit": "fruitSpin",
  "scr-golden": "goldenSpin",
  "scr-lucky7": "lucky7Spin",
  "scr-roulette": "rSpin",
  "scr-blackjack": "bjDeal",
  "scr-mines": "mnStart",
  "scr-crash": "crLaunch",
  "scr-wheel": "whSpin",
  "scr-fishing": "fishStart",
  "scr-bingo": "bingoStart",
  "scr-dice": "diceRoll",
  "scr-baccarat": "baccDeal",
  "scr-poker": "pokerDeal",
  "scr-plinko": "plinkoDrop",
  "scr-keno": "kenoDraw",
  "scr-scratch": "scratchNew",
  "scr-gemrush": "gemSpin",
  "scr-hilo": "hiloStart",
  "scr-sicbo": "sicRoll",
  "scr-dragon": "dragDeal",
  "scr-teenpatti": "tpDeal",
  "scr-tower": "towerStart",
  "scr-limbo": "limboRoll",
  "scr-andar": "andarDeal",
  "scr-ocean": "oceanSpin",
  "scr-pharaoh": "pharSpin",
  "scr-cluster": "clusSpin",
  "scr-carib": "carDeal",
  "scr-tcp": "tcpDeal",
  "scr-war": "warDeal",
  "scr-craps": "crpRoll",
  "scr-dicepoker": "dpRoll",
  "scr-balloon": "bloStart",
  "scr-chicken": "chkStart",
  "scr-penalty": "penStart",
  "scr-racing": "raceStart",
  "scr-lottery": "lotDraw",
  "scr-speedbingo": "sbStart",
  "scr-coinflip": "cfStart",
  "scr-jungle": "jungleSpin",
  "scr-candy": "candySpin",
  "scr-space": "spaceSpin",
  "scr-lantern": "lanternSpin",
  "scr-pirate": "pirateSpin",
  "scr-diamond": "diamondSpin",
  "scr-west": "westSpin",
  "scr-pontoon": "pontoonDeal",
  "scr-reddog": "reddogDeal",
  "scr-fourcard": "fourcardDeal",
  "scr-muflis": "muflisDeal",
  "scr-chuck": "chuckRoll",
  "scr-diceduel": "diceduelRoll",
  "scr-miniroul": "miniroulSpin",
  "scr-letitride": "letitrideStart",
  "scr-fivefrenzy": "fivefrenzyDeal",
  "scr-crown": "crownRoll",
  "scr-pyramid": "pyramidStart",
  "scr-jetpack": "jetpackLaunch",
  "scr-doublewheel": "doublewheelSpin",
  "scr-dartboard": "dartboardThrow",
  "scr-ringtoss": "ringtossThrow",
  "scr-coinpusher": "coinpusherDrop",
  "scr-memory": "memoryStart",
  "scr-patternbingo": "patternbingoStart",
  "scr-powerkeno": "powerkenoDraw",
  "scr-goldscratch": "goldscratchNew",
  "scr-dailydraw": "dailydrawDraw",
  "scr-deepsea": "deepseaStart",
  "scr-vfootball": "vfootballPlay",
  "scr-moon": "moonSpin",
  "scr-aztec": "aztecSpin",
  "scr-viking": "vikingSpin",
  "scr-blossom": "blossomSpin",
  "scr-neon": "neonSpin",
  "scr-dragonf": "dragonfSpin",
  "scr-oasis2": "oasis2Spin",
  "scr-winter": "winterSpin",
  "scr-hollywood": "hollywoodSpin",
  "scr-treasure": "treasureSpin",
  "scr-sp21": "sp21Play",
  "scr-dblexp": "dblexpPlay",
  "scr-deuces": "deucesPlay",
  "scr-bonuspoker": "bonuspokerPlay",
  "scr-tensbetter": "tensbetterPlay",
  "scr-paigow": "paigowPlay",
  "scr-miss": "missPlay",
  "scr-ultimate": "ultimatePlay",
  "scr-omaha": "omahaPlay",
  "scr-badugi": "badugiPlay",
  "scr-stud": "studPlay",
  "scr-drawpoker": "drawpokerPlay",
  "scr-lowball": "lowballPlay",
  "scr-headsup": "headsupPlay",
  "scr-farkle": "farklePlay",
  "scr-dicecombo": "dicecomboPlay",
  "scr-hazard": "hazardPlay",
  "scr-underover": "underoverPlay",
  "scr-liars": "liarsPlay",
  "scr-bigsix": "bigsixPlay",
  "scr-amroul": "amroulPlay",
  "scr-frroul": "frroulPlay",
  "scr-rollandwin": "rollandwinPlay",
  "scr-chuckduel": "chuckduelPlay",
  "scr-train": "trainPlay",
  "scr-gemhunt": "gemhuntPlay",
  "scr-stairdice": "stairdicePlay",
  "scr-balloonpop": "balloonpopPlay",
  "scr-fishpro": "fishproPlay",
  "scr-sharkhook": "sharkhookPlay",
  "scr-bingo90": "bingo90Play",
  "scr-kenodeluxe": "kenodeluxePlay",
  "scr-scratchking": "scratchkingPlay",
  "scr-instantwin": "instantwinPlay",
  "scr-vcricket": "vcricketPlay",
  "scr-bball": "bballPlay",
  "scr-golf": "golfPlay",
  "scr-tennis": "tennisPlay",
  "scr-cointower": "cointowerPlay",
  "scr-vault": "vaultPlay",
};
function openWinPop(title, amount, multText) {
  var pop = $("#winPop");
  $("#winPopTitle").textContent = title;
  $("#winPopSub").innerHTML = multText
    ? "Payout <b>" + multText + "</b> - balance is already updated"
    : "Your balance is already updated";
  pop.hidden = false;
  countUp($("#winPopAmt"), 0, amount, 800, "+");
  confettiIn($("#winPopCard"));
}
function closeWinPop() {
  $("#winPop").hidden = true;
}
$("#winPopClose").addEventListener("click", function () {
  sfx.click();
  closeWinPop();
});
$("#winPopLobby").addEventListener("click", function () {
  sfx.click();
  closeWinPop();
  showScreen("scr-lobby");
});
$("#winPopAgain").addEventListener("click", function () {
  sfx.click();
  closeWinPop();
  var btn = document.getElementById(POP_AGAIN[popScreen] || "");
  if (btn && !btn.disabled) btn.click();
});
function showWinBanner(screenEl, title, amount, big, multText) {
  var b = $(".winbanner", screenEl);
  if (!b) return;
  $(".wb-t", b).textContent = title;
  b.classList.toggle("big", !!big);
  b.classList.add("show");
  countUp($(".wb-a", b), 0, amount, big ? 900 : 550, "+");
  var stage = $(".stage", screenEl) || screenEl;
  burstCoins(stage);
  if (big) {
    popScreen = screenEl.id;
    openWinPop(title, amount, multText);
  } else if (amount > 0) {
    showToast("You won <b>+" + fmt(amount) + "</b> fun credits");
  }
  setTimeout(
    function () {
      b.classList.remove("show");
    },
    big ? 2600 : 1700,
  );
}
var winFeed = [];
function buildFeed() {
  var names = [
    "Ayesha K.",
    "Marco R.",
    "Priya S.",
    "Dan W.",
    "Lena M.",
    "Omar F.",
    "Sofia T.",
    "Kenji A.",
    "Ruth B.",
    "Igor P.",
    "Mia C.",
    "Leo D.",
  ];
  var games = [
    "Fruit Fortune Slots",
    "Golden Coins Slots",
    "Roulette",
    "Blackjack",
    "Mines",
    "Rocket Crash",
    "Lucky Wheel",
    "Lucky 7s Classic",
    "Fishing Frenzy",
    "Bingo Blitz",
    "Dice High-Low",
    "Baccarat",
    "Video Poker",
    "Plinko",
    "Keno",
    "Lucky Scratch",
    "Gem Rush Slots",
    "Hi-Lo Cards",
    "Sic Bo",
    "Dragon Tiger",
    "Teen Patti Showdown",
    "Tower Climb",
    "Limbo",
    "Andar Bahar",
    "Ocean Treasure Slots",
    "Pharaoh Gold Slots",
    "Cluster Fruits",
    "Caribbean Stud Poker",
    "Three Card Poker",
    "Casino War",
    "Craps Lite",
    "Dice Poker",
    "Balloon Blast",
    "Chicken Cross",
    "Penalty Shootout",
    "Horse Racing",
    "Lucky Lottery",
    "Speed Bingo",
    "Coin Flip Streak",
    "Jungle Safari Slots",
    "Candy Dream Slots",
    "Space Adventure Slots",
    "Lucky Lantern Slots",
    "Pirate Gold Slots",
    "Diamond Deluxe Slots",
    "Wild West Slots",
    "Pontoon",
    "Red Dog Poker",
    "Four Card Poker",
    "Muflis Showdown",
    "Chuck-a-Luck",
    "Dice Duel",
    "Mini Roulette",
    "Let It Ride Lite",
    "Five Card Frenzy",
    "Crown and Anchor",
    "Pyramid Climb",
    "Jetpack Climb",
    "Double Wheel",
    "Dart Board",
    "Ring Toss",
    "Coin Pusher Lite",
    "Memory Match",
    "Pattern Bingo",
    "Power Keno",
    "Gold Rush Scratch",
    "Daily Draw",
    "Deep Sea Catch",
    "Virtual Football",
  ];
  winFeed = [];
  for (var i = 0; i < 10; i++) {
    winFeed.push({
      who: names[Math.floor(Math.random() * names.length)],
      amt: 150 + Math.floor(Math.random() * 240) * 25,
      game: games[Math.floor(Math.random() * games.length)],
    });
  }
  renderFeed();
}
function renderFeed() {
  var html = winFeed
    .map(function (w) {
      return "<span><b>" + w.who + "</b> won <b>" + fmt(w.amt) + "</b> on " + w.game + "</span>";
    })
    .join("");
  $("#winsTrack").innerHTML = html + html;
}
function pushWin(who, amt, game) {
  if (who === "You" && amt > 0 && typeof recordBest === "function") recordBest(amt, game);
  winFeed.unshift({ who: who, amt: amt, game: game });
  if (winFeed.length > 14) winFeed.pop();
  renderFeed();
}
buildFeed();

