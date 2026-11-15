"use strict";
/* ================= games 70-169: shared helpers ================= */
var V2T = [],
  V2END = [];
function v2Every(fn, ms) {
  var id = setInterval(fn, ms);
  V2T.push(id);
  return id;
}
function v2After(fn, ms) {
  var id = setTimeout(fn, ms);
  V2T.push(id);
  return id;
}
function v2ClearOne(id) {
  clearInterval(id);
  clearTimeout(id);
  var i = V2T.indexOf(id);
  if (i >= 0) V2T.splice(i, 1);
}
function v2ClearAll() {
  V2T.forEach(function (id) {
    clearInterval(id);
    clearTimeout(id);
  });
  V2T = [];
}
function v2OnLeave(fn) {
  V2END.push(fn);
}
window.__v2leave = function () {
  V2END.forEach(function (f) {
    try {
      f();
    } catch (e) {}
  });
  V2END = [];
  v2ClearAll();
};
function v2Shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}
function v2Rand(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}
function v2Pick(a) {
  return a[Math.floor(Math.random() * a.length)];
}
function v2Msg(key, text, kind) {
  setMsg(key + "Msg", text, kind);
}
function v2Acts(key, btns) {
  var box = nxEl(key + "Acts");
  if (!box) return;
  box.innerHTML = "";
  btns.forEach(function (b) {
    var btn = document.createElement("button");
    btn.className = "btn " + (b.cls || "");
    btn.textContent = b.label;
    if (b.id) btn.id = b.id;
    btn.addEventListener("click", function () {
      sfx.click();
      b.fn();
    });
    box.appendChild(btn);
  });
}
function v2DiceHTML(vals) {
  return vals
    .map(function (v) {
      return '<div class="dieface">' + NXDIE[v] + "</div>";
    })
    .join("");
}

/* ================= poker hand evaluator ================= */
function pkV(c) {
  return c.r === "A"
    ? 14
    : c.r === "K"
      ? 13
      : c.r === "Q"
        ? 12
        : c.r === "J"
          ? 11
          : parseInt(c.r, 10);
}
function pkCard(c) {
  if (c.v == null) c.v = pkV(c);
  return c;
}
function pkEval5(cs) {
  var rs = cs
    .map(function (c) {
      return c.v;
    })
    .sort(function (a, b) {
      return b - a;
    });
  var flush = true;
  for (var i = 1; i < 5; i++) if (cs[i].suit !== cs[0].suit) flush = false;
  var uniq = [],
    seen = {};
  rs.forEach(function (r) {
    if (!seen[r]) {
      seen[r] = 1;
      uniq.push(r);
    }
  });
  var straight = false,
    sHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) {
      straight = true;
      sHigh = uniq[0];
    } else if (uniq[0] === 14 && uniq[1] === 5) {
      straight = true;
      sHigh = 5;
    }
  }
  var counts = {};
  rs.forEach(function (r) {
    counts[r] = (counts[r] || 0) + 1;
  });
  var groups = Object.keys(counts)
    .map(function (r) {
      return [counts[r], Number(r)];
    })
    .sort(function (a, b) {
      return b[0] - a[0] || b[1] - a[1];
    });
  var tb = groups.map(function (g) {
    return g[1];
  });
  var cat;
  if (groups[0][0] === 5) cat = 9;
  else if (straight && flush) cat = 8;
  else if (groups[0][0] === 4) cat = 7;
  else if (groups[0][0] === 3 && groups[1] && groups[1][0] === 2) cat = 6;
  else if (flush) cat = 5;
  else if (straight) cat = 4;
  else if (groups[0][0] === 3) cat = 3;
  else if (groups[0][0] === 2 && groups[1][0] === 2) cat = 2;
  else if (groups[0][0] === 2) cat = 1;
  else cat = 0;
  if (straight) tb = [sHigh];
  return [cat].concat(tb);
}
function pkCmp(a, b) {
  var n = Math.max(a.length, b.length);
  for (var i = 0; i < n; i++) {
    var x = a[i] || 0,
      y = b[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}
function pkCombos(arr, k) {
  var out = [];
  (function rec(start, cur) {
    if (cur.length === k) {
      out.push(cur.slice());
      return;
    }
    for (var i = start; i < arr.length; i++) {
      cur.push(arr[i]);
      rec(i + 1, cur);
      cur.pop();
    }
  })(0, []);
  return out;
}
function pkBest(cards) {
  var best = null;
  pkCombos(cards, 5).forEach(function (cs) {
    var s = pkEval5(cs);
    if (!best || pkCmp(s, best) > 0) best = s;
  });
  return best;
}
function pkBestOmaha(hole, board) {
  var best = null;
  pkCombos(hole, 2).forEach(function (h) {
    pkCombos(board, 3).forEach(function (b) {
      var s = pkEval5(h.concat(b));
      if (!best || pkCmp(s, best) > 0) best = s;
    });
  });
  return best;
}
var PKCATS = [
  "a high card",
  "one pair",
  "two pair",
  "three of a kind",
  "a straight",
  "a flush",
  "a full house",
  "four of a kind",
  "a straight flush",
  "five of a kind",
];
function pkHandName(score) {
  return score[0] === 8 && score[1] === 14 ? "a royal flush" : PKCATS[score[0]];
}
function pkDeck() {
  var d = bjDeck();
  d.forEach(pkCard);
  return d;
}
function pkLowKey(cs) {
  var counts = {};
  cs.forEach(function (c) {
    var v = c.v === 14 ? 1 : c.v;
    counts[v] = (counts[v] || 0) + 1;
  });
  var groups = Object.keys(counts).map(function (r) {
    return [counts[r], Number(r)];
  });
  var pairs = groups.filter(function (g) {
    return g[0] === 2;
  }).length;
  var cat = groups.some(function (g) {
    return g[0] === 4;
  })
    ? 5
    : groups.some(function (g) {
          return g[0] === 3;
        }) && pairs
      ? 4
      : groups.some(function (g) {
            return g[0] === 3;
          })
        ? 3
        : pairs === 2
          ? 2
          : pairs === 1
            ? 1
            : 0;
  var order = groups.slice().sort(function (a, b) {
    return b[0] - a[0] || a[1] - b[1];
  });
  var tb = [];
  order.forEach(function (g) {
    for (var i = 0; i < g[0]; i++) tb.push(-g[1]);
  });
  tb.sort(function (a, b) {
    return a - b;
  });
  return [-cat].concat(tb);
}
function pkBadugi(cs) {
  var best = null;
  [4, 3, 2, 1].forEach(function (k) {
    if (best) return;
    pkCombos(cs, k).forEach(function (sub) {
      var ranks = {},
        suits = {},
        ok = true;
      sub.forEach(function (c) {
        if (ranks[c.v] || suits[c.suit]) ok = false;
        ranks[c.v] = 1;
        suits[c.suit] = 1;
      });
      if (!ok) return;
      var rs = sub
        .map(function (c) {
          return c.v;
        })
        .sort(function (a, b) {
          return a - b;
        });
      var key = [k].concat(
        rs.map(function (r) {
          return -r;
        }),
      );
      if (!best || pkCmp(key, best) > 0) best = key;
    });
  });
  return best;
}

/* ================= blackjack variants (Spanish 21 Lite, Double Exposure) ================= */
function v2BJ(cfg) {
  var st = { active: false, deck: [], p: [], d: [], bet: 0 };
  function render(hide) {
    nxEl(cfg.key + "DHand").innerHTML = st.d
      .map(function (c, i) {
        return bjCardHTML(c, hide && !cfg.bothUp && i === 1);
      })
      .join("");
    nxEl(cfg.key + "PHand").innerHTML = nxHandHTML(st.p);
    var txt = "";
    if (st.p.length) txt = "Your hand: " + bjVal(st.p);
    if (st.d.length)
      txt += (txt ? " - " : "") + "Dealer: " + (hide && !cfg.bothUp ? "?" : bjVal(st.d));
    nxEl(cfg.key + "Sub").textContent = txt || cfg.intro;
  }
  function btns() {
    nxEl(cfg.key + "Play").disabled = st.active;
    nxEl(cfg.key + "Hit").disabled = !st.active;
    nxEl(cfg.key + "Stand").disabled = !st.active;
    nxEl(cfg.key + "Dbl").disabled = !(st.active && st.p.length === 2 && bal >= st.bet);
  }
  function finish(payout, winText, loseText, note) {
    st.active = false;
    render(false);
    btns();
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText: winText,
      loseText: loseText,
      note: note,
    });
  }
  function dealerPlay() {
    while (bjVal(st.d) < 17) st.d.push(st.deck.pop());
  }
  function settle() {
    dealerPlay();
    var pv = bjVal(st.p),
      dv = bjVal(st.d);
    var note = "you " + pv + " - dealer " + dv;
    if (cfg.player21 && pv === 21) {
      finish(
        Math.floor(st.bet * 2),
        "Your 21 always wins in Spanish 21 Lite - you collect " + fmt(st.bet * 2) + " fun credits.",
        "",
        note,
      );
      return;
    }
    if (dv > 21) {
      finish(
        Math.floor(st.bet * 2),
        "Dealer busts with " + dv + " - you collect " + fmt(st.bet * 2) + " fun credits.",
        "",
        note,
      );
      return;
    }
    if (cfg.tiesDealer && pv <= dv) {
      finish(
        0,
        "",
        "Dealer has " +
          dv +
          " against your " +
          pv +
          " and wins ties in Double Exposure - your bet of " +
          fmt(st.bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        note,
      );
      return;
    }
    if (pv > dv) {
      finish(
        Math.floor(st.bet * 2),
        "Your " +
          pv +
          " beats dealer " +
          dv +
          " - you collect " +
          fmt(st.bet * 2) +
          " fun credits.",
        "",
        note,
      );
      return;
    }
    if (pv === dv) {
      finish(st.bet, "", "", note);
      return;
    }
    finish(
      0,
      "",
      "Dealer has " +
        dv +
        " against your " +
        pv +
        " - your bet of " +
        fmt(st.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      note,
    );
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.deck = bjDeck();
    if (cfg.noTens)
      st.deck = st.deck.filter(function (c) {
        return c.r !== "10";
      });
    v2Shuffle(st.deck);
    st.p = [st.deck.pop(), st.deck.pop()];
    st.d = [st.deck.pop(), st.deck.pop()];
    st.active = true;
    sfx.deal();
    render(true);
    btns();
    var pv = bjVal(st.p);
    if (pv === 21) {
      var dv = bjVal(st.d);
      if (cfg.player21) {
        st.active = false;
        finish(
          Math.floor(bet * (1 + cfg.bjPay)),
          "21 on the deal - in this game your 21 always wins, paying " +
            (cfg.bjPay === 1 ? "even money" : "3 to 2") +
            ". You collect " +
            fmt(Math.floor(bet * (1 + cfg.bjPay))) +
            " fun credits.",
          "",
          "player 21",
        );
        return;
      }
      if (dv === 21 && cfg.tiesDealer) {
        st.active = false;
        finish(
          0,
          "",
          "Both hands are 21 and the dealer wins ties here - your bet is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          "both 21",
        );
        return;
      }
      st.active = false;
      finish(
        Math.floor(bet * (1 + cfg.bjPay)),
        "Blackjack! It pays " +
          (cfg.bjPay === 1 ? "even money" : "3 to 2") +
          " here - you collect " +
          fmt(Math.floor(bet * (1 + cfg.bjPay))) +
          " fun credits.",
        "",
        "blackjack",
      );
      return;
    }
    v2Msg(
      cfg.key,
      cfg.bothUp
        ? "Both dealer cards are face up - Hit, Stand or Double."
        : "Your cards are dealt. Hit, Stand or Double.",
      "info",
    );
  });
  nxEl(cfg.key + "Hit").addEventListener("click", function () {
    if (!st.active) return;
    st.p.push(st.deck.pop());
    sfx.deal();
    render(true);
    btns();
    var pv = bjVal(st.p);
    if (pv > 21) {
      st.active = false;
      finish(
        0,
        "",
        "Bust with " +
          pv +
          " - your bet of " +
          fmt(st.bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "bust " + pv,
      );
      return;
    }
    if (pv === 21) {
      if (cfg.player21) {
        var bonus = cfg.bonus21 && st.p.length >= 5;
        st.active = false;
        finish(
          bonus ? st.bet * 3 : Math.floor(st.bet * 2),
          bonus
            ? "A 21 with " +
                st.p.length +
                " cards pays a double bonus - you collect " +
                fmt(st.bet * 3) +
                " fun credits."
            : "21 - your 21 always wins here. You collect " + fmt(st.bet * 2) + " fun credits.",
          "",
          "player 21",
        );
        return;
      }
      settle();
    }
  });
  nxEl(cfg.key + "Stand").addEventListener("click", function () {
    if (st.active) {
      st.active = false;
      settle();
    }
  });
  nxEl(cfg.key + "Dbl").addEventListener("click", function () {
    if (!st.active || st.p.length !== 2) return;
    if (bal < st.bet) {
      v2Msg(cfg.key, "Your balance cannot cover a double. Stand or Hit instead.", "lose");
      return;
    }
    addBal(-st.bet);
    st.bet *= 2;
    st.p.push(st.deck.pop());
    sfx.deal();
    var pv = bjVal(st.p);
    st.active = false;
    if (pv > 21) {
      finish(
        0,
        "",
        "Bust with " +
          pv +
          " after doubling - your bet is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "double bust",
      );
      return;
    }
    if (cfg.player21 && pv === 21) {
      finish(
        Math.floor(st.bet * 2),
        "21 after doubling - your 21 always wins. You collect " + fmt(st.bet * 2) + " fun credits.",
        "",
        "double 21",
      );
      return;
    }
    settle();
  });
  render(false);
  btns();
}

/* ================= video poker variants ================= */
function v2PokerEval(hand, cfg) {
  var wilds = cfg.wild2
    ? hand.filter(function (c) {
        return c.v === 2;
      }).length
    : 0;
  if (!wilds) {
    var s = pkEval5(hand);
    return { score: s, name: pkHandName(s), mult: cfg.pay(s, hand) };
  }
  var fixed = hand.filter(function (c) {
    return c.v !== 2;
  });
  var rankSets = [[]];
  for (var w = 0; w < wilds; w++) {
    var next = [];
    rankSets.forEach(function (rs) {
      for (var r = 2; r <= 14; r++) next.push(rs.concat([r]));
    });
    rankSets = next;
  }
  var best = null,
    bestScore = null,
    seenR = {};
  rankSets.forEach(function (rs) {
    var keyR = rs
      .slice()
      .sort(function (a, b) {
        return a - b;
      })
      .join(",");
    if (seenR[keyR]) return;
    seenR[keyR] = 1;
    var suitsTry = [
      fixed.length &&
      fixed.every(function (c) {
        return c.suit === fixed[0].suit;
      })
        ? fixed[0].suit
        : "S",
    ];
    suitsTry.forEach(function (st) {
      var cs = fixed.concat(
        rs.map(function (r) {
          return { v: r, suit: st, r: String(r) };
        }),
      );
      var sc = pkEval5(cs);
      if (!bestScore || pkCmp(sc, bestScore) > 0) {
        bestScore = sc;
        best = cs;
      }
    });
  });
  var isRoyal = bestScore[0] === 8 && bestScore[1] === 14;
  return {
    score: bestScore,
    name: isRoyal ? "a wild royal flush" : pkHandName(bestScore),
    mult: cfg.pay(bestScore, hand),
    wildRoyal: isRoyal,
  };
}
function v2VideoPoker(cfg) {
  var st = { active: false, deck: [], hand: [], held: [false, false, false, false, false], bet: 0 };
  function render() {
    var box = nxEl(cfg.key + "PHand");
    box.innerHTML = "";
    st.hand.forEach(function (c, i) {
      var d = document.createElement("div");
      d.innerHTML = bjCardHTML(st.held[i] && st.active ? c : c, false);
      var card = d.firstChild;
      if (st.active) {
        card.style.cursor = "pointer";
        if (st.held[i]) card.style.outline = "3px solid var(--gold)";
        card.addEventListener("click", function () {
          st.held[i] = !st.held[i];
          sfx.click();
          render();
        });
      }
      box.appendChild(card);
      if (st.active && st.held[i]) {
        var h = document.createElement("div");
        h.className = "nxlabel";
        h.textContent = "Held";
        box.appendChild(h);
      }
    });
    if (!st.hand.length) box.innerHTML = '<div class="nxsub">Press Deal to get five cards</div>';
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.deck = pkDeck();
    st.hand = [st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop()];
    st.held = [false, false, false, false, false];
    st.active = true;
    sfx.deal();
    render();
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Draw").disabled = false;
    v2Msg(cfg.key, "Tap cards to hold them, then press Draw.", "info");
  });
  nxEl(cfg.key + "Draw").addEventListener("click", function () {
    if (!st.active) return;
    for (var i = 0; i < 5; i++) if (!st.held[i]) st.hand[i] = st.deck.pop();
    st.active = false;
    sfx.deal();
    render();
    nxEl(cfg.key + "Play").disabled = false;
    nxEl(cfg.key + "Draw").disabled = true;
    var res = v2PokerEval(st.hand, cfg);
    var payout = Math.floor(st.bet * res.mult);
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText:
        "Final hand: " +
        res.name +
        " - pays x" +
        res.mult +
        ". You collect " +
        fmt(payout) +
        " fun credits.",
      loseText:
        "Final hand: " +
        res.name +
        " - below the paying line. Your bet of " +
        fmt(st.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      pushText: "Final hand: " + res.name + " - pays x1, your bet is returned.",
      note: res.name,
    });
  });
  render();
}

