var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var $ = require('jquery');
var global = require('../../core/factories/GlobalFactory.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var weixin = require('../../core/factories/WeixinFactory.js');

//var gaugeMeter = require("./gaugeMeter.js");
//var radiallndicator = require("./radiallndicator.min.js"); 
var aid = ToolFactory.GetQueryString('aid');
var pid = ToolFactory.GetQueryString('pid');
var paid = ToolFactory.GetQueryString('paid');
var countdown = ToolFactory.GetQueryString('countdown')?ToolFactory.GetQueryString('countdown'):1;//活动倒计时
var actOid = ToolFactory.GetQueryString('actOid');//有 代表是机构活动 没有 是普通活动
var uid = ToolFactory.GetQueryString('uid');//辅导员id
if(!uid){
    //alert("没有uid-----去本地存储的数据");
    uid = window.localStorage.getItem("coachInfo")?JSON.parse(window.localStorage.getItem("coachInfo")).id:null 
    //alert(uid);
}

var ResultInputActions = Reflux.createActions([
    'init',
    'submitResult',
    'goRank',
    'openScan',
]);

var ResultInputStore = Reflux.createStore({
    resulttipstyle: 0,
    listenables: [ResultInputActions],
    onInit: function(){
        weixin.setup();
    },
    onSubmitResult: function(){
        var self = this;
        console.log("向后抬提交成绩");
        if(!$("#resinput").val()){
            $(".tipbox").addClass('tipshow');
            $(".tiptext").html("请填写玩家成绩");
            setTimeout(function(){
                $(".tipbox").removeClass('tipshow');
                //$(".tipbox").slideUp();
            },2000);
            return;
        }
        
        var ps = {
            r: "activity/static",
            expand: "setPlayerActivityRank",
            paid: paid,
            result: $("#resinput").val(),
        };
        if(!actOid){//是普通活动
            // alert("是普通活动");
            if(uid){
                //alert("能拿到uid");
                ps.player_user_id = uid;
            }else{
                //alert("拿不到uid");
            }
        }
        // alert("下面是uid");
        // alert(ps.player_user_id);
        console.log("提交成绩时的参数",ps);
        //return;
        $.ajax({
            url: global.apiUrl,
            type: "GET",
            dataType: 'json',
            data: ps
        })
        .done(function(resp){
            console.log("提交成绩返回数据",resp);
            
            if(resp.setPlayerActivityRank.success){
                console.log("提交成绩成功");
                alert("提交成绩成功");
                //提交成绩成功后的操作 1 继续提交(调用微信扫码页面) 2 查看排行
                
                self.resulttipstyle = 1;
                self.trigger({resulttipstyle: self.resulttipstyle});

            }else{
                console(resp.setPlayerActivityRank.errcode);
            }
            //window.location.href = 'resultrank.html';
            //return false;
        })
        .fail(function(e){
            console.log("提交成绩接口报错",e);
        })
        
    },
    onGoRank: function(){
        //alert("查看排行");
        //return;
        window.location.href = "resultrank.html?paid="+paid+"&uid="+uid;
        return;
    },
    onOpenScan: function(){
        //alert("继续提交");
        //return;
        console.log("调用微信扫码");
        if( weixin.isReady() ){
            weixin.scanQrcode(function(code){
                try {
                    var data = JSON.parse(code);
                    // alert('从二维码中获得的数据是：------- ' + code);
                    console.log('从二维码中获得的数据是: ------ ', code);
                    if (!data) {
                        alert('此二维码不可评审或格式有误1！');
                        return;
                    }
                    //打开提交成绩页面
                    window.location.href = 'resultinput.html?paid='+data.paid+'&countdown='+data.countdown;
                    return;
                } catch(e) {
                    alert('此二维码不可评审或格式有误2！')
                    console.log(e);
                }
            })
        }else{
            if(global.debugging()||global.testing()){//测试或调试环境
                alert("测试或调试环境无法调用打开微信扫码功能");
            }else{
                alert("亲，按的太快了，等一下嘛~~~~~");
            }
        }

    },
});
var inittime = parseFloat(countdown)*3600;
var oneminutes = parseFloat(countdown)*3600;
//alert(oneminutes);
var timeinterval;
var radialObj;//圆环变量
function setTimespan(time) {
    oneminutes = time;

}

export default class ResultInput extends React.Component{
    componentDidMount() {
        console.log("成绩录入页面加载完毕");
        ResultInputActions.init();

        var barColor = {
            0: '#51d6ff',
        };
        barColor[inittime] = '#7592fb';
        radialObj = radialIndicator($('#indicatorContainer'),{
            barColor: barColor,
            barWidth: 5,
            initValue: oneminutes,
            roundCorner : true,
            //percentage: true,
            minValue: 0,
            maxValue: oneminutes,
            radius: 75,
            format: function (value) {
                //var date = new Date();
                //console.log("执行");
                var time1 = Math.floor(oneminutes/3600)<10? "0"+Math.floor(oneminutes/3600) :  Math.floor(oneminutes/3600);
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
    }

    render() {
        if(this.state.resultinputdata&&this.state.resultinputdata.resulttipstyle==1){
            var tipstyle = {
                display: "block"
            }
        }else{
            var tipstyle = {
                display: "none"
            }
        }
        
        return (
            <div className="rsinputpage">
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>成绩录入</div>
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
                        <div className="timerbtn clear">

                                <div className="timeresetin" onClick={this._resetTime}>复位</div>
                            

                                <div className="timesandein" id="timesandein" onClick={this._soreTime} data-status="1">开始</div>
                            

                        </div>
                    </div>
                    <div className="timervoice">
                        <span>计时结束时提示音</span>
                        <div className="oron right" data-status="1" id="onoroff" onClick={this._switchVoiceBtn}>
                            <span className="onoroffin"></span>
                        </div>
                    </div>
                    
                    <div className="resinp-box">
                        <input className="resinput" id="resinput" type="text" placeholder="请填写成绩"/>
                    </div>
                    <div className="subresbtn" onClick={this._submitResult}>提交成绩</div>
                    <audio id="curvideo" style={{display:"none"}} src="../../assets/tipvoice.wav"></audio>    
                    <div className="tipbox">
                        <span className="tiptext">请填写数据</span>
                    </div>
                </div>

                <div className="mask" style={tipstyle} onClick={this._hidetipbox}></div>
                <div className="resulttipbox" style={tipstyle}>
                    <p className="tiptext">提交成绩成功</p>
                    <div className="tipbtn">
                        <span onClick={this._goRank}>查看排行</span>
                        <span onClick={this._openScan}>继续提交</span>
                    </div>
                </div>
            </div>
        )
    }
    
    _goRank() {
        // 提示音"http://ydown.smzy.com/yinpin/2014-1/smzy_2014012101.mp3"
        console.log("打开排行页面");
        ResultInputActions.goRank();
    }

    _openScan() {
        console.log("打开微信扫码页面");
        ResultInputActions.openScan();
    }

    _switchVoiceBtn(e) {
        console.log("切换有无提示音");
        console.log(e.target,e.currentTarget);
        if($(e.currentTarget).attr("data-status")=="1"){
            $(e.currentTarget).removeClass('oron');
            $(e.currentTarget).addClass('oroff');
            $(e.currentTarget).attr("data-status","0");
        }else{
            $(e.currentTarget).removeClass('oroff');
            $(e.currentTarget).addClass('oron');
            $(e.currentTarget).attr("data-status","1");
        }
    }

    _soreTime(e) {
        //alert("2");
        $("#curvideo")[0].play();      
        $("#curvideo")[0].pause();      
        var self = this;
        console.log("点击开始",e.target);
        if($(e.target).attr("data-status")=="1"){//点击的是开始
            $(e.target).html("暂停");
            $(e.target).addClass('stop');
            $(".timeresetin").addClass('setopen');
            $(e.target).attr("data-status","2");

            timeinterval = setInterval(function(){
                if(oneminutes>0){
                    oneminutes = oneminutes-2;
                    var du = 3600-oneminutes;
                    //console.log("du",Math.floor(du));
                    //radialObj.animate(du);//100 3600
                    radialObj.value(oneminutes);

                    //$("#time1").html( Math.floor(oneminutes/3600)<10? "0"+Math.floor(oneminutes/3600) :  Math.floor(oneminutes/3600) );
                    //$("#time2").html( Math.floor(oneminutes/60)<10? "0"+Math.floor(oneminutes/60) : Math.floor(oneminutes/60) );
                    //$("#time3").html( oneminutes%60<10? "0"+oneminutes%60 : oneminutes%60 );
                }else{
                    if($("#onoroff").attr("data-status")=="1"){
                        //alert("时间到");
                        $("#curvideo")[0].play();                        
                        
                    }
                    $("#timesandein").html("开始");
                    $("#timesandein").removeClass('stop');
                    $(".timeresetin").removeClass('setopen');
                    $("#timesandein").attr("data-status","1");
                    timeinterval&&clearInterval(timeinterval);
                    setTimespan(inittime);
                    radialObj.value(oneminutes);
                    
                }
                
            },100/3);

        }else{ //点击的是暂停
            $(e.target).html("开始");
            $(e.target).removeClass('stop');
            $(e.target).attr("data-status","1");
            //秒表倒计时
            console.log("开始计时"); 
            timeinterval&&clearInterval(timeinterval);
        }
    }

    _resetTime(e) {
        console.log("点击复位",e.target);
        timeinterval&&clearInterval(timeinterval);
        $("#timesandein").html("开始");
        $("#timesandein").removeClass('stop');
        $("#timesandein").attr("data-status","1");
        $(".timeresetin").removeClass('setopen');
        setTimespan(inittime);
        radialObj.value(oneminutes);
    }
    _submitResult() {
        ResultInputActions.submitResult();
    }
    _back() {
        window.history.back(-1);
    }
    

}

ReactMixin.onClass(ResultInput,Reflux.connect(ResultInputStore,'resultinputdata'));