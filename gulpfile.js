var gulp = require('gulp');

var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
// var uglify = require('gulp-uglify');

gulp.task('scripts', function() {
  gulp.src(['./src/js/directives.js', './src/js/services.js',
        './src/js/services.sort.js', './src/js/services.sort.js',
        './src/js/sorting.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat('alg.js'))
    // .pipe(uglify({mangle: false, outSourceMap: true}))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('watch', function() {
    // Watch .js files
    gulp.watch('./src/js/**/*.js', ['scripts']);
});

gulp.task('default', ['scripts']);
