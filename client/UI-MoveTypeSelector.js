/*******************************************************************************
 * MoveTypeSelector - A UI element to select a Move Type
 ******************************************************************************/
function MoveTypeSelector(p_parentElement, setMoveTypeCB, p_pos, withdrawEnabled, moveEnabled, escapeEnabled) {
  'use strict';
  var self = this;
  var container;
  var setMoveType = setMoveTypeCB;

  //----------------------------------------------------------------------------
  this.setPosition = function(pos) {
    var padding = container.css('padding');
    if (padding === "") {
      padding = "0";
    }
    var width = parseInt(container.width(), 10) + parseInt(padding, 10);
    var height = parseInt(container.height(), 10) + parseInt(padding, 10);
    container.css('left',pos.x - (width / 2));
    container.css('top', pos.y - (height / 2));
  };

  //----------------------------------------------------------------------------
  this.remove = function(instant) {
    container.children().mouseout();  // hack, what's the right way?
    if (!instant) {
      container.fadeOut('slow', function () { $(this).remove(); });
    }
    else {
      container.remove();
    }
  };

  //----------------------------------------------------------------------------
  var create = function(parentElement,pos) {
    container = $('<div class="messageTypeSelectorContainer"></div>').appendTo(parentElement);
    createMessageTypeButton(container, 'action-withdraw', 'withdraw', TOOLTIPS.ACTIONS.WITHDRAW, withdrawEnabled);
    createMessageTypeButton(container, 'action-move', 'move', TOOLTIPS.ACTIONS.MOVE, moveEnabled);
    createMessageTypeButton(container, 'action-escape', 'escape', TOOLTIPS.ACTIONS.ESCAPE, escapeEnabled);

    self.setPosition(pos);
    container.hide();
    container.fadeIn('slow');
  };

  //----------------------------------------------------------------------------
  var createMessageTypeButton = function(container, messageTypeClass, name, tooltip, enabled) {
    var button = $('<div class="actionBarIcon ' + messageTypeClass + '" name="' + name + '"></div>').appendTo(container);
    var overlay = $("<div class='iconOverlay'></div>").appendTo(button);
    new Opentip(button[0], tooltip.TEXT, tooltip.TITLE);
    button.click(onMoveTypeClicked);
    button.attr('disabled', !enabled);
    overlay.attr('disabled', !enabled);
  };

  //----------------------------------------------------------------------------
  function onMoveTypeClicked(event) {
    event.stopPropagation(); // The mouse click has been handled
    setMoveType($(this).attr('name'));
    $(document).trigger('ButtonClicked');
  }

  create(p_parentElement, p_pos);
}
