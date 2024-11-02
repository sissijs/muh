import vm from "node:vm";

import * as builtinHelpers from "./builtin-helpers.js";
import * as builtinFilters from "./builtin-filters.js";

const TEMPLATE_REGEX = /\{\{\s*(.+?)\s*\}\}/gm;

export async function replaceAsync(string, regexp, replacerFunction) {
  const replacements = await Promise.all(
    Array.from(string.matchAll(regexp), (match) => replacerFunction(...match))
  );
  let i = 0;
  return string.replace(regexp, () => replacements[i++]);
}

function mergeMaps(map1, map2) {
  return new Map([...map1, ...map2]);
}

function htmlEscape(input) {
  return input
    ?.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeEval(snippet, context) {
  const s = new vm.Script(snippet);
  let result =
    context && vm.isContext(context)
      ? s.runInContext(context)
      : s.runInNewContext(context || { Object, Array });
  return result;
}

export function parseFilterExpression(expr, ctx) {
  const colonSyntax = expr.match(/^([a-zA-Z_]\w+?)(?:: (.+?))?$/);
  if (colonSyntax !== null) {
    const filter = colonSyntax[1];
    const args = colonSyntax[2]
      ? Array.from(safeEval(`[${colonSyntax[2]}]`, ctx)).map((item) => {
          return item;
        })
      : null;
    return [filter, args];
  }
  throw new Error("filter syntax error");
}

/**
 * @typedef TemplateConfig
 * Configuration object for the template() function.
 *
 * @property {Map<string, Function>} filters
 *
 */

/**
 * Poor girl's handlebars
 *
 * @param {string} str the template content
 * @param {TemplateConfig} config
 * @returns {Promise<string> => string} a function that takes a data object and returns the processed template
 */
export async function template(str, data, config) {
  const defaultFilters = new Map();
  let isSafe = false;
  defaultFilters.set("safe", (input) => {
    isSafe = true;
    return input;
  });
  for (const [filter, func] of Object.entries(builtinFilters)) {
    defaultFilters.set(filter, func);
  }
  const context = vm.createContext({ ...builtinHelpers, ...data });
  const filters = mergeMaps(
    defaultFilters || new Map(),
    config?.filters || new Map()
  );
  return (
    await replaceAsync(str, TEMPLATE_REGEX, async (_, templateString) => {
      const expressions = templateString.split("|").map((e) => e.trim());
      const mainExpression = expressions[0];
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
  ).replace(/\\([\{\}])/gm, "$1");
}
