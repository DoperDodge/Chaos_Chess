// All 100 chaos rules metadata. Mechanics live in server/src/rules/<id>.js.
// Animation hints live in client/src/game/rules/<id>.js.
import { CATEGORIES } from './constants.js';

const C = CATEGORIES;

// duration: number of turns the rule stays active. 'permanent' = until game end. 'triggered' = until something triggers it.
// flavor: short 1-line flavor text shown on the rule card.
export const RULES = [
  // 1-10: Explosives & Damage
  { id: 1,  name: 'Bomb Carrier',     category: C.EXPLOSIVE, duration: 5,           flavor: 'Tick, tick, tick...', desc: 'A random own piece is fitted with a bomb. After 5 turns it explodes, killing itself and all 8 adjacent pieces.' },
  { id: 2,  name: 'Cluster Bomb',     category: C.EXPLOSIVE, duration: 3,           flavor: 'Five marks. Three turns. Boom.', desc: 'Five random tiles are marked. In 3 turns they all explode simultaneously, killing whatever stands on them.' },
  { id: 3,  name: 'Sticky Mine',      category: C.EXPLOSIVE, duration: 'triggered', flavor: 'Watch your step.', desc: 'You secretly place an invisible mine on any tile. The first opponent piece to enter dies.' },
  { id: 4,  name: 'Suicide Pawn',     category: C.EXPLOSIVE, duration: 'triggered', flavor: 'Take me with you.', desc: 'One of your pawns becomes a walking bomb. When captured it kills the captor and itself.' },
  { id: 5,  name: 'Chain Reaction',   category: C.EXPLOSIVE, duration: 5,           flavor: 'One leads to another.', desc: 'For 5 turns, every capture also kills one random piece adjacent to the captured square.' },
  { id: 6,  name: 'Nuclear Option',   category: C.EXPLOSIVE, duration: 8,           flavor: 'Mutually assured.', desc: 'In 8 turns, an entire row or column you choose at activation is wiped.' },
  { id: 7,  name: 'Grenade Toss',     category: C.EXPLOSIVE, duration: 1,           flavor: 'Cooking the grenade.', desc: 'Choose any tile within 3 squares of one of your pieces. That tile and 4 orthogonal neighbors explode next turn.' },
  { id: 8,  name: 'Exploding Pawn',   category: C.EXPLOSIVE, duration: 4,           flavor: 'A spicy snack.', desc: 'All your pawns explode on capture for 4 turns, killing the piece that captured them.' },
  { id: 9,  name: 'Minefield',        category: C.EXPLOSIVE, duration: 'permanent', flavor: 'No-go zone.', desc: 'Four random tiles in the center 4x4 become mines. Only opponent pieces trigger them.' },
  { id: 10, name: 'Doomsday Tile',    category: C.EXPLOSIVE, duration: 5,           flavor: 'It glows.', desc: 'A random tile counts down for 5 turns then detonates a 3x3 area.' },

  // 11-20: Summoning & Spawning
  { id: 11, name: 'Royal Recruit',     category: C.SUMMONING, duration: 3,           flavor: 'Heads up.', desc: 'After 3 turns a rook crashes down on a chosen empty tile, joining your army and crushing whatever was there.' },
  { id: 12, name: 'Pawn Reinforcements', category: C.SUMMONING, duration: 1,        flavor: 'Fresh meat.', desc: 'Two new pawns immediately spawn on empty tiles in your back two ranks.' },
  { id: 13, name: 'Knight Recruit',    category: C.SUMMONING, duration: 1,           flavor: 'A new horse.', desc: 'A new knight spawns on a random empty tile in your half.' },
  { id: 14, name: 'Phantom Bishop',    category: C.SUMMONING, duration: 5,           flavor: 'Boo.', desc: 'A ghostly bishop appears on your back rank for 5 turns. It cannot capture but can spook enemy pieces.' },
  { id: 15, name: 'Skeleton Uprising', category: C.SUMMONING, duration: 1,           flavor: 'Bones rise!', desc: 'All pieces that have died this game return as skeleton pawns for 1 turn only.' },
  { id: 16, name: 'Dragon Egg',        category: C.SUMMONING, duration: 5,           flavor: 'Something is hatching.', desc: 'Place an egg on any empty tile. After 5 turns it hatches into a dragon (queen-like) under your control.' },
  { id: 17, name: 'Mercenary',         category: C.SUMMONING, duration: 4,           flavor: 'Hired help.', desc: 'A piece type of your choice (any except king) appears on a random empty tile in your half. Vanishes after 4 turns.' },
  { id: 18, name: 'Trojan Horse',      category: C.SUMMONING, duration: 'triggered', flavor: 'A gift.', desc: 'Place a fake pawn on the board. When captured, it spawns a knight on the capturer\'s tile, killing the capturer.' },
  { id: 19, name: 'Doppelganger',      category: C.SUMMONING, duration: 1,           flavor: 'Hello, me.', desc: 'A perfect copy of one of your non-king pieces spawns on a random empty tile in your half.' },
  { id: 20, name: 'Twin Towers',       category: C.SUMMONING, duration: 5,           flavor: 'Reinforced corner.', desc: 'A second rook spawns in your far corner if empty. Rooks may swap once instantly during the rule.' },

  // 21-30: Movement Modifications
  { id: 21, name: 'Pacman Board',     category: C.MOVEMENT, duration: 7,           flavor: 'Wakka wakka.', desc: 'For 7 turns, the four edges of the board wrap around.' },
  { id: 22, name: 'Mirror Board',     category: C.MOVEMENT, duration: 5,           flavor: 'Reflection.', desc: 'For 5 turns, the board flips horizontally at the start of each turn.' },
  { id: 23, name: 'Reverse Gravity',  category: C.MOVEMENT, duration: 1,           flavor: 'Whoosh.', desc: 'All pieces try to slide one tile toward the opposite end of the board.' },
  { id: 24, name: 'Slippery Floor',   category: C.MOVEMENT, duration: 5,           flavor: 'Skiiiid.', desc: 'For 5 turns, every move overshoots by one tile if the path is clear.' },
  { id: 25, name: 'Quicksand',        category: C.MOVEMENT, duration: 6,           flavor: 'Sinking.', desc: 'Three random tiles slow movement; any piece entering must spend an extra turn to leave.' },
  { id: 26, name: 'Speed Demon',      category: C.MOVEMENT, duration: 3,           flavor: 'Zoom.', desc: 'Pick one of your pieces. For 3 turns it moves like a queen.' },
  { id: 27, name: "Knight's Curse",   category: C.MOVEMENT, duration: 4,           flavor: 'Earthbound.', desc: 'For 4 turns, all knights move only in straight lines (rook-like, max 3 tiles).' },
  { id: 28, name: 'Diagonal Pawns',   category: C.MOVEMENT, duration: 5,           flavor: 'Sideways march.', desc: 'For 5 turns, pawns move only diagonally forward and capture only straight forward.' },
  { id: 29, name: 'Backwards Pawns',  category: C.MOVEMENT, duration: 5,           flavor: 'Moonwalk.', desc: 'For 5 turns, your pawns can move backward as well as forward.' },
  { id: 30, name: 'Phantom Step',     category: C.MOVEMENT, duration: 1,           flavor: 'Two for one.', desc: 'Your next moved piece this turn moves twice (two separate legal moves).' },

  // 31-40: Time & Turn Manipulation
  { id: 31, name: 'Time Warp',        category: C.TIME, duration: 1,            flavor: 'Rewind.', desc: "Both players' last 2 moves are undone. Captured pieces return." },
  { id: 32, name: 'Time Freeze',      category: C.TIME, duration: 1,            flavor: 'You. Stop.', desc: "Opponent's next turn is skipped." },
  { id: 33, name: 'Double Tap',       category: C.TIME, duration: 1,            flavor: 'Once more.', desc: 'You take an extra turn immediately after your current one.' },
  { id: 34, name: 'Slow Motion',      category: C.TIME, duration: 3,            flavor: 'Crawl.', desc: "For 3 turns, opponent's pieces can only move 1 tile per move regardless of type." },
  { id: 35, name: 'Fast Forward',     category: C.TIME, duration: 1,            flavor: 'FFFFFFF.', desc: 'Three turns pass instantly with no moves. Existing rule timers tick down.' },
  { id: 36, name: 'Groundhog Day',    category: C.TIME, duration: 1,            flavor: 'Deja vu.', desc: 'Replay the previous turn. Same outcome required, but you may choose a different move.' },
  { id: 37, name: 'Future Sight',     category: C.TIME, duration: 2,            flavor: 'I see it.', desc: "For 2 turns, you can see ghost-images of your opponent's most likely next move." },
  { id: 38, name: 'Chrono Lock',      category: C.TIME, duration: 3,            flavor: 'Frozen in time.', desc: 'Pick one of your pieces. For 3 turns it cannot be moved or captured.' },
  { id: 39, name: 'Doomsday Clock',   category: C.TIME, duration: 4,            flavor: 'Tick. Tock.', desc: 'A random non-king piece dies at the end of every turn for 4 turns.' },
  { id: 40, name: 'Pause Tile',       category: C.TIME, duration: 4,            flavor: 'Frozen tile.', desc: 'A random tile is locked. No piece can enter or leave it for 4 turns.' },

  // 41-50: Piece Transformation
  { id: 41, name: 'Passing the Torch',  category: C.TRANSFORM, duration: 'permanent', flavor: 'Long live the king.', desc: 'A random own pawn becomes your heir. If your king dies, this pawn instantly becomes a king.' },
  { id: 42, name: 'Anywhere Promotion', category: C.TRANSFORM, duration: 4,           flavor: 'Why wait?', desc: 'For 4 turns, any of your pawns can promote on any rank by spending an extra turn.' },
  { id: 43, name: 'Royal Marriage',     category: C.TRANSFORM, duration: 5,           flavor: 'A royal gambit.', desc: 'For 5 turns, your king moves like a queen but is no longer protected by check rules.' },
  { id: 44, name: 'Knight Errant',      category: C.TRANSFORM, duration: 'triggered', flavor: 'Off he goes.', desc: 'Your next knight move can be made to any tile on the board. One use.' },
  { id: 45, name: "Bishop's Beam",      category: C.TRANSFORM, duration: 3,           flavor: 'Holy laser.', desc: 'For 3 turns, your bishops can capture every piece in a diagonal line in a single move.' },
  { id: 46, name: 'Iron Rook',          category: C.TRANSFORM, duration: 'permanent', flavor: 'Doubly stout.', desc: 'One of your rooks gains 2 hit points; it must be captured twice before it dies.' },
  { id: 47, name: "Queen's Sacrifice",  category: C.TRANSFORM, duration: 1,           flavor: 'For the people.', desc: 'Your queen is destroyed and 4 pawns spawn around her former tile.' },
  { id: 48, name: 'Pawn King',          category: C.TRANSFORM, duration: 5,           flavor: 'Two crowns.', desc: 'Pick a pawn. For 5 turns it acts as a second king (movement and check-wise).' },
  { id: 49, name: 'Mind Swap',          category: C.TRANSFORM, duration: 1,           flavor: 'Switcheroo.', desc: 'Pick two of your pieces and swap their tile positions.' },
  { id: 50, name: 'Berserker Pawn',     category: C.TRANSFORM, duration: 4,           flavor: 'RAAAARGH.', desc: 'One of your pawns moves like a knight for 4 turns.' },

  // 51-60: Weather & Environment
  { id: 51, name: 'Icy Board',      category: C.WEATHER, duration: 10,          flavor: 'Brrrr.', desc: 'For 10 turns, every move has 25% normal / 25% slide one extra tile / 25% freeze for 3 / 25% frostbite.' },
  { id: 52, name: 'Lava Pools',     category: C.WEATHER, duration: 6,           flavor: 'Hot lava.', desc: 'Three random tiles become lava for 6 turns. Pieces entering them die.' },
  { id: 53, name: 'Lightning Storm',category: C.WEATHER, duration: 4,           flavor: 'CRACK.', desc: 'A random non-king piece is struck by lightning each turn for 4 turns and dies.' },
  { id: 54, name: 'Hurricane',      category: C.WEATHER, duration: 1,           flavor: 'Wind.', desc: 'All non-king pieces shift one tile in a random direction next turn.' },
  { id: 55, name: 'Tsunami',        category: C.WEATHER, duration: 2,           flavor: 'WAVE.', desc: 'A wave crosses the board over 2 turns, pushing all pieces one tile back.' },
  { id: 56, name: 'Earthquake',     category: C.WEATHER, duration: 1,           flavor: 'Rumble.', desc: 'Five random non-king pieces shake to a random adjacent tile.' },
  { id: 57, name: 'Volcano',        category: C.WEATHER, duration: 1,           flavor: 'Magma.', desc: 'The 4 center tiles erupt next turn, killing whatever stands on them.' },
  { id: 58, name: 'Aurora',         category: C.WEATHER, duration: 3,           flavor: 'Lights.', desc: 'All pieces gain +1 movement range for 3 turns.' },
  { id: 59, name: 'Sandstorm',      category: C.WEATHER, duration: 2,           flavor: 'Blinded.', desc: "Opponent's pieces are invisible to you for 2 turns." },
  { id: 60, name: 'Snow Day',       category: C.WEATHER, duration: 4,           flavor: 'Cozy.', desc: 'All pieces move one tile less than usual for 4 turns. Knights unaffected.' },

  // 61-70: Mind Games & Deception
  { id: 61, name: 'Mind Control',  category: C.MIND, duration: 1,           flavor: 'Obey.', desc: 'Take direct control of one opponent piece for one move. Cannot move their king.' },
  { id: 62, name: 'Possession',    category: C.MIND, duration: 1,           flavor: 'Step inside.', desc: 'Possess one opponent pawn for 1 turn. You make its move; it then returns to opponent control.' },
  { id: 63, name: 'Confusion',     category: C.MIND, duration: 1,           flavor: 'Huh?', desc: "Opponent's next move is randomized; the server picks a legal move at random." },
  { id: 64, name: 'Decoy King',    category: C.MIND, duration: 4,           flavor: 'A trick.', desc: 'A random own pawn appears as your king to your opponent for 4 turns.' },
  { id: 65, name: 'Disguise',      category: C.MIND, duration: 4,           flavor: 'In disguise.', desc: 'One of your pieces appears as a different piece type to your opponent for 4 turns.' },
  { id: 66, name: 'Camouflage',    category: C.MIND, duration: 2,           flavor: 'Hidden in plain sight.', desc: "All your pieces appear as opponent's color to them for 2 turns." },
  { id: 67, name: 'Spy Network',   category: C.MIND, duration: 2,           flavor: 'Eyes everywhere.', desc: 'For 2 turns you can see ghost previews of every opponent piece\'s possible next moves.' },
  { id: 68, name: 'Fog of War',    category: C.MIND, duration: 3,           flavor: 'Mist.', desc: 'All pieces become invisible for 3 turns except adjacent to your own pieces.' },
  { id: 69, name: 'Nightmare',     category: C.MIND, duration: 3,           flavor: 'Sleep tight.', desc: "For 3 turns, opponent's pieces have a 50% chance their move is ignored." },
  { id: 70, name: 'Dream Walk',    category: C.MIND, duration: 1,           flavor: 'Stardust.', desc: 'Your king teleports to any safe tile (a tile not currently under attack) once.' },

  // 71-80: Traps & Hazards
  { id: 71, name: 'Pitfall',         category: C.TRAP, duration: 'triggered', flavor: 'Down you go.', desc: 'Place an invisible pit on any tile. The next piece (any color) to enter dies.' },
  { id: 72, name: 'Tripwire',        category: C.TRAP, duration: 5,           flavor: 'SNAP.', desc: 'Place an invisible wire across a row or column. The next opponent piece to cross dies. Lasts 5 turns.' },
  { id: 73, name: 'Wall Build',      category: C.TRAP, duration: 5,           flavor: 'Brick by brick.', desc: 'Place 3 wall tiles (impassable) anywhere on the board. They last 5 turns then crumble.' },
  { id: 74, name: 'Spike Trap',      category: C.TRAP, duration: 2,           flavor: 'Look down.', desc: 'A random row erupts with spikes for one turn 2 turns after rule selection (warning visible).' },
  { id: 75, name: 'Tar Pit',         category: C.TRAP, duration: 6,           flavor: 'Stuck.', desc: 'A random tile becomes tar. Any piece entering is stuck for 3 turns.' },
  { id: 76, name: 'Magnetic Field',  category: C.TRAP, duration: 1,           flavor: 'Pull.', desc: 'A random tile pulls every adjacent enemy piece in by one tile next turn.' },
  { id: 77, name: 'Black Hole',      category: C.TRAP, duration: 4,           flavor: 'Event horizon.', desc: 'A random tile becomes a black hole for 4 turns. Pieces moving onto or adjacent are devoured.' },
  { id: 78, name: 'Wormhole',        category: C.TRAP, duration: 6,           flavor: 'Shortcut.', desc: 'Two random empty tiles are linked. A piece entering one exits the other.' },
  { id: 79, name: 'Acid Pool',       category: C.TRAP, duration: 'permanent', flavor: 'Sssss.', desc: 'A random tile drips acid; any piece on it loses HP each turn (2-HP under this rule); at 0 it dies.' },
  { id: 80, name: 'Cursed Square',   category: C.TRAP, duration: 5,           flavor: 'Stuck place.', desc: 'A random tile is cursed for 5 turns; any piece standing on it cannot move.' },

  // 81-90: Buffs & Debuffs
  { id: 81, name: 'Royal Guard',     category: C.BUFF, duration: 4,           flavor: 'Protected.', desc: 'Your king cannot be put in check for 4 turns.' },
  { id: 82, name: 'Holy Ground',     category: C.BUFF, duration: 6,           flavor: 'Sanctified.', desc: 'A random tile in your half becomes holy. The first ally to step on it resurrects your most recently lost piece.' },
  { id: 83, name: 'Vampire Bishop',  category: C.BUFF, duration: 4,           flavor: 'Drink deep.', desc: 'For 4 turns, every capture by your bishops grants you an extra turn immediately.' },
  { id: 84, name: 'Berserker',       category: C.BUFF, duration: 5,           flavor: 'RAGE.', desc: 'A random one of your pieces gains +2 movement range for 5 turns.' },
  { id: 85, name: 'Iron Skin',       category: C.BUFF, duration: 3,           flavor: 'Plated.', desc: 'Pick one of your pieces. For 3 turns it cannot be captured.' },
  { id: 86, name: 'Cursed Piece',    category: C.BUFF, duration: 4,           flavor: 'Hex.', desc: 'A random opponent non-king piece cannot move for 4 turns.' },
  { id: 87, name: 'Plague',          category: C.BUFF, duration: 'permanent', flavor: 'It spreads.', desc: 'Infect one opponent piece. Each turn the plague spreads to one adjacent piece. After 4 turns infected, a piece dies.' },
  { id: 88, name: 'Healing Aura',    category: C.BUFF, duration: 3,           flavor: 'Bask.', desc: 'Pieces adjacent to your king cannot be captured for 3 turns.' },
  { id: 89, name: 'Frostbite',       category: C.BUFF, duration: 5,           flavor: 'Solid ice.', desc: 'A random non-king piece is frozen for 5 turns (cannot move or be captured).' },
  { id: 90, name: 'Power Surge',     category: C.BUFF, duration: 2,           flavor: 'BZZT.', desc: 'All your pieces get +1 movement range for 2 turns.' },

  // 91-100: Pure Chaos & Wild Cards
  { id: 91, name: 'Wild Card',        category: C.WILD, duration: 1,           flavor: '???', desc: 'A second random rule from the pool activates instantly for 1 turn only.' },
  { id: 92, name: 'Reset Button',     category: C.WILD, duration: 1,           flavor: 'Undo.', desc: 'Cancel one currently active rule of your choice.' },
  { id: 93, name: 'Russian Roulette', category: C.WILD, duration: 1,           flavor: 'Click.', desc: 'Six of your non-king pieces are chosen at random. One of them dies.' },
  { id: 94, name: 'Coin Flip',        category: C.WILD, duration: 1,           flavor: 'Heads or tails.', desc: 'Heads: you take an extra turn. Tails: opponent takes an extra turn.' },
  { id: 95, name: 'Lucky Day',        category: C.WILD, duration: 'triggered', flavor: 'Clovers.', desc: 'Your next 3 captures cannot be retaliated against (capturing piece cannot be captured next turn).' },
  { id: 96, name: 'Cursed Day',       category: C.WILD, duration: 3,           flavor: 'Doom.', desc: 'One random own non-king piece dies each turn for 3 turns.' },
  { id: 97, name: 'Defection',        category: C.WILD, duration: 'permanent', flavor: 'Turncoat.', desc: 'A random non-king piece on the board switches sides.' },
  { id: 98, name: 'Dance Off',        category: C.WILD, duration: 3,           flavor: '🪩', desc: 'Both kings must move toward the center over the next 3 turns. They cannot castle, stay still, or be captured.' },
  { id: 99, name: 'Truce',            category: C.WILD, duration: 3,           flavor: 'Peace.', desc: 'No captures are allowed for 3 turns.' },
  { id: 100,name: 'Apocalypse',       category: C.WILD, duration: 10,          flavor: 'The end is near.', desc: 'In 10 turns, half the pieces on the board (chosen randomly, never kings) die simultaneously.' },
];

export const RULES_BY_ID = Object.fromEntries(RULES.map(r => [r.id, r]));

export function getRuleById(id) {
  return RULES_BY_ID[id];
}

export function getRulesByCategory(category) {
  return RULES.filter(r => r.category === category);
}
