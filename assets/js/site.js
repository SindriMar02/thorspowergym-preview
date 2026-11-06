/* Thor's Power Gym v3 (Elevate fitness build): language, phone menu, carousel, card stack, plan filter, FAQ, form, motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var motion = hasGsap && !reduce.matches;
  window.__tpgMotion = motion;
  if (!motion) root.classList.remove('js-motion');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- language ---------- */
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  function applyLang(l) {
    root.lang = l;
    var t = root.getAttribute('data-title-' + l); if (t) document.title = t;
    $$('[data-aria-' + l + ']').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute('data-aria-' + l)); });
    $$('[data-alt-' + l + ']').forEach(function (el) { el.setAttribute('alt', el.getAttribute('data-alt-' + l)); });
    $$('[data-ph-' + l + ']').forEach(function (el) { el.setAttribute('placeholder', el.getAttribute('data-ph-' + l)); });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setLang === l)); });
    if (hasGsap) ScrollTrigger.refresh();
  }
  var saved = store.get('tpg-lang');
  applyLang(saved === 'en' ? 'en' : 'is');
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { store.set('tpg-lang', b.dataset.setLang); applyLang(b.dataset.setLang); }); });

  /* ---------- header island: equal sides keep the wordmark centred; sides fold away on scroll down, return on scroll up / hover / focus ---------- */
  var island = $('[data-island]');
  if (island) {
    var ins = $$('.island__side .island__in', island);
    var sizeSides = function () { var w = Math.max.apply(null, ins.map(function (n) { return n.offsetWidth; })); island.style.setProperty('--sw', Math.ceil(w) + 'px'); };
    sizeSides();
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(sizeSides); ins.forEach(function (n) { ro.observe(n); }); }
    if (document.fonts) document.fonts.ready.then(sizeSides);
    var lastY = window.scrollY, compact = false;
    var setCompact = function (c) { if (c !== compact) { compact = c; island.classList.toggle('is-compact', c); } };
    window.addEventListener('scroll', function () { var y = window.scrollY, dy = y - lastY; if (y < 140) setCompact(false); else if (dy > 4) setCompact(true); else if (dy < -4) setCompact(false); lastY = y; }, { passive: true });
  }
  /* live opening status (Iceland runs on UTC all year): weekdays 9 to 17, weekends 10 to 16 */
  var stEl = $('[data-status]');
  var status = function () {
    if (!stEl) return;
    var d = new Date(), day = d.getUTCDay(), h = d.getUTCHours() + d.getUTCMinutes() / 60;
    var hrs = function (dd) { return dd >= 1 && dd <= 5 ? [9, 17] : [10, 16]; };
    var t = hrs(day), open = h >= t[0] && h < t[1], is, en;
    if (open) { is = 'Opið til ' + t[1]; en = 'Open until ' + (t[1] - 12) + 'pm'; }
    else if (h < t[0]) { is = 'Opnar kl. ' + t[0]; en = 'Opens ' + t[0] + 'am'; }
    else { var n = hrs((day + 1) % 7); is = 'Opnar kl. ' + n[0] + ' á morgun'; en = 'Opens ' + n[0] + 'am tomorrow'; }
    stEl.classList.toggle('is-open', open);
    $('[data-status-text]', stEl).innerHTML = '<span data-l="is">' + is + '</span><span data-l="en">' + en + '</span>';
  };
  status(); setInterval(status, 60000);

  /* ---------- phone menu grows out of the island (focus-guard: pointer -> panel, keyboard -> first link) ---------- */
  var burger = $('.burger'), panel = $('#menu'), scrim = $('[data-scrim]');
  if (burger && panel) {
    var links = $$('a', panel), isOpen = false, tl = null;
    panel.setAttribute('inert', '');
    var setInert = function (on) { $$('main, footer').forEach(function (el) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }); };
    var shut = function () { panel.dataset.open = 'false'; panel.setAttribute('inert', ''); if (scrim) scrim.dataset.open = 'false'; };
    var build = function () {
      if (tl) tl.kill();
      var h = panel.offsetHeight, bar = island ? island.offsetHeight : 54;
      tl = gsap.timeline({ paused: true, onReverseComplete: shut });
      tl.fromTo(panel, { opacity: 1, clipPath: 'inset(0px 0px ' + (h - bar) + 'px 0px round ' + (bar / 2) + 'px)' }, { opacity: 1, clipPath: 'inset(0px 0px 0px 0px round 28px)', duration: 0.55, ease: 'power3.inOut' })
        .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
        .fromTo($$('.menu__links a, .menu__foot', panel), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }, 0.22);
      return tl;
    };
    var open = function (viaKey) {
      isOpen = true; panel.dataset.open = 'true'; panel.removeAttribute('inert'); if (scrim) scrim.dataset.open = 'true'; setInert(true);
      root.classList.add('menu-lock', 'menu-open'); burger.setAttribute('aria-expanded', 'true');
      if (motion) build().play(); else { panel.style.opacity = '1'; if (scrim) scrim.style.opacity = '1'; }
      (viaKey ? links[0] : panel).focus({ preventScroll: true });
    };
    var close = function (returnFocus) {
      isOpen = false; root.classList.remove('menu-lock', 'menu-open'); burger.setAttribute('aria-expanded', 'false'); setInert(false);
      if (motion && tl) tl.timeScale(1.4).reverse(); else { panel.style.opacity = ''; if (scrim) scrim.style.opacity = ''; shut(); }
      if (returnFocus) burger.focus({ preventScroll: true });
    };
    burger.addEventListener('click', function (e) { if (isOpen) close(e.detail === 0); else open(e.detail === 0); });
    if (scrim) scrim.addEventListener('click', function () { if (isOpen) close(false); });
    links.forEach(function (a) { a.addEventListener('click', function () { if (/^#/.test(a.getAttribute('href'))) close(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(true); });
    window.addEventListener('resize', function () { if (isOpen && window.innerWidth >= 1024) close(false); });
  }

  /* ---------- offers carousel ---------- */
  $$('[data-car]').forEach(function (car) {
    var track = $('.car__track', car), slides = $$('.slide', track), dots = $('.dots', car), idx = 1;
    slides.forEach(function () { dots.appendChild(document.createElement('span')); });
    var go = function (i) {
      idx = (i + slides.length) % slides.length;
      var s = slides[idx], center = car.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
      track.style.transform = 'translateX(' + center + 'px)';
      $$('span', dots).forEach(function (d, k) { d.classList.toggle('on', k === idx); });
      slides.forEach(function (sl, k) { sl.style.opacity = k === idx ? '1' : '.55'; sl.style.transition = 'opacity .5s'; });
    };
    $$('[data-dir]', car).forEach(function (b) { b.addEventListener('click', function () { go(idx + +b.dataset.dir); }); });
    var x0 = null;
    track.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    window.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); });
    window.addEventListener('resize', function () { go(idx); });
    go(idx);
    if (document.fonts) document.fonts.ready.then(function () { go(idx); });
    window.addEventListener('load', function () { go(idx); });
  });

  /* ---------- floor: fanned stack + format list ---------- */
  var stack = $('[data-stack]');
  if (stack) {
    var cards = $$('.stack__card', stack), order = cards.map(function (_, i) { return i; });
    var lay = function () {
      var small = window.innerWidth <= 860;
      order.forEach(function (ci, r) {
        var c = cards[ci], top = r === order.length - 1;
        c.style.zIndex = String(r + 1);
        c.style.transform = 'translate(' + (r * (small ? 6 : 16)) + 'px,' + (r * (small ? 10 : 24)) + 'px) rotate(' + (-8 + r * 3.6).toFixed(1) + 'deg)';
        c.setAttribute('aria-hidden', top ? 'false' : 'true');
      });
    };
    var bring = function (ci) { order = order.filter(function (x) { return x !== ci; }); order.push(ci); lay(); $$('[data-formats] button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.card === ci)); }); };
    $$('[data-formats] button').forEach(function (b) { b.addEventListener('click', function () { bring(+b.dataset.card); }); });
    cards.forEach(function (c, ci) { c.addEventListener('click', function (e) { if (e.target.closest('a')) return; var nxt = order[order.length - 2]; bring(nxt); }); });
    lay(); window.addEventListener('resize', lay);
  }

  /* ---------- plans: commitment toggle swaps the prices; "Velja" carries the plan into the form ---------- */
  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  var term = 'm', termGroup = $('[data-term-group]');
  if (termGroup) {
    var thumb = $('.term__thumb', termGroup), tbtns = $$('[data-term]', termGroup);
    var place = function () { var on = tbtns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0]; if (!on) return; thumb.style.width = on.offsetWidth + 'px'; thumb.style.transform = 'translateX(' + on.offsetLeft + 'px)'; };
    var setTerm = function (t) {
      term = t;
      tbtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.term === t)); }); place();
      $$('.tier').forEach(function (tier) {
        var b = $('[data-p-m]', tier), base = +b.dataset.pM, v = +b.getAttribute('data-p-' + t), was = $('[data-was]', tier);
        if (b.textContent !== fmt(v)) {
          if (motion) gsap.timeline().to(b, { yPercent: -35, opacity: 0, duration: 0.16, ease: 'power2.in' }).add(function () { b.textContent = fmt(v); }).fromTo(b, { yPercent: 35, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.32, ease: 'power3.out' });
          else b.textContent = fmt(v);
        }
        if (was) was.innerHTML = v < base ? '<s>' + fmt(base) + '</s><span data-l="is">Þú sparar ' + fmt(base - v) + ' kr á mánuði</span><span data-l="en">You save ' + fmt(base - v) + ' ISK a month</span>' : '<span data-l="is">Enginn binditími</span><span data-l="en">No commitment</span>';
      });
    };
    tbtns.forEach(function (b) { b.addEventListener('click', function () { setTerm(b.dataset.term); }); });
    thumb.style.transition = 'none'; setTerm('m'); termGroup.classList.add('is-ready');
    requestAnimationFrame(function () { requestAnimationFrame(function () { thumb.style.transition = ''; }); });
    if ('ResizeObserver' in window) new ResizeObserver(place).observe(termGroup);
    window.addEventListener('resize', place);
    if (document.fonts) document.fonts.ready.then(place);
  }
  var planBox = $('[data-plan]'), planName = $('[data-plan-name]');
  var termTxt = { m: ['mánaðarlega', 'monthly'], '6': ['6 mánuðir', '6 months'], '12': ['12 mánuðir', '12 months'] };
  $$('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function () {
      var tier = a.closest('.tier'), t = tier.dataset.topic === 'dagpassi' ? null : term;
      if (planBox) { planName.innerHTML = '<span data-l="is">' + tier.dataset.planIs + (t ? ' · ' + termTxt[t][0] : '') + '</span><span data-l="en">' + tier.dataset.planEn + (t ? ' · ' + termTxt[t][1] : '') + '</span>'; planBox.hidden = false; }
      var r = $('input[name="topic"][value="' + tier.dataset.topic + '"]'); if (r) r.checked = true;
      $$('.tier').forEach(function (x) { x.classList.toggle('is-picked', x === tier); });
    });
  });
  var clr = $('[data-plan-clear]');
  if (clr) clr.addEventListener('click', function () { planBox.hidden = true; $$('.tier').forEach(function (x) { x.classList.remove('is-picked'); }); });

  /* ---------- FAQ (one open; height from current state) ---------- */
  var rows = $$('.faq__row');
  var setRow = function (row, open) {
    var q = $('.faq__q', row), a = $('.faq__a', row);
    row.classList.toggle('is-open', open); q.setAttribute('aria-expanded', String(open));
    if (!motion) { a.style.height = open ? 'auto' : '0px'; return; }
    var from = a.getBoundingClientRect().height; gsap.killTweensOf(a);
    if (open) { a.style.height = 'auto'; var to = a.getBoundingClientRect().height; gsap.fromTo(a, { height: from }, { height: to, duration: 0.34, ease: 'power2.out', onComplete: function () { a.style.height = 'auto'; ScrollTrigger.refresh(); } }); }
    else gsap.fromTo(a, { height: from }, { height: 0, duration: 0.26, ease: 'power2.out' });
  };
  rows.forEach(function (row) {
    $('.faq__q', row).addEventListener('click', function () { var open = !row.classList.contains('is-open'); rows.forEach(function (r) { if (r !== row && r.classList.contains('is-open')) setRow(r, false); }); setRow(row, open); });
  });

  /* ---------- form (prototype: nothing is sent) ---------- */
  var form = $('[data-form]');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = $('.form__note', form), en = root.lang === 'en', f = function (n) { return $('[name="' + n + '"]', form); };
    var name = f('name').value.trim(), reach = f('tel').value.trim() || f('email').value.trim();
    if (!name || !reach) { note.textContent = en ? 'Add your name and a phone number or e-mail.' : 'Settu inn nafnið þitt og síma eða netfang.'; (name ? f('tel') : f('name')).focus(); return; }
    note.textContent = en ? 'Thanks, ' + name + '. Prototype: nothing was sent. On the live site this goes straight to Thor’s Power Gym.' : 'Takk, ' + name + '. Frumgerð: ekkert var sent. Á vefnum fer þetta beint til Thor’s Power Gym.';
  });

  /* ---------- film: grainy loop of their own footage; plays only near the viewport, pause button, still for reduced motion ---------- */
  var film = $('[data-film]');
  if (film) {
    var vid = $('video', film), fbtn = $('.film__pause', film), userPaused = reduce.matches, filmIn = false;
    vid.muted = true;
    var flabel = function (paused) { fbtn.setAttribute('aria-pressed', String(paused)); fbtn.dataset.ariaIs = paused ? 'Spila myndband' : 'Stöðva myndband'; fbtn.dataset.ariaEn = paused ? 'Play video' : 'Pause video'; fbtn.setAttribute('aria-label', root.lang === 'en' ? fbtn.dataset.ariaEn : fbtn.dataset.ariaIs); };
    var want = function () { if (filmIn && !userPaused && !document.hidden) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); } else vid.pause(); };
    vid.addEventListener('play', function () { flabel(false); });
    vid.addEventListener('pause', function () { flabel(true); });
    fbtn.addEventListener('click', function () { userPaused = !vid.paused; want(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { filmIn = es[0].isIntersecting; want(); }, { rootMargin: '200px 0px' }).observe(film);
    else { filmIn = true; want(); }
    document.addEventListener('visibilitychange', want);
    flabel(true);
  }

  /* ---------- news: auto-rotating rail (5 s; pauses on hover, focus, drag, hidden tab, off screen, or the pause button) ---------- */
  var news = $('[data-news]');
  if (news && hasGsap) (function () {
    var track = $('.news__track', news), N = $$('.post', track).length, bar = $('.news__bar i'), count = $('[data-news-count]'), playBtn = $('[data-news-play]');
    var D = motion ? 0.8 : 0, AUTO = 5, busy = false, auto = !reduce.matches, inView = false, hold = { hover: false, focus: false, drag: false }, prog = null;
    var ROT = [-5, 4, -3, 6, -4], LIFT = [0, 26, 8, 30, 12];
    var kids = function () { return $$('.post', track); };
    kids().forEach(function (p, i) { p.dataset.i = i; p.dataset.rot = ROT[i % 5]; p.dataset.lift = LIFT[i % 5]; });
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var step = function () { var k = kids(); return k[1].offsetLeft - k[0].offsetLeft; };
    var pose = function (d) { kids().forEach(function (p, k) { gsap.to(p, { rotation: k === 0 ? 0 : +p.dataset.rot, y: k === 0 ? 0 : +p.dataset.lift, duration: d, ease: 'power3.out', overwrite: 'auto' }); }); count.textContent = pad(+kids()[0].dataset.i + 1) + ' / ' + pad(N); };
    var running = function () { return auto && inView && !document.hidden && !hold.hover && !hold.focus && !hold.drag; };
    var sync = function () { if (prog) { if (running()) prog.play(); else prog.pause(); } };
    var restart = function () { if (prog) prog.kill(); gsap.set(bar, { scaleX: 0 }); prog = gsap.to(bar, { scaleX: 1, duration: AUTO, ease: 'none', paused: true, onComplete: function () { next(); } }); sync(); };
    var keepFocus = function (el, fn) { var had = document.activeElement === el; fn(); if (had) el.focus({ preventScroll: true }); };
    var next = function () {
      if (busy) return; busy = true;
      var k = kids(), first = k[0];
      gsap.to(first, { rotation: +first.dataset.rot, y: +first.dataset.lift, duration: D, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(k[1], { rotation: 0, y: 0, duration: D, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(track, { x: -step(), duration: D, ease: 'power3.inOut', onComplete: function () { keepFocus(first, function () { track.appendChild(first); }); gsap.set(track, { x: 0 }); busy = false; pose(D * 0.6); restart(); } });
    };
    var prev = function () {
      if (busy) return; busy = true;
      var k = kids(), last = k[k.length - 1], x0 = gsap.getProperty(track, 'x');
      keepFocus(last, function () { track.insertBefore(last, k[0]); });
      gsap.set(track, { x: x0 - step() });
      gsap.to(k[0], { rotation: +k[0].dataset.rot, y: +k[0].dataset.lift, duration: D, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(last, { rotation: 0, y: 0, duration: D, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(track, { x: 0, duration: D, ease: 'power3.inOut', onComplete: function () { busy = false; pose(D * 0.6); restart(); } });
    };
    $$('[data-news-dir]').forEach(function (b) { b.addEventListener('click', function () { if (+b.dataset.newsDir > 0) next(); else prev(); }); });
    var setAuto = function (on) { auto = on; playBtn.dataset.state = on ? 'play' : 'paused'; playBtn.dataset.ariaIs = on ? 'Stöðva sjálfvirka spilun' : 'Spila sjálfvirkt'; playBtn.dataset.ariaEn = on ? 'Pause autoplay' : 'Play automatically'; playBtn.setAttribute('aria-label', root.lang === 'en' ? playBtn.dataset.ariaEn : playBtn.dataset.ariaIs); sync(); };
    playBtn.addEventListener('click', function () { setAuto(!auto); });
    news.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hold.hover = true; sync(); } });
    news.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hold.hover = false; sync(); } });
    news.addEventListener('focusin', function (e) {
      hold.focus = true; sync();
      var p = e.target.closest('.post'); if (!p || busy || root.dataset.input === 'pointer') return;
      var r = p.getBoundingClientRect(), v = news.getBoundingClientRect();
      if (r.left < v.left || r.right > v.right) { while (kids()[0] !== p) track.appendChild(kids()[0]); gsap.set(track, { x: 0 }); pose(0); restart(); }
    });
    news.addEventListener('focusout', function (e) { if (!news.contains(e.relatedTarget)) { hold.focus = false; sync(); } });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; sync(); }, { threshold: 0.35 }).observe(news); else inView = true;
    var px = null, dx = 0, moved = false;
    news.addEventListener('pointerdown', function (e) { if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return; px = e.clientX; dx = 0; moved = false; hold.drag = true; sync(); });
    window.addEventListener('pointermove', function (e) { if (px === null) return; dx = e.clientX - px; if (!moved && Math.abs(dx) > 6) { moved = true; news.classList.add('is-drag'); } if (moved) gsap.set(track, { x: dx }); });
    var end = function () { if (px === null) return; px = null; news.classList.remove('is-drag'); hold.drag = false; if (dx < -60) next(); else if (dx > 60) prev(); else if (moved) gsap.to(track, { x: 0, duration: 0.4, ease: 'power3.out' }); sync(); };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    news.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    window.addEventListener('resize', function () { if (!busy) gsap.set(track, { x: 0 }); });
    pose(0); setAuto(auto); restart();
  })();
  else if (news) news.classList.add('news--static');

  /* ---------- shop deck: deals the next product every 3.5 s (pause button, hover, focus, off screen, hidden tab); reduced motion steps by hand ---------- */
  var deck = $('[data-deck]');
  if (deck) (function () {
    var cards = $$('.deck__card', deck), order = cards.map(function (_, i) { return i; }), dplay = $('[data-deck-play]'), dcount = $('[data-deck-count]'), dnext = $('[data-deck-next]');
    var POS = [[0, 0, -2], [22, -12, 5], [-20, -18, -8]], dAuto = !reduce.matches, dIn = false, dHold = false, timer = null, busy = false;
    var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var lay = function () {
      order.forEach(function (ci, r) {
        var c = cards[ci], p = POS[r];
        c.style.zIndex = String(10 - r);
        c.style.transform = p ? 'translate(' + p[0] + 'px,' + p[1] + 'px) rotate(' + p[2] + 'deg)' : 'translate(0,-24px) scale(.94)';
        c.style.opacity = p ? '1' : '0';
        c.setAttribute('aria-hidden', r === 0 ? 'false' : 'true'); c.tabIndex = r === 0 ? 0 : -1;
      });
      if (dcount) dcount.textContent = pad2(order[0] + 1) + ' / ' + pad2(cards.length);
    };
    var deal = function () {
      if (busy) return; busy = true;
      var f = cards[order[0]];
      f.style.transform = 'translate(-115%,30px) rotate(-18deg)'; f.style.opacity = '0';
      setTimeout(function () { order.push(order.shift()); lay(); busy = false; }, reduce.matches ? 0 : 420);
    };
    var run = function () { clearInterval(timer); timer = null; if (dAuto && dIn && !dHold && !document.hidden) timer = setInterval(deal, 3500); };
    var setDAuto = function (on) { dAuto = on; dplay.dataset.state = on ? 'play' : 'paused'; dplay.dataset.ariaIs = on ? 'Stöðva sjálfvirka spilun' : 'Spila sjálfvirkt'; dplay.dataset.ariaEn = on ? 'Pause autoplay' : 'Play automatically'; dplay.setAttribute('aria-label', root.lang === 'en' ? dplay.dataset.ariaEn : dplay.dataset.ariaIs); run(); };
    dplay.addEventListener('click', function () { setDAuto(!dAuto); });
    dnext.addEventListener('click', function () { deal(); run(); });
    deck.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { dHold = true; run(); } });
    deck.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { dHold = false; run(); } });
    deck.addEventListener('focusin', function () { dHold = true; run(); });
    deck.addEventListener('focusout', function (e) { if (!deck.contains(e.relatedTarget)) { dHold = false; run(); } });
    document.addEventListener('visibilitychange', run);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { dIn = es[0].isIntersecting; run(); }, { threshold: 0.3 }).observe(deck); else dIn = true;
    lay(); setDAuto(dAuto);
  })();

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- static rotation fallbacks are CSS; motion below ---------- */
  if (!motion) return;

  var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(function () {
    /* hero arrival: lines rise out of their masks, Hafþór rises, the rest follows */
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero__title .l > span', { yPercent: 110, duration: 1.0, stagger: 0.12 })
      .from('[data-hero-fig]', { y: 90, opacity: 0, duration: 1.3, ease: 'power3.out' }, 0.1)
      .fromTo('.hero [data-rise]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0.45)
      .from('.hero__card', { rotation: -14, duration: 1.0, ease: 'back.out(1.4)' }, 0.55)
      .from('.island', { opacity: 0, y: -24, duration: 0.7, ease: 'power3.out' }, 0.2);
    /* hero figure drifts a little on scroll */
    gsap.to('[data-hero-fig]', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* torn edges: slight parallax so the paper feels layered */
    /* top tears only push down into their own section, bottom tears only lift into theirs, so the flat edge never opens a gap */
    $$('.tear').forEach(function (t) { var top = t.classList.contains('tear--top'); gsap.fromTo(t, { y: top ? 16 : 0 }, { y: top ? 0 : -16, ease: 'none', scrollTrigger: { trigger: t.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }); });

    /* why: paper scraps drop onto the pile */
    var scraps = $$('.scrap');
    gsap.set(scraps, { opacity: 0 });
    ScrollTrigger.create({ trigger: '[data-pile]', start: 'top 80%', once: true, onEnter: function () {
      gsap.fromTo(scraps, { opacity: 0, y: -140, rotation: function (i, el) { return +el.dataset.rot + (i % 2 ? 22 : -22); }, scale: 1.08 },
        { opacity: 1, y: 0, rotation: function (i, el) { return window.innerWidth < 1100 ? (i % 2 ? 1.5 : -1.5) : +el.dataset.rot; }, scale: 1, duration: 0.9, ease: 'back.out(1.25)', stagger: { each: 0.08, from: 'random' } });
    } });
    /* the tilt follows the current width: a window narrowed after load must not keep the wide-screen tilts */
    var scrapT = null;
    window.addEventListener('resize', function () { clearTimeout(scrapT); scrapT = setTimeout(function () { var w = window.innerWidth; scraps.forEach(function (el, i) { if (!gsap.isTweening(el)) gsap.set(el, { rotation: w < 1100 ? (i % 2 ? 1.5 : -1.5) : +el.dataset.rot }); }); }, 120); });
    /* location: black bar wipes in under the address */
    var bar = $('[data-bar]');
    if (bar) gsap.fromTo(bar, { '--bar': 0 }, { '--bar': 1, duration: 0.9, ease: 'power3.inOut', scrollTrigger: { trigger: bar, start: 'top 80%' } });
    gsap.fromTo('.loc__photo', { y: 60, opacity: 0, rotation: 12 }, { y: 0, opacity: 1, rotation: 5, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.loc', start: 'top 60%' } });
    /* floor: the stack fans out, Rúnar rises */
    if (stack) gsap.from('.stack__card', { x: 0, y: 40, opacity: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out', clearProps: 'opacity', scrollTrigger: { trigger: stack, start: 'top 75%' } });
    gsap.from('[data-floor-fig]', { y: 120, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.floor', start: 'top 60%' } });
    /* text bands drift with scroll (not autoplay) */
    $$('[data-drift]').forEach(function (b) {
      var dir = +b.dataset.drift;
      gsap.fromTo(b, { xPercent: dir > 0 ? -18 : 0 }, { xPercent: dir > 0 ? 0 : -18, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    /* film: the frame opens from a tighter crop as it scrolls in (scrubbed, reversible) */
    if (film) gsap.fromTo('.film__frame', { clipPath: 'inset(9% 7% 9% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.film', start: 'top 85%', end: 'top 10%', scrub: 0.6 } });
    /* news: the rail rises in once */
    if (news) gsap.from('.news__view', { y: 80, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.news', start: 'top 75%', once: true } });
    /* generic rises */
    var rest = $$('[data-rise]').filter(function (el) { return !el.closest('.hero'); });
    gsap.set(rest, { opacity: 0, y: 40 });
    ScrollTrigger.batch(rest, { start: 'top 88%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.08, overwrite: true }); } });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  });

  reduce.addEventListener && reduce.addEventListener('change', function (e) {
    if (!e.matches) return;
    root.classList.remove('js-motion');
    ScrollTrigger.getAll().forEach(function (st) { st.kill(); }); gsap.globalTimeline.clear();
    gsap.set('[data-rise], .scrap, .stack__card, [data-hero-fig], .hero__title .l > span, .tear, .band, .loc__photo, [data-floor-fig], .hero__card, .news__view, .film__frame, .island', { clearProps: 'opacity,transform,visibility,clipPath' });
  });
})();
