/*******************************************************************************
 * Handles server requests from clients and EGS
 ******************************************************************************/
var gameController = require('./gameLogic/game.js');
var database = require('./database.js');
var db = database.getGameModel();
var history = database.getHistoryModel();
var chat = database.getChatModel();
var auth = require('./Authenticate.js');
var log = require('./log').log;
var Config = require('./config').GameConfig;
var inDebugMode = false;

module.exports = {
  handleDelete    : handleDelete,
  handlePull      : handlePull,
  handlePush      : handlePush,
  canPlay         : canPlay,
  play            : play,
  pushPlayerSetup : pushPlayerSetup,
  gameList        : gameList,
  sessionData     : sessionData,
  newGame         : newGame,
  pushChat        : pushChat,
  pullChat        : pullChat
};

//------------------------------------------------------------------------------
// Delete the game from the database
// delete?gid=<the game id>
function handleDelete(request, response) {
  if (request.param('gid')) {
    var gid = request.param('gid');

    db.findByIdAndRemove(gid, function(err, gameFound) {
      if (err) {
        response.send('Error: Could not find game to remove:'+gid);
        return;
      }

      if (gameFound) {
        history.findOneAndRemove({gameID: gid}, function(err, found){
          if (!found) {
            log.error("Can't remove the game's history : " + gid);
          }
        });

        chat.findOneAndRemove({gameID: gid}, function(err, found){
          if (!found) {
            log.error("Can't remove the game's chat : " + gid);
          }
        });

        log.info('Removed the game:' + gid);
        if (request.session.gid === gid) {
          request.session.gid = undefined;
        }
        response.redirect('/');
      }
    });
  }
}

//------------------------------------------------------------------------------
// Send the entire game state back to the client.
// @note /pull?gid=<game id>
// @param gid The Game ID
function handlePull(request, response) {
  if (request.param('gid')) {
    db.findById(request.param('gid'), '', { lean: true }, function (err, gameFound) {

      if (err) {
        response.send(400, 'Error finding the game');
      }
      else if (gameFound) {
        history.findOne({gameID:request.param('gid')},
                       'turnList',
                       {lean:true},
                       function (err, historyFound) {
          //copy the game history into the gameFound object
          gameFound.turnList = historyFound.turnList;

          //Send back the game data to the client to render
          response.send(gameFound);

        });
      }
      else {
         response.send(400, 'Error finding the game');
      }
    });
  }
  else {
    response.send(400, 'No valid GID provided');
  }
}

//-----------------------------------------------------------------------------
function setThePlayersActions(gid, id, actions, gameFound) {
  // Find the player, mark their turn as taken, and store their actions
  for (var playerIdx = 0; playerIdx < gameFound.players.length; playerIdx++) {

    if (gameFound.players[playerIdx].id === id) {

      //this player submitted their turn
      if (!gameFound.players[playerIdx].hasTakenTurn) {
        log.debug('Player ' + id + ' placed a turn for game ' + gid);

        gameFound.players[playerIdx].hasTakenTurn = true;
        gameFound.players[playerIdx].actions = actions;
      }
      else {
        log.warn('Player: ' + id + ' tried to submit another turn (already has one recorded) for game ' + gid);
      }
      break;
    }
  }
}

//-------------------------------------------------------------------------------
function saveTheHistory(gid, gameFound, callback) {
  //store the game state and player state in the history table.
  history.findOne({ gameID: gid }, function (erro, found) {
    if (found) {

      var historyItem = [];
      for (var p = 0; p < gameFound.players.length; ++p) {
        historyItem.push(gameFound.players[p].actions);
      }

      //turnHistorySchema
      var entry = {
        currentTurnIndex : gameFound.currentTurnIndex,
        countries: gameFound.countries,
        players: gameFound.players,
        phase: gameFound.phase,
        playerHistory: historyItem
      };

      found.turnList.push(entry);

      log.debug('saving history for game ' + gid);
      found.save(function (err) {
        if (err) {
          log.error("Failed to save new history: " + err);
        }

        callback();

      });

    }//if history document found


  }); //history find
}

//------------------------------------------------------------------------------
function saveTheGameState(gameFound) {
  //save the game model changes to the database
  log.debug('saving game state for game ' + gameFound._id);
  gameFound.save(function (err) {
    if (err) {
      log.error('failed to save new data: ' + err);
    }
  });

  if (!inDebugMode) {
    // Send an updated game status to the EGS server.
    database.getRPC(function (rpcIndex) {
      auth.sendEGSUpdate(rpcIndex, gameFound);
    });
  }
}

