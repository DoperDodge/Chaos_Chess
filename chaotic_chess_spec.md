# Chaotic Chess — Project Specification

## Project Overview

A multiplayer 2D pixel art chess variant where standard chess is the baseline, but every few turns a chaos rule activates and warps the game. Two players connect through a Railway-hosted lobby system, take alternating turns picking from a pool of 100 wild rules, and watch the board descend into beautiful, animated madness.

The vibe target: **Bullet Hell meets Chess.com meets a Game Boy Color cartridge.**

## Core Pillars

1. **Familiar but unstable.** Real chess underneath, escalating chaos on top.
2. **Reactive, not random.** Players choose chaos; they aren't just hit by it.
3. **Readable madness.** No matter how wild the board gets, the player can always see what's active and why.
4. **Juice every rule.** Every single chaos effect has its own pixel animation and sound cue. None of them feel like text on a screen.

## Recommended Tech Stack

### Frontend
* **Phaser 3** for the actual game canvas. It handles sprite sheets, tilemaps, particle effects, tweens, and pixel scaling out of the box, which is exactly what this game needs for the animation work.
* **React** (Vite) for everything outside the canvas: lobby browser, lobby creation form, settings, login screen, post-game summary. Phaser embeds inside a React component on the play page.
* **Tailwind CSS** for menu styling. Pair it with a pixel font (Press Start 2P, VT323, or a custom 1bit font) to keep the aesthetic consistent.

### Backend
* **Node.js + Express** as the HTTP server.
* **Socket.IO** for real-time game state. Use rooms keyed to lobby codes.
* **Server-authoritative game state.** The server validates every move and every rule effect. Clients only render. This is non-negotiable for a multiplayer game with this much chaos; otherwise cheating is trivial.
* **PostgreSQL** (Railway-hosted) for accounts, match history, and rule statistics. Optional for v1; can be added in phase 2.

### Hosting
* **Railway** for the Node backend and Postgres.
* **Cloudflare Pages** or Railway static hosting for the React frontend.
* **Cloudflare R2** for sprite sheets, audio files, and any large assets.

### Audio
* **Howler.js** for music and SFX. Handles looping, fade in/out, sprite-based SFX bundles, and works reliably across browsers.

### Tooling
* **Aseprite** for all pixel art (sprites, tiles, animations). Piskel is a free alternative.
* **Tiled** if you want to author the chess board as a tilemap (recommended; makes board effects like lava tiles trivial to swap in).

## Architecture Overview

```
[ React Lobby UI ] ─── HTTP ───► [ Express API ]
        │                              │
        │                              ├── Postgres (accounts, history)
        ▼                              │
[ Phaser Game Client ] ◄── WebSocket ──► [ Socket.IO Game Server ]
                                         │
                                         └── In-memory game state (per lobby)
```

**Game state lives on the server.** The client sends intents (`move piece from A2 to A4`, `select rule "Bomb Carrier"`), the server validates against current chess rules + active chaos rules, mutates state, and broadcasts a delta to both clients. Clients render the delta with the appropriate animation.

**Rule effects are pure functions** of game state. Each rule exports a small module: `onActivate(state)`, `onTurnStart(state)`, `onMoveAttempt(state, move)`, `onTurnEnd(state)`, `onDeactivate(state)`. The game loop walks every active rule and runs the relevant hooks. This keeps the 100 rules isolated and testable.

## Lobby System

### Creating a Lobby

The host fills out a form with these options:

* **Lobby Name** (display string)
* **Public / Private** (private requires a join code)
* **Rule Selection Interval**: how many turns between rule picks. Options: every 3, 5, 7, or 10 turns. Default 5.
* **Rules Per Pick**: how many rules are offered each pick. Options: 2, 3, or 4. Default 3.
* **Active Rule Cap**: maximum rules active simultaneously. Options: 5, 10, unlimited. Default 10. When the cap is hit, the player picking must also choose one active rule to retire.
* **Rule Pool Filter**: toggleable categories (Explosive, Weather, Mind Games, Summoning, etc.) so players can disable categories they hate.
* **Banlist**: each player can pre-ban up to 5 specific rules before the match starts.
* **Time Control**: per-move clock (30s, 60s, 120s, unlimited).
* **Starting Color**: random, white, or black (host chooses or sets random).
* **Spectators Allowed**: yes/no. If yes, generates a separate spectator link.

### Joining a Lobby

* Public lobby browser with filters (interval, time control, region).
* Private join via 6-character code.
* Quick-match button: matchmaker pairs you with anyone in the public queue using default settings.

### In-Lobby State

Before the game starts both players see a ready-up screen showing each player's name, color, ping, and selected bans. The host can kick. Game starts when both ready.

## Core Chess Rules (Baseline)

