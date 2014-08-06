/*******************************************************************************
 * The main game logic controller that manages the current game state
 ******************************************************************************/
var GamePhase = require('../../shared/gamePhase.js').GamePhase;
var ActionLogic = require('./actions.js');
var EndGameLogic = require('./endGame.js');
var LoyaltyLogic = require('./loyalty.js');
var ResourcesLogic = require('./resources.js');

//------------------------------------------------------------------------------
// Setup the initial state of the game
this.initializeNewGame = function(gameState, mapData, playerCount) {
  // Initialize the country list (assumes the first <g> element in the svg file is not a country)
  var XmlDocument = require('xmldoc').XmlDocument;
  var results = new XmlDocument(mapData);
  var countries = results.childrenNamed('g');
  for (var countryIndex = 0; countryIndex < countries.length; ++countryIndex) {
    // Ensure the element has 'Nation' in its id
    if (countries[countryIndex].attr.id.indexOf("Nation") !== -1) {
      gameState.countries.push({});
      var territories = countries[countryIndex].childrenNamed('g');
      for (var territoryIndex = 0; territoryIndex < territories.length; ++territoryIndex) {
        // All territories have merson in their id
        if (territories[territoryIndex].attr.id.indexOf("merson") !== -1) {
          gameState.countries[countryIndex - 1].territories.push({});
        }
      }

      for (var playerIndex = 0; playerIndex < playerCount; ++playerIndex) {
        gameState.countries[countryIndex - 1].agents.push([]);
        gameState.countries[countryIndex - 1].markModified('agents');
      }
    }
  }
}

//------------------------------------------------------------------------------
// Update the state of the game using the given list of player actions
this.populateStartingLoyalty = function(gameState) {
  LoyaltyLogic.populateStartingLoyalty(gameState);
}

//------------------------------------------------------------------------------
// Update the state of the game using the given list of player actions
this.updateGameState = function (gameState) {
  ++gameState.currentTurnIndex; //increment the turn counter

  var playerActions = gameState.getPlayerActions();
  if (gameState.phase == GamePhase.SETUP) {
    gameState.phase = GamePhase.NORMAL;
  }
  else if (gameState.phase == GamePhase.NORMAL) {
    var desperateActions = ActionLogic.extractDesperationActions(playerActions);
    ResourcesLogic.decreasePlayerResources(gameState, playerActions);
    // If someone used a Desperation Action, all other actions are invalid
    if (desperateActions.length > 0) {
      ActionLogic.performActions(gameState, desperateActions);
    }
    else {
      ActionLogic.performActions(gameState, playerActions);
    }
    LoyaltyLogic.updateLoyalties(gameState);
    ResourcesLogic.increasePlayerResources(gameState, gameState.players.length);
    if (EndGameLogic.hasWinner(gameState)) {
      gameState.phase = GamePhase.ENDGAME;
    }
  }
}
