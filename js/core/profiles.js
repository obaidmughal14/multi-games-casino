"use strict";
/* ================= local profiles (free accounts, this device only) =================
       Guest is the default and keeps the original storage keys untouched.
       A profile is only a display name, a username, an avatar and preferences
       saved in this browser through the safe storage wrapper - no password,
       no email, no phone, no payments, and nothing is ever sent anywhere.
       Each profile gets its own namespaced keys for balance, missions,
       levels, badges, best wins and mind-game best scores. House Stats
       (mgc_stats_v1) stays device-wide across Guest and all profiles. */
var PROFILES_KEY = "mgc_profiles_v1",
  ACTIVE_KEY = "mgc_active_v1";
var AVATARS = [
  "s-star",
  "s-coin",
  "s-gem",
  "s-crown",
  "s-rocket",
  "s-dice",
  "s-cards",
  "s-fish",
  "s-cherry",
  "s-clover",
  "s-wheel",
  "s-diamond",
];
var FAVCATS = [
  "all",
  "slots",
  "table",
  "dice",
  "wheel",
  "crash",
  "arcade",
  "fishing",
  "bingo",
  "videopoker",
  "mind",
];
function pSlug(u) {
  return String(u == null ? "" : u).toLowerCase();
}
function validUsername(u) {
  return /^[A-Za-z0-9_]{3,16}$/.test(u || "");
}
function validDispName(n) {
  n = String(n == null ? "" : n).trim();
  return n.length >= 2 && n.length <= 20;
}
function profileKey(u) {
  return "mgc_profile_" + pSlug(u) + "_v1";
}
function loadProfileRec(u) {
  var rec = null;
  try {
    rec = JSON.parse(store.get(profileKey(u)) || "null");
  } catch (e) {
    rec = null;
  }
  if (!rec || typeof rec !== "object") return null;
  if (!validUsername(rec.user || "") || pSlug(rec.user) !== pSlug(u)) return null;
  if (!validDispName(rec.name || "")) return null;
  rec.user = String(rec.user);
  rec.name = String(rec.name).trim();
  if (AVATARS.indexOf(rec.avatar) < 0) rec.avatar = "s-star";
  if (FAVCATS.indexOf(rec.fav) < 0) rec.fav = "all";
  rec.soundOn = rec.soundOn !== false;
  if (typeof rec.created !== "number" || !(rec.created > 0) || rec.created > Date.now() + 86400000)
    rec.created = Date.now();
  return rec;
}
function loadProfileList() {
  var raw = [];
  try {
    var p = JSON.parse(store.get(PROFILES_KEY) || "[]");
    if (Array.isArray(p)) raw = p;
  } catch (e) {
    raw = [];
  }
  var out = [],
    seenL = {};
  raw.forEach(function (u) {
    if (typeof u !== "string" || !validUsername(u)) return;
    var s = pSlug(u);
    if (seenL[s]) return;
    seenL[s] = true;
    if (loadProfileRec(u)) out.push(u);
  });
  return out.slice(0, 10);
}
var profileList = loadProfileList();
var curPlayer = "";
(function () {
  var a = store.get(ACTIVE_KEY) || "";
  if (a && validUsername(a)) {
    for (var i = 0; i < profileList.length; i++) {
      if (pSlug(profileList[i]) === pSlug(a)) {
        curPlayer = profileList[i];
        break;
      }
    }
  }
})();
function keysFor(u) {
  if (!u)
    return {
      bal: "mgc_balance_v1",
      eng: "mgc_engage_v1",
      best: "mgc_best_v1",
      seen: "mgc_seen_v1",
      pstats: "mgc_pstats_v1",
      mind: "mgc_best_",
    };
  var p = "mgc_profile_" + pSlug(u) + "_";
  return {
    bal: p + "balance",
    eng: p + "engage",
    best: p + "bestwins",
    seen: p + "seen",
    pstats: p + "pstats",
    mind: p + "best_",
  };
}
var MGC_KEYS = keysFor(curPlayer);
var BAL_KEY = MGC_KEYS.bal,
  ENG_KEY = MGC_KEYS.eng,
  BEST_KEY = MGC_KEYS.best,
  SEEN_KEY = MGC_KEYS.seen,
  PSTATS_KEY = MGC_KEYS.pstats,
  MIND_PFX = MGC_KEYS.mind;
var curRec = curPlayer ? loadProfileRec(curPlayer) : null;
if (curPlayer && !curRec) curPlayer = "";
var INIT_MUTED = curRec ? !curRec.soundOn : store.get("mgc_muted") === "1";
function saveProfileRec(rec) {
  try {
    store.set(profileKey(rec.user), JSON.stringify(rec));
  } catch (e) {}
}
function saveProfileList() {
  try {
    store.set(PROFILES_KEY, JSON.stringify(profileList));
  } catch (e) {}
}
/* per-player rounds counter - drives this player's level and badges.
       Guest is seeded once from the existing device stats so the level
       Guest already earned in this browser carries over unchanged. */
var playerStats = { rounds: 0 };
try {
  var psSaved = JSON.parse(store.get(PSTATS_KEY) || "null");
  if (psSaved && typeof psSaved.rounds === "number" && psSaved.rounds >= 0)
    playerStats.rounds = Math.floor(psSaved.rounds);
  else if (!curPlayer) {
    var hsSaved = JSON.parse(store.get("mgc_stats_v1") || "null");
    if (hsSaved && typeof hsSaved.rounds === "number" && hsSaved.rounds >= 0)
      playerStats.rounds = Math.floor(hsSaved.rounds);
  }
} catch (e) {}
function savePStats() {
  try {
    store.set(PSTATS_KEY, JSON.stringify(playerStats));
  } catch (e) {}
}

