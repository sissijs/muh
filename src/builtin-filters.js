/**
 * Serialize JSON
 * @param {any} arg any object to be serialized
 * @param {boolean} pretty whether to indent json
 * @returns
 */
export function json(arg, pretty = false) {
  return pretty ? JSON.stringify(arg, null, 2) : JSON.stringify(arg);
}

/**
 * Format date
 * @param {string|Date|number} date
 * @param {Intl.LocalesArgument} locales the locale (default: 'en-US')
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string} formatted date
 */
export function date(date, locales = "de-DE", options) {
  return new Intl.DateTimeFormat(locales, options ?? {dateStyle: 'medium'}).format(
    typeof date === "string" ? Date.parse(date) : date
  );
}

/**
 * Format time
 * @param {string|Date|number} date
 * @param {Intl.LocalesArgument} locales the locale (default: 'en-US')
 * @param {Intl.DateTimeFormatOptions} [options] DateTimeFormatOptions.
 * @returns {string} formatted date
 */
export function time(date, locales = "de-DE", options) {
  return new Intl.DateTimeFormat(locales, options ?? {timeStyle: 'short'}).format(
    typeof date === "string" ? Date.parse(date) : date
  );
}

/**
 * Format as currency.
 * @param {number} amount
 * @param {Intl.LocalesArgument} [locales]
 * @param {string?} [currency]
 * @returns
 */
export function currency(amount, locales = "de-DE", currency = 'eur') {
  return new Intl.NumberFormat(locales, { style: "currency", currency: currency ?? 'eur' }).format(
    amount
  );
}

/**
 * Format number
 * @param {number} value
 * @param {Intl.LocalesArgument} locales
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string} formatted number
 */
export function numberFormat(value, locales, options) {
  return new Intl.NumberFormat(locales, options ?? {}).format(
    value
  );
}

/**
 * Select a first N elements of an array
 * @param {Iterable} array
 * @param {number} limit
 * @returns {Iterable}
 */
export function limit(array, limit) {
  return Array.from(array).slice(0, Math.max(0, limit));
}

/**
 * Copy an array and reverse
 * @param {Iterable} array
 * @returns {Array} new array, revered
 */
export function reverse(array) {
  return Array.from(array).reverse();
}

/**
 * Return a sorted copy of an array
 * @param {Iterable} array
 * @returns {Iterable} new array, sorted
 */
export function sort(array) {
  const result = Array.from(array);
  result.sort();
  return result;
}

/**
 * Return the last N elements, in reverse order
 * @param {Iterable} array
 * @param {number} amount
 */
export function last(array, amount = 1) {
  return Array.from(array).reverse().slice(0, amount);
}

/**
 * Escape HTML (replace angle brackets and ampersands with entities)
 * @param {string} str
 * @returns {string} escaped html
 */
export function htmlentities(str) {
  return str
    ?.replace(/&/gm, "&amp;")
    .replace(/</gm, "&lt;")
    .replace(/>/gm, "&gt;") ?? '';
}

/**
 * URL-encode
 * @param {string} str
 * @returns {string} encoded string
 */
export function urlencode(str) {
  return encodeURIComponent(str);
}

/**
 * Used to resolve promises in filters
 * @param {Promise<any>} asyncInput 
 * @returns {Promise<any>} anything
 */
export async function async(asyncInput) {
  const result = await asyncInput;
  return typeof result === "function" ? result() : result;
}

/**
 * Iterate over a collection
 * @param {Iterable} array 
 * @param {(item: any) => string} callback 
 * @returns {string}
 */
export function each(array, callback) {
  if (! array) {
    return '';
  }
  return (array instanceof Array ? array : [array]).map(callback).join("");
}

/**
 * Pipe something into a callback
 * @param {any} obj 
 * @param {(item: any) => string} callback 
 * @returns {string}
 */
export function pipe(obj, callback) {
  return callback(obj);
}
