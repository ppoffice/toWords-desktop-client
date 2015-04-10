var req = require('./' + config.req);

window.toWords = {};
var 
  USER_TYPE_ADMIN = 3, USER_TYPE_SUPPORT = 2, USER_TYPE_PAID = 1, USER_TYPE_REGISTED = 0, USER_TYPE_UNREGISTED = -1, 
  US_SOUND_NAME_PREFIX = "-$-", US_SOUND_PATH_PREFIX = "sounds_US/", SOUND_ID_PREFIX = "tws_", 
  MAX_PRELOAD_SOUND_NUMBER = 5, REGRET_TIME_PER_MINUTES = 18e4, MAX_REGART_TIME = 5, 
  FANCYBOX_SHOW_QUESTION = 0, FANCYBOX_SHOW_ANSWER = 1, FANCYBOX_IS_HIDDEN = 2, FANCYBOX_SHOW_HELPER = 3, 
  INFO_TYPE_SESSION_TIMEOUT = 0, INFO_TYPE_STATE_CHANGED = 2, INFO_TYPE_SHOW_HELPER = 4, 
  INFO_TYPE_SHOW_NOTIFICATION = 5, INFO_TYPE_SHOW_CLOCKOFF = 6, INFO_TYPE_WORDQUEUE_ERROR = 7, 
  INFO_TYPE_TOWORDS_ERROR = 8, USER_HAS_SOMEWHERE_LOGGED_IN = 0, USER_HAS_NOT_LOGGED_IN = 1, 
  STATE_HAS_NOT_CHANGED = 0, STATE_HAS_CHANGED = 1, TOWORDS_STATE_STUDY = 1, TOWORDS_STATE_SPRINT = 2, 
  TOWORDS_STATE_FINAL_REVIEW = 3, TOWORDS_STATE_FINAL_REVIEW_END = 4, SKILL_TYPE_READ = 1, SKILL_TYPE_LISTEN = 2, 
  SKILL_TYPE_WRITE = 3;

var
  currWord = null, nextWord = null, helping = !1, tryGetNextTimes = 0, iKnow = !1, iKnowScore = 5, 
  currCorrect = null, remainderRegratTimes = 2, regrated_study_time = 0, one_regrat_need = 18e4, maxRemainderRegratTimes = 5, 
  wordQueue = [], errwords = [], allWordQueue = [], allErrwords = [], currErrWords = null, lastWord = null, stateChanged = 0, 
  stateChangedVal = STATE_HAS_NOT_CHANGED, state, startTime, countDown1, countDownTime1, sessionFailed = 0, 
  params = new Array, isSaving = !1, errorOrUnknow = 2, windowMode = FANCYBOX_SHOW_QUESTION, isInIKnowMode = !1, 
  option_shortcuts = {}, notify = 0, hasNotify = 0, isConfirmNotify = 0, onlineTime = 0, viewAnswerTime = 0, isCurrCorrect = true, 
  hasShownClockOffPage = true, isUnderLoad = false, requestLock = false, requestTimeout = null, lastChangedState = false;

var setNewStart = function(){
  startTime = new Date().getTime();
}

//获取单词发音地址
toWords.getWordUrl = function(wordBody, isUSSound, polyphone){
  var soundPathPrefix = isUSSound?US_SOUND_PATH_PREFIX:"",soundNamePrefix = isUSSound?US_SOUND_NAME_PREFIX:"",
  soundUrl = config.staticUrl + "sound/"+soundPathPrefix+ wordBody.substring(0, 1).toLowerCase() + "/"+soundNamePrefix+ wordBody.toLowerCase() + (polyphone==0?"":("("+polyphone+")"))+".mp3";
  return soundUrl;
}

//保存时间处理得出反悔次数，私有方法
/*
 参数为true的时候，时间被加至viewAnswerTime（看答案），参数为空或者flase的时候，时间被加至onlineTime（看题目）
 * */
