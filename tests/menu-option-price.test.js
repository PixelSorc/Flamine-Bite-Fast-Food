const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const menuScript = fs.readFileSync(path.join(__dirname, '..', 'JS', 'menu.js'), 'utf8');

function renderPrice(selectedPrice) {
  const attributes = {};
  const priceElement = {
    textContent: '',
    setAttribute: (name, value) => { attributes[name] = value; },
  };
  const selectedOption = selectedPrice === null ? null : { dataset: { price: String(selectedPrice) } };
  const card = {
    dataset: { price: '9900' },
    querySelector: (selector) => selector === '.menu-price' ? priceElement : selectedOption,
  };

  vm.runInNewContext(`${menuScript}\nupdateCardPrice(card);`, {
    document: { addEventListener() {} },
    card,
  });
  return { text: priceElement.textContent, attributes };
}

test('el precio visible toma el precio de la opción seleccionada', () => {
  const result = renderPrice(11900);
  assert.match(result.text, /11\.900/);
  assert.equal(result.attributes['aria-live'], 'polite');
});

test('sin opción seleccionada conserva el precio base del producto', () => {
  const result = renderPrice(null);
  assert.match(result.text, /9\.900/);
});
