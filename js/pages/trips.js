/* ==========================================================================
   TransitOps — Trip Dispatcher
   ========================================================================== */
function renderTrips(root, user) {
  root.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Trip Dispatcher</h2>
        <p>Create, dispatch, and close out trips across the fleet.</p>
      </div>
      <button class="btn btn-primary" id="newTripBtn">${ICONS.plus} New trip</button>
    </div>
    <div class="toolbar">
      <select id="tripStatusFilter">
        <option value="">All statuses</option>
        <option>Draft</option><option>Dispatched</option><option>Completed</option><option>Cancelled</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-secondary btn-sm" id="exportTripBtn">${ICONS.download} Export CSV</button>
    </div>
    <div class="panel"><div class="table-wrap"><table id="tripTable"></table></div></div>
  `;

  async function paint() {
    const status = document.getElementById('tripStatusFilter').value;
    const params = { limit: 200 };
    if (status) params.status = status;

    const table = document.getElementById('tripTable');
    table.innerHTML = '<tr><td colspan="7" class="text-faint" style="padding:20px">Loading…</td></tr>';
    try {
      const res  = await API.trips(params);
      const list = res.data || [];

      table.innerHTML = `
        <thead><tr>
          <th>Route</th><th>Vehicle</th><th>Driver</th><th>Cargo</th><th>Distance</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          ${list.length ? list.map(t => `
            <tr>
              <td>${t.source} → ${t.destination}</td>
              <td class="mono">${t.vehicle?.regNo || '—'}</td>
              <td class="text-dim">${t.driver?.name || '—'}</td>
              <td class="mono">${fmtNum(t.cargoWeight, 0)} kg</td>
              <td class="mono">${fmtNum(t.plannedDistance, 0)} km</td>
              <td>${statusBadge(t.status)}</td>
              <td class="row-actions">
                ${t.status === 'Draft'      ? `<button class="btn btn-sm btn-secondary dispatchT" data-id="${t.id}">${ICONS.play} Dispatch</button>` : ''}
                ${t.status === 'Dispatched' ? `<button class="btn btn-sm btn-secondary completeT" data-id="${t.id}" data-odo="${t.vehicle?.odometer||0}" data-dist="${t.plannedDistance}" data-route="${t.source} → ${t.destination}">${ICONS.check} Complete</button>` : ''}
                ${(t.status === 'Draft' || t.status === 'Dispatched') ? `<button class="icon-btn btn-sm cancelT" data-id="${t.id}" title="Cancel">${ICONS.close}</button>` : ''}
              </td>
            </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state">${ICONS.trips}<p>No trips yet — create one to get started.</p></div></td></tr>`}
        </tbody>`;

      table.querySelectorAll('.dispatchT').forEach(b => b.addEventListener('click', async () => {
        b.disabled = true;
        try { await API.dispatchTrip(b.dataset.id); toast('Trip dispatched'); paint(); }
        catch (e) { toast(e.message, 'error'); b.disabled = false; }
      }));
      table.querySelectorAll('.completeT').forEach(b => b.addEventListener('click', () =>
        openCompleteModal(b.dataset.id, Number(b.dataset.odo), Number(b.dataset.dist), b.dataset.route, paint)
      ));
      table.querySelectorAll('.cancelT').forEach(b => b.addEventListener('click', () =>
        openConfirm('Cancel this trip? Vehicle and driver will be freed up.', async () => {
          try { await API.cancelTrip(b.dataset.id); toast('Trip cancelled'); paint(); }
          catch (e) { toast(e.message, 'error'); }
        })
      ));
    } catch (e) {
      table.innerHTML = `<tr><td colspan="7" class="text-faint">${e.message}</td></tr>`;
    }
  }

  document.getElementById('tripStatusFilter').addEventListener('change', paint);
  document.getElementById('exportTripBtn').addEventListener('click', async () => {
    try {
      const res = await API.trips({ limit: 1000 });
      exportCSV('trips.csv', (res.data || []).map(t => ({
        source: t.source, destination: t.destination,
        vehicle: t.vehicle?.regNo, driver: t.driver?.name,
        cargoWeight: t.cargoWeight, plannedDistance: t.plannedDistance,
        status: t.status, fuelConsumed: t.fuelConsumed, finalOdometer: t.finalOdometer,
      })));
    } catch (e) { toast(e.message, 'error'); }
  });
  document.getElementById('newTripBtn').addEventListener('click', () => openTripModal(paint));

  paint();
}

async function openTripModal(onSaved) {
  let vehicles = [], drivers = [];
  try {
    const [vRes, dRes] = await Promise.all([
      API.vehicles({ status: 'Available', limit: 200 }),
      API.drivers({ status: 'Available', limit: 200 }),
    ]);
    vehicles = (vRes.data || []);
    // Filter out drivers with expired licenses
    const today = new Date();
    drivers = (dRes.data || []).filter(d => new Date(d.licenseExpiry) >= today);
  } catch (e) { toast(e.message, 'error'); return; }

  openModal({
    title: 'Create trip',
    bodyHtml: `
      ${(!vehicles.length || !drivers.length) ? `<div class="alert alert-warn">${!vehicles.length ? 'No vehicles are currently available. ' : ''}${!drivers.length ? 'No compliant drivers are currently available.' : ''}</div>` : ''}
      <div class="form-grid">
        <label class="field"><span>Source</span><input id="tSource" placeholder="Jaipur Hub"></label>
        <label class="field"><span>Destination</span><input id="tDest" placeholder="Alwar DC"></label>
        <label class="field"><span>Vehicle</span>
          <select id="tVehicle">
            <option value="">Select available vehicle</option>
            ${vehicles.map(v=>`<option value="${v.id}" data-max="${v.maxLoad}">${v.regNo} — ${v.name} (max ${v.maxLoad}kg)</option>`).join('')}
          </select>
        </label>
        <label class="field"><span>Driver</span>
          <select id="tDriver">
            <option value="">Select available driver</option>
            ${drivers.map(d=>`<option value="${d.id}">${d.name} — ${d.licenseCategory}</option>`).join('')}
          </select>
        </label>
        <label class="field"><span>Cargo weight (kg)</span><input id="tCargo" type="number" min="0" placeholder="450"></label>
        <label class="field"><span>Planned distance (km)</span><input id="tDist" type="number" min="0" placeholder="150"></label>
      </div>
      <div class="form-msg error" id="tErr"></div>`,
    footerHtml: `
      <button class="btn btn-ghost" id="tCancelBtn">Cancel</button>
      <button class="btn btn-primary" id="tSaveDraft">Save as draft</button>`,
    onMount: () => {
      document.getElementById('tCancelBtn').addEventListener('click', closeModal);
      document.getElementById('tSaveDraft').addEventListener('click', async () => {
        const source          = document.getElementById('tSource').value.trim();
        const destination     = document.getElementById('tDest').value.trim();
        const vehicleId       = document.getElementById('tVehicle').value;
        const driverId        = document.getElementById('tDriver').value;
        const cargoWeight     = Number(document.getElementById('tCargo').value);
        const plannedDistance = Number(document.getElementById('tDist').value);
        const err             = document.getElementById('tErr');

        if (!source || !destination || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
          err.textContent = 'Please fill in all fields.'; return;
        }
        const selOpt = document.querySelector('#tVehicle option:checked');
        const maxLoad = Number(selOpt?.dataset.max || 0);
        if (maxLoad && cargoWeight > maxLoad) {
          err.textContent = `Cargo weight (${cargoWeight}kg) exceeds this vehicle's max load (${maxLoad}kg).`; return;
        }
        try {
          await API.createTrip({ source, destination, vehicleId, driverId, cargoWeight, plannedDistance });
          toast('Trip saved as draft');
          closeModal(); onSaved();
        } catch (e) { err.textContent = e.message; }
      });
    }
  });
}

