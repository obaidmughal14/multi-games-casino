# Multi Games Casino - free games

Play 169 original games in your browser. 119 casino games share one
credit balance, plus 50 free mind games that use no credits at all.

**Play it live:** https://obaidasiaone-multi-games-casino.static.hf.space

Free to play. Unlimited credits. Play as much as you want, just for fun.
No sign-up wall. Guest play is free, and optional local profiles live
only on your own device.

This is a free play casino for entertainment, with an 18-plus free-play
notice shown once on first launch. Play for fun only.

## What is inside

- **119 casino games**, each with its own bet limits, pay table, RTP and
  house edge shown in its How to play panel before you play.
- **50 mind games** across memory, maths, logic, words and focus, all
  free, with best scores kept on your device.
- **One shared fun-credit balance** starting at 10,000 credits, a daily
  bonus of 1,000 credits, a 5,000 credit refill when the balance drops
  under 100, daily missions, levels and badges.
- **House Stats panel** on the lobby showing total wagered, total paid
  out, house hold, rounds played and the live overall RTP from real
  play on the device, plus a per-game table.
- **Local-only profiles**: create a player with a display name, a unique
  @username, an avatar icon and a favorite category. No password, no
  email, no phone, no payments. Each profile keeps its own balance,
  missions, daily bonus, level, badges and best scores on the device.
  Guest play keeps working with no profile at all.
- **Install as an app** from the phone browser, with a manifest, icons
  and an in-game Install app screen. No store download needed.
- **One single page** (`index.html`) with no external requests. Nothing
  you play or type leaves your device. No tracking, no ads, no accounts
  on a server, because there is no server.

## Game catalog summary

169 games in 10 categories. The full list, with sub-category and the RTP
as stated on the page for every game, is in `docs/GAME-CATALOG.md`.

| Category | Games | What is in it |
|---|---|---|
| Slots | 24 | Video slots, jackpot slots, a classic 3-reel game and a cluster game |
| Table | 30 | Blackjack, roulette, baccarat, poker table games and card duels |
| Dice | 14 | Dice totals, dice boards and dice risk games |
| Wheel | 3 | Spin wheels, including Big Six Wheel |
| Crash and Climb | 13 | Crash games, climb and grid games, and Plinko |
| Arcade and Skill | 15 | Skill shots and sports games |
| Fishing | 4 | Aim and timing fishing games |
| Bingo and Lottery | 12 | Bingo, keno and lottery, and scratch cards |
| Video Poker | 4 | Jacks-style, Deuces Wild, Bonus Poker and Tens or Better |
| Mind | 50 | Memory (10), Maths (12), Logic (12), Words (8), Focus (8) |
| **Total** | **169** | **119 casino games plus 50 free mind games** |

The lobby also shows 4 featured cards at the top. They are shortcuts to
games already in the list above, not extra games.

## How to play

1. Open the live site link above, or run the game locally (see below).
2. Pick a game from the lobby. Use search or the category filters, or
   tap a featured card.
3. Read the How to play panel on the game screen. It states the bet
   limits, the rules, the pay table, the RTP and the house edge.
4. Set a bet with the chips or the plus and minus buttons, then play.
   Casino games use the shared fun-credit balance. Mind games are free
   and never touch the balance.
5. Check House Stats on the lobby any time to see how play on the
   device is running against the stated RTPs.

Starting balance is 10,000 fun credits. Claim 1,000 bonus credits once
a day from the lobby, and use the 5,000 credit refill whenever the
balance drops under 100. Taking a break never costs anything.

## Fun credits and fairness

RTP (return to player) is the share of all wagered credits a game is
designed to pay back over very many rounds. House edge is 100 minus RTP.
Most casino games here state an RTP of about 95% to about 99%, so the
house edge is about 1% to about 5%. Three games state lower figures
plainly on their cards and panels: Mini Roulette about 92%, Crown and
Anchor about 93%, and American Roulette 94.74%. A few games state an
RTP that depends on how you play, such as Blackjack about 99% with best
play, or Fishing Frenzy about 96% where aim counts. The exact wording
for every game is in `docs/GAME-CATALOG.md`.

