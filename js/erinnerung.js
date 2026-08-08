/**
 * Lokale Abenderinnerung. Ohne Server gibt es keine echten Push-Mitteilungen -
 * dieser Wecker läuft nur, solange die App geöffnet ist (auch im Hintergrund,
 * wenn sie vom Startbildschirm gestartet wurde). Das ist der Preis dafür, dass
 * keine Daten das Gerät verlassen; die Einstellungen sagen das auch so.
 */

import * as store from './store.js';
import { iso } from './kalender.js';

const SCHLUESSEL = 'lehrerzeit.letzteErinnerung';
let intervall = null;

export function erinnerungEinrichten() {
  clearInterval(intervall);
  const einst = store.get().einstellungen;
  if (!einst.erinnerungAktiv) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  intervall = setInterval(pruefen, 60000);
  pruefen();
}

function pruefen() {
  const einst = store.get().einstellungen;
  if (!einst.erinnerungAktiv) return;

  const jetzt = new Date();
  const heute = iso(jetzt);
  if (localStorage.getItem(SCHLUESSEL) === heute) return;

  const [stunde, minute] = String(einst.erinnerungUhrzeit || '18:30').split(':').map(Number);
  const faellig = jetzt.getHours() > stunde || (jetzt.getHours() === stunde && jetzt.getMinutes() >= minute);
  if (!faellig) return;

  // An Wochenenden, Feiertagen und Urlaubstagen nicht stören.
  const eintraege = store.eintraegeFuerTag(heute);
  const tag = jetzt.getDay();
  if (tag === 0 || tag === 6) {
    localStorage.setItem(SCHLUESSEL, heute);
    return;
  }

  localStorage.setItem(SCHLUESSEL, heute);
  const summe = eintraege.reduce((s, e) => s + (Number(e.minuten) || 0), 0);
  try {
    new Notification('Arbeitszeit von heute', {
      body:
        summe > 0
          ? `Bisher ${Math.round((summe / 60) * 10) / 10} Stunden erfasst. Fehlt noch etwas?`
          : 'Heute ist noch nichts erfasst. Ein bis zwei Minuten genügen.',
      tag: 'lehrerzeit-tagesende',
    });
  } catch {
    // Mitteilungen sind je nach Browser und Plattform nicht immer möglich.
  }
}
