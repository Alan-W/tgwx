var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var $ = require('jquery');
var global = require('../../core/factories/GlobalFactory.js');
var ToolFactory = require('../../core/factories/ToolFactory.js');
var myDropLoad = require('../../core/components/Dropload.js');
var LoginStore = require('./LoginStore.js');

//var uid = ToolFactory.GetQueryString('uid');
//var paid = ToolFactory.GetQueryString('paid');

var ResultRankActions = Reflux.createActions([
    'init',
    'changeSearbox',

]);

var ResultRankStore = Reflux.createStore({
    coachinfo: null,
    aid: null,//进入页面aid无值   切换机构给aid赋值
    resultrankdata: [],
    searboxstyle: 0,
    myselfdrop: null,//下拉加载对象
    loadtip: 0,
    isautoload: true,
    listenables: [ResultRankActions],
    onInit: function(coachinfo){
        console.log("排行页面初始化");
        this.setCoach( coachinfo );
        this.getAct();
        this.getResultRankdata();
    },
    setCoach: function( coachinfo ){
        this.coachinfo = coachinfo;
    },
    getAct: function(){
        var self = this;
        $.ajax({
            url: global.apiUrl,
            type: "GET",
            dataType: "json",
            data: {
                r: "player-user/static",
                expand: "getPlayerUserActivitys",
                player_user_id: self.coachinfo.id//(uid)
            }
        })
        .done(function(resp){
            console.log("请求到的辅导员可辅导的活动---数据",resp);
            if(resp.getPlayerUserActivitys.success){
                console.log("请求到的辅导员可辅导的活动---成功----初始化下拉列表",resp.getPlayerUserActivitys.data);
                var resdata = resp.getPlayerUserActivitys.data;
                var dataarr = [];
                var showActDom = $('#actselect');
                var actselectbox = $('#actselectbox');
                for(var i=0;i<resdata.length;i++){
                    var obj = {};
                    obj.id = resdata[i].id;
                    obj.value = resdata[i].name;

                    dataarr.push( obj );
                }
                /*if(dataarr.length>0){
                    showActDom.html( resdata[0].name );
                }*/
                console.log("下拉列表的数据",dataarr);
               
                actselectbox.bind('click', function () {
                    var bankId = showActDom.attr('data-id');
                    //var bankName = showActDom.dataset['value'];
                    var bankSelect = new IosSelect(1, 
                        [dataarr],
                        {
                            container: '.container',
                            title: '活动选择',
                            itemHeight: 50,
                            itemShowCount: 3,
                            oneLevelId: bankId,
                            callback: function (selectOneObj) {
                                showActDom.html( selectOneObj.value );
                                showActDom.attr('data-id',selectOneObj.id);
                                showActDom.attr('data-value',selectOneObj.value);
                                //self.onGetResultRankdata( selectOneObj.id );
                                self.aid = selectOneObj.id;

                                self.resultrankdata = [];
                                //self.trigger(self.alldata);
                                //alert("2");
                                self.isautoload = false;
                                self.myLoadDown();
                                console.log("aaaaaaaaaaaaaaaaaaaa",self.myselfdrop.loadDownFn);
                            }
                    });
                });
            }
        })
        .fail(function(e){
            console.log("请求辅导员可辅导的活动报错",e);
        })
    },
    getResultRankdata: function(){
        //此时没有aid的
        var self = this;
        console.log("进入页面第一次请求排行----应该为undefined",self.aid);
        self.resultrankdata = [];
        console.log("请求成绩排行数据");
        if(document.getElementById("resultrankul")){
            $("#resultrankul").dropload({
                scrollArea: window,
                loadDownFn: function(me){
                    self.myselfdrop = me;
                    console.log("触发上拉");
                    //alert("1");
                    if(self.isautoload){
                        self.myLoadDown();
                    }
                    

                }
            })
        }
    },
    myLoadDown: function(){//reset 为 true 是切换活动第一次请求
        var self = this;
        console.log("此时触发上拉----拿到的aid----------",self.aid);
        //alert(self.aid);
        var me = self.myselfdrop;
        console.log("mememememe",me);
        
        var offset = self.resultrankdata.length;
        //alert(offset);
        var ps = {
            r: "activity/static",
            expand: "getPlayerUserRankings",
            player_user_id: self.coachinfo.id,//(uid)
            offset: offset,
            limit: 10
        };
        if(self.aid){//进入页面时没有 请求排行数据不带aid(切换活动时加aid参数)  接口都会返回aid数据
            ps.aid = self.aid;
            console.log("333333333333333333",self.aid);
        }
        $.ajax({
            url: global.apiUrl,
            type: "GET",
            dataType: "json",
            data: ps
        })
        .done(function(resp){
            console.log("请求到的排行数据",resp);
            self.loadtip = 1;//隐藏加载动画
            if(resp.getPlayerUserRankings.success){
                
                console.log("请求排行数据成功--数据",resp.getPlayerUserRankings.data);
                if(resp.getPlayerUserRankings.data){

                    //alert("请求到排行数据");
                    $('#actselect').html( resp.getPlayerUserRankings.data.activity.name );
                    $('#actselect').attr('data-id',resp.getPlayerUserRankings.data.activity.id);
                    $('#actselect').attr('data-value',resp.getPlayerUserRankings.data.activity.name);
                    self.resultrankdata = self.resultrankdata.concat( resp.getPlayerUserRankings.data.playerRankings );
                    
                    if(resp.getPlayerUserRankings.data&&resp.getPlayerUserRankings.data.playerRankings.length==10){
                        me.resetload();
                    }else if(resp.getPlayerUserRankings.data&&resp.getPlayerUserRankings.data.playerRankings.length!=10){
                        console.log("lock1111");
                        //me.lock();
                        /*if(offset==0&&resp.getActivitySignUps.data.length==0){
                            me.noData("没有数据");
                        }else{
                            me.noData(true);
                        }*/
                        if(offset==0&&resp.getPlayerUserRankings.data.playerRankings.length==0){
                            //alert("暂无数据");
                            me.noData("noone");
                            me.resetload();
                            me.noData(false);
                            //不显示 已经 到 最底了
                        }else{
                            me.noData(true);
                            me.resetload();
                            me.noData(false);//以备 切换活动后使用
                        }
                        
                    }
                }else{
                    console.log("lock2222");
                    //alert("没有活动的排行数据");
                    //me.noData("no");
                    //me.resetload();
                    //me.noData(false);
                }
                
            }else{
                me.noData(true);
                me.resetload();
                alert("请检查参数");
            }
            self.isautoload = true;
            self.trigger({resultrankdata: self.resultrankdata,searboxstyle: self.searboxstyle,loadtip: self.loadtip});
        })
        .fail(function(e){
            me.resetload();
            console.log("请求排行数据报错",e);
        })
    },
    resetRank: function(aid){
        var self = this;
        console.log("切换不同活动的排行数据");
        $.ajax({
            url: global.apiUrl,
            type: "GET",
            dataType: "json",
            data: {
                r: "activity/static",
                expand: "getPlayerUserRankings",
                player_user_id: uid,
                aid: aid
            }
        })
        .done(function(resp){
            console.log("请求到的排行数据",resp);
            if(resp.getPlayerUserRankings.success){
                console.log("请求排行数据成功--数据",resp.getPlayerUserRankings.data);
                self.resultrankdata = resp.getPlayerUserRankings.data;
                self.trigger({resultrankdata: self.resultrankdata,searboxstyle: self.searboxstyle,loadtip: self.loadtip});
            }
        })
        .fail(function(e){
            console.log("请求排行数据报错",e);
        })
    },
    onChangeSearbox: function(num){
        this.searboxstyle = num;
        this.trigger({resultrankdata: this.resultrankdata,searboxstyle: this.searboxstyle,loadtip: self.loadtip});
    }
});

