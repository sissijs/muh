import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import nonStrictAssert from 'node:assert';
import { createContext } from 'node:vm';

import { parseFilterExpression } from '../../src/utils/parse-filter-expression.js';

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
