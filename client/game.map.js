/*******************************************************************************
 * Provides support for map functions
 ******************************************************************************/
function GameMapUtility() {
  'use strict';

  this.territoryIdToCountryObject = {};

  this.associateTerritoryWithCountry = function(id, country)  {
    this.territoryIdToCountryObject[id] = country;
  };

  this.getCountryByTerritoryNodeId = function(id) {
    return this.territoryIdToCountryObject[id];
  };
}

/*******************************************************************************
 * An Object representing the entire map of countries
 ******************************************************************************/
function GameMap(parentElement) {
  'use strict';

  this.root = parentElement;
  this.svgDoc = null;
  this.svgAgentSource = null;

  this.background = null;
  this.countries = [];
  this.coords = { x:0, y:0, width:0, height:0 };
  this.currentHoveredCountry = null;
  this.utility = new GameMapUtility();
  this.currentPlayerIndex = 0;

  var self = this;
  var loaded = false;
  var intersectionRect = null;

  // debug
  //var numHits = 0;

  //----------------------------------------------------------------------------
  // Load this Map from the given url and call the callback when done
  this.loadMap = function(mapUrl, agentUrl, currentPlayerIndex, loadCompleteCallback) {
    // Clear out any existing map UI
    $('#map').remove();
    $('.agentOverviewContainer').remove();
    self.countries = [];
    self.currentPlayerIndex = currentPlayerIndex;

    this.root.append('<div id="map" style="z-index:-1000;position:absolute; top:-8%; left: -8%; width:116%; height:116%"></div>');

    var agent = new XMLHttpRequest();
    agent.open("GET", agentUrl);

    // When we're done add it to the list
    agent.onreadystatechange = function() {
      if (agent.readyState === 4) {
        self.svgAgentSource = agent.responseText;

        // we can't make the canvas absolute pos yet cause of a safari hack that will auto change it back
        self.svgDoc = SVG('map');
        //self.svgDoc.add(self.countryGroup);

         // fetch the map file
        var client = new XMLHttpRequest();
        client.open("GET", mapUrl);

        // When we're done add it to the list
        client.onreadystatechange = function() {
          if (client.readyState === 4) {

            var loadedMap = self.svgDoc.svg(client.responseText);
            onSvgLoadComplete.call(self, loadedMap);

            var padding = self.coords.height * 0.2;

            // fits these dimensions in our box with padding (ie 50...100)
            self.svgDoc.viewbox(self.coords.x, self.coords.y - padding, self.coords.width, self.coords.height + padding * 2.25);

            loaded = true;

            loadCompleteCallback && loadCompleteCallback();
          }
        };

        client.send();
      }
    };

    agent.send();
  };

  //----------------------------------------------------------------------------
  // Unload the map
  this.unloadMap = function() {
    for (var countryIndex = 0; countryIndex < this.countries.length; ++countryIndex) {
      this.countries[countryIndex].destroyAgentOverview();
    }

    $('#map').remove();
    loaded = false;
  };

  //----------------------------------------------------------------------------
  // Returns whether this map has been loaded already or not
  this.isLoaded = function() {
    return loaded;
  };

  //----------------------------------------------------------------------------
  // Remove any target picking ability from all countries
  this.clearCountryHighlights = function() {
    for (var countryIndex = 0; countryIndex < self.countries.length; ++countryIndex) {
      self.countries[countryIndex].highlightCountry(false);
    }
  };

  //----------------------------------------------------------------------------
  // Remove any target picking ability from all countries
  this.clearCountryTargetPicking = function() {
    for (var countryIndex = 0; countryIndex < self.countries.length; ++countryIndex) {
      self.countries[countryIndex].clearAgentPicking();
    }
  };

  //----------------------------------------------------------------------------
  // Get the index of a given GameCountry object
  this.getCountryIndex = function(country) {
    for (var countryIndex = 0; countryIndex < self.countries.length; ++countryIndex) {
      if (self.countries[countryIndex] === country) {
        return countryIndex;
      }
    }
    return -1;
  };

  //----------------------------------------------------------------------------
  this.getAllTerritories = function() {
    var allTerritories = [];

    this.countries.forEach(function(country) {
      Array.prototype.push.apply(allTerritories, country.territories);
    });

    return allTerritories;
  };

  //----------------------------------------------------------------------------
  this.getAllAgentOverviews = function() {
    var allOverviews = [];

    this.countries.forEach(function(country) {
      allOverviews.push(country.getAgentOverview());
    });

    return allOverviews;
  };

  //----------------------------------------------------------------------------
  // Handle a user clicking on a Country object
  function onCountryClick(country) {
    country.outline.stroke({width:country.outlineStrokeWidth * 2});
    $('#map').trigger('countryClicked', country);
  }

  //----------------------------------------------------------------------------
  // Handle a user's mouse entering a Country object
  function onCountryMouseOver(country) {
    if (self.currentHoveredCountry) {
      onCountryMouseOut(self.currentHoveredCountry);
    }

    self.currentHoveredCountry = country;

    country.outline.animate(100, '>').stroke({width:country.outlineStrokeWidth * 2});
    country.bringToFront();
    $('#map').trigger('countryMouseOver', country);
  }

  //----------------------------------------------------------------------------
  // Handle a user's mouse leaving a Country object
  function onCountryMouseOut(country) {
    self.currentHoveredCountry = null;

    country.outline.animate(100, '>').stroke({width:country.outlineStrokeWidth});
    $('#map').trigger('countryMouseOut', country);
  }

  var setupCountryClicker = function(svgElem, country) {
    // Redirect mouse events for the country background to deliver information about that country
    svgElem.click(function(event) {
      event.cancelBubble = true; // Don't let the map get this click event
      onCountryClick(country);
    });
    svgElem.mouseover(function() { onCountryMouseOver(country); });
    svgElem.mouseout(function() { onCountryMouseOut(country); });
  }

  //----------------------------------------------------------------------------
  // Initialize the GameCountry with the given SVG country object
  var processLoadedCountry = function(countryGroup) {
    var newCountry = new GameCountry(countryGroup);
    var children = countryGroup.children();
    var outline;

    // gather the territories and the country outline
    for (i = 0; i < children.length; ++i) {
      var svgChild = children[i];
      if (svgChild instanceof SVG.Path) {
        // Store the outline separately
        if (svgChild.node.id.indexOf("outline") !== -1) {
          newCountry.addOutline(svgChild);

          // save the outline so we can reparent it after the loop
          outline = svgChild;
        } else {
          setupCountryClicker(svgChild, newCountry);

          // Remove the stroke on the country's path element since the outline takes care of that
          newCountry.fill = svgChild;
          svgChild.attr('stroke-width', 0);
        }
      }
      else if (svgChild instanceof SVG.G) {
        if (svgChild.node.id.indexOf('Agents') !== -1) {
          processLoadedAgent(svgChild, newCountry);
        } else if (svgChild.node.id.indexOf('merson') !== -1) {
          processLoadedDistrict(svgChild, newCountry);
        }
      }
      else if (svgChild instanceof SVG.Text) {
        newCountry.name = svgChild.node.textContent;
        newCountry.abbreviation = svgChild.node.id;
        setupCountryClicker(svgChild, newCountry);
      }
      else if (svgChild instanceof SVG.Ellipse) {
        newCountry.controlIcon = svgChild;
        setupCountryClicker(svgChild, newCountry);
      }
    }

    setupCountryClicker(countryGroup, newCountry);

    // Make sure the outlines show up correctly (not thin)
    newCountry.bringToFront();

    // Assuming the map root is one step down
    if (outline) {
      self.svgDoc.children()[0].add(outline);
    }

    newCountry.nationIndex = self.countries.length;
    self.countries.push(newCountry);
  };

  //----------------------------------------------------------------------------
  var processLoadedDistrict = function(districtGroup, parentCountry) {
    var newDistrict = null;
    var newText = null;
    var children = districtGroup.children();
    var i;

    // gather the territories and the country outline
    for (i = 0; i < children.length; ++i) {
      var svgChild = children[i];
      // Store the text anchor if this is it (can be any type)
      if (svgChild instanceof SVG.Polygon) {
        if (newText === null) {
          newText = new SVG.Text();
          newText.text('0');
          newText.move(svgChild.x() + 10, svgChild.y() + 35);
          newText.attr('font-weight', 'bold');
          newText.attr('text-anchor', 'middle');
          newText.attr('font-size', 40);
          newText.attr('fill', '#000000');
          districtGroup.add(newText);

          svgChild.remove();
        } else {
          alert('found more than one text anchor for district');
        }
      }
      // Get the outline and territories (must be paths)
      else if (svgChild instanceof SVG.Path) {
        if (newDistrict === null) {
          newDistrict = new GameTerritory(svgChild);
          parentCountry.territories.push(newDistrict);

          // Make it easy to look up the country by node id later
          self.utility.associateTerritoryWithCountry(svgChild.node.id, parentCountry);
        } else {
          alert('invalid map layout: multiple districts where only 1 is expected');
        }
      }
    }

    newDistrict && (newDistrict.svgText = newText);

     // Redirect mouse events for each territory to deliver information about the country that contains them
    if (newDistrict !== null && newText !== null) {
      setupCountryClicker(newDistrict.svgObj, parentCountry);
      setupCountryClicker(newText, parentCountry);
    }
  };

  //----------------------------------------------------------------------------
  var processLoadedAgent = function(agentGroup, parentCountry) {
    var children = agentGroup.children();

    // gather all of the agent anchors.
    for (var i = 0; i < children.length; ++i) {
      var svgChild = children[i];
      if (svgChild instanceof SVG.Polygon) {
        var player = 0;
        if (svgChild.node.id.indexOf('m1_') !== -1) {
          player = self.currentPlayerIndex;
        } else if (svgChild.node.id.indexOf('m2_') !== -1) {
          player = self.currentPlayerIndex === 1 ? 0 : 1;
        } else if (svgChild.node.id.indexOf('m3_') !== -1) {
          player = self.currentPlayerIndex === 2 ? 0 : 2;
        } else if (svgChild.node.id.indexOf('m4_') !== -1) {
          player = self.currentPlayerIndex === 3 ? 0 : 3;
        }

        var index = 0;
        if (svgChild.node.id.indexOf('_1') !== -1) {
          index = 0;
        } else if (svgChild.node.id.indexOf('_2') !== -1) {
          index = 1;
        } else if (svgChild.node.id.indexOf('_3') !== -1) {
          index = 2;
        }

        parentCountry.anchor[player][index] = svgChild;
        svgChild.style('visibility', 'hidden');
      }
    }
  };

  //----------------------------------------------------------------------------
  // Setup the Map properties when the SVG file is done loading
  var onSvgLoadComplete = function(svg) {
    var bounds = getMapBounds.call(this, svg);

    // Get references to everything we care about
    var roots = svg.roots()[0].children();
    for (var i in roots) {
      var propName = roots[i].node.id;
      if (roots[i] instanceof SVG.G) {
        if (propName.indexOf("Nation") !== -1) {
          processLoadedCountry.call(this, roots[i]);
        } else if (propName === "continent") {
          this.background = roots[i];
          this.background.node.style.pointerEvents = 'none';
        }
      }
    }

    this.coords.x = bounds.minX;
    this.coords.y = bounds.minY;
    this.coords.width = bounds.width();
    this.coords.height = bounds.height();

    intersectionRect = self.svgDoc.node.createSVGRect();
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
}
