/* Buser Mimarlık — "Sizi Arayalım" asistanı
 * Ziyaretçiden kısa bilgi ve telefon numarası alır, ekibin Telegram grubuna iletir.
 * Firma numaraları sitede hiçbir yerde görünmez.
 */
(function () {
    // =====================================================================
    //  AYAR — Cloudflare Worker adresi (kurulum rehberindeki 4. adım)
    //  Boş bırakılırsa asistan talebi e-posta taslağı olarak açar.
    // =====================================================================
    const WORKER_URL = 'https://buser-asistan.sertacdayilar.workers.dev';            // örn. 'https://buser-asistan.KULLANICIADI.workers.dev'
    const TURNSTILE_SITEKEY = '';     // isteğe bağlı spam koruması (rehberde 6. adım)
    const EPOSTA = 'busermimarlik@gmail.com';
    // =====================================================================

    const inProjects = /\/projeler\//.test(location.pathname);
    const KVKK_URL = (inProjects ? '../' : '') + 'kvkk.html';
    const HIZMETLER = ['Mimari Tasarım & Proje', 'Tadilat & Renovasyon', 'Anahtar Teslim Uygulama', 'Diğer'];
    const ZAMANLAR = ['En kısa sürede', 'Mesai saatinde (09–18)', 'Akşam (18–21)', 'Fark etmez'];

    const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // ---------- Arayüz ----------
    const launcher = el('button', 'chat-launcher');
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Sizi arayalım — iletişim asistanını aç');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = `
        <span class="chat-launcher-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </span>
        <span class="chat-launcher-text">Sizi arayalım</span>`;

    const panel = el('div', 'chat-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Buser Mimarlık iletişim asistanı');
    panel.hidden = true;
    panel.innerHTML = `
        <div class="chat-head">
            <img src="${inProjects ? '../' : ''}images/logo.png" alt="" width="36" height="36">
            <div><strong>Buser Mimarlık</strong><span>Sizi WhatsApp üzerinden arayalım</span></div>
            <button type="button" class="chat-close" aria-label="Asistanı kapat">&times;</button>
        </div>
        <div class="chat-body" aria-live="polite"></div>
        <form class="chat-input" autocomplete="on">
            <input type="text" aria-label="Yanıtınız" disabled>
            <button type="submit" aria-label="Gönder" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button>
        </form>`;
    document.body.append(launcher, panel);
    document.documentElement.classList.add('has-wa');

    const body = panel.querySelector('.chat-body');
    const form = panel.querySelector('.chat-input');
    const input = form.querySelector('input');
    const sendBtn = form.querySelector('button');

    const scrollDown = () => { body.scrollTop = body.scrollHeight; };
    const bot = (html, delay = 450) => new Promise(res => {
        const typing = el('div', 'msg bot typing', '<i></i><i></i><i></i>');
        body.append(typing); scrollDown();
        setTimeout(() => { typing.remove(); body.append(el('div', 'msg bot', html)); scrollDown(); res(); }, delay);
    });
    const user = text => { body.append(el('div', 'msg user', esc(text))); scrollDown(); };

    // Serbest metin cevabı bekle
    let pending = null;
    const ask = ({ placeholder = '', type = 'text', validate = () => '', optional = false, inputmode = '' }) => new Promise(res => {
        input.type = type; input.placeholder = placeholder; input.value = '';
        input.inputMode = inputmode; input.disabled = false; sendBtn.disabled = false;
        setTimeout(() => input.focus(), 50);
        let skip = null;
        if (optional) {
            skip = el('div', 'chips');
            const b = el('button', 'chip', 'Geç'); b.type = 'button';
            b.onclick = () => { skip.remove(); finish(''); };
            skip.append(b); body.append(skip); scrollDown();
        }
        const finish = v => { pending = null; input.disabled = true; sendBtn.disabled = true; input.value = ''; input.placeholder = ''; if (skip) skip.remove(); if (v) user(v); else user('—'); res(v); };
        pending = async v => {
            const err = validate(v);
            if (err) { await bot(`<em>${err}</em>`, 250); return; }
            finish(v);
        };
    });
    form.addEventListener('submit', e => {
        e.preventDefault();
        const v = input.value.trim();
        if (pending && v) pending(v);
    });

    // Seçenek butonları
    const choose = options => new Promise(res => {
        const box = el('div', 'chips');
        options.forEach(o => {
            const b = el('button', 'chip', esc(o)); b.type = 'button';
            b.onclick = () => { box.remove(); user(o); res(o); };
            box.append(b);
        });
        body.append(box); scrollDown();
        setTimeout(() => { const f = box.querySelector('button'); if (f) f.focus(); }, 50);
    });

    // Telefon doğrulama (Türkiye cep / sabit veya +ülke kodlu)
    const normPhone = v => {
        let d = v.replace(/[^\d+]/g, '');
        if (d.startsWith('+')) return d.length >= 11 && d.length <= 16 ? d : '';
        d = d.replace(/\D/g, '');
        if (d.startsWith('0090')) d = d.slice(4);
        else if (d.startsWith('90') && d.length === 12) d = d.slice(2);
        if (d.startsWith('0')) d = d.slice(1);
        return /^[2-5]\d{9}$/.test(d) ? '+90' + d : '';
    };
    const prettyPhone = p => p.startsWith('+90') ? `0${p.slice(3, 6)} ${p.slice(6, 9)} ${p.slice(9, 11)} ${p.slice(11)}` : p;

    // ---------- Akış ----------
    let started = false, startedAt = 0, running = false;
    async function run() {
        if (running) return; running = true;
        body.innerHTML = ''; startedAt = Date.now();
        await bot('Merhaba, Buser Mimarlık’a hoş geldiniz.', 300);
        await bot('Birkaç kısa soru soracağım; ardından ekibimiz sizi <strong>WhatsApp üzerinden arayacak</strong>. Toplam bir dakikanızı alır.');
        await bot('Adınız ve soyadınız?');
        const name = await ask({ placeholder: 'Ad Soyad', validate: v => v.length < 2 ? 'Lütfen adınızı yazın.' : v.length > 80 ? 'Biraz daha kısa yazabilir misiniz?' : '' });
        const first = esc(name.split(' ')[0]);
        await bot(`Memnun oldum ${first}. Hangi konuda destek almak istiyorsunuz?`);
        const service = await choose(HIZMETLER);
        await bot('Projenizden kısaca bahseder misiniz? <span class="muted">(konum, yaklaşık m², ne yapmak istediğiniz)</span>');
        const note = await ask({ placeholder: 'Örn. Çankaya, 120 m² daire, mutfak ve banyo yenileme', optional: true, validate: v => v.length > 600 ? 'En fazla 600 karakter yazabilirsiniz.' : '' });
        await bot('Sizi hangi numaradan WhatsApp ile arayalım?');
        const phone = normPhone(await ask({ placeholder: '05xx xxx xx xx', type: 'tel', inputmode: 'tel', validate: v => normPhone(v) ? '' : 'Numara geçerli görünmüyor. Örn. 0532 123 45 67' }));
        await bot('Aranmak için size en uygun zaman?');
        const when = await choose(ZAMANLAR);

        const data = { name, service, note, phone, when, page: location.pathname, startedAt };
        await bot(`<div class="summary">
            <div><span>Ad</span>${esc(name)}</div>
            <div><span>Konu</span>${esc(service)}</div>
            ${note ? `<div><span>Not</span>${esc(note)}</div>` : ''}
            <div><span>Telefon</span>${esc(prettyPhone(phone))}</div>
            <div><span>Zaman</span>${esc(when)}</div></div>`, 350);
        await consentAndSend(data);
        running = false;
    }

    async function consentAndSend(data) {
        const box = el('div', 'consent');
        box.innerHTML = `
            <label><input type="checkbox"> <span><a href="${KVKK_URL}" target="_blank" rel="noopener">Aydınlatma Metni</a>’ni okudum; bilgilerimin iletişim talebimin yanıtlanması amacıyla işlenmesini ve bu amaçla yurt dışındaki hizmet sağlayıcılara aktarılmasını kabul ediyorum.</span></label>
            <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
            <div class="ts"></div>
            <div class="consent-actions">
                <button type="button" class="chip ghost" data-act="restart">Baştan başla</button>
                <button type="button" class="chip solid" data-act="send" disabled>Gönder</button>
            </div>`;
        body.append(box); scrollDown();
        const cb = box.querySelector('input[type=checkbox]'), send = box.querySelector('[data-act=send]');
        let tsToken = '';
        if (TURNSTILE_SITEKEY && WORKER_URL) loadTurnstile(box.querySelector('.ts'), t => { tsToken = t; });
        cb.onchange = () => { send.disabled = !cb.checked; };
        box.querySelector('[data-act=restart]').onclick = () => { running = false; run(); };
        await new Promise(res => { send.onclick = res; });
        box.querySelectorAll('button,input').forEach(b => b.disabled = true);
        const hp = box.querySelector('.hp').value;

        if (!WORKER_URL) { return mailFallback(data); }
        const typing = el('div', 'msg bot typing', '<i></i><i></i><i></i>'); body.append(typing); scrollDown();
        try {
            const r = await fetch(WORKER_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign({}, data, { consent: true, website: hp, turnstile: tsToken }))
            });
            const j = await r.json().catch(() => ({}));
            typing.remove();
            if (!r.ok || !j.ok) throw new Error(j.error || r.status);
            box.remove();
            await bot(`Teşekkürler ${esc(data.name.split(' ')[0])}, talebiniz ekibimize ulaştı.`, 200);
            await bot(`En kısa sürede <strong>${esc(prettyPhone(data.phone))}</strong> numarasına <strong>WhatsApp üzerinden arama</strong> yapacağız. Aramamızı kaçırırsanız size WhatsApp’tan mesaj da bırakırız.`);
            const again = el('div', 'chips'); const b = el('button', 'chip', 'Yeni talep oluştur'); b.type = 'button';
            b.onclick = () => { again.remove(); run(); }; again.append(b); body.append(again); scrollDown();
        } catch (err) {
            typing.remove();
            await bot('Üzgünüm, talebiniz şu an iletilemedi. Aşağıdaki butonla aynı bilgileri e-posta olarak gönderebilirsiniz.', 200);
            mailFallback(data, true);
        }
    }

    function mailFallback(data, silent) {
        const txt = `Ad Soyad: ${data.name}\nKonu: ${data.service}\nNot: ${data.note || '-'}\nTelefon: ${prettyPhone(data.phone)}\nUygun zaman: ${data.when}`;
        const href = `mailto:${EPOSTA}?subject=${encodeURIComponent('Aranma talebi – ' + data.service)}&body=${encodeURIComponent(txt)}`;
        const box = el('div', 'chips');
        const a = el('a', 'chip solid', 'E-posta ile gönder'); a.href = href;
        box.append(a); body.append(box); scrollDown();
        if (!silent) bot('Asistan kurulum aşamasında. Talebinizi e-posta ile iletmek için butona dokunun; en kısa sürede sizi arayacağız.', 200);
    }

    let tsLoaded = false;
    function loadTurnstile(holder, cb) {
        const render = () => window.turnstile.render(holder, { sitekey: TURNSTILE_SITEKEY, size: 'flexible', callback: cb, language: 'tr' });
        if (window.turnstile) return render();
        if (!tsLoaded) {
            tsLoaded = true;
            const s = document.createElement('script');
            s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            s.async = true; s.onload = render; document.head.append(s);
        }
    }

    // ---------- Aç / kapat ----------
    let lastFocus = null;
    const open = () => {
        lastFocus = document.activeElement;
        panel.hidden = false; requestAnimationFrame(() => panel.classList.add('open'));
        launcher.setAttribute('aria-expanded', 'true'); launcher.classList.add('active');
        if (!started) { started = true; run(); }
    };
    const close = () => {
        panel.classList.remove('open'); launcher.setAttribute('aria-expanded', 'false'); launcher.classList.remove('active');
        setTimeout(() => { panel.hidden = true; }, 250);
        if (lastFocus) lastFocus.focus();
    };
    launcher.addEventListener('click', () => panel.hidden ? open() : close());
    panel.querySelector('.chat-close').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
    document.querySelectorAll('[data-open-chat]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(); }));
})();
