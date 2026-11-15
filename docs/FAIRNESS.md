# Fairness - house edge, randomness and verification

Fun credits only. No real money, no prizes, no payments. This document
explains how the house edge is built, how outcomes are drawn, how the
stats are recorded, and how anyone can check the claims. It also states
the honest limits: this is a browser-only free game with no independent
audit and no certified random number generator.

## RTP and house edge, in plain words

RTP (return to player) is the share of all wagered credits a game is
designed to pay back over very many rounds. House edge is what is left:

```
house edge = 100% - RTP
```

A game with RTP about 96% is designed to pay back about 96 credits for
every 100 credits wagered, averaged over thousands of rounds, keeping
about 4 credits. That average says nothing about one round or one
session: a player can win in any single round or session, and short
sessions vary a lot. The lobby states this the same way: the house edge
keeps the platform ahead over thousands of rounds, not in every round.

Every casino game shows its own RTP and house edge in its How to play
panel, together with its bet limits and pay table, before you play. The
lobby card for each game shows the same RTP. The full list, copied
exactly as the page states it, is in `docs/GAME-CATALOG.md`.

Most casino games state an RTP of about 95% to about 99%. The lowest
figures are stated plainly, not hidden: Mini Roulette about 92%, Crown
and Anchor about 93%, and American Roulette 94.74%. Some games state an
RTP with a qualifier because the result depends on decisions or aim,
for example Blackjack about 99% with best play, Pontoon about 98% with
good play, Fishing Frenzy about 96% where aim counts, and French
Roulette 98.65% on even-money bets. Read the qualifier as part of the
figure: weaker play or worse aim pays back less.

Mind games have no RTP. They are free, use no fun credits, and pay no
credits, so return to player does not apply to them.

## How the house edge is built

The edge comes from the pay table, not from changing outcomes. Each
game prices its wins slightly below fair odds:

1. **Outcomes are drawn first, from fixed chances.** Reels use fixed
   symbol weights, wheels use fixed pockets, dice and cards use fair
   decks and fair dice chances. The draw happens before any display.
2. **Wins are paid from a fixed table.** The table is printed on the
   game screen. Paying slightly less than the fair-odds prize is what
   creates the edge.
3. **Nothing adjusts the draw.** Outcomes are fair random with no
   balance-based or streak-based adjustment. The game does not make
   wins harder after a win, easier after losses, or different for high
   or low balances. The How to play panel on each casino game states
   this in the same words.
4. **Skill and timing games keep the same rule.** In aim and timing
   games the player's action affects the result, and the stated RTP
   assumes accurate or well-timed play, as the card says. The game does
   not secretly move targets or change odds mid-round.

### Two arithmetic checks

These two checks use only the stated rules and ordinary arithmetic, and
they reproduce the RTP figures the page states for these games.

**European Roulette, RTP 97.3%.** The wheel has 37 pockets. A
straight-up win pays 35 to 1, so a 1 credit bet returns 36 credits
(stake plus 35) on a win. Expected return per credit wagered is
36 / 37 = 97.3%. The same 36 / 37 ratio holds for the other standard
bets on the table, which is why the game states one RTP of 97.3%.

**American Roulette, RTP 94.74%.** The wheel has 38 pockets, including
the extra double zero, with the same 35 to 1 straight-up pay. Expected
return per credit wagered is 36 / 38 = 94.74%. The extra pocket is the
whole difference, and the game states the lower figure plainly.

For slots and the other games, the same idea applies with more steps:
multiply each outcome's chance by its pay-table prize, add them up, and
divide by the bet. The weights and pay tables are in `index.html`, one
readable file, so anyone can repeat the arithmetic for a game they
care about.

## Randomness

Outcomes use the browser's built-in `Math.random`. That is a
pseudo-random generator, good enough for free play with no money at
stake, and the code that uses it is in the open in `index.html`. It is
not a certified casino random number generator, no hardware entropy
source is used, and no independent audit or certification has been
done. Nobody should present this game as certified fair, and nobody
should reuse this randomness for anything involving real money.

There is no server draw, no seed shown to players, and no provably fair
hash scheme, because there is no server at all. The fairness claim here
rests on three checkable things: the code is one readable file with no
hidden requests, the pay tables and RTPs are printed before play, and
the live House Stats panel shows what actually happened on the device.

