import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Check system process.env first (for Cloud Build/Docker), then .env file.
  const apiKey = process.env.API_KEY || env.API_KEY;
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the browser
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
