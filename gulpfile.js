const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');

// const imageminWebp = require('imagemin-webp');

const webp = require('gulp-webp');

gulp.task('default', () =>
    gulp.src('img/*')
        .pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/img'))
);

gulp.task('webp', () =>
    gulp.src('img/*.jpg')
        .pipe(webp({
            quality: 80,
            preset: 'photo',
            method: 6
        }))
        .pipe(gulp.dest('dist/images'))
);

gulp.task('minify-css', () => {
    return gulp.src('css/*.css')
        .pipe(cleanCSS())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'));
})

gulp.task('dist-js', function() {
    gulp.src('js/**/*.js')
		.pipe(gulp.dest('dist/js'));
});

gulp.task('dist', [
    'minify-css',
    'webp',
    'dist-js'
]);