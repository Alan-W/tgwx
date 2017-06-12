var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var OrgDataActions = require('../../core/actions/OrgDataActions.js');
var OrgDataStore = require('../../core/factories/OrgDataStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var weixin = require('../../core/factories/WeixinFactory.js');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');

weixin.setup(function(){
	weixin.enableSharing();
});

// action
var MyMessageListActions = Reflux.createActions([
	'getMyMessagesList'
]);

var counter = 0;
var num = 10;
var pageStart = 0;
var pageEnd = 0;

// store
var MyMessageListStore = Reflux.createStore({
	myMsgList: [],
	listenables: [MyMessageListActions],
	onGetMyMessagesList: function() {
		console.log('获取我的活动中玩儿家的信息是: ----- ', global.player.id);
		var that = this;
		var offset = that.myMsgList.length;
		console.log("offset",offset);
		if (document.getElementById('dropList')) {
			$('#dropList').dropload({
				scrollArea: window,
				loadDownFn: function (me) {
					//https://tg-api.taiyuansport.com/?r=activity/static&expand=getPlayerMessageList&player_id=33
					$.ajax({
						url: global.apiUrl + 'index.php',
						type: 'GET',
						data: {
							r: 'activity/static',
							expand: 'getPlayerMessageList',
							player_id: (global.player ? global.player.id : null),
							offset: offset,
							limit: 10,
						},
					})
					.done(function(resp) {
						counter++;
						pageEnd = num * counter;
						pageStart = pageEnd - num;
						console.log("MyMessageListStore.js-----------getMyacts:success()", resp);
						if (resp && resp.getPlayerMessageList && resp.getPlayerMessageList.data) {
							var respLen = resp.getPlayerMessageList.data.length;
							if (respLen < 10) { // 若返回的数据少于10个则停止加载
								me.lock();
								me.noData();
							}	
							that.myMsgList = that.myMsgList.concat(resp.getPlayerMessageList.data);
							console.log('MyMessageListStore.js重置完我的活动列表的数据是：--------', that.myMsgList);
							offset = that.myMsgList.length;
							that.trigger(that.myMsgList);
							// 每次加载完必须重置
							me.resetload();
						};
					})
					.fail(function(e, x, r) {
						console.log("MyMessageListStore.js-----------getMyacts:failed()", e);
						// 即使请求失败也是重新加载数据
						me.resetload();
						that.trigger(that.myMsgList);
					});
				}
			})
		}
		
	}
})

var MyMessageList = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(MyMessageListStore, 'myMsgList')],
	getInitialState: function () {
		return {
			playerInfo: null,
			myMsgList: [],
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				MyMessageListActions.getMyMessagesList()
			}
		})
		
	},

	onMymsgDataChange: function(myMsgList) {
		this.setState({
			myMsgList: myMsgList 
		}, function() {
			console.log('获取到的我的消息的数据时: ----- ', myMsgList);
			
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听消息列表的数据的变化
		this.unsubscribe = MyMessageListStore.listen(this.onMymsgDataChange);
		// window.location.reload(true); 

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		return(
			<section className="my-acts">
				<div className="head-bar has-arrow has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage}>
						<span className="back"></span>
					</span>
					<span className="page-title">消息</span>
				</div>
				<div className="msg-wrap" id="dropList">
					<ul>
						{this.state.myMsgList.map(this._initialMsgList)}
					</ul>
				</div>
			</section>
		)
	},

	// / 初始话我的活动列表ITEM
	_initialMsgList: function (items, index) {
		console.log(' the items is : ------- ', items);
		var noRead = items.status;//0表示未读状态
		var styleRead = null;
		if(noRead == 0){
			styleRead = {
				'display':'block'
			}
		}else{
			styleRead = {
				'display':'none'
			}
		};

		return (
			<li key={index}>
				<div className="msgContainer">
					<div className="msgTitle">
						<h4>{items.title}</h4>
						<p>{ToolFactory.covertTimeFormat(items.ctime)}&nbsp;&nbsp;&nbsp;{ToolFactory.getTimeClock(items.ctime)}</p>
					</div>
					<div className="showDetail setting-item">
						<a href="javascript:void(0);" data-player-id={items.player_id} data-msg-id={items.id} data-msg-status={items.status}  data-act-id={items.aid} data-msg-type={items.type} onClick={this._goMsgDetail}>查看详情 </a>
					</div>
					<div className="noRead" style={styleRead}>
						<img src="../../assets/img/noRead.png"/>
					</div>
				</div>
			</li>
		)
	},
	//查看消息详情页跳转
	_goMsgDetail:function(event){
		var msgId = $(event.target).attr("data-msg-id");
		var index = this._returnMsgDetails(parseInt(msgId));
		var thisDetails = this.state.myMsgList[index];
		var newMsgList = this.state.myMsgList.slice();
		newMsgList.splice(index, 1, thisDetails);
		
		console.log(' the msgDetaikls is  ----- ', thisDetails);

		var msgType = thisDetails.type;
		var msgStatus =thisDetails.status;
		var actId = thisDetails.aid;
		var pid = thisDetails.player_id;
		var baseUrl = ToolFactory.getUrlPath(window.location.href);
		if(msgStatus == 1){//表示已读状态
			if(msgType == 1){//1表示系统通知
		  		baseUrl += 'msgDetail.html?';
		   		baseUrl += 'msgId='+ msgId;
			}else if(msgType == 2){//提交成绩通知
		  		baseUrl += 'myscore.html?';
		   		baseUrl += 'aid='+ actId;
		   		baseUrl += '&pid='+ pid;
			}
			window.location.href = ToolFactory.checkUrlPath(baseUrl);	
		}else{//将未读消息置为已读
			//https://tg-api.taiyuansport.com/?r=player-message-center/update&id=3
			thisDetails.status = 1;
			this.setState({
				myMsgList: newMsgList
			});

			$.ajax({
				url: global.apiUrl + '?r=player-message-center/update&id='+msgId,
				type: 'POST',
				dataType: "json",
				data:{
					status:1
				}
			})
			.done(function(resp){
				console.log('消息置为已读的返回结果---',resp);
				if(resp.status == 1){
					if(msgType == 1){//1表示系统通知
				  		baseUrl += 'msgDetail.html?';
				   		baseUrl += 'msgId='+ msgId;
					}else if(msgType == 2){//提交成绩通知
				  		baseUrl += 'myscore.html?';
				   		baseUrl += 'aid='+ actId;
				   		baseUrl += '&pid='+ pid;	
					}
					window.location.href = ToolFactory.checkUrlPath(baseUrl);	
				}
			})
			.fail(function(e, x, r){
				console.log("错误消息", e);	
			})
		}
	},

	// 返回指定的消息数据
	_returnMsgDetails: function(id) {
		var data = this.state.myMsgList;
		for (var i = 0 ; i <data.length; i++) {
			var m = data[i];
			if (m.id == id) {
				return i;
			};
		};
	},
	// / 返回上一页
	_goPrevPage: function() {
		history.go(-1);
	}

});

module.exports = MyMessageList;