//------------------------------------------------------------------------------
// Handle the player's pushing of data to the server.
// @param gid The Game ID
// @param user The user's ID who's submitting their turn actions
// @param actions The list of encoded actions
// @note "/push?gid=<gid>&user=<user id>&actions=<action list>
function handlePush(request, response) {
  if (!request.body.hasOwnProperty('gid') ||
    !request.body.hasOwnProperty('user') ||
    !request.body.hasOwnProperty('actions')) {
     response.send(400, 'Incorrect parameters for /push');
     return;
  }
  var gid = request.body.gid;

  db.findOne({_id: gid}, function(err, gameFound) {
    if (err) {
      response.send(400, 'Cound not find the requested game');
      return;
    }
    else if (gameFound) {
      setThePlayersActions(gid, request.body.user, request.body.actions, gameFound);

      //See if all players have submitted their turn and update the game state
      if (gameFound.allPlayersSubmitted()) {
        log.debug('All players have submitted their turns for game ' + gid);

        //save the game state for historical purposes
        saveTheHistory(gid, gameFound, function () {
          gameController.updateGameState(gameFound);

          //reset the player turns
          gameFound.resetPlayerTurns();

          //save the new game state to the database
          saveTheGameState(gameFound);
        });
      }
      else {
        //save the new game state to the database
        saveTheGameState(gameFound);
      }

      response.send('success');

    }//if game found
    else {
      log.warn('did not find the game');
      response.send(400, 'Cound not find the requested game');
    }
  });
}

//------------------------------------------------------------------------------
// A query to check if the player can play this game
// @param gid The game id
// @return The JSON string of player array
// @note /canPlay?gid=<game id>
function canPlay(request, response) {
  if (request.param('gid')) {

    var gid = request.param('gid');
    var playerFields = 'players.hasTakenTurn players.name players.id players.ideologyName players.ideologyType players.color';

    db.findById(gid, playerFields, {lean:true}, function(err, gameFound) {
      if (err)
      {
        response.send(400,"Can't find game:" + gid);
      }
      else if (gameFound)
      {
        response.send(gameFound);
      }
    });
  }
  else {
    response.send(400,"Incorrect query parameters");
    return;
  }
}

//------------------------------------------------------------------------------
function pushPlayerSetup(request, response) {

  if (!request.body.hasOwnProperty('gid') ||
      !request.body.hasOwnProperty('user') ||
      !request.body.hasOwnProperty('ideologyName') ||
      !request.body.hasOwnProperty('ideologyType') ||
      !request.body.hasOwnProperty('color')) {
       response.send(400, 'Incorrect parameters for /push');
       return;
  }

  // Find the game
  db.findOne({_id: request.body.gid}, function(err, gameFound) {

    var matchingPlayerIndex = -1;

    // Find the player
    if (!err && gameFound) {
      for (var playerIdx = 0; playerIdx < gameFound.players.length; ++playerIdx) {
        if (gameFound.players[playerIdx].id === request.body.user) {
            matchingPlayerIndex = playerIdx;
        }
      }
    }

    // Update the player
    if (matchingPlayerIndex != -1) {

      var macthingPlayer = gameFound.players[matchingPlayerIndex];
      var i;

      // Make sure the chosen color is available
      if (hasColorBeenSelected(gameFound, request.body.color)) {
        response.send(400, 'Color not available: ' + request.body.color);
        return;
      }

      var theState = { value: 0 };
      var requestedIdeology = parseInt(request.body.ideologyType, 10);

      // Make sure 1 person chooses the state
      if (hasIdeologyTypeBeenSelected(gameFound, theState.value)) {
        if (requestedIdeology === theState.value) {
          response.send(400, 'Ideology type not available: "' + Config.ideologyTypeList[requestedIdeology] + '"');
          return;
        }
      } else if (getNumberOfPlayersAlreadySetup(gameFound) >= gameFound.players.length - 1) {
        // Remaining player must pick the state
        if (Config.ideologyTypeList[requestedIdeology] !== 'State') {
          response.send(400, 'Other player has chosen the opposition, you must pick the State');
          return;
        }
      }

      macthingPlayer.ideologyName = request.body.ideologyName;
      macthingPlayer.ideologyType = request.body.ideologyType;
      macthingPlayer.color = request.body.color;

      // Check to see if everyone has set themselves up
      if (gameFound.allPlayersSetup()) {
        gameController.populateStartingLoyalty(gameFound);
        gameController.updateGameState(gameFound);
      }

      gameFound.save();

      if (!inDebugMode) {
        // Send an updated game status to the EGS server.
        database.getRPC(function (rpcIndex) {
          auth.sendEGSUpdate(rpcIndex, gameFound);
        });
      }

      response.send('success');

    } else {
      response.send(400, 'Cannot find the player: ' + request.body.user);
    }
  });

}

