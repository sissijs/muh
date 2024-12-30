import { replaceAsync } from "../utils/replace-async.js";

const INCLUDE_REGEX = /@import ["']([\w:/\\.-]{1,1000}?\.css)["'](?:\s*layer\s*\((\w{1,1000})\))?;\n?/g;

export const cssPreprocessor = {
  name: 'css',
  extension: '.css',
  /**
   * Process CSS. Resolves basic CSS import directives via an `include` function provided in data.
   * 
   * @param {string} content 
   * @param {any} data 
   * @returns processed CSS
   */
  async process(content, data) {
    return replaceAsync(content, INCLUDE_REGEX, async function (expression, file, layer) {
      if (typeof data?.include !== 'function') {
        return `@import url("${file}")${layer ?` layer(${layer});`:``};\n`;
      }
      let includeContent = null;
      try {
        includeContent = await data.include(file, null, {relativeIncludes: true});
      } catch (ex) {
        console.error(ex);
        return `@import url("${file}")${layer ?` layer(${layer});`:``};\n`;
      }
      if (! layer) {
        return includeContent;
      }
      return `@layer ${layer} {\n${includeContent}\n}\n`;
    });
  }  
}
