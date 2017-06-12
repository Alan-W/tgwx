var React = require('react');
var ReactDOM = require('react-dom');
//var injectTapEventPlugin = require('react-tap-event-plugin');
//injectTapEventPlugin();
var $ = require("jquery");
var myDropLoad = require('../../core/components/Dropload.js');

var global = require('../../core/factories/GlobalFactory');
var ToolFactory = require('../../core/factories/ToolFactory');

var LoginActions = require('./LoginActions.js');



//辅导员
var ActivitiesAdmin = require('./ActivitiesList.js');
var ActInfo = require('./ActInfo.js');
var ActApply = require('./ActApply.js');
var ActJoined = require('./ActJoined.js');
var ResultInput = require('./ResultInput.js');
var ResultSubmit = require('./ResultSubmit.js');
var ResultRank = require('./ResultRank.js');

var PartierAdd = require('./PartierAdd.js');
var PartierManage = require('./PartierManage.js');

var CoachInfo = require('./CoachInfo.js');

ToolFactory.setFontBaseSize();
// 获取用户的登陆信息
LoginActions.tryLogin();

if(document.getElementById('activiesList')){
    ReactDOM.render(<Activitieslist/>,
        document.getElementById('activiesList')
    );  
}

else if(document.getElementById('activiesListadmin')){
    ReactDOM.render(<ActivitiesAdmin/>,
        document.getElementById('activiesListadmin')
    );  
}
else if(document.getElementById('actInfo')){
    ReactDOM.render(<ActInfo />,
        document.getElementById('actInfo')
    )
}

else if(document.getElementById('actApply')){
    ReactDOM.render(<ActApply />,
        document.getElementById('actApply')
    )
}

else if(document.getElementById('actJoined')){
    ReactDOM.render(<ActJoined />,
        document.getElementById('actJoined')
    )
}

else if(document.getElementById('resultinput')){
    ReactDOM.render(<ResultInput />,
        document.getElementById('resultinput')
    )
}

else if(document.getElementById('resultsubmit')){
    ReactDOM.render(<ResultSubmit />,
        document.getElementById('resultsubmit')
    )
}

else if(document.getElementById('resultrank')){
    ReactDOM.render(<ResultRank/>,
        document.getElementById('resultrank')
    )
}

else if(document.getElementById('participadd')){
    ReactDOM.render(<PartierAdd/>,
        document.getElementById('participadd')
    )
}

else if(document.getElementById('participmanage')){
    ReactDOM.render(<PartierManage/>,
        document.getElementById('participmanage')
    )
}

else if(document.getElementById('coachinfo')){
    ReactDOM.render(<CoachInfo/>,
        document.getElementById('coachinfo')
    )
}
