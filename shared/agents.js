/*******************************************************************************
 * Object data that represents an Agent a player has in a country
 ******************************************************************************/
//------------------------------------------------------------------------------
// An enum representing possible message types an Agent can have
this.MessageType = {
  INVALID: -1,
  NEGATIVE: 0,
  POSITIVE: 1,
  FLEXIBLE: 2,
  TYPE_COUNT: function() {
    var typeCount = -2; // Don't count the INVALID or TYPE_COUNT properties
    for (var type in this) {
      if (this.hasOwnProperty(type)) {
        ++typeCount;
      }
    }
    return typeCount;
  }
}

//------------------------------------------------------------------------------
// The actual Agent object
this.Agent = function(messageType, target) {
  this.messageType = messageType;
  this.target = target;
}
