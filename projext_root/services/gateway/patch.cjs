
// 为ESM模块提供__dirname支持
const path = require('path');

// 在全局作用域中设置__dirname
global.__dirname = path.dirname(path.resolve(__dirname, 'dist'));

// 直接启动应用
const { fileURLToPath } = require('url');
const { createRequire } = require('module');
const customRequire = createRequire(__filename);

// 尝试直接运行构建后的文件
const appPath = path.join(__dirname, 'dist/index.js');
console.log('Starting Gateway from:', appPath);
try {
  // 使用动态导入运行ESM模块
  require('module').createRequire(__filename)(appPath);
} catch (error) {
  console.error('Error starting gateway:', error);
  process.exit(1);
}
