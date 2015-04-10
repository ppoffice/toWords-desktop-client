var path = require('path');

// Directories
window.config = {};
config.baseDir = './toWords';
config.partialDir = path.join(config.baseDir, '/partial');
config.scriptDir = path.join(config.baseDir, '/js');
config.libDir = path.join(config.baseDir, '/lib');
config.cacheDir = './cache';
config.cookieFile = path.join(config.cacheDir, '/cookie');

// Modules
config.auth = path.join(config.scriptDir, '/auth');
config.req = path.join(config.scriptDir, '/req');

// Variables
config.cookieJar;

// URLs
config.baseUrl = 'http://www.towords.com/';
config.staticUrl = 'http://static.towords.com/';
config.authUrl = config.baseUrl + 'actions/userLogin.jsp?v=WEB|4.0';
config.userInfoUrl = config.baseUrl + 'user/modifyUserInfo.jsp';
config.welcomeUrl = config.baseUrl + 'API/startTowords.jsp';
config.scheduleUrl = config.baseUrl + 'assistant/schedule_new.jsp';
config.wordlistUrl = config.baseUrl + 'commons/userWordBook.jsp';
config.wordUrl = config.baseUrl + 'assistant/showWord.jsp';
config.booksUrl = config.baseUrl + 'books.jsp';
config.savePlanUrl = config.baseUrl + 'assistant/savePlan.jsp';
config.rankUrl = config.baseUrl + 'assistant/rank.jsp';
config.rankLastWeekUrl = config.baseUrl + 'assistant/rank.jsp?rankType=201';
config.settingsUrl = config.baseUrl + 'commons/userConfigs.jsp';
config.saveSettingsUrl = config.baseUrl + 'actions/saveUserConfig.jsp';
config.saveLabSettingsUrl = config.baseUrl + 'actions/saveUserLab.jsp';

config.toWordsUrl = function (is_stateChanged) {
  var url = config.baseUrl + "/API/twLite.jsp?isAPI2=false&v=WEB|4.1&version=2.0&from=web&bookId="+window.bookId+"&requestDate="+Math.random()+Date.parse(Date());
  if(is_stateChanged){
    url += "&stateChanged=1";
  }
  return url;
}