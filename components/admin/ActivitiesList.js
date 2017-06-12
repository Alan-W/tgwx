var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin'); 
var ToolFactory = require('../../core/factories/ToolFactory');
var global = require('../../core/factories/GlobalFactory.js');
var LoginStore = require('./LoginStore.js');

var myDropLoad = require('../../core/components/Dropload.js');
var $ = require('jquery');

var ActivitiesListActions = Reflux.createActions([
    'getActivitiesListData',
    'goActdetail',
    'initDropList',
]);

var ActivitiesListStore = Reflux.createStore({
    alldata: {
        activitiesList: [],
        coachinfo: null,
    },
    
    listenables: [ActivitiesListActions],
    onGetActivitiesListData: function(){
        var self = this;
        console.log("去请求活动列表数据");
        var offset = self.alldata.activitiesList.length;
        $.ajax({
            url: global.apiUrl + 'index.php',
            type: 'GET',
            data: {
                r: 'player-user/static',
                expand: 'getPlayerUserActivitys',
                player_user_id: self.alldata.coachinfo.id,
                offset: offset,
                limit: 10
            }
        })
        .done(function(resp){
            console.log("页面加载完请求数据成功");
            //console.log("辅导员请求到的活动列表数据",resp);
            self.alldata.activitiesList = self.alldata.activitiesList.concat( resp.getPlayerUserActivitys.data );
            
            self.trigger(self.alldata);
        })
        .fail(function(e){
            console.log("ActivitiesListStore...请求活动列表数据报错",e);
        })
        
    },
    onGoActdetail: function(item){
        console.log("进入活动信息页面携带的参数",item);
        window.location.href = 'actinfo.html?aid='+item.id+'&oid='+item.oid+'&uid='+this.alldata.coachinfo.id+'&countdown='+item.countdown;
    },
    onInitDropList: function( coachinfo ){
        console.log("初始化上拉加载。。。");
        var self = this;
        self.alldata.coachinfo = coachinfo;
        if(document.getElementById('activityul')){
            $('#activityul').dropload({
                scrollArea: window,
                loadDownFn: function(me) {
                    console.log("触发上拉");
                    var offset = self.alldata.activitiesList.length;
                    console.log("现有数据长度",offset);
                    $.ajax({
                        url: global.apiUrl + 'index.php',
                        type: 'GET',
                        data: {
                            r: 'player-user/static',
                            expand: 'getPlayerUserActivitys',
                            player_user_id: self.alldata.coachinfo.id,
                            offset: offset,
                            limit: 10
                        }
                    })
                    .done(function(resp){
                        console.log("上拉执行成功",resp);
                        //console.log("辅导员请求到的活动列表数据",resp);
                        self.alldata.activitiesList = self.alldata.activitiesList.concat( resp.getPlayerUserActivitys.data );
                        console.log("连接后的数组",self.alldata.activitiesList);
                        //更新状态（就是个对象）
                        self.trigger(self.alldata);
                        if(resp.getPlayerUserActivitys.data.length==1){
                            me.resetload();
                        }else{
                            me.lock();
                            me.noData(true);
                            me.resetload();
                        }
                        
                    })
                    .fail(function(e){
                        me.resetload();
                        console.log("ActivitiesListStore...请求活动列表数据报错",e);
                    })
                }
            })
        }
    }

});


export default class ActivitiesList extends React.Component{
    //组件渲染完成后 通过ActivitiesListActions获取所有的数组 刷新绑定到this.state上
    /*constructor(props) {
        super(props);
        //this.state = {};
    }*/
    onCoachStatusChange(coachinfo) {
        console.log("辅导员信息",coachinfo);
        if( coachinfo ){
            ActivitiesListActions.initDropList( coachinfo );
        }
    }

    componentDidMount() {
        this.unsubscribe = LoginStore.listen(this.onCoachStatusChange);
    }
    render() {
        
        console.log("辅导员信息",this.state.coachinfo);
        console.log("活动列表",this.state.activitiesdata);
        let items;
        if(this.state.activitiesdata&&this.state.activitiesdata.activitiesList){
            console.log("监测数据",this.state.activitiesdata.activitiesList);
            items = this.state.activitiesdata.activitiesList.map( (item,i)=>{
                console.log("正在执行",item);
                if(item.status==1){
                    var thestate = "进行中", statestyle = "act-ing";

                }else{
                    var thestate = "已完成", statestyle = "act-end";
                }
                return <li key={i} className="activityli clear" onClick={this._enterActDetail.bind(this,item)} >
                    <img className="liimg left"src={item.logo}/>
                    <p className="lititle">{item.name}</p>
                    <p className="acthasnum">{item.addr}</p>
                    <div className={statestyle} >{thestate}</div>
                </li>
            })
        }
        if(this.state.activitiesdata&&this.state.activitiesdata.coachinfo){
            var loadstyle = {
                display: "none",
            }
        }else{
            var loadstyle = {
                display: "block",
            }
        }

        return (
            <div className="activiesListadmin">
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>活动管理</div>
                <div className="activitybox">
                    <div className="activityimg">
                        <img src="../../assets/img/banner.png"/>
                    </div>
                    <ul className="activityul" id="activityul">
                        {items}
                    </ul>
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
    _enterActDetail( item ) {
        console.log("进入活动信息页面携带的参数",item);
        ActivitiesListActions.goActdetail(item);
    }
    _reloadActdata() {
        ActivitiesListActions.getActivitiesListData();   
    }
    _back() {
        window.history.back(-1);
    }

}

//ES6 mixin写法 通过mixin将store的与组件连接 功能是监听store带来的state变化并刷新到this.state
ReactMixin.onClass(ActivitiesList,  Reflux.connect(ActivitiesListStore,'activitiesdata'));