Outcomes are fair random, drawn before any display, with no adjustment
based on balance or streaks. The house edge only appears over thousands
of rounds: any single round or session can finish in profit, and real
wins and real losses both happen. See `docs/FAIRNESS.md` for the
house-edge method, how the stats are recorded exactly once per round,
how to check the live RTP yourself, and the honest limits of a
browser-only game with no independent audit.

No addiction hooks are built into this game. There are no payments, no
loss-chasing prompts, no countdown timers pushing the next bet, no
streak punishments, and no messages that make stopping feel costly.
Daily bonus and missions are plain fun-credit rewards with no money
behind them, and the refill exists so a low balance never blocks play.

## Profiles stay on the device

Profiles are local only. There is no account server, no sync, and no
sign-in that works on another device. A profile created on one phone or
browser stays on that phone or browser. Clearing browser data removes
profiles, balances and best scores. Cross-device sync would need a
backend project owned by the site owner, and it is not part of this
build. House Stats are device-wide and labelled "All players on this
device" in the game.

## Install as an app (phone browser, no store)

- **Android:** open the live site in Chrome, tap the menu, then tap
  Install app or Add to Home Screen. The in-game Install app screen
  also offers an Install now button when the browser supports it.
- **iPhone:** open the live site in Safari, tap Share, then tap Add to
  Home Screen.
- **Android APK:** a native WebView wrapper is in `android/` and builds
  a signed release APK that loads the live site. See "Build the APK"
  below and `docs/DEPLOYMENT.md`. The APK needs internet access to load
  the games and shows a Retry screen when offline.

## Run locally

Any static file server works. From this folder:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/index.html in a browser.

For the install prompt and manifest to work locally, serve over
localhost (as above) or HTTPS. Opening the file directly still plays
all 169 games, but install features may not appear.

## Deploy

The live site runs as a free HuggingFace Static Space. The same files
also deploy to GitHub Pages or any static host, since the game is one
HTML file plus a manifest and icons, with no build step and no server
code. Full steps, including the HuggingFace README frontmatter and the
GitHub Pages steps, are in `docs/DEPLOYMENT.md`.

## Build the APK

The Android wrapper is a minimal native WebView app with no
dependencies, no tracking SDKs, no ads and no payments. It loads only
the live site URL. Requirements: JDK 17, Android SDK with platform 34
and build-tools 34.0.0, Gradle 8.5 with Android Gradle Plugin 8.2.2.

```sh
cd android
chmod +x gradlew
./gradlew assembleDebug
```

A debug build needs no keystore. A signed release build reads signing
details from `android/keystore/keystore.properties`, which is local
only and never committed: see `android/README.md` and
`docs/DEPLOYMENT.md` for the release steps and the keystore backup
warning. The same key must sign every future update, or Android will
refuse to update the installed app.

App details: package `com.multigamescasino.app`, app name Casino Games,
version 1.0 (versionCode 1), Android 7.0 (API 24) and up, target API 34,
permissions Internet and view network state only.

## Files in this repo

| Path | What it is |
|---|---|
| `index.html` | Lobby markup and all 169 game screens; loads the styles and scripts below in order |
| `css/` | 11 stylesheets: base, header, profiles, lobby, screens, game styles, install, phone fixes (see `docs/STRUCTURE.md`) |
| `js/core/` | Shared logic: helpers, storage, profiles, balance, sound, lobby, navigation, stats |
| `js/maths/` | Game maths: slot engine, shared helpers, card evaluators, game engines |
| `js/games/` | Game logic: games 1-69, engagement, mind engines, instantiations |
| `js/app/` | Screens and startup: init, lobby sections, profiles UI, install, first launch |
| `manifest.json` | Web app manifest for install-as-app |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Original chip-and-star app icons (see note below) |
| `docs/STRUCTURE.md` | Folder hierarchy, file load order, and the rules for editing safely |
| `docs/GAME-CATALOG.md` | All 169 games with category, sub-category and stated RTP |
| `docs/FAIRNESS.md` | House-edge method, stats recording and verification notes |
| `docs/DEPLOYMENT.md` | HuggingFace Space, GitHub Pages and APK build steps |
| `android/` | Android WebView wrapper source (Gradle project) |
| `tools/make_icons.py` | Regenerates the web icons with Python PIL, no assets needed |
| `tools/make_android_icons.py` | Regenerates the Android launcher icons from the same art |
| `LICENSE` | MIT License |

