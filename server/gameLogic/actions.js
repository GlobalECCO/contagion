/*******************************************************************************
 * Game logic for determing what actions do and how they change the game state
 ******************************************************************************/
var ActionScope = require('../../shared/actionScope.js').ActionScope;
var ActionType = require('../../shared/actionTypes.js');
var Agent = require('../../shared/agents.js').Agent;
var BalanceValues = require('../../shared/balanceValues.js').BalanceValues;
var MessageType = require('../../shared/agents.js').MessageType;
var ServerUtil = require('./util.js');

// -----------------------------------------------------------------------------
// Return a list of Desperation Actions pulled out of the given action lists
this.extractDesperationActions = function(playerActions) {
  var desperationActions = [];
  for (var actionIndex = 0; actionIndex < playerActions.length; ++actionIndex) {
    if (playerActions[actionIndex] instanceof ActionType.Desperation) {
      desperationActions = desperationActions.concat(playerActions.splice(actionIndex, 1));
      --actionIndex;
    }
  }
  return desperationActions;
}

// -----------------------------------------------------------------------------
// Perform the list of players' actions
this.performActions = function(gameState, playerActions) {
  // Clear out any Remove/Disable actions that affect Escaped Agents
  clearEscapedActions(playerActions);

  // Perform all Escape actions first
  performActionsOfType(gameState, playerActions, ActionType.Escape);

  // Perform all Remove/Disable actions second
  performActionsOfType(gameState, playerActions, ActionType.Remove);
  performActionsOfType(gameState, playerActions, ActionType.Disable);

  // Keep performing actions until the list is empty
  while (playerActions.length > 0) {
    var action = playerActions.shift();
    performAction(gameState, action);
  }

  // Now actually remove all Agents that were supposed to be removed/disabled
  deleteRemovedAgents(gameState);
};

// -----------------------------------------------------------------------------
// Perform all actions of the given type
var performActionsOfType = function(gameState, actions, type) {
  for (var actionIndex = 0; actionIndex < actions.length; ++actionIndex) {
    var action = actions[actionIndex];
    if (action instanceof type) {
      performAction(gameState, action);
      // Remove the action that just got performed
      actions.splice(actionIndex, 1);
      --actionIndex;
    }
  }
};

// -----------------------------------------------------------------------------
// Remove any Remove/Disable actions from the list if the targeted Agent escaped
var clearEscapedActions = function(actions) {
  for (var escapeIndex = 0; escapeIndex < actions.length; ++escapeIndex) {
    // If this is an escape, look from the beginning of the list for any Remove/
    // Disable actions that target the same Agent
    var escapeAction = actions[escapeIndex];
    if (escapeAction instanceof ActionType.Escape) {
      for (var counterIndex = 0; counterIndex < actions.length; ++counterIndex) {
        var counteredAction = actions[counterIndex];
        if ((counteredAction instanceof ActionType.Remove || counteredAction instanceof ActionType.Disable) &&
            counteredAction.source === escapeAction.source &&
            counteredAction.target === escapeAction.player &&
            counteredAction.agentIndex === escapeAction.agentIndex) {
          actions.splice(counterIndex, 1);
          --counterIndex;
        }
      }
    }
  }
};

// -----------------------------------------------------------------------------
// Perform the given action for the given player
var performAction = function(gameState, action) {
  if (action instanceof ActionType.Move || action instanceof ActionType.Escape) {
    moveAgent(gameState, action);
  }
  else if (action instanceof ActionType.Recruit) {
    recruitAgent(gameState, action);
  }
  else if (action instanceof ActionType.Disable || action instanceof ActionType.Remove) {
    removeAgent(gameState, action);
  }
  else if (action instanceof ActionType.Shift) {
    shiftAgentMessage(gameState, action);
  }
  else if (action instanceof ActionType.Withdraw) {
    withdrawAgent(gameState, action);
  }
  else if (action instanceof ActionType.Desperation) {
    performDesperateAction(gameState, action);
  }
  else if (action instanceof ActionType.Attack || action instanceof ActionType.Boost) {
    performScopedAction(gameState, action);
  }
};

