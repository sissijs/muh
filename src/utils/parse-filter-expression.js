import { safeEval } from './safe-eval.js'
/**
 * Parse filter expressions
 * @param {string} expr filter expression string
 * @param {import('node:vm').Context} ctx VM context
 * @returns {any} evaluated value
 */
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
