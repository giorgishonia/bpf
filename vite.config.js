import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // Proxy requests starting with /api to your backend.
      '/api': {
        target: 'http://78.46.91.74:50033', // Your backend server address
        changeOrigin: true, // Adjust the request header's origin to the target URL
        // If your backend doesn't expect the '/api' prefix, uncomment the line below:
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});