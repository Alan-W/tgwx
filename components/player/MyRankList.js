var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var OrgsList = require('../../core/components/OrgsList.js');
var OrgDataActions = require('../../core/actions/OrgDataActions.js');
var OrgDataStore = require('../../core/factories/OrgDataStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var global = require('../../core/factories/GlobalFactory');
var weixin = require('../../core/factories/WeixinFactory.js');
var $ = require('jquery');

var pid = ToolFactory.GetQueryString('pid');
var paid = ToolFactory.GetQueryString('paid')?ToolFactory.GetQueryString('paid'):null;
var backAid = ToolFactory.GetQueryString('aid');
var backOid = ToolFactory.GetQueryString('oid');
var backType = ToolFactory.GetQueryString('type');
var from = ToolFactory.GetQueryString('from');
var hideBtn = ToolFactory.GetQueryString('hideBtn');

// action
var MyRankListActions = Reflux.createActions([
	'getMyRankList',
	'getActsList',
]);

weixin.setup(function() {
	weixin.enableSharing();
});

var counter = 0;
var num = 5;
var pageStart = 0;
var pageEnd = 0;

// store
var MyRankListStore = Reflux.createStore({
	myRankList: [],
	resultList: [],
	myResult: null,
	actsList:[],
	actName:'',
	actId:'',
	mydropObj: null,//下拉加载对象
	listenables: [MyRankListActions],
	onGetMyRankList: function(aid, oid , paid, first) {
		var that = this;
		console.log(' the first is : ----- ', first);
		if(first){
	        console.log("有aid或者oid");
	        that.resultList = [];
	        counter = 0;
			num = 5;
			pageStart = 0;
			pageEnd = 0;
			$('#dropList').find('.dropload-down').first().remove();
	    }
		if(document.getElementById('dropList')){
			$('#dropList').dropload({
				scrollArea: window,
				loadDownFn: function (me) {
					console.log("触发下拉");
					that.myselfdrop = me;
					that.myloadDownFn(aid, oid , paid, first);
				}
			})
		}
	},
	myloadDownFn:function(aid, oid , paid, first){//first 为 true 是切换活动或者机构第一次请求
		console.log("actId---",aid,"orgId---",oid,"paid----",paid,"first----",first);
		var that = this;
		var me = that.myselfdrop;
		var offset = that.resultList.length;
		var data = {
			r: 'activity/static',
			expand: 'getPlayerRankings',
			player_id: pid,
			offset: offset,
			limit: 5,
		};
		if (aid) data.aid = aid;
		if (oid) data.oid = oid;
		if (paid) data.paid = paid;
		console.log("ajax请求参数-----",data);
		$.ajax({
			url: global.apiUrl+ 'index.php',
			type: 'GET',
			data: data,
		})
		.done(function(resp) {
			counter++;
			pageEnd = num * counter;
			pageStart = pageEnd - num;
			console.log("页面加载完排行列表的数据成功-----------getMyRanks:success()", resp);
			if (resp && resp.getPlayerRankings && resp.getPlayerRankings.data) {
				that.actName = 	resp.getPlayerRankings.data.activity.name;
				that.actId = resp.getPlayerRankings.data.activity.id;
				if(resp.getPlayerRankings.data.index){
					that.myResult = resp.getPlayerRankings.data.index;
				}else{
					that.myResult = null;
				}
				if(resp.getPlayerRankings.data.orders){
					var respLen = resp.getPlayerRankings.data.orders.length;
					if (respLen < 5) { // 若返回的数据少于10个则停止加载
						me.lock();
						me.noData();
					}
					that.resultList = that.resultList.concat(resp.getPlayerRankings.data.orders);
					offset = that.resultList.length;
					// 删除整个列表中没有机构的人
					that.myRankList = that._formatRnkList(that.resultList.slice());
				}else{
					that.resultList = [];
					offset = 0;
				}
				// 每次加载完必须重置
				me.resetload();
				that.trigger(that.myRankList, that.myResult, that.actsList,that.actName,that.actId);
			};
		})
		.fail(function(e, x, r) {
			console.log("页面加载完排行列表的数据成功-----------getMyacts:failed()", e);
			// 即使请求失败也是重新加载数据
			me.resetload();
			that.trigger(that.myRankList, that.myResult, that.actsList,that.actName,that.actId);
		});
	},

	_formatRnkList: function(dataList) {
		var data = dataList;
		for (var i = 0; i < data.length; i++) {
			var d = data[i];
			if (!(d.player) || !(d.player.realname)) { //该用户已经被删除了
				data.splice(i, 1);
			};
		};

		return data;

	},
	onGetActsList:function(){
		var that = this;
		//https://tg-api.taiyuansport.com/?r=activity/static&expand=getPlayedActivity&player_id=1
		$.ajax({
			url: global.apiUrl+ 'index.php',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'getPlayedActivity',
				player_id: pid,
			},
		})
		.done(function(resp) {
			console.log("页面加载完请求活动列表的数据成功-----------getMyacts:success()", resp);
			if (resp && resp.getPlayedActivity && resp.getPlayedActivity.data) {
				that.actsList = resp.getPlayedActivity.data;
				that.trigger(that.myRankList, that.myResult, that.actsList,that.actName,that.actId);
			};
		})
		.fail(function(e, x, r) {
			console.log("MyRankListStore.js-----------getMyacts:failed()", e);
			that.trigger(that.myRankList, that.myResult, that.actsList,that.actName,that.actId);
		});
	},
})

