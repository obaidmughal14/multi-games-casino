"use strict";
/* ================= profiles UI =================
       Everything below only moves between records already saved on this
       device. User-entered names are rendered with textContent, and the one
       toast that includes a display name escapes it first. */
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
var MIND_KEYS_CACHE = null;
function mindKeys() {
  if (MIND_KEYS_CACHE) return MIND_KEYS_CACHE;
  var ks = [];
  $$("[id$='Best']").forEach(function (el) {
    var k = el.id.slice(0, -4);
    if (k && document.getElementById(k + "Score")) ks.push(k);
  });
  MIND_KEYS_CACHE = ks;
  return ks;
}
function refreshMindBests() {
  mindKeys().forEach(function (k) {
    mShowBest(k, k === "mreaction" ? "min" : "max");
  });
}
function loadBalData() {
  var v = parseInt(store.get(BAL_KEY) || "10000", 10);
  if (isNaN(v) || v < 0) v = 10000;
  return v;
}
function loadEngData() {
  var e = { day: todayStr(), rounds: 0, games: {}, won: false, claimed: {}, bonusDay: "" };
  try {
    var sv = JSON.parse(store.get(ENG_KEY) || "null");
    if (sv && typeof sv === "object") {
      if (sv.day === todayStr()) e = sv;
      else e.bonusDay = typeof sv.bonusDay === "string" ? sv.bonusDay : "";
    }
  } catch (err) {}
  if (typeof e.rounds !== "number" || e.rounds < 0 || isNaN(e.rounds)) e.rounds = 0;
  if (!e.games || typeof e.games !== "object") e.games = {};
  if (!e.claimed || typeof e.claimed !== "object") e.claimed = {};
  e.won = !!e.won;
  if (typeof e.bonusDay !== "string") e.bonusDay = "";
  return e;
}
function loadSeenData() {
  try {
    var s = JSON.parse(store.get(SEEN_KEY) || "{}");
    return s && typeof s === "object" && !Array.isArray(s) ? s : {};
  } catch (e) {
    return {};
  }
}
function loadBestData() {
  try {
    var b = JSON.parse(store.get(BEST_KEY) || "[]");
    if (!Array.isArray(b)) return [];
    return b
      .filter(function (w) {
        return w && typeof w.amt === "number" && w.amt >= 0 && typeof w.game === "string";
      })
      .slice(0, 6);
  } catch (e) {
    return [];
  }
}
function loadPStatsData() {
  var ps = { rounds: 0 };
  try {
    var sv = JSON.parse(store.get(PSTATS_KEY) || "null");
    if (sv && typeof sv.rounds === "number" && sv.rounds >= 0) ps.rounds = Math.floor(sv.rounds);
  } catch (e) {}
  return ps;
}
function renderPlayerChip() {
  var use = $("#playerAvatarUse"),
    nm = $("#playerName");
  if (!use || !nm) return;
  if (curRec) {
    use.setAttribute("href", "#" + curRec.avatar);
    nm.textContent = curRec.name;
  } else {
    use.setAttribute("href", "#s-star");
    nm.textContent = "Guest";
  }
  $("#signOutBtn").hidden = !curRec;
  var ls = $("#lvlScope");
  if (ls) ls.textContent = curRec ? "on this profile" : "in this browser";
}
function applyPlayer(u) {
  curPlayer = u || "";
  curRec = curPlayer ? loadProfileRec(curPlayer) : null;
  if (curPlayer && !curRec) curPlayer = "";
  store.set(ACTIVE_KEY, curPlayer);
  MGC_KEYS = keysFor(curPlayer);
  BAL_KEY = MGC_KEYS.bal;
  ENG_KEY = MGC_KEYS.eng;
  BEST_KEY = MGC_KEYS.best;
  SEEN_KEY = MGC_KEYS.seen;
  PSTATS_KEY = MGC_KEYS.pstats;
  MIND_PFX = MGC_KEYS.mind;
  bal = loadBalData();
  renderBal(false);
  eng = loadEngData();
  seenGames = loadSeenData();
  bestWins = loadBestData();
  playerStats = loadPStatsData();
  muted = curRec ? !curRec.soundOn : store.get("mgc_muted") === "1";
  renderSound();
  renderEngage();
  renderStats();
  refreshMindBests();
  renderPlayerChip();
}
function profileBalOf(u) {
  var v = parseInt(store.get(keysFor(u).bal) || "10000", 10);
  return isNaN(v) || v < 0 ? 10000 : v;
}
function profileRoundsOf(u) {
  try {
    var ps = JSON.parse(store.get(keysFor(u).pstats) || "null");
    if (ps && typeof ps.rounds === "number" && ps.rounds >= 0) return Math.floor(ps.rounds);
  } catch (e) {}
  return 0;
}
function renderSwitch() {
  var box = $("#profileList");
  box.innerHTML = "";
  $("#switchEmpty").hidden = profileList.length > 0;
  profileList.forEach(function (u) {
    var rec = loadProfileRec(u);
    if (!rec) return;
    var card = document.createElement("button");
    card.className = "profcard" + (curPlayer && pSlug(curPlayer) === pSlug(u) ? " on" : "");
    var av = document.createElement("span");
    av.className = "pavbig";
    av.innerHTML = '<svg aria-hidden="true"><use href="#' + rec.avatar + '"/></svg>';
    var tx = document.createElement("span");
    tx.className = "ptx";
    var n1 = document.createElement("b");
    n1.textContent = rec.name;
    var n2 = document.createElement("small");
    n2.textContent = "@" + rec.user;
    var n3 = document.createElement("small");
    n3.textContent =
      fmt(profileBalOf(u)) + " fun credits - " + fmt(profileRoundsOf(u)) + " rounds played";
    tx.appendChild(n1);
    tx.appendChild(n2);
    tx.appendChild(n3);
    card.appendChild(av);
    card.appendChild(tx);
    card.addEventListener("click", function () {
      sfx.click();
      applyPlayer(rec.user);
      showScreen("scr-lobby");
      showToast(
        "Signed in as <b>" + escHtml(rec.name) + "</b> - balance " + fmt(bal) + " fun credits",
      );
    });
    box.appendChild(card);
  });
}
function openSwitch() {
  renderSwitch();
  showScreen("scr-switch");
}
/* ---- create profile ---- */
var cfAvatar = "s-star",
  suAvatar = "s-star";