/* ================= poker showdown engine ================= */
function v2Show(cfg) {
  var st = {
    active: false,
    deck: [],
    p: [],
    d: [],
    board: [],
    bet: 0,
    wager: 0,
    stage: 0,
    held: [],
  };
  function handHTML(el, cards, hideAll) {
    var e = nxEl(el);
    if (!e) return;
    e.innerHTML = cards
      .map(function (c) {
        return bjCardHTML(c, !!hideAll);
      })
      .join("");
  }
  function render() {
    handHTML(cfg.key + "PHand", st.p, false);
    handHTML(cfg.key + "DHand", st.d, st.active);
    handHTML(cfg.key + "Board", st.board, st.active && cfg.mode !== "miss" ? false : st.active);
    if (cfg.mode === "miss")
      handHTML(cfg.key + "Board", st.board.slice(0, st.stage === 0 ? 0 : st.revealed || 0), false);
  }
  function finish(payout, winText, loseText, note) {
    st.active = false;
    render();
    nxEl(cfg.key + "Play").disabled = false;
    v2Acts(cfg.key, []);
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.wager,
      payout: payout,
      msg: cfg.key + "Msg",
      winText: winText,
      loseText: loseText,
      note: note,
    });
  }
  function compareHands() {
    if (cfg.mode === "omaha")
      return pkCmp(pkBestOmaha(st.p, st.board), pkBestOmaha(st.d, st.board));
    if (cfg.mode === "badugi") return pkCmp(pkBadugi(st.p), pkBadugi(st.d));
    if (cfg.mode === "lowball") return pkCmp(pkLowKey(st.p), pkLowKey(st.d));
    var pb =
      cfg.mode === "headsup" || cfg.mode === "ultimate"
        ? pkBest(st.p.concat(st.board))
        : pkBest(st.p);
    var db =
      cfg.mode === "headsup" || cfg.mode === "ultimate"
        ? pkBest(st.d.concat(st.board))
        : pkBest(st.d);
    return pkCmp(pb, db);
  }
  function handNames() {
    if (cfg.mode === "badugi")
      return ["a " + pkBadugi(st.p)[0] + "-card badugi", "a " + pkBadugi(st.d)[0] + "-card badugi"];
    if (cfg.mode === "lowball") return ["your low hand", "the dealer low hand"];
    var pb =
      cfg.mode === "omaha"
        ? pkBestOmaha(st.p, st.board)
        : cfg.mode === "headsup" || cfg.mode === "ultimate"
          ? pkBest(st.p.concat(st.board))
          : pkBest(st.p);
    var db =
      cfg.mode === "omaha"
        ? pkBestOmaha(st.d, st.board)
        : cfg.mode === "headsup" || cfg.mode === "ultimate"
          ? pkBest(st.d.concat(st.board))
          : pkBest(st.d);
    return [pkHandName(pb), pkHandName(db)];
  }
  function settleShowdown() {
    render();
    var cmp = compareHands();
    var nm = handNames();
    if (cmp > 0)
      finish(
        Math.floor(st.wager * 1.95),
        "You win with " +
          nm[0] +
          " against " +
          nm[1] +
          " - you collect " +
          fmt(Math.floor(st.wager * 1.95)) +
          " fun credits.",
        "",
        nm[0] + " vs " + nm[1],
      );
    else if (cmp === 0) finish(st.wager, "", "", "tie - " + nm[0]);
    else
      finish(
        0,
        "",
        "Dealer wins with " +
          nm[1] +
          " against your " +
          nm[0] +
          " - your bet of " +
          fmt(st.wager) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        nm[0] + " vs " + nm[1],
      );
  }
  function splitPaiGow(cards) {
    var bestLow = null,
      bestSplit = null;
    pkCombos(
      cards.map(function (_, i) {
        return i;
      }),
      2,
    ).forEach(function (idx) {
      var low = idx.map(function (i) {
        return cards[i];
      });
      var high = cards.filter(function (_, i) {
        return idx.indexOf(i) < 0;
      });
      var hs = pkEval5(high);
      var lv =
        low[0].v === low[1].v
          ? [1, low[0].v]
          : [0, Math.max(low[0].v, low[1].v), Math.min(low[0].v, low[1].v)];
      if (pkCmp(hs, lv) < 0) return;
      if (!bestLow || pkCmp(lv, bestLow) > 0) {
        bestLow = lv;
        bestSplit = { low: low, high: high };
      }
    });
    if (!bestSplit) {
      var srt = cards.slice().sort(function (a, b) {
        return a.v - b.v;
      });
      bestSplit = { low: [srt[0], srt[1]], high: srt.slice(2) };
    }
    return bestSplit;
  }
  function settlePaiGow() {
    var ps = splitPaiGow(st.p),
      ds = splitPaiGow(st.d);
    nxEl(cfg.key + "PHand").innerHTML =
      ps.high
        .map(function (c) {
          return bjCardHTML(c, false);
        })
        .join("") +
      '<div class="nxlabel">Low hand</div>' +
      ps.low
        .map(function (c) {
          return bjCardHTML(c, false);
        })
        .join("");
    nxEl(cfg.key + "DHand").innerHTML =
      ds.high
        .map(function (c) {
          return bjCardHTML(c, false);
        })
        .join("") +
      '<div class="nxlabel">Low hand</div>' +
      ds.low
        .map(function (c) {
          return bjCardHTML(c, false);
        })
        .join("");
    var hw = pkCmp(pkEval5(ps.high), pkEval5(ds.high));
    function pkEval2(low) {
      var a = low[0],
        b = low[1];
      return a.v === b.v ? [1, a.v] : [0, Math.max(a.v, b.v), Math.min(a.v, b.v)];
    }
    var lw2 = pkCmp(pkEval2(ps.low), pkEval2(ds.low));
    st.active = false;
    nxEl(cfg.key + "Play").disabled = false;
    v2Acts(cfg.key, []);
    if (hw > 0 && lw2 > 0)
      nxFinish({
        scr: cfg.scr,
        key: cfg.key,
        name: cfg.name,
        bet: st.wager,
        payout: Math.floor(st.wager * 1.95),
        msg: cfg.key + "Msg",
        winText:
          "Both of your hands beat the dealer - you collect " +
          fmt(Math.floor(st.wager * 1.95)) +
          " fun credits.",
        loseText: "",
        note: "won both hands",
      });
    else if (hw < 0 && lw2 < 0)
      nxFinish({
        scr: cfg.scr,
        key: cfg.key,
        name: cfg.name,
        bet: st.wager,
        payout: 0,
        msg: cfg.key + "Msg",
        winText: "",
        loseText:
          "The dealer wins both hands - your bet of " +
          fmt(st.wager) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        note: "lost both hands",
      });
    else
      nxFinish({
        scr: cfg.scr,
        key: cfg.key,
        name: cfg.name,
        bet: st.wager,
        payout: st.wager,
        msg: cfg.key + "Msg",
        winText: "",
        loseText: "",
        pushText:
          "One hand each - a push. Your bet of " + fmt(st.wager) + " fun credits is returned.",
        note: "split hands",
      });
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.wager = bet;
    st.stage = 0;
    st.revealed = 0;
    st.deck = pkDeck();
    st.board = [];
    st.held = [];
    sfx.deal();
    nxEl(cfg.key + "Play").disabled = true;
    st.active = true;
    if (cfg.mode === "paigow") {
      st.p = [];
      st.d = [];
      for (var i = 0; i < 7; i++) {
        st.p.push(st.deck.pop());
        st.d.push(st.deck.pop());
      }
      render();
      v2Msg(
        cfg.key,
        "Your 7 cards are auto-split into a 5-card and a 2-card hand. Press Show hands to compare.",
        "info",
      );
      v2Acts(cfg.key, [
        {
          label: "Show hands",
          cls: "gold",
          fn: function () {
            settlePaiGow();
          },
        },
      ]);
    } else if (cfg.mode === "miss") {
      st.p = [st.deck.pop(), st.deck.pop()];
      st.d = [];
      st.board = [st.deck.pop(), st.deck.pop(), st.deck.pop()];
      render();
      v2Msg(
        cfg.key,
        "Your two cards are dealt and the board is face down. Fold, or bet 1x to reveal the first community card.",
        "info",
      );
      missActs();
    } else if (cfg.mode === "ultimate") {
      st.p = [st.deck.pop(), st.deck.pop()];
      st.d = [st.deck.pop(), st.deck.pop()];
      st.board = [st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop()];
      nxEl(cfg.key + "PHand").innerHTML = nxHandHTML(st.p);
      nxEl(cfg.key + "DHand").innerHTML = st.d
        .map(function (c) {
          return bjCardHTML(c, true);
        })
        .join("");
      nxEl(cfg.key + "Board").innerHTML =
        st.board
          .slice(0, 3)
          .map(function (c) {
            return bjCardHTML(c, false);
          })
          .join("") +
        st.board
          .slice(3)
          .map(function (c) {
            return bjCardHTML(c, true);
          })
          .join("");
      v2Msg(
        cfg.key,
        "Flop is showing. Play adds a second bet of the same size, Check plays for the ante only. Then the board and dealer hand are revealed.",
        "info",
      );
      v2Acts(cfg.key, [
        {
          label: "Play - add " + fmt(bet),
          cls: "gold",
          fn: function () {
            if (bal < st.bet) {
              v2Msg(
                cfg.key,
                "Balance too low to add the Play bet - your hand is checked instead.",
                "lose",
              );
              settleShowdown();
              return;
            }
            addBal(-st.bet);
            st.wager += st.bet;
            renderBal(false);
            settleShowdown();
          },
        },
        {
          label: "Check",
          fn: function () {
            settleShowdown();
          },
        },
      ]);
    } else if (cfg.mode === "draw") {
      st.p = [st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop()];
      st.d = [st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop()];
      st.held = [true, true, true, true, true];
      renderDraw();
      v2Msg(cfg.key, "Tap cards to mark them for discard, then press Draw once.", "info");
      v2Acts(cfg.key, [
        {
          label: "Draw",
          cls: "gold",
          fn: function () {
            for (var i = 0; i < 5; i++) if (!st.held[i]) st.p[i] = st.deck.pop();
            renderDraw();
            settleShowdown();
          },
        },
      ]);
    } else {
      var np =
        cfg.mode === "omaha"
          ? 4
          : cfg.mode === "badugi"
            ? 4
            : cfg.mode === "stud"
              ? 7
              : cfg.mode === "lowball"
                ? 5
                : 2;
      st.p = [];
      st.d = [];
      for (var j = 0; j < np; j++) {
        st.p.push(st.deck.pop());
        st.d.push(st.deck.pop());
      }
      if (cfg.mode === "headsup" || cfg.mode === "omaha")
        st.board = [st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop(), st.deck.pop()];
      render();
      v2Msg(
        cfg.key,
        "Hands are dealt face down for the dealer. Press Showdown to reveal and compare.",
        "info",
      );
      v2Acts(cfg.key, [
        {
          label: "Showdown",
          cls: "gold",
          fn: function () {
            settleShowdown();
          },
        },
      ]);
    }
  });
  function renderDraw() {
    var box = nxEl(cfg.key + "PHand");
    box.innerHTML = "";
    st.p.forEach(function (c, i) {
      var wrap = document.createElement("span");
      wrap.innerHTML = bjCardHTML(c, false);
      var card = wrap.firstChild;
      card.style.cursor = "pointer";
      if (!st.held[i]) card.style.opacity = "0.45";
      card.addEventListener("click", function () {
        st.held[i] = !st.held[i];
        sfx.click();
        renderDraw();
      });
      box.appendChild(card);
    });
    handHTML(cfg.key + "DHand", st.d, true);
  }
  function missActs() {
    v2Acts(cfg.key, [
      {
        label: "Fold",
        fn: function () {
          st.active = false;
          nxEl(cfg.key + "Play").disabled = false;
          v2Acts(cfg.key, []);
          nxFinish({
            scr: cfg.scr,
            key: cfg.key,
            name: cfg.name,
            bet: st.wager,
            payout: 0,
            msg: cfg.key + "Msg",
            winText: "",
            loseText:
              "You folded - your wager of " +
              fmt(st.wager) +
              " fun credits is lost. Balance: " +
              fmt(bal) +
              " fun credits.",
            note: "folded",
          });
        },
      },
      {
        label: "Bet 1x - reveal next card",
        cls: "gold",
        fn: function () {
          if (bal < st.bet) {
            v2Msg(cfg.key, "Balance too low to bet again - the hand is folded.", "lose");
            st.active = false;
            nxEl(cfg.key + "Play").disabled = false;
            v2Acts(cfg.key, []);
            nxFinish({
              scr: cfg.scr,
              key: cfg.key,
              name: cfg.name,
              bet: st.wager,
              payout: 0,
              msg: cfg.key + "Msg",
              winText: "",
              loseText:
                "Folded with a wager of " +
                fmt(st.wager) +
                " fun credits. Balance: " +
                fmt(bal) +
                " fun credits.",
              note: "folded",
            });
            return;
          }
          addBal(-st.bet);
          st.wager += st.bet;
          renderBal(false);
          st.revealed = (st.revealed || 0) + 1;
          st.stage++;
          render();
          sfx.deal();
          if (st.revealed >= 3) {
            var hand = st.p.concat(st.board);
            var sc = pkEval5(hand);
            var table = [
              [8, 500],
              [7, 100],
              [6, 40],
              [5, 10],
              [4, 6],
              [3, 4],
              [2, 3],
              [1, 2],
            ];
            var mult = 0,
              push = false;
            if (sc[0] === 1 && sc[1] >= 11) mult = 1;
            else if (sc[0] === 1 && sc[1] >= 6) push = true;
            else
              for (var ti = 0; ti < table.length; ti++)
                if (sc[0] === table[ti][0]) {
                  mult = table[ti][1];
                  break;
                }
            var payout = push ? st.wager : Math.floor(st.wager * mult);
            finish(
              payout,
              "Final hand: " +
                pkHandName(sc) +
                " - pays x" +
                mult +
                " on your total wager. You collect " +
                fmt(payout) +
                " fun credits.",
              "Final hand: " +
                pkHandName(sc) +
                " - below a paid pair of Jacks. Your wager of " +
                fmt(st.wager) +
                " fun credits is lost. Balance: " +
                fmt(bal) +
                " fun credits.",
              pkHandName(sc),
            );
          } else {
            v2Msg(
              cfg.key,
              "Card " + st.revealed + " of 3 is showing. Fold, or bet 1x again to continue.",
              "info",
            );
            missActs();
          }
        },
      },
    ]);
  }
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}

