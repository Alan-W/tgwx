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

// action
var MyChallengeListActions = Reflux.createActions([
	'getMyChallengeList'
]);

var counter = 0;
var num = 10;
var pageStart = 0;
var pageEnd = 0;

// store
var MyChallengeListStore = Reflux.createStore({
	myChallengeList: [],
	listenables: [MyChallengeListActions],
	onGetMyChallengeList: function() {
		console.log('获取我的活动中玩儿家的信息是: ----- ', global.player.id);
		var that = this;
		var offset = that.myChallengeList.length;
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
							status:'2',
							offset: offset,
							limit: 10,
						},
					})
					.done(function(resp) {
						counter++;
						pageEnd = num * counter;
						pageStart = pageEnd - num;
						console.log("MyChallengeListStore.js-----------getMyacts:success()", resp);
						if (resp && resp.getMyActivitys && resp.getMyActivitys.data) {
							var listArray = [];
							for(var i = 0 ; i < resp.getMyActivitys.data.length; i++){
								if(resp.getMyActivitys.data[i].played == 2){
									listArray.push(resp.getMyActivitys.data[i]);
								}
							}
							var respLen = listArray.length;
							if (respLen < 10) { // 若返回的数据少于10个则停止加载
								me.lock();
								me.noData();
							}
							that.myChallengeList = that.myChallengeList.concat(listArray);
							console.log('MyChallengeListStore.js重置完我的活动列表的数据是：--------', that.myChallengeList);
							offset = that.myChallengeList.length;
							that.trigger(that.myChallengeList);
							// 每次加载完必须重置
							me.resetload();
						};
					})
					.fail(function(e, x, r) {
						console.log("MyChallengeListStore.js-----------getMyacts:failed()", e);
						// 即使请求失败也是重新加载数据
						me.resetload();
						that.trigger(that.myChallengeList);
					});
				}
			})
		}
		
	}
})

var ChallengeList = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(MyChallengeListStore, 'myChallengeList')],
	getInitialState: function () {
		return {
			playerInfo: null,
			myChallengeList: [],
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				MyChallengeListActions.getMyChallengeList()
			}
		})
		
	},

	onMyChallengeListDataChange: function(myChallengeList) {
		this.setState({
			myChallengeList: myChallengeList 
		}, function() {
			console.log('获取到的我的活动的数据时: ----- ', myChallengeList);
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听我的活动的数据的变化
		this.unsubscribe = MyChallengeListStore.listen(this.onMyChallengeListDataChange);

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		return(
			<section className="challengeList-wrap">
				<div className="head-bar has-arrow has-border">
					<span className="page-title">挑战列表</span>
				</div>
				<div className="challengeLists"  id="dropList">
					<ul>
						{this.state.myChallengeList.map(this._initialmyChallengeList)}
					</ul>
				</div>
			</section>
		)
	},

	// / 初始话我的活动列表ITEM
	_initialmyChallengeList: function (items, index) {
		console.log(' the items is : ------- ', items);
		if(items.name.length > 10){
			items.name = items.name.toString().substr(0,10)+"...";
		}
		return(
			<li key={index}  data-act-id={items.id} data-act-oid={items.oid} onClick ={this._goThisChallengeDetails}>
				<div className="listLeft">
					<img src ={items.logo ? items.logo : global.defHeadUrl}/>
				</div>
				<div className="listCenter">
					<h5>{items.name ? items.name : ''}</h5>
					<p>{ToolFactory.covertTimeFormat(items.stime)}-{ToolFactory.covertTimeFormat(items.etime)}</p>
					<p>{items.addr}</p>
					<p>最佳成绩:&nbsp;&nbsp;{items.baseRank ? items.baseRank : 0 }</p>
				</div>
				<div className="listRight" data-act-id={items.id} data-act-oid={items.oid} onClick ={this._goThisChallengeDetails} data-type={items.type && items.type}>
					<span>挑战</span>
				</div>
			</li>
		)
	},
	_goThisChallengeDetails:function(event){
		var domTarget = event.target.nodeName.toUpperCase() == 'LI' ? $(event.target) : $(event.target).parents('LI')[0];
		var actID = parseInt($(domTarget).attr('data-act-id'));
		var actOID = parseInt($(domTarget).attr('data-act-oid'));
		var type = parseInt($(domTarget).attr('data-type'));
		console.log("actID",actID);
		var baseUrl = ToolFactory.getUrlPath(window.location.href);
  		baseUrl += 'challengedetails.html?';
   		baseUrl += 'aid='+ actID;
   		baseUrl += '&oid='+ actOID;
   		baseUrl += '&type='+ type;
   		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},

});

module.exports = ChallengeList;