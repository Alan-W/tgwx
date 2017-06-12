var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var weixin = require('../../core/factories/WeixinFactory.js');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');
var qrcode = require('jquery-qrcode');

var aid = ToolFactory.GetQueryString('aid'); // 活动ID
var actOID = ToolFactory.GetQueryString('oid'); // 玩儿家的ID
var pid = ToolFactory.GetQueryString('pid'); // 玩儿家的ID
var paid = ToolFactory.GetQueryString('paid'); // player_activity 的ID
var type = ToolFactory.GetQueryString('type'); // 活动的类型
var isPlayed = ToolFactory.GetQueryString('isPlayed'); // 玩儿家参与活动的状态

console.log('当前的aid 是: ------ ', aid);

weixin.setup(function(){
	weixin.forbidSharing();
});

// action
var MyOrgActDetailsActions = Reflux.createActions([
	'getMyActivitiyDetails',
	'loopGetActScoreData',
	'autoSetSignUpData', // 自动去提交报名信息
]);

// store
var MyOrgActDetailsStore = Reflux.createStore({
	myActivityDetails: null,
	joinAgainSuccess: false, // 当前用户点击再次参加的状态
	nPaid: null, // 点击再次参加生成的新的活动paid
	listenables: [MyOrgActDetailsActions],
	onGetMyActivitiyDetails: function() {
		var that = this;
		$.ajax({
			url: 'https://tg-api.taiyuansport.com/',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'getActivityDetail',
				aid: aid,
				player_id: pid,
			},
		})
		.done(function(resp) {
			console.log("onGetMyActivitiyDetails-------success()", resp);
			if (resp && resp.getActivityDetail && resp.getActivityDetail.success) {
				that.myActivityDetails = resp.getActivityDetail.data;
				that.trigger(that.myActivityDetails, that.joinAgainSuccess, that.nPaid);
			}
		})
		.fail(function(e, x, r) {

			console.log("onGetMyActivitiyDetails-------error()", e);
			that.trigger(that.myActivityDetails, that.joinAgainSuccess, that.nPaid); // 错误的时候也需要去更新数据
		});
	},

	// 自动提交报名信息(点击了再次参加之后)
	onAutoSetSignUpData: function(aid, pid) {

		var that = this;

		$.ajax({
			url: 'https://tg-api.taiyuansport.com/',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'setSignUp',
				aid: aid,
				player_id: pid
			},
		})
		.done(function(resp) {
			console.log("ActivityDetailsStore- ------ success()", resp);
			console.log('自动提交用户报名信息成功的返回值是: ------ ', resp);
			if (resp && resp.setSignUp) {
				if (resp.setSignUp.success) { // 自动提交活动报名信息成功
					// 更新本地的再次参加的字段信息
					that.joinAgainSuccess = true;
					that.nPaid = resp.setSignUp.data; // 更新当前活动详情的数据
					// that.hasScore = false;
					that.trigger(that.myActivityDetails, that.joinAgainSuccess, that.nPaid);
				} else { // 自动提交活动的报名信息失败
                    that.joinAgainSuccess = false;
                    that.nPaid = null; // 更新当前活动详情的数据
					that.trigger(that.myActivityDetails, that.joinAgainSuccess, that.nPaid)
				}
			}
		})
		.fail(function(e, x, r) {
			console.log("ActivityDetailsStore-- ------ error()", e);
			console.log('自动提交用户报名信息失败的错误是: ------ ', e);
		});
	}
})