/* ================= dice engines ================= */
function farkleScore(dice) {
  var counts = [0, 0, 0, 0, 0, 0, 0];
  dice.forEach(function (d) {
    counts[d]++;
  });
  var score = 0,
    used = 0;
  for (var f = 1; f <= 6; f++) {
    if (counts[f] >= 3) {
      score += f === 1 ? 1000 : f * 100;
      used += 3;
      counts[f] -= 3;
      if (counts[f] >= 3) {
        score += f === 1 ? 1000 : f * 100;
        used += 3;
        counts[f] -= 3;
      }
    }
  }
  score += counts[1] * 100 + counts[5] * 50;
  used += counts[1] + counts[5];
  return { score: score, scoring: used };
}
function v2Farkle(cfg) {
  var st = { active: false, bet: 0, turn: 0, dice: [], sel: [] };
  function render() {
    var box = nxEl(cfg.key + "Disp");
    box.innerHTML =
      '<div class="dicefaces">' +
      st.dice
        .map(function (d, i) {
          return (
            '<div class="dieface" data-i="' +
            i +
            '" style="cursor:pointer;' +
            (st.sel[i] ? "outline:3px solid var(--gold);" : "opacity:.85") +
            '">' +
            NXDIE[d] +
            "</div>"
          );
        })
        .join("") +
      "</div>";
    $$(".dieface", box).forEach(function (el) {
      el.addEventListener("click", function () {
        if (!st.active) return;
        var i = Number(el.getAttribute("data-i"));
        st.sel[i] = !st.sel[i];
        sfx.click();
        render();
      });
    });
    nxEl(cfg.key + "Sub").textContent = st.active
      ? "Turn score: " + fmt(st.turn) + " - tap scoring dice to select them"
      : cfg.intro;
  }
  function selectedScore() {
    var chosen = st.dice.filter(function (_, i) {
      return st.sel[i];
    });
    if (!chosen.length) return null;
    var fs = farkleScore(chosen);
    var chk = farkleScore(chosen);
    if (chk.scoring !== chosen.length) return -1;
    return fs.score;
  }
  function rollDice(n) {
    st.dice = [];
    st.sel = [];
    for (var i = 0; i < n; i++) {
      st.dice.push(nxD6());
      st.sel.push(false);
    }
    var fs = farkleScore(st.dice);
    render();
    if (fs.score === 0) {
      st.active = false;
      nxEl(cfg.key + "Play").disabled = false;
      v2Acts(cfg.key, []);
      nxFinish({
        scr: cfg.scr,
        key: cfg.key,
        name: cfg.name,
        bet: st.bet,
        payout: 0,
        msg: cfg.key + "Msg",
        winText: "",
        loseText:
          "No scoring dice - that is a Farkle. Your turn score is lost with your bet of " +
          fmt(st.bet) +
          " fun credits. Balance: " +
          fmt(bal) +
          " fun credits.",
        note: "farkle",
      });
      return false;
    }
    return true;
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.turn = 0;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    sfx.deal();
    if (rollDice(6)) {
      v2Msg(
        cfg.key,
        "Select your scoring dice (1s are 100, 5s are 50, three of a kind scores), then roll on or bank.",
        "info",
      );
      farkleActs();
    }
  });
  function farkleActs() {
    v2Acts(cfg.key, [
      {
        label: "Keep selected and roll the rest",
        cls: "gold",
        fn: function () {
          var sc = selectedScore();
          if (sc === null) {
            v2Msg(cfg.key, "Select at least one scoring die first.", "lose");
            return;
          }
          if (sc < 0) {
            v2Msg(
              cfg.key,
              "Every selected die must be part of the score - remove dice that do not score.",
              "lose",
            );
            return;
          }
          st.turn += sc;
          var left = st.dice.filter(function (_, i) {
            return !st.sel[i];
          }).length;
          sfx.deal();
          if (rollDice(left === 0 ? 6 : left)) {
            v2Msg(
              cfg.key,
              "Kept " +
                fmt(sc) +
                " points. Turn score: " +
                fmt(st.turn) +
                ". Select scoring dice again.",
              "info",
            );
            farkleActs();
          }
        },
      },
      {
        label: "Bank turn score",
        cls: "teal",
        fn: function () {
          var sc = selectedScore();
          if (sc && sc > 0) st.turn += sc;
          if (st.turn <= 0) {
            v2Msg(cfg.key, "Bank at least one scoring selection first.", "lose");
            return;
          }
          st.active = false;
          nxEl(cfg.key + "Play").disabled = false;
          v2Acts(cfg.key, []);
          var payout = Math.floor(((st.bet * st.turn) / 500) * 0.96);
          nxFinish({
            scr: cfg.scr,
            key: cfg.key,
            name: cfg.name,
            bet: st.bet,
            payout: payout,
            msg: cfg.key + "Msg",
            winText:
              "Banked " +
              fmt(st.turn) +
              " points - pays x" +
              ((st.turn / 500) * 0.96).toFixed(2) +
              ". You collect " +
              fmt(payout) +
              " fun credits.",
            loseText:
              "Banked " +
              fmt(st.turn) +
              " points, worth " +
              fmt(payout) +
              " fun credits back - less than your bet. Balance: " +
              fmt(bal) +
              " fun credits.",
            note: fmt(st.turn) + " points banked",
          });
        },
      },
    ]);
  }
  render();
}
function v2DiceCombo(cfg) {
  var st = { active: false, bet: 0, dice: [], held: [], rolls: 0 };
  function render() {
    nxEl(cfg.key + "Disp").innerHTML =
      '<div class="dicefaces">' +
      st.dice
        .map(function (d, i) {
          return (
            '<div class="dieface" style="cursor:pointer;' +
            (st.held[i] ? "outline:3px solid var(--gold);" : "") +
            '" data-i="' +
            i +
            '">' +
            NXDIE[d] +
            "</div>"
          );
        })
        .join("") +
      "</div>";
    $$(".dieface", nxEl(cfg.key + "Disp")).forEach(function (el) {
      el.addEventListener("click", function () {
        if (!st.active) return;
        var i = Number(el.getAttribute("data-i"));
        st.held[i] = !st.held[i];
        sfx.click();
        render();
      });
    });
    nxEl(cfg.key + "Sub").textContent = st.active
      ? "Rolls left: " + (3 - st.rolls) + " - tap dice to hold them"
      : cfg.intro;
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.rolls = 1;
    st.held = [false, false, false, false, false];
    st.dice = [nxD6(), nxD6(), nxD6(), nxD6(), nxD6()];
    st.active = true;
    sfx.deal();
    render();
    nxEl(cfg.key + "Play").disabled = true;
    v2Msg(
      cfg.key,
      "First roll is out. Hold dice and roll again, or stand to score this hand.",
      "info",
    );
    comboActs();
  });
  function comboActs() {
    var btns = [];
    if (st.rolls < 3)
      btns.push({
        label: "Roll again",
        cls: "gold",
        fn: function () {
          st.rolls++;
          for (var i = 0; i < 5; i++) if (!st.held[i]) st.dice[i] = nxD6();
          sfx.deal();
          render();
          if (st.rolls >= 3) {
            settle();
          } else comboActs();
        },
      });
    btns.push({
      label: "Stand and score",
      cls: "teal",
      fn: function () {
        settle();
      },
    });
    v2Acts(cfg.key, btns);
  }
  function settle() {
    st.active = false;
    nxEl(cfg.key + "Play").disabled = false;
    v2Acts(cfg.key, []);
    var counts = [0, 0, 0, 0, 0, 0, 0];
    st.dice.forEach(function (d) {
      counts[d]++;
    });
    var sorted = st.dice.slice().sort();
    var isStraight = sorted.join("") === "12345" || sorted.join("") === "23456";
    var mx = Math.max.apply(null, counts);
    var pairs = counts.filter(function (c) {
      return c === 2;
    }).length;
    var name, mult;
    if (mx === 5) {
      name = "Five of a kind";
      mult = 50;
    } else if (mx === 4) {
      name = "Four of a kind";
      mult = 10;
    } else if (mx === 3 && pairs === 1) {
      name = "Full house";
      mult = 6;
    } else if (isStraight) {
      name = "Straight";
      mult = 5;
    } else if (mx === 3) {
      name = "Three of a kind";
      mult = 3;
    } else if (pairs === 2) {
      name = "Two pair";
      mult = 1.5;
    } else if (pairs === 1) {
      name = "One pair";
      mult = 0.5;
    } else {
      name = "No combination";
      mult = 0;
    }
    var payout = Math.floor(st.bet * mult);
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText:
        "Final dice: " +
        name +
        " - pays x" +
        mult +
        ". You collect " +
        fmt(payout) +
        " fun credits.",
      loseText:
        "Final dice: " +
        name +
        " - pays nothing. Your bet of " +
        fmt(st.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      partText:
        "Final dice: " +
        name +
        " - pays x" +
        mult +
        ", so " +
        fmt(payout) +
        " fun credits come back.",
      note: name,
    });
  }
  render();
}