Standard FIDE chess rules apply by default:
* Standard piece movement, castling, en passant, pawn promotion, check/checkmate/stalemate.
* 50-move rule and threefold repetition end in a draw.
* When a chaos rule contradicts a base rule, the chaos rule wins for its duration.

## The Chaos Rule System

### Activation Cycle

1. Game begins. Standard chess for the first N turns (where N is the configured Rule Selection Interval).
2. After turn N completes, the active picker is shown 3 random rules from the pool (excluding rules already active and rules on either player's banlist).
3. The picker selects one. The rule activates immediately, with its animation and sound cue. Both players see what was picked and a tooltip explaining the effect.
4. The "active picker" alternates every interval. Player 1 picks at turn N, Player 2 picks at turn 2N, Player 1 again at turn 3N, and so on.
5. Rules with limited duration tick down each turn and visually expire (fade out animation, sound cue).
6. If a rule with a permanent effect is replaced or canceled, its lingering effects (placed bombs, frozen pieces, etc.) are resolved instantly.

### Rule Stacking

Multiple rules can be active simultaneously. When effects conflict, the more recently activated rule takes precedence for the conflicting clause only. Non-conflicting clauses both apply. Example: if Icy Board is active and Time Freeze activates after, the freezing player's turn is skipped, but ice physics still apply on the next move.

### Replays and Indicators

Every active rule gets a small icon in the dropdown (described in the UI section) with a countdown if applicable. Affected pieces or tiles also display visual markers: a fuse on a bomb-carrier, a frost overlay on frozen tiles, a glow on cursed pieces, and so on. The board should never lie about what's happening.

## The 100 Rules

Each rule below lists its **name**, the **mechanic** in plain language, the **trigger / duration**, and a brief **animation note** describing the on-screen visual. Animation notes are guidance for the artist, not final designs.

### Category 1: Explosives & Damage (1 to 10)

1. **Bomb Carrier.** Random own piece is fitted with a bomb. After 5 turns it explodes, killing itself and all 8 adjacent pieces regardless of color. Fuse counts down visually. *Animation: lit fuse sparking on the piece, screen shake on detonation, 3x3 fire burst with smoke ring.*
2. **Cluster Bomb.** Five random tiles are marked. In 3 turns they all explode simultaneously, killing whatever stands on them. *Animation: red Xs flash, then sequential blooms of pixel fire across the marked tiles.*
3. **Sticky Mine.** You secretly place an invisible mine on any tile. The first opponent piece to enter that tile dies. *Animation: only visible to placer (a tiny green light); on trigger, sudden burst of shrapnel and a yelp sound.*
4. **Suicide Pawn.** One of your pawns becomes a walking bomb. When captured it kills the captor and itself. Lasts until triggered or end of game. *Animation: red pulsing aura around the pawn; on capture, a full-square fireball.*
5. **Chain Reaction.** For 5 turns, every capture also kills one random piece adjacent to the captured square (any color). *Animation: lightning arcs from the kill site to the secondary victim.*
6. **Nuclear Option.** In 8 turns, an entire row or column you choose at activation is wiped. Massive countdown visible at top of board. *Animation: warning sirens visual (red flashing border on the row), final detonation is a full-row mushroom cloud.*
7. **Grenade Toss.** Choose any tile within 3 squares of one of your pieces. That tile and its 4 orthogonal neighbors explode next turn. *Animation: an arcing grenade sprite, beep beep beep, then a cross-shaped explosion.*
8. **Exploding Pawn.** All your pawns explode on capture for 4 turns, killing the piece that captured them. *Animation: pawn sprite turns slightly red, on capture a small focused blast hits only the attacker's tile.*
9. **Minefield.** Four random tiles in the center 4x4 become mines. Only opponent pieces trigger them; yours pass safely. Lasts the rest of the game. *Animation: subtle ground crack on placement, full explosion sprite on trigger.*
10. **Doomsday Tile.** A random tile counts down for 5 turns then detonates a 3x3 area. *Animation: tile glows brighter each turn, then full screen flash on detonation.*

### Category 2: Summoning & Spawning (11 to 20)

11. **Royal Recruit.** Pick a random empty tile on your half. After 3 turns a rook crashes down, crushing whatever is under it (any color), and joining your army. *Animation: shadow grows on the tile for 3 turns, then a rook sprite slams down with a dust cloud and screen shake.*
12. **Pawn Reinforcements.** Two new pawns immediately spawn on empty tiles in your back two ranks. *Animation: pawns rise up out of the tile with a swirl of pixie dust.*
13. **Knight Recruit.** A new knight spawns on a random empty tile in your half, ready to move next turn. *Animation: a horse gallops in from off-screen, kicking up dust.*
14. **Phantom Bishop.** A ghostly bishop appears on your back rank for 5 turns. It can pass through pieces but cannot capture; if it ends a move on an enemy piece, that piece is "spooked" and can't move next turn. *Animation: translucent blue bishop sprite, leaves a trail of fading copies as it moves.*
15. **Skeleton Uprising.** All pieces that have died this game return as skeleton pawns on random empty tiles for 1 turn only, then crumble. They can capture and be captured. *Animation: bony hands burst from tiles, skeletal sprites assemble, crumble back into bones at end of turn.*
16. **Dragon Egg.** Place an egg on any empty tile. After 5 turns it hatches into a dragon that moves like a queen, owned by you, but at the start of every subsequent turn it has a 25% chance to attack a random piece (any color, any tile). *Animation: pixel egg with a heartbeat shimmer, hatching cracks each turn, on hatch a tiny dragon flaps up with a roar SFX.*
17. **Mercenary.** A piece type of your choice (any except king) appears on a random empty tile in your half. Vanishes after 4 turns. *Animation: piece sprite materializes through gold coin shimmer; vanishes the same way.*
18. **Trojan Horse.** Place a fake pawn on the board (looks like a normal pawn to your opponent). When captured, it spawns a knight on the capturer's tile, killing the capturer. *Animation: regular pawn sprite that, on capture, splits open like a wooden horse and a knight leaps out.*
19. **Doppelgänger.** Pick one of your non-king pieces. A perfect copy spawns on a random empty tile in your half. *Animation: shimmering portal opens, twin sprite walks out.*
20. **Twin Towers.** A second rook spawns in your far corner if it's empty. If both your rooks are still alive, they can also swap positions once instantly during the rule's duration (5 turns). *Animation: rook materializes from rising stone blocks; swap is a brief teleport flash.*

### Category 3: Movement Modifications (21 to 30)

21. **Pacman Board.** For 7 turns, the four edges of the board wrap around. A piece moving off the right edge appears on the left, and the same for top and bottom. *Animation: pulsing yellow border, a bite-sound when a piece crosses the edge, brief Pacman-style chomp animation on the piece.*
22. **Mirror Board.** For 5 turns, the board flips horizontally at the start of each turn (every piece's column inverts). *Animation: full-board mirror flip with a glass-shatter SFX, gentle wobble effect.*
23. **Reverse Gravity.** All pieces try to slide one tile toward the opposite end of the board, blocked by other pieces or edges. Triggers once. *Animation: pieces "fall" upward on white's turn or downward on black's, with a whoosh of wind.*
24. **Slippery Floor.** For 5 turns, every move overshoots by one tile if the path is clear. Like Icy Board's slide outcome but guaranteed. *Animation: trailing motion blur and a "skid" SFX on every move.*
25. **Quicksand.** Three random tiles slow movement; any piece entering them must spend an extra turn to leave (it can't move next turn). Lasts 6 turns. *Animation: tan swirling sand texture, pieces visibly sinking when stuck.*
26. **Speed Demon.** Pick one of your pieces. For 3 turns it moves like a queen, regardless of its actual type. *Animation: lightning sparks around the piece, motion blur on every move.*
27. **Knight's Curse.** For 4 turns, all knights (yours and opponent's) move only in straight lines (rook movement, max 3 tiles). *Animation: knights look chained, with brief shackle visual when they move.*
28. **Diagonal Pawns.** For 5 turns, pawns move only diagonally forward (one tile) and capture only straight forward. Reverses pawn rules entirely. *Animation: pawn sprites get a tilted "leaning" walk cycle.*
29. **Backwards Pawns.** For 5 turns, your pawns can move backward as well as forward. Captures still diagonal forward only. *Animation: pawns moonwalk; a moonwalk SFX cue.*
30. **Phantom Step.** Your next moved piece this turn moves twice (two separate moves, each legal). *Animation: ghostly afterimage trail behind the piece during both moves.*

### Category 4: Time & Turn Manipulation (31 to 40)

31. **Time Warp.** Both players' last 2 moves are undone. Captured pieces return. *Animation: clock spinning backward over the whole board, color desaturates and resaturates as state rewinds.*
32. **Time Freeze.** Opponent's next turn is skipped. *Animation: opponent's side of the board fades to a frozen blue, with snowflake particles, no input accepted.*
33. **Double Tap.** You take an extra turn immediately after your current one. *Animation: the turn-indicator clock spins twice, screen flashes white once.*
34. **Slow Motion.** For 3 turns, opponent's pieces can only move 1 tile per move regardless of type (knight still jumps but only to adjacent jump pattern; queen moves like king). *Animation: enemy pieces leave heavy trail, soft echo SFX on each move.*
35. **Fast Forward.** Three turns pass instantly with no moves. Existing rule timers tick down. *Animation: clock hands blur forward, the board zooms in and out, 3 chime SFX.*
36. **Groundhog Day.** Replay the previous turn (both moves). Same outcome required, but you may choose a different move when your slot comes. *Animation: brief film reel rewind, then play forward again.*
37. **Future Sight.** For 2 turns, you can see ghost-images of your opponent's most likely next move. *Animation: faint shimmering preview piece on the projected destination tile.*
38. **Chrono Lock.** Pick one of your pieces. For 3 turns it cannot be moved or captured. *Animation: blue clock-face overlay rotates around the piece.*
39. **Doomsday Clock.** A random non-king piece dies at the end of every turn for 4 turns. *Animation: a clock face appears top-center counting down, doomed piece flashes red the turn before it dies.*
40. **Pause Tile.** A random tile is locked. No piece can enter or leave it for 4 turns. *Animation: tile is encased in a translucent crystal block.*

### Category 5: Piece Transformation (41 to 50)

41. **Passing the Torch.** Pick a random own pawn as your heir. If your king dies, this pawn instantly becomes a king and the game continues. *Animation: golden glow halo on the pawn, on triggering it transforms in a beam of light with crown sparkles.*
42. **Anywhere Promotion.** For 4 turns, any of your pawns can promote on any rank by spending an extra turn. *Animation: shimmer of light around pawns; promotion is a column of sparkles.*
43. **Royal Marriage.** For 5 turns, your king moves like a queen but is also no longer protected by check rules (any piece can capture it). High risk, high reward. *Animation: king sprite gets a queen's crown overlay, regal music sting.*
44. **Knight Errant.** Your next knight move can be made to any tile on the board. One use. *Animation: knight leaps off-screen and lands on the chosen tile with a shockwave.*
45. **Bishop's Beam.** For 3 turns, your bishops can capture every piece in a diagonal line in a single move (line-clear effect). *Animation: bishop charges, releases a holy beam down the diagonal.*
46. **Iron Rook.** One of your rooks gains 2 hit points; it must be captured twice before it dies. *Animation: rook gets armor plating sprite, sparks on first hit instead of dying.*
47. **Queen's Sacrifice.** Your queen is destroyed and 4 pawns spawn around her former tile. *Animation: queen explodes into petals that crystalize into pawns.*
48. **Pawn King.** Pick a pawn. For 5 turns it acts as a second king (movement-wise and check-wise). If both kings exist, opponent must capture both to win. *Animation: tiny crown floats above the pawn, regal sparkle.*
49. **Mind Swap.** Pick two of your pieces and swap their tile positions. *Animation: both pieces float up, swap places mid-air with a chime.*
50. **Berserker Pawn.** One of your pawns moves like a knight for 4 turns. *Animation: pawn sprite gets red eyes and angry steam puff; horse-leap animation on movement.*

### Category 6: Weather & Environment (51 to 60)

51. **Icy Board.** Active for 10 turns. On every move there is a 25% chance the move is normal, 25% chance the piece slides one extra tile, 25% chance the piece freezes for 3 turns, and 25% chance the piece gets frostbite (dies when the rule ends, but only if it has moved more than 3 times during the rule). *Animation: continuous blizzard particle overlay across the whole board, frost forming on tile edges, ice cracking SFX on slide outcomes, snowflake on freeze, blue tint on frostbite.*
52. **Lava Pools.** Three random tiles become lava for 6 turns. Pieces entering them die. *Animation: bubbling orange tiles with rising heat distortion, ash particles. Pieces entering get charred sprite then crumble.*
53. **Lightning Storm.** A random non-king piece is struck by lightning each turn for 4 turns and dies. *Animation: dark clouds gather over the board, white flash, thunder SFX, target piece becomes a smoking outline.*
54. **Hurricane.** All non-king pieces shift one tile in a random direction next turn. Blocked moves are canceled. *Animation: swirling wind vortex over the board, leaves blowing across, pieces wobble before shifting.*
55. **Tsunami.** A wave crosses the board over 2 turns from one side to the other, pushing all pieces one tile back; pieces that can't move are washed off the board. *Animation: massive blue pixel wave rolls across, foam at the leading edge, drowning sprite for lost pieces.*
56. **Earthquake.** Five random non-king pieces shake to a random adjacent tile (or stay if blocked). *Animation: heavy screen shake, dust clouds rising, tiles visibly shudder.*
57. **Volcano.** The 4 center tiles erupt next turn, killing whatever stands on them. *Animation: center tiles glow red, magma cracks form, full eruption with lava splatter and smoke pillar.*
58. **Aurora.** All pieces gain +1 movement range for 3 turns. *Animation: shifting green and pink lights ripple across the night-sky-tinted board.*
59. **Sandstorm.** Opponent's pieces are invisible to you for 2 turns. *Animation: golden sand swirls across the board obscuring enemy sprites; sand-grain particle texture.*
60. **Snow Day.** All pieces move one tile less than usual for 4 turns (queens move like rooks max 3, etc.). Knights unaffected. *Animation: snowflakes fall continuously, tiles accumulate light snow texture, pieces have visible breath puffs.*

### Category 7: Mind Games & Deception (61 to 70)

61. **Mind Control.** Take direct control of one of your opponent's pieces for one move. Cannot move their king. *Animation: pulsing purple aura, the controlled piece is briefly highlighted in your color before returning to normal.*
62. **Possession.** Possess one opponent pawn for 1 turn. You make its move; it then returns to opponent control. *Animation: ghost sprite enters the piece, eyes glow your color, ghost exits at end of turn.*
63. **Confusion.** Opponent's next move is randomized; the server picks a legal move at random for them. *Animation: question marks orbit the opponent's pieces, a wobble effect on whichever moves.*
64. **Decoy King.** A random own pawn appears as your king to your opponent for 4 turns. Your real king appears as a pawn to them. *Animation: only the opponent sees the swap visual; on your screen, a small icon shows which is the decoy.*
65. **Disguise.** One of your pieces appears as a different piece type (your choice) to your opponent for 4 turns. Real movement rules unchanged. *Animation: sprite swap (e.g., your bishop looks like a pawn to them); rule icon hints at deception.*
66. **Camouflage.** All your pieces appear as opponent's color to them for 2 turns. *Animation: opponent sees a flicker of color-shift; on your end the pieces ripple with a glamour shimmer.*
67. **Spy Network.** For 2 turns you can see ghost previews of every opponent piece's possible next moves (the danger zone). *Animation: faint colored arrows or tile highlights from each enemy piece.*
68. **Fog of War.** All pieces (both colors) become invisible for 3 turns except when on tiles adjacent to your own pieces. *Animation: dense gray fog covers the board, only clearing in small radii around your pieces.*
69. **Nightmare.** Each of opponent's turns for the next 3 turns has a 50% chance their piece won't move (their input is ignored). *Animation: bedroom-curtain darken effect on opponent's side, sleepy Z's float up from frozen pieces.*
70. **Dream Walk.** Your king teleports to any safe tile (a tile not currently under attack) once. *Animation: king fades into stardust, reappears in a gentle starlight shower.*

### Category 8: Traps & Hazards (71 to 80)

71. **Pitfall.** Place an invisible pit on any tile. The next piece (any color) to enter dies. Lasts until triggered. *Animation: only placer sees a faint outline; on trigger, the tile darkens, the piece falls in with a comedic falling SFX.*
72. **Tripwire.** Place an invisible wire across a row or column. The next opponent piece to cross it dies. Lasts 5 turns. *Animation: faint laser line visible only to placer; on trigger, full red beam flashes across and the victim is sliced.*
73. **Wall Build.** Place 3 wall tiles (impassable) anywhere on the board. They last 5 turns then crumble. *Animation: stones rise from the ground with construction dust; on expiration they crumble with debris.*
74. **Spike Trap.** A random row erupts with spikes for one turn, killing all pieces standing on it. Activates 2 turns after rule selection (warning visible). *Animation: red dots pulse on doomed row for 2 turns, then iron spikes shoot up with metallic SFX.*
75. **Tar Pit.** A random tile becomes tar. Any piece entering is stuck for 3 turns. Lasts 6 turns. *Animation: black bubbling tile texture, stuck pieces have a "struggling" wobble.*
76. **Magnetic Field.** A random tile pulls every adjacent enemy piece in by one tile next turn (where possible). *Animation: visible magnetic field rings emanating, enemy pieces drag with a metal-scrape SFX.*
77. **Black Hole.** A random tile becomes a black hole for 4 turns. Pieces moving onto or adjacent to it are devoured. *Animation: swirling dark vortex with stretched-light effect at the edges; devoured pieces stretch and vanish.*
78. **Wormhole.** Two random empty tiles are linked. A piece entering one exits the other. Lasts 6 turns. *Animation: matching purple swirl portals, pieces vanish in one and emerge from the other with a static crackle.*
79. **Acid Pool.** A random tile drips acid; any piece on it loses HP each turn (introduces 2-HP pieces under this rule); at 0 it dies. Lasts until expired or piece dies. *Animation: green bubbling tile, sizzling SFX, pieces visibly corrode in stages.*
80. **Cursed Square.** A random tile is cursed for 5 turns; any piece standing on it cannot move (own or enemy). *Animation: purple runes etched into the tile, ghostly chains around any piece on it.*

### Category 9: Buffs & Debuffs (81 to 90)

81. **Royal Guard.** Your king cannot be put in check for 4 turns. *Animation: golden shield orbits the king, pulses on attempted check.*
82. **Holy Ground.** A random tile in your half becomes holy. The first ally piece to step on it is healed (resurrects your most recently lost piece adjacent to the tile). One use, lasts until used or 6 turns. *Animation: tile glows white, beam of light on activation, resurrected piece rises from petals.*
83. **Vampire Bishop.** For 4 turns, every capture by your bishops grants you an extra turn immediately. *Animation: bishop's eyes flash red, bat silhouette flutters, a trickle of red pixels.*
84. **Berserker.** A random one of your pieces gains +2 movement range for 5 turns. *Animation: piece glows red, breathes heavily, red speed-lines on every move.*
85. **Iron Skin.** Pick one of your pieces. For 3 turns it cannot be captured. *Animation: piece sprite is plated in iron, sparks fly off any attempted capture.*
86. **Cursed Piece.** A random opponent non-king piece cannot move for 4 turns. *Animation: purple chains wrap around the piece, ghostly moan on activation.*
87. **Plague.** Infect one of your opponent's pieces. Each turn the plague spreads to one adjacent piece. After 4 turns of being infected, a piece dies. Lasts entire game. *Animation: green sickly aura, fly particles around infected pieces, infected pieces tilt and look weak.*
88. **Healing Aura.** Pieces adjacent to your king cannot be captured for 3 turns. *Animation: gold ring on the ground around the king, gentle pulse, attackers visibly bounce off.*
89. **Frostbite.** A random non-king piece is frozen for 5 turns (cannot move or be captured). *Animation: frost crystallizes around the piece, ice-cube overlay.*
90. **Power Surge.** All your pieces get +1 movement range for 2 turns. *Animation: blue electricity arcs between your pieces, every move leaves a brief lightning trail.*

### Category 10: Pure Chaos & Wild Cards (91 to 100)

91. **Wild Card.** A second random rule from the pool activates instantly for 1 turn only. *Animation: slot-machine reel sound and visual, rule icon stops on a random selection with a "ding".*
92. **Reset Button.** Cancel one currently active rule of your choice. *Animation: red button slams down, rule icon shatters in the dropdown.*
93. **Russian Roulette.** Six of your non-king pieces are chosen at random. One of them dies (randomly chosen). *Animation: revolver cylinder spins on screen, six pieces highlighted, one flashes red and falls.*
94. **Coin Flip.** A coin is flipped. Heads: you take an extra turn. Tails: opponent takes an extra turn. *Animation: large coin sprite spins in center of screen, lands with a clang.*
95. **Lucky Day.** Your next 3 captures cannot be retaliated against (the capturing piece cannot be captured next turn). *Animation: clover icons trail your pieces after each lucky capture.*
96. **Cursed Day.** One random own non-king piece dies each turn for 3 turns. *Animation: black raven flies overhead, marks a piece with a shadow each turn before it dies.*
97. **Defection.** A random non-king piece on the board switches sides. *Animation: piece literally walks across to the other side with a flag wave.*
98. **Dance Off.** Both kings must move toward the center over the next 3 turns (one tile per turn each). They cannot castle, cannot stay still, cannot be captured during this. *Animation: musical notes float up, both kings have a small bobbing dance loop, disco floor lights under their tiles.*
99. **Truce.** No captures are allowed for 3 turns. Moves into capture range are still legal but produce no kill. *Animation: white dove sprite flies across, peace banner draped across the top of the board.*
100. **Apocalypse.** In 10 turns, half the pieces on the board (chosen randomly, never kings) die simultaneously. Big visible countdown. *Animation: red moon rises in the background, sky darkens each turn, on detonation the board flashes and selected pieces all crumble at once with an ominous chord.*

## UI / UX Specifications

### Screen Layout (In-Game)

The board is centered. The play area is at most 70% of viewport width on desktop, 95% on mobile. Around it:

* **Top center:** turn indicator and move clock.
* **Top right:** **Active Rules Dropdown** (described below). This is the critical UI element.
* **Top left:** menu button (resign, draw offer, settings).
* **Bottom left:** your captured pieces.
* **Bottom right:** opponent's captured pieces.
* **Bottom center:** when it's a rule-pick turn, the 3 rule cards appear here in a modal that pauses the clock.
* **Side panels** (collapsible on mobile): move history, in-game chat with preset emote messages.

### Active Rules Dropdown (Detailed Spec)

* **Position:** anchored top-right corner. Default state is **collapsed** to a small pill button labeled "Active Rules" with a number badge showing how many are active.
* **Click behavior:** clicking expands the dropdown panel below the button. Clicking outside or pressing Esc collapses it.
* **Hover behavior:** hovering over the collapsed pill briefly previews the count and category icons without expanding.
* **Critical constraint:** the expanded dropdown must not overlap the game board. On desktop, the dropdown opens to the right or downward outside the board area. On narrow viewports, expand only as far as available space allows and add internal scroll.
* **Translucency:** the dropdown background uses a slight glassy translucency so the player can still see context behind it.
* **Each rule entry shows:**
  * Pixel icon (unique per rule).
  * Rule name in pixel font.
  * Remaining duration (turns) or "until triggered" / "permanent" tag.
  * Owner indicator (which player picked it; small W or B chip).
  * Hover tooltip with the full rule description.
* **Sorting:** newest at top by default. A small button toggles between "newest first," "expiring soonest," and "by category."
* **Expiration animation:** when a rule ticks to zero, its entry slides out of the list with a brief fade and a soft chime; the corresponding board effect animates out simultaneously.
* **Mobile:** the same pill in the top right; expanded state takes up the right 60% of the screen and is dismissable with a swipe.

### Rule Pick Modal

When it's time to pick a rule, the game pauses, the modal slides up from the bottom of the screen, and three pixel-art cards are shown side by side. Each card has:

* The rule name in a stylized banner.
* Pixel icon art (matching the icon used in the dropdown).
* Short flavor text (1 line).
* Mechanical description (2 to 3 lines).
* Hover preview animation showing the effect on a small demo board.

Clicking a card commits the choice. The non-active player sees a "Player 2 is choosing..." indicator with the three card backs visible.

### Lobby Screen

* Pixel art banner at top with the game logo.
* "Create Lobby" and "Join Lobby" big buttons.
* Below: scrollable list of public lobbies with filters.
* Settings cog in the corner: music toggle, SFX toggle, animation intensity (full / reduced / minimal for accessibility), colorblind palette options.

## Pixel Art Style Guide

* **Resolution:** the canvas renders at a low logical resolution (e.g., 480x270 or 640x360) and scales up with `pixel-perfect` rendering (no smoothing). Phaser's `pixelArt: true` flag in the game config handles this.
* **Tile size:** 32x32 logical pixels per board tile. Pieces are 28x28 sprites with 2 pixels of padding on each side.
* **Palette:** 32-color limited palette. Recommend a base palette like Endesga 32 or a custom palette built around two warm and two cool dominant tones plus accent reds for damage and gold for buffs.
* **Pieces:** each piece is a 4-frame idle animation (gentle bob), a 6-frame move animation, and a 4-frame death animation.
* **Board tiles:** light and dark squares get subtle 1-pixel highlights. Tiles transformed by rules (lava, ice, holy, etc.) replace the texture entirely with a 4-frame looping animation.
* **Particles:** every animation should layer particle effects on top of sprite animation: dust, sparks, snow, embers, leaves, and so on.
* **Lighting:** keep it simple. A single global light source from the upper-left for shading consistency. Rule effects can introduce localized glows.
* **Tooling:** Aseprite is recommended; export sprite sheets as PNG with accompanying JSON atlas (Aseprite has a built-in Phaser-friendly export).

## Animation Library Notes

Each rule above has an inline animation note. Two general guidelines:

1. **Activation animation** (1 to 2 seconds) is full-screen or board-wide and announces the rule clearly. Players cannot input during activation.
2. **Persistent animation** (looping) is subtler so it doesn't fatigue the eye over a 10-turn duration. Reduce to 50% opacity and slow particle frequency for long-duration effects.
3. **Expiration animation** (0.5 to 1 second) reverses the entrance: the effect fades out, particles dissipate, the board returns to baseline.
4. **Affected piece markers** (always on while the effect is active): a small 8x8 icon hovers above any piece currently affected (bomb, frost, curse, plague, etc.). These icons are also clickable for a tooltip.

## Audio System

### Music

* **Background loop** plays in the lobby and during games. Style: chill chiptune or lo-fi pixel-pop, around 80 to 100 BPM, around 90 seconds per loop with a seamless crossfade.
* **Tension layer:** a second instrumental stem activates when the game state enters check or a high-impact rule is active (Apocalypse countdown, Doomsday Tile, etc.). Layered using Howler.js with a fade-in over 2 seconds.
* **Toggle:** a music note icon in the top-left settings menu toggles music on and off. State persists in localStorage so the player's preference is remembered. Default: on, at 50% volume.
* **Sources:** for v1, free or commissioned chiptune. Recommended free sources: OpenGameArt.org, FreeMusicArchive (CC-BY tracks), or commissioning a small artist on itch.io. Always check licensing before shipping.

### Sound Effects

* Each rule has at least one signature SFX (activation cue) plus its in-game effect SFX (tick sound, explosion, freeze, etc.).
* Global SFX: piece pickup, piece move, capture, check, checkmate, draw, lobby ping, opponent connected, opponent disconnected, rule pick prompt.
* All SFX 8-bit style (chiptune synth) for cohesion. Howler.js sprite sheets can bundle them into a single file for fast loading.
* Independent SFX volume slider in settings.

## Additional Recommended Features

These are not required for v1 but would meaningfully improve the experience.

1. **Reconnection handling.** If a player disconnects, the server holds the lobby open for 60 seconds with a visible reconnect timer. After 60 seconds they forfeit.
2. **Spectator mode.** Friends can watch live with a 5-second delay (to prevent tournament cheating). Spectators see the same active rules dropdown and can react with emojis.
3. **Replay system.** After every game, a download button gives both players a `.replay` JSON file with the full move and rule history. A built-in replay viewer lets you scrub the timeline and see each rule activate.
4. **Daily Seed Mode.** Once a day, all players get the same starting rule pool order. Encourages "today's wild rules" community discussion.
5. **Tutorial Mode.** A short solo mode that introduces 5 representative rules against an AI bot so new players understand the rhythm.
6. **Stats & Achievements.** Track per-rule stats (win rate when rule X is active, most-picked rule, longest game with the most rules active simultaneously). Achievement examples: "Survive Apocalypse," "Win without ever picking a rule yourself," "Pick 10 different rules in one game."
7. **Custom Rule Packs.** Let advanced users save filter presets (e.g., "Weather Only," "No Explosives," "Pure Chaos"). Sharable via short codes.
8. **Animation Intensity Toggle.** Some players will want to dial back the screen shake and particles for accessibility or focus. Three settings: Full, Reduced, Minimal.
9. **Colorblind Palette.** A high-contrast alternate palette toggle for board and pieces.
10. **Postgame Recap.** A 10-second highlight reel auto-generated from the most "chaotic" moments of the game (most pieces killed in one turn, biggest swing, etc.).
11. **Quick Emote Chat.** Five preset emotes (gg, oof, lmao, nice, gl) so players can react without exposing the chat to abuse. No free-text chat by default for safety.
12. **Rule Bestiary.** An out-of-game encyclopedia where players can browse all 100 rules, see their animations, and read flavor text. Great for retention and shareable on social media.

## Suggested Development Roadmap

A possible build order to get to a playable v1 fastest.

**Phase 1: Core Loop (no chaos yet)**
1. Set up Railway project, Express server, Socket.IO room system.
2. React frontend with lobby creation, lobby join, basic ready-up.
3. Phaser canvas with standard chess implementation (server-authoritative).
4. Confirm two clients can play a normal game of chess end to end.

**Phase 2: Rule Engine**
5. Build the rule effect interface (`onActivate`, `onTurnStart`, etc.).
6. Implement 5 rules across different categories as the engine test set (Bomb Carrier, Royal Recruit, Icy Board, Pacman Board, Passing the Torch).
7. Build the rule pick modal and the active rules dropdown.
8. Confirm rules stack and expire correctly across two clients.

**Phase 3: Content**
9. Implement the remaining 95 rules in batches, with art and animation for each.
10. Build the lobby configuration options (interval, ban list, category filters).

**Phase 4: Polish**
11. Music and SFX integration.
12. Reconnection, spectator mode, accessibility toggles.
13. Replay system and stats.

**Phase 5: Launch**
14. Playtesting with friends. Balance pass on rule frequency and overpowered combos.
15. Public deployment, daily seed mode, achievements.

## Suggested Project Structure

```
chaotic-chess/
├── client/                       # React + Phaser frontend
│   ├── src/
│   │   ├── lobby/                # React lobby UI
│   │   ├── game/                 # Phaser scenes, rule renderers
│   │   │   ├── scenes/
│   │   │   ├── rules/            # one file per rule's client-side animation
│   │   │   └── audio/
│   │   └── shared/
│   ├── public/
│   │   ├── sprites/              # piece sprite sheets
│   │   ├── tiles/                # board tile variants
│   │   ├── effects/              # particle and animation sheets
│   │   └── audio/
│   └── vite.config.js
├── server/                       # Node + Express + Socket.IO
│   ├── src/
│   │   ├── lobby/                # lobby management
│   │   ├── game/                 # game state, turn logic
│   │   ├── rules/                # one file per rule's server-side effect
│   │   ├── sockets/              # Socket.IO event handlers
│   │   └── db/                   # Postgres adapters (phase 4+)
│   └── package.json
├── shared/                       # types and constants used by both
│   ├── rules.json                # rule metadata (id, name, category, etc.)
│   └── types.ts
└── README.md
```

## Open Design Questions to Resolve During Build

1. **Should rules persist across games in any way?** (e.g., a "carry-over" mode where one rule survives into the next match)
2. **Cap on stacked deaths per turn:** Apocalypse plus Lava plus Plague could wipe a board. Worth a sanity cap?
3. **Knight movement under Pacman Board:** does an L-jump wrap around edges? (Recommended: yes.)
4. **Time controls during chaos:** does a player's clock pause during forced animations? (Recommended: yes, for fairness.)
5. **Server-side rule RNG:** seed each game's rule offers with a verifiable seed for replay reproducibility.

## Final Note

The aesthetic ceiling of this project is very high. The two things that will make or break it are: clarity (can the player always tell what's happening?) and juice (does every rule feel like a tiny event?). The active rules dropdown and per-rule animations are the two features that protect both. Build those first when you start implementing chaos, and everything else gets easier.
