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

if (parseInt(type == 1)) { // 普通活动
	weixin.setup(function(){
		weixin.enableSharing();
	});
} else if(parseInt(type) == 2) { // 机构活动
	weixin.setup(function(){
		weixin.forbidSharing();
	});
}

// 轮询的定时器
var loopTimer = null;

// action
var MyActivityDetailsActions = Reflux.createActions([
	'getMyActivitiyDetails',
	'loopGetActScoreData',
	'autoSetSignUpData', // 自动去提交报名信息
]);

// store
var MyActivityDetailsStore = Reflux.createStore({
	myActivityDetails: null,
	hasScore: false, // 当前的活动是否有了成绩
	joinAgainSuccess: false, // 当前用户点击再次参加的状态
	nPaid: null, // 点击再次参加生成的新的活动paid
	listenables: [MyActivityDetailsActions],
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
				that.trigger(that.myActivityDetails, that.hasScore, that.joinAgainSuccess, that.nPaid);
			}
		})
		.fail(function(e, x, r) {

			console.log("onGetMyActivitiyDetails-------error()", e);
			that.trigger(that.myActivityDetails, that.hasScore, that.joinAgainSuccess, that.nPaid); // 错误的时候也需要去更新数据
		});
	},

	// 轮询去获取该活动的是否有了参与的成绩
	onLoopGetActScoreData: function() {
		var that = this;
		$.ajax({
			url: 'https://tg-api.taiyuansport.com/',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'getPollingIsplayed',
				player_id: pid,
				aid: aid			
			},
		})
		.done(function(resp) {
			console.log("MyActivityDetailsStore.js-------------getActStatusDetails:success()", resp);
			if (resp && resp.getPollingIsplayed && resp.getPollingIsplayed.success) {
				that.hasScore = true; // 是否提交的状态

				// 这个时候就此次活动baseRanking 的值可能是会发生变化的，重新去请求最好成绩
				// 有成绩之后重新请求活动详情数据, 因为需要更新挑战时的最好成绩
				that.myActivityDetails.isIn = 1;
				that.onGetMyActivitiyDetails();
				// that.trigger(that.myActivityDetails, that.hasScore, that.joinAgainSuccess, that.nPaid);
 
			}
		})
		.fail(function(e, x, r) {
			console.log("MyActivityDetailsStore.js-----------------getActsStatusDetails:faield()", e);
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
					that.trigger(that.myActivityDetails, that.hasScore, that.joinAgainSuccess, that.nPaid);
				} else { // 自动提交活动的报名信息失败
                    that.joinAgainSuccess = false;
                    that.nPaid = null; // 更新当前活动详情的数据
                    // that.hasScore = true;
					that.trigger(that.myActivityDetails, that.hasScore, that.joinAgainSuccess, that.nPaid)
				}
			}
		})
		.fail(function(e, x, r) {
			console.log("ActivityDetailsStore-- ------ error()", e);
			console.log('自动提交用户报名信息失败的错误是: ------ ', e);
		});
	}
})

