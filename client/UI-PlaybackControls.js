/*******************************************************************************
 *
 ******************************************************************************/
function PlaybackControls (rootElement, goToStartInHistoryCB, stepBackInHistoryCB, stepForwardInHistoryCB, goToCurrentInHistoryCB) {
  'use strict';

  this.goToStartCB = goToStartInHistoryCB;
  this.stepBackCB = stepBackInHistoryCB;
  this.stepForwardCB = stepForwardInHistoryCB;
  this.goToCurrentCB = goToCurrentInHistoryCB;

  //-----------------------------------------------------------------------------
  this.goToStart = function () {
    if (!$(".playbackStart").attr('disabled')) {
      self.goToStartCB();
      $(document).trigger('PlaybackButtonClicked');
    }
  };

  //-----------------------------------------------------------------------------
  this.stepBack = function () {
    if (!$(".playbackBack").attr('disabled')) {
      self.stepBackCB();
      $(document).trigger('PlaybackButtonClicked');
    }
  };

  //-----------------------------------------------------------------------------
  this.stepForward = function () {
    if (!$(".playbackForward").attr('disabled')) {
      self.stepForwardCB();
      $(document).trigger('PlaybackButtonClicked');
    }
  };

  //-----------------------------------------------------------------------------
  this.goToCurrent = function () {
    if (!$(".playbackEnd").attr('disabled')) {
      self.goToCurrentCB();
      $(document).trigger('PlaybackButtonClicked');
    }
  };

  //----------------------------------------------------------------------------
  var self = this;
  var playbackElement = '<div class="playbackControlsContainer">\
                    <div class="playbackButton playbackStart"><div class="iconOverlay"></div></div>\
                    <div class="playbackButton playbackBack"><div class="iconOverlay"></div></div>\
                    <div class="playbackCurrentState"><p class="playbackCurrentStateText"></p></div>\
                    <div class="playbackButton playbackForward"><div class="iconOverlay"></div></div>\
                    <div class="playbackButton playbackEnd"><div class="iconOverlay"></div></div>\
                    </div>';

  var $playbackDiv = $(playbackElement);
  $playbackDiv.children('.playbackStart').click(this.goToStart);
  $playbackDiv.children('.playbackBack').click(this.stepBack);
  $playbackDiv.children('.playbackForward').click(this.stepForward);
  $playbackDiv.children('.playbackEnd').click(this.goToCurrent);

  this.$turnIndicator = $playbackDiv.children('.playbackCurrentState').children('.playbackCurrentStateText');

  rootElement.append($playbackDiv);

  //----------------------------------------------------------------------------
  this.hide = function () {
    $playbackDiv.hide();
  };

  //----------------------------------------------------------------------------
  this.setTooltips = function () {
    new Opentip($(".playbackStart")[0], TOOLTIPS.PLAYBACK.START.TEXT, TOOLTIPS.PLAYBACK.START.TITLE);
    new Opentip($(".playbackBack")[0], TOOLTIPS.PLAYBACK.BACK.TEXT, TOOLTIPS.PLAYBACK.BACK.TITLE);
    new Opentip($(".playbackCurrentState")[0], TOOLTIPS.PLAYBACK.CURRENT.TEXT, TOOLTIPS.PLAYBACK.CURRENT.TITLE);
    new Opentip($(".playbackForward")[0], TOOLTIPS.PLAYBACK.FORWARD.TEXT, TOOLTIPS.PLAYBACK.FORWARD.TITLE);
    new Opentip($(".playbackEnd")[0], TOOLTIPS.PLAYBACK.END.TEXT, TOOLTIPS.PLAYBACK.END.TITLE);
  };

  //----------------------------------------------------------------------------
  this.setCurrentTurnNumber = function (stateNum) {
    this.$turnIndicator.text(stateNum);
  };

  //-----------------------------------------------------------------------------
  this.enableBackButtons = function (enabled) {
    $(".playbackStart").attr('disabled', !enabled);
    $(".playbackStart").children('.iconOverlay').attr('disabled', !enabled);
    $(".playbackBack").attr('disabled', !enabled);
    $(".playbackBack").children('.iconOverlay').attr('disabled', !enabled);
  };

  //-----------------------------------------------------------------------------
  this.enableForwardButtons = function (enabled) {
    $(".playbackForward").attr('disabled', !enabled);
    $(".playbackForward").children('.iconOverlay').attr('disabled', !enabled);
    $(".playbackEnd").attr('disabled', !enabled);
    $(".playbackEnd").children('.iconOverlay').attr('disabled', !enabled);
  };

  //-----------------------------------------------------------------------------
  this.toggleVisibility = function(enabled) {
    (enabled) ? $playbackDiv.show(): $playbackDiv.hide();
  }

  //----------------------------------------------------------------------------
  self.setCurrentTurnNumber("");
}