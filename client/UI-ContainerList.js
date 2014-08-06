/*******************************************************************************
 * LineItem - A single line item
 ******************************************************************************/
function LineItem(actionClass, text, cost, styles) {
  'use strict';
  this.rootElement = document.createElement("div");
  this.icon = actionClass && document.createElement("div");
  this.notes = document.createElement("div");
  this.cost = document.createElement("div");

  var self = this;

  (function construct(self) {
    self.rootElement.className = styles.action;

    if (self.icon !== null) {
      self.icon.className = styles.icon + ' ' + actionClass;
      self.rootElement.appendChild(self.icon);
    }

    self.notes.className = styles.notes;
    self.cost.className = styles.cost;

    self.rootElement.appendChild(self.notes);
    self.rootElement.appendChild(self.cost);

    $(self.notes).text(text);
    $(self.cost).text(cost);
  })(this);

  // ---------------------------------------------------------------------------
  this.addOverlay = function() {
    
    self.overlay = document.createElement("div");
    self.overlay.className = "iconOverlayWide";
    
    self.trashcan = document.createElement("div");
    self.trashcan.className = "actionListTrashCan";
    
    self.overlay.appendChild(self.trashcan);
    self.rootElement.appendChild(self.overlay);
  }

  // ---------------------------------------------------------------------------
  this.setMouseCallbacks = function(mouseOverCB, mouseOutCB, mouseClickCB) {
    self.rootElement.onmouseover = mouseOverCB;
    self.rootElement.onmouseout = mouseOutCB;
    self.rootElement.onclick = mouseClickCB;
  };

  // ---------------------------------------------------------------------------
  this.disable = function(disabled) {
    //$(self.rootElement).attr('disabled', disabled);
    if (self.overlay !== undefined) {
      if (disabled) {
        $(self.overlay).hide();
      }
      else {
        $(self.overlay).show();
      }
    }
  }
}

/*******************************************************************************
 * ItemContainer - A container of multiple LineItems
 ******************************************************************************/
function ItemContainer(title, styles) {
  'use strict';
  this.rootElement = document.createElement("div");
  this.topBar = document.createElement("div");
  this.titleElement = document.createElement("p");
  this.items = [];

  var self = this;

  (function construct(self) {
    self.rootElement.className = styles.container;

    $(self.titleElement).html(title);
    self.titleElement.className = styles.title;

    self.topBar.className = styles.topBar;

    self.topBar.appendChild(self.titleElement);
    self.rootElement.appendChild(self.topBar);
  })(this);

  // ---------------------------------------------------------------------------
  // Clear the container of all its elements
  this.clearItems = function() {
    for (var actionIndex = 0; actionIndex < this.items.length; ++actionIndex) {
      $(this.items[actionIndex].rootElement).remove();
    }
    this.items = [];
  };

  // ---------------------------------------------------------------------------
  // Add an LineItem to the container
  this.addItem = function(imageUrl, text, cost, styles, isTally) {
    // If we're supposed to show the cost, add a + or - to it first
    isTally = isTally || false;
    if (isTally) {
      if (cost < 0) {
        cost = '-' + (Math.abs(cost)).toString();
      }
      else if (cost > 0) {
        cost = '+' + (Math.abs(cost)).toString();
      }
    }

    var newAction = new LineItem(imageUrl, text, cost, styles);
    this.rootElement.appendChild(newAction.rootElement);
    this.items.push(newAction);
    return newAction;
  };

  // ---------------------------------------------------------------------------
  // Add a button to the container
  this.addButton = function(classname, callback, buttonText) {
    this.rootElement.style.display = "block";

    var button = document.createElement("button");
    button.className = classname;
    button.onclick = callback;
    button.innerHTML = "<div class='iconOverlay'></div>";

    buttonText = buttonText || "";
    var actionDiv = document.createElement("div");
    actionDiv.className = 'actionListItem';

    var actionDivText = document.createElement("div");
    actionDivText.className = 'actionListNotesLeftFloatBold';
    actionDivText.innerHTML = buttonText;
    actionDiv.appendChild(actionDivText);
    actionDiv.appendChild(button);

    this.rootElement.appendChild(actionDiv);

    return button;
  };

  // ---------------------------------------------------------------------------
  this.show = function(animationDuration, fn) {
    var animateOn = (typeof animationDuration === 'number');
    fn = fn || function () {};
    if (animateOn) {
     $(this.rootElement).show("slide", { direction: "right" }, animationDuration, fn);
    } else {
      $(this.rootElement).css('display', '');
    }
    return this;
  };

  // ---------------------------------------------------------------------------
  this.hide = function(animationDuration, fn) {
    var animateOn = (typeof animationDuration === 'number');
    fn = fn || function () {};
    if (animateOn) {
      $(this.rootElement).hide("slide", { direction: "right" }, animationDuration, fn);
    } else {
      $(this.rootElement).css('display', 'none');
    }
    return this;
  };

  // ---------------------------------------------------------------------------
  this.disableItems = function(disabled) {
    for (var itemIndex = 0; itemIndex < self.items.length; ++itemIndex) {
      self.items[itemIndex].disable(disabled);
    }
  }

  // ---------------------------------------------------------------------------
  this.isEmpty = function () {
    return ($(this.rootElement).children('.actionListItem')).length === 0;
  };

  // ---------------------------------------------------------------------------
  this.isVisible = function () {
    return $(this.rootElement).css('display') !== 'none';
  };

  // ---------------------------------------------------------------------------
  this.setButtonText = function (buttonText, index) {
    index = index || 0;
    var $root = $(this.rootElement);
    $($(this.rootElement).find('.actionListNotesLeftFloatBold')[index]).text(buttonText);
  };
}

