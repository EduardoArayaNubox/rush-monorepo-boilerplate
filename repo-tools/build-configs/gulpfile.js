'use strict';

const path = require('path');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const merge = require('merge2');
const {spawn} = require('child_process');
const tsProject = ts.createProject('tsconfig.json');
const env = Object.create(process.env);

env.NODE_ENV = process.env['NODE_ENV'] || 'development';
env.SITE_NAME = process.env['SITE_NAME'] || 'development';
env.PUBSUB_GCLOUD_PROJECT = process.env['PUBSUB_GCLOUD_PROJECT'] || 'development';
env.PUBSUB_EMULATOR_HOST = process.env['PUBSUB_EMULATOR_HOST'] || 'localhost:8802';
env.LOG_PRETTY = process.env['LOG_PRETTY'] || 'true';
env.USE_GRM = process.env['USE_GRM'] || 'true';

let node;

gulp.task('startServer', async function startServer() {
	if (node) node.kill();
	node = await spawn('node', ['dist/server/server.js'], {env, stdio: 'inherit'});

	node.on('close', function(code) {
		if (code === 8) {
			console.log('Error detected, waiting for changes...');
		}
	});
});

gulp.task('compile', function() {
	const tsResult = gulp.src('{lib,src,server,test}/**/*.ts')
	.pipe(sourcemaps.init({loadMaps: true}))
	.pipe(tsProject());
	const resources = gulp.src('{lib,src,server,test}/**/*.json');
	const jsSources = gulp.src('{lib,src,server,test}/**/*.js')
	// NOTE: "identityMap" is configured differently in current version of gulp-sourcemaps
	.pipe(sourcemaps.init({loadMaps: true, identityMap: true}));

	return merge([
		resources,
		jsSources.pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: './'})),
		tsResult.dts,
		tsResult.js.pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: './'})),
	]).pipe(gulp.dest('./dist'));
});

gulp.task('watch', gulp.series('compile', () => {
	return gulp.watch(['{lib,server,test}/**/*'], gulp.series('compile'));
}));

gulp.task('serve', gulp.series('compile', 'startServer', () => {
	return gulp.watch(['{lib,server,test}/**/*'], gulp.series('compile', 'startServer'));
}));

gulp.task('default', gulp.series('compile'));
