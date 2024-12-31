/**
 * Escape HTML
 * @param {string} [input] 
 * @returns {string|undefined} escaped HTML
 */
export function htmlEscape(input) {
  return input
    ?.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
