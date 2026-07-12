/* ==========================================================================
   TransitOps — Vehicle Registry
   ========================================================================== */
function renderVehicles(root, user) {
  const canEdit = user.role === 'FleetManager';

  root.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Vehicle Registry</h2>
        <p>Master list of fleet assets — registration, capacity, and lifecycle status.</p>
      </div>
      ${canEdit ? `<button class="btn btn-primary" id="addVehicleBtn">${ICONS.plus} Add vehicle</button>` : ''}
    </div>
    <div class="toolbar">
      <div class="search">${ICONS.search}<input type="text" id="searchVeh" placeholder="Search registration or name…"></div>
      <select id="statusFilter">
        <option value="">All statuses</option>
        <option value="Available">Available</option>
        <option value="OnTrip">On Trip</option>
        <option value="InShop">In Shop</option>
        <option value="Retired">Retired</option>
      </select>
      <select id="typeFilter">
        <option value="">All types</option>
        ${['Van','Truck','Pickup','Bus','Trailer'].map(t=>`<option>${t}</option>`).join('')}
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-secondary btn-sm" id="exportVehBtn">${ICONS.download} Export CSV</button>
    </div>
    <div class="panel"><div class="table-wrap"><table id="vehTable"></table></div></div>
  `;

  let debounce;
  async function paint() {
    const q      = document.getElementById('searchVeh').value.trim();
    const status = document.getElementById('statusFilter').value;
    const type   = document.getElementById('typeFilter').value;
    const params = { limit: 200 };
    if (q)      params.search = q;
    if (status) params.status = status;
    if (type)   params.type   = type;

    const table = document.getElementById('vehTable');
    table.innerHTML = '<tr><td colspan="9" class="text-faint" style="padding:20px">Loading…</td></tr>';
    try {
      const res  = await API.vehicles(params);
      const list = res.data || [];
      table.innerHTML = `
        <thead><tr>
          <th>Reg No.</th><th>Vehicle</th><th>Type</th><th>Max Load</th><th>Odometer</th><th>Acq. Cost</th><th>Region</th><th>Status</th>${canEdit ? '<th></th>' : ''}
        </tr></thead>
        <tbody>
          ${list.length ? list.map(v => `
            <tr>
              <td class="mono">${v.regNo}</td>
              <td>${v.name}</td>
              <td class="text-dim">${v.type}</td>
              <td class="mono">${fmtNum(v.maxLoad, 0)} kg</td>
              <td class="mono">${fmtNum(v.odometer, 0)} km</td>
              <td class="mono">${fmtMoney(v.acquisitionCost)}</td>
              <td class="text-dim">${v.region}</td>
              <td>${statusBadge(displayStatus(v.status))}</td>
              ${canEdit ? `<td class="row-actions">
                <button class="icon-btn btn-sm editV" data-id="${v.id}">${ICONS.edit}</button>
                <button class="icon-btn btn-sm delV" data-id="${v.id}" data-reg="${v.regNo}" data-status="${v.status}">${ICONS.trash}</button>
              </td>` : ''}
            </tr>`).join('') : `<tr><td colspan="9"><div class="empty-state">${ICONS.vehicles}<p>No vehicles match your search.</p></div></td></tr>`}
        </tbody>`;

      if (canEdit) {
        table.querySelectorAll('.editV').forEach(b => b.addEventListener('click', () => openVehicleModal(b.dataset.id, paint)));
        table.querySelectorAll('.delV').forEach(b => b.addEventListener('click', () => {
          if (b.dataset.status === 'OnTrip') { toast('Cannot remove a vehicle currently on trip.', 'error'); return; }
          openConfirm(`Remove vehicle ${b.dataset.reg}? This can't be undone.`, async () => {
            try { await API.deleteVehicle(b.dataset.id); toast('Vehicle removed'); paint(); }
            catch (e) { toast(e.message, 'error'); }
          });
        }));
      }
    } catch (e) {
      table.innerHTML = `<tr><td colspan="9" class="text-faint">${e.message}</td></tr>`;
    }
  }

  document.getElementById('searchVeh').addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(paint, 300); });
  document.getElementById('statusFilter').addEventListener('change', paint);
  document.getElementById('typeFilter').addEventListener('change', paint);
  document.getElementById('exportVehBtn').addEventListener('click', async () => {
    try {
      const res = await API.vehicles({ limit: 1000 });
      exportCSV('vehicles.csv', (res.data || []).map(v => ({ ...v, status: displayStatus(v.status) })));
    } catch (e) { toast(e.message, 'error'); }
  });
  if (canEdit) document.getElementById('addVehicleBtn').addEventListener('click', () => openVehicleModal(null, paint));

  paint();
}

