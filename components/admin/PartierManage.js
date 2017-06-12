var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var $ = require('jquery');
var global = require('../../../core/factories/GlobalFactory.js');
var ToolFactory = require('../../core/factories/ToolFactory.js');
var LoginStore = require('./LoginStore.js');
//不需要uid
var PartierManageActions = Reflux.createActions([
    'init',
    "delPartier",
    "changeSelect",//一个列表项的选中
    "changeAllSelect",//所有列表项的选中
    "goSearch",
    "changeOrgsList",//更改当前显示机构列表
    "setTip",//设置提示框 对应的要删除对象的 id
    "changeTipbox",//更改提示框是否显示的方法
    "changeEdSelect",//最终选中机构

]);

var PartierManageStore = Reflux.createStore({

    alldata: {
        coachinfo: null,
        partierslist: [],

        orgsList: [],//机构列表全数据
        levelsArray: [],//机构列表的所有层级
        showOrgsList: [],//当前显示的机构列表
        curLevel: 1,//当前显示的层级
        curOrgId: 0,//初始化默认的是无机构id
        curOrgName: '无机构', // 默认进来的机构名称是无机构
        edOrgId: 0,//最终选中的机构id  
        edOrgName: '无机构',//最终选中的机构名称

        waitdelnum: 0,

        tipstyle: 0,//提示框是否显示(0不显示)
        curdelid: 0,//提示框上携带的id
    },
    myselfdrop: null,//下拉加载保存的对象
    

    listenables: [PartierManageActions],
    onInit: function(coachinfo){//oninit
        this.alldata.coachinfo = coachinfo;
        this.alldata.edOrgId = coachinfo.oid;//默认为 辅导员所在机构
        this.trigger(this.alldata);
        this.getOrgsList();
        this.getPaterData();
        this.addEvent();
    },
    //获得机构列表
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

        this.myLoadDown(true);
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

            
            self.alldata.edOrgId = self.alldata.curOrgId;
            self.alldata.edOrgName = self.alldata.curOrgName;
            self.trigger(self.alldata);

            self.myLoadDown(true);

            return;
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
    //获得参与者列表数据
    getPaterData: function(){
        var self = this;

        if( document.getElementById("partiermul") ){
            $("#partiermul").dropload({
                scrollArea: window,
                loadDownFn: function(me){
                    console.log("触发上拉");
                    self.myselfdrop = me;
                    self.myLoadDown();
                }

            })
        }
    },
    myLoadDown: function(reset){//reset 为true 是切换机构后第一次请求
        var self = this;
        var me = self.myselfdrop;
        if(reset){
            self.alldata.partierslist = [];
        }
        var offset = self.alldata.partierslist.length;
        $.ajax({
            url: global.apiUrl,
            type: "GET",
            dataType: "json",
            data: {
                r: "player-user/static",
                expand: "getOrganizationPlayers",
                oid: $("#orgData").attr("data-oid"),
                offset: offset,
                limit: 10
            }
        })
        .done(function(resp){
            console.log("请求到的参与者列表数据",resp);
            if(resp.getOrganizationPlayers&&resp.getOrganizationPlayers.success){
                console.log("请求参与者列表成功",resp.getOrganizationPlayers.data);
                var itdata = resp.getOrganizationPlayers.data;
                for(var i=0;i<itdata.length;i++){
                    itdata[i].selstate = 0;
                }

                self.alldata.partierslist = self.alldata.partierslist.concat( itdata );
                self.trigger( self.alldata );

                if(itdata.length==10){
                    me.resetload();
                }else if(offset==0&&itdata.length==0){//该机构下无数据
                    me.noData("noone");
                    me.resetload();
                    me.noData(false);
                }else{
                    me.noData(true);
                    me.resetload();
                    me.noData(false);//以备 切换 机构 后使用
                }
            }
        })
        .fail(function(e){
            me.resetload();
            console.log("请求参与者列表报错",e);
        })
    },
    //添加滑动事件 们
    addEvent: function(){
        console.log("添加事件");
        var expansion = null; //是否存在展开的list
        var x, y, X, Y, swipeX, swipeY;
        $(".partiermul").on("touchstart",".partiermli",function(event){
            console.log("点击的对象",event,event.changedTouches);
            x = event.changedTouches[0].pageX;
            y = event.changedTouches[0].pageY;
            swipeX = true;
            swipeY = true ;
            if(expansion){   //判断是否展开，如果展开则收起
                $(expansion).removeClass('swipeleft');
            } 
        });
        $(".partiermul").on("touchmove",".partiermli",function(event){
            X = event.changedTouches[0].pageX;
            Y = event.changedTouches[0].pageY;        
            // 左右滑动
            if(swipeX && Math.abs(X - x) - Math.abs(Y - y) > 0){
                // 阻止事件冒泡
                event.stopPropagation();
                if(X - x > 10){   //右滑
                    event.preventDefault();
                    $(this).removeClass('swipeleft');    //右滑收起
                }
                if(x - X > 10){   //左滑
                    event.preventDefault();
                    $(this).addClass("swipeleft");   //左滑展开
                    expansion = this;
                }
                swipeY = false;
            }
            // 上下滑动
            if(swipeY && Math.abs(X - x) - Math.abs(Y - y) < 0) {
                swipeX = false;
            }        
        })
        
    },
    onDelPartier: function(id){
        var self = this;
        console.log("提交后台删除一个或多个参与者",id);
        //删除之前弹出 提示框



        //删除后台数据  成功后删除本地数据
        var ps = [];
        if(id){//删除一个
            for(var i=0,l=self.alldata.partierslist.length;i<l;i++){
                if(self.alldata.partierslist[i].id==id){
                    self.alldata.partierslist.splice(i,1);
                    ps.push(parseInt(id));
                    break;
                }
            }
        }else{//删除多个

            for(var i=0;i<self.alldata.partierslist.length;i++){//要考虑数组的长度变化
                console.log("11",self.alldata.partierslist[i]);
                if(self.alldata.partierslist[i].selstate==1){
                    ps.push(parseInt(self.alldata.partierslist[i].id));
                    self.alldata.partierslist.splice(i,1);
                    i--;
                }
            }
            console.log("22",self.alldata.partierslist);
        }
        console.log("要删除的参与者id",ps);
        $.ajax({
            url: global.apiUrl,
            dataType: "json",
            type: "GET",
            data: {
                r: "player-user/static",
                expand: "delPlayers",
                player_id: JSON.stringify(ps)
            }
        })
        .done(function(resp){
            console.log("删除参与者返回的数据",resp);
            if(resp.delPlayers&&resp.delPlayers.success){
                console.log("删除参与者成功",self.alldata);
                alert("删除参与者成功");

                $(".editdelete").data("status","0");
                $(".editdelete").removeClass('caneditdelete');
                
                self.trigger( self.alldata );
            }
        })
        .fail(function(e){
            console.log("删除参与者报错",e);
        })
    },
    onSetTip: function(id){
        this.alldata.tipstyle = 1;
        this.alldata.curdelid = id;
        this.trigger( this.alldata );
    },
    onChangeTipbox: function(){
        this.alldata.tipstyle = 0;
        this.trigger( this.alldata );  
    },

    onChangeSelect: function(id){
        var self = this;
        console.log("更改为是否--待删除");
        for(var i=0,l=self.alldata.partierslist.length;i<l;i++){
            if(self.alldata.partierslist[i].id==id){
                if(self.alldata.partierslist[i].selstate==0){
                    self.alldata.waitdelnum = self.alldata.waitdelnum+1;

                    self.alldata.partierslist[i].selstate = 1;
                    $(".editdelete").data("status","1");
                    $(".editdelete").addClass('caneditdelete');
                }else{
                    self.alldata.waitdelnum = self.alldata.waitdelnum-1;

                    self.alldata.partierslist[i].selstate = 0;
                    console.log("此时待删除的长度",self.alldata.waitdelnum);
                    if(self.alldata.waitdelnum < 1){
                        $(".editdelete").data("status","1");
                        $(".editdelete").removeClass('caneditdelete');
                    }
                }                
                break;
            }
        }
        self.trigger( self.alldata );
    },
    onChangeAllSelect: function(state){
        if(state==1){
            this.alldata.waitdelnum = this.alldata.partierslist.length;
        }else{
            this.alldata.waitdelnum = 0;
        }
        
        for(var i=0,l=this.alldata.partierslist.length;i<l;i++){
            this.alldata.partierslist[i].selstate = state;
        }

        this.trigger( this.alldata );
    },
    onGoSearch: function(){
        console.log("执行搜索功能---更新数据");
    }
});

