var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var $ = require('jquery');
var global = require('../../../core/factories/GlobalFactory.js');
var LoginStore = require('./LoginStore.js');

var PartierAddActions = Reflux.createActions([
    'init',
    'addPartier',
    "changeOrgsList",//更改当前显示机构列表
    'changeEdSelect',//最终选中机构
]);

var PartierAddStore = Reflux.createStore({
    alldata: {
        coachinfo: null,
        orgsList: [],//机构列表全数据
        levelsArray: [],//机构列表的所有层级
        showOrgsList: [],//当前显示的机构列表
        curLevel: 1,//当前显示的层级
        curOrgId: 0,//初始化默认的是无机构id
        curOrgName: '无机构', // 默认进来的机构名称是无机构
        edOrgId: 0,//最终选中的机构id
        edOrgName: '无机构',//最终选中的机构名称
    },
    level: 1,//重构当前的机构数据 需要加入的参数
    listenables: [PartierAddActions],
    onInit: function(coachinfo){
        this.alldata.coachinfo = coachinfo;
        this.initSex();
        this.getOrgsList();//获得机构列表
    },
    getOrgsList: function(){
        var self = this;
        $.ajax({
            url: global.apiUrl,
            type: "get",
            dataType: 'json',
            data: {
                r: "activity/static",
                expand: "getOrganizationList"
            }
        })
        .done(function(resp){
            console.log("请求机构列表返回的数据",resp);
            if(resp.getOrganizationList&&resp.getOrganizationList.success){
                console.log("请求机构列表成功");
                self.alldata.orgsList = resp.getOrganizationList.data;
                console.log("处理前的机构数据",self.alldata.orgsList);

                //遍历获得当前辅导员所属的机构 及 以下 机构
                self.getCoachOrg(self.alldata.orgsList);

                console.log("处理后的机构数据",self.alldata.orgsList);

                // 重构当前的机构数据
                self.formatOrgsData(self.alldata.orgsList);

                console.log("重构后的机构数据",self.alldata.orgsList);
                self.alldata.showOrgsList = self.alldata.orgsList;
                var aobj = {
                    parent_id: null, 
                    id: null, 
                    name: '一级机构', 
                    level: 1
                }
                self.alldata.levelsArray.push(aobj);
                self.trigger( self.alldata );
            }else{
                alert("请求机构列表失败");
            }
        })
        .fail(function(e){
            console.log("请求机构列表数据报错");
        })
    },
    getCoachOrg: function(data){//获得当前辅导员的机构  及  以下机构
        var self = this;
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            if(item.id == self.alldata.coachinfo.oid ){
                var arr = [];
                arr.push(item);
                self.alldata.orgsList = arr;
                self.alldata.edOrgName = item.name;//设置进入页面时 辅导员所在机构的名字

                break;
            }else{
                if (item.child && item.child.length > 0) {
                    self.getCoachOrg(item.child);
                }
            }
            
            
        };
    },
    formatOrgsData: function(data){// 重构当前的机构数据
        var self = this;
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            
            if (item.child && item.child.length > 0) {
                console.log("level----------",self.level);
                if(item.level){
                    item.level = item.level;
                }else{
                    item.level = 1;
                }

                for(var j=0;j<item.child.length;j++){
                    item.child[j].level = item.level + 1;
                }
                
                self.formatOrgsData(item.child);
            }
        };
    },
    getChildOrg: function(id,wholeList){//获得子机构
        
        var list = wholeList ? wholeList : this.alldata.showOrgsList;
        for (var i = 0; i < list.length; i++) {
            var orgItem = list[i];
            if (orgItem.id == id) {
                return orgItem;
                break;
            } else {
                if (orgItem.child && orgItem.child.length > 0) {
                    this.getChildOrg(id, orgItem.child);
                };
            }

        };
    },
    
    hideChooseModal: function(){
        $('.choose-modal').removeClass('active-modal');
        setTimeout(function() {
            $('.choose-modal').removeClass('show-modal');
        }, 100);
    },
    onChangeEdSelect: function(){
        this.alldata.edOrgId = this.alldata.curOrgId;
        this.alldata.edOrgName = this.alldata.curOrgName;
        this.trigger(this.alldata);
    },
    onChangeOrgsList: function( it , back){ 
        var self = this;
        console.log("1",it);
        console.log("2",it.getAttribute('data-parent-id'));
        console.log("3",it.getAttribute('data-id'));
        var orgParentId = parseInt(it.getAttribute('data-parent-id'));
        var orgId = parseInt(it.getAttribute('data-id'));
        if(back){
            console.log("是后退");
            if(orgParentId==0){
                var curOrgObj = {};
                curOrgObj.child = self.alldata.orgsList;
            }else{
                var curOrgObj = self.getChildOrg(orgParentId,self.alldata.orgsList);//当前点击的机构
            }
            
        }else{
            var curOrgObj = self.getChildOrg(orgId);//当前点击的机构
        }
        
        console.log("当前点击的机构11",curOrgObj);
        //去设置当前的 title bar
        self.changeCurOrgTitleData(curOrgObj,back);

        

        // 更新当前选择的机构ID
        self.alldata.curOrgId = orgId;
        self.alldata.curOrgName = curOrgObj.name;
        
        if (curOrgObj.child.length == 0) { // 最后一层了
            self.hideChooseModal();
            
            
            self.alldata.showOrgsList = self.alldata.orgsList;
            self.alldata.curLevel = 1;
            self.alldata.levelsArray = [];
            var aobj = {
                parent_id: null, 
                name: '一级结构', 
                id: null, 
                level: 1
            }
            self.alldata.levelsArray.push(aobj);

            self.trigger( self.alldata );
            
            return false;
        }
        
        
        self.alldata.showOrgsList = curOrgObj.child;
        console.log("2222222222222",self.alldata.showOrgsList);
        //self.alldata.levelsArray.push({parent_id: null, name: global.orgsLevelMap[self.alldata.curLevel]+'级结构', id: null, level: self.alldata.curLevel});
        self.trigger( self.alldata );     
        
    },
    changeCurOrgTitleData: function(curOrgObj, isPrev){ // isPrev表示是回退的
        var self = this;
        console.log("回退设置标题");
        console.log("当前点击的机构",curOrgObj);
        
        if (isPrev) { // 当前是回退

            if(curOrgObj.level){//回退多级的情况
                self.alldata.curLevel = curOrgObj.level+1;
            }else{
                self.alldata.curLevel = 1;
            }


            var curl = self.alldata.curLevel;
            //self.alldata.curLevel = curl - 1;
            self.alldata.levelsArray.length = curl-1;
            self.alldata.levelsArray.push({parent_id: null, name: global.orgsLevelMap[self.alldata.curLevel]+'级结构', id: null, level: self.alldata.curLevel})
        } else {
            var curl = self.alldata.curLevel;
            self.alldata.curLevel = curl + 1;
            self.alldata.levelsArray.push({parent_id: null, name: global.orgsLevelMap[self.alldata.curLevel]+'级结构', id: null, level: self.alldata.curLevel});
            for (var i = 0; i < self.alldata.levelsArray.length; i++) {
                var lt = self.alldata.levelsArray[i];
                console.log(' the lt is : ------ ', lt);
                if (lt.level == curOrgObj.level) {
                    lt.name = curOrgObj.name;
                    lt.id = curOrgObj.id;
                    lt.parent_id = curOrgObj.parent_id;
                    lt.child = curOrgObj.child;
                    break;
                }
            };
        }
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
    onAddPartier: function(){
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
        /*alert($(".itname").val());
        alert($(".ittel").val());
        alert($(".itsex").attr("data-id"));
        alert($("#orgData").attr("data-oid"));*/

        $.ajax({
            url: global.apiUrl+"?r=player-user/static&expand=addPlayer",
            type: "POST",
            dataType: "json",
            data: {
                realname: $(".itname").val(),
                tel: $(".ittel").val(),
                sex: $(".itsex").attr("data-id"),
                oid: $("#orgData").attr("data-oid"),
            }
        })
        .done(function(resp){
            console.log("新增参与者返回数据",resp);
            if(resp.addPlayer&&resp.addPlayer.success){
                alert("新增参与者成功");
                console.log("新增参与者成功",resp.addPlayer.data);
                $(".itname").val("");
                $(".ittel").val("");

            }else{
                alert(resp.addPlayer.errcode);
            }
        })
        .fail(function(e){
            console.log("新增参与者报错",e);
        })
    }
});

