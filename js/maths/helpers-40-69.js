"use strict";
/* ================= games 40-69: shared helpers ================= */
SYM_SVG.leaf = "s-clover";
SYM_SVG.jgsc = "s-bell";
SYM_SVG.cdsc = "s-pearl";
SYM_SVG.spsc = "s-rocket";
SYM_SVG.pisc = "s-scratch";
SYM_SVG.disc = "s-gem";
SYM_SVG.wssc = "s-crown";
function nxEl(id) {
  return document.getElementById(id);
}
function nxFinish(o) {
  /* o: scr, key, name, bet, payout, msg, winText, loseText, pushText, partText, note, big */
  if (o.payout > 0) addBal(o.payout);
  logHist(o.key, histLine(o.bet, o.payout) + (o.note ? " - " + o.note : ""));
  recordRound(o.key, o.bet, o.payout);
  if (o.payout > o.bet) {
    setMsg(o.msg, o.winText, "win");
    var big = !!o.big || o.payout >= o.bet * 10;
    if (big) sfx.bigwin();
    else sfx.win();
    showWinBanner(
      nxEl(o.scr),
      big ? "Big Win" : "Win",
      o.payout,
      big,
      "x" + (o.payout / Math.max(1, o.bet)).toFixed(1),
    );
    pushWin("You", o.payout, o.name);
  } else if (o.payout > 0 && o.payout === o.bet) {
    setMsg(
      o.msg,
      o.pushText || "Push - your bet of " + fmt(o.bet) + " fun credits is returned.",
      "info",
    );
    sfx.coin();
  } else if (o.payout > 0) {
    setMsg(
      o.msg,
      o.partText ||
        "You got back " + fmt(o.payout) + " of your " + fmt(o.bet) + " fun credits bet.",
      "info",
    );
    sfx.coin();
  } else {
    setMsg(o.msg, o.loseText, "lose");
    sfx.lose();
  }
  renderBal(o.payout > o.bet);
}
function nxHandHTML(hand) {
  return hand
    .map(function (c) {
      return bjCardHTML(c, false);
    })
    .join("");
}
function nxD6() {
  return 1 + Math.floor(Math.random() * 6);
}
var NXDIE = ["", "\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];
function nxPickRow(id, cb) {
  var box = nxEl(id);
  if (!box) return;
  $$(".pickbtn", box).forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".pickbtn", box).forEach(function (x) {
        x.classList.remove("on");
      });
      b.classList.add("on");
      sfx.click();
      cb(b.getAttribute("data-v"));
    });
  });
}

