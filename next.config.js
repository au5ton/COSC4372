const withTM = require('next-transpile-modules')([]);

/** @type {import('next').NextConfig} */
module.exports = withTM({
  // Webpack 5 is enabled by default
  // You can still use webpack 4 while upgrading to the latest version of Next.js by adding the "webpack5: false" flag
  //webpack5: true,
  webpack: (config, { isServer }) => {
    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm'
    // required by opencv-js
    if (!isServer) {
      config.node = {
        fs: 'empty',
        path: 'empty',
        crypto: 'empty',
      }
    }
    //config.output.webassemblyModuleFilename = 'wasm-build/.wasm'

    // Since Webpack 5 doesn't enable WebAssembly by default, we should do it manually
    // config.experiments = {
    //   asyncWebAssembly: true,
    //   syncWebAssembly: true,
    // }

    return config
  },
})
