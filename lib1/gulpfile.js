'use strict';

const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const merge = require('merge2');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('default', ['compile']);

gulp.task('compile', function() {
	const tsResult = gulp.src('lib/**/*.ts')
	.pipe(sourcemaps.init())
	.pipe(tsProject());

	const resources = gulp.src('lib/**/*.json');
	const jsSources = gulp.src('lib/**/*.js');

	return merge([
		resources,
		jsSources,
		tsResult.dts,
		tsResult.js.pipe(sourcemaps.write()),
	]).pipe(gulp.dest('dist'));
});

gulp.task('watch', ['compile'], () => {
	gulp.watch(['lib/**/*', 'lib/**/*.json'], ['compile']);
});
