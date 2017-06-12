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
var MyChallengeActions = Reflux.createActions([
	'getMyChallenge'
]);

var counter = 0;
var num = 10;
var pageStart = 0;
var pageEnd = 0;

// store
var MyChallengeStore = Reflux.createStore({
	myChallenge: [],
	listenables: [MyChallengeActions],
	onGetMyChallenge: function() {
		console.log('获取我的活动中玩儿家的信息是: ----- ', global.player.id);
		var that = this;
		var offset = that.myChallenge.length;
		if (document.getElementById('dropList')) {
			$('#dropList').dropload({
				scrollArea: window,
				loadDownFn: function (me) {
					//https://tg-api.taiyuansport.com/?r=activity/static&expand=getChallengeActivitys&player_id=17
					$.ajax({
						url: global.apiUrl + 'index.php',
						type: 'GET',
						data: {
							r: 'activity/static',
							expand: 'getChallengeActivitys',
							player_id:(global.player ? global.player.id : null),
							offset: offset,
							limit: 10,
						},
					})
					.done(function(resp) {
						counter++;
						pageEnd = num * counter;
						pageStart = pageEnd - num;
						console.log("MyChallengeStore.js-----------getMyacts:success()", resp);
						if (resp && resp.getChallengeActivitys && resp.getChallengeActivitys.data) {
							var respLen = resp.getChallengeActivitys.data.length;
							if (respLen < 10) { // 若返回的数据少于10个则停止加载
								me.lock();
								me.noData();
							}
							that.myChallenge = that.myChallenge.concat(resp.getChallengeActivitys.data);
							console.log('MyChallengeStore.js重置完我的活动列表的数据是：--------', that.myChallenge);
							offset = that.myChallenge.length;
							that.trigger(that.myChallenge);
							// 每次加载完必须重置
							me.resetload();
						};
					})
					.fail(function(e, x, r) {
						console.log("MyChallengeStore.js-----------getMyacts:failed()", e);
						// 即使请求失败也是重新加载数据
						me.resetload();
						that.trigger(that.myChallenge);
					});
				}
			})
		}
		
	}
})

var MyChallenge = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(MyChallengeStore, 'myChallenge')],
	getInitialState: function () {
		return {
			playerInfo: null,
			myChallenge: [],
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				MyChallengeActions.getMyChallenge()
			}
		})
		
	},

	onMyChallengeDataChange: function(myChallenge) {
		this.setState({
			myChallenge: myChallenge 
		}, function() {
			console.log('获取到的我的活动的数据时: ----- ', myChallenge);
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听我的活动的数据的变化
		this.unsubscribe = MyChallengeStore.listen(this.onMyChallengeDataChange);

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		return(
			<section className="mychallenge-wrap">
				<div className="head-bar has-arrow has-border">
					<span className="page-title">我的挑战</span>
				</div>
				<div className="mychallenge" id="dropList">
					<ul>
						{this.state.myChallenge.map(this._initialmyChallenge)}
					</ul>
				</div>
			</section>
		)
	},

	// / 初始话我的活动列表ITEM
	_initialmyChallenge: function (items, index) {
		console.log(' the items is : ------- ', items);
		var resultImg, VSImg, colorStyle;
		if(parseInt(items.result) > parseInt(items.beresult)){
			resultImg = "../../assets/img/chinaWin.png";
			VSImg = "../../assets/img/win.png";
			colorStyle = {
				color:"#4cdc5b"
			}; 
		}else{
			resultImg = "../../assets/img/chinaLose.png";
			VSImg = "../../assets/img/lose.png";
			colorStyle = {
				color:"#D95053"
			};
		}
		if(items.name.length > 10){
			items.name = items.name.toString().substr(0,10)+"...";
		}
		return(
			<li key={index} data-act-id={items.id} data-act-oid={items.oid} data-act-type={items.type}  onClick ={this._goThisChallengeDetails}>
				<div className="listLeft">
					<img src={items.logo ? items.logo : global.defHeadUrl}/>
				</div>
				<div className="listCenter">
					<h5>{items.name}</h5>
					<p>时间：{ToolFactory.covertTimeFormat(items.stime)}-{ToolFactory.covertTimeFormat(items.etime)}</p>
					<p>挑战：{items.player_realname}</p>
					<p><span style={colorStyle} className='baseRanking'>{items.result}</span><img src={VSImg}/><span>{items.beresult}</span></p>
				</div>
				<div className="listRight">
					<img src={resultImg}/>
				</div>
			</li>
		)
	},

	_goThisChallengeDetails:function(event){
		var domTarget = event.target.nodeName.toUpperCase() == 'LI' ? $(event.target) : $(event.target).parents('LI')[0];
		var actID = parseInt($(domTarget).attr('data-act-id'));
		var actOID = parseInt($(domTarget).attr('data-act-oid'));
		var type = parseInt($(domTarget).attr('data-act-type'));
		var actName = $(domTarget).children('div').children('h5').html();
		var baseRanking = $(domTarget).children('div').children('p').children('span').first().html();
		var baseUrl = ToolFactory.getUrlPath(window.location.href);
  		baseUrl += 'challengeScore.html?';
   		baseUrl += 'aid='+ actID;
   		baseUrl += '&pid='+ (global.player ? global.player.id : '');
   		baseUrl += '&oid='+ actOID;
   		baseUrl += '&actName='+ actName;
   		baseUrl += '&baseRanking='+ baseRanking;
   		baseUrl += '&type='+ type;
   		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},

});

module.exports = MyChallenge;