/*******************************************************************************
 * Util functions used by multiple client classes
 ******************************************************************************/
//----------------------------------------------------------------------------
// Get the center position of the given SVG object in screen coordinates
this.getCenter = function(svgObj) {
  var svg = document.getElementsByTagName('svg')[0];
  var pt = svg.createSVGPoint();
  var top;

  pt.x = svgObj.cx();
  pt.y = svgObj.cy();
  pt = pt.matrixTransform(svgObj.node.getScreenCTM());

  // Fix positioning of the agent overviews if the window has been scrolled.
  top = window.pageYOffset;
  pt.y += top;
  return pt;
};
