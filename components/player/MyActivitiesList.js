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

var prev = ToolFactory.GetQueryString('prev'); // 这个参数用来区别该页面是从个人中心还是从服务号的页面跳转过来的

// action
var MyActivitiesListActions = Reflux.createActions([
	'getMyActivitiesList'
]);

var counter = 0;
var num = 10;
var pageStart = 0;
var pageEnd = 0;

// store
var MyActivitiesListStore = Reflux.createStore({
	myActsList: [],
	listenables: [MyActivitiesListActions],
	onGetMyActivitiesList: function() {
		console.log('获取我的活动中玩儿家的信息是: ----- ', global.player.uid);
		var that = this;
		var offset = that.myActsList.length;
		if (document.getElementById('dropList')) {
			$('#dropList').dropload({
				scrollArea: window,
				loadDownFn: function (me) {
					$.ajax({
						url: global.apiUrl + 'index.php',
						type: 'GET',
						data: {
							r: 'activity/static',
							expand: 'getMyActivitys',
							player_id: (global.player ? global.player.id : null),
							offset: offset,
							limit: 10,
						},
					})
					.done(function(resp) {
						counter++;
						pageEnd = num * counter;
						pageStart = pageEnd - num;
						console.log("MyActivitiesListStore.js-----------onGetMyActivitiesList:success()", resp);
						if (resp && resp.getMyActivitys && resp.getMyActivitys.data) {
							var respLen = resp.getMyActivitys.data.length;
							if (respLen < 10) { // 若返回的数据少于10个则停止加载
								me.lock();
								me.noData();
							}
						};

						that.myActsList = that.myActsList.concat(resp.getMyActivitys.data);
						console.log('MyActivitiesListStore.js重置完我的活动列表的数据是：--------', that.myActsList);
						offset = that.myActsList.length;
						that.trigger(that.myActsList);
						// 每次加载完必须重置
						me.resetload();
					})
					.fail(function(e, x, r) {
						console.log("MyActivitiesListStore.js-----------onGetMyActivitiesList:failed()", e);
						// 即使请求失败也是重新加载数据
						me.resetload();
						that.trigger(that.myActsList);
					});
				}
			})
		}
		
	}
})

