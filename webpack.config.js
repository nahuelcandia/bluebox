const path = require('path');
const { readdirSync } = require('fs');
const exec = require('child_process').execSync;

const dir = 'src/handlers'
const entry = readdirSync(dir)
.filter(item => /\.(t|j)s$/.test(item))
.filter(item => !/\.d\.(t|j)s$/.test(item))
.filter(item => !item.includes('e2e'))
.reduce((acc, fileName) => ({
  ...acc,
  [fileName.replace(/\.(t|j)s$/, '')]: `./${dir}/${fileName}`
}), {})
const distFolder = 'dist'
const distPath = path.resolve(process.cwd(), distFolder)

module.exports = {
  entry,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
    ],
  },
  resolve: {
    modules: ['node_modules'],
    extensions: [ '.tsx', '.ts', '.js', '.json' ],
  },
  target: 'node',
  stats: 'minimal',
  devtool: 'source-map',
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.done.tap(
          'ZipPlugin',
          (a,b,c) => {
            Object.keys(entry).forEach(name => {
              exec(`zip -D ${name}.zip -r ${name}.js -r ${name}.js.map`, { cwd: distPath })
            })
            exec(`rm *.js`, { cwd: distPath })
            exec(`rm *.map`, { cwd: distPath })
            console.info(
              'produced deployment packages:\n\n',
              Object.keys(entry).map(name => '  💾  ./' + path.join('./', distFolder, `${name}.zip`)).join('\n\n '),
              '\n'
            );
        });
      }
    }
  ]
};