import config from "./vite.config.js"

config.build.lib.fileName = "cesium-threejs-3dgs-without-threejs"
config.build.rollupOptions.external.push('three', 'three/addons/controls/OrbitControls.js')

// dist ディレクトリをクリアしない
config.build.emptyOutDir = false

// index.html の生成は不要
delete config.plugins

export default config