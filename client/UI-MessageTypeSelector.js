/*******************************************************************************
 * MessageTypeSelector - A UI element to select a MessageType
 ******************************************************************************/
function MessageTypeSelector(p_parentElement, setMessageTypeCB, p_pos) {
  'use strict';
  var self = this;
  var container;
  var setMessageType = setMessageTypeCB;

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
    createMessageTypeButton(container, 'positiveMessageType', 'positive', TOOLTIPS.MESSAGE.POSITIVE);
    createMessageTypeButton(container, 'neutralMessageType', 'flexible', TOOLTIPS.MESSAGE.FLEXIBLE);
    createMessageTypeButton(container, 'negativeMessageType', 'negative', TOOLTIPS.MESSAGE.NEGATIVE);

    self.setPosition(pos);
    container.hide();
    container.fadeIn('slow');
  };

  //----------------------------------------------------------------------------
  var createMessageTypeButton = function(container, messageTypeClass, name, tooltip) {
    var button = $('<div class="messageTypeButton ' + messageTypeClass + '" name="' + name + '"></div>').appendTo(container);
    var overlay = $("<div class='iconOverlay'></div>").appendTo(button);
    new Opentip(button[0], tooltip.TEXT, tooltip.TITLE);
    button.click(onMessageTypeClicked);
  };

  //----------------------------------------------------------------------------
  function onMessageTypeClicked(event) {
    event.stopPropagation(); // The mouse click has been handled
    var messageType = MessageType.FLEXIBLE;
    switch ($(this).attr('name')) {
      case 'negative':
        messageType = MessageType.NEGATIVE;
        break;
      case 'flexible':
        messageType = MessageType.FLEXIBLE;
        break;
      case 'positive':
        messageType = MessageType.POSITIVE;
        break;
    }
    setMessageType(messageType);
    $(document).trigger('MessageTypeClicked');
  }

  create(p_parentElement, p_pos);
}
