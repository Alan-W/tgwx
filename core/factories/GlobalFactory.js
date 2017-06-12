var configs = require("../../../config/configs");
console.log(' the configs is : ------- ', configs);
var assign = require('object-assign');


var global = assign({},
	{
		player: null,
	    scrn: {
	    	defaultSize:{w:640,h:1008},
	        size: { w: 0, h: 0 },
	        aspect: 1,
	        scale: {w:1,h:1},
	        resize: function() {
	            this.size.w = window.innerWidth;
	            this.size.h = window.innerHeight;
	            if(typeof this.size.w != 'number'){
	                if(document.compatMode == 'CSS1Compat'){
	                    this.size.w = document.documentElement.clientWidth;
	                    this.size.h = document.docuementElement.clientHeight;
	                }else{
	                    this.size.w = document.body.clientWidth;
	                    this.size.h = document.body.clientHeight;
	                }
	            }
	            this.scale.w = this.size.w/this.defaultSize.w;
	            this.scale.h = this.size.h / this.defaultSize.h;
	            this.aspect = this.size.w / this.size.h;//宽高比
	            console.log("global size",this);
	        }
	    },
	    projectName:'太原全民健身系统',
	    pageName:{page1:'活动列表页',page2:'活动详情页',page3:'活动报名页',page4:'辅导员登录页',page5:'个人中心页',page6:'个人中心消息页',page7:'个人中心我的活动页',page8:'个人中心我的关注页',page9:'个人中心我的收藏页',page10:'个人中心我的粉丝页',page11:'个人中心我的资料页',page12:'成绩录入页',page13:'辅导员申请页',page14:'活动详情分享页',page15:'挑战分享页'},
	    localResUrl: 'http://tg-admin.self.net/upload/',
	    resUrl: 'http://7xj9u3.com2.z0.glb.qiniucdn.com/',
	    defHeadUrl: '../../assets/img/def-head.png',
	    defActUrl: '../../../assets/img/act-default.png',
	    appId: 'wx4b2ea450223f24c3',
	    shareLogo: configs.appUrl + 'tgwx-app/assets/img/tgwx-logo.png',
	    debugging: function(){
	        return this.debugLv != null && this.debugLv === 2;
	    },
	    testing: function(){
	        return this.debugLv != null && this.debugLv === 1;
	    },
	    formalMode: function(){
	        return !this.debugging() && !this.testing() && !this.preving();
	    },
	    preving: function(){
	    	return this.debugLv !=null && this.debugLv == 3;
	    },
	    testMode: function(){
	        if(this.debugging())
	            return "调试";
	        else if(this.testing())
	            return "测试";
	        else if(this.preving()){
	        	return "预发布";
	        }
	        return "unknown" ;
	    },
		errcode: {
			serverError: 100,
	        // authFail: 101,
	        // notInWeixin: 300,
	        // noData: 400,
	        // activityClosed: 401,
	        // noPrivileges: 501
	    },
		errorTxt: {
		    '200': '登陆成功',
		    'no-player': '该用户不存在',
		    'no-username': '用户名不存在',
		    'not-counselor': '您不是裁判员哦',
		    'no-bound': '该账号未绑定',
		    'incorrect-username-or-password': '账户名或密码错误',
		    'bind-fail': '账号绑定失败',
		    'is-bind': '该账号已被绑定',
		    'is-not-the-same-player': '账号未绑定此用户',
		},
		orgsLevelMap: {
			1: '一',
			2: '二',
			3: '三',
			4: '四',
			5: '五'
		}
		
} ,configs); 

module.exports = global;
