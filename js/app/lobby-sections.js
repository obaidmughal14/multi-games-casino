"use strict";
/* ================= lobby sections, counts and session time ================= */
function updSections() {
  $$("#gameGrid .subsec").forEach(function (sec) {
    var vis = $$(".card", sec).some(function (c) {
      return c.style.display !== "none";
    });
    sec.style.display = vis ? "" : "none";
  });
  $$("#gameGrid .catsec").forEach(function (sec) {
    var vis = $$(".card", sec).some(function (c) {
      return c.style.display !== "none";
    });
    sec.style.display = vis ? "" : "none";
  });
}
$$("#filters .fbtn").forEach(function (b) {
  b.addEventListener("click", function () {
    updSections();
  });
});
$("#searchInput").addEventListener("input", function () {
  updSections();
});
updSections();
var v2StartTime = Date.now();
v2Every(function () {
  var el = document.getElementById("sessTime2");
  if (el) el.textContent = Math.floor((Date.now() - v2StartTime) / 60000) + " min";
}, 15000);

