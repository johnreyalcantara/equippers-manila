(function () {
  if (!API.requireAuth()) return;

  const user = API.getUser();
  document.getElementById('userName').textContent = user.name || user.username;

  // Load attendance streak
  async function loadStreak() {
    try {
      const data = await API.get('/attendance/streak');
      document.getElementById('totalAttended').textContent = data.total;
      document.getElementById('streak').textContent = data.streak;
    } catch (e) { console.error(e); }
  }

  // Load daily verse
  async function loadVerse() {
    try {
      const data = await API.get('/verses/today');
      document.getElementById('verseText').textContent = '"' + data.verse + '"';
      document.getElementById('verseRef').textContent = '— ' + data.reference;
    } catch (e) { console.error(e); }
  }

  // Load upcoming services with action buttons
  async function loadServices() {
    try {
      const services = await API.get('/services/upcoming');
      const streak = await API.get('/attendance/streak');
      const reservations = await API.get('/reservations/mine');

      // Build lookup maps from upcoming attendance (includes type field)
      const attendingMap = {};
      streak.upcoming.forEach(a => { attendingMap[a.service_id] = a.type || 'REGULAR'; });
      const reservedIds = new Set(reservations.map(r => r.service_id));
      const container = document.getElementById('servicesList');

      if (services.length === 0) {
        container.innerHTML = '<p style="color:var(--gray-400)">No upcoming services.</p>';
        return;
      }

      container.innerHTML = services.map(s => {
        const date = new Date(s.service_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const isAttending = s.id in attendingMap;
        const isVIP = attendingMap[s.id] === 'VIP';
        const isReserved = reservedIds.has(s.id);

        return `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:1rem 0; border-bottom:1px solid var(--gray-200);">
            <div>
              <strong>${s.title}</strong>
              ${isVIP ? '<span class="badge badge-warning" style="margin-left:0.5rem;">VIP</span>' : ''}
              <br>
              <span style="font-size:0.85rem; color:var(--gray-600)">${date} — ${s.service_time}</span>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
              ${isReserved
                ? `<button class="btn btn-outline btn-sm" onclick="cancelReservation(${s.id})">Cancel Seat</button>`
                : `<button class="btn btn-secondary btn-sm" onclick="reserveSeat(${s.id})">Reserve Seat</button>`
              }
              ${isVIP
                ? `<button class="btn btn-sm" style="background:var(--gold);color:#fff;cursor:default;">VIP ✓</button>`
                : `<button class="btn btn-sm" style="background:var(--gold);color:#fff;" onclick="markVIP(${s.id})">VIP</button>`
              }
              ${isAttending
                ? `<button class="btn btn-danger btn-sm" onclick="cancelAttendance(${s.id})">Cancel</button>
                   <span class="badge badge-success">Attending</span>`
                : `<button class="btn btn-primary btn-sm" onclick="markAttending(${s.id})">Attend</button>`
              }
            </div>
          </div>`;
      }).join('');
    } catch (e) { console.error(e); }
  }

  // Actions
  window.reserveSeat = async function (id) {
    try { await API.post('/reservations', { service_id: id }); loadServices(); }
    catch (e) { alert(e.message); }
  };
  window.cancelReservation = async function (id) {
    try { await API.del('/reservations/' + id); loadServices(); }
    catch (e) { alert(e.message); }
  };
  window.markAttending = async function (id) {
    try { await API.post('/attendance', { service_id: id }); loadServices(); loadStreak(); }
    catch (e) { alert(e.message); }
  };
  window.markVIP = async function (id) {
    try { await API.post('/attendance/vip', { service_id: id }); loadServices(); loadStreak(); }
    catch (e) { alert(e.message); }
  };
  window.cancelAttendance = async function (id) {
    try { await API.del('/attendance/' + id); loadServices(); loadStreak(); }
    catch (e) { alert(e.message); }
  };

  loadStreak();
  loadVerse();
  loadServices();
})();
