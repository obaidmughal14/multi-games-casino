"use strict";
/* ================= 49. Four Card Poker ================= */
nxEl("fourcardDeal").addEventListener("click", function () {
  var ante = readBet(nxEl("fourcardBet"));
  if (ante === null) return;
  var side = nxEl("fourcardSide").value === "1" ? ante : 0;
  if (ante + side > bal) {
    setMsg(
      "fourcardMsg",
      "Ante plus the Aces Up side bet is higher than your balance. Lower the ante or turn the side bet off.",
      "lose",
    );
    return;
  }
  addBal(-(ante + side));
  var deck = bjDeck();
  var comm = deck.pop();
  var ph = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), comm];
  var dh = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), comm];
  nxEl("fourcardPHand").innerHTML = nxHandHTML(ph);
  nxEl("fourcardDHand").innerHTML = nxHandHTML(dh);
  sfx.deal();
  var pe = nxBest4(ph),
    de = nxBest4(dh);
  var cmp = pe.cat - de.cat;
  if (cmp === 0)
    for (var i = 0; i < 4; i++) {
      var d = (pe.key[i] || 0) - (de.key[i] || 0);
      if (d) {
        cmp = d;
        break;
      }
    }
  var anteRes = cmp > 0 ? ante * 2 : cmp === 0 ? ante : 0;
  var ACESUP = { 7: 25, 6: 20, 5: 4, 4: 3, 3: 2, 2: 1.5 };
  var sideRes = 0,
    sideNote = "";
  if (side > 0) {
    var profit = ACESUP[pe.cat] || (pe.cat === 1 && pe.pairRank === 14 ? 1 : 0);
    if (profit > 0) {
      sideRes = side + Math.floor(side * profit);
      sideNote = "Aces Up paid " + fmt(sideRes) + " on your " + FC4_NAMES[pe.cat] + ".";
    } else sideNote = "Aces Up did not pay - your best hand was " + FC4_NAMES[pe.cat] + ".";
  }
  var payout = anteRes + sideRes,
    wager = ante + side;
  nxEl("fourcardNote").textContent =
    "You: " + FC4_NAMES[pe.cat] + " - Dealer: " + FC4_NAMES[de.cat];
  nxFinish({
    scr: "scr-fourcard",
    key: "fourcard",
    name: "Four Card Poker",
    bet: wager,
    payout: payout,
    msg: "fourcardMsg",
    winText:
      (cmp > 0
        ? "Your " + FC4_NAMES[pe.cat] + " beats the dealer's " + FC4_NAMES[de.cat] + ". "
        : "") +
      "You collect " +
      fmt(payout) +
      " fun credits. " +
      sideNote,
    loseText:
      "The dealer's " +
      FC4_NAMES[de.cat] +
      " beats your " +
      FC4_NAMES[pe.cat] +
      ". Your bet of " +
      fmt(wager) +
      " fun credits is lost. Balance: " +
      fmt(bal) +
      " fun credits. " +
      sideNote,
    pushText:
      "Dead level on the ante. Total returned: " + fmt(payout) + " fun credits. " + sideNote,
    partText:
      "You got back " + fmt(payout) + " of your " + fmt(wager) + " fun credits bet. " + sideNote,
    note: "you " + FC4_NAMES[pe.cat] + ", dealer " + FC4_NAMES[de.cat],
  });
});

/* ================= 50. Muflis Showdown ================= */
nxEl("muflisDeal").addEventListener("click", function () {
  var bet = readBet(nxEl("muflisBet"));
  if (bet === null) return;
  addBal(-bet);
  var deck = bjDeck();
  var ph = [deck.pop(), deck.pop(), deck.pop()];
  var dh = [deck.pop(), deck.pop(), deck.pop()];
  nxEl("muflisPHand").innerHTML = nxHandHTML(ph);
  nxEl("muflisDHand").innerHTML = nxHandHTML(dh);
  sfx.deal();
  var pe = tpEval(ph),
    de = tpEval(dh);
  var ps = nxEl("muflisPScore"),
    ds = nxEl("muflisDScore");
  ps.hidden = false;
  ps.textContent = TP_NAMES[pe.cat];
  ds.hidden = false;
  ds.textContent = TP_NAMES[de.cat];
  var cmp = tpCmp(pe, de);
  var payout = 0,
    bonus = 0;
  if (cmp < 0) {
    bonus = (pe.cat === 1 && pe.key[0] <= 9) || (pe.cat === 2 && pe.key[0] === 2) ? 0.5 : 0;
    payout = bet + Math.floor(bet * 0.89) + Math.floor(bet * bonus);
  } else if (cmp === 0) payout = bet;
  nxFinish({
    scr: "scr-muflis",
    key: "muflis",
    name: "Muflis Showdown",
    bet: bet,
    payout: payout,
    msg: "muflisMsg",
    winText:
      "Low wins - your " +
      TP_NAMES[pe.cat] +
      " is lower than the dealer's " +
      TP_NAMES[de.cat] +
      ". You collect " +
      fmt(payout) +
      " fun credits" +
      (bonus > 0 ? " including a low-hand bonus of " + fmt(Math.floor(bet * bonus)) : "") +
      ".",
    loseText:
      "The dealer's " +
      TP_NAMES[de.cat] +
      " is the lower hand against your " +
      TP_NAMES[pe.cat] +
      ". Your bet of " +
      fmt(bet) +
      " fun credits is lost. Balance: " +
      fmt(bal) +
      " fun credits.",
    note: "you " + TP_NAMES[pe.cat] + ", dealer " + TP_NAMES[de.cat],
  });
});

