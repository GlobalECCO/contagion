function MoveArrow (mapDiv) {

  var self = this;
  this.mapDiv = mapDiv;

  var arrowDiv = '<div class="moveArrowContainer"></div>';
  var $arrowDiv;
  var $root;

  var id = -1;

  this.show = function (centerFrom, centerTo) {
    $arrowDiv = $(arrowDiv);
    $root = $(mapDiv);
    $root.append($arrowDiv);
    var length = Math.sqrt(Math.pow((centerFrom.x - centerTo.x),2) + Math.pow((centerFrom.y - centerTo.y),2))
    var theta = (centerTo.y > centerFrom.y ? 1 : -1) * ((Math.acos((centerTo.x - centerFrom.x) / length)) * (180/Math.PI));

    $arrowDiv.css('left', centerFrom.x.toString() + 'px');
    $arrowDiv.css('top', centerFrom.y.toString() + 'px');
    $arrowDiv.css('width', length.toString() + 'px');
    $arrowDiv.css('transform-origin', 'left center');
    $arrowDiv.css('transform', 'rotate(' + theta.toString() + 'deg)');

    // from spritely js lib
    $arrowDiv.pan({fps: 30, speed: 1.5, dir: 'right'});
  }

  this.remove = function () {
    if ($root) {
      $arrowDiv.destroy();
      $root.find('.moveArrowContainer').remove();
    };
  };
}
