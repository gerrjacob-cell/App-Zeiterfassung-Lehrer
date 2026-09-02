/**
 * Prüft die Oberfläche auf den Bildschirmgrößen, die im Schulalltag vorkommen.
 *
 * Einmalig vorbereiten:  npm install playwright
 * App lokal ausliefern:  python3 -m http.server 8123   (im Ordner lernerlevel/)
 * Danach:                node werkzeug/geraete-pruefen.mjs
 *
 * Gemeldet wird, was auf einem Touchgerät wirklich stört: Tippflächen unter
 * 44 px, seitliches Scrollen der Seite, ein Dialog, der aus dem Bild läuft,
 * und ein Hauptknopf, den man erst suchen muss.
 */

import { chromium } from 'playwright';

const GERAETE = [
  { name: 'iPhone SE hoch',        w: 375,  h: 667,  mobil: true },
  { name: 'iPhone 15 hoch',        w: 393,  h: 852,  mobil: true },
  { name: 'iPhone 15 quer',        w: 852,  h: 393,  mobil: true },
  { name: 'iPad mini hoch',        w: 744,  h: 1133, mobil: true },
  { name: 'iPad Air hoch',         w: 820,  h: 1180, mobil: true },
  { name: 'iPad Air quer',         w: 1180, h: 820,  mobil: true },
  { name: 'iPad Split View schmal', w: 507, h: 1080, mobil: true },
];

const B = 'http://127.0.0.1:8123/';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PFAD || undefined,
  args: ['--lang=de-DE'],
  env: { ...process.env, LANG: 'de_DE.UTF-8', LANGUAGE: 'de_DE:de' },
});

const messung = async (p) =>
  p.evaluate(() => {
    const klein = [];
    const auswahl = 'button, a, input, select, textarea, [role="button"], summary';
    for (const e of document.querySelectorAll(auswahl)) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (e.classList.contains('nur-tastatur')) continue; // nur bei Tastaturfokus sichtbar
      const traeger = e.closest('.zeile, .kachel, .verwaltungs-zeile');
      if (traeger && traeger !== e && traeger.getBoundingClientRect().height >= 44) continue;
      if (r.height < 44 || r.width < 44) {
        klein.push(
          `${e.className || e.tagName}:${Math.round(r.width)}x${Math.round(r.height)} "${(e.textContent || '').trim().slice(0, 18)}"`,
        );
      }
    }
    return {
      quer: document.documentElement.scrollWidth > window.innerWidth + 1,
      breiteDoc: document.documentElement.scrollWidth,
      klein: [...new Set(klein)],
    };
  });

for (const g of GERAETE) {
  const ctx = await browser.newContext({
    viewport: { width: g.w, height: g.h },
    deviceScaleFactor: 2,
    isMobile: g.mobil,
    hasTouch: true,
    locale: 'de-DE',
  });
  const p = await ctx.newPage();
  const fehler = [];
  p.on('pageerror', (e) => fehler.push(e.message));

  const berichte = [];
  // Startseite
  await p.goto(B, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);
  berichte.push(['Start', await messung(p)]);

  // Dashboard
  await p.goto(B + '#/g/gr_flex');
  await p.waitForTimeout(400);
  berichte.push(['Dashboard', await messung(p)]);

  // Profil mit laufendem Verfahren
  const id = await p.evaluate(
    () => JSON.parse(localStorage.getItem('lernerlevel.v1')).schueler.find((s) => s.nachname === 'Cakir').id,
  );
  await p.goto(`${B}#/g/gr_flex/s/${id}`);
  await p.waitForTimeout(400);
  berichte.push(['Profil', await messung(p)]);

  // Dialog "Floß starten"
  const id2 = await p.evaluate(
    () => JSON.parse(localStorage.getItem('lernerlevel.v1')).schueler.find((s) => s.nachname === 'Stein').id,
  );
  await p.goto(`${B}#/g/gr_flex/s/${id2}`);
  await p.waitForTimeout(300);
  await p.locator('.knopf', { hasText: 'FLOSS STARTEN' }).click();
  await p.waitForSelector('dialog.dialog');
  await p.waitForTimeout(300);
  const dlg = await p.evaluate(() => {
    const d = document.querySelector('dialog.dialog');
    const r = d.getBoundingClientRect();
    const inhalt = d.querySelector('.dialog-inhalt');
    const knopf = [...d.querySelectorAll('.knopf.gross')].pop();
    const kr = knopf ? knopf.getBoundingClientRect() : null;
    return {
      breiter_als_fenster: r.width > window.innerWidth + 1,
      hoeher_als_fenster: r.height > window.innerHeight + 1,
      inhalt_scrollt: inhalt.scrollHeight > inhalt.clientHeight + 1,
      startknopf_sichtbar: kr ? kr.bottom <= window.innerHeight + 1 && kr.top >= 0 : null,
      startknopf_hoehe: kr ? Math.round(kr.height) : null,
    };
  });
  berichte.push(['Dialog', { ...(await messung(p)), dlg }]);
  await p.keyboard.press('Escape');

  console.log('\n### ' + g.name + ` (${g.w}x${g.h})`);
  for (const [wo, m] of berichte) {
    const teile = [];
    if (m.quer) teile.push(`QUERSCROLL (${m.breiteDoc}px)`);
    if (m.klein.length) teile.push(`zu klein: ${m.klein.slice(0, 4).join(', ')}${m.klein.length > 4 ? ` (+${m.klein.length - 4})` : ''}`);
    if (m.dlg) {
      const d = m.dlg;
      if (d.breiter_als_fenster) teile.push('Dialog breiter als Fenster');
      if (d.hoeher_als_fenster) teile.push('Dialog höher als Fenster');
      if (d.startknopf_sichtbar === false) teile.push('Startknopf nicht im Bild');
    }
    console.log('  ' + wo + ': ' + (teile.length ? teile.join(' | ') : 'ok'));
  }
  if (fehler.length) console.log('  FEHLER:', fehler.slice(0, 2));
  await ctx.close();
}
await browser.close();
