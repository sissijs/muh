const MAX_STRING_LENGTH = 1e10;

/**
 * Like str.replace() but resolves promises
 * @param {string} string 
 * @param {RegExp} regexp 
 * @param {(...matches: string[]) => Promise<string>} replacerFunction 
 * @returns 
 */
export async function replaceAsync(string, regexp, replacerFunction) {
  if (! string) {
    return string;
  }
  if (string.length > MAX_STRING_LENGTH) {
    throw new Error('string too long.');
  }
  const replacements = await Promise.all(
    Array.from(string.matchAll(regexp), (match) => replacerFunction(...match))
  );
  let i = 0;
  return string.replace(regexp, () => replacements[i++]);
}
