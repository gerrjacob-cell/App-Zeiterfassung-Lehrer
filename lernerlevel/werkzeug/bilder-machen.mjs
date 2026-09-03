/**
 * Erzeugt die Bildschirmfotos für die Anleitung (Ordner bilder/).
 *
 * Voraussetzung:  npm install playwright
 * App lokal ausliefern:  python3 -m http.server 8123   (im Ordner lernerlevel/)
 * Danach:  node werkzeug/bilder-machen.mjs
 *
 * Die Bilder zeigen den Demobestand mit erfundenen Namen. Der Browser läuft
 * auf Deutsch, damit die Datumsfelder wie auf einem deutschen iPad aussehen.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'bilder');
const B = process.env.APP_URL || 'http://127.0.0.1:8123/';

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PFAD || undefined,
  args: ['--lang=de-DE'],
  env: { ...process.env, LANG: 'de_DE.UTF-8', LANGUAGE: 'de_DE:de' },
});

const seite = async (hoehe) =>
  browser.newPage({
    viewport: { width: 1180, height: hoehe },
    deviceScaleFactor: 2,
    colorScheme: 'light',
    locale: 'de-DE',
  });

const idVon = (p, nachname) =>
  p.evaluate(
    (n) => JSON.parse(localStorage.getItem('lernerlevel.v1')).schueler.find((s) => s.nachname === n).id,
    nachname,
  );

/* Dashboard: sauber unter der vierten Zeile abschneiden. */
const p1 = await seite(1000);
await p1.goto(`${B}#/g/gr_flex`, { waitUntil: 'networkidle' });
await p1.waitForTimeout(500);
const unten = await p1.locator('.zeile').nth(3).evaluate((el) => el.getBoundingClientRect().bottom);
await p1.screenshot({
  path: `${OUT}/dashboard.png`,
  clip: { x: 0, y: 0, width: 1180, height: Math.round(unten) + 8 },
});

/* Profil eines Schülers mit laufendem Floß. */
await p1.goto(`${B}#/g/gr_flex/s/${await idVon(p1, 'Cakir')}`);
await p1.waitForTimeout(500);
const untenProfil = await p1.locator('.text-knopf').first().evaluate((el) => el.getBoundingClientRect().bottom);
await p1.screenshot({
  path: `${OUT}/profil.png`,
  clip: { x: 0, y: 0, width: 1180, height: Math.round(untenProfil) + 12 },
});

/* Startformular: hohes Fenster, damit der Dialog nicht scrollt. */
const p2 = await seite(1500);
await p2.goto(B, { waitUntil: 'networkidle' });
await p2.goto(`${B}#/g/gr_flex/s/${await idVon(p2, 'Stein')}`);
await p2.waitForTimeout(400);
await p2.locator('.knopf', { hasText: 'FLOSS STARTEN' }).click();
await p2.waitForSelector('dialog.dialog');
await p2.locator('.chip', { hasText: 'Selbstständigkeit' }).click();
await p2.locator('.vorschlag').first().click();
await p2.waitForTimeout(300);
await p2.locator('dialog.dialog').screenshot({ path: `${OUT}/floss-start.png` });

/* Klassenliste importieren. */
const p3 = await seite(1000);
await p3.goto(`${B}#/verwaltung`, { waitUntil: 'networkidle' });
await p3.waitForTimeout(400);
await p3.locator('.knopf', { hasText: 'Klassenliste importieren' }).click();
await p3.waitForSelector('dialog.dialog');
await p3.locator('dialog textarea.eingabe').fill(
  'Kruse, Hannes\nSchmidt, Marie\nWeber, Tom\nEhlers, David\nJansen, Mia\nKoch, Ali',
);
await p3.locator('dialog input[list=gruppen-liste]').fill('9b');
await p3.waitForTimeout(400);
await p3.locator('dialog.dialog').screenshot({ path: `${OUT}/import.png` });

await browser.close();
console.log('Bilder geschrieben nach', OUT);
