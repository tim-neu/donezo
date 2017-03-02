const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const NpmInstallPlugin = require('npm-install-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// Load *package.json* so we can use 'dependencies' from there
const pkg = require('./package.json');

const TARGET = process.env.npm_lifecycle_event;
const PATHS = {
	app: path.join(__dirname, 'app'),
	build: path.join(__dirname, 'build'),
	style: path.join(__dirname, 'app/main.css')
};

process.env.BABEL_ENV = TARGET;

const common = {
	entry: {
		app: PATHS.app,
		style: PATHS.style
	},
	// Add resolve.extensions
	// '' needed to allow imports without an extention.
	// Note the .'s before extensions as it will fail to match without
	resolve: {
		extensions: ['.js', '.jsx']
	},
	output: {
		path: PATHS.build,
		// Output using entry name
		filename: '[name].js'
	},
	module: {
		loaders: [
			// Set up jsx. This accepts js too thanks to RegExp
			{
				test: /\.jsx?$/,
				// Enable caching for improved performance during development
				loaders: ['babel-loader?cacheDirectory'],
				// loaders: ['babel-loader'],
				include: PATHS.app
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'node_modules/html-webpack-template/index.ejs',
			title: 'Donezo app',
			appMountId: 'app',
			inject: false
		})
	]
};


// Default configuration
if(TARGET === 'start' || !TARGET){
	module.exports = merge(common, {
		// devTool: 'eval-source-map',
		devServer: {
			// Enable history API fallback so HTML5 History API based routing works.
			historyApiFallback: true,
			hot: true,
			inline: true,
			// progress: true,

			// Display only errors to reduce the amount of output
			stats: 'errors-only',

			// Parse host and port from env so this is easy to customize.
			//
			// If you use Vagrant or Cloud9, set
			// host: process.env.HOST || '0.0.0.0';
			//
			// 0.0.0.0 is available to al network devices unlike default
			// localhost
			host: process.env.HOST,
			port: process.env.PORT
		},
		modules: {
			loaders: [
			// Define development specific CSS setup
				{
					test: /\.css$/,
					loaders: ['style-loader', 'css-loader'],
					// Include accepts either a path or an array of paths.
					include: PATHS.app
				}
			]
		},
		plugins: [
			new webpack.HotModuleReplacementPlugin(),
			// new NpmInstallPlugin({
			// 	save: true // --save
			// })
		]
	});
}

if(TARGET === 'build' || TARGET === 'stats'){
	module.exports = merge(common, {
		// Define vendor entry point needed for splitting
		entry: {
			vendor: Object.keys(pkg.dependencies).filter(function(v) {
				// Exclude alt-utils as it won't work with this setup
				// due to the way the package has been designed
				//(no package.json main).
				return v !== 'alt-utils';
			})
		},
		output: {
			path: PATHS.build,
			filename: '[name].[chunkhash].js',
			chunkFilename: '[chunkhash].js'
		},
		module: {
			loaders: [
				// Extract CSS during build
				{
					test: /\.css$/,
					loaders: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' }),
					include: PATHS.app
				}
			]
		},
		plugins: [
			new CleanPlugin([PATHS.build], {
				verbose: false // Don't write logs to console
			}),
			// Output extracted CSS to a file
			new ExtractTextPlugin('[name].[chunkhash].css'),
			// Extract vendor and manifest files
			new webpack.optimize.CommonsChunkPlugin({
				names: ['vendor', 'manifest']
			}),
			// Setting DefinePlugin affects React library size!
			// DefinePlugin replaces content "as is" so we need some extra quotes
			// for the generated code to make
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': '"production"'
			}),
			new webpack.optimize.UglifyJsPlugin({
				compress: {
					warnings: false
				}
			})
		]
	});
}