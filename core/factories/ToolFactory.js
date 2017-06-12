var assign = require('object-assign');
var global = require('./GlobalFactory');

var ToolFactory = assign({}, {
	// 时间日期转化
	covertTimeFormat: function (time, type) {
		var date = new Date(parseInt(time) * 1000);
		if (type) {
			var year = date.getFullYear() + '年';
			var month = (parseInt(date.getMonth())+1)<10?('0' + (parseInt(date.getMonth())+1) + '月') : (parseInt(date.getMonth())+1);
			var day = date.getDate()<10?('0' + date.getDate() + '日') : date.getDate();
			return year + month + day;
		};
		var year = date.getFullYear() + '.';
		var month = (parseInt(date.getMonth())+1)<10 ? '0'+ (parseInt(date.getMonth())+1) + '.' : (parseInt(date.getMonth())+1)+'.';
		var day = date.getDate()<10 ? '0'+date.getDate() : date.getDate();
		return year + month + day;
	},
	// 返回小时-分钟
	getTimeClock: function (time) {
		var date = new Date(parseInt(time)*1000);
		var hour = ((date.getHours() < 10) ? '0' + date.getHours() : date.getHours())  + ':';
		var min = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
		return hour + min;
	},
	// 显示分享样式
	showShareTip: function (event) {
		var shareTip = document.querySelector(event.target.getAttribute('data-id'));
		shareTip.style.display = 'block';
	},
	// 隐藏分享样式
	hiddenShareTip: function (event) {
		var shareTip = document.querySelector(event.target.getAttribute('data-id'));
		shareTip.style.display = 'none';
	},
	// 更改同一级目录
	changeUrlPath: function (changeUrl) {
		var urlPath = this.getUrlPath(window.location.href);
		var newPath = urlPath.substr(0, urlPath.length - 1);
		var pathArray = newPath.split('/');
		var newUrl = newPath.replace(pathArray[pathArray.length - 1], changeUrl);
		return newUrl;
	},
	// 中文乱码转换
	utf16to8: function (str) {
		var out, i , len, c;
		out = "";
		len = str.length;
		for (var i = 0; i < len; i++) {
			c = str.charCodeAt(i);
			if ((c >= 0x0001) && (c <= 0x007F)) {
				out += str.charAt(i);
			} else if (c > 0x07FF) {
				out += String.fromCharCode(0xE0 | (c >> 12) & 0x0F);
				out += String.fromCharCode(0x80 | (c >> 6) & 0x3F);
				out += String.fromCharCode(0x80 | (c >> 0) & 0x3F);
			} else {
				out += String.fromCharCode(0xC0 | (c >> 6) & 0x1F);
				out += String.fromCharCode(0x80 | (c >> 0) & 0x3F);
			}
		};
		return out;
	},
	// 正则去除所有HTML 标签
	setContent: function(str) { // 正则表达式去除所有的HTML 标签
		if (!str) return '';
		str = str.replace(/<\/?[^>]*>/g,''); //去除HTML tag
		str = str.replace(/[ | ]*\n/g,'\n'); //去除行尾空白
		str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
		// str = str.replace(/('&nbsp;')*/g,'');
		return str;
	}, 
	// 手机号合法化验证
	checkPhoneNumber: function (tel) {
		if (!(/^1[3|4|5|7|8]\d{9}$/.test(tel))) {
			return false;
		} else return true;
	},
	// 身份证合法化验证
	checkCardNumber: function (sId) {
		var iSum = 0 ;
		var info = "" ;
		if(!/^\d{17}(\d|x)$/i.test(sId)) return false; // 身份张长度或者是格式有误
		sId=sId.replace(/x$/i,"a");
		if(aCity[parseInt(sId.substr(0,2))]==null) return false; // 身份证地区非法
		sBirthday=sId.substr(6,4)+"-"+Number(sId.substr(10,2))+"-"+Number(sId.substr(12,2));
		var d=new Date(sBirthday.replace(/-/g,"/")) ;
		if(sBirthday!=(d.getFullYear()+"-"+ (d.getMonth()+1) + "-" + d.getDate()))return false; // 身份证出生日期有误
		for(var i = 17;i>=0;i --) iSum += (Math.pow(2,i) % 11) * parseInt(sId.charAt(17 - i),11) ;
		if(iSum%11!=1) return false; // 身份证号违法
		return true;
	},

	// 格式化URL
	format: function(){
	    var formatted = arguments[0];
	    for (var i = 0; i < arguments.length; i++) {
	        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
	        formatted = formatted.replace(regexp, arguments[i+1]);
	    }
	    return formatted;
	},
	// 获取当前的URL 路径
	getUrlPath: function(url){
		var i = url.lastIndexOf('/');
		if (i < 0)
			return '';
		return url.substr(0, i + 1).replace(/\/+/g, '/').replace(/^http:\//, 'http://');
	},

	// 
	getPureUrl: function(){
		var url = window.location.href.split('#')[0].split('?')[0];
		if (url.charAt(url.length-1) != '/')
			url += '/';
		return url;
	},
	randomString: function(len) {
		len = len || 32;
		// 默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1
		var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
		var maxPos = chars.length;
		var pwd = '';
		for (i = 0; i < len; i++)
			pwd += chars.charAt(Math.floor(Math.random() * maxPos));
		return pwd;
	},
	
	subString2Ellipsis:function(str,len){
		var res = ""
		if(!str)
			return "";
		// console.log(str);
		if(str.length>len){
			res  = str.substr(0,len)+"...";
		}else{
			res = str;
		}
		return res;
	},

	// 检测当前的URL 是否合法
	checkUrlPath:function(url){
		// console.log(url,"||",url.replace(/\/+/g, '/').replace(/^http:\//, 'http://'));
		return url.replace(/\/+/g, '/').replace(/^http:\//, 'http://');
	},

	getProUrl:function(url){
		var baseurl = window.location.href;
		var index = baseurl.indexOf(global.proName);
		if(index < 0){
			return null;
		}else{
			url = baseurl.subString(0,index+global.proName.length);
			console.log(url);
			return url;	
		}
	},

	// 获取URL 上的参数
	GetQueryString:function(name){
	    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
	    var r = window.location.search.substr(1).match(reg);
	    if(r!=null)return r[2];
	    return null;
	},

	//设置html字体大小
	setFontBaseSize: function(){
	    var a={};
	    a.html=document.getElementsByTagName('html')[0];
	    a.widthratio=function(){
	        var c=(document.body&&document.body.clientWidth||a.html.offsetWidth)/640;
	        console.log(' the c is : ----' , c);
	        return c>1?1:c;
	    };
	    a.changePage=function(){
	    	var originStyle = a.html.getAttribute('style');
	    	var fontStyle = "font-size:"+a.widthratio()*100+"px";
	    	if (originStyle) { // 尾部没有分号
	    		if (originStyle.charAt(originStyle.length-1) != ';') {
	    			originStyle += ';';
	    		}
	    	} else originStyle = '';
	    	originStyle += fontStyle;
	    	console.log('HTML 原有的样式是i:  -------- ', originStyle);
	        a.html.setAttribute("style", originStyle);
	    };
	    a.changePage();
	    window.onresize = function(){
	        a.changePage();
	    };
	}

});

module.exports = ToolFactory;