"use strict";
/* ================= shared balance (fun credits only) =================
       BAL_KEY is set by the profiles bootstrap above: Guest uses the
       original mgc_balance_v1 key, a profile uses its own key. */
var bal = parseInt(store.get(BAL_KEY) || "10000", 10);
if (isNaN(bal) || bal < 0) bal = 10000;
function renderBal(pulse) {
  $$(".bal-amt").forEach(function (e) {
    e.textContent = fmt(bal);
  });
  var rb = $("#refillBtn");
  rb.disabled = bal >= 100;
  rb.title =
    bal >= 100 ? "Refill unlocks when your balance drops under 100" : "Add 5,000 free fun credits";
  if (pulse) {
    var p = $("#balPill");
    p.classList.remove("pulse");
    void p.offsetWidth;
    p.classList.add("pulse");
  }
}
function setBal(v) {
  bal = Math.max(0, Math.floor(v));
  store.set(BAL_KEY, bal);
  renderBal(false);
}
function addBal(v) {
  setBal(bal + v);
}
$("#refillBtn").addEventListener("click", function () {
  if (bal >= 100) return;
  addBal(5000);
  renderBal(true);
  sfx.coin();
  pushWin("You", 5000, "Refill bonus");
});

