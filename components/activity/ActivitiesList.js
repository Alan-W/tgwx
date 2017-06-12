var React = require('react');
var Reflux = require('reflux');
var LoginActions = require('../../core/actions/LoginActions.js');
var LoginStore = require('../../core/factories/LoginStore.js');
var ToolFactory = require('../../core/factories/ToolFactory');
var weixin = require('../../core/factories/WeixinFactory.js');
var global = require('../../core/factories/GlobalFactory');

var $ = require('jquery');
weixin.setup(function(){
	weixin.enableSharing();
});

var CUR_CITY_Info = {
	curcity: null,
	time: null,
	pt: null,
};

// get the acy list actions
var ActivitiesListActions = Reflux.createActions([
	'getActivitiesListData',
]);


// get the store
var ActivitiesListStore = Reflux.createStore({
	curCity: null,
	activitiesList: [], // 成就的具体描述
	listenables: [ActivitiesListActions], // 监听actions
	
	getCurCity: function (isGetList) {
		var that  = this;
		
		// 定位获取当前的城市信息
		var geolocation = new BMap.Geolocation();    
		var gc = new BMap.Geocoder(); 
		var longitude = null;
		var latitude = null;
		geolocation.getCurrentPosition(function (r) {
			console.log('r is: ---- ', r);
			if(this.getStatus() == BMAP_STATUS_SUCCESS) {  //通过Geolocation类的getStatus()可以判断是否成功定位。  
	        	var pt = r.point;    
	        	if (isGetList == -1) { // 如果是报名页面获得经纬度信息直接返回
	        		CUR_CITY_Info.pt = pt;
	        		window.localStorage.setItem('curcityInfo', JSON.stringify(CUR_CITY_Info));
	        		return pt;
	        	}; 
	        	gc.getLocation(pt, function(rs){  
	        		var addComp = rs.addressComponents;    
	        		console.log('当前定位的城市:-------- ', addComp); 
	        		if (addComp.city == '北京市') {
	        			that.curCity = '北京市市辖区';
	        		} else if (addComp.city == '天津市') {
	        			that.curCity = '天津市市辖区';
	        		} else if (addComp.city == '上海市') {
	        			that.curCity = '上海市市辖区';
	        		} else if (addComp.city == '重庆市') {
	        			that.curCity = '重庆市市辖区';
	        		} else {
	        			that.curCity =  addComp.city; // 定位的信息不对的话就默认为全国, 传递null
	        		}
	        		that._curPt = pt;
	        		CUR_CITY_Info.curcity = that.curCity;
	        		CUR_CITY_Info.time = Date.parse(new Date());
	        		CUR_CITY_Info.pt = pt;
	        		window.localStorage.setItem('curcityInfo', JSON.stringify(CUR_CITY_Info)); // 将信息放入缓存中
	        		that.getCurCityActList(that.curCity);  // 带着经纬度去取活动列表
	        		
	        	}); 
	        } else {
	        	switch( this.getStatus() ) {  
	            	case 2:  
	            		alert( '位置结果未知 获取位置失败.' );  
	            		break;  
	            	case 3:  
	            		alert( '导航结果未知 获取位置失败..' );  
	            		break;  
	            	case 4:  
	            		alert( '非法密钥 获取位置失败.' );  
	            		break;  
	            	case 5:  
	            		alert( '对不起,非法请求位置  获取位置失败.' );  
	            		break;  
	            	case 6:  
	            		alert( '对不起,当前 没有权限 获取位置失败.' );  
	            		break;  
	            	case 7:  
	            		alert( '对不起,服务不可用 获取位置失败.' );  
	            		break;  
	            	case 8:  
	            		alert( '对不起,请求超时 获取位置失败.' );  
	            		break;  
	            };
	            alert('您拒绝了定位，获得全国活动列表');
	            that.getCurCityActList(null); // 拒绝定位后默认取所有的
	        }
		}, {enableHighAccuracy: true} )
		
	},

	// get the index activities list
	onGetActivitiesListData: function (isGetList) {
		// console.log('onGetActivitiesListData 函数中的参数是:---------', isGetList);
		var that = this;
		var cityParam = ToolFactory.GetQueryString('curcity') ? decodeURI(ToolFactory.GetQueryString('curcity')) : null;
		if (cityParam) { // 用户选择了城市, 无需定位
			that.curCity = cityParam;
			that.trigger(that.curCity, false, []);
		 	that.getCurCityActList(cityParam);
		} else { // 用户未选择城市
			var cur_city_info = JSON.parse(window.localStorage.getItem('curcityInfo')); // 用户未选择城市先从缓存中取
			console.log('当前缓存的城市信息是: ----- ', cur_city_info);
			if (cur_city_info && cur_city_info.curcity) {
				var curTime = Date.parse(new Date());
				var preTime = cur_city_info.time;
				if (parseInt(curTime) - parseInt(preTime) > 2*60*60*1000) { // 当前的时间和缓存中的差俩小时则重新定位
					window.localStorage.removeItem('curcityInfo'); // 移除缓存中的数据
					this.getCurCity();
				} else {
					that.curCity = cur_city_info.curcity;
					that.trigger(that.curCity, false, []);
					that.getCurCityActList(cur_city_info.curcity); // 直接取缓存中的地理位置
				}
			} else { // 没有拿到当前城市的信息
				this.getCurCity(); // 定位当前城市
			};
		}
	},

	// 获取当前城市下的活动列表
	getCurCityActList: function (city) {
		// console.log('获取活动列表的时候穿入的城市是i:  ------ ', city);

		var that = this;
		var offset = that.activitiesList.length; //  每次请求的条目
		// console.log('the count is ----- ', offset);
		if (document.getElementById('dropList')) {
			var counter = 0;
			var num = 10;
			var pageStart = 0;
			var pageEnd = 0;
			$('#dropList').dropload({
				scrollArea: window,
				loadDownFn: function (me) {
					$.ajax({
						url: "https://tg-api.taiyuansport.com/",
						type: 'GET',
						data: {
							r: 'activity/static',
							expand: 'getActivityList',
							city_name: city, 
							offset: offset,
							limit: 10	
						},
					})
					.done(function(resp) {
						if (offset ==  0 && resp.getActivityList.data.length == 0) {
							console.log('当前是没有活动列表数据的');
							that.trigger(that.curCity, true, []);	
						} else {
							pageEnd = num * counter;
							counter ++;
							pageStart = pageEnd - num;
							if (resp && resp.getActivityList) {
								var respPerLen = resp.getActivityList.data.length;
								if (respPerLen < 10) { // 若返回的数据少于10条则停止加载
									me.lock();
									me.noData();
								}
							}
							console.log("ActivityStore.js-------getActList:success():resp: ", resp);
	                        that.activitiesList = that.activitiesList.concat(resp.getActivityList.data);
	                        console.log('重置完的活动列表数据是: ----- ', that.activitiesList);
	                      	offset = that.activitiesList.length;
							that.trigger(that.curCity, false, that.activitiesList);	
	                        // 每次数据加载完，必须重置
	                        me.resetload();
						}
						
					})
					.fail(function(e, x, r) {
						console.log("ActivityStore.js-------getActList:failed():error: ", e);
						// 即使请求失败也是重新加载数据
						me.resetload();
					});
				}
			})
		}
		
	},
})

