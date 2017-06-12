var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');

var aid = parseInt(ToolFactory.GetQueryString('aid'));
var oid = parseInt(ToolFactory.GetQueryString('oid'));

console.log('当前的活动ID 是:  ----- ', aid);
console.log('路径中的oid 是: ---- -- -', oid);

var CUR_CITY_Info = {
	curcity: null,
	time: null,
	pt: null,
};

// the sign up actions
var PersonHomePageActions = Reflux.createActions([
	'getPersonHomePageData',
]);

// the sign uo store
var PersonHomePageStore = Reflux.createStore({
	listenables: [PersonHomePageActions], // 监听actions
	personHomePageData: null, // 被浏览用户的信息
	onGetPersonHomePageData: function() {
		var that = this;
		/*$.ajax({
			url: global.apiUrl + 'index.php',
			type: 'GET',
			data: {},
		})
		.done(function(resp) {
			console.log("PersonHomePageStoe- ------ onGetPersonHomePageData: success()", resp);
			console.log('获取个人主页的数据成功的返回值是- ---- ', resp);

		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});*/
		this.personHomePageData = {
			isFans: true,
			fansNum: 10,
			personInfo: {
				uid: 'aaa',
				name: 'AAA', // 该辅导员的名称
				desc: 'AAA 是神门什么的辅导员', // 该辅导员的描述
				headimgurl: null, // 头像
			},
			acts: [
				{
					name: '活动一',
					status: 1,
					logo: null,
					price: 0,
					addr: '北京',
					stime: 1490604078,
					etime: 1490606284,
				},
				{
					name: '活动二',
					status: 2,
					logo: null,
					price: 100,
					addr: '天津',
					stime: 1490604078,
					etime: 1490604162,
				},
				{
					name: '活动三',
					status: 1,
					logo: null,
					price: 0,
					addr: '山东',
					stime: 1490604078,
					etime: 1490606284,
				},
				{
					name: '活动四',
					status: 2,
					logo: null,
					price: 20,
					addr: '回收日发货',
					stime: 1490604078,
					etime: 1490604162,
				}
			]
		};

		that.trigger(that.personHomePageData);

	},

	// 改变关注的状态
	changeCareState: function(uid1) {
		$.ajax({ 
			url: global.apiUrl + 'index.php',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'setPlayerFans',
				uid1: uid1 ? uid1 : null,
				uid2: global.player ? global.player.uid : null,
				oid: oid ? oid : null,
			},
		})
		.done(function(resp) {
			console.log("PersonHomePageStore.js----------------changeCareState:success()", resp);
		})
		.fail(function(e, x, r) {
			console.log("PersonHomePageStore.js-----------------changeCareState:failed()" , e);
		});
	}
});


