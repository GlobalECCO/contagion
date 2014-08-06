/*******************************************************************************
 * UI generator/handler that ultimately turns inputs into a list of Actions
 ******************************************************************************/
function UI (mapLoadedCB, addActionCB, removeActionCB, clearActionsCB, submitTurnCB, goToStartInHistoryCB, stepBackInHistoryCB, stepForwardInHistoryCB, goToCurrentInHistoryCB) {
  'use strict';

  this.mapLoaded = mapLoadedCB;
  this.addAction = addActionCB;
  this.removeAction = removeActionCB;
  this.clearActions = clearActionsCB;
  this.submitTurn = submitTurnCB;

  this.goToStartInHistory = goToStartInHistoryCB;
  this.stepBackInHistory = stepBackInHistoryCB;
  this.stepForwardInHistory = stepForwardInHistoryCB;
  this.goToCurrentInHistory = goToCurrentInHistoryCB;

  // Catch the window resizing event
  if (window.attachEvent) {
    window.attachEvent('onresize', onWindowResize);
  }
  else if (window.addEventListener) {
    window.addEventListener('resize', onWindowResize, false);
  }

  var self = this;

  var rootElement = $('body');

  var currentPlayerIndex = -1;
  var currentAgentCount = 0;

  var currentActionButton = null;
  var currentAction = '';
  var validCountriesForAction = [];
  var currentActions = [];
  var currentBalance = -1;

  var gettingActionSource = false;
  var gettingActionDestination = false;
  var messageTypeSelector = null;
  var moveTypeSelector = null;
  var scopeSelector = null;
  var targetSelector = null;
  var playerSetup = null;
  var usingDesperation = false;
  var usingNonDesperationAction = false;
  var canEscape = true;

  var withdrawEnabled = false;
  var moveEnabled = false;
  var escapeEnabled = false;

  // Used to remember what the controller tells us to and apply when ready
  var shouldEnableBackButtons = false;
  var shouldEnableForwardButtons = false;

  this.infoPanel = new InfoPanel(rootElement, false, "Welcome to Contagion, the game of contagions"); //create new info panel, start off hidden
  this.map = new GameMap(rootElement);
  this.mapAnimator = new GameMapAnimator(this.map);
  this.actionBar = new ActionBar(actionClicked).hide();
  this.currentActionList = new ActionList(rootElement, 'actionList', removeAction, clearActions, submitTurn).hide();
  this.gameStatusControl = new GameStatus(rootElement, 'gameStatus', onToggleGameStatusView).hide();

  //callbacks triggered by the scoreboard
  var cb = {
    onTerritoryEnter: highlightContolledTerritories,
    onTerritoryLeave: clearTerritoryHighlight,
    onCountryEnter: highlightControlledCounties,
    onCountryLeave: clearCountryHighlights
  };
  this.scoreboard = new Scoreboard(this.gameStatusControl.root, cb).toggleVisibility(false);

  this.previousActionList = new PreviousActionList(this.gameStatusControl.root, 'previousActionList').hide();
  this.playbackControls = new PlaybackControls(rootElement, onStartHistory, onBackHistory, onForwardHistory, onEndHistory);
  this.optionsPanel = new OptionsPanel(rootElement);
  this.countryControlIndicator = new CountryControlIndicator(rootElement);
  this.endGameScreenUI = null;
  this.moveArrow = new MoveArrow(rootElement);
  this.chat = new Chat(rootElement);

  // start off hidden
  this.playbackControls.toggleVisibility(false);

  /*****************************************************************************
   * Public Functions
   ****************************************************************************/
  //----------------------------------------------------------------------------
  this.cleanupUIFromTutorial = function(gameState) {
    self.scoreboard.hide();
    self.previousActionList.removePreviousActionList();
    self.previousActionList.hide();
    self.gameStatusControl.hide();
    self.currentActionList.hide();
    self.actionBar.hide();
    self.playbackControls.hide();
    if (messageTypeSelector !== null) {
      messageTypeSelector.remove(true);
      messageTypeSelector = null;
    }
    if (moveTypeSelector !== null) {
      moveTypeSelector.remove(true);
      moveTypeSelector = null;
    }
    if (scopeSelector !== null) {
      scopeSelector.remove(true);
      scopeSelector = null;
    }
    if (self.map.isLoaded) {
      self.countryControlIndicator.removeControlIcons();
      self.map.unloadMap();
    }
    targetSelector.remove();
    self.infoPanel.cleanupPlayerStatusFromTutorial(gameState.players, gameState.ideologyTypes);
  }

  //----------------------------------------------------------------------------
  this.buildSetupPlayerUI = function(availableColors, availableIdeologies, setupResultCallback) {
    self.infoPanel.updateText('Enter Player Info').show();

    if (playerSetup === null) {
      // Bring up the player setup dialogue and start the game when finished
      playerSetup = new PlayerSetup(rootElement, availableColors, availableIdeologies, setupResultCallback);
    } else {
      playerSetup.updateOptions(availableIdeologies, availableColors);
    }
  };

  //----------------------------------------------------------------------------
  this.removeSetupPlayerUI = function() {
    playerSetup.remove();
    playerSetup = null;
  };

  //----------------------------------------------------------------------------
  this.buildWaitingForSetupUI = function() {
    // Add a note to the user that we're waiting on all players to finish setup
    self.infoPanel.updateText('Waiting for other player to finish setup').show();
  };

  //----------------------------------------------------------------------------
  // Build the UI for the normal game state
  this.buildNormalGameUI = function(gameState, playerID, playerIndex, currentResources, isNewState) {
    setupGameUI('Add actions or submit your turn', gameState, playerIndex, isNewState);
    if (self.endGameScreenUI !== null) { self.endGameScreenUI.hide(); }

    if (isNewState) {
      $(document).trigger('NewRound');
    }
  };

  //----------------------------------------------------------------------------
  // Build the UI for an end game state
  this.buildEndGameUI = function(gameState, playerID, playerIndex) {
    setupGameUI('The game is over, ' + playerID, gameState, playerIndex);
    self.currentActionList.hide();
    self.actionBar.hide();

    //if the end game UI is already built, just display it (this can happen during history reviews)
    if (self.endGameScreenUI !== null) {
      self.endGameScreenUI.show();
    }
    else {
      self.endGameScreenUI = new EndGameScreen(rootElement, gameState);
    }
  };

  //----------------------------------------------------------------------------
  // Update our current UI based on a changed game state
  this.updateGameState = function(gameState, canSubmitTurn, turnActions) {
    var countryIndex, country, playerColor, playerIndex, agents;
    self.currentActions = turnActions;

    // Update our agent counts
    currentAgentCount = 0;
    for (countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
      country = gameState.countries[countryIndex];
      for (playerIndex = 0; playerIndex < country.agents.length; ++playerIndex) {
        playerColor = gameState.players[playerIndex].color;
        agents = country.agents[playerIndex];
        if (playerIndex === currentPlayerIndex) {
          currentAgentCount += agents.length;
        }
        self.map.countries[countryIndex].setAgents(playerIndex, playerColor, agents);
      }
      self.map.countries[countryIndex].updateAgentOverviewTooltips();
    }

    // Update userlist
    self.infoPanel.updatePlayerStatus(gameState.players, gameState.ideologyTypes);
    self.scoreboard.updatePlayerStatus(gameState.players, gameState.ideologyTypes);

    // Update which actions are enabled
    if (canSubmitTurn && !usingDesperation) {
      updateActiveActions(gameState, turnActions);
    }
    else {
      self.actionBar.setInteractive(false);
    }
    self.currentActionList.enableSubmitButton(canSubmitTurn);

    self.countryControlIndicator.updateControlIcons(gameState, self.map);

    var turnCounterDisplay = gameState.currentTurnIndex;
    if (turnCounterDisplay < gameState.turnList.length + 1){
      turnCounterDisplay = gameState.currentTurnIndex + '/' + (gameState.turnList.length + 1);
    }
    self.playbackControls.setCurrentTurnNumber(turnCounterDisplay);
  };

  //----------------------------------------------------------------------------
  this.initializeChat = function(playerColorMap) {
    this.chat.initialize(playerColorMap);
  }

  //----------------------------------------------------------------------------
  this.updateChat = function(entries) {
    this.chat.update(entries);
  }

  //----------------------------------------------------------------------------
  // Update our current action costs display
  this.undoEscapeAction = function(countryIndex) {
    var country = self.map.countries[countryIndex];
    country.undoAgentEscape();
  };

  //----------------------------------------------------------------------------
  // Update our current action list
  this.updateCurrentActionList = function(gameState, actions) {
    // Check to see if the player is using a Desperation move or not
    usingDesperation = false;
    usingNonDesperationAction = false;
    canEscape = true;
    self.currentActionList.clearActions();
    for (var actionIndex = 0; actionIndex < actions.length; ++actionIndex) {
      if (actions[actionIndex] instanceof Desperation) {
        usingDesperation = true;
      }
      else {
        usingNonDesperationAction = true;
        if (!(actions[actionIndex] instanceof Escape)) {
          canEscape = false;
        }
      }
    }

    // Add any additional taxes the actions might have
    getExtraActionCosts(actions);

    // Update our action list UI
    self.currentActionList.setActions(gameState, currentPlayerIndex, actions, onActionMouseEnter, onActionMouseLeave);
    if (TOOLTIPS !== undefined) {
      self.currentActionList.setTooltips();
    }

    var interactiveUI = !gameState.players[currentPlayerIndex].hasTakenTurn;
    self.currentActionList.setInteractive(interactiveUI).show();
  };

  //----------------------------------------------------------------------------
  // Build the UI for the game's player list
  // This gets called periodically.
  this.updatePlayerList = function(playerData, ideologyTypes) {
    if (self.infoPanel.isVisible())
    {
      self.infoPanel.updatePlayerStatus(playerData.players, ideologyTypes);
      self.scoreboard.updatePlayerStatus(playerData.players, ideologyTypes);
    }

    if (self.scoreboard.isVisible()) {
      for (var i = 0; i < playerData.players.length; ++i) {
        self.scoreboard.setColors(playerData.players);
        self.scoreboard.setNames(playerData.players);
      }
    }
  };

  //----------------------------------------------------------------------------
  this.enableHistoryBackButtons = function (enabled) {
    self.shouldEnableBackButtons = enabled;

    if (!self.mapAnimator.isAnimating()) {
      self.playbackControls.enableBackButtons(enabled);
    }
  };

  //----------------------------------------------------------------------------
  this.enableHistoryForwardButtons = function (enabled) {
    self.shouldEnableForwardButtons = enabled;

    if (!self.mapAnimator.isAnimating()) {
      self.playbackControls.enableForwardButtons(enabled);
    }
  };

  //----------------------------------------------------------------------------
  this.forceDisplayCurrentTurn = function(onDisplayCurrentTurnFinishedCB) {
    self.enableHistoryBackButtons(false);
    self.enableHistoryForwardButtons(false);

    // Wait until the map is ready to throw the user into a new turn
    if (self.mapAnimator.isAnimating()) {
      return setTimeout(self.forceDisplayCurrentTurn, 1000 / 60);
    }

    onEndHistory(function() {
      onDisplayCurrentTurnFinishedCB && onDisplayCurrentTurnFinishedCB();
    });
  }

  /*****************************************************************************
   * Event Callbacks
   ****************************************************************************/
   //----------------------------------------------------------------------------
   function clearActions() {
    $(document).trigger('ActionCanceled');
    self.clearActions();
  }

  //----------------------------------------------------------------------------
  // Handle an Action Item in the ActionList being moused over
  function onActionMouseEnter(e, action) {
    if (action instanceof Move) {
      var centerFrom;
      if (action.source !== 'D') {
        centerFrom = self.map.countries[action.source].getCenter();
      }
      self.moveArrow.show(centerFrom, self.map.countries[action.destination].getCenter());
    };
    applyHighlights(action, true);
  }

  //----------------------------------------------------------------------------
  // Handle an Action Item in the ActionList no longer being moused over
  function onActionMouseLeave(e, action) {
    self.moveArrow.remove();
    applyHighlights(action, false);
  }

  //----------------------------------------------------------------------------
  // Handle an Action being clicked
  function actionClicked(action) {
    cleanupActionSetup();
    rootElement.bind('click.cancelAction', function() {
      $(document).trigger('ActionCanceled');
      cancelCurrentAction();
    });
    currentActionButton = action;
    currentAction = action.attr('name');

    createAction();

    Opentip.hideTips();
    $(document).trigger('ButtonClicked');
  }

  //----------------------------------------------------------------------------
  function highlightContolledTerritories(gameState, playerIndex) {
    for (var countryIdx = 0; countryIdx < gameState.countries.length; countryIdx++) {
      for (var territoryIndex = 0; territoryIndex < gameState.countries[countryIdx].territories.length; ++territoryIndex) {
        if (gameState.countries[countryIdx].territories[territoryIndex].loyalToWhom == playerIndex &&
            (gameState.countries[countryIdx].territories[territoryIndex].currentLoyalty / gameState.countries[countryIdx].territories[territoryIndex].maxLoyalty) >= BalanceValues.TERRITORY_LOYALTY_PERCENT_THRESHOLD) {
          self.map.countries[countryIdx].territories[territoryIndex].highlight(true, gameState.players[playerIndex].color);
        }
      }
    }
  }

  //----------------------------------------------------------------------------
  function clearTerritoryHighlight(gameState, playerIndex) {
    for (var countryIdx = 0; countryIdx < gameState.countries.length; countryIdx++) {
      for (var territoryIndex = 0; territoryIndex < gameState.countries[countryIdx].territories.length; ++territoryIndex) {
        self.map.countries[countryIdx].territories[territoryIndex].highlight(false, getTerritoryColor(gameState.countries[countryIdx].territories[territoryIndex],'#CCCCCC', gameState.players[playerIndex].color));
      }
    }
  }

  //----------------------------------------------------------------------------
  function highlightControlledCounties(gameState, playerIndex) {
    for (var countryIdx = 0; countryIdx < gameState.countries.length; countryIdx++) {
      if (playerControlsCountry(gameState.countries[countryIdx], playerIndex)) {
        self.map.countries[countryIdx].pulsateCountry(true, gameState.players[playerIndex].color);
      }
    }
  };

  //----------------------------------------------------------------------------
  function clearCountryHighlights(gameState, playerIndex) {
    for (var countryIdx = 0; countryIdx < gameState.countries.length; countryIdx++) {
      self.map.countries[countryIdx].pulsateCountry(false, gameState.players[playerIndex].color);
    }
  };

  //----------------------------------------------------------------------------
  // Handle an Action being clicked
  function removeAction(action, actionIndex) {
    onActionMouseLeave(null, action);
    self.removeAction(actionIndex);
  }

  //----------------------------------------------------------------------------
  // Handle mouse clicking a country event
  function onCountryClicked(e, country) {
    country.stopPulse();

    // If we are getting a move destination, then use the clicked country
    if (gettingActionDestination) {
      setActionDestination(country);
    }
    // Otherwise if we're setting up an action, set it as the starting location
    else if (gettingActionSource) {
      setActionSource(country);
    }
  }

  //----------------------------------------------------------------------------
  // Handle mouse clicking a country event
  function onCountryMouseOver(e, country) {
    // If we are getting a move destination, then use the clicked country
    if ((gettingActionDestination || gettingActionSource) && willCountryAcceptAction(country)) {
      country.startPulse();
    }
  }

  //----------------------------------------------------------------------------
  // Handle mouse clicking a country event
  function onCountryMouseOut(e, country) {
    country.stopPulse();

    // If we are getting a move destination, then use the clicked country
    if ((gettingActionDestination || gettingActionSource) && willCountryAcceptAction(country)) {
      country.highlightCountry(true);
    }
    else {
      country.highlightCountry(false);
    }
  }

  //----------------------------------------------------------------------------
  // Submits the chosen actions the player wants to take for this turn
  function submitTurn() {
    usingDesperation = false;
    usingNonDesperationAction = false;
    canEscape = true;
    self.infoPanel.updateText('Waiting for other player to submit their turn').show();
    self.actionBar.setInteractive(false);
    self.currentActionList.setInteractive(false);
    self.submitTurn();

    $(document).trigger('ButtonClicked');
    $(document).trigger('TurnSubmitted');
  }

  //----------------------------------------------------------------------------
  // Toggle which aspect of the game status we are currently viewing
  function onToggleGameStatusView(showScoreboard) {
    if (showScoreboard) {
      self.previousActionList.root.hide("slide", { direction: "left" }, 500, function() {
        self.scoreboard.root.show("slide", { direction: "left" }, 500);
      });
    }
    else {
      self.scoreboard.root.hide("slide", { direction: "left" }, 500, function() {
        self.previousActionList.root.show("slide", { direction: "left" }, 500);
      });
    }
  }

  //----------------------------------------------------------------------------
  function hideAllOverviews() {
    self.map.getAllAgentOverviews().forEach(function(overview) {
      overview.toggleVisibility(false);
    });
  }

  //----------------------------------------------------------------------------
  // Go to the first turn of the game
  function onStartHistory() {
    //Hide ui so that it doesn't stay behind while the map animates
    self.map.getAllAgentOverviews().forEach(function(overview) {
      overview.toggleVisibility(false);
    });
    self.countryControlIndicator.toggleControlIconVisibility(false);
    self.enableHistoryBackButtons(false);
    self.enableHistoryForwardButtons(false);

    self.mapAnimator.animateSlideRight(function() {
      self.goToStartInHistory();
    },function () {
      self.countryControlIndicator.repositionControlIcons(self.map);
      self.enableHistoryBackButtons(self.shouldEnableBackButtons);
      self.enableHistoryForwardButtons(self.shouldEnableForwardButtons);
    });
  }

  //----------------------------------------------------------------------------
  // Go back a turn
  function onBackHistory() {
    self.stepBackInHistory();
    self.countryControlIndicator.repositionControlIcons(self.map);
  }

  //----------------------------------------------------------------------------
  // Go forward a turn
  function onForwardHistory() {
    self.stepForwardInHistory();
    self.countryControlIndicator.repositionControlIcons(self.map);
  }

  //----------------------------------------------------------------------------
  // Go to the last turn of the game
  function onEndHistory(onEndHistoryCompleteCB) {
    // Hide ui so that it doesn't stay behind while the map animates
    hideAllOverviews();
    self.countryControlIndicator.toggleControlIconVisibility(false);
    self.enableHistoryBackButtons(false);
    self.enableHistoryForwardButtons(false);

    self.mapAnimator.animateSlideLeft(function() {
      self.goToCurrentInHistory();

      // the new game state will show the overview so hide it again until we're ready
      hideAllOverviews();
    },function () {
      self.countryControlIndicator.repositionControlIcons(self.map);
      self.countryControlIndicator.toggleControlIconVisibility(true);
      self.map.getAllAgentOverviews().forEach(function(overview) {
        overview.updateVisibility(true);
      });
      onEndHistoryCompleteCB && onEndHistoryCompleteCB();
      self.enableHistoryBackButtons(self.shouldEnableBackButtons);
      self.enableHistoryForwardButtons(self.shouldEnableForwardButtons);
    });
  }

  //----------------------------------------------------------------------------
  // Reposition Agent Overlays if the window is resized.
  function onWindowResize() {
    if (self.map.isLoaded()) {
      self.countryControlIndicator.repositionControlIcons(self.map);
      for (var countryIndex = 0; countryIndex < self.map.countries.length; ++countryIndex) {
        self.map.countries[countryIndex].positionAgentOverview();
      }
    }
    if (messageTypeSelector !== null) {
      messageTypeSelector.setPosition(getCurrentActionButtonPosition());
    }
    if (scopeSelector !== null) {
      scopeSelector.setPosition(getCurrentActionButtonPosition());
    }
    if (targetSelector !== null && targetSelector.isVisible()) {
      targetSelector.setPosition(getCurrentActionButtonPosition());
    }
  }

  /*****************************************************************************
   * UI Setup Functions
   ****************************************************************************/
  //----------------------------------------------------------------------------
  // Setup the game UI based on the current game state
  var setupGameUI = function(infoMessage, gameState, playerIndex, isNewState) {
    currentPlayerIndex = playerIndex;

    var playerNames = getPlayerNames(gameState.players);
    self.currentActionList.setPlayerNames(playerNames);
    self.previousActionList.setPlayerNames(playerNames);

    self.scoreboard.setPlayerScores(gameState, currentPlayerIndex);

    // Animate bonuses earned from controlling countries, territories
    animateActionPoints(rootElement, gameState, self.map);

    self.gameStatusControl.show();
    self.scoreboard.toggleVisibility(true);
    self.previousActionList.show();
    onToggleGameStatusView(self.gameStatusControl.showScoreboard);
    self.actionBar.show();

    // Update the info panel based on whether the player has taken their turn or not
    if (!gameState.players[currentPlayerIndex].hasTakenTurn) {
      self.infoPanel.updateText(infoMessage).show();
    }
    else {
      self.infoPanel.updateText('Waiting for other player to submit their turn').show();
    }

    drawGameBoard(gameState, isNewState);
  };

  //----------------------------------------------------------------------------
  // Draw the map and connect all the event callbacks
  var drawGameBoard = function(gameState, isNewState) {
    // Load the map and then set it up based on the game state
    if (!self.map.isLoaded()) {
      var mapUrl = "maps/" + gameState.map;
      var agentUrl = "images/agent.svg";
      self.map.loadMap(mapUrl, agentUrl, currentPlayerIndex, function() {
        onGameStart(gameState);
        onMapLoaded(gameState, true);

        // Do things that should only be done on the map once after all map
        // loaded processing has been done
        self.mapAnimator.animateMapScaleIn();
        $('.agentOverviewContainer').css('opacity', '0.0');
        $('.agentOverviewContainer').animate({opacity:'0.0'}, 1000);
        $('.agentOverviewContainer').animate({opacity:'1.0'}, 500);
        $('#map').on('countryClicked', onCountryClicked);
        $('#map').on('countryMouseOver', onCountryMouseOver);
        $('#map').on('countryMouseOut', onCountryMouseOut);
      });
    }
    else {
      onMapLoaded(gameState, false);

      if (isNewState) {
        self.mapAnimator.animate();
      }
    }
  };

  //----------------------------------------------------------------------------
  // This function only happens the very first time a player loads the game
  var onGameStart = function(gameState) {
    // Setup the target selector
    targetSelector = new TargetSelector(rootElement, gameState.players, currentPlayerIndex, setActionPlayerTarget);

    // Create the agent overviews
    for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
      self.map.countries[countryIndex].createAgentOverview(gameState.players, self.map.svgAgentSource, setActionAgentTarget);
    }

    var open = "<style type='text/css'>";
    var close = "</style>"
    var commonStyles = 'color: black;font-weight: bold;border-radius:4px;';

    // Create specialized dynamic (player specific) styles for other UI objects to use
    for (var i = 0; i < gameState.players.length; ++i) {
      var className = 'infoPanelUser' + i.toString() + 'ready';
      var color = gameState.players[i].color;
      var newStyle = open + " ." + className + "{background-color:" + color + ";" + commonStyles + "}" + close;
      $(newStyle).appendTo("head");
    }

    // Create the containers for the previous action list
    self.previousActionList.createPreviousActionList(gameState, currentPlayerIndex);

    self.playbackControls.toggleVisibility(true);
  }

  //----------------------------------------------------------------------------
  // Finish UI setup now that the map has been fully loaded
  var onMapLoaded = function(gameState, firstLoad) {
    for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
      // Recolor the various territories based on loyalty levels
      var country = gameState.countries[countryIndex];
      var countryControlled = self.countryControlIndicator.isCountryControlled(country);
      for (var territoryIndex = 0; territoryIndex < country.territories.length; ++territoryIndex) {
        var territory = country.territories[territoryIndex];
        var color = "#CCCCCC";
        var loyalty = territory.loyalToWhom;
        if (loyalty > -1) {
          color = getTerritoryColor(territory, color, gameState.players[loyalty].color);
        }
        var loyaltyText = getTerritoryLoyaltyPercentageString(territory);
        self.map.countries[countryIndex].addLoyalPlayer(loyalty);
        if (countryControlled < 0) {
          self.map.countries[countryIndex].territories[territoryIndex].setText(loyaltyText);
          if (loyalty === -1) {
            self.map.countries[countryIndex].territories[territoryIndex].setOutline('#6E6E6E', 2);
          }
          else {
            self.map.countries[countryIndex].territories[territoryIndex].setOutline(gameState.players[loyalty].color, 8, true);
          }
        }
        else {
          removeLoyaltyPercentageFromCountry(self.map.countries[countryIndex]);
          self.map.countries[countryIndex].territories[territoryIndex].setOutline('#000000', 6);
        }
        self.map.countries[countryIndex].territories[territoryIndex].setColor(color, firstLoad ? 0 : 1000);
      }
      self.map.countries[countryIndex].setColor(countryControlled === -1 ? '#CCCCCC' : gameState.players[countryControlled].color, firstLoad ? 0 : 1000);

      // Setup the number of agents in each country
      for (var playerIndex = 0; playerIndex < country.agents.length; ++playerIndex) {
        var playerColor = gameState.players[playerIndex].color;
        var agents = country.agents[playerIndex];
        self.map.countries[countryIndex].setAgents(playerIndex, playerColor, agents);
        if (playerIndex === currentPlayerIndex) {
          self.map.countries[countryIndex].setEscapableAgentCount(country.agents[playerIndex].length);
        }
      }
    }

    var countryNames = getCountryAbbreviations(self.map.countries);
    self.currentActionList.setCountryNames(countryNames);
    self.previousActionList.setCountryNames(countryNames);

    // Setup the action history from the last turn
    self.previousActionList.setPreviousActions(gameState, onActionMouseEnter, onActionMouseLeave);

    // Load the proper tooltips script based on ideology type
    loadTooltipsScript(gameState.players[currentPlayerIndex].ideologyType);

    self.mapLoaded();
  };

  //----------------------------------------------------------------------------
  // Setup the various tooltips now that the proper tooltips script has been loaded
  var loadTooltipsScript = function(ideologyType) {
    var tooltipsScript = '';
    switch (ideologyType) {
      case IdeologyTypes.STATE:
        tooltipsScript = 'tooltips-State.js';
        break;
      case IdeologyTypes.RELIGIOUS:
        tooltipsScript = 'tooltips-Religious.js';
        break;
      case IdeologyTypes.NATIONALIST:
        tooltipsScript = 'tooltips-Nationalist.js';
        break;
      case IdeologyTypes.MARXIST:
        tooltipsScript = 'tooltips-Marxist.js';
        break;
    }

    if (tooltipsScript !== '') {
      $.getScript(tooltipsScript, onTooltipsLoaded);
    }
  };

  //----------------------------------------------------------------------------
  // Setup the various tooltips now that the proper tooltips script has been loaded
  var onTooltipsLoaded = function() {
    self.actionBar.setActionTooltips();
    self.currentActionList.setTooltips();
    for (var countryIndex = 0; countryIndex < self.map.countries.length; ++countryIndex) {
      self.map.countries[countryIndex].setTooltip();
    }
    targetSelector.setTooltips();
    self.scoreboard.setTooltips();
    self.optionsPanel.setTooltips();
    self.playbackControls.setTooltips();
  };

  //----------------------------------------------------------------------------
  // Toggle highlights for the country involved with this action
  var applyHighlights = function(action, shouldHighlight) {
    // Highlight a source country if it is valid
    if (action.source !== -1 && action.source !== 'D') {
      self.map.countries[action.source].highlightCountry(shouldHighlight);
    }
    // Highlight a destination country if it is valid
    if (action.destination !== undefined && action.destination !== -1) {
      self.map.countries[action.destination].highlightCountry(shouldHighlight);
    }
  };

  /*****************************************************************************
   * Action Logic Functions
   ****************************************************************************/

  var canIBuy = function(proposedAction, existingActions, currentBalance) {
    var proposedActions = existingActions.concat(proposedAction);
    var proposedSpending = getActionCosts(proposedActions);
    var remainingBal = currentBalance-proposedSpending;
    return (remainingBal >= 0);
  };

  //----------------------------------------------------------------------------
  // Checks whether the current player can activate an Agent
  var updateActiveActions = function(gameState, turnActions) {
    self.currentBalance = gameState.players[currentPlayerIndex].resources;

    // Recruit is enabled if we can activate more agents
    self.actionBar.enableAction(canActivateAgent() && canIBuy(createRecruitAction(), turnActions, self.currentBalance), Recruit);
    self.actionBar.setRemainingAgents(BalanceValues.AGENT_MAX_ACTIVE - getActiveAgents(gameState, currentPlayerIndex));

    // Shift and Withdraw require at least one active agent
    self.actionBar.enableAction(currentAgentCount > 0 && canIBuy(createShiftAction(), turnActions, self.currentBalance), Shift);
    withdrawEnabled = currentAgentCount > 0;

    // The other actions require us to check out various states of countries
    moveEnabled = false;
    escapeEnabled = false;
    var disableEnabled = false, removeEnabled = false;
    for (var countryIndex = 0; countryIndex < self.map.countries.length; ++countryIndex) {
      var country = self.map.countries[countryIndex];
      moveEnabled = moveEnabled || isValidAction(country, new Move());
      escapeEnabled = escapeEnabled || isValidAction(country, new Escape());
      disableEnabled = disableEnabled || isValidAction(country, new Disable());
      removeEnabled = removeEnabled || isValidAction(country, new Remove());
    }
    moveEnabled = moveEnabled || (gameState.players[currentPlayerIndex].disabledAgents.length > 0 && canActivateAgent());
    self.actionBar.enableAction(true && canIBuy(createBoostAction(), turnActions, self.currentBalance), Boost);
    self.actionBar.enableAction(true && canIBuy(createAttackAction(), turnActions, self.currentBalance), Attack);
    self.actionBar.enableAction((withdrawEnabled || moveEnabled || escapeEnabled) && canIBuy(createMoveAction(), turnActions, self.currentBalance),
                                Move);
    self.actionBar.enableAction(disableEnabled && canIBuy(createDisableAction(), turnActions, self.currentBalance), Disable);
    self.actionBar.enableAction(removeEnabled && canIBuy(createRemoveAction(), turnActions, self.currentBalance), Remove);

    self.actionBar.enableAction(!usingNonDesperationAction && canUseDesperation(gameState) === true && canIBuy(createDesperationAction(), turnActions, self.currentBalance), Desperation, canUseDesperation(gameState));
  };

  //----------------------------------------------------------------------------
  // Checks whether this country is in the list of countries that
  // accept the current action
  var willCountryAcceptAction = function(country) {
    for (var countryIndex = 0; countryIndex < validCountriesForAction.length; ++countryIndex) {
      if (validCountriesForAction[countryIndex] === country) {
        return true;
      }
    }
    return false;
  };

  //----------------------------------------------------------------------------
  // Checks whether the current player can activate an Agent
  var canActivateAgent = function() {
    return currentAgentCount < BalanceValues.AGENT_MAX_ACTIVE;
  };

  //----------------------------------------------------------------------------
  // Checks whether this action is valid for the given country or not
  var isValidAction = function(country, action) {
    var actionValid = false;
    // Desperation actions are valid in all countries
    if (action instanceof Desperation) {
      actionValid = true;
    }
    // Recruit actions are always valid in non-escaped countries
    else if (action instanceof Recruit && !country.hasBeenEscapedFrom()) {
      actionValid = true;
    }
    // Otherwise we need at least one agent in the country
    else if (country.getAgentCount(currentPlayerIndex) > 0) {
      // If we have agents, boost and move actions are valid
      if (action instanceof Move ||
          action instanceof Shift || action instanceof Withdraw) {
        actionValid = true;
      }
      else if (action instanceof Boost && country.hasPositiveAgents(currentPlayerIndex)) {
        actionValid = true;
      }
      // If this country has loyalty to another player attacks are valid
      else if (action instanceof Attack && country.hasOpposingLoyalty(currentPlayerIndex) &&
               country.hasNegativeAgents(currentPlayerIndex)) {
        actionValid = true;
      }
      // If there are ALSO enemy agents, Remove is valid
      else if (action instanceof Remove && country.hasOpposingAgents(currentPlayerIndex) &&
           country.getEscapableAgentCount() > 0) {
        actionValid = true;
      }
      // If there are ALSO enemy agents, and no non-escape moves have been added yet, Escape is valid
      else if (action instanceof Escape && canEscape && country.hasOpposingAgents(currentPlayerIndex) &&
           country.getEscapableAgentCount() > 0) {
        actionValid = true;
      }
    }

    return actionValid;
  };

  //----------------------------------------------------------------------------
  // Checks whether agent scopes are valid for the current action
  var areAgentScopesValid = function() {
    for (var countryIndex = 0; countryIndex < self.map.countries.length; ++countryIndex) {
      if (isValidAction(self.map.countries[countryIndex], currentAction)) {
        return true;
      }
    }
    return false;
  };

  //----------------------------------------------------------------------------
  // Checks whether the current player can activate an Agent
  var canUseDesperation = function(gameState) {
    // Desperation can only be used once per game
    if (gameState.players[currentPlayerIndex].usedDesperation) {
      return -1;
    }

    if (!gameState.players[currentPlayerIndex].usedDesperation && gameState.currentTurnIndex <= BalanceValues.DESPERATION_TURN_LIMIT) {
      var currentScore = getPlayerScore(gameState, currentPlayerIndex);
      for (var playerIndex = 0; playerIndex < gameState.players.length; ++playerIndex) {
        // If any other player is far enough ahead in score, the desperation move becomes available
        if (playerIndex != currentPlayerIndex && getPlayerScore(gameState, playerIndex) - currentScore >= BalanceValues.DESPERATION_SCORE_DIFFERENCE) {
          return true;
        }
      }
    }
    return false;
  };

  //----------------------------------------------------------------------------
  // Create an action given the current action type and this starting country
  var createAction = function() {
    switch (currentAction) {
      case 'attack':
        currentAction = createAttackAction();
        break;
      case 'boost':
        currentAction = createBoostAction();
        break;
      case 'desperation':
        currentAction = createDesperationAction();
        break;
      case 'disable':
        currentAction = createDisableAction();
        break;
      case 'escape':
        currentAction = createEscapeAction();
        break;
      case 'move':
        currentAction = createMoveAction();
        break;
      case 'moveType':
        getActionMoveType();
        break;
      case 'recruit':
        currentAction = createRecruitAction();
        break;
      case 'remove':
        currentAction = createRemoveAction();
        break;
      case 'shift':
        currentAction = createShiftAction();
        break;
      case 'withdraw':
        currentAction = createWithdrawAction();
        break;
    }

    // If we successfully created an action, start building its parameters
    if (typeof currentAction !== 'string' && !(currentAction instanceof String)) {
      buildAction();
    }
  };

  //----------------------------------------------------------------------------
  // Make sure an action has all its parameters built before submitting it
  var buildAction = function() {
    var isComplete = true;
    var parameters;

    if (currentAction instanceof Attack) {
      parameters = ['scope'];
      if (currentAction.scope === ActionScope.GLOBAL) {
        parameters.push('target');
      }
      else if (currentAction.scope === ActionScope.LOCAL) {
        parameters.push('source');
      }
      isComplete = addActionParameters(parameters);
    }
    if (currentAction instanceof Boost) {
      parameters = ['scope'];
      if (currentAction.scope === ActionScope.LOCAL) {
        parameters.push('source');
      }
      isComplete = addActionParameters(parameters);
    }
    if (currentAction instanceof Desperation) {
      isComplete = addActionParameters([]);
    }
    if (currentAction instanceof Disable) {
      isComplete = addActionParameters(['agentIndex']);
    }
    if (currentAction instanceof Escape) {
      isComplete = addActionParameters(['agentIndex', 'destination']);
    }
    if (currentAction instanceof Move) {
      isComplete = addActionParameters(['agentIndex', 'destination']);
    }
    if (currentAction instanceof Recruit) {
      parameters = ['messageType'];
      if (currentAction.messageType !== MessageType.POSITIVE) {
        parameters.push('target');
      }
      parameters.push('source');
      isComplete = addActionParameters(parameters);
    }
    if (currentAction instanceof Remove) {
      isComplete = addActionParameters(['agentIndex']);
    }
    if (currentAction instanceof Shift) {
      parameters = ['messageType', 'agentIndex'];
      if (currentAction.messageType !== MessageType.POSITIVE) {
        parameters.push('target');
      }
      isComplete = addActionParameters(parameters);
    }
    if (currentAction instanceof Withdraw) {
      isComplete = addActionParameters(['agentIndex']);
    }

    // If we have all our necessary parameters, submit the action
    if (isComplete) {
      submitCurrentAction();
    }
  };

  //----------------------------------------------------------------------------
  // Make sure the current action has the given parameters and if it does, then submit it
  var addActionParameters = function(parameters) {
    var parameter, isComplete;

    for (var paramIndex = 0; paramIndex < parameters.length; ++paramIndex) {
      parameter = parameters[paramIndex];
      // If we don't have this parameter, setup the UI to get it
      if (currentAction[parameter] === -1) {
        isComplete = false;
        switch (parameter) {
          case 'source':
            getActionSource();
            return false;
          case 'destination':
            getActionDestination();
            return false;
          case 'target':
            getActionPlayerTarget();
            return false;
          case 'agentIndex':
            getActionAgentTarget();
            return false;
          case 'messageType':
            getActionMessageType();
            return false;
          case 'scope':
            getActionScope();
            return false;
        }
      }
    }
    return true;
  };

  //----------------------------------------------------------------------------
  // Gets the starting country/disabled agent to create the current action from
  var getActionSource = function() {
    self.infoPanel.updateText('Select a location for this action');
    gettingActionSource = true;

    for (var countryIndex = 0; countryIndex < self.map.countries.length; ++countryIndex) {
      var country = self.map.countries[countryIndex];
      if (isValidAction(country, currentAction)) {
        country.highlightCountry(true);
        validCountriesForAction.push(country);
      }
      else {
        country.highlightCountry(false);
      }
    }
  };

  //----------------------------------------------------------------------------
  // Performs the next step of creating an action based on the action type
  var setActionSource = function(country) {
    if (willCountryAcceptAction(country)) {
      currentAction.source = self.map.getCountryIndex(country);
      buildAction();
    }
    else {
      cancelCurrentAction();
    }

    gettingActionSource = false;
    validCountriesForAction = [];
    self.map.clearCountryHighlights();
  };

  //----------------------------------------------------------------------------
  // Setup the UI to get the destination for the given move action
  var getActionDestination = function() {
    self.infoPanel.updateText('Select a destination for this action');
    gettingActionDestination = true;

    // Figure out which countries we can move in to
    validCountriesForAction = [];
    for (var countryIndex = 0; countryIndex < self.map.countries.length; ++countryIndex) {
      var country = self.map.countries[countryIndex];
      // The destination can't be the source country or a country that has been escaped from
      if (countryIndex !== currentAction.source && !country.hasBeenEscapedFrom()) {
        country.highlightCountry(true);
        validCountriesForAction.push(country);
      }
      else {
        country.highlightCountry(false);
      }
    }
  };

  //----------------------------------------------------------------------------
  // Set the current action's intended destination
  var setActionDestination = function(destinationCountry) {
    // If this country accepts the Move/Escape action, finish setting up
    // the action and send it to the controller
    if (willCountryAcceptAction(destinationCountry)) {
      // A country an Agent escapes from can not be moved into on this turn
      if (currentAction instanceof Escape) {
        self.map.countries[currentAction.source].agentEscaped();
      }

      // Set the destination and add the action
      currentAction.destination = self.map.getCountryIndex(destinationCountry);
      buildAction();
    }
    else {
      cancelCurrentAction();
    }

    gettingActionDestination = false;
    validCountriesForAction = [];
    self.map.clearCountryHighlights();
  };

  //----------------------------------------------------------------------------
  // Setup the UI to get the target for the given targeted action
  var getActionPlayerTarget = function() {
    self.infoPanel.updateText('Select the player you wish to target');
    targetSelector.show(getCurrentActionButtonPosition());
  };

  //----------------------------------------------------------------------------
  // Setup the UI to get the target for the given targeted action
  function setActionPlayerTarget(targetPlayerIndex) {
    targetSelector.hide();
    currentAction.target = targetPlayerIndex;
    buildAction();
  }

  //----------------------------------------------------------------------------
  // Setup the UI to get the target for the given targeted action
  var getActionAgentTarget = function() {
    var playerIndices = [];
    if (currentAction.targetEnemies)
    {
      var playerCount = self.currentActionList.getPlayerNames().length;
      for (var playerIndex = 0 ; playerIndex < playerCount; ++playerIndex) {
        if (playerIndex !== currentPlayerIndex) {
          playerIndices.push(playerIndex);
        }
      }
    }
    else {
      playerIndices.push(currentPlayerIndex);
    }

    if (playerIndices.length > 0) {
      self.infoPanel.updateText('Select the agent you wish to target');
      for (var countryIndex = 0; countryIndex < self.map.countries.length; ++countryIndex) {
        if (isValidAction(self.map.countries[countryIndex], currentAction)) {
          self.map.countries[countryIndex].readyAgentOverviewForTargetPick(countryIndex, playerIndices);
        }
      }
    }
  };

  //----------------------------------------------------------------------------
  // Callback for setting the current action's intended target
  function setActionAgentTarget(source, target) {
    self.map.clearCountryTargetPicking();

    currentAction.source = source;
    // If the current player wasn't the target player, store who it was
    if (target.player !== currentPlayerIndex) {
      currentAction.target = target.player;
    }
    currentAction.agentIndex = target.agent;
    buildAction();
  }

  //----------------------------------------------------------------------------
  // Setup the UI to get a message type for the action
  var getActionMoveType = function() {
    self.infoPanel.updateText('Select a type of move action');
    moveTypeSelector = new MoveTypeSelector(rootElement, setActionMoveType, getCurrentActionButtonPosition(), withdrawEnabled, moveEnabled, escapeEnabled);
  };

  //----------------------------------------------------------------------------
  // Set the message type of the current action
  var setActionMoveType = function(moveType) {
    moveTypeSelector.remove();
    moveTypeSelector = null;
    currentAction = moveType;
    createAction();
  };

  //----------------------------------------------------------------------------
  // Setup the UI to get a message type for the action
  var getActionMessageType = function() {
    self.infoPanel.updateText('Select a message type for the agent to use');
    messageTypeSelector = new MessageTypeSelector(rootElement, setActionMessageType, getCurrentActionButtonPosition());
  };

  //----------------------------------------------------------------------------
  // Set the message type of the current action
  var setActionMessageType = function(messageType) {
    messageTypeSelector.remove();
    messageTypeSelector = null;

    currentAction.messageType = messageType;
    buildAction();
  };

  //----------------------------------------------------------------------------
  // Setup the UI to get the scope for the current action
  var getActionScope = function() {
    self.infoPanel.updateText("Select this action's scope");

    var action = {};

    if (currentAction instanceof Boost) {
     action['global'] = createBoostAction(); action['global'].cost += BalanceValues.ACTION_GLOBAL_COST;
     action['broad'] = createBoostAction();
     action['local'] = createBoostAction();
    } else if (currentAction instanceof Attack) {
     action['global'] = createAttackAction(); action['global'].cost += BalanceValues.ACTION_GLOBAL_COST;
     action['broad'] = createAttackAction();
     action['local'] = createAttackAction();
    }

    var agentScopesValid = areAgentScopesValid();

    var enabledActions = {global: canIBuy(action['global'], self.currentActions, self.currentBalance),
                          broad: canIBuy(action['broad'], self.currentActions, self.currentBalance) && agentScopesValid,
                          local: canIBuy(action['local'], self.currentActions, self.currentBalance) && agentScopesValid};

    scopeSelector = new ScopeSelector(rootElement, setActionScope, getCurrentActionButtonPosition(), getCurrentActionMessageType(), enabledActions);
  };

  //----------------------------------------------------------------------------
  // Set the scope of the current action
  var setActionScope = function(scope) {
    scopeSelector.remove();
    scopeSelector = null;
    currentAction.scope = scope;
    if (scope === ActionScope.GLOBAL) {
      currentAction.cost += BalanceValues.ACTION_GLOBAL_COST;
    }
    buildAction();
  };

  //----------------------------------------------------------------------------
  // Get the message type of the current action
  var getCurrentActionMessageType = function() {
    if (currentAction instanceof Attack) {
      return MessageType.NEGATIVE;
    }
    return MessageType.POSITIVE;
  };

  //----------------------------------------------------------------------------
  // Add the current action to the list of actions to take this turn
  var submitCurrentAction = function() {
    self.addAction(currentAction);
    cleanupActionSetup();
    currentActionButton = null;
    currentAction = '';
    self.infoPanel.updateText('Add actions or submit your turn').show();

    $(document).trigger('ActionSubmitted');
  };

  //----------------------------------------------------------------------------
  // Cancel the current action being made
  var cancelCurrentAction = function() {
    cleanupActionSetup();
    gettingActionSource = false;
    gettingActionDestination = false;
    currentActionButton = null;
    currentAction = '';
    self.infoPanel.updateText('Add actions or submit your turn').show();
  };

  //----------------------------------------------------------------------------
  // Add the current action to the list of actions to take this turn
  var cleanupActionSetup = function() {
    rootElement.unbind('click.cancelAction');

    self.map.clearCountryHighlights();
    self.map.clearCountryTargetPicking();
    if (messageTypeSelector !== null) {
      messageTypeSelector.remove();
      messageTypeSelector = null;
    }
    if (moveTypeSelector !== null) {
      moveTypeSelector.remove();
      moveTypeSelector = null;
    }
    if (scopeSelector !== null) {
      scopeSelector.remove();
      scopeSelector = null;
    }
    targetSelector.hide();
  };

  //----------------------------------------------------------------------------
  // Return a new Attack Action object
  var createAttackAction = function() {
    var action = new Attack();
    action.targetEnemies = true;
    return action;
  };

  //----------------------------------------------------------------------------
  // Return a new Boost Action object
  var createBoostAction = function() {
    var action = new Boost();
    return action;
  };

  //----------------------------------------------------------------------------
  // Return a new Disable Action object
  var createDesperationAction = function() {
    var action = new Desperation();
    return action;
  };

  //----------------------------------------------------------------------------
  // Return a new Disable Action object
  var createDisableAction = function() {
    var action = new Disable();
    action.targetEnemies = true;
    action.targetDisabled = false;
    return action;
  };

  //----------------------------------------------------------------------------
  // Return a new Escape Action object
  var createEscapeAction = function() {
    var action = new Escape();
    action.targetEnemies = false;
    action.targetDisabled = false;
    return action;
  };

  //----------------------------------------------------------------------------
  // Return a new Move Action object
  var createMoveAction = function() {
    var action = new Move();
    action.targetEnemies = false;
    action.targetDisabled = canActivateAgent();
    return action;
  };

  //----------------------------------------------------------------------------
  // Return a new Recruit Action object
  var createRecruitAction = function() {
    var action = new Recruit();
    return action;
  };

  //----------------------------------------------------------------------------
  // Return a new Remove Action object
  var createRemoveAction = function() {
    var action = new Remove();
    action.targetEnemies = true;
    action.targetDisabled = false;
    return action;
  };

  //----------------------------------------------------------------------------
  // Return a new Shift Action object
  var createShiftAction = function() {
    var action = new Shift();
    action.targetEnemies = false;
    action.targetDisabled = false;
    return action;
  };

  //----------------------------------------------------------------------------
  // Return a new Shift Action object
  var createWithdrawAction = function() {
    var action = new Withdraw();
    action.targetEnemies = false;
    action.targetDisabled = false;
    return action;
  };

  /*****************************************************************************
   * Data Extraction Functions
   ****************************************************************************/
  //----------------------------------------------------------------------------
  // Extract the list of player names/ids from the player data
  var getPlayerNames = function(playerList) {
    var names = [];
    for (var playerIndex = 0; playerIndex < playerList.length; ++playerIndex) {
      names.push(playerList[playerIndex].name);
    }
    return names;
  };

  //----------------------------------------------------------------------------
  // Extract the list of country names from the map data
  var getCountryAbbreviations = function(countryList) {
    var names = [];
    for (var countryIndex = 0; countryIndex < countryList.length; ++countryIndex) {
      names.push(countryList[countryIndex].abbreviation);
    }
    return names;
  };

  //----------------------------------------------------------------------------
  // Get the loyalty text for a given territory
  var getTerritoryLoyaltyPercentageString = function(territory) {
    var percent = territory.currentLoyalty / territory.maxLoyalty;
    if (percent > 0) {
      var value = percent * 100;
      if (value > 0 && value < 1) {
        value = 1;
      }
      return Math.floor(value).toString();// + '%';
    }
    return '';
  };

  //----------------------------------------------------------------------------
  // Hide the loyalty percentage
  var removeLoyaltyPercentageFromCountry = function(country) {
    for (var t = 0; t < country.territories.length; t++) {
      country.territories[t].setText('');
    }
  };

  //----------------------------------------------------------------------------
  // Get the player's current score based on the state of the game
  var getPlayerScore = function(gameState, playerIndex) {
    // Current resources count towards the player's score
    var playerScore = gameState.players[playerIndex].resources * BalanceValues.SCORE_RESOURCE_VALUE;
    for (var countryIndex = 0; countryIndex < gameState.countries.length; ++countryIndex) {
      var country = gameState.countries[countryIndex];
      // Add points for controlling a country
      if (playerControlsCountry(country, playerIndex)) {
        playerScore += BalanceValues.SCORE_COUNTRY_VALUE;
      }
      // Add a point for every territory the player controls
      playerScore += getNumberOfLoyalTerritories(country, playerIndex) * BalanceValues.SCORE_TERRITORY_VALUE;
    }
    return playerScore;
  };

  //----------------------------------------------------------------------------
  // Get the position of the currently chosen action button
  var getCurrentActionButtonPosition = function() {
    var pos;
    if (currentActionButton !== null) {
      pos = currentActionButton.offset();
      pos = { x: pos.left + (parseInt(currentActionButton.css('width'), 10) / 2),
              y: pos.top - (parseInt(currentActionButton.css('height'), 10) / 2) };
    }
    else {
      pos = { x: $(window).width() / 2 + $(window).scrollLeft(),
              y: $(window).height() / 2 + $(window).scrollTop() };
    }
    return pos;
  };
}
