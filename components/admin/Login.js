var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');
var $ = require('jquery');

var LoginActions = Reflux.createActions({
    'tryLogin',
});

var LoginStore = Reflux.createStore({
    aa: null,
    listenables: [LoginActions],
    onTryLogin: function(){

    }
});

module.exports = LoginActions;

