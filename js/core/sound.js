"use strict";
/* ================= sound (synthesized, no audio files) ================= */
var AC = null,
  muted = INIT_MUTED;
function ac() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      AC = null;
    }
  }
  if (AC && AC.state === "suspended") AC.resume();
  return AC;
}
function tone(f, d, type, g, delay) {
  if (muted) return;
  var a = ac();
  if (!a) return;
  try {
    var t = a.currentTime + (delay || 0);
    var o = a.createOscillator(),
      gn = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(f, t);
    gn.gain.setValueAtTime(g || 0.07, t);
    gn.gain.exponentialRampToValueAtTime(0.0008, t + d);
    o.connect(gn);
    gn.connect(a.destination);
    o.start(t);
    o.stop(t + d + 0.05);
  } catch (e) {}
}
var sfx = {
  click: function () {
    tone(660, 0.06, "triangle", 0.05);
  },
  tick: function () {
    tone(880, 0.03, "square", 0.02);
  },
  chip: function () {
    tone(1250, 0.05, "triangle", 0.06);
    tone(1750, 0.05, "triangle", 0.04, 0.04);
  },
  coin: function () {
    tone(990, 0.09, "square", 0.05);
    tone(1320, 0.16, "square", 0.05, 0.08);
  },
  deal: function () {
    tone(420, 0.05, "triangle", 0.05);
  },
  gem: function () {
    tone(1180, 0.07, "sine", 0.06);
    tone(1560, 0.1, "sine", 0.05, 0.06);
  },
  boom: function () {
    tone(150, 0.4, "sawtooth", 0.1);
    tone(70, 0.5, "sine", 0.12, 0.03);
  },
  lose: function () {
    tone(320, 0.16, "triangle", 0.06);
    tone(210, 0.24, "triangle", 0.06, 0.13);
  },
  win: function () {
    [523, 659, 784, 1046].forEach(function (f, i) {
      tone(f, 0.16, "triangle", 0.07, i * 0.09);
    });
  },
  bigwin: function () {
    [523, 659, 784, 1046, 1318, 1568].forEach(function (f, i) {
      tone(f, 0.2, "square", 0.05, i * 0.1);
    });
    sfx.coin();
  },
};
var soundBtn = $("#soundBtn");
function renderSound() {
  soundBtn.textContent = muted ? "Sound: Off" : "Sound: On";
  soundBtn.setAttribute("aria-pressed", String(!muted));
}
soundBtn.addEventListener("click", function () {
  muted = !muted;
  if (curPlayer && curRec) {
    curRec.soundOn = !muted;
    saveProfileRec(curRec);
  } else {
    store.set("mgc_muted", muted ? "1" : "0");
  }
  renderSound();
  if (!muted) sfx.click();
});
renderSound();