var PersonHomePage = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(PersonHomePageStore, 'personHomePageData')],
	getInitialState: function () {
		return {
			playerInfo: null,
			personHomePageData: {
				isFans: false, // 是否关注了改辅导员
				fansNum: 0, // 该辅导员的粉丝数
				acts: [], // 该辅导员辅导过的活动
				personInfo: {
					uid: null,
					name: '', // 该辅导员的名称
					desc: '', // 该辅导员的描述
					headimgurl: null, // 头像
				}
			}
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				PersonHomePageActions.getPersonHomePageData();
			}
		})
	},

	onPersonHomePageDataChange: function(personHomePageData) {
		this.setState({
			personHomePageData: personHomePageData,
		}, function() {
			console.log('获取个人主页数据成功的返回值是: ----- ', personHomePageData);
		})
	}, 

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听个人主页的数据变化
		this.unsubscribe = PersonHomePageStore.listen(this.onPersonHomePageDataChange);
	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		var hasFocus = {
			display: ''
		};
		var addFocus = {
			display: ''
		};
		if (this.state.personHomePageData.isFans) {
			hasFocus['display'] = 'inline-block';
			addFocus['display'] = 'none';
		} else {
			hasFocus['display'] = 'none';
			addFocus['display'] = 'inline-block';
		};
		return (
			<section className="homepage-wrapper">
				<div className="head-bar has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage}>
						<span className="back"></span>
					</span>
					<span className="page-title">个人主页</span>
				</div>
				<section className="person-info-wrapper">
					<div className="person-info flex-container">
						<span className="fans-num">{this.state.personHomePageData.fansNum}人关注</span>
						<span className="head-icon">
							<img src={this.state.personHomePageData.personInfo.headimgurl ? this.state.personHomePageData.personInfo.headimgurl : global.defHeadUrl} />
						</span>
						<div className="care-oper">
							<span className="pay-atten" style={addFocus} onClick={this._changeCareState} data-uid1={(this.state.personHomePageData.personInfo.uid) ? this.state.personHomePageData.personInfo.uid : null}>+关注</span>
							<span className="pay-atten has-care" style={hasFocus} onClick={this._changeCareState} data-uid1={(this.state.personHomePageData.personInfo.uid) ? this.state.personHomePageData.personInfo.uid : null}>已关注</span>
						</div>
					</div>
					<div className="name-wrapper">
						<p className="name">{(this.state.personHomePageData.personInfo.name) ? this.state.personHomePageData.personInfo.name : ''}</p>
						<p className="identity">{(this.state.personHomePageData.personInfo.desc) ? this.state.personHomePageData.personInfo.desc : ''}</p>
					</div>
				</section>
				<div className="person-instru" id="personDesc"></div>
				<section className="per-acts-wrapper">
					<div className="person-act">
						辅导的活动
					</div>
					<div className="act-list-wrapper">
						<ul className="act-list">
							{
								this.state.personHomePageData.acts.map(this._initialPeresonActs)
							}
						</ul>
					</div>
				</section>
			</section>
		)
	},

	// /遍历活动列表
	_initialPeresonActs: function (item, index) {
		var actOnLine = {
			display: ''
		};
		var actOnEnd = {
			display: ''
		};
		// 判断活动的状态两个字段:status（1启用，2禁用） 和 etime(活动的启用状态和活动的结束时间)
		actOnLine['display'] = item.status > 1 ? 'none' : ((item.etime * 1000 > Date.parse(new Date())) ? 'block' : 'none');
		actOnEnd['display'] = item.status > 1 ? 'block' : ((item.etime * 1000 > Date.parse(new Date())) ? 'none' : 'block');
		return (
			<li className="list-item flex-container"  key={index}  data-act-id={item.id}>
				<div className="act-logo flex-container">
				<img src ={item.logo} alt="活动头像" title="活动头像" />
				</div>
				<div className="act-detail">
					<span className="act-name">{item.name}</span>
					<p className="price-time">
						<span className="act-time">{ToolFactory.covertTimeFormat(item.stime)}-{ToolFactory.covertTimeFormat(item.etime)}</span>
						<span className="act-price">{(!item.price || item.price == 0) ? '免费' : item.price + '/人'}</span>
					</p>
					<span className="act-loc">{item.addr}</span>
					
				</div>
				<div className="act-state-wrapper">
					<span className="act-state-btn act-online" style={actOnLine}>进行中</span>
					<span className="act-state-btn act-offline" style={actOnEnd}>已结束</span>
				</div>
			</li>
		)
	},

	/* / 添加关注或者取消关注*/
	_changeCareState: function(event) {
		var uid1 = event.target.getAttribute('data-uid1');
		console.log('the uid1 is:  ----- ', uid1);
		console.log('当前要关注的人是: ------ ', uid1); // uid1 是被关注的人,uid2 是主动去关注别人的人
		var curCareState = this.state.personHomePageData.isFans; // true代表当前是关注的,要取消关注 ,false代表当前是没有关注的，点击去关注
		var fansNum = curCareState ? (this.state.personHomePageData.fansNum - 1) : (this.state.personHomePageData.fansNum + 1);
		var newStateData = this.state.personHomePageData;
		newStateData.isFans = !curCareState;
		newStateData.fansNum = fansNum;
		this.setState({
			personHomePageData: newStateData
		});

		// 提交关注状态的数据
		PersonHomePageStore.changeCareState(uid1);
	},

	// 返回上一级
	_goPrevPage: function() {
		history.go(-1);
	}

});

module.exports = PersonHomePage;