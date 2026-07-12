/* ==========================================================================
   TransitOps — Auth (sign in / sign up) — used on index.html
   ========================================================================== */
(function(){
  const theme = localStorage.getItem('transitops_theme') || 'dark';
  document.body.classList.toggle('theme-light', theme === 'light');

  // If a session already exists, jump straight to the app.
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/transitops/')) {
    const existing = DataStore.currentUser();
    if (existing) { window.location.href = 'app.html'; return; }
  }

  const tabSignin = document.getElementById('tabSignin');
  const tabSignup = document.getElementById('tabSignup');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');

  if (!tabSignin) return; // not on auth page

  function showTab(tab){
    const isSignin = tab === 'signin';
    tabSignin.classList.toggle('active', isSignin);
    tabSignup.classList.toggle('active', !isSignin);
    signinForm.classList.toggle('hidden', !isSignin);
    signupForm.classList.toggle('hidden', isSignin);
  }
  tabSignin.addEventListener('click', () => showTab('signin'));
  tabSignup.addEventListener('click', () => showTab('signup'));

  function setMsg(el, text, type){
    el.textContent = text;
    el.className = 'form-msg' + (type ? ' ' + type : '');
  }

  // ---- SIGN IN ----
  const siMsg = document.getElementById('siMsg');
  document.getElementById('fillDemo').addEventListener('click', () => {
    document.getElementById('siEmail').value = 'fleet@transitops.io';
    document.getElementById('siPassword').value = 'demo1234';
    setMsg(siMsg, '', '');
  });

  signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('siEmail').value.trim().toLowerCase();
    const pass = document.getElementById('siPassword').value;
    const user = DataStore.all('users').find(u => u.email.toLowerCase() === email);

    if (!user) { setMsg(siMsg, 'No account found for this email.', 'error'); return; }
    if (user.password !== pass) { setMsg(siMsg, 'Incorrect password. Please try again.', 'error'); return; }

    DataStore.setSession(user.id);
    setMsg(siMsg, 'Signed in — redirecting…', 'success');
    setTimeout(() => { window.location.href = 'app.html'; }, 300);
  });

  // ---- SIGN UP ----
  const suMsg = document.getElementById('suMsg');
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('suName').value.trim();
    const email = document.getElementById('suEmail').value.trim().toLowerCase();
    const role = document.getElementById('suRole').value;
    const pass = document.getElementById('suPassword').value;
    const pass2 = document.getElementById('suPassword2').value;

    if (name.length < 2) { setMsg(suMsg, 'Please enter your full name.', 'error'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setMsg(suMsg, 'Please enter a valid email address.', 'error'); return; }
    if (pass.length < 8) { setMsg(suMsg, 'Password must be at least 8 characters.', 'error'); return; }
    if (pass !== pass2) { setMsg(suMsg, 'Passwords do not match.', 'error'); return; }
    if (DataStore.all('users').some(u => u.email.toLowerCase() === email)) {
      setMsg(suMsg, 'An account with this email already exists.', 'error'); return;
    }

    const user = DataStore.insert('users', { name, email, password: pass, role });
    DataStore.setSession(user.id);
    setMsg(suMsg, 'Account created — redirecting…', 'success');
    setTimeout(() => { window.location.href = 'app.html'; }, 400);
  });
})();
