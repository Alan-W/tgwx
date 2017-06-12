var React = require('react');
var Reflux = require('reflux');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');
var OrgDataActions = require('../../core/actions/OrgDataActions.js');
var OrgDataStore = require('../../core/factories/OrgDataStore.js');


var OrgsList = React.createClass({
	mixins: [Reflux.connect(OrgDataStore, 'orgsList')],
	getInitialState: function () {
		return {
			orgsList: [],
			showOrgsList: [], // 当前显示的机构列表
			levelsArray: [], // 机构列表的所有层级
			selectOrgObj: null, // 当前选中的机构的信息对象
		}
	},

	onMyOrgsListDataChange: function(orgsList) { // 这里是因为在Store 中有两个变量，trigger 的时候也是分开的,但是监听的时候整个store 会返回所有的数据(数组的格式)
		this.setState({
			orgsList: orgsList, // 对应store 中的,orgsList 是第一个变量
			showOrgsList: orgsList,
			levelsArray: [{parent_id: null, id: null, name: '一级机构', level: 1}],
		})
	},

	componentDidMount: function () {

		OrgDataActions.getOrgsList();

		// 监听我的活动的数据的变化
		this.unsubscribe = OrgDataStore.listen(this.onMyOrgsListDataChange);

	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		return (
			<div className="choose-modal org-select">
				<div className="modal-bg" onClick={this._hideChooseModal}></div>
				<div className="choose-wrap">
					<div className="choose-title">
						<span className="cancel-choose" onClick={this._cancelChooseOrg}>取消</span>
						所属机构
						<span className="confirm-choose" onClick={this._confirmChooseOrg}>确定</span>
					</div>
					<div className="org-choose-bar flex-container">
						{
							this.state.levelsArray.map(this._initLevelItem)
						}
						
					</div>
					<div className="orgsLevelList-wrap">
						<ul className="select-list oneLevel">
							{ this.state.showOrgsList.map(this._initOrgsList) }
						</ul>
					</div>
				</div>
			</div>
		)
	},

	/* /点击取消选择机构*/
	_cancelChooseOrg: function() {
		var that = this;
		var playerInfo = global.player;
		this._hideChooseModal();

		this.setState({
			curOrgId:  (playerInfo.oid &&  playerInfo.oid == 0) ? 0 :  playerInfo.oid, // 当前用户所在的机构
			curOrgName: playerInfo.organization_name ? playerInfo.organization_name : '无机构', // 当前用户所在的机构的名称, 需要自动去补全的
		}, function() {
			OrgDataActions.getCurSelectOrgObj({id: that.state.curOrgId, name: that.state.curOrgName});
		});

	},

	// 点击隐藏modal
	_hideChooseModal: function() {
		$('.choose-modal').removeClass('active-modal');
		setTimeout(function() {
			$('.choose-modal').removeClass('show-modal');
		}, 100);

		
	},

	// 点击确定选择当前选中的机构信息
	_confirmChooseOrg: function() {
		this._hideChooseModal();

		OrgDataActions.getCurSelectOrgObj({id: this.state.curOrgId, name: this.state.curOrgName});
		// 数据重新初始化
		this.setState({
			curOrgId:  (global.player.oid &&  global.player.oid == 0) ? 0 :  global.player.oid, // 当前用户所在的机构
			curOrgName: global.player.organization_name ? global.player.organization_name : '无机构', // 当前用户所在的机构的名称, 需要自动去补全的
		});
	},

	// 初始化机构选择列表的下拉
	_initOrgsList: function (item, index) {
		return (
			<li className="org-item select-item" data-parent-id={item.parent_id} data-id={item.id} key={index} onClick={this._changeOrgsList}> {item.name} </li>
		)
	},

	/*  /点击某机构，去遍历当前机构下的自机构 */
	_changeOrgsList: function(event) {
		var that = this;

		// 当前点击的机构ID 
		var orgId = parseInt(event.target.getAttribute('data-id'));
		if (!orgId) return;
		
		var curOrgObj = this._getChildOrg(orgId);
		console.log('_changeOrgsList ---- -curOrgObj: ------- ', curOrgObj);

		// 去设置当前的title bar
		this._changeCurOrgTitleData(curOrgObj);

		// 更新当前选择的机构ID
		this.setState({
			curOrgId: orgId,
			curOrgName: curOrgObj.name,
		});

		// 最后一层了,隐藏蒙版，数据设置为初始化后数据
		if (curOrgObj.child.length == 0) { 
			this._hideChooseModal();
			var la = [{parent_id: null, name: '一级机构', id: null, level: 1}];
			this.setState({
				showOrgsList: that.state.orgsList,
				curLevel: 1,
				levelsArray: la,
			}, function() {
				OrgDataActions.getCurSelectOrgObj(curOrgObj);
			})
			return false;
		}

		this.setState({
			showOrgsList: curOrgObj.child ? curOrgObj.child : [],
			curLevel: curOrgObj.level + 1, // 每点击一次当前的层级加1
		}, function() {
			if (curOrgObj.child.length > 0) {
				var levelArrays = that.state.levelsArray.slice();
				levelArrays.push({parent_id: null, name: global.orgsLevelMap[that.state.curLevel]+'级机构', id: null, level: that.state.curLevel});
				that.setState({
					levelsArray: levelArrays 
				})
			}
		});

 	},


	// / 初始化 机构标题
	_initLevelItem: function(items, index) {
		var barClassName = "bar-item ";
		console.log(' the cur level is : ---- ', this.state.curLevel);
		if (items.level == this.state.curLevel) {
			barClassName += "bar-item-active"
		};

		if (index == 0 && items.name == '一级机构') {
			barClassName += "bar-item-active";
		}
		
		return (
			<span className={barClassName} key={index} data-parent-id={items.parent_id} data-id={items.id} data-level={items.level} onClick={this._showThisOrgsList}>{items.name}</span>
		)
	},


	/* / 点击显示具体机构下的子机构列表*/
	_showThisOrgsList: function (event) {
		// 当前点击的机构级别
		var that = this;
		var curOrgId= event.target.getAttribute('data-id');
		if (!curOrgId) return;
		console.log('当前点击的元素的child 是: ------ ', curOrgId);
		var curOrgObj = this._getChildOrg(curOrgId, this.state.orgsList);
		console.log(' the orgsList = ', this.state.orgsList);
		console.log('当前点击的机构的curOrgObj是: ------ ', curOrgObj);

		this.setState({
			curOrgId: curOrgId,
			curOrgName: curOrgObj.name,
		});

		this.setState({
			showOrgsList: curOrgObj.child ? curOrgObj.child : [],
			curLevel: parseInt(curOrgObj.level) + 1, //当前点击的level
		}, function() {
			// 去设置当前的title bar
			that._changeCurOrgTitleData(curOrgObj, true);
		});
		
	},

	// 设置当前选中的标题信息
	_changeCurOrgTitleData: function(curOrgObj, isPrev) { // isPrev表示是回退的
		var levelsArray = this.state.levelsArray.slice();
		if (isPrev) { // 当前是回退
			levelsArray.length = this.state.curLevel - 1;
			levelsArray.push({parent_id: null, name: global.orgsLevelMap[this.state.curLevel]+'级机构', id: null, level: this.state.curLevel})
		} else {
			for (var i = 0; i < levelsArray.length; i++) {
				var lt = levelsArray[i];
				console.log(' the lt is : ------ ', lt);
				if (lt.level == curOrgObj.level) {
					lt.name = curOrgObj.name;
					lt.id = curOrgObj.id;
					lt.parent_id = curOrgObj.parent_id;
					lt.child = curOrgObj.child;
					break;
				}
			};
		}

		this.setState({
			levelsArray: levelsArray,
		});
	},

	// 返回相应的子机构列表数据
	_getChildOrg: function(id, wholeList) {
		var list = wholeList ? wholeList : this.state.showOrgsList;
		for (var i = 0; i < list.length; i++) {
			var orgItem = list[i];
			if (orgItem.id == id) {
				this.returnObj = orgItem;
				break;
			} else {
				if (orgItem.child && orgItem.child.length > 0) {
					this._getChildOrg(id, orgItem.child);
				};
			}

		};

		return this.returnObj;

	},


});

module.exports = OrgsList;