## Files not in the GitHub push (and how to restore them)

The GitHub push for this repo used a text-only snapshot route that
cannot carry binary files, so the binary files below are not in the
GitHub copy even though they are part of the complete local package.
They are not lost: every one can be regenerated or restored locally,
and the live website already has the web icons.

| Excluded file | Why | How to restore |
|---|---|---|
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | PNG binaries, text-only push | Run `python3 tools/make_icons.py` (needs Pillow: `pip install pillow`) |
| `android/app/src/main/res/mipmap-*/ic_launcher*.png` (15 files) | PNG binaries, text-only push | Run `python3 tools/make_android_icons.py` (needs Pillow) |
| `android/gradle/wrapper/gradle-wrapper.jar` | Binary jar, text-only push | Run `gradle wrapper` with a Gradle 8.5 install, or copy the jar from a Gradle install |

Everything else in the local package, including `index.html`,
`manifest.json`, all docs, all Android source and config, and both
icon scripts, is in the GitHub push. The `.gitignore` in this repo does
not exclude the icons, so they can be added later through any
binary-capable route (a normal `git push`, or the GitHub web upload).

Never committed, by design: the Android release keystore, its
properties file, and `local.properties`. These hold signing secrets and
machine paths, and `.gitignore` excludes them. See the security limits
below.

## Security limits (read before trusting the balance)

- **No server, no server-grade anti-cheat.** This is a static page. The
  fun-credit balance, profiles, missions and best scores live in
  browser localStorage on the player's own device, so a player can edit
  their own local balance in their own browser. That is accepted here
  because credits have no value, cannot be withdrawn, and affect no one
  else. Do not build payments, prizes, leaderboards or cross-player
  competition on top of this local balance without a backend.
- **No real-money gambling.** There are no payments, deposits, bets
  with money, prizes or cashout anywhere in this code, and no payment
  SDKs in the Android wrapper. Adding real money would need a gambling
  licence, age gating, geo-fencing, KYC, a licensed payment processor
  and a server wallet, and it is not part of this project.
- **Randomness is browser-grade.** Outcomes use the browser's
  `Math.random`. That is fine for free play with no money at stake, and
  the code is a single readable file anyone can inspect. It is not a
  certified casino random number generator, and no independent audit
  has been done. See `docs/FAIRNESS.md`.
- **Signing keys stay local.** The release keystore and its passwords
  live only on the build machine, are excluded by `.gitignore`, and
  must never be committed, emailed or pasted into docs or chat. Keep a
  backup of the keystore file in a safe private place.
- **Privacy.** No personal data is collected, no analytics or tracking
  code is included, and the page makes no external requests. The only
  network use is loading the page itself (and, in the APK, loading the
  live site). Profiles ask for no password, email or phone number.

## Original work note

All 169 games, the lobby, the art, the icons and the docs in this repo
are original work built for this project. No game names, art, sounds or
code were copied from JILI or any other game maker, and no brand assets
are used. Where a game follows the well known rules of a classic game
(such as Blackjack, Roulette or Bingo), only the public rules are
followed, with original presentation, pay tables and code. The icons
are original chip-and-star art drawn with code in `tools/make_icons.py`.

## License

MIT License. See `LICENSE`. Copyright (c) 2026 Obaid Mughal.