/* ================= 51. Chuck-a-Luck ================= */
var chuckPick = 1;
nxPickRow("chuckPick", function (v) {
  chuckPick = Number(v);
});
nxEl("chuckRoll").addEventListener("click", function () {
  var bet = readBet(nxEl("chuckBet"));
  if (bet === null) return;
  addBal(-bet);
  nxEl("chuckRoll").disabled = true;
  var faces = nxEl("chuckDice").children;
  for (var i = 0; i < 3; i++) faces[i].classList.add("rolling");
  var rolls = [nxD6(), nxD6(), nxD6()];
  var ticks = 0;
  var iv = setInterval(function () {
    for (var i = 0; i < 3; i++) faces[i].textContent = NXDIE[nxD6()];
    if (++ticks > 7) {
      clearInterval(iv);
      var m = 0;
      for (var i = 0; i < 3; i++) {
        faces[i].textContent = NXDIE[rolls[i]];
        faces[i].classList.remove("rolling");
        if (rolls[i] === chuckPick) m++;
      }
      var PROF = { 0: 0, 1: 1, 2: 2, 3: 10 };
      var payout = m > 0 ? bet + bet * PROF[m] : 0;
      nxEl("chuckRoll").disabled = false;
      nxFinish({
        scr: "scr-chuck",
        key: "chuck",
        name: "Chuck-a-Luck",
        bet: bet,
        payout: payout,
        msg: "chuckMsg",
        winText:
          "The cage rolled " +
          rolls.join(", ") +
          " - " +
          m +
          " matched your " +
          chuckPick +
          ". You collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          "The cage rolled " +
          rolls.join(", ") +
          " - no " +
          chuckPick +
          "s. Your bet of " +
          fmt(bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        note: "rolled " + rolls.join("-") + ", " + m + " match",
      });
    }
  }, 80);
});

/* ================= 52. Dice Duel ================= */
nxEl("diceduelRoll").addEventListener("click", function () {
  var bet = readBet(nxEl("diceduelBet"));
  if (bet === null) return;
  addBal(-bet);
  nxEl("diceduelRoll").disabled = true;
  var p = [nxD6(), nxD6()],
    d = [nxD6(), nxD6()];
  var pf = nxEl("diceduelPDice").children,
    df = nxEl("diceduelDDice").children;
  for (var i = 0; i < 2; i++) {
    pf[i].classList.add("rolling");
    df[i].classList.add("rolling");
  }
  var ticks = 0;
  var iv = setInterval(function () {
    for (var i = 0; i < 2; i++) {
      pf[i].textContent = NXDIE[nxD6()];
      df[i].textContent = NXDIE[nxD6()];
    }
    if (++ticks > 7) {
      clearInterval(iv);
      for (var i = 0; i < 2; i++) {
        pf[i].textContent = NXDIE[p[i]];
        pf[i].classList.remove("rolling");
        df[i].textContent = NXDIE[d[i]];
        df[i].classList.remove("rolling");
      }
      var pt = p[0] + p[1],
        dt = d[0] + d[1];
      nxEl("diceduelScore").textContent = pt + " vs " + dt;
      var payout = pt > dt ? Math.floor(bet * 2.19) : pt === dt ? bet : 0;
      nxEl("diceduelRoll").disabled = false;
      nxFinish({
        scr: "scr-diceduel",
        key: "diceduel",
        name: "Dice Duel",
        bet: bet,
        payout: payout,
        msg: "diceduelMsg",
        winText:
          "You rolled " +
          pt +
          " against the dealer's " +
          dt +
          ". You collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          "The dealer rolled " +
          dt +
          " against your " +
          pt +
          ". Your bet of " +
          fmt(bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        pushText: "Tied at " + pt + " - your bet of " + fmt(bet) + " fun credits is returned.",
        note: pt + " vs " + dt,
      });
    }
  }, 80);
});

/* ================= 53. Mini Roulette ================= */
var MR_RED = { 1: 1, 3: 1, 5: 1, 7: 1, 9: 1, 11: 1 };
nxEl("miniroulSpin").addEventListener("click", function () {
  var bet = readBet(nxEl("miniroulBet"));
  if (bet === null) return;
  addBal(-bet);
  nxEl("miniroulSpin").disabled = true;
  var win = Math.floor(Math.random() * 13);
  var ticks = 0;
  var iv = setInterval(function () {
    nxEl("miniroulNum").textContent = Math.floor(Math.random() * 13);
    if (++ticks > 12) {
      clearInterval(iv);
      nxEl("miniroulNum").textContent = win;
      var colName = win === 0 ? "green" : MR_RED[win] ? "red" : "black";
      nxEl("miniroulCol").textContent = win + " - " + colName;
      var last = nxEl("miniroulLast");
      var chipEl = document.createElement("span");
      chipEl.className = "n " + (win === 0 ? "g" : MR_RED[win] ? "r" : "b");
      chipEl.textContent = win;
      last.insertBefore(chipEl, last.firstChild);
      while (last.children.length > 10) last.removeChild(last.lastChild);
      var type = nxEl("miniroulType").value;
      var won = false;
      if (type === "straight") won = win === Number(nxEl("miniroulNumSel").value);
      else if (type === "red") won = !!MR_RED[win];
      else if (type === "black") won = win !== 0 && !MR_RED[win];
      else if (type === "odd") won = win % 2 === 1;
      else if (type === "even") won = win !== 0 && win % 2 === 0;
      var payout = won ? (type === "straight" ? bet * 12 : bet * 2) : 0;
      nxEl("miniroulSpin").disabled = false;
      nxFinish({
        scr: "scr-miniroul",
        key: "miniroul",
        name: "Mini Roulette",
        bet: bet,
        payout: payout,
        msg: "miniroulMsg",
        winText:
          win +
          " " +
          colName +
          " - your " +
          type +
          " bet wins. You collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          win +
          " " +
          colName +
          " - your " +
          type +
          " bet loses " +
          fmt(bet) +
          " fun credits. Balance: " +
          fmt(bal) +
          " fun credits.",
        note: "ball " + win + " " + colName + ", bet " + type,
      });
    }
  }, 70);
});

/* ================= 54. Let It Ride Lite ================= */
var LIR_PAY = { 9: 500, 8: 100, 7: 50, 6: 11, 5: 8, 4: 5, 3: 3, 2: 2 };
var lir = { active: false, deck: [], p: [], comm: [], unit: 0, units: 0, stage: 0 };
function lirRender() {
  nxEl("letitridePHand").innerHTML = nxHandHTML(lir.p);
  nxEl("letitrideCHand").innerHTML = lir.comm
    .map(function (c, i) {
      return bjCardHTML(c, i >= lir.stage);
    })
    .join("");
  nxEl("letitrideUnits").textContent = lir.units;
  nxEl("letitrideAmt").textContent = fmt(lir.units * lir.unit);
  var canAct = lir.active && lir.stage < 2;
  nxEl("letitridePull").disabled = !(canAct && lir.units > 1);
  nxEl("letitrideRide").disabled = !canAct;
  nxEl("letitrideStart").disabled = lir.active;
}
function lirReveal() {
  lir.stage++;
  lirRender();
  sfx.deal();
  if (lir.stage >= 2) {
    lir.active = false;
    var hand = lir.p.concat(lir.comm);
    var e = nxEval5(hand);
    var wager = lir.units * lir.unit;
    var profit = LIR_PAY[e.cat] || (e.cat === 1 && e.pairRank >= 10 ? 1 : 0);
    var payout = profit > 0 ? wager + wager * profit : 0;
    lirRender();
    nxFinish({
      scr: "scr-letitride",
      key: "letitride",
      name: "Let It Ride Lite",
      bet: wager,
      payout: payout,
      msg: "letitrideMsg",
      winText:
        "Final hand: " +
        e.name +
        " with " +
        lir.units +
        " unit" +
        (lir.units === 1 ? "" : "s") +
        " riding. You collect " +
        fmt(payout) +
        " fun credits.",
      loseText:
        "Final hand: " +
        e.name +
        " - not a paying hand. The " +
        fmt(wager) +
        " fun credits still riding are lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      note: e.name + ", " + lir.units + " units riding",
    });
    return;
  }
  setMsg(
    "letitrideMsg",
    "Community card " + lir.stage + " is out. Pull 1 unit back or let it ride.",
    "info",
  );
}
nxEl("letitrideStart").addEventListener("click", function () {
  if (lir.active) return;
  var unit = readBet(nxEl("letitrideBet"));
  if (unit === null) return;
  if (unit * 3 > bal) {
    setMsg(
      "letitrideMsg",
      "Three units (" + fmt(unit * 3) + ") is higher than your balance. Lower the unit bet.",
      "lose",
    );
    return;
  }
  addBal(-unit * 3);
  lir.unit = unit;
  lir.units = 3;
  lir.stage = 0;
  lir.deck = bjDeck();
  lir.p = [lir.deck.pop(), lir.deck.pop(), lir.deck.pop()];
  lir.comm = [lir.deck.pop(), lir.deck.pop()];
  lir.active = true;
  sfx.deal();
  lirRender();
  var e = nxEval5(lir.p.concat([lir.comm[0], lir.comm[0]]));
  setMsg(
    "letitrideMsg",
    "Your 3 cards are dealt and 3 units are riding. Pull 1 unit back or let it ride to see the first community card.",
    "info",
  );
});
nxEl("letitridePull").addEventListener("click", function () {
  if (!lir.active || lir.units <= 1) return;
  lir.units--;
  addBal(lir.unit);
  sfx.coin();
  setMsg(
    "letitrideMsg",
    "One unit (" +
      fmt(lir.unit) +
      ") pulled back and refunded. " +
      lir.units +
      " units still riding.",
    "info",
  );
  lirReveal();
});
nxEl("letitrideRide").addEventListener("click", function () {
  if (lir.active) lirReveal();
});
lirRender();

/* ================= 55. Five Card Frenzy ================= */
var FF_GROSS = { 9: 300, 8: 60, 7: 30, 6: 12, 5: 8, 4: 6, 3: 4.5, 2: 3.2, 1: 1.55, 0: 0 };
nxEl("fivefrenzyDeal").addEventListener("click", function () {
  var bet = readBet(nxEl("fivefrenzyBet"));
  if (bet === null) return;
  addBal(-bet);
  var deck = bjDeck();
  var hand = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
  nxEl("fivefrenzyHand").innerHTML = nxHandHTML(hand);
  sfx.deal();
  var e = nxEval5(hand);
  nxEl("fivefrenzyName").textContent = e.name;
  var payout = Math.floor(bet * (FF_GROSS[e.cat] || 0));
  nxFinish({
    scr: "scr-fivefrenzy",
    key: "fivefrenzy",
    name: "Five Card Frenzy",
    bet: bet,
    payout: payout,
    msg: "fivefrenzyMsg",
    winText: e.name + " - you collect " + fmt(payout) + " fun credits.",
    loseText:
      e.name +
      " - no pair, no pay. Your bet of " +
      fmt(bet) +
      " fun credits is lost. Balance: " +
      fmt(bal) +
      " fun credits.",
    partText:
      e.name + " - you got back " + fmt(payout) + " of your " + fmt(bet) + " fun credits bet.",
    note: e.name,
  });
});

/* ================= 56. Crown and Anchor ================= */
var CA_FACES = ["Crown", "Anchor", "Heart", "Diamond", "Club", "Spade"];
var CA_SYM = ["\u265B", "\u2693", "\u2665", "\u2666", "\u2663", "\u2660"];
var crownPick = 0;
nxPickRow("crownPick", function (v) {
  crownPick = Number(v);
});
nxEl("crownRoll").addEventListener("click", function () {
  var bet = readBet(nxEl("crownBet"));
  if (bet === null) return;
  addBal(-bet);
  nxEl("crownRoll").disabled = true;
  var faces = nxEl("crownDice").children;
  for (var i = 0; i < 3; i++) faces[i].classList.add("rolling");
  var rolls = [
    Math.floor(Math.random() * 6),
    Math.floor(Math.random() * 6),
    Math.floor(Math.random() * 6),
  ];
  var ticks = 0;
  var iv = setInterval(function () {
    for (var i = 0; i < 3; i++) faces[i].textContent = CA_SYM[Math.floor(Math.random() * 6)];
    if (++ticks > 7) {
      clearInterval(iv);
      var m = 0;
      for (var i = 0; i < 3; i++) {
        faces[i].textContent = CA_SYM[rolls[i]];
        faces[i].classList.remove("rolling");
        if (rolls[i] === crownPick) m++;
      }
      var PROF = { 0: 0, 1: 1, 2: 2, 3: 5 };
      var payout = m > 0 ? bet + bet * PROF[m] : 0;
      nxEl("crownRoll").disabled = false;
      nxFinish({
        scr: "scr-crown",
        key: "crown",
        name: "Crown and Anchor",
        bet: bet,
        payout: payout,
        msg: "crownMsg",
        winText:
          "The dice show " +
          rolls
            .map(function (r) {
              return CA_FACES[r];
            })
            .join(", ") +
          " - " +
          m +
          " matched your " +
          CA_FACES[crownPick] +
          ". You collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          "The dice show " +
          rolls
            .map(function (r) {
              return CA_FACES[r];
            })
            .join(", ") +
          " - no " +
          CA_FACES[crownPick] +
          ". Your bet of " +
          fmt(bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        note: m + " match on " + CA_FACES[crownPick],
      });
    }
  }, 80);
});

/* ================= 57. Pyramid Climb ================= */
var pyr = { active: false, bet: 0, level: 0, safes: [], tiles: [] };
function pyrMult(level) {
  return level <= 0 ? 0 : 0.97 * Math.pow(3, level);
}
(function buildPyramid() {
  var wrap = nxEl("pyramidGrid");
  wrap.innerHTML = "";
  pyr.tiles = [];
  for (var lvl = 6; lvl >= 1; lvl--) {
    var row = document.createElement("div");
    row.className = "trow";
    row.id = "pyrrow" + lvl;
    var lbl = document.createElement("span");
    lbl.className = "tlbl";
    lbl.innerHTML = "Level " + lvl + "<b>x" + pyrMult(lvl).toFixed(2) + "</b>";
    row.appendChild(lbl);
    pyr.tiles[lvl] = [];
    for (var s = 0; s < 3; s++) {
      var b = document.createElement("button");
      b.className = "ttile";
      b.textContent = "?";
      b.disabled = true;
      b.setAttribute("aria-label", "Level " + lvl + " tile " + (s + 1));
      (function (L, S, btn) {
        btn.addEventListener("click", function () {
          pyrPick(L, S, btn);
        });
      })(lvl, s, b);
      row.appendChild(b);
      pyr.tiles[lvl][s] = b;
    }
    wrap.appendChild(row);
  }
})();
function pyrUpdate() {
  for (var lvl = 1; lvl <= 6; lvl++) {
    var row = nxEl("pyrrow" + lvl);
    if (row) row.classList.toggle("current", pyr.active && lvl === pyr.level + 1);
    for (var s = 0; s < 3; s++) {
      var t = pyr.tiles[lvl][s];
      if (!t.classList.contains("safe") && !t.classList.contains("bomb"))
        t.disabled = !(pyr.active && lvl === pyr.level + 1);
    }
  }
  nxEl("pyramidLevel").textContent = pyr.level + " / 6";
  nxEl("pyramidMult").textContent = pyr.level > 0 ? "x" + pyrMult(pyr.level).toFixed(2) : "-";
  nxEl("pyramidValue").textContent =
    pyr.active && pyr.level > 0 ? fmt(Math.floor(pyr.bet * pyrMult(pyr.level))) : "0";
  nxEl("pyramidCash").disabled = !(pyr.active && pyr.level > 0);
  nxEl("pyramidCash").textContent =
    pyr.active && pyr.level > 0
      ? "Cash out " + fmt(Math.floor(pyr.bet * pyrMult(pyr.level)))
      : "Cash out";
  nxEl("pyramidStart").disabled = pyr.active;
}
function pyrReveal() {
  for (var lvl = 1; lvl <= 6; lvl++)
    for (var s = 0; s < 3; s++) {
      var t = pyr.tiles[lvl][s];
      t.disabled = true;
      if (s === pyr.safes[lvl] && !t.classList.contains("safe")) {
        t.innerHTML = '<svg><use href="#s-gem"/></svg>';
        t.classList.add("done");
      }
      if (s !== pyr.safes[lvl] && !t.classList.contains("bomb") && !t.classList.contains("safe")) {
        t.innerHTML = '<svg><use href="#s-mine"/></svg>';
        t.classList.add("done");
      }
    }
}
function pyrFinish(val, auto) {
  pyr.active = false;
  pyrReveal();
  pyrUpdate();
  nxFinish({
    scr: "scr-pyramid",
    key: "pyramid",
    name: "Pyramid Climb",
    bet: pyr.bet,
    payout: val,
    msg: "pyramidMsg",
    winText:
      (auto ? "Top of the pyramid! " : "Cashed out. ") +
      "You collected " +
      fmt(val) +
      " fun credits at x" +
      pyrMult(pyr.level).toFixed(2) +
      ".",
    loseText: "",
    note: "cleared " + pyr.level + " level" + (pyr.level === 1 ? "" : "s"),
    big: pyr.level >= 4,
  });
}
function pyrPick(lvl, side, btn) {
  if (!pyr.active || lvl !== pyr.level + 1) return;
  if (pyr.safes[lvl] !== side) {
    pyr.active = false;
    btn.innerHTML = '<svg><use href="#s-mine"/></svg>';
    btn.classList.add("bomb", "flip");
    sfx.boom();
    logHist("pyramid", histLine(pyr.bet, 0) + " - trap tile on level " + lvl);
    recordRound("pyramid", pyr.bet, 0);
    setMsg(
      "pyramidMsg",
      "Trap tile on level " +
        lvl +
        "! The climb is over and your bet of " +
        fmt(pyr.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    pyrReveal();
    pyrUpdate();
    renderBal(false);
    return;
  }
  btn.innerHTML = '<svg><use href="#s-gem"/></svg>';
  btn.classList.add("safe", "flip");
  pyr.tiles[lvl].forEach(function (t) {
    t.disabled = true;
  });
  pyr.level++;
  sfx.gem();
  if (pyr.level >= 6) {
    pyrFinish(Math.floor(pyr.bet * pyrMult(6)), true);
    return;
  }
  setMsg(
    "pyramidMsg",
    "Level " +
      pyr.level +
      " cleared. Multiplier x" +
      pyrMult(pyr.level).toFixed(2) +
      " - cash out or climb to level " +
      (pyr.level + 1) +
      ".",
    "info",
  );
  pyrUpdate();
}
nxEl("pyramidStart").addEventListener("click", function () {
  if (pyr.active) return;
  var bet = readBet(nxEl("pyramidBet"));
  if (bet === null) return;
  addBal(-bet);
  pyr.bet = bet;
  pyr.level = 0;
  pyr.safes = [];
  for (var lvl = 1; lvl <= 6; lvl++) pyr.safes[lvl] = Math.floor(Math.random() * 3);
  for (var l2 = 1; l2 <= 6; l2++)
    pyr.tiles[l2].forEach(function (t) {
      t.className = "ttile";
      t.innerHTML = "?";
      t.textContent = "?";
    });
  pyr.active = true;
  setMsg("pyramidMsg", "The climb is on. Pick one tile on level 1.", "info");
  sfx.click();
  pyrUpdate();
});
nxEl("pyramidCash").addEventListener("click", function () {
  if (pyr.active && pyr.level > 0) pyrFinish(Math.floor(pyr.bet * pyrMult(pyr.level)), false);
});
pyrUpdate();

/* ================= 58. Jetpack Climb ================= */
var jp = { running: false, bet: 0, crashAt: 0, start: 0, raf: 0, mult: 1, hist: [] };
function jpRenderHist() {
  nxEl("jetpackHist").innerHTML = jp.hist
    .map(function (h) {
      return '<span class="histchip ' + (h >= 2 ? "hi" : "lo") + '">' + h.toFixed(2) + "x</span>";
    })
    .join("");
}
function jpDraw(m) {
  nxEl("jetpackMult").textContent = m.toFixed(2) + "x";
  var p = Math.min(1, (m - 1) / 9);
  var el = nxEl("jetpackEl");
  el.style.left = 4 + p * 72 + "%";
  el.style.bottom = 6 + p * 62 + "%";
  el.style.transform = "rotate(" + (45 - p * 28) + "deg)";
  nxEl("jetpackTrail").style.width = p * 100 + "%";
}
function jpLoop() {
  if (!jp.running) return;
  var elapsed = performance.now() - jp.start;
  jp.mult = Math.exp(0.00022 * elapsed);
  if (jp.mult >= jp.crashAt) {
    jp.mult = jp.crashAt;
    jpDraw(jp.mult);
    jp.running = false;
    nxEl("jetpackMult").classList.add("crashed");
    nxEl("jetpackMult").textContent = "Fuel out at " + jp.crashAt.toFixed(2) + "x";
    nxEl("jetpackEl").classList.add("boom");
    sfx.boom();
    logHist("jetpack", histLine(jp.bet, 0) + " - fuel out at " + jp.crashAt.toFixed(2) + "x");
    recordRound("jetpack", jp.bet, 0);
    nxEl("jetpackSky").classList.remove("flying");
    setMsg(
      "jetpackMsg",
      "The fuel ran out at " +
        jp.crashAt.toFixed(2) +
        "x. Your bet of " +
        fmt(jp.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    jp.hist.unshift(jp.crashAt);
    if (jp.hist.length > 12) jp.hist.pop();
    jpRenderHist();
    nxEl("jetpackLaunch").disabled = false;
    nxEl("jetpackCash").disabled = true;
    return;
  }
  jpDraw(jp.mult);
  if (Math.random() < 0.3) sfx.tick();
  jp.raf = requestAnimationFrame(jpLoop);
}
nxEl("jetpackLaunch").addEventListener("click", function () {
  if (jp.running) return;
  var bet = readBet(nxEl("jetpackBet"));
  if (bet === null) return;
  addBal(-bet);
  jp.bet = bet;
  jp.mult = 1;
  jp.crashAt = crashPoint();
  jp.start = performance.now();
  jp.running = true;
  nxEl("jetpackMult").classList.remove("crashed");
  nxEl("jetpackEl").classList.remove("boom");
  nxEl("jetpackLaunch").disabled = true;
  nxEl("jetpackCash").disabled = false;
  nxEl("jetpackSky").classList.add("flying");
  setMsg("jetpackMsg", "You are climbing. Cash out before the fuel runs out.", "info");
  sfx.coin();
  jpDraw(1);
  jp.raf = requestAnimationFrame(jpLoop);
});
nxEl("jetpackCash").addEventListener("click", function () {
  if (!jp.running) return;
  jp.running = false;
  cancelAnimationFrame(jp.raf);
  var val = Math.floor(jp.bet * jp.mult);
  logHist("jetpack", histLine(jp.bet, val) + " - cashed out at " + jp.mult.toFixed(2) + "x");
  recordRound("jetpack", jp.bet, val);
  jp.hist.unshift(jp.crashAt);
  if (jp.hist.length > 12) jp.hist.pop();
  jpRenderHist();
  nxEl("jetpackSky").classList.remove("flying");
  nxEl("jetpackLaunch").disabled = false;
  nxEl("jetpackCash").disabled = true;
  if (val > jp.bet) {
    addBal(val);
    setMsg(
      "jetpackMsg",
      "Cashed out at " + jp.mult.toFixed(2) + "x - you collected " + fmt(val) + " fun credits.",
      "win",
    );
    sfx.win();
    showWinBanner(nxEl("scr-jetpack"), "Cashed Out", val, jp.mult >= 5, "x" + jp.mult.toFixed(2));
    pushWin("You", val, "Jetpack Climb");
  } else if (val > 0) {
    addBal(val);
    setMsg(
      "jetpackMsg",
      "Cashed out at " + jp.mult.toFixed(2) + "x - " + fmt(val) + " fun credits back.",
      "info",
    );
    sfx.coin();
  }
  renderBal(val > jp.bet);
});
jpRenderHist();

/* ================= 59. Double Wheel ================= */
var DW_W = [
  [0, 19],
  [0.5, 20],
  [1, 31],
  [1.5, 15],
  [2, 10],
  [3, 5],
];
nxEl("doublewheelSpin").addEventListener("click", function () {
  var bet = readBet(nxEl("doublewheelBet"));
  if (bet === null) return;
  addBal(-bet);
  nxEl("doublewheelSpin").disabled = true;
  var a = pickWeighted(DW_W),
    b = pickWeighted(DW_W);
  var ticks = 0;
  var iv = setInterval(function () {
    nxEl("doublewheelA").textContent = "x" + pickWeighted(DW_W);
    nxEl("doublewheelB").textContent = "x" + pickWeighted(DW_W);
    sfx.tick();
    if (++ticks > 11) {
      clearInterval(iv);
      nxEl("doublewheelA").textContent = "x" + a;
      nxEl("doublewheelB").textContent = "x" + b;
      var combined = a * b;
      nxEl("doublewheelTotal").textContent = "Combined: x" + combined.toFixed(2);
      var payout = Math.floor(bet * combined);
      nxEl("doublewheelSpin").disabled = false;
      nxFinish({
        scr: "scr-doublewheel",
        key: "doublewheel",
        name: "Double Wheel",
        bet: bet,
        payout: payout,
        msg: "doublewheelMsg",
        winText:
          "Wheels landed x" +
          a +
          " and x" +
          b +
          " - combined x" +
          combined.toFixed(2) +
          ". You collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          combined === 0
            ? "A wheel landed on x0 - the combined multiplier is x0. Your bet of " +
              fmt(bet) +
              " fun credits is lost. Balance: " +
              fmt(bal) +
              " fun credits."
            : "Combined x" +
              combined.toFixed(2) +
              " returned less than your bet. Balance: " +
              fmt(bal) +
              " fun credits.",
        partText:
          "Wheels landed x" +
          a +
          " and x" +
          b +
          " - combined x" +
          combined.toFixed(2) +
          ", so " +
          fmt(payout) +
          " of your " +
          fmt(bet) +
          " fun credits come back.",
        note: "x" + a + " x x" + b,
      });
    }
  }, 75);
});

/* ================= 60. Dart Board ================= */
var DART_W = [
  [50, 6],
  [25, 12],
  [20, 20],
  [15, 22],
  [10, 20],
  [5, 12],
  [0, 8],
];
nxEl("dartboardThrow").addEventListener("click", function () {
  var bet = readBet(nxEl("dartboardBet"));
  if (bet === null) return;
  addBal(-bet);
  nxEl("dartboardThrow").disabled = true;
  var scores = [pickWeighted(DART_W), pickWeighted(DART_W), pickWeighted(DART_W)];
  var faces = nxEl("dartboardDarts").children;
  var ticks = 0;
  var iv = setInterval(function () {
    for (var i = 0; i < 3; i++) faces[i].textContent = pickWeighted(DART_W);
    if (++ticks > 8) {
      clearInterval(iv);
      var total = 0;
      for (var i = 0; i < 3; i++) {
        faces[i].textContent = scores[i];
        total += scores[i];
      }
      nxEl("dartboardScore").textContent = "Total: " + total;
      var payout = Math.floor(bet * total * 0.0202);
      nxEl("dartboardThrow").disabled = false;
      nxFinish({
        scr: "scr-dartboard",
        key: "dartboard",
        name: "Dart Board",
        bet: bet,
        payout: payout,
        msg: "dartboardMsg",
        winText:
          "Darts scored " +
          scores.join(", ") +
          " - total " +
          total +
          ". You collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          "Darts scored " +
          scores.join(", ") +
          " - total " +
          total +
          " paid nothing back. Balance: " +
          fmt(bal) +
          " fun credits.",
        partText:
          "Darts scored " +
          scores.join(", ") +
          " - total " +
          total +
          ", so " +
          fmt(payout) +
          " of your " +
          fmt(bet) +
          " fun credits come back.",
        note: "total " + total,
      });
    }
  }, 80);
});

/* ================= 61. Ring Toss ================= */
var RING_W = [
  [0, 35],
  [0.5, 30],
  [1, 20],
  [2, 10],
  [5, 5],
];
nxEl("ringtossThrow").addEventListener("click", function () {
  var bet = readBet(nxEl("ringtossBet"));
  if (bet === null) return;
  addBal(-bet);
  nxEl("ringtossThrow").disabled = true;
  var vals = [pickWeighted(RING_W), pickWeighted(RING_W), pickWeighted(RING_W)];
  var faces = nxEl("ringtossRings").children;
  var ticks = 0;
  var iv = setInterval(function () {
    for (var i = 0; i < 3; i++) faces[i].textContent = "x" + pickWeighted(RING_W);
    if (++ticks > 8) {
      clearInterval(iv);
      var sum = 0;
      for (var i = 0; i < 3; i++) {
        faces[i].textContent = "x" + vals[i];
        sum += vals[i];
      }
      nxEl("ringtossScore").textContent = "Peg total: x" + sum.toFixed(1);
      var payout = Math.floor(bet * sum * 0.4);
      nxEl("ringtossThrow").disabled = false;
      nxFinish({
        scr: "scr-ringtoss",
        key: "ringtoss",
        name: "Ring Toss",
        bet: bet,
        payout: payout,
        msg: "ringtossMsg",
        winText:
          "Rings landed x" +
          vals.join(", x") +
          " - peg total x" +
          sum.toFixed(1) +
          ". You collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          "Rings landed x" +
          vals.join(", x") +
          " - peg total x" +
          sum.toFixed(1) +
          " paid nothing back. Balance: " +
          fmt(bal) +
          " fun credits.",
        partText:
          "Rings landed x" +
          vals.join(", x") +
          " - peg total x" +
          sum.toFixed(1) +
          ", so " +
          fmt(payout) +
          " of your " +
          fmt(bet) +
          " fun credits come back.",
        note: "peg total x" + sum.toFixed(1),
      });
    }
  }, 80);
});

/* ================= 62. Coin Pusher Lite ================= */
var cpPos = "C";
nxPickRow("coinpusherPick", function (v) {
  cpPos = v;
});
var CP_W = {
  C: [
    [0, 26],
    [0.5, 34],
    [1, 22],
    [2, 12],
    [5, 6],
  ],
  L: [
    [0, 34],
    [0.5, 26],
    [1, 22],
    [2, 12],
    [5, 6],
  ],
  R: [
    [0, 34],
    [0.5, 26],
    [1, 22],
    [2, 12],
    [5, 6],
  ],
};
nxEl("coinpusherDrop").addEventListener("click", function () {
  var bet = readBet(nxEl("coinpusherBet"));
  if (bet === null) return;
  addBal(-bet);
  nxEl("coinpusherDrop").disabled = true;
  var W = CP_W[cpPos];
  var zones = [pickWeighted(W), pickWeighted(W), pickWeighted(W), pickWeighted(W), pickWeighted(W)];
  var faces = nxEl("coinpusherCoins").children;
  var ticks = 0;
  var iv = setInterval(function () {
    for (var i = 0; i < 5; i++) faces[i].textContent = "x" + pickWeighted(W);
    if (++ticks > 8) {
      clearInterval(iv);
      var sum = 0;
      for (var i = 0; i < 5; i++) {
        faces[i].textContent = "x" + zones[i];
        sum += zones[i];
      }
      var avg = sum / 5;
      nxEl("coinpusherScore").textContent =
        "Zones: x" + zones.join(", x") + " - average x" + avg.toFixed(2);
      var payout = Math.floor(bet * avg * 1.04);
      nxEl("coinpusherDrop").disabled = false;
      nxFinish({
        scr: "scr-coinpusher",
        key: "coinpusher",
        name: "Coin Pusher Lite",
        bet: bet,
        payout: payout,
        msg: "coinpusherMsg",
        winText:
          "Your 5 coins averaged x" +
          avg.toFixed(2) +
          " from the " +
          (cpPos === "C" ? "centre" : cpPos === "L" ? "left" : "right") +
          " column. You collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          "Your 5 coins averaged x" +
          avg.toFixed(2) +
          " - nothing comes back this drop. Balance: " +
          fmt(bal) +
          " fun credits.",
        partText:
          "Your 5 coins averaged x" +
          avg.toFixed(2) +
          ", so " +
          fmt(payout) +
          " of your " +
          fmt(bet) +
          " fun credits come back.",
        note: "average zone x" + avg.toFixed(2),
      });
    }
  }, 80);
});

/* ================= 63. Memory Match ================= */
var mm = {
  active: false,
  bet: 0,
  deck: [],
  first: -1,
  turns: 6,
  pairs: 0,
  lock: false,
  tiles: [],
  done: [],
};
(function buildMemory() {
  var grid = nxEl("memoryGrid");
  for (var i = 0; i < 12; i++) {
    var b = document.createElement("button");
    b.className = "memtile";
    b.disabled = true;
    b.setAttribute("aria-label", "Memory card " + (i + 1));
    (function (idx, btn) {
      btn.addEventListener("click", function () {
        mmFlip(idx, btn);
      });
    })(i, b);
    grid.appendChild(b);
    mm.tiles.push(b);
  }
})();
function mmValue() {
  return Math.floor(mm.bet * mm.pairs * 0.22) + (mm.pairs >= 6 ? mm.bet : 0);
}
function mmHUD() {
  nxEl("memoryTurns").textContent = mm.turns;
  nxEl("memoryPairs").textContent = mm.pairs + " / 6";
  nxEl("memoryValue").textContent = fmt(mm.active || mm.pairs > 0 ? mmValue() : 0);
}
function mmEnd() {
  mm.active = false;
  mm.tiles.forEach(function (t) {
    t.disabled = true;
  });
  nxFinish({
    scr: "scr-memory",
    key: "memory",
    name: "Memory Match",
    bet: mm.bet,
    payout: mmValue(),
    msg: "memoryMsg",
    winText:
      "Game over - you found " +
      mm.pairs +
      " of 6 pairs" +
      (mm.pairs >= 6 ? " and the all-pairs bonus" : "") +
      ". You collect " +
      fmt(mmValue()) +
      " fun credits.",
    loseText:
      "Game over - no pairs found, so nothing pays. Your bet of " +
      fmt(mm.bet) +
      " fun credits is lost. Balance: " +
      fmt(bal) +
      " fun credits.",
    partText:
      "Game over - you found " +
      mm.pairs +
      " of 6 pairs, so " +
      fmt(mmValue()) +
      " of your " +
      fmt(mm.bet) +
      " fun credits come back.",
    note: mm.pairs + " pairs found",
  });
  nxEl("memoryStart").disabled = false;
  mmHUD();
}
function mmFlip(i, btn) {
  if (!mm.active || mm.lock || mm.done[i] || i === mm.first || btn.classList.contains("open"))
    return;
  btn.classList.add("open", "flip");
  btn.innerHTML = symHTML(mm.deck[i]);
  sfx.click();
  if (mm.first === -1) {
    mm.first = i;
    return;
  }
  var firstIdx = mm.first;
  mm.first = -1;
  mm.turns--;
  if (mm.deck[firstIdx] === mm.deck[i]) {
    mm.done[firstIdx] = true;
    mm.done[i] = true;
    mm.tiles[firstIdx].classList.add("done");
    btn.classList.add("done");
    mm.tiles[firstIdx].disabled = true;
    btn.disabled = true;
    mm.pairs++;
    sfx.gem();
    setMsg("memoryMsg", "Pair found - " + mm.pairs + " of 6. " + mm.turns + " turns left.", "info");
    mmHUD();
    if (mm.pairs >= 6 || mm.turns <= 0) mmEnd();
  } else {
    mm.lock = true;
    setMsg(
      "memoryMsg",
      "No match - remember those two positions. " + mm.turns + " turns left.",
      "info",
    );
    mmHUD();
    setTimeout(function () {
      mm.tiles[firstIdx].classList.remove("open");
      mm.tiles[firstIdx].innerHTML = "";
      btn.classList.remove("open");
      btn.innerHTML = "";
      mm.lock = false;
      if (mm.turns <= 0 && mm.active) mmEnd();
    }, 750);
  }
}
nxEl("memoryStart").addEventListener("click", function () {
  if (mm.active) return;
  var bet = readBet(nxEl("memoryBet"));
  if (bet === null) return;
  addBal(-bet);
  mm.bet = bet;
  mm.first = -1;
  mm.turns = 6;
  mm.pairs = 0;
  mm.lock = false;
  mm.done = [];
  var codes = ["cherry", "lemon", "grape", "bell", "star", "gem"];
  mm.deck = [];
  codes.forEach(function (c) {
    mm.deck.push(c, c);
  });
  for (var i = mm.deck.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = mm.deck[i];
    mm.deck[i] = mm.deck[j];
    mm.deck[j] = t;
  }
  mm.tiles.forEach(function (t) {
    t.className = "memtile";
    t.innerHTML = "";
    t.disabled = false;
  });
  mm.active = true;
  nxEl("memoryStart").disabled = true;
  setMsg(
    "memoryMsg",
    "Cards are shuffled. Flip your first pair - 6 turns to find 6 pairs.",
    "info",
  );
  mmHUD();
});
mmHUD();

/* ================= 64. Pattern Bingo ================= */
var PB_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
var pb = {
  active: false,
  bet: 0,
  iv: 0,
  cells: [],
  card: [],
  marked: {},
  ai: [],
  order: [],
  pos: 0,
};
function pbCardNums() {
  var pool = [];
  for (var n = 1; n <= 30; n++) pool.push(n);
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  return pool.slice(0, 8);
}
function pbMakeCard() {
  var nums = pbCardNums(),
    card = [],
    k = 0;
  for (var i = 0; i < 9; i++) card.push(i === 4 ? "FREE" : nums[k++]);
  return card;
}
function pbRenderCard() {
  var grid = nxEl("patternbingoCard");
  grid.innerHTML = "";
  pb.cells = [];
  pb.card.forEach(function (v, i) {
    var d = document.createElement("div");
    d.className = "bcell" + (v === "FREE" ? " free" : "") + (pb.marked[i] ? " marked" : "");
    d.textContent = v === "FREE" ? "FREE" : v;
    grid.appendChild(d);
    pb.cells.push(d);
  });
}
function pbHasLine(marked) {
  return PB_LINES.some(function (L) {
    return L.every(function (i) {
      return marked[i];
    });
  });
}
function pbPattern(marked) {
  var all = [0, 1, 2, 3, 4, 5, 6, 7, 8].every(function (i) {
    return marked[i];
  });
  if (all) return { mult: 8, name: "Blackout" };
  if (
    [0, 2, 4, 6, 8].every(function (i) {
      return marked[i];
    })
  )
    return { mult: 3, name: "X pattern" };
  if (
    [0, 1, 2, 4, 7].every(function (i) {
      return marked[i];
    })
  )
    return { mult: 2.5, name: "T pattern" };
  if (pbHasLine(marked)) return { mult: 1.6, name: "Line" };
  return null;
}
function pbEnd(payout, note) {
  pb.active = false;
  clearInterval(pb.iv);
  nxEl("patternbingoStart").disabled = false;
  nxFinish({
    scr: "scr-patternbingo",
    key: "patternbingo",
    name: "Pattern Bingo",
    bet: pb.bet,
    payout: payout,
    msg: "patternbingoMsg",
    winText: note + " You collect " + fmt(payout) + " fun credits.",
    loseText:
      note +
      " Your bet of " +
      fmt(pb.bet) +
      " fun credits is lost. Balance: " +
      fmt(bal) +
      " fun credits.",
    note: note,
  });
}
nxEl("patternbingoStart").addEventListener("click", function () {
  if (pb.active) return;
  var bet = readBet(nxEl("patternbingoBet"));
  if (bet === null) return;
  addBal(-bet);
  pb.bet = bet;
  pb.card = pbMakeCard();
  pb.marked = { 4: true };
  pb.ai = [pbMakeCard(), pbMakeCard()].map(function (card) {
    var marked = { 4: true };
    return { card: card, marked: marked };
  });
  pb.order = [];
  for (var n = 1; n <= 30; n++) pb.order.push(n);
  for (var i = pb.order.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pb.order[i];
    pb.order[i] = pb.order[j];
    pb.order[j] = t;
  }
  pb.pos = 0;
  pbRenderCard();
  nxEl("patternbingoDrawn").textContent = "-";
  pb.active = true;
  nxEl("patternbingoStart").disabled = true;
  setMsg(
    "patternbingoMsg",
    "The draw is running. Patterns pay more than lines - good luck.",
    "info",
  );
  pb.iv = setInterval(function () {
    if (pb.pos >= pb.order.length) {
      pbEnd(0, "The draw finished with no winner.");
      return;
    }
    var num = pb.order[pb.pos++];
    nxEl("patternbingoDrawn").textContent = num;
    var idx = pb.card.indexOf(num);
    if (idx >= 0) {
      pb.marked[idx] = true;
      pb.cells[idx].classList.add("marked");
    }
    pb.ai.forEach(function (a) {
      var ai2 = a.card.indexOf(num);
      if (ai2 >= 0) a.marked[ai2] = true;
    });
    sfx.tick();
    var pat = pbPattern(pb.marked);
    if (pat) {
      pbEnd(Math.floor(pb.bet * pat.mult), pat.name + " completed on draw " + pb.pos + "!");
      return;
    }
    for (var k = 0; k < pb.ai.length; k++) {
      if (pbHasLine(pb.ai[k].marked)) {
        pbEnd(0, "An AI card completed a line first on draw " + pb.pos + ".");
        return;
      }
    }
  }, 240);
});
pb.card = pbMakeCard();
pb.marked = { 4: true };
pbRenderCard();

/* ================= 65. Power Keno ================= */
var PK_PAY = {
  1: { 1: 3 },
  2: { 2: 10 },
  3: { 2: 2, 3: 16 },
  4: { 2: 1, 3: 6, 4: 22 },
  5: { 3: 3, 4: 12, 5: 80 },
  6: { 3: 2, 4: 8, 5: 30, 6: 160 },
  7: { 4: 4, 5: 20, 6: 80, 7: 400 },
  8: { 4: 3, 5: 12, 6: 50, 7: 200, 8: 800 },
  9: { 4: 2, 5: 10, 6: 36, 7: 120, 8: 600, 9: 2000 },
  10: { 5: 5, 6: 24, 7: 100, 8: 400, 9: 1000, 10: 4000 },
};
var pkeno = { picks: {}, btns: [] };
(function buildPowerKeno() {
  var grid = nxEl("powerkenoGrid");
  for (var n = 1; n <= 80; n++) {
    var b = document.createElement("button");
    b.className = "knum";
    b.textContent = n;
    b.setAttribute("aria-label", "Number " + n);
    (function (num, btn) {
      btn.addEventListener("click", function () {
        if (pkeno.picks[num]) {
          delete pkeno.picks[num];
          btn.classList.remove("sel");
        } else {
          if (Object.keys(pkeno.picks).length >= 10) {
            setMsg(
              "powerkenoMsg",
              "You can pick at most 10 numbers. Tap a picked number to remove it.",
              "lose",
            );
            return;
          }
          pkeno.picks[num] = true;
          btn.classList.add("sel");
        }
        sfx.click();
        nxEl("powerkenoCount").textContent = Object.keys(pkeno.picks).length + " / 10";
      });
    })(n, b);
    grid.appendChild(b);
    pkeno.btns.push(b);
  }
})();
nxEl("powerkenoClear").addEventListener("click", function () {
  pkeno.picks = {};
  pkeno.btns.forEach(function (b) {
    b.classList.remove("sel", "drawn", "hit");
  });
  nxEl("powerkenoCount").textContent = "0 / 10";
  sfx.click();
});
nxEl("powerkenoDraw").addEventListener("click", function () {
  var count = Object.keys(pkeno.picks).length;
  if (count === 0) {
    setMsg("powerkenoMsg", "Pick at least 1 number first.", "lose");
    return;
  }
  var bet = readBet(nxEl("powerkenoBet"));
  if (bet === null) return;
  addBal(-bet);
  pkeno.btns.forEach(function (b) {
    b.classList.remove("drawn", "hit");
  });
  var pool = [];
  for (var n = 1; n <= 80; n++) pool.push(n);
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  var drawn = pool.slice(0, 20),
    power = drawn[19];
  var matches = 0;
  drawn.forEach(function (num) {
    pkeno.btns[num - 1].classList.add("drawn");
    if (pkeno.picks[num]) {
      matches++;
      pkeno.btns[num - 1].classList.add("hit");
    }
  });
  var mult = (PK_PAY[count] && PK_PAY[count][matches]) || 0;
  var payout = bet * mult;
  var powered = false;
  if (mult > 0 && pkeno.picks[power]) {
    payout *= 4;
    powered = true;
  }
  nxEl("powerkenoMatch").textContent = matches + " / " + count;
  nxEl("powerkenoPower").textContent = power;
  sfx.deal();
  nxFinish({
    scr: "scr-powerkeno",
    key: "powerkeno",
    name: "Power Keno",
    bet: bet,
    payout: payout,
    msg: "powerkenoMsg",
    winText:
      "You matched " +
      matches +
      " of " +
      count +
      " picks" +
      (powered ? " and the Power number " + power + " multiplied your payout by 4" : "") +
      ". You collect " +
      fmt(payout) +
      " fun credits.",
    loseText:
      "You matched " +
      matches +
      " of " +
      count +
      " picks - no paying tier. Your bet of " +
      fmt(bet) +
      " fun credits is lost. Balance: " +
      fmt(bal) +
      " fun credits.",
    partText:
      "You matched " +
      matches +
      " of " +
      count +
      " picks, so " +
      fmt(payout) +
      " of your " +
      fmt(bet) +
      " fun credits come back.",
    note: matches + " matches" + (powered ? ", power x4" : ""),
  });
});

/* ================= 66. Gold Rush Scratch ================= */
var GS_W = [
  ["cherry", 32],
  ["lemon", 28],
  ["bell", 19],
  ["star", 12],
  ["gem", 9],
];
var GS_PAY = { cherry: 4, lemon: 5, bell: 10, star: 25, gem: 50 };
var gs = { active: false, bet: 0, syms: [], open: 0, tiles: [] };
(function buildGoldScratch() {
  var grid = nxEl("goldscratchGrid");
  for (var i = 0; i < 16; i++) {
    var b = document.createElement("button");
    b.className = "stile";
    b.textContent = "?";
    b.disabled = true;
    b.setAttribute("aria-label", "Scratch tile " + (i + 1));
    (function (idx, btn) {
      btn.addEventListener("click", function () {
        gsOpen(idx, btn);
      });
    })(i, b);
    grid.appendChild(b);
    gs.tiles.push(b);
  }
})();
function gsSettle() {
  gs.active = false;
  nxEl("goldscratchAll").disabled = true;
  nxEl("goldscratchNew").disabled = false;
  var lines = [];
  for (var r = 0; r < 4; r++) lines.push([r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3]);
  for (var c = 0; c < 4; c++) lines.push([c, c + 4, c + 8, c + 12]);
  lines.push([0, 5, 10, 15]);
  lines.push([3, 6, 9, 12]);
  var total = 0,
    winLines = 0;
  lines.forEach(function (L) {
    var s = gs.syms[L[0]];
    if (
      L.every(function (i) {
        return gs.syms[i] === s;
      })
    ) {
      total += gs.bet * GS_PAY[s];
      winLines++;
      L.forEach(function (i) {
        gs.tiles[i].classList.add("linewin");
      });
    }
  });
  nxFinish({
    scr: "scr-goldscratch",
    key: "goldscratch",
    name: "Gold Rush Scratch",
    bet: gs.bet,
    payout: total,
    msg: "goldscratchMsg",
    winText:
      winLines +
      " winning line" +
      (winLines === 1 ? "" : "s") +
      " - you collect " +
      fmt(total) +
      " fun credits.",
    loseText:
      "No full line of 4 matched. Your bet of " +
      fmt(gs.bet) +
      " fun credits is lost. Balance: " +
      fmt(bal) +
      " fun credits.",
    partText:
      winLines +
      " winning line" +
      (winLines === 1 ? "" : "s") +
      " paid back " +
      fmt(total) +
      " of your " +
      fmt(gs.bet) +
      " fun credits bet.",
    note: winLines + " line" + (winLines === 1 ? "" : "s"),
  });
}
function gsOpen(i, btn) {
  if (!gs.active || btn.classList.contains("open")) return;
  btn.classList.add("open");
  btn.innerHTML = symHTML(gs.syms[i]);
  btn.disabled = true;
  gs.open++;
  sfx.chip();
  if (gs.open >= 16) gsSettle();
}
nxEl("goldscratchNew").addEventListener("click", function () {
  if (gs.active) return;
  var bet = readBet(nxEl("goldscratchBet"));
  if (bet === null) return;
  addBal(-bet);
  gs.bet = bet;
  gs.open = 0;
  gs.syms = [];
  for (var i = 0; i < 16; i++) gs.syms.push(pickWeighted(GS_W));
  gs.tiles.forEach(function (t) {
    t.className = "stile";
    t.textContent = "?";
    t.innerHTML = "?";
    t.disabled = false;
  });
  gs.active = true;
  nxEl("goldscratchNew").disabled = true;
  nxEl("goldscratchAll").disabled = false;
  setMsg(
    "goldscratchMsg",
    "Card bought. Tap the tiles to scratch, or scratch all at once.",
    "info",
  );
});
nxEl("goldscratchAll").addEventListener("click", function () {
  if (!gs.active) return;
  gs.tiles.forEach(function (t, i) {
    if (!t.classList.contains("open")) gsOpen(i, t);
  });
});

/* ================= 67. Daily Draw ================= */
var DD_PAY = { "5B": 40000, 5: 4000, "4B": 800, 4: 200, "3B": 100, 3: 35, "2B": 25, "1B": 1 };
var dd = { picks: {}, bonus: 0, btns: [] };
(function buildDailyDraw() {
  var grid = nxEl("dailydrawGrid");
  for (var n = 1; n <= 36; n++) {
    var b = document.createElement("button");
    b.className = "lnum";
    b.textContent = n;
    b.setAttribute("aria-label", "Number " + n);
    (function (num, btn) {
      btn.addEventListener("click", function () {
        if (dd.picks[num]) {
          delete dd.picks[num];
          btn.classList.remove("picked");
        } else {
          if (Object.keys(dd.picks).length >= 5) {
            setMsg(
              "dailydrawMsg",
              "You can pick at most 5 numbers. Tap a picked number to remove it.",
              "lose",
            );
            return;
          }
          dd.picks[num] = true;
          btn.classList.add("picked");
        }
        sfx.click();
        nxEl("dailydrawCount").textContent = Object.keys(dd.picks).length + " / 5";
      });
    })(n, b);
    grid.appendChild(b);
    dd.btns.push(b);
  }
  var brow = nxEl("dailydrawBonusPick");
  for (var k = 1; k <= 10; k++) {
    var bb = document.createElement("button");
    bb.className = "pickbtn";
    bb.textContent = k;
    bb.setAttribute("data-v", k);
    brow.appendChild(bb);
  }
})();
nxPickRow("dailydrawBonusPick", function (v) {
  dd.bonus = Number(v);
  nxEl("dailydrawBonusShow").textContent = v;
});
nxEl("dailydrawQuick").addEventListener("click", function () {
  dd.picks = {};
  dd.btns.forEach(function (b) {
    b.classList.remove("picked", "drawn", "hit");
  });
  var pool = [];
  for (var n = 1; n <= 36; n++) pool.push(n);
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  pool.slice(0, 5).forEach(function (num) {
    dd.picks[num] = true;
    dd.btns[num - 1].classList.add("picked");
  });
  dd.bonus = 1 + Math.floor(Math.random() * 10);
  nxEl("dailydrawBonusShow").textContent = dd.bonus;
  $$("#dailydrawBonusPick .pickbtn").forEach(function (b) {
    b.classList.toggle("on", Number(b.getAttribute("data-v")) === dd.bonus);
  });
  nxEl("dailydrawCount").textContent = "5 / 5";
  sfx.click();
});
nxEl("dailydrawDraw").addEventListener("click", function () {
  if (Object.keys(dd.picks).length !== 5) {
    setMsg("dailydrawMsg", "Pick exactly 5 numbers first - or tap Quick pick.", "lose");
    return;
  }
  if (!dd.bonus) {
    setMsg("dailydrawMsg", "Pick your bonus number (1 to 10) first.", "lose");
    return;
  }
  var bet = readBet(nxEl("dailydrawBet"));
  if (bet === null) return;
  addBal(-bet);
  dd.btns.forEach(function (b) {
    b.classList.remove("drawn", "hit");
  });
  var pool = [];
  for (var n = 1; n <= 36; n++) pool.push(n);
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  var drawn = pool.slice(0, 5),
    bonusWin = 1 + Math.floor(Math.random() * 10);
  var matches = 0;
  drawn.forEach(function (num) {
    dd.btns[num - 1].classList.add("drawn");
    if (dd.picks[num]) {
      matches++;
      dd.btns[num - 1].classList.add("hit");
    }
  });
  var bHit = bonusWin === dd.bonus;
  nxEl("dailydrawResult").innerHTML =
    drawn
      .map(function (num) {
        return '<span class="drawnball">' + num + "</span>";
      })
      .join("") +
    '<span class="drawnball" style="background:radial-gradient(circle at 35% 30%, #4df0d4, #19e3c2 65%, #0a7a67); color:#04241d">B' +
    bonusWin +
    "</span>";
  nxEl("dailydrawMatch").textContent = matches + (bHit ? " + bonus" : "");
  var mult = DD_PAY[matches + (bHit ? "B" : "")] || 0;
  var payout = bet * mult;
  sfx.deal();
  nxFinish({
    scr: "scr-dailydraw",
    key: "dailydraw",
    name: "Daily Draw",
    bet: bet,
    payout: payout,
    msg: "dailydrawMsg",
    winText:
      "Drawn: " +
      drawn.join(", ") +
      " plus bonus " +
      bonusWin +
      ". You matched " +
      matches +
      (bHit ? " plus the bonus" : "") +
      " - you collect " +
      fmt(payout) +
      " fun credits.",
    loseText:
      "Drawn: " +
      drawn.join(", ") +
      " plus bonus " +
      bonusWin +
      ". You matched " +
      matches +
      (bHit ? " plus the bonus" : "") +
      " - no paying tier. Your bet of " +
      fmt(bet) +
      " fun credits is lost. Balance: " +
      fmt(bal) +
      " fun credits.",
    pushText:
      "Drawn: " +
      drawn.join(", ") +
      " plus bonus " +
      bonusWin +
      ". One match plus the bonus returns your bet of " +
      fmt(bet) +
      " fun credits.",
    note: matches + " matches" + (bHit ? " + bonus" : ""),
  });
});

/* ================= 68. Deep Sea Catch ================= */
var ds = { active: false, bet: 0, pos: 0, dir: 1, iv: 0 };
function dsZone(p) {
  return p <= 30 ? 0.5 : p <= 55 ? 1 : p <= 75 ? 2 : p <= 90 ? 4 : 10;
}
function dsZoneName(p) {
  return p <= 30
    ? "Shallow - zone x0.5"
    : p <= 55
      ? "Mid water - zone x1"
      : p <= 75
        ? "Deep - zone x2"
        : p <= 90
          ? "Abyss - zone x4"
          : "Treasure - zone x10";
}
nxEl("deepseaStart").addEventListener("click", function () {
  if (ds.active) return;
  var bet = readBet(nxEl("deepseaBet"));
  if (bet === null) return;
  addBal(-bet);
  ds.bet = bet;
  ds.pos = 0;
  ds.dir = 1;
  ds.active = true;
  nxEl("deepseaLine").style.height = "0px";
  nxEl("deepseaZone").textContent = "Sweeping - drop when ready";
  nxEl("deepseaStart").disabled = true;
  nxEl("deepseaDrop").disabled = false;
  setMsg(
    "deepseaMsg",
    "The marker is sweeping. Tap Drop hook over a deep zone - take as long as you like.",
    "info",
  );
  ds.iv = setInterval(function () {
    ds.pos += ds.dir * 1.7;
    if (ds.pos >= 100) {
      ds.pos = 100;
      ds.dir = -1;
    }
    if (ds.pos <= 0) {
      ds.pos = 0;
      ds.dir = 1;
    }
    nxEl("deepseaMark").style.left = ds.pos + "%";
  }, 20);
});
nxEl("deepseaDrop").addEventListener("click", function () {
  if (!ds.active) return;
  ds.active = false;
  clearInterval(ds.iv);
  nxEl("deepseaDrop").disabled = true;
  var zone = dsZone(ds.pos);
  nxEl("deepseaZone").textContent = dsZoneName(ds.pos);
  nxEl("deepseaLine").style.height = "110px";
  sfx.deal();
  setTimeout(function () {
    var payout = Math.min(Math.floor(ds.bet * zone * 0.4), ds.bet * 4);
    nxEl("deepseaStart").disabled = false;
    nxFinish({
      scr: "scr-deepsea",
      key: "deepsea",
      name: "Deep Sea Catch",
      bet: ds.bet,
      payout: payout,
      msg: "deepseaMsg",
      winText:
        "Hook down at " +
        Math.round(ds.pos) +
        "% - " +
        dsZoneName(ds.pos) +
        ". You collect " +
        fmt(payout) +
        " fun credits.",
      loseText:
        "Hook down at " +
        Math.round(ds.pos) +
        "% - " +
        dsZoneName(ds.pos) +
        " paid nothing back. Balance: " +
        fmt(bal) +
        " fun credits.",
      partText:
        "Hook down at " +
        Math.round(ds.pos) +
        "% - " +
        dsZoneName(ds.pos) +
        ", so " +
        fmt(payout) +
        " of your " +
        fmt(ds.bet) +
        " fun credits come back.",
      note: dsZoneName(ds.pos),
    });
  }, 650);
});

/* ================= 69. Virtual Football ================= */
var vfPick = "H";
nxPickRow("vfootballPick", function (v) {
  vfPick = v;
});
var VF_HOME = [
  [0, 24],
  [1, 36],
  [2, 24],
  [3, 11],
  [4, 5],
];
var VF_AWAY = [
  [0, 32],
  [1, 36],
  [2, 20],
  [3, 9],
  [4, 3],
];
var VF_ODDS = { H: 2.2, D: 3.55, A: 3.05 };
var VF_NAMES = { H: "Home win", D: "Draw", A: "Away win" };
nxEl("vfootballPlay").addEventListener("click", function () {
  var bet = readBet(nxEl("vfootballBet"));
  if (bet === null) return;
  addBal(-bet);
  nxEl("vfootballPlay").disabled = true;
  var hg = pickWeighted(VF_HOME),
    ag = pickWeighted(VF_AWAY);
  var events = [];
  for (var i = 0; i < hg; i++) events.push("H");
  for (var j = 0; j < ag; j++) events.push("A");
  for (var k = events.length - 1; k > 0; k--) {
    var m = Math.floor(Math.random() * (k + 1));
    var t = events[k];
    events[k] = events[m];
    events[m] = t;
  }
  var h = 0,
    a = 0,
    step = 0;
  nxEl("vfootballScore").textContent = "0 : 0";
  nxEl("vfootballClock").textContent = "Kick off";
  setMsg("vfootballMsg", "The match is playing out - goals appear one by one.", "info");
  function reveal() {
    if (step >= events.length) {
      var result = h > a ? "H" : h < a ? "A" : "D";
      nxEl("vfootballClock").textContent = "Full time";
      var payout = vfPick === result ? Math.floor(bet * VF_ODDS[result]) : 0;
      nxEl("vfootballPlay").disabled = false;
      nxFinish({
        scr: "scr-vfootball",
        key: "vfootball",
        name: "Virtual Football",
        bet: bet,
        payout: payout,
        msg: "vfootballMsg",
        winText:
          "Full time: Harbor City " +
          h +
          " - " +
          a +
          " Northfield United. Your " +
          VF_NAMES[vfPick] +
          " bet wins at x" +
          VF_ODDS[result] +
          " - you collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          "Full time: Harbor City " +
          h +
          " - " +
          a +
          " Northfield United - " +
          VF_NAMES[result] +
          ". Your " +
          VF_NAMES[vfPick] +
          " bet loses " +
          fmt(bet) +
          " fun credits. Balance: " +
          fmt(bal) +
          " fun credits.",
        note: "score " + h + "-" + a + ", you picked " + VF_NAMES[vfPick],
      });
      return;
    }
    if (events[step] === "H") h++;
    else a++;
    step++;
    nxEl("vfootballScore").textContent = h + " : " + a;
    nxEl("vfootballClock").textContent =
      "Goal " + step + " of " + events.length + (events.length ? "" : "");
    sfx.gem();
    setTimeout(reveal, 520);
  }
  if (events.length === 0) {
    nxEl("vfootballClock").textContent = "No goals - full time";
    setTimeout(reveal, 500);
  } else setTimeout(reveal, 500);
});

