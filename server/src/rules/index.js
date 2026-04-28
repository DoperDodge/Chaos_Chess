// Per-rule server-side mechanics. Each module exports a default object with optional hooks:
//   onActivate(session, instance)               -> events[]
//   onDeactivate(session, instance, reason)     -> events[]
//   onTurnStart(session, instance, ctx)         -> events[]
//   onMoveAttempt(session, instance, ctx)       -> events[] (may include {type:'move-blocked',reason})
//   onMoveEnd(session, instance, ctx)           -> events[]
//   onTurnEnd(session, instance, ctx)           -> events[]
//
// Rules without an implementation file fall through to a no-op activation.

import r1 from './01-bomb-carrier.js';
import r2 from './02-cluster-bomb.js';
import r3 from './03-sticky-mine.js';
import r4 from './04-suicide-pawn.js';
import r5 from './05-chain-reaction.js';
import r6 from './06-nuclear-option.js';
import r7 from './07-grenade-toss.js';
import r8 from './08-exploding-pawn.js';
import r9 from './09-minefield.js';
import r10 from './10-doomsday-tile.js';
import r11 from './11-royal-recruit.js';
import r12 from './12-pawn-reinforcements.js';
import r13 from './13-knight-recruit.js';
import r14 from './14-phantom-bishop.js';
import r15 from './15-skeleton-uprising.js';
import r16 from './16-dragon-egg.js';
import r17 from './17-mercenary.js';
import r18 from './18-trojan-horse.js';
import r19 from './19-doppelganger.js';
import r20 from './20-twin-towers.js';
import r21 from './21-pacman-board.js';
import r22 from './22-mirror-board.js';
import r23 from './23-reverse-gravity.js';
import r24 from './24-slippery-floor.js';
import r25 from './25-quicksand.js';
import r26 from './26-speed-demon.js';
import r27 from './27-knights-curse.js';
import r28 from './28-diagonal-pawns.js';
import r29 from './29-backwards-pawns.js';
import r30 from './30-phantom-step.js';
import r31 from './31-time-warp.js';
import r32 from './32-time-freeze.js';
import r33 from './33-double-tap.js';
import r34 from './34-slow-motion.js';
import r35 from './35-fast-forward.js';
import r36 from './36-groundhog-day.js';
import r37 from './37-future-sight.js';
import r38 from './38-chrono-lock.js';
import r39 from './39-doomsday-clock.js';
import r40 from './40-pause-tile.js';
import r41 from './41-passing-the-torch.js';
import r42 from './42-anywhere-promotion.js';
import r43 from './43-royal-marriage.js';
import r44 from './44-knight-errant.js';
import r45 from './45-bishops-beam.js';
import r46 from './46-iron-rook.js';
import r47 from './47-queens-sacrifice.js';
import r48 from './48-pawn-king.js';
import r49 from './49-mind-swap.js';
import r50 from './50-berserker-pawn.js';
import r51 from './51-icy-board.js';
import r52 from './52-lava-pools.js';
import r53 from './53-lightning-storm.js';
import r54 from './54-hurricane.js';
import r55 from './55-tsunami.js';
import r56 from './56-earthquake.js';
import r57 from './57-volcano.js';
import r58 from './58-aurora.js';
import r59 from './59-sandstorm.js';
import r60 from './60-snow-day.js';
import r61 from './61-mind-control.js';
import r62 from './62-possession.js';
import r63 from './63-confusion.js';
import r64 from './64-decoy-king.js';
import r65 from './65-disguise.js';
import r66 from './66-camouflage.js';
import r67 from './67-spy-network.js';
import r68 from './68-fog-of-war.js';
import r69 from './69-nightmare.js';
import r70 from './70-dream-walk.js';
import r71 from './71-pitfall.js';
import r72 from './72-tripwire.js';
import r73 from './73-wall-build.js';
import r74 from './74-spike-trap.js';
import r75 from './75-tar-pit.js';
import r76 from './76-magnetic-field.js';
import r77 from './77-black-hole.js';
import r78 from './78-wormhole.js';
import r79 from './79-acid-pool.js';
import r80 from './80-cursed-square.js';
import r81 from './81-royal-guard.js';
import r82 from './82-holy-ground.js';
import r83 from './83-vampire-bishop.js';
import r84 from './84-berserker.js';
import r85 from './85-iron-skin.js';
import r86 from './86-cursed-piece.js';
import r87 from './87-plague.js';
import r88 from './88-healing-aura.js';
import r89 from './89-frostbite.js';
import r90 from './90-power-surge.js';
import r91 from './91-wild-card.js';
import r92 from './92-reset-button.js';
import r93 from './93-russian-roulette.js';
import r94 from './94-coin-flip.js';
import r95 from './95-lucky-day.js';
import r96 from './96-cursed-day.js';
import r97 from './97-defection.js';
import r98 from './98-dance-off.js';
import r99 from './99-truce.js';
import r100 from './100-apocalypse.js';

export const ruleImplementations = {
  1: r1, 2: r2, 3: r3, 4: r4, 5: r5, 6: r6, 7: r7, 8: r8, 9: r9, 10: r10,
  11: r11, 12: r12, 13: r13, 14: r14, 15: r15, 16: r16, 17: r17, 18: r18, 19: r19, 20: r20,
  21: r21, 22: r22, 23: r23, 24: r24, 25: r25, 26: r26, 27: r27, 28: r28, 29: r29, 30: r30,
  31: r31, 32: r32, 33: r33, 34: r34, 35: r35, 36: r36, 37: r37, 38: r38, 39: r39, 40: r40,
  41: r41, 42: r42, 43: r43, 44: r44, 45: r45, 46: r46, 47: r47, 48: r48, 49: r49, 50: r50,
  51: r51, 52: r52, 53: r53, 54: r54, 55: r55, 56: r56, 57: r57, 58: r58, 59: r59, 60: r60,
  61: r61, 62: r62, 63: r63, 64: r64, 65: r65, 66: r66, 67: r67, 68: r68, 69: r69, 70: r70,
  71: r71, 72: r72, 73: r73, 74: r74, 75: r75, 76: r76, 77: r77, 78: r78, 79: r79, 80: r80,
  81: r81, 82: r82, 83: r83, 84: r84, 85: r85, 86: r86, 87: r87, 88: r88, 89: r89, 90: r90,
  91: r91, 92: r92, 93: r93, 94: r94, 95: r95, 96: r96, 97: r97, 98: r98, 99: r99, 100: r100,
};
