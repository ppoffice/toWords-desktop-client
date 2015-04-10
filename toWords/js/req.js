var request = require('request'),
    async = require('async'),
    $ = require('jquery');

var fetchHTML = function (url, callback) {
  // callback(error, body...)
  request(url, function(error, response, body) {
    if(!error) {
      callback(null, body);
    } else {
      callback(error, null);
    }
  });
}

var basicUserInfoHandler = function (data, callback) {
  try{
    window.user.name = $(data).find('#userName').val();
    window.user.email = $(data).find('#email').val();
  } catch (error) {
    console.log(error)
  }
  callback(null);
}

var userAvatarHandler = function (data, callback) {
  try{
    window.user.avatar = $(data).find('.portrait').attr('src');
  } catch (error) {
    console.log(error)
  }
  callback(null);
}

var JSONHandler = function (jsonData, callback) {
  try {
    var json = JSON.parse(jsonData);
    callback(null, json);
  } catch (error) {
    callback(error, null);
  }
}

var scheduleHandler = function (data, callback) {
  var schedule = {};
  $(data).nextAll('div').each(function (index, div) {
    var divHtml = $(div).html();
    if($(div).html().match('点击，查看已掌握单词')) {
      var ret, pattern = /共(\d*)，掌握/i, 
          ret_, pattern_ = /&nbsp;(\d*)&nbsp;/i;
      if((ret = pattern.exec(divHtml)) != null) {
        schedule.wordsTotal = ret[1];
        if((ret_ = pattern_.exec(divHtml)) != null) {
          schedule.wordsLearned = ret_[1];
        }
      }
    }
    if($(div).attr('id') && $(div).attr('id').match('studyState1')) {
      var ret, pattern = /建议拓(.*)，/i, 
          ret_, pattern_ = /已拓&nbsp;(.*)/i;
      if((ret = pattern.exec(divHtml)) != null) {
        schedule.timeTotal = ret[1];
      }
      if((ret_ = pattern_.exec(divHtml)) != null) {
        schedule.timeLearned = ret_[1];
      }
    }
    if($(div).attr('id') && $(div).attr('id').match('studyState2')) {
      var ret, pattern = /学习(\d*)，掌握(\d*)/i;
      if((ret = pattern.exec(divHtml)) != null) {
        schedule.todayLearned = ret[1];
        schedule.todayRemembered = ret[2];
      }
    }
  });
  callback(null, schedule);
}

var wordlistHandler = function (data, callback) {
  var wordlists = new Array;
  var ret, pattern = /\[(\d{4}-\d{2}-\d{2})\]<br>([\s\S]*?)<br>/g;
  var ret_word, pattern_word = /<a class="showWordButton" href=".*?wordId=(\d*?)">(.*?)<\/a>/ig;
  while((ret = pattern.exec(data)) != null) {
    var wordlist = {}, container;
    wordlist.time = ret[1];
    wordlist.words = new Array;
    container = ret[2];
    while((ret_word = pattern_word.exec(container)) != null) {
      var word = {};
      word.id = ret_word[1];
      word.text = ret_word[2];
      wordlist.words.push(word);
    }
    if(wordlist) wordlists.push(wordlist);
  }
  callback(null, wordlists);
}

var wordHandler = function (data, callback) {
  var word = {};
  var ret, pattern = /'polyphone':(\d)/i;
  if((ret = pattern.exec(data)) != null) {
    word.polyphone = ret[1];
  } else {
    word.polyphone = "0";
  }
  var wordBody = $(data).find('.great');
  wordBody.find('#speakerDiv').remove();
  word.text = wordBody.html().replace('&nbsp;', '');
  $(data).find('.small').each(function (index, item) {
    switch(index) {
      case 0:
        word.meaning = $(item).html();
        break;
      case 1:
        word.example = $(item).html();
        break;
      case 2:
        word.translation = $(item).html();
        break;
    }
  });
  callback(null, word);
}

