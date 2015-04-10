(function (window, document, $, undefined){
  var W = $(window),D = $(document),_time,_animate,_show_shortcuts=true,_is_queue_ready = true,_time_out = 0,
  _timeoutCallback=$.noop,_is_time_stop = false,_time_width,_is_time_callback=false,tip_timeout,
  //build shortcuts for four options
  preventDefaultKeyAction = function(e){
    e.cancelBubble = true;
    e.returnValue = false;
    //e.stopPropagation works in Firefox.
    if (e.stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    return false;
  },
  bindShortcut = function(key, callback){
    var _array_has = function(A_array, val){
      var val = val.toLowerCase();
       for(var i = 0; i < A_array.length; i++){
          if(A_array[i] == val){
            return true;
         }
      }
      return false;
    }
    if(_array_has(["return","space","left", "up","right","down"], key)){
      $(document).bind("keydown", key, function(e){
        callback();
        //禁止键盘按下去时候的原操作
        return preventDefaultKeyAction(e);
      })
    }else{
      //允许用户在中文输入法的时候使用
      $(document).unbind('keydown',key).bind("keyup", key, callback);
    }
  },
  //倒计时方法
  time_grower = function(callback){
    _animate = self.setInterval(function(){
      _time_out++;
      _time_width += 640/(countDownTime*25-1);
      $("#timer > div").width(_time_width+'px');
      if(_time_width < 160) {
        $("#timer > div").addClass('palette-info');
      } else if (_time_width < 320) {
        $("#timer > div").removeClass();
        $("#timer > div").addClass('palette-success');
      } else if (_time_width < 480) {
        $("#timer > div").removeClass();
        $("#timer > div").addClass('palette-warning');
      } else {
        $("#timer > div").removeClass();
        $("#timer > div").addClass('palette-danger');
      }
      if(_time_width >= 640&&!_is_time_callback){
        callback();
        _is_time_callback = true;
      }
    },40)
  },
  //开始计时
  timer = function(callback){
    //保证callback只能被执行一次
    _is_time_callback = false;
    _time_width = 0;
    _time_out = 0;
    _timeoutCallback = callback;
    time_grower(_timeoutCallback);
    //_time = setTimeout(callback,countDownTime*1000);
  },
  //停止计时
  stopTime = function(){
    _is_time_stop = true;
    //clearTimeout(_time);
    clearInterval(_animate);
  },
  //继续计时
  continueTime = function(){
    if(_is_time_stop){
      if(_time_width<640){
        time_grower(_timeoutCallback);
      }
      //_time = setTimeout(_timeoutCallback,(countDownTime-_time_out/25)*1000);
      _is_time_stop = false;
    }
  },
  //清空计时
  clearTimer = function(){
    stopTime();
    _time_out = 0;
    _time_width = 0;
    _timeoutCallback=$.noop
  },
  wordProgress = function(data){
    try {
      data = data*1;
    } catch(e) {
      data = 0;
    }
    return data<=10?data:10;
  },
  setPagePublic = function($TWLearning, data){
    var _play_voice = function(){
      voice.play();
    }
    if(((data['skillType']!=3)&&soundSetting*1)||data['skillType']==2){
      voice.disabled = false;
      //打开之后自动发音
      _play_voice();
      //添加发声快捷键
      bindShortcut( 'V',_play_voice);
      bindShortcut( 'M',_play_voice);
    }else{
      //发音按钮不可用
      voice.disabled = true;
      $TWLearning.find("#toVoice").addClass('disabled');
    }
    //点击esc关闭
    bindShortcut("esc",function(){
      $('#toWords').modal('hide');
    })
    bindShortcut("return",function(){
      $('#toWords').modal('hide');
    })
  }
  getMsgHtml  = function(data){
    return data['message'] && answerFeedback  ?  '<span class="learningResult palette-' + data['message'].status + '">' + data['message'].text + '</span>' : '';
  }
  pageClear = function(){
    if($("#towordsLearning").html()){
      $("#towordsLearning").remove();
    }
    $(document).unbind('keydown');
    $(document).unbind('keyup');
    _is_queue_ready = true;
  };
  var _setResultPage = function(target,data,callback){
    clearTimer();
    var callback = callback ? callback : {},
      _onContinue = function(){
        var _fuc = callback['onContinue'] ? callback['onContinue'] : $.noop;
        if(_is_queue_ready){
          _fuc();
        }
      },
      _onKnown = function(){
        var _fuc = callback['onKnown'] ? callback['onKnown'] : $.noop;
        if(_is_queue_ready){
          _fuc();
        }
      },
      //生成提示信息
      _msg_html = getMsgHtml(data),   
      _word_html = '<div class="word"><p>'+data['subject']+'</p><span class="phonetic">['+data['soundmark']+']</span>'
                    + '<span>已掌握 ' + wordProgress(data['score']) + '/10</span></div>',
      _buttons_html = '<div class="buttons">'
                      + '<div class="btn" id="space"><i class="fa fa-arrow-circle-o-right"></i><span>继续背(空格键)</span></div>'
                      + '<div class="btn" id="ru"><i class="fa fa-undo"></i><span>反悔(R/U键)</span></div>'
                      + '<div class="btn" id="toVoice"><i class="fa fa-volume-down"></i><span>发音(V键)</span></div>'
                      + '</div>',
      _result_html = '<div class="result"><p class="translate">'+data['bodyZh']+'</p>' 
                      + '<div class="example"><p class="sentense">'+data['usageEn']+'</p><p class="exp-translate">'+data['usageZh']+'</p></div></div>'
      _html = '<div id="towordsLearning"><div class="title">' + _word_html + _buttons_html + '</div>'
              + _result_html + _msg_html + '</div>';
    pageClear();
    target.html(_html);

    setTimeout('$("#towordsLearning").addClass("animate");', 10);
    var $TWLearning = $("#towordsLearning"),
    _thisWord = $TWLearning.find(".word p");

    if(_thisWord.text().length < 14){
      _thisWord.css('font-size', '54px');
    }else if(_thisWord.text().length >= 14){
      _thisWord.css('font-size','40px');
    }
    setPagePublic($TWLearning, data);
    //判断反悔次数
    var _leftRegretTime = (data['regretTime']*1==NaN) ? 0 : data['regretTime']*1;
    if(_leftRegretTime<1){
      $("#ru").remove();
    }else{
      $TWLearning.find("#ru").click(function(){_onKnown();});
      $("#ru").append("<i class=\"regret_time\">" + _leftRegretTime + "</i>");
      bindShortcut( 'R',_onKnown);
      bindShortcut( 'U',_onKnown);
    }

    $TWLearning.find("#space").click(function(){_onContinue();});
    $TWLearning.find(".result").click(function(){_onContinue();});
    //开始绑定至键盘操作
    bindShortcut( 'space',_onContinue);
  },
  _setStudyPage = function(target, data, callback, _is_iknow){
    clearTimer();
    var callback = callback ? callback : {},
      _onRight = function(){
        var _fuc = callback['onRight'] ? callback['onRight'] : $.noop;
        if(_is_queue_ready){
          _fuc();
        }
      },
      _onError = function(){
        var _fuc = callback['onError'] ? callback['onError'] : $.noop;
        if(_is_queue_ready){
          _fuc();
        }
      },
      _onTimeout = callback['onTimeout'] ? callback['onTimeout'] : $.noop,
      _onPass = function(){
        var _fuc = callback['onPass'] ? callback['onPass'] : $.noop;
        if(_is_queue_ready){
          _fuc();
        }
      },
      _onUnknow = function(){
        var _fuc = callback['onUnknow'] ? callback['onUnknow'] : $.noop;
        if(_is_queue_ready){
          _fuc();
        }
      },
      _onIKnow = function(){
        var _fuc = callback['onIKnow'] ? callback['onIKnow'] : $.noop;
        if(_is_queue_ready){
          _fuc();
        }
      },
      right = Math.floor(Math.random()*4),
      //只有符合iknow同时当前单词为正确的时候才会出现
      _is_iknow = data['CurrCorrect']&&_is_iknow,
      _j = 0,
      _k = window.keyCodes,//用户自己选择的快捷键
      //数组打乱方法
      shuffle = function(v){
          for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
          return v;
      },
      _msg_html = getMsgHtml(data),
      //如果开启了我记得，显示英文
      _word_html = '<div class="word"><p>'+data['subject']+'</p><span>已掌握 ' + wordProgress(data['score']) + '/10</span></div>',
      _buttons_html;

      var _options_html = '';
      //如果开启我记得，需要修改按钮
      if(_is_iknow){
        _buttons_html = '<div class="buttons">\
        <div class="btn" id="space"><i class="fa fa-times"></i><span>不知(空格键)</span></div>\
        <div class="btn" id="ty"><i class="fa fa-check"></i><span>知(T/Y键)</span></div>\
        <div class="btn" id="toVoice"><i class="fa fa-volume-down"></i><span>发音(V键)</span></div>\
        </div>';
        _options_html = '<div class="options">\
        <p class="iknow"id="iknowline">*朝夕相见几多会</p>\
        <p class="iknow">*隐去选项，可相知？</p></div>';
      }else{
        _buttons_html = '<div class="buttons">\
        <div class="btn" id="space"><i class="fa fa-book"></i><span>求解释(空格键)</span></div>\
        <div class="btn" id="gh"><i class="fa fa-trash"></i><span>太简单(G/H键)</span></div>\
        <div class="btn" id="toVoice"><i class="fa fa-volume-down"></i><span>发音(V键)</span></div>\
        </div>';
        data['errwords'] = shuffle(data['errwords']);
        for(var _i=0;_i<4;_i++){
          if(_i!==right){
            _options_html+='<div id ="'+_i+'"><span class="Shortcuts s-'+_k[_i]+'"></span><span>'+data['errwords'][_j]+'</span></div>';
            _j+=1;
          }else{
            _options_html+='<div id ="'+_i+'"><span class="Shortcuts s-'+_k[_i]+'"></span><span>'+data['answer']+'</span></div>';
          }
        }
        _options_html = '<div class="options">'+_options_html+'</div>';
      }
    var _html = '<div id="towordsLearning"><div class="title">' + _word_html + _buttons_html + '</div>'
        + _options_html + _msg_html 
        + '<div id="timer"><div></div></div>' 
        + '</div>';

    //清除并生成新页面
    pageClear();
    target.html(_html);
    var $TWLearning = $("#towordsLearning");
    //控制大小
    setTimeout('$("#towordsLearning").addClass("animate");', 10);
    _thisWord = $TWLearning.find(".word p");
    _font1_s = {1:14,3:6,2:10},_font2_s = {1:24,3:12,2:20};
    if(_thisWord.text().length > _font1_s[data.skillType]){
      _thisWord.css('font-size', '40px');
    }else if(_thisWord.text().length > _font2_s[data.skillType]){
      _thisWord.css('font-size','32px');
    }
    
    setPagePublic($TWLearning, data,_is_iknow);
    timer(function(){
      _onTimeout();
    })

    if(_is_iknow){
      //点击i_know_it按钮或者快捷键为我记得
      $TWLearning.find("#ty").click(_onIKnow)
      bindShortcut('T',_onIKnow);
      bindShortcut('Y',_onIKnow);
    }else{
      $(document).off('click', "#toWords .options > div");
      $(document).on('click', "#toWords .options > div", function (e) {
        if($(this).attr("id")*1===right){
          _onRight();
        }else{
          _onError();
        }
      });
      //根据错误次数决定
      if(data['errortimes']*1>3||data['score']*1>7||data['state']>2){
        $("#gh").remove();
      }else{
        $TWLearning.find("#gh").click(_onPass);
        bindShortcut( 'G',_onPass);
        bindShortcut( 'H',_onPass);
      }
      for(var _i in _k){
        if(_i*1===right){
          bindShortcut(_k[_i],_onRight);
        }else{
          bindShortcut(_k[_i],_onError);
        }
      }
    }
    //点击左侧按钮或者空格为不知道
    $TWLearning.find("#space").click(function(){_onUnknow();})
    bindShortcut('space',_onUnknow);
  },_setProgressPage = function(target,data,callback){
    clearTimer();
    var callback = callback?callback:{},changeDateCallback = callback.changeDateCallback?callback.changeDateCallback:$.noop,
    sendStartCallback =callback.sendStartCallback?callback.sendStartCallback: $.noop;
    sendStartCallback();
  },_setClockOffPage = function(target,data,callback){
    pageClear();
    var callback = callback?callback:{},
    changeSendCallback = callback.changeSendCallback?callback.changeSendCallback:$.noop,
    sendClockOffCallback =callback.sendClockOffCallback?callback.sendClockOffCallback: $.noop,
    backCallback =callback.backCallback?callback.backCallback: $.noop,
    goTowordsCallback = callback.goTowordsCallback?callback.goTowordsCallback: $.noop;
    target.html('<div id="towordsLearning"><div class="clock_off_title">恭喜你完成今天的学习任务,<br/>  赶快与好友共享吧！</div> <div class="clock_block"><textarea id="clock_content">'+data.slogan+'</textarea><ul></ul></div><button id="clockoff">打卡</button><button id="go_on_towords">继续拓</button></div>')
    var _renren = '<li id="RR_CLOCKOFF_FEED"><span>人人状态</span></li>',
    _weibo = '<li id="WB_CLOCKOFF_FEED"><span>新浪微博</span></li>',
    _qqzone = '<li id="QZ_CLOCKOFF_FEED"><span>qq空间</span></li>',
    _qqweibo = '<li id="QQ_CLOCKOFF_FEED"><span>腾讯微博</span></li>',
    _share_cofig = [{"bind":data.bind_renren,"checked":data.rrSendClockOffFeed,"able":true,"checkbox":_renren},
    {"bind":data.bind_weibo,"checked":data.weiboSendClockOffFeed,"able":data.weiboTokenIsValid,"checkbox":_weibo},
    {"bind":data.bind_qq,"checked":data.qqSpaceSendClockOffFeed,"able":data.qqTokenIsValid,"checkbox":_qqzone},
    {"bind":data.bind_qq&&data.qqUserHasTXWeibo,"checked":data.qqSendClockOffFeed,"able":data.qqTokenIsValid,"checkbox":_qqweibo},
    ],$clock_block = $(".clock_block>ul"),j=0;
    for(var _i in _share_cofig){
      var _share = _share_cofig[_i];
      if(_share['bind']){
        $clock_block.append(_share['checkbox']);
        var $thisBox = $clock_block.find("li").last();
        if(!_share['able']){
          $thisBox.remove();
        }else if(!_share['checked']){
          j++;
          $thisBox.find("span").attr("class","disable");
        }else{
          j++;
        }
      }
    }
    //没有可用打卡帐号
    if(j==0){
      $(".clock_block").remove();
      $(".clock_off_title").html("恭喜你完成今天的学习任务,</br>明天要继续努力啊！");
      $("#clockoff").html("回主页").click(backCallback);
    }else{
      $(".clock_block>ul> li").each(function(){
        $(this).click(function(){
          var $span = $(this).find("span");
          $span.attr("class",$span.attr("class")=='disable'?"":"disable");
          changeSendCallback($(this).attr("id"),$span.attr("class")!="disable"?1:0);
        })
      })
      //打卡
      $("#clockoff").click(function(){
        _list = [];
        $(".clock_block>ul> li").each(function(){
          var $span = $(this).find("span");
          if($span.attr("class")!='disable'){
            _list.push($(this).attr("id"));
          }
        })
        sendClockOffCallback(_list,$("#clock_content").val());
      })
    }
    $("#go_on_towords").click(goTowordsCallback);
  },_setClockFinshPage = function(target,callback){
    pageClear();
    var callback = callback?callback:{},
    backCallback =callback.backCallback?callback.backCallback: $.noop,
    goTowordsCallback = callback.goTowordsCallback?callback.goTowordsCallback: $.noop;
    target.html('<div id="towordsLearning"> <div class="colcksuccess"><p id="colcksuccess">分享成功！</p></div><button id="clockoff">关闭窗口</button><button id="go_on_towords">继续拓</button></div>')
    $("#clockoff").click(backCallback);
    $("#go_on_towords").click(goTowordsCallback);
  };

  $.fn.extend({
    'setStudyPage':function(data,callback,_is_iknow){
      _setStudyPage($(this),data,callback,_is_iknow)
    },'setResultPage':function(data,callback){
      _setResultPage($(this),data,callback)
    },'setProgressPage':function(data,callback){
      _setProgressPage($(this),data,callback)
    },'setClockOffPage':function(data,callback){
      _setClockOffPage($(this),data,callback)
    },'setClockFinshPage':function(callback){
      _setClockFinshPage($(this),callback)
    }
  });

  $(document).on('click', '#toWords .word p', function () {
    if(!voice.disabled)
      voice.play();
  });
  $(document).on('click', '#toVoice', function () {
    if(!voice.disabled)
      voice.play();
  });

  //关掉窗口后强行关掉计时
  window.clearViewTimeout = function(){
    clearTimer();
  }
  window.clearViewPage = function(){
    clearViewTimeout();
    pageClear();
  }
  //载入的时候阻止用户点击
  window.setQueueReady = function(){
    _is_queue_ready = true;
    continueTime();
  }
  window.setQueueLoad = function(){
    _is_queue_ready = false;
    stopTime();
  }
}(window,document,jQuery))