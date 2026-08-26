(function () {
  const sb = window.getSupabase();
  window.BO = window.BO || {};
  BO.sb = sb;
  BO.money = n => (n == null ? '0' : Number(n).toFixed(2).replace('.00', '')) + ' €';
  BO.dfmt = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  BO.initAuth = function (onLoggedIn) {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    function showApp() {
      loginScreen.style.display = 'none';
      dashboard.style.display = 'flex';
      onLoggedIn();
    }
    function showLogin() {
      loginScreen.style.display = 'flex';
      dashboard.style.display = 'none';
    }

    sb.auth.getSession().then(({ data }) => {
      if (data.session) showApp(); else showLogin();
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.style.display = 'none';
      loginBtn.disabled = true;
      loginBtn.textContent = 'Connexion...';
      const username = document.getElementById('login-username').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value;
      const email = username.includes('@') ? username : username + '@tr-reflexologie.local';
      const { error } = await sb.auth.signInWithPassword({ email, password });
      loginBtn.disabled = false;
      loginBtn.textContent = 'Se connecter';
      if (error) {
        loginError.textContent = 'Identifiant ou mot de passe incorrect.';
        loginError.style.display = 'block';
        return;
      }
      showApp();
    });

    logoutBtn.addEventListener('click', async () => {
      await sb.auth.signOut();
      showLogin();
    });
  };

  BO.initNav = function (activeKey) {
    document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', b.dataset.tab === activeKey));
  };
})();
