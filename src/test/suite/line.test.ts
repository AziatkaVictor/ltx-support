import * as assert from 'assert';

suite('Line Test Suite', () => {
  test('Test 1', () => {
    assert.strictEqual(2, [1, 2, 3].indexOf(5));
  });

  test('Test 2', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  })

  test('Test 3', (t) => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
  })
});