(function () {
  if (!API.requireAuth()) return;

  async function loadServices() {
    try {
      const services = await API.get('/services/upcoming');
      const sel = document.getElementById('serviceSelect');
      sel.innerHTML = services.length === 0
        ? '<option value="">No upcoming services</option>'
        : services.map(s => {
            const d = new Date(s.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `<option value="${s.id}">${d} — ${s.service_time}</option>`;
          }).join('');
    } catch (e) { console.error(e); }
  }

  window.requestPhoto = async function () {
    const id = document.getElementById('serviceSelect').value;
    if (!id) return;
    try {
      const res = await API.post('/photos/request', { service_id: parseInt(id) });
      document.getElementById('requestAlert').innerHTML = '<div class="alert alert-success">' + res.message + '</div>';
      loadRequests();
    } catch (err) {
      document.getElementById('requestAlert').innerHTML = '<div class="alert alert-error">' + err.message + '</div>';
    }
  };

  async function loadRequests() {
    try {
      const rows = await API.get('/photos/requests');
      const el = document.getElementById('myRequests');
      if (rows.length === 0) { el.innerHTML = '<p style="color:var(--gray-400)">No requests.</p>'; return; }
      el.innerHTML = rows.map(r => {
        const d = new Date(r.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const badge = r.status === 'COMPLETED' ? '<span class="badge badge-success">Completed</span>' : '<span class="badge badge-warning">Pending</span>';
        return `<div style="padding:0.5rem 0; border-bottom:1px solid var(--gray-200); display:flex; justify-content:space-between; align-items:center;">
          <span>${d} — ${r.service_time}</span>${badge}</div>`;
      }).join('');
    } catch (e) { console.error(e); }
  }

  async function loadAlbum() {
    try {
      const rows = await API.get('/photos/album');
      const el = document.getElementById('albumGrid');
      if (rows.length === 0) { el.innerHTML = '<p style="color:var(--gray-400)">No photos yet.</p>'; return; }
      el.innerHTML = rows.map(p => `
        <div style="border-radius:12px; overflow:hidden; border:1px solid var(--gray-200);">
          <img src="${p.file_path}" style="width:100%; height:180px; object-fit:cover;" alt="Photo">
          <div style="padding:0.5rem; font-size:0.8rem; color:var(--gray-600);">${new Date(p.service_date).toLocaleDateString()}</div>
        </div>`).join('');
    } catch (e) { console.error(e); }
  }

  loadServices();
  loadRequests();
  loadAlbum();
})();
