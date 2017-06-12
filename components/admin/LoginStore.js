var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var $ = require('jquery');
var global = require('../../core/factories/GlobalFactory.js');

var LoginActions = require('./LoginActions.js');

function requireDebuggingId () {
    var id = prompt('请输入要调试的玩家ID：');
    if (!id || !id.length){
        window.location.href = '/error.html?code=' + global.errcode.noPrivileges;
        return null;
    }
    return id;
}

var LoginStore = Reflux.createStore({
    coachInfo: null,
    listenables: [LoginActions],
    onTryLogin: function(){
        
        //正式不走缓存
        if(global.debugging()||global.testing()){//测试或者调试环境
            //alert("调试");
            console.log("调试");
            //判断有无缓存
            if( window.localStorage.getItem("coachInfo") ){//有缓存
                //alert("有缓存");
                //拿到用户信息
                this.coachInfo = JSON.parse( window.localStorage.getItem("coachInfo") );
                this.trigger(this.coachInfo); 
            }else{
                //alert("无缓存");
                var id = requireDebuggingId();
                id&&this.toLocalLogin(id);
            }
        }else{//正式或者预发布环境
            //alert("正式");
            console.log("正式");
            this.toLogin();
        }

    },
    toLocalLogin: function(id){
        var self = this;
        $.ajax({
            url: 'https://tg-api.taiyuansport.com/',
            type: "GET",
            dataType: 'json',
            data: {
                r: 'player-user/view',
                id: id
            }
        })
        .done(function(resp){
            console.log("请求到的辅导员信息",resp);
            self.coachInfo = resp;
            window.localStorage.setItem("coachInfo",JSON.stringify(resp)); 
            self.trigger(self.coachInfo);
        })
        .fail(function(e){
            console.log("请求辅导员信息报错");
        })
    },
    toLogin: function(){
        var self = this;
        console.log("k--------",window.localStorage.getItem("loginKey"));
        var itkey = window.localStorage.getItem("loginKey");
        var ps = {
            r: 'weixin/corp/login',
            //expand: 'login',
        };
        if(itkey){
            ps.k = itkey;
        }
        $.ajax({
            url: global.apiUrl,
            type: 'GET',
            dataType: 'json',
            data: ps
        })
        .done(function(resp){
            
            if(!resp.success){
                //不成功   需要微信重新授权
                window.localStorage.setItem("loginKey",resp.k);
                self.toAuth( resp.k );

            }else{
                console.log("登录成功",resp);
                //alert("登录成功--设置辅导员本地存储");
                window.localStorage.setItem("coachInfo",JSON.stringify(resp.data)); 
                self.trigger(resp.data);
            }

        })
        .fail(function(e){
            console.log("微信授权登录报错",e);
        })
    },
    toAuth: function(k){
        window.location.href = "https://tg-api.taiyuansport.com/?r=weixin/corp/authorize&k="+k;
        /*var self = this;
        alert(global.apiUrl);
        alert(k);
        $.ajax({
            url: global.apiUrl,
            type: 'GET',
            dataType: 'json',
            data: {
                r: 'weixin/corp/authorize',
                k: k
            }
        })
        .done(function(resp){

            if(resp.success){
                console.log("授权拿到数据",resp);
                self.coachInfo = resp.data;
                window.localStorage.setItem("loginKey",resp.k);
                window.localStorage.setItem("coachInfo",JSON.stringify(resp.data));  
                alert("授权成功");
                this.trigger(self.coachInfo);

            }
        })
        .fail(function(e){
            alert("授权报错");
            alert(e);
            console.log("授权接口报错",e);
        })*/
    }

});

module.exports = LoginStore; 
