import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import nonStrictAssert from 'node:assert';
import { createContext } from 'node:vm';

import { parseFilterExpression, processTemplateFile, template } from '../src/muh.js';

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
      resolve: async (filePath) => vFS[filePath]
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
      resolve: async (filePath) => vFS[filePath]
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
      resolve: async (filePath) => vFS[filePath]
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

});
