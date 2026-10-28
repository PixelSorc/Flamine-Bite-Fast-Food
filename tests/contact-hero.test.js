const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'contacto.html'), 'utf8');
const hero = html.match(/<section class="contact-hero">([\s\S]*?)<\/section>/)?.[1] || '';

test('el hero de contacto ofrece accesos funcionales a formulario y canales', () => {
  assert.match(hero, /href="#contact-form-container"/);
  assert.match(hero, /href="#contact-options"/);
  assert.match(html, /id="contact-form-container"/);
  assert.match(html, /id="contact-options"/);
});
