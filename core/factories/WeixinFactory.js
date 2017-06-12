
var global =  require('./GlobalFactory');
var wx = require('weixin-js-sdk');
var $	 = require('jquery');

var info = {
	sharing: {
		type: 'link',
		title: '景联传媒科技有限公司',
		desc: '快来参加全民健身活动吧 ',
		imgUrl: global.appUrl + 'tgwx-app/assets/img/tgwx-logo.png',
		link: window.location.href,
	},
	settingUp: false,
	ready: false,
	latest: null,
	pageShared: false
};

var weixin = {
	
	getWX:function(){
		return wx;
	},
	resconfig:{

	},
	setup: function(callbk,extra_apis){
		var me = this;
		if (info.ready || global.debugging()){
			callbk && callbk();
			return;
		}
		if (info.settingUp){
			return;
		}
		info.settingUp = true;
		var ranomnumber = Math.floor(Math.random()*100);
		var resget = null;
		$.ajax({
			url: global.apiUrl,
			data:{
				r:"weixin/app/sign",
				num: ranomnumber,
			},
			dataType:'json',
			success:function(resp){
				if(global.testing())
				{
					console.log("weixin sign",resp);
					// alert("weixin sign"+JSON.stringify(resp));
					alert('访问微信入口功能成功！'+resp.appId+','+resp.nonceStr+','+resp.signature+','+resp.timestamp);
				}
				resget = resp;
				weixin.resconfig = resp;
				console.log("weixinFactory.js-----resp",resp);
				var apilist =  [
					'onMenuShareAppMessage',
					'onMenuShareTimeline',
					'onMenuShareQQ',
					'onMenuShareWeibo',
					'openLocation',
					'getLocation',
					'scanQRCode',
					'chooseImage',
					'previewImage',
					'uploadImage',
					'downloadImage',
					'translateVoice',
					'getNetworkType',
					'openLocation',
					'getLocation',
					'hideOptionMenu',
					'showOptionMenu',
					'hideMenuItems',
					'showMenuItems',
					'hideAllNonBaseMenuItem',
					'showAllNonBaseMenuItem',
					'closeWindow',
					'chooseWXPay',
					'openAddress',
					'startRecord',
					'stopRecord',
					'playVoice',
				]
				if(extra_apis && extra_apis.length > 0){
					apilist = apilist.concat(extra_apis);
				}

				wx.config({
					debug: (global.testing()),//||global.preving()),
					appId: resp.appId,
					timestamp: resp.timestamp,
					nonceStr: resp.nonceStr,
					signature: resp.signature,
					jsApiList:apilist,
				});
				wx.ready(function () {
					info.settingUp = false;
					info.ready = true;
					me.fillShare({title: document.title});
					console.log(' the callback is : ----- ', callbk);
					// alert(' the weixin isready!');
					// alert(' the callback is : ----- ' +   callbk);
					me.forbidSharing();
					callbk && callbk();
				});
			},
			error:function(e,s,r){
				var msg = '访问微信入口功能失败！' + JSON.stringify(r) +  JSON.stringify(s) + JSON.stringify(e);
				if (global.formalMode()|| global.preving()){
					//alert(msg);
					console.log(msg);	
				}
				else{
					// alert(msg);
				}
				console.log(msg);	
				info.settingUp = false;
				callbk && callbk();

			}
		});

		wx.error(function (res) {
			if (!global.debugging()){
				//alert('微信接口错误:' + JSON.stringify(res)+"||"+JSON.stringify(resget));
			}
			console.log('微信接口错误:' + res.errMsg);
		});
	},
	isReady: function(){
		return info.ready;
	},
	
	fillShare: function(shareInfo) {
		var wexinShareInfo = $.extend({}, info.sharing, shareInfo);

		if (!info.ready){

			info.latest = wexinShareInfo;
			// alert("exinfo,info.ready false"+JSON.stringify(exinfo));
			console.log("exinfo,info.ready false", wexinShareInfo);
			// alert('wx:latest ok:' + JSON.stringify(this.info.latest));
		} else{
			if (info.latest){
				// alert('wx:latest used');
				wexinShareInfo = $.extend({}, wexinShareInfo, info.latest);
				info.latest = null;
			}
			// alert('wx:applied:'+JSON.stringify(exinfo));
			
		};

		wx.onMenuShareAppMessage(wexinShareInfo);
		wx.onMenuShareTimeline(wexinShareInfo);
	},
	requireLocation: function(callbk, callbkFail){
		if (global.debugging()){
			callbk && callbk(116, 39.9);
			return;
		}
		wx.getLocation({
			type: 'gcj02', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
			success: function (res) {
				// alert("888888888888888")
				callbk && callbk(res.longitude, res.latitude);
			},
			fail: function(res){
				if (callbkFail)
					callbkFail(res.errMsg);
				else
					alert(JSON.stringify(res));
			}
		});
	},
	openLocation:function(location){
		var self = this;
		if(location && location!=null){
			wx.openLocation({
			    latitude: location.latitude, // 纬度，浮点数，范围为90 ~ -90
			    longitude: location.longitude, // 经度，浮点数，范围为180 ~ -180。
			    name: '', // 位置名
			    address: '', // 地址详情说明
			    scale: 20, // 地图缩放级别,整形值,范围从1~28。默认为最大
			    infoUrl: '' // 在查看位置界面底部显示的超链接,可点击跳转
			});	
		}else{
			self.requireLocation(function(longitude, latitude){
				wx.openLocation({
				    latitude:  latitude, // 纬度，浮点数，范围为90 ~ -90
				    longitude: longitude, // 经度，浮点数，范围为180 ~ -180。
				    name: '', // 位置名
				    address: '', // 地址详情说明
				    scale: 20, // 地图缩放级别,整形值,范围从1~28。默认为最大
				    infoUrl: '' // 在查看位置界面底部显示的超链接,可点击跳转
				});
			});
		}
		
	},
	scanQrcode: function(callbk){
		wx.scanQRCode({
			needResult: 1,
			scanType: ["qrCode"],
			success: function (res) {
				callbk && callbk(res.resultStr);
			},
			fail: function(res){
				alert(res.errMsg);
			}
		});
	},
	forbidSharing: function(privs){
		if (privs && privs == 1)
			return;
		console.log(' forbid share1');
		// alert('forbid share!');
		wx.hideAllNonBaseMenuItem();
	},
	enableSharing: function(){
		wx.showAllNonBaseMenuItem();
	},
	
	chooseImage: function(count, callbk){
		wx.chooseImage({
			count: count,
			sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
			sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
			success: function (res) {
				callbk && callbk(res.localIds); // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
			},
			fail: function(res){
				alert(res.errMsg);
			}
		});
	},
	uploadImage: function(localId, callbk){
		wx.uploadImage({
			localId: localId, // 需要上传的图片的本地ID，由chooseImage接口获得
			isShowProgressTips: 1, // 默认为1，显示进度提示
			success: function (res) {
				var serverId = res.serverId; // 返回图片的服务器端ID
				callbk && callbk(serverId); // 返回服务器端ID
			},
			fail: function(res){
				alert(res.errMsg);
			}
		});
	},
	beatHeart: function(playerId, callbk){
		this.requireLocation(function(lng, lat){
			$.ajax({
				url:global.apiUrl,
				data:{
					r: 'player/view',
					id: playerId,
					fields: 'null',
					expand: 'beatheart',
					lng: lng, lat: lat	
				},
				type:"GET",
				success:function(resp){
					callbk && callbk(resp);
				},error:function(e,s,r){
					callbk && callbk(false);	
				}
			});
		})
	},
	hideMenuItems: function(menuItem) {
		var hiddenbtns = [];
		for (var i = 0; i < menuItem.length; i++) {
			hiddenbtns.push('menuItem:'+ menuItem);
		}
		// console.log('要隐藏的按钮集合:',hiddenbtns);
		wx.hideMenuItems({
	    	menuList: hiddenbtns,
	        success: function (res) {
	        	console.log('隐藏按钮成功');
	        	// alert('已隐藏按钮');
		    },
		    fail: function (res) {
		        alert(JSON.stringify(res));
		    }
		});
	},
	hideOptionMenu: function(){
		wx.hideOptionMenu();
	},
	chooseWXPay: function(data,callbk,cancelCallbk){
		wx.chooseWXPay({
			timeStamp: data.timeStamp,//为了将来别再改成大写，大小写两种都给出来吧还是
		    timestamp: data.timeStamp,//微信NMLGBD，这个小写的s让我调了两天！
		    nonceStr: data.nonceStr, // 支付签名随机串，不长于 32 位
			package: data.package,
		    signType: data.signType,
		    paySign: data.paySign,
		    success: function (res) {
		        // 支付成功后的回调函数
		        // alert("weixinFactory.js----chooseWXPay success",callbk);
		        // console.log("weixinFactory.js----chooseWXPay success",callbk);
		        callbk && callbk(res.resultStr);
		    },
		    fail:function(res){
		    	// console.log("weixin.chooseWXPay,fail-----",res.errMsg);
		    	alert(res.errMsg);
		    },
		    cancel:function(){
		    	cancelCallbk && cancelCallbk();
		    }
		});
	},
	//获取微信共享收货地址信息
	getOpenAddress:function(){

	  	if( document.addEventListener ){
	        document.addEventListener('WeixinJSBridgeReady', this, false);
	    }else if (document.attachEvent){
	        document.attachEvent('WeixinJSBridgeReady', this); 
	        document.attachEvent('onWeixinJSBridgeReady', this);
	    }
       	var obj = {
		  "addrSign": "6c4f5fa720a2798d09c12b52c895a00049990d8e",
		  "signType": "sha1",
		  "scope": "jsapi_address",
		  "appId": "wx200f675224d44e83",
		  "timeStamp": "1460450778",
		  "nonceStr": "1234568"
		}
		WeixinJSBridge.invoke(
			'editAddress',
			obj,
			function(res){
				var value1 = res.proviceFirstStageName;
				var value2 = res.addressCitySecondStageName;
				var value3 = res.addressCountiesThirdStageName;
				var value4 = res.addressDetailInfo;
				var tel = res.telNumber;
				
				//alert(value1 + value2 + value3 + value4 + ":" + tel);
			}
		);
		// wx.openAddress({
		//     success: function () { 
		//           // 用户成功拉出地址 
		//           alert("成功获取用户地址");
		//     },
		//     cancel: function () { 
		//           // 用户取消拉出地址
		//           alert("获取用户地址失败");
		// 	}
		// });	
	},
	// 开始录音
	startRecord: function () {
		wx.startRecord();
	},
	// 停止录音
	stopRecord: function (callback, errorcall) {
		wx.stopRecord({
			success: function (res) {
				callback && callback(res); // 停止录音之后成功之后返回该音频的localId
			},
			fail: function (res) {
				errorcall && errorcall(res);
			}
		})	
	},
	// 开始播放录音
	playVoice: function (localId) {
		console.log('playVoice 中的localId 是: ------ ', localId);
		wx.playVoice({
			localId: localId, // 微信播放录音的localId
		});
	},
	// 音频转化
	translateVoice: function (localId, callback) {
		wx.translateVoice({
			localId: localId, // 需要识别的音频的本地Id
			isShowProgressTips: 1, // 默认为1, 显示进度提示
			success: function (res) {
				callback && callback(res); // 语音识别成功之后将识别的结果返回给回调函数
			}
		})
	},
	//关闭当前的网页
	closeWindow:function(callback){
		callback && callback();
		wx.closeWindow();
	},
	invoke:function(name,obj,func){
		WeixinJSBridge.invoke(name,obj,func);
	}
	
}

module.exports = weixin;

