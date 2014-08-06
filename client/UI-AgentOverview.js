/*******************************************************************************
 * A UI element showing the agents found in a location
 ******************************************************************************/
function AgentOverview (p_rootDiv, p_nationIndex, p_svgAgentSource, p_playerCount, p_getActionTargetCB, p_showingAtStart, p_styleID) {
  'use strict';
  this.getActionTarget = p_getActionTargetCB;

  var self = this;

  var anchor = null;
  var svgAgentSource = p_svgAgentSource;

  var thisDiv;
  var agentDivs = [];

  var showingAtStart = p_showingAtStart || false;
  var nationIndex = p_nationIndex;

  var styleID = p_styleID || "";
  var addAdditionalStyle = styleID === "" ? false : true;
  var originalBorderWidth;
  var originalBorderColor;
  var originalWidth;
  var originalHeight;
  var originalTop = 0;
  var originalLeft = 0;
  var borderColorPulseID = -1;


  //----------------------------------------------------------------------------
  var getAdditionalIDstring = function (addID) {
    if (addID)
    {
      return 'id="' + styleID + '"';
    }
    else
    {
      return "";
    }
  };

  //----------------------------------------------------------------------------
  // Destroy the HTML elements that make up this overview
  this.destroy = function() {
    thisDiv.remove();
  };

  //----------------------------------------------------------------------------
  // Set the agent count for the given country and player
  this.setAgents = function(playerIndex, playerColor, agents) {
    // Clear the previous agent icons/info
    clearAgentIcons(playerIndex);

    for (var agentIndex = 0; agentIndex < agents.length; ++agentIndex) {
      createAgentIcon(playerIndex, playerColor, agents[agentIndex]);
    }

    self.updateVisibility();
  };

  //----------------------------------------------------------------------------
  // Toggle whether this div is showing or not
  this.toggleVisibility = function (showing) {
    if (showing) {
      if (thisDiv.css('display') === 'none') {
        originalWidth = thisDiv.css('width');
        originalHeight = thisDiv.css('height');
        thisDiv.css('width', '0px');
        thisDiv.css('height', '0px');
        thisDiv.animate({width:originalWidth, height:originalHeight}, 500, 'easeOutBack');
      }

      // $(thisDiv).show();
    }
    else {
      // If we're not visible, hide the tooltips so our tooltip doesn't stick around
      Opentip.hideTips();
      // $(thisDiv).hide();
    }
  };

  //----------------------------------------------------------------------------
  // Assign all of the anchor points.
  this.setAnchor = function(anch) {
    anchor = anch;
  };

  //----------------------------------------------------------------------------
  // Positions all agents.
  this.updatePositioning = function() {
    if (anchor) {
      for (var playerIndex = 0; playerIndex < agentDivs.length; ++playerIndex) {
        for (var agentIndex = 0; agentIndex < agentDivs[playerIndex].length; ++agentIndex) {
          positionAgent(agentDivs[playerIndex][agentIndex], getCenter(anchor[playerIndex][agentIndex]));
        }
      }
    }
  }

  //----------------------------------------------------------------------------
  // Get the center of the
  this.getCenter = function () {
    var top = parseInt($(thisDiv).css('top'));
    var left = parseInt($(thisDiv).css('left'));
    var width = parseInt($(thisDiv).css('width'));
    var height = parseInt($(thisDiv).css('height'));
    var borderWidth = parseInt($(thisDiv).css('border-width'));
    return { x: left + (width / 2 + borderWidth), y: top + (height / 2 + borderWidth)};
  }

  //----------------------------------------------------------------------------
  // Set the tooltips for the container and agent icons
  this.setTooltip = function (containerTooltip) {
    // Our container gets the given tooltip
    // new Opentip(thisDiv[0], containerTooltip.TEXT, containerTooltip.TITLE);
    this.updateAgentTooltips();
  };

  //----------------------------------------------------------------------------
  // Update whether the agent overview is visible or not based on how many
  // agents are being represented by the overview
  this.updateVisibility = function() {
    var visible = false;
    for (var playerIndex = 0; playerIndex < agentDivs.length; ++playerIndex) {
      if (agentDivs[playerIndex].length > 0) {
        visible = true;
        break;
      }
    }
    self.toggleVisibility(visible);
  };

  //----------------------------------------------------------------------------
  this.updateAgentTooltips = function () {
    // We have to go through and set up our agent icon's tooltips
    for (var playerIndex = 0; playerIndex < agentDivs.length; ++playerIndex) {
      for (var agentIndex = 0; agentIndex < agentDivs[playerIndex].length; ++agentIndex) {
        var tooltip = TOOLTIPS.AGENTS.DETAILS.MESSAGE + agentDivs[playerIndex][agentIndex].attr('messageType');
        new Opentip(agentDivs[playerIndex][agentIndex][0], tooltip, TOOLTIPS.AGENTS.DETAILS.TITLE, { style: "contagionTipsLow" });
      }
    }
  };

  var setAgentStroke = function(agent, stroke, width) {
    agent.find('[id^="Meeple"]').children().each(function() {
      this.style.stroke = stroke;
      this.style.strokeWidth = width;
    });
  }

  //----------------------------------------------------------------------------
  // Get the Agent Overview UI ready for the player to pick a target player
  this.readyAgentOverviewForTargetPick = function(source, playerIndices) {
    // Set up all the agent divs for target picking
    for (var arrayIndex = 0; arrayIndex < playerIndices.length; ++arrayIndex) {
      var playerIndex = playerIndices[arrayIndex];
      for (var agentIndex = 0; agentIndex < agentDivs[playerIndex].length; ++agentIndex) {
        // Add a highlight div to this one
        agentDivs[playerIndex][agentIndex].addClass('pointerCursor circleHighlight');
        agentDivs[playerIndex][agentIndex].bind('click.getTarget', function(event) {
          event.stopPropagation(); // The mouse click has been handled
          // Get the player id and call our callback function
          var targetInfo = getDivInformation(this.id);
          self.getActionTarget(source, targetInfo);
          $(document).trigger('ButtonClicked');
        });
      }
    }
  };

  //----------------------------------------------------------------------------
  // Clear the country of all agent picking ability
  this.clearAgentPicking = function() {
    // Clean up all the agent divs from target picking
    for (var playerIndex = 0; playerIndex < agentDivs.length; ++playerIndex) {
      for (var agentIndex = 0; agentIndex < agentDivs[playerIndex].length; ++agentIndex) {
        agentDivs[playerIndex][agentIndex].removeClass('pointerCursor circleHighlight');
        agentDivs[playerIndex][agentIndex].unbind('click.getTarget');
      }
    }
  };

  //----------------------------------------------------------------------------
  // Create the html elements that make up this Object
  var create = function (rootDiv, playerCount) {
    // Make container div
    thisDiv = $('<div class="agentOverviewContainer" ' + getAdditionalIDstring(addAdditionalStyle) + '></div>').appendTo(rootDiv);
    originalBorderWidth = parseInt(thisDiv.css('border-width'));
    originalBorderColor = thisDiv.css('border-color');
    originalWidth = thisDiv.css('width');
    originalHeight = thisDiv.css('height');


    for (var playerIndex = 0; playerIndex < playerCount; ++playerIndex)
    {
      agentDivs.push([]);
    }
  };

  //----------------------------------------------------------------------------
  // Clear out all previous agent icons from this player
  var clearAgentIcons = function (playerIndex) {
    for (var agentIndex = 0; agentIndex < agentDivs[playerIndex].length; ++agentIndex) {
      $(agentDivs[playerIndex][agentIndex]).remove();
    }
    agentDivs[playerIndex] = [];
  };

  //----------------------------------------------------------------------------
  var getAgentIcon = function (agent) {
    switch (agent.messageType) {
      case MessageType.POSITIVE: return ' agentOverviewIcon-positive';
      case MessageType.NEGATIVE: return ' agentOverviewIcon-negative';
      case MessageType.FLEXIBLE: return ' agentOverviewIcon-flexible';
      default: return ' agentOverviewIcon-default';
    }
  };

  //----------------------------------------------------------------------------
  var getAgentColor = function (agent) {
    switch (agent.messageType) {
      case MessageType.POSITIVE: return 'positive';
      case MessageType.NEGATIVE: return 'negative';
      case MessageType.FLEXIBLE: return 'flexible';
      default: return '';
    }
    // switch (agent.messageType) {
    //   case MessageType.POSITIVE: return ' agentOverviewColor-positive';
    //   case MessageType.NEGATIVE: return ' agentOverviewColor-negative';
    //   case MessageType.FLEXIBLE: return ' agentOverviewColor-flexible';
    //   default: return '';
    // }
  };

  //----------------------------------------------------------------------------
  // Set the position of the overview given an object with an x and y property
  var positionAgent = function (elem, anchor) {
    var newX = anchor.x - (parseInt(elem.css("width"), 10) / 2);
    var newY = anchor.y - (parseInt(elem.css("height"), 10) / 2);
    elem.css("top", Math.floor(newY).toString() + "px");
    elem.css("left", Math.floor(newX).toString() + "px");
  };

  //----------------------------------------------------------------------------
  // Create the html elements that make up this Object
  var createAgentIcon = function (playerIndex, playerColor, agent) {
    var divID = "AgentOverview-" + nationIndex + ":" + playerIndex + ":" + agentDivs[playerIndex].length;

    // Add a main div container to represent the agent
    var agentDiv = $('<div class="agentOverviewAgent" id="' + divID + '" messageType="' + getMessageTypeString(agent.messageType) + '"></div>').appendTo($(thisDiv));

    var svgAgent = SVG(divID);
    var loadedAgent = svgAgent.svg(svgAgentSource);
    var bounds = getMapBounds(loadedAgent);
    svgAgent.viewbox(bounds.minX, bounds.minY, bounds.width() + 10, bounds.height() + 10);

    var agentType = getAgentColor(agent);
    var agentTypes = loadedAgent.roots()[0].children();
    for (var i = 0; i < agentTypes.length; ++i) {
      if (agentTypes[i].node.id.indexOf(agentType) !== -1) {
        agentTypes[i].attr("display","");
        if (agentTypes[i].node.id.indexOf("fill") !== -1) {
          agentTypes[i].fill(playerColor);
        }
      } 
    }

    positionAgent(agentDiv, getCenter(anchor[playerIndex][agentDivs[playerIndex].length]));
    agentDivs[playerIndex].push(agentDiv);
  };

  //----------------------------------------------------------------------------
  var getMapBounds = function(svgMap) {
    // svgjs doesn't have a way to expand bounds we do it manually
    var bounds = {
      minX:Number.MAX_VALUE, minY:Number.MAX_VALUE,
      maxX:-Number.MAX_VALUE, maxY:-Number.MAX_VALUE,
      expandBy: function(box) {
        this.minX = Math.min(this.minX, box.x);
        this.minY = Math.min(this.minY, box.y);
        this.maxX = Math.max(this.maxX, box.x + box.width);
        this.maxY = Math.max(this.maxY, box.y + box.height);
      },
      width: function() { return this.maxX - this.minX; },
      height: function() { return this.maxY - this.minY; }
    };

    // Get references to everything we care about
    var roots = svgMap.roots()[0].children();
    for (var i in roots) {
      bounds.expandBy(roots[i].bbox());
    }

    return bounds;
  };

  //----------------------------------------------------------------------------
  // Clear out all previous agent icons from this player
  var getDivInformation = function (divID) {
    var components = divID.split(":");
    return { nation: parseInt(components[0]), player: parseInt(components[1]), agent: parseInt(components[2]) };
  };

  //----------------------------------------------------------------------------
  var hasAgentsFromMultiplePlayers = function() {
    var numberOfDifferentPlayers = 0;

    for (var playerIndex = 0; playerIndex < agentDivs.length; ++playerIndex) {
      if (agentDivs[playerIndex].length > 0) {
        ++numberOfDifferentPlayers;
      }
    }

    return numberOfDifferentPlayers > 1;
  };

  //----------------------------------------------------------------------------
  // Get the string value of a message type
  var getMessageTypeString = function(messageType) {
    switch (messageType) {
      case MessageType.NEGATIVE:
        return "Negative";
      case MessageType.POSITIVE:
        return "Positive";
      case MessageType.FLEXIBLE:
        return "Flexible";
    }
    return "Undefined?!?!";
  };

  // Call our "constructor" and set our initial visibility state
  create(p_rootDiv, p_playerCount);
  this.toggleVisibility(showingAtStart);
}
