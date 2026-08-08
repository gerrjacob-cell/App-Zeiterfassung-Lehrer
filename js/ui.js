/** Kleine DOM-Helfer, damit die Views ohne Framework lesbar bleiben. */

export function h(tag, attrs = {}, kinder = []) {
  const knoten = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') knoten.className = v;
    else if (k === 'html') knoten.innerHTML = v;
    else if (k === 'text') knoten.textContent = v;
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

let toastTimer = null;
export function toast(nachricht, dauer = 3200) {
  const alt = document.querySelector('.toast');
  if (alt) alt.remove();
  clearTimeout(toastTimer);
  const t = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite', text: nachricht });
  document.body.appendChild(t);
  toastTimer = setTimeout(() => t.remove(), dauer);
}

/** Ja/Nein-Dialog. @returns {Promise<boolean>} */
export function bestaetigen(titel, frage, jaText = 'Ja', gefahr = false) {
  return new Promise((aufloesen) => {
    const dialog = h('dialog', {}, [
      h('h2', { text: titel }),
      h('p', { text: frage }),
      h('div', { class: 'btn-reihe', style: 'justify-content:flex-end;margin-top:1rem' }, [
        h('button', {
          class: 'btn',
          text: 'Abbrechen',
          onclick: () => {
            dialog.close();
            aufloesen(false);
          },
        }),
        h('button', {
          class: `btn ${gefahr ? 'gefahr' : 'primaer'}`,
          text: jaText,
          onclick: () => {
            dialog.close();
            aufloesen(true);
          },
        }),
      ]),
    ]);
    dialog.addEventListener('close', () => dialog.remove());
    document.body.appendChild(dialog);
    dialog.showModal();
  });
}

/** Modaler Dialog mit eigenem Inhalt. */
export function dialogOeffnen(aufbau) {
  const dialog = h('dialog');
  dialog.addEventListener('close', () => dialog.remove());
  aufbau(dialog, () => dialog.close());
  document.body.appendChild(dialog);
  dialog.showModal();
  const ersteEingabe = dialog.querySelector('input, select, textarea, button');
  if (ersteEingabe) ersteEingabe.focus();
  return dialog;
}

export function ikone(pfad) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = pfad;
  return svg;
}
