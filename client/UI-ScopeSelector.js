/*******************************************************************************
 * ScopeSelector - A UI element to select the scope of an action
 ******************************************************************************/
function ScopeSelector(p_parentElement, setScopeCB, p_pos, p_messageType, p_enabledScopes) {
  'use strict';
  var self = this;
  var container;
  var setScope = setScopeCB;

  //----------------------------------------------------------------------------
  this.setPosition = function(pos) {
    var padding = container.css('padding');
    if (padding === "") {
      padding = "0";
    }
    var width = parseInt(container.width(), 10) + parseInt(padding, 10);
    var height = parseInt(container.height(), 10) + parseInt(padding, 10);
    container.css('left',pos.x - (width/2));
    container.css('top', pos.y - (height/2));
  }

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
  var create = function(parentElement, pos, messageType, enabledScopes) {
    container = $('<div class="scopeSelectorContainer"></div>').appendTo(parentElement);
    createScopeButton(container, 'globalScopeButton', 'global', TOOLTIPS.SCOPE.GLOBAL, messageType, enabledScopes);
    createScopeButton(container, 'broadScopeButton', 'broad', TOOLTIPS.SCOPE.BROAD, messageType, enabledScopes);
    createScopeButton(container, 'localScopeButton', 'local', TOOLTIPS.SCOPE.LOCAL, messageType, enabledScopes);

    self.setPosition(pos);
    container.hide();
    container.fadeIn('slow');
  };

  //----------------------------------------------------------------------------
  var createScopeButton = function(container, messageTypeClass, name, tooltip, messageType, enabledScopes) {
    var button = $('<div class="scopeButton ' + messageTypeClass + '" name="' + name + '"></div>').appendTo(container);
    var overlay = $("<div class='iconOverlay'></div>").appendTo(button);
    new Opentip(button[0], tooltip.TEXT, getTooltipTitle(tooltip.TITLE, messageType));

    if (enabledScopes[name]){
      button.click(onScopeClicked);
    } else {
      button.attr('disabled', true);
      overlay.attr('disabled', true);
    }
  };

  //----------------------------------------------------------------------------
  var getTooltipTitle = function(tooltip, messageType) {
    switch (messageType) {
      case MessageType.POSITIVE:
        return tooltip.POSITIVE;
      case MessageType.NEGATIVE:
        return tooltip.NEGATIVE;
    }
    return tooltip.POSITIVE;
  }

  //----------------------------------------------------------------------------
  function onScopeClicked(event) {
    event.stopPropagation(); // The mouse click has been handled
    var scope = ActionScope.LOCAL;
    switch ($(this).attr('name')) {
      case 'global':
        scope = ActionScope.GLOBAL;
        break;
      case 'broad':
        scope = ActionScope.BROAD;
        break;
      case 'local':
        scope = ActionScope.LOCAL;
        break;
    }
    setScope(scope);
    $(document).trigger('ScopeClicked');
  }

  create(p_parentElement, p_pos, p_messageType, p_enabledScopes);
}
