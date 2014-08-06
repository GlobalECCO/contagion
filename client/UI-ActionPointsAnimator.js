// -----------------------------------------------------------------------------
function actionPointsAnimator (rootElement, pos, text, color) {
'use strict';
  pos.x = pos.x || pos.left || 0;
  pos.y = pos.y || pos.top || 0;
  var color = color || '#000000';
  var actionPointDiv = $('<div class="actionPointsContainer" style="left: ' + pos.x + 'px; top: ' + pos.y + 'px; color: ' + color +';">' + text + '</div>');
  rootElement.append(actionPointDiv);
  actionPointDiv.animate({
  top: (parseInt(pos.y, 10) - 50).toString(),
  opacity: 0.0
  }, 1500);
}

// -----------------------------------------------------------------------------
function allActionPointsAnimator (rootElement, pos, text, players, index, fn) {
  'use strict';
  if (index >= players.length)
    return 0;
  pos.x = pos.x || pos.left || 0;
  pos.y = pos.y || pos.top || 0;
  var color = players[index].color;
  var actionPointDiv = $('<div class="actionPointsContainer" style="left: ' + pos.x + 'px; top: ' + pos.y + 'px; color: ' + color +';">' + text + '</div>');
  rootElement.append(actionPointDiv);
  actionPointDiv.animate({
  top: (parseInt(pos.y, 10) - 50).toString(),
  opacity: 0.0
  }, 1500, allActionPointsAnimator(rootElement, pos, text, players, index+1, allActionPointsAnimator));
}

// -----------------------------------------------------------------------------
function animateTerritory (map, nID, tID, color, duration, delay) {
  //console.log("NOW");
  map.countries[ nID].territories[tID].svgObj.animate(duration, '-', delay).attr({fill: color});
}

// -----------------------------------------------------------------------------
function animateActionPoints (rootElement, gameState, map) {
  'use strict';
  var t, territory;

  //console.log("ANIMATE ACTION POINTS");
  var allPlayersControlledTerritories = [];

  // calculate territory count for each player
  for (var i=0; i < gameState.players.length; i++) {

      var controlledTerritories = [];
      for (var nationIndex = 0; nationIndex < gameState.countries.length; nationIndex++) {
        for (var territoryIndex = 0; territoryIndex < gameState.countries[nationIndex].territories.length; territoryIndex++) {
          if ((gameState.countries[nationIndex].territories[territoryIndex].loyalToWhom) === i) {
            controlledTerritories.push ({nationID: nationIndex, territoryID: territoryIndex, oldColor: '#FFFFFF'});
          }
        }
      }


    allPlayersControlledTerritories.push(controlledTerritories);
  }

  // animate bonuses

  for (var n = 0; n < allPlayersControlledTerritories.length; n++) {
    var territoryThresholds = getTerritoryResourceThresholds();
    var controlledTerritories = allPlayersControlledTerritories[n];

    var extraPoints = 0;

    for (t = 0; t < territoryThresholds.length; t++)
    {
      if (controlledTerritories.length >= territoryThresholds[t].threshold)
      {
        extraPoints += territoryThresholds[t].value;
      }
    }

    //short circuit this next section until I get it working
    if (false && extraPoints > 0)
    {
      // animate map territories
      // get current colors


      for (t = 0; t < controlledTerritories.length; t++)
      {
        territory = gameState.countries[ controlledTerritories[t].nationID].territories[controlledTerritories[t].territoryID];
        //controlledTerritories[t].oldColor = map.countries[ controlledTerritories[t].nationID].territories[controlledTerritories[t].territoryID].getColor();
        controlledTerritories[t].oldColor = getTerritoryColor(territory, "#CCCCCC", gameState.players[n].color);
        //map.countries[ controlledTerritories[t].nationID].territories[controlledTerritories[t].territoryID].setColor('#FFFFFF');
        map.countries[ controlledTerritories[t].nationID].territories[controlledTerritories[t].territoryID].svgObj.animate(
        250, '-', 1000).attr(
        {fill: '#ffffff'}).during(
        actionPointsAnimator(rootElement, {x: (parseInt(rootElement.css('width')) / 2), y: (parseInt(rootElement.css('height')) / 2)}, "+" + extraPoints.toString(), gameState.players[n].color)).after( function () {
          animateTerritory (map, controlledTerritories[t].nationID, controlledTerritories[t].territoryID, controlledTerritories[t].oldColor, 250, 500)
        }
        );
      }

      //allActionPointsAnimator(rootElement, {x: (parseInt(rootElement.css('width')) / 2), y: (parseInt(rootElement.css('height')) / 2)}, "+" + extraPoints.toString(), gameState.players, n, allActionPointsAnimator);

      // set old colors

      for (t = 0; t < controlledTerritories.length; t++)
      {
        territory = gameState.countries[ controlledTerritories[t].nationID].territories[controlledTerritories[t].territoryID];
        //map.countries[ controlledTerritories[t].nationID].territories[controlledTerritories[t].territoryID].svgObj.animate(500, '-', 500+ n*1000).attr({fill: controlledTerritories[t].oldColor});

      }
    }
  }
}