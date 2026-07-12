/* ==========================================================================
   TransitOps — UI helpers (app.html): sidebar, RBAC nav, modal, toast
   ========================================================================== */

const ICONS = {
  dashboard:  '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.3" stroke="currentColor" stroke-width="1.4"/><rect x="9.5" y="1.5" width="6" height="9" rx="1.3" stroke="currentColor" stroke-width="1.4"/><rect x="1.5" y="9.5" width="6" height="6" rx="1.3" stroke="currentColor" stroke-width="1.4"/><rect x="9.5" y="12.5" width="6" height="3" rx="1.1" stroke="currentColor" stroke-width="1.4"/></svg>',
  vehicles:   '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 11.5V7.8L3.6 4.3a1 1 0 01.9-.6h5a1 1 0 01.9.6l1.6 3.5V11.5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M2 11.5H15V9.8a1 1 0 00-1-1h-1.5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="4.7" cy="12.7" r="1.4" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12.7" r="1.4" stroke="currentColor" stroke-width="1.4"/></svg>',
  drivers:    '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="5.2" r="2.7" stroke="currentColor" stroke-width="1.4"/><path d="M2.7 14.5c0-3 2.6-5 5.8-5s5.8 2 5.8 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  trips:      '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 8.5c2-4 4.5-6 6.5-6s4.5 2 6.5 6-4.5 6-6.5 6-4.5-2-6.5-6z" stroke="currentColor" stroke-width="1.4"/><circle cx="8.5" cy="8.5" r="1.8" stroke="currentColor" stroke-width="1.4"/></svg>',
  maintenance:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M10.8 2.6a3.4 3.4 0 00-4.4 4.2L2 11.2v2.2h2.2l4.4-4.4a3.4 3.4 0 004.2-4.4l-2.1 2.1-1.7-.5-.5-1.7 2.3-2.3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  fuel:       '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="2.5" y="2.5" width="7" height="11.5" rx="1.2" stroke="currentColor" stroke-width="1.4"/><path d="M9.5 6.5h1.3a1.2 1.2 0 011.2 1.2v3.6a1 1 0 002 0V6.3a1.5 1.5 0 00-.4-1L11.7 3.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.3 5.5h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  reports:    '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M3 13.5V6.2M8.5 13.5V3.2M14 13.5V9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M2 14.5h13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  settings:   '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="2.3" stroke="currentColor" stroke-width="1.4"/><path d="M8.5 2.5v1.6M8.5 12.4v1.6M14.5 8.5h-1.6M4.6 8.5H3M12.6 4.4l-1.1 1.1M5.5 11.6l-1.1 1.1M12.6 12.6l-1.1-1.1M5.5 5.4L4.4 4.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  plus:       '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  edit:       '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.4 2.1l2.5 2.5-7 7-2.9.4.4-2.9 7-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  trash:      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M5.5 4V2.7c0-.4.3-.7.7-.7h1.6c.4 0 .7.3.7.7V4M5 6.3v4M9 6.3v4M3.5 4l.6 7.4c0 .6.5 1.1 1.1 1.1h3.6c.6 0 1.1-.5 1.1-1.1L10.5 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search:     '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6.2" cy="6.2" r="4" stroke="currentColor" stroke-width="1.4"/><path d="M9.1 9.1l3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  play:       '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4 2.5l7 4-7 4v-8z" fill="currentColor"/></svg>',
  check:      '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.8l2.8 2.8 5.2-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close:      '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 3l7 7M10 3l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  download:   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v7m0 0L4.2 6.2M7 9l2.8-2.8M2.5 10.5v1.3c0 .55.45 1 1 1h7c.55 0 1-.45 1-1v-1.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const NAV_ITEMS = [
  { key:'dashboard',   label:'Dashboard',            icon:ICONS.dashboard,  roles:['FleetManager','Driver','SafetyOfficer','FinancialAnalyst'] },
  { key:'vehicles',    label:'Vehicle Registry',     icon:ICONS.vehicles,   roles:['FleetManager','Driver','SafetyOfficer'] },
  { key:'drivers',     label:'Drivers & Safety',     icon:ICONS.drivers,    roles:['FleetManager','SafetyOfficer'] },
  { key:'trips',       label:'Trip Dispatcher',      icon:ICONS.trips,      roles:['FleetManager','Driver'] },
  { key:'maintenance', label:'Maintenance',          icon:ICONS.maintenance,roles:['FleetManager'] },
  { key:'fuel',        label:'Fuel & Expenses',      icon:ICONS.fuel,       roles:['FleetManager','FinancialAnalyst'] },
  { key:'reports',     label:'Reports & Analytics',  icon:ICONS.reports,    roles:['FleetManager','FinancialAnalyst','SafetyOfficer'] },
  { key:'settings',    label:'Settings & RBAC',      icon:ICONS.settings,   roles:['FleetManager'] },
];

function canAccess(routeKey, role){
  const item = NAV_ITEMS.find(n => n.key === routeKey);
  return item ? item.roles.includes(role) : false;
}

function initials(name){
  return name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
}

function fmtMoney(n){
  n = Number(n)||0;
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function fmtNum(n, d=1){ return Number(n||0).toLocaleString('en-IN', { maximumFractionDigits:d }); }
function fmtDateHuman(dstr){
  if(!dstr) return '—';
  const d = new Date(dstr);
  if(isNaN(d)) return dstr;
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function statusBadge(status){
  const map = {
    Available:'badge-green', 'On Trip':'badge-blue', 'In Shop':'badge-amber', Retired:'badge-gray',
    'Off Duty':'badge-gray', Suspended:'badge-red',
    Draft:'badge-gray', Dispatched:'badge-blue', Completed:'badge-green', Cancelled:'badge-red',
    Open:'badge-amber', Closed:'badge-green',
  };
  return `<span class="badge ${map[status]||'badge-gray'}">${status}</span>`;
}

/* ---------------- Sidebar / Router shell ---------------- */
function renderSidebar(activeKey){
  const user = Auth.getUser();
  if(!user) return;
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';

  const opsTitle = document.createElement('div');
  opsTitle.className = 'nav-section-title';
  opsTitle.textContent = 'Operations';
  nav.appendChild(opsTitle);

  NAV_ITEMS.forEach(item => {
    if(!item.roles.includes(user.role)) return;
    const btn = document.createElement('button');
    btn.className = 'nav-item' + (item.key === activeKey ? ' active' : '');
    btn.innerHTML = item.icon + `<span class="nav-label">${item.label}</span>`;
    btn.addEventListener('click', () => navigate(item.key));
    nav.appendChild(btn);
  });

  document.getElementById('userAvatar').textContent = initials(user.name);
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userRole').textContent = ROLES[user.role]?.label || user.role;
}

function applyTheme(){
  const theme = localStorage.getItem('transitops_theme') || 'dark';
  document.body.classList.toggle('theme-light', theme === 'light');
}
function toggleTheme(){
  const theme = localStorage.getItem('transitops_theme') || 'dark';
  const next = theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('transitops_theme', next);
  applyTheme();
  return next;
}

function initShell(){
  applyTheme();
  const user = Auth.getUser();
  if(!user){ window.location.href = 'index.html'; return; }

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await API.logout(); } catch (_) {}
    Auth.clearToken();
    window.location.href = 'index.html';
  });

  document.getElementById('collapseBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('mobile-open');
  });

  const timeEl = document.getElementById('topbarTime');
  function tick(){
    timeEl.textContent = new Date().toLocaleString('en-IN', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  }
  tick(); setInterval(tick, 30000);
}

/* ---------------- Toast ---------------- */
function toast(msg, type='default'){
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = 'toast' + (type !== 'default' ? ' ' + type : '');
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(6px)'; el.style.transition='all .2s'; setTimeout(()=>el.remove(), 200); }, 2600);
}

/* ---------------- Modal ---------------- */
function openModal({ title, bodyHtml, footerHtml, onMount }){
  const overlay = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  box.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" id="modalCloseBtn">${ICONS.close}</button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
  `;
  overlay.classList.remove('hidden');
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  overlay.onclick = (e) => { if(e.target === overlay) closeModal(); };
  if(onMount) onMount(box);
}
function closeModal(){
  document.getElementById('modalOverlay').classList.add('hidden');
}

/* ---------------- Loading helper ---------------- */
function showLoading(container) {
  container.innerHTML = '<div style="padding:32px; text-align:center; color:var(--text-faint); font-size:13px;">Loading…</div>';
}

/* ---------------- CSV export ---------------- */
function exportCSV(filename, rows){
  if(!rows.length){ toast('Nothing to export', 'error'); return; }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')].concat(
    rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g,'""')}"`).join(','))
  ).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported');
}
