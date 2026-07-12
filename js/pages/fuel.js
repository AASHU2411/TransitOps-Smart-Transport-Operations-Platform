/* ==========================================================================
   TransitOps — Fuel & Expense Management
   ========================================================================== */
function renderFuel(root, user) {
  root.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Fuel &amp; Expense Management</h2>
        <p>Log fuel fill-ups and other operational expenses per vehicle.</p>
      </div>
      <div class="row-actions">
        <button class="btn btn-secondary" id="newExpBtn">${ICONS.plus} Log expense</button>
        <button class="btn btn-primary" id="newFuelBtn">${ICONS.plus} Log fuel</button>
      </div>
    </div>
    <div class="kpi-grid" id="fuelKpis"><div class="text-faint" style="padding:16px">Loading…</div></div>
    <div class="grid-2">
      <div class="panel">
        <div class="panel-header"><h3>Fuel logs</h3><button class="btn btn-sm btn-secondary" id="expFuelBtn">${ICONS.download} CSV</button></div>
        <div class="table-wrap"><table id="fuelTable"></table></div>
      </div>
      <div class="panel">
        <div class="panel-header"><h3>Other expenses</h3><button class="btn btn-sm btn-secondary" id="expExpBtn">${ICONS.download} CSV</button></div>
        <div class="table-wrap"><table id="expTable"></table></div>
      </div>
    </div>
  `;

  async function paint() {
    try {
      const [fRes, eRes, costRes] = await Promise.all([
        API.fuelLogs({ limit: 200 }),
        API.expenses({ limit: 200 }),
        API.reportOperationalCost(),
      ]);
      const fuelLogs = fRes.data || [];
      const expenses = eRes.data || [];

      const totalFuelCost = fuelLogs.reduce((s, f) => s + Number(f.cost), 0);
      const totalExp      = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const totalMaint    = (costRes || []).reduce((s, r) => s + r.maintenance, 0);
      const totalOps      = totalFuelCost + totalMaint + totalExp;

      document.getElementById('fuelKpis').innerHTML = `
        <div class="kpi-card" style="--accent-color:var(--blue)"><div class="kpi-label">Total Fuel Cost</div><div class="kpi-value">${fmtMoney(totalFuelCost)}</div></div>
        <div class="kpi-card" style="--accent-color:var(--amber)"><div class="kpi-label">Total Maintenance</div><div class="kpi-value">${fmtMoney(totalMaint)}</div></div>
        <div class="kpi-card" style="--accent-color:var(--violet)"><div class="kpi-label">Other Expenses</div><div class="kpi-value">${fmtMoney(totalExp)}</div></div>
        <div class="kpi-card" style="--accent-color:var(--accent)"><div class="kpi-label">Total Operational Cost</div><div class="kpi-value">${fmtMoney(totalOps)}</div></div>`;

      document.getElementById('fuelTable').innerHTML = `
        <thead><tr><th>Vehicle</th><th>Liters</th><th>Cost</th><th>Date</th></tr></thead>
        <tbody>
          ${fuelLogs.length ? fuelLogs.map(f => `
            <tr>
              <td class="mono">${f.vehicle?.regNo || '—'}</td>
              <td class="mono">${fmtNum(f.liters, 1)} L</td>
              <td class="mono">${fmtMoney(f.cost)}</td>
              <td class="text-dim">${fmtDateHuman(f.date)}</td>
            </tr>`).join('') : `<tr><td colspan="4" class="text-faint" style="padding:20px;">No fuel logs yet.</td></tr>`}
        </tbody>`;

      document.getElementById('expTable').innerHTML = `
        <thead><tr><th>Vehicle</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>
          ${expenses.length ? expenses.map(e => `
            <tr>
              <td class="mono">${e.vehicle?.regNo || '—'}</td>
              <td>${e.type}</td>
              <td class="mono">${fmtMoney(e.amount)}</td>
              <td class="text-dim">${fmtDateHuman(e.date)}</td>
            </tr>`).join('') : `<tr><td colspan="4" class="text-faint" style="padding:20px;">No expenses logged yet.</td></tr>`}
        </tbody>`;
    } catch (e) {
      document.getElementById('fuelKpis').innerHTML = `<div class="alert alert-error">${e.message}</div>`;
    }
  }

  document.getElementById('expFuelBtn').addEventListener('click', async () => {
    try { const r = await API.fuelLogs({ limit: 1000 }); exportCSV('fuel_logs.csv', r.data || []); }
    catch (e) { toast(e.message, 'error'); }
  });
  document.getElementById('expExpBtn').addEventListener('click', async () => {
    try { const r = await API.expenses({ limit: 1000 }); exportCSV('expenses.csv', r.data || []); }
    catch (e) { toast(e.message, 'error'); }
  });
  document.getElementById('newFuelBtn').addEventListener('click', () => openFuelModal(paint));
  document.getElementById('newExpBtn').addEventListener('click', () => openExpenseModal(paint));

  paint();
}

async function openFuelModal(onSaved) {
  let vehicles = [];
  try { const r = await API.vehicles({ limit: 200 }); vehicles = (r.data || []).filter(v => v.status !== 'Retired'); }
  catch (e) { toast(e.message, 'error'); return; }

  openModal({
    title: 'Log fuel entry',
    bodyHtml: `
      <div class="form-grid">
        <label class="field field-full"><span>Vehicle</span>
          <select id="fVehicle"><option value="">Select vehicle</option>${vehicles.map(v=>`<option value="${v.id}">${v.regNo} — ${v.name}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Liters</span><input id="fLiters" type="number" min="0" placeholder="22"></label>
        <label class="field"><span>Cost (₹)</span><input id="fCost" type="number" min="0" placeholder="2178"></label>
        <label class="field field-full"><span>Date</span><input id="fDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
      </div>
      <div class="form-msg error" id="fErr"></div>`,
    footerHtml: `<button class="btn btn-ghost" id="fCancel">Cancel</button><button class="btn btn-primary" id="fSave">Log fuel</button>`,
    onMount: () => {
      document.getElementById('fCancel').addEventListener('click', closeModal);
      document.getElementById('fSave').addEventListener('click', async () => {
        const vehicleId = document.getElementById('fVehicle').value;
        const liters    = Number(document.getElementById('fLiters').value);
        const cost      = Number(document.getElementById('fCost').value);
        const date      = document.getElementById('fDate').value;
        const err       = document.getElementById('fErr');
        if (!vehicleId || !liters || !cost || !date) { err.textContent = 'Please fill in all fields.'; return; }
        try { await API.createFuel({ vehicleId, liters, cost, date }); toast('Fuel entry logged'); closeModal(); onSaved(); }
        catch (e) { err.textContent = e.message; }
      });
    }
  });
}

