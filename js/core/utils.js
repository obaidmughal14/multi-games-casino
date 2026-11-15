"use strict";
var $ = function (s, c) {
  return (c || document).querySelector(s);
};
var $$ = function (s, c) {
  return Array.prototype.slice.call((c || document).querySelectorAll(s));
};
function fmt(n) {
  return Math.floor(n).toLocaleString("en-US");
}
function clampBet(v, max) {
  v = Math.floor(Number(v) || 0);
  if (v < 10) v = 10;
  if (max && v > max) v = max;
  return v;
}

