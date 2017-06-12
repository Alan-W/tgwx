var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var weixin = require('../../core/factories/WeixinFactory.js');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');

var prev = ToolFactory.GetQueryString('prev'); // 表示是否是行页面中跳转来的
var fcoach = ToolFactory.GetQueryString('fcoach'); // 表示是辅导员页面中点击进入的

var aid = ToolFactory.GetQueryString('aid');
var type = ToolFactory.GetQueryString('type'); // 活动的类型,1是普通活动,2 是机构活动
var oid = ToolFactory.GetQueryString('oid');
var isShare = ToolFactory.GetQueryString('isShare'); // 表示是从分享出去的

if (parseInt(type == 1)) { // 普通活动
	weixin.setup(function(){
		weixin.enableSharing();
	});
} else if(parseInt(type) == 2) { // 机构活动
	weixin.setup(function(){
		weixin.forbidSharing();
	});
}

// get the acy list actions
var ActivityDetailsActions = Reflux.createActions([
	'getActivityDetails',
	'checkPlayerOidCanPlayThisAct', // 去检测已经验证过身份的用户是否可以玩儿当前的活动
]);


// get the store
var ActivityDetailsStore = Reflux.createStore({
	listenables: [ActivityDetailsActions], // 监听actions
	activityDetails: null,
	playerValidActCheck: true, // 默认当前的用户是不能玩儿此活动的
	onGetActivityDetails: function() {
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
			console.log("ActivityDetailsStore.js-------------onGetActivityDetails:success()", resp);
			if (resp && resp.getActivityDetail && resp.getActivityDetail.success) {
				that.activityDetails = resp.getActivityDetail.data;
				console.log('当前拿的的活动详情是: -- -- -', that.activityDetails);
				that.trigger(that.activityDetails, that.playerValidActCheck);
			}
		})
		.fail(function(e, x, r) {
			console.log("ActivityDetailsStore.js-------------getActDetails:failed()", e);
		});
	},

	// 去检测当前的用户是否可以玩儿当前的活动
	onCheckPlayerOidCanPlayThisAct: function(playerOID, actOID) {

		var that = this;
		
		$.ajax({
			url: 'https://tg-api.taiyuansport.com/',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'playerCheckActivity',
				player_oid: playerOID,
				activity_oid: actOID
			},
		})
		.done(function(resp) {
			console.log("ActivityDetailsStore.js- ----------- onCheckPlayerOidCanPlayThisAct (success)", resp);
			console.log('验证用户是否可以玩儿该活动成功的返回值是: ------- ', resp);
			if (resp && resp.playerCheckActivity) {
				var isPlayed = that.activityDetails ? that.activityDetails.isPlayed : 0; // 用户是否玩儿过该活动
				if (resp.playerCheckActivity.success) { // 验证成功,可以参与该游戏
					that.playerValidActCheck = true; // 当前用户是可以玩儿该活动的

					// 页面直接跳转到提交成绩的页面（机构用户自己提交成绩）
					var baseUrl = ToolFactory.getUrlPath(window.location.href);
					baseUrl += 'orgplayersubmitscore.html?'; // 跳转的是自动提交成绩的页面
					baseUrl += 'aid=' + aid;
					baseUrl += '&oid=' + oid;
					baseUrl += '&type=' + type;
					baseUrl += '&paid=' + (that.activityDetails ? that.activityDetails.paid : 0); // player_activity 的ID
					baseUrl += '&countdown='+ (that.activityDetails ? that.activityDetails.countdown : 0); // 活动的时间
					baseUrl += '&isPlayed=' + isPlayed;
					
					// 代码自动去提交活动的报名信息
					if (isPlayed == 1) { // 不用去提交报名信息
						console.log('用户已经提交了报名信息,只是还没有完成呢!');
						window.location.href = ToolFactory.checkUrlPath(baseUrl) ; // 页面直接跳转到机构用户提交成绩的页面
					} else { // 用户已经至少参与过了
						that.autoSetSignUpData(aid, global.player.id);
					}

				} else {
					that.playerValidActCheck = false; // 当前用户不可以参与该游戏
					that.trigger(that.activityDetails, that.playerValidActCheck);

				};

			}

		})
		.fail(function(e, x, r) {
			console.log("ActivityDetailsStore.js- ----------- onCheckPlayerOidCanPlayThisAct error()", e);
		});

	},

	// 第二次之后玩儿该活动自动提交报名信息
	autoSetSignUpData: function(aid, pid) {
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
				if (resp.setSignUp.success) { // 自动提交活动报名信息成功,这个时候会返回paid
					// 机构活动自动去跳转到提交成绩的页面

					// x新生成的paid
					var paid = resp.setSignUp.data;
					console.log('当前生成的新的paid 是: ----- ',paid);

					if (type == 1) {  // 普通活动,自动报名之后还是会返回此次玩儿家参与活动的paid

						var baseUrl = ToolFactory.changeUrlPath('player/');
						baseUrl += 'myactdetails.html?';
						baseUrl += 'paid=' + paid; // player_activity 的ID 
						baseUrl += '&aid='+aid;
						baseUrl += '&oid='+oid;
						baseUrl += '&type='+type; // 当前活动的类型,不在用oid 来判断了
						baseUrl += '&pid=' + (global.player ? global.player.id : '');
						baseUrl += '&isPlayed=' + 1; // 刚报名的活动该字段的值肯定值1

					} else { // 机构活动

						// var isEnd = that.activityDetails && that.activityDetails.etime * 1000 < Date.parse(new Date()) ? 1 : 0;
						var countdown = that.activityDetails ? that.activityDetails.countdown : 0;
						var baseUrl = ToolFactory.getUrlPath(window.location.href);
						baseUrl += 'orgplayersubmitscore.html?'; // 跳转的是自动提交成绩的页面
						baseUrl += 'aid=' + aid;
						baseUrl += '&oid=' + oid;
						baseUrl += '&type='+type; // 当前活动的类型,不在用oid 来判断了
						baseUrl += '&paid=' + paid; // player_activity 的ID
						baseUrl += '&countdown='+ (that.activityDetails ? that.activityDetails.countdown : 0); // 活动的时间
						baseUrl += '&isPlayed=' + 1;

					};

					// 提交报名统计
					sa.track('click', {
						pageName: global.pageName.page3,
						buttonName:'报名',
						isShare: isShare?true:false,//是否来自(true)分享页面的报名人数
						time: new Date(),
						userId: global.player && (global.player.id).toString(),
						actId: Number(aid),
						proName: global.projectName,
					});
					window.location.href = baseUrl;
				} else { // 自动提交活动的报名信息失败
                    alert('报名信息提交失败');
				}
			}
		})
		.fail(function(e, x, r) {
			console.log("ActivityDetailsStore-- ------ error()", e);
			console.log('自动提交用户报名信息失败的错误是: ------ ', e);
		});
	}
	
})

