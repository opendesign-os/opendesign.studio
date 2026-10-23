import nodeExternals from 'webpack-node-externals'

export default (options) => ({
  externals: [
    nodeExternals({ importType: 'module', allowlist: [/^@opendesign\//] }),
    ...options.externals.slice(1),
  ],
})
