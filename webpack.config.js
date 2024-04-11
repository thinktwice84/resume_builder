const path = require('path');

module.exports = {
  entry: './ai_call.js', // Updated path
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
};