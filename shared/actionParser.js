/*******************************************************************************
 * Functions to convert Actions to and from a string
 ******************************************************************************/
// If we're running server-side we have to include the actionTypes file like this
if (typeof require !== 'undefined') {
  var ActionScope = require('./actionScope.js').ActionScope;
  var Attack = require('./actionTypes.js').Attack;
  var Boost = require('./actionTypes.js').Boost;
  var Desperation = require('./actionTypes.js').Desperation;
  var Disable = require('./actionTypes.js').Disable;
  var Escape = require('./actionTypes.js').Escape;
  var Move = require('./actionTypes.js').Move;
  var Recruit = require('./actionTypes.js').Recruit;
  var Remove = require('./actionTypes.js').Remove;
  var Shift = require('./actionTypes.js').Shift;
  var Withdraw = require('./actionTypes.js').Withdraw;
  var BalanceValues = require('./balanceValues.js').BalanceValues;
}

//------------------------------------------------------------------------------
// Parse a string representing the list of actions a player wants to take
this.parseActionString = function(stringToParse, playerIndex) {
  var actions = [];
  if (stringToParse != "") {
    var actionStrings = stringToParse.split(";");
    for (var index in actionStrings) {
      // Parse the action based on the first character
      var firstChar = actionStrings[index].charAt(0);
      var actionParameters = actionStrings[index].substring(1);
      actionParameters = actionParameters.split(",");
      var newAction = null;
      if (firstChar == 'A' && actionParameters.length == 3) {
        newAction = new Attack();
        newAction.scope = parseInt(actionParameters[0]);
        newAction.source = parseInt(actionParameters[1]);
        newAction.target = parseInt(actionParameters[2]);
      }
      else if (firstChar == 'B' && actionParameters.length == 2) {
        newAction = new Boost();
        newAction.scope = parseInt(actionParameters[0]);
        newAction.source = parseInt(actionParameters[1]);
      }
      else if (firstChar == 'D' && actionParameters.length == 3) {
        newAction = new Disable();
        newAction.source = parseInt(actionParameters[0]);
        newAction.target = parseInt(actionParameters[1]);
        newAction.agentIndex = parseInt(actionParameters[2]);
      }
      else if (firstChar == 'E' && actionParameters.length == 3) {
        newAction = new Escape();
        newAction.source = parseInt(actionParameters[0]);
        newAction.destination = parseInt(actionParameters[1]);
        newAction.agentIndex = parseInt(actionParameters[2]);
      }
      else if (firstChar == 'M' && actionParameters.length == 3) {
        newAction = new Move();
        if (isNaN(actionParameters[0])) {
          newAction.source = actionParameters[0];
        }
        else {
          newAction.source = parseInt(actionParameters[0]);
        }
        newAction.destination = parseInt(actionParameters[1]);
        newAction.agentIndex = parseInt(actionParameters[2]);
      }
      else if (firstChar == 'R' && actionParameters.length == 3) {
        newAction = new Remove();
        newAction.source = parseInt(actionParameters[0]);
        newAction.target = parseInt(actionParameters[1]);
        newAction.agentIndex = parseInt(actionParameters[2]);
      }
      else if (firstChar == 'S' && actionParameters.length == 4) {
        newAction = new Shift();
        newAction.source = parseInt(actionParameters[0]);
        newAction.agentIndex = parseInt(actionParameters[1]);
        newAction.messageType = parseInt(actionParameters[2]);
        newAction.target = parseInt(actionParameters[3]);
      }
      else if (firstChar == 'W' && actionParameters.length == 2) {
        newAction = new Withdraw();
        newAction.source = parseInt(actionParameters[0]);
        newAction.agentIndex = parseInt(actionParameters[1]);
      }
      else if (firstChar == 'X' && actionParameters.length == 1) {
        newAction = new Desperation();
        newAction.source = parseInt(actionParameters[0]);
      }
      else if (!isNaN(firstChar) && actionParameters.length == 3) {
        newAction = new Recruit();
        newAction.source = parseInt(firstChar + actionParameters[0]);
        newAction.messageType = parseInt(actionParameters[1]);
        newAction.target = parseInt(actionParameters[2]);
      }

      // If the action was successfully created, then add it
      if (newAction != null) {
        // If this action has a scope and it's global, then add 2 to the cost
        if (newAction.scope !== undefined && newAction.scope === ActionScope.GLOBAL) {
          newAction.cost += BalanceValues.ACTION_GLOBAL_COST;
        }
        newAction.player = playerIndex;
        actions.push(newAction);
      }
    }
  }
  return actions;
}

//------------------------------------------------------------------------------
// Returns a string representing the given action
var stringifyAction = function(action) {
  var string = "";
  if (action instanceof Attack) {
    string = "A" +
    action.scope.toString() + "," +
    action.source.toString() + "," +
    action.target.toString();
  }
  else if (action instanceof Boost) {
    string = "B" +
    action.scope.toString() + "," +
    action.source.toString();
  }
  else if (action instanceof Desperation) {
    string = "X" +
    action.source.toString();
  }
  else if (action instanceof Disable) {
    string = "D" +
    action.source.toString() + "," +
    action.target.toString() + "," +
    action.agentIndex.toString();
  }
  else if (action instanceof Escape) {
    string = "E" +
    action.source.toString() + "," +
    action.destination.toString() + "," +
    action.agentIndex.toString();
  }
  else if (action instanceof Move) {
    string = "M" +
    action.source.toString() + "," +
    action.destination.toString() + "," +
    action.agentIndex.toString();
  }
  else if (action instanceof Recruit) {
    string = action.source.toString() + "," +
    action.messageType.toString() + "," +
    action.target.toString();
  }
  else if (action instanceof Remove) {
    string = "R" +
    action.source.toString() + "," +
    action.target.toString() + "," +
    action.agentIndex.toString();
  }
  else if (action instanceof Shift) {
    string = "S" +
    action.source.toString() + "," +
    action.agentIndex.toString() + "," +
    action.messageType.toString() + "," +
    action.target.toString();
  }
  else if (action instanceof Withdraw) {
    string = "W" +
    action.source.toString() + "," +
    action.agentIndex.toString();
  }
  return string;
}
