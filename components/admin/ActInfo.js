var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var $ = require('jquery');
var Qrcode = require('jquery-qrcode');

var global = require('../../core/factories/GlobalFactory.js');
var ToolFactory = require('../../core/factories/ToolFactory');

var weixin = require('../../core/factories/WeixinFactory.js'); 

var aid = ToolFactory.GetQueryString('aid');
var oid = ToolFactory.GetQueryString('oid');
var uid = ToolFactory.GetQueryString('uid');
var countdown = ToolFactory.GetQueryString('countdown');
//var type = ToolFactory.GetQueryString('type');

var ActInfoActions = Reflux.createActions([
    'init',
    'getActInfo',
    'applying',
    'joining',
    'detailin',
    'goScanCode',
]);

var ActInfoStore = Reflux.createStore({
    ss :null,
    listenables: [ActInfoActions],
    onInit: function(){
        weixin.setup();
    },
    onGetActInfo: function(){
        $.ajax({
            url: global.apiUrl + 'index.php',
            type: "GET",
            data: {
                r: 'activity/view',
                expand: 'activityDetail',
                id: aid,
                aid: aid,
                oid: oid,
                uid: uid
            }
        })
        .done(function(resp){
            console.log("请求到的单个活动信息",resp);
        })
        .fail(function(e){
            console.log("请求活动信息接口报错",e);
        })
    },
    onApplying: function(){
        window.location.href = 'actapplied.html?aid='+aid+'&uid='+uid+'&countdown='+countdown;
        return false;
    },
    onJoining: function(){
        window.location.href = 'actjoined.html?aid='+aid+'&uid='+uid;//+'&type='+type;
        return false;
    },
    onDetailin: function(){
        console.log("跳转到活动详情页面");
        window.location.href = '../activity/details.html?aid='+aid+'&oid='+oid+'&fcoach=1';
        return false;
    },
    goSubmitPage: function(data){
        if(data.isEnd==1||data.isEnd=="1"){
            alert("此次活动已完成，请提示用户点击再次报名以参与活动");
            return;
        }
        if(data.isPlayed==2||data.isPlayed=="2"){
            alert("此玩家已参加过,请重新报名再参加");
            return;
        }
        window.location.href = 'resultinput.html?paid='+data.paid+'&countdown='+data.countdown;
        return;
    },
    onGoScanCode: function(){
        var self = this;
        if (weixin.isReady()) {
            weixin.scanQrcode(function (code) {
                try {
                    var data = JSON.parse(code);
                    // alert('从二维码中获得的数据是：------- ' + code);
                    console.log('从二维码中获得的数据是: ------ ', code);
                    if (!data) {
                        alert('此二维码不可评审或格式有误1！');
                        return;
                    }
                    self.goSubmitPage(data);
                } catch(e) {
                    alert('此二维码不可评审或格式有误2！')
                    console.log(e);
                }
            })
        } else {
            if (global.debugging()) {
                alert('the debugging mode!');
                var data ='{"paid":"75","countdown":"1","isEnd":0,"isPlayed":1}'; //
                self.goSubmitPage(JSON.parse(data));
            } else {
                alert('亲, 按的太快了,等一下嘛~~~');
            }
        };
    }
});

export default class ActInfo extends React.Component{
    componentDidMount() {
        console.log("活动信息页加载完成");
        ActInfoActions.init();
        ActInfoActions.getActInfo();

        $("#actqrcode").qrcode({width:100,height:100,correctLevel:0,text:global.appUrl+"tgwx-app/views/activity/details.html?aid="+aid+"&oid="+oid});
    }

    render() {
        console.log("活动信息页数据",this.state.actinfodata);
        return (
            <div className="actDetailadmin"> 
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>活动详情</div>
                <div className="actdetailbox">
                    <div className="act-cbox">
                        <p className="act-ctext">专属活动二维码</p>
                        <p className="act-cimg" id="actqrcode"></p>
                    </div>
                    <div className="act-numul">
                        <div className="act-numli" onClick={this._enterApply}>
                            <span>已报名</span>
                            <img className="right" src="../../assets/img/right-arrow.png"/>
                        </div>
                        <div className="act-numli" onClick={this._enterJoined}>
                            <span>参与者</span>
                            <img className="right" src="../../assets/img/right-arrow.png"/>
                        </div>
                        <div className="act-numli" onClick={this._enterDetailin}>
                            <span>活动详情</span>
                            <img className="right" src="../../assets/img/right-arrow.png"/>
                        </div>
                    </div>
                    <div className="act-oper">
                        <div className="act-operli act-scan" onClick={this._goScanCode}>扫描二维码</div>
                    </div>
                </div>
            </div>
        )
    }
    _goScanCode() {
        ActInfoActions.goScanCode();
    }
    _enterApply() {
        ActInfoActions.applying();
    }
    _enterJoined() {
        ActInfoActions.joining();
    }
    _enterDetailin() {
        ActInfoActions.detailin();
    }
    _back() {
        window.history.back(-1);
    }

}

ReactMixin.onClass(ActInfo, Reflux.connect(ActInfoStore,'actinfodata'));