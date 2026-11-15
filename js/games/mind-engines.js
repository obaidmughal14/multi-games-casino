"use strict";
/* ================= mind games: shared scaffold (free, no credits) ================= */
function mBestGet(key) {
  var v = parseInt(store.get(MIND_PFX + key) || "", 10);
  if (isNaN(v) || v < 0 || v > 1000000000) v = 0;
  return v;
}
function mShowBest(key, mode) {
  var b = mBestGet(key);
  var el = nxEl(key + "Best");
  if (el) el.textContent = b ? (mode === "min" ? fmt(b) + " ms" : fmt(b)) : "-";
}
function mFinish(key, score, mode) {
  score = Math.max(0, Math.floor(score || 0));
  var b = mBestGet(key);
  var better = mode === "min" ? score > 0 && (!b || score < b) : score > b;
  if (better) {
    store.set(MIND_PFX + key, String(score));
    b = score;
  }
  mShowBest(key, mode);
  var ag = nxEl(key + "Again");
  if (ag) ag.disabled = false;
  if (better && score > 0)
    showToast("New best score: <b>" + (mode === "min" ? fmt(score) + " ms" : fmt(score)) + "</b>");
  return better;
}
function mScore(key, v) {
  var el = nxEl(key + "Score");
  if (el) el.textContent = typeof v === "number" ? fmt(v) : v;
}
function mInfo(key, v) {
  var el = nxEl(key + "Info");
  if (el) el.textContent = v;
}
function mBindStart(key, fn) {
  nxEl(key + "Start").addEventListener("click", function () {
    sfx.click();
    fn();
  });
  nxEl(key + "Again").addEventListener("click", function () {
    sfx.click();
    fn();
  });
}
function mOptsRender(key, labels, cb, htmlOpts) {
  var box = nxEl(key + "Opts");
  box.innerHTML = "";
  labels.forEach(function (lab, i) {
    var b = document.createElement("button");
    b.className = "optbtn";
    if (htmlOpts && htmlOpts[i] != null) b.innerHTML = htmlOpts[i];
    else b.textContent = lab;
    b.addEventListener("click", function () {
      cb(i, b);
    });
    box.appendChild(b);
  });
  return box;
}
function mTiles(key, n, cols, labels) {
  var box = nxEl(key + "Disp");
  box.innerHTML = "";
  var grid = document.createElement("div");
  grid.className = "tiles";
  grid.style.gridTemplateColumns = "repeat(" + cols + ",1fr)";
  grid.style.width = "100%";
  grid.style.maxWidth = "430px";
  var tiles = [];
  for (var i = 0; i < n; i++) {
    var t = document.createElement("button");
    t.className = "tile face";
    if (labels && labels[i] != null) t.textContent = labels[i];
    grid.appendChild(t);
    tiles.push(t);
  }
  box.appendChild(grid);
  return tiles;
}
/* quiz engine: one engine for maths, words, logic and focus question games */
function mQuiz(cfg) {
  var st = { active: false, score: 0, round: 0, time: 0, iv: 0, cur: null, lock: false };
  function finish() {
    st.active = false;
    if (st.iv) v2ClearOne(st.iv);
    mInfo(cfg.key, "Done");
    v2Msg(
      cfg.key,
      "Finished - your score is " +
        fmt(st.score) +
        ". " +
        (cfg.endNote || "") +
        " Free brain training, no credits used.",
      "win",
    );
    nxEl(cfg.key + "Opts").innerHTML = "";
    mFinish(cfg.key, st.score, cfg.bestMode);
  }
  function next() {
    if (!st.active) return;
    if (cfg.mode === "rounds" && st.round > cfg.rounds) {
      finish();
      return;
    }
    st.lock = false;
    st.cur = cfg.gen(st.round, st.score);
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var q = document.createElement("div");
    q.className = "bigq";
    q.textContent = st.cur.q;
    if (st.cur.qColor) q.style.color = st.cur.qColor;
    disp.appendChild(q);
    if (st.cur.sub) {
      var s = document.createElement("div");
      s.className = "nxsub";
      s.textContent = st.cur.sub;
      disp.appendChild(s);
    }
    mInfo(
      cfg.key,
      cfg.mode === "sprint" ? st.time + "s left" : "Round " + st.round + " of " + cfg.rounds,
    );
    mOptsRender(
      cfg.key,
      st.cur.options,
      function (i, btn) {
        if (!st.active || st.lock) return;
        st.lock = true;
        var pts = st.cur.pts ? st.cur.pts[i] || 0 : i === st.cur.answer ? cfg.pv || 1 : 0;
        st.score += pts;
        mScore(cfg.key, st.score);
        $$(".optbtn", nxEl(cfg.key + "Opts")).forEach(function (b, bi) {
          b.disabled = true;
          if (bi === st.cur.answer) b.classList.add("good");
          else if (bi === i && pts <= 0) b.classList.add("bad");
        });
        if (pts > 0) sfx.gem();
        else if (i !== st.cur.answer) sfx.lose();
        v2After(function () {
          st.round++;
          next();
        }, 480);
      },
      st.cur.optionsHTML,
    );
    if (cfg.styleOpts) cfg.styleOpts(nxEl(cfg.key + "Opts"), st.cur);
  }
  function start() {
    if (st.iv) v2ClearOne(st.iv);
    st.score = 0;
    st.round = 1;
    st.active = true;
    st.time = cfg.secs || 0;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, cfg.startNote || "Go - answer as fast as you can.", "info");
    if (cfg.mode === "sprint") {
      st.iv = v2Every(function () {
        st.time--;
        mInfo(cfg.key, Math.max(0, st.time) + "s left");
        if (st.time <= 0) finish();
      }, 1000);
    }
    next();
  }
  mBindStart(cfg.key, start);
  mShowBest(cfg.key, cfg.bestMode);
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function qOpts(ans, distract) {
  var opts = distract.slice();
  var pos = v2Rand(0, opts.length);
  opts.splice(pos, 0, ans);
  return { options: opts.map(String), answer: pos };
}
function gAdd(r) {
  var mx = 15 + r * 6;
  var a = v2Rand(3, mx),
    b = v2Rand(3, mx);
  var o = qOpts(a + b, [a + b + 1, a + b - 2, a + b + 10]);
  return { q: a + " + " + b + " = ?", options: o.options, answer: o.answer };
}
function gSub(r) {
  var mx = 20 + r * 7;
  var a = v2Rand(8, mx),
    b = v2Rand(2, a - 1);
  var o = qOpts(a - b, [a - b + 2, a - b - 3, a - b + 10]);
  return { q: a + " - " + b + " = ?", options: o.options, answer: o.answer };
}
function gMul(r) {
  var a = v2Rand(2, 9 + Math.min(6, r)),
    b = v2Rand(2, 12);
  var o = qOpts(a * b, [a * b + a, a * b - b, a * b + 10]);
  return { q: a + " x " + b + " = ?", options: o.options, answer: o.answer };
}
function gMulTable() {
  var sel = document.getElementById("mtableSel");
  var t = sel ? Number(sel.value) || 7 : v2Rand(2, 12);
  var b = v2Rand(2, 12);
  var o = qOpts(t * b, [t * b + t, t * b - t, t * b + 5]);
  return {
    q: t + " x " + b + " = ?",
    sub: "Times table: " + t,
    options: o.options,
    answer: o.answer,
  };
}
function gDiv() {
  var b = v2Rand(2, 12),
    ans = v2Rand(2, 12);
  var a = b * ans;
  var o = qOpts(ans, [ans + 1, ans - 1, ans + 3]);
  return { q: a + " / " + b + " = ?", options: o.options, answer: o.answer };
}
function gMix(r) {
  var kinds = [gAdd, gSub, gMul, gDiv];
  return kinds[v2Rand(0, 3)](r + 2);
}
function gBonds(r) {
  var target = r % 2 ? 100 : 10;
  var a = v2Rand(1, target - 1);
  var ans = target - a;
  var o = qOpts(ans, [ans + 1, ans - 2, ans + 10]);
  return { q: a + " + ? = " + target, options: o.options, answer: o.answer };
}
function gEstimate() {
  var kind = Math.random() < 0.5;
  var a = v2Rand(24, 96),
    b = v2Rand(15, 88);
  var exact = kind ? a + b : a * Math.round(b / 10);
  var q = kind ? "Estimate " + a + " + " + b : "Estimate " + a + " x " + Math.round(b / 10);
  var cands = [exact, exact + 7, exact - 9, exact + 18];
  var ranked = cands.slice().sort(function (x, y) {
    return Math.abs(x - exact) - Math.abs(y - exact);
  });
  var ptsMap = {};
  ranked.forEach(function (v, i) {
    ptsMap[v] = [10, 5, 2, 0][i];
  });
  var opts = v2Shuffle(cands.slice());
  return {
    q: q,
    sub: "Closest estimate scores 10, next 5, then 2",
    options: opts.map(String),
    answer: opts.indexOf(exact),
    pts: opts.map(function (v) {
      return ptsMap[v];
    }),
  };
}
function gOddNum() {
  var types = [
    function () {
      var base = v2Rand(1, 20) * 2;
      return { list: [base, base + 2, base + 4, base + 7], odd: 3, why: "All are even except one" };
    },
    function () {
      var base = v2Rand(1, 9) * 3;
      return {
        list: [base, base + 3, base + 8, base + 6],
        odd: 2,
        why: "All are multiples of 3 except one",
      };
    },
    function () {
      return { list: [4, 9, 15, 16], odd: 2, why: "All are square numbers except one" };
    },
    function () {
      var base = v2Rand(2, 30);
      return {
        list: [base + 1, base + 3, base + 5, base + 6],
        odd: 3,
        why: "All are odd except one",
      };
    },
  ];
  var t = v2Pick(types)();
  var order = v2Shuffle([0, 1, 2, 3]);
  var opts = order.map(function (i) {
    return t.list[i];
  });
  return {
    q: "Which number breaks the pattern?",
    sub: t.why,
    options: opts.map(String),
    answer: order.indexOf(t.odd),
  };
}
function gPattern() {
  var kind = v2Rand(0, 2),
    start = v2Rand(2, 15),
    step = v2Rand(2, 9);
  var seq = [],
    v = start;
  for (var i = 0; i < 4; i++) {
    seq.push(v);
    v = kind === 2 ? (v * step) % 500 : v + step + (kind === 1 ? i * 2 : 0);
  }
  var o = qOpts(v, [v + step, v - step, v + 1]);
  return {
    q: seq.join(", ") + ", ?",
    sub: "Find the next number",
    options: o.options,
    answer: o.answer,
  };
}
function gGreater() {
  var a = v2Rand(12, 90),
    b = v2Rand(12, 90);
  if (a === b) b += 3;
  var useSum = Math.random() < 0.5;
  var left = useSum ? a + " + " + v2Rand(2, 20) : String(a);
  var lv = useSum ? a + Number(left.split("+ ")[1]) : a;
  var right = String(b),
    rv = b;
  return { q: "Which is bigger?", options: [left, right], answer: lv > rv ? 0 : 1 };
}
function gFraction() {
  function fr() {
    var d = v2Pick([2, 3, 4, 5, 6, 8]);
    var n = v2Rand(1, d - 1);
    return [n, d];
  }
  var f1 = fr(),
    f2 = fr();
  if (f1[0] / f1[1] === f2[0] / f2[1]) f2 = [f2[0] + 1 <= f2[1] - 1 ? f2[0] + 1 : f2[0], f2[1]];
  var bigger = f1[0] / f1[1] > f2[0] / f2[1] ? 0 : 1;
  var html = [f1, f2].map(function (f) {
    return (
      "<div>" +
      f[0] +
      " / " +
      f[1] +
      '</div><div class="fracwrap"><div class="fracbar" style="width:' +
      Math.round((f[0] / f[1]) * 100) +
      '%"></div></div>'
    );
  });
  return {
    q: "Which fraction is larger?",
    options: [f1[0] + "/" + f1[1], f2[0] + "/" + f2[1]],
    optionsHTML: html,
    answer: bigger,
  };
}
var SHAPES = ["▲", "●", "■", "★", "◆", "♥", "♠", "♣", "♦", "⬟"];
function gOddShape() {
  var round = ["●", "♥", "⬟"],
    straight = ["▲", "■", "◆"];
  var useRound = Math.random() < 0.5;
  var fam = useRound ? round : straight,
    odd = useRound ? v2Pick(straight) : v2Pick(round);
  var opts = v2Shuffle([fam[0], fam[1], fam[2], odd]);
  return { q: "Which shape does not belong?", options: opts, answer: opts.indexOf(odd) };
}
function gPatternLogic() {
  var a = v2Pick(SHAPES),
    b = v2Pick(
      SHAPES.filter(function (s) {
        return s !== a;
      }),
    );
  var kinds = [
    [a, b, a, b, a],
    [a, a, b, a, a],
    [a, b, b, a, b],
  ];
  var seq = v2Pick(kinds);
  var expected = b;
  var opts = v2Shuffle([a, b]);
  return {
    q: seq.join(" ") + " ?",
    sub: "What comes next in the pattern?",
    options: opts,
    answer: opts.indexOf(expected),
  };
}
var MATCHSTICK = [
  {
    q: "6 + 4 = 5 - move 1 match to fix it",
    options: ["6 + 4 = 10", "9 - 4 = 5", "6 - 4 = 2", "0 + 4 = 5"],
    answer: 0,
  },
  {
    q: "3 + 5 = 9 - move 1 match to fix it",
    options: ["3 + 5 = 8", "9 - 5 = 4", "3 + 6 = 9", "5 + 5 = 9"],
    answer: 0,
  },
  {
    q: "8 - 3 = 9 - move 1 match to fix it",
    options: ["8 - 3 = 5", "9 - 3 = 6", "8 - 9 = 3", "6 + 3 = 9"],
    answer: 0,
  },
  {
    q: "1 + 2 = 8 - move 1 match to fix it",
    options: ["7 - 2 = 5", "1 + 2 = 3", "4 + 2 = 6", "1 + 7 = 8"],
    answer: 1,
  },
  {
    q: "5 + 5 = 6 - move 1 match to fix it",
    options: ["5 + 5 = 10", "9 - 5 = 4", "5 + 1 = 6", "6 - 5 = 1"],
    answer: 0,
  },
  {
    q: "9 - 4 = 3 - move 1 match to fix it",
    options: ["9 - 4 = 5", "8 - 4 = 4", "9 - 6 = 3", "3 + 4 = 7"],
    answer: 0,
  },
];
function gMatchstick(r) {
  var p = MATCHSTICK[(r - 1) % MATCHSTICK.length];
  var order = v2Shuffle([0, 1, 2, 3]);
  return {
    q: p.q,
    sub: "Pick the fixed equation",
    options: order.map(function (i) {
      return p.options[i];
    }),
    answer: order.indexOf(p.answer),
  };
}
var RHYMES = [
  { w: "CAT", opts: ["Hat", "Dog", "Sun", "Fish"], a: 0 },
  { w: "LIGHT", opts: ["Lamp", "Night", "Dark", "Glow"], a: 1 },
  { w: "CAKE", opts: ["Bread", "Pie", "Lake", "Oven"], a: 2 },
  { w: "STAR", opts: ["Moon", "Sky", "Car", "Night"], a: 2 },
  { w: "BLUE", opts: ["Red", "True", "Dark", "Sky"], a: 1 },
  { w: "SING", opts: ["Dance", "Song", "Ring", "Loud"], a: 2 },
  { w: "BOAT", opts: ["Sail", "Coat", "Sea", "Wave"], a: 1 },
  { w: "TREE", opts: ["Leaf", "Free", "Green", "Tall"], a: 1 },
  { w: "MOON", opts: ["Star", "Night", "Soon", "Dark"], a: 2 },
  { w: "PLAY", opts: ["Game", "Day", "Ball", "Fun"], a: 1 },
];
function gRhyme(r) {
  var p = RHYMES[(r - 1) % RHYMES.length];
  var order = v2Shuffle([0, 1, 2, 3]);
  return {
    q: "Which word rhymes with " + p.w + "?",
    options: order.map(function (i) {
      return p.opts[i];
    }),
    answer: order.indexOf(p.a),
  };
}
var OPPOSITES = [
  { w: "HOT", opts: ["Warm", "Cold", "Dry", "Soft"], a: 1 },
  { w: "BEGIN", opts: ["Start", "Open", "End", "Go"], a: 2 },
  { w: "BRIGHT", opts: ["Shiny", "Dim", "Clear", "Bold"], a: 1 },
  { w: "ANCIENT", opts: ["Old", "Modern", "Past", "Stone"], a: 1 },
  { w: "BRAVE", opts: ["Bold", "Strong", "Afraid", "Proud"], a: 2 },
  { w: "EMPTY", opts: ["Bare", "Full", "Open", "Wide"], a: 1 },
  { w: "VICTORY", opts: ["Prize", "Defeat", "Glory", "Match"], a: 1 },
  { w: "ARRIVE", opts: ["Reach", "Come", "Depart", "Enter"], a: 2 },
  { w: "GENERous", opts: ["Kind", "Greedy", "Giving", "Warm"], a: 1 },
  { w: "FREQUENT", opts: ["Often", "Rare", "Daily", "Usual"], a: 1 },
];
function gOpposite(r) {
  var p = OPPOSITES[(r - 1) % OPPOSITES.length];
  var order = v2Shuffle([0, 1, 2, 3]);
  return {
    q: "What is the opposite of " + p.w.toLowerCase() + "?",
    options: order.map(function (i) {
      return p.opts[i];
    }),
    answer: order.indexOf(p.a),
  };
}
var SPELLING = [
  { opts: ["Beautiful", "Beautifel", "Beautyful"], a: 0 },
  { opts: ["Tomorow", "Tomorrow", "Tommorow"], a: 1 },
  { opts: ["Necessary", "Neccessary", "Necesary"], a: 0 },
  { opts: ["Freind", "Friend", "Frend"], a: 1 },
  { opts: ["Separate", "Seperate", "Separete"], a: 0 },
  { opts: ["Goverment", "Govarnment", "Government"], a: 2 },
  { opts: ["Calender", "Calendar", "Calandar"], a: 1 },
  { opts: ["Occured", "Occurred", "Ocurred"], a: 1 },
  { opts: ["Rhythm", "Rythm", "Rhythym"], a: 0 },
  { opts: ["Definately", "Definitly", "Definitely"], a: 2 },
];
function gSpelling(r) {
  var p = SPELLING[(r - 1) % SPELLING.length];
  var order = v2Shuffle([0, 1, 2]);
  return {
    q: "Which spelling is correct?",
    options: order.map(function (i) {
      return p.opts[i];
    }),
    answer: order.indexOf(p.a),
  };
}
var CATWORDS = [
  {
    cats: ["Animal", "Food"],
    items: [
      ["Tiger", 0],
      ["Bread", 1],
      ["Eagle", 0],
      ["Pasta", 1],
      ["Horse", 0],
      ["Cheese", 1],
      ["Frog", 0],
      ["Salad", 1],
      ["Whale", 0],
      ["Honey", 1],
    ],
  },
  {
    cats: ["Vehicle", "Clothing"],
    items: [
      ["Train", 0],
      ["Jacket", 1],
      ["Boat", 0],
      ["Scarf", 1],
      ["Truck", 0],
      ["Gloves", 1],
      ["Plane", 0],
      ["Shorts", 1],
      ["Cycle", 0],
      ["Boots", 1],
    ],
  },
];
function gCategory(r) {
  var set = CATWORDS[Math.floor((r - 1) / 10) % CATWORDS.length];
  var item = set.items[(r - 1) % set.items.length];
  return { q: "Which group does " + item[0] + " belong to?", options: set.cats, answer: item[1] };
}
function gSameDiff() {
  function pat() {
    var s = "";
    for (var i = 0; i < 5; i++) s += v2Pick(SHAPES);
    return s;
  }
  var a = pat(),
    b = Math.random() < 0.5 ? a : pat();
  if (b !== a && Math.random() < 0.4) {
    var arr = a.split("");
    arr[v2Rand(0, 4)] = v2Pick(SHAPES);
    b = arr.join("");
  }
  return {
    q: a + "  vs  " + b,
    sub: "Are the two patterns the same or different?",
    options: ["Same", "Different"],
    answer: a === b ? 0 : 1,
  };
}
var COLOURS = [
  ["Red", "#e33"],
  ["Blue", "#39f"],
  ["Green", "#2c5"],
  ["Yellow", "#fc3"],
  ["Purple", "#a5f"],
  ["Orange", "#f83"],
];
function gStroop() {
  var word = v2Pick(COLOURS);
  var ink = v2Pick(
    COLOURS.filter(function (c) {
      return c[0] !== word[0];
    }),
  );
  var names = COLOURS.map(function (c) {
    return c[0];
  });
  return {
    q: word[0],
    qColor: ink[1],
    sub: "Tap the INK colour, not the word",
    options: names,
    answer: names.indexOf(ink[0]),
    inkName: ink[0],
  };
}

