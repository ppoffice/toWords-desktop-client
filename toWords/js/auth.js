var FileCookieStore = require('tough-cookie-filestore'),
    request = require('request'),
    path = require('path'),
    fs = require('fs');

var checkCookieFile = function (callback) {
  // callback(error, cookiestore, ...)
  fs.exists(config.cookieFile, function (exists) {
    if(!exists)
      fs.writeFile(config.cookieFile, '', 'utf8', function (error) {
        var cookieStore = new FileCookieStore(config.cookieFile);
        callback(error, cookieStore);
      });
    else {
      var cookieStore = new FileCookieStore(config.cookieFile);
      callback(null, cookieStore);
    }
  });
}

var readCookies = function (callback) {
  // callback(success, ...)
  checkCookieFile(function (error, cookieStore) {
    if(error) console.log(error);
    var cookieJar = request.jar(cookieStore);
    var cookies = cookieJar.getCookies(config.baseUrl);
    for (var i = cookies.length - 1; i >= 0; i--) {
      var cookie = cookies[i];
      if(cookie.key == 'toWords_remember_username'){
        config.cookieJar = cookieJar;
        callback(true);
        return;
      }
    }
    callback(false);
  });
}

exports.detectLogin = function (callback) {
  // callback(success, ...)
  readCookies(callback);
}

exports.login = function (username, password, callback) {
  // callback(success, ...);
  var cookieJar = request.jar();
  request.post(
    {
      url: config.authUrl,
      form:{
        email: username,
        password: password,
        rememberMe: 1
      },
      jar: cookieJar
    },

    function(error, res, body){
      if(!error){
        checkCookieFile(function (error, cookieStore) {
          if(error) callback(false);
          var cookieValid = false;
          var cookies = cookieJar.getCookies(config.baseUrl);
          for (var i = cookies.length - 1; i >= 0; i--) {
            var cookie = cookies[i];
            cookieStore.putCookie(cookie);
            if(cookie.key == 'toWords_remember_username'){
              config.cookieJar = cookieJar;
              cookieValid = true;
            }
          }
          if(!cookieValid)
            callback(false);
          else
            callback(true);
        });
      }else{
        callback(false);
      }
    }
  );
}

exports.logout = function (callback) {
  fs.writeFile(config.cookieFile, '', 'utf8', function(error) {
    if(!error) console.log(error);
    callback();
  });
}