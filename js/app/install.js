"use strict";
/* ================= installable app (iOS and Android, no service worker) =================
       Install-from-browser only: a local manifest plus the browser install
       prompt where it exists, and manual Add to Home Screen steps where it
       does not (including iOS). There is deliberately no service worker and
       no offline caching - the app needs internet to load and always loads
       the newest version. */
var isStandalone = false;
try {
  isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
} catch (e) {
  isStandalone = false;
}
if (isStandalone) document.body.classList.add("standalone");
var uaStr = String(window.navigator.userAgent || "");
var isIOS = /iPad|iPhone|iPod/.test(uaStr) || (/Macintosh/.test(uaStr) && "ontouchend" in document);
var isAndroid = /Android/.test(uaStr);
var deferredPrompt = null;
function renderInstall() {
  var standalone = isStandalone;
  $("#installStandaloneNote").hidden = !standalone;
  $("#installPromptBox").hidden = standalone || !deferredPrompt;
  $("#installIosSteps").hidden = standalone || !isIOS;
  $("#installAndroidSteps").hidden = standalone || isIOS || !isAndroid;
  $("#installOtherSteps").hidden = standalone || isIOS || isAndroid;
}
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  deferredPrompt = e;
  renderInstall();
});
window.addEventListener("appinstalled", function () {
  deferredPrompt = null;
  isStandalone = true;
  document.body.classList.add("standalone");
  renderInstall();
  showToast("App installed - open Casino Games from your home screen");
});
function openInstall() {
  renderInstall();
  showScreen("scr-install");
}
$$(".install-open").forEach(function (b) {
  b.addEventListener("click", function () {
    sfx.click();
    openInstall();
  });
});
$("#installNowBtn").addEventListener("click", function () {
  if (!deferredPrompt) {
    renderInstall();
    return;
  }
  var installEvent = deferredPrompt;
  deferredPrompt = null;
  renderInstall();
  try {
    /* installEvent is the browser BeforeInstallPromptEvent - calling its
           own install method here, not the blocked window dialog. */
    var showInstall = installEvent.prompt.bind(installEvent);
    showInstall();
    if (installEvent.userChoice && typeof installEvent.userChoice.then === "function") {
      installEvent.userChoice.then(
        function (choice) {
          if (choice && choice.outcome === "accepted")
            showToast("Installing - look for Casino Games on your home screen");
          renderInstall();
        },
        function () {
          renderInstall();
        },
      );
    }
  } catch (e) {
    renderInstall();
  }
});
renderInstall();

