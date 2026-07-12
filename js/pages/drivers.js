/* ==========================================================================
   TransitOps — Drivers & Safety Profiles
   ========================================================================== */
function renderDrivers(root, user) {
  const canEdit = user.role === 'FleetManager' || user.role === 'SafetyOfficer';

  root.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Drivers &amp; Safety Profiles</h2>
        <p>License compliance, safety scores, and duty status.</p>
      </div>
      ${canEdit ? `<button class="btn btn-primary" id="addDriverBtn">${ICONS.plus} Add driver</button>` : ''}
    </div>
    <div class="kpi-grid" id="driverKpis"></div>
    <div class="toolbar">
      <div class="search">${ICONS.search}<input type="text" id="searchDrv" placeholder="Search name or license…"></div>
      <select id="statusFilterD">
        <option value="">All statuses</option>
        <option>Available</option><option value="OnTrip">On Trip</option><option value="OffDuty">Off Duty</option><option>Suspended</option>
      </select>
      <select id="licenseFilter">
        <option value="">All licenses</option>
        <option value="LMV">LMV</option><option value="HMV">HMV</option><option value="MCWG">MCWG</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-secondary btn-sm" id="exportDrvBtn">${ICONS.download} Export CSV</button>
    </div>
    <div class="panel"><div class="table-wrap"><table id="drvTable"></table></div></div>
  `;

  let debounce;
  async function paint() {
    const q      = document.getElementById('searchDrv').value.trim();
    const status = document.getElementById('statusFilterD').value;
    const lc     = document.getElementById('licenseFilter').value;
    const params = { limit: 200 };
    if (q)      params.search          = q;
    if (status) params.status          = status;
    if (lc)     params.licenseCategory = lc;

    const table = document.getElementById('drvTable');
    table.innerHTML = '<tr><td colspan="8" class="text-faint" style="padding:20px">Loading…</td></tr>';
    try {
      const res  = await API.drivers(params);
      const list = res.data || [];
      const all  = list;
      const today = new Date();
      const expired = all.filter(d => new Date(d.licenseExpiry) < today);
      const avgScore = all.length ? Math.round(all.reduce((s, d) => s + d.safetyScore, 0) / all.length) : 0;

      document.getElementById('driverKpis').innerHTML = `
        <div class="kpi-card" style="--accent-color:var(--blue)"><div class="kpi-label">Total Drivers</div><div class="kpi-value">${all.length}</div></div>
        <div class="kpi-card" style="--accent-color:var(--green)"><div class="kpi-label">On Duty</div><div class="kpi-value">${all.filter(d=>d.status==='OnTrip').length}</div></div>
        <div class="kpi-card" style="--accent-color:var(--red)"><div class="kpi-label">Expired Licenses</div><div class="kpi-value">${expired.length}</div></div>
        <div class="kpi-card" style="--accent-color:var(--accent)"><div class="kpi-label">Avg. Safety Score</div><div class="kpi-value">${avgScore}</div></div>`;

      table.innerHTML = `
        <thead><tr>
          <th>Name</th><th>License No.</th><th>Category</th><th>Expiry</th><th>Contact</th><th>Safety Score</th><th>Status</th>${canEdit ? '<th></th>' : ''}
        </tr></thead>
        <tbody>
          ${list.length ? list.map(d => {
            const exp = new Date(d.licenseExpiry) < today;
            const dStatus = d.status === 'OnTrip' ? 'On Trip' : d.status === 'OffDuty' ? 'Off Duty' : d.status;
            return `<tr>
              <td>${d.name}</td>
              <td class="mono">${d.licenseNumber}</td>
              <td class="text-dim">${d.licenseCategory}</td>
              <td>${exp ? '<span class="badge badge-red">Expired</span> ' : ''}${fmtDateHuman(d.licenseExpiry)}</td>
              <td class="text-dim">${d.contact}</td>
              <td>${scorePill(d.safetyScore)}</td>
              <td>${statusBadge(dStatus)}</td>
              ${canEdit ? `<td class="row-actions">
                <button class="icon-btn btn-sm editD" data-id="${d.id}">${ICONS.edit}</button>
                <button class="icon-btn btn-sm delD" data-id="${d.id}" data-name="${d.name}" data-status="${d.status}">${ICONS.trash}</button>
              </td>` : ''}
            </tr>`;
          }).join('') : `<tr><td colspan="8"><div class="empty-state">${ICONS.drivers}<p>No drivers match your search.</p></div></td></tr>`}
        </tbody>`;

      if (canEdit) {
        table.querySelectorAll('.editD').forEach(b => b.addEventListener('click', () => openDriverModal(b.dataset.id, paint)));
        table.querySelectorAll('.delD').forEach(b => b.addEventListener('click', () => {
          if (b.dataset.status === 'OnTrip') { toast('Cannot remove a driver currently on trip.', 'error'); return; }
          openConfirm(`Remove driver ${b.dataset.name}? This can't be undone.`, async () => {
            try { await API.deleteDriver(b.dataset.id); toast('Driver removed'); paint(); }
            catch (e) { toast(e.message, 'error'); }
          });
        }));
      }
    } catch (e) {
      table.innerHTML = `<tr><td colspan="8" class="text-faint">${e.message}</td></tr>`;
    }
  }

  document.getElementById('searchDrv').addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(paint, 300); });
  document.getElementById('statusFilterD').addEventListener('change', paint);
  document.getElementById('licenseFilter').addEventListener('change', paint);
  document.getElementById('exportDrvBtn').addEventListener('click', async () => {
    try {
      const res = await API.drivers({ limit: 1000 });
      exportCSV('drivers.csv', res.data || []);
    } catch (e) { toast(e.message, 'error'); }
  });
  if (canEdit) document.getElementById('addDriverBtn').addEventListener('click', () => openDriverModal(null, paint));

  paint();
}

