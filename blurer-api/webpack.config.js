const { composePlugins, withNx } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx({
    target: 'node',
  }),
  (config) => {
    // Update the webpack config as needed here.
    // e.g. `config.plugins.push(new MyPlugin())`
    config.output.devtoolModuleFilenameTemplate = function (info) {
      const rel = path.relative(process.cwd(), info.absoluteResourcePath);
      return `webpack:///./${rel}`;
    };
    // const tsRule = config.module.rules.find(
    //   (rule) => rule.test && rule.test.toString() === '/\.([jt])sx?$/' // find the ts rule
    // );
    // tsRule?.exclude?.push(/\.worker\.ts$/);
    // config.module.rules.push({
    //   test: /\.worker\.ts$/,
    //   exclude: /node_modules/,
    //   use: [
    //     {
    //       loader: 'file-loader',
    //       options: {
    //         outputPath: 'worker',
    //         name: '[name].[hash:8].js',
    //       },
    //     },
    //     {
    //       loader: 'ts-loader',
    //     },
    //   ],
      
    // });
    // config.optimization.runtimeChunk = false;
    // delete config.optimization.splitChunks;
    return config;
  }
);
