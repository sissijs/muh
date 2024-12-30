import { smolYAML } from "./smolyaml.js";

const REGEX = /^-{3}(\w+)?\n((?:(?:.*)\n)*)-{3}\n((?:(?:.*)\n?)*)/;

/**
 * Parse a frontmatter into a data object and a body string
 * @param {string} str input string 
 * @returns {{data: object; body: string }} a data object and a body string
 */
export function frontmatter(str) {
  const matches = str?.replace(/\r\n/g, '\n').match(REGEX);
  if (! matches) {
    return { data: null, body: str };
  }
  const matterType = matches[1] || 'yaml';
  const data = matterType === 'json' ? JSON.parse(matches[2]) : 
    matterType === 'yaml' ? smolYAML(matches[2]) : null;
  const body = matches[3];
  return { data, body };
}
