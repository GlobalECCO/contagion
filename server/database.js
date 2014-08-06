/*******************************************************************************
 * Defines structure and helper functions for the game's state
 ******************************************************************************/
var BalanceValues = require('../shared/balanceValues.js').BalanceValues;
var GamePhase = require('../shared/gamePhase.js').GamePhase;
var mongoose = require('mongoose');
var log = require('./log').log;

//exports = module.exports = nano = function() {return gameModel};
module.exports = {
  getGameModel: getGameModel,
  getRPC: getRPC,
  getHistoryModel: getHistoryModel,
  getChatModel: getChatModel
};

var mongoURL = process.env.MONGO_URL || 'mongodb://localhost/TestGameServer';
mongoose.connect(mongoURL);

var Schema = mongoose.Schema;

var agentSchema = new Schema({
  messageType     :{type: Number, default: 2},
  target          :{type: Number, default: -1}
});

var playerSchema = new Schema({
  name            :{type: String,  default: null},
  id              :{type: String,  default: null},
  color           :{type: String,  default: '#ffffff'},
  ideologyName    :{type: String,  default: null},
  ideologyType    :{type: Number,  default: -1},

  hasTakenTurn    :{type: Boolean, default: true},
  actions         :{type: String,  default: ''},

  resources       :{type: Number,  default: BalanceValues.STARTING_RESOURCES},
  disabledAgents  :[agentSchema],
  usedDesperation :{type: Boolean, default: false}
});

var territorySchema = new Schema({
  loyalToWhom     :{type: Number, default: -1},
  currentLoyalty  :{type: Number, default: 0},
  maxLoyalty      :{type: Number, default: BalanceValues.TERRITORY_MAX_LOYALTY},
});

var countrySchema = new Schema({
  territories    :[territorySchema],
  agents         :[Schema.Types.Mixed]
});

var historySchema = new Schema({
  players        :[{type: String, default: null}]
});

var gameSchema = new Schema({
  map              :{type: String, default: 'map01.svg'},
  phase            :{type: String, default: GamePhase.SETUP},
  players          :[playerSchema],
  playerColors     :[String],
  ideologyTypes    :[String],
  countries        :[countrySchema],
  currentTurnIndex :{type: Number, default: 0}, ///<the turn counter
  winningPlayers   :[String]
});

var chatSchema = new Schema({
  name : {type: String, default: null},
  text : {type: String, default: null}
});

//------------------------------------------------------------------------------
// Pick a map for this game to take place on
gameSchema.methods.pickMap = function() {
  var maps = ['map01.svg', 'map02.svg', 'map03.svg'];
  var mapIndex = Math.floor(Math.random() * maps.length);
  //var mapIndex = 2;
  this.map = maps[mapIndex];
}

//------------------------------------------------------------------------------
// Have all the players set themselves up in this Game?
gameSchema.methods.allPlayersSetup = function() {
  for (var p = 0; p < this.players.length; ++p) {
    if (this.players[p].ideologyType === -1) {
      return false;
    }
  }
  return true;
}

//------------------------------------------------------------------------------
// Have all the players submitted a turn in this Game?
gameSchema.methods.allPlayersSubmitted = function() {
  for (var p = 0; p < this.players.length; ++p) {
    if (!this.players[p].hasTakenTurn) {
      return false;
    }
  }
  return true;
};

//------------------------------------------------------------------------------
// Reset all the players in the game for a new turn
gameSchema.methods.resetPlayerTurns = function() {
  for (var p=0; p<this.players.length; p++) {
    this.players[p].hasTakenTurn = false;
    this.players[p].actions = "";
  }
};

//------------------------------------------------------------------------------
// Reset all the players in the game for a new turn
gameSchema.methods.getPlayerActions = function() {
  var actionParser = require('../shared/actionParser.js');
  var playerActions = [];
  for (var p = 0; p < this.players.length; ++p) {
    if (this.players[p].hasTakenTurn) {
      playerActions = playerActions.concat(actionParser.parseActionString(this.players[p].actions, p));
    }
  }
  return playerActions;
};

var gameModel = mongoose.model('GameModel', gameSchema);
if (!gameModel) {
  log.error("Failed to create database model");
}

function getGameModel() {
  return gameModel;
}

//------------------------------------------------------------------------------
var rpcSchema = new Schema({
  rpcIndex: {type: Number, default: 0}
});

//------------------------------------------------------------------------------
var rpcModel = mongoose.model('RPCModel', rpcSchema);
if (!rpcModel) {
  log.error("Failed to create RPC model");
} else {
  rpcModel.count({}, function(err, count) {
    if (count < 1) {
      var row = new rpcModel({});
      row.save(function(err) {
        if (err) {
          log.error('failed to insert database entry for rpcIndex.');
          return;
        }
      });
    }
  });
}

//------------------------------------------------------------------------------
// Retrieves a new RPC index and passes it into
// the callback 'cb'.
function getRPC(cb) {
  rpcModel.findOneAndUpdate({}, {$inc: {rpcIndex: 1}}, {upsert: true}, function(err, rpcFound) {
    if (err) {
      log.error("Failed to find the rpc index.");
    }

    if (rpcFound) {
      cb(rpcFound.rpcIndex);
    }
  });
}

//------------------------------------------------------------------------------
// The game and player state for this game's particular turn
var turnHistorySchema = new Schema({
  currentTurnIndex: { type: Number, default: 0 }, ///<the turn counter
  countries: [countrySchema], ///<array of country data
  players: [playerSchema], ///<array of players' data
  phase: { type: String, default: GamePhase.SETUP }, ///<the game phase
  playerHistory: [{ type: String, default: null }] ///<array of players' history
});

//------------------------------------------------------------------------------
// Game history
//
var gameHistorySchema = new Schema({
  turnList: [turnHistorySchema], ///<array of game history for each turn
  gameID: { type: mongoose.Schema.Types.ObjectId } ///<the ID of this particular game
});

var historyModel = mongoose.model("HistoryModel", gameHistorySchema);
if (!historyModel) {
  log.error("Failed to create history model");
}

//------------------------------------------------------------------------------
function getHistoryModel() {
  return historyModel;
}

//------------------------------------------------------------------------------
// Chat
var gameChatSchema = new Schema({
  gameID: { type: mongoose.Schema.Types.ObjectId },
  entries : [chatSchema]
});

var chatModel = mongoose.model("ChatModel", gameChatSchema);
if (!chatModel) {
  log.error("Failed to create the chat model");
}

//------------------------------------------------------------------------------
function getChatModel() {
  return chatModel;
}
