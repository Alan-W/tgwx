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

var aid = parseInt(ToolFactory.GetQueryString('aid')); // 活动ID
var pid = parseInt(ToolFactory.GetQueryString('pid')); 
var actOID = ToolFactory.GetQueryString('oid'); // 活动的OID
var type = ToolFactory.GetQueryString('type'); // 活动的类型 
var baseRanking = ToolFactory.GetQueryString('baseRanking'); // 发起挑战的人那个时候的最好成绩
var countdown = ToolFactory.GetQueryString('countdown'); // 活动的时间
var initiateChaPid = ToolFactory.GetQueryString('initiateChaPid'); // 发起挑战的人的player 的ID
var playerKey = 'tgwx-player'; // 缓存在中用户信息的字段
var isShare = ToolFactory.GetQueryString('isShare'); // 表示是否是从分享进来的

// the sign up actions
var ActivitySignUpActions = Reflux.createActions([
	'submitSignUpData',
]);

weixin.setup(function() {
	weixin.forbidSharing();
});

// the sign uo store
var ActivitySignUpStore = Reflux.createStore({
	validError: false, 
	validTxt: '', 
	listenables: [ActivitySignUpActions], // 监听actions
	onSubmitSignUpData: function(submitData) {
		console.log('提交报名提交的数据是：----- ',submitData);
		var that = this;

		var requestData = {
			r: 'activity/static',
			expand: 'setSignUpBind',
			realname: submitData.realname,
			tel: submitData.tel,
			sex: submitData.sex,
			aid: submitData.aid,
			oid: submitData.oid, // 当前用户选择的机构ID
			player_id: submitData.player_id,
			age: submitData.age,
			job: submitData.job,
		};

		if (initiateChaPid && baseRanking) { // 说明是挑战者从我要应战点击进来的
			requestData.challenge_id = initiateChaPid; // 此时的player_id 就是接受挑战的player 的 ID
			requestData.result = baseRanking; // player 发起挑战的时候的成绩
		}

		$.ajax({
			url: 'https://tg-api.taiyuansport.com/',
			type: 'GET',
			data: requestData
				
		})
		.done(function(resp) {
			console.log("ActivitySignUpStore----- ---- success() ", resp);
			console.log('提交报名数据成功的返回值是: ------', resp);
			if (resp && resp.setSignUpBind) { // 后台验证身份的时候匹配到了该用户的信息
				if (resp.setSignUpBind.success) { // 后台返回的信息包括两部分: player 的绑定的更新信息,还有这次活动报名的paid

					// 用户首次进行身份验证的时候需要去更新本地的player 的信息
					var originPlayerID = global.player  ? global.player.id : null;
					var newPlayerInfo = resp.setSignUpBind.data ? resp.setSignUpBind.data && resp.setSignUpBind.data.player : null;
					console.log('用户认证之后的新数据时: ----- ', newPlayerInfo);
					
					if (newPlayerInfo && pid == originPlayerID) {
						window.localStorage.removeItem(playerKey); // 存在了新的用户数据那么移除缓存中旧的player 的数据 
						window.localStorage.setItem(playerKey, JSON.stringify(newPlayerInfo));
						global.player = newPlayerInfo; //带着当前新的player ID 去跳转页面
					};

					// 显示提交成功
					$('#submitSuccess').css('display', 'block');

					var baseUrl = ToolFactory.getUrlPath(window.location.href);
					baseUrl += 'details.html';
					baseUrl += '?aid=' + aid;
					baseUrl += '&oid=' + actOID;
					baseUrl += '&type=' + type;
					baseUrl += '&prev=1';
					setTimeout(function() {
						window.location.href = baseUrl;
					}, 1500);
					

				} else { // 用户的机构信息认证失败了
					that.validError = true;
					that.validTxt = resp.setSignUpBind.errcode;
					that.trigger(that.validError, that.validTxt);

				};

				
			} else { // 后台返回的数据不对了
				alert('报名时验证接口返回数据失败');
			}
		})
		.fail(function(e, x, r) {
			console.log("ActivitySignUpStore--- ------error()", e);
			console.log('提交报名数据失败的请求错误是: ------ ', e);
		});
		
	},
	
});


