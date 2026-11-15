"use strict";
/* ================= safe storage =================
       Some webviews block localStorage (third-party storage rules, private
       mode). A direct localStorage call would throw and kill the whole
       script before the game cards render, so every access goes through
       this wrapper and falls back to in-memory values. */
var store = {
  mem: {},
  get: function (k) {
    try {
      var v = window.localStorage.getItem(k);
      return v === null ? (k in this.mem ? this.mem[k] : null) : v;
    } catch (e) {
      return k in this.mem ? this.mem[k] : null;
    }
  },
  set: function (k, v) {
    this.mem[k] = String(v);
    try {
      window.localStorage.setItem(k, String(v));
    } catch (e) {}
  },
  remove: function (k) {
    delete this.mem[k];
    try {
      window.localStorage.removeItem(k);
    } catch (e) {}
  },
};

