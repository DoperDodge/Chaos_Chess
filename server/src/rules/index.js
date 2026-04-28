// Per-rule server-side mechanics. Each module exports a default object with optional hooks:
//   onActivate(session, instance)               -> events[]
//   onDeactivate(session, instance, reason)     -> events[]
//   onTurnStart(session, instance, ctx)         -> events[]
//   onMoveAttempt(session, instance, ctx)       -> events[] (may include {type:'move-blocked',reason})
//   onMoveEnd(session, instance, ctx)           -> events[]
//   onTurnEnd(session, instance, ctx)           -> events[]
//
// Rules without an implementation file fall through to a no-op activation. The animation/visual
// is still rendered on the client (driven by metadata). This lets us ship all 100 names + cards
// while progressively implementing the mechanics.
import bombCarrier from './01-bomb-carrier.js';
import clusterBomb from './02-cluster-bomb.js';
import suicidePawn from './04-suicide-pawn.js';
import chainReaction from './05-chain-reaction.js';
import explodingPawn from './08-exploding-pawn.js';
import minefield from './09-minefield.js';
import doomsdayTile from './10-doomsday-tile.js';
import pawnReinforcements from './12-pawn-reinforcements.js';
import knightRecruit from './13-knight-recruit.js';
import doppelganger from './19-doppelganger.js';
import twinTowers from './20-twin-towers.js';
import speedDemon from './26-speed-demon.js';
import phantomStep from './30-phantom-step.js';
import timeFreeze from './32-time-freeze.js';
import doubleTap from './33-double-tap.js';
import doomsdayClock from './39-doomsday-clock.js';
import queensSacrifice from './47-queens-sacrifice.js';
import lavaPools from './52-lava-pools.js';
import lightningStorm from './53-lightning-storm.js';
import volcano from './57-volcano.js';
import wallBuild from './73-wall-build.js';
import frostbite from './89-frostbite.js';
import royalGuard from './81-royal-guard.js';
import cursedDay from './96-cursed-day.js';
import truce from './99-truce.js';
import apocalypse from './100-apocalypse.js';
import russianRoulette from './93-russian-roulette.js';
import coinFlip from './94-coin-flip.js';
import resetButton from './92-reset-button.js';
import wildCard from './91-wild-card.js';
import defection from './97-defection.js';
import berserker from './84-berserker.js';
import powerSurge from './90-power-surge.js';
import cursedPiece from './86-cursed-piece.js';
import sandstorm from './59-sandstorm.js';
import fogOfWar from './68-fog-of-war.js';

export const ruleImplementations = {
  1: bombCarrier,
  2: clusterBomb,
  4: suicidePawn,
  5: chainReaction,
  8: explodingPawn,
  9: minefield,
  10: doomsdayTile,
  12: pawnReinforcements,
  13: knightRecruit,
  19: doppelganger,
  20: twinTowers,
  26: speedDemon,
  30: phantomStep,
  32: timeFreeze,
  33: doubleTap,
  39: doomsdayClock,
  47: queensSacrifice,
  52: lavaPools,
  53: lightningStorm,
  57: volcano,
  59: sandstorm,
  68: fogOfWar,
  73: wallBuild,
  81: royalGuard,
  84: berserker,
  86: cursedPiece,
  89: frostbite,
  90: powerSurge,
  91: wildCard,
  92: resetButton,
  93: russianRoulette,
  94: coinFlip,
  96: cursedDay,
  97: defection,
  99: truce,
  100: apocalypse,
};
