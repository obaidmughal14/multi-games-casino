# Structure - folders, load order, and editing rules

The website is plain static files. There is no build step, no bundler,
and no framework. `index.html` loads 11 stylesheets and 28 scripts with
plain `<link>` and `<script>` tags. The files below are listed in the
exact order they load. That order matters: scripts share one global
scope, and a file may only use names defined by the files before it.

```
index.html            Lobby markup and all 169 game screens
manifest.json         Web app manifest for install-as-app
css/
  base.css            Variables, reset, page layout, shared utilities
  header.css          Global header and balance bar
  profiles.css        Local profile screens and rows
  lobby.css           Jackpot ticker, lobby controls, game cards, wins ticker
  screens.css         Shared game-screen layout
  games-core.css      Slots, roulette, blackjack, mines, crash, wheel
  games-v3-v4.css     Motion, popups, stats, neon lobby, dice, cards, plinko,
                      keno, bingo, fishing, scratch
  games-v5.css        Games 25-69 styles
  games-169.css       Sections, mind games, polish, Hanoi board fix
  install.css         Install-as-app screens
  responsive.css      Phone-only fixes (v7) and chip fix (v8); loads last
js/
  core/               Shared logic used by every game
    utils.js          DOM helpers, number formatting, bet clamping
    storage.js        Safe storage wrapper (localStorage with fallback)
    profiles.js       Free local profiles: list, records, per-player keys
    balance.js        Shared fun-credit balance and its display
    sound.js          Synthesized sound effects, no audio files
    ui.js             Messages, win banner, win feed, toasts
    stats.js          House Stats, per-game records, recent-rounds history
    jackpot.js        Mega jackpot ticker
    navigation.js     Screen switching (instant scroll to top)
    lobby.js          Lobby cards, filters, search, bet boxes
  maths/              Shared game maths (random draws, paylines, evaluators)
    slot-engine.js    Weighted picks, random grids, payline evaluation
    helpers-40-69.js  Shared helpers for games 40-69
    generic-slots.js  Generic slot engine for games 40-46
    evaluators.js     Shared 5-card and 4-card poker evaluators
    engines.js        Poker, blackjack, video poker, showdown, dice, crash,
                      climb, pick, lottery, fishing and sports engines
  games/              Game logic; each game's own payout maths lives with
                      that game, because it belongs to that game alone
    games-01-08.js    Games 1-8 (Fruit Fortune through Lucky Wheel)
    engagement.js     Daily bonus, missions, levels, badges, best wins
    games-09-39.js    Games 9-39 (Fishing Frenzy through Coin Flip Streak)
    games-47-48.js    Pontoon, Red Dog Poker
    games-49-69.js    Games 49-69 (Four Card Poker through Virtual Football)
    neon-nights.js    Neon Nights custom slot (win re-spins)
    mind-engines.js   Mind game scaffold and memory, word, logic, focus engines
    instantiations.js Games 70-119 casino and 120-169 mind instantiations
  app/                Screens and startup
    init.js           First balance render
    lobby-sections.js Lobby section counts and session-time note
    profiles-ui.js    Create, switch and setup profile screens
    install.js        Install prompt, install screen, standalone mode
    boot.js           First-launch notice (once per device)
```

## Rules for editing

1. Keep the load order. Do not reorder the `<link>` or `<script>` tags
   in `index.html`, and do not move code between files unless you keep
   the same relative order. A script that runs at load time (for
   example, building a slot grid) needs the helpers from earlier files.
2. Keep `"use strict";` as the first line of every `.js` file. The
   original single script ran in strict mode, and each file keeps it.
3. Styles cascade in load order. `css/responsive.css` loads last on
   purpose: its phone-only rules override the earlier files.
4. No build step. After editing, the files are the website. Serve the
   folder over HTTP or HTTPS to test; opening `index.html` directly
   from disk also works, but install-as-app needs HTTPS.
5. Formatting: the files are formatted with Prettier (print width 100,
   2 spaces). Run Prettier after editing to keep the style consistent.
6. The split is provable: joining the `css/` files in load order gives
   back the original stylesheet byte for byte, and joining the `js/`
   files (minus the repeated strict-mode line) gives back the original
   script byte for byte. No statement was moved or rewritten to make
   the split, so behavior is unchanged.
