import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  base: '/ai-food-management/',   // 👈 must match Tomcat context path
});
