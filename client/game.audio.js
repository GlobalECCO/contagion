/*******************************************************************************
 * Controls audio playback in response to game events
 ******************************************************************************/
(function GameAudio() {
  'use strict';

  var clickSound = new Howl({
    urls:['audio/tap-resonant.mp3']
  });

  var slideSound = new Howl({
    urls:['audio/slide-scissors.mp3']
  });

  var whooshSound = new Howl({
    urls:['audio/air_whoosh.mp3']
  });

  var backgroundMusic = new Howl({
    urls:['audio/The-Complex-30s.mp3'],
    onplay: function() { this.fade(0.5, 0, 10000); }
  });

  var newRoundMusic = new Howl({
    urls:['audio/danosongs.com-magicghost.mp3']
  });

  var turnSubmitSound = new Howl({
    urls:['audio/pill-bottle-2.mp3']
  });

  var cancelSound = new Howl({
    urls:['audio/button-15.mp3']
  });

  // ---------------------------------------------------------------------------
  $(document).on('AudioEnabled', function(e, enableAudio) {
    gameOptions.enableAudio = enableAudio;

    // stop any longer playing sounds that might have already started
    if (!enableAudio) {
      backgroundMusic.stop();
      newRoundMusic.stop();
    }
  });

  // ---------------------------------------------------------------------------
  $(document).on('GameSetup', function() {
    gameOptions.enableAudio && backgroundMusic.play();
  });

  // ---------------------------------------------------------------------------
  $(document).on('NewRound', function() {
    gameOptions.enableAudio && newRoundMusic.play();
  });

  // ---------------------------------------------------------------------------
  $(document).on('ButtonClicked', function() {
    gameOptions.enableAudio && clickSound.play();
  });

  // ---------------------------------------------------------------------------
  $(document).on('PlaybackButtonClicked', function() {
    gameOptions.enableAudio && whooshSound.play();
  });

  // ---------------------------------------------------------------------------
  $(document).on('ActionSubmitted', function() {
    gameOptions.enableAudio && slideSound.play();
  });

  // ---------------------------------------------------------------------------
  $(document).on('ActionCanceled', function() {
    gameOptions.enableAudio && cancelSound.play();
  });

  // ---------------------------------------------------------------------------
  $(document).on('MessageTypeClicked', function() {
    gameOptions.enableAudio && clickSound.play();
  });

  // ---------------------------------------------------------------------------
  $(document).on('TurnSubmitted', function() {
    gameOptions.enableAudio && turnSubmitSound.play();
  });
})();


