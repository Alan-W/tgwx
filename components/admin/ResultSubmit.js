var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var $ = require('jquery');
var LoginStore = require('./LoginStore.js');
var global = require('../../core/factories/GlobalFactory.js');

var uid = null;
var ResultSubmitActions = Reflux.createActions([
    'init',
    'goSubmitPage',
]);

var ResultSubmitStore = Reflux.createStore({
    listenables: [ResultSubmitActions],
    onInit: function(uid){
        this.initSex();
        this.initAct(uid);
    },
    onGoSubmitPage: function(){
        //先判断必填信息是否完整
        if(!$(".itname").val()){
            //$(".tipbox").slideDown("fast");
            $(".tipbox").addClass('tipshow');
            $(".tiptext").html("请填写姓名")
            setTimeout(function(){
                $(".tipbox").removeClass('tipshow');
                //$(".tipbox").slideUp();
            },2000);
            return;
        }
        if(!$(".ittel").val()){
            //$(".tipbox").slideDown();
            $(".tipbox").addClass('tipshow');
            $(".tiptext").html("请填写联系方式")
            setTimeout(function(){
                $(".tipbox").removeClass('tipshow');
                //$(".tipbox").slideUp();
            },2000);
            return;
        }
        if(!$(".itsex").val()){
            //$(".tipbox").slideDown();
            $(".tipbox").addClass('tipshow');
            $(".tiptext").html("请选择性别")
            setTimeout(function(){
                $(".tipbox").removeClass('tipshow');
                //$(".tipbox").slideUp();
            },2000);
            return;
        }
        if(!$(".itact").val()){
            //$(".tipbox").slideDown();
            $(".tipbox").addClass('tipshow');
            $(".tiptext").html("请选择活动")
            setTimeout(function(){
                $(".tipbox").removeClass('tipshow');
                //$(".tipbox").slideUp();
            },2000);
            return;
        }
        // alert( $(".itact").attr('data-id') );
        var ps = {
            realname: $(".itname").val(),
            tel: $(".ittel").val(),
            aid: $(".itact").attr('data-id'),
            sex: $(".itsex").val()
        }
        if($(".itjob").val()){
            ps.job = $(".itjob").val();
        }
        if($(".itage").val()){
            ps.age = $(".itage").val();
        }
        $.ajax({
            url: global.apiUrl+"?r=activity/static&expand=setNoTelPlayerSignUp",
            type: "POST",
            dataType: "json",
            data: ps
        })
        .done(function(resp){
            console.log("提交成绩前报名返回数据",resp);
            //resp.setNoTelPlayerSignUp.data  是paid
            if(resp.setNoTelPlayerSignUp.success){
                if(!uid){
                    alert("请稍后报名");
                }else{
                    window.location.href = "resultinput.html?paid="+resp.setNoTelPlayerSignUp.data+"&uid="+uid;
                    return false;
                }
            }else{
                alert(resp.setNoTelPlayerSignUp.errcode);
            }
        })
        .fail(function(e){
            console.log("提交成绩前的报名报错",e);
        })
        
    },
    initSex: function(){
        console.log("初始化性别选择框");
        var sexSelbox = $("#sexselbox");
        var showSexDom = $("#sexsel");
        var dataarr = [
            {'id': '1', 'value': '男'},
            {'id': '2', 'value': '女'}
        ]
        sexSelbox.bind('click', function () {
            var sexId = showSexDom.attr('data-id');
            //var bankName = showSexDom.dataset['value'];
            var bankSelect = new IosSelect(1, 
                [dataarr],
                {
                    container: '.container',
                    title: '性别选择',
                    itemHeight: 50,
                    itemShowCount: 3,
                    oneLevelId: sexId,
                    callback: function (selectOneObj) {
                        showSexDom.val( selectOneObj.value );
                        showSexDom.attr('data-id',selectOneObj.id);
                        showSexDom.attr('data-value',selectOneObj.value);
                        //self.resetRank( selectOneObj.id );
                    }
            });
        });
    },
    initAct: function(uid){
        console.log("请求可选活动列表");
        var self = this;
        $.ajax({
            url: global.apiUrl,
            type: "GET",
            dataType: "json",
            data: {
                r: "player-user/static",
                expand: "getPlayerUserActivitys",
                player_user_id: uid
            }
        })
        .done(function(resp){
            console.log("请求到的辅导员可辅导的活动---数据",resp);
            if(resp.getPlayerUserActivitys.success){
                console.log("请求到的辅导员可辅导的活动---成功----初始化下拉列表",resp.getPlayerUserActivitys.data);
                var resdata = resp.getPlayerUserActivitys.data;
                var dataarr = [];
                var showActDom = $('#actsel');
                var actselectbox = $('#actselbox');
                for(var i=0;i<resdata.length;i++){
                    var obj = {};
                    obj.id = resdata[i].id;
                    obj.value = resdata[i].name;

                    dataarr.push( obj );
                }
                if(dataarr.length>0){
                    showActDom.html( resdata[0].name );
                }
                console.log("下拉列表的数据",dataarr);
               
                actselectbox.bind('click', function () {
                    var bankId = showActDom.attr('data-id');
                    //var bankName = showActDom.dataset['value'];
                    var bankSelect = new IosSelect(1, 
                        [dataarr],
                        {
                            container: '.container',
                            title: '活动选择',
                            itemHeight: 50,
                            itemShowCount: 3,
                            oneLevelId: bankId,
                            callback: function (selectOneObj) {
                                showActDom.val( selectOneObj.value );
                                showActDom.attr('data-id',selectOneObj.id);
                                showActDom.attr('data-value',selectOneObj.value);
                                //self.resetRank( selectOneObj.id );
                            }
                    });
                });
            }
        })
        .fail(function(e){
            console.log("请求辅导员可辅导的活动报错",e);
        })
    }
});