/* ================= simple dice and wheel games ================= */
function v2Hazard(cfg) {
  var st = { active: false, bet: 0, main: 7, chance: 0 };
  nxPickRow(cfg.key + "Pick", function (v) {
    st.main = Number(v);
  });
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.chance = 0;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    sfx.deal();
    roll();
    if (st.active) hazardActs();
  });
  function hazardActs() {
    v2Acts(cfg.key, [
      {
        label: "Roll again",
        cls: "gold",
        fn: function () {
          roll();
          if (!st.active) v2Acts(cfg.key, []);
        },
      },
    ]);
  }
  function end(payout, txt, note) {
    st.active = false;
    nxEl(cfg.key + "Play").disabled = false;
    v2Acts(cfg.key, []);
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText: txt + " You collect " + fmt(payout) + " fun credits.",
      loseText:
        txt +
        " Your bet of " +
        fmt(st.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      note: note,
    });
  }
  function roll() {
    var d1 = nxD6(),
      d2 = nxD6(),
      tot = d1 + d2;
    nxEl(cfg.key + "Disp").innerHTML = '<div class="dicefaces">' + v2DiceHTML([d1, d2]) + "</div>";
    sfx.deal();
    if (!st.chance) {
      if (tot === st.main) {
        end(
          Math.floor(st.bet * 1.95),
          "Rolled " + tot + " - your main " + st.main + " comes up straight away, a nick.",
          "nick on " + tot,
        );
      } else if (tot === 2 || tot === 3) {
        end(0, "Rolled " + tot + " - an out. The round ends.", "out on " + tot);
      } else if (tot === 11 || tot === 12) {
        if (st.main === 6 || st.main === 8) {
          if (tot === 12)
            end(0, "Rolled 12 against a main of " + st.main + " - an out.", "out on 12");
          else
            end(
              Math.floor(st.bet * 1.95),
              "Rolled 11 with a main of " + st.main + " - a nick.",
              "nick on 11",
            );
        } else if (st.main === 5 || st.main === 9) {
          if (tot === 11)
            end(0, "Rolled 11 against a main of " + st.main + " - an out.", "out on 11");
          else
            end(
              Math.floor(st.bet * 1.95),
              "Rolled 12 with a main of " + st.main + " - a nick.",
              "nick on 12",
            );
        } else
          end(
            Math.floor(st.bet * 1.95),
            "Rolled " + tot + " with a main of 7 - a nick.",
            "nick on " + tot,
          );
      } else {
        st.chance = tot;
        nxEl(cfg.key + "Sub").textContent =
          "Your chance is " + tot + " - roll it again before the main " + st.main + " to win";
        v2Msg(
          cfg.key,
          "Chance set at " +
            tot +
            ". Roll again: repeat " +
            tot +
            " to win, roll " +
            st.main +
            " to lose.",
          "info",
        );
      }
    } else {
      if (tot === st.chance) {
        end(
          Math.floor(st.bet * 1.95),
          "Rolled " + tot + " again - your chance comes up and you win.",
          "chance " + tot + " made",
        );
      } else if (tot === st.main) {
        end(
          0,
          "Rolled " + tot + " - the main appears before your chance. The round ends.",
          "main hit first",
        );
      } else
        v2Msg(
          cfg.key,
          "Rolled " + tot + " - no result. Roll again for your chance " + st.chance + ".",
          "info",
        );
    }
  }
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2UnderOver(cfg) {
  var pick = "U";
  nxPickRow(cfg.key + "Pick", function (v) {
    pick = v;
  });
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    var d1 = nxD6(),
      d2 = nxD6(),
      tot = d1 + d2;
    nxEl(cfg.key + "Disp").innerHTML = '<div class="dicefaces">' + v2DiceHTML([d1, d2]) + "</div>";
    sfx.deal();
    var res = tot < 7 ? "U" : tot > 7 ? "O" : "E";
    var mult = res === "E" ? 5.7 : 2.28;
    var payout = pick === res ? Math.floor(bet * mult) : 0;
    var names = { U: "Under 7", O: "Over 7", E: "Exactly 7" };
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText:
        "Dice total " +
        tot +
        " - " +
        names[res] +
        ". Your bet pays x" +
        mult +
        " and you collect " +
        fmt(payout) +
        " fun credits.",
      loseText:
        "Dice total " +
        tot +
        " - " +
        names[res] +
        ", but you backed " +
        names[pick] +
        ". Your bet of " +
        fmt(bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      note: "total " + tot,
    });
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2ChuckDuel(cfg) {
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    var p = [nxD6(), nxD6(), nxD6()],
      d = [nxD6(), nxD6(), nxD6()];
    var pt = p[0] + p[1] + p[2],
      dt = d[0] + d[1] + d[2];
    nxEl(cfg.key + "Disp").innerHTML =
      '<div class="nxlabel">Your dice - total ' +
      pt +
      '</div><div class="dicefaces">' +
      v2DiceHTML(p) +
      '</div><div class="nxlabel">Dealer dice - total ' +
      dt +
      '</div><div class="dicefaces">' +
      v2DiceHTML(d) +
      "</div>";
    sfx.deal();
    var payout = pt > dt ? Math.floor(bet * 2.13) : pt === dt ? bet : 0;
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText:
        "Your " +
        pt +
        " beats the dealer " +
        dt +
        " - pays x2.13. You collect " +
        fmt(payout) +
        " fun credits.",
      loseText:
        "Dealer rolls " +
        dt +
        " against your " +
        pt +
        " - your bet of " +
        fmt(bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      pushText: "Both totals are " + pt + " - a push, your bet is returned.",
      note: pt + " vs " + dt,
    });
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2LiarsDice(cfg) {
  var st = { active: false, bet: 0, mine: [], ai: [], face: 3, count: 3 };
  function renderMine() {
    nxEl(cfg.key + "Disp").innerHTML =
      '<div class="nxlabel">Your five dice (only you can see them)</div><div class="dicefaces">' +
      v2DiceHTML(st.mine) +
      "</div>";
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.mine = [nxD6(), nxD6(), nxD6(), nxD6(), nxD6()];
    st.ai = [nxD6(), nxD6(), nxD6(), nxD6(), nxD6()];
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    renderMine();
    v2Msg(
      cfg.key,
      "Make your bid: pick a face and how many of all ten dice show it. Then the rival decides to challenge or raise.",
      "info",
    );
    bidActs();
  });
  function bidActs() {
    var faces = "";
    v2Acts(cfg.key, []);
    var box = nxEl(cfg.key + "Acts");
    var lbl = document.createElement("span");
    lbl.className = "nxsub";
    lbl.textContent = "Your bid: face";
    box.appendChild(lbl);
    [2, 3, 4, 5, 6].forEach(function (f) {
      var b = document.createElement("button");
      b.className = "btn small" + (st.face === f ? " gold" : "");
      b.textContent = f;
      b.addEventListener("click", function () {
        st.face = f;
        sfx.click();
        bidActs();
      });
      box.appendChild(b);
    });
    var lbl2 = document.createElement("span");
    lbl2.className = "nxsub";
    lbl2.textContent = "count";
    box.appendChild(lbl2);
    [1, 2, 3, 4, 5, 6, 7, 8].forEach(function (c) {
      var b = document.createElement("button");
      b.className = "btn small" + (st.count === c ? " gold" : "");
      b.textContent = c;
      b.addEventListener("click", function () {
        st.count = c;
        sfx.click();
        bidActs();
      });
      box.appendChild(b);
    });
    var go = document.createElement("button");
    go.className = "btn gold";
    go.textContent = "Make bid";
    go.addEventListener("click", function () {
      sfx.click();
      aiRespond(st.face, st.count);
    });
    box.appendChild(go);
  }
  function totalOf(face) {
    return st.mine.concat(st.ai).filter(function (d) {
      return d === face;
    }).length;
  }
  function reveal() {
    nxEl(cfg.key + "Disp").innerHTML =
      '<div class="nxlabel">Your dice</div><div class="dicefaces">' +
      v2DiceHTML(st.mine) +
      '</div><div class="nxlabel">Rival dice</div><div class="dicefaces">' +
      v2DiceHTML(st.ai) +
      "</div>";
  }
  function settle(win, why) {
    st.active = false;
    reveal();
    nxEl(cfg.key + "Play").disabled = false;
    v2Acts(cfg.key, []);
    var payout = win ? Math.floor(st.bet * 1.94) : 0;
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText: why + " You collect " + fmt(payout) + " fun credits.",
      loseText:
        why +
        " Your bet of " +
        fmt(st.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      note: "liars dice",
    });
  }
  function aiRespond(face, count) {
    var aiHas = st.ai.filter(function (d) {
      return d === face;
    }).length;
    var expected = aiHas + 5 / 6;
    if (count > expected + 1.6) {
      var tot = totalOf(face);
      settle(
        tot < count,
        "The rival challenges your bid of " +
          count +
          " x " +
          face +
          ". There are " +
          tot +
          " across all ten dice - " +
          (tot < count ? "your bid was too high." : "your bid was good."),
      );
    } else {
      var nFace = face,
        nCount = count + 1;
      v2Msg(
        cfg.key,
        "The rival raises to " +
          nCount +
          " x " +
          nFace +
          ". Challenge the raise, or fold the round.",
        "info",
      );
      v2Acts(cfg.key, [
        {
          label: "Challenge",
          cls: "gold",
          fn: function () {
            var tot = totalOf(nFace);
            settle(
              tot < nCount,
              "You challenge the raise of " +
                nCount +
                " x " +
                nFace +
                ". There are " +
                tot +
                " across all ten dice - " +
                (tot < nCount ? "the raise was a bluff." : "the raise was honest."),
            );
          },
        },
        {
          label: "Fold",
          fn: function () {
            st.active = false;
            nxEl(cfg.key + "Play").disabled = false;
            v2Acts(cfg.key, []);
            nxFinish({
              scr: cfg.scr,
              key: cfg.key,
              name: cfg.name,
              bet: st.bet,
              payout: 0,
              msg: cfg.key + "Msg",
              winText: "",
              loseText:
                "You folded against the raise - your bet of " +
                fmt(st.bet) +
                " fun credits is lost. Balance: " +
                fmt(bal) +
                " fun credits.",
              note: "folded",
            });
          },
        },
      ]);
    }
  }
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2BigSix(cfg) {
  var SEG = [
    ["1", 23],
    ["2", 15],
    ["5", 8],
    ["10", 4],
    ["20", 2],
    ["40", 1],
    ["JOKER", 1],
  ];
  var PAY = { 1: 2.23, 2: 3.42, 5: 6.41, 10: 12.83, 20: 25.65, 40: 51.3, JOKER: 51.3 };
  var pick = "1";
  nxPickRow(cfg.key + "Pick", function (v) {
    pick = v;
  });
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    var btn = nxEl(cfg.key + "Play");
    if (btn.disabled) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    btn.disabled = true;
    var wheel = [];
    SEG.forEach(function (s) {
      for (var i = 0; i < s[1]; i++) wheel.push(s[0]);
    });
    var land = v2Pick(wheel);
    var disp = nxEl(cfg.key + "Disp");
    var ticks = 0;
    var iv = v2Every(function () {
      ticks++;
      disp.innerHTML = '<div class="bigmult">' + v2Pick(wheel) + "</div>";
      sfx.tick();
      if (ticks > 14) {
        v2ClearOne(iv);
        disp.innerHTML = '<div class="bigmult">' + land + "</div>";
        btn.disabled = false;
        var payout = land === pick ? Math.floor(bet * PAY[pick]) : 0;
        nxFinish({
          scr: cfg.scr,
          key: cfg.key,
          name: cfg.name,
          bet: bet,
          payout: payout,
          msg: cfg.key + "Msg",
          winText:
            "The wheel stops on " +
            land +
            " - your symbol pays x" +
            PAY[pick] +
            ". You collect " +
            fmt(payout) +
            " fun credits.",
          loseText:
            "The wheel stops on " +
            land +
            ", not your " +
            pick +
            " - your bet of " +
            fmt(bet) +
            " fun credits is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          note: "wheel " + land,
        });
      }
    }, 70);
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
var ROUL_REDS = {
  1: 1,
  3: 1,
  5: 1,
  7: 1,
  9: 1,
  12: 1,
  14: 1,
  16: 1,
  18: 1,
  19: 1,
  21: 1,
  23: 1,
  25: 1,
  27: 1,
  30: 1,
  32: 1,
  34: 1,
  36: 1,
};
function v2Roulette2(cfg) {
  var pockets = cfg.american
    ? ["0", "00"].concat(
        Array.from({ length: 36 }, function (_, i) {
          return String(i + 1);
        }),
      )
    : Array.from({ length: 37 }, function (_, i) {
        return String(i);
      });
  var pick = "red",
    straight = "7";
  nxPickRow(cfg.key + "Pick", function (v) {
    pick = v;
  });
  var grid = nxEl(cfg.key + "Nums");
  if (grid) {
    pockets.forEach(function (n) {
      var b = document.createElement("button");
      b.className = "lnum" + (n === straight ? " picked" : "");
      b.textContent = n;
      b.addEventListener("click", function () {
        straight = n;
        $$(".lnum", grid).forEach(function (x) {
          x.classList.remove("picked");
        });
        b.classList.add("picked");
        sfx.click();
      });
      grid.appendChild(b);
    });
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    var btn = nxEl(cfg.key + "Play");
    if (btn.disabled) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    btn.disabled = true;
    var land = v2Pick(pockets);
    var wn = nxEl(cfg.key + "Wheel");
    var ticks = 0;
    var iv = v2Every(function () {
      ticks++;
      var n = v2Pick(pockets);
      wn.textContent = n;
      wn.className =
        "wheelnum " + (n === "0" || n === "00" ? "green" : ROUL_REDS[n] ? "red" : "black");
      sfx.tick();
      if (ticks > 16) {
        v2ClearOne(iv);
        wn.textContent = land;
        wn.className =
          "wheelnum " +
          (land === "0" || land === "00" ? "green" : ROUL_REDS[land] ? "red" : "black");
        btn.disabled = false;
        var num = land === "00" ? -1 : Number(land);
        var payout = 0,
          winName = "";
        if (pick === "straight") {
          if (land === straight) {
            payout = bet * 36;
            winName = "Straight number " + land;
          }
        } else if (pick === "red" && ROUL_REDS[land]) {
          payout = bet * 2;
          winName = "Red";
        } else if (pick === "black" && num > 0 && !ROUL_REDS[land]) {
          payout = bet * 2;
          winName = "Black";
        } else if (pick === "even" && num > 0 && num % 2 === 0) {
          payout = bet * 2;
          winName = "Even";
        } else if (pick === "odd" && num > 0 && num % 2 === 1) {
          payout = bet * 2;
          winName = "Odd";
        } else if (pick === "low" && num >= 1 && num <= 18) {
          payout = bet * 2;
          winName = "Low 1-18";
        } else if (pick === "high" && num >= 19 && num <= 36) {
          payout = bet * 2;
          winName = "High 19-36";
        } else if (pick === "d1" && num >= 1 && num <= 12) {
          payout = bet * 3;
          winName = "First dozen";
        } else if (pick === "d2" && num >= 13 && num <= 24) {
          payout = bet * 3;
          winName = "Second dozen";
        } else if (pick === "d3" && num >= 25 && num <= 36) {
          payout = bet * 3;
          winName = "Third dozen";
        }
        if (
          !payout &&
          cfg.laPartage &&
          land === "0" &&
          ["red", "black", "even", "odd", "low", "high"].indexOf(pick) >= 0
        )
          payout = Math.floor(bet / 2);
        nxFinish({
          scr: cfg.scr,
          key: cfg.key,
          name: cfg.name,
          bet: bet,
          payout: payout,
          msg: cfg.key + "Msg",
          winText:
            "The ball lands on " +
            land +
            " - " +
            winName +
            " wins. You collect " +
            fmt(payout) +
            " fun credits.",
          loseText:
            "The ball lands on " +
            land +
            " - your bet loses. Your bet of " +
            fmt(bet) +
            " fun credits is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          partText:
            "The ball lands on 0 - La Partage returns half your even-money bet: " +
            fmt(payout) +
            " fun credits back.",
          note: "landed " + land,
        });
      }
    }, 70);
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2RollWin(cfg) {
  var st = { active: false, bet: 0, target: 4, hits: 0 };
  nxPickRow(cfg.key + "Pick", function (v) {
    st.target = Number(v);
  });
  function mult() {
    return Math.pow(5.82, st.hits);
  }
  function acts() {
    v2Acts(cfg.key, [
      {
        label: "Roll the die",
        cls: "gold",
        fn: function () {
          var d = nxD6();
          nxEl(cfg.key + "Disp").innerHTML = '<div class="dicefaces">' + v2DiceHTML([d]) + "</div>";
          sfx.deal();
          if (d === st.target) {
            st.hits++;
            nxEl(cfg.key + "Sub").textContent =
              "Hits: " + st.hits + " - cash out value: x" + mult().toFixed(2);
            v2Msg(
              cfg.key,
              "Hit number " +
                st.hits +
                " - your ladder is at x" +
                mult().toFixed(2) +
                ". Roll again or cash out.",
              "win",
            );
            acts();
          } else {
            st.active = false;
            nxEl(cfg.key + "Play").disabled = false;
            v2Acts(cfg.key, []);
            nxFinish({
              scr: cfg.scr,
              key: cfg.key,
              name: cfg.name,
              bet: st.bet,
              payout: 0,
              msg: cfg.key + "Msg",
              winText: "",
              loseText:
                "Rolled " +
                d +
                ", not your " +
                st.target +
                " - the ladder falls. Your bet of " +
                fmt(st.bet) +
                " fun credits is lost. Balance: " +
                fmt(bal) +
                " fun credits.",
              note: st.hits + " hits then out",
            });
          }
        },
      },
      {
        label: "Cash out",
        cls: "teal",
        fn: function () {
          if (!st.hits) {
            v2Msg(cfg.key, "Score at least one hit before cashing out.", "lose");
            return;
          }
          st.active = false;
          nxEl(cfg.key + "Play").disabled = false;
          v2Acts(cfg.key, []);
          var payout = Math.floor(st.bet * mult());
          nxFinish({
            scr: cfg.scr,
            key: cfg.key,
            name: cfg.name,
            bet: st.bet,
            payout: payout,
            msg: cfg.key + "Msg",
            winText:
              "Cashed out after " +
              st.hits +
              " hits at x" +
              mult().toFixed(2) +
              " - you collect " +
              fmt(payout) +
              " fun credits.",
            loseText: "",
            note: st.hits + " hits cashed",
          });
        },
      },
    ]);
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.hits = 0;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Sub").textContent = "Hits: 0 - cash out value: x1.00";
    v2Msg(
      cfg.key,
      "Roll the die - every roll showing your number " + st.target + " climbs the ladder by x5.82.",
      "info",
    );
    acts();
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}

/* ================= crash, climb and pick engines ================= */
function v2Crash2(cfg) {
  var st = { active: false, bet: 0, m: 1, cp: 1, iv: 0 };
  function end(payout, crashed) {
    st.active = false;
    v2ClearOne(st.iv);
    nxEl(cfg.key + "Play").disabled = false;
    nxEl(cfg.key + "Alt").disabled = true;
    if (crashed) {
      nxEl(cfg.key + "Disp").innerHTML =
        '<div class="bigmult" style="color:var(--red)">Derailed at x' + st.cp.toFixed(2) + "</div>";
      sfx.boom();
      nxFinish({
        scr: cfg.scr,
        key: cfg.key,
        name: cfg.name,
        bet: st.bet,
        payout: 0,
        msg: cfg.key + "Msg",
        winText: "",
        loseText:
          "The train derailed at x" +
          st.cp.toFixed(2) +
          " before you cashed out - your bet of " +
          fmt(st.bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        note: "derailed x" + st.cp.toFixed(2),
      });
    }
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    var r = Math.random();
    st.cp = r < 0.01 ? 1 : Math.min(50, 0.99 / (1 - r));
    st.m = 1;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Alt").disabled = false;
    v2Msg(
      cfg.key,
      "The train is rolling and the multiplier is climbing. Cash out before it derails.",
      "info",
    );
    var ticks = 0;
    st.iv = v2Every(function () {
      ticks++;
      st.m = Math.pow(1.055, ticks);
      if (st.m >= st.cp) {
        st.m = st.cp;
        end(0, true);
        return;
      }
      nxEl(cfg.key + "Disp").innerHTML = '<div class="bigmult">x' + st.m.toFixed(2) + "</div>";
      if (ticks % 4 === 0) sfx.tick();
    }, 100);
  });
  nxEl(cfg.key + "Alt").addEventListener("click", function () {
    if (!st.active) return;
    var payout = Math.floor(st.bet * st.m);
    var mNow = st.m;
    st.active = false;
    v2ClearOne(st.iv);
    nxEl(cfg.key + "Play").disabled = false;
    nxEl(cfg.key + "Alt").disabled = true;
    nxEl(cfg.key + "Disp").innerHTML = '<div class="bigmult">x' + mNow.toFixed(2) + "</div>";
    sfx.win();
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText:
        "You cashed out at x" +
        mNow.toFixed(2) +
        " - you collect " +
        fmt(payout) +
        " fun credits. The train later derailed at x" +
        st.cp.toFixed(2) +
        ".",
      loseText: "",
      note: "cashed x" + mNow.toFixed(2),
    });
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2GemHunt(cfg) {
  var st = { active: false, bet: 0, bombs: {}, found: 0 };
  function mult() {
    var m = 0.97;
    for (var i = 0; i < st.found; i++) m *= (64 - i) / (59 - i);
    return m;
  }
  function render() {
    var box = nxEl(cfg.key + "Disp");
    box.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "tiles";
    grid.style.gridTemplateColumns = "repeat(8,1fr)";
    grid.style.maxWidth = "430px";
    for (var i = 0; i < 64; i++) {
      var b = document.createElement("button");
      b.className = "tile";
      b.textContent = "?";
      b.setAttribute("data-i", i);
      b.style.minWidth = "0";
      b.style.minHeight = "38px";
      grid.appendChild(b);
    }
    box.appendChild(grid);
    nxEl(cfg.key + "Sub").textContent = cfg.intro;
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.found = 0;
    st.bombs = {};
    var placed = 0;
    while (placed < 5) {
      var n = v2Rand(0, 63);
      if (!st.bombs[n]) {
        st.bombs[n] = 1;
        placed++;
      }
    }
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Alt").disabled = true;
    render();
    $$(".tile", nxEl(cfg.key + "Disp")).forEach(function (t) {
      t.addEventListener("click", function () {
        if (!st.active || t.disabled) return;
        var i = Number(t.getAttribute("data-i"));
        t.disabled = true;
        if (st.bombs[i]) {
          t.className = "tile bad";
          t.textContent = "X";
          st.active = false;
          nxEl(cfg.key + "Play").disabled = false;
          nxEl(cfg.key + "Alt").disabled = true;
          sfx.boom();
          nxFinish({
            scr: cfg.scr,
            key: cfg.key,
            name: cfg.name,
            bet: st.bet,
            payout: 0,
            msg: cfg.key + "Msg",
            winText: "",
            loseText:
              "That cell held a bomb after " +
              st.found +
              " safe gems - your bet of " +
              fmt(st.bet) +
              " fun credits is lost. Balance: " +
              fmt(bal) +
              " fun credits.",
            note: st.found + " gems then bomb",
          });
        } else {
          t.className = "tile good";
          t.textContent = "G";
          st.found++;
          sfx.gem();
          nxEl(cfg.key + "Sub").textContent =
            "Safe gems: " +
            st.found +
            " - cash out value: " +
            fmt(Math.floor(st.bet * mult())) +
            " fun credits (x" +
            mult().toFixed(2) +
            ")";
          nxEl(cfg.key + "Alt").disabled = st.found === 0;
          if (st.found >= 20)
            v2Msg(cfg.key, "Twenty gems found - the grid is hot. Cash out soon.", "win");
        }
      });
    });
    v2Msg(
      cfg.key,
      "Pick a cell to hunt for gems. Five bombs are hidden - cash out any time.",
      "info",
    );
  });
  nxEl(cfg.key + "Alt").addEventListener("click", function () {
    if (!st.active || !st.found) return;
    st.active = false;
    nxEl(cfg.key + "Play").disabled = false;
    nxEl(cfg.key + "Alt").disabled = true;
    var payout = Math.floor(st.bet * mult());
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText:
        "You cashed out with " +
        st.found +
        " gems at x" +
        mult().toFixed(2) +
        " - you collect " +
        fmt(payout) +
        " fun credits.",
      loseText: "",
      partText:
        "You cashed out with " +
        st.found +
        " gems at x" +
        mult().toFixed(2) +
        " - " +
        fmt(payout) +
        " fun credits come back.",
      note: st.found + " gems cashed",
    });
  });
  nxEl(cfg.key + "Alt").disabled = true;
  render();
}
function v2StairDice(cfg) {
  var st = { active: false, bet: 0, step: 0 };
  function mult() {
    return 0.96 * Math.pow(1.2, st.step);
  }
  function trap() {
    return (st.step % 6) + 1;
  }
  function render() {
    var html = '<div class="stairrow">';
    for (var i = 1; i <= 12; i++)
      html +=
        '<div class="stair' +
        (i <= st.step ? " done" : i === st.step + 1 ? " now" : "") +
        '">' +
        i +
        "</div>";
    html += "</div>";
    nxEl(cfg.key + "Disp").innerHTML = html;
    nxEl(cfg.key + "Sub").textContent = st.active
      ? "Step " +
        st.step +
        " of 12 - next trap number: " +
        trap() +
        " - cash out value x" +
        mult().toFixed(2)
      : cfg.intro;
  }
  function acts() {
    v2Acts(cfg.key, [
      {
        label: "Roll to climb",
        cls: "gold",
        fn: function () {
          var d = nxD6();
          sfx.deal();
          if (d === trap()) {
            st.active = false;
            nxEl(cfg.key + "Play").disabled = false;
            v2Acts(cfg.key, []);
            render();
            nxFinish({
              scr: cfg.scr,
              key: cfg.key,
              name: cfg.name,
              bet: st.bet,
              payout: 0,
              msg: cfg.key + "Msg",
              winText: "",
              loseText:
                "You rolled " +
                d +
                " - the trap number on step " +
                (st.step + 1) +
                ". You fall and lose your bet of " +
                fmt(st.bet) +
                " fun credits. Balance: " +
                fmt(bal) +
                " fun credits.",
              note: "fell at step " + (st.step + 1),
            });
            return;
          }
          st.step++;
          render();
          if (st.step >= 12) {
            st.active = false;
            nxEl(cfg.key + "Play").disabled = false;
            v2Acts(cfg.key, []);
            var payout = Math.floor(st.bet * mult());
            nxFinish({
              scr: cfg.scr,
              key: cfg.key,
              name: cfg.name,
              bet: st.bet,
              payout: payout,
              msg: cfg.key + "Msg",
              winText:
                "Top of the stairs - all 12 steps climbed at x" +
                mult().toFixed(2) +
                ". You collect " +
                fmt(payout) +
                " fun credits.",
              loseText: "",
              note: "top reached",
            });
            return;
          }
          v2Msg(
            cfg.key,
            "Rolled " +
              d +
              " - safe. You are on step " +
              st.step +
              " at x" +
              mult().toFixed(2) +
              ".",
            "info",
          );
          acts();
        },
      },
      {
        label: "Cash out",
        cls: "teal",
        fn: function () {
          if (!st.step) {
            v2Msg(cfg.key, "Climb at least one step before cashing out.", "lose");
            return;
          }
          st.active = false;
          nxEl(cfg.key + "Play").disabled = false;
          v2Acts(cfg.key, []);
          var payout = Math.floor(st.bet * mult());
          nxFinish({
            scr: cfg.scr,
            key: cfg.key,
            name: cfg.name,
            bet: st.bet,
            payout: payout,
            msg: cfg.key + "Msg",
            winText:
              "Cashed out on step " +
              st.step +
              " at x" +
              mult().toFixed(2) +
              " - you collect " +
              fmt(payout) +
              " fun credits.",
            loseText: "",
            partText:
              "Cashed out on step " +
              st.step +
              " at x" +
              mult().toFixed(2) +
              " - " +
              fmt(payout) +
              " fun credits come back.",
            note: "cashed step " + st.step,
          });
        },
      },
    ]);
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.step = 0;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    render();
    acts();
    v2Msg(
      cfg.key,
      "Roll to climb. Each step shows its trap number first - roll it and you fall.",
      "info",
    );
  });
  render();
}
function v2BalloonPop(cfg) {
  var st = { active: false, bet: 0, vals: [], popped: 0, sum: 0 };
  function render() {
    var box = nxEl(cfg.key + "Disp");
    box.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "tiles";
    grid.style.gridTemplateColumns = "repeat(4,1fr)";
    grid.style.maxWidth = "430px";
    st.vals.forEach(function (v, i) {
      var b = document.createElement("button");
      b.className = "tile face";
      b.textContent = "O";
      b.setAttribute("data-i", i);
      b.addEventListener("click", function () {
        if (!st.active || b.disabled) return;
        b.disabled = true;
        if (v === -1) {
          b.className = "tile bad";
          b.textContent = "X";
          st.active = false;
          nxEl(cfg.key + "Play").disabled = false;
          nxEl(cfg.key + "Alt").disabled = true;
          sfx.boom();
          nxFinish({
            scr: cfg.scr,
            key: cfg.key,
            name: cfg.name,
            bet: st.bet,
            payout: 0,
            msg: cfg.key + "Msg",
            winText: "",
            loseText:
              "That balloon held the popper after " +
              st.popped +
              " safe pops - your bet of " +
              fmt(st.bet) +
              " fun credits is lost. Balance: " +
              fmt(bal) +
              " fun credits.",
            note: st.popped + " pops then popper",
          });
        } else {
          b.className = "tile good";
          b.textContent = "+" + v.toFixed(2);
          st.popped++;
          st.sum += v;
          sfx.gem();
          nxEl(cfg.key + "Sub").textContent =
            "Popped: " +
            st.popped +
            " - multiplier x" +
            (1 + st.sum).toFixed(2) +
            " - cash out pays x" +
            ((1 + st.sum) * 0.96).toFixed(2);
          nxEl(cfg.key + "Alt").disabled = false;
        }
      });
      grid.appendChild(b);
    });
    box.appendChild(grid);
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.popped = 0;
    st.sum = 0;
    st.vals = v2Shuffle([0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, -1]);
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Alt").disabled = true;
    render();
    nxEl(cfg.key + "Sub").textContent = "Multiplier x1.00 - pop a balloon to build it";
    v2Msg(
      cfg.key,
      "Pop balloons to build your multiplier. One balloon holds the popper - cash out any time.",
      "info",
    );
  });
  nxEl(cfg.key + "Alt").addEventListener("click", function () {
    if (!st.active || !st.popped) return;
    st.active = false;
    nxEl(cfg.key + "Play").disabled = false;
    nxEl(cfg.key + "Alt").disabled = true;
    var payout = Math.floor(st.bet * (1 + st.sum) * 0.96);
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText:
        "Cashed out after " +
        st.popped +
        " pops at x" +
        ((1 + st.sum) * 0.96).toFixed(2) +
        " - you collect " +
        fmt(payout) +
        " fun credits.",
      loseText: "",
      note: st.popped + " pops cashed",
    });
  });
  nxEl(cfg.key + "Alt").disabled = true;
  st.vals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  render();
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2Vault(cfg) {
  var VALS = [0, 0, 0, 0, 0, 0, 0.1, 0.2, 0.3, 0.5, 0.8, 9.5];
  var st = { active: false, bet: 0, vals: [] };
  function render() {
    var box = nxEl(cfg.key + "Disp");
    box.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "tiles";
    grid.style.gridTemplateColumns = "repeat(4,1fr)";
    grid.style.maxWidth = "430px";
    for (var i = 0; i < 12; i++) {
      var b = document.createElement("button");
      b.className = "tile face";
      b.textContent = i + 1;
      b.setAttribute("data-i", i);
      b.addEventListener("click", function () {
        if (!st.active) return;
        var idx = Number(b.getAttribute("data-i"));
        st.active = false;
        var v = st.vals[idx];
        b.className = "tile " + (v >= 1 ? "good" : v > 0 ? "on" : "bad");
        b.textContent = v === 0 ? "Empty" : "x" + v;
        $$(".tile", box).forEach(function (x) {
          x.disabled = true;
        });
        nxEl(cfg.key + "Play").disabled = false;
        var payout = Math.floor(st.bet * v);
        nxFinish({
          scr: cfg.scr,
          key: cfg.key,
          name: cfg.name,
          bet: st.bet,
          payout: payout,
          msg: cfg.key + "Msg",
          winText:
            v >= 9
              ? "The jackpot vault - x9.5! You collect " + fmt(payout) + " fun credits."
              : "Vault " +
                (idx + 1) +
                " holds x" +
                v +
                " - you collect " +
                fmt(payout) +
                " fun credits.",
          loseText:
            "Vault " +
            (idx + 1) +
            " is empty - your bet of " +
            fmt(st.bet) +
            " fun credits is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          partText:
            "Vault " + (idx + 1) + " holds x" + v + " - " + fmt(payout) + " fun credits come back.",
          note: "vault x" + v,
        });
      });
      grid.appendChild(b);
    }
    box.appendChild(grid);
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.vals = v2Shuffle(VALS.slice());
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    render();
    v2Msg(cfg.key, "The vaults are loaded and shuffled. Pick one door.", "info");
  });
  render();
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}

