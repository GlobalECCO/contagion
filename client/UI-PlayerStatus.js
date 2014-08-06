
/*******************************************************************************
 * Scoreboard - A container of all player statistics
 ******************************************************************************/
function Scoreboard(pageRoot, callbacks) {
  'use strict';
  this.root = $('<div class="scoreboard" id="thewholescoreboard">');

  var self = this;
  var $countryRows = [];

  pageRoot.append(this.root);
  $(self.root).append("<div class='scoreboardContainer' id='scoreboardContainer'></div>");
  $('#scoreboardContainer').append("<div class='scoreboardTopBar'><p class='scoreboardHeaderText'>SCOREBOARD</p></div>");

  //A single row in the Scoreboard
  this.PlayerRow = '<div class="scoreboardPlayer">\
                      <div class="turnSubmitted turnSubmitted-disabled"></div>\
                      <div class="ideologyName"></div>\
                      <div class="userIdName"></div>\
                      <div class="playerNameIcon"></div>\
                      <div class="countryBonus"></div>\
                      <div class="countryScore"></div>\
                      <div class="playerScoresSpacer"></div>\
                      <div class="territoryScore"></div>\
                      <div class="territoryBonus"></div>\
                    </div>\
                    <div class="playerSpacer"></div>';

  this.PlayerRow = '<div class="scoreboardPlayer">\
                      <div class="turnSubmitted turnSubmitted-disabled"></div>\
                      <div class="playerNameIcon"></div>\
                      <div class="ideologyName"></div>\
                      <div class="userIdName"></div>\
                      <div class="playerScoresSpacer"></div>\
                      <div class="controlMeters">\
                        <div class="countryControlMeter">\
                          <div class="countryLabel">Region</div>\
                          <div class="countryBonus"></div>\
                          <div class="countryScore"></div>\
                        </div>\
                        <div class="playerScoresSpacer"></div>\
                        <div class="territoryControlMeter">\
                          <div class="territoryLabel">Population</div>\
                          <div class="territoryScore"></div>\
                          <div class="territoryBonus"></div>\
                        </div>\
                      </div>\
                    </div>\
                    <div class="playerSpacer"></div>';

  //------------------------------------------------------------------------------
  this.createScoreBars = function(scoreData)  {
    var parentWidth = $('#scoreboardContainer').width() * 0.65; //TODO magic number
    var countryScoreWidth = $('.countryScore').width();

    var countrySegWidth = parentWidth / scoreData.numCountries;
    var territorySegWidth = parentWidth / scoreData.numTerritories;

    var barAttr = {
      'stroke': 'black',
      'stroke-width': 1,
      'fill' : 'gray'
    };

    var altColorBar = function (i) {
      return i % 2 > 0 ? ' individualScoreAlt' : '';
    };

    var nextBonus = function (tNum, territoryThresholds) {
      var retVal = '';
      for (var i = 0; i < territoryThresholds.length; i++) {
        if (tNum + 1 < territoryThresholds[i].threshold) {
          return (retVal + '');
        }
        else {
          retVal = ' territoryBonus' + i.toString();
        }
      }

      return retVal;
    };

    var $barGraphContainers = $('#scoreboardContainer .countryScore');
    var $playerRows = $('#scoreboardContainer .scoreboardPlayer');
    var i, p;

    // iterate through players via the containers that are already there
    for (p = 0; p < $barGraphContainers.length; p++) {
      var currCountryElem = $barGraphContainers.get(p);
      var controlledCountryCount = 0;
      var $rowElement = $playerRows.eq(p);
      for (i = 0; i < scoreData.numCountries; i++) {

        var currCountryScore = $('<div class="individualCountryScore' + altColorBar(i) + '" style="width: ' + (100 / scoreData.numCountries) + '%"></div>');

        $rowElement.find('.countryScore').append(currCountryScore);

        if (i < $rowElement.data("countriesControlled")) {
          var amount = $rowElement.data("controlledCountryResources")[controlledCountryCount];
          var currCountryBonus = $('<div class="individualCountryBonus" style="width: ' + (100 / scoreData.numCountries) + '%">+' + amount.toString() + '</div>');
          $rowElement.find('.countryBonus').append(currCountryBonus);
          controlledCountryCount++;

          currCountryScore.animate({ backgroundColor: '#FFFFFF' }, 'slow');
        }
      }

      //add, update territory bar
      var territoryBonusThresholds = getTerritoryResourceThresholds();
      var territoriesControlled = $playerRows.eq(p).data("territoriesControlled");

      for (i = 0; i < scoreData.numTerritories; i++) {
        var currTerritoryScore = $('<div class="individualTerritoryScore' + nextBonus(i, territoryBonusThresholds) + altColorBar(i) + '" style="width: ' + (100 / scoreData.numTerritories) + '%"></div>');
        $rowElement.find('.territoryScore').append(currTerritoryScore);

        //if the player "controls" this territory, highlight it
        if (i < territoriesControlled) {
          currTerritoryScore.animate({ backgroundColor: '#FFFFFF' }, 'slow');
        }
      }

      // add bonus divs to territory bar
      var territoryBonusDiv = '<div class="individualTerritoryBonus"></div>';
      var scoreSize = 120 / scoreData.numTerritories;
      var divWidth = 0;

      for (var t = 0; t < territoryBonusThresholds.length; t++) {
        var territoryThreshold = territoryBonusThresholds[t];

        if (territoryThreshold.threshold >= scoreData.numTerritories) {
          break;
        }

        var currTerritoryBonusDiv = $(territoryBonusDiv);
        var nextThreshold = t+1 < territoryBonusThresholds.length ? territoryBonusThresholds[t+1].threshold - 1 : scoreData.numTerritories;
        divWidth = territoryThreshold.threshold * scoreSize - divWidth;
        currTerritoryBonusDiv.css('width', divWidth.toString() + 'px');
        divWidth -= 1;
        var $tickmark = $('<div class="territoryBonusTickMark"><div class="territoryBonusTickText">+' + territoryThreshold.value.toString() + '</div></div>');
        if (territoriesControlled < territoryThreshold.threshold) {
          $tickmark.children('.territoryBonusTickText').addClass('territoryBonusTickTextDisabled');
          $tickmark.addClass('territoryBonusTickDisabled');
        }
        currTerritoryBonusDiv.append($tickmark);
        $rowElement.find('.territoryBonus').append(currTerritoryBonusDiv);
      }
    };

  };

  //----------------------------------------------------------------------------
  // Update the display of the players' scores.
  this.setPlayerScores = function (gameState, currentPlayerIndex) {
    var scoreData = {};

    // Empty the arrays
    $countryRows = [];

    //TODO should just re-use previously built elements
    //wipe out all old info
    $('#scoreboardContainer .scoreboardPlayer').remove();
    $('.playerSpacer').remove();

    for (var playerIdx = 0; playerIdx < gameState.players.length; playerIdx++) {
      var countriesControlled = 0;
      var territoriesControlled = 0;
      var territoryCount = 0;
      var controlledCountryResources = [];

      for (var countryIdx = 0; countryIdx < gameState.countries.length; countryIdx++) {
        var country = gameState.countries[countryIdx];
        if (playerControlsCountry(country, playerIdx)) {
          ++countriesControlled;
          controlledCountryResources.push(getCountryResources(country));
        }

        territoriesControlled += getNumberOfLoyalTerritories(country, playerIdx);
        territoryCount += country.territories.length;
      }

      var $countryRow = $(self.PlayerRow);
      $countryRow.data("countriesControlled", countriesControlled);
      $countryRow.data("territoriesControlled", territoriesControlled);
      $countryRow.data("controlledCountryResources", controlledCountryResources);
      $countryRow.data("playerIndex", playerIdx);//store the player array index for later use

      //assign some mouse over callbacks to the territory and country bars
      $countryRow.find(".territoryScore").get(0).onmouseover = mouseOverTerritoryInjector;
      $countryRow.find(".territoryScore").get(0).onmouseout = mouseLeaveTerritoryInjector;
      $countryRow.find(".countryScore").get(0).onmouseover = mouseOverCountryInjector;
      $countryRow.find(".countryScore").get(0).onmouseout = mouseLeaveCountryInjector;

      $countryRows.push($countryRow);
    }

    //--------------------------------------------------------------------------
    //little util to grab the previously assigned playerIndex data from this element
    function getPlayerIndexFromPlayerRow(rowElement) {
      return $(rowElement).parents(".scoreboardPlayer").data("playerIndex");
    }

    //--------------------------------------------------------------------------
    //Did this event get generated from a child DOM element? (i.e. bubbled up)
    function cameFromInsideTheParent(e) {
      return ($.contains(e.currentTarget, e.relatedTarget) || e.currentTarget === e.relatedTarget);
    }

    function mouseOverTerritoryInjector(e) {
      if (!cameFromInsideTheParent(e)) {
        callbacks.onTerritoryEnter(gameState, getPlayerIndexFromPlayerRow(e.currentTarget));
      }
    };

    function mouseLeaveTerritoryInjector(e) {
      if (!cameFromInsideTheParent(e)) {
        callbacks.onTerritoryLeave(gameState, getPlayerIndexFromPlayerRow(e.currentTarget));
      }
    };

    function mouseOverCountryInjector(e) {
      if (!cameFromInsideTheParent(e)) {
        callbacks.onCountryEnter(gameState, getPlayerIndexFromPlayerRow(e.currentTarget));
      }
    };

    function mouseLeaveCountryInjector(e) {
      if (!cameFromInsideTheParent(e)) {
        callbacks.onCountryLeave(gameState, getPlayerIndexFromPlayerRow(e.currentTarget));
      }
    };

    self.setNames(gameState.players);
    self.setColors(gameState.players);

    //highlight the currently player's row on the scoreboard
    var currentPlayerRow = $(($countryRows[currentPlayerIndex])[0]);
    currentPlayerRow.addClass('highlightCurrentPlayer');

    currentPlayerRow.css('background', gameState.players[currentPlayerIndex].color);

    //sort the element array so the current player is first in the array
    $countryRows.splice(0, 0, $countryRows.splice(currentPlayerIndex, 1)[0]);

    $('#scoreboardContainer').append($countryRows);

    //The number of countries to win condition
    scoreData.numCountries = numberOfCountriesNeededToWin(gameState);

    //The number of territories to win condition
    scoreData.numTerritories = numberOfTerritoriesNeededToWin(gameState);

    self.createScoreBars(scoreData);
  };

  //----------------------------------------------------------------------------
  this.setColors = function (playerList) {

    //iterate over all the elements (not ordered by player index)
    for (var playerRow = 0; playerRow < $countryRows.length; playerRow++) {
      var i = $countryRows[playerRow].data("playerIndex"); //grab the player index associated with this element

      //if the player has an ideology type now, but no icon displayed, add one
      if (playerList[i].ideologyType > -1 &&
         !$countryRows[playerRow].children('.playerNameIcon').hasClass('ideologyType' + playerList[i].ideologyType)) {
        $countryRows[playerRow].children('.playerNameIcon').addClass('ideologyType' + playerList[i].ideologyType);
        $countryRows[playerRow].children('.playerNameIcon').css('background-color', playerList[i].color);
      }
    }
  };

  //----------------------------------------------------------------------------
  this.setNames = function (playerList) {

    //iterate over all the elements (not ordered by player index)
    for (var elementIdx = 0; elementIdx < $countryRows.length; elementIdx++) {
      var i = $countryRows[elementIdx].data("playerIndex"); //grab the player index associated with this element
      var ideologyName = playerList[i].ideologyName;
      $countryRows[elementIdx].children('.ideologyName').text((ideologyName === null) ? 'default' : ideologyName);
      $countryRows[elementIdx].children('.userIdName').text(playerList[i].name);
    }
  };

  //----------------------------------------------------------------------------
  this.setTooltips = function () {
    for (var elementIdx = 0; elementIdx < $countryRows.length; elementIdx++) {
      var $countryRow = $countryRows[elementIdx];
      new Opentip($countryRow.find('.countryScore')[0], TOOLTIPS.SCOREBOARD.COUNTRY.TEXT, TOOLTIPS.SCOREBOARD.COUNTRY.TITLE);
      new Opentip($countryRow.find('.territoryScore')[0], TOOLTIPS.SCOREBOARD.TERRITORY.TEXT, TOOLTIPS.SCOREBOARD.TERRITORY.TITLE);
    }
  };

  //----------------------------------------------------------------------------
  // Make the list visible
  this.toggleVisibility = function(visible) {
    if (visible) {
      this.root.css('visibility', 'visible');
    }
    else {
      this.root.css('visibility', 'hidden');
    }
    return this;
  };

  //----------------------------------------------------------------------------
  // Make the list invisible
  this.hide = function() {
    this.toggleVisibility(false);
  };

  //----------------------------------------------------------------------------
  // Is the list visible?
  this.isVisible = function() {
    return this.root.css('visibility') === 'visible';
  };

  //----------------------------------------------------------------------------
  // Update the player's status
  this.updatePlayerStatus = function (userList, ideologyList) {
    var $playerRows = $('#scoreboardContainer .scoreboardPlayer');

    //indicate if this player has submitted their turn yet
    for (var i = 0; i < $playerRows.length; i++) {
      var $currPlayer = $($playerRows[i]);
      var currPlayerID = parseInt($currPlayer.data("playerIndex"));

      $currPlayer.find('.turnSubmitted').toggleClass('turnSubmitted-disabled',
                              !userList[currPlayerID].hasTakenTurn,
                              1000,
                              "easeInOutElastic");
    }
  };
}
