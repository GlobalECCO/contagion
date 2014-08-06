/*******************************************************************************
 * Liason between server messages and client side game logic
 ******************************************************************************/
var gameController = new GameController(sendPlayerSetupData, sendGameData);

//------------------------------------------------------------------------------
window.onload = function() {
  GID = null;
  USER = null;

  // Query the server for our current game and user ids.
  // This also starts the game and begins the main update loop.
  retrieveGameData();

  WAITING_FOR_SETUP = false; ///<Is this player waiting for others to finish setup?
  WAITING_FOR_SETUP_SUBMISSION = false;
  WAITING_FOR_OTHERS = false; ///<Is this player waiting for others to make their turn?
  CHECK_FOR_PLAYER_TURNS_TIME = 2000; ///<ms to wait for player turn polling
  CHECK_FOR_CHATS_TIME = 500; ///<ms to wait for player turn polling
};

//------------------------------------------------------------------------------
function retrieveGameData() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      var gameData = JSON.parse(xmlhttp.responseText);

      GID = gameData.gid;
      USER = gameData.user;
      console.log('Game data - ID: ' + GID + ' User: '+USER);

      refreshGameData(function() {
        gameController.initializeChat();
        refreshChat(true);
      });
    }
  };

  xmlhttp.open("GET", "sessionData?rand=" + parseInt(Math.random() * 99999999, 10), true);
  xmlhttp.send();
}

//------------------------------------------------------------------------------
//Send the gid, user, action list to the server
function sendGameData() {
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      //our data was sent correctly
      WAITING_FOR_OTHERS = true;
    }
  };

  xmlhttp.open("POST", "push", true);
  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  var parameters = "gid=" + GID + "&user=" + USER;
  parameters += "&actions=" + gameController.getTurnActionsString();
  xmlhttp.send(parameters);
}

//------------------------------------------------------------------------------
function sendChat(message, onSendSuccess, onSendFail) {
  $.ajax({
    url: 'pushChat?gid=' + GID + '&user=' + USER + '&text=' + message,
    type: 'POST',
    success: function() {
      // force poll for the latest chat since we just added some
      refreshChat(false);
      onSendSuccess && onSendSuccess();
    },
    error: onSendFail
  });
}

//------------------------------------------------------------------------------
function sendPlayerSetupData(setupData, setupResultCB) {
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4) {

      if (xmlhttp.status === 200) {
        if (gameController.getNumberPlayerRequiringSetup() === 0) {
          refreshGameData();
        }
        else {
          WAITING_FOR_SETUP = true;
        }
        setupResultCB && setupResultCB(true);
      } else if (xmlhttp.status === 400) {
        refreshGameData(function() {
          setupResultCB && setupResultCB(false, xmlhttp.responseText);
        });
      }

      // received reply from server, we will now accept a request to send again if necessary
      WAITING_FOR_SETUP_SUBMISSION = false;
    }
  };

  if (!WAITING_FOR_SETUP_SUBMISSION) {
    xmlhttp.open("POST", "pushPlayerSetup", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var parameters = "gid=" + GID + "&user=" + USER;
    parameters += "&ideologyName=" + setupData.ideologyName;
    parameters += "&ideologyType=" + setupData.ideologyType;
    parameters += "&color=" + setupData.color;
    xmlhttp.send(parameters);

    WAITING_FOR_SETUP_SUBMISSION = true;
  }
}

//------------------------------------------------------------------------------
function findPlayer(userID, playerJSON) {
  for (var playerIndex = 0; playerIndex < playerJSON.players.length; ++playerIndex) {
    if (playerJSON.players[playerIndex].id === userID) {
      return playerJSON.players[playerIndex];
    }
  }

  return {};
}

//------------------------------------------------------------------------------
// Do a request for grabbing all the player data. Use this data to see if
// we need to do a full game state pull request.
// This allows for the players to stay logged into the gamepage and have it
// automatically update when all the other players have submitted turns.
function refreshPlay() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {

      var playerData = JSON.parse(xmlhttp.responseText);
      gameController.updatePlayerList(playerData);
      var playerObj = findPlayer(USER, playerData);

      // NOTE!!! Careful with refreshGameData and the setTimeout.  refreshGameData will
      // cause refreshPlay to get called again and we don't want to set another timeout.

      // If we're in the setup part of the game and all players have set
      // themselves up, then refresh the game state
      if (gameController.isGameSetup() && gameController.getNumberPlayerRequiringSetup() === 0 && WAITING_FOR_SETUP) {
        WAITING_FOR_SETUP = false;
        refreshGameData(function() { gameController.initializeChat(); });
        return;
      }

      // If we haven't submitted our turn and are we're also waiting for others,
      // then that's our clue it's time to refresh the game state.
      if (playerObj.hasTakenTurn === false && WAITING_FOR_OTHERS) {
        WAITING_FOR_OTHERS = false;
        refreshGameData();
        return;
      }

      if (!gameController.isEndOfGame()) {
        //reset the timer to continue getting new player data
        setTimeout(refreshPlay, CHECK_FOR_PLAYER_TURNS_TIME);
      }
    }
  };

  xmlhttp.open("GET", "playerData?gid=" + GID + "&rand=" + parseInt(Math.random() * 99999999, 10), true);
  xmlhttp.send();
}

//------------------------------------------------------------------------------
function refreshChat(shouldRefreshAutomatically) {
  $.ajax({
    url: 'pullChat?gid=' + GID,
    type: 'POST',
    success: function(data) {
      gameController.updateChat(data);
    },
    error: function(er) {
      console.log('Failed to pull chat data.');
    }
  });

  if (shouldRefreshAutomatically) {
    setTimeout(function() { refreshChat(true) }, CHECK_FOR_CHATS_TIME);
  }
}

//------------------------------------------------------------------------------
function refreshGameData(refreshCompleteCB) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      var playerData = JSON.parse(xmlhttp.responseText);
      gameController.setNewGameState(playerData, USER);
      var playerObj = findPlayer(USER, playerData);
      WAITING_FOR_OTHERS = playerObj.hasTakenTurn;

      if (xmlhttp.status === 400) {
        alert("This game has been removed, redirecting back to lobby.");
        window.location = "/";
      }

      refreshCompleteCB && refreshCompleteCB();

      //now see about getting the other player's data...
      refreshPlay();
    }
  };

  xmlhttp.open("GET", "pull?gid=" + GID + "&rand=" + parseInt(Math.random() * 99999999, 10), true);
  xmlhttp.send();
}