var ActivitiesList = React.createClass({
	mixins: [Reflux.connect(LoginStore, 'playerInfo'), Reflux.connect(ActivitiesListStore, 'curCity', 'noActs', 'activitiesList')],
	getInitialState: function () {
		return {
			curCity: ToolFactory.GetQueryString('curcity') ? decodeURI(ToolFactory.GetQueryString('curcity')) : null, // 获取用户当前选择的或者是定位的城市
			playerInfo: null, 
			noActs: false, 
			activitiesList: []
		}
	},

	onPlayerStatusChange: function(playerInfo) {
		this.setState({
			playerInfo: playerInfo
		}, function() {
			if (playerInfo) {
				ActivitiesListActions.getActivitiesListData(); // 该成就的ID
			}
		})
		
	},

	onStatusChange: function (curCity, noActs, activitiesList) {
		this.setState({
			curCity: curCity,
			noActs: noActs,
			activitiesList: activitiesList,
		})
	},
	componentDidMount: function () {
		// 监听用户数据的变化
		this.unsubscribe = LoginStore.listen(this.onPlayerStatusChange);

		// 监听当前活动列表的变化
		this.unsubscribe = ActivitiesListStore.listen(this.onStatusChange);
	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {

		var showNoAct = {
			dislpay: ''
		};
		var showActList = {
			display: ''
		};
		var showLoadingStyle = {
			display: ''
		};
		showNoAct['display'] = this.state.noActs ? 'block' : 'none';
		showActList['display'] = (this.state.curCity && this.state.curCity != 'null' && !this.state.noActs) ? 'block' : 'none';
		var loadingTxt = (this.state.curCity && this.state.curCity != 'null') ? '正在加载活动列表' : '正在定位当前城市';
		showLoadingStyle['display'] = (this.state.noActs || this.state.activitiesList.length > 0) ? 'none' : 'block';
		return(
			<section className="activities-list">
				<div className="head-wrapper">
					<div className="head-bar">
						<div className="act-loc">
							<p className="city-info" >
								<img className="loc-icon" src="../../assets/img/location.png" />
								<a className="loc-city" href={ToolFactory.checkUrlPath(ToolFactory.getUrlPath(window.location.href) + 'citiesList.html?curcity=' + this.state.curCity)} id="showLoc" >{this.state.curCity}</a>
							</p>
							<span className="page-title">活动列表</span>
						</div>
					</div>
					<div className="act-img">
						<img src="../../assets/img/banner.png"/>
					</div>
				</div>
				<div className="act-list-wrapper index-activity-list" style={showActList}>
					<div id="dropList">
						<ul className="act-list" id="actList">
							{
								this.state.activitiesList.map(this._initialActsList)
							}
						</ul>
					</div>
				</div>

				<div id="loadingToast" className="data-loading-style" style={showLoadingStyle}>
					<div  style={showLoadingStyle}>
						<div className="loadEffect">
					        <span></span>
					        <span></span>
					        <span></span>
					        <span></span>
					        <span></span>
					        <span></span>
					        <span></span>
					        <span></span>
					</div>
						<p className="loading-tip">{loadingTxt}</p>
					</div>
				</div>
				<div className="no-acts" style={showNoAct}>您所在的地区暂无活动</div>
				
			</section>
		)
	},

	/* 遍历活动列表 // */
	_initialActsList: function(item, index) {
		var actOnLine = {
			display: ''
		};
		var actOnEnd = {
			display: ''
		};

		var showOrgTag = {
			display: ''
		};

		// 判断活动的状态两个字段:status（1启用，2禁用） 和 etime(活动的启用状态和活动的结束时间)
		actOnLine['display'] = item.status > 1 ? 'none' : ((item.etime * 1000 > Date.parse(new Date())) ? 'block' : 'none');
		actOnEnd['display'] = item.status > 1 ? 'block' : ((item.etime * 1000 > Date.parse(new Date())) ? 'none' : 'block');
		showOrgTag['display'] = item.type == 1 ? 'none' : 'block'; // oid 是1 的代表普通活动
		return (
			<li className="list-item flex-container"  key={index} onClick ={this._goThisActDetails}  data-act-id={item.id}>
				<div className="act-logo">
				<img src ={item.logo} alt="活动头像" title="活动头像" />
				</div>
				<div className="act-detail">
					<span className="act-name">{item.name}</span>
					<p className="price-time">
						<span className="act-time">{ToolFactory.covertTimeFormat(item.stime)}-{ToolFactory.covertTimeFormat(item.etime)}</span>
						<span className="act-price">{(!item.price || item.price == 0) ? '免费' : item.price + '/人'}</span>
					</p>
					<span className="act-loc">{item.addr}</span>
					
				</div>
				<div className="act-state-wrapper">
					<span className="act-state-btn act-online" style={actOnLine}>进行中</span>
					<span className="act-state-btn act-offline" style={actOnEnd}>已结束</span>
				</div>
				<span className="act-tag" style={showOrgTag}>
					<span className="act-tag-name">{item.organization_name ? item.organization_name : ''}</span>
				</span>
			</li>
		)
	},

	// / 获取活动详情
	_goThisActDetails: function (event) {
		var domTarget = event.target.nodeName.toUpperCase() == 'LI' ? $(event.target) : $(event.target).parents('li')[0];
		var actID = parseInt($(domTarget).attr('data-act-id'));
		var thisActDetails = this._getActDetailInfo(actID);

		var baseUrl = ToolFactory.getUrlPath(window.location.href);
		baseUrl += "details.html?aid=" + actID;
		baseUrl += "&type=" + thisActDetails.type; // 活动的类型，1 是普通活动,2 是机构活动
		baseUrl += "&oid=" + thisActDetails.oid;
		baseUrl += "&prev=1";

		// 首先去判断当前的活动是普通活动还是机构的活动
		var isActOrg = thisActDetails.isActOrg;
		if (isActOrg) {
			console.log('当前是机构活，需要进行身份验证');
		} else {
			console.log('当前是普通活动');
		}

		//活动列表页每个活动点击量数据埋点
		console.log('the global player info is : ------ ', this.state.playerInfo);
		var that = this;
		if (this.state.playerInfo.uid) {
			sa.track('click', {
				buttonName:'活动',
				pageName: global.pageName.page1,
				time: new Date(),
				actId: Number(actID),
				userId: that.state.playerInfo.uid,
				proName: global.projectName,
				actName: thisActDetails.name
			});
		};

		window.location.href = ToolFactory.checkUrlPath(baseUrl);
	},

	// 点击获取具体活动的详情信息
	_getActDetailInfo: function(actID) {
		var list = this.state.activitiesList;
		var actDetails = null;
		for (var i = 0; i < list.length; i++) {
			var item  = list[i];
			if (item.id == actID) {
				actDetails = item;
				break;
			}
		};
		return actDetails;
	},

});

module.exports = ActivitiesList;