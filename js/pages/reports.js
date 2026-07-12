/* ==========================================================================
   TransitOps — Reports & Analytics
   ========================================================================== */
function renderReports(root, user) {
  root.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Reports &amp; Analytics</h2>
        <p>Fuel efficiency, utilization, cost, and return on fleet assets.</p>
      </div>
      <a class="btn btn-secondary" id="exportReportBtn" href="#" download>${ICONS.download} Export CSV</a>
    </div>
    <div class="kpi-grid" id="reportKpis"><div class="text-faint" style="padding:16px">Loading…</div></div>
    <div class="grid-2">
      <div class="panel">
        <div class="panel-header"><h3>Cost breakdown</h3></div>
        <div class="panel-body" id="costBreakdown"><div class="text-faint" style="padding:16px">Loading…</div></div>
      </div>
      <div class="panel">
        <div class="panel-header"><h3>Fleet utilization</h3></div>
        <div class="panel-body" id="utilPanel"><div class="text-faint" style="padding:16px">Loading…</div></div>
      </div>
    </div>
    <div class="panel mt-16">
      <div class="panel-header"><h3>Per-vehicle ROI &amp; efficiency</h3></div>
      <div class="table-wrap"><table id="roiTable"><tr><td class="text-faint" style="padding:20px">Loading…</td></tr></table></div>
    </div>
  `;

  // Wire CSV export link to backend streaming endpoint
  const exportBtn = document.getElementById('exportReportBtn');
  const token = Auth.getToken();
  exportBtn.href = API.exportCSVUrl();
  exportBtn.addEventListener('click', (e) => {
    // Fetch with auth header and trigger download manually
    e.preventDefault();
    fetch(API.exportCSVUrl(), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'operational-cost.csv'; a.click();
        URL.revokeObjectURL(url);
        toast('CSV exported');
      })
      .catch(e => toast(e.message, 'error'));
  });

  async function paint() {
    try {
      const [effData, utilData, costData, roiData] = await Promise.all([
        API.reportFuelEfficiency(),
        API.reportUtilization(),
        API.reportOperationalCost(),
        API.reportROI(),
      ]);

      const avgEff = effData.length
        ? effData.reduce((s, r) => s + (r.kmPerLiter || 0), 0) / effData.filter(r => r.kmPerLiter).length
        : 0;
      const totalOps = (costData || []).reduce((s, r) => s + r.total, 0);
      const avgRoi   = roiData.length
        ? roiData.reduce((s, r) => s + (r.roiPct || 0), 0) / roiData.length
        : 0;

      document.getElementById('reportKpis').innerHTML = [
        { label: 'Avg. Fuel Efficiency', value: fmtNum(avgEff, 1) + '<span>km/L</span>', color: 'var(--blue)' },
        { label: 'Fleet Utilization',    value: (utilData.utilizationPct || 0) + '<span>%</span>', color: 'var(--green)' },
        { label: 'Operational Cost',     value: fmtMoney(totalOps), color: 'var(--amber)' },
        { label: 'Avg. Vehicle ROI',     value: fmtNum(avgRoi, 1) + '<span>%</span>', color: 'var(--accent)' },
      ].map(c => `
        <div class="kpi-card" style="--accent-color:${c.color}">
          <div class="kpi-label">${c.label}</div>
          <div class="kpi-value">${c.value}</div>
        </div>`).join('');

      const totalFuel  = (costData || []).reduce((s, r) => s + r.fuel, 0);
      const totalMaint = (costData || []).reduce((s, r) => s + r.maintenance, 0);
      const totalExp   = (costData || []).reduce((s, r) => s + r.expenses, 0);
      const grandTotal = totalFuel + totalMaint + totalExp;
      const pct = (v) => grandTotal > 0 ? Math.round((v / grandTotal) * 100) : 0;

      document.getElementById('costBreakdown').innerHTML = `
        <div class="stat-line"><span class="text-dim">Fuel</span><strong class="mono">${fmtMoney(totalFuel)}</strong></div>
        <div class="bar-track" style="margin:6px 0 14px;"><div class="bar-fill" style="width:${pct(totalFuel)}%; background:var(--blue)"></div></div>
        <div class="stat-line"><span class="text-dim">Maintenance</span><strong class="mono">${fmtMoney(totalMaint)}</strong></div>
        <div class="bar-track" style="margin:6px 0 14px;"><div class="bar-fill" style="width:${pct(totalMaint)}%; background:var(--amber)"></div></div>
        <div class="stat-line"><span class="text-dim">Other expenses</span><strong class="mono">${fmtMoney(totalExp)}</strong></div>
        <div class="bar-track" style="margin:6px 0;"><div class="bar-fill" style="width:${pct(totalExp)}%; background:var(--violet)"></div></div>`;

      document.getElementById('utilPanel').innerHTML = `
        <div class="kpi-value" style="font-size:34px; margin-bottom:10px;">${utilData.utilizationPct || 0}<span>%</span></div>
        <div class="bar-track" style="margin-bottom:16px;"><div class="bar-fill" style="width:${utilData.utilizationPct || 0}%"></div></div>
        <div class="stat-line"><span class="text-dim">On trip</span><strong>${utilData.onTrip || 0}</strong></div>
        <div class="stat-line"><span class="text-dim">Total active</span><strong>${utilData.total || 0}</strong></div>`;

      // Merge ROI + cost + efficiency by vehicleId
      const effMap  = Object.fromEntries((effData || []).map(r => [r.vehicle?.id, r]));
      const costMap = Object.fromEntries((costData || []).map(r => [r.vehicle?.id, r]));

      document.getElementById('roiTable').innerHTML = `
        <thead><tr><th>Vehicle</th><th>Fuel Efficiency</th><th>Operational Cost</th><th>Acq. Cost</th><th>ROI</th></tr></thead>
        <tbody>
          ${roiData.length ? roiData.map(r => {
            const eff = effMap[r.vehicle?.id];
            const cost = costMap[r.vehicle?.id];
            return `<tr>
              <td class="mono">${r.vehicle?.regNo || '—'}</td>
              <td class="mono">${eff?.kmPerLiter ? fmtNum(eff.kmPerLiter, 1) + ' km/L' : '—'}</td>
              <td class="mono">${fmtMoney(cost?.total || 0)}</td>
              <td class="mono">${fmtMoney(r.acquisitionCost)}</td>
              <td><span class="badge ${(r.roiPct || 0) >= 0 ? 'badge-green' : 'badge-red'}">${fmtNum(r.roiPct || 0, 1)}%</span></td>
            </tr>`;
          }).join('') : `<tr><td colspan="5" class="text-faint" style="padding:20px">No completed trips yet — ROI requires completed trip data.</td></tr>`}
        </tbody>`;

    } catch (e) {
      document.getElementById('reportKpis').innerHTML = `<div class="alert alert-error">Failed to load reports: ${e.message}</div>`;
    }
  }

  paint();
}
