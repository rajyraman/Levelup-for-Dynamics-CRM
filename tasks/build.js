import gulp from 'gulp'

gulp.task('build', gulp.series(
  'clean', gulp.parallel(
    'manifest',
    'scripts',
    'styles',
    'pages',
    'locales',
    'images',
    'fonts',
    'chromereload'
  )
))
