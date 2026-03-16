(function () {
  if (!API.requireAuth() || !API.requireAdmin()) return;

  // Populate user dropdown from database
  async function loadUserDropdown() {
    try {
      const users = await API.get('/admin/users-list');
      const sel = document.getElementById('userSelect');
      sel.innerHTML = '<option value="">Select a user</option>' +
        users.map(u => `<option value="${u.id}">${u.name} (@${u.username})</option>`).join('');
    } catch (e) { console.error(e); }
  }

  // Populate service dropdown from database
  async function loadServiceDropdown() {
    try {
      const services = await API.get('/admin/services-list');
      const sel = document.getElementById('serviceSelect');
      sel.innerHTML = '<option value="">Select a service</option>' +
        services.map(s => {
          const d = new Date(s.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          return `<option value="${s.id}">${d} — ${s.service_time} (${s.title})</option>`;
        }).join('');
    } catch (e) { console.error(e); }
  }

  // Upload form
  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const res = await API.upload('/admin/photos/upload', formData);
      document.getElementById('uploadAlert').innerHTML = '<div class="alert alert-success">' + res.message + '</div>';
      e.target.reset();
      loadRequests();
    } catch (err) {
      document.getElementById('uploadAlert').innerHTML = '<div class="alert alert-error">' + err.message + '</div>';
    }
  });

  // Load photo requests table
  async function loadRequests() {
    try {
      const rows = await API.get('/admin/photo-requests');
      const el = document.getElementById('requestsTable');
      if (rows.length === 0) { el.innerHTML = '<p style="color:var(--gray-400)">No requests.</p>'; return; }

      let html = '<table class="data-table"><thead><tr><th>User</th><th>Service Date</th><th>Time</th><th>Status</th><th>Requested</th></tr></thead><tbody>';
      rows.forEach(r => {
        const badge = r.status === 'COMPLETED' ? '<span class="badge badge-success">Completed</span>' : '<span class="badge badge-warning">Pending</span>';
        html += `<tr>
          <td>${r.name} (@${r.username})</td>
          <td>${new Date(r.service_date).toLocaleDateString()}</td>
          <td>${r.service_time}</td>
          <td>${badge}</td>
          <td>${new Date(r.requested_at).toLocaleString()}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      el.innerHTML = html;
    } catch (e) { console.error(e); }
  }

  loadUserDropdown();
  loadServiceDropdown();
  loadRequests();
})();
