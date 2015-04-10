(function($){
  window.ui = {
    home: '',
    wordlist: '',
    books: '',
    leaderboard: '',
    settings: '',
    homePageAnim: null
  };

  var path = require('path'),
      fs = require('fs');
  
  var maskContainer = $('#mask-container');
  var mainContainer = $('#main-container');
  var mainMenuItem = $('#main-menu .menu-item');

  // Forbid unwanted element dragging
  document.ondragstart = function (e) {
    return false;
  }

  mainMenuItem.eq(0).addClass('active');
  mainMenuItem.click(function(){
    mainMenuItem.removeClass('active');
    $(this).addClass('active');
  });

  // wordlist scroll loading
  mainContainer.on('scroll', function () {
    var wordsContainer = $('.wordlists');
    if(wordsContainer.attr('data-nextDate') != undefined && wordsContainer.attr('data-end') != 'true' && mainContainer.scrollTop()) {
      if (mainContainer.scrollTop() + mainContainer.height() >= mainContainer.children('.wordlist').height()) {
        if(wordsContainer.attr('isLoading') === 'false') {
          wordsContainer.attr('isLoading', true);
          ui.showAlertTip('info', '正在加载更多，请稍候...');
          app.fetchWordlist(wordsContainer.attr('data-nextDate').toString().replace(/-/g, ''),
            function (wordlists) {
              setWordlist(wordlists);
            }
          );
        }
      }
    }
  });

  $('#home').click(function () {
    ui.showHome();
  });
  $('#wordlist').click(function () {
    ui.showWordlist();
  });
  $('#books').click(function () {
    ui.showBooks();
  });
  $('#leaderboard').click(function () {
    ui.showLeaderBoard();
  });
  $('#settings').click(function () {
    ui.showSettings();
  });

  $(document).on('click', '.book', function () {
    $('.book').removeClass('selected');
    $(this).addClass('selected');
    $('#datepicker').html('');
    $('#datepicker').removeClass();
    $('#datepicker').datepicker(
      {
        nextText: '',
        prevText: '',
        minDate: "+1d",
        defaultDate: new Date(window.startToWordsData.planDateStr),
        dayNamesMin: ['日', '一', '二', '三', '四', '五', '六'],
        monthNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
      }
    );
    $('#changeBook').attr('data-bookID', $(this).attr('data-id'));
    $('#changeBook').modal('show');
  });

  $(document).on('click', '#changeDate', function () {
    $('#datepicker').html('');
    $('#datepicker').removeClass();
    $('#datepicker').datepicker(
      {
        nextText: '',
        prevText: '',
        minDate: "+1d",
        defaultDate: new Date(window.startToWordsData.planDateStr),
        dayNamesMin: ['日', '一', '二', '三', '四', '五', '六'],
        monthNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
      }
    );
    $('#changeDeadline').modal('show');
  });

  $(document).on('click', '#changeBook #save', function () {
    ui.showAlertTip('info', '正在设置，请稍候...');
    var deadline = $.datepicker.formatDate("yy-mm-dd", $("#datepicker").datepicker("getDate"));
    if($('#changeBook').attr('data-bookID') == window.bookId) {
      app.setDeadline(deadline, function (message) {
        ui.home = '';
        ui.books = '';
        ui.showBooks();
      });
    } else {
      app.setCurrentBook($('#changeBook').attr('data-bookID'), deadline, function (bookInfo, planTime) {
        ui.home = '';
        ui.wordlist = '';
        ui.books = '';
        ui.leaderboard = '';
        ui.showBooks();
      });
    }
    $('#changeBook').modal('hide');
  });

  $(document).on('click', '#changeDeadline #save', function () {
    ui.showAlertTip('info', '正在设置，请稍候...');
    var deadline = $.datepicker.formatDate("yy-mm-dd", $("#datepicker").datepicker("getDate"));
    app.setDeadline(deadline, function (planTime) {
      ui.home = '';
      ui.showHome();
    });
    $('#changeDeadline').modal('hide');
  });

  $(document).on('click', '.wordlist .word', function () {
    if($(this).attr('data-content'))
      $('#word .modal-body').html($(this).attr('data-content'));
    else{
      $('#word .preloader').addClass('on');
      app.fetchWord($(this).attr('data-id'), function (id, word) {
        window.wordInStock = word;
        var html = '<div class="title"><h4>' + word.text + '</h4><div class="btn" id="wordSound"><i class="fa fa-volume-down"></i><span>发音</span></div></div>'
        + '<p class="meaning">' + word.meaning + '</p>'
        + '<div class="example-wrap"><p class="example">' + word.example + '</p><p class="translation">'
        + word.translation + '</p></div>';
        $('[data-id=' + id + ']').attr('data-content', html);
        $('#word .modal-body').html(html);
        $('#word .preloader').removeClass('on');
        $('#wordSound').click();
      });
    }
    $('#word').modal('show');
  });

  var cache = function () {
    switch(mainContainer.attr('data-page')) {
      case 'home':
        ui.home = mainContainer.html();
        break;
      case 'wordlist':
        ui.wordlist = mainContainer.html();
        break;
      case 'books':
        ui.books = mainContainer.html();
        break;
      case 'leaderboard':
        ui.leaderboard = mainContainer.html();
        break;
      case 'settings':
        ui.settings = mainContainer.html();
        break;
    }
  }

  var switchPage = function (name, cache, callback) {
    if(!cache)
      fs.readFile(path.join(config.partialDir, '/' + name + '.html'), 'utf8', function (error, data) {
        if(error) {
          mainContainer.html('ERROR: MISSING partial/' + name + '!');
        } else {
          $('.preloader').addClass('on');
          mainContainer.html(data);
          if(callback) callback();
        }
      });
    else {
      mainContainer.html(cache);
      $('.preloader').removeClass('on');
    }
    mainContainer.attr('data-page', name);
  }

  ui.cleanCache = function () {
    ui.home = '';
    ui.wordlist = '';
    ui.books = '';
    ui.leaderboard = '';
    ui.settings = '';
    ui.homePageAnim = null;
  }

  ui.logout = function () {
    $('#main-container').html('');
    $('#myAvatar img').attr('src', './css/images/default-avatar.jpg');
    $('#myName').html('未登录');
    mainMenuItem.removeClass('active');
    mainMenuItem.eq(0).addClass('active');
  }

  // Partials
  ui.showAuthDialog = function () {
    fs.readFile(path.join(config.partialDir, '/auth.html'), 'utf8', function (error, data) {
      if(error)
        data = 'ERROR: MISSING PARTIAL/AUTH!';
      maskContainer.html(data);
      $('#authDialog').modal({'show': true, 'backdrop': 'static'});
    });
  }

  // Partials
  ui.showToWordsDialog = function () {
    fs.readFile(path.join(config.partialDir, '/toWords.html'), 'utf8', function (error, data) {
      if(error)
        data = 'ERROR: MISSING PARTIAL/toWords!';
      maskContainer.html(data);
      $('#toWords').modal('show');
    });
  }

  var initProgress = function (container, percent) {
    if(percent > 50) {
      $(container + ' .circle .full .fill').css('transition', (percent - 50)*0.3/50 + 's linear 0.3s');
      $(container + ' .circle .half .fill').css('transform', 'rotate(180deg)');
      $(container + ' .circle .full .fill').css('transform', 'rotate(' + (percent - 50)*360/100 + 'deg)');
    } else {
      $(container + ' .circle .full .fill').css('transform', 'rotate(0deg)');
      $(container + ' .circle .half .fill').css('transform', 'rotate(' + percent*360/100 + 'deg)');
    }
  }

  var parseTime = function (str) {
    if(!str) return 0;
    var timeSec = 0, ret, pattern = /((\d*)天)*((\d*)小时)*((\d*)分)*((\d*)秒)*/i;
    if((ret = pattern.exec(str)) != null) {
      for (var i = 0; i < 4; i++) {
        switch (i) {
          case 0:
            timeSec = parseInt(ret[2]==undefined?0:ret[2]) * 24;
            break;
          case 1:
            timeSec = (timeSec + parseInt(ret[4]==undefined?0:ret[4])) * 60;
            break;
          case 2:
            timeSec = (timeSec + parseInt(ret[6]==undefined?0:ret[6])) * 60;
            break;
          case 3:
            timeSec += parseInt(ret[8]==undefined?0:ret[8]);
            break;
        }
      };
    }
    return timeSec;
  }

  var formatTime = function (second, digit) {
    if(!second) return '0秒';
    var str = '', day, hour, minute;
    if(second > 86400) {
      day = Math.floor(second / 86400);
      second -= day * 86400;
      str += (day&&(--digit >= 0)?day+'天':'');
    }
    if(second > 3600) {
      hour = Math.floor(second / 3600);
      second -= hour * 3600;
      str += (hour&&(--digit >= 0)?hour+'时':'');
    }
    if(second > 60) {
      minute = Math.floor(second / 60);
      second -= minute * 60;
      str += (minute&&(--digit >= 0)?minute+'分':'');
    }
    if(second > 0)
      str += (second&&(--digit >= 0)?second+'秒':'');
    return str;
  }

  function switchElement () {
    $('.slide-board').each(function (index, slide) {
      var firstChild = $(slide).children('.board').eq(0);
      firstChild.remove();
      $(slide).append(firstChild);
      $(slide).removeClass('switch');
    });
  }

  function slideBoardAnim () {
    $('.slide-board').addClass('switch');
    setTimeout(switchElement, 1000);
  }

  var setHome = function (welcomeObject) {
    initProgress('.main-progress .inner', welcomeObject.todayLearnPercent);
    initProgress('.main-progress .outer', welcomeObject.currentBookLearnPercent);
    $('.slide-board .book-name').html(welcomeObject.currentBookName);
    $('.progress-today .percent').html(welcomeObject.todayLearnPercent + "%");
    $('.progress-total .percent').html(welcomeObject.currentBookLearnPercent + "%");
    var currentState = '';
    switch(welcomeObject.currentState) {
      default:
      case 1:
        currentState = '学习阶段';
        break;
      case 2:
        currentState = '冲刺阶段';
        break;
      case 3:
        currentState = '总复习阶段';
        break;
      case 4:
        currentState = '重启总复习阶段';
        break;
    }
    $('.current-state .state').html(currentState);
    var ret, pattern = /拓前生词率.*?(\d*\.\d*)%/i;
    if((ret = pattern.exec(welcomeObject.welcome)) != null) {
      $('.unknown-rate .percent').html(ret[1] + '%');
      initProgress('.unknown-rate', ret[1]);
    } else {
      $('.unknown-rate .percent').html('暂无');
    }
    var date = welcomeObject.planDateStr.split('-');
    for(var i = 0; i < date.length; i++) {
      var innerHtml = '';
      for (var j = 0; j < date[i].length; j++) {
        innerHtml += '<i>' + date[i][j] + '</i>';
      };
      switch(i) {
        case 0:
          $('.deadline .year').html(innerHtml);
          break;
        case 1:
          $('.deadline .month').html(innerHtml);
          break;
        case 2:
          $('.deadline .day').html(innerHtml);
          break;
      }
    }
    cache();
    $('.preloader').removeClass('on');
    if(ui.homePageAnim)
      clearInterval(ui.homePageAnim);
    ui.homePageAnim = setInterval(slideBoardAnim, 3000);
  }
  var setHome_ = function (schedule) {
    $('.total-words-learned .words-learned').html(schedule.wordsLearned);
    $('.total-words-learned .words-total').html(schedule.wordsTotal);
    initProgress('.total-words-learned', schedule.wordsLearned/schedule.wordsTotal*100);
    $('.today-words-learned .words-learned').html(schedule.todayRemembered);
    $('.today-words-learned .words-total').html(schedule.todayLearned);
    initProgress('.today-words-learned', schedule.todayRemembered/schedule.todayLearned*100);
    var timeLearned = (schedule.timeLearned?parseTime(schedule.timeLearned):600),
        timeTotal = parseTime(schedule.timeTotal);
    $('.study-time .time-learned').html(formatTime(timeLearned, 2));
    $('.study-time .time-total').html(formatTime(timeTotal, 2));
    initProgress('.study-time', timeLearned/timeTotal*100);
    cache();
  }
  ui.showHome = function () {
    switchPage('home', ui.home, function () {
      app.fetchWelcomePage(function (welcomeObject) {
        setHome(welcomeObject);
      });
      app.fetchSchedule(function (schedule) {
        setHome_(schedule);
      });
    });
  }

  var setWordlist = function (wordlists) {
    var wordsContainer = $('.wordlists');
    wordsContainer.attr('isLoading', 'false');
    if(!wordlists || !wordlists.length) {
      wordsContainer.attr('data-end', 'true');
      return;
    }
    wordlists.forEach(function (wordlist) {
      var elementWords = '', elementWordlist = '';
      wordlist.words.forEach(function (word) {
        elementWords += '<li class="word pad" data-id="' + word.id + '">' + word.text + '</li>';
      });
      var elementWordlist = '<div class="wordlist-solo"><h3 class="wordlist-title"><i class="fa fa-calendar-o"></i>' + wordlist.time + '</h3>\
<ul class="words">' + elementWords + '</ul>\
</div>';
      wordsContainer.append(elementWordlist);
      wordsContainer.attr('data-nextDate', wordlist.time);
    });
    cache();
    $('.preloader').removeClass('on');
  }
  ui.showWordlist = function () {
    switchPage('wordlist', ui.wordlist, function () {
      app.fetchWordlist(0, function (wordlists) {
        setWordlist(wordlists);
      });
    });
  }

  var setBooks = function (bookshelves, currentBook) {
    var booksContainer = $('.bookselves'), bookshelf_index = 0;
    var currentBookContainer = $('.current-book-body');
    bookshelves.forEach(function (bookshelf) {
      var elementBooks = '', book_index = 0;
      bookshelf.books.forEach(function (book) {
        var percent = book.wordsLearned * 100/book.wordsTotal;
        var elementBook = "<div class='book pad col-2" + (book.id?'':' current') + "'\
 data-id='" + (book.id?book.id:0) + "' data-bookshelf='" + bookshelf_index + "'>\
<div class='foreground'>\
<i class='icon fa fa-book'></i>\
<div class='text-container'>\
<h4 class='book-title'>" + book.name + "</h4>\
<span class='wordsTotal'>总词数" + book.wordsTotal + "</span>\
<span class='wordsLearned'>已掌握" + book.wordsLearned + "</span>\
</div>\
</div>\
<div class='progress' style='" + (percent > 0?'width:'+percent+'%':'display:none;') + "'>\
<i class='icon fa fa-book'></i>\
<div class='text-container'>\
<h4 class='book-title'>" + book.name + "</h4>\
<span class='wordsTotal'>总词数" + book.wordsTotal + "</span>\
<span class='wordsLearned'>已掌握" + book.wordsLearned + "</span>\
</div>\
</div>\
</div>";
        if(bookshelf_index == currentBook.bookshelf_index && book_index == currentBook.book_index){
          currentBookContainer.append(elementBook);
        } else {
          elementBooks += elementBook;
        }
        book_index++;
      });
      var elementBookshelf = "<div class='bookshelf bookshelf-" + bookshelf_index + "'><h3 class='bookshelf-title'>" + bookshelf.name + "</h3>\
<div class='bookshelf-body'>" + elementBooks + "</div></div>";
      booksContainer.append(elementBookshelf);
      bookshelf_index++;
    });
    cache();
    $('.preloader').removeClass('on');
  }
  ui.showBooks = function () {
    switchPage('books', ui.books, function () {
      app.fetchBooks(function (bookshelves, currentBook) {
        setBooks(bookshelves, currentBook);
      });
    });
  }

  var setLeaderBoard = function (container, list) {
    var listContainer = $('.leaderboard .' + container + ' .list');
    var cnt = 0, maxTimeLen = 0, pattern = /((\d*)天)*((\d*)小时)*((\d*)分)*((\d*)秒)*/i;
    list.forEach(function (item) {
      var timeSec = parseTime(item.time);
      if(cnt == 1) maxTimeLen = timeSec;
      var percent = timeSec*80/maxTimeLen;
      var element = '<li class="list-item pad">\
<div class="foreground">'
+ (item.rank?'<span class="index">' + (cnt) +'</span>':'')
+ '<span class="username">' + item.username + '</span>\
<span class="time">' + item.time + '</span>\
<span class="rank fa rank-' + item.rankDirect + (item.rankDelta?' displayed':'') +'">\
<em>' + (item.rankDelta?item.rankDelta:'') + '</em></span>\
</div>\
<div class="progress" style="' + (percent>0?'width:'+percent+'%':'display:none') + '">\
<div class="progress-inner">\
<span class="index">' + (cnt) +'</span>\
<span class="username">' + item.username + '</span>\
<span class="time">' + item.time + '</span>\
<span class="rank fa rank-' + item.rankDirect + (item.rankDelta?' displayed':'') +'">\
<em>' + (item.rankDelta?item.rankDelta:'') + '</em></span>\
</div>\
</div>\
</li>';
      listContainer.append(element);
      cnt++;
    });
    cache();
    $('.preloader').removeClass('on');
  }
  ui.showLeaderBoard = function () {
    switchPage('leaderboard', ui.leaderboard, function () {
      app.fetchYesterdayRank(function (rankTitle, rankList) {
        $('.leaderboard .title').html(rankTitle);
        setLeaderBoard('yesterday', rankList);
      });
      app.fetchLastWeekRank(function (rankTitle, rankList) {
        $('.leaderboard .title').html(rankTitle);
        setLeaderBoard('last-week', rankList);
      });
    });
  }

  var setSettings = function (settings) {
    $('.shortcut-key .radio').removeClass('selected');
    $('.shortcut-key .radio').eq(settings.shortcut).addClass('selected');
    $('.sound .radio').removeClass('selected');
    $('.sound .radio.value-' + settings.sound).eq(0).addClass('selected');
    $('.accent .radio').removeClass('selected');
    $('.accent .radio.value-' + settings.accent).eq(0).addClass('selected');
    $('.answer-feedback .radio').removeClass('selected');
    $('.answer-feedback .radio.value-' + settings.answer_feedback).eq(0).addClass('selected');
    if(settings.iRemember == 'on')
      $('.iRemember .checkbox').addClass('selected');
    else
      $('.iRemember .checkbox').removeClass('selected');
    var sliderValue = ((settings.countdown - 5) * 10) + '%';
    $('.slider-handle').css('left', sliderValue);
    $('.slider-progress').css('width', sliderValue);
    $('.slider-handle').attr('data-value', settings.countdown);
    cache();
    $('.preloader').removeClass('on');
  }
  ui.showSettings = function () {
    switchPage('settings', ui.settings, function () {
      if(window.settings)
        setSettings(window.settings);
      else
        app.fetchSettings(function (settings) {
          setSettings(settings);
        });
    });
  }

  ui.hideAuthDialog = function () {
    $('#authDialog').modal('hide');
  }

  ui.showAlertTip = function (type, text, duration) {
    if(!duration) duration = 2000;
    $('#alertTip').removeClass();
    $('#alertTip').addClass('on');
    $('#alertTip').addClass('palette-' + type);
    $('#alertTip .text').html(text);
    setTimeout("$('#alertTip').removeClass('on');", duration);
  }

  ui.setAvatar = function (url) {
    $('#myAvatar img').attr('src', url);
  }
  ui.setUsername = function (username) {
    $('#myName').html(username);
  }

  $(document).on('click', '#wordSound', function () {
    if(wordInStock) {
      var url = toWords.getWordUrl(wordInStock.text, isUS, wordInStock.polyphone);
      voice.playWord(url);
    }
  });
  
})(jQuery);