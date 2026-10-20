import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath} from 'node:url';
export default defineConfig({
 root:'web',publicDir:'../mobile-public',plugins:[vue()],
 define:{'import.meta.env.VITE_MOBILE':JSON.stringify('1')},
 resolve:{alias:{'node:crypto':fileURLToPath(new URL('./web/src/offline/crypto.ts',import.meta.url))}},
 build:{outDir:'../mobile-dist',emptyOutDir:true},
});
