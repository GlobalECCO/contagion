/*******************************************************************************
 * All the number values in the game that should be customizable in one place
 * to change the balance of the game
 ******************************************************************************/
this.BalanceValues = {
  STARTING_RESOURCES: 6,
  BASE_INCOME: 1,
  TERRITORY_RESOURCE_THRESHOLDS: [{threshold: 5, value: 2}, {threshold: 10, value: 1}],

  ACTION_ATTACK_COST: 3,
  ACTION_BOOST_COST: 3,
  ACTION_DESPERATION_COST: 0,
  ACTION_DISABLE_COST: 3,
  ACTION_ESCAPE_COST: 1,
  ACTION_MOVE_COST: 0,
  ACTION_RECRUIT_COST: 3,
  ACTION_REMOVE_COST: 5,
  ACTION_SHIFT_COST: 1,
  ACTION_WITHDRAW_COST: -1,
  ACTION_GLOBAL_COST: 1,

  AGENT_MAX_ACTIVE: 3,

  MESSAGE_FOCUS_LOYALTY_VALUE: 2,
  MESSAGE_FLEXIBLE_LOYALTY_VALUE: 1,

  SCOPE_FOCUSED_INFLUENCE: 1,
  SCOPE_BROAD_INFLUENCE: 1 / 2,
  SCOPE_GLOBAL_INFLUENCE: 1 / 3,

  DESPERATION_TURN_LIMIT: 15,
  DESPERATION_SCORE_DIFFERENCE: 10,

  SCORE_RESOURCE_VALUE: 1,
  SCORE_COUNTRY_VALUE: 3,
  SCORE_TERRITORY_VALUE: 1,

  TERRITORY_MAX_LOYALTY: 3,
  TERRITORY_LOYALTY_PERCENT_THRESHOLD: 0.2,
}
