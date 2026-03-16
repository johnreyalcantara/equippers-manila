(function () {
  if (!API.requireAuth()) return;

  async function loadProfile() {
    try {
      const u = await API.get('/users/me');
      document.getElementById('sName').value = u.name;
      document.getElementById('sAge').value = u.age;
      document.getElementById('sEmail').value = u.email;
      document.getElementById('sUsername').value = u.username;
    } catch (e) { console.error(e); }
  }

  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.age = parseInt(data.age);
    if (!data.password) delete data.password;

    try {
      const res = await API.put('/users/me', data);
      document.getElementById('settingsAlert').innerHTML = '<div class="alert alert-success">' + res.message + '</div>';
      // Update stored user info
      const user = API.getUser();
      user.name = data.name;
      user.username = data.username;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      document.getElementById('settingsAlert').innerHTML = '<div class="alert alert-error">' + err.message + '</div>';
    }
  });

  loadProfile();
})();