//------------------------------------------------------------------------------
// Start the game play, using the supplied params.
// @param username : The player's nickname for this game
// @param gid : The Game ID
// @param request : The clients request object
// @param response: The responce object to the client
function startGame(username, gid, request, response) {
   //see if request.param('gid') exists in the database
  db.findOne({_id: gid}, function(err, gameFound) {
    if (err) {
      log.warn ('Did not find the requested game: '+gid);
      response.send(400, 'The requested game was not found: '+ gid);
      return;
    }

    if (gameFound) {
      // Determine the user can play the game or just view.
      var canPlay = false;

      for (var playerIndex = 0; playerIndex < gameFound.players.length; ++playerIndex) {
        if (username == gameFound.players[playerIndex].name) {
          canPlay = true;
          break;
        }
      }

      if (canPlay) {
        request.session.gid  = gid;
        request.session.user = username;

        log.info ('Player ' + username + ' is joining game: ' + gid);

        response.sendfile("gamepage.html");
      }
      else {
        response.send(400, 'You are not a player in this game');
      }
    }
    else {
      response.send(400, "Game not found.");
    }
  });
}

//------------------------------------------------------------------------------
// Handle the request to play in developer/debug mode. This does not use
// the CAS system for authentication.
function handleDebugPlay(request, response, gid) {
  //kick out with an error if params aren't correct
  if (!request.param('user')) {
    response.send(400, 'user parameter not supplied');
    return;
  }

  var gameFound = null;
  var user = request.param('user');

  startGame(user, gid, request, response);
}

//------------------------------------------------------------------------------
// Request to play an existing game.
// @param gid The game id
// @param user The user's id
// @param dbg Optional. If we're in debug/developer mode
// @returns Success will return the gamepage.html file
// @note /play?gid=<game id>&user=<user id>[&dbg=1]
function play(request, response) {
  inDebugMode = false;

  if (request.param('dbg') === '1') { inDebugMode = true; }

  if (!request.param('gid')) {
    response.send(400, 'gid parameter not supplied');
    return;
  }

  var gid = request.param('gid');

  if (inDebugMode) {
    handleDebugPlay(request, response, gid);
  }
  else {
    auth.authenticate_with_cas(request, response, function(cas_handle) {
      log.info(cas_handle + " logged in!");

      auth.getPlayerProfile(cas_handle, gid, function(error, profile) {
        if (error) {
          response.send(400, error);
          return;
        }

        if (!profile) {
          response.send(400, "Unable to retrieve player profile.");
          return;
        }

        //the player profile is valid (gamingID is the player's nickname)
        startGame(profile.gamingId, gid, request, response);
      });
    });
  }
}

//------------------------------------------------------------------------------
// A client request for listing existing games
// @return an HTMl <ul> of links to games
function gameList(request, response) {
  db.find(null, 'players', function (err, games) {
    if (err) {
      response.send(500, 'Error reading database');
    }

    var numGames = games.length;
    var toSend = "<ul>";
    for (var game=0; game<numGames; game++) {
      toSend += "<li>";
      toSend += "<a href=\"javascript:void(0)\" onclick=\"playGame('" + games[game]._id.toString() + "')\">" + games[game]._id.toString() + " (";
      for (var player=0; player<games[game].players.length; ++player) {
        toSend += "User" + (player + 1) + "=";
        toSend += games[game].players[player].name;
        if (!games[game].players[player].hasTakenTurn) {
          toSend += ":Waiting";
        }
        else {
          toSend += ":Done";
        }

        if (player < games[game].players.length - 1) {
          toSend += ", ";
        }
      }
      toSend += ')</a>';
      toSend += "  <a href=delete?gid="+games[game]._id.toString()+">(Trash)</a>";
// ebr 8/22
      toSend += '</li>';
    }
    toSend += "</ul>";

    response.send(toSend);
  });
}

//------------------------------------------------------------------------------
// Retrieves our currently sessioned game and user ID
function sessionData(request, response) {
  if (request.session.gid === undefined) {
    log.error("Session GID invalid.");
    response.send(400, "No game session started.");
  }
  else if (request.session.user === undefined) {
    log.error("Session USER invalid.");
    response.send(400, "No user session started.");
  }
  else {
    response.send({'gid':request.session.gid, 'user':request.session.user});
  }
}

