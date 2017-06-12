var Reflux = require('reflux');
var LoginActions = require('../actions/LoginActions.js');
console.log(' the loginAction is : ------ ', LoginActions);
var jquery = require('jquery');
var global = require('./GlobalFactory.js');

var playerKey = 'tgwx-player';
var loginKey = 'tgwx-logink';

function beginAuth (lk) {
    console.log(' begin auth , the lk is : ------- ', lk);
    window.localStorage.removeItem(playerKey);
    window.localStorage.setItem(loginKey, lk);
    setTimeout(function(){
        window.location.href = global.apiUrl + '?r=weixin/app/authorize&k=' + lk;
    }, 200); 
}

function requireDebuggingId () {
    var id = prompt('请输入要调试的玩家ID：');
    if (!id || !id.length){
        window.location.href = '/error.html?code=' + global.errcode.noPrivileges;
        return null;
    }
    return id;
}

// LoginStore
var LoginStore = Reflux.createStore({
    listenables: [LoginActions], // 监听LoginAction
    playerInfo: null, // 当前用户的信息
    onTryLogin: function(callback) {
        // console.log(' th onTryLogin func, callback is : ------ ', callback);
        var data = window.localStorage.getItem(playerKey); // 从缓存中去拿player 的信息

        var that = this;

        if( !global.formalMode() && RegExp('relogin').test(window.location.href) ){
            var id = requireDebuggingId();
            id && this.toLocalLogin(id);
            return;
        }

        // console.log('缓存中的用户信息是: ------ ', data);

        if (!data || data =='undefined'){ // 缓存中没有player 的信息
            // alert('无缓存！');
            if (!global.formalMode() && !global.preving()) { // 本地环境下
                var id = requireDebuggingId();
                id && this.toLocalLogin(id);
            } else { // 走微信正式环境的时候没有缓存数据
               
                that.toLogin(callback); 
            } 

        } else{ // 有缓存数据

            var json = JSON.parse(data);
            console.log('缓存中的json 是； ------ ', json);
            var info = JSON.stringify({id: json.id, token: json.access_token});
            // console.log('优化黁数据的时候, info is : ------- ', info);
            // alert('有缓存!info === =' + info);
            if (!global.formalMode() && !global.preving()) { // 本地环境下不去请求用户的信息
                // alert('当前环境下是有缓存数据的!== === ' + data);
                global.player = JSON.parse(data);
                that.playerInfo = JSON.parse(data);
                that.trigger(that.playerInfo);
                that.toLocalLogin(that.playerInfo.id);
                // console.log('trigger 完之后the playerInfo is : ------ ', that.playerInfo);

            } else { // 走微信正式环境的时候有缓存数据
               
                // 判断当前的用户是不是重新验证过一次
                // if (json.isResetAuth) {
                    that.toLogin(callback, info, json.id); // 该项目的用户用的ID
                // } else { // 最开始的验证
                     // that.toLogin(callback); // 让用户去重新授权
                // }
                
            } 
        }
    },

    toLogin: function (callback, cacheInfo, debuggingId) {
        var that = this;
         
        var ps = {"r": "weixin/app/login"};
        if (debuggingId)  ps.debug = debuggingId;

        if (cacheInfo) ps.caching = cacheInfo;
        console.log('toLogin func , the cacheInfo is : ------ ', cacheInfo);

        var lk = window.localStorage.getItem(loginKey);
        console.log('缓存中的loginKey 是: -------- ', lk);
        if (lk) ps.k = lk;

        console.log('授权请求的接口ps 是: ------- ', ps);
        // alert('登陆请求的数据是: ------- ' + JSON.stringify(ps));

        jquery.ajax({
            url: global.apiUrl,
            data: ps,
            dataType:'json',
            success:function(resp){
                // console.log('LoginStore ,the login func, the resp is : ------ ', resp);
                if (!resp.success){
                    // 用户当前的微信数据未登录成功之后， 如果是正式环境下就开始授权
                    if (global.formalMode() || global.preving())
                        beginAuth(resp.k);
                    else
                        // window.location.href = '/error.html?code=' + global.errcode.authFail + '&message=' + resp.message;
                    return;
                } else {
                    that.playerInfo = resp.player;
                    global.player = resp.player;
                    // alert('the player info : ------ ' + JSON.stringify(resp.player));
                    // global.player.userInfo = resp.userInfo;
                    console.log('LoginStore.js ------ toLogin:L success() resp is :-- -', resp);
                    console.log('after login success, the global player info is : ----- ' , global.player);

                    window.localStorage.removeItem(loginKey);
                    // var storeData = resp.player;
                    // storeData.isResetAuth = true;
                    // if(!cacheInfo){
                    window.localStorage.setItem(playerKey, JSON.stringify(resp.player));
                    // };
                    
                    callback && callback();
                }
                
               
                that.trigger(that.playerInfo);
            },
            error:function(e,s,r){
                console.log(' LoginStore func------toLogin error: ----- ', e);
                // alert("errorhtml now"+JSON.stringify(e)+JSON.stringify(r)+JSON.stringify(s));
                if(global.errcode.serverError==100){
                    // LoginFactory.trylogin();
                } else{
                    window.location.href = '/error.html?code=' + global.errcode.serverError;    
                }
                
            }
        });
    },

    toLocalLogin: function(id) {
        console.log('当前的调试ID 是: ------ ', id);
        var that = this;
        jquery.ajax({
            url: 'https://tg-api.taiyuansport.com/',
            type: 'GET',
            data: {
                r: 'player/view',
                id: id
            },
        })
        .done(function(resp) {
            console.log("LoginStore.js- ------ toLocalLogin: success()", resp);
            that.playerInfo = resp;
            global.player = resp;

            window.localStorage.removeItem(loginKey);
            
            window.localStorage.setItem(playerKey, JSON.stringify(resp));
          

            that.trigger(that.playerInfo);

        })
        .fail(function(e, x, r) {
            console.log("LofinStore.js- ------ toLocalLogin:error", e);
            console.log('本地获取用户信息失败: -------- ', e);
        });
    },
});

module.exports = LoginStore;