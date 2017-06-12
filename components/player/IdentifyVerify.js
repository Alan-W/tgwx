var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');
var OrgsList = require('../../core/components/OrgsList.js');
var OrgDataActions = require('../../core/actions/OrgDataActions.js');
var OrgDataStore = require('../../core/factories/OrgDataStore.js');
var weixin = require('../../core/factories/WeixinFactory.js');

var pid = ToolFactory.GetQueryString('pid');
var aid = ToolFactory.GetQueryString('aid');
				
var playerKey = 'tgwx-player'; // 缓存在中用户信息的字段

var IdentifyVerifyActions = Reflux.createActions([
	'submitIdentifyVerifyData', // 提交用户认认证的信息
]);

weixin.setup(function() {
	weixin.forbidSharing();
});

var IdentifyVerifyStore = Reflux.createStore({
	validError: false, // 默认用户验证是通过的,这样不显示错误提示
	selectObj: null, // 当前选中的机构的对象
	listenables: [IdentifyVerifyActions], // 监听actions
	onSubmitIdentifyVerifyData: function(submitData) {

		console.log('提交报名提交的数据是：----- ',submitData);
		var that = this;

		$.ajax({
			url: 'https://tg-api.taiyuansport.com/',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'setPlayerCenterBind',
				realname: submitData.realname,
				tel: submitData.tel,
				sex: submitData.sex,
				aid: submitData.aid,
				oid: submitData.oid, // 当前用户选择的机构ID
				player_id: submitData.player_id,
				age: submitData.age,
				job: submitData.job
			},
		})
		.done(function(resp) {
			console.log("IdentifyVerifyStore----- ---- success() ", resp);
			console.log('提交报名数据成功的返回值是: ------', resp);
			if (resp && resp.setPlayerCenterBind) { // 后台验证身份的时候匹配到了该用户的信息
				if (resp.setPlayerCenterBind.success) {

					// 用户首次进行身份验证的时候需要去更新本地的player 的信息
					var oldPlayerID  = global.player ? global.player.id : null;
					var newPlayerInfo = (resp.setPlayerCenterBind.data) ? resp.setPlayerCenterBind.data : null;
					console.log('用户认证之后的新数据时: ----- ', newPlayerInfo);
					if (newPlayerInfo && pid == oldPlayerID) { //如果本地缓存的信息是当前用户的
						window.localStorage.removeItem(playerKey); // 存在了新的用户数据那么移除缓存中旧的player 的数据 
						window.localStorage.setItem(playerKey, JSON.stringify(newPlayerInfo));
						global.player = newPlayerInfo;
					};

					that.validError = false;
					that.trigger(that.validError);

					// 显示提交成功
					$('#submitSuccess').css('display', 'block');
					
					setTimeout(function() {
						history.go(-1); // 返回上一级
					}, 1500);

				} else { // 用户的机构信息认证失败了
					that.validError = true;
					that.trigger(that.validError);

				}
				
			} else { // 后台返回的数据不对了
				alert('报名时验证接口返回数据失败');
			}
		})
		.fail(function(e, x, r) {
			console.log("IdentifyVerifyStore--- ------error()", e);
			console.log('提交报名数据失败的请求错误是: ------ ', e);
		});
		
	},

	// 修改用户的默认信息
	updatePlayerInfo: function(submitData) {
		console.log('更新用户信息的时提交的数据是: ------- ', submitData);
		$.ajax({
			url: 'https://tg-api.taiyuansport.com/?r=player/static&expand=setCheckPlayerData&id='+(global.player && global.player.id),
			type: 'POST',
			data: submitData,
		})
		.done(function(resp) {
			console.log("updatePlayerInfo ------- success():  ", resp);
			if (resp && resp.setCheckPlayerData && resp.setCheckPlayerData.success) {
				var result = resp.setCheckPlayerData.data;
				var newPlayerInfo = (result) ? result : null; // 更新新的player 的信息
				console.log('用户认证之后的新数据时: ----- ', newPlayerInfo);

				if (newPlayerInfo) {
					window.localStorage.removeItem(playerKey); // 存在了新的用户数据那么移除缓存中旧的player 的数据 
					window.localStorage.setItem(playerKey, JSON.stringify(newPlayerInfo));
					global.player = resp;

					$('#submitSuccess').css('display', 'block');
					setTimeout(function() {
						history.go(-1);
					}, 1500);
				};
			}
			
		})
		.fail(function() {
			console.log("updatePlayerInfo - -------- error (): ", x);
		});
	},
})