function scorePill(score) {
  let cls = 'badge-green';
  if (score < 70) cls = 'badge-red'; else if (score < 85) cls = 'badge-amber';
  return `<span class="badge ${cls}">${score}</span>`;
}

function openDriverModal(id, onSaved) {
  const loadExisting = id ? API.driver(id) : Promise.resolve(null);
  loadExisting.then(existing => {
    openModal({
      title: existing ? 'Edit driver' : 'Add driver',
      bodyHtml: `
        <div class="form-grid">
          <label class="field field-full"><span>Full name</span><input id="mDName" value="${existing?.name || ''}" placeholder="Alex Rivera"></label>
          <label class="field"><span>License number</span><input id="mLicNo" value="${existing?.licenseNumber || ''}" placeholder="RJ-DL-88213"></label>
          <label class="field"><span>License category</span>
            <select id="mLicCat">${['LMV','HMV','MCWG'].map(c=>`<option ${existing?.licenseCategory===c?'selected':''}>${c}</option>`).join('')}</select>
          </label>
          <label class="field"><span>License expiry</span><input id="mLicExp" type="date" value="${existing?.licenseExpiry ? existing.licenseExpiry.slice(0,10) : ''}"></label>
          <label class="field"><span>Contact number</span><input id="mContact" value="${existing?.contact || ''}" placeholder="+91 98290 11223"></label>
          <label class="field"><span>Safety score (0–100)</span><input id="mScore" type="number" min="0" max="100" value="${existing?.safetyScore ?? 90}"></label>
          <label class="field"><span>Status</span>
            <select id="mDStatus">
              ${[['Available','Available'],['OnTrip','On Trip'],['OffDuty','Off Duty'],['Suspended','Suspended']].map(([v,l])=>`<option value="${v}" ${existing?.status===v?'selected':''}>${l}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="form-msg error" id="mDErr"></div>`,
      footerHtml: `
        <button class="btn btn-ghost" id="mDCancel">Cancel</button>
        <button class="btn btn-primary" id="mDSave">${existing ? 'Save changes' : 'Add driver'}</button>`,
      onMount: () => {
        document.getElementById('mDCancel').addEventListener('click', closeModal);
        document.getElementById('mDSave').addEventListener('click', async () => {
          const body = {
            name:            document.getElementById('mDName').value.trim(),
            licenseNumber:   document.getElementById('mLicNo').value.trim(),
            licenseCategory: document.getElementById('mLicCat').value,
            licenseExpiry:   document.getElementById('mLicExp').value,
            contact:         document.getElementById('mContact').value.trim(),
            safetyScore:     Math.max(0, Math.min(100, Number(document.getElementById('mScore').value))),
            status:          document.getElementById('mDStatus').value,
          };
          const err = document.getElementById('mDErr');
          if (!body.name || !body.licenseNumber || !body.licenseExpiry || !body.contact) { err.textContent = 'Please fill in all required fields.'; return; }
          try {
            if (existing) { await API.updateDriver(id, body); toast('Driver updated'); }
            else          { await API.createDriver(body);     toast('Driver added'); }
            closeModal(); onSaved();
          } catch (e) { err.textContent = e.message; }
        });
      }
    });
  }).catch(e => toast(e.message, 'error'));
}