export default class PartierAdd extends React.Component{
    onCoachStatusChange(coachinfo) {
        console.log("参与者管理页面--辅导员信息",coachinfo);
        if(coachinfo){
            PartierAddActions.init(coachinfo);
        }
    }
    componentDidMount() {
        console.log("增加参与者页面加载完毕--监听辅导员信息");
        this.unsubscribe = LoginStore.listen(this.onCoachStatusChange);
    }

    render() {
        //机构选择数据
        let toplevel;
        let bottomcont;
        //var me = this;
        if(this.state.partieradddata&&this.state.partieradddata.levelsArray){
            toplevel = this.state.partieradddata.levelsArray.map( (item,i)=>{
                //console.log("标题项",item);
                var barClassName = "bar-item ";
                if (item.level+1 == this.state.partieradddata.curLevel) {
                    barClassName += "bar-item-active"
                };
                return (
                    <span className={barClassName} key={i} data-parent-id={item.parent_id} data-id={item.id} data-level={item.level} onClick={this._showThisOrgsList} >{item.name}</span>
                )
            })
        }
        if(this.state.partieradddata&&this.state.partieradddata.showOrgsList){
            bottomcont = this.state.partieradddata.showOrgsList.map( (item,i)=>{
                //console.log("内容项",item);
                return (
                    <li className="org-item select-item" data-parent-id={item.parent_id} data-id={item.id} key={i} onClick={this._changeOrgsList}> {item.name} </li>
                )
            })
        }

        var edOrgId = this.state.partieradddata?this.state.partieradddata.edOrgId:0;
        var edOrgName = this.state.partieradddata?this.state.partieradddata.edOrgName:"无机构";
        
        return (
            <div className="partieraddpage">
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>身份信息</div>
                <div className="partieraddbox">
                    <div className="inputbox">
                        <label className="labelspan">姓名</label>
                        <input  className="inputspan itname" placeholder="请填写姓名" type="text" />
                    </div>
                    <div className="inputbox">
                        <label className="labelspan">联系方式</label>
                        <input  className="inputspan ittel" placeholder="请填写联系方式" type="text" /> 
                    </div>
                    <div className="inputbox" id="sexselbox">
                        <label className="labelspan">性别</label>
                        <input type="text" data-id="0" className="inputspansel itsex" id="sexsel" readOnly placeholder="请选择性别"/>
                        <img className="selimg" src="../../assets/img/right-arrow.png"/>
                    </div>
                    <div className="inputbox" onClick={this._showOrgSelectList}>
                        <label className="labelspan">所属机构</label>
                        <span className="inputspansel" id="orgData" data-oid={edOrgId} readOnly>{edOrgName}</span>
                        <img className="selimg" src="../../assets/img/right-arrow.png" />
                    </div>
                    <div className="subnewPartier" onClick={this._addPartier}>提交</div>
                    <div className="tipbox">
                        <span className="tiptext">请填写数据</span>
                    </div>
                </div>

                <div className="choose-modal org-select">
                    <div className="modal-bg" onClick={this._hideChooseModal}></div>
                    <div className="choose-wrap">
                        <div className="choose-title">
                            <span className="cancel-choose" onClick={this._hideChooseModal}>取消</span>
                            所属机构
                            <span className="confirm-choose" onClick={this._hideChooseModal.bind(this,1)}>确定</span>
                        </div>
                        <div className="org-choose-bar flex-container">
                            {toplevel}
                        </div>
                        <div className="orgsLevelList-wrap">
                            <ul className="select-list oneLevel">
                                {bottomcont}
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        )
    }
    _addPartier() {
        PartierAddActions.addPartier();
    }
    _back() {
        window.history.back(-1);
    }
    
    //显示机构选择框
    _showOrgSelectList() {
        $('.org-select').addClass('show-modal');
        setTimeout(function() {
            $('.org-select').addClass('active-modal');
        }, 100);
    }

    //隐藏机构选择框
    _hideChooseModal(num) {
        
        $('.choose-modal').removeClass('active-modal');
        setTimeout(function() {
            $('.choose-modal').removeClass('show-modal');
        }, 100);

        if(num&&num==1){
            PartierAddActions.changeEdSelect();
        }

    }

    //点击显示 所点击的机构下的 子机构列表（可后退重新选择机构）
    _showThisOrgsList(event) {
        PartierAddActions.changeOrgsList( event.target ,true );
    }

    //点击某机构 去遍历当前机构下的子机构
    _changeOrgsList(event) {
        PartierAddActions.changeOrgsList( event.target );

        
    }
}

ReactMixin.onClass(PartierAdd,Reflux.connect(PartierAddStore,'partieradddata'));
