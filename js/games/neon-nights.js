"use strict";
/* ================= Neon Nights custom slot (win re-spins) ================= */
function v2NeonSlot(cfg) {
  SYM_SVG.nnsc = "s-rocket";
  var cells = buildCells(nxEl(cfg.key + "Grid"), 3, 5);
  var weights = nxW(["seven", "bell", "gem", "ruby", "diamond"], "nnsc");
  var pay = nxPay(NX_PAY, ["seven", "bell", "gem", "ruby", "diamond"]);
  var st = { spinning: false, chain: 0, bet: 0 };
  function setG(g) {
    for (var r = 0; r < 3; r++)
      for (var c = 0; c < 5; c++) cells[r][c].innerHTML = symHTML(g[r][c]);
  }
  setG(randomGrid(weights, 3, 5, "nnsc", 2));
  function spin(isRespin) {
    if (st.spinning) return;
    var bet;
    if (isRespin) {
      bet = st.bet;
    } else {
      bet = readBet(nxEl(cfg.key + "Bet"));
      if (bet === null) return;
      if (bet % 10 !== 0) {
        bet = Math.max(10, Math.floor(bet / 10) * 10);
        nxEl(cfg.key + "Bet").value = bet;
      }
      addBal(-bet);
      st.bet = bet;
      st.chain = 0;
    }
    st.spinning = true;
    nxEl(cfg.key + "Spin").disabled = true;
    clearWins(cells);
    var g = randomGrid(weights, 3, 5, "nnsc", 5);
    spinAnim(cells, g, weights, function () {
      var res = evalLines(g, pay, bet / 10, "wild");
      var total = res.total,
        sc = 0;
      g.forEach(function (row) {
        row.forEach(function (s) {
          if (s === "nnsc") sc++;
        });
      });
      if (sc >= 3) total += bet * ({ 3: 2, 4: 5, 5: 20 }[Math.min(sc, 5)] || 0);
      markWins(cells, res.winCells);
      nxEl(cfg.key + "Win").textContent = fmt(total);
      if (total > 0) addBal(total);
      if (!isRespin) logHist(cfg.key, histLine(bet, total));
      else logHist(cfg.key, 'Re-spin - <span class="hw">won ' + fmt(total) + "</span>");
      recordRound(cfg.key, isRespin ? 0 : bet, total);
      var netWin = !isRespin ? total > bet : total > 0;
      if (netWin) {
        sfx.win();
        showWinBanner(
          nxEl(cfg.scr),
          total >= bet * 10 ? "Big Win" : "Win",
          total,
          total >= bet * 10,
          "x" + (total / Math.max(1, bet)).toFixed(1),
        );
        if (total > bet || isRespin) pushWin("You", total, cfg.name);
      }
      st.spinning = false;
      if (total > bet && st.chain < 5) {
        st.chain++;
        v2Msg(
          cfg.key,
          (isRespin ? "Re-spin win: " : "Win: ") +
            fmt(total) +
            " fun credits. A net win earns a free re-spin (" +
            st.chain +
            " of up to 5) - watch it go.",
          "win",
        );
        renderBal(netWin);
        setTimeout(function () {
          spin(true);
        }, 1100);
      } else {
        nxEl(cfg.key + "Spin").disabled = false;
        if (total > 0 && total <= bet && !isRespin)
          v2Msg(
            cfg.key,
            "You won " +
              fmt(total) +
              " fun credits back on that spin - not a net win, so no re-spin.",
            "info",
          );
        else if (!netWin)
          v2Msg(
            cfg.key,
            isRespin ? "No win on that re-spin - the chain ends." : "No win this time. Spin again.",
            "lose",
          );
        else
          v2Msg(
            cfg.key,
            "Win: " + fmt(total) + " fun credits. The re-spin chain ends at 5.",
            "win",
          );
        renderBal(netWin);
      }
    });
  }
  nxEl(cfg.key + "Spin").addEventListener("click", function () {
    spin(false);
  });
}