function buildAvatars(box, current, cb) {
  box.innerHTML = "";
  AVATARS.forEach(function (a) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "avbtn" + (a === current ? " on" : "");
    b.setAttribute("aria-label", "Choose avatar " + a.replace("s-", ""));
    b.innerHTML = '<svg aria-hidden="true"><use href="#' + a + '"/></svg>';
    b.addEventListener("click", function () {
      sfx.click();
      $$(".avbtn", box).forEach(function (x) {
        x.classList.remove("on");
      });
      b.classList.add("on");
      cb(a);
    });
    box.appendChild(b);
  });
}
function cfValidate() {
  var name = $("#cfName").value,
    user = $("#cfUser").value.trim();
  var nameOk = validDispName(name),
    userOk = validUsername(user);
  var taken =
    userOk &&
    profileList.some(function (u) {
      return pSlug(u) === pSlug(user);
    });
  $("#cfNameErr").textContent = name && !nameOk ? "Display name must be 2 to 20 characters." : "";
  $("#cfUserErr").textContent = !user
    ? ""
    : !userOk
      ? "Username must be 3 to 16 characters: letters, numbers and underscore only."
      : taken
        ? "That username is taken on this device - try another."
        : "";
  var limit = profileList.length >= 10;
  $("#createLimit").hidden = !limit;
  $("#cfCreate").disabled = !(nameOk && userOk && !taken && $("#cfAge").checked && !limit);
}
function openCreate() {
  cfAvatar = "s-star";
  buildAvatars($("#cfAvatars"), cfAvatar, function (a) {
    cfAvatar = a;
  });
  cfValidate();
  showScreen("scr-create");
}
$("#cfName").addEventListener("input", cfValidate);
$("#cfUser").addEventListener("input", cfValidate);
$("#cfAge").addEventListener("change", cfValidate);
$("#cfCreate").addEventListener("click", function () {
  cfValidate();
  if ($("#cfCreate").disabled) return;
  var rec = {
    name: $("#cfName").value.trim(),
    user: $("#cfUser").value.trim(),
    avatar: cfAvatar,
    fav: FAVCATS.indexOf($("#cfFav").value) >= 0 ? $("#cfFav").value : "all",
    soundOn: $("#cfSound").value !== "off",
    created: Date.now(),
  };
  profileList.push(rec.user);
  saveProfileList();
  saveProfileRec(rec);
  store.set(keysFor(rec.user).bal, "10000");
  applyPlayer(rec.user);
  $("#cfName").value = "";
  $("#cfUser").value = "";
  $("#cfAge").checked = false;
  showScreen("scr-lobby");
  sfx.coin();
  showToast(
    "Welcome, <b>" + escHtml(rec.name) + "</b> - your free profile starts with 10,000 fun credits",
  );
});
/* ---- profile setup ---- */
function renderSetup() {
  var guest = !curRec;
  $("#setupGuest").hidden = !guest;
  $("#setupMain").hidden = guest;
  if (guest) return;
  $("#suUser").textContent = "@" + curRec.user;
  $("#suBal").textContent = fmt(bal) + " fun credits";
  $("#suRounds").textContent = fmt(playerStats.rounds);
  $("#suBig").textContent = bestWins.length
    ? fmt(bestWins[0].amt) + " fun credits on " + bestWins[0].game
    : "No wins recorded yet";
  var held = mindKeys().filter(function (k) {
    return mBestGet(k) > 0;
  }).length;
  $("#suMind").textContent = held + " of " + mindKeys().length;
  $("#suSince").textContent = new Date(curRec.created).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  $("#suName").value = curRec.name;
  $("#suNameErr").textContent = "";
  suAvatar = curRec.avatar;
  buildAvatars($("#suAvatars"), suAvatar, function (a) {
    suAvatar = a;
  });
  $("#suFav").value = curRec.fav;
  $("#suSound").value = curRec.soundOn ? "on" : "off";
}
function openSetup() {
  renderSetup();
  showScreen("scr-setup");
}
$("#suSave").addEventListener("click", function () {
  if (!curRec) return;
  var nm = $("#suName").value;
  if (!validDispName(nm)) {
    $("#suNameErr").textContent = "Display name must be 2 to 20 characters.";
    return;
  }
  $("#suNameErr").textContent = "";
  curRec.name = nm.trim();
  curRec.avatar = suAvatar;
  curRec.fav = FAVCATS.indexOf($("#suFav").value) >= 0 ? $("#suFav").value : "all";
  curRec.soundOn = $("#suSound").value !== "off";
  saveProfileRec(curRec);
  muted = !curRec.soundOn;
  renderSound();
  renderPlayerChip();
  renderSetup();
  sfx.click();
  showToast("Profile saved");
});
$("#suDelete").addEventListener("click", function () {
  if (!curRec) return;
  $("#delName").textContent = curRec.name + " (@" + curRec.user + ")";
  $("#delPop").hidden = false;
});
$("#delNo").addEventListener("click", function () {
  $("#delPop").hidden = true;
  sfx.click();
});
$("#delYes").addEventListener("click", function () {
  $("#delPop").hidden = true;
  if (!curRec) return;
  var u = curRec.user,
    kk = keysFor(u);
  store.remove(profileKey(u));
  [kk.bal, kk.eng, kk.best, kk.seen, kk.pstats].forEach(function (k) {
    store.remove(k);
  });
  mindKeys().forEach(function (mk) {
    store.remove(kk.mind + mk);
  });
  profileList = profileList.filter(function (x) {
    return pSlug(x) !== pSlug(u);
  });
  saveProfileList();
  applyPlayer("");
  showScreen("scr-lobby");
  showToast("Profile deleted - you are playing as Guest now");
});
/* ---- header and switch-screen wiring ---- */
$("#playerChip").addEventListener("click", function () {
  sfx.click();
  openSwitch();
});
$("#switchProfileBtn").addEventListener("click", function () {
  sfx.click();
  openSwitch();
});
$("#createProfileBtn").addEventListener("click", function () {
  sfx.click();
  openCreate();
});
$("#setupProfileBtn").addEventListener("click", function () {
  sfx.click();
  openSetup();
});
$("#signOutBtn").addEventListener("click", function () {
  sfx.click();
  applyPlayer("");
  showScreen("scr-lobby");
  showToast("Signed out - you are playing as Guest");
});
$("#guestBtn").addEventListener("click", function () {
  sfx.click();
  applyPlayer("");
  showScreen("scr-lobby");
  showToast("Playing as Guest - guest play is always free");
});
$("#switchCreateBtn").addEventListener("click", function () {
  sfx.click();
  openCreate();
});
$("#suGuestCreate").addEventListener("click", function () {
  sfx.click();
  openCreate();
});
$("#suGuestSwitch").addEventListener("click", function () {
  sfx.click();
  openSwitch();
});
renderPlayerChip();

