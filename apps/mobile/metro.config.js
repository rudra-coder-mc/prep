// The app is one member of an npm workspace, so Metro has to be told to watch
// the whole repository and to resolve out of the root node_modules. Without
// this it follows @prep/core and @prep/content out of its own tree and stops.
// See docs/decisions/0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md.
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
// npm hoists to the root, so a package found halfway up the tree is a duplicate
// rather than the one that was installed. Two copies of React is the failure
// this prevents.
config.resolver.disableHierarchicalLookup = true

module.exports = config
