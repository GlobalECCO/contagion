function Tutorial(gameController, initialGameState, playerID) {
  var self = this;
  self.script = [];
  self.timers = [];
  self.step = 0;
  self.background = null;
  self.foreground = null;
  self.buttonContainer = null;

  self.gameController = gameController;
  self.initialGameState = initialGameState;
  self.playerID = playerID;

  self.animationDelay = 1500;
  self.normalDelay = 2000;
  self.clickDelay = 3000;

//----------------------------------------------------------------------------
// Script data structure
//
// [ array for each step of the script
//  {el: <JQuery selector> //these elements will be highlighted
//   action: <JQuery selector> //if undefined, a 'click' on el will move to next tutorial step
//                             //if null, no events on el will be used to proceed to next tutorial step
//                             //if defined, a 'click' on these elements will proceed to the next tutorial step
//   tip: {         //a tooltip to be displayed
//    title: <text> //the text to use as a title for this tip
//    content: <text> //the text to use as context for this tip
//    target: <Jquery selector> //which element this tip will point to.
//                              //if undefined, the el will be used
//    stemLength: <number> //how far away the tool tip will be to the element
//    tipJoint: <(top,middle,bottom) (left, center, right)> //which direction to project the tool tip
//   }
//   grouped: <boolean> //if a bounding box should be rendered around el or not
//   callback: <function> //a callback function that gets called at the end of this tutorial step
//  }

//  //a single step can have multiple elements/tips defined.
//  //E.g. First step has two elements defined, second step has one
// [{el:''},
//  {el:''}],
// {el: ''}
// ]

  //----------------------------------------------------------------------------
  Tutorial.prototype.initTutorialSteps = function(firstGameState) {
    self.script = [
      // Step 1
      [{
        el: 'g[id^="Nation2"]',
        svgElement: true,
        tip: {
          title: 'Contagion',
          content: 'Contagion is a game about spreading ideologies and gaining loyal followers.  Each region of the map has a number of population segments.',
          tipJoint: 'top',
        },
        action: null,
        delay: self.animationDelay,
      },

      {
        el: 'g[id^="merson2"][id*="_5_"]',
        svgElement: true,
        tip: {
          title: 'Loyalty',
          content: 'Each population segment is either neutral or loyal to one player.  The loyalty strength is ' +
                   'between 0 (neutral) and 100 (completely loyal).',
          tipJoint: 'left',
        },
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.countryScore:first',
        tip: {
          title: 'Controlled Regions',
          content: 'You can win the game by controlling a number of regions. ' +
                   'A region is controlled when its entire population has 100 loyalty points.',
          tipJoint: 'left',
          offset: [-5, 5],
        },
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.territoryScore:first',
        tip: {
          title: 'Loyal Population',
          content: 'You can also win the game by gaining loyal population segments. ' +
                   'The population counts towards this condition when it has at least ' + (BalanceValues.TERRITORY_LOYALTY_PERCENT_THRESHOLD * 100).toString() +
                   ' loyalty points.',
          tipJoint: 'top left',
          offset: [-5, -5],
        },
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.action-recruit',
        tip: {
          title: 'Agents',
          content: 'You can place Agents on the map to spread your ideology.  Recruiting an Agent costs ' + BalanceValues.ACTION_RECRUIT_COST.toString() +
                   ' resources and you can have up to ' + BalanceValues.AGENT_MAX_ACTIVE.toString() + ' Agents.',
          tipJoint: 'bottom right',
          offset: [29, 5],
        },
        offset: [-2, -2],
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.action-recruit:first',
        tip: {
          content: 'Click here to recruit your first Agent and place them on the map.',
          tipJoint: 'bottom left',
          offset: [-21, 5],
        },
        offset: [-2, -2],
        delay: self.clickDelay,
      }],

      // Step 2
      [{
        el: '.messageTypeSelectorContainer',
        tip: {
          title: 'Message Types',
          content: 'Each Agent has a message type that determines how they influence loyalty in a region.',
          tipJoint: 'right',
          offset: [0, -20],
        },
        action: null,
      },

      {
        el: '.neutralMessageType',
        tip: {
          title: 'Flexible Message',
          content: 'A flexible message will gain ' + Math.floor(BalanceValues.MESSAGE_FLEXIBLE_LOYALTY_VALUE / BalanceValues.TERRITORY_MAX_LOYALTY * 100).toString() +
                   ' loyalty points for you and reduce the same amount of an opponent\'s loyalty per turn.',
          tipJoint: 'bottom right',
          offset: [15, 0],
        },
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.neutralMessageType:first',
        tip: {
          content: 'Click here to set this Agent to have a flexible message type.',
          tipJoint: 'bottom left',
          offset: [-15, 0],
        },
        delay: self.clickDelay,
      }],

      // Step 3
      [{
        el: 'g[id^="Nation7"]',
        svgElement: true,
        tip: {
          title: 'State Starting Loyalty',
          content: 'The State player starts with ' + Math.floor(1 / BalanceValues.TERRITORY_MAX_LOYALTY * 100).toString() +
                   ' loyalty points in all population segments of one random region.',
          tipJoint: 'right',
        },
        action: null,
      },

      {
        el: 'g[id^="Nation2"]',
        svgElement: true,
        tip: {
          title: 'Non-State Starting Loyalty',
          content: 'Non-State players start with ' + Math.floor(1 / BalanceValues.TERRITORY_MAX_LOYALTY * 100).toString() +
                   ' loyalty points in one population segment of multiple random regions.',
          tipJoint: 'right',
        },
        action: null,
        delay: self.normalDelay,
      },

      {
        el: 'g[id^="Nation5"]',
        svgElement: true,
        tip: {
          content: 'Click to place your Agent here.',
          tipJoint: 'left',
        },
        delay: self.clickDelay,
      }],

      // Step 4
      [{
        el: '.action-recruit:first',
        tip: {
          content: 'Click here to recruit another Agent.',
          tipJoint: 'bottom',
          offset: [5, 10],
        },
        offset: [-2, -2],
      }],

      // Step 5
      [{
        el: '.positiveMessageType',
        tip: {
          title: 'Positive Message',
          content: 'A positive message gains ' + Math.floor(BalanceValues.MESSAGE_FOCUS_LOYALTY_VALUE / BalanceValues.TERRITORY_MAX_LOYALTY * 100).toString() +
                   ' loyalty points from available population per turn, but will have no effect on opponent loyalty.',
          tipJoint: 'bottom right',
          offset: [15, 0],
        },
        action: null,
      },

      {
        el: '.positiveMessageType:first',
        tip: {
          content: 'Click here to set this Agent to have a positive message.',
          tipJoint: 'bottom left',
          offset: [-15, 0],
        },
        delay: self.clickDelay,
      }],

      // Step 6
      [{
        el: 'g[id^="Nation1"]',
        svgElement: true,
        tip: {
          content: 'Click this region to place your Agent here.',
          tipJoint: 'left',
        },
      }],

      // Step 7
      [{
        el: '.infoPanelUserContainer',
        tip: {
          title: 'Turn Order',
          content: 'Players take their turns simultaneously.  The colors here will change when a player has taken their turn.',
          tipJoint: 'top',
        },
        action: null,
      },

      {
        el: '.actionListSubmitTurn',
        tip: {
          content: 'Click here to submit your actions for this turn.'
        },
        offset: [0, -3],
        sizeOffset: [4, 4],
        shallowCopy: true,
        callback: self.startTutorialTurnTwo,
        delay: self.clickDelay,
      }],
    ];
  };

  // -------------------------------------------------------------------------
  Tutorial.prototype.startTutorialTurnTwo = function() {
    self.step = -1;
    self.script = [
      // Step 8
      [{
        el: 'g[id^="Nation5"]',
        svgElement: true,
        tip: {
          title: 'Loyalty Growth: Loyalty Gaining',
          content: 'If there are more neutral population segments than players competing for them in a region, players will start converting neutral population ' +
                   'to their player\'s side.',
          tipJoint: 'bottom',
        },
        delay: self.animationDelay,
        action: null,
      },

      {
        el: '.agentOverviewContainer:eq(4) .agentOverviewAgent',
        action: null,
      },

      {
        el: '.action-shift',
        tip: {
          title: 'Shift Message',
          content: 'This action lets you change an Agent\'s message type.  It costs ' + BalanceValues.ACTION_SHIFT_COST.toString() + ' resource.',
          tipJoint: 'bottom right',
          offset: [29, 5],
        },
        offset: [-2, -2],
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.action-shift:first',
        tip: {
          content: 'Click here now.',
          tipJoint: 'bottom left',
          offset: [-21, 5],
        },
        offset: [-2, -2],
        delay: self.clickDelay,
      }],

      // Step 9
      [{
        el: '.negativeMessageType',
        tip: {
          title: 'Negative Message',
          content: 'A negative message will remove ' + Math.floor(BalanceValues.MESSAGE_FOCUS_LOYALTY_VALUE / BalanceValues.TERRITORY_MAX_LOYALTY * 100).toString() +
                   ' of an opponent\'s loyalty points per turn, but will never gain any loyalty.',
          tipJoint: 'bottom right',
          offset: [15, 0],
        },
        action: null,
      },

      {
        el: '.negativeMessageType:first',
        tip: {
          content: 'Click here to select a negative message type for an Agent.',
          tipJoint: 'bottom left',
          offset: [-15, 0],
        },
        delay: self.clickDelay,
      }],

      // Step 10
      [{
        el: '.agentOverviewContainer:eq(4) .agentOverviewAgent:eq(0)',
        tip: {
          content: 'Click here to change this Agent\'s message type to negative.',
          tipJoint: 'bottom',
        },
        offset: [4, 4],
      }],

      // Step 11
      [{
        el: '.actionListToggleView',
        tip: {
          content: 'Click here to see how resources are generated.',
          tipJoint: 'top right',
        },
        offset: [0, -3],
        sizeOffset: [4, 4],
      }],

      // Step 12
      [{
        el: '.actionListItem-income:eq(2)',
        tip: {
          title: 'Base Income',
          content: 'You generate ' + BalanceValues.BASE_INCOME.toString() + ' resource every turn.',
          tipJoint: 'bottom right',
          stemLength: 20,
          offset: [0, 25],
        },
        action: null,
        delay: self.animationDelay,
      },

      {
        el: '.actionListItem-income:eq(3)',
        tip: {
          title: 'Loyal Population Bonus',
          content: 'You earn bonus resources when you have a certain number of population segments with ' +
                   (BalanceValues.TERRITORY_LOYALTY_PERCENT_THRESHOLD * 100).toString()  +
                   ' or more loyalty points.',
          tipJoint: 'right',
        },
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.actionListItem-income:eq(4)',
        tip: {
          title: 'Agent Upkeep',
          content: 'Each Agent on the map after the first one will cost you 1 resource every turn.  ' +
                   'If you have no Agents on the map, you will generate 1 additional resource each turn.',
          tipJoint: 'top right',
          stemLength: 20,
          offset: [0, -25],
        },
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.actionListToggleView',
        tip: {
          content: 'Click here to see your actions again.',
          tipJoint: 'right',
        },
        offset: [0, -3],
        sizeOffset: [4, 4],
        delay: self.clickDelay,
      }],

      // Step 13
      [{
        el: '.actionListSubmitTurn',
        tip: {
          content: 'Click here to finish your turn.'
        },
        delay: self.animationDelay,
        offset: [0, -3],
        sizeOffset: [4, 4],
        shallowCopy: true,
        callback: self.startTutorialTurnThree,
      }],
    ];

    self.gameController.setNewGameState(self.getSecondTutorialTurn(), self.playerID);
    self.ui.show();
  };

  // -------------------------------------------------------------------------
  Tutorial.prototype.startTutorialTurnThree = function() {
    self.step = -1;
    self.script = [
      // Step 14
      [{
        el: 'g[id^="Nation5"]',
        svgElement: true,
        tip: {
          title: 'Loyalty Growth: Opposing Messages',
          content: 'If two players have opposing messages of equal strength, they will cancel each other out so that no loyalty will change in that region.',
          tipJoint: 'bottom',
        },
        delay: self.animationDelay,
        action: null,
      },

      {
        el: '.agentOverviewContainer:eq(4) .agentOverviewAgent',
        action: null,
      },

      {
        el: '.action-moveagent',
        tip: {
          title: 'Agent Movement',
          content: 'This action allows you to move your Agents on the map.  The cost varies based on which move type you select.',
          tipJoint: 'bottom right',
          offset: [29, 5],
        },
        offset: [-2, -2],
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.action-moveagent:first',
        tip: {
          content: 'Click here now.',
          tipJoint: 'bottom left',
          offset: [-21, 5],
        },
        offset: [-2, -2],
        delay: self.clickDelay,
      }],

      // Step 15
      [{
        el: '.action-move',
        tip: {
          title: 'Move',
          content: 'This action lets you move an Agent from one region to another.  It costs ' + BalanceValues.ACTION_MOVE_COST.toString() + ' resources.',
          tipJoint: 'bottom right',
          offset: [15, 0],
        },
        offset: [-2, -2],
        action: null,
      },

      {
        el: '.action-move:first',
        tip: {
          content: 'Click here to move one of your Agents.',
          tipJoint: 'bottom left',
          offset: [-15, 0],
        },
        offset: [-2, -2],
        delay: self.clickDelay,
      }],

      // Step 16
      [{
        el: '.agentOverviewContainer:eq(4) .agentOverviewAgent:eq(0)',
        tip: {
          content: 'Click here to select this Agent to move.',
          tipJoint: 'bottom',
        },
        offset: [4, 4],
      }],

      // Step 17
      [{
        el: 'g[id^="Nation3"]',
        svgElement: true,
        tip: {
          content: 'Click to move your Agent here.',
          tipJoint: 'left',
        },
      },

      {
        el: '.agentOverviewContainer:eq(2) .agentOverviewAgent',
        suppressHighlightCircle: true,
      }],

      // Step 18
      [{
        el: '.action-attack',
        tip: {
          title: 'Attack',
          content: 'This action lets you take away loyalty from an opponent.  Its cost varies based on its scope.',
          tipJoint: 'bottom right',
          offset: [29, 5],
        },
        offset: [-2, -2],
        action: null,
      },

      {
        el: '.action-attack:first',
        tip: {
          content: 'Click here now.',
          tipJoint: 'bottom left',
          offset: [-21, 5],
        },
        offset: [-2, -2],
        delay: self.clickDelay,
      }],

      // Step 19
      [{
        el: '.scopeSelectorContainer',
        tip: {
          title: 'Action Scope',
          content: 'This action has a scope that affects both costs and effectiveness.',
          tipJoint: 'right',
          offset: [0, -20],
        },
        action: null,
      },

      {
        el: '.localScopeButton',
        tip: {
          title: 'Focused',
          content: 'A focused attack will occur in a single region with at least one Agent with a negative or flexible message.  The attack will be ' +
                   Math.floor(BalanceValues.SCOPE_FOCUSED_INFLUENCE * 100).toString() + '% as strong as the normal Agents\' effect.  It costs ' +
                   BalanceValues.ACTION_ATTACK_COST.toString() + ' resources.',
          tipJoint: 'bottom right',
          offset: [15, 0],
        },
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.localScopeButton:first',
        tip: {
          content: 'Click here to perform a focused attack.',
          tipJoint: 'bottom left',
          offset: [-15, 0],
        },
        delay: self.clickDelay,
      }],

      // Step 20
      [{
        el: 'g[id^="Nation3"]',
        svgElement: true,
        tip: {
          content: 'Click to perform a focused attack here.',
          tipJoint: 'left',
        },
      },

      {
        el: '.agentOverviewContainer:eq(2) .agentOverviewAgent',
        suppressHighlightCircle: true,
      }],

      // Step 21
      [{
        el: '.actionListSubmitTurn',
        tip: {
          content: 'Click here to finish your turn.'
        },
        offset: [0, -3],
        sizeOffset: [4, 4],
        shallowCopy: true,
        callback: self.startTutorialTurnFour,
      }],
    ];

    self.gameController.setNewGameState(self.getThirdTutorialTurn(), self.playerID);
    self.ui.show();
  };

  // -------------------------------------------------------------------------
  Tutorial.prototype.startTutorialTurnFour = function() {
    self.step = -1;
    self.script = [
      // Step 22
      [{
        el: '.action-moveagent:first',
        tip: {
          content: 'Click here to start moving that Agent again.',
          tipJoint: 'bottom',
          offset: [5, 10],
        },
        offset: [-2, -2],
      }],

      // Step 23
      [{
        el: '.action-withdraw',
        tip: {
          title: 'Withdraw',
          content: 'This action lets you remove one of your Agents from the map, which will give you ' + (-BalanceValues.ACTION_WITHDRAW_COST).toString() +
                   ' extra resource to work with this turn and will reduce your Agent upkeep on the next turn.',
          tipJoint: 'bottom right',
          offset: [10, 10],
        },
        offset: [-2, -2],
        action: null,
      },

      {
        el: '.action-escape',
        tip: {
          title: 'Priority Move',
          content: 'Unlike the move action, this action allows you to move an Agent out of a region before an opponent can remove him from the map.  However, you ' +
                   'cannot move any Agent back into the original region that turn.  It costs ' + BalanceValues.ACTION_ESCAPE_COST.toString() + ' resource.',
          tipJoint: 'bottom left',
          offset: [-10, 10],
        },
        offset: [-2, -2],
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.action-move:first',
        tip: {
          content: 'Click here to select the move Action.',
          tipJoint: 'bottom',
        },
        offset: [-2, -2],
        delay: self.clickDelay,
      }],

      // Step 24
      [{
        el: '.agentOverviewContainer:eq(2) .agentOverviewAgent:eq(0)',
        tip: {
          content: 'Click here to select this Agent.',
          tipJoint: 'bottom',
        },
        offset: [4, 4],
      }],

      // Step 25
      [{
        el: 'g[id^="Nation5"]',
        svgElement: true,
        tip: {
          content: 'Click to move your Agent here.',
          tipJoint: 'left',
        },
      },

      {
        el: '.agentOverviewContainer:eq(4) .agentOverviewAgent',
        suppressHighlightCircle: true,
      }],

      [{
        el: '.actionListSubmitTurn',
        tip: {
          content: 'Click here to finish your turn.'
        },
        offset: [0, -3],
        sizeOffset: [4, 4],
        shallowCopy: true,
        callback: self.startTutorialTurnFive,
      }],
    ];

    self.gameController.setNewGameState(self.getFourthTutorialTurn(), self.playerID);
    self.ui.show();
  };

  // -------------------------------------------------------------------------
  Tutorial.prototype.startTutorialTurnFive = function() {
    self.step = -1;
    self.script = [
      // Step 26
      [{
        el: '.action-shift:first',
        tip: {
          content: 'Click here to change the message type of an Agent.',
          tipJoint: 'bottom',
          offset: [5, 10],
        },
        offset: [-2, -2],
      }],

      // Step 27
      [{
        el: '.positiveMessageType',
        tip: {
          content: 'Click here to switch your Agent to a positive message.',
          tipJoint: 'bottom',
        },
        offset: [-2, -2],
      }],

      // Step 28
      [{
        el: '.agentOverviewContainer:eq(4) .agentOverviewAgent:eq(0)',
        tip: {
          content: 'Click here to select this Agent.',
          tipJoint: 'bottom',
        },
        offset: [4, 4],
      }],

      // Step 29
      [{
        el: '.action-boost',
        tip: {
          title: 'Boost',
          content: 'This action lets you gain loyalty.  Its cost varies based on its scope.',
          tipJoint: 'bottom right',
          offset: [29, 5],
        },
        offset: [-2, -2],
        action: null,
      },

      {
        el: '.action-boost:first',
        tip: {
          content: 'Click here now.',
          tipJoint: 'bottom left',
          offset: [-21, 5],
        },
        offset: [-2, -2],
        delay: self.clickDelay,
     }],

      // Step 30
      [{
        el: '.broadScopeButton',
        tip: {
          title: 'Broad',
          content: 'A broad scoped boost will occur in <u><strong>all</strong></u> regions where you have Agents with positive or flexible messages.  The boost will be ' +
                   Math.floor(BalanceValues.SCOPE_BROAD_INFLUENCE * 100).toString() + '% as effective as the normal Agents\' effect.  It costs ' +
                   BalanceValues.ACTION_BOOST_COST.toString() + ' resources.',
          tipJoint: 'bottom right',
          offset: [15, 0],
        },
        action: null,
      },

      {
        el: '.broadScopeButton:first',
        tip: {
          content: 'Click here to do a broad boost.',
          tipJoint: 'bottom left',
          offset: [-15, 0],
        },
        delay: self.clickDelay,
      }],

      // Step 31
      [{
        el: '.actionListSubmitTurn',
        tip: {
          content: 'Click here to finish your turn.'
        },
        offset: [0, -3],
        sizeOffset: [4, 4],
        shallowCopy: true,
        callback: self.startTutorialTurnSix,
      }]
    ];

    self.gameController.setNewGameState(self.getFifthTutorialTurn(), self.playerID);
    self.ui.show();
  };

  // -------------------------------------------------------------------------
  Tutorial.prototype.startTutorialTurnSix = function() {
    self.step = -1;
    self.script = [
      // Step 32
      [{
        el: '.countryControlIcon',
        tip: {
          title: 'Controlled Region',
          content: 'Your symbol appears on top of controlled regions.  You generate additional ' +
                   'resources from controlled regions based on the region\'s population size.',
          tipJoint: 'left',
        },
        delay: self.animationDelay,
        action: null,
      },

      {
        el: '.action-boost:first',
        tip: {
          content: 'Click here to boost loyalty.',
          tipJoint: 'bottom',
          offset: [5, 10],
        },
        offset: [-2, -2],
        delay: self.clickDelay,
      }],

      // Step 33
      [{
        el: '.globalScopeButton',
        tip: {
          title: 'Global',
          content: 'A global boost or attack will add or subtract ' +
                   Math.floor(BalanceValues.SCOPE_GLOBAL_INFLUENCE * BalanceValues.MESSAGE_FLEXIBLE_LOYALTY_VALUE / BalanceValues.TERRITORY_MAX_LOYALTY * 100).toString() +
                   ' loyalty points in one population segment of each region of the map.  It costs ' + (BalanceValues.ACTION_BOOST_COST + BalanceValues.ACTION_GLOBAL_COST).toString() +
                   ' resources.',
          tipJoint: 'bottom right',
          offset: [15, 0],
        },
        action: null,
      },

      {
        el: '.globalScopeButton:first',
        tip: {
          content: 'Click here to perform a global boost.',
          tipJoint: 'bottom left',
          offset: [-15, 0],
        },
        delay: self.clickDelay,
      }],

      // Step 34
      [{
        el: '.actionListSubmitTurn',
        tip: {
          content: 'Click here to finish your turn.'
        },
        offset: [0, -3],
        sizeOffset: [4, 4],
        shallowCopy: true,
        callback: self.startTutorialTurnSeventh,
      }]
    ];

    self.gameController.setNewGameState(self.getSixthTutorialTurn(), self.playerID);
    self.ui.show();
  };

  // -------------------------------------------------------------------------
  Tutorial.prototype.startTutorialTurnSeventh = function() {
    self.step = -1;
    self.script = [
      // Step 35
      [{
        el: 'g[id^="Nation5"]',
        svgElement: true,
        tip: {
          title: 'Loyalty Growth: Contention',
          content: 'When there are less neutral population segments than there are players, the remaining neutral segments will become loyal to ' +
                   'whoever has more positive influence.  If it is a tie, they will stay neutral.',
          tipJoint: 'bottom',
        },
        delay: self.animationDelay,
        action: null,
      },

      {
        el: '.agentOverviewContainer:eq(4) .agentOverviewAgent',
        action: null,
      },

      {
        el: '.action-remove',
        tip: {
          title: 'Remove Agent',
          content: 'This action lets you remove an opponent\'s Agent from the map.  You must have an agent in the same region at the start of the turn.  ' +
                   'It costs ' + BalanceValues.ACTION_REMOVE_COST.toString() + ' resources.',
          tipJoint: 'bottom right',
          offset: [29, 5],
        },
        offset: [-2, -2],
        action: null,
        delay: self.normalDelay,
      },

      {
        el: '.action-remove:first',
        tip: {
          content: 'Click here to remove an opponent Agent.',
          tipJoint: 'bottom left',
          offset: [-21, 5],
        },
        offset: [-2, -2],
        delay: self.clickDelay,
      }],

      // Step 36
      [{
        el: '.agentOverviewContainer:eq(4) .agentOverviewAgent:eq(1)',
        tip: {
          content: 'Click here to remove this Agent.',
          tipJoint: 'bottom',
        },
        offset: [4, 4],
      }],

      // Step 37
      [{
        el: '.action-desperation',
        tip: {
          title: 'Desperation',
          content: 'This action will be unlocked if you are falling very far behind in loyalty and resources.  ' +
                   'It will remove all opponent Agents from the map and cancel any actions they submitted. Opponents still pay the cost of the actions they selected.  ' +
                   'This action can only be used once per game by each player and must happen in the first ' + BalanceValues.DESPERATION_TURN_LIMIT.toString() +
                   ' turns of the game.',
          tipJoint: 'bottom',
          offset: [5, 10],
        },
        offset: [-2, -2],
        action: null,
      },

      {
        el: '.endTutorialButton',
        tip: {
          content: 'Click here to begin playing the game!',
          tipJoint: 'bottom right',
          offset: [30, 10]
        },
        delay: self.clickDelay,
      }]
    ];

    self.gameController.setNewGameState(self.getSeventhTutorialTurn(), self.playerID);
    self.ui.show();
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.getPlayers = function() {
    return [{ actions: '', color: self.initialGameState.playerColors[0], disabledAgents: [], hasTakenTurn: false, id: self.playerID, ideologyName: 'Your Ideology', ideologyType: 0, name: 'You', resources: 6, usedDesperation: false },
            { actions: '', color: self.initialGameState.playerColors[1], disabledAgents: [], hasTakenTurn: false, id: 'Fake', ideologyName: 'Their Ideology', ideologyType: 1, name: 'Opponent', resources: 6, usedDesperation: false }];
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.getFirstTutorialTurn = function() {
    return {
      map: 'map01.svg',
      countries: [{ agents: [[], []], territories: [{ currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]}],
      currentTurnIndex: 1,
      ideologyTypes: self.initialGameState.ideologyTypes,
      phase: GamePhase.NORMAL,
      playerColors: self.initialGameState.playerColors,
      players: self.getPlayers(),
      turnList: [],
      winningPlayers: [],
    };
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.getSecondTutorialTurn = function() {
    var players = self.getPlayers();
    players[0].resources = 2;
    players[1].resources = 2;
    return {
      map: 'map01.svg',
      countries: [{ agents: [[{messageType: 1, target: -1}], []], territories: [{ currentLoyalty: 2, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 2, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[{messageType: 2, target: 1}], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]}],
      currentTurnIndex: 2,
      ideologyTypes: self.initialGameState.ideologyTypes,
      phase: GamePhase.NORMAL,
      playerColors: self.initialGameState.playerColors,
      players: players,
      turnList: [self.getFirstTutorialTurn()],
      winningPlayers: [],
    };
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.getThirdTutorialTurn = function() {
    var players = self.getPlayers();
    players[0].resources = 3;
    players[1].resources = 2;
    return {
      map: 'map01.svg',
      countries: [{ agents: [[{messageType: 1, target: -1}], []], territories: [{ currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[{messageType: 0, target: 1}], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]}],
      currentTurnIndex: 3,
      ideologyTypes: self.initialGameState.ideologyTypes,
      phase: GamePhase.NORMAL,
      playerColors: self.initialGameState.playerColors,
      players: players,
      turnList: [self.getFirstTutorialTurn(), self.getSecondTutorialTurn()],
      winningPlayers: [],
    };
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.getFourthTutorialTurn = function() {
    var players = self.getPlayers();
    players[0].resources = 2;
    players[1].resources = 3;
    return {
      map: 'map01.svg',
      countries: [{ agents: [[{messageType: 1, target: -1}], []], territories: [{ currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[{messageType: 0, target: 1}], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 2, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]}],
      currentTurnIndex: 4,
      ideologyTypes: self.initialGameState.ideologyTypes,
      phase: GamePhase.NORMAL,
      playerColors: self.initialGameState.playerColors,
      players: players,
      turnList: [self.getFirstTutorialTurn(), self.getSecondTutorialTurn(), self.getThirdTutorialTurn()],
      winningPlayers: [],
    };
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.getFifthTutorialTurn = function() {
    var players = self.getPlayers();
    players[0].resources = 4;
    players[1].resources = 5;
    return {
      map: 'map01.svg',
      countries: [{ agents: [[{messageType: 1, target: -1}], []], territories: [{ currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 2, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[{messageType: 0, target: 1}], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]}],
      currentTurnIndex: 5,
      ideologyTypes: self.initialGameState.ideologyTypes,
      phase: GamePhase.NORMAL,
      playerColors: self.initialGameState.playerColors,
      players: players,
      turnList: [self.getFirstTutorialTurn(), self.getSecondTutorialTurn(), self.getThirdTutorialTurn(), self.getFourthTutorialTurn()],
      winningPlayers: [],
    };
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.getSixthTutorialTurn = function() {
    var players = self.getPlayers();
    players[0].resources = 5;
    players[1].resources = 7;
    return {
      map: 'map01.svg',
      countries: [{ agents: [[{messageType: 1, target: -1}], []], territories: [{ currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[{messageType: 1, target: -1}], [{messageType: 2, target: 0}]], territories: [{ currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]}],
      currentTurnIndex: 6,
      ideologyTypes: self.initialGameState.ideologyTypes,
      phase: GamePhase.NORMAL,
      playerColors: self.initialGameState.playerColors,
      players: players,
      turnList: [self.getFirstTutorialTurn(), self.getSecondTutorialTurn(), self.getThirdTutorialTurn(), self.getFourthTutorialTurn(), self.getFifthTutorialTurn()],
      winningPlayers: [],
    };
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.getSeventhTutorialTurn = function() {
    var players = self.getPlayers();
    players[0].resources = 6;
    players[1].resources = 8;
    return {
      map: 'map01.svg',
      countries: [{ agents: [[{messageType: 1, target: -1}], []], territories: [{ currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 1/3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 2, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 1/3, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1/3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[{messageType: 1, target: -1}], [{messageType: 1, target: -1}]], territories: [{ currentLoyalty: 3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 3, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 1/3, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 1/3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 4/3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 1, loyalToWhom: 0, maxLoyalty: 3 }]},
                  { agents: [[], []], territories: [{ currentLoyalty: 1, loyalToWhom: 1, maxLoyalty: 3 }, { currentLoyalty: 1/3, loyalToWhom: 0, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }, { currentLoyalty: 0, loyalToWhom: -1, maxLoyalty: 3 }]}],
      currentTurnIndex: 7,
      ideologyTypes: self.initialGameState.ideologyTypes,
      phase: GamePhase.NORMAL,
      playerColors: self.initialGameState.playerColors,
      players: players,
      turnList: [self.getFirstTutorialTurn(), self.getSecondTutorialTurn(), self.getThirdTutorialTurn(), self.getFourthTutorialTurn(), self.getFifthTutorialTurn(), self.getSixthTutorialTurn()],
      winningPlayers: [],
    };
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.init = function() {
    self.ui = $("<div>\
                   <div class='tutorialBackground'/>\
                   <div class='tutorialForeground'>\
                   </div>\
                   <div class='tutorialButtonContainer'>\
                     <div class='tutorialLabel'>Tutorial Controls:</div>\
                     <div class='tutorialButton restartTutorialButton'>Restart</div>\
                     <div class='tutorialButton endTutorialButton'>End</div>\
                   </div>\
                 </div>");
    $('body').append(self.ui);

    self.background = self.ui.find('.tutorialBackground');
    self.foreground = self.ui.find('.tutorialForeground');
    self.foreground.click(self.onBlockClick);
    self.buttonContainer = self.ui.find('.tutorialButtonContainer');
    self.buttonContainer.find('.restartTutorialButton').click(self.onRestartTutorial);
    self.buttonContainer.find('.endTutorialButton').click(self.onEndTutorial);

    self.start();
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.start = function() {
    var firstGameState = self.getFirstTutorialTurn();
    self.initTutorialSteps(firstGameState);
    self.gameController.setNewGameState(firstGameState, self.playerID);
    self.show();
  };

  //----------------------------------------------------------------------------
  // Script is an array that contains the contents of the entire tutorial.
  // See the bottom of this source for details on its structure.
  Tutorial.prototype.show = function() {
    self.ui.show();
    self.performStep(0);
    $(window).on('resize.tutorial', this.onResize);
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.hide = function() {
    self.ui.hide();
    $(window).off('resize.tutorial');
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.onRestartTutorial = function() {
    self.cleanupTutorial();
    self.start();
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.onEndTutorial = function() {
    self.cleanupTutorial();
    self.gameController.setNewGameState(self.initialGameState, self.playerID);
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.performStep = function(step) {
    if (step > -1 && step < self.script.length) {
      self.step = step;
      var currentStep = self.script[step];

      //is this step an array of elements and tips?
      if (_.isArray(currentStep)) {
        var absTime = 0;

        _.each(currentStep, function(item){
          absTime += item.hasOwnProperty('delay') ? item.delay : 0;

          self.timers.push(setTimeout(function() {
            self.performItem(item);
            self.timers.unshift();
          }, absTime));
        });

      }
      else {
        this.timers.push(setTimeout(function() {
          self.performItem(currentStep);
          self.timers.unshift();
        }, currentStep.hasOwnProperty('delay') ? currentStep.delay : 0));
      }

      return;
    }

    self.onEndTutorial();
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.performItem = function(item) {
    var $el = $(item.el);
    var $tooltipTarget = $el;

    if (item.hasOwnProperty('grouped') && item.grouped) {
      //point the tooltip to the bounding box
      $tooltipTarget = self.createBoundingBox($el, 'boundingBox');
    }
    else if (item.hasOwnProperty('svgElement')) {
      //point the tooltip to the invisible bounding box
      $tooltipTarget = self.createBoundingBox($el, 'svgBoundingBox');
    }

    if (item.hasOwnProperty('tip')){
      if (item.tip.stemLength === undefined) {
        item.tip.stemLength = 50;
      }
      var t = new Opentip($tooltipTarget.get(0), item.tip.content, item.tip.title || '',
                          {
                            target: item.tip.target || $tooltipTarget.get(0),
                            group: null,
                            showOn:'creation',
                            hideOn: 'fakeEventThatDoesntExist',
                            removeElementsOnHide: true,
                            stemLength: item.tip.stemLength,
                            tipJoint: item.tip.tipJoint || 'top left',
                            offset: item.tip.offset || [0, 0],
                            delay: item.tip.delay || 0,
                            style: self.doesItemHaveNullAction(item) ? 'tutorialTips' : 'tutorialActionTips'
                          });
      $(t.container[0]).on('click.blockClick', self.onBlockClick);
    }

    $el.each(function() {
      if (item.svgElement === undefined) {
        self.cloneElement(this, item);
      }
      else {
        self.cloneSVGElement(this, item);
      }
    });
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.onBlockClick = function(event) {
    event.stopPropagation();
  },

  //----------------------------------------------------------------------------
  Tutorial.prototype.createBoundingBox = function($el, boxClass) {
    //gather boundaries
    var bbox = self.getBoundingBoxOfElements($el);

    //create bounding box around $el
    var $box = $('<div class="' + boxClass + '"></div>')
    self.setCSSOfBoundingBox($box, bbox);

    self.background.append($box);
    $el.data('boundingBox', $box);
    $box.data('source', $el);

    return $box;
  }

  //----------------------------------------------------------------------------
  Tutorial.prototype.getBoundingBoxOfElements = function($elements) {
    //gather boundaries
    var left = Number.MAX_VALUE;
    var top = Number.MAX_VALUE;
    var width = Number.MIN_VALUE;
    var height = Number.MIN_VALUE;

    _.each($elements, function(element){
      var rect = element.getBoundingClientRect();
      left = (rect.left < left) ? rect.left : left;
      top = (rect.top < top) ? rect.top : top;
      width = (rect.width > width) ? rect.width : width;
      height = (rect.height > height) ? rect.height : height;
    });

    return {left: left, top: top, width: width, height: height};
  },

  //----------------------------------------------------------------------------
  Tutorial.prototype.setCSSOfBoundingBox = function($el, bbox) {
    $el.css('left', bbox.left);
    $el.css('top', bbox.top);
    $el.css('width', bbox.width);
    $el.css('height', bbox.height);
  },

  //----------------------------------------------------------------------------
  Tutorial.prototype.doesItemHaveNullAction = function(item) {
    //step has an action property and it's null, meaning there's no action to perform
    return (item.hasOwnProperty('action') &&
            (item.action == null));
  },

  //----------------------------------------------------------------------------
  Tutorial.prototype.cloneElement = function(element, item, alternate) {
    // Clone the element
    var $el = $(element);
    if (item.hasOwnProperty('shallowCopy') && item.shallowCopy) {
      var $clone = $(element.cloneNode(true));
    }
    else {
      var $clone = $el.clone(true);
    }
    $clone.data('source', $el);
    $clone.data('offset', item.offset);
    $clone.data('sizeOffset', item.sizeOffset);
    $clone.attr('id', '');

    // Add the clone to the appropriate layer
    if (item.hasOwnProperty('action') && alternate === undefined) {
      self.background.append($clone);
      if (item.action !== null) {
        var alternateTarget = $(item.action)[0];
        self.cloneElement(alternateTarget, item, true);
      }
    }
    else {
      self.foreground.append($clone);

      //Highlight the elements which have some action to perform and assign
      //a click handler
      if (!item.hasOwnProperty('suppressHighlightCircle')) {
        var $box = $("<div class='highlightCircle'></div>")
        var bbox = self.getBoundingBoxOfElements($el);
        self.setCSSOfBoundingBox($box, bbox);
        $box.data('source', $el);
        self.foreground.append($box);
        $box.click(function(event) {
          if (!item.hasOwnProperty('shallowCopy') || !item.shallowCopy) {
            $el.click();
          }
          self.onFinished();
          event.stopPropagation();
        });
      }
    }

    // Now position the element
    $clone.css('transition', 'none');
    $clone.css('position', 'absolute');
    self.positionClone($clone, $el, item.offset, item.sizeOffset);
  };

  //----------------------------------------------------------------------------
  Tutorial.prototype.cloneSVGElement = function(element, item) {
    var $el = $(element);

    // Clone the element
    var svgClone = element.instance.deepClone();
    var $clone = $(svgClone.node);

    // Make sure the element is inside an svg dom element
    var $svg = $("<svg class='tutorialSVGElement'></svg>");
    $svg.data('source', $el);
    $svg.data('clone', svgClone);
    $svg.append($clone);

    // Add the clone to the appropriate layer
    if (item.hasOwnProperty('action')) {
      self.background.append($svg);
    }
    else {
      self.foreground.append($svg);

      //Highlight the elements which have some action to perform and assign
      //a click handler
      var $box = $("<div class='highlightCircle'></div>")
      var bbox = self.getBoundingBoxOfElements($el);
      self.setCSSOfBoundingBox($box, bbox);
      $box.data('source', $el);
      self.foreground.append($box);
      $box.click(function(event) {
        var clickEvent = document.createEvent("SVGEvents");
        clickEvent.initEvent("click", true, true);
        element.dispatchEvent(clickEvent);
        event.stopPropagation();
        self.onFinished();
      });
    }

    // Now position the element
    $svg.css('transition', 'none');
    $svg.css('position', 'absolute');
    self.positionSVGClone($svg, svgClone, $el);
  }

  //----------------------------------------------------------------------------
  Tutorial.prototype.positionClone = function($clone, $el, offset, sizeOffset) {
    var bbox = self.getBoundingBoxOfElements($el);
    self.adjustBoundingBoxByMargins(bbox, $el, offset, sizeOffset);
    $clone.css('left', bbox.left);
    $clone.css('top', bbox.top);
    $clone.css('width', bbox.width);
    $clone.css('height', bbox.height);
  },

  //----------------------------------------------------------------------------
  Tutorial.prototype.positionSVGClone = function($svg, svgClone, $el) {
    svgClone.transform(SVG.defaults.trans());
    self.positionClone($svg, $el);
    var svgBBox = $el[0].instance.bbox();
    var scaleX = $svg.width() / svgBBox.width;
    var scaleY = $svg.height() / svgBBox.height;
    svgClone.scale(scaleX, scaleY);
    svgClone.move(-svgBBox.x * scaleX, -svgBBox.y * scaleY);
  }

  //----------------------------------------------------------------------------
  Tutorial.prototype.adjustBoundingBoxByMargins = function(bbox, $el, offset, sizeOffset) {
    var leftMargin = self.getCSSIntValue($el, 'border-left');
    var rightMargin = self.getCSSIntValue($el, 'border-right');
    var topMargin = self.getCSSIntValue($el, 'border-top');
    var bottomMargin = self.getCSSIntValue($el, 'border-bottom');
    if (offset !== undefined) {
      bbox.left += offset[0];
      bbox.top += offset[1];
    }
    if (sizeOffset !== undefined) {
      bbox.width += sizeOffset[0];
      bbox.height += sizeOffset[1];
    }
    bbox.width -= leftMargin + rightMargin;
    bbox.height -= topMargin + bottomMargin;
  }

  //----------------------------------------------------------------------------
  Tutorial.prototype.getCSSIntValue = function($el, cssValue) {
    return parseInt($el.css(cssValue));
  }

  //----------------------------------------------------------------------------
  Tutorial.prototype.cleanUpElement = function($el) {
    if ($el.data('boundingBox')) {
      var $bbox = $el.data('boundingBox');
      $bbox.remove();
      $el.removeData('boundingBox');
    }
  },

  //----------------------------------------------------------------------------
  Tutorial.prototype.onResize = function() {
    setTimeout(function() {
      self.background.add(self.foreground).children().each(function() {
        var $clone = $(this);
        if ($clone.hasClass('boundingBox') || $clone.hasClass('highlightCircle')) {
          self.setCSSOfBoundingBox($clone, self.getBoundingBoxOfElements($clone.data('source')));
        }
        else if ($clone.data('clone') !== undefined) {
          self.positionSVGClone($clone, $clone.data('clone'), $clone.data('source'));
        }
        else {
          self.positionClone($clone, $clone.data('source'), $clone.data('offset'), $clone.data('sizeOffset'));
        }
      });
      _.each(Opentip.tips, function(tip) {
        tip.reposition();
      });
    }, 0);
  },

  //----------------------------------------------------------------------------
  Tutorial.prototype.onFinished = function(event) {
    // Cleanup our previous clones
    self.background.empty();
    self.foreground.empty();
    Opentip.hideTips();

    // Move on to the next step of the tutorial
    if (_.isArray(self.script[self.step])) {
      _.each(self.script[self.step], function(item) {
        if (item.callback != null) {
          item.callback();
        }
        self.cleanUpElement($(item.el));
      });
    }
    else {
      if (self.script[self.step].callback != null) {
        self.script[self.step].callback();
      }
      self.cleanUpElement($(self.script[self.step].el));
    }

    self.step++;

    if (self.step < self.script.length) {
      self.performStep(self.step);
    }
    else {
      self.cleanupTutorial();
    }
  },

  //----------------------------------------------------------------------------
  Tutorial.prototype.cleanupTutorial = function() {
    _.each(self.timers, function(timer) {
      clearTimeout(timer);
    });
    self.timers = [];
    self.background.empty();
    self.foreground.empty();
    Opentip.hideTips();
    self.hide();
  }
}

//----------------------------------------------------------------------------
Opentip.styles.tutorialActionTips = {
  extends: "tutorialTips",
  className: "tutorialActionTips",
  borderColor: "yellow",
  borderWidth: 1,
  background: [[0, "rgba(50, 50, 50, 0.8)"], [1, "rgba(30, 30, 30, 0.9)"]]
};

Opentip.styles.tutorialTips = {
  extends: "dark",
  className: "tutorialTips",
  borderColor: "#000",
  borderWidth: 1,
  background: [[0, "rgba(235, 235, 235, 0.9)"], [1, "rgba(170, 170, 170, 0.95)"]],
};