var MyActivitiesList = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(MyActivitiesListStore, 'myActsList')],
	getInitialState: function () {
		return {
			playerInfo: null,
			myActsList: [],
			showPlayerTip: false,
			actShowState: 0, // 当前的选择显示项,默认的0显示全部
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				MyActivitiesListActions.getMyActivitiesList()
			}
		})
		
	},

	onMyActsDataChange: function(myActsList) {
		this.setState({
			myActsList: myActsList 
		}, function() {
			console.log('获取到的我的活动的数据时: ----- ', myActsList);
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听我的活动的数据的变化
		this.unsubscribe = MyActivitiesListStore.listen(this.onMyActsDataChange);

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		var playerActTip = {
			display: '',
		};
		var showPrevArrow = {
			display: ''
		};
		playerActTip.display = this.state.showPlayerTip ? 'block' : 'none';
		showPrevArrow.display = prev ? 'block' : 'none';
		return(
			<section className="my-acts">
				<div className="head-bar has-arrow has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage} style={showPrevArrow}>
						<span className="back"></span>
					</span>
					<span className="page-title">我的活动</span>
				</div>
				<div className="tabbar act-choose-bar">
					<div className="bar-wrap flex-container">
						<span className="tab-item tab-item-on" onClick={this._changeActShow} data-state="0">全部</span>
						<span className="tab-item"  onClick={this._changeActShow} data-state="1">已报名</span>
						<span className="tab-item"  onClick={this._changeActShow} data-state="2">已参加</span>
						<span className="tab-item"  onClick={this._changeActShow} data-state="3">已结束</span>
					</div>
				</div>
				<div className="act-list-wrapper" id="dropList">
					<div id="">
						<ul className="act-list">
							{
								this.state.myActsList.map(this._initialMyActsList)
							}
						</ul>
					</div>
				</div>
				<div className="act-end-tip" id="playerActStateTip" style={playerActTip}>
					<p className="weui_toast_content">抱歉,该活动未完成</p>
					<p className="weui_toast_content second">活动已结束!</p>
				</div>
			</section>
		)
	},

	// / 初始话我的活动列表ITEM
	_initialMyActsList: function (items, index) {
		var joinedStyle = {
			display: ''
		};
		var signupedStyle = {
			display: ''
		};
		var endStyle = {
			display: ''
		};

		// 当前活动的状态
		var thisActState = items ? parseInt(items.played) : 0;
		if (items) { // 如果activity时初始化列表
			
			if (!items.etime || parseInt(items.etime) * 1000 < Date.parse(new Date())) { // 活动时间已经过期了
				signupedStyle['display'] = 'none';
				joinedStyle['display'] = 'none';
				if (parseInt(items.played) < 2) { // 报名了,但是还没完成活动就已经过期了
					endStyle.display = 'block';
					thisActState = 3;
				} else { // 已经参加过的活动过期了
					endStyle.display = 'none';
					joinedStyle['display'] = 'block';
				}
			} else { // 活动还没结束
				endStyle['display'] = 'none';
				joinedStyle['display'] = parseInt(items.played) > 1 ? 'block' : 'none';
				signupedStyle['display'] = parseInt(items.played) > 1 ? 'none' : 'block';
				
			};

			// 通过tab 显示当前的活动
			var showItemStyle = {
				display: ''
			};

			var showOrgTag = {
				display: ''
			};

			showItemStyle.display = (this.state.actShowState == 0 || thisActState == this.state.actShowState) ? '' : 'none';
			showOrgTag['display'] = items.type == 1 ? 'none' : 'block'; // oid 是1 的代表普通活动

			return (
				<li className="list-item flex-container"  key={index} onClick ={this._goThisActDetails} style={showItemStyle} data-paid={items.paid}>
					<div className="act-logo flex-container">
						<img src ={items.logo ? items.logo : global.defHeadUrl} alt="活动头像" title="活动头像" />
					</div>
					<div className="act-detail">
						<span className="act-name">{items.name ? items.name : ''}</span>
						<p className="price-time">
							<span className="act-price">{(!items.price || items.price == 0) ? '免费' : items.price + '/人'}</span>
						</p>
						<p className="my-act-state">
							<span className="act-state-btn act-online act-has-joined" style={joinedStyle}>已参加</span>
							<span className="act-state-btn act-online act-has-signuped" style={signupedStyle} >已报名</span>
							<span className="act-state-btn act-offline act-has-ended" style={endStyle} >已结束</span>
						</p>
					</div>
					<span className="act-tag" style={showOrgTag}>
					<span className="act-tag-name">{items.organization_name ? items.organization_name : ''}</span>
				</span>
				</li>
			)
		}
	},

	// /点击获取具体活动的详情信息
	_getActDetailInfo: function(paid) {
		var list = this.state.myActsList;
		var actDetails = null;
		for (var i = 0; i < list.length; i++) {
			var item  = list[i];
			if (item.paid == paid) {
				actDetails = item;
				break;
			}
		};
		return actDetails;
	},

	// 点击切换显示
	_changeActShow: function(event) {
		var state = parseInt(event.target.getAttribute('data-state'));
		console.log('当前点击选项卡的状态是--- ---- ', state);
		$('.tab-item-on').removeClass('tab-item-on');
		$(event.target).addClass('tab-item-on');
		this.setState({
			actShowState: state
		})
	},

	// / 获取活动详情
	_goThisActDetails: function (event) {
		var domTarget = event.target.nodeName.toUpperCase() == 'LI' ? $(event.target) : $(event.target).parents('li')[0];
		var paID = parseInt($(domTarget).attr('data-paid'));
		console.log('当前点击的活动ID 是; ------ ', paID);
		var thisActDetails = this._getActDetailInfo(paID);
		console.log('当前点击的活动详情数据时;------- ', thisActDetails);

		var that = this;
		// 判断当前的活动是否已经结束了
		var isEnd = thisActDetails.etime;
		var played = thisActDetails.played;
		if (played < 2 && thisActDetails.etime * 1000 < Date.parse(new Date())) { // 该活动已经报名但是活动却过期了
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
		
		var oid = thisActDetails.oid;
		var paid = thisActDetails.paid;
		var activityID = thisActDetails.id;
		var type = thisActDetails.type;
		var countdown = thisActDetails.countdown;
		
		var baseUrl = '';

		if (parseInt(type) == 1) {
			baseUrl = ToolFactory.getUrlPath(window.location.href);
			baseUrl += "myactdetails.html";
			baseUrl += "?aid=" + activityID;
			baseUrl += "&oid=" +oid;
			baseUrl += "&type=" + type;
			baseUrl += "&paid=" + thisActDetails.paid;
			baseUrl += "&pid=" + (global.player ? global.player.id : null);
			baseUrl += "&isPlayed=" + played; // 玩儿家参与活动的状态

		} else if (parseInt(type) == 2) {
			console.log(' 用户参与活动的状态是: ------- ', played);
			if (played == 1) { // 报名
				baseUrl = ToolFactory.changeUrlPath('activity/');
				baseUrl += 'orgplayersubmitscore.html?'; // 跳转的是自动提交成绩的页面
				baseUrl += 'aid=' + activityID;
				baseUrl += '&oid=' + oid;
				baseUrl += '&type=' + type;
				baseUrl += '&paid=' + paid; // player_activity 的ID
				baseUrl += '&countdown='+ countdown; // 活动的时间
				baseUrl += '&isPlayed=' + 1;
					
			} else { // 参与了
				baseUrl = ToolFactory.getUrlPath(window.location.href);
				baseUrl += "myorgactdetails.html";
				baseUrl += "?aid=" + activityID;
				baseUrl += "&oid=" +oid;
				baseUrl += "&type=" + type;
				baseUrl += "&paid=" + thisActDetails.paid;
				baseUrl += "&pid=" + (global.player ? global.player.id : null);
				baseUrl += "&isPlayed=" + played; // 玩儿家参与活动的状态
			}
			
		}
		
		console.log('当前要跳转的URL 是、： ----- ', baseUrl);
		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},

	// / 返回上一页
	_goPrevPage: function() {
		history.go(-1);
	}

});

module.exports = MyActivitiesList;