//------------------------------------------------------------------------------
// Generates a new game.
// Query string parameters:
// @param user#   - User id of all players playing this game. (replace # with (1..x))
// @returns JSON string containing information about the new game. Per EGS API.
function newGame(request, response) {
  var playerList = [];
  var numPlayers = 0;

  for (numPlayers = 0; request.param("user"+(numPlayers+1)); ++numPlayers) {
    var playerId = request.param("user"+(numPlayers+1));
    playerList.push({name: playerId, id: playerId, hasTakenTurn: false, action: null});
  }

  if (playerList.length < 2 ) {
    response.send(400, {"stat":"FAIL", "msg":"not enough users supplied to create a game"});
    return;
  }

  var myGame = new db({
    players:playerList,
    playerColors:Config.playerColorList,
    ideologyTypes: Config.ideologyTypeList,
  });

  myGame.pickMap();
  var mapURL = './client/maps/' + myGame.map;
  var fs = require('fs');
  fs.readFile(mapURL, 'utf8', function (err, mapData) {
    if (err) {
      console.log(err);
    }
    gameController.initializeNewGame(myGame, mapData, playerList.length);

    myGame.save(function(err) {
      if (err) {
        log.error('failed insert database entry for new game.');
        response.send({"stat":"FAIL", "msg":"failed insert database entry for new game"});
        return;
      }
    });

    var gameHistory = new history({
      turnList: [],
      gameID: myGame._id
    });

    gameHistory.save(function (err) {
      if (err) {
        log.error('Failed to save new history for new game.');
        response.send({ "stat": "FAIL", "msg": "Failed to save new history for new game" });
        return;
      }
    });

    var gameChat = new chat({
      gameID: myGame._id,
      entries: [],
    });

    gameChat.save(function (err) {
      if (err) {
        log.error('Failed to save new chat for new game.');
        response.send({ "stat": "FAIL", "msg": "Failed to save new chat for new game" });
        return;
      }
    });

    log.info("Created new game with id " + myGame._id.toString());

    //send back JSON string, according to EGS (Ecco Game Server) rules
    var gameJSON = {
      "stat": "OK",
      "glst": {
        "cnt" : "1",
        "game": {
          "gid": myGame._id.toString()
        }
      },
      "update":[]
    };

    // Can't send this update until the lobby has received and
    // processed the response.

    // Send an updated game status to the EGS server.
    // database.getRPC(function (rpcIndex) {
    //   auth.sendEGSUpdate(rpcIndex, myGame);
    // });


    // so instead, include the update in the response.

    auth.buildPlayerUpdates(gameJSON.update, myGame);

    response.send(gameJSON);
  });
}

//------------------------------------------------------------------------------
function hasColorBeenSelected(game, color) {
  var colorSelected = false;

  // Verify that the requested color isn't already in use
  for (i = 0; i < game.players.length; ++i) {
    if (game.players[i].color === color) {
      colorSelected = true;
      break;
    }
  }

  return colorSelected;
}

//------------------------------------------------------------------------------
function hasIdeologyTypeBeenSelected(game, type) {
  var typeSelected = false;
  var intType = parseInt(type, 10);

  // Verify that the requested color isn't already in use
  for (i = 0; i < game.players.length; ++i) {
    if (game.players[i].ideologyType === intType) {
      typeSelected = true;
      break;
    }
  }

  return typeSelected;
}

//------------------------------------------------------------------------------
function getNumberOfPlayersAlreadySetup(game) {
  var numberOfPlayers = 0;

  for (i = 0; i < game.players.length; ++i) {
    if (game.players[i].ideologyType !== -1) {
      ++numberOfPlayers;
    }
  }

  return numberOfPlayers;
}

//------------------------------------------------------------------------------
function pushChat(request, response) {

  var gid = request.param('gid');
  var user = request.param('user');
  var text = request.param('text');

  if (!gid || !user || !text) {
     response.send(400, 'Incorrect parameters for /pushChat');
     return;
  }

  chat.findOne({ gameID: gid }, function (error, found) {
    if (error) {
      response.send(500, 'Error reading database for chat');
    }

    if (found) {
      var entry = {
        name : user,
        text : text
      };

      found.entries.push(entry);

      log.debug('saving chat for game ' + gid);
      found.save(function (err) {
        if (err) {
          log.error("Failed to save new chat entry: " + err);
        }
      });

      response.send('success');
    }
    else {
      log.error('Game not found: ' + gid);
      response.send(400, 'Game could not be found');
    }
  });
}

//------------------------------------------------------------------------------
function pullChat(request, response) {
  var gid = request.param('gid');

  if (!gid) {
     response.send(400, 'Incorrect parameters for /pushChat');
     return;
  }

  chat.findOne({ gameID: gid }, function (error, found) {
    if (error) {
      response.send(500, 'Error reading database for chat');
    }

    if (found) {
      response.send(found.entries);
    }
    else {
      log.error('Game not found: ' + gid);
      response.send(400, 'Game could not be found');
    }
  });
}
