/**
 * @typedef Preprocessor
 * @property {string} name
 * @property {string|RegExp} extension
 * @property {(content: string, data: any) => Promise<string>} process content processing function
 */

/**
 * @typedef TemplateConfig
 * Configuration object for the template() function.
 * @property {(file: string) => Promise<Buffer|String>} resolve
 * @property {Map<string, Function>} filters
 * @property {string} baseDir default: "."
 * @property {string} includeDir default: "_includes" 
 * @property {string} layoutDir default: "_layouts"
 * @property {boolean} relativeIncludes whether to include relative to the current file
 * @property {Array<Preprocessor>} preprocessors
 */
