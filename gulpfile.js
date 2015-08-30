'use strict';

var gulp = require('gulp'),
		browserSync = require('browser-sync'),
		reload			= browserSync.reload,
		jade = require('gulp-jade'),
		prefix = require('gulp-autoprefixer'),
		sass = require('gulp-sass'),
		plumber = require('gulp-plumber'),
		cssmin = require('gulp-cssmin'),
		rename = require('gulp-rename'),
		uncss = require('gulp-uncss'),
		useref = require('gulp-useref'),
		gulpif = require('gulp-if'),
		uglify = require('gulp-uglify'),
		minifyCss = require('gulp-minify-css'),
		uglify = require('gulp-uglify'),
		pngquant = require('imagemin-pngquant'),
		imagemin = require('gulp-imagemin'),
		wiredep = require('wiredep').stream;


/**
 * Compile jade files into HTML + Wiredep (with normal file path)
 */
gulp.task('templates', function() {

	return gulp.src('./app/templates/index.jade')
		.pipe(plumber())
		.pipe(jade({
			pretty: true
		}))
		.pipe(wiredep({
			directory: './app/bower_components',
			ignorePath: /^(\.\.\/)*\.\./
		}))
		.pipe(gulp.dest('./app'))
});

/**
 * Important!!
 * Separate task for the reaction to `.jade` files
 */
gulp.task('jade-watch', ['templates'], reload);

/**
 * Sass task for live injecting into all browsers + Autoprefixer + CssMin
 */
gulp.task('sass', function () {
	return gulp.src('./app/scss/*.scss')
		.pipe(plumber())
		.pipe(sass({
			includePaths: ['css'],
			onError: browserSync.notify
			}))
		.pipe(sass())
		.pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
		.pipe(gulp.dest('./app/scss'))
		.pipe(cssmin())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('./app/scss'))
		.pipe(reload({stream: true}));
});



// Add bower components
gulp.task('bower', function () {
	gulp.src('./app/*.html')
		.pipe(wiredep({
			directory: "./app/bower_components"
		}))
		.pipe(gulp.dest('./app'));
});


// Bild final project at './dist' --- for production! ---
gulp.task('html', ['fonts', 'imageMin'], function () {
	var assets = useref.assets();

	return gulp.src('./app/index.html')
		.pipe(assets)
		.pipe(gulpif('*.js', uglify()))
		.pipe(gulpif('*.css', minifyCss()))
		.pipe(assets.restore())
		.pipe(useref())
		.pipe(gulp.dest('./dist'));
});

// UNCSS with CSSMIN file --- for production! ---
gulp.task('uncss', function () {
	return gulp.src('./dist/css/*.css')
		.pipe(uncss({
			html: ['./dist/index.html']
			}))
		.pipe(cssmin())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('./dist/css'));
});

// minify JS --- for production! --- (optional)
gulp.task('uglify', function() {
	return gulp.src('./app/js/*.js')
		.pipe(uglify())
		.pipe(gulp.dest('./app/js'));
});

// Copy Web Fonts To './dist'
gulp.task('fonts', function () {
	return gulp.src(['app/fonts/**'])
		.pipe(gulp.dest('dist/fonts'));
});

// Copy and imagemin all images to production folder
gulp.task('imageMin', function () {
	return gulp.src('./app/img/**')
	.pipe(imagemin({
		progressive: true,
		svgoPlugins: [{removeViewBox: false}],
		use: [pngquant()]
	}))
	.pipe(gulp.dest('./dist/images'));
});

/**
 * Serve and watch the scss/jade files for changes + add bower_components
 */
gulp.task('default', ['templates', 'sass'], function () {

	browserSync({server: './app'});

	gulp.watch('./app/scss/**/*.**', ['sass']);
	gulp.watch('./app/templates/**/*.jade', ['jade-watch']);
	gulp.watch('./app/js/**/*.**', reload);
	gulp.watch('bower.json', ['bower']);
});
