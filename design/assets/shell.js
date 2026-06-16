/* ============================================================
   QUANTIA — shell compartilhado (sidebar + topbar + tema)
   Cada página define no <body>:
     data-page="transactions"  → marca o item ativo
     data-eyebrow / data-title / data-sub → cabeçalho
     data-cta="Nova transação" → botão primário (opcional)
     data-search="Buscar…"     → placeholder da busca (opcional)
   Estrutura mínima esperada na página:
     <div class="shell"><main class="main"><div class="page">…</div></main></div>
   ============================================================ */
(function () {
  // ícones de navegação (mesma linha do protótipo)
  var ICON = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    accounts: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M16 14.5h2"/>',
    transactions: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
    recurring: '<path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4"/>',
    budgets: '<path d="M4 19V5M4 19h16M8 19v-6M12 19v-9M16 19V8M20 19v-4"/>',
    goals: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
    categories: '<path d="M4 7l8-4 8 4-8 4-8-4Z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/>',
    analytics: '<path d="M4 16l5-6 4 3 6-8"/><circle cx="9" cy="10" r="0.6" fill="currentColor"/>',
    investments: '<path d="M3 17l5-5 3 3 4-6 6 8"/>',
    market: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 14v3M12 9v8M17 12v5"/>',
    simulations: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v2.5"/>'
  };

  var NAV = [
    { group: 'Geral', items: [
      { id: 'dashboard',    label: 'Visão geral',   href: '../rebrand-model.html' },
      { id: 'accounts',     label: 'Contas',        href: 'accounts.html' },
      { id: 'transactions', label: 'Transações',    href: 'transactions.html' },
      { id: 'recurring',    label: 'Recorrências',  href: 'recurring.html' }
    ]},
    { group: 'Planejar', items: [
      { id: 'budgets',    label: 'Orçamentos', href: 'budgets.html' },
      { id: 'goals',      label: 'Metas',      href: 'goals.html' },
      { id: 'categories', label: 'Categorias', href: 'categories.html' },
      { id: 'analytics',  label: 'Análises',   href: 'analytics.html' }
    ]},
    { group: 'Mercado', items: [
      { id: 'investments', label: 'Investimentos', href: 'investments.html' },
      { id: 'market',      label: 'Cotações',      href: 'market.html' },
      { id: 'simulations', label: 'Simulações',    href: 'simulations.html' }
    ]}
  ];

  var b = document.body;
  var active = b.dataset.page || '';
  function ic(inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }

  // ---- sidebar ----
  var nav = '';
  NAV.forEach(function (g) {
    nav += '<nav class="nav-group"><div class="nav-label">' + g.group + '</div>';
    g.items.forEach(function (it) {
      nav += '<a class="nav-item' + (it.id === active ? ' active' : '') + '" href="' + it.href + '">' + ic(ICON[it.id]) + it.label + '</a>';
    });
    nav += '</nav>';
  });

  var glyph = '<svg class="glyph" viewBox="0 0 36 36" fill="none" aria-hidden="true"><rect width="36" height="36" rx="9" fill="#1F3CE0"/><path d="M0 9C0 4 4 0 9 0H18A18 18 0 0 1 0 18Z" fill="#EFEBE1"/><path d="M36 27c0 5-4 9-9 9H18A18 18 0 0 1 36 18Z" fill="#EFEBE1"/><circle cx="18" cy="18" r="3.4" fill="#2C6B57"/></svg>';
  var gear = '<svg class="cog" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M5 5l2 2M17 17l2 2M2 12h3M19 12h3M5 19l2-2M17 7l2-2"/></svg>';

  var sidebar =
    '<aside class="side">' +
      '<a class="brand" href="../rebrand-model.html">' + glyph +
        '<div><div class="word">Quan<b>tia</b></div><span class="tag">controle financeiro</span></div>' +
      '</a>' +
      nav +
      '<div class="side-foot"><a class="user-chip" href="profile.html">' +
        '<div class="avatar">G</div>' +
        '<div><div class="nm">Gabriel</div><div class="pl">plano pessoal</div></div>' +
        gear +
      '</a></div>' +
    '</aside>';

  // ---- topbar ----
  var eyebrow = b.dataset.eyebrow || '';
  var title = b.dataset.title || '';
  var sub = b.dataset.sub || '';
  var cta = b.dataset.cta || '';
  var ph = b.dataset.search || 'Buscar…';

  var topbar =
    '<header class="topbar">' +
      '<div class="head">' +
        (eyebrow ? '<div class="eyebrow">' + eyebrow + '</div>' : '') +
        '<h1>' + title + '</h1>' +
        (sub ? '<div class="sub">' + sub + '</div>' : '') +
      '</div>' +
      '<div class="actions">' +
        '<label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>' +
          '<input placeholder="' + ph + '" aria-label="Buscar"/><kbd>⌘K</kbd></label>' +
        '<button class="icon-btn theme-toggle" id="themeToggle" aria-label="Alternar tema claro/escuro" title="Alternar tema">' +
          '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/></svg>' +
          '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M19.4 4.6l-1.7 1.7M6.3 17.7l-1.7 1.7"/></svg>' +
        '</button>' +
        '<button class="icon-btn" aria-label="Notificações"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg><span class="ping"></span></button>' +
        (cta ? '<button class="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>' + cta + '</button>' : '') +
      '</div>' +
    '</header>';

  var shell = document.querySelector('.shell');
  var main = document.querySelector('.main');
  if (shell) shell.insertAdjacentHTML('afterbegin', sidebar);
  if (main) main.insertAdjacentHTML('afterbegin', topbar);

  // entrada das barras + toggle de tema
  requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });
  var root = document.documentElement;
  var tbtn = document.getElementById('themeToggle');
  if (tbtn) tbtn.addEventListener('click', function () {
    var n = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', n);
    try { localStorage.setItem('quantia-theme', n); } catch (e) {}
  });
})();
