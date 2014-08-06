/*******************************************************************************
 * Client-side game logic for changing local game states
 ******************************************************************************/
var GameController = function(sendPlayerSetupDataCB, sendGameDataCB) {
  'use strict';

  var sendPlayerSetupData = sendPlayerSetupDataCB;
  var sendGameData = sendGameDataCB;

  var self = this;
  var ui = new UI(onMapLoaded, addAction, removeAction, clearActions, submittedTurn, goToStartInHistory, stepBackInHistory, stepForwardInHistory, goToCurrentInHistory);

  var gameState = null;
  var savedGameState = null; ///<Used when in history review mode, null otherwise
  var currentPlayerIndex = -1;
  var playerIdentification = null; ///<The player's ID
  var counterActions = [];
  var antiPlayerActions = [];
  var loyaltyActions = [];
  var turnActions = [];

  var currentResources = 0;
  var currentActionCost = 0;

  ///Tracking which game state index (turn number) we're looking at
  var historyIndex = -1;

  // Temporary variables so we can undo actions
  var removedAgents = [];
  var withdrawnAgents = [];
  var shiftedAgents = [];

  //----------------------------------------------------------------------------
  // Store the game state and setup the UI for new (never before seen) state
  this.setNewGameState = function(incomingGameState, playerID) {
    var currentTurn = incomingGameState.currentTurnIndex;
    if (currentTurn > 0) {
      // If not the very first turn and we're not at the end of the turn history (latest gamestate)
      if (historyIndex !== -1 && historyIndex !== (currentTurn - 2)) {
        if (self.tutorial === undefined) {
          // We are playing back old turns in history
          ui.forceDisplayCurrentTurn(function() {
            self.setGameState(incomingGameState, playerID, true);
          })
        }
        else {
          // We are restarting the tutorial
          ui.cleanupUIFromTutorial(incomingGameState);
          self.setGameState(incomingGameState, playerID, true);
        }
      } else {
        self.setGameState(incomingGameState, playerID, true);
      }
      if (self.tutorial === undefined) {
        document.title = 'Contagion - Turn ' + (currentTurn).toString();
      }
      else {
        document.title = 'Contagion - Tutorial Turn ' + (currentTurn).toString();
      }
    }
    else if (self.tutorial !== undefined) {
      delete self.tutorial;
      ui.cleanupUIFromTutorial(incomingGameState);
      self.setGameState(incomingGameState, playerID, true);
      document.title = 'Contagion - Setup';
    }
    else {
      self.tutorial = new Tutorial(self, incomingGameState, playerID);
      self.tutorial.init();
      document.title = 'Contagion - Tutorial Turn 1';
    }
  };

  //----------------------------------------------------------------------------
  // Store the game state and setup the UI
  this.setGameState = function(incomingGameState, playerID, isNewState) {
    gameState = incomingGameState;
    currentPlayerIndex = getPlayerIndex(gameState.players, playerID);
    playerIdentification = playerID;

    currentResources = gameState.players[currentPlayerIndex].resources;

    turnActions = [];
    resetActionLists();

    historyIndex = gameState.currentTurnIndex - 1;
    ui.enableHistoryBackButtons(historyIndex > 0);
    ui.enableHistoryForwardButtons(0 <= historyIndex && historyIndex < gameState.turnList.length);

    switch (gameState.phase) {
      case GamePhase.SETUP:
        // Determine if we're setting up the player or the game
        if (gameState.players[currentPlayerIndex].ideologyType === -1) {
          var colors = this.getAvailablePlayerColors();
          var ideologyTypes = this.getAvailableIdeologyTypes();

          ui.buildSetupPlayerUI(colors, ideologyTypes, setupPlayerData);
        }
        else if (self.getNumberPlayerRequiringSetup() > 0) {
          ui.buildWaitingForSetupUI();
        }
        break;
      case GamePhase.NORMAL:
        sortLoyalty();
        ui.buildNormalGameUI(gameState, playerID, currentPlayerIndex, currentResources, isNewState);
        break;
      case GamePhase.ENDGAME:
        sortLoyalty();
        ui.buildEndGameUI(gameState, playerID, currentPlayerIndex);
        break;
    }
  };

  //-----------------------------------------------------------------------------
  // Is the game considered finished?
  this.isGameSetup = function () {
    return gameState.phase === GamePhase.SETUP;
  };

  //-----------------------------------------------------------------------------
  // Is the game considered finished?
  this.isEndOfGame = function () {
    return gameState.phase === GamePhase.ENDGAME;
  };

  //----------------------------------------------------------------------------
  // Update the UI that displays the list of players in this game
  this.updatePlayerList = function (playerData) {

    //if we're reviewing history or in a tutorial, don't update any new player data
    if (savedGameState === null && self.tutorial === undefined) {
      // Long winded way of copying the fresh-from-game-server playerData into
      // our local cached copy of the Game State. This ensures our player data
      // cache is somewhat current with the server.
      for (var p = 0; p < playerData.players.length; p++) {
        for (var key in playerData.players[p]) {
          if (gameState.players[p].hasOwnProperty(key)) {
            gameState.players[p][key] = playerData.players[p][key];
          }
        }
      }

      ui.updatePlayerList(playerData, gameState.ideologyTypes);

      if (gameState.phase === GamePhase.SETUP &&
          playerData.players[currentPlayerIndex].ideologyType === -1) {
        var colors = this.getAvailablePlayerColors();
        var ideologyTypes = this.getAvailableIdeologyTypes();
        ui.buildSetupPlayerUI(colors, ideologyTypes, setupPlayerData);
      }
    }
  };

  //----------------------------------------------------------------------------
  this.initializeChat = function() {
    if (gameState !== null) {
      var playerColorMap = {};
      for (var i = 0; i < gameState.players.length; ++i) {
        var player = gameState.players[i];
        playerColorMap[player.id] = player.color;
      }

      ui.initializeChat(playerColorMap);
    }
  }

  //----------------------------------------------------------------------------
  this.updateChat = function(entries) {
    ui.updateChat(entries);
  }

  //----------------------------------------------------------------------------
  // Get the current list of actions as a string
  this.getTurnActionsString = function() {
    return stringifyActions(turnActions);
  };

  //----------------------------------------------------------------------------
  // Get all colors that haven't been picked by other players
  this.getAvailablePlayerColors = function() {
    var takenColors = [];
    gameState.players.forEach(function(player) {
      takenColors.push(player.color);
    });

    var availableColors = gameState.playerColors.filter(function(element) {
      var elementColor = element.toUpperCase();
      return takenColors.indexOf(elementColor) === -1;
    });

    return availableColors;
  };

  //----------------------------------------------------------------------------
  this.getAvailableIdeologyTypes = function() {
    var stateChosen = false;
    var intType;

    for (var i = 0; i < gameState.players.length; ++i) {
      intType = gameState.players[i].ideologyType;
      if (gameState.ideologyTypes[intType] === 'State') {
        stateChosen = true;
        break;
      }
    }

    var availableTypes;

    if (stateChosen) {
      availableTypes = gameState.ideologyTypes.filter(function(element) {
        return element !== 'State';
      });
    } else if (this.getNumberPlayerRequiringSetup() === 1) {
        availableTypes = ['State'];
    } else {
      availableTypes = gameState.ideologyTypes.slice(0);
    }

    return availableTypes;
  };

  //----------------------------------------------------------------------------
  this.getNumberPlayerRequiringSetup = function() {
    var numPlayers = 0;
    for (var i = 0; i < gameState.players.length; ++i) {
      if (gameState.players[i].ideologyType === -1) {
        ++numPlayers;
      }
    }

    return numPlayers;
  };

  //----------------------------------------------------------------------------
  function setupPlayerData(setupData) {
    // the UI only knows about names, not their matching index so we find it here and reset it
    for (var i = 0; i < gameState.ideologyTypes.length; ++i) {
      if (setupData.ideologyType === gameState.ideologyTypes[i]) {
        setupData.ideologyType = i;
        break;
      }
    }

    sendPlayerSetupData(setupData, function(success, message) {
      if (success) {
        ui.removeSetupPlayerUI();
        ui.buildWaitingForSetupUI();
      } else {
        alert(message);
        var colors = self.getAvailablePlayerColors();
        var ideologyTypes = self.getAvailableIdeologyTypes();
        ui.buildSetupPlayerUI(colors, ideologyTypes, setupPlayerData);
      }
    });
  }

  //----------------------------------------------------------------------------
  // Callback when the map has finished loading
  function onMapLoaded() {
    var actions = parseActionString(gameState.players[currentPlayerIndex].actions, currentPlayerIndex);
    for (var actionIndex = 0; actionIndex < actions.length; ++actionIndex) {
      addAction(actions[actionIndex]);
    }

    updateTurnStatus();
  }

  //----------------------------------------------------------------------------
  // Add an action to our current turn action list
  function addAction(action) {
    var newAgent, movedAgent, removedAgent, shiftedAgent;

    //if we're not reviewing history...
    if (!savedGameState)
    {
      if (action instanceof Move || action instanceof Escape) {
        movedAgent = null;
        if (action.source !== "D") {
          movedAgent = gameState.countries[action.source].agents[currentPlayerIndex].splice(action.agentIndex, 1)[0];
        }
        else {
          movedAgent = gameState.players[currentPlayerIndex].disabledAgents.splice(action.agentIndex, 1)[0];
        }
        gameState.countries[action.destination].agents[currentPlayerIndex].push(movedAgent);
      }
      else if (action instanceof Recruit) {
        newAgent = new Agent(action.messageType, action.target);
        gameState.countries[action.source].agents[currentPlayerIndex].push(newAgent);
      }
      else if (action instanceof Disable || action instanceof Remove) {
        removedAgent = gameState.countries[action.source].agents[action.target].splice(action.agentIndex, 1)[0];
        if (action instanceof Disable) {
          gameState.players[action.target].disabledAgents.push(removedAgent);
        }
        else {
          removedAgents.push(removedAgent);
        }
      }
      else if (action instanceof Shift) {
        shiftedAgent = gameState.countries[action.source].agents[currentPlayerIndex][action.agentIndex];
        shiftedAgents.push(new Agent(shiftedAgent.messageType, shiftedAgent.target));
        shiftedAgent.messageType = action.messageType;
        shiftedAgent.target = shiftedAgent.target;
      }
      else if (action instanceof Withdraw) {
        withdrawnAgents.push(gameState.countries[action.source].agents[currentPlayerIndex].splice(action.agentIndex, 1)[0]);
      }
      else if (action instanceof Desperation) {
        gameState.players[currentPlayerIndex].usedDesperation = true;
      }
    }
    // Put the action in the correct array
    if (action instanceof Escape) {
      counterActions.push(action);
    }
    else if (action instanceof Disable || action instanceof Remove) {
      antiPlayerActions.push(action);
    }
    else {
      loyaltyActions.push(action);
    }
    turnActions = counterActions.concat(antiPlayerActions, loyaltyActions);
    updateTurnStatus();
  }

  //----------------------------------------------------------------------------
  // Remove a single action from the list
  function removeAction(actionIndex) {
    if (0 <= actionIndex && actionIndex < turnActions.length) {
      var action = turnActions[actionIndex];
      var actionsToRemove = [actionIndex];
      // If this action affects Agents in a country, eliminate all subsequent actions to be sure the actions are valid
      if (action instanceof Shift || action instanceof Move || action instanceof Escape || action instanceof Recruit || action instanceof Withdraw) {
        for (var removedActionIndex = actionIndex + 1; removedActionIndex < turnActions.length; ++removedActionIndex) {
          actionsToRemove.push(removedActionIndex);
        }
      }

      // Go through our list of actions to remove removing the last to the first
      for (var removeIndex = actionsToRemove.length - 1; removeIndex >= 0; --removeIndex) {
        actionRemoved(turnActions[actionsToRemove[removeIndex]]);
        turnActions.splice(actionsToRemove[removeIndex], 1);
      }

      resetActionLists();
      updateTurnStatus();
    }
  }

  //----------------------------------------------------------------------------
  // Clear our list of current turn actions
  function clearActions() {
    // Remove actions in reverse order so the game state updates properly
    for (var actionIndex = turnActions.length - 1; actionIndex >= 0; --actionIndex) {
      actionRemoved(turnActions[actionIndex]);
    }
    counterActions = [];
    antiPlayerActions = [];
    loyaltyActions = [];
    turnActions = [];
    updateTurnStatus();
  }

  //----------------------------------------------------------------------------
  // Update UI based on a player submitting their turn
  function submittedTurn() {
    sendGameData();
    gameState.players[currentPlayerIndex].hasTakenTurn = true;
    updateTurnStatus();
  }

  //----------------------------------------------------------------------------
  function goToStartInHistory() {
    historyIndex = 0;
    viewDifferentState();
  }

  //----------------------------------------------------------------------------
  function stepBackInHistory() {
    --historyIndex;

    //make sure we can't go back before time started
    if (historyIndex < 0) {
      historyIndex = 0;
    }
    else {
      viewDifferentState();
    }
  }

  //----------------------------------------------------------------------------
  function stepForwardInHistory() {
    ++historyIndex;

    //make sure we can't go into the future
    if (historyIndex > gameState.turnList.length) {
      historyIndex = gameState.turnList.length;
    }
    else {
      viewDifferentState();
    }
  }

  //----------------------------------------------------------------------------
  function goToCurrentInHistory() {
    historyIndex = gameState.turnList.length;
    viewDifferentState();
  }

  //----------------------------------------------------------------------------
  // Performs the necessary cleanup to remove this action from happening
  var viewDifferentState = function() {
    //save off the game's current state so we can restore it
    if (!savedGameState) {
      gameState.players[currentPlayerIndex].actions = stringifyActions(turnActions);
      savedGameState = gameState;
    }

    if (historyIndex === gameState.turnList.length) {
      if (savedGameState) {
        self.setGameState(savedGameState, playerIdentification);
        savedGameState = null;
        ui.enableHistoryForwardButtons(false);
        ui.enableHistoryBackButtons(true);
      }
    }
    else {
      var history = gameState.turnList[historyIndex];
      history.turnList = gameState.turnList;
      self.setGameState(history, playerIdentification);
    }
  };

  //----------------------------------------------------------------------------
  // Performs the necessary cleanup to remove this action from happening
  var actionRemoved = function(action) {
    var movedAgent, removedAgent;

    if (action instanceof Move || action instanceof Escape) {
      movedAgent = gameState.countries[action.destination].agents[currentPlayerIndex].pop();
      if (action.source !== "D") {
        gameState.countries[action.source].agents[currentPlayerIndex].splice(action.agentIndex, 0, movedAgent);
      }
      else {
        gameState.players[currentPlayerIndex].disabledAgents.splice(action.agentIndex, 0, movedAgent);
      }
      if (action instanceof Escape) {
        ui.undoEscapeAction(action.source);
      }
    }
    else if (action instanceof Recruit) {
      gameState.countries[action.source].agents[currentPlayerIndex].pop();
    }
    else if (action instanceof Disable || action instanceof Remove) {
      removedAgent = null;
      if (action instanceof Disable) {
        removedAgent = gameState.players[action.target].disabledAgents.pop();
      }
      else {
        removedAgent = removedAgents.pop();
      }
      gameState.countries[action.source].agents[action.target].splice(action.agentIndex, 0, removedAgent);
      ui.undoEscapeAction(action.source);
    }
    else if (action instanceof Shift) {
      gameState.countries[action.source].agents[currentPlayerIndex][action.agentIndex] = shiftedAgents.pop();
    }
    else if (action instanceof Withdraw) {
      gameState.countries[action.source].agents[currentPlayerIndex].splice(action.agentIndex, 0, withdrawnAgents.pop());
    }
    else if (action instanceof Desperation) {
      gameState.players[currentPlayerIndex].usedDesperation = false;
    }
  };

  //----------------------------------------------------------------------------
  // Update whether the player can submit a turn or not
  var updateTurnStatus = function() {
    currentActionCost = getActionCosts(turnActions);
    ui.updateCurrentActionList(gameState, turnActions);
    ui.updateGameState(gameState, canSubmitTurn(), turnActions);
  };

  //----------------------------------------------------------------------------
  // Get the index of the given player in the list of players
  var getPlayerIndex = function(playerList, playerID) {
    for (var playerIndex = 0; playerIndex < playerList.length; ++playerIndex) {
      if (playerList[playerIndex].id === playerID) {
        return playerIndex;
      }
    }
    return -1;
  };

  //----------------------------------------------------------------------------
  // Reset the three separate action lists using the turn actions list as a guide
  var resetActionLists = function() {
    counterActions = [];
    antiPlayerActions = [];
    loyaltyActions = [];

    for (var actionIndex = 0; actionIndex < turnActions.length; ++actionIndex) {
      var action = turnActions[actionIndex];
      if (action instanceof Escape) {
        counterActions.push(action);
      }
      else if (action instanceof Disable || action instanceof Remove) {
        antiPlayerActions.push(action);
      }
      else {
        loyaltyActions.push(action);
      }
    }
  };

  //----------------------------------------------------------------------------
  // Returns whether the player can submit a turn or not
  var canSubmitTurn = function() {
    return !gameState.players[currentPlayerIndex].hasTakenTurn && ((currentResources < 0 && currentActionCost <= 0) || currentActionCost <= currentResources);
  };

  //----------------------------------------------------------------------------
  // Returns a string representing the list of actions
  var stringifyActions = function(actions) {
    var string = "";
    for (var actionIndex = 0; actionIndex < actions.length - 1; ++actionIndex) {
      string += stringifyAction(actions[actionIndex]) + ";";
    }

    if (actions.length > 0) {
      string += stringifyAction(actions[actions.length - 1]);
    }

    return string;
  };

  //----------------------------------------------------------------------------
  // Sort the loyalty in all territories so this player's territory is first,
  // then neutral territories, then opponent territories
  var sortLoyalty = function() {
    for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
      var country = gameState.countries[countryIndex];
      for (var territoryIndex = 0; territoryIndex < country.territories.length; ++territoryIndex) {
        var territory = country.territories[territoryIndex];
        // If this territory is loyal to the current player, bubble it left
        if (territory.loyalToWhom == currentPlayerIndex) {
          if (shiftTerritory(country.territories, territoryIndex, 1)) {
            // Make sure we don't move to the next territory to check since the territory at this index has not been checked now
            --territoryIndex;
          }
        }
        // If loyal to another player, bubble it to the right
        else if (territory.loyalToWhom > -1) {
          shiftTerritory(country.territories, territoryIndex, -1);
        }
      }
    }
  };

  //----------------------------------------------------------------------------
  // Shift the given territory index in the given direction until its next to
  // another territory loyal to the same player with more or equal loyalty or
  // it's at the end of the array.  Returns whether values actually got shifted
  var shiftTerritory = function(territories, startIndex, direction) {
    var shifted = false;
    var movingTerritory = territories[startIndex];
    for (var territoryIndex = startIndex + direction; 0 <= territoryIndex && territoryIndex < territories.length; territoryIndex += direction) {
      var territory = territories[territoryIndex];
      if (territory.loyalToWhom != movingTerritory.loyalToWhom || territory.currentLoyalty < movingTerritory.currentLoyalty) {
        var tempTerritory = { loyalToWhom: movingTerritory.loyalToWhom, currentLoyalty: movingTerritory.currentLoyalty, maxLoyalty: movingTerritory.maxLoyalty };
        territories[territoryIndex - direction] = { loyalToWhom: territory.loyalToWhom, currentLoyalty: territory.currentLoyalty, maxLoyalty: territory.maxLoyalty };
        territories[territoryIndex] = { loyalToWhom: tempTerritory.loyalToWhom, currentLoyalty: tempTerritory.currentLoyalty, maxLoyalty: tempTerritory.maxLoyalty };
        shifted = true;
      }
    }
    return shifted;
  };
};
