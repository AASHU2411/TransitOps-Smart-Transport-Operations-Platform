/* ==========================================================================
   TransitOps — Auth page (index.html)
   ========================================================================== */
(function () {
  const theme = localStorage.getItem('transitops_theme') || 'dark';
  document.body.classList.toggle('theme-light', theme === 'light');

  // Already logged in → go to app
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path.endsWith('/transitops/')) {
    if (Auth.isLoggedIn()) { window.location.href = 'app.html'; return; }
  }

  const tabSignin  = document.getElementById('tabSignin');
  const tabSignup  = document.getElementById('tabSignup');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  if (!tabSignin) return;

  function showTab(tab) {
    const s = tab === 'signin';
    tabSignin.classList.toggle('active', s);
    tabSignup.classList.toggle('active', !s);
    signinForm.style.display = s ? 'block' : 'none';
    signupForm.style.display = s ? 'none' : 'block';
  }
  tabSignin.addEventListener('click', () => showTab('signin'));
  tabSignup.addEventListener('click', () => showTab('signup'));

  function setMsg(el, text, type) {
    el.textContent = text;
    el.className = 'lp-msg' + (type ? ' ' + type : '');
  }

  /* ---- SIGN IN ---- */
  const siMsg = document.getElementById('siMsg');
  document.getElementById('fillDemo').addEventListener('click', () => {
    document.getElementById('siEmail').value    = 'fleet@transitops.io';
    document.getElementById('siPassword').value = 'demo1234';
    setMsg(siMsg, '', '');
  });

  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('siEmail').value.trim().toLowerCase();
    const password = document.getElementById('siPassword').value;
    const btn      = document.getElementById('siSubmitBtn');
    btn.disabled   = true;
    setMsg(siMsg, 'Signing in…', '');
    try {
      const res = await API.login({ email, password });
      Auth.setToken(res.accessToken);
      Auth.setUser(res.user);
      setMsg(siMsg, 'Signed in — redirecting…', 'success');
      setTimeout(() => { window.location.href = 'app.html'; }, 300);
    } catch (err) {
      setMsg(siMsg, err.message || 'Sign in failed.', 'error');
      btn.disabled = false;
    }
  });

  /* ---- SIGN UP ---- */
  const suMsg = document.getElementById('suMsg');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name     = document.getElementById('suName').value.trim();
    const email    = document.getElementById('suEmail').value.trim().toLowerCase();
    const role     = document.getElementById('suRole').value;
    const password = document.getElementById('suPassword').value;
    const pass2    = document.getElementById('suPassword2').value;
    const btn      = document.getElementById('suSubmitBtn');

    if (name.length < 2)                        { setMsg(suMsg, 'Please enter your full name.', 'error'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email))          { setMsg(suMsg, 'Please enter a valid email address.', 'error'); return; }
    if (password.length < 8)                    { setMsg(suMsg, 'Password must be at least 8 characters.', 'error'); return; }
    if (password !== pass2)                     { setMsg(suMsg, 'Passwords do not match.', 'error'); return; }

    btn.disabled = true;
    setMsg(suMsg, 'Creating account…', '');
    try {
      const res = await API.signup({ name, email, password, role });
      Auth.setToken(res.accessToken);
      Auth.setUser(res.user);
      setMsg(suMsg, 'Account created — redirecting…', 'success');
      setTimeout(() => { window.location.href = 'app.html'; }, 400);
    } catch (err) {
      setMsg(suMsg, err.message || 'Sign up failed.', 'error');
      btn.disabled = false;
    }
  });
})();
