/**
 * Geräte- und Speicherhärtung.
 *
 * Eine App, die ihre Daten ausschließlich lokal hält, steht und fällt damit,
 * dass der Browser sie behält. Zwei Dinge sind dafür zu tun:
 *
 *  1. Dauerhaften Speicher anfordern. Ohne diese Kennzeichnung darf jeder
 *     Browser den Speicher bei Platzmangel räumen.
 *  2. Auf iOS warnen. Safari löscht Daten von Websites, die sieben Tage lang
 *     nicht benutzt wurden - und sieben Tage ohne App-Nutzung sind in den
 *     Ferien schnell erreicht. Für zum Startbildschirm hinzugefügte Web-Apps
 *     gilt diese Löschung nicht. Diese Warnung darf deshalb nicht im
 *     Kleingedruckten verschwinden.
 */

const HINWEIS_GESEHEN = 'lehrerzeit.iosHinweisGesehen';

export async function speicherSichern() {
  if (!navigator.storage || !navigator.storage.persist) return null;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export function istIOS() {
  const ua = navigator.userAgent || '';
  // iPadOS meldet sich seit Version 13 als Macintosh - der Touch-Punkt
  // unterscheidet es von einem echten Mac.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function alsAppInstalliert() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/** true, wenn der iOS-Hinweis angezeigt werden sollte. */
export function iosHinweisNoetig() {
  if (!istIOS() || alsAppInstalliert()) return false;
  return localStorage.getItem(HINWEIS_GESEHEN) !== 'ja';
}

export function iosHinweisMerken() {
  try {
    localStorage.setItem(HINWEIS_GESEHEN, 'ja');
  } catch {
    /* Wenn nicht einmal das gespeichert werden kann, ist der Hinweis erst recht angebracht. */
  }
}

/**
 * Kurzbeschreibung des Speicherzustands für die Einstellungen - damit man
 * nachsehen kann, statt hoffen zu müssen.
 */
export async function speicherBericht() {
  const bericht = { dauerhaft: null, belegt: null, kontingent: null };
  if (navigator.storage) {
    try {
      if (navigator.storage.persisted) bericht.dauerhaft = await navigator.storage.persisted();
      if (navigator.storage.estimate) {
        const s = await navigator.storage.estimate();
        bericht.belegt = s.usage ?? null;
        bericht.kontingent = s.quota ?? null;
      }
    } catch {
      /* Nicht jeder Browser gibt darüber Auskunft. */
    }
  }
  return bericht;
}