## House Stats: recorded exactly once per round

The lobby House Stats panel shows total wagered, total paid out, house
hold, rounds played, overall live RTP, and a per-game table of rounds,
wagered, returned and RTP. It is device-wide and labelled "All players
on this device" in the game.

All casino games record through one shared function in `index.html`
that adds exactly one round, with the wagered and paid amounts floored
to whole credits, to both the totals and the per-game row. Mind games
do not call it and never affect the stats. Because there is one path,
a round cannot be counted twice by one game and missed by another: if a
game finishes a round, it records one round, and if it does not finish,
it records none.

The panel has a Reset stats button. Resetting clears the device stats
only; it changes no odds and no balance.

### How to check the live RTP yourself

1. Play or watch many rounds of one game. Short runs prove nothing:
   tens of rounds can land far from the stated RTP by chance alone.
2. Open House Stats on the lobby and read that game's row. RTP there is
   returned divided by wagered, from real play on the device.
3. Over hundreds and then thousands of rounds, the live figure moves
   toward the stated RTP. It will rarely match it exactly, and it can
   sit above 100% for a long lucky run. That is normal randomness, not
   proof for or against the stated figure. Only very long runs settle
   close to it.

## Monte Carlo verification notes

No Monte Carlo simulation results are claimed in this document, and no
simulated RTP numbers are stated anywhere in this repo beyond the
design RTPs printed on the game screens. The notes below describe the
method, so anyone can run the check and judge the results themselves.

A Monte Carlo check for one game means: repeat the game's own draw and
pay-table logic for a large number of rounds with a fixed bet, total
the wagered and paid amounts, and divide paid by wagered. That ratio is
the simulated RTP. With enough rounds it converges on the design RTP
if the weights and pay table are as printed.

How to run one honestly:

- **Use the game's own logic.** Copy the draw and pay-table code for
  the game from `index.html` into a small script, or drive the page in
  a headless browser. Do not re-implement the game from memory: the
  point is to test the shipped code.
- **Fix the bet and the strategy.** For decision games, fix one
  strategy in advance (for example, a basic Blackjack strategy) and
  report it with the result, because the stated RTP assumes good play.
  For aim and timing games, a script cannot reproduce human aim, so a
  simulation there tests the prize structure only, not the stated RTP.
- **Use enough rounds.** Start at 100,000 rounds for a rough check and
  go to 1,000,000 or more before drawing conclusions. Report the round
  count, the bet, the strategy, and the simulated RTP together. A
  figure without a round count means nothing.
- **Expect a band, not an exact hit.** Even 1,000,000 rounds lands in a
  band around the design RTP. A result a few tenths of a percent away
  is consistent with correct code; a result several percent away, with
  a fixed bet and a stated strategy, is worth investigating.
- **Check the stats path too.** After scripted rounds, confirm the
  House Stats round count rose by exactly the number of rounds played,
  with no double counting and no missing rounds.

### Build checks already done

Before release, the game was exercised with scripted headless-browser
play-throughs: the 50 newest casino games were each played end to end
with exactly one House Stats round recorded each, an Omaha board bug
found by that check was fixed and re-verified, all 50 mind games were
started with zero script errors and no change to the balance, and
older games (Fruit Fortune Slots, Blackjack, Mines) were spot-played
successfully. Those checks prove the games run and record correctly.
They are not RTP simulations and are not presented as such.

## What is deliberately not built

No addiction hooks. There are no payments, no loss-chasing prompts, no
timers pushing the next bet, no streak punishments, no messages that
make stopping feel costly, and no near-miss tricks aimed at keeping
players betting. The daily bonus and missions are plain fun-credit
rewards with no money behind them, the refill exists so a low balance
never blocks play, and taking a break never costs anything. If a future
change adds anything that pressures continued play, it does not belong
in this project without a clear rethink of this section.

## Limits, stated plainly

- Stated RTPs are design targets from pay-table construction, not
  certified or audited figures. No regulator, lab or auditor has
  reviewed this game.
- Randomness is browser `Math.random`, not a certified generator.
- The local balance is editable by the player in their own browser,
  because there is no server. House Stats are honest records of local
  play, not tamper-proof records. See the security limits in
  `README.md`.
- Skill, aim and timing games state RTPs that assume good play. Poor
  play pays back less, and no simulation of a scripted player can
  stand in for human play in those games.
