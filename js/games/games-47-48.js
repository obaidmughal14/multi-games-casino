"use strict";
/* ================= 47. Pontoon ================= */
var pn = { active: false, deck: [], p: [], d: [], bet: 0 };
function pnRender(hide) {
  nxEl("pontoonPHand").innerHTML = nxHandHTML(pn.p);
  nxEl("pontoonDHand").innerHTML = pn.d
    .map(function (c) {
      return bjCardHTML(c, hide);
    })
    .join("");
  var ps = nxEl("pontoonPScore"),
    ds = nxEl("pontoonDScore");
  if (pn.p.length) {
    ps.hidden = false;
    ps.textContent = bjVal(pn.p);
  } else ps.hidden = true;
  if (pn.d.length && !hide) {
    ds.hidden = false;
    ds.textContent = bjVal(pn.d);
  } else ds.hidden = true;
}
function pnBtns(deal, hit, stand) {
  nxEl("pontoonDeal").disabled = !deal;
  nxEl("pontoonHit").disabled = !hit;
  nxEl("pontoonStand").disabled = !stand;
}
function pnEnd(payout, winText, loseText, note) {
  pn.active = false;
  pnRender(false);
  pnBtns(true, false, false);
  nxFinish({
    scr: "scr-pontoon",
    key: "pontoon",
    name: "Pontoon",
    bet: pn.bet,
    payout: payout,
    msg: "pontoonMsg",
    winText: winText,
    loseText: loseText,
    note: note,
  });
}
nxEl("pontoonDeal").addEventListener("click", function () {
  if (pn.active) return;
  var bet = readBet(nxEl("pontoonBet"));
  if (bet === null) return;
  addBal(-bet);
  pn.bet = bet;
  pn.deck = bjDeck();
  pn.p = [pn.deck.pop(), pn.deck.pop()];
  pn.d = [pn.deck.pop(), pn.deck.pop()];
  pn.active = true;
  sfx.deal();
  pnRender(true);
  if (bjVal(pn.p) === 21) {
    if (bjVal(pn.d) === 21) {
      pnEnd(
        0,
        "",
        "Both hands are Pontoon - the dealer wins ties, so your bet of " +
          fmt(pn.bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        "both Pontoon - dealer wins ties",
      );
      return;
    }
    pnEnd(
      pn.bet * 3,
      "Pontoon! Your two-card 21 pays 2 to 1 - you collect " + fmt(pn.bet * 3) + " fun credits.",
      "",
      "Pontoon pays 2 to 1",
    );
    return;
  }
  setMsg(
    "pontoonMsg",
    "Your hand is " + bjVal(pn.p) + ". Both dealer cards are hidden. Hit or stand.",
    "info",
  );
  pnBtns(false, true, true);
});
nxEl("pontoonHit").addEventListener("click", function () {
  if (!pn.active) return;
  pn.p.push(pn.deck.pop());
  sfx.deal();
  pnRender(true);
  var v = bjVal(pn.p);
  if (v > 21) {
    pnEnd(
      0,
      "",
      "Bust with " +
        v +
        ". You lose " +
        fmt(pn.bet) +
        " fun credits. Balance: " +
        fmt(bal) +
        " fun credits.",
      "bust on " + v,
    );
    return;
  }
  if (pn.p.length === 5) {
    pnEnd(
      pn.bet * 3,
      "Five-card trick! Five cards totalling " +
        v +
        " pays 2 to 1 - you collect " +
        fmt(pn.bet * 3) +
        " fun credits.",
      "",
      "five-card trick",
    );
    return;
  }
  if (v === 21) {
    pnStandPlay();
    return;
  }
  setMsg("pontoonMsg", "Your hand is " + v + ". Hit or stand.", "info");
});
function pnStandPlay() {
  pnRender(false);
  var dv = bjVal(pn.d);
  while (dv < 17) {
    pn.d.push(pn.deck.pop());
    dv = bjVal(pn.d);
    pnRender(false);
  }
  var pv = bjVal(pn.p);
  if (dv > 21) {
    pnEnd(
      pn.bet * 2,
      "Dealer busts with " + dv + ". You win - you collect " + fmt(pn.bet * 2) + " fun credits.",
      "",
      "dealer bust",
    );
    return;
  }
  if (pv > dv) {
    pnEnd(
      pn.bet * 2,
      "You win " + pv + " against " + dv + " - you collect " + fmt(pn.bet * 2) + " fun credits.",
      "",
      pv + " vs " + dv,
    );
    return;
  }
  pnEnd(
    0,
    "",
    (pv === dv
      ? "Tied at " + pv + " - the dealer wins ties in Pontoon. "
      : "Dealer wins " + dv + " against your " + pv + ". ") +
      "You lose " +
      fmt(pn.bet) +
      " fun credits. Balance: " +
      fmt(bal) +
      " fun credits.",
    pv + " vs " + dv,
  );
}
nxEl("pontoonStand").addEventListener("click", function () {
  if (pn.active) pnStandPlay();
});
pnRender(false);

/* ================= 48. Red Dog Poker ================= */
var rd = { active: false, deck: [], a: null, b: null, bet: 0 };
function rdRanks() {
  return [pkRankVal(rd.a), pkRankVal(rd.b)];
}
function rdShow(third) {
  var cards = third ? [rd.a, rd.b, third] : [rd.a, rd.b];
  nxEl("reddogHand").innerHTML = nxHandHTML(cards);
  var v = rdRanks(),
    spread = Math.abs(v[0] - v[1]) - 1;
  nxEl("reddogSpread").textContent =
    v[0] === v[1] ? "Pair" : spread <= 0 ? "Consecutive" : "Spread: " + spread;
}
function rdBtns(deal, act) {
  nxEl("reddogDeal").disabled = !deal;
  nxEl("reddogRaise").disabled = !act;
  nxEl("reddogStand").disabled = !act;
}
function rdThird() {
  if (!rd.active) return;
  rd.active = false;
  rdBtns(true, false);
  var third = rd.deck.pop();
  rdShow(third);
  var v = rdRanks(),
    tv = pkRankVal(third);
  var lo = Math.min(v[0], v[1]),
    hi = Math.max(v[0], v[1]);
  var spread = hi - lo - 1;
  var payout = 0,
    note = "third card " + third.r;
  if (tv > lo && tv < hi) {
    var mult = spread === 1 ? 5 : spread === 2 ? 4 : spread === 3 ? 2 : 1;
    payout = rd.bet + rd.bet * mult;
    note += " - between, spread " + spread + " pays " + mult + " to 1";
  }
  nxFinish({
    scr: "scr-reddog",
    key: "reddog",
    name: "Red Dog Poker",
    bet: rd.bet,
    payout: payout,
    msg: "reddogMsg",
    winText:
      "The third card landed between - spread " +
      spread +
      ". You collect " +
      fmt(payout) +
      " fun credits.",
    loseText:
      "The third card missed the spread. Your bet of " +
      fmt(rd.bet) +
      " fun credits is lost. Balance: " +
      fmt(bal) +
      " fun credits.",
    note: note,
  });
}
nxEl("reddogDeal").addEventListener("click", function () {
  if (rd.active) return;
  var bet = readBet(nxEl("reddogBet"));
  if (bet === null) return;
  addBal(-bet);
  rd.bet = bet;
  rd.deck = bjDeck();
  rd.a = rd.deck.pop();
  rd.b = rd.deck.pop();
  sfx.deal();
  rdShow(null);
  var v = rdRanks();
  if (v[0] === v[1]) {
    setMsg(
      "reddogMsg",
      "A pair. The third card is dealt at once - match the pair to win 11 to 1.",
      "info",
    );
    setTimeout(function () {
      var third = rd.deck.pop();
      rdShow(third);
      var payout = pkRankVal(third) === v[0] ? rd.bet * 12 : 0;
      nxFinish({
        scr: "scr-reddog",
        key: "reddog",
        name: "Red Dog Poker",
        bet: rd.bet,
        payout: payout,
        msg: "reddogMsg",
        winText: "Three of a kind! The pair matched - you collect " + fmt(payout) + " fun credits.",
        loseText:
          "No match for the pair. Your bet of " +
          fmt(rd.bet) +
          " fun credits is lost. Balance: " +
          fmt(bal) +
          " fun credits.",
        note: "pair, third card " + third.r,
      });
    }, 700);
    return;
  }
  if (Math.abs(v[0] - v[1]) === 1) {
    addBal(rd.bet);
    logHist("reddog", histLine(rd.bet, rd.bet) + " - consecutive cards");
    recordRound("reddog", rd.bet, rd.bet);
    setMsg(
      "reddogMsg",
      "Consecutive cards - no spread to bet on. Your bet of " +
        fmt(rd.bet) +
        " fun credits is returned.",
      "info",
    );
    sfx.coin();
    renderBal(false);
    return;
  }
  rd.active = true;
  setMsg(
    "reddogMsg",
    "Spread of " +
      (Math.abs(v[0] - v[1]) - 1) +
      ". Raise to double your bet, or stand and deal the third card.",
    "info",
  );
  rdBtns(false, true);
});
nxEl("reddogRaise").addEventListener("click", function () {
  if (!rd.active) return;
  if (bal < rd.bet) {
    setMsg("reddogMsg", "Not enough balance left to raise.", "lose");
    return;
  }
  addBal(-rd.bet);
  rd.bet *= 2;
  sfx.chip();
  setMsg(
    "reddogMsg",
    "Raised - total bet is now " + fmt(rd.bet) + " fun credits. Dealing the third card.",
    "info",
  );
  setTimeout(rdThird, 400);
});
nxEl("reddogStand").addEventListener("click", function () {
  if (rd.active) rdThird();
});

