/**
 * Service Worker des Lernerlevel Managers.
 *
 * Zwei Aufgaben:
 *
 * 1. Die App startet auch ohne Netz, wenn sie einmal geladen wurde.
 * 2. Er beansprucht den eigenen Unterordner. Ohne ihn läge dieser Ordner im
 *    Geltungsbereich des Service Workers der Zeiterfassungs-App, die eine
 *    Seite zuerst aus ihrem Zwischenspeicher beantwortet - hier würde man
 *    dann beim Testen regelmäßig die vorige Fassung sehen.
 *
 * Strategie bewusst netz-zuerst: Solange am Prototyp gearbeitet wird, ist eine
 * veraltete Datei lästiger als ein langsamer Start. Der Zwischenspeicher
 * springt nur ein, wenn das Netz nicht antwortet.
 */

const CACHE = 'lernerlevel-v1';

const HUELLE = [
  './',
  'index.html',
  'anleitung.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/ui.js',
  'js/store.js',
  'js/model.js',
  'js/quelle.js',
  'js/identitaet.js',
  'js/ereignis.js',
  'js/qr.js',
  'js/demodaten.js',
  'js/views/bausteine.js',
  'js/views/gruppen.js',
  'js/views/dashboard.js',
  'js/views/schueler.js',
  'js/views/verfahren.js',
  'js/views/verwaltung.js',
  'js/views/protokoll.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches
      .open(CACHE)
      // Einzeln ablegen: eine fehlende Datei soll die Installation nicht kippen.
      .then((cache) => Promise.all(HUELLE.map((pfad) => cache.add(pfad).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET') return;
  if (new URL(anfrage.url).origin !== self.location.origin) return;

  ereignis.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        if (antwort && antwort.ok) {
          const kopie = antwort.clone();
          caches.open(CACHE).then((cache) => cache.put(anfrage, kopie));
        }
        return antwort;
      })
      .catch(() =>
        caches.match(anfrage).then((zwischengespeichert) => {
          if (zwischengespeichert) return zwischengespeichert;
          // Ohne Netz und ohne Treffer: bei Seitenaufrufen die App-Hülle zeigen.
          if (anfrage.mode === 'navigate') return caches.match('index.html');
          return Response.error();
        }),
      ),
  );
});