function openCompleteModal(tripId, currentOdo, plannedDist, route, onSaved) {
  openModal({
    title: 'Complete trip',
    bodyHtml: `
      <p class="text-dim" style="font-size:13px; margin-bottom:16px;">${route}</p>
      <div class="form-grid">
        <label class="field"><span>Final odometer (km)</span><input id="cOdo" type="number" min="${currentOdo}" value="${currentOdo + plannedDist}"></label>
        <label class="field"><span>Fuel consumed (L)</span><input id="cFuel" type="number" min="0" placeholder="22"></label>
      </div>
      <div class="form-msg error" id="cErr"></div>`,
    footerHtml: `
      <button class="btn btn-ghost" id="cCancelBtn">Cancel</button>
      <button class="btn btn-primary" id="cSaveBtn">Complete trip</button>`,
    onMount: () => {
      document.getElementById('cCancelBtn').addEventListener('click', closeModal);
      document.getElementById('cSaveBtn').addEventListener('click', async () => {
        const finalOdometer = Number(document.getElementById('cOdo').value);
        const fuelConsumed  = Number(document.getElementById('cFuel').value);
        const err           = document.getElementById('cErr');
        if (!finalOdometer || !fuelConsumed) { err.textContent = 'Please enter both final odometer and fuel consumed.'; return; }
        try {
          await API.completeTrip(tripId, { finalOdometer, fuelConsumed });
          toast('Trip completed');
          closeModal(); onSaved();
        } catch (e) { err.textContent = e.message; }
      });
    }
  });
}
