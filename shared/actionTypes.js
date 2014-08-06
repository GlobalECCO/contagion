/*******************************************************************************
 * Objects representing the actions a player can take during their turn
 ******************************************************************************/
// If we're running server-side we have to include the actionTypes file like this
if (typeof require !== 'undefined') {
  var BalanceValues = require('./balanceValues.js').BalanceValues;
}

this.Attack = Attack;
this.Boost = Boost;
this.Desperation = Desperation;
this.Disable = Disable;
this.Escape = Escape;
this.Move = Move;
this.Recruit = Recruit;
this.Remove = Remove;
this.Shift = Shift;
this.Withdraw = Withdraw;

//------------------------------------------------------------------------------
// The base Action object all other actions derive from
function Action() {
  this.player = -1;
  this.source = -1;
  this.cost = 0;
}

//------------------------------------------------------------------------------
// Attack another player's loyalty in a country
Attack.prototype = new Action();
Attack.prototype.constructor = Attack;
function Attack() {
  this.cost = BalanceValues.ACTION_ATTACK_COST;
  this.scope = -1;
  this.target = -1;
}

//------------------------------------------------------------------------------
// Boost your loyalty in a country
Boost.prototype = new Action();
Boost.prototype.constructor = Boost;
function Boost() {
  this.cost = BalanceValues.ACTION_BOOST_COST;
  this.scope = -1;
}

//------------------------------------------------------------------------------
// Perform a once per game action to try to make a comeback
Desperation.prototype = new Action();
Desperation.prototype.constructor = Desperation;
function Desperation() {
  this.cost = BalanceValues.ACTION_DESPERATION_COST;
}

//------------------------------------------------------------------------------
// Disable another player's agent
Disable.prototype = new Action();
Disable.prototype.constructor = Disable;
function Disable() {
  this.cost = BalanceValues.ACTION_DISABLE_COST;
  this.target = -1;
  this.agentIndex = -1;
}

//------------------------------------------------------------------------------
// Priority move an agent from one country to another
Escape.prototype = new Action();
Escape.prototype.constructor = Escape;
function Escape() {
  this.cost = BalanceValues.ACTION_ESCAPE_COST;
  this.destination = -1;
  this.agentIndex = -1;
}

//------------------------------------------------------------------------------
// Move an agent from one country to another
Move.prototype = new Action();
Move.prototype.constructor = Move;
function Move() {
  this.cost = BalanceValues.ACTION_MOVE_COST;
  this.destination = -1;
  this.agentIndex = -1;
}

//------------------------------------------------------------------------------
// Recruit a new agent with the given type and message type
Recruit.prototype = new Action();
Recruit.prototype.constructor = Recruit;
function Recruit() {
  this.cost = BalanceValues.ACTION_RECRUIT_COST;
  this.messageType = -1;
  this.target = -1;
}

//------------------------------------------------------------------------------
// Remove another player's agent from the board entirely
Remove.prototype = new Action();
Remove.prototype.constructor = Remove;
function Remove() {
  this.cost = BalanceValues.ACTION_REMOVE_COST;
  this.target = -1;
  this.agentIndex = -1;
}

//------------------------------------------------------------------------------
// Change one of your Agent's message type
Shift.prototype = new Action();
Shift.prototype.constructor = Shift;
function Shift() {
  this.cost = BalanceValues.ACTION_SHIFT_COST;
  this.agentIndex = -1;
  this.messageType = -1;
  this.target = -1;
}

//------------------------------------------------------------------------------
// Voluntarily disable one of your own Agents
Withdraw.prototype = new Action();
Withdraw.prototype.constructor = Withdraw;
function Withdraw() {
  this.cost = BalanceValues.ACTION_WITHDRAW_COST;
  this.agentIndex = -1;
}