/*******************************************************************************
 * ContainerList - A list of any number of ItemContainers
 ******************************************************************************/
function ContainerList(pageRoot, listClass) {
  'use strict';
  // Don't both constructing anything if we didn't get any arguments
  if (arguments.length === 0) {
    return;
  }

  this.root = $('<div class="' + listClass + '"></div>');
  pageRoot.append(this.root);

  var self = this;

  var playerNames = null;
  var countryNames = null;

  // ---------------------------------------------------------------------------
  this.setPlayerNames = function(players) {
    playerNames = players;
  };

  // ---------------------------------------------------------------------------
  this.getPlayerNames = function() {
    return playerNames;
  };

  // ---------------------------------------------------------------------------
  this.setCountryNames = function(countries) {
    countryNames = countries;
  };

  // ---------------------------------------------------------------------------
  this.getCountryName = function(index) {
    return countryNames[index];
  }

  // ---------------------------------------------------------------------------
  this.show = function() {
    this.root.css('visibility', 'visible');
    return this;
  };

  // ---------------------------------------------------------------------------
  this.hide = function() {
    this.root.css('visibility', 'hidden');
    return this;
  };

  // ---------------------------------------------------------------------------
  // Adds the given list of actions to the given container
  this.addActions = function(container, actions, mouseOverCB, mouseOutCB, mouseClickCB, showCost) {
    var spendingResources = 0;
    if (actions.length > 0) {
      // Add the list of actions and any tax items if they have any
      for (var actionIndex = 0; actionIndex < actions.length; ++actionIndex) {
        var action = actions[actionIndex];
        spendingResources += addAction(container, action, actionIndex, mouseOverCB, mouseOutCB, mouseClickCB, showCost);
      }
    }
    else {
      addAction(container, null, -1, mouseOverCB, mouseOutCB, mouseClickCB, showCost);
    }
    return spendingResources;
  }

  // ---------------------------------------------------------------------------
  // Add an ItemContainer to the ContainerList
  this.addContainer = function(title, styles, clickCB) {
    var newContainer = new ItemContainer(title, styles, clickCB);
    self.root.append(newContainer.rootElement);
    return newContainer;
  };

  var taxItemStyle = {
    action: "actionListItem actionListItem-taxes",
    icon: "actionListIcon",
    notes: "actionListNotesCentered",
    cost: "actionListCost"
  };

  var noActionLineItemStyle = {
    action: "actionListItem",
    icon: "actionListIcon",
    notes: "actionListNotesCentered",
    cost: "actionListCost"
  };

  var defaultLineItemStyle = {
    action: "actionListItem actionListItem-action",
    icon: "actionListIcon",
    notes: "actionListNotesCentered",
    cost: "actionListCost"
  };

  var desperationLineItemStyle = {
    action: "actionListItem actionListItem-desperation",
    icon: "actionListIcon",
    notes: "actionListNotesCentered",
    cost: "actionListAvailableResources"
  };

  var withdrawLineItemStyle = {
    action: "actionListItem actionListItem-withdraw",
    icon: "actionListIcon",
    notes: "actionListNotesCentered",
    cost: "actionListAvailableResources"
  };

  // ---------------------------------------------------------------------------
  // Get the string description of the given action object
  var getActionString = function(action) {
    if (action !== null) {
      if ((action.scope === undefined && action.source !== -1) || action.scope === ActionScope.LOCAL) {
        if (action.destination === undefined) {
          return 'At ' + countryNames[action.source];
        }
        if (action.source === 'D') {
          return 'From Disabled to ' + countryNames[action.destination];
        }
        return 'From ' + countryNames[action.source] + ' to ' + countryNames[action.destination];
      }
      else if (action.scope === ActionScope.BROAD) {
        return 'All Agents';
      }
      return 'All Regions';
    }
    return 'No Actions';
  };

  // ---------------------------------------------------------------------------
  // Get the css class to add for this action
  var getActionClass = function(action) {
    if (action instanceof Attack) {
      return 'action-attack';
    }
    else if (action instanceof Boost) {
      return 'action-boost';
    }
    else if (action instanceof Desperation) {
      return 'action-desperation';
    }
    else if (action instanceof Disable) {
      return 'action-disable';
    }
    else if (action instanceof Escape) {
      return 'action-escape';
    }
    else if (action instanceof Move) {
      return 'action-move';
    }
    else if (action instanceof Recruit) {
      return 'action-recruit';
    }
    else if (action instanceof Remove) {
      return 'action-remove';
    }
    else if (action instanceof Shift) {
      return 'action-shift';
    }
    else if (action instanceof Withdraw) {
      return 'action-withdraw';
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Get the css style to use for this action
  var getActionStyle = function(action) {
    if (action === null) {
      return noActionLineItemStyle;
    }
    else if (action instanceof Desperation) {
      return desperationLineItemStyle;
    }
    else if (action instanceof Withdraw) {
      return withdrawLineItemStyle;
    }
    return defaultLineItemStyle;
  }

  // ---------------------------------------------------------------------------
  // Adds the action to the action container and returns the action's total cost
  var addAction = function(container, action, actionIndex, mouseOverCB, mouseOutCB, mouseClickCB, showCost) {
    var actionCost = 0;
    var addedLineItem = container.addItem(getActionClass(action), getActionString(action), action !== null && showCost ? -action.cost : '', getActionStyle(action), action !== null && showCost);
    if (action !== null) {
      actionCost += action.cost;
      if (action.tax !== undefined && action.tax > 0) {
        container.taxItems.push(container.addItem('actionListTaxes', '', -action.tax, taxItemStyle, showCost));
        actionCost += action.tax;
      }

      // If we're showing the cost, then this is a clickable item and should have an overlay
      if (showCost) {
        addedLineItem.addOverlay();
      }

      // Setup the mouse callback functions
      addedLineItem.setMouseCallbacks(mouseOverActionInjector, mouseOutActionInjector, mouseClickActionInjector);
    }

    // Callback functions internally defined so we have access to the action
    function mouseOverActionInjector(e) {
      mouseOverCB(e, action);
    }
    function mouseOutActionInjector(e) {
      mouseOutCB(e, action);
    }
    function mouseClickActionInjector(e) {
      if (mouseClickCB !== null) {
        mouseClickCB(action, actionIndex);
      }
    }

    return actionCost;
  }
}