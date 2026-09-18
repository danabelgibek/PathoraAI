import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

// Проект публикуется на GitHub Pages в подкаталоге репозитория,
// поэтому все ссылки на ассеты собираются относительно base.
export default defineConfig({
  base: '/PathoraAI/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
});
