/**
 * Service Worker: macht die App offline nutzbar.
 *
 * Strategie: Beim Installieren wird die App-Hülle in den Cache gelegt. Im
 * Betrieb wird zuerst das Netz gefragt und die Antwort in den Cache
 * geschrieben ("stale-while-revalidate"), damit Aktualisierungen ankommen,
 * die App aber auch im Funkloch startet. Nutzerdaten liegen ohnehin nicht
 * hier, sondern im localStorage des Browsers.
 */

const CACHE = 'lehrerzeit-v2';

const HUELLE = [
  './',
  'index.html',
  'auswertung.html',
  'leitfaden.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/ui.js',
  'js/store.js',
  'js/model.js',
  'js/soll.js',
  'js/charts.js',
  'js/export.js',
  'js/erinnerung.js',
  'js/geraet.js',
  'js/kalender.js',
  'js/kollegium.js',
  'js/views/heute.js',
  'js/views/woche.js',
  'js/views/auswertung.js',
  'js/views/stundenplan.js',
  'js/views/einstellungen.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches
      .open(CACHE)
      // Einzeln hinzufuegen: eine fehlende Datei soll nicht die ganze
      // Installation scheitern lassen.
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
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;

  ereignis.respondWith(
    caches.match(anfrage).then((zwischengespeichert) => {
      const ausDemNetz = fetch(anfrage)
        .then((antwort) => {
          if (antwort && antwort.ok) {
            const kopie = antwort.clone();
            caches.open(CACHE).then((cache) => cache.put(anfrage, kopie));
          }
          return antwort;
        })
        .catch(() => zwischengespeichert);
      return zwischengespeichert || ausDemNetz;
    }),
  );
});