var MyOrgActDetails = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(MyOrgActDetailsStore, 'myActivityDetails', 'joinAgainSuccess', 'nPaid')],
	getInitialState: function () {
		return {
			playerInfo: null,
			myActivityDetails: null,
			showPlayerTip: false,
			joinAgainSuccess: false, // 当前点击再次参加的状态
			nPaid: null, // 点击再次参加生成的新的paid
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		var that = this;
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				MyOrgActDetailsActions.getMyActivitiyDetails();
			};
			
		});

		console.log('当前用户的信息是: ------ ', playerInfo);
	},

	onMyOrgActDetailsChange: function(myActivityDetails, joinAgainSuccess, nPaid) {
		var that = this;

		this.setState({
			myActivityDetails: myActivityDetails ,
			joinAgainSuccess: joinAgainSuccess,
			nPaid: nPaid,
			played: isPlayed, //  玩儿家是否参与过该游戏，初始的时候拿的是url 链接上的
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听我的活动的数据的变化
		this.unsubscribe = MyOrgActDetailsStore.listen(this.onMyOrgActDetailsChange);

	},

	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		var showJoinStyle = {
			display: '',
		};

		var showChallen = {
			display: '',
		};
		
		
		var playerJoinedStatusTxt = '';

		var playerActTip = {
			display: '',
		};

		var showJoinAgainSuccess = {
			display: ''
		};


		if (this.state.myActivityDetails) {

			if (((this.state.myActivityDetails.etime * 1000 < Date.parse(new Date())) || parseInt(this.state.played) == 1) || parseInt(this.state.myActivityDetails.isIn) == 0) { // 活动已经结束, 或者用户才报名了活动,则不显示再次参加按钮，或者用户根本有史以来就是第一次参与该活动

				showJoinStyle['display'] = 'none';

			} else {
				showJoinStyle['display'] = 'block';
			};

			showChallen['display'] = (parseInt(this.state.myActivityDetails.isIn) > 0) ? 'block' : 'none'; // 普通活动 并且是参加过的活动并且是竞技类型的活动显示我的挑战,显示我的成绩


			playerJoinedStatusTxt = (this.state.myActivityDetails.etime * 1000 < Date.parse(new Date())) ? '活动已结束' : '再次参加';


			playerActTip.display = this.state.showPlayerTip ? 'block' : 'none';
		};

		showJoinAgainSuccess.display = this.state.joinAgainSuccess ? 'block' : 'none'; // 点击再次参加成功之后显示提示框
		
		return (
			<section className="act-details">
				<div className="head-bar has-arrow has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage}>
						<span className="back"></span>
					</span>
					<span className="page-title">活动详情</span>
				</div>
				<div className="act-info org-act-info">
					<p className="act-name">{(this.state.myActivityDetails && this.state.myActivityDetails.name) ? this.state.myActivityDetails.name : ''}</p>
				</div>
				<div className="act-info-list">
					<div className="setting-item no-arrow">
						<span className="info-type">主办方</span>
						<span className="info-value">{(this.state.myActivityDetails && this.state.myActivityDetails.cby) ? this.state.myActivityDetails.cby : ''}</span>
					</div>
					<div className="setting-item has-margin no-arrow">
						<span className="info-type">活动时间</span>
						<span className="info-value">{this.state.myActivityDetails ? ToolFactory.covertTimeFormat(this.state.myActivityDetails.stime, false) : ''}-{this.state.myActivityDetails ? ToolFactory.covertTimeFormat(this.state.myActivityDetails.etime, false) : ''}</span>
					</div>
					<div className="setting-item no-arrow">
						<span className="info-type">活动地点</span>
						<span className="info-value">{(this.state.myActivityDetails && this.state.myActivityDetails.addr) ? this.state.myActivityDetails.addr : ''}</span>
					</div>
					<div className="setting-item has-arrow" onClick={this._goActDetailsPage}>
						活动详情
					</div>
					<div className="setting-item" style={showChallen} onClick={this._goMyScorePage}>
						<span>我的成绩</span>
					</div>
				</div>
				<div className="footer-tabbar flex-container">
					<span className="tabbar-item act-state" onClick ={this._joinAgain} style={showJoinStyle}>再次参加</span>
				</div>
				<div className="tip-toast join-again-tip" id="joinAgainDialog" style={showJoinAgainSuccess}>
				    <div className="tip-content">
				    	<img src="../../assets/img/okb.png" />
				        <p className="join-again" >再次参加, 申请成功</p>
				        <div className="tip-footer" onClick={this._hiddenJoinModal}>
				            <span className="confirm-join-again-btn">确定</span>
				        </div>
				    </div>
				</div>
				<div className="share-tip" id="shareTipModal" data-id="#shareTipModal" onClick={ToolFactory.hiddenShareTip}><img src="../../../assets/img/sharetip.png" data-id="#shareTipModal" / ></div>
				<div className="tip-toast act-end-tip" id="playerActStateTip" style={playerActTip}>
					<img className="tip-warn-img" src="../../assets/img/warn.png" /> 
					<p className="weui_toast_content">抱歉,该活动未完成</p>
					<p className="weui_toast_content second">活动已结束!</p>
				</div>
			</section>
		)
	},


	_goActDetailsPage: function () { //?aid=33&oid=5&id=3
		var baseUrl = ToolFactory.changeUrlPath('activity/');
		baseUrl += "details.html";
		baseUrl += "?aid=" + aid;
		baseUrl += "&oid=" + (this.state.myActivityDetails ? this.state.myActivityDetails.oid : '');
		baseUrl += "&type=" + type;
		baseUrl += "&prev=1";
		console.log('当前活动的oid 是: ------ ', this.state.myActivityDetails.oid);
		console.log('当前跳转的详情页面是： ----- ', baseUrl);
		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},

	// 再次参加
	_joinAgain: function (event) {
		var that = this;
		
		if (this.state.myActivityDetails.etime * 1000 < Date.parse(new Date())) {
			that.setState({
				showPlayerTip: true
			});
			window.setTimeout(function(){
				that.setState({
					showPlayerTip: false
				});
			}, 2000);
			return;
		};
		
		MyOrgActDetailsActions.autoSetSignUpData(aid, pid);
		
	},


	// 进入到我的成绩列表
	_goMyScorePage: function() {

		var baseUrl = ToolFactory.getUrlPath(window.location.href);
		baseUrl += 'myscore.html?';
		baseUrl += 'pid='+ (global.player ? global.player.id : '');
		baseUrl += '&aid='+ aid;
		baseUrl += '&oid='+ actOID;
		baseUrl += '&type='+ type;
		
		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},

	_hiddenJoinModal: function (event) {
		// 更新当前活动详情的信息
		// 重新刷新链接
		console.log('当前活动的nPaid 是: ------- ', this.state.nPaid);

		// 页面直接跳转到提交成绩的页面（机构用户自己提交成绩）
		var baseUrl = ToolFactory.changeUrlPath('activity/');
		baseUrl += 'orgplayersubmitscore.html?'; // 跳转的是自动提交成绩的页面
		baseUrl += 'aid=' + aid;
		baseUrl += '&oid=' + actOID;
		baseUrl += '&type=' + type;
		baseUrl += '&paid=' + (this.state.nPaid ? this.state.nPaid : null); // player_activity 的ID
		baseUrl += '&countdown='+ (this.state.myActivityDetails ? this.state.myActivityDetails.countdown : 0); // 活动的时间
		baseUrl += '&isPlayed=' + 1;

		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},

	// / 返回上一页
	_goPrevPage: function() {
		history.go(-1);
	}

});

module.exports = MyOrgActDetails;