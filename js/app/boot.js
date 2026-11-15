"use strict";
/* ================= first-launch notice (once per device) =================
       Device-wide key through the safe storage wrapper - not per profile,
       so it shows on the very first load only and never returns. */
var FIRST_KEY = "mgc_firstlaunch_v1";
if (store.get(FIRST_KEY) !== "1") {
  $("#firstLaunch").hidden = false;
}
$("#firstLaunchBtn").addEventListener("click", function () {
  store.set(FIRST_KEY, "1");
  $("#firstLaunch").hidden = true;
  sfx.click();
});
