"use strict";
/* ================= slot engine ================= */
var SYM_SVG = {
  cherry: "s-cherry",
  lemon: "s-lemon",
  grape: "s-grape",
  bell: "s-bell",
  seven: "s-seven",
  wild: "s-star",
  scatter: "s-gem",
  coin: "s-coin",
  ingot: "s-ingot",
  clover: "s-clover",
  pearl: "s-pearl",
  lantern: "s-lantern",
  goldbar: "s-ingot",
  crown: "s-crown",
  ruby: "s-ruby",
  sapphire: "s-sapphire",
  emerald: "s-emerald",
  amber: "s-amber",
  diamond: "s-diamond",
  shell: "s-pearl",
  clam: "s-coin",
  turtle: "s-fish",
  seahorse: "s-star",
  pearl: "s-gem",
  chest: "s-ingot",
  map: "s-scratch",
  scarab: "s-gem",
  ankh: "s-clover",
  eye: "s-target",
  cat: "s-pearl",
  pharaoh: "s-crown",
  sphinx: "s-star",
  pyr: "s-bell",
  melon: "s-pearl",
  plum: "s-gem",
  star: "s-star",
};
var SYM_TXT = { bar: { t: "BAR", c: "#59c2ff" }, bar2: { t: "2BAR", c: "#ff8b96" } };
function symHTML(code) {
  if (code === "blank") return '<span class="blank-sym"></span>';
  if (SYM_TXT[code])
    return (
      '<span class="symtxt" style="color:' + SYM_TXT[code].c + '">' + SYM_TXT[code].t + "</span>"
    );
  return '<svg class="sym"><use href="#' + (SYM_SVG[code] || "s-coin") + '"/></svg>';
}
function buildCells(gridEl, rows, cols) {
  gridEl.innerHTML = "";
  var cells = [];
  for (var r = 0; r < rows; r++) {
    cells.push([]);
    for (var c = 0; c < cols; c++) {
      var d = document.createElement("div");
      d.className = "cell";
      gridEl.appendChild(d);
      cells[r].push(d);
    }
  }
  return cells;
}
function pickWeighted(weights) {
  var t = 0,
    i;
  for (i = 0; i < weights.length; i++) t += weights[i][1];
  var x = Math.random() * t;
  for (i = 0; i < weights.length; i++) {
    x -= weights[i][1];
    if (x <= 0) return weights[i][0];
  }
  return weights[0][0];
}
function randomGrid(weights, rows, cols, scatterCode, maxScatter) {
  var g = [],
    sc = 0,
    r,
    c,
    s;
  for (r = 0; r < rows; r++) {
    g.push([]);
    for (c = 0; c < cols; c++) {
      s = pickWeighted(weights);
      if (s === scatterCode) {
        sc++;
        if (sc > maxScatter) s = weights[0][0];
      }
      g[r].push(s);
    }
  }
  return g;
}
function spinAnim(cells, finalGrid, weights, done) {
  var rows = cells.length,
    cols = cells[0].length,
    col = 0;
  cells.forEach(function (row) {
    row.forEach(function (c) {
      c.classList.add("spinning");
      c.classList.remove("landed");
    });
  });
  var iv = setInterval(function () {
    for (var c = 0; c < cols; c++) {
      if (c < col) continue;
      for (var r = 0; r < rows; r++) cells[r][c].innerHTML = symHTML(pickWeighted(weights));
    }
    sfx.tick();
  }, 70);
  function stopCol() {
    if (col >= cols) {
      clearInterval(iv);
      done();
      return;
    }
    for (var r = 0; r < rows; r++) {
      cells[r][col].innerHTML = symHTML(finalGrid[r][col]);
      cells[r][col].classList.remove("spinning");
      cells[r][col].classList.add("landed");
    }
    sfx.chip();
    col++;
    setTimeout(stopCol, 190);
  }
  setTimeout(stopCol, 420);
}
var PAYLINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
];
function evalLines(grid, paytable, lineBet, wildCode) {
  var total = 0,
    winCells = [],
    lineWins = [];
  PAYLINES.forEach(function (line, li) {
    var best = null;
    Object.keys(paytable).forEach(function (sym) {
      var n = 0;
      for (var c = 0; c < 5; c++) {
        var cell = grid[line[c]][c];
        if (cell === sym || cell === wildCode) n++;
        else break;
      }
      if (n >= 3) {
        var amt = paytable[sym][n - 3] * lineBet;
        if (!best || amt > best.amt) best = { sym: sym, n: n, amt: amt, line: li };
      }
    });
    if (best) {
      total += best.amt;
      lineWins.push(best);
      for (var c2 = 0; c2 < best.n; c2++) winCells.push(line[c2] + "-" + c2);
    }
  });
  return { total: total, winCells: winCells, lineWins: lineWins };
}
function markWins(cells, winCells) {
  winCells.forEach(function (k) {
    var p = k.split("-");
    cells[Number(p[0])][Number(p[1])].classList.add("win");
  });
}
function clearWins(cells) {
  cells.forEach(function (row) {
    row.forEach(function (c) {
      c.classList.remove("win");
    });
  });
}

