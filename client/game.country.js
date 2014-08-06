/*******************************************************************************
 * An Object representing a country made up of territories
 ******************************************************************************/
function GameCountry(svgObj) {
  'use strict';

  this.svgObj = svgObj;

  this.territories = [];
  this.anchor = [[], [], [], []];
  this.controlIcon = null;

  this.outlineStrokeWidth = null;
  this.outline = null;
  this.fill = null;

  var agentOverview = null;
  var escapableAgentCount = 0;
  var escapedAgentCount = 0;
  var agentMap = {};
  var loyaltyMap = {};
  var self = this;
  var pulsateID = -1;
  var pulseID = -1;
  var nationIndex = 0;

  //----------------------------------------------------------------------------
  // Bring our outline to the front
  this.bringToFront = function() {
    self.outline && self.outline.front();
  }

  //----------------------------------------------------------------------------
  // Set that this player has some loyalty in this Country
  this.addLoyalPlayer = function(playerID) {
    loyaltyMap[playerID] = true;
  };

  //----------------------------------------------------------------------------
  // Create the Agent Overview UI tied to this Country
  this.createAgentOverview = function(players, svgAgentSource, getActionTargetCB) {
    agentOverview = new AgentOverview($('body'), this.nationIndex, svgAgentSource, players.length, getActionTargetCB);
    agentOverview.setAnchor(this.anchor);
    this.positionAgentOverview();
  };

  //----------------------------------------------------------------------------
  // Destroy the Agent Overview UI tied to this Country
  this.destroyAgentOverview = function() {
    agentOverview.destroy();
  };

  //----------------------------------------------------------------------------
  // Refreshes the position of the Agent Overview UI tied to this Country
  this.positionAgentOverview = function() {
    agentOverview.updatePositioning();
  };

  //----------------------------------------------------------------------------
  // Create the tooltip for this country
  this.setTooltip = function() {
    var tooltip = TOOLTIPS.COUNTRIES.NAME + self.name + ' (' +
    self.abbreviation + ')<br>';
    tooltip += TOOLTIPS.COUNTRIES.RESOURCES + getCountryResources(self);
    new Opentip($(self.svgObj.node)[0], tooltip, TOOLTIPS.COUNTRIES.TITLE, { target: null, offset: [0, -12], delay: 1 });
    agentOverview.setTooltip(TOOLTIPS.AGENTS.CONTAINER);
  };

  //----------------------------------------------------------------------------
  // Create the tooltip for this country
  this.updateAgentOverviewTooltips = function() {
    agentOverview.updateAgentTooltips();
  };

  //----------------------------------------------------------------------------
  // Get the Agent Overview UI ready to pick a target
  this.readyAgentOverviewForTargetPick = function(source, validPlayers) {
    agentOverview.readyAgentOverviewForTargetPick(source, validPlayers);
  };

  //----------------------------------------------------------------------------
  // Clear the country of all agent picking ability
  this.clearAgentPicking = function() {
    agentOverview.clearAgentPicking();
  };

  //----------------------------------------------------------------------------
  // Adjusts the escaped agents count due to an agent escaping the country
  this.agentEscaped = function() {
    --escapableAgentCount;
    ++escapedAgentCount;
  };

  //----------------------------------------------------------------------------
  // Adjusts the escaped agents count due undoing an agent escaping the country
  this.undoAgentEscape = function() {
    ++escapableAgentCount;
    --escapedAgentCount;
  };

  //----------------------------------------------------------------------------
  // Set the number of agents that can escape from this country
  this.setEscapableAgentCount = function(agentCount) {
    escapableAgentCount = agentCount;
    escapedAgentCount = 0;
  };

  //----------------------------------------------------------------------------
  // Get the number of Agents that can escape from this country
  this.getEscapableAgentCount = function() {
    return escapableAgentCount;
  };

  //----------------------------------------------------------------------------
  // Get whether this Country has been escaped from this turn or not
  this.hasBeenEscapedFrom = function() {
    return escapedAgentCount > 0;
  };

  //----------------------------------------------------------------------------
  // Set the number of Agents this player has in this Country
  this.setAgents = function(playerID, playerColor, agents) {
    agentMap[playerID] = agents;
    agentOverview.setAgents(playerID, playerColor, agents);
  };

  //----------------------------------------------------------------------------
  // Get the number of Agents this player has in this Country
  this.getAgentCount = function(playerID) {
    return agentMap[playerID].length;
  };

  //----------------------------------------------------------------------------
  this.getAgentOverview = function(playerID) {
    return agentOverview;
  };

  //----------------------------------------------------------------------------
  // Check if this player has agents that can spread a positive message here
  this.hasPositiveAgents = function(playerID) {
    var agentIndex, messageType;

    for (agentIndex = 0; agentIndex < agentMap[playerID].length; ++agentIndex) {
      messageType = agentMap[playerID][agentIndex].messageType;
      if (messageType === MessageType.POSITIVE || messageType === MessageType.FLEXIBLE) {
        return true;
      }
    }
    return false;
  };

  //----------------------------------------------------------------------------
  // Check if this player has agents that can spread a negative message here
  this.hasNegativeAgents = function(playerID) {
    var agentIndex, messageType;

    for (agentIndex = 0; agentIndex < agentMap[playerID].length; ++agentIndex) {
      messageType = agentMap[playerID][agentIndex].messageType;
      if (messageType === MessageType.NEGATIVE || messageType === MessageType.FLEXIBLE) {
        return true;
      }
    }
    return false;
  };

  //----------------------------------------------------------------------------
  // Check if this Country has loyalty to another player or not
  this.hasOpposingLoyalty = function(currentPlayerID) {
    var player;

    for (player in loyaltyMap) {
      if (player != currentPlayerID) {
        return true;
      }
    }
    return false;
  };

  //----------------------------------------------------------------------------
  // Check if this Country has another player's Agents in it or not
  this.hasOpposingAgents = function(currentPlayerID) {
    var player;

    for (player in agentMap) {
      if (player != currentPlayerID && this.getAgentCount(player) > 0) {
        return true;
      }
    }
    return false;
  };

  //----------------------------------------------------------------------------
  // Add an outline to this Country
  this.addOutline = function(outline) {
    this.outline = outline;
    this.outlineStrokeWidth = outline.attr('stroke-width');
  };

  //----------------------------------------------------------------------------
  // Set the Country's color as a hex string '#0123456'
  this.setColor = function(color, fadeTime) {
    if (fadeTime === undefined) {
      fadeTime = 1000;
    }
    this.fill.animate(fadeTime).fill(color);
  };

  //----------------------------------------------------------------------------
  // Clone the svg object this Country represents
  this.svgClone = function() {
    return this.svgObj.deepClone();
  };

  //----------------------------------------------------------------------------
  // Set the color of the Country's outline as a hex string ('#0123456')
  this.highlightCountry = function(shouldHighlight) {
    if (shouldHighlight) {
      this.outline.stroke('#eeee00');
      this.bringToFront();
      $(this.svgObj.node).attr('class', 'pointerCursor');
    }
    else {
      this.outline.stroke('#000000');
      $(this.svgObj.node).attr('class', '');
    }
  };

  //----------------------------------------------------------------------------
  // Pulse the color of this country and its territories from the supplied
  // color to white and back again.
  this.pulsateCountry = function (shouldHighlight, color) {
    if (shouldHighlight) {
      //pulse the territory color from the supplied color to white and back
      stopAnimation(pulsateID, self.fill);
      pulsateID = animateColorChange(self.fill, 'fill', '#ffffff', color);

    }
    else if (pulsateID !== -1) {
      //stop pulsing and animate back to the supplied color
      pulsateID = stopAnimation(pulsateID, self.fill);
      self.fill.animate(500).fill(color);
    }

    this.territories.forEach(function (t) {
      t.highlight(shouldHighlight, color);
    });
  };

  //----------------------------------------------------------------------------
  this.startPulse = function() {
    pulseID = animateColorChange(self.outline, 'stroke', '#ffffff', '#eeee00');
  };

  //----------------------------------------------------------------------------
  this.stopPulse = function() {
    pulseID = stopAnimation(pulseID, self.outline);
  };

  //----------------------------------------------------------------------------
  // Animate from color1 to color2
  function animateColorChange(object, attr, color1, color2) {
    object.animate(400).attr(attr, color1).after(function () {
      object.animate(500).attr(attr, color2);
    });
    var id = setInterval(function () {
      object.animate(400).attr(attr, color1).after(function () {
        object.animate(500).attr(attr, color2);
      });
    }, 1000);
    return id;
  };

  //----------------------------------------------------------------------------
  // Animate from color1 to color2
  function stopAnimation(id, object) {
    if (id !== -1) {
      clearInterval(id);
      object.stop();
    }
    return -1;
  };

  //----------------------------------------------------------------------------
  this.getCenter = function () {
    return getCenter(this.controlIcon);
  };
};
