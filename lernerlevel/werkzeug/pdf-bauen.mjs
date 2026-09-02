/**
 * Erzeugt aus anleitung.html das PDF anleitung.pdf.
 *
 * Einmalig vorbereiten:   npm install playwright
 * Danach:                 node werkzeug/pdf-bauen.mjs
 *
 * Der Inhalt steht nur in anleitung.html. Dieses Skript druckt die Seite
 * lediglich, ergänzt Seitenzahlen und erzwingt die helle Darstellung - damit
 * es keine zweite Fassung gibt, die veraltet.
 */

import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const hier = dirname(fileURLToPath(import.meta.url));
const quelle = resolve(hier, '..', 'anleitung.html');
const ziel = resolve(hier, '..', 'anleitung.pdf');

const fuss = `
  <div style="width:100%;padding:0 16mm;font-size:8px;color:#6b7280;
              font-family:-apple-system,system-ui,'Segoe UI',sans-serif;
              display:flex;justify-content:space-between;">
    <span>Lernerlevel Manager &middot; Anleitung f&uuml;r das Kollegium</span>
    <span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span></span>
  </div>`;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PFAD || undefined,
});
const seite = await browser.newPage({ colorScheme: 'light' });

await seite.goto(pathToFileURL(quelle).href, { waitUntil: 'networkidle' });
await seite.emulateMedia({ media: 'print' });
await seite.pdf({
  path: ziel,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: fuss,
  margin: { top: '16mm', bottom: '18mm', left: '16mm', right: '16mm' },
});

await browser.close();
console.log('geschrieben:', ziel);
