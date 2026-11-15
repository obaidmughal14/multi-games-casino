"use strict";
/* ================= navigation ================= */
var currentScreen = "scr-lobby";
function showScreen(id) {
  if (id !== "scr-fishing" && typeof fish !== "undefined" && fish && fish.active) endFishing();
  if (window.__v2leave) window.__v2leave();
  $$(".screen").forEach(function (s) {
    s.hidden = s.id !== id;
  });
  document.getElementById("scr-lobby").hidden = id !== "scr-lobby";
  currentScreen = id;
  if (typeof renderStats === "function") renderStats();
  if (id === "scr-lobby" && typeof renderEngage === "function") renderEngage();
  window.scrollTo({ top: 0, behavior: "instant" });
}
$$(".backbtn").forEach(function (b) {
  b.addEventListener("click", function () {
    sfx.click();
    showScreen("scr-lobby");
  });
});
$("#lobbyBtn").addEventListener("click", function () {
  sfx.click();
  showScreen("scr-lobby");
});

