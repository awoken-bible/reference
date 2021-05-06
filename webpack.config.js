const path = require('path');

module.exports = {
	entry: {
    'awoken-ref' : './src/lib.ts',
  },
	output: {
		path: path.resolve(__dirname, 'dist.browser/'),
		filename: '[name].js',
		library: {
			name: 'AwokenRef',
			type: 'var',
			export: 'AwokenRef',
		},
	},
	module: {
		rules: [
      {
        test: /\.ts$/,
        use: 'babel-loader',
        exclude: /node_modules|dist/,
      },
    ],
	},
  plugins: [],
	resolve: {
		extensions: [ '.ts', '.js' ],
	},
};
