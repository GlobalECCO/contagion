/*******************************************************************************
 * A series of util functions used by client and server to determine end game
 * and resource generation logic
 ******************************************************************************/
// If we're running server-side we have to include the actionTypes file like this
if (typeof require !== 'undefined') {
  var ActionScope = require('./actionScope.js').ActionScope;
  var BalanceValues = require('./balanceValues.js').BalanceValues;
  var Desperation = require('./actionTypes.js').Desperation;
}

//------------------------------------------------------------------------------
// Return the number of countries a player has to control to win
this.numberOfCountriesNeededToWin = function(gameState) {
  return Math.ceil(gameState.countries.length / gameState.players.length);
}

//------------------------------------------------------------------------------
// Return the number of territories a player has to have loyalty in to win
this.numberOfTerritoriesNeededToWin = function(gameState) {
  var totalTerritoryCount = 0;
  for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
    totalTerritoryCount += gameState.countries[countryIndex].territories.length;
  }
  return Math.ceil(totalTerritoryCount / gameState.players.length + 1);
}

//------------------------------------------------------------------------------
// Returns the base number of resources a player generates every turn
this.getBaseIncome = function() {
  return BalanceValues.BASE_INCOME;
}

//------------------------------------------------------------------------------
// Return the number of resources this country generates
this.getCountryResources = function(country) {
  return country.territories.length;
}

//------------------------------------------------------------------------------
// Return the thresholds for how many loyal territories a player must have to
// generate extra resources
this.getTerritoryResourceThresholds = function() {
  return BalanceValues.TERRITORY_RESOURCE_THRESHOLDS;
}

//------------------------------------------------------------------------------
// Return the cost for having multiple Agents
this.getAgentUpkeepCosts = function(gameState, playerIndex) {
  return this.getActiveAgents(gameState, playerIndex) - 1;
}

//------------------------------------------------------------------------------
// Return the number of non-disabled agents for a particular player
this.getActiveAgents = function(gameState, playerIndex) {
  var agentCount = 0;
  for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
    agentCount += gameState.countries[countryIndex].agents[playerIndex].length;
  }
  return agentCount;
}

//------------------------------------------------------------------------------
// Add a tax property to each of the actions for its additional cost
this.getExtraActionCosts = function(actions) {
  //var additionalActionCount = 0;
  //for (var actionIndex = 0; actionIndex < actions.length; ++actionIndex) {
  //  if (!(actions[actionIndex] instanceof Desperation)) {
  //    actions[actionIndex].tax = additionalActionCount;
  //    ++additionalActionCount;
  //  }
  //}
}

//------------------------------------------------------------------------------
// Get the resource cost of the given list of actions
this.getActionCosts = function(actions) {
  this.getExtraActionCosts(actions);
  var cost = 0;
  for (var actionIndex = 0; actionIndex < actions.length; ++actionIndex) {
    cost += actions[actionIndex].cost;
    if (actions[actionIndex].tax !== undefined) {
      cost += actions[actionIndex].tax;
    }
  }
  return cost;
}

//------------------------------------------------------------------------------
// Returns whether every territory is fully loyal to this player or not
this.playerControlsCountry = function (country, playerIndex) {
  for (var territoryIndex = 0; territoryIndex < country.territories.length; ++territoryIndex) {
    var territory = country.territories[territoryIndex];
    if (territory.loyalToWhom != playerIndex ||
       territory.currentLoyalty < territory.maxLoyalty) {
      return false;
    }
  }
  return true;
}

//------------------------------------------------------------------------------
// Returns the number of territories that have at least some loyalty to the
// given player in this country
this.getNumberOfLoyalTerritories = function (country, playerIndex) {
  var loyalTerritories = 0;
  for (var territoryIndex = 0; territoryIndex < country.territories.length; ++territoryIndex) {
    var territory = country.territories[territoryIndex];
    // Territories aren't loyal until they have more than 25% loyalty
    if (territory.loyalToWhom === playerIndex &&
        territory.currentLoyalty / territory.maxLoyalty > BalanceValues.TERRITORY_LOYALTY_PERCENT_THRESHOLD) {
      ++loyalTerritories;
    }
  }
  return loyalTerritories;
}

//----------------------------------------------------------------------------
// Get the color of a given territory
this.getTerritoryColor = function(territory, neutralColor, playerColor) {
  var percent = territory.currentLoyalty / territory.maxLoyalty;
  return interpolateColor(neutralColor, playerColor, percent);
};

//----------------------------------------------------------------------------
// Interpolate between the first given color and the second
var interpolateColor = function(colorString1, colorString2, percent) {
  var color1 = hexToRGB(colorString1);
  var color2 = hexToRGB(colorString2);
  var red = Math.round(color1.r + (color2.r - color1.r) * percent);
  var green = Math.round(color1.g + (color2.g - color1.g) * percent);
  var blue = Math.round(color1.b + (color2.b - color1.b) * percent);
  return "#" + componentToHex(red) + componentToHex(green) + componentToHex(blue);
};

//----------------------------------------------------------------------------
// Turn a hex color value into an RGB Object
var hexToRGB = function(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

//----------------------------------------------------------------------------
// Convert a color component to its hex string value
var componentToHex = function(component) {
  var hex = component.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};
