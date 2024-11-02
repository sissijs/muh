import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { json, limit, last, async, each, date, time, numberFormat, currency, reverse, sort, htmlentities, urlencode } from '../src/builtin-filters.js'

describe('built-in filters', () => {
  test('json', () => {
    assert.equal(json({name: 'Lea'}), '{"name":"Lea"}');
  });

  test('limit', () => {
    const array = [1, 2, 3, 4, 5];
    assert.deepEqual(limit(array, 3), [1,2,3]);
  });

  test('last', () => {
    const array = [1, 2, 3, 4, 5];
    assert.deepEqual(last(array), [5]);
  });

  test('reverse', () => {
    const array = [1, 2, 3, 4, 5];
    assert.deepEqual(reverse(array), [5,4,3,2,1]);
  });

  test('sort', () => {
    const array = [1, 4, 5, 2, 3];
    assert.deepEqual(sort(array), [1, 2, 3, 4, 5]);
  });

  test('each', () => {
    const array = [1, 2, 3];
    const li = (item) => `<li>${item}</li>`
    assert.deepEqual(each(array, li), 
      '<li>1</li><li>2</li><li>3</li>'
    );
  });

  test('async', async () => {
    const promised = Promise.resolve(42);
    assert.equal(await async(promised), 42);
  });
  
  test('date', () => {
    const d = new Date('2024-03-15');
    assert.equal(date(d), '15.03.2024')
  });

  test('time', () => {
    const d = new Date('2024-03-15T15:30:00');
    assert.equal(time(d), '15:30')
  });

  test('numberFormat', () => {
    const n = 12345.67;
    assert.equal(numberFormat(n, 'de'), '12.345,67')
  });

  test('currency', () => {
    const price = 3212.94;
    assert.equal(currency(price, 'de'), '3.212,94 €');
  });

  test('htmlentities', () => {
    assert.equal(htmlentities('<h1>'), '&lt;h1&gt;');
  });

  test('urlencode', () => {
    assert.equal(urlencode(' '), '%20');
  });
});
