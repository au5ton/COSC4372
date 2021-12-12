const withTM = require('next-transpile-modules')([]);

/** @type {import('next').NextConfig} */
module.exports = withTM({
  
  // Next.js ^10.0.0
  // webpack: (config, { isServer }) => {
  //   config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm'
  //   // required by opencv-js
  //   if (!isServer) {
  //     config.node = {
  //       fs: 'empty',
  //       path: 'empty',
  //       crypto: 'empty',
  //     }
  //   }
  //   //config.output.webassemblyModuleFilename = 'wasm-build/.wasm'

  //   // Since Webpack 5 doesn't enable WebAssembly by default, we should do it manually
  //   // config.experiments = {
  //   //   asyncWebAssembly: true,
  //   //   syncWebAssembly: true,
  //   // }

  //   return config
  // },

  // Next.js ^11.1.3
  // Webpack 5 is enabled by default
  webpack: (config) => {
    //config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm'
    // required by opencv-js
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false
    };
    //config.output.webassemblyModuleFilename = 'wasm-build/.wasm'

    // Since Webpack 5 doesn't enable WebAssembly by default, we should do it manually
    config.experiments = {
      asyncWebAssembly: true,
      syncWebAssembly: true,
    }

    return config
  },
})
