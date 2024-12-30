///<reference path="typedefs.js"/>
import { htmlPreprocessor } from "./preprocessors/html.js";
import { cssPreprocessor } from "./preprocessors/css.js";
import { markdownPreprocessor } from "./preprocessors/markdown.js";

/**
 * Get the output file extension for an input file.
 * @param {string} inputFilePath 
 * @param {ProcessTemplateFileConfig} [config] optional configuration object with preprocessors property
 */
export function getOutputFileExtension(inputFilePath, config) {
  const extensionIdx = inputFilePath ? inputFilePath.lastIndexOf('.') : -1;
  if (extensionIdx < 0) {
    return '';
  }
  const preprocessors = config?.preprocessors ?? [htmlPreprocessor, cssPreprocessor, markdownPreprocessor];
  const preprocessor = preprocessors.find(p => {
    if (typeof p.extension === 'string' &&
      inputFilePath.endsWith(p.extension)) {
      return true;
    }
    if (p.extension instanceof RegExp && 
      p.extension.test(inputFilePath)) {
      return true;
    }
    return false;
  });
  return (preprocessor?.outputExtension) ?
    preprocessor?.outputExtension : inputFilePath.slice(extensionIdx);
}
