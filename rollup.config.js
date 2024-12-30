import terser from '@rollup/plugin-terser'
import pkg from './package.json' with { type: 'json' }

const EXTERNAL = [] // external modules
const GLOBALS = {} // https://rollupjs.org/guide/en/#outputglobals
const OUTPUT_DIR = 'dist'

const makeConfig = () => {
  const banner = `/*!
 * ${pkg.name}
 * ${pkg.description}
 *
 * @version v${pkg.version}
 * @author ${pkg.author}
 * @homepage ${pkg.homepage}
 * @repository ${pkg.repository}
 * @license ${pkg.license}
 */`

  return [{
    input: 'src/muh.js',
    external: EXTERNAL,
    output: [
      {
        banner,
        file: `${OUTPUT_DIR}/muh.esm.js`, // ESM
        format: 'es',
        exports: 'auto',
        globals: GLOBALS,
        sourcemap: true
      }
    ],
    plugins: [terser()]
  },
  {
    input: 'src/template.js',
    external: EXTERNAL,
    output: [
      {
        banner,
        file: `${OUTPUT_DIR}/template.esm.js`, // ESM
        format: 'es',
        exports: 'auto',
        globals: GLOBALS,
        sourcemap: true
      }
    ],
    plugins: [terser()]
  },


  ]
}

export default () => makeConfig()
