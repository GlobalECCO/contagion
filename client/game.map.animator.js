/*******************************************************************************
 * Functions that animate the map.
 ******************************************************************************/

function GameMapAnimator(mapObj) {
  'use strict';
  var map = mapObj;
  var pulseID;
  var animating = false;
  var toggle = false;

  //----------------------------------------------------------------------------
  this.isAnimating = function() {
    return animating;
  }

  //----------------------------------------------------------------------------
  // Choose an appropriate next animation and play it
  this.animate = function() {
    var success;

    if (toggle) {
      success = this.animateMapJiggle();
    } else {
      success = this.animateMapSplitApart();
    }

    if (success) {
      toggle = !toggle;
    }
  }

  //----------------------------------------------------------------------------
  // Animate the Map to do a little dance when it pops up
  this.animateMapScaleIn = function() {

    if (animating) {
      return false;
    }

    stopOutlinePulse();
    animating = true;
    var numFinishedAnimating = 0, i, fx;

    // Hide the background and allow it to fade in later
    map.background.opacity(1.0);

    // 'this' is equal to the element
    map.background.each(function() {
      this.opacity(0.0);
      this.stroke({color:'#000', opacity:0.0, width:15});
    });

    for (i = 0; i < map.countries.length; ++i) {
      map.countries[i].svgObj.scale(0, 0);
      map.countries[i].outline.attr('opacity', 0);
      fx = map.countries[i].svgObj.animate(500 + Math.random() * 500, SVG.easing.backOut);

      fx.opacity(1.0).scale(1, 1).after(function() {
        if (++numFinishedAnimating === map.countries.length) {
          fadeInOutlines(750, 0);
          map.background.each(function() {
            // animate the background border
            var backgroundPath = this;
            var strokeAttr = {color:'#000', opacity:1.0, width:60};
            backgroundPath.opacity(1.0);
            backgroundPath.animate(1000, SVG.easing.bounce).stroke(strokeAttr);
          });

          startOutlinePulse(1000);

          setTimeout(function() {
            animating = false;
          }, 1000);
        }
      });
    }

    return true;
  };

  //----------------------------------------------------------------------------
  // Animate the Map to do a little dance when it pops up
  this.animateMapJiggle = function() {

    if (animating) {
      return false;
    }

    animating = true;

    // smoothly fade in, smoothly fade out

    var fadeInDuration = 200;
    var fadeOutDuration = 1000;
    var animDuration = 1000;
    var animsComplete = 0;
    var fadeOutStart = animDuration - fadeOutDuration;

    for (var i = 0; i < map.countries.length; ++i) {

      var sinOffset = Math.random() * 1000;
      map.countries[i].outline.attr('opacity', 0);

      (function(startTime, sinOffset) {

        var country = map.countries[i].svgObj;

        var id = window.setInterval(function() {
          var elapsed = Date.now() - startTime;
          var fadeIn = Math.min(elapsed / fadeInDuration, 1);
          var fadeOut = 1.0 - Math.max((elapsed - fadeOutStart) / fadeOutDuration, 0);
          var scaleOffset = Math.abs(Math.sin(elapsed * 0.005 + sinOffset) * 0.1);
          scaleOffset *= fadeIn * fadeOut;

          if (elapsed > animDuration) {
            scaleOffset = 0;
            window.clearInterval(id);
            animating = false;

            if (++animsComplete === map.countries.length) {
              fadeInOutlines(750, 0);
            }
          }

          country.scale(1 + scaleOffset, 1 + scaleOffset);

        }, 16);
      })(Date.now(), sinOffset);
    }

    return true;
  };

  //----------------------------------------------------------------------------
  // Make the map split apart and then come back together
  this.animateMapSplitApart = function() {

    if (animating) {
      return false;
    }

    animating = true;
    stopOutlinePulse();

    // Hide the background and allow it to fade in later
    map.background.opacity(1.0);

    // 'this' is equal to the element
    map.background.each(function() {
        this.opacity(0.0);
        this.stroke({color:'#000', opacity:0.0, width:15});
    });

    var bounds = map.background.bbox();
    var directions = [];
    var i;

    // Get directions away from the center for every country
    for (i = 0; i < map.countries.length; ++i) {
      var countryBounds = map.countries[i].svgObj.bbox();
      var dx = countryBounds.cx - bounds.cx;
      var dy = countryBounds.cy - bounds.cy;

      // normalize the direction
      var length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;

      directions.push({x:dx, y:dy, size: length});
    }

    // Things farther from the center will move farther away than things closer
    var extraOffset;
    var newX, newY;
    var startX, startY;
    var svgObj, svgObjOutline;
    var animsComplete = 0, outlineAnimsComplete = 0;

    for (i = 0; i < map.countries.length; ++i) {
      svgObj = map.countries[i].svgObj;
      map.countries[i].outline.attr('opacity', 0);

      startX = svgObj.x();
      startY = svgObj.y();

      extraOffset = directions[i].size / 5;

      newX = directions[i].x * extraOffset;
      newY = directions[i].y * extraOffset;

      svgObj.animate(500, SVG.easing.elastic).move(newX, newY).after(function() {
        var x = startX;
        var y = startY;
        if (++animsComplete === map.countries.length) {
          fadeInOutlines(1000, 400);

          for (var i = 0; i < map.countries.length; ++i) {
              svgObj = map.countries[i].svgObj;
              svgObj.animate(300, SVG.easing.backOut, 100).move(x, y);
          }

          if (map.background.children().length == 1) {
            var svgChild = map.background.children()[0];
            var animator = svgChild.animate(1000, SVG.easing.bounce, 400);
            animator.stroke({color:'#000', opacity:1.0, width:60}).during(function() { this.opacity(1.0); }).after(function() {
              startOutlinePulse(); animating = false;
            });
          }
        }
      });
    }

    return true;
  };

  //----------------------------------------------------------------------------
  this.animateSlideLeft = function(offscreenCB, backOnscreenCB) {
    return animateSlide(-1, offscreenCB, backOnscreenCB);
  }

  //----------------------------------------------------------------------------
  this.animateSlideRight = function(offscreenCB, backOnscreenCB) {
    return animateSlide(1, offscreenCB, backOnscreenCB);
  }

  //----------------------------------------------------------------------------
  var animateSlide = function(direction, offscreenCB, backOnscreenCB) {
    if (animating) {
      offscreenCB && offscreenCB();
      backOnscreenCB && backOnscreenCB();
      return false;
    }

    animating = true;

    var dx = direction * 2 * map.svgDoc.bbox().width;
    var wholemap = map.svgDoc.children()[0];

    wholemap.animate(400, '-').move(dx, 0).after(function() {
      offscreenCB && offscreenCB();
      wholemap.move(-2 * dx);
      wholemap.animate(800, '>').move(0, 0).after(function() {
        animating = false;
        backOnscreenCB && backOnscreenCB();
      });
    });

    return true;
  }

  //----------------------------------------------------------------------------
  var startOutlinePulse = function(delay) {

    if (delay > 0) {
      setTimeout(startOutlinePulse, delay);
      return;
    }

    var startTime = Date.now();
    pulseID = setInterval(function() {
      map.background.each(function() {
          // animate the background border
          var backgroundPath = this;
          var newWidth = 50 + Math.cos((Date.now() - startTime) * 0.002) * 10;
          var strokeAttr = {color:'#000', opacity:1.0, width:60};
          strokeAttr.width = newWidth;
          backgroundPath.stroke(strokeAttr);
        }, 16);
      });
  }

  //----------------------------------------------------------------------------
  var stopOutlinePulse = function() {
    if (pulseID !== undefined) {
      clearInterval(pulseID);
      pulseID = undefined;
    }
  }

  //----------------------------------------------------------------------------
  var fadeInOutlines = function(time, delay) {
    for (var i = 0; i < map.countries.length; ++i) {
      map.countries[i].outline.attr('opacity', 0);
      map.countries[i].outline.animate(time, SVG.easing.backOut, delay).attr('opacity', 1.0);
    }
  }

}





