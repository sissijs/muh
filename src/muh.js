///<reference path="typedefs.js"/>
import { readFile } from "node:fs/promises";
import path from "node:path";

import { frontmatter } from "./utils/frontmatter.js";
import { htmlPreprocessor } from "./preprocessors/html.js";
import { cssPreprocessor } from "./preprocessors/css.js";
import { markdownPreprocessor } from "./preprocessors/markdown.js";
import { template } from "./utils/template.js";


const defaultResolver = async (filePath) => {
  if (/^https?:\/\//.test(filePath)) {
    const response = await fetch(filePath);
    if (response.status >= 400) {
      throw new Error(response.statusText);
    }
    return await response.text() || '';
  }
  await readFile(filePath, 'utf-8') || '';
}

/**
 * Process template file
 * @param {string} inputContent file contents
 * @param {string} inputFilePath file path
 * @param {any} data template data
 * @param {TemplateConfig} config 
 * @returns 
 */
export async function processTemplateFile(inputContent, inputFilePath, data, config) {
  const include = async (includeFilePath, dataOverrides, configOverrides) => {
    const innerConfig = { ...(config ?? {}), ...configOverrides }
    const parentIncludes = innerConfig.parentIncludes?.slice(0) ?? [inputFilePath];
    if (parentIncludes.includes(includeFilePath)) {
      throw new Error('cyclic dependency detected.');
    }
    parentIncludes.push(includeFilePath);
    const fullIncludePath = (innerConfig.relativeIncludes || includeFilePath.startsWith('./')) ? 
    path.normalize(
      path.join(
        path.parse(inputFilePath).dir, 
        includeFilePath)
      ) :
      path.normalize(
        path.join(
        innerConfig?.baseDir ?? '.',
        innerConfig?.includeDir ?? '_includes',
        includeFilePath
    ));
    if (fullIncludePath.startsWith('..')) {
      throw new Error(`invalid path "${fullIncludePath}": break out of the current working dir.`);
    }
    const includeContent = await (innerConfig.resolve ?? defaultResolver)(fullIncludePath);
    return await processTemplateFile(
      includeContent, 
      includeFilePath, 
      {
        ...data, 
        ...dataOverrides
      }, {
        ...innerConfig,
        parentIncludes,
      }
    );
  }

  const layout = async (layoutFilePath, content) => {
    const parentLayouts = config.parentLayouts?.slice(0) ?? [];
    if (parentLayouts.includes(layoutFilePath)) {
      throw new Error('cyclic dependency detected.');
    }
    parentLayouts.push(layoutFilePath);
    const fullLayoutPath = `${path.normalize(
      path.join(
        config?.baseDir ?? '.',
        config?.layoutDir ?? '_layouts',
        layoutFilePath
    ))}${/\.\w{1,10}$/.test(layoutFilePath) ? '' : '.html'}`;
    if (fullLayoutPath.startsWith('..')) {
      throw new Error(`invalid path "${fullLayoutPath}": break out of the current working dir.`);
    }
    const layoutContent = await (config.resolve ?? defaultResolver)(fullLayoutPath);
    return await processTemplateFile(
      layoutContent, 
      layoutFilePath, 
      {
        ...data,
        layout: null, 
        content
      }, {
        ...(config ?? {}),
        parentLayouts,
      }
    );
  }
  
  const { data: frontmatterData, body} = frontmatter(inputContent);
  const templateData = {...data, ...frontmatterData, include};

  let content = body;
  for (const preprocessor of config.preprocessors ?? [htmlPreprocessor, cssPreprocessor, markdownPreprocessor]) {
    if (typeof preprocessor.extension === 'string' &&
      inputFilePath.endsWith(preprocessor.extension) === false) {
      continue;
    }
    if (preprocessor.extension instanceof RegExp && 
      preprocessor.extension.test(inputFilePath) === false) {
      continue;
    }
    content = await preprocessor.process(content, templateData);
  }
  content = await template(content, templateData, config);

  if (templateData.layout) {
    try {
      return await layout(templateData.layout, content);
    } catch (err) {
      console.warn(err);
      return `<template-error>${err}</template-error>`;
    }
  }

  return content;
}
