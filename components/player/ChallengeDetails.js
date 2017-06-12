var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var weixin = require('../../core/factories/WeixinFactory.js');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');

weixin.setup(function(){
	weixin.enableSharing();
});

var aid = ToolFactory.GetQueryString('aid');
var actOID = ToolFactory.GetQueryString('oid');
var type = ToolFactory.GetQueryString('type');

// get the acy list actions
var ChallengeDetailsActions = Reflux.createActions([
	'getChallengeDetails',
]);


// get the store
var ChallengeDetailsStore = Reflux.createStore({
	listenables: [ChallengeDetailsActions], // 监听actions
	challengeDetails: null,
	onGetChallengeDetails: function() {
		var that = this;
		$.ajax({
			url: 'https://tg-api.taiyuansport.com/',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'getActivityDetail',
				aid: aid,
				player_id: global.player.id, // 当前玩儿家的ID
			},
		})
		.done(function(resp) {
			console.log("challengeDetailsStore.js-------------onGetchallengeDetails:success()", resp);
			if (resp && resp.getActivityDetail && resp.getActivityDetail.success) {
				that.challengeDetails = resp.getActivityDetail.data;
				console.log('当前拿的的活动详情是: -- -- -', that.challengeDetails);
				that.trigger(that.challengeDetails);
			}
		})
		.fail(function(e, x, r) {
			console.log("ChallengeDetailsStore.js-------------getActDetails:failed()", e);
		});
	},
})

