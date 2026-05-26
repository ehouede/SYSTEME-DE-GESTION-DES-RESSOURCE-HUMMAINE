import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensure Ant Design resolves correctly even with spaces in the project path
      'antd': path.resolve(__dirname, 'node_modules/antd'),
    },
  },
  optimizeDeps: {
    include: ['antd'],
  },
});
