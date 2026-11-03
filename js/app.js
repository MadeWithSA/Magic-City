(function () {
  'use strict';

  /* ---------- Хранилище ---------- */
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const getCart = () => LS.get('mc_cart', {});
  const getFav = () => LS.get('mc_fav', []);
  const getProfile = () => LS.get('mc_profile', { name: '', phone: '', address: '' });
  const getOrders = () => LS.get('mc_orders', []);
  const P = window.PRODUCTS || [];
  const byId = (id) => P.find(p => p.id === Number(id));
  const money = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const page = document.body.dataset.page;

  /* ---------- Тема ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('mc_theme', t);
  }

  /* ---------- Шапка / подвал ---------- */
  const ICONS = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3 4.5 6.6 4.5c2 0 3.5 1 5.4 3 1.9-2 3.4-3 5.4-3 3.6 0 5.8 3.700 4.2 7.300C19.500 16.400 12 21 12 21z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.700 12.400a1 1 0 0 0 1 .800h9.200a1 1 0 0 0 1-.800L21 7H6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.600-7 8-7s8 3 8 7"/></svg>'
  };

  function renderChrome() {
    const h = $('#site-header');
    if (h) {
      const nav = (href, label, key) => `<a href="${href}" class="${page === key ? 'active' : ''}">${label}</a>`;
      h.outerHTML = `
      <header class="site-header" id="siteHeader">
        <div class="header-inner">
          <a href="index.html" class="logo"><span class="logo-mark">✦</span>Magic City</a>
          <nav class="nav" id="nav">
            ${nav('index.html', 'Главная', 'home')}
            ${nav('index.html#catalog', 'Каталог', 'catalog')}
            ${nav('favorites.html', 'Избранное', 'favorites')}
            ${nav('cart.html', 'Корзина', 'cart')}
            ${nav('profile.html', 'Профиль', 'profile')}
          </nav>
          <div class="header-actions">
            <button class="icon-btn theme-toggle" id="themeToggle" aria-label="Сменить тему">
              <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/></svg>
              <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.800A9 9 0 1 1 11.200 3a7 7 0 0 0 9.800 9.800z"/></svg>
            </button>
            <a href="favorites.html" class="icon-btn" id="favIcon" aria-label="Избранное">${ICONS.heart.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="2"')}<span class="badge-count" id="favCount">0</span></a>
            <a href="cart.html" class="icon-btn" id="cartIcon" aria-label="Корзина">${ICONS.cart}<span class="badge-count" id="cartCount">0</span></a>
            <a href="profile.html" class="icon-btn" aria-label="Профиль">${ICONS.user}</a>
            <button class="icon-btn burger" id="burger" aria-label="Меню"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          </div>
        </div>
      </header>`;
    }
    const f = $('#site-footer');
    if (f) f.outerHTML = `<footer class="site-footer">© ${new Date().getFullYear()} Magic City — коллекционные машинки</footer>`;
    if (!$('.toasts')) document.body.insertAdjacentHTML('beforeend', '<div class="toasts" id="toasts"></div>');

    $('#themeToggle').addEventListener('click', () => {
      setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
    $('#burger').addEventListener('click', () => $('#nav').classList.toggle('open'));
    $$('#nav a').forEach(a => a.addEventListener('click', () => $('#nav').classList.remove('open')));
    updateBadges(true);
  }

  function cartTotals() {
    const cart = getCart();
    let count = 0, sum = 0;
    Object.keys(cart).forEach(id => { const p = byId(id); if (p) { count += cart[id]; sum += cart[id] * p.price; } });
    return { count, sum };
  }
  function setBadge(el, n, bump) {
    if (!el) return;
    el.textContent = n;
    el.classList.toggle('show', n > 0);
    if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }
  function updateBadges(silent) {
    setBadge($('#favCount'), getFav().length, !silent);
    setBadge($('#cartCount'), cartTotals().count, !silent);
  }

  /* ---------- Уведомления и эффекты ---------- */
  function toast(msg, type) {
    const box = $('#toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2400);
  }

  function ripple(e) {
    const b = e.currentTarget;
    const r = b.getBoundingClientRect();
    const s = Math.max(r.width, r.height);
    const el = document.createElement('span');
    el.className = 'ripple';
    el.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.buy-btn, .btn');
    if (b) ripple({ currentTarget: b, clientX: e.clientX, clientY: e.clientY });
  });

  function flyToCart(fromEl) {
    const target = $('#cartIcon');
    if (!fromEl || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.className = 'fly';
    dot.style.left = a.left + a.width / 2 - 11 + 'px';
    dot.style.top = a.top + a.height / 2 - 11 + 'px';
    document.body.appendChild(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = dot.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 70}px) scale(.8)`, opacity: 1, offset: .5 },
      { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: .4 }
    ], { duration: 750, easing: 'cubic-bezier(.5,0,.8,.5)' });
    anim.onfinish = () => dot.remove();
  }

  /* ---------- Действия: избранное / корзина ---------- */
  function toggleFav(id, btn) {
    id = Number(id);
    let fav = getFav();
    const on = !fav.includes(id);
    fav = on ? fav.concat(id) : fav.filter(x => x !== id);
    LS.set('mc_fav', fav);
    if (btn) {
      btn.classList.toggle('on', on);
      btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    }
    updateBadges();
    toast(on ? 'Добавлено в избранное' : 'Убрано из избранного');
    return on;
  }
  function addToCart(id, qty, fromEl) {
    const cart = getCart();
    cart[id] = (cart[id] || 0) + (qty || 1);
    LS.set('mc_cart', cart);
    flyToCart(fromEl);
    setTimeout(() => updateBadges(), 650);
    toast('Товар в корзине', 'ok');
  }

  /* ---------- Карточка товара ---------- */
  const HEART = ICONS.heart;
  function imgTag(p, alt) {
    return `<img src="${p.image}" alt="${esc(alt || p.name)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;img-fallback&quot;>🏎️</div>'" />`;
  }
  function cardHTML(p, i) {
    const fav = getFav().includes(p.id);
    return `
    <article class="card reveal" data-id="${p.id}" style="--d:${Math.min(i % 12, 11) * 0.04}s">
      ${p.badge ? `<div class="badge">${p.badge}</div>` : ''}
      <button class="fav-btn ${fav ? 'on' : ''}" data-fav="${p.id}" aria-label="В избранное">${HEART}</button>
      <a class="card-image-box" href="product.html?id=${p.id}">${imgTag(p)}</a>
      <div class="card-body">
        <a class="card-title" href="product.html?id=${p.id}">${esc(p.name)}</a>
        <div class="card-meta"><span>Масштаб: ${p.scale}</span><span>⭐ ${p.rating}</span><span>${p.category}</span></div>
        <div class="card-footer">
          <span class="price">${money(p.price)}</span>
          <button class="buy-btn" data-add="${p.id}">В корзину</button>
        </div>
      </div>
    </article>`;
  }
  let io;
  function observeCards(root) {
    if (!('IntersectionObserver' in window)) { $$('.reveal', root).forEach(c => c.classList.add('in')); return; }
    io = io || new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -40px 0px' });
    $$('.reveal:not(.in)', root).forEach(c => io.observe(c));
  }

  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      const on = toggleFav(fav.dataset.fav, fav);
      if (page === 'favorites' && !on) {
        const card = fav.closest('.card');
        if (card) {
          card.style.transition = 'opacity .3s, transform .3s';
          card.style.opacity = '0'; card.style.transform = 'scale(.85)';
          setTimeout(renderFavorites, 300);
        }
      }
      return;
    }
    const add = e.target.closest('[data-add]');
    if (add) {
      addToCart(add.dataset.add, 1, add);
      add.classList.add('added'); const old = add.textContent; add.textContent = '✓ Добавлено';
      setTimeout(() => { add.classList.remove('added'); add.textContent = old; }, 1200);
    }
  });

  /* ---------- Главная: видео по скроллу + каталог ---------- */
  function initHome() {
    const video = $('#scrollVideo'), container = $('#videoSection'), overlay = $('#videoOverlay'), bar = $('#videoBar');
    let targetTime = 0, currentTime = 0, isSeeking = false, started = false;

    function onScroll() {
      const rect = container.getBoundingClientRect();
      const maxScroll = container.offsetHeight - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / maxScroll, 0), 1);
      if (video.duration) targetTime = progress * video.duration;
      if (overlay) overlay.style.opacity = Math.max(1 - progress * 4, 0);
      if (bar) bar.style.width = progress * 100 + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    function loop() {
      if (video.duration && !isSeeking) {
        const diff = targetTime - currentTime;
        if (Math.abs(diff) > 0.04) {
          currentTime += diff * 0.12;
          video.currentTime = currentTime;
          isSeeking = true;
        }
      }
      requestAnimationFrame(loop);
    }
    video.addEventListener('seeked', () => { isSeeking = false; });
    function start() {
      if (started) return; started = true;
      video.pause(); currentTime = 0; targetTime = 0; onScroll();
      requestAnimationFrame(loop);
    }
    video.addEventListener('loadedmetadata', start);
    if (video.readyState >= 1) start();
    // На телефонах первый жест «разблокирует» видео
    const unlock = () => { video.play().then(() => video.pause()).catch(() => {}); window.removeEventListener('touchstart', unlock); };
    window.addEventListener('touchstart', unlock, { passive: true });

    // Каталог
    const grid = $('#productsGrid'), countEl = $('#count'), search = $('#searchInput'), sort = $('#sortSelect');
    const btns = $$('.filter-btn');
    let cat = 'Все', q = '';
    function render() {
      let list = P.filter(p => (cat === 'Все' || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));
      const s = sort.value;
      if (s === 'asc') list.sort((a, b) => a.price - b.price);
      else if (s === 'desc') list.sort((a, b) => b.price - a.price);
      else if (s === 'rating') list.sort((a, b) => b.rating - a.rating);
      countEl.textContent = list.length;
      grid.innerHTML = list.length
        ? list.map(cardHTML).join('')
        : '<div class="empty"><div class="em-ico">🔍</div><h3>Ничего не найдено</h3><p>Попробуйте изменить запрос или категорию.</p></div>';
      observeCards(grid);
    }
    search.addEventListener('input', e => { q = e.target.value.trim(); render(); });
    sort.addEventListener('change', render);
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.classList.remove('active')); b.classList.add('active'); cat = b.dataset.category; render();
    }));
    render();
  }

  /* ---------- Избранное ---------- */
  function renderFavorites() {
    const grid = $('#favGrid');
    const list = getFav().map(byId).filter(Boolean);
    $('#favTotal').textContent = list.length;
    grid.innerHTML = list.length
      ? list.map(cardHTML).join('')
      : '<div class="empty"><div class="em-ico">💔</div><h3>В избранном пока пусто</h3><p>Нажмите на сердечко у машинки, и она появится здесь.</p><a class="btn" href="index.html#catalog">Перейти в каталог</a></div>';
    observeCards(grid);
  }

  /* ---------- Страница товара ---------- */
  function initProduct() {
    const id = new URLSearchParams(location.search).get('id');
    const p = byId(id);
    const root = $('#productRoot');
    if (!p) {
      root.innerHTML = '<div class="empty"><div class="em-ico">🚫</div><h3>Товар не найден</h3><a class="btn" href="index.html#catalog">В каталог</a></div>';
      return;
    }
    document.title = p.name + ' — Magic City';
    const fav = getFav().includes(p.id);
    let qty = 1;
    root.innerHTML = `
      <div class="crumbs"><a href="index.html">Главная</a> / <a href="index.html#catalog">Каталог</a> / ${esc(p.name)}</div>
      <div class="product-layout">
        <div class="product-gallery" id="gallery">${imgTag(p)}</div>
        <div class="product-info">
          <div class="tags">${p.badge ? `<span class="tag accent">${p.badge}</span>` : ''}<span class="tag">${p.category}</span><span class="tag">⭐ ${p.rating}</span></div>
          <h1>${esc(p.name)}</h1>
          <div class="product-price">${money(p.price)}</div>
          <p class="product-desc">${p.desc}</p>
          <table class="specs">
            <tr><td>Масштаб</td><td>${p.scale}</td></tr>
            <tr><td>Материал</td><td>${p.material}</td></tr>
            <tr><td>Длина модели</td><td>${p.length}</td></tr>
            <tr><td>Артикул</td><td>MC-${String(p.id).padStart(4, '0')}</td></tr>
          </table>
          <div class="buy-row">
            <div class="qty"><button id="qMinus" aria-label="Меньше">−</button><span id="qVal">1</span><button id="qPlus" aria-label="Больше">+</button></div>
            <button class="btn big" id="addBtn">В корзину</button>
            <button class="fav-btn fav-inline ${fav ? 'on' : ''}" data-fav="${p.id}" aria-label="В избранное">${HEART}</button>
          </div>
        </div>
      </div>
      <h2 class="section-title">Похожие модели</h2>
      <div class="grid" id="similar"></div>`;

    const qv = $('#qVal');
    const tick = () => { qv.textContent = qty; qv.classList.remove('tick'); void qv.offsetWidth; qv.classList.add('tick'); };
    $('#qMinus').onclick = () => { if (qty > 1) { qty--; tick(); } };
    $('#qPlus').onclick = () => { if (qty < 20) { qty++; tick(); } };
    $('#addBtn').onclick = (e) => { addToCart(p.id, qty, e.currentTarget); };
    const gal = $('#gallery'), img = $('img', gal);
    gal.addEventListener('mousemove', (e) => {
      if (!img) return;
      const r = gal.getBoundingClientRect();
      img.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`;
    });
    const sim = P.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
    $('#similar').innerHTML = sim.map(cardHTML).join('');
    observeCards($('#similar'));
  }

  /* ---------- Корзина + заказ в Telegram ---------- */
  function renderCart() {
    const list = $('#cartList'), side = $('#cartSide');
    const cart = getCart();
    const items = Object.keys(cart).map(id => ({ p: byId(id), q: cart[id] })).filter(x => x.p);
    if (!items.length) {
      list.innerHTML = '<div class="empty"><div class="em-ico">🛒</div><h3>Корзина пуста</h3><p>Добавьте машинки из каталога.</p><a class="btn" href="index.html#catalog">Перейти в каталог</a></div>';
      side.style.display = 'none';
      updateBadges(true);
      return;
    }
    side.style.display = '';
    list.innerHTML = items.map(({ p, q }, i) => `
      <div class="cart-item" data-id="${p.id}" style="animation-delay:${i * 0.06}s">
        <a class="thumb" href="product.html?id=${p.id}">${imgTag(p)}</a>
        <div>
          <a class="ci-title" href="product.html?id=${p.id}">${esc(p.name)}</a>
          <div class="ci-meta">${p.category} · ${p.scale} · ${money(p.price)}</div>
          <div class="qty"><button data-dec="${p.id}" aria-label="Меньше">−</button><span>${q}</span><button data-inc="${p.id}" aria-label="Больше">+</button></div>
        </div>
        <div class="ci-side"><div class="ci-sum">${money(p.price * q)}</div><button class="link-btn" data-del="${p.id}">Удалить</button></div>
      </div>`).join('');
    const t = cartTotals();
    $('#sumCount').textContent = t.count;
    $('#sumTotal').textContent = money(t.sum);
    updateBadges(true);
  }

  function changeQty(id, d) {
    const cart = getCart();
    cart[id] = (cart[id] || 0) + d;
    if (cart[id] <= 0) delete cart[id];
    if (cart[id] > 99) cart[id] = 99;
    LS.set('mc_cart', cart);
    renderCart();
  }

  async function sendTelegram(text) {
    const c = window.MC_CONFIG || {};
    const r = await fetch(`https://api.telegram.org/bot${c.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: c.CHAT_ID, text })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.description || 'Ошибка Telegram');
  }

  function initCart() {
    renderCart();
    const pr = getProfile();
    $('#fName').value = pr.name || ''; $('#fPhone').value = pr.phone || ''; $('#fAddress').value = pr.address || '';

    $('#cartList').addEventListener('click', (e) => {
      const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'), del = e.target.closest('[data-del]');
      if (inc) changeQty(inc.dataset.inc, 1);
      else if (dec) changeQty(dec.dataset.dec, -1);
      else if (del) {
        const row = del.closest('.cart-item'); row.classList.add('removing');
        setTimeout(() => { const c = getCart(); delete c[del.dataset.del]; LS.set('mc_cart', c); renderCart(); }, 330);
      }
    });

    $('#checkoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#fName').value.trim(), phone = $('#fPhone').value.trim(), address = $('#fAddress').value.trim(), note = $('#fNote').value.trim();
      let ok = true;
      [['#fName', name], ['#fPhone', phone.replace(/\D/g, '').length >= 7 ? phone : ''], ['#fAddress', address]].forEach(([sel, val]) => {
        const f = $(sel).closest('.field'); f.classList.remove('error');
        if (!val) { void f.offsetWidth; f.classList.add('error'); ok = false; }
      });
      if (!ok) { toast('Заполните выделенные поля', 'err'); return; }

      const cart = getCart();
      const items = Object.keys(cart).map(id => ({ p: byId(id), q: cart[id] })).filter(x => x.p);
      if (!items.length) return;
      const total = items.reduce((s, x) => s + x.p.price * x.q, 0);
      const orderId = 'MC-' + Date.now().toString().slice(-6);
      const lines = items.map((x, i) => `${i + 1}. ${x.p.name} (${x.p.scale}) × ${x.q} = ${money(x.p.price * x.q)}`).join('\n');
      const text = `🛒 Новый заказ ${orderId} — Magic City\n\n👤 ${name}\n📞 ${phone}\n📍 ${address}${note ? '\n💬 ' + note : ''}\n\n${lines}\n\n💰 Итого: ${money(total)}`;

      const btn = $('#orderBtn'); const label = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Отправляем…';
      try {
        await sendTelegram(text);
        const orders = getOrders();
        orders.unshift({ id: orderId, date: Date.now(), total, items: items.map(x => ({ id: x.p.id, name: x.p.name, q: x.q })) });
        LS.set('mc_orders', orders);
        LS.set('mc_profile', { name, phone, address });
        LS.set('mc_cart', {});
        renderCart();
        showSuccess(orderId);
      } catch (err) {
        toast('Не удалось отправить заказ: ' + err.message, 'err');
      } finally {
        btn.disabled = false; btn.innerHTML = label;
      }
    });
  }

  function showSuccess(orderId) {
    const m = document.createElement('div');
    m.className = 'modal-back';
    m.innerHTML = `<div class="modal">
      <svg class="check" viewBox="0 0 84 84"><circle cx="42" cy="42" r="40"/><path d="M26 43l11 11 21-23"/></svg>
      <h3>Заказ ${orderId} принят!</h3>
      <p>Мы получили заказ и скоро свяжемся с вами. Статус можно отслеживать в профиле.</p>
      <a class="btn big" href="profile.html">Отследить заказ</a>
    </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
  }

  /* ---------- Профиль ---------- */
  const STAGES = ['Принят', 'Собирается', 'В пути', 'Доставлен'];
  function stageOf(o) {
    const min = (Date.now() - o.date) / 60000;
    return min < 2 ? 0 : min < 30 ? 1 : min < 180 ? 2 : 3;
  }
  function initProfile() {
    const pr = getProfile();
    const nameEl = $('#pName'), phoneEl = $('#pPhone'), addrEl = $('#pAddress');
    nameEl.value = pr.name || ''; phoneEl.value = pr.phone || ''; addrEl.value = pr.address || '';
    function paintHead() {
      const n = nameEl.value.trim();
      $('#avatar').textContent = n ? n[0].toUpperCase() : 'M';
      $('#profileName').textContent = n || 'Гость';
    }
    paintHead();
    nameEl.addEventListener('input', paintHead);

    $('#profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      LS.set('mc_profile', { name: nameEl.value.trim(), phone: phoneEl.value.trim(), address: addrEl.value.trim() });
      toast('Профиль сохранён', 'ok');
    });

    const orders = getOrders();
    $('#stOrders').textContent = orders.length;
    $('#stFav').textContent = getFav().length;
    $('#stSum').textContent = Math.round(orders.reduce((s, o) => s + o.total, 0) / 1000) + 'k';

    const box = $('#ordersBox');
    box.innerHTML = orders.length ? orders.map(o => {
      const st = stageOf(o);
      const d = new Date(o.date).toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
      return `<div class="order">
        <div class="order-head"><span>Заказ ${o.id}</span><span>${money(o.total)}</span></div>
        <div class="order-items">${d}<br>${o.items.map(i => esc(i.name) + ' × ' + i.q).join('<br>')}</div>
        <div class="track"><div class="fill" data-w="${st / (STAGES.length - 1) * 100}"></div>
          ${STAGES.map((s, i) => `<div class="step ${i <= st ? 'done' : ''} ${i === st ? 'current' : ''}"><i></i>${s}</div>`).join('')}
        </div></div>`;
    }).join('') : '<div class="empty"><div class="em-ico">📦</div><h3>Заказов пока нет</h3><p>Оформите первый заказ — он появится здесь.</p><a class="btn" href="index.html#catalog">В каталог</a></div>';
    requestAnimationFrame(() => setTimeout(() => $$('.fill').forEach(f => {
      f.style.width = `calc((100% - 16px) * ${f.dataset.w / 100})`;
    }), 150));

    $('#themeBtn').addEventListener('click', () => $('#themeToggle').click());
    $('#clearBtn').addEventListener('click', () => {
      if (!confirm('Удалить избранное, корзину и историю заказов на этом устройстве?')) return;
      ['mc_cart', 'mc_fav', 'mc_orders'].forEach(k => localStorage.removeItem(k));
      toast('Данные очищены', 'ok');
      setTimeout(() => location.reload(), 600);
    });
  }

  /* ---------- Старт ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    renderChrome();
    const hdr = $('#siteHeader');
    if (page === 'home' && hdr) {
      let last = window.scrollY;
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        hdr.classList.toggle('hide', y > last && y > 200 && y < window.innerHeight * 3);
        last = y;
      }, { passive: true });
    }
    if (page === 'home') initHome();
    if (page === 'favorites') renderFavorites();
    if (page === 'product') initProduct();
    if (page === 'cart') initCart();
    if (page === 'profile') initProfile();
  });
})();
