var React = require('react');
var ReactDOM = require('react-dom');

var LoginActions = require('./core/actions/LoginActions.js');
var LoginStore = require('./core/factories/LoginStore.js');
var myDropLoad = require('./core/components/Dropload.js');
var ToolFactory = require('./core/factories/ToolFactory');

// 活动列表部分的
// var Activitieslist = require('./components/activity/ActivitiesList.js')
// var ActivityDetails = require('./components/activity/ActivityDetails.js');
// var ActivitySignUp = require('./components/activity/ActivitySignUp.js');
// var PersonHomePage = require('./components/activity/PersonHomePage.js');
// var CitiesList = require('./components/activity/CitiesList.js');
// var ChallengeShare = require('./components/activity/ChallengeShare.js');
// var OrgPlayerSubmitScore = require('./components/activity/OrgPlayerSubmitScore.js');

// 玩儿家部分
// var PlayerIndex = require('./components/player/PlayerIndex.js');
// var PlayerDataSetting = require('./components/player/PlayerDataSetting.js');
// var IdentifyVerify = require('./components/player/IdentifyVerify.js');
// var MyActivitiesList = require('./components/player/MyActivitiesList.js');
// var MyActDetails = require('./components/player/MyActivityDetails.js');
// var MyOrgActDetails = require('./components/player/MyOrgActDetails.js');
// var MyRankList = require('./components/player/MyRankList.js');
// var MyMessageList = require('./components/player/MyMessageList.js');
// var MsgDetail = require('./components/player/MsgDetail.js');
// var ChallengeList = require('./components/player/ChallengeList.js');
// var MyChallenge = require('./components/player/MyChallenge.js');
// var ChallengeScore = require('./components/player/ChallengeScore.js');
// var MyScore = require('./components/player/MyScore.js');
// var ChallengeDetails = require('./components/player/ChallengeDetails.js');
// var weixin = require('../core/factories/WeixinFactory.js');


// 获取用户的登陆信息
LoginActions.tryLogin();

// 设置适配字体大小
ToolFactory.setFontBaseSize();


if (document.getElementById('activiesList')) {
	var Activitieslist = require('./components/activity/ActivitiesList.js')
	ReactDOM.render(<Activitieslist/>,
		document.getElementById('activiesList')
	);
} else if (document.getElementById('activityDetails')) {
	var ActivityDetails = require('./components/activity/ActivityDetails.js');
	ReactDOM.render(<ActivityDetails/>,
		document.getElementById('activityDetails')
	);
} else if (document.getElementById('activitySignUp')) {
	var ActivitySignUp = require('./components/activity/ActivitySignUp.js');
	ReactDOM.render(<ActivitySignUp/>,
		document.getElementById('activitySignUp')
	)
} else if (document.getElementById('citiesList')) {
	var CitiesList = require('./components/activity/CitiesList.js');
	ReactDOM.render(<CitiesList/>,
		document.getElementById('citiesList')
	)
} else if (document.getElementById('orgPlayerSubmitScore')) {
	var OrgPlayerSubmitScore = require('./components/activity/OrgPlayerSubmitScore.js');
	ReactDOM.render(<OrgPlayerSubmitScore/>,
		document.getElementById('orgPlayerSubmitScore')
	)
} else if (document.getElementById('playerIndex')) {
	var PlayerIndex = require('./components/player/PlayerIndex.js');
	ReactDOM.render(<PlayerIndex/>,
		document.getElementById('playerIndex')
	)
} /*else if (document.getElementById('playerDataSet')) {
	ReactDOM.render(<PlayerDataSetting/>,
		document.getElementById('playerDataSet')
	)
} */else if (document.getElementById('identitfyVerify')) {
	var IdentifyVerify = require('./components/player/IdentifyVerify.js');
	ReactDOM.render(<IdentifyVerify/>,
		document.getElementById('identitfyVerify')
	)
} else if (document.getElementById('myActsList')) {
	var MyActivitiesList = require('./components/player/MyActivitiesList.js');
	ReactDOM.render(<MyActivitiesList/>,
		document.getElementById('myActsList')
	)
} else if (document.getElementById('myActDetails')) {
	ReactDOM.render(<MyActDetails/>,
		document.getElementById('myActDetails')
	)
} else if (document.getElementById('myOrgActDetails')) {
	var MyOrgActDetails = require('./components/player/MyOrgActDetails.js');
	ReactDOM.render(<MyOrgActDetails/>,
		document.getElementById('myOrgActDetails')
	)
}  else if (document.getElementById('myRankList')) {
	var MyRankList = require('./components/player/MyRankList.js');
	ReactDOM.render(<MyRankList/>,
		document.getElementById('myRankList')
	)
} else if (document.getElementById('myMessagelist')) {
	var MyMessageList = require('./components/player/MyMessageList.js');
	ReactDOM.render(<MyMessageList/>,
		document.getElementById('myMessagelist')
	)
} else if (document.getElementById('msgDetail')) {
	var MsgDetail = require('./components/player/MsgDetail.js');
	ReactDOM.render(<MsgDetail/>,
		document.getElementById('msgDetail')
	)
} else if (document.getElementById('challengeList')) {
	var ChallengeList = require('./components/player/ChallengeList.js');
	ReactDOM.render(<ChallengeList/>,
		document.getElementById('challengeList')
	)
} else if (document.getElementById('myChallenge')) {
	var MyChallenge = require('./components/player/MyChallenge.js');
	ReactDOM.render(<MyChallenge/>,
		document.getElementById('myChallenge')
	)
} else if (document.getElementById('challengeScore')) {

	var ChallengeScore = require('./components/player/ChallengeScore.js');
	ReactDOM.render(<ChallengeScore/>,
		document.getElementById('challengeScore')
	)
} else if (document.getElementById('myScore')) {
	var MyScore = require('./components/player/MyScore.js');
	ReactDOM.render(<MyScore/>,
		document.getElementById('myScore')
	)
} else if (document.getElementById('challengeShare')) {
	var ChallengeShare = require('./components/activity/ChallengeShare.js');
	ReactDOM.render(<ChallengeShare/>,
		document.getElementById('challengeShare')
	)
} else if (document.getElementById('challengeDetails')) {
	var ChallengeDetails = require('./components/player/ChallengeDetails.js');
	ReactDOM.render(<ChallengeDetails/>,
		document.getElementById('challengeDetails')
	)
}
	
