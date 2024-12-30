/**
 * @typedef Preprocessor
 * @property {string} name name of the preprocessor.
 * @property {string|RegExp} extension string or regexp of the extension, including the dot.
 * @property {(content: string, data: any) => Promise<string>} process content processing function
 */

/**
 * @typedef TemplateConfig
 * Configuration object for the template() function.
 * @property {Map<string, Function>} filters map of additional filters to be used inside the template
 */

/**
 * @typedef ProcessTemplateFileConfig
 * Configuration object for the template() function.
 * @property {(file: string) => Promise<Buffer|String>} [resolve] optional resolver function (defaults to node readFile)
 * @property {Map<string, Function>} [filters] map of additional filters to be used in the template
 * @property {string} [baseDir] base directory. default: "."
 * @property {string} [includeDir="_includes"] subdirectory to look for html partials. default: "_includes"
 * @property {string} [layoutDir="_layouts"] subdirectory to look for layout files. default: "_layouts"
 * @property {boolean} [relativeIncludes=false] whether to include relative to the current file. default: false
 * @property {Array<Preprocessor>} [preprocessors] list of preprocessors. By default: built-ins for html, css, markdown
 */