var booksHandler = function (data, callback) {
  var bookshelves = new Array;
  var currentBook = '';
  $(data).find('.slide_title').each(function (bookshelf_index, item) {
    var bookshelf = {}, books = new Array;
    var ret_, pattern_ = /\d*(.*)/ig;
    if((ret_ = pattern_.exec($(item).html())) != null)
      bookshelf.name = ret_[1];
    var book_index = 0;
    $(item).nextAll('div').each(function (index, div) {
      if($(div).hasClass('slide_title')) return false;
      var book = {};
      $(div).find('span').each(function (index, span) {
        if(!index) {
          book.name = $(span).html();
        } else {
          var ret, pattern = /单词数(\d*).*掌握(\d*)/ig;
          if((ret = pattern.exec($(span).html())) != null){
            book.wordsTotal = ret[1];
            book.wordsLearned = ret[2];
          }
          var id = $(span).find('a').attr('id');
          pattern = /bb_(\d*)/ig;
          if((ret = pattern.exec(id)) != null){
            book.id = ret[1];
          }
          if($(span).find('a').html().match('正在学')) {
            currentBook = {
              'bookshelf_index': bookshelf_index, 
              'book_index': book_index
            };
          }
          book_index++;
        }
      });
      if(book.name) books.push(book);
    });
    bookshelf.books = books;
    bookshelves.push(bookshelf);
  });
  callback(null, bookshelves, currentBook);
}

var rankHandler = function (data, callback) {
  var rankTitle, rankList = new Array;
  var ret, pattern = RegExp('title=\'(.*?)\'.*?&nbsp;(.*?)：(.*?)</li', 'ig');
  var ret_up, pattern_up = RegExp('上升([\\d]+)名', 'i');
  var ret_down, pattern_down = RegExp('下降([\\d]+)名', 'i');
  var ret_me, pattern_me = /<div title="学够.*?，才有资格获得名次">我：(.*?学习时间过短，无名次)<\/div>/i;
  if((ret_me = pattern_me.exec(data)) != null) {
    var rankItem = {
      rankDirect: 0,
      rankDelta: 0,
      username: '我',
      time: ret_me[1],
      rank: 0
    }
    rankList.push(rankItem);
  }
  while((ret = pattern.exec(data)) != null){
    var rankDirect = '', rankDelta = 0;
    if((ret_up = pattern_up.exec(ret[1])) != null){
      rankDirect = 'up';
      rankDelta = ret_up[1];
    } else if((ret_down = pattern_down.exec(ret[1])) != null){
      rankDirect = 'down';
      rankDelta = ret_down[1];
    }
    var rankItem = {
      rankDirect: rankDirect,
      rankDelta: rankDelta,
      username: ret[2],
      time: ret[3]
    }
    rankList.push(rankItem);
  }
  pattern = RegExp('(.*)-努力榜', 'i');
  if((ret = pattern.exec(data)) != null){
    rankTitle = ret[1];
  }
  callback(null, rankTitle, rankList);
}

var settingsHandler = function (data, callback) {
  var radioExp = function (name, data) {
    var ret, pattern = RegExp('checked value="(\\d)" name="' + name + '"', 'i');
    if((ret = pattern.exec(data)) != null)
      return ret[1];
    else
      return 0;
  }
  var settings = {};
  settings.shortcut = radioExp('SHORTCUT_KEY_SCHEME', data);
  settings.sound = radioExp('SOUND_SETTING', data);
  settings.accent = radioExp('SOUND_TYPE', data);
  settings.answer_feedback = radioExp('ANSWER_FEEDBACK', data);
  pattern = RegExp('<option value="(\\d*?)" selected>', 'i');
  if((ret = pattern.exec(data)) != null)
    settings.countdown = ret[1];
  else
    settings.countdown = 10;
  pattern = RegExp('<div class=" none" id="button_(.*?)_1">', 'i');
  if((ret = pattern.exec(data)) != null)
    settings.iRemember = ret[1];
  else
    settings.iRemember = 'on';

  callback(null, settings);
}

var saveSettingsHandler = function (error, response, callback) {
  if(error) console.log(error);
  var success = false;
  if(response.statusCode == 200)
    success = true;
  callback(error, success);
}

var taskFetchBasicUserInfo = function (callback) {
  async.waterfall([
    function (callback) {
      fetchHTML(config.userInfoUrl, function (error, body) {
        callback(error, body);
      });
    }, basicUserInfoHandler], callback
  );
}

var taskAvatarInfo = function (callback) {
  async.waterfall([
    function (callback) {
      fetchHTML(config.rankUrl, function (error, body) {
        callback(error, body);
      });
    }, userAvatarHandler], callback
  );
}

var saveUserSettings = function (param, value, callback) {
  var url = config.saveSettingsUrl + '?paramName=' + param + '&value=' + value
   + '&timeParam=' + Math.round((new Date).getTime()/1e3);
  request(url, function(error, response, body) {
    callback(error, response, body);
  });
}

