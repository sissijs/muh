import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processTemplateFile } from '../src/process-template-file.js';

const createDefaultTestResolver = (vFS) => async (filePath) => {
  const normalizedPath = filePath?.replace(/\\/g,'/')
  return vFS[normalizedPath]
}

const withFrontmatter = (str, data) => `---\n${
  Object.entries(data)
    .map(([key, val]) => `${key}: ${JSON.stringify(val)}`).join('\n')
  }\n---\n${str}`


describe('processTemplateFile', () => {

  it('should be able to work with null/undefined data and config', async () => {
    const vFS = {
      'index.html': '<h1>Hello World!</h1>',
    };

    const content = vFS['index.html'];
    const result = await processTemplateFile(content, 'index.html', null, null);

    assert.equal(result, content);
  });

  it('should be able to work with null/undefined data', async () => {
    const vFS = {
      'index.html': '<h1>Hello World!</h1>',
    };

    const config = {
      resolve: createDefaultTestResolver(vFS)
    };

    const content = vFS['index.html'];
    const result = await processTemplateFile(content, 'index.html', null, config);

    assert.equal(result, content);
  });

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
