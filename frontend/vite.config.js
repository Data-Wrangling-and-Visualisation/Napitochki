// vite.config.js
export default {
    server: {
      proxy: {
        '/drinks': {
          target: 'http://89.169.174.146:8888', // Адрес твоего API
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/drinks/, '/drinks'), // Переписываем путь
        },
      },
    },
  };
  