var setCurrentBookID = function (bookID, callback) {
  async.waterfall([function (callback) {
    saveUserSettings('lastBookId', bookID, function (error, response, body) {
      callback(error, body);
    });
  }, JSONHandler], callback);
}

var setDeadline = function (deadline, callback) {
  var url = config.savePlanUrl + '?planDate=' + deadline + '&timeParam=' + Math.round((new Date).getTime()/1e3);
  async.waterfall([
    function (callback) {
      fetchHTML(url, function (error, body) {
        callback(error, body);
      });
    }, JSONHandler], callback
  );
}

var fetchRankInfo = function (url, callback) {
  async.waterfall([
    function (callback) {
      fetchHTML(url, function (error, body) {
        callback(error, body);
      });
    }, rankHandler], callback
  );
}

exports.fetchBasicInfo = function (callback) {
  // set cookies
  request = request.defaults({ jar : config.cookieJar });
  async.parallel([taskFetchBasicUserInfo, taskAvatarInfo], function (error) {
    callback(error);
  });
}

exports.fetchWelcomePage = function (callback) {
  async.waterfall([
    function (callback) {
      fetchHTML(config.welcomeUrl, function (error, body) {
        callback(error, body);
      });
    }, JSONHandler], callback
  );
}

exports.fetchSchedule = function (callback) {
  async.waterfall([
    function (callback) {
      fetchHTML(config.scheduleUrl, function (error, body) {
        callback(error, body);
      });
    }, scheduleHandler], callback
  );
}

exports.fetchWordlist = function (nextDate, callback) {
  var url = (nextDate?config.wordlistUrl + '?nextDate=' + nextDate:config.wordlistUrl);
  async.waterfall([
    function (callback) {
      fetchHTML(url, function (error, body) {
        callback(error, body);
      });
    }, wordlistHandler], callback
  );
}

exports.fetchWord = function (id, callback) {
  var url = config.wordUrl + '?wordId=' + id;
  async.waterfall([
    function (callback) {
      fetchHTML(url, function (error, body) {
        callback(error, body);
      });
    }, wordHandler], callback
  );
}

exports.fetchBooks = function (callback) {
  async.waterfall([
    function (callback) {
      fetchHTML(config.booksUrl, function (error, body) {
        callback(error, body);
      });
    }, booksHandler], callback
  );
}

exports.setCurrentBook = function (bookID, deadline, callback) {
  // callback(error, bookInfo, planTime, ...)
  setCurrentBookID(bookID, function (error, bookInfo) {
    if(error || !bookInfo) {
      callback(error, null, null);
    } else {
      setDeadline(deadline, function (error, planTime) {
        callback(error, bookInfo, planTime);
      });
    }
  });
}

exports.setDeadline = function (deadline, callback) {
  setDeadline(deadline, function (error, planTime) {
    callback(error, planTime);
  });
}

exports.fetchYesterdayRankInfo = function (callback) {
  fetchRankInfo(config.rankUrl, callback);
}

exports.fetchLastWeekRankInfo = function (callback) {
  fetchRankInfo(config.rankLastWeekUrl, callback);
}

exports.fetchSettings = function (callback) {
  async.waterfall([
    function (callback) {
      fetchHTML(config.settingsUrl, function (error, body) {
        callback(error, body);
      });
    }, settingsHandler], callback
  );
}

exports.saveSettings = function (param, value, callback) {
  // callback(error, success...)
  saveUserSettings(param, value, function (error, response, body) {
    saveSettingsHandler(error, response, callback);
  });
}

exports.saveLabSettings = function (param, value, callback) {
  // callback(error, success...)
  var url = config.saveLabSettingsUrl + '?labId=' + param + '&value=' + value
   + '&timeParam=' + Math.round((new Date).getTime()/1e3);
  request(url, function(error, response, body) {
    saveSettingsHandler(error, response, callback);
  });
}

exports.requestWord = function (url, form, callback) {
  request.post({url: url, form: form}, function (error, res, body) {
    if(res.statusCode == 200) {
      try {
        var data = JSON.parse(body);
        callback(error, data);
      } catch (err) {
        callback(err, null);
        console.log(err.message);
      }
    } else {
      callback('Error. Status Code: '+res.statusCode, null);
    }
  });
}