var ChallengeDetails = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(ChallengeDetailsStore, 'challengeDetails')],
	getInitialState: function () {
		return {
			playerInfo: null,
			challengeDetails: null,
			player_users: [], // 该活动的辅导员
			isShowLookMore: false, // 辅导员超过两个，是否显示查看更多的按钮
			adminListState: true, // true代表列表是收起的,false代表折叠的
			shareType: 'share',
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				ChallengeDetailsActions.getChallengeDetails(aid); // 获取活动详情
			}
		})
		
	},

	onStatusChange: function (challengeDetails) {
		console.log(' 活动列表数据变化之后的返回值是: ------- ', challengeDetails);
		var that = this;
		this.setState({
			challengeDetails: challengeDetails,
			player_users: challengeDetails ? challengeDetails.player_users : [],
		}, function() {
			var actDetils = this.state.challengeDetails ? this.state.challengeDetails.desc : '';
			$('#actDetailsDesc').empty(); // 首先清空，然后在添加
			$('#actDetailsDesc').append(actDetils);
			that.setState({
				isShowLookMore: (that.state.player_users.length > 2) ? true : false, // 超过两个辅导员显示查看更多的按钮
			});
			if (challengeDetails) {
				that._fillShare();
			}
			
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听当前活动详情的变化
		this.unsubscribe = ChallengeDetailsStore.listen(this.onStatusChange);
	},

	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		
		
		var showActTag = {
			display:  ''
		};
		var showMoreBtnStyle = {
			display: ''
		};
		
		var orgLogo = "";
		var orgName = "";
		var actTime = 0;
		var actPrice = 0;

		if (this.state.challengeDetails) {
			orgLogo = (this.state.challengeDetails.organization && this.state.challengeDetails.organization.logo) ? this.state.challengeDetails.organization.logo : global.defHeadUrl;
			orgName = (this.state.challengeDetails.organization && this.state.challengeDetails.organization.name) ? this.state.challengeDetails.organization.name : '';
			actTime = ToolFactory.covertTimeFormat(this.state.challengeDetails.stime)+ '-' + ToolFactory.covertTimeFormat(this.state.challengeDetails.etime);
			actPrice = (!this.state.challengeDetails.price || this.state.challengeDetails.price == 0) ? '免费' : this.state.challengeDetails.price + '/人';
		};

		var adminListTxt = this.state.adminListState ? '查看更多' : '收起';
		showMoreBtnStyle.display = this.state.isShowLookMore ? 'block' : 'none';
		var listBorderStyleClass = this.state.adminListState ? 'admin-users-list show-two-state' : 'admin-users-list';

		return (
			<section className="activity-details">
				<div className="head-bar has-arrow has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage}>
						<span className="back"></span>
					</span>
					<span className="page-title">活动详情</span>
				</div>
				<div className="act-info">
					<h1>{this.state.challengeDetails && this.state.challengeDetails.name}</h1>
					
					<div className="act-instru">
						<p className="time-joined">
							<span className="act-time">时间:  {actTime}</span>
							<span className="joined-num">{this.state.challengeDetails && this.state.challengeDetails.count}人已参加</span>
						</p>
						<p className="range">范围:  {this.state.challengeDetails && this.state.challengeDetails.addr}</p>
						<p className="price">价格:  {actPrice}</p>
					</div>
				</div>
				<div className="challen-info">
					<p className="fp">我的最佳成绩
						<span className="my-best-score"> {this.state.challengeDetails && this.state.challengeDetails.baseRanking} </span>
					</p>
					<p className="sp">活动最佳成绩 
						<span className="act-best-score"> {this.state.challengeDetails && this.state.challengeDetails.highestRanking} </span>
					</p>
				</div>
				<div className="act-person">
					<p className="createuser title-bar"><i className="bar-icon"></i><span className="titile-txt">发起人</span></p>
					<p className="promoter flex-container person-info">
						<span className="icon">
							<img src={orgLogo} />
						</span>
						<span className="name"><a href="javascript:void(0)" >{orgName}</a></span>
					</p>
					<div className="act-instructor" >
						<p className="createuser title-bar"><i className="bar-icon"></i><span className="titile-txt">辅导员</span></p>
						<div className={listBorderStyleClass}>
							{
								this.state.player_users.map(this._initialActUser)
							}
						</div>
						
						<p className="show-more-admin" onClick={this._showMoreAdmin} style={showMoreBtnStyle}> {adminListTxt} </p>
					</div>
				</div>
				<article className="weui_article">
					<p className="createuser title-bar"><i className="bar-icon"></i><span className="titile-txt">活动详情</span></p>
						<div className="act-desc-details" id="actDetailsDesc">
					</div>
				</article>
				<div className="footer-tabbar flex-container">
					<span className="tabbar-item  act-share" onClick={this._shareActDetails} data-id="#detailShare">活动分享</span>
					<span className="tabbar-item act-state" onClick={this._shareChallenge}>我要挑战</span>
				</div>
				
				<div className="share-tip" id="detailShare" data-id="#detailShare" onClick={ToolFactory.hiddenShareTip}>
					<img src="../../../assets/img/sharetip.png" data-id="#detailShare" / >
				</div>
				
			</section>
		) 
	},

	/*  初始化辅导员的列表 */
	_initialActUser: function (item, index) {
		var thisAid = this.state.challengeDetails.id ? this.state.challengeDetails.id : null;

		var hideMoreTwoUser = {
			display: '',
		};

		hideMoreTwoUser.display = (index > 1 && this.state.adminListState) ? 'none' : ''; // 隐藏超过两个以上的辅导员
		return (
			<div className="promoter flex-container person-info admin-user" key={index} style = {hideMoreTwoUser}>
				<span className="icon">
					<img src={(item && item.headimgurl) ? item.headimgurl : global.defHeadUrl} />
				</span>
				<p className="insru-info-wrap flex-container">
					<span className="name">
						{(item && item.realname) ? item.realname : ""}
					</span>
				</p>
			</div>
		)
	},

	// /click the look more btn to show the whole admin
	_showMoreAdmin: function () {
		var that = this;
		that.setState({
			adminListState: !that.state.adminListState
		})
	},

	_shareActDetails: function (event) {
		var that = this;
		
		var shareTtp = document.querySelector('#detailShare');
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
	
		var shareTtp = document.querySelector('#detailShare');
		shareTtp.style.display = 'block';
		this.setState({
			shareType: 'challenge',
		}, function () {
			that._fillShare();  
		});
		
	},

	// 点击返回上hi及
	_goPrevPage: function () {
		history.go(-1);
	},

	// weixni share
	_fillShare: function () {
		var that = this;

		var shareType = this.state.shareType;
		console.log('打印当前的分享的类型是： ------ ', shareType);
		var baseShareUrl = global.appUrl;
		var shareDesc = '我在参加' + this.state.challengeDetails.name + ',一起来参加吧！';
		var shareTitle = this.state.challengeDetails.name;
		var url = null;
		var scShareType = 1;
		switch(shareType) {
			case 'share': 
				
				var baseUrl = ToolFactory.changeUrlPath('activity/');
				baseUrl += 'details.html';
				baseUrl += '?aid='+ aid;
				baseUrl += '&oid=' + actOID;
				baseUrl += '&type=1';
				baseUrl += '&isShare=1';
				url = ToolFactory.checkUrlPath(baseUrl);
				break;

			case 'challenge':
				scShareType = 2;
				var uname =(global.player ? (global.player.realname ? global.player.realname : global.player.nickname) : '');
				var baseUrl2 = ToolFactory.changeUrlPath('activity/');
				var myBestScore = (this.state.challengeDetails && this.state.challengeDetails.baseRanking) ? this.state.challengeDetails.baseRanking : 0;
				baseUrl2 += "challengeshare.html"
				baseUrl2 += "?aid=" + aid;
				baseUrl2 += "&oid=" + actOID;
				baseUrl2 += "&type=1";
				baseUrl2 += "&fripid=" + (global.player ? global.player.id : null);
				baseUrl2 += "&friname=" + uname;
				baseUrl2 += "&frisex=" + (global.player ? global.player.sex : null);
				baseUrl2 += "&baseRanking=" + myBestScore;
				url = ToolFactory.checkUrlPath(baseUrl2);
				shareDesc = '我在' + this.state.challengeDetails.name  + '活动中最好成绩为:' + myBestScore + ',你,敢来挑战吗?!';
				break;
		};
		
		var that = this;
		var shareLogo = (this.state.challengeDetails && this.state.challengeDetails.logo) ? this.state.challengeDetails.logo : global.shareLogo;
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
						userId: (global.player.id).toString(),
						actName: that.state.challengeDetails.name,
						actId: Number(that.state.challengeDetails.id),
						proName: global.projectName,
					});
				}
			},
			cancel: function () {
				console.log('分享失败！');
			}
		})
	}


});

module.exports = ChallengeDetails;