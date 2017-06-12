var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var myDropLoad = require('../../core/components/Dropload.js');
var $ = require('jquery');

var global = require('../../../core/factories/GlobalFactory.js');
var ToolFactory = require('../../core/factories/ToolFactory');

var aid = ToolFactory.GetQueryString('aid');
var uid = ToolFactory.GetQueryString('uid');
var type = ToolFactory.GetQueryString('type');

var ActJoinActions = Reflux.createActions([
    'getActJoineddata',
]);

var ActJoinedStore = Reflux.createStore({
    actjoiner: [],
    allnum: 0,
    listenables: [ActJoinActions],
    onGetActJoineddata: function(){
        console.log("请求已参加活动的数据");
        var self = this;
        if(document.getElementById("actjoinedul")){
            $("#actjoinedul").dropload({
                scrollArea: window,
                loadDownFn: function(me){
                    console.log("触发上拉");
                    var offset = self.actjoiner.length;
                    $.ajax({
                        url: global.apiUrl + 'index.php',
                        type: 'GET',
                        data: {
                            r: 'activity/static',
                            expand: 'getPlayerUserRanks',
                            player_user_id: uid,
                            aid: aid,
                            offset: offset,
                            limit: 10
                        },
                    })
                    .done(function(resp) {
                        console.log("请求已参加活动的人-数据", resp);
                        if (resp && resp.getPlayerUserRanks && resp.getPlayerUserRanks.success) {
                            self.actjoiner = resp.getPlayerUserRanks.data?resp.getPlayerUserRanks.data.order:[];
                            self.allnum = resp.getPlayerUserRanks.data?resp.getPlayerUserRanks.data.num:0;
                            self.trigger({actjoiner: self.actjoiner,allnum:self.allnum});
                            if(resp.getPlayerUserRanks.data&&resp.getPlayerUserRanks.data.order.length==10){
                                me.resetload();
                            }else{
                                me.lock();
                                if(offset==0&&resp.getPlayerUserRanks.data.length==0){
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
                    .fail(function(e) {
                        me.resetload();
                        console.log("请求已参加活动的人报错", e);
                    });
                }
            })
        }
    }
});

export default class ActJoined extends React.Component{
    componentDidMount() {
        ActJoinActions.getActJoineddata();
    }

    render() {
        console.log("已参加活动页面数据",this.state.actjoineddata);
        let items;
        let count = 0;
        if(this.state.actjoineddata&&this.state.actjoineddata.actjoiner){
            let curdata = this.state.actjoineddata.actjoiner;
            count = this.state.actjoineddata.actjoiner.length;
            items = curdata&&curdata.map( (item,i)=>{
                console.log("每一个已经参赛的人",item);
                var ittime = ToolFactory.covertTimeFormat(item.ctime);
                return (
                    <li key={i} className="actjoinedli">
                        <span>{item.realname}</span>
                        <span>{ittime}</span>
                        <span>{item.result}</span>
                        <span>{item.times}</span>
                        <span>{item.num}</span>
                    </li>
                )
            } )
        }
        if(this.state.actjoineddata){
            var allnum = this.state.actjoineddata.allnum;
        }else{
            var allnum = 0;
        }
        return (
            <div className="actjoinedpage">
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>参加活动</div>
                <div className="actjoinedbox">
                    <div className="ajoinnumbox">
                        <img src="../../assets/img/trophy.png"/>
                        <p>
                            <span>{allnum}</span>
                            <span>人</span>
                        </p>
                        <p>已参加人数</p>
                    </div>
                    <div className="actjoindata">
                        <p className="mycoach"><span className="mycoachin">我的辅导</span></p>
                        <div className="actjointit">
                            <span>姓名</span>
                            <span>时间</span>
                            <span>成绩</span>
                            <span>名次</span>
                            <span>人数</span>
                        </div>
                        <ul className="actjoinedul" id="actjoinedul">
                            {items}
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
    _back() {
        window.history.back(-1);
    }
}

ReactMixin.onClass(ActJoined,Reflux.connect(ActJoinedStore,'actjoineddata'));