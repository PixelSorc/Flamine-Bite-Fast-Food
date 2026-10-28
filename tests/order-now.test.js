const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const menuHtml = fs.readFileSync(path.join(__dirname, '..', 'menu.html'), 'utf8');

test('Ordenar Ahora lleva directamente a los productos del menú', () => {
  const link = [...indexHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .find(([, , content]) => content.trim() === 'Ordenar Ahora');

  assert.ok(link, 'Debe existir el enlace Ordenar Ahora');
  assert.match(link[1], /href="menu\.html#productos"/);
  assert.match(menuHtml, /<section\s+id="productos"/);
});
