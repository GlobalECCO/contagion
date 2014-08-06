
cd client
call uglifycss^
 ../lib/opentip.css^
 stylesheet-ActionBar.css^
 stylesheet-ActionList.css^
 stylesheet-ActionPointsAnimator.css^
 stylesheet-AgentOverview.css^
 stylesheet-Common.css^
 stylesheet-EndGameScreen.css^
 stylesheet-HelpPanel.css^
 stylesheet-InfoPanel.css^
 stylesheet-MessageTypeSelector.css^
 stylesheet-OptionsPanel.css^
 stylesheet-PlaybackControls.css^
 stylesheet-PlayerSetup.css^
 stylesheet-PlayerStatus.css^
 stylesheet-ScopeSelector.css^
 stylesheet-TargetSelector.css^
 > ../build/styles.min.css
cd..
cd lib
call uglifyjs^
 opentip-native.js^
 jquery-2.0.3.js^
 jquery-ui-1.10.3.js^
 howler.js^
 svg.js^
 svg.import.js^
 svg.easing.js^
 -o ../build/libs.min.js
cd ..
cd shared
call uglifyjs^
 actionTypes.js^
 actionParser.js^
 actionScope.js^
 agents.js^
 gamePhase.js^
 ideologyTypes.js^
 utilFunctions.js^
 -o ../build/shared.min.js
cd ..
cd client
call uglifyjs^
 game.options.js^
 game.territory.js^
 game.country.js^
 game.map.js^
 game.map.animator.js^
 game.audio.js^
 tooltips-Common.js^
 UI-ActionBar.js^
 UI-Actionlist.js^
 UI-ActionPointsAnimator.js^
 UI-AgentOverview.js^
 UI-CountryControlIndicator.js^
 UI-EndGameScreen.js^
 UI-HelpPanel.js^
 UI-InfoPanel.js^
 UI-MessageTypeSelector.js^
 UI-OptionsPanel.js^
 UI-PlaybackControls.js^
 UI-PlayerStatus.js^
 UI-PlayerSetup.js^
 UI-ScopeSelector.js^
 UI-TargetSelector.js^
 UI.js^
 controller.js^
 -o ../build/game.min.js
cd ..
