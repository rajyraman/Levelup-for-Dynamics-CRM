import gulp from 'gulp';
import gulpif from 'gulp-if';
import { log, colors } from 'gulp-util';
import named from 'vinyl-named';
import webpack from 'webpack';
import gulpWebpack from 'webpack-stream';
import BabiliPlugin from 'babili-webpack-plugin';
import plumber from 'gulp-plumber';
import livereload from 'gulp-livereload';
import args from './lib/args';

const ENV = args.production ? 'production' : 'development';

gulp.task('scripts', (cb) => {
  return gulp
    .src(['app/scripts/pages/*.ts', 'app/scripts/*.ts', 'app/libraries/*.js'])
    .pipe(
      plumber({
        // Webpack will log the errors
        errorHandler() {},
      })
    )
    .pipe(named())
    .pipe(
      gulpWebpack(
        {
          devtool: args.sourcemaps ? 'inline-source-map' : false,
          watch: args.watch,
          // entry: {
          //   ['levelup.extension']: './app/scripts/inject/levelup.main.ts',
          // },
          output: {
            filename: '[name].js',
          },
          mode: ENV,
          plugins: [
            new webpack.DefinePlugin({
              'process.env.NODE_ENV': JSON.stringify(ENV),
              'process.env.VENDOR': JSON.stringify(args.vendor),
            }),
          ].concat(args.production ? [new BabiliPlugin()] : []),
          module: {
            rules: [
              {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: { logLevel: 'info', logInfoToStdOut: true },
                exclude: /node_modules/,
              },
            ],
          },
          resolve: {
            extensions: ['.ts', '.js'],
            modules: ['node_modules/', 'app/scripts/'],
          },
        },
        webpack,
        (err, stats) => {
          if (err) return;
          log(
            `Finished '${colors.cyan('scripts')}'`,
            stats.toString({
              chunks: false,
              colors: true,
              cached: false,
              children: false,
            })
          );
        }
      )
    )
    .pipe(gulp.dest(`dist/${args.vendor}/scripts`))
    .pipe(gulpif(args.watch, livereload()));
});
