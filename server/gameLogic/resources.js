/*******************************************************************************
 * Game logic for updating player resources
 ******************************************************************************/
var UtilFunctions = require('../../shared/utilFunctions.js');

//------------------------------------------------------------------------------
// Reduce the players' resources based on the actions they took
this.decreasePlayerResources = function(gameState, actions) {
  // Lump together each player's actions, subtract those action costs from the player
  var currentPlayerIndex = 0;
  var playerActions = [];
  for (var actionIndex = 0; actionIndex < actions.length; ++actionIndex) {
    if (actions[actionIndex].player === currentPlayerIndex) {
      playerActions.push(actions[actionIndex]);
    }
    else {
      gameState.players[currentPlayerIndex].resources -= UtilFunctions.getActionCosts(playerActions);
      currentPlayerIndex = actions[actionIndex].player;
      playerActions = [actions[actionIndex]];
    }
  }

  if (playerActions.length > 0) {
    gameState.players[currentPlayerIndex].resources -= UtilFunctions.getActionCosts(playerActions);
  }
};

//------------------------------------------------------------------------------
// Add the players' resources they generate from the current game state
this.increasePlayerResources = function(gameState, playerCount) {
  for (var playerIndex = 0; playerIndex < playerCount; ++playerIndex) {
    addResources(gameState, playerIndex);
  }
};

//------------------------------------------------------------------------------
// Add the resources this player generates from the current game state
var addResources = function(gameState, playerIndex) {
  // A player always gets one resource per turn
  var newResources = gameState.players[playerIndex].resources + UtilFunctions.getBaseIncome();

  var loyalTerritoryCount = 0;
  for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
    var country = gameState.countries[countryIndex];
    if (UtilFunctions.playerControlsCountry(country, playerIndex)) {
      newResources += UtilFunctions.getCountryResources(country);
    }
    loyalTerritoryCount += UtilFunctions.getNumberOfLoyalTerritories(country, playerIndex);
  }

  var territoryThresholds = UtilFunctions.getTerritoryResourceThresholds();
  for (var thresholdIndex = 0; thresholdIndex < territoryThresholds.length; ++thresholdIndex) {
    if (loyalTerritoryCount >= territoryThresholds[thresholdIndex].threshold) {
      newResources += territoryThresholds[thresholdIndex].value;
    }
  }

  newResources -= UtilFunctions.getAgentUpkeepCosts(gameState, playerIndex);

  gameState.players[playerIndex].resources = newResources;
};
