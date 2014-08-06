/*******************************************************************************
 * Game logic for updating country loyalties to players
 ******************************************************************************/
var BalanceValues = require('../../shared/balanceValues.js').BalanceValues;
var IdeologyTypes = require('../../shared/ideologyTypes.js').IdeologyTypes;
var MessageType = require('../../shared/agents.js').MessageType;
var ServerUtil = require('./util.js');

//------------------------------------------------------------------------------
// Pre-populate loyalty for this player somewhere
this.populateStartingLoyalty = function(gameState) {
  // State always populates first,
  for (var playerIndex = 0; playerIndex < gameState.players.length; ++playerIndex) {
    if (gameState.players[playerIndex].ideologyType === IdeologyTypes.STATE) {
      addFocusedLoyalty(gameState, playerIndex);
      break;
    }
  }

  for (var playerIndex = 0; playerIndex < gameState.players.length; ++playerIndex) {
    switch (gameState.players[playerIndex].ideologyType) {
      case IdeologyTypes.RELIGIOUS:
      case IdeologyTypes.NATIONALIST:
      case IdeologyTypes.MARXIST:
        addScatteredLoyalty(gameState, playerIndex);
        break;
      default:
        break;
    }
  }
}

//------------------------------------------------------------------------------
// Update the loyalties in all the given countries
this.updateLoyalties = function(gameState) {
  for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
    var country = gameState.countries[countryIndex];
    addAgentPendingLoyalty(country);
    applyPendingLoyalties(country);
  }
};

//------------------------------------------------------------------------------
// Pre-populate one random territory with full loyalty
var addFocusedLoyalty = function(gameState, playerIndex) {
  // Pick a random country that has no loyalty to any player
  var loyalCountryIndex = getRandomAccessibleCountry(gameState, playerIndex, true, 3);

  // Set the loyalty of the first territory to max loyalty for this player
  for (var territoryIndex = 0; territoryIndex < gameState.countries[loyalCountryIndex].territories.length; ++territoryIndex) {
    addLoyaltyToOpenTerritory(gameState.countries[loyalCountryIndex].territories, playerIndex, 1);
  }
}

//------------------------------------------------------------------------------
// Pre-populate some random territories with some loyalty
var addScatteredLoyalty = function(gameState, playerIndex) {
  for (var loyaltyPoint = 0; loyaltyPoint < 3; ++loyaltyPoint) {
    // Pick a random country that has no loyalty to any player
    var loyalCountryIndex = getRandomAccessibleCountry(gameState, playerIndex);

    // Add one point of loyalty to the first territory for this player
    var territories = gameState.countries[loyalCountryIndex].territories;
    addLoyaltyToOpenTerritory(territories, playerIndex, 1);
  }
}

//------------------------------------------------------------------------------
// Return the index of a random neutral country
var getRandomAccessibleCountry = function(gameState, playerIndex, fullNeutral, requiredTerritorySize) {
  do {
    var randomCountryIndex = Math.floor(Math.random() * (gameState.countries.length));
    var country = gameState.countries[randomCountryIndex];
  } while (!isCountryAccessible(country, playerIndex, fullNeutral) || (requiredTerritorySize !== undefined &&
            country.territories.length !== requiredTerritorySize));
  return randomCountryIndex;
}

//------------------------------------------------------------------------------
// Returns whether the given country is accessible or not
var isCountryAccessible = function(country, playerIndex, fullNeutral) {
  var loyalCount = 0;
  var freeCount = 0;
  for (var territoryIndex = 0; territoryIndex < country.territories.length; ++territoryIndex) {
    if (country.territories[territoryIndex].loyalToWhom != -1) {
      loyalCount++;
      if (country.territories[territoryIndex].loyalToWhom === playerIndex) {
        return false;
      }
    } else {
      freeCount++;
    }
  }

  if (loyalCount === 0 || (!fullNeutral && freeCount > 0)) {
    return true;
  }
  return false;
}

//------------------------------------------------------------------------------
// Add pending loyalty based on agents in this country
var addAgentPendingLoyalty = function(country) {
  for (playerIndex = 0; playerIndex < country.agents.length; ++playerIndex) {
    for (var agentIndex = 0; agentIndex < country.agents[playerIndex].length; ++agentIndex) {
      var agent = country.agents[playerIndex][agentIndex];
      if (agent.messageType === MessageType.FLEXIBLE) {
        ServerUtil.addPendingLoyalty(country, playerIndex, BalanceValues.MESSAGE_FLEXIBLE_LOYALTY_VALUE);
        ServerUtil.addPendingLoyalty(country, agent.target, -BalanceValues.MESSAGE_FLEXIBLE_LOYALTY_VALUE);
      }
      else if (agent.messageType === MessageType.NEGATIVE) {
        ServerUtil.addPendingLoyalty(country, agent.target, -BalanceValues.MESSAGE_FOCUS_LOYALTY_VALUE);
      }
      else if (agent.messageType === MessageType.POSITIVE) {
        ServerUtil.addPendingLoyalty(country, playerIndex, BalanceValues.MESSAGE_FOCUS_LOYALTY_VALUE);
      }
    }
  }
}

