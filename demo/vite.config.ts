import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: '/demo/',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src')
    }
  },
  plugins: [
    {
      name: 'vite-plugin-directory-index',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const urlPath = req.url.split('?')[0];
            const fullPath = path.join(server.config.root, urlPath);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
              const files = fs.readdirSync(fullPath);
              if (!files.includes('index.html')) {
                const isJson = req.url.includes('?json') || req.headers.accept?.includes('application/json');
                const fileData = files.map(file => {
                  const isDir = fs.statSync(path.join(fullPath, file)).isDirectory();
                  const href = urlPath.endsWith('/') ? `${urlPath}${file}` : `${urlPath}/${file}`;
                  return { name: file, isDir, href };
                });

                if (isJson) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify(fileData, null, 2));
                  return;
                }

                const links = fileData.map(f => `<li><a href="${f.href}">${f.name}${f.isDir ? '/' : ''}</a></li>`);
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Index of ${urlPath}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    ul { list-style: none; padding: 0; }
    li { margin: 0.5rem 0; }
    a { text-decoration: none; color: #0366d6; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Index of ${urlPath}</h1>
  <ul>
    ${urlPath !== '/' ? `<li><a href="../">../</a></li>` : ''}
    ${links.join('\\n')}
  </ul>
</body>
</html>`);
                return;
              }
            }
          }
          next();
        });
      }
    }
  ]
});
