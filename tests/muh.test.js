import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import nonStrictAssert from 'node:assert';
import { createContext } from 'node:vm';
import { processTemplateFile } from '../src/muh.js';
import { parseFilterExpression } from '../src/utils/parse-filter-expression.js';
import { template } from '../src/utils/template.js';


const createDefaultTestResolver = (vFS) => async (filePath) => {
  const normalizedPath = filePath?.replace(/\\/g,'/')
  return vFS[normalizedPath]
}
const withJsonFrontmatter = (str, data) => `---json\n${JSON.stringify(data)}\n---\n${str}`

const withFrontmatter = (str, data) => `---\n${
  Object.entries(data)
    .map(([key, val]) => `${key}: ${JSON.stringify(val)}`).join('\n')
  }\n---\n${str}`

describe('parseFilterExpression function', () => {
  const scope = { meta: { authors: ['Joe', 'Lea'] }, foo: 'bar', test: () => 42 };
  const context = createContext(scope);

  it('should parse a parameterless filter', () => {
    const [filter, args] = parseFilterExpression('uppercase', context);

    assert.equal(filter, 'uppercase');
    assert.equal(args, null);
  });

  it('should parse the filter and a list of constant arguments from an expression', () => {
    const [filter, args] = parseFilterExpression('language: "de"', context);

    assert.equal(filter, 'language');
    nonStrictAssert.deepEqual(args, ["de"]);
  });

  it('should addionally resolve any variable used', () => {
    const [filter, args] = parseFilterExpression('author: meta.authors[1]', context);

    assert.equal(filter, 'author');
    nonStrictAssert.deepEqual(args, ['Lea']);
  });
});

describe('template function', () => {

  it('should be able to work with null/undefined data', async () => {
    assert.equal(await template('muh', undefined), 'muh');

    assert.equal(await template('muh', null), 'muh');
  });

  it('should insert data into the placeholders wrapped in double curly brackets', async () => {
    const testData = {
      'title': 'This is a title',
      'meta': {
        'authors': ['Joe', 'Lea'],
      }
    }

    const testTemplate = 
      '<h1>{{ title }}</h1>\n' +
      '<p>Blog article by {{ meta.authors[1] }}</p>\n'

    const expected = 
      '<h1>This is a title</h1>\n' +
      '<p>Blog article by Lea</p>\n';
    
    assert.equal(await template(testTemplate, testData), expected);
  });

  it('should be able to invoke functions', async () => {
    const testData = {
      date() { return '12.03.2024' }
    }
    assert.equal(await template('{{ date }}', testData), '12.03.2024');
  });

  it('should be able to invoke functions with parameters', async () =>  {
    const testData = {
      calculate(a, b) { return a * b; },
      sideA: 3,
      sideB: 4
    }

    const testTemplate = 'The rectangle has an area of {{ calculate(sideA, sideB) }} square meters';
    const expected = 'The rectangle has an area of 12 square meters';

    assert.equal(await template(testTemplate, testData), expected);
  });

  it('should be able to apply a filter', async () => {
    const filters = new Map();
    filters.set('shout', (str) => (str||'').toUpperCase());
    const result = await template('{{ greeting | shout }}', {greeting: "Hello"}, { filters });
    
    assert.equal(result, "HELLO");
  });

  it('should escape angle brackets and ampersands by default', async () => {
    const result = await template('{{ content }}', {content: '<h1>Hello</h1>'});

    assert.equal(result, '&lt;h1&gt;Hello&lt;/h1&gt;')
  });

  it('should not escape angle brackets and ampersands when marked safe', async () => {
    const result = await template('{{ content | safe }}', {content: '<h1>Hello</h1>'});

    assert.equal(result, '<h1>Hello</h1>')
  });

  it('should be able to apply a filter with additional parameters', async () => {
    const data = { greeting: 'Hello Lea' }
    const filters = new Map();
    filters.set('piratify', (str, prefix = 'Yo-ho-ho', suffix = 'yarrr') => `${prefix}! ${str}, ${suffix}!`);

    assert.equal(await template('{{ greeting | piratify }}', data, { filters }), 'Yo-ho-ho! Hello Lea, yarrr!');
    assert.equal(await template('{{ greeting | piratify: "AYE" }}', data, { filters }), 'AYE! Hello Lea, yarrr!');
    assert.equal(await template('{{ greeting | piratify: "Ahoy", "matey" }}', data, { filters }), 'Ahoy! Hello Lea, matey!');
  });

  it('should be able to chain filters', async () => {
    const filters = new Map();
    filters.set('shout', (str) => (str||'').toUpperCase());
    filters.set('piratify', (str, prefix = 'Yo-ho-ho', suffix = 'yarrr') => `${prefix}! ${str}, ${suffix}!`);

    const data = { greeting: 'Hello Lea' };
    assert.equal(await template('{{ greeting | piratify | shout }}', data, { filters }), 'YO-HO-HO! HELLO LEA, YARRR!');

    // order matters
    assert.equal(await template('{{ greeting | shout | piratify }}', data, { filters }), 'Yo-ho-ho! HELLO LEA, yarrr!');
  });

  it('should be able to resolve async operations', async () => {
    const data = { answer: () => Promise.resolve(42) };

    assert.equal(await template('{{ answer | async }}', data), '42');
  });

  it('should be able to auto-resolve async operations', async () => {
    const data = { answer: () => Promise.resolve(42) };

    assert.equal(await template('{{ answer }}', data), '42');
  });

  it('should render rejected promises inside a custom element', async () => {
    const data = { divideByZero: () => Promise.reject(new Error('boom')) };
    assert.equal(await template('{{ divideByZero }}', data), '<template-error>Error: boom</template-error>');
  });

  it('should render undefined variables as empty string', async () => {
    const data = {theVoid: void 0};
    assert.equal(await template('{{ theVoid }}', data), '');
  });

});

