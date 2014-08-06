/*******************************************************************************
 * GameStatus - The container of the items that display parts of the game status
 ******************************************************************************/
GameStatus.prototype = new ContainerList();
GameStatus.prototype.constructor = GameStatus;
function GameStatus(pageRoot, listClass, toggleStatusCB) {
  'use strict';
  ContainerList.apply(this, [pageRoot, listClass]);

  var containerStyleControls = {
    container: "actionListSubmitContainer",
    topBar: "submitTopBar",
    title: "actionListHeaderText"
  };

  this.showScoreboard = true;

  var self = this;
  var toggleContainer = self.addContainer('CONTROLS', containerStyleControls);
  var toggleButton = toggleContainer.addButton('gameStatusToggleStatus', function () { toggleContainers(); }, 'Show Previous Actions');
  var toggleStatus = toggleStatusCB;

  // ---------------------------------------------------------------------------
  var toggleContainers = function () {
    self.showScoreboard = !self.showScoreboard;
    toggleStatus(self.showScoreboard);
    if (self.showScoreboard) { // show scoreboard, hide previous actions
      toggleContainer.setButtonText('Show Previous Actions');
    }
    else { // show previous actions, hide scoreboard
      toggleContainer.setButtonText('Show Scoreboard');
    }
  };
}