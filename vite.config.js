import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  publicDir: './dist',

  server: {
    port: 3000,
    open: true,
    watch: {
      usePolling: true,
      interval: 100
    }
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'src/penna.js'), // 主入口文件
      name: 'Penna', // 作为浏览器全局变量 window.Penna
      formats: ['umd', 'es'], // 输出两种格式
      fileName: (format) => `penna.${format === 'es' ? 'esm' : 'umd'}.js`
    },
    outDir: './dist',
    minify: 'terser',
    rollupOptions: {
      external: [], // 🚨 所有依赖打包进来
      output: {
        globals: {}, // 如果 external 非空，则设置对应 window 变量
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'penna.min.css';
          }
          return assetInfo.name;
        }
      }
    }
  },

  plugins: [
    {
      name: 'watch-and-build',
      configureServer(server) {
        server.watcher.add(['./src/**/*.js', './src/**/*.css']);
        server.watcher.on('change', (path) => {
          const normalizedPath = path.replace(/\\/g, '/');
          if (normalizedPath.includes('/src/') || normalizedPath.includes('./src/')) {
            console.log(`文件变化: ${path}`);
            import('child_process').then(({ execSync }) => {
              try {
                console.log('开始自动构建...');
                execSync('npm run build', { stdio: 'inherit', cwd: resolve(__dirname) });
                console.log('✅ 构建完成');
              } catch (error) {
                console.error('❌ 构建失败:', error.message);
              }
            });
          }
        });
      }
    }
  ]
});
