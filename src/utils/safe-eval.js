import vm from "node:vm";

/**
 * Evaluate a JavaScript expression in an isolated context.
 * @param {string} snippet 
 * @param {import("node:vm").Context} context 
 * @returns 
 */
export function safeEval(snippet, context) {
  const s = new vm.Script(snippet);
  let result =
    context && vm.isContext(context)
      ? s.runInContext(context)
      : s.runInNewContext(context ?? {Array, Object}); /* TODO: check for possible prototype pollution vulnerability */
  return result;
}