var IdentifyVerify = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(IdentifyVerifyStore, 'validError')],
	returnObj: null,
	getInitialState: function () {
		return {
			playerInfo: null,
			warnTxt: '', // 验证的错误信息
			curOrgId: 0, // 初始化默认的是无机构的ID （1）（记住如果是无机构的,那么oid 是0,其它的机构oid 都不是0）
			curOrgName: '无机构', // 默认进来的机构名称是无机构
			curSexData: 0, // 默认进来的性别数据
			cueSexTxt: '请选择性别', // 默认进来的性别文字
			validError: false, // 用户提交之后验证信息是否是成功的
			curSelectOrgObj: null, // 当前选中的击缶信息
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		var that = this;
		console.log(' the player info is : ------- ', playerInfo);
		this.setState({
			playerInfo: playerInfo,
			curSexData: playerInfo.sex ? playerInfo.sex : 0,
			curSexTxt: playerInfo.sex ? (playerInfo.sex == 1 ? '男' : '女') : '请选择性别',
			curOrgId:  (playerInfo.oid &&  playerInfo.oid == 0) ? 0 :  playerInfo.oid, // 当前用户所在的机构
			curOrgName: playerInfo.organization_name ? playerInfo.organization_name : '无机构', // 当前用户所在的机构的名称, 需要自动去补全的
		}, function() {
			if (playerInfo) {
				that.setState({
					id: that.state.curOrgId,
					name: that.state.curOrgName,
				})
				console.log('当前用户的信息是: ------ ', playerInfo)
				document.getElementById('username').value = playerInfo.realname ? playerInfo.realname : playerInfo.nickname; // 有认证过的真实姓名就用真实的,否则就用微信的
				document.getElementById('telphone').value = playerInfo.tel;
				document.getElementById('age').value = playerInfo.age;
				document.getElementById('job').value = playerInfo.job;
				
				weixin.forbidSharing();
			}
		})
		
	},

	// 验证信息的监听
	onIdentifyValidStatusChange: function(validError) {

		this.setState({
			validError: validError,
		});
	},

	// 选中的机构信息变换
	onSelectOrgStatusChange: function ([], curSelectOrgObj) {
		var that = this;
		this.setState({
			curSelectOrgObj: curSelectOrgObj,
		}, function() {
			if (curSelectOrgObj) {
				that.setState({
					curOrgId: (curSelectOrgObj && curSelectOrgObj.id) ? curSelectOrgObj.id : 0,
					curOrgName: (curSelectOrgObj && curSelectOrgObj.name) ? curSelectOrgObj.name : '无机构',
				})
			}
		})
	},


	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 去获监听当前的验证过信息是否是正确的
		this.unsubscribe = IdentifyVerifyStore.listen(this.onIdentifyValidStatusChange);

		// 监听机构列表组件中选中的对象信息
		this.unsubscribe = OrgDataStore.listen(this.onSelectOrgStatusChange);


		var h=$(window).height();
	    $(window).resize(function() {
	        if($(window).height()<h){
	            $('.confirm-base-btn').hide();
	        }
	        if($(window).height()>=h){
	            $('.confirm-base-btn').show();
	        }
	    });

	   

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {

		var showValidError = {
			display: ''
		};

		// 是否显示提交身份认证信息的按钮
		var showConfirmBtnStyle = {
			display: ''
		};

		var showHasVerifyStyle = {
			disply: ''
		};

		
		showValidError.display = this.state.validError ? 'block' : 'none';

		if (global.player) {
			if (parseInt(global.player.status) == 1 && global.player.oid && global.player.oid != 0) {
				showConfirmBtnStyle.display = 'none'; // 已经验证成功的信息不再提交验证
				showHasVerifyStyle.display = 'block';
			} else {
				showConfirmBtnStyle.display = 'block';
				showHasVerifyStyle.display = 'none';
			}
		}

		var isDisabled = '';
		if ( global.player && global.player.status ) {
			if (parseInt(global.player.status) == 1 && parseInt(global.player.oid) != 0) { // 已经验证了但是验证的时候选择的机构不是无机构
				isDisabled = 'disabled';
			} else isDisabled = false;
		};

		return (
			<section className="signup-wrapper">
				<div className="head-bar has-arrow has-border">
					<span className="prev-arrow"  onClick={this._goPrevPage}>
						<span className="back"></span>
					</span>
					<span className="page-title">身份验证</span>
				</div>
				<div className="tip-warn data-warn"> 
					<i className="bar-icon"></i>
					<span className="warn-txt">{this.state.warnTxt}</span>
				</div>
				<div className="form-wrapper">
					<div className="info-item">
						<div className="weui_cell">
							<div className="weui_cell_hd">
								<label className="weui_label">姓名</label>
								<input className="weui_input" id="username" onFocus={this._hiddenErrorTip} placeholder="请输入姓名" disabled={isDisabled}/>
							</div>
						</div>
					</div>
					<div className="info-item">
						<div className="weui_cell">
							<div className="weui_cell_hd">
								<label className="weui_label">电话</label>
								<input className="weui_input" type="number" pattern="[0-9]*" id="telphone" onFocus={this._hiddenErrorTip} placeholder="请输入手机号" disabled={isDisabled}/>
							</div>
						</div>
					</div>
					<div className="info-item">
						<div className="weui_cell setting-item" onClick={this._showSexChooseModal}>
							<div className="weui_cell_hd">
								<label className="weui_label">性别</label>
								<span className="sex-data"  id="sexData" data-sex={this.state.curSexData}>{this.state.curSexTxt}</span>
							</div>
						</div>
					</div>
					<div className="info-item">
						<div className="weui_cell setting-item" id="showOrgsList" onClick={this._showOrgSelectList}>
							<div className="weui_cell_hd">
								<label className="weui_label">所属机构</label>
								<span className="org-data"  id="orgData" data-oid={this.state.curOrgId}>{this.state.curOrgName}</span>
							</div>
						</div>
					</div>
					<div className="info-item">
						<div className="weui_cell">
							<div className="weui_cell_hd">
								<label className="weui_label">年龄</label>
								<input className="weui_input" type="number" pattern="[0-9]*" id="age" placeholder="请输入年龄" disabled={isDisabled}/>
							</div>
						</div>
					</div>
					<div className="info-item">
						<div className="weui_cell">
							<div className="weui_cell_hd">
								<label className="weui_label">职业</label>
								<input className="weui_input" id="job" placeholder="请输入职业" disabled={isDisabled}/>
							</div>
						</div>
					</div>
				</div>
				<div className="base-btn confirm-base-btn" onClick={this._submitIdentifyData} style={showConfirmBtnStyle}>确认</div>
				<div className="base-btn"  style={showHasVerifyStyle}>  
					您已验证过信息,  无需重新验证
				</div>
				<div className="tip-toast" id="submitSuccess">
					<img className="tip_icon_toast" src="../../assets/img/ok.png" />
					<p className="tip-toast-content" id="submitState">提交成功</p>
				</div>
				<div className="sex-choose-modal choose-modal">
					<div className="modal-bg" onClick={this._hideChooseModal}></div>
					<div className="choose-wrap">
						<p className="choose-item" data-sex="1" onClick={this._chooseSexItem}>男</p>
						<p className="choose-item" data-sex="2" onClick={this._chooseSexItem}>女</p>
					</div>
				</div>
				<OrgsList />
				<div className="valid-error" style={showValidError}>
					<div className="toast-content">
						<img className="tip-warn-img small-margin" src="../../assets/img/warn.png" /> 
						<p className="valid-info"> 无法匹配到该用户 </p>
						<div className="toast-footer flex-container small-h">
							<span className="bar-item" onClick={this._resetIdentifyVerifyData}>重新验证</span>
							<a className="bar-item" onClick={this._goPrevPage}> 返回 </a>
						</div>
					</div>
					
				</div>
			</section>
		)
	},

	// / 显示性别的选择弹框
	_showSexChooseModal: function() {

		// 去判断player  的信息，如果已经正确的验证过了, 那么性别信息不再能选择
		if (global.player && global.player.status && parseInt(global.player.status) == 1 && parseInt(global.player.oid) != 0) {
			return false;
		}
		$('.sex-choose-modal').addClass('show-modal');
		setTimeout(function() {
			$('.choose-modal').addClass('active-modal');
		}, 100);
	},

	// 重新去验证身份信息
	_resetIdentifyVerifyData: function() {
		var that = this;
		var playerInfo = global.player;
		this.setState({
			//  重新提交身份验证信息，隐藏该弹框
			validError: false,
			curOrgId:  (playerInfo.oid &&  playerInfo.oid == 0) ? 0 :  playerInfo.oid, // 当前用户所在的机构
			curOrgName: playerInfo.organization_name ? playerInfo.organization_name : '无机构', // 当前用户所在的机构的名称, 需要自动去补全的
			disabled: false, // 放开提交按钮的禁用
		}, function() {
			var newObj = {
				id: 0,
				name: '无机构'
			};
			that.setState({
				curSelectOrgObj: newObj
			})
		});
	},

	// 显示机构选择的下拉列表
	_showOrgSelectList: function() {
		if (global.player && global.player.status == 1 && global.player.oid != 0) { // 验证过并且选择的不是无机构
			return false;
		}
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

	// 点击选择性别数据
	_chooseSexItem: function(event) {
		console.log('当前点击的性别选项是: - ---- ', event.target.getAttribute('data-sex'));
		
		var sex = parseInt(event.target.getAttribute('data-sex'));
		
		this.setState({
			curSexTxt: event.target.innerHTML,
			curSexData: sex,
		});

		$('.choose-modal').removeClass('active-modal');
		setTimeout(function() {
			$('.choose-modal').removeClass('show-modal');
		}, 100);
	},

	// 提交验证身份的信息，
	_submitIdentifyData: function () {

		event.preventDefault();
		event.stopPropagation();

		if (this.state.disabled) return; // 已经点击去请求了，禁用当前的按钮

		var nameInput = document.getElementById('username');
		var telInput = document.getElementById('telphone');
		var name = nameInput.value;
		var tel = telInput.value;
		var age = document.getElementById('age').value;
		var job = document.getElementById('job').value;
		var successTip = document.getElementById('submitSuccess');
		console.log('传递过来的选中信息是: ----- ', this.state.curSelectOrgObj);
		var curOID = (this.state.curSelectOrgObj && this.state.curSelectOrgObj.id) ? this.state.curSelectOrgObj.id : 0; // 提交的数据是当前选中的机构ID

		if (curOID == 0) {
			alert('请选择您所属的机构!');
			return;
		};

		if (name.length == 0) {
			$('.tip-warn').addClass('active-tip-warn');
			this.setState({
				warnTxt: '请输入姓名'
			})
			return false;
		};

		console.log('手机号测试结果： ----- ', ToolFactory.checkPhoneNumber(tel));
		if (!ToolFactory.checkPhoneNumber(tel)) {
			$('.tip-warn').addClass('active-tip-warn');
			this.setState({
				warnTxt: '请输入合法的手机号'
			})
			return false;
		};

		var signUpData = {
			realname: name,
			tel: tel,
			sex: this.state.curSexData, //  当前选中的性别的Data
			age: age,
			job: job,
			aid: aid,
			player_id: (global.player ? global.player.id : null),
			oid: curOID ? curOID : 0,
		};
		console.log('当前提交的数据时: ------- ', signUpData);

		// 点击了一次再点击的时候先禁用
		this.setState({
			disabled: true,
		});

		// 去判断当前的用户是绑定了还是没绑定,如果是绑定之后的修改，走的接口是不一样的
		if (global.player) {

			if (parseInt(global.player.id) !== parseInt(pid)) { // 不是一个人的
				alert('您不能提交别人的身份验证');
				return;
			}

			if (parseInt(global.player.status) == 0) { // 身份还没有去验证
				// 这个函数也就只有用户第一次参加机构活动的时候验证时需要
				IdentifyVerifyActions.submitIdentifyVerifyData(signUpData);
				
			} else { // 已经验证过身份信息了
				if (parseInt(global.player.oid) == 0 || !global.player.oid) {
					console.log('打印当前提交的数据是：----- ', signUpData);
					// 提交修改机构的接口
					IdentifyVerifyStore.updatePlayerInfo(signUpData);
				} else return;
			}
		} 

	},

	// 返回上一级
	_goPrevPage: function() {
		history.go(-1);
	},


});

module.exports = IdentifyVerify;