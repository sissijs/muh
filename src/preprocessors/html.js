import { replaceAsync } from "../utils/replace-async.js";



export const htmlPreprocessor = {
  name: 'html',
  extension: /.html?$/,
  async process(content, data) {
    return await replaceAsync(content, /<html-include((\s[a-z]{1,100}?=".{1,1024}?"){1,100})>/gm,
      async function (...matches) {
        const match = matches && matches.length >= 2 ? matches[1] : null;
        if (! match) {
          return '';
        }
        if (typeof data['include'] !== 'function') {
          return matches[0];
        }
        const params = Object.fromEntries(
          Array.from(match.matchAll(/([a-z]{1,100}?)="(.{1,1024}?)"/gm))
          .map(([, key, val]) => [key, val])
          .filter(([key]) => key !== '__proto__')
        );
        return await data.include(params.src, params);
      }
    );
  }
}
