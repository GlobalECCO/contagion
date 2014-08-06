/*******************************************************************************
 * PreviousActionList - A list of actions each player took on the last turn
 ******************************************************************************/
PreviousActionList.prototype = new ContainerList();
PreviousActionList.prototype.constructor = PreviousActionList;
function PreviousActionList(pageRoot, listClass) {
  'use strict';
  ContainerList.apply(this, [pageRoot, listClass]);

  var self = this;
  var playerActionContainers = [];

  var containerStylePreviousActions = {
    container: "actionListActionsContainer",
    topBar: "previousActionsTopBar",
    title: "actionListHeaderText"
  };

  //-----------------------------------------------------------------------------
  function createRow(gameState, playerIndex) {
    var bgColor = gameState.players[playerIndex].color;
    var cont = self.addContainer('<div class="previousActionsHeaderIcon ideologyType' + gameState.players[playerIndex].ideologyType.toString() + '" style="background-color: ' + bgColor + '"></div><div class="previousActionHeaderText">' + gameState.players[playerIndex].name + '\'s<br>Previous Actions</div>', containerStylePreviousActions);

    //color the top bar to the player's chosen color
    $(cont.rootElement).children('.previousActionsTopBar').css('background-color', bgColor);

    cont.playerIndex = playerIndex; ///<Store the player's index for later reference

    return cont;
  };

  // ---------------------------------------------------------------------------
  this.createPreviousActionList = function (gameState, currentPlayerIndex) {
    //create the current player's elements first in the list
    playerActionContainers.push(createRow(gameState, currentPlayerIndex));

    for (var playerIndex = 0; playerIndex < gameState.players.length; ++playerIndex) {
      if (playerIndex != currentPlayerIndex) {
        playerActionContainers.push(createRow(gameState, playerIndex));
      }
    }
  };

  // ---------------------------------------------------------------------------
  this.removePreviousActionList = function (gameState, currentPlayerIndex) {
    for (var contIndex = 0; contIndex < playerActionContainers.length; ++contIndex) {
      playerActionContainers[contIndex].rootElement.remove();
    }
    playerActionContainers = [];
  };

  // ---------------------------------------------------------------------------
  this.setPreviousActions = function (gameState, mouseOverCB, mouseOutCB) {
    // The currentTurnIndex isn't 0 indexed AND we want one turn in the past
    var previousTurnIndex = gameState.currentTurnIndex - 2;

    //iterate through the containers, remove old actions, and add in actions for the calculated turn index
    for (var contIndex = 0; contIndex < playerActionContainers.length; ++contIndex) {
      // Remove any items in the list previously
      playerActionContainers[contIndex].clearItems();

      var actions = [];
      if (previousTurnIndex >= 0) {
        // Get the actions from the given game state
        var playerIndex = playerActionContainers[contIndex].playerIndex;
        actions = parseActionString(gameState.turnList[previousTurnIndex].players[playerIndex].actions, playerIndex);
      }

      self.addActions(playerActionContainers[contIndex], actions, mouseOverCB, mouseOutCB, null, false);
    }
  };
}