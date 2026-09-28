(() => {
  'use strict';

  // ================================================================
  // Helpers
  // ================================================================
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uniq = s => [...new Set(s)].join('');
  const SVGNS = 'http://www.w3.org/2000/svg';

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
    },
  };
  const K_PROGRESS = 'sporttyper.progress.v1';
  const K_CUSTOM = 'sporttyper.custom.v1';
  const K_MUTED = 'sporttyper.muted';
  const K_UNLOCK = 'sporttyper.unlockAll';
  const K_ROLE = 'sporttyper.role';
  const K_PACE = 'sporttyper.pace';
  const K_TOTALS = 'sporttyper.totals.v1';
  const K_LAST = 'sporttyper.lastLevel';
  const PACES = [2, 1.5, 1, 0.75];
  let role = store.get(K_ROLE, 'goalie') === 'player' ? 'player' : 'goalie';
  let pace = PACES.includes(store.get(K_PACE, 1.5)) ? store.get(K_PACE, 1.5) : 1.5;
  const NEW_TOTALS = () => ({ keys: 0, errors: 0, ms: 0, shots: 0 });
  let totals = { ...NEW_TOTALS(), ...(store.get(K_TOTALS, {}) || {}) };

  // ================================================================
  // Sound (tiny WebAudio synth, no files needed)
  // ================================================================
  const sound = (() => {
    let ctx = null;
    let noiseBuf = null;
    let muted = store.get(K_MUTED, false);

    function ac() {
      if (muted) return null;
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ctx = new C();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, dur, { type = 'sine', vol = 0.1, to = null, delay = 0 } = {}) {
      const c = ac(); if (!c) return;
      const t0 = c.currentTime + delay;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    }
    function noise(dur, { vol = 0.2, freq = 1000, q = 1, attack = 0.005, delay = 0 } = {}) {
      const c = ac(); if (!c) return;
      if (!noiseBuf) {
        noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const t0 = c.currentTime + delay;
      const s = c.createBufferSource();
      s.buffer = noiseBuf;
      const f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f).connect(g).connect(c.destination);
      s.start(t0);
      s.stop(t0 + dur + 0.05);
    }
    return {
      get muted() { return muted; },
      toggle() { muted = !muted; store.set(K_MUTED, muted); return muted; },
      key() { tone(1500, 0.025, { type: 'square', vol: 0.02 }); },
      miss() { tone(170, 0.14, { type: 'sawtooth', vol: 0.05, to: 110 }); },
      shot() { noise(0.09, { vol: 0.35, freq: 2600, q: 0.7 }); tone(320, 0.07, { type: 'triangle', vol: 0.08, to: 120 }); },
      save() {
        noise(0.12, { vol: 0.45, freq: 350, q: 0.8 });
        tone(140, 0.14, { vol: 0.25, to: 70 });
        noise(1.4, { vol: 0.08, freq: 1100, q: 0.4, attack: 0.25, delay: 0.05 }); // crowd
      },
      goal() {
        [0, 0.6].forEach(d => {
          tone(233, 0.5, { type: 'sawtooth', vol: 0.07, delay: d });
          tone(294, 0.5, { type: 'sawtooth', vol: 0.05, delay: d });
          tone(349, 0.5, { type: 'square', vol: 0.025, delay: d });
        });
      },
      win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', vol: 0.12, delay: i * 0.12 })); },
    };
  })();

  // ================================================================
  // Language
  // ================================================================
  const I18N = window.SPORTTYPER_I18N;
  const K_LANG = 'sporttyper.lang';
  const K_LAYOUT = 'sporttyper.layout';
  const browserDanish = /^(da|nb|nn|no)\b/i.test(navigator.language || '');
  let lang = store.get(K_LANG, browserDanish ? 'da' : 'en');
  if (!I18N[lang]) lang = 'en';

  function t(key, vars) {
    let s = I18N[lang][key] ?? I18N.en[key] ?? key;
    if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
    $$('[data-i18n-html]').forEach(e => { e.innerHTML = t(e.dataset.i18nHtml); });
    $$('[data-i18n-ph]').forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
    $$('[data-i18n-title]').forEach(e => { e.title = t(e.dataset.i18nTitle); });
    $$('[data-i18n-aria]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
    const kb = s => [...s].map(c => `<kbd>${esc(c.toUpperCase())}</kbd>`).join('');
    $('#step1Text').innerHTML = t('step1.text', { left: kb('asdf'), right: kb('jkl' + LAYOUT.pinky) });
  }

  // ================================================================
  // Keyboard layouts + ten-finger map
  // ================================================================
  const LAYOUTS = {
    us: {
      pinky: ';',
      fingers: [
        ['`1qaz', 'lp'], ['2wsx', 'lr'], ['3edc', 'lm'], ['45rtfgvb', 'li'],
        ['67yuhjnm', 'ri'], ['8ik,', 'rm'], ['9ol.', 'rr'], ["0-=p[]\\;'/", 'rp'],
      ],
      shifted: {
        '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
        '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
      },
      rows: [
        ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', { id: 'Backspace', label: '⌫', w: 2 }],
        [{ id: 'Tab', label: 'Tab', w: 1.5 }, 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', { id: '\\', label: '\\', w: 1.5, char: true }],
        [{ id: 'Caps', label: 'Caps', w: 1.75 }, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", { id: 'Enter', label: 'Enter', w: 2.25 }],
        [{ id: 'ShiftL', label: 'Shift', w: 2.25, finger: 'lp' }, 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', { id: 'ShiftR', label: 'Shift', w: 2.75, finger: 'rp' }],
      ],
    },
    dk: {
      pinky: 'æ',
      fingers: [
        ['½1qa<z', 'lp'], ['2wsx', 'lr'], ['3edc', 'lm'], ['45rtfgvb', 'li'],
        ['67yuhjnm', 'ri'], ['8ik,', 'rm'], ['9ol.', 'rr'], ["0+´påæø¨'-", 'rp'],
      ],
      shifted: {
        '§': '½', '!': '1', '"': '2', '#': '3', '¤': '4', '%': '5', '&': '6', '/': '7', '(': '8', ')': '9', '=': '0',
        '?': '+', '`': '´', '^': '¨', '*': "'", '>': '<', ';': ',', ':': '.', '_': '-',
      },
      rows: [
        ['½', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '´', { id: 'Backspace', label: '⌫', w: 2 }],
        [{ id: 'Tab', label: 'Tab', w: 1.5 }, 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'å', '¨', { id: 'Enter', label: '↵', w: 1.5 }],
        [{ id: 'Caps', label: 'Caps', w: 1.75 }, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'æ', 'ø', "'", { id: 'Enter2', label: '', w: 1.25 }],
        [{ id: 'ShiftL', label: 'Shift', w: 1.25, finger: 'lp' }, '<', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-', { id: 'ShiftR', label: 'Shift', w: 2.75, finger: 'rp' }],
      ],
    },
  };
  let layoutId = store.get(K_LAYOUT, lang === 'da' ? 'dk' : 'us');
  if (!LAYOUTS[layoutId]) layoutId = 'us';
  let LAYOUT, FINGER, SHIFTED, SHIFT_OF;

  function setLayout(id) {
    layoutId = LAYOUTS[id] ? id : 'us';
    LAYOUT = LAYOUTS[layoutId];
    FINGER = { ' ': 'th' };
    LAYOUT.fingers.forEach(([chars, f]) => { for (const c of chars) FINGER[c] = f; });
    SHIFTED = LAYOUT.shifted;
    SHIFT_OF = Object.fromEntries(Object.entries(SHIFTED).map(([s, b]) => [b, s]));
  }
  setLayout(layoutId);

  function keyInfo(ch) {
    let base = ch;
    let shift = false;
    if (SHIFTED[ch]) { base = SHIFTED[ch]; shift = true; }
    else if (ch !== ch.toLowerCase()) { base = ch.toLowerCase(); shift = true; }
    const finger = FINGER[base] || null;
    // Shift is held by the pinky of the opposite hand
    const shiftKey = shift ? (finger && finger[0] === 'l' ? 'ShiftR' : 'ShiftL') : null;
    return { base, finger, shiftKey };
  }

  // ================================================================
  // On-screen keyboard + hands
  // ================================================================
  const SPACE_ROW = [{ id: 'spacer1', label: '', w: 4, hidden: true }, { id: ' ', label: '', w: 6.25, finger: 'th', space: true }, { id: 'spacer2', label: '', w: 4.75, hidden: true }];
  let keyEls = {};

  function buildKeyboard() {
    const kb = $('#keyboard');
    kb.innerHTML = '';
    keyEls = {};
    for (const row of [...LAYOUT.rows, SPACE_ROW]) {
      const r = document.createElement('div');
      r.className = 'kb-row';
      for (const k of row) {
        const def = typeof k === 'string' ? { id: k, label: k.toUpperCase(), w: 1, char: true } : k;
        const el = document.createElement('div');
        const f = def.finger || FINGER[def.id] || 'none';
        el.className = `key f-${f}${def.char ? '' : ' special'}${def.id === 'f' || def.id === 'j' ? ' bump' : ''}`;
        el.style.flexGrow = def.w;
        if (def.hidden) el.style.visibility = 'hidden';
        const label = def.space ? t('key.space') : def.label;
        const sub = SHIFT_OF[def.id] ? `<small>${esc(SHIFT_OF[def.id])}</small>` : '';
        el.innerHTML = `${sub}<span>${esc(label)}</span>`;
        keyEls[def.id] = el;
        r.appendChild(el);
      }
      kb.appendChild(r);
    }
  }

  function buildHands() {
    const fingers = list => list.map(f => `<div class="finger f-${f}${f === 'th' ? ' thumb' : ''}" data-f="${f}"></div>`).join('');
    $('#handL').innerHTML = fingers(['lp', 'lr', 'lm', 'li', 'th']);
    $('#handR').innerHTML = fingers(['th', 'ri', 'rm', 'rr', 'rp']);
  }

  function showNextKey(ch) {
    $$('.key.next, .key.next-shift').forEach(e => e.classList.remove('next', 'next-shift'));
    $$('.finger.active').forEach(e => e.classList.remove('active'));
    const hint = $('#hint');
    if (ch == null) { hint.innerHTML = ''; return; }

    const info = keyInfo(ch);
    if (keyEls[info.base]) keyEls[info.base].classList.add('next');
    const active = [info.finger];
    if (info.shiftKey) {
      keyEls[info.shiftKey].classList.add('next-shift');
      active.push(info.shiftKey === 'ShiftL' ? 'lp' : 'rp');
    }
    active.forEach(f => f && $$(`.finger[data-f="${f}"]`).forEach(e => e.classList.add('active')));

    const label = ch === ' ' ? t('hint.space') : ch;
    if (!info.finger) { hint.innerHTML = `${esc(t('hint.next'))} <kbd>${esc(label)}</kbd>`; return; }
    const who = info.finger === 'th' ? t('hint.thumb') : t('finger.' + info.finger);
    const shiftTxt = info.shiftKey ? t('hint.shift', { side: t(info.shiftKey === 'ShiftL' ? 'side.left' : 'side.right') }) : '';
    hint.innerHTML = `<kbd class="f-${info.finger}">${esc(label)}</kbd> <b>${who}</b>${shiftTxt}`;
  }

  function flashKey(ch, ok) {
    const el = keyEls[keyInfo(ch).base];
    if (!el) return;
    el.classList.remove('hit', 'bad');
    void el.offsetWidth;
    el.classList.add(ok ? 'hit' : 'bad');
  }

  // ================================================================
  // Levels
  // ================================================================
  function newId() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function normalizeLevel(l, forceCustom = false) {
    if (!l || typeof l !== 'object') return null;
    const mode = ['keys', 'words', 'lines'].includes(l.mode) ? l.mode : 'words';
    const rawList = Array.isArray(l.list) ? l.list.map(String) : [];
    let list = [];
    if (mode === 'words') list = rawList.flatMap(s => s.split(/\s+/)).filter(Boolean).map(w => w.slice(0, 30));
    if (mode === 'lines') list = rawList.map(s => s.replace(/\s+/g, ' ').trim().slice(0, 80)).filter(Boolean);
    const lvl = {
      id: String(l.id || newId()),
      name: String(l.name || t('ed.untitled')).trim().slice(0, 40) || t('ed.untitled'),
      subtitle: l.subtitle ? String(l.subtitle).slice(0, 60) : '',
      tip: l.tip ? String(l.tip).slice(0, 300) : '',
      mode,
      keys: mode === 'keys' ? uniq(String(l.keys || '').replace(/\s/g, '')) : '',
      focus: mode === 'keys' ? uniq(String(l.focus || '').replace(/\s/g, '')) : '',
      list: list.slice(0, 500),
      groups: clamp(parseInt(l.groups, 10) || 1, 1, 5),
      minLen: clamp(parseInt(l.minLen, 10) || 2, 1, 8),
      maxLen: clamp(parseInt(l.maxLen, 10) || 4, 1, 8),
      shots: clamp(parseInt(l.shots, 10) || 10, 1, 50),
      wpm: clamp(parseInt(l.wpm, 10) || 12, 3, 150),
      custom: forceCustom || !!l.custom,
    };
    if (lvl.maxLen < lvl.minLen) lvl.maxLen = lvl.minLen;
    if (mode === 'keys' && !lvl.keys) return null;
    if (mode !== 'keys' && !lvl.list.length) return null;
    return lvl;
  }

  // Built-in levels, localised for the current language and keyboard layout
  let BUILTIN = [];
  function buildBuiltin() {
    const sub = (v, key) => (typeof v === 'string' ? v.split('{PINKY}').join(key) : v);
    BUILTIN = (window.SPORTTYPER_LEVELS || []).map(raw => {
      const l = { ...raw, ...(raw[lang] || {}) };
      for (const k of ['name', 'subtitle', 'tip']) l[k] = sub(l[k], LAYOUT.pinky.toUpperCase());
      for (const k of ['keys', 'focus']) l[k] = sub(l[k], LAYOUT.pinky);
      return normalizeLevel(l);
    }).filter(Boolean);
  }
  let custom = store.get(K_CUSTOM, []);
  custom = (Array.isArray(custom) ? custom : []).map(l => normalizeLevel(l, true)).filter(Boolean);
  let progress = store.get(K_PROGRESS, {}) || {};
  let unlockAll = !!store.get(K_UNLOCK, false);

  const saveCustom = () => store.set(K_CUSTOM, custom.map(({ custom: _c, ...rest }) => rest));

  function makeSequence(level, avoid) {
    const once = () => {
      if (level.mode === 'lines') return pick(level.list);
      const parts = [];
      for (let g = 0; g < level.groups; g++) {
        if (level.mode === 'words') { parts.push(pick(level.list)); continue; }
        const pool = [...level.keys, ...level.focus, ...level.focus];
        const len = randInt(level.minLen, level.maxLen);
        let w = '';
        for (let i = 0; i < len; i++) w += pick(pool);
        parts.push(w);
      }
      return parts.join(' ');
    };
    let s = once();
    for (let i = 0; i < 8 && s === avoid; i++) s = once();
    return s;
  }

  function preview(l) {
    if (l.mode === 'keys') return [...(l.focus || l.keys)].join(' ').toUpperCase();
    const s = l.list.slice(0, 4).join(l.mode === 'lines' ? ' / ' : ' ');
    return s.length > 34 ? s.slice(0, 33) + '…' : s;
  }
  function describe(l) {
    const what = t(`card.${l.mode}`, { n: l.mode === 'keys' ? l.keys.length : l.list.length });
    return `${what} · ${l.wpm} ${t('sb.wpm')}`;
  }
  const starsHtml = n => [1, 2, 3].map(i => `<span class="${i <= n ? '' : 'off'}">★</span>`).join('');

  function isUnlocked(i) {
    return unlockAll || i === 0 || (progress[BUILTIN[i - 1].id]?.stars || 0) > 0;
  }

  // ================================================================
  // Menu
  // ================================================================
  function renderMenu() {
    const grid = $('#levelGrid');
    grid.innerHTML = '';
    BUILTIN.forEach((lvl, i) => grid.appendChild(levelCard(lvl, String(i + 1), isUnlocked(i))));

    const cg = $('#customGrid');
    cg.innerHTML = '';
    custom.forEach(lvl => cg.appendChild(levelCard(lvl, '✎', true)));
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'level-card create';
    add.innerHTML = '<span class="plus">+</span><span>' + esc(t('menu.create')) + '</span>';
    add.onclick = () => openEditor();
    cg.appendChild(add);

    $('#unlockBtn').textContent = t(unlockAll ? 'menu.lock' : 'menu.unlock');
    renderSettings();
    renderProgress();
  }

  function renderSettings() {
    $$('#rolePick button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
    $('#paceSel').value = String(pace);
  }

  // The level to continue with: the first unlocked level without stars
  function continueLevel() {
    const i = BUILTIN.findIndex((l, n) => isUnlocked(n) && !(progress[l.id]?.stars));
    return i >= 0 ? { lvl: BUILTIN[i], n: i + 1 } : null;
  }

  function renderProgress() {
    const done = BUILTIN.filter(l => progress[l.id]?.stars);
    const stars = BUILTIN.reduce((sum, l) => sum + (progress[l.id]?.stars || 0), 0);
    const bestWpm = Object.values(progress).reduce((m, p) => Math.max(m, p.wpm || 0), 0);
    const typed = totals.keys + totals.errors;
    const acc = typed ? Math.round((totals.keys * 100) / typed) : 0;
    const mins = Math.round(totals.ms / 60000);
    const cell = (value, label) => `<div><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
    $('#progStats').innerHTML = [
      cell(`${stars}/${BUILTIN.length * 3}`, t('prog.stars')),
      cell(`${done.length}/${BUILTIN.length}`, t('prog.levels')),
      cell(bestWpm || '–', t('prog.bestWpm')),
      cell(typed ? `${acc}%` : '–', t('sb.acc')),
      cell(totals.keys.toLocaleString(lang === 'da' ? 'da-DK' : 'en-US'), t('prog.keys')),
      cell(mins < 1 && totals.ms ? '<1' : String(mins), t('prog.minutes')),
    ].join('');
    const next = continueLevel();
    const btn = $('#continueBtn');
    btn.hidden = !next;
    if (next) {
      btn.textContent = t(totals.shots ? 'prog.continue' : 'prog.start', { n: next.n, name: next.lvl.name });
      btn.onclick = () => startLevel(next.lvl);
    }
    $('#resetBtn').hidden = !totals.shots && !Object.keys(progress).length;
  }

  function levelCard(lvl, num, unlocked) {
    const rec = progress[lvl.id];
    const stars = rec?.stars || 0;
    const best = rec?.plays ? `<span class="best" title="${esc(t('card.best'))}">🏆 ${rec.wpm} ${esc(t('sb.wpm'))} · ${rec.acc}%</span>` : '';
    const card = document.createElement('div');
    card.className = `level-card${unlocked ? '' : ' locked'}${stars ? ' done' : ''}`;
    card.innerHTML = `
      <button class="card-main" type="button" ${unlocked ? '' : 'disabled'}>
        <span class="num">${esc(num)}</span>
        <span class="name">${esc(lvl.name)}</span>
        <span class="sub">${esc(lvl.subtitle || describe(lvl))}</span>
        <span class="keys">${esc(preview(lvl))}</span>
        <span class="stars">${starsHtml(stars)}</span>
        ${best}
      </button>
      ${unlocked ? '' : `<span class="lock" aria-label="${esc(t('card.locked'))}">🔒</span>`}
      ${lvl.custom ? `<div class="card-tools"><button type="button" data-act="edit" title="${esc(t('card.edit'))}">✎</button><button type="button" data-act="del" title="${esc(t('card.delete'))}">✕</button></div>` : ''}`;
    $('.card-main', card).onclick = () => unlocked && startLevel(lvl);
    if (lvl.custom) {
      $('[data-act="edit"]', card).onclick = () => openEditor(lvl);
      $('[data-act="del"]', card).onclick = () => {
        if (!confirm(t('card.confirmDelete', { name: lvl.name }))) return;
        custom = custom.filter(l => l.id !== lvl.id);
        delete progress[lvl.id];
        store.set(K_PROGRESS, progress);
        saveCustom();
        renderMenu();
      };
    }
    return card;
  }

  function showScreen(name) {
    $('#menu').hidden = name !== 'menu';
    $('#game').hidden = name !== 'game';
    window.scrollTo(0, 0);
  }

  // ================================================================
  // Scene
  // ================================================================
  const el = {
    goalie: $('#goalie'), upper: $('#gUpper'), padL: $('#gPadL'), padR: $('#gPadR'),
    blocker: $('#gBlocker'), glove: $('#gGlove'), glovePuck: $('#gGlovePuck'),
    armL: $('#gArmL'), armR: $('#gArmR'),
    puck: $('#puck'), flyLayer: $('#flyLayer'), netLayer: $('#netPuckLayer'),
    net: $('#net'), lamp: $('#lamp'), aim: $('#aim'), crowd: $('#crowd'), shooter: $('#shooter'),
    seq: $('#sequence'), banner: $('#banner'), overlay: $('#overlay'), card: $('#overlayCard'),
    timer: $('#timerFill'),
  };

  function buildCrowd() {
    const colors = ['#f87171', '#60a5fa', '#fbbf24', '#e5e7eb', '#34d399', '#a78bfa', '#fb923c'];
    let html = '';
    for (let row = 0; row < 5; row++) {
      const y = 22 + row * 20;
      for (let x = (row % 2) * 9; x < 810; x += 18) {
        const c = colors[(x * 7 + row * 13) % colors.length];
        const r = 6 + ((x + row) % 3);
        html += `<circle cx="${x + ((x * 13) % 5)}" cy="${y + ((x * 3) % 5)}" r="${r}" fill="${c}" opacity="${0.25 + ((x * row) % 4) * 0.08}"/>`;
      }
    }
    el.crowd.innerHTML = html;
  }

  const PUCK_START = { x: 396, y: 400 };

  function setPuck(x, y, s, opacity = 1) {
    el.puck.style.display = '';
    el.puck.style.opacity = opacity;
    el.puck.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
  }
  function puckPos(t) {
    const T = G.target;
    return {
      x: lerp(PUCK_START.x, T.x, t),
      y: lerp(PUCK_START.y, T.y, t) - Math.sin(Math.PI * t) * (T.high ? 60 : 18),
      s: lerp(2.2, 0.75, t),
    };
  }
  function setPuckT(t) { const p = puckPos(t); setPuck(p.x, p.y, p.s); }

  // Goalie pose, tweened every frame toward a target pose
  const BASE_POSE = { dx: 0, drop: 0, bx: 331, by: 236, gx: 475, gy: 224 };
  const gCur = { ...BASE_POSE };
  let gTar = { ...BASE_POSE };
  let gSpeed = 8;

  function savePose(T) {
    const p = { ...BASE_POSE };
    if (T.high && T.side > 0) {        // glove save
      p.dx = clamp((T.x - BASE_POSE.gx) * 0.5, -70, 70);
      p.gx = T.x - p.dx; p.gy = T.y;
    } else if (T.high) {               // blocker save
      p.dx = clamp((T.x - BASE_POSE.bx) * 0.5, -70, 70);
      p.bx = T.x - p.dx; p.by = T.y;
    } else {                           // butterfly pad save
      p.drop = 1;
      p.dx = clamp((T.x - 400) * 0.55, -70, 70);
    }
    return p;
  }
  function setGoalieTarget(progress, speed, target = G.target) {
    const full = target ? savePose(target) : BASE_POSE;
    gTar = {};
    for (const k in BASE_POSE) gTar[k] = lerp(BASE_POSE[k], full[k], progress);
    gSpeed = speed;
  }
  function renderGoalie(now, dt) {
    const f = 1 - Math.exp(-gSpeed * dt);
    for (const k in gCur) gCur[k] += (gTar[k] - gCur[k]) * f;
    const c = gCur;
    const d = c.drop;
    const sway = G.state === 'ready' || G.state === 'shooting' ? Math.sin(now / 260) * 1.5 : 0;
    el.goalie.setAttribute('transform', `translate(${(c.dx + sway).toFixed(2)} 0)`);
    el.upper.setAttribute('transform', `translate(0 ${(d * 28).toFixed(2)})`);
    el.padL.setAttribute('transform', `translate(${(-14 * d).toFixed(2)} ${(18 * d).toFixed(2)}) rotate(${(80 * d).toFixed(2)} 366 299)`);
    el.padR.setAttribute('transform', `translate(${(14 * d).toFixed(2)} ${(18 * d).toFixed(2)}) rotate(${(-80 * d).toFixed(2)} 434 299)`);
    const bx = c.bx, by = c.by + d * 8, gx = c.gx, gy = c.gy + d * 26;
    el.blocker.setAttribute('transform', `translate(${(bx - BASE_POSE.bx).toFixed(2)} ${(by - BASE_POSE.by).toFixed(2)})`);
    el.glove.setAttribute('transform', `translate(${(gx - BASE_POSE.gx).toFixed(2)} ${(gy - BASE_POSE.gy).toFixed(2)})`);
    const shoulderY = 192 + d * 28;
    el.armL.setAttribute('y1', shoulderY); el.armL.setAttribute('x2', bx + 9); el.armL.setAttribute('y2', by - 4);
    el.armR.setAttribute('y1', shoulderY); el.armR.setAttribute('x2', gx - 8); el.armR.setAttribute('y2', gy + 4);
  }

  function resetScene() {
    el.flyLayer.appendChild(el.puck);
    setPuck(PUCK_START.x, PUCK_START.y, 2.2);
    el.glovePuck.style.display = 'none';
    el.lamp.classList.remove('on');
    el.net.classList.remove('shake');
    el.shooter.classList.remove('swing', 'windup');
    el.aim.style.display = 'none';
    setGoalieTarget(0, 7);
    setTimer(1);
    G.anim = null;
  }

  function setTimer(frac) {
    el.timer.style.transform = `scaleX(${clamp(frac, 0, 1)})`;
    el.timer.classList.toggle('warn', frac < 0.5 && frac >= 0.25);
    el.timer.classList.toggle('danger', frac < 0.25);
  }

  function setBanner(text, kind, subHtml = '') {
    el.banner.className = `banner ${kind}`;
    el.banner.innerHTML = `<div class="big">${esc(text)}</div>${subHtml ? `<div class="sub">${subHtml}</div>` : ''}`;
    el.banner.hidden = false;
    // restart pop animation
    el.banner.style.animation = 'none'; void el.banner.offsetWidth; el.banner.style.animation = '';
  }
  const hideBanner = () => { el.banner.hidden = true; };

  function showOverlay(html, primary) {
    el.card.innerHTML = html;
    el.overlay.hidden = false;
    G.overlayPrimary = primary;
    const p = $('[data-primary]', el.card);
    if (p) p.onclick = primary;
  }
  function hideOverlay() {
    el.overlay.hidden = true;
    G.overlayPrimary = null;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }

  // ================================================================
  // Game
  // ================================================================
  // As the goalie you type to stop the shot; as a player you type to shoot
  // before the goalie gets across. "wins" are saves or goals respectively.
  const G = {
    level: null,
    role: 'goalie',
    state: 'idle', // idle | intro | ready | shooting | resolving | lost | done | paused
    seq: '', pos: 0,
    wins: 0, losses: 0, correct: 0, errors: 0, typingMs: 0,
    shotCorrect: 0, shotErrors: 0,
    fireAt: 0, duration: 0, target: null,
    anim: null, timers: [], overlayPrimary: null,
  };
  const isPlayer = () => G.role === 'player';
  const msPerKey = l => (60000 / (l.wpm * 5)) * pace;

  function later(fn, ms) { G.timers.push(setTimeout(fn, ms)); }
  function clearTimers() { G.timers.forEach(clearTimeout); G.timers = []; }

  function animate(dur, step, done) { G.anim = { start: performance.now(), dur, step, done }; }

  function startLevel(lvl) {
    clearTimers();
    Object.assign(G, { level: lvl, role, seq: '', pos: 0, wins: 0, losses: 0, correct: 0, errors: 0, typingMs: 0, target: null });
    store.set(K_LAST, lvl.id);
    showScreen('game');
    $('#levelTitle').textContent = lvl.name;
    resetScene();
    hideBanner();
    el.seq.innerHTML = '';
    showNextKey(null);
    updateScoreboard();
    showIntro();
  }

  function showIntro() {
    const l = G.level;
    G.state = 'intro';
    const num = BUILTIN.indexOf(l);
    const keysHtml = l.mode === 'keys'
      ? `<div class="intro-keys">${[...l.keys].map(k => `<kbd class="f-${FINGER[keyInfo(k).base] || 'none'}">${esc(k.toUpperCase())}</kbd>`).join('')}</div>`
      : `<div class="intro-sample">${esc(preview(l))}</div>`;
    const sec = (msPerKey(l) / 1000).toFixed(1);
    showOverlay(`
      <div class="eyebrow">${esc(num >= 0 ? t('intro.level', { n: num + 1 }) : t('intro.custom'))} · ${esc(t(isPlayer() ? 'role.player' : 'role.goalie'))}</div>
      <h2>${esc(l.name)}</h2>
      ${keysHtml}
      ${l.tip ? `<p class="tip">${esc(l.tip)}</p>` : ''}
      <p class="meta">${t(isPlayer() ? 'intro.metaPlayer' : 'intro.meta', { shots: l.shots, sec })}</p>
      <div class="actions"><button class="btn primary" type="button" data-primary>${esc(t('intro.go'))} <kbd>Enter</kbd></button></div>`,
      () => { hideOverlay(); nextShot(); });
  }

  function pickTarget() {
    const high = Math.random() < 0.5;
    const side = Math.random() < 0.5 ? -1 : 1;
    return { x: 400 + side * rand(42, 112), y: high ? rand(208, 250) : rand(284, 318), high, side };
  }

  function nextShot(retry = false) {
    clearTimers();
    if (!retry || !G.seq) G.seq = makeSequence(G.level, G.seq);
    G.pos = 0;
    G.shotCorrect = 0;
    G.shotErrors = 0;
    G.target = pickTarget();
    // time to type every key at the chosen pace, plus a moment to react
    G.duration = 2000 + G.seq.length * msPerKey(G.level);
    resetScene();
    renderSequence();
    showNextKey(G.seq[0]);
    G.state = 'ready';
    if (isPlayer()) {
      el.aim.style.display = '';
      el.aim.setAttribute('transform', `translate(${G.target.x.toFixed(1)} ${G.target.y.toFixed(1)})`);
    }
    setBanner(t(retry ? 'ready.retry' : isPlayer() ? 'ready.player' : 'ready'), 'ready');
    el.shooter.classList.add('windup');
    later(fire, 1200);
  }

  // Starts the clock. The goalie's puck leaves the stick now; the player's
  // shot waits on the stick until the sequence is typed.
  function fire() {
    if (G.state !== 'ready') return;
    clearTimers();
    G.state = 'shooting';
    G.fireAt = performance.now();
    hideBanner();
    if (!isPlayer()) {
      el.shooter.classList.remove('windup');
      el.shooter.classList.add('swing');
      sound.shot();
    }
  }

  function renderSequence() {
    el.seq.innerHTML = [...G.seq].map((c, i) => {
      const cls = ['ch'];
      if (i < G.pos) cls.push('done'); else if (i === G.pos) cls.push('cur');
      if (c === ' ') cls.push('sp');
      return `<span class="${cls.join(' ')}">${c === ' ' ? '·' : esc(c)}</span>`;
    }).join('');
    const w = el.seq.parentElement.clientWidth * 0.92;
    const h = el.seq.parentElement.clientHeight * 0.62;
    el.seq.style.fontSize = `${Math.max(12, Math.min(h, w / (G.seq.length * 0.7)))}px`;
  }

  function handleChar(ch) {
    if (ch === G.seq[G.pos]) {
      G.pos++;
      G.correct++;
      G.shotCorrect++;
      sound.key();
      flashKey(ch, true);
      renderSequence();
      if (G.pos >= G.seq.length) onComplete();
      else {
        showNextKey(G.seq[G.pos]);
        if (!isPlayer()) setGoalieTarget((G.pos / G.seq.length) * 0.6, 6);
      }
    } else {
      G.errors++;
      G.shotErrors++;
      sound.miss();
      flashKey(ch, false);
      const cur = el.seq.children[G.pos];
      if (cur) { cur.classList.remove('err'); void cur.offsetWidth; cur.classList.add('err'); }
    }
    updateScoreboard();
  }

  function shoot(from, dur, behindGoalie, done) {
    el.aim.style.display = 'none';
    if (from === 0) {
      el.shooter.classList.remove('windup');
      el.shooter.classList.add('swing');
      sound.shot();
    }
    if (behindGoalie) el.netLayer.appendChild(el.puck);
    animate(dur, k => setPuckT(lerp(from, 1, k * k)), done);
  }

  function onComplete() {
    const now = performance.now();
    G.state = 'resolving';
    G.typingMs += now - G.fireAt;
    recordShot(now - G.fireAt);
    showNextKey(null);
    if (isPlayer()) {
      // beat the goalie: they bite the wrong way and the shot goes in
      const T = G.target;
      setGoalieTarget(0.8, 14, { ...T, x: 800 - T.x, side: -T.side });
      shoot(0, 300, true, () => { goalVisual(); win(); });
    } else {
      setGoalieTarget(1, 24);
      shoot(clamp((now - G.fireAt) / G.duration, 0, 1), 200, false, () => win(saveVisual()));
    }
  }

  function onTimeout() {
    G.state = 'resolving';
    G.typingMs += G.duration;
    recordShot(G.duration);
    showNextKey(null);
    if (isPlayer()) {
      setGoalieTarget(1, 24);
      shoot(0, 320, false, () => { saveVisual(); lose(); });
    } else {
      setPuckT(1);
      setGoalieTarget(0.6, 12); // too late!
      goalVisual();
      lose();
    }
  }

  function saveVisual() {
    const T = G.target;
    const type = T.high ? (T.side > 0 ? 'glove' : 'blocker') : 'pad';
    sound.save();
    if (type === 'glove') {
      el.puck.style.display = 'none';
      el.glovePuck.style.display = '';
    } else if (type === 'blocker') {
      animate(650, k => setPuck(T.x - 330 * k, T.y - 150 * k + 120 * k * k, lerp(0.75, 1.2, k), 1 - k));
    } else {
      animate(650, k => setPuck(T.x + T.side * 280 * k, T.y + 80 * k - Math.sin(Math.PI * k) * 50, lerp(0.75, 1.4, k), 1 - k));
    }
    return type;
  }

  function goalVisual() {
    const T = G.target;
    el.netLayer.appendChild(el.puck);
    const bx = 400 + (T.x - 400) * 0.83;
    const by = 216 + (T.y - 200) * 0.77;
    animate(260, k => setPuck(lerp(T.x, bx, k), lerp(T.y, by, k), lerp(0.75, 0.6, k)));
    el.net.classList.remove('shake'); void el.net.getBoundingClientRect(); el.net.classList.add('shake');
    el.lamp.classList.add('on');
    sound.goal();
  }

  function win(saveType) {
    G.wins++;
    updateScoreboard();
    setBanner(pick(t(isPlayer() ? 'player.win' : 'save.' + saveType)), 'save');
    el.crowd.classList.remove('cheer'); void el.crowd.getBoundingClientRect(); el.crowd.classList.add('cheer');
    later(() => {
      hideBanner();
      if (G.wins >= G.level.shots) levelComplete(); else nextShot();
    }, 1300);
  }

  function lose() {
    G.state = 'lost';
    G.losses++;
    updateScoreboard();
    const title = t(isPlayer() ? 'player.lost' : 'goal');
    const text = t(isPlayer() ? 'player.lostText' : 'goal.text');
    setBanner(title, 'goal',
      `<span>${esc(text)}</span><button class="btn primary small" type="button" id="retryBtn">${esc(t('goal.retry'))}</button><span class="muted">${esc(t('goal.orEnter'))}</span>`);
    $('#retryBtn').onclick = retry;
  }

  function retry() {
    if (G.state !== 'lost') return;
    hideBanner();
    nextShot(true);
  }

  // Lifetime totals, saved after every shot so an unfinished level still counts
  function recordShot(ms) {
    totals.keys += G.shotCorrect;
    totals.errors += G.shotErrors;
    totals.ms += ms;
    totals.shots += 1;
    store.set(K_TOTALS, totals);
  }

  function stats() {
    const total = G.correct + G.errors;
    let ms = G.typingMs;
    if (G.state === 'shooting') ms += performance.now() - G.fireAt;
    return {
      acc: total ? Math.round((G.correct * 100) / total) : 100,
      wpm: ms > 500 ? Math.round((G.correct / 5) / (ms / 60000)) : 0,
    };
  }

  const winLabel = () => t(isPlayer() ? 'sb.goals' : 'sb.saves');
  const lossLabel = () => t(isPlayer() ? 'sb.saved' : 'sb.goals');

  function updateScoreboard() {
    const s = stats();
    $('#sbWinLabel').textContent = winLabel();
    $('#sbLossLabel').textContent = lossLabel();
    $('#sbWins').textContent = `${G.wins}/${G.level ? G.level.shots : 0}`;
    $('#sbLosses').textContent = G.losses;
    $('#sbAcc').textContent = `${s.acc}%`;
    $('#sbWpm').textContent = s.wpm;
  }

  function levelComplete() {
    G.state = 'done';
    const l = G.level;
    const { acc, wpm } = stats();
    let stars = 1;
    if (G.losses === 0 && acc >= 95) stars = 3;
    else if (G.losses <= Math.max(1, Math.floor(l.shots * 0.25)) && acc >= 85) stars = 2;

    const prev = progress[l.id] || {};
    const newBest = stars > (prev.stars || 0) || wpm > (prev.wpm || 0);
    progress[l.id] = {
      stars: Math.max(prev.stars || 0, stars),
      wpm: Math.max(prev.wpm || 0, wpm),
      acc: Math.max(prev.acc || 0, acc),
      plays: (prev.plays || 0) + 1,
      [G.role]: Math.max(prev[G.role] || 0, stars), // best stars per position
      last: Date.now(),
    };
    store.set(K_PROGRESS, progress);
    sound.win();

    const idx = BUILTIN.indexOf(l);
    const next = idx >= 0 ? BUILTIN[idx + 1] : null;
    const msg = t((isPlayer() ? 'doneP.' : 'done.') + stars);

    showOverlay(`
      <div class="eyebrow">${esc(t('done.title'))}</div>
      <h2>${esc(l.name)}</h2>
      <div class="big-stars">${starsHtml(stars)}</div>
      ${newBest && prev.plays ? `<p class="new-best">${esc(t('done.best'))}</p>` : ''}
      <div class="stats">
        <div><b>${G.wins}</b><span>${esc(winLabel())}</span></div>
        <div><b>${G.losses}</b><span>${esc(lossLabel())}</span></div>
        <div><b>${acc}%</b><span>${esc(t('sb.acc'))}</span></div>
        <div><b>${wpm}</b><span>${esc(t('sb.wpm'))}</span></div>
      </div>
      <p class="meta">${msg}</p>
      <div class="actions">
        <button class="btn ghost" type="button" data-act="levels">${esc(t('done.levels'))}</button>
        <button class="btn${next ? '' : ' primary'}" type="button" data-act="replay" ${next ? '' : 'data-primary'}>${esc(t('done.replay'))} <kbd>R</kbd></button>
        ${next ? `<button class="btn primary" type="button" data-primary>${esc(t('done.next'))} <kbd>Enter</kbd></button>` : ''}
      </div>`,
      next ? () => startLevel(next) : () => startLevel(l));
    $('[data-act="levels"]', el.card).onclick = backToMenu;
    if (next) $('[data-act="replay"]', el.card).onclick = () => startLevel(l);
  }

  function pause() {
    clearTimers();
    G.state = 'paused';
    showOverlay(`
      <div class="eyebrow">${esc(t('pause.eyebrow'))}</div>
      <h2>${esc(t('pause.title'))}</h2>
      <p class="tip">${esc(t('pause.text'))}</p>
      <div class="actions"><button class="btn primary" type="button" data-primary>${esc(t('pause.resume'))} <kbd>Enter</kbd></button></div>`,
      () => { hideOverlay(); nextShot(true); });
  }

  function backToMenu() {
    clearTimers();
    G.state = 'idle';
    G.anim = null;
    hideOverlay();
    hideBanner();
    showNextKey(null);
    renderMenu();
    showScreen('menu');
  }

  // ----- main loop -----
  let lastFrame = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (G.state === 'shooting') {
      // rAF timestamps can be a little older than fireAt, so never go below 0
      const p = Math.max(0, (now - G.fireAt) / G.duration);
      if (p >= 1) { setTimer(0); onTimeout(); }
      else {
        setTimer(1 - p);
        if (isPlayer()) setGoalieTarget(Math.pow(p, 1.4), 5); // goalie slides across
        else setPuckT(p);
      }
    }
    if (G.anim) {
      const a = G.anim;
      const k = clamp((now - a.start) / a.dur, 0, 1);
      a.step(k);
      if (k >= 1) { G.anim = null; if (a.done) a.done(); }
    }
    if (G.state !== 'idle') renderGoalie(now, dt);
    requestAnimationFrame(frame);
  }

  // ----- input -----
  document.addEventListener('keydown', e => {
    if ($('#editor').open || $('#game').hidden) return;
    if (e.getModifierState) $('#capsWarn').hidden = !e.getModifierState('CapsLock');

    if (e.key === 'Escape') { e.preventDefault(); backToMenu(); return; }

    if (!el.overlay.hidden) {
      if ((e.key === 'Enter' || e.key === ' ') && G.overlayPrimary) { e.preventDefault(); G.overlayPrimary(); }
      else if (G.state === 'done' && e.key.toLowerCase() === 'r') { e.preventDefault(); startLevel(G.level); }
      return;
    }
    if (G.state === 'lost') {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); retry(); }
      return;
    }
    if (G.state !== 'ready' && G.state !== 'shooting') return;
    if (e.key.length !== 1) return;
    const altGr = e.getModifierState && e.getModifierState('AltGraph');
    if ((e.ctrlKey || e.metaKey) && !altGr) return;
    e.preventDefault();
    if (e.repeat) return;
    if (G.state === 'ready') fire();
    handleChar(e.key);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (G.state === 'ready' || G.state === 'shooting')) pause();
  });
  window.addEventListener('resize', () => { if (G.seq && !$('#game').hidden) renderSequence(); });

  // ================================================================
  // Level editor
  // ================================================================
  const editor = $('#editor');
  const form = $('#editorForm');
  let editing = null;

  function formMode() { return form.elements.mode.value; }

  function readEditor() {
    const f = form.elements;
    const mode = formMode();
    return {
      id: editing ? editing.id : newId(),
      name: f.name.value,
      tip: f.tip.value.trim(),
      mode,
      keys: f.keys.value.toLowerCase(),
      list: mode === 'words' ? f.words.value.split(/\s+/) : mode === 'lines' ? f.lines.value.split(/\n/) : [],
      groups: f.groups.value,
      shots: f.shots.value,
      wpm: f.wpm.value,
      custom: true,
    };
  }

  function syncEditor() {
    const mode = formMode();
    $$('[data-for]', form).forEach(elm => { elm.hidden = !elm.dataset.for.split(' ').includes(mode); });
    $('#groupsLabel').textContent = t(mode === 'words' ? 'ed.wordsPerShot' : 'ed.groups');
    const lvl = normalizeLevel(readEditor());
    $('#editorPreview').textContent = lvl ? makeSequence(lvl) : '—';
  }

  function openEditor(lvl = null) {
    editing = lvl;
    form.reset();
    const f = form.elements;
    $('#editorTitle').textContent = t(lvl ? 'ed.edit' : 'ed.create');
    if (lvl) {
      f.name.value = lvl.name;
      f.mode.value = lvl.mode;
      f.keys.value = lvl.keys;
      f.words.value = lvl.mode === 'words' ? lvl.list.join(' ') : '';
      f.lines.value = lvl.mode === 'lines' ? lvl.list.join('\n') : '';
      f.groups.value = lvl.groups;
      f.shots.value = lvl.shots;
      f.wpm.value = lvl.wpm;
      f.tip.value = lvl.tip;
    }
    $('#editorError').textContent = '';
    syncEditor();
    editor.showModal();
    f.name.focus();
  }

  function saveEditor(play) {
    const raw = readEditor();
    const err = $('#editorError');
    if (!raw.name.trim()) { err.textContent = t('ed.errName'); form.elements.name.focus(); return; }
    const lvl = normalizeLevel(raw, true);
    if (!lvl) {
      err.textContent = t(raw.mode === 'keys' ? 'ed.errKeys' : raw.mode === 'words' ? 'ed.errWords' : 'ed.errLines');
      return;
    }
    const i = custom.findIndex(l => l.id === lvl.id);
    if (i >= 0) custom[i] = lvl; else custom.push(lvl);
    saveCustom();
    editor.close();
    renderMenu();
    if (play) startLevel(lvl);
  }

  form.addEventListener('input', syncEditor);
  form.addEventListener('submit', e => { e.preventDefault(); saveEditor(true); });
  $('#editorSave').onclick = () => saveEditor(false);
  $('#editorCancel').onclick = () => editor.close();

  // ----- import / export -----
  $('#exportBtn').onclick = () => {
    if (!custom.length) { alert(t('io.none')); return; }
    const data = JSON.stringify({ app: 'SportTyper', version: 1, levels: custom.map(({ custom: _c, ...rest }) => rest) }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = 'sporttyper-levels.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#importBtn').onclick = () => $('#importFile').click();
  $('#importFile').onchange = async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const incoming = (Array.isArray(json) ? json : json.levels || []).map(l => normalizeLevel(l, true)).filter(Boolean);
      if (!incoming.length) throw new Error('no levels');
      for (const lvl of incoming) {
        if (custom.some(l => l.id === lvl.id) || BUILTIN.some(l => l.id === lvl.id)) lvl.id = newId();
        custom.push(lvl);
      }
      saveCustom();
      renderMenu();
      alert(t('io.imported', { n: incoming.length }));
    } catch {
      alert(t('io.bad'));
    }
  };

  // ================================================================
  // Boot
  // ================================================================
  const updateMuteBtn = () => { $('#muteBtn').textContent = sound.muted ? '🔇' : '🔊'; };
  $('#muteBtn').onclick = () => { sound.toggle(); updateMuteBtn(); $('#muteBtn').blur(); };
  $('#backBtn').onclick = backToMenu;
  $('#brandLink').onclick = e => { e.preventDefault(); backToMenu(); };
  $('#unlockBtn').onclick = () => { unlockAll = !unlockAll; store.set(K_UNLOCK, unlockAll); renderMenu(); };
  $$('#rolePick button').forEach(b => {
    b.onclick = () => { role = b.dataset.role; store.set(K_ROLE, role); renderSettings(); };
  });
  $('#paceSel').onchange = e => { pace = Number(e.target.value); store.set(K_PACE, pace); e.target.blur(); };
  $('#resetBtn').onclick = () => {
    if (!confirm(t('prog.confirmReset'))) return;
    progress = {};
    totals = NEW_TOTALS();
    store.set(K_PROGRESS, progress);
    store.set(K_TOTALS, totals);
    renderMenu();
  };

  // Changing language or keyboard mid-level returns to the menu, since the level content changes
  function refreshLocale() {
    buildBuiltin();
    applyI18n();
    buildKeyboard();
    if (!$('#game').hidden) backToMenu(); else renderMenu();
  }
  const langSel = $('#langSel');
  const layoutSel = $('#layoutSel');
  langSel.value = lang;
  layoutSel.value = layoutId;
  langSel.onchange = () => {
    lang = langSel.value;
    store.set(K_LANG, lang);
    // most Danish speakers type on a Danish keyboard (and vice versa); still changeable
    setLayout(lang === 'da' ? 'dk' : 'us');
    layoutSel.value = layoutId;
    store.set(K_LAYOUT, layoutId);
    refreshLocale();
    langSel.blur();
  };
  layoutSel.onchange = () => {
    setLayout(layoutSel.value);
    store.set(K_LAYOUT, layoutId);
    refreshLocale();
    layoutSel.blur();
  };

  buildBuiltin();
  applyI18n();
  buildKeyboard();
  buildHands();
  buildCrowd();
  updateMuteBtn();
  renderMenu();
  resetScene();
  renderGoalie(0, 1);
  requestAnimationFrame(frame);
})();
