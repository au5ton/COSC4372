const withTM = require('next-transpile-modules')([]);

/** @type {import('next').NextConfig} */
module.exports = withTM({
  // Webpack 5 is enabled by default
  // You can still use webpack 4 while upgrading to the latest version of Next.js by adding the "webpack5: false" flag
  //webpack5: true,
  webpack: (config) => {
    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm'
    //config.output.webassemblyModuleFilename = 'wasm-build/.wasm'

    // Since Webpack 5 doesn't enable WebAssembly by default, we should do it manually
    config.experiments = { asyncWebAssembly: true }

    return config
  },
})
