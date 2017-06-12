// 'use strict';

var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');

// 自定义task
var customOpts = {
  entries: ['./app.js'],
  dist: ['./'],
  debug: true
};
 
// polyfills should be automatically loaded, even if they are never require
/*var polyfills = [
  "intl"
];*/

var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));


gulp.task('pack', bundle); // 这样你就可以运行 `gulp js` 来编译文件了
b.on('update', bundle); // 当任何依赖发生改变的时候，运行打包工具
b.on('log', gutil.log); // 输出编译日志到终端

gulp.task('minify', ['./'], function() {
  var distOpts = {
    debug: false,
    output: 'bundle.min.js'
  };
  return gulp
    .src(customOpts.entry)
    .pipe(buildDist(distOpts))
    .pipe(gulp.dest(customOpts.dist));
});


function bundle() {
  return b.bundle()
    // 如果有错误发生，记录这些错误
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    // 在这里将变换操作加入管道
    .pipe(sourcemaps.write('./')) // 写入 .map 文件
    .pipe(gulp.dest('./'));
}