/*******************************************************************************
 * Game logic for determining the end state of the game and who has won
 ******************************************************************************/
var UtilFunctions = require('../../shared/utilFunctions.js');

// -----------------------------------------------------------------------------
// Returns whether there is a winner given the current game state or not
this.hasWinner = function(gameState){
  gameState.winningPlayers = getWinningPlayers(gameState);
  if (gameState.winningPlayers.length > 0) {
    return true;
  }
  return false;
};

// -----------------------------------------------------------------------------
// Returns the list of players who have won the game given the game state
var getWinningPlayers = function(gameState) {
  var winningPlayers = [];
  for (var playerIndex = 0; playerIndex < gameState.players.length; ++playerIndex) {
    var controlledCountryCount = 0;
    var loyalTerritoryCount = 0;
    for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
      var country = gameState.countries[countryIndex];
      if (UtilFunctions.playerControlsCountry(country, playerIndex)) {
        ++controlledCountryCount;
      }

      loyalTerritoryCount += UtilFunctions.getNumberOfLoyalTerritories(country, playerIndex);
    }

    // Check if a player controls the majority of countries or
    // if a player has a majority of territories loyal to them
    if ((controlledCountryCount >= UtilFunctions.numberOfCountriesNeededToWin(gameState)) ||
       (loyalTerritoryCount >= UtilFunctions.numberOfTerritoriesNeededToWin(gameState))) {
      winningPlayers.push(playerIndex);
    }
  }

  return winningPlayers;
};
