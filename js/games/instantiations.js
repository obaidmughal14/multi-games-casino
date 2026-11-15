"use strict";
/* ================= games 70-119: casino instantiations ================= */
SYM_SVG.mnsc = "s-star";
SYM_SVG.azsc = "s-bell";
SYM_SVG.vksc = "s-crown";
SYM_SVG.blsc = "s-cherry";
SYM_SVG.dfsc = "s-gem";
SYM_SVG.oasc = "s-clover";
SYM_SVG.wnsc = "s-gem";
SYM_SVG.hwsc = "s-star";
SYM_SVG.tmsc = "s-scratch";
nxSlot({
  key: "moon",
  scr: "scr-moon",
  name: "Mystic Moon Slots",
  wild: "wild",
  scatter: "mnsc",
  weights: nxW(["lemon", "clover", "pearl", "gem", "bell"], "mnsc"),
  pay: nxPay(NX_PAY, ["lemon", "clover", "pearl", "gem", "bell"]),
  scatterPay: { 3: 2, 4: 5, 5: 20 },
  fs: 8,
});
nxSlot({
  key: "aztec",
  scr: "scr-aztec",
  name: "Aztec Gold Slots",
  wild: "wild",
  scatter: "azsc",
  weights: nxW(["clover", "scarab", "ankh", "eye", "pharaoh"], "azsc"),
  pay: nxPay(NX_PAY, ["clover", "scarab", "ankh", "eye", "pharaoh"]),
  scatterPay: { 3: 2, 4: 5, 5: 20 },
  fs: 10,
  fsMult: 2,
});
nxSlot({
  key: "viking",
  scr: "scr-viking",
  name: "Viking Quest Slots",
  wild: "wild",
  scatter: "vksc",
  weights: nxW(["bell", "pearl", "ingot", "coin", "crown"], "vksc"),
  pay: nxPay(NX_PAY, ["bell", "pearl", "ingot", "coin", "crown"]),
  pickmap: true,
});
nxSlot({
  key: "blossom",
  scr: "scr-blossom",
  name: "Cherry Blossom Slots",
  wild: "wild",
  scatter: "blsc",
  weights: nxW(["cherry", "lemon", "grape", "pearl", "clover"], "blsc"),
  pay: nxPay(NX_PAY, ["cherry", "lemon", "grape", "pearl", "clover"]),
  scatterPay: { 3: 2, 4: 5, 5: 20 },
  fs: 8,
});
nxSlot({
  key: "dragonf",
  scr: "scr-dragonf",
  name: "Dragon Fortune Slots",
  wild: "wild",
  scatter: "dfsc",
  weights: nxW(["ruby", "emerald", "sapphire", "amber", "diamond"], "dfsc"),
  pay: nxPay(NX_PAY95, ["ruby", "emerald", "sapphire", "amber", "diamond"]),
  scatterPay: { 3: 2, 4: 5, 5: 20 },
  fs: 8,
});
nxSlot({
  key: "oasis2",
  scr: "scr-oasis2",
  name: "Desert Oasis Slots",
  wild: "wild",
  scatter: "oasc",
  weights: nxW(["clover", "pearl", "scarab", "ankh", "eye"], "oasc"),
  pay: nxPay(NX_PAY, ["clover", "pearl", "scarab", "ankh", "eye"]),
  pickmap: true,
});
nxSlot({
  key: "winter",
  scr: "scr-winter",
  name: "Winter Wonder Slots",
  wild: "wild",
  scatter: "wnsc",
  weights: nxW(["lemon", "pearl", "gem", "sapphire", "bell"], "wnsc"),
  pay: nxPay(NX_PAY, ["lemon", "pearl", "gem", "sapphire", "bell"]),
  scatterPay: { 3: 2, 4: 5, 5: 20 },
  fs: 8,
  stackWild: true,
});
nxSlot({
  key: "hollywood",
  scr: "scr-hollywood",
  name: "Hollywood Star Slots",
  wild: "wild",
  scatter: "hwsc",
  weights: nxW(["clover", "plum", "melon", "star", "crown"], "hwsc"),
  pay: nxPay(NX_PAY95, ["clover", "plum", "melon", "star", "crown"]),
  pickmap: true,
});
nxSlot({
  key: "treasure",
  scr: "scr-treasure",
  name: "Treasure Map Slots",
  wild: "wild",
  scatter: "tmsc",
  weights: nxW(["pearl", "coin", "ingot", "chest", "map"], "tmsc"),
  pay: nxPay(NX_PAY, ["pearl", "coin", "ingot", "chest", "map"]),
  pickmap: true,
});
v2NeonSlot({ key: "neon", scr: "scr-neon", name: "Neon Nights Slots" });
v2BJ({
  key: "sp21",
  scr: "scr-sp21",
  name: "Spanish 21 Lite",
  noTens: true,
  bjPay: 1.5,
  player21: true,
  bonus21: true,
  intro: "No 10s in the deck - your 21 always wins",
});
v2BJ({
  key: "dblexp",
  scr: "scr-dblexp",
  name: "Double Exposure Blackjack",
  bothUp: true,
  tiesDealer: true,
  bjPay: 1,
  intro: "Both dealer cards face up - dealer wins ties",
});
function payDeuces(s, hand) {
  var wilds = hand.filter(function (c) {
    return c.v === 2;
  }).length;
  if (wilds === 4) return 200;
  if (s[0] === 8 && s[1] === 14) return wilds ? 25 : 250;
  switch (s[0]) {
    case 9:
      return 15;
    case 7:
      return 5;
    case 6:
      return 3;
    case 5:
      return 2;
    case 4:
      return 2;
    case 3:
      return 1;
    default:
      return 0;
  }
}
function payBonusPoker(s) {
  switch (s[0]) {
    case 8:
      return s[1] === 14 ? 250 : 50;
    case 7:
      return s[1] === 14 ? 80 : s[1] <= 4 ? 40 : 25;
    case 6:
      return 8;
    case 5:
      return 5;
    case 4:
      return 4;
    case 3:
      return 3;
    case 2:
      return 2;
    case 1:
      return s[1] >= 11 ? 1 : 0;
    default:
      return 0;
  }
}
function payTens(s) {
  switch (s[0]) {
    case 8:
      return s[1] === 14 ? 250 : 50;
    case 7:
      return 25;
    case 6:
      return 6;
    case 5:
      return 5;
    case 4:
      return 4;
    case 3:
      return 3;
    case 2:
      return 2;
    case 1:
      return s[1] >= 10 ? 1 : 0;
    default:
      return 0;
  }
}
v2VideoPoker({
  key: "deuces",
  scr: "scr-deuces",
  name: "Deuces Wild Video Poker",
  wild2: true,
  pay: payDeuces,
});
v2VideoPoker({
  key: "bonuspoker",
  scr: "scr-bonuspoker",
  name: "Bonus Poker Video",
  pay: payBonusPoker,
});
v2VideoPoker({
  key: "tensbetter",
  scr: "scr-tensbetter",
  name: "Tens or Better Video Poker",
  pay: payTens,
});
v2Show({
  key: "paigow",
  scr: "scr-paigow",
  name: "Pai Gow Lite",
  mode: "paigow",
  intro: "Seven cards each, auto-split into 5 plus 2 - beat both dealer hands to win",
});
v2Show({
  key: "miss",
  scr: "scr-miss",
  name: "Mississippi Stud Lite",
  mode: "miss",
  intro: "Two cards plus a three-card board - fold or raise at each reveal",
});
v2Show({
  key: "ultimate",
  scr: "scr-ultimate",
  name: "Ultimate Hold'em Lite",
  mode: "ultimate",
  intro: "Two cards plus a five-card board against the dealer",
});
v2Show({
  key: "omaha",
  scr: "scr-omaha",
  name: "Omaha Showdown",
  mode: "omaha",
  intro: "Four hole cards - use exactly two plus three board cards",
});
v2Show({
  key: "badugi",
  scr: "scr-badugi",
  name: "Badugi Lite",
  mode: "badugi",
  intro: "Four cards - the lowest hand with different suits and ranks wins",
});
v2Show({
  key: "stud",
  scr: "scr-stud",
  name: "Seven Card Stud Lite",
  mode: "stud",
  intro: "Seven cards each - best five-card hand wins",
});
v2Show({
  key: "drawpoker",
  scr: "scr-drawpoker",
  name: "Draw Poker Showdown",
  mode: "draw",
  intro: "Five cards - discard and draw once against the dealer",
});
v2Show({
  key: "lowball",
  scr: "scr-lowball",
  name: "Lowball Showdown",
  mode: "lowball",
  intro: "Five cards - the lowest hand wins, Aces are low",
});
v2Show({
  key: "headsup",
  scr: "scr-headsup",
  name: "Heads-Up Poker Duel",
  mode: "headsup",
  intro: "Two cards each plus five shared cards - best hand wins",
});
v2Farkle({
  key: "farkle",
  scr: "scr-farkle",
  name: "Farkle Lite",
  intro: "Roll six dice - keep scoring dice, bank or risk rolling on",
});
v2DiceCombo({
  key: "dicecombo",
  scr: "scr-dicecombo",
  name: "Dice Combinations",
  intro: "Five dice, up to three rolls - the final combination pays",
});
v2Hazard({
  key: "hazard",
  scr: "scr-hazard",
  name: "Hazard Dice",
  intro: "Pick your main from 5 to 9, then roll",
});
v2UnderOver({
  key: "underover",
  scr: "scr-underover",
  name: "Under Over 7",
  intro: "Two dice - bet Under 7, Over 7 or Exactly 7",
});
v2LiarsDice({
  key: "liars",
  scr: "scr-liars",
  name: "Liar's Dice Lite",
  intro: "Five hidden dice each - bid, challenge or raise",
});
v2BigSix({
  key: "bigsix",
  scr: "scr-bigsix",
  name: "Big Six Wheel",
  intro: "Back a symbol and spin the big wheel",
});
v2Roulette2({
  key: "amroul",
  scr: "scr-amroul",
  name: "American Roulette",
  american: true,
  intro: "Thirty-eight pockets with 0 and 00",
});
v2Roulette2({
  key: "frroul",
  scr: "scr-frroul",
  name: "French Roulette",
  laPartage: true,
  intro: "Single zero with La Partage on even-money bets",
});
v2RollWin({
  key: "rollandwin",
  scr: "scr-rollandwin",
  name: "Roll and Win",
  intro: "Pick a number - correct rolls climb the ladder",
});
v2ChuckDuel({
  key: "chuckduel",
  scr: "scr-chuckduel",
  name: "Chuck Dice Duel",
  intro: "Three dice each - higher total wins",
});
v2Crash2({
  key: "train",
  scr: "scr-train",
  name: "Train Rush",
  intro: "The train speeds up - cash out before it derails",
});
v2GemHunt({
  key: "gemhunt",
  scr: "scr-gemhunt",
  name: "Gem Hunt Grid",
  intro: "An 8x8 grid, five hidden bombs - pick gems and cash out",
});
v2StairDice({
  key: "stairdice",
  scr: "scr-stairdice",
  name: "Stairway Dice Climb",
  intro: "Roll to climb twelve stairs - trap steps end the round",
});
v2BalloonPop({
  key: "balloonpop",
  scr: "scr-balloonpop",
  name: "Balloon Pop Frenzy",
  intro: "Pop balloons to build a multiplier - one holds the popper",
});
v2Vault({
  key: "vault",
  scr: "scr-vault",
  name: "Prize Vault",
  intro: "Twelve vault doors - one holds the jackpot vault",
});
v2Bingo90({
  key: "bingo90",
  scr: "scr-bingo90",
  name: "90 Ball Bingo",
  intro: "Your card against three AI cards - lines and full house pay",
});
v2KenoDeluxe({
  key: "kenodeluxe",
  scr: "scr-kenodeluxe",
  name: "Keno Deluxe",
  intro: "Pick up to fifteen numbers from eighty",
});
v2ScratchKing({
  key: "scratchking",
  scr: "scr-scratchking",
  name: "Scratch King",
  intro: "A 5x3 scratch card - rows pay",
});
v2InstantWin({
  key: "instantwin",
  scr: "scr-instantwin",
  name: "Instant Win Cards",
  intro: "Flip three cards - match two or three to win",
});
v2FishPro({
  key: "fishpro",
  scr: "scr-fishpro",
  name: "Fish Hunter Pro",
  intro: "Thirty seconds and fifteen shots at moving fish",
});
v2SharkHook({
  key: "sharkhook",
  scr: "scr-sharkhook",
  name: "Shark Hook",
  intro: "Hook fish to fill your bag - a shark can end it",
});
v2Cricket({
  key: "vcricket",
  scr: "scr-vcricket",
  name: "Virtual Cricket",
  intro: "A simulated match - pick Team A, Team B or Tie",
});
v2BBall({
  key: "bball",
  scr: "scr-bball",
  name: "Basketball Shootout",
  intro: "Five shots from spots you choose",
});
v2Golf({
  key: "golf",
  scr: "scr-golf",
  name: "Golf Putt Challenge",
  intro: "Five putts - read the break, pick aim and power",
});
v2Tennis({
  key: "tennis",
  scr: "scr-tennis",
  name: "Tennis Tiebreak",
  intro: "Pick a side each point - first to seven wins",
});
v2CoinTower({
  key: "cointower",
  scr: "scr-cointower",
  name: "Coin Tower",
  intro: "Time five coin drops to stack the tower",
});
/* ================= games 120-169: mind instantiations ================= */
mPairs({
  key: "mpairs",
  pairs: 8,
  timed: false,
  intro: "Sixteen cards, eight pairs - match them all in as few moves as you can.",
});
mSequence({
  key: "mseqrecall",
  colours: false,
  intro: "Tiles light in order on a 3x3 grid - repeat the sequence as it grows.",
});
mNumberMemory({
  key: "mnummem",
  intro: "A number grows by one digit each round - type it back exactly.",
});
mPictureMemory({
  key: "mpicmem",
  intro: "Study a grid of symbols, then spot the one that changed.",
});
mCardTrail({
  key: "mcardtrail",
  intro: "Cards flash in an order - tap them back in the same order.",
});
mWordMemory({ key: "mwordmem", intro: "Study six words, then pick them out of a list of twelve." });
mSequence({
  key: "mcolourseq",
  colours: true,
  intro: "Simon-style colours light in order - repeat the pattern as it grows.",
});
mGridMemory({
  key: "mgridmem",
  intro: "Cells light up briefly - tap the same cells after they hide.",
});
mPairs({
  key: "mpairsspeed",
  pairs: 6,
  timed: true,
  secs: 75,
  intro: "Six pairs against the clock - match them before the time runs out.",
});
mMissingSymbol({
  key: "mmissing",
  intro: "Study a set of symbols - one vanishes, pick which one.",
});
mQuiz({
  key: "madd",
  mode: "sprint",
  secs: 30,
  gen: gAdd,
  pv: 1,
  intro: "Thirty seconds of addition - one point per correct answer.",
  startNote: "Go - as many correct sums as you can in 30 seconds.",
});
mQuiz({
  key: "msub",
  mode: "sprint",
  secs: 30,
  gen: gSub,
  pv: 1,
  intro: "Thirty seconds of subtraction - one point per correct answer.",
  startNote: "Go - as many correct answers as you can in 30 seconds.",
});
mQuiz({
  key: "mmulttab",
  mode: "rounds",
  rounds: 10,
  gen: gMulTable,
  pv: 10,
  intro: "Pick a times table in the panel below, then answer ten questions on it.",
});
mQuiz({
  key: "mdiv",
  mode: "rounds",
  rounds: 10,
  gen: gDiv,
  pv: 10,
  intro: "Ten division questions with whole-number answers.",
});
mQuiz({
  key: "mmix",
  mode: "rounds",
  rounds: 10,
  gen: gMix,
  pv: 10,
  intro: "Ten mixed questions - add, subtract, multiply and divide, rising in difficulty.",
});
mQuiz({
  key: "mbonds",
  mode: "rounds",
  rounds: 10,
  gen: gBonds,
  pv: 10,
  intro: "Number bonds - find the missing number that makes 10 or 100.",
});
mQuiz({
  key: "mestimate",
  mode: "rounds",
  rounds: 10,
  gen: gEstimate,
  pv: 10,
  intro: "Estimate each answer - the closest estimate scores 10 points.",
});
mQuiz({
  key: "moddnum",
  mode: "rounds",
  rounds: 10,
  gen: gOddNum,
  pv: 10,
  intro: "One number breaks the pattern - find it.",
});
mQuiz({
  key: "mpatterns",
  mode: "rounds",
  rounds: 10,
  gen: gPattern,
  pv: 10,
  intro: "Find the next number in each sequence.",
});
mQuiz({
  key: "mgreater",
  mode: "sprint",
  secs: 30,
  gen: gGreater,
  pv: 1,
  intro: "Thirty seconds - tap the bigger value each time.",
});
mQuiz({
  key: "mtimesrace",
  mode: "rounds",
  rounds: 20,
  gen: gMul,
  pv: 5,
  intro: "Twenty multiplication questions against your own best score.",
});
mQuiz({
  key: "mfraction",
  mode: "rounds",
  rounds: 10,
  gen: gFraction,
  pv: 10,
  intro: "Pick the larger fraction - the bars show each value.",
});
mSudoku({
  key: "msudoku4",
  size: 4,
  intro: "A gentle 4x4 Sudoku - every row, column and 2x2 box holds 1 to 4.",
});
mSudoku({
  key: "msudoku6",
  size: 6,
  intro: "A 6x6 Sudoku - every row, column and 2x3 box holds 1 to 6.",
});
mLogicGrid({ key: "mlogicgrid", intro: "A 3x3 clue puzzle - match each friend to their pet." });
mMaze({ key: "mmaze", intro: "Guide the gold dot through a fresh maze to the teal goal." });
mSliding({ key: "msliding", intro: "The classic 3x3 sliding puzzle - order the tiles 1 to 8." });
mHanoi({
  key: "mhanoi",
  intro: "Move three discs to Peg 3 - never a larger disc on a smaller one.",
});
mQuiz({
  key: "mmatchstick",
  mode: "rounds",
  rounds: 6,
  gen: gMatchstick,
  pv: 20,
  intro: "Each equation is one match away from correct - pick the fixed equation.",
});
mQuiz({
  key: "mpatlogic",
  mode: "rounds",
  rounds: 10,
  gen: gPatternLogic,
  pv: 10,
  intro: "What shape comes next in each pattern?",
});
mQuiz({
  key: "moddshape",
  mode: "rounds",
  rounds: 10,
  gen: gOddShape,
  pv: 10,
  intro: "One shape does not belong with the others.",
});
mCodeBreaker({
  key: "mcode",
  intro: "Guess a 4-digit code from the hints after each guess - 8 guesses.",
});
mLightsOut({
  key: "mlightsout",
  intro: "A 3x3 Lights Out grid - tap to flip a light and its neighbours.",
});
mNonogram({
  key: "mnonogram",
  intro: "A 5x5 picture logic puzzle - row and column clues describe the filled runs.",
});
mScramble({ key: "mscramble", intro: "Unscramble ten words - a hint is available on each word." });
mWordSearch({
  key: "mwordsearch",
  intro: "Five hidden words in a letter grid - tap the first and last letter of each.",
});
mHangman({
  key: "mhangman",
  intro: "Guess three words letter by letter - 6 wrong guesses per word.",
});
mAnagram({
  key: "managram",
  intro: "Make as many words as you can from the given letters in 60 seconds.",
});
mQuiz({
  key: "mrhyme",
  mode: "rounds",
  rounds: 10,
  gen: gRhyme,
  pv: 10,
  intro: "Pick the word that rhymes.",
});
mQuiz({
  key: "mopposite",
  mode: "rounds",
  rounds: 10,
  gen: gOpposite,
  pv: 10,
  intro: "Pick the antonym - the opposite word.",
});
mQuiz({
  key: "mcategory",
  mode: "rounds",
  rounds: 10,
  gen: gCategory,
  pv: 10,
  intro: "Sort each word into the right category, fast.",
});
mQuiz({
  key: "mspelling",
  mode: "rounds",
  rounds: 10,
  gen: gSpelling,
  pv: 10,
  intro: "Pick the correctly spelled word from three options.",
});
mReaction({
  key: "mreaction",
  intro: "Tap when the panel turns green - best of five attempts, fastest time wins.",
});
mQuiz({
  key: "mstroop",
  mode: "sprint",
  secs: 30,
  gen: gStroop,
  pv: 1,
  intro: "Tap the ink colour, not the word - thirty seconds.",
  styleOpts: function (box) {
    $$(".optbtn", box).forEach(function (b) {
      var c = null;
      COLOURS.forEach(function (x) {
        if (x[0] === b.textContent) c = x;
      });
      if (c) {
        b.style.background = c[1];
        b.style.color = "#fff";
      }
    });
  },
});
mFindDiff({
  key: "mfinddiff",
  intro: "Spot the one tile that differs - faster and bigger grids as you score.",
});
mAim({
  key: "maim",
  intro: "Tap targets as they appear for thirty seconds - they shrink over time.",
});
mKeepCount({
  key: "mkeepcount",
  intro: "Stars pass across the screen - count them and answer the total.",
});
mFollowBall({
  key: "mfollowball",
  intro: "Track one ball under three shuffling cups - pick where it ended.",
});
mQuiz({
  key: "msamediff",
  mode: "sprint",
  secs: 30,
  gen: gSameDiff,
  pv: 1,
  intro: "Thirty seconds - are the two patterns the same or different?",
});
mQuiz({
  key: "mbrainmix",
  mode: "rounds",
  rounds: 12,
  gen: function (r) {
    var gens = [
      gAdd,
      gPattern,
      gSameDiff,
      gRhyme,
      gOddNum,
      gFraction,
      gMul,
      gOpposite,
      gEstimate,
      gPatternLogic,
      gSub,
      gOddShape,
    ];
    return gens[(r - 1) % gens.length](r);
  },
  pv: 10,
  intro:
    "Twelve mixed mini-rounds - memory of patterns, maths, logic, words and focus in one sprint.",
});