var saveTimeSync = function(_is_ViewAnswer) {
    var _time = new Date().getTime() - startTime;
    if (_is_ViewAnswer) {
      //看答案时间最多只算10S
      _time = (_time>10000) ? 10000 : _time;
        viewAnswerTime = viewAnswerTime + _time;
    } else {
      //看题目时间不能超过设定的时间
      _time = (_time > countDownTime * 1000) ? countDownTime * 1000 :_time;
        onlineTime = onlineTime + _time;
    }
    //计算可以使用的反悔次数
    if (regrated_study_time < one_regrat_need) {
        regrated_study_time += _time;
    } else {
        regrated_study_time -= one_regrat_need;
        remainderRegratTimes = (remainderRegratTimes < maxRemainderRegratTimes) ? remainderRegratTimes+1 : maxRemainderRegratTimes;
    }
    //重置开始时间
    setNewStart();
};

//预取词，私有方法
var preloadSound = function(list){
  voice.preload(list);
};

//预取词，私有方法
var preloadSoundForWordQueue = function(wordlist, MAX_PRELOAD_SOUND_NUMBER){
  try{
    var _list = []
    for(var _i=0;_i<MAX_PRELOAD_SOUND_NUMBER;_i++){
      _list.push(wordlist[_i]['sound']);
    }
    preloadSound(_list);
  }catch(e){}
};

//判断是否用户改变学习状态，私有方法
var isStateChanged = function(data){
  data.stateChanged = (data.stateChanged != null || typeof(data.stateChanged) != "undefined") ? data.stateChanged : STATE_HAS_NOT_CHANGED;
  return data.stateChanged;
}

//判断用户是否异地登录，私有方法
var isOtherLogin = function(data){
  return data.cas*1 === 0 && data.words*1 === -1;
}
  
//确认进度改变
var ConfirmStateChange = function(){
  stateChanged = STATE_HAS_NOT_CHANGED;
}

//从服务器获取信息并简单解析，私有方法
var getRequest = function(callback, is_stateChanged) {
  callback = callback?callback:$.noop;
  var url = config.toWordsUrl(is_stateChanged);
  var form =  (currWord != null && !isSaving) ? {params:params.toString(),close:'false'} : {};
  if (currWord != null && !isSaving) {
      isSaving = true;
      params = [];
  }
  app.requestWord(url, form, function (data) {
    //判断是否异地登录，登录直接调用callback停止
    if(isOtherLogin(data)){
      app.logout();
      return;
    }
    //判断是否改变学习状态，改变的话停止，并在生成页面的时候生成
    stateChanged = isStateChanged(data);
    if(stateChanged){
      callback("ready");
      clearQueue();
      return;
    }
    //如果返回为空重新获取
    if(!data || !data.words || data.words===[]){
      return getRequest(callback, is_stateChanged);
    }
    isSaving = false;
    state = data.state;
    //更新单词列队
    for(var _i in data.words){
      if(data.errwords[_i]){
        //过滤错误标签
        data.words[_i].body = data.words[_i].body.replace(/25/g, "").replace(/\%2B/g, " ").replace(/\+/g, " ");
        data.words[_i].sound = toWords.getWordUrl(data.words[_i]['body'], settings.accent, data.words[_i]['polyphone']);
        if(!(data.words[_i].body=='null'||data.words[_i].body=='watch')) {
          allWordQueue.push(data.words[_i]);
          allErrwords.push(data.errwords[_i]);
        } else {
          var bb = "correct=1|ref=" + data.words[_i].ref + "|state=" + 
          state + "|reviewCorrect=0|score=" + data.words[_i].score + 
          "|errortimes=" + data.words[_i].errortimes + "|righttimes=" + 
          data.words[_i].righttimes + "|wordId=" + data.words[_i].wordId + 
          "|body=" + data.words[_i].body + "|studyTag=" + 
          data.words[_i].studyTag + "|otime=0|atime=0|errorOrUnknow=2";
          params.push(bb);
        }
      }
    }
    //调用成功函数
    callback("ready");
    if(isUnderLoad){
      isUnderLoad = false;
      getWord();
    }
    //是否显示打卡页面
    hasShownClockOffPage = !!(data.hasShownClockOffPage*1);
  });
}

