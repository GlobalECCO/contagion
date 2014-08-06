/*******************************************************************************
 * ScopeSelector - A UI element to select the scope of an action
 ******************************************************************************/
function TargetSelector(p_parentElement, p_playerList, p_currentPlayerIndex, setTargetCB) {
  'use strict';
  var self = this;
  var container;
  var setTarget = setTargetCB;

  //----------------------------------------------------------------------------
  this.setPosition = function(pos) {
    var width = parseInt(container.css('width'), 10) + parseInt(container.css('padding'), 10);
    var height = parseInt(container.css('height'), 10) + parseInt(container.css('padding'), 10);
    container.css('left',pos.x - (width/2));
    container.css('top', pos.y - (height/2));
  };

  //----------------------------------------------------------------------------
  this.setTooltips = function() {
    container.children().each(function() {
      var tooltip = TOOLTIPS.TARGET.TEXT + $(this).attr('targetname');
      new Opentip(this, tooltip, TOOLTIPS.TARGET.TITLE);
    });
  };

  //----------------------------------------------------------------------------
  this.show = function(pos) {
    // Don't bother showing the selector if there is only one thing to select
    if (container.children().length === 1) {
      container.children()[0].click();
    }
    else {
      self.setPosition(pos);
      container.fadeIn('slow');
    }
  };

  //----------------------------------------------------------------------------
  this.hide = function() {
    container.children().mouseout();  // hack, what's the right way?
    container.fadeOut('slow');
  };

  //----------------------------------------------------------------------------
  this.isVisible = function(pos) {
    return container.is(":visible");
  };

  //----------------------------------------------------------------------------
  this.remove = function() {
    container.remove();
  };

  //----------------------------------------------------------------------------
  var create = function(parentElement, playerList, currentPlayerIndex) {
    container = $('<div class="targetSelectorContainer"></div>').appendTo(parentElement);
    for (var playerIndex = 0; playerIndex < playerList.length; ++playerIndex) {
      if (playerIndex !== currentPlayerIndex) {
        createTargetButton(container, playerList[playerIndex], playerIndex);
      }
    }

    container.hide();
  };

  //----------------------------------------------------------------------------
  var createTargetButton = function(container, player, playerIndex) {
    var button = $('<div class="targetButton ideologyType' + player.ideologyType +
                   '" name="' + playerIndex + '" targetname="' + player.name + '"></div>').appendTo(container);
    button.css({'background-color': player.color});
    button.click(onTargetClicked);
    var overlay = $('<div class="iconOverlay"></div>').appendTo(button);
  };

  //----------------------------------------------------------------------------
  function onTargetClicked(event) {
    event.stopPropagation(); // The mouse click has been handled
    setTarget(parseInt($(this).attr('name'), 10));
    $(document).trigger('TargetClicked');
  }

  create(p_parentElement, p_playerList, p_currentPlayerIndex);
}
