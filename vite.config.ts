import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPath from 'vite-tsconfig-paths';
import svgr from '@svgr/rollup';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), tailwindcss(), tsconfigPath()],
});
