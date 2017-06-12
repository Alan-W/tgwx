var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var weixin = require('../../core/factories/WeixinFactory.js');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');

function searchPara(){
	var o={};
    var paraarry=[];
    var href=window.decodeURI(window.location);
    var why=href.split('?');
    o['path'] = why[0];
    if(why[1]){
        var paraarry = why[1].split('&');
    }
    for(var i=0,l=paraarry.length;i<l;i++){
        var key = paraarry[i].split('=')[0];
        var value = paraarry[i].split('=')[1];
        o[key] = value;
    }
    return o;
}

weixin.setup(function(){
	weixin.enableSharing();
});

var pid = ToolFactory.GetQueryString('pid');
var aid = ToolFactory.GetQueryString('aid');
var actOID = ToolFactory.GetQueryString('oid'); // 玩儿家的ID
var type = ToolFactory.GetQueryString('type'); // 活动的类型
var actName = searchPara().actName; // 活动的名称
var baseRanking = ToolFactory.GetQueryString('baseRanking'); // 活动的最高成绩

// action
var ChallengeScoreActions = Reflux.createActions([
	'getChallengeScore'
]);

var counter = 0;
var num = 10;
var pageStart = 0;
var pageEnd = 0;

// store
var ChallengeScoreStore = Reflux.createStore({
	myChallengeScore: [],
	listenables: [ChallengeScoreActions],
	onGetChallengeScore: function() {
		console.log('获取我的活动中玩儿家的信息是: ----- ', global.player.id);
		var that = this;
		var offset = that.myChallengeScore.length;
		if (document.getElementById('dropList')) {
			$('#dropList').dropload({
				scrollArea: window,
				loadDownFn: function (me) {
					//https://tg-api.taiyuansport.com/?r=activity/static&expand=getChallengeRanks&player_id=17&aid=20
					$.ajax({
						url: global.apiUrl + 'index.php',
						type: 'GET',
						data: {
							r: 'activity/static',
							expand: 'getChallengeRanks',
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
						console.log("ChallengeScoreStore.js-----------getMyacts:success()", resp);
						if (resp && resp.getChallengeRanks && resp.getChallengeRanks.data) {
							var respLen = resp.getChallengeRanks.data.length;
							if (respLen < 10) { // 若返回的数据少于10个则停止加载
								me.lock();
								me.noData();
							}
							that.myChallengeScore = that.myChallengeScore.concat(resp.getChallengeRanks.data);
							console.log('ChallengeScoreStore.js重置完我的活动列表的数据是：--------', that.myChallengeScore);
							offset = that.myChallengeScore.length;
							that.trigger(that.myChallengeScore);
							// 每次加载完必须重置
							me.resetload();
						};
					})
					.fail(function(e, x, r) {
						console.log("ChallengeScoreStore.js-----------getMyacts:failed()", e);
						// 即使请求失败也是重新加载数据
						me.resetload();
						that.trigger(that.myChallengeScore);
					});
				}
			})
		}
		
	}
})

var ChallengeScore = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(ChallengeScoreStore, 'myChallengeScore')],
	getInitialState: function () {
		return {
			playerInfo: null,
			shareType: '',
			myChallengeScore: [],
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				ChallengeScoreActions.getChallengeScore()
			}
		})
		
	},

	onChallengeScoreDataChange: function(myChallengeScore) {
		this.setState({
			myChallengeScore: myChallengeScore 
		}, function() {
			console.log('获取到的我的活动的数据时: ----- ', myChallengeScore);
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听我的活动的数据的变化
		this.unsubscribe = ChallengeScoreStore.listen(this.onChallengeScoreDataChange);

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		return(
			<section className="challengeScore-wrap">
				<div className="head-bar has-arrow has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage}>
						<span className="back"></span>
					</span>
					<span className="page-title">挑战成绩</span>
				</div>
				<div className="challengeScore" id="dropList">
					<ul>
						{this.state.myChallengeScore.map(this._initialchallengeScore)}
					</ul>
				</div>
				<div className="upChallenge">
					<span onClick={this._shareChallenge}>发起挑战</span>
				</div>
				<div className="share-tip" id="shareTipModal" data-id="#shareTipModal" onClick={ToolFactory.hiddenShareTip}><img src="../../../assets/img/sharetip.png" data-id="#shareTipModal" / ></div>
			</section>
		)
	},

	// / 初始话我的活动列表ITEM
	_initialchallengeScore: function (items, index) {
		console.log(' the items is : ------- ', items);
		var resultImg, resultName, colorStyle;
		if(parseInt(items.challengeResult) > parseInt(items.beChallengeResult)){
			resultImg = "../../assets/img/win.png";
			resultName = "胜利";
			colorStyle = {
				color:"#4cdc5b"
			}; 
		}else{
			resultImg = "../../assets/img/lose.png";
			resultName = "失败";
			colorStyle = {
				color:"#D95053"
			};
		}
		return(
			<li key={index}>
				<div className="challengeLeft">
					<img src ={items.headimgurl ? items.headimgurl : global.defHeadUrl}/>
				</div>
				<div className="challengeCenter1">
					<h5>{items.beChallengePlayer ? items.beChallengePlayer : ''}</h5>
					<p>{ToolFactory.covertTimeFormat(items.ctime)}&nbsp;&nbsp;{ToolFactory.getTimeClock(items.ctime)}</p>
				</div>
				<div className="challengeCenter2">
					<span style = {colorStyle}>{items.challengeResult}</span>
					<img src={resultImg}/>
					<span>{items.beChallengeResult}</span>
				</div>
				<div className="challengeRight">
					<span style = {colorStyle} >{resultName}</span>
				</div>
			</li>
		)
	},

	//点击挑战
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
	_fillShare: function () {
		var shareType = this.state.shareType;
		if(shareType =="challenge"){
			var that = this;
			var uname =(global.player ? (global.player.realname ? global.player.nickname : '') : '');
			var baseUrl2 = ToolFactory.changeUrlPath('activity/');
			baseUrl2 += "challengeshare.html"
			baseUrl2 += "?aid=" + aid;
			baseUrl2 += "&oid=" + actOID;
			baseUrl2 += "&type=" + type;
			baseUrl2 += "&fripid=" + global.player ? global.player.id : null;
			baseUrl2 += "&friname=" + uname;
			baseUrl2 += "&frisex=" + global.player ? global.player.sex : null;
			baseUrl2 += "&baseRanking=" + baseRanking;
			var url = ToolFactory.checkUrlPath( baseUrl2 );
			var shareDesc = '我在' + actName + '活动中最好成绩为:' + baseRanking + ',你,敢来挑战吗?!';
		};
		var that = this;
		weixin.fillShare({
			title: actName,
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
	// / 返回上一页
	_goPrevPage: function() {
		history.go(-1);
	}

});

module.exports = ChallengeScore;