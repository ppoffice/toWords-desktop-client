(function (window, document, $, undefined){
  var W = $(window),D = $(document);
  window.voice = {
    audioList: new Array,
    disabled: false,
    preload: function (list) {
      list.forEach(function (url) {
        voice.preloadOne(url);
      });
    },
    preloadOne: function (url) {
      var audio = document.createElement('AUDIO');
      audio.setAttribute('src', url);
      audio.setAttribute('preload', 'preload');
      voice.audioList.push(audio);
    },
    play: function () {
      voice.audioList[0].play();
    },
    playWord: function (url) {
      var audio = document.createElement('AUDIO');
      audio.setAttribute('src', url);
      audio.play();
    },
    delete: function () {
      voice.audioList.shift();
    },
    clear: function () {
      voice.audioList = new Array;
    }
  }
  D.ready(function(){
    var _isReady = false, _isProgressReady=false, _isLoad=false, _isNew = false;

    // 加载遮罩
    var toLoad = function () {
      $('#toWords .preloader').addClass('on');
    }
    // 隐藏遮罩
    var toReady = function () {
      $('#toWords .preloader').removeClass('on');
    }
    //生成进度页面
    progressPage = function(){
      //如果没有载入，则显示载入
      _isProgressReady = false;
      if(!_isLoad){
        _isLoad = true;
        toLoad();
      }
      var data = window.startToWordsData;
      _isProgressReady = true;
      if(_isLoad&&_isReady&&_isProgressReady){
        _isLoad = false;
        toReady();
      }
      $("#study_inline").setProgressPage(data,{
        sendStartCallback:function(){
          if(data.stateChanged){
            toLoad();
            toWords.ConfirmStateChange();
            toWords.startTowords(function(data){
              if(data=="ready"){
                toReady();
                studyPage();
              }
            },true);
          }else{
            studyPage();
          }
        }
      })
    },
    //生成答题页面      
    studyPage = function(message, is_not_iknow){
      var data = toWords.getStudyPageData();
      lastWordType = data.skillType;
      var _sleep = function sleep(d){
        for(var t = new Date();new Date() - t <= d;);
      }
      var _play_voice = function(){
        voice.play();
      }
      //返回数据为空时无操作
      if(!data)return;
      //如果状态变更，生成签到页面
      if(data.stateChanged){
        progressPage();
        return;
      };
      var _is_ikonw = false;
      //如果分数存在且小于7，同时错误为0，显示我记得页面
      if(window.lab_1 && data.score!=null && data.score>5 && !is_not_iknow){
        //显示我记得页面
        _is_ikonw = true;
      }
      //如果完成当天任务，询问是否去打卡
      if(!data.hasShownClockOffPage){
        toWords.ConfirmShownClockOff();
        clockOffPage();
        return;
      }
      data['message']= message ? message : {};
      data['message']= isUnderLoad ? {text:"下一词在路上。", status:"info"} : message;
      var _map = function(id, url){
        if(data.skillType==3){
          //写技能发声
          _play_voice();
          //当前方法暂停0.5秒
          _sleep(1000);
        }
        //voice.deleteDom(url);
        toWords.saveCurrWord(id, function(_i,word){
          voice.delete();
          var msg = {};
          msg.status = 'success';
          if(_i==1){msg.text = "恭喜！你刚刚搞定了单词[" + word + "]。"}
          if(_i==2){msg.text = "拓词判定[" + word + "]你本来就认识，以后不再出现。"}
          if(_i==3){msg.text = "抱歉，下一词还在路上，再试一次。"}
          if(_i==4){msg.text = "[" + word + "]作答正确！请继续。"}
          if(_i==5){msg.text = "[" + word + "]你已经掌握，您正在复习所有已经掌握的单词。"}
          if(_i==6){msg.text = "[" + word + "]直接判定为熟词，不再出现。"}
          studyPage(msg);
        })
      }
      $("#study_inline").setStudyPage(data, {
        onError:function(){
          toWords.saveCurrWord(0);
          var _msg = {
            status: 'warning',
            text: "不会的，迅速看一遍，继续，系统会自动安排复习，盯着傻看毫无用处！"
          };
          resultPage(_msg);
        },
        onRight:function(){
          _map(1,data.sound);
        },
        onTimeout:function(){
          toWords.saveCurrWord(0);
          var _msg = {
            status: 'danger',
            text: "走神了吧？拓词得专注。"
          };
          resultPage(_msg);
        },
        onPass:function(){
          _map(2, data.sound);
        },
        onIKnow:function(){
          var _msg = {
            status: 'info',
            text: "既知，速择之！"
          };
          studyPage(_msg, true);
        },
        onUnknow:function(){
          toWords.saveCurrWord(-1);
          var _msg = {
            status: 'warning',
            text: "不会的，迅速看一遍，继续，系统会自动安排复习，盯着傻看毫无用处！"
          };
          resultPage(_msg);
        }
      }, _is_ikonw);
    },
    //生成答案页面
    resultPage = function(a){
      var data = toWords.getResutPageData();
      if(!data){
        return;
      }
      data['message']=a ? a : "";
      $("#study_inline").setResultPage(data, {
        onContinue:function(){
          toWords.goOn();
          studyPage();
        },
        onKnown:function(){
          toWords.goOn(true);
          studyPage();
        }
      });
    };

    //开始拓词
    $(document).on('click', '#start', function () {
      ui.showToWordsDialog();
    });
    $(document).on('shown.bs.modal', '#toWords', function (e) {
      setQueueLoad();
      progressPage();
    });
    $(document).on('hidden.bs.modal', '#toWords', function (e) {
      //关闭窗口时需提交单词同时清空计时
      clearViewPage();
      setQueueReady();
      toWords.saveWordsOnClose();
      ui.wordlist = '';
      ui.books = '';
    });
  });
}(window,document,jQuery))