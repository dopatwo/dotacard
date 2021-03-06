game.states.table = {
  chat: true,
  build: function () {
    this.camera = $('<div>').addClass('camera');
    this.map = game.map.build({'width': game.width, 'height': game.height}).appendTo(this.camera);
    this.selectedArea = $('<div>').addClass('selectedarea');
    this.selectedCard = $('<div>').addClass('selectedcard').appendTo(this.selectedArea);
    this.cardBack = $('<div>').addClass('cardback').appendTo(this.selectedCard);
    //this.neutrals = $('<div>').appendTo(this.el).addClass('neutraldecks');
    this.player = $('<div>').addClass('playerdecks player');
    this.enemy = $('<div>').addClass('enemydecks enemy');
    this.buttonbox = $('<div>').addClass('buttonbox');
    this.surrender = $('<div>').hide().appendTo(this.buttonbox).addClass('surrender button').text(game.data.ui.surrender).on('mouseup touchend', this.surrenderClick);
    this.skip = $('<div>').hide().appendTo(this.buttonbox).addClass('skip button').attr({disabled: true}).text(game.data.ui.skip).on('mouseup touchend', this.skipClick);
    this.back = $('<div>').hide().appendTo(this.buttonbox).addClass('back button').text(game.data.ui.back).on('mouseup touchend', this.backClick);
    this.discard = $('<div>').hide().appendTo(this.buttonbox).addClass('discard button').attr({disabled: true}).text(game.data.ui.discard).on('mouseup touchend', this.discardClick);
    this.el.addClass('unturn').append(this.camera).append(this.selectedArea).append(this.buttonbox).append(this.player).append(this.enemy);
  },
  start: function (recover) {
    game.tower.place();
    game.tree.place();
    game.units.place();
    game.chat.el.appendTo(this.el);
    if (game.turn.el) {
      game.turn.time.show();
      game.turn.msg.show();
    }
    this.camera.show();
    this.selectedArea.show();
    this.selectedCard.removeClass('flip');
    if (game.mode) game[game.mode].setTable();
  },
  buildSkills: function (side, single) {
    game[side].mana = 0;
    $('.map .'+side+'.heroes').each(function (i, card) {
      game[side].mana += $(card).data('mana');
    });
    game[side].maxCards = Math.round(game[side].mana / 2);
    game[side].cardsPerTurn = Math.round(game[side].mana / 5);
    game[side].skills = {};
    game[side].skills.hand = $('<div>').appendTo(game.states.table[side]).addClass('deck skills hand');
    game[side].skills.sidehand = $('<div>').appendTo(game.states.table[side]).addClass('deck skills sidehand');
    game[side].skills.ult = $('<div>').hide().appendTo(game.states.table[side]).addClass('deck skills ult');
    game[side].skills.temp = $('<div>').hide().appendTo(game.states.table[side]).addClass('deck skills temp');
    game[side].skills.cemitery = $('<div>').hide().appendTo(game.states.table[side]).addClass('deck skills cemitery');
    game[side].skills.deck = game.deck.build({
      name: 'skills',
      multi: !single,
      filter: game[side].picks,
      cb: function (deck) {
        deck.addClass('available').hide().appendTo(game.states.table[side]);
        $.each(deck.data('cards'), function (i, skill) {
          var side = this;
          skill.addClass(side).data('side', side).on('mousedown touchstart', game.card.select);
          if (skill.data('deck') === game.data.ui.temp) skill.appendTo(game[side].skills.temp);
          else if (skill.data('skill') === 'ult') skill.appendTo(game[side].skills.ult);
          else if (skill.data('type') === game.data.ui.toggle) skill.appendTo(game[side].skills.sidehand);
          else if (skill.data('type') === game.data.ui.instant) skill.appendTo(game[side].skills.sidehand);
        }.bind(side));
      }
    });
    if (side === 'enemy') {
      game.enemy.skills.showMoves = $('<div>').appendTo(game.states.table.enemy).addClass('deck skills showMoves');
      $('.enemy .skills').attr({ title: '' }).off('mousedown touchstart');
    }
  },
  enableUnselect: function () {
    game.states.table.el.on('mousedown touchstart', function () { 
      var target = $(event.target); 
      if (!target.closest('.button, .card, .movearea, .targetarea').length) {
        game.card.unselect();
        if (game.mode && game[game.mode].unselected) game[game.mode].unselected();
      }
    });
  },
  animateCast: function (skill, target) {
    if (typeof target === 'string') { target = $('#' + target); }
    var s = skill.offset(), t = target.offset();
    var x = t.left - s.left, y = t.top - s.top;
    //todo: remove 'top/left', use only 'transform' to improve performance
    skill.css({
      top: y + 30,
      left: x + 20, 
      transform: 'translate(-50%, -50%) scale(0.3)'
    });
    game.timeout(400, function () {
      $(this.skill).css({
        top: '',
        left: '',
        transform: ''
      });
    }.bind({ skill: skill }));
  },
  showResults: function () {
    if (!game.states.table.resultsbox) {
      game.states.table.selectedArea.hide();
      game.states.table.camera.hide();
      game.states.table.buttonbox.hide();
      $('.table .deck').hide();
      game.states.table.resultsbox = $('<div>').appendTo(game.states.table.el).addClass('resultsbox box');
      $('<h1>').appendTo(this.resultsbox).addClass('result').text(game.winner + ' ' + game.data.ui.victory);
      $('<h1>').appendTo(this.resultsbox).text(game.data.ui.towers + ' HP: ' + game.player.tower.data('current hp') + ' / ' + game.enemy.tower.data('current hp'));
      $('<h1>').appendTo(this.resultsbox).text(game.data.ui.heroes + ' ' + game.data.ui.kd + ': ' + game.player.kills + ' / ' + game.enemy.kills);
      game.states.table.playerResults = $('<div>').appendTo(game.states.table.resultsbox).addClass('results');
      game.states.table.enemyResults = $('<div>').appendTo(game.states.table.resultsbox).addClass('results enemy');
      $('.map .player.heroes.card').each(function () {
        var hero = $(this), heroid = $(this).data('hero'),
          img = $('<div>').addClass('portrait').append($('<div>').addClass('img')),
          text = $('<span>').text(hero.data('name') + ': ' + hero.data('kills') + ' / ' + hero.data('deaths'));
        $('<p>').appendTo(game.states.table.playerResults).addClass(heroid+' heroes').append(img, text);
      });
      $('.map .enemy.heroes.card').each(function () {
        var hero = $(this), heroid = $(this).data('hero'),
          img = $('<div>').addClass('portrait').append($('<div>').addClass('img')),
          text = $('<span>').text(hero.data('name') + ': ' + hero.data('kills') + ' / ' + hero.data('deaths'));
        $('<p>').appendTo(game.states.table.enemyResults).addClass(heroid+' heroes').append(img, text);
      });
      $('<div>').addClass('button close').appendTo(game.states.table.resultsbox).text(game.data.ui.close).on('mouseup touchend', function () {
        game.clear();
        game.states.changeTo('menu');
      });
    }
  },
  skipClick: function () {
    if (!game.states.table.skip.attr('disabled')) {
      game.states.table.skip.attr('disabled', true);
      game.highlight.clearMap();
      if (game[game.mode].skip) game[game.mode].skip();
    }
  },
  surrenderClick: function () {
    //online && tutorial
    game.confirm(function(confirmed) {
      if (confirmed && game.mode && game[game.mode].surrender) {
        game[game.mode].surrender();
      }
    }, game.data.ui.leave);
  },
  backClick: function () {
    //library only
    game.clear();
    game.setMode('library');
    game.states.changeTo('choose');
  },
  discardClick: function () {
    if (!game.states.table.discard.attr('disabled') &&
        game.selectedCard &&
        game.selectedCard.hasClass('skills') && 
        game.isPlayerTurn() ) {
      game.player.discard(game.selectedCard);
      game.states.table.discard.attr('disabled', true);
    }
  },
  clear: function () {
    game.map.clear();
    $('.table .card').remove();
    $('.table .deck').remove();
    if (this.resultsbox) {
      this.resultsbox.remove();
      this.resultsbox = null;
    }
    this.buttonbox.show().children().hide();
    this.selectedArea.removeClass('flip');
    this.el.addClass('unturn').removeClass('over');
    game.clearTimeouts();
  },
  end: function () {
    if (game.turn.el) {
      game.turn.msg.hide();
      game.turn.time.hide();
    }
  }
};
