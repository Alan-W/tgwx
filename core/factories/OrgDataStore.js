var Reflux = require('reflux');
var OrgDataActions = require('../actions/OrgDataActions.js');
var $ = require('jquery');
var global = require('../factories/GlobalFactory.js');

var OrgsListStore = Reflux.createStore({
	orgsList: [],
	listenables: [OrgDataActions],
	curSelectOrObj: null, // 返回当前选中的机构的对象信息
	level: 1, // 机构数据级别的初始化
	onGetOrgsList: function() {
		var that = this;
		$.ajax({
			url: 'https://tg-api.taiyuansport.com/',
			type: 'GET',
			data: {
				r: 'activity/static',
				expand: 'getOrganizationList'
			},
		})
		.done(function(resp) {
			console.log("OrgDataStore.js- ----- onGetOrgsList :success()", resp);
			console.log('获取所有的机构看列表的数据成功过的返回值是: ----- ', resp);
			if (resp.getOrganizationList && resp.getOrganizationList.success) {
				that.orgsList = resp.getOrganizationList.data;
				// 重构当前的机构数据,加入level的值
				that.formatOrgsData(that.orgsList);
				
			}
		})
		.fail(function(x, h, r) {
			console.log("OrgDataStore.js- ------onGetOrgsList: error()", x);
		});
	},

	// 重构当前的机构数据
	formatOrgsData: function(data) {
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			item.level = this.level;
			if (item.child && item.child.length > 0) {
				this.level++;
				this.formatOrgsData(item.child);
			}
		};
		
		this.trigger(this.orgsList);
	},

	// return 当前选中的机构OBJ
	onGetCurSelectOrgObj: function(selectObj) {
		console.log('actions 中的数据是: ----- ', selectObj);
		this.curSelectOrObj = selectObj;
		this.trigger(this.orgsList, this.curSelectOrObj);
	}

});

module.exports = OrgsListStore;