//------------------------------------------------------------------------------
// Update country loyalties based on pending loyalties
var applyPendingLoyalties = function(country) {
  if (country.pendingLoyalty !== undefined) {
    applyNegativePendingLoyalties(country);
    applyPositivePendingLoyalties(country);
  }
}

//------------------------------------------------------------------------------
// Update country loyalties based on pending negative loyalties
var applyNegativePendingLoyalties = function(country) {
  for (var playerIndex = 0; playerIndex < country.pendingLoyalty.length; ++playerIndex) {
    var loyaltyShift = country.pendingLoyalty[playerIndex];
    if (loyaltyShift < 0) {
      updateCountryLoyalty(country, -1, -loyaltyShift, 'attack', playerIndex);
    }
  }
}

//------------------------------------------------------------------------------
// Update country loyalties based on pending flexible loyalties
var applyPositivePendingLoyalties = function(country) {
  resolveMultiplePositivesConflicts(country);

  // If anyone else has any left, then apply it now
  for (var playerIndex = 0; playerIndex < country.pendingLoyalty.length; ++playerIndex) {
    var loyaltyShift = country.pendingLoyalty[playerIndex];
    if (loyaltyShift > 0) {
      updateCountryLoyalty(country, playerIndex, loyaltyShift, 'boost');
    }
  }
}

//------------------------------------------------------------------------------
// Resolve any cases where multiple players have positive influence on this country
var resolveMultiplePositivesConflicts = function(country) {
  var boostingPlayerCount = getNumPlayersPending(country.pendingLoyalty);
  while (boostingPlayerCount > 1) {
    // If there are less neutral territories than players competing for territories
    if (getNumberOfNeutralTerritories(country) < boostingPlayerCount) {
      // If multiple players are competing for the same territory remove all of their pending points
      var competingPlayers = getCompetingPlayers(country, country.pendingLoyalty);
      for (var competingIndex = 0; competingIndex < competingPlayers.length; ++competingIndex) {
        country.pendingLoyalty[competingPlayers[competingIndex]] = 0;
      }
    }

    // Try to fill up one location for any player with pending points remaining
    for (var playerIndex = 0; playerIndex < country.pendingLoyalty.length; ++playerIndex) {
      var loyaltyShift = country.pendingLoyalty[playerIndex];
      if (loyaltyShift > 0) {
        country.pendingLoyalty[playerIndex] += shiftCountryLoyalty(country, 'boost', playerIndex, Math.min(loyaltyShift, 1)) - 1;
      }
    }

    boostingPlayerCount = getNumPlayersPending(country.pendingLoyalty);
  }
}

//------------------------------------------------------------------------------
// Keep going over the pending loyalties until there are 0 or 1 positive values
var getNumPlayersPending = function(pendingLoyalty) {
  var boostingPlayerCount = 0;
  for (var playerIndex = 0; playerIndex < pendingLoyalty.length; ++playerIndex) {
    var loyalty = pendingLoyalty[playerIndex];
    if (loyalty > 0) {
      ++boostingPlayerCount;
    }
  }
  return boostingPlayerCount;
}

//------------------------------------------------------------------------------
// Count the number of neutral territories in this country
var getNumberOfNeutralTerritories = function(country) {
  var neutralCount = 0;
  for (var territoryIndex = 0; territoryIndex < country.territories.length; ++territoryIndex) {
    if (country.territories[territoryIndex].loyalToWhom === -1) {
      ++neutralCount;
    }
  }
  return neutralCount;
}

//------------------------------------------------------------------------------
// Generate a list of player indices for all players competing for the same territory
var getCompetingPlayers = function(country, pendingLoyalty) {
  var competingPlayers = [];
  var potentialTerritories = getPotentialTerritoryPairs(country, pendingLoyalty);
  for (var territory1Index = 0; territory1Index < potentialTerritories.length; ++territory1Index) {
    if (potentialTerritories[territory1Index].territory === -1) {
      competingPlayers.push(potentialTerritories[territory1Index].player);
    }
    else {
      for (var territory2Index = territory1Index + 1; territory2Index < potentialTerritories.length; ++territory2Index) {
        if (potentialTerritories[territory1Index].territory === potentialTerritories[territory2Index].territory) {
          competingPlayers.push(potentialTerritories[territory1Index].player);
          competingPlayers.push(potentialTerritories[territory2Index].player);
          break;
        }
      }
    }
  }
  return competingPlayers;
}

//------------------------------------------------------------------------------
// Generate a list of territories players would boost to
var getPotentialTerritoryPairs = function(country, pendingLoyalty) {
  var pairs = [];
  for (var playerIndex = 0; playerIndex < pendingLoyalty.length; ++playerIndex) {
    if (pendingLoyalty[playerIndex] > 0) {
      pairs.push({player: playerIndex, territory: getMostLoyalTerritoryIndex(country, playerIndex)});
    }
  }
  return pairs;
}

