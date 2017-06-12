var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var myDropLoad = require('../../core/components/Dropload.js');
var $ = require('jquery');

var global = require('../../../core/factories/GlobalFactory.js');
var ToolFactory = require('../../core/factories/ToolFactory');

var aid = ToolFactory.GetQueryString('aid');
var uid = ToolFactory.GetQueryString('uid');
var countdown = ToolFactory.GetQueryString('countdown');

var ActApplyActions = Reflux.createActions([
    'getActApplydata',
    "changeTelbox",
    "goSubmitPage",
]);

var ActApplyStore = Reflux.createStore({
    actapplyer:[],
    telboxstyle: 0,
    tel: null,
    listenables: [ActApplyActions],
    onGetActApplydata: function(){
        console.log("请求已报名的人数");
        var self = this;
        if(document.getElementById("actapplyul")){
            $("#actapplyul").dropload({
                scrollArea: window,
                loadDownFn: function(me){
                    console.log("触发上拉");
                    var offset = self.actapplyer.length;
                    $.ajax({
                        url: global.apiUrl + 'index.php',
                        type: "GET",
                        data: {
                            r: "activity/static",
                            expand: 'getActivitySignUps',
                            aid: aid,
                            offset: offset,
                            limit: 10
                        }
                    })
                    .done(function(resp){
                        console.log("请求到的已报名的列表",resp);
                        if(resp&&resp.getActivitySignUps&&resp.getActivitySignUps.success){
                            console.log("请求已报名的列表成功",resp.getActivitySignUps.data);
                            self.actapplyer = resp.getActivitySignUps.data;
                            self.trigger({actapplyer: self.actapplyer,telboxstyle: self.telboxstyle,tel: this.tel});
                            if(resp.getActivitySignUps.data&&resp.getActivitySignUps.data.length==10){
                                me.resetload();
                            }else{
                                me.lock();
                                if(offset==0&&resp.getActivitySignUps.data.length==0){
                                    me.noData("没有数据");
                                }else{
                                    me.noData(true);
                                }
                                me.resetload();
                            }
                        }else{
                            me.noData(true);
                            me.resetload();
                        }
                    })
                    .fail(function(e){
                        me.resetload();
                        console.log("请求已报名的列表出错",e);
                    })
                }
            })
        }
        
    },
    onChangeTelbox: function(num,tel){
        this.telboxstyle = num;
        if(tel){
            this.tel = tel;
        }
        this.trigger({actapplyer: this.actapplyer,telboxstyle: this.telboxstyle,tel: this.tel});
    },
    onGoSubmitPage: function(obj){
        console.log("跳转提交成绩页之前拿到的数据",obj);
        window.location.href = "resultinput.html?aid="+aid+"&uid="+uid+"&paid="+obj.paid+"&countdown="+countdown;
        return false;
    }

})

export default class ActApply extends React.Component{
    componentDidMount() {
        console.log("报名活动页加载完成");
        ActApplyActions.getActApplydata();
    }

    render() {
        console.log("活动报名页数据",this.state.actapplydata);
        let items;
        let count; 
        if(this.state.actapplydata&&this.state.actapplydata.actapplyer){
            count = this.state.actapplydata.actapplyer.length;
            let curdata = this.state.actapplydata.actapplyer;
            items = curdata&&curdata.map( (item,i)=>{
                console.log("报名活动的每一个人",item);
                var thestate = "未参加";
                var stastyle = "noapply";
                var ymdtime = ToolFactory.covertTimeFormat(item.ctime);
                var hmtime = ToolFactory.getTimeClock(item.ctime);
                var ittime = ymdtime + '   ' + hmtime; 
                return <li className="actapplyli clear" key={i}>
                            <div className="left telwake">
                                <img onClick={this._showTelbox.bind(this,item.tel)} src="../../assets/img/tel.png"/>
                            </div>
                            <div className="alyerbtn right" onClick={this._goSubmitPage.bind(this,item)}>
                                <span>开始活动</span>
                            </div>
                            <div className="alyerinfo">
                                <img className="left alyerimg" src={item.headimgurl} />
                                <p>{item.realname}</p>
                                <p>{ittime}</p>
                            </div>
                            
                            <div className={stastyle}>{thestate}</div>
                        </li> 
            } )
        }
        if(this.state.actapplydata&&this.state.actapplydata.telboxstyle==1){
            var telstyle = {
                display: "block"
            };
            var tel = this.state.actapplydata.tel;
        }else{
            var telstyle = {
                display: "none"
            };
            
        }
        return (
            <div className="actapplypage">
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>活动报名</div>
                <div className="actapplyinfo">
                    <div className="actan-box">
                        <img src="../../assets/img/trophy.png"/>
                        <p>
                            <span>{count}</span>
                            <span>人</span>
                        </p>
                        <p>已报名人数</p>
                    </div>
                    <ul className="actapplyul" id="actapplyul">
                        {items}
                    </ul>
                </div>
                <div className="mask" style={telstyle} onClick={this._hideTelbox}></div>
                <div className="phonebox" style={telstyle}>
                    <p className="teltext">{tel}</p>
                    <div className="telbtn">
                        <a href={"tel://"+tel}>拨打电话</a>
                        <a href={"sms://"+tel}>短信</a>
                    </div>
                </div>
            </div>
        )
    }
    _showTelbox(tel) {
        //$(".mask").show();
        //$(".phonebox").show();        
        ActApplyActions.changeTelbox(1,tel);
    }
    _hideTelbox() {
        //$(".mask").hide();
        //$(".phonebox").hide();
        ActApplyActions.changeTelbox(0);
    }
    _goSubmitPage(obj) {
        ActApplyActions.goSubmitPage(obj);
    }

    _back() {
        window.history.back(-1);
    }
}

ReactMixin.onClass(ActApply,Reflux.connect(ActApplyStore,'actapplydata'));