var ActivityDetails = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(ActivityDetailsStore, 'activityDetails', 'playerValidActCheck')],
	getInitialState: function () {
		return {
			playerInfo: null,
			activityDetails: null,
			player_users: [], // 该活动的辅导员
			isShowLookMore: false, // 辅导员超过两个，是否显示查看更多的按钮
			adminListState: true, // true代表列表是收起的,false代表折叠的
			playerValidActCheck: true, // 默认用户可以参加该活动
			validInfoTxt: '您认证的机构与活动的机构范围不符，请确认您的认证机构', // 错误提示语
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				ActivityDetailsActions.getActivityDetails(aid); // 获取活动详情
			}
			if (isShare) { // 分享出去的打开的页面
				sa.track('$pageview', {
					pageName: global.pageName.page14,
					time: new Date(),
					actId:Number(aid),
					userId: global.player && (global.player.id).toString(),
					proName: global.projectName,
				});
			}
		})
		
	},

	onStatusChange: function (activityDetails, playerValidActCheck) {
		console.log(' 活动列表数据变化之后的返回值是: ------- ', activityDetails);
		var that = this;
		this.setState({
			activityDetails: activityDetails,
			player_users: activityDetails ? activityDetails.player_users : [],
			playerValidActCheck: playerValidActCheck
		}, function() {
			var actDetils = this.state.activityDetails ? this.state.activityDetails.desc : '';
			$('#actDetailsDesc').empty(); // 首先清空，然后在添加
			$('#actDetailsDesc').append(actDetils);
			that.setState({
				isShowLookMore: (that.state.player_users.length > 2) ? true : false, // 超过两个辅导员显示查看更多的按钮
			});
			if (activityDetails) {
				that._fillShare();
			};
			
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听当前活动详情的变化
		this.unsubscribe = ActivityDetailsStore.listen(this.onStatusChange);

		
		
	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		
		var signUpStyle = {
			display : ''
		};
		var isShowShare = {
			display: 'none'
		};
		var showActPlayerUsers = {
			display:  ''
		};
		var showActTag = {
			display:  ''
		};
		var showMoreBtnStyle = {
			display: ''
		};
		var showValidError = {
			display: 'none'
		};
		var showPrevStyle = {
			display: '' 
		};

		var orgLogo = "";
		var orgName = "";
		var showSignUpTxt = '我要报名'; // 玩儿家相对于该活动的状态文字
		var actTime = 0;
		var actPrice = 0;
		
		var playerActStatus = {

			0: (type == 1) ? '我要报名' : '我要参加', // 未参加过该活动
			1: (type == 1) ? '去参赛' : '去参加', // 报名了但是没有完成比赛
			2: '再次参赛' // 已经至少完整的参与过一次该比赛了
		};

		showPrevStyle.display = prev ? 'block' : 'none';

		if (this.state.activityDetails) {
			orgLogo = (this.state.activityDetails.organization && this.state.activityDetails.organization.logo) ? this.state.activityDetails.organization.logo : global.defHeadUrl;
			orgName = (this.state.activityDetails.organization && this.state.activityDetails.organization.name) ? this.state.activityDetails.organization.name : '';
			signUpStyle['display'] = (this.state.activityDetails.etime * 1000 < Date.parse(new Date()) || fcoach) ? 'none' : 'block'; // 已结束的活动或者是从辅导员的渠道点击进入的不显示报名按钮
			actTime = ToolFactory.covertTimeFormat(this.state.activityDetails.stime)+ '-' + ToolFactory.covertTimeFormat(this.state.activityDetails.etime);
			actPrice = (!this.state.activityDetails.price || this.state.activityDetails.price == 0) ? '免费' : this.state.activityDetails.price + '/人';

			// 判断当前活动的类型
			if (type == 1) { // 普通活动

				showActPlayerUsers.display = 'block'; // 显示辅导员信息
				isShowShare.display = 'inline-block'; // 显示分享按钮
				showActTag.display = 'none'; // 不显示机构标签

			} else { // 机构活动

				isShowShare.display = 'none'; // 机构活动不做分享功能
				showActPlayerUsers.display = 'none'; // 机构活动没有辅导员
				showActTag.display = 'block'; // 显示该机构的标签

			};

			showSignUpTxt = (this.state.activityDetails.etime * 1000 > Date.parse(new Date())) ? (playerActStatus[this.state.activityDetails.isPlayed] ? playerActStatus[this.state.activityDetails.isPlayed] : '') : '';

		};

		showValidError.display = this.state.playerValidActCheck ? 'none' : 'block';

		var adminListTxt = this.state.adminListState ? '查看更多' : '收起';
		showMoreBtnStyle.display = this.state.isShowLookMore ? 'block' : 'none';
		var listBorderStyleClass = this.state.adminListState ? 'admin-users-list show-two-state' : 'admin-users-list';

		return (
			<section className="activity-details">
				<div className="head-bar has-arrow has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage} style={showPrevStyle}>
						<span className="back"></span>
					</span>
					<span className="page-title">活动详情</span>
				</div>
				<div className="act-info">
					<h1>{this.state.activityDetails && this.state.activityDetails.name}</h1>
					
					<div className="act-instru">
						<p className="time-joined">
							<span className="act-time">时间:  {actTime}</span>
							<span className="joined-num">{this.state.activityDetails && this.state.activityDetails.count}人已参加</span>
						</p>
						<p className="range">范围:  {this.state.activityDetails && this.state.activityDetails.addr}</p>
						<p className="price">价格:  {actPrice}</p>
					</div>
					<span className="act-tag" style={showActTag}>
						<span className="act-tag-name">{orgName}</span>
					</span>
				</div>
				<div className="act-person">
					<p className="createuser title-bar"><i className="bar-icon"></i><span className="titile-txt">发起人</span></p>
					<p className="promoter flex-container person-info">
						<span className="icon">
							<img src={orgLogo} />
						</span>
						<span className="name"><a href="javascript:void(0)" >{orgName}</a></span>
					</p>
					<div className="act-instructor" style={showActPlayerUsers}>
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
					<span className="tabbar-item  act-share" onClick={this._clickShare} style={isShowShare} data-id="#detailShare">活动分享</span>
					<span className="tabbar-item act-state" style={signUpStyle} onClick={this._goSignUpPage}>{showSignUpTxt}</span>
				</div>
				
				<div className="share-tip" id="detailShare" data-id="#detailShare" onClick={ToolFactory.hiddenShareTip}>
					<img src="../../../assets/img/sharetip.png" data-id="#detailShare" / >
				</div>
				<div className="check-identify" style={showValidError}>
					<div className="valid-content">
						<span className="valid-info">{this.state.validInfoTxt}</span>
					</div>
					<p className="valid-footer" onClick={this._hiddenWarnTipToast}>确定</p>
					<div className="modal-bg" id="modalBg"></div>
				</div>
			</section>
		) 
	},

	/*  /jdioe */
	_initialActUser: function (item, index) {
		var thisAid = this.state.activityDetails.id ? this.state.activityDetails.id : null;

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

	// /click the look more btn to show the whole adminer
	_showMoreAdmin: function () {
		var that = this;
		that.setState({
			adminListState: !that.state.adminListState
		})
	},

	_clickShare: function (event) {
		var shareTip = document.querySelector(event.target.getAttribute('data-id'));
		shareTip.style.display = 'block';
	},

	// 根据活动的状态去报名或者是提示活动结束
	_goSignUpPage: function (event) {
		event.stopPropagation();
		event.preventDefault();

		// 判断活动时间是否过期
		if (this.state.activityDetails.etime * 1000 < Date.parse(new Date())) return false;

		// 判断当前活动是普通活动还是机构活动
		if (type == 1) { // 活动信息中oid 是1 的话代表的是普通活动

			// 判断当前用户信息是否有验证过
			if (global.player && global.player.status == 1) { // 如果验证过(player 中的status 为1 的话就是验证过的)
				
				if (this.state.activityDetails.isPlayed == 1) { // 当前用户已经报名了一次，但是还没有成绩(也就是按钮显示的是"去参赛")

					// 页面直接跳转到我的活动---活动详情的页面, 这个时候活动详情中肯定是有这次没完成的活动的paid
					var baseUrl = ToolFactory.changeUrlPath('player/');
					baseUrl += 'myactdetails.html?';
					baseUrl += 'aid=' + aid;
					baseUrl += '&type=' + type;
					baseUrl += '&oid=' + oid;
					baseUrl += '&pid=' + global.player.id;
					baseUrl += '&paid=' + this.state.activityDetails.paid;
					baseUrl += '&isPlayed=' + 1; // 玩儿家刚报名，该字段的值肯定是1
					window.location.href = baseUrl;

				} else { // isPlayed是0或者是2,用户认证的情况下都是直接跳转到我的活动-活动详情页面中直接参与该活动的

					// 代码自动去提交活动的报名信息，但是页面直接跳转到我的活动-活动详情中
					ActivityDetailsStore.autoSetSignUpData(aid, global.player.id);
				}
				
				
			} else { // 该用户还没有验证过信息, 那么就跳转到报名页面中 status 是0或者是2
				
				// 跳转到报名页面
				var baseUrl = ToolFactory.getUrlPath(window.location.href);
				baseUrl += 'signup.html';
				baseUrl += '?aid=' + aid;
				baseUrl += '&oid=' + oid; // 该活动的oid(在报名页中需要去验证)
				baseUrl += '&type=' + type;
				baseUrl += '&pid=' + (global.player && global.player.id);
				if (isShare) {
					baseUrl += '&isShare=1';
				}
				
				// baseUrl += '&countdown=' + (this.state.activityDetails && this.state.activityDetails.countdown);
				console.log('跳转到报名页面的链接是： ----- ', baseUrl);
				window.location.href = ToolFactory.checkUrlPath(baseUrl);

			}

		} else { // 机构活动
			// 判断用户是否有验证过
			console.log('the player info is: ----- ', global.player);
			if (global.player && global.player.status == 1) { // 如果验证过(player 中的status 为1 的话就是验证过的)
				// 检测验证信息中用户的机构ID 是否可以玩儿当前的活动 
				console.log('当前用户的机构ID 是: ------ ', global.player.oid); // (只有机构活动需要去验证当前的玩儿家是否可以玩耍该游戏)
				ActivityDetailsActions.checkPlayerOidCanPlayThisAct(global.player.oid, oid); // 验证用户是否可以玩儿的时候传用户的oid 和活动所在机构的oid

			} else if (global.player && global.player.status == 0) { // 该用户还没有验证过信息, 那么就跳转到身份验证页面中
				// 不管是哪种类型的活动都去跳转到报名的页面
				var baseUrl = ToolFactory.getUrlPath(window.location.href);
				baseUrl += "signup.html?";
				baseUrl += "aid=" + aid;
				baseUrl += '&type=' + type;
				baseUrl += '&oid=' + oid;
				baseUrl += "&pid=" + global.player.id;
				if (isShare) {
					baseUrl += '&isShare=1';
				}
				// baseUrl += '&countdown=' + (this.state.activityDetails && this.state.activityDetails.countdown);
				window.location.href = ToolFactory.checkUrlPath(baseUrl);
			} else if (global.player && global.player.status == 2) { // 已经验证过,但是该机构用户呗管理人员删除了,不能够再参加机构活动

				// 改状态下提示权限不对
				this.setState({
					playerValidActCheck: false ,
					validInfoTxt: '抱歉,您的权限错误,不能参与该机构活动!',
				})
			}
		};

	},


	// 点击返回上hi及
	_goPrevPage: function () {
		history.go(-1);
	},

	// 验证失败之后点击确定，该提示框消失
	_hiddenWarnTipToast: function() {

		this.setState({
			playerValidActCheck: true
		});
	},
	/**/

	// /weixni share
	_fillShare: function () {
		var baseShareUrl = global.appUrl;
		var baseUrl = ToolFactory.getUrlPath(window.location.pathname);
		baseUrl += "details.html"
		baseUrl += "?aid=" + aid;
		baseUrl += "&oid=" + oid;
		baseUrl += "&type=" + type;
		baseUrl += "&isShare=1"; // 表示是分享出去的
		var shareUrl = ToolFactory.checkUrlPath(baseShareUrl + baseUrl);
		var shareDesc = '我在参加' + this.state.activityDetails.name + '活动, 一起来吧！';
		// console.log('打印当前用户分享的描述是：－－－－－　', shareDesc);

		var that = this;
		var shareLogo = (this.state.activityDetails && this.state.activityDetails.logo) ? this.state.activityDetails.logo : global.shareLogo;
		weixin.fillShare({
			title: that.state.activityDetails.name,
			link: shareUrl,
			desc: shareDesc,
			imgUrl: shareLogo,
			success: function () {

				if (global.player.id) {
 					//活动转发量神策数据埋点
		 			sa.track('share', {
						userId: global.player.id,
						actName: that.state.activityDetails.name,
						actId: Number(that.state.activityDetails.id),
						proName: global.projectName,
					});
				}

			},
			cancel: function () {
				console.log('取消分享！');
			}
		})
	}


});

module.exports = ActivityDetails;