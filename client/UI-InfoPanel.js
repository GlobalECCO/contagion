/*******************************************************************************
 * UI element for a line of information text displayed at the top of the screen
 ******************************************************************************/
function InfoPanel(p_rootDiv, showingAtStart, startingText) {
  'use strict';
  var rootDiv = p_rootDiv;
  var text = startingText;
  var isShowing = showingAtStart;
  var playerContainers = [];

  rootDiv.append('<div class="infoPanelContainer"></div>');
  $('.infoPanelContainer').append('<div class="infoPanelUserList"></div>');
  $('.infoPanelContainer').append('<div class="infoPanelText"></div>');

  if (!showingAtStart) {
    $('.infoPanelContainer').hide();
  }

  //----------------------------------------------------------------------------
  // Updates text inside info panel
  this.updateText = function(p_text) {
    text = p_text;
    $('.infoPanelText').text(text);

    return this;
  };

  //----------------------------------------------------------------------------
  this.show = function() {
    //console.log("show function...");
    if (isShowing === false) {
      //console.log("isShowing false");
      isShowing = true;
      //$('.infoPanelContainer').show();
      $('.infoPanelContainer').slideDown('slow', function() {});
    }
  };

  //----------------------------------------------------------------------------
  this.hide = function() {
    //console.log("hide function...");
    if (isShowing === true) {
      //console.log("isShowing true");
      isShowing = false;
      $('.infoPanelContainer').slideUp('slow', function() {});
    }
  };

  //----------------------------------------------------------------------------
  this.isVisible = function () {
    return isShowing;
  };

  //----------------------------------------------------------------------------
  //This gets called periodically, so let's be efficient with what we do here
  this.updatePlayerStatus = function (userList, ideologyList) {
    var userContainerWidth, currUser, $icon, i, playerIndex;

    // I use the next line for testing. change || to && to test with four players
    userList = userList || [{name: "Bill", ideologyType: "Billions", color: "#FF0000", hasTakenTurn: false},{name: "Will", ideologyType: "Willions", color: "#00FF00", hasTakenTurn: true},{name: "Jill", ideologyType: "Jillions", color: "#0000FF", hasTakenTurn: false},{name: "Mill", ideologyType: "Millions", color: "#FFFF00", hasTakenTurn: true}];

    // The player containers need to stay around, so only build them once
    if (playerContainers.length === 0) {
      userContainerWidth = ((100/userList.length) - Math.floor((100/userList.length) * 0.1));
      for (i = 0; i < userList.length; i++) {
        currUser = $('<div class="infoPanelUserContainer" style="width: ' + userContainerWidth.toString() + '%"></div>');
        currUser.prepend('<div class="infoPanelUserName"></div>');
        currUser.prepend('<div class="infoPanelUserIcon"></div>');
        $('.infoPanelUserList').append(currUser);
        currUser.children('.infoPanelUserName').html(userList[i].name);
        playerContainers.push(currUser);
      }
    }

    // Modify the contents of the containers with potentially new player status info
    for (playerIndex = 0; playerIndex < playerContainers.length; ++playerIndex) {
      currUser = playerContainers[playerIndex];

      $icon = currUser.children('.infoPanelUserIcon');

      //if the player has an ideology type now, but no icon displayed, add one
      if (userList[playerIndex].ideologyType !== -1 &&
         !$icon.hasClass('ideologyType' + userList[playerIndex].ideologyType))
      {
        $icon.addClass('ideologyType' + userList[playerIndex].ideologyType);
      }

      // Update the player's chosen color
      $icon.css('background-color', userList[playerIndex].color);

      // dynamically create custom styles for the current players
      var infoPanelPlayerReady = 'infoPanelUser' + playerIndex.toString() + 'ready';

      //indicate if this player has submitted their turn yet
      $(currUser).toggleClass(infoPanelPlayerReady,
                              userList[playerIndex].hasTakenTurn,
                              1000,
                              "easeInOutElastic");
    }
  };

  //----------------------------------------------------------------------------
  //Undo the player status changes made due to the tutorial
  this.cleanupPlayerStatusFromTutorial = function (userList, ideologyList) {
    for (var playerIndex = 0; playerIndex < playerContainers.length; ++playerIndex) {
      playerContainers[playerIndex].remove();
    }
    playerContainers = [];
  };

  this.updateText(text);
}
