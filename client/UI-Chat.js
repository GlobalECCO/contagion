function Chat(rootDiv, username) {

  this.username = username || "username";
  var self = this;
  this.ui_mini;
  this.ui_full;
  this.chatBarID = -1;

  this.chatHistoryHtml;
  this.lastChatMessageHtml;

  var root = rootDiv;
  var chatDiv = '<div class="chatMessage"></div>';
  var collapsed = true;
                      
  var html_miniChat = '<div id="chatFlash"><\div>'

  var html_fullChat = '<div class="fullChatContainer hide-element">\
                        <div class="fullChatText"></div>\
                        <div class="fullChatWindow-TextBox">\
                          <input type="text" name="input" autofocus="true" class="fullChatWindow-TextBox-Input" id="chat_full"/>\
                          <div class="fullChatWindow-Textbox-submit" id="fullChat_submit">></div>\
                        </div>\
                        <div class="chatToggle fullChatToggle">\
                          <div class="chatToggle-button chatToggle-close" id="fullChatToggleButton">\
                            <div class="iconOverlay"></div>\
                          </div>\
                        </div>\
                      </div>';

  var fadeOutDuration = 3000;
  var delayDuration = 5000;
  var entries = [];
  var colorMap;

  // ---------------------------------------------------------------------------
  this.initialize = function(playerColorMap) {
    colorMap = playerColorMap;
  }

  // ---------------------------------------------------------------------------
  this.update = function(updatedEntries) {
    var currentLastEntry = entries[entries.length - 1];
    var newLastEntry = updatedEntries[updatedEntries.length - 1];

    if (entries.length != updatedEntries.length) {
      entries = updatedEntries;

      if ($('.fullChatContainer').is(':visible')) {
        populateFullChat();
      } else {
        populateMiniChat();
      }

      // Scroll as far down as we can to see new text in case it's offscreen
      var $chatElement = $('.fullChatText');
      $chatElement.scrollTop($chatElement[0].scrollHeight);
    }
  }

  // ---------------------------------------------------------------------------
  var populateMiniChat = function() {
    
    if (entries.length > 0 && collapsed)  {
    
      if (this.chatBarID !== -1) {
        clearTimeout(this.chatBarID);
      }
    
      var entry = entries[entries.length - 1];
      var color = GetColorForPlayer(entry.name);
      var cleanText = entry.text.replace("<", "&lt");
      var chatText = '<strong style="color:' + color + '">' + entry.name + ":</strong> " + cleanText;
      var $chatDiv = $(chatDiv);
      $chatDiv.css('color', 'ffffff');
      $chatDiv.html(chatText);

      $('#chatFlash').empty();
      //self.ui_mini.find('#chatFlash').text(chatText);
      $('#chatFlash').html(chatText);
      $('#chatFlash').css('display','block');
      
      
      this.chatBarID = setTimeout(function() {
        $('#chatFlash').fadeOut('slow');
      }, 10000);
      
    }
  }

  // ---------------------------------------------------------------------------
  var populateFullChat = function() {
    self.ui_full.find('.fullChatText').empty();

    entries.forEach(function(entry) {
      var color = GetColorForPlayer(entry.name);
      var cleanText = entry.text.replace("<", "&lt");
      var chatText = '<strong style="color:' + color + '">' + entry.name + ":</strong> " + cleanText;
      var $chatDiv = $(chatDiv);
      $chatDiv.css('color', '#ffffff');
      $chatDiv.html(chatText);

      self.ui_full.find('.fullChatText').append($chatDiv);
    });
  }

  // ---------------------------------------------------------------------------
  // var onMiniChatToggle = function() {
    // self.ui_full = self.ui_full || $(html_fullChat);
    // if (!root.hasClass('.fullChatContainer')) {
      // root.append(self.ui_full);
      // populateFullChat();
    // };

    // $('.chatContainer').hide();
    // $('.fullChatContainer').show();
    // self.ui_full.find('.fullChatText').html(self.chatHistoryHtml);
    // self.ui_full.find('#chat_full').on('keypress', onFullChatKeyDown);

    // collapsed = !collapsed;

    // $('#toggleChat').click(onFullChatToggle);
    // $('#fullChat_submit').click(onFullChatSubmit);
  // }

  // ---------------------------------------------------------------------------
  var onMiniChatSubmit = function() {
    var inputText = document.getElementById('chat_mini').value;
    document.getElementById('chat_mini').value = "";
    sendChat(inputText);
  }

  // ---------------------------------------------------------------------------
  var onMiniChatKeyDown = function(event) {
    // Enter key triggers submit
    if (event.which == '13') {
      onMiniChatSubmit();
    }
  }

  // ---------------------------------------------------------------------------
  var onFullChatSubmit = function() {
    var inputText = document.getElementById('chat_full').value;
    document.getElementById('chat_full').value = "";
    sendChat(inputText);
    populateMiniChat();
  }

  // ---------------------------------------------------------------------------
  var onFullChatKeyDown = function(event) {
    // Enter key triggers submit
    if (event.which == '13') {
      onFullChatSubmit();
    }
  }

  // ---------------------------------------------------------------------------
  // var onFullChatToggle = function() {
    // ShowMiniChat();

    // $('.fullChatContainer').hide();
    // $('.chatContainer').show();

    // collapsed = !collapsed;
    // self.ui_mini.find('.chatWindow-Message').html(self.lastChatMessageHtml);
    // populateMiniChat();
  // }

  // ---------------------------------------------------------------------------
  var ShowMiniChat = function() {
    self.ui_mini = self.ui_mini || $(html_miniChat);
    if (!root.hasClass('#chatFlash')) {
      root.append(self.ui_mini);
      self.ui_mini.find('#chatFlash').on('keypress', onMiniChatKeyDown);
      
    };
  }

  // ---------------------------------------------------------------------------
  var GetColorForPlayer = function(player) {
    var color = '#ffffff';
    for (var id in colorMap) {
      if (id === player) {
        color = colorMap[player];
        break;
      }
    }

    return color;
  }
  
  // ---------------------------------------------------------------------------
  var onChatToggle = function() {
    
    self.ui_full = self.ui_full || $(html_fullChat);
    if (!root.hasClass('.fullChatContainer')) {
      root.append(self.ui_full);
      populateFullChat();
    };

    collapsed = !collapsed;
    
    $('.fullChatContainer').toggleClass('hide-element', collapsed);
    if (collapsed) {
      $('#toggleChat').removeClass('btnChatToggleOn');
      $('#toggleChat').addClass('btnChatToggleOff');
      //populateMiniChat();
    }
    else {
      $('#toggleChat').addClass('btnChatToggleOn');
      $('#toggleChat').removeClass('btnChatToggleOff');
    }
    
    self.ui_full.find('.fullChatText').html(self.chatHistoryHtml);
    self.ui_full.find('#chat_full').on('keypress', onFullChatKeyDown);

    $('#fullChat_submit').click(onFullChatSubmit);
  }

  // Init
  ShowMiniChat();

  this.ui_full = this.ui_full || $(html_fullChat);
  //this.ui_full.hide();
  root.append(this.ui_full);

  // EVENTS

  //$('#miniChat_submit').click(onMiniChatSubmit);
  //$('#miniChatToggleButton').click(onMiniChatToggle);
  //$('#toggleChat').click(onMiniChatToggle);
  
  $('#toggleChat').click(onChatToggle);
  $('#fullChatToggleButton').click(onChatToggle);
}

