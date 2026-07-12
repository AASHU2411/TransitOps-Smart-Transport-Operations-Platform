/* ==========================================================================
   TransitOps — Maintenance
   ========================================================================== */
function renderMaintenance(root, user) {
  root.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Maintenance</h2>
        <p>Open a job and the vehicle is pulled from dispatch automatically.</p>
      </div>
      <button class="btn btn-primary" id="newMaintBtn">${ICONS.plus} Log maintenance</button>
    </div>
    <div class="toolbar">
      <select id="maintStatusFilter"><option value="">All statuses</option><option>Open</option><option>Closed</option></select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-secondary btn-sm" id="exportMaintBtn">${ICONS.download} Export CSV</button>
    </div>
    <div class="panel"><div class="table-wrap"><table id="maintTable"></table></div></div>
  `;

  async function paint() {
    const status = document.getElementById('maintStatusFilter').value;
    const params = { limit: 200 };
    if (status) params.status = status;

    const table = document.getElementById('maintTable');
    table.innerHTML = '<tr><td colspan="7" class="text-faint" style="padding:20px">Loading…</td></tr>';
    try {
      const res  = await API.maintenance(params);
      const list = res.data || [];

      table.innerHTML = `
        <thead><tr><th>Vehicle</th><th>Type</th><th>Description</th><th>Cost</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${list.length ? list.map(m => `
            <tr>
              <td class="mono">${m.vehicle?.regNo || '—'}</td>
              <td>${m.type}</td>
              <td class="text-dim">${m.description || '—'}</td>
              <td class="mono">${fmtMoney(m.cost)}</td>
              <td class="text-dim">${fmtDateHuman(m.date)}</td>
              <td>${statusBadge(m.status)}</td>
              <td>${m.status === 'Open' ? `<button class="btn btn-sm btn-secondary closeM" data-id="${m.id}">${ICONS.check} Close job</button>` : ''}</td>
            </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state">${ICONS.maintenance}<p>No maintenance records yet.</p></div></td></tr>`}
        </tbody>`;

      table.querySelectorAll('.closeM').forEach(b => b.addEventListener('click', async () => {
        b.disabled = true;
        try {
          await API.closeMaintenance(b.dataset.id);
          toast('Maintenance job closed — vehicle back in service');
          paint();
        } catch (e) { toast(e.message, 'error'); b.disabled = false; }
      }));
    } catch (e) {
      table.innerHTML = `<tr><td colspan="7" class="text-faint">${e.message}</td></tr>`;
    }
  }

  document.getElementById('maintStatusFilter').addEventListener('change', paint);
  document.getElementById('exportMaintBtn').addEventListener('click', async () => {
    try {
      const res = await API.maintenance({ limit: 1000 });
      exportCSV('maintenance.csv', (res.data || []).map(m => ({
        vehicle: m.vehicle?.regNo, type: m.type, description: m.description,
        cost: m.cost, date: m.date, status: m.status,
      })));
    } catch (e) { toast(e.message, 'error'); }
  });
  document.getElementById('newMaintBtn').addEventListener('click', () => openMaintModal(paint));

  paint();
}

async function openMaintModal(onSaved) {
  let vehicles = [];
  try {
    const res = await API.vehicles({ limit: 200 });
    vehicles = (res.data || []).filter(v => v.status !== 'Retired');
  } catch (e) { toast(e.message, 'error'); return; }

  openModal({
    title: 'Log maintenance',
    bodyHtml: `
      <div class="form-grid">
        <label class="field field-full"><span>Vehicle</span>
          <select id="mmVehicle">
            <option value="">Select vehicle</option>
            ${vehicles.map(v=>`<option value="${v.id}">${v.regNo} — ${v.name} ${v.status==='InShop'?'(already in shop)':''}</option>`).join('')}
          </select>
        </label>
        <label class="field"><span>Job type</span>
          <select id="mmType">${['OilChange','TyreReplacement','BrakeService','EngineRepair','Inspection','Other'].map(t=>`<option value="${t}">${t.replace(/([A-Z])/g,' $1').trim()}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Cost (₹)</span><input id="mmCost" type="number" min="0" placeholder="4200"></label>
        <label class="field field-full"><span>Description</span><input id="mmDesc" placeholder="Scheduled 10k service"></label>
        <label class="field"><span>Date</span><input id="mmDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
      </div>
      <div class="form-msg error" id="mmErr"></div>`,
    footerHtml: `
      <button class="btn btn-ghost" id="mmCancel">Cancel</button>
      <button class="btn btn-primary" id="mmSave">Log &amp; move to In Shop</button>`,
    onMount: () => {
      document.getElementById('mmCancel').addEventListener('click', closeModal);
      document.getElementById('mmSave').addEventListener('click', async () => {
        const vehicleId   = document.getElementById('mmVehicle').value;
        const type        = document.getElementById('mmType').value;
        const cost        = Number(document.getElementById('mmCost').value);
        const description = document.getElementById('mmDesc').value.trim();
        const date        = document.getElementById('mmDate').value;
        const err         = document.getElementById('mmErr');
        if (!vehicleId || !cost || !date) { err.textContent = 'Please select a vehicle and fill in cost and date.'; return; }
        try {
          await API.createMaintenance({ vehicleId, type, cost, description, date });
          toast('Maintenance logged — vehicle status set to In Shop');
          closeModal(); onSaved();
        } catch (e) { err.textContent = e.message; }
      });
    }
  });
}
