"use strict";
/* ================= 9. Fishing Frenzy ================= */
var FISH_TYPES = [
  { k: "small", mult: 2, size: 46, w: 55, col: "#ff9f43" },
  { k: "medium", mult: 5, size: 62, w: 29, col: "#19e3c2" },
  { k: "big", mult: 12, size: 82, w: 12, col: "#ff6b81" },
  { k: "golden", mult: 25, size: 54, w: 4, col: "#f5c542" },
];
var fish = {
  active: false,
  bet: 0,
  shotCost: 0,
  shots: 0,
  caught: 0,
  timeLeft: 60,
  fishes: [],
  moveIv: 0,
  timeIv: 0,
};
function fishSVG(col) {
  return (
    '<svg viewBox="0 0 48 48"><path d="M4 24c7-9 14-13 22-13 8 0 14 5 18 13-4 8-10 13-18 13-8 0-15-4-22-13z" fill="' +
    col +
    '"/><circle cx="34" cy="21" r="2.6" fill="#14161c"/><path d="M18 14c3 3 3 17 0 20" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/></svg>'
  );
}
function spawnFish() {
  var t = pickWeighted(
    FISH_TYPES.map(function (f) {
      return [f, f.w];
    }),
  );
  var el = document.createElement("div");
  el.className = "fish";
  el.style.width = t.size + "px";
  el.style.height = t.size + "px";
  el.innerHTML = fishSVG(t.col);
  var f = {
    t: t,
    el: el,
    x: 8 + Math.random() * 84,
    y: 14 + Math.random() * 68,
    dir: Math.random() < 0.5 ? 1 : -1,
    sp: 0.18 + Math.random() * 0.3 + (t.k === "small" ? 0.16 : 0),
  };
  el.style.left = f.x + "%";
  el.style.top = f.y + "%";
  el.style.transform = "translate(-50%,-50%) scaleX(" + f.dir + ")";
  $("#fishPond").appendChild(el);
  fish.fishes.push(f);
  return f;
}
function fishHUD() {
  $("#fishTime").textContent = fish.timeLeft;
  $("#fishShots").textContent = fish.shots;
  $("#fishCaught").textContent = fmt(Math.floor(fish.caught));
}
function endFishing() {
  if (!fish.active) return;
  fish.active = false;
  clearInterval(fish.moveIv);
  clearInterval(fish.timeIv);
  fish.fishes.forEach(function (f) {
    f.el.remove();
  });
  fish.fishes = [];
  var credit = Math.floor(fish.caught);
  if (credit > 0) addBal(credit);
  logHist("fishing", histLine(fish.bet, credit));
  recordRound("fishing", fish.bet, credit);
  if (credit > fish.bet) {
    setMsg(
      "fishMsg",
      "Round over. You caught " +
        fmt(credit) +
        " fun credits of fish - profit " +
        fmt(credit - fish.bet) +
        ".",
      "win",
    );
    if (credit >= fish.bet * 3) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      $("#scr-fishing"),
      credit >= fish.bet * 3 ? "Big Catch" : "Nice Catch",
      credit,
      credit >= fish.bet * 3,
      "caught with 20 shots",
    );
    pushWin("You", credit, "Fishing Frenzy");
  } else if (credit > 0) {
    setMsg(
      "fishMsg",
      "Round over. Your catch was worth " +
        fmt(credit) +
        " of your " +
        fmt(fish.bet) +
        " fun credit bet.",
      "info",
    );
    sfx.coin();
  } else {
    setMsg(
      "fishMsg",
      "Round over with no catch. Your bet of " +
        fmt(fish.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    sfx.lose();
  }
  $("#fishStart").disabled = false;
  $("#fishEnd").disabled = true;
  fishHUD();
  renderBal(credit > fish.bet);
}
$("#fishStart").addEventListener("click", function () {
  if (fish.active) return;
  var bet = readBet($("#fishBet"));
  if (bet === null) return;
  addBal(-bet);
  fish.bet = bet;
  fish.shotCost = bet / 20;
  fish.shots = 20;
  fish.caught = 0;
  fish.timeLeft = 60;
  fish.active = true;
  for (var i = 0; i < 7; i++) spawnFish();
  $("#fishStart").disabled = true;
  $("#fishEnd").disabled = false;
  setMsg(
    "fishMsg",
    "Round running. Tap fish to shoot - each shot costs " +
      (fish.shotCost % 1 ? fish.shotCost.toFixed(1) : fmt(fish.shotCost)) +
      " fun credits of your bet.",
    "info",
  );
  fishHUD();
  fish.timeIv = setInterval(function () {
    fish.timeLeft--;
    fishHUD();
    if (fish.timeLeft <= 0) endFishing();
  }, 1000);
  fish.moveIv = setInterval(function () {
    fish.fishes.forEach(function (f) {
      f.x += f.dir * f.sp;
      if (f.x > 97) {
        f.x = 97;
        f.dir = -1;
      }
      if (f.x < 3) {
        f.x = 3;
        f.dir = 1;
      }
      f.el.style.left = f.x + "%";
      f.el.style.transform = "translate(-50%,-50%) scaleX(" + f.dir + ")";
    });
  }, 50);
});
$("#fishEnd").addEventListener("click", function () {
  endFishing();
});
$("#fishPond").addEventListener("click", function (e) {
  if (!fish.active) return;
  var pond = $("#fishPond"),
    r = pond.getBoundingClientRect();
  var px = e.clientX - r.left,
    py = e.clientY - r.top;
  var sp = document.createElement("span");
  sp.className = "splash";
  sp.style.left = px + "px";
  sp.style.top = py + "px";
  pond.appendChild(sp);
  setTimeout(function () {
    sp.remove();
  }, 500);
  fish.shots--;
  sfx.tick();
  var best = null,
    bestD = 1e9;
  fish.fishes.forEach(function (f) {
    var fx = (f.x / 100) * r.width,
      fy = (f.y / 100) * r.height;
    var d = Math.sqrt((fx - px) * (fx - px) + (fy - py) * (fy - py));
    if (d < bestD) {
      bestD = d;
      best = f;
    }
  });
  if (best && bestD <= best.t.size / 2 + 16) {
    var val = best.t.mult * fish.shotCost;
    fish.caught += val;
    var ct = document.createElement("span");
    ct.className = "catchtxt";
    ct.style.left = px + "px";
    ct.style.top = py + "px";
    ct.textContent = "+" + fmt(val);
    pond.appendChild(ct);
    setTimeout(function () {
      ct.remove();
    }, 1050);
    best.el.remove();
    fish.fishes.splice(fish.fishes.indexOf(best), 1);
    spawnFish();
    sfx.gem();
  }
  fishHUD();
  if (fish.shots <= 0) endFishing();
});

/* ================= 10. Bingo Blitz ================= */
var BINGO_LINES = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];
var bingo = { active: false, bet: 0, iv: 0, order: [], idx: 0, cards: [], drawnSet: {} };
function bingoCard() {
  var card = [];
  for (var c = 0; c < 5; c++) {
    var pool = [];
    for (var n = c * 15 + 1; n <= c * 15 + 15; n++) pool.push(n);
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i];
      pool[i] = pool[j];
      pool[j] = t;
    }
    for (var r = 0; r < 5; r++) card[r * 5 + c] = pool[r];
  }
  card[12] = 0;
  return card;
}
function bingoLines(card) {
  var count = 0,
    winCells = [];
  BINGO_LINES.forEach(function (L) {
    if (
      L.every(function (i) {
        return card[i] === 0 || bingo.drawnSet[card[i]];
      })
    ) {
      count++;
      L.forEach(function (i) {
        winCells.push(i);
      });
    }
  });
  return { count: count, cells: winCells };
}
function bingoMarked(card) {
  return card.filter(function (v) {
    return v === 0 || bingo.drawnSet[v];
  }).length;
}
function renderBingo() {
  var g = $("#bingoGrid");
  g.innerHTML = "";
  ["B", "I", "N", "G", "O"].forEach(function (L) {
    var d = document.createElement("div");
    d.className = "bcell hd";
    d.textContent = L;
    g.appendChild(d);
  });
  var res = bingoLines(bingo.cards[0]);
  bingo.cards[0].forEach(function (v, i) {
    var d = document.createElement("div");
    d.className =
      "bcell" +
      (v === 0 ? " free" : bingo.drawnSet[v] ? " marked" : "") +
      (res.cells.indexOf(i) >= 0 && res.count > 0 ? " linewin" : "");
    d.textContent = v === 0 ? "FREE" : v;
    g.appendChild(d);
  });
  $("#bingoAi").textContent =
    bingoMarked(bingo.cards[1]) + " and " + bingoMarked(bingo.cards[2]) + " marked";
}
function endBingo(playerLines) {
  clearInterval(bingo.iv);
  bingo.active = false;
  var payout = 0;
  if (playerLines > 0) payout = Math.floor(bingo.bet * (2.8 + (playerLines - 1) * 1));
  if (payout > 0) addBal(payout);
  logHist(
    "bingo",
    histLine(bingo.bet, payout) +
      (playerLines > 0 ? " - " + playerLines + " line" + (playerLines > 1 ? "s" : "") : ""),
  );
  recordRound("bingo", bingo.bet, payout);
  if (payout > 0) {
    setMsg(
      "bingoMsg",
      "Bingo! Your card completed " +
        playerLines +
        " line" +
        (playerLines > 1 ? "s" : "") +
        " first - you win " +
        fmt(payout) +
        " fun credits.",
      "win",
    );
    sfx.bigwin();
    showWinBanner(
      $("#scr-bingo"),
      "Bingo",
      payout,
      payout >= bingo.bet * 5,
      playerLines + " line" + (playerLines > 1 ? "s" : ""),
    );
    pushWin("You", payout, "Bingo Blitz");
  } else {
    setMsg(
      "bingoMsg",
      "An AI card completed a line first, or no line landed in 50 draws. Your bet of " +
        fmt(bingo.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    sfx.lose();
  }
  renderBingo();
  $("#bingoStart").disabled = false;
  renderBal(payout > 0);
}
bingo.cards = [bingoCard(), bingoCard(), bingoCard()];
renderBingo();
$("#bingoStart").addEventListener("click", function () {
  if (bingo.active) return;
  var bet = readBet($("#bingoBet"));
  if (bet === null) return;
  addBal(-bet);
  bingo.bet = bet;
  bingo.active = true;
  bingo.idx = 0;
  bingo.drawnSet = {};
  bingo.cards = [bingoCard(), bingoCard(), bingoCard()];
  bingo.order = [];
  for (var n = 1; n <= 75; n++) bingo.order.push(n);
  for (var i = bingo.order.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = bingo.order[i];
    bingo.order[i] = bingo.order[j];
    bingo.order[j] = t;
  }
  $("#bingoStart").disabled = true;
  $("#bingoLast").textContent = "-";
  $("#bingoDrawn").textContent = "0";
  $("#bingoBall").textContent = "?";
  renderBingo();
  setMsg("bingoMsg", "Bingo is running - numbers draw every 0.6 seconds.", "info");
  bingo.iv = setInterval(function () {
    if (bingo.idx >= 50) {
      endBingo(0);
      return;
    }
    var num = bingo.order[bingo.idx];
    bingo.idx++;
    bingo.drawnSet[num] = true;
    $("#bingoLast").textContent = num;
    $("#bingoBall").textContent = num;
    $("#bingoDrawn").textContent = bingo.idx;
    sfx.tick();
    renderBingo();
    var pl = bingoLines(bingo.cards[0]).count;
    if (pl > 0) {
      endBingo(pl);
      return;
    }
    if (bingoLines(bingo.cards[1]).count > 0 || bingoLines(bingo.cards[2]).count > 0) {
      endBingo(0);
      return;
    }
  }, 600);
});

/* ================= 11. Dice High-Low ================= */
var DICE_DIST = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
var DICE_FACES = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];
var dice = { dir: "over", rolling: false };
function diceInfo() {
  var target = Number($("#diceTarget").value);
  var wins = 0;
  for (var sum = 2; sum <= 12; sum++) {
    if ((dice.dir === "over" && sum > target) || (dice.dir === "under" && sum < target))
      wins += DICE_DIST[sum - 2];
  }
  var p = wins / 36;
  return { p: p, mult: p > 0 ? 0.97 / p : 0 };
}
function renderDiceInfo() {
  var info = diceInfo();
  $("#diceChance").textContent = (info.p * 100).toFixed(1) + "%";
  $("#diceMult").textContent = "x" + info.mult.toFixed(2);
}
$("#diceOver").addEventListener("click", function () {
  dice.dir = "over";
  $("#diceOver").classList.add("on");
  $("#diceUnder").classList.remove("on");
  sfx.click();
  renderDiceInfo();
});
$("#diceUnder").addEventListener("click", function () {
  dice.dir = "under";
  $("#diceUnder").classList.add("on");
  $("#diceOver").classList.remove("on");
  sfx.click();
  renderDiceInfo();
});
$("#diceTarget").addEventListener("change", function () {
  sfx.click();
  renderDiceInfo();
});
renderDiceInfo();
$("#diceRoll").addEventListener("click", function () {
  if (dice.rolling) return;
  var bet = readBet($("#diceBet"));
  if (bet === null) return;
  addBal(-bet);
  dice.rolling = true;
  $("#diceRoll").disabled = true;
  var info = diceInfo(),
    target = Number($("#diceTarget").value);
  $("#die1").classList.add("rolling");
  $("#die2").classList.add("rolling");
  var iv = setInterval(function () {
    $("#die1").textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    $("#die2").textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    sfx.tick();
  }, 75);
  setTimeout(function () {
    clearInterval(iv);
    var d1 = 1 + Math.floor(Math.random() * 6),
      d2 = 1 + Math.floor(Math.random() * 6);
    var total = d1 + d2;
    $("#die1").textContent = DICE_FACES[d1 - 1];
    $("#die2").textContent = DICE_FACES[d2 - 1];
    $("#die1").classList.remove("rolling");
    $("#die2").classList.remove("rolling");
    $("#diceTotal").textContent = total;
    var win = (dice.dir === "over" && total > target) || (dice.dir === "under" && total < target);
    var payout = win ? Math.floor(bet * info.mult) : 0;
    if (payout > 0) addBal(payout);
    logHist(
      "dice",
      histLine(bet, payout) + " - rolled " + total + " (" + dice.dir + " " + target + ")",
    );
    recordRound("dice", bet, payout);
    if (payout > bet) {
      setMsg(
        "diceMsg",
        "Rolled " +
          total +
          " - " +
          dice.dir +
          " " +
          target +
          " wins. You won " +
          fmt(payout) +
          " fun credits.",
        "win",
      );
      if (payout >= bet * 5) sfx.bigwin();
      else sfx.win();
      showWinBanner($("#scr-dice"), "Win", payout, payout >= bet * 5, "x" + info.mult.toFixed(2));
      pushWin("You", payout, "Dice High-Low");
    } else if (payout > 0) {
      setMsg(
        "diceMsg",
        "Rolled " + total + " - you got back " + fmt(payout) + " fun credits.",
        "info",
      );
      sfx.coin();
    } else {
      setMsg(
        "diceMsg",
        total === target
          ? "Rolled exactly " +
              target +
              " - the target loses. Balance: " +
              fmt(bal) +
              " fun credits."
          : "Rolled " +
              total +
              " - " +
              dice.dir +
              " " +
              target +
              " missed. Balance: " +
              fmt(bal) +
              " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    dice.rolling = false;
    $("#diceRoll").disabled = false;
    renderBal(payout > bet);
  }, 700);
});

/* ================= 12. Baccarat ================= */
var bacc = { pick: "player", dealing: false };
$$("#scr-baccarat [data-bacc]").forEach(function (b) {
  b.addEventListener("click", function () {
    $$("#scr-baccarat [data-bacc]").forEach(function (x) {
      x.classList.remove("on");
    });
    b.classList.add("on");
    bacc.pick = b.getAttribute("data-bacc");
    sfx.click();
  });
});
function baccPts(card) {
  if (card.r === "A") return 1;
  if (card.r === "K" || card.r === "Q" || card.r === "J" || card.r === "10") return 0;
  return Number(card.r);
}
function baccTotal(hand) {
  return (
    hand.reduce(function (s2, c) {
      return s2 + baccPts(c);
    }, 0) % 10
  );
}
function baccRender() {
  $("#baccPHand").innerHTML = bacc.p
    .map(function (c) {
      return bjCardHTML(c, false);
    })
    .join("");
  $("#baccBHand").innerHTML = bacc.b
    .map(function (c) {
      return bjCardHTML(c, false);
    })
    .join("");
  var ps = $("#baccPScore"),
    bs = $("#baccBScore");
  if (bacc.p.length) {
    ps.hidden = false;
    ps.textContent = baccTotal(bacc.p);
  } else ps.hidden = true;
  if (bacc.b.length) {
    bs.hidden = false;
    bs.textContent = baccTotal(bacc.b);
  } else bs.hidden = true;
}
bacc.p = [];
bacc.b = [];
$("#baccDeal").addEventListener("click", function () {
  if (bacc.dealing) return;
  var bet = readBet($("#baccBet"));
  if (bet === null) return;
  addBal(-bet);
  bacc.dealing = true;
  $("#baccDeal").disabled = true;
  var deck = bjDeck();
  bacc.p = [deck.pop(), deck.pop()];
  bacc.b = [deck.pop(), deck.pop()];
  sfx.deal();
  var pt = baccTotal(bacc.p),
    bt = baccTotal(bacc.b);
  var pThird = null;
  if (pt < 8 && bt < 8) {
    if (pt <= 5) {
      pThird = deck.pop();
      bacc.p.push(pThird);
      pt = baccTotal(bacc.p);
    }
    var ptv = pThird ? baccPts(pThird) : null;
    if (pThird === null) {
      if (bt <= 5) bacc.b.push(deck.pop());
    } else if (bt <= 2) bacc.b.push(deck.pop());
    else if (bt === 3 && ptv !== 8) bacc.b.push(deck.pop());
    else if (bt === 4 && ptv >= 2 && ptv <= 7) bacc.b.push(deck.pop());
    else if (bt === 5 && ptv >= 4 && ptv <= 7) bacc.b.push(deck.pop());
    else if (bt === 6 && (ptv === 6 || ptv === 7)) bacc.b.push(deck.pop());
    bt = baccTotal(bacc.b);
  }
  setTimeout(function () {
    baccRender();
    var result = pt > bt ? "player" : bt > pt ? "banker" : "tie";
    var payout = 0,
      note = "";
    if (bacc.pick === result) {
      if (result === "player") {
        payout = bet * 2;
        note = "Player bet pays 1 to 1.";
      } else if (result === "banker") {
        payout = Math.floor(bet * 1.95);
        note = "Banker bet pays 0.95 to 1 (5 percent commission).";
      } else {
        payout = bet * 9;
        note = "Tie bet pays 8 to 1.";
      }
    } else if (result === "tie" && bacc.pick !== "tie") {
      payout = bet;
      note = "Tie - Player and Banker bets are returned.";
    }
    if (payout > 0) addBal(payout);
    var resTxt =
      result === "tie"
        ? "Tie at " + pt
        : result === "player"
          ? "Player wins " + pt + " to " + bt
          : "Banker wins " + bt + " to " + pt;
    logHist("baccarat", histLine(bet, payout) + " - " + resTxt + ", you bet " + bacc.pick);
    recordRound("baccarat", bet, payout);
    if (payout > bet) {
      setMsg("baccMsg", resTxt + ". " + note + " You won " + fmt(payout) + " fun credits.", "win");
      if (payout >= bet * 5) sfx.bigwin();
      else sfx.win();
      showWinBanner(
        $("#scr-baccarat"),
        result === "tie" ? "Tie Win" : "Win",
        payout,
        payout >= bet * 5,
        note,
      );
      pushWin("You", payout, "Baccarat");
    } else if (payout === bet && bet > 0) {
      setMsg("baccMsg", resTxt + ". " + note, "info");
      sfx.coin();
    } else {
      setMsg(
        "baccMsg",
        resTxt +
          ". Your " +
          bacc.pick +
          " bet of " +
          fmt(bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    bacc.dealing = false;
    $("#baccDeal").disabled = false;
    renderBal(payout > bet);
  }, 450);
});
baccRender();

/* ================= 13. Video Poker - Jacks or Better ================= */
var pk = { phase: "idle", deck: [], hand: [], held: [false, false, false, false, false], bet: 0 };
function pkRankVal(c) {
  if (c.r === "A") return 14;
  if (c.r === "K") return 13;
  if (c.r === "Q") return 12;
  if (c.r === "J") return 11;
  return Number(c.r);
}
function pkRender() {
  $("#pokerHand").innerHTML = pk.hand
    .map(function (c, i) {
      return (
        '<div class="holdwrap"><div class="pcard pkcard' +
        (pk.held[i] ? " held" : "") +
        (c.red ? " red" : "") +
        '" data-pk="' +
        i +
        '"><div>' +
        c.r +
        '</div><div class="suit">' +
        c.suit +
        "</div></div>" +
        (pk.held[i] ? '<span class="holdtag">HOLD</span>' : "") +
        "</div>"
      );
    })
    .join("");
  $$("#pokerHand .pkcard").forEach(function (el) {
    el.addEventListener("click", function () {
      if (pk.phase !== "dealt") return;
      var i = Number(el.getAttribute("data-pk"));
      pk.held[i] = !pk.held[i];
      sfx.click();
      pkRender();
    });
  });
}
function pkEvaluate(hand) {
  var vals = hand.map(pkRankVal).sort(function (a, b) {
    return a - b;
  });
  var flush = hand.every(function (c) {
    return c.suit === hand[0].suit;
  });
  var uniq = vals.filter(function (v, i) {
    return i === 0 || v !== vals[i - 1];
  });
  var straight = uniq.length === 5 && (vals[4] - vals[0] === 4 || vals.join(",") === "2,3,4,5,14");
  var counts = {};
  vals.forEach(function (v) {
    counts[v] = (counts[v] || 0) + 1;
  });
  var groups = Object.keys(counts)
    .map(function (k) {
      return { v: Number(k), n: counts[k] };
    })
    .sort(function (a, b) {
      return b.n - a.n || b.v - a.v;
    });
  if (straight && flush && vals[0] === 10) return { mult: 250, name: "Royal flush" };
  if (straight && flush) return { mult: 50, name: "Straight flush" };
  if (groups[0].n === 4) return { mult: 25, name: "Four of a kind" };
  if (groups[0].n === 3 && groups[1] && groups[1].n === 2) return { mult: 9, name: "Full house" };
  if (flush) return { mult: 6, name: "Flush" };
  if (straight) return { mult: 4, name: "Straight" };
  if (groups[0].n === 3) return { mult: 3, name: "Three of a kind" };
  if (groups[0].n === 2 && groups[1] && groups[1].n === 2) return { mult: 2, name: "Two pair" };
  if (groups[0].n === 2 && groups[0].v >= 11) return { mult: 1, name: "Jacks or better" };
  return { mult: 0, name: "No paying hand" };
}
$("#pokerDeal").addEventListener("click", function () {
  if (pk.phase === "idle") {
    var bet = readBet($("#pokerBet"));
    if (bet === null) return;
    addBal(-bet);
    pk.bet = bet;
    pk.deck = bjDeck();
    pk.hand = [pk.deck.pop(), pk.deck.pop(), pk.deck.pop(), pk.deck.pop(), pk.deck.pop()];
    pk.held = [false, false, false, false, false];
    pk.phase = "dealt";
    sfx.deal();
    pkRender();
    $("#pokerDeal").textContent = "Draw";
    setMsg("pokerMsg", "Tap the cards you want to hold, then press Draw.", "info");
  } else if (pk.phase === "dealt") {
    for (var i = 0; i < 5; i++) if (!pk.held[i]) pk.hand[i] = pk.deck.pop();
    pk.phase = "idle";
    sfx.deal();
    pkRender();
    var res = pkEvaluate(pk.hand);
    var payout = Math.floor(pk.bet * res.mult);
    if (payout > 0) addBal(payout);
    logHist("poker", histLine(pk.bet, payout) + " - " + res.name);
    recordRound("poker", pk.bet, payout);
    if (payout > pk.bet) {
      setMsg("pokerMsg", res.name + " - you won " + fmt(payout) + " fun credits.", "win");
      if (res.mult >= 25) sfx.bigwin();
      else sfx.win();
      showWinBanner($("#scr-poker"), res.name, payout, res.mult >= 25, "x" + res.mult);
      pushWin("You", payout, "Video Poker");
    } else if (payout === pk.bet && pk.bet > 0) {
      setMsg(
        "pokerMsg",
        res.name + " - your bet of " + fmt(pk.bet) + " fun credits is returned.",
        "info",
      );
      sfx.coin();
    } else if (payout > 0) {
      setMsg("pokerMsg", res.name + " - you got back " + fmt(payout) + " fun credits.", "info");
      sfx.coin();
    } else {
      setMsg(
        "pokerMsg",
        "No paying hand. A pair of Jacks or better is needed. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    $("#pokerDeal").textContent = "Deal";
    renderBal(payout > pk.bet);
  }
});
pkRender();

/* ================= 14. Plinko ================= */
var PLINKO_MULTS = [10, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 10];
var plinko = { dropping: false };
(function buildPlinko() {
  var board = $("#plinkoBoard");
  for (var r = 0; r < 8; r++) {
    var n = r + 2;
    for (var i = 0; i < n; i++) {
      var peg = document.createElement("span");
      peg.className = "peg";
      peg.style.left = 50 + (i - (n - 1) / 2) * 11.1 + "%";
      peg.style.top = 12 + r * 10.5 + "%";
      board.appendChild(peg);
    }
  }
  $("#plinkoSlots").innerHTML = PLINKO_MULTS.map(function (m, i) {
    return (
      '<div class="pslot' +
      (i === 0 || i === 8 ? " edge" : "") +
      '" id="pslot' +
      i +
      '">x' +
      m +
      "</div>"
    );
  }).join("");
})();
$("#plinkoDrop").addEventListener("click", function () {
  if (plinko.dropping) return;
  var bet = readBet($("#plinkoBet"));
  if (bet === null) return;
  addBal(-bet);
  plinko.dropping = true;
  $("#plinkoDrop").disabled = true;
  $$("#plinkoSlots .pslot").forEach(function (el) {
    el.classList.remove("hot");
  });
  var path = [],
    rights = 0;
  for (var i = 0; i < 8; i++) {
    var right = Math.random() < 0.5;
    path.push(right);
    if (right) rights++;
  }
  var board = $("#plinkoBoard");
  var old = $(".pball", board);
  if (old) old.remove();
  var ball = document.createElement("span");
  ball.className = "pball";
  ball.style.left = "50%";
  ball.style.top = "3%";
  board.appendChild(ball);
  var step = 0,
    rSoFar = 0;
  setMsg("plinkoMsg", "Ball dropped...", "info");
  var iv = setInterval(function () {
    step++;
    if (path[step - 1]) rSoFar++;
    ball.style.left = 50 + (2 * rSoFar - step) * 5.55 + "%";
    ball.style.top = 3 + step * 10.8 + "%";
    sfx.tick();
    if (step >= 8) {
      clearInterval(iv);
      var mult = PLINKO_MULTS[rights];
      var payout = Math.floor(bet * mult);
      $("#pslot" + rights).classList.add("hot");
      if (payout > 0) addBal(payout);
      logHist("plinko", histLine(bet, payout) + " - slot x" + mult);
      recordRound("plinko", bet, payout);
      if (payout > bet) {
        setMsg(
          "plinkoMsg",
          "The ball landed on x" + mult + " - you won " + fmt(payout) + " fun credits.",
          "win",
        );
        if (mult >= 3) sfx.bigwin();
        else sfx.win();
        showWinBanner($("#scr-plinko"), "Win", payout, mult >= 3, "x" + mult);
        pushWin("You", payout, "Plinko");
      } else if (payout > 0) {
        setMsg(
          "plinkoMsg",
          "The ball landed on x" +
            mult +
            " - " +
            fmt(payout) +
            " of your " +
            fmt(bet) +
            " fun credits come back.",
          "info",
        );
        sfx.coin();
      } else {
        setMsg(
          "plinkoMsg",
          "The ball landed on x" + mult + ". Balance: " + fmt(bal) + " fun credits.",
          "lose",
        );
        sfx.lose();
      }
      plinko.dropping = false;
      $("#plinkoDrop").disabled = false;
      renderBal(payout > bet);
    }
  }, 180);
});

/* ================= 15. Keno ================= */
var KENO_PAY = {
  1: { 1: 3.8 },
  2: { 2: 14, 1: 0.3 },
  3: { 3: 43, 2: 2.5 },
  4: { 4: 130, 3: 8, 2: 1 },
  5: { 5: 450, 4: 32, 3: 3 },
  6: { 6: 1500, 5: 100, 4: 10, 3: 1 },
  7: { 7: 4000, 6: 300, 5: 30, 4: 4 },
  8: { 8: 12000, 7: 1200, 6: 120, 5: 15, 4: 2 },
  9: { 9: 22000, 8: 2800, 7: 370, 6: 45, 5: 7, 4: 1 },
  10: { 10: 50000, 9: 7000, 8: 1200, 7: 140, 6: 24, 5: 4 },
};
var keno = { picks: {}, drawing: false };
(function buildKeno() {
  var g = $("#kenoGrid");
  for (var n = 1; n <= 80; n++) {
    var b = document.createElement("button");
    b.className = "knum";
    b.textContent = n;
    b.setAttribute("data-n", n);
    (function (num, btn) {
      btn.addEventListener("click", function () {
        if (keno.drawing) return;
        if (keno.picks[num]) {
          delete keno.picks[num];
          btn.classList.remove("sel");
        } else {
          if (Object.keys(keno.picks).length >= 10) {
            setMsg(
              "kenoMsg",
              "You can pick at most 10 numbers. Tap a picked number to remove it.",
              "lose",
            );
            return;
          }
          keno.picks[num] = true;
          btn.classList.add("sel");
        }
        $("#kenoCount").textContent = Object.keys(keno.picks).length;
        sfx.click();
      });
    })(n, b);
    g.appendChild(b);
  }
})();
function kenoResetBoard() {
  $$("#kenoGrid .knum").forEach(function (b) {
    b.classList.remove("drawn", "hit");
  });
  $("#kenoMatch").textContent = "-";
}
$("#kenoClear").addEventListener("click", function () {
  if (keno.drawing) return;
  keno.picks = {};
  $$("#kenoGrid .knum").forEach(function (b) {
    b.classList.remove("sel");
  });
  $("#kenoCount").textContent = "0";
  kenoResetBoard();
  sfx.click();
});
$("#kenoQuick").addEventListener("click", function () {
  if (keno.drawing) return;
  keno.picks = {};
  var pool = [];
  for (var n = 1; n <= 80; n++) pool.push(n);
  for (var i = 0; i < 6; i++) {
    var j = i + Math.floor(Math.random() * (80 - i));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
    keno.picks[pool[i]] = true;
  }
  $$("#kenoGrid .knum").forEach(function (b) {
    b.classList.toggle("sel", !!keno.picks[b.getAttribute("data-n")]);
  });
  $("#kenoCount").textContent = "6";
  kenoResetBoard();
  sfx.chip();
});
$("#kenoDraw").addEventListener("click", function () {
  if (keno.drawing) return;
  var pickCount = Object.keys(keno.picks).length;
  if (pickCount === 0) {
    setMsg("kenoMsg", "Pick at least 1 number first, or use Quick pick 6.", "lose");
    return;
  }
  var bet = readBet($("#kenoBet"));
  if (bet === null) return;
  addBal(-bet);
  keno.drawing = true;
  $("#kenoDraw").disabled = true;
  kenoResetBoard();
  var pool = [];
  for (var n = 1; n <= 80; n++) pool.push(n);
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  var drawn = pool.slice(0, 20),
    idx = 0,
    matches = 0;
  setMsg("kenoMsg", "Drawing 20 numbers...", "info");
  var iv = setInterval(function () {
    if (idx >= 20) {
      clearInterval(iv);
      var table = KENO_PAY[pickCount] || {};
      var mult = table[matches] || 0;
      var payout = Math.floor(bet * mult);
      if (payout > 0) addBal(payout);
      $("#kenoMatch").textContent = matches;
      logHist("keno", histLine(bet, payout) + " - " + matches + " of " + pickCount + " matched");
      recordRound("keno", bet, payout);
      if (payout > bet) {
        setMsg(
          "kenoMsg",
          matches +
            " matches from " +
            pickCount +
            " picks - you won " +
            fmt(payout) +
            " fun credits (x" +
            mult +
            ").",
          "win",
        );
        if (mult >= 10) sfx.bigwin();
        else sfx.win();
        showWinBanner(
          $("#scr-keno"),
          "Keno Win",
          payout,
          mult >= 10,
          matches + " matches - x" + mult,
        );
        pushWin("You", payout, "Keno");
      } else if (payout > 0) {
        setMsg(
          "kenoMsg",
          matches + " matches - " + fmt(payout) + " fun credits come back.",
          "info",
        );
        sfx.coin();
      } else {
        setMsg(
          "kenoMsg",
          matches +
            " matches from " +
            pickCount +
            " picks - no payout at that level. Balance: " +
            fmt(bal) +
            " fun credits.",
          "lose",
        );
        sfx.lose();
      }
      keno.drawing = false;
      $("#kenoDraw").disabled = false;
      renderBal(payout > bet);
      return;
    }
    var num = drawn[idx];
    idx++;
    var btn = $('#kenoGrid .knum[data-n="' + num + '"]');
    if (btn) {
      btn.classList.add("drawn");
      if (keno.picks[num]) {
        btn.classList.add("hit");
        matches++;
        $("#kenoMatch").textContent = matches;
        sfx.gem();
      } else sfx.tick();
    }
  }, 85);
});

/* ================= 16. Lucky Scratch ================= */
var SC_WEIGHTS = [
  ["cherry", 30],
  ["lemon", 28],
  ["bell", 20],
  ["star", 13],
  ["gem", 9],
];
var SC_PAY = { cherry: 1.4, lemon: 1.4, bell: 3, star: 7, gem: 15 };
var SC_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
var sc = { active: false, bet: 0, grid: [], revealed: 0, done: false };
function scratchBuildTiles() {
  var g = $("#scratchGrid");
  g.innerHTML = "";
  for (var i = 0; i < 9; i++) {
    var b = document.createElement("button");
    b.className = "stile";
    b.textContent = "?";
    b.disabled = true;
    b.setAttribute("aria-label", "Scratch panel " + (i + 1));
    (function (idx, btn) {
      btn.addEventListener("click", function () {
        scratchReveal(idx, btn);
      });
    })(i, b);
    g.appendChild(b);
  }
}
function scratchReveal(i, btn) {
  if (!sc.active || sc.done || btn.classList.contains("open")) return;
  btn.classList.add("open");
  btn.innerHTML = symHTML(sc.grid[i]);
  btn.disabled = true;
  sc.revealed++;
  sfx.tick();
  if (sc.revealed >= 9) scratchFinish();
}
function scratchFinish() {
  sc.done = true;
  var totalMult = 0,
    winTiles = {};
  SC_LINES.forEach(function (L) {
    if (sc.grid[L[0]] === sc.grid[L[1]] && sc.grid[L[1]] === sc.grid[L[2]]) {
      totalMult += SC_PAY[sc.grid[L[0]]];
      L.forEach(function (i) {
        winTiles[i] = true;
      });
    }
  });
  var tiles = $$("#scratchGrid .stile");
  Object.keys(winTiles).forEach(function (i) {
    tiles[Number(i)].classList.add("linewin");
  });
  var payout = Math.floor(sc.bet * totalMult);
  if (payout > 0) addBal(payout);
  logHist(
    "scratch",
    histLine(sc.bet, payout) + (totalMult > 0 ? " - lines paid x" + totalMult.toFixed(1) : ""),
  );
  recordRound("scratch", sc.bet, payout);
  if (payout > sc.bet) {
    setMsg(
      "scratchMsg",
      "Winning lines paid x" + totalMult.toFixed(1) + " - you won " + fmt(payout) + " fun credits.",
      "win",
    );
    if (totalMult >= 7) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      $("#scr-scratch"),
      "Scratch Win",
      payout,
      totalMult >= 7,
      "lines x" + totalMult.toFixed(1),
    );
    pushWin("You", payout, "Lucky Scratch");
  } else if (payout > 0) {
    setMsg(
      "scratchMsg",
      "Lines paid x" +
        totalMult.toFixed(1) +
        " - " +
        fmt(payout) +
        " of your " +
        fmt(sc.bet) +
        " fun credits come back.",
      "info",
    );
    sfx.coin();
  } else {
    setMsg(
      "scratchMsg",
      "No complete line on this card. Your bet of " +
        fmt(sc.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    sfx.lose();
  }
  $("#scratchAll").disabled = true;
  $("#scratchNew").disabled = false;
  renderBal(payout > sc.bet);
}
$("#scratchNew").addEventListener("click", function () {
  if (sc.active && !sc.done) return;
  var bet = readBet($("#scratchBet"));
  if (bet === null) return;
  addBal(-bet);
  sc.bet = bet;
  sc.active = true;
  sc.done = false;
  sc.revealed = 0;
  sc.grid = [];
  for (var i = 0; i < 9; i++) sc.grid.push(pickWeighted(SC_WEIGHTS));
  scratchBuildTiles();
  $$("#scratchGrid .stile").forEach(function (b) {
    b.disabled = false;
  });
  $("#scratchAll").disabled = false;
  $("#scratchNew").disabled = true;
  setMsg(
    "scratchMsg",
    "Card bought for " + fmt(bet) + " fun credits. Tap the panels to scratch.",
    "info",
  );
  sfx.chip();
});
$("#scratchAll").addEventListener("click", function () {
  if (!sc.active || sc.done) return;
  $$("#scratchGrid .stile").forEach(function (b, i) {
    if (!b.classList.contains("open")) scratchReveal(i, b);
  });
});
scratchBuildTiles();

/* ================= 17. Gem Rush Slots ================= */
var GEMR = {
  weights: [
    ["amber", 24],
    ["ruby", 22],
    ["sapphire", 17],
    ["emerald", 12],
    ["diamond", 5],
    ["crown", 3],
    ["scatter", 3],
  ],
  pay: {
    amber: [4, 13, 42],
    ruby: [4, 16, 52],
    sapphire: [6, 22, 75],
    emerald: [10, 38, 110],
    diamond: [25, 100, 500],
    crown: [50, 200, 1000],
  },
  scatterPay: { 3: 2, 4: 5, 5: 20 },
};
var gemCells = buildCells($("#gemGrid"), 3, 5);
var gem = { spinning: false, fs: 0, fsWin: 0, fsBet: 100 };
function gemSetGrid(g) {
  for (var r = 0; r < 3; r++)
    for (var c = 0; c < 5; c++) gemCells[r][c].innerHTML = symHTML(g[r][c]);
}
gemSetGrid(randomGrid(GEMR.weights, 3, 5, "scatter", 2));
$("#gemBet").addEventListener("input", function () {
  $("#gemBetShow").textContent = fmt(clampBet(this.value, 100000));
});
function gemSpin() {
  if (gem.spinning) return;
  var isFree = gem.fs > 0;
  var bet;
  if (isFree) {
    bet = gem.fsBet;
    gem.fs--;
  } else {
    bet = readBet($("#gemBet"));
    if (bet === null) return;
    if (bet % 10 !== 0) {
      bet = Math.floor(bet / 10) * 10;
      if (bet < 10) bet = 10;
      $("#gemBet").value = bet;
    }
    addBal(-bet);
  }
  gem.spinning = true;
  $("#gemSpin").disabled = true;
  $("#gemBetShow").textContent = fmt(bet);
  clearWins(gemCells);
  var finalGrid = randomGrid(GEMR.weights, 3, 5, "scatter", 5);
  spinAnim(gemCells, finalGrid, GEMR.weights, function () {
    var lineBet = bet / 10;
    var res = evalLines(finalGrid, GEMR.pay, lineBet, "crown");
    var sc = 0;
    finalGrid.forEach(function (row) {
      row.forEach(function (s) {
        if (s === "scatter") sc++;
      });
    });
    var scatWin = 0;
    if (sc >= 3) scatWin = bet * (GEMR.scatterPay[Math.min(sc, 5)] || 20);
    var total = res.total + scatWin;
    markWins(gemCells, res.winCells);
    $("#gemWin").textContent = fmt(total);
    if (isFree) gem.fsWin += total;
    if (total > 0) {
      addBal(total);
      setMsg(
        "gemMsg",
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
        $("#scr-gemrush"),
        total >= bet * 20 ? "Big Win" : "Win",
        total,
        total >= bet * 20,
        "x" + (total / Math.max(1, bet)).toFixed(1),
      );
      pushWin("You", total, "Gem Rush Slots");
    } else {
      setMsg(
        "gemMsg",
        (isFree ? "Free spin: no win this time." : "No win this time. Spin again.") +
          " Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    logHist(
      "gemrush",
      isFree ? 'Free spin - <span class="hw">won ' + fmt(total) + "</span>" : histLine(bet, total),
    );
    recordRound("gemrush", isFree ? 0 : bet, total);
    gem.spinning = false;
    if (sc >= 3 && !isFree) {
      gem.fs = 8;
      gem.fsBet = bet;
      gem.fsWin = 0;
      setMsg(
        "gemMsg",
        sc +
          " gem scatters! You won 8 free spins plus " +
          fmt(scatWin) +
          " fun credits. Free spins start now.",
        "win",
      );
      sfx.bigwin();
    }
    if (gem.fs > 0) {
      $("#gemFs").classList.add("on");
      $("#gemFs").textContent = "Free spins left: " + gem.fs + " - won so far: " + fmt(gem.fsWin);
      setTimeout(function () {
        gemSpin();
      }, 1100);
    } else {
      $("#gemFs").classList.remove("on");
      $("#gemSpin").disabled = false;
    }
    renderBal(total > 0);
  });
}
$("#gemSpin").addEventListener("click", gemSpin);

/* ================= 18. Hi-Lo Cards ================= */
var hilo = { active: false, busy: false, bet: 0, deck: [], base: null, fair: 1, streak: 0 };
function hlCounts() {
  var v = pkRankVal(hilo.base),
    hi = 0,
    lo = 0;
  hilo.deck.forEach(function (c) {
    var cv = pkRankVal(c);
    if (cv > v) hi++;
    else if (cv < v) lo++;
  });
  return { hi: hi, lo: lo };
}
function hlUpdate() {
  var cnt = hilo.deck.length ? hlCounts() : { hi: 0, lo: 0 };
  $("#hlCard").innerHTML = hilo.base ? bjCardHTML(hilo.base, false) : "";
  $("#hlMult").textContent =
    hilo.active && hilo.streak > 0 ? "x" + (0.97 * hilo.fair).toFixed(2) : "-";
  $("#hlValue").textContent =
    hilo.active && hilo.streak > 0 ? fmt(Math.floor(hilo.bet * 0.97 * hilo.fair)) : "0";
  $("#hlStreak").textContent = hilo.streak;
  $("#hlLeft").textContent = hilo.active ? hilo.deck.length : "-";
  $("#hlHighInfo").textContent = hilo.active ? cnt.hi + " cards" : "-";
  $("#hlLowInfo").textContent = hilo.active ? cnt.lo + " cards" : "-";
  $("#hlHigher").disabled = !(hilo.active && !hilo.busy && cnt.hi > 0);
  $("#hlLower").disabled = !(hilo.active && !hilo.busy && cnt.lo > 0);
  $("#hlCash").disabled = !(hilo.active && !hilo.busy && hilo.streak > 0);
  $("#hlCash").textContent =
    hilo.active && hilo.streak > 0
      ? "Cash out " + fmt(Math.floor(hilo.bet * 0.97 * hilo.fair))
      : "Cash out";
  $("#hiloStart").disabled = hilo.active;
}
function hlEndRound(val, note) {
  hilo.active = false;
  hilo.busy = false;
  if (val > 0) addBal(val);
  logHist("hilo", histLine(hilo.bet, val) + (note ? " - " + note : ""));
  recordRound("hilo", hilo.bet, val);
  if (val > hilo.bet) {
    setMsg(
      "hlMsg",
      "Cashed out " +
        fmt(val) +
        " fun credits after " +
        hilo.streak +
        " correct call" +
        (hilo.streak === 1 ? "" : "s") +
        ".",
      "win",
    );
    sfx.win();
    showWinBanner(
      $("#scr-hilo"),
      "Cashed Out",
      val,
      val >= hilo.bet * 5,
      "x" + (0.97 * hilo.fair).toFixed(2),
    );
    pushWin("You", val, "Hi-Lo Cards");
  } else if (val > 0) {
    setMsg("hlMsg", "Cashed out " + fmt(val) + " fun credits.", "info");
    sfx.coin();
  }
  hlUpdate();
  renderBal(val > hilo.bet);
}
$("#hiloStart").addEventListener("click", function () {
  if (hilo.active) return;
  var bet = readBet($("#hlBet"));
  if (bet === null) return;
  addBal(-bet);
  hilo.bet = bet;
  hilo.deck = bjDeck();
  hilo.base = hilo.deck.pop();
  hilo.fair = 1;
  hilo.streak = 0;
  hilo.active = true;
  hilo.busy = false;
  $("#hlNext").innerHTML = "";
  sfx.deal();
  setMsg(
    "hlMsg",
    "Your card is the " + hilo.base.r + ". Call Higher or Lower for the next card.",
    "info",
  );
  hlUpdate();
});
function hlGuess(dir) {
  if (!hilo.active || hilo.busy) return;
  var cnt = hlCounts();
  var chosen = dir === "hi" ? cnt.hi : cnt.lo;
  if (chosen <= 0) return;
  hilo.busy = true;
  hlUpdate();
  var card = hilo.deck.pop();
  $("#hlNext").innerHTML = bjCardHTML(card, false);
  sfx.deal();
  setTimeout(function () {
    var bv = pkRankVal(hilo.base),
      nv = pkRankVal(card);
    if (nv === bv) {
      hilo.base = card;
      $("#hlNext").innerHTML = "";
      hilo.busy = false;
      setMsg(
        "hlMsg",
        "Same rank - that is a push. The " +
          card.r +
          " becomes your card and your streak of " +
          hilo.streak +
          " stays alive.",
        "info",
      );
      sfx.chip();
      hlUpdate();
      return;
    }
    var correct = dir === "hi" ? nv > bv : nv < bv;
    if (correct) {
      hilo.fair *= (cnt.hi + cnt.lo) / chosen;
      hilo.streak++;
      hilo.base = card;
      $("#hlNext").innerHTML = "";
      hilo.busy = false;
      sfx.gem();
      if (hilo.deck.length === 0) {
        hlEndRound(Math.floor(hilo.bet * 0.97 * hilo.fair), "deck finished");
        return;
      }
      setMsg(
        "hlMsg",
        "Correct - the " +
          card.r +
          " lands. Multiplier is now x" +
          (0.97 * hilo.fair).toFixed(2) +
          ". Cash out or call again.",
        "info",
      );
      hlUpdate();
    } else {
      hilo.active = false;
      hilo.busy = false;
      logHist("hilo", histLine(hilo.bet, 0) + " - wrong call after " + hilo.streak + " correct");
      recordRound("hilo", hilo.bet, 0);
      setMsg(
        "hlMsg",
        "The " +
          card.r +
          " beats your call - round over. Your bet of " +
          fmt(hilo.bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
      hlUpdate();
      renderBal(false);
    }
  }, 620);
}
$("#hlHigher").addEventListener("click", function () {
  hlGuess("hi");
});
$("#hlLower").addEventListener("click", function () {
  hlGuess("lo");
});
$("#hlCash").addEventListener("click", function () {
  if (!hilo.active || hilo.busy || hilo.streak === 0) return;
  hlEndRound(
    Math.floor(hilo.bet * 0.97 * hilo.fair),
    "cashed out at x" + (0.97 * hilo.fair).toFixed(2),
  );
});
hlUpdate();

/* ================= 19. Sic Bo ================= */
var SIC_SPOTS = [
  { k: "big", lbl: "Big", sub: "Total 11-17, no triple - pays 1 to 1" },
  { k: "small", lbl: "Small", sub: "Total 4-10, no triple - pays 1 to 1" },
  { k: "even", lbl: "Even", sub: "Even total, no triple - pays 1 to 1" },
  { k: "odd", lbl: "Odd", sub: "Odd total, no triple - pays 1 to 1" },
  { k: "t4", lbl: "Total 4", sub: "pays 60 to 1" },
  { k: "t5", lbl: "Total 5", sub: "pays 30 to 1" },
  { k: "t6", lbl: "Total 6", sub: "pays 17 to 1" },
  { k: "t7", lbl: "Total 7", sub: "pays 12 to 1" },
  { k: "t8", lbl: "Total 8", sub: "pays 8 to 1" },
  { k: "t9", lbl: "Total 9", sub: "pays 6 to 1" },
  { k: "t10", lbl: "Total 10", sub: "pays 6 to 1" },
  { k: "t11", lbl: "Total 11", sub: "pays 6 to 1" },
  { k: "t12", lbl: "Total 12", sub: "pays 6 to 1" },
  { k: "t13", lbl: "Total 13", sub: "pays 8 to 1" },
  { k: "t14", lbl: "Total 14", sub: "pays 12 to 1" },
  { k: "t15", lbl: "Total 15", sub: "pays 17 to 1" },
  { k: "t16", lbl: "Total 16", sub: "pays 30 to 1" },
  { k: "t17", lbl: "Total 17", sub: "pays 60 to 1" },
  { k: "anytriple", lbl: "Any triple", sub: "pays 30 to 1" },
  { k: "triple1", lbl: "Triple 1s", sub: "pays 180 to 1" },
  { k: "triple2", lbl: "Triple 2s", sub: "pays 180 to 1" },
  { k: "triple3", lbl: "Triple 3s", sub: "pays 180 to 1" },
  { k: "triple4", lbl: "Triple 4s", sub: "pays 180 to 1" },
  { k: "triple5", lbl: "Triple 5s", sub: "pays 180 to 1" },
  { k: "triple6", lbl: "Triple 6s", sub: "pays 180 to 1" },
];
var SIC_TRET = {
  4: 61,
  5: 31,
  6: 18,
  7: 13,
  8: 9,
  9: 7,
  10: 7,
  11: 7,
  12: 7,
  13: 9,
  14: 13,
  15: 18,
  16: 31,
  17: 61,
};
var sic = { pick: "big", rolling: false };
(function buildSic() {
  $("#sicBoard").innerHTML = SIC_SPOTS.map(function (s) {
    return (
      '<button class="pickbtn sicspot' +
      (s.k === "big" ? " on" : "") +
      '" data-sic="' +
      s.k +
      '">' +
      s.lbl +
      "<small>" +
      s.sub +
      "</small></button>"
    );
  }).join("");
  $$("#sicBoard [data-sic]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (sic.rolling) return;
      $$("#sicBoard [data-sic]").forEach(function (x) {
        x.classList.remove("on");
      });
      b.classList.add("on");
      sic.pick = b.getAttribute("data-sic");
      var spot = SIC_SPOTS.filter(function (s) {
        return s.k === sic.pick;
      })[0];
      $("#sicPickLbl").textContent = spot.lbl + " - " + spot.sub;
      sfx.click();
    });
  });
})();
function sicReturn(d1, d2, d3, pick) {
  var total = d1 + d2 + d3,
    triple = d1 === d2 && d2 === d3;
  if (pick === "big") return !triple && total >= 11 && total <= 17 ? 2 : 0;
  if (pick === "small") return !triple && total >= 4 && total <= 10 ? 2 : 0;
  if (pick === "even") return !triple && total % 2 === 0 ? 2 : 0;
  if (pick === "odd") return !triple && total % 2 === 1 ? 2 : 0;
  if (pick === "anytriple") return triple ? 31 : 0;
  if (pick.indexOf("triple") === 0) return triple && d1 === Number(pick.slice(6)) ? 181 : 0;
  if (pick.indexOf("t") === 0)
    return SIC_TRET[total] && Number(pick.slice(1)) === total ? SIC_TRET[total] : 0;
  return 0;
}
$("#sicRoll").addEventListener("click", function () {
  if (sic.rolling) return;
  var bet = readBet($("#sicBet"));
  if (bet === null) return;
  addBal(-bet);
  sic.rolling = true;
  $("#sicRoll").disabled = true;
  var els = [$("#sicD1"), $("#sicD2"), $("#sicD3")];
  els.forEach(function (e) {
    e.classList.add("rolling");
  });
  var iv = setInterval(function () {
    els.forEach(function (e) {
      e.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    });
    sfx.tick();
  }, 75);
  setTimeout(function () {
    clearInterval(iv);
    var d1 = 1 + Math.floor(Math.random() * 6),
      d2 = 1 + Math.floor(Math.random() * 6),
      d3 = 1 + Math.floor(Math.random() * 6);
    var vals = [d1, d2, d3];
    els.forEach(function (e, i) {
      e.textContent = DICE_FACES[vals[i] - 1];
      e.classList.remove("rolling");
    });
    var total = d1 + d2 + d3,
      triple = d1 === d2 && d2 === d3;
    $("#sicTotal").textContent = total + (triple ? " - triple " + d1 + "s" : "");
    var mult = sicReturn(d1, d2, d3, sic.pick);
    var payout = Math.floor(bet * mult);
    if (payout > 0) addBal(payout);
    var spot = SIC_SPOTS.filter(function (s) {
      return s.k === sic.pick;
    })[0];
    logHist(
      "sicbo",
      histLine(bet, payout) + " - rolled " + d1 + "-" + d2 + "-" + d3 + " (" + spot.lbl + ")",
    );
    recordRound("sicbo", bet, payout);
    if (payout > bet) {
      setMsg(
        "sicMsg",
        "Rolled " +
          d1 +
          ", " +
          d2 +
          ", " +
          d3 +
          " - total " +
          total +
          ". Your " +
          spot.lbl +
          " bet wins " +
          fmt(payout) +
          " fun credits.",
        "win",
      );
      if (mult >= 13) sfx.bigwin();
      else sfx.win();
      showWinBanner(
        $("#scr-sicbo"),
        mult >= 31 ? "Huge Win" : "Win",
        payout,
        mult >= 13,
        spot.lbl + " - x" + mult,
      );
      pushWin("You", payout, "Sic Bo");
    } else {
      setMsg(
        "sicMsg",
        "Rolled " +
          d1 +
          ", " +
          d2 +
          ", " +
          d3 +
          " - total " +
          total +
          (triple &&
          (sic.pick === "big" || sic.pick === "small" || sic.pick === "even" || sic.pick === "odd")
            ? ". A triple beats Big, Small, Even and Odd bets"
            : "") +
          ". Your " +
          spot.lbl +
          " bet is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    sic.rolling = false;
    $("#sicRoll").disabled = false;
    renderBal(payout > bet);
  }, 750);
});

/* ================= 20. Dragon Tiger ================= */
var drag = { pick: "dragon", dealing: false };
$$("#scr-dragon [data-drag]").forEach(function (b) {
  b.addEventListener("click", function () {
    if (drag.dealing) return;
    $$("#scr-dragon [data-drag]").forEach(function (x) {
      x.classList.remove("on");
    });
    b.classList.add("on");
    drag.pick = b.getAttribute("data-drag");
    sfx.click();
  });
});
function dragVal(c) {
  if (c.r === "A") return 1;
  if (c.r === "K") return 13;
  if (c.r === "Q") return 12;
  if (c.r === "J") return 11;
  return Number(c.r);
}
$("#dragDeal").addEventListener("click", function () {
  if (drag.dealing) return;
  var bet = readBet($("#dragBet"));
  if (bet === null) return;
  addBal(-bet);
  drag.dealing = true;
  $("#dragDeal").disabled = true;
  var deck = bjDeck();
  var dc = deck.pop(),
    tc = deck.pop();
  $("#dragDHand").innerHTML = bjCardHTML(dc, false);
  $("#dragTHand").innerHTML = "";
  $("#dragDScore").hidden = true;
  $("#dragTScore").hidden = true;
  sfx.deal();
  setTimeout(function () {
    $("#dragTHand").innerHTML = bjCardHTML(tc, false);
    sfx.deal();
    var ds = $("#dragDScore"),
      ts = $("#dragTScore");
    ds.hidden = false;
    ds.textContent = dc.r;
    ts.hidden = false;
    ts.textContent = tc.r;
    var dv = dragVal(dc),
      tv = dragVal(tc);
    var result = dv > tv ? "dragon" : tv > dv ? "tiger" : "tie";
    var payout = 0,
      note = "";
    if (drag.pick === result) {
      if (result === "tie") {
        payout = bet * 9;
        note = "Tie bet pays 8 to 1.";
      } else {
        payout = bet * 2;
        note = (result === "dragon" ? "Dragon" : "Tiger") + " bet pays 1 to 1.";
      }
    } else if (result === "tie" && drag.pick !== "tie") {
      payout = Math.floor(bet / 2);
      note = "Tie - half of your " + drag.pick + " bet comes back.";
    }
    if (payout > 0) addBal(payout);
    var resTxt =
      result === "tie"
        ? "Tie - both cards are " + dc.r + "s"
        : result === "dragon"
          ? "Dragon wins, " + dc.r + " beats " + tc.r
          : "Tiger wins, " + tc.r + " beats " + dc.r;
    logHist("dragon", histLine(bet, payout) + " - " + resTxt + ", you bet " + drag.pick);
    recordRound("dragon", bet, payout);
    if (payout > bet) {
      setMsg("dragMsg", resTxt + ". " + note + " You won " + fmt(payout) + " fun credits.", "win");
      if (result === "tie") sfx.bigwin();
      else sfx.win();
      showWinBanner(
        $("#scr-dragon"),
        result === "tie" ? "Tie Win" : "Win",
        payout,
        result === "tie",
        note,
      );
      pushWin("You", payout, "Dragon Tiger");
    } else if (payout > 0) {
      setMsg("dragMsg", resTxt + ". " + note, "info");
      sfx.coin();
    } else {
      setMsg(
        "dragMsg",
        resTxt +
          ". Your " +
          drag.pick +
          " bet of " +
          fmt(bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    drag.dealing = false;
    $("#dragDeal").disabled = false;
    renderBal(payout > bet);
  }, 480);
});

/* ================= 21. Teen Patti Showdown ================= */
var TP_BONUS = { 6: 2, 5: 1, 4: 0.25, 3: 0.1, 2: 0.05, 1: 0 };
var TP_NAMES = {
  6: "Trail",
  5: "Pure sequence",
  4: "Sequence",
  3: "Color",
  2: "Pair",
  1: "High card",
};
var tp = { dealing: false };
function tpEval(h) {
  var rs = h.map(pkRankVal).sort(function (a, b) {
    return b - a;
  });
  var flush = h[0].suit === h[1].suit && h[1].suit === h[2].suit;
  var uniq = rs.filter(function (v, i) {
    return i === 0 || v !== rs[i - 1];
  });
  var seq = false,
    seqTop = 0;
  if (uniq.length === 3) {
    if (rs[0] - rs[2] === 2) {
      seq = true;
      seqTop = rs[0];
    } else if (rs[0] === 14 && rs[1] === 3 && rs[2] === 2) {
      seq = true;
      seqTop = 13.5;
    }
  }
  if (rs[0] === rs[1] && rs[1] === rs[2]) return { cat: 6, key: [rs[0]] };
  if (seq && flush) return { cat: 5, key: [seqTop] };
  if (seq) return { cat: 4, key: [seqTop] };
  if (flush) return { cat: 3, key: rs };
  if (uniq.length === 2) {
    var kick = rs[0] === rs[1] ? rs[2] : rs[0];
    return { cat: 2, key: [rs[1], kick] };
  }
  return { cat: 1, key: rs };
}
function tpCmp(a, b) {
  if (a.cat !== b.cat) return a.cat - b.cat;
  for (var i = 0; i < 3; i++) {
    var d = (a.key[i] || 0) - (b.key[i] || 0);
    if (d) return d;
  }
  return 0;
}
$("#tpDeal").addEventListener("click", function () {
  if (tp.dealing) return;
  var bet = readBet($("#tpBet"));
  if (bet === null) return;
  addBal(-bet);
  tp.dealing = true;
  $("#tpDeal").disabled = true;
  var deck = bjDeck();
  var ph = [deck.pop(), deck.pop(), deck.pop()];
  var dh = [deck.pop(), deck.pop(), deck.pop()];
  $("#tpPHand").innerHTML = ph
    .map(function (c) {
      return bjCardHTML(c, false);
    })
    .join("");
  $("#tpDHand").innerHTML = dh
    .map(function (c) {
      return bjCardHTML(c, false);
    })
    .join("");
  sfx.deal();
  setTimeout(function () {
    var pe = tpEval(ph),
      de = tpEval(dh);
    var ps = $("#tpPScore"),
      ds = $("#tpDScore");
    ps.hidden = false;
    ps.textContent = TP_NAMES[pe.cat];
    ds.hidden = false;
    ds.textContent = TP_NAMES[de.cat];
    var cmp = tpCmp(pe, de);
    var payout = 0,
      bonus = TP_BONUS[pe.cat] || 0;
    if (cmp > 0) payout = Math.floor(bet + bet * 0.89 + bet * bonus);
    else if (cmp === 0) payout = bet;
    if (payout > 0) addBal(payout);
    logHist(
      "teenpatti",
      histLine(bet, payout) + " - you: " + TP_NAMES[pe.cat] + ", dealer: " + TP_NAMES[de.cat],
    );
    recordRound("teenpatti", bet, payout);
    if (cmp > 0) {
      setMsg(
        "tpMsg",
        "Your " +
          TP_NAMES[pe.cat] +
          " beats the dealer's " +
          TP_NAMES[de.cat] +
          ". You won " +
          fmt(payout) +
          " fun credits" +
          (bonus > 0
            ? " including a " + TP_NAMES[pe.cat] + " bonus of " + fmt(Math.floor(bet * bonus))
            : "") +
          ".",
        "win",
      );
      if (pe.cat >= 5) sfx.bigwin();
      else sfx.win();
      showWinBanner(
        $("#scr-teenpatti"),
        TP_NAMES[pe.cat],
        payout,
        pe.cat >= 5,
        "win pays 0.89 to 1" + (bonus > 0 ? " + bonus x" + bonus : ""),
      );
      pushWin("You", payout, "Teen Patti Showdown");
    } else if (cmp === 0) {
      setMsg(
        "tpMsg",
        "Dead level - both hands are " +
          TP_NAMES[pe.cat] +
          " with the same cards. Your bet of " +
          fmt(bet) +
          " fun credits is returned.",
        "info",
      );
      sfx.coin();
    } else {
      setMsg(
        "tpMsg",
        "The dealer's " +
          TP_NAMES[de.cat] +
          " beats your " +
          TP_NAMES[pe.cat] +
          ". Your bet of " +
          fmt(bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    tp.dealing = false;
    $("#tpDeal").disabled = false;
    renderBal(payout > bet);
  }, 500);
});

/* ================= 22. Tower Climb ================= */
var tower = { active: false, bet: 0, bombs: [], level: 0, tiles: [] };
function towerMult(level) {
  return level <= 0 ? 0 : 0.97 * Math.pow(2, level);
}
(function buildTower() {
  var wrap = $("#towerGrid");
  wrap.innerHTML = "";
  tower.tiles = [];
  for (var lvl = 8; lvl >= 1; lvl--) {
    var row = document.createElement("div");
    row.className = "trow";
    row.id = "trow" + lvl;
    var lbl = document.createElement("span");
    lbl.className = "tlbl";
    lbl.innerHTML = "Level " + lvl + "<b>x" + towerMult(lvl).toFixed(2) + "</b>";
    row.appendChild(lbl);
    tower.tiles[lvl] = [];
    for (var side = 0; side < 2; side++) {
      var b = document.createElement("button");
      b.className = "ttile";
      b.textContent = "?";
      b.disabled = true;
      b.setAttribute("aria-label", "Level " + lvl + (side === 0 ? " left" : " right") + " tile");
      (function (L, S, btn) {
        btn.addEventListener("click", function () {
          towerPick(L, S, btn);
        });
      })(lvl, side, b);
      row.appendChild(b);
      tower.tiles[lvl][side] = b;
    }
    wrap.appendChild(row);
  }
})();
function towerUpdate() {
  for (var lvl = 1; lvl <= 8; lvl++) {
    var row = document.getElementById("trow" + lvl);
    if (row) row.classList.toggle("current", tower.active && lvl === tower.level + 1);
    for (var s = 0; s < 2; s++) {
      var t = tower.tiles[lvl][s];
      if (!t.classList.contains("safe") && !t.classList.contains("bomb"))
        t.disabled = !(tower.active && lvl === tower.level + 1);
    }
  }
  $("#twLevel").textContent = tower.level + " / 8";
  $("#twMult").textContent = tower.level > 0 ? "x" + towerMult(tower.level).toFixed(2) : "-";
  $("#twValue").textContent =
    tower.active && tower.level > 0 ? fmt(Math.floor(tower.bet * towerMult(tower.level))) : "0";
  $("#twCash").disabled = !(tower.active && tower.level > 0);
  $("#twCash").textContent =
    tower.active && tower.level > 0
      ? "Cash out " + fmt(Math.floor(tower.bet * towerMult(tower.level)))
      : "Cash out";
  $("#towerStart").disabled = tower.active;
}
function towerRevealBombs() {
  for (var lvl = 1; lvl <= 8; lvl++) {
    var bt = tower.tiles[lvl][tower.bombs[lvl]];
    if (bt && !bt.classList.contains("safe") && !bt.classList.contains("bomb")) {
      bt.innerHTML = '<svg><use href="#s-mine"/></svg>';
      bt.classList.add("done");
    }
    tower.tiles[lvl].forEach(function (t) {
      t.disabled = true;
    });
  }
}
function towerFinish(val, auto) {
  tower.active = false;
  if (val > 0) addBal(val);
  logHist(
    "tower",
    histLine(tower.bet, val) +
      " - cleared " +
      tower.level +
      " level" +
      (tower.level === 1 ? "" : "s"),
  );
  recordRound("tower", tower.bet, val);
  towerRevealBombs();
  if (val > tower.bet) {
    setMsg(
      "twMsg",
      (auto ? "Top of the tower! " : "Cashed out. ") +
        "You collected " +
        fmt(val) +
        " fun credits at x" +
        towerMult(tower.level).toFixed(2) +
        ".",
      "win",
    );
    if (tower.level >= 5) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      $("#scr-tower"),
      auto ? "Tower Cleared" : "Cashed Out",
      val,
      tower.level >= 5,
      "x" + towerMult(tower.level).toFixed(2),
    );
    pushWin("You", val, "Tower Climb");
  } else if (val > 0) {
    setMsg("twMsg", "Cashed out " + fmt(val) + " fun credits.", "info");
    sfx.coin();
  }
  towerUpdate();
  renderBal(val > tower.bet);
}
function towerPick(lvl, side, btn) {
  if (!tower.active || lvl !== tower.level + 1) return;
  if (tower.bombs[lvl] === side) {
    tower.active = false;
    btn.innerHTML = '<svg><use href="#s-mine"/></svg>';
    btn.classList.add("bomb", "flip");
    sfx.boom();
    logHist("tower", histLine(tower.bet, 0) + " - bomb on level " + lvl);
    recordRound("tower", tower.bet, 0);
    setMsg(
      "twMsg",
      "Bomb on level " +
        lvl +
        "! The climb is over and your bet of " +
        fmt(tower.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    towerRevealBombs();
    towerUpdate();
    renderBal(false);
    return;
  }
  btn.innerHTML = '<svg><use href="#s-gem"/></svg>';
  btn.classList.add("safe", "flip");
  btn.disabled = true;
  tower.tiles[lvl][1 - side].disabled = true;
  tower.level++;
  sfx.gem();
  if (tower.level >= 8) {
    towerFinish(Math.floor(tower.bet * towerMult(8)), true);
    return;
  }
  setMsg(
    "twMsg",
    "Level " +
      tower.level +
      " cleared. Multiplier x" +
      towerMult(tower.level).toFixed(2) +
      " - cash out or climb to level " +
      (tower.level + 1) +
      ".",
    "info",
  );
  towerUpdate();
}
$("#towerStart").addEventListener("click", function () {
  if (tower.active) return;
  var bet = readBet($("#twBet"));
  if (bet === null) return;
  addBal(-bet);
  tower.bet = bet;
  tower.level = 0;
  tower.active = true;
  tower.bombs = [];
  for (var lvl = 1; lvl <= 8; lvl++) tower.bombs[lvl] = Math.random() < 0.5 ? 0 : 1;
  for (var l2 = 1; l2 <= 8; l2++)
    tower.tiles[l2].forEach(function (t) {
      t.className = "ttile";
      t.textContent = "?";
      t.disabled = true;
    });
  sfx.chip();
  setMsg(
    "twMsg",
    "Climb started. Pick a tile on level 1 - one side is safe, the other hides a bomb.",
    "info",
  );
  towerUpdate();
});
$("#twCash").addEventListener("click", function () {
  if (!tower.active || tower.level === 0) return;
  towerFinish(Math.floor(tower.bet * towerMult(tower.level)), false);
});
towerUpdate();

/* ================= 23. Limbo ================= */
var limbo = { rolling: false, hist: [] };
function limboTarget() {
  var t = parseFloat($("#limboTarget").value);
  if (isNaN(t)) t = 2;
  t = Math.min(100, Math.max(1.01, t));
  $("#limboTarget").value = t.toFixed(2);
  return t;
}
function limboChance() {
  var t = parseFloat($("#limboTarget").value);
  if (isNaN(t)) t = 2;
  t = Math.min(100, Math.max(1.01, t));
  $("#limboChance").textContent = (97 / t).toFixed(2) + "%";
}
$("#limboTarget").addEventListener("input", limboChance);
$("#limboTarget").addEventListener("change", limboChance);
$$("#scr-limbo [data-lt]").forEach(function (b) {
  b.addEventListener("click", function () {
    $("#limboTarget").value = Number(b.getAttribute("data-lt")).toFixed(2);
    limboChance();
    sfx.click();
  });
});
limboChance();
$("#limboRoll").addEventListener("click", function () {
  if (limbo.rolling) return;
  var bet = readBet($("#limboBet"));
  if (bet === null) return;
  var target = limboTarget();
  addBal(-bet);
  limbo.rolling = true;
  $("#limboRoll").disabled = true;
  var u = Math.random();
  var roll = 0.97 / (1 - u);
  if (roll > 9999.99) roll = 9999.99;
  var disp = $("#limboNum");
  disp.classList.remove("lost");
  var t0 = performance.now(),
    dur = 600;
  setMsg("limboMsg", "Rolling...", "info");
  function stepFn(t) {
    var p = Math.min(1, (t - t0) / dur);
    var e = 1 - Math.pow(1 - p, 2);
    var v = 1 + (roll - 1) * e;
    disp.textContent = v.toFixed(2) + "x";
    if (p < 1) {
      requestAnimationFrame(stepFn);
      return;
    }
    var win = roll >= target;
    var payout = win ? Math.floor(bet * target) : 0;
    if (payout > 0) addBal(payout);
    limbo.hist.unshift({ roll: roll, win: win });
    if (limbo.hist.length > 12) limbo.hist.pop();
    $("#limboHist").innerHTML =
      '<span style="color:var(--mut)">Recent rolls:</span>' +
      limbo.hist
        .map(function (h) {
          return (
            '<span class="histchip ' + (h.win ? "hi" : "lo") + '">' + h.roll.toFixed(2) + "x</span>"
          );
        })
        .join("");
    logHist(
      "limbo",
      histLine(bet, payout) +
        " - rolled " +
        roll.toFixed(2) +
        "x vs target " +
        target.toFixed(2) +
        "x",
    );
    recordRound("limbo", bet, payout);
    if (win) {
      disp.classList.remove("lost");
      setMsg(
        "limboMsg",
        "Rolled " +
          roll.toFixed(2) +
          "x - that beats your " +
          target.toFixed(2) +
          "x target. You won " +
          fmt(payout) +
          " fun credits.",
        "win",
      );
      if (target >= 10) sfx.bigwin();
      else sfx.win();
      showWinBanner(
        $("#scr-limbo"),
        "Target Beaten",
        payout,
        target >= 10,
        "target x" + target.toFixed(2),
      );
      pushWin("You", payout, "Limbo");
    } else {
      disp.classList.add("lost");
      setMsg(
        "limboMsg",
        "Rolled " +
          roll.toFixed(2) +
          "x - under your " +
          target.toFixed(2) +
          "x target. Your bet of " +
          fmt(bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    limbo.rolling = false;
    $("#limboRoll").disabled = false;
    renderBal(win);
  }
  requestAnimationFrame(stepFn);
});

/* ================= 24. Andar Bahar ================= */
var andar = { pick: "andar", dealing: false };
$$("#scr-andar [data-andar]").forEach(function (b) {
  b.addEventListener("click", function () {
    if (andar.dealing) return;
    $$("#scr-andar [data-andar]").forEach(function (x) {
      x.classList.remove("on");
    });
    b.classList.add("on");
    andar.pick = b.getAttribute("data-andar");
    sfx.click();
  });
});
$("#andarDeal").addEventListener("click", function () {
  if (andar.dealing) return;
  var bet = readBet($("#andarBet"));
  if (bet === null) return;
  addBal(-bet);
  andar.dealing = true;
  $("#andarDeal").disabled = true;
  var deck = bjDeck();
  var joker = deck.pop();
  var aHand = [],
    bHand = [];
  $("#andarJoker").innerHTML = bjCardHTML(joker, false);
  $("#andarAHand").innerHTML = "";
  $("#andarBHand").innerHTML = "";
  var ac = $("#andarACount"),
    bc = $("#andarBCount");
  ac.hidden = false;
  bc.hidden = false;
  ac.textContent = "0 cards";
  bc.textContent = "0 cards";
  $("#andarDealt").textContent = "0";
  sfx.deal();
  setMsg(
    "andarMsg",
    "The joker is the " +
      joker.r +
      ". Dealing to Bahar first, then alternating, until a " +
      joker.r +
      " appears.",
    "info",
  );
  var dealt = 0,
    winner = null;
  var iv = setInterval(function () {
    if (dealt >= deck.length) {
      clearInterval(iv);
      return;
    }
    var card = deck[deck.length - 1 - dealt];
    var side = dealt % 2 === 0 ? "bahar" : "andar";
    dealt++;
    if (side === "andar") {
      aHand.push(card);
      $("#andarAHand").innerHTML = aHand
        .map(function (c) {
          return bjCardHTML(c, false);
        })
        .join("");
      ac.textContent = aHand.length + (aHand.length === 1 ? " card" : " cards");
    } else {
      bHand.push(card);
      $("#andarBHand").innerHTML = bHand
        .map(function (c) {
          return bjCardHTML(c, false);
        })
        .join("");
      bc.textContent = bHand.length + (bHand.length === 1 ? " card" : " cards");
    }
    $("#andarDealt").textContent = dealt;
    sfx.tick();
    if (card.r === joker.r) {
      winner = side;
      clearInterval(iv);
      var payout = 0;
      if (andar.pick === winner) payout = winner === "andar" ? bet * 2 : Math.floor(bet * 1.9);
      if (payout > 0) addBal(payout);
      var winTxt = winner === "andar" ? "Andar" : "Bahar";
      logHist(
        "andar",
        histLine(bet, payout) +
          " - " +
          winTxt +
          " matched the " +
          joker.r +
          " after " +
          dealt +
          " cards, you bet " +
          andar.pick,
      );
      recordRound("andar", bet, payout);
      if (payout > bet) {
        setMsg(
          "andarMsg",
          "The " +
            card.r +
            " lands on " +
            winTxt +
            " after " +
            dealt +
            " cards - " +
            winTxt +
            " wins. You won " +
            fmt(payout) +
            " fun credits.",
          "win",
        );
        sfx.win();
        showWinBanner(
          $("#scr-andar"),
          winTxt + " Wins",
          payout,
          payout >= bet * 5,
          winner === "andar" ? "pays 1 to 1" : "pays 0.9 to 1",
        );
        pushWin("You", payout, "Andar Bahar");
      } else {
        setMsg(
          "andarMsg",
          "The " +
            card.r +
            " lands on " +
            winTxt +
            " after " +
            dealt +
            " cards - " +
            winTxt +
            " wins. Your " +
            andar.pick +
            " bet of " +
            fmt(bet) +
            " fun credits is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          "lose",
        );
        sfx.lose();
      }
      andar.dealing = false;
      $("#andarDeal").disabled = false;
      renderBal(payout > bet);
    }
  }, 300);
});

/* ================= 25. Ocean Treasure Slots ================= */
var OCEAN = {
  weights: [
    ["shell", 24],
    ["clam", 22],
    ["turtle", 17],
    ["seahorse", 12],
    ["pearl", 5],
    ["chest", 3],
    ["map", 3],
  ],
  pay: {
    shell: [4, 12, 40],
    clam: [5, 18, 58],
    turtle: [8, 27, 90],
    seahorse: [11, 40, 120],
    pearl: [25, 105, 520],
    chest: [45, 200, 900],
  },
  scatterPay: { 3: 1, 4: 3, 5: 10 },
  chests: [0, 1, 3],
};
var oceanCells = buildCells($("#oceanGrid"), 3, 5);
var ocean = { spinning: false, bonus: false, bet: 0, baseWin: 0 };
function oceanSetGrid(g) {
  for (var r = 0; r < 3; r++)
    for (var c = 0; c < 5; c++) oceanCells[r][c].innerHTML = symHTML(g[r][c]);
}
oceanSetGrid(randomGrid(OCEAN.weights, 3, 5, "map", 2));
$("#oceanBet").addEventListener("input", function () {
  $("#oceanBetShow").textContent = fmt(clampBet(this.value, 100000));
});
function oceanSettle(total, note) {
  logHist("ocean", histLine(ocean.bet, total) + note);
  recordRound("ocean", ocean.bet, total);
  if (total > ocean.bet) {
    setMsg("oceanMsg", "You won " + fmt(total) + " fun credits" + note + ".", "win");
    if (total >= ocean.bet * 10) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      $("#scr-ocean"),
      total >= ocean.bet * 20 ? "Big Win" : "Treasure Win",
      total,
      total >= ocean.bet * 20,
      "x" + (total / Math.max(1, ocean.bet)).toFixed(1),
    );
    pushWin("You", total, "Ocean Treasure Slots");
  } else if (total > 0) {
    setMsg(
      "oceanMsg",
      fmt(total) + " of your " + fmt(ocean.bet) + " fun credits come back" + note + ".",
      "info",
    );
    sfx.coin();
  } else {
    setMsg("oceanMsg", "No win this time. Balance: " + fmt(bal) + " fun credits.", "lose");
    sfx.lose();
  }
  $("#oceanSpin").disabled = false;
  renderBal(total > ocean.bet);
}
function oceanSpin() {
  if (ocean.spinning || ocean.bonus) return;
  var bet = readBet($("#oceanBet"));
  if (bet === null) return;
  if (bet % 10 !== 0) {
    bet = Math.floor(bet / 10) * 10;
    if (bet < 10) bet = 10;
    $("#oceanBet").value = bet;
  }
  addBal(-bet);
  ocean.bet = bet;
  ocean.spinning = true;
  $("#oceanSpin").disabled = true;
  $("#oceanBetShow").textContent = fmt(bet);
  $("#oceanBonus").hidden = true;
  clearWins(oceanCells);
  var finalGrid = randomGrid(OCEAN.weights, 3, 5, "map", 5);
  spinAnim(oceanCells, finalGrid, OCEAN.weights, function () {
    var res = evalLines(finalGrid, OCEAN.pay, bet / 10, "chest");
    var sc = 0;
    finalGrid.forEach(function (row) {
      row.forEach(function (s) {
        if (s === "map") sc++;
      });
    });
    var scatWin = sc >= 3 ? bet * OCEAN.scatterPay[Math.min(sc, 5)] : 0;
    var total = res.total + scatWin;
    markWins(oceanCells, res.winCells);
    $("#oceanWin").textContent = fmt(total);
    ocean.spinning = false;
    if (sc >= 3) {
      ocean.bonus = true;
      ocean.baseWin = total;
      if (total > 0) addBal(total);
      var prizes = OCEAN.chests.slice();
      for (var i = prizes.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = prizes[i];
        prizes[i] = prizes[j];
        prizes[j] = t;
      }
      var row = $("#oceanChests");
      row.innerHTML = "";
      prizes.forEach(function (mult) {
        var b = document.createElement("button");
        b.className = "chestbtn";
        b.innerHTML = '<svg><use href="#s-ingot"/></svg>Pick';
        b.addEventListener("click", function () {
          oceanPick(mult, b);
        });
        row.appendChild(b);
      });
      $("#oceanBonus").hidden = false;
      setMsg(
        "oceanMsg",
        sc +
          " treasure maps! Lines and scatter paid " +
          fmt(total) +
          " fun credits. Now pick one chest for your bonus prize.",
        "win",
      );
      sfx.bigwin();
      renderBal(total > 0);
    } else {
      if (total > 0) addBal(total);
      oceanSettle(
        total,
        res.lineWins.length
          ? " across " + res.lineWins.length + " line" + (res.lineWins.length > 1 ? "s" : "")
          : "",
      );
    }
  });
}
function oceanPick(mult, btn) {
  if (!ocean.bonus) return;
  ocean.bonus = false;
  var prize = Math.floor(ocean.bet * mult);
  $$("#oceanChests .chestbtn").forEach(function (b) {
    b.disabled = true;
  });
  btn.classList.add("picked");
  btn.innerHTML =
    '<svg><use href="#s-ingot"/></svg>' +
    (mult === 0 ? "Empty chest" : "x" + mult + " = " + fmt(prize));
  var total = ocean.baseWin + prize;
  if (prize > 0) addBal(prize);
  $("#oceanWin").textContent = fmt(total);
  oceanSettle(total, " - chest bonus x" + mult);
}
$("#oceanSpin").addEventListener("click", oceanSpin);

/* ================= 26. Pharaoh Gold Slots ================= */
var PHAR = {
  weights: [
    ["scarab", 24],
    ["ankh", 22],
    ["eye", 17],
    ["cat", 12],
    ["pharaoh", 5],
    ["sphinx", 3],
    ["pyr", 3],
  ],
  pay: {
    scarab: [3, 12, 40],
    ankh: [4, 14, 47],
    eye: [6, 20, 70],
    cat: [9, 34, 100],
    pharaoh: [22, 90, 450],
    sphinx: [45, 180, 900],
  },
  scatterPay: { 3: 2, 4: 5, 5: 20 },
};
var pharCells = buildCells($("#pharGrid"), 3, 5);
var phar = { spinning: false, fs: 0, fsWin: 0, fsBet: 100 };
function pharSetGrid(g) {
  for (var r = 0; r < 3; r++)
    for (var c = 0; c < 5; c++) pharCells[r][c].innerHTML = symHTML(g[r][c]);
}
pharSetGrid(randomGrid(PHAR.weights, 3, 5, "pyr", 2));
$("#pharBet").addEventListener("input", function () {
  $("#pharBetShow").textContent = fmt(clampBet(this.value, 100000));
});
function pharSpin() {
  if (phar.spinning) return;
  var isFree = phar.fs > 0;
  var bet;
  if (isFree) {
    bet = phar.fsBet;
    phar.fs--;
  } else {
    bet = readBet($("#pharBet"));
    if (bet === null) return;
    if (bet % 10 !== 0) {
      bet = Math.floor(bet / 10) * 10;
      if (bet < 10) bet = 10;
      $("#pharBet").value = bet;
    }
    addBal(-bet);
  }
  phar.spinning = true;
  $("#pharSpin").disabled = true;
  $("#pharBetShow").textContent = fmt(bet);
  clearWins(pharCells);
  var finalGrid = randomGrid(PHAR.weights, 3, 5, "pyr", 5);
  if (isFree) {
    for (var c = 0; c < 5; c++) {
      var has = false;
      for (var r = 0; r < 3; r++) if (finalGrid[r][c] === "sphinx") has = true;
      if (has) for (var r2 = 0; r2 < 3; r2++) finalGrid[r2][c] = "sphinx";
    }
  }
  spinAnim(pharCells, finalGrid, PHAR.weights, function () {
    var res = evalLines(finalGrid, PHAR.pay, bet / 10, "sphinx");
    var sc = 0;
    finalGrid.forEach(function (row) {
      row.forEach(function (s) {
        if (s === "pyr") sc++;
      });
    });
    var scatWin = sc >= 3 ? bet * (PHAR.scatterPay[Math.min(sc, 5)] || 20) : 0;
    var total = res.total + scatWin;
    markWins(pharCells, res.winCells);
    $("#pharWin").textContent = fmt(total);
    if (isFree) phar.fsWin += total;
    if (total > 0) {
      addBal(total);
      setMsg(
        "pharMsg",
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
        $("#scr-pharaoh"),
        total >= bet * 20 ? "Big Win" : "Win",
        total,
        total >= bet * 20,
        "x" + (total / Math.max(1, bet)).toFixed(1),
      );
      pushWin("You", total, "Pharaoh Gold Slots");
    } else {
      setMsg(
        "pharMsg",
        (isFree ? "Free spin: no win this time." : "No win this time. Spin again.") +
          " Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      sfx.lose();
    }
    logHist(
      "pharaoh",
      isFree ? 'Free spin - <span class="hw">won ' + fmt(total) + "</span>" : histLine(bet, total),
    );
    recordRound("pharaoh", isFree ? 0 : bet, total);
    phar.spinning = false;
    if (sc >= 3 && !isFree) {
      phar.fs = 8;
      phar.fsBet = bet;
      phar.fsWin = 0;
      setMsg(
        "pharMsg",
        sc +
          " pyramids! You won 8 free spins with expanding wilds plus " +
          fmt(scatWin) +
          " fun credits. Free spins start now.",
        "win",
      );
      sfx.bigwin();
    }
    if (phar.fs > 0) {
      $("#pharFs").classList.add("on");
      $("#pharFs").textContent =
        "Free spins left: " + phar.fs + " - won so far: " + fmt(phar.fsWin);
      setTimeout(function () {
        pharSpin();
      }, 1100);
    } else {
      $("#pharFs").classList.remove("on");
      $("#pharSpin").disabled = false;
    }
    renderBal(total > 0);
  });
}
$("#pharSpin").addEventListener("click", pharSpin);

/* ================= 27. Cluster Fruits ================= */
var CLUS = {
  weights: [
    ["cherry", 30],
    ["lemon", 27],
    ["grape", 20],
    ["melon", 12],
    ["plum", 7],
    ["star", 4],
  ],
  pay: {
    cherry: [2.5, 5, 10, 20],
    lemon: [2.5, 5, 10, 20],
    grape: [3.5, 7, 14, 28],
    melon: [5.5, 12, 24, 48],
    plum: [10, 20, 40, 80],
    star: [18, 36, 72, 144],
  },
  mults: [1, 2, 3, 5],
};
var clusCells = buildCells($("#clusGrid"), 6, 6);
var clus = { playing: false, bet: 0, grid: [], total: 0, cascade: 0 };
function clusRandom() {
  var s = pickWeighted(CLUS.weights);
  return s;
}
function clusNewGrid() {
  clus.grid = [];
  for (var r = 0; r < 6; r++) {
    clus.grid.push([]);
    for (var c = 0; c < 6; c++) clus.grid[r].push(clusRandom());
  }
}
function clusRender() {
  for (var r = 0; r < 6; r++)
    for (var c = 0; c < 6; c++) clusCells[r][c].innerHTML = symHTML(clus.grid[r][c]);
}
function clusFindWins() {
  var seen = [],
    r,
    c;
  for (r = 0; r < 6; r++) {
    seen.push([]);
    for (c = 0; c < 6; c++) seen[r][c] = false;
  }
  var cells = [],
    pay = 0;
  var DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (r = 0; r < 6; r++)
    for (c = 0; c < 6; c++) {
      if (seen[r][c]) continue;
      var sym = clus.grid[r][c];
      var stack = [[r, c]],
        group = [];
      seen[r][c] = true;
      while (stack.length) {
        var cur = stack.pop();
        group.push(cur);
        for (var d = 0; d < 4; d++) {
          var nr = cur[0] + DIRS[d][0],
            nc = cur[1] + DIRS[d][1];
          if (
            nr >= 0 &&
            nr < 6 &&
            nc >= 0 &&
            nc < 6 &&
            !seen[nr][nc] &&
            clus.grid[nr][nc] === sym
          ) {
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }
      if (group.length >= 8) {
        var tier = group.length >= 15 ? 3 : group.length >= 12 ? 2 : group.length >= 10 ? 1 : 0;
        pay += CLUS.pay[sym][tier];
        cells = cells.concat(group);
      }
    }
  return { cells: cells, pay: pay };
}
function clusDrop() {
  for (var c = 0; c < 6; c++) {
    var col = [];
    for (var r = 0; r < 6; r++) if (clus.grid[r][c] !== null) col.push(clus.grid[r][c]);
    while (col.length < 6) col.unshift(clusRandom());
    for (var r2 = 0; r2 < 6; r2++) clus.grid[r2][c] = col[r2];
  }
}
function clusStep() {
  var w = clusFindWins();
  if (!w.cells.length) {
    clusFinish();
    return;
  }
  clus.cascade++;
  var mult = CLUS.mults[Math.min(clus.cascade, 4) - 1];
  var amt = Math.floor(clus.bet * w.pay * mult);
  clus.total += amt;
  w.cells.forEach(function (p) {
    clusCells[p[0]][p[1]].classList.add("win");
  });
  $("#clusWin").textContent = fmt(clus.total);
  $("#clusMult").textContent = "x" + mult;
  sfx.gem();
  setMsg(
    "clusMsg",
    "Cascade " +
      clus.cascade +
      " paid " +
      fmt(amt) +
      " fun credits at x" +
      mult +
      ". Clearing and dropping...",
    "info",
  );
  setTimeout(function () {
    w.cells.forEach(function (p) {
      clus.grid[p[0]][p[1]] = null;
      clusCells[p[0]][p[1]].classList.remove("win");
    });
    clusDrop();
    clusRender();
    setTimeout(clusStep, 160);
  }, 680);
}
function clusFinish() {
  clus.playing = false;
  var total = clus.total,
    bet = clus.bet;
  if (total > 0) addBal(total);
  logHist(
    "cluster",
    histLine(bet, total) +
      (clus.cascade ? " - " + clus.cascade + " cascade" + (clus.cascade > 1 ? "s" : "") : ""),
  );
  recordRound("cluster", bet, total);
  if (total > bet) {
    setMsg(
      "clusMsg",
      "Spin over after " +
        clus.cascade +
        " cascade" +
        (clus.cascade > 1 ? "s" : "") +
        " - you won " +
        fmt(total) +
        " fun credits.",
      "win",
    );
    if (total >= bet * 10) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      $("#scr-cluster"),
      total >= bet * 20 ? "Big Win" : "Cluster Win",
      total,
      total >= bet * 20,
      "x" + (total / Math.max(1, bet)).toFixed(1),
    );
    pushWin("You", total, "Cluster Fruits");
  } else if (total > 0) {
    setMsg(
      "clusMsg",
      "Spin over - " + fmt(total) + " of your " + fmt(bet) + " fun credits come back.",
      "info",
    );
    sfx.coin();
  } else {
    setMsg(
      "clusMsg",
      "No group of 8 or more on this spin. Balance: " + fmt(bal) + " fun credits.",
      "lose",
    );
    sfx.lose();
  }
  $("#clusSpin").disabled = false;
  renderBal(total > bet);
}
$("#clusSpin").addEventListener("click", function () {
  if (clus.playing) return;
  var bet = readBet($("#clusBet"));
  if (bet === null) return;
  addBal(-bet);
  clus.bet = bet;
  clus.total = 0;
  clus.cascade = 0;
  clus.playing = true;
  clusNewGrid();
  clusRender();
  $("#clusWin").textContent = "0";
  $("#clusMult").textContent = "x1";
  $("#clusSpin").disabled = true;
  sfx.chip();
  setMsg("clusMsg", "Grid spun for " + fmt(bet) + " fun credits. Looking for clusters...", "info");
  setTimeout(clusStep, 380);
});
clusNewGrid();
clusRender();

/* ================= 28. Caribbean Stud Poker ================= */
var CAR_PAY = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 7, 7: 20, 8: 50 };
var CAR_NAMES = [
  "High card",
  "Pair",
  "Two pair",
  "Three of a kind",
  "Straight",
  "Flush",
  "Full house",
  "Four of a kind",
  "Straight flush",
];
function eval5c(hand) {
  var vals = hand.map(pkRankVal).sort(function (a, b) {
    return b - a;
  });
  var flush = hand.every(function (c) {
    return c.suit === hand[0].suit;
  });
  var uniq = vals.filter(function (v, i) {
    return i === 0 || v !== vals[i - 1];
  });
  var straight = false,
    sHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) {
      straight = true;
      sHigh = uniq[0];
    } else if (uniq.join(",") === "14,5,4,3,2") {
      straight = true;
      sHigh = 5;
    }
  }
  var counts = {};
  vals.forEach(function (v) {
    counts[v] = (counts[v] || 0) + 1;
  });
  var groups = Object.keys(counts)
    .map(function (k) {
      return { v: Number(k), n: counts[k] };
    })
    .sort(function (a, b) {
      return b.n - a.n || b.v - a.v;
    });
  var kickers = groups
    .slice(1)
    .map(function (g) {
      return g.v;
    })
    .sort(function (a, b) {
      return b - a;
    });
  if (straight && flush)
    return {
      score: [8, sHigh],
      name: sHigh === 14 ? "Royal flush" : "Straight flush",
      pay: sHigh === 14 ? 100 : 50,
    };
  if (groups[0].n === 4)
    return { score: [7, groups[0].v, groups[1].v], name: "Four of a kind", pay: 20 };
  if (groups[0].n === 3 && groups[1] && groups[1].n === 2)
    return { score: [6, groups[0].v, groups[1].v], name: "Full house", pay: 7 };
  if (flush) return { score: [5].concat(vals), name: "Flush", pay: 5 };
  if (straight) return { score: [4, sHigh], name: "Straight", pay: 4 };
  if (groups[0].n === 3)
    return { score: [3, groups[0].v].concat(kickers), name: "Three of a kind", pay: 3 };
  if (groups[0].n === 2 && groups[1] && groups[1].n === 2) {
    var ps = groups
      .slice(0, 2)
      .map(function (g) {
        return g.v;
      })
      .sort(function (a, b) {
        return b - a;
      });
    return { score: [2].concat(ps).concat([groups[2].v]), name: "Two pair", pay: 2 };
  }
  if (groups[0].n === 2) return { score: [1, groups[0].v].concat(kickers), name: "Pair", pay: 1 };
  return { score: [0].concat(vals), name: "High card", pay: 0 };
}
function cmpScore(a, b) {
  for (var i = 0; i < Math.max(a.length, b.length); i++) {
    var d = (a[i] || 0) - (b[i] || 0);
    if (d) return d;
  }
  return 0;
}
function hasAK(hand) {
  return (
    hand.some(function (c) {
      return c.r === "A";
    }) &&
    hand.some(function (c) {
      return c.r === "K";
    })
  );
}
var car = { phase: "idle", bet: 0, p: [], d: [], deck: [] };
function carRender(reveal) {
  $("#carPHand").innerHTML = car.p
    .map(function (c) {
      return bjCardHTML(c, false);
    })
    .join("");
  $("#carDHand").innerHTML = car.d
    .map(function (c, i) {
      return bjCardHTML(c, !reveal && i > 0);
    })
    .join("");
  var pn = $("#carPName"),
    dn = $("#carDName");
  if (car.p.length) {
    pn.hidden = false;
    pn.textContent = eval5c(car.p).name;
  } else pn.hidden = true;
  if (reveal && car.d.length) {
    dn.hidden = false;
    dn.textContent = eval5c(car.d).name;
  } else dn.hidden = true;
}
function carSetBtns() {
  $("#carDeal").disabled = car.phase !== "idle";
  $("#carCall").disabled = car.phase !== "decide";
  $("#carFold").disabled = car.phase !== "decide";
}
function carEndRound(payout, wagered, msgText, kind) {
  car.phase = "idle";
  carRender(true);
  if (payout > 0) addBal(payout);
  logHist(
    "carib",
    histLine(wagered, payout) + " - you " + eval5c(car.p).name + " vs dealer " + eval5c(car.d).name,
  );
  recordRound("carib", wagered, payout);
  setMsg("carMsg", msgText, kind);
  carSetBtns();
  renderBal(payout > wagered);
}
$("#carDeal").addEventListener("click", function () {
  if (car.phase !== "idle") return;
  var bet = readBet($("#carBet"));
  if (bet === null) return;
  addBal(-bet);
  car.bet = bet;
  car.deck = bjDeck();
  car.p = [car.deck.pop(), car.deck.pop(), car.deck.pop(), car.deck.pop(), car.deck.pop()];
  car.d = [car.deck.pop(), car.deck.pop(), car.deck.pop(), car.deck.pop(), car.deck.pop()];
  car.phase = "decide";
  sfx.deal();
  carRender(false);
  carSetBtns();
  setMsg(
    "carMsg",
    "Your hand: " +
      eval5c(car.p).name +
      ". Call to play on for 2 x ante (" +
      fmt(bet * 2) +
      "), or fold the ante.",
    "info",
  );
});
$("#carFold").addEventListener("click", function () {
  if (car.phase !== "decide") return;
  sfx.lose();
  carEndRound(
    0,
    car.bet,
    "You folded " +
      eval5c(car.p).name +
      " and lose the ante of " +
      fmt(car.bet) +
      " fun credits. Dealer had " +
      eval5c(car.d).name +
      ". Balance: " +
      fmt(bal) +
      " fun credits.",
    "lose",
  );
});
$("#carCall").addEventListener("click", function () {
  if (car.phase !== "decide") return;
  var callBet = car.bet * 2;
  if (bal < callBet) {
    setMsg(
      "carMsg",
      "Calling needs " +
        fmt(callBet) +
        " more fun credits - your balance is " +
        fmt(bal) +
        ". Fold, or lower the ante next hand.",
      "lose",
    );
    return;
  }
  addBal(-callBet);
  var pe = eval5c(car.p),
    de = eval5c(car.d);
  var qualifies = de.score[0] >= 1 || hasAK(car.d);
  var wagered = car.bet + callBet;
  if (!qualifies) {
    var payoutNQ = car.bet * 2 + callBet;
    carEndRound(
      payoutNQ,
      wagered,
      "Dealer does not qualify (only " +
        de.name +
        ", no Ace-King). Your ante pays 1 to 1 and the call bet comes back - you receive " +
        fmt(payoutNQ) +
        " fun credits.",
      "win",
    );
    sfx.win();
    showWinBanner($("#scr-carib"), "Dealer No Qualify", payoutNQ, false, "ante 1 to 1");
    pushWin("You", payoutNQ, "Caribbean Stud Poker");
    return;
  }
  var c = cmpScore(pe.score, de.score);
  if (c > 0) {
    var payout = car.bet * 2 + callBet + Math.floor(callBet * pe.pay);
    carEndRound(
      payout,
      wagered,
      "Your " +
        pe.name +
        " beats the dealer " +
        de.name +
        ". Call bet pays " +
        pe.pay +
        " to 1 - you receive " +
        fmt(payout) +
        " fun credits.",
      "win",
    );
    if (pe.pay >= 7) sfx.bigwin();
    else sfx.win();
    showWinBanner($("#scr-carib"), pe.name, payout, pe.pay >= 7, "call pays " + pe.pay + " to 1");
    pushWin("You", payout, "Caribbean Stud Poker");
  } else if (c === 0) {
    carEndRound(
      wagered,
      wagered,
      "Both hands are " +
        pe.name +
        " with equal kickers - a push. Your " +
        fmt(wagered) +
        " fun credits come back.",
      "info",
    );
    sfx.coin();
  } else {
    carEndRound(
      0,
      wagered,
      "Dealer " +
        de.name +
        " beats your " +
        pe.name +
        ". You lose " +
        fmt(wagered) +
        " fun credits. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    sfx.lose();
  }
});
carSetBtns();

/* ================= 29. Three Card Poker ================= */
function eval3c(hand) {
  var vals = hand.map(pkRankVal).sort(function (a, b) {
    return b - a;
  });
  var flush = hand.every(function (c) {
    return c.suit === hand[0].suit;
  });
  var uniq = vals.filter(function (v, i) {
    return i === 0 || v !== vals[i - 1];
  });
  var straight = false,
    sHigh = 0;
  if (uniq.length === 3) {
    if (uniq[0] - uniq[2] === 2) {
      straight = true;
      sHigh = uniq[0];
    } else if (uniq.join(",") === "14,3,2") {
      straight = true;
      sHigh = 3;
    }
  }
  var isPair = uniq.length === 2;
  var pv = isPair ? (vals[0] === vals[1] ? vals[0] : vals[2]) : 0;
  var kick = isPair
    ? vals.filter(function (v) {
        return v !== pv;
      })[0]
    : 0;
  if (straight && flush) return { score: [5, sHigh], name: "Straight flush", bonus: 5, pp: 40 };
  if (uniq.length === 1) return { score: [4, vals[0]], name: "Three of a kind", bonus: 4, pp: 30 };
  if (straight) return { score: [3, sHigh], name: "Straight", bonus: 1, pp: 6 };
  if (flush) return { score: [2].concat(vals), name: "Flush", bonus: 0, pp: 4 };
  if (isPair) return { score: [1, pv, kick], name: "Pair", bonus: 0, pp: 1 };
  return { score: [0].concat(vals), name: "High card", bonus: 0, pp: 0 };
}
var tcp = { phase: "idle", bet: 0, ppOn: false, p: [], d: [], deck: [] };
$("#tcpPp").addEventListener("click", function () {
  if (tcp.phase !== "idle") return;
  tcp.ppOn = !tcp.ppOn;
  this.textContent = "Pair Plus side bet: " + (tcp.ppOn ? "On - same as ante" : "Off");
  this.classList.toggle("on", tcp.ppOn);
  sfx.click();
});
function tcpRender(reveal) {
  $("#tcpPHand").innerHTML = tcp.p
    .map(function (c) {
      return bjCardHTML(c, false);
    })
    .join("");
  $("#tcpDHand").innerHTML = tcp.d
    .map(function (c) {
      return bjCardHTML(c, !reveal);
    })
    .join("");
  var pn = $("#tcpPName"),
    dn = $("#tcpDName");
  if (tcp.p.length) {
    pn.hidden = false;
    pn.textContent = eval3c(tcp.p).name;
  } else pn.hidden = true;
  if (reveal && tcp.d.length) {
    dn.hidden = false;
    dn.textContent = eval3c(tcp.d).name;
  } else dn.hidden = true;
}
function tcpSetBtns() {
  $("#tcpDeal").disabled = tcp.phase !== "idle";
  $("#tcpPlay").disabled = tcp.phase !== "decide";
  $("#tcpFold").disabled = tcp.phase !== "decide";
}
function tcpPpPayout(pe) {
  if (!tcp.ppOn || pe.pp <= 0) return 0;
  return tcp.bet + Math.floor(tcp.bet * pe.pp);
}
$("#tcpDeal").addEventListener("click", function () {
  if (tcp.phase !== "idle") return;
  var bet = readBet($("#tcpBet"));
  if (bet === null) return;
  if (tcp.ppOn && bal < bet * 2) {
    setMsg(
      "tcpMsg",
      "Pair Plus needs the ante amount again (" +
        fmt(bet) +
        ") on top of the ante. Lower the ante or switch Pair Plus off.",
      "lose",
    );
    return;
  }
  addBal(-bet);
  if (tcp.ppOn) addBal(-bet);
  tcp.bet = bet;
  tcp.deck = bjDeck();
  tcp.p = [tcp.deck.pop(), tcp.deck.pop(), tcp.deck.pop()];
  tcp.d = [tcp.deck.pop(), tcp.deck.pop(), tcp.deck.pop()];
  tcp.phase = "decide";
  sfx.deal();
  tcpRender(false);
  tcpSetBtns();
  setMsg(
    "tcpMsg",
    "Your hand: " +
      eval3c(tcp.p).name +
      ". Play for 1 x ante (" +
      fmt(bet) +
      ") or fold. Standard play: Queen-6-4 or better.",
    "info",
  );
});
$("#tcpFold").addEventListener("click", function () {
  if (tcp.phase !== "decide") return;
  var pe = eval3c(tcp.p);
  var ppPay = tcpPpPayout(pe);
  var wagered = tcp.bet + (tcp.ppOn ? tcp.bet : 0);
  tcp.phase = "idle";
  tcpRender(true);
  if (ppPay > 0) addBal(ppPay);
  logHist("tcp", histLine(wagered, ppPay) + " - folded with " + pe.name);
  recordRound("tcp", wagered, ppPay);
  if (ppPay > wagered) {
    setMsg(
      "tcpMsg",
      "You folded the ante, but Pair Plus pays on your " +
        pe.name +
        " - you receive " +
        fmt(ppPay) +
        " fun credits.",
      "win",
    );
    sfx.win();
    showWinBanner(
      $("#scr-tcp"),
      "Pair Plus Win",
      ppPay,
      pe.pp >= 30,
      "Pair Plus " + pe.pp + " to 1",
    );
    pushWin("You", ppPay, "Three Card Poker");
  } else {
    setMsg(
      "tcpMsg",
      "You folded " +
        pe.name +
        " and lose the ante of " +
        fmt(tcp.bet) +
        " fun credits" +
        (tcp.ppOn ? " - Pair Plus did not pay on that hand" : "") +
        ". Dealer had " +
        eval3c(tcp.d).name +
        ". Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    sfx.lose();
  }
  tcpSetBtns();
  renderBal(ppPay > wagered);
});
$("#tcpPlay").addEventListener("click", function () {
  if (tcp.phase !== "decide") return;
  if (bal < tcp.bet) {
    setMsg(
      "tcpMsg",
      "Playing needs " +
        fmt(tcp.bet) +
        " more fun credits - your balance is " +
        fmt(bal) +
        ". Fold instead.",
      "lose",
    );
    return;
  }
  addBal(-tcp.bet);
  var pe = eval3c(tcp.p),
    de = eval3c(tcp.d);
  var ppPay = tcpPpPayout(pe);
  var bonus = Math.floor(tcp.bet * pe.bonus);
  var wagered = tcp.bet * 2 + (tcp.ppOn ? tcp.bet : 0);
  var qualifies = de.score[0] >= 1 || de.score[1] >= 12;
  var payout, msgText, kind;
  if (!qualifies) {
    payout = tcp.bet * 2 + tcp.bet + bonus + ppPay;
    msgText =
      "Dealer does not qualify (worse than Queen high). Ante pays 1 to 1, play bet returns" +
      (bonus ? ", plus an ante bonus of " + fmt(bonus) : "") +
      (ppPay ? ", plus Pair Plus " + fmt(ppPay) : "") +
      " - you receive " +
      fmt(payout) +
      " fun credits.";
    kind = "win";
  } else {
    var c = cmpScore(pe.score, de.score);
    if (c > 0) {
      payout = tcp.bet * 2 + tcp.bet * 2 + bonus + ppPay;
      msgText =
        "Your " +
        pe.name +
        " beats the dealer " +
        de.name +
        " - ante and play both pay 1 to 1" +
        (bonus ? ", plus an ante bonus of " + fmt(bonus) : "") +
        (ppPay ? ", plus Pair Plus " + fmt(ppPay) : "") +
        ". You receive " +
        fmt(payout) +
        " fun credits.";
      kind = "win";
    } else if (c === 0) {
      payout = tcp.bet + tcp.bet + bonus + ppPay;
      msgText =
        "Equal hands - ante and play bets push" +
        (bonus ? ", and the ante bonus of " + fmt(bonus) + " still pays" : "") +
        (ppPay ? ", plus Pair Plus " + fmt(ppPay) : "") +
        ". You receive " +
        fmt(payout) +
        " fun credits.";
      kind = "info";
    } else {
      payout = bonus + ppPay;
      msgText =
        "Dealer " +
        de.name +
        " beats your " +
        pe.name +
        " - ante and play bets are lost" +
        (bonus || ppPay
          ? ", but you still receive " + fmt(payout) + " from the bonus and side bet"
          : "") +
        ". Balance: " +
        fmt(bal + payout) +
        " fun credits.";
      kind = payout > 0 ? "info" : "lose";
    }
  }
  tcp.phase = "idle";
  tcpRender(true);
  if (payout > 0) addBal(payout);
  logHist("tcp", histLine(wagered, payout) + " - you " + pe.name + " vs dealer " + de.name);
  recordRound("tcp", wagered, payout);
  setMsg("tcpMsg", msgText, kind);
  if (payout > wagered) {
    if (pe.pp >= 30 || pe.bonus >= 4) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      $("#scr-tcp"),
      pe.name,
      payout,
      pe.pp >= 30 || pe.bonus >= 4,
      "total x" + (payout / Math.max(1, wagered)).toFixed(1),
    );
    pushWin("You", payout, "Three Card Poker");
  } else if (payout === 0) sfx.lose();
  else sfx.coin();
  tcpSetBtns();
  renderBal(payout > wagered);
});
tcpSetBtns();

/* ================= 30. Casino War ================= */
var war = { phase: "idle", bet: 0, tieBet: 0, tiePaid: 0, p: null, d: null, shoe: [] };
function warShoe() {
  var d = [];
  for (var k = 0; k < 6; k++) d = d.concat(bjDeck());
  for (var i = d.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = d[i];
    d[i] = d[j];
    d[j] = t;
  }
  return d;
}
function warRender() {
  $("#warPHand").innerHTML = war.p ? bjCardHTML(war.p, false) : "";
  $("#warDHand").innerHTML = war.d ? bjCardHTML(war.d, false) : "";
}
function warSetBtns() {
  $("#warDeal").disabled = war.phase !== "idle";
  $("#warGo").disabled = war.phase !== "war";
  $("#warSurrender").disabled = war.phase !== "war";
}
function warSettle(payout, wagered, note) {
  war.phase = "idle";
  logHist("war", histLine(wagered, payout) + note);
  recordRound("war", wagered, payout);
  warSetBtns();
  renderBal(payout > wagered);
}
$("#warDeal").addEventListener("click", function () {
  if (war.phase !== "idle") return;
  var bet = readBet($("#warBet"));
  if (bet === null) return;
  var tb = Math.floor(Number($("#warTieBet").value) || 0);
  if (tb < 0) tb = 0;
  if (tb > 0 && tb < 10) tb = 10;
  if (bet + tb > bal) {
    setMsg(
      "warMsg",
      "Bet plus tie bet is higher than your balance of " +
        fmt(bal) +
        " fun credits. Lower one of them.",
      "lose",
    );
    return;
  }
  $("#warTieBet").value = tb;
  addBal(-(bet + tb));
  war.bet = bet;
  war.tieBet = tb;
  war.tiePaid = 0;
  war.shoe = warShoe();
  war.p = war.shoe.pop();
  war.d = war.shoe.pop();
  warRender();
  sfx.deal();
  var pv = pkRankVal(war.p),
    dv = pkRankVal(war.d);
  if (pv > dv) {
    var payout = bet * 2;
    addBal(payout);
    setMsg(
      "warMsg",
      "Your " +
        war.p.r +
        " beats the dealer " +
        war.d.r +
        " - you won " +
        fmt(payout) +
        " fun credits" +
        (tb ? ". The tie bet of " + fmt(tb) + " is lost" : "") +
        ".",
      "win",
    );
    sfx.win();
    showWinBanner($("#scr-war"), "War Won", payout, false, "pays 1 to 1");
    pushWin("You", payout, "Casino War");
    warSettle(payout, bet + tb, " - your " + war.p.r + " beat " + war.d.r);
  } else if (pv < dv) {
    setMsg(
      "warMsg",
      "Dealer " +
        war.d.r +
        " beats your " +
        war.p.r +
        ". Your bet of " +
        fmt(bet + tb) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    sfx.lose();
    warSettle(0, bet + tb, " - dealer " + war.d.r + " beat your " + war.p.r);
  } else {
    war.phase = "war";
    var tieTxt = "";
    if (tb > 0) {
      war.tiePaid = tb * 11;
      addBal(war.tiePaid);
      tieTxt =
        " Your tie bet pays 10 to 1 - " +
        fmt(war.tiePaid) +
        " fun credits are already in your balance.";
    }
    setMsg(
      "warMsg",
      "Tie - both cards are " +
        war.p.r +
        "s!" +
        tieTxt +
        " Go to war with a matching bet of " +
        fmt(bet) +
        ", or surrender and lose half your bet (" +
        fmt(Math.ceil(bet / 2)) +
        ").",
      "info",
    );
    sfx.chip();
    warSetBtns();
    renderBal(false);
  }
});
$("#warSurrender").addEventListener("click", function () {
  if (war.phase !== "war") return;
  var back = Math.floor(war.bet / 2);
  addBal(back);
  setMsg(
    "warMsg",
    "You surrendered the war. " +
      fmt(back) +
      " fun credits come back" +
      (war.tiePaid ? ", and your tie bet already paid " + fmt(war.tiePaid) : "") +
      ". Balance: " +
      fmt(bal) +
      " fun credits.",
    "info",
  );
  sfx.coin();
  warSettle(back + war.tiePaid, war.bet + war.tieBet, " - tie on " + war.p.r + ", surrendered");
});
$("#warGo").addEventListener("click", function () {
  if (war.phase !== "war") return;
  if (bal < war.bet) {
    setMsg(
      "warMsg",
      "Going to war needs " +
        fmt(war.bet) +
        " more fun credits - your balance is " +
        fmt(bal) +
        ". Surrender instead.",
      "lose",
    );
    return;
  }
  addBal(-war.bet);
  war.p = war.shoe.pop();
  war.d = war.shoe.pop();
  warRender();
  sfx.deal();
  var pv = pkRankVal(war.p),
    dv = pkRankVal(war.d);
  var wagered = war.bet * 2 + war.tieBet;
  var fromBet = 0,
    note = "";
  if (pv > dv) {
    fromBet = war.bet * 3;
    note = " - war won on " + war.p.r + " vs " + war.d.r;
  } else if (pv === dv) {
    fromBet = war.bet * 4;
    note = " - war tied again on " + war.p.r + "s, bonus payout";
  } else note = " - war lost, " + war.d.r + " beat " + war.p.r;
  var payout = fromBet + war.tiePaid;
  if (fromBet > 0) addBal(fromBet);
  if (pv > dv) {
    setMsg(
      "warMsg",
      "War won! Your " +
        war.p.r +
        " beats the dealer " +
        war.d.r +
        " - " +
        fmt(fromBet) +
        " fun credits come back on your " +
        fmt(war.bet * 2) +
        " of war bets" +
        (war.tiePaid ? ", plus the tie bet paid " + fmt(war.tiePaid) : "") +
        ".",
      "win",
    );
    sfx.win();
    showWinBanner($("#scr-war"), "War Won", payout, false, "war pays out");
    pushWin("You", payout, "Casino War");
  } else if (pv === dv) {
    setMsg(
      "warMsg",
      "Another tie in the war - both " +
        war.p.r +
        "s! The bonus pays out " +
        fmt(fromBet) +
        " fun credits" +
        (war.tiePaid ? ", plus the tie bet paid " + fmt(war.tiePaid) : "") +
        ".",
      "win",
    );
    sfx.bigwin();
    showWinBanner($("#scr-war"), "War Tie Bonus", payout, true, "tie again pays 2 to 1");
    pushWin("You", payout, "Casino War");
  } else {
    setMsg(
      "warMsg",
      "War lost - dealer " +
        war.d.r +
        " beats your " +
        war.p.r +
        ". Your war bets of " +
        fmt(war.bet * 2) +
        " fun credits are lost" +
        (war.tiePaid ? ", but the tie bet paid " + fmt(war.tiePaid) : "") +
        ". Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    sfx.lose();
  }
  warSettle(payout, wagered, note);
});
warSetBtns();

/* ================= 31. Craps Lite ================= */
var DICE_CHARS = ["&#9856;", "&#9857;", "&#9858;", "&#9859;", "&#9860;", "&#9861;"];
var crp = { phase: "off", point: 0, bet: 0, rolling: false, rolls: [] };
function crpSettle(payout, note) {
  logHist("craps", histLine(crp.bet, payout) + note);
  recordRound("craps", crp.bet, payout);
  crp.phase = "off";
  crp.point = 0;
  $("#crpPoint").textContent = "-";
  $("#crpPhase").textContent = "Come-out";
  renderBal(payout > crp.bet);
}
$("#crpRoll").addEventListener("click", function () {
  if (crp.rolling) return;
  if (crp.phase === "off") {
    var bet = readBet($("#crpBet"));
    if (bet === null) return;
    addBal(-bet);
    crp.bet = bet;
    crp.phase = "comeout";
    crp.rolls = [];
    $("#crpHist").innerHTML = "";
    setMsg(
      "crpMsg",
      "Come-out roll for " + fmt(bet) + " fun credits. 7 or 11 wins, 2, 3 or 12 loses.",
      "info",
    );
  }
  crp.rolling = true;
  $("#crpRoll").disabled = true;
  var d1 = 1 + Math.floor(Math.random() * 6);
  var d2 = 1 + Math.floor(Math.random() * 6);
  var ticks = 0;
  var iv = setInterval(function () {
    ticks++;
    $("#crpD1").innerHTML = DICE_CHARS[Math.floor(Math.random() * 6)];
    $("#crpD2").innerHTML = DICE_CHARS[Math.floor(Math.random() * 6)];
    sfx.tick();
    if (ticks >= 6) {
      clearInterval(iv);
      $("#crpD1").innerHTML = DICE_CHARS[d1 - 1];
      $("#crpD2").innerHTML = DICE_CHARS[d2 - 1];
      var t = d1 + d2;
      $("#crpLast").textContent = t;
      crp.rolls.unshift(t);
      $("#crpHist").innerHTML = crp.rolls
        .slice(0, 10)
        .map(function (x) {
          return '<span class="histchip">' + x + "</span>";
        })
        .join("");
      crp.rolling = false;
      $("#crpRoll").disabled = false;
      if (crp.phase === "comeout") {
        if (t === 7 || t === 11) {
          var pay1 = crp.bet * 2;
          addBal(pay1);
          setMsg(
            "crpMsg",
            "Come-out " + t + " - a natural. You won " + fmt(pay1) + " fun credits.",
            "win",
          );
          sfx.win();
          showWinBanner($("#scr-craps"), "Natural " + t, pay1, false, "pays 1 to 1");
          pushWin("You", pay1, "Craps Lite");
          crpSettle(pay1, " - come-out " + t);
        } else if (t === 2 || t === 3 || t === 12) {
          setMsg(
            "crpMsg",
            "Come-out " +
              t +
              " - craps. Your bet of " +
              fmt(crp.bet) +
              " fun credits is lost. Balance: " +
              fmt(bal) +
              " fun credits.",
            "lose",
          );
          sfx.lose();
          crpSettle(0, " - come-out " + t + ", craps");
        } else {
          crp.phase = "point";
          crp.point = t;
          $("#crpPoint").textContent = t;
          $("#crpPhase").textContent = "Point is on";
          setMsg(
            "crpMsg",
            "The point is " + t + ". Roll " + t + " again before a 7 to win.",
            "info",
          );
          sfx.chip();
        }
      } else {
        if (t === crp.point) {
          var pay2 = crp.bet * 2;
          addBal(pay2);
          setMsg(
            "crpMsg",
            "You rolled the point " + t + " again - you won " + fmt(pay2) + " fun credits.",
            "win",
          );
          sfx.win();
          showWinBanner($("#scr-craps"), "Point Made", pay2, false, "pays 1 to 1");
          pushWin("You", pay2, "Craps Lite");
          crpSettle(pay2, " - point " + t + " made");
        } else if (t === 7) {
          setMsg(
            "crpMsg",
            "Seven out. The point was " +
              crp.point +
              " - your bet of " +
              fmt(crp.bet) +
              " fun credits is lost. Balance: " +
              fmt(bal) +
              " fun credits.",
            "lose",
          );
          sfx.lose();
          crpSettle(0, " - seven out, point was " + crp.point);
        } else {
          setMsg(
            "crpMsg",
            "Rolled " + t + " - no decision. The point is still " + crp.point + ". Roll again.",
            "info",
          );
          sfx.tick();
        }
      }
      renderBal(false);
    }
  }, 70);
});

/* ================= 32. Dice Poker ================= */
var dp = {
  phase: "idle",
  bet: 0,
  dice: [1, 1, 1, 1, 1],
  held: [false, false, false, false, false],
  rolling: false,
};
function dpScore(dice) {
  var counts = {};
  dice.forEach(function (v) {
    counts[v] = (counts[v] || 0) + 1;
  });
  var groups = Object.keys(counts)
    .map(function (k) {
      return { v: Number(k), n: counts[k] };
    })
    .sort(function (a, b) {
      return b.n - a.n || b.v - a.v;
    });
  var uniq = Object.keys(counts)
    .map(Number)
    .sort(function (a, b) {
      return a - b;
    });
  if (groups[0].n === 5) return { mult: 20, name: "Five of a kind" };
  if (groups[0].n === 4) return { mult: 3, name: "Four of a kind" };
  if (groups[0].n === 3 && groups[1] && groups[1].n === 2) return { mult: 1, name: "Full house" };
  if (uniq.length === 5 && (uniq.join(",") === "1,2,3,4,5" || uniq.join(",") === "2,3,4,5,6"))
    return { mult: 6, name: "Straight" };
  if (groups[0].n === 3) return { mult: 0.6, name: "Three of a kind" };
  if (groups[0].n === 2 && groups[1] && groups[1].n === 2) return { mult: 0.3, name: "Two pair" };
  if (groups[0].n === 2) return { mult: 0.2, name: "One pair" };
  return { mult: 0, name: "No hand" };
}
function dpRender() {
  var box = $("#dpDice");
  box.innerHTML = "";
  dp.dice.forEach(function (v, i) {
    var b = document.createElement("button");
    b.className = "dieface sm" + (dp.held[i] ? " held" : "");
    b.innerHTML = DICE_CHARS[v - 1];
    b.setAttribute("aria-label", "Die " + (i + 1) + ", value " + v + (dp.held[i] ? ", held" : ""));
    b.disabled = dp.phase !== "rolled";
    (function (idx, btn) {
      btn.addEventListener("click", function () {
        if (dp.phase !== "rolled") return;
        dp.held[idx] = !dp.held[idx];
        sfx.click();
        dpRender();
      });
    })(i, b);
    box.appendChild(b);
  });
  $("#dpHand").textContent = dp.phase === "idle" && !dp.bet ? "-" : dpScore(dp.dice).name;
}
$("#dpRoll").addEventListener("click", function () {
  if (dp.rolling) return;
  if (dp.phase === "idle") {
    var bet = readBet($("#dpBet"));
    if (bet === null) return;
    addBal(-bet);
    dp.bet = bet;
    dp.dice = [0, 0, 0, 0, 0].map(function () {
      return 1 + Math.floor(Math.random() * 6);
    });
    dp.held = [false, false, false, false, false];
    dp.phase = "rolled";
    sfx.chip();
    dpRender();
    $("#dpRoll").textContent = "Re-roll the rest";
    setMsg(
      "dpMsg",
      "You rolled " + dpScore(dp.dice).name + ". Tap dice to hold them, then re-roll.",
      "info",
    );
  } else {
    dp.rolling = true;
    $("#dpRoll").disabled = true;
    var ticks = 0;
    var iv = setInterval(function () {
      ticks++;
      for (var i = 0; i < 5; i++) if (!dp.held[i]) dp.dice[i] = 1 + Math.floor(Math.random() * 6);
      dpRender();
      sfx.tick();
      if (ticks >= 5) {
        clearInterval(iv);
        dp.phase = "idle";
        dp.rolling = false;
        $("#dpRoll").disabled = false;
        $("#dpRoll").textContent = "Roll dice";
        dpRender();
        var res = dpScore(dp.dice);
        var payout = Math.floor(dp.bet * res.mult);
        if (payout > 0) addBal(payout);
        logHist("dicepoker", histLine(dp.bet, payout) + " - " + res.name);
        recordRound("dicepoker", dp.bet, payout);
        if (payout > dp.bet) {
          setMsg(
            "dpMsg",
            res.name + " - you won " + fmt(payout) + " fun credits (x" + res.mult + ").",
            "win",
          );
          if (res.mult >= 6) sfx.bigwin();
          else sfx.win();
          showWinBanner($("#scr-dicepoker"), res.name, payout, res.mult >= 6, "x" + res.mult);
          pushWin("You", payout, "Dice Poker");
        } else if (payout === dp.bet && dp.bet > 0) {
          setMsg(
            "dpMsg",
            res.name + " - your bet of " + fmt(dp.bet) + " fun credits comes back.",
            "info",
          );
          sfx.coin();
        } else if (payout > 0) {
          setMsg(
            "dpMsg",
            res.name + " - " + fmt(payout) + " of your " + fmt(dp.bet) + " fun credits come back.",
            "info",
          );
          sfx.coin();
        } else {
          setMsg(
            "dpMsg",
            "No paying hand this time. Balance: " + fmt(bal) + " fun credits.",
            "lose",
          );
          sfx.lose();
        }
        renderBal(payout > dp.bet);
      }
    }, 80);
  }
});
dpRender();

/* ================= 33. Balloon Blast ================= */
var blo = { running: false, bet: 0, popAt: 0, start: 0, raf: 0, mult: 1, hist: [] };
function bloRenderHist() {
  $("#bloHist").innerHTML = blo.hist
    .map(function (h) {
      return (
        '<span class="histchip ' + (h >= 2 ? "hi" : "lo") + '">popped ' + h.toFixed(2) + "x</span>"
      );
    })
    .join("");
}
function bloDraw(m) {
  $("#bloMult").textContent = m.toFixed(2) + "x";
  var s = Math.min(2.1, 1 + (m - 1) * 0.22);
  $("#balloonEl").style.transform = "scale(" + s.toFixed(3) + ")";
}
function bloLoop() {
  if (!blo.running) return;
  var elapsed = performance.now() - blo.start;
  blo.mult = Math.exp(0.00022 * elapsed);
  if (blo.mult >= blo.popAt) {
    blo.mult = blo.popAt;
    blo.running = false;
    bloDraw(blo.mult);
    $("#bloMult").classList.add("lost");
    $("#bloMult").textContent = "Popped at " + blo.popAt.toFixed(2) + "x";
    $("#balloonEl").classList.add("popped");
    $("#balloonEl").style.transform = "scale(1.15)";
    sfx.boom();
    logHist("balloon", histLine(blo.bet, 0) + " - popped at " + blo.popAt.toFixed(2) + "x");
    recordRound("balloon", blo.bet, 0);
    setMsg(
      "bloMsg",
      "The balloon popped at " +
        blo.popAt.toFixed(2) +
        "x. Your bet of " +
        fmt(blo.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    blo.hist.unshift(blo.popAt);
    if (blo.hist.length > 10) blo.hist.pop();
    bloRenderHist();
    $("#bloStart").disabled = false;
    $("#bloCash").disabled = true;
    renderBal(false);
    return;
  }
  bloDraw(blo.mult);
  if (Math.random() < 0.25) sfx.tick();
  blo.raf = requestAnimationFrame(bloLoop);
}
$("#bloStart").addEventListener("click", function () {
  if (blo.running) return;
  var bet = readBet($("#bloBet"));
  if (bet === null) return;
  addBal(-bet);
  blo.bet = bet;
  blo.mult = 1;
  blo.popAt = crashPoint();
  blo.start = performance.now();
  blo.running = true;
  $("#bloMult").classList.remove("lost");
  $("#balloonEl").classList.remove("popped");
  $("#bloStart").disabled = true;
  $("#bloCash").disabled = false;
  setMsg("bloMsg", "The balloon is inflating. Cash out before it pops.", "info");
  sfx.coin();
  bloDraw(1);
  blo.raf = requestAnimationFrame(bloLoop);
});
$("#bloCash").addEventListener("click", function () {
  if (!blo.running) return;
  blo.running = false;
  cancelAnimationFrame(blo.raf);
  var val = Math.floor(blo.bet * blo.mult);
  addBal(val);
  logHist("balloon", histLine(blo.bet, val) + " - cashed out at " + blo.mult.toFixed(2) + "x");
  recordRound("balloon", blo.bet, val);
  blo.hist.unshift(blo.popAt);
  if (blo.hist.length > 10) blo.hist.pop();
  bloRenderHist();
  $("#bloStart").disabled = false;
  $("#bloCash").disabled = true;
  if (val > blo.bet) {
    setMsg(
      "bloMsg",
      "Cashed out at " +
        blo.mult.toFixed(2) +
        "x - you collected " +
        fmt(val) +
        " fun credits. The balloon would have popped at " +
        blo.popAt.toFixed(2) +
        "x.",
      "win",
    );
    if (blo.mult >= 5) sfx.bigwin();
    else sfx.win();
    showWinBanner($("#scr-balloon"), "Cashed Out", val, blo.mult >= 5, "x" + blo.mult.toFixed(2));
    pushWin("You", val, "Balloon Blast");
  } else {
    setMsg(
      "bloMsg",
      "Cashed out at " + blo.mult.toFixed(2) + "x - " + fmt(val) + " fun credits come back.",
      "info",
    );
    sfx.coin();
  }
  renderBal(val > blo.bet);
});

/* ================= 34. Chicken Cross ================= */
var chk = { active: false, bet: 0, lane: 0, hitLane: 0 };
function chkMult(n) {
  return Math.pow(0.97 / 0.75, n);
}
function chkRender() {
  var box = $("#chkLanes");
  box.innerHTML = "";
  for (var i = 10; i >= 1; i--) {
    var d = document.createElement("div");
    d.className =
      "lane" +
      (chk.hitLane === i
        ? " hit"
        : i <= chk.lane
          ? " done"
          : chk.active && i === chk.lane + 1
            ? " now"
            : "");
    d.innerHTML =
      '<span class="lno">Lane ' +
      i +
      "</span><span>" +
      (chk.hitLane === i
        ? "Car hit"
        : i <= chk.lane
          ? "Crossed"
          : i === chk.lane + 1 && chk.active
            ? "Next"
            : "") +
      '</span><span class="lmult">x' +
      chkMult(i).toFixed(2) +
      "</span>";
    box.appendChild(d);
  }
  $("#chkLane").textContent = chk.lane;
  $("#chkMult").textContent = "x" + (chk.lane > 0 ? chkMult(chk.lane).toFixed(2) : "1.00");
  $("#chkValue").textContent =
    chk.active && chk.lane > 0 ? fmt(Math.floor(chk.bet * chkMult(chk.lane))) : "0";
  $("#chkStart").disabled = chk.active;
  $("#chkStep").disabled = !chk.active;
  $("#chkCash").disabled = !(chk.active && chk.lane > 0);
  $("#chkCash").textContent =
    chk.active && chk.lane > 0
      ? "Cash out " + fmt(Math.floor(chk.bet * chkMult(chk.lane)))
      : "Cash out";
}
function chkFinish(val, auto) {
  chk.active = false;
  if (val > 0) addBal(val);
  logHist("chicken", histLine(chk.bet, val) + " - crossed " + chk.lane + " of 10 lanes");
  recordRound("chicken", chk.bet, val);
  if (val > chk.bet) {
    setMsg(
      "chkMsg",
      (auto
        ? "All 10 lanes crossed! "
        : "Cashed out after " + chk.lane + " lane" + (chk.lane > 1 ? "s" : "") + ". ") +
        "You collected " +
        fmt(val) +
        " fun credits at x" +
        chkMult(chk.lane).toFixed(2) +
        ".",
      "win",
    );
    if (chk.lane >= 6) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      $("#scr-chicken"),
      auto ? "Full Crossing" : "Cashed Out",
      val,
      chk.lane >= 6,
      "x" + chkMult(chk.lane).toFixed(2),
    );
    pushWin("You", val, "Chicken Cross");
  } else if (val > 0) {
    setMsg("chkMsg", "Cashed out " + fmt(val) + " fun credits.", "info");
    sfx.coin();
  }
  chkRender();
  renderBal(val > chk.bet);
}
$("#chkStart").addEventListener("click", function () {
  if (chk.active) return;
  var bet = readBet($("#chkBet"));
  if (bet === null) return;
  addBal(-bet);
  chk.bet = bet;
  chk.lane = 0;
  chk.hitLane = 0;
  chk.active = true;
  sfx.chip();
  setMsg(
    "chkMsg",
    "Crossing started. Step lane by lane - each lane has a 1 in 4 chance of a car.",
    "info",
  );
  chkRender();
});
$("#chkStep").addEventListener("click", function () {
  if (!chk.active) return;
  var next = chk.lane + 1;
  if (Math.random() < 0.25) {
    chk.hitLane = next;
    chk.active = false;
    sfx.boom();
    logHist("chicken", histLine(chk.bet, 0) + " - car hit on lane " + next);
    recordRound("chicken", chk.bet, 0);
    setMsg(
      "chkMsg",
      "A car hit on lane " +
        next +
        "! Your bet of " +
        fmt(chk.bet) +
        " fun credits is lost. Balance: " +
        fmt(bal) +
        " fun credits.",
      "lose",
    );
    chkRender();
    renderBal(false);
    return;
  }
  chk.lane = next;
  sfx.gem();
  if (chk.lane >= 10) {
    chkFinish(Math.floor(chk.bet * chkMult(10)), true);
    return;
  }
  setMsg(
    "chkMsg",
    "Lane " +
      chk.lane +
      " crossed safely. Multiplier x" +
      chkMult(chk.lane).toFixed(2) +
      " - cash out or try lane " +
      (chk.lane + 1) +
      ".",
    "info",
  );
  chkRender();
});
$("#chkCash").addEventListener("click", function () {
  if (!chk.active || chk.lane === 0) return;
  chkFinish(Math.floor(chk.bet * chkMult(chk.lane)), false);
});
chkRender();

/* ================= 35. Penalty Shootout ================= */
var pen = { active: false, busy: false, bet: 0, goals: 0 };
function penMult() {
  return Math.pow(0.97 / 0.8, pen.goals);
}
function penRender() {
  $("#penGoals").textContent = pen.goals;
  $("#penMult").textContent = "x" + (pen.goals > 0 ? penMult().toFixed(2) : "1.00");
  $("#penValue").textContent =
    pen.active && pen.goals > 0 ? fmt(Math.floor(pen.bet * penMult())) : "0";
  $$("#penZones .goalzone[data-zone]").forEach(function (b) {
    b.disabled = !(pen.active && !pen.busy);
  });
  $("#penStart").disabled = pen.active;
  $("#penCash").disabled = !(pen.active && !pen.busy && pen.goals > 0);
  $("#penCash").textContent =
    pen.active && pen.goals > 0 ? "Cash out " + fmt(Math.floor(pen.bet * penMult())) : "Cash out";
}
function penFinish(val, auto) {
  pen.active = false;
  if (val > 0) addBal(val);
  logHist(
    "penalty",
    histLine(pen.bet, val) + " - " + pen.goals + " goal" + (pen.goals === 1 ? "" : "s"),
  );
  recordRound("penalty", pen.bet, val);
  if (val > pen.bet) {
    setMsg(
      "penMsg",
      (auto
        ? "All 10 kicks scored! "
        : "Cashed out after " + pen.goals + " goal" + (pen.goals > 1 ? "s" : "") + ". ") +
        "You collected " +
        fmt(val) +
        " fun credits at x" +
        penMult().toFixed(2) +
        ".",
      "win",
    );
    if (pen.goals >= 6) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      $("#scr-penalty"),
      auto ? "Perfect Shootout" : "Cashed Out",
      val,
      pen.goals >= 6,
      "x" + penMult().toFixed(2),
    );
    pushWin("You", val, "Penalty Shootout");
  } else if (val > 0) {
    setMsg("penMsg", "Cashed out " + fmt(val) + " fun credits.", "info");
    sfx.coin();
  }
  penRender();
  renderBal(val > pen.bet);
}
$("#penStart").addEventListener("click", function () {
  if (pen.active) return;
  var bet = readBet($("#penBet"));
  if (bet === null) return;
  addBal(-bet);
  pen.bet = bet;
  pen.goals = 0;
  pen.active = true;
  pen.busy = false;
  $$("#penZones .goalzone").forEach(function (b) {
    b.classList.remove("keeper", "scored");
  });
  sfx.chip();
  setMsg("penMsg", "Shootout started. Pick a spot for your first kick.", "info");
  penRender();
});
$$("#penZones .goalzone[data-zone]").forEach(function (b) {
  b.addEventListener("click", function () {
    if (!pen.active || pen.busy) return;
    pen.busy = true;
    var zone = Number(b.getAttribute("data-zone"));
    var keeper = Math.floor(Math.random() * 5);
    var zones = $$("#penZones .goalzone[data-zone]");
    zones[keeper].classList.add("keeper");
    penRender();
    if (keeper === zone) {
      pen.active = false;
      sfx.boom();
      logHist(
        "penalty",
        histLine(pen.bet, 0) +
          " - saved on kick " +
          (pen.goals + 1) +
          " after " +
          pen.goals +
          " goal" +
          (pen.goals === 1 ? "" : "s"),
      );
      recordRound("penalty", pen.bet, 0);
      setMsg(
        "penMsg",
        "Saved! The keeper read your kick" +
          (pen.goals ? " after " + pen.goals + " goal" + (pen.goals > 1 ? "s" : "") : "") +
          ". Your bet of " +
          fmt(pen.bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "lose",
      );
      pen.busy = false;
      penRender();
      renderBal(false);
      return;
    }
    b.classList.add("scored");
    pen.goals++;
    sfx.gem();
    setTimeout(function () {
      zones.forEach(function (z) {
        z.classList.remove("keeper", "scored");
      });
      pen.busy = false;
      if (pen.goals >= 10) {
        penFinish(Math.floor(pen.bet * penMult()), true);
        return;
      }
      setMsg(
        "penMsg",
        "Goal " +
          pen.goals +
          "! Multiplier x" +
          penMult().toFixed(2) +
          " - cash out or take kick " +
          (pen.goals + 1) +
          ".",
        "info",
      );
      penRender();
    }, 620);
    penRender();
  });
});
$("#penCash").addEventListener("click", function () {
  if (!pen.active || pen.busy || pen.goals === 0) return;
  penFinish(Math.floor(pen.bet * penMult()), false);
});
penRender();

/* ================= 36. Horse Racing ================= */
var HORSES = [
  { name: "Comet", w: 0.28, color: "#f5c542" },
  { name: "Blaze", w: 0.22, color: "#19e3c2" },
  { name: "Duchess", w: 0.18, color: "#ff8b96" },
  { name: "Rocco", w: 0.14, color: "#8e6bf1" },
  { name: "Pippin", w: 0.1, color: "#59c2ff" },
  { name: "Longshot Lou", w: 0.08, color: "#ff9f43" },
];
HORSES.forEach(function (h) {
  h.odds = Math.floor((0.95 / h.w) * 100) / 100;
});
var race = { racing: false, pick: 0, bet: 0, prog: [0, 0, 0, 0, 0, 0], winner: -1, iv: 0 };
(function raceBuild() {
  $("#racePicks").innerHTML = HORSES.map(function (h, i) {
    return (
      '<button class="pickbtn' +
      (i === 0 ? " on" : "") +
      '" data-horse="' +
      i +
      '">' +
      h.name +
      " - x" +
      h.odds.toFixed(2) +
      "</button>"
    );
  }).join("");
  $("#raceTrack").innerHTML = HORSES.map(function (h, i) {
    return (
      '<div class="hrow" id="hrow' +
      i +
      '"><span class="hname">' +
      h.name +
      '</span><div class="hbar"><i id="hbar' +
      i +
      '" style="background:' +
      h.color +
      '"></i></div><span class="hodds">x' +
      h.odds.toFixed(2) +
      "</span></div>"
    );
  }).join("");
  $$("#racePicks [data-horse]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (race.racing) return;
      $$("#racePicks [data-horse]").forEach(function (x) {
        x.classList.remove("on");
      });
      b.classList.add("on");
      race.pick = Number(b.getAttribute("data-horse"));
      sfx.click();
    });
  });
})();
function raceRender() {
  HORSES.forEach(function (h, i) {
    $("#hbar" + i).style.width = Math.min(100, race.prog[i]).toFixed(1) + "%";
    $("#hrow" + i).classList.toggle("winner", race.winner === i && !race.racing);
  });
}
$("#raceStart").addEventListener("click", function () {
  if (race.racing) return;
  var bet = readBet($("#raceBet"));
  if (bet === null) return;
  addBal(-bet);
  race.bet = bet;
  race.prog = [0, 0, 0, 0, 0, 0];
  var x = Math.random(),
    acc = 0,
    winner = 0;
  for (var i = 0; i < HORSES.length; i++) {
    acc += HORSES[i].w;
    if (x <= acc) {
      winner = i;
      break;
    }
  }
  race.winner = winner;
  race.racing = true;
  $("#raceStart").disabled = true;
  sfx.chip();
  setMsg(
    "raceMsg",
    "And they are off! You backed " +
      HORSES[race.pick].name +
      " at x" +
      HORSES[race.pick].odds.toFixed(2) +
      ".",
    "info",
  );
  raceRender();
  race.iv = setInterval(function () {
    race.prog[winner] += 2.4 + Math.random() * 3.4;
    for (var j = 0; j < HORSES.length; j++) {
      if (j === winner) continue;
      race.prog[j] += Math.random() * 3.6;
      if (race.prog[j] > 99) race.prog[j] = 99;
    }
    if (Math.random() < 0.4) sfx.tick();
    raceRender();
    if (race.prog[winner] >= 100) {
      clearInterval(race.iv);
      race.prog[winner] = 100;
      race.racing = false;
      raceRender();
      var payout = race.pick === winner ? Math.floor(race.bet * HORSES[winner].odds) : 0;
      if (payout > 0) addBal(payout);
      logHist(
        "racing",
        histLine(race.bet, payout) +
          " - " +
          HORSES[winner].name +
          " won, you backed " +
          HORSES[race.pick].name,
      );
      recordRound("racing", race.bet, payout);
      if (payout > race.bet) {
        setMsg(
          "raceMsg",
          HORSES[winner].name +
            " wins the race - your bet pays x" +
            HORSES[winner].odds.toFixed(2) +
            ". You won " +
            fmt(payout) +
            " fun credits.",
          "win",
        );
        if (HORSES[winner].odds >= 6) sfx.bigwin();
        else sfx.win();
        showWinBanner(
          $("#scr-racing"),
          HORSES[winner].name + " Wins",
          payout,
          HORSES[winner].odds >= 6,
          "x" + HORSES[winner].odds.toFixed(2),
        );
        pushWin("You", payout, "Horse Racing");
      } else {
        setMsg(
          "raceMsg",
          HORSES[winner].name +
            " wins the race - your horse, " +
            HORSES[race.pick].name +
            ", did not come first. Your bet of " +
            fmt(race.bet) +
            " fun credits is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          "lose",
        );
        sfx.lose();
      }
      $("#raceStart").disabled = false;
      renderBal(payout > race.bet);
    }
  }, 110);
});

/* ================= 37. Lucky Lottery ================= */
var LOT_PAY = { 2: 1, 3: 19, 4: 275, 5: 8000, 6: 1000000 };
var lot = { picks: {}, drawing: false };
function lotRenderCount() {
  var n = Object.keys(lot.picks).length;
  $("#lotCount").textContent = n;
}
(function lotBuild() {
  var g = $("#lotGrid");
  for (var n = 1; n <= 49; n++) {
    var b = document.createElement("button");
    b.className = "lnum";
    b.textContent = n;
    b.setAttribute("data-n", n);
    (function (num, btn) {
      btn.addEventListener("click", function () {
        if (lot.drawing) return;
        if (lot.picks[num]) {
          delete lot.picks[num];
          btn.classList.remove("picked");
        } else {
          if (Object.keys(lot.picks).length >= 6) {
            setMsg(
              "lotMsg",
              "You already have 6 numbers. Tap a picked number to remove it first.",
              "info",
            );
            return;
          }
          lot.picks[num] = true;
          btn.classList.add("picked");
        }
        sfx.click();
        lotRenderCount();
      });
    })(n, b);
    g.appendChild(b);
  }
})();
$("#lotClear").addEventListener("click", function () {
  if (lot.drawing) return;
  lot.picks = {};
  $$("#lotGrid .lnum").forEach(function (b) {
    b.classList.remove("picked", "drawn", "hit");
  });
  $("#lotBalls").innerHTML = "";
  $("#lotMatch").textContent = "-";
  lotRenderCount();
  sfx.click();
});
$("#lotQuick").addEventListener("click", function () {
  if (lot.drawing) return;
  lot.picks = {};
  var pool = [];
  for (var n = 1; n <= 49; n++) pool.push(n);
  for (var i = 0; i < 6; i++) {
    var j = i + Math.floor(Math.random() * (pool.length - i));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
    lot.picks[pool[i]] = true;
  }
  $$("#lotGrid .lnum").forEach(function (b) {
    var num = Number(b.getAttribute("data-n"));
    b.classList.toggle("picked", !!lot.picks[num]);
    b.classList.remove("drawn", "hit");
  });
  $("#lotBalls").innerHTML = "";
  $("#lotMatch").textContent = "-";
  lotRenderCount();
  sfx.chip();
});
$("#lotDraw").addEventListener("click", function () {
  if (lot.drawing) return;
  var pickNums = Object.keys(lot.picks).map(Number);
  if (pickNums.length !== 6) {
    setMsg("lotMsg", "Pick exactly 6 numbers first - you have " + pickNums.length + ".", "lose");
    return;
  }
  var bet = readBet($("#lotBet"));
  if (bet === null) return;
  addBal(-bet);
  lot.drawing = true;
  $("#lotDraw").disabled = true;
  $$("#lotGrid .lnum").forEach(function (b) {
    b.classList.remove("drawn", "hit");
  });
  $("#lotBalls").innerHTML = "";
  $("#lotMatch").textContent = "0";
  var pool = [];
  for (var n = 1; n <= 49; n++) pool.push(n);
  var drawn = [];
  for (var i = 0; i < 6; i++) {
    var j = i + Math.floor(Math.random() * (pool.length - i));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
    drawn.push(pool[i]);
  }
  sfx.chip();
  setMsg("lotMsg", "Drawing your 6 lottery numbers...", "info");
  var idx = 0,
    matches = 0;
  var iv = setInterval(function () {
    if (idx >= 6) {
      clearInterval(iv);
      var mult = LOT_PAY[matches] || 0;
      var payout = Math.floor(bet * mult);
      if (payout > 0) addBal(payout);
      logHist("lottery", histLine(bet, payout) + " - " + matches + " of 6 matched");
      recordRound("lottery", bet, payout);
      if (matches >= 3) {
        setMsg(
          "lotMsg",
          "You matched " +
            matches +
            " of 6 - that pays x" +
            fmt(mult) +
            ". You won " +
            fmt(payout) +
            " fun credits.",
          "win",
        );
        if (matches >= 4) sfx.bigwin();
        else sfx.win();
        showWinBanner(
          $("#scr-lottery"),
          matches === 6 ? "Jackpot" : "Lottery Win",
          payout,
          matches >= 4,
          matches + " matches - x" + fmt(mult),
        );
        pushWin("You", payout, "Lucky Lottery");
      } else if (matches === 2) {
        setMsg(
          "lotMsg",
          "You matched 2 of 6 - your bet of " + fmt(bet) + " fun credits comes back.",
          "info",
        );
        sfx.coin();
      } else {
        setMsg(
          "lotMsg",
          "You matched " +
            matches +
            " of 6 - no prize at that level. Balance: " +
            fmt(bal) +
            " fun credits.",
          "lose",
        );
        sfx.lose();
      }
      lot.drawing = false;
      $("#lotDraw").disabled = false;
      renderBal(payout > bet);
      return;
    }
    var num = drawn[idx];
    idx++;
    var ball = document.createElement("span");
    ball.className = "drawnball";
    ball.textContent = num;
    $("#lotBalls").appendChild(ball);
    var btn = $('#lotGrid .lnum[data-n="' + num + '"]');
    if (btn) {
      btn.classList.add("drawn");
      if (lot.picks[num]) {
        btn.classList.add("hit");
        matches++;
        $("#lotMatch").textContent = matches;
        sfx.gem();
      } else sfx.tick();
    }
  }, 260);
});
lotRenderCount();

/* ================= 38. Speed Bingo ================= */
var SB_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
var sb = { active: false, bet: 0, iv: 0 };
function sbCardNums() {
  var pool = [];
  for (var n = 1; n <= 30; n++) pool.push(n);
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  return pool.slice(0, 9);
}
function sbHasLine(set) {
  for (var i = 0; i < SB_LINES.length; i++) {
    var L = SB_LINES[i];
    if (set[L[0]] && set[L[1]] && set[L[2]]) return L;
  }
  return null;
}
function sbRenderGrid(card, marked, line) {
  var g = $("#sbGrid");
  g.innerHTML = "";
  card.forEach(function (n, i) {
    var d = document.createElement("div");
    d.className =
      "bcell" + (marked[i] ? " marked" : "") + (line && line.indexOf(i) >= 0 ? " linewin" : "");
    d.textContent = n;
    g.appendChild(d);
  });
}
$("#sbStart").addEventListener("click", function () {
  if (sb.active) return;
  var bet = readBet($("#sbBet"));
  if (bet === null) return;
  addBal(-bet);
  sb.bet = bet;
  sb.active = true;
  $("#sbStart").disabled = true;
  var pc = sbCardNums(),
    a1 = sbCardNums(),
    a2 = sbCardNums();
  var pIdx = {},
    aIdx = {},
    bIdx = {};
  pc.forEach(function (n, i) {
    pIdx[n] = i;
  });
  a1.forEach(function (n, i) {
    aIdx[n] = i;
  });
  a2.forEach(function (n, i) {
    bIdx[n] = i;
  });
  var pSet = {},
    s1 = {},
    s2 = {};
  var pool = [];
  for (var n = 1; n <= 30; n++) pool.push(n);
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  sbRenderGrid(pc, pSet, null);
  $("#sbDrawn").textContent = "0";
  $("#sbAi").textContent = "0 and 0 marked";
  $("#sbLast").textContent = "-";
  $("#sbBall").textContent = "?";
  sfx.chip();
  setMsg("sbMsg", "Speed bingo is running - first line wins. Good luck.", "info");
  var drawnCount = 0;
  sb.iv = setInterval(function () {
    if (drawnCount >= pool.length) {
      clearInterval(sb.iv);
      sb.active = false;
      $("#sbStart").disabled = false;
      return;
    }
    var num = pool[drawnCount];
    drawnCount++;
    if (num in pIdx) pSet[pIdx[num]] = true;
    if (num in aIdx) s1[aIdx[num]] = true;
    if (num in bIdx) s2[bIdx[num]] = true;
    $("#sbBall").textContent = num;
    $("#sbLast").textContent = num;
    $("#sbDrawn").textContent = drawnCount;
    var c1 = Object.keys(s1).length,
      c2 = Object.keys(s2).length;
    $("#sbAi").textContent = c1 + " and " + c2 + " marked";
    var pLine = sbHasLine(pSet);
    var aLine = sbHasLine(s1) || sbHasLine(s2);
    sbRenderGrid(pc, pSet, pLine);
    sfx.tick();
    if (pLine || aLine) {
      clearInterval(sb.iv);
      sb.active = false;
      $("#sbStart").disabled = false;
      if (pLine) {
        var full = Object.keys(pSet).length === 9;
        var payout = Math.floor(sb.bet * (full ? 8 : 2.6));
        addBal(payout);
        logHist(
          "speedbingo",
          histLine(sb.bet, payout) +
            " - line after " +
            drawnCount +
            " draws" +
            (full ? ", full card" : ""),
        );
        recordRound("speedbingo", sb.bet, payout);
        setMsg(
          "sbMsg",
          "Bingo! Your line landed after " +
            drawnCount +
            " draws" +
            (full ? " with a full card" : "") +
            " - you won " +
            fmt(payout) +
            " fun credits.",
          "win",
        );
        if (full) sfx.bigwin();
        else sfx.win();
        showWinBanner(
          $("#scr-speedbingo"),
          "Bingo",
          payout,
          full,
          full ? "full card x8" : "line x2.6",
        );
        pushWin("You", payout, "Speed Bingo");
        renderBal(true);
      } else {
        logHist(
          "speedbingo",
          histLine(sb.bet, 0) + " - an AI card lined after " + drawnCount + " draws",
        );
        recordRound("speedbingo", sb.bet, 0);
        setMsg(
          "sbMsg",
          "An AI card completed a line first, after " +
            drawnCount +
            " draws. Your bet of " +
            fmt(sb.bet) +
            " fun credits is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          "lose",
        );
        sfx.lose();
        renderBal(false);
      }
    }
  }, 250);
});
sbRenderGrid([3, 11, 22, 7, 15, 28, 9, 19, 30], {}, null);

/* ================= 39. Coin Flip Streak ================= */
var cf = { active: false, busy: false, bet: 0, streak: 0 };
function cfMult() {
  return Math.pow(1.94, cf.streak);
}
function cfRender() {
  $("#cfStreak").textContent = cf.streak;
  $("#cfMult").textContent = "x" + (cf.streak > 0 ? cfMult().toFixed(2) : "1.00");
  $("#cfValue").textContent = cf.active && cf.streak > 0 ? fmt(Math.floor(cf.bet * cfMult())) : "0";
  $("#cfStart").disabled = cf.active;
  $("#cfHeads").disabled = !(cf.active && !cf.busy);
  $("#cfTails").disabled = !(cf.active && !cf.busy);
  $("#cfCash").disabled = !(cf.active && !cf.busy && cf.streak > 0);
  $("#cfCash").textContent =
    cf.active && cf.streak > 0 ? "Cash out " + fmt(Math.floor(cf.bet * cfMult())) : "Cash out";
}
function cfFinish(val, auto) {
  cf.active = false;
  if (val > 0) addBal(val);
  logHist("coinflip", histLine(cf.bet, val) + " - streak of " + cf.streak);
  recordRound("coinflip", cf.bet, val);
  if (val > cf.bet) {
    setMsg(
      "cfMsg",
      (auto
        ? "15 correct calls in a row - the streak cashes out on its own. "
        : "Cashed out with a streak of " + cf.streak + ". ") +
        "You collected " +
        fmt(val) +
        " fun credits at x" +
        cfMult().toFixed(2) +
        ".",
      "win",
    );
    if (cf.streak >= 6) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      $("#scr-coinflip"),
      auto ? "Perfect Streak" : "Cashed Out",
      val,
      cf.streak >= 6,
      "x" + cfMult().toFixed(2),
    );
    pushWin("You", val, "Coin Flip Streak");
  } else if (val > 0) {
    setMsg("cfMsg", "Cashed out " + fmt(val) + " fun credits.", "info");
    sfx.coin();
  }
  cfRender();
  renderBal(val > cf.bet);
}
function cfCall(guess) {
  if (!cf.active || cf.busy) return;
  cf.busy = true;
  cfRender();
  var result = Math.random() < 0.5 ? "H" : "T";
  var coin = $("#cfCoin");
  var ticks = 0;
  var iv = setInterval(function () {
    ticks++;
    var showH = ticks % 2 === 0;
    coin.textContent = showH ? "Heads" : "Tails";
    coin.classList.toggle("tails", !showH);
    sfx.tick();
    if (ticks >= 6) {
      clearInterval(iv);
      coin.textContent = result === "H" ? "Heads" : "Tails";
      coin.classList.toggle("tails", result === "T");
      cf.busy = false;
      if (result === guess) {
        cf.streak++;
        sfx.gem();
        if (cf.streak >= 15) {
          cfFinish(Math.floor(cf.bet * cfMult()), true);
          return;
        }
        setMsg(
          "cfMsg",
          (result === "H" ? "Heads" : "Tails") +
            " - correct! Streak " +
            cf.streak +
            ", multiplier x" +
            cfMult().toFixed(2) +
            ". Cash out or call the next flip.",
          "info",
        );
      } else {
        cf.active = false;
        sfx.lose();
        logHist("coinflip", histLine(cf.bet, 0) + " - wrong call after a streak of " + cf.streak);
        recordRound("coinflip", cf.bet, 0);
        setMsg(
          "cfMsg",
          "It landed " +
            (result === "H" ? "Heads" : "Tails") +
            " - wrong call" +
            (cf.streak ? " after a streak of " + cf.streak : "") +
            ". Your bet of " +
            fmt(cf.bet) +
            " fun credits is lost. Balance: " +
            fmt(bal) +
            " fun credits.",
          "lose",
        );
      }
      cfRender();
      renderBal(false);
    }
  }, 80);
}
$("#cfStart").addEventListener("click", function () {
  if (cf.active) return;
  var bet = readBet($("#cfBet"));
  if (bet === null) return;
  addBal(-bet);
  cf.bet = bet;
  cf.streak = 0;
  cf.active = true;
  cf.busy = false;
  $("#cfCoin").textContent = "?";
  $("#cfCoin").classList.remove("tails");
  sfx.chip();
  setMsg("cfMsg", "Streak started. Call the first flip - Heads or Tails.", "info");
  cfRender();
});
$("#cfHeads").addEventListener("click", function () {
  cfCall("H");
});
$("#cfTails").addEventListener("click", function () {
  cfCall("T");
});
$("#cfCash").addEventListener("click", function () {
  if (!cf.active || cf.busy || cf.streak === 0) return;
  cfFinish(Math.floor(cf.bet * cfMult()), false);
});
cfRender();

