var React = require('react');
var Reflux = require('reflux');
var ToolFactory = require('../../core/factories/ToolFactory');
var weixin = require('../../core/factories/WeixinFactory.js');
var global = require('../../core/factories/GlobalFactory');
var $ = require('jquery');
weixin.setup(function(){
	weixin.enableSharing();
});

var curCity = ToolFactory.GetQueryString('curcity');
console.log(' 城市列表页面中选择的城市是: ------- ', decodeURI(curCity));


// the sign up actions
var CityChangeActions = Reflux.createActions([
	'getAllProvinces', // 全国所有的省份列表
]);

// the sign uo store
var CityChangeStore = Reflux.createStore({
	listenables: [CityChangeActions], // 监听actions
	provincesList: [], // 全国的省份列表
	citiesListInCurPro: [], // 当前选择的省份的省市列表
	onGetAllProvinces: function (country, typeValue) {
		var that = this;
		console.log('the country is : ---- ', country);
		console.log(' the typeVlaue is ； ----- ', typeValue);
		AMap.service('AMap.DistrictSearch',function(){//回调函数
	        var districtSearch = new AMap.DistrictSearch({
	            level : 'country',  
	            subdistrict : 1    
	        });
	        that.gaodeMap(country, typeValue, districtSearch);
    	});
	},

	gaodeMap: function (country,typeValue,districtSearch) {
		var that = this;
		var cArray = [];
        districtSearch.search(country,function(status, result){
            var subDistricts = result.districtList[0].districtList;
           	for(var i = 0;i < subDistricts.length; i += 1){
                cArray.push(subDistricts[i].name); // 全国省份列表
                if (typeValue == 1) {
                	that.provincesList = cArray; // 获得全国的省份列表
                } else if (typeValue == 2) { // 获得省份下的城市
                	that.citiesListInCurPro = cArray;
                };
            };
	        that.trigger(that.provincesList, that.citiesListInCurPro);
        });

	},

});


var CitiesList = React.createClass({
	mixins: [Reflux.connect(CityChangeStore, 'provincesList', 'citiesListInCurPro')],
	getInitialState: function () {
		return {
			provincesList: [],
			citiesListInCurPro: [],
		}
	},

	onCurCityChange: function(provincesList, citiesListInCurPro) {
		this.setState({
			provincesList: provincesList,
			citiesListInCurPro: citiesListInCurPro,
		})
	}, 

	componentDidMount: function () {

		// 监听当前用户选择的城市
		this.unsubscribe = CityChangeStore.listen(this.onCurCityChange);

		CityChangeActions.getAllProvinces('中国', 1); // 初始化的时候是去获取全国的省份列表
		
	},
	componentWillUnmount: function () {
		this.unsubscribe();
	},

	render: function () {
		return (
			<section className="cities-wrapper">
				<div className="pro-wrapper">
					<div className="head-bar has-border">
						<span className="prev-arrow"  onClick={this._goPrevPage}>
							<span className="back"></span>
						</span>
						<span className="page-title">省份列表</span>
					</div>
					<div className="cur-city">
						<span className="cur-loc"><img src="../../assets/img/location.png" />当前城市: <span>{decodeURI(curCity)}</span></span>
					</div>
					<div id="letter" ></div>
					<ul className="cities-list">
						{
							this.state.provincesList.map(this._initialProvinces)
						}
					</ul>
				</div>
				<div className="city-wrapper">
					<div className="head-bar has-border">
						<span className="prev-arrow"  onClick={this._showProvincesList}>
							<span className="back"></span>
						</span>
						<span className="page-title">城市列表</span>
					</div>
					<ul className="pro-cities-list">
						{
							this.state.citiesListInCurPro.map(this._initialCities)
						}
					</ul>
				</div>
			</section>
		)
		
	},

	/* /initial all provinces list in the country*/
	_initialProvinces: function (items, index) {
		return (
			<li className="city-item" key={index} onClick ={this._getProvinceCities} data-pro={items}>
				<span className="city-name">{items}</span>
			</li>
		);
	},

	/* initial the cities list data*/
	_initialCities: function (items, index) {
		var porvince = document.querySelector('.pro-wrapper');
		// porvince.style.left = '-100%';
		return (
			<li className="pro-city-item" key={index} onClick={this._goThisCityActs} data-city={items}>
				<span className="city-name">{items}</span>
			</li>
		)
	},

	// 获取省份的城市列表
	_getProvinceCities: function (event) {
		var pro = event.target.getAttribute('data-pro');
		var list = document.querySelector('.city-wrapper');
		// 隐藏显示当前的省份列表
		$('.pro-wrapper').css('display', 'none');

		// 显示该省份下的城市列表
		$('.city-wrapper').css('display', 'block');
		CityChangeActions.getAllProvinces(pro, 2);
		setTimeout(function () {
			$('.city-wrapper').addClass('show-cities-list');
		}, 100);
	},

	_showProvincesList: function () {

		// 显示该省份下的城市列表
		$('.city-wrapper').css('display', 'none');

		setTimeout(function () {
			$('.city-wrapper').removeClass('show-cities-list');
		}, 200);

		// 隐藏显示当前的省份列表
		$('.pro-wrapper').css('display', 'block');

	},

	// click the city to go this city acts
	_goThisCityActs: function (event) {
		var curEl = event.target.nodeName.toUpperCase() == 'LI' ? event.target : event.target.parentNode;
		var curCity = curEl.getAttribute('data-city');
		console.log('当前点击的城市名称是: --------- ', curCity);
		window.location.href = ToolFactory.checkUrlPath(ToolFactory.getUrlPath(window.location.href) + 'index.html?curcity=' + curCity); 
	},

	_goPrevPage: function () {
		history.go(-1);
	}

});

module.exports = CitiesList;