//从本地队列中取词
var getWord  = function(){
  if(stateChanged) return;
  if(allWordQueue.length < 30 && !requestLock){
    addRequestLock();
    getRequest();
  }
  var _new_data_length = allWordQueue.length >= 5 ? 5 : allWordQueue.length,data = {};
  data.words = allWordQueue.splice(0,_new_data_length);
  data.errwords = allErrwords.splice(0,_new_data_length);
  //从服务器数据加入队列
  wordQueue = wordQueue.concat(data.words);
  errwords = errwords.concat(data.errwords);
  //单词预取
  preloadSoundForWordQueue(data.words, MAX_PRELOAD_SOUND_NUMBER);   
}

//检测最新单词是否符合规规定，私有方法
var _checkCurrentWord = function(data){

}

//删除已学习单词，私有方法
var deleteCurrWord = function(){
  if (wordQueue != null && wordQueue.length >1) {
    wordQueue.shift();
    isUnderLoad = false;
  }else{
    isUnderLoad = true;
  }
  if (errwords != null && wordQueue.length >1) {errwords.shift();}
}

//列队取词加锁3s，私有方法
var addRequestLock = function(){
  requestLock = true;
  requestTimeout = setTimeout(function(){
    requestLock = false;
  },3000) 
}

//清空锁，私有方法
var clearRequestLock = function(){
  requestLock = false;
  if (requestTimeout){
    clearTimeout(requestTimeout);
  }
}
  
//保存当前单词并返回数据，公共方法
toWords.saveCurrWord =  function(is_correct, callback) {
  var callback = callback ? callback : $.noop;
  //is_correct答对=1，pass=2，答错=0
  if (currWord==null) return;
  //新单词结果写入列队
  if(isCurrCorrect&&!isUnderLoad){
    //提交单词的时候更新总的看题目的时间
    saveTimeSync();
    if(is_correct<=0){errorOrUnknow = Math.abs(is_correct);}
    var b = "correct=" + (is_correct==-1?0:is_correct) + "|ref=" + currWord.ref
     + "|state=" + state + "|reviewCorrect=" + currWord.correct + "|score=" + currWord.score 
     + "|errortimes=" + currWord.errortimes + "|righttimes=" + currWord.righttimes + "|wordId=" 
     + currWord.wordId + "|body=" + currWord.body + "|studyTag=" + currWord.studyTag + "|otime=" 
     + onlineTime + "|atime=" + viewAnswerTime + "|errorOrUnknow=" + errorOrUnknow;
    params.push(b);
    viewAnswerTime = 0;
  } else {
    setNewStart();
    //更新看答案时间
    if(!isUnderLoad){
      saveTimeSync(true);
    }
  }
  //根据作答情况显示
  if(is_correct==0||is_correct==-1){
    //显示单词答错
    isCurrCorrect = false;
    callback(0, currWord.body);
    is_correct = 0;
  } else if (is_correct==2){
    //显示直接判断认识不出现
    //从列表中删除该单词
    isCurrCorrect = true;
    deleteCurrWord();
    callback(6, currWord.body);
  } else if (is_correct == 1) {
    if (currWord.score < 10) {
      //从列表中删除该单词
      deleteCurrWord();
        if (currWord.errortimes == 0 && currWord.righttimes == 2&&isCurrCorrect) {
          //返回答对以及当前单词
          isCurrCorrect = true;
          callback(2, currWord.body);
        } else  if (currWord.score == 9&&isCurrCorrect) {
          //提示单词不会再次出现
          isCurrCorrect = true;
          callback(1, currWord.body);
        } else {
          //显示单词答对
          isCurrCorrect = true;
          callback(4, currWord.body);
        }
    } else {
      //显示答对
      isCurrCorrect = true;
      deleteCurrWord();
      callback(4, currWord.body);
    }
  }
  //检测单词列队长度以及加锁情况，取词同时加锁
  if (stateChanged == STATE_HAS_NOT_CHANGED && wordQueue != null && wordQueue.length < 9) {
    getWord();
  }
  //初始化数据
  errorOrUnknow = 2;
  onlineTime = 0;
};

