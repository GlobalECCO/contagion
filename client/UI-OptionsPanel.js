function OptionsPanel (rootElement) {
  'use strict';

  //var self = this;
  var optionsPanelElement = '<div class="optionsPanelContainer">\
                    <div class="optionsPanelButton btnSoundToggleOn" id="toggleAudio"><div class="iconOverlay"></div></div>\
                    <div class="optionsPanelButton btnTooltipsToggleOn" id="toggleTips"><div class="iconOverlay"></div></div>\
                    <div class="optionsPanelButton btnChatToggleOff" id="toggleChat"><div class="iconOverlay"></div></div>\
                    </div>';

  var $optionsPanel = $(optionsPanelElement);
  var $toggleAudio = $optionsPanel.children('#toggleAudio');
  var $toggleTips = $optionsPanel.children('#toggleTips');
  $toggleAudio.click(onAudioToggle);
  $toggleTips.click(onTooltipToggle);
  rootElement.append($optionsPanel);

  // See if we were supposed to be enabled or not
  if (supportsLocalStorage()) {
    setInitialOptionStatus($toggleAudio, localStorage.audioEnabled, onAudioToggle);
    setInitialOptionStatus($toggleTips, localStorage.tooltipsEnabled, onTooltipToggle);
  }

  //----------------------------------------------------------------------------
  this.setTooltips = function() {
    new Opentip($('#toggleAudio')[0], TOOLTIPS.OPTIONS.SOUNDS.TEXT, TOOLTIPS.OPTIONS.SOUNDS.TITLE);
    new Opentip($('#toggleTips')[0], TOOLTIPS.OPTIONS.TOOLTIPS.TEXT, TOOLTIPS.OPTIONS.TOOLTIPS.TITLE);
    new Opentip($('#toggleChat')[0], TOOLTIPS.OPTIONS.CHAT.TEXT, TOOLTIPS.OPTIONS.CHAT.TITLE);
  };

  //----------------------------------------------------------------------------
  function onAudioToggle() {
    var enableAudio = !gameOptions.enableAudio;
    var newClass = (enableAudio) ? 'btnSoundToggleOn': 'btnSoundToggleOff';
    $(this).removeClass('btnSoundToggleOn btnSoundToggleOff');
    $(this).addClass(newClass);
    $(document).trigger('AudioEnabled', enableAudio);
    $(document).trigger('ButtonClicked');
    if (supportsLocalStorage()) {
      localStorage.audioEnabled = enableAudio;
    }
  }

  //----------------------------------------------------------------------------
  function onTooltipToggle() {
    var enableTips = !gameOptions.enableTooltips;
    var newClass = (enableTips) ? 'btnTooltipsToggleOn': 'btnTooltipsToggleOff';
    $(this).removeClass('btnTooltipsToggleOn btnTooltipsToggleOff');
    $(this).addClass(newClass);
    //$(document).tooltip((enableTips) ? 'enable': 'disable');
    Opentip.setEnabled(enableTips);
    $(document).trigger('ButtonClicked');
    gameOptions.enableTooltips = enableTips;
    if (supportsLocalStorage()) {
      localStorage.tooltipsEnabled = enableTips;
    }
  }

  //----------------------------------------------------------------------------
  var onChatToggle = function() {

  }

  // -----------------------------------------------------------------------------
  function supportsLocalStorage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  // -----------------------------------------------------------------------------
  function setInitialOptionStatus(self, option, toggleFunction) {
    if (option !== undefined && option !== 'true') {
      toggleFunction.call(self);
    }
  }
}
