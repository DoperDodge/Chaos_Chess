export const CATEGORIES = {
  EXPLOSIVE: 'Explosive',
  SUMMONING: 'Summoning',
  MOVEMENT: 'Movement',
  TIME: 'Time',
  TRANSFORM: 'Transform',
  WEATHER: 'Weather',
  MIND: 'Mind',
  TRAP: 'Trap',
  BUFF: 'Buff',
  WILD: 'Wild',
};

export const DEFAULT_LOBBY_SETTINGS = {
  ruleSelectionInterval: 5,
  rulesPerPick: 3,
  activeRuleCap: 10,
  timeControl: 60,
  startingColor: 'random',
  spectatorsAllowed: true,
  ruleCategoryFilter: Object.values(CATEGORIES),
  banlist: [],
};

export const TIME_CONTROL_OPTIONS = [30, 60, 120, 0];
export const RULE_INTERVAL_OPTIONS = [3, 5, 7, 10];
export const RULES_PER_PICK_OPTIONS = [2, 3, 4];
export const ACTIVE_RULE_CAP_OPTIONS = [5, 10, 0];