export default class ResultRank extends React.Component{
    onCoachStatusChange(coachinfo) {
        console.log("辅导员信息",coachinfo);
        if( coachinfo ){
            ResultRankActions.init(coachinfo);
        }
    }

    componentDidMount() {
        console.log("成绩排行页加载完毕---监听是否拿到辅导员信息");
        this.unsubscribe = LoginStore.listen(this.onCoachStatusChange);
    }

    render() {
        console.log("成绩排行页的数据",this.state.resultrank);

        if(this.state.resultrank&&this.state.resultrank.loadtip == 1){
            var loadstyle = {
                display: "none",
            }
        }else{
            var loadstyle = {
                display: "block",
            }
        }

        let items;
        if(this.state.resultrank&&this.state.resultrank.resultrankdata.length>0){
            items = this.state.resultrank.resultrankdata.map( (item,i)=>{
                console.log("参赛人每一条成绩记录",item);
                var itname = item.player?item.player.realname:"某某某";
                var itimg = item.player&&item.player.headimgurl?item.player.headimgurl:"../../assets/img/def-head.png";
                var ittime = ToolFactory.covertTimeFormat(item.ctime);
                return (
                    <li key={i} className="resultrankli clear" >
                        <div className="reindex left">{i+1}</div> 
                        <div className="reend right"><span>{item.result}</span><span>个</span></div>
                        <div className="divspan">
                            <img className="left" src={itimg} />
                            <p>{itname}</p>
                            <p>{ittime}</p>
                        </div>
                    </li>
                );
            } )
        }else if($("#actselect").attr("data-id")==0||$("#actselect").attr("data-id")=="0"||!$("#actselect").attr("data-id")){
            items = (function(){
                return (
                    <p className="resultrankp">你还没有辅导过活动<br/>可切换机构查看其它辅导员辅导的活动</p>
                )
            })()
        }else{
            items = (function(){
                return (
                    <p className="resultrankp">该活动还没有辅导员辅导</p>
                )
            })()
        }

        if(this.state.resultrank&&this.state.resultrank.searboxstyle==1){
            var searboxstyle = {
                display: "block"
            }
        }else{
            var searboxstyle = {
                display: "none"
            }
        }
        return (
            <div className="resultrankpage">
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>成绩排行</div>
                <div className="resultrankbox">
                    <div className="rankcover">
                        <img src="../../assets/img/banner.png" />
                    </div>
                    <div className="rankoper">
                        <div className="rankselect" id="actselectbox">
                            <span data-id="0" data-value="请切换活动" className="actselect" id="actselect">请切换活动</span> 
                            <img className="selectbtn" src="../../assets/img/down-arrow.png" />
                        </div>
                        
                    </div>
                    <div className="ranksearchbox">
                        <div className="space"></div>
                        <div className="ranksearch" onClick={this._showSearbox}>
                            <img src="../../assets/img/search1.png"/>
                            搜索
                        </div>
                    </div>
                    <ul className="resultrankul" id="resultrankul">
                        {items}
                    </ul>
                    <div className="searchbox" style={searboxstyle}>
                        <div className="searchinput">
                            <img className="searchbtn left" src="../../assets/img/search2.png" />
                            <span className="searchcancel right" onClick={this._hideSearbox}>取消</span>
                            <input type="text" placeholder="闫亭芳"/>
                        </div>
                        <ul className="resultrankul">
                            {items}
                        </ul>
                    </div>
                </div>

                <div id="loadingToast" className="data-loading-style" style={loadstyle}>
                    <div  style={loadstyle}>
                        <div className="loadEffect">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                    </div>
                        <p className="loading-tip">加载中</p>
                    </div>
                </div>
            </div>
        )
    }

    _showSearbox() {
        ResultRankActions.changeSearbox(1);
    }

    _hideSearbox() {
        ResultRankActions.changeSearbox(0);
    }

    _back() {
        window.history.back(-1);
    }
}

ReactMixin.onClass(ResultRank,Reflux.connect(ResultRankStore,'resultrank'));