/* ================= mind games: memory engines ================= */
function mPairs(cfg) {
  var st = {
    active: false,
    first: -1,
    lock: false,
    matched: 0,
    moves: 0,
    secs: 0,
    iv: 0,
    tiles: [],
    vals: [],
  };
  function finish() {
    st.active = false;
    if (st.iv) v2ClearOne(st.iv);
    var score = cfg.timed
      ? st.matched * 100 + Math.max(0, st.secs) * 10
      : Math.max(10, cfg.pairs * 220 - st.moves * 10 - st.secs * 5);
    if (!cfg.timed) score = Math.max(10, cfg.pairs * 220 - st.moves * 10 - st.secs * 5);
    if (cfg.timed && st.matched < cfg.pairs) score = st.matched * 100;
    mScore(cfg.key, score);
    v2Msg(
      cfg.key,
      "Finished - " +
        st.matched +
        " of " +
        cfg.pairs +
        " pairs in " +
        st.moves +
        " moves. Score: " +
        fmt(score) +
        ". Free brain training, no credits used.",
      "win",
    );
    mFinish(cfg.key, score, "max");
  }
  function start() {
    if (st.iv) v2ClearOne(st.iv);
    var syms = SHAPES.concat(["☀", "☾", "⚑", "✿"]).slice(0, cfg.pairs);
    st.vals = v2Shuffle(syms.concat(syms));
    st.matched = 0;
    st.moves = 0;
    st.first = -1;
    st.lock = false;
    st.active = true;
    st.secs = cfg.timed ? cfg.secs : 0;
    mScore(cfg.key, 0);
    st.tiles = mTiles(
      cfg.key,
      cfg.pairs * 2,
      4,
      st.vals.map(function () {
        return "?";
      }),
    );
    st.tiles.forEach(function (t, i) {
      t.addEventListener("click", function () {
        if (!st.active || st.lock || t.disabled) return;
        t.textContent = st.vals[i];
        t.classList.add("on");
        sfx.tick();
        if (st.first < 0) {
          st.first = i;
          return;
        }
        st.moves++;
        var f = st.first;
        st.first = -1;
        if (st.vals[f] === st.vals[i]) {
          st.tiles[f].disabled = true;
          t.disabled = true;
          st.tiles[f].classList.add("good");
          t.classList.add("good");
          st.matched++;
          mScore(
            cfg.key,
            cfg.timed
              ? st.matched * 100
              : Math.max(0, cfg.pairs * 220 - st.moves * 10 - (cfg.timed ? 0 : st.secs * 5)),
          );
          if (st.matched >= cfg.pairs) finish();
        } else {
          st.lock = true;
          v2After(function () {
            st.tiles[f].textContent = "?";
            t.textContent = "?";
            st.tiles[f].classList.remove("on");
            t.classList.remove("on");
            st.lock = false;
          }, 650);
        }
      });
    });
    st.iv = v2Every(function () {
      if (cfg.timed) {
        st.secs--;
        mInfo(
          cfg.key,
          Math.max(0, st.secs) + "s left - " + st.matched + "/" + cfg.pairs + " pairs",
        );
        if (st.secs <= 0) finish();
      } else {
        st.secs++;
        mInfo(cfg.key, st.secs + "s - " + st.moves + " moves");
      }
    }, 1000);
    v2Msg(cfg.key, "Find all " + cfg.pairs + " pairs. Tap two cards at a time.", "info");
  }
  mBindStart(cfg.key, start);
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mSequence(cfg) {
  var COLORS = [
    ["Red", "#c22737"],
    ["Blue", "#2563eb"],
    ["Green", "#1d9e57"],
    ["Yellow", "#d9a521"],
  ];
  var st = { active: false, seq: [], input: [], showing: false, tiles: [] };
  function renderTiles() {
    var box = nxEl(cfg.key + "Disp");
    box.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "tiles";
    grid.style.gridTemplateColumns = "repeat(2,1fr)";
    grid.style.maxWidth = "300px";
    grid.style.width = "100%";
    st.tiles = COLORS.map(function (c, i) {
      var t = document.createElement("button");
      t.className = "tile";
      t.style.background = c[1];
      t.style.minHeight = "64px";
      t.textContent = c[0];
      t.style.color = "#fff";
      t.style.fontWeight = "800";
      t.addEventListener("click", function () {
        if (!st.active || st.showing) return;
        flash(i, 180);
        st.input.push(i);
        var idx = st.input.length - 1;
        if (st.input[idx] !== st.seq[idx]) {
          endGame();
          return;
        }
        if (st.input.length === st.seq.length) {
          var score = st.seq.length * 100;
          mScore(cfg.key, score);
          v2Msg(cfg.key, "Correct - the sequence grows. Watch the next one.", "win");
          st.showing = true;
          v2After(function () {
            st.seq.push(v2Rand(0, 3));
            st.input = [];
            showSeq();
          }, 800);
        }
      });
      grid.appendChild(t);
      return t;
    });
    box.appendChild(grid);
  }
  function flash(i, ms) {
    var t = st.tiles[i];
    t.classList.add("lit");
    sfx.tick();
    v2After(function () {
      t.classList.remove("lit");
    }, ms || 420);
  }
  function showSeq() {
    st.showing = true;
    mInfo(cfg.key, "Round " + st.seq.length + " - watch");
    st.seq.forEach(function (v, i) {
      v2After(
        function () {
          flash(v);
          if (i === st.seq.length - 1)
            v2After(function () {
              st.showing = false;
              mInfo(cfg.key, "Round " + st.seq.length + " - your turn");
            }, 500);
        },
        350 + i * 620,
      );
    });
  }
  function endGame() {
    st.active = false;
    var score = (st.seq.length - 1) * 100;
    mScore(cfg.key, Math.max(0, score));
    v2Msg(
      cfg.key,
      "Wrong tile - you reached a sequence of " +
        st.seq.length +
        ". Score: " +
        fmt(Math.max(0, score)) +
        ". Free brain training, no credits used.",
      "lose",
    );
    nxEl(cfg.key + "Opts").innerHTML = "";
    mFinish(cfg.key, Math.max(0, score), "max");
  }
  function start() {
    st.seq = [v2Rand(0, 3)];
    st.input = [];
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    renderTiles();
    v2Msg(cfg.key, "Watch the colours light up, then repeat the pattern.", "info");
    showSeq();
  }
  if (cfg.colours) {
    mBindStart(cfg.key, start);
    mShowBest(cfg.key, "max");
    nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
    return;
  }
  /* grid sequence variant: 3x3 tiles light in order */
  var st2 = { active: false, seq: [], input: [], showing: false, tiles: [] };
  function render9() {
    st2.tiles = mTiles(cfg.key, 9, 3, ["", "", "", "", "", "", "", "", ""]);
    st2.tiles.forEach(function (t, i) {
      t.addEventListener("click", function () {
        if (!st2.active || st2.showing) return;
        t.classList.add("lit");
        sfx.tick();
        v2After(function () {
          t.classList.remove("lit");
        }, 200);
        st2.input.push(i);
        var idx = st2.input.length - 1;
        if (st2.input[idx] !== st2.seq[idx]) {
          end2();
          return;
        }
        if (st2.input.length === st2.seq.length) {
          mScore(cfg.key, st2.seq.length * 100);
          st2.showing = true;
          v2After(function () {
            st2.seq.push(v2Rand(0, 8));
            st2.input = [];
            show2();
          }, 800);
        }
      });
    });
  }
  function show2() {
    st2.showing = true;
    mInfo(cfg.key, "Round " + st2.seq.length + " - watch");
    st2.seq.forEach(function (v, i) {
      v2After(
        function () {
          st2.tiles[v].classList.add("lit");
          sfx.tick();
          v2After(function () {
            st2.tiles[v].classList.remove("lit");
          }, 400);
          if (i === st2.seq.length - 1)
            v2After(function () {
              st2.showing = false;
              mInfo(cfg.key, "Round " + st2.seq.length + " - your turn");
            }, 480);
        },
        300 + i * 600,
      );
    });
  }
  function end2() {
    st2.active = false;
    var score = (st2.seq.length - 1) * 100;
    mScore(cfg.key, Math.max(0, score));
    v2Msg(
      cfg.key,
      "Wrong tile - you reached a sequence of " +
        st2.seq.length +
        ". Score: " +
        fmt(Math.max(0, score)) +
        ". Free brain training, no credits used.",
      "lose",
    );
    mFinish(cfg.key, Math.max(0, score), "max");
  }
  mBindStart(cfg.key, function () {
    st2.seq = [v2Rand(0, 8)];
    st2.input = [];
    st2.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    render9();
    v2Msg(cfg.key, "Watch the tiles light in order, then tap them back in the same order.", "info");
    show2();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mGridMemory(cfg) {
  var st = { active: false, round: 0, score: 0, lit: [], picked: [] };
  function roundStart() {
    st.round++;
    var k = Math.min(3 + st.round - 1, 10);
    st.lit = v2Shuffle(
      Array.from({ length: 25 }, function (_, i) {
        return i;
      }),
    ).slice(0, k);
    st.picked = [];
    var tiles = mTiles(cfg.key, 25, 5, []);
    tiles.forEach(function (t, i) {
      if (st.lit.indexOf(i) >= 0) t.classList.add("lit");
      t.disabled = true;
    });
    mInfo(cfg.key, "Round " + st.round + " - remember " + k + " cells");
    v2After(function () {
      tiles.forEach(function (t, i) {
        t.classList.remove("lit");
        t.disabled = false;
        t.addEventListener("click", function () {
          if (!st.active || t.disabled) return;
          t.disabled = true;
          var good = st.lit.indexOf(i) >= 0;
          t.classList.add(good ? "good" : "bad");
          st.picked.push(i);
          if (st.picked.length >= k) {
            var correct = st.picked.filter(function (p) {
              return st.lit.indexOf(p) >= 0;
            }).length;
            var pts = correct * 50 - (k - correct) * 25;
            st.score += Math.max(0, pts);
            mScore(cfg.key, st.score);
            if (correct < k * 0.6 || st.round >= 6) {
              st.active = false;
              v2Msg(
                cfg.key,
                "Game over - you scored " +
                  fmt(st.score) +
                  " over " +
                  st.round +
                  " rounds. Free brain training, no credits used.",
                "win",
              );
              mFinish(cfg.key, st.score, "max");
            } else {
              v2Msg(
                cfg.key,
                "Round " +
                  st.round +
                  " done: " +
                  correct +
                  " of " +
                  k +
                  " cells right. Next round has more cells.",
                "win",
              );
              v2After(roundStart, 900);
            }
          }
        });
      });
    }, 1400);
  }
  mBindStart(cfg.key, function () {
    st.score = 0;
    st.round = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, "Cells light up briefly - tap the same cells when they hide.", "info");
    roundStart();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mNumberMemory(cfg) {
  var st = { active: false, len: 3, score: 0, num: "" };
  function round() {
    st.num = "";
    for (var i = 0; i < st.len; i++) st.num += v2Rand(0, 9);
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var d = document.createElement("div");
    d.className = "bigq";
    d.textContent = st.num;
    disp.appendChild(d);
    mInfo(cfg.key, st.len + " digits - remember them");
    nxEl(cfg.key + "Opts").innerHTML = "";
    var inp = nxEl(cfg.key + "Input");
    inp.value = "";
    inp.disabled = true;
    v2After(
      function () {
        d.textContent = "?".repeat(st.len);
        inp.disabled = false;
        inp.focus();
        mInfo(cfg.key, "Type the number back");
      },
      900 + st.len * 450,
    );
  }
  function submit() {
    if (!st.active) return;
    var inp = nxEl(cfg.key + "Input");
    var val = inp.value.replace(/\D/g, "");
    if (val === st.num) {
      st.score += st.len * 10;
      mScore(cfg.key, st.score);
      st.len++;
      v2Msg(cfg.key, "Correct - one more digit next round.", "win");
      v2After(round, 700);
    } else {
      st.active = false;
      v2Msg(
        cfg.key,
        "The number was " +
          st.num +
          " - you reached " +
          st.len +
          " digits. Score: " +
          fmt(st.score) +
          ". Free brain training, no credits used.",
        "lose",
      );
      mFinish(cfg.key, st.score, "max");
    }
  }
  nxEl(cfg.key + "Go").addEventListener("click", submit);
  nxEl(cfg.key + "Input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") submit();
  });
  mBindStart(cfg.key, function () {
    st.len = 3;
    st.score = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, "A number shows briefly. Type it back exactly.", "info");
    round();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mPictureMemory(cfg) {
  var st = { active: false, round: 0, score: 0, changed: -1, tiles: [], vals: [] };
  function round() {
    st.round++;
    if (st.round > 8) {
      st.active = false;
      v2Msg(
        cfg.key,
        "All 8 rounds done - score " + fmt(st.score) + ". Free brain training, no credits used.",
        "win",
      );
      mFinish(cfg.key, st.score, "max");
      return;
    }
    st.vals = [];
    for (var i = 0; i < 16; i++) st.vals.push(v2Pick(SHAPES));
    st.tiles = mTiles(cfg.key, 16, 4, st.vals);
    st.tiles.forEach(function (t) {
      t.disabled = true;
    });
    mInfo(cfg.key, "Round " + st.round + " of 8 - study the grid");
    v2After(function () {
      st.changed = v2Rand(0, 15);
      var old = st.vals[st.changed];
      var nv = v2Pick(
        SHAPES.filter(function (s) {
          return s !== old;
        }),
      );
      st.vals[st.changed] = nv;
      st.tiles[st.changed].textContent = nv;
      mInfo(cfg.key, "Round " + st.round + " - tap the symbol that changed");
      st.tiles.forEach(function (t, i) {
        t.disabled = false;
        t.addEventListener("click", function () {
          if (!st.active) return;
          if (i === st.changed) {
            st.score += 125;
            sfx.gem();
            t.classList.add("good");
          } else {
            sfx.lose();
            t.classList.add("bad");
            st.tiles[st.changed].classList.add("good");
          }
          mScore(cfg.key, st.score);
          st.tiles.forEach(function (x) {
            x.disabled = true;
          });
          v2After(round, 800);
        });
      });
    }, 3200);
  }
  mBindStart(cfg.key, function () {
    st.round = 0;
    st.score = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, "Study the grid - then find the one symbol that changed.", "info");
    round();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mCardTrail(cfg) {
  var CARDS = [
    ["A", "♠"],
    ["K", "♥"],
    ["Q", "♦"],
    ["J", "♣"],
    ["10", "♠"],
    ["9", "♥"],
  ];
  var st = { active: false, len: 3, score: 0, order: [], input: [] };
  function renderCards() {
    var tiles = mTiles(
      cfg.key,
      6,
      6,
      CARDS.map(function (c) {
        return c[0] + c[1];
      }),
    );
    tiles.forEach(function (t) {
      t.style.minHeight = "58px";
      t.style.fontSize = "1rem";
    });
    return tiles;
  }
  function round() {
    st.order = v2Shuffle([0, 1, 2, 3, 4, 5]).slice(0, st.len);
    st.input = [];
    var tiles = renderCards();
    tiles.forEach(function (t) {
      t.disabled = true;
    });
    mInfo(cfg.key, "Watch " + st.len + " cards flash in order");
    st.order.forEach(function (ci, i) {
      v2After(
        function () {
          tiles[ci].classList.add("lit");
          sfx.tick();
          v2After(function () {
            tiles[ci].classList.remove("lit");
          }, 420);
          if (i === st.order.length - 1)
            v2After(function () {
              mInfo(cfg.key, "Tap the cards in the same order");
              tiles.forEach(function (t, ti) {
                t.disabled = false;
                t.addEventListener("click", function () {
                  if (!st.active) return;
                  st.input.push(ti);
                  t.classList.add("on");
                  var idx = st.input.length - 1;
                  if (st.input[idx] !== st.order[idx]) {
                    st.active = false;
                    v2Msg(
                      cfg.key,
                      "Wrong order - you reached length " +
                        st.len +
                        ". Score: " +
                        fmt(st.score) +
                        ". Free brain training, no credits used.",
                      "lose",
                    );
                    mFinish(cfg.key, st.score, "max");
                    return;
                  }
                  if (st.input.length === st.order.length) {
                    st.score += st.len * 50;
                    mScore(cfg.key, st.score);
                    st.len = Math.min(6, st.len + 1);
                    v2Msg(cfg.key, "Correct order - the trail grows.", "win");
                    v2After(round, 800);
                  }
                });
              });
            }, 520);
        },
        300 + i * 650,
      );
    });
  }
  mBindStart(cfg.key, function () {
    st.len = 3;
    st.score = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, "Cards flash in an order - tap them back in the same order.", "info");
    round();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
var WORDBANK = [
  "apple",
  "bridge",
  "candle",
  "desert",
  "engine",
  "forest",
  "garden",
  "harbor",
  "island",
  "jungle",
  "kitten",
  "ladder",
  "market",
  "needle",
  "orange",
  "pencil",
  "queen",
  "river",
  "sunset",
  "temple",
  "umbrella",
  "village",
  "window",
  "yellow",
  "zebra",
  "anchor",
  "basket",
  "camera",
  "dolphin",
  "eagle",
];
function mWordMemory(cfg) {
  var st = { active: false, round: 0, score: 0, seen: [], picked: {} };
  function round() {
    st.round++;
    if (st.round > 3) {
      st.active = false;
      v2Msg(
        cfg.key,
        "All 3 rounds done - score " + fmt(st.score) + ". Free brain training, no credits used.",
        "win",
      );
      mFinish(cfg.key, st.score, "max");
      return;
    }
    st.seen = v2Shuffle(WORDBANK.slice()).slice(0, 6);
    st.picked = {};
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var d = document.createElement("div");
    d.className = "bigq";
    d.style.fontSize = "1.3rem";
    d.textContent = st.seen.join("   ");
    disp.appendChild(d);
    nxEl(cfg.key + "Opts").innerHTML = "";
    mInfo(cfg.key, "Round " + st.round + " of 3 - study these 6 words");
    v2After(function () {
      var extra = v2Shuffle(
        WORDBANK.filter(function (w) {
          return st.seen.indexOf(w) < 0;
        }),
      ).slice(0, 6);
      var all = v2Shuffle(st.seen.concat(extra));
      mTiles(cfg.key, 12, 3, all);
      var tiles = $$(".tile", nxEl(cfg.key + "Disp"));
      tiles.forEach(function (t) {
        t.style.fontSize = "0.95rem";
        t.addEventListener("click", function () {
          var w = t.textContent;
          if (st.picked[w]) {
            delete st.picked[w];
            t.classList.remove("on");
          } else {
            st.picked[w] = true;
            t.classList.add("on");
          }
          sfx.click();
        });
      });
      mInfo(cfg.key, "Tap the 6 words you saw, then press Check");
      mOptsRender(cfg.key, ["Check my picks"], function () {
        var correct = Object.keys(st.picked).filter(function (w) {
          return st.seen.indexOf(w) >= 0;
        }).length;
        var wrong = Object.keys(st.picked).length - correct;
        var pts = correct * 50 - wrong * 25;
        st.score += Math.max(0, pts);
        mScore(cfg.key, st.score);
        v2Msg(
          cfg.key,
          "You found " + correct + " of 6 seen words with " + wrong + " wrong picks.",
          correct >= 5 ? "win" : "info",
        );
        v2After(round, 1000);
      });
    }, 4000);
  }
  mBindStart(cfg.key, function () {
    st.round = 0;
    st.score = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, "Study the word list, then pick those words from a bigger list.", "info");
    round();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mMissingSymbol(cfg) {
  var st = { active: false, round: 0, score: 0 };
  function round() {
    st.round++;
    if (st.round > 8) {
      st.active = false;
      v2Msg(
        cfg.key,
        "All 8 rounds done - score " + fmt(st.score) + ". Free brain training, no credits used.",
        "win",
      );
      mFinish(cfg.key, st.score, "max");
      return;
    }
    var set = v2Shuffle(SHAPES.slice()).slice(0, 8);
    var tiles = mTiles(cfg.key, 8, 4, set);
    tiles.forEach(function (t) {
      t.disabled = true;
    });
    nxEl(cfg.key + "Opts").innerHTML = "";
    mInfo(cfg.key, "Round " + st.round + " of 8 - study the set");
    v2After(function () {
      var missIdx = v2Rand(0, 7);
      var missing = set[missIdx];
      tiles[missIdx].textContent = "";
      tiles[missIdx].classList.add("dim");
      var opts = v2Shuffle(
        [missing].concat(
          v2Shuffle(
            SHAPES.filter(function (s) {
              return set.indexOf(s) < 0;
            }),
          ).slice(0, 3),
        ),
      );
      mInfo(cfg.key, "Which symbol vanished?");
      mOptsRender(cfg.key, opts, function (i, btn) {
        if (opts[i] === missing) {
          st.score += 100;
          sfx.gem();
          btn.classList.add("good");
        } else {
          sfx.lose();
          btn.classList.add("bad");
        }
        mScore(cfg.key, st.score);
        $$(".optbtn", nxEl(cfg.key + "Opts")).forEach(function (b) {
          b.disabled = true;
        });
        tiles[missIdx].textContent = missing;
        tiles[missIdx].classList.remove("dim");
        v2After(round, 800);
      });
    }, 3000);
  }
  mBindStart(cfg.key, function () {
    st.round = 0;
    st.score = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, "Study the symbols - one will vanish. Pick the missing one.", "info");
    round();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}

/* ================= mind games: word engines ================= */
var SCRAMBLE = [
  ["GARDEN", "Where plants grow"],
  ["PLANET", "Earth is one"],
  ["BRIDGE", "Crosses a river"],
  ["CANDLE", "Wax with a flame"],
  ["MARKET", "Place to buy goods"],
  ["WINDOW", "Glass in a wall"],
  ["ORANGE", "A fruit and a colour"],
  ["TEMPLE", "Place of worship"],
  ["SILVER", "A grey metal"],
  ["JUNGLE", "Dense wild forest"],
  ["PUZZLE", "A brain teaser"],
  ["ROCKET", "Flies to space"],
  ["CASTLE", "A king lives here"],
  ["DOLPHIN", "A clever sea animal"],
  ["HARVEST", "Gathering crops"],
  ["LANTERN", "A portable light"],
  ["MYSTERY", "Something unknown"],
  ["JOURNEY", "A long trip"],
  ["CAPTAIN", "Leads a ship"],
  ["DIAMOND", "A hard bright gem"],
];
function mScramble(cfg) {
  var st = { active: false, round: 0, score: 0, word: "", hintUsed: false };
  function round() {
    st.round++;
    if (st.round > 10) {
      st.active = false;
      v2Msg(
        cfg.key,
        "All 10 words done - score " + fmt(st.score) + ". Free brain training, no credits used.",
        "win",
      );
      mFinish(cfg.key, st.score, "max");
      return;
    }
    var item = SCRAMBLE[(st.round - 1) % SCRAMBLE.length];
    st.word = item[0];
    st.hintUsed = false;
    var scr = v2Shuffle(item[0].split("")).join("");
    if (scr === st.word) scr = st.word.split("").reverse().join("");
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var d = document.createElement("div");
    d.className = "bigq";
    d.textContent = scr;
    disp.appendChild(d);
    var h = document.createElement("div");
    h.className = "nxsub";
    h.id = cfg.key + "Hint";
    h.textContent = "Hint costs 5 points - tap Hint if stuck";
    disp.appendChild(h);
    mInfo(cfg.key, "Word " + st.round + " of 10");
    var inp = nxEl(cfg.key + "Input");
    inp.value = "";
    inp.disabled = false;
    mOptsRender(cfg.key, ["Hint"], function () {
      st.hintUsed = true;
      nxEl(cfg.key + "Hint").textContent = "Hint: " + item[1];
    });
  }
  function submit() {
    if (!st.active) return;
    var val = nxEl(cfg.key + "Input")
      .value.trim()
      .toUpperCase();
    if (!val) return;
    if (val === st.word) {
      st.score += st.hintUsed ? 5 : 10;
      mScore(cfg.key, st.score);
      sfx.gem();
      v2Msg(cfg.key, "Correct - the word was " + st.word + ".", "win");
      v2After(round, 650);
    } else {
      sfx.lose();
      v2Msg(cfg.key, "Not quite - try again, or use the hint.", "lose");
    }
  }
  nxEl(cfg.key + "Go").addEventListener("click", submit);
  nxEl(cfg.key + "Input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") submit();
  });
  mBindStart(cfg.key, function () {
    st.round = 0;
    st.score = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, "Unscramble each word and type your answer.", "info");
    round();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
var HANGWORDS = [
  ["ELEPHANT", "A huge grey animal"],
  ["COMPUTER", "You are using one now"],
  ["RAINBOW", "Colours after rain"],
  ["BICYCLE", "Two wheels and pedals"],
  ["LIBRARY", "Full of books"],
  ["MOUNTAIN", "Very tall land"],
  ["SANDWICH", "Filling between bread"],
  ["TELESCOPE", "For looking at stars"],
];
function mHangman(cfg) {
  var st = { active: false, word: "", hint: "", guessed: {}, wrong: 0, total: 0, wi: 0 };
  function renderWord() {
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var d = document.createElement("div");
    d.className = "bigq";
    d.textContent = st.word
      .split("")
      .map(function (ch) {
        return st.guessed[ch] ? ch : "_";
      })
      .join(" ");
    disp.appendChild(d);
    var h = document.createElement("div");
    h.className = "nxsub";
    h.textContent = "Hint: " + st.hint + " - wrong guesses left: " + (6 - st.wrong);
    disp.appendChild(h);
  }
  function renderLetters() {
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    var box = nxEl(cfg.key + "Opts");
    box.innerHTML = "";
    letters.forEach(function (ch) {
      var b = document.createElement("button");
      b.className = "optbtn";
      b.textContent = ch;
      b.style.padding = "8px 10px";
      b.style.minWidth = "42px";
      if (st.guessed[ch]) b.disabled = true;
      b.addEventListener("click", function () {
        if (!st.active || st.guessed[ch]) return;
        st.guessed[ch] = true;
        b.disabled = true;
        if (st.word.indexOf(ch) < 0) {
          st.wrong++;
          sfx.lose();
          b.classList.add("bad");
        } else sfx.gem();
        renderWord();
        var done = st.word.split("").every(function (c) {
          return st.guessed[c];
        });
        if (done) {
          var pts = 100 + (6 - st.wrong) * 20;
          st.total += pts;
          mScore(cfg.key, st.total);
          v2Msg(
            cfg.key,
            "You got " + st.word + " with " + st.wrong + " wrong guesses - " + pts + " points.",
            "win",
          );
          st.wi++;
          if (st.wi >= 3) {
            st.active = false;
            v2Msg(
              cfg.key,
              "Three words done - total score " +
                fmt(st.total) +
                ". Free brain training, no credits used.",
              "win",
            );
            mFinish(cfg.key, st.total, "max");
          } else
            v2After(function () {
              nextWord();
            }, 900);
        } else if (st.wrong >= 6) {
          st.active = false;
          v2Msg(
            cfg.key,
            "Out of guesses - the word was " +
              st.word +
              ". Score: " +
              fmt(st.total) +
              ". Free brain training, no credits used.",
            "lose",
          );
          mFinish(cfg.key, st.total, "max");
        }
      });
      box.appendChild(b);
    });
  }
  function nextWord() {
    var item = HANGWORDS[st.wi % HANGWORDS.length];
    st.word = item[0];
    st.hint = item[1];
    st.guessed = {};
    st.wrong = 0;
    mInfo(cfg.key, "Word " + (st.wi + 1) + " of 3");
    renderWord();
    renderLetters();
  }
  mBindStart(cfg.key, function () {
    st.total = 0;
    st.wi = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, "Guess the word letter by letter - 6 wrong guesses end the game.", "info");
    nextWord();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mWordSearch(cfg) {
  var WORDS = ["CAT", "SUN", "TREE", "FISH", "BIRD", "STAR", "MOON", "CAKE", "BOAT", "LION"];
  var st = { active: false, grid: [], placed: [], found: 0, startSel: -1, secs: 0, iv: 0 };
  function build() {
    var size = 8;
    st.grid = [];
    for (var i = 0; i < size * size; i++)
      st.grid.push(v2Pick("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")));
    st.placed = [];
    var owner = {};
    var chosen = v2Shuffle(WORDS.slice()).slice(0, 5);
    chosen.forEach(function (w, wi) {
      for (var tries = 0; tries < 60; tries++) {
        var horiz = wi < 3;
        var r = v2Rand(0, 7),
          c = v2Rand(0, 7);
        if (horiz && c + w.length > 8) continue;
        if (!horiz && r + w.length > 8) continue;
        var cells = [];
        for (var k = 0; k < w.length; k++) cells.push(horiz ? r * 8 + c + k : (r + k) * 8 + c);
        var clash = cells.some(function (x, k) {
          return owner[x] && owner[x] !== w[k];
        });
        if (clash) continue;
        cells.forEach(function (x, xi) {
          st.grid[x] = w[xi];
          owner[x] = w[xi];
        });
        st.placed.push({ word: w, cells: cells, done: false });
        break;
      }
    });
    st.placed = st.placed.filter(function (p) {
      return p.cells.length;
    });
  }
  function render() {
    var tiles = mTiles(cfg.key, 64, 8, st.grid);
    tiles.forEach(function (t, i) {
      t.style.minHeight = "38px";
      t.style.minWidth = "0";
      t.style.fontSize = "0.95rem";
      t.addEventListener("click", function () {
        if (!st.active) return;
        if (st.startSel < 0) {
          st.startSel = i;
          t.classList.add("on");
          return;
        }
        var a = st.startSel,
          b = i;
        st.startSel = -1;
        tiles.forEach(function (x) {
          x.classList.remove("on");
        });
        var match = null;
        st.placed.forEach(function (p) {
          if (p.done) return;
          var cells = p.cells;
          if (
            (cells[0] === a && cells[cells.length - 1] === b) ||
            (cells[0] === b && cells[cells.length - 1] === a)
          )
            match = p;
        });
        if (match) {
          match.done = true;
          match.cells.forEach(function (x) {
            tiles[x].classList.add("good");
            tiles[x].disabled = true;
          });
          st.found++;
          sfx.gem();
          mInfo(
            cfg.key,
            "Found " +
              st.found +
              " of " +
              st.placed.length +
              ": " +
              st.placed
                .filter(function (p) {
                  return p.done;
                })
                .map(function (p) {
                  return p.word;
                })
                .join(", "),
          );
          if (st.found >= st.placed.length) {
            st.active = false;
            if (st.iv) v2ClearOne(st.iv);
            var score = 500 + Math.max(0, 180 - st.secs) * 2;
            mScore(cfg.key, score);
            v2Msg(
              cfg.key,
              "All words found in " +
                st.secs +
                " seconds - score " +
                fmt(score) +
                ". Free brain training, no credits used.",
              "win",
            );
            mFinish(cfg.key, score, "max");
          }
        } else sfx.lose();
      });
    });
    var list = document.createElement("div");
    list.className = "nxsub";
    list.textContent =
      "Find: " +
      st.placed
        .map(function (p) {
          return p.word;
        })
        .join(", ");
    nxEl(cfg.key + "Disp").appendChild(list);
  }
  mBindStart(cfg.key, function () {
    if (st.iv) v2ClearOne(st.iv);
    build();
    st.found = 0;
    st.startSel = -1;
    st.secs = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    render();
    st.iv = v2Every(function () {
      st.secs++;
    }, 1000);
    v2Msg(
      cfg.key,
      "Tap the first letter of a word, then its last letter. Words run right or down.",
      "info",
    );
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
var ANAGRAM_SETS = [
  {
    letters: "LISTEN",
    words: [
      "LISTEN",
      "SILENT",
      "ENLIST",
      "IN",
      "IT",
      "TEN",
      "NET",
      "SIT",
      "SET",
      "TIN",
      "LIE",
      "LINE",
      "LENS",
      "NEST",
      "SITE",
      "TIES",
      "ISLE",
      "LINT",
      "SLIT",
      "NIL",
      "SIN",
      "LET",
      "ELM",
    ],
  },
  {
    letters: "MASTER",
    words: [
      "MASTER",
      "STREAM",
      "IN",
      "IT",
      "TEA",
      "EAT",
      "ATE",
      "SAT",
      "RAT",
      "ART",
      "ARM",
      "RAM",
      "TEAR",
      "RATE",
      "MARS",
      "STAR",
      "TSAR",
      "REST",
      "TEAM",
      "MEAT",
      "MARE",
      "REMA",
    ],
  },
  {
    letters: "GARDEN",
    words: [
      "GARDEN",
      "DANGER",
      "IN",
      "IT",
      "AND",
      "AGE",
      "RED",
      "EAR",
      "ARE",
      "RAN",
      "DEN",
      "END",
      "RANGE",
      "GRAND",
      "GRADE",
      "DEAR",
      "READ",
      "NEAR",
      "RAGE",
      "GEAR",
      "AGED",
    ],
  },
];
function mAnagram(cfg) {
  var st = { active: false, set: null, used: {}, score: 0, time: 60, iv: 0 };
  function submit() {
    if (!st.active) return;
    var inp = nxEl(cfg.key + "Input");
    var val = inp.value.trim().toUpperCase();
    inp.value = "";
    if (!val) return;
    if (st.used[val]) {
      v2Msg(cfg.key, "You already used that word.", "info");
      return;
    }
    if (st.set.words.indexOf(val) >= 0) {
      st.used[val] = true;
      st.score += val.length * 10;
      mScore(cfg.key, st.score);
      sfx.gem();
      v2Msg(
        cfg.key,
        val +
          " is worth " +
          val.length * 10 +
          " points. Words found: " +
          Object.keys(st.used).length,
        "win",
      );
    } else {
      sfx.lose();
      v2Msg(cfg.key, val + " is not in the word list for these letters.", "lose");
    }
  }
  nxEl(cfg.key + "Go").addEventListener("click", submit);
  nxEl(cfg.key + "Input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") submit();
  });
  mBindStart(cfg.key, function () {
    if (st.iv) v2ClearOne(st.iv);
    st.set = v2Pick(ANAGRAM_SETS);
    st.used = {};
    st.score = 0;
    st.time = 60;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var d = document.createElement("div");
    d.className = "bigq";
    d.textContent = st.set.letters.split("").join(" ");
    disp.appendChild(d);
    var s = document.createElement("div");
    s.className = "nxsub";
    s.textContent = "Make words of 2 or more letters from these letters - 60 seconds";
    disp.appendChild(s);
    nxEl(cfg.key + "Input").disabled = false;
    st.iv = v2Every(function () {
      st.time--;
      mInfo(cfg.key, Math.max(0, st.time) + "s left");
      if (st.time <= 0) {
        st.active = false;
        v2ClearOne(st.iv);
        nxEl(cfg.key + "Input").disabled = true;
        v2Msg(
          cfg.key,
          "Time up - you found " +
            Object.keys(st.used).length +
            " words for " +
            fmt(st.score) +
            " points. Free brain training, no credits used.",
          "win",
        );
        mFinish(cfg.key, st.score, "max");
      }
    }, 1000);
    v2Msg(cfg.key, "Type a word and press Add word. Longer words score more.", "info");
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
/* ================= mind games: logic and puzzle engines ================= */
function mSudoku(cfg) {
  var n = cfg.size,
    boxR = 2,
    boxC = cfg.size === 4 ? 2 : 3;
  var st = { active: false, sol: [], givens: {}, secs: 0, iv: 0, errors: 0 };
  function solve(grid) {
    var idx = grid.indexOf(0);
    if (idx < 0) return true;
    var r = Math.floor(idx / n),
      c = idx % n;
    var used = {};
    for (var i = 0; i < n; i++) {
      used[grid[r * n + i]] = 1;
      used[grid[i * n + c]] = 1;
    }
    var br = Math.floor(r / boxR) * boxR,
      bc = Math.floor(c / boxC) * boxC;
    for (var dr = 0; dr < boxR; dr++)
      for (var dc = 0; dc < boxC; dc++) used[grid[(br + dr) * n + bc + dc]] = 1;
    var nums = v2Shuffle([1, 2, 3, 4, 5, 6].slice(0, n));
    for (var k = 0; k < nums.length; k++) {
      if (!used[nums[k]]) {
        grid[idx] = nums[k];
        if (solve(grid)) return true;
        grid[idx] = 0;
      }
    }
    return false;
  }
  function validValue(grid, idx, v) {
    var r = Math.floor(idx / n),
      c = idx % n;
    for (var i = 0; i < n; i++) {
      if (i !== c && grid[r * n + i] === v) return false;
      if (i !== r && grid[i * n + c] === v) return false;
    }
    var br = Math.floor(r / boxR) * boxR,
      bc = Math.floor(c / boxC) * boxC;
    for (var dr = 0; dr < boxR; dr++)
      for (var dc = 0; dc < boxC; dc++) {
        var j = (br + dr) * n + bc + dc;
        if (j !== idx && grid[j] === v) return false;
      }
    return true;
  }
  function start() {
    if (st.iv) v2ClearOne(st.iv);
    var grid = new Array(n * n).fill(0);
    solve(grid);
    st.sol = grid.slice();
    var remove = n === 4 ? 7 : 14;
    var cells = v2Shuffle(
      Array.from({ length: n * n }, function (_, i) {
        return i;
      }),
    );
    st.givens = {};
    for (var i = 0; i < n * n; i++) st.givens[i] = true;
    cells.slice(0, remove).forEach(function (i) {
      delete st.givens[i];
    });
    st.secs = 0;
    st.errors = 0;
    st.active = true;
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var g = document.createElement("div");
    g.className = "sudgrid";
    g.style.gridTemplateColumns = "repeat(" + n + ",44px)";
    for (var j = 0; j < n * n; j++) {
      var inp = document.createElement("input");
      inp.setAttribute("inputmode", "numeric");
      inp.maxLength = 1;
      inp.id = cfg.key + "C" + j;
      if (st.givens[j]) {
        inp.value = st.sol[j];
        inp.disabled = true;
        inp.className = "given";
      }
      g.appendChild(inp);
    }
    disp.appendChild(g);
    st.iv = v2Every(function () {
      st.secs++;
      mInfo(cfg.key, st.secs + "s");
    }, 1000);
    mOptsRender(cfg.key, ["Check my grid"], function () {
      if (!st.active) return;
      var vals = [],
        ok = true;
      for (var j2 = 0; j2 < n * n; j2++) {
        var el = nxEl(cfg.key + "C" + j2);
        var v = parseInt(el.value, 10);
        if (isNaN(v) || v < 1 || v > n) {
          ok = false;
          el.classList.add("err");
          vals.push(0);
        } else {
          el.classList.remove("err");
          vals.push(v);
        }
      }
      if (ok) {
        for (var j3 = 0; j3 < n * n; j3++)
          if (!validValue(vals, j3, vals[j3])) {
            ok = false;
            nxEl(cfg.key + "C" + j3).classList.add("err");
          }
      }
      if (ok) {
        st.active = false;
        v2ClearOne(st.iv);
        var score = Math.max(50, 1000 - st.errors * 40 - st.secs);
        mScore(cfg.key, score);
        v2Msg(
          cfg.key,
          "Solved correctly in " +
            st.secs +
            " seconds - score " +
            fmt(score) +
            ". Free brain training, no credits used.",
          "win",
        );
        mFinish(cfg.key, score, "max");
      } else {
        st.errors++;
        sfx.lose();
        v2Msg(
          cfg.key,
          "Some cells are wrong or empty - the red ones need a look. Errors so far: " + st.errors,
          "lose",
        );
      }
    });
    v2Msg(
      cfg.key,
      "Fill every row, column and box with 1 to " + n + ". Gold cells are given.",
      "info",
    );
  }
  mBindStart(cfg.key, start);
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mLogicGrid(cfg) {
  var PEOPLE = ["Anna", "Ben", "Cara"],
    PETS = ["Cat", "Dog", "Fish"];
  var st = { active: false, sol: {}, clues: [], secs: 0, iv: 0, checks: 0 };
  function satisfies(assign, clue) {
    if (clue.type === "is") return assign[clue.person] === clue.pet;
    return assign[clue.person] !== clue.pet;
  }
  function start() {
    if (st.iv) v2ClearOne(st.iv);
    var perm = v2Shuffle(PETS.slice());
    st.sol = {};
    PEOPLE.forEach(function (p, i) {
      st.sol[p] = perm[i];
    });
    var trues = [];
    PEOPLE.forEach(function (p) {
      trues.push({ type: "is", person: p, pet: st.sol[p] });
      PETS.forEach(function (pet) {
        if (pet !== st.sol[p]) trues.push({ type: "not", person: p, pet: pet });
      });
    });
    st.clues = [];
    var guard = 0;
    while (guard++ < 40) {
      var sols = 0;
      var perms = [
        [0, 1, 2],
        [0, 2, 1],
        [1, 0, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0],
      ];
      perms.forEach(function (pm) {
        var a = {};
        PEOPLE.forEach(function (p, i) {
          a[p] = PETS[pm[i]];
        });
        if (
          st.clues.every(function (c) {
            return satisfies(a, c);
          })
        )
          sols++;
      });
      if (sols === 1 && st.clues.length >= 2) break;
      var c = v2Pick(trues);
      if (
        !st.clues.some(function (x) {
          return x.type === c.type && x.person === c.person && x.pet === c.pet;
        })
      )
        st.clues.push(c);
    }
    st.secs = 0;
    st.checks = 0;
    st.active = true;
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var cl = document.createElement("div");
    cl.style.textAlign = "left";
    cl.innerHTML = st.clues
      .map(function (c) {
        return (
          "<div>Clue: " +
          c.person +
          (c.type === "is" ? " has the " : " does not have the ") +
          c.pet.toLowerCase() +
          ".</div>"
        );
      })
      .join("");
    disp.appendChild(cl);
    PEOPLE.forEach(function (p) {
      var row = document.createElement("div");
      row.style.marginTop = "8px";
      var lab = document.createElement("span");
      lab.textContent = p + " has the: ";
      var sel = document.createElement("select");
      sel.id = cfg.key + "Sel" + p;
      sel.style.minHeight = "44px";
      PETS.forEach(function (pet) {
        var o = document.createElement("option");
        o.value = pet;
        o.textContent = pet;
        sel.appendChild(o);
      });
      row.appendChild(lab);
      row.appendChild(sel);
      disp.appendChild(row);
    });
    st.iv = v2Every(function () {
      st.secs++;
      mInfo(cfg.key, st.secs + "s");
    }, 1000);
    mOptsRender(cfg.key, ["Check my answer"], function () {
      if (!st.active) return;
      st.checks++;
      var ok = PEOPLE.every(function (p) {
        return nxEl(cfg.key + "Sel" + p).value === st.sol[p];
      });
      if (ok) {
        st.active = false;
        v2ClearOne(st.iv);
        var score = Math.max(50, 600 - st.secs * 2 - (st.checks - 1) * 50);
        mScore(cfg.key, score);
        v2Msg(
          cfg.key,
          "Solved - score " + fmt(score) + ". Free brain training, no credits used.",
          "win",
        );
        mFinish(cfg.key, score, "max");
      } else {
        sfx.lose();
        v2Msg(cfg.key, "Not yet - re-read the clues and try again.", "lose");
      }
    });
    v2Msg(
      cfg.key,
      "Three friends, three pets. Use the clues to match each person to their pet.",
      "info",
    );
  }
  mBindStart(cfg.key, start);
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}

function mMaze(cfg) {
  var st = { active: false, walls: [], size: 13, cells: 6, px: 0, py: 0, moves: 0, secs: 0, iv: 0 };
  function gen() {
    var C = st.cells,
      S = st.size;
    var wall = new Array(S * S).fill(true);
    var visited = new Array(C * C).fill(false);
    function carve(cx, cy) {
      visited[cy * C + cx] = true;
      wall[(cy * 2 + 1) * S + cx * 2 + 1] = false;
      var dirs = v2Shuffle([
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]);
      dirs.forEach(function (d) {
        var nx2 = cx + d[0],
          ny2 = cy + d[1];
        if (nx2 < 0 || ny2 < 0 || nx2 >= C || ny2 >= C || visited[ny2 * C + nx2]) return;
        wall[(cy * 2 + 1 + d[1]) * S + cx * 2 + 1 + d[0]] = false;
        carve(nx2, ny2);
      });
    }
    carve(0, 0);
    st.walls = wall;
    st.px = 1;
    st.py = 1;
  }
  function render() {
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var g = document.createElement("div");
    g.className = "mazegrid";
    g.style.gridTemplateColumns = "repeat(" + st.size + ",20px)";
    for (var i = 0; i < st.size * st.size; i++) {
      var d = document.createElement("div");
      d.className = "mz" + (st.walls[i] ? " wall" : "");
      if (i === st.py * st.size + st.px) d.classList.add("me");
      if (i === (st.size - 2) * st.size + st.size - 2) d.classList.add("goal");
      g.appendChild(d);
    }
    disp.appendChild(g);
  }
  function move(dx, dy) {
    if (!st.active) return;
    var nxp = st.px + dx,
      nyp = st.py + dy;
    if (st.walls[nyp * st.size + nxp]) {
      sfx.lose();
      return;
    }
    st.px = nxp;
    st.py = nyp;
    st.moves++;
    sfx.tick();
    render();
    mInfo(cfg.key, st.secs + "s - " + st.moves + " moves");
    if (st.px === st.size - 2 && st.py === st.size - 2) {
      st.active = false;
      v2ClearOne(st.iv);
      var score = Math.max(50, 800 - st.secs * 5 - st.moves);
      mScore(cfg.key, score);
      v2Msg(
        cfg.key,
        "You reached the goal in " +
          st.secs +
          " seconds and " +
          st.moves +
          " moves - score " +
          fmt(score) +
          ". Free brain training, no credits used.",
        "win",
      );
      mFinish(cfg.key, score, "max");
    }
  }
  mBindStart(cfg.key, function () {
    if (st.iv) v2ClearOne(st.iv);
    gen();
    st.moves = 0;
    st.secs = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    render();
    mOptsRender(cfg.key, ["Up", "Left", "Down", "Right"], function (i) {
      if (i === 0) move(0, -1);
      else if (i === 1) move(-1, 0);
      else if (i === 2) move(0, 1);
      else move(1, 0);
    });
    st.iv = v2Every(function () {
      st.secs++;
      mInfo(cfg.key, st.secs + "s - " + st.moves + " moves");
    }, 1000);
    v2Msg(cfg.key, "Guide the gold dot to the teal goal with the arrow buttons.", "info");
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mSliding(cfg) {
  var st = { active: false, tiles: [], moves: 0, secs: 0, iv: 0 };
  function render() {
    var tiles = mTiles(
      cfg.key,
      9,
      3,
      st.tiles.map(function (v) {
        return v === 0 ? "" : String(v);
      }),
    );
    tiles.forEach(function (t, i) {
      if (st.tiles[i] === 0) t.classList.add("dim");
      t.addEventListener("click", function () {
        if (!st.active) return;
        var blank = st.tiles.indexOf(0);
        var r = Math.floor(i / 3),
          c = i % 3,
          br = Math.floor(blank / 3),
          bc = blank % 3;
        if (Math.abs(r - br) + Math.abs(c - bc) !== 1) return;
        st.tiles[blank] = st.tiles[i];
        st.tiles[i] = 0;
        st.moves++;
        sfx.tick();
        render();
        mInfo(cfg.key, st.moves + " moves - " + st.secs + "s");
        if (st.tiles.join("") === "123456780") {
          st.active = false;
          v2ClearOne(st.iv);
          var score = Math.max(50, 900 - st.moves * 5 - st.secs * 2);
          mScore(cfg.key, score);
          v2Msg(
            cfg.key,
            "Puzzle solved in " +
              st.moves +
              " moves - score " +
              fmt(score) +
              ". Free brain training, no credits used.",
            "win",
          );
          mFinish(cfg.key, score, "max");
        }
      });
    });
  }
  mBindStart(cfg.key, function () {
    if (st.iv) v2ClearOne(st.iv);
    st.tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    for (var k = 0; k < 90; k++) {
      var blank = st.tiles.indexOf(0);
      var r = Math.floor(blank / 3),
        c = blank % 3;
      var opts = [];
      if (r > 0) opts.push(blank - 3);
      if (r < 2) opts.push(blank + 3);
      if (c > 0) opts.push(blank - 1);
      if (c < 2) opts.push(blank + 1);
      var j = v2Pick(opts);
      st.tiles[blank] = st.tiles[j];
      st.tiles[j] = 0;
    }
    if (st.tiles.join("") === "123456780") st.tiles = [1, 2, 3, 4, 5, 6, 8, 7, 0];
    st.moves = 0;
    st.secs = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    render();
    st.iv = v2Every(function () {
      st.secs++;
      mInfo(cfg.key, st.moves + " moves - " + st.secs + "s");
    }, 1000);
    v2Msg(cfg.key, "Slide tiles into the blank space until they read 1 to 8 in order.", "info");
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mHanoi(cfg) {
  var st = { active: false, pegs: [[3, 2, 1], [], []], sel: -1, moves: 0, secs: 0, iv: 0 };
  function render() {
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var row = document.createElement("div");
    row.className = "pegrow";
    st.pegs.forEach(function (peg, pi) {
      var p = document.createElement("div");
      p.className = "peg" + (st.sel === pi ? " sel" : "");
      p.setAttribute("role", "button");
      var lab = document.createElement("div");
      lab.className = "nxlabel";
      lab.textContent = "Peg " + (pi + 1);
      peg.forEach(function (d) {
        var disc = document.createElement("div");
        disc.className = "disc";
        disc.style.width = 30 + d * 25 + "%";
        p.appendChild(disc);
      });
      p.appendChild(lab);
      p.addEventListener("click", function () {
        if (!st.active) return;
        if (st.sel < 0) {
          if (!peg.length) return;
          st.sel = pi;
          sfx.click();
          render();
          return;
        }
        if (st.sel === pi) {
          st.sel = -1;
          render();
          return;
        }
        var from = st.pegs[st.sel],
          disc2 = from[from.length - 1];
        var top = peg[peg.length - 1];
        if (top != null && top < disc2) {
          sfx.lose();
          v2Msg(cfg.key, "A larger disc can never sit on a smaller one.", "lose");
          st.sel = -1;
          render();
          return;
        }
        from.pop();
        peg.push(disc2);
        st.moves++;
        st.sel = -1;
        sfx.tick();
        render();
        mInfo(cfg.key, st.moves + " moves - " + st.secs + "s");
        if (st.pegs[2].length === 3) {
          st.active = false;
          v2ClearOne(st.iv);
          var score = Math.max(50, 700 - (st.moves - 7) * 30 - st.secs * 2);
          mScore(cfg.key, score);
          v2Msg(
            cfg.key,
            "Tower moved in " +
              st.moves +
              " moves (7 is perfect) - score " +
              fmt(score) +
              ". Free brain training, no credits used.",
            "win",
          );
          mFinish(cfg.key, score, "max");
        }
      });
      row.appendChild(p);
    });
    disp.appendChild(row);
  }
  mBindStart(cfg.key, function () {
    if (st.iv) v2ClearOne(st.iv);
    st.pegs = [[3, 2, 1], [], []];
    st.sel = -1;
    st.moves = 0;
    st.secs = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    render();
    st.iv = v2Every(function () {
      st.secs++;
      mInfo(cfg.key, st.moves + " moves - " + st.secs + "s");
    }, 1000);
    v2Msg(
      cfg.key,
      "Tap a peg to pick up its top disc, then tap another peg to drop it. Move the whole tower to Peg 3.",
      "info",
    );
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mLightsOut(cfg) {
  var st = { active: false, grid: [], moves: 0, secs: 0, iv: 0 };
  function toggle(i) {
    var r = Math.floor(i / 3),
      c = i % 3;
    [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].forEach(function (d) {
      var rr = r + d[0],
        cc = c + d[1];
      if (rr >= 0 && rr < 3 && cc >= 0 && cc < 3) st.grid[rr * 3 + cc] = !st.grid[rr * 3 + cc];
    });
  }
  function render() {
    var tiles = mTiles(
      cfg.key,
      9,
      3,
      st.grid.map(function () {
        return "";
      }),
    );
    tiles.forEach(function (t, i) {
      if (st.grid[i]) t.classList.add("lit");
      t.addEventListener("click", function () {
        if (!st.active) return;
        toggle(i);
        st.moves++;
        sfx.tick();
        render();
        mInfo(cfg.key, st.moves + " taps - " + st.secs + "s");
        if (
          st.grid.every(function (v) {
            return !v;
          })
        ) {
          st.active = false;
          v2ClearOne(st.iv);
          var score = Math.max(50, 800 - st.moves * 20 - st.secs * 2);
          mScore(cfg.key, score);
          v2Msg(
            cfg.key,
            "All lights out in " +
              st.moves +
              " taps - score " +
              fmt(score) +
              ". Free brain training, no credits used.",
            "win",
          );
          mFinish(cfg.key, score, "max");
        }
      });
    });
  }
  mBindStart(cfg.key, function () {
    if (st.iv) v2ClearOne(st.iv);
    st.grid = [false, false, false, false, false, false, false, false, false];
    for (var k = 0; k < 5; k++) toggle(v2Rand(0, 8));
    if (
      st.grid.every(function (v) {
        return !v;
      })
    )
      toggle(4);
    st.moves = 0;
    st.secs = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    render();
    st.iv = v2Every(function () {
      st.secs++;
      mInfo(cfg.key, st.moves + " taps - " + st.secs + "s");
    }, 1000);
    v2Msg(cfg.key, "Tap a light to flip it and its neighbours. Turn every light off.", "info");
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mNonogram(cfg) {
  var st = { active: false, pic: [], fill: [], secs: 0, iv: 0 };
  function clues(line) {
    var out = [],
      run = 0;
    line.forEach(function (v) {
      if (v) run++;
      else if (run) {
        out.push(run);
        run = 0;
      }
    });
    if (run) out.push(run);
    return out.length ? out.join(" ") : "0";
  }
  function start() {
    if (st.iv) v2ClearOne(st.iv);
    st.pic = [];
    for (var i = 0; i < 25; i++) st.pic.push(Math.random() < 0.55);
    st.fill = new Array(25).fill(false);
    st.secs = 0;
    st.active = true;
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var info = document.createElement("div");
    info.className = "nxsub";
    var rows = [],
      cols = [];
    for (var r = 0; r < 5; r++) {
      rows.push(clues(st.pic.slice(r * 5, r * 5 + 5)));
      var col = [];
      for (var c = 0; c < 5; c++) col.push(st.pic[c * 5 + r]);
      cols.push(clues(col));
    }
    info.textContent = "Row clues: " + rows.join(" | ") + " - Column clues: " + cols.join(" | ");
    disp.appendChild(info);
    var tiles = mTiles(cfg.key, 25, 5, []);
    tiles.forEach(function (t, i) {
      t.style.minHeight = "40px";
      t.addEventListener("click", function () {
        if (!st.active) return;
        st.fill[i] = !st.fill[i];
        t.classList.toggle("on", st.fill[i]);
        sfx.click();
      });
    });
    st.iv = v2Every(function () {
      st.secs++;
      mInfo(cfg.key, st.secs + "s");
    }, 1000);
    mOptsRender(cfg.key, ["Check my picture"], function () {
      if (!st.active) return;
      var correct = 0;
      for (var i2 = 0; i2 < 25; i2++) if (st.fill[i2] === st.pic[i2]) correct++;
      st.active = false;
      v2ClearOne(st.iv);
      var score = correct * 20 + (correct === 25 ? 200 : 0);
      mScore(cfg.key, score);
      v2Msg(
        cfg.key,
        "You matched " +
          correct +
          " of 25 cells - score " +
          fmt(score) +
          ". Free brain training, no credits used.",
        correct === 25 ? "win" : "info",
      );
      mFinish(cfg.key, score, "max");
    });
    v2Msg(
      cfg.key,
      "Fill cells so each row and column matches its clue numbers - the lengths of the filled runs.",
      "info",
    );
  }
  mBindStart(cfg.key, start);
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mCodeBreaker(cfg) {
  var st = { active: false, code: "", left: 8 };
  function submit() {
    if (!st.active) return;
    var inp = nxEl(cfg.key + "Input");
    var val = inp.value.replace(/\D/g, "").slice(0, 4);
    inp.value = "";
    if (val.length !== 4) {
      v2Msg(cfg.key, "Enter exactly 4 digits.", "lose");
      return;
    }
    st.left--;
    var bulls = 0,
      cows = 0;
    var codeLeft = {},
      guessLeft = {};
    for (var i = 0; i < 4; i++) {
      if (val[i] === st.code[i]) bulls++;
      else {
        codeLeft[st.code[i]] = (codeLeft[st.code[i]] || 0) + 1;
        guessLeft[val[i]] = (guessLeft[val[i]] || 0) + 1;
      }
    }
    Object.keys(guessLeft).forEach(function (d) {
      cows += Math.min(guessLeft[d], codeLeft[d] || 0);
    });
    var line = document.createElement("div");
    line.textContent =
      "Guess " +
      val +
      " - " +
      bulls +
      " in place, " +
      cows +
      " right digit wrong place. Guesses left: " +
      st.left;
    nxEl(cfg.key + "Disp").appendChild(line);
    if (bulls === 4) {
      st.active = false;
      var score = 200 + st.left * 50;
      mScore(cfg.key, score);
      v2Msg(
        cfg.key,
        "Code cracked - score " + fmt(score) + ". Free brain training, no credits used.",
        "win",
      );
      mFinish(cfg.key, score, "max");
    } else if (st.left <= 0) {
      st.active = false;
      v2Msg(
        cfg.key,
        "Out of guesses - the code was " + st.code + ". Free brain training, no credits used.",
        "lose",
      );
      mFinish(cfg.key, 0, "max");
    } else sfx.tick();
  }
  nxEl(cfg.key + "Go").addEventListener("click", submit);
  nxEl(cfg.key + "Input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") submit();
  });
  mBindStart(cfg.key, function () {
    var digits = v2Shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    st.code = digits.slice(0, 4).join("");
    st.left = 8;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    nxEl(cfg.key + "Disp").innerHTML =
      '<div class="nxsub">The code has 4 different digits. Your guess results appear here.</div>';
    nxEl(cfg.key + "Input").disabled = false;
    mInfo(cfg.key, "8 guesses");
    v2Msg(
      cfg.key,
      "Guess the 4-digit code. After each guess you learn how many digits are right and in place, and how many are right but misplaced.",
      "info",
    );
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
/* ================= mind games: focus engines ================= */
function mReaction(cfg) {
  var st = { active: false, waiting: false, tries: [], t0: 0, to: 0 };
  function area(html, cls) {
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var d = document.createElement("div");
    d.className = "reactarea " + (cls || "");
    d.textContent = html;
    d.addEventListener("click", function () {
      if (!st.active) return;
      if (!st.waiting) {
        if (st.to) v2ClearOne(st.to);
        d.textContent = "Too soon - wait for green. Tap to try this attempt again.";
        d.className = "reactarea wait";
        sfx.lose();
        arm();
        return;
      }
      var ms = Math.round(performance.now() - st.t0);
      st.waiting = false;
      st.tries.push(ms);
      mInfo(cfg.key, "Attempt " + st.tries.length + " of 5 - " + ms + " ms");
      if (st.tries.length >= 5) {
        st.active = false;
        var best = Math.min.apply(null, st.tries);
        mScore(cfg.key, best + " ms");
        v2Msg(
          cfg.key,
          "Your five times: " +
            st.tries.join(", ") +
            " ms. Fastest: " +
            best +
            " ms. Free brain training, no credits used.",
          "win",
        );
        mFinish(cfg.key, best, "min");
        d.textContent = "Done - fastest " + best + " ms";
        d.className = "reactarea";
      } else {
        d.textContent = ms + " ms - tap for the next attempt";
        d.className = "reactarea";
        arm();
      }
    });
    disp.appendChild(d);
    return d;
  }
  function arm() {
    var d = nxEl(cfg.key + "Disp").firstChild;
    st.to = v2After(
      function () {
        if (!st.active) return;
        st.waiting = true;
        st.t0 = performance.now();
        d.className = "reactarea go";
        d.textContent = "TAP!";
      },
      900 + Math.random() * 2600,
    );
  }
  mBindStart(cfg.key, function () {
    st.tries = [];
    st.active = true;
    st.waiting = false;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    var d = area("Wait for green, then tap as fast as you can", "wait");
    arm();
    v2Msg(
      cfg.key,
      "The panel turns green at a random moment - tap instantly. Tapping early restarts that attempt.",
      "info",
    );
  });
  mShowBest(cfg.key, "min");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mAim(cfg) {
  var st = { active: false, hits: 0, miss: 0, time: 30, iv: 0, tiv: 0, tgt: null };
  function spawn() {
    if (!st.active) return;
    if (st.tgt) st.tgt.remove();
    var areaEl = nxEl(cfg.key + "Area");
    if (!areaEl) return;
    var size = Math.max(30, 58 - (30 - st.time));
    var b = document.createElement("button");
    b.className = "targetbtn";
    b.style.width = size + "px";
    b.style.height = size + "px";
    b.style.left = v2Rand(2, 88) + "%";
    b.style.top = v2Rand(4, 78) + "%";
    b.setAttribute("aria-label", "Target");
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!st.active) return;
      st.hits++;
      mScore(cfg.key, st.hits * 50 - st.miss * 10);
      sfx.gem();
      spawn();
    });
    areaEl.appendChild(b);
    st.tgt = b;
  }
  mBindStart(cfg.key, function () {
    if (st.iv) v2ClearOne(st.iv);
    if (st.tiv) v2ClearOne(st.tiv);
    st.hits = 0;
    st.miss = 0;
    st.time = 30;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var areaEl = document.createElement("div");
    areaEl.className = "playarea";
    areaEl.id = cfg.key + "Area";
    areaEl.addEventListener("click", function () {
      if (!st.active) return;
      st.miss++;
      mScore(cfg.key, st.hits * 50 - st.miss * 10);
    });
    disp.appendChild(areaEl);
    spawn();
    st.tiv = v2Every(spawn, 1400);
    st.iv = v2Every(function () {
      st.time--;
      mInfo(cfg.key, Math.max(0, st.time) + "s - " + st.hits + " hits");
      if (st.time <= 0) {
        st.active = false;
        v2ClearOne(st.iv);
        v2ClearOne(st.tiv);
        if (st.tgt) st.tgt.remove();
        var score = Math.max(0, st.hits * 50 - st.miss * 10);
        mScore(cfg.key, score);
        v2Msg(
          cfg.key,
          "Time up - " +
            st.hits +
            " hits and " +
            st.miss +
            " misses. Score: " +
            fmt(score) +
            ". Free brain training, no credits used.",
          "win",
        );
        mFinish(cfg.key, score, "max");
      }
    }, 1000);
    v2Msg(
      cfg.key,
      "Tap targets as they appear - they shrink as time runs down. Background clicks count as misses.",
      "info",
    );
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mFindDiff(cfg) {
  var PAIRS = [
    ["●", "○"],
    ["■", "▢"],
    ["▲", "△"],
    ["★", "☆"],
    ["◆", "◇"],
    ["♥", "♡"],
  ];
  var st = { active: false, score: 0, round: 0, time: 45, iv: 0, diff: -1 };
  function round() {
    st.round++;
    var n = Math.min(3 + Math.floor(st.round / 2), 7);
    var pair = v2Pick(PAIRS);
    var labels = [];
    for (var i = 0; i < n * n; i++) labels.push(pair[0]);
    st.diff = v2Rand(0, n * n - 1);
    labels[st.diff] = pair[1];
    var tiles = mTiles(cfg.key, n * n, n, labels);
    tiles.forEach(function (t, i) {
      t.style.minWidth = "0";
      t.addEventListener("click", function () {
        if (!st.active) return;
        if (i === st.diff) {
          st.score += 100;
          sfx.gem();
          mScore(cfg.key, st.score);
          round();
        } else {
          st.score = Math.max(0, st.score - 25);
          sfx.lose();
          t.classList.add("bad");
          mScore(cfg.key, st.score);
        }
      });
    });
    mInfo(cfg.key, Math.max(0, st.time) + "s - round " + st.round);
  }
  mBindStart(cfg.key, function () {
    if (st.iv) v2ClearOne(st.iv);
    st.score = 0;
    st.round = 0;
    st.time = 45;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    round();
    st.iv = v2Every(function () {
      st.time--;
      mInfo(cfg.key, Math.max(0, st.time) + "s - round " + st.round);
      if (st.time <= 0) {
        st.active = false;
        v2ClearOne(st.iv);
        v2Msg(
          cfg.key,
          "Time up - you cleared " +
            st.round +
            " rounds for " +
            fmt(st.score) +
            " points. Free brain training, no credits used.",
          "win",
        );
        mFinish(cfg.key, st.score, "max");
      }
    }, 1000);
    v2Msg(cfg.key, "Spot the one tile that differs and tap it - grids grow as you score.", "info");
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mKeepCount(cfg) {
  var st = { active: false, round: 0, score: 0, count: 0 };
  function round() {
    st.round++;
    if (st.round > 5) {
      st.active = false;
      v2Msg(
        cfg.key,
        "All 5 rounds done - score " + fmt(st.score) + ". Free brain training, no credits used.",
        "win",
      );
      mFinish(cfg.key, st.score, "max");
      return;
    }
    st.count = v2Rand(4, 9);
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var areaEl = document.createElement("div");
    areaEl.className = "playarea";
    areaEl.style.height = "130px";
    disp.appendChild(areaEl);
    nxEl(cfg.key + "Opts").innerHTML = "";
    mInfo(cfg.key, "Round " + st.round + " of 5 - count the stars");
    var objs = [];
    for (var i = 0; i < st.count; i++) {
      var s = document.createElement("span");
      s.className = "passobj";
      s.textContent = "★";
      s.style.top = v2Rand(8, 66) + "%";
      s.style.left = "-8%";
      areaEl.appendChild(s);
      objs.push({ el: s, x: -8 - i * 7, speed: 0.55 + Math.random() * 0.5 });
    }
    var iv = v2Every(function () {
      var done = true;
      objs.forEach(function (o) {
        o.x += o.speed;
        if (o.x < 106) done = false;
        o.el.style.left = o.x + "%";
      });
      if (done) {
        v2ClearOne(iv);
        areaEl.innerHTML = "";
        var opts = v2Shuffle([st.count, st.count + 1, st.count - 1, st.count + 2]);
        mOptsRender(cfg.key, opts.map(String), function (idx, btn) {
          if (opts[idx] === st.count) {
            st.score += 100;
            sfx.gem();
            btn.classList.add("good");
          } else {
            sfx.lose();
            btn.classList.add("bad");
          }
          mScore(cfg.key, st.score);
          $$(".optbtn", nxEl(cfg.key + "Opts")).forEach(function (b) {
            b.disabled = true;
          });
          v2After(round, 800);
        });
        mInfo(cfg.key, "Round " + st.round + " - how many stars passed?");
      }
    }, 30);
  }
  mBindStart(cfg.key, function () {
    st.round = 0;
    st.score = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(cfg.key, "Stars drift across the screen - keep count and answer at the end.", "info");
    round();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}
function mFollowBall(cfg) {
  var st = { active: false, round: 0, score: 0, cups: [], ballCup: 0, busy: false };
  function round() {
    st.round++;
    if (st.round > 6) {
      st.active = false;
      v2Msg(
        cfg.key,
        "All 6 rounds done - score " + fmt(st.score) + ". Free brain training, no credits used.",
        "win",
      );
      mFinish(cfg.key, st.score, "max");
      return;
    }
    st.ballCup = v2Rand(0, 2);
    st.busy = true;
    var disp = nxEl(cfg.key + "Disp");
    disp.innerHTML = "";
    var row = document.createElement("div");
    row.className = "cuprow";
    st.cups = [];
    for (var i = 0; i < 3; i++) {
      var c = document.createElement("button");
      c.className = "cupbtn";
      c.textContent = i === st.ballCup ? "Cup - ball here" : "Cup";
      c.style.order = i;
      c.setAttribute("data-cup", i);
      (function (cup, idx) {
        cup.addEventListener("click", function () {
          if (!st.active || st.busy) return;
          if (idx === st.ballCup) {
            st.score += 100;
            sfx.gem();
            cup.textContent = "Ball - found it";
          } else {
            sfx.lose();
            cup.textContent = "Empty";
            st.cups[st.ballCup].textContent = "Ball was here";
          }
          mScore(cfg.key, st.score);
          st.busy = true;
          v2After(round, 1000);
        });
      })(c, i);
      row.appendChild(c);
      st.cups.push(c);
    }
    disp.appendChild(row);
    mInfo(cfg.key, "Round " + st.round + " of 6 - watch the cups");
    v2After(function () {
      st.cups.forEach(function (c) {
        c.textContent = "Cup";
      });
      var swaps = 4 + st.round;
      var step = 0;
      var iv = v2Every(
        function () {
          step++;
          var a = v2Rand(0, 2),
            b = v2Rand(0, 2);
          if (a !== b) {
            var oa = st.cups[a].style.order;
            st.cups[a].style.order = st.cups[b].style.order;
            st.cups[b].style.order = oa;
          }
          sfx.tick();
          if (step >= swaps) {
            v2ClearOne(iv);
            st.busy = false;
            mInfo(cfg.key, "Round " + st.round + " - tap the cup hiding the ball");
          }
        },
        Math.max(280, 620 - st.round * 55),
      );
    }, 900);
  }
  mBindStart(cfg.key, function () {
    st.round = 0;
    st.score = 0;
    st.active = true;
    mScore(cfg.key, 0);
    nxEl(cfg.key + "Again").disabled = true;
    v2Msg(
      cfg.key,
      "Watch which cup hides the ball, follow the shuffles, then tap that cup.",
      "info",
    );
    round();
  });
  mShowBest(cfg.key, "max");
  nxEl(cfg.key + "Disp").innerHTML = '<div class="nxsub">' + cfg.intro + "</div>";
}

