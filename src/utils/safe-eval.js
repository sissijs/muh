import vm from "node:vm";

export function safeEval(snippet, context) {
  const s = new vm.Script(snippet);
  let result =
    context && vm.isContext(context)
      ? s.runInContext(context)
      : s.runInNewContext(context || { Object, Array }); /* todo: that isn't safe. prototype pollution */
  return result;
}