var ActivitySignUp = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(ActivitySignUpStore, 'validError', 'validTxt')],
	returnObj: null,
	getInitialState: function () {
		return {
			playerInfo: null,
			disabled: false, // 提交按钮是否禁用
			orgsList: [], // 所有的机构列表数据
			levelsArray: [], // 机构列表的所有层级
			showOrgsList: [], // 当前显示的机构列表
			curLevel: 1, // 当前显示的层级
			warnTxt: '', // 验证的错误信息
			curOrgId: 0, // 初始化默认的是无机构的ID （1）（记住如果是无机构的,那么oid 是0,其它的机构oid 都不是0）
			curOrgName: '无机构', // 默认进来的机构名称是无机构
			curSexData: 0, // 默认进来的性别数据
			cueSexTxt: '请选择性别', // 默认进来的性别文字
			validError: false, // 用户提交之后验证信息是否是成功的
			validTxt: '', // 用户验证失败的错误信息
			curSelectOrgObj: null, // 当前选中的击缶信息
		}
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


	// 全局变量player 的信息改变的时候
	onPlayerStatusChange: function(playerInfo) {
		var that = this;
		this.setState({
			playerInfo: playerInfo,
			curSexData: playerInfo.sex ? playerInfo.sex : 0,
			curSexTxt: playerInfo.sex ? (playerInfo.sex == 1 ? '男' : '女') : '请选择性别',
			curOrgId: playerInfo.oid ? playerInfo.oid : 0, // 获取用户的信息,机构用户肯定是有oid 的,否则的话就是无机构的用户,oid  是0
			curOrgName: playerInfo.organization_name ? playerInfo.organization_name : '无机构',
		}, function() {
			if (playerInfo) {
				that.setState({
					id: that.state.curOrgId,
					name: that.state.curOrgName,
				})
				console.log('当前用户的信息是: ------ ', playerInfo)
				document.getElementById('username').value = playerInfo.realname ? playerInfo.realname : playerInfo.nickname;
				document.getElementById('telphone').value = playerInfo.tel;
				document.getElementById('age').value = playerInfo.age;
				document.getElementById('job').value = playerInfo.job;
			};

			// weixin.setup(function() {
				// alert('weixin is setup!');
				weixin.forbidSharing();
			// });
			
		})
	},

	// 获取用户身份信息验证的信息
	onPlayerValidInfoStatusChange: function(validError, validTxt) {

		var that = this;

		this.setState({
			validError: validError,
			validTxt: validTxt
		}, function() {
			console.log(' 当前验证的信息是 : ----- ', that.state.validError);
		})
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);
		
		// 监听机构列表组件中选中的对象信息
		this.unsubscribe = OrgDataStore.listen(this.onSelectOrgStatusChange);

		// 去获取用户验证十分信息的信息
		this.unsubscribe = ActivitySignUpStore.listen(this.onPlayerValidInfoStatusChange);

		var h=$(window).height();
	    $(window).resize(function() {
	        if($(window).height()<h){
	            $('.base-btn').hide();
	        }
	        if($(window).height()>=h){
	            $('.base-btn').show();
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

		showValidError.display = this.state.validError ? 'block' : 'none';

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
								<label className="weui_label">姓名<i className="must">(必填)</i></label>
								<input className="weui_input" id="username" onFocus={this._hiddenErrorTip} placeholder="请输入姓名"/>
							</div>
						</div>
					</div>
					<div className="info-item">
						<div className="weui_cell">
							<div className="weui_cell_hd">
								<label className="weui_label">电话<i className="must">(必填)</i></label>
								<input className="weui_input" type="number" pattern="[0-9]*" id="telphone" onFocus={this._hiddenErrorTip} placeholder="请输入手机号"/>
							</div>
						</div>
					</div>
					<div className="info-item">
						<div className="weui_cell setting-item" onClick={this._showSexChooseModal}>
							<div className="weui_cell_hd">
								<label className="weui_label">性别<i className="must">(选填)</i></label>
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
								<label className="weui_label">年龄<i className="must">(选填)</i></label>
								<input className="weui_input" type="number" pattern="[0-9]*" id="age" placeholder="请输入年龄"/>
							</div>
						</div>
					</div>
					<div className="info-item">
						<div className="weui_cell">
							<div className="weui_cell_hd">
								<label className="weui_label">职业<i className="must">(选填)</i></label>
								<input className="weui_input" id="job" placeholder="请输入职业"/>
							</div>
						</div>
					</div>
				</div>
				<div className="base-btn" onClick={this._submitSignUpData}>确认</div>
				<div className="tip-toast" id="submitSuccess">
					<img className="tip_icon_toast" src="../../assets/img/ok.png" />
					<p className="tip-toast-content" id="submitState">提交成功</p>
				</div>
				<div className="choose-modal sex-choose-modal">
					<div className="modal-bg" onClick={this._hideChooseModal}></div>
					<div className="choose-wrap">
						<p className="choose-item" data-sex="1" onClick={this._chooseSexItem}>男</p>
						<p className="choose-item" data-sex="2" onClick={this._chooseSexItem}>女</p>
					</div>
				</div>
				<OrgsList />
				<div className="valid-error" style={showValidError}>
					<div className="toast-content">
						<img className="tip-warn-img" src="../../assets/img/warn.png" /> 
						<p className="valid-info"> {this.state.validTxt}</p>
						<div className="toast-footer flex-container">
							<span className="bar-item" onClick={this._resetSignUpData}>重新报名</span>
							<a className="bar-item" href={ToolFactory.checkUrlPath(ToolFactory.getUrlPath(window.location.href) + 'index.html')}> 返回活动列表    </a>
						</div>
					</div>
					
				</div>
			</section>
		)
	},

	/* /submit the sign up data*/
	_submitSignUpData: function (event) {
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
			oid: curOID,
		};
		
		this.setState({
			disabled: true,
		});

		if (global.player && global.player.id && parseInt(pid) !== parseInt(global.player.id)) {
			alert('global.player.id +  ' + global.player.id);
			alert('您不能提交别人的验证信息！');
			return;
		}

		console.log('打印当前提交的数据是：----- ', signUpData);
		ActivitySignUpActions.submitSignUpData(signUpData);
	},

	// 验证失败之后重新验证该用户的信息
	_resetSignUpData: function() {
		var that = this;
		this.setState({
			//  重新体积哦啊报名信息，隐藏该弹框
			validError: false,
			curOrgId: 0, // 初始化默认的是无机构的ID （1）
			curOrgName: '无机构', // 默认进来的机构名称是无机构
			disabled: false, // 放开提交按钮的禁用
		}, function() {
			var newObj = {
				id: 0,
				name: '无机构'
			};
			that.setState({
				curSelectOrgObj: newObj
			});
		});

	},

	_hiddenErrorTip: function (event) {
		this.setState({
			warnTxt: '',
		})
		$('.tip-warn').removeClass('active-tip-warn');
	},


	// 显示性别的选择弹框
	_showSexChooseModal: function() {
		console.log('点击了选择性别');
		$('.sex-choose-modal').addClass('show-modal');
		setTimeout(function() {
			$('.choose-modal').addClass('active-modal');
		}, 100);
	},

	// 显示机构选择的下拉列表
	_showOrgSelectList: function() {
		$('.org-select').addClass('show-modal');
		setTimeout(function() {
			$('.org-select').addClass('active-modal');
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

	// 点击隐藏modal
	_hideChooseModal: function() {
		$('.choose-modal').removeClass('active-modal');
		setTimeout(function() {
			$('.choose-modal').removeClass('show-modal');
		}, 100);
	},

	// 返回上一级
	_goPrevPage: function() {
		history.go(-1);
	}

});

module.exports = ActivitySignUp;