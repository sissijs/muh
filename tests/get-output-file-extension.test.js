import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getOutputFileExtension } from '../src/get-output-file-extension.js';

describe('getOutputFileExtension', () => {
  it('should find out that markdown files transform to .html by default', () => {
    assert.equal(getOutputFileExtension('readme.md'), '.html');
  });

  it('should find out that .muh files transform to .html by default', () => {
    assert.equal(getOutputFileExtension('readme.muh'), '.html');
  });

  it('should find out that html files stay .html', () => {
    assert.equal(getOutputFileExtension('readme.html'), '.html');
  });

  it('should find out that css files stay .css', () => {
    assert.equal(getOutputFileExtension('styles.css'), '.css');
  });
})
