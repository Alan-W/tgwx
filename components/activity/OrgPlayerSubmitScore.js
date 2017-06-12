var React = require('react');
var Reflux = require('reflux');
var $ = require('jquery');
var weixin = require('../../core/factories/WeixinFactory.js');
var global = require('../../core/factories/GlobalFactory.js');
var ToolFactory = require('../../core/factories/ToolFactory');

var aid = ToolFactory.GetQueryString('aid');
var pid = ToolFactory.GetQueryString('pid');
var type = ToolFactory.GetQueryString('type');
var paid = ToolFactory.GetQueryString('paid');
var countdown = ToolFactory.GetQueryString('countdown')?ToolFactory.GetQueryString('countdown'):1;//活动倒计时
var oid = ToolFactory.GetQueryString('oid');//有 代表是机构活动 没有 是普通活动

var OrgPlayerSubmitScoreActions = Reflux.createActions([
    'submitResult',
]);


var OrgPlayerSubmitScoreStore = Reflux.createStore({

    listenables: [OrgPlayerSubmitScoreActions],

    // check can submit
    checkPlayerCanSubmit: function (result) {
        var that = this;
        $.ajax({
            url: global.apiUrl,
            type: 'GET',
            data: {
                r: 'activity/static',
                expand: 'getPlayerIsplayed',
                aid: aid,
                player_id: (global.player && global.player.id)
            },
        })
        .done(function(resp) {
             console.log("checkPlayerCanSubmit ---success: resp is : - ", resp);
            // success 返回false 代表今天还未参加活动,可以提交成绩
            if (resp && resp.getPlayerIsplayed && !resp.getPlayerIsplayed.success) {
                that.submitResult(result);
            } else {
               $('#notSubmit').css('display', 'block');
               setTimeout(function () {
                    $('#notSubmit').css('display', 'none');
               }, 2000);
            }
           
        })
        .fail(function(error) {
            console.log("checkPlayerCanSubmit ---error : ", error);
        })
    },
   
    submitResult: function(result){
        console.log("向后抬提交成绩");      
        //return;
        $.ajax({
            url: global.apiUrl,
            type: "GET",
            data: {
                r: "activity/static",
                expand: "setPlayerActivityRank",
                paid: paid,
                result: $("#resinput").val(),
            }
        })
        .done(function(resp){
            console.log("提交成绩返回数据",resp);
            
            if(resp.setPlayerActivityRank.success){
                console.log("提交成绩成功");
                $('#submitSuccess').css('display', 'block');
                setTimeout(function() {
                    // 跳转到我的排行页面
                    var baseUrl = ToolFactory.changeUrlPath('player/');
                    baseUrl += 'myranklist.html';
                    baseUrl += '?paid='+paid;
                    baseUrl += '&aid='+ aid;
                    baseUrl += '&pid='+ (global.player.id);
                    baseUrl += '&oid='+ oid;
                    baseUrl += '&type='+ type;
                    baseUrl += '&from=isSubmit';
                    window.location.href = ToolFactory.checkUrlPath(baseUrl);
                }, 1500);

            } else{
                console.log(resp.setPlayerActivityRank.errcode);
                alert('提交成绩失败!');
            }
           
        })
        .fail(function(e){
            console.log("提交成绩接口报错",e);
        })
        
    }
});

var inittime = parseFloat(countdown)*3600;
var oneminutes = parseFloat(countdown)*3600;
var timeinterval;
var radialObj;//圆环变量
function setTimespan(time) {
    oneminutes = time;

}

