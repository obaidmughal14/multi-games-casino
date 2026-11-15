"use strict";
/* ================= shared 5-card and 4-card evaluators ================= */
function nxEval5(h) {
  var vals = h.map(pkRankVal).sort(function (a, b) {
    return b - a;
  });
  var flush = h.every(function (c) {
    return c.suit === h[0].suit;
  });
  var uniq = vals.filter(function (v, i) {
    return i === 0 || v !== vals[i - 1];
  });
  var straight = false;
  if (uniq.length === 5) {
    if (vals[0] - vals[4] === 4) straight = true;
    if (vals[0] === 14 && vals[1] === 5) straight = true;
  }
  var counts = {};
  vals.forEach(function (v) {
    counts[v] = (counts[v] || 0) + 1;
  });
  var groups = Object.keys(counts)
    .map(function (k) {
      return [Number(k), counts[k]];
    })
    .sort(function (a, b) {
      return b[1] - a[1] || b[0] - a[0];
    });
  var pairRank = groups[0][1] === 2 ? groups[0][0] : 0;
  if (groups[0][1] === 4) return { cat: 7, name: "Four of a kind" };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { cat: 6, name: "Full house" };
  if (straight && flush)
    return {
      cat: vals[0] === 14 && vals[4] === 10 ? 9 : 8,
      name: vals[0] === 14 && vals[4] === 10 ? "Royal flush" : "Straight flush",
    };
  if (flush) return { cat: 5, name: "Flush" };
  if (straight) return { cat: 4, name: "Straight" };
  if (groups[0][1] === 3) return { cat: 3, name: "Three of a kind" };
  if (groups[0][1] === 2 && groups[1][1] === 2) return { cat: 2, name: "Two pair" };
  if (groups[0][1] === 2) return { cat: 1, name: "Pair", pairRank: pairRank };
  return { cat: 0, name: "High card" };
}
function nxEval4(h) {
  var vals = h.map(pkRankVal).sort(function (a, b) {
    return b - a;
  });
  var flush = h.every(function (c) {
    return c.suit === h[0].suit;
  });
  var uniq = vals.filter(function (v, i) {
    return i === 0 || v !== vals[i - 1];
  });
  var straight = false;
  if (uniq.length === 4) {
    if (vals[0] - vals[3] === 3) straight = true;
    if (vals[0] === 14 && vals[1] === 4 && vals[3] === 2) straight = true;
  }
  var counts = {};
  vals.forEach(function (v) {
    counts[v] = (counts[v] || 0) + 1;
  });
  var groups = Object.keys(counts)
    .map(function (k) {
      return [Number(k), counts[k]];
    })
    .sort(function (a, b) {
      return b[1] - a[1] || b[0] - a[0];
    });
  var key = [];
  groups.forEach(function (g) {
    for (var i = 0; i < g[1]; i++) key.push(g[0]);
  });
  var cat = 0;
  if (groups[0][1] === 4) cat = 7;
  else if (straight && flush) cat = 6;
  else if (groups[0][1] === 3) cat = 5;
  else if (flush) cat = 4;
  else if (straight) cat = 3;
  else if (groups[0][1] === 2 && groups[1][1] === 2) cat = 2;
  else if (groups[0][1] === 2) cat = 1;
  return { cat: cat, key: key, pairRank: groups[0][1] === 2 ? groups[0][0] : 0 };
}
var FC4_NAMES = {
  7: "Four of a kind",
  6: "Straight flush",
  5: "Three of a kind",
  4: "Flush",
  3: "Straight",
  2: "Two pair",
  1: "Pair",
  0: "High card",
};
function nxBest4(h5) {
  var best = null;
  for (var skip = 0; skip < 5; skip++) {
    var sub = h5.filter(function (c, i) {
      return i !== skip;
    });
    var e = nxEval4(sub);
    if (!best) best = e;
    else {
      var cmp = e.cat - best.cat;
      if (cmp === 0)
        for (var i = 0; i < 4; i++) {
          var d = (e.key[i] || 0) - (best.key[i] || 0);
          if (d) {
            cmp = d;
            break;
          }
        }
      if (cmp > 0) best = e;
    }
  }
  return best;
}

