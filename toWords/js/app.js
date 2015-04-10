var auth = require('./' + config.auth),
    req = require('./' + config.req),
    fs = require('fs');

window.app = {};

// login state detect
$(document).ready(function () {
  initVariables();
  checkCacheDir(function () {
    auth.detectLogin(function (result) {
      if(!result) {
        ui.showAuthDialog();
      } else {
        app.init();
      }
    });
  });
});

var checkCacheDir = function (callback) {
  fs.exists(config.cacheDir, function (exist) {
    if(!exist) {
      fs.mkdir(config.cacheDir, 0777, function (err) {
        if(err)
          ui.showAlertTip('danger', '创建缓存文件夹失败，请手动创建：安装目录'+config.cacheDir);
        else
          callback();
      });
    } else {
      callback();
    }
  });
}

var networkAlertTip = function () {
  ui.showAlertTip('danger', '获取信息失败，请检查网络连接后重试');
}

var initVariables = function () {
  window.user = {};
  window.settings = {};
  window.bookId = 0;
}

app.init = function () {
  req.fetchBasicInfo(function (error) {
    if(error)
      networkAlertTip();
    else {
      ui.setUsername(user.name);
      ui.setAvatar(user.avatar);
    }
  });
  ui.showHome();
  app.fetchSettings();
}

app.fetchWelcomePage = function (callback) {
  req.fetchWelcomePage(function (error, welcomeObject) {
    if(error)
      networkAlertTip();
    else{
      callback(welcomeObject);
      window.bookId = welcomeObject.bookId;
      window.startToWordsData = welcomeObject;
      toWords.startTowords();
    }
  });
}

app.fetchSchedule = function (callback) {
  req.fetchSchedule(function (error, schedule) {
    if(error)
      networkAlertTip();
    else
      callback(schedule);
  });
}

app.fetchWordlist = function (nextDate, callback) {
  req.fetchWordlist(nextDate, function (error, wordlists) {
    if(error)
      networkAlertTip();
    else
      callback(wordlists);
  });
}

app.fetchWord = function (id, callback) {
  req.fetchWord(id, function (error, word) {
    if(error)
      networkAlertTip();
    else
      callback(id, word);
  });
}

app.fetchBooks = function (callback) {
  req.fetchBooks(function (error, bookshelves, currentBook) {
    if(error)
      networkAlertTip();
    else
      callback(bookshelves, currentBook);
  });
}

app.setCurrentBook = function (bookID, deadline, callback) {
  req.setCurrentBook(bookID, deadline, function (error, bookObject, timeObject) {
    if(error)
      networkAlertTip();
    else
      callback(bookObject.book, timeObject.message);
  });
}

app.setDeadline = function (deadline, callback) {
  req.setDeadline(deadline, function (error, timeObject) {
    if(error)
      networkAlertTip();
    else
      callback(timeObject.message);
  });
}

app.fetchYesterdayRank = function (callback) {
  req.fetchYesterdayRankInfo(function (error, rankTitle, rankList) {
    if(error)
      networkAlertTip();
    else
      callback(rankTitle, rankList);
  });
}

app.fetchLastWeekRank = function (callback) {
  req.fetchLastWeekRankInfo(function (error, rankTitle, rankList) {
    if(error)
      networkAlertTip();
    else
      callback(rankTitle, rankList);
  });
}

app.fetchSettings = function (callback) {
  req.fetchSettings(function (error, settings) {
    if(error)
      networkAlertTip();
    else {
      window.settings = settings;
      switch(parseInt(settings.shortcut)) {
        default:
        case 0:
          window.keyCodes = ['a', 'b', 'c', 'd'];
          break;
        case 1:
          window.keyCodes = ['1', '2', '3', '4'];
          break;
        case 2:
          window.keyCodes = ['a', 's', 'd', 'f'];
          break;
        case 3:
          window.keyCodes = ["Up", "Down", "Left", "Right"];
          break;
        case 4:
          window.keyCodes = ['j', 'k', 'l', "fenhao"];
          break;
      }
      window.soundSetting = parseInt(settings.sound);
      window.answerFeedback = parseInt(settings.answer_feedback);
      window.countDownTime = parseInt(settings.countdown);
      window.isUS = (settings.accent == '1'?true:false);
      switch(settings.iRemember) {
        default:
        case 'on':
          window.lab_1 = true;
          break;
        case 'off':
          window.lab_1 = false;
          break;
      }
      if(callback) callback(settings);
    }
  });
}

app.saveSettings = function (param, value, callback) {
  req.saveSettings(param, value, function (error, success) {
    callback(success);
    if(error || !success)
      networkAlertTip();
    else {
      ui.showAlertTip('success', '设置保存成功');
      app.fetchSettings();
    }
  });
}

app.saveLabSettings = function (param, value, callback) {
  req.saveLabSettings(param, value, function (error, success) {
    callback(success);
    if(error || !success)
      networkAlertTip();
    else {
      ui.showAlertTip('success', '设置保存成功');
      app.fetchSettings();
    }
  });
}

app.requestWord = function (url, form, callback) {
  req.requestWord(url, form, function (error, data) {
    if(!error) {
      callback(data);
    } else {
      networkAlertTip();
    }
  });
}

app.logout = function () {
  auth.logout(function () {
    ui.showAuthDialog();
    ui.logout();
    ui.cleanCache();
    initVariables();
  });
}