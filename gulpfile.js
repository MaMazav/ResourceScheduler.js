'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var filter = require('gulp-filter');
var mergeStream = require('merge-stream');

var sources = [
    './src/lifo-scheduler.js',
    './src/linked-list.js',
    './src/priority-scheduler.js',
];

function build(isDebug) {
    var browserified = browserify({
        entries: ['./src/resource-scheduler-exports.js'],
        paths: [
            './src'
        ],
        standalone: 'resource-scheduler',
        debug: isDebug
    });
    
    var jshintStream = gulp.src(sources)
        //.pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(buffer())
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
    
    var browserifyStream = browserified
        .bundle()
        .pipe(source('resource-scheduler.src.js'))
        .pipe(buffer());
    
    if (!isDebug) {
        browserifyStream = browserifyStream
        .pipe(uglify())
        .on('error', gutil.log);
    }
    
    var outFile = isDebug ? 'resource-scheduler.dev.debug' : 'resource-scheduler.dev';
    
    browserifyStream = browserifyStream
        .pipe(concat('resource-scheduler.src.js'))
        .pipe(rename(outFile + '.js'))
        //.pipe(sourcemaps.write(outFile + '.js.map'))
        .pipe(gulp.dest('./'));

    //return jshintStream;
    return mergeStream(jshintStream, browserifyStream);
}

gulp.task('debug', function () {
    return build(/*isDebug=*/true);
});

gulp.task('prod', function() {
    return build(/*isDebug=*/false);
});

gulp.task('default', ['debug', 'prod']);