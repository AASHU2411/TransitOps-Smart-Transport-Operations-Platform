/* ==========================================================================
   TransitOps — Dashboard
   ========================================================================== */
function renderDashboard(root, user) {
  root.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Operations overview</h2>
        <p>Live snapshot of fleet, drivers and trips across all regions.</p>
      </div>
    </div>
    <div class="toolbar">
      <select id="fType"><option value="">All vehicle types</option>
        ${['Van','Truck','Pickup','Bus','Trailer'].map(t=>`<option>${t}</option>`).join('')}
      </select>
      <select id="fStatus"><option value="">All statuses</option>
        ${['Available','OnTrip','InShop','Retired'].map(s=>`<option value="${s}">${s.replace('OnTrip','On Trip').replace('InShop','In Shop')}</option>`).join('')}
      </select>
      <select id="fRegion"><option value="">All regions</option></select>
      <div class="toolbar-spacer"></div>
    </div>
    <div class="kpi-grid" id="kpiGrid"><div class="text-faint" style="padding:16px">Loading…</div></div>
    <div class="grid-2">
      <div class="panel">
        <div class="panel-header"><h3>Vehicle status</h3></div>
        <div class="panel-body table-wrap"><table id="vehicleStatusTable"></table></div>
      </div>
      <div class="panel">
        <div class="panel-header"><h3>Fleet utilization</h3></div>
        <div class="panel-body" id="utilPanel"></div>
      </div>
    </div>
    <div class="grid-2 mt-16">
      <div class="panel">
        <div class="panel-header"><h3>Active &amp; pending trips</h3></div>
        <div class="panel-body table-wrap"><table id="tripsTable"></table></div>
      </div>
      <div class="panel">
        <div class="panel-header"><h3>Compliance watch</h3></div>
        <div class="panel-body" id="compliancePanel"></div>
      </div>
    </div>
  `;

  // Populate region filter from vehicles
  API.vehicles({ limit: 200 }).then(res => {
    const regions = [...new Set((res.data || []).map(v => v.region).filter(Boolean))];
    const sel = document.getElementById('fRegion');
    regions.forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); });
  }).catch(() => {});

  ['fType', 'fStatus', 'fRegion'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', paint);
  });

  async function paint() {
    const type   = document.getElementById('fType')?.value;
    const status = document.getElementById('fStatus')?.value;
    const region = document.getElementById('fRegion')?.value;

    const params = {};
    if (type)   params.type   = type;
    if (status) params.status = status;
    if (region) params.region = region;

    try {
      const [kpiData, compData, vehiclesRes, tripsRes] = await Promise.all([
        API.kpis(params),
        API.compliance(),
        API.vehicles({ ...params, limit: 8 }),
        API.trips({ status: '', limit: 8 }),
      ]);

      const k = kpiData.vehicles || {};
      document.getElementById('kpiGrid').innerHTML = [
        { label: 'Active Vehicles',    value: k.total || 0,          color: 'var(--blue)' },
        { label: 'Available Vehicles', value: k.available || 0,      color: 'var(--green)' },
        { label: 'In Maintenance',     value: k.inShop || 0,         color: 'var(--amber)' },
        { label: 'Active Trips',       value: kpiData.trips?.active || 0,    color: 'var(--violet)' },
        { label: 'Pending Trips',      value: kpiData.trips?.completed || 0, color: 'var(--teal)' },
        { label: 'Drivers On Duty',    value: kpiData.drivers?.total - (kpiData.drivers?.available || 0) || 0, color: 'var(--red)' },
        { label: 'Fleet Utilization',  value: (k.utilizationPct || 0) + '%', color: 'var(--accent)' },
      ].map(c => `
        <div class="kpi-card" style="--accent-color:${c.color}">
          <div class="kpi-label">${c.label}</div>
          <div class="kpi-value">${c.value}</div>
        </div>`).join('');

      const vehicles = vehiclesRes.data || [];
      document.getElementById('vehicleStatusTable').innerHTML = `
        <thead><tr><th>Reg No.</th><th>Vehicle</th><th>Region</th><th>Status</th></tr></thead>
        <tbody>
          ${vehicles.length ? vehicles.map(v => `
            <tr>
              <td class="mono">${v.regNo}</td>
              <td>${v.name}</td>
              <td class="text-dim">${v.region}</td>
              <td>${statusBadge(displayStatus(v.status))}</td>
            </tr>`).join('') : `<tr><td colspan="4" class="text-faint">No vehicles match these filters.</td></tr>`}
        </tbody>`;

      const util = k.utilizationPct || 0;
      document.getElementById('utilPanel').innerHTML = `
        <div class="kpi-value" style="font-size:34px; margin-bottom:10px;">${util}<span>%</span></div>
        <div class="bar-track" style="margin-bottom:16px;"><div class="bar-fill" style="width:${util}%"></div></div>
        <div class="stat-line"><span class="text-dim">On trip</span><strong>${k.onTrip || 0}</strong></div>
        <div class="stat-line"><span class="text-dim">Available</span><strong>${k.available || 0}</strong></div>
        <div class="stat-line"><span class="text-dim">In shop</span><strong>${k.inShop || 0}</strong></div>`;

      const activeTrips = (tripsRes.data || []).filter(t => t.status === 'Dispatched' || t.status === 'Draft').slice(0, 8);
      document.getElementById('tripsTable').innerHTML = `
        <thead><tr><th>Route</th><th>Vehicle</th><th>Driver</th><th>Status</th></tr></thead>
        <tbody>
          ${activeTrips.length ? activeTrips.map(t => `
            <tr>
              <td>${t.source} → ${t.destination}</td>
              <td class="mono">${t.vehicle?.regNo || '—'}</td>
              <td class="text-dim">${t.driver?.name || '—'}</td>
              <td>${statusBadge(t.status)}</td>
            </tr>`).join('') : `<tr><td colspan="4" class="text-faint">No active or pending trips.</td></tr>`}
        </tbody>`;

      const expired  = compData.expiredLicenses || [];
      const expiring = compData.expiringSoon || [];
      const suspended = compData.suspendedDrivers || [];
      const openMaint = compData.openMaintenance || [];
      document.getElementById('compliancePanel').innerHTML = `
        ${expired.length  ? `<div class="alert alert-error">${expired.length} driver(s) have expired licenses.</div>` : ''}
        ${expiring.length ? `<div class="alert alert-warn">${expiring.length} driver license(s) expiring within 14 days.</div>` : ''}
        ${suspended.length ? `<div class="alert alert-warn">${suspended.length} driver(s) are currently suspended.</div>` : ''}
        ${openMaint.length ? `<div class="alert alert-warn">${openMaint.length} vehicle(s) in open maintenance.</div>` : ''}
        ${(!expired.length && !expiring.length && !suspended.length && !openMaint.length)
          ? `<p class="text-faint" style="padding:8px 0;">All clear — no compliance flags right now.</p>` : ''}`;

    } catch (err) {
      document.getElementById('kpiGrid').innerHTML = `<div class="alert alert-error">Failed to load dashboard: ${err.message}</div>`;
    }
  }

  paint();
}

function displayStatus(s) {
  return s === 'OnTrip' ? 'On Trip' : s === 'InShop' ? 'In Shop' : s;
}
