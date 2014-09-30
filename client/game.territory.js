/*******************************************************************************
 * An Object representing a territory
 ******************************************************************************/
function GameTerritory(svgObj) {
  'use strict';
  this.svgObj = svgObj;
  this.svgText = null;

  var id = -1;

  //----------------------------------------------------------------------------
  this.getName = function() {
    return this.svgObj.node.id;
  };

  //----------------------------------------------------------------------------
  // Get the center position of the Territory in screen coordinates
  this.getCenter = function() {
    return getCenter(this.svgObj);
  };

  //----------------------------------------------------------------------------
  // Set the Territory's outline color as a hex string '#0123456'
  this.setOutline = function(color, strokeWidth, makeDarker) {
    var darknessFactor = 0.6;
    makeDarker = true && makeDarker;
    this.svgObj.attr('stroke-width', strokeWidth);
    if (makeDarker) {

      var strokeColor = {r: '', g: '', b: ''};

      // separate each color component and convert hex to decimal
      strokeColor['r'] = parseInt(color.slice(1,3), 16);
      strokeColor['g'] = parseInt(color.slice(3,5), 16);
      strokeColor['b'] = parseInt(color.slice(5), 16);

      // reduce each color by a factor of 'darknessFactor' and convert back to hex as string
      for (var component in strokeColor) {
        strokeColor[component] = Math.floor(strokeColor[component] * darknessFactor);
        strokeColor[component] = strokeColor[component].toString(16);
        strokeColor[component] = strokeColor[component].length < 2 ? "0" + strokeColor[component] : strokeColor[component];
      };

      //concatenate all separated color components
      var strokeColorString = '#'.concat();
      for (var component in strokeColor) {
        strokeColorString = strokeColorString.concat(strokeColor[component]);
      };

      // set stroke color
      this.svgObj.stroke(strokeColorString);
    }
    else {
      this.svgObj.stroke(color);
    }
  };

  //----------------------------------------------------------------------------
  // Set the Territory's fill color as a hex string '#0123456'
  this.setColor = function(color, fadeTime) {
    if (fadeTime === undefined) {
      fadeTime = 1000;
    }
    this.svgObj.animate(fadeTime).fill(color);
  };

  //----------------------------------------------------------------------------
  // Pulse existing color to white, then back to the supplied color
  function pulseAnimation(object, color) {
    object.animate(400).fill('#ffffff').after(function () {
      object.animate(500).fill(color);
    });
  }

  //----------------------------------------------------------------------------
  // Highlight the territory by pulsing its color
  this.highlight = function(shouldHighlight, color) {
    if (shouldHighlight) {
      var whatsThis = this;

      if (id !== -1) {
        clearInterval(id);
      }

      //pulse the territory color from the supplied color to white and back
      pulseAnimation(whatsThis.svgObj, color);
      id = setInterval(function () {
        pulseAnimation(whatsThis.svgObj, color);
      }, 1000);
    }
    else if (id !== -1) {
      //stop pulsing and animate back to the supplied color
      clearInterval(id);
      id = -1;
      this.svgObj.stop();
      this.svgObj.animate(500).fill(color);
    }
  };

  //----------------------------------------------------------------------------
  // Set the Territory's color as a hex string '#0123456'
  this.setText = function(newText) {
    this.svgText.text(newText);
    if (newText === '0') {
      this.svgText.style('visibility', 'hidden');
    }
    else {
      this.svgText.style('visibility', 'visible');
    }
  };
}
