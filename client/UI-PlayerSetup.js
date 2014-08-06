/*******************************************************************************
 *
 ******************************************************************************/
function PlayerSetup ($root, availableColors, availableIdeologies, setupCompleteCB)
{
  'use strict';
  var hasIdeologyBeenFocused = false;
  var self = this;
  var $divParent = $root;
  var $divText = $(' \
    <div id="playerSetupRoot"> \
      <div class="playerSetupContainer"> \
        <div class="playerSetupTopBar"> \
          <p class="playerSetupHeaderText">PLAYER INFORMATION</p> \
        </div> \
        <div class="ideologyNameRoot"> \
          <div class="textLabelIdeologyName">Ideology Name:</div> \
          <input id="ideologyNameInput" class="textInputField" value="" maxlength="15"></input> \
        </div> \
        <div class="ideologyTypeRoot"> \
          <div class="textLabelIdeologyType">Ideology Type:</div> \
          <select class="comboIdeologyType"> \
          </select> \
        </div> \
        <div class="colorPickRoot"> \
          <div class="colorPickLabel">Color:</div> \
          <span id="colorRadioButtons"> \
          </span> \
        </div> \
        <div class="submitRoot"> \
          <button id="playerSetupSubmitButton" class="submitButton">Submit</button> \
        </div> \
       </div> \
    </div>');

  $root.append('<div class="gamelogoContainer"><div class="gamelogo"></div></div>');
  $root.append($divText);

  this.updateOptions(availableIdeologies, availableColors);

  // No default ideology type should be set
  $('.comboIdeologyType').prop('selectedIndex', -1);

  var defaultName = $('#ideologyNameInput').val();

  //--------------------------------------------------------------------------
  this.remove = function() {
    // remove the dialogue
    $('#playerSetupRoot').remove();
    $('.gamelogoContainer').remove();
  };

  //--------------------------------------------------------------------------
  $('.textInputField').focus(function() {
    if (!hasIdeologyBeenFocused) {
      this.value = "";
      hasIdeologyBeenFocused = true;
    }
  });

  //--------------------------------------------------------------------------
  $('#playerSetupSubmitButton').click(function() {

    if (!$('#ideologyNameInput').val() || $('#ideologyNameInput').val() === defaultName) {
      alert('Please enter a name.');
      return;
    }

    if ($('.comboIdeologyType').prop('selectedIndex') === -1) {
      alert('Please select your ideology type.');
      return;
    }

    if ($('#colorRadioButtons > input[name=colorSet]:checked').size() === 0) {
      alert('Please select a color.');
      return;
    }

    var color = $('#colorRadioButtons > input[name=colorSet]:checked + label')[0].style.borderColor;
    color = self.getHexFromRgb(color);

    setupCompleteCB({
      ideologyName: $('#ideologyNameInput').val(),
      ideologyType: $('.comboIdeologyType :selected').val(),
      color: color
    });
  });
}

//--------------------------------------------------------------------------
PlayerSetup.prototype.hex = function(x) {
  return ("0" + parseInt(x).toString(16)).slice(-2);
};

//--------------------------------------------------------------------------
PlayerSetup.prototype.getHexFromRgb = function(color) {
  if (color.indexOf('rgb') !== -1) {
    color = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    color = "#" + this.hex(color[1]) + this.hex(color[2]) + this.hex(color[3]);
    return color.toUpperCase();
  }
};

//--------------------------------------------------------------------------
PlayerSetup.prototype.updateOptions = function(availableIdeologies, availableColors) {
  var $selectedIdeology = $('.comboIdeologyType').val();
  var $selectedColor = $('#colorRadioButtons input[name=colorSet]:checked + label');
  var hexColor = ($selectedColor.length > 0) && this.getHexFromRgb($selectedColor[0].style.borderColor);

  $('.comboIdeologyType').empty();
  $('#colorRadioButtons').empty();

  var foundMatchingIdeologySelection = false;

  availableIdeologies.forEach(function(type) {
    var option = $('<option value="' + type + '">' + type + '</option>');
    var matches = type === $selectedIdeology;
    option.prop('selected', matches);
    $('.comboIdeologyType').append(option);
    foundMatchingIdeologySelection = foundMatchingIdeologySelection || matches;
  });

  // <select> has to be forced to be blank
  if ($selectedIdeology === null || !foundMatchingIdeologySelection) {
    // If nothing has been chosen yet, keep it blank
    $('.comboIdeologyType').prop('selectedIndex', -1);
  }

  // Dynamically create a color radio button for each available color
  availableColors.forEach(function(color) {
    var colorName = color.slice(1).toUpperCase();
    var input = $('<input type="radio" id="' + colorName + '" name="colorSet" class="colorRadio" type="radio" >');
    var label = $('<label for="' + colorName + '"></label>');
    input.prop('checked', (hexColor.length > 0) && hexColor.indexOf(colorName) !== -1);
    $('#colorRadioButtons').append(input).append(label);
    $('#' + colorName + ' + LABEL').css("border-color", color).css("background", color);
  });
};
