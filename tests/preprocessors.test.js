import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processTemplateFile } from '../src/process-template-file.js';

const createDefaultTestResolver = (vFS) => async (filePath) => {
  const normalizedPath = filePath?.replace(/\\/g,'/')
  return vFS[normalizedPath]
}

describe('preprocessors', () => {

  it('interpretes a <html-include src="..."> tag as basic include when the extension is .html', async () => {
    const vFS = {
      'index.html': '<h1>{{ title }}</h1>\n<html-include src="article.html" text="muh">',
      '_includes/article.html': '<article>{{ text }}</article>'
    };

    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const content = vFS['index.html'];
    const result = await processTemplateFile(content, 'index.html', {title: 'test'}, config);

    assert.equal(result, '<h1>test</h1>\n<article>muh</article>');
  });

  it('can nicely bundle basic css imports', async () => {
    const vFS = {
      'styles.css': '@import "vendor/_reset.css";\n',
      'vendor/_reset.css': '* { box-sizing: border-box; }\n',
    };

    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const content = vFS['styles.css'];
    const result = await processTemplateFile(content, 'styles.css', undefined, config);

    assert.equal(result, '* { box-sizing: border-box; }\n');
  });

  it('can nicely bundle basic css imports with layer syntax', async () => {
    const vFS = {
      'styles.css': '@import "vendor/_reset.css" layer (reset);\n',
      'vendor/_reset.css': '* { box-sizing: border-box; }\n',
    };

    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const content = vFS['styles.css'];
    const result = await processTemplateFile(content, 'styles.css', undefined, config);

    assert.equal(result, '@layer reset {\n* { box-sizing: border-box; }\n\n}\n');
  });


  it('supports basic markdown to html transforms', async () => {
    const vFS = {
      'index.md': '# Headline\n\nLorem ipsum dolor sit amet.\n\n<html-include src="./test.md">\n\n<html-include src="./test2.html">\n',
      'test.md': '## Headline 2\n\nmuh\n',
      'test2.html': '<h3>Headline 3</h3>'
    };

    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const content = vFS['index.md'];
    const result = await processTemplateFile(content, 'index.md', undefined, config);

    const expected = '<h1>Headline</h1>\n\n<p>Lorem ipsum dolor sit amet.</p>\n\n<h2>Headline 2</h2>\n\n<p>muh</p>\n\n\n<h3>Headline 3</h3>\n'

    assert.equal(result, expected);
  })

});
