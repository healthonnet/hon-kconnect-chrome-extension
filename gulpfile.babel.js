// Generated on 2016-02-09 using generator-chrome-extension 0.5.2
require('babel-core/register');

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import casperJs from 'gulp-casperjs';
import runSequence from 'run-sequence';
import {stream as wiredep} from 'wiredep';

const $ = gulpLoadPlugins();
const argv = require('yargs').argv;

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    'app/_locales/**',
    '!app/*.json',
    '!app/*.html',
    '!app/styles.scss',
  ], {
    base: 'app',
    dot: true,
  }).pipe(argv.firefox ? gulp.dest('distFirefox') : gulp.dest('dist'));
});

gulp.task('lint', () => {
  return gulp.src([
    'app/scripts/**/*.js',
    'test/**/*.js',
    '!app/scripts/utils/*.js',
  ])
    .pipe($.jshint('.jshintrc'))
    .pipe($.jshint.reporter('default'));
});

gulp.task('jscs', () => {
  return gulp.src([
    'app/scripts/**/*.js',
    'test/**/*.js',
    '!app/scripts/utils/tld.js',
  ])
    .pipe($.jscs('.jscsrc'))
    .pipe($.jscs.reporter());
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // Don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}],
    }))
    .on('error', function(err) {
      console.log(err);
      this.end();
    })))
    .pipe(
      argv.firefox ? gulp.dest('distFirefox/images') : gulp.dest('dist/images')
    );
});

gulp.task('styles', () => {
  const variables = {};
  variables.chromePrefix =
    argv.firefox ? '' : 'chrome-extension://__MSG_@@extension_id__';
  return gulp.src('app/styles.scss/*.scss')
    .pipe($.plumber())
    .pipe($.sassVars(variables))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.'],
    }).on('error', $.sass.logError))
    .pipe(gulp.dest('app/styles'));
});

gulp.task('html', ['styles'], () => {

  return gulp.src('app/*.html')
    .pipe($.sourcemaps.init())
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
    .pipe($.sourcemaps.write())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(argv.firefox ? gulp.dest('distFirefox') : gulp.dest('dist'));
});

gulp.task('fonts', () => {
  return gulp.src('app/bower_components/font-awesome/fonts/**')
    .pipe(argv.firefox ? gulp.dest('distFirefox/fonts') : gulp.dest('dist/fonts'));
});

gulp.task('lang', () => {
  return $.download('https://localise.biz:443/api/export/archive/json.zip?' +
  'key=SfHrKVzhFhxgC1I4dT2r_vRs3Duvw4iu&format=chrome')
      .pipe($.decompress({strip: 1}))
      .pipe(gulp.dest('app'));
});

gulp.task('chromeManifest', () => {
  const manifestPath =
      argv.firefox ? 'app/manifest.firefox.json' : 'app/manifest.json';
  return gulp.src(manifestPath)
    .pipe($.rename('manifest.json'))
    .pipe($.chromeManifest({
      background: {
        target: 'scripts/background.js',
      },
    }))
  .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
  .pipe($.if('*.js', $.sourcemaps.init()))
  .pipe($.if('*.js', $.uglify()))
  .pipe($.if('*.js', $.sourcemaps.write('.')))
  .pipe(argv.firefox ? gulp.dest('distFirefox') : gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist', 'distFirefox']));

gulp.task('watch', ['lint', 'html'], () => {
  $.livereload.listen();

  gulp.watch([
    'app/*.html',
    'app/scripts/**/*.js',
    'app/images/**/*',
    'app/styles/**/*',
    'app/_locales/**/*.json',
  ]).on('change', $.livereload.reload);

  gulp.watch('app/scripts/**/*.js', ['lint']);
  gulp.watch('app/styles.scss/**/*.scss', ['styles']);
  gulp.watch('bower.json', ['wiredep']);
});

gulp.task('size', () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('wiredep', () => {
  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./,
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('package', function() {
  var manifest = require('./dist/manifest.json');
  del.sync(['dist/README.txt', 'dist/**/*.map']);
  return gulp.src('dist/**')
      .pipe($.zip('HON-Health-Trust-Indicator' + manifest.version + '.zip'))
      .pipe(gulp.dest('package'));
});

gulp.task('test', function() {
  runSequence(['lint', 'jscs']);
  gulp.src('test/casper.js')
    .pipe(casperJs({command: 'test --web-security=no'}));
  // Run casperjs test
});

gulp.task('testMonitor', function() {
    runSequence(['lint', 'jscs']);
    gulp.src('test/monitor.js')
        .pipe(casperJs({command: 'test --web-security=no'}));
    // Run casperjs test
});

gulp.task('build', (cb) => {
  runSequence(
    ['fonts', 'html', 'lang', 'images', 'extras'],
    'chromeManifest', 'size', cb);
});

gulp.task('chrome-prod', ['clean'], (cb) => {
  runSequence('build', 'package', cb);
});

gulp.task('default', ['clean'], cb => {
  runSequence('test', 'build', cb);
});
