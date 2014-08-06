/*******************************************************************************
 * ActionList - The list of actions the player is taking this turn
 ******************************************************************************/

ActionList.prototype = new ContainerList();
ActionList.prototype.constructor = ActionList;
function ActionList(pageRoot, listClass, removeActionCB, clearActionsCB, submitTurnCB) {
  'use strict';
  ContainerList.apply(this, [pageRoot, listClass]);

  this.removeAction = removeActionCB;
  this.actionsActive = true;

  var containerStyleIncome = {
    container: "actionListIncomeContainer actionListItem-income",
    topBar: "incomeTopBar",
    title: "actionListHeaderText"
  };

  var containerStyleActions = {
    container: "actionListActionsContainer",
    topBar: "actionsTopBar",
    title: "actionListHeaderText"
  };

  var containerStyleSubmit = {
    container: "actionListSubmitContainer",
    topBar: "submitTopBar",
    title: "actionListHeaderText"
  };

  var resourceItemIncomeStyle = {
    action: "actionListItem actionListItem-balance",
    icon: "actionListIcon",
    notes: "actionListNotesLeftFloat",
    cost: "actionListAvailableResources"
  };

  var incomeItemStyle = {
    action: "actionListItem actionListItem-income",
    icon: "actionListIcon",
    notes: "actionListNotesLeftFloat",
    cost: "actionListAvailableResources"
  };

  var resourceItemCostStyle = {
    action: "actionListItem actionListItem-spending",
    icon: "actionListIcon",
    notes: "actionListNotesLeftFloat",
    cost: "actionListCost"
  };

  var resourceItemDeficitStyle = {
    action: "actionListItem actionListItem-deficit",
    icon: "actionListIcon",
    notes: "actionListNotesLeftFloat",
    cost: "actionListCost-black"
  };

  var self = this;
  var isInteractive = true;
  var toggleContainer = self.addContainer('CONTROLS', containerStyleSubmit);
  var toggleButton = toggleContainer.addButton('actionListToggleView', function () { self.toggleContainers(); }, 'Show Income');
  var incomeContainer = self.addContainer('INCOME BREAKDOWN', containerStyleIncome);
  var actionContainer = self.addContainer('ACTIONS', containerStyleActions);
  var submitContainer = self.addContainer('SUBMIT', containerStyleSubmit);
  var clearActions = submitContainer.addButton('actionListClearActions', clearActionsCB, 'Cancel Actions');
  var submitButton = submitContainer.addButton('actionListSubmitTurn', submitTurnCB, 'Submit Turn');
  var transitionTime = 500;

  // ---------------------------------------------------------------------------
  this.setInteractive = function(interactive) {
    isInteractive = interactive;
    clearActions.disabled = !isInteractive;
    actionContainer.disableItems(!isInteractive);
    return this;
  };

  // ---------------------------------------------------------------------------
  // Setup the ActionItems for the player resource containers
  this.setTooltips = function() {
    for (var regionItemIndex = 0; regionItemIndex < incomeContainer.regionItems.length; ++regionItemIndex) {
      new Opentip(incomeContainer.regionItems[regionItemIndex].rootElement, TOOLTIPS.INCOME.COUNTRIES.TEXT, TOOLTIPS.INCOME.COUNTRIES.TITLE);
    }
    if (incomeContainer.districtItem !== undefined) {
      new Opentip(incomeContainer.districtItem.rootElement, TOOLTIPS.INCOME.TERRITORIES.TEXT, TOOLTIPS.INCOME.TERRITORIES.TITLE);
    }
    if (incomeContainer.upkeepItem !== undefined) {
      new Opentip(incomeContainer.upkeepItem.rootElement, TOOLTIPS.INCOME.UPKEEP.TEXT, TOOLTIPS.INCOME.UPKEEP.TITLE);
    }
    for (var taxItemIndex = 0; taxItemIndex < actionContainer.taxItems.length; ++taxItemIndex) {
      new Opentip(actionContainer.taxItems[taxItemIndex].rootElement, TOOLTIPS.ACTIONS.ADDITIONAL_COST.TEXT, TOOLTIPS.ACTIONS.ADDITIONAL_COST.TITLE);
    }
  };

  // ---------------------------------------------------------------------------
  // Clear all three action containers of all their items
  this.clearActions = function() {
    incomeContainer.clearItems();
    incomeContainer.regionItems = [];

    actionContainer.clearItems();
    actionContainer.taxItems = [];
  };

  // ---------------------------------------------------------------------------
  // Add the given action description to the appropriate ActionContainer
  this.setActions = function(gameState, playerID, actions, mouseOverCB, mouseOutCB) {
    // Whether it's showing or not, update the income container
    updateIncomeContainer(gameState, playerID);

    // Add how many resources we had to start with
    var startingResources = gameState.players[playerID].resources;
    actionContainer.addItem('actionPoints-bankedResources', 'Available:', startingResources, resourceItemIncomeStyle, false);

    var spendingResources = self.addActions(actionContainer, actions, mouseOverCB, mouseOutCB, onActionClicked, true);

    actionContainer.addItem('actionPoints-bankedResources', 'Spending:', -spendingResources, resourceItemCostStyle, true);

    var remainingResources = startingResources - spendingResources;
    var remainingStyle = remainingResources >= 0 ? resourceItemIncomeStyle : resourceItemDeficitStyle;
    actionContainer.addItem('actionPoints-bankedResources', 'Remaining:', remainingResources, remainingStyle, false);
  };

  // ---------------------------------------------------------------------------
  this.toggleContainers = function (setActionsActive) {

    self.actionsActive = setActionsActive || !self.actionsActive;

    if (self.actionsActive) { // show actions, hide income
      toggleContainer.setButtonText('Show Income');
      // hiding
      if (incomeContainer.isVisible()) {
        incomeContainer.hide(transitionTime, function () {
          // showing
          actionContainer.show(transitionTime);
          submitContainer.show(transitionTime);
        });
      }
    }
    else { // show actions, hide income
      toggleContainer.setButtonText('Show Actions');

      if (actionContainer.isVisible()) { actionContainer.hide(transitionTime); }
      if (submitContainer.isVisible()) {
        submitContainer.hide(transitionTime, function () {
          // show containers after containers are finished hiding
          incomeContainer.show(transitionTime);
        });
      }
    }

  };

  // ---------------------------------------------------------------------------
  this.enableSubmitButton = function(enabled) {
    submitButton.disabled = !enabled;
  };

  // ---------------------------------------------------------------------------
  function onActionClicked (action, actionIndex) {
    if (isInteractive) {
      self.removeAction(action, actionIndex);
      $(document).trigger('ActionCanceled');
    }
  }

  // ---------------------------------------------------------------------------
  var updateIncomeContainer = function (gameState, playerID, hidden) {
    // list all action point sources / bonuses
    incomeContainer.clearItems();
    hidden = hidden || false;
    var actionPoints = calculateActionPointsEarned(gameState, playerID);

    // carry over action points from last turn
    incomeContainer.addItem('actionPoints-bankedResources', "Banked: ", actionPoints.bankedResources.toString(), incomeItemStyle, false);

    // add default income
    incomeContainer.addItem('actionPoints-defaultIncome', "Income: ", actionPoints.defaultIncome.toString(), incomeItemStyle, true);

    if (actionPoints.territoriesControlled && actionPoints.territoryControlBonus > 0) {
      incomeContainer.districtItem = incomeContainer.addItem('actionPoints-territoryControl', actionPoints.territoriesControlled + ' Loyal Population:', actionPoints.territoryControlBonus.toString(), incomeItemStyle, true);
    }

    if (actionPoints.countriesControlled) {
      for (var c = 0; c < actionPoints.countriesControlled.length; c++) {
        var controlledCountry = actionPoints.countriesControlled[c];
        incomeContainer.regionItems.push(incomeContainer.addItem('actionPoints-countryControl', self.getCountryName(controlledCountry.nationID) + ':', controlledCountry.nationBonus.toString(), incomeItemStyle, true));
      }
    }
    incomeContainer.upkeepItem = incomeContainer.addItem('actionPoints-agentUpkeep', actionPoints.numAgents.toString() + ' Agent Upkeep:', actionPoints.agentUpkeep.toString(), actionPoints.agentUpkeep >= 0 ? incomeItemStyle : incomeItemStyle, true);

    incomeContainer.addItem('actionPoints-bankedResources', 'Available:', gameState.players[playerID].resources, resourceItemIncomeStyle, false);

    if (self.actionsActive) {
      incomeContainer.hide();
    }
  };

  // ---------------------------------------------------------------------------
  var calculateActionPointsEarned = function (gameState, playerID) {
    var actionPoints = {};
    // return object looks like this:
    // territoriesControlled, (int)
    // territoryControlBonus, (int)
    // countriesControlled: [], array of objects
    // // nationID (int)
    // // nationBonus (int)
    // agentUpkeep (int)
    // numAgents (int)

    // calculate action points earned for territory and country control
    actionPoints.territoriesControlled = 0;
    actionPoints.countriesControlled = [];
    for (var c = 0; c < gameState.countries.length; c++ ) {
      actionPoints.territoriesControlled += getNumberOfLoyalTerritories(gameState.countries[c], playerID);
      if (playerControlsCountry(gameState.countries[c], playerID)) {
        actionPoints.countriesControlled.push({nationID: c, nationBonus: getCountryResources(gameState.countries[c])});
      }
    }

    // calculate bonuses
    actionPoints.territoryControlBonus = 0;
    var territoryBonuses = getTerritoryResourceThresholds();
    for (var n = 0; n < territoryBonuses.length; n++) {
      if (actionPoints.territoriesControlled >= territoryBonuses[n].threshold) {
        actionPoints.territoryControlBonus += territoryBonuses[n].value;
      }
    }

    // get agent upkeep costs
    actionPoints.agentUpkeep = -1 * getAgentUpkeepCosts(gameState, playerID);

    // get numAgents
    actionPoints.numAgents = getActiveAgents(gameState, playerID);

    // default income
    actionPoints.defaultIncome = getBaseIncome();

    // calculate resource total before all theses bonuses
    actionPoints.bankedResources = gameState.players[playerID].resources -
      (actionPoints.defaultIncome +
      actionPoints.agentUpkeep +
      (actionPoints.territoryControlBonus || 0) +
      (function () {
        var r = 0;
        if (actionPoints.countriesControlled.length > 0) {
          for (c = 0; c < actionPoints.countriesControlled.length; c++) {
            r += actionPoints.countriesControlled[c].nationBonus;
          }
          return r;
        }
        return 0;
      })());

    return actionPoints;
  };
}