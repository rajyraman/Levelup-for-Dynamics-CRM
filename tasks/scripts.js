import gulp from 'gulp'
import gulpif from 'gulp-if'
// import { log, colors } from 'gulp-util'
// import named from 'vinyl-named'
// import webpack from 'webpack'
// import gulpWebpack from 'webpack-stream'
// import plumber from 'gulp-plumber'
import livereload from 'gulp-livereload'
import args from './lib/args'
import ts from 'gulp-typescript'
import gulpSequence from 'gulp-sequence'

const ENV = args.production ? 'production' : 'development'

gulp.task('scripts', gulpSequence(['copylibraries','extension','app','background','grid','options','orgdetails','processes','userroles','emojis','optionsets']));

gulp.task('extension', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'levelup.extension.js' });
  return gulp.src('./app/scripts/inject/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('app', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'app.js' });
  return gulp.src('./app/scripts/app/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('background', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'background.js' });
  return gulp.src('./app/scripts/background/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('grid', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'grid.js' });
  return gulp.src('./app/scripts/grid/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('options', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'options.js' });
  return gulp.src('./app/scripts/options/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('orgdetails', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'organisationdetails.js' });
  return gulp.src('./app/scripts/pages/orgdetails/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('processes', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'processes.js' });
  return gulp.src('./app/scripts/pages/process/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('userroles', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'userroles.js' });
  return gulp.src('./app/scripts/pages/roles/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('emojis', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'emojis.js' });
  return gulp.src('./app/scripts/pages/emojis/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('optionsets', (cb) => {
  let tsProject = ts.createProject('tsconfig.json', { outFile: 'optionsets.js' });
  return gulp.src('./app/scripts/pages/optionsets/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('copylibraries', (cb) => {
  gulp.src('./app/libraries/*')
  .pipe(gulp.dest(`dist/${args.vendor}`));
})
// gulp.task('scripts', (cb) => {
//   return tsProject.src()
//     .pipe(tsProject())
//     .js.pipe(plumber({
//       // Webpack will log the errors
//       errorHandler () {}
//     }))
//     .pipe(named())
//     .pipe(gulpWebpack({
//       devtool: args.sourcemaps ? 'inline-source-map' : false,
//       watch: args.watch,
//       plugins: [
//         new webpack.DefinePlugin({
//           'process.env.NODE_ENV': JSON.stringify(ENV),
//           'process.env.VENDOR': JSON.stringify(args.vendor)
//         })
//       ].concat(args.production ? [
//         new webpack.optimize.UglifyJsPlugin()
//       ] : []),
//       module: {
//         rules: [{
//           test: /\.js$/,
//           loader: 'babel-loader'
//         }]
//       }
//     },
//     webpack,
//     (err, stats) => {
//       if (err) return
//       log(`Finished '${colors.cyan('scripts')}'`, stats.toString({
//         chunks: false,
//         colors: true,
//         cached: false,
//         children: false
//       }))
//     }))
//     .pipe(gulp.dest(`dist/${args.vendor}/scripts`))
//     .pipe(gulpif(args.watch, livereload()))
// })