/* ================= lottery, fishing and sports engines ================= */
var SK_W = [
  ["cherry", 24],
  ["lemon", 22],
  ["grape", 17],
  ["bell", 12],
  ["seven", 5],
  ["crown", 5],
];
var SK_PAY = { cherry: 15, lemon: 19, grape: 27, bell: 45, seven: 110, crown: 220 };
function v2ScratchKing(cfg) {
  var st = { active: false, bet: 0, syms: [], open: 0 };
  function render() {
    var box = nxEl(cfg.key + "Disp");
    box.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "tiles";
    grid.style.gridTemplateColumns = "repeat(3,1fr)";
    grid.style.maxWidth = "330px";
    st.syms.forEach(function (s, i) {
      var b = document.createElement("button");
      b.className = "tile face";
      b.innerHTML = "?";
      b.setAttribute("data-i", i);
      b.addEventListener("click", function () {
        openTile(b, i);
      });
      grid.appendChild(b);
    });
    box.appendChild(grid);
  }
  function openTile(b, i) {
    if (!st.active || b.disabled) return;
    b.disabled = true;
    b.className = "tile";
    b.innerHTML = symHTML(st.syms[i]);
    st.open++;
    sfx.tick();
    if (st.open >= 15) settle();
  }
  function settle() {
    st.active = false;
    nxEl(cfg.key + "Play").disabled = false;
    nxEl(cfg.key + "Alt").disabled = true;
    var lineBet = st.bet / 5,
      total = 0,
      wins = [];
    for (var r = 0; r < 5; r++) {
      var row = [st.syms[r * 3], st.syms[r * 3 + 1], st.syms[r * 3 + 2]];
      if (row[0] === row[1] && row[1] === row[2]) {
        total += SK_PAY[row[0]] * lineBet;
        wins.push("row " + (r + 1) + " triple " + row[0]);
      } else if (row[0] === row[1] || row[1] === row[2] || row[0] === row[2]) {
        total += 0.9 * lineBet;
        wins.push("row " + (r + 1) + " pair");
      }
    }
    total = Math.floor(total);
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: total,
      msg: cfg.key + "Msg",
      winText:
        "Card complete - " + wins.join(", ") + ". You collect " + fmt(total) + " fun credits.",
      loseText:
        "Card complete with no paying row - your bet of " +
        fmt(st.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      partText:
        "Card complete - " + wins.join(", ") + " - " + fmt(total) + " fun credits come back.",
      note: wins.length + " paying rows",
    });
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    bet = Math.max(10, Math.floor(bet / 5) * 5);
    nxEl(cfg.key + "Bet").value = bet;
    if (bet > bal) {
      setMsgNearby(nxEl(cfg.key + "Bet"), "Bet is higher than your balance.");
      return;
    }
    addBal(-bet);
    st.bet = bet;
    st.open = 0;
    st.syms = [];
    for (var i = 0; i < 15; i++) st.syms.push(pickWeighted(SK_W));
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Alt").disabled = false;
    render();
    v2Msg(cfg.key, "Card bought. Tap tiles to scratch, or reveal the whole card.", "info");
  });
  nxEl(cfg.key + "Alt").addEventListener("click", function () {
    if (!st.active) return;
    $$(".tile", nxEl(cfg.key + "Disp")).forEach(function (b, i) {
      if (!b.disabled) openTile(b, i);
    });
  });
  nxEl(cfg.key + "Alt").disabled = true;
  st.syms = [
    "cherry",
    "lemon",
    "grape",
    "bell",
    "seven",
    "crown",
    "cherry",
    "lemon",
    "grape",
    "bell",
    "seven",
    "crown",
    "cherry",
    "lemon",
    "grape",
  ];
  render();
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2InstantWin(cfg) {
  var W = [
    ["cherry", 30],
    ["lemon", 25],
    ["grape", 20],
    ["bell", 12],
    ["gem", 8],
    ["crown", 5],
  ];
  var TP = { cherry: 3, lemon: 4, grape: 6, bell: 12, gem: 25, crown: 40 };
  var st = { active: false, bet: 0, syms: [], open: 0 };
  function render() {
    var box = nxEl(cfg.key + "Disp");
    box.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "tiles";
    grid.style.gridTemplateColumns = "repeat(3,1fr)";
    grid.style.maxWidth = "330px";
    st.syms.forEach(function (s, i) {
      var b = document.createElement("button");
      b.className = "tile face";
      b.textContent = "?";
      b.addEventListener("click", function () {
        if (!st.active || b.disabled) return;
        b.disabled = true;
        b.className = "tile";
        b.innerHTML = symHTML(s);
        st.open++;
        sfx.gem();
        if (st.open >= 3) {
          st.active = false;
          nxEl(cfg.key + "Play").disabled = false;
          var payout = 0,
            note = "no match";
          if (st.syms[0] === st.syms[1] && st.syms[1] === st.syms[2]) {
            payout = Math.floor(st.bet * TP[st.syms[0]]);
            note = "triple " + st.syms[0];
          } else if (
            st.syms[0] === st.syms[1] ||
            st.syms[1] === st.syms[2] ||
            st.syms[0] === st.syms[2]
          ) {
            payout = Math.floor(st.bet * 1.5);
            note = "a pair";
          }
          nxFinish({
            scr: cfg.scr,
            key: cfg.key,
            name: cfg.name,
            bet: st.bet,
            payout: payout,
            msg: cfg.key + "Msg",
            winText: "Your cards show " + note + " - you collect " + fmt(payout) + " fun credits.",
            loseText:
              "Three different symbols - no match. Your bet of " +
              fmt(st.bet) +
              " fun credits is lost. Balance: " +
              fmt(bal) +
              " fun credits.",
            note: note,
          });
        }
      });
      grid.appendChild(b);
    });
    box.appendChild(grid);
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.open = 0;
    st.syms = [pickWeighted(W), pickWeighted(W), pickWeighted(W)];
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    render();
    v2Msg(cfg.key, "Three cards are dealt face down. Flip them all.", "info");
  });
  st.syms = ["cherry", "lemon", "crown"];
  render();
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
var KENO_DLX = {
  1: { 1: 3 },
  2: { 2: 12 },
  3: { 2: 2, 3: 20 },
  4: { 2: 1, 3: 6, 4: 45 },
  5: { 3: 3, 4: 15, 5: 120 },
  6: { 3: 2, 4: 8, 5: 60, 6: 400 },
  7: { 4: 3, 5: 20, 6: 150, 7: 1000 },
  8: { 4: 2, 5: 12, 6: 60, 7: 400, 8: 2000 },
  9: { 5: 5, 6: 30, 7: 200, 8: 1200, 9: 4000 },
  10: { 5: 3, 6: 15, 7: 100, 8: 600, 9: 2500, 10: 8000 },
  11: { 6: 8, 7: 50, 8: 300, 9: 1500, 10: 6000, 11: 15000 },
  12: { 6: 5, 7: 30, 8: 150, 9: 800, 10: 3000, 11: 9000, 12: 25000 },
  13: { 7: 15, 8: 80, 9: 400, 10: 2000, 11: 8000, 12: 20000, 13: 40000 },
  14: { 7: 8, 8: 50, 9: 250, 10: 1200, 11: 5000, 12: 15000, 13: 30000, 14: 60000 },
  15: { 8: 25, 9: 120, 10: 600, 11: 2500, 12: 10000, 13: 25000, 14: 50000, 15: 100000 },
};
function v2KenoDeluxe(cfg) {
  var picks = {},
    btns = [];
  var grid = nxEl(cfg.key + "Grid");
  for (var n = 1; n <= 80; n++) {
    var b = document.createElement("button");
    b.className = "lnum";
    b.textContent = n;
    (function (num, btn) {
      btn.addEventListener("click", function () {
        if (picks[num]) {
          delete picks[num];
          btn.classList.remove("picked");
        } else {
          if (Object.keys(picks).length >= 15) {
            v2Msg(
              cfg.key,
              "Keno Deluxe allows at most 15 picks. Tap a picked number to remove it.",
              "lose",
            );
            return;
          }
          picks[num] = true;
          btn.classList.add("picked");
        }
        sfx.click();
        nxEl(cfg.key + "Sub").textContent = Object.keys(picks).length + " numbers picked";
      });
    })(n, b);
    grid.appendChild(b);
    btns.push(b);
  }
  nxEl(cfg.key + "Alt").addEventListener("click", function () {
    picks = {};
    btns.forEach(function (b) {
      b.classList.remove("picked", "drawn", "hit");
    });
    var pool = v2Shuffle(
      Array.from({ length: 80 }, function (_, i) {
        return i + 1;
      }),
    );
    pool.slice(0, 10).forEach(function (num) {
      picks[num] = true;
      btns[num - 1].classList.add("picked");
    });
    nxEl(cfg.key + "Sub").textContent = "10 numbers picked";
    sfx.click();
  });
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    var cnt = Object.keys(picks).length;
    if (!cnt) {
      v2Msg(cfg.key, "Pick at least 1 number first - or tap Quick pick.", "lose");
      return;
    }
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    btns.forEach(function (b) {
      b.classList.remove("drawn", "hit");
    });
    var pool = v2Shuffle(
      Array.from({ length: 80 }, function (_, i) {
        return i + 1;
      }),
    );
    var drawn = pool.slice(0, 20),
      hits = 0;
    drawn.forEach(function (num) {
      btns[num - 1].classList.add("drawn");
      if (picks[num]) {
        hits++;
        btns[num - 1].classList.add("hit");
      }
    });
    nxEl(cfg.key + "Disp").innerHTML = drawn
      .map(function (num) {
        return '<span class="drawnball">' + num + "</span>";
      })
      .join("");
    var mult = (KENO_DLX[cnt] && KENO_DLX[cnt][hits]) || 0;
    var payout = Math.floor(bet * mult);
    sfx.deal();
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText:
        "You picked " +
        cnt +
        " numbers and caught " +
        hits +
        " - pays x" +
        mult +
        ". You collect " +
        fmt(payout) +
        " fun credits.",
      loseText:
        "You picked " +
        cnt +
        " numbers and caught " +
        hits +
        " - no paying tier. Your bet of " +
        fmt(bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      note: cnt + " picks, " + hits + " caught",
    });
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2Bingo90(cfg) {
  function makeCard() {
    var nums = v2Shuffle(
      Array.from({ length: 90 }, function (_, i) {
        return i + 1;
      }),
    )
      .slice(0, 15)
      .sort(function (a, b) {
        return a - b;
      });
    return [nums.slice(0, 5), nums.slice(5, 10), nums.slice(10, 15)];
  }
  function completion(card, pos) {
    var rows = card.map(function (row) {
      return Math.max.apply(
        null,
        row.map(function (n) {
          return pos[n];
        }),
      );
    });
    var sorted = rows.slice().sort(function (a, b) {
      return a - b;
    });
    return { line1: sorted[0], line2: sorted[1], full: sorted[2] };
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    var btn = nxEl(cfg.key + "Play");
    if (btn.disabled) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    btn.disabled = true;
    var cards = [makeCard(), makeCard(), makeCard(), makeCard()];
    var order = v2Shuffle(
      Array.from({ length: 90 }, function (_, i) {
        return i + 1;
      }),
    );
    var pos = {};
    order.forEach(function (n, i) {
      pos[n] = i;
    });
    var comps = cards.map(function (c) {
      return completion(c, pos);
    });
    var tiers = [
      ["line1", 0.6, "one line"],
      ["line2", 1.2, "two lines"],
      ["full", 3, "full house"],
    ];
    var winIdx = { line1: 99, line2: 99, full: 99 };
    tiers.forEach(function (t) {
      var best = Math.min.apply(
        null,
        comps.map(function (c) {
          return c[t[0]];
        }),
      );
      winIdx[t[0]] = best;
    });
    var totalDraws = winIdx.full + 1;
    var gridEl = nxEl(cfg.key + "Disp");
    function renderCard(drawn) {
      var html = '<div class="tiles" style="grid-template-columns:repeat(5,1fr);max-width:330px">';
      cards[0].forEach(function (row) {
        row.forEach(function (n) {
          html +=
            '<div class="tile' +
            (drawn[n] ? " on" : "") +
            '" style="min-height:38px">' +
            n +
            "</div>";
        });
      });
      html += "</div>";
      gridEl.innerHTML = html;
    }
    var drawn = {},
      di = 0;
    renderCard(drawn);
    v2Msg(
      cfg.key,
      "Balls are being drawn - your card is marked automatically. First to each tier wins it.",
      "info",
    );
    var iv = v2Every(function () {
      if (di >= totalDraws) {
        v2ClearOne(iv);
        btn.disabled = false;
        var payout = 0,
          won = [];
        tiers.forEach(function (t) {
          var mine = comps[0][t[0]] === winIdx[t[0]];
          var tied =
            comps.filter(function (c) {
              return c[t[0]] === winIdx[t[0]];
            }).length > 1;
          if (mine) {
            var amt = bet * t[1] * (tied ? 0.5 : 1);
            payout += amt;
            won.push(t[2] + (tied ? " (shared)" : ""));
          }
        });
        payout = Math.floor(payout);
        nxFinish({
          scr: cfg.scr,
          key: cfg.key,
          name: cfg.name,
          bet: bet,
          payout: payout,
          msg: cfg.key + "Msg",
          winText:
            "Your card won: " + won.join(", ") + ". You collect " + fmt(payout) + " fun credits.",
          loseText:
            "The AI cards took every tier this time - your bet of " +
            fmt(bet) +
            " fun credits is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          partText:
            "Your card won: " + won.join(", ") + " - " + fmt(payout) + " fun credits come back.",
          note: won.join(", ") || "no tier",
        });
        return;
      }
      drawn[order[di]] = true;
      nxEl(cfg.key + "Sub").textContent =
        "Ball " + (di + 1) + " of " + totalDraws + ": number " + order[di];
      renderCard(drawn);
      di++;
    }, 60);
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}

function v2FishPro(cfg) {
  var st = {
    active: false,
    settled: true,
    bet: 0,
    shots: 0,
    time: 0,
    caught: 0,
    fishes: [],
    iv: 0,
    tiv: 0,
    siv: 0,
  };
  var pond = nxEl(cfg.key + "Pond");
  function shotCost() {
    return st.bet / 15;
  }
  function hud() {
    nxEl(cfg.key + "Sub").textContent =
      "Time left: " +
      st.time +
      "s - Shots left: " +
      st.shots +
      " - Caught value: " +
      fmt(st.caught);
  }
  function endRound() {
    if (st.settled) return;
    st.settled = true;
    st.active = false;
    v2ClearOne(st.iv);
    v2ClearOne(st.tiv);
    v2ClearOne(st.siv);
    st.fishes.forEach(function (f) {
      if (f.el.parentNode) f.el.remove();
    });
    st.fishes = [];
    nxEl(cfg.key + "Play").disabled = false;
    var payout = Math.floor(st.caught);
    nxFinish({
      scr: cfg.scr,
      key: cfg.key,
      name: cfg.name,
      bet: st.bet,
      payout: payout,
      msg: cfg.key + "Msg",
      winText:
        "Round over - your catch is worth " +
        fmt(payout) +
        " fun credits. You collect " +
        fmt(payout) +
        ".",
      loseText:
        "Round over - your catch is worth " +
        fmt(payout) +
        " fun credits, less than your bet. Balance: " +
        fmt(bal) +
        " fun credits.",
      partText:
        "Round over - your catch is worth " +
        fmt(payout) +
        " of your " +
        fmt(st.bet) +
        " fun credits bet.",
      note: "caught " + fmt(payout),
    });
  }
  function spawn() {
    if (!st.active) return;
    var kinds = [
      ["Small fish", 2, 2.6],
      ["Small fish", 2, 2.6],
      ["Medium fish", 5, 1.9],
      ["Medium fish", 5, 1.9],
      ["Big fish", 12, 1.3],
      ["Golden fish", 25, 1],
    ];
    var k = v2Pick(kinds);
    var b = document.createElement("button");
    b.className = "fish2";
    b.innerHTML = k[0] + " <b>x" + k[1] + "</b>";
    var y = 12 + Math.random() * 68;
    b.style.top = y + "%";
    b.style.left = "-15%";
    pond.appendChild(b);
    var f = { el: b, x: -15, speed: k[2] * (0.7 + Math.random() * 0.6), mult: k[1] };
    st.fishes.push(f);
    b.addEventListener("click", function () {
      if (!st.active || st.shots <= 0) return;
      st.shots--;
      st.caught += shotCost() * f.mult;
      sfx.gem();
      f.el.remove();
      st.fishes = st.fishes.filter(function (x) {
        return x !== f;
      });
      hud();
      if (st.shots <= 0) endRound();
    });
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.shots = 15;
    st.time = 30;
    st.caught = 0;
    st.active = true;
    st.settled = false;
    nxEl(cfg.key + "Play").disabled = true;
    hud();
    v2Msg(
      cfg.key,
      "Thirty seconds, fifteen shots. Tap fish to shoot - golden fish pay x25 of the shot cost.",
      "info",
    );
    spawn();
    spawn();
    st.siv = v2Every(spawn, 950);
    st.iv = v2Every(function () {
      st.fishes.slice().forEach(function (f) {
        f.x += f.speed;
        if (f.x > 105) {
          f.el.remove();
          st.fishes = st.fishes.filter(function (x) {
            return x !== f;
          });
        } else f.el.style.left = f.x + "%";
      });
    }, 50);
    st.tiv = v2Every(function () {
      st.time--;
      hud();
      if (st.time <= 0) endRound();
    }, 1000);
    v2OnLeave(function () {
      if (st.active) endRound();
    });
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2SharkHook(cfg) {
  var VALS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
  var st = { active: false, bet: 0, bank: 0, hooks: 0 };
  function acts() {
    v2Acts(cfg.key, [
      {
        label: "Hook a fish",
        cls: "gold",
        fn: function () {
          if (Math.random() < 0.12) {
            st.active = false;
            nxEl(cfg.key + "Play").disabled = false;
            v2Acts(cfg.key, []);
            nxEl(cfg.key + "Disp").innerHTML =
              '<div class="bigmult" style="color:var(--red)">SHARK</div>';
            sfx.boom();
            nxFinish({
              scr: cfg.scr,
              key: cfg.key,
              name: cfg.name,
              bet: st.bet,
              payout: 0,
              msg: cfg.key + "Msg",
              winText: "",
              loseText:
                "A shark took your catch bag of " +
                fmt(st.bank) +
                " fun credits after " +
                st.hooks +
                " hooks - and your bet of " +
                fmt(st.bet) +
                " fun credits is lost. Balance: " +
                fmt(bal) +
                " fun credits.",
              note: "shark after " + st.hooks,
            });
            return;
          }
          var v = v2Pick(VALS);
          var amt = Math.max(1, Math.round(st.bet * v));
          st.bank += amt;
          st.hooks++;
          sfx.gem();
          nxEl(cfg.key + "Disp").innerHTML = '<div class="bigmult">+' + fmt(amt) + "</div>";
          nxEl(cfg.key + "Sub").textContent =
            "Catch bag: " + fmt(st.bank) + " fun credits after " + st.hooks + " hooks";
          v2Msg(
            cfg.key,
            "Caught a fish worth " + fmt(amt) + " fun credits. Hook again, or cash out the bag.",
            "info",
          );
          acts();
        },
      },
      {
        label: "Cash out the bag",
        cls: "teal",
        fn: function () {
          if (!st.bank) {
            v2Msg(cfg.key, "Hook at least one fish before cashing out.", "lose");
            return;
          }
          st.active = false;
          nxEl(cfg.key + "Play").disabled = false;
          v2Acts(cfg.key, []);
          nxFinish({
            scr: cfg.scr,
            key: cfg.key,
            name: cfg.name,
            bet: st.bet,
            payout: st.bank,
            msg: cfg.key + "Msg",
            winText:
              "You cashed out a catch bag of " +
              fmt(st.bank) +
              " fun credits after " +
              st.hooks +
              " hooks.",
            loseText: "",
            partText:
              "You cashed out a catch bag of " +
              fmt(st.bank) +
              " fun credits after " +
              st.hooks +
              " hooks.",
            note: st.hooks + " hooks cashed",
          });
        },
      },
    ]);
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.bank = 0;
    st.hooks = 0;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">The water is calm - for now</div>';
    nxEl(cfg.key + "Sub").textContent = "Catch bag: 0 fun credits";
    v2Msg(
      cfg.key,
      "Hook fish to fill your catch bag. A shark can strike on any hook - cash out any time.",
      "info",
    );
    acts();
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2Cricket(cfg) {
  var pick = "A";
  nxPickRow(cfg.key + "Pick", function (v) {
    pick = v;
  });
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    var btn = nxEl(cfg.key + "Play");
    if (btn.disabled) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    btn.disabled = true;
    var a = 0,
      b = 0,
      chunk = 0;
    v2Msg(cfg.key, "The match is playing out over by over.", "info");
    var iv = v2Every(function () {
      chunk++;
      if (chunk <= 6) {
        a += v2Rand(4, 18);
        nxEl(cfg.key + "Sub").textContent = "Team A innings: " + a + " runs after over " + chunk;
      } else if (chunk <= 12) {
        b += v2Rand(4, 18);
        nxEl(cfg.key + "Sub").textContent =
          "Team A " + a + " - Team B " + b + " after over " + (chunk - 6);
      }
      nxEl(cfg.key + "Disp").innerHTML = '<div class="bigmult">' + a + " : " + b + "</div>";
      if (chunk >= 12) {
        v2ClearOne(iv);
        btn.disabled = false;
        var res = a > b ? "A" : b > a ? "B" : "T";
        var odds = { A: 2.05, B: 2.05, T: 11.5 };
        var payout = pick === res ? Math.floor(bet * odds[res]) : 0;
        var names = { A: "Team A", B: "Team B", T: "Tie" };
        nxFinish({
          scr: cfg.scr,
          key: cfg.key,
          name: cfg.name,
          bet: bet,
          payout: payout,
          msg: cfg.key + "Msg",
          winText:
            "Final score: Team A " +
            a +
            " - Team B " +
            b +
            ". " +
            names[res] +
            " wins at x" +
            odds[res] +
            " - you collect " +
            fmt(payout) +
            " fun credits.",
          loseText:
            "Final score: Team A " +
            a +
            " - Team B " +
            b +
            " - " +
            names[res] +
            ". Your bet of " +
            fmt(bet) +
            " fun credits is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          note: "score " + a + "-" + b,
        });
      }
    }, 420);
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2BBall(cfg) {
  var SPOTS = [
    ["Layup", 90, 0.21],
    ["Free throw", 75, 0.25],
    ["Mid-range", 60, 0.32],
    ["Three-pointer", 45, 0.42],
    ["Half-court", 25, 0.76],
  ];
  var st = { active: false, bet: 0, shot: 0, total: 0 };
  function acts() {
    v2Acts(
      cfg.key,
      SPOTS.map(function (s) {
        return {
          label: s[0] + " - " + s[1] + "% - pays " + s[2] + "x",
          fn: function () {
            st.shot++;
            var made = Math.random() * 100 < s[1];
            if (made) {
              st.total += s[2];
              sfx.gem();
            } else sfx.lose();
            nxEl(cfg.key + "Sub").textContent =
              "Shot " +
              st.shot +
              " of 5: " +
              s[0] +
              " - " +
              (made ? "made, +" + s[2] + "x" : "missed") +
              " - running payout x" +
              st.total.toFixed(2);
            if (st.shot >= 5) {
              st.active = false;
              nxEl(cfg.key + "Play").disabled = false;
              v2Acts(cfg.key, []);
              var payout = Math.floor(st.bet * st.total);
              nxFinish({
                scr: cfg.scr,
                key: cfg.key,
                name: cfg.name,
                bet: st.bet,
                payout: payout,
                msg: cfg.key + "Msg",
                winText:
                  "Five shots done - your makes pay x" +
                  st.total.toFixed(2) +
                  ". You collect " +
                  fmt(payout) +
                  " fun credits.",
                loseText:
                  "Five shots done and the makes only pay x" +
                  st.total.toFixed(2) +
                  " - worth " +
                  fmt(payout) +
                  " fun credits. Balance: " +
                  fmt(bal) +
                  " fun credits.",
                partText:
                  "Five shots done - your makes pay x" +
                  st.total.toFixed(2) +
                  ", so " +
                  fmt(payout) +
                  " fun credits come back.",
                note: "paid x" + st.total.toFixed(2),
              });
            } else acts();
          },
        };
      }),
    );
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.shot = 0;
    st.total = 0;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Sub").textContent = "Pick your first shot spot";
    v2Msg(
      cfg.key,
      "Five shots. Pick a spot for each shot - harder spots pay more per make, and the defender is already in the make chance.",
      "info",
    );
    acts();
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2Golf(cfg) {
  var st = { active: false, bet: 0, putt: 0, sunk: 0, aim: 0, pow: 2, brk: 1, need: 2 };
  nxPickRow(cfg.key + "Aim", function (v) {
    st.aim = Number(v);
  });
  nxPickRow(cfg.key + "Pow", function (v) {
    st.pow = Number(v);
  });
  function setupPutt() {
    var dist = v2Rand(4, 14);
    st.need = Math.ceil(dist / 5);
    var opts = [-2, -1, 1, 2];
    st.brk = v2Pick(opts);
    nxEl(cfg.key + "Disp").innerHTML =
      '<div class="bigq" style="font-family:Oswald">Putt ' +
      (st.putt + 1) +
      " of 5 - " +
      dist +
      ' feet</div><div class="nxsub">The putt breaks ' +
      (st.brk < 0 ? "to the left" : "to the right") +
      " - power guide: about 1 power per 5 feet</div>";
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.putt = 0;
    st.sunk = 0;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    setupPutt();
    v2Msg(
      cfg.key,
      "Pick your aim and power, then putt. Aim against the break - a little or a lot, you judge.",
      "info",
    );
    puttActs();
  });
  function puttActs() {
    v2Acts(cfg.key, [
      {
        label: "Putt",
        cls: "gold",
        fn: function () {
          var good = st.aim === -st.brk && st.pow === st.need;
          if (good) {
            st.sunk++;
            sfx.gem();
          } else sfx.lose();
          st.putt++;
          if (st.putt >= 5) {
            st.active = false;
            nxEl(cfg.key + "Play").disabled = false;
            v2Acts(cfg.key, []);
            var payout = Math.floor(st.bet * st.sunk * 0.38);
            nxFinish({
              scr: cfg.scr,
              key: cfg.key,
              name: cfg.name,
              bet: st.bet,
              payout: payout,
              msg: cfg.key + "Msg",
              winText:
                "You sank " +
                st.sunk +
                " of 5 putts at 0.38x each - you collect " +
                fmt(payout) +
                " fun credits.",
              loseText:
                "You sank " +
                st.sunk +
                " of 5 putts, paying " +
                fmt(payout) +
                " fun credits back. Balance: " +
                fmt(bal) +
                " fun credits.",
              partText:
                "You sank " +
                st.sunk +
                " of 5 putts at 0.38x each - " +
                fmt(payout) +
                " fun credits come back.",
              note: st.sunk + " sunk",
            });
          } else {
            v2Msg(
              cfg.key,
              good
                ? "Sunk it. Next putt."
                : "Missed - the break was " +
                    Math.abs(st.brk) +
                    " the other way and the power needed was " +
                    st.need +
                    ". Next putt.",
              good ? "win" : "info",
            );
            setupPutt();
            puttActs();
          }
        },
      },
    ]);
  }
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2Tennis(cfg) {
  var st = { active: false, bet: 0, me: 0, opp: 0 };
  function scoreTxt() {
    return (
      "Points - You " + st.me + " : " + st.opp + " Opponent (first to 7, win by 2, 8-8 decides)"
    );
  }
  function pointActs() {
    v2Acts(cfg.key, [
      {
        label: "Play to the left",
        cls: "gold",
        fn: function () {
          point("L");
        },
      },
      {
        label: "Play to the right",
        cls: "gold",
        fn: function () {
          point("R");
        },
      },
    ]);
  }
  function point(side) {
    var weak = Math.random() < 0.5 ? "L" : "R";
    if (side === weak) {
      st.me++;
      sfx.gem();
    } else {
      st.opp++;
      sfx.lose();
    }
    nxEl(cfg.key + "Sub").textContent = scoreTxt();
    nxEl(cfg.key + "Disp").innerHTML = '<div class="bigmult">' + st.me + " : " + st.opp + "</div>";
    var won = (st.me >= 7 && st.me - st.opp >= 2) || st.me === 9;
    var lost = (st.opp >= 7 && st.opp - st.me >= 2) || st.opp === 9;
    if (won || lost) {
      st.active = false;
      nxEl(cfg.key + "Play").disabled = false;
      v2Acts(cfg.key, []);
      var payout = won ? Math.floor(st.bet * 1.92) : 0;
      nxFinish({
        scr: cfg.scr,
        key: cfg.key,
        name: cfg.name,
        bet: st.bet,
        payout: payout,
        msg: cfg.key + "Msg",
        winText:
          "You take the tiebreak " +
          st.me +
          " : " +
          st.opp +
          " - you collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          "The tiebreak goes " +
          st.me +
          " : " +
          st.opp +
          " against you - your bet of " +
          fmt(st.bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        note: "tiebreak " + st.me + "-" + st.opp,
      });
    }
  }
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.me = 0;
    st.opp = 0;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Sub").textContent = scoreTxt();
    v2Msg(
      cfg.key,
      "Each point, pick a side to play to. Guess the opponent weak side to win the point.",
      "info",
    );
    pointActs();
  });
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
function v2CoinTower(cfg) {
  var st = { active: false, bet: 0, pos: 0, dir: 1, drops: 0, accSum: 0, iv: 0 };
  nxEl(cfg.key + "Play").addEventListener("click", function () {
    if (st.active) return;
    var bet = readBet(nxEl(cfg.key + "Bet"));
    if (bet === null) return;
    addBal(-bet);
    st.bet = bet;
    st.drops = 0;
    st.accSum = 0;
    st.pos = 0;
    st.dir = 1;
    st.active = true;
    nxEl(cfg.key + "Play").disabled = true;
    nxEl(cfg.key + "Alt").disabled = false;
    nxEl(cfg.key + "Disp").innerHTML =
      '<div class="sweepwrap"><div class="sweeptarget"></div><div class="sweepmark" id="' +
      cfg.key +
      'Mark"></div></div><div class="nxsub">Drop each coin as close to the centre line as you can</div>';
    v2Msg(cfg.key, "Five drops. Time each drop as the coin sweeps past the centre line.", "info");
    st.iv = v2Every(function () {
      st.pos += st.dir * (1.6 + st.drops * 0.35);
      if (st.pos >= 100) {
        st.pos = 100;
        st.dir = -1;
      }
      if (st.pos <= 0) {
        st.pos = 0;
        st.dir = 1;
      }
      var mk = nxEl(cfg.key + "Mark");
      if (mk) mk.style.left = st.pos + "%";
    }, 20);
  });
  nxEl(cfg.key + "Alt").addEventListener("click", function () {
    if (!st.active) return;
    var acc = 1 - Math.abs(st.pos - 50) / 50;
    st.accSum += acc;
    st.drops++;
    sfx.chip();
    nxEl(cfg.key + "Sub").textContent =
      "Drops: " + st.drops + " of 5 - last accuracy " + Math.round(acc * 100) + "%";
    if (st.drops >= 5) {
      st.active = false;
      v2ClearOne(st.iv);
      nxEl(cfg.key + "Play").disabled = false;
      nxEl(cfg.key + "Alt").disabled = true;
      var avg = st.accSum / 5;
      var payout = Math.floor(st.bet * avg * avg * 1.92);
      nxFinish({
        scr: cfg.scr,
        key: cfg.key,
        name: cfg.name,
        bet: st.bet,
        payout: payout,
        msg: cfg.key + "Msg",
        winText:
          "Tower complete with average accuracy " +
          Math.round(avg * 100) +
          "% - pays x" +
          (avg * avg * 1.92).toFixed(2) +
          ". You collect " +
          fmt(payout) +
          " fun credits.",
        loseText:
          "Tower complete with average accuracy " +
          Math.round(avg * 100) +
          "% - pays only " +
          fmt(payout) +
          " fun credits back. Balance: " +
          fmt(bal) +
          " fun credits.",
        partText:
          "Tower complete with average accuracy " +
          Math.round(avg * 100) +
          "% - " +
          fmt(payout) +
          " fun credits come back.",
        note: "accuracy " + Math.round(avg * 100) + "%",
      });
    }
  });
  nxEl(cfg.key + "Alt").disabled = true;
  nxEl(cfg.key + "Sub").textContent = cfg.intro;
}
