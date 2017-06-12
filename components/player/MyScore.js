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

var pid = ToolFactory.GetQueryString('pid');
var aid = ToolFactory.GetQueryString('aid');
var actOID = ToolFactory.GetQueryString('oid'); // 玩儿家的ID
var type = ToolFactory.GetQueryString('type'); // 活动的类型

// action
var MyScoreActions = Reflux.createActions([
	'getMyScore',
	'autoSetSignUpData', // 自动去提交报名信息
]);

var counter = 0;
var num = 10;
var pageStart = 0;
var pageEnd = 0;

// store
var MyScoreStore = Reflux.createStore({
	myScoreLists: [],
	joinAgainSuccess: false, // 当前用户点击再次参加的状态
	listenables: [MyScoreActions],
	onGetMyScore: function() {
		console.log('获取我的活动中玩儿家的信息是: ----- ', global.player.id);
		var that = this;
		var offset = that.myScoreLists.length;
		if (document.getElementById('dropList')) {
			$('#dropList').dropload({
				scrollArea: window,
				loadDownFn: function (me) {
					//https://tg-api.taiyuansport.com/?r=activity/static&expand=getActivityRanks&aid=18&player_id=12
					$.ajax({
						url: global.apiUrl + 'index.php',
						type: 'GET',
						data: {
							r: 'activity/static',
							expand: 'getActivityRanks',
							player_id: pid,
							aid: aid,
							offset: offset,
							limit: 10,
						},
					})
					.done(function(resp) {
						counter++;
						pageEnd = num * counter;
						pageStart = pageEnd - num;
						console.log("MyScoreStore.js-----------getMyacts:success()", resp);
						if (resp && resp.getActivityRanks && resp.getActivityRanks.data) {
							var respLen = resp.getActivityRanks.data.length;
							if (respLen < 10) { // 若返回的数据少于10个则停止加载
								me.lock();
								me.noData();
							}
							that.myScoreLists = that.myScoreLists.concat(resp.getActivityRanks.data);
							console.log('MyScoreStore.js重置完我的活动列表的数据是：--------', that.myScoreLists);
							offset = that.myScoreLists.length;
							that.trigger(that.myScoreLists,that.joinAgainSuccess, that.nPaid);
							// 每次加载完必须重置
							me.resetload();
						};
					})
					.fail(function(e, x, r) {
						console.log("MyScoreStore.js-----------getMyacts:failed()", e);
						// 即使请求失败也是重新加载数据
						me.resetload();
						that.trigger(that.myScoreLists,that.joinAgainSuccess, that.nPaid);
					});
				}
			})
		}	
	},
	// 自动提交报名信息(点击了再次参加之后)
	onAutoSetSignUpData: function(aid, pid) {

		var that = this;

		$.ajax({
			url: global.apiUrl + 'index.php',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'setSignUp',
				aid: aid,
				player_id: pid
			},
		})
		.done(function(resp) {
			console.log('自动提交用户报名信息成功的返回值是: ------ ', resp);
			if (resp && resp.setSignUp) {
				if (resp.setSignUp.success) { // 自动提交活动报名信息成功
					// 更新本地的再次参加的字段信息
					that.joinAgainSuccess = true;
					that.nPaid = resp.setSignUp.data; // 更新当前活动详情的数据
					that.trigger(that.myScoreLists,that.joinAgainSuccess, that.nPaid);
				} else { // 自动提交活动的报名信息失败
                    that.joinAgainSuccess = false;
                    that.nPaid = null; // 更新当前活动详情的数据
					that.trigger(that.myScoreLists,that.joinAgainSuccess, that.nPaid);
				}
			}
		})
		.fail(function(e, x, r) {
			console.log('自动提交用户报名信息失败的错误是: ------ ', e);
			that.trigger(that.myScoreLists,that.joinAgainSuccess, that.nPaid);
		});
	}
})