function openVehicleModal(id, onSaved) {
  const loadExisting = id ? API.vehicle(id) : Promise.resolve(null);
  loadExisting.then(existing => {
    openModal({
      title: existing ? 'Edit vehicle' : 'Register vehicle',
      bodyHtml: `
        <div class="form-grid">
          <label class="field field-full"><span>Registration number</span><input id="mRegNo" value="${existing?.regNo || ''}" placeholder="RJ14-GB-4021"></label>
          <label class="field field-full"><span>Vehicle name / model</span><input id="mName" value="${existing?.name || ''}" placeholder="Van-05 (Tata Ace)"></label>
          <label class="field"><span>Type</span>
            <select id="mType">${['Van','Truck','Pickup','Bus','Trailer'].map(t=>`<option ${existing?.type===t?'selected':''}>${t}</option>`).join('')}</select>
          </label>
          <label class="field"><span>Status</span>
            <select id="mStatus">${['Available','OnTrip','InShop','Retired'].map(s=>`<option value="${s}" ${existing?.status===s?'selected':''}>${displayStatus(s)}</option>`).join('')}</select>
          </label>
          <label class="field"><span>Max load capacity (kg)</span><input id="mMaxLoad" type="number" min="0" value="${existing?.maxLoad || ''}"></label>
          <label class="field"><span>Odometer (km)</span><input id="mOdometer" type="number" min="0" value="${existing?.odometer || 0}"></label>
          <label class="field"><span>Acquisition cost (₹)</span><input id="mCost" type="number" min="0" value="${existing?.acquisitionCost || ''}"></label>
          <label class="field"><span>Region</span><input id="mRegion" value="${existing?.region || ''}" placeholder="Jaipur"></label>
        </div>
        <div class="form-msg error" id="mErr"></div>`,
      footerHtml: `
        <button class="btn btn-ghost" id="mCancel">Cancel</button>
        <button class="btn btn-primary" id="mSave">${existing ? 'Save changes' : 'Register vehicle'}</button>`,
      onMount: () => {
        document.getElementById('mCancel').addEventListener('click', closeModal);
        document.getElementById('mSave').addEventListener('click', async () => {
          const body = {
            regNo:           document.getElementById('mRegNo').value.trim(),
            name:            document.getElementById('mName').value.trim(),
            type:            document.getElementById('mType').value,
            status:          document.getElementById('mStatus').value,
            maxLoad:         Number(document.getElementById('mMaxLoad').value),
            odometer:        Number(document.getElementById('mOdometer').value),
            acquisitionCost: Number(document.getElementById('mCost').value),
            region:          document.getElementById('mRegion').value.trim(),
          };
          const err = document.getElementById('mErr');
          if (!body.regNo || !body.name || !body.region || !body.maxLoad) { err.textContent = 'Please fill in all required fields.'; return; }
          try {
            if (existing) { await API.updateVehicle(id, body); toast('Vehicle updated'); }
            else          { await API.createVehicle(body);     toast('Vehicle registered'); }
            closeModal(); onSaved();
          } catch (e) {
            err.textContent = e.message;
          }
        });
      }
    });
  }).catch(e => toast(e.message, 'error'));
}

function openConfirm(message, onConfirm) {
  openModal({
    title: 'Please confirm',
    bodyHtml: `<p style="color:var(--text-dim); font-size:13.5px;">${message}</p>`,
    footerHtml: `
      <button class="btn btn-ghost" id="cCancel">Cancel</button>
      <button class="btn btn-danger" id="cOk">Confirm</button>`,
    onMount: () => {
      document.getElementById('cCancel').addEventListener('click', closeModal);
      document.getElementById('cOk').addEventListener('click', () => { closeModal(); onConfirm(); });
    }
  });
}
