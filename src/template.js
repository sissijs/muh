///<reference path="typedefs.js"/>
import vm from 'node:vm';
import { mergeMaps } from './utils/merge-maps.js';
import { parseFilterExpression } from './utils/parse-filter-expression.js';
import { replaceAsync } from './utils/replace-async.js';
import { htmlEscape } from "./utils/html-escape.js";
import { safeEval } from './utils/safe-eval.js';
import * as builtinHelpers from "./builtin-helpers.js";
import * as builtinFilters from "./builtin-filters.js";

const TEMPLATE_REGEX = /\{\{(.{1,1024}?)\}\}/gm;

/**
 * Poor girl's handlebars
 *
 * @param {string} content the template content
 * @param {any} [data] the data object
 * @param {TemplateConfig} [config] the template configuration, where you can specify additional filters available inside the template
 * @returns {string} the template result string
 */
export async function template(content, data, config) {
  let isSafe = false;
  const defaultFilters = new Map([...Object.entries(builtinFilters), 
    ['safe', (input) => {
      isSafe = true;
      return input;
    }]
  ]);
  const context = vm.createContext({ ...builtinHelpers, ...(data ?? {}) });
  const filters = config?.filters ? 
    mergeMaps(defaultFilters, config.filters instanceof Map ? config.filters : new Map(Object.fromEntries(config.filters))) : 
    defaultFilters;
  let templateResult = content;

  templateResult = await replaceAsync(templateResult, TEMPLATE_REGEX, async (_, templateString) => {
    const expressions = templateString.trim().split("|").map((e) => e.trim());
    const mainExpression = expressions[0].trim();
    const filterExpressions = expressions.slice(1);
    let result = undefined;
    try {
      result = safeEval(mainExpression, context);
      if (typeof result === "undefined") {
        result = "";
      }
      if (typeof result === "function") {
        result = result();
      }
      if (result instanceof Promise) {
        result = await result;
      }
      for (const filterExpression of filterExpressions) {
        const [filter, args] = parseFilterExpression(
          filterExpression,
          context
        );
        if (
          !filter ||
          filters instanceof Map === false ||
          !filters.has(filter) ||
          typeof filters.get(filter) !== "function"
        ) {
          // TODO: more helpful error message:
          throw Error("unregistered or invalid filter: " + filter);
        }

        result = args
          ? filters.get(filter)(result, ...args)
          : filters.get(filter)(result);
      }

      if (result instanceof Promise) {
        result = await result;
      }
    } catch (err) {
      console.warn(err);
      return `<template-error>${err}</template-error>`;
    }
    return isSafe ? result : htmlEscape(result);
  })

  if (! templateResult) {
    return templateResult;
  }

  // unescape escaped curly brackets
  templateResult = templateResult.replace(/\\([{}])/gm, "$1");
  return templateResult;
}