var MyActivityDetails = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(MyActivityDetailsStore, 'myActivityDetails', 'hasScore', 'joinAgainSuccess', 'nPaid')],
	getInitialState: function () {
		return {
			playerInfo: null,
			myActivityDetails: null,
			shareType: 'share',
			showPlayerTip: false,
			hasScore: false, // 当前的活动如果是报名的是否有成绩，改值需要轮询去检测
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
				MyActivityDetailsActions.getMyActivitiyDetails();
			};
			
		});

		console.log('当前用户的信息是: ------ ', playerInfo);
	},

	onMyActivityDetailsChange: function(myActivityDetails, hasScore, joinAgainSuccess, nPaid) {
		var that = this;

		this.setState({
			myActivityDetails: myActivityDetails ,
			hasScore: hasScore,
			joinAgainSuccess: joinAgainSuccess,
			nPaid: nPaid,
			played: isPlayed, //  玩儿家是否参与过该游戏，初始的时候拿的是url 链接上的
		}, function() {
			console.log('获取到的我的活动的数据时: ----- ', myActivityDetails);

			if (myActivityDetails) { // 已经拿到了活动详情的数据
				var isEnd = parseInt(that.state.myActivityDetails) * 1000 < Date.parse(new Date()) ? 1 : 0; // 如果当前的活动已经过期了,则isEnd  是1
				var thisOid = actOID ? actOID : myActivityDetails.oid;
				var qrcodeData = {
					aid: aid, // 活动的ID
					actOid: thisOid, // 活动的机构ID
					paid: paid ? paid : null, // 玩儿家参与活动的player_activity 的ID
					countdown: that.state.myActivityDetails.countdown, // 活动的时间
					isEnd: isEnd, // 活动是否结束 (0,没过期,1:过期了)
					isPlayed: this.state.played, // 玩儿家参与该游戏的状态(1:报名,2参与过了)
				};

				$('#actQrcodeDetails').qrcode({ width:100, height:100, correctLevel:0, text: JSON.stringify(qrcodeData)});

				if ((isPlayed == 1) && (!that.state.hasScore)) { // 轮询的条件应该是这次活动是报名的状态并且是没有提交成绩的

					that._loopCheckIsSubmitScore();

				} else {
					clearInterval(loopTimer);
					
					// 更新二维码的数据
					var newQrcodeData = {
						aid: aid, // 活动的ID
						paid: paid ? paid : null, // 玩儿家参与活动的player_activity 的ID
						actOid: thisOid, // 活动的OID
						countdown: myActivityDetails ? myActivityDetails.countdown : 0, // 活动的时间
						isEnd: isEnd, // 活动是否结束 (0,没过期,1:过期了)
						isPlayed: 2, // 玩儿家参与该游戏的状态(1:报名,2参与过了),这里重新生成二二维码也就是isPlayed 的值变化了
					};

					that.setState({
						played: 2
					})

					$('#actQrcodeDetails').empty(); // 清空原来的二维码
					$('#actQrcodeDetails').qrcode({ width:150, height:150, correctLevel:0,text: JSON.stringify(newQrcodeData)});
				
				}
			} else { // 我的活动详情数据没拿到或者是拿到的是null


				var noDataJson = {
					data: null,
					error: " the request of activity's details data  is error",
				}
				$('#actQrcodeDetails').qrcode({ width:150, height:150, correctLevel:0,text: JSON.stringify(noDataJson)});
			}
			
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听我的活动的数据的变化
		this.unsubscribe = MyActivityDetailsStore.listen(this.onMyActivityDetailsChange);

		

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
			display: 'none'
		};

		var showChallBtnStyle = {
			display: 'none'
		};

		if (this.state.myActivityDetails) {

			if (((this.state.myActivityDetails.etime * 1000 < Date.parse(new Date())) || parseInt(this.state.played) == 1) || parseInt(this.state.myActivityDetails.isIn) == 0) { // 活动已经结束, 或者用户才报名了活动,则不显示再次参加按钮，或者用户根本有史以来就是第一次参与该活动

				showJoinStyle['display'] = 'none';

			} else {
				showJoinStyle['display'] = 'block';
			};

			var thisType  = type ? type : this.state.myActivityDetails.type;
			showChallen['display'] = (thisType == 1 && parseInt(this.state.myActivityDetails.isIn) > 0) ? 'block' : 'none'; // 普通活动 并且是参加过的活动并且是竞技类型的活动显示我的挑战,显示我的成绩
			showChallBtnStyle['display'] = (thisType == 1 && parseInt(this.state.played) > 1) ? 'block' : 'none'; // 普通完成的活动显示发起挑战的按钮

			playerJoinedStatusTxt = (this.state.myActivityDetails.etime * 1000 < Date.parse(new Date())) ? '活动已结束' : '再次参加';

			var playerActivityState = this.state.played > 1 ? '已参加' : '报名成功';
			var pasStyle = "";
			pasStyle = this.state.played > 1 ? 'join-last has-joined' : 'join-last has-signuped';

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
				<div className="act-info">
					<p className="act-name">{(this.state.myActivityDetails && this.state.myActivityDetails.name) ? this.state.myActivityDetails.name : ''}</p>
					<p className="act-qrcode" id="actQrcodeDetails"></p>
					<p className={pasStyle} >{playerActivityState}</p>
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
					<div className="setting-item" style={showChallen} onClick ={this._goChallengePage}>
						<span>我的挑战</span>
					</div>
					<div className="setting-item" style={showChallen} onClick={this._goMyScorePage}>
						<span>我的成绩</span>
					</div>
				</div>
				<div className="footer-tabbar flex-container">
					<span className="tabbar-item share-item" onClick={this._shareActDetails}>活动分享 </span>
					<span className="tabbar-item challenge-item act-state" onClick={this._shareChallenge} style={showChallBtnStyle}>发起挑战 </span>
					<span className="tabbar-item join-again" onClick ={this._joinAgain} style={showJoinStyle}>{playerJoinedStatusTxt}</span>
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

	_shareActDetails: function (event) {
		var that = this;
		
		var shareTtp = document.querySelector('#shareTipModal');
		shareTtp.style.display = 'block';
		this.setState({
			shareType: 'share',
		}, function () {
			that._fillShare();  
		});
		
		if (global.player.id) {
			// sa.track('click_act_share', {
			// 	time: new Date(),
			// 	userId: global.player.id,
			// 	actName: this.state.myActivityDetails.name,
			// 	actTime: this.state.myActivityDetails.stime,
			// 	actAddr: this.state.myActivityDetails.addr,
			// 	actCreate: this.state.myActivityDetails.cby,
			// 	actCity: this.state.myActivityDetails.city,
			// 	actPrice: this.state.myActivityDetails.price ? this.state.myActivityDetails.price : '0',
			// 	actIsFree: (this.state.myActivityDetails.price && this.state.myActivityDetails.price > 0) ? false : true,
			// 	actType: (this.state.myActivityDetails.type > 1) ? '竞技类活动' : '群体类活动',
			// 	actId: this.state.myActivityDetails.id,
			// });
		}
	},

	_shareChallenge: function (event) {
		var that = this;
	
		var shareTtp = document.querySelector('#shareTipModal');
		shareTtp.style.display = 'block';
		this.setState({
			shareType: 'challenge',
		}, function () {
			that._fillShare();  
		});
		
	},

	_goActDetailsPage: function () { //?aid=33&oid=5&id=3
		var baseUrl = ToolFactory.changeUrlPath('activity/');
		baseUrl += "details.html";
		baseUrl += "?aid=" + aid;
		baseUrl += "&oid=" + (this.state.myActivityDetails ? this.state.myActivityDetails.oid : '');
		baseUrl += "&type=" + (type ? type : (this.state.myActivityDetails ? this.state.myActivityDetails.type : null));
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
		
		MyActivityDetailsActions.autoSetSignUpData(aid, pid);
		
	},

	// 跳转到我的挑战列表
	_goChallengePage: function () {
		var actName = this.state.myActivityDetails && this.state.myActivityDetails.name;
		var playerBestRank = this.state.myActivityDetails && this.state.myActivityDetails.baseRanking;

		var baseUrl = ToolFactory.getUrlPath(window.location.href);
		baseUrl += 'challengeScore.html?';
		baseUrl += 'pid='+ (global.player ? global.player.id : '');
		baseUrl += '&aid='+ aid;
		baseUrl += '&baseRanking='+ playerBestRank;
		baseUrl += '&actName='+ actName;
		baseUrl += '&oid='+ (actOID ? actOID : (this.state.myActivityDetails ? this.state.myActivityDetails.oid : null));
		baseUrl += '&type='+ (type ? type : (this.state.myActivityDetails ? this.state.myActivityDetails.type : null));

		window.location.href = ToolFactory.checkUrlPath(baseUrl);

	},

	// 进入到我的成绩列表
	_goMyScorePage: function() {

		var baseUrl = ToolFactory.getUrlPath(window.location.href);
		baseUrl += 'myscore.html?';
		baseUrl += 'pid='+ (global.player ? global.player.id : '');
		baseUrl += '&aid='+ aid;
		baseUrl += '&oid='+ (actOID ? actOID : (this.state.myActivityDetails ? this.state.myActivityDetails.oid : null));
		baseUrl += '&type='+ (type ? type : (this.state.myActivityDetails ? this.state.myActivityDetails.type : null));
		
		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},

	// 轮询去检测当前的活动是否提交了成绩
	_loopCheckIsSubmitScore: function () {
		var that = this;
		loopTimer = window.setInterval(function () {
			MyActivityDetailsActions.loopGetActScoreData(pid, aid); // 如果当前活动还没有成绩呢
			
		}, 3000); // 3秒一次去轮询查询当前的成绩是否有了
	},

	_hiddenJoinModal: function (event) {
		// 更新当前活动详情的信息
		// 重新刷新链接
		console.log('当前活动的nPaid 是: ------- ', this.state.nPaid);

		var baseUrl = ToolFactory.getUrlPath(window.location.href);
		baseUrl += 'myactdetails.html'; 
		baseUrl += '?paid=' + this.state.nPaid;
		baseUrl += '&type=' + (type ? type : (this.state.myActivityDetails ? this.state.myActivityDetails.type : null));
		baseUrl += '&aid=' + aid;
		baseUrl += '&oid=' + (actOID ? actOID : (this.state.myActivityDetails ? this.state.myActivityDetails.oid : null));
		baseUrl += '&pid=' + pid;
		baseUrl += '&isPlayed=' + 1;

		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},

	_fillShare: function () {// id: 发起挑战着;id1:被挑战者(报名参加活动的人)；id2:辅导员
		var that = this;

		var shareType = this.state.shareType;
		console.log('打印当前的分享的类型是： ------ ', shareType);
		var baseShareUrl = global.appUrl;
		var shareDesc = '我在参加' + this.state.myActivityDetails.name + ',一起来参加吧！';
		var shareTitle = this.state.myActivityDetails.name;
		var url = null;
		var scShareType = 1;
		switch(shareType) {
			case 'share': 
				
				var baseUrl = ToolFactory.changeUrlPath('activity/');
				baseUrl += 'details.html';
				baseUrl += '?aid='+ aid;
				baseUrl += '&oid=' + (actOID ? actOID : (this.state.myActivityDetails ? this.state.myActivityDetails.oid : null));
				baseUrl += '&type=' + (type ? type : (this.state.myActivityDetails ? this.state.myActivityDetails.type : null));
				baseUrl += '&isShare=1';
				url = ToolFactory.checkUrlPath(baseUrl);
				break;

			case 'challenge':
				scShareType = 2;
				var uname =(global.player ? (global.player.realname ? global.player.realname : global.player.nickname) : '');
				var baseRanking = (that.state.myActivityDetails && that.state.myActivityDetails.baseRanking) ? that.state.myActivityDetails.baseRanking : 0;
				var baseShareUrl = global.appUrl;
				var baseUrl2 = ToolFactory.changeUrlPath('activity/');

				baseUrl2 += "challengeshare.html"
				baseUrl2 += "?aid=" + aid;
				baseUrl2 += "&oid=" + (actOID ? actOID : (this.state.myActivityDetails ? this.state.myActivityDetails.oid : null));
				baseUrl2 += "&type=" + (type ? type : (this.state.myActivityDetails ? this.state.myActivityDetails.type : null));
				baseUrl2 += "&fripid=" + (global.player ? global.player.id : null);
				baseUrl2 += "&friname=" + uname;
				baseUrl2 += "&frisex=" + (global.player ? global.player.sex : null);
				baseUrl2 += "&baseRanking=" + baseRanking;
				url = ToolFactory.checkUrlPath(baseUrl2);
				shareDesc = '我在' + this.state.myActivityDetails.name  + '活动中最好成绩为:' + baseRanking + ',你,敢来挑战吗?!';
				break;
		};
		
		var that = this;
		var shareLogo = (this.state.myActivityDetails && this.state.myActivityDetails.logo) ? this.state.myActivityDetails.logo : global.shareLogo;
		weixin.fillShare({
			title: shareTitle,
			link: url,
			desc: shareDesc,
			imgUrl: shareLogo,
			success: function () {
			
				if (global.player.id) {
				
					//活动转发量神策数据埋点
					sa.track('share', {
						time: new Date(),
						userId: global.player.id,
						actName: that.state.myActivityDetails.name,
						actId: Number(that.state.myActivityDetails.id),
						proName: global.projectName,
					});
				}
			},
			cancel: function () {
				console.log('分享失败！');
			}
		})
	},

	// / 返回上一页
	_goPrevPage: function() {
		history.go(-1);
	}

});

module.exports = MyActivityDetails;