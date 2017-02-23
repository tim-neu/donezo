const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const NpmInstallPlugin = require('npm-install-webpack-plugin');

const TARGET = process.env.npm_lifecycle_event;
const PATHS = {
	app: path.join(__dirname, 'app'),
	build: path.join(__dirname, 'build')
};

process.env.BABEL_ENV = TARGET;

const common = {
	entry: {
		app: PATHS.app
	},
	// Add resolve.extensions
	// '' needed to allow imports without an extention.
	// Note the .'s before extensions as it will fail to match without
	resolve: {
		extensions: ['.js', '.jsx']
	},
	output: {
		path: PATHS.build,
		filename: 'bundle.js'
	},
	module: {
		loaders: [
			{
				test: /\.css$/,
				loaders: ['style-loader', 'css-loader'],
				// Include accepts either a path or an array of paths.
				include: PATHS.app
			},
			// Set up jsx. This accepts js too thanks to RegExp
			{
				test: /\.jsx?$/,
				// Enable caching for improved performance during development
				// loaders: ['babel-loader?cachDirectory'],
				loaders: ['babel-loader'],
				include: PATHS.app
			}
		]
	}
}


// Default configuration
if(TARGET === 'start' || !TARGET){
	module.exports = merge(common, {
		// devTool: 'eval-source-map',
		devServer: {
			contentBase: PATHS.build,

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
		plugins: [
			new webpack.HotModuleReplacementPlugin(),
			// new NpmInstallPlugin({
			// 	save: true // --save
			// })
		]
	});
}

if(TARGET === 'build'){
	module.exports = merge(common, {});
}