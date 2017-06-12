var React = require('react');
var Reflux = require('reflux');
var ReactMixin = require('react-mixin');

var LoginActions = Reflux.createActions([
    'tryLogin',
]);


module.exports = LoginActions; 