var MyRankList = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(MyRankListStore, 'myRankList','myResult','actsList','actName','actId')],
	getInitialState: function () {
		return {
			playerInfo: null,
			myRankList: [],
			myResult:null,
			actsList:[],
			actName:'',
			actId:'',
			activityArray:[],//所有的活动列表数据
			curOrgId: 0, // 初始化默认的是无机构的ID （1）（记住如果是无机构的,那么oid 是0,其它的机构oid 都不是0）
			curOrgName: '无机构', // 默认进来的机构名称是无机构
			curSelectOrgObj: null, // 当前选中的击缶信息
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		var that = this;
		console.log('用户的个人信息the playerInfo is: ----- ', playerInfo);
		this.setState({
			playerInfo: playerInfo,
			curOrgId:  (playerInfo.oid &&  playerInfo.oid == 0) ? 0 :  playerInfo.oid, // 当前用户所在的机构
			curOrgName: playerInfo.organization_name ? playerInfo.organization_name : '无机构', // 当前用户所在的机构的名称, 
		}, function() {
			if (playerInfo) {
				MyRankListActions.getActsList();
				MyRankListActions.getMyRankList("","",paid,false);
				that._fillShare();
			}
		})	
	},
	// 选中的机构信息变换
	onSelectOrgStatusChange: function ([], curSelectOrgObj) {
		var that = this;
		this.setState({
			curSelectOrgObj: curSelectOrgObj,
			myRankList: [],
		}, function() {
			if (curSelectOrgObj) {
				that.setState({
					curOrgId: (curSelectOrgObj && curSelectOrgObj.id) ? curSelectOrgObj.id : 0,
					curOrgName: (curSelectOrgObj && curSelectOrgObj.name) ? curSelectOrgObj.name : '无机构',
				}, function() {
					var actId = document.getElementById('actData').getAttribute('data-act-id');
					MyRankListActions.getMyRankList(actId,that.state.curOrgId,paid,true);
					// MyRankListStore.myloadDownFn(actId,that.state.curOrgId,paid,true);
				})
			}
		})
	},
	onMyRankListsDataChange: function(myRankList, myResult, actsList, actName, actId) {
		this.setState({
			myRankList: myRankList,
			myResult: myResult,
			actsList: actsList,//当前的活动列表数据
			actName: actName,
			actId: actId,
		}, function() {
			//console.log('获取到的我的活动的数据时: ----- ', myRankList);
		})
	},
	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);
		// 去获取所有的机构数据
		this.unsubscribe = OrgDataStore.listen(this.onSelectOrgStatusChange);
		// 监听我的活动的数据的变化
		this.unsubscribe = MyRankListStore.listen(this.onMyRankListsDataChange);

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		var noRankStyle = null,tabbarStyle = null, orgStyle = null, hideStyle = null;
		if(this.state.actsList.length == 0){
			tabbarStyle = {
				"display":"none",
			}
			noRankStyle = {
				"display":"block",
			}
		}else{
			tabbarStyle = {
				"display":"block",
			}
			noRankStyle = {
				"display":"none",
			}	
		}
		if(this.state.curOrgId == 0){
			orgStyle = {
				"display":"none",
			}
		}else{
			orgStyle = {
				"display":"block",
			}	
		}
		if(hideBtn){
			hideStyle = {
				"display":"none",
			}
		}else{
			hideStyle = {
				"display":"block",
			}
		}
		if(this.state.actName.length > 10){
			this.state.actName = this.state.actName.toString().substr(0,10)+"...";
		}
		if(this.state.curOrgName.length > 10){
			this.state.curOrgName = this.state.curOrgName.toString().substr(0,10)+"...";
		}
		return(
			<section className="my-ranks">
				<div className="head-bar has-arrow has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage} style={hideStyle}>
						<span className="back"></span>
					</span>
					<span className="page-title">排行榜</span>
				</div>
				<div className="img-wrap">
					<img src="../../assets/img/banner.png"/>
				</div>
				<div className="tabbar act-choose-bar" style={tabbarStyle}>
					<div className="bar-wrap flex-container">
						<span className="tab-item tab-item-on" id="showActsList" onClick={this._showActSelectList}><span id="actData" data-act-id={this.state.actId}>{this.state.actName}</span><img src="../../assets/img/select.png"/></span>
						<span className="tab-item" style={orgStyle} id="showOrgsList" onClick={this._showOrgSelectList} ><span id="orgData" data-oid={this.state.curOrgId}>{this.state.curOrgName}</span><img src="../../assets/img/noselect.png"/></span>
					</div>	
				</div>
				<div className="rank-list-wrapper">
					<div className="myRank">
						{this._initMyResult()}
					</div>
					<div  id="dropList">
						<ul className="rank-list">
							{
								this.state.myRankList.map(this._initialMyRankList)
							}
						</ul>	
					</div>
				</div>
				<div className="act-choose-modal act-select choose-modal">
					<div className="modal-bg" onClick={this._hideChooseModal}></div>
					<div className="choose-wrap">
						{this.state.actsList.map(this._initActsList)}
					</div>
				</div>
				<OrgsList />
				<div className="noRank" style={noRankStyle}>你未参加任何活动！！！</div>
			</section>
			
		)
	},
	_initMyResult:function(){
		var colorStyle = {
			color:'#4cd760'
		};
		if(this.state.myResult){
			if(this.state.myResult.player.organization_name.length > 11){
				this.state.myResult.player.organization_name = this.state.myResult.player.organization_name.toString().substr(0,11)+"...";
			}else{
				this.state.myResult.player.organization_name = this.state.myResult.player.organization_name;
			}
			return(
				<ul>
					<li>
						<div className="rank-item listLeft">{this.state.myResult.order}</div>
						<div className="rank-item listCenter">
							<div className="headImg">
								<img src={this.state.myResult.player.headimgurl ? this.state.myResult.player.headimgurl:global.defHeadUrl}/>
							</div>
							<div className="rankDetail">
								<h6>{this.state.myResult.player.realname ? this.state.myResult.player.realname:""}</h6>
								<p><span>{ToolFactory.covertTimeFormat(this.state.myResult.ctime)}</span><span>{this.state.myResult.player.organization_name}</span></p>
							</div>
						</div>
						<div className="rank-item listRight">
							<span style={colorStyle}>{this.state.myResult.result.toString().substr(0,4)}</span>个
						</div>
					</li>
				</ul>
			)
		}
	},
	// / 初始话我的排行列表ITEM
	_initialMyRankList: function (items, index) {
		var colorStyle = {};
		if(index == 0){
			colorStyle = {
				color:'#ff7e7f'
			};
		}else{
			colorStyle = {
				color:'#202020'
			};
		}
		var hideStyle = {};
		if(items.player && items.player.organization_name){
			var organization_name;
			if(items.player.organization_name.length > 11){
				organization_name = items.player.organization_name.toString().substr(0,11)+"...";
			}else{
				organization_name = items.player.organization_name;
			}
			hideStyle = {
				display:'block'
			};
		}else if(!(items.player) || !(items.player.realname)){
			console.log("隐藏-----");
			hideStyle = {
				display:'none'
			};
		}
		return (
			<li key={index} style={hideStyle}>
				<div className="rank-item listLeft">{index+1}</div>
				<div className="rank-item listCenter">
					<div className="headImg">
						<img src={(items.player&&items.player.headimgurl)?items.player.headimgurl:global.defHeadUrl}/>
					</div>
					<div className="rankDetail">
						<h6>{(items.player && items.player.realname)?items.player.realname:"未知"}</h6>
						<p><span>{ToolFactory.covertTimeFormat(items.ctime)}</span><span>{organization_name}</span></p>
					</div>
				</div>
				<div className="rank-item listRight">
					<span style={colorStyle}>{items.result.toString().substr(0,4)}</span>个
				</div>
			</li>
		);
	},
	// 显示活动选择的下拉列表
	_showActSelectList:function(){
		$("#showActsList").addClass("tab-item-on").siblings("span").removeClass("tab-item-on");
		$("#showActsList").children('img').attr("src","../../assets/img/select.png").parent("span").siblings('span').children('img').attr("src","../../assets/img/noselect.png");
		$('.act-choose-modal').addClass('show-modal');
		setTimeout(function() {
			$('.act-choose-modal').addClass('active-modal');
		}, 100);
	},
	_initActsList:function(item, index){
		return(
			<p className="choose-item" key={index} data-act-id={item.id} data-act-type={item.type} onClick={this._chooseActItem}>{item.name}</p>
		)
	},
	// /点击选择活动数据
	_chooseActItem: function(event) {
		var that = this;
		var actId = parseInt(event.target.getAttribute('data-act-id'));
		var actType = parseInt(event.target.getAttribute('data-act-type'));
		that.setState({
			actName: $(event.target).html(),
			actId: actId,
			myRankList: [],
		});
		if(actType == 1){
			this.setState({
				curOrgId: 0 , // 当前用户所在的机构
				curOrgName: '无机构', // 当前用户所在的机构的名称, 
			}, function() {
				MyRankListActions.getMyRankList(actId,that.state.curOrgId,paid,true);
				// MyRankListStore.myloadDownFn(actId,that.state.curOrgId,paid,true);
			})
		}else{
			this.setState({
				curOrgId:  (that.state.playerInfo.oid &&  that.state.playerInfo.oid == 0) ? 0 :  that.state.playerInfo.oid, // 当前用户所在的机构
				curOrgName: that.state.playerInfo.organization_name ? that.state.playerInfo.organization_name : '无机构', // 当前用户所在的机构的名称,  
			}, function() {
				MyRankListActions.getMyRankList(actId,that.state.curOrgId,paid,true);
				// MyRankListStore.myloadDownFn(actId,that.state.curOrgId,paid,true);
			})
		}
		$('.choose-modal').removeClass('active-modal');
		setTimeout(function() {
			$('.choose-modal').removeClass('show-modal');
		}, 100);
	},
	// 显示机构选择的下拉列表
	_showOrgSelectList: function() {
		$("#showOrgsList").addClass("tab-item-on").siblings("span").removeClass("tab-item-on");
		$("#showOrgsList").children('img').attr("src","../../assets/img/select.png").parent("span").siblings('span').children('img').attr("src","../../assets/img/noselect.png");
		$('.org-select').addClass('show-modal');
		setTimeout(function() {
			$('.org-select').addClass('active-modal');
		}, 100);
	},
	// 点击隐藏modal
	_hideChooseModal: function() {
		$('.choose-modal').removeClass('active-modal');
		setTimeout(function() {
			$('.choose-modal').removeClass('show-modal');
		}, 100);
	},

	// / 返回上一页
	_goPrevPage: function() {
		if(from == "isSubmit"){	
			var baseUrl = ToolFactory.changeUrlPath('activity/');
	        baseUrl += 'details.html';
	        baseUrl += '?aid='+backAid;
	        baseUrl += '&oid='+backOid;
	        baseUrl += '&type='+backType;
	        window.location.href = ToolFactory.checkUrlPath(baseUrl);
		}else{			
			var baseUrl = ToolFactory.getUrlPath(window.location.href);
	        baseUrl += 'index.html';
	        window.location.href = ToolFactory.checkUrlPath(baseUrl);
		}
	},
	_fillShare: function () {

		var that = this;
		var baseUrl2 = ToolFactory.getUrlPath(window.location.href);
		baseUrl2 += "myranklist.html"
		baseUrl2 += "?pid=" + pid;
		if(paid){
			baseUrl2 += "&paid=" + paid;
		}
		baseUrl2 += "&hideBtn=true";
		var url = ToolFactory.checkUrlPath( baseUrl2 );
		var shareTitle = "我的排行";
		var shareDesc = '我取得了新成绩，快来看我的成绩排行吧！';
		weixin.fillShare({
			title: shareTitle,
			link: url,
			desc: shareDesc,
			imgUrl: global.shareLogo,
			success: function () {
				console.log("分享成功");
				
			},
			cancel: function () {
				console.log('分享失败！');
			}
		})
	},

});

module.exports = MyRankList;