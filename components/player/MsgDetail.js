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

var msgId = ToolFactory.GetQueryString('msgId');

// action
var MyMsgDetailActions = Reflux.createActions([
	'getMyMsgDetail'
]);

// store
var MyMsgDetailStore = Reflux.createStore({
	myMsgDetail: null,
	listenables: [MyMsgDetailActions],
	onGetMyMsgDetail: function() {
		console.log('获取我的活动中玩儿家的信息是: ----- ', global.player.uid);
		//https://tg-api.taiyuansport.com/?r=player-message-center/view&id=1
		var that = this;
		$.ajax({
			url: global.apiUrl + 'index.php',
			type: 'GET',
			data: {
				r: 'player-message-center/view',
				id:msgId
			},
		})
		.done(function(resp) {
			console.log("消息详情返回数据",resp);
			if (resp) {
				that.myMsgDetail={
					title:resp.title,
					message:resp.message	
				}
				that.trigger(that.myMsgDetail);	
			};
		})
		.fail(function(e, x, r) {
			that.trigger(that.myMsgDetail);
		});
		
	}
})

var MsgDetail = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(MyMsgDetailStore, 'myMsgDetail')],//数据会自动更新到state的myMsgDetail当中。
	getInitialState: function () {
		return {
			playerInfo: null,
			myMsgDetail: null,
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				MyMsgDetailActions.getMyMsgDetail()
			}
		})
		
	},

	onMymsgDetailDataChange: function(myMsgDetail) {
		this.setState({
			myMsgDetail: myMsgDetail 
		}, function() {
			console.log('获取到的我的活动的数据时: ----- ', myMsgDetail);
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听我的活动的数据的变化
		this.unsubscribe = MyMsgDetailStore.listen(this.onMymsgDetailDataChange);

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
				<div className="msgDetail">
					<h4>{this.state.myMsgDetail&&this.state.myMsgDetail.title}</h4>
					<p>{this.state.myMsgDetail&&this.state.myMsgDetail.message}</p>
				</div>
			</section>
		)
	},
	
	// / 返回上一页
	_goPrevPage: function() {
		var url = ToolFactory.getUrlPath(window.location.href);
		url +='msglist.html';
		window.location.href = ToolFactory.checkUrlPath(url);
	}

});

module.exports = MsgDetail;