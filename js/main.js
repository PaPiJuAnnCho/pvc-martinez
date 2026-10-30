(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const WA = '59168509257';

  $('#year').textContent = new Date().getFullYear();

  // Preloader
  const hide = () => $('#preloader').classList.add('done');
  addEventListener('load', () => setTimeout(hide, reduce ? 0 : 900));
  setTimeout(hide, 3000);

  // Nav: estado al hacer scroll, barra de progreso, menú móvil
  const nav = $('#nav'), bar = $('#progress'), burger = $('#burger'), menu = $('#menu');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const closeMenu = () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));

  // Reveal al hacer scroll (con escalonado en grupos)
  $$('.cards,.steps,.benefits,.trust').forEach(g =>
    $$('.reveal', g).forEach((el, i) => el.style.setProperty('--d', i * 0.09 + 's')));
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  // Contadores
  const cio = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suf : '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  // Efectos de puntero (solo con mouse)
  if (fine && !reduce) {
    const glow = $('#glow');
    addEventListener('pointermove', e => {
      glow.style.opacity = 1;
      glow.style.transform = `translate(${e.clientX - 210}px,${e.clientY - 210}px)`;
      glow.style.left = glow.style.top = 0;
    }, { passive: true });

    // Tilt 3D en la ventana del hero
    const art = $('#tilt'), win = $('.window');
    if (art && win) art.addEventListener('pointermove', e => {
      const r = art.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      win.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
    });
    if (art && win) art.addEventListener('pointerleave', () => (win.style.transform = ''));

    // Tilt + luz en tarjetas
    $$('[data-tilt]').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
        c.style.transform = `perspective(800px) rotateY(${(x - .5) * 8}deg) rotateX(${(.5 - y) * 8}deg) translateY(-4px)`;
      });
      c.addEventListener('pointerleave', () => (c.style.transform = ''));
    });

    // Botones magnéticos
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px,${(e.clientY - r.top - r.height / 2) * .25}px)`;
      });
      b.addEventListener('pointerleave', () => (b.style.transform = ''));
    });
  }

  // Fondo de partículas conectadas
  const cv = $('#bg');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let w, h, pts = [], mouse = { x: -999, y: -999 }, run = true;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: Math.min(70, Math.floor(w / 18)) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .6
      }));
    };
    size(); addEventListener('resize', size);
    cv.parentElement.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run) loop(); }).observe(cv);
    function loop() {
      if (!run) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 120) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = 'rgba(124,201,243,.8)'; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(124,201,243,${(1 - d / 120) * .25})`;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  // "Cotizar" desde una tarjeta preselecciona el servicio
  $$('[data-service]').forEach(a => a.addEventListener('click', () => {
    $('#servicio').value = a.dataset.service;
  }));

  // Formulario -> WhatsApp
  const form = $('#quoteForm'), err = $('#formErr');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form), nombre = (d.get('nombre') || '').trim();
    if (!nombre) { err.hidden = false; form.nombre.focus(); return; }
    err.hidden = true;
    const detalle = (d.get('detalle') || '').trim();
    const msg = `Hola Martinez, soy ${nombre}. Quiero cotizar: ${d.get('servicio')}.` + (detalle ? `\nDetalles: ${detalle}` : '');
    open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
})();

// Galería: placeholders si falta la foto, filtros, visor y comparador
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  $$('.g').forEach(f => {
    const img = $('img', f);
    if (!img) return;
    f.classList.add('ph');
    const ok = () => f.classList.remove('ph');
    img.addEventListener('load', ok);
    img.addEventListener('error', () => img.remove());
    if (img.complete && img.naturalWidth) ok();
  });
  $$('.ba-img img').forEach(img => img.addEventListener('error', () => img.remove()));

  $$('#filters button').forEach(b => b.addEventListener('click', () => {
    $$('#filters button').forEach(x => x.classList.toggle('on', x === b));
    $$('.g').forEach(g => g.classList.toggle('hide', b.dataset.f !== 'all' && g.dataset.cat !== b.dataset.f));
  }));

  const lb = $('#lightbox');
  $('#gallery').addEventListener('click', e => {
    const f = e.target.closest('.g');
    if (!f || f.classList.contains('ph')) return;
    const lv = $('video', lb), li = $('img', lb);
    if (f.dataset.video) { li.hidden = true; lv.hidden = false; lv.src = f.dataset.video; lv.play().catch(() => {}); }
    else { lv.hidden = true; lv.pause(); li.hidden = false; li.src = $('img', f).src; }
    $('p', lb).textContent = $('figcaption', f).textContent;
    lb.showModal();
  });
  lb.addEventListener('close', () => { const v = $('video', lb); v.pause(); v.removeAttribute('src'); v.load(); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.matches('.lb-close')) lb.close(); });

  const r = $('#baRange'), before = $('#baBefore'), line = $('#baLine');
  r.addEventListener('input', () => {
    before.style.clipPath = `inset(0 ${100 - r.value}% 0 0)`;
    line.style.left = r.value + '%';
  });
})();

// Video del panel del hero: pausado si el usuario pide menos movimiento
(() => {
  const v = document.getElementById('heroVideo');
  if (!v) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; return; }
  v.play().catch(() => (v.controls = true));
})();

// Botón pausa/reproducir del video del hero
(() => {
  const v = document.getElementById('heroVideo'), b = document.getElementById('vpause');
  if (!v || !b) return;
  b.addEventListener('click', () => {
    const paused = v.paused ? (v.play(), false) : (v.pause(), true);
    b.classList.toggle('paused', paused);
    b.setAttribute('aria-label', paused ? 'Reproducir video' : 'Pausar video');
  });
})();

// Oculta los recuadros de video cuyo archivo no está publicado
document.querySelectorAll('.gv video').forEach(v => v.addEventListener('error', () => v.closest('.gv').remove()));
