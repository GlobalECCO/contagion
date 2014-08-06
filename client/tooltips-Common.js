/*******************************************************************************
 * Common tooltips that all players will see regardless of ideology
 ******************************************************************************/
var TOOLTIPS = {
// Tooltips for action buttons
  ACTIONS: {
    ADDITIONAL_COST: {
      TITLE: 'Multiple Action Cost',
      TEXT: '<div class="tooltip-userdefined">Each action after the first costs exponentially more (1 for the 2nd, 2 for the 3rd, 3 for the 4th, etc.)'
    },
    ATTACK: {
      TEXT: '<div class="tooltip-userdefined">Turn opponent\'s loyalties back to neutral. \
        <div class="ot-listitem">\
          <div class="ot-icon" style="background-image: url(\'images/icon_ActionScope_Global-100px.png\')"></div>\
          <div class="ot-listitem-content">Global Actions do not require agents.</div>\
        </div>\
        <div class="ot-listitem">\
          <div class="ot-icon" style="background-image: url(\'images/icon_ActionScope_Local-100px.png\')"></div>\
          <div class="ot-icon" style="background-image: url(\'images/icon_ActionScope_Broad-100px.png\')"></div>\
          <div class="ot-listitem-content">Non-global actions require agents with <strong><u>negative</u></strong> or <strong><u>flexible</u></strong> message type.<br><br></div>\
        </div>\
        </div>\
      <div class="costTooltip">Cost Varies</div>'
    },
    BOOST: {
      TEXT: '<div class="tooltip-userdefined">Gain loyalty from neutral citizens. \
      <div class="ot-listitem">\
          <div class="ot-icon" style="background-image: url(\'images/icon_ActionScope_Global-100px.png\')"></div>\
          <div class="ot-listitem-content">Global Actions do not require agents.</div>\
        </div>\
        <div class="ot-listitem">\
          <div class="ot-icon" style="background-image: url(\'images/icon_ActionScope_Local-100px.png\')"></div>\
          <div class="ot-icon" style="background-image: url(\'images/icon_ActionScope_Broad-100px.png\')"></div>\
          <div class="ot-listitem-content">Non-global actions require agents with <strong><u>positive</u></strong> or <strong><u>flexible</u></strong> message type.<br><br></div>\
        </div>\
        </div>\
      <div class="costTooltip">Cost Varies</div>'
    },
    DESPERATION: {
      TEXT: '<div class="tooltip-userdefined">Remove all opposing Agents from the map. Can only be used <strong><u>once per game</u></strong>. This becomes enabled if you are falling too far behind your opponent and is no longer available after Turn 15.</div><div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_DESPERATION_COST).toString() + '</div></div>'
    },
    DISABLE: {
      TEXT: '<div class="tooltip-userdefined">Temporarily disable an enemy\'s Agent that is occupying the same location as one of your own Agents. The Disabled Agent is moved to the Inactive Agents pool to the top left of the map. Your opponent may re-enable the agent by moving the agent back to the map by using the Move Action.</div><div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_DISABLE_COST).toString() + '</div></div>'
    },
    ESCAPE: {
      TEXT: '<div class="tooltip-userdefined">Pre-emptively move one of your Agents to another location before they can be disabled or removed.</div><div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_ESCAPE_COST).toString() + '</div></div>'
    },
    MOVE_TYPE: {
      TEXT: '<div class="tooltip-userdefined">Change Agent location.</div><div class="costTooltip">Cost Varies</div>'
    },
    MOVE: {
      TEXT: '<div class="tooltip-userdefined">Move one of your Agents to another Region.</div><div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_MOVE_COST).toString() + '</div></div>'
    },
    RECRUIT: {
      TEXT: '<div class="tooltip-userdefined">Place an Agent into the specified Region.  You can have a max of ' + (BalanceValues.AGENT_MAX_ACTIVE.toString()) + ' on the map.</div><div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_RECRUIT_COST).toString() + '</div></div>'
    },
    REMOVE: {
      TEXT: '<div class="tooltip-userdefined">Permanently remove from the map an enemy\'s Agent that is occupying the same location as one of your own Agents.</div><div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_REMOVE_COST).toString() + '</div></div>'
    },
    SHIFT: {
      TEXT: '<div class="tooltip-userdefined">Change an Agent\'s message type.</div><div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_SHIFT_COST).toString() + '</div></div>'
    },
    WITHDRAW: {
      TEXT: '<div class="tooltip-userdefined">Withdraw an Agent from the map.</div><div class="incomeTooltip">Generates <div class="incomeTooltipNumber">' + (-BalanceValues.ACTION_WITHDRAW_COST).toString() + '</div></div>'
    }
  },

  // Tooltip for selecting another player as a target
  TARGET: {
    TITLE: 'Target Player',
    TEXT: 'Target '
  },

  // Tooltips for selecting different message types
  MESSAGE: {
    FLEXIBLE: {
      TITLE: 'Flexible Message',
      TEXT: 'Flexible message that will both spread loyalty and remove opposing loyalty.'
    },
    NEGATIVE: {
      TITLE: 'Negative Message',
      TEXT: 'Negative message that attacks other player\'s loyalty (twice as effective as the flexible message at removing opposing loyalty, but cannot create loyalty).'
    },
    POSITIVE: {
      TITLE: 'Positive Message',
      TEXT: 'Positive message that spreads your loyalty faster (twice as effective as the flexible message at spreading loyalty, but cannot remove opposing loyalty).'
    }
  },

  // Tooltips for selecting action scope
  SCOPE: {
    GLOBAL: {
      TEXT: 'This action affects every Region.<div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_GLOBAL_COST + BalanceValues.ACTION_BOOST_COST).toString() + '</div></div>'
    },
    BROAD: {
      TEXT: 'This action <strong><u>ONLY</u></strong> affects Regions in which you have Agents, and those Agents\' message types <strong><u>MUST</u></strong> match the action you are performing.<div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_BOOST_COST).toString() + '</div></div>'
    },
    LOCAL: {
      TEXT: 'This action affects a <strong><u>SINGLE REGION</u></strong> you select with an Agent in it. The Agent\'s message type <strong><u>MUST</u></strong> match the action you are performing.<div class="costTooltip">Cost <div class="costTooltipNumber">' + (BalanceValues.ACTION_BOOST_COST).toString() + '</div></div>'
    }
  },

  // Tooltips for Countries
  COUNTRIES: {
    TITLE: 'Region Information',
    NAME: 'Name: ',
    RESOURCES: 'Resources Generated If Controlled: '
  },

  // Tooltips for sources of income
  INCOME: {
    COUNTRIES: {
      TITLE: 'Region Control',
      TEXT: 'The number of resources given for controlling this Region.'
    },
    TERRITORIES: {
      TITLE: 'Population Loyalty',
      TEXT: 'The number of resources given for having this many population segments loyal to you.'
    },
    UPKEEP: {
      TITLE: 'Agent Upkeep',
      TEXT: 'Each Agent after the first one costs an additional resource every turn for upkeep.'
    }
  },

  // Tooltips for AgentOverview containers and Agent's message types
  AGENTS: {
    CONTAINER: {
      TITLE: 'Agent Overview',
      TEXT: 'The Agents placed in this Region.'
    },
    DISABLED_CONTAINER: {
      TITLE: 'Inactive Agents',
      TEXT: 'The Agents that have been temporarily disabled, Move them to put them back in play.'
    },
    DETAILS: {
      TITLE: 'Agent Details',
      MESSAGE: 'Message Type: '
    }
  },

  // Tooltips for the scoreboard
  SCOREBOARD: {
    COUNTRY: {
      TITLE: 'Controlled Regions',
      TEXT: 'The total number of Regions needed to win the game and how many this player currently controls (requires 100% loyalty in all population segments to control).'
    },
    TERRITORY: {
      TITLE: 'Loyal Population',
      TEXT: 'The total number of population segments needed to win the game and how many this player currently has loyalty in (requires at least ' +
        BalanceValues.TERRITORY_LOYALTY_PERCENT_THRESHOLD * 100 + '% loyalty to count).'
    }
  },

  // Tooltips for game options
  OPTIONS: {
    SOUNDS: {
      TITLE: 'Toggle Sounds',
      TEXT: 'Toggle sounds on or off.'
    },
    TOOLTIPS: {
      TITLE: 'Toggle Tooltips',
      TEXT: 'Toggle tooltip visibility on or off.'
    },
    CHAT: {
      TITLE: 'Toggle Chat',
      TEXT: 'Toggle chat window visibility on or off.'
    }
  },

  // Tooltips for the playback controls
  PLAYBACK: {
    START: {
      TITLE: 'View Game Start',
      TEXT: 'Review the first turn of the game.'
    },
    BACK: {
      TITLE: 'View Previous Turn',
      TEXT: 'Review a previous turn that has been played.'
    },
    CURRENT: {
      TITLE: 'Turn Number',
      TEXT: 'The turn number you are currently viewing.'
    },
    FORWARD: {
      TITLE: 'View Next Turn',
      TEXT: 'View the next turn that has already been played.'
    },
    END: {
      TITLE: 'Return To Current',
      TEXT: 'Return to the current turn being played in the game.'
    }
  }
};
