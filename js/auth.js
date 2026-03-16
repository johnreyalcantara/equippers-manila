// Auth page logic — handles login and signup forms

(function () {
  const alert = document.getElementById('alert');

  function showAlert(msg, type) {
    alert.textContent = msg;
    alert.className = 'auth-alert ' + type;
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(loginForm));
      try {
        const res = await API.post('/auth/login', data);
        API.setAuth(res.token, res.user);
        // Redirect based on role
        if (res.user.role === 'ADMIN') {
          window.location.href = '/pages/admin/dashboard.html';
        } else {
          window.location.href = '/pages/dashboard.html';
        }
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });
  }

  // Signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(signupForm));
      data.age = parseInt(data.age);
      try {
        await API.post('/auth/signup', data);
        showAlert('Account created! Redirecting to login...', 'success');
        setTimeout(() => window.location.href = '/pages/login.html', 1500);
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });
  }
})();
