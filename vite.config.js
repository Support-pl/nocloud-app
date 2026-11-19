import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import svgLoader from 'vite-svg-loader'
// import { VitePWA } from 'vite-plugin-pwa'

let prefix = import.meta.env?.titlePrefix ?? ''
if (prefix.length > 0) prefix = prefix + ' '

// https://vitejs.dev/config/
// Run the dev server against a backend that lives elsewhere, e.g.
//   NOCLOUD_API=http://localhost:18080 NOCLOUD_GRPC=http://localhost:18000 pnpm serve
// with VUE_APP_BASE_URL (public/api.js) set to "<dev server origin>/api/".
// NOCLOUD_API is the REST gateway, NOCLOUD_GRPC the gRPC/Connect entrypoint.
function devProxy () {
  const api = process.env.NOCLOUD_API
  if (!api) return undefined
  const grpc = process.env.NOCLOUD_GRPC || api
  const strip = (path) => path.replace(/^\/api/, '')
  return {
    '^/api/nocloud\\.': { target: grpc, changeOrigin: true, rewrite: strip },
    '^/api/': { target: api, changeOrigin: true, ws: true, rewrite: strip }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    svgLoader()
    // VitePWA({
    //   // опции воркбокса
    //   registerType: 'autoUpdate',
    //   injectRegister: 'auto',

    //   injectManifest: {
    //   // navigateFallback: 'index.html',
    //     swDest: './public/service-worker.js',
    //     globPatterns: [/\.map$/, /.htaccess/]
    //   },

    //   // настройки манифеста
    //   manifest: {
    //     name: prefix + 'Cloud App',
    //     theme_color: '#427cf7',
    //     display: 'standalone',
    //     background_color: '#000000',
    //     ms_tile_color: '#000000',
    //     apple_mobile_web_app_capable: 'yes',
    //     apple_mobile_web_app_status_bar_style: 'black',

    //     // ...другие настройки манифеста...
    //     icons: [
    //       {
    //         src: 'img/icons/icon-72x72.png',
    //         sizes: '72x72',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'img/icons/icon-96x96.png',
    //         sizes: '96x96',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'img/icons/icon-128x128.png',
    //         sizes: '128x128',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'img/icons/icon-144x144.png',
    //         sizes: '144x144',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'img/icons/icon-152x152.png',
    //         sizes: '152x152',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'img/icons/icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'img/icons/icon-384x384.png',
    //         sizes: '384x384',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'img/icons/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   }
    // })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: { proxy: devProxy() },
  publicPath: './'
})
