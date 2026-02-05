
import { defineConfig } from 'vite';

export default defineConfig({
  // If your repo is https://github.com/user/my-repo, set base to '/my-repo/'
  // For root domains, use '/'
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
