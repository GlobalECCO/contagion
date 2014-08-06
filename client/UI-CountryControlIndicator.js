/*******************************************************************************
 *
 ******************************************************************************/
function CountryControlIndicator (rootElement) {
  'use strict';
  var self = this;
  var controlIcon = '<div class="countryControlIcon"></div>';
  this.root = rootElement;

  //----------------------------------------------------------------------------
  // Removes all country control icons
  this.removeControlIcons = function () {
    rootElement.find('.countryControlIcon').remove();
  };

  //----------------------------------------------------------------------------
  // returns playerID of player who controls the country
  // -1 if not controlled
  this.isCountryControlled = function (country) {
    var controllingPlayer = -1;
    for (var t = 0; t < country.territories.length; t++) {
      // territory is loyal to no one, we can deduce that the country isn't controlled, so we break out of the for loop
      if (country.territories[t].loyalToWhom === -1) {
        controllingPlayer = -1;
        break;
      }
      // check to see if a territory isn't completely controlled, regardless of who has loyalty. break if loyalty isn't 100%
      if (country.territories[t].currentLoyalty !== country.territories[t].maxLoyalty) {
        controllingPlayer = -1;
        break;
      }
      // check to see who the territory is loyal to
      else {
        if (controllingPlayer === -1) {
          controllingPlayer = country.territories[t].loyalToWhom;
        }
        else {
          if (controllingPlayer !== country.territories[t].loyalToWhom) {
            controllingPlayer = -1;
            break;
          }
        }
      }
    }

    return controllingPlayer;
  };

  //----------------------------------------------------------------------------
  //Do we already have an icon for the supplied country index?
  //@return -1 or the index of the country control icons
  var getIconForCountry = function (countryIndex) {
    var childs = rootElement.find('.countryControlIcon');
    for (var c = 0; c < childs.length; c++) {
      if (countryIndex == $(childs[c]).data('country')) { return $(childs[c]); };
    }
    return null;
  };

  //----------------------------------------------------------------------------
  this.updateControlIcons = function (gameState, map) {
    // iterate through each country
    for (var countryIdx = 0; countryIdx < gameState.countries.length; countryIdx++) {
      var currentCountry = gameState.countries[countryIdx];

      //if we have an icon
      var $childElement = getIconForCountry(countryIdx);
      if ($childElement) {
        if (playerControlsCountry(currentCountry, $childElement.data('playerIndex'))) {
          continue; //nothing to do. Our icon is already correct for this country
        }
        else {
          $childElement.remove(); //wrong icon. Nuke it
        }
      }

      //see if any other player controls this country and add their icon
      for (var p = 0; p < gameState.players.length; p++) {
        if (playerControlsCountry(currentCountry, p)) {
          addIcon(p, gameState.players[p].ideologyType, gameState.players[p].color, map, countryIdx);
        }
      }
    }
  };

  //----------------------------------------------------------------------------
  this.repositionControlIcons = function (map) {
    rootElement.find('.countryControlIcon').each(function() {
      // Get the center of this icon's map
      var center = getNationCenter(map, parseInt($(this).data('country')));
      var divHalfWidth = (parseInt($(this).css('width')) ) / 2;
      var divHalfHeight = (parseInt($(this).css('height')) ) / 2; // + parseInt($currDiv.css('border-width'))
      $(this).css({left: center.x - divHalfWidth, top: center.y - divHalfHeight});
    });
  };

  //----------------------------------------------------------------------------
  this.toggleControlIconVisibility = function(visible) {
    rootElement.children('.countryControlIcon').each(function() {
      $(this).css('display', (visible) ? '': 'none');
    });
  }

  //----------------------------------------------------------------------------
  var addIcon = function (playerIndex, ideologyID, playerColor, map, nID) {
    var center = getNationCenter(map, nID);
    var $currDiv = $(controlIcon);
    var divWidth;
    var divHeight;

    self.root.append($currDiv);

    if ($(window).width() < 1150 || $(window).height() < 800) {
      divWidth = 30;
      divHeight = 30;
    }
    else {
      divWidth = 50;
      divHeight = 50;
    };

    var divHalfWidth = divWidth / 2; //(parseInt($currDiv.css('width')) ) / 2;
    var divHalfHeight = divHeight / 2; //(parseInt($currDiv.css('height')) ) / 2; // + parseInt($currDiv.css('border-width'))
    var topValue = center.y - divHalfHeight;
    var leftValue = center.x - divHalfWidth;

    $currDiv.addClass('ideologyType' + ideologyID.toString());
    $currDiv.css({'background-color': playerColor, left: leftValue, top:topValue});
    $currDiv.css('width', 0);
    $currDiv.css('height', 0);
    $currDiv.animate({ 'width': divHalfWidth * 2, 'height': divHalfHeight * 2, 'left': leftValue, 'top': topValue }, 500, 'easeOutBack');
    $currDiv.data('playerIndex', playerIndex);
    $currDiv.data('country', nID);
  };

  //----------------------------------------------------------------------------
  var getNationCenter = function (map, nID) {
    return map.countries[nID].getCenter();
  };
}