async function openExpenseModal(onSaved) {
  let vehicles = [];
  try { const r = await API.vehicles({ limit: 200 }); vehicles = (r.data || []).filter(v => v.status !== 'Retired'); }
  catch (e) { toast(e.message, 'error'); return; }

  openModal({
    title: 'Log expense',
    bodyHtml: `
      <div class="form-grid">
        <label class="field field-full"><span>Vehicle</span>
          <select id="eVehicle"><option value="">Select vehicle</option>${vehicles.map(v=>`<option value="${v.id}">${v.regNo} — ${v.name}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Type</span>
          <select id="eType">${['Toll','Parking','Fine','Permit','Other'].map(t=>`<option>${t}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Amount (₹)</span><input id="eAmount" type="number" min="0" placeholder="640"></label>
        <label class="field field-full"><span>Note</span><input id="eNote" placeholder="NH48 toll plaza"></label>
        <label class="field"><span>Date</span><input id="eDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
      </div>
      <div class="form-msg error" id="eErr"></div>`,
    footerHtml: `<button class="btn btn-ghost" id="eCancel">Cancel</button><button class="btn btn-primary" id="eSave">Log expense</button>`,
    onMount: () => {
      document.getElementById('eCancel').addEventListener('click', closeModal);
      document.getElementById('eSave').addEventListener('click', async () => {
        const vehicleId = document.getElementById('eVehicle').value;
        const type      = document.getElementById('eType').value;
        const amount    = Number(document.getElementById('eAmount').value);
        const note      = document.getElementById('eNote').value.trim();
        const date      = document.getElementById('eDate').value;
        const err       = document.getElementById('eErr');
        if (!vehicleId || !amount || !date) { err.textContent = 'Please fill in all fields.'; return; }
        try { await API.createExpense({ vehicleId, type, amount, note, date }); toast('Expense logged'); closeModal(); onSaved(); }
        catch (e) { err.textContent = e.message; }
      });
    }
  });
}