// -----------------------------------------------------------------------------
// Move an agent from one country to another
var moveAgent = function(gameState, action) {
  var movedAgent = null;
  if (action.source !== "D") {
    movedAgent = gameState.countries[action.source].agents[action.player].splice(action.agentIndex, 1)[0];
    gameState.countries[action.source].markModified('agents');
  }
  else {
    // We can't directly use the disabled agent object since that has database
    // properties tacked on, so make a copy
    var dbAgent = gameState.players[action.player].disabledAgents.splice(action.agentIndex, 1)[0];
    movedAgent = new Agent(dbAgent.messageType, dbAgent.target);
  }
  gameState.countries[action.destination].agents[action.player].push(movedAgent);
  gameState.countries[action.destination].markModified('agents');
}

// -----------------------------------------------------------------------------
// Add a new Agent to the game
var recruitAgent = function(gameState, action) {
  var newAgent = new Agent(action.messageType, action.target);
  gameState.countries[action.source].agents[action.player].push(newAgent);
  gameState.countries[action.source].markModified('agents');
}

// -----------------------------------------------------------------------------
// Remove an Agent from the game
var removeAgent = function(gameState, action) {
  // We have to make sure the targeted index wasn't changed due to already removed agents
  var agents = gameState.countries[action.source].agents[action.target];
  var agentIndex = action.agentIndex;
  for (var index = 0; index <= agentIndex && index < agents.length; ++index) {
    if (agents[index].removed !== undefined) {
      ++agentIndex;
    }
  }
  agents[agentIndex].removed = action;
}

// -----------------------------------------------------------------------------
// Change the message type of a particular Agent
var shiftAgentMessage = function(gameState, action) {
  var agent = gameState.countries[action.source].agents[action.player][action.agentIndex];
  // If this agent is already being removed, don't worry about withdrawing it
  if (agent && agent.removed === undefined) {
    agent.messageType = action.messageType;
    agent.target = action.target;
    gameState.countries[action.source].markModified('agents');
  }
}

// -----------------------------------------------------------------------------
// Withdraw an Agent from the game
var withdrawAgent = function(gameState, action) {
  // If this agent is already being removed, don't worry about withdrawing it
  var agent = gameState.countries[action.source].agents[action.player][action.agentIndex];
  if (agent && agent.removed === undefined) {
    gameState.countries[action.source].agents[action.player].splice(action.agentIndex, 1);
    gameState.countries[action.source].markModified('agents');
  }
}

// -----------------------------------------------------------------------------
// Perform the designated act of desperation
var performDesperateAction = function(gameState, action) {
  // Disable all opponent agents
  for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
    var country = gameState.countries[countryIndex];
    for (var playerIndex = 0; playerIndex < country.agents.length; ++playerIndex) {
      if (playerIndex !== action.player) {
        for (var agentIndex = 0; agentIndex < country.agents[playerIndex].length; ++agentIndex) {
          agent = country.agents[playerIndex][agentIndex];
          if (agent) {
            agent.removed = action;
          }
        }
      }
    }
  }
  // Mark this player as having used his Desperation action
  gameState.players[action.player].usedDesperation = true;
}

// -----------------------------------------------------------------------------
// Figure out which scope this action is and send it to the right processor
var performScopedAction = function(gameState, action) {
  switch (action.scope) {
    case ActionScope.GLOBAL:
      performGlobalAction(gameState, action);
      break;
    case ActionScope.BROAD:
      performBroadAction(gameState, action);
      break;
    case ActionScope.LOCAL:
      performLocalAction(gameState, action);
      break;
  }
}

// -----------------------------------------------------------------------------
// Perform the given action in all countries
var performGlobalAction = function(gameState, action) {
  for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
    adjustLoyalty(gameState.countries[countryIndex], action);
  }
}

// -----------------------------------------------------------------------------
// Perform the given action in all countries the player has Agents in
var performBroadAction = function(gameState, action) {
  for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
    var country = gameState.countries[countryIndex];
    if (getActiveAgentCount(country, action) > 0) {
      adjustLoyalty(country, action);
    }
  }
}