describe('processTemplateFile', () => {
  it('should be able to include files', async () => {
    const vFS = {
      'index.html': '<h1>{{ title }}</h1>\n{{ include("article.html", {text: "muh"}) | safe }}',
      '_includes/article.html': '<article>{{ text }}</article>'
    };

    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const content = vFS['index.html'];
    const result = await processTemplateFile(content, 'index.html', {title: 'test'}, config);

    assert.equal(result, '<h1>test</h1>\n<article>muh</article>');
  });

  it('should be able to include files with waterfall includes', async () => {
    const vFS = {
      'index.html': '<h1>{{ title }}</h1>\n{{ include("wrapper.html") | safe }}',
      '_includes/wrapper.html': '<div>{{ include("article.html", {text: "muh"}) | safe }}</div>',
      '_includes/article.html': '<article>{{ text }}</article>'
    };

    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const content = vFS['index.html'];
    const result = await processTemplateFile(content, 'index.html', {title: 'test'}, config);

    assert.equal(result, '<h1>test</h1>\n<div><article>muh</article></div>');
  });

  it('should be able to include files with cyclic includes', async () => {
    const vFS = {
      'index.html': '<h1>{{ title }}</h1>\n{{ include("wrapper.html") | safe }}',
      '_includes/wrapper.html': '<div>{{ include("article.html", {text: "muh"}) | safe }}</div>',
      '_includes/article.html': '<article>{{ include("index.html") | safe }}</article>'
    };

    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const content = vFS['index.html'];
    const result = await processTemplateFile(content, 'index.html', {title: 'test'}, config);

    assert.equal(result, 
      '<h1>test</h1>\n' +
      '<div><article>' + 
      '<template-error>Error: cyclic dependency detected.</template-error>' +
      '</article></div>'
    );
  });

  it('should be able to read data provided by the frontmatter', async () => {
    const vFS = {
      'index.html': withFrontmatter('<h1>{{ title }}</h1>', {title: 'Hello'}),
    };
    const content = vFS['index.html'];
    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const result = await processTemplateFile(content, 'index.html', {title: 'Untitled'}, config);
    assert.equal(result, '<h1>Hello</h1>');
  });

  it('should be able to specify a layout', async () => {
    const vFS = {
      'index.html': withFrontmatter('<h1>{{ title }}</h1>', {title: 'Hello', layout: 'article.html'}),
      '_layouts/article.html': '<article>{{ content | safe }}</article>',
    };

    const content = vFS['index.html'];
    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const result = await processTemplateFile(content, 'index.html', null, config);
    assert.equal(result, '<article><h1>Hello</h1></article>');
  });

  it('should be able to handle nested layouts', async () => {
    const vFS = {
      'index.html': 
        withFrontmatter('<h1>{{ title }}</h1>', {title: 'Hello', layout: 'article'}),
      '_layouts/article.html': 
        withFrontmatter('<article>{{ content | safe }}</article>', {layout: 'base'}),
      '_layouts/base.html': '<body>{{ content | safe }}</body>',
    };

    const content = vFS['index.html'];
    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const result = await processTemplateFile(content, 'index.html', null, config);
    assert.equal(result, '<body><article><h1>Hello</h1></article></body>');
  });

  it('should be able to handle cyclic dependencies by displaying an error', async () => {
    const vFS = {
      'index.html': 
        withFrontmatter('<h1>{{ title }}</h1>', {title: 'Hello', layout: 'article'}),
      '_layouts/article.html': 
        withFrontmatter('<article>{{ content | safe }}</article>', {layout: 'base'}),
      '_layouts/base.html': withFrontmatter('<body>{{ content | safe }}</body>', {layout: 'article'})
    };

    const content = vFS['index.html'];
    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const result = await processTemplateFile(content, 'index.html', null, config);
    assert.equal(result, '<template-error>Error: cyclic dependency detected.</template-error>');
  });

});

describe('additional syntaxes', () => {

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
