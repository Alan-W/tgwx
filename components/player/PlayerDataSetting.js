var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');

var PlayerDataSetting = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo')],
	getInitialState: function () {
		return {
			playerInfo: null,
		}
	},

	onPlayerStatusChange: function(playerInfo) {

		var that = this;
		this.setState({
			playerInfo: playerInfo,
			showEditNickname: false, // 当前是否显示编辑昵称
			showEditPersonExplain: false, // 当前是否显示编辑个性签名
			showEditTel: false, // 当前是否显示编辑手机号
		}, function () {
			that._initTimePlugin();
			if (playerInfo) {
				var explain = (this.state.playerInfo && this.state.playerInfo.explain) ? this.state.playerInfo.explain : '';
				console.log(' the explain is : ------ ', explain);
				$('#explainValue')[0].value = explain;
			}
		})
		
	},

	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		var explain = (this.state.playerInfo && this.state.playerInfo.explain) ? this.state.playerInfo.explain : '';
		console.log(' the explain is : ------ ', explain);
		$('#explainValue')[0].value = explain;

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {

		var sexValue = (this.state.playerInfo && this.state.playerInfo.sex) ? ((parseInt(this.state.playerInfo.sex) == 1) ? '男' : '女') : '点击设置';

		var showEditNicknameStyle = {
			disply: 'none'
		};
		var showEditPersonExplainStyle = {
			disply: 'none'
		};
		var showEditTelStyle = {
			display: 'none'
		};

		showEditNicknameStyle.display = this.state.showEditNickname ? 'block' : 'none';
		showEditPersonExplainStyle.display = this.state.showEditPersonExplain ? 'block' : 'none';
		showEditTelStyle.display = this.state.showEditTel ? 'block' : 'none';

		return (
			
			<section className="player-data-set">
				<div className="base-set-wrap">
					<div className="head-bar has-border">
						<span className="prev-arrow"  onClick={this._goPrevPage}>
							<span className="back"></span>
						</span>
						<span className="page-title">个人资料</span>
					</div>
					<div className="setting-wrap">
						<div className="setting-item head-img-set">
							<span className="set-label"> 头像 </span>
							<span className="head-img-scan set-value">
								<img src={this.state.playerInfo && this.state.playerInfo.headimgurl ? this.state.playerInfo.headimgurl : global.defHeadUrl} className="head-img" />
							</span>
						</div>
						<div className="setting-item" onClick={this._showNickNameModal}>
							<span className="set-label"> 昵称 </span>
							<span className="set-value">{this.state.playerInfo && this.state.playerInfo.nickname ? this.state.playerInfo.nickname : ''}</span>
						</div>
						<div className="setting-item" onClick={this._showSexChooseModal} >
							<span className="set-label"> 性别 </span>
							<span className="set-value" id="sexData">{sexValue}</span>
						</div>
						<div className="setting-item" id="showBirthday">
							<span className="set-label"> 生日 </span>
							<span className="set-value" id="editBirthday">{this.state.playerInfo && this.state.playerInfo.birthday ? this.state.playerInfo.birthday : '点击设置'}</span>
						</div>
						<div className="setting-item" onClick={this._showTelModal}>
							<span className="set-label"> 电话 </span>
							<span className="set-value">{this.state.playerInfo && this.state.playerInfo.tel ? this.state.playerInfo.tel : ''}</span>
						</div>
						<div className="setting-item person-explain" onClick={this._showPersonExplainModal}>
							<span className="set-label"> 个人说明 </span>
							<span className="set-value">{this.state.playerInfo && this.state.playerInfo.explain ? this.state.playerInfo.explain : ''}</span>
						</div>
					</div>
					<div className="choose-modal">
						<div className="modal-bg" onClick={this._hideChooseModal}></div>
						<div className="choose-wrap">
							<p className="choose-item" data-sex="1" onClick={this._chooseSexItem}>男</p>
							<p className="choose-item" data-sex="2" onClick={this._chooseSexItem}>女</p>
						</div>
					</div>
				</div>
				<div className="edit-nickname-wrap slide-modal">
					<div className="head-bar has-border">
						<span className="prev-arrow"  onClick={this._showBaseSettingPage}>
							<span className="back"></span>
						</span>
						<span className="page-title">昵称</span>
					</div>
					<p className="set-title title-bar">
						<i className="bar-icon"></i>
						<span className="title-txt">昵称(0-10)</span>
					</p>
					<p className="nickname-input">
						<input className="hori-input" type="text"  id="nicknameValue" placeholder="昵称"  maxLength={10}/>
					</p>
					<div className="base-btn" style={showEditNicknameStyle} data-prop="nickname" onClick={this._submitPersonData}>确认</div>
				</div>

				<div className="edit-tel-wrap slide-modal">
					<div className="head-bar has-border">
						<span className="prev-arrow"  onClick={this._showBaseSettingPage}>
							<span className="back"></span>
						</span>
						<span className="page-title">手机号</span>
					</div>
					<p className="set-title title-bar">
						<i className="bar-icon"></i>
						<span className="title-txt">手机号</span>
					</p>
					<div className="tip-warn"> </div>
					<p className="nickname-input">
						<input className="hori-input" type="number"  id="telValue" placeholder="手机号"  maxLength={10} onFocus={this._hideWarnTip}/>
					</p>
					<div className="base-btn" style={showEditTelStyle} data-prop="tel" onClick={this._submitPersonData}>确认</div>
				</div>

				<div className="edit-person-explain-wrap slide-modal">
					<div className="head-bar has-border">
						<span className="prev-arrow"  onClick={this._showBaseSettingPage}>
							<span className="back"></span>
						</span>
						<span className="page-title">个人说明</span>
					</div>
					<p className="set-title title-bar">
						<i className="bar-icon"></i>
						<span className="title-txt">个人说明(0-20)</span>
					</p>
					<p className="nickname-input">
						<textarea className="hori-textarea" id="explainValue" maxLength={20} defaultValue=""></textarea>
					</p>
					<div className="base-btn" style={showEditPersonExplainStyle} onClick={this._submitPersonData} data-prop="explain">确认</div>
				</div>
			</section>
		)
	},

	// / 返回上一页
	_goPrevPage: function () {
		history.go(-1);
	},

	// 点击隐藏modal
	_hideChooseModal: function() {
		$('.choose-modal').removeClass('active-modal');
		setTimeout(function() {
			$('.choose-modal').removeClass('show-modal');
		}, 100);
	},

	// 点击编辑昵称
	_showNickNameModal: function () {
		$('.edit-nickname-wrap').addClass('show-slice-modal');
		$('.base-set-wrap').css('display', 'none');
		this.setState({
			showEditNickname: true,
		});
	},

	// 点击编辑手机号
	_showTelModal: function () {
		$('.edit-tel-wrap').addClass('show-slice-modal');
		$('.base-set-wrap').css('display', 'none');
		this.setState({
			showEditTel: true,
		});
	},

	// 点击编辑个人说明
	_showPersonExplainModal: function () {
		$('.edit-person-explain-wrap').addClass('show-slice-modal');
		$('.base-set-wrap').css('display', 'none');
		this.setState({
			showEditPersonExplain: true,
		});
	},

	// 返回主设置页面
	_showBaseSettingPage: function () {
		$('.show-slice-modal').removeClass('show-slice-modal');
		$('.base-set-wrap').css('display', 'block');
		this.setState({
			showEditNickname: false,
			showEditTel: false,
			showEditPersonExplain: false,
		});
	},

	// 点击选择性别数据
	_chooseSexItem: function(event) {
		console.log('当前点击的新别选项是: - ---- ', event.target.getAttribute('data-sex'));
		var sex = parseInt(event.target.getAttribute('data-sex'));
		document.getElementById('sexData').innerHTML = (sex == 1 ? '男' : '女');
		$('.choose-modal').removeClass('active-modal');
		setTimeout(function() {
			$('.choose-modal').removeClass('show-modal');
		}, 100);
	},

	// 隐藏警告提示
	_hideWarnTip: function () {
		$('.tip-warn').removeClass('active-tip-warn');
	},

	// 显示性别的选择弹框
	_showSexChooseModal: function() {
		console.log('点击了选择性别');
		$('.choose-modal').addClass('show-modal');
		setTimeout(function() {
			$('.choose-modal').addClass('active-modal');
		}, 100);

	},

	// 提交用户编辑的数据
	_submitPersonData: function (event) {
		var prop = event.target.getAttribute('data-prop');
		var value = $('#'+prop+'Value').val();
		console.log('当前编辑的属性类型是: ------ ', prop);
		console.log('当前编辑的属性的值是： ----- ', value);

		if (prop == 'tel') {
			if (!ToolFactory.checkPhoneNumber(value)) {
				$('.tip-warn').addClass('active-tip-warn');
				$('.tip-warn').html(' 请输入合法的手机号! ');
			};
			return false;
		};

		// 提交修改个人信息的数据
	},

	// 初始化时间选择插件
	_initTimePlugin: function () {
		var selectDateDom = $('#showBirthday');
	    var showDateDom = $('#editBirthday');
	    // 初始化时间
	    var now = new Date();
	    var nowYear = now.getFullYear();
	    var nowMonth = now.getMonth() + 1;
	    var nowDate = now.getDate();
	    showDateDom.attr('data-year', nowYear);
	    showDateDom.attr('data-month', nowMonth);
	    showDateDom.attr('data-date', nowDate);
	    // 数据初始化
	    function formatYear (nowYear) {
	        var arr = [];
	        for (var i = nowYear - 100; i <= nowYear; i++) {
	            arr.push({
	                id: i + '',
	                value: i + '年'
	            });
	        }
	        return arr;
	    }
	    function formatMonth () {
	        var arr = [];
	        for (var i = 1; i <= 12; i++) {
	            arr.push({
	                id: i + '',
	                value: i + '月'
	            });
	        }
	        return arr;
	    }
	    function formatDate (count) {
	        var arr = [];
	        for (var i = 1; i <= count; i++) {
	            arr.push({
	                id: i + '',
	                value: i + '日'
	            });
	        }
	        return arr;
	    }
	    var yearData = function(callback) {
	        callback(formatYear(nowYear))
	    }
	    var monthData = function (year, callback) {
	        callback(formatMonth());
	    };
	    var dateData = function (year, month, callback) {
	        if (/^(1|3|5|7|8|10|12)$/.test(month)) {
	            callback(formatDate(31));
	        }
	        else if (/^(4|6|9|11)$/.test(month)) {
	            callback(formatDate(30));
	        }
	        else if (/^2$/.test(month)) {
	            if (year % 4 === 0 && year % 100 !==0 || year % 400 === 0) {
	                callback(formatDate(29));
	            }
	            else {
	                callback(formatDate(28));
	            }
	        }
	        else {
	            throw new Error('month is illegal');
	        }
	    };
	    selectDateDom.bind('click', function () {
	        var oneLevelId = showDateDom.attr('data-year');
	        var twoLevelId = showDateDom.attr('data-month');
	        var threeLevelId = showDateDom.attr('data-date');
	        var iosSelect = new IosSelect(3, 
	            [yearData, monthData, dateData],
	            {
	                title: '日期选择',
	                itemHeight: 35,
	                relation: [1, 1],
	                oneLevelId: oneLevelId,
	                twoLevelId: twoLevelId,
	                threeLevelId: threeLevelId,
	                callback: function (selectOneObj, selectTwoObj, selectThreeObj) {
	                    showDateDom.attr('data-year', selectOneObj.id);
	                    showDateDom.attr('data-month', selectTwoObj.id);
	                    showDateDom.attr('data-date', selectThreeObj.id);
	                    showDateDom.html(selectOneObj.value.replace('年','.') + ' ' + selectTwoObj.value.replace('月','.') + ' ' + selectThreeObj.value.replace('日',''));
	                }
	        });
	    });
	}

});

module.exports = PlayerDataSetting;