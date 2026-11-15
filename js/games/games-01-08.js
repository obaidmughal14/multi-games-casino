"use strict";
/* ================= 1. Fruit Fortune Slots ================= */
var FRUIT = {
  weights: [
    ["cherry", 24],
    ["lemon", 22],
    ["grape", 17],
    ["bell", 12],
    ["seven", 5],
    ["wild", 3],
    ["scatter", 3],
  ],
  pay: {
    cherry: [4, 13, 42],
    lemon: [4, 16, 52],
    grape: [6, 22, 75],
    bell: [10, 38, 110],
    seven: [25, 100, 500],
    wild: [50, 200, 1000],
  },
  scatterPay: { 3: 2, 4: 5, 5: 20 },
};
var fruitCells = buildCells($("#fruitGrid"), 3, 5);
var fruit = { spinning: false, fs: 0, fsWin: 0, fsBet: 100 };
function fruitSetGrid(g) {
  for (var r = 0; r < 3; r++)
    for (var c = 0; c < 5; c++) fruitCells[r][c].innerHTML = symHTML(g[r][c]);
}
fruitSetGrid(randomGrid(FRUIT.weights, 3, 5, "scatter", 2));
$("#fruitBet").addEventListener("input", function () {
  $("#fruitBetShow").textContent = fmt(clampBet(this.value, 100000));
});
function fruitSpin() {
  if (fruit.spinning) return;
  var isFree = fruit.fs > 0;
  var bet;
  if (isFree) {
    bet = fruit.fsBet;
    fruit.fs--;
  } else {
    bet = readBet($("#fruitBet"));
    if (bet === null) return;
    if (bet % 10 !== 0) {
      bet = Math.floor(bet / 10) * 10;
      if (bet < 10) bet = 10;
      $("#fruitBet").value = bet;
    }
    addBal(-bet);
  }
  fruit.spinning = true;
  $("#fruitSpin").disabled = true;
  $("#fruitBetShow").textContent = fmt(bet);
  clearWins(fruitCells);
  var finalGrid = randomGrid(FRUIT.weights, 3, 5, "scatter", 5);
  spinAnim(fruitCells, finalGrid, FRUIT.weights, function () {
    var lineBet = bet / 10;
    var res = evalLines(finalGrid, FRUIT.pay, lineBet, "wild");
    var sc = 0;
    finalGrid.forEach(function (row) {
      row.forEach(function (s) {
        if (s === "scatter") sc++;
      });
    });
    var scatWin = 0;
    if (sc >= 3) scatWin = bet * (FRUIT.scatterPay[Math.min(sc, 5)] || 20);
    var total = res.total + scatWin;
    markWins(fruitCells, res.winCells);
    $("#fruitWin").textContent = fmt(total);
    if (isFree) fruit.fsWin += total;
    if (total > 0) {
      addBal(total);
      setMsg(
        "fruitMsg",
        (isFree ? "Free spin win: " : "You won ") +
          fmt(total) +
          " fun credits" +
          (res.lineWins.length
            ? " across " + res.lineWins.length + " line" + (res.lineWins.length > 1 ? "s" : "")
            : "") +
          (scatWin ? " including a scatter prize" : "") +
          ".",
        "win",
      );
      if (total >= bet * 10) sfx.bigwin();
      else sfx.win();
      showWinBanner(
        $("#scr-fruit"),
        total >= bet * 20 ? "Big Win" : "Win",
        total,
        total >= bet * 20,
        "x" + (total / Math.max(1, bet)).toFixed(1),
      );
      pushWin("You", total, "Fruit Fortune Slots");
    } else {
      setMsg(
        "fruitMsg",
        (isFree ? "Free spin: no win this time." : "No win this time. Spin again.") +
          " Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    logHist(
      "fruit",
      isFree ? 'Free spin - <span class="hw">won ' + fmt(total) + "</span>" : histLine(bet, total),
    );
    recordRound("fruit", isFree ? 0 : bet, total);
    fruit.spinning = false;
    if (sc >= 3 && !isFree) {
      fruit.fs = 8;
      fruit.fsBet = bet;
      fruit.fsWin = 0;
      setMsg(
        "fruitMsg",
        sc +
          " scatters! You won 8 free spins plus " +
          fmt(scatWin) +
          " fun credits. Free spins start now.",
        "win",
      );
      sfx.bigwin();
    }
    if (fruit.fs > 0) {
      $("#fruitFs").classList.add("on");
      $("#fruitFs").textContent =
        "Free spins left: " + fruit.fs + " - won so far: " + fmt(fruit.fsWin);
      setTimeout(function () {
        if (currentScreen === "scr-fruit" || fruit.fs > 0) fruitSpin();
      }, 1100);
    } else {
      $("#fruitFs").classList.remove("on");
      $("#fruitSpin").disabled = false;
    }
    renderBal(total > 0);
  });
}
$("#fruitSpin").addEventListener("click", fruitSpin);

/* ================= 2. Golden Coins Slots ================= */
var GOLD = {
  weights: [
    ["clover", 24],
    ["pearl", 22],
    ["ingot", 17],
    ["lantern", 12],
    ["goldbar", 6],
    ["crown", 2],
    ["coin", 2],
  ],
  pay: {
    clover: [5, 17, 52],
    pearl: [6, 21, 65],
    ingot: [9, 33, 95],
    lantern: [11, 43, 145],
    goldbar: [29, 118, 580],
    crown: [58, 242, 1180],
  },
};
var JP = { mini: 250, minor: 1250, major: 12500, grand: 125000 };
var JP_SEED = { mini: 250, minor: 1250, major: 12500, grand: 125000 };
function renderJP() {
  $("#jpMini").textContent = fmt(JP.mini);
  $("#jpMinor").textContent = fmt(JP.minor);
  $("#jpMajor").textContent = fmt(JP.major);
  $("#jpGrand").textContent = fmt(JP.grand);
}
setInterval(function () {
  JP.mini += Math.floor(Math.random() * 3);
  JP.minor += Math.floor(Math.random() * 5);
  JP.major += Math.floor(Math.random() * 9);
  JP.grand += Math.floor(Math.random() * 21);
  renderJP();
}, 3000);
var goldenCells = buildCells($("#goldenGrid"), 3, 5);
var golden = { spinning: false };
function goldenSetGrid(g) {
  for (var r = 0; r < 3; r++)
    for (var c = 0; c < 5; c++) goldenCells[r][c].innerHTML = symHTML(g[r][c]);
}
goldenSetGrid(randomGrid(GOLD.weights, 3, 5, "coin", 2));
renderJP();
$("#goldenBet").addEventListener("input", function () {
  $("#goldenBetShow").textContent = fmt(clampBet(this.value, 100000));
});
$("#goldenSpin").addEventListener("click", function () {
  if (golden.spinning) return;
  var bet = readBet($("#goldenBet"));
  if (bet === null) return;
  if (bet % 10 !== 0) {
    bet = Math.floor(bet / 10) * 10;
    if (bet < 10) bet = 10;
    $("#goldenBet").value = bet;
  }
  addBal(-bet);
  JP.grand += Math.max(1, Math.floor(bet * 0.01));
  JP.major += Math.max(1, Math.floor(bet * 0.005));
  golden.spinning = true;
  $("#goldenSpin").disabled = true;
  $("#goldenBetShow").textContent = fmt(bet);
  clearWins(goldenCells);
  var finalGrid = randomGrid(GOLD.weights, 3, 5, "coin", 8);
  spinAnim(goldenCells, finalGrid, GOLD.weights, function () {
    var res = evalLines(finalGrid, GOLD.pay, bet / 10, "crown");
    var coins = 0;
    finalGrid.forEach(function (row) {
      row.forEach(function (s) {
        if (s === "coin") coins++;
      });
    });
    var total = res.total,
      jpText = "";
    if (coins >= 3) {
      var tier = coins >= 6 ? "grand" : coins === 5 ? "major" : coins === 4 ? "minor" : "mini";
      total += JP[tier];
      jpText = " " + tier.toUpperCase() + " JACKPOT: " + fmt(JP[tier]) + " fun credits!";
      JP[tier] = JP_SEED[tier];
      renderJP();
      finalGrid.forEach(function (row, r) {
        row.forEach(function (s, c) {
          if (s === "coin") goldenCells[r][c].classList.add("win");
        });
      });
    }
    markWins(goldenCells, res.winCells);
    $("#goldenWin").textContent = fmt(total);
    if (total > 0) {
      addBal(total);
      setMsg("goldenMsg", "You won " + fmt(total) + " fun credits." + jpText, "win");
      if (jpText || total >= bet * 10) sfx.bigwin();
      else sfx.win();
      showWinBanner(
        $("#scr-golden"),
        jpText ? tier.toUpperCase() + " Jackpot" : total >= bet * 20 ? "Big Win" : "Win",
        total,
        !!jpText || total >= bet * 20,
        "x" + (total / Math.max(1, bet)).toFixed(1),
      );
      pushWin("You", total, "Golden Coins Slots");
    } else {
      setMsg(
        "goldenMsg",
        "No win this time. The jackpots keep growing. Balance: " + fmt(bal) + " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    logHist("golden", histLine(bet, total) + (jpText ? " - jackpot hit" : ""));
    recordRound("golden", bet, total);
    golden.spinning = false;
    $("#goldenSpin").disabled = false;
    renderBal(total > 0);
  });
});

/* ================= 3. Lucky 7s Classic ================= */
var L7 = {
  weights: [
    ["lemon", 18],
    ["cherry", 16],
    ["bell", 13],
    ["bar", 12],
    ["bar2", 8],
    ["seven", 6],
    ["blank", 23],
  ],
};
var l7Cells = buildCells($("#lucky7Grid"), 3, 3);
var l7 = { spinning: false };
function l7SetGrid(g) {
  for (var r = 0; r < 3; r++)
    for (var c = 0; c < 3; c++) l7Cells[r][c].innerHTML = symHTML(g[r][c]);
}
l7SetGrid(randomGrid(L7.weights, 3, 3, "__none", 0));
$("#lucky7Bet").addEventListener("input", function () {
  $("#lucky7BetShow").textContent = fmt(clampBet(this.value, 100000));
});
$("#lucky7Spin").addEventListener("click", function () {
  if (l7.spinning) return;
  var bet = readBet($("#lucky7Bet"));
  if (bet === null) return;
  addBal(-bet);
  l7.spinning = true;
  $("#lucky7Spin").disabled = true;
  $("#lucky7BetShow").textContent = fmt(bet);
  l7Cells.forEach(function (row) {
    row.forEach(function (c) {
      c.classList.remove("win", "dim");
      c.classList.add("spinning");
    });
  });
  var finalGrid = randomGrid(L7.weights, 3, 3, "__none", 0);
  var col = 0;
  var iv = setInterval(function () {
    for (var c = 0; c < 3; c++) {
      if (c < col) continue;
      for (var r = 0; r < 3; r++) l7Cells[r][c].innerHTML = symHTML(pickWeighted(L7.weights));
    }
    sfx.tick();
  }, 70);
  function stopCol() {
    if (col >= 3) {
      clearInterval(iv);
      var line = [finalGrid[1][0], finalGrid[1][1], finalGrid[1][2]];
      var mult = 0,
        label = "";
      if (line[0] === "seven" && line[1] === "seven" && line[2] === "seven") {
        mult = 500;
        label = "Three red 7s";
      } else if (line[0] === "bar2" && line[1] === "bar2" && line[2] === "bar2") {
        mult = 100;
        label = "Three 2BARs";
      } else if (line[0] === "bar" && line[1] === "bar" && line[2] === "bar") {
        mult = 40;
        label = "Three BARs";
      } else if (line[0] === "bell" && line[1] === "bell" && line[2] === "bell") {
        mult = 25;
        label = "Three bells";
      } else if (line[0] === "cherry" && line[1] === "cherry" && line[2] === "cherry") {
        mult = 20;
        label = "Three cherries";
      } else if (line[0] === "lemon" && line[1] === "lemon" && line[2] === "lemon") {
        mult = 15;
        label = "Three lemons";
      } else if (
        line.every(function (s) {
          return s === "bar" || s === "bar2";
        })
      ) {
        mult = 8;
        label = "Any BAR mix";
      } else if (line[0] === "cherry" && line[1] === "cherry") {
        mult = 5;
        label = "Two cherries";
      } else if (line[0] === "cherry") {
        mult = 2;
        label = "Cherry on reel one";
      }
      var total = bet * mult;
      for (var r = 0; r < 3; r++)
        for (var c = 0; c < 3; c++) {
          if (r === 1 && mult > 0) l7Cells[r][c].classList.add("win");
          else if (r !== 1) l7Cells[r][c].classList.add("dim");
        }
      $("#lucky7Win").textContent = fmt(total);
      if (total > 0) {
        addBal(total);
        setMsg(
          "lucky7Msg",
          label + " - you won " + fmt(total) + " fun credits (" + mult + " x bet).",
          "win",
        );
        if (mult >= 100) sfx.bigwin();
        else sfx.win();
        showWinBanner(
          $("#scr-lucky7"),
          mult >= 100 ? "Jackpot" : "Win",
          total,
          mult >= 100,
          "x" + mult,
        );
        pushWin("You", total, "Lucky 7s Classic");
      } else {
        setMsg(
          "lucky7Msg",
          "The middle line missed. Spin again. Balance: " + fmt(bal) + " fun credits.",
          "lose",
        );
        sfx.lose();
      }
      logHist("lucky7", histLine(bet, total) + (label ? " - " + label : ""));
      recordRound("lucky7", bet, total);
      l7.spinning = false;
      $("#lucky7Spin").disabled = false;
      renderBal(total > 0);
      return;
    }
    for (var r = 0; r < 3; r++) {
      l7Cells[r][col].innerHTML = symHTML(finalGrid[r][col]);
      l7Cells[r][col].classList.remove("spinning");
      l7Cells[r][col].classList.add("landed");
    }
    sfx.chip();
    col++;
    setTimeout(stopCol, 220);
  }
  setTimeout(stopCol, 420);
});

/* ================= 4. Roulette ================= */
var R_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
var REDS = {};
[1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].forEach(function (n) {
  REDS[n] = true;
});
var SEG = 360 / 37;
(function buildWheel() {
  var w = $("#rwheel"),
    parts = [];
  R_ORDER.forEach(function (n, i) {
    var col = n === 0 ? "#0d7a43" : REDS[n] ? "#a11f28" : "#171a21";
    parts.push(col + " " + (i * SEG).toFixed(3) + "deg " + ((i + 1) * SEG).toFixed(3) + "deg");
    var lab = document.createElement("span");
    lab.className = "rnum";
    lab.style.transform = "rotate(" + (i * SEG + SEG / 2).toFixed(2) + "deg)";
    lab.innerHTML = "<b>" + n + "</b>";
    w.appendChild(lab);
  });
  w.style.background = "conic-gradient(" + parts.join(",") + ")";
})();
(function buildBoard() {
  var b = $("#rboard");
  var zero = document.createElement("button");
  zero.className = "spot g zero";
  zero.setAttribute("data-spot", "n0");
  zero.textContent = "0";
  b.appendChild(zero);
  for (var colI = 0; colI < 12; colI++) {
    [3, 2, 1].forEach(function (base) {
      var n = base + colI * 3;
      var btn = document.createElement("button");
      btn.className = "spot " + (REDS[n] ? "r" : "b");
      btn.setAttribute("data-spot", "n" + n);
      btn.textContent = n;
      b.appendChild(btn);
    });
  }
})();
var rbets = {},
  rstack = [],
  rchipVal = 25,
  rrot = 0,
  brot = 0,
  rSpinning = false;
function rTotal() {
  return Object.keys(rbets).reduce(function (s, k) {
    return s + rbets[k];
  }, 0);
}
function renderRBets() {
  $$("#scr-roulette .spot").forEach(function (sp) {
    var k = sp.getAttribute("data-spot");
    var old = $(".amt", sp);
    if (old) old.remove();
    sp.classList.toggle("sel", !!rbets[k]);
    if (rbets[k]) {
      var badge = document.createElement("span");
      badge.className = "amt";
      badge.textContent = fmt(rbets[k]);
      sp.appendChild(badge);
    }
  });
  $("#rTotalShow").textContent = fmt(rTotal());
}
$$("#rchips .rchip").forEach(function (ch) {
  ch.addEventListener("click", function () {
    $$("#rchips .rchip").forEach(function (x) {
      x.classList.remove("on");
    });
    ch.classList.add("on");
    rchipVal = Number(ch.getAttribute("data-v"));
    sfx.chip();
  });
});
$$("#scr-roulette .spot").forEach(function (sp) {
  sp.addEventListener("click", function () {
    if (rSpinning) return;
    var k = sp.getAttribute("data-spot");
    rbets[k] = (rbets[k] || 0) + rchipVal;
    rstack.push(k);
    sfx.chip();
    renderRBets();
  });
});
$("#rClear").addEventListener("click", function () {
  if (rSpinning) return;
  rbets = {};
  rstack = [];
  renderRBets();
  sfx.click();
});
$("#rUndo").addEventListener("click", function () {
  if (rSpinning || !rstack.length) return;
  var k = rstack.pop();
  rbets[k] -= rchipVal;
  if (rbets[k] <= 0) delete rbets[k];
  renderRBets();
  sfx.click();
});
function rSpotWin(k, n) {
  if (k.charAt(0) === "n") return Number(k.slice(1)) === n ? 36 : 0;
  if (n === 0) return 0;
  switch (k) {
    case "red":
      return REDS[n] ? 2 : 0;
    case "black":
      return !REDS[n] ? 2 : 0;
    case "odd":
      return n % 2 === 1 ? 2 : 0;
    case "even":
      return n % 2 === 0 ? 2 : 0;
    case "low":
      return n <= 18 ? 2 : 0;
    case "high":
      return n >= 19 ? 2 : 0;
    case "doz1":
      return n <= 12 ? 3 : 0;
    case "doz2":
      return n >= 13 && n <= 24 ? 3 : 0;
    case "doz3":
      return n >= 25 ? 3 : 0;
  }
  return 0;
}
$("#rSpin").addEventListener("click", function () {
  if (rSpinning) return;
  var total = rTotal();
  if (total <= 0) {
    setMsg("rouletteMsg", "Place at least one chip on the board first.", "lose");
    return;
  }
  if (total > bal) {
    setMsg(
      "rouletteMsg",
      "Your total bet is higher than your balance. Clear some chips" +
        (bal < 100 ? " or use the Refill button at the top." : "."),
      "lose",
    );
    return;
  }
  addBal(-total);
  rSpinning = true;
  $("#rSpin").disabled = true;
  $("#rClear").disabled = true;
  $("#rUndo").disabled = true;
  setMsg("rouletteMsg", "No more bets. The wheel is spinning...", "info");
  var win = R_ORDER[Math.floor(Math.random() * 37)];
  var idx = R_ORDER.indexOf(win);
  var center = idx * SEG + SEG / 2;
  var desired = (((360 - center) % 360) + 360) % 360;
  var delta = (((desired - (rrot % 360)) % 360) + 360) % 360;
  rrot += 360 * 6 + delta;
  var wheel = $("#rwheel");
  wheel.style.transition = "transform 5.2s cubic-bezier(.12,.72,.08,1)";
  wheel.style.transform = "rotate(" + rrot + "deg)";
  brot -= 360 * 7 + Math.floor(Math.random() * 120);
  var ring = $("#rballRing");
  ring.style.transition = "transform 5.2s cubic-bezier(.12,.72,.08,1)";
  ring.style.transform = "rotate(" + brot + "deg)";
  var tickCount = 0;
  var tickIv = setInterval(function () {
    sfx.tick();
    if (++tickCount > 22) clearInterval(tickIv);
  }, 210);
  setTimeout(function () {
    var colName = win === 0 ? "green" : REDS[win] ? "red" : "black";
    $("#rHub").innerHTML = win + "<br/>" + colName;
    var payout = 0;
    Object.keys(rbets).forEach(function (k) {
      payout += rbets[k] * rSpotWin(k, win);
    });
    var last = $("#rlastNums");
    var chipEl = document.createElement("span");
    chipEl.className = "n " + (win === 0 ? "g" : REDS[win] ? "r" : "b");
    chipEl.textContent = win;
    last.insertBefore(chipEl, last.firstChild);
    while (last.children.length > 10) last.removeChild(last.lastChild);
    if (payout > 0) {
      addBal(payout);
      setMsg(
        "rouletteMsg",
        win +
          " " +
          colName +
          ". You won " +
          fmt(payout) +
          " fun credits (profit " +
          fmt(payout - total) +
          ").",
        "win",
      );
      if (payout >= total * 5) sfx.bigwin();
      else sfx.win();
      showWinBanner(
        $("#scr-roulette"),
        "Win",
        payout,
        payout >= total * 5,
        "x" + (payout / Math.max(1, total)).toFixed(1),
      );
      pushWin("You", payout, "Roulette");
    } else {
      setMsg(
        "rouletteMsg",
        win +
          " " +
          colName +
          ". No winning bets this spin - " +
          fmt(total) +
          " fun credits lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    logHist(
      "roulette",
      "Ball landed <b>" + win + " " + colName + "</b> - " + histLine(total, payout),
    );
    recordRound("roulette", total, payout);
    rbets = {};
    rstack = [];
    renderRBets();
    rSpinning = false;
    $("#rSpin").disabled = false;
    $("#rClear").disabled = false;
    $("#rUndo").disabled = false;
    renderBal(payout > 0);
  }, 5450);
});
renderRBets();

/* ================= 5. Blackjack ================= */
var SUITS = [
  ["s", "\u2660", false],
  ["h", "\u2665", true],
  ["d", "\u2666", true],
  ["c", "\u2663", false],
];
var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
var bj = { active: false, deck: [], p: [], d: [], bet: 0, acted: false };
function bjDeck() {
  var d = [];
  SUITS.forEach(function (s) {
    RANKS.forEach(function (r) {
      d.push({ r: r, suit: s[1], red: s[2] });
    });
  });
  for (var i = d.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = d[i];
    d[i] = d[j];
    d[j] = t;
  }
  return d;
}
function bjVal(hand) {
  var v = 0,
    aces = 0;
  hand.forEach(function (c) {
    if (c.r === "A") {
      aces++;
      v += 11;
    } else if (c.r === "K" || c.r === "Q" || c.r === "J") v += 10;
    else v += Number(c.r);
  });
  while (v > 21 && aces > 0) {
    v -= 10;
    aces--;
  }
  return v;
}
function bjCardHTML(c, faceDown) {
  if (faceDown) return '<div class="pcard back dealt">?</div>';
  return (
    '<div class="pcard dealt' +
    (c.red ? " red" : "") +
    '"><div>' +
    c.r +
    '</div><div class="suit">' +
    c.suit +
    "</div></div>"
  );
}
function bjRender(hideHole) {
  $("#bjPHand").innerHTML = bj.p
    .map(function (c) {
      return bjCardHTML(c, false);
    })
    .join("");
  $("#bjDHand").innerHTML = bj.d
    .map(function (c, i) {
      return bjCardHTML(c, hideHole && i === 1);
    })
    .join("");
  var ps = $("#bjPScore"),
    ds = $("#bjDScore");
  if (bj.p.length) {
    ps.hidden = false;
    ps.textContent = bjVal(bj.p);
  } else ps.hidden = true;
  if (bj.d.length && !hideHole) {
    ds.hidden = false;
    ds.textContent = bjVal(bj.d);
  } else if (bj.d.length) {
    ds.hidden = false;
    ds.textContent = bjVal([bj.d[0]]);
  } else ds.hidden = true;
}
function bjSetBtns(deal, hit, stand, dbl) {
  $("#bjDeal").disabled = !deal;
  $("#bjHit").disabled = !hit;
  $("#bjStand").disabled = !stand;
  $("#bjDouble").disabled = !dbl;
}
function bjEnd(text, kind, credit, bannerTitle) {
  bj.active = false;
  logHist("blackjack", histLine(bj.bet, credit));
  recordRound("blackjack", bj.bet, credit);
  bjRender(false);
  if (credit > 0) addBal(credit);
  setMsg("bjMsg", credit === 0 ? text + " Balance: " + fmt(bal) + " fun credits." : text, kind);
  if (credit > bj.bet) {
    sfx.win();
    showWinBanner(
      $("#scr-blackjack"),
      bannerTitle || "Win",
      credit - 0,
      bannerTitle === "Blackjack",
      bannerTitle === "Blackjack" ? "blackjack pays 3 to 2" : null,
    );
    pushWin("You", credit, "Blackjack");
  } else if (credit === bj.bet && bj.bet > 0) {
    sfx.coin();
  } else if (credit === 0) {
    sfx.lose();
  }
  bjSetBtns(true, false, false, false);
  renderBal(credit > 0);
}
$("#bjDeal").addEventListener("click", function () {
  if (bj.active) return;
  var bet = readBet($("#bjBet"));
  if (bet === null) return;
  addBal(-bet);
  bj.bet = bet;
  bj.acted = false;
  bj.deck = bjDeck();
  bj.p = [bj.deck.pop(), bj.deck.pop()];
  bj.d = [bj.deck.pop(), bj.deck.pop()];
  bj.active = true;
  sfx.deal();
  bjRender(true);
  var pv = bjVal(bj.p),
    dv = bjVal(bj.d);
  if (pv === 21 && dv === 21) {
    bjEnd(
      "Both have blackjack - push. Your bet of " + fmt(bj.bet) + " is returned.",
      "info",
      bj.bet,
    );
    return;
  }
  if (pv === 21) {
    bjEnd(
      "Blackjack! You win " + fmt(Math.floor(bj.bet * 1.5)) + " fun credits profit (3 to 2).",
      "win",
      bj.bet + Math.floor(bj.bet * 1.5),
      "Blackjack",
    );
    return;
  }
  if (dv === 21) {
    bjEnd("Dealer has blackjack. You lose " + fmt(bj.bet) + " fun credits.", "lose", 0);
    return;
  }
  setMsg("bjMsg", "Your hand is " + pv + ". Hit, stand, or double.", "info");
  bjSetBtns(false, true, true, bal >= bj.bet);
});
$("#bjHit").addEventListener("click", function () {
  if (!bj.active) return;
  bj.acted = true;
  bj.p.push(bj.deck.pop());
  sfx.deal();
  bjRender(true);
  var pv = bjVal(bj.p);
  $("#bjDouble").disabled = true;
  if (pv > 21) {
    bjEnd("Bust with " + pv + ". You lose " + fmt(bj.bet) + " fun credits.", "lose", 0);
    return;
  }
  if (pv === 21) {
    bjDealerPlay();
    return;
  }
  setMsg("bjMsg", "Your hand is " + pv + ". Hit or stand.", "info");
});
function bjDealerPlay() {
  bjRender(false);
  var dv = bjVal(bj.d);
  while (dv < 17) {
    bj.d.push(bj.deck.pop());
    dv = bjVal(bj.d);
    bjRender(false);
  }
  var pv = bjVal(bj.p);
  if (dv > 21) {
    bjEnd(
      "Dealer busts with " + dv + ". You win " + fmt(bj.bet) + " fun credits profit.",
      "win",
      bj.bet * 2,
    );
    return;
  }
  if (pv > dv) {
    bjEnd(
      "You win " + pv + " against " + dv + " - profit " + fmt(bj.bet) + " fun credits.",
      "win",
      bj.bet * 2,
    );
    return;
  }
  if (pv < dv) {
    bjEnd(
      "Dealer wins " + dv + " against your " + pv + ". You lose " + fmt(bj.bet) + " fun credits.",
      "lose",
      0,
    );
    return;
  }
  bjEnd("Push at " + pv + ". Your bet of " + fmt(bj.bet) + " is returned.", "info", bj.bet);
}
$("#bjStand").addEventListener("click", function () {
  if (bj.active) {
    bj.acted = true;
    bjDealerPlay();
  }
});
$("#bjDouble").addEventListener("click", function () {
  if (!bj.active || bj.acted) return;
  if (bal < bj.bet) {
    setMsg("bjMsg", "Not enough balance left to double.", "lose");
    return;
  }
  addBal(-bj.bet);
  bj.bet *= 2;
  bj.acted = true;
  bj.p.push(bj.deck.pop());
  sfx.deal();
  var pv = bjVal(bj.p);
  bjRender(true);
  if (pv > 21) {
    bjEnd(
      "Bust with " + pv + " after doubling. You lose " + fmt(bj.bet) + " fun credits.",
      "lose",
      0,
    );
    return;
  }
  setMsg("bjMsg", "Doubled down to " + fmt(bj.bet) + ". Dealer plays now.", "info");
  setTimeout(bjDealerPlay, 650);
});
bjRender(false);

/* ================= 6. Mines ================= */
function comb(n, k) {
  if (k < 0 || k > n) return 0;
  var r = 1;
  for (var i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}
function minesMult(picks, mines) {
  if (picks <= 0) return 0;
  return (0.97 * comb(25, picks)) / comb(25 - mines, picks);
}
var mn = { active: false, mines: 5, bet: 0, mineSet: {}, picks: 0 };
var mnGrid = $("#minesGrid"),
  mnTiles = [];
(function buildMines() {
  for (var i = 0; i < 25; i++) {
    var b = document.createElement("button");
    b.className = "tile";
    b.disabled = true;
    b.setAttribute("aria-label", "Tile " + (i + 1));
    (function (idx) {
      b.addEventListener("click", function () {
        minesReveal(idx);
      });
    })(i);
    mnGrid.appendChild(b);
    mnTiles.push(b);
  }
})();
function minesUpdate() {
  var m = minesMult(mn.picks, mn.mines);
  $("#mnMult").textContent = "x" + m.toFixed(2);
  $("#mnNext").textContent =
    mn.active && mn.picks < 25 - mn.mines
      ? "x" + minesMult(mn.picks + 1, mn.mines).toFixed(2)
      : "-";
  $("#mnValue").textContent = fmt(Math.floor(mn.bet * m));
  $("#mnPicks").textContent = mn.picks;
  $("#mnCash").disabled = !(mn.active && mn.picks > 0);
  $("#mnCash").textContent =
    mn.active && mn.picks > 0 ? "Cash out " + fmt(Math.floor(mn.bet * m)) : "Cash out";
}
function minesRevealAll(hitIdx) {
  mnTiles.forEach(function (t, i) {
    t.disabled = true;
    if (mn.mineSet[i]) {
      t.innerHTML = '<svg><use href="#s-mine"/></svg>';
      t.classList.add(i === hitIdx ? "boom" : "revealed-mine");
    } else if (!t.classList.contains("open")) {
      t.innerHTML = '<svg><use href="#s-gem"/></svg>';
      t.style.opacity = ".45";
    }
  });
}
function minesReveal(i) {
  if (!mn.active || mnTiles[i].disabled) return;
  if (mn.mineSet[i]) {
    mn.active = false;
    minesRevealAll(i);
    sfx.boom();
    logHist(
      "mines",
      histLine(mn.bet, 0) +
        " - hit a mine after " +
        mn.picks +
        " gem" +
        (mn.picks === 1 ? "" : "s"),
    );
    recordRound("mines", mn.bet, 0);
    setMsg(
      "mnMsg",
      "Mine! The round is over and your bet of " +
        fmt(mn.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    $("#mnStart").disabled = false;
    minesUpdate();
    return;
  }
  mnTiles[i].disabled = true;
  mnTiles[i].classList.add("open");
  mnTiles[i].classList.add("flip");
  mnTiles[i].innerHTML = '<svg><use href="#s-gem"/></svg>';
  mn.picks++;
  sfx.gem();
  minesUpdate();
  if (mn.picks >= 25 - mn.mines) {
    minesCashOut(true);
  } else {
    setMsg(
      "mnMsg",
      "Gem found. Multiplier is now x" +
        minesMult(mn.picks, mn.mines).toFixed(2) +
        " - cash out or keep going.",
      "info",
    );
  }
}
function minesCashOut(auto) {
  if (!mn.active || mn.picks === 0) return;
  var val = Math.floor(mn.bet * minesMult(mn.picks, mn.mines));
  mn.active = false;
  addBal(val);
  logHist(
    "mines",
    histLine(mn.bet, val) + " - cashed out at x" + minesMult(mn.picks, mn.mines).toFixed(2),
  );
  recordRound("mines", mn.bet, val);
  minesRevealAll(-1);
  sfx.win();
  setMsg(
    "mnMsg",
    (auto ? "Grid cleared! " : "Cashed out. ") + "You collected " + fmt(val) + " fun credits.",
    "win",
  );
  showWinBanner(
    $("#scr-mines"),
    "Cashed Out",
    val,
    val >= mn.bet * 5,
    "x" + minesMult(mn.picks, mn.mines).toFixed(2),
  );
  pushWin("You", val, "Mines");
  $("#mnStart").disabled = false;
  minesUpdate();
  renderBal(true);
}
$("#mnStart").addEventListener("click", function () {
  if (mn.active) return;
  var bet = readBet($("#mnBet"));
  if (bet === null) return;
  addBal(-bet);
  mn.bet = bet;
  mn.mines = Number($("#mnCount").value);
  mn.picks = 0;
  mn.mineSet = {};
  var placed = 0;
  while (placed < mn.mines) {
    var i = Math.floor(Math.random() * 25);
    if (!mn.mineSet[i]) {
      mn.mineSet[i] = true;
      placed++;
    }
  }
  mnTiles.forEach(function (t) {
    t.disabled = false;
    t.innerHTML = "";
    t.className = "tile";
    t.style.opacity = "";
  });
  mn.active = true;
  $("#mnStart").disabled = true;
  setMsg("mnMsg", "Round started with " + mn.mines + " hidden mines. Reveal a tile.", "info");
  sfx.click();
  minesUpdate();
});
$("#mnCash").addEventListener("click", function () {
  minesCashOut(false);
});
minesUpdate();

/* ================= 7. Rocket Crash ================= */
var cr = { running: false, bet: 0, crashAt: 0, start: 0, raf: 0, mult: 1, hist: [] };
function crashPoint() {
  /* Standard crash formula: crash = 0.99 / (1 - random), floored to
         2 decimals and capped at x50. The 0.99 factor is the whole house
         edge (about 1 percent) - the draw is fair and never adjusted. */
  var r = Math.random();
  var v = 0.99 / (1 - r);
  if (v < 1) v = 1;
  if (v > 50) v = 50;
  return Math.floor(v * 100) / 100;
}
function renderCrashHist() {
  $("#crashHist").innerHTML = cr.hist
    .map(function (h) {
      return '<span class="histchip ' + (h >= 2 ? "hi" : "lo") + '">' + h.toFixed(2) + "x</span>";
    })
    .join("");
}
function crashDraw(m) {
  $("#crashMult").textContent = m.toFixed(2) + "x";
  var p = Math.min(1, (m - 1) / 9);
  var rocket = $("#rocketEl");
  rocket.style.left = 4 + p * 72 + "%";
  rocket.style.bottom = 6 + p * 62 + "%";
  rocket.style.transform = "rotate(" + (45 - p * 28) + "deg)";
  $("#crashTrail").style.width = p * 100 + "%";
}
function crashLoop() {
  if (!cr.running) return;
  var elapsed = performance.now() - cr.start;
  cr.mult = Math.exp(0.00022 * elapsed);
  if (cr.mult >= cr.crashAt) {
    cr.mult = cr.crashAt;
    crashDraw(cr.mult);
    cr.running = false;
    $("#crashMult").classList.add("crashed");
    $("#crashMult").textContent = "Crashed at " + cr.crashAt.toFixed(2) + "x";
    $("#rocketEl").classList.add("boom");
    sfx.boom();
    logHist("crash", histLine(cr.bet, 0) + " - crashed at " + cr.crashAt.toFixed(2) + "x");
    recordRound("crash", cr.bet, 0);
    $(".crashsky").classList.remove("flying");
    setMsg(
      "crashMsg",
      "Crashed at " +
        cr.crashAt.toFixed(2) +
        "x. Your bet of " +
        fmt(cr.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    cr.hist.unshift(cr.crashAt);
    if (cr.hist.length > 12) cr.hist.pop();
    renderCrashHist();
    $("#crLaunch").disabled = false;
    $("#crCash").disabled = true;
    return;
  }
  crashDraw(cr.mult);
  if (Math.random() < 0.3) sfx.tick();
  cr.raf = requestAnimationFrame(crashLoop);
}
$("#crLaunch").addEventListener("click", function () {
  if (cr.running) return;
  var bet = readBet($("#crBet"));
  if (bet === null) return;
  addBal(-bet);
  cr.bet = bet;
  cr.mult = 1;
  cr.crashAt = crashPoint();
  cr.start = performance.now();
  cr.running = true;
  $("#crashMult").classList.remove("crashed");
  $("#rocketEl").classList.remove("boom");
  $("#crLaunch").disabled = true;
  $("#crCash").disabled = false;
  $(".crashsky").classList.add("flying");
  setMsg("crashMsg", "Rocket is flying. Cash out before it crashes.", "info");
  sfx.coin();
  crashDraw(1);
  cr.raf = requestAnimationFrame(crashLoop);
});
$("#crCash").addEventListener("click", function () {
  if (!cr.running) return;
  cr.running = false;
  cancelAnimationFrame(cr.raf);
  var val = Math.floor(cr.bet * cr.mult);
  addBal(val);
  logHist("crash", histLine(cr.bet, val) + " - cashed out at " + cr.mult.toFixed(2) + "x");
  recordRound("crash", cr.bet, val);
  sfx.win();
  setMsg(
    "crashMsg",
    "Cashed out at " + cr.mult.toFixed(2) + "x - you collected " + fmt(val) + " fun credits.",
    "win",
  );
  showWinBanner($("#scr-crash"), "Cashed Out", val, cr.mult >= 5, "x" + cr.mult.toFixed(2));
  pushWin("You", val, "Rocket Crash");
  cr.hist.unshift(cr.crashAt);
  if (cr.hist.length > 12) cr.hist.pop();
  renderCrashHist();
  $(".crashsky").classList.remove("flying");
  $("#crLaunch").disabled = false;
  $("#crCash").disabled = true;
  renderBal(true);
});
renderCrashHist();

/* ================= 8. Lucky Wheel ================= */
var WSEGS = [
  { m: 0, c: "#39415a", w: 16 },
  { m: 1.5, c: "#0d7a43", w: 12 },
  { m: 0, c: "#39415a", w: 14 },
  { m: 2, c: "#2563eb", w: 11 },
  { m: 0.5, c: "#8a93a8", w: 13 },
  { m: 5, c: "#7c3aed", w: 4 },
  { m: 0, c: "#39415a", w: 14 },
  { m: 1.2, c: "#0fbfa3", w: 9 },
  { m: 0, c: "#39415a", w: 5 },
  { m: 3, c: "#d97706", w: 4 },
  { m: 0.8, c: "#5b8def", w: 3 },
  { m: 10, c: "#c0272d", w: 1 },
];
var WSEG = 30,
  wrot = 0,
  wSpinning = false;
(function buildLuckyWheel() {
  var w = $("#wwheel"),
    parts = [];
  WSEGS.forEach(function (s, i) {
    parts.push(s.c + " " + i * WSEG + "deg " + (i + 1) * WSEG + "deg");
    var lab = document.createElement("span");
    lab.className = "wseg";
    lab.style.transform = "rotate(" + (i * WSEG + WSEG / 2) + "deg)";
    lab.innerHTML = "<b>" + (s.m === 0 ? "x0" : "x" + s.m) + "</b>";
    w.appendChild(lab);
  });
  w.style.background = "conic-gradient(" + parts.join(",") + ")";
})();
function wheelPick() {
  var t = WSEGS.reduce(function (s, x) {
    return s + x.w;
  }, 0);
  var x = Math.random() * t;
  for (var i = 0; i < WSEGS.length; i++) {
    x -= WSEGS[i].w;
    if (x <= 0) return i;
  }
  return 0;
}
$("#whSpin").addEventListener("click", function () {
  if (wSpinning) return;
  var bet = readBet($("#whBet"));
  if (bet === null) return;
  addBal(-bet);
  wSpinning = true;
  $("#whSpin").disabled = true;
  setMsg("wheelMsg", "The wheel is spinning...", "info");
  var idx = wheelPick();
  var center = idx * WSEG + WSEG / 2;
  var desired = (((360 - center) % 360) + 360) % 360;
  var delta = (((desired - (wrot % 360)) % 360) + 360) % 360;
  wrot += 360 * 6 + delta;
  $(".wwheelbox").classList.add("spinning");
  var w = $("#wwheel");
  w.style.transition = "transform 5.4s cubic-bezier(.1,.7,.08,1)";
  w.style.transform = "rotate(" + wrot + "deg)";
  var tickCount = 0;
  var tickIv = setInterval(function () {
    sfx.tick();
    if (++tickCount > 24) clearInterval(tickIv);
  }, 200);
  setTimeout(function () {
    var s = WSEGS[idx];
    var payout = Math.floor(bet * s.m);
    logHist("wheel", histLine(bet, payout) + " - segment x" + s.m);
    recordRound("wheel", bet, payout);
    if (payout > 0) {
      addBal(payout);
      if (s.m >= 1) {
        setMsg(
          "wheelMsg",
          "The wheel stopped on x" + s.m + " - you won " + fmt(payout) + " fun credits.",
          "win",
        );
        if (s.m >= 5) sfx.bigwin();
        else sfx.win();
        showWinBanner($("#scr-wheel"), s.m >= 5 ? "Huge Win" : "Win", payout, s.m >= 5, "x" + s.m);
      } else {
        setMsg(
          "wheelMsg",
          "The wheel stopped on x" +
            s.m +
            " - " +
            fmt(payout) +
            " of your " +
            fmt(bet) +
            " fun credits come back.",
          "info",
        );
        sfx.coin();
      }
      pushWin("You", payout, "Lucky Wheel");
    } else {
      setMsg(
        "wheelMsg",
        "The wheel stopped on x0. Your bet of " +
          fmt(bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    $(".wwheelbox").classList.remove("spinning");
    wSpinning = false;
    $("#whSpin").disabled = false;
    renderBal(payout > 0);
  }, 5650);
});

