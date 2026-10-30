import { test } from 'node:test';
import assert from 'node:assert/strict';
import { licencaLivre, textoPlano, candidato } from '../scripts/blog-foto.mjs';

test('licencaLivre aceita CC0, domínio público, CC BY e CC BY-SA; recusa NC, ND e vazio', () => {
  for (const l of ['CC0', 'Public domain', 'CC BY 2.0', 'CC BY-SA 4.0']) assert.ok(licencaLivre(l), l);
  for (const l of ['CC BY-NC 2.0', 'CC BY-ND 4.0', 'CC BY-NC-SA 3.0', 'GFDL', undefined]) assert.ok(!licencaLivre(l), l);
});

test('textoPlano tira tags e entidades do autor', () => {
  assert.equal(textoPlano('<a href="//x">Underwood &amp; Underwood</a>\n'), 'Underwood & Underwood');
});

const pagina = (i, m = {}) => ({ title: 'File:A.jpg', imageinfo: [{ width: 2000, height: 1300, mime: 'image/jpeg', thumburl: 'https://t/a.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:A.jpg', extmetadata: { LicenseShortName: { value: 'CC BY 2.0' }, Artist: { value: 'Pam' }, ...m }, ...i }] });

test('candidato: só JPEG em paisagem, com pelo menos 1200 px e licença livre', () => {
  assert.deepEqual(candidato(pagina()), { titulo: 'File:A.jpg', largura: 2000, altura: 1300, licenca: 'CC BY 2.0', autor: 'Pam', origem: 'https://commons.wikimedia.org/wiki/File:A.jpg', imagem: 'https://t/a.jpg' });
  assert.equal(candidato(pagina({ mime: 'image/png' })), null);
  assert.equal(candidato(pagina({ width: 1000, height: 600 })), null);
  assert.equal(candidato(pagina({ width: 2000, height: 2000 })), null);
  assert.equal(candidato(pagina({}, { LicenseShortName: { value: 'CC BY-NC 2.0' } })), null);
  assert.equal(candidato({ title: 'File:B.jpg' }), null);
});
