var gulp=require('gulp'),
    fs = require('fs-extra'),
    concat=require('gulp-concat'),
    uglify = require('gulp-uglify'),
    BUILD_JSON=require('./build.json'),
    BUILD_NAME='elliptical.component.js',
    MIN_NAME='elliptical.component.min.js',
    REPO_NAME='elliptical component',
    WEB_COMPONENTS='./node_modules/webcomponents.js/webcomponents-lite.js',
    JQ='./node_modules/observable-component/dist/jquery.js',
    CSS ='./node_modules/observable-component/dist/styles.css',
    DUST='./node_modules/observable-component/dist/dust.js',
    MS='./node_modules/observable-component/dist/mutation-summary.js',
    UTILS='./node_modules/elliptical-utils/dist/elliptical.utils.js',
    MOMENT='./node_modules/observable-component/dist/moment.js',
    BOOTSTRAP='./lib/bootstrap.js',
    DIST='./dist',
    DEMO='./demo/bundle';
    BUNDLE_JSON=require('./bundle.json'),
    BUNDLE='./bundle';


gulp.task('default',function(){
    console.log(REPO_NAME + ' ..."tasks: gulp build|gulp minify|gulp bundle"');
});

gulp.task('build',function(){
    fileStream(BUNDLE_JSON,DIST);
    fileStream(JQ,DIST);
    fileStream(CSS,DIST);
    concatFileStream(BOOTSTRAP,DIST,'elliptical.bootstrap.js');
    concatStream(BUILD_NAME)
        .pipe(gulp.dest(DIST));
});

gulp.task('minify',function(){
    fileStream(CSS,DIST);
    minFileStream(DUST,DIST,'dust.min.js');
    minFileStream(MS,DIST,'mutation-summary.min.js');
    minFileStream(JQ,DIST,'jquery.min.js');
    minFileStream(UTILS,DIST,'elliptical.utils.min.js');
    minFileStream(MOMENT,DIST,'moment.min.js');
    minFileStream(BOOTSTRAP,DIST,'elliptical.bootstrap.min.js');
    concatStream(MIN_NAME)
        .pipe(uglify())
        .pipe(gulp.dest(DIST));
});

gulp.task('bundle',function(){
    fileStream(JQ,BUNDLE);
    fileStream(CSS,BUNDLE);
    fileStream(BUNDLE_JSON,BUNDLE);
    concatFileStream(BOOTSTRAP,BUNDLE,'elliptical.bootstrap.js');
    concatStream(BUILD_NAME)
        .pipe(gulp.dest(BUNDLE));
});

gulp.task('demo',function(){
    fileStream(JQ,DEMO);
    fileStream(CSS,DEMO);
    fileStream(BUNDLE_JSON,DEMO);
    concatFileStream(BOOTSTRAP,DEMO,'elliptical.bootstrap.js');
    concatStream(BUILD_NAME)
        .pipe(gulp.dest(DEMO));
});

function srcStream(src){
    if(src===undefined) src=BUILD_JSON;
    return gulp.src(src);
}

function concatStream(name,src){
    if(src===undefined) src=BUILD_JSON;
    return srcStream(src)
        .pipe(concat(name))
}

function fileStream(src,dest){
    gulp.src(src)
        .pipe(gulp.dest(dest));
}

function concatFileStream(src,dest,name){
    gulp.src(src)
        .pipe(concat(name))
        .pipe(gulp.dest(dest));
}

function minFileStream(src,dest,name){
    gulp.src(src)
        .pipe(concat(name))
        .pipe(uglify())
        .pipe(gulp.dest(dest));
}