// -----------------------------------------------------------------------------
// Perform the given action in the designtated country
var performLocalAction = function(gameState, action) {
  adjustLoyalty(gameState.countries[action.source], action);
}

// -----------------------------------------------------------------------------
// Get the number of active agents in this country for this player
var getActiveAgentCount = function(country, action) {
  var agentCount = 0;
  for (var agentIndex = 0; agentIndex < country.agents[action.player].length; ++agentIndex) {
    // Agents that are set to be removed do not count
    var agent = country.agents[action.player][agentIndex];
    if (agent.removed === undefined) {
      ++agentCount;
    }
  }
  return agentCount;
};

// -----------------------------------------------------------------------------
// Adjust the pending loyalty change in the given country based on this action
var adjustLoyalty = function(country, action) {
  var targetPlayer = -1, loyaltyAmount = 0;

  // If this is a Global action, it has a preset influence total
  if (action.scope === ActionScope.GLOBAL) {
    var influence = BalanceValues.SCOPE_GLOBAL_INFLUENCE; // Global actions are very weak
    // If this is a Boost, add to the acting player's total
    if (action instanceof ActionType.Boost) {
      targetPlayer = action.player;
      loyaltyAmount = influence;
    }
    // If this is an Attack, subtract from the target's total
    else if (action instanceof ActionType.Attack) {
      targetPlayer = action.target;
      loyaltyAmount = -influence;
    }
  }
  // Otherwise we use the agents to determine the influence
  else {
    // Broad actions are fairly weak
    var influenceModifier = action.scope === ActionScope.BROAD ? BalanceValues.SCOPE_BROAD_INFLUENCE : BalanceValues.SCOPE_FOCUSED_INFLUENCE;
    var influence = 0;
    for (var agentIndex = 0; agentIndex < country.agents[action.player].length; ++agentIndex) {
      // Agents that are set to be removed do not count
      var agent = country.agents[action.player][agentIndex];
      if (agent.removed === undefined) {
        if (agent.messageType === MessageType.FLEXIBLE) {
          influence = BalanceValues.MESSAGE_FLEXIBLE_LOYALTY_VALUE;
        }
        // Focused message types are worth more than flexible message types
        else if (action instanceof ActionType.Attack && agent.messageType === MessageType.NEGATIVE ||
                 action instanceof ActionType.Boost && agent.messageType === MessageType.POSITIVE) {
          influence = BalanceValues.MESSAGE_FOCUS_LOYALTY_VALUE;
        }

        // If this is a Boost, add to the acting player's total
        if (action instanceof ActionType.Boost) {
          targetPlayer = action.player;
          loyaltyAmount = influence * influenceModifier;
        }
        // If this is an Attack, subtract from the target's total
        else if (action instanceof ActionType.Attack) {
          targetPlayer = agent.target;
          loyaltyAmount = -(influence * influenceModifier);
        }
      }
    }
  }
  ServerUtil.addPendingLoyalty(country, targetPlayer, loyaltyAmount);
}

// -----------------------------------------------------------------------------
// Run through and actually remove all Agents that have been removed now
var deleteRemovedAgents = function(gameState) {
  for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
    for (var playerIndex = 0; playerIndex < gameState.countries[countryIndex].agents.length; ++playerIndex) {
      for (var agentIndex = 0; agentIndex < gameState.countries[countryIndex].agents[playerIndex].length; ++agentIndex) {
        var agent = gameState.countries[countryIndex].agents[playerIndex][agentIndex];
        if (agent.removed !== undefined) {
          var removedAgent = gameState.countries[countryIndex].agents[playerIndex].splice(agentIndex, 1)[0];
          gameState.countries[countryIndex].markModified('agents');
          if (agent.removed instanceof ActionType.Disable) {
            gameState.players[playerIndex].disabledAgents.push(removedAgent);
          }
          --agentIndex;
        }
      }
    }
  }
};