var OrgPlayerSubmitScore = React.createClass ({
    getInitialState () {
        return {
            resultError: false,
            errorTxt: '',
            isStart: false, // 是否点击了开始
            disabled: false, // 是否点击了提交成绩的按钮
            timerState: 0, // 计时器的状态,默认开始是0
            startTimerTxt: '开始', // 计时器操作按钮的文字
            isOpenVoice: true, // 是否打开了声音提示
        }
    },

    componentDidMount() {
        console.log("成绩录入页面加载完毕");
        var circlrColorParam = {
            0: '#51d6ff',
        };

        circlrColorParam[oneminutes] = '#7592fb';

        radialObj = radialIndicator($('#indicatorContainer'),{
            barColor: circlrColorParam,
            barWidth: 5,
            initValue: oneminutes,
            roundCorner : true,
            minValue: 0,
            maxValue: oneminutes,
            radius: 85,
            fontColor: '#000',
            format: function (value) {
                var time1 = Math.floor(oneminutes/3600)<10? "0"+Math.floor(oneminutes/3600) : Math.floor(oneminutes/3600);
                var time2 = Math.floor((oneminutes%3600)/60)<10? "0"+Math.floor((oneminutes%3600)/60) : Math.floor((oneminutes%3600)/60);
                var time3 = oneminutes%60<10? "0"+oneminutes%60 : oneminutes%60;
                if(time1%60==0){
                    time1 = "00";
                }
                if(time2%60==0){
                    time2 = "00";
                }
                if(time3%60==0){
                    time3 = "00";
                }
                return time1 + ':' + time2 + ':' + time3;
            }
        });

        var h=$(window).height();
        $(window).resize(function() {
            if($(window).height()<h){
                $('.base-btn').hide();
            }
            if($(window).height()>=h){
                $('.base-btn').show();
            }
        });
        
        $('#curaudio')[0].load();

        // $('#curaudio')[0].addEventListener('canplay', function() {
        //     $('#curaudio')[0].play();
        //     $('#curaudio')[0].pause();
        // }, false);

        weixin.setup(function(){
            $('#curaudio')[0].load();
            $('#curaudio')[0].play();
            $('#curaudio')[0].pause();
        });
    },

    render() {
        var errorTipStyle = this.state.resultError ? 'tip-warn data-warn active-tip-warn' : 'tip-warn data-warn';
        var startTimerBtnStyle = this.state.timerState == 1 ? 'timesande isstart' : 'timesande';
        var resetTimerStyle = this.state.timerState == 1 ? 'timeresetin setopen' : 'timeresetin';
        var voiceSwitchStyle = this.state.isOpenVoice ? 'oron right' : 'oroff right';

        return (
            <div className="rsinputpage">
                <div className="head-bar has-arrow has-border">
                    <span className="prev-arrow"  onClick={this._back}>
                        <span className="back"></span>
                    </span>
                    <span className="page-title">成绩录入</span>
                </div>
                <div className={errorTipStyle}>
                    <i className="bar-icon"></i>
                    <span className="warn-txt">{this.state.errorTxt}</span>
                </div>
                <div className="rsinputbox">
                    <div className="timeerbox">
                        <div className="timehuanbg">
                            <div className="timehuan" id="indicatorContainer"></div>
                        </div>
                        <div className="timertext">
                            <span id="time1">01</span>:
                            <span id="time2">00</span>:
                            <span id="time3">00</span>
                        </div>
                        <div className="timerbtn clearfix">
                            <div className="timereset">
                                <div className={resetTimerStyle} onClick={this._resetTime}>复位</div>
                            </div>
                            <div className={startTimerBtnStyle}>
                           
                                <div className="timesandein" id="timesandein" onClick={this._startTime} >{this.state.startTimerTxt}</div>
                            </div>
                        </div>
                    </div>
                    <div className="timervoice">
                        <span>计时结束时提示音</span>
                        <div className={voiceSwitchStyle} data-status="1" id="onoroff" onClick={this._switchVoiceBtn}>
                            <span className="onoroffin"></span>
                        </div>
                    </div>
                    <div className="tip-toast" id="timeOver">
                        <img className="tip_icon_toast" src="../../assets/img/clock.png" />
                        <p className="tip-toast-content" id="submitState">时间到</p>
                    </div>
                    <div className="resinp-box">
                        <input className="resinput" id="resinput" type="number" placeholder="请填写成绩"/>
                    </div>
                    <div className="base-btn" onClick={this._submitResult}>提交成绩</div>
                    <audio id="curaudio" hidden="true" src="../../assets/tipvoice.wav" preload="metadata"></audio>    
                    <div className="tip-toast" id="submitSuccess">
                        <img className="tip_icon_toast" src="../../assets/img/ok.png" />
                        <p className="tip-toast-content" id="submitState">提交成功</p>
                    </div>
                     <div className="no-check-tip" id="notSubmit">
                        <p className="tip-toast-content">抱歉,您今天已提交过成绩!</p>
                    </div>
                </div>
            </div>
        )
    },

    /* // / 切换*/
    _switchVoiceBtn(e) {
        var oldState = this.state.isOpenVoice;
        this.setState({
            isOpenVoice: (!oldState),
        });
    },

    // 开始i计时
    _startTime(e) {
       
        var self = this;
        if (this.state.timerState == 0) { // 点击的是开始
            this.setState({
                timerState: 1, // 当前开始计时
                startTimerTxt: '暂停',
            });

            timeinterval = setInterval(function(){
                if (oneminutes > 0) { // 时间没到

                    oneminutes = oneminutes-2;
                    var du = 3600-oneminutes;                 
                    radialObj.value(oneminutes);

                } else{ // 时间到了

                    if(self.state.isOpenVoice){
                        // weixin.setup(function(){
                            $("#curaudio")[0].play(); 
                        // });

                        // $("#curaudio")[0].play();                        
                        $('#timeOver').css('display', 'block');
                        setTimeout(function() {
                            $('#timeOver').css('display', 'none');
                        }, 2000);
                    }
                    self.setState({
                        timerState: 0, // 当前开始计时
                        startTimerTxt: '开始',
                    });
                   
                    setTimespan(3600);
                    timeinterval&&clearInterval(timeinterval);
                }
                
            },100/3);

        } else { // 点击的是暂停
             this.setState({
                timerState: 0, // 当前暂停计时
                startTimerTxt: '开始',
            });

            timeinterval&&clearInterval(timeinterval);
        }
    },

    /* */
    _resetTime(e) {
        timeinterval&&clearInterval(timeinterval);
        this.setState({
            timerState: 0, 
            startTimerTxt: '开始',
        });
        setTimespan(inittime);
        radialObj.value(oneminutes);
    },

    _submitResult() {

        if (this.state.disabled) return false;

        var that = this;
        var result = $("#resinput").val();
        if (!result || result.length == 0) {
            this.setState({
                resultError: true,
                errorTxt: '请输入合法的成绩',
            });
            setTimeout(function(){
                that.setState({
                    resultError: false,
                    errorTxt: '',
                });
            },2000);
            return;
        };

        if (result > 1000) {
            alert('您输入的成绩不合理, 请确认后重新输入!');
            return;
        }

        this.setState({
            disabled: true, 
        });

        // 点击提交成绩的时候就清除计时器
        clearInterval(timeinterval);
       
        OrgPlayerSubmitScoreStore.checkPlayerCanSubmit(result);
    },

    _back() {
        window.history.back(-1);
    },
    

});

module.exports = OrgPlayerSubmitScore;