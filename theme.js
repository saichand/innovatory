/* Theme switch for innovatory.xyz.
 *
 * Three preferences — auto, light, dark — stored in localStorage. "auto" is
 * resolved here rather than in a media query so the CSS only ever has to know
 * about two concrete themes:
 *
 *   data-theme       light | dark   the theme actually in force
 *   data-theme-pref  auto | light | dark   what the reader asked for
 *
 * This file is loaded synchronously from <head>, before anything paints, so
 * the page does not flash the wrong theme. With JavaScript off there is no
 * switch and the site stays dark, which is what it did before this existed.
 */
(function () {
  'use strict';

  var KEY = 'innovatory-theme';
  var root = document.documentElement;
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  var BG = { light: '#faf8f4', dark: '#09090b' };

  var pref = 'auto';
  try {
    var stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') pref = stored;
  } catch (e) {
    /* Private browsing, or storage disabled. Auto is a fine default. */
  }

  function resolve() {
    return pref === 'auto' ? (mq.matches ? 'light' : 'dark') : pref;
  }

  function apply() {
    var theme = resolve();
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-theme-pref', pref);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', BG[theme]);

    var buttons = document.querySelectorAll('.theme-switch [data-mode]');
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-mode') === pref;
      buttons[i].setAttribute('aria-checked', on ? 'true' : 'false');
      buttons[i].tabIndex = on ? 0 : -1;
    }
  }

  function set(next) {
    pref = next;
    try { localStorage.setItem(KEY, next); } catch (e) {}
    apply();
  }

  apply();

  if (mq.addEventListener) mq.addEventListener('change', apply);
  else if (mq.addListener) mq.addListener(apply);

  var MODES = [
    {
      mode: 'auto',
      label: 'Match system',
      path: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" stroke="none"/>'
    },
    {
      mode: 'light',
      label: 'Light',
      path: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.2M12 19.4v2.2M4.4 12H2.2M21.8 12h-2.2M6.6 6.6 5 5M19 19l-1.6-1.6M17.4 6.6 19 5M5 19l1.6-1.6"/>'
    },
    {
      mode: 'dark',
      label: 'Dark',
      path: '<path d="M20 13.6A8.2 8.2 0 0 1 10.4 4a8.6 8.6 0 1 0 9.6 9.6z"/>'
    }
  ];

  function build(mount) {
    var group = document.createElement('div');
    group.className = 'theme-switch';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', 'Colour theme');

    MODES.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('data-mode', m.mode);
      b.setAttribute('aria-label', m.label);
      b.title = m.label;
      b.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + m.path + '</svg>';
      b.addEventListener('click', function () { set(m.mode); });
      group.appendChild(b);
    });

    /* Arrow keys move within the group, as a radio group should. */
    group.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
               : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      var order = MODES.map(function (m) { return m.mode; });
      var next = order[(order.indexOf(pref) + step + order.length) % order.length];
      set(next);
      var el = group.querySelector('[data-mode="' + next + '"]');
      if (el) el.focus();
    });

    mount.appendChild(group);
  }

  function mountAll() {
    var mounts = document.querySelectorAll('[data-theme-mount]');
    for (var i = 0; i < mounts.length; i++) build(mounts[i]);
    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }
})();
