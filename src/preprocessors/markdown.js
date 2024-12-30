import { htmlPreprocessor } from "./html.js";

const MAGIC = [
  [/^###### (.{1,1000})$/g, '<h6>$1</h6>'],
  [/^##### (.{1,1000})$/g, '<h5>$1</h5>'],
  [/^#### (.{1,1000})$/g, '<h4>$1</h4>'],
  [/^### (.{1,1000})$/g, '<h3>$1</h3>'],
  [/^## (.{1,1000})$/g, '<h2>$1</h2>'],
  [/^# (.{1,1000})$/g, '<h1>$1</h1>'],
  [/ $/gm, '<br/>'],
  [/__(.{1,1000}?)__/g, '<em>$1</em>'],
  [/_(.{1,1000}?)_/g, '<em>$1</em>'],
  [/\*\*(.{1,1000}?)\*\*/g, '<strong>$1</strong>'],
  [/\*(.{1,1000}?)\*/g, '<strong>$1</strong>'],
  [/`(.{1,1000}?)`/, '<code>$1</code>'],
  [/<(https?:\/\/.+)>/g, '<a href="$1">$1</a>'],
  [
    /!\[(.{1,1000})\]\((.{1,1000}?)\)/g,
    '<img src="$2" alt="$1" />'
  ],
  [
    /\[(.{1,1000}?)\]\((.{1,1000}?)\)/g,
    '<a href="$2">$1</a>'
  ]
];

const UL_PATTERN = /((\s*)(-|(?:(?:\d+\.){1,1000})) (.{1,1000})\n)+/
const ULLI_PATTERN = /(\s*)(-|(?:(?:\d+\.){1,1000})) (.{1,1000})\n?/g

function inlines(str) {
  let result = str
  for (const [search, replace] of MAGIC) {
    result = result.replace(search, replace);
  }
  return result
}

function renderList(list) {
  let u = Number.isNaN(list.start)
  let html = u ? '<ul>' : `<ol${list.start!==1?` start="${list.start}"`:''}>`;
  for (const li of list.items) {
    html += '<li>' + inlines(li.content);
    if (li.childList) {
      html+=renderList(li.childList);
    }
    html += '</li>';
  }
  return html + (u?'</ul>':'</ol>');
}

function parseList(block) {
  const matches = block.matchAll(ULLI_PATTERN);
  if (! matches) {
    throw new Error('could not be parsed', block);
  }
  const m = Array.from(matches);
  const listItems = m.map(match => ({
    indent: match[1].length,
    prefix: match[2],
    content: match[3],
  }));
  const parseStart = (str) => {
    const idxPattern = str.match(/(\d+)\.$/);
    return idxPattern ? parseInt(idxPattern[1]): NaN;
  }

  const list = {start: parseStart(listItems[0].prefix), items: []};
  let currentList = list;
  let stack = [];
  let last = null;

  for (const li of listItems) {
    if (last !== null && li.indent > last.indent) {
      stack.push(currentList);
      currentList = last.childList  = {
        start: parseStart(li.prefix),
        items: []
      };
    } else
    if (last && li.indent < last.indent && stack.length > 0) {
      currentList = stack.pop();
    }
    const item = {...li, childList: null};
    currentList.items.push(item);
    last = item;
  }
  return renderList(list);
}

function codeblocks(str, snippetStore) {
  let counter = 1;
  return str.split(/\n```/g).map((part, idx) => {
    if (idx % 2 === 0) {
      return part;
    }
    const lf = part.indexOf('\n');
    if (lf === -1) {
      return part;
    }
    const lang = part.slice(0, lf);
    const code = part.slice(lf + 1);
    const key =  'MARKDOWNSNIPPET' + (counter++)
    const l = lang ? ` class="language-${lang}"` : '';
    snippetStore.set(key,
      `<pre${l}><code${l}>${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n</code></pre>`
    );
    
    return `{{ ${key} }}`
  }).join('\n').trim();
}

function markdownEscape(str) {
  return str.replace(/\\([a-z/\\`{}])/, '$1').replace(/(.?)([<>&])(.?)/g, 
    (_, before, char, after) => 
      before + (/[^\s]+/.test(before) || /[^\s]+/.test(after) ? char:`&${{'<':'lt','>':'gt','&':'amp'}[char]};`) + after
    );
}

/**
 * The integrated markdown processor
 * @param {string} input input
 * @param {escape} escape whether to escape the output or not 
 * @returns 
 */
export function markdown(input, escape = true) {
  if (! input) {
    return undefined;
  }
  const vars = new Map();
  const esc = (str) => escape?markdownEscape(str):str;
  return esc(codeblocks(input.replace(/\r\n/g,'\n'), vars).split('\n\n')
    .map(block => inlines(block.trim()))
    .map(block => {
    if (UL_PATTERN.test(block)) {
      return parseList(block);
    }
    if (block.startsWith('> ')) {
      return `<blockquote>\n${block.replace(/^> /gm, '')}\n</blockquote>`
    }
    if (/^<.+?>/.test(block)) {
      return block;
    }
    if (/\{\{ MARKDOWNSNIPPET\d+ \}\}/.test(block)) {
      return block;
    }
    return `<p>${block}</p>`
  }).join('\n\n')).replace(/\{\{\s*(\w+)\s*\}\}/g, 
    (outer, expr) => (vars.get(expr)) ? vars.get(expr) : outer
  ).trim() + '\n';
}

export const markdownPreprocessor = {
  name: 'markdown',
  extension: '.md',
  outputExtension: '.html',
  /**
   * Markdown engine. Override to use another markdown engine.
   * @param {string} content the markdown input
   * @returns {Promise<string>} processed markdown
   */
  markdownEngine: async (content) => {
    return await markdown(content)
  },
  async process(content, data) {
    content = await markdownPreprocessor.markdownEngine(content);
    return await htmlPreprocessor.process(content, data);
  }
}
