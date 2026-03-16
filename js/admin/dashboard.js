(function () {
  if (!API.requireAuth() || !API.requireAdmin()) return;

  // Load stats
  async function loadStats() {
    try {
      const s = await API.get('/admin/stats');
      document.getElementById('statUsers').textContent = s.totalUsers;
      document.getElementById('statAttendees').textContent = s.totalAttendees;
      document.getElementById('statDonations').textContent = parseFloat(s.totalDonations).toLocaleString();
      document.getElementById('statTeams').textContent = s.totalTeams || 0;
      document.getElementById('statHubs').textContent = s.totalHubs || 0;
      document.getElementById('statGroups').textContent = s.totalGroups || 0;
      document.getElementById('statJoinReqs').textContent = s.totalJoinRequests || 0;
    } catch (e) { console.error(e); }
  }

  // Load services list table
  async function loadServices() {
    try {
      const rows = await API.get('/admin/services-list');
      const el = document.getElementById('servicesList');

      if (rows.length === 0) {
        el.innerHTML = '<p style="color:var(--gray-400)">No services created yet.</p>';
        return;
      }

      let html = '<table class="data-table"><thead><tr>';
      html += '<th>ID</th><th>Title</th><th>Date</th><th>Time</th><th>Max Seats</th><th>Attendees</th><th>VIP</th><th>Reservations</th>';
      html += '</tr></thead><tbody>';

      rows.forEach(s => {
        const date = new Date(s.service_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        html += `<tr>
          <td>${s.id}</td>
          <td>${s.title}</td>
          <td>${date}</td>
          <td>${s.service_time}</td>
          <td>${s.max_seats}</td>
          <td>${s.attendee_count}</td>
          <td><span class="badge badge-warning">${s.vip_count}</span></td>
          <td>${s.reservation_count}</td>
        </tr>`;
      });

      html += '</tbody></table>';
      el.innerHTML = html;
    } catch (e) { console.error(e); }
  }

  // Load charts
  async function loadCharts() {
    try {
      const data = await API.get('/admin/charts');

      // Attendance chart
      new Chart(document.getElementById('attChart'), {
        type: 'bar',
        data: {
          labels: data.attendance.map(r => r.service_date.split('T')[0] + ' ' + r.service_time),
          datasets: [{ label: 'Attendees', data: data.attendance.map(r => r.count), backgroundColor: '#e86a2a' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });

      // VIP (new attendees) chart
      new Chart(document.getElementById('vipChart'), {
        type: 'bar',
        data: {
          labels: data.vip.map(r => r.service_date.split('T')[0] + ' ' + r.service_time),
          datasets: [{ label: 'VIP (New Attendees)', data: data.vip.map(r => r.count), backgroundColor: '#c9a84c' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });

      // Donation trend
      new Chart(document.getElementById('donChart'), {
        type: 'line',
        data: {
          labels: data.donations.map(r => 'Week ' + String(r.week).slice(-2)),
          datasets: [{ label: 'Donations (PHP)', data: data.donations.map(r => r.total), borderColor: '#c9a84c', backgroundColor: 'rgba(201,168,76,0.1)', fill: true, tension: 0.3 }]
        },
        options: { responsive: true }
      });
    } catch (e) { console.error(e); }
  }

  // Create service form — refreshes list after creation
  document.getElementById('createServiceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.max_seats = parseInt(data.max_seats);
    try {
      const res = await API.post('/admin/services', data);
      document.getElementById('serviceAlert').innerHTML = '<div class="alert alert-success">' + res.message + '</div>';
      e.target.reset();
      loadServices(); // Refresh the services table
    } catch (err) {
      document.getElementById('serviceAlert').innerHTML = '<div class="alert alert-error">' + err.message + '</div>';
    }
  });

  loadStats();
  loadServices();
  loadCharts();
})();