var MyScore = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(MyScoreStore, 'myScoreLists','joinAgainSuccess','nPaid')],
	getInitialState: function () {
		return {
			playerInfo: null,
			myScoreLists: [],
			joinAgainSuccess: false, // 当前点击再次参加的状态
			nPaid: null, // 点击再次参加生成的新的paid
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				MyScoreActions.getMyScore()
			}
		})
		
	},

	onChallengeScoreDataChange: function(myScoreLists, joinAgainSuccess, nPaid) {
		this.setState({
			myScoreLists: myScoreLists,
			joinAgainSuccess: joinAgainSuccess,
			nPaid: nPaid,
		}, function() {
			//console.log('获取到的我的活动的数据时: ----- ', myScoreLists);
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听我的活动的数据的变化
		this.unsubscribe = MyScoreStore.listen(this.onChallengeScoreDataChange);

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		var showJoinAgainSuccess = {
			display: ''
		};
		showJoinAgainSuccess.display = this.state.joinAgainSuccess ? 'block' : 'none'; // 点击再次参加成功之后显示提示框
		return(
			<section className="myScore-wrap">
				<div className="head-bar has-arrow has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage}>
						<span className="back"></span>
					</span>
					<span className="page-title">我的成绩</span>
				</div>
				<div className="myScore" id="dropList">
					<ul>
						<li>
							<div>时间</div>
							<div>成绩</div>
							<div>名次</div>
							<div>参赛人数</div>
						</li>
						{this.state.myScoreLists.map(this._initialchallengeScore)}
					</ul>
				</div>
				<div className="upChallenge">
					<span onClick={this._joinAgain}>再次参加</span>
				</div>
				<div className="tip-toast join-again-tip" id="joinAgainDialog" style={showJoinAgainSuccess}>
				    <div className="tip-content">
				    	<img src="../../assets/img/okb.png" />
				        <p className="join-again" >再次参加, 申请成功</p>
				        <div className="tip-footer">
				            <span className="confirm-join-again-btn" onClick={this._clickSureJoin}>确定</span>
				        </div>
				    </div>
				</div>
			</section>
		)
	},

	// / 初始话我的活动列表ITEM
	_initialchallengeScore: function (items, index) {
		//console.log(' the items is : ------- ', items);
		var name = index % 2 == 0 ? "even" : "";
		return(
			<li className={name} key={index}>
				<div>{ToolFactory.covertTimeFormat(items.ctime)}&nbsp;&nbsp;&nbsp;{ToolFactory.getTimeClock(items.ctime)}</div>
				<div>{items.result}</div>
				<div>{items.times?items.times:'错误数据'}</div>
				<div>{items.num?items.num:'错误数据'}</div>
			</li>
		)
	},
	//点击确认再次参加按钮
	_clickSureJoin:function(event){
		$("#joinAgainDialog").css("display","none");
		var baseUrl = ToolFactory.getUrlPath(window.location.href);
		if(type == 1){//普通活动跳转页面
			console.log('当前活动的nPaid 是: ------- ', this.state.nPaid);
	  		baseUrl += 'myactdetails.html?';
	   		baseUrl += 'aid='+ aid;
	   		baseUrl += '&pid='+ pid;
	   		baseUrl += '&oid='+ actOID;
	   		baseUrl += '&type='+ type;
	   		baseUrl += '&paid='+ this.state.nPaid;
	   		baseUrl += '&isPlayed=1';
		}else if(type == 2){//机构活动跳转页面
			baseUrl = ToolFactory.changeUrlPath('activity/');
			baseUrl += 'orgplayersubmitscore.html?'; // 跳转的是自动提交成绩的页面
			baseUrl += 'aid=' + aid;
			baseUrl += '&oid=' + actOID;
			baseUrl += '&type=' + type;
			baseUrl += '&paid=' + this.state.nPaid; // player_activity 的ID
			baseUrl += '&countdown=0',
			baseUrl += '&isPlayed=1';
		}
   		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},
	// 再次参加
	_joinAgain: function (event) {
		MyScoreActions.autoSetSignUpData(aid, pid);
		
	},

	// / 返回上一页
	_goPrevPage: function() {
		window.location.href = document.referrer;
	},

});

module.exports = MyScore;