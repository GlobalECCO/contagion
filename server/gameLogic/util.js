/*******************************************************************************
 * Game logic util functions
 ******************************************************************************/
// -----------------------------------------------------------------------------
// Adjust the pending loyalty on this country for the given player by the given amount
this.addPendingLoyalty = function(country, targetPlayer, loyaltyAmount) {
  if (targetPlayer > -1) {
    // If we don't have a place to store the pending loyalty, create that map
    if (country.pendingLoyalty === undefined) {
      country.pendingLoyalty = [];
      for (var playerIndex = 0; playerIndex < country.agents.length; ++playerIndex) {
        country.pendingLoyalty.push(0);
      }
    }
    country.pendingLoyalty[targetPlayer] += loyaltyAmount;
  }
};
