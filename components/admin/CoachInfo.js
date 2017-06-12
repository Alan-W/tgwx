var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var $ = require('jquery');

var CoachInfoActions = Reflux.createActions([
    'addEvent',
    "initDataPicker",
]);

var CoachInfoStore = Reflux.createStore({
    listenables: [CoachInfoActions],
  
    onAddEvent: function(){
        /*document.getElementById("coachhead").addEventListener("change",function(){
            var uuu = window.URL.createObjectURL(document.getElementById("coachhead").files[0]);
            $(".coachimg").attr("src",uuu);
        })*/
        $("#coachhead").bind("change",function(){
            var uuu = window.URL.createObjectURL(document.getElementById("coachhead").files[0]);
            $(".coachimg").attr("src",uuu);
        })
    },

    onInitDataPicker: function(){
        var selectDateDom = $('#selectDate');
        var showDateDom = $('#showDate');
        // 初始化时间
        var now = new Date();
        var nowYear = now.getFullYear();
        var nowMonth = now.getMonth() + 1;
        var nowDate = now.getDate();
        showDateDom.attr('data-year', nowYear);
        showDateDom.attr('data-month', nowMonth);
        showDateDom.attr('data-date', nowDate);
        showDateDom.html(nowYear+'年'+nowMonth+'月'+nowDate+'日');
        // 数据初始化
        function formatYear (nowYear) {
            var arr = [];
            for (var i = nowYear - 5; i <= nowYear + 5; i++) {
                arr.push({
                    id: i + '',
                    value: i + '年'
                });
            }
            return arr;
        }
        function formatMonth () {
            var arr = [];
            for (var i = 1; i <= 12; i++) {
                arr.push({
                    id: i + '',
                    value: i + '月'
                });
            }
            return arr;
        }
        function formatDate (count) {
            var arr = [];
            for (var i = 1; i <= count; i++) {
                arr.push({
                    id: i + '',
                    value: i + '日'
                });
            }
            return arr;
        }
        var yearData = function(callback) {
            console.log("year");
            callback(formatYear(nowYear))
        }
        var monthData = function (year, callback) {
            console.log("mouth");
            callback(formatMonth());
        };
        var dateData = function (year, month, callback) {
            console.log("day");
            if (/^4|6|9|11$/.test( month )) {
                //console.log("day30",typeof(month));
                callback(formatDate(30));
            }
            else if (/^1|3|5|7|8|10|12$/.test( month )) {
                //console.log("day31",typeof(month));
                callback(formatDate(31));
            }
            else if (/^2$/.test(month)) {
                if (year % 4 === 0 && year % 100 !==0 || year % 400 === 0) {
                    callback(formatDate(29));
                }
                else {
                    callback(formatDate(28));
                }
            }
            else {
                throw new Error('month is illegal');
            } 
            
        };
        selectDateDom.bind('click', function () {
            var oneLevelId = showDateDom.attr('data-year');
            var twoLevelId = showDateDom.attr('data-month');
            var threeLevelId = showDateDom.attr('data-date');
            var iosSelect = new IosSelect(3, 
                [yearData, monthData, dateData],
                {
                    title: '日期选择',
                    itemHeight: 35,
                    relation: [1, 1],
                    oneLevelId: oneLevelId,
                    twoLevelId: twoLevelId,
                    threeLevelId: threeLevelId,
                    showLoading: false,
                    callback: function (selectOneObj, selectTwoObj, selectThreeObj) {
                        showDateDom.attr('data-year', selectOneObj.id);
                        showDateDom.attr('data-month', selectTwoObj.id);
                        showDateDom.attr('data-date', selectThreeObj.id);
                        showDateDom.html(selectOneObj.value + ' ' + selectTwoObj.value + ' ' + selectThreeObj.value);
                    }
            });
        });
    }
});

export default class CoachInfo extends React.Component{
    componentDidMount() {
        console.log("个人资料页面加载完毕");
        CoachInfoActions.addEvent();
        CoachInfoActions.initDataPicker();
    }

    render() {
        console.log("个人资料页面的数据",this.state.coachinfodata);
        return (
            <div className="coachinfopage">
                <div id="head-ytf"><img className="back" onClick={this._back} src="../../assets/img/back.png"/>个人资料</div>
                <div className="coachinfobox">
                    <div className="coainfli">
                        <label className="labelspan">头像</label>
                        <img className="rigarr right" onClick={this._wakeInput} src="../../assets/img/right-arrow.png"/>
                        <img className="coachin coachimg right" src="../../assets/img/ceshi.jpg"/>
                        <input type="file" className="noshow" id="coachhead"/>
                    </div>
                    <div className="coainfli">
                        <label className="labelspan">姓名</label>
                        <span className="right">小明</span>
                    </div>
                    <div className="coainfli">
                        <label className="labelspan">性别</label>
                        <span className="right">男</span>
                    </div>
                    <div className="coainfli">
                        <label className="labelspan">生日</label>
                        <img className="rigarr right" src="../../assets/img/right-arrow.png"/>
                        <span className="coachin right" id="selectDate">
                            <span data-year="" data-month="" data-date="" id="showDate">点击这里选择时间</span>
                        </span>

                       
                    </div>
                    <div className="coainfli">
                        <label className="labelspan">电话</label>
                        <span className="right">13521843328</span>
                    </div>
                    <div className="coainfli" onClick={this._showEditbox}>
                        <label className="labelspan">个人说明</label>
                        <img className="rigarr right" src="../../assets/img/right-arrow.png"/>
                    </div>

                    <div className="editbox">
                        <div className="edittit">
                            <span className="left" onClick={this._hideEditbox}>取消</span>
                            <span>个人说明</span>
                            <span className="save right">保存</span>
                        </div>
                        <textarea className="editblock" ></textarea>
                    </div>

                </div>
            </div>
        )
    }
    _showEditbox() {
        $(".editbox").addClass('showeditbox');
    }
    _hideEditbox() {
        $(".editbox").removeClass('showeditbox');
    }
    _wakeInput() {
        $("#coachhead").click();
    }
    _back() {
        window.history.back(-1);
    }
}

ReactMixin.onClass(CoachInfo,Reflux.connect(CoachInfoStore,'coachinfodata'))