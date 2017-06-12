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

var PlayerIndex = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo')],
	getInitialState: function () {
		return {
			playerInfo: {
				headingurl: global.defHeadUrl, // 用户默认的头像
				uname: '', // 如果有真是姓名的话就用真是的,否则用微信的
				organization_name: '', // 用户所在机构的标签名称你
				explain: '', // 用户的个性签名
			},
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			console.log('获取到当前用户的信息是: ------ ', playerInfo);
			$('.blur-css').css('backgroundImage', "url("+playerInfo.headimgurl+")");
			console.log('当前用户的headimgheurl 是: ----- ', playerInfo.headimgurl);

		})
		
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		
		return (
			<section className="player-index">
				<div id="infoCenterWrapper" className="info-wrapper">
					<div className="user-info-desc">
						<div className="head-bar has-border">
							<span className="page-title">个人中心</span>
						</div>
						<div className="user-info" >
							<span className="head-wrap">
								<img src={this.state.playerInfo.headimgurl ? this.state.playerInfo.headimgurl : global.defHeadUrl } className="head-img" />
							</span>
							<div className="fliter-style">
								<div className="blur-css"></div>
							</div>
							<div className="white-bg"></div>
							<p className="user-name">{this.state.playerInfo.realname ? this.state.playerInfo.realname : this.state.playerInfo.nickname}</p>
							<p className="user-tag">
								<span className="tag-name">{this.state.playerInfo ? (this.state.playerInfo.organization_name ? this.state.playerInfo.organization_name : '无机构') : '无机构'}</span>
							</p>
						</div>
					</div>
					<div className="info-list">
						<div className="info-item setting-item"><a href = {ToolFactory.checkUrlPath(ToolFactory.getUrlPath(window.location.href) + "identifyverify.html?pid="+(global.player ? global.player.id: ''))}>身份验证</a></div>
						<div className="info-item setting-item"><a href = {ToolFactory.checkUrlPath(ToolFactory.getUrlPath(window.location.href) + 'msglist.html')}> 消息 </a></div>
						<div className="info-item setting-item"><a href={ToolFactory.checkUrlPath(ToolFactory.getUrlPath(window.location.href) + 'myacts.html?prev=1')}>我的活动 </a></div>
						<div className="info-item setting-item"><a href={ToolFactory.checkUrlPath(ToolFactory.getUrlPath(window.location.href) + "myranklist.html?pid="+(global.player ? global.player.id : ''))}>我的排行 </a></div>
					</div>
				</div>
			</section>
		)
	},

	/*
	_goPlayerDataSetPage: function () {
		var baseUrl = ToolFactory.getUrlPath(window.location.href);
		baseUrl += "playerdataset.html";
		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	}*/

});

module.exports = PlayerIndex;