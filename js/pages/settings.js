/* ==========================================================================
   TransitOps — Settings & RBAC
   ========================================================================== */
function renderSettings(root, user) {
  root.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Settings &amp; RBAC</h2>
        <p>Manage team access and appearance preferences.</p>
      </div>
    </div>
    <div class="grid-2">
      <div class="panel">
        <div class="panel-header"><h3>Appearance</h3></div>
        <div class="panel-body">
          <div class="flex-between">
            <div>
              <div style="font-weight:600; font-size:13.5px; margin-bottom:3px;">Theme</div>
              <div class="text-faint" style="font-size:12px;">Switch between dark and light interface.</div>
            </div>
            <button class="btn btn-secondary btn-sm" id="themeToggleBtn"></button>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><h3>Your account</h3></div>
        <div class="panel-body">
          <div class="stat-line"><span class="text-dim">Name</span><strong>${user.name}</strong></div>
          <div class="stat-line"><span class="text-dim">Email</span><strong>${user.email}</strong></div>
          <div class="stat-line"><span class="text-dim">Role</span><strong>${ROLES[user.role]?.label || user.role}</strong></div>
        </div>
      </div>
    </div>
    <div class="panel mt-16">
      <div class="panel-header"><h3>Permission matrix</h3></div>
      <div class="table-wrap"><table id="permTable"></table></div>
    </div>
    <div class="panel mt-16">
      <div class="panel-header">
        <h3>Team members</h3>
        <button class="btn btn-primary btn-sm" id="addUserBtn">${ICONS.plus} Invite member</button>
      </div>
      <div class="table-wrap"><table id="userTable"><tr><td class="text-faint" style="padding:20px">Loading…</td></tr></table></div>
    </div>
  `;

  // Theme toggle
  function paintThemeBtn() {
    const light = document.body.classList.contains('theme-light');
    document.getElementById('themeToggleBtn').textContent = light ? '☀️  Light mode' : '🌙  Dark mode';
  }
  paintThemeBtn();
  document.getElementById('themeToggleBtn').addEventListener('click', () => { toggleTheme(); paintThemeBtn(); });

  // Permission matrix
  document.getElementById('permTable').innerHTML = `
    <thead><tr><th>Module</th>${Object.keys(ROLES).map(r=>`<th>${ROLES[r].label}</th>`).join('')}</tr></thead>
    <tbody>
      ${NAV_ITEMS.map(item => `
        <tr>
          <td>${item.label}</td>
          ${Object.keys(ROLES).map(r => `<td>${item.roles.includes(r) ? `<span class="badge badge-green">Access</span>` : `<span class="badge badge-gray">—</span>`}</td>`).join('')}
        </tr>`).join('')}
    </tbody>`;

  async function paintUsers() {
    const table = document.getElementById('userTable');
    try {
      const res   = await API.users({ limit: 200 });
      const users = res.data || [];
      table.innerHTML = `
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${u.name}</td>
              <td class="text-dim">${u.email}</td>
              <td>
                <select class="roleSelect" data-id="${u.id}" ${u.id === user.id ? 'disabled' : ''}>
                  ${Object.keys(ROLES).map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${ROLES[r].label}</option>`).join('')}
                </select>
              </td>
              <td class="row-actions">
                ${u.id !== user.id
                  ? `<button class="icon-btn btn-sm delUser" data-id="${u.id}">${ICONS.trash}</button>`
                  : `<span class="badge badge-blue">You</span>`}
              </td>
            </tr>`).join('')}
        </tbody>`;

      table.querySelectorAll('.roleSelect').forEach(sel => sel.addEventListener('change', async () => {
        try { await API.updateRole(sel.dataset.id, sel.value); toast('Role updated'); }
        catch (e) { toast(e.message, 'error'); paintUsers(); }
      }));
      table.querySelectorAll('.delUser').forEach(b => b.addEventListener('click', () => {
        openConfirm('Remove this team member? They will lose access immediately.', async () => {
          try { await API.deleteUser(b.dataset.id); toast('Member removed'); paintUsers(); }
          catch (e) { toast(e.message, 'error'); }
        });
      }));
    } catch (e) {
      table.innerHTML = `<tr><td class="text-faint">${e.message}</td></tr>`;
    }
  }
  paintUsers();

  document.getElementById('addUserBtn').addEventListener('click', () => {
    openModal({
      title: 'Invite team member',
      bodyHtml: `
        <div class="form-grid">
          <label class="field field-full"><span>Full name</span><input id="uName" placeholder="Jordan Lee"></label>
          <label class="field field-full"><span>Email</span><input id="uEmail" placeholder="jordan@fleetco.com"></label>
          <label class="field"><span>Role</span>
            <select id="uRole">${Object.keys(ROLES).map(r=>`<option value="${r}">${ROLES[r].label}</option>`).join('')}</select>
          </label>
          <label class="field"><span>Password</span><input id="uPass" type="password" placeholder="min 8 characters"></label>
        </div>
        <div class="form-msg error" id="uErr"></div>`,
      footerHtml: `<button class="btn btn-ghost" id="uCancel">Cancel</button><button class="btn btn-primary" id="uSave">Create account</button>`,
      onMount: () => {
        document.getElementById('uCancel').addEventListener('click', closeModal);
        document.getElementById('uSave').addEventListener('click', async () => {
          const name     = document.getElementById('uName').value.trim();
          const email    = document.getElementById('uEmail').value.trim().toLowerCase();
          const role     = document.getElementById('uRole').value;
          const password = document.getElementById('uPass').value;
          const err      = document.getElementById('uErr');
          if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
            err.textContent = 'Please fill in all fields with a valid email and password (min 8 chars).'; return;
          }
          try {
            await API.signup({ name, email, password, role });
            toast('Team member account created');
            closeModal(); paintUsers();
          } catch (e) { err.textContent = e.message; }
        });
      }
    });
  });
}
