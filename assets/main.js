/* Buser Mimarlık — ortak site betiği */
(function () {
    // =====================================================================
    //  AYARLAR — iletişim bilgisi değişince sadece bu iki satırı düzenleyin
    // =====================================================================
    const EPOSTA  = 'busermimarlik@gmail.com';   // örn. 'info@busermimarlik.com'
    const TELEFON = '';                          // örn. '0532 123 45 67' — boşsa WhatsApp/telefon gizli kalır
    // =====================================================================

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const root = document.documentElement;
    const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- İLETİŞİM BİLGİLERİ ----
    $$('[data-mail]').forEach(a => { a.href = 'mailto:' + EPOSTA; });
    $$('[data-mail-text]').forEach(el => { el.textContent = EPOSTA; });
    const yil = $('#currentYear'); if (yil) yil.textContent = new Date().getFullYear();

    const tel = TELEFON.replace(/\D/g, '');
    if (tel.length >= 10) {
        const intl = tel.startsWith('90') ? tel : '90' + tel.replace(/^0/, '');
        const waText = encodeURIComponent('Merhaba, web sitenizden ulaşıyorum. Projem hakkında bilgi almak istiyorum.');
        $$('[data-phone]').forEach(el => el.hidden = false);
        $$('[data-tel]').forEach(a => { a.href = 'tel:+' + intl; });
        $$('[data-tel-text]').forEach(el => { el.textContent = TELEFON; });
        $$('[data-wa]').forEach(a => { a.href = 'https://wa.me/' + intl + '?text=' + waText; });
        root.classList.add('has-wa');
    }

    // ---- AÇILIŞ VİDEOSU (yalnızca ana sayfada) ----
    const introScreen = $('#intro-screen');
    if (introScreen) {
        const introVideo = $('#intro-video');
        let closed = root.classList.contains('intro-seen');
        const closeIntro = () => {
            if (closed) return;
            closed = true;
            try { sessionStorage.setItem('buser-intro', '1'); } catch (e) {}
            introScreen.classList.add('fade-out');
            setTimeout(() => { introScreen.style.display = 'none'; introVideo.pause(); }, 800);
        };
        if (closed) {
            introVideo.removeAttribute('autoplay'); introVideo.preload = 'none'; introVideo.pause();
        } else {
            introVideo.addEventListener('ended', closeIntro);
            introVideo.addEventListener('error', closeIntro);
            $('#intro-skip').addEventListener('click', closeIntro);
            document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { closeIntro(); document.removeEventListener('keydown', onKey); } });
            const p = introVideo.play();
            if (p && p.catch) p.catch(closeIntro);
            setTimeout(closeIntro, 7000);
        }
    }

    // ---- TEMA ----
    const themeBtn = $('#themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', () => {
        const dark = root.classList.toggle('dark-theme');
        try { localStorage.setItem('buser-theme', dark ? 'dark' : 'light'); } catch (e) {}
    });

    // ---- MOBİL MENÜ ----
    const navLinks = $('#navLinks'), menuBtn = $('#menuBtn');
    const setMenu = open => {
        if (!navLinks) return;
        navLinks.classList.toggle('active', open);
        menuBtn.setAttribute('aria-expanded', open);
        menuBtn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    };
    if (menuBtn) {
        menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('active')));
        $$('#navLinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    }

    // ---- ARKA PLAN AĞ ANİMASYONU ----
    const canvas = $('#mesh-canvas');
    if (canvas && !reduceMotion) {
        const ctx = canvas.getContext('2d');
        const mouse = { x: null, y: null, radius: 130 };
        const LINK = 120;
        let particles = [], lastW = 0, rafId = null, rt;
        window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
        document.addEventListener('mouseleave', () => { mouse.x = mouse.y = null; });
        const sizeCanvas = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        const initMesh = () => {
            const w = innerWidth, h = innerHeight;
            const count = Math.min(140, Math.floor((w * h) / (w < 768 ? 16000 : 11000)));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * w, y: Math.random() * h, s: Math.random() * 2 + 1, vx: Math.random() - 0.5, vy: Math.random() - 0.5
            }));
        };
        const frame = () => {
            const w = innerWidth, h = innerHeight;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(201, 160, 99, 0.7)';
            for (const p of particles) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                if (mouse.x !== null) {
                    const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
                    if (d > 0 && d < mouse.radius) { p.x -= dx / d * 2; p.y -= dy / d * 2; }
                }
                ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
            }
            ctx.lineWidth = 0.8;
            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j], dx = a.x - b.x, dy = a.y - b.y;
                    if (dx > LINK || dx < -LINK || dy > LINK || dy < -LINK) continue;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < LINK) {
                        ctx.strokeStyle = `rgba(201, 160, 99, ${1 - d / LINK})`;
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    }
                }
            }
            rafId = requestAnimationFrame(frame);
        };
        sizeCanvas(); initMesh(); lastW = innerWidth; frame();
        window.addEventListener('resize', () => {
            clearTimeout(rt);
            rt = setTimeout(() => { sizeCanvas(); if (innerWidth !== lastW) { initMesh(); lastW = innerWidth; } }, 150);
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; } else if (!rafId) frame();
        });
    }

    // ---- ÇİZGİDEN GERÇEĞE KAYDIRICI ----
    $$('.compare').forEach(cmp => {
        const range = $('.compare-range', cmp);
        const set = v => { cmp.style.setProperty('--pos', v + '%'); range.setAttribute('aria-valuetext', '%' + Math.round(v) + ' çizim'); };
        range.addEventListener('input', () => set(range.value));
        set(range.value);
        // İlk görünüşte kısa bir tanıtım hareketi
        if (!reduceMotion && 'IntersectionObserver' in window) {
            const io = new IntersectionObserver(en => {
                if (!en[0].isIntersecting) return;
                io.disconnect();
                const seq = [50, 72, 28, 50]; let i = 0;
                const step = () => {
                    if (i >= seq.length - 1 || cmp.dataset.touched) return;
                    const from = seq[i], to = seq[i + 1], t0 = performance.now(), dur = 700;
                    const tick = now => {
                        if (cmp.dataset.touched) return;
                        const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
                        const v = from + (to - from) * e; range.value = v; set(v);
                        if (k < 1) requestAnimationFrame(tick); else { i++; setTimeout(step, 120); }
                    };
                    requestAnimationFrame(tick);
                };
                setTimeout(step, 400);
            }, { threshold: 0.5 });
            io.observe(cmp);
        }
        ['pointerdown', 'keydown', 'touchstart'].forEach(ev => range.addEventListener(ev, () => { cmp.dataset.touched = '1'; }, { passive: true }));
    });

    // ---- PROJE FİLTRESİ (ana sayfa) ----
    const filters = $('#filters');
    if (filters) filters.addEventListener('click', e => {
        const b = e.target.closest('.filter-btn'); if (!b) return;
        $$('.filter-btn', filters).forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
        $$('.project-card').forEach(c => { c.hidden = b.dataset.filter !== 'tumu' && c.dataset.cat !== b.dataset.filter; });
    });

    // ---- HAKKIMDA PENCERESİ ----
    const aboutModal = $('#aboutMeModal');
    let lastFocus = null;
    const openAbout = () => {
        lastFocus = document.activeElement;
        if (canvas) canvas.style.zIndex = '999';
        aboutModal.classList.add('open');
        requestAnimationFrame(() => requestAnimationFrame(() => aboutModal.classList.add('active')));
        document.body.style.overflow = 'hidden';
        setTimeout(() => $('.modal-close-btn', aboutModal).focus(), 50);
    };
    const closeAbout = () => {
        if (!aboutModal || !aboutModal.classList.contains('open')) return;
        aboutModal.classList.remove('active');
        setTimeout(() => { aboutModal.classList.remove('open'); if (canvas) canvas.style.zIndex = '1'; }, 400);
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
        if (location.hash === '#hakkimda') history.replaceState(null, '', location.pathname);
    };
    if (aboutModal) {
        $$('[data-open-about]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openAbout(); }));
        $$('[data-close]', aboutModal).forEach(b => b.addEventListener('click', closeAbout));
        aboutModal.addEventListener('click', e => { if (e.target === aboutModal) closeAbout(); });
        if (location.hash === '#hakkimda') setTimeout(openAbout, root.classList.contains('intro-seen') ? 100 : 1200);
    }

    // ---- GALERİ / LIGHTBOX (proje sayfaları) ----
    const lb = $('#lightbox');
    const shots = $$('.gallery a');
    let cur = 0;
    const show = i => {
        cur = (i + shots.length) % shots.length;
        const a = shots[cur];
        $('#lbImg').src = a.href; $('#lbImg').alt = $('img', a).alt;
        $('#lbCount').textContent = (cur + 1) + ' / ' + shots.length;
    };
    const closeLb = () => { if (!lb || !lb.classList.contains('open')) return; lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    if (lb && shots.length) {
        shots.forEach((a, i) => a.addEventListener('click', e => {
            e.preventDefault(); lastFocus = a; show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('.lb-close', lb).focus();
        }));
        $('.lb-close', lb).addEventListener('click', closeLb);
        $('.lb-prev', lb).addEventListener('click', () => show(cur - 1));
        $('.lb-next', lb).addEventListener('click', () => show(cur + 1));
        lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'ArrowLeft') show(cur - 1);
            if (e.key === 'ArrowRight') show(cur + 1);
        });
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAbout(); closeLb(); setMenu(false); } });

    // ---- HİZMET KARTINDAN FORMA: seçili hizmeti doldur ----
    $$('[data-service]').forEach(a => a.addEventListener('click', () => {
        const sel = $('#f-service'); if (!sel) return;
        const opt = Array.from(sel.options).find(o => o.text === a.dataset.service);
        if (opt) sel.value = opt.value;
        setTimeout(() => { const n = $('#f-name'); if (n) n.focus({ preventScroll: true }); }, 700);
    }));

    // ---- TEKLİF FORMU ----
    const form = $('#quoteForm');
    if (form) form.addEventListener('submit', e => {
        e.preventDefault();
        const name = form.name.value.trim(), msg = form.message.value.trim(), note = $('#formNote');
        if (!name || !msg) { note.textContent = 'Lütfen adınızı ve proje bilgisini yazın.'; (name ? form.message : form.name).focus(); return; }
        const body = `Ad Soyad: ${name}\nTelefon: ${form.phone.value}\nHizmet: ${form.service.value}\nKonum / Alan: ${form.city.value}\n\n${msg}`;
        location.href = `mailto:${EPOSTA}?subject=${encodeURIComponent('Teklif Talebi – ' + form.service.value)}&body=${encodeURIComponent(body)}`;
        note.textContent = 'E-posta uygulamanız açıldı. Açılmadıysa bize doğrudan ' + EPOSTA + ' adresinden yazabilirsiniz.';
    });

    // ---- BAŞA DÖN ----
    const topBtn = $('#scrollTopBtn');
    if (topBtn) {
        window.addEventListener('scroll', () => topBtn.classList.toggle('show', scrollY > 400), { passive: true });
        topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
    }

    // ---- KAYDIRMA ANİMASYONLARI ----
    const els = $$('.hidden-anim');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('show-anim'); io.unobserve(en.target); }
        }), { threshold: 0.12 });
        els.forEach(el => io.observe(el));
    } else els.forEach(el => el.classList.add('show-anim'));
})();
