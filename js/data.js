/* ==========================================================================
   TransitOps — API Client (replaces localStorage DataStore)
   ========================================================================== */
const BASE = 'http://localhost:5000/api/v1';

const ROLES = {
  FleetManager:    { label: 'Fleet Manager' },
  Driver:          { label: 'Driver' },
  SafetyOfficer:   { label: 'Safety Officer' },
  FinancialAnalyst:{ label: 'Financial Analyst' },
};

/* ---------- Token management ---------- */
const Auth = {
  getToken()  { return localStorage.getItem('transitops_token'); },
  setToken(t) { localStorage.setItem('transitops_token', t); },
  clearToken(){ localStorage.removeItem('transitops_token'); localStorage.removeItem('transitops_user'); },
  getUser()   {
    try { return JSON.parse(localStorage.getItem('transitops_user')); } catch { return null; }
  },
  setUser(u)  { localStorage.setItem('transitops_user', JSON.stringify(u)); },
  isLoggedIn(){ return !!this.getToken() && !!this.getUser(); },
};

/* ---------- Core fetch wrapper ---------- */
async function apiFetch(path, opts = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(BASE + path, { ...opts, headers });

  // Try refresh once on 401
  if (res.status === 401 && token) {
    const refreshed = await fetch(BASE + '/auth/refresh', { method: 'POST', credentials: 'include' });
    if (refreshed.ok) {
      const data = await refreshed.json();
      Auth.setToken(data.accessToken);
      headers['Authorization'] = `Bearer ${data.accessToken}`;
      res = await fetch(BASE + path, { ...opts, headers });
    } else {
      Auth.clearToken();
      window.location.href = 'index.html';
      return;
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const e = new Error(err.error || 'Request failed');
    e.status = res.status;
    e.issues = err.issues;
    throw e;
  }

  // CSV responses — return raw text
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/csv')) return res.text();

  return res.json();
}

function get(path, params)  {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(path + qs);
}
function post(path, body)   { return apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }); }
function patch(path, body)  { return apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) }); }
function del(path)          { return apiFetch(path, { method: 'DELETE' }); }

/* ---------- API surface (mirrors backend routes) ---------- */
const API = {
  // Auth
  login:   (body) => post('/auth/login', body),
  signup:  (body) => post('/auth/signup', body),
  logout:  ()     => post('/auth/logout'),

  // Dashboard
  kpis:       (params) => get('/dashboard/kpis', params),
  compliance: ()       => get('/dashboard/compliance'),

  // Vehicles
  vehicles:       (params) => get('/vehicles', params),
  vehicle:        (id)     => get(`/vehicles/${id}`),
  createVehicle:  (body)   => post('/vehicles', body),
  updateVehicle:  (id, b)  => patch(`/vehicles/${id}`, b),
  deleteVehicle:  (id)     => del(`/vehicles/${id}`),

  // Drivers
  drivers:       (params) => get('/drivers', params),
  driver:        (id)     => get(`/drivers/${id}`),
  createDriver:  (body)   => post('/drivers', body),
  updateDriver:  (id, b)  => patch(`/drivers/${id}`, b),
  deleteDriver:  (id)     => del(`/drivers/${id}`),

  // Trips
  trips:         (params) => get('/trips', params),
  trip:          (id)     => get(`/trips/${id}`),
  createTrip:    (body)   => post('/trips', body),
  dispatchTrip:  (id)     => post(`/trips/${id}/dispatch`),
  completeTrip:  (id, b)  => post(`/trips/${id}/complete`, b),
  cancelTrip:    (id)     => post(`/trips/${id}/cancel`),

  // Maintenance
  maintenance:       (params) => get('/maintenance', params),
  createMaintenance: (body)   => post('/maintenance', body),
  closeMaintenance:  (id)     => post(`/maintenance/${id}/close`),

  // Fuel & Expenses
  fuelLogs:      (params) => get('/fuel-logs', params),
  createFuel:    (body)   => post('/fuel-logs', body),
  expenses:      (params) => get('/expenses', params),
  createExpense: (body)   => post('/expenses', body),

  // Reports
  reportFuelEfficiency:  (p) => get('/reports/fuel-efficiency', p),
  reportUtilization:     ()  => get('/reports/utilization'),
  reportOperationalCost: (p) => get('/reports/operational-cost', p),
  reportROI:             (p) => get('/reports/roi', p),
  exportCSVUrl:          (p) => BASE + '/reports/export.csv' + (p ? '?' + new URLSearchParams(p) : ''),

  // Users
  users:      (params) => get('/users', params),
  updateRole: (id, role) => patch(`/users/${id}/role`, { role }),
  deleteUser: (id)       => del(`/users/${id}`),
};