export default class ResultSubmit extends React.Component{
    onCoachStatusChange(coachinfo) {
        console.log("辅导员信息",coachinfo);
        if(coachinfo){
            uid = coachinfo.id;
            ResultSubmitActions.init(coachinfo.id);
        }
    }
    componentDidMount() {
        console.log("单独提交成绩页加载完成");
        this.unsubscribe = LoginStore.listen( this.onCoachStatusChange );
    }

    render() {
        console.log("提交成绩页数据",this.state.resultsubmitdata);
        return (
            <div className="rssubpage">
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>成绩提交</div>
                <div className="rssubbox">
                    <div className="inputbox">
                        <label className="labelspan">姓名 <span>(必填)</span></label>
                        <input className="inputspan itname" type="text" placeholder="请填写名字" />
                    </div>
                    <div className="inputbox">
                        <label className="labelspan">电话 <span>(必填)</span></label>
                        <input className="inputspan ittel" type="text" placeholder="请填写联系方式"/>
                    </div>
                    <div className="inputbox" id="sexselbox">
                        <label className="labelspan">性别 <span>(必填)</span></label>
                        <input type="text" className="inputspansel itsex" id="sexsel" readOnly placeholder="请选择性别"/>
                        <img className="selimg" src="../../assets/img/right-arrow.png"/>
                    </div>
                    <div className="inputbox">
                        <label className="labelspan">年龄 <span>(选填)</span></label>
                        <input className="inputspan itage" type="text" placeholder="请填写年龄"/>
                    </div>
                    <div className="inputbox">
                        <label className="labelspan">职业 <span>(选填)</span></label>
                        <input className="inputspan itjob" type="text" placeholder="请填写职业"/>
                    </div>
                    <div className="inputbox" id="actselbox">
                        <label className="labelspan">活动 <span>(必填)</span></label>
                        <input type="text" className="inputspansel itact" id="actsel" readOnly placeholder="请选择活动"/>
                        <img className="selimg" src="../../assets/img/right-arrow.png" />   
                    </div>
                    
                    <div className="startact" onClick={this._goSubmitPage}>开始活动</div>
                    <div className="tipbox">
                        <span className="tiptext">请填写数据</span>
                    </div>
                </div>
            </div>
        )
    }
    _goSubmitPage() {
        ResultSubmitActions.goSubmitPage();
    }
    _back() {
        window.history.back(-1);
    }
}

ReactMixin.onClass(ResultSubmit,Reflux.connect(ResultSubmitStore,'resultsubmitdata'));