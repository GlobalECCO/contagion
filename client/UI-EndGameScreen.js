/*******************************************************************************
 *
 ******************************************************************************/
function EndGameScreen (rootElement, gameState) {
  'use strict';

  var self = this;
  var root = rootElement;
  var endgameDiv = '<div class="endGameScreen"><div class="endGamePopUp"><div class="gameOver">GAME OVER</div></div></div>';
  var winnerDiv = '<div class="winnerContainer"></div>';

  root.append($(endgameDiv));

  for (var p = 0; p < gameState.winningPlayers.length; p++) {
    var currWinnerDiv = $(winnerDiv);
    var currWinningPlayer = gameState.players[gameState.winningPlayers[p]];
    
    currWinnerDiv.append('<div class="winnerText">WINNER</div>');
    currWinnerDiv.append('<div class="winnerIcon ideologyType' + currWinningPlayer.ideologyType.toString() + '" style="background-color: ' + currWinningPlayer.color + '"></div>');
    currWinnerDiv.append('<div class="winnerIdeologyName">' + currWinningPlayer.ideologyName + '</div>');
    currWinnerDiv.append('<div class="winnerUserID">' + currWinningPlayer.id + '</div>');
    
    root.children('.endGameScreen').children('.endGamePopUp').append(currWinnerDiv);
    root.children('.endGameScreen').children('.endGamePopUp').click(function () {
      root.children('.endGameScreen').remove();
    });
  }

  //----------------------------------------------------------------------------
  this.show = function () {
    $('.endGameScreen').show();
  };

  //----------------------------------------------------------------------------
  this.hide = function () {
    $('.endGameScreen').hide();
  };
}