export default class PartierManage extends React.Component{
    onCoachStatusChange(coachinfo) {
        console.log("参与者管理页面--辅导员信息",coachinfo);
        if(coachinfo){
            PartierManageActions.init(coachinfo);
        }
    }

    componentDidMount() {
        console.log("参与者管理页加载完毕------监听辅导员信息");
        this.unsubscribe = LoginStore.listen(this.onCoachStatusChange);
        
    }

    render() {
        console.log("参与者页面数据",this.state.partiermanagedata);
        let items;
        if(this.state.partiermanagedata&&this.state.partiermanagedata.partierslist.length>0){
            items = this.state.partiermanagedata.partierslist.map( (item,i)=>{
                if(item.sex==1||item.sex=="1"){
                    var itseximg = "../../assets/img/man.png";
                }else{
                    var itseximg = "../../assets/img/woman.png";
                }
                //console.log("4444444444",item);
                if(item.selstate==0){
                    var liselstyle = "selectout";
                }else{
                    var liselstyle = "selectout selectouted";
                }
                if(item.headimgurl){
                    var ithead = item.headimgurl;
                }else{
                    var ithead = "../../assets/img/def-head.png";
                }
                //console.log("参与者id",item.id);
                return (
                    <li className="partiermli" key={i}>
                        <div className="editbtnbox">
                            <span className={liselstyle} onClick={this._changeSelect.bind(this,item.id)}>
                                
                            </span>
                        </div>
                        <div className="infobox">
                            <img className="organerimg" src={ithead}/>
                            <p className="infotitl">
                                <span>{item.realname}</span>
                                <img src={itseximg} />
                            </p>
                            <p className="infoorgan">
                                {item.organizationName}
                            </p>
                        </div>
                        <div className="idel" onClick={this._setTip.bind(this,item.id)}>删除</div>
                    </li>
                )
            } )
        }else{
            items = (function(){
                return (
                    <p className="partiermp">该机构还没有参与者<br/>可以切换其它机构查看</p>
                )
            })()
        }

        //机构选择数据
        let toplevel;
        let bottomcont;
        //var me = this;
        if(this.state.partiermanagedata&&this.state.partiermanagedata.levelsArray){
            toplevel = this.state.partiermanagedata.levelsArray.map( (item,i)=>{
                //console.log("标题项",item);
                var barClassName = "bar-item ";
                if (item.level+1 == this.state.partiermanagedata.curLevel) {
                    barClassName += "bar-item-active"
                };
                return (
                    <span className={barClassName} key={i} data-parent-id={item.parent_id} data-id={item.id} data-level={item.level} onClick={this._showThisOrgsList}>{item.name}</span>
                )
            })
        }
        if(this.state.partiermanagedata&&this.state.partiermanagedata.showOrgsList){
            bottomcont = this.state.partiermanagedata.showOrgsList.map( (item,i)=>{
                //console.log("内容项",item);
                return (
                    <li className="org-item select-item" data-parent-id={item.parent_id} data-id={item.id} key={i} onClick={this._changeOrgsList}> {item.name} </li>
                )
            })
        }

        if(this.state.partiermanagedata&&this.state.partiermanagedata.tipstyle==1){
            var tipstyle = {
                display: "block"
            }
        }else{
            var tipstyle = {
                display: "none"
            }
        }
        
        var waitdelid = this.state.partiermanagedata?this.state.partiermanagedata.curdelid:0; 
        
        var edOrgId = this.state.partiermanagedata?this.state.partiermanagedata.edOrgId:0;
        var edOrgName = this.state.partiermanagedata?this.state.partiermanagedata.edOrgName:"无机构";
        
        return (
            <div className="partiermanagepage">
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>负责人</div>
                <div className="partiermbox">
                    <div className="editorno" id="editorno" onClick={this._editPartier}>编辑</div>
                    <div className="parsearch">
                        <div className="parsearchin" onClick={this._showSearbox}>
                            <img src="../../assets/img/search1.png"/>
                            搜索
                        </div>
                    </div>
                    
                    <div className="partiermsear">
                        
                        <div className="partierselect" id="showOrgsList" onClick={this._showOrgSelectList}>
                            <span id="orgData" data-oid={edOrgId}>{edOrgName}</span>
                            <img src="../../assets/img/down-arrow.png"/>
                        </div>
                    </div>
                    <ul className="partiermul" id="partiermul">
                        {items}
                    </ul>
                    <div className="editparbtn">
                        <div className="editall" data-status="0" onClick={this._selectAll}>
                            全选
                        </div>
                        <div className="editdelete" data-status="0" onClick={this._delPartierAll}>
                            删除
                        </div>
                    </div>

                    <div className="operasearchbox">
                        <div id="head-ytf"><img className="back" onClick={this._hideSearbox} src="../../assets/img/back.png"/>人员列表</div>
                        <div className="searinputbox">
                            <div className="searinputdiv" >
                                <img src="../../assets/img/search1.png"/>
                                <input type="text" />
                            </div>
                        </div>
                        <ul className="partiermul">
                            {items}
                        </ul>
                    </div>
                </div>
                
                <div className="mask" style={tipstyle} onClick={this._cancelDel}></div>
                <div className="tipbox" style={tipstyle}>
                    <p className="teltext">确定删除该用户</p>
                    <div className="telbtn">
                        <span onClick={this._cancelDel} >取消</span>
                        <span id="deltipbtn" onClick={this._confirmDel} data-id={waitdelid}>确定</span>
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
    _setTip(id) {
        console.log("计划删除的参与者的id",id);
        PartierManageActions.setTip(id);
    }

    _cancelDel(){//取消删除（隐藏提示框）
        console.log("隐藏提示框");

        PartierManageActions.changeTipbox(0);
    }
    _confirmDel(e){
        console.log("确定去删除");
        PartierManageActions.changeTipbox(0);
        
        PartierManageActions.delPartier( $(e.target).attr("data-id") );
    }

    _editPartier(e) {
        if($(e.currentTarget).html()=="编辑"){
            console.log("点击编辑");
            $(".partiermbox").addClass('editbox');
            $(e.currentTarget).html("取消");
        }else{
            console.log("点击取消");
            $(".partiermbox").removeClass('editbox');
            $(e.currentTarget).html("编辑");
        }
    }

    _selectAll(e) {
        console.log("选中所有的选项");
        if($(e.currentTarget).data("status")=="0"){

            $(".editdelete").data("status","1");
            $(".editdelete").addClass('caneditdelete');

            $(e.currentTarget).data("status","1");
            PartierManageActions.changeAllSelect(1);

        }else{

            $(".editdelete").data("status","0");
            $(".editdelete").removeClass('caneditdelete');

            $(e.currentTarget).data("status","0");
            PartierManageActions.changeAllSelect(0);
        }
        
    }

    _delPartier(id) {
        console.log("删除此参与者",id);
        //$(e.currentTarget).parent().remove();//不要操作dom 操作数据
        PartierManageActions.delPartier( id );
    }
    _delPartierAll() {
        PartierManageActions.delPartier();
    }

    _changeSelect(id) {
        console.log("更改哪个参与者的状态",id);
        PartierManageActions.changeSelect(id);
        
    }

    _showSearbox() {
        $(".operasearchbox").addClass('showoperabox');
    }

    _hideSearbox() {
        $(".operasearchbox").removeClass('showoperabox');
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
            PartierManageActions.changeEdSelect();
        }
    }

    //点击显示 所点击的机构下的 子机构列表（可后退重新选择机构）
    _showThisOrgsList(event) {
        PartierManageActions.changeOrgsList( event.target ,true );
    }

    //点击某机构 去遍历当前机构下的子机构
    _changeOrgsList(event) {
        PartierManageActions.changeOrgsList( event.target );

        
    }

    
}

ReactMixin.onClass(PartierManage,Reflux.connect(PartierManageStore,'partiermanagedata'));