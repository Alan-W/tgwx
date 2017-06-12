var Reflux = require('reflux');

var OrgDataActions = Reflux.createActions([
	'getOrgsList', // 获取所有的机构列表信息
	'getCurSelectOrgObj', // 返回当前选中的机构的信息对象
]);
/**/

module.exports = OrgDataActions;