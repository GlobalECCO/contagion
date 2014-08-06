/*******************************************************************************
 * A UI element showing the actions a player can perform in the game
 ******************************************************************************/
function ActionBar(clickCB) {
  'use strict';
  this.clickCB = clickCB;

  var self = this;

  var isInteractive = true;

  // Primary full horizontal docked to bottom of screen.
  this.dock = $("<div class='actionBar'></div>");
  document.body.appendChild(this.dock[0]);

  // Non-moving bottom dock that encloses the actions.
  this.actionsDock = $("<div class='actionBarContainer'></div>");
  this.dock.append(this.actionsDock[0]);

  // Invisible/animating container that controls all action icons at once.
  this.iconContainer = $("<div class='actionBarIconsContainer'></div>");
  this.actionsDock.append(this.iconContainer[0]);

  this.recruitIcon = {};
  this.recruitIcon.icon = $("<div class='actionBarIcon action-recruit' name='recruit'><div class='remainingAgentsContainer'><div class='remainingAgent'></div><div class='remainingAgent'></div><div class='remainingAgent'></div></div></div>");
  this.recruitIcon.overlay = $("<div class='iconOverlay'></div>");
  this.iconContainer.append(this.recruitIcon.icon[0]);
  this.recruitIcon.icon.append(this.recruitIcon.overlay[0]);

  this.shiftIcon = {};
  this.shiftIcon.icon = $("<div class='actionBarIcon action-shift' name='shift'></div>");
  this.shiftIcon.overlay = $("<div class='iconOverlay'></div>");
  this.iconContainer.append(this.shiftIcon.icon[0]);
  this.shiftIcon.icon.append(this.shiftIcon.overlay[0]);

  this.boostIcon = {};
  this.boostIcon.icon = $("<div class='actionBarIcon action-boost' name='boost'></div>");
  this.boostIcon.overlay = $("<div class='iconOverlay'></div>");
  this.iconContainer.append(this.boostIcon.icon[0]);
  this.boostIcon.icon.append(this.boostIcon.overlay[0]);

  this.attackIcon = {};
  this.attackIcon.icon = $("<div class='actionBarIcon action-attack' name='attack'></div>");
  this.attackIcon.overlay = $("<div class='iconOverlay'></div>");
  this.iconContainer.append(this.attackIcon.icon[0]);
  this.attackIcon.icon.append(this.attackIcon.overlay[0]);

  this.moveIcon = {};
  this.moveIcon.icon = $("<div class='actionBarIcon action-moveagent' name='moveType'></div>");
  this.moveIcon.overlay = $("<div class='iconOverlay'></div>");
  this.iconContainer.append(this.moveIcon.icon[0]);
  this.moveIcon.icon.append(this.moveIcon.overlay[0]);

  this.removeIcon = {};
  this.removeIcon.icon = $("<div class='actionBarIcon action-remove' name='remove'></div>");
  this.removeIcon.overlay = $("<div class='iconOverlay'></div>");
  this.iconContainer.append(this.removeIcon.icon[0]);
  this.removeIcon.icon.append(this.removeIcon.overlay[0]);

  this.desperationIcon = {};
  this.desperationIcon.icon = $("<div class='actionBarIcon action-desperation' name='desperation'></div>");
  this.desperationIcon.overlay = $("<div class='iconOverlay'></div>");
  this.iconContainer.append(this.desperationIcon.icon[0]);
  this.desperationIcon.icon.append(this.desperationIcon.overlay[0]);

  //----------------------------------------------------------------------------
  // Show the action bar
  this.show = function() {
    this.dock.css("visibility", "visible");
    return this;
  };

  //----------------------------------------------------------------------------
  // Hide the action bar
  this.hide = function() {
    this.dock.css("visibility", "hidden");
    return this;
  };

  //----------------------------------------------------------------------------
  // Sets whether the action bar is interactive or not
  // @param[in]  interactive  Whether the action bar is interactive or not.
  this.setInteractive = function(interactive) {
    isInteractive = interactive;

    setIconInteractive(self.recruitIcon, isInteractive);
    setIconInteractive(self.shiftIcon, isInteractive);
    setIconInteractive(self.boostIcon, isInteractive);
    setIconInteractive(self.attackIcon, isInteractive);
    setIconInteractive(self.moveIcon, isInteractive);
    setIconInteractive(self.removeIcon, isInteractive);
    setIconInteractive(self.desperationIcon, isInteractive);

    return this;
  };

  //----------------------------------------------------------------------------
  // Enables/disables the icon representing the given action
  this.enableAction = function(enabled, action, desperationUsed) {
    switch (action) {
      case Attack:
        setIconInteractive(self.attackIcon, enabled);
        break;
      case Boost:
        setIconInteractive(self.boostIcon, enabled);
        break;
      case Desperation:
        this.desperationIcon.icon.animate( {top: 0}, { duration: 150, queue: false } );
        setIconInteractive(self.desperationIcon, enabled, desperationUsed);
        break;
      case Move:
        setIconInteractive(self.moveIcon, enabled);
        break;
      case Recruit:
        setIconInteractive(self.recruitIcon, enabled);
        break;
      case Remove:
        setIconInteractive(self.removeIcon, enabled);
        break;
      case Shift:
        setIconInteractive(self.shiftIcon, enabled);
        break;
    }
  };

  //----------------------------------------------------------------------------
  // Show the action bar
  this.setActionTooltips = function() {
    setIconTooltip(self.attackIcon.icon, TOOLTIPS.ACTIONS.ATTACK);
    setIconTooltip(self.boostIcon.icon, TOOLTIPS.ACTIONS.BOOST);
    setIconTooltip(self.desperationIcon.icon, TOOLTIPS.ACTIONS.DESPERATION);
    setIconTooltip(self.moveIcon.icon, TOOLTIPS.ACTIONS.MOVE_TYPE);
    setIconTooltip(self.recruitIcon.icon, TOOLTIPS.ACTIONS.RECRUIT);
    setIconTooltip(self.removeIcon.icon, TOOLTIPS.ACTIONS.REMOVE);
    setIconTooltip(self.shiftIcon.icon, TOOLTIPS.ACTIONS.SHIFT);
  };

  //----------------------------------------------------------------------------
  // Set the remaining number of agents on
  this.setRemainingAgents = function(agentsRemaining) {
    self.recruitIcon.icon.attr('remaining', agentsRemaining);
  };

  //----------------------------------------------------------------------------
  // Makes the given icon draggable with our preset drag options
  var setIconInteractive = function(actionButton, isInteractive, desperationUsed) {
    if (desperationUsed === -1) {
      actionButton.icon.removeClass('action-desperation');
      actionButton.icon.addClass('desperationUsed');
    }
    actionButton.icon.attr('disabled', !isInteractive);
    actionButton.overlay.attr('disabled', !isInteractive);
  };

  //----------------------------------------------------------------------------
  // Create a new tooltip element for this action button with the given text
  var setIconTooltip = function(actionButton, tooltip) {
    new Opentip(actionButton[0], tooltip.TEXT, tooltip.TITLE);
  };

  //----------------------------------------------------------------------------
  // Activates event IconHover.
  $('.actionBarIcon').mouseenter(function () {
      if ($(this).attr('disabled') !== 'disabled') {
        // Start animating if there are no currently active icons first.
        //$(this).animate( {"width":"80px", "height": "80px", "top": -20}, { duration: 'fast', queue: false } );
        //$('.iconsContainer').animate( {"bottom":"50px"}, { duration: 'fast', queue: false } );
        $(this).animate( {top: -10}, { duration: 150, queue: false } );
      }
    }
  );

  //----------------------------------------------------------------------------
  // Activates event IconLeave.
  $('.actionBarIcon').mouseleave(function() {
      // Animate the icon and make it shrink back to normal.
      //$(this).animate( {"width":"60px", "height": "60px", "top": 0, "left": 0}, {duration: 'fast', queue: true});
      //$('.iconsContainer').animate( {"bottom":"30px"}, { duration: 'fast', queue: false } );
      $(this).animate( {top: 0}, { duration: 150, queue: false } );
    }
  );

  //----------------------------------------------------------------------------
  // Tell the UI an action has been clicked on.
  $('.actionBarIcon').click(function(event) {
      if ($(this).attr('disabled') !== 'disabled') {
        event.stopPropagation(); // The mouse click has been handled
        self.clickCB($(this));
      }
    }
  );
}
