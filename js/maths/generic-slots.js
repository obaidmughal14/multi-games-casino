"use strict";
/* ================= games 40-46: generic slot engine ================= */
function nxSlot(cfg) {
  var cells = buildCells(nxEl(cfg.key + "Grid"), 3, 5);
  var st = {
    spinning: false,
    fs: 0,
    fsBet: 100,
    fsWin: 0,
    rs: 0,
    rsBet: 100,
    pending: false,
    pendBet: 0,
    pendTotal: 0,
  };
  function setG(g) {
    for (var r = 0; r < 3; r++)
      for (var c = 0; c < 5; c++) cells[r][c].innerHTML = symHTML(g[r][c]);
  }
  setG(randomGrid(cfg.weights, 3, 5, cfg.scatter, 2));
  var spinBtn = nxEl(cfg.key + "Spin");
  function fsBanner() {
    var b = nxEl(cfg.key + "Fs");
    if (!b) return;
    if (st.fs > 0) {
      b.classList.add("on");
      b.textContent = "Free spins left: " + st.fs + " - won so far: " + fmt(st.fsWin);
    } else b.classList.remove("on");
  }
  function settle(bet, total, mode, extra) {
    nxEl(cfg.key + "Win").textContent = fmt(total);
    if (mode === "fs") st.fsWin += total;
    if (total > 0) addBal(total);
    var wager = mode === "paid" ? bet : 0;
    logHist(
      cfg.key,
      (mode === "fs"
        ? 'Free spin - <span class="hw">won ' + fmt(total) + "</span>"
        : mode === "rs"
          ? 'Respin - <span class="hw">won ' + fmt(total) + "</span>"
          : histLine(bet, total)) + (extra ? " - " + extra : ""),
    );
    recordRound(cfg.key, wager, total);
    var isWin = mode === "paid" ? total > bet : total > 0;
    if (isWin) {
      setMsg(
        cfg.key + "Msg",
        (mode === "fs" ? "Free spin win: " : mode === "rs" ? "Respin win: " : "You won ") +
          fmt(total) +
          " fun credits." +
          (extra ? " " + extra : ""),
        "win",
      );
      var big = total >= bet * 10;
      if (big) sfx.bigwin();
      else sfx.win();
      showWinBanner(
        nxEl(cfg.scr),
        big ? "Big Win" : "Win",
        total,
        big,
        "x" + (total / Math.max(1, bet)).toFixed(1),
      );
      pushWin("You", total, cfg.name);
    } else if (total > 0) {
      setMsg(
        cfg.key + "Msg",
        "You won " + fmt(total) + " fun credits back on that spin." + (extra ? " " + extra : ""),
        "info",
      );
      sfx.coin();
    } else {
      setMsg(
        cfg.key + "Msg",
        (mode === "paid" ? "No win this time. Spin again." : "No win on that free spin.") +
          " Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    renderBal(isWin);
    if (st.fs > 0 || st.rs > 0) {
      fsBanner();
      setTimeout(function () {
        st.spinning = false;
        spin();
      }, 1100);
    } else {
      fsBanner();
      st.spinning = false;
      spinBtn.disabled = false;
    }
  }
  function spin() {
    if (st.spinning || st.pending) return;
    var mode = st.fs > 0 ? "fs" : st.rs > 0 ? "rs" : "paid";
    var bet;
    if (mode === "fs") {
      bet = st.fsBet;
      st.fs--;
    } else if (mode === "rs") {
      bet = st.rsBet;
      st.rs--;
    } else {
      bet = readBet(nxEl(cfg.key + "Bet"));
      if (bet === null) return;
      if (bet % 10 !== 0) {
        bet = Math.max(10, Math.floor(bet / 10) * 10);
        nxEl(cfg.key + "Bet").value = bet;
      }
      addBal(-bet);
    }
    st.spinning = true;
    spinBtn.disabled = true;
    var bonusBox = nxEl(cfg.key + "Bonus");
    if (bonusBox) bonusBox.innerHTML = "";
    clearWins(cells);
    var g = randomGrid(cfg.weights, 3, 5, cfg.scatter, cfg.scatter === "coin" ? 8 : 5);
    if (cfg.stackWild) {
      for (var cc = 0; cc < 5; cc++) {
        var has = false;
        for (var rr = 0; rr < 3; rr++) if (g[rr][cc] === cfg.wild) has = true;
        if (has) for (var r2 = 0; r2 < 3; r2++) g[r2][cc] = cfg.wild;
      }
    }
    spinAnim(cells, g, cfg.weights, function () {
      var res = evalLines(g, cfg.pay, bet / 10, cfg.wild);
      var total = res.total,
        sc = 0,
        wc = 0,
        cn = 0;
      g.forEach(function (row) {
        row.forEach(function (s) {
          if (s === cfg.scatter) sc++;
          if (s === cfg.wild) wc++;
          if (s === "coin") cn++;
        });
      });
      var extra = "";
      if (sc >= 3 && cfg.scatterPay) total += bet * (cfg.scatterPay[Math.min(sc, 5)] || 0);
      if (cfg.coinBonus && cn >= 6) {
        var cb = Math.floor(bet * cn * 0.5) + (cn >= 15 ? bet * 50 : 0);
        total += cb;
        extra = "Hold and win: " + cn + " coins paid " + fmt(cb) + " fun credits.";
      }
      if (cfg.jackpot5 && sc >= 5) {
        total += bet * 100;
        extra = "Five scatters - fixed jackpot bonus of " + fmt(bet * 100) + " fun credits.";
      }
      if (mode === "fs" && cfg.fsMult) total = Math.floor(total * cfg.fsMult);
      markWins(cells, res.winCells);
      if (cfg.pickmap && mode === "paid" && sc >= 3) {
        st.pending = true;
        st.pendBet = bet;
        st.pendTotal = total;
        nxEl(cfg.key + "Win").textContent = fmt(total);
        setMsg(
          cfg.key + "Msg",
          sc + " maps! Pick one treasure chest to add its prize to this spin.",
          "win",
        );
        sfx.bigwin();
        var prizes = [2, 4, 7];
        for (var pi = prizes.length - 1; pi > 0; pi--) {
          var pj = Math.floor(Math.random() * (pi + 1));
          var pt = prizes[pi];
          prizes[pi] = prizes[pj];
          prizes[pj] = pt;
        }
        var bb = nxEl(cfg.key + "Bonus");
        prizes.forEach(function (pv, idx) {
          var b = document.createElement("button");
          b.className = "chestbtn";
          b.innerHTML = '<svg viewBox="0 0 48 48"><use href="#s-ingot"/></svg>Chest ' + (idx + 1);
          b.addEventListener("click", function () {
            if (!st.pending) return;
            st.pending = false;
            b.classList.add("picked");
            $$(".chestbtn", bb).forEach(function (x) {
              x.disabled = true;
            });
            var prizeAmt = st.pendBet * pv;
            setTimeout(function () {
              settle(
                st.pendBet,
                st.pendTotal + prizeAmt,
                "paid",
                "Treasure chest paid " + fmt(prizeAmt) + " fun credits.",
              );
            }, 450);
          });
          bb.appendChild(b);
        });
        return;
      }
      if (sc >= 3 && cfg.fs && mode === "paid") {
        st.fs = cfg.fs;
        st.fsBet = bet;
        st.fsWin = 0;
        extra = (extra ? extra + " " : "") + sc + " scatters trigger " + cfg.fs + " free spins.";
      }
      if (cfg.respin && mode === "paid" && total === 0 && wc > 0) {
        st.rs = 1;
        st.rsBet = bet;
        extra = "A wild landed with no win - one free respin.";
      }
      settle(bet, total, mode, extra);
    });
  }
  spinBtn.addEventListener("click", spin);
}
var NX_PAY = {
  a: [4, 13, 42],
  b: [4, 16, 52],
  c: [6, 22, 75],
  d: [10, 38, 110],
  e: [25, 100, 500],
  w: [50, 200, 1000],
};
var NX_PAY95 = {
  a: [3, 11, 36],
  b: [4, 14, 46],
  c: [5, 19, 64],
  d: [9, 32, 94],
  e: [22, 88, 440],
  w: [44, 176, 880],
};
function nxPay(m, syms) {
  var p = {};
  p[syms[0]] = m.a;
  p[syms[1]] = m.b;
  p[syms[2]] = m.c;
  p[syms[3]] = m.d;
  p[syms[4]] = m.e;
  p.wild = m.w;
  return p;
}
function nxW(syms, scatter) {
  return [
    [syms[0], 24],
    [syms[1], 22],
    [syms[2], 17],
    [syms[3], 12],
    [syms[4], 5],
    ["wild", 3],
    [scatter, 3],
  ];
}
nxSlot({
  key: "jungle",
  scr: "scr-jungle",
  name: "Jungle Safari Slots",
  wild: "wild",
  scatter: "jgsc",
  weights: nxW(["leaf", "grape", "pearl", "gem", "crown"], "jgsc"),
  pay: nxPay(NX_PAY, ["leaf", "grape", "pearl", "gem", "crown"]),
  scatterPay: { 3: 2, 4: 5, 5: 20 },
  fs: 8,
  stackWild: true,
});
nxSlot({
  key: "candy",
  scr: "scr-candy",
  name: "Candy Dream Slots",
  wild: "wild",
  scatter: "cdsc",
  weights: nxW(["clover", "cherry", "grape", "ingot", "crown"], "cdsc"),
  pay: nxPay(NX_PAY, ["clover", "cherry", "grape", "ingot", "crown"]),
  scatterPay: { 3: 2, 4: 5, 5: 20 },
  fs: 8,
  fsMult: 2,
});
nxSlot({
  key: "space",
  scr: "scr-space",
  name: "Space Adventure Slots",
  wild: "wild",
  scatter: "spsc",
  weights: nxW(["leaf", "pearl", "coin", "gem", "crown"], "spsc"),
  pay: nxPay(NX_PAY, ["leaf", "pearl", "coin", "gem", "crown"]),
  scatterPay: { 3: 3, 4: 8, 5: 25 },
  respin: true,
});
nxSlot({
  key: "lantern",
  scr: "scr-lantern",
  name: "Lucky Lantern Slots",
  wild: "crown",
  scatter: "coin",
  weights: [
    ["clover", 24],
    ["pearl", 22],
    ["ingot", 17],
    ["lantern", 12],
    ["goldbar", 5],
    ["crown", 3],
    ["coin", 3],
  ],
  pay: {
    clover: NX_PAY95.a,
    pearl: NX_PAY95.b,
    ingot: NX_PAY95.c,
    lantern: NX_PAY95.d,
    goldbar: NX_PAY95.e,
    crown: NX_PAY95.w,
  },
  coinBonus: true,
});
nxSlot({
  key: "pirate",
  scr: "scr-pirate",
  name: "Pirate Gold Slots",
  wild: "wild",
  scatter: "pisc",
  weights: nxW(["clover", "pearl", "ingot", "coin", "crown"], "pisc"),
  pay: nxPay(NX_PAY, ["clover", "pearl", "ingot", "coin", "crown"]),
  pickmap: true,
});
nxSlot({
  key: "diamond",
  scr: "scr-diamond",
  name: "Diamond Deluxe Slots",
  wild: "wild",
  scatter: "disc",
  weights: nxW(["amber", "sapphire", "ruby", "emerald", "diamond"], "disc"),
  pay: nxPay(NX_PAY95, ["amber", "sapphire", "ruby", "emerald", "diamond"]),
  scatterPay: { 3: 2, 4: 5, 5: 20 },
  jackpot5: true,
});
nxSlot({
  key: "west",
  scr: "scr-west",
  name: "Wild West Slots",
  wild: "wild",
  scatter: "wssc",
  weights: nxW(["cherry", "lemon", "bell", "ingot", "seven"], "wssc"),
  pay: nxPay(NX_PAY, ["cherry", "lemon", "bell", "ingot", "seven"]),
  scatterPay: { 3: 2, 4: 5, 5: 20 },
  fs: 10,
});

