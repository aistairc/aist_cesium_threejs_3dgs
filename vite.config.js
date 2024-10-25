import { defineConfig, build } from "vite"
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

/**
 * @type {import('vite').UserConfig}
 */
export default defineConfig({
    build: 
    {
        lib: {
            entry: path.resolve(__dirname, 'src/cesium-threejs-3dgs.ts'),
            name: 'CesiumThreejs3DGS'
        },

        minify: true,
        rollupOptions: {
            external: ['cesium'],
            output: {
                globals: {
                    cesium: 'Cesium',
                    three: 'THREE',
                    'three/addons/controls/OrbitControls.js': 'THREEOrbitControls',
                }
            }
        }

    },
    plugins: [
        {
            name: 'emit-index',
            generateBundle() {
                // console.log('generateBundle')
                const templatePath = path.resolve(__dirname, 'index.template.html')
                let template = fs.readFileSync(templatePath, 'utf-8')

                // テンプレートの変数を置換
                template = template.replace('%VITE_CESIUM_ACCESS_TOKEN%', process.env.VITE_CESIUM_ACCESS_TOKEN ? "VITE_CESIUM_ACCESS_TOKEN" : '')

                this.emitFile({
                    type: 'asset',
                    fileName: 'index.html',
                    source: template
                })
            }
        },
    ]
})