//------------------------------------------------------------------------------
// Update the loyalty based on the difference between the two highest point values
var updateCountryLoyalty = function(country, playerIndex, timesToUpdate, updateType, target) {
  while (timesToUpdate > 0) {
    timesToUpdate += shiftCountryLoyalty(country, updateType, playerIndex, Math.min(timesToUpdate, 1), target) - 1;
  }
};

//------------------------------------------------------------------------------
// Update the loyalty in this country some amount in the given direction, return
// loyalty overflow amount
var shiftCountryLoyalty = function(country, updateType, playerIndex, influencePoints, target) {
  var excessInfluence = 0;

  if (updateType !== 'attack') {
    // Find the first spot with the most loyalty to this playerIndex
    var boostedLoyaltyIndex = getMostLoyalTerritoryIndex(country, playerIndex);
    if (boostedLoyaltyIndex > -1) {
      excessInfluence = addLoyalty(country.territories[boostedLoyaltyIndex], playerIndex, influencePoints);
    }
  }
  else {
    // Try to find the spot with the lowest loyalty for the other player
    var attackedLoyaltyIndex = getLeastLoyalTerritoryIndex(country, playerIndex, target);
    if (attackedLoyaltyIndex > -1) {
      excessInfluence = subtractLoyalty(country.territories[attackedLoyaltyIndex], influencePoints);
    }
  }

  return excessInfluence;
};

//------------------------------------------------------------------------------
// Returns the index of the territory most loyal to the given player with a
// remaining neutral spot or the first neutral territory, -1 if there isn't one
// available
var getMostLoyalTerritoryIndex = function(country, playerIndex) {
  var mostLoyalTerritory = -1;
  var mostLoyalCount = -1;
  for (var territoryIndex = 0; territoryIndex < country.territories.length; ++territoryIndex) {
    var loyalty = country.territories[territoryIndex].loyalToWhom;
    if (loyalty === playerIndex || loyalty === -1) {
      var loyalCount = country.territories[territoryIndex].currentLoyalty;
      var loyaltyMax = country.territories[territoryIndex].maxLoyalty;
      if (loyalCount < loyaltyMax && loyalCount > mostLoyalCount) {
        mostLoyalTerritory = territoryIndex;
        mostLoyalCount = loyalCount;
      }
    }
  }

  return mostLoyalTerritory;
};

//------------------------------------------------------------------------------
// Returns the index of the territory with the least amount of loyalty to
// another player (a specific target if defined), -1 if there aren't territories
// in this country loyal to another player
var getLeastLoyalTerritoryIndex = function(country, playerIndex, target) {
  var leastLoyalTerritory = -1;
  var leastLoyalCount = 1000;
  for (var territoryIndex = country.territories.length - 1; territoryIndex >= 0; --territoryIndex) {
    var loyalty = country.territories[territoryIndex].loyalToWhom;
    if ((target === undefined && loyalty !== playerIndex && loyalty > -1) ||
        loyalty === target) {
      var loyalCount = country.territories[territoryIndex].currentLoyalty;
      if (loyalCount < leastLoyalCount) {
        leastLoyalTerritory = territoryIndex;
        leastLoyalCount = loyalCount;
      }
    }
  }

  return leastLoyalTerritory;
};

//------------------------------------------------------------------------------
// Add loyalty to the given player in this territory
var addLoyaltyToOpenTerritory = function(territories, playerIndex, influencePoints) {
  for (var territoryIndex = 0; territoryIndex < territories.length; ++territoryIndex) {
    var territory = territories[territoryIndex];

    if (territory.loyalToWhom === -1) {
      addLoyalty(territory, playerIndex, influencePoints);
    }
  }
};

//------------------------------------------------------------------------------
// Add loyalty to the given player in this territory
var addLoyalty = function(territory, playerIndex, influencePoints) {
  var excessInfluence = 0;

  // If this territory was neutral, set it loyal to the given player
  if (territory.loyalToWhom === -1) {
    territory.loyalToWhom = playerIndex;
    territory.currentLoyalty = 0;
  }

  // Increase the loyalty, capped at the max
  territory.currentLoyalty += influencePoints;
  if (territory.currentLoyalty > territory.maxLoyalty) {
    excessInfluence = territory.currentLoyalty - territory.maxLoyalty;
    territory.currentLoyalty = territory.maxLoyalty;
  }

  return excessInfluence;
};

//------------------------------------------------------------------------------
// Remove loyalty from the given territory, reset to neutral if it drops to 0
var subtractLoyalty = function(territory, influencePoints) {
  var excessInfluence = 0;

  // Take off some loyalty, if it drops below 0, set this territory to neutral
  territory.currentLoyalty -= influencePoints;
  if (territory.currentLoyalty <= 0.01) {
    excessInfluence = -territory.currentLoyalty;
    territory.currentLoyalty = 0;
    territory.loyalToWhom = -1;
  }

  return excessInfluence;
};
