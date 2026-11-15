"use strict";
/* ================= mega jackpot ticker ================= */
var mega = 1248300,
  megaShown = 1248300;
setInterval(function () {
  mega += 15 + Math.floor(Math.random() * 160);
  var from = megaShown,
    to = mega;
  megaShown = mega;
  countUp($("#megaAmt"), from, to, 900);
}, 2200);

