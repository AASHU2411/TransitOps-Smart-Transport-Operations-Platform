/* ==========================================================================
   TransitOps — Router
   ========================================================================== */
const PAGE_TITLES = {
  dashboard:   'Dashboard',
  vehicles:    'Vehicle Registry',
  drivers:     'Drivers & Safety Profiles',
  trips:       'Trip Dispatcher',
  maintenance: 'Maintenance',
  fuel:        'Fuel & Expense Management',
  reports:     'Reports & Analytics',
  settings:    'Settings & RBAC',
};

const PAGE_RENDERERS = {
  dashboard:   renderDashboard,
  vehicles:    renderVehicles,
  drivers:     renderDrivers,
  trips:       renderTrips,
  maintenance: renderMaintenance,
  fuel:        renderFuel,
  reports:     renderReports,
  settings:    renderSettings,
};

function navigate(key) {
  const user = Auth.getUser();
  if (!user) { window.location.href = 'index.html'; return; }
  if (!canAccess(key, user.role)) {
    toast("You don't have access to that module.", 'error');
    return;
  }
  window.location.hash = key;
  document.getElementById('sidebar').classList.remove('mobile-open');
  renderSidebar(key);
  document.getElementById('pageTitle').textContent = PAGE_TITLES[key] || key;
  const content = document.getElementById('content');
  content.innerHTML = '';
  PAGE_RENDERERS[key](content, user);
}

function routeFromHash() {
  const key = (window.location.hash || '#dashboard').slice(1);
  return PAGE_RENDERERS[key] ? key : 'dashboard';
}

window.addEventListener('DOMContentLoaded', () => {
  initShell();
  const user = Auth.getUser();
  if (!user) return;
  let startKey = routeFromHash();
  if (!canAccess(startKey, user.role)) {
    startKey = NAV_ITEMS.find(n => n.roles.includes(user.role))?.key || 'dashboard';
  }
  navigate(startKey);
});

window.addEventListener('hashchange', () => {
  const key = routeFromHash();
  navigate(key);
});
