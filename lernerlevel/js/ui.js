/**
 * Kleine DOM-Helfer. Kein Framework, kein Build-Schritt: die App besteht aus
 * statischen Dateien und läuft auf jedem Webspace - auch in fünf Jahren noch.
 */

export function h(tag, attrs = {}, kinder = []) {
  const knoten = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') knoten.className = v;
    else if (k === 'text') knoten.textContent = v;
    else if (k === 'html') knoten.innerHTML = v;
    else if (k === 'dataset') Object.assign(knoten.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') knoten.addEventListener(k.slice(2), v);
    else if (v === true) knoten.setAttribute(k, '');
    else knoten.setAttribute(k, String(v));
  }
  for (const kind of [].concat(kinder)) {
    if (kind === null || kind === undefined || kind === false) continue;
    knoten.appendChild(typeof kind === 'string' ? document.createTextNode(kind) : kind);
  }
  return knoten;
}

export function leeren(knoten) {
  while (knoten.firstChild) knoten.removeChild(knoten.firstChild);
  return knoten;
}

/* --------------------------------------------------------------- Toast --- */

let toastTimer = null;

/**
 * Kurze Rückmeldung am unteren Rand, optional mit einer Aktion
 * ("Rückgängig"). Ersetzt Bestätigungsdialoge bei unkritischen Aktionen:
 * schneller im Unterricht und trotzdem korrigierbar.
 */
export function toast(nachricht, aktion = null, dauer = 5000) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const box = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }, [
    h('span', { text: nachricht }),
    aktion &&
      h('button', {
        class: 'toast-aktion',
        text: aktion.text,
        onclick: () => {
          box.remove();
          aktion.fn();
        },
      }),
  ]);
  document.body.appendChild(box);
  toastTimer = setTimeout(() => box.remove(), dauer);
}

/* -------------------------------------------------------------- Dialog --- */

/**
 * Modaler Dialog. `bauen(schliessen)` liefert den Inhalt; `schliessen(wert)`
 * beendet den Dialog und löst das Promise mit dem Wert auf.
 */
export function dialog(titel, bauen, { breit = false } = {}) {
  return new Promise((aufloesen) => {
    let ergebnis = null;
    const d = h('dialog', { class: `dialog${breit ? ' breit' : ''}` });
    const schliessen = (wert = null) => {
      ergebnis = wert;
      d.close();
    };
    d.appendChild(
      h('div', { class: 'dialog-kopf' }, [
        h('h2', { text: titel }),
        h('button', {
          class: 'ikonen-knopf',
          'aria-label': 'Schließen',
          text: '✕',
          onclick: () => schliessen(null),
        }),
      ]),
    );
    d.appendChild(h('div', { class: 'dialog-inhalt' }, bauen(schliessen)));
    d.addEventListener('close', () => {
      d.remove();
      aufloesen(ergebnis);
    });
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      schliessen(null);
    });
    document.body.appendChild(d);
    d.showModal();
    d.querySelector('input, select, textarea, button:not(.ikonen-knopf)')?.focus();
  });
}

/** Rückfrage - nur für kritische Aktionen (Levelwechsel, Löschen, Abschluss). */
export function bestaetigen(titel, frage, jaText = 'Ja', gefahr = false) {
  return dialog(titel, (schliessen) => [
    h('p', { class: 'dialog-frage', text: frage }),
    h('div', { class: 'dialog-fuss' }, [
      h('button', { class: 'knopf', text: 'Abbrechen', onclick: () => schliessen(false) }),
      h('button', {
        class: `knopf ${gefahr ? 'gefahr' : 'primaer'}`,
        text: jaText,
        onclick: () => schliessen(true),
      }),
    ]),
  ]).then((wert) => wert === true);
}

/* ------------------------------------------------------------ Bausteine --- */

export function feld(beschriftung, eingabe, hinweis = null) {
  const id = eingabe.id || `f_${Math.random().toString(36).slice(2, 8)}`;
  eingabe.id = id;
  return h('label', { class: 'feld', for: id }, [
    h('span', { class: 'feld-beschriftung', text: beschriftung }),
    eingabe,
    hinweis && h('span', { class: 'feld-hinweis', text: hinweis }),
  ]);
}