//撤销以及继续操作
toWords.goOn = function(is_cancel) {
  //将返回次数减一
  if (is_cancel) {
    isCurrCorrect = true;
    remainderRegratTimes -= (remainderRegratTimes > 0) ? 1 : 0;
    currCorrect = null;
    //删除之前学习记录
    params.pop();
  }
  //更新看答案时间
  saveTimeSync(true);
}

//关闭的时候保存进度，公共方法
toWords.saveWordsOnClose = function() {
  //更新首页进度信息
  var _fresh_schedule = function(){
    ui.home = '';
    ui.showHome();
  }
  if (params.length > 0) {
    //处理单词列队
    var url = config.toWordsUrl(false);
    var form =  {params:params.toString(),close:'true'};
    app.requestWord(url, form, function (data) {
      _fresh_schedule();
    });
    params = [];
  } else {
    _fresh_schedule();
  }
  //时间置0
  onlineTime = 0;
  viewAnswerTime = 0;
}

//开始背单词，公共方法
toWords.startTowords = function(callback, is_stateChanged){
  callback = callback?callback:$.noop;
  clearRequestLock();
  setNewStart();
  clearQueue();
  //更新列队
  getRequest(function(data){
    getWord();
    callback(data);
  }, is_stateChanged);
}
  
//设立背单词页面，公共方法
toWords.getStudyPageData = function(){
  setNewStart();
  //如果状态变化，返回状态变化
  if(stateChanged){
    return {'stateChanged':stateChanged};
  }
  if(wordQueue.length==0) return null;
  //定义全局目前正在背的单词
  try{
    currWord  = wordQueue[0];
    var word = wordQueue[0] , errword = errwords[0],_skillType = word.skillType,result = {};
    //_error_cn = [],_error_en=[];
    result = {'body':word['body'],'score':word['score'],'errwords':errword,'errortimes':word['errortimes'],'sound':word['sound'], CurrCorrect: isCurrCorrect, skillType:_skillType};
    //通知内容的生成
    result.hasShownClockOffPage = hasShownClockOffPage;
    result.stateChanged = stateChanged;
    result.isUnderLoad = isUnderLoad;
    result.state = state;
    //skillType:1-英到汉 2:声音到汉 3:汉到英
    switch (_skillType){
      case 1 : {
        result.subject = word['body'];
        result.answer = word['bodyZh'];
        break;
      }
      case 2 :{
        result.subject = "请听声音";
        result.answer = word['bodyZh'];
        break;
      }
      case 3 :{
        result.subject = word['bodyZh'];
        result.answer = word['body'];
        break;
      }
    }
    return result;
  }catch(e){
    //出现异常时重新载入并删除当前内容
    return;
  }
}

//设立单词答案页，公共方法
toWords.getResutPageData = function(){
  try{
    var word = wordQueue[0];
    //检测是否音标一致
    word['soundmark'] = word['soundmark']=='null' ? '暂无音标' : word['soundmark'];
    word['soundmark2'] = word['soundmark2']=='null' ? '暂无音标' : word['soundmark2'];
    return {
      'subject':word['body'],
      'bodyZh':word['bodyZh'],
      'sound':word['sound'],
      'score':word['score'],
      'usageEn':word['usageEn'],
      'usageZh':word['usageZh'],
      'soundmark':!isUS ? word['soundmark'] : word['soundmark2'],
      'soundmark2':word['soundmark2'],
      'regretTime':remainderRegratTimes
    }
  }catch(e){
    return;
  }
}

//清空队列
var clearQueue = function () {
  voice.clear();
  currErrWords=null;
  allWordQueue=[];
  allErrwords=[];
  wordQueue